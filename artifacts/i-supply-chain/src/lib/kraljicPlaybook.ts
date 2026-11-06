/**
 * Kraljic playbook per sub-type (Round B5, enrichment items 7, 8, 12, 13).
 *
 * Item 7  Playbook: five headings per sub-type (objective, supplier view,
 *         due-diligence tier, contract checklist, monitoring and exit). Every
 *         line carries a basis: 'sourced' (a published statement it paraphrases)
 *         or 'isc-design' (an ISC design choice, shown as such). CIPS publishes
 *         no per-quadrant contract types, negotiation styles or KPIs openly, so
 *         most contract and monitoring lines are ISC design choices.
 * Item 8  Due-diligence depth by quadrant. Principle sourced (World Bank PPSD
 *         proportionality, ISO 37001 "proportionate and reasonable", NIGP four
 *         tiers); the quadrant-to-tier mapping and the cadences are ISC's and
 *         are configurable defaults.
 * Item 12 Classification-level guardrails.
 * Item 13 Savings and TCO rules for reporting (CIPS Position on Practice:
 *         Savings, 2013: saving against a baseline; cost avoidance is not a
 *         saving but is reported). TCO as the base for Critical and Bottleneck
 *         is an inference from CIPS.
 *
 * STANDALONE-FIRST: type-only imports, no runtime imports.
 */
import type { Bilingual, Quadrant, SubtypeKey } from './supplierKraljicSubtypes';

const b = (en: string, ar: string): Bilingual => ({ en, ar });

export type PlaybookBasis = 'sourced' | 'isc-design';
export interface PlaybookLine { t: Bilingual; basis: PlaybookBasis }
const L = (basis: PlaybookBasis, en: string, ar: string): PlaybookLine => ({ t: b(en, ar), basis });

export type DdTier = 'comprehensive' | 'targeted' | 'standard' | 'screening';

export interface DdDepth {
  quadrant: Quadrant;
  tier: DdTier;
  tierLabel: Bilingual;
  depth: Bilingual[];
  anchor: Bilingual;
  /** Suggested reassessment interval in months. null = at renewal or incident only. Configurable ISC default. */
  cadenceMonths: number | null;
  cadenceNote: Bilingual;
}

export const DD_NOTE: Bilingual = b(
  'The principle is sourced (World Bank PPSD, ISO 37001, NIGP tiers). The quadrant-to-tier mapping and the intervals are ISC choices: neither NIGP nor the Bank links tiers to Kraljic. Change them to suit your policy.',
  'المبدأ موثّق (دليل PPSD للبنك الدولي، ISO 37001، مستويات NIGP). أما ربط الربع بالمستوى والفترات الزمنية فاختيار من ISC: لا تربط NIGP ولا البنك المستويات بنموذج Kraljic. عدّلها بما يناسب سياستك.',
);

export const DD_DEPTH: Record<Quadrant, DdDepth> = {
  strategic: {
    quadrant: 'strategic', tier: 'comprehensive', tierLabel: b('Comprehensive', 'شامل'),
    depth: [
      b('Financial, operational, ESG, compliance and anti-bribery checks.', 'فحوص مالية وتشغيلية وبيئية واجتماعية وحوكمة وامتثال ومكافحة رشوة.'),
      b('Site visit or third-party verification.', 'زيارة موقع أو تحقق من طرف ثالث.'),
      b('Contingency and exit plan agreed before award.', 'خطة طوارئ وخطة خروج متفق عليهما قبل الترسية.'),
    ],
    anchor: b('PPSD "greater level of analysis"; NIGP Tier 1; ISO 44001 exit; ISO 37001.', 'PPSD «مستوى أعلى من التحليل»؛ NIGP المستوى 1؛ ISO 44001 (الخروج)؛ ISO 37001.'),
    cadenceMonths: 6, cadenceNote: b('Annual or twice a year.', 'سنويًا أو مرتين في السنة.'),
  },
  bottleneck: {
    quadrant: 'bottleneck', tier: 'targeted', tierLabel: b('Targeted on continuity', 'موجَّه نحو استمرارية الإمداد'),
    depth: [
      b('Financial health, capacity, sub-tier and location concentration.', 'الصحة المالية والطاقة الإنتاجية وتركّز الموردين من الباطن والمواقع.'),
      b('Qualification of an alternative source.', 'تأهيل مصدر بديل.'),
      b('Remote audit is usually enough.', 'يكفي غالبًا تدقيق عن بُعد.'),
    ],
    anchor: b('NIGP Tier 2; CIPS resilience page; McKinsey tier visibility.', 'NIGP المستوى 2؛ صفحة المرونة في CIPS؛ رؤية McKinsey للمستويات الفرعية.'),
    cadenceMonths: 6, cadenceNote: b('Annual or twice a year.', 'سنويًا أو مرتين في السنة.'),
  },
  leverage: {
    quadrant: 'leverage', tier: 'standard', tierLabel: b('Standard', 'قياسي'),
    depth: [
      b('Standard qualification at tender, desktop review.', 'تأهيل قياسي عند المناقصة ومراجعة مكتبية.'),
      b('Compliance check at renewal.', 'فحص الامتثال عند التجديد.'),
      b('Price and performance monitoring.', 'متابعة السعر والأداء.'),
    ],
    anchor: b('NIGP Tier 3; ISO 9001 clause 8.4.1 criteria.', 'NIGP المستوى 3؛ معايير البند 8.4.1 في ISO 9001.'),
    cadenceMonths: 12, cadenceNote: b('At least at each renewal.', 'عند كل تجديد على الأقل.'),
  },
  'non-critical': {
    quadrant: 'non-critical', tier: 'screening', tierLabel: b('Screening', 'فرز أولي'),
    depth: [
      b('Initial screening and passive monitoring.', 'فرز أولي ومتابعة سلبية.'),
      b('Review at renewal or after an incident.', 'مراجعة عند التجديد أو بعد حادثة.'),
    ],
    anchor: b('NIGP Tier 4; PPSD short route for low-value, low-risk contracts.', 'NIGP المستوى 4؛ مسار PPSD المختصر للعقود منخفضة القيمة والمخاطر.'),
    cadenceMonths: null, cadenceNote: b('Only at renewal or incident.', 'عند التجديد أو وقوع حادثة فقط.'),
  },
};

export interface PlaybookView {
  subtype: SubtypeKey;
  quadrant: Quadrant;
  objective: PlaybookLine[];
  supplierView: PlaybookLine[];
  dueDiligence: DdDepth;
  contract: PlaybookLine[];
  monitorExit: PlaybookLine[];
}

const QUADRANT_OF: Partial<Record<SubtypeKey, Quadrant>> = {
  'bottleneck-movable': 'bottleneck', 'bottleneck-locked': 'bottleneck', 'bottleneck-situational': 'bottleneck',
  'leverage-stable': 'leverage', 'leverage-volatile': 'leverage',
  'noncritical-pool': 'non-critical', 'noncritical-process': 'non-critical',
  'strategic-exploit': 'strategic', 'strategic-balance': 'strategic', 'strategic-diversify': 'strategic',
};

interface Base { objective: PlaybookLine[]; supplierView: PlaybookLine[]; contract: PlaybookLine[]; monitorExit: PlaybookLine[] }

const BASE: Record<Quadrant, Base> = {
  strategic: {
    objective: [L('sourced', 'Balance power through performance-based partnerships (CIPS).', 'وازن القوى عبر شراكات قائمة على الأداء (CIPS).')],
    supplierView: [L('isc-design', 'Find out how the supplier ranks us: Core, Development, Exploitable or Nuisance. Ask the account manager or run a short survey, and record the evidence.', 'اعرف كيف يصنّفنا المورد: أساسي أو تطويري أو قابل للاستغلال أو مُزعج. اسأل مدير الحساب أو أجرِ استبيانًا قصيرًا وسجّل الدليل.')],
    contract: [
      L('isc-design', 'Multi-year performance-based agreement with joint targets.', 'اتفاقية متعددة السنوات قائمة على الأداء بأهداف مشتركة.'),
      L('sourced', 'Exit and transition plan agreed up front (ISO 44001 exit stage).', 'خطة خروج وانتقال متفق عليها مسبقًا (مرحلة الخروج في ISO 44001).'),
      L('isc-design', 'Joint risk plan and an escalation path.', 'خطة مخاطر مشتركة ومسار تصعيد.'),
    ],
    monitorExit: [
      L('sourced', 'Review the partnership at least once a year (CIPS category management cycle).', 'راجع الشراكة مرة في السنة على الأقل (دورة إدارة الفئات في CIPS).'),
      L('isc-design', 'Keep the exit and diligence controls live until any move is confirmed.', 'أبقِ ضوابط الخروج والعناية الواجبة قائمة حتى يتأكد أي انتقال.'),
    ],
  },
  leverage: {
    objective: [L('sourced', 'Use competitive tendering, target pricing and substitution (CIPS).', 'استخدم المناقصات التنافسية والسعر المستهدف والاستبدال (CIPS).')],
    supplierView: [L('isc-design', 'Expect the supplier to value the account by its spend. Share forecasts during a tender so interest stays high, and avoid being read as a Nuisance.', 'توقّع أن يقدّر المورد الحساب بحجم إنفاقه. شارك التوقعات أثناء المناقصة ليبقى اهتمامه مرتفعًا، وتجنب أن يُنظر إليك كعميل مُزعج.')],
    contract: [
      L('sourced', 'Arm\'s-length terms with scheduled rebids (Dyer, Cho & Chu 1998).', 'شروط مستقلة مع إعادة طرح مجدولة (Dyer وCho وChu 1998).'),
      L('isc-design', 'Clear price mechanism (fixed or index-linked) and service credits.', 'آلية سعر واضحة (ثابت أو مرتبط بمؤشر) وتعويضات خدمة.'),
      L('isc-design', 'Exit at term without penalty.', 'الخروج عند انتهاء المدة دون غرامة.'),
    ],
    monitorExit: [
      L('isc-design', 'Track price against target and supplier performance each quarter.', 'تابع السعر مقابل المستهدف وأداء المورد كل ربع سنة.'),
      L('isc-design', 'Keep a live second source so the leverage stays real.', 'أبقِ مصدرًا ثانيًا حيًا لتبقى القوة الشرائية حقيقية.'),
    ],
  },
  bottleneck: {
    objective: [L('sourced', 'Secure supply and look for alternative suppliers (CIPS).', 'أمّن الإمداد وابحث عن موردين بدلاء (CIPS).')],
    supplierView: [L('isc-design', 'A bottleneck supplier may see a small account as a Nuisance. Find out. If so, raise attractiveness (forecasts, prompt payment, pooled volume) or re-specify.', 'قد يرى مورد الاختناق الحساب الصغير عميلًا مُزعجًا. تحقق من ذلك. فإن كان كذلك فارفع جاذبية حسابك (توقعات، سداد سريع، حجم مجمّع) أو أعد المواصفة.')],
    contract: [
      L('isc-design', 'Supply-security terms: priority allocation, buffer or consignment stock, service credits.', 'شروط تأمين الإمداد: أولوية في التخصيص ومخزون احتياطي أو بالأمانة وتعويضات خدمة.'),
      L('isc-design', 'Remedies for repeated failure, and a contingency plan on record.', 'علاجات للإخلال المتكرر وخطة طوارئ مسجَّلة.'),
      L('isc-design', 'An expiry date on every temporary arrangement.', 'تاريخ انتهاء لكل ترتيب مؤقت.'),
    ],
    monitorExit: [
      L('isc-design', 'Watch supplier health signals monthly.', 'راقب مؤشرات سلامة المورد شهريًا.'),
      L('isc-design', 'Every decision has an owner and a review date.', 'لكل قرار مسؤول وتاريخ مراجعة.'),
    ],
  },
  'non-critical': {
    objective: [L('sourced', 'Simplify: systems contracting, e-procurement and standardisation (CIPS).', 'بسّط: عقود نظامية وشراء إلكتروني وتوحيد المواصفات (CIPS).')],
    supplierView: [L('isc-design', 'Spend no relationship effort. If the supplier sees us as a Nuisance, a systems contract or a distributor removes the friction.', 'لا تبذل جهدًا في العلاقة. إن رآنا المورد عميلًا مُزعجًا فإن العقد النظامي أو الموزّع يزيل الاحتكاك.')],
    contract: [
      L('sourced', 'Systems contract, catalogue or purchase card (CIPS 2020).', 'عقد نظامي أو كتالوج أو بطاقة شراء (CIPS 2020).'),
      L('isc-design', 'Standard terms; no bespoke negotiation.', 'شروط قياسية دون تفاوض مخصص.'),
    ],
    monitorExit: [
      L('isc-design', 'Passive monitoring; review at renewal or incident.', 'متابعة سلبية ومراجعة عند التجديد أو وقوع حادثة.'),
      L('isc-design', 'Watch for creeping spend or stoppage risk that would reclassify the item.', 'انتبه لزيادة الإنفاق التدريجية أو خطر التوقف الذي قد يغيّر تصنيف البند.'),
    ],
  },
};

const EXTRA: Partial<Record<SubtypeKey, { objective: PlaybookLine; contract: PlaybookLine; monitorExit: PlaybookLine }>> = {
  'bottleneck-movable': {
    objective: L('isc-design', 'Leave the quadrant: qualify an alternative or simplify the specification, with an owner and a date.', 'اخرج من هذا الربع: أهّل بديلًا أو بسّط المواصفة بمسؤول وتاريخ.'),
    contract: L('isc-design', 'Keep current terms short until the alternative is qualified.', 'أبقِ الشروط الحالية قصيرة الأجل إلى أن يتأهل البديل.'),
    monitorExit: L('isc-design', 'Track alternatives qualified and the date of the specification decision.', 'تابع عدد البدائل المؤهَّلة وتاريخ قرار المواصفة.'),
  },
  'bottleneck-locked': {
    objective: L('isc-design', 'Secure and contain: contingency, buffer and remedies now; a long search for an alternative in parallel.', 'أمّن واحتوِ: طوارئ ومخزون وعلاجات الآن، وبحث طويل عن بديل بالتوازي.'),
    contract: L('isc-design', 'Long-term agreement with service credits and remedies; licence or escrow continuity where intellectual property is involved.', 'اتفاقية طويلة الأجل مع تعويضات خدمة وعلاجات؛ واستمرارية الترخيص أو الإيداع لدى طرف ثالث حيث توجد ملكية فكرية.'),
    monitorExit: L('isc-design', 'Compare days of cover with the time the supplier needs to recover.', 'قارن أيام التغطية بالمدة التي يحتاجها المورد للتعافي.'),
  },
  'bottleneck-situational': {
    objective: L('isc-design', 'Cover the shock without changing the contract strategy.', 'غطِّ الصدمة دون تغيير استراتيجية العقد.'),
    contract: L('isc-design', 'Spot buy or temporary stock with an expiry date; no long commitment for a short problem.', 'شراء فوري أو مخزون مؤقت بتاريخ انتهاء؛ ولا التزام طويلًا لمشكلة قصيرة.'),
    monitorExit: L('isc-design', 'Run the persistence test at every review: is the shock still shorter than our time-to-survive?', 'نفّذ اختبار الاستمرارية في كل مراجعة: هل ما زالت الصدمة أقصر من مدة صمودنا؟'),
  },
  'leverage-stable': {
    objective: L('isc-design', 'Take the saving net of switching cost and failures; keep a live second source.', 'حقق الوفر صافيًا بعد تكلفة التبديل والإخفاقات، وأبقِ مصدرًا ثانيًا حيًا.'),
    contract: L('isc-design', 'Scheduled rebid with a target price.', 'إعادة طرح مجدولة بسعر مستهدف.'),
    monitorExit: L('isc-design', 'Report net saving beside gross saving.', 'اعرض الوفر الصافي بجانب الوفر الإجمالي.'),
  },
  'leverage-volatile': {
    objective: L('isc-design', 'Share price volatility fairly instead of one side carrying it.', 'تقاسم تقلب الأسعار بإنصاف بدل أن يتحمله طرف واحد.'),
    contract: L('isc-design', 'Index-linked clause with a negotiated margin over the index and a review point.', 'بند مرتبط بمؤشر مع هامش متفاوض عليه فوق المؤشر ونقطة مراجعة.'),
    monitorExit: L('isc-design', 'Compare the index with the price paid and the budget variance.', 'قارن المؤشر بالسعر المدفوع وانحراف الميزانية.'),
  },
  'noncritical-pool': {
    objective: L('isc-design', 'Pool demand across sites so the item can reach the Leverage quadrant.', 'جمّع الطلب عبر المواقع ليصل البند إلى ربع النفوذ.'),
    contract: L('isc-design', 'One framework agreement across sites.', 'اتفاقية إطارية واحدة عبر المواقع.'),
    monitorExit: L('isc-design', 'Share of spend under the framework.', 'نسبة الإنفاق المشمول بالاتفاقية الإطارية.'),
  },
  'noncritical-process': {
    objective: L('isc-design', 'Buy without a buyer: catalogue, card or distributor.', 'اشترِ دون مشترٍ: كتالوج أو بطاقة أو موزّع.'),
    contract: L('isc-design', 'Catalogue or systems contract; keep control through reports, not approvals.', 'كتالوج أو عقد نظامي؛ وأبقِ الرقابة بالتقارير لا بالموافقات.'),
    monitorExit: L('isc-design', 'Share of orders handled without a buyer.', 'نسبة الطلبات المنفّذة دون مشترٍ.'),
  },
  'strategic-exploit': {
    objective: L('isc-design', 'Use the power to build a joint improvement plan, not only a lower price.', 'استخدم القوة لبناء خطة تحسين مشتركة لا لخفض السعر فقط.'),
    contract: L('isc-design', 'Benefit-sharing clauses and improvement targets while the power lasts.', 'بنود تقاسم المنافع وأهداف التحسين ما دامت القوة قائمة.'),
    monitorExit: L('isc-design', 'Read the power balance each year; it can turn.', 'اقرأ توازن القوى كل سنة، فقد ينقلب.'),
  },
  'strategic-balance': {
    objective: L('isc-design', 'Run a performance-based partnership with open review.', 'أدِر شراكة قائمة على الأداء مع مراجعة مفتوحة.'),
    contract: L('isc-design', 'Joint targets, open review and a shared risk plan.', 'أهداف مشتركة ومراجعة مفتوحة وخطة مخاطر مشتركة.'),
    monitorExit: L('isc-design', 'Joint scorecard; separate chosen partnership from forced dependence.', 'بطاقة أداء مشتركة؛ وفرّق بين الشراكة المختارة والاعتماد المفروض.'),
  },
  'strategic-diversify': {
    objective: L('isc-design', 'Reduce dependence on a stronger supplier while keeping supply stable.', 'قلّل الاعتماد على مورد أقوى مع إبقاء الإمداد مستقرًا.'),
    contract: L('isc-design', 'Stabilising long-term terms while a second source is built; no exclusivity beyond need.', 'شروط طويلة الأجل مثبّتة أثناء بناء مصدر ثانٍ؛ ولا حصرية تتجاوز الحاجة.'),
    monitorExit: L('isc-design', 'Share of volume moved to the second source, against a dated plan.', 'نسبة الحجم المنقول إلى المصدر الثاني مقابل خطة مؤرخة.'),
  },
};

/** An unclassified sub-type falls back to the quadrant playbook. */
export function playbookFor(subtype: SubtypeKey, quadrant: Quadrant): PlaybookView {
  const q = QUADRANT_OF[subtype] ?? quadrant;
  const base = BASE[q];
  const x = EXTRA[subtype];
  return {
    subtype, quadrant: q,
    objective: x ? [x.objective, ...base.objective] : base.objective,
    supplierView: base.supplierView,
    dueDiligence: DD_DEPTH[q],
    contract: x ? [x.contract, ...base.contract] : base.contract,
    monitorExit: x ? [x.monitorExit, ...base.monitorExit] : base.monitorExit,
  };
}

/** Next due-diligence reassessment date for a quadrant, from a last-done ISO date. null when only at renewal or incident. */
export function nextDdDate(quadrant: Quadrant, lastIso: string, overrideMonths?: number | null): string | null {
  const months = overrideMonths === undefined ? DD_DEPTH[quadrant].cadenceMonths : overrideMonths;
  if (months === null || months <= 0) return null;
  const d = new Date(`${lastIso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Item 12: guardrails
// ---------------------------------------------------------------------------

export interface Guardrail { text: Bilingual; basis: 'sourced' | 'isc-design'; source: Bilingual }

export const GUARDRAILS: Guardrail[] = [
  {
    text: b('Kraljic was designed for purchased items. A supplier that supplies several items can sit in several quadrants: judge each item, then roll up to the supplier.', 'صُمّم نموذج Kraljic للبنود المشتراة. المورد الذي يورّد عدة بنود قد يقع في عدة أرباع: قيّم كل بند ثم اجمع على مستوى المورد.'),
    basis: 'isc-design', source: b('Hackett, PwC and Umbrex units of analysis (secondary).', 'وحدات التحليل لدى Hackett وPwC وUmbrex (مصادر ثانوية).'),
  },
  {
    text: b('Treat playbooks and levers as advisory and additive, not one fixed action per box.', 'تعامل مع أدلة العمل والروافع كإرشاد يُضاف بعضه إلى بعض، لا كإجراء ثابت واحد لكل مربع.'),
    basis: 'sourced', source: b('Hesping & Schiele; Scholten 2024.', 'Hesping وSchiele؛ Scholten 2024.'),
  },
  {
    text: b('No published study shows that segmenting suppliers improves cost, risk or performance. Association is not proof of benefit.', 'لا توجد دراسة منشورة تثبت أن تقسيم الموردين يحسّن التكلفة أو المخاطر أو الأداء. الارتباط ليس دليلًا على الفائدة.'),
    basis: 'sourced', source: b('Plan section 6: empirical evidence and the explicit gap.', 'القسم 6 من الخطة: الأدلة التجريبية والفجوة المعلنة.'),
  },
  {
    text: b('A label must change a decision. If two sub-types lead to the same action, merge them.', 'يجب أن يغيّر التصنيف قرارًا. إذا أدى نوعان فرعيان إلى الإجراء نفسه فادمجهما.'),
    basis: 'isc-design', source: b('TechTarget argument; ISC design rule.', 'حجة TechTarget؛ قاعدة تصميم من آي سبلاي تشين.'),
  },
  {
    text: b('Sub-types, thresholds and intervals are ISC conventions you can calibrate. They are not CIPS or ISM content.', 'الأنواع الفرعية والعتبات والفترات اصطلاحات من آي سبلاي تشين يمكنك معايرتها. وهي ليست من محتوى CIPS أو ISM.'),
    basis: 'isc-design', source: b('ISC method note.', 'ملاحظة منهجية آي سبلاي تشين.'),
  },
];

// ---------------------------------------------------------------------------
// Item 13: savings and TCO rules
// ---------------------------------------------------------------------------

export const SAVINGS_RULES: Array<{ text: Bilingual; basis: 'sourced' | 'inference' }> = [
  { text: b('A saving is measured against a declared baseline price, not against a number chosen afterwards.', 'يُقاس الوفر مقابل سعر أساس معلن مسبقًا، لا مقابل رقم يُختار لاحقًا.'), basis: 'sourced' },
  { text: b('Cost avoidance is not a saving. Report it on its own line.', 'تجنّب التكلفة ليس وفرًا. اعرضه في سطر مستقل.'), basis: 'sourced' },
  { text: b('Show the in-year and the full-year effect separately.', 'اعرض أثر السنة الحالية وأثر السنة الكاملة منفصلين.'), basis: 'sourced' },
  { text: b('Tie the figure to finance records, and state that quality is unchanged.', 'اربط الرقم بسجلات المالية، وبيّن أن الجودة لم تتغير.'), basis: 'sourced' },
  { text: b('Use total cost of ownership as the base for Critical and Bottleneck items.', 'اعتمد إجمالي تكلفة الملكية أساسًا للبنود الحرجة وبنود الاختناق.'), basis: 'inference' },
];

/** TCO is the base for Critical and Bottleneck items (an inference from CIPS, shown as such). */
export function tcoRequired(q: Quadrant): boolean { return q === 'strategic' || q === 'bottleneck'; }

export interface SavingsInput {
  baselineUnitPrice: number;
  newUnitPrice: number;
  annualVolume: number;
  /** Months of the financial year in which the new price applies (0..12). */
  monthsInYear: number;
  /** Price rise avoided versus the baseline, per unit (cost avoidance, never a saving). */
  avoidedIncreasePerUnit?: number;
}
export interface SavingsResult {
  fullYearSaving: number;
  inYearSaving: number;
  /** A negative saving means the price went up: shown as an increase, not a saving. */
  isIncrease: boolean;
  costAvoidanceFullYear: number;
  valid: boolean;
}

export function computeSavings(i: SavingsInput): SavingsResult {
  const ok = [i.baselineUnitPrice, i.newUnitPrice, i.annualVolume, i.monthsInYear].every((n) => Number.isFinite(n))
    && i.baselineUnitPrice >= 0 && i.newUnitPrice >= 0 && i.annualVolume >= 0 && i.monthsInYear >= 0 && i.monthsInYear <= 12;
  if (!ok) return { fullYearSaving: 0, inYearSaving: 0, isIncrease: false, costAvoidanceFullYear: 0, valid: false };
  const full = (i.baselineUnitPrice - i.newUnitPrice) * i.annualVolume;
  const avoid = Math.max(0, i.avoidedIncreasePerUnit ?? 0) * i.annualVolume;
  return {
    fullYearSaving: Math.round(full * 100) / 100,
    inYearSaving: Math.round(full * (i.monthsInYear / 12) * 100) / 100,
    isIncrease: full < 0,
    costAvoidanceFullYear: Math.round(avoid * 100) / 100,
    valid: true,
  };
}
