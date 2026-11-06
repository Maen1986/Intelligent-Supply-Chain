/**
 * SI Module 02 extension -- Kraljic sub-types, situations and migration alerts
 * (Round B4, Nov 2026).
 *
 * WHY: Kraljic gives four boxes and one general instruction per box. A client
 * with thirty Bottleneck suppliers gets the same advice for all thirty. A
 * sub-type exists here ONLY if it changes what the buyer does. Each is decided
 * by plain facts the caller supplies; when a decisive fact is missing the
 * answer is 'unclassified' with the list of missing facts -- never a guess
 * (Decision Record 8.7).
 *
 * TWO LAYERS, KEPT APART ON PURPOSE:
 *  - SOURCED (industry standard): hold-or-move logic per quadrant (Gelderman &
 *    van Weele, 2003, Journal of Purchasing & Supply Management); exploit /
 *    balance / diversify for strategic items (Kraljic, 1983, HBR); the move
 *    triggers (loosening a specification, supplier development, pooling
 *    demand, supplier non-performance, lock-in).
 *  - ISC CONVENTION (our own structure, labelled in every output): the
 *    sub-type names, the 'situational' bottleneck, the stable/volatile split of
 *    Leverage, review intervals and migration thresholds. No published source
 *    splits a quadrant by time horizon or by fixed/dynamic market.
 *
 * STANDALONE-FIRST (SI-00 Charter): no runtime imports from sibling modules.
 * Every cross-module fact (recurrence from M07, HHI band from M05, prior
 * quadrant) is caller-supplied plain data. Links to M03/M04/M05/M06/M07 are
 * returned as data, not calls.
 */

export type Bilingual = { en: string; ar: string };
export type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

export type SubtypeKey =
  | 'bottleneck-movable'
  | 'bottleneck-locked'
  | 'bottleneck-situational'
  | 'leverage-stable'
  | 'leverage-volatile'
  | 'noncritical-pool'
  | 'noncritical-process'
  | 'strategic-exploit'
  | 'strategic-balance'
  | 'strategic-diversify'
  | 'unclassified';

export type Basis = 'sourced' | 'isc-convention';

export type ConstraintCause =
  | 'regulated-licensed'
  | 'proprietary-ip'
  | 'scarce-resource'
  | 'geographic-political'
  | 'small-volume-deprioritised'
  | 'specification-driven'
  | 'temporary-shortage'
  | 'none';

export interface SubtypeFacts {
  /** Number of QUALIFIED alternative suppliers today (0 = none). null/undefined = not known. */
  qualifiedAlternatives?: number | null;
  constraintCause?: ConstraintCause | null;
  /** Could the specification be loosened or the item decomplexed? */
  specLoosenable?: boolean | null;
  /** Is the constraint a temporary shortage rather than structural? */
  temporaryShortage?: boolean | null;
  marketVolatility?: 'stable' | 'volatile' | null;
  poolableAcrossSites?: boolean | null;
  powerBalance?: 'buyer' | 'balanced' | 'supplier' | null;
  contingencyInPlace?: boolean | null;
  /** Strategic only: dependence forced by patent, monopoly or switching cost rather than chosen. Optional. */
  lockIn?: boolean | null;
  /** Non-critical only: low spend but a stoppage would halt operations. Optional. */
  operationalStopRisk?: boolean | null;
}

export type HhiBand = 'competitive' | 'moderatelyConcentrated' | 'highlyConcentrated';

export interface SubtypeSupplierInput {
  supplierId: string;
  name: string;
  quadrant: Quadrant;
  quadrantPriorQuarter?: Quadrant | null;
  annualSpendSAR?: number | null;
  facts?: SubtypeFacts;
  /** From M07, caller-supplied. */
  recurrenceCount?: number | null;
  /** From M05, caller-supplied. */
  hhiBand?: HhiBand | null;
}

export interface ModuleLink {
  module: 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08';
  built: boolean;
  purposeEn: string;
  purposeAr: string;
}

export interface SubtypeDef {
  key: SubtypeKey;
  quadrant: Quadrant | null;
  label: Bilingual;
  meaning: Bilingual;
  basis: Basis;
  source: Bilingual;
  primary: Bilingual;
  alternative: Bilingual;
  tradeoff: Bilingual;
  reviewDays: number;
}

const GW: Bilingual = {
  en: 'Gelderman & van Weele (2003), Journal of Purchasing & Supply Management: hold-or-move strategies per quadrant.',
  ar: 'Gelderman & van Weele (2003)، Journal of Purchasing & Supply Management: استراتيجيات «الإبقاء أو الانتقال» لكل ربع.',
};
const KR: Bilingual = {
  en: 'Kraljic (1983), Harvard Business Review, "Purchasing Must Become Supply Management".',
  ar: 'Kraljic (1983)، Harvard Business Review، «Purchasing Must Become Supply Management».',
};
const ISC: Bilingual = {
  en: 'ISC method: an extension built by ISC on the cited foundations (Kraljic 1983; Gelderman & van Weele 2003). The rule is shown in full and can be calibrated to your business.',
  ar: 'منهجية ISC: امتداد بنته آي سبلاي تشين على الأسس المذكورة (Kraljic 1983؛ Gelderman & van Weele 2003). القاعدة معروضة كاملة ويمكن معايرتها لتناسب عملك.',
};

export const REVIEW_INTERVAL_NOTE: Bilingual = {
  en: 'Review intervals are ISC defaults, not an external standard. Override them per client.',
  ar: 'فترات المراجعة قيم افتراضية من آي سبلاي تشين وليست معيارًا خارجيًا. يمكن تغييرها لكل عميل.',
};

export const SUBTYPES: Record<SubtypeKey, SubtypeDef> = {
  'bottleneck-movable': {
    key: 'bottleneck-movable', quadrant: 'bottleneck',
    label: { en: 'Bottleneck - movable', ar: 'اختناق يمكن تجاوزه' },
    meaning: { en: 'Few suppliers today, but an alternative exists or the specification can change.', ar: 'موردون قليلون اليوم، لكن يوجد بديل أو يمكن تعديل المواصفة.' },
    basis: 'sourced', source: GW,
    primary: { en: 'Move it out of the box: qualify a second source or simplify the specification, with a named owner and a date.', ar: 'أخرجه من هذا الربع: أهّل مصدرًا ثانيًا أو بسّط المواصفة، مع مسؤول محدد وتاريخ.' },
    alternative: { en: 'Hold it: keep the incumbent and add buffer stock and a longer contract.', ar: 'أبقِه كما هو: ابقَ مع المورد الحالي وأضف مخزونًا احتياطيًا وعقدًا أطول.' },
    tradeoff: { en: 'Moving removes the premium you pay for security but costs qualification effort. Holding is faster but keeps the dependence.', ar: 'الانتقال يلغي العلاوة التي تدفعها مقابل الأمان لكنه يكلّف جهد التأهيل. الإبقاء أسرع لكنه يُبقي الاعتماد.' },
    reviewDays: 60,
  },
  'bottleneck-locked': {
    key: 'bottleneck-locked', quadrant: 'bottleneck',
    label: { en: 'Bottleneck - locked', ar: 'اختناق مقيَّد (لا بديل)' },
    meaning: { en: 'No qualified alternative and the specification cannot change (regulated, proprietary, scarce or single-source).', ar: 'لا بديل مؤهَّل ولا يمكن تغيير المواصفة (منظَّم أو ملكية فكرية أو نادر أو مصدر وحيد).' },
    basis: 'sourced', source: GW,
    primary: { en: 'Hold and secure supply: contingency plan, buffer stock or consignment, and a long-term contract with service credits and persistent-breach remedies.', ar: 'أبقِه وأمّن الإمداد: خطة طوارئ ومخزون احتياطي أو توريد بالأمانة وعقد طويل الأجل مع تعويضات خدمة وعلاجات للإخلال المتكرر.' },
    alternative: { en: 'Start a long-horizon search for a substitute or a second licensed source.', ar: 'ابدأ بحثًا طويل الأمد عن بديل أو مصدر مرخّص ثانٍ.' },
    tradeoff: { en: 'Securing supply protects you now but never reduces the dependence. A long search may fail and costs effort, so run it alongside, not instead.', ar: 'تأمين الإمداد يحميك الآن لكنه لا يقلّل الاعتماد. قد يفشل البحث الطويل ويكلّف جهدًا، لذا نفّذه بالتوازي لا بديلًا.' },
    reviewDays: 90,
  },
  'bottleneck-situational': {
    key: 'bottleneck-situational', quadrant: 'bottleneck',
    label: { en: 'Bottleneck - situational', ar: 'اختناق ظرفي (مؤقت)' },
    meaning: { en: 'A temporary shortage; the market is expected to recover.', ar: 'نقص مؤقت يُتوقع أن يزول مع تعافي السوق.' },
    basis: 'isc-convention', source: ISC,
    primary: { en: 'Bridge it: spot buy or temporary stock with an expiry date. Do not sign long commitments for a short problem.', ar: 'غطِّ الفجوة مؤقتًا: شراء فوري أو مخزون مؤقت بتاريخ انتهاء. لا توقّع التزامات طويلة لمشكلة قصيرة.' },
    alternative: { en: 'Pre-qualify a backup supplier so the next shortage is not a crisis.', ar: 'أهّل موردًا احتياطيًا مسبقًا كي لا يتحول النقص القادم إلى أزمة.' },
    tradeoff: { en: 'Bridging is cheap but can be mistaken for a fix. Pre-qualifying costs effort now and pays off only if the shortage repeats.', ar: 'التغطية المؤقتة رخيصة لكن قد تُعدّ حلًا دائمًا. التأهيل المسبق يكلّف جهدًا الآن ولا يفيد إلا إن تكرر النقص.' },
    reviewDays: 30,
  },
  'leverage-stable': {
    key: 'leverage-stable', quadrant: 'leverage',
    label: { en: 'Leverage - stable market', ar: 'نفوذ شرائي - سوق مستقر' },
    meaning: { en: 'High spend, many suppliers, steady prices.', ar: 'إنفاق مرتفع وموردون كثر وأسعار مستقرة.' },
    basis: 'sourced', source: KR,
    primary: { en: 'Exploit purchasing power: competitive tender, target pricing, volume bundling.', ar: 'استغل القوة الشرائية: مناقصة تنافسية وسعر مستهدف وتجميع الكميات.' },
    alternative: { en: 'Switch to a short preferred-supplier arrangement for service and speed.', ar: 'انتقل إلى ترتيب مورد مفضّل قصير الأجل للخدمة والسرعة.' },
    tradeoff: { en: 'Tendering gets the best price but costs effort and may churn suppliers. A preferred arrangement saves effort but gives up some price pressure.', ar: 'المناقصة تحقق أفضل سعر لكنها تكلّف جهدًا وقد تغيّر الموردين. المورد المفضّل يوفّر الجهد لكنه يتخلى عن بعض ضغط السعر.' },
    reviewDays: 90,
  },
  'leverage-volatile': {
    key: 'leverage-volatile', quadrant: 'leverage',
    label: { en: 'Leverage - volatile market', ar: 'نفوذ شرائي - سوق متقلب' },
    meaning: { en: 'High spend, many suppliers, but prices swing.', ar: 'إنفاق مرتفع وموردون كثر لكن الأسعار متقلبة.' },
    basis: 'isc-convention', source: { en: 'ISC method. Index-linked and price-adjustment clauses are a growing practice for commodity price risk (SDA Bocconi, 2025); ISC turns this into a clear Leverage sub-type with its own playbook.', ar: 'منهجية آي سبلاي تشين. بنود الربط بمؤشر وتعديل السعر ممارسة متنامية لمخاطر أسعار السلع (SDA Bocconi، 2025)؛ وتحوّلها آي سبلاي تشين إلى نوع فرعي واضح في ربع النفوذ له دليل عمل خاص.' },
    primary: { en: 'Replace a fixed price with an index-linked or price-adjustment clause, and tender on the margin over the index.', ar: 'استبدل السعر الثابت ببند مرتبط بمؤشر أو بند تعديل سعر، واطرح المناقصة على الهامش فوق المؤشر.' },
    alternative: { en: 'Keep a fixed price for a short term and accept that the supplier will price in the risk.', ar: 'أبقِ سعرًا ثابتًا لمدة قصيرة وتقبّل أن المورد سيسعّر المخاطرة.' },
    tradeoff: { en: 'An index clause shares the swing fairly but makes budgets less certain. A fixed price gives certainty at a built-in premium.', ar: 'بند المؤشر يتقاسم التقلب بإنصاف لكنه يقلّل يقين الميزانية. السعر الثابت يمنح اليقين بعلاوة مضمّنة.' },
    reviewDays: 30,
  },
  'noncritical-pool': {
    key: 'noncritical-pool', quadrant: 'non-critical',
    label: { en: 'Non-critical - poolable', ar: 'غير حرج - قابل للتجميع' },
    meaning: { en: 'Low value each, but the demand can be combined across sites or categories.', ar: 'قيمة منخفضة لكل بند، لكن يمكن تجميع الطلب عبر المواقع أو الفئات.' },
    basis: 'sourced', source: GW,
    primary: { en: 'Pool the demand: framework agreement, systems contract or vendor-managed inventory. This moves it toward Leverage.', ar: 'جمّع الطلب: اتفاقية إطارية أو عقد نظامي أو مخزون مدار من المورد. هذا ينقله نحو ربع النفوذ.' },
    alternative: { en: 'Leave it with local buyers and cap the effort with a catalogue.', ar: 'اتركه للمشترين المحليين وقلّل الجهد بكتالوج.' },
    tradeoff: { en: 'Pooling saves money but needs agreement across sites. Leaving it local avoids that but keeps prices scattered.', ar: 'التجميع يوفّر المال لكنه يحتاج اتفاقًا بين المواقع. تركه محليًا يتجنب ذلك لكنه يُبقي الأسعار مبعثرة.' },
    reviewDays: 180,
  },
  'noncritical-process': {
    key: 'noncritical-process', quadrant: 'non-critical',
    label: { en: 'Non-critical - simple process', ar: 'غير حرج - معالجة مبسّطة' },
    meaning: { en: 'Low value and not worth combining.', ar: 'قيمة منخفضة ولا يستحق التجميع.' },
    basis: 'sourced', source: GW,
    primary: { en: 'Cut effort: purchase card or catalogue, individual ordering, no tender.', ar: 'قلّل الجهد: بطاقة شراء أو كتالوج وطلب فردي بلا مناقصة.' },
    alternative: { en: 'Hand it to a distributor who manages the whole range.', ar: 'سلّمه لموزّع يدير النطاق بالكامل.' },
    tradeoff: { en: 'A purchase card is quickest but loosens control. A distributor gives control and one invoice at a margin.', ar: 'بطاقة الشراء أسرع لكنها تُضعف الرقابة. الموزّع يمنح الرقابة وفاتورة واحدة مقابل هامش.' },
    reviewDays: 365,
  },
  'strategic-exploit': {
    key: 'strategic-exploit', quadrant: 'strategic',
    label: { en: 'Strategic - buyer holds the power', ar: 'استراتيجي - القوة بيد المشتري' },
    meaning: { en: 'Critical item, but the buyer is the stronger party.', ar: 'بند حرج لكن المشتري هو الطرف الأقوى.' },
    basis: 'sourced', source: KR,
    primary: { en: 'Exploit the position: push for better terms and shared-benefit clauses while the power lasts.', ar: 'استثمر الموقع: اطلب شروطًا أفضل وبنود تقاسم المنافع ما دامت القوة قائمة.' },
    alternative: { en: 'Use the strength to build a partnership with joint improvement targets.', ar: 'استخدم القوة لبناء شراكة بأهداف تحسين مشتركة.' },
    tradeoff: { en: 'Pressing gains short-term value but can sour a critical relationship. A partnership is slower but safer.', ar: 'الضغط يحقق قيمة قصيرة الأجل لكنه قد يفسد علاقة حرجة. الشراكة أبطأ وأكثر أمانًا.' },
    reviewDays: 90,
  },
  'strategic-balance': {
    key: 'strategic-balance', quadrant: 'strategic',
    label: { en: 'Strategic - balanced power', ar: 'استراتيجي - توازن القوى' },
    meaning: { en: 'Critical item and both sides depend on each other.', ar: 'بند حرج والطرفان يعتمد كل منهما على الآخر.' },
    basis: 'sourced', source: KR,
    primary: { en: 'Balance: a performance-based partnership with shared targets, open review and joint risk plans.', ar: 'وازن: شراكة قائمة على الأداء بأهداف مشتركة ومراجعة مفتوحة وخطط مخاطر مشتركة.' },
    alternative: { en: 'Keep arm\'s-length terms with strong remedies and a watchful review.', ar: 'ابقَ على شروط مستقلة بعلاجات قوية ومراجعة يقظة.' },
    tradeoff: { en: 'Partnership builds shared commitment but needs trust and time. Arm\'s length is simpler but invites less cooperation.', ar: 'الشراكة تبني التزامًا مشتركًا لكنها تحتاج ثقة ووقتًا. الاستقلالية أبسط لكنها تستدعي تعاونًا أقل.' },
    reviewDays: 90,
  },
  'strategic-diversify': {
    key: 'strategic-diversify', quadrant: 'strategic',
    label: { en: 'Strategic - supplier holds the power', ar: 'استراتيجي - القوة بيد المورد' },
    meaning: { en: 'Critical item and the supplier is the stronger party.', ar: 'بند حرج والمورد هو الطرف الأقوى.' },
    basis: 'sourced', source: KR,
    primary: { en: 'Diversify: reduce dependence step by step with a second source, own capability or a substitute.', ar: 'نوّع: قلّل الاعتماد تدريجيًا بمصدر ثانٍ أو قدرة ذاتية أو بديل.' },
    alternative: { en: 'Lock in supply now with a long contract while you build alternatives.', ar: 'ثبّت الإمداد الآن بعقد طويل أثناء بناء البدائل.' },
    tradeoff: { en: 'Diversifying lowers future risk at a cost today. A long contract buys calm but can deepen the dependence.', ar: 'التنويع يخفض مخاطر المستقبل بتكلفة اليوم. العقد الطويل يشتري الهدوء لكنه قد يعمّق الاعتماد.' },
    reviewDays: 90,
  },
  unclassified: {
    key: 'unclassified', quadrant: null,
    label: { en: 'Ready to classify', ar: 'جاهز للتصنيف' },
    meaning: { en: 'One quick answer is needed to place this supplier. ISC asks rather than assumes.', ar: 'يلزم جواب سريع واحد لتصنيف هذا المورد. تسأل آي سبلاي تشين ولا تفترض.' },
    basis: 'isc-convention', source: ISC,
    primary: { en: 'Answer the highlighted question below and the supplier-specific plan appears.', ar: 'أجب عن السؤال المظلَّل أدناه وستظهر الخطة الخاصة بهذا المورد.' },
    alternative: { en: 'Use the general quadrant guidance in the meantime.', ar: 'استخدم إرشاد الربع العام في الأثناء.' },
    tradeoff: { en: 'A quick answer unlocks a plan specific to this supplier; the general guidance is available now.', ar: 'الجواب السريع يفتح خطة خاصة بهذا المورد؛ والإرشاد العام متاح الآن.' },
    reviewDays: 14,
  },
};

// ---------------------------------------------------------------------------
// 1. Classification -- decided by facts, never guessed
// ---------------------------------------------------------------------------

export type FactKey = keyof SubtypeFacts;

export interface SubtypeResult {
  supplierId: string;
  name: string;
  quadrant: Quadrant;
  subtype: SubtypeKey;
  def: SubtypeDef;
  whyEn: string;
  whyAr: string;
  missingFacts: FactKey[];
  reviewDays: number;
}

function res(s: SubtypeSupplierInput, key: SubtypeKey, whyEn: string, whyAr: string, missing: FactKey[] = []): SubtypeResult {
  const def = SUBTYPES[key];
  return { supplierId: s.supplierId, name: s.name, quadrant: s.quadrant, subtype: key, def, whyEn, whyAr, missingFacts: missing, reviewDays: def.reviewDays };
}

/** Plain-language name of each deciding fact (never show a code key to a user). */
export const FACT_LABEL: Record<FactKey, Bilingual> = {
  qualifiedAlternatives: { en: 'number of qualified alternative suppliers', ar: 'عدد الموردين البدلاء المؤهَّلين' },
  constraintCause: { en: 'cause of the constraint', ar: 'سبب القيد' },
  specLoosenable: { en: 'whether the specification can loosen', ar: 'إمكانية تخفيف المواصفة' },
  temporaryShortage: { en: 'whether the shortage is temporary', ar: 'هل النقص مؤقت' },
  marketVolatility: { en: 'supply-market volatility', ar: 'تقلب سوق التوريد' },
  poolableAcrossSites: { en: 'whether demand can be combined', ar: 'إمكانية تجميع الطلب' },
  powerBalance: { en: 'who holds the power', ar: 'من يملك القوة' },
  contingencyInPlace: { en: 'whether a contingency plan is on record', ar: 'وجود خطة طوارئ موثّقة' },
  lockIn: { en: 'whether the dependence is forced (patent, monopoly, switching cost)', ar: 'هل الاعتماد مفروض (براءة، احتكار، تكلفة تحويل)' },
  operationalStopRisk: { en: 'whether a stoppage would halt operations', ar: 'هل يوقف الانقطاع التشغيل' },
};

function unclassified(s: SubtypeSupplierInput, missing: FactKey[]): SubtypeResult {
  return res(
    s, 'unclassified',
    `One quick answer needed: ${missing.map((k) => FACT_LABEL[k].en).join('; ')}.`,
    `يلزم جواب سريع: ${missing.map((k) => FACT_LABEL[k].ar).join('؛ ')}.`,
    missing,
  );
}

const CAUSE_LABEL: Record<ConstraintCause, Bilingual> = {
  'regulated-licensed': { en: 'regulated or licensed', ar: 'منظَّم أو مرخَّص' },
  'proprietary-ip': { en: 'proprietary or IP', ar: 'ملكية فكرية' },
  'scarce-resource': { en: 'scarce resource', ar: 'مورد نادر' },
  'geographic-political': { en: 'geographic or political', ar: 'جغرافي أو سياسي' },
  'small-volume-deprioritised': { en: 'small volume, deprioritised', ar: 'كمية صغيرة لا تحظى بأولوية' },
  'specification-driven': { en: 'specification-driven', ar: 'مفروض بالمواصفة' },
  'temporary-shortage': { en: 'temporary shortage', ar: 'نقص مؤقت' },
  none: { en: 'none', ar: 'لا يوجد' },
};

// ---------------------------------------------------------------------------
// Input hygiene (Round C #668). The Suppliers-tab data round-trips through localStorage and the
// server as JSON of ANY shape. A stale schema or a hand-edited save used to crash classifySubtype
// (unknown quadrant -> undefined, unknown cause -> CAUSE_LABEL[x].en) or print "Infinity qualified
// alternative(s)". Anything that is not exactly a documented value is treated as NOT KNOWN, so the
// engine asks for it instead of guessing (Decision Record 8.7).
// ---------------------------------------------------------------------------
const QUADRANTS: readonly Quadrant[] = ['strategic', 'leverage', 'bottleneck', 'non-critical'];
export function isQuadrant(v: unknown): v is Quadrant {
  return typeof v === 'string' && (QUADRANTS as readonly string[]).includes(v);
}
const bool = (v: unknown): boolean | null => (v === true ? true : v === false ? false : null);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
/** A count is a whole number 0..100000, otherwise it is not known. */
export function cleanCount(v: unknown): number {
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 100000 ? v : 0;
}
/** Spend is a finite positive SAR amount up to 1e15 (1 quadrillion); anything else is not known.
 * The cap keeps portfolio sums finite: two 1e308 rows used to overflow to Infinity. */
export function cleanSpend(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1e15 ? v : null;
}
export function cleanFacts(raw: unknown): SubtypeFacts {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const f = raw as Record<string, unknown>;
  const alt = f.qualifiedAlternatives;
  return {
    qualifiedAlternatives: typeof alt === 'number' && Number.isSafeInteger(alt) && alt >= 0 && alt <= 100000 ? alt : null,
    constraintCause: oneOf<ConstraintCause>(f.constraintCause, Object.keys(CAUSE_LABEL) as ConstraintCause[]),
    specLoosenable: bool(f.specLoosenable),
    temporaryShortage: bool(f.temporaryShortage),
    marketVolatility: oneOf(f.marketVolatility, ['stable', 'volatile'] as const),
    poolableAcrossSites: bool(f.poolableAcrossSites),
    powerBalance: oneOf(f.powerBalance, ['buyer', 'balanced', 'supplier'] as const),
    contingencyInPlace: bool(f.contingencyInPlace),
    lockIn: bool(f.lockIn),
    operationalStopRisk: bool(f.operationalStopRisk),
  };
}

export function classifySubtype(s: SubtypeSupplierInput): SubtypeResult {
  const f = cleanFacts(s.facts);
  if (!isQuadrant(s.quadrant)) {
    return res({ ...s, quadrant: 'non-critical' }, 'unclassified',
      'The Kraljic quadrant is missing or not recognised; set the quadrant first.',
      'ربع كراجليك مفقود أو غير معروف؛ حدّد الربع أولاً.');
  }
  switch (s.quadrant) {
    case 'bottleneck': {
      const alt = f.qualifiedAlternatives;
      if (f.temporaryShortage === true) {
        return res(s, 'bottleneck-situational', 'The shortage is flagged as temporary.', 'النقص مصنَّف على أنه مؤقت.');
      }
      if (typeof alt === 'number' && alt >= 1) {
        return res(s, 'bottleneck-movable', `${alt} qualified alternative(s) exist.`, `يوجد ${alt} بديل مؤهَّل.`);
      }
      if (f.specLoosenable === true) {
        return res(s, 'bottleneck-movable', 'The specification can be loosened.', 'يمكن تخفيف المواصفة.');
      }
      if (alt === 0 && f.specLoosenable === false) {
        const has = f.constraintCause && f.constraintCause !== 'none';
        return res(
          s, 'bottleneck-locked',
          `No qualified alternative and the specification cannot change.${has ? ` Cause: ${CAUSE_LABEL[f.constraintCause as ConstraintCause].en}.` : ''}`,
          `لا بديل مؤهَّل ولا يمكن تغيير المواصفة.${has ? ` السبب: ${CAUSE_LABEL[f.constraintCause as ConstraintCause].ar}.` : ''}`,
        );
      }
      const missing: FactKey[] = [];
      if (alt == null) missing.push('qualifiedAlternatives');
      if (f.specLoosenable == null) missing.push('specLoosenable');
      return unclassified(s, missing);
    }
    case 'leverage': {
      if (f.marketVolatility === 'volatile') return res(s, 'leverage-volatile', 'The supply market is flagged as volatile.', 'سوق التوريد مصنَّف على أنه متقلب.');
      if (f.marketVolatility === 'stable') return res(s, 'leverage-stable', 'The supply market is flagged as stable.', 'سوق التوريد مصنَّف على أنه مستقر.');
      return unclassified(s, ['marketVolatility']);
    }
    case 'non-critical': {
      if (f.poolableAcrossSites === true) return res(s, 'noncritical-pool', 'Demand can be combined across sites or categories.', 'يمكن تجميع الطلب عبر المواقع أو الفئات.');
      if (f.poolableAcrossSites === false) return res(s, 'noncritical-process', 'Demand cannot be combined.', 'لا يمكن تجميع الطلب.');
      return unclassified(s, ['poolableAcrossSites']);
    }
    case 'strategic': {
      if (f.powerBalance === 'buyer') return res(s, 'strategic-exploit', 'The buyer holds the power.', 'القوة بيد المشتري.');
      if (f.powerBalance === 'balanced') return res(s, 'strategic-balance', 'Power is balanced.', 'القوة متوازنة.');
      if (f.powerBalance === 'supplier') return res(s, 'strategic-diversify', 'The supplier holds the power.', 'القوة بيد المورد.');
      return unclassified(s, ['powerBalance']);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Situations -- the real problems this solves, with links to other modules
// ---------------------------------------------------------------------------

export type SituationKey =
  | 'locked-no-contingency'
  | 'locked-recurring-failures'
  | 'locked-and-concentrated'
  | 'movable-recurring-failures'
  | 'leverage-recurring-failures'
  | 'movable-premium'
  | 'situational-needs-expiry'
  | 'volatile-needs-index'
  | 'pool-candidate'
  | 'dominant-supplier'
  | 'strategic-locked-in'
  | 'routine-operational-exception'
  | 'quadrant-changed';

export type Severity = 'high' | 'medium' | 'low';

export interface Situation {
  key: SituationKey;
  severity: Severity;
  problem: Bilingual;
  action: Bilingual;
  /** The critical-thinking point: what NOT to do, and why. */
  caution?: Bilingual;
  links: ModuleLink[];
  problemMapArea: 'Supplier Governance' | 'Risk Management';
  basis: Basis;
}

/** Mirrors M07's recurrence threshold; caller-overridable. ISC convention. */
export const RECURRENCE_THRESHOLD = 2;

const L = {
  m03Remedy: { module: 'M03', built: true, purposeEn: 'Check the remedy clause families: service credits, corrective-action process, step-in, persistent-breach termination.', purposeAr: 'افحص عائلات بنود العلاج: تعويضات الخدمة وعملية الإجراء التصحيحي والتدخل وإنهاء العقد عند الإخلال المتكرر.' } as ModuleLink,
  m03Index: { module: 'M03', built: true, purposeEn: 'Check for an index-linked or price-adjustment clause in the contract.', purposeAr: 'افحص وجود بند مرتبط بمؤشر أو بند تعديل سعر في العقد.' } as ModuleLink,
  m05Hhi: { module: 'M05', built: true, purposeEn: 'Read the category concentration (HHI) before deciding how much to rely on one supplier.', purposeAr: 'اقرأ تركّز الفئة (HHI) قبل تحديد مدى الاعتماد على مورد واحد.' } as ModuleLink,
  m06Leverage: { module: 'M06', built: true, purposeEn: 'Negotiate with the real leverage picture: an exit threat you cannot execute is not leverage.', purposeAr: 'تفاوض وفق صورة النفوذ الحقيقية: تهديد بالخروج لا تستطيع تنفيذه ليس نفوذًا.' } as ModuleLink,
  m06Cost: { module: 'M06', built: true, purposeEn: 'Use should-cost and index evidence in the price conversation.', purposeAr: 'استخدم التكلفة المعيارية وأدلة المؤشر في حوار السعر.' } as ModuleLink,
  m07Cause: { module: 'M07', built: true, purposeEn: 'Check whose problem it is (cause mix) before blaming the supplier.', purposeAr: 'افحص صاحب المشكلة (توزيع الأسباب) قبل لوم المورد.' } as ModuleLink,
  m04Qual: { module: 'M04', built: true, purposeEn: 'Qualify the alternative through the qualification and due-diligence gates; the due-diligence depth for this supplier is on the supplier card.', purposeAr: 'أهّل البديل عبر بوابات التأهيل والعناية الواجبة؛ عمق العناية الواجبة لهذا المورد ظاهر في بطاقة المورد.' } as ModuleLink,
};

export interface SituationOptions {
  recurrenceThreshold?: number;
}

export function detectSituations(s: SubtypeSupplierInput, r: SubtypeResult, opts: SituationOptions = {}): Situation[] {
  const f = cleanFacts(s.facts);
  const thr = opts.recurrenceThreshold ?? RECURRENCE_THRESHOLD;
  const rec = cleanCount(s.recurrenceCount);
  const out: Situation[] = [];

  if (r.subtype === 'bottleneck-locked') {
    if (f.contingencyInPlace !== true) {
      out.push({
        key: 'locked-no-contingency', severity: 'high', basis: 'sourced', problemMapArea: 'Risk Management',
        problem: { en: 'Single point of failure with no contingency plan on record.', ar: 'نقطة فشل وحيدة بلا خطة طوارئ مسجَّلة.' },
        action: { en: 'Write the contingency plan, set a buffer level, and add persistent-breach remedies to the contract.', ar: 'اكتب خطة الطوارئ وحدّد مستوى المخزون الاحتياطي وأضف علاجات الإخلال المتكرر إلى العقد.' },
        links: [L.m03Remedy, L.m05Hhi],
      });
    }
    if (rec >= thr) {
      out.push({
        key: 'locked-recurring-failures', severity: 'high', basis: 'isc-convention', problemMapArea: 'Supplier Governance',
        problem: { en: 'The supplier keeps failing and you cannot leave.', ar: 'المورد يكرر الإخفاق ولا تستطيع إيقاف التعامل معه.' },
        action: { en: 'Run a joint corrective plan with executive sponsorship and use the contract remedies you already hold.', ar: 'نفّذ خطة تصحيحية مشتركة برعاية الإدارة العليا واستخدم علاجات العقد التي بين يديك.' },
        caution: { en: 'Do not threaten to exit. With no alternative the threat is not credible and costs trust.', ar: 'لا تهدّد بالمغادرة. مع غياب البديل لا يكون التهديد موثوقًا ويكلّف الثقة.' },
        links: [L.m07Cause, L.m06Leverage, L.m03Remedy],
      });
    }
    if (s.hhiBand === 'highlyConcentrated') {
      out.push({
        key: 'locked-and-concentrated', severity: 'high', basis: 'isc-convention', problemMapArea: 'Risk Management',
        problem: { en: 'Locked supplier inside a highly concentrated category: the exposure compounds.', ar: 'مورد مقيَّد داخل فئة شديدة التركّز: تتضاعف المخاطر.' },
        action: { en: 'Treat as a board-level exposure: confirm the buffer, escalate the substitute search, and review quarterly.', ar: 'تعامل معها كمخاطرة على مستوى مجلس الإدارة: أكّد المخزون وصعّد البحث عن بديل وراجع كل ربع سنة.' },
        links: [L.m05Hhi, L.m03Remedy],
      });
    }
  }

  if (r.subtype === 'bottleneck-movable') {
    const alt = f.qualifiedAlternatives;
    if (typeof alt === 'number' && alt >= 1) {
      out.push({
        key: 'movable-premium', severity: 'medium', basis: 'sourced', problemMapArea: 'Supplier Governance',
        problem: { en: 'An alternative exists, yet the item may still be handled and paid for as locked.', ar: 'يوجد بديل لكن قد يُعامل البند ويُدفع ثمنه كأنه مقيَّد.' },
        action: { en: 'Re-test the terms against the alternative and drop security premiums you no longer need.', ar: 'أعد اختبار الشروط مقابل البديل واحذف علاوات الأمان التي لم تعد تحتاجها.' },
        links: [L.m06Cost, L.m04Qual],
      });
    }
    if (rec >= thr) {
      out.push({
        key: 'movable-recurring-failures', severity: 'medium', basis: 'isc-convention', problemMapArea: 'Supplier Governance',
        problem: { en: 'The supplier keeps failing and you have a real way out.', ar: 'المورد يكرر الإخفاق ولديك مخرج حقيقي.' },
        action: { en: 'Put the supplier on formal notice and move volume to the qualified alternative if the plan is not met by the review date.', ar: 'وجّه للمورد إشعارًا رسميًا وانقل الكمية إلى البديل المؤهَّل إن لم تتحقق الخطة بحلول تاريخ المراجعة.' },
        caution: { en: 'Check the cause mix first. If most failures are on your side, fix yours before moving volume.', ar: 'افحص توزيع الأسباب أولًا. إن كانت معظم الإخفاقات من جانبك فأصلحها قبل نقل الكمية.' },
        links: [L.m07Cause, L.m06Leverage, L.m03Remedy],
      });
    }
  }

  if (r.subtype === 'bottleneck-situational') {
    out.push({
      key: 'situational-needs-expiry', severity: 'low', basis: 'isc-convention', problemMapArea: 'Risk Management',
      problem: { en: 'A temporary shortage can quietly turn into a permanent arrangement.', ar: 'قد يتحول النقص المؤقت بهدوء إلى ترتيب دائم.' },
      action: { en: 'Put an end date on the bridge and a named owner for the review.', ar: 'ضع تاريخ انتهاء للحل المؤقت ومسؤولًا محددًا للمراجعة.' },
      links: [L.m05Hhi],
    });
  }

  if (r.subtype === 'leverage-volatile') {
    out.push({
      key: 'volatile-needs-index', severity: 'medium', basis: 'isc-convention', problemMapArea: 'Risk Management',
      problem: { en: 'Price swings land entirely on one side unless the contract shares them.', ar: 'تقلبات الأسعار تقع على طرف واحد ما لم يتقاسمها العقد.' },
      action: { en: 'Move to an index-linked clause and tender on the margin over the index.', ar: 'انتقل إلى بند مرتبط بمؤشر واطرح المناقصة على الهامش فوق المؤشر.' },
      links: [L.m03Index, L.m06Cost],
    });
  }
  if ((r.subtype === 'leverage-stable' || r.subtype === 'leverage-volatile') && rec >= thr) {
    out.push({
      key: 'leverage-recurring-failures', severity: 'medium', basis: 'sourced', problemMapArea: 'Supplier Governance',
      problem: { en: 'Recurring failures on a Leverage supplier. Gelderman & van Weele name supplier non-performance as a reason an item moves.', ar: 'إخفاقات متكررة لمورد في مربع النفوذ الشرائي. يذكر Gelderman & van Weele عدم أداء المورد سببًا لانتقال البند.' },
      action: { en: 'Switch supplier by tender, or re-classify and manage as a partner if switching is costly.', ar: 'غيّر المورد عبر مناقصة، أو أعد التصنيف وأدِره كشريك إن كان التغيير مكلفًا.' },
      links: [L.m07Cause, L.m06Leverage],
    });
  }

  if (r.subtype === 'noncritical-pool') {
    out.push({
      key: 'pool-candidate', severity: 'low', basis: 'sourced', problemMapArea: 'Supplier Governance',
      problem: { en: 'Scattered small buys that could be priced as one.', ar: 'مشتريات صغيرة متفرقة يمكن تسعيرها كصفقة واحدة.' },
      action: { en: 'Combine the demand under one framework agreement.', ar: 'اجمع الطلب تحت اتفاقية إطارية واحدة.' },
      links: [L.m06Cost],
    });
  }

  if (r.subtype === 'strategic-diversify') {
    out.push({
      key: 'dominant-supplier', severity: 'high', basis: 'sourced', problemMapArea: 'Risk Management',
      problem: { en: 'A critical item sits with a supplier who holds the power.', ar: 'بند حرج لدى مورد يملك القوة.' },
      action: { en: 'Fund a second source or own capability, and lock service terms while you build it.', ar: 'موّل مصدرًا ثانيًا أو قدرة ذاتية وثبّت شروط الخدمة أثناء بنائها.' },
      links: [L.m05Hhi, L.m03Remedy],
    });
  }

  if (s.quadrant === 'strategic' && f.lockIn === true) {
    out.push({
      key: 'strategic-locked-in', severity: 'high', basis: 'sourced', problemMapArea: 'Risk Management',
      problem: { en: 'A strategic dependence that was forced on you, not chosen (patent, monopoly or switching cost).', ar: 'اعتماد استراتيجي مفروض عليك لا مختار (براءة أو احتكار أو تكلفة تحويل).' },
      action: { en: 'Do not treat it as a partnership by default. Secure terms and continuity now, and start a long-horizon plan to reduce the lock-in.', ar: 'لا تعامله كشراكة افتراضيًا. أمّن الشروط والاستمرارية الآن وابدأ خطة طويلة الأمد لتقليل القيد.' },
      caution: { en: 'There is no quick voluntary move out of this position. Threatening to leave is not credible.', ar: 'لا يوجد انتقال طوعي سريع خارج هذا الموقع. التهديد بالمغادرة ليس موثوقًا.' },
      links: [L.m05Hhi, L.m03Remedy, L.m06Leverage],
    });
  }
  if (s.quadrant === 'non-critical' && f.operationalStopRisk === true) {
    out.push({
      key: 'routine-operational-exception', severity: 'medium', basis: 'isc-convention', problemMapArea: 'Risk Management',
      problem: { en: 'Low spend, but a stoppage would halt operations: the Routine label hides the risk.', ar: 'إنفاق منخفض لكن الانقطاع يوقف التشغيل: تسمية «روتيني» تخفي المخاطرة.' },
      action: { en: 'Keep the simple process but add a safety stock level and a named backup supplier. Review the item as a possible Bottleneck.', ar: 'أبقِ العملية بسيطة لكن أضف مستوى مخزون أمان وموردًا احتياطيًا محددًا. راجع البند كاختناق محتمل.' },
      links: [L.m05Hhi],
    });
  }

  if (isQuadrant(s.quadrantPriorQuarter) && isQuadrant(s.quadrant) && s.quadrantPriorQuarter !== s.quadrant) {
    out.push({
      key: 'quadrant-changed', severity: 'medium', basis: 'isc-convention', problemMapArea: 'Supplier Governance',
      problem: { en: `Moved from ${s.quadrantPriorQuarter} to ${s.quadrant} since last quarter.`, ar: `انتقل من ${s.quadrantPriorQuarter} إلى ${s.quadrant} منذ المربع السابق.` },
      action: { en: 'Confirm the move is intended and switch to the new quadrant\'s sub-type actions.', ar: 'تأكد أن الانتقال مقصود وانتقل إلى إجراءات النوع الفرعي للمربع الجديد.' },
      links: [L.m07Cause],
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// 3. Migration alerts -- "dynamic": what should be re-classified, and why
// ---------------------------------------------------------------------------

export type MigrationTrigger = 'supplier-non-performance' | 'alternatives-gained' | 'quadrant-changed';

export interface MigrationAlert {
  supplierId: string;
  trigger: MigrationTrigger;
  fromQuadrant: Quadrant;
  reviewAs: Quadrant;
  whyEn: string;
  whyAr: string;
  basis: Basis;
}

/** Two or more qualified alternatives = real competition (ISC convention). */
export const ALTERNATIVES_FOR_MIGRATION = 2;

export function detectMigrations(s: SubtypeSupplierInput, opts: SituationOptions = {}): MigrationAlert[] {
  const f = cleanFacts(s.facts);
  const thr = opts.recurrenceThreshold ?? RECURRENCE_THRESHOLD;
  const out: MigrationAlert[] = [];
  if (s.quadrant === 'leverage' && cleanCount(s.recurrenceCount) >= thr) {
    out.push({
      supplierId: s.supplierId, trigger: 'supplier-non-performance', fromQuadrant: 'leverage', reviewAs: 'strategic', basis: 'sourced',
      whyEn: 'Recurring failures make this item riskier to depend on than its Leverage position assumes.',
      whyAr: 'الإخفاقات المتكررة تجعل الاعتماد على هذا البند أخطر مما يفترضه موقعه في مربع النفوذ الشرائي.',
    });
  }
  if (s.quadrant === 'bottleneck' && typeof f.qualifiedAlternatives === 'number' && f.qualifiedAlternatives >= ALTERNATIVES_FOR_MIGRATION) {
    out.push({
      supplierId: s.supplierId, trigger: 'alternatives-gained', fromQuadrant: 'bottleneck', reviewAs: 'non-critical', basis: 'sourced',
      whyEn: `${f.qualifiedAlternatives} qualified alternatives: supply risk has likely dropped. Spend is low, so the item moves toward Non-critical (Gelderman & van Weele). Stop paying for security you no longer need.`,
      whyAr: `${f.qualifiedAlternatives} بدائل مؤهَّلة: انخفضت مخاطر الإمداد على الأرجح. الإنفاق منخفض فينتقل البند نحو «غير حرج» (Gelderman & van Weele). توقف عن دفع ثمن أمان لم تعد تحتاجه.`,
    });
  }
  if (isQuadrant(s.quadrantPriorQuarter) && isQuadrant(s.quadrant) && s.quadrantPriorQuarter !== s.quadrant) {
    out.push({
      supplierId: s.supplierId, trigger: 'quadrant-changed', fromQuadrant: s.quadrantPriorQuarter, reviewAs: s.quadrant, basis: 'isc-convention',
      whyEn: 'The quadrant changed since last quarter.', whyAr: 'تغيّر المربع منذ الربع السابق.',
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 4. Portfolio view -- outcomes measured on the client's own data
// ---------------------------------------------------------------------------

export interface SubtypeAssessment {
  result: SubtypeResult;
  situations: Situation[];
  migrations: MigrationAlert[];
}

export function assess(s: SubtypeSupplierInput, opts: SituationOptions = {}): SubtypeAssessment {
  const result = classifySubtype(s);
  return { result, situations: detectSituations(s, result, opts), migrations: detectMigrations(s, opts) };
}

export interface PortfolioSubtypeSummary {
  total: number;
  bySubtype: Record<SubtypeKey, number>;
  unclassified: number;
  missingFactCounts: Partial<Record<FactKey, number>>;
  lockedWithoutContingency: number;
  movableBottlenecks: number;
  poolable: { suppliers: number; withSpend: number; spendSAR: number };
  migrations: number;
  highSeverity: number;
}

export function summarisePortfolio(inputs: SubtypeSupplierInput[], opts: SituationOptions = {}): PortfolioSubtypeSummary {
  const bySubtype = Object.keys(SUBTYPES).reduce((a, k) => ({ ...a, [k]: 0 }), {} as Record<SubtypeKey, number>);
  const missingFactCounts: Partial<Record<FactKey, number>> = {};
  let lockedWithoutContingency = 0, movable = 0, migrations = 0, high = 0;
  const pool = { suppliers: 0, withSpend: 0, spendSAR: 0 };
  for (const s of inputs) {
    const a = assess(s, opts);
    bySubtype[a.result.subtype]++;
    for (const m of a.result.missingFacts) missingFactCounts[m] = (missingFactCounts[m] ?? 0) + 1;
    if (a.situations.some((x) => x.key === 'locked-no-contingency')) lockedWithoutContingency++;
    if (a.result.subtype === 'bottleneck-movable') movable++;
    if (a.result.subtype === 'noncritical-pool') {
      pool.suppliers++;
      { const sp = cleanSpend(s.annualSpendSAR); if (sp !== null) { pool.withSpend++; pool.spendSAR += sp; } }
    }
    migrations += a.migrations.length;
    if (a.situations.some((x) => x.severity === 'high')) high++;
  }
  return {
    total: inputs.length, bySubtype, unclassified: bySubtype.unclassified, missingFactCounts,
    lockedWithoutContingency, movableBottlenecks: movable, poolable: pool, migrations, highSeverity: high,
  };
}
