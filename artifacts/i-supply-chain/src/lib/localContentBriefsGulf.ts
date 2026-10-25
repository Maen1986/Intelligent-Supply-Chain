// Module 08 Program Briefs -- UAE, Jordan, Oman, Qatar, Bahrain, Kuwait (21 programs).
// Honesty rule: every figure below appears in the program's own sourced note (supplierLocalContentEligibility.ts). No figure is added here.
import { b, type ProgramBrief } from './localContentBriefTypes';

export const GULF_BRIEFS: Record<string, ProgramBrief> = {
  // ---------------- UAE ----------------
  'ae-icv-general': {
    confidence: 'single',
    headline: { value: b('14 months', '١٤ شهراً'), label: b('validity of the audited ICV certificate', 'مدة سريان شهادة القيمة المحلية المضافة المدقَّقة') },
    verdict: b(
      'Public and "Program Partner" buyers rank you on a certified ICV score, so you need an audited certificate before you bid. The formula shown here is a reconstruction from public sources: do not rely on it for a certification decision.',
      'تُرتِّبك الجهات الحكومية و«شركاء البرنامج» وفق درجة قيمة محلية مضافة معتمدة، لذا تحتاج شهادة مدقَّقة قبل تقديم العرض. الصيغة المعروضة هنا إعادة بناء من مصادر عامة، فلا تعتمد عليها في قرار الاعتماد.'),
    steps: [
      b('Score your spend and workforce across four components: manufacturing/third-party spend, investment, Emiratisation and expatriate contribution.', 'احتسب إنفاقك وقوتك العاملة عبر أربعة مكونات: التصنيع والإنفاق على الغير، والاستثمار، والتوطين، ومساهمة الوافدين.'),
      b('Add the capped bonus categories you qualify for.', 'أضف فئات المكافأة المحددة بسقف التي تستوفيها.'),
      b('A firm authorised by MoIAT audits the figures and issues the certificate.', 'تدقّق شركة معتمدة من وزارة الصناعة والتكنولوجيا المتقدمة الأرقام وتصدر الشهادة.'),
      b('The buyer uses the certified score in its evaluation. The certificate lasts 14 months.', 'تستخدم الجهة الدرجة المعتمدة في تقييمها، وتسري الشهادة ١٤ شهراً.'),
    ],
    next: [
      { when: 'before', text: b('Book an authorised auditor now. The certificate is the entry ticket, and the score you compute yourself is only an estimate.', 'احجز مدقِّقاً معتمداً الآن؛ فالشهادة هي بطاقة الدخول، والدرجة التي تحسبها بنفسك مجرد تقدير.') },
      { when: 'before', text: b('Check MoIAT\'s current formula before relying on the reconstruction shown here.', 'راجع الصيغة الحالية لدى الوزارة قبل الاعتماد على إعادة البناء المعروضة هنا.') },
      { when: 'with-bid', text: b('Attach the certificate and confirm its validity covers the full evaluation period.', 'أرفق الشهادة وتأكد أن سريانها يغطي فترة التقييم كاملة.') },
      { when: 'after', text: b('Diary the certificate expiry: 14 months from issue.', 'سجّل تاريخ انتهاء الشهادة: ١٤ شهراً من تاريخ الإصدار.') },
    ],
    watch: [
      b('Covers public spending and "Program Partner" tenders. No sourced evidence for private-to-private bids.', 'يشمل الإنفاق العام ومناقصات «شركاء البرنامج». لا يوجد دليل موثَّق للعقود بين القطاعين الخاصين.'),
      b('Reconstructed formula: verify before a real certification decision.', 'الصيغة معاد بناؤها: تحقق منها قبل أي قرار اعتماد فعلي.'),
    ],
  },

  'ae-tawazun-offset': {
    confidence: 'corroborated',
    headline: { value: b('60%', '٦٠٪'), label: b('offset-credit target of contract value (USD 10M+ defense contracts)', 'مستهدف رصيد التوازن الاقتصادي من قيمة العقد (عقود الدفاع ١٠ ملايين دولار فأكثر)') },
    verdict: b(
      'On a UAE Armed Forces or Abu Dhabi Police contract worth USD 10 million or more, you owe offset credits equal to 60% of contract value. Size the obligation before you price the bid.',
      'في عقد للقوات المسلحة الإماراتية أو شرطة أبوظبي بقيمة ١٠ ملايين دولار فأكثر يترتب عليك رصيد توازن اقتصادي يعادل ٦٠٪ من قيمة العقد. قدِّر الالتزام قبل تسعير العرض.'),
    steps: [
      b('Contract value reaches USD 10 million (AED 36.73 million at the fixed peg): the obligation applies.', 'تبلغ قيمة العقد ١٠ ملايين دولار (٣٦٫٧٣ مليون درهم): ينشأ الالتزام.'),
      b('Your credit target is 60% of contract value, earned through approved offset projects.', 'مستهدفك ٦٠٪ من قيمة العقد، تكسبه عبر مشاريع توازن معتمدة.'),
      b('You post an 8.5% bank guarantee against the obligation.', 'تقدّم ضمان بنكياً بنسبة ٨٫٥٪ مقابل الالتزام.'),
      b('At period end, settle any shortfall by paying 8.5% of the shortfall value, or roll it into a new project.', 'في نهاية المدة تسوّي أي عجز بدفع ٨٫٥٪ من قيمة العجز، أو تنقله إلى مشروع جديد.'),
    ],
    next: [
      { when: 'before', text: b('Run the obligation sizer below on your quote and add the guarantee cost to your price.', 'شغّل حاسبة الالتزام أدناه على عرضك وأضف كلفة الضمان إلى سعرك.') },
      { when: 'with-bid', text: b('Name your offset projects and partners in the bid rather than promising them later.', 'سمِّ مشاريع التوازن وشركاءك في العرض بدلاً من الوعد بها لاحقاً.') },
      { when: 'after', text: b('Track credits earned against the 60% target every quarter so a shortfall never surprises you.', 'تابع الأرصدة المكتسبة مقابل مستهدف ٦٠٪ كل ربع سنة كي لا يفاجئك أي عجز.') },
    ],
    watch: [
      b('This is Tawazun\'s defense program, not MoIAT\'s general ICV. A different body, buyer and legal basis.', 'هذا برنامج الدفاع لدى مجلس التوازن الاقتصادي، وليس برنامج القيمة المحلية العام لوزارة الصناعة؛ جهة وعميل وأساس قانوني مختلف.'),
    ],
    obligation: { pct: 0.6, baseLabel: b('Contract value', 'قيمة العقد'), currency: 'AED', threshold: 36730000, multipliers: [{ label: b('Credit at face value (no multiplier sourced)', 'الرصيد بقيمته الاسمية (لا يوجد مضاعف موثَّق)'), value: 1 }] },
  },

  'ae-gcc-origin-treatment': {
    confidence: 'single',
    headline: { value: b('40% + 51%', '٤٠٪ + ٥١٪'), label: b('GCC value-added AND GCC-citizen plant ownership, both required', 'قيمة مضافة خليجية وملكية خليجية للمصنع، والشرطان معاً') },
    verdict: b(
      'Your product counts as a GCC "national manufactured product" only if both tests pass. Whether that earns citizen-equivalent treatment in UAE procurement is not confirmed against a numbered article.',
      'يُعدّ منتجك «منتجاً وطنياً مصنَّعاً» خليجياً فقط إذا تحقق الشرطان معاً. أما حصوله على معاملة المواطن في المشتريات الإماراتية فغير مؤكد بمادة نظامية محددة.'),
    steps: [
      b('Test 1: at least 40% of the product\'s value is added inside the GCC.', 'الاختبار الأول: لا تقل القيمة المضافة داخل دول الخليج عن ٤٠٪ من قيمة المنتج.'),
      b('Test 2: at least 51% of the producing plant is owned by GCC citizens.', 'الاختبار الثاني: يملك مواطنون خليجيون ٥١٪ على الأقل من المصنع المنتج.'),
      b('Pass both and you meet Article 3(1) of the GCC Unified Economic Agreement.', 'إذا اجتزت الاختبارين تستوفي المادة ٣(١) من الاتفاقية الاقتصادية الموحدة.'),
    ],
    next: [
      { when: 'before', text: b('Assemble value-added and ownership evidence per product before you claim origin.', 'جمّع أدلة القيمة المضافة والملكية لكل منتج قبل ادعاء المنشأ.') },
      { when: 'with-bid', text: b('Ask the buyer in writing whether GCC origin earns national treatment in this tender.', 'اسأل الجهة كتابياً هل يمنح المنشأ الخليجي معاملة وطنية في هذه المناقصة.') },
    ],
    watch: [
      b('Neither MoIAT\'s ICV materials nor Federal Decree-Law No. 11 of 2023 was found to restate the rule.', 'لم يُعثر على ما يعيد النص على القاعدة في مواد الوزارة ولا في المرسوم بقانون اتحادي رقم ١١ لسنة ٢٠٢٣.'),
    ],
  },

  // ---------------- Jordan ----------------
  'jo-price-preference': {
    confidence: 'corroborated',
    headline: { value: b('20%', '٢٠٪'), label: b('price preference for locally manufactured products (raised from 15%)', 'أفضلية سعرية للمنتجات المصنَّعة محلياً (ارتفعت من ١٥٪)') },
    verdict: b(
      'In Jordanian government tenders, a locally manufactured product gets a 20% price edge. The percentage is a Cabinet decision, not fixed in the Bylaw, so check the current rate at each tender.',
      'في العطاءات الحكومية الأردنية يحصل المنتج المصنَّع محلياً على أفضلية سعرية ٢٠٪. والنسبة بقرار من مجلس الوزراء وليست مثبتة في النظام، فتحقق من النسبة الحالية عند كل عطاء.'),
    steps: [
      b('Your product is manufactured in Jordan.', 'يُصنَّع منتجك في الأردن.'),
      b('The evaluator applies the 20% preference when comparing prices.', 'تطبّق لجنة التقييم أفضلية ٢٠٪ عند مقارنة الأسعار.'),
      b('Tied bids are resolved under Article 15(b)(1) of Bylaw No. 8 of 2022.', 'تُحسم العروض المتعادلة وفق المادة ١٥(ب)(١) من نظام المشتريات الحكومية رقم ٨ لسنة ٢٠٢٢.'),
    ],
    next: [
      { when: 'before', text: b('Use the price test to see how far above a foreign offer you can price and still win.', 'استخدم اختبار السعر لمعرفة إلى أي حد يمكنك تسعير عرضك فوق العرض الأجنبي والفوز.') },
      { when: 'with-bid', text: b('Document local manufacture clearly: the preference applies to products, not to company ownership.', 'وثّق التصنيع المحلي بوضوح؛ فالأفضلية للمنتج وليست لملكية الشركة.') },
    ],
    watch: [
      b('The rate changes by Cabinet decision. It was raised from 15% to 20% (announced 8-9 Jun 2026).', 'تتغير النسبة بقرار من مجلس الوزراء؛ فقد رُفعت من ١٥٪ إلى ٢٠٪ (أُعلن في ٨-٩ حزيران ٢٠٢٦).'),
      b('It adjusts bid evaluation. It is not your own local-content percentage.', 'تعدّل تقييم العرض، وليست نسبة المحتوى المحلي الخاصة بشركتك.'),
    ],
    priceTest: { pct: 0.2, mode: 'deduct-own', rateNote: b('Cabinet rate; simple model, check how the buyer applies it', 'نسبة بقرار مجلس الوزراء؛ نموذج مبسّط، تحقق من طريقة تطبيق الجهة لها') },
  },

  'jo-contractor-quota': {
    confidence: 'single',
    headline: { value: b('35%', '٣٥٪'), label: b('minimum Jordanian-contractor share in international tenders', 'حد أدنى لحصة المقاولين الأردنيين في العطاءات الدولية') },
    verdict: b(
      'If you bid as a foreign contractor on a project in Jordan, plan for Jordanian contractors to carry at least 35% of the work. The 2018 decision has no primary-source reconfirmation after 2022.',
      'إذا تتقدم كمقاول أجنبي لمشروع في الأردن فخطِّط لأن يتولى مقاولون أردنيون ٣٥٪ على الأقل من الأعمال. ولا يوجد تأكيد من مصدر أولي للقرار الصادر عام ٢٠١٨ بعد عام ٢٠٢٢.'),
    steps: [
      b('Check whether the tender is international and the project is in Jordan.', 'تحقق من أن العطاء دولي والمشروع داخل الأردن.'),
      b('Line up Jordanian contractors for at least 35% of the work, and Jordanian consultants for design and supervision.', 'رتّب مع مقاولين أردنيين لتنفيذ ٣٥٪ على الأقل من الأعمال، ومع استشاريين أردنيين للتصميم والإشراف.'),
      b('Six named energy and environment projects use a 20%-40% quota instead.', 'ست مشاريع محددة في الطاقة والبيئة تخضع لحصة ٢٠٪-٤٠٪ بدلاً من ذلك.'),
    ],
    next: [
      { when: 'before', text: b('Ask the tendering entity for the quota applying to this specific tender before you form a consortium.', 'اسأل الجهة المعلنة عن الحصة المطبقة على هذا العطاء تحديداً قبل تشكيل التحالف.') },
      { when: 'with-bid', text: b('Name your Jordanian partners and their scope shares in the bid.', 'سمِّ شركاءك الأردنيين وحصص أعمالهم في العرض.') },
    ],
    watch: [
      b('The plan envisaged a 5-point annual rise during 2018-2022. Whether it continued is not confirmed.', 'تصورت الخطة زيادة سنوية بخمس نقاط خلال ٢٠١٨-٢٠٢٢، ولم يتأكد استمرارها.'),
    ],
  },

  // ---------------- Oman ----------------
  'om-icv': {
    confidence: 'none',
    headline: { value: b('7 elements', '٧ عناصر'), label: b('named by PTLC, with no published weighting', 'سمّتها الهيئة دون نشر أوزان') },
    verdict: b(
      'Oman scores ICV on seven named elements but publishes no weights, so ISC cannot compute a score for you. Treat it as a checklist of what the buyer will look at.',
      'تقيّم عُمان القيمة المحلية المضافة على سبعة عناصر مسمّاة لكنها لا تنشر أوزانها، لذا لا يستطيع النظام حساب درجة لك. اعتبرها قائمة تحقق بما ستنظر فيه الجهة.'),
    steps: [
      b('Fixed-asset investment, workforce skills, Omani training, local goods sourcing.', 'الاستثمار في الأصول الثابتة، ومهارات القوى العاملة، وتدريب العمانيين، وتوريد السلع محلياً.'),
      b('Local subcontracted services, national supplier development, and training or R&D institution development.', 'الخدمات المتعاقد عليها محلياً، وتطوير الموردين الوطنيين، وتطوير مؤسسات التدريب والبحث.'),
    ],
    next: [
      { when: 'before', text: b('Prepare evidence for each of the seven elements now: it costs little and shows seriousness.', 'جهّز أدلة للعناصر السبعة الآن؛ كلفتها قليلة وتدل على الجدية.') },
      { when: 'before', text: b('Ask the buyer how ICV is weighted in this tender; do not assume.', 'اسأل الجهة عن وزن القيمة المحلية في هذا العطاء ولا تفترض.') },
    ],
    watch: [
      b('The 2024-2030 National Local Content Policy is a roadmap, not a scoring tool.', 'السياسة الوطنية للمحتوى المحلي ٢٠٢٤-٢٠٣٠ خارطة طريق وليست أداة تقييم.'),
    ],
  },

  'om-mandatory-list': {
    confidence: 'single',
    headline: { value: b('Pass / fail', 'نجاح / رسوب'), label: b('reserved categories for Omani SMEs and local suppliers', 'فئات محجوزة للمنشآت الصغيرة والمتوسطة العمانية والموردين المحليين') },
    verdict: b(
      'If your category is reserved, a non-qualifying bidder is out regardless of price. The category list itself has not been found published, so confirm with PTLC.',
      'إذا كانت فئتك محجوزة فالمتقدم غير المؤهَّل مستبعد مهما كان سعره. ولم يُعثر على قائمة الفئات منشورة، فتأكد من الهيئة.'),
    steps: [
      b('Check whether your category is on PTLC\'s Mandatory List.', 'تحقق هل فئتك على القائمة الإلزامية للهيئة.'),
      b('If reserved, you must qualify as an Omani SME or local supplier.', 'إذا كانت محجوزة فعليك التأهل كمنشأة عمانية صغيرة أو متوسطة أو مورّد محلي.'),
    ],
    next: [
      { when: 'before', text: b('Ask PTLC for the current category list in writing before you invest in the bid.', 'اطلب من الهيئة قائمة الفئات الحالية كتابياً قبل الاستثمار في العرض.') },
      { when: 'with-bid', text: b('If you partner with a local supplier, state the reserved scope and who delivers it.', 'إن شاركت موردًا محلياً فبيّن النطاق المحجوز ومن ينفذه.') },
    ],
    watch: [
      b('The Tender Board still exists; Royal Decree 57/2025 renamed only its General Secretariat.', 'لا يزال مجلس المناقصات قائماً؛ فالمرسوم السلطاني ٥٧/٢٠٢٥ غيّر اسم أمانته العامة فقط.'),
    ],
  },

  'om-oq-price-preference': {
    confidence: 'single',
    headline: { value: b('10%', '١٠٪'), label: b('OQ price preference for Omani-manufactured goods', 'أفضلية سعرية لدى «أوكيو» للسلع المصنَّعة في عُمان') },
    verdict: b(
      'On OQ Group tenders in qualifying categories, Omani-manufactured goods get a 10% price edge. It is OQ\'s own rule, not a national one, and the qualifying categories are not detailed.',
      'في مناقصات مجموعة أوكيو للفئات المؤهَّلة تحصل السلع المصنَّعة في عُمان على أفضلية سعرية ١٠٪. وهي قاعدة خاصة بأوكيو وليست وطنية، ولم تُفصَّل الفئات المؤهَّلة.'),
    steps: [
      b('Confirm your contract category qualifies with OQ.', 'تأكد أن فئة عقدك مؤهَّلة لدى أوكيو.'),
      b('Your goods must be Omani-manufactured.', 'يجب أن تكون سلعك مصنَّعة في عُمان.'),
      b('OQ applies the 10% preference when comparing prices.', 'تطبّق أوكيو أفضلية ١٠٪ عند مقارنة الأسعار.'),
    ],
    next: [
      { when: 'before', text: b('Use the price test to set the highest price that still wins against imports.', 'استخدم اختبار السعر لتحديد أعلى سعر يظل فائزاً أمام المستورد.') },
      { when: 'with-bid', text: b('Provide proof of Omani manufacture with the bid.', 'قدّم إثبات التصنيع في عُمان مع العرض.') },
    ],
    watch: [b('Which categories qualify is not published in what was found.', 'لم تُنشر الفئات المؤهَّلة فيما اطُّلع عليه.')],
    priceTest: { pct: 0.1, mode: 'deduct-own', rateNote: b('OQ rate; simple model, check how OQ applies it', 'نسبة أوكيو؛ نموذج مبسّط، تحقق من طريقة تطبيقها') },
  },

  // ---------------- Qatar ----------------
  'qa-national-strategy': {
    confidence: 'none',
    headline: { value: b('10 Jun 2026', '١٠ يونيو ٢٠٢٦'), label: b('Cabinet approved the strategy; no percentage published', 'أقرّ مجلس الوزراء الاستراتيجية؛ ولم تُنشر نسبة') },
    verdict: b(
      'The strategy sets direction only. It has no target or supplier criteria yet, so nothing here can be scored. Use the Tawteen/ICV score for real bids.',
      'الاستراتيجية ترسم الاتجاه فقط، وليس فيها مستهدف أو معايير للموردين بعد، فلا شيء هنا يمكن احتسابه. استخدم درجة «توطين» للعطاءات الفعلية.'),
    steps: [
      b('Prepared by the Ministry of Finance with the National Planning Council.', 'أعدّتها وزارة المالية بالتعاون مع مجلس التخطيط الوطني.'),
      b('Aims to expand local content in government procurement.', 'تهدف إلى توسيع المحتوى المحلي في المشتريات الحكومية.'),
    ],
    next: [
      { when: 'before', text: b('Build your Tawteen/ICV evidence now. It is the mechanism that is actually scored.', 'ابنِ أدلة «توطين» الآن؛ فهي الآلية المحتسَبة فعلياً.') },
    ],
    watch: [b('Re-check when supplier-facing criteria are issued.', 'أعد التحقق عند صدور معايير موجهة للموردين.')],
  },

  'qa-icv-tawteen': {
    confidence: 'official',
    headline: { value: b('ICV score', 'درجة القيمة المحلية'), label: b('eligible local spend ÷ total Qatar revenue excluding exports', 'الإنفاق المحلي المؤهَّل ÷ إجمالي إيرادات قطر دون الصادرات') },
    verdict: b(
      'Your score is the share of your Qatar revenue that is spent locally. Small suppliers get a 30% minimum, and a manufacturer can add 50% through ICV+.',
      'درجتك هي نسبة إيراداتك في قطر التي تُنفق محلياً. وللموردين الصغار حد أدنى ٣٠٪، ويمكن للمصنّع إضافة ٥٠٪ عبر «ICV+».'),
    steps: [
      b('Add up eligible local spend: local goods and materials, local services, Qatari-national training, supplier training and Qatar-asset depreciation.', 'اجمع الإنفاق المحلي المؤهَّل: السلع والمواد المحلية، والخدمات المحلية، وتدريب القطريين، وتدريب الموردين، وإهلاك الأصول في قطر.'),
      b('Divide by total Qatar revenue, excluding exports.', 'اقسمه على إجمالي إيرادات قطر دون الصادرات.'),
      b('Sub-supplier development costs count 100% toward the primary supplier\'s score.', 'تُحتسب تكاليف تطوير الموردين الفرعيين بنسبة ١٠٠٪ لصالح المورد الرئيسي.'),
      b('Self-reported strategic behaviors can add up to 15 points; they are not independently verified.', 'يمكن للسلوكيات الاستراتيجية المصرَّح بها أن تضيف حتى ١٥ نقطة، وهي غير مدقَّقة بشكل مستقل.'),
    ],
    next: [
      { when: 'before', text: b('Work out which of your spend lines are eligible and which are exports, which sit outside the base.', 'حدّد أي بنود إنفاقك مؤهَّلة وأيها صادرات، فالصادرات خارج الأساس.') },
      { when: 'with-bid', text: b('Disclose strategic behaviors only where you can evidence them: the claim is capped but still scrutinised.', 'أفصح عن السلوكيات الاستراتيجية حيث يمكنك إثباتها فقط؛ فالمطالبة محددة بسقف لكنها تخضع للتدقيق.') },
    ],
    watch: [b('Behavior points are self-reported and capped at 15.', 'نقاط السلوكيات مصرَّح بها ذاتياً وسقفها ١٥.')],
  },

  'qa-tenders-icv': {
    confidence: 'corroborated',
    headline: { value: b('Art. 2-3', 'المادتان ٢-٣'), label: b('ICV must be considered, but no percentage is set', 'يجب النظر في القيمة المحلية دون نسبة محددة') },
    verdict: b(
      'Evaluators must weigh your ICV ratio, but the law sets no threshold or formula. Your local-spend ratio is useful evidence, not a pass mark.',
      'يجب على لجان التقييم النظر في نسبة قيمتك المحلية، لكن القانون لا يحدد حداً ولا صيغة. نسبة إنفاقك المحلي دليل مفيد وليست درجة نجاح.'),
    steps: [
      b('Article 2 defines ICV as total local spend on works, services or national HR development.', 'تعرّف المادة ٢ القيمة المحلية بأنها إجمالي الإنفاق المحلي على الأعمال والخدمات وتنمية الموارد البشرية الوطنية.'),
      b('Article 3 requires the entity to consider bidders\' ICV ratios in evaluation.', 'تُلزم المادة ٣ الجهة بالنظر في نسب القيمة المحلية للمتقدمين عند التقييم.'),
    ],
    next: [
      { when: 'with-bid', text: b('State your local-spend ratio and how it was measured, so the evaluator can weigh it.', 'اذكر نسبة إنفاقك المحلي وطريقة قياسها ليتمكن المقيِّم من وزنها.') },
    ],
    watch: [b('Distinct from QatarEnergy\'s own icv.qa platform.', 'تختلف عن منصة icv.qa الخاصة بقطر للطاقة.')],
  },

  // ---------------- Bahrain ----------------
  'bh-local-content': {
    confidence: 'none',
    headline: { value: b('4 mechanisms', '٤ آليات'), label: b('Bahrain has no single national framework', 'لا يوجد إطار وطني موحّد في البحرين') },
    verdict: b(
      'Bahrain has no general local-content score. Check the four specific mechanisms and the 20% Bahrainisation rule instead.',
      'لا توجد في البحرين درجة محتوى محلي عامة. راجع الآليات الأربع المحددة وقاعدة البحرنة ٢٠٪ بدلاً من ذلك.'),
    steps: [
      b('SME price preference, SME spend set-aside, Takamul certificate preference and Gulf-made preference.', 'أفضلية أسعار المنشآت الصغيرة والمتوسطة، وحجز نسبة من الإنفاق لها، وأفضلية شهادة «تكامل»، وأفضلية المنتجات الخليجية.'),
      b('Where more than one preference could apply, only the highest single rate is granted.', 'عند انطباق أكثر من أفضلية يُمنح أعلى معدل واحد فقط.'),
    ],
    next: [
      { when: 'before', text: b('Work out which of the four you qualify for, then use the matching card.', 'حدّد أيّاً من الأربع تستوفي ثم استخدم البطاقة المقابلة.') },
    ],
    watch: [b('A reported stacking 10%+10% preference is not confirmed.', 'أفضلية مجمّعة ١٠٪+١٠٪ أُشير إليها ولم تتأكد.')],
  },

  'bh-sme-price-preference': {
    confidence: 'single',
    headline: { value: b('10%', '١٠٪'), label: b('bidding advantage for qualifying SMEs', 'ميزة في المزايدة للمنشآت الصغيرة والمتوسطة المؤهَّلة') },
    verdict: b(
      'If you have up to 250 employees or up to BHD 20 million revenue, you qualify as an SME under the 2026 decision and get a 10% edge in government tenders.',
      'إذا كان لديك حتى ٢٥٠ موظفاً أو إيرادات حتى ٢٠ مليون دينار فأنت منشأة مؤهَّلة وفق قرار ٢٠٢٦ وتحصل على ميزة ١٠٪ في المناقصات الحكومية.'),
    steps: [
      b('Check your size against the new ceiling: 250 employees or BHD 20 million revenue (previously 100 / BHD 3 million).', 'قارن حجمك بالسقف الجديد: ٢٥٠ موظفاً أو ٢٠ مليون دينار (كان ١٠٠ / ٣ ملايين).'),
      b('The 10% advantage applies in government tender bidding.', 'تُطبَّق ميزة ١٠٪ في المزايدة على المناقصات الحكومية.'),
    ],
    next: [
      { when: 'before', text: b('If you were too big before June 2026, re-check: you may now qualify.', 'إن كنت أكبر من السقف قبل يونيو ٢٠٢٦ فأعد التحقق؛ فقد تكون مؤهَّلاً الآن.') },
      { when: 'with-bid', text: b('Attach SME status evidence; the highest single preference applies, not a sum.', 'أرفق إثبات صفة المنشأة؛ يُطبَّق أعلى معدل واحد لا مجموع المعدلات.') },
    ],
    watch: [b('Ministerial Decision No. 23 of 2026, effective 12 Jun 2026. Sourced from a legal summary, not the Gazette text.', 'القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ النافذ في ١٢ يونيو ٢٠٢٦. المصدر ملخص قانوني لا نص الجريدة الرسمية.')],
    priceTest: { pct: 0.1, mode: 'deduct-own', rateNote: b('Simple model; confirm how the Tender Board applies it', 'نموذج مبسّط؛ تأكد من طريقة تطبيق مجلس المناقصات') },
  },

  'bh-sme-spend-setaside': {
    confidence: 'single',
    headline: { value: b('20%', '٢٠٪'), label: b('of government procurement value allocated to SMEs', 'من قيمة المشتريات الحكومية مخصصة للمنشآت الصغيرة والمتوسطة') },
    verdict: b(
      'A fifth of government spend is aimed at SMEs. It is a national target, not a rule that guarantees you a share.',
      'خُمس الإنفاق الحكومي موجّه للمنشآت الصغيرة والمتوسطة. إنه هدف وطني وليس قاعدة تضمن لك حصة.'),
    steps: [
      b('Qualify as an SME under the 2026 ceiling.', 'تأهّل كمنشأة صغيرة أو متوسطة وفق سقف ٢٠٢٦.'),
      b('You then compete in the pool the target reserves for SMEs.', 'عندئذٍ تتنافس ضمن المجموعة التي يخصصها الهدف لهذه المنشآت.'),
    ],
    next: [
      { when: 'before', text: b('Register as an SME and watch for tenders marked for the reserved pool.', 'سجّل كمنشأة صغيرة ومتوسطة وتابع المناقصات المخصصة لهذه الفئة.') },
    ],
    watch: [b('Program-level target, not a per-supplier score.', 'هدف على مستوى البرنامج وليس درجة لكل مورد.')],
  },

  'bh-takamul-local-value': {
    confidence: 'official',
    headline: { value: b('10%', '١٠٪'), label: b('preference for holders of a Takamul Local Value Certificate', 'أفضلية لحاملي شهادة القيمة المحلية «تكامل»') },
    verdict: b(
      'Hold the certificate for your products and you get a 10% edge on those products. No certificate, no preference, whatever your size.',
      'إذا حصلت على الشهادة لمنتجاتك تحصل على أفضلية ١٠٪ على تلك المنتجات. وبدون الشهادة لا أفضلية مهما كان حجمك.'),
    steps: [
      b('Apply for the certificate through the Ministry of Industry and Commerce portal (service.moic.gov.bh/takamul).', 'قدّم طلب الشهادة عبر بوابة وزارة الصناعة والتجارة (service.moic.gov.bh/takamul).'),
      b('Only the products listed on the certificate qualify.', 'تتأهل المنتجات المدرجة في الشهادة فقط.'),
      b('The Tender Board applies a 10% preference under Cabinet Decision No. (11-2679).', 'يطبّق مجلس المناقصات أفضلية ١٠٪ بموجب قرار مجلس الوزراء رقم (١١-٢٦٧٩).'),
    ],
    next: [
      { when: 'before', text: b('List every product you will bid and add each to the certificate application.', 'أدرج كل منتج ستتقدم به وأضفه إلى طلب الشهادة.') },
      { when: 'with-bid', text: b('Attach the certificate; only the highest single preference applies.', 'أرفق الشهادة؛ يُطبَّق أعلى معدل واحد فقط.') },
    ],
    watch: [b('Separate from the SME-status preference.', 'منفصلة عن أفضلية صفة المنشأة الصغيرة والمتوسطة.')],
    priceTest: { pct: 0.1, mode: 'deduct-own', rateNote: b('Simple model; confirm how the Tender Board applies it', 'نموذج مبسّط؛ تأكد من طريقة تطبيق مجلس المناقصات') },
  },

  'bh-gulf-made-preference': {
    confidence: 'official',
    headline: { value: b('10%', '١٠٪'), label: b('preference for Gulf-made products', 'أفضلية للمنتجات المصنَّعة في الخليج') },
    verdict: b(
      'A product made in the GCC gets a 10% edge in Bahrain government tenders. It depends on origin, not on your company\'s size or nationality.',
      'يحصل المنتج المصنَّع في دول الخليج على أفضلية ١٠٪ في المناقصات الحكومية البحرينية. وتعتمد على المنشأ لا على حجم شركتك أو جنسيتها.'),
    steps: [
      b('Confirm the product meets GCC origin rules.', 'تأكد أن المنتج يستوفي قواعد المنشأ الخليجي.'),
      b('The Tender Board applies 10% under Cabinet Decision No. 40 of 2015.', 'يطبّق مجلس المناقصات ١٠٪ بموجب قرار مجلس الوزراء رقم ٤٠ لسنة ٢٠١٥.'),
    ],
    next: [
      { when: 'before', text: b('Get your GCC origin certificate ready before the tender closes.', 'جهّز شهادة المنشأ الخليجي قبل إغلاق المناقصة.') },
    ],
    watch: [b('Only the higher single preference applies; they do not add up.', 'يُطبَّق أعلى معدل واحد فقط ولا تُجمع الأفضليات.')],
    priceTest: { pct: 0.1, mode: 'deduct-own', rateNote: b('Simple model; confirm how the Tender Board applies it', 'نموذج مبسّط؛ تأكد من طريقة تطبيق مجلس المناقصات') },
  },

  'bh-bahrainisation-tender-workforce': {
    confidence: 'corroborated',
    headline: { value: b('20%', '٢٠٪'), label: b('Bahraini nationals required in a bidder\'s workforce', 'نسبة البحرينيين المطلوبة في القوى العاملة للمتقدم') },
    verdict: b(
      'Below 20% Bahraini staff you are not eligible to bid. This is a gate, not a score.',
      'إذا قلّت نسبة البحرينيين عن ٢٠٪ فلست مؤهلاً للتقدم. إنها بوابة وليست درجة.'),
    steps: [
      b('Count Bahraini nationals as a share of your workforce.', 'احسب البحرينيين كنسبة من قوتك العاملة.'),
      b('Hold a valid Bahrainisation Certificate from the Ministry of Labour.', 'احصل على شهادة بحرنة سارية من وزارة العمل.'),
    ],
    next: [
      { when: 'before', text: b('Check your ratio now; a shortfall takes months to fix by hiring.', 'تحقق من نسبتك الآن؛ فمعالجة النقص بالتوظيف تستغرق شهوراً.') },
      { when: 'with-bid', text: b('Attach the certificate to the bid.', 'أرفق الشهادة بالعرض.') },
    ],
    watch: [
      b('The Tender Board Guideline requires the certificate but does not restate the 20%. Some legislators said 20% may rise.', 'يشترط دليل مجلس المناقصات الشهادة ولا يعيد ذكر نسبة ٢٠٪، وأشار بعض النواب إلى أنها قد ترتفع.'),
      b('The 50% rule applies only to privatised state-service contracts.', 'قاعدة ٥٠٪ تخص عقود الخدمات الحكومية المخصخصة فقط.'),
    ],
  },

  // ---------------- Kuwait ----------------
  'kw-local-content': {
    confidence: 'corroborated',
    headline: { value: b('30% + 30%', '٣٠٪ + ٣٠٪'), label: b('local purchases and local contractors for foreign contractors', 'مشتريات محلية ومقاولون محليون على المقاول الأجنبي') },
    verdict: b(
      'A foreign contractor on a covered tender must buy at least 30% of requirements from local suppliers and award at least 30% of works to registered local contractors. Two separate thresholds.',
      'على المقاول الأجنبي في مناقصة مشمولة شراء ٣٠٪ على الأقل من احتياجاته من موردين محليين وإسناد ٣٠٪ على الأقل من الأعمال إلى مقاولين محليين مسجلين. حدّان منفصلان.'),
    steps: [
      b('Test 1: at least 30% of contractual requirements bought from local suppliers.', 'الاختبار الأول: ٣٠٪ على الأقل من متطلبات العقد من موردين محليين.'),
      b('Test 2: at least 30% of contract works awarded to registered local contractors.', 'الاختبار الثاني: ٣٠٪ على الأقل من أعمال العقد لمقاولين محليين مسجلين.'),
    ],
    next: [
      { when: 'before', text: b('Line up registered local suppliers and contractors before pricing so both shares are built in.', 'رتّب موردين ومقاولين محليين مسجلين قبل التسعير لتُدمج الحصتان في السعر.') },
      { when: 'after', text: b('Track both shares through delivery. They are contract-performance duties.', 'تابع الحصتين حتى التسليم؛ فهما التزامان أثناء تنفيذ العقد.') },
    ],
    watch: [b('Law No. 49 of 2016, Article 87.', 'القانون رقم ٤٩ لسنة ٢٠١٦، المادة ٨٧.')],
  },

  'kw-kpc-local-spend': {
    confidence: 'single',
    headline: { value: b('30% by 2040', '٣٠٪ بحلول ٢٠٤٠'), label: b('KPC project spending targeted at Kuwaiti suppliers', 'من إنفاق مشاريع مؤسسة البترول موجّه لموردين كويتيين') },
    verdict: b(
      'KPC and its subsidiaries aim to direct 30% of project spending to Kuwaiti suppliers by 2040. It is a corporate target, and no supplier qualification criteria were found.',
      'تهدف مؤسسة البترول وشركاتها التابعة إلى توجيه ٣٠٪ من إنفاق المشاريع إلى موردين كويتيين بحلول ٢٠٤٠. إنه هدف مؤسسي، ولم تُوجد معايير تأهيل للموردين.'),
    steps: [
      b('Applies across KPC\'s group: KOC, KNPC and other subsidiaries.', 'ينطبق على مجموعة المؤسسة: نفط الكويت والبترول الوطنية وغيرها.'),
      b('The target is a share of project spend, not a per-supplier score.', 'الهدف حصة من إنفاق المشاريع لا درجة لكل مورد.'),
    ],
    next: [
      { when: 'before', text: b('Ask each K-company what registration or qualification it uses for Kuwaiti suppliers.', 'اسأل كل شركة تابعة عن التسجيل أو التأهيل المعتمد للموردين الكويتيين.') },
    ],
    watch: [b('Source: trade.gov, citing KPC\'s stated objectives.', 'المصدر: موقع trade.gov نقلاً عن أهداف المؤسسة المعلنة.')],
  },

  'kw-tender-law-price-preference': {
    confidence: 'corroborated',
    headline: { value: b('15%', '١٥٪'), label: b('maximum premium a national product may carry over the cheapest import', 'أقصى علاوة يجوز للمنتج الوطني فوق أرخص مستورد') },
    verdict: b(
      'On tenders above KD 75,000, a Kuwaiti or GCC product wins priority if its price is no more than 15% above the cheapest comparable import.',
      'في المناقصات التي تتجاوز ٧٥ ألف دينار يحصل المنتج الكويتي أو الخليجي على الأولوية إذا لم يزد سعره على أرخص مستورد مماثل بأكثر من ١٥٪.'),
    steps: [
      b('Confirm the tender is above KD 75,000.', 'تأكد أن المناقصة تتجاوز ٧٥ ألف دينار.'),
      b('Confirm the product is Kuwaiti or GCC and meets GCC or Kuwaiti standards.', 'تأكد أن المنتج كويتي أو خليجي ويستوفي المعايير الخليجية أو الكويتية.'),
      b('Your price must be within 15% of the lowest comparable import.', 'يجب أن يكون سعرك ضمن ١٥٪ من أقل مستورد مماثل.'),
    ],
    next: [
      { when: 'before', text: b('Use the price test to find your ceiling against the cheapest import.', 'استخدم اختبار السعر لمعرفة سقف سعرك أمام أرخص مستورد.') },
    ],
    watch: [b('Based on product origin, not company nationality.', 'مبنية على منشأ المنتج لا جنسية الشركة.')],
    priceTest: { pct: 0.15, mode: 'add-to-rival', rateNote: b('Article 62 ceiling; exactly this test', 'سقف المادة ٦٢؛ هذا هو الاختبار نفسه') },
  },

  'kw-nationality-price-preference': {
    confidence: 'corroborated',
    headline: { value: b('10%', '١٠٪'), label: b('preference for companies of Kuwaiti nationality', 'أفضلية للشركات الكويتية') },
    verdict: b(
      'A company of Kuwaiti nationality gets a 10% price preference. It follows who owns the bidder, not where the product is made.',
      'تحصل الشركة الكويتية على أفضلية سعرية ١٠٪. وهي تتبع هوية مالك المتقدم لا مكان تصنيع المنتج.'),
    steps: [
      b('Confirm your company qualifies as a Kuwaiti-nationality company.', 'تأكد أن شركتك تُعدّ شركة كويتية.'),
      b('The evaluator applies the 10% preference to your price.', 'تطبّق لجنة التقييم أفضلية ١٠٪ على سعرك.'),
    ],
    next: [
      { when: 'with-bid', text: b('Attach proof of nationality; do not rely on the evaluator to assume it.', 'أرفق إثبات الجنسية ولا تعوّل على افتراض اللجنة.') },
    ],
    watch: [b('A separate 20% SME preference was single-sourced and is not used here.', 'أفضلية ٢٠٪ للمنشآت الصغيرة والمتوسطة من مصدر واحد ولم تُعتمد هنا.')],
    priceTest: { pct: 0.1, mode: 'deduct-own', rateNote: b('Simple model; confirm how the buyer applies it', 'نموذج مبسّط؛ تأكد من طريقة تطبيق الجهة') },
  },
};
