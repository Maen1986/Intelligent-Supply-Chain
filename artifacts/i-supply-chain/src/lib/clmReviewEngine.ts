/**
 * clmReviewEngine.ts
 *
 * Module 09 Part B.6 -- the "Contract Assurance Chain," Review v1's
 * differentiated review methodology (owner instruction, 25 Aug 2026: as
 * "contracts management super consultant," review must be genuinely
 * different and better than typical CLM review tooling in methodology,
 * recommendation style, assurance, options, and causal/logical depth).
 *
 * This is a presentation/assembly layer over data Modules 01, 02, 04 and 05
 * already produce and that is already tested -- no new AI calls, no new
 * legal-content risk, fully consistent with Decision Record 8.7. What is
 * new is the assembly methodology itself:
 *
 * 1. Cross-dimensional, not single-dimension: pulls legal track (Module
 *    01), clause coverage (Module 02), pricing structure (Module 04), and
 *    industry body-of-knowledge (Module 05) into one pass.
 * 2. Never one fabricated composite score (isc-ai-output-standards
 *    Principle #7, hard constraint) -- 4 dimension states are reported
 *    separately, never averaged.
 * 3. Evidence-First, Decision-Ready (Principles #1, #3): every finding
 *    expands to what was found -> why it matters -> options -> our read.
 * 4. Three-tier assurance, always disclosed (generalizes Principle #6):
 *    reference-verified / self-declared-consistent / needs-legal-counsel.
 * 5. "Tell Me the Story" causal chain, reused not reinvented (Principle
 *    #5): primary issue -> underlying cause -> exposure -> intervention ->
 *    expected outcome -> prevention.
 * 6. Options, never a single verdict -- reuses Module 02's real named
 *    clause variants wherever they exist; never invents options where no
 *    sourced variant set exists.
 * 7. "Consider also" counter-argument (Principle #2, "Why Not?").
 *
 * Every finding here is self-declared-input logic (checklist state the
 * client entered), never a verified document-extraction finding -- same
 * standing honesty rule as every flag function in clmLegalTrack.ts,
 * clmPricingTaxonomy.ts, and clmClauseTaxonomy.ts that this file wraps.
 */

import {
  SUBCLAUSES_BY_CATEGORY, overallClauseHealth,
  checkCommercialRibaFlag, checkPerformanceMeasurabilityFlag, checkRiskAllocationFidicMismatchFlag,
  checkForegroundIPGapFlag, checkGovernanceRibaArbitrationFlag,
  type ClausesPresent, type ClauseCategoriesNotApplicable,
} from './clmClauseTaxonomy';
import { checkGoverningLawMismatch, type GoverningLawTrack } from './clmLegalTrack';
import { checkPricingMisuseFlag, type PricingType, type ScopeDefiniteness } from './clmPricingTaxonomy';
import {
  resolveApplicableStandard,
  type IndustryBucket, type FidicBook, type ProfessionalServicesTrack, type LogisticsMode,
} from './clmIndustryStandards';

// --- Assurance tiers ---

export type AssuranceTier = 'reference-verified' | 'self-declared-consistent' | 'needs-counsel';

export const ASSURANCE_META: Record<AssuranceTier, { labelEn: string; labelAr: string; descEn: string; descAr: string }> = {
  'reference-verified': {
    labelEn: 'Reference-Verified', labelAr: 'مُتحقَّق منه مرجعياً',
    descEn: 'Matches a specific, named, sourced external standard (e.g. a FIDIC sub-clause, an ICC Incoterm, a dated PDPL requirement) -- the strongest tier ISC can offer. Still not a substitute for legal advice.',
    descAr: 'يتطابق مع معيار خارجي محدد وموثق باسمه (مثل بند فرعي من FIDIC، أو قاعدة إنكوترمز، أو متطلب مؤرخ من نظام حماية البيانات الشخصية) -- أقوى مستوى يمكن أن تقدمه المنصة. لا يُغني مع ذلك عن الاستشارة القانونية.',
  },
  'self-declared-consistent': {
    labelEn: 'Self-Declared Consistent', labelAr: 'متسق مع التصريح الذاتي',
    descEn: 'Logically consistent with the checklist state you entered -- not independently verified against the actual contract document text.',
    descAr: 'متسق منطقياً مع حالة القائمة المرجعية التي أدخلتموها -- لم يتم التحقق منه بشكل مستقل مقابل نص العقد الفعلي.',
  },
  'needs-counsel': {
    labelEn: 'Needs Legal Counsel', labelAr: 'يتطلب استشارة قانونية',
    descEn: 'Applies on top of every finding that touches binding clause wording -- never removed, never downgraded, regardless of how confident the other tiers are.',
    descAr: 'ينطبق فوق كل نتيجة تمس صياغة بند ملزم -- لا يُزال ولا يُخفَّف أبداً، بصرف النظر عن مدى ثقة المستويات الأخرى.',
  },
};

// --- Causal chain (adapts the platform's existing "Tell Me the Story"
//     narrative template: primary cause -> underlying cause -> exposure ->
//     who's affected -> recommended intervention -> expected impact ->
//     prevention -- condensed to 6 steps for a per-finding chain) ---

export interface CausalChainStep {
  stepEn: string; stepAr: string;
  textEn: string; textAr: string;
}

export interface ReviewOption {
  id: string;
  labelEn: string; labelAr: string;
  descEn: string; descAr: string;
}

export interface ReviewFinding {
  id: string;
  dimension: 'legal' | 'clause' | 'pricing';
  titleEn: string; titleAr: string;
  assuranceTiers: AssuranceTier[];
  sourceEn: string; sourceAr: string;
  causalChain: CausalChainStep[];
  considerAlsoEn: string; considerAlsoAr: string;
  /** Real named alternatives, only populated where a sourced variant set
   *  actually exists (Module 02's 7 tagged clauses). Left undefined --
   *  never fabricated -- when no real option set exists for this finding. */
  options?: ReviewOption[];
}

export type DimensionStatus = 'strong' | 'attention' | 'not-yet-assessed' | 'not-applicable';

export interface DimensionState {
  dimension: 'legal' | 'clause' | 'pricing' | 'industry';
  labelEn: string; labelAr: string;
  status: DimensionStatus;
  noteEn: string; noteAr: string;
}

export interface ReviewReport {
  dimensions: DimensionState[];
  findings: ReviewFinding[];
}

function variantsFor(category: keyof typeof SUBCLAUSES_BY_CATEGORY, subclauseId: string): ReviewOption[] | undefined {
  const sc = SUBCLAUSES_BY_CATEGORY[category].find(s => s.id === subclauseId);
  if (!sc?.variants) return undefined;
  return sc.variants.map(v => ({ id: v.id, labelEn: v.label, labelAr: v.labelAr, descEn: '', descAr: '' }));
}

// --- Individual finding builders (one per existing flag function) ---

function buildLegalMismatchFinding(
  governingLawClause: GoverningLawTrack | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
): ReviewFinding | undefined {
  const check = checkGoverningLawMismatch(governingLawClause, counterpartyJurisdiction, performanceLocation);
  if (!check.flagged) return undefined;
  return {
    id: 'legal-governing-law-mismatch',
    dimension: 'legal',
    titleEn: 'Governing Law May Not Match Where This Contract Actually Operates',
    titleAr: 'قد لا يتطابق القانون الحاكم مع مكان تنفيذ هذا العقد فعلياً',
    assuranceTiers: ['self-declared-consistent', 'needs-counsel'],
    sourceEn: 'Module 01 legal-track recognition, applied to the counterparty jurisdiction and performance location you entered.',
    sourceAr: 'تعرّف المسار القانوني (الوحدة 01)، مطبَّقاً على ولاية الطرف المقابل وموقع التنفيذ اللذين أدخلتموهما.',
    causalChain: [
      { stepEn: 'What we found', stepAr: 'ما وجدناه', textEn: check.reasonEn, textAr: check.reasonAr },
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Governing law is often set by template default or by whichever party drafted the contract, without a deliberate check against where the counterparty is actually domiciled and where the work is actually performed.',
        textAr: 'كثيراً ما يُحدَّد القانون الحاكم افتراضياً حسب القالب أو الطرف الذي صاغ العقد، دون تحقق متعمد من مكان تواجد الطرف المقابل فعلياً ومكان تنفيذ العمل فعلياً.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'If a dispute arises, enforcing a judgment or arbitral award may require recognition in a jurisdiction the contract was never actually written for -- adding cost, delay, and uncertainty exactly when you can least afford it.',
        textAr: 'في حال نشوء نزاع، قد يتطلب إنفاذ الحكم أو قرار التحكيم اعترافاً في ولاية قضائية لم يُصَغ العقد من أجلها أصلاً -- مما يضيف تكلفة وتأخيراً وعدم يقين في أحوج الأوقات إليها.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Have qualified legal counsel confirm whether the stated governing law is still the right choice given the counterparty\'s actual domicile and performance location -- or whether it should be renegotiated before signing.',
        textAr: 'اطلبوا من مستشار قانوني مؤهل تأكيد ما إذا كان القانون الحاكم المذكور لا يزال الخيار الصحيح في ضوء موطن الطرف المقابل الفعلي وموقع التنفيذ -- أو ما إذا كان ينبغي إعادة التفاوض عليه قبل التوقيع.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'A governing-law clause that matches where the contract actually lives reduces enforcement friction and legal cost if a dispute ever occurs.',
        textAr: 'يقلل بند قانون حاكم يتطابق مع مكان تنفيذ العقد فعلياً من صعوبات الإنفاذ والتكلفة القانونية في حال نشوء نزاع.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Make jurisdiction confirmation a standard step before any contract is finalized, not something caught only at review.',
        textAr: 'اجعلوا التحقق من الولاية القضائية خطوة معيارية قبل إنهاء أي عقد، لا أمراً يُكتشف فقط عند المراجعة.' },
    ],
    considerAlsoEn: 'A mismatch is not automatically wrong -- sophisticated counterparties sometimes deliberately choose a neutral third jurisdiction for genuine commercial reasons. This finding is a prompt to confirm intent, not a presumption of error.',
    considerAlsoAr: 'عدم التطابق ليس خطأً بالضرورة -- فقد يختار أطراف متمرسون عمداً ولاية قضائية محايدة لأسباب تجارية حقيقية. هذه النتيجة دعوة لتأكيد النية، وليست افتراضاً بوجود خطأ.',
  };
}

function buildPricingMisuseFinding(
  pricingPrimary: PricingType | undefined,
  scopeDefiniteness: ScopeDefiniteness | undefined,
  hasCapOrMilestones: boolean | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): ReviewFinding | undefined {
  const check = checkPricingMisuseFlag(pricingPrimary, scopeDefiniteness, hasCapOrMilestones, startDate, endDate);
  if (!check.flagged) return undefined;
  return {
    id: 'pricing-structure-scope-mismatch',
    dimension: 'pricing',
    titleEn: 'Pricing Structure May Not Fit This Contract\'s Scope Certainty',
    titleAr: 'قد لا يتناسب هيكل التسعير مع مدى وضوح نطاق هذا العقد',
    assuranceTiers: ['self-declared-consistent', 'needs-counsel'],
    sourceEn: 'Module 04 pricing-taxonomy misuse-pattern check, applied to the pricing type and scope definiteness you entered.',
    sourceAr: 'فحص نمط سوء الاستخدام في تصنيف التسعير (الوحدة 04)، مطبَّقاً على نوع التسعير ومدى وضوح النطاق اللذين أدخلتموهما.',
    causalChain: [
      { stepEn: 'What we found', stepAr: 'ما وجدناه', textEn: check.reasonEn, textAr: check.reasonAr },
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Pricing structure is often chosen early, before the scope is fully understood, and then not revisited as the scope\'s actual shape becomes clearer during negotiation.',
        textAr: 'كثيراً ما يُختار هيكل التسعير مبكراً، قبل فهم النطاق بشكل كامل، ثم لا يُعاد النظر فيه مع اتضاح شكل النطاق الفعلي أثناء التفاوض.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'A pricing type mismatched to scope certainty commonly produces disputed change orders, margin erosion, or a client paying for risk the supplier never actually priced in.',
        textAr: 'غالباً ما ينتج عن عدم تطابق نوع التسعير مع وضوح النطاق أوامر تغيير متنازع عليها، أو تآكل في الهامش، أو دفع العميل مقابل مخاطر لم يسعّرها المورد فعلياً.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Revisit whether the pricing structure still matches the scope\'s actual certainty level, or whether a cap, milestone structure, or a different pricing type would better protect both parties.',
        textAr: 'أعيدوا النظر فيما إذا كان هيكل التسعير لا يزال يتناسب مع مستوى وضوح النطاق الفعلي، أو ما إذا كان وضع سقف مالي أو هيكل معالم زمنية أو نوع تسعير مختلف قد يحمي الطرفين بشكل أفضل.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'A pricing structure that matches real scope certainty reduces change-order disputes and protects margin on both sides.',
        textAr: 'يقلل هيكل التسعير المتناسب مع الوضوح الفعلي للنطاق من نزاعات أوامر التغيير ويحمي الهامش لكلا الطرفين.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Reconfirm the pricing type against scope certainty at each major scope revision, not only at contract signature.',
        textAr: 'أعيدوا تأكيد نوع التسعير مقابل وضوح النطاق عند كل تعديل جوهري للنطاق، لا عند توقيع العقد فقط.' },
    ],
    considerAlsoEn: 'A mismatch flag is not proof the pricing structure is wrong -- some organizations deliberately accept a firm-price/evolving-scope combination in exchange for budget certainty, knowingly trading flexibility for predictability.',
    considerAlsoAr: 'لا تعني هذه النتيجة أن هيكل التسعير خاطئ بالضرورة -- فقد تقبل بعض المؤسسات عمداً الجمع بين سعر ثابت ونطاق متطور مقابل يقين في الميزانية، مضحّية بالمرونة عن علم مقابل القابلية للتنبؤ.',
  };
}

function buildClauseFinding(
  check: { flagged: boolean; reasonEn: string; reasonAr: string },
  id: string, titleEn: string, titleAr: string,
  sourceEn: string, sourceAr: string,
  extra: { stepEn: string; stepAr: string; textEn: string; textAr: string }[],
  considerAlsoEn: string, considerAlsoAr: string,
  options?: ReviewOption[],
): ReviewFinding | undefined {
  if (!check.flagged) return undefined;
  return {
    id, dimension: 'clause', titleEn, titleAr,
    assuranceTiers: ['self-declared-consistent', 'needs-counsel'],
    sourceEn, sourceAr,
    causalChain: [
      { stepEn: 'What we found', stepAr: 'ما وجدناه', textEn: check.reasonEn, textAr: check.reasonAr },
      ...extra,
    ],
    considerAlsoEn, considerAlsoAr,
    options,
  };
}

function buildClauseFindings(
  clausesPresent: ClausesPresent | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
  governingLawClause: GoverningLawTrack | undefined,
  fidicBook: FidicBook | undefined,
  industryBucket: IndustryBucket | undefined,
): ReviewFinding[] {
  const findings: (ReviewFinding | undefined)[] = [];

  findings.push(buildClauseFinding(
    checkCommercialRibaFlag(clausesPresent, counterpartyJurisdiction, performanceLocation, governingLawClause),
    'clause-commercial-riba', 'Late-Payment Interest May Carry Sharia-Compliance Risk', 'قد تحمل فائدة التأخر في السداد حساسية شرعية',
    'Module 02 Commercial/Payment category, cross-referenced with Module 01\'s riba-sensitivity thread.',
    'فئة التجاري/الدفع (الوحدة 02)، بالربط مع خيط الحساسية الشرعية للربا في الوحدة 01.',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Interest-bearing late-payment clauses are standard practice in many jurisdictions and get carried into Saudi-touching contracts without a deliberate Sharia-compliance check.',
        textAr: 'تُعد بنود فائدة التأخر في السداد ممارسة معيارية في العديد من الولايات القضائية، وتُنقل إلى العقود ذات الصلة بالسعودية دون فحص متعمد للامتثال الشرعي.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'An interest-bearing structure can face enforceability challenges in Saudi courts on public-policy grounds, undermining the very remedy the clause was meant to provide.',
        textAr: 'قد يواجه الهيكل القائم على الفائدة تحديات في قابلية الإنفاذ أمام المحاكم السعودية بسبب النظام العام، مما يقوّض العلاج ذاته الذي صُمم البند من أجله.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Consider a pre-agreed liquidated-damages figure as a Sharia-compliant alternative to accruing interest, confirmed with legal counsel.',
        textAr: 'ضعوا في الاعتبار مبلغ تعويض مقطوع متفق عليه مسبقاً كبديل متوافق مع الشريعة عن الفائدة المتراكمة، بالتأكد من ذلك مع المستشار القانوني.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'A liquidated-damages structure gives both parties a remedy that is both commercially clear and less exposed to enforceability challenges.',
        textAr: 'يمنح هيكل التعويض المقطوع الطرفين علاجاً واضحاً تجارياً وأقل عرضة لتحديات قابلية الإنفاذ.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Run the Sharia-sensitivity check on every Saudi-touching contract template before it is reused, not only when flagged at review.',
        textAr: 'أجروا فحص الحساسية الشرعية على كل نموذج عقد ذي صلة بالسعودية قبل إعادة استخدامه، لا فقط عند رصده أثناء المراجعة.' },
    ],
    'This is a real, sourced sensitivity, not a certainty -- some structures use a compliant alternative already documented elsewhere in the contract that this checklist doesn\'t see; confirm before assuming a rewrite is required.',
    'هذه حساسية حقيقية وموثقة، لا يقين مطلق -- فقد تستخدم بعض العقود بالفعل بديلاً متوافقاً موثقاً في موضع آخر من العقد لا تراه هذه القائمة؛ تأكدوا قبل افتراض الحاجة لإعادة الصياغة.',
    variantsFor('risk-allocation', 'liquidated-damages-delay-penalties'),
  ));

  findings.push(buildClauseFinding(
    checkPerformanceMeasurabilityFlag(clausesPresent),
    'clause-performance-measurability', 'Performance Obligations May Not Be Measurable', 'قد لا تكون التزامات الأداء قابلة للقياس',
    'Module 02 Performance & Service category.',
    'فئة الأداء والخدمة (الوحدة 02).',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Scope-of-work and delivery language is often drafted before acceptance criteria are defined, leaving performance obligations described but not actually testable.',
        textAr: 'كثيراً ما تُصاغ صياغة نطاق العمل والتسليم قبل تحديد معايير القبول، مما يترك التزامات الأداء موصوفة دون أن تكون قابلة للاختبار فعلياً.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'An obligation with no measurable acceptance test is difficult to enforce if performance falls short -- disputes tend to become arguments about intent rather than fact.',
        textAr: 'يصعب إنفاذ التزام لا يوجد له اختبار قبول قابل للقياس في حال قصور الأداء -- وتميل النزاعات إلى أن تصبح جدلاً حول النية بدلاً من الوقائع.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Add explicit, measurable acceptance criteria tied to the scope-of-work and delivery schedule already in place.',
        textAr: 'أضيفوا معايير قبول صريحة وقابلة للقياس مرتبطة بنطاق العمل وجدول التسليم القائمَين بالفعل.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'Measurable acceptance criteria turn a performance dispute into a fact-check, not an argument.',
        textAr: 'تحوّل معايير القبول القابلة للقياس نزاع الأداء إلى تحقق من الوقائع، لا إلى جدل.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Make acceptance-criteria definition a required step before any scope-of-work is finalized.',
        textAr: 'اجعلوا تحديد معايير القبول خطوة إلزامية قبل إنهاء أي نطاق عمل.' },
    ],
    'Not every contract needs formal acceptance testing -- for very short, low-value engagements the overhead may not be worth it. The finding is a prompt to weigh that trade-off deliberately, not a rule that applies uniformly.',
    'لا يحتاج كل عقد إلى اختبار قبول رسمي -- ففي التكليفات القصيرة جداً أو منخفضة القيمة قد لا تستحق العبء الإداري ذلك. هذه النتيجة دعوة لموازنة هذا الخيار عمداً، وليست قاعدة تُطبَّق بشكل موحّد.',
  ));

  findings.push(buildClauseFinding(
    checkRiskAllocationFidicMismatchFlag(clausesPresent, fidicBook),
    'clause-risk-fidic-mismatch', 'Design-Risk Allocation May Not Match the Selected FIDIC Book', 'قد لا يتطابق توزيع مخاطر التصميم مع كتاب FIDIC المختار',
    'Module 02 Risk Allocation category, cross-referenced with Module 05\'s FIDIC book selection.',
    'فئة توزيع المخاطر (الوحدة 02)، بالربط مع اختيار كتاب FIDIC في الوحدة 05.',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'The FIDIC book is often selected for its overall commercial shape, and the design-risk clause -- the single biggest differentiator between the books -- isn\'t separately confirmed to match.',
        textAr: 'كثيراً ما يُختار كتاب FIDIC وفق شكله التجاري العام، دون التأكد بشكل منفصل من تطابق بند مخاطر التصميم -- وهو العامل الأكبر تمييزاً بين الكتب -- معه.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'If a design flaw surfaces, an undocumented design-risk allocation creates exactly the kind of ambiguity FIDIC\'s book structure was designed to prevent.',
        textAr: 'إذا ظهر عيب في التصميم، يخلق توزيع مخاطر تصميم غير موثق بالضبط نوع الغموض الذي صُمم هيكل كتب FIDIC لمنعه.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Confirm and document the design-risk allocation explicitly, consistent with the selected FIDIC book\'s standard position.',
        textAr: 'أكِّدوا وثِّقوا توزيع مخاطر التصميم صراحةً، بما يتسق مع الموقف المعياري لكتاب FIDIC المختار.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'A documented, book-consistent design-risk clause removes the single largest source of ambiguity in a FIDIC-based contract.',
        textAr: 'يزيل بند مخاطر التصميم الموثق والمتسق مع الكتاب أكبر مصدر غموض في عقد قائم على FIDIC.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Treat design-risk confirmation as a mandatory step of FIDIC book selection, not an optional follow-up.',
        textAr: 'اعتبروا تأكيد مخاطر التصميم خطوة إلزامية من اختيار كتاب FIDIC، لا متابعة اختيارية.' },
    ],
    'The design-risk clause may already exist in an attached technical annex this checklist doesn\'t see -- confirm before assuming it is genuinely missing.',
    'قد يكون بند مخاطر التصميم موجوداً بالفعل في ملحق فني مرفق لا تراه هذه القائمة -- تأكدوا قبل افتراض غيابه فعلياً.',
  ));

  findings.push(buildClauseFinding(
    checkForegroundIPGapFlag(clausesPresent, industryBucket),
    'clause-foreground-ip-gap', 'Ownership of Newly Created Work Product May Be Undefined', 'قد تكون ملكية نتاج العمل الجديد غير محددة',
    'Module 02 Data, IP & Confidentiality category.',
    'فئة البيانات والملكية الفكرية والسرية (الوحدة 02).',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'IP clauses often address what each party already owned coming in (background IP) but leave silent who owns what is newly created during the engagement (foreground IP) -- an easy gap to miss because it feels implicit.',
        textAr: 'كثيراً ما تعالج بنود الملكية الفكرية ما كان يملكه كل طرف مسبقاً (الملكية السابقة) لكنها تترك دون تحديد من يملك ما يُستحدث حديثاً أثناء التنفيذ (الملكية الناتجة) -- وهي فجوة يسهل إغفالها لأنها تبدو ضمنية.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'Without an explicit foreground-IP clause, ownership of deliverables created specifically for this engagement can become genuinely disputed after the fact.',
        textAr: 'دون بند صريح للملكية الفكرية الناتجة، قد تصبح ملكية المخرجات التي أُنشئت خصيصاً لهذا التكليف محل نزاع حقيقي لاحقاً.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Add an explicit foreground-IP ownership clause, choosing among the real, standard structures below.',
        textAr: 'أضيفوا بنداً صريحاً لملكية الملكية الفكرية الناتجة، باختيار أحد الهياكل المعيارية الحقيقية أدناه.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'An explicit foreground-IP clause removes the single most common IP dispute trigger in engagements of this kind.',
        textAr: 'يزيل بند الملكية الفكرية الناتجة الصريح أكثر مسببات نزاعات الملكية الفكرية شيوعاً في تكليفات من هذا النوع.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Make foreground-IP ownership a mandatory field in every Professional Services contract template, not an optional add-on.',
        textAr: 'اجعلوا ملكية الملكية الفكرية الناتجة حقلاً إلزامياً في كل نموذج عقد خدمات مهنية، لا إضافة اختيارية.' },
    ],
    'Some engagements deliberately leave this open when the deliverable has no standalone commercial value -- confirm the deliverable actually matters before treating this as urgent.',
    'قد تترك بعض التكليفات هذا الأمر مفتوحاً عمداً عندما لا يكون للمخرج قيمة تجارية مستقلة -- تأكدوا من أن المخرج مهم فعلياً قبل اعتبار هذا الأمر عاجلاً.',
    variantsFor('data-ip-confidentiality', 'ip-ownership-foreground'),
  ));

  findings.push(buildClauseFinding(
    checkGovernanceRibaArbitrationFlag(clausesPresent, counterpartyJurisdiction, performanceLocation, governingLawClause),
    'clause-governance-riba-arbitration', 'An Arbitral Award Here May Face Sharia Public-Policy Review', 'قد يواجه حكم التحكيم هنا مراجعة النظام العام الشرعية',
    'Module 02 Legal/Governance category, item 33\'s corrected enforcement framing (New York Convention Contracting-State status is a real but secondary check; the dominant risk is Saudi courts\' public-policy Sharia review of an award\'s substance).',
    'فئة القانوني/الحوكمة (الوحدة 02)، وفق التصحيح في البند 33 (صفة الدولة المتعاقدة في اتفاقية نيويورك فحص حقيقي لكنه ثانوي؛ المخاطرة الغالبة هي مراجعة المحاكم السعودية للنظام العام الشرعي لجوهر الحكم).',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Dispute-resolution and payment-interest clauses are usually drafted independently of each other, so their combined enforcement risk on a Saudi-touching contract goes unchecked.',
        textAr: 'عادة ما تُصاغ بنود تسوية المنازعات وفائدة السداد بشكل مستقل عن بعضها، لذا تبقى مخاطر إنفاذها المجتمعة على عقد ذي صلة بالسعودية دون فحص.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'An award that includes an interest component is generally unenforceable in Saudi Arabia on public-policy grounds, regardless of how validly the arbitral seat was chosen -- a real, documented enforcement gap.',
        textAr: 'يكون الحكم الذي يتضمن عنصر فائدة غير قابل للإنفاذ عموماً في السعودية استناداً إلى النظام العام، بصرف النظر عن مدى صحة اختيار مقر التحكيم -- وهي فجوة إنفاذ حقيقية وموثقة.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Confirm with legal counsel whether the payment-interest structure should be replaced with a Sharia-compliant alternative before relying on the arbitration clause for enforcement.',
        textAr: 'تأكدوا مع المستشار القانوني مما إذا كان ينبغي استبدال هيكل فائدة السداد ببديل متوافق مع الشريعة قبل الاعتماد على بند التحكيم للإنفاذ.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'Removing the interest component protects the enforceability of the award itself, not just the underlying payment clause.',
        textAr: 'يحمي إزالة عنصر الفائدة قابلية إنفاذ الحكم نفسه، لا بند الدفع الأساسي فقط.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Check payment-interest and dispute-resolution clauses together, not separately, on every Saudi-touching contract.',
        textAr: 'افحصوا بندي فائدة السداد وتسوية المنازعات معاً، لا بشكل منفصل، في كل عقد ذي صلة بالسعودية.' },
    ],
    'A neutral seat and a Sharia-compliant remedy structure together avoid this risk entirely -- this is a solvable design choice, not an inherent flaw in arbitration as a mechanism.',
    'يتجنب الجمع بين مقر محايد وهيكل علاج متوافق مع الشريعة هذه المخاطرة تماماً -- وهو خيار تصميمي قابل للحل، لا عيباً جوهرياً في التحكيم كآلية.',
    variantsFor('legal-governance', 'dispute-resolution'),
  ));

  return findings.filter((f): f is ReviewFinding => f !== undefined);
}

// --- Dimension states (never collapsed into one composite score --
//     isc-ai-output-standards Principle #7, hard constraint) ---

function legalDimension(
  governingLawClause: GoverningLawTrack | undefined,
  counterpartyJurisdiction: string | undefined,
  performanceLocation: string | undefined,
): DimensionState {
  const label = { labelEn: 'Legal Track', labelAr: 'المسار القانوني' };
  if (!governingLawClause) {
    return { dimension: 'legal', ...label, status: 'not-yet-assessed',
      noteEn: 'Governing law has not been set yet -- add it in Module 01\'s fields to assess this dimension.',
      noteAr: 'لم يُحدَّد القانون الحاكم بعد -- أضيفوه في حقول الوحدة 01 لتقييم هذا البُعد.' };
  }
  const check = checkGoverningLawMismatch(governingLawClause, counterpartyJurisdiction, performanceLocation);
  if (check.flagged) {
    return { dimension: 'legal', ...label, status: 'attention', noteEn: check.reasonEn, noteAr: check.reasonAr };
  }
  return { dimension: 'legal', ...label, status: 'strong',
    noteEn: 'Governing law is consistent with the counterparty jurisdiction and performance location you entered.',
    noteAr: 'القانون الحاكم متسق مع ولاية الطرف المقابل وموقع التنفيذ اللذين أدخلتموهما.' };
}

function clauseDimension(
  clausesPresent: ClausesPresent | undefined,
  notApplicable: ClauseCategoriesNotApplicable | undefined,
): DimensionState {
  const label = { labelEn: 'Clause Coverage', labelAr: 'تغطية البنود' };
  const health = overallClauseHealth(clausesPresent, notApplicable);
  if (health.applicableCategoryCount === 0) {
    return { dimension: 'clause', ...label, status: 'not-applicable', noteEn: health.labelEn, noteAr: health.labelAr };
  }
  if (health.weightedPercent === 0) {
    return { dimension: 'clause', ...label, status: 'not-yet-assessed',
      noteEn: 'No subclauses checked yet -- use the Clause Coverage accordion to record what this contract addresses.',
      noteAr: 'لم يُحدَّد أي بند فرعي بعد -- استخدموا قائمة تغطية البنود لتسجيل ما يتناوله هذا العقد.' };
  }
  const status: DimensionStatus = health.weightedPercent >= 75 ? 'strong' : 'attention';
  return { dimension: 'clause', ...label, status,
    noteEn: `${health.labelEn} (${health.weightedPercent}% weighted coverage across applicable categories).`,
    noteAr: `${health.labelAr} (${health.weightedPercent}% تغطية مرجّحة عبر الفئات المنطبقة).` };
}

function pricingDimension(
  pricingPrimary: PricingType | undefined,
  scopeDefiniteness: ScopeDefiniteness | undefined,
  hasCapOrMilestones: boolean | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): DimensionState {
  const label = { labelEn: 'Pricing Structure', labelAr: 'هيكل التسعير' };
  if (!pricingPrimary) {
    return { dimension: 'pricing', ...label, status: 'not-yet-assessed',
      noteEn: 'Primary pricing type has not been set yet -- add it in Module 04\'s fields to assess this dimension.',
      noteAr: 'لم يُحدَّد نوع التسعير الأساسي بعد -- أضيفوه في حقول الوحدة 04 لتقييم هذا البُعد.' };
  }
  const check = checkPricingMisuseFlag(pricingPrimary, scopeDefiniteness, hasCapOrMilestones, startDate, endDate);
  if (check.flagged) {
    return { dimension: 'pricing', ...label, status: 'attention', noteEn: check.reasonEn, noteAr: check.reasonAr };
  }
  return { dimension: 'pricing', ...label, status: 'strong',
    noteEn: 'Pricing type is consistent with the scope definiteness you entered.',
    noteAr: 'نوع التسعير متسق مع مدى وضوح النطاق الذي أدخلتموه.' };
}

function industryDimension(
  counterpartyType: 'government' | 'private' | undefined,
  industryBucket: IndustryBucket | undefined,
  fidicBook: FidicBook | undefined,
  professionalServicesTrack: ProfessionalServicesTrack | undefined,
  logisticsMode: LogisticsMode | undefined,
): DimensionState {
  const label = { labelEn: 'Industry Fit', labelAr: 'ملاءمة القطاع' };
  if (!industryBucket) {
    return { dimension: 'industry', ...label, status: 'not-yet-assessed',
      noteEn: 'Industry / SOW bucket has not been set yet -- add it in Module 05\'s fields to see the applicable reference standard.',
      noteAr: 'لم يُحدَّد قطاع الصناعة / نطاق العمل بعد -- أضيفوه في حقول الوحدة 05 لعرض المعيار المرجعي المنطبق.' };
  }
  const std = resolveApplicableStandard(counterpartyType, industryBucket, fidicBook, professionalServicesTrack, logisticsMode);
  if (!std) {
    return { dimension: 'industry', ...label, status: 'attention',
      noteEn: 'An industry bucket is set, but no reference standard could be resolved yet -- a required sub-selection (e.g. FIDIC book) may still be missing.',
      noteAr: 'تم تحديد قطاع الصناعة، إلا أنه لم يتم تحديد معيار مرجعي بعد -- قد يكون هناك اختيار فرعي مطلوب (مثل كتاب FIDIC) لا يزال ناقصاً.' };
  }
  return { dimension: 'industry', ...label, status: 'strong', noteEn: std.standardEn, noteAr: std.standardAr };
}

// --- Assembly ---

export interface ReviewReportInput {
  clausesPresent?: ClausesPresent;
  clauseCategoriesNotApplicable?: ClauseCategoriesNotApplicable;
  counterpartyType?: 'government' | 'private';
  governingLawClause?: GoverningLawTrack;
  counterpartyJurisdiction?: string;
  performanceLocation?: string;
  pricingPrimary?: PricingType;
  scopeDefiniteness?: ScopeDefiniteness;
  pricingHasCapOrMilestones?: boolean;
  startDate?: string;
  endDate?: string;
  industryBucket?: IndustryBucket;
  fidicBook?: FidicBook;
  professionalServicesTrack?: ProfessionalServicesTrack;
  logisticsMode?: LogisticsMode;
}

/**
 * Assembles the full Contract Assurance Chain report for one contract.
 * Pure function over already-tested Module 01/02/04/05 checks -- no new
 * AI calls, no new legal-content risk, no document upload/extraction
 * (that remains Review v2, a genuine T2 infrastructure project per
 * Module 09 Part B.3).
 */
export function buildReviewReport(input: ReviewReportInput): ReviewReport {
  const dimensions: DimensionState[] = [
    legalDimension(input.governingLawClause, input.counterpartyJurisdiction, input.performanceLocation),
    clauseDimension(input.clausesPresent, input.clauseCategoriesNotApplicable),
    pricingDimension(input.pricingPrimary, input.scopeDefiniteness, input.pricingHasCapOrMilestones, input.startDate, input.endDate),
    industryDimension(input.counterpartyType, input.industryBucket, input.fidicBook, input.professionalServicesTrack, input.logisticsMode),
  ];

  const findings: ReviewFinding[] = [
    ...(buildLegalMismatchFinding(input.governingLawClause, input.counterpartyJurisdiction, input.performanceLocation) ? [buildLegalMismatchFinding(input.governingLawClause, input.counterpartyJurisdiction, input.performanceLocation)!] : []),
    ...(buildPricingMisuseFinding(input.pricingPrimary, input.scopeDefiniteness, input.pricingHasCapOrMilestones, input.startDate, input.endDate) ? [buildPricingMisuseFinding(input.pricingPrimary, input.scopeDefiniteness, input.pricingHasCapOrMilestones, input.startDate, input.endDate)!] : []),
    ...buildClauseFindings(input.clausesPresent, input.counterpartyJurisdiction, input.performanceLocation, input.governingLawClause, input.fidicBook, input.industryBucket),
  ];

  return { dimensions, findings };
}
