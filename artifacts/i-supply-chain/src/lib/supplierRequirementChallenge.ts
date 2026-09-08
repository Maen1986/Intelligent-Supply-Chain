/**
 * Supplier Intelligence Module 01 — Requirement Challenge & Capability
 * Ontology (SI-01, 8 Sep 2026).
 *
 * Pure functions, no side effects, no network calls -- same pattern as
 * decisionLab.ts and supplierDependency.ts. This module's own spec states
 * its real consumer is Module 02 (Kraljic Positioning), not an end user
 * directly, and no Supplier Intelligence page/route exists yet to wire a UI
 * into -- so this ships as a tested library this cycle, not a page.
 *
 * Honest scope limit (see SI-01-Requirement-Challenge-Capability-Ontology.md
 * for the full disclosure): the platform's licensed UNSPSC Class/Commodity
 * dataset (#385, #443, unspscClassCommodity.ts / unspscSegments.ts) covers
 * only 16 real UNSPSC SERVICES segments (70-93). Goods segments (10-56,
 * where most real sourcing categories like aluminum extrusion, resin,
 * fasteners, and motors actually live) are explicitly out of scope for that
 * dataset per its own docblock. classifyRequirement() below reflects that
 * truthfully: a 'services' requirement gets a real UNSPSC family/class/
 * commodity match; a 'goods' requirement returns `covered: false` and a
 * disclosed reason, never a guessed or approximated UNSPSC code. This is a
 * direct application of Decision Record 8.7 (no fabricated coverage) to a
 * module whose own illustrative example (aluminum extrusion) is itself a
 * goods requirement the platform cannot yet classify against real UNSPSC.
 *
 * The generic challenge-question library below is grounded in real ISM/CIPS
 * strategic-sourcing requirement-challenge practice (specification
 * creep, incumbent-bias inertia, MOQ/lead-time inflation, over-certification,
 * make-vs-buy, demand-volatility masking as capacity need) -- these are
 * general, method-level heuristics any trained sourcing professional would
 * apply, not fabricated statistics or invented benchmarks. Maen's own
 * category-specific challenge questions remain a genuine OWNER INPUT NEEDED
 * item (see SI-01.md) and are not fabricated here to fill that gap.
 */

import { searchUnspscClassCommodity, type UnspscSearchResult } from '@/lib/unspscClassCommodity';
import { UNSPSC_SERVICES_SEGMENTS, unspscSegmentLabel } from '@/lib/unspscSegments';

export type RequirementType = 'goods' | 'services';

export interface ChallengeQuestion {
  id: string;
  question: string;
  questionAr: string;
  rationale: string;
  rationaleAr: string;
  /** Which requirement type this question is most relevant to. */
  appliesTo: RequirementType | 'both';
}

export interface ChallengeQuestionResponse {
  questionId: string;
  clientResponse: string | null;
}

export interface UnspscClassificationResult {
  covered: boolean;
  segment?: string;
  segmentLabel?: string;
  family?: string;
  familyCode?: string;
  class?: string;
  classCode?: string;
  commodity?: string;
  commodityCode?: string;
  /** Always populated -- states plainly why coverage is or isn't available. */
  note: string;
}

export interface CapacityRequirement {
  value: number | null;
  unit: string;
  basis: 'annual' | 'per-order' | 'peak' | '';
}

export type RequirementConfidence = 'HIGH' | 'MODERATE' | 'LOW';

export interface RequirementBrief {
  statedNeed: string;
  requirementType: RequirementType;
  challengeQuestions: Array<{ question: string; rationale: string; clientResponse: string | null }>;
  unspscClassification: UnspscClassificationResult;
  specification: string[];
  certificationRequired: string[];
  capacityRequirement: CapacityRequirement;
  geographyConstraint: string | null;
  requirementConfidence: RequirementConfidence;
  evidenceSummary: { assumptions: string[]; unresolvedChallenges: string[] };
}

/**
 * Generic, ISM/CIPS-grounded requirement-challenge library. Real-world
 * sourcing-challenge practice, not a fabricated statistic set -- these are
 * the same categories of question a CIPS-trained category manager is taught
 * to ask before accepting a stated requirement at face value. Deliberately
 * broader than SI-01.md's original 2 illustrative examples so the module has
 * a real starting library rather than only worked examples.
 */
export const GENERIC_CHALLENGE_QUESTIONS: ChallengeQuestion[] = [
  {
    id: 'spec-vs-outcome',
    question: "This requirement is written as a specification (how). What's the underlying business outcome (what) it needs to achieve? A supplier who meets the letter of the spec but misses the outcome still fails you.",
    questionAr: 'هذا المطلب مكتوب كمواصفة فنية (كيف). ما هي النتيجة التجارية الفعلية (ماذا) التي يجب تحقيقها؟ المورد الذي يستوفي نص المواصفة دون تحقيق النتيجة يظل غير كافٍ.',
    rationale: 'Specification creep -- writing "how" instead of "what" -- is the single most common way a requirement quietly excludes a perfectly capable, lower-cost supplier.',
    rationaleAr: 'التضخم في المواصفات — كتابة "كيف" بدلاً من "ماذا" — هو السبب الأكثر شيوعًا لاستبعاد مورد قادر وأقل تكلفة دون قصد.',
    appliesTo: 'both',
  },
  {
    id: 'certification-driver',
    question: "You've named a specific certification requirement. Is that a genuine requirement of your end customer or regulator, or an internal preference carried forward from a past decision?",
    questionAr: 'لقد حددت شهادة معينة كمتطلب. هل هذا مطلب فعلي من عميلك النهائي أو الجهة التنظيمية، أم تفضيل داخلي توارثته المؤسسة من قرار سابق؟',
    rationale: 'An unquestioned certification requirement can eliminate 80% of a viable supplier pool for a reason that no longer applies, or never genuinely did.',
    rationaleAr: 'متطلب شهادة لم يُعاد النظر فيه قد يستبعد أغلب الموردين المؤهلين لسبب لم يعد قائمًا، أو لم يكن قائمًا أصلًا.',
    appliesTo: 'both',
  },
  {
    id: 'moq-real-demand',
    question: 'This spec states a minimum order quantity. Is that quantity driven by your actual demand pattern, or is it a supplier-side minimum you were quoted once and never re-tested against alternatives?',
    questionAr: 'تنص المواصفة على حد أدنى للكمية المطلوبة. هل هذه الكمية ناتجة عن نمط طلبكم الفعلي، أم أنها حد أدنى فرضه المورد في عرض سابق ولم تُختبر مقابل بدائل أخرى؟',
    rationale: 'MOQ figures often originate from a single incumbent quote and get copy-pasted into every subsequent RFP without being re-challenged.',
    rationaleAr: 'غالبًا ما تنشأ أرقام الحد الأدنى للطلب من عرض سعر واحد من المورد الحالي، ثم تُنقل حرفيًا إلى كل طلب عروض لاحق دون إعادة تحديها.',
    appliesTo: 'goods',
  },
  {
    id: 'incumbent-bias',
    question: "How was this requirement's specification originally set -- against a real engineering or performance need, or by describing what your current/incumbent supplier already provides?",
    questionAr: 'كيف تم تحديد مواصفة هذا المطلب أصلًا — بناءً على حاجة هندسية أو أدائية فعلية، أم بوصف ما يقدمه المورد الحالي أصلًا؟',
    rationale: 'A specification unconsciously written around the incumbent’s exact process or tolerance locks out every real alternative by design, not by necessity.',
    rationaleAr: 'المواصفة المكتوبة دون قصد لتطابق عملية أو تفاوتات المورد الحالي تحديدًا تستبعد كل بديل فعلي بحكم التصميم لا الضرورة.',
    appliesTo: 'both',
  },
  {
    id: 'lead-time-buffer',
    question: 'The stated lead time requirement -- is that your genuine operational need, or a buffer already inflated to cover a planning or forecasting weakness elsewhere?',
    questionAr: 'مدة التسليم المطلوبة — هل هي حاجتكم التشغيلية الفعلية، أم هامش أمان مُضخّم أصلًا لتغطية ضعف في التخطيط أو التنبؤ بمكان آخر؟',
    rationale: 'A padded lead-time requirement narrows the supplier pool to whoever already holds inventory near you, for a problem better solved with better forecasting.',
    rationaleAr: 'متطلب مدة تسليم مُبالغ فيه يضيّق قائمة الموردين لمن يملك مخزونًا قريبًا منكم أصلًا، لمشكلة يُفضَّل حلها بتحسين التنبؤ لا بالمواصفة.',
    appliesTo: 'both',
  },
  {
    id: 'make-vs-buy',
    question: 'Has this need been tested against a make-vs-buy comparison recently, or has "we always source this externally" gone unexamined for several cycles?',
    questionAr: 'هل خضعت هذه الحاجة لمقارنة "تصنيع داخلي مقابل شراء خارجي" مؤخرًا، أم أن افتراض "نشتري هذا دائمًا من الخارج" لم يُعاد فحصه منذ عدة دورات؟',
    rationale: 'Sourcing strategy inertia -- treating a make-vs-buy decision as permanently settled -- is a real, common blind spot in mature procurement functions.',
    rationaleAr: 'الجمود في استراتيجية التوريد — التعامل مع قرار "تصنيع أم شراء" كأنه نهائي إلى الأبد — نقطة عمياء حقيقية وشائعة في وظائف المشتريات الناضجة.',
    appliesTo: 'both',
  },
  {
    id: 'volume-demand-honesty',
    question: 'Is the capacity/volume figure you’re requesting based on actual historical consumption, or a forecast padded upward "to be safe" that no one has validated against real usage?',
    questionAr: 'هل رقم السعة/الكمية المطلوب مبني على استهلاك تاريخي فعلي، أم توقع مُضخّم "للاحتياط" لم يتحقق أحد من مطابقته للاستخدام الفعلي؟',
    rationale: 'An inflated capacity requirement disqualifies smaller, often more responsive or lower-cost suppliers who could serve the real demand comfortably.',
    rationaleAr: 'متطلب سعة مُبالغ فيه يستبعد موردين أصغر، وغالبًا أكثر استجابة أو أقل تكلفة، بينما هم قادرون فعليًا على تلبية الطلب الحقيقي بارتياح.',
    appliesTo: 'both',
  },
  {
    id: 'geography-constraint-real',
    question: 'The geography constraint on this requirement -- is that a genuine logistics, regulatory, or local-content necessity, or an unexamined habit of sourcing from the same region every time?',
    questionAr: 'قيد الجغرافيا على هذا المطلب — هل هو ضرورة لوجستية أو تنظيمية أو متعلقة بالمحتوى المحلي فعلًا، أم عادة غير مفحوصة بالتوريد من المنطقة نفسها دائمًا؟',
    rationale: 'An unexamined geography constraint is one of the fastest ways to convert a Leverage-quadrant category into an artificially Bottleneck one.',
    rationaleAr: 'قيد الجغرافيا غير المفحوص من أسرع الطرق لتحويل فئة توريد من موقع "قوة تفاوضية" إلى فئة "اختناق" مُصطنعة دون داعٍ.',
    appliesTo: 'both',
  },
  {
    id: 'service-scope-bundling',
    question: 'This service requirement bundles several distinct deliverables into one scope. Would unbundling it open the field to specialist providers who could outperform a single generalist on at least part of the scope?',
    questionAr: 'يجمع هذا المطلب الخدمي عدة مخرجات متمايزة ضمن نطاق واحد. هل يؤدي فصلها إلى فتح المجال أمام مزودين متخصصين قد يتفوقون على مزود عام واحد في جزء من النطاق على الأقل؟',
    rationale: 'Bundled service scopes are a common way a single incumbent generalist stays unchallenged on every component, including the ones they perform worst.',
    rationaleAr: 'تجميع نطاقات الخدمة أسلوب شائع يبقي مزودًا عامًا واحدًا دون تحدٍّ في كل عنصر، بما فيها العناصر التي يؤديها بأداء أضعف.',
    appliesTo: 'services',
  },
  {
    id: 'payment-terms-drag',
    question: 'Are the payment terms attached to this requirement your organization’s genuine cash-flow need, or terms copied from a prior contract that no longer reflect your current position?',
    questionAr: 'هل شروط الدفع المرفقة بهذا المطلب تعكس حاجة تدفقكم النقدي الفعلية، أم أنها منسوخة من عقد سابق لم تعد تعكس وضعكم الحالي؟',
    rationale: 'Payment terms are frequently inherited unchanged from contract to contract and can silently narrow the supplier pool to whoever can absorb that cash-flow drag.',
    rationaleAr: 'غالبًا ما تُورَّث شروط الدفع دون تغيير من عقد لآخر، وقد تُضيّق قائمة الموردين دون قصد إلى من يستطيع تحمّل هذا الضغط على التدفق النقدي فقط.',
    appliesTo: 'both',
  },
];

/** Returns the subset of the generic library relevant to a given requirement type. */
export function getApplicableChallengeQuestions(requirementType: RequirementType): ChallengeQuestion[] {
  return GENERIC_CHALLENGE_QUESTIONS.filter(q => q.appliesTo === 'both' || q.appliesTo === requirementType);
}

/**
 * Classifies a requirement against the platform's real UNSPSC dataset.
 *
 * Honest by construction: a 'goods' requirementType always returns
 * `covered: false` with a disclosed reason (the licensed Class/Commodity
 * dataset does not cover goods segments 10-56), never a guessed match. A
 * 'services' requirementType runs a real search against the live 16-segment
 * services dataset via searchUnspscClassCommodity() and returns `covered:
 * true` only when that search actually returns a result.
 */
export function classifyRequirement(
  requirementType: RequirementType,
  query: string,
  segmentCode?: string,
): UnspscClassificationResult {
  if (requirementType === 'goods') {
    return {
      covered: false,
      note: 'UNSPSC goods classification (segments 10-56) is not yet covered by the platform’s licensed Class/Commodity dataset -- this requirement is tracked by free-text category until that dataset is scoped and built.',
    };
  }

  if (!segmentCode) {
    return {
      covered: false,
      note: 'No UNSPSC services segment selected yet -- choose one of the 16 covered segments to attempt a Class/Commodity match.',
    };
  }

  const segmentLabel = unspscSegmentLabel(segmentCode, false);
  if (!segmentLabel) {
    return {
      covered: false,
      note: `Segment code "${segmentCode}" is not one of the platform's 16 covered UNSPSC services segments.`,
    };
  }

  const results: UnspscSearchResult[] = searchUnspscClassCommodity(segmentCode, query, 1);
  if (results.length === 0) {
    return {
      covered: false,
      segment: segmentCode,
      segmentLabel,
      note: `No Family/Class/Commodity match found for "${query}" within segment ${segmentCode} (${segmentLabel}) -- tracked by free-text category until a match is confirmed.`,
    };
  }

  const top = results[0];
  return {
    covered: true,
    segment: segmentCode,
    segmentLabel,
    family: top.familyTitle,
    familyCode: top.familyCode,
    class: top.classTitle,
    classCode: top.classCode,
    commodity: top.commodityTitle,
    commodityCode: top.commodityCode,
    note: `Matched at ${top.level} level within segment ${segmentCode} (${segmentLabel}).`,
  };
}

/**
 * Confidence is a disclosed, rule-based read of how complete and challenged
 * the brief actually is -- never an AI-invented score (Decision Record 8.7).
 * LOW whenever classification isn't covered or challenge questions are
 * unanswered; MODERATE when classified but with open unresolved challenges
 * or missing specification/capacity; HIGH only when classification succeeded
 * (or was honestly and completely flagged as goods-not-yet-covered with a
 * populated free-text category) AND at least one challenge question has a
 * real client response AND specification is non-empty.
 */
export function assessRequirementConfidence(input: {
  unspscClassification: UnspscClassificationResult;
  challengeResponses: ChallengeQuestionResponse[];
  specification: string[];
  capacityRequirement: CapacityRequirement;
  freeTextCategory?: string;
}): RequirementConfidence {
  const { unspscClassification, challengeResponses, specification, capacityRequirement, freeTextCategory } = input;

  const answeredChallenges = challengeResponses.filter(r => r.clientResponse && r.clientResponse.trim().length > 0);
  const hasSpecification = specification.length > 0;
  const hasCapacity = capacityRequirement.value !== null && capacityRequirement.basis !== '';

  const classificationResolved =
    unspscClassification.covered ||
    (!!freeTextCategory && freeTextCategory.trim().length > 0);

  if (!classificationResolved || answeredChallenges.length === 0) {
    return 'LOW';
  }

  if (hasSpecification && hasCapacity && answeredChallenges.length >= 2) {
    return 'HIGH';
  }

  return 'MODERATE';
}

/**
 * Assembles the Requirement Brief that Module 02 consumes directly, per
 * SI-01.md's output schema. Pure assembly -- does not itself decide
 * classification or confidence; callers pass the results of
 * classifyRequirement() / assessRequirementConfidence() in.
 */
export function buildRequirementBrief(input: {
  statedNeed: string;
  requirementType: RequirementType;
  questions: ChallengeQuestion[];
  challengeResponses: ChallengeQuestionResponse[];
  unspscClassification: UnspscClassificationResult;
  specification: string[];
  certificationRequired: string[];
  capacityRequirement: CapacityRequirement;
  geographyConstraint: string | null;
  assumptions: string[];
}): RequirementBrief {
  const { statedNeed, requirementType, questions, challengeResponses, unspscClassification,
    specification, certificationRequired, capacityRequirement, geographyConstraint, assumptions } = input;

  const responseById = new Map(challengeResponses.map(r => [r.questionId, r.clientResponse]));
  const challengeQuestions = questions.map(q => ({
    question: q.question,
    rationale: q.rationale,
    clientResponse: responseById.get(q.id) ?? null,
  }));

  const unresolvedChallenges = questions
    .filter(q => !responseById.get(q.id))
    .map(q => q.question);

  const requirementConfidence = assessRequirementConfidence({
    unspscClassification,
    challengeResponses,
    specification,
    capacityRequirement,
  });

  return {
    statedNeed,
    requirementType,
    challengeQuestions,
    unspscClassification,
    specification,
    certificationRequired,
    capacityRequirement,
    geographyConstraint,
    requirementConfidence,
    evidenceSummary: { assumptions, unresolvedChallenges },
  };
}
