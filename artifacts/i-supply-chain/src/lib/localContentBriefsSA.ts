// Module 08 Program Briefs -- Saudi Arabia (10 programs). See localContentBriefTypes.ts for the honesty rule.
import { b, type ProgramBrief } from './localContentBriefTypes';

export const SA_BRIEFS: Record<string, ProgramBrief> = {
  'sa-lcgpa-general': {
    confidence: 'official',
    headline: { value: b('4 pillars', '٤ أركان'), label: b('locally-eligible spend ÷ total spend', 'الإنفاق المحلي المؤهَّل ÷ إجمالي الإنفاق') },
    verdict: b(
      'Your score is the share of your spend that stays in the Kingdom. Government and state-owned buyers can use it to rank you; nothing sourced shows it governs private-to-private deals.',
      'درجتك هي حصة إنفاقك التي تبقى داخل المملكة. تستخدمها الجهات الحكومية والمملوكة للدولة لترتيبك؛ ولا يوجد ما يثبت أنها تحكم العقود بين القطاع الخاص والخاص.'),
    steps: [
      b('Sort every cost line into the four pillars defined in LCGPA Guide G1.', 'صنّف كل بند تكلفة ضمن الأركان الأربعة المحددة في دليل G1 لهيئة المحتوى المحلي.'),
      b('Mark which part of each line is locally eligible.', 'حدّد الجزء المؤهَّل محلياً من كل بند.'),
      b('Divide locally eligible spend by total spend. That ratio is your baseline score.', 'اقسم الإنفاق المحلي المؤهَّل على إجمالي الإنفاق؛ هذه النسبة هي درجتك الأساسية.'),
      b('The buyer decides how much weight the score carries in its evaluation.', 'تحدد جهة الشراء الوزن الذي تحمله الدرجة في تقييمها.'),
    ],
    next: [
      { when: 'before', text: b('Tag the last 12 months of spend line by line as local or not, before you quote.', 'صنّف إنفاق آخر ١٢ شهراً بنداً بنداً (محلي أو غير محلي) قبل تقديم عرضك.') },
      { when: 'with-bid', text: b('Show the score with its pillar breakdown so the evaluator can verify it quickly.', 'اعرض الدرجة مع تفصيل الأركان ليتحقق منها المُقيِّم بسرعة.') },
      { when: 'after', text: b('Keep the spend evidence by pillar; the score is only as strong as the records behind it.', 'احتفظ بأدلة الإنفاق حسب الركن؛ فقوة الدرجة من قوة السجلات التي تسندها.') },
    ],
    watch: [
      b('Coverage: government entities and entities at least 50% state-owned (extended June 2022). Private-to-private contracts: no sourced evidence.', 'النطاق: الجهات الحكومية والجهات التي تملكها الدولة بنسبة ٥٠٪ فأكثر (وُسِّع في يونيو ٢٠٢٢). العقود الخاصة بين شركتين خاصتين: لا يوجد دليل موثّق.'),
      b('No last-verified date is recorded for this program.', 'لم يُسجَّل تاريخ آخر مراجعة لهذا البرنامج.'),
    ],
  },

  'sa-mandatory-list': {
    confidence: 'official',
    headline: { value: b('233+', '+٢٣٣'), label: b('products and services government must buy from certified local sources', 'منتجاً وخدمة يجب على الجهات الحكومية شراءها من مصادر محلية معتمدة') },
    verdict: b(
      'If your product is on the list and you are not LCGPA-certified, you cannot win that government tender at any price. It is a pass/fail gate, not a score.',
      'إذا كان منتجك على القائمة وأنت غير معتمد من الهيئة، فلن تفوز بتلك المناقصة الحكومية مهما كان سعرك. إنها بوابة نجاح/فشل وليست درجة.'),
    steps: [
      b('Check whether your product or service category is on the Mandatory List.', 'تحقق هل فئة منتجك أو خدمتك مدرجة في القائمة الإلزامية.'),
      b('If listed, check that you hold LCGPA local-source certification.', 'إذا كانت مدرجة، تحقق أنك تحمل اعتماد المصدر المحلي من الهيئة.'),
      b('Listed and certified: you stay in the evaluation. Otherwise you are out for that category.', 'مدرج ومعتمد: تبقى في التقييم. غير ذلك: تُستبعد عن تلك الفئة.'),
    ],
    next: [
      { when: 'before', text: b('Match each product line you plan to bid against the list now, and start certification for any listed line before the tender is issued.', 'طابق كل بند تنوي تقديم عرض عنه مع القائمة الآن، وابدأ الاعتماد لأي بند مدرج قبل صدور المناقصة.') },
      { when: 'with-bid', text: b('Attach the certification reference to the bid.', 'أرفق مرجع الاعتماد بالعرض.') },
      { when: 'after', text: b('Put the certificate renewal date in your contract calendar.', 'سجّل تاريخ تجديد الشهادة في تقويم عقودك.') },
    ],
    watch: [b('Binary outcome: no percentage threshold applies, so a higher local-content ratio does not substitute for certification.', 'نتيجة ثنائية: لا توجد نسبة مئوية، فارتفاع المحتوى المحلي لا يغني عن الاعتماد.')],
  },

  'sa-price-preference': {
    confidence: 'official',
    headline: { value: b('10%', '١٠٪'), label: b('added to foreign offers when compared with qualifying national products', 'تُضاف إلى العروض الأجنبية عند مقارنتها بالمنتجات الوطنية المؤهَّلة') },
    verdict: b(
      'In government tenders, foreign offers are priced 10% higher at evaluation. A qualifying national product can bid up to 10% above the cheapest foreign offer and still compete on price.',
      'في المناقصات الحكومية تُحتسب العروض الأجنبية بسعر أعلى بنسبة ١٠٪ عند التقييم. يستطيع المنتج الوطني المؤهَّل أن يتقدم بسعر أعلى بنسبة تصل إلى ١٠٪ من أقل عرض أجنبي ويظل منافساً في السعر.'),
    steps: [
      b('Your product qualifies as a national product.', 'يُصنَّف منتجك منتجاً وطنياً مؤهَّلاً.'),
      b('At evaluation the buyer adds 10% to the price of competing foreign products.', 'عند التقييم تضيف الجهة ١٠٪ إلى سعر المنتجات الأجنبية المنافسة.'),
      b('The lowest evaluated price is compared; your real price is unchanged.', 'يُقارَن أقل سعر بعد التعديل؛ أما سعرك الفعلي فلا يتغير.'),
    ],
    next: [
      { when: 'before', text: b('Use the price test below to find the highest price you can quote and still beat the cheapest foreign offer.', 'استخدم اختبار السعر أدناه لمعرفة أعلى سعر يمكنك تقديمه وتظل أقل من أرخص عرض أجنبي بعد التعديل.') },
      { when: 'with-bid', text: b('State your national-product qualification clearly in the bid so the adjustment is applied to competitors, not missed.', 'وضّح تأهلك كمنتج وطني في العرض كي يُطبَّق التعديل على المنافسين ولا يُغفَل.') },
    ],
    watch: [b('This adjusts bid evaluation; it is not a local-content percentage score.', 'هذا تعديل في تقييم العطاءات وليس درجة نسبة محتوى محلي.'), b('No last-verified date is recorded.', 'لم يُسجَّل تاريخ آخر مراجعة.')],
    priceTest: { pct: 10, mode: 'add-to-rival' },
  },

  'sa-iktva-aramco': {
    confidence: 'official',
    headline: { value: b('iktva %', 'نسبة اكتفاء'), label: b("Aramco's own In-Kingdom Total Value Add score", 'درجة أرامكو الخاصة للقيمة الإجمالية المضافة داخل المملكة') },
    verdict: b(
      "Aramco scores you on its own formula, separate from the government score. Every riyal of Saudi payroll, training, supplier development and R&D raises it.",
      'تقيّمك أرامكو بمعادلتها الخاصة، المنفصلة عن الدرجة الحكومية. وكل ريال تنفقه على الرواتب السعودية والتدريب وتطوير الموردين والبحث والتطوير يرفع نتيجتك.'),
    steps: [
      b('Collect the five numerators: A local goods/services (plus local asset depreciation and Saudi-based expatriate pay), B Saudi workforce pay, C training, D supplier development, R local R&D.', 'اجمع المكونات الخمسة للبسط: A السلع والخدمات المحلية (مع إهلاك الأصول المحلية وأجور الوافدين المقيمين في المملكة)، B أجور القوى العاملة السعودية، C التدريب، D تطوير الموردين، R البحث والتطوير المحلي.'),
      b('Divide their sum by total costs E.', 'اقسم مجموعها على إجمالي التكاليف E.'),
      b('Add the incentive bonus I (export ratio, ESG, cybersecurity, regional HQ).', 'أضف مكافأة الحوافز I (نسبة التصدير، ESG، الأمن السيبراني، المقر الإقليمي).'),
      b('Aramco certifies the final figure; the platform number is directional.', 'تعتمد أرامكو الرقم النهائي؛ ورقم المنصة استرشادي.'),
    ],
    next: [
      { when: 'before', text: b('Map each cost line to A, B, C, D, R or E before you model any scenario.', 'اربط كل بند تكلفة بـ A أو B أو C أو D أو R أو E قبل بناء أي سيناريو.') },
      { when: 'with-bid', text: b('Use the result to decide which lever to pull first: Saudi payroll (B), training (C) or supplier development (D).', 'استخدم النتيجة لتحديد الرافعة الأولى: الرواتب السعودية (B) أو التدريب (C) أو تطوير الموردين (D).') },
      { when: 'after', text: b('Run the certified Aramco calculation before relying on any platform figure in a commitment.', 'نفّذ حساب أرامكو المعتمد قبل الاعتماد على أي رقم من المنصة في التزام تعاقدي.') },
    ],
    watch: [b('ISC models bonus I as one optional 0-10 input, not the full tiered export/ESG sub-formula.', 'تنمذج المنصة مكافأة I كمدخل اختياري واحد من ٠ إلى ١٠، لا المعادلة الفرعية المتدرجة الكاملة للتصدير وESG.'), b('Separate from the LCGPA general score; do not add the two.', 'منفصلة عن درجة الهيئة العامة؛ لا تجمع الدرجتين.')],
  },

  'sa-gami-defense': {
    confidence: 'official',
    headline: { value: b('60%', '٦٠٪'), label: b('of contract value, for military contracts of SAR 150M or more', 'من قيمة العقد، للعقود العسكرية البالغة ١٥٠ مليون ريال فأكثر') },
    verdict: b(
      'A military contract of SAR 150M or more carries a 60% Industrial Participation commitment, backed by a 10% security GAMI can draw on if you fall short. Higher-credit activities discharge it with less spend.',
      'يحمل العقد العسكري البالغ ١٥٠ مليون ريال فأكثر التزام مشاركة صناعية بنسبة ٦٠٪، مدعوماً بضمان أداء ١٠٪ يحق للهيئة العامة للصناعات العسكرية (GAMI) استيفاؤه عند التقصير. والأنشطة الأعلى ائتماناً تفي بالالتزام بإنفاق أقل.'),
    steps: [
      b('Trigger: contract value of SAR 150M or more.', 'الشرط: قيمة العقد ١٥٠ مليون ريال فأكثر.'),
      b('Commitment: 60% of contract value.', 'الالتزام: ٦٠٪ من قيمة العقد.'),
      b('Discharge by credits: Localization (factor 1.0-2.0, bonuses for SME or sole-source suppliers) and Capability Development (factor 1.0-5.0).', 'الوفاء بالائتمان: التوطين (معامل ١٫٠-٢٫٠ مع مكافآت للمنشآت الصغيرة والمتوسطة أو المورد الوحيد) وتنمية القدرات (معامل ١٫٠-٥٫٠).'),
      b('A 10% performance security is held; GAMI can liquidate part or all of it on shortfall.', 'يُحتفَظ بضمان أداء ١٠٪؛ ويحق للهيئة تسييل جزء منه أو كله عند التقصير.'),
    ],
    next: [
      { when: 'before', text: b('Size the commitment with the obligation sizer below and see how much activity spend each factor requires.', 'قدّر الالتزام بحاسبة الالتزام أدناه، وانظر حجم الإنفاق الذي يتطلبه كل معامل.') },
      { when: 'with-bid', text: b('Choose the activity mix deliberately: a 5.0 factor needs far less spend per credit than a 1.0 factor, but only if GAMI accepts the activity at that factor.', 'اختر مزيج الأنشطة بعناية: المعامل ٥٫٠ يحتاج إنفاقاً أقل بكثير لكل وحدة ائتمان من المعامل ١٫٠، لكن بشرط قبول الهيئة للنشاط بذلك المعامل.') },
      { when: 'after', text: b('Arrange the 10% performance security and track credits against the commitment through delivery.', 'جهّز ضمان الأداء ١٠٪ وتابع الائتمان مقابل الالتزام طوال التنفيذ.') },
    ],
    watch: [b("ISC models one discharge line item. GAMI's multi-year credit banking and bonus credits are real but not aggregated across contracts here.", 'تنمذج المنصة بند وفاء واحداً. أما ترحيل الائتمان لسنوات وائتمان المكافآت لدى الهيئة فهي حقيقية لكنها غير مجمَّعة عبر العقود هنا.')],
    obligation: {
      pct: 60, baseLabel: b('Contract value', 'قيمة العقد'), currency: 'SAR', threshold: 150_000_000,
      multipliers: [
        { label: b('Localization at 1.0', 'التوطين بمعامل ١٫٠'), value: 1 },
        { label: b('Localization at 2.0', 'التوطين بمعامل ٢٫٠'), value: 2 },
        { label: b('Capability Development at 5.0', 'تنمية القدرات بمعامل ٥٫٠'), value: 5 },
      ],
    },
  },

  'sa-likt': {
    confidence: 'none',
    headline: { value: b('No formula', 'لا صيغة'), label: b('LIKT has no published threshold or scoring method', 'لا يوجد حد أو طريقة احتساب منشورة لـ LIKT') },
    verdict: b(
      'LIKT is a government-to-industry localisation route for targeted industries. Nothing about eligibility or scoring is published, so ISC shows it for awareness only and never counts it in a score.',
      'LIKT مسار توطين بين الحكومة والصناعة للصناعات المستهدفة. لا يُنشر شيء عن الأهلية أو الاحتساب، لذلك تعرضه المنصة للاطلاع فقط ولا تحتسبه في أي درجة.'),
    steps: [
      b('LCGPA uses LIKT to work with global investors and technology leaders on targeted industries (activated 2021).', 'تستخدم الهيئة LIKT للتعاون مع المستثمرين العالميين وقادة التقنية في صناعات مستهدفة (فُعِّل عام ٢٠٢١).'),
      b('It runs through sector-specific government-to-industry agreements, not a public scoring rule.', 'ينفَّذ عبر اتفاقيات قطاعية بين الحكومة والصناعة، لا عبر قاعدة احتساب معلنة.'),
      b('The SAR 100M figure sometimes linked to LIKT belongs to the Economic Participation Policy instead.', 'رقم ١٠٠ مليون ريال الذي يُربط أحياناً بـ LIKT يخص سياسة المشاركة الاقتصادية.'),
    ],
    next: [
      { when: 'before', text: b('If you are a global investor or technology provider in a targeted industry, prepare a localisation proposal and take it to LCGPA directly; do not wait for a published rule.', 'إذا كنت مستثمراً عالمياً أو مزوّد تقنية في صناعة مستهدفة، فأعدّ مقترح توطين وقدّمه للهيئة مباشرة ولا تنتظر قاعدة منشورة.') },
      { when: 'with-bid', text: b('Do not cite LIKT as a scored advantage in any bid.', 'لا تذكر LIKT كميزة محتسبة في أي عطاء.') },
    ],
    watch: [b('Last checked 2 Oct 2026 against lcgpa.gov.sa.', 'آخر مراجعة ٢ أكتوبر ٢٠٢٦ على الموقع الرسمي lcgpa.gov.sa.')],
  },

  'sa-economic-participation-policy': {
    confidence: 'corroborated',
    headline: { value: b('35%', '٣٥٪'), label: b('of imported value to re-invest locally, on contracts with imports above SAR 100M', 'من قيمة الواردات تُعاد استثمارها محلياً، في العقود التي تتجاوز وارداتها ١٠٠ مليون ريال') },
    verdict: b(
      'If your government contract imports more than SAR 100M, you owe a local re-investment commitment of 35% of that import value. Your real cost is not 35%: it is the cheapest set of local projects that earns enough multiplier credit.',
      'إذا تجاوزت واردات عقدك الحكومي ١٠٠ مليون ريال، فعليك التزام إعادة استثمار محلي بنسبة ٣٥٪ من قيمة تلك الواردات. وتكلفتك الفعلية ليست ٣٥٪، بل أرخص مجموعة مشاريع محلية تحقق الائتمان المطلوب بالمضاعفات.'),
    steps: [
      b('Trigger: a government contract whose imported goods or services exceed SAR 100M.', 'الشرط: عقد حكومي تتجاوز فيه السلع أو الخدمات المستوردة ١٠٠ مليون ريال.'),
      b('Obligation: 35% of the imported value.', 'الالتزام: ٣٥٪ من قيمة الواردات.'),
      b('Submit an Economic Participation proposal with the bid; sign the commitment within 30 days of winning.', 'قدّم مقترح المشاركة الاقتصادية مع العطاء، ووقّع الالتزام خلال ٣٠ يوماً من الترسية.'),
      b('Discharge it through activities, each credited at a multiplier: subcontracting 1.0x, localization 0.5x-2.0x, knowledge/technology transfer 0.5x-3.0x, investment 1.0x-3.0x, R&D 3.0x fixed.', 'أوفِ بالالتزام عبر أنشطة يُحتسب كلٌّ منها بمضاعف: التعاقد من الباطن ١٫٠×، التوطين ٠٫٥×-٢٫٠×، نقل المعرفة/التقنية ٠٫٥×-٣٫٠×، الاستثمار ١٫٠×-٣٫٠×، البحث والتطوير ٣٫٠× ثابت.'),
    ],
    next: [
      { when: 'before', text: b('Split imported from local content in your price build-up so you know the exact base of the 35%.', 'افصل المحتوى المستورد عن المحلي في بناء سعرك لتعرف الأساس الدقيق لنسبة ٣٥٪.') },
      { when: 'with-bid', text: b('Name specific projects in the proposal and the multiplier you claim for each. Use the sizer below to see the spend each multiplier requires.', 'سمِّ مشاريع محددة في المقترح والمضاعف الذي تطالب به لكل منها. واستخدم الحاسبة أدناه لمعرفة الإنفاق الذي يتطلبه كل مضاعف.') },
      { when: 'with-bid', text: b('If award timing may straddle the policy change (see the update above), ask the authority in writing which version will bind you.', 'إذا كان موعد الترسية قد يتزامن مع تغيير السياسة (انظر التحديث أعلاه)، فاطلب من الجهة كتابةً تحديد النسخة التي ستسري عليك.') },
      { when: 'after', text: b('Track delivery project by project. No penalty formula is published, so treat shortfall exposure as unquantified, not as zero.', 'تابع التنفيذ مشروعاً بمشروع. لا توجد صيغة عقوبات منشورة، فعامل مخاطر التقصير على أنها غير مقدَّرة لا على أنها صفر.') },
    ],
    watch: [b('Confirmed by a law-firm analysis (DGA Group, 3 Jul 2023) and corroborated by Global Trade Alert; not the regulator\'s own text.', 'مؤكَّد بتحليل قانوني (مجموعة DGA، ٣ يوليو ٢٠٢٣) ومؤكَّد من Global Trade Alert؛ وليس من نص الجهة التنظيمية نفسها.')],
    obligation: {
      pct: 35, baseLabel: b('Imported value', 'قيمة الواردات'), currency: 'SAR', threshold: 100_000_000,
      multipliers: [
        { label: b('Subcontracting 1.0x', 'التعاقد من الباطن ١٫٠×'), value: 1 },
        { label: b('Localization 2.0x (top of range)', 'التوطين ٢٫٠× (أعلى النطاق)'), value: 2 },
        { label: b('Investment 3.0x (top of range)', 'الاستثمار ٣٫٠× (أعلى النطاق)'), value: 3 },
        { label: b('R&D 3.0x (fixed)', 'البحث والتطوير ٣٫٠× (ثابت)'), value: 3 },
      ],
    },
    update: {
      asOf: '2026-04-14',
      sourceName: 'DGA Group, 14 Apr 2026',
      sourceUrl: 'https://dgagroup.com/insight/updated-version-of-saudi-economic-participation-policy-issued-for-public-consultation/',
      text: b(
        'An updated draft is in the pipeline. LCGPA published it for public consultation on 5 April 2026 (open to 22 April). It proposes cutting the obligation from 35% to 25%, tiering it by tender size or cumulative tender value, widening the multiplier range, adding a formal appeals process and stricter reporting. DGA expects it to take effect no earlier than late 2026 or early 2027, after finalisation and a 120-day grace period. Until then the 35% rule binds new commitments. ISC has not seen a final LCGPA publication.',
        'هناك مسودة محدَّثة قيد الإعداد. نشرتها الهيئة للتشاور العام في ٥ أبريل ٢٠٢٦ (حتى ٢٢ أبريل). تقترح خفض الالتزام من ٣٥٪ إلى ٢٥٪، وتدريجه بحسب حجم المناقصة أو قيمة المناقصات التراكمية، وتوسيع نطاق المضاعفات، وإضافة آلية استئناف رسمية ومتطلبات تقارير أشد. وتتوقع DGA ألا تسري قبل أواخر ٢٠٢٦ أو مطلع ٢٠٢٧ بعد اعتمادها ومهلة سماح ١٢٠ يوماً. وحتى ذلك الحين تبقى قاعدة ٣٥٪ هي الملزمة للالتزامات الجديدة. ولم تطّلع المنصة على نشر نهائي من الهيئة.'),
    },
  },

  'sa-rawafed-stc': {
    confidence: 'official',
    headline: { value: b('4-pillar %', 'نسبة الأركان الأربعة'), label: b("stc's published local-content formula (Rawafed)", 'معادلة stc المنشورة للمحتوى المحلي (برنامج روافد)') },
    verdict: b(
      'stc scores local content the same four-pillar way as LCGPA. If stc is your buyer, strengthening Saudi payroll, local spend, local asset depreciation and capacity development lifts your standing. Nothing sourced shows it applies to private buyers.',
      'تحتسب stc المحتوى المحلي بنفس نهج الأركان الأربعة لهيئة المحتوى المحلي. فإذا كانت stc هي المشتري، فإن رفع الرواتب السعودية والإنفاق المحلي وإهلاك الأصول المحلية وتنمية القدرات يحسّن موقعك. ولا يوجد ما يثبت انطباقه على المشترين الخاصين.'),
    steps: [
      b('Add four items: local goods/services, local salaries, local asset depreciation, local capacity development.', 'اجمع أربعة بنود: السلع والخدمات المحلية، الرواتب المحلية، إهلاك الأصول المحلية، وتنمية القدرات المحلية.'),
      b('Divide by the same four totals taken at company level.', 'اقسمها على المجاميع الأربعة نفسها على مستوى الشركة.'),
      b('The result is your local-content percentage. The programme launched in 2018 under Vision 2030 and covered roughly SAR 16 billion of large-project procurement.', 'الناتج هو نسبة المحتوى المحلي لديك. أُطلق البرنامج عام ٢٠١٨ ضمن رؤية ٢٠٣٠ وشمل نحو ١٦ مليار ريال من مشتريات المشاريع الكبرى.'),
    ],
    next: [
      { when: 'before', text: b('Build the four totals from your accounts so the percentage can be reproduced on request.', 'أعدّ المجاميع الأربعة من حساباتك بحيث يمكن إعادة إنتاج النسبة عند الطلب.') },
      { when: 'with-bid', text: b("Ask stc's procurement team whether this formula applies to your specific contract before you rely on it.", 'اسأل فريق مشتريات stc هل تنطبق هذه المعادلة على عقدك تحديداً قبل الاعتماد عليها.') },
    ],
    watch: [b('Source is stc\'s own 2021 Rawafed annual report. Last checked 22 Oct 2026.', 'المصدر هو التقرير السنوي لبرنامج روافد (٢٠٢١) الصادر عن stc. آخر مراجعة ٢٢ أكتوبر ٢٠٢٦.')],
  },

  'sa-sabic-lc-commitment': {
    confidence: 'platform',
    headline: { value: b('Per contract', 'لكل عقد'), label: b('a negotiated local-content target, audited against delivery', 'هدف محتوى محلي يُتفاوَض عليه ويُدقَّق مقابل ما نُفِّذ') },
    verdict: b(
      'SABIC publishes no company-wide target. Your commitment is whatever you sign in your own contract, and it is audited. The risk is the gap between what you promise and what you deliver.',
      'لا تنشر سابك هدفاً على مستوى الشركة. التزامك هو ما توقّعه في عقدك، ويُدقَّق فعلياً. والمخاطرة هي الفجوة بين ما تعد به وما تنفّذه.'),
    steps: [
      b('Each supplier contract states its own local-content target.', 'ينص كل عقد مع مورّد على هدفه الخاص للمحتوى المحلي.'),
      b('The delivered local content is audited against that target.', 'يُدقَّق المحتوى المحلي المنفَّذ مقابل ذلك الهدف.'),
      b('ISC tests the gap: deviation = proposed target minus audited actual, against a 5-point tolerance and a penalty capped at 1% of contract value.', 'تختبر المنصة الفجوة: الانحراف = الهدف المقترح − الفعلي المدقَّق، مقابل تفاوت ٥ نقاط وغرامة بسقف ١٪ من قيمة العقد.'),
    ],
    next: [
      { when: 'before', text: b('Do not offer a stretch target to win the contract. Test what you can really deliver before you propose a number.', 'لا تعرض هدفاً طموحاً فقط لتفوز بالعقد. اختبر ما تستطيع تنفيذه فعلاً قبل اقتراح الرقم.') },
      { when: 'with-bid', text: b('Write the tolerance and the penalty into the contract wording, not just the target.', 'اكتب التفاوت والغرامة في نص العقد، وليس الهدف وحده.') },
      { when: 'after', text: b('Track delivered local content every quarter, so a shortfall shows up before the audit does.', 'تابع المحتوى المحلي المنفَّذ كل ربع سنة ليظهر أي نقص قبل التدقيق.') },
    ],
    watch: [b('The 5-point tolerance and the 1% penalty cap are ISC business-rule defaults, not a published SABIC or third-party standard. Replace them with your contract\'s own terms.', 'تفاوت ٥ نقاط وسقف الغرامة ١٪ قيمتان افتراضيتان من قواعد عمل المنصة، لا معيار منشور من سابك أو غيرها. استبدلهما بشروط عقدك الفعلية.')],
  },

  'sa-tharwah-maaden': {
    confidence: 'none',
    headline: { value: b('5 goals', '٥ أهداف'), label: b('no per-supplier scoring formula is published', 'لا توجد صيغة احتساب منشورة على مستوى المورّد') },
    verdict: b(
      "Ma'aden's Tharwah programme sets five goals but publishes no supplier score. ISC shows it for awareness and does not count it. A scoring method may sit behind the login-gated supplier portal, which the platform cannot check.",
      'يضع برنامج «ثروة» لدى معادن خمسة أهداف دون نشر درجة للمورّد. تعرضه المنصة للاطلاع ولا تحتسبه. وقد توجد طريقة احتساب خلف بوابة الموردين المحمية بكلمة مرور، وهي ما لا تستطيع المنصة فحصه.'),
    steps: [
      b('Five goals: Saudi employment, local-business participation, SME support, regional development, mining-industry integration.', 'خمسة أهداف: التوطين الوظيفي، مشاركة الأعمال المحلية، دعم المنشآت الصغيرة والمتوسطة، تنمية المناطق، وتكامل صناعة التعدين.'),
      b('Delivered through a supplier portal and an opportunities catalogue of 16+ categories.', 'تُنفَّذ عبر بوابة موردين وكتالوج فرص من أكثر من ١٦ فئة.'),
      b('The figures often quoted (SAR 55bn spend by 2040, SAR 33bn local content, 47,000 jobs) are secondary-source company targets, not supplier criteria.', 'الأرقام المتداولة (٥٥ مليار ريال إنفاقاً بحلول ٢٠٤٠، ٣٣ ملياراً محتوى محلياً، ٤٧ ألف وظيفة) من مصادر ثانوية وهي أهداف للشركة لا معايير للموردين.'),
    ],
    next: [
      { when: 'before', text: b("Register on Ma'aden's supplier portal. It is the only place the real qualification criteria can appear.", 'سجّل في بوابة موردي معادن؛ فهي المكان الوحيد الذي قد تظهر فيه معايير التأهل الحقيقية.') },
      { when: 'before', text: b('Prepare evidence now against the five goals (Saudi headcount, local subcontracting, SME suppliers, regional presence) so you can answer the moment a criterion is shown.', 'جهّز الأدلة الآن وفق الأهداف الخمسة (عدد السعوديين، التعاقد المحلي من الباطن، موردو المنشآت الصغيرة والمتوسطة، الحضور الإقليمي) لتجيب فور ظهور أي معيار.') },
    ],
    watch: [b('Last checked 20 Oct 2026. Do not quote any Tharwah percentage in a bid.', 'آخر مراجعة ٢٠ أكتوبر ٢٠٢٦. لا تذكر أي نسبة لبرنامج ثروة في عطاء.')],
  },
};
