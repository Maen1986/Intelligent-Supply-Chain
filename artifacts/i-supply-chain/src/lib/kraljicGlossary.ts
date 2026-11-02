/**
 * Abbreviations used on the Kraljic screens. Each one has the full name and a
 * plain-language meaning, in English and Arabic, so any reader can follow it.
 * Only confirmed expansions are stated. Where one could not be confirmed from a
 * source, the entry says so instead of guessing.
 */
export interface GlossaryEntry {
  abbr: string;
  en: string;      // full name
  ar: string;      // full name, Arabic
  plainEn: string; // what it means, in everyday words
  plainAr: string;
  confirmed: boolean;
}
const g = (abbr: string, en: string, ar: string, plainEn: string, plainAr: string, confirmed = true): GlossaryEntry =>
  ({ abbr, en, ar, plainEn, plainAr, confirmed });

export const KRALJIC_GLOSSARY: GlossaryEntry[] = [
  g('3PL', 'Third-Party Logistics provider', 'مزوّد خدمات لوجستية خارجي', 'A company you hire to store and move your goods.', 'شركة تتعاقد معها لتخزين بضائعك ونقلها.'),
  g('AI', 'Artificial Intelligence', 'الذكاء الاصطناعي', 'Software that analyses information and drafts answers. A person must still check them.', 'برمجيات تحلل المعلومات وتصوغ إجابات. ويبقى على الإنسان مراجعتها.'),
  g('AVL', 'Approved Vendor List', 'قائمة الموردين المعتمدين', 'The list of suppliers your company has already checked and allowed to receive orders.', 'قائمة الموردين الذين فحصتهم شركتك وسمحت بتوجيه الطلبات إليهم.'),
  g('BCP', 'Business Continuity Plan', 'خطة استمرارية الأعمال', 'A written plan for keeping the business running when something goes wrong, such as a supplier failing.', 'خطة مكتوبة لاستمرار العمل عند حدوث خلل، مثل تعثر مورد.'),
  g('CAR', 'Corrective Action Request', 'طلب إجراء تصحيحي', 'A formal request asking a supplier to fix a problem and show how it will not happen again.', 'طلب رسمي من المورد لمعالجة مشكلة وبيان كيف لن تتكرر.'),
  g('CIPS', 'Chartered Institute of Procurement & Supply', 'المعهد الملكي المعتمد للمشتريات والتوريد', 'The UK-based professional body for procurement. Its published guidance is a main source for this module.', 'الهيئة المهنية للمشتريات ومقرها المملكة المتحدة. وإرشاداتها المنشورة مصدر رئيسي لهذه الوحدة.'),
  g('CMS', 'CMS (international law firm)', 'CMS (مكتب محاماة دولي)', 'A law firm whose published summary is cited as a secondary source.', 'مكتب محاماة دولي يُستشهد بملخصه المنشور مصدرًا ثانويًا.'),
  g('COPQ', 'Cost of Poor Quality', 'تكلفة سوء الجودة', 'Money lost to defects, rework, returns and delays caused by poor quality.', 'الأموال التي تضيع بسبب العيوب وإعادة العمل والمرتجعات والتأخير الناتجة عن ضعف الجودة.'),
  g('COVID', 'Coronavirus disease 2019 (the pandemic)', 'جائحة كورونا (كوفيد-19)', 'The 2020 pandemic, cited as an example of a temporary supply shock.', 'جائحة 2020، تُذكر مثالًا على صدمة إمداد مؤقتة.'),
  g('CPSM', 'Certified Professional in Supply Management', 'محترف معتمد في إدارة التوريد', 'A professional certificate issued by ISM (see ISM).', 'شهادة مهنية تصدرها ISM (انظر ISM).'),
  g('CRP', 'Contingency Response Plan', 'خطة الاستجابة للطوارئ', 'A supplier\'s plan for how it will keep delivering during a disruption.', 'خطة المورد لمواصلة التسليم أثناء حدوث اضطراب.'),
  g('CSV', 'Comma-Separated Values', 'قيم مفصولة بفواصل', 'A simple spreadsheet file that Excel and similar programs can open.', 'ملف جداول بسيط يمكن فتحه في Excel وغيره.'),
  g('D&B', 'Dun & Bradstreet', 'داون آند برادستريت', 'A company that sells credit reports on businesses.', 'شركة تبيع تقارير ائتمانية عن الشركات.'),
  g('DPO', 'Days Payable Outstanding', 'متوسط أيام استحقاق الدفع للموردين', 'How many days, on average, you take to pay suppliers. A higher number keeps cash in your business longer.', 'متوسط عدد الأيام التي تستغرقها لسداد الموردين. كلما زاد الرقم بقي النقد لديك مدة أطول.'),
  g('EDI', 'Electronic Data Interchange', 'التبادل الإلكتروني للبيانات', 'Orders and invoices passed between computer systems automatically, without retyping.', 'تبادل الطلبات والفواتير بين الأنظمة آليًا دون إعادة إدخال.'),
  g('ERP', 'Enterprise Resource Planning system', 'نظام تخطيط موارد المؤسسة', 'The main business software that holds orders, stock, finance and suppliers.', 'برنامج الأعمال الرئيسي الذي يضم الطلبات والمخزون والمالية والموردين.'),
  g('ESG', 'Environmental, Social and Governance', 'البيئة والمجتمع والحوكمة', 'How a supplier treats the environment and people, and how well it is run.', 'كيف يتعامل المورد مع البيئة والناس، ومدى جودة إدارته.'),
  g('GCC', 'Gulf Cooperation Council', 'مجلس التعاون لدول الخليج العربية', 'Saudi Arabia, UAE, Qatar, Kuwait, Bahrain and Oman.', 'السعودية والإمارات وقطر والكويت والبحرين وعُمان.'),
  g('GDP', 'Gross Domestic Product', 'الناتج المحلي الإجمالي', 'The total value of what a country produces in a year.', 'القيمة الإجمالية لما ينتجه البلد في سنة.'),
  g('GMP', 'Good Manufacturing Practice', 'ممارسات التصنيع الجيدة', 'Rules that make sure products are made safely and consistently.', 'قواعد تضمن تصنيع المنتجات بأمان وثبات.'),
  g('GPO', 'Group Purchasing Organisation', 'منظمة الشراء الجماعي', 'A group that combines many buyers\' orders to win better prices.', 'جهة تجمع طلبات مشترين كثيرين للحصول على أسعار أفضل.'),
  g('HBR', 'Harvard Business Review', 'مجلة هارفارد بزنس ريفيو', 'The magazine where Kraljic\'s 1983 article was published.', 'المجلة التي نُشر فيها مقال Kraljic عام 1983.'),
  g('HHI', 'Herfindahl-Hirschman Index', 'مؤشر هيرفندال-هيرشمان', 'A score for how concentrated spend is. Higher means a few suppliers get most of it.', 'درجة تقيس تركّز الإنفاق. كلما ارتفعت كان الإنفاق في يد عدد قليل من الموردين.'),
  g('ICV', 'In-Country Value', 'القيمة المحلية المضافة', 'The share of a supplier\'s spend that stays in the local economy (UAE and Qatar programmes).', 'حصة إنفاق المورد التي تبقى في الاقتصاد المحلي (برامج الإمارات وقطر).'),
  g('IKTVA', 'In-Kingdom Total Value Add', 'القيمة المضافة الإجمالية داخل المملكة (اكتفا)', 'Saudi Aramco\'s programme that scores how much value a supplier adds inside Saudi Arabia.', 'برنامج أرامكو السعودية الذي يقيس القيمة التي يضيفها المورد داخل المملكة.'),
  g('IP', 'Intellectual Property', 'الملكية الفكرية', 'Patents, designs and know-how that only the owner may use.', 'براءات الاختراع والتصاميم والمعرفة التي لا يحق لغير مالكها استخدامها.'),
  g('ISC', 'I Supply Chain', 'آي سبلاي تشين', 'The company that makes this platform.', 'الشركة التي تصنع هذه المنصة.'),
  g('ISM', 'Institute for Supply Management', 'معهد إدارة التوريد', 'A US professional body for supply management.', 'هيئة مهنية أمريكية لإدارة التوريد.'),
  g('ISO', 'International Organization for Standardization', 'المنظمة الدولية للتوحيد القياسي', 'The body that publishes international standards, for example ISO 22301 on business continuity.', 'الجهة التي تنشر المعايير الدولية، مثل ISO 22301 لاستمرارية الأعمال.'),
  g('IT', 'Information Technology', 'تقنية المعلومات', 'Computers, software and networks.', 'الحواسيب والبرمجيات والشبكات.'),
  g('JBP', 'Joint Business Plan', 'خطة أعمال مشتركة', 'A plan buyer and supplier agree together, with shared targets.', 'خطة يتفق عليها المشتري والمورد معًا بأهداف مشتركة.'),
  g('JSRS', 'Joint Supplier Registration System', 'نظام التسجيل المشترك للموردين', 'Oman\'s shared system for registering and checking oil and gas suppliers (Ministry of Energy and Minerals).', 'نظام عُمان المشترك لتسجيل موردي النفط والغاز والتحقق منهم (وزارة الطاقة والمعادن).'),
  g('KPI', 'Key Performance Indicator', 'مؤشر أداء رئيسي', 'A number used to judge how well something is going.', 'رقم يُستخدم للحكم على مدى جودة الأداء.'),
  g('LCGPA', 'Local Content and Government Procurement Authority', 'هيئة المحتوى المحلي والمشتريات الحكومية', 'The Saudi authority that sets local-content and government buying rules.', 'الهيئة السعودية التي تضع قواعد المحتوى المحلي والمشتريات الحكومية.'),
  g('LTA', 'Long-Term Agreement', 'اتفاقية طويلة الأمد', 'A supply contract that lasts several years.', 'عقد توريد يمتد عدة سنوات.'),
  g('MRO', 'Maintenance, Repair and Operations', 'الصيانة والإصلاح والتشغيل', 'Everyday items that keep a site running, such as spare parts and tools.', 'مواد يومية تُبقي الموقع عاملًا، مثل قطع الغيار والأدوات.'),
  g('NIGP', 'National Institute of Governmental Purchasing', 'المعهد الوطني للمشتريات الحكومية', 'A US body for public-sector buyers whose guidance is cited here.', 'هيئة أمريكية لمشتري القطاع العام يُستشهد بإرشاداتها هنا.'),
  g('OTIF', 'On Time In Full', 'التسليم في الموعد وبالكامل', 'The share of orders that arrive on the promised date with the full quantity.', 'نسبة الطلبات التي تصل في الموعد المحدد وبالكمية الكاملة.'),
  g('PDF', 'Portable Document Format', 'صيغة المستندات المحمولة', 'A fixed-layout document file that is easy to print and share.', 'ملف مستند ثابت التنسيق يسهل طباعته ومشاركته.'),
  g('PO', 'Purchase Order', 'أمر شراء', 'The document you send a supplier to confirm what you are buying.', 'المستند الذي ترسله للمورد لتأكيد ما تشتريه.'),
  g('PPM', 'Parts Per Million', 'عدد العيوب لكل مليون وحدة', 'How many defective units there are in every million delivered.', 'عدد الوحدات المعيبة في كل مليون وحدة مُسلَّمة.'),
  g('PPSD', 'Project Procurement Strategy for Development', 'استراتيجية مشتريات المشروع للتنمية', 'The World Bank\'s method for planning how a project will buy what it needs.', 'منهجية البنك الدولي لتخطيط كيفية شراء المشروع احتياجاته.'),
  g('PwC', 'PricewaterhouseCoopers', 'برايس ووترهاوس كوبرز', 'A professional-services firm whose published note is cited as a secondary source.', 'شركة خدمات مهنية يُستشهد بمذكرتها المنشورة مصدرًا ثانويًا.'),
  g('QCDRS', 'Quality, Cost, Delivery, Responsiveness, Sustainability', 'الجودة والتكلفة والتسليم والاستجابة والاستدامة', 'Five things to judge a supplier on.', 'خمسة معايير للحكم على المورد.'),
  g('R&D', 'Research and Development', 'البحث والتطوير', 'Work to create new products or improve existing ones.', 'عمل لابتكار منتجات جديدة أو تحسين القائمة.'),
  g('RFP', 'Request for Proposal', 'طلب تقديم مقترحات', 'An invitation to suppliers to propose a solution and a price.', 'دعوة للموردين لتقديم حل وسعر.'),
  g('RFQ', 'Request for Quotation', 'طلب عروض أسعار', 'An invitation to suppliers to quote a price for a clearly defined item.', 'دعوة للموردين لتسعير بند محدد بوضوح.'),
  g('S&OP', 'Sales and Operations Planning', 'تخطيط المبيعات والعمليات', 'A regular meeting that matches what will be sold with what can be supplied.', 'اجتماع دوري يوازن بين ما سيُباع وما يمكن توريده.'),
  g('SAR', 'Saudi Riyal', 'الريال السعودي', 'The currency of Saudi Arabia.', 'عملة المملكة العربية السعودية.'),
  g('SDA', 'SDA Bocconi School of Management', 'كلية إدارة الأعمال SDA بوكوني', 'A business school whose 2025 work is cited.', 'كلية أعمال يُستشهد بعملها لعام 2025.'),
  g('SKU', 'Stock Keeping Unit', 'وحدة حفظ المخزون', 'One distinct item you keep in stock.', 'صنف واحد مميز تحتفظ به في المخزون.'),
  g('SME', 'Small and Medium-sized Enterprise', 'منشأة صغيرة أو متوسطة', 'A smaller business, as defined by national rules.', 'منشأة أصغر حجمًا وفق التعريفات الوطنية.'),
  g('SRM', 'Supplier Relationship Management', 'إدارة العلاقة مع الموردين', 'Managing how you work with each important supplier over time.', 'إدارة طريقة تعاملك مع كل مورد مهم على مدى الزمن.'),
  g('TCO', 'Total Cost of Ownership', 'إجمالي تكلفة الملكية', 'The full cost of an item over its life, not just the purchase price.', 'التكلفة الكاملة للبند طوال عمره، لا سعر الشراء وحده.'),
  g('UAE', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'A country in the Gulf.', 'دولة في الخليج العربي.'),
  g('UPC', 'Product code used on the Mandatory List of National Products (full expansion not confirmed: verify with LCGPA)', 'رمز المنتج على قائمة المنتجات الوطنية الإلزامية (لم يُؤكَّد التعريف الكامل: تحقق من الهيئة)', 'The code that identifies an item on the Mandatory List of National Products.', 'الرمز الذي يحدد البند على قائمة المنتجات الوطنية الإلزامية.', false),
  g('USD', 'United States Dollar', 'الدولار الأمريكي', 'The currency of the United States.', 'عملة الولايات المتحدة.'),
  g('VMI', 'Vendor-Managed Inventory', 'المخزون المُدار من المورد', 'The supplier watches your stock and refills it for you.', 'يراقب المورد مخزونك ويعيد تعبئته نيابةً عنك.'),
];
