/**
 * Supplier Periodic Evaluation -- Item 5 of 7 (12 Sep 2026).
 *
 * WHAT THIS IS NOT: this page is NOT the Supplier Recovery Portfolio
 * (Module 07 / SupplierRecoveryPortfolio.tsx), which tracks ongoing
 * recurrence/escalation CONTINUOUSLY. This page is the formal, SCHEDULED
 * review ceremony -- ISO 9001:2015 Clause 8.4.1's own named "re-evaluation"
 * activity, distinct from "monitoring of performance" -- that produces its
 * own dated record and sign-off, on an annual or semi-annual cadence, and
 * CONSUMES Module 07's data as evidence rather than re-tracking it. See
 * supplierPeriodicEvaluation.ts's own file header for the full sourcing and
 * design-contract disclosure this page's logic is built on.
 *
 * Two-tier, client-selectable (same architecture as SupplierCOPQ.tsx /
 * RaciMatrix.tsx / SupplierOnboarding.tsx):
 *   - Advisory (default): a structured scorecard/template the client fills
 *     in and reviews themselves -- scoring rubric, evidence checklist,
 *     recommendation output. Zero required persistence; nothing here is
 *     saved unless the client is on the Operational tier.
 *   - Operational (opt-in): ISC persists the cadence, the due-status, and
 *     the signed-off evaluation record via /api/periodic-evaluation, and
 *     escalates into the client's own Findings & Actions list (reusing
 *     Items 1-3's own findings_actions escalation pattern -- no new alert
 *     table) when a review flags an at-risk category. Write controls are
 *     shown only to a signed-in user who is either this org's org_admin or
 *     the org's current RACI Accountable holder for 'periodic_evaluation'
 *     (fetched from /api/raci/current where applicable) -- re-enforced
 *     server-side on every write, never trusted from this component alone.
 *
 * CADENCE REUSES THE GOVERNANCE-TIER MODULE, NOT A FORKED FUNCTION: the
 * annual-vs-semi-annual recommendation banner below is computed by
 * computeRecommendedEvaluationCadence(), which itself calls
 * computeRecommendedGovernanceTier() internally -- the same Kraljic +
 * industry inputs entered on the Onboarding page, re-entered here (Module
 * 02/client-profile data is not yet live-fed into this page, same disclosed
 * manual-entry fallback as Onboarding's own Kraljic/industry inputs).
 *
 * TENSION IS SURFACED, NEVER RESOLVED: the "active Module 07 escalation"
 * fields below are today a manual, disclosed stand-in for a live Module 07
 * feed (Module 07 has no cross-page API to read from yet, an honestly
 * disclosed gap -- the same class of gap COPQ's own doc already discloses
 * for Module 05). When checked, the tension banner shows exactly what
 * checkRecoveryTension() computes -- it never lets a clean periodic score
 * silently override an active recovery escalation, or vice versa.
 *
 * Bilingual EN/AR from the start (Rule 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  SCORECARD_CATEGORY_META,
  scoreCategoryResults,
  deriveOverallRecommendation,
  shouldEscalateToFindingsActions,
  computeRecommendedEvaluationCadence,
  resolveEffectiveCadence,
  assessReviewDueStatus,
  buildEvidenceChecklist,
  checkRecoveryTension,
  ITEM6_FORWARD_HOOK_NOTE_EN,
  ITEM6_FORWARD_HOOK_NOTE_AR,
  CONSULTANCY_FRAMING_NOTE_EN,
  CONSULTANCY_FRAMING_NOTE_AR,
  type ScorecardCategory,
  type SIDataSourceLike,
  type CadenceOverrideLike,
  type Module07EscalationSnapshotLike,
} from '@/lib/supplierPeriodicEvaluation';

type Tier = 'advisory' | 'operational';

/* Manually-synced mirror of KRALJIC_QUADRANT_OPTIONS in SupplierOnboarding.tsx -- same
 * disclosed duplication precedent as that page's own mirror of kraljicScoring.ts. */
const KRALJIC_QUADRANT_OPTIONS: { value: string; en: string; ar: string }[] = [
  { value: '', en: '-- not yet scored --', ar: '-- لم يتم التقييم بعد --' },
  { value: 'strategic', en: 'Strategic', ar: 'استراتيجي' },
  { value: 'bottleneck', en: 'Bottleneck', ar: 'عنق الزجاجة' },
  { value: 'leverage', en: 'Leverage', ar: 'ذو نفوذ تفاوضي' },
  { value: 'non-critical', en: 'Non-critical / Routine', ar: 'روتيني / غير حرج' },
];

const DECLARED_INDUSTRY_OPTIONS: { value: string; en: string; ar: string }[] = [
  { value: '', en: '-- not yet declared --', ar: '-- لم يُعلَن بعد --' },
  { value: 'retail-fmcg', en: 'Retail / FMCG', ar: 'تجزئة / بضائع سريعة' },
  { value: 'manufacturing', en: 'Manufacturing', ar: 'تصنيع صناعي' },
  { value: 'healthcare-pharma', en: 'Healthcare & Pharma', ar: 'رعاية صحية / دواء' },
  { value: 'oil-gas', en: 'Oil & Gas / Energy', ar: 'نفط وغاز / طاقة' },
  { value: 'government', en: 'Government / Public Sector', ar: 'حكومي / قطاع عام' },
  { value: 'logistics', en: 'Logistics / 3PL', ar: 'لوجستيات / طرف ثالث' },
  { value: 'food-beverage', en: 'Food & Beverage', ar: 'غذاء ومشروبات' },
  { value: 'construction', en: 'Construction / Real Estate', ar: 'إنشاءات / عقارات' },
];

const DATA_SOURCE_OPTIONS: { value: SIDataSourceLike; en: string; ar: string }[] = [
  { value: 'manual', en: 'Manual entry', ar: 'إدخال يدوي' },
  { value: 'imported-file', en: 'Imported file', ar: 'ملف مستورد' },
  { value: 'erp', en: 'ERP', ar: 'نظام تخطيط الموارد' },
  { value: 'wms', en: 'WMS', ar: 'نظام إدارة المستودعات' },
  { value: 'scm', en: 'SCM', ar: 'نظام سلسلة الإمداد' },
  { value: 'crm', en: 'CRM', ar: 'نظام إدارة علاقات العملاء' },
];

const OVERALL_RECOMMENDATION_LABELS: Record<string, { en: string; ar: string }> = {
  continue_standard_cadence: { en: 'Continue standard cadence', ar: 'الاستمرار وفق الدورة المعتادة' },
  monitor_closely: { en: 'Monitor closely', ar: 'المراقبة عن كثب' },
  escalate_consider: { en: 'Escalate / consider', ar: 'النظر في التصعيد' },
};

const CATEGORY_RATING_LABELS: Record<string, { en: string; ar: string }> = {
  strong: { en: 'Strong', ar: 'قوي' },
  acceptable: { en: 'Acceptable', ar: 'مقبول' },
  watch: { en: 'Watch', ar: 'تحت المراقبة' },
  at_risk: { en: 'At risk', ar: 'معرَّض للخطر' },
};

interface CategoryScoreState {
  score: number;
  dataSource: SIDataSourceLike;
  notes: string;
}

export function SupplierPeriodicEvaluation() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [tier, setTier] = useState<Tier>('advisory');
  const [supplierId, setSupplierId] = useState('SUP-RAWABI-01');

  // Cadence-recommendation inputs -- manual entry until a live Module 02/
  // client-profile feed exists, same disclosed fallback as Onboarding's own
  // Kraljic/industry inputs.
  const [kraljicQuadrant, setKraljicQuadrant] = useState('');
  const [declaredIndustry, setDeclaredIndustry] = useState('');

  const [cadenceOverride, setCadenceOverride] = useState<CadenceOverrideLike | null>(null);
  const [cadenceLoadState, setCadenceLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');
  const [cadenceSaveStatus, setCadenceSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const [lastEvaluationCompletedAt, setLastEvaluationCompletedAt] = useState<string | null>(null);
  const [lastOverallRecommendation, setLastOverallRecommendation] = useState<string | null>(null);
  const [historyLoadState, setHistoryLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');

  const [isAccountableHolder, setIsAccountableHolder] = useState(false);
  const canWrite = isOrgAdmin || isAccountableHolder;

  // Evidence checklist toggles -- caller-supplied plain facts (Standalone-First).
  const [hasModule06Data, setHasModule06Data] = useState(false);
  const [hasModule07Data, setHasModule07Data] = useState(false);

  // Module 07 tension inputs -- disclosed manual stand-in, see file header.
  const [hasActiveEscalation, setHasActiveEscalation] = useState(false);
  const [escalationEscalated, setEscalationEscalated] = useState(false);
  const [escalationCombinedSignal, setEscalationCombinedSignal] = useState(false);
  const [escalationIntervention, setEscalationIntervention] = useState('DUAL_SOURCE');

  const [categoryScores, setCategoryScores] = useState<Record<ScorecardCategory, CategoryScoreState>>({
    quality: { score: 80, dataSource: 'manual', notes: '' },
    delivery_otif: { score: 80, dataSource: 'manual', notes: '' },
    cost: { score: 80, dataSource: 'manual', notes: '' },
    service_responsiveness: { score: 80, dataSource: 'manual', notes: '' },
    compliance_esg: { score: 80, dataSource: 'manual', notes: '' },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // RACI Accountable-holder check for 'periodic_evaluation' -- same pattern as Onboarding's
  // own check for 'onboarding_signoff', re-fetched from the real, live /api/raci/current.
  useEffect(() => {
    if (!hasOrg) { setIsAccountableHolder(false); return; }
    let cancelled = false;
    fetch('/api/raci/current', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        const rows = data.current as Array<{ activityKey: string; role: string; userIds: number[] }>;
        const row = rows.find((r) => r.activityKey === 'periodic_evaluation' && r.role === 'A');
        setIsAccountableHolder(!!row && !!user?.id && row.userIds.includes(user.id));
      })
      .catch(() => { if (!cancelled) setIsAccountableHolder(false); });
    return () => { cancelled = true; };
  }, [hasOrg, user?.id]);

  // Fetch this org's durable cadence override + latest completed evaluation for this supplier.
  useEffect(() => {
    if (!hasOrg || !supplierId.trim()) { setCadenceLoadState('idle'); setHistoryLoadState('idle'); return; }
    setCadenceLoadState('loading');
    setHistoryLoadState('loading');
    let cancelled = false;
    fetch(`/api/periodic-evaluation/current?supplierId=${encodeURIComponent(supplierId.trim())}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setCadenceOverride(data.cadenceOverride ?? null);
        setCadenceLoadState('live');
        setLastEvaluationCompletedAt(data.latestEvaluation?.completedAt ?? null);
        setLastOverallRecommendation(data.latestEvaluation?.overallRecommendation ?? null);
        setHistoryLoadState('live');
      })
      .catch(() => {
        if (cancelled) return;
        setCadenceLoadState('unreachable');
        setHistoryLoadState('unreachable');
      });
    return () => { cancelled = true; };
  }, [hasOrg, supplierId]);

  const cadenceRecommendation = useMemo(
    () => computeRecommendedEvaluationCadence({ kraljicQuadrant: kraljicQuadrant || null, declaredIndustry: declaredIndustry || null }),
    [kraljicQuadrant, declaredIndustry],
  );
  const effectiveCadence = useMemo(
    () => resolveEffectiveCadence(cadenceRecommendation, hasOrg ? cadenceOverride : cadenceOverride),
    [cadenceRecommendation, cadenceOverride, hasOrg],
  );

  const dueStatus = useMemo(
    () => assessReviewDueStatus({ cadence: effectiveCadence.cadence, lastEvaluationCompletedAt }),
    [effectiveCadence.cadence, lastEvaluationCompletedAt],
  );

  const evidenceChecklist = useMemo(
    () => buildEvidenceChecklist({ hasModule06CommercialData: hasModule06Data, hasModule07PerformanceData: hasModule07Data }),
    [hasModule06Data, hasModule07Data],
  );

  const scoredCategories = useMemo(
    () => scoreCategoryResults(SCORECARD_CATEGORY_META.map((meta) => ({ category: meta.key, ...categoryScores[meta.key] }))),
    [categoryScores],
  );
  const overallResult = useMemo(() => deriveOverallRecommendation(scoredCategories), [scoredCategories]);

  const activeEscalationSnapshot: Module07EscalationSnapshotLike | null = hasActiveEscalation
    ? { recommendedIntervention: escalationIntervention, escalated: escalationEscalated, combinedSignalFlag: escalationCombinedSignal }
    : null;
  const tensionResult = useMemo(
    () => checkRecoveryTension(overallResult.overallRecommendation, activeEscalationSnapshot),
    [overallResult.overallRecommendation, activeEscalationSnapshot],
  );

  // Cadence-override persistence -- awaits server confirmation before updating displayed
  // state (the same fix Onboarding's own QA review required for its governance-tier panel;
  // applied here from the start rather than repeating that defect).
  async function persistCadenceOverride(action: 'set' | 'clear', cadence?: 'annual' | 'semi_annual'): Promise<boolean> {
    try {
      const res = await fetch('/api/periodic-evaluation/cadence-override', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'set' ? { supplierId: supplierId.trim(), action, cadence } : { supplierId: supplierId.trim(), action }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleCadenceSelect(next: 'annual' | 'semi_annual') {
    if (!hasOrg) { setCadenceOverride({ cadence: next, overriddenAt: new Date().toISOString() }); return; }
    if (!canWrite) { setCadenceSaveStatus('error'); return; }
    setCadenceSaveStatus('saving');
    const ok = await persistCadenceOverride('set', next);
    if (ok) { setCadenceOverride({ cadence: next, overriddenAt: new Date().toISOString() }); setCadenceSaveStatus('idle'); }
    else setCadenceSaveStatus('error');
  }

  async function clearCadenceOverride() {
    if (!hasOrg) { setCadenceOverride(null); return; }
    if (!canWrite) { setCadenceSaveStatus('error'); return; }
    setCadenceSaveStatus('saving');
    const ok = await persistCadenceOverride('clear');
    if (ok) { setCadenceOverride(null); setCadenceSaveStatus('idle'); }
    else setCadenceSaveStatus('error');
  }

  async function submitEvaluation() {
    if (!hasOrg || !canWrite) { setSaveStatus('error'); setSaveError(t.notAuthorized); return; }
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/periodic-evaluation/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplierId.trim(),
          categoryScores: SCORECARD_CATEGORY_META.map((m) => ({ category: m.key, ...categoryScores[m.key] })),
        }),
      });
      if (!res.ok) { setSaveStatus('error'); setSaveError(t.saveError); return; }
      const data = await res.json();
      setLastEvaluationCompletedAt(new Date().toISOString());
      setLastOverallRecommendation(data.overallRecommendation ?? null);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      setSaveError(t.saveError);
    }
  }

  const t = {
    title: isAr ? 'التقييم الدوري للموردين' : 'Periodic Supplier Evaluation',
    subtitle: isAr
      ? 'مراجعة دورية مجدولة ومنفصلة عن متابعة الأداء المستمرة (البند 7) -- بطاقة أداء، وتوصية، وسجل اعتماد.'
      : 'A scheduled, formal review -- distinct from continuous performance tracking (Item 7) -- producing a scorecard, a recommendation, and a sign-off record.',
    tierAdvisory: isAr ? 'استشاري' : 'Advisory',
    tierOperational: isAr ? 'تشغيلي' : 'Operational',
    tierAdvisoryDesc: isAr ? 'بطاقة أداء ونموذج تُنفَّذانه بنفسك -- لا حفظ مطلوب.' : 'A scorecard and template you review yourself -- no persistence required.',
    tierOperationalDesc: isAr ? 'آي إس سي تحفظ الدورة والاستحقاق وسجل الاعتماد، وتُصعِّد عند الحاجة.' : 'ISC persists the cadence, due-status, and sign-off record, and escalates when warranted.',
    supplierIdLabel: isAr ? 'معرّف المورّد' : 'Supplier ID',
    kraljicLabel: isAr ? 'ربع مصفوفة كرالييك' : 'Kraljic Quadrant',
    industryLabel: isAr ? 'القطاع الصناعي المُعلَن' : 'Declared Industry',
    cadenceTitle: isAr ? 'الدورة الموصى بها' : 'Recommended Cadence',
    cadenceAnnual: isAr ? 'سنوية' : 'Annual',
    cadenceSemiAnnual: isAr ? 'نصف سنوية' : 'Semi-annual',
    recommendedBadge: isAr ? 'موصى به' : 'Recommended',
    overriddenBadge: isAr ? 'مُعدَّل يدوياً' : 'Manually overridden',
    resetToRecommendation: isAr ? 'إعادة الضبط للتوصية' : 'Reset to recommendation',
    notAuthorized: isAr ? 'غير مخوَّل بهذا الإجراء.' : 'Not authorized for this action.',
    saveError: isAr ? 'تعذّر الحفظ. حاول مرة أخرى.' : 'Could not save. Please try again.',
    saving: isAr ? 'جارٍ الحفظ…' : 'Saving…',
    unreachable: isAr ? 'تعذّر الاتصال بالخادم -- القيمة المعروضة محلية فقط.' : 'Could not reach the server -- showing local value only.',
    dueStatusTitle: isAr ? 'حالة الاستحقاق' : 'Review Due-Status',
    neverEvaluated: isAr ? 'لم يُقيَّم بعد -- ليس متأخراً، لا يوجد تاريخ استحقاق بعد.' : 'Never evaluated yet -- not overdue; there is no due date to anchor to yet.',
    notYetDue: isAr ? 'غير مستحق بعد' : 'Not yet due',
    dueSoon: isAr ? 'مستحق قريباً' : 'Due soon',
    overdue: isAr ? 'متأخر' : 'Overdue',
    evidenceTitle: isAr ? 'قائمة الأدلة' : 'Evidence Checklist',
    hasM06: isAr ? 'لديّ بيانات تجارية من البند 6' : 'I have Module 06 commercial data',
    hasM07: isAr ? 'لديّ بيانات أداء من البند 7' : 'I have Module 07 performance data',
    tensionTitle: isAr ? 'محاكاة تصعيد نشط من البند 7 (إدخال يدوي مؤقت)' : 'Simulate an active Module 07 escalation (temporary manual entry)',
    tensionEscalated: isAr ? 'مُصعَّد' : 'Escalated',
    tensionCombined: isAr ? 'إشارة مركبة' : 'Combined signal',
    scorecardTitle: isAr ? 'بطاقة الأداء (0-100 لكل فئة)' : 'Scorecard (0-100 per category)',
    overallTitle: isAr ? 'التوصية الإجمالية' : 'Overall Recommendation',
    recordEvaluation: isAr ? 'تسجيل التقييم (اعتماد)' : 'Record Evaluation (sign-off)',
    savedConfirmation: isAr ? 'تم حفظ التقييم.' : 'Evaluation recorded.',
    advisoryNoPersist: isAr ? 'الطبقة الاستشارية: هذا التقييم لا يُحفظ -- راجعه بنفسك.' : 'Advisory tier: this evaluation is not persisted -- review it yourself.',
    escalationNote: isAr ? 'سيتم تصعيد هذا إلى قائمة الإجراءات والنتائج الخاصة بك.' : 'This will be escalated into your own Findings & Actions list.',
    lastEvaluation: isAr ? 'آخر تقييم مُسجَّل' : 'Last recorded evaluation',
    forwardHookTitle: isAr ? 'ملاحظة مستقبلية (البند 6)' : 'Forward-looking note (Item 6)',
    consultancyTitle: isAr ? 'إطار الاستشارة' : 'Consultancy Framing',
  };

  const overallColor = overallResult.overallRecommendation === 'escalate_consider' ? 'red' : overallResult.overallRecommendation === 'monitor_closely' ? 'amber' : 'emerald';

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex rounded-lg border border-[#082C6B]/20 overflow-hidden shrink-0">
            <button type="button" onClick={() => setTier('advisory')} className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'advisory' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}>{t.tierAdvisory}</button>
            <button type="button" onClick={() => setTier('operational')} className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'operational' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}>{t.tierOperational}</button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-6">{tier === 'advisory' ? t.tierAdvisoryDesc : t.tierOperationalDesc}</p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs">
            <span className="block font-semibold text-slate-600 mb-1">{t.supplierIdLabel}</span>
            <input type="text" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2" />
          </label>
          <label className="text-xs">
            <span className="block font-semibold text-slate-600 mb-1">{t.kraljicLabel}</span>
            <select value={kraljicQuadrant} onChange={(e) => setKraljicQuadrant(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
              {KRALJIC_QUADRANT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="block font-semibold text-slate-600 mb-1">{t.industryLabel}</span>
            <select value={declaredIndustry} onChange={(e) => setDeclaredIndustry(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
              {DECLARED_INDUSTRY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</option>)}
            </select>
          </label>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.cadenceTitle}</p>
          <div className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg p-3">
            <div>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${effectiveCadence.source === 'client-override' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {effectiveCadence.source === 'client-override' ? t.overriddenBadge : t.recommendedBadge}: {effectiveCadence.cadence === 'annual' ? t.cadenceAnnual : t.cadenceSemiAnnual}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{isAr ? cadenceRecommendation.rationaleAr : cadenceRecommendation.rationaleEn}</p>
              {cadenceSaveStatus === 'saving' && <p className="text-[10px] text-slate-400 mt-1">{t.saving}</p>}
              {cadenceSaveStatus === 'error' && <p className="text-[10px] text-red-700 mt-1 font-semibold">{hasOrg && !canWrite ? t.notAuthorized : t.saveError}</p>}
              {cadenceLoadState === 'unreachable' && <p className="text-[10px] text-amber-700 mt-1">{t.unreachable}</p>}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button type="button" onClick={() => handleCadenceSelect('annual')} className="text-[11px] font-semibold text-[#082C6B] underline">{t.cadenceAnnual}</button>
              <button type="button" onClick={() => handleCadenceSelect('semi_annual')} className="text-[11px] font-semibold text-[#082C6B] underline">{t.cadenceSemiAnnual}</button>
              {effectiveCadence.source === 'client-override' && (
                <button type="button" onClick={clearCadenceOverride} className="text-[11px] font-semibold text-slate-500 underline">{t.resetToRecommendation}</button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.dueStatusTitle}</p>
          {dueStatus.status === 'never_evaluated' && <p className="text-xs text-slate-600">{t.neverEvaluated}</p>}
          {dueStatus.status !== 'never_evaluated' && (
            <p className={`text-xs font-semibold ${dueStatus.status === 'overdue' ? 'text-red-700' : dueStatus.status === 'due_soon' ? 'text-amber-700' : 'text-emerald-700'}`}>
              {dueStatus.status === 'overdue' ? t.overdue : dueStatus.status === 'due_soon' ? t.dueSoon : t.notYetDue}
              {dueStatus.dueDate ? ` -- ${new Date(dueStatus.dueDate).toLocaleDateString(isAr ? 'ar' : 'en-US')}` : ''}
              {dueStatus.daysOverdue != null ? ` (${dueStatus.daysOverdue}${isAr ? ' يوم' : ' days'})` : ''}
            </p>
          )}
          {historyLoadState === 'unreachable' && <p className="text-[10px] text-amber-700 mt-1">{t.unreachable}</p>}
          {lastEvaluationCompletedAt && (
            <p className="text-[10px] text-slate-400 mt-1">{t.lastEvaluation}: {new Date(lastEvaluationCompletedAt).toLocaleDateString(isAr ? 'ar' : 'en-US')} -- {lastOverallRecommendation}</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.evidenceTitle}</p>
          <div className="flex flex-wrap gap-4 mb-2">
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={hasModule06Data} onChange={(e) => setHasModule06Data(e.target.checked)} /><span>{t.hasM06}</span></label>
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={hasModule07Data} onChange={(e) => setHasModule07Data(e.target.checked)} /><span>{t.hasM07}</span></label>
          </div>
          <ul className="text-xs space-y-1">
            {evidenceChecklist.map((item) => (
              <li key={item.category} className={item.present ? 'text-emerald-700' : 'text-slate-400'}>
                {item.present ? '✓' : '○'} {isAr ? item.labelAr : item.labelEn}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.tensionTitle}</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={hasActiveEscalation} onChange={(e) => setHasActiveEscalation(e.target.checked)} /><span>{isAr ? 'يوجد تصعيد نشط' : 'Active escalation exists'}</span></label>
            {hasActiveEscalation && (
              <>
                <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={escalationEscalated} onChange={(e) => setEscalationEscalated(e.target.checked)} /><span>{t.tensionEscalated}</span></label>
                <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={escalationCombinedSignal} onChange={(e) => setEscalationCombinedSignal(e.target.checked)} /><span>{t.tensionCombined}</span></label>
                <input type="text" value={escalationIntervention} onChange={(e) => setEscalationIntervention(e.target.value)} className="text-xs border border-slate-300 rounded-lg px-2 py-1" />
              </>
            )}
          </div>
          {tensionResult.tensionFlag && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              {isAr ? tensionResult.tensionNoteAr : tensionResult.tensionNoteEn}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-3">{t.scorecardTitle}</p>
          <div className="space-y-3">
            {SCORECARD_CATEGORY_META.map((meta) => {
              const state = categoryScores[meta.key];
              const rating = scoredCategories.find((s) => s.category === meta.key)?.rating ?? 'strong';
              const ratingColor = rating === 'at_risk' ? 'text-red-700' : rating === 'watch' ? 'text-amber-700' : rating === 'acceptable' ? 'text-slate-600' : 'text-emerald-700';
              return (
                <div key={meta.key} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border-b border-slate-100 pb-3">
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-700">{isAr ? meta.labelAr : meta.labelEn}</p>
                    <p className="text-[10px] text-slate-400">{isAr ? meta.descriptionAr : meta.descriptionEn}</p>
                  </div>
                  <input
                    type="number" min={0} max={100} value={state.score}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const safe = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0; // guards a cleared/non-numeric field against silently rating as NaN
                      setCategoryScores((prev) => ({ ...prev, [meta.key]: { ...prev[meta.key], score: safe } }));
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-2 py-2 w-full"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={state.dataSource}
                      onChange={(e) => setCategoryScores((prev) => ({ ...prev, [meta.key]: { ...prev[meta.key], dataSource: e.target.value as SIDataSourceLike } }))}
                      className="text-xs border border-slate-300 rounded-lg px-2 py-2"
                    >
                      {DATA_SOURCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</option>)}
                    </select>
                    <span className={`text-[10px] font-bold uppercase ${ratingColor}`}>{isAr ? CATEGORY_RATING_LABELS[rating].ar : CATEGORY_RATING_LABELS[rating].en}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`bg-white border rounded-xl p-4 mb-6 ${overallColor === 'red' ? 'border-red-200' : overallColor === 'amber' ? 'border-amber-200' : 'border-emerald-200'}`}>
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.overallTitle}</p>
          <p className={`text-sm font-bold mb-1 ${overallColor === 'red' ? 'text-red-700' : overallColor === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>
            {isAr ? OVERALL_RECOMMENDATION_LABELS[overallResult.overallRecommendation].ar : OVERALL_RECOMMENDATION_LABELS[overallResult.overallRecommendation].en}
          </p>
          <p className="text-xs text-slate-700 mb-1">{isAr ? overallResult.rationaleAr : overallResult.rationaleEn}</p>
          <p className="text-[10px] text-slate-400">{isAr ? overallResult.noCompositeScoreDisclosureAr : overallResult.noCompositeScoreDisclosureEn}</p>
          {shouldEscalateToFindingsActions(overallResult.overallRecommendation) && tier === 'operational' && (
            <p className="text-[10px] text-red-700 mt-2 font-semibold">{t.escalationNote}</p>
          )}

          {tier === 'operational' ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={submitEvaluation}
                disabled={!hasOrg || !canWrite || saveStatus === 'saving'}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#082C6B] text-white disabled:opacity-40"
              >
                {saveStatus === 'saving' ? t.saving : t.recordEvaluation}
              </button>
              {saveStatus === 'saved' && <p className="text-[10px] text-emerald-700 mt-1">{t.savedConfirmation}</p>}
              {saveStatus === 'error' && <p className="text-[10px] text-red-700 mt-1 font-semibold">{saveError ?? (hasOrg && !canWrite ? t.notAuthorized : t.saveError)}</p>}
              {hasOrg && !canWrite && <p className="text-[10px] text-amber-700 mt-1">{t.notAuthorized}</p>}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 mt-2">{t.advisoryNoPersist}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-100 rounded-xl p-3 text-[10px] text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">{t.forwardHookTitle}</p>
            <p>{isAr ? ITEM6_FORWARD_HOOK_NOTE_AR : ITEM6_FORWARD_HOOK_NOTE_EN}</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-3 text-[10px] text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">{t.consultancyTitle}</p>
            <p>{isAr ? CONSULTANCY_FRAMING_NOTE_AR : CONSULTANCY_FRAMING_NOTE_EN}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
