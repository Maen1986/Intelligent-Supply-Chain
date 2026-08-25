/**
 * clmTradeTerms.ts
 *
 * Cross-cutting commercial-terms metadata for Contract Intelligence v10 --
 * added 25 Aug 2026 per owner request while building Module 05. Three real,
 * sourced bodies of knowledge, each honestly kept separate rather than
 * merged into one fabricated "payment terms" list:
 *
 * 1. Incoterms (R) 2020 -- the 11 ICC delivery/cost/risk-transfer rules
 *    (ICC Incoterms(R) 2020, effective 1 Jan 2020). These govern WHERE risk
 *    and cost transfer between seller and buyer during shipment -- they are
 *    not payment terms, despite being colloquially grouped with them.
 *    Already the cited reference for Module 05's Supply/Goods bucket
 *    ("Civil Transactions Law (CTL) + ICC Incoterms"); most relevant to
 *    Supply/Goods and Logistics contracts but not restricted to them.
 *
 * 2. Payment terms -- real international trade-finance payment
 *    methods/timing categories. Letter of Credit is governed by ICC UCP 600
 *    (Uniform Customs and Practice for Documentary Credits); Documentary
 *    Collection by ICC URC 522 (Uniform Rules for Collections). Advance
 *    Payment, Open Account, Cash on Delivery, Consignment, and Escrow/
 *    Milestone-Based Payment are general international trade-finance
 *    practice, not codified by a single ICC instrument -- that distinction
 *    is kept honest in each entry's sourceEn/sourceAr rather than presenting
 *    all seven as equally "official" (Decision Record 8.7).
 *
 * 3. ISO 4217 currency codes -- the full set of ~168 real, currently
 *    circulating currency codes (ISO 4217, via the `pycountry` reference
 *    dataset) plus a handful of real non-country settlement units still in
 *    active use (XAF, XOF, XPF, XCD, XCG, XDR -- the same SDR unit already
 *    referenced in Module 05's CMR/Hague-Visby liability-cap notes -- XAD,
 *    XSU, XUA). Precious-metal codes (XAU/XAG/XPD/XPT), bond-market
 *    composite units (XBA-XBD), the testing code (XTS), and the
 *    no-currency code (XXX) are excluded as not meaningful for a contract's
 *    payment currency. Arabic currency names are sourced from Unicode CLDR
 *    (via Babel), not machine-translated ad hoc.
 */

export type Incoterm =
  | 'exw' | 'fca' | 'cpt' | 'cip' | 'dap' | 'dpu' | 'ddp'
  | 'fas' | 'fob' | 'cfr' | 'cif' | '';

export interface IncotermMeta {
  id: Incoterm;
  code: string;
  label: string;
  labelAr: string;
  mode: 'any-mode' | 'sea-inland-waterway';
  noteEn: string;
  noteAr: string;
}

export const INCOTERMS_2020: IncotermMeta[] = [
  { id: 'exw', code: 'EXW', label: 'Ex Works', labelAr: 'تسليم المصنع', mode: 'any-mode',
    noteEn: 'Seller makes goods available at their own premises; buyer bears all cost and risk from that point, including export clearance. Minimum obligation for the seller.',
    noteAr: 'يضع البائع البضاعة تحت تصرف المشتري في مقره؛ يتحمل المشتري كل التكلفة والمخاطر من تلك اللحظة، بما في ذلك التخليص الجمركي للتصدير. أقل التزام على البائع.' },
  { id: 'fca', code: 'FCA', label: 'Free Carrier', labelAr: 'تسليم الناقل', mode: 'any-mode',
    noteEn: 'Seller delivers goods, cleared for export, to a carrier or other party nominated by the buyer at a named place.',
    noteAr: 'يسلّم البائع البضاعة، مخلّصة للتصدير، إلى الناقل أو طرف آخر يعيّنه المشتري في مكان محدد.' },
  { id: 'cpt', code: 'CPT', label: 'Carriage Paid To', labelAr: 'تسليم مع دفع الأجرة حتى', mode: 'any-mode',
    noteEn: 'Seller pays for carriage to the named destination; risk transfers to the buyer once goods are handed to the first carrier.',
    noteAr: 'يدفع البائع أجرة النقل حتى الوجهة المحددة؛ تنتقل المخاطر إلى المشتري بمجرد تسليم البضاعة إلى الناقل الأول.' },
  { id: 'cip', code: 'CIP', label: 'Carriage and Insurance Paid To', labelAr: 'تسليم مع دفع الأجرة والتأمين حتى', mode: 'any-mode',
    noteEn: 'Same as CPT, plus the seller must obtain cargo insurance at the higher Institute Cargo Clauses (A) level of cover.',
    noteAr: 'مثل CPT، مع التزام البائع بشراء تأمين على البضاعة بمستوى التغطية الأعلى (شروط المؤسسة "أ").' },
  { id: 'dap', code: 'DAP', label: 'Delivered at Place', labelAr: 'التسليم في المكان المحدد', mode: 'any-mode',
    noteEn: 'Seller delivers when goods are placed at the disposal of the buyer, ready for unloading, at the named destination; seller bears all risk up to that point.',
    noteAr: 'يسلّم البائع عندما توضع البضاعة تحت تصرف المشتري جاهزة للتفريغ في الوجهة المحددة؛ يتحمل البائع كل المخاطر حتى تلك اللحظة.' },
  { id: 'dpu', code: 'DPU', label: 'Delivered at Place Unloaded', labelAr: 'التسليم في المكان المحدد مُفرَّغاً', mode: 'any-mode',
    noteEn: 'Like DAP, but the seller also bears the risk and cost of unloading at destination. The only Incoterm requiring the seller to unload. Replaced DAT (Delivered at Terminal) in the 2020 revision.',
    noteAr: 'مثل DAP، لكن البائع يتحمل أيضاً مخاطر وتكلفة التفريغ في الوجهة. الشرط الوحيد الذي يُلزم البائع بالتفريغ. حلّ محل شرط DAT (التسليم في المحطة) في مراجعة 2020.' },
  { id: 'ddp', code: 'DDP', label: 'Delivered Duty Paid', labelAr: 'التسليم مع سداد الرسوم الجمركية', mode: 'any-mode',
    noteEn: 'Seller bears all cost and risk to deliver goods to the named destination, including import duty/tax clearance. Maximum obligation for the seller.',
    noteAr: 'يتحمل البائع كل التكلفة والمخاطر لتسليم البضاعة إلى الوجهة المحددة، بما في ذلك التخليص الجمركي ورسوم الاستيراد. أقصى التزام على البائع.' },
  { id: 'fas', code: 'FAS', label: 'Free Alongside Ship', labelAr: 'التسليم بجانب السفينة', mode: 'sea-inland-waterway',
    noteEn: 'Seller delivers when goods are placed alongside the vessel at the named port of shipment. Sea/inland-waterway transport only.',
    noteAr: 'يسلّم البائع عندما توضع البضاعة بجانب السفينة في ميناء الشحن المحدد. للنقل البحري/المائي الداخلي فقط.' },
  { id: 'fob', code: 'FOB', label: 'Free on Board', labelAr: 'التسليم على ظهر السفينة', mode: 'sea-inland-waterway',
    noteEn: 'Seller delivers when goods are loaded on board the vessel; risk transfers at that point. Sea/inland-waterway transport only -- often misused for containerized/multimodal freight, where FCA is the more accurate term.',
    noteAr: 'يسلّم البائع عندما تُحمَّل البضاعة على متن السفينة؛ تنتقل المخاطر عند تلك اللحظة. للنقل البحري/المائي الداخلي فقط -- كثيراً ما يُستخدم خطأً للشحن بالحاويات/متعدد الوسائط، حيث يكون شرط FCA أدق.' },
  { id: 'cfr', code: 'CFR', label: 'Cost and Freight', labelAr: 'التكلفة وأجرة الشحن', mode: 'sea-inland-waterway',
    noteEn: 'Seller pays cost and freight to the named port of destination; risk transfers once goods are on board. Sea/inland-waterway transport only.',
    noteAr: 'يدفع البائع التكلفة وأجرة الشحن حتى ميناء الوجهة المحدد؛ تنتقل المخاطر بمجرد تحميل البضاعة على متن السفينة. للنقل البحري/المائي الداخلي فقط.' },
  { id: 'cif', code: 'CIF', label: 'Cost, Insurance and Freight', labelAr: 'التكلفة والتأمين وأجرة الشحن', mode: 'sea-inland-waterway',
    noteEn: 'Same as CFR, plus the seller must obtain cargo insurance at the minimum Institute Cargo Clauses (C) level of cover. Sea/inland-waterway transport only.',
    noteAr: 'مثل CFR، مع التزام البائع بشراء تأمين على البضاعة بالحد الأدنى من مستوى التغطية (شروط المؤسسة "ج"). للنقل البحري/المائي الداخلي فقط.' },
];

export type PaymentTermType =
  | 'advance' | 'lc' | 'documentary-collection' | 'open-account'
  | 'cod' | 'consignment' | 'escrow-milestone' | '';

export interface PaymentTermMeta {
  id: PaymentTermType;
  label: string;
  labelAr: string;
  riskNoteEn: string;
  riskNoteAr: string;
  sourceEn: string;
  sourceAr: string;
}

export const PAYMENT_TERMS: PaymentTermMeta[] = [
  { id: 'advance', label: 'Advance Payment (Cash in Advance)', labelAr: 'الدفع المسبق', 
    riskNoteEn: 'Buyer pays before shipment/production. Lowest risk to seller, highest risk to buyer.',
    riskNoteAr: 'يدفع المشتري قبل الشحن/الإنتاج. أقل مخاطرة على البائع وأعلى مخاطرة على المشتري.',
    sourceEn: 'General international trade-finance practice -- not codified by a single ICC instrument.',
    sourceAr: 'ممارسة تجارية دولية عامة في التمويل التجاري -- غير مقننة بأداة واحدة من غرفة التجارة الدولية.' },
  { id: 'lc', label: 'Letter of Credit (L/C)', labelAr: 'خطاب اعتماد مستندي',
    riskNoteEn: "Buyer's bank guarantees payment on presentation of compliant shipping documents. Balances risk between seller and buyer via a bank intermediary.",
    riskNoteAr: 'يضمن بنك المشتري السداد عند تقديم مستندات شحن مطابقة. يوازن المخاطر بين البائع والمشتري عبر وسيط مصرفي.',
    sourceEn: 'ICC Uniform Customs and Practice for Documentary Credits (UCP 600).',
    sourceAr: 'الأصول والأعراف الموحدة للاعتمادات المستندية الصادرة عن غرفة التجارة الدولية (UCP 600).' },
  { id: 'documentary-collection', label: 'Documentary Collection (D/P or D/A)', labelAr: 'التحصيل المستندي',
    riskNoteEn: "Banks handle shipping documents on the seller's behalf but do not guarantee payment -- Documents against Payment (D/P) or Documents against Acceptance (D/A). Cheaper than an L/C but weaker payment assurance.",
    riskNoteAr: 'تتولى البنوك مستندات الشحن نيابة عن البائع دون ضمان السداد -- مستندات مقابل الدفع (D/P) أو مستندات مقابل القبول (D/A). أقل تكلفة من الاعتماد المستندي لكن ضمان السداد أضعف.',
    sourceEn: 'ICC Uniform Rules for Collections (URC 522).',
    sourceAr: 'الأصول الموحدة للتحصيل الصادرة عن غرفة التجارة الدولية (URC 522).' },
  { id: 'open-account', label: 'Open Account (Net Terms)', labelAr: 'الحساب المفتوح (بالأجل)',
    riskNoteEn: 'Buyer pays a set number of days after receiving goods/invoice (e.g. Net 30/60/90). Highest risk to seller; most common in established, trusted trade relationships.',
    riskNoteAr: 'يدفع المشتري بعد عدد محدد من الأيام من استلام البضاعة/الفاتورة (مثال: 30/60/90 يوماً). أعلى مخاطرة على البائع؛ الأكثر شيوعاً في العلاقات التجارية الراسخة والموثوقة.',
    sourceEn: 'General international trade-finance practice -- not codified by a single ICC instrument.',
    sourceAr: 'ممارسة تجارية دولية عامة في التمويل التجاري -- غير مقننة بأداة واحدة من غرفة التجارة الدولية.' },
  { id: 'cod', label: 'Cash on Delivery (COD)', labelAr: 'الدفع عند التسليم',
    riskNoteEn: 'Payment made at the moment of delivery. More common in domestic/last-mile logistics than large cross-border contracts.',
    riskNoteAr: 'يتم السداد لحظة التسليم. أكثر شيوعاً في اللوجستيات المحلية/الميل الأخير منه في العقود الكبيرة العابرة للحدود.',
    sourceEn: 'General international trade-finance practice -- not codified by a single ICC instrument.',
    sourceAr: 'ممارسة تجارية دولية عامة في التمويل التجاري -- غير مقننة بأداة واحدة من غرفة التجارة الدولية.' },
  { id: 'consignment', label: 'Consignment', labelAr: 'البيع بالعمولة / الأمانة',
    riskNoteEn: 'Seller retains title to the goods; buyer/distributor pays only after reselling them. Highest risk to seller of all seven terms.',
    riskNoteAr: 'يحتفظ البائع بملكية البضاعة؛ يدفع المشتري/الموزع فقط بعد إعادة بيعها. الأعلى مخاطرة على البائع من بين الشروط السبعة.',
    sourceEn: 'General international trade-finance practice -- not codified by a single ICC instrument.',
    sourceAr: 'ممارسة تجارية دولية عامة في التمويل التجاري -- غير مقننة بأداة واحدة من غرفة التجارة الدولية.' },
  { id: 'escrow-milestone', label: 'Escrow / Milestone-Based Payment', labelAr: 'الضمان لدى طرف ثالث / الدفع حسب مراحل الإنجاز',
    riskNoteEn: 'Funds held by an independent third party (escrow agent) and released against agreed, verified milestones. Common in large project, construction, and FIDIC-governed contracts (Module 05).',
    riskNoteAr: 'تُحفظ الأموال لدى طرف ثالث مستقل (وكيل الضمان) وتُصرف عند تحقق مراحل إنجاز متفق عليها ومتحقق منها. شائع في المشاريع الكبرى وعقود الإنشاءات والعقود الخاضعة لـ FIDIC (الوحدة 05).',
    sourceEn: 'General international trade-finance and construction-contracting practice -- not codified by a single ICC instrument.',
    sourceAr: 'ممارسة عامة في التمويل التجاري الدولي وتعاقدات الإنشاءات -- غير مقننة بأداة واحدة من غرفة التجارة الدولية.' },
];

export interface CurrencyMeta {
  code: string;
  label: string;
  labelAr: string;
}

/**
 * ISO 4217 currency codes -- real, currently circulating currencies plus a
 * handful of active non-country settlement units (see file header for the
 * exact inclusion/exclusion rule). Source: ISO 4217 (via the `pycountry`
 * reference dataset); Arabic names via Unicode CLDR (Babel).
 */
export const ISO_4217_CURRENCIES: CurrencyMeta[] = [
  { code: 'AED', label: 'United Arab Emirates Dirham', labelAr: 'درهم إماراتي' },
  { code: 'AFN', label: 'Afghan Afghani', labelAr: 'أفغاني' },
  { code: 'ALL', label: 'Albanian Lek', labelAr: 'ليك ألباني' },
  { code: 'AMD', label: 'Armenian Dram', labelAr: 'درام أرميني' },
  { code: 'AOA', label: 'Angolan Kwanza', labelAr: 'كوانزا أنغولي' },
  { code: 'ARS', label: 'Argentine Peso', labelAr: 'بيزو أرجنتيني' },
  { code: 'AUD', label: 'Australian Dollar', labelAr: 'دولار أسترالي' },
  { code: 'AWG', label: 'Aruban Florin', labelAr: 'فلورن أروبي' },
  { code: 'AZN', label: 'Azerbaijani Manat', labelAr: 'مانات أذربيجان' },
  { code: 'BAM', label: 'Bosnia-Herzegovina Convertible Mark', labelAr: 'مارك البوسنة والهرسك قابل للتحويل' },
  { code: 'BBD', label: 'Barbadian Dollar', labelAr: 'دولار بربادوسي' },
  { code: 'BDT', label: 'Bangladeshi Taka', labelAr: 'تاكا بنغلاديشي' },
  { code: 'BHD', label: 'Bahraini Dinar', labelAr: 'دينار بحريني' },
  { code: 'BIF', label: 'Burundian Franc', labelAr: 'فرنك بروندي' },
  { code: 'BMD', label: 'Bermudan Dollar', labelAr: 'دولار برمودي' },
  { code: 'BND', label: 'Brunei Dollar', labelAr: 'دولار بروناي' },
  { code: 'BOB', label: 'Bolivian Boliviano', labelAr: 'بوليفيانو بوليفي' },
  { code: 'BOV', label: 'Bolivian Mvdol', labelAr: 'مفدول بوليفي' },
  { code: 'BRL', label: 'Brazilian Real', labelAr: 'ريال برازيلي' },
  { code: 'BSD', label: 'Bahamian Dollar', labelAr: 'دولار باهامي' },
  { code: 'BTN', label: 'Bhutanese Ngultrum', labelAr: 'نولتوم بوتاني' },
  { code: 'BWP', label: 'Botswanan Pula', labelAr: 'بولا بتسواني' },
  { code: 'BYN', label: 'Belarusian Ruble', labelAr: 'روبل بيلاروسي' },
  { code: 'BZD', label: 'Belize Dollar', labelAr: 'دولار بليزي' },
  { code: 'CAD', label: 'Canadian Dollar', labelAr: 'دولار كندي' },
  { code: 'CDF', label: 'Congolese Franc', labelAr: 'فرنك كونغولي' },
  { code: 'CHE', label: 'WIR Euro', labelAr: 'WIR Euro' },
  { code: 'CHF', label: 'Swiss Franc', labelAr: 'فرنك سويسري' },
  { code: 'CHW', label: 'WIR Franc', labelAr: 'WIR Franc' },
  { code: 'CLF', label: 'Chilean Unit of Account (UF)', labelAr: 'Chilean Unit of Account (UF)' },
  { code: 'CLP', label: 'Chilean Peso', labelAr: 'بيزو تشيلي' },
  { code: 'CNY', label: 'Chinese Yuan', labelAr: 'يوان صيني' },
  { code: 'COP', label: 'Colombian Peso', labelAr: 'بيزو كولومبي' },
  { code: 'COU', label: 'Colombian Real Value Unit', labelAr: 'Colombian Real Value Unit' },
  { code: 'CRC', label: 'Costa Rican Colón', labelAr: 'كولن كوستاريكي' },
  { code: 'CUP', label: 'Cuban Peso', labelAr: 'بيزو كوبي' },
  { code: 'CVE', label: 'Cape Verdean Escudo', labelAr: 'اسكودو الرأس الأخضر' },
  { code: 'CZK', label: 'Czech Koruna', labelAr: 'كرونة تشيكية' },
  { code: 'DJF', label: 'Djiboutian Franc', labelAr: 'فرنك جيبوتي' },
  { code: 'DKK', label: 'Danish Krone', labelAr: 'كرونة دنماركية' },
  { code: 'DOP', label: 'Dominican Peso', labelAr: 'بيزو الدومنيكان' },
  { code: 'DZD', label: 'Algerian Dinar', labelAr: 'دينار جزائري' },
  { code: 'EGP', label: 'Egyptian Pound', labelAr: 'جنيه مصري' },
  { code: 'ERN', label: 'Eritrean Nakfa', labelAr: 'ناكفا أريتري' },
  { code: 'ETB', label: 'Ethiopian Birr', labelAr: 'بير أثيوبي' },
  { code: 'EUR', label: 'Euro', labelAr: 'يورو' },
  { code: 'FJD', label: 'Fijian Dollar', labelAr: 'دولار فيجي' },
  { code: 'FKP', label: 'Falkland Islands Pound', labelAr: 'جنيه جزر فوكلاند' },
  { code: 'GBP', label: 'British Pound', labelAr: 'جنيه إسترليني' },
  { code: 'GEL', label: 'Georgian Lari', labelAr: 'لارى جورجي' },
  { code: 'GHS', label: 'Ghanaian Cedi', labelAr: 'سيدي غانا' },
  { code: 'GIP', label: 'Gibraltar Pound', labelAr: 'جنيه جبل طارق' },
  { code: 'GMD', label: 'Gambian Dalasi', labelAr: 'دلاسي غامبي' },
  { code: 'GNF', label: 'Guinean Franc', labelAr: 'فرنك غينيا' },
  { code: 'GTQ', label: 'Guatemalan Quetzal', labelAr: 'كوتزال غواتيمالا' },
  { code: 'GYD', label: 'Guyanaese Dollar', labelAr: 'دولار غيانا' },
  { code: 'HKD', label: 'Hong Kong Dollar', labelAr: 'دولار هونغ كونغ' },
  { code: 'HNL', label: 'Honduran Lempira', labelAr: 'ليمبيرا هنداروس' },
  { code: 'HTG', label: 'Haitian Gourde', labelAr: 'جوردى هايتي' },
  { code: 'HUF', label: 'Hungarian Forint', labelAr: 'فورينت هنغاري' },
  { code: 'IDR', label: 'Indonesian Rupiah', labelAr: 'روبية إندونيسية' },
  { code: 'ILS', label: 'Israeli New Shekel', labelAr: 'شيكل إسرائيلي جديد' },
  { code: 'INR', label: 'Indian Rupee', labelAr: 'روبية هندي' },
  { code: 'IQD', label: 'Iraqi Dinar', labelAr: 'دينار عراقي' },
  { code: 'IRR', label: 'Iranian Rial', labelAr: 'ريال إيراني' },
  { code: 'ISK', label: 'Icelandic Króna', labelAr: 'كرونة أيسلندية' },
  { code: 'JMD', label: 'Jamaican Dollar', labelAr: 'دولار جامايكي' },
  { code: 'JOD', label: 'Jordanian Dinar', labelAr: 'دينار أردني' },
  { code: 'JPY', label: 'Japanese Yen', labelAr: 'ين ياباني' },
  { code: 'KES', label: 'Kenyan Shilling', labelAr: 'شلن كينيي' },
  { code: 'KGS', label: 'Kyrgystani Som', labelAr: 'سوم قيرغستاني' },
  { code: 'KHR', label: 'Cambodian Riel', labelAr: 'رييال كمبودي' },
  { code: 'KMF', label: 'Comorian Franc', labelAr: 'فرنك جزر القمر' },
  { code: 'KPW', label: 'North Korean Won', labelAr: 'وون كوريا الشمالية' },
  { code: 'KRW', label: 'South Korean Won', labelAr: 'وون كوريا الجنوبية' },
  { code: 'KWD', label: 'Kuwaiti Dinar', labelAr: 'دينار كويتي' },
  { code: 'KYD', label: 'Cayman Islands Dollar', labelAr: 'دولار جزر كيمن' },
  { code: 'KZT', label: 'Kazakhstani Tenge', labelAr: 'تينغ كازاخستاني' },
  { code: 'LAK', label: 'Laotian Kip', labelAr: 'كيب لاوسي' },
  { code: 'LBP', label: 'Lebanese Pound', labelAr: 'جنيه لبناني' },
  { code: 'LKR', label: 'Sri Lankan Rupee', labelAr: 'روبية سريلانكية' },
  { code: 'LRD', label: 'Liberian Dollar', labelAr: 'دولار ليبيري' },
  { code: 'LSL', label: 'Lesotho Loti', labelAr: 'لوتي ليسوتو' },
  { code: 'LYD', label: 'Libyan Dinar', labelAr: 'دينار ليبي' },
  { code: 'MAD', label: 'Moroccan Dirham', labelAr: 'درهم مغربي' },
  { code: 'MDL', label: 'Moldovan Leu', labelAr: 'ليو مولدوفي' },
  { code: 'MGA', label: 'Malagasy Ariary', labelAr: 'أرياري مدغشقر' },
  { code: 'MKD', label: 'Macedonian Denar', labelAr: 'دينار مقدوني' },
  { code: 'MMK', label: 'Myanmar Kyat', labelAr: 'كيات ميانمار' },
  { code: 'MNT', label: 'Mongolian Tugrik', labelAr: 'توغروغ منغولي' },
  { code: 'MOP', label: 'Macanese Pataca', labelAr: 'باتاكا ماكاوي' },
  { code: 'MRU', label: 'Mauritanian Ouguiya', labelAr: 'أوقية موريتانية' },
  { code: 'MUR', label: 'Mauritian Rupee', labelAr: 'روبية موريشيوسية' },
  { code: 'MVR', label: 'Maldivian Rufiyaa', labelAr: 'روفيه جزر المالديف' },
  { code: 'MWK', label: 'Malawian Kwacha', labelAr: 'كواشا مالاوي' },
  { code: 'MXN', label: 'Mexican Peso', labelAr: 'بيزو مكسيكي' },
  { code: 'MXV', label: 'Mexican Investment Unit', labelAr: 'Mexican Investment Unit' },
  { code: 'MYR', label: 'Malaysian Ringgit', labelAr: 'رينغيت ماليزي' },
  { code: 'MZN', label: 'Mozambican Metical', labelAr: 'متكال موزمبيقي' },
  { code: 'NAD', label: 'Namibian Dollar', labelAr: 'دولار ناميبي' },
  { code: 'NGN', label: 'Nigerian Naira', labelAr: 'نايرا نيجيري' },
  { code: 'NIO', label: 'Nicaraguan Córdoba', labelAr: 'قرطبة نيكاراغوا' },
  { code: 'NOK', label: 'Norwegian Krone', labelAr: 'كرونة نرويجية' },
  { code: 'NPR', label: 'Nepalese Rupee', labelAr: 'روبية نيبالي' },
  { code: 'NZD', label: 'New Zealand Dollar', labelAr: 'دولار نيوزيلندي' },
  { code: 'OMR', label: 'Omani Rial', labelAr: 'ريال عماني' },
  { code: 'PAB', label: 'Panamanian Balboa', labelAr: 'بالبوا بنمي' },
  { code: 'PEN', label: 'Peruvian Sol', labelAr: 'سول بيروفي' },
  { code: 'PGK', label: 'Papua New Guinean Kina', labelAr: 'كينا بابوا غينيا الجديدة' },
  { code: 'PHP', label: 'Philippine Piso', labelAr: 'بيزو فلبيني' },
  { code: 'PKR', label: 'Pakistani Rupee', labelAr: 'روبية باكستاني' },
  { code: 'PLN', label: 'Polish Zloty', labelAr: 'زلوتي بولندي' },
  { code: 'PYG', label: 'Paraguayan Guarani', labelAr: 'غواراني باراغواي' },
  { code: 'QAR', label: 'Qatari Rial', labelAr: 'ريال قطري' },
  { code: 'RON', label: 'Romanian Leu', labelAr: 'ليو روماني' },
  { code: 'RSD', label: 'Serbian Dinar', labelAr: 'دينار صربي' },
  { code: 'RUB', label: 'Russian Ruble', labelAr: 'روبل روسي' },
  { code: 'RWF', label: 'Rwandan Franc', labelAr: 'فرنك رواندي' },
  { code: 'SAR', label: 'Saudi Riyal', labelAr: 'ريال سعودي' },
  { code: 'SBD', label: 'Solomon Islands Dollar', labelAr: 'دولار جزر سليمان' },
  { code: 'SCR', label: 'Seychellois Rupee', labelAr: 'روبية سيشيلية' },
  { code: 'SDG', label: 'Sudanese Pound', labelAr: 'جنيه سوداني' },
  { code: 'SEK', label: 'Swedish Krona', labelAr: 'كرونة سويدية' },
  { code: 'SGD', label: 'Singapore Dollar', labelAr: 'دولار سنغافوري' },
  { code: 'SHP', label: 'St. Helena Pound', labelAr: 'جنيه سانت هيلين' },
  { code: 'SLE', label: 'Leone', labelAr: 'Leone' },
  { code: 'SOS', label: 'Somali Shilling', labelAr: 'شلن صومالي' },
  { code: 'SRD', label: 'Surinamese Dollar', labelAr: 'دولار سورينامي' },
  { code: 'SSP', label: 'South Sudanese Pound', labelAr: 'جنيه جنوب السودان' },
  { code: 'STN', label: 'São Tomé & Príncipe Dobra', labelAr: 'دوبرا ساو تومي وبرينسيبي' },
  { code: 'SVC', label: 'Salvadoran Colón', labelAr: 'كولون سلفادوري' },
  { code: 'SYP', label: 'Syrian Pound', labelAr: 'ليرة سورية' },
  { code: 'SZL', label: 'Swazi Lilangeni', labelAr: 'ليلانجيني سوازيلندي' },
  { code: 'THB', label: 'Thai Baht', labelAr: 'باخت تايلاندي' },
  { code: 'TJS', label: 'Tajikistani Somoni', labelAr: 'سوموني طاجيكستاني' },
  { code: 'TMT', label: 'Turkmenistani Manat', labelAr: 'مانات تركمانستان' },
  { code: 'TND', label: 'Tunisian Dinar', labelAr: 'دينار تونسي' },
  { code: 'TOP', label: 'Tongan Paʻanga', labelAr: 'بانغا تونغا' },
  { code: 'TRY', label: 'Turkish Lira', labelAr: 'ليرة تركية' },
  { code: 'TTD', label: 'Trinidad & Tobago Dollar', labelAr: 'دولار ترينداد وتوباغو' },
  { code: 'TWD', label: 'New Taiwan Dollar', labelAr: 'دولار تايواني' },
  { code: 'TZS', label: 'Tanzanian Shilling', labelAr: 'شلن تنزاني' },
  { code: 'UAH', label: 'Ukrainian Hryvnia', labelAr: 'هريفنيا أوكراني' },
  { code: 'UGX', label: 'Ugandan Shilling', labelAr: 'شلن أوغندي' },
  { code: 'USD', label: 'US Dollar', labelAr: 'دولار أمريكي' },
  { code: 'USN', label: 'US Dollar (Next day)', labelAr: 'دولار أمريكي (اليوم التالي)‏' },
  { code: 'UYI', label: 'Uruguayan Peso (Indexed Units)', labelAr: 'Uruguayan Peso (Indexed Units)' },
  { code: 'UYU', label: 'Uruguayan Peso', labelAr: 'بيزو اوروغواي' },
  { code: 'UYW', label: 'Uruguayan Nominal Wage Index Unit', labelAr: 'Uruguayan Nominal Wage Index Unit' },
  { code: 'UZS', label: 'Uzbekistani Som', labelAr: 'سوم أوزبكستاني' },
  { code: 'VED', label: 'Bolívar Soberano', labelAr: 'Bolívar Soberano' },
  { code: 'VES', label: 'Venezuelan Bolívar', labelAr: 'بوليفار فنزويلي' },
  { code: 'VND', label: 'Vietnamese Dong', labelAr: 'دونج فيتنامي' },
  { code: 'VUV', label: 'Vanuatu Vatu', labelAr: 'فاتو فانواتو' },
  { code: 'WST', label: 'Samoan Tala', labelAr: 'تالا ساموا' },
  { code: 'XAD', label: 'Arab Accounting Dinar', labelAr: 'Arab Accounting Dinar' },
  { code: 'XAF', label: 'Central African CFA Franc', labelAr: 'فرنك وسط أفريقي' },
  { code: 'XCD', label: 'East Caribbean Dollar', labelAr: 'دولار شرق الكاريبي' },
  { code: 'XCG', label: 'Caribbean Guilder', labelAr: 'Caribbean Guilder' },
  { code: 'XDR', label: 'Special Drawing Rights', labelAr: 'حقوق السحب الخاصة' },
  { code: 'XOF', label: 'West African CFA Franc', labelAr: 'فرنك غرب أفريقي' },
  { code: 'XPF', label: 'CFP Franc', labelAr: 'فرنك سي إف بي' },
  { code: 'XSU', label: 'Sucre', labelAr: 'Sucre' },
  { code: 'XUA', label: 'ADB Unit of Account', labelAr: 'ADB Unit of Account' },
  { code: 'YER', label: 'Yemeni Rial', labelAr: 'ريال يمني' },
  { code: 'ZAR', label: 'South African Rand', labelAr: 'راند جنوب أفريقيا' },
  { code: 'ZMW', label: 'Zambian Kwacha', labelAr: 'كواشا زامبي' },
  { code: 'ZWG', label: 'Zimbabwe Gold', labelAr: 'Zimbabwe Gold' },
];

export function currencyLabel(code: string | undefined, isAr: boolean): string {
  if (!code) return '';
  const c = ISO_4217_CURRENCIES.find(x => x.code === code);
  if (!c) return code;
  return isAr ? `${code} -- ${c.labelAr}` : `${code} -- ${c.label}`;
}
