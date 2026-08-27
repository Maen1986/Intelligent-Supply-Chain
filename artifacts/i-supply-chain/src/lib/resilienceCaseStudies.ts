/**
 * Resilience Reference Library + Revenue-at-Risk (RAR) Methodology
 *
 * Content-honesty note: sld (service level during disruption) and rar
 * (revenue at risk) do not have a flat, publishable industry-benchmark
 * figure -- real practitioners CALCULATE their own exposure rather than
 * compare to an industry average. Rather than force a made-up number onto
 * these two KPIs, this file gives the diagnostic platform (a) a library of
 * real, sourced disruption case studies for qualitative comparison, and
 * (b) an actual calculation method a client can run on their own numbers.
 *
 * Source: "ISC Benchmark FINAL v1.0.xlsx", Tab 11 ("sld-rar Toolkit"), and
 * "ISC_KPI_Diagnostic_Knowledgebase.json". Added 2026-08-19.
 */

export interface ResilienceCaseStudy {
  id: string;
  disruptionType: string;
  disruptionTypeAr: string;
  companiesEvent: string;
  companiesEventAr: string;
  year: string;
  metrics: string;
  metricsAr: string;
  lesson: string;
  lessonAr: string;
  source: string;
}

export const RESILIENCE_CASE_STUDIES: ResilienceCaseStudy[] = [
  {
    id: 'semiconductor-shortage-outcomes',
    disruptionType: 'Semiconductor shortage',
    disruptionTypeAr: 'نقص أشباه الموصلات',
    companiesEvent: 'Toyota vs. Stellantis, Honda, Nissan',
    companiesEventAr: 'تويوتا مقابل ستيلانتيس وهوندا ونيسان',
    year: '2021–2022',
    metrics: 'Toyota Sept 2021 production 60% of plan; Stellantis Q1 2021 89% of plan; Honda 2021 sales 97.8% of target; Nissan 2021 sales 96.4% of target.',
    metricsAr: 'إنتاج تويوتا سبتمبر 2021: 60% من الخطة؛ ستيلانتيس الربع الأول 2021: 89%؛ مبيعات هوندا 2021: 97.8% من الهدف؛ نيسان: 96.4%.',
    lesson: 'Same disruption, different sld outcomes by company — sld is company-strategy-dependent, not industry-uniform.',
    lessonAr: 'نفس الاضطراب، نتائج مختلفة لكل شركة — مستوى الخدمة أثناء الاضطراب يعتمد على استراتيجية الشركة، وليس موحداً على مستوى الصناعة.',
    source: 'Industry production/sales disclosures',
  },
  {
    id: 'semiconductor-buffer-strategy',
    disruptionType: 'Semiconductor shortage (buffer strategy)',
    disruptionTypeAr: 'نقص أشباه الموصلات (استراتيجية المخزون الاحتياطي)',
    companiesEvent: 'Toyota vs. General Motors',
    companiesEventAr: 'تويوتا مقابل جنرال موتورز',
    year: '2021',
    metrics: "Toyota required suppliers to hold up to 6 months' dedicated chip buffer (post-Fukushima policy); US production held ~90% of capacity through June 2021. GM cut production by ~278,000 units by May 2021 (~40% capacity cut). Toyota overtook GM as #1 US automaker that year.",
    metricsAr: 'طلبت تويوتا من الموردين الاحتفاظ بمخزون احتياطي مخصص من الرقائق لمدة تصل إلى 6 أشهر؛ حافظ الإنتاج الأمريكي على ~90% من الطاقة حتى يونيو 2021. خفضت جنرال موتورز الإنتاج بنحو 278,000 وحدة بحلول مايو 2021 (~40% خفض في الطاقة). تجاوزت تويوتا جنرال موتورز كأكبر مصنّع سيارات في أمريكا تلك السنة.',
    lesson: 'Clearest evidence that buffer depth causally drives sld outcomes during a named disruption.',
    lessonAr: 'أوضح دليل على أن عمق المخزون الاحتياطي يحدد بشكل سببي نتائج مستوى الخدمة أثناء اضطراب محدد.',
    source: 'carbuzz.com; fortune.com (2021-08-02, 2022-01-05)',
  },
  {
    id: 'philips-plant-fire',
    disruptionType: 'Single-source component fire',
    disruptionTypeAr: 'حريق في مصنع لمكوّن أحادي المصدر',
    companiesEvent: 'Nokia vs. Ericsson (Philips plant fire)',
    companiesEventAr: 'نوكيا مقابل إريكسون (حريق مصنع فيليبس)',
    year: '2000',
    metrics: "Both sourced ~40% of a critical chip from the same Philips plant. Nokia detected early, multi-sourced/redesigned, grew profit >40% that year. Ericsson's slower response caused $1.68B annual losses, 3% market-share decline, and contributed to a later handset-business exit.",
    metricsAr: 'كانت الشركتان تحصلان على ~40% من رقاقة حرجة من نفس مصنع فيليبس. اكتشفت نوكيا الأمر مبكراً وأعادت التصميم/التوريد، ونمت أرباحها أكثر من 40%. تسببت استجابة إريكسون الأبطأ في خسائر سنوية بلغت 1.68 مليار دولار وتراجع حصتها السوقية 3%.',
    lesson: 'Most-cited resilience case study in the field — detection speed and multi-sourcing decided the outcome, not stockholding alone.',
    lessonAr: 'أكثر دراسة حالة يُستشهد بها في مجال المرونة — سرعة الاكتشاف والتوريد المتعدد هما ما حسما النتيجة، وليس المخزون وحده.',
    source: '"The Fire That Changed an Industry" and related case-study literature',
  },
  {
    id: 'tohoku-earthquake',
    disruptionType: 'Earthquake / tsunami',
    disruptionTypeAr: 'زلزال/تسونامي',
    companiesEvent: 'Toyota, Tohoku earthquake/tsunami',
    companiesEventAr: 'تويوتا، زلزال وتسونامي توهوكو',
    year: '2011',
    metrics: "45% of Toyota's global vehicle output (made at Japan plants) closed ~2 months; North American production fell to 30% of capacity for 6 months (150-part shortage); Q2 2011 profit fell 77% (~$1.36bn).",
    metricsAr: 'توقف 45% من إنتاج تويوتا العالمي (المصانع اليابانية) لحوالي شهرين؛ انخفض الإنتاج في أمريكا الشمالية إلى 30% من الطاقة لمدة 6 أشهر؛ انخفض ربح الربع الثاني 2011 بنسبة 77%.',
    lesson: 'Realistic depth/duration of an sld shock even for a company later famous for resilience — drove Toyota\'s post-2011 buffer policy.',
    lessonAr: 'عمق ومدة واقعيان لصدمة في مستوى الخدمة حتى لشركة اشتهرت لاحقاً بالمرونة — دفعت هذه التجربة تويوتا لسياسة المخزون الاحتياطي بعد 2011.',
    source: 'Swiss Re Institute x UC Berkeley CDAR paper',
  },
  {
    id: 'osaka-earthquake-ripple',
    disruptionType: 'Earthquake (ripple-effect)',
    disruptionTypeAr: 'زلزال (أثر متسلسل)',
    companiesEvent: 'Automotive sector, Osaka earthquake',
    companiesEventAr: 'قطاع السيارات، زلزال أوساكا',
    year: '2018',
    metrics: 'Accounting for indirect/ripple-effect supplier interdependencies added an estimated +11% in business-interruption losses vs. a direct-impact-only estimate.',
    metricsAr: 'أضاف احتساب الترابطات غير المباشرة بين الموردين ما يقدر بـ 11% إضافية لخسائر انقطاع الأعمال مقارنة بتقدير الأثر المباشر فقط.',
    lesson: "Quantifies how much a naive sld/rar estimate understates real exposure when supplier interdependencies aren't mapped.",
    lessonAr: 'يقيس مقدار ما يقلل تقدير مستوى الخدمة/الإيراد المعرّض للخطر السطحي من التعرض الحقيقي عند عدم رسم خرائط ترابط الموردين.',
    source: 'Swiss Re Institute x UC Berkeley CDAR paper',
  },
  {
    id: 'intel-tsunami-claim',
    disruptionType: 'Best-in-class self-reported claim',
    disruptionTypeAr: 'ادعاء ذاتي لأفضل ممارسة',
    companiesEvent: 'Intel, Japan tsunami',
    companiesEventAr: 'إنتل، تسونامي اليابان',
    year: '2011',
    metrics: "Intel CSCO Randhir Thakur states Intel achieved 'zero supply chain related customer impacts' from the 2011 Japan tsunami — implies ~100% continuity.",
    metricsAr: 'صرّح مدير سلسلة الإمداد في إنتل راندهير ثاكور بأن إنتل حققت "صفر أثر على العملاء متعلق بسلسلة الإمداد" من تسونامي اليابان 2011.',
    lesson: 'Strongest named best-in-class sld claim found; single-company self-reported, useful as the extreme best-in-class end of the range.',
    lessonAr: 'أقوى ادعاء موثّق لأفضل أداء في مستوى الخدمة؛ ذاتي التقرير من شركة واحدة، مفيد كطرف أعلى نظري للمدى.',
    source: 'ASCM/EIU Resilient Supply Chain Benchmark, 2021',
  },
  {
    id: 'portwatch-durations',
    disruptionType: 'Port disruption (general distribution)',
    disruptionTypeAr: 'اضطراب الموانئ (توزيع عام)',
    companiesEvent: 'IMF PortWatch, 2,065 ports worldwide, 27 events',
    companiesEventAr: 'IMF PortWatch، 2,065 ميناء حول العالم، 27 حدثاً',
    year: 'ongoing',
    metrics: 'Median port-disruption duration 6 days; 95th-percentile duration 22 days.',
    metricsAr: 'الوسيط الزمني لاضطراب الموانئ 6 أيام؛ الشريحة المئوية 95 تبلغ 22 يوماً.',
    lesson: "Real dataset-based distribution of disruption duration — bounds a realistic sld 'sustain window' scenario length.",
    lessonAr: 'توزيع حقيقي مبني على بيانات لمدة الاضطراب — يحدد طول سيناريو "نافذة الصمود" الواقعي لمستوى الخدمة.',
    source: 'IMF PortWatch (IMF x University of Oxford)',
  },
  {
    id: 'lloyds-war-risk',
    disruptionType: 'Market-priced war risk',
    disruptionTypeAr: 'مخاطر الحرب المسعّرة في السوق',
    companiesEvent: 'Lloyd\'s List, Red Sea and Black Sea shipping',
    companiesEventAr: 'قائمة لويدز، الشحن في البحر الأحمر والبحر الأسود',
    year: '2023–2025',
    metrics: 'Red Sea war-risk premium 0.05% pre-crisis → 0.1–0.2% during crisis (Israeli-owned vessels +250%); Black Sea 2.5–3.0%. Example: $75m vessel at 0.3% premium = $225,000/trip.',
    metricsAr: 'قسط مخاطر الحرب في البحر الأحمر ارتفع من 0.05% إلى 0.1-0.2% أثناء الأزمة؛ البحر الأسود 2.5-3.0%. مثال: سفينة بقيمة 75 مليون دولار بقسط 0.3% = 225,000 دولار لكل رحلة.',
    lesson: 'Continuously market-priced, real-time signal of disruption risk — insurers pricing sld/rar-type exposure in real time.',
    lessonAr: 'إشارة سوقية مسعّرة باستمرار وفي الوقت الفعلي لمخاطر الاضطراب — شركات التأمين تسعّر هذا النوع من التعرض لحظياً.',
    source: "Lloyd's List",
  },
  {
    id: 'ila-port-strike',
    disruptionType: 'Labor action / port strike',
    disruptionTypeAr: 'إجراء عمالي / إضراب ميناء',
    companiesEvent: 'October 2024 ILA East/Gulf Coast strike, 36 U.S. ports, 3 days',
    companiesEventAr: 'إضراب أكتوبر 2024 في السواحل الشرقية وخليج أمريكا، 36 ميناءً، 3 أيام',
    year: '2024',
    metrics: 'Per-day economic impact estimates: NAM $1.5–2.5B; JPMorgan Chase $3.8–4.5B; broader economy-wide ~$5.0B.',
    metricsAr: 'تقديرات الأثر الاقتصادي اليومي: الرابطة الوطنية للمصنّعين 1.5-2.5 مليار دولار؛ جيه بي مورجان تشيس 3.8-4.5 مليار دولار؛ على مستوى الاقتصاد ~5.0 مليار دولار.',
    lesson: 'Three credible institutions estimating the same completed event differ by >3x — even hindsight sld/rar estimation carries real uncertainty.',
    lessonAr: 'ثلاث جهات موثوقة قدّرت نفس الحدث المكتمل بفارق يتجاوز 3 أضعاف — حتى التقدير بأثر رجعي يحمل عدم يقين حقيقي.',
    source: 'NAM; JPMorgan Chase',
  },
  {
    id: 'bci-resilience-report',
    disruptionType: 'Cross-industry resilience benchmark',
    disruptionTypeAr: 'مقياس مرونة عبر الصناعات',
    companiesEvent: 'BCI Supply Chain Resilience Report',
    companiesEventAr: 'تقرير BCI لمرونة سلسلة الإمداد',
    year: 'current',
    metrics: '80% of organizations disrupted in the past year; top cause 43.6% third-party failure; 46.7% insured against disruption (up from 37.4% prior year).',
    metricsAr: 'تعرضت 80% من المنظمات لاضطراب خلال العام الماضي؛ السبب الأول 43.6% فشل طرف ثالث؛ 46.7% مؤمّن ضد الاضطراب (ارتفاعاً من 37.4%).',
    lesson: 'Frequency and insurance-uptake context for how common and how (under-)hedged disruption exposure is across industry.',
    lessonAr: 'سياق لتكرار الاضطراب ومدى التحوط (الناقص) له عبر الصناعة.',
    source: 'Business Continuity Institute',
  },
  {
    id: 'ascm-bcp-adoption',
    disruptionType: 'Business-continuity-plan adoption',
    disruptionTypeAr: 'تبنّي خطة استمرارية الأعمال',
    companiesEvent: 'ASCM/EIU, 308 publicly-listed US companies',
    companiesEventAr: 'ASCM/EIU، 308 شركة أمريكية مدرجة',
    year: '2021',
    metrics: "Only 57% of benchmarked companies had a business continuity plan meeting the study's full criteria (defined triggers + documented actions across disruption types).",
    metricsAr: 'فقط 57% من الشركات المقاسة لديها خطة استمرارية أعمال تستوفي معايير الدراسة الكاملة.',
    lesson: "Most of the population sld would need to score doesn't even have a documented BCP — reinforces why a single flat percentage can't represent the population.",
    lessonAr: 'معظم الشركات التي يُفترض تسجيل مستوى خدمتها لا تملك حتى خطة استمرارية موثّقة — يعزز سبب عدم قدرة رقم واحد ثابت على تمثيل المجتمع.',
    source: 'ASCM/Economist Intelligence Unit',
  },
  {
    id: 'reshoring-intent',
    disruptionType: 'Reshoring / de-risking intent',
    disruptionTypeAr: 'نية إعادة التوطين وتقليل المخاطر',
    companiesEvent: 'Kearney Reshoring Index; NAM Q1 2026 survey',
    companiesEventAr: 'مؤشر Kearney لإعادة التوطين؛ استطلاع NAM الربع الأول 2026',
    year: '2025–2026',
    metrics: 'CEOs planning to reshore within 3 years up 15pp YoY; 63.3% of manufacturers report increased volatility in the past 12 months; US manufacturing capacity growth only 1.5% vs. 9pp shift in import ratio.',
    metricsAr: 'ارتفاع نسبة الرؤساء التنفيذيين المخططين لإعادة التوطين خلال 3 سنوات بمقدار 15 نقطة مئوية؛ 63.3% من المصنّعين أبلغوا عن تقلب متزايد خلال 12 شهراً.',
    lesson: 'Confirms sld/rar-type exposure is a rising, current concern, and that intent to de-risk outpaces actual capacity change.',
    lessonAr: 'يؤكد أن هذا النوع من التعرض قلق متزايد وحالي، وأن نية تقليل المخاطر تسبق التغيير الفعلي في الطاقة الإنتاجية.',
    source: 'Kearney; National Association of Manufacturers',
  },
  {
    id: 'aisin-fire-supplier-concentration',
    disruptionType: 'Supplier Concentration Risk',
    disruptionTypeAr: 'مخاطر تركّز الموردين',
    companiesEvent: 'Aisin Seiki fire halts Toyota production nationwide',
    companiesEventAr: 'حريق آيسين سيكي يوقف إنتاج تويوتا على مستوى اليابان',
    year: '1997',
    metrics: "Aisin Seiki supplied 98% of the P-valves (brake proportioning valves) used in every Toyota vehicle. A fire destroyed its main plant on 1 Feb 1997. With Toyota's just-in-time model holding only 2-3 days of parts inventory, all 20 Toyota assembly plants across Japan halted -- roughly 15,500 vehicles/day of output stopped. Toyota and ~200 affiliated suppliers self-organized (with no contracts, no pre-agreed compensation, and minimal direct Toyota control) to stand up alternative P-valve production across more than 60 separate suppliers. Full-capacity production resumed within about 2 days of the fire, versus initial estimates of weeks to months. Toyota's estimated lost revenue: approximately ¥160 billion.",
    metricsAr: 'كانت آيسين سيكي تزوّد 98% من صمامات الفرامل المستخدمة في كل سيارة تويوتا. أدى حريق في مصنعها الرئيسي في 1 فبراير 1997 إلى توقف جميع مصانع تويوتا الـ20 في اليابان بسبب نظام الإنتاج في الوقت المحدد الذي لا يحتفظ إلا بمخزون يكفي يومين إلى ثلاثة أيام. نظّمت تويوتا وحوالي 200 مورد تابع أنفسهم -- دون عقود أو تعويض متفق عليه مسبقًا -- لإنتاج الصمامات البديلة عبر أكثر من 60 موردًا منفصلاً. استؤنف الإنتاج الكامل خلال يومين تقريبًا، مقابل تقديرات أولية بأسابيع أو أشهر. الخسارة التقديرية لتويوتا: نحو 160 مليار ين.',
    lesson: "Single-sourcing a critical component -- even inside a trusted, long-term supplier relationship -- creates a real, demonstrated production-halting risk. What limited Toyota's damage wasn't a formal business-continuity plan; it was years of investment in deep, high-trust supplier relationships (the keiretsu model) that let dozens of unrelated firms collaborate under crisis without contracts or pre-negotiated terms. For a client without that kind of relational depth, the practical takeaway is dual/multi-sourcing of any single-supplier-dependent critical component, not reliance on informal goodwill alone.",
    lessonAr: 'الاعتماد على مصدر واحد لمكوّن حرج -- حتى ضمن علاقة موردين طويلة الأمد وموثوقة -- يمثل خطرًا حقيقيًا وموثّقًا لوقف الإنتاج. ما حدّ من ضرر تويوتا لم يكن خطة استمرارية أعمال رسمية، بل سنوات من الاستثمار في علاقات موردين عميقة وعالية الثقة (نموذج الكيريتسو) سمحت لعشرات الشركات غير المرتبطة بالتعاون في الأزمة دون عقود أو شروط متفق عليها مسبقًا. بالنسبة لعميل يفتقر لهذا العمق العلائقي، فإن الدرس العملي هو التزويد المزدوج أو متعدد المصادر لأي مكوّن حرج يعتمد على مورد واحد، لا الاعتماد على النوايا الحسنة غير الرسمية وحدها.',
    source: "1997 Aisin fire (Wikipedia, cross-referenced against MIT Sloan Management Review's published case 'The Toyota Group and the Aisin Fire' and The Case Centre's case listing); production-halt duration and revenue loss figures corroborated across multiple secondary sources (LinkedIn analysis citing the MIT case, Commerce.net contemporary reporting).",
  },
  {
    id: 'apple-imagination-ip-dispute',
    disruptionType: 'Contract & IP Dispute Risk',
    disruptionTypeAr: 'مخاطر نزاعات العقود والملكية الفكرية',
    companiesEvent: "Apple's termination notice to Imagination Technologies",
    companiesEventAr: 'إشعار آبل بإنهاء التعاقد مع Imagination Technologies',
    year: '2017',
    metrics: "On 3 April 2017, Apple notified GPU-licensor Imagination Technologies that it intended to stop using Imagination's IP within 15-24 months, planning to design its own graphics chips in-house instead. Imagination's stock fell over 70% in a single trading day on the news -- Apple licensing revenue represented roughly half of Imagination's total revenue at the time. Imagination publicly disputed Apple's claim that it could design a non-infringing GPU without Imagination's IP or a new license, and the company was acquired later that same year by China-backed Canyon Bridge Capital Partners at a fraction of its prior valuation.",
    metricsAr: 'في 3 أبريل 2017، أبلغت آبل مرخِّص معالجات الرسوميات Imagination Technologies بنيتها التوقف عن استخدام ملكيتها الفكرية خلال 15 إلى 24 شهرًا، بهدف تصميم رقائق رسوميات خاصة بها داخليًا. انخفض سهم Imagination بأكثر من 70% في يوم تداول واحد، علمًا أن إيرادات ترخيص آبل كانت تمثل نحو نصف إجمالي إيرادات الشركة. اعترضت Imagination علنًا على ادعاء آبل بإمكانية تصميم معالج رسومي لا ينتهك ملكيتها الفكرية دون ترخيص جديد، واستحوذت عليها لاحقًا في العام نفسه شركة Canyon Bridge Capital Partners المدعومة صينيًا بجزء بسيط من قيمتها السابقة.',
    lesson: "Revenue concentration in a single counterparty is a contract and commercial risk, not just a sales-pipeline risk -- Imagination's near-total dependence on one licensee turned a single termination notice into an existential event within one trading day. For CLM specifically: a termination-for-convenience or non-renewal clause that looks standard in isolation carries very different real risk depending on what share of total revenue that one counterparty represents -- exactly the kind of concentration signal a contract register (Module 06's clm-renewal maturity dimension) should be built to surface, not just track renewal dates in isolation.",
    lessonAr: 'تركّز الإيرادات لدى طرف تعاقدي واحد هو خطر تعاقدي وتجاري، لا مجرد خطر يتعلق بخط مبيعات -- فاعتماد Imagination شبه الكامل على مرخَّص واحد حوّل إشعار إنهاء واحد إلى حدث وجودي خلال يوم تداول واحد. وبالنسبة لإدارة دورة حياة العقود تحديدًا: بند إنهاء لمصلحة الطرف أو عدم تجديد قد يبدو معياريًا بمعزل عن السياق، لكنه يحمل مخاطر حقيقية مختلفة تمامًا تبعًا لحصة ذلك الطرف الواحد من إجمالي الإيرادات -- وهذا بالضبط نوع إشارة التركّز التي ينبغي أن يُبنى سجل العقود (بُعد النضج clm-renewal في الوحدة 06) لإظهارها، لا لتتبع تواريخ التجديد بمعزل عن السياق فقط.',
    source: "Widely reported contemporaneous financial/tech press coverage of Apple's 3 April 2017 termination notice to Imagination Technologies and the resulting >70% single-day stock decline; Imagination's 2017 acquisition by Canyon Bridge Capital Partners is separately, publicly documented.",
  },
];

// ─── Revenue-at-Risk (RAR) calculation methodology ─────────────────────────

/**
 * Swiss Re Institute x UC Berkeley CDAR (Oct 2024): calculating exposure
 * WITHOUT mapping supplier interdependencies understates true exposure by
 * ~9% (single-plant scenario) to 14%+ (fuller mapping). Applied in the
 * calculator as a multiplier on the raw (unmapped) exposure estimate.
 */
export const RAR_INTERDEPENDENCY_CORRECTION_PCT = { low: 9, high: 14 } as const;

/** IMF PortWatch, 2,065 ports, 27 tracked events. */
export const RAR_DURATION_BENCHMARKS_DAYS = { median: 6, p95: 22 } as const;

export interface RarReferencePoint {
  label: string;
  labelAr: string;
  detail: string;
  detailAr: string;
}

export const RAR_REFERENCE_POINTS: RarReferencePoint[] = [
  {
    label: 'Cisco — Q3 FY2022 Russia/Belarus exit + China lockdowns',
    labelAr: 'سيسكو — الربع الثالث من السنة المالية 2022، الخروج من روسيا/بيلاروسيا وإغلاقات الصين',
    detail: '1.6% of quarterly revenue',
    detailAr: '1.6% من إيرادات الربع',
  },
  {
    label: 'GM / Ford — 2021 chip shortage',
    labelAr: 'جنرال موتورز / فورد — نقص الرقائق 2021',
    detail: 'Guided EPS impact of $1–2.5B+',
    detailAr: 'أثر متوقع على ربحية السهم بقيمة 1-2.5 مليار دولار أو أكثر',
  },
  {
    label: 'Automotive industry-wide — 2021 chip shortage',
    labelAr: 'صناعة السيارات على مستوى القطاع — نقص الرقائق 2021',
    detail: 'Revised revenue-loss forecast $110B (up 81.5% from initial $60.6B forecast)',
    detailAr: 'تقدير خسارة إيرادات معدّل 110 مليار دولار (ارتفاعاً بنسبة 81.5% عن التقدير الأولي 60.6 مليار دولار)',
  },
];

export const RAR_WORKED_EXAMPLE = {
  source: 'Swiss Re Institute methodology paper',
  company: "Fictional coffee-capsule maker (Swiss Re's own illustrative example)",
  grossProfitUsdM: 100,
  exposureNaivePct: 42,
  exposureWithMappedInterdependenciesPct: 48,
  conclusion: 'The same real risk produces a materially different number depending only on how thoroughly the calculation is done — a property of the METHOD, not of an industry average.',
};
