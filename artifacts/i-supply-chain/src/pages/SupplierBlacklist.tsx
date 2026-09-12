/**
 * Supplier Blacklist -- Item 6 of 7 (12 Sep 2026).
 *
 * WHAT THIS IS NOT: this page is NOT a re-skin of Item 3's ASL suspend/
 * revoke controls. Blacklist is an affirmative, for-cause governance action
 * with real due-process implications for a real external company -- see
 * supplierBlacklist.ts's file header for the full sourced methodology
 * (World Bank Sanctions System / UK Procurement Act 2023) and the "what
 * this is not" distinction from ASL lifecycle actions.
 *
 * THIS IS DELIBERATELY NOT A ONE-CLICK BAN: the Operational tier's finalize
 * flow below is a multi-step wizard (review evidence -> confirm right-to-
 * respond -> choose duration -> a final, explicitly-typed confirmation) --
 * every step gated on the PREVIOUS step's completion, never collapsible
 * into a single click. This is the platform's own UI/UX-is-not-optional
 * rule (Rule 9) applied with unusual weight, per this item's own
 * instruction that nothing here should feel casual or reversible-by-
 * accident.
 *
 * Two-tier, client-selectable (same architecture as every prior item):
 *   - Advisory (default): computeAdvisoryBlacklistRecommendation() -- a
 *     flagged recommendation with rationale and evidence links, zero
 *     persistence. The client makes the actual call.
 *   - Operational (opt-in): ISC persists the formal record via
 *     /api/blacklist. Draft (evidence-gathering) is write-gated the same
 *     way as Items 1-5 (org_admin OR the RACI Accountable holder for
 *     'blacklist_decision'). FINALIZE and REVERSE are gated to org_admin
 *     SPECIFICALLY -- a deliberate, disclosed escalation, shown in this UI
 *     as a visibly different (stricter) control, not silently identical to
 *     the draft gate.
 *
 * REAL CROSS-REFERENCE, SHOWN TO THE USER: a successful finalize also
 * writes a real 'revoked' row into Item 3's own asl_decision_events table
 * (server-side, see artifacts/api-server/src/routes/blacklist.ts). This
 * page displays that cross-reference confirmation directly from the
 * finalize response, rather than a second, disconnected "also revoked from
 * ASL" claim this page would have to separately verify.
 *
 * Bilingual EN/AR from the start (Rule 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  BLACKLIST_EVIDENCE_CATEGORIES,
  BLACKLIST_EVIDENCE_LABELS,
  DURATION_TYPE_LABELS,
  DURATION_TYPE_SOURCE_EN,
  DURATION_TYPE_SOURCE_AR,
  computeAdvisoryBlacklistRecommendation,
  validateBlacklistFinalization,
  ITEM7_FORWARD_HOOK_NOTE_EN,
  ITEM7_FORWARD_HOOK_NOTE_AR,
  CONSULTANCY_FRAMING_NOTE_EN,
  CONSULTANCY_FRAMING_NOTE_AR,
  type BlacklistEvidenceCategory,
  type BlacklistEvidenceItem,
  type DurationType,
  type PeriodicEvaluationOutcomeLike,
  type COPQSeverityLike,
  type Module07EscalationSnapshotLike,
} from '@/lib/supplierBlacklist';

type Tier = 'advisory' | 'operational';
type FinalizeStep = 'closed' | 'review' | 'due_process' | 'duration' | 'confirm';

interface EvidenceRow {
  category: BlacklistEvidenceCategory;
  detailEn: string;
  independentlySufficient: boolean;
}

export function SupplierBlacklist() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const hasOrg = !!user?.organizationId;
  const isOrgAdmin = hasOrg && user?.orgRole === 'org_admin';

  const [tier, setTier] = useState<Tier>('advisory');
  const [supplierId, setSupplierId] = useState('SUP-RAWABI-01');

  // Manual evidence entries -- the client's own documented facts.
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [newCategory, setNewCategory] = useState<BlacklistEvidenceCategory>('other_documented_evidence');
  const [newDetail, setNewDetail] = useState('');

  // Item 5 / Item 1 / Module 07 suggested-evidence inputs -- disclosed
  // manual stand-ins until a live cross-page feed exists (same disclosed
  // pattern as Item 5's own Module 07 tension inputs).
  const [hasPeriodicEvalFailure, setHasPeriodicEvalFailure] = useState(false);
  const [worstCategoryRating, setWorstCategoryRating] = useState<'watch' | 'at_risk'>('at_risk');
  const [worstCategoryName, setWorstCategoryName] = useState('compliance_esg');
  const [hasCopqSeverity, setHasCopqSeverity] = useState(false);
  const [copqTotal, setCopqTotal] = useState(500000);
  const [copqExternalShare, setCopqExternalShare] = useState(0.6);
  const [hasActiveEscalation, setHasActiveEscalation] = useState(false);
  const [escalationIntervention, setEscalationIntervention] = useState('Formal CAR + executive review');

  // Operational-tier RACI/state
  const [isBlacklistAccountableHolder, setIsBlacklistAccountableHolder] = useState(false);
  const canDraft = isOrgAdmin || isBlacklistAccountableHolder;

  const [currentState, setCurrentState] = useState<{ isBlacklisted: boolean; isExpired: boolean; hasOpenDraft: boolean } | null>(null);
  const [stateLoadStatus, setStateLoadStatus] = useState<'idle' | 'loading' | 'live' | 'unreachable'>('idle');

  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  // Finalize wizard state
  const [finalizeStep, setFinalizeStep] = useState<FinalizeStep>('closed');
  const [rightToRespondConfirmed, setRightToRespondConfirmed] = useState(false);
  const [durationType, setDurationType] = useState<DurationType | null>(null);
  const [effectiveUntilIso, setEffectiveUntilIso] = useState('');
  const [confirmTypedSupplierId, setConfirmTypedSupplierId] = useState('');
  const [finalizeStatus, setFinalizeStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [aslCrossReferenceNote, setAslCrossReferenceNote] = useState<string | null>(null);

  const [reverseConfirmOpen, setReverseConfirmOpen] = useState(false);
  const [reverseStatus, setReverseStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  // RACI Accountable-holder check for 'blacklist_decision' -- same pattern
  // as every prior item's own live /api/raci/current check.
  useEffect(() => {
    if (!hasOrg) { setIsBlacklistAccountableHolder(false); return; }
    let cancelled = false;
    fetch('/api/raci/current', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        const rows = data.current as Array<{ activityKey: string; role: string; userIds: number[] }>;
        const row = rows.find((r) => r.activityKey === 'blacklist_decision' && r.role === 'A');
        setIsBlacklistAccountableHolder(!!row && !!user?.id && row.userIds.includes(user.id));
      })
      .catch(() => { if (!cancelled) setIsBlacklistAccountableHolder(false); });
    return () => { cancelled = true; };
  }, [hasOrg, user?.id]);

  // Fetch this org's current blacklist state for this supplier.
  useEffect(() => {
    if (!hasOrg || !supplierId.trim()) { setStateLoadStatus('idle'); return; }
    setStateLoadStatus('loading');
    let cancelled = false;
    fetch(`/api/blacklist/current?supplierId=${encodeURIComponent(supplierId.trim())}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setCurrentState({ isBlacklisted: !!data.isBlacklisted, isExpired: !!data.isExpired, hasOpenDraft: !!data.hasOpenDraft });
        setStateLoadStatus('live');
      })
      .catch(() => { if (!cancelled) setStateLoadStatus('unreachable'); });
    return () => { cancelled = true; };
  }, [hasOrg, supplierId, finalizeStatus, reverseStatus]);

  const periodicEvaluation: PeriodicEvaluationOutcomeLike | undefined = hasPeriodicEvalFailure
    ? { overallRecommendation: 'escalate_consider', worstCategoryRating, worstCategoryName, evaluatedAtIso: new Date().toISOString() }
    : undefined;
  const copqSeverity: COPQSeverityLike | undefined = hasCopqSeverity
    ? { periodLabel: 'Current period', totalCostedUSD: copqTotal, externalFailureShare: copqExternalShare }
    : undefined;
  const activeRecoveryEscalation: Module07EscalationSnapshotLike | undefined = hasActiveEscalation
    ? { recommendedIntervention: escalationIntervention, escalated: true, combinedSignalFlag: false }
    : undefined;

  const manualEvidence: BlacklistEvidenceItem[] = evidenceRows.map((r) => ({ category: r.category, detailEn: r.detailEn, independentlySufficient: r.independentlySufficient }));

  const recommendation = useMemo(
    () => computeAdvisoryBlacklistRecommendation({ evidence: manualEvidence, periodicEvaluation, copqSeverity, activeRecoveryEscalation }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [evidenceRows, hasPeriodicEvalFailure, worstCategoryRating, worstCategoryName, hasCopqSeverity, copqTotal, copqExternalShare, hasActiveEscalation, escalationIntervention],
  );

  const allEvidenceForFinalize: BlacklistEvidenceItem[] = [...manualEvidence, ...recommendation.suggestedEvidenceLinks];
  const finalizeValidation = useMemo(
    () => validateBlacklistFinalization({ evidence: allEvidenceForFinalize, rightToRespondConfirmed, durationType, effectiveUntilIso: durationType === 'time_bound' ? (effectiveUntilIso || null) : null }),
    [allEvidenceForFinalize, rightToRespondConfirmed, durationType, effectiveUntilIso],
  );

  function addEvidenceRow() {
    if (!newDetail.trim()) return;
    setEvidenceRows((rows) => [...rows, { category: newCategory, detailEn: newDetail.trim(), independentlySufficient: newCategory === 'compliance_violation' || newCategory === 'contractual_breach' || newCategory === 'severe_copq' }]);
    setNewDetail('');
  }
  function removeEvidenceRow(idx: number) {
    setEvidenceRows((rows) => rows.filter((_, i) => i !== idx));
  }

  async function handleDraft(action: 'draft_set' | 'draft_clear') {
    if (!canDraft) { setDraftStatus('error'); return; }
    setDraftStatus('saving');
    try {
      const res = await fetch('/api/blacklist/draft', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'draft_set' ? { supplierId: supplierId.trim(), action, evidence: allEvidenceForFinalize } : { supplierId: supplierId.trim(), action }),
      });
      if (!res.ok) { setDraftStatus('error'); return; }
      setDraftStatus('idle');
      setCurrentState((s) => ({ isBlacklisted: s?.isBlacklisted ?? false, isExpired: s?.isExpired ?? false, hasOpenDraft: action === 'draft_set' }));
    } catch {
      setDraftStatus('error');
    }
  }

  function openFinalizeWizard() {
    // Always opens on the review step regardless of current sufficiency --
    // the review step itself is what disables Next until evidence is
    // sufficient (see the JSX below). No separate branch is needed here;
    // an earlier draft of this function had one that did nothing
    // different in either branch -- removed as dead complexity found
    // during this build's own QA pass.
    setFinalizeStep('review');
  }

  async function submitFinalize() {
    if (confirmTypedSupplierId.trim() !== supplierId.trim()) return;
    setFinalizeStatus('saving');
    setFinalizeError(null);
    try {
      const res = await fetch('/api/blacklist/finalize', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplierId.trim(),
          evidence: allEvidenceForFinalize,
          rightToRespondConfirmed,
          durationType,
          effectiveUntilIso: durationType === 'time_bound' ? effectiveUntilIso : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setFinalizeStatus('error'); setFinalizeError(data?.error ?? t.finalizeError); return; }
      setFinalizeStatus('done');
      setFinalizeStep('closed');
      setAslCrossReferenceNote(data?.aslCrossReference?.reasonNote ?? null);
    } catch {
      setFinalizeStatus('error');
      setFinalizeError(t.finalizeError);
    }
  }

  async function submitReverse() {
    setReverseStatus('saving');
    try {
      const res = await fetch('/api/blacklist/reverse', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId: supplierId.trim() }),
      });
      if (!res.ok) { setReverseStatus('error'); return; }
      setReverseStatus('idle');
      setReverseConfirmOpen(false);
      setAslCrossReferenceNote(null);
    } catch {
      setReverseStatus('error');
    }
  }

  const t = {
    title: isAr ? 'القائمة السوداء للموردين' : 'Supplier Blacklist',
    subtitle: isAr
      ? 'إجراء حوكمة لسبب موجب، منفصل عن إيقاف/إلغاء القائمة المعتمدة الإداري (البند 3) -- يتطلب أدلة، وحق رد، ومدة صريحة.'
      : 'A for-cause governance action, distinct from ASL suspension/revocation (Item 3) -- requires evidence, a right to respond, and an explicit duration.',
    tierAdvisory: isAr ? 'استشاري' : 'Advisory',
    tierOperational: isAr ? 'تشغيلي' : 'Operational',
    tierAdvisoryDesc: isAr ? 'توصية موسومة مع الأدلة -- أنتم من يتخذ القرار. لا حفظ.' : 'A flagged recommendation with evidence -- you make the call. No persistence.',
    tierOperationalDesc: isAr ? 'آي إس سي تحفظ السجل الرسمي، مع بوابة تفويض أشد صرامة للإنهاء.' : 'ISC persists the formal record, with a stricter authorization gate for finalization.',
    supplierIdLabel: isAr ? 'معرّف المورّد' : 'Supplier ID',
    evidenceTitle: isAr ? 'الأدلة الموثقة' : 'Documented Evidence',
    addEvidence: isAr ? 'إضافة دليل' : 'Add evidence',
    detailPlaceholder: isAr ? 'وصف الدليل...' : 'Describe the evidence...',
    independentlySufficientTag: isAr ? 'كافٍ بذاته' : 'Independently sufficient',
    signalsTitle: isAr ? 'إشارات مقترحة من البنود 1 و5 و(الوحدة 07)' : 'Suggested signals from Items 1, 5 and Module 07',
    hasPeriodicFail: isAr ? 'إخفاق في التقييم الدوري (البند 5)' : 'Periodic evaluation failure (Item 5)',
    hasCopq: isAr ? 'تكلفة جودة رديئة شديدة (البند 1)' : 'Severe COPQ (Item 1)',
    hasEscalation: isAr ? 'تصعيد نشط لتعافي الأداء (الوحدة 07)' : 'Active performance-recovery escalation (Module 07)',
    recommendationTitle: isAr ? 'التوصية' : 'Recommendation',
    alternativeLabel: isAr ? 'بديل قوي' : 'Strong alternative',
    evidenceSufficientYes: isAr ? 'الأدلة كافية لمراجعة رسمية' : 'Evidence sufficient for formal review',
    evidenceSufficientNo: isAr ? 'الأدلة غير كافية بعد' : 'Evidence not yet sufficient',
    stateTitle: isAr ? 'الحالة الحالية' : 'Current State',
    isBlacklisted: isAr ? 'مُدرَج في القائمة السوداء' : 'Blacklisted',
    notBlacklisted: isAr ? 'غير مُدرَج' : 'Not blacklisted',
    isExpired: isAr ? '(منتهي المدة)' : '(expired)',
    hasOpenDraft: isAr ? 'يوجد مسودة مفتوحة' : 'Open draft exists',
    unreachable: isAr ? 'تعذّر الاتصال بالخادم.' : 'Could not reach the server.',
    draftSet: isAr ? 'حفظ مسودة' : 'Save draft',
    draftClear: isAr ? 'مسح المسودة' : 'Clear draft',
    notAuthorizedDraft: isAr ? 'يلزم صلاحية مسؤول المؤسسة أو المسؤول المعتمد (RACI) لهذا الإجراء.' : 'Requires org_admin or the RACI Accountable holder for this action.',
    beginFinalize: isAr ? 'بدء الإنهاء الرسمي...' : 'Begin formal finalization…',
    notAuthorizedFinalize: isAr ? 'الإنهاء يتطلب صلاحية مسؤول المؤسسة تحديداً -- ليس المسؤول المعتمد (RACI) وحده. هذا تشديد متعمد نظراً للعواقب الحقيقية.' : 'Finalizing requires org_admin SPECIFICALLY -- not the RACI Accountable holder alone. This is a deliberate escalation given the real consequences involved.',
    step1Title: isAr ? 'الخطوة 1 من 3: مراجعة الأدلة' : 'Step 1 of 3: Review Evidence',
    step2Title: isAr ? 'الخطوة 2 من 3: حق الرد' : 'Step 2 of 3: Right to Respond',
    rightToRespondLabel: isAr ? 'أؤكد أن المورّد قد مُنح فرصة للرد على هذه الأدلة قبل المتابعة.' : 'I confirm the supplier has been given an opportunity to respond to this evidence before proceeding.',
    step3Title: isAr ? 'الخطوة 3 من 3: تحديد المدة' : 'Step 3 of 3: Choose Duration',
    finalStepTitle: isAr ? 'التأكيد النهائي' : 'Final Confirmation',
    warningBanner: isAr ? 'هذا إجراء له عواقب تجارية وقانونية حقيقية على طرف خارجي. سيؤدي هذا أيضاً إلى إلغاء إدراج هذا المورّد تلقائياً من القائمة المعتمدة (البند 3).' : 'This action has real commercial and legal consequences for an external party. It will also automatically revoke this supplier from the Approved Supplier List (Item 3).',
    typeToConfirm: isAr ? 'اكتب معرّف المورّد أدناه لتأكيد الإنهاء:' : 'Type the supplier ID below to confirm finalization:',
    finalizeButton: isAr ? 'إنهاء إدراج القائمة السوداء' : 'Finalize Blacklist Entry',
    cancel: isAr ? 'إلغاء' : 'Cancel',
    next: isAr ? 'التالي' : 'Next',
    back: isAr ? 'رجوع' : 'Back',
    finalizeError: isAr ? 'تعذّر الإنهاء. راجع الأخطاء أعلاه.' : 'Could not finalize. Review the errors above.',
    finalizeDone: isAr ? 'تم إنهاء إدراج القائمة السوداء.' : 'Blacklist entry finalized.',
    aslCrossRef: isAr ? 'الإسناد المرجعي للقائمة المعتمدة' : 'ASL Cross-Reference',
    reverseButton: isAr ? 'عكس / استئناف' : 'Reverse / Appeal',
    reverseConfirm: isAr ? 'تأكيد عكس هذا القرار؟ هذا إجراء له عواقب أيضاً.' : 'Confirm reversing this decision? This action also has consequences.',
    reverseSubmit: isAr ? 'تأكيد العكس' : 'Confirm Reversal',
    forwardHookTitle: isAr ? 'ملاحظة مستقبلية (البند 7)' : 'Forward-looking note (Item 7)',
    consultancyTitle: isAr ? 'إطار الاستشارة' : 'Consultancy Framing',
    durationSourceTitle: isAr ? 'مصدر تصنيف المدة' : 'Duration-typing source',
  };

  const recColor = recommendation.recommendation === 'RECOMMEND_FORMAL_REVIEW' ? 'red' : recommendation.recommendation === 'RECOMMEND_HOLD_AT_ASL_SUSPENSION' ? 'amber' : 'slate';

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
            <input type="text" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full sm:w-64 text-xs border border-slate-300 rounded-lg px-2 py-2" />
          </label>
        </div>

        {tier === 'operational' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.stateTitle}</p>
            {stateLoadStatus === 'unreachable' && <p className="text-[10px] text-amber-700 mb-1">{t.unreachable}</p>}
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${currentState?.isBlacklisted ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {currentState?.isBlacklisted ? t.isBlacklisted : t.notBlacklisted} {currentState?.isExpired ? t.isExpired : ''}
            </span>
            {currentState?.hasOpenDraft && <span className="ml-2 inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-700">{t.hasOpenDraft}</span>}
            {aslCrossReferenceNote && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-slate-600">{t.aslCrossRef}</p>
                <p className="text-[11px] text-slate-700">{aslCrossReferenceNote}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.evidenceTitle}</p>
          <div className="space-y-2 mb-3">
            {evidenceRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 text-xs">
                <span className="font-semibold text-slate-700">{isAr ? BLACKLIST_EVIDENCE_LABELS[row.category].ar : BLACKLIST_EVIDENCE_LABELS[row.category].en}</span>
                <span className="text-slate-600 flex-1">{row.detailEn}</span>
                {row.independentlySufficient && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">{t.independentlySufficientTag}</span>}
                <button type="button" onClick={() => removeEvidenceRow(idx)} className="text-slate-400 hover:text-red-600 font-bold" aria-label={isAr ? 'إزالة' : 'Remove'}>×</button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as BlacklistEvidenceCategory)} className="text-xs border border-slate-300 rounded-lg px-2 py-2">
              {BLACKLIST_EVIDENCE_CATEGORIES.map((c) => <option key={c} value={c}>{isAr ? BLACKLIST_EVIDENCE_LABELS[c].ar : BLACKLIST_EVIDENCE_LABELS[c].en}</option>)}
            </select>
            <input type="text" value={newDetail} onChange={(e) => setNewDetail(e.target.value)} placeholder={t.detailPlaceholder} className="flex-1 text-xs border border-slate-300 rounded-lg px-2 py-2" />
            <button type="button" onClick={addEvidenceRow} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#082C6B] text-white">{t.addEvidence}</button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.signalsTitle}</p>
          <label className="flex items-center gap-2 text-xs mb-2">
            <input type="checkbox" checked={hasPeriodicEvalFailure} onChange={(e) => setHasPeriodicEvalFailure(e.target.checked)} />
            {t.hasPeriodicFail}
          </label>
          <label className="flex items-center gap-2 text-xs mb-2">
            <input type="checkbox" checked={hasCopqSeverity} onChange={(e) => setHasCopqSeverity(e.target.checked)} />
            {t.hasCopq}
            {hasCopqSeverity && (
              <span className="flex items-center gap-1 ml-2">
                <input type="number" value={copqTotal} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setCopqTotal(v); }} className="w-24 text-[11px] border border-slate-300 rounded px-1 py-0.5" />
                <input type="number" step="0.05" min="0" max="1" value={copqExternalShare} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v >= 0 && v <= 1) setCopqExternalShare(v); }} className="w-16 text-[11px] border border-slate-300 rounded px-1 py-0.5" />
              </span>
            )}
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={hasActiveEscalation} onChange={(e) => setHasActiveEscalation(e.target.checked)} />
            {t.hasEscalation}
          </label>
        </div>

        <div className={`border rounded-xl p-4 mb-6 ${recColor === 'red' ? 'bg-red-50 border-red-200' : recColor === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs font-semibold text-[#082C6B] mb-2">{t.recommendationTitle}</p>
          <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-2 ${recommendation.evidenceSufficient ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
            {recommendation.evidenceSufficient ? t.evidenceSufficientYes : t.evidenceSufficientNo}
          </span>
          <p className="text-xs text-slate-800 leading-relaxed mb-2">{isAr ? recommendation.primaryAr : recommendation.primaryEn}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed"><strong>{t.alternativeLabel}:</strong> {isAr ? recommendation.alternativeAr : recommendation.alternativeEn}</p>
        </div>

        {tier === 'operational' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#082C6B] mb-2">{isAr ? 'مسودة (غير ملزِمة)' : 'Draft (non-binding)'}</p>
              {!canDraft && <p className="text-[11px] text-amber-700 mb-2">{t.notAuthorizedDraft}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={!canDraft || draftStatus === 'saving'} onClick={() => handleDraft('draft_set')} className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-40">{t.draftSet}</button>
                <button type="button" disabled={!canDraft || draftStatus === 'saving'} onClick={() => handleDraft('draft_clear')} className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-200 text-slate-700 disabled:opacity-40">{t.draftClear}</button>
              </div>
              {draftStatus === 'error' && <p className="text-[11px] text-red-700 mt-1">{t.notAuthorizedDraft}</p>}
            </div>

            {stateLoadStatus === 'loading' && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-[11px] text-slate-400">{isAr ? 'جارٍ تحميل الحالة الحالية...' : 'Loading current state…'}</p>
              </div>
            )}
            {stateLoadStatus !== 'loading' && !currentState?.isBlacklisted && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-red-700 mb-2">{isAr ? 'إنهاء رسمي (لا يمكن التراجع بنقرة واحدة)' : 'Formal Finalization (never a single click)'}</p>
                {!isOrgAdmin && <p className="text-[11px] text-amber-700 mb-2">{t.notAuthorizedFinalize}</p>}
                {isOrgAdmin && finalizeStep === 'closed' && (
                  <button type="button" onClick={openFinalizeWizard} className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-700 text-white">{t.beginFinalize}</button>
                )}

                {finalizeStep === 'review' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold mb-2">{t.step1Title}</p>
                    <p className="text-[11px] text-slate-700 mb-3">{allEvidenceForFinalize.length} {isAr ? 'عنصر أدلة' : 'evidence item(s)'} -- {recommendation.evidenceSufficient ? t.evidenceSufficientYes : t.evidenceSufficientNo}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFinalizeStep('closed')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">{t.cancel}</button>
                      <button type="button" disabled={!recommendation.evidenceSufficient} onClick={() => setFinalizeStep('due_process')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#082C6B] text-white disabled:opacity-40">{t.next}</button>
                    </div>
                  </div>
                )}

                {finalizeStep === 'due_process' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold mb-2">{t.step2Title}</p>
                    <label className="flex items-start gap-2 text-[11px] mb-3">
                      <input type="checkbox" checked={rightToRespondConfirmed} onChange={(e) => setRightToRespondConfirmed(e.target.checked)} className="mt-0.5" />
                      {t.rightToRespondLabel}
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFinalizeStep('review')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">{t.back}</button>
                      <button type="button" disabled={!rightToRespondConfirmed} onClick={() => setFinalizeStep('duration')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#082C6B] text-white disabled:opacity-40">{t.next}</button>
                    </div>
                  </div>
                )}

                {finalizeStep === 'duration' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold mb-2">{t.step3Title}</p>
                    <p className="text-[10px] text-slate-500 mb-2">{isAr ? DURATION_TYPE_SOURCE_AR : DURATION_TYPE_SOURCE_EN}</p>
                    <div className="space-y-1 mb-2">
                      {(['time_bound', 'indefinite_pending_review', 'permanent'] as DurationType[]).map((d) => (
                        <label key={d} className="flex items-center gap-2 text-[11px]">
                          <input type="radio" name="durationType" checked={durationType === d} onChange={() => setDurationType(d)} />
                          {isAr ? DURATION_TYPE_LABELS[d].ar : DURATION_TYPE_LABELS[d].en}
                        </label>
                      ))}
                    </div>
                    {durationType === 'time_bound' && (
                      <input type="date" value={effectiveUntilIso.slice(0, 10)} onChange={(e) => setEffectiveUntilIso(new Date(e.target.value).toISOString())} className="text-[11px] border border-slate-300 rounded px-2 py-1 mb-2" />
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFinalizeStep('due_process')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">{t.back}</button>
                      <button type="button" disabled={!durationType || (durationType === 'time_bound' && !effectiveUntilIso)} onClick={() => setFinalizeStep('confirm')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#082C6B] text-white disabled:opacity-40">{t.next}</button>
                    </div>
                  </div>
                )}

                {finalizeStep === 'confirm' && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-800 mb-2">{t.finalStepTitle}</p>
                    <p className="text-[11px] text-red-800 mb-3">{t.warningBanner}</p>
                    <label className="block text-[11px] mb-2">
                      <span className="block font-semibold mb-1">{t.typeToConfirm} <span className="font-mono">{supplierId}</span></span>
                      <input type="text" value={confirmTypedSupplierId} onChange={(e) => setConfirmTypedSupplierId(e.target.value)} className="w-full text-xs border border-red-300 rounded-lg px-2 py-2" />
                    </label>
                    {finalizeStatus === 'error' && <p className="text-[11px] text-red-800 font-semibold mb-2">{finalizeError}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFinalizeStep('closed')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">{t.cancel}</button>
                      <button type="button" disabled={confirmTypedSupplierId.trim() !== supplierId.trim() || finalizeStatus === 'saving'} onClick={submitFinalize} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-700 text-white disabled:opacity-40">{t.finalizeButton}</button>
                    </div>
                  </div>
                )}
                {finalizeStatus === 'done' && <p className="text-[11px] text-emerald-700 font-semibold mt-2">{t.finalizeDone}</p>}
              </div>
            )}

            {stateLoadStatus !== 'loading' && currentState?.isBlacklisted && (
              <div className="border-t border-slate-200 pt-4">
                {!isOrgAdmin && <p className="text-[11px] text-amber-700 mb-2">{t.notAuthorizedFinalize}</p>}
                {isOrgAdmin && !reverseConfirmOpen && (
                  <button type="button" onClick={() => setReverseConfirmOpen(true)} className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-700 text-white">{t.reverseButton}</button>
                )}
                {isOrgAdmin && reverseConfirmOpen && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                    <p className="text-[11px] text-amber-800 mb-2">{t.reverseConfirm}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setReverseConfirmOpen(false)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700">{t.cancel}</button>
                      <button type="button" disabled={reverseStatus === 'saving'} onClick={submitReverse} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-700 text-white">{t.reverseSubmit}</button>
                    </div>
                    {reverseStatus === 'error' && <p className="text-[11px] text-red-700 mt-1">{t.finalizeError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-[11px] font-semibold text-slate-600 mb-1">{t.forwardHookTitle}</p>
          <p className="text-[11px] text-slate-500">{isAr ? ITEM7_FORWARD_HOOK_NOTE_AR : ITEM7_FORWARD_HOOK_NOTE_EN}</p>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-slate-600 mb-1">{t.consultancyTitle}</p>
          <p className="text-[11px] text-slate-500">{isAr ? CONSULTANCY_FRAMING_NOTE_AR : CONSULTANCY_FRAMING_NOTE_EN}</p>
        </div>
      </div>
    </div>
  );
}
