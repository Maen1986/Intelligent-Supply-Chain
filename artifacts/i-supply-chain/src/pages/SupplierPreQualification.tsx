/**
 * Supplier Lifecycle Governance Pre-Qualification & ASL -- Item 3 of 7
 * (11 Sep 2026).
 *
 * Two-tier, client-selectable (design doc section 2.8, same architecture as
 * SupplierCOPQ.tsx / RaciMatrix.tsx):
 *   - Advisory (default): renders @/lib/supplierPreQualification's
 *     computeAdvisoryASLAssessment() against a gate-result the user enters
 *     directly on this page (see the DISCLOSED LIMITATION note below) --
 *     a scored qualify/don't-qualify recommendation, zero persistence, no
 *     supplier name attached to anything stored.
 *   - Operational (opt-in): reads/writes the client's OWN organization's
 *     real ASL register via /api/pre-qualification/current,
 *     /api/pre-qualification/register and /api/pre-qualification/decisions.
 *     Write controls are shown only to a signed-in user who is either this
 *     org's org_admin or the org's current RACI Accountable holder for the
 *     'prequalification_approval' activity (fetched from /api/raci/current
 *     -- Item 2's own real data) -- re-enforced server-side on every write,
 *     never trusted from this component alone.
 *
 * DISCLOSED LIMITATION (Decision Record 8.7 -- honesty over a smoothed-over
 * gap): Module 04 (supplierQualificationGates.ts, the qualification & due
 * -diligence gate engine this page's ASL decisions are derived from) ships
 * "no UI this cycle" by its own file header -- there is no live screen
 * anywhere in the platform yet that runs a supplier's actual evidence
 * through those gates and produces a result. Until that UI exists, this
 * page accepts the gate OUTCOME as direct input (the four possible
 * overallStatus values, the blocking-gate text, the due-diligence tier)
 * rather than pretending to recompute it from raw evidence it cannot
 * actually reach -- the same honest-input-until-the-real-integration-exists
 * pattern already used elsewhere in this codebase. When Module 04 ships its
 * own UI, that screen becomes this page's real upstream input instead of a
 * manual selector, with zero change to the derivation logic in
 * supplierPreQualification.ts.
 *
 * Visual primitives: a decision-ready result CARD for the Advisory
 * assessment (isc-ai-output-standards #3 -- translate the gate result into
 * an actual recommendation, never leave a raw status for the reader to
 * interpret); a register TABLE for the Operational tier's current ASL
 * state (principle #12 -- Table is the right primitive for operational
 * record detail, one row per supplier); a TIMELINE-style drill-down for
 * each supplier's decision history, matching RaciMatrix.tsx's own
 * audit-trail cell pattern.
 *
 * Bilingual EN/AR from the start (Rule 5), following this app's isAr-
 * ternary convention.
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  APPROVAL_REASON_CATEGORIES,
  APPROVAL_REASON_LABELS,
  APPROVAL_REASON_SOURCE_EN,
  APPROVAL_REASON_SOURCE_AR,
  LIFECYCLE_REASON_CATEGORIES,
  LIFECYCLE_REASON_LABELS,
  ASL_DECISION_TYPES,
  determineReviewCadence,
  computeAdvisoryASLAssessment,
  type QualificationGateStatus,
  type DueDiligenceTier,
  type KraljicQuadrant,
  type ConcentrationBand,
  type ASLDecisionType,
  type ASLReasonCategory,
  type QualificationGateSnapshot,
  type RiskTierSignals,
} from '@/lib/supplierPreQualification';

type Tier = 'advisory' | 'operational';

const GATE_STATUSES: QualificationGateStatus[] = ['QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE'];
const DD_TIERS: DueDiligenceTier[] = ['STANDARD', 'ENHANCED'];
const KRALJIC_QUADRANTS: KraljicQuadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
const CONCENTRATION_BANDS: ConcentrationBand[] = ['competitive', 'moderatelyConcentrated', 'highlyConcentrated'];

interface ASLRegisterEvent {
  id: number;
  supplierId: string;
  decisionType: ASLDecisionType;
  reasonCategory: string;
  reasonNote: string | null;
  approverUserId: number;
  qualificationGateStatusAtDecision: QualificationGateStatus;
  dueDiligenceTierAtDecision: DueDiligenceTier;
  reviewDueAt: string | null;
  createdAt: string;
}

interface ASLCurrentRow {
  supplierId: string;
  status: ASLDecisionType | 'NEVER_ASSESSED';
  onASL: boolean;
  latestEvent: ASLRegisterEvent | null;
  reviewDueAt: string | null;
  isReviewOverdue: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  approved: '#065f46',
  conditionally_approved: '#92400e',
  declined: '#7f1d1d',
  suspended: '#7f1d1d',
  revoked: '#7f1d1d',
  reinstated: '#065f46',
  NEVER_ASSESSED: '#374151',
};

export function SupplierPreQualification() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [tier, setTier] = useState<Tier>('advisory');

  // Advisory-tier direct gate-outcome input (see DISCLOSED LIMITATION above)
  const [gateStatus, setGateStatus] = useState<QualificationGateStatus>('QUALIFIED');
  const [blockingGate, setBlockingGate] = useState('');
  const [ddTier, setDdTier] = useState<DueDiligenceTier>('STANDARD');
  const [kraljicQuadrant, setKraljicQuadrant] = useState<KraljicQuadrant | ''>('');
  const [concentrationBand, setConcentrationBand] = useState<ConcentrationBand | ''>('');

  // Operational-tier state
  const [current, setCurrent] = useState<ASLCurrentRow[]>([]);
  const [events, setEvents] = useState<ASLRegisterEvent[]>([]);
  const [isAccountableHolder, setIsAccountableHolder] = useState(false);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);

  // Decision form (Operational tier, authorized users only)
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formDecisionType, setFormDecisionType] = useState<ASLDecisionType>('approved');
  const [formReasonCategory, setFormReasonCategory] = useState<ASLReasonCategory>('audit');
  const [formReasonNote, setFormReasonNote] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const canWrite = isOrgAdmin || isAccountableHolder;

  useEffect(() => {
    if (tier !== 'operational') return;
    let cancelled = false;
    setLoadState('loading');
    Promise.all([
      fetch('/api/pre-qualification/current', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch('/api/pre-qualification/register', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch('/api/raci/current', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    ])
      .then(([currentRes, registerRes, raciRes]) => {
        if (cancelled) return;
        setCurrent(currentRes.ok ? currentRes.current : []);
        setEvents(registerRes.ok ? registerRes.events : []);
        if (raciRes.ok) {
          const row = (raciRes.current as Array<{ activityKey: string; role: string; userIds: number[] }>).find(
            (c) => c.activityKey === 'prequalification_approval' && c.role === 'A',
          );
          setIsAccountableHolder(!!row && !!user && row.userIds.includes(user.id));
        }
        setLoadState('live');
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState('unreachable');
      });
    return () => { cancelled = true; };
  }, [tier, saveStatus, user]);

  const riskSignals: RiskTierSignals = useMemo(
    () => ({
      kraljicQuadrant: kraljicQuadrant || undefined,
      concentrationBand: concentrationBand || undefined,
    }),
    [kraljicQuadrant, concentrationBand],
  );

  const gateSnapshot: QualificationGateSnapshot = useMemo(
    () => ({
      overallStatus: gateStatus,
      blockingGate: gateStatus === 'NOT_QUALIFIED' ? (blockingGate || (isAr ? 'غير محدد' : 'unspecified')) : null,
      dueDiligenceTier: ddTier,
      dueDiligenceGaps: ddTier === 'ENHANCED' ? [
        'Sanctions/PEP screening against a live watchlist -- no data source integrated',
        'Beneficial-ownership (UBO) verification -- no registry integration',
        'Credit-bureau-verified financial health check -- financial gate relies on client-supplied evidence only',
        'Continuous post-qualification monitoring -- all evidence here is point-in-time, not a live feed',
      ] : [],
      dueDiligenceGapsAr: ddTier === 'ENHANCED' ? [
        'فحص قوائم العقوبات والأشخاص السياسيين المعرّضين (PEP) مقابل قائمة مراقبة حيّة -- لا يوجد مصدر بيانات متكامل لهذا الغرض',
        'التحقق من هوية المستفيد الحقيقي (الملكية النفعية) -- لا يوجد تكامل مع أي سجل رسمي لذلك',
        'فحص الوضع الائتماني والمالي عبر مكتب ائتمان معتمد -- بند التقييم المالي يعتمد حصراً على الأدلة المقدّمة من العميل',
        'المراقبة المستمرة بعد التأهيل -- جميع الأدلة هنا تمثّل لحظة زمنية محددة، وليست تغذية بيانات حيّة ومستمرة',
      ] : [],
    }),
    [gateStatus, blockingGate, ddTier, isAr],
  );

  const advisory = useMemo(() => computeAdvisoryASLAssessment(gateSnapshot, riskSignals), [gateSnapshot, riskSignals]);
  const cadence = useMemo(() => determineReviewCadence(riskSignals), [riskSignals]);

  const reasonOptions: ASLReasonCategory[] = formDecisionType === 'approved' || formDecisionType === 'conditionally_approved'
    ? APPROVAL_REASON_CATEGORIES
    : LIFECYCLE_REASON_CATEGORIES;

  useEffect(() => {
    setFormReasonCategory(reasonOptions[0]);
  }, [formDecisionType]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = {
    title: isAr ? 'التأهيل المسبق والقائمة المعتمدة للموردين (ASL)' : 'Supplier Pre-Qualification & Approved Supplier List (ASL)',
    subtitle: isAr
      ? 'حالة القائمة المعتمدة مُشتقة دائماً من نتيجة بوابة التأهيل، مع سبب موافقة موثّق ومعتمد حقيقي -- وليست علماً يدوياً'
      : 'ASL status is always derived from the qualification-gate result, with a documented approval reason and a real approver -- never a manual flag',
    tierAdvisory: isAr ? 'المستوى الاستشاري' : 'Advisory Tier',
    tierOperational: isAr ? 'المستوى التشغيلي' : 'Operational Tier',
    tierAdvisoryDesc: isAr ? 'تقييم فوري بلا تخزين وبلا اسم مورّد حقيقي' : 'Instant assessment, zero persistence, no real supplier name',
    tierOperationalDesc: isAr ? 'تحفظ ISC قرارات القائمة المعتمدة الفعلية كسجل مرجعي معتمد للعميل' : "ISC persists real ASL decisions as the client's system of record",
    frameworkLabel: isAr ? 'المنهجية المعتمدة' : 'Sourced Methodology',
    frameworkText: isAr
      ? 'استبيان تأهيل مسبق يغطي البيانات المالية وشهادات الجودة والمراجع لتصفية المرشحين، وموافقة موثّقة السبب دائماً؛ إعادة المراجعة الدورية للقائمة المعتمدة تتناسب مع مستوى مخاطرة المورّد بدلاً من جدول ثابت واحد (sourceday.com، greenlight.guru، lassosupplychain.com، cenitconsulting.com).'
      : 'A pre-qualification questionnaire covering financials, quality certifications and references filters candidates, and approval always carries a documented reason; ASL re-review cadence scales with supplier risk rather than one fixed calendar (sourceday.com, greenlight.guru, lassosupplychain.com, cenitconsulting.com).',
    limitationTitle: isAr ? 'قيد معلن: لا واجهة بعد لبوابات الوحدة 04' : 'Disclosed limitation: Module 04\'s gate engine has no UI yet',
    limitationText: isAr
      ? 'لا توجد بعد شاشة حية تُدخل أدلة المورّد الفعلية عبر بوابات التأهيل والعناية الواجبة. أدخل نتيجة البوابة أدناه يدوياً لمعاينة التوصية -- عند بناء واجهة الوحدة 04، ستُغذّي هذه الصفحة تلقائياً دون أي تغيير في منطق الاشتقاق.'
      : "There is no live screen yet that runs a supplier's real evidence through the qualification & due-diligence gates. Enter a gate outcome below to preview the recommendation -- once Module 04 ships its own UI, this page will be fed automatically with zero change to the derivation logic.",
    gateStatusLabel: isAr ? 'نتيجة بوابة التأهيل (الوحدة 04)' : 'Qualification-gate result (Module 04)',
    blockingGateLabel: isAr ? 'البوابة (البوابات) المعطّلة' : 'Blocking gate(s)',
    ddTierLabel: isAr ? 'مستوى العناية الواجبة' : 'Due-diligence tier',
    kraljicLabel: isAr ? 'ربع مصفوفة كرالييك (الوحدة 02، اختياري)' : 'Kraljic quadrant (Module 02, optional)',
    concentrationLabel: isAr ? 'نطاق تركّز قاعدة الموردين (الوحدة 05، اختياري)' : 'Supply-base concentration (Module 05, optional)',
    recommendationLabel: isAr ? 'التوصية' : 'Recommendation',
    primaryLabel: isAr ? 'التوصية الأساسية' : 'Primary recommendation',
    alternativeLabel: isAr ? 'بديل قوي' : 'Strong alternative',
    cadenceLabel: isAr ? 'دورة إعادة المراجعة' : 'Review cadence',
    ddGapsLabel: isAr ? 'فجوات العناية الواجبة المعلنة' : 'Disclosed due-diligence gaps',
    registerTitle: isAr ? 'سجل القائمة المعتمدة' : 'ASL Register',
    supplierCol: isAr ? 'المورّد' : 'Supplier',
    statusCol: isAr ? 'الحالة' : 'Status',
    reviewDueCol: isAr ? 'موعد المراجعة القادمة' : 'Next Review Due',
    overdue: isAr ? 'متأخرة' : 'Overdue',
    noSuppliers: isAr ? 'لا توجد قرارات مسجلة بعد' : 'No decisions recorded yet',
    historyTitle: isAr ? 'سجل القرارات' : 'Decision History',
    noHistory: isAr ? 'لا يوجد سجل' : 'No history',
    decisionFormTitle: isAr ? 'تسجيل قرار' : 'Record a Decision',
    writeGateNote: isAr
      ? 'مقصور على مسؤول المنظمة أو المعتمد (A) المعيّن حالياً لنشاط "موافقة التأهيل المسبق" في مصفوفة RACI -- يُعاد التحقق من هذا الشرط من قِبل الخادم مع كل عملية حفظ.'
      : "Restricted to your organization's admin, or the RACI Accountable holder currently assigned to the 'Pre-Qualification Approval' activity -- re-checked server-side on every save.",
    notAuthorizedNote: isAr
      ? 'حسابك ليس مسؤول المنظمة ولا المعتمد المعيّن لهذا النشاط، لذلك عناصر التسجيل هنا للعرض فقط.'
      : 'Your account is neither this organization\'s admin nor the assigned Accountable holder for this activity, so the recording controls here are view-only.',
    noOrgNote: isAr ? 'حسابك غير مرتبط حالياً بأي مؤسسة.' : 'Your account is not currently linked to an organization.',
    supplierIdField: isAr ? 'معرّف المورّد' : 'Supplier ID',
    decisionField: isAr ? 'نوع القرار' : 'Decision type',
    reasonField: isAr ? 'سبب القرار' : 'Decision reason',
    noteField: isAr ? 'ملاحظة (اختياري)' : 'Note (optional)',
    save: isAr ? 'حفظ' : 'Save',
    saved: isAr ? '✓ تم الحفظ' : '✓ Saved',
    unreachable: isAr ? 'تعذّر الوصول إلى الخادم' : 'Could not reach the server',
    decisionLabels: {
      approved: isAr ? 'موافق عليه' : 'Approved',
      conditionally_approved: isAr ? 'موافقة مشروطة' : 'Conditionally Approved',
      declined: isAr ? 'مرفوض' : 'Declined',
      suspended: isAr ? 'موقَف' : 'Suspended',
      revoked: isAr ? 'مُلغى' : 'Revoked',
      reinstated: isAr ? 'أُعيد إدراجه' : 'Reinstated',
      NEVER_ASSESSED: isAr ? 'لم يُقيّم بعد' : 'Never assessed',
    } as Record<string, string>,
  };

  const submitDecision = async () => {
    if (!formSupplierId.trim()) return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/pre-qualification/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: formSupplierId.trim(),
          decisionType: formDecisionType,
          reasonCategory: formReasonCategory,
          reasonNote: formReasonNote || null,
          gate: gateSnapshot,
          riskSignals,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveStatus('error');
        setSaveError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setSaveStatus('saved');
      setFormReasonNote('');
    } catch {
      setSaveStatus('error');
      setSaveError(isAr ? 'خطأ في الشبكة' : 'Network error');
    }
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

        <p className="text-xs text-slate-500 mb-6">{tier === 'advisory' ? t.tierAdvisoryDesc : t.tierOperationalDesc}</p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600">
          <span className="font-semibold text-[#082C6B]">{t.frameworkLabel}: </span>
          {t.frameworkText}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-blue-900">{t.limitationTitle}</p>
          <p className="text-xs text-blue-800 mt-1 leading-relaxed">{t.limitationText}</p>
        </div>

        {/* Shared gate-outcome input -- feeds both tiers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.gateStatusLabel}</span>
              <select
                value={gateStatus}
                onChange={(e) => setGateStatus(e.target.value as QualificationGateStatus)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2"
              >
                {GATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {gateStatus === 'NOT_QUALIFIED' && (
              <label className="text-xs">
                <span className="block font-semibold text-slate-600 mb-1">{t.blockingGateLabel}</span>
                <input
                  type="text"
                  value={blockingGate}
                  onChange={(e) => setBlockingGate(e.target.value)}
                  placeholder={isAr ? 'مثال: الامتثال، الهوية' : 'e.g. compliance, identity'}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2"
                />
              </label>
            )}
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.ddTierLabel}</span>
              <select
                value={ddTier}
                onChange={(e) => setDdTier(e.target.value as DueDiligenceTier)}
                className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2"
              >
                {DD_TIERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.kraljicLabel}</span>
              <select
                value={kraljicQuadrant}
                onChange={(e) => setKraljicQuadrant(e.target.value as KraljicQuadrant | '')}
                className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2"
              >
                <option value="">{isAr ? '-- غير محدد --' : '-- not set --'}</option>
                {KRALJIC_QUADRANTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.concentrationLabel}</span>
              <select
                value={concentrationBand}
                onChange={(e) => setConcentrationBand(e.target.value as ConcentrationBand | '')}
                className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2"
              >
                <option value="">{isAr ? '-- غير محدد --' : '-- not set --'}</option>
                {CONCENTRATION_BANDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Decision-ready advisory result -- isc-ai-output-standards #3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-[#082C6B] mb-3">{t.recommendationLabel}: <span style={{ color: STATUS_COLOR[advisory.recommendation] ?? '#082C6B' }}>{advisory.recommendation.replace(/_/g, ' ')}</span></p>
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-700">{t.primaryLabel}</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{isAr ? advisory.primaryAr : advisory.primaryEn}</p>
          </div>
          <div className="mb-3 border-s-2 border-amber-300 ps-3">
            <p className="text-xs font-semibold text-amber-800">{t.alternativeLabel}</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">{isAr ? advisory.alternativeAr : advisory.alternativeEn}</p>
          </div>
          <p className="text-xs text-slate-500">{t.cadenceLabel}: <span className="font-semibold">{advisory.reviewCadence.tier}</span> ({advisory.reviewCadence.days} {isAr ? 'يوماً' : 'days'})</p>
          {advisory.dueDiligenceGaps.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-amber-900">{t.ddGapsLabel}</p>
              <ul className="text-[11px] text-amber-800 mt-1 list-disc ms-5">
                {(isAr ? advisory.dueDiligenceGapsAr : advisory.dueDiligenceGaps).map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>

        {tier === 'operational' && (
          <>
            {loadState === 'unreachable' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 text-xs text-amber-800">{t.unreachable}</div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto mb-6">
              <p className="text-sm font-semibold text-[#082C6B] px-4 pt-4">{t.registerTitle}</p>
              <table className="w-full text-xs mt-2">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-start px-3 py-2 font-semibold text-slate-600">{t.supplierCol}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-600">{t.statusCol}</th>
                    <th className="text-start px-3 py-2 font-semibold text-slate-600">{t.reviewDueCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {current.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-4 text-slate-400 italic">{t.noSuppliers}</td></tr>
                  ) : current.map((row) => {
                    const isOpen = expandedSupplier === row.supplierId;
                    const history = events.filter((e) => e.supplierId === row.supplierId);
                    return (
                      <tr key={row.supplierId} className="border-b border-slate-100 last:border-0 align-top">
                        <td className="px-3 py-3 font-semibold text-slate-800">{row.supplierId}</td>
                        <td className="px-3 py-3">
                          <span style={{ color: STATUS_COLOR[row.status] ?? '#374151' }} className="font-semibold">{t.decisionLabels[row.status] ?? row.status}</span>
                        </td>
                        <td className="px-3 py-3">
                          {row.reviewDueAt ? (
                            <span className={row.isReviewOverdue ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                              {new Date(row.reviewDueAt).toLocaleDateString(isAr ? 'ar' : 'en-US')}{row.isReviewOverdue ? ` (${t.overdue})` : ''}
                            </span>
                          ) : '—'}
                          <button
                            type="button"
                            onClick={() => setExpandedSupplier(isOpen ? null : row.supplierId)}
                            className="block text-[10px] text-[#082C6B]/70 hover:text-[#082C6B] underline mt-1"
                          >
                            {t.historyTitle}
                          </button>
                          {isOpen && (
                            <div className="mt-2 border-s-2 border-slate-200 ps-2">
                              {history.length === 0 ? (
                                <p className="text-[10px] text-slate-400">{t.noHistory}</p>
                              ) : (
                                <ul className="space-y-1">
                                  {history.map((h) => (
                                    <li key={h.id} className="text-[10px] text-slate-500">
                                      <span style={{ color: STATUS_COLOR[h.decisionType] }}>{t.decisionLabels[h.decisionType]}</span>{' '}
                                      — {h.reasonCategory} — {new Date(h.createdAt).toLocaleString(isAr ? 'ar' : 'en-US')}
                                      {h.reasonNote && <p className="italic text-slate-400">{h.reasonNote}</p>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-[#082C6B]">{t.decisionFormTitle}</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">{t.writeGateNote}</p>
              {!hasOrg && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{t.noOrgNote}</p>}
              {hasOrg && !canWrite && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{t.notAuthorizedNote}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.supplierIdField}</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                  />
                </label>
                <label className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.decisionField}</span>
                  <select
                    disabled={!canWrite}
                    value={formDecisionType}
                    onChange={(e) => setFormDecisionType(e.target.value as ASLDecisionType)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                  >
                    {ASL_DECISION_TYPES.map((d) => <option key={d} value={d}>{t.decisionLabels[d]}</option>)}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.reasonField}</span>
                  <select
                    disabled={!canWrite}
                    value={formReasonCategory}
                    onChange={(e) => setFormReasonCategory(e.target.value as ASLReasonCategory)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                  >
                    {reasonOptions.map((r) => {
                      const label = (APPROVAL_REASON_LABELS as Record<string, { en: string; ar: string }>)[r] ?? (LIFECYCLE_REASON_LABELS as Record<string, { en: string; ar: string }>)[r];
                      return <option key={r} value={r}>{isAr ? label.ar : label.en}</option>;
                    })}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.noteField}</span>
                  <input
                    type="text"
                    disabled={!canWrite}
                    value={formReasonNote}
                    onChange={(e) => setFormReasonNote(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 disabled:opacity-50"
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{isAr ? APPROVAL_REASON_SOURCE_AR : APPROVAL_REASON_SOURCE_EN}</p>
              <button
                type="button"
                disabled={!canWrite || !formSupplierId.trim()}
                onClick={submitDecision}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white disabled:opacity-40 hover:bg-[#082C6B]/90 transition-colors mt-3"
              >
                {t.save}
              </button>
              {saveStatus === 'saved' && <p className="text-xs font-semibold text-emerald-700 mt-2">{t.saved}</p>}
              {saveStatus === 'error' && <p className="text-xs font-semibold text-red-700 mt-2">{saveError}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
