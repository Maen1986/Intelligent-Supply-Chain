/**
 * clmContractLifecycle.ts
 *
 * Module 03 (Contract Intelligence v10): Contract Lifecycle, Review, and RFx
 * Operations -- built 26 Aug 2026 per owner instruction to complete Contract
 * Intelligence to full closure (Priority 1).
 *
 * IMPORTANT SCOPE CORRECTION (26 Aug 2026): earlier framing described all of
 * Module 03 as blocked on a document-extraction pipeline (T2 infrastructure
 * ISC doesn't have). Re-reading Module 03's own spec doc corrected that --
 * only ONE narrow piece (automatic "clause deviation count" detection from
 * real contract TEXT) is genuinely T2. Everything else here -- complexity
 * tiering, RFx type selection, RFx weighted scoring, cross-module wiring
 * checks -- is T1: pure logic over fields the platform already self-declares
 * manually, the exact same pattern as Modules 01/02/04/05/09. This file
 * keeps that split explicit rather than blurring it.
 *
 * Owner-open items (Module 03 doc, items 25-28) are NOT resolved by this
 * file -- ISC's own complexity-tiering construction and the RFx selection
 * rule are used as the working basis (same "not blocking, proceeds on this
 * basis meanwhile" pattern as Module 01 item 23), and the LIGHT/HEAVY
 * trigger threshold (item 27) is deliberately built as a CLIENT-CONFIGURABLE
 * field, not a hardcoded SAR figure -- no real client figures exist to
 * invent one (Decision Record 8.7).
 */

// ---------------------------------------------------------------------------
// Part A -- Contract complexity tiering (T1)
// ---------------------------------------------------------------------------

export type ComplexityLevel = 'level-1-low' | 'level-2-standard' | 'level-3-complex';

export interface ComplexityLevelMeta {
  id: ComplexityLevel;
  label: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export const COMPLEXITY_LEVELS: ComplexityLevelMeta[] = [
  {
    id: 'level-1-low',
    label: 'Level 1 -- Low',
    labelAr: 'المستوى 1 -- منخفض',
    descriptionEn: 'Standard/templated terms, low value, low counterparty risk, short duration, no bespoke clauses.',
    descriptionAr: 'شروط قياسية/نموذجية، قيمة منخفضة، مخاطر طرف مقابل منخفضة، مدة قصيرة، دون بنود مخصصة.',
  },
  {
    id: 'level-2-standard',
    label: 'Level 2 -- Standard',
    labelAr: 'المستوى 2 -- عادي',
    descriptionEn: 'Moderate value or moderate deviation from standard templates, one or two negotiated non-standard clauses, established counterparty.',
    descriptionAr: 'قيمة متوسطة أو انحراف متوسط عن النماذج القياسية، بند أو بندان غير قياسيين تم التفاوض عليهما، طرف مقابل معروف.',
  },
  {
    id: 'level-3-complex',
    label: 'Level 3 -- Complex/Strategic',
    labelAr: 'المستوى 3 -- معقد/استراتيجي',
    descriptionEn: 'High value, new/unvetted counterparty, significant custom terms, multi-year or multi-phase, cross-border, or any flagged pricing/legal-track mismatch.',
    descriptionAr: 'قيمة عالية، طرف مقابل جديد/غير مدقق، شروط مخصصة كبيرة، متعدد السنوات أو المراحل، عابر للحدود، أو أي تنبيه عدم تطابق في التسعير/المسار القانوني.',
  },
];

export function complexityLevelLabel(id: ComplexityLevel | undefined, isAr: boolean): string | undefined {
  if (!id) return undefined;
  const meta = COMPLEXITY_LEVELS.find((c) => c.id === id);
  if (!meta) return undefined;
  return isAr ? meta.labelAr : meta.label;
}

export interface ComplexityInputs {
  /** Contract annual or total value in the contract's own currency --
   *  reuses Contract.annualValue/totalValue, no new field needed. */
  value: number;
  /** Duration in months, derived from Contract.startDate/endDate. */
  durationMonths: number;
  /** Self-declared counterparty relationship history. Optional, manual
   *  input -- never inferred from any other field. */
  counterpartyHistory?: 'established' | 'new' | 'unvetted';
  /** Cross-border flag, derived from Module 01's counterpartyJurisdiction/
   *  performanceLocation being set and differing, OR self-declared. */
  crossBorder?: boolean;
  /** Whether any Module 01 (governing-law/arbitration) or Module 04
   *  (pricing misuse) mismatch flag is currently active on this contract.
   *  Passed in by the caller, which already computes these flags. */
  hasActiveMismatchFlag?: boolean;
  /** Self-declared count of clauses that deviate from the standard/
   *  template language for this contract's base document. Optional --
   *  manual entry by default. May ALSO be populated by
   *  mockDocumentExtraction() in dev/demo contexts ONLY (see Part F) --
   *  never silently swapped for a real value in a production code path. */
  clauseDeviationCount?: number;
}

export interface ComplexityResolution {
  level: ComplexityLevel;
  reasonEn: string;
  reasonAr: string;
}

/**
 * Resolves a contract's complexity level from already-collected fields.
 * Pure logic, T1 -- no new infrastructure. Deliberately conservative: any
 * single Level-3 trigger present escalates the whole contract to Level 3,
 * matching Module 03 Part A's stated rule ("default to HEAVY if any
 * Level-3 trigger is present").
 */
export function resolveComplexityLevel(inputs: ComplexityInputs): ComplexityResolution {
  const level3Triggers: string[] = [];
  const level3TriggersAr: string[] = [];

  if (inputs.counterpartyHistory === 'unvetted' || inputs.counterpartyHistory === 'new') {
    level3Triggers.push('new/unvetted counterparty');
    level3TriggersAr.push('طرف مقابل جديد/غير مدقق');
  }
  if (inputs.crossBorder) {
    level3Triggers.push('cross-border');
    level3TriggersAr.push('عابر للحدود');
  }
  if (inputs.hasActiveMismatchFlag) {
    level3Triggers.push('an active pricing/legal-track mismatch flag');
    level3TriggersAr.push('تنبيه نشط لعدم تطابق التسعير/المسار القانوني');
  }
  if (inputs.durationMonths >= 24) {
    level3Triggers.push('multi-year duration (24+ months)');
    level3TriggersAr.push('مدة متعددة السنوات (24 شهراً فأكثر)');
  }
  if (typeof inputs.clauseDeviationCount === 'number' && inputs.clauseDeviationCount >= 3) {
    level3Triggers.push(`${inputs.clauseDeviationCount} clause deviations from standard`);
    level3TriggersAr.push(`${inputs.clauseDeviationCount} انحرافات في البنود عن القياسي`);
  }

  if (level3Triggers.length > 0) {
    return {
      level: 'level-3-complex',
      reasonEn: `Level 3 (Complex/Strategic) -- triggered by: ${level3Triggers.join(', ')}.`,
      reasonAr: `المستوى 3 (معقد/استراتيجي) -- بسبب: ${level3TriggersAr.join('، ')}.`,
    };
  }

  const moderateSignals =
    (inputs.counterpartyHistory === 'established' ? 0 : 1) +
    (typeof inputs.clauseDeviationCount === 'number' && inputs.clauseDeviationCount >= 1 ? 1 : 0);

  if (moderateSignals >= 1 || inputs.durationMonths >= 12) {
    return {
      level: 'level-2-standard',
      reasonEn: 'Level 2 (Standard) -- moderate deviation from standard templates or duration, established counterparty, no Level-3 trigger present.',
      reasonAr: 'المستوى 2 (عادي) -- انحراف متوسط عن النماذج القياسية أو المدة، طرف مقابل معروف، ولا يوجد أي مسبب للمستوى 3.',
    };
  }

  return {
    level: 'level-1-low',
    reasonEn: 'Level 1 (Low) -- standard/templated terms, no Level-2 or Level-3 signal present.',
    reasonAr: 'المستوى 1 (منخفض) -- شروط قياسية/نموذجية، ولا يوجد أي مؤشر للمستوى 2 أو 3.',
  };
}

// ---------------------------------------------------------------------------
// Part C -- LIGHT vs HEAVY review depth (T1, client-configurable threshold)
// ---------------------------------------------------------------------------

export type ReviewDepth = 'light' | 'heavy';

export interface ReviewDepthResolution {
  depth: ReviewDepth;
  reasonEn: string;
  reasonAr: string;
}

/**
 * Resolves LIGHT vs HEAVY review depth. Module 03 Part C's SAR value-band
 * thresholds are an open item since v5 -- "no real client figures have been
 * supplied yet" -- so this deliberately takes the threshold as a caller-
 * supplied, client-configurable number rather than a hardcoded figure
 * (Decision Record 8.7: never invent a number where none was researched).
 * If no threshold is configured, falls back to complexity level alone.
 */
export function resolveReviewDepth(
  complexity: ComplexityLevel,
  value: number,
  heavyThresholdValue?: number
): ReviewDepthResolution {
  if (complexity === 'level-3-complex') {
    return {
      depth: 'heavy',
      reasonEn: 'HEAVY -- Level 3 complexity: full clause-by-clause analysis, risk allocation mapping, pricing/legal-track verification, full redline output.',
      reasonAr: 'مراجعة معمّقة -- المستوى 3 من التعقيد: تحليل شامل بنداً ببند، رسم توزيع المخاطر، التحقق من التسعير/المسار القانوني، مخرج تعديل كامل.',
    };
  }
  if (typeof heavyThresholdValue === 'number' && value >= heavyThresholdValue) {
    return {
      depth: 'heavy',
      reasonEn: `HEAVY -- contract value meets or exceeds the configured threshold (${heavyThresholdValue.toLocaleString()}).`,
      reasonAr: `مراجعة معمّقة -- قيمة العقد تساوي أو تتجاوز الحد المُعدّ (${heavyThresholdValue.toLocaleString()}).`,
    };
  }
  return {
    depth: 'light',
    reasonEn: 'LIGHT -- standard-form-based, checklist-style pass against the mandatory clause set, flag missing/non-standard items, no full redline.',
    reasonAr: 'مراجعة خفيفة -- مبنية على النموذج القياسي، فحص قائمة تحقق مقابل مجموعة البنود الإلزامية، تنبيه على العناصر الناقصة/غير القياسية، دون تعديل كامل.',
  };
}

// ---------------------------------------------------------------------------
// Part D -- RFx (RFI / RFP / RFQ) selection + weighted scoring (T1)
// ---------------------------------------------------------------------------

export type RfxType = 'rfi' | 'rfp' | 'rfq';

export interface RfxTypeMeta {
  id: RfxType;
  label: string;
  labelAr: string;
  purposeEn: string;
  purposeAr: string;
}

export const RFX_TYPES: RfxTypeMeta[] = [
  {
    id: 'rfi', label: 'RFI (Request for Information)', labelAr: 'طلب معلومات (RFI)',
    purposeEn: 'Pre-qualification stage -- gather market insight, assess supplier capability/standards/risk, without commitment.',
    purposeAr: 'مرحلة التأهيل المسبق -- جمع رؤى السوق، وتقييم قدرات الموردين ومعاييرهم ومخاطرهم، دون التزام.',
  },
  {
    id: 'rfp', label: 'RFP (Request for Proposal)', labelAr: 'طلب عرض (RFP)',
    purposeEn: "Outcome-focused, detailed -- evaluate technical fit, delivery model, and total cost of ownership; used when the buyer needs the supplier's proposed approach, not just a price.",
    purposeAr: 'موجه للنتائج، تفصيلي -- تقييم الملاءمة الفنية ونموذج التسليم وإجمالي تكلفة الملكية؛ يُستخدم عندما يحتاج المشتري إلى نهج المورد المقترح، لا السعر فقط.',
  },
  {
    id: 'rfq', label: 'RFQ (Request for Quotation)', labelAr: 'طلب عرض أسعار (RFQ)',
    purposeEn: 'Price-focused, narrow scope -- used when specifications are already clear and fixed; compares unit rates, terms, and lead times across bidders.',
    purposeAr: 'موجه للسعر، نطاق ضيق -- يُستخدم عندما تكون المواصفات محددة وثابتة بالفعل؛ يقارن أسعار الوحدة والشروط ومدد التسليم بين مقدمي العروض.',
  },
];

export function rfxTypeLabel(id: RfxType | undefined, isAr: boolean): string | undefined {
  if (!id) return undefined;
  const meta = RFX_TYPES.find((r) => r.id === id);
  return meta ? (isAr ? meta.labelAr : meta.label) : undefined;
}

export interface RfxSelectionInputs {
  specificationsFixed: boolean;
  supplierCapabilityKnown: boolean;
  needsApproachComparison: boolean;
}

/**
 * Selection rule derived from Module 03 Part D (not a separately-named
 * framework): if specs aren't fixed or supplier capability is unknown ->
 * RFI first. If specs are fixed and only price/commercial terms differ ->
 * RFQ. If the buyer needs to compare differing supplier approaches against
 * a defined outcome -> RFP.
 */
export function recommendRfxType(inputs: RfxSelectionInputs): { type: RfxType; reasonEn: string; reasonAr: string } {
  if (!inputs.specificationsFixed || !inputs.supplierCapabilityKnown) {
    return {
      type: 'rfi',
      reasonEn: 'Specifications are not yet fixed or supplier capability/market is unknown -- start with an RFI to narrow the field before RFP/RFQ.',
      reasonAr: 'المواصفات غير محددة بعد أو قدرات/سوق الموردين غير معروفة -- ابدأ بطلب معلومات (RFI) لتضييق النطاق قبل RFP/RFQ.',
    };
  }
  if (inputs.needsApproachComparison) {
    return {
      type: 'rfp',
      reasonEn: 'Specifications are fixed and supplier capability is known, but the buyer needs to compare differing supplier approaches/solutions against a defined outcome -- use an RFP.',
      reasonAr: 'المواصفات محددة وقدرات الموردين معروفة، لكن المشتري يحتاج لمقارنة نُهج/حلول الموردين المختلفة مقابل نتيجة محددة -- استخدم طلب عرض (RFP).',
    };
  }
  return {
    type: 'rfq',
    reasonEn: 'Specifications are fixed and only price/commercial terms differ across bidders -- use an RFQ for fast, transparent price comparison.',
    reasonAr: 'المواصفات محددة ولا يختلف بين مقدمي العروض سوى السعر/الشروط التجارية -- استخدم طلب عرض أسعار (RFQ) لمقارنة سريعة وشفافة للأسعار.',
  };
}

export interface RfxScoringCriterion {
  id: string;
  labelEn: string;
  labelAr: string;
  /** Weight as a percentage (0-100). Weighted criteria should sum to 100
   *  across all non-mandatory-gate criteria. */
  weight: number;
  /** Mandatory-gate criteria are scored pass/fail BEFORE weighted scoring
   *  begins (a compliance matrix) -- licensing, deadlines, format --
   *  disqualifying non-compliant bids before they reach the weighted
   *  comparison, per Module 03 Part D's sourced two-stage best practice. */
  isMandatoryGate: boolean;
}

/** Illustrative default weight split, sourced as a commonly-cited range
 *  (not a single fixed rule) -- technical ~40%, price ~25-30%, past
 *  performance/experience ~15-20%, remainder to compliance/viability/key
 *  personnel. Presented as a starting template; every weight is editable. */
export const RFX_DEFAULT_SCORING_TEMPLATE: RfxScoringCriterion[] = [
  { id: 'mandatory-compliance', labelEn: 'Mandatory compliance (licensing, deadlines, format)', labelAr: 'الامتثال الإلزامي (التراخيص، المواعيد النهائية، الصيغة)', weight: 0, isMandatoryGate: true },
  { id: 'technical-approach', labelEn: 'Technical approach', labelAr: 'النهج الفني', weight: 40, isMandatoryGate: false },
  { id: 'price', labelEn: 'Price', labelAr: 'السعر', weight: 28, isMandatoryGate: false },
  { id: 'past-performance', labelEn: 'Past performance / experience', labelAr: 'الأداء السابق / الخبرة', weight: 18, isMandatoryGate: false },
  { id: 'vendor-viability', labelEn: 'Vendor viability, key personnel', labelAr: 'استمرارية المورد، الكوادر الرئيسية', weight: 14, isMandatoryGate: false },
];

export interface RfxBidderScoreInput {
  bidderId: string;
  bidderName: string;
  /** Whether this bidder passed every mandatory-gate criterion. If false,
   *  the bidder is disqualified before weighted scoring, per the sourced
   *  two-stage compliance-gate-then-weighted-score structure. */
  passedMandatoryGate: boolean;
  /** Score 0-100 per non-mandatory-gate criterion id. */
  scores: Record<string, number>;
}

export interface RfxBidderResult {
  bidderId: string;
  bidderName: string;
  disqualified: boolean;
  weightedTotal: number | null;
}

/**
 * Scores RFx bidders per Module 03 Part D's sourced two-stage pattern:
 * mandatory compliance gate first, then weighted scoring only for bidders
 * that passed the gate. Pure logic, T1.
 */
export function scoreRfxBidders(
  criteria: RfxScoringCriterion[],
  bidders: RfxBidderScoreInput[]
): RfxBidderResult[] {
  const weightedCriteria = criteria.filter((c) => !c.isMandatoryGate);
  return bidders.map((b) => {
    if (!b.passedMandatoryGate) {
      return { bidderId: b.bidderId, bidderName: b.bidderName, disqualified: true, weightedTotal: null };
    }
    let total = 0;
    for (const c of weightedCriteria) {
      const raw = b.scores[c.id] ?? 0;
      total += (raw * c.weight) / 100;
    }
    return { bidderId: b.bidderId, bidderName: b.bidderName, disqualified: false, weightedTotal: Math.round(total * 100) / 100 };
  });
}

// ---------------------------------------------------------------------------
// Part E -- Cross-module wiring (T1, consolidation of existing checks)
// ---------------------------------------------------------------------------

export interface WiringCheck {
  id: string;
  labelEn: string;
  labelAr: string;
  flagged: boolean;
}

/**
 * Consolidates the cross-module dependency map from Module 03 Part E into
 * one panel. This function does NOT reimplement the underlying checks --
 * it composes results already computed by checkGoverningLawMismatch()
 * (Module 01), checkArbitrationInstitutionFit() (Module 01), and
 * checkPricingMisuseFlag() (Module 04), which the caller passes in. Kept
 * as a thin composition layer so the four modules stay wired without
 * duplicating logic that already exists and is already tested.
 */
export function summarizeWiringChecks(flags: { id: string; labelEn: string; labelAr: string; flagged: boolean }[]): WiringCheck[] {
  return flags.map((f) => ({ id: f.id, labelEn: f.labelEn, labelAr: f.labelAr, flagged: f.flagged }));
}

// ---------------------------------------------------------------------------
// Part F -- MOCK document extraction (dev/demo ONLY -- never production data)
// ---------------------------------------------------------------------------
//
// This section exists to de-risk the eventual real Tier-2 document-
// extraction pipeline: it lets Module 03's complexity-tiering and review-
// depth logic (above) be exercised end-to-end against realistic-shaped
// data BEFORE any real extraction infrastructure is built or funded.
//
// NON-NEGOTIABLE RULE (owner-agreed, 26 Aug 2026): this mock must NEVER
// reach a real client disguised as a real AI-read of their contract. ISC's
// one clearly-evidenced structural moat is "no fabricated confidence,
// ever" -- a simulated extraction result surfacing as if genuine would
// directly contradict that. Every export in this section is prefixed
// `mock`/`MOCK` or named with `Demo` for exactly this reason: so it can
// never be mistaken for the real thing in a future code review, and so it
// is trivially greppable if anyone needs to audit every call site before
// a release. Nothing in this section is imported by CLMTools.tsx's
// production save/load path (contractToPayload/serverToContract) -- see
// clmContractLifecycle.test.ts for a test that enforces this by import-
// graph inspection.

export interface MockExtractionResult {
  /** Always true -- present on every result so any consumer can assert
   *  this did not come from a real pipeline, even if the type system is
   *  bypassed somewhere. */
  isSimulated: true;
  simulatedClauseDeviationCount: number;
  simulatedNotesEn: string;
  simulatedNotesAr: string;
}

/**
 * Deterministic, clearly-labeled simulation of what a future real Tier-2
 * extraction pipeline would eventually return for "clause deviation
 * count" -- NOT a real document parser. Counts occurrences of a small set
 * of deviation-signal keywords in the supplied synthetic text and returns
 * a bounded, deterministic count. Intended ONLY for dev-mode/demo-mode
 * exercising of resolveComplexityLevel() above -- never for a real
 * client's real contract text.
 */
export function mockDocumentExtraction(syntheticContractText: string): MockExtractionResult {
  const deviationSignals = [
    'notwithstanding the foregoing', 'in deviation from', 'as an exception to',
    'non-standard', 'bespoke', 'special condition', 'amended to read',
  ];
  const lower = syntheticContractText.toLowerCase();
  const count = deviationSignals.reduce((acc, signal) => acc + (lower.includes(signal) ? 1 : 0), 0);
  return {
    isSimulated: true,
    simulatedClauseDeviationCount: count,
    simulatedNotesEn: `SIMULATED result, not a real extraction: found ${count} deviation-signal phrase(s) in the supplied synthetic text. This function exists to test Module 03's logic against realistic-shaped input before any real document-extraction pipeline is built.`,
    simulatedNotesAr: `نتيجة محاكاة، وليست استخراجاً حقيقياً: تم العثور على ${count} عبارة/عبارات إشارة انحراف في النص التجريبي المُدخل. تهدف هذه الدالة إلى اختبار منطق الوحدة 03 مقابل بيانات واقعية الشكل قبل بناء أي خط أنابيب استخراج مستندات حقيقي.`,
  };
}
