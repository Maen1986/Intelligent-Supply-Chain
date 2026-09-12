/**
 * supplierPeriodicEvaluation.ts
 *
 * Module: Item 5 of 7 -- Periodic Supplier Evaluation (the formal,
 * scheduled review CEREMONY: a scorecard, a recommendation, a sign-off
 * record, on a cadence -- NOT Module 07's continuous recurrence/escalation
 * tracking). See "WHAT THIS IS NOT" below; that distinction is load-bearing
 * for this whole module and must never be blurred by a future edit.
 *
 * ============================================================================
 * WHAT THIS IS NOT (read first)
 * ============================================================================
 * This module does NOT rebuild supplierPerformanceRecovery.ts (Module 07).
 * Module 07 tracks ongoing recurrence/escalation CONTINUOUSLY -- every CAR,
 * every SPC-flagged trend point, every 8D/SCAR-driven intervention ladder
 * move, as it happens. This module is the periodic REVIEW EVENT: a
 * scheduled, dated ceremony (annual or semi-annual) that produces its own
 * record and sign-off, and that CONSUMES Module 07's output as evidence
 * (a caller-supplied fact, never re-derived) rather than re-implementing any
 * part of Module 07's trend/escalation logic. A client who has never missed
 * a Module 07 alert can still be "due" for a periodic evaluation, and a
 * client with a clean periodic score can still have an active Module 07
 * escalation running in parallel -- this module surfaces that tension
 * (see checkRecoveryTension below) rather than silently resolving it either
 * way, because resolving it is the client's decision, not this module's.
 *
 * CONSULTANCY FRAMING: ISC is not shop-floor operations. This module
 * produces a scorecard, a due-status, and a recommendation for the CLIENT's
 * own decision. It does not manage the supplier relationship on the
 * client's behalf, and it does not execute any action against the supplier.
 *
 * ============================================================================
 * SOURCING DISCLOSURE (read before trusting or extending this module)
 * ============================================================================
 *
 * WHAT IS SOURCED (a named, external, citable framework):
 *
 * 1. ISO 9001:2015 Clause 8.4.1 names "re-evaluation" of external providers
 *    as its own distinct activity, textually separate from "monitoring of
 *    performance" -- the clause requires organizations to "determine and
 *    apply criteria for the evaluation, selection, MONITORING OF
 *    PERFORMANCE, AND RE-EVALUATION of external providers" (confirmed
 *    against clause-by-clause ISO 9001:2015 commentary, fetched 12 Sep
 *    2026). That is the real, citable textual basis for treating periodic
 *    re-evaluation as a first-class activity in its own right rather than
 *    folding it into Module 07's continuous tracking -- this module's core
 *    justification for existing at all. What ISO does NOT specify is a
 *    cadence (annual/semi-annual/etc.) or a scorecard structure -- the
 *    standard requires that re-evaluation happen and be documented
 *    ("retain documented information of these activities and any necessary
 *    actions arising from the evaluations"), not how often or in what
 *    format. Cadence and scorecard structure below are disclosed separately
 *    as common practice / ISC's own synthesis, not literal ISO requirements.
 *
 * 2. The scorecard's five categories (quality, delivery/OTIF, cost,
 *    service/responsiveness, compliance/ESG) are common QBR / annual
 *    supplier-review scorecard practice, and match the "hard metrics" CIPS's
 *    own published supplier-performance guidance names (product/service
 *    quality, delivery accuracy and lead times, commercial cost, customer
 *    service) plus a "soft indicator" CIPS separately names (ethical
 *    issues) generalized here to compliance/ESG (cips.org,
 *    "Supplier Performance" and "Procurement KPIs" pages, fetched 12 Sep
 *    2026). CIPS's own pages do not prescribe a specific review cadence or
 *    numeric scoring bands -- see point 4 below for what is disclosed as
 *    ISC's own synthesis on top of these named categories.
 *
 * 3. The 8D/SCAR escalation-ladder concept this module DEFERS to Module 07
 *    (rather than re-implementing) is sourced in supplierPerformanceRecovery
 *    .ts's own header (Vestas/Oshkosh/MAHLE supplier-quality manuals). This
 *    module does not re-cite it independently -- it only accepts Module 07's
 *    output as a caller-supplied fact (see Module07EscalationSnapshotLike).
 *
 * WHAT IS ISC'S OWN SYNTHESIS (disclosed, not hidden):
 *
 * 4. The specific numeric scoring bands (>=85 "strong", 65-84 "acceptable",
 *    40-64 "watch", <40 "at-risk") are ISC's own banding over a 0-100 scale
 *    -- a defensible analogy to the "green/amber/red" convention common in
 *    QBR scorecard practice, but not a literal CIPS or ISO numeric standard
 *    (neither body specifies numeric thresholds for this kind of scoring).
 * 5. The cadence-recommendation rule (annual vs. semi-annual) is NOT a
 *    separate decision function -- per explicit instruction, this module
 *    REUSES computeRecommendedGovernanceTier() from
 *    supplierGovernanceTierRecommendation.ts (a REAL runtime import, an
 *    explicitly authorized exception to this module's own Standalone-First
 *    disclosure below -- see that section) and relabels its
 *    Operational/Advisory output as Semi-annual/Annual. Neither Kraljic/CIPS
 *    nor ISO prescribes this specific mapping; it is ISC's own
 *    operationalization of the same two sourced signals (Kraljic quadrant,
 *    industry regulation) for a second, related decision (review frequency
 *    rather than tracking depth).
 * 6. The "weakest-link" overall recommendation rule (deriveOverallRecommend
 *    ation below: the WORST category rating drives the overall
 *    recommendation, never an average) is ISC's own rule, chosen
 *    specifically to satisfy the platform's standing "never collapse a
 *    multi-dimensional assessment into one fabricated composite score"
 *    discipline -- an average would let a strong cost score mask an
 *    at-risk quality score, which this module treats as unacceptable.
 * 7. The findings-actions escalation threshold (escalate when ANY category
 *    is rated "at-risk") is ISC's own threshold, disclosed via
 *    shouldEscalateToFindingsActions() rather than presented as an external
 *    standard.
 *
 * ============================================================================
 * DESIGN CONTRACT
 * ============================================================================
 * - RECOMMEND, NEVER ENFORCE: cadence and overall recommendation are both
 *   recommendations for the client's own decision -- never enforced, never
 *   a block on any other action. A client cadence override, once set,
 *   ALWAYS wins over a freshly recomputed recommendation until explicitly
 *   changed again (resolveEffectiveCadence), same contract as
 *   resolveEffectiveGovernanceTier().
 * - NEVER-EVALUATED IS NOT OVERDUE: a supplier with no prior evaluation
 *   history is reported as 'never_evaluated', never as 'overdue' -- overdue
 *   requires a real due date, which requires a real prior evaluation to
 *   anchor it. (This directly avoids the false-positive "stalled" defect
 *   Item 4's own QA pass found and fixed in a structurally similar
 *   situation -- an eligible-but-not-yet-started record must never be
 *   reported as if it had already missed a deadline.)
 * - NEVER A FABRICATED COMPOSITE SCORE: category scores are never averaged
 *   into one number. Each category is shown and rated independently; the
 *   overall recommendation is a disclosed weakest-link rule, not a score.
 * - TENSION IS SURFACED, NEVER SILENTLY RESOLVED: a good periodic score
 *   coexisting with an active Module 07 escalation is flagged as an
 *   explicit, named tension for the client to reconcile -- this module
 *   never overrides one signal with the other.
 *
 * ============================================================================
 * STANDALONE-FIRST ARCHITECTURE (Rule 3) DISCLOSURE -- INCLUDING ONE
 * EXPLICITLY AUTHORIZED EXCEPTION
 * ============================================================================
 * This module has a REAL runtime import of supplierGovernanceTierRecommenda
 * tion.ts -- a deliberate, explicit exception to the platform's usual
 * Standalone-First rule (Rule 3: "new engine modules must not have runtime
 * imports from sibling modules"). That module's own header already commits
 * it to exactly this reuse ("designed for reuse, unmodified, by Items 5-7
 * -- any ISC module that needs to recommend Advisory-vs-Operational
 * governance intensity ... should import this module rather than
 * re-deriving the logic"), and this task's own explicit instruction
 * confirmed it a second time: reuse the real function, do not fork a
 * parallel cadence-decision function. This is therefore a disclosed,
 * intentional exception for ONE specific, purpose-built shared utility --
 * not a general loosening of Rule 3. Every OTHER cross-module fact this
 * module needs (Module 06 commercial data, Module 07 performance/escalation
 * data) remains a caller-supplied plain-data mirror, per the normal rule --
 * see Module07EscalationSnapshotLike below.
 */

import {
  computeRecommendedGovernanceTier,
  type GovernanceTierRecommendationInput,
  type GovernanceTierRecommendation,
} from './supplierGovernanceTierRecommendation';

// ----------------------------------------------------------------------------
// Section 1 -- Scorecard categories (sourced: CIPS hard/soft metrics + common
// QBR practice -- see sourcing point 2)
// ----------------------------------------------------------------------------

export type ScorecardCategory =
  | 'quality'
  | 'delivery_otif'
  | 'cost'
  | 'service_responsiveness'
  | 'compliance_esg';

export const SCORECARD_CATEGORIES: ScorecardCategory[] = [
  'quality',
  'delivery_otif',
  'cost',
  'service_responsiveness',
  'compliance_esg',
];

export interface ScorecardCategoryMeta {
  key: ScorecardCategory;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export const SCORECARD_CATEGORY_META: ScorecardCategoryMeta[] = [
  {
    key: 'quality',
    labelEn: 'Quality',
    labelAr: 'الجودة',
    descriptionEn: 'Incoming reject/defect rate, CAR closure, COPQ trend (Module 01/07 evidence).',
    descriptionAr: 'معدل الرفض/العيوب الواردة، إغلاق الإجراءات التصحيحية، واتجاه تكلفة الجودة الرديئة (أدلة من البند 1 والبند 7).',
  },
  {
    key: 'delivery_otif',
    labelEn: 'Delivery (OTIF)',
    labelAr: 'التسليم (في الوقت وبالكامل)',
    descriptionEn: 'On-time-in-full performance and lead-time reliability.',
    descriptionAr: 'أداء التسليم في الوقت المحدد وبالكامل، وموثوقية مهلة التسليم.',
  },
  {
    key: 'cost',
    labelEn: 'Cost',
    labelAr: 'التكلفة',
    descriptionEn: 'Commercial cost competitiveness and cost-trend behavior (Module 06 evidence).',
    descriptionAr: 'القدرة التنافسية للتكلفة التجارية واتجاه التكلفة (أدلة من البند 6).',
  },
  {
    key: 'service_responsiveness',
    labelEn: 'Service / Responsiveness',
    labelAr: 'الخدمة / الاستجابة',
    descriptionEn: 'Communication quality, issue-response time, relationship health.',
    descriptionAr: 'جودة التواصل، سرعة الاستجابة للمشكلات، وصحة العلاقة.',
  },
  {
    key: 'compliance_esg',
    labelEn: 'Compliance / ESG',
    labelAr: 'الامتثال / البيئة والمجتمع والحوكمة',
    descriptionEn: 'Regulatory, contractual, and ESG/ethical-conduct standing.',
    descriptionAr: 'الوضع التنظيمي والتعاقدي، ومعايير البيئة والمجتمع والحوكمة والسلوك الأخلاقي.',
  },
];

// ----------------------------------------------------------------------------
// Section 2 -- Category scoring and rating bands (ISC's own synthesis --
// sourcing point 4)
// ----------------------------------------------------------------------------

export type CategoryRating = 'strong' | 'acceptable' | 'watch' | 'at_risk';

/** Caller-supplied data-provenance tag -- same union used across the
 * platform's other engines (SI-00 Charter discipline). */
export type SIDataSourceLike = 'manual' | 'imported-file' | 'erp' | 'wms' | 'scm' | 'crm';

/**
 * ISC's own numeric banding over a 0-100 scale (sourcing point 4). Bounds
 * are inclusive at the lower edge of each band, i.e. exactly 85 is
 * "strong", exactly 65 is "acceptable", exactly 40 is "watch".
 */
export function rateCategoryScore(score: number): CategoryRating {
  if (score >= 85) return 'strong';
  if (score >= 65) return 'acceptable';
  if (score >= 40) return 'watch';
  return 'at_risk';
}

export interface CategoryScoreInput {
  category: ScorecardCategory;
  /** 0-100. Caller-supplied; this module never fabricates a score. */
  score: number;
  dataSource: SIDataSourceLike;
  notes?: string;
}

export interface CategoryScoreResult extends CategoryScoreInput {
  rating: CategoryRating;
}

export function scoreCategoryResults(inputs: CategoryScoreInput[]): CategoryScoreResult[] {
  return inputs.map((input) => ({ ...input, rating: rateCategoryScore(input.score) }));
}

// ----------------------------------------------------------------------------
// Section 3 -- Overall recommendation: weakest-link, never averaged
// (ISC's own synthesis -- sourcing point 6; Rule 7 / Decision Record 8.7)
// ----------------------------------------------------------------------------

export type OverallRecommendation = 'continue_standard_cadence' | 'monitor_closely' | 'escalate_consider';

const RATING_SEVERITY: Record<CategoryRating, number> = {
  strong: 0,
  acceptable: 1,
  watch: 2,
  at_risk: 3,
};

export interface OverallRecommendationResult {
  overallRecommendation: OverallRecommendation;
  /** The single worst-rated category driving this result -- the "weakest
   * link", never an average. Null only if categoryResults is empty. */
  worstCategory: CategoryScoreResult | null;
  ratingCounts: Record<CategoryRating, number>;
  rationaleEn: string;
  rationaleAr: string;
  /** Explicit, disclosed statement that no composite score was computed --
   * shown in-product per the platform's "never collapse a multi-dimensional
   * assessment into one fabricated composite score" rule. */
  noCompositeScoreDisclosureEn: string;
  noCompositeScoreDisclosureAr: string;
}

const NO_COMPOSITE_EN =
  'This is a weakest-link recommendation across five independently-shown categories, not an averaged composite score -- a strong cost or delivery result never masks an at-risk quality or compliance result.';
const NO_COMPOSITE_AR =
  'هذه توصية مبنية على أضعف حلقة عبر خمس فئات مُعروضة بشكل مستقل، وليست درجة إجمالية مُجمَّعة -- فنتيجة قوية في التكلفة أو التسليم لا تُخفي أبداً نتيجة معرَّضة للخطر في الجودة أو الامتثال.';

export function deriveOverallRecommendation(categoryResults: CategoryScoreResult[]): OverallRecommendationResult {
  const ratingCounts: Record<CategoryRating, number> = { strong: 0, acceptable: 0, watch: 0, at_risk: 0 };
  for (const r of categoryResults) ratingCounts[r.rating] += 1;

  let worstCategory: CategoryScoreResult | null = null;
  for (const r of categoryResults) {
    if (worstCategory === null || RATING_SEVERITY[r.rating] > RATING_SEVERITY[worstCategory.rating]) {
      worstCategory = r;
    }
  }

  let overallRecommendation: OverallRecommendation = 'continue_standard_cadence';
  let rationaleEn = 'All scored categories are acceptable or better -- continue on the standard recommended cadence.';
  let rationaleAr = 'جميع الفئات المُقيَّمة مقبولة أو أفضل -- الاستمرار وفق الدورة الموصى بها المعتادة.';

  if (worstCategory) {
    if (worstCategory.rating === 'at_risk') {
      overallRecommendation = 'escalate_consider';
      rationaleEn = `${worstCategory.category} is rated at-risk (score ${worstCategory.score}) -- the weakest category, not an average, drives this result. Consider escalation per this review.`;
      rationaleAr = `فئة ${worstCategory.category} مصنَّفة معرَّضة للخطر (النتيجة ${worstCategory.score}) -- أضعف فئة، لا المتوسط، هي ما يقود هذه النتيجة. يُنصح بالنظر في التصعيد بناءً على هذه المراجعة.`;
    } else if (worstCategory.rating === 'watch') {
      overallRecommendation = 'monitor_closely';
      rationaleEn = `${worstCategory.category} is rated watch (score ${worstCategory.score}) -- the weakest category drives this result. Monitor this category more closely before the next scheduled review.`;
      rationaleAr = `فئة ${worstCategory.category} مصنَّفة تحت المراقبة (النتيجة ${worstCategory.score}) -- أضعف فئة هي ما يقود هذه النتيجة. يُنصح بمراقبتها عن كثب قبل المراجعة المقررة التالية.`;
    }
  }

  return {
    overallRecommendation,
    worstCategory,
    ratingCounts,
    rationaleEn,
    rationaleAr,
    noCompositeScoreDisclosureEn: NO_COMPOSITE_EN,
    noCompositeScoreDisclosureAr: NO_COMPOSITE_AR,
  };
}

/** ISC's own threshold (sourcing point 7): escalate into findings-actions
 * whenever ANY category is rated at-risk. */
export function shouldEscalateToFindingsActions(overall: OverallRecommendation): boolean {
  return overall === 'escalate_consider';
}

// ----------------------------------------------------------------------------
// Section 4 -- Cadence recommendation: REAL reuse of
// computeRecommendedGovernanceTier(), not a forked decision function
// (sourcing point 5)
// ----------------------------------------------------------------------------

export type EvaluationCadence = 'annual' | 'semi_annual';

export interface EvaluationCadenceRecommendation {
  recommendedCadence: EvaluationCadence;
  /** The exact, unmodified output of computeRecommendedGovernanceTier() --
   * shown to the caller/UI so the reuse is visible, not hidden behind a
   * relabeling. */
  basis: GovernanceTierRecommendation;
  rationaleEn: string;
  rationaleAr: string;
}

/**
 * Recommends annual vs. semi-annual periodic-evaluation cadence by directly
 * reusing computeRecommendedGovernanceTier()'s Kraljic-quadrant +
 * industry-regulation signals -- Operational maps to semi-annual, Advisory
 * maps to annual. Missing/malformed input defaults to Advisory inside that
 * function (never guessed toward the more intensive tier), which this
 * module relabels as annual (the lighter cadence) -- the same
 * never-guess-toward-more-intensive-on-missing-data contract, inherited
 * rather than re-implemented.
 */
export function computeRecommendedEvaluationCadence(
  input: GovernanceTierRecommendationInput,
): EvaluationCadenceRecommendation {
  const basis = computeRecommendedGovernanceTier(input);
  const recommendedCadence: EvaluationCadence = basis.recommendedTier === 'operational' ? 'semi_annual' : 'annual';

  const rationaleEn =
    recommendedCadence === 'semi_annual'
      ? `Semi-annual review recommended, reusing the same governance-tier signal: ${basis.rationaleEn}`
      : `Annual review recommended, reusing the same governance-tier signal: ${basis.rationaleEn}`;
  const rationaleAr =
    recommendedCadence === 'semi_annual'
      ? `يُوصى بمراجعة نصف سنوية، بالاعتماد على نفس إشارة طبقة الحوكمة: ${basis.rationaleAr}`
      : `يُوصى بمراجعة سنوية، بالاعتماد على نفس إشارة طبقة الحوكمة: ${basis.rationaleAr}`;

  return { recommendedCadence, basis, rationaleEn, rationaleAr };
}

// ----------------------------------------------------------------------------
// Section 4b -- Cadence override precedence (same recommend-never-enforce
// contract as resolveEffectiveGovernanceTier())
// ----------------------------------------------------------------------------

export interface CadenceOverrideLike {
  cadence: EvaluationCadence;
  overriddenAt: string;
  overriddenBy?: string;
}

export interface EffectiveCadence {
  cadence: EvaluationCadence;
  source: 'recommendation' | 'client-override';
  recommendation: EvaluationCadenceRecommendation;
  override: CadenceOverrideLike | null;
}

export function resolveEffectiveCadence(
  recommendation: EvaluationCadenceRecommendation,
  override: CadenceOverrideLike | null | undefined,
): EffectiveCadence {
  if (override) {
    return { cadence: override.cadence, source: 'client-override', recommendation, override };
  }
  return { cadence: recommendation.recommendedCadence, source: 'recommendation', recommendation, override: null };
}

// ----------------------------------------------------------------------------
// Section 5 -- Review due-status (never-evaluated is NOT overdue -- see
// design contract above)
// ----------------------------------------------------------------------------

export type ReviewDueStatus = 'never_evaluated' | 'not_yet_due' | 'due_soon' | 'overdue';

export interface ReviewDueStatusResult {
  status: ReviewDueStatus;
  /** ISO date string, or null when never_evaluated (there is nothing to
   * anchor a due date to yet). */
  dueDate: string | null;
  daysUntilDue: number | null;
  daysOverdue: number | null;
}

const CADENCE_DAYS: Record<EvaluationCadence, number> = {
  annual: 365,
  semi_annual: 182,
};

/**
 * Assesses whether a periodic evaluation is due, given the last completed
 * evaluation date (or null for a supplier never evaluated). `dueSoonWindowDays`
 * (default 30) is ISC's own UI-convenience threshold for the "due soon"
 * amber state, disclosed as such -- not part of the ISO/CIPS sourcing.
 */
export function assessReviewDueStatus(input: {
  cadence: EvaluationCadence;
  lastEvaluationCompletedAt: string | null;
  asOfDate?: string;
  dueSoonWindowDays?: number;
}): ReviewDueStatusResult {
  if (!input.lastEvaluationCompletedAt) {
    return { status: 'never_evaluated', dueDate: null, daysUntilDue: null, daysOverdue: null };
  }

  const asOf = input.asOfDate ? new Date(input.asOfDate) : new Date();
  const last = new Date(input.lastEvaluationCompletedAt);
  const cadenceDays = CADENCE_DAYS[input.cadence];
  const dueSoonWindowDays = input.dueSoonWindowDays ?? 30;

  const dueDate = new Date(last.getTime() + cadenceDays * 24 * 60 * 60 * 1000);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((dueDate.getTime() - asOf.getTime()) / msPerDay);

  if (diffDays < 0) {
    return { status: 'overdue', dueDate: dueDate.toISOString(), daysUntilDue: null, daysOverdue: -diffDays };
  }
  if (diffDays <= dueSoonWindowDays) {
    return { status: 'due_soon', dueDate: dueDate.toISOString(), daysUntilDue: diffDays, daysOverdue: null };
  }
  return { status: 'not_yet_due', dueDate: dueDate.toISOString(), daysUntilDue: diffDays, daysOverdue: null };
}

// ----------------------------------------------------------------------------
// Section 6 -- Evidence checklist pulling from Module 06 (commercial) and
// Module 07 (performance) data -- caller-supplied plain facts, per the
// NORMAL Standalone-First rule (this is NOT the same exception as Section 4)
// ----------------------------------------------------------------------------

export type EvidenceChecklistCategory = 'commercial_module06' | 'performance_module07' | 'manual';

export interface EvidenceChecklistItem {
  category: EvidenceChecklistCategory;
  labelEn: string;
  labelAr: string;
  present: boolean;
  detail?: string;
}

/**
 * Builds the standard evidence checklist for a periodic review. `present`
 * flags are caller-supplied booleans (this module never inspects or
 * fabricates Module 06/07 data itself) -- true default-population helper
 * only; callers may replace individual items with real detail.
 */
export function buildEvidenceChecklist(input: {
  hasModule06CommercialData: boolean;
  hasModule07PerformanceData: boolean;
}): EvidenceChecklistItem[] {
  return [
    {
      category: 'commercial_module06',
      labelEn: 'Commercial intelligence (pricing/cost trend)',
      labelAr: 'الاستخبارات التجارية (اتجاه السعر/التكلفة)',
      present: input.hasModule06CommercialData,
    },
    {
      category: 'performance_module07',
      labelEn: 'Performance/recovery history (CARs, recurrence, escalation)',
      labelAr: 'سجل الأداء/التعافي (الإجراءات التصحيحية، التكرار، التصعيد)',
      present: input.hasModule07PerformanceData,
    },
    {
      category: 'manual',
      labelEn: 'Client-supplied qualitative feedback',
      labelAr: 'ملاحظات نوعية مقدَّمة من العميل',
      present: false,
    },
  ];
}

// ----------------------------------------------------------------------------
// Section 7 -- Module 07 tension check: surfaced, never silently resolved
// (disclosed caller-supplied MIRROR of 3 fields from Module 07's
// EscalationRecommendation -- no runtime import of Module 07, unlike
// Section 4's explicitly-authorized exception for the governance-tier
// module)
// ----------------------------------------------------------------------------

/** Manually-synced mirror of the 3 fields of supplierPerformanceRecovery.ts's
 * EscalationRecommendation this module needs. If that module's shape
 * changes, this mirror must be updated by hand (Standalone-First
 * disclosure). Caller-supplied; null when there is no active Module 07
 * escalation for this supplier, or the caller has not wired Module 07 data
 * in yet. */
export interface Module07EscalationSnapshotLike {
  recommendedIntervention: string;
  escalated: boolean;
  combinedSignalFlag: boolean;
}

export interface RecoveryTensionResult {
  tensionFlag: boolean;
  tensionNoteEn: string;
  tensionNoteAr: string;
}

const TENSION_NOTE_EN =
  'Tension: this periodic review recommends continuing on the standard cadence, but Module 07 shows an active performance-recovery escalation for this supplier right now. This module does not resolve that tension for you -- both facts are shown so the client can reconcile them (e.g. the periodic review window may predate the incident, or the incident may already be adequately captured in next cycle\'s quality/delivery score).';
const TENSION_NOTE_AR =
  'تعارض: توصي هذه المراجعة الدورية بالاستمرار وفق الدورة المعتادة، إلا أن البند 7 يُظهر تصعيداً نشطاً لتعافي الأداء لهذا المورد حالياً. لا تحل هذه الوحدة هذا التعارض نيابة عنك -- يتم عرض كلا الحقيقتين ليتمكن العميل من التوفيق بينهما (فقد تكون فترة المراجعة الدورية سابقة للحادثة، أو قد تكون الحادثة مُلتقطة بالفعل بشكل كافٍ في نتيجة الجودة/التسليم للدورة القادمة).';

/**
 * Flags (never silently resolves) the specific tension case: a good
 * periodic-evaluation recommendation (continue_standard_cadence) coexisting
 * with an active Module 07 escalation. If the periodic review ALREADY
 * recommends monitor_closely or escalate_consider, there is no separate
 * tension to flag -- the two signals already agree.
 */
export function checkRecoveryTension(
  overall: OverallRecommendation,
  activeEscalation: Module07EscalationSnapshotLike | null,
): RecoveryTensionResult {
  const hasActiveEscalation = !!activeEscalation && (activeEscalation.escalated || activeEscalation.combinedSignalFlag);
  const tensionFlag = overall === 'continue_standard_cadence' && hasActiveEscalation;
  return {
    tensionFlag,
    tensionNoteEn: tensionFlag ? TENSION_NOTE_EN : '',
    tensionNoteAr: tensionFlag ? TENSION_NOTE_AR : '',
  };
}

// ----------------------------------------------------------------------------
// Section 8 -- Forward hook to Item 6 (flagged, not built -- per instruction)
// ----------------------------------------------------------------------------

/** A sufficiently poor periodic evaluation (overallRecommendation ===
 * 'escalate_consider', repeated across cycles, or combined with an active
 * Module 07 escalation) is a NATURAL future trigger into Item 6 (Blacklist)
 * -- flagged here as a documented seam for that future item to wire, not
 * wired prematurely by this one. Item 6 does not exist yet; nothing in this
 * module calls it or assumes its shape. */
export const ITEM6_FORWARD_HOOK_NOTE_EN =
  'A sufficiently poor periodic evaluation (repeated escalate_consider outcomes, or one combined with an active Module 07 escalation) is a natural future trigger into Item 6 (Blacklist) -- that seam is flagged here for Item 6 to wire when it is built, not wired prematurely by this module.';
export const ITEM6_FORWARD_HOOK_NOTE_AR =
  'التقييم الدوري الضعيف بما يكفي (نتائج متكررة من نوع "النظر في التصعيد"، أو نتيجة مقترنة بتصعيد نشط من البند 7) يُعد مُحفِّزاً مستقبلياً طبيعياً نحو البند 6 (القائمة السوداء) -- يتم الإشارة إلى هذا الموضع هنا ليقوم البند 6 بربطه عند بنائه، دون ربطه مبكراً من هذه الوحدة.';

// ----------------------------------------------------------------------------
// Section 9 -- Consultancy framing (disclosed copy, reused by UI)
// ----------------------------------------------------------------------------

export const CONSULTANCY_FRAMING_NOTE_EN =
  'ISC is not shop-floor operations: this module produces a scorecard, a due-status, and a recommendation for your own decision. It does not manage the supplier relationship on your behalf and does not take any action against the supplier.';
export const CONSULTANCY_FRAMING_NOTE_AR =
  'آي إس سي ليست جهة تشغيل ميداني: تنتج هذه الوحدة بطاقة أداء وحالة استحقاق وتوصية لاتخاذ قرارك الخاص. لا تتولى إدارة العلاقة مع المورد نيابة عنك ولا تتخذ أي إجراء ضد المورد.';
