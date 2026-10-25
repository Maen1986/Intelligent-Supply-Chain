// Module 08 Program Briefs -- Egypt, Turkey, UK, USA, China, India, Germany, Japan, Korea (21 programs).
// Honesty rule: every figure below appears in the program's own sourced note (supplierLocalContentEligibility.ts). No figure is added here.
import { b, type ProgramBrief } from './localContentBriefTypes';

export const INTL_BRIEFS: Record<string, ProgramBrief> = {
  // ---------------- Egypt ----------------
  'eg-price-preference': {
    confidence: 'corroborated',
    headline: { value: b('40% → 15%', '٤٠٪ ← ١٥٪'), label: b('clear 40% Egyptian content, receive a flat 15% price preference', 'حقّق ٤٠٪ محتوى مصرياً لتحصل على أفضلية سعرية ثابتة ١٥٪') },
    verdict: b(
      'It is all or nothing: at 40% Egyptian-origin content you get the full 15%; at 39% you get nothing. Know your exact figure before you bid.',
      'إما الكل أو لا شيء: عند ٤٠٪ محتوى مصري تحصل على ١٥٪ كاملة، وعند ٣٩٪ لا تحصل على شيء. اعرف رقمك بدقة قبل التقدم.'),
    steps: [
      b('Measure Egyptian-origin content of the bid\'s goods or services, by estimated project value.', 'قِس المحتوى المصري المنشأ في سلع العرض أو خدماته بحسب القيمة التقديرية للمشروع.'),
      b('At 40% or more, the bid counts as an "Egyptian product".', 'عند ٤٠٪ فأكثر يُعدّ العرض «منتجاً مصرياً».'),
      b('The evaluator then applies a flat 15% preference against foreign bids.', 'تطبّق لجنة التقييم عندئذٍ أفضلية ثابتة ١٥٪ على العروض الأجنبية.'),
    ],
    next: [
      { when: 'before', text: b('Compute your Egyptian content now. If you sit just under 40%, a small local-sourcing switch may unlock the full 15%.', 'احسب محتواك المصري الآن. إن كنت قرب ٤٠٪ فقد يفتح تغيير بسيط في التوريد المحلي كامل الأفضلية.') },
      { when: 'with-bid', text: b('Show the content calculation inside the bid so the evaluator does not have to rebuild it.', 'اعرض حساب المحتوى داخل العرض كي لا تضطر اللجنة لإعادة بنائه.') },
    ],
    watch: [b('Defense, Interior, Military Production and General Intelligence procurement is exempt.', 'مشتريات الدفاع والداخلية والإنتاج الحربي والمخابرات العامة مستثناة.')],
    priceTest: { pct: 0.15, mode: 'add-to-rival', rateNote: b('Applied against foreign bids', 'تُطبَّق على العروض الأجنبية') },
  },

  'eg-oil-gas-price-preference': {
    confidence: 'single',
    headline: { value: b('10%', '١٠٪'), label: b('price band within which local contractors and equipment get priority', 'نطاق السعر الذي تُمنح فيه الأولوية للمقاولين والمعدات المحلية') },
    verdict: b(
      'Egyptian petroleum operators must give priority to local contractors and locally made equipment when performance is comparable and the price is no more than 10% higher.',
      'يجب على مشغّلي النفط في مصر منح الأولوية للمقاولين المحليين والمعدات المصنَّعة محلياً إذا تماثل الأداء ولم يزد السعر على ١٠٪.'),
    steps: [
      b('Show your performance is comparable to the competing offer.', 'أثبت أن أداءك مماثل للعرض المنافس.'),
      b('Keep your price within 10% of the competitor.', 'أبقِ سعرك ضمن ١٠٪ من المنافس.'),
      b('The operator must then prioritise you under the PSA model.', 'يلزم المشغّل عندئذٍ بتفضيلك بموجب نموذج اتفاقية المشاركة في الإنتاج.'),
    ],
    next: [
      { when: 'before', text: b('Use the price test to see the highest price that still qualifies for priority.', 'استخدم اختبار السعر لمعرفة أعلى سعر يظل مؤهلاً للأولوية.') },
      { when: 'with-bid', text: b('Document technical equivalence; the priority only applies when performance is comparable.', 'وثّق التكافؤ الفني؛ فالأولوية لا تنطبق إلا عند تماثل الأداء.') },
    ],
    watch: [b('A different buyer and legal basis from the general procurement preference.', 'جهة وأساس قانوني مختلفان عن أفضلية المشتريات العامة.')],
    priceTest: { pct: 0.1, mode: 'add-to-rival', rateNote: b('Price band, not a discount', 'نطاق سعري وليس خصماً') },
  },

  'eg-auto-local-content': {
    confidence: 'corroborated',
    headline: { value: b('20% / 10%', '٢٠٪ / ١٠٪'), label: b('minimum local content: fossil-fuel / electric vehicles', 'حد أدنى للمحتوى المحلي: مركبات الوقود / الكهربائية') },
    verdict: b(
      'This is an incentive gate for vehicle makers. Local content is only one of several conditions: volume, price ceiling and engine size must pass too.',
      'هذه بوابة حوافز لمصنّعي المركبات. المحتوى المحلي شرط واحد من عدة شروط، ويجب أيضاً اجتياز الحجم وسقف السعر وحجم المحرك.'),
    steps: [
      b('Fossil-fuel: at least 20% local content, 10,000+ units a year (5,000+ per model), ex-factory price up to EGP 1.25 million, engine up to 1,600cc.', 'وقود أحفوري: ٢٠٪ محتوى محلي على الأقل، و١٠٬٠٠٠ وحدة سنوياً فأكثر (٥٬٠٠٠ لكل طراز)، وسعر المصنع حتى ١٫٢٥ مليون جنيه، ومحرك حتى ١٬٦٠٠ سم٣.'),
      b('Electric: at least 10% local content, starting at 1,000 units a year.', 'كهربائية: ١٠٪ محتوى محلي على الأقل، بدءاً من ١٬٠٠٠ وحدة سنوياً.'),
    ],
    next: [
      { when: 'before', text: b('Check all four conditions together; passing local content alone does not make you eligible.', 'افحص الشروط الأربعة معاً؛ فاستيفاء المحتوى المحلي وحده لا يجعلك مؤهلاً.') },
    ],
    watch: [b('ISC checks eligibility only, not the value of the incentive.', 'يفحص النظام الأهلية فقط، لا قيمة الحافز.'), b('Effective 1 Jul 2025.', 'ساري من ١ يوليو ٢٠٢٥.')],
  },

  // ---------------- Turkey ----------------
  'tr-price-preference': {
    confidence: 'corroborated',
    headline: { value: b('Up to 15%', 'حتى ١٥٪'), label: b('price advantage for domestic goods; mandatory for listed medium/high-tech goods', 'أفضلية سعرية للسلع المحلية؛ إلزامية للسلع المدرجة متوسطة/عالية التقنية') },
    verdict: b(
      'The authority may give domestic goods up to 15%, and must do so for goods on the official medium/high-technology list. Use of a lower rate on listed goods has already voided a tender.',
      'يجوز للجهة منح السلع المحلية حتى ١٥٪، وهي ملزمة بذلك للسلع المدرجة في قائمة التقنية المتوسطة والعالية. وقد أُلغيت مناقصة بسبب استخدام نسبة أقل لسلع مدرجة.'),
    steps: [
      b('Check whether your goods are on the medium/high-technology list.', 'تحقق هل سلعك على قائمة التقنية المتوسطة والعالية.'),
      b('The advantage is added to competing non-domestic bids\' prices, not deducted from yours.', 'تُضاف الأفضلية إلى أسعار العروض غير المحلية المنافسة ولا تُخصم من سعرك.'),
    ],
    next: [
      { when: 'before', text: b('If your goods are listed, the full advantage is not optional: raise it with the authority if the tender documents show less.', 'إن كانت سلعك مدرجة فالأفضلية الكاملة ليست اختيارية: أثِر الأمر مع الجهة إن بدت وثائق المناقصة أقل.') },
      { when: 'with-bid', text: b('Prove domestic-goods status in the bid.', 'أثبت صفة السلعة المحلية في العرض.') },
    ],
    watch: [b('Law No. 4734, Article 63(c). A 7% rate on listed goods was ruled non-compliant by KIK.', 'القانون ٤٧٣٤، المادة ٦٣(ج). قضت هيئة KIK بأن نسبة ٧٪ على سلع مدرجة مخالفة.')],
    priceTest: { pct: 0.15, mode: 'add-to-rival', rateNote: b('Maximum rate; the authority may set less on unlisted goods', 'الحد الأقصى؛ وللجهة تحديد أقل للسلع غير المدرجة') },
  },

  'tr-defense-offset': {
    confidence: 'corroborated',
    headline: { value: b('21% / 70% / 2%', '٢١٪ / ٧٠٪ / ٢٪'), label: b('three separate domestic-work obligations, all to be met', 'ثلاثة التزامات منفصلة للأعمال المحلية، يجب استيفاؤها جميعاً') },
    verdict: b(
      'A Turkish defense contract carries three obligations and each must be met on its own. Passing two out of three is a fail.',
      'يحمل عقد الدفاع التركي ثلاثة التزامات يجب استيفاء كل منها بمعزل عن الآخر. فاجتياز اثنين من ثلاثة يعني الرسوب.'),
    steps: [
      b('At least 21% of the work goes to sub-industry/SMEs.', 'ما لا يقل عن ٢١٪ من العمل لصالح الصناعات الفرعية والمنشآت الصغيرة والمتوسطة.'),
      b('At least 70% of EYDEP-accredited work is carried out by Turkish SMEs (70% of that work, not of the whole bid).', 'ما لا يقل عن ٧٠٪ من الأعمال المعتمدة (EYDEP) تنفذها منشآت تركية صغيرة ومتوسطة (٧٠٪ من تلك الأعمال لا من العرض كله).'),
      b('At least 2% is technology acquisition.', 'ما لا يقل عن ٢٪ لاكتساب التقنية.'),
    ],
    next: [
      { when: 'before', text: b('Plan the work package split before pricing: all three shares need named Turkish partners.', 'خطّط لتقسيم حزم العمل قبل التسعير؛ فالحصص الثلاث تحتاج شركاء أتراكاً معروفين.') },
    ],
    watch: [b('A secondary figure of "70% of bid amount" is a misreading of the second obligation.', 'رقم «٧٠٪ من قيمة العرض» في مصدر ثانوي قراءة خاطئة للالتزام الثاني.')],
  },

  // ---------------- UK ----------------
  'uk-below-threshold-reservation': {
    confidence: 'official',
    headline: { value: b('£135,018', '١٣٥٬٠١٨ جنيهاً'), label: b('central-government goods/services threshold (other bodies £207,720; works £5,193,000)', 'عتبة السلع والخدمات للحكومة المركزية (الجهات الأخرى ٢٠٧٬٧٢٠؛ الأشغال ٥٬١٩٣٬٠٠٠)') },
    verdict: b(
      'Below these thresholds a public body may reserve a contract for suppliers in one place, such as a county or a London borough. Above them, suppliers from WTO GPA countries must be treated equally.',
      'دون هذه العتبات يجوز للجهة العامة حجز عقد لموردين في منطقة واحدة، كمقاطعة أو بلدية لندنية. وفوقها يجب معاملة موردي دول اتفاقية المشتريات الحكومية بالتساوي.'),
    steps: [
      b('Check the contract value against the three thresholds (effective 1 Jan 2026).', 'قارن قيمة العقد بالعتبات الثلاث (سارية من ١ يناير ٢٠٢٦).'),
      b('Below the threshold, the body may reserve by geography: UK-wide, one county or a London borough.', 'دون العتبة يجوز الحجز جغرافياً: على مستوى المملكة أو مقاطعة واحدة أو بلدية لندنية.'),
      b('It may combine this with SME or voluntary-sector status.', 'ويجوز دمجه مع صفة المنشأة الصغيرة والمتوسطة أو القطاع التطوعي.'),
    ],
    next: [
      { when: 'before', text: b('Register your supplier address accurately: reservations work by place, not by England/Scotland/Wales/NI.', 'سجّل عنوانك بدقة؛ فالحجز يتم بالمكان لا بإنجلترا/اسكتلندا/ويلز/أيرلندا الشمالية.') },
    ],
    watch: [b('Under PPN 005 and the Procurement Act 2023.', 'بموجب إشعار PPN 005 وقانون المشتريات ٢٠٢٣.')],
  },

  // ---------------- USA ----------------
  'usa-buy-american-price-preference': {
    confidence: 'official',
    headline: { value: b('65% → 75%', '٦٥٪ ← ٧٥٪'), label: b('US component cost required for a "domestic end product" (75% from 2029)', 'تكلفة مكونات أمريكية مطلوبة لـ«منتج نهائي محلي» (٧٥٪ من ٢٠٢٩)') },
    verdict: b(
      'Above 65% US component cost (2024-2028), your offer is evaluated with a price preference: 20% is added to foreign offers from large businesses, 30% where the offeror is a small business.',
      'عند تجاوز تكلفة المكونات الأمريكية ٦٥٪ (٢٠٢٤-٢٠٢٨) يُقيَّم عرضك بأفضلية سعرية: تُضاف ٢٠٪ إلى العروض الأجنبية للشركات الكبيرة، و٣٠٪ للشركات الصغيرة.'),
    steps: [
      b('Work out US-sourced component cost as a share of total component cost.', 'احسب تكلفة المكونات الأمريكية كنسبة من إجمالي تكلفة المكونات.'),
      b('Above the threshold the product is a domestic end product.', 'فوق العتبة يُعدّ المنتج منتجاً نهائياً محلياً.'),
      b('FAR 25.105 adds the preference to competing foreign offers; your price is unchanged.', 'تضيف FAR 25.105 الأفضلية إلى العروض الأجنبية المنافسة ويبقى سعرك كما هو.'),
    ],
    next: [
      { when: 'before', text: b('Plan for 75% from 2029 if your contract runs that far.', 'خطّط لنسبة ٧٥٪ من ٢٠٢٩ إن امتد عقدك إلى ذلك.') },
      { when: 'with-bid', text: b('Declare the component breakdown clearly so the preference is applied.', 'اعرض تفصيل المكونات بوضوح كي تُطبَّق الأفضلية.') },
    ],
    watch: [b('The 2022 Executive Order\'s separate iron/steel sub-test is not modeled.', 'اختبار الحديد والصلب المستقل في الأمر التنفيذي ٢٠٢٢ غير مشمول.')],
    priceTest: { pct: 0.2, mode: 'add-to-rival', rateNote: b('Large-business rate; 30% for small business', 'نسبة الشركات الكبيرة؛ ٣٠٪ للصغيرة') },
  },

  'usa-baba-infrastructure-gate': {
    confidence: 'official',
    headline: { value: b('55%', '٥٥٪'), label: b('minimum domestic component cost for manufactured products', 'حد أدنى لتكلفة المكونات المحلية للمنتجات المصنَّعة') },
    verdict: b(
      'On federally funded infrastructure, iron and steel must be made in the US, construction materials made in the US, and manufactured products at least 55% domestic by component cost.',
      'في مشاريع البنية التحتية الممولة اتحادياً يجب أن يُنتج الحديد والصلب في أمريكا، وأن تُصنَّع مواد البناء فيها، وأن تبلغ المنتجات المصنَّعة ٥٥٪ محلية على الأقل بتكلفة المكونات.'),
    steps: [
      b('Triggered by receipt of federal infrastructure funding, not by the buyer being public or private.', 'يُفعَّل باستلام تمويل اتحادي للبنية التحتية، لا بكون الجهة عامة أو خاصة.'),
      b('Iron and steel: every process from initial melting in the US.', 'الحديد والصلب: كل العمليات من الصهر الأول داخل أمريكا.'),
      b('Construction materials: manufactured in the US.', 'مواد البناء: مصنَّعة في أمريكا.'),
      b('Manufactured products: 55% or more domestic component cost.', 'المنتجات المصنَّعة: ٥٥٪ فأكثر من تكلفة المكونات محلية.'),
    ],
    next: [
      { when: 'before', text: b('Ask the funding agency which category each item falls under; each agency administers the rule itself.', 'اسأل الجهة الممولة عن فئة كل بند؛ فكل وكالة تدير القاعدة بنفسها.') },
      { when: 'with-bid', text: b('Collect mill certificates for iron and steel from the start; they are hard to rebuild later.', 'اجمع شهادات المصنع للحديد والصلب من البداية؛ فإعادة بنائها لاحقاً صعبة.') },
    ],
    watch: [b('Title IX of the 2021 Infrastructure Investment and Jobs Act.', 'الباب التاسع من قانون الاستثمار في البنية التحتية والوظائف ٢٠٢١.')],
  },

  'usa-sba-small-business-setaside': {
    confidence: 'official',
    headline: { value: b('23%', '٢٣٪'), label: b('government-wide goal of contract dollars to small businesses', 'هدف حكومي عام لحصة الشركات الصغيرة من دولارات العقود') },
    verdict: b(
      'The 23% is a goal, not your entitlement. Whether a contract is set aside depends on the Rule of Two: two or more small businesses expected to bid at a fair price.',
      'نسبة ٢٣٪ هدف وليست حقاً لك. وحجز العقد يعتمد على «قاعدة الاثنين»: توقّع تقدّم شركتين صغيرتين أو أكثر بسعر عادل.'),
    steps: [
      b('Sub-goals: 5% women-owned, 5% service-disabled veteran-owned, 5% small disadvantaged, 3% HUBZone.', 'أهداف فرعية: ٥٪ نساء، ٥٪ محاربون قدامى ذوو إعاقة، ٥٪ محرومون صغار، ٣٪ HUBZone.'),
      b('The contracting officer applies the Rule of Two to each solicitation.', 'يطبّق ضابط التعاقد قاعدة الاثنين على كل طلب.'),
      b('If it applies, the solicitation is set aside for small businesses.', 'إن انطبقت حُجز الطلب للشركات الصغيرة.'),
    ],
    next: [
      { when: 'before', text: b('Confirm your size standard and register in the government system so contracting officers can find you.', 'تأكد من معيار حجمك وسجّل في المنظومة الحكومية ليجدك ضباط التعاقد.') },
    ],
    watch: [b('ISC checks your qualification; it cannot decide a set-aside, which depends on the market.', 'يفحص النظام تأهلك ولا يستطيع حسم الحجز، فهو يعتمد على السوق.')],
  },

  'usa-berry-amendment-dod': {
    confidence: 'official',
    headline: { value: b('No partial credit', 'لا اعتماد جزئي'), label: b('covered DoD textiles, food and hand/measuring tools must be domestic', 'يجب أن تكون منسوجات الدفاع والغذاء وأدوات اليد والقياس المشمولة محلية') },
    verdict: b(
      'If a DoD purchase is covered, it either meets the domestic test or it fails. First find out whether it is covered at all.',
      'إذا كانت مشتريات وزارة الدفاع مشمولة فإما أن تجتاز الاختبار المحلي أو تفشل. اعرف أولاً هل هي مشمولة أصلاً.'),
    steps: [
      b('Check whether the item is a textile, food or hand/measuring tool.', 'تحقق هل البند منسوجات أو غذاء أو أداة يد أو قياس.'),
      b('If covered, test domestic sourcing after any substantial-transformation determination or non-availability exception.', 'إن كان مشمولاً فاختبر التوريد المحلي بعد أي تحديد للتحويل الجوهري أو استثناء عدم التوفر.'),
    ],
    next: [
      { when: 'before', text: b('Get the contracting officer\'s written view on any transformation or non-availability claim.', 'احصل على رأي ضابط التعاقد كتابياً في أي ادعاء بالتحويل أو عدم التوفر.') },
    ],
    watch: [b('Specialty metals fall under a separate statute.', 'المعادن الخاصة تخضع لقانون مستقل.')],
  },

  // ---------------- China ----------------
  'cn-domestic-product-price-preference': {
    confidence: 'official',
    headline: { value: b('20%', '٢٠٪'), label: b('flat price-evaluation deduction for bids with domestic products', 'خصم ثابت في تقييم السعر للعروض ذات المنتجات المحلية') },
    verdict: b(
      'Reach domestic-product status by either path and your evaluated price drops 20%. Two independent paths exist, so pick the one you can prove.',
      'إذا بلغت صفة المنتج المحلي بأحد المسارين ينخفض سعرك المقيَّم ٢٠٪. يوجد مساران مستقلان، فاختر ما يمكنك إثباته.'),
    steps: [
      b('Path 1: the product passes a substantial-transformation-in-China test. Simple assembly, packaging and relabeling do not count; a cost-ratio threshold is pending.', 'المسار الأول: يجتاز المنتج اختبار التحويل الجوهري داخل الصين. ولا يُعدّ التجميع البسيط والتعبئة وإعادة الوسم تحويلاً جوهرياً؛ وعتبة نسبة التكلفة قيد الإصدار.'),
      b('Path 2: for a mixed bundle, domestically made products reach at least 80% of total bundle cost.', 'المسار الثاني: في الحزمة المختلطة تبلغ المنتجات المصنَّعة محلياً ٨٠٪ على الأقل من تكلفة الحزمة.'),
      b('Either path earns the 20% deduction (State Council Doc. [2025] No. 34, effective 1 Jan 2026).', 'أي مسار يمنح خصم ٢٠٪ (وثيقة مجلس الدولة [٢٠٢٥] رقم ٣٤، سارية من ١ يناير ٢٠٢٦).'),
    ],
    next: [
      { when: 'before', text: b('Run the 80% test on every bundle you plan to bid; a small foreign item can sink the whole bundle.', 'طبّق اختبار ٨٠٪ على كل حزمة تنوي التقدم بها؛ فبند أجنبي صغير قد يُسقط الحزمة كلها.') },
    ],
    watch: [b('The cost-ratio threshold for Path 1 is still pending.', 'عتبة نسبة التكلفة للمسار الأول لم تصدر بعد.')],
    priceTest: { pct: 0.2, mode: 'deduct-own', rateNote: b('Deduction from your evaluated price', 'خصم من سعرك المقيَّم') },
  },

  'cn-govt-procurement-law-domestic-mandate': {
    confidence: 'official',
    headline: { value: b('Art. 10', 'المادة ١٠'), label: b('government purchases default to domestic goods, works and services', 'تُشترى افتراضياً السلع والأعمال والخدمات المحلية في المشتريات الحكومية') },
    verdict: b(
      'Government buyers must buy domestic unless one of three exemptions applies. Without an exemption, foreign products must also pass the domestic cost-ratio test.',
      'يجب على الجهات الحكومية شراء المحلي ما لم ينطبق أحد ثلاثة استثناءات. وبدون استثناء يجب أن تجتاز المنتجات الأجنبية اختبار نسبة التكلفة المحلية.'),
    steps: [
      b('Exemption 1: not available domestically or on reasonable commercial terms.', 'الاستثناء الأول: غير متوفر محلياً أو بشروط تجارية معقولة.'),
      b('Exemption 2: the purchase is for use outside China.', 'الاستثناء الثاني: الشراء للاستخدام خارج الصين.'),
      b('Exemption 3: another law provides otherwise.', 'الاستثناء الثالث: نص قانون آخر على خلاف ذلك.'),
    ],
    next: [
      { when: 'before', text: b('If you are foreign, build the case for an exemption early, in writing, with market evidence.', 'إن كنت أجنبياً فابنِ حجة الاستثناء مبكراً وكتابياً ومعها أدلة السوق.') },
    ],
    watch: [b('Enacted 2002, last amended 2014. Cost-ratio test is in the Ministry of Finance 2025 Notice.', 'صدر عام ٢٠٠٢ وعُدّل آخر مرة ٢٠١٤. اختبار نسبة التكلفة في إشعار وزارة المالية ٢٠٢٥.')],
  },

  'cn-sme-price-deduction': {
    confidence: 'official',
    headline: { value: b('30% share', 'حصة ٣٠٪'), label: b('small-enterprise share of contract value needed, else the deduction is zero', 'حصة المنشآت الصغيرة المطلوبة من قيمة العقد، وإلا فالخصم صفر') },
    verdict: b(
      'A small or micro enterprise bidding directly gets a price deduction. A large firm gets one only by giving small enterprises at least 30% of the contract; at 29% the deduction is zero, not partial.',
      'تحصل المنشأة الصغيرة أو متناهية الصغر المتقدمة مباشرة على خصم سعري. أما الشركة الكبيرة فلا تحصل عليه إلا بإسناد ٣٠٪ على الأقل من العقد لمنشآت صغيرة؛ وعند ٢٩٪ يكون الخصم صفراً لا جزئياً.'),
    steps: [
      b('Original 2020 rules: 6%-10% for direct small bidders (3%-5% for works).', 'قواعد ٢٠٢٠ الأصلية: ٦٪-١٠٪ للمتقدم الصغير مباشرة (٣٪-٥٪ للأشغال).'),
      b('Large or medium firms subcontracting or forming consortia with small firms: 2%-3% (1%-2% for works).', 'الشركات الكبيرة والمتوسطة المتعاقدة من الباطن أو المتحالفة مع صغيرة: ٢٪-٣٪ (١٪-٢٪ للأشغال).'),
      b('Condition: small-enterprise share at least 30% of contract value.', 'الشرط: حصة المنشآت الصغيرة ٣٠٪ على الأقل من قيمة العقد.'),
    ],
    next: [
      { when: 'before', text: b('If you are a large bidder, design the subcontract split to clear 30% with a margin, not at the edge.', 'إن كنت متقدماً كبيراً فصمّم توزيع التعاقد من الباطن ليتجاوز ٣٠٪ بهامش لا على الحافة.') },
      { when: 'before', text: b('Read the current ranges: the 2022 notice roughly doubled the goods/services ranges, and exact figures are in the program note.', 'اقرأ النطاقات الحالية: رفع إشعار ٢٠٢٢ نطاقات السلع والخدمات إلى نحو الضعف، والأرقام الدقيقة في ملاحظة البرنامج.') },
    ],
    watch: [b('Cai Ku [2020] No. 46, updated by [2022] No. 19.', 'وثيقتا Cai Ku [٢٠٢٠] رقم ٤٦ ومعدّلة بـ [٢٠٢٢] رقم ١٩.')],
  },

  'cn-defense-domestic-sourcing': {
    confidence: 'none',
    headline: { value: b('No number', 'لا رقم منشور'), label: b('rules are classified or internal; nothing to score', 'القواعد سرية أو داخلية؛ لا شيء يمكن احتسابه') },
    verdict: b(
      'China\'s defense sourcing runs on classified or internal rules, so ISC cannot give a percentage. Treat it as closed unless the buyer tells you otherwise.',
      'يخضع التوريد الدفاعي في الصين لقواعد سرية أو داخلية، فلا يستطيع النظام تقديم نسبة. اعتبره مغلقاً ما لم تُبلغك الجهة بغير ذلك.'),
    steps: [
      b('Run by the Central Military Commission\'s Equipment Development Department under Military-Civil Fusion.', 'تديرها إدارة تطوير المعدات في اللجنة العسكرية المركزية ضمن الدمج المدني العسكري.'),
      b('The general government-procurement rule (Guobanfa [2025] No. 34) covers defense procurement only in part.', 'قاعدة المشتريات الحكومية العامة (Guobanfa ‏[٢٠٢٥] رقم ٣٤) تغطي المشتريات الدفاعية جزئياً فقط.'),
    ],
    next: [
      { when: 'before', text: b('Do not invest in a bid on a guessed threshold; ask a qualified local adviser first.', 'لا تستثمر في عرض بناءً على عتبة مخمَّنة؛ استشر مستشاراً محلياً مؤهلاً أولاً.') },
    ],
    watch: [b('Shown for reference only.', 'معروض للاطلاع فقط.')],
  },

  // ---------------- India ----------------
  'in-make-in-india-price-preference': {
    confidence: 'official',
    headline: { value: b('50% / 20%', '٥٠٪ / ٢٠٪'), label: b('Class-I local content threshold / purchase-preference margin', 'عتبة المحتوى المحلي للفئة الأولى / هامش أفضلية الشراء') },
    verdict: b(
      'Only Class-I suppliers (50% local content or more) get the 20% margin: if you are within 20% of the lowest bid you are invited to match it. Class-II (20%-50%) gets no margin.',
      'موردو الفئة الأولى (٥٠٪ محتوى محلي فأكثر) فقط يحصلون على هامش ٢٠٪: إن كنت ضمن ٢٠٪ من أقل عرض فتُدعى لمطابقته. أما الفئة الثانية (٢٠٪-٥٠٪) فلا هامش لها.'),
    steps: [
      b('Class-I: local content 50% or more. Class-II: 20%-50%. Non-local: 20% or less.', 'الفئة الأولى: محتوى محلي ٥٠٪ فأكثر. الثانية: ٢٠٪-٥٠٪. غير محلي: ٢٠٪ فأقل.'),
      b('A Class-I bid that exceeds the lowest bid (L1) by up to 20% is invited to match L1.', 'يُدعى عرض الفئة الأولى الذي يزيد على أقل عرض (L1) بنسبة تصل إلى ٢٠٪ إلى مطابقته.'),
      b('Divisible orders: 50% to L1 and 50% to the lowest matching Class-I bidder. Non-divisible: the lowest matching Class-I bidder is considered.', 'الطلبات القابلة للتجزئة: ٥٠٪ لـ L1 و٥٠٪ لأقل مطابق من الفئة الأولى. غير القابلة: يُنظر في أقل مطابق من الفئة الأولى.'),
    ],
    next: [
      { when: 'before', text: b('Find your exact local-content figure. At 49% you lose the margin entirely.', 'اعرف رقم محتواك المحلي بدقة؛ فعند ٤٩٪ تخسر الهامش كلياً.') },
      { when: 'with-bid', text: b('Be ready to match L1 on price: the margin gets you invited, not awarded.', 'كن مستعداً لمطابقة سعر L1؛ فالهامش يمنحك الدعوة لا الترسية.') },
    ],
    watch: [b('PPP-MII Order 2017, revised 4 Jun 2020.', 'أمر PPP-MII لعام ٢٠١٧، المنقَّح في ٤ يونيو ٢٠٢٠.')],
    priceTest: { pct: 0.2, mode: 'add-to-rival', rateNote: b('Margin within which you may match L1', 'الهامش الذي يجوز لك مطابقة L1 ضمنه') },
  },

  'in-dap-2020-defense-offset': {
    confidence: 'official',
    headline: { value: b('30%', '٣٠٪'), label: b('offset obligation on Buy (Global) contracts of INR 2,000 crore or more', 'التزام التعويض على عقود الشراء (العالمي) بقيمة ٢٬٠٠٠ كرور روبية فأكثر') },
    verdict: b(
      'You owe 30% of contract value in offsets, and the avenue you choose sets the multiplier. A higher-multiplier avenue needs less real spend to discharge the same obligation.',
      'عليك تعويض يعادل ٣٠٪ من قيمة العقد، ويحدد المسار الذي تختاره المضاعف. المسار ذو المضاعف الأعلى يتطلب إنفاقاً فعلياً أقل لتسوية الالتزام نفسه.'),
    steps: [
      b('Select one avenue. Multipliers: direct purchase/export 1.0; components 0.5; MSME-channeled 1.5; defense-manufacturing investment 1.5; industrial-corridor investment 2.0; technology transfer 2.0; government/DRDO technology acquisition 3.0; critical-technology acquisition 4.0.', 'اختر مساراً واحداً. المضاعفات: شراء/تصدير مباشر ١٫٠؛ مكونات ٠٫٥؛ عبر المنشآت الصغيرة ١٫٥؛ استثمار تصنيع دفاعي ١٫٥؛ استثمار ممر صناعي ٢٫٠؛ نقل تقنية ٢٫٠؛ اقتناء تقنية حكومية/DRDO ٣٫٠؛ اقتناء تقنية حرجة ٤٫٠.'),
      b('Required activity spend = obligation ÷ multiplier.', 'الإنفاق المطلوب = الالتزام ÷ المضاعف.'),
    ],
    next: [
      { when: 'before', text: b('Run the obligation sizer for each avenue and compare spend needed, not just the multiplier.', 'شغّل حاسبة الالتزام لكل مسار وقارن الإنفاق المطلوب لا المضاعف وحده.') },
    ],
    watch: [b('Multipliers cannot be combined across avenues.', 'لا يجوز جمع المضاعفات عبر المسارات.')],
    obligation: {
      pct: 0.3, baseLabel: b('Contract value', 'قيمة العقد'), currency: 'INR', threshold: 20000000000,
      multipliers: [
        { label: b('Direct purchase / export', 'شراء/تصدير مباشر'), value: 1 },
        { label: b('Components', 'مكونات'), value: 0.5 },
        { label: b('MSME-channeled', 'عبر المنشآت الصغيرة'), value: 1.5 },
        { label: b('Defense-manufacturing investment', 'استثمار تصنيع دفاعي'), value: 1.5 },
        { label: b('Industrial-corridor investment', 'استثمار ممر صناعي'), value: 2 },
        { label: b('Technology transfer', 'نقل تقنية'), value: 2 },
        { label: b('Government / DRDO technology acquisition', 'اقتناء تقنية حكومية / DRDO'), value: 3 },
        { label: b('Critical-technology acquisition', 'اقتناء تقنية حرجة'), value: 4 },
      ],
    },
  },

  // ---------------- Germany ----------------
  'de-eu-gpa-non-discrimination-baseline': {
    confidence: 'official',
    headline: { value: b('None', 'لا يوجد'), label: b('no local-content preference in German civil procurement', 'لا أفضلية محتوى محلي في المشتريات المدنية الألمانية') },
    verdict: b(
      'Do not plan on a local-content advantage in Germany. EU and WTO rules require equal treatment and ban offset-style local-content requirements.',
      'لا تعتمد على أفضلية للمحتوى المحلي في ألمانيا. قواعد الاتحاد الأوروبي ومنظمة التجارة تفرض المساواة وتحظر اشتراطات المحتوى المحلي بأسلوب التعويض.'),
    steps: [
      b('Germany procures under Directive 2014/24/EU and the WTO Government Procurement Agreement.', 'تشتري ألمانيا بموجب التوجيه 2014/24/EU واتفاقية المشتريات الحكومية.'),
      b('The only related mechanism is the EU-level defense co-funding rule, modeled separately.', 'الآلية الوحيدة ذات الصلة قاعدة التمويل المشترك الدفاعي على مستوى الاتحاد، وهي مدرجة منفصلة.'),
    ],
    next: [
      { when: 'before', text: b('Compete on price, quality and compliance. Nothing in the rules rewards local origin.', 'نافس بالسعر والجودة والامتثال؛ فلا شيء في القواعد يكافئ المنشأ المحلي.') },
    ],
    watch: [b('Confirmed absent, not merely unresearched.', 'ثبت غيابه، ولم يكن غير مدروس فحسب.')],
  },

  'de-edip-defense-local-content': {
    confidence: 'corroborated',
    headline: { value: b('65%', '٦٥٪'), label: b('minimum EU or associated-country content for EDIP co-funding', 'حد أدنى للمحتوى من الاتحاد الأوروبي أو الدول المنتسبة للتمويل المشترك') },
    verdict: b(
      'To receive EU defense co-funding, at least 65% of the product\'s value must come from the EU or associated countries; no more than 35% from elsewhere.',
      'للحصول على التمويل الدفاعي المشترك للاتحاد يجب أن يأتي ٦٥٪ على الأقل من قيمة المنتج من الاتحاد أو الدول المنتسبة، وألا يزيد ما يأتي من غيرها على ٣٥٪.'),
    steps: [
      b('Add up the value originating in the EU or associated countries.', 'اجمع القيمة التي منشؤها الاتحاد الأوروبي أو الدول المنتسبة.'),
      b('If it is 65% or more of the product\'s value, it is eligible.', 'إن بلغت ٦٥٪ فأكثر من قيمة المنتج فهو مؤهَّل.'),
    ],
    next: [
      { when: 'before', text: b('Map non-EU components now; replacing a few high-value parts can move you across the line.', 'حدّد المكونات من خارج الاتحاد الآن؛ فاستبدال بعض القطع عالية القيمة قد ينقلك إلى ما فوق الحد.') },
    ],
    watch: [b('Regulation (EU) 2025/2643, effective 30 Dec 2025. The exact article could not be checked against the EU text.', 'اللائحة (EU) 2025/2643 السارية من ٣٠ ديسمبر ٢٠٢٥. لم يمكن التحقق من رقم المادة من نص الاتحاد.')],
  },

  // ---------------- Japan ----------------
  'jp-kankoju-sme-target-ratio': {
    confidence: 'official',
    headline: { value: b('61%', '٦١٪'), label: b('FY2025 target share of government contracts to SMEs (plus 3% to new SME contractors)', 'مستهدف ٢٠٢٥ لحصة المنشآت الصغيرة والمتوسطة من العقود الحكومية (و٣٪ للمتعاقدين الجدد)') },
    verdict: b(
      'Japan sets a new SME target every fiscal year by Cabinet decision. It steers government buying toward SMEs; it is not a score on your own bid.',
      'تضع اليابان مستهدفاً جديداً للمنشآت الصغيرة والمتوسطة كل سنة مالية بقرار من مجلس الوزراء. وهو يوجّه الشراء الحكومي نحوها وليس درجة على عرضك.'),
    steps: [
      b('The Kankouju Law (1966) requires an annual target.', 'يُلزم قانون Kankouju (١٩٦٦) بمستهدف سنوي.'),
      b('FY2025 (decided 22 Apr 2025): 61% overall, with at least 3% of contract value for new SME contractors. FY2013 reference: 56%.', 'السنة المالية ٢٠٢٥ (قُرّر في ٢٢ أبريل ٢٠٢٥): ٦١٪ إجمالاً و٣٪ على الأقل من قيمة العقود للمتعاقدين الجدد. مرجع ٢٠١٣: ٥٦٪.'),
    ],
    next: [
      { when: 'before', text: b('If you are an SME and new to government work, target buyers that must hit the new-contractor sub-target.', 'إن كنت منشأة صغيرة جديدة على العمل الحكومي فاستهدف الجهات الملزمة ببلوغ مستهدف المتعاقدين الجدد.') },
    ],
    watch: [b('Read each year\'s figure from that year\'s Cabinet Basic Policy.', 'اقرأ رقم كل سنة من السياسة الأساسية لمجلس الوزراء لتلك السنة.')],
  },

  // ---------------- Korea ----------------
  'kr-sme-purchase-target-ratio': {
    confidence: 'official',
    headline: { value: b('50% / 15%', '٥٠٪ / ١٥٪'), label: b('overall SME-product target / technology-development-product sub-target', 'المستهدف العام لمنتجات المنشآت الصغيرة / المستهدف الفرعي لمنتجات التطوير التقني') },
    verdict: b(
      'Public institutions must buy at least half of their procurement value from SMEs and 15% of their SME purchases as technology-development products. Selling technology-development products to Korean public buyers is therefore a strong niche.',
      'يجب على المؤسسات العامة شراء نصف قيمة مشترياتها على الأقل من المنشآت الصغيرة والمتوسطة، و١٥٪ من مشترياتها منها كمنتجات تطوير تقني. لذا يمثل بيع منتجات التطوير التقني للمشترين العموميين الكوريين مجالاً قوياً.'),
    steps: [
      b('Overall target: at least 50% of total procurement value goes to SME products.', 'المستهدف العام: ٥٠٪ على الأقل من قيمة المشتريات لمنتجات المنشآت الصغيرة والمتوسطة.'),
      b('Sub-target: at least 15% of SME goods purchases are technology-development products.', 'المستهدف الفرعي: ١٥٪ على الأقل من مشتريات سلع هذه المنشآت منتجات تطوير تقني.'),
    ],
    next: [
      { when: 'before', text: b('Decide which of the two targets your product serves and position it that way.', 'حدّد أي المستهدفين يخدمه منتجك وقدّمه على هذا الأساس.') },
    ],
    watch: [b('In 2025, 847 public institutions bought KRW 126.2 trillion of SME products. A compliance data point, not a rule.', 'في ٢٠٢٥ اشترت ٨٤٧ مؤسسة عامة منتجات منشآت صغيرة بقيمة ١٢٦٫٢ تريليون وون؛ معطى امتثال لا قاعدة.')],
  },

  'kr-sme-competitive-products-gate': {
    confidence: 'official',
    headline: { value: b('610 items', '٦١٠ بنود'), label: b('product items designated SME-exclusive for 2025-2027', 'بند منتجات مخصص حصرياً للمنشآت الصغيرة والمتوسطة ٢٠٢٥-٢٠٢٧') },
    verdict: b(
      'For a designated item, public institutions must buy directly from a certified SME producer. A reseller cannot qualify, however small.',
      'في البند المخصص يجب على المؤسسات العامة الشراء مباشرة من منتج معتمد من المنشآت الصغيرة والمتوسطة. ولا يتأهل الموزع مهما صغر حجمه.'),
    steps: [
      b('Check whether your product is among the 610 designated items.', 'تحقق هل منتجك ضمن البنود الـ٦١٠ المخصصة.'),
      b('You must be a certified direct producer, not a reseller.', 'يجب أن تكون منتجاً مباشراً معتمداً لا موزعاً.'),
    ],
    next: [
      { when: 'before', text: b('Get direct-producer certification before the designation period ends, and track the next designation list.', 'احصل على اعتماد المنتج المباشر قبل انتهاء فترة التخصيص، وتابع قائمة التخصيص التالية.') },
    ],
    watch: [b('Administered by the Ministry of SMEs and Startups; the 2025-2027 list took effect 1 Jan 2025.', 'تديرها وزارة المنشآت الصغيرة والناشئة؛ وبدأ سريان قائمة ٢٠٢٥-٢٠٢٧ في ١ يناير ٢٠٢٥.')],
  },
};
