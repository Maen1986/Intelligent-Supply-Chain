/**
 * Data for the interactive Risk Management page (backlog #882).
 * Everything here is either the page's existing data (heat-map risks) or
 * clearly labelled indicative content. No client data. EN and AR together.
 * Band wording follows #878: Low, Watch, Act, Urgent.
 */
import { riskBand } from './riskBands';

export type Bi = { en: string; ar: string };

export interface HeatMapRisk {
  id: string;
  name: string;
  nameAr: string;
  l: number;
  i: number;
  /** index into the page's RISK_TYPES (the eight categories) */
  cat: number;
}

/** The 12 sample risks that already drive the Heat Map tab (unchanged values). */
export const HEAT_MAP_RISKS: HeatMapRisk[] = [
  { id: 'R1', name: 'Supplier insolvency (Tier-1)', nameAr: 'إعسار مورّد (المستوى الأول)', l: 3, i: 5, cat: 2 },
  { id: 'R2', name: 'FX/Commodity price spike', nameAr: 'قفزة أسعار العملات/السلع', l: 4, i: 3, cat: 2 },
  { id: 'R3', name: 'Red Sea logistics disruption', nameAr: 'اضطراب لوجستي في البحر الأحمر', l: 3, i: 4, cat: 6 },
  { id: 'R4', name: 'Regulatory change (SFDA/NCAR)', nameAr: 'تغيّر تنظيمي (SFDA/NCAR)', l: 3, i: 3, cat: 3 },
  { id: 'R5', name: 'ERP system failure', nameAr: 'فشل نظام ERP', l: 2, i: 4, cat: 1 },
  { id: 'R6', name: 'Single-source supplier', nameAr: 'مورّد أحادي المصدر', l: 3, i: 5, cat: 4 },
  { id: 'R7', name: 'Demand forecast error >25%', nameAr: 'خطأ توقّع الطلب أكثر من 25%', l: 4, i: 2, cat: 1 },
  { id: 'R8', name: 'Quality recall', nameAr: 'سحب بسبب الجودة', l: 2, i: 5, cat: 1 },
  { id: 'R9', name: 'Cyber attack on procurement', nameAr: 'هجوم سيبراني على المشتريات', l: 2, i: 4, cat: 7 },
  { id: 'R10', name: 'ESG compliance failure', nameAr: 'فشل الامتثال لـ ESG', l: 3, i: 3, cat: 5 },
  { id: 'R11', name: 'Key talent departure', nameAr: 'مغادرة كفاءة رئيسية', l: 3, i: 2, cat: 1 },
  { id: 'R12', name: 'Port/natural disaster', nameAr: 'كارثة طبيعية/بالميناء', l: 2, i: 3, cat: 6 },
];

/** Eight more sample risks for the sector explorer only. The Heat Map tab keeps the 12 above. */
export const EXTRA_SAMPLE_RISKS: HeatMapRisk[] = [
  { id: 'R13', name: 'Tariffs and trade restrictions', nameAr: 'التعرفات الجمركية والقيود التجارية', l: 4, i: 3, cat: 0 },
  { id: 'R14', name: 'Port congestion', nameAr: 'ازدحام الموانئ', l: 4, i: 3, cat: 6 },
  { id: 'R15', name: 'Labour shortage', nameAr: 'نقص العمالة', l: 3, i: 3, cat: 1 },
  { id: 'R16', name: 'Single-site or plant failure', nameAr: 'تعطّل موقع أو مصنع واحد', l: 2, i: 5, cat: 4 },
  { id: 'R17', name: 'Subcontractor failure', nameAr: 'تعثّر المقاولين من الباطن', l: 3, i: 4, cat: 2 },
  { id: 'R18', name: 'Cold-chain or product-safety failure', nameAr: 'فشل سلسلة التبريد أو سلامة المنتج', l: 2, i: 5, cat: 1 },
  { id: 'R19', name: 'Extreme-weather supply shock', nameAr: 'صدمة طقس قاسٍ تُربك الإمداد', l: 3, i: 4, cat: 4 },
  { id: 'R20', name: 'Product shortage or supplier allocation', nameAr: 'نقص المنتج وتخصيص الموردين', l: 3, i: 4, cat: 2 },
];

/** The 20 sample risks the sector explorer draws from (likelihood and impact are ISC sample values, not data). */
export const SAMPLE_RISKS: HeatMapRisk[] = [...HEAT_MAP_RISKS, ...EXTRA_SAMPLE_RISKS];

export interface BandView { key: 'critical' | 'high' | 'medium' | 'low'; en: string; ar: string; cls: string }

/** Display names for the four bands (#878). Internal keys stay critical/high/medium/low. */
export function bandView(score: number): BandView {
  const key = riskBand(score);
  if (key === 'critical') return { key, en: 'Urgent', ar: 'عاجل', cls: 'bg-red-500 text-white' };
  if (key === 'high') return { key, en: 'Act', ar: 'تحرّك', cls: 'bg-orange-400 text-white' };
  if (key === 'medium') return { key, en: 'Watch', ar: 'مراقبة', cls: 'bg-yellow-400 text-gray-900' };
  return { key, en: 'Low', ar: 'منخفض', cls: 'bg-green-500 text-white' };
}

export type EvidenceStatus = 'sourced' | 'partly' | 'judgement';

export interface SectorSource { name: string; url: string; kind: SourceKind }

export interface SectorEvidence { status: EvidenceStatus; note: Bi; sources: SectorSource[] }

export interface Sector { id: string; en: string; ar: string; picks: string[]; evidence: SectorEvidence }

export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, Bi> = {
  sourced: { en: 'Theme found in sources', ar: 'الموضوع موجود في المصادر' },
  partly: { en: 'Partly sourced', ar: 'مدعوم جزئيا بالمصادر' },
  judgement: { en: 'ISC judgement', ar: 'تقدير ممارسي آي سبلاي تشين' },
};

/**
 * Which ten sample risks to show for each sector, listed in the order they were chosen.
 * The picks are ISC practitioner judgement over the 20 sample risks, not client data and not a statistic.
 * The evidence note names published sources that support the sector's main themes; they do not prove the order.
 */
export const SECTORS: Sector[] = [
  { id: 'general', en: 'General', ar: 'عام', picks: ['R1', 'R3', 'R2', 'R13', 'R4', 'R9', 'R6', 'R14', 'R5', 'R19'], evidence: {
    status: 'sourced',
    note: { en: 'Geoeconomic confrontation tops the 2026 near-term list and is expected to hit systemically important supply chains.', ar: 'يتصدّر التصعيد الجيو-اقتصادي قائمة 2026 القريبة ويُتوقّع أن يضرب سلاسل إمداد محورية.' },
    sources: [{ name: 'WEF Global Risks Report 2026', url: 'https://www.weforum.org/stories/global-risks/global-risks-2026-top-10-two-and-ten-year-horizon', kind: 'primary' }] } },
  { id: 'retail', en: 'Retail / FMCG', ar: 'التجزئة / سلع استهلاكية', picks: ['RT1', 'RT2', 'RT3', 'RT4', 'RT5', 'RT6', 'RT8', 'R13', 'R14', 'R10'], evidence: {
    status: 'partly',
    note: { en: 'Surveys of retail and consumer-goods leaders point to demand volatility, supply-chain uncertainty and tariffs. The sources are vendor and consultancy surveys.', ar: 'تشير استطلاعات قادة التجزئة والسلع الاستهلاكية إلى تقلّب الطلب وعدم اليقين في سلسلة الإمداد والرسوم الجمركية. المصادر استطلاعات لشركات حلول واستشارات.' },
    sources: [
      { name: 'RELEX and Researchscape survey', url: 'https://researchscape.com/inthenews/21091', kind: 'analyst' },
      { name: 'Protiviti 2025 top risks, consumer products and retail', url: 'https://www.protiviti.com/sites/default/files/2025-04/nc-state-protiviti-2025-top-risks-survey-cpg-retail-industry.pdf', kind: 'analyst' },
      { name: 'KPMG, US retailers and tariffs', url: 'https://kpmg.com/us/en/articles/2025/us-retailers-battle-tariff-turbulence.html', kind: 'analyst' },
    ] } },
  { id: 'manufacturing', en: 'Manufacturing', ar: 'التصنيع', picks: ['MF1', 'MF2', 'MF3', 'MF4', 'MF6', 'MF7', 'MF8', 'R1', 'R5', 'R13'], evidence: {
    status: 'partly',
    note: { en: 'McKinsey finds visibility thins beyond tier-one suppliers, which hides single points of failure.', ar: 'تجد ماكنزي أن الرؤية تضعف بعد موردي المستوى الأول، فتخفي نقاط الفشل المفردة.' },
    sources: [{ name: 'McKinsey supply chain risk pulse 2025', url: 'https://www.mckinsey.com/capabilities/operations/our-insights/supply-chain-risk-survey', kind: 'analyst' }] } },
  { id: 'pharma', en: 'Healthcare & Pharma', ar: 'الرعاية الصحية والأدوية', picks: ['PH1', 'PH2', 'PH3', 'PH4', 'PH5', 'PH6', 'PH7', 'R16', 'R3', 'R9'], evidence: {
    status: 'sourced',
    note: { en: 'The FDA tied 62% of 2013 to 2017 drug shortages to manufacturing quality, and about 40% of generic markets had a single maker (2020).', ar: 'ربطت إدارة الغذاء والدواء الأمريكية 62% من حالات نقص الأدوية بين 2013 و2017 بجودة التصنيع، وكان نحو 40% من أسواق الأدوية الجنيسة بمصنّع واحد (2020).' },
    sources: [
      { name: 'FDA, Drug Shortages: Root Causes and Potential Solutions', url: 'https://www.fda.gov/media/131130/download', kind: 'primary' },
      { name: 'HHS ASPE, drug shortages analysis', url: 'https://aspe.hhs.gov/sites/default/files/documents/e164eb468ad15b938aefeff137201e7d/RRA1070-1_globalshortages.pdf', kind: 'primary' },
    ] } },
  { id: 'energy', en: 'Oil & Gas / Energy', ar: 'النفط والغاز / الطاقة', picks: ['EN1', 'EN2', 'EN3', 'EN4', 'EN5', 'EN6', 'EN8', 'R2', 'R12', 'R4'], evidence: {
    status: 'partly',
    note: { en: 'Chokepoint disruption, attacks on infrastructure and cyber threats to control systems appear in official energy and security material. Page dates are not yet re-checked.', ar: 'يظهر اضطراب الممرات الحيوية والهجمات على المنشآت والتهديدات السيبرانية لأنظمة التحكم في مواد رسمية عن الطاقة والأمن. لم تُعَد مراجعة تواريخ الصفحات بعد.' },
    sources: [
      { name: 'IEA, energy security', url: 'https://www.iea.org/topics/energy-security', kind: 'primary' },
      { name: 'US EIA, Short-Term Energy Outlook, August 2026', url: 'https://www.eia.gov/outlooks/steo/archives/aug26.pdf', kind: 'primary' },
      { name: 'CISA, cyber actors targeting operational technology', url: 'https://www.cisa.gov/news-events/alerts/2025/05/06/unsophisticated-cyber-actors-targeting-operational-technology', kind: 'primary' },
    ] } },
  { id: 'government', en: 'Government / Public', ar: 'القطاع الحكومي', picks: ['GV1', 'GV2', 'GV3', 'GV4', 'GV5', 'GV6', 'GV7', 'R4', 'R9', 'R11'], evidence: {
    status: 'sourced',
    note: { en: 'The UK National Audit Office found Carillion held about 420 public contracts; its liquidation was estimated to cost taxpayers about 148 million pounds.', ar: 'وجد مكتب التدقيق الوطني البريطاني أن لدى كاريليون نحو 420 عقدا حكوميا، وقُدّرت كلفة تصفيتها على دافعي الضرائب بنحو 148 مليون جنيه إسترليني.' },
    sources: [{ name: 'UK NAO, handling of the collapse of Carillion', url: 'https://www.nao.org.uk/press-releases/investigation-into-the-governments-handling-of-the-collapse-of-carillion/', kind: 'primary' }] } },
  { id: 'logistics', en: 'Logistics / 3PL', ar: 'الخدمات اللوجستية', picks: ['LG1', 'LG2', 'LG3', 'LG4', 'LG5', 'LG6', 'LG7', 'R12', 'R9', 'R5'], evidence: {
    status: 'sourced',
    note: { en: 'UNCTAD reports the Cape detour added about 30% to voyage lengths, ports under strain, and Suez tonnage about 70% below 2023 in May 2025.', ar: 'تفيد الأونكتاد بأن الالتفاف حول رأس الرجاء الصالح زاد أطوال الرحلات نحو 30%، وبضغط على الموانئ، وبأن حمولات السويس كانت أقل بنحو 70% من 2023 في مايو 2025.' },
    sources: [{ name: 'UNCTAD, Review of Maritime Transport 2025', url: 'https://unctad.org/system/files/official-document/rmt2025_en.pdf', kind: 'primary' }] } },
  { id: 'food', en: 'Food & Beverage', ar: 'الأغذية والمشروبات', picks: ['FB1', 'FB2', 'FB3', 'FB4', 'FB5', 'FB6', 'FB7', 'R2', 'R14', 'R10'], evidence: {
    status: 'partly',
    note: { en: 'FAO links food price swings to weather, Black Sea logistics and animal disease. Recall and safety risk is ISC judgement.', ar: 'تربط الفاو تقلّبات أسعار الغذاء بالطقس ولوجستيات البحر الأسود وأمراض الحيوان. أما مخاطر السحب وسلامة الغذاء فتقدير ممارسين.' },
    sources: [{ name: 'FAO Food Price Index', url: 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/', kind: 'primary' }] } },
  { id: 'construction', en: 'Construction / Real Estate', ar: 'المقاولات والعقار', picks: ['CN1', 'CN2', 'CN3', 'CN4', 'CN5', 'CN7', 'CN8', 'R4', 'R15', 'R2'], evidence: {
    status: 'judgement',
    note: { en: 'Only trade-body and press sources were found for materials inflation and contractor insolvency. No official source yet.', ar: 'لم تُوجد سوى مصادر هيئات تجارية وصحافة عن تضخم المواد وتعثّر المقاولين. لا يوجد مصدر رسمي بعد.' },
    sources: [{ name: 'BCIS, why contractors are vulnerable to insolvency', url: 'https://bcis.co.uk/insight/why-are-contractors-in-the-construction-industry-vulnerable-to-insolvencies', kind: 'analyst' }] } },
];

export type SourceKind = 'primary' | 'press' | 'analyst' | 'academic';

export interface WorldwideExample {
  en: string;
  ar: string;
  year: string;
  sourceName: string;
  url: string;
  kind: SourceKind;
}

/**
 * Worldwide examples per category, in the same order as the page's RISK_TYPES.
 * Every item is a public-record event with a named source, checked on 18 Nov 2026.
 * "kind" says what the source is, so a reader can weigh it.
 */
export const WORLDWIDE: WorldwideExample[][] = [
  [
    { en: 'US-China tariff and export-control shifts reshaping sourcing', ar: 'تحوّلات الرسوم وضوابط التصدير بين أمريكا والصين التي أعادت تشكيل مصادر التوريد', year: '2018', sourceName: 'USTR, Section 301 product list fact sheet', url: 'https://ustr.gov/about-us/policy-offices/press-office/fact-sheets/2018/june/section-301-product-list-fact-sheet', kind: 'primary' },
  ],
  [
    { en: 'Gulf Coast petrochemical plant outages in the Texas winter storm', ar: 'توقف مصانع البتروكيماويات في ساحل الخليج خلال العاصفة الشتوية في تكساس', year: '2021', sourceName: 'US EIA, Today in Energy: ethane demand, February 2021', url: 'https://www.eia.gov/todayinEnergy/detail.php?id=48016', kind: 'primary' },
    { en: 'Renesas chip plant fire halting a production line, with only about two-thirds of its products able to be made elsewhere', ar: 'حريق مصنع رقائق Renesas أوقف خط إنتاج، ولا يمكن تصنيع سوى نحو ثلثي منتجاته في مكان آخر', year: '2021', sourceName: 'Renesas, official update 3 on the Naka factory fire (21 March 2021)', url: 'https://www.renesas.com/en/about/newsroom/update-3-notice-regarding-semiconductor-manufacturing-factory-naka-factory-fire', kind: 'primary' },
  ],
  [
    { en: 'Hanjin Shipping bankruptcy leaving cargo stranded at sea', ar: 'إفلاس شركة Hanjin للشحن وبقاء بضائع عالقة في البحر', year: '2016', sourceName: 'UNCTAD, Global container shipping: another crisis?', url: 'https://unctad.org/news/global-container-shipping-face-yet-another-crisis', kind: 'primary' },
  ],
  [
    { en: 'US Uyghur Forced Labor Prevention Act: import detentions at the border', ar: 'قانون الولايات المتحدة لمنع العمل القسري للأويغور: احتجاز واردات عند الحدود', year: '2022', sourceName: 'CSIS, impact after three years', url: 'https://www.csis.org/analysis/assessing-impact-uyghur-forced-labor-prevention-act-after-three-years', kind: 'analyst' },
  ],
  [
    { en: 'Floods in Thailand disrupting global hard-drive supply', ar: 'فيضانات تايلاند التي عطّلت توريد الأقراص الصلبة عالميا', year: '2011', sourceName: 'eWeek', url: 'https://www.eweek.com/storage/thailand-flooding-could-impact-global-hdd-production-until-spring-2012/', kind: 'press' },
  ],
  [
    { en: 'Rana Plaza factory collapse in Bangladesh and the brand response', ar: 'انهيار مصنع رانا بلازا في بنغلاديش واستجابة العلامات التجارية', year: '2013', sourceName: 'ILO, The Rana Plaza disaster ten years on', url: 'https://www.ilo.org/infostories/en-GB/Stories/Country-Focus/rana-plaza', kind: 'primary' },
  ],
  [
    { en: 'Suez Canal blocked by the Ever Given', ar: 'إغلاق قناة السويس بسفينة Ever Given', year: '2021', sourceName: 'IMO Secretary-General statements on the Ever Given (26 March and 1 April 2021)', url: 'https://www.imo.org/en/MediaCentre/SecretaryGeneral/Pages/MV-Ever-Given-incident.aspx', kind: 'primary' },
    { en: 'War in Ukraine: energy, food and fertiliser price shock', ar: 'الحرب في أوكرانيا: صدمة أسعار الطاقة والغذاء والأسمدة', year: '2022', sourceName: 'World Bank, Commodity Markets Outlook press release', url: 'https://www.worldbank.org/en/news/press-release/2022/04/26/food-and-energy-price-shocks-from-ukraine-war', kind: 'primary' },
  ],
  [
    { en: 'NotPetya malware halting Maersk operations worldwide', ar: 'برمجية NotPetya الخبيثة التي عطّلت عمليات Maersk عالميا', year: '2017', sourceName: 'Columbia SIPA case study', url: 'https://sipa.columbia.edu/sites/default/files/2022-11/NotPetya%20Final.pdf', kind: 'academic' },
    { en: 'DarkSide ransomware attack on Colonial Pipeline and the CISA-FBI advisory', ar: 'هجوم الفدية DarkSide على Colonial Pipeline وتحذير CISA وFBI', year: '2021', sourceName: 'CISA advisory AA21-131A', url: 'https://www.cisa.gov/sites/default/files/publications/AA21-131A_Darkside_Ransomware.pdf', kind: 'primary' },
  ],
];

export const SOURCE_KIND_LABEL: Record<SourceKind, Bi> = {
  primary: { en: 'Official source', ar: 'مصدر رسمي' },
  press: { en: 'Press report', ar: 'تقرير صحفي' },
  analyst: { en: 'Analyst or think tank', ar: 'محلل أو مركز أبحاث' },
  academic: { en: 'Academic case study', ar: 'دراسة حالة أكاديمية' },
};

export interface GovTier { en: string; ar: string; items: Bi[] }

export const GOV_TIERS: GovTier[] = [
  { en: 'Board Level', ar: 'مستوى المجلس', items: [
    { en: 'Risk appetite statement approved annually by the full board', ar: 'بيان قابلية تحمّل المخاطر يُعتمد سنويا من المجلس بكامله' },
    { en: 'Quarterly risk review: top 5 risks and strategic risk profile', ar: 'مراجعة ربع سنوية للمخاطر: أهم 5 مخاطر والملف الاستراتيجي' },
    { en: 'ESG and reputational risk oversight', ar: 'إشراف على مخاطر ESG والسمعة' },
    { en: 'Business continuity assurance', ar: 'ضمان استمرارية الأعمال' },
  ] },
  { en: 'Executive / Management Level', ar: 'المستوى التنفيذي / الإداري', items: [
    { en: 'Risk Management Committee meets monthly', ar: 'لجنة إدارة المخاطر تجتمع شهريا' },
    { en: 'Procurement risk dashboard review (KRI-based)', ar: 'مراجعة لوحة مخاطر المشتريات (على أساس مؤشرات KRI)' },
    { en: 'Escalation decision for Urgent risks', ar: 'قرار التصعيد للمخاطر العاجلة' },
    { en: 'Risk programme budget approval', ar: 'اعتماد ميزانية برنامج المخاطر' },
    { en: 'Strategic supplier risk review each quarter', ar: 'مراجعة ربع سنوية لمخاطر المورّدين الاستراتيجيين' },
  ] },
  { en: 'Operational Level', ar: 'المستوى التشغيلي', items: [
    { en: 'Named risk owner for each register item', ar: 'مالك مسمّى لكل بند في السجل' },
    { en: 'Weekly monitoring against KRI thresholds', ar: 'متابعة أسبوعية مقابل حدود KRI' },
    { en: 'Incident reporting within 24 hours of identification', ar: 'الإبلاغ عن الحوادث خلال 24 ساعة من اكتشافها' },
    { en: 'Monthly mitigation plan progress update', ar: 'تحديث شهري لتقدم خطط المعالجة' },
    { en: 'Monthly supplier risk score update for Tier-1', ar: 'تحديث شهري لتقييم مخاطر مورّدي المستوى الأول' },
  ] },
];

export interface KpiDef {
  id: string;
  name: Bi;
  target: number;
  example: number;
  meaning: Bi;
  next: Bi;
  /** tab index to open for the next step: 1 types, 2 heat map, 4 toolkit, 5 governance */
  tab: number;
}

export const KPI_DEFS: KpiDef[] = [
  { id: 'coverage', name: { en: 'Risk Register Coverage %', ar: 'تغطية سجل المخاطر %' }, target: 95, example: 82, meaning: { en: 'Share of your spend and critical items that have a register entry.', ar: 'نسبة الإنفاق والبنود الحرجة التي لها بند في السجل.' }, next: { en: 'Add the uncovered suppliers and items to your register.', ar: 'أضف المورّدين والبنود غير المغطاة إلى السجل.' }, tab: 4 },
  { id: 'bcp', name: { en: 'BCP Test Pass Rate %', ar: 'نسبة نجاح اختبارات استمرارية الأعمال %' }, target: 100, example: 70, meaning: { en: 'Share of continuity plans that passed their last exercise (aligned to ISO 22301).', ar: 'نسبة خطط الاستمرارية التي نجحت في آخر تمرين (متوافق مع ISO 22301).' }, next: { en: 'Re-run the failed exercises; a plan that was never tested counts as not passed.', ar: 'أعد التمارين الفاشلة؛ والخطة التي لم تُجرَّب لا تُعدّ ناجحة.' }, tab: 5 },
  { id: 'rto', name: { en: 'RTO Attainment %', ar: 'تحقيق زمن التعافي المستهدف %' }, target: 95, example: 88, meaning: { en: 'Share of incidents recovered inside the target recovery time.', ar: 'نسبة الحوادث التي تعافت ضمن زمن التعافي المستهدف.' }, next: { en: 'Review the slowest recoveries and add a backup route or supplier.', ar: 'راجع أبطأ حالات التعافي وأضف مسارا أو مورّدا بديلا.' }, tab: 1 },
  { id: 'mitigation', name: { en: 'Critical Risk Mitigation Rate %', ar: 'معدل معالجة المخاطر الحرجة %' }, target: 90, example: 76, meaning: { en: 'Share of Urgent and Act risks with a mitigation plan in progress.', ar: 'نسبة المخاطر العاجلة ومخاطر التحرّك التي لها خطة معالجة جارية.' }, next: { en: 'Give every Urgent risk an owner and a date this week.', ar: 'عيّن مالكا وموعدا لكل خطر عاجل هذا الأسبوع.' }, tab: 2 },
  { id: 'supplier', name: { en: 'Supplier Risk Score (avg /100)', ar: 'متوسط تقييم مخاطر المورّدين (من 100)' }, target: 75, example: 68, meaning: { en: 'Average supplier risk score across your strategic suppliers.', ar: 'متوسط تقييم مخاطر المورّدين عبر مورّديك الاستراتيجيين.' }, next: { en: 'Start with suppliers scoring below 40: no new strategic contracts without escalation.', ar: 'ابدأ بالمورّدين دون 40: لا عقود استراتيجية جديدة دون تصعيد.' }, tab: 1 },
  { id: 'review', name: { en: 'Risk Review Compliance %', ar: 'الالتزام بمراجعة المخاطر %' }, target: 100, example: 90, meaning: { en: 'Share of scheduled risk reviews completed on time.', ar: 'نسبة مراجعات المخاطر المجدولة التي أُنجزت في موعدها.' }, next: { en: 'Put the missed reviews on the committee calendar.', ar: 'ضع المراجعات الفائتة في جدول اللجنة.' }, tab: 5 },
];

export type KpiState = 'healthy' | 'watch' | 'attention' | 'none';

/** ISC indicative rule: meets target = healthy; within 10 points = watch; further below = attention. */
export function kpiState(value: number | null, target: number): KpiState {
  if (value === null || Number.isNaN(value)) return 'none';
  if (value >= target) return 'healthy';
  if (value >= target - 10) return 'watch';
  return 'attention';
}

/** ISC indicative rule for a governance tier: all in place healthy; half or more watch; fewer attention. */
export function tierState(done: number, total: number): KpiState {
  if (total <= 0) return 'none';
  if (done === total) return 'healthy';
  return done * 2 >= total ? 'watch' : 'attention';
}

/** ISO 31000:2018 process stage shown under the tab bar, one per tab index. */
export const ISO_STAGE_BY_TAB: Bi[] = [
  { en: 'Communication and consultation', ar: 'التواصل والتشاور' },
  { en: 'Risk identification', ar: 'تحديد المخاطر' },
  { en: 'Risk evaluation', ar: 'تقييم المخاطر' },
  { en: 'Recording and reporting', ar: 'التوثيق والإبلاغ' },
  { en: 'Risk treatment', ar: 'معالجة المخاطر' },
  { en: 'Scope, context and criteria', ar: 'النطاق والسياق والمعايير' },
  { en: 'Monitoring and review', ar: 'المتابعة والمراجعة' },
];
