/**
 * Supplier Lifecycle Governance Onboarding -- Item 4 of 7 (12 Sep 2026).
 *
 * Two-tier, client-selectable (same architecture as SupplierCOPQ.tsx /
 * RaciMatrix.tsx / SupplierPreQualification.tsx). ISC is a strategic/
 * tactical consultancy first -- both tiers are permanent, equally
 * legitimate product directions, not a "real version" and a fallback:
 *   - Advisory (default, consultancy-native): generates a sourced
 *     onboarding checklist from @/lib/supplierOnboarding's
 *     generateOnboardingChecklist(), which the client executes in their
 *     own systems. Zero required persistence. Names who SHOULD hold the
 *     RACI sign-off role (ONBOARDING_SIGNOFF_RACI_GUIDANCE) as GUIDANCE
 *     only -- never enforced on this tier.
 *   - Operational (opt-in, deeper): reads/writes the client's own
 *     organization's real onboarding record via /api/onboarding/current,
 *     /api/onboarding/register and /api/onboarding/events. Write controls
 *     are shown only to a signed-in user who is either this org's
 *     org_admin or the org's current RACI Accountable holder for
 *     'onboarding_signoff' (fetched from /api/raci/current) --
 *     re-enforced server-side on every write, never trusted from this
 *     component alone. This is the closest ISC comes to operational
 *     involvement -- kept strictly opt-in, never the assumed default.
 * Both tiers share the identical checklist-generation and validation logic
 * in supplierOnboarding.ts; they differ only in what gets persisted and
 * enforced.
 *
 * GATING ON ITEM 3's REAL ASL STATE: this page fetches the supplier's
 * current ASL state from /api/pre-qualification/current (Item 3's real,
 * live endpoint -- unlike Item 3's own upstream Module 04 gap, this
 * upstream dependency DOES have a real endpoint, so both tiers use it
 * directly rather than a manual-entry fallback) when the caller has an
 * organization; otherwise a manual onASL/status entry is offered so the
 * page still degrades honestly for a signed-out or no-org visitor.
 *
 * GRADUATION TO THE SCORECARD -- DISCLOSED, NOT FABRICATED: the Supplier
 * Scorecard's roster (SupplierScorecard.tsx) is a per-USER, full-replace
 * JSONB blob (GET/PUT /api/scorecard-roster), not an org-scoped, appendable
 * table -- and the person completing onboarding (an org_admin or RACI
 * Accountable holder) is not necessarily the same person who owns that
 * Scorecard roster. A silent, server-triggered write into a different
 * user's personal roster would be exactly the kind of fabricated,
 * data-unsafe cross-feature side effect Rule 1/Rule 3 warn against. The
 * honest, real, achievable implementation here is a one-click "Add to
 * Scorecard" action, in the SAME browser session as the person who just
 * completed onboarding, that reads the caller's own current roster and
 * appends the new supplier -- reusing the exact same endpoint
 * SupplierScorecard.tsx itself uses, executed as an explicit action, never
 * a hidden automatic transition.
 *
 * Visual primitives: a CARD checklist grouped by the four sourced domains
 * (Advisory); a TABLE-plus-checkbox tracker for the Operational tier's
 * persisted completion state, matching this app's existing register-table
 * convention; a banner ALERT for a stalled onboarding.
 *
 * Bilingual EN/AR from the start (Rule 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  ONBOARDING_STEP_CATALOG,
  generateOnboardingChecklist,
  computeCurrentOnboardingState,
  validateStepCompletion,
  detectStalledOnboarding,
  computeGraduationReadiness,
  type ASLGateSnapshotLike,
  type Module03ContactHint,
  type OnboardingStepEventLike,
  type OnboardingStepCategory,
} from '@/lib/supplierOnboarding';
import {
  computeRecommendedGovernanceTier,
  resolveEffectiveGovernanceTier,
  type GovernanceTierOverrideLike,
} from '@/lib/supplierGovernanceTierRecommendation';

type Tier = 'advisory' | 'operational';

const KRALJIC_QUADRANT_OPTIONS: { value: string; en: string; ar: string }[] = [
  { value: '', en: '-- not yet scored --', ar: '-- لم يتم التقييم بعد --' },
  { value: 'strategic', en: 'Strategic', ar: 'استراتيجي' },
  { value: 'bottleneck', en: 'Bottleneck', ar: 'عنق الزجاجة' },
  { value: 'leverage', en: 'Leverage', ar: 'ذو نفوذ تفاوضي' },
  { value: 'non-critical', en: 'Non-critical / Routine', ar: 'روتيني / غير حرج' },
];

/* Manually-synced mirror of kpiBenchmarksByIndustry.ts's INDUSTRIES labels (Standalone-First Architecture, Rule 3) -- reused here rather than inventing a parallel industry taxonomy. */
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

const CATEGORY_ORDER: OnboardingStepCategory[] = ['legal_compliance', 'banking_financial', 'operational_readiness', 'risk_screening'];

const CATEGORY_LABELS: Record<OnboardingStepCategory, { en: string; ar: string }> = {
  legal_compliance: { en: 'Legal / Compliance', ar: 'الشؤون القانونية / الامتثال' },
  banking_financial: { en: 'Banking / Financial', ar: 'الشؤون المصرفية / المالية' },
  operational_readiness: { en: 'Operational Readiness', ar: 'الجاهزية التشغيلية' },
  risk_screening: { en: 'Risk / Compliance Screening', ar: 'فحص المخاطر / الامتثال' },
};

interface OnboardingEventRow {
  id: number;
  supplierId: string;
  stepKey: string;
  action: 'completed' | 'reopened';
  actorUserId: number;
  note: string | null;
  verificationChannelNote: string | null;
  firstPaymentHoldAcknowledged: boolean | null;
  createdAt: string;
}

export function SupplierOnboarding() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [supplierId, setSupplierId] = useState('SUP-RAWABI-01');
  const [esgApplicable, setEsgApplicable] = useState(false);

  // Governance-tier-recommendation inputs (Module 02 Kraljic quadrant + client's declared
  // industry) -- manual entry until a real Module 02/client-profile UI feeds them directly,
  // same disclosed-fallback pattern as the Module 03 contact hints below.
  const [kraljicQuadrant, setKraljicQuadrant] = useState('');
  const [declaredIndustry, setDeclaredIndustry] = useState('');
  const [tierOverride, setTierOverride] = useState<GovernanceTierOverrideLike | null>(null);

  // Manual ASL entry fallback -- used only when the org-scoped live ASL fetch is unavailable.
  const [manualOnAsl, setManualOnAsl] = useState(true);
  const [manualStatus, setManualStatus] = useState('approved');
  const [liveAslGate, setLiveAslGate] = useState<ASLGateSnapshotLike | null>(null);
  const [aslLoadState, setAslLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');

  // Module 03 contact reuse (manual entry until a real Module 03 UI feeds it directly)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Operational-tier state
  const [events, setEvents] = useState<OnboardingEventRow[]>([]);
  const [isAccountableHolder, setIsAccountableHolder] = useState(false);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [holdAcknowledged, setHoldAcknowledged] = useState(false);
  const [graduateStatus, setGraduateStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const canWrite = isOrgAdmin || isAccountableHolder;

  // Governance-tier recommendation: recommend, never enforce. Pre-selects the tier toggle
  // below but a client override, once set, always wins over a freshly recomputed
  // recommendation -- until the client explicitly changes it again (resolveEffectiveGovernanceTier).
  const governanceRecommendation = useMemo(
    () => computeRecommendedGovernanceTier({ kraljicQuadrant, declaredIndustry }),
    [kraljicQuadrant, declaredIndustry],
  );
  const effectiveGovernance = useMemo(
    () => resolveEffectiveGovernanceTier(governanceRecommendation, tierOverride),
    [governanceRecommendation, tierOverride],
  );
  const tier: Tier = effectiveGovernance.tier;
  const [overrideLoadState, setOverrideLoadState] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');
  const [overrideSaveStatus, setOverrideSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  /*
   * QA-caught fix (12 Sep 2026, follow-up review): the override was previously
   * component-state-only (a bare useState), which meant it was silently lost on
   * page reload -- directly contradicting this module's own documented contract
   * that a client override "always wins ... until the client explicitly changes
   * it again." A reload is not the client changing it. Now durably persisted via
   * /api/governance-tier (governance_tier_override_events, append-only, write-
   * gated identically to onboarding events: org_admin or the RACI Accountable
   * holder for 'onboarding_signoff') when the caller has an organization; for a
   * signed-out or no-org visitor there is no organization to scope a durable
   * override to, so it honestly falls back to component-state-only for that
   * session, same disclosed-fallback precedent as the manual ASL entry above.
   */
  useEffect(() => {
    if (!hasOrg || !supplierId.trim()) { setOverrideLoadState('idle'); return; }
    let cancelled = false;
    setOverrideLoadState('loading');
    fetch(`/api/governance-tier/current?supplierId=${encodeURIComponent(supplierId.trim())}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        if (data.ok && data.override) {
          setTierOverride({ tier: data.override.tier, overriddenAt: data.override.overriddenAt });
        } else {
          setTierOverride(null);
        }
        setOverrideLoadState('live');
      })
      .catch(() => { if (!cancelled) setOverrideLoadState('unreachable'); });
    return () => { cancelled = true; };
  }, [hasOrg, supplierId]);

  /** Posts one override event; returns whether it was actually accepted -- callers must not
   *  update local UI state as if an override succeeded until this resolves true, or a
   *  non-authorized click would show a false "Manually overridden" badge that was never
   *  actually persisted. */
  const persistOverride = async (action: 'set' | 'clear', nextTier?: Tier): Promise<boolean> => {
    setOverrideSaveStatus('saving');
    try {
      const res = await fetch('/api/governance-tier/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(action === 'set' ? { supplierId: supplierId.trim(), action, tier: nextTier } : { supplierId: supplierId.trim(), action }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { setOverrideSaveStatus('error'); return false; }
      setOverrideSaveStatus('idle');
      return true;
    } catch {
      setOverrideSaveStatus('error');
      return false;
    }
  };

  const handleTierSelect = async (nextTier: Tier) => {
    if (!hasOrg) {
      // No organization to durably scope this to -- honest local-only fallback for this session.
      setTierOverride({ tier: nextTier, overriddenAt: new Date().toISOString(), overriddenBy: user?.email ?? undefined });
      return;
    }
    if (!canWrite) {
      // Same write-gate as the Operational tier's own recording controls -- do not optimistically
      // show an override that the server will reject.
      setOverrideSaveStatus('error');
      return;
    }
    const ok = await persistOverride('set', nextTier);
    if (ok) setTierOverride({ tier: nextTier, overriddenAt: new Date().toISOString(), overriddenBy: user?.email ?? undefined });
  };
  const clearTierOverride = async () => {
    if (!hasOrg) { setTierOverride(null); return; }
    if (!canWrite) { setOverrideSaveStatus('error'); return; }
    const ok = await persistOverride('clear');
    if (ok) setTierOverride(null);
  };

  // Fetch this org's live ASL state for the entered supplierId (Item 3's real endpoint).
  useEffect(() => {
    if (!hasOrg || !supplierId.trim()) { setAslLoadState('idle'); return; }
    let cancelled = false;
    setAslLoadState('loading');
    fetch('/api/pre-qualification/current', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        const row = data.ok ? (data.current as Array<{ supplierId: string; onASL: boolean; status: string }>).find((c) => c.supplierId === supplierId.trim()) : null;
        setLiveAslGate(row ? { supplierId: row.supplierId, onASL: row.onASL, status: row.status } : { supplierId: supplierId.trim(), onASL: false, status: 'NEVER_ASSESSED' });
        setAslLoadState('live');
      })
      .catch(() => { if (!cancelled) setAslLoadState('unreachable'); });
    return () => { cancelled = true; };
  }, [hasOrg, supplierId]);

  const effectiveGate: ASLGateSnapshotLike = useMemo(() => {
    if (hasOrg && aslLoadState === 'live' && liveAslGate) return liveAslGate;
    return { supplierId: supplierId.trim(), onASL: manualOnAsl, status: manualStatus };
  }, [hasOrg, aslLoadState, liveAslGate, supplierId, manualOnAsl, manualStatus]);

  const contactHint: Module03ContactHint = useMemo(() => ({
    contactNameKnown: contactName || undefined,
    contactEmailKnown: contactEmail || undefined,
    contactPhoneKnown: contactPhone || undefined,
  }), [contactName, contactEmail, contactPhone]);

  const checklist = useMemo(
    () => generateOnboardingChecklist({ supplierId: supplierId.trim(), aslGate: effectiveGate, esgApplicable, contactHint }),
    [supplierId, effectiveGate, esgApplicable, contactHint],
  );

  // Operational tier: load persisted events + RACI accountable-holder check.
  useEffect(() => {
    if (tier !== 'operational' || !supplierId.trim()) return;
    let cancelled = false;
    setLoadState('loading');
    Promise.all([
      fetch(`/api/onboarding/register?supplierId=${encodeURIComponent(supplierId.trim())}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch('/api/raci/current', { credentials: 'include' }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    ])
      .then(([registerRes, raciRes]) => {
        if (cancelled) return;
        setEvents(registerRes.ok ? registerRes.events : []);
        if (raciRes.ok) {
          const row = (raciRes.current as Array<{ activityKey: string; role: string; userIds: number[] }>).find(
            (c) => c.activityKey === 'onboarding_signoff' && c.role === 'A',
          );
          setIsAccountableHolder(!!row && !!user && row.userIds.includes(user.id));
        }
        setLoadState('live');
      })
      .catch(() => { if (!cancelled) setLoadState('unreachable'); });
    return () => { cancelled = true; };
  }, [tier, supplierId, saveStatus, user]);

  const eventLikes: OnboardingStepEventLike[] = useMemo(
    () => events.map((e) => ({ id: e.id, supplierId: e.supplierId, stepKey: e.stepKey, action: e.action, actorUserId: e.actorUserId, note: e.note, verificationChannelNote: e.verificationChannelNote, firstPaymentHoldAcknowledged: e.firstPaymentHoldAcknowledged, createdAt: e.createdAt })),
    [events],
  );
  const currentState = useMemo(() => computeCurrentOnboardingState(supplierId.trim(), eventLikes, checklist), [supplierId, eventLikes, checklist]);
  const stalledAlert = useMemo(() => detectStalledOnboarding(currentState), [currentState]);
  const graduation = useMemo(() => computeGraduationReadiness(currentState), [currentState]);

  const t = {
    title: isAr ? 'تهيئة الموردين' : 'Supplier Onboarding',
    subtitle: isAr
      ? 'تُفعَّل التهيئة فقط للموردين المعتمدين فعلياً في القائمة المعتمدة (البند 3) -- وليست نموذجاً مستقلاً'
      : 'Onboarding is gated on Item 3\'s own real ASL approval -- never a standalone form',
    tierAdvisory: isAr ? 'المستوى الاستشاري' : 'Advisory Tier',
    tierOperational: isAr ? 'المستوى التشغيلي' : 'Operational Tier',
    tierAdvisoryDesc: isAr ? 'قائمة تحقق موثّقة المصدر ينفّذها العميل بأنظمته الخاصة -- بلا تخزين إلزامي' : 'A sourced checklist the client executes in their own systems -- no required persistence',
    tierOperationalDesc: isAr ? 'تحفظ ISC سجل التهيئة الفعلي كسجل مرجعي للعميل مع تنبيه على التهيئة المتوقفة' : "ISC persists the real onboarding record as the client's system of record, with stalled-onboarding alerting",
    supplierIdLabel: isAr ? 'معرّف المورّد' : 'Supplier ID',
    esgLabel: isAr ? 'ينطبق استبيان الاستدامة (ESG) على هذه المؤسسة' : 'ESG questionnaire applies for this organization',
    aslStatusLabel: isAr ? 'حالة القائمة المعتمدة (مباشرة من البند 3)' : 'Live ASL status (from Item 3)',
    /* QA-caught fix (12 Sep 2026, Advisory-tier scenario, dimension 8 Decision-Ready standard): the checkbox itself directly sets onASL true/false -- the label must say what the control DOES, not just name the section, or a real user reads it as a mode toggle and cannot tell that unchecking it means "declare this supplier not approved". */
    manualAslLabel: isAr ? 'هذا المورّد معتمد حالياً في القائمة المعتمدة (إدخال يدوي -- لا توجد مؤسسة مرتبطة بالحساب)' : 'This supplier is currently approved on the ASL (manual entry -- no organization linked to this account)',
    gatedFalseTitle: isAr ? 'لا يمكن بدء التهيئة' : 'Onboarding cannot start',
    contactHintTitle: isAr ? 'بيانات الاتصال المكتشفة سابقاً (الوحدة 03، اختياري)' : 'Previously-discovered contact info (Module 03, optional)',
    signoffGuidanceTitle: isAr ? 'إرشاد الاعتماد (مصفوفة RACI)' : 'Sign-off guidance (RACI)',
    stepsTitle: isAr ? 'قائمة التحقق' : 'Checklist',
    requiredBadge: isAr ? 'مطلوب' : 'Required',
    optionalBadge: isAr ? 'اختياري' : 'Optional',
    verificationLabel: isAr ? 'قناة التحقق المستقلة' : 'Independent verification channel',
    holdLabel: isAr ? 'تم الإقرار بتعليق أول دفعة للمراجعة' : 'First-payment hold acknowledged',
    markComplete: isAr ? 'تعليم كمكتمل' : 'Mark complete',
    reopen: isAr ? 'إعادة الفتح' : 'Reopen',
    completedBadge: isAr ? '✓ مكتمل' : '✓ Completed',
    stalledTitle: isAr ? 'تنبيه: التهيئة متوقفة' : 'Alert: onboarding stalled',
    graduationTitle: isAr ? 'الترقية إلى بطاقة تقييم الموردين' : 'Graduation to Supplier Scorecard',
    graduationReady: isAr ? 'جاهز للإضافة إلى القائمة النشطة' : 'Ready to add to the active roster',
    addToScorecard: isAr ? 'إضافة إلى بطاقة التقييم' : 'Add to Scorecard',
    graduated: isAr ? '✓ أُضيف إلى بطاقة التقييم' : '✓ Added to Scorecard',
    notAuthorizedNote: isAr ? 'حسابك ليس مسؤول المنظمة ولا المعتمد (Accountable) المعيّن لاعتماد التهيئة، لذا عناصر التسجيل هنا للعرض فقط.' : "Your account is neither this organization's admin nor the Accountable holder for onboarding sign-off, so the recording controls here are view-only.",
    noOrgNote: isAr ? 'حسابك غير مرتبط حالياً بأي مؤسسة.' : 'Your account is not currently linked to an organization.',
    unreachable: isAr ? 'تعذّر الوصول إلى الخادم' : 'Could not reach the server',
    save: isAr ? 'حفظ' : 'Save',
    saved: isAr ? '✓ تم الحفظ' : '✓ Saved',
    kraljicLabel: isAr ? 'ربع مصفوفة كرالييك (الوحدة 02)' : 'Kraljic quadrant (Module 02)',
    industryLabel: isAr ? 'قطاع العميل المُعلَن' : "Client's declared industry",
    recommendationTitle: isAr ? 'توصية الطبقة (يمكن تجاوزها دائماً)' : 'Tier recommendation (always overridable)',
    recommendedBadge: isAr ? 'موصى به' : 'Recommended',
    overriddenBadge: isAr ? 'تم التجاوز يدوياً' : 'Manually overridden',
    resetToRecommendation: isAr ? 'العودة إلى التوصية' : 'Reset to recommendation',
    overrideNotAuthorized: isAr
      ? 'حسابك ليس مسؤول المنظمة ولا المعتمد (Accountable) المعيّن لاعتماد التهيئة، لذا لا يمكنك تغيير طبقة الحوكمة هنا.'
      : "Your account is neither this organization's admin nor the Accountable holder for onboarding sign-off, so you cannot change the governance tier here.",
    overrideSaveError: isAr ? 'تعذّر حفظ هذا التجاوز' : 'Could not save this override',
    overrideSaving: isAr ? 'جارٍ الحفظ…' : 'Saving…',
    industryClassificationNote: isAr ? governanceRecommendation.industryClassificationNoteAr : governanceRecommendation.industryClassificationNoteEn,
  };

  const submitStepEvent = async (stepKey: string, action: 'completed' | 'reopened') => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/onboarding/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: supplierId.trim(),
          stepKey,
          action,
          verificationChannelNote: stepKey === 'banking_details_verified' ? verificationNote : undefined,
          firstPaymentHoldAcknowledged: stepKey === 'banking_details_verified' ? holdAcknowledged : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveStatus('error');
        setSaveError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setSaveStatus('saved');
      setVerificationNote('');
      setHoldAcknowledged(false);
    } catch {
      setSaveStatus('error');
      setSaveError(isAr ? 'خطأ في الشبكة' : 'Network error');
    }
  };

  const addToScorecard = async () => {
    setGraduateStatus('saving');
    try {
      const getRes = await fetch('/api/scorecard-roster', { credentials: 'include' });
      const getData = await getRes.json().catch(() => null);
      const existing = getData?.ok && getData.roster ? getData.roster : { suppliers: [], activeId: '' };
      const newId = `sup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const newSupplierRecord = { id: newId, name: contactName || supplierId.trim(), tier: 'Strategic', subScores: {} };
      const nextRoster = { suppliers: [...(existing.suppliers ?? []), newSupplierRecord], activeId: newId };
      const putRes = await fetch('/api/scorecard-roster', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nextRoster),
      });
      const putData = await putRes.json().catch(() => null);
      setGraduateStatus(putRes.ok && putData?.ok ? 'done' : 'error');
    } catch {
      setGraduateStatus('error');
    }
  };

  const stepsByCategory = useMemo(() => {
    const map = new Map<OnboardingStepCategory, typeof checklist.steps>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const step of checklist.steps) map.get(step.category)!.push(step);
    return map;
  }, [checklist]);

  return (
    <div className={`min-h-screen bg-slate-50 px-4 sm:px-6 lg:px-10 py-8 ${isAr ? 'rtl text-right' : 'ltr text-left'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082C6B]">{t.title}</h1>
            <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex rounded-lg border border-[#082C6B]/20 overflow-hidden shrink-0">
            <button type="button" onClick={() => handleTierSelect('advisory')} className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'advisory' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}>{t.tierAdvisory}</button>
            <button type="button" onClick={() => handleTierSelect('operational')} className={`px-4 py-2 text-xs font-semibold transition-colors ${tier === 'operational' ? 'bg-[#082C6B] text-white' : 'bg-white text-[#082C6B] hover:bg-[#082C6B]/5'}`}>{t.tierOperational}</button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-6">{tier === 'advisory' ? t.tierAdvisoryDesc : t.tierOperationalDesc}</p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.recommendationTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.kraljicLabel}</span>
              <select value={kraljicQuadrant} onChange={(e) => setKraljicQuadrant(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                {KRALJIC_QUADRANT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">{t.industryLabel}</span>
              <select value={declaredIndustry} onChange={(e) => setDeclaredIndustry(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                {DECLARED_INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{isAr ? opt.ar : opt.en}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-start justify-between gap-3 bg-slate-50 rounded-lg p-3">
            <div>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${effectiveGovernance.source === 'client-override' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {effectiveGovernance.source === 'client-override' ? t.overriddenBadge : t.recommendedBadge}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{isAr ? governanceRecommendation.rationaleAr : governanceRecommendation.rationaleEn}</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{t.industryClassificationNote}</p>
              {overrideSaveStatus === 'saving' && <p className="text-[10px] text-slate-400 mt-1">{t.overrideSaving}</p>}
              {overrideSaveStatus === 'error' && (
                <p className="text-[10px] text-red-700 mt-1 font-semibold">{hasOrg && !canWrite ? t.overrideNotAuthorized : t.overrideSaveError}</p>
              )}
              {overrideSaveStatus !== 'error' && hasOrg && !canWrite && (
                <p className="text-[10px] text-amber-700 mt-1">{t.overrideNotAuthorized}</p>
              )}
              {hasOrg && overrideLoadState === 'unreachable' && <p className="text-[10px] text-amber-700 mt-1">{t.unreachable}</p>}
            </div>
            {effectiveGovernance.source === 'client-override' && (
              <button type="button" onClick={clearTierOverride} className="text-[11px] font-semibold text-[#082C6B] underline shrink-0">{t.resetToRecommendation}</button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs">
            <span className="block font-semibold text-slate-600 mb-1">{t.supplierIdLabel}</span>
            <input type="text" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2" />
          </label>
          <label className="text-xs flex items-center gap-2 mt-5 sm:mt-0">
            <input type="checkbox" checked={esgApplicable} onChange={(e) => setEsgApplicable(e.target.checked)} />
            <span>{t.esgLabel}</span>
          </label>
          {hasOrg ? (
            <div className="text-xs sm:col-span-2">
              <span className="font-semibold text-slate-600">{t.aslStatusLabel}: </span>
              {aslLoadState === 'loading' && <span className="text-slate-400">…</span>}
              {aslLoadState === 'unreachable' && <span className="text-amber-700">{t.unreachable}</span>}
              {aslLoadState === 'live' && liveAslGate && (
                <span className={liveAslGate.onASL ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>{liveAslGate.status}{liveAslGate.onASL ? '' : ` (${isAr ? 'غير معتمد' : 'not approved'})`}</span>
              )}
            </div>
          ) : (
            <>
              <label className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={manualOnAsl} onChange={(e) => setManualOnAsl(e.target.checked)} />
                <span>{t.manualAslLabel}</span>
              </label>
              <label className="text-xs">
                <input type="text" value={manualStatus} onChange={(e) => setManualStatus(e.target.value)} placeholder="approved" className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2" />
              </label>
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.contactHintTitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={isAr ? 'الاسم' : 'Name'} className="text-xs border border-slate-300 rounded-lg px-2 py-2" />
            <input type="text" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} className="text-xs border border-slate-300 rounded-lg px-2 py-2" />
            <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={isAr ? 'الهاتف' : 'Phone'} className="text-xs border border-slate-300 rounded-lg px-2 py-2" />
          </div>
        </div>

        {!checklist.gated ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-red-800">{t.gatedFalseTitle}</p>
            <p className="text-xs text-red-700 mt-1">{isAr ? checklist.gateReasonAr : checklist.gateReasonEn}</p>
          </div>
        ) : (
          <>
            {checklist.signoffGuidance && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-blue-900">{t.signoffGuidanceTitle}</p>
                <p className="text-xs text-blue-800 mt-1">
                  {isAr ? 'مسؤول (A)' : 'Accountable (A)'}: <strong>{isAr ? checklist.signoffGuidance.accountableArchetypeAr : checklist.signoffGuidance.accountableArchetypeEn}</strong>
                  {' · '}
                  {isAr ? 'منفّذ (R)' : 'Responsible (R)'}: <strong>{isAr ? checklist.signoffGuidance.responsibleArchetypeAr : checklist.signoffGuidance.responsibleArchetypeEn}</strong>
                </p>
                <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">{isAr ? checklist.signoffGuidance.noteAr : checklist.signoffGuidance.noteEn}</p>
              </div>
            )}

            {tier === 'operational' && stalledAlert.stalled && stalledAlert.messageEn && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-amber-900">{t.stalledTitle}</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">{isAr ? stalledAlert.messageAr : stalledAlert.messageEn}</p>
              </div>
            )}

            {tier === 'operational' && loadState === 'unreachable' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 text-xs text-amber-800">{t.unreachable}</div>
            )}

            {tier === 'operational' && (
              <>
                {!hasOrg && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">{t.noOrgNote}</p>}
                {hasOrg && !canWrite && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">{t.notAuthorizedNote}</p>}
              </>
            )}

            {CATEGORY_ORDER.map((cat) => {
              const steps = stepsByCategory.get(cat) ?? [];
              if (steps.length === 0) return null;
              return (
                <div key={cat} className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-[#082C6B] mb-3">{isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}</p>
                  <div className="space-y-3">
                    {steps.map((step) => {
                      const isComplete = currentState.completedStepKeys.includes(step.key);
                      const isBanking = step.key === 'banking_details_verified';
                      return (
                        <div key={step.key} className="border border-slate-100 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {isAr ? step.labelAr : step.labelEn}{' '}
                                <span className={`ms-1 text-[10px] font-normal px-1.5 py-0.5 rounded ${step.required ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                  {step.required ? t.requiredBadge : t.optionalBadge}
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{isAr ? step.whyItMattersAr : step.whyItMattersEn}</p>
                              {step.prefillHintEn && <p className="text-[11px] text-emerald-700 mt-1">{isAr ? step.prefillHintAr : step.prefillHintEn}</p>}
                              <p className="text-[10px] text-slate-400 mt-1">{isAr ? step.sourceAr : step.sourceEn}</p>
                            </div>
                            {tier === 'operational' && (
                              isComplete ? (
                                <div className={isAr ? 'text-left shrink-0' : 'text-right shrink-0'}>
                                  <span className="text-xs font-semibold text-emerald-700 block">{t.completedBadge}</span>
                                  <button type="button" disabled={!canWrite} onClick={() => submitStepEvent(step.key, 'reopened')} className="text-[10px] text-[#082C6B]/70 hover:text-[#082C6B] underline disabled:opacity-40">{t.reopen}</button>
                                </div>
                              ) : (
                                <button type="button" disabled={!canWrite} onClick={() => submitStepEvent(step.key, 'completed')} className="shrink-0 text-[10px] font-semibold px-2 py-1.5 rounded-lg bg-[#082C6B] text-white disabled:opacity-40 hover:bg-[#082C6B]/90 transition-colors">{t.markComplete}</button>
                              )
                            )}
                          </div>
                          {tier === 'operational' && isBanking && !isComplete && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input type="text" disabled={!canWrite} value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} placeholder={t.verificationLabel} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 disabled:opacity-50" />
                              <label className="text-xs flex items-center gap-2">
                                <input type="checkbox" disabled={!canWrite} checked={holdAcknowledged} onChange={(e) => setHoldAcknowledged(e.target.checked)} />
                                <span>{t.holdLabel}</span>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {tier === 'operational' && saveStatus === 'saved' && <p className="text-xs font-semibold text-emerald-700 mb-4">{t.saved}</p>}
            {tier === 'operational' && saveStatus === 'error' && <p className="text-xs font-semibold text-red-700 mb-4">{saveError}</p>}

            {tier === 'operational' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#082C6B]">{t.graduationTitle}</p>
                <p className="text-xs text-slate-600 mt-1">{isAr ? graduation.reasonAr : graduation.reasonEn}</p>
                {graduation.readyToGraduate && graduateStatus !== 'done' && (
                  <button type="button" onClick={addToScorecard} disabled={graduateStatus === 'saving'} className="mt-3 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-700 text-white disabled:opacity-50 hover:bg-emerald-800 transition-colors">{t.addToScorecard}</button>
                )}
                {graduateStatus === 'done' && <p className="text-xs font-semibold text-emerald-700 mt-3">{t.graduated}</p>}
                {graduateStatus === 'error' && <p className="text-xs font-semibold text-red-700 mt-3">{t.unreachable}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
