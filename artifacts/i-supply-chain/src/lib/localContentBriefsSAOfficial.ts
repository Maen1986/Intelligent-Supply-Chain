// Module 08 Program Briefs -- Saudi Arabia, rebuilt from LCGPA's official files supplied by the platform owner (24 Oct 2026):
//  - Mandatory List workbooks (government entities, June 2025; state-owned companies)
//  - Exemption-controls document for the Mandatory List
//  - Price-preference contract report (supply contracts) with its instructions
//  - Official targeted-local-content forms OM-LRF-09 (contract level) and OM-LRF-10 (enterprise level)
//  - A practitioner booklet describing the five LCGPA mechanisms (used for mechanism mapping by contract type and value;
//    where a figure rests only on the booklet the confidence badge says so).
// These entries override the earlier Saudi entries of the same key (see localContentBriefs.ts).
import { b, type ProgramBrief } from './localContentBriefTypes';

export const SA_BRIEFS_OFFICIAL: Record<string, ProgramBrief> = {
  'sa-mandatory-list': {
    confidence: 'official',
    tools: ['mechanism-finder', 'mandatory-list'],
    headline: { value: b('1,444 products', '١٬٤٤٤ منتجاً'), label: b('on the June 2025 list for government entities, each with a price ceiling of 10% to 30%', 'في قائمة يونيو ٢٠٢٥ للجهات الحكومية، ولكل منتج سقف سعري بين ١٠٪ و٣٠٪') },
    verdict: b(
      'If your product is on the list, a bid that does not commit to a national factory is excluded, whatever its price. Look up each product code first: it tells you the price ceiling, the factory-certificate condition and the date the duty started.',
      'إذا كان منتجك في القائمة فالعرض الذي لا يلتزم بمصنع وطني يُستبعد مهما كان سعره. ابحث عن رمز كل منتج أولاً؛ فهو يخبرك بالسقف السعري وشرط شهادة المصنع وتاريخ بدء الإلزام.'),
    steps: [
      b('Find each product by its Etimad code. The list covers 16 sectors; state-owned companies have their own start dates.', 'ابحث عن كل منتج برمز «اعتماد». تغطي القائمة ١٦ قطاعاً، وللشركات المملوكة للدولة تواريخ بدء خاصة بها.'),
      b('Bid with a written undertaking to supply from a national factory, and attach the factory\'s local-content certificate where the list requires one.', 'قدّم عرضك مع تعهد كتابي بالتوريد من مصنع وطني، وأرفق شهادة المحتوى المحلي للمصنع حيث تشترطها القائمة.'),
      b('A bid that does not comply is excluded (Article 9). If the tender can be split, only the non-compliant items are excluded.', 'يُستبعد العرض غير الملتزم (المادة التاسعة). وإذا كانت المنافسة قابلة للتجزئة فتُستبعد البنود غير الملتزمة فقط.'),
      b('If the buyer cannot apply the list to an item, it asks LCGPA for an exemption on one of five grounds. The item stays out of the tender until LCGPA approves.', 'إذا تعذّر على الجهة تطبيق القائمة على بند فإنها تطلب من الهيئة استثناءً لأحد خمسة أسباب، ولا يُدرج البند في المنافسة قبل اعتماد الهيئة.'),
    ],
    next: [
      { when: 'before', text: b('Run every product you plan to supply through the lookup below and note its ceiling and certificate condition.', 'مرّر كل منتج تنوي توريده في البحث أدناه ودوّن سقفه وشرط الشهادة.') },
      { when: 'before', text: b('Ask your factory for its local-content certificate now: some lines require it from a set date, and it takes time to obtain.', 'اطلب شهادة المحتوى المحلي من مصنعك الآن؛ فبعض البنود تشترطها من تاريخ محدد، والحصول عليها يستغرق وقتاً.') },
      { when: 'with-bid', text: b('Attach the signed undertaking and the certificate. If you believe an item should be exempt, tell the buyer early: the exemption request is the buyer\'s to file, not yours.', 'أرفق التعهد الموقّع والشهادة. وإن رأيت أن بنداً يستحق الاستثناء فأبلغ الجهة مبكراً؛ فطلب الاستثناء من اختصاص الجهة لا من اختصاصك.') },
      { when: 'after', text: b('Report your national-product share within 30 days of contract end. Shortfalls carry fines.', 'ارفع تقرير حصة المنتجات الوطنية خلال ٣٠ يوماً من نهاية العقد؛ فالنقص عن الحصة يترتب عليه غرامات.') },
    ],
    watch: [
      b('The list gives a price ceiling and a certificate condition per product. It does not publish a numeric minimum-baseline percentage, and ISC does not invent one.', 'تعطي القائمة سقفاً سعرياً وشرط شهادة لكل منتج، ولا تنشر نسبة رقمية للحد الأدنى لخط الأساس، ولا يختلق النظام نسبة.'),
      b('Exemption needs evidence: letters from three national factories, or three national and three foreign price offers. LCGPA must approve above a value limit and replies within 10 working days; silence counts as approval.', 'الاستثناء يحتاج أدلة: خطابات من ثلاثة مصانع وطنية، أو ثلاثة عروض أسعار وطنية وثلاثة أجنبية. وتلزم موافقة الهيئة فوق حد قيمة محدد، وترد خلال ١٠ أيام عمل، والسكوت يُعدّ موافقة.'),
      b('The exemption document prints the value limit as "3,000,000" with inconsistent unit wording. Confirm the exact limit with LCGPA before relying on it.', 'تطبع وثيقة الاستثناء حد القيمة «٣٬٠٠٠٬٠٠٠» بصياغة غير متسقة للوحدة؛ فتأكد من الحد الدقيق لدى الهيئة قبل الاعتماد عليه.'),
    ],
  },

  'sa-price-preference': {
    confidence: 'official',
    tools: ['mechanism-finder', 'sa-adjusted-bid', 'penalty-exposure'],
    headline: { value: b('+10%', '+١٠٪'), label: b('assumed uplift on the foreign share of your bid at evaluation', 'زيادة مفترضة على الجزء الأجنبي من عرضك عند التقييم') },
    verdict: b(
      'The buyer evaluates as if foreign products cost 10% more, so every riyal of national product you add lowers your evaluated price. The contractor must also apply it to its own subcontractors.',
      'تقيّم الجهة العروض كما لو أن المنتجات الأجنبية أغلى بنسبة ١٠٪، فكل ريال من المنتجات الوطنية تضيفه يخفض سعرك المقيَّم. ويلزم المتعاقد بتطبيقها على مقاوليه من الباطن.'),
    steps: [
      b('Work out your national-product share: national products (excluding Mandatory List items) ÷ total bid value (excluding Mandatory List items).', 'احسب حصة المنتجات الوطنية: قيمة المنتجات الوطنية (دون بنود القائمة الإلزامية) ÷ إجمالي قيمة العرض (دون بنود القائمة الإلزامية).'),
      b('Adjusted bid = bid price + 10% × bid price × (1 − national share).', 'العرض المعدَّل = سعر العرض + ١٠٪ × سعر العرض × (١ − حصة المنتجات الوطنية).'),
      b('The rate can be raised by agreement between LCGPA and the buyer, and must then be stated in the tender documents.', 'يجوز رفع النسبة باتفاق بين الهيئة والجهة، وعندئذٍ تُوضَّح في وثائق المنافسة.'),
      b('After the contract, report the national-product share you delivered. A shortfall carries fines.', 'بعد العقد ارفع تقريراً بحصة المنتجات الوطنية التي حققتها؛ والنقص يترتب عليه غرامات.'),
    ],
    next: [
      { when: 'before', text: b('Use the adjuster below to see how much a higher national share lowers your evaluated price, then price local sourcing into the bid.', 'استخدم أداة التعديل أدناه لترى كم تخفض الحصة الوطنية الأعلى سعرك المقيَّم، ثم أدرج كلفة التوريد المحلي في عرضك.') },
      { when: 'with-bid', text: b('State the national-product share you commit to, with the list of national products behind it.', 'اذكر حصة المنتجات الوطنية التي تلتزم بها مع قائمة المنتجات الوطنية التي تسندها.') },
      { when: 'after', text: b('Fill the contractor report within 30 days of contract end. The buyer reviews it within 10 days and sends LCGPA a copy.', 'عبّئ تقرير المتعاقد خلال ٣٠ يوماً من نهاية العقد؛ وتراجعه الجهة خلال ١٠ أيام وترسل نسخة للهيئة.') },
    ],
    watch: [
      b('If the share you reported differs from the share you delivered by more than 50 points, the buyer can refer you for debarment or a rating cut (Article 88(3) of the system).', 'إذا زاد الفرق بين الحصة التي قدّمتها والحصة الفعلية على ٥٠ نقطة جاز للجهة رفع أمرك لمنعك من التعامل أو خفض تصنيفك (المادة ٨٨ فقرة ٣ من النظام).'),
      b('Prove national origin with the manufacturer\'s declaration. Mandatory List items that need a factory certificate still need it.', 'أثبت وطنية المنتج بإقرار المصنع. وبنود القائمة الإلزامية التي تتطلب شهادة مصنع تظل تحتاجها.'),
    ],
    priceTest: { pct: 0.1, mode: 'add-to-rival', rateNote: b('Applied to the foreign share only', 'تُطبَّق على الجزء الأجنبي فقط') },
  },

  'sa-contract-minimum': {
    confidence: 'corroborated',
    tools: ['mechanism-finder', 'targeted-contract', 'contract-minimum', 'saudization-check', 'penalty-exposure', 'tender-checklist'],
    headline: { value: b('≥ SAR 25M', '٢٥ مليون ريال فأكثر'), label: b('high-value service contracts: a mandatory minimum local content, measured per contract', 'عقود الخدمات عالية القيمة: حد أدنى إلزامي للمحتوى المحلي يُقاس على مستوى العقد') },
    verdict: b(
      'You must state a targeted local-content percentage in your technical offer, never below the minimum the buyer sets, and then deliver it by contract end. Price your plan before you promise the number.',
      'يجب أن تذكر في عرضك الفني نسبة مستهدفة للمحتوى المحلي لا تقل عن الحد الذي تحدده الجهة، ثم تحققها بنهاية العقد. سعّر خطتك قبل أن تعد بالرقم.'),
    steps: [
      b('LCGPA and the buyer pick the projects. Supply contracts are outside this mechanism.', 'تحدد الهيئة والجهة المشاريع، وعقود التوريد خارج هذه الآلية.'),
      b('Complete the official contract-level form: workforce pay, goods and services, Saudi training, supplier development, R&D and depreciation.', 'عبّئ النموذج الرسمي على مستوى العقد: أجور القوى العاملة، والسلع والخدمات، وتدريب السعوديين، وتطوير الموردين، والبحث والتطوير، والإهلاك.'),
      b('Your targeted % = local value ÷ total related cost. Attach the form to the technical offer and say whether you are listed on the Saudi exchange.', 'نسبتك المستهدفة = القيمة المحلية ÷ إجمالي التكلفة ذات الصلة. أرفق النموذج بالعرض الفني وبيّن هل أنت مدرج في السوق المالية السعودية.'),
      b('If you win: phased plan within 60 days of award, periodic reports (none in the first six months, or on contracts under a year), and an audited final report within seven months of contract end. The final report releases the final guarantee.', 'عند الفوز: خطة تدرجية خلال ٦٠ يوماً من الترسية، وتقارير دورية (لا تُطلب في الأشهر الستة الأولى ولا في العقود التي تقل عن سنة)، وتقرير نهائي مدقَّق خلال سبعة أشهر من نهاية العقد. ويُفرج عن الضمان النهائي بتقديمه.'),
    ],
    next: [
      { when: 'before', text: b('Run the calculator below with your real cost plan. If the result is under the minimum, see which line moves it most before you bid.', 'شغّل الحاسبة أدناه بخطة كلفتك الفعلية. فإن جاءت النتيجة دون الحد الأدنى فانظر أي بند يحركها أكثر قبل أن تقدّم العرض.') },
      { when: 'before', text: b('List your top suppliers (at least 70% of goods and services, or the top 40) with their audited local-content % if they have one.', 'أعدّ قائمة بأكبر مورديك (٧٠٪ على الأقل من السلع والخدمات أو أكبر ٤٠ مورداً) مع نسبة المحتوى المحلي المدققة لكل مورد إن وُجدت.') },
      { when: 'with-bid', text: b('Submit the official form with the technical offer. It is mandatory for high-value contracts.', 'قدّم النموذج الرسمي مع العرض الفني؛ فهو إلزامي في العقود عالية القيمة.') },
      { when: 'after', text: b('Track the plan against the number you promised every period. A shortfall found at the final report is too late to fix.', 'تابع الخطة مقابل الرقم الذي وعدت به في كل فترة؛ فاكتشاف النقص عند التقرير النهائي متأخر جداً لتداركه.') },
    ],
    watch: [
      b('ISC cannot know the minimum LCGPA sets for your contract. Enter it from the tender documents.', 'لا يعرف النظام الحد الأدنى الذي تحدده الهيئة لعقدك؛ أدخله من وثائق المنافسة.'),
      b('The 53.4% foreign-workforce factor and the 38 sector percentages come from the official form. Your audited supplier percentage replaces the sector percentage when you have one.', 'عامل القوى العاملة الأجنبية ٥٣٫٤٪ ونسب القطاعات الـ٣٨ مأخوذة من النموذج الرسمي، وتحل نسبة المورد المدققة محل نسبة القطاع إن وُجدت.'),
    ],
  },

  'sa-financial-evaluation-weight': {
    confidence: 'corroborated',
    tools: ['mechanism-finder', 'targeted-enterprise', 'financial-evaluation', 'penalty-exposure'],
    headline: { value: b('60 / 40', '٦٠ / ٤٠'), label: b('financial evaluation: 60% price, 40% local content, after technical qualification', 'التقييم المالي: ٦٠٪ للسعر و٤٠٪ للمحتوى المحلي، بعد التأهل الفني') },
    verdict: b(
      'On high-value contracts a cheaper bid can still lose to a stronger local-content bid. Your local-content score is worth as much as a large price gap.',
      'في العقود عالية القيمة قد يخسر العرض الأرخص أمام عرض أقوى في المحتوى المحلي؛ فدرجة محتواك المحلي تعادل فارقاً سعرياً كبيراً.'),
    steps: [
      b('Your bid first passes the technical evaluation.', 'يجتاز عرضك أولاً التقييم الفني.'),
      b('The financial score then weighs price at 60% and local content at 40%.', 'ثم تُوزَّن الدرجة المالية بواقع ٦٠٪ للسعر و٤٠٪ للمحتوى المحلي.'),
      b('Local content draws on your actual local content (baseline certificate), the targeted % in your offer, and whether you are listed on the Saudi exchange.', 'يستند المحتوى المحلي إلى محتواك المحلي الفعلي (شهادة خط الأساس)، والنسبة المستهدفة في عرضك، وكونك مدرجاً في السوق المالية.'),
      b('LCGPA and the buyer decide if it is measured per contract or per enterprise. The enterprise form adds up to 10 points for R&D: 2% of revenue earns all 10.', 'تقرر الهيئة والجهة هل يُقاس على مستوى العقد أم المنشأة. ويضيف نموذج المنشأة حتى ١٠ نقاط للبحث والتطوير: ٢٪ من الإيرادات تمنح ١٠ نقاط كاملة.'),
    ],
    next: [
      { when: 'before', text: b('Get your baseline certificate in place before the tender: it is the only part of your score you cannot improve after submission.', 'استكمل شهادة خط الأساس قبل المنافسة؛ فهي الجزء الوحيد من درجتك الذي لا يمكن تحسينه بعد التقديم.') },
      { when: 'before', text: b('Use the enterprise calculator to test whether R&D spend is worth it: it earns points pro rata up to 2% of revenue.', 'استخدم حاسبة المنشأة لاختبار جدوى الإنفاق على البحث والتطوير؛ فهو يكسب نقاطاً بالتناسب حتى ٢٪ من الإيرادات.') },
      { when: 'with-bid', text: b('Attach the enterprise-level form with the technical offer when the tender asks for it.', 'أرفق نموذج المنشأة بالعرض الفني حين تطلبه المنافسة.') },
    ],
    watch: [
      b('The exact scoring formula is set in the tender documents. ISC\'s scoring below is a proportional illustration, not LCGPA\'s formula.', 'تُحدَّد صيغة الدرجات الدقيقة في وثائق المنافسة، والتقدير أدناه توضيح تناسبي وليس صيغة الهيئة.'),
      b('The split of the 40% between the three elements is not published in the files reviewed.', 'لم يُنشر في الملفات المراجَعة توزيع الـ٤٠٪ بين العناصر الثلاثة.'),
    ],
  },

  'sa-sme-preference': {
    confidence: 'official',
    tools: ['mechanism-finder', 'sme-check'],
    headline: { value: b('10%', '١٠٪'), label: b('other bidders\' prices are assumed 10% higher than stated', 'تُفترض أسعار عروض المتنافسين الآخرين أعلى بنسبة ١٠٪ مما ذُكر') },
    verdict: b(
      'If you qualify as a local SME, your offer can win while up to 10% above a larger rival. It applies to non-supply contracts below the high-value threshold only.',
      'إذا تأهلت منشأة صغيرة أو متوسطة محلية فقد يفوز عرضك وهو أعلى بنسبة تصل إلى ١٠٪ من منافس أكبر. وتسري على عقود غير التوريد التي تقل عن حد القيمة العالية فقط.'),
    steps: [
      b('You must be classified small or medium by the SME General Authority (Monsha\'at).', 'يجب أن تكون مصنَّفاً صغيراً أو متوسطاً لدى الهيئة العامة للمنشآت الصغيرة والمتوسطة (منشآت).'),
      b('Saudi ownership of capital must be at least 50%.', 'يجب ألا تقل ملكية السعوديين لرأس المال عن ٥٠٪.'),
      b('Attach a valid Monsha\'at certificate to the bid.', 'أرفق شهادة سارية من منشآت بالعرض.'),
      b('The evaluator then treats other bidders\' prices as 10% higher than they offered.', 'يعامل المقيِّم أسعار العروض الأخرى كأنها أعلى بنسبة ١٠٪ مما عرضته.'),
    ],
    next: [
      { when: 'before', text: b('Check the certificate\'s expiry against the bid closing date. An expired certificate gives no preference.', 'قارن تاريخ انتهاء الشهادة بموعد إغلاق العرض؛ فالشهادة المنتهية لا تمنح أفضلية.') },
      { when: 'with-bid', text: b('Attach the certificate and show the Saudi ownership split of capital.', 'أرفق الشهادة وبيّن توزيع ملكية رأس المال بين السعوديين وغيرهم.') },
    ],
    watch: [
      b('Source: Art. 4(2) of the Local Content Preference Regulation (read 25 Oct 2026): prices of other bids are assumed higher by 10%, in all non-supply contracts below the high-value threshold. Arts 18(2) and 27(2) set the same preference as "not more than 10%".', 'المصدر: المادة ٤(٢) من لائحة تفضيل المحتوى المحلي (اطُّلع عليها ٢٥ أكتوبر ٢٠٢٦): تُفترض أسعار العروض الأخرى أعلى بنسبة ١٠٪ في جميع العقود غير التوريد التي تقل عن حد القيمة العالية. وتنص المادتان ١٨(٢) و٢٧(٢) على الأفضلية نفسها بعبارة «لا تتجاوز ١٠٪».'),
      b('The SME definition (Article 1) refers to a Monsha\'at certificate and at least 50% citizen ownership; that wording appears in the marked-up amendments text, whose adoption date ISC could not confirm. Check the tender documents for the certificate rule.', 'يشير تعريف المنشآت الصغيرة والمتوسطة (المادة ١) إلى شهادة منشآت وملكية مواطنين لا تقل عن ٥٠٪؛ وهذه الصياغة واردة في نص التعديلات المعلَّم الذي لم تتأكد المنصة من تاريخ نفاذه. راجع وثائق المنافسة بشأن شرط الشهادة.'),
      b('The preference does not apply to supply contracts or high-value contracts (SAR 25 million and above).', 'لا تسري الأفضلية على عقود التوريد ولا على العقود عالية القيمة (٢٥ مليون ريال فأكثر).'),
    ],
    priceTest: { pct: 0.1, mode: 'add-to-rival', rateNote: b('Applied to rival bids', 'تُطبَّق على عروض المنافسين') },
  },
};
