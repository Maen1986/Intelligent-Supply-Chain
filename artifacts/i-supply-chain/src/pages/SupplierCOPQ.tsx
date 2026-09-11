/**
 * Supplier Cost of Poor Quality (COPQ) -- Supplier Lifecycle Governance
 * build, Item 1 of 7 (11 Sep 2026).
 *
 * Two-tier, client-selectable (design doc section 2.8, client-confirmed):
 *   - Advisory (default): every number on this screen comes from a live call
 *     to @/lib/supplierCOPQ's computeCOPQRollup()/detectCOPQAlert() against
 *     the CARs + linked BusinessImpact figures below. Nothing is persisted.
 *   - Operational (opt-in): the same computation, PLUS a "Save to ledger"
 *     action that POSTs to /api/copq/ledger (append-only -- see
 *     copqLedger.ts's schema header for why) and a trend history panel that
 *     reads it back. In this preview/demo environment there is no live
 *     database session, so the trend panel falls back to an explicitly
 *     labeled DEMO_LEDGER_HISTORY constant when the real endpoint isn't
 *     reachable -- same disclosed-mock convention SupplierRecoveryPortfolio.
 *     tsx already uses for its SAR exposure KPI, never silently substituted.
 *
 * Visual primitive: a waterfall for the PAF cost breakdown (isc-ai-output-
 * standards, principle 12 -- "Waterfall: financial breakdowns"), a trend
 * line for ledger history over time (principle 12 -- "Timeline: investigation
 * / decision history"), and a confidence/source badge on every dollar figure
 * (principle 6) so a caller-supplied rate is never visually indistinguishable
 * from a derived-from-real-data figure.
 *
 * Bilingual EN/AR from the start (Rule 5), following this app's own isAr-
 * ternary convention (see SupplierRecoveryPortfolio.tsx).
 */
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend,
} from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type CARRecord,
  type CARBusinessImpact,
  type CARCustomerImpactOverride,
  type COPQRollup,
  computeCOPQRollup,
  detectCOPQAlert,
} from '@/lib/supplierCOPQ';

// ---------------------------------------------------------------------------
// DEMO DATA -- constructed, clearly-labeled test data (NOT production).
// Two periods (prior + current) so the alert-detection logic has something
// real to compare. Extends the Rawabi worked example's supplier/CAR set.
// ---------------------------------------------------------------------------

const PRIOR_CARS: CARRecord[] = [
  { id: 'CAR-101', supplierId: 'SUP-001', category: 'delivery', rootCause: 'late-shipment-root-A', status: 'closed', createdAt: '2026-04-05', closedAt: '2026-04-20' },
  { id: 'CAR-140', supplierId: 'SUP-002', category: 'quality', rootCause: 'coating-defect', status: 'closed', createdAt: '2026-05-15', closedAt: '2026-06-28' },
  { id: 'CAR-120', supplierId: 'SUP-005', category: 'compliance', rootCause: 'packaging-spec-drift', status: 'closed', createdAt: '2026-04-01', closedAt: '2026-05-15' },
];
const PRIOR_IMPACTS: CARBusinessImpact[] = [
  { carId: 'CAR-101', description: 'Expedited freight to cover the shipment gap', estimatedCostUSD: 4200, basis: 'observed' },
  { carId: 'CAR-140', description: 'Rework of coated panels prior to shipment', estimatedCostUSD: 6800, basis: 'observed' },
  // CAR-120 has no linked cost figure -- disclosed as such in the rollup, not guessed.
];
const PRIOR_OVERRIDES: CARCustomerImpactOverride[] = [];

const CURRENT_CARS: CARRecord[] = [
  { id: 'CAR-131', supplierId: 'SUP-001', category: 'delivery', rootCause: 'late-shipment-root-A', status: 'open', createdAt: '2026-08-01', closedAt: null },
  { id: 'CAR-158', supplierId: 'SUP-002', category: 'quality', rootCause: 'coating-defect', status: 'closed', createdAt: '2026-07-20', closedAt: '2026-08-30' },
  { id: 'CAR-171', supplierId: 'SUP-007', category: 'quality', rootCause: 'material-thickness-variance', status: 'closed', createdAt: '2026-07-25', closedAt: '2026-08-05' },
  { id: 'CAR-133', supplierId: 'SUP-008', category: 'delivery', rootCause: 'route-disruption', status: 'closed', createdAt: '2026-07-10', closedAt: '2026-08-28' },
];
const CURRENT_IMPACTS: CARBusinessImpact[] = [
  { carId: 'CAR-131', description: 'Air-freight expedite to cover a production-critical PO', estimatedCostUSD: 9100, basis: 'observed' },
  { carId: 'CAR-158', description: 'Warranty claim from end customer -- coating failed in field', estimatedCostUSD: 14500, basis: 'observed' },
  { carId: 'CAR-171', description: 'Scrap of out-of-spec material caught at incoming inspection', estimatedCostUSD: 3100, basis: 'calculated' },
  // CAR-133 has no linked cost figure yet.
];
// CAR-158's coating failure was found AFTER the panels reached the customer
// (a warranty claim) -- the one explicit, disclosed override in this demo
// set; every other CAR keeps the conservative Internal-Failure default.
const CURRENT_OVERRIDES: CARCustomerImpactOverride[] = [{ carId: 'CAR-158', customerImpact: 'external' }];

const DEMO_LEDGER_HISTORY_NOTE_EN = 'DEMO/SEED HISTORY, NOT REAL PERSISTED DATA -- no live database session in this preview. Shown only so the trend panel has something to render; a real Operational-tier client sees their own actual /api/copq/ledger history here instead.';
const DEMO_LEDGER_HISTORY_NOTE_AR = 'سجل تجريبي/أولي، وليس بيانات محفوظة حقيقية -- لا توجد جلسة قاعدة بيانات فعلية في هذه المعاينة. مُعروض فقط ليكون للوحة الاتجاه ما تعرضه؛ يرى عميل المستوى التشغيلي الحقيقي هنا سجل /api/copq/ledger الفعلي الخاص به بدلاً من ذلك.';

// ---------------------------------------------------------------------------

type Tier = 'advisory' | 'operational';

function fmtUSD(n: number | null, isAr: boolean): string {
  if (n === null) return isAr ? 'غير متاح' : 'N/A';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const val = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(2)}M` : abs >= 1_000 ? `${(abs / 1_000).toFixed(1)}K` : `${abs.toFixed(0)}`;
  return isAr ? `${sign}${val} $` : `${sign}$${val}`;
}

const BASIS_META: Record<string, { en: string; ar: string; color: string }> = {
  'derived-from-linked-business-impact': { en: 'Real -- linked CAR cost data', ar: 'حقيقي -- بيانات تكلفة مرتبطة بطلب إجراء تصحيحي', color: '#065f46' },
  'caller-supplied-rate': { en: 'Real -- caller-supplied rate', ar: 'حقيقي -- معدل محدَّد من العميل', color: '#065f46' },
  'caller-supplied': { en: 'Real -- caller-supplied figure', ar: 'حقيقي -- رقم محدَّد من العميل', color: '#065f46' },
  'effort-proxy-only': { en: 'Effort proxy, not a dollar figure', ar: 'مؤشر جهد، وليس رقمًا ماليًا', color: '#92400e' },
  'INSUFFICIENT_DATA': { en: 'Insufficient data -- disclosed gap', ar: 'بيانات غير كافية -- فجوة معلنة', color: '#7f1d1d' },
};

function ConfidenceBadge({ basis, isAr }: { basis: string; isAr: boolean }) {
  const meta = BASIS_META[basis] ?? { en: basis, ar: basis, color: '#374151' };
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: meta.color, borderColor: `${meta.color}55`, backgroundColor: `${meta.color}12` }}
    >
      {isAr ? meta.ar : meta.en}
    </span>
  );
}

export function SupplierCOPQ() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [tier, setTier] = useState<Tier>('advisory');
  const [perCarRate, setPerCarRate] = useState<number | undefined>(undefined);
  const [preventionSpend, setPreventionSpend] = useState<number | undefined>(undefined);
  const [ledgerHistory, setLedgerHistory] = useState<Array<{ periodLabel: string; data: COPQRollup; source: 'live' | 'demo' }>>([]);
  const [ledgerLoadState, setLedgerLoadState] = useState<'idle' | 'loading' | 'live' | 'demo-fallback'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unreachable'>('idle');
  const [showEmptyState, setShowEmptyState] = useState(false);

  const priorRollup = useMemo(
    () => computeCOPQRollup({
      periodLabel: '2026-Q2', asOfIso: '2026-06-30',
      cars: PRIOR_CARS, impacts: PRIOR_IMPACTS, overrides: PRIOR_OVERRIDES,
    }),
    []
  );
  const currentRollup = useMemo(
    () => computeCOPQRollup({
      periodLabel: '2026-Q3', asOfIso: '2026-09-10',
      cars: showEmptyState ? [] : CURRENT_CARS,
      impacts: showEmptyState ? [] : CURRENT_IMPACTS,
      overrides: showEmptyState ? [] : CURRENT_OVERRIDES,
      perCarCostRateUSD: perCarRate, preventionSpendUSD: preventionSpend,
    }),
    [perCarRate, preventionSpend, showEmptyState]
  );
  const alert = useMemo(() => detectCOPQAlert(currentRollup, priorRollup), [currentRollup, priorRollup]);

  // Operational tier: attempt the real endpoint; fall back to disclosed demo
  // history when there is no live backend session (this preview environment).
  useEffect(() => {
    if (tier !== 'operational') return;
    let cancelled = false;
    setLedgerLoadState('loading');
    fetch('/api/copq/ledger', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: { ok: boolean; entries: Array<{ periodLabel: string; data: COPQRollup }> }) => {
        if (cancelled) return;
        if (json.ok && json.entries.length > 0) {
          setLedgerHistory(json.entries.map((e) => ({ ...e, source: 'live' as const })));
          setLedgerLoadState('live');
        } else {
          throw new Error('empty');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLedgerHistory([
          { periodLabel: priorRollup.periodLabel, data: priorRollup, source: 'demo' },
          { periodLabel: currentRollup.periodLabel, data: currentRollup, source: 'demo' },
        ]);
        setLedgerLoadState('demo-fallback');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const waterfallData = useMemo(() => {
    const buckets = [
      { key: 'internal', label: isAr ? 'الفشل الداخلي' : 'Internal Failure', value: currentRollup.internalFailure.costUSD, color: '#92400e' },
      { key: 'external', label: isAr ? 'الفشل الخارجي' : 'External Failure', value: currentRollup.externalFailure.costUSD, color: '#7f1d1d' },
      { key: 'appraisal', label: isAr ? 'التقييم' : 'Appraisal', value: currentRollup.appraisal.costUSD, color: '#b45309' },
      { key: 'prevention', label: isAr ? 'الوقاية' : 'Prevention', value: currentRollup.prevention.costUSD, color: '#065f46' },
    ];
    let running = 0;
    const rows = buckets.map((b) => {
      const v = b.value ?? 0;
      const base = b.value !== null ? running : 0;
      if (b.value !== null) running += v;
      return { name: b.label, base, value: b.value !== null ? v : 0, hasData: b.value !== null, color: b.color };
    });
    rows.push({ name: isAr ? 'الإجمالي' : 'Total', base: 0, value: running, hasData: currentRollup.totalCostedUSD !== null, color: '#082C6B' });
    return rows;
  }, [currentRollup, isAr]);

  const trendChartData = ledgerHistory.map((e) => ({
    name: e.periodLabel,
    total: e.data.totalCostedUSD ?? 0,
    externalShare: e.data.internalFailure.carCount + e.data.externalFailure.carCount > 0
      ? Math.round((1000 * e.data.externalFailure.carCount) / (e.data.internalFailure.carCount + e.data.externalFailure.carCount)) / 10
      : 0,
  }));

  const t = {
    title: isAr ? 'تكلفة الجودة الرديئة لدى الموردين (COPQ)' : 'Supplier Cost of Poor Quality (COPQ)',
    subtitle: isAr
      ? 'حوكمة دورة حياة الموردين، البند 1 من 7 — نموذج الوقاية-التقييم-الفشل (PAF) على بيانات طلبات الإجراء التصحيحي الحالية'
      : 'Supplier Lifecycle Governance, Item 1 of 7 — the PAF model applied to existing CAR data',
    tierAdvisory: isAr ? 'المستوى الاستشاري' : 'Advisory Tier',
    tierOperational: isAr ? 'المستوى التشغيلي' : 'Operational Tier',
    tierAdvisoryDesc: isAr ? 'حساب فوري بلا تخزين — ينفّذ العميل الإجراء ضمن أنظمته الخاصة' : 'Computed live, no persistence — client acts in their own systems',
    tierOperationalDesc: isAr ? 'تحفظ ISC السجل والتنبيهات لتكون النظام المرجعي الرسمي لدى العميل' : 'ISC persists the ledger + alerts as the client\'s system of record',
    frameworkLabel: isAr ? 'المنهجية المعتمدة' : 'Sourced Methodology',
    waterfallTitle: isAr ? 'تحليل تكلفة الجودة الرديئة حسب فئات PAF' : 'COPQ Breakdown by PAF Category',
    perCarRateLabel: isAr ? 'معدل تكلفة التحقيق لكل طلب (دولار، اختياري)' : 'Per-CAR investigation rate ($, optional)',
    preventionLabel: isAr ? 'إنفاق الوقاية لهذه الفترة (دولار، اختياري)' : 'This period\'s Prevention spend ($, optional)',
    narrativeTitle: isAr ? 'القراءة الاستشارية' : 'Advisory Read',
    totalCosted: isAr ? 'الإجمالي المكلَّف' : 'Total Costed',
    excluded: isAr ? 'مستبعد من الإجمالي' : 'Excluded from total',
    saveToLedger: isAr ? 'حفظ في السجل (تشغيلي)' : 'Save to Ledger (Operational)',
    trendTitle: isAr ? 'اتجاه COPQ عبر الفترات' : 'COPQ Trend Across Periods',
    ledgerLive: isAr ? 'سجل حقيقي من الخادم' : 'Live server ledger',
    ledgerDemo: isAr ? 'سجل تجريبي (لا توجد جلسة خادم)' : 'Demo history (no server session)',
    emptyToggleOn: isAr ? 'عرض حالة عدم وجود نشاط CAR هذه الفترة (تجربة الحافة)' : 'Show zero-CAR-activity state (edge case)',
    emptyToggleOff: isAr ? 'عرض بيانات العرض التوضيحي' : 'Show demo data',
    classificationRuleTitle: isAr ? 'قاعدة التصنيف' : 'Classification Rule',
  };

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex rounded-lg border border-[#082C6B]/20 overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setTier('advisory')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'advisory' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}
            >
              {t.tierAdvisory}
            </button>
            <button
              type="button"
              onClick={() => setTier('operational')}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'operational' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}
            >
              {t.tierOperational}
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <p className="text-xs text-slate-500">{tier === 'advisory' ? t.tierAdvisoryDesc : t.tierOperationalDesc}</p>
          <button
            type="button"
            onClick={() => setShowEmptyState((v) => !v)}
            className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border border-[#082C6B]/20 text-[#082C6B] hover:bg-[#082C6B]/5 transition-colors self-start sm:self-auto"
          >
            {showEmptyState ? t.emptyToggleOff : t.emptyToggleOn}
          </button>
        </div>

        {/* Framework source -- always visible, never buried (Rule 2 / isc-ai-output-standards #6) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <span className="font-semibold text-[#082C6B]">{t.frameworkLabel}: </span>
          {isAr ? currentRollup.frameworkSourceAr : currentRollup.frameworkSourceEn}
        </div>

        {/* Alert banner -- "what's happening" framing, isc-ai-output-standards #11 */}
        {alert.triggered && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-red-800">{isAr ? '⚠ إشارة تنبيه' : '⚠ Alert Signal'}</p>
            <p className="text-sm text-red-700 mt-1">{isAr ? alert.messageAr : alert.messageEn}</p>
          </div>
        )}

        {/* Caller-supplied inputs -- Decision Record 8.7, never a hardcoded rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <label className="bg-white border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-600">
            {t.perCarRateLabel}
            <input
              type="number" min={0}
              value={perCarRate ?? ''}
              onChange={(e) => setPerCarRate(e.target.value === '' ? undefined : Number(e.target.value))}
              className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-normal text-slate-900"
            />
          </label>
          <label className="bg-white border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-600">
            {t.preventionLabel}
            <input
              type="number" min={0}
              value={preventionSpend ?? ''}
              onChange={(e) => setPreventionSpend(e.target.value === '' ? undefined : Number(e.target.value))}
              className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-normal text-slate-900"
            />
          </label>
        </div>

        {/* Waterfall -- isc-ai-output-standards #12, "Waterfall: financial breakdowns" */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-bold text-[#082C6B] mb-3">{t.waterfallTitle}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtUSD(v, isAr)} />
              <Tooltip formatter={(v: number) => fmtUSD(v, isAr)} />
              <Bar dataKey="base" stackId="wf" fill="transparent" />
              <Bar dataKey="value" stackId="wf">
                {waterfallData.map((row, i) => (
                  <Cell key={i} fill={row.hasData ? row.color : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-slate-500 mt-2">
            {isAr
              ? 'الأعمدة الرمادية تعني عدم توفر بيانات مكلَّفة لهذه الفئة — وليست صفرًا حقيقيًا.'
              : 'Gray bars mean no costed data for that category — not a real zero.'}
          </p>
        </div>

        {/* 4 PAF detail cards with confidence badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">{isAr ? 'الفشل الداخلي' : 'Internal Failure'}</p>
            <p className="text-xl font-bold text-[#082C6B]">{fmtUSD(currentRollup.internalFailure.costUSD, isAr)}</p>
            <div className="mt-2"><ConfidenceBadge basis={currentRollup.internalFailure.basis} isAr={isAr} /></div>
            <p className="text-[11px] text-slate-500 mt-2">{isAr ? currentRollup.internalFailure.noteAr : currentRollup.internalFailure.noteEn}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">{isAr ? 'الفشل الخارجي' : 'External Failure'}</p>
            <p className="text-xl font-bold text-[#082C6B]">{fmtUSD(currentRollup.externalFailure.costUSD, isAr)}</p>
            <div className="mt-2"><ConfidenceBadge basis={currentRollup.externalFailure.basis} isAr={isAr} /></div>
            <p className="text-[11px] text-slate-500 mt-2">{isAr ? currentRollup.externalFailure.noteAr : currentRollup.externalFailure.noteEn}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">{isAr ? 'التقييم' : 'Appraisal'}</p>
            <p className="text-xl font-bold text-[#082C6B]">{fmtUSD(currentRollup.appraisal.costUSD, isAr)}</p>
            <div className="mt-2"><ConfidenceBadge basis={currentRollup.appraisal.costBasis} isAr={isAr} /></div>
            <p className="text-[11px] text-slate-500 mt-2">{isAr ? currentRollup.appraisal.noteAr : currentRollup.appraisal.noteEn}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">{isAr ? 'الوقاية' : 'Prevention'}</p>
            <p className="text-xl font-bold text-[#082C6B]">{fmtUSD(currentRollup.prevention.costUSD, isAr)}</p>
            <div className="mt-2"><ConfidenceBadge basis={currentRollup.prevention.basis} isAr={isAr} /></div>
            <p className="text-[11px] text-slate-500 mt-2">{isAr ? currentRollup.prevention.noteAr : currentRollup.prevention.noteEn}</p>
          </div>
        </div>

        {/* Classification rule -- disclosed default, not hidden (Rule 1) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <span className="font-semibold text-[#082C6B]">{t.classificationRuleTitle}: </span>
          {isAr ? currentRollup.classificationRuleAr : currentRollup.classificationRuleEn}
        </div>

        {/* Narrative -- Decision-Ready Output Standard, isc-ai-output-standards #3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h2 className="text-sm font-bold text-[#082C6B] mb-2">{t.narrativeTitle}</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{isAr ? currentRollup.narrativeAr : currentRollup.narrativeEn}</p>
          {currentRollup.excludedBucketsEn.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2">
              {t.excluded}: {(isAr ? currentRollup.excludedBucketsAr : currentRollup.excludedBucketsEn).join(isAr ? '، ' : ', ')}
            </p>
          )}
        </div>

        {/* Operational tier -- ledger + trend */}
        {tier === 'operational' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#082C6B]">{t.trendTitle}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ledgerLoadState === 'live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'}`}>
                {ledgerLoadState === 'live' ? t.ledgerLive : t.ledgerDemo}
              </span>
            </div>
            {ledgerLoadState === 'demo-fallback' && (
              <p className="text-[11px] text-slate-500 mb-3">{isAr ? DEMO_LEDGER_HISTORY_NOTE_AR : DEMO_LEDGER_HISTORY_NOTE_EN}</p>
            )}
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtUSD(v, isAr)} />
                <Tooltip formatter={(v: number) => fmtUSD(v, isAr)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="total" name={isAr ? 'إجمالي COPQ المكلَّف' : 'Total Costed COPQ'} stroke="#082C6B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={saveStatus === 'saving'}
                onClick={() => {
                  setSaveStatus('saving');
                  fetch('/api/copq/ledger', {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ periodLabel: currentRollup.periodLabel, data: currentRollup }),
                  })
                    .then((r) => (r.ok ? setSaveStatus('saved') : setSaveStatus('unreachable')))
                    .catch(() => setSaveStatus('unreachable'));
                }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#082C6B] text-white hover:bg-[#082C6B]/90 transition-colors disabled:opacity-60"
              >
                {t.saveToLedger}
              </button>
              {saveStatus === 'saved' && (
                <span className="text-xs font-semibold text-emerald-700">{isAr ? '✓ تم الحفظ' : '✓ Saved'}</span>
              )}
              {saveStatus === 'unreachable' && (
                <span className="text-xs font-semibold text-amber-700">
                  {isAr ? 'تعذّر الوصول إلى الخادم — لا توجد جلسة حقيقية في هذه المعاينة' : 'Could not reach the server — no live session in this preview'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
