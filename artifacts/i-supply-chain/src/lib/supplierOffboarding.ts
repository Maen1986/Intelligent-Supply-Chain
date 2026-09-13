/**
 * SI Supplier Lifecycle Governance -- Item 7 of 7: Offboarding & Transition
 * (the neutral, cause-agnostic counterpart to Item 6's for-cause Blacklist)
 * (13 Sep 2026).
 *
 * ============================================================================
 * SOURCED METHODOLOGY (Decision Record 8.7, Rule 2) -- checked, not assumed
 * ============================================================================
 * Supplier exit/transition management is grounded in four real, named,
 * publicly-documented sources, fetched 13 Sep 2026:
 *   1. ISO 44001:2017 (Collaborative Business Relationship Management
 *      Systems) -- Stage 8, "Exit Strategy", of its relationship lifecycle:
 *      a controlled, jointly-planned disengagement (not a unilateral cutoff)
 *      covering scope definition, periodic review, continuity planning
 *      during the transition, and documentation -- and, notably, the
 *      standard does NOT distinguish planned from for-cause exits in how
 *      the controlled process itself should run: "exits from a relationship
 *      can be initiated for different reasons... and at different rates",
 *      but the same disciplined approach applies regardless of cause. This
 *      is the direct sourced basis for this module's own core design
 *      choice below (see "WHAT THIS IS, AND WHAT IT IS DELIBERATELY NOT").
 *   2. Financier Worldwide, "Exit management planning for outsourcing
 *      agreements" -- a real distinction this module adopts: termination-
 *      for-cause and termination-for-convenience are NOT equivalent in
 *      practice, because a supplier exiting for cause has materially less
 *      incentive to cooperate with the transition ("its revenue disappears
 *      ... [it] can forcibly negotiate generous rates ... or frustrate
 *      transitions entirely"). This module's own cooperationLevel field
 *      (Section 1) operationalizes that real distinction.
 *   3. SupplierGateway's supplier-offboarding checklist guidance -- concrete
 *      checklist categories: document collection, contract termination,
 *      information/knowledge transfer, NDA enforcement, asset recovery,
 *      internal knowledge-repository updates, a certificate confirming
 *      data has been wiped, stakeholder communication, vendor feedback, and
 *      post-termination follow-up.
 *   4. Vanta's TPRM vendor-offboarding guidance -- the access-revocation and
 *      data-security lens: reviewing systems/databases access, physical
 *      access areas, residual data, shared credentials, and treating a
 *      vendor relationship as an expanded attack surface that must be
 *      closed off, not merely invoiced-out.
 * ISC's own checklist vocabulary and requirement-level logic below (Section
 * 2) is a deliberate synthesis of these four sources, not an invented
 * standard and not a verbatim copy of any one of them -- disclosed as a
 * synthesis, the same discipline already applied to Item 6's due-process
 * vocabulary.
 *
 * ============================================================================
 * WHAT THIS IS, AND WHAT IT IS DELIBERATELY NOT
 * ============================================================================
 * This is NOT Item 6's for-cause blacklist finding, and it is NOT a
 * duplicate of Item 3's own 'suspended'/'revoked' ASL lifecycle types.
 * Offboarding & Transition is the NEUTRAL, CAUSE-AGNOSTIC logistics of
 * winding a supplier relationship down -- access revocation, data return,
 * asset recovery, knowledge transfer, final settlement, contractual
 * closeout -- regardless of WHY the relationship is ending. Per ISO 44001's
 * own Stage 8 finding (source 1 above), the controlled-disengagement
 * process itself does not change shape based on cause; what changes is the
 * *cooperation level* to expect from the supplier during it (source 2).
 * This module can be TRIGGERED by a for-cause Item 6 blacklist finalize, an
 * Item 3 ASL revocation for unrelated administrative reasons, or any of
 * five ordinary business reasons (contract end, mutual termination,
 * supplier-initiated exit, replacement, insourcing) -- but it does not
 * itself adjudicate or re-litigate that cause; it only reads it, as
 * caller-supplied plain data (Standalone-First), to calibrate cooperation
 * expectations and checklist requirements. supplierRACI.ts's own Item 2
 * design already anticipated this exact split: 'blacklist_decision'
 * (for-cause) and 'offboarding_decision' (neutral transition logistics)
 * are two separate RACI activity keys, not one -- see Section 7 below for
 * a disclosed correction to that file's own stale governance-item labels,
 * found while building this module.
 *
 * ============================================================================
 * AUTHORIZATION BAR -- DELIBERATELY *NOT* ESCALATED LIKE ITEM 6 (disclosed
 * design decision)
 * ============================================================================
 * Item 6's finalize/reverse actions require org_admin SPECIFICALLY, a
 * deliberate escalation over Items 1-5's standard gate, because a blacklist
 * finding is an affirmative, adversarial, for-cause action with real legal
 * exposure. Offboarding closure is different in kind, not just degree: it
 * is neutral operational logistics, not a punitive finding -- and
 * supplierRACI.ts's own pre-existing RACI_TEMPLATE row for
 * 'offboarding_decision' (built at Item 2, 11 Sep 2026, unchanged since)
 * already names its Accountable archetype as "Procurement Director /
 * Category Manager", NOT "Executive Committee for high-risk cases" the way
 * 'blacklist_decision' does. This module therefore uses the STANDARD
 * org_admin-OR-RACI-Accountable-holder gate for every write action
 * (open/update-checklist/close/reopen), the same pattern Items 1-5 use --
 * a deliberate, disclosed departure from Item 6's own escalation, grounded
 * in a design choice this platform already made for Item 2's RACI matrix,
 * not invented here.
 *
 * ============================================================================
 * TWO TIERS, NEITHER UNDERSIZED
 * ============================================================================
 *   - Advisory (default): computeAdvisoryTransitionPlan() -- a recommended
 *     checklist (each item's requirement level calibrated to trigger reason
 *     and cooperation level), a primary approach AND a genuine alternative
 *     (Rule 8), and risk flags -- zero persistence. The client makes the
 *     actual call on how to run its own transition.
 *   - Operational (opt-in): ISC persists the transition record via the
 *     append-only transition_events table
 *     (lib/db/src/schema/transitionEvents.ts), with derived, read-time
 *     checklist/completion state, and -- for the five ordinary-business
 *     trigger reasons only, never for a blacklist/ASL-revocation-triggered
 *     exit that already recorded its own ASL decision -- a real cross-
 *     reference write into Item 3's EXISTING asl_decision_events table
 *     (Section 5), guarded against duplicating a decision Item 6 or Item 3
 *     already made.
 *
 * ============================================================================
 * STANDALONE-FIRST (SI-00 Charter doctrine, Rule 3)
 * ============================================================================
 * Zero runtime imports from supplierBlacklist.ts, supplierPreQualification.ts,
 * or any other sibling module. Every cross-item fact this module's Advisory
 * tier can use -- current blacklist state, current ASL state, an open-
 * commitments signal -- is caller-supplied as plain data via the *Like
 * types in Section 0 below, exactly the same disclosed-mirror pattern
 * Item 6 already established for its own Item 5/Item 1 evidence links.
 */

// ---------------------------------------------------------------------------
// Section 0 -- Caller-supplied cross-item mirrors (Standalone-First, plain
// shapes, never a runtime import)
// ---------------------------------------------------------------------------

/** Mirrors the minimal fields of supplierPreQualification.ts's ASLCurrentState
 * this module actually needs -- not the full ASL record. */
export type AslStateLike = {
  status: string;
  /** Mirrors supplierPreQualification.ts's decisionKeepsOnASL() output for
   * this supplier's current state -- true if still approved/conditionally
   * approved/reinstated, false if already declined/suspended/revoked. */
  keepsOnASL: boolean;
};

/** Mirrors the minimal field of supplierBlacklist.ts's BlacklistCurrentState
 * this module actually needs. */
export type BlacklistStateLike = {
  isBlacklisted: boolean;
};

/** Honest forward-looking gap, same disclosure discipline as
 * supplierBlacklist.ts's own BlacklistBlockSignal (Section 6 of that file):
 * no PO/commercial-commitment engine exists on this platform yet, so this
 * is a manual, caller-supplied signal, not a live query against open POs. */
export type OpenCommitmentSignalLike = {
  hasOpenCommitments: boolean;
  detailEn?: string;
  detailAr?: string;
};

// ---------------------------------------------------------------------------
// Section 1 -- Trigger reason and cooperation-level vocabulary
// ---------------------------------------------------------------------------

export type OffboardingTriggerReason =
  | 'natural_contract_end'
  | 'mutual_termination'
  | 'supplier_initiated_exit'
  | 'replaced_by_another_supplier'
  | 'insourced'
  | 'blacklist_finalized'
  | 'asl_revoked_unrelated';

export const OFFBOARDING_TRIGGER_REASONS: OffboardingTriggerReason[] = [
  'natural_contract_end',
  'mutual_termination',
  'supplier_initiated_exit',
  'replaced_by_another_supplier',
  'insourced',
  'blacklist_finalized',
  'asl_revoked_unrelated',
];

export const OFFBOARDING_TRIGGER_LABELS: Record<OffboardingTriggerReason, { en: string; ar: string }> = {
  natural_contract_end: { en: 'Natural contract end (term expired, not renewed)', ar: 'انتهاء طبيعي للعقد (انتهت المدة، لم يُجدَّد)' },
  mutual_termination: { en: 'Mutual termination', ar: 'إنهاء بالتراضي' },
  supplier_initiated_exit: { en: 'Supplier-initiated exit', ar: 'انسحاب بمبادرة من المورّد' },
  replaced_by_another_supplier: { en: 'Replaced by another supplier (re-sourced)', ar: 'تم استبداله بمورّد آخر (إعادة توريد)' },
  insourced: { en: 'Insourced (brought in-house)', ar: 'تم توطينه داخلياً (إنهاء الاستعانة الخارجية)' },
  blacklist_finalized: { en: 'Cross-reference: a finalized Item 6 blacklist decision', ar: 'إسناد مرجعي: قرار نهائي بالإدراج في القائمة السوداء (البند 6)' },
  asl_revoked_unrelated: { en: 'Cross-reference: Item 3 ASL revoked for unrelated administrative reasons', ar: 'إسناد مرجعي: إلغاء إدراج القائمة المعتمدة لأسباب إدارية غير مرتبطة (البند 3)' },
};

/** True for the two trigger reasons that are themselves a cross-reference to
 * a decision another item (6 or 3) already made -- this module must read,
 * never re-decide or duplicate, those. */
export function isCrossReferencedTrigger(trigger: OffboardingTriggerReason): boolean {
  return trigger === 'blacklist_finalized' || trigger === 'asl_revoked_unrelated';
}

export type CooperationLevel = 'cooperative' | 'limited' | 'adversarial';

export const COOPERATION_LEVEL_LABELS: Record<CooperationLevel, { en: string; ar: string }> = {
  cooperative: { en: 'Cooperative (planned, mutual, or neutral exit)', ar: 'متعاون (خروج مخطَّط له، بالتراضي، أو محايد)' },
  limited: { en: 'Limited (supplier-initiated or unrelated administrative exit)', ar: 'محدود (انسحاب بمبادرة المورّد أو خروج إداري غير مرتبط)' },
  adversarial: { en: 'Adversarial (for-cause, e.g. following a blacklist finding)', ar: 'خصامي (لسبب موجب، كأن يكون عقب قرار إدراج بالقائمة السوداء)' },
};

export const COOPERATION_LEVEL_SOURCE_EN =
  'A supplier exiting for cause has materially less incentive to cooperate with an orderly transition than one exiting on ordinary business terms -- without clear exit obligations, an adversarial exit can see a supplier "forcibly negotiate generous rates ... or frustrate transitions entirely" (Financier Worldwide, "Exit management planning for outsourcing agreements"). This module surfaces that real distinction as an explicit field rather than treating every exit as equally cooperative.';
export const COOPERATION_LEVEL_SOURCE_AR =
  'يكون لدى المورّد الذي يخرج لسبب موجب حافز أقل بكثير للتعاون في انتقال منظَّم مقارنة بمورّد يخرج ضمن شروط عمل اعتيادية -- فبدون التزامات خروج واضحة، قد "يفرض المورّد أسعاراً مبالغاً فيها ... أو يعرقل عملية الانتقال بالكامل" في خروج خصامي. تُبرز هذه الوحدة هذا الفارق الحقيقي كحقل صريح بدلاً من معاملة كل خروج على أنه متعاون بالتساوي.';

/**
 * Sourced default (source 2), always caller-overridable -- this is a
 * starting point, not a verdict. The cross-referenced triggers (Section 1
 * above) get the strongest defaults since they represent decisions Items 6
 * and 3 already made about this supplier.
 */
export function inferCooperationLevel(trigger: OffboardingTriggerReason): CooperationLevel {
  switch (trigger) {
    case 'blacklist_finalized':
      return 'adversarial';
    case 'asl_revoked_unrelated':
    case 'supplier_initiated_exit':
      return 'limited';
    case 'natural_contract_end':
    case 'mutual_termination':
    case 'replaced_by_another_supplier':
    case 'insourced':
      return 'cooperative';
  }
}

// ---------------------------------------------------------------------------
// Section 2 -- Checklist vocabulary and requirement-level logic (sourced:
// SupplierGateway + Vanta, source 3-4 above)
// ---------------------------------------------------------------------------

export type TransitionChecklistItemKey =
  | 'access_revocation'
  | 'data_return_or_destruction'
  | 'asset_recovery'
  | 'knowledge_transfer'
  | 'final_settlement'
  | 'contractual_closeout'
  | 'open_commitment_wind_down'
  | 'exit_feedback_and_reference'
  | 'post_exit_follow_up';

export const TRANSITION_CHECKLIST_ITEM_KEYS: TransitionChecklistItemKey[] = [
  'access_revocation',
  'data_return_or_destruction',
  'asset_recovery',
  'knowledge_transfer',
  'final_settlement',
  'contractual_closeout',
  'open_commitment_wind_down',
  'exit_feedback_and_reference',
  'post_exit_follow_up',
];

export interface ChecklistItemDefinition {
  key: TransitionChecklistItemKey;
  labelEn: string;
  labelAr: string;
  /** Which sourced source(s) this item traces to -- Rule 2, never an
   * unstated checklist item. */
  sourceEn: string;
  sourceAr: string;
}

export const TRANSITION_CHECKLIST_DEFINITIONS: ChecklistItemDefinition[] = [
  {
    key: 'access_revocation',
    labelEn: 'Access revocation (systems/databases, physical access, shared credentials)',
    labelAr: 'إلغاء الصلاحيات (الأنظمة/قواعد البيانات، الدخول المادي، بيانات الاعتماد المشتركة)',
    sourceEn: 'Vanta TPRM vendor-offboarding guidance.',
    sourceAr: 'إرشادات Vanta لإنهاء تعامل الموردين ضمن إدارة مخاطر الطرف الثالث.',
  },
  {
    key: 'data_return_or_destruction',
    labelEn: 'Data return or destruction, with a confirming record',
    labelAr: 'إعادة البيانات أو إتلافها، مع سجل تأكيد',
    sourceEn: 'SupplierGateway offboarding checklist (formal confirmation all data has been wiped); Vanta (residual-data risk).',
    sourceAr: 'قائمة SupplierGateway لإنهاء تعامل الموردين (تأكيد رسمي بمسح كل البيانات)؛ Vanta (مخاطر البيانات المتبقية).',
  },
  {
    key: 'asset_recovery',
    labelEn: 'Asset recovery (equipment, badges, company property)',
    labelAr: 'استرداد الأصول (المعدات، البطاقات، ممتلكات الشركة)',
    sourceEn: 'SupplierGateway offboarding checklist.',
    sourceAr: 'قائمة SupplierGateway لإنهاء تعامل الموردين.',
  },
  {
    key: 'knowledge_transfer',
    labelEn: 'Knowledge transfer (transition documentation, replacement-supplier coordination if applicable)',
    labelAr: 'نقل المعرفة (توثيق الانتقال، التنسيق مع المورّد البديل إن وُجد)',
    sourceEn: 'Financier Worldwide (incumbent-to-replacement coordination); SupplierGateway (internal knowledge-repository updates).',
    sourceAr: 'Financier Worldwide (التنسيق بين المورّد الحالي والبديل)؛ SupplierGateway (تحديث مستودعات المعرفة الداخلية).',
  },
  {
    key: 'final_settlement',
    labelEn: 'Final settlement (outstanding invoices, credits, reconciliation)',
    labelAr: 'التسوية النهائية (الفواتير المستحقة، الأرصدة الدائنة، المطابقة)',
    sourceEn: 'SupplierGateway; Vanta (financial and contract documentation).',
    sourceAr: 'SupplierGateway؛ Vanta (التوثيق المالي والتعاقدي).',
  },
  {
    key: 'contractual_closeout',
    labelEn: 'Contractual closeout (NDA/non-solicitation survival confirmed, IP handback, termination correspondence on file)',
    labelAr: 'إغلاق تعاقدي (تأكيد سريان بنود السرية/عدم الاستقطاب، إعادة الملكية الفكرية، حفظ مراسلات الإنهاء)',
    sourceEn: 'SupplierGateway (NDA enforcement); Vanta (asset-ownership/IP terms review).',
    sourceAr: 'SupplierGateway (تطبيق اتفاقية السرية)؛ Vanta (مراجعة شروط ملكية الأصول/الملكية الفكرية).',
  },
  {
    key: 'open_commitment_wind_down',
    labelEn: 'Open-commitment wind-down (open POs, active contracts, warranty/support obligations)',
    labelAr: 'تصفية الالتزامات المفتوحة (أوامر الشراء المفتوحة، العقود النشطة، التزامات الضمان/الدعم)',
    sourceEn: 'ISO 44001 Stage 8 (continuity planning during disengagement).',
    sourceAr: 'المرحلة الثامنة من الأيزو 44001 (التخطيط لاستمرارية الأعمال أثناء إنهاء التعامل).',
  },
  {
    key: 'exit_feedback_and_reference',
    labelEn: 'Exit feedback and reference (vendor feedback request, exit interview)',
    labelAr: 'تغذية راجعة عند الخروج ومرجعية (طلب تغذية راجعة من المورّد، مقابلة خروج)',
    sourceEn: 'SupplierGateway (vendor feedback); ISO 44001 Stage 8 ("never to burn your bridges" -- relationship preservation).',
    sourceAr: 'SupplierGateway (تغذية راجعة من المورّد)؛ المرحلة الثامنة من الأيزو 44001 (الحفاظ على العلاقة مستقبلاً).',
  },
  {
    key: 'post_exit_follow_up',
    labelEn: 'Post-exit follow-up (periodic check for security exposure, payment clearance, audit needs)',
    labelAr: 'متابعة ما بعد الخروج (تحقق دوري من المخاطر الأمنية، تصفية المدفوعات، احتياجات التدقيق)',
    sourceEn: 'SupplierGateway (post-termination follow-up).',
    sourceAr: 'SupplierGateway (متابعة ما بعد الإنهاء).',
  },
];

export function getChecklistItemDefinition(key: TransitionChecklistItemKey): ChecklistItemDefinition {
  const def = TRANSITION_CHECKLIST_DEFINITIONS.find((d) => d.key === key);
  if (!def) throw new Error(`No checklist definition for ${key}`);
  return def;
}

export type ChecklistRequirementLevel = 'mandatory' | 'conditional_mandatory' | 'recommended' | 'not_applicable';

export const CHECKLIST_REQUIREMENT_LABELS: Record<ChecklistRequirementLevel, { en: string; ar: string }> = {
  mandatory: { en: 'Mandatory', ar: 'إلزامي' },
  conditional_mandatory: { en: 'Mandatory for this exit', ar: 'إلزامي في هذا الخروج' },
  recommended: { en: 'Recommended', ar: 'موصى به' },
  not_applicable: { en: 'Not applicable to this exit', ar: 'لا ينطبق على هذا الخروج' },
};

/**
 * Requirement level is computed ONCE from the facts known when the
 * transition is opened (trigger reason, cooperation level, whether a
 * replacement supplier is named) -- fixed for the life of that transition
 * record, never silently recomputed mid-flight as other facts change
 * (Rule 1: no drifting, undisclosed basis for a gate).
 */
export function determineChecklistRequirement(
  key: TransitionChecklistItemKey,
  trigger: OffboardingTriggerReason,
  cooperationLevel: CooperationLevel,
  replacementSupplierNamed: boolean,
): ChecklistRequirementLevel {
  switch (key) {
    case 'access_revocation':
    case 'data_return_or_destruction':
    case 'final_settlement':
    case 'contractual_closeout':
    case 'open_commitment_wind_down':
    case 'asset_recovery':
      return 'mandatory';
    case 'knowledge_transfer':
      return trigger === 'replaced_by_another_supplier' || trigger === 'insourced' || replacementSupplierNamed
        ? 'conditional_mandatory'
        : 'recommended';
    case 'exit_feedback_and_reference':
      // ISO 44001's own "never burn your bridges" step assumes a
      // relationship worth preserving -- honestly not applicable once
      // that relationship has already been formally severed for cause.
      return cooperationLevel === 'adversarial' ? 'not_applicable' : 'mandatory';
    case 'post_exit_follow_up':
      return 'recommended';
  }
}

export function isGatingRequirement(level: ChecklistRequirementLevel): boolean {
  return level === 'mandatory' || level === 'conditional_mandatory';
}

// ---------------------------------------------------------------------------
// Section 3 -- Advisory tier: recommended transition plan, never a
// persisted action, zero persistence
// ---------------------------------------------------------------------------

export interface OffboardingAdvisoryInput {
  triggerReason: OffboardingTriggerReason;
  /** Always caller-overridable -- see inferCooperationLevel()'s own header. */
  cooperationLevelOverride?: CooperationLevel | null;
  replacementSupplierNamed?: boolean;
  blacklistState?: BlacklistStateLike | null;
  aslState?: AslStateLike | null;
  openCommitments?: OpenCommitmentSignalLike | null;
}

export interface TransitionChecklistItemAssessment {
  key: TransitionChecklistItemKey;
  labelEn: string;
  labelAr: string;
  requirement: ChecklistRequirementLevel;
  sourceEn: string;
  sourceAr: string;
}

export interface OffboardingAdvisoryAssessment {
  cooperationLevel: CooperationLevel;
  checklist: TransitionChecklistItemAssessment[];
  /** Rule 8 -- a genuine second option, never a single false-certainty path. */
  primaryEn: string;
  primaryAr: string;
  alternativeEn: string;
  alternativeAr: string;
  riskFlagsEn: string[];
  riskFlagsAr: string[];
  /** Whether the Operational tier's close action should write a real
   * cross-reference into Item 3's asl_decision_events (Section 5) --
   * false for the two cross-referenced triggers, since Item 6 or Item 3
   * already made that decision and this module must not duplicate it. */
  aslCrossReferenceNeeded: boolean;
}

function buildChecklistAssessment(
  trigger: OffboardingTriggerReason,
  cooperationLevel: CooperationLevel,
  replacementSupplierNamed: boolean,
): TransitionChecklistItemAssessment[] {
  return TRANSITION_CHECKLIST_DEFINITIONS.map((def) => ({
    key: def.key,
    labelEn: def.labelEn,
    labelAr: def.labelAr,
    sourceEn: def.sourceEn,
    sourceAr: def.sourceAr,
    requirement: determineChecklistRequirement(def.key, trigger, cooperationLevel, replacementSupplierNamed),
  }));
}

/**
 * Advisory tier entry point. Never persists, never asserts a decision --
 * the client makes the actual call on how to run its own transition
 * (Consultancy Framing, Section 8).
 */
export function computeAdvisoryTransitionPlan(input: OffboardingAdvisoryInput): OffboardingAdvisoryAssessment {
  const { triggerReason, replacementSupplierNamed = false, blacklistState, aslState, openCommitments } = input;
  const inferredLevel = inferCooperationLevel(triggerReason);
  const cooperationLevel = input.cooperationLevelOverride ?? inferredLevel;

  const checklist = buildChecklistAssessment(triggerReason, cooperationLevel, replacementSupplierNamed);

  const riskFlagsEn: string[] = [];
  const riskFlagsAr: string[] = [];

  if (cooperationLevel === 'adversarial') {
    riskFlagsEn.push('Adversarial exit: verify access revocation and data destruction independently rather than relying solely on the outgoing supplier\'s own confirmation -- a for-cause exit carries reduced cooperation incentive (Financier Worldwide).');
    riskFlagsAr.push('خروج خصامي: تحقّقوا من إلغاء الصلاحيات وإتلاف البيانات بشكل مستقل، ولا تعتمدوا فقط على تأكيد المورّد الخارج نفسه -- فالخروج لسبب موجب يترافق مع حافز تعاون أضعف.');
  }
  if (input.cooperationLevelOverride && input.cooperationLevelOverride !== inferredLevel) {
    riskFlagsEn.push(`Cooperation level was manually set to "${COOPERATION_LEVEL_LABELS[input.cooperationLevelOverride].en}", overriding the trigger-reason default of "${COOPERATION_LEVEL_LABELS[inferredLevel].en}" -- this override is respected (ISC does not adjudicate), but is flagged here so it is a visible, deliberate choice rather than an unnoticed mismatch.`);
    riskFlagsAr.push(`تم تعيين مستوى التعاون يدوياً إلى "${COOPERATION_LEVEL_LABELS[input.cooperationLevelOverride].ar}"، بخلاف الإعداد الافتراضي المبني على سبب الخروج وهو "${COOPERATION_LEVEL_LABELS[inferredLevel].ar}" -- يُحترَم هذا التجاوز (آي إس سي لا تُصدر أحكاماً)، لكن يتم التنويه به هنا ليكون خياراً واضحاً ومتعمَّداً لا فارقاً غير ملحوظ.`);
  }
  if (openCommitments?.hasOpenCommitments) {
    riskFlagsEn.push(`Open commitments were flagged${openCommitments.detailEn ? `: ${openCommitments.detailEn}` : ''} -- confirm the "open-commitment wind-down" checklist item is genuinely resolved, not merely marked complete, before closing this transition.`);
    riskFlagsAr.push(`تم رصد التزامات مفتوحة${openCommitments.detailAr ? `: ${openCommitments.detailAr}` : ''} -- تأكدوا من أن بند "تصفية الالتزامات المفتوحة" قد أُنجز فعلياً، لا مجرد وضع علامة إنجاز عليه، قبل إغلاق هذا الانتقال.`);
  }
  if (blacklistState?.isBlacklisted && triggerReason !== 'blacklist_finalized') {
    riskFlagsEn.push('This supplier is currently blacklisted (Item 6) but the trigger reason recorded here is not "blacklist_finalized" -- confirm this is intentional (e.g. a separate, unrelated exit reason arose first) rather than a missed cross-reference.');
    riskFlagsAr.push('هذا المورّد مُدرج حالياً في القائمة السوداء (البند 6) لكن سبب الخروج المسجَّل هنا ليس "قرار نهائي بالإدراج في القائمة السوداء" -- تأكدوا أن هذا متعمَّد (مثل نشوء سبب خروج منفصل غير مرتبط أولاً) وليس إسناداً مرجعياً فائتاً.');
  }

  const aslCrossReferenceNeeded = !isCrossReferencedTrigger(triggerReason) && (aslState ? aslState.keepsOnASL : true);

  const primaryEn = 'Run the full standard checklist sequentially, confirming each mandatory item before closing, per ISO 44001\'s own controlled-disengagement discipline (Stage 8) -- a joint, documented process rather than an ad hoc cutoff.';
  const primaryAr = 'نفّذوا القائمة الكاملة القياسية بالتسلسل، مع تأكيد كل بند إلزامي قبل الإغلاق، وفق منهجية إنهاء التعامل المنضبط في المرحلة الثامنة من الأيزو 44001 -- عملية موثّقة ومشتركة، لا قطعاً عشوائياً.';
  const alternativeEn = replacementSupplierNamed || triggerReason === 'replaced_by_another_supplier'
    ? 'If a replacement supplier is already receiving deliveries, front-load knowledge transfer and grant the replacement parity access BEFORE revoking the outgoing supplier\'s own access, trading a short overlap window for zero service interruption -- "the customer requires high levels of service right up to the point where the contract ends" (Financier Worldwide).'
    : 'If no replacement is yet in place, prioritize access revocation and data return first (closing the security exposure immediately), and treat knowledge transfer as a lower-urgency, best-effort item rather than a blocking one -- accepting a documentation gap in exchange for closing the access risk sooner (Vanta\'s own "expanded attack surface" framing).';
  const alternativeAr = replacementSupplierNamed || triggerReason === 'replaced_by_another_supplier'
    ? 'إذا كان هناك مورّد بديل يستلم التوريدات بالفعل، قدّموا نقل المعرفة ومنحوا البديل صلاحيات مكافئة قبل إلغاء صلاحيات المورّد الخارج، مقابل نافذة تداخل قصيرة تحقق استمرارية الخدمة دون انقطاع.'
    : 'إذا لم يوجد بديل بعد، أعطوا الأولوية لإلغاء الصلاحيات وإعادة البيانات أولاً (لإغلاق الخطر الأمني فوراً)، واعتبروا نقل المعرفة بنداً أقل إلحاحاً وليس عائقاً للإغلاق -- بمقابل قبول فجوة توثيقية مؤقتة في سبيل إغلاق خطر الوصول بشكل أسرع.';

  return {
    cooperationLevel,
    checklist,
    primaryEn,
    primaryAr,
    alternativeEn,
    alternativeAr,
    riskFlagsEn,
    riskFlagsAr,
    aslCrossReferenceNeeded,
  };
}

/**
 * Pre-fill helper (usability, not a hard decision): suggests a trigger
 * reason and cooperation level from Item 6/Item 3 state the caller already
 * has on hand, so a user does not have to re-type a fact the platform
 * already knows elsewhere. Purely a suggestion -- always caller-
 * overridable, never auto-applied without the user seeing and confirming
 * it (same "recommend, never assert" discipline as the rest of this
 * module).
 */
export function suggestOffboardingTriggerContext(
  blacklistState: BlacklistStateLike | null | undefined,
  aslState: AslStateLike | null | undefined,
): { suggestedTrigger: OffboardingTriggerReason | null; suggestedCooperationLevel: CooperationLevel | null } {
  if (blacklistState?.isBlacklisted) {
    return { suggestedTrigger: 'blacklist_finalized', suggestedCooperationLevel: 'adversarial' };
  }
  if (aslState && !aslState.keepsOnASL) {
    return { suggestedTrigger: 'asl_revoked_unrelated', suggestedCooperationLevel: 'limited' };
  }
  return { suggestedTrigger: null, suggestedCooperationLevel: null };
}

// ---------------------------------------------------------------------------
// Section 4 -- Operational tier: current-state derivation from append-only
// events (replay) -- mirrors computeCurrentBlacklistState()'s own pattern.
// ---------------------------------------------------------------------------

export type TransitionEventAction = 'opened' | 'checklist_item_updated' | 'closed' | 'reopened';
export type TransitionItemStatus = 'pending' | 'in_progress' | 'complete' | 'not_applicable';

export interface TransitionEventLike {
  id: number | string;
  supplierId: string;
  action: TransitionEventAction;
  /** Set only on 'opened'; null otherwise. Immutable for the life of the
   * transition record once set -- reopening does not change it. */
  triggerReason: OffboardingTriggerReason | null;
  cooperationLevel: CooperationLevel | null;
  replacementSupplierNamed: boolean | null;
  /** Set only on 'checklist_item_updated'; null otherwise. */
  checklistItemKey: TransitionChecklistItemKey | null;
  itemStatus: TransitionItemStatus | null;
  createdAt: string;
}

export interface TransitionChecklistItemState {
  key: TransitionChecklistItemKey;
  requirement: ChecklistRequirementLevel;
  status: TransitionItemStatus;
  updatedAtIso: string | null;
}

export interface TransitionCurrentState {
  supplierId: string;
  isOpen: boolean;
  isClosed: boolean;
  triggerReason: OffboardingTriggerReason | null;
  cooperationLevel: CooperationLevel | null;
  replacementSupplierNamed: boolean;
  checklist: TransitionChecklistItemState[];
  /** Percentage (0-100) of GATING items (mandatory + conditional_mandatory
   * -- see isGatingRequirement()) that are complete or not_applicable.
   * Recommended items do not count toward or against this figure. */
  completionPct: number;
  closedAtIso: string | null;
  latestEvent: TransitionEventLike | null;
}

function sortTransitionEventsChronologically(events: TransitionEventLike[]): TransitionEventLike[] {
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Replays one supplier's full append-only transition-event history into
 * its current state. Requirement levels are computed ONCE from the facts
 * recorded at 'opened' time (see determineChecklistRequirement()'s own
 * header) and held fixed for the life of the record; item STATUS is what
 * changes as 'checklist_item_updated' events arrive. 'closed' /'reopened'
 * toggle isClosed without ever discarding checklist progress -- append-
 * only, nothing is destroyed by reopening.
 */
export function computeCurrentTransitionState(supplierId: string, events: TransitionEventLike[], asOf: Date = new Date()): TransitionCurrentState {
  const own = sortTransitionEventsChronologically(events.filter((e) => e.supplierId === supplierId));
  void asOf; // reserved for future time-bound logic, unused today -- honestly not referenced rather than silently dropped

  if (own.length === 0 || own[0].action !== 'opened') {
    return {
      supplierId,
      isOpen: false,
      isClosed: false,
      triggerReason: null,
      cooperationLevel: null,
      replacementSupplierNamed: false,
      checklist: [],
      completionPct: 0,
      closedAtIso: null,
      latestEvent: own.length > 0 ? own[own.length - 1] : null,
    };
  }

  const openedEvent = own[0];
  const triggerReason = openedEvent.triggerReason as OffboardingTriggerReason;
  const cooperationLevel = openedEvent.cooperationLevel as CooperationLevel;
  const replacementSupplierNamed = !!openedEvent.replacementSupplierNamed;

  const checklistMap = new Map<TransitionChecklistItemKey, TransitionChecklistItemState>();
  for (const key of TRANSITION_CHECKLIST_ITEM_KEYS) {
    const requirement = determineChecklistRequirement(key, triggerReason, cooperationLevel, replacementSupplierNamed);
    checklistMap.set(key, {
      key,
      requirement,
      status: requirement === 'not_applicable' ? 'not_applicable' : 'pending',
      updatedAtIso: null,
    });
  }

  let isClosed = false;
  let closedAtIso: string | null = null;

  for (const ev of own) {
    if (ev.action === 'checklist_item_updated' && ev.checklistItemKey && ev.itemStatus) {
      const current = checklistMap.get(ev.checklistItemKey);
      if (current) {
        checklistMap.set(ev.checklistItemKey, { ...current, status: ev.itemStatus, updatedAtIso: ev.createdAt });
      }
    }
    if (ev.action === 'closed') { isClosed = true; closedAtIso = ev.createdAt; }
    if (ev.action === 'reopened') { isClosed = false; closedAtIso = null; }
  }

  const checklist = TRANSITION_CHECKLIST_ITEM_KEYS.map((k) => checklistMap.get(k)!);
  const gatingItems = checklist.filter((c) => isGatingRequirement(c.requirement));
  const gatingComplete = gatingItems.filter((c) => c.status === 'complete' || c.status === 'not_applicable');
  const completionPct = gatingItems.length === 0 ? 100 : Math.round((gatingComplete.length / gatingItems.length) * 100);

  return {
    supplierId,
    isOpen: true,
    isClosed,
    triggerReason,
    cooperationLevel,
    replacementSupplierNamed,
    checklist,
    completionPct,
    closedAtIso,
    latestEvent: own[own.length - 1],
  };
}

export interface TransitionClosureValidation {
  valid: boolean;
  errorsEn: string[];
  errorsAr: string[];
  blockingItems: TransitionChecklistItemKey[];
}

/**
 * The core closure gate: every GATING item (mandatory or conditional_
 * mandatory -- never recommended items, which are informational only) must
 * be 'complete' or 'not_applicable' before a transition record can close.
 * Mirrors validateBlacklistFinalization()'s own "refuse before insert,
 * re-validated server-side, never trust a UI that happened to allow the
 * click" discipline.
 */
export function validateTransitionClosure(state: TransitionCurrentState): TransitionClosureValidation {
  const errorsEn: string[] = [];
  const errorsAr: string[] = [];
  const blockingItems: TransitionChecklistItemKey[] = [];

  if (!state.isOpen) {
    errorsEn.push('No open transition record exists for this supplier -- open one before attempting to close it.');
    errorsAr.push('لا يوجد سجل انتقال مفتوح لهذا المورّد -- افتحوا سجلاً أولاً قبل محاولة إغلاقه.');
    return { valid: false, errorsEn, errorsAr, blockingItems };
  }
  if (state.isClosed) {
    errorsEn.push('This transition record is already closed.');
    errorsAr.push('سجل الانتقال هذا مُغلق بالفعل.');
    return { valid: false, errorsEn, errorsAr, blockingItems };
  }

  for (const item of state.checklist) {
    if (isGatingRequirement(item.requirement) && item.status !== 'complete' && item.status !== 'not_applicable') {
      blockingItems.push(item.key);
    }
  }
  if (blockingItems.length > 0) {
    const labels = blockingItems.map((k) => getChecklistItemDefinition(k).labelEn).join(', ');
    const labelsAr = blockingItems.map((k) => getChecklistItemDefinition(k).labelAr).join('، ');
    errorsEn.push(`Cannot close -- the following mandatory checklist items are not yet complete: ${labels}.`);
    errorsAr.push(`لا يمكن الإغلاق -- بنود القائمة الإلزامية التالية لم تُنجز بعد: ${labelsAr}.`);
  }

  return { valid: errorsEn.length === 0, errorsEn, errorsAr, blockingItems };
}

// ---------------------------------------------------------------------------
// Section 5 -- ASL cross-reference into Item 3's asl_decision_events (the
// route layer performs the actual write; this is the disclosed, shared
// reason-text/reason-category builder so both the route and any UI preview
// show identical wording -- never independently re-worded in two places).
// ---------------------------------------------------------------------------

/** Mirrors supplierPreQualification.ts's LifecycleReasonCategory -- kept as
 * a plain string union here (Standalone-First: no runtime import) rather
 * than re-exporting that module's own type. */
export type AslLifecycleReasonCategoryLike = 'commercial_relationship_ended' | 'voluntary_exit';

/**
 * Maps a trigger reason to the asl_decision_events reasonCategory the route
 * layer should write, or null when NO write should happen at all -- the
 * two cross-referenced triggers (blacklist_finalized, asl_revoked_unrelated)
 * represent a decision Item 6 or Item 3 already recorded; writing a SECOND
 * 'revoked' row here would duplicate, not complement, that decision. This
 * is the guard the route layer must honor (see offboarding.ts's own
 * header).
 */
export function mapTriggerToAslReasonCategory(trigger: OffboardingTriggerReason): AslLifecycleReasonCategoryLike | null {
  switch (trigger) {
    case 'supplier_initiated_exit':
      return 'voluntary_exit';
    case 'natural_contract_end':
    case 'mutual_termination':
    case 'replaced_by_another_supplier':
    case 'insourced':
      return 'commercial_relationship_ended';
    case 'blacklist_finalized':
    case 'asl_revoked_unrelated':
      return null;
  }
}

export function buildAslCrossReferenceReasonNote(transitionEventId: number | string, trigger: OffboardingTriggerReason): { en: string; ar: string } {
  const triggerLabel = OFFBOARDING_TRIGGER_LABELS[trigger];
  return {
    en: `Automatically marked as revoked on the Approved Supplier List as a direct consequence of Item 7 transition event #${transitionEventId} closing (trigger: ${triggerLabel.en}). This is a real cross-reference, not an independent decision.`,
    ar: `تم وضع علامة إلغاء الإدراج تلقائياً في القائمة المعتمدة كنتيجة مباشرة لإغلاق حدث انتقال البند 7 رقم ${transitionEventId} (السبب: ${triggerLabel.ar}). هذا إسناد مرجعي حقيقي، وليس قراراً مستقلاً.`,
  };
}

// ---------------------------------------------------------------------------
// Section 6 -- Disclosed correction found while building this module, and
// closing note for the full 7-item chain
// ---------------------------------------------------------------------------

/**
 * DISCLOSED CORRECTION (found during this build, not a new build itself):
 * supplierRACI.ts's own RACI_ACTIVITIES table (built at Item 2, 11 Sep
 * 2026) carried two stale governance-item labels predating the final,
 * locked 7-item spec -- 'blacklist_decision' was labeled "Item 7a --
 * Blacklist" and 'offboarding_decision' was labeled "Item 7b --
 * Offboarding", an early split-numbering guess from before the spec
 * finalized as the current 1-COPQ/2-RACI/3-ASL/4-Onboarding/5-Periodic-
 * Eval/6-Blacklist/7-Offboarding sequence. Corrected in this same change
 * (see supplierRACI.ts's own RACI_ACTIVITIES entries) to "Item 6 --
 * Blacklist" and "Item 7 -- Offboarding & Transition" respectively --
 * the same kind of stale-label correction already applied once before
 * (Site Map v176's own correction of Item 6's placeholder "Second-Party
 * Audits" label). A third stale label was found in the same table
 * ('second_party_audit': "Item 6 -- Second-party Audit") that does not
 * correspond to any of the final 7 items at all; left in place with its
 * own disclosed comment (see supplierRACI.ts) rather than silently
 * deleted, since removing a RACI activity key outright is a larger,
 * separate change this build does not attempt.
 *
 * CLOSING NOTE: this module completes the full 7-item Supplier Lifecycle
 * Governance build (1: COPQ, 2: RACI, 3: Pre-Qualification & ASL, 4:
 * Onboarding, 5: Periodic Evaluation, 6: Blacklist, 7: Offboarding &
 * Transition). Every item in the chain now has a real, documented seam to
 * the items around it: Item 1's COPQ and Item 5's periodic-evaluation
 * outcomes feed Item 6's evidence; Item 6's blacklist finalize cross-
 * references Item 3's ASL and, per this module, can trigger Item 7; Item 7
 * itself cross-references both Item 6's blacklist state and Item 3's ASL
 * state as caller-supplied context, and its own close action can write
 * back into Item 3's ASL register for ordinary-business exits. No item
 * silently duplicates another's decision -- every cross-reference is a
 * real, disclosed, Standalone-First read or write, never a live import.
 */

// ---------------------------------------------------------------------------
// Section 7 -- Consultancy framing (disclosed copy, reused by UI)
// ---------------------------------------------------------------------------

export const CONSULTANCY_FRAMING_NOTE_EN =
  'ISC is not shop-floor operations and does not adjudicate disputes: this module produces a recommended transition plan and (Operational tier) a persisted record of checklist progress YOUR organization\'s own authorized user tracked. It does not itself revoke access, return data, or contact the supplier on your behalf.';
export const CONSULTANCY_FRAMING_NOTE_AR =
  'آي إس سي ليست جهة تشغيل ميداني ولا تفصل في النزاعات: تنتج هذه الوحدة خطة انتقال موصى بها، و(في المستوى التشغيلي) سجلاً محفوظاً لتقدّم قائمة المهام تابعه مستخدم مخوَّل من مؤسستكم. لا تقوم آي إس سي بإلغاء الصلاحيات أو إعادة البيانات أو التواصل مع المورّد نيابة عنكم.';
