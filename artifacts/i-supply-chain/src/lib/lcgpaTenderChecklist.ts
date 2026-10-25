// Module 08 -- tender-drafting checklist for a government entity (Art. 7 of the Local Content Preference Regulation, plus the articles it points to).
// SOURCE: Arabic regulation text, Arts 3, 4, 6, 7, 9, 14-27, read by ISC on 25 Oct 2026. Each item cites the article it comes from.
// This is a drafting aid derived from the regulation's own list; it adds no thresholds. The high-value contract value is set by LCGPA with the
// Spending Efficiency Center (Art. 3(1)) -- ISC does not state a number here.
export type TenderKind = 'supply' | 'works-services' | 'mixed';
export interface TenderItem { id: string; article: string; en: string; ar: string; applies: (c: TenderContext) => boolean }
export interface TenderContext { kind: TenderKind; highValue: boolean; framework: boolean; hasMandatoryListItems: boolean }

const always = () => true;
export const TENDER_CHECKLIST: TenderItem[] = [
  { id: 'ml-statement', article: 'Art. 7(1)', applies: c => c.hasMandatoryListItems,
    en: 'State which items are on the Mandatory List.', ar: 'بيان بالمنتجات المدرجة ضمن القائمة الإلزامية.' },
  { id: 'ml-exclusion', article: 'Art. 9(1)', applies: c => c.hasMandatoryListItems && c.kind !== 'works-services',
    en: 'Say that a bid not complying with the Mandatory List is excluded (only the non-complying items if the tender is divisible), except for items granted an exemption.', ar: 'النص على استبعاد العرض غير الملتزم بالقائمة الإلزامية (أو البنود المخالفة فقط إذا كانت المنافسة قابلة للتجزئة) عدا ما استُثني.' },
  { id: 'mechanisms', article: 'Art. 7(2)', applies: always,
    en: 'List the local-content mechanisms required for this tender.', ar: 'بيان آليات المحتوى المحلي المطلوبة في المنافسة.' },
  { id: 'terms', article: 'Art. 7(3)', applies: always,
    en: 'State the terms and the criteria by which bids are evaluated under each mechanism.', ar: 'الشروط والأحكام الخاصة بآليات المحتوى المحلي والمعايير التي تُقيَّم بموجبها العروض.' },
  { id: 'exclusion-no-target', article: 'Art. 7(4)', applies: c => c.highValue,
    en: 'Say that a bidder who does not state its target local-content percentage in the technical offer is excluded (weight or minimum mechanism).', ar: 'النص على استبعاد المتنافس الذي لا يحدد نسبة المحتوى المحلي المستهدفة في عرضه الفني (آلية الوزن أو الحد الأدنى).' },
  { id: 'price-pref', article: 'Arts 10-11', applies: c => c.kind !== 'works-services',
    en: 'Supply items: apply the national-product price preference and the adjusted-bid formula; bidders must mark national or foreign items in the bill of quantities, or the items count as foreign (Art. 11(3)).', ar: 'بنود التوريد: تطبيق التفضيل السعري للمنتج الوطني ومعادلة القيمة المعدلة؛ وعلى المتنافس بيان وطنية/أجنبية المنتجات في جدول الكميات وإلا عُدّت أجنبية (م١١/٣).' },
  { id: 'sme', article: 'Art. 4(2)', applies: c => c.kind !== 'supply' && !c.highValue,
    en: 'Non-supply, below high value: give local SMEs the price preference (other bids are assumed higher by the stated percentage, up to 10%).', ar: 'غير التوريد ودون القيمة العالية: منح المنشآت الصغيرة والمتوسطة المحلية التفضيل السعري (بافتراض ارتفاع أسعار الآخرين بالنسبة المحددة وبحد ١٠٪).' },
  { id: 'weight', article: 'Arts 14, 17', applies: c => c.highValue && c.kind === 'supply',
    en: 'Weight mechanism: financial score = price 60% and baseline + target + listed-company points 40%; state the baseline certificate rule (Art. 15) and the plan and reports duty.', ar: 'آلية الوزن: الدرجة المالية = السعر ٦٠٪ والخط الأساس والمستهدف والإدراج ٤٠٪؛ وبيان شرط شهادة المحتوى المحلي (م١٥) وواجب الخطة والتقارير.' },
  { id: 'award-gap', article: 'Art. 19', applies: always,
    en: 'State the award rule: highest score, provided the price gap to the lowest technically qualified bid does not exceed 10% (unless a different figure is set and stated).', ar: 'بيان قاعدة الترسية: الأعلى تقييماً بشرط ألا يزيد فارق السعر على ٪١٠ عن أقل عرض مؤهل فنياً (ما لم تُحدَّد نسبة أخرى وتُذكر).' },
  { id: 'minimum', article: 'Arts 23-25', applies: c => c.highValue && c.kind !== 'supply',
    en: 'High-value non-supply: run the minimum-content study, get it approved (15 working days) and state the minimum; a target below it is excluded at technical evaluation.', ar: 'عقد عالي القيمة غير توريد: إجراء دراسة الحد الأدنى واعتمادها (١٥ يوم عمل) وذكر الحد؛ ويُستبعد من قدّم نسبة أدنى منه في التقييم الفني.' },
  { id: 'mixed', article: 'Art. 4(4)', applies: c => c.kind === 'mixed',
    en: 'Mixed tender: apply the mechanisms by the predominant items by value if the parts are not separable; if separable, apply them to each part.', ar: 'منافسة مختلطة: تُطبَّق الآليات حسب البنود الغالبة قيمةً إذا لم تنفصل الأجزاء، وعلى كل جزء إن انفصلت.' },
  { id: 'plan', article: 'Arts 20, 26', applies: c => c.highValue,
    en: 'Require the gradual local-content plan within 60 days of award, consistent with the target.', ar: 'اشتراط الخطة التدرجية للمحتوى المحلي خلال ٦٠ يوماً من الترسية وبما يتوافق مع المستهدف.' },
  { id: 'reports', article: 'Arts 13, 21, 22', applies: always,
    en: 'Set the report schedule: periodic reports (supply: every three months or as the tender states) and the final report within 30 days of contract end (supply) or as set for other contracts; state who approves them.', ar: 'تحديد جدول التقارير: الدورية (التوريد: كل ثلاثة أشهر أو بحسب الوثائق) والنهائي خلال ٣٠ يوماً من نهاية عقد التوريد أو بحسب ما يحدد لغيره، وجهة الموافقة عليها.' },
  { id: 'penalties', article: 'Arts 28-34', applies: always,
    en: 'State the penalty rates and how they are calculated (the regulation gives ceilings only and says the tender documents give the detail). Disclose any increase approved by the Minister before bids are submitted.', ar: 'بيان نسب الغرامات وطريقة احتسابها (تضع اللائحة حدوداً قصوى وتحيل التفصيل إلى وثائق المنافسة) والإفصاح عن أي زيادة بموافقة الوزير قبل تقديم العروض.' },
  { id: 'framework', article: 'Art. 3(3)-(4)', applies: c => c.framework,
    en: 'Framework agreement: the local-content requirements and how they are met go in the tender documents; the expected total value counts as the estimated cost.', ar: 'اتفاقية إطارية: تحدد وثائق المنافسة متطلبات المحتوى المحلي وكيفية تنفيذها، ويُعد إجمالي القيمة المتوقعة تكلفة تقديرية.' },
  { id: 'review-hv', article: 'Art. 6(2)', applies: c => c.highValue,
    en: 'High-value tenders: the unified purchasing authority sends the tender documents and estimated values to LCGPA for review of the local-content terms.', ar: 'المنافسات عالية القيمة: ترسل جهة الشراء الموحد وثائق المنافسة والقيم التقديرية إلى الهيئة لمراجعة شروط المحتوى المحلي.' },
  { id: 'review', article: 'Art. 6(3)', applies: c => !c.highValue,
    en: 'For tenders LCGPA designates, submit the documents to LCGPA for review; it replies within 15 days.', ar: 'للمنافسات التي تحددها الهيئة: عرض الوثائق على الهيئة للمراجعة، وترد خلال ١٥ يوماً.' },
];

export function checklistFor(c: TenderContext): TenderItem[] {
  return TENDER_CHECKLIST.filter(i => i.applies(c));
}
export const TENDER_SOURCE = {
  en: 'Local Content Preference Regulation (Cabinet Decision 245, 29/3/1441H), Arts 3, 4, 6, 7, 9-25 as read by ISC on 25 Oct 2026. The high-value contract value is set by LCGPA with the Spending Efficiency Center (Art. 3). A drafting aid, not legal advice.',
  ar: 'لائحة تفضيل المحتوى المحلي (قرار مجلس الوزراء 245 في 29/3/1441هـ)، المواد 3 و4 و6 و7 و9-25 كما اطلعت عليها المنصة في 25 أكتوبر 2026. قيمة العقد العالي القيمة تحددها الهيئة مع مركز كفاءة الإنفاق (م٣). أداة صياغة وليست استشارة قانونية.',
};
