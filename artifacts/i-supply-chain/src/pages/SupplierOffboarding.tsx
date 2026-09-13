/**
 * Supplier Offboarding & Transition -- Item 7 of 7 (13 Sep 2026).
 *
 * WHAT THIS IS NOT: this page is NOT a re-skin of Item 6's blacklist
 * finalize/reverse controls, and it does NOT itself decide WHY a supplier
 * is leaving -- see supplierOffboarding.ts's file header for the full
 * sourced methodology (ISO 44001 Stage 8 / Financier Worldwide /
 * SupplierGateway / Vanta) and the "what this is not" distinction. This is
 * the neutral, cause-agnostic logistics of winding a supplier relationship
 * down, regardless of why it is ending.
 *
 * AUTHORIZATION BAR: deliberately the STANDARD org_admin-OR-RACI-
 * Accountable-holder gate for every action here (open/checklist/close/
 * reopen) -- NOT escalated the way Item 6's finalize/reverse are. See
 * supplierOffboarding.ts's own header for the disclosed rationale.
 *
 * Two-tier, client-selectable (same architecture as every prior item):
 *   - Advisory (default): computeAdvisoryTransitionPlan() -- a recommended
 *     checklist with a primary approach AND a genuine alternative (Rule 8),
 *     zero persistence. The client runs its own transition.
 *   - Operational (opt-in): ISC persists the transition record via
 *     /api/offboarding. Opening fixes the trigger reason/cooperation level
 *     for the life of the record; checklist items are updated one at a
 *     time; closing is gated on every mandatory item being complete or
 *     not applicable, and -- for ordinary-business exits only -- writes a
 *     real, guarded cross-reference into Item 3's own ASL register.
 *
 * Bilingual EN/AR from the start (Rule 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  OFFBOARDING_TRIGGER_REASONS,
  OFFBOARDING_TRIGGER_LABELS,
  COOPERATION_LEVEL_LABELS,
  COOPERATION_LEVEL_SOURCE_EN,
  COOPERATION_LEVEL_SOURCE_AR,
  CHECKLIST_REQUIREMENT_LABELS,
  TRANSITION_CHECKLIST_ITEM_KEYS,
  inferCooperationLevel,
  determineChecklistRequirement,
  isGatingRequirement,
  computeAdvisoryTransitionPlan,
  suggestOffboardingTriggerContext,
  CONSULTANCY_FRAMING_NOTE_EN,
  CONSULTANCY_FRAMING_NOTE_AR,
  type OffboardingTriggerReason,
  type CooperationLevel,
  type TransitionChecklistItemKey,
  type TransitionItemStatus,
  type ChecklistRequirementLevel,
} from '@/lib/supplierOffboarding';

type Tier = 'advisory' | 'operational';

const ITEM_STATUSES: TransitionItemStatus[] = ['pending', 'in_progress', 'complete', 'not_applicable'];

export function SupplierOffboarding() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [tier, setTier] = useState<Tier>('advisory');
  const [supplierId, setSupplierId] = useState('');

  // Advisory tier inputs
  const [triggerReason, setTriggerReason] = useState<OffboardingTriggerReason>('natural_contract_end');
  const [cooperationOverrideOn, setCooperationOverrideOn] = useState(false);
  const [cooperationOverride, setCooperationOverride] = useState<CooperationLevel>('cooperative');
  const [replacementSupplierNamed, setReplacementSupplierNamed] = useState(false);
  const [hasOpenCommitments, setHasOpenCommitments] = useState(false);
  const [openCommitmentsDetail, setOpenCommitmentsDetail] = useState('');
  // Disclosed manual stand-ins for Item 6 / Item 3 state, same pattern
  // Item 6 itself used for its own Item 1/5 evidence inputs, until a live
  // cross-page feed exists.
  const [manualIsBlacklisted, setManualIsBlacklisted] = useState(false);
  const [manualAslKeepsOn, setManualAslKeepsOn] = useState(true);

  const inferredLevel = useMemo(() => inferCooperationLevel(triggerReason), [triggerReason]);

  const advisoryPlan = useMemo(
    () =>
      computeAdvisoryTransitionPlan({
        triggerReason,
        cooperationLevelOverride: cooperationOverrideOn ? cooperationOverride : null,
        replacementSupplierNamed,
        blacklistState: { isBlacklisted: manualIsBlacklisted },
        aslState: { status: manualAslKeepsOn ? 'approved' : 'revoked', keepsOnASL: manualAslKeepsOn },
        openCommitments: { hasOpenCommitments, detailEn: openCommitmentsDetail || undefined, detailAr: openCommitmentsDetail || undefined },
      }),
    [triggerReason, cooperationOverrideOn, cooperationOverride, replacementSupplierNamed, manualIsBlacklisted, manualAslKeepsOn, hasOpenCommitments, openCommitmentsDetail],
  );

  const suggestedContext = useMemo(
    () => suggestOffboardingTriggerContext({ isBlacklisted: manualIsBlacklisted }, { status: manualAslKeepsOn ? 'approved' : 'revoked', keepsOnASL: manualAslKeepsOn }),
    [manualIsBlacklisted, manualAslKeepsOn],
  );

  // Operational-tier RACI/state
  const [isOffboardingAccountableHolder, setIsOffboardingAccountableHolder] = useState(false);
  const canWrite = isOrgAdmin || isOffboardingAccountableHolder;

  interface OpCurrentState {
    isOpen: boolean;
    isClosed: boolean;
    triggerReason: OffboardingTriggerReason | null;
    cooperationLevel: CooperationLevel | null;
    replacementSupplierNamed: boolean;
    checklist: { key: TransitionChecklistItemKey; requirement: ChecklistRequirementLevel; status: TransitionItemStatus }[];
  }
  const [currentState, setCurrentState] = useState<OpCurrentState | null>(null);
  const [stateLoadStatus, setStateLoadStatus] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');

  const [openTrigger, setOpenTrigger] = useState<OffboardingTriggerReason>('natural_contract_end');
  const [openCooperation, setOpenCooperation] = useState<CooperationLevel>('cooperative');
  const [openReplacementNamed, setOpenReplacementNamed] = useState(false);
  const [openStatus, setOpenStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const [checklistBusyKey, setChecklistBusyKey] = useState<TransitionChecklistItemKey | null>(null);
  const [closeStatus, setCloseStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [aslCrossReferenceNote, setAslCrossReferenceNote] = useState<string | null>(null);
  const [reopenStatus, setReopenStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  // Pre-fill the open form from the trigger-context suggestion the first
  // time it becomes available -- a usability convenience only, never
  // overriding a value the user has already touched.
  useEffect(() => {
    if (suggestedContext.suggestedTrigger) setOpenTrigger(suggestedContext.suggestedTrigger);
    if (suggestedContext.suggestedCooperationLevel) setOpenCooperation(suggestedContext.suggestedCooperationLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedContext.suggestedTrigger, suggestedContext.suggestedCooperationLevel]);

  // RACI Accountable-holder check for 'offboarding_decision'.
  useEffect(() => {
    if (!hasOrg) { setIsOffboardingAccountableHolder(false); return; }
    let cancelled = false;
    fetch('/api/raci/current', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        const rows = data.current as Array<{ activityKey: string; role: string; userIds: number[] }>;
        const row = rows.find((r) => r.activityKey === 'offboarding_decision' && r.role === 'A');
        setIsOffboardingAccountableHolder(!!row && !!user?.id && row.userIds.includes(user.id));
      })
      .catch(() => { if (!cancelled) setIsOffboardingAccountableHolder(false); });
    return () => { cancelled = true; };
  }, [hasOrg, user?.id]);

  // Fetch this org's current transition state for this supplier.
  useEffect(() => {
    if (!hasOrg || !supplierId.trim()) { setStateLoadStatus('idle'); return; }
    setStateLoadStatus('loading');
    let cancelled = false;
    fetch(`/api/offboarding/current?supplierId=${encodeURIComponent(supplierId.trim())}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setCurrentState({ isOpen: !!data.isOpen, isClosed: !!data.isClosed, triggerReason: data.triggerReason ?? null, cooperationLevel: data.cooperationLevel ?? null, replacementSupplierNamed: !!data.replacementSupplierNamed, checklist: data.checklist ?? [] });
        setStateLoadStatus('live');
      })
      .catch(() => { if (!cancelled) setStateLoadStatus('unreachable'); });
    return () => { cancelled = true; };
  }, [hasOrg, supplierId, openStatus, closeStatus, reopenStatus, checklistBusyKey]);

  async function submitOpen() {
    setOpenStatus('saving');
    try {
      const res = await fetch('/api/offboarding/open', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId.trim(), triggerReason: openTrigger, cooperationLevel: openCooperation, replacementSupplierNamed: openReplacementNamed }),
      });
      if (!res.ok) { setOpenStatus('error'); return; }
      setOpenStatus('idle');
    } catch {
      setOpenStatus('error');
    }
  }

  async function updateChecklistItem(key: TransitionChecklistItemKey, status: TransitionItemStatus) {
    setChecklistBusyKey(key);
    try {
      const res = await fetch('/api/offboarding/checklist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId.trim(), checklistItemKey: key, itemStatus: status }),
      });
      if (!res.ok) { /* surfaced via stateLoadStatus on next fetch */ }
    } finally {
      setChecklistBusyKey(null);
    }
  }

  async function submitClose() {
    setCloseStatus('saving');
    setCloseError(null);
    try {
      const res = await fetch('/api/offboarding/close', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setCloseStatus('error'); setCloseError(data?.error ?? t.genericError); return; }
      setCloseStatus('done');
      setAslCrossReferenceNote(data?.aslCrossReference?.reasonNote ?? null);
    } catch {
      setCloseStatus('error');
      setCloseError(t.genericError);
    }
  }

  async function submitReopen() {
    setReopenStatus('saving');
    try {
      const res = await fetch('/api/offboarding/reopen', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId.trim() }),
      });
      if (!res.ok) { setReopenStatus('error'); return; }
      setReopenStatus('idle');
      setCloseStatus('idle');
      setAslCrossReferenceNote(null);
    } catch {
      setReopenStatus('error');
    }
  }

  const closeBlockingItems = useMemo(() => {
    if (!currentState) return [];
    return currentState.checklist.filter((c) => isGatingRequirement(c.requirement) && c.status !== 'complete' && c.status !== 'not_applicable');
  }, [currentState]);

  const requirementBadgeClass: Record<ChecklistRequirementLevel, string> = {
    mandatory: 'bg-red-100 text-red-800',
    conditional_mandatory: 'bg-amber-100 text-amber-800',
    recommended: 'bg-slate-100 text-slate-700',
    not_applicable: 'bg-slate-50 text-slate-400',
  };
  const statusBadgeClass: Record<TransitionItemStatus, string> = {
    pending: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-sky-100 text-sky-800',
    complete: 'bg-emerald-100 text-emerald-800',
    not_applicable: 'bg-slate-50 text-slate-400',
  };

  const t = {
    title: isAr ? 'إنهاء التعامل والانتقال' : 'Offboarding & Transition',
    subtitle: isAr
      ? 'منطق تشغيلي محايد لتصفية علاقة مورّد بغض النظر عن السبب -- البند 7 من 7، منفصل عن قرار القائمة السوداء لسبب موجب (البند 6).'
      : 'Neutral, cause-agnostic logistics for winding a supplier relationship down -- Item 7 of 7, distinct from Item 6\'s for-cause blacklist finding.',
    tierAdvisory: isAr ? 'استشاري' : 'Advisory',
    tierOperational: isAr ? 'تشغيلي' : 'Operational',
    tierAdvisoryDesc: isAr ? 'خطة انتقال موصى بها -- أنتم من يدير الانتقال. لا حفظ.' : 'A recommended transition plan -- you run the transition. No persistence.',
    tierOperationalDesc: isAr ? 'آي إس سي تحفظ سجل الانتقال وتقدّم قائمة المهام.' : 'ISC persists the transition record and tracks checklist progress.',
    supplierIdLabel: isAr ? 'معرّف المورّد' : 'Supplier ID',
    triggerReasonLabel: isAr ? 'سبب الخروج' : 'Trigger reason',
    cooperationLevelLabel: isAr ? 'مستوى التعاون' : 'Cooperation level',
    cooperationInferred: isAr ? '(مُستنتج تلقائياً)' : '(auto-inferred)',
    cooperationOverrideToggle: isAr ? 'تجاوز يدوي لمستوى التعاون' : 'Manually override cooperation level',
    replacementSupplierLabel: isAr ? 'تم تسمية مورّد بديل' : 'Replacement supplier named',
    openCommitmentsLabel: isAr ? 'توجد التزامات مفتوحة' : 'Open commitments flagged',
    openCommitmentsDetailPlaceholder: isAr ? 'مثال: 3 أوامر شراء مفتوحة، التزام ضمان حتى...' : 'e.g. 3 open POs, warranty obligation through...',
    manualBlacklistLabel: isAr ? 'هذا المورّد مُدرج حالياً بالقائمة السوداء (البند 6)' : 'This supplier is currently blacklisted (Item 6)',
    manualAslLabel: isAr ? 'المورّد لا يزال ضمن القائمة المعتمدة (البند 3)' : 'Supplier still keeps on the ASL (Item 3)',
    manualEntryDisclosure: isAr
      ? 'إدخال يدوي -- لا يوجد بعد تزامن حي مع حالة البند 6/البند 3 الفعلية؛ يُستخدم هذا الإدخال أيضاً كأساس لأي اقتراح "تلقائي" أدناه.'
      : 'Manual entry -- not yet live-synced with Item 6/Item 3\'s actual state; this entry is also what any "auto-suggested" context below is derived from.',
    checklistTitle: isAr ? 'قائمة مهام الانتقال' : 'Transition checklist',
    primaryTitle: isAr ? 'النهج الأساسي' : 'Primary approach',
    alternativeTitle: isAr ? 'نهج بديل حقيقي' : 'A genuine alternative approach',
    riskFlagsTitle: isAr ? 'تنبيهات المخاطر' : 'Risk flags',
    aslCrossRefNeeded: isAr ? 'الإغلاق سيكتب إسناداً مرجعياً حقيقياً في سجل القائمة المعتمدة (البند 3).' : 'Closing will write a real cross-reference into the ASL register (Item 3).',
    aslCrossRefNotNeeded: isAr ? 'لن يُكتب إسناد مرجعي جديد في القائمة المعتمدة (تم اتخاذ القرار مسبقاً عبر بند آخر أو المورّد ليس على القائمة أصلاً).' : 'No new ASL cross-reference will be written (already decided by another item, or the supplier is not currently on the ASL).',
    openTransitionTitle: isAr ? 'فتح سجل انتقال' : 'Open a transition record',
    openButton: isAr ? 'فتح' : 'Open',
    stateTitle: isAr ? 'الحالة الحالية' : 'Current state',
    isOpenBadge: isAr ? 'مفتوح' : 'Open',
    isClosedBadge: isAr ? 'مُغلق' : 'Closed',
    notOpenBadge: isAr ? 'لم يُفتح بعد' : 'Not yet opened',
    completionLabel: isAr ? 'نسبة الإنجاز (البنود الإلزامية)' : 'Completion (gating items)',
    closeButton: isAr ? 'إغلاق سجل الانتقال' : 'Close transition record',
    closeBlockedPrefix: isAr ? 'لا يمكن الإغلاق -- بنود إلزامية متبقية:' : 'Cannot close -- mandatory items remaining:',
    closedMessage: isAr ? 'تم إغلاق سجل الانتقال.' : 'Transition record closed.',
    reopenButton: isAr ? 'إعادة فتح' : 'Reopen',
    aslCrossRefTitle: isAr ? 'إسناد مرجعي إلى القائمة المعتمدة' : 'ASL cross-reference',
    notAuthorized: isAr ? 'مستخدمكم غير مخوَّل لإدارة سجل الانتقال -- يتطلب مسؤول إدارة المؤسسة أو صاحب مسؤولية RACI لقرار إنهاء التعامل.' : 'Your user is not authorized to manage this transition record -- requires org_admin or the RACI Accountable holder for the Offboarding Decision.',
    loading: isAr ? 'جارٍ التحميل...' : 'Loading...',
    unreachable: isAr ? 'تعذّر الوصول إلى الحالة المباشرة -- القيم أدناه محلية فقط.' : 'Could not reach live state -- values below are local only.',
    genericError: isAr ? 'حدث خطأ. حاولوا مرة أخرى.' : 'Something went wrong. Please try again.',
    consultancyTitle: isAr ? 'إطار الاستشارة' : 'Consultancy Framing',
    suggestedFromContext: isAr ? 'اقتراح تلقائي من حالة البند 6/البند 3' : 'Auto-suggested from Item 6/Item 3 state',
  };

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

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <label className="text-xs">
            <span className="block font-semibold text-slate-600 mb-1">{t.supplierIdLabel}</span>
            <input type="text" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} placeholder="e.g. SUP-RAWABI-06" className="w-full sm:w-64 text-xs border border-slate-300 rounded-lg px-2 py-2" />
          </label>
        </div>

        {tier === 'advisory' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.triggerReasonLabel}</span>
                  <select value={triggerReason} onChange={(e) => setTriggerReason(e.target.value as OffboardingTriggerReason)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                    {OFFBOARDING_TRIGGER_REASONS.map((r) => (
                      <option key={r} value={r}>{isAr ? OFFBOARDING_TRIGGER_LABELS[r].ar : OFFBOARDING_TRIGGER_LABELS[r].en}</option>
                    ))}
                  </select>
                </label>
                <div className="text-xs">
                  <span className="block font-semibold text-slate-600 mb-1">{t.cooperationLevelLabel} <span className="font-normal text-slate-400">{!cooperationOverrideOn ? t.cooperationInferred : ''}</span></span>
                  <label className="flex items-center gap-2 mb-1">
                    <input type="checkbox" checked={cooperationOverrideOn} onChange={(e) => setCooperationOverrideOn(e.target.checked)} />
                    <span>{t.cooperationOverrideToggle}</span>
                  </label>
                  {cooperationOverrideOn ? (
                    <select value={cooperationOverride} onChange={(e) => setCooperationOverride(e.target.value as CooperationLevel)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                      {(['cooperative', 'limited', 'adversarial'] as CooperationLevel[]).map((c) => (
                        <option key={c} value={c}>{isAr ? COOPERATION_LEVEL_LABELS[c].ar : COOPERATION_LEVEL_LABELS[c].en}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-2 py-2 bg-slate-50 rounded-lg border border-slate-200">{isAr ? COOPERATION_LEVEL_LABELS[inferredLevel].ar : COOPERATION_LEVEL_LABELS[inferredLevel].en}</p>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{isAr ? COOPERATION_LEVEL_SOURCE_AR : COOPERATION_LEVEL_SOURCE_EN}</p>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={replacementSupplierNamed} onChange={(e) => setReplacementSupplierNamed(e.target.checked)} />
                  <span>{t.replacementSupplierLabel}</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={manualIsBlacklisted} onChange={(e) => setManualIsBlacklisted(e.target.checked)} />
                  <span>{t.manualBlacklistLabel}</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={manualAslKeepsOn} onChange={(e) => setManualAslKeepsOn(e.target.checked)} />
                  <span>{t.manualAslLabel}</span>
                </label>
                <p className="sm:col-span-2 text-[10px] text-slate-400">{t.manualEntryDisclosure}</p>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={hasOpenCommitments} onChange={(e) => setHasOpenCommitments(e.target.checked)} />
                  <span>{t.openCommitmentsLabel}</span>
                </label>
              </div>
              {hasOpenCommitments && (
                <input type="text" value={openCommitmentsDetail} onChange={(e) => setOpenCommitmentsDetail(e.target.value)} placeholder={t.openCommitmentsDetailPlaceholder} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2 mt-2" />
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#082C6B] mb-3">{t.checklistTitle}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {advisoryPlan.checklist.map((item) => (
                      <tr key={item.key} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-2">{isAr ? item.labelAr : item.labelEn}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${requirementBadgeClass[item.requirement]}`}>{isAr ? CHECKLIST_REQUIREMENT_LABELS[item.requirement].ar : CHECKLIST_REQUIREMENT_LABELS[item.requirement].en}</span>
                        </td>
                        <td className="py-2 text-[10px] text-slate-400">{isAr ? item.sourceAr : item.sourceEn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-600 mt-3">{advisoryPlan.aslCrossReferenceNeeded ? t.aslCrossRefNeeded : t.aslCrossRefNotNeeded}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-emerald-900 mb-1">{t.primaryTitle}</p>
                <p className="text-[11px] text-emerald-800">{isAr ? advisoryPlan.primaryAr : advisoryPlan.primaryEn}</p>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-sky-900 mb-1">{t.alternativeTitle}</p>
                <p className="text-[11px] text-sky-800">{isAr ? advisoryPlan.alternativeAr : advisoryPlan.alternativeEn}</p>
              </div>
            </div>

            {advisoryPlan.riskFlagsEn.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-amber-900 mb-1">{t.riskFlagsTitle}</p>
                <ul className="list-disc pl-4 space-y-1">
                  {(isAr ? advisoryPlan.riskFlagsAr : advisoryPlan.riskFlagsEn).map((flag, i) => (
                    <li key={i} className="text-[11px] text-amber-800">{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tier === 'operational' && (
          <div className="space-y-6">
            {!hasOrg && <p className="text-xs text-amber-700">{t.notAuthorized}</p>}
            {hasOrg && !canWrite && <p className="text-xs text-amber-700 mb-4">{t.notAuthorized}</p>}

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.stateTitle}</p>
              {stateLoadStatus === 'loading' && <p className="text-[11px] text-slate-500">{t.loading}</p>}
              {stateLoadStatus === 'unreachable' && <p className="text-[10px] text-amber-700 mb-1">{t.unreachable}</p>}
              {stateLoadStatus !== 'loading' && currentState && (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${!currentState.isOpen ? 'bg-slate-100 text-slate-600' : currentState.isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                  {!currentState.isOpen ? t.notOpenBadge : currentState.isClosed ? t.isClosedBadge : t.isOpenBadge}
                </span>
              )}
            </div>

            {stateLoadStatus !== 'loading' && currentState && !currentState.isOpen && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#082C6B] mb-3">{t.openTransitionTitle}</p>
                {(suggestedContext.suggestedTrigger || suggestedContext.suggestedCooperationLevel) && (
                  <p className="text-[10px] text-sky-700 mb-2">{t.suggestedFromContext}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="text-xs">
                    <span className="block font-semibold text-slate-600 mb-1">{t.triggerReasonLabel}</span>
                    <select value={openTrigger} onChange={(e) => setOpenTrigger(e.target.value as OffboardingTriggerReason)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                      {OFFBOARDING_TRIGGER_REASONS.map((r) => (
                        <option key={r} value={r}>{isAr ? OFFBOARDING_TRIGGER_LABELS[r].ar : OFFBOARDING_TRIGGER_LABELS[r].en}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    <span className="block font-semibold text-slate-600 mb-1">{t.cooperationLevelLabel}</span>
                    <select value={openCooperation} onChange={(e) => setOpenCooperation(e.target.value as CooperationLevel)} className="w-full text-xs border border-slate-300 rounded-lg px-2 py-2">
                      {(['cooperative', 'limited', 'adversarial'] as CooperationLevel[]).map((c) => (
                        <option key={c} value={c}>{isAr ? COOPERATION_LEVEL_LABELS[c].ar : COOPERATION_LEVEL_LABELS[c].en}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs mt-3">
                  <input type="checkbox" checked={openReplacementNamed} onChange={(e) => setOpenReplacementNamed(e.target.checked)} />
                  <span>{t.replacementSupplierLabel}</span>
                </label>
                <button type="button" disabled={!canWrite || openStatus === 'saving'} onClick={submitOpen} className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg bg-[#082C6B] text-white disabled:opacity-40">{t.openButton}</button>
                {openStatus === 'error' && <p className="text-[11px] text-red-700 mt-2">{t.genericError}</p>}
              </div>
            )}

            {stateLoadStatus !== 'loading' && currentState?.isOpen && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#082C6B]">{t.checklistTitle}</p>
                  <span className="text-[10px] text-slate-500">{t.completionLabel}: {(() => {
                    const gating = currentState.checklist.filter((c) => isGatingRequirement(c.requirement));
                    const done = gating.filter((c) => c.status === 'complete' || c.status === 'not_applicable');
                    return gating.length === 0 ? 100 : Math.round((done.length / gating.length) * 100);
                  })()}%</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {TRANSITION_CHECKLIST_ITEM_KEYS.map((key) => {
                        const item = currentState.checklist.find((c) => c.key === key);
                        if (!item) return null;
                        return (
                          <tr key={key} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 pr-2 align-top">
                              <div className="flex items-center gap-2">
                                <span>{key}</span>
                                <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${requirementBadgeClass[item.requirement]}`}>{isAr ? CHECKLIST_REQUIREMENT_LABELS[item.requirement].ar : CHECKLIST_REQUIREMENT_LABELS[item.requirement].en}</span>
                              </div>
                            </td>
                            <td className="py-2 pr-2 align-top">
                              <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${statusBadgeClass[item.status]}`}>{item.status}</span>
                            </td>
                            <td className="py-2 align-top">
                              {canWrite && !currentState.isClosed && (
                                <select
                                  value={item.status}
                                  disabled={checklistBusyKey === key}
                                  onChange={(e) => updateChecklistItem(key, e.target.value as TransitionItemStatus)}
                                  className="text-[10px] border border-slate-300 rounded px-1 py-1"
                                >
                                  {ITEM_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!currentState.isClosed && (
                  <div className="mt-4">
                    <button type="button" disabled={!canWrite || closeStatus === 'saving' || closeBlockingItems.length > 0} onClick={submitClose} className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-700 text-white disabled:opacity-40">{t.closeButton}</button>
                    {closeBlockingItems.length > 0 && (
                      <p className="text-[11px] text-red-700 mt-2">{t.closeBlockedPrefix} {closeBlockingItems.map((b) => b.key).join(', ')}</p>
                    )}
                    {closeStatus === 'error' && <p className="text-[11px] text-red-700 mt-2">{closeError ?? t.genericError}</p>}
                  </div>
                )}

                {currentState.isClosed && (
                  <div className="mt-4">
                    <p className="text-[11px] text-emerald-700 font-semibold mb-2">{t.closedMessage}</p>
                    {aslCrossReferenceNote && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 mb-2">
                        <p className="text-[10px] font-semibold text-sky-900">{t.aslCrossRefTitle}</p>
                        <p className="text-[11px] text-sky-800">{aslCrossReferenceNote}</p>
                      </div>
                    )}
                    <button type="button" disabled={!canWrite || reopenStatus === 'saving'} onClick={submitReopen} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700 text-white disabled:opacity-40">{t.reopenButton}</button>
                    {reopenStatus === 'error' && <p className="text-[11px] text-red-700 mt-2">{t.genericError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-6">
          <p className="text-[10px] font-semibold text-slate-500 mb-1">{t.consultancyTitle}</p>
          <p className="text-[11px] text-slate-600">{isAr ? CONSULTANCY_FRAMING_NOTE_AR : CONSULTANCY_FRAMING_NOTE_EN}</p>
        </div>
      </div>
    </div>
  );
}
