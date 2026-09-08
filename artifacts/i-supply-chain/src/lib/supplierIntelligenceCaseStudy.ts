/**
 * ISC Supplier Intelligence Engine -- Illustrative Case Study
 *
 * Module 00 (SI-00-Charter.md, 7 Sep 2026). Purely synthetic, client-side-
 * only, never fetched from or written to the backend -- same convention as
 * IndustryBenchmark.tsx's DEMO_ROWS (#398b, 30 Aug 2026): illustrative data
 * exists only to show what this engine's output looks like once a real
 * client has populated it, and must never be presented as, or mistaken
 * for, a real ISC client. Any UI that renders this data MUST show
 * ILLUSTRATIVE_BANNER_EN/AR persistently, the same way IndustryBenchmark's
 * demo mode does, not as a one-time dismissible notice.
 *
 * Kept as a shared lib file rather than colocated in one page (unlike
 * DEMO_ROWS, which only IndustryBenchmark.tsx consumes) because this case
 * study is designed to be reused across every Supplier Intelligence module
 * page as each one is built (Modules 02, 03, 05, 07, 10, 11 all reference
 * it in their own spec docs) -- one consistent story, not sixteen
 * disconnected mocked screenshots. This is the same synthetic-data
 * discipline #398b established, applied to a multi-consumer case instead
 * of a single-page one.
 *
 * The portfolio is deliberately imperfect -- unresolved evidence gaps, one
 * entity-resolution finding, one common-mode dependency cluster, one full
 * performance-to-intervention cycle -- because a too-clean demo would
 * undersell exactly what this engine exists to surface. See SI-00-
 * Charter.md's "Illustrative Case Study company" section for the narrative
 * this file makes concrete in code.
 *
 * 8 Sep 2026 enhancement: Precision Motors Co.'s performance narrative is
 * now backed by typed `performanceHistory` and `linkedCarId` fields
 * matching SI-07-Performance-Development-Recovery.md's output schema
 * exactly (scorecardDimension, level, trend, cause) -- so when Module 07 is
 * actually built, this fixture is ready to render directly rather than
 * needing new mock data invented at build time.
 */

export const ILLUSTRATIVE_BANNER_EN =
  'Illustrative Case Study — Rawabi Advanced Industries is a fictional composite, not a real ISC client. Shown to demonstrate how this engine works once your own supplier data is entered.';

export const ILLUSTRATIVE_BANNER_AR =
  'مثال توضيحي — "روابي للصناعات المتقدمة" شركة افتراضية مركّبة وليست عميلاً حقيقيًا لدى I Supply Chain. تُعرض لتوضيح كيفية عمل هذا المحرك بمجرد إدخال بيانات موردينك الفعلية.';

export interface IllustrativeOrganization {
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  industry: string;
  industryAr: string;
  employeeCount: number;
  exportMarkets: string[];
}

export const ILLUSTRATIVE_ORGANIZATION: IllustrativeOrganization = {
  name: 'Rawabi Advanced Industries',
  nameAr: 'روابي للصناعات المتقدمة',
  city: 'Dammam, Saudi Arabia',
  cityAr: 'الدمام، المملكة العربية السعودية',
  industry: 'Industrial packaging and HVAC component manufacturing',
  industryAr: 'تصنيع مواد التعبئة الصناعية ومكونات التكييف',
  employeeCount: 420,
  exportMarkets: ['UAE', 'Qatar', 'Bahrain', 'Egypt'],
};

export type KraljicQuadrant = 'Strategic' | 'Leverage' | 'Bottleneck' | 'Non-critical';
export type EvidenceConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'UNVERIFIED';
export type SupplierRole = 'manufacturer' | 'authorized-distributor' | 'trader' | 'agent';

export type ScorecardDimensionId = 'delivery' | 'quality' | 'cost' | 'compliance' | 'innovation' | 'relationship';
export type PerformanceCause = 'supplier' | 'client' | 'shared' | 'external' | 'measurement';

/** Mirrors SI-07's performanceRecord shape (see SI-07-Performance-Development-
 *  Recovery.md's output schema) so this fixture is ready to feed Module 07's
 *  real build directly, not just narrate it in prose. */
export interface IllustrativePerformancePoint {
  period: string;
  scorecardDimension: ScorecardDimensionId;
  level: number;
  trend: 'improving' | 'stable' | 'declining';
  cause: PerformanceCause;
}

export interface IllustrativeSupplier {
  id: string;
  name: string;
  nameAr: string;
  role: SupplierRole;
  category: string;
  categoryAr: string;
  country: string;
  countryAr: string;
  kraljicQuadrant: KraljicQuadrant;
  evidenceConfidence: EvidenceConfidence;
  /** Set when Module 05's entity resolution or common-mode dependency test
   *  found something real about this supplier's true relationships. */
  resolvedParentOf?: string;
  sharedDependencyCluster?: 'jebel-ali-freight-route';
  isSubTierOf?: string;
  narrative?: string;
  narrativeAr?: string;
  /** Module 07 fixture data -- see IllustrativePerformancePoint. Only
   *  populated for the supplier whose full performance-to-intervention
   *  cycle is narrated (Precision Motors Co.), so a real build of Module 07
   *  has a ready, schema-accurate example instead of inventing one fresh. */
  performanceHistory?: IllustrativePerformancePoint[];
  /** The CAR (Corrective Action Request) this supplier's performance issue
   *  is tracked against, per Module 07's "cause is a field on a CAR, not a
   *  parallel taxonomy" reuse decision. */
  linkedCarId?: string;
}

export const ILLUSTRATIVE_SUPPLIERS: IllustrativeSupplier[] = [
  {
    id: 'saudi-aluminum-extrusion',
    name: 'Saudi Aluminum Extrusion Co.',
    nameAr: 'الشركة السعودية لبثق الألمنيوم',
    role: 'manufacturer',
    category: 'Aluminum extrusion (raw material)',
    categoryAr: 'بثق الألمنيوم (مادة خام)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Bottleneck',
    evidenceConfidence: 'MODERATE',
    narrative: 'Sole qualified regional extruder for Rawabi\'s HVAC housing spec. Raised prices 12% citing "aluminum market pricing," though global aluminum prices rose only ~4% in the same period (Module 06\'s commercial check) -- the gap, not the increase itself, is the real finding.',
    narrativeAr: 'المورد الإقليمي الوحيد المؤهل لمواصفة هيكل التكييف لدى روابي. رفع الأسعار 12% متذرعًا بـ"أسعار سوق الألمنيوم"، رغم أن الأسعار العالمية للألمنيوم ارتفعت بنحو 4% فقط في الفترة نفسها -- الفجوة نفسها، لا الارتفاع، هي الاكتشاف الحقيقي.',
  },
  {
    id: 'istanbul-extrusion-alternatives',
    name: 'Istanbul Extrusion Alternatives A.S.',
    nameAr: 'شركة إسطنبول لبدائل البثق',
    role: 'manufacturer',
    category: 'Aluminum extrusion (raw material)',
    categoryAr: 'بثق الألمنيوم (مادة خام)',
    country: 'Turkey',
    countryAr: 'تركيا',
    kraljicQuadrant: 'Bottleneck',
    evidenceConfidence: 'UNVERIFIED',
    narrative: 'Discovered but not yet qualified -- Exit Readiness is false for the sole-source aluminum extrusion dependency until this candidate (or another) clears Module 04\'s gates.',
    narrativeAr: 'مورد مكتشَف لكنه غير مؤهَّل بعد -- مؤشر "الجاهزية للخروج" يبقى سلبيًا لهذا الاعتماد الأحادي المصدر إلى أن يجتاز هذا المرشح (أو غيره) بوابات التأهيل في الوحدة الرابعة.',
  },
  {
    id: 'gulf-resin-industries',
    name: 'Gulf Resin Industries',
    nameAr: 'صناعات الخليج للراتنج',
    role: 'manufacturer',
    category: 'Resin (raw material)',
    categoryAr: 'الراتنج (مادة خام)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Leverage',
    evidenceConfidence: 'HIGH',
  },
  {
    id: 'anatolia-packaging-materials',
    name: 'Anatolia Packaging Materials',
    nameAr: 'مواد الأناضول للتعبئة',
    role: 'manufacturer',
    category: 'Corrugated board (raw material)',
    categoryAr: 'الكرتون المضلع (مادة خام)',
    country: 'Turkey',
    countryAr: 'تركيا',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'MODERATE',
    sharedDependencyCluster: 'jebel-ali-freight-route',
  },
  {
    id: 'emirates-board-carton',
    name: 'Emirates Board & Carton',
    nameAr: 'الإمارات للألواح والكرتون',
    role: 'manufacturer',
    category: 'Corrugated board (raw material)',
    categoryAr: 'الكرتون المضلع (مادة خام)',
    country: 'UAE',
    countryAr: 'الإمارات العربية المتحدة',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'MODERATE',
    sharedDependencyCluster: 'jebel-ali-freight-route',
  },
  {
    id: 'nile-packaging-supplies',
    name: 'Nile Packaging Supplies',
    nameAr: 'إمدادات النيل للتعبئة',
    role: 'trader',
    category: 'Corrugated board (raw material)',
    categoryAr: 'الكرتون المضلع (مادة خام)',
    country: 'Egypt',
    countryAr: 'مصر',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'LOW',
    sharedDependencyCluster: 'jebel-ali-freight-route',
    narrative: 'Registered as a trader, not the manufacturer -- Module 03\'s manufacturer-vs-trader distinction flags this before any manufacturer-level certification is assumed to apply.',
    narrativeAr: 'مسجَّلة كتاجر لا كمُصنِّع -- تمييز "المُصنِّع مقابل التاجر" في الوحدة الثالثة يُنبّه إلى ذلك قبل افتراض انطباق أي شهادة على مستوى المُصنِّع.',
  },
  {
    id: 'dragon-pack-materials',
    name: 'Dragon Pack Materials Ltd.',
    nameAr: 'شركة دراغون باك للمواد',
    role: 'manufacturer',
    category: 'Corrugated board (raw material)',
    categoryAr: 'الكرتون المضلع (مادة خام)',
    country: 'China',
    countryAr: 'الصين',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'MODERATE',
    sharedDependencyCluster: 'jebel-ali-freight-route',
    narrative: 'Four nominally diversified packaging suppliers (Anatolia, Emirates, Nile, Dragon Pack) all route through Jebel Ali -- Module 05\'s common-mode dependency test flags this portfolio as APPARENT DIVERSIFICATION, not real diversification, despite four distinct supplier names and three different countries of origin.',
    narrativeAr: 'أربعة موردي تعبئة يبدون متنوعين اسميًا (الأناضول، الإمارات، النيل، دراغون باك) يمرّون جميعًا عبر ميناء جبل علي -- اختبار الاعتماد المشترك في الوحدة الخامسة يصنّف هذه المحفظة كـ"تنويع ظاهري" لا تنويعًا حقيقيًا، رغم وجود أربعة أسماء موردين مختلفة وثلاث دول منشأ مختلفة.',
  },
  {
    id: 'precision-motors-co',
    name: 'Precision Motors Co.',
    nameAr: 'شركة المحركات الدقيقة',
    role: 'manufacturer',
    category: 'HVAC motors (component)',
    categoryAr: 'محركات التكييف (مكون)',
    country: 'Turkey',
    countryAr: 'تركيا',
    kraljicQuadrant: 'Strategic',
    evidenceConfidence: 'MODERATE',
    narrative: 'On-time delivery declined three quarters running (94% -> 89% -> 83%) at flat order volume. Root cause traced to its own upstream bearing supplier, not Precision Motors itself. Given moderate Lock-In Index and no qualified alternative yet, Module 07 recommends DEVELOP with a named joint corrective-action plan; if the metric doesn\'t recover within two quarters, the recommendation escalates to DUAL_SOURCE.',
    narrativeAr: 'تراجع الالتزام بمواعيد التسليم ثلاثة أرباع سنوية متتالية (94%، ثم 89%، ثم 83%) رغم ثبات حجم الطلبات. يعود السبب الجذري إلى مورد المحامل (البيرنغز) لديها، لا إلى الشركة نفسها. ونظرًا لمؤشر تبعية متوسط وعدم وجود بديل مؤهَّل بعد، توصي الوحدة السابعة بخيار "التطوير" مع خطة تصحيحية مشتركة محددة؛ وإذا لم يتحسن المؤشر خلال ربعين، تتصاعد التوصية إلى "التزويد المزدوج".',
    performanceHistory: [
      { period: 'Q1', scorecardDimension: 'delivery', level: 94, trend: 'stable', cause: 'measurement' },
      { period: 'Q2', scorecardDimension: 'delivery', level: 89, trend: 'declining', cause: 'shared' },
      { period: 'Q3', scorecardDimension: 'delivery', level: 83, trend: 'declining', cause: 'shared' },
    ],
    linkedCarId: 'car-precision-motors-delivery-001',
  },
  {
    id: 'uae-precision-bearings',
    name: 'UAE Precision Bearings LLC',
    nameAr: 'شركة الإمارات للمحامل الدقيقة',
    role: 'manufacturer',
    category: 'Bearings (sub-tier component)',
    categoryAr: 'المحامل (مكون من الدرجة الفرعية)',
    country: 'UAE',
    countryAr: 'الإمارات العربية المتحدة',
    kraljicQuadrant: 'Bottleneck',
    evidenceConfidence: 'LOW',
    isSubTierOf: 'precision-motors-co',
    narrative: 'Sub-tier dependency Module 03 had not resolved until the Precision Motors investigation -- Rawabi\'s real exposure to this supplier was invisible in the client\'s own spreadsheet.',
    narrativeAr: 'اعتماد من الدرجة الفرعية لم تكن الوحدة الثالثة قد كشفته حتى تحقيق شركة المحركات الدقيقة -- كان التعرّض الفعلي لروابي لهذا المورد غير مرئي في جدول بيانات العميل نفسه.',
  },
  {
    id: 'al-faisal-fasteners',
    name: 'Al-Faisal Fasteners',
    nameAr: 'الفيصل للمشدّات',
    role: 'manufacturer',
    category: 'Fasteners (component)',
    categoryAr: 'المشدّات (مكون)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Leverage',
    evidenceConfidence: 'HIGH',
  },
  {
    id: 'anatolian-steel-fasteners',
    name: 'Anatolian Steel Fasteners',
    nameAr: 'الأناضول للمشدّات الفولاذية',
    role: 'manufacturer',
    category: 'Fasteners (component)',
    categoryAr: 'المشدّات (مكون)',
    country: 'Turkey',
    countryAr: 'تركيا',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'MODERATE',
  },
  {
    id: 'shenzhen-gasket-manufacturing',
    name: 'Shenzhen Gasket Manufacturing',
    nameAr: 'شنتشن لتصنيع الحشيات',
    role: 'trader',
    category: 'Gaskets (component)',
    categoryAr: 'الحشيات (مكون)',
    country: 'China',
    countryAr: 'الصين',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'LOW',
  },
  {
    id: 'red-sea-freight-forwarders',
    name: 'Red Sea Freight Forwarders',
    nameAr: 'موزعو البحر الأحمر للشحن',
    role: 'agent',
    category: 'Freight forwarding (service)',
    categoryAr: 'الشحن والتخليص (خدمة)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Leverage',
    evidenceConfidence: 'MODERATE',
    resolvedParentOf: 'jeddah-logistics-solutions',
    narrative: 'Listed under a different trading name in the client\'s own spreadsheet than Jeddah Logistics Solutions -- Module 03\'s entity resolution matched both to the same parent group via legal-entity number, a relationship invisible without that check.',
    narrativeAr: 'مُدرَجة باسم تجاري مختلف عن "حلول جدة اللوجستية" في جدول بيانات العميل نفسه -- عملية تحليل الكيانات في الوحدة الثالثة طابقت كلتيهما مع المجموعة الأم نفسها عبر رقم الكيان القانوني، وهي علاقة غير مرئية دون هذا التحقق.',
  },
  {
    id: 'jeddah-logistics-solutions',
    name: 'Jeddah Logistics Solutions',
    nameAr: 'حلول جدة اللوجستية',
    role: 'agent',
    category: 'Freight forwarding (service)',
    categoryAr: 'الشحن والتخليص (خدمة)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Leverage',
    evidenceConfidence: 'MODERATE',
  },
  {
    id: 'cairo-tooling-maintenance',
    name: 'Cairo Tooling Maintenance',
    nameAr: 'القاهرة لصيانة العدد',
    role: 'manufacturer',
    category: 'Tooling maintenance (service)',
    categoryAr: 'صيانة العدد والقوالب (خدمة)',
    country: 'Egypt',
    countryAr: 'مصر',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'HIGH',
  },
  {
    id: 'riyadh-industrial-coatings',
    name: 'Riyadh Industrial Coatings',
    nameAr: 'الرياض للطلاءات الصناعية',
    role: 'manufacturer',
    category: 'Protective coatings (raw material)',
    categoryAr: 'الطلاءات الواقية (مادة خام)',
    country: 'Saudi Arabia',
    countryAr: 'المملكة العربية السعودية',
    kraljicQuadrant: 'Non-critical',
    evidenceConfidence: 'HIGH',
  },
];
