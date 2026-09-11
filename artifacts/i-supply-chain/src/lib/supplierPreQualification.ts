/**
 * SI Supplier Lifecycle Governance -- Item 3 of 7: Pre-Qualification & ASL
 * (Approved Supplier List) (11 Sep 2026).
 *
 * WHAT THIS MODULE IS, AND WHAT IT DELIBERATELY IS NOT: this is not a new,
 * independent qualification engine -- ISC already ships one (Module 04,
 * artifacts/i-supply-chain/src/lib/supplierQualificationGates.ts,
 * runQualificationGates()), which turns Module 03's Supplier Object Model
 * evidence into a disciplined PASS/CONDITIONAL/FAIL/CRITICAL_FAIL gate
 * result. Item 3's actual job, per the sourced design brief (section 2.1),
 * is narrower and more honest than re-deriving qualification from scratch:
 * turn that existing gate result into an ASL (Approved Supplier List)
 * decision -- and, critically, make ASL status a DERIVED field, never a
 * manual flag a user can just toggle on. A supplier is on the ASL only
 * because (a) Module 04's gates say QUALIFIED or CONDITIONALLY_QUALIFIED,
 * AND (b) a real, documented approval reason was recorded, AND (c) the
 * approver was the organization's own designated accountable owner for
 * this decision (Item 2's RACI 'prequalification_approval' Accountable
 * role, already a first-class activity key in supplierRACI.ts). Standard
 * practice (sourced, not invented): a pre-qualification questionnaire
 * covering financials, quality certifications and references filters
 * candidates, and approval requires a documented reason -- an audit, a
 * qualification form, a certification, an engineering approval, a
 * performance record, or a commercial agreement -- never an unstated
 * judgment call (sourceday.com "Supplier Prequalification"; greenlight.guru
 * "Supplier Qualification Process"; lassosupplychain.com "Approved Supplier
 * List"; cenitconsulting.com supplier-qualification guidance). ASL
 * membership is also explicitly NOT a permanent status: review frequency
 * should scale with the supplier's own risk/criticality profile rather than
 * running on one fixed calendar for every supplier -- so this module reuses
 * the SAME risk-tiering signals Module 02 (Kraljic) and Module 05
 * (concentration/dependency) already compute, rather than inventing a
 * parallel scoring system.
 *
 * STANDALONE-FIRST (Rule 3, same discipline as supplierCOPQ.ts and
 * supplierRACI.ts, both zero-import files): this module has NO runtime
 * import from supplierQualificationGates.ts, supplierRACI.ts,
 * kraljicScoring.ts or supplierConcentration.ts, even though it is
 * conceptually downstream of all four. Every cross-module fact -- the
 * qualification-gate outcome, the RACI Accountable holder, the Kraljic
 * quadrant, the concentration band -- is caller-supplied as plain data
 * (see QualificationGateSnapshot / RiskTierSignals below). The calling page
 * (SupplierPreQualification.tsx) is the one place these are wired together,
 * exactly the same "engines stay pure, the UI composes them" pattern this
 * codebase already uses everywhere else.
 *
 * TWO-TIER STANDARD (design brief section 2.8, platform-wide): Advisory
 * (default, zero persistence) runs computeAdvisoryASLAssessment() fresh in
 * the browser -- a scored qualify/don't-qualify recommendation with no
 * client name attached to any stored row. Operational (opt-in) additionally
 * runs validateASLDecision() and persists the result via the append-only
 * asl_decision_events table (lib/db/src/schema/aslRegister.ts) as ISC's
 * system of record for the client's real ASL register, carrying the real,
 * documented approver identity. Both tiers share the identical derivation
 * logic in this file; they differ only in what gets written down.
 *
 * PRIMARY RECOMMENDATION + STRONG ALTERNATIVE (Rule 8): every advisory
 * assessment below names both, with the trade-off stated, never a single
 * false-certainty path.
 *
 * NEVER FABRICATE (Rule 1 / Decision Record 8.7): when no qualification-
 * gate snapshot is supplied at all, this module returns an explicit
 * INSUFFICIENT_DATA-shaped assessment rather than guessing a status. Review
 * -cadence defaults (DEFAULT_REVIEW_CADENCE_DAYS) are disclosed structural
 * defaults, not a claimed sourced industry benchmark -- same disclosure
 * discipline supplierQualificationGates.ts already applies to
 * DEFAULT_GATE_THRESHOLDS. Lifecycle reason categories (suspend/revoke/
 * reinstate) are disclosed as standard vendor-lifecycle-management practice,
 * not attributed to the four sources above, which specifically speak to the
 * *approval* reason only.
 *
 * COMPETITIVE MOAT (Rule 10): the real differentiator this module ships is
 * that ASL status cannot drift from the evidence -- a generic spreadsheet-
 * based ASL tracker lets anyone type "Approved" next to a supplier's name
 * with no link back to why. Here, `validateASLDecision()` refuses an
 * 'approved' or 'conditionally_approved' decision unless the supplied gate
 * snapshot actually supports it, and the review cadence is computed from
 * the same Kraljic/concentration signals already driving sourcing strategy
 * elsewhere on the platform, not a second, disconnected risk score. The
 * honest gap against a full enterprise SRM suite (e.g. a dedicated supplier
 * -portal workflow with automated document expiry chasing) is named in the
 * worked-example doc, not hidden here.
 */

// ---------------------------------------------------------------------------
// Caller-supplied inputs (mirrors of other engines' output shapes -- plain
// data only, per the Standalone-First note above)
// ---------------------------------------------------------------------------

/** Mirrors supplierQualificationGates.ts's OverallQualificationStatus. */
export type QualificationGateStatus =
  | 'QUALIFIED'
  | 'CONDITIONALLY_QUALIFIED'
  | 'NOT_QUALIFIED'
  | 'INSUFFICIENT_EVIDENCE';

/** Mirrors supplierQualificationGates.ts's DueDiligenceTier. */
export type DueDiligenceTier = 'STANDARD' | 'ENHANCED';

/**
 * A plain-data snapshot of Module 04's runQualificationGates() output --
 * only the fields this module's derivation logic actually needs, not the
 * full GateResult[] detail (the UI can still show the full detail directly
 * from Module 04's own output; this module only needs the verdict).
 */
export interface QualificationGateSnapshot {
  overallStatus: QualificationGateStatus;
  /** Comma-joined category names, mirrors QualificationResult.blockingGate. */
  blockingGate: string | null;
  dueDiligenceTier: DueDiligenceTier;
  /** Mirrors QualificationResult.dueDiligenceGaps -- carried through so the ASL UI never silently drops a disclosed ENHANCED-DD gap. */
  dueDiligenceGaps: string[];
  dueDiligenceGapsAr: string[];
}

/** Mirrors kraljicScoring.ts's KraljicQuadrant. */
export type KraljicQuadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

/** Mirrors supplierConcentration.ts's ConcentrationBand. */
export type ConcentrationBand = 'competitive' | 'moderatelyConcentrated' | 'highlyConcentrated';

/**
 * Plain-data risk signals this module reuses for review-cadence tiering --
 * both already computed elsewhere (Module 02 / Module 05), never
 * re-derived here. Every field optional: a caller who has not run those
 * modules yet gets the honest STANDARD/annual default, not a guess.
 */
export interface RiskTierSignals {
  kraljicQuadrant?: KraljicQuadrant;
  concentrationBand?: ConcentrationBand;
}

/**
 * Mirrors supplierRACI.ts's current-Accountable-holder shape for the 'prequalification_approval' activity, already one of the 7 fixed RaciActivityKey values.
 *
 * CLEANUP ITEM (logged 11 Sep 2026, verified NOT security-relevant): this
 * type has zero real callers anywhere in this file -- a leftover from an
 * earlier design path where this check may have been intended to also run
 * client-side. The real, live write-gate enforcement for
 * 'prequalification_approval' lives server-side in
 * artifacts/api-server/src/routes/preQualification.ts (POST /decisions),
 * which queries the real raciAssignmentEventsTable directly via its own
 * mirrored currentAccountableHolder() replay -- confirmed by reading that
 * route and by that its POSITIVE CONTROL HTTP-boundary test exercises the
 * real function, not a stub. This type is dead code, not a missing
 * control; remove it or wire it to something real in a future pass. See
 * docs/SI_Supplier_Lifecycle_Governance_Item2_RACI_Worked_Example.md,
 * Section 9, gap item 3.
 */
export interface AccountableHolderSnapshot {
  userId: number | null;
  /** True when the org's RACI matrix has never assigned an Accountable owner for this activity -- see hasAccountabilityGap() in supplierRACI.ts. */
  hasGap: boolean;
}

// ---------------------------------------------------------------------------
// Advisory-tier recommendation vocabulary
// ---------------------------------------------------------------------------

export type ASLRecommendation =
  | 'RECOMMEND_APPROVE'
  | 'RECOMMEND_CONDITIONAL'
  | 'RECOMMEND_HOLD'
  | 'RECOMMEND_INSUFFICIENT_DATA';

export type ReviewCadenceTier = 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

/**
 * Disclosed structural default (Decision Record 8.7 -- NOT a claimed
 * sourced industry benchmark, same discipline as
 * supplierQualificationGates.ts's DEFAULT_GATE_THRESHOLDS). Days between
 * scheduled ASL re-reviews per cadence tier. Overridable by a caller who
 * has a real, sourced client-specific cadence policy.
 */
export const DEFAULT_REVIEW_CADENCE_DAYS: Record<ReviewCadenceTier, number> = {
  QUARTERLY: 90,
  SEMI_ANNUAL: 182,
  ANNUAL: 365,
};

export interface ReviewCadenceResult {
  tier: ReviewCadenceTier;
  days: number;
  noteEn: string;
  noteAr: string;
}

/**
 * Derives review cadence from the SAME risk-tiering signals Module 02
 * (Kraljic) and Module 05 (concentration) already compute -- the design
 * brief's explicit instruction (section 2.1: "review frequency should scale
 * with supplier risk... reusing the same risk-tiering logic"), not a new
 * independent schedule. QUARTERLY when the supplier sits in Kraljic's
 * 'strategic' or 'bottleneck' quadrant (the identical "highCriticality"
 * signal supplierQualificationGates.ts's determineDueDiligenceTier() uses
 * for ENHANCED due diligence -- deliberately the same signal, since a
 * supplier serious enough to need enhanced due diligence is serious enough
 * to need more frequent ASL re-review, not two disconnected risk scores).
 * SEMI_ANNUAL when supply-base concentration is moderately or highly
 * concentrated but Kraljic criticality alone did not already trigger
 * QUARTERLY. ANNUAL otherwise, including the honest default when neither
 * signal was supplied yet.
 */
export function determineReviewCadence(signals: RiskTierSignals = {}): ReviewCadenceResult {
  const highCriticality = signals.kraljicQuadrant === 'strategic' || signals.kraljicQuadrant === 'bottleneck';
  const concentrated = signals.concentrationBand === 'highlyConcentrated' || signals.concentrationBand === 'moderatelyConcentrated';

  if (highCriticality) {
    return {
      tier: 'QUARTERLY',
      days: DEFAULT_REVIEW_CADENCE_DAYS.QUARTERLY,
      noteEn: `Quarterly re-review -- Kraljic quadrant is '${signals.kraljicQuadrant}', the same high-criticality signal that also triggers Enhanced Due Diligence in Module 04.`,
      noteAr: `مراجعة ربع سنوية -- ربع مصفوفة كرالييك هو '${signals.kraljicQuadrant}'، وهو نفس مؤشر الأهمية الحرجة الذي يفعّل العناية الواجبة المعزّزة في الوحدة 04.`,
    };
  }
  if (concentrated) {
    return {
      tier: 'SEMI_ANNUAL',
      days: DEFAULT_REVIEW_CADENCE_DAYS.SEMI_ANNUAL,
      noteEn: `Semi-annual re-review -- supply-base concentration for this category is '${signals.concentrationBand}', a real dependency risk even though Kraljic criticality alone did not flag it.`,
      noteAr: `مراجعة نصف سنوية -- تركّز قاعدة الموردين لهذه الفئة '${signals.concentrationBand}'، وهو مخاطرة اعتمادية حقيقية حتى لو لم تُشر إليها الأهمية الحرجة وفق كرالييك وحدها.`,
    };
  }
  return {
    tier: 'ANNUAL',
    days: DEFAULT_REVIEW_CADENCE_DAYS.ANNUAL,
    noteEn: signals.kraljicQuadrant || signals.concentrationBand
      ? 'Annual re-review -- neither the Kraljic quadrant nor the concentration band for this supplier indicates elevated criticality.'
      : 'Annual re-review (honest default) -- no Kraljic quadrant or concentration band supplied yet for this supplier; re-run this once Module 02/05 data exists.',
    noteAr: signals.kraljicQuadrant || signals.concentrationBand
      ? 'مراجعة سنوية -- لا يشير ربع كرالييك ولا نطاق التركّز لهذا المورّد إلى أهمية حرجة مرتفعة.'
      : 'مراجعة سنوية (الإعداد الافتراضي الصادق) -- لم يتم تزويد ربع كرالييك أو نطاق التركّز لهذا المورّد بعد؛ يُعاد التقييم فور توفر بيانات الوحدتين 02/05.',
  };
}

export interface ASLAdvisoryAssessment {
  recommendation: ASLRecommendation;
  primaryEn: string;
  primaryAr: string;
  /** Rule 8 -- a genuine second option, never a single false-certainty path. */
  alternativeEn: string;
  alternativeAr: string;
  noteEn: string;
  noteAr: string;
  reviewCadence: ReviewCadenceResult;
  /** Carried through unchanged from the gate snapshot -- never silently dropped (Rule 1). */
  dueDiligenceGaps: string[];
  dueDiligenceGapsAr: string[];
}

const INSUFFICIENT_DATA_CADENCE: ReviewCadenceResult = {
  tier: 'ANNUAL',
  days: DEFAULT_REVIEW_CADENCE_DAYS.ANNUAL,
  noteEn: 'Not yet computed -- no qualification-gate result supplied.',
  noteAr: 'لم يُحتسب بعد -- لم تُزوَّد نتيجة بوابة التأهيل.',
};

/**
 * Advisory tier: a scored qualify/don't-qualify recommendation, zero
 * persistence, no client name attached. Pure function of the (caller-run)
 * Module 04 gate result plus (caller-supplied) risk-tiering signals.
 */
export function computeAdvisoryASLAssessment(
  gate: QualificationGateSnapshot | null,
  riskSignals: RiskTierSignals = {},
): ASLAdvisoryAssessment {
  if (!gate) {
    return {
      recommendation: 'RECOMMEND_INSUFFICIENT_DATA',
      primaryEn: 'Run the Module 04 qualification & due-diligence gates for this supplier first -- ASL status can never be assigned without a real gate result behind it.',
      primaryAr: 'شغّل أولاً بوابات التأهيل والعناية الواجبة (الوحدة 04) لهذا المورّد -- لا يمكن منح حالة القائمة المعتمدة دون نتيجة بوابة حقيقية خلفها.',
      alternativeEn: 'N/A -- there is no responsible alternative to running the gates; this is not a judgment call this module is permitted to make (Decision Record 8.7).',
      alternativeAr: 'لا ينطبق -- لا يوجد بديل مسؤول عن تشغيل البوابات؛ هذا ليس قراراً تقديرياً يُسمح لهذه الوحدة باتخاذه (سجل القرار 8.7).',
      noteEn: 'INSUFFICIENT_DATA: no qualification-gate snapshot was supplied.',
      noteAr: 'بيانات غير كافية: لم تُزوَّد أي نتيجة لبوابة التأهيل.',
      reviewCadence: INSUFFICIENT_DATA_CADENCE,
      dueDiligenceGaps: [],
      dueDiligenceGapsAr: [],
    };
  }

  const cadence = determineReviewCadence(riskSignals);
  const base = {
    reviewCadence: cadence,
    dueDiligenceGaps: gate.dueDiligenceGaps,
    dueDiligenceGapsAr: gate.dueDiligenceGapsAr,
  };

  switch (gate.overallStatus) {
    case 'QUALIFIED':
      return {
        ...base,
        recommendation: 'RECOMMEND_APPROVE',
        primaryEn: `Approve to the Approved Supplier List. Module 04's gates returned QUALIFIED with no blocking category. Schedule the next re-review in ${cadence.days} days (${cadence.tier.toLowerCase().replace('_', '-')}).`,
        primaryAr: `الموافقة على الإدراج في القائمة المعتمدة. أعادت بوابات الوحدة 04 نتيجة "مؤهَّل" دون أي فئة معطِّلة. حدِّد موعد المراجعة القادمة خلال ${cadence.days} يوماً.`,
        alternativeEn: gate.dueDiligenceTier === 'ENHANCED'
          ? 'Strong alternative: grant a short provisional approval (e.g. one review cycle at QUARTERLY cadence regardless of the computed tier) rather than the full standard interval, since this supplier already sits at Enhanced Due Diligence risk and the disclosed due-diligence gaps below were never actually closed, only judged acceptable at this evidence level.'
          : 'Strong alternative: if the underlying evidence is recent but not yet independently verified at the highest stage, grant a shorter provisional review interval before committing to the full standard cadence, rather than the full interval immediately.',
        alternativeAr: gate.dueDiligenceTier === 'ENHANCED'
          ? 'بديل قوي: منح موافقة مؤقتة قصيرة (دورة مراجعة واحدة ربع سنوية بغض النظر عن الفئة المحتسبة) بدلاً من الفاصل الزمني الكامل، لأن هذا المورّد يقع أصلاً ضمن مخاطر العناية الواجبة المعزّزة ولم تُغلق فجوات العناية الواجبة المفصح عنها أدناه فعلياً، بل اعتُبرت مقبولة عند هذا المستوى من الأدلة.'
          : 'بديل قوي: إذا كانت الأدلة حديثة لكن لم يتم التحقق منها بشكل مستقل عند أعلى مستوى بعد، امنح فترة مراجعة مؤقتة أقصر قبل الالتزام بالدورة القياسية الكاملة.',
        noteEn: 'QUALIFIED -- no critical or hard-fail gate.',
        noteAr: 'مؤهَّل -- لا توجد بوابة إخفاق حرج.',
      };
    case 'CONDITIONALLY_QUALIFIED':
      return {
        ...base,
        recommendation: 'RECOMMEND_CONDITIONAL',
        primaryEn: 'Conditionally approve to the ASL, pending stronger evidence on the gate(s) currently below threshold. Attach a corrective-evidence deadline to the approval, not an open-ended conditional status.',
        primaryAr: 'الموافقة المشروطة على الإدراج في القائمة المعتمدة، ريثما تتوفر أدلة أقوى على البوابة (البوابات) التي لا تزال دون الحد المطلوب. اربط الموافقة بموعد نهائي لتقديم الأدلة التصحيحية، لا بحالة مشروطة مفتوحة.',
        alternativeEn: 'Strong alternative: hold at NOT_QUALIFIED rather than granting conditional access, especially when the supplier sits in Kraljic\'s strategic or bottleneck quadrant -- a conditional approval that never actually gets revisited is functionally identical to an unconditional one, and the risk of that silent drift is highest for critical suppliers.',
        alternativeAr: 'بديل قوي: الإبقاء على حالة "غير مؤهَّل" بدلاً من منح وصول مشروط، خاصة عندما يقع المورّد ضمن ربعي "الاستراتيجي" أو "عنق الزجاجة" في مصفوفة كرالييك -- فالموافقة المشروطة التي لا تُراجَع فعلياً تعادل عملياً موافقة غير مشروطة، وخطر هذا الانزلاق الصامت أعلى ما يكون مع الموردين الحرجين.',
        noteEn: `CONDITIONALLY_QUALIFIED${gate.blockingGate ? ` -- weakest gate(s): ${gate.blockingGate}` : ''}.`,
        noteAr: 'مؤهَّل بشكل مشروط.',
      };
    case 'NOT_QUALIFIED':
      return {
        ...base,
        recommendation: 'RECOMMEND_HOLD',
        primaryEn: `Do not add to the ASL. Module 04's gates returned NOT_QUALIFIED, blocked on: ${gate.blockingGate ?? 'unspecified'}. This is a critical-fail rule -- it is never overridden by an otherwise-strong aggregate profile.`,
        primaryAr: `عدم الإدراج في القائمة المعتمدة. أعادت بوابات الوحدة 04 نتيجة "غير مؤهَّل"، بسبب: ${gate.blockingGate ?? 'غير محدد'}. هذه قاعدة إخفاق حرج -- لا يمكن تجاوزها بملف عام قوي.`,
        alternativeEn: 'Strong alternative: rather than closing the relationship outright, open a supplier-development / corrective-action track with a defined re-submission window -- the honest reading of a NOT_QUALIFIED result is "not qualified today," not "permanently disqualified," unless the blocking reason is itself terminal (e.g. a revoked certification with no renewal path).',
        alternativeAr: 'بديل قوي: بدلاً من إنهاء العلاقة كلياً، افتح مساراً لتطوير المورّد / إجراء تصحيحي مع نافذة زمنية محددة لإعادة التقديم -- فالقراءة الصادقة لنتيجة "غير مؤهَّل" هي "غير مؤهَّل اليوم"، وليست "مستبعَد نهائياً"، ما لم يكن سبب الإيقاف نهائياً بطبيعته (كشهادة مُلغاة دون مسار تجديد).',
        noteEn: 'NOT_QUALIFIED -- critical-fail rule blocks ASL regardless of aggregate score.',
        noteAr: 'غير مؤهَّل -- قاعدة الإخفاق الحرج تمنع الإدراج بغض النظر عن النتيجة الإجمالية.',
      };
    case 'INSUFFICIENT_EVIDENCE':
    default:
      return {
        ...base,
        recommendation: 'RECOMMEND_INSUFFICIENT_DATA',
        primaryEn: 'Neither approve nor decline yet. At least one gate has no relevant facts recorded at all -- an ambiguous evidence state must never imply an ASL decision that was not actually earned (Decision Record 8.7).',
        primaryAr: 'لا موافقة ولا رفض حتى الآن. توجد بوابة واحدة على الأقل بلا أي بيانات ذات صلة مسجَّلة إطلاقاً -- لا يجوز أن توحي حالة أدلة غامضة بقرار قائمة معتمدة لم يُكتسب فعلياً.',
        alternativeEn: 'N/A -- the only responsible path is to collect the missing evidence; granting a default status here would fabricate confidence the evidence does not support.',
        alternativeAr: 'لا ينطبق -- المسار المسؤول الوحيد هو جمع الأدلة الناقصة؛ منح حالة افتراضية هنا سيُصنّع ثقة لا تدعمها الأدلة.',
        noteEn: 'INSUFFICIENT_EVIDENCE -- one or more gate categories have no facts recorded yet.',
        noteAr: 'أدلة غير كافية -- توجد فئة بوابة واحدة أو أكثر بلا بيانات مسجَّلة بعد.',
      };
  }
}

// ---------------------------------------------------------------------------
// Operational tier: decision validation (the "derived, not manual" rule,
// enforced) -- write-gating (who is allowed to write) stays entirely in the
// route layer (artifacts/api-server/src/routes/preQualification.ts), same
// separation raci.ts already keeps out of supplierRACI.ts.
// ---------------------------------------------------------------------------

export type ASLDecisionType =
  | 'approved'
  | 'conditionally_approved'
  | 'declined'
  | 'suspended'
  | 'revoked'
  | 'reinstated';

export const ASL_DECISION_TYPES: ASLDecisionType[] = [
  'approved',
  'conditionally_approved',
  'declined',
  'suspended',
  'revoked',
  'reinstated',
];

/**
 * The six documented approval-reason categories, sourced (design brief
 * section 2.1 / SI_SI_Scope_Expansion_Sourced_Design.md): a pre-qualification
 * decision must be justified by an audit, a qualification form, a
 * certification, an engineering approval, a performance record, or a
 * commercial agreement -- never an unstated judgment call. Required for
 * 'approved' and 'conditionally_approved' decisions.
 */
export type ApprovalReasonCategory =
  | 'audit'
  | 'qualification_form'
  | 'certification'
  | 'engineering_approval'
  | 'performance_record'
  | 'commercial_agreement';

export const APPROVAL_REASON_CATEGORIES: ApprovalReasonCategory[] = [
  'audit',
  'qualification_form',
  'certification',
  'engineering_approval',
  'performance_record',
  'commercial_agreement',
];

export const APPROVAL_REASON_LABELS: Record<ApprovalReasonCategory, { en: string; ar: string }> = {
  audit: { en: 'Supplier audit', ar: 'تدقيق على المورّد' },
  qualification_form: { en: 'Qualification questionnaire on file', ar: 'استبيان تأهيل مسجَّل' },
  certification: { en: 'Certification verified', ar: 'شهادة تم التحقق منها' },
  engineering_approval: { en: 'Engineering / technical approval', ar: 'موافقة هندسية / فنية' },
  performance_record: { en: 'Track record of prior performance', ar: 'سجل أداء سابق' },
  commercial_agreement: { en: 'Signed commercial agreement', ar: 'اتفاقية تجارية موقَّعة' },
};

/** Source disclosure string for the UI -- Rule 2, never a bare unexplained list. */
export const APPROVAL_REASON_SOURCE_EN =
  'A documented approval reason -- an audit, a qualification form, a verified certification, an engineering approval, a performance record, or a signed commercial agreement -- is standard supplier pre-qualification practice, never an unstated judgment call (sourceday.com "Supplier Prequalification"; greenlight.guru "Supplier Qualification Process"; lassosupplychain.com "Approved Supplier List"; cenitconsulting.com supplier-qualification guidance).';
export const APPROVAL_REASON_SOURCE_AR =
  'يُعدّ توثيق سبب الموافقة -- تدقيق، استبيان تأهيل، شهادة تم التحقق منها، موافقة هندسية، سجل أداء، أو اتفاقية تجارية موقَّعة -- ممارسة معيارية في التأهيل المسبق للموردين، وليس قراراً تقديرياً غير موثَّق.';

/**
 * Lifecycle reason categories for suspend/revoke/reinstate. Disclosed
 * explicitly as standard vendor-lifecycle-management practice -- NOT
 * attributed to the four sources above, which speak specifically to the
 * *approval* reason. Same non-fabrication discipline as
 * supplierQualificationGates.ts's ENHANCED_DD_THRESHOLD_OVERRIDES comment.
 */
export type LifecycleReasonCategory =
  | 'failed_re_review'
  | 'certification_lapsed'
  | 'performance_below_threshold'
  | 'compliance_violation'
  | 'commercial_relationship_ended'
  | 'voluntary_exit';

export const LIFECYCLE_REASON_CATEGORIES: LifecycleReasonCategory[] = [
  'failed_re_review',
  'certification_lapsed',
  'performance_below_threshold',
  'compliance_violation',
  'commercial_relationship_ended',
  'voluntary_exit',
];

export const LIFECYCLE_REASON_LABELS: Record<LifecycleReasonCategory, { en: string; ar: string }> = {
  failed_re_review: { en: 'Failed scheduled re-review', ar: 'إخفاق في المراجعة الدورية المجدولة' },
  certification_lapsed: { en: 'Required certification lapsed', ar: 'انتهاء صلاحية شهادة مطلوبة' },
  performance_below_threshold: { en: 'Performance fell below threshold', ar: 'انخفاض الأداء عن الحد المطلوب' },
  compliance_violation: { en: 'Compliance violation', ar: 'مخالفة امتثال' },
  commercial_relationship_ended: { en: 'Commercial relationship ended', ar: 'انتهاء العلاقة التجارية' },
  voluntary_exit: { en: 'Supplier voluntary exit', ar: 'انسحاب طوعي من المورّد' },
};

export type ASLReasonCategory = ApprovalReasonCategory | LifecycleReasonCategory;

export interface ASLDecisionInput {
  decisionType: ASLDecisionType;
  gate: QualificationGateSnapshot | null;
  reasonCategory: ASLReasonCategory | null;
  reasonNote: string | null;
  /** True when the prior ASL state for this supplier was 'suspended' -- required context for a 'reinstated' decision. */
  priorStateWasSuspended?: boolean;
}

export interface ASLDecisionValidation {
  valid: boolean;
  errorsEn: string[];
  errorsAr: string[];
}

/**
 * The core "ASL status is DERIVED, not manual" enforcement point (design
 * brief section 2.1's central instruction). Mirrors the spirit of
 * supplierQualificationGates.ts's own critical-fail rule: a decision this
 * function rejects must be rejected by the route layer too, never
 * silently accepted because a UI happened to allow the click.
 */
export function validateASLDecision(input: ASLDecisionInput): ASLDecisionValidation {
  const errorsEn: string[] = [];
  const errorsAr: string[] = [];
  const { decisionType, gate, reasonCategory } = input;

  if (decisionType === 'approved' || decisionType === 'conditionally_approved') {
    if (!gate) {
      errorsEn.push('No qualification-gate snapshot supplied -- cannot approve without a real gate result.');
      errorsAr.push('لم تُزوَّد نتيجة بوابة تأهيل -- لا يمكن الموافقة دون نتيجة بوابة حقيقية.');
    } else if (decisionType === 'approved' && gate.overallStatus !== 'QUALIFIED') {
      errorsEn.push(`Cannot record 'approved' -- Module 04's gates returned ${gate.overallStatus}, not QUALIFIED. ASL status is derived from the gate result, not a manual flag.`);
      errorsAr.push(`لا يمكن تسجيل حالة "موافَق عليه" -- أعادت بوابات الوحدة 04 النتيجة ${gate.overallStatus}، وليست "مؤهَّل". حالة القائمة المعتمدة مُشتقة من نتيجة البوابة، وليست علماً يدوياً.`);
    } else if (decisionType === 'conditionally_approved' && gate.overallStatus !== 'QUALIFIED' && gate.overallStatus !== 'CONDITIONALLY_QUALIFIED') {
      errorsEn.push(`Cannot record 'conditionally_approved' -- Module 04's gates returned ${gate.overallStatus}. A NOT_QUALIFIED or INSUFFICIENT_EVIDENCE result cannot be upgraded to a conditional approval by manual override.`);
      errorsAr.push(`لا يمكن تسجيل حالة "موافقة مشروطة" -- أعادت بوابات الوحدة 04 النتيجة ${gate.overallStatus}. لا يمكن ترقية نتيجة "غير مؤهَّل" أو "أدلة غير كافية" إلى موافقة مشروطة يدوياً.`);
    }
    if (!reasonCategory || !APPROVAL_REASON_CATEGORIES.includes(reasonCategory as ApprovalReasonCategory)) {
      errorsEn.push('A documented approval reason (audit, qualification form, certification, engineering approval, performance record, or commercial agreement) is required.');
      errorsAr.push('يجب توثيق سبب الموافقة (تدقيق، استبيان تأهيل، شهادة، موافقة هندسية، سجل أداء، أو اتفاقية تجارية).');
    }
  }

  if (decisionType === 'declined') {
    if (gate && gate.overallStatus !== 'NOT_QUALIFIED' && gate.overallStatus !== 'INSUFFICIENT_EVIDENCE') {
      errorsEn.push(`Cannot record 'declined' -- Module 04's gates returned ${gate.overallStatus}, which does not block approval. Decline is only derived from a NOT_QUALIFIED or INSUFFICIENT_EVIDENCE gate result.`);
      errorsAr.push(`لا يمكن تسجيل حالة "مرفوض" -- أعادت بوابات الوحدة 04 النتيجة ${gate.overallStatus}، وهي لا تمنع الموافقة.`);
    }
  }

  if (decisionType === 'suspended' || decisionType === 'revoked') {
    if (!reasonCategory || !LIFECYCLE_REASON_CATEGORIES.includes(reasonCategory as LifecycleReasonCategory)) {
      errorsEn.push('A documented lifecycle reason (failed re-review, certification lapsed, performance below threshold, compliance violation, commercial relationship ended, or voluntary exit) is required.');
      errorsAr.push('يجب توثيق سبب دورة الحياة (إخفاق في المراجعة، انتهاء شهادة، انخفاض الأداء، مخالفة امتثال، انتهاء العلاقة التجارية، أو انسحاب طوعي).');
    }
  }

  if (decisionType === 'reinstated') {
    if (!input.priorStateWasSuspended) {
      errorsEn.push("Cannot record 'reinstated' -- there is no suspended prior state to reinstate from.");
      errorsAr.push('لا يمكن تسجيل حالة "إعادة إدراج" -- لا توجد حالة إيقاف سابقة لإعادة الإدراج منها.');
    }
    if (!gate || (gate.overallStatus !== 'QUALIFIED' && gate.overallStatus !== 'CONDITIONALLY_QUALIFIED')) {
      errorsEn.push('Cannot record \'reinstated\' -- a fresh qualification-gate result of QUALIFIED or CONDITIONALLY_QUALIFIED is required before reinstating a suspended supplier.');
      errorsAr.push('لا يمكن تسجيل حالة "إعادة إدراج" -- يلزم نتيجة حديثة لبوابة التأهيل بحالة "مؤهَّل" أو "مؤهَّل بشكل مشروط" قبل إعادة إدراج مورّد موقَف.');
    }
    if (!reasonCategory || !LIFECYCLE_REASON_CATEGORIES.includes(reasonCategory as LifecycleReasonCategory)) {
      errorsEn.push('A documented lifecycle reason is required to explain the reinstatement.');
      errorsAr.push('يجب توثيق سبب دورة حياة يوضّح إعادة الإدراج.');
    }
  }

  return { valid: errorsEn.length === 0, errorsEn, errorsAr };
}

/** True for decision types that, once valid, place/keep the supplier ON the ASL. */
export function decisionKeepsOnASL(decisionType: ASLDecisionType): boolean {
  return decisionType === 'approved' || decisionType === 'conditionally_approved' || decisionType === 'reinstated';
}

/**
 * Computes the calendar date a supplier's next ASL re-review falls due,
 * from a decision date and the cadence derived by determineReviewCadence().
 * Plain date arithmetic -- no timezone-sensitive logic, matching the rest
 * of this codebase's UTC-day-count conventions.
 */
export function computeNextReviewDueDate(decisionDate: Date, cadence: ReviewCadenceResult): Date {
  const due = new Date(decisionDate.getTime());
  due.setUTCDate(due.getUTCDate() + cadence.days);
  return due;
}

// ---------------------------------------------------------------------------
// ASL register current-state derivation (Operational tier) -- mirrors
// supplierRACI.ts's computeCurrentRaci() pattern: the register's CURRENT
// state for a supplier is always DERIVED by replaying its append-only
// decision events in chronological order, never stored as a separately
// -mutable "current status" column.
// ---------------------------------------------------------------------------

export interface ASLDecisionEventLike {
  id: number | string;
  supplierId: string;
  decisionType: ASLDecisionType;
  reasonCategory: ASLReasonCategory;
  reasonNote: string | null;
  approverUserId: number;
  qualificationGateStatusAtDecision: QualificationGateStatus;
  reviewDueAt: string | null;
  createdAt: string;
}

export interface ASLCurrentState {
  supplierId: string;
  /** The current on-ASL status, derived from the latest event only -- never averaged or inferred from history. */
  status: ASLDecisionType | 'NEVER_ASSESSED';
  onASL: boolean;
  latestEvent: ASLDecisionEventLike | null;
  reviewDueAt: string | null;
  isReviewOverdue: boolean;
}

function sortEventsChronologically(events: ASLDecisionEventLike[]): ASLDecisionEventLike[] {
  return [...events].sort((a, b) => {
    const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (t !== 0) return t;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Replays one supplier's full append-only decision history into its
 * current ASL state -- the latest event by creation time is authoritative,
 * matching raciAssignments.ts's own "no updatedAt, replay to get current
 * state" design (see that schema file's header for the precedent this
 * mirrors).
 */
export function computeCurrentASLState(supplierId: string, events: ASLDecisionEventLike[], asOf: Date = new Date()): ASLCurrentState {
  const own = sortEventsChronologically(events.filter((e) => e.supplierId === supplierId));
  const latestEvent = own.length > 0 ? own[own.length - 1] : null;

  if (!latestEvent) {
    return { supplierId, status: 'NEVER_ASSESSED', onASL: false, latestEvent: null, reviewDueAt: null, isReviewOverdue: false };
  }

  const onASL = decisionKeepsOnASL(latestEvent.decisionType);
  const reviewDueAt = latestEvent.reviewDueAt;
  const isReviewOverdue = onASL && !!reviewDueAt && new Date(reviewDueAt).getTime() < asOf.getTime();

  return {
    supplierId,
    status: latestEvent.decisionType,
    onASL,
    latestEvent,
    reviewDueAt,
    isReviewOverdue,
  };
}

/** Convenience: current state for every distinct supplierId present in the event list. */
export function computeAllCurrentASLStates(events: ASLDecisionEventLike[], asOf: Date = new Date()): ASLCurrentState[] {
  const ids = Array.from(new Set(events.map((e) => e.supplierId)));
  return ids.map((id) => computeCurrentASLState(id, events, asOf));
}
