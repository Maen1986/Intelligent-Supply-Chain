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
  checkGccJordanInterestPermittedFlag, checkQatarInterestLenderFlag,
  checkLiquidatedDamagesGovLawFlag, checkForceMajeureStatutoryDefaultFlag,
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
    checkGccJordanInterestPermittedFlag(clausesPresent, governingLawClause),
    'clause-gcc-jordan-interest-permitted', 'Commercial Interest Is Enforceable Here \u2014 Confirm the Rate', '\u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0625\u0646\u0641\u0627\u0630 \u0647\u0646\u0627 \u2014 \u062a\u0623\u0643\u062f\u0648\u0627 \u0645\u0646 \u0627\u0644\u0645\u0639\u062f\u0644',
    'Module 02 Commercial/Payment category, cross-referenced with Module 01\'s GCC/Jordan governing-law tracks (item 25 research, 29 Aug 2026).',
    '\u0641\u0626\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a/\u0627\u0644\u062f\u0641\u0639 (\u0627\u0644\u0648\u062d\u062f\u0629 02)\u060c \u0628\u0627\u0644\u0631\u0628\u0637 \u0645\u0639 \u0645\u0633\u0627\u0631\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u062d\u0627\u0643\u0645 \u0641\u064a \u062f\u0648\u0644 \u0645\u062c\u0644\u0633 \u0627\u0644\u062a\u0639\u0627\u0648\u0646/\u0627\u0644\u0623\u0631\u062f\u0646 \u0641\u064a \u0627\u0644\u0648\u062d\u062f\u0629 01 (\u0628\u062d\u062b \u0627\u0644\u0628\u0646\u062f 25\u060c 29 \u0623\u063a\u0633\u0637\u0633 2026).',
    [
      { stepEn: 'Underlying cause', stepAr: '\u0627\u0644\u0633\u0628\u0628 \u0627\u0644\u0643\u0627\u0645\u0646',
        textEn: 'The platform\'s original riba flag was built Saudi-only; this jurisdiction was not yet covered, so its different treatment (a statutory commercial-interest carve-out, not a prohibition) was not previously surfaced.',
        textAr: '\u0628\u064f\u0646\u064a \u0645\u0624\u0634\u0631 \u0627\u0644\u0631\u0628\u0627 \u0627\u0644\u0623\u0635\u0644\u064a \u0641\u064a \u0627\u0644\u0645\u0646\u0635\u0629 \u0644\u0644\u0633\u0639\u0648\u062f\u064a\u0629 \u0641\u0642\u0637\u061b \u0648\u0644\u0645 \u062a\u0643\u0646 \u0647\u0630\u0647 \u0627\u0644\u062c\u0647\u0629 \u0645\u063a\u0637\u0627\u0629 \u0633\u0627\u0628\u0642\u0627\u064b\u060c \u0644\u0630\u0644\u0643 \u0644\u0645 \u064a\u0638\u0647\u0631 \u0645\u0639\u0627\u0645\u0644\u062a\u0647\u0627 \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629 (\u0627\u0633\u062a\u062b\u0646\u0627\u0621 \u0642\u0627\u0646\u0648\u0646\u064a \u0644\u0644\u0641\u0627\u0626\u062f\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629\u060c \u0644\u0627 \u062d\u0638\u0631) \u0633\u0627\u0628\u0642\u0627\u064b.' },
      { stepEn: 'Recommended intervention', stepAr: '\u0627\u0644\u062a\u062f\u062e\u0644 \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647',
        textEn: 'Confirm the contract\'s stated interest/late-payment rate does not exceed the jurisdiction\'s statutory ceiling named above. The platform does not yet capture the numeric rate itself for automatic verification.',
        textAr: '\u062a\u0623\u0643\u062f\u0648\u0627 \u0645\u0646 \u0623\u0646 \u0645\u0639\u062f\u0644 \u0627\u0644\u0641\u0627\u0626\u062f\u0629/\u0627\u0644\u062a\u0623\u062e\u064a\u0631 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0641\u064a \u0627\u0644\u0639\u0642\u062f \u0644\u0627 \u064a\u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u0633\u0642\u0641 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0623\u0639\u0644\u0627\u0647. \u0644\u0627 \u062a\u0644\u062a\u0642\u0637 \u0627\u0644\u0645\u0646\u0635\u0629 \u0628\u0639\u062f \u0627\u0644\u0645\u0639\u062f\u0644 \u0627\u0644\u0631\u0642\u0645\u064a \u0646\u0641\u0633\u0647 \u0644\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a.' },
    ],
    'This is an informational advisory, not a compliance risk finding -- interest is legally enforceable in this jurisdiction, unlike Saudi law; the only open question is whether the stated rate sits within the statutory cap.',
    '\u0647\u0630\u0627 \u062a\u0646\u0628\u064a\u0647 \u0645\u0639\u0644\u0648\u0645\u0627\u062a\u064a\u060c \u0648\u0644\u064a\u0633 \u0646\u062a\u064a\u062c\u0629 \u0645\u062e\u0627\u0637\u0631\u0629 \u0627\u0645\u062a\u062b\u0627\u0644 -- \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0625\u0646\u0641\u0627\u0630 \u0642\u0627\u0646\u0648\u0646\u064a\u0627\u064b \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u062c\u0647\u0629\u060c \u062e\u0644\u0627\u0641\u0627\u064b \u0644\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0633\u0639\u0648\u062f\u064a -- \u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u0648\u062d\u064a\u062f \u0647\u0648 \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0645\u0639\u062f\u0644 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u064a\u0642\u0639 \u0636\u0645\u0646 \u0627\u0644\u0633\u0642\u0641 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a.',
  ));

  findings.push(buildClauseFinding(
    checkQatarInterestLenderFlag(clausesPresent, governingLawClause),
    'clause-qatar-interest-lender', 'Interest Clause May Be Void Unless the Lender Is Licensed', '\u0642\u062f \u064a\u0643\u0648\u0646 \u0628\u0646\u062f \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0628\u0627\u0637\u0644\u0627\u064b \u0645\u0627 \u0644\u0645 \u064a\u0643\u0646 \u0627\u0644\u0645\u0642\u0631\u0636 \u0645\u0631\u062e\u0635\u0627\u064b',
    'Module 02 Commercial/Payment category, cross-referenced with Qatar\'s Civil Code Art. 568 and QCB Law Art. 110 (item 25 research, 29 Aug 2026).',
    '\u0641\u0626\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a/\u0627\u0644\u062f\u0641\u0639 (\u0627\u0644\u0648\u062d\u062f\u0629 02)\u060c \u0628\u0627\u0644\u0631\u0628\u0637 \u0645\u0639 \u0627\u0644\u0645\u0627\u062f\u0629 568 \u0645\u0646 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u062f\u0646\u064a \u0627\u0644\u0642\u0637\u0631\u064a \u0648\u0627\u0644\u0645\u0627\u062f\u0629 110 \u0645\u0646 \u0642\u0627\u0646\u0648\u0646 \u0645\u0635\u0631\u0641 \u0642\u0637\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064a (\u0628\u062d\u062b \u0627\u0644\u0628\u0646\u062f 25\u060c 29 \u0623\u063a\u0633\u0637\u0633 2026).',
    [
      { stepEn: 'Underlying cause', stepAr: '\u0627\u0644\u0633\u0628\u0628 \u0627\u0644\u0643\u0627\u0645\u0646',
        textEn: 'Interest-bearing clauses are standard commercial practice and often get drafted without checking whether the specific lending counterparty is a licensed financial institution, which Qatar\'s Civil Code makes decisive.',
        textAr: '\u062a\u064f\u0639\u062f \u0628\u0646\u0648\u062f \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0645\u0645\u0627\u0631\u0633\u0629 \u062a\u062c\u0627\u0631\u064a\u0629 \u0645\u0639\u064a\u0627\u0631\u064a\u0629\u060c \u0648\u063a\u0627\u0644\u0628\u0627\u064b \u0645\u0627 \u062a\u064f\u0635\u0627\u063a \u062f\u0648\u0646 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0645\u0642\u0631\u0636 \u0645\u0624\u0633\u0633\u0629 \u0645\u0627\u0644\u064a\u0629 \u0645\u0631\u062e\u0635\u0629\u060c \u0648\u0647\u0648 \u0645\u0627 \u064a\u062c\u0639\u0644\u0647 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0645\u062f\u0646\u064a \u0627\u0644\u0642\u0637\u0631\u064a \u0639\u0627\u0645\u0644\u0627\u064b \u062d\u0627\u0633\u0645\u0627\u064b.' },
      { stepEn: 'Exposure', stepAr: '\u0627\u0644\u062a\u0639\u0631\u0636 \u0644\u0644\u0645\u062e\u0627\u0637\u0631',
        textEn: 'If the lender is not a licensed institution, the interest term itself is void under Qatari law -- the party expecting to charge or receive interest may find that remedy unenforceable, even though the rest of the contract stands.',
        textAr: '\u0625\u0630\u0627 \u0644\u0645 \u064a\u0643\u0646 \u0627\u0644\u0645\u0642\u0631\u0636 \u0645\u0624\u0633\u0633\u0629 \u0645\u0631\u062e\u0635\u0629\u060c \u064a\u0643\u0648\u0646 \u0628\u0646\u062f \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0646\u0641\u0633\u0647 \u0628\u0627\u0637\u0644\u0627\u064b \u0628\u0645\u0648\u062c\u0628 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0642\u0637\u0631\u064a -- \u0648\u0642\u062f \u064a\u062c\u062f \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0630\u064a \u064a\u062a\u0648\u0642\u0639 \u0641\u0631\u0636 \u0623\u0648 \u062a\u062d\u0635\u064a\u0644 \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0623\u0646 \u0647\u0630\u0627 \u0627\u0644\u0639\u0644\u0627\u062c \u063a\u064a\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0625\u0646\u0641\u0627\u0630\u060c \u0631\u063a\u0645 \u0628\u0642\u0627\u0621 \u0628\u0642\u064a\u0629 \u0627\u0644\u0639\u0642\u062f \u0646\u0627\u0641\u0630\u0627\u064b.' },
      { stepEn: 'Recommended intervention', stepAr: '\u0627\u0644\u062a\u062f\u062e\u0644 \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647',
        textEn: 'Confirm and document the lending counterparty\'s status as a QCB-licensed financial institution before relying on the interest clause; if not licensed, consider a liquidated-damages alternative instead.',
        textAr: '\u062a\u0623\u0643\u062f\u0648\u0627 \u0645\u0646 \u0635\u0641\u0629 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0645\u0642\u0631\u0636 \u0628\u0648\u0635\u0641\u0647 \u0645\u0624\u0633\u0633\u0629 \u0645\u0627\u0644\u064a\u0629 \u0645\u0631\u062e\u0635\u0629 \u0645\u0646 \u0645\u0635\u0631\u0641 \u0642\u0637\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064a \u0648\u0648\u062b\u0642\u0648\u0627 \u0630\u0644\u0643 \u0642\u0628\u0644 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u0639\u0644\u0649 \u0628\u0646\u062f \u0627\u0644\u0641\u0627\u0626\u062f\u0629\u061b \u0648\u0625\u0630\u0627 \u0644\u0645 \u064a\u0643\u0646 \u0645\u0631\u062e\u0635\u0627\u064b\u060c \u0641\u0643\u0631\u0648\u0627 \u0641\u064a \u0628\u062f\u064a\u0644 \u062a\u0639\u0648\u064a\u0636 \u0645\u0642\u0637\u0648\u0639 \u0628\u062f\u0644\u0627\u064b \u0645\u0646\u0647.' },
    ],
    'This is a real, sourced enforceability risk under Qatari law, not a certainty -- some contracts route lending through a licensed affiliate specifically to avoid this issue, which this checklist cannot see.',
    '\u0647\u0630\u0647 \u0645\u062e\u0627\u0637\u0631\u0629 \u062d\u0642\u064a\u0642\u064a\u0629 \u0648\u0645\u0648\u062b\u0642\u0629 \u0644\u0642\u0627\u0628\u0644\u064a\u0629 \u0627\u0644\u0625\u0646\u0641\u0627\u0630 \u0628\u0645\u0648\u062c\u0628 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0642\u0637\u0631\u064a\u060c \u0644\u0627 \u064a\u0642\u064a\u0646 \u0645\u0637\u0644\u0642 -- \u0641\u0642\u062f \u062a\u0648\u062c\u0651\u0647 \u0628\u0639\u0636 \u0627\u0644\u0639\u0642\u0648\u062f \u0627\u0644\u0625\u0642\u0631\u0627\u0636 \u0639\u0628\u0631 \u062c\u0647\u0629 \u0645\u0631\u062e\u0635\u0629 \u062a\u0627\u0628\u0639\u0629 \u062e\u0635\u064a\u0635\u0627\u064b \u0644\u062a\u062c\u0646\u0628 \u0647\u0630\u0647 \u0627\u0644\u0645\u0634\u0643\u0644\u0629\u060c \u0648\u0647\u0648 \u0645\u0627 \u0644\u0627 \u062a\u0631\u0627\u0647 \u0647\u0630\u0647 \u0627\u0644\u0642\u0627\u0626\u0645\u0629.',
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
    checkLiquidatedDamagesGovLawFlag(clausesPresent, governingLawClause),
    'clause-liquidated-damages-gov-law', 'Liquidated-Damages Enforceability Depends on the Governing Law You Chose', 'قابلية إنفاذ التعويض المقطوع تعتمد على القانون الحاكم الذي اخترتموه',
    'Module 02 Risk Allocation category, cross-referenced with Module 01\'s governing-law tracks (#399 harmonization scoping, 28-30 Aug 2026).',
    'فئة توزيع المخاطر (الوحدة 02)، بالربط مع مسارات القانون الحاكم في الوحدة 01 (نطاق التوحيد #399، 28-30 أغسطس 2026).',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Liquidated-damages clause text is usually drafted once and reused across contracts under different governing laws, without checking whether the same wording carries the same real-world enforceability everywhere it is used.',
        textAr: 'عادةً ما تُصاغ نصوص بند التعويض المقطوع مرة واحدة وتُعاد استخدامها في عقود تخضع لقوانين حاكمة مختلفة، دون التحقق مما إذا كانت الصياغة ذاتها تحمل نفس قابلية الإنفاذ الفعلية أينما استُخدمت.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'If the governing law gives courts a mandatory power to revisit the agreed figure (or, conversely, gives it strong contractual-freedom protection), a party relying on the clause without knowing which regime applies may be surprised by the real-world outcome if a dispute arises.',
        textAr: 'إذا كان القانون الحاكم يمنح المحاكم سلطة إلزامية لإعادة النظر في المبلغ المتفق عليه (أو، على العكس، يمنحه حماية قوية لحرية التعاقد)، فقد يُفاجأ الطرف المعتمد على البند دون معرفة النظام المعمول به بالنتيجة الفعلية في حال نشوء نزاع.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Confirm with legal counsel how the selected governing law actually treats liquidated-damages enforceability, and consider whether the agreed figure and its justification (a genuine pre-estimate of loss, not a penalty) should be documented more explicitly for this specific jurisdiction.',
        textAr: 'تأكدوا مع المستشار القانوني من كيفية تعامل القانون الحاكم المختار فعلياً مع قابلية إنفاذ التعويض المقطوع، وضعوا في الاعتبار ما إذا كان ينبغي توثيق المبلغ المتفق عليه ومبرراته (كونه تقديراً حقيقياً مسبقاً للخسارة، لا غرامة) بشكل أكثر وضوحاً لهذه الولاية القضائية تحديداً.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'Knowing which enforceability regime applies lets both parties negotiate a figure that is more likely to survive a dispute, rather than discovering the gap only after one arises.',
        textAr: 'تتيح معرفة نظام قابلية الإنفاذ المعمول به للطرفين التفاوض على مبلغ أكثر قابلية للصمود أمام نزاع، بدلاً من اكتشاف الفجوة بعد نشوئه فقط.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Treat liquidated-damages enforceability as a governing-law-specific check on every contract template, not a one-time drafting decision reused everywhere.',
        textAr: 'اعتبروا قابلية إنفاذ التعويض المقطوع فحصاً خاصاً بكل قانون حاكم على كل نموذج عقد، لا قراراً صياغياً لمرة واحدة يُعاد استخدامه في كل مكان.' },
    ],
    'This is a real, sourced difference in legal treatment, not a certainty of outcome either way -- courts weigh the specific facts, and sophisticated drafters sometimes structure the figure deliberately to survive scrutiny under the applicable regime. Confirm before assuming either an automatic reduction or automatic enforcement.',
    'هذا فرق حقيقي وموثق في المعاملة القانونية، وليس يقيناً بنتيجة معينة في أي الاتجاهين -- إذ تزن المحاكم الوقائع المحددة، وقد يصوغ بعض المحررين المتمرسين المبلغ عمداً بحيث يصمد أمام الفحص بموجب النظام المعمول به. تأكدوا قبل افتراض خفض تلقائي أو إنفاذ تلقائي.',
    variantsFor('risk-allocation', 'liquidated-damages-delay-penalties'),
  ));

  findings.push(buildClauseFinding(
    checkForceMajeureStatutoryDefaultFlag(clausesPresent, governingLawClause),
    'clause-force-majeure-statutory-default', 'Force-Majeure Protection Depends on Whether Your Governing Law Provides a Default', 'تعتمد حماية القوة القاهرة على ما إذا كان القانون الحاكم يوفر قاعدة افتراضية',
    'Module 02 Risk Allocation category, cross-referenced with Module 01\'s governing-law tracks (#399 harmonization scoping, 28-30 Aug 2026).',
    'فئة توزيع المخاطر (الوحدة 02)، بالربط مع مسارات القانون الحاكم في الوحدة 01 (نطاق التوحيد #399، 28-30 أغسطس 2026).',
    [
      { stepEn: 'Underlying cause', stepAr: 'السبب الكامن',
        textEn: 'Force-majeure clauses are sometimes left out of shorter or lower-value contracts on the assumption that "something like it" would apply anyway if a genuine disruption occurred -- an assumption that is only true in some governing-law regimes.',
        textAr: 'يُترك بند القوة القاهرة أحياناً خارج العقود الأقصر أو الأقل قيمة على افتراض أن "شيئاً مشابهاً" سينطبق على أي حال في حال وقوع اضطراب حقيقي -- وهو افتراض صحيح فقط في بعض أنظمة القانون الحاكم.' },
      { stepEn: 'Exposure', stepAr: 'التعرض للمخاطر',
        textEn: 'In a governing-law regime with no general force-majeure doctrine, the absence of a clause means no protection exists at all if performance is disrupted by an event outside either party\'s control -- only narrower, harder-to-invoke fallback doctrines remain.',
        textAr: 'في نظام قانوني حاكم لا يعرف مبدأً عاماً للقوة القاهرة، يعني غياب البند عدم وجود أي حماية على الإطلاق إذا تعطل التنفيذ بسبب حدث خارج عن سيطرة أي من الطرفين -- ولا تبقى سوى مبادئ احتياطية أضيق يصعب الاحتجاج بها.' },
      { stepEn: 'Recommended intervention', stepAr: 'التدخل الموصى به',
        textEn: 'Add an explicit force-majeure clause -- especially on a common-law-governed contract -- rather than relying on an assumed default that may not exist under the selected governing law.',
        textAr: 'أضيفوا بنداً صريحاً للقوة القاهرة -- خاصة في العقود الخاضعة لقانون عام (كومن لو) -- بدلاً من الاعتماد على قاعدة افتراضية مفترَضة قد لا توجد بموجب القانون الحاكم المختار.' },
      { stepEn: 'Expected outcome', stepAr: 'النتيجة المتوقعة',
        textEn: 'An explicit, well-scoped force-majeure clause gives both parties predictable protection regardless of which governing law ends up applying.',
        textAr: 'يمنح بند القوة القاهرة الصريح والمحدد النطاق جيداً الطرفين حماية قابلة للتنبؤ بصرف النظر عن القانون الحاكم الذي سيُطبَّق في النهاية.' },
      { stepEn: 'How to prevent recurrence', stepAr: 'كيفية منع التكرار',
        textEn: 'Make force-majeure inclusion a standard checklist item for every contract template, cross-checked against the selected governing law rather than assumed universal.',
        textAr: 'اجعلوا إدراج بند القوة القاهرة عنصراً معيارياً في قائمة كل نموذج عقد، مع التحقق المتقاطع مع القانون الحاكم المختار بدلاً من افتراض شموليته.' },
    ],
    'A missing clause is not automatically a gap under every governing law -- civil-law jurisdictions in this tradition provide a statutory default that may already offer real protection, so this is a genuine reason to confirm with counsel before drafting new language, not an automatic recommendation to add a clause everywhere.',
    'لا يُعد غياب البند فجوة تلقائية بموجب كل قانون حاكم -- إذ توفر الأنظمة القانونية المدنية ضمن هذا التقليد قاعدة افتراضية قانونية قد تقدم بالفعل حماية حقيقية، لذا فهذا سبب حقيقي للتأكد مع المستشار القانوني قبل صياغة نص جديد، وليس توصية تلقائية بإضافة بند في كل مكان.',
    variantsFor('risk-allocation', 'force-majeure'),
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
