/**
 * Sector-specific sample risks for the Risk Management page explorer (backlog #890).
 * 64 risks, 8 per industry sector. Each sector shows 7 of its own plus 3 common risks (R1 to R20).
 * Likelihood and impact are ISC sample values on a 1 to 5 scale, not measurements. The choice and order are ISC judgement.
 * Evidence kind says what the source can and cannot support. Arabic names are reviewed, not certified by a native reader (#887).
 */
import type { HeatMapRisk, Bi } from './riskPageData';

export type EvidenceKind = 'measured' | 'survey' | 'case' | 'estimate' | 'policy';
export type SourceType = 'official' | 'analyst' | 'academic';

export interface SectorRisk extends HeatMapRisk { sectorId: string; sourceType: SourceType; evidenceKind: EvidenceKind; inTopTen: boolean }

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, { name: Bi; use: Bi }> = {
  measured: { name: { en: 'Measured data', ar: 'بيانات مقيسة' }, use: { en: 'supports the size of the risk', ar: 'تدعم حجم الخطر' } },
  survey: { name: { en: 'Practitioner survey', ar: 'استطلاع ممارسين' }, use: { en: 'supports which causes matter, not how often it happens', ar: 'تدعم أي الأسباب أهم، لا عدد مرات الحدوث' } },
  case: { name: { en: 'Single case', ar: 'حالة منفردة' }, use: { en: 'illustrates only; says nothing about how common it is', ar: 'توضّح فقط ولا تقول مدى شيوعه' } },
  estimate: { name: { en: 'Market estimate', ar: 'تقدير سوق' }, use: { en: 'indicative only; method often not published', ar: 'استرشادي فقط، والمنهج غالبا غير منشور' } },
  policy: { name: { en: 'Policy, audit or regulation', ar: 'سياسة أو تدقيق أو تنظيم' }, use: { en: 'supports that the rule or finding exists', ar: 'تدعم وجود القاعدة أو النتيجة' } },
};

export const SOURCE_TYPE_LABEL: Record<SourceType, Bi> = {
  official: { en: 'Official source', ar: 'مصدر رسمي' },
  analyst: { en: 'Analyst, press or industry body', ar: 'محللون أو صحافة أو هيئة قطاعية' },
  academic: { en: 'Academic source', ar: 'مصدر أكاديمي' },
};

export const SECTOR_RISKS: SectorRisk[] = [
  { id: "PH1", sectorId: "pharma", name: "Active ingredient (API) made at one plant or in one country", nameAr: "مادة فعّالة (API) تُصنَّع في مصنع واحد أو بلد واحد", l: 3, i: 5, cat: 4, sourceType: "official", evidenceKind: "survey", inTopTen: true },
  { id: "PH2", sectorId: "pharma", name: "Quality failure at a sole-source generic maker causes a shortage", nameAr: "فشل جودة لدى مصنّع جنيس وحيد المصدر يسبب نقصًا", l: 3, i: 5, cat: 4, sourceType: "official", evidenceKind: "survey", inTopTen: true },
  { id: "PH3", sectorId: "pharma", name: "Cold-chain temperature excursion on a heat-sensitive product", nameAr: "خروج درجة حرارة سلسلة التبريد عن النطاق لمنتج حساس للحرارة", l: 3, i: 4, cat: 1, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "PH4", sectorId: "pharma", name: "Falsified, stolen or diverted product enters the chain", nameAr: "دخول منتج مزوّر أو مسروق أو محوَّل إلى السلسلة", l: 2, i: 5, cat: 3, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "PH5", sectorId: "pharma", name: "Registration or import-permit delay with the regulator (for example SFDA)", nameAr: "تأخّر التسجيل أو تصريح الاستيراد لدى الجهة التنظيمية (مثل هيئة الغذاء والدواء السعودية)", l: 3, i: 4, cat: 3, sourceType: "academic", evidenceKind: "measured", inTopTen: true },
  { id: "PH6", sectorId: "pharma", name: "Price caps or tender prices make a product unprofitable to supply", nameAr: "تسعير محدّد السقف أو أسعار المناقصات تجعل توريد المنتج غير مربح", l: 3, i: 4, cat: 2, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "PH7", sectorId: "pharma", name: "A therapy class supplied by very few companies", nameAr: "فئة علاجية يوفّرها عدد قليل جدًا من الشركات", l: 2, i: 5, cat: 4, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "PH8", sectorId: "pharma", name: "Short shelf life leads to expiry write-offs of stocked product", nameAr: "قِصر مدة الصلاحية يؤدي إلى شطب المخزون منتهي الصلاحية", l: 3, i: 3, cat: 1, sourceType: "academic", evidenceKind: "measured", inTopTen: false },
  { id: "EN1", sectorId: "energy", name: "Closure or restriction of a chokepoint (Strait of Hormuz, Bab el-Mandeb)", nameAr: "إغلاق أو تقييد ممر بحري ضيق (مضيق هرمز، باب المندب)", l: 2, i: 5, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "EN2", sectorId: "energy", name: "Attack or damage on production, refining or LNG facilities", nameAr: "هجوم أو ضرر على منشآت الإنتاج أو التكرير أو الغاز المسال", l: 2, i: 5, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "EN3", sectorId: "energy", name: "Long-lead equipment backlog (large turbines, LNG compressors)", nameAr: "تراكم طلبات المعدات طويلة المهلة (توربينات كبيرة، ضواغط الغاز المسال)", l: 4, i: 4, cat: 4, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "EN4", sectorId: "energy", name: "Ransomware or intrusion crosses from office systems into control systems", nameAr: "برمجيات فدية أو اختراق ينتقل من أنظمة المكاتب إلى أنظمة التحكم", l: 3, i: 5, cat: 7, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "EN5", sectorId: "energy", name: "Planned shutdown (turnaround) overruns from contractor or spares delay", nameAr: "تجاوز مدة الإيقاف الشامل المخطط بسبب تأخّر المقاولين أو قطع الغيار", l: 3, i: 4, cat: 1, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "EN6", sectorId: "energy", name: "Skilled contractors and welders scarce, contested across projects", nameAr: "ندرة المقاولين واللحّامين المهرة وتنافس المشاريع عليهم", l: 3, i: 3, cat: 1, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "EN7", sectorId: "energy", name: "Sanctions or export-control breach on equipment or counterparties", nameAr: "خرق العقوبات أو ضوابط التصدير على معدات أو أطراف", l: 2, i: 4, cat: 3, sourceType: "official", evidenceKind: "policy", inTopTen: false },
  { id: "EN8", sectorId: "energy", name: "Critical spare for rotating equipment out of stock", nameAr: "نفاد قطعة غيار حرجة للمعدات الدوّارة", l: 3, i: 4, cat: 1, sourceType: "analyst", evidenceKind: "case", inTopTen: true },
  { id: "LG1", sectorId: "logistics", name: "Carrier or alliance collapse strands cargo", nameAr: "انهيار ناقل أو تحالف ملاحي يتسبب في تقطّع السبل بالبضائع", l: 2, i: 5, cat: 4, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "LG2", sectorId: "logistics", name: "Import paperwork or clearance hold keeps cargo at the port", nameAr: "احتجاز البضاعة في الميناء بسبب أوراق الاستيراد أو التخليص", l: 3, i: 3, cat: 3, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "LG3", sectorId: "logistics", name: "Route diversion adds voyage time and cost", nameAr: "تحويل المسار يزيد مدة الرحلة وتكلفتها", l: 4, i: 3, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "LG4", sectorId: "logistics", name: "One warehouse holds most of the stock and burns or floods", nameAr: "مستودع واحد يحتوي معظم المخزون ويتعرض للحريق أو الفيضان", l: 2, i: 5, cat: 1, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "LG5", sectorId: "logistics", name: "Trucking or driver capacity shortage", nameAr: "نقص طاقة الشاحنات أو السائقين", l: 3, i: 3, cat: 1, sourceType: "analyst", evidenceKind: "survey", inTopTen: true },
  { id: "LG6", sectorId: "logistics", name: "Empty-container or equipment shortage", nameAr: "نقص الحاويات الفارغة أو المعدات", l: 3, i: 3, cat: 1, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "LG7", sectorId: "logistics", name: "Freight-rate spike on fixed-price contracts", nameAr: "قفزة أسعار الشحن على عقود بسعر ثابت", l: 4, i: 3, cat: 2, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "LG8", sectorId: "logistics", name: "Cyber attack on transport or warehouse systems", nameAr: "هجوم سيبراني على أنظمة النقل أو المستودعات", l: 2, i: 4, cat: 7, sourceType: "official", evidenceKind: "case", inTopTen: false },
  { id: "RT1", sectorId: "retail", name: "Promoted or seasonal line out of stock on the shelf", nameAr: "نفاد خط ترويجي أو موسمي على الرف", l: 4, i: 3, cat: 1, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "RT2", sectorId: "retail", name: "Seasonal-peak forecast miss (for example Ramadan, Eid, back to school)", nameAr: "خطأ توقّع ذروة موسمية (مثل رمضان والعيد وبدء الدراسة)", l: 4, i: 3, cat: 1, sourceType: "analyst", evidenceKind: "survey", inTopTen: true },
  { id: "RT3", sectorId: "retail", name: "Private-label supplier fails or cuts quality", nameAr: "إخفاق مورّد العلامة الخاصة أو خفضه الجودة", l: 3, i: 4, cat: 4, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "RT4", sectorId: "retail", name: "Expiry or shelf-life write-off of dated stock", nameAr: "شطب مخزون منتهي الصلاحية أو قريب الانتهاء", l: 3, i: 3, cat: 1, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "RT5", sectorId: "retail", name: "Inaccurate stock records hide shortages", nameAr: "سجلات مخزون غير دقيقة تخفي النقص", l: 3, i: 3, cat: 1, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "RT6", sectorId: "retail", name: "Supplier misses delivery windows to the distribution centre", nameAr: "تخلّف المورّد عن نوافذ التسليم لمركز التوزيع", l: 3, i: 3, cat: 4, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "RT7", sectorId: "retail", name: "Counterfeit or grey-market goods reach the shelf", nameAr: "وصول سلع مقلّدة أو من السوق الرمادي إلى الرف", l: 2, i: 4, cat: 3, sourceType: "official", evidenceKind: "measured", inTopTen: false },
  { id: "RT8", sectorId: "retail", name: "One supplier or brand holds a large share of a category", nameAr: "مورّد أو علامة واحدة تستحوذ على حصة كبيرة من فئة", l: 2, i: 4, cat: 4, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "MF1", sectorId: "manufacturing", name: "One missing component, such as a chip, stops the line", nameAr: "نقص مكوّن واحد، مثل شريحة، يوقف خط الإنتاج", l: 3, i: 5, cat: 4, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "MF2", sectorId: "manufacturing", name: "Hidden tier-2 supplier dependency", nameAr: "اعتماد خفي على مورّد من المستوى الثاني", l: 3, i: 4, cat: 4, sourceType: "analyst", evidenceKind: "survey", inTopTen: true },
  { id: "MF3", sectorId: "manufacturing", name: "Sole-source tooling or dies held by one supplier", nameAr: "قوالب أو أدوات وحيدة المصدر لدى مورّد واحد", l: 2, i: 5, cat: 4, sourceType: "analyst", evidenceKind: "policy", inTopTen: true },
  { id: "MF4", sectorId: "manufacturing", name: "Spare-parts shortage for plant equipment", nameAr: "نقص قطع غيار معدات المصنع", l: 3, i: 4, cat: 1, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "MF5", sectorId: "manufacturing", name: "Raw-material price swing on fixed-price orders", nameAr: "تقلّب أسعار المواد الخام على طلبات بسعر ثابت", l: 4, i: 3, cat: 2, sourceType: "official", evidenceKind: "measured", inTopTen: false },
  { id: "MF6", sectorId: "manufacturing", name: "Supplier quality escape stops incoming goods", nameAr: "تسرّب عيب جودة من المورّد يوقف استلام البضائع", l: 3, i: 4, cat: 1, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "MF7", sectorId: "manufacturing", name: "Utility or power interruption stops a plant", nameAr: "انقطاع الكهرباء أو المرافق يوقف المصنع", l: 2, i: 5, cat: 1, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "MF8", sectorId: "manufacturing", name: "Cyber attack stops production", nameAr: "هجوم سيبراني يوقف الإنتاج", l: 2, i: 5, cat: 7, sourceType: "analyst", evidenceKind: "case", inTopTen: true },
  { id: "GV1", sectorId: "government", name: "A strategic supplier fails mid-contract", nameAr: "إخفاق مورّد استراتيجي أثناء تنفيذ العقد", l: 2, i: 5, cat: 4, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "GV2", sectorId: "government", name: "Local-content commitment missed and the bidder is disqualified", nameAr: "الإخفاق في التزام المحتوى المحلي واستبعاد مقدّم العرض", l: 3, i: 4, cat: 3, sourceType: "analyst", evidenceKind: "policy", inTopTen: true },
  { id: "GV3", sectorId: "government", name: "Single-bidder tender weakens competition", nameAr: "مناقصة بمتقدّم وحيد تُضعف المنافسة", l: 3, i: 3, cat: 0, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "GV4", sectorId: "government", name: "Late payment to suppliers pushes them into distress", nameAr: "تأخّر الدفع للموردين يدفعهم إلى التعثّر", l: 3, i: 4, cat: 2, sourceType: "official", evidenceKind: "survey", inTopTen: true },
  { id: "GV5", sectorId: "government", name: "Fraud or collusion in tendering", nameAr: "احتيال أو تواطؤ في المناقصات", l: 2, i: 5, cat: 3, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "GV6", sectorId: "government", name: "Tender challenge or cancellation delays an award", nameAr: "الطعن في المناقصة أو إلغاؤها يؤخر الترسية", l: 3, i: 3, cat: 3, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "GV7", sectorId: "government", name: "Lock-in to one supplier of a critical system", nameAr: "الارتباط بمورّد واحد لنظام حرج", l: 3, i: 4, cat: 4, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "GV8", sectorId: "government", name: "Budget-cycle delay or cut halts a running contract", nameAr: "تأخّر دورة الميزانية أو خفضها يوقف عقدًا قائمًا", l: 3, i: 3, cat: 2, sourceType: "official", evidenceKind: "policy", inTopTen: false },
  { id: "FB1", sectorId: "food", name: "Contamination leads to a recall", nameAr: "تلوّث يؤدي إلى استدعاء المنتج", l: 2, i: 5, cat: 5, sourceType: "official", evidenceKind: "case", inTopTen: true },
  { id: "FB2", sectorId: "food", name: "Import consignment refused at the border for eligibility or paperwork", nameAr: "رفض شحنة مستوردة عند الحدود لعدم الأهلية أو لنقص الأوراق", l: 3, i: 4, cat: 3, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "FB3", sectorId: "food", name: "Animal-disease outbreak triggers an import or export ban", nameAr: "تفشّي مرض حيواني يؤدي إلى حظر استيراد أو تصدير", l: 2, i: 4, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "FB4", sectorId: "food", name: "Weather or El Nino yield shock on a key crop", nameAr: "صدمة محصول بسبب الطقس أو ظاهرة النينيو لمحصول رئيسي", l: 3, i: 4, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "FB5", sectorId: "food", name: "Cold-chain break on chilled or frozen food", nameAr: "انقطاع سلسلة التبريد للأغذية المبردة أو المجمّدة", l: 3, i: 4, cat: 1, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "FB6", sectorId: "food", name: "Halal certification lost or questioned on an ingredient", nameAr: "فقدان شهادة الحلال لمكوّن أو الطعن فيها", l: 2, i: 5, cat: 3, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "FB7", sectorId: "food", name: "Black Sea or grain-route shipping disruption", nameAr: "اضطراب شحن البحر الأسود أو مسارات الحبوب", l: 3, i: 4, cat: 6, sourceType: "official", evidenceKind: "measured", inTopTen: true },
  { id: "FB8", sectorId: "food", name: "Short shelf life leads to write-offs", nameAr: "قِصر مدة الصلاحية يؤدي إلى الشطب", l: 3, i: 3, cat: 1, sourceType: "official", evidenceKind: "measured", inTopTen: false },
  { id: "CN1", sectorId: "construction", name: "Subcontractor defaults or underperforms", nameAr: "تخلّف مقاول الباطن أو ضعف أدائه", l: 3, i: 4, cat: 4, sourceType: "academic", evidenceKind: "measured", inTopTen: true },
  { id: "CN2", sectorId: "construction", name: "Contractor goes insolvent mid-project", nameAr: "إعسار المقاول أثناء المشروع", l: 3, i: 5, cat: 4, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "CN3", sectorId: "construction", name: "Steel, cement or materials price swing", nameAr: "تقلّب أسعار الحديد أو الإسمنت أو المواد", l: 4, i: 3, cat: 2, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "CN4", sectorId: "construction", name: "Imported materials lead time slips", nameAr: "تأخّر مهلة المواد المستوردة", l: 3, i: 4, cat: 4, sourceType: "academic", evidenceKind: "survey", inTopTen: true },
  { id: "CN5", sectorId: "construction", name: "Design errors and omissions cause rework and delay", nameAr: "أخطاء التصميم وإغفالاته تسبب إعادة العمل والتأخير", l: 3, i: 4, cat: 1, sourceType: "official", evidenceKind: "policy", inTopTen: true },
  { id: "CN6", sectorId: "construction", name: "Permit or approval delay", nameAr: "تأخّر التصريح أو الموافقة", l: 3, i: 3, cat: 3, sourceType: "official", evidenceKind: "measured", inTopTen: false },
  { id: "CN7", sectorId: "construction", name: "Large project finishes late and over budget", nameAr: "تأخّر مشروع كبير عن موعده وتجاوزه الميزانية", l: 4, i: 4, cat: 0, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
  { id: "CN8", sectorId: "construction", name: "Client payment delay slows the supply chain", nameAr: "تأخّر دفع العميل يبطئ سلسلة الإمداد", l: 3, i: 4, cat: 2, sourceType: "analyst", evidenceKind: "estimate", inTopTen: true },
];
