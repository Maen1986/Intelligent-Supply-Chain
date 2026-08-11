/**
 * maturitySubSegData6to11.ts
 *
 * Sub-segment content for CORE_SEGMENTS indices 5–10 and INDUSTRY_MODULES:
 *   5 = ESG & Sustainability      6 = Digital Transformation
 *   7 = Demand Planning & S&OP   8 = Inventory Management
 *   9 = Logistics & Distribution  10 = Organisation & Talent
 *
 *   Modules: mfg_ops · fleet_ops · regulatory
 *
 * Answer key convention:
 *   Core segments:     "{segIdx}-{subIdx}-{questionIdx}"
 *   Industry modules:  "{moduleId}-{subIdx}-{questionIdx}"
 *
 * All Arabic is independently authored formal Gulf professional register (فصحى),
 * appropriate for C-level GCC executives. Not machine-translated.
 *
 * Industry IDs (from INTAKE_INDUSTRIES):
 *   manufacturing | fmcg | pharma | retail | logistics | marine |
 *   construction  | oil_gas | government | technology | banking | other
 * Weights: 0.5 = low relevance · 1.0 = baseline · 1.5 = high relevance
 * Missing keys default to 1.0 in the scoring engine.
 */

import type { SubSegmentData } from './maturitySubSegData1to5';

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 5 — ESG & SUSTAINABILITY  (segIdx 5)
   Sub-segments:
     0 Environmental Performance Baseline
     1 Emissions Measurement & Reporting
     2 Social & Labour Standards
     3 Responsible Sourcing (ISO 20400)
     4 Circular Economy & Waste Reduction
     5 ESG Governance & Disclosure
═══════════════════════════════════════════════════════════════════════════ */

export const ESG_SUB_SEGMENTS: SubSegmentData[] = [
  {
    id: 'esg-env-baseline',
    title: 'Environmental Performance Baseline',
    titleAr: 'خط الأساس للأداء البيئي',
    hint: 'Assesses whether a formal environmental data baseline — covering energy, water, waste, and air quality — has been established and is actively tracked.',
    hintAr: 'يقيس مدى إرساء خط أساس رسمي للبيانات البيئية — يشمل الطاقة والمياه والنفايات وجودة الهواء — ومتابعته بشكل فعّال.',
    benchmarks: { gcc: 2.1, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label: 'Environmental data baseline report',
      labelAr: 'تقرير خط الأساس للبيانات البيئية',
      hint: 'Upload your most recent environmental performance report showing energy, water, and waste baselines.',
      hintAr: 'ارفع أحدث تقرير أداء بيئي يُظهر خطوط الأساس للطاقة والمياه والنفايات.',
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'How comprehensively does procurement maintain a baseline understanding of its supply base\'s environmental footprint — energy, water, waste, and emissions intensity by category — as distinct from the buying organisation\'s own facility-level environmental data, which is a separate discipline?',
        qAr: 'ما مدى شمولية حفاظ المشتريات على فهم أساسي للبصمة البيئية لقاعدة الموردين — الطاقة والمياه والنفايات وكثافة الانبعاثات حسب الفئة — كأمر متمايز عن البيانات البيئية على مستوى مرافق المؤسسة الشارية نفسها، وهو تخصص منفصل؟',
        levels: [
          'Procurement has no visibility into supplier environmental performance at all; any environmental data the organisation holds relates only to its own facilities.',
          'Awareness exists that supplier environmental data matters, and ad hoc data has been gathered for a handful of suppliers following a specific request or incident, but there is no structured baseline covering categories systematically.',
          'A one-time baseline exercise has mapped environmental footprint indicators — energy, water, waste, emissions — for major spend categories, but it has never been refreshed and is treated as a point-in-time report rather than a maintained record.',
          'A category-level environmental baseline is maintained and updated on a defined cycle, covering most significant spend categories, though not yet consistently used to steer sourcing prioritisation.',
          'A category-by-category environmental performance baseline for the supply base is maintained, current, and used to identify which categories carry the greatest environmental exposure.',
        ],
        levelsAr: [
          'ليس لدى المشتريات أي رؤية للأداء البيئي للموردين على الإطلاق؛ وأي بيانات بيئية تمتلكها المؤسسة تخص مرافقها الخاصة فقط.',
          'هناك وعي بأهمية البيانات البيئية للموردين، وجُمعت بيانات مخصصة لعدد محدود من الموردين إثر طلب أو حادثة معينة، لكن لا يوجد خط أساس منظم يغطي الفئات بشكل منهجي.',
          'أُجري تمرين خط أساس لمرة واحدة رسم مؤشرات البصمة البيئية — الطاقة والمياه والنفايات والانبعاثات — لفئات الإنفاق الرئيسية، لكنه لم يُحدَّث أبدًا ويُعامَل كتقرير في لحظة زمنية محددة لا كسجل مُصان.',
          'خط أساس بيئي على مستوى الفئة يُصان ويُحدَّث وفق دورة محددة، ويغطي معظم فئات الإنفاق الجوهرية، لكنه لم يُستخدَم بعد باتساق لتوجيه أولويات التوريد.',
          'خط أساس للأداء البيئي حسب الفئة لقاعدة الموردين محفوظ وحديث ويُستخدَم لتحديد الفئات الأكثر تعرّضًا بيئيًا.',
        ],
      },
      {
        q: 'Does procurement use recognised environmental certification — ISO 14001 or an equivalent — as an explicit, weighted criterion in supplier qualification and sourcing decisions, rather than a certificate that\'s collected and filed but never actually factored into who wins the business?',
        qAr: 'هل تستخدم المشتريات شهادة بيئية معترفًا بها — ISO 14001 أو ما يعادلها — كمعيار صريح ومُرجَّح في تأهيل الموردين وقرارات التوريد، بدلاً من شهادة تُجمَع وتُحفَظ لكن لا تُؤخَذ فعليًا بالاعتبار في تحديد الفائز بالأعمال؟',
        levels: [
          'Environmental certification, where collected, is filed away and has no actual bearing on which supplier is selected or how they\'re scored.',
          'Certification status is recorded in the supplier database, but it is not scored or weighted in any sourcing decision — it exists as reference information only.',
          'Environmental certification is scored on the supplier evaluation scorecard, but the weighting is low enough, or applied inconsistently enough, that it rarely changes the sourcing outcome.',
          'Environmental certification carries a defined, meaningful weighting in supplier qualification and sourcing scoring, with minimum requirements set for a subset of higher-risk categories, though not yet applied across the full category set.',
          'Environmental certification status is a formally weighted, scored criterion in supplier qualification and sourcing evaluation, with defined minimum requirements for higher-risk categories.',
        ],
        levelsAr: [
          'الشهادة البيئية، حيث تُجمَع، تُحفَظ جانبًا وليس لها أي أثر فعلي على المورد الفائز أو كيفية تقييمه.',
          'حالة الشهادة تُسجَّل في قاعدة بيانات الموردين، لكنها لا تُسجَّل أو تُرجَّح في أي قرار توريد — وتوجد كمعلومة مرجعية فقط.',
          'الشهادة البيئية تُسجَّل في بطاقة تقييم الموردين، لكن الترجيح منخفض بما يكفي، أو يُطبَّق بتفاوت كافٍ، بحيث نادرًا ما يُغيّر نتيجة التوريد.',
          'الشهادة البيئية تحمل ترجيحًا محددًا وذا معنى في تأهيل الموردين وتسجيل التوريد، بمتطلبات دنيا مُحددة لمجموعة فرعية من الفئات الأعلى مخاطرة، لكن دون تطبيقها بعد على كامل مجموعة الفئات.',
          'حالة الشهادة البيئية معيار مُرجَّح ومُسجَّل رسميًا في تأهيل الموردين وتقييم التوريد، بمتطلبات دنيا محددة للفئات الأعلى مخاطرة.',
        ],
      },
      {
        q: 'How systematically does procurement collect environmental performance data directly from suppliers — via a standard questionnaire, scorecard, or a platform such as EcoVadis — as an ongoing part of supplier management, rather than a one-off exercise done once and never repeated?',
        qAr: 'ما مدى منهجية جمع المشتريات لبيانات الأداء البيئي مباشرةً من الموردين — عبر استبيان موحَّد أو بطاقة تقييم أو منصة مثل EcoVadis — كجزء مستمر من إدارة الموردين، بدلاً من ممارسة تُجرى لمرة واحدة ولا تتكرر؟',
        levels: [
          'Supplier environmental data, if collected at all, was gathered once during onboarding and has never been refreshed.',
          'Environmental data collection happens occasionally, prompted by a specific renewal or audit trigger for an individual supplier, but there is no standard questionnaire or defined recurring cycle applied across the supply base.',
          'A standard environmental questionnaire exists and is sent to strategic suppliers, but response rates are inconsistent and there is no enforced cycle ensuring the data is actually refreshed.',
          'A standard questionnaire or scorecard is applied on a defined cycle to most strategic suppliers, with data feeding supplier files, though coverage of non-strategic categories remains thin.',
          'Environmental performance data is collected from suppliers on a defined recurring cycle through a standard questionnaire or third-party platform, integrated into ongoing supplier management.',
        ],
        levelsAr: [
          'بيانات الأداء البيئي للموردين، إن جُمعت أصلاً، جُمعت مرة واحدة أثناء الضمّ ولم تُحدَّث أبدًا.',
          'جمع البيانات البيئية يحدث أحيانًا، بدافع تجديد أو تدقيق محدد لمورد فردي، لكن لا يوجد استبيان معياري أو دورة متكررة محددة تُطبَّق عبر قاعدة الموردين.',
          'يوجد استبيان بيئي معياري يُرسَل للموردين الاستراتيجيين، لكن معدلات الاستجابة متفاوتة ولا توجد دورة مُلزَمة تضمن تحديث البيانات فعليًا.',
          'استبيان أو بطاقة أداء معيارية تُطبَّق وفق دورة محددة على معظم الموردين الاستراتيجيين، وتُغذّي ملفات الموردين، لكن تغطية الفئات غير الاستراتيجية تبقى ضعيفة.',
          'بيانات الأداء البيئي تُجمَع من الموردين وفق دورة متكررة محددة عبر استبيان معياري أو منصة خارجية، مدمجة في إدارة الموردين المستمرة.',
        ],
      },
      {
        q: 'Are supplier environmental performance targets set and tracked as a live component of supplier scorecards — or does environmental ambition exist only as an internal aspirational statement with no supplier-facing target attached to it?',
        qAr: 'هل تُحدَّد وتُتابَع أهداف الأداء البيئي للموردين كعنصر حي في بطاقات تقييم الموردين — أم أن الطموح البيئي موجود فقط كبيان طموح داخلي دون هدف موجَّه للموردين مرتبط به؟',
        levels: [
          'Environmental ambition is stated internally but never translated into a specific, tracked target for any individual supplier.',
          'Environmental ambitions are occasionally mentioned to suppliers in conversation or correspondence, but no supplier has a documented, specific target attached to their relationship.',
          'Environmental targets have been set for a small number of pilot or highest-visibility suppliers, but they are not yet a standard element of the broader scorecard framework.',
          'Environmental improvement targets are set for suppliers across most relevant categories and appear on scorecards, though review of progress happens inconsistently rather than at every formal supplier review.',
          'Defined environmental improvement targets are set for suppliers in relevant categories, tracked on the same scorecard cadence as quality and delivery, with progress reviewed at formal supplier reviews.',
        ],
        levelsAr: [
          'الطموح البيئي مُعلَن داخليًا لكن لا يُترجَم أبدًا لمستهدف محدد مرتبط بأي مورد فردي.',
          'الطموحات البيئية تُذكَر أحيانًا للموردين في محادثة أو مراسلة، لكن لا يمتلك أي مورد مستهدفًا موثّقًا ومحددًا مرتبطًا بعلاقته.',
          'وُضعت مستهدفات بيئية لعدد صغير من الموردين التجريبيين أو الأعلى بروزًا، لكنها ليست بعد عنصرًا معياريًا في إطار بطاقة الأداء الأوسع.',
          'مستهدفات تحسين بيئي تُوضَع للموردين عبر معظم الفئات ذات الصلة وتظهر في بطاقات الأداء، لكن مراجعة التقدم تحدث بتفاوت لا في كل مراجعة موردين رسمية.',
          'مستهدفات تحسين بيئي محددة تُوضَع للموردين في الفئات ذات الصلة، وتُتابَع بنفس وتيرة بطاقة أداء الجودة والتسليم، والتقدم يُراجَع في مراجعات الموردين الرسمية.',
        ],
      },
      {
        q: 'When a category manager needs current environmental performance data for a specific supplier ahead of a sourcing or renewal decision, is it actually retrievable in minutes from an existing record — or does it require a fresh, one-off data-collection exercise every time?',
        qAr: 'عندما يحتاج مدير فئة بيانات أداء بيئي حالية لمورد محدد قبل قرار توريد أو تجديد، هل يمكن استرجاعها فعليًا خلال دقائق من سجل قائم — أم تستلزم ممارسة جمع بيانات جديدة في كل مرة؟',
        levels: [
          'Getting current environmental data for a specific supplier requires starting a fresh data request each time it\'s needed, because nothing is kept centrally current.',
          'Some environmental data is kept on file, but locating the most current version for a specific supplier typically requires checking with the category manager who last handled that relationship.',
          'A central record exists and holds environmental data for most strategic suppliers, but retrieval still takes hours or days because the record is not organised for quick lookup or is not consistently updated.',
          'Environmental data for most suppliers is retrievable within a day from a central record, with only lower-tier or newly onboarded suppliers requiring a fresh request.',
          'Current environmental performance data for any supplier is retrievable within minutes from a maintained, centrally accessible record.',
        ],
        levelsAr: [
          'الحصول على بيانات بيئية حديثة لمورد محدد يستلزم بدء طلب بيانات جديد في كل مرة، لأن لا شيء يُبقَى حديثًا مركزيًا.',
          'بعض البيانات البيئية محفوظة في ملفات، لكن تحديد أحدث نسخة لمورد معين يستلزم عادةً مراجعة مدير الفئة الذي تولى تلك العلاقة أخيرًا.',
          'يوجد سجل مركزي يحتفظ بالبيانات البيئية لمعظم الموردين الاستراتيجيين، لكن الاسترجاع لا يزال يستغرق ساعات أو أيامًا لأن السجل غير منظَّم للبحث السريع أو غير مُحدَّث باستمرار.',
          'البيانات البيئية لمعظم الموردين يمكن استرجاعها خلال يوم واحد من سجل مركزي، مع اقتصار الحاجة لطلب جديد على الموردين من الفئة الأدنى أو المنضمين حديثًا.',
          'بيانات الأداء البيئي الحديثة لأي مورد يمكن استرجاعها خلال دقائق من سجل مُصان ومتاح مركزيًا.',
        ],
      },
      {
        q: 'How quickly is a supplier\'s environmental non-conformance — a failed audit, a lapsed certification, a breach of an environmental commitment — actually flagged to the category manager who owns that relationship, rather than sitting unnoticed in a compliance file?',
        qAr: 'ما مدى سرعة الإبلاغ الفعلي عن عدم مطابقة بيئية لمورد — فشل تدقيق أو شهادة منتهية أو خرق التزام بيئي — لمدير الفئة المالك لتلك العلاقة، بدلاً من أن تبقى دون ملاحظة في ملف امتثال؟',
        levels: [
          'A supplier environmental non-conformance can sit in a compliance file with no defined process to notify the relevant category manager.',
          'Non-conformances are occasionally mentioned to the relevant category manager informally, if the compliance team happens to think of it, but there is no defined notification process or expected timeframe.',
          'A defined process requires the compliance team to notify the category manager of non-conformances, but notification happens in periodic batch reviews (e.g. monthly) rather than immediately upon discovery.',
          'Non-conformances are flagged to the category manager within a few working days through a semi-structured process, though the response required from the category manager is not always clearly defined.',
          'Environmental non-conformances trigger an automatic, immediate notification to the responsible category manager, with a defined required response.',
        ],
        levelsAr: [
          'عدم امتثال بيئي لمورد يمكن أن يبقى في ملف امتثال دون عملية محددة لإخطار مدير الفئة المعني.',
          'حالات عدم الامتثال تُذكَر أحيانًا لمدير الفئة المعني بشكل غير رسمي، إذا فكّر فريق الامتثال بذلك، لكن لا توجد عملية إخطار محددة أو إطار زمني متوقع.',
          'عملية محددة تُلزِم فريق الامتثال بإخطار مدير الفئة بحالات عدم الامتثال، لكن الإخطار يحدث في مراجعات دورية مجمّعة (شهريًا مثلاً) لا فور الاكتشاف.',
          'حالات عدم الامتثال تُبلَّغ لمدير الفئة خلال أيام عمل قليلة عبر عملية شبه منظمة، لكن الاستجابة المطلوبة من مدير الفئة ليست محددة بوضوح دائمًا.',
          'حالات عدم الامتثال البيئي تُطلق إخطارًا فوريًا آليًا لمدير الفئة المسؤول، باستجابة مطلوبة محددة.',
        ],
      },
      {
        q: 'Is supplier-reported environmental data independently verified — through third-party certification or audit — rather than self-reported figures being entered into the scorecard without any check?',
        qAr: 'هل تُتحقَّق البيانات البيئية المُبلَّغ عنها من الموردين بشكل مستقل — عبر شهادة أو تدقيق من طرف ثالث — بدلاً من إدخال الأرقام المُبلَّغ عنها ذاتيًا في بطاقة التقييم دون أي فحص؟',
        levels: [
          'Supplier environmental data is taken at face value from self-reported questionnaires, with no independent verification.',
          'Self-reported data is occasionally cross-checked informally against public information, such as a certification registry, when something looks questionable, but there is no defined verification requirement.',
          'A verification requirement exists on paper for high-risk suppliers, but in practice it is applied inconsistently and self-reported figures are often accepted without the required check being completed.',
          'Independent verification is consistently applied to suppliers above the defined risk threshold, though the verification method varies — a documentation review rather than always a full third-party audit — and coverage of newly onboarded suppliers can lag.',
          'Supplier environmental data above a defined risk threshold requires independent third-party verification (certification body audit or equivalent) before being relied upon.',
        ],
        levelsAr: [
          'بيانات الموردين البيئية تُؤخَذ كما هي من استبيانات ذاتية التقرير، دون تحقق مستقل.',
          'البيانات ذاتية التقرير تُقارَن أحيانًا بشكل غير رسمي بمعلومات عامة (كسجل شهادات مثلاً) عندما يبدو شيء مثيرًا للشك، لكن لا يوجد متطلب تحقق محدد.',
          'يوجد متطلب تحقق على الورق للموردين الأعلى مخاطرة، لكنه يُطبَّق عمليًا بتفاوت، وغالبًا ما تُقبَل الأرقام ذاتية التقرير دون إتمام الفحص المطلوب.',
          'التحقق المستقل يُطبَّق باتساق على الموردين فوق عتبة المخاطر المحددة، لكن أسلوب التحقق يتفاوت (مراجعة وثائق بدلاً من تدقيق كامل من طرف ثالث دائمًا) وقد تتأخر التغطية للموردين المنضمين حديثًا.',
          'بيانات الموردين البيئية فوق عتبة مخاطر محددة تستلزم تحققًا مستقلاً من طرف ثالث (تدقيق جهة اعتماد أو ما يعادله) قبل الاعتماد عليها.',
        ],
      },
      {
        q: 'Is supplier environmental data collected and maintained through an automated platform — such as EcoVadis or an equivalent sustainability data tool — versus manually chased and compiled category-by-category in spreadsheets?',
        qAr: 'هل تُجمَع وتُصان البيانات البيئية للموردين عبر منصة آلية — مثل EcoVadis أو أداة بيانات استدامة معادلة — مقابل ملاحقتها وتجميعها يدويًا فئة بفئة في جداول بيانات؟',
        levels: [
          'Supplier environmental data is manually chased and compiled in spreadsheets, category by category, with no shared platform.',
          'A shared spreadsheet or basic database consolidates what was previously scattered individual files, but data entry and refresh remain fully manual.',
          'A third-party sustainability data platform has been procured and onboarded for a subset of strategic suppliers, but it runs alongside — not integrated with — the core sourcing system, and most categories are still tracked manually.',
          'A third-party platform covers most of the strategic supply base with periodic automated refresh, with integration into the sourcing system partially built but not yet complete for all categories.',
          'An automated third-party sustainability data platform maintains and refreshes supplier environmental profiles, integrated with the sourcing system.',
        ],
        levelsAr: [
          'بيانات الموردين البيئية تُلاحَق وتُجمَّع يدويًا في جداول بيانات فئة تلو أخرى، دون منصة مشتركة.',
          'جدول بيانات مشترك أو قاعدة بيانات أساسية توحّد ما كان مبعثرًا سابقًا في ملفات فردية، لكن إدخال البيانات وتحديثها يبقيان يدويين بالكامل.',
          'مُنصة بيانات استدامة من طرف ثالث تم اقتناؤها وتفعيلها لمجموعة فرعية من الموردين الاستراتيجيين، لكنها تعمل بالتوازي مع نظام التوريد الأساسي لا مدمجة معه، ولا تزال معظم الفئات تُتابَع يدويًا.',
          'منصة من طرف ثالث تغطي معظم قاعدة الموردين الاستراتيجيين بتحديث آلي دوري، مع تكامل جزئي مع نظام التوريد لم يكتمل بعد لكل الفئات.',
          'منصة بيانات استدامة آلية من طرف ثالث تُصان وتُحدّث ملفات الموردين البيئية، مدمجة مع نظام التوريد.',
        ],
      },
      {
        q: 'Does policy make environmental certification or a minimum environmental performance standard a non-negotiable qualification gate for regulated or high-environmental-impact categories — rather than a scored-but-optional preference that a determined category manager can simply override?',
        qAr: 'هل تجعل السياسة الشهادة البيئية أو معيار أداء بيئي أدنى بوابة تأهيل غير قابلة للتفاوض للفئات المنظَّمة أو عالية الأثر البيئي — بدلاً من تفضيل مُسجَّل لكن اختياري يمكن لمدير فئة مُصمِّم تجاوزه ببساطة؟',
        levels: [
          'Environmental performance is a scored preference that carries some weight but can be overridden by a category manager who prioritises price or lead time instead.',
          'Environmental performance is scored, and category managers are discouraged from overriding it, but no formal policy actually prevents an override — it relies entirely on individual judgement.',
          'A policy exists identifying certain categories as environmentally sensitive, but the qualification requirement attached to them is a strong recommendation rather than a hard, enforced gate.',
          'A hard qualification gate is enforced for a defined set of the highest-impact or regulated categories, though the list of covered categories is narrower than the full population that would arguably warrant it.',
          'For defined high-impact or regulated categories, environmental certification is a hard qualification gate — a supplier without it cannot be approved regardless of price, with no informal override path.',
        ],
        levelsAr: [
          'الأداء البيئي معيار مُسجَّل ذو وزن ما لكن يمكن لمدير فئة مُصمّم تجاوزه لصالح السعر أو المهلة الزمنية.',
          'الأداء البيئي يُسجَّل، ويُثنى مديرو الفئات عن تجاوزه، لكن لا توجد سياسة رسمية تمنع التجاوز فعليًا — ويعتمد الأمر كليًا على التقدير الفردي.',
          'توجد سياسة تُحدّد فئات معينة كحساسة بيئيًا، لكن متطلب التأهيل المرتبط بها توصية قوية لا بوابة صارمة ومُنفَّذة.',
          'بوابة تأهيل صارمة تُنفَّذ لمجموعة محددة من الفئات الأعلى أثرًا أو المنظَّمة، لكن قائمة الفئات المشمولة أضيق من مجمل الفئات التي قد تستحقها فعليًا.',
          'للفئات عالية الأثر البيئي أو المنظَّمة المحددة، الشهادة البيئية بوابة تأهيل صارمة — لا يمكن اعتماد مورد دونها بصرف النظر عن السعر، دون مسار تجاوز غير رسمي.',
        ],
      },
      {
        q: 'Does a supplier\'s environmental non-compliance — a lost permit, a regulatory shutdown, an environmental incident — trigger a formal supply-continuity risk review, recognising that environmental failure can be a genuine operational disruption risk, not just a reputational one?',
        qAr: 'هل يُطلق عدم امتثال بيئي لمورد — فقدان ترخيص أو إغلاق تنظيمي أو حادثة بيئية — مراجعة مخاطر استمرارية إمداد رسمية، إقرارًا بأن الإخفاق البيئي يمكن أن يكون مخاطرة اضطراب تشغيلي حقيقية، لا مجرد مخاطرة سمعة؟',
        levels: [
          'A supplier\'s environmental non-compliance is treated purely as a sustainability-reporting concern; its potential to actually disrupt supply (e.g. via a regulatory shutdown) is not connected to continuity planning.',
          'There is informal recognition among some category managers that an environmental shutdown could disrupt supply, but this connection is not reflected in any formal risk process.',
          'A formal continuity risk review is triggered for environmental non-compliance events, but only for the organisation\'s most critical or single-source suppliers, not as a standard rule.',
          'A continuity risk review is triggered for most environmental non-compliance events across significant suppliers, though the trigger relies on the compliance team remembering to notify risk/continuity functions rather than an automatic system link.',
          'A supplier environmental non-compliance event automatically triggers a supply-continuity risk review, recognising the direct link between environmental failure and operational disruption.',
        ],
        levelsAr: [
          'عدم الامتثال البيئي لمورد يُعامَل كمجرد شأن يخص تقارير الاستدامة؛ وإمكانية أن يُعطّل الإمداد فعليًا (كإغلاق تنظيمي مثلاً) غير مرتبطة بتخطيط الاستمرارية.',
          'هناك إدراك غير رسمي لدى بعض مديري الفئات بأن إغلاقًا بيئيًا يمكن أن يُعطّل الإمداد، لكن هذا الرابط لا ينعكس في أي عملية مخاطر رسمية.',
          'مراجعة مخاطر استمرارية رسمية تُطلق لأحداث عدم الامتثال البيئي، لكن فقط للموردين الأكثر أهمية أو ذوي المصدر الوحيد لدى المؤسسة، لا كقاعدة معيارية.',
          'مراجعة مخاطر استمرارية تُطلق لمعظم أحداث عدم الامتثال البيئي عبر الموردين الجوهريين، لكن الإطلاق يعتمد على تذكّر فريق الامتثال إخطار وظائف المخاطر/الاستمرارية لا رابطًا آليًا بالنظام.',
          'حدث عدم امتثال بيئي لمورد يُطلق آليًا مراجعة مخاطر استمرارية الإمداد، إقرارًا بالرابط المباشر بين الإخفاق البيئي والاضطراب التشغيلي.',
        ],
      },
    ],
  },
  {
    id: 'esg-emissions',
    title: 'Emissions Measurement & Reporting',
    titleAr: 'قياس الانبعاثات والتقارير',
    hint: 'Evaluates the rigour of Scope 1, 2, and 3 emissions measurement, GHG inventory management, and external disclosure quality.',
    hintAr: 'يقيّم صرامة قياس انبعاثات النطاقات 1 و2 و3 وإدارة جرد الغازات الدفيئة وجودة الإفصاح الخارجي.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'GHG inventory / emissions report',
      labelAr: 'جرد غازات الدفيئة / تقرير الانبعاثات',
      hint:    'Upload your most recent Scope 1 & 2 GHG inventory or sustainability report showing emissions data.',
      hintAr:  'ارفع أحدث جرد غازات الدفيئة (النطاقين 1 و2) أو تقرير الاستدامة الذي يُظهر بيانات الانبعاثات.',
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'Does procurement explicitly factor supplier or category carbon intensity into sourcing decisions — as a scored criterion, a shadow carbon price, or a genuine tie-breaker — or does carbon remain a topic that lives entirely in the sustainability team\'s reporting, disconnected from what actually gets purchased and from whom?',
        qAr: 'هل تُدرِج المشتريات صراحةً كثافة كربون المورد أو الفئة في قرارات التوريد — كمعيار مُسجَّل أو سعر كربون افتراضي أو عامل ترجيح حقيقي — أم يبقى الكربون موضوعًا يعيش بالكامل في تقارير فريق الاستدامة، منفصلاً عمّا يُشترى فعليًا وممّن؟',
        levels: [
          'Carbon intensity has no bearing whatsoever on sourcing decisions; it is tracked, if at all, purely for reporting purposes after the sourcing decision has already been made.',
          'Carbon intensity data is reviewed informally alongside a sourcing decision on occasion, but it has no formal scoring mechanism and has never actually altered which supplier was awarded the business.',
          'A carbon scoring methodology has been designed and piloted on a small number of sourcing events, but it is not yet a standard, mandatory input applied consistently across categories.',
          'A defined carbon scoring methodology is applied to sourcing decisions in most higher-carbon categories, and has influenced supplier selection in specific documented cases, though it is not yet universal across all spend.',
          'Supplier/category carbon intensity is a formally scored input into sourcing decisions, with a defined methodology (e.g. shadow carbon price) that can genuinely change which supplier wins.',
        ],
        levelsAr: [
          'كثافة الكربون ليس لها أي أثر على قرارات التوريد؛ وتُتابَع، إن حدث ذلك، لأغراض التقرير فقط بعد اتخاذ قرار التوريد بالفعل.',
          'بيانات كثافة الكربون تُراجَع أحيانًا بشكل غير رسمي بالتوازي مع قرار توريد، لكن دون آلية تسجيل رسمية، ولم تُغيّر فعليًا حتى الآن المورد الذي رسا عليه العمل.',
          'صُممت منهجية تسجيل كربوني وجُرِّبت على عدد صغير من أحداث التوريد، لكنها ليست بعد مُدخَلاً معياريًا وإلزاميًا يُطبَّق باتساق عبر الفئات.',
          'منهجية تسجيل كربوني محددة تُطبَّق على قرارات التوريد في معظم الفئات الأعلى كربونًا، وأثّرت في اختيار الموردين في حالات موثّقة محددة، لكنها ليست بعد شاملة لكل الإنفاق.',
          'كثافة كربون المورد/الفئة مُدخَل مُسجَّل رسميًا في قرارات التوريد، بمنهجية محددة (كسعر كربون افتراضي مثلاً) يمكن أن تُغيّر فعليًا المورد الفائز.',
        ],
      },
      {
        q: 'How mature is your approach to measuring and managing Scope 3 emissions across your supply chain — from purchased goods and services to customer-use phase emissions?',
        qAr: 'ما مدى نضج نهجكم في قياس وإدارة انبعاثات النطاق الثالث عبر سلسلة الإمداد — من البضائع والخدمات المشتراة إلى انبعاثات مرحلة الاستخدام لدى العملاء؟',
        levels: [
          'Scope 3 emissions are not considered. There is no awareness of material Scope 3 sources within the supply chain.',
          'Key Scope 3 categories have been identified informally (e.g., business travel, purchased goods) but no calculation has been completed and no supplier engagement exists.',
          'A Scope 3 screening has been completed; the most material categories are estimated using spend-based or activity-based methods; findings are disclosed in sustainability reporting.',
          'Scope 3 material categories are quantified annually using supplier-specific data where available; reduction targets are set for key categories; supplier questionnaires collect primary emission data.',
          'A comprehensive Scope 3 inventory is maintained with primary data from strategic suppliers; near-term and long-term Scope 3 reduction targets are aligned to a 1.5°C pathway; externally assured and CDP-disclosed.',
        ],
        levelsAr: [
          'انبعاثات النطاق الثالث غير مأخوذة بالاعتبار. لا وعي بمصادر النطاق الثالث الجوهرية داخل سلسلة الإمداد.',
          'فئات النطاق الثالث الرئيسية مُحددة بشكل غير رسمي (كالسفر التجاري والبضائع المشتراة) لكن لا حساب مُكتمل ولا تفاعل مع الموردين.',
          'مسح للنطاق الثالث مكتمل؛ والفئات الأكثر جوهرية مُقدَّرة باستخدام أساليب قائمة على الإنفاق أو النشاط؛ والنتائج مُفصَح عنها في تقارير الاستدامة.',
          'فئات النطاق الثالث الجوهرية تُقاس سنويًا باستخدام بيانات خاصة بالموردين حيثما تتوفر؛ ومستهدفات الخفض مُحددة للفئات الرئيسية؛ واستبيانات الموردين تجمع بيانات الانبعاثات الأولية.',
          'جرد شامل للنطاق الثالث محفوظ ببيانات أولية من الموردين الاستراتيجيين؛ ومستهدفات خفض النطاق الثالث قصيرة وطويلة المدى مواءَمة مع مسار 1.5 درجة مئوية؛ مضمونة خارجيًا ومُفصَح عنها في CDP.',
        ],
      },
      {
        q: 'How systematically does procurement collect primary, supplier-specific emissions data from strategic suppliers to feed the organisation\'s Scope 3 inventory — rather than the inventory relying entirely on generic spend-based estimation that tells you nothing about any individual supplier\'s actual performance?',
        qAr: 'ما مدى منهجية جمع المشتريات لبيانات انبعاثات أولية وخاصة بالموردين من الموردين الاستراتيجيين لتغذية جرد النطاق الثالث للمؤسسة — بدلاً من اعتماد الجرد كليًا على تقدير عام قائم على الإنفاق لا يكشف شيئًا عن أداء أي مورد فردي فعليًا؟',
        levels: [
          'Scope 3 figures are entirely spend-based estimates using industry-average emission factors; no primary data has ever been requested from any individual supplier.',
          'Primary emissions data has been requested from a handful of the largest suppliers on an ad hoc basis, but the vast majority of the Scope 3 inventory still relies on spend-based estimation.',
          'A defined process exists to request primary emissions data from strategic suppliers, but response rates are low enough that spend-based estimates still dominate the inventory for most categories.',
          'Primary emissions data is collected from most strategic suppliers on a defined cycle and is replacing spend-based estimates for the highest-emitting categories, though coverage of the broader supply base remains estimate-based.',
          'Primary emissions data is systematically requested and collected from all strategic suppliers on a defined cycle, replacing spend-based estimates with actual supplier-reported figures wherever available.',
        ],
        levelsAr: [
          'أرقام النطاق الثالث تقديرات قائمة على الإنفاق بالكامل باستخدام عوامل انبعاث متوسطة للقطاع؛ ولم تُطلَب بيانات أولية من أي مورد فردي أبدًا.',
          'بيانات انبعاثات أولية طُلبت من عدد محدود من كبار الموردين بشكل مخصص، لكن الغالبية العظمى من جرد النطاق الثالث لا تزال تعتمد على التقدير القائم على الإنفاق.',
          'توجد عملية محددة لطلب بيانات انبعاثات أولية من الموردين الاستراتيجيين، لكن معدلات الاستجابة منخفضة بما يكفي بحيث تظل التقديرات القائمة على الإنفاق مهيمنة على الجرد لمعظم الفئات.',
          'بيانات انبعاثات أولية تُجمَع من معظم الموردين الاستراتيجيين وفق دورة محددة وتحل محل التقديرات القائمة على الإنفاق للفئات الأعلى انبعاثًا، لكن تغطية قاعدة الموردين الأوسع تبقى قائمة على التقدير.',
          'بيانات الانبعاثات الأولية تُطلَب وتُجمَع منهجيًا من جميع الموردين الاستراتيجيين وفق دورة محددة، لتحل محل التقديرات القائمة على الإنفاق بأرقام فعلية مُبلَّغ عنها من الموردين حيثما توفرت.',
        ],
      },
      {
        q: 'Are supplier-specific emissions reduction commitments captured in contracts or supplier scorecards, with progress tracked over time — or are supplier "net zero" claims collected once during sourcing and never actually followed up on?',
        qAr: 'هل تُدرَج التزامات خفض الانبعاثات الخاصة بالموردين في العقود أو بطاقات تقييم الموردين، مع متابعة التقدم عبر الوقت — أم تُجمَع ادعاءات "الحياد الكربوني" للموردين مرة واحدة أثناء التوريد ولا تُتابَع فعليًا أبدًا؟',
        levels: [
          'Supplier emissions or net-zero claims are collected once during a sourcing event, filed, and never checked again.',
          'Supplier net-zero or reduction claims are noted in the contract file as background information, but no specific, measurable commitment or timeline is actually attached to them.',
          'Specific emissions reduction commitments are written into contracts for a small number of the highest-profile suppliers, but progress tracking is irregular and not yet part of the standard scorecard process.',
          'Emissions reduction commitments are written into contracts or scorecards for most suppliers in relevant categories, with progress tracked at most, though not yet all, formal performance reviews.',
          'Specific, measurable emissions reduction commitments are written into supplier contracts or scorecards where relevant, with progress formally tracked at every performance review.',
        ],
        levelsAr: [
          'ادعاءات الحياد الكربوني للموردين أو الانبعاثات تُجمَع مرة واحدة أثناء التوريد، وتُحفَظ، ولا تُفحَص مجددًا أبدًا.',
          'ادعاءات الحياد الكربوني أو خفض الانبعاثات للموردين تُدوَّن في ملف العقد كمعلومة خلفية، لكن لا يُرفَق بها أي التزام محدد وقابل للقياس أو جدول زمني فعليًا.',
          'التزامات خفض انبعاثات محددة مكتوبة في عقود عدد صغير من الموردين الأبرز، لكن متابعة التقدم غير منتظمة وليست بعد جزءًا من عملية بطاقة الأداء المعيارية.',
          'التزامات خفض انبعاثات مكتوبة في العقود أو بطاقات الأداء لمعظم الموردين في الفئات ذات الصلة، والتقدم يُتابَع في معظم مراجعات الأداء الرسمية، وإن لم يكن جميعها بعد.',
          'التزامات خفض انبعاثات محددة وقابلة للقياس مكتوبة في عقود الموردين أو بطاقات أدائهم حيثما ينطبق، والتقدم يُتابَع رسميًا في كل مراجعة أداء.',
        ],
      },
      {
        q: 'When a new sourcing event is run, is carbon/emissions data actually requested and captured as a standard part of the RFx process — or is it absent from the standard bid template, meaning it only gets considered if someone happens to think to ask?',
        qAr: 'عندما يُجرى حدث توريد جديد، هل تُطلَب وتُلتقَط بيانات الكربون/الانبعاثات فعليًا كجزء موحَّد من عملية طلب العروض — أم تغيب عن نموذج العطاء الموحَّد، بحيث لا تُؤخَذ بالاعتبار إلا إذا فكّر أحدهم صدفةً بطلبها؟',
        levels: [
          'Carbon data has no place in the standard RFx template; it only gets requested if an individual category manager happens to think of it.',
          'A small number of category managers have started adding carbon-related questions to their own RFx documents on their own initiative, but there is no shared or standardised request.',
          'A standard carbon data request has been drafted and made available for use, but including it in a given RFx is still optional and left to the discretion of the category manager running the event.',
          'The standard carbon/emissions data request is included by default in RFx templates for most relevant categories, with removal requiring an explicit decision rather than the reverse.',
          'Every RFx template for relevant categories includes a standard, mandatory carbon/emissions data request, applied consistently regardless of who is running the sourcing event.',
        ],
        levelsAr: [
          'بيانات الكربون ليس لها مكان في قالب RFx المعياري؛ وتُطلَب فقط إذا فكّر مدير فئة فردي بذلك مصادفةً.',
          'عدد صغير من مديري الفئات بدأوا بإضافة أسئلة متعلقة بالكربون إلى وثائق RFx الخاصة بهم بمبادرة شخصية، لكن لا يوجد طلب مشترك أو موحّد.',
          'طلب بيانات كربون معياري صيغ وأُتيح للاستخدام، لكن إدراجه في وثيقة RFx معينة لا يزال اختياريًا ومتروكًا لتقدير مدير الفئة الذي يُدير الحدث.',
          'طلب بيانات الكربون/الانبعاثات المعياري يُدرَج افتراضيًا في قوالب RFx لمعظم الفئات ذات الصلة، وحذفه يستلزم قرارًا صريحًا بدلاً من العكس.',
          'كل قالب RFx للفئات ذات الصلة يتضمن طلب بيانات كربون/انبعاثات معياريًا وإلزاميًا، يُطبَّق باتساق بصرف النظر عمّن يُدير حدث التوريد.',
        ],
      },
      {
        q: 'How completely and quickly can procurement produce supplier-level emissions data, by category, on request — for the Scope 3 inventory, a customer ESG questionnaire, or a regulator — versus a scramble to reconstruct it from scattered sources?',
        qAr: 'ما مدى اكتمال وسرعة قدرة المشتريات على إنتاج بيانات انبعاثات على مستوى المورد حسب الفئة عند الطلب — لجرد النطاق الثالث أو استبيان ESG لعميل أو جهة تنظيمية — مقابل بحث محموم لإعادة تجميعها من مصادر مبعثرة؟',
        levels: [
          'Producing supplier-level emissions data on request means a time-consuming scramble across scattered sourcing documents and emails, with no guarantee of completeness.',
          'Some supplier emissions data is consolidated in a shared file, which shortens the scramble for the largest suppliers, but most categories still require reconstruction from scattered sources.',
          'A central record covers most strategic suppliers\' emissions data, but producing a complete category-level view still takes a day or more due to gaps and reconciliation work.',
          'Supplier-level emissions data by category can be produced within a day for most categories from a maintained record, with only edge cases requiring manual follow-up.',
          'Supplier-level emissions data by category can be produced complete and current within hours from a single maintained record.',
        ],
        levelsAr: [
          'إنتاج بيانات انبعاثات على مستوى المورد عند الطلب يعني بحثًا مستهلكًا للوقت عبر وثائق توريد ورسائل مبعثرة، دون ضمان الاكتمال.',
          'بعض بيانات انبعاثات الموردين موحّدة في ملف مشترك، مما يُقلّص البحث المحموم لكبار الموردين، لكن معظم الفئات لا تزال تستلزم إعادة تجميعها من مصادر مبعثرة.',
          'سجل مركزي يغطي بيانات انبعاثات معظم الموردين الاستراتيجيين، لكن إنتاج رؤية كاملة على مستوى الفئة لا يزال يستغرق يومًا أو أكثر بسبب الفجوات وأعمال المطابقة.',
          'بيانات انبعاثات على مستوى المورد حسب الفئة يمكن إنتاجها خلال يوم لمعظم الفئات من سجل مُصان، مع حاجة الحالات الاستثنائية فقط لمتابعة يدوية.',
          'بيانات انبعاثات على مستوى المورد حسب الفئة يمكن إنتاجها كاملة وحديثة خلال ساعات من سجل واحد مُصان.',
        ],
      },
      {
        q: 'Is supplier-submitted emissions data independently verified or spot-checked — rather than every supplier claim being taken at face value and fed directly into the organisation\'s own Scope 3 disclosure?',
        qAr: 'هل تُتحقَّق بيانات الانبعاثات المُقدَّمة من الموردين بشكل مستقل أو تُفحَص عشوائيًا — بدلاً من قبول كل ادعاء مورد كما هو وتغذيته مباشرةً في إفصاح النطاق الثالث الخاص بالمؤسسة؟',
        levels: [
          'Supplier emissions figures are taken at face value with no independent verification before being used in the organisation\'s own disclosures.',
          'Supplier emissions figures are occasionally sanity-checked against industry benchmarks when a number looks implausible, but there is no defined verification process.',
          'A spot-check process exists for supplier emissions data, but it is applied inconsistently and covers only a small sample of the suppliers whose data feeds Scope 3 reporting.',
          'Supplier emissions data above a defined materiality threshold is spot-checked or reviewed before use, though full independent verification is not yet applied to every material supplier.',
          'Supplier emissions data above a defined materiality threshold is independently verified or spot-checked before being incorporated into Scope 3 reporting.',
        ],
        levelsAr: [
          'أرقام انبعاثات الموردين تُؤخَذ كما هي دون تحقق مستقل قبل استخدامها في إفصاحات المؤسسة الخاصة.',
          'أرقام انبعاثات الموردين تُفحَص منطقيًا أحيانًا مقابل معايير القطاع عندما يبدو رقم غير معقول، لكن لا توجد عملية تحقق محددة.',
          'عملية فحص عشوائي موجودة لبيانات انبعاثات الموردين، لكنها تُطبَّق بتفاوت وتغطي فقط عينة صغيرة من الموردين الذين تُغذّي بياناتهم تقرير النطاق الثالث.',
          'بيانات انبعاثات الموردين فوق عتبة جوهرية محددة تُفحَص عشوائيًا أو تُراجَع قبل الاستخدام، لكن التحقق المستقل الكامل لا يُطبَّق بعد على كل مورد جوهري.',
          'بيانات انبعاثات الموردين فوق عتبة جوهرية محددة تُتحقَّق منها أو تُفحَص عشوائيًا بشكل مستقل قبل دمجها في تقارير النطاق الثالث.',
        ],
      },
      {
        q: 'Is carbon/emissions data collection and calculation integrated into the sourcing and supplier management systems procurement already uses — or a completely separate manual exercise run by the sustainability team once a year that procurement has no visibility into day-to-day?',
        qAr: 'هل يُدمَج جمع وحساب بيانات الكربون/الانبعاثات في أنظمة التوريد وإدارة الموردين التي تستخدمها المشتريات بالفعل — أم أنها ممارسة يدوية منفصلة تمامًا يُجريها فريق الاستدامة مرة سنويًا لا رؤية للمشتريات عليها يوميًا؟',
        levels: [
          'Carbon data collection is a completely separate manual exercise run by the sustainability team, disconnected from the systems procurement uses day-to-day.',
          'The sustainability team shares periodic exports of carbon data with procurement, but the data still lives in a separate file that procurement must manually check against the sourcing system.',
          'A basic integration or shared dashboard links carbon data to the sourcing system for a subset of categories, but most of the supply base still relies on the manual sustainability-team process.',
          'Carbon/emissions data is visible within the sourcing and supplier management platform for most categories, with the sustainability team\'s manual process still required to fill remaining gaps.',
          'Carbon/emissions data collection and tracking is integrated directly into the sourcing and supplier management platform procurement already uses, visible alongside price and quality data.',
        ],
        levelsAr: [
          'جمع بيانات الكربون تمرين يدوي منفصل تمامًا يُديره فريق الاستدامة سنويًا، منفصل عن الأنظمة التي تستخدمها المشتريات يوميًا.',
          'فريق الاستدامة يُشارك المشتريات بصادرات دورية من بيانات الكربون، لكن البيانات لا تزال تعيش في ملف منفصل يجب على المشتريات مقارنته يدويًا بنظام التوريد.',
          'تكامل أساسي أو لوحة بيانات مشتركة تربط بيانات الكربون بنظام التوريد لمجموعة فرعية من الفئات، لكن معظم قاعدة الموردين لا تزال تعتمد على عملية فريق الاستدامة اليدوية.',
          'بيانات الكربون/الانبعاثات مرئية داخل منصة التوريد وإدارة الموردين لمعظم الفئات، مع بقاء عملية فريق الاستدامة اليدوية لازمة لسد الفجوات المتبقية.',
          'جمع بيانات الكربون/الانبعاثات وتتبّعها مدمج مباشرةً في منصة التوريد وإدارة الموردين التي تستخدمها المشتريات بالفعل، ظاهرة جنبًا إلى جنب مع بيانات السعر والجودة.',
        ],
      },
      {
        q: 'Does policy require a minimum level of carbon/emissions disclosure as a condition of doing business above a defined spend threshold — or is emissions disclosure requested as a courtesy that a supplier can simply decline without consequence?',
        qAr: 'هل تشترط السياسة حدًا أدنى من إفصاح الكربون/الانبعاثات كشرط لممارسة الأعمال فوق حد إنفاق محدد — أم يُطلَب إفصاح الانبعاثات كمجاملة يمكن للمورد رفضها ببساطة دون عواقب؟',
        levels: [
          'Emissions disclosure is requested from suppliers as a courtesy; declining to provide it carries no consequence for the supplier relationship.',
          'Emissions disclosure is requested more insistently of larger suppliers, and repeated non-response is noted informally, but no policy actually attaches a consequence to it.',
          'A draft policy sets a minimum disclosure expectation tied to spend threshold, but it has not yet been formally enforced or communicated as a binding condition of doing business.',
          'A minimum emissions disclosure requirement is enforced for most suppliers above the defined spend threshold, with consequences applied inconsistently for the remaining non-compliant cases.',
          'Policy makes a minimum level of emissions disclosure a mandatory condition of doing business above a defined spend threshold, with defined consequences for non-disclosure.',
        ],
        levelsAr: [
          'الإفصاح عن الانبعاثات يُطلَب من الموردين كمجاملة؛ ورفض تقديمه لا يترتب عليه أي نتيجة على العلاقة مع المورد.',
          'الإفصاح عن الانبعاثات يُطلَب بإصرار أكبر من كبار الموردين، وعدم الاستجابة المتكرر يُدوَّن بشكل غير رسمي، لكن لا سياسة تُرتّب فعليًا نتيجة على ذلك.',
          'سياسة مسودة تُحدّد توقع إفصاح أدنى مرتبطًا بحد الإنفاق، لكنها لم تُطبَّق أو تُبلَّغ بعد رسميًا كشرط مُلزِم لممارسة الأعمال.',
          'متطلب إفصاح انبعاثات أدنى يُطبَّق على معظم الموردين فوق حد الإنفاق المحدد، والنتائج تُطبَّق بتفاوت على الحالات المتبقية غير الممتثلة.',
          'السياسة تجعل حدًا أدنى من الإفصاح عن الانبعاثات شرطًا إلزاميًا لممارسة الأعمال فوق حد إنفاق محدد، بنتائج محددة لعدم الإفصاح.',
        ],
      },
      {
        q: 'Are high-carbon-intensity suppliers assessed for their exposure to future carbon pricing, border carbon adjustments, or tightening emissions regulation — recognising that a supplier\'s carbon exposure today can become tomorrow\'s cost or continuity risk, not just a reporting metric?',
        qAr: 'هل يُقيَّم الموردون عالو كثافة الكربون من حيث تعرّضهم لتسعير الكربون المستقبلي أو تعديلات الكربون الحدودية أو تشديد لوائح الانبعاثات — إقرارًا بأن تعرّض كربون المورد اليوم يمكن أن يصبح مخاطرة تكلفة أو استمرارية غدًا، لا مجرد مقياس إبلاغ؟',
        levels: [
          'Carbon intensity is tracked as a reporting metric only; no assessment considers what rising carbon costs or tightening regulation could mean for a high-carbon supplier\'s future viability or pricing.',
          'There is informal awareness that some high-carbon suppliers could face future cost or regulatory pressure, but no assessment has actually been conducted or documented.',
          'A transition risk assessment has been conducted for a small number of the highest-carbon strategic suppliers, but it is a one-off exercise rather than a repeated, standard practice.',
          'Transition risk exposure is assessed for most high-carbon-intensity suppliers, with findings shared with category managers, though not yet systematically feeding continuity contingency planning.',
          'High-carbon-intensity suppliers are explicitly assessed for transition risk exposure — future carbon pricing, regulation, border adjustments — with findings feeding sourcing and continuity planning.',
        ],
        levelsAr: [
          'كثافة الكربون تُتابَع كمقياس تقرير فقط؛ ولا تقييم يأخذ بالاعتبار ما قد تعنيه تكاليف الكربون المتصاعدة أو تشدد التنظيم لجدوى أو تسعير مورد عالي الكربون مستقبلاً.',
          'هناك وعي غير رسمي بأن بعض الموردين عالي الكربون قد يواجهون ضغط تكلفة أو تنظيم مستقبلاً، لكن لم يُجرَ أو يُوثَّق أي تقييم فعليًا.',
          'تقييم مخاطر انتقال أُجري لعدد صغير من الموردين الاستراتيجيين الأعلى كربونًا، لكنه تمرين لمرة واحدة لا ممارسة معيارية متكررة.',
          'التعرّض لمخاطر الانتقال يُقيَّم لمعظم الموردين عالي كثافة الكربون، والنتائج تُشارَك مع مديري الفئات، لكنها لا تُغذّي بعد بشكل منهجي التخطيط الاحتياطي للاستمرارية.',
          'الموردون عالو كثافة الكربون يُقيَّمون صراحةً لتعرّضهم لمخاطر الانتقال — تسعير الكربون المستقبلي والتنظيم وتعديلات الحدود الكربونية — والنتائج تُغذّي التخطيط للتوريد والاستمرارية.',
        ],
      },
    ],
  },
  {
    id: 'esg-social',
    title: 'Social & Labour Standards',
    titleAr: 'المعايير الاجتماعية وسوق العمل',
    hint: 'Evaluates adherence to international labour standards, worker welfare programmes, diversity, and human rights due diligence across operations and the supplier base.',
    hintAr: 'يقيّم الالتزام بمعايير العمل الدولية وبرامج رعاية العمال والتنوع والعناية الواجبة لحقوق الإنسان عبر العمليات وقاعدة الموردين.',
    benchmarks: { gcc: 2.3, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'How rigorously does procurement extend and enforce labour standards — working hours, wages, health and safety, freedom of association, aligned to ILO conventions — onto its supply base through a supplier code of conduct, contractual clauses, and audit rights, rather than treating labour practice as solely the buying organisation\'s own internal HR concern?',
        qAr: 'ما مدى صرامة توسيع المشتريات وإنفاذها لمعايير العمل — ساعات العمل والأجور والصحة والسلامة وحرية تكوين الجمعيات، بما يتماشى مع اتفاقيات منظمة العمل الدولية — على قاعدة الموردين عبر مدونة سلوك للموردين وبنود تعاقدية وحقوق تدقيق، بدلاً من معاملة ممارسة العمل كشأن داخلي للموارد البشرية في المؤسسة الشارية فقط؟',
        levels: [
          'Labour standards are addressed only for the buying organisation\'s own employees; nothing formally extends any labour standard requirement onto suppliers.',
          'A basic supplier code of conduct exists and has been shared with some suppliers, but it carries no contractual weight and is not linked to any audit or enforcement mechanism.',
          'A supplier code of conduct aligned to recognised labour standards is included in contracts for a subset of higher-risk suppliers, but audit rights are rarely exercised in practice.',
          'A supplier code of conduct with contractual clauses and audit rights covers most material suppliers, with audits conducted for higher-risk categories, though coverage of lower-tier or smaller suppliers remains incomplete.',
          'A supplier code of conduct aligned to ILO conventions, backed by contractual clauses and audit rights, formally extends labour standards onto every material supplier.',
        ],
        levelsAr: [
          'معايير العمل تُعالَج فقط لموظفي المؤسسة الشارية الخاصين؛ ولا شيء يمتد رسميًا بأي متطلب معيار عمل إلى الموردين.',
          'ميثاق سلوك موردين أساسي موجود وشُورك مع بعض الموردين، لكنه لا يحمل أي ثقل تعاقدي وغير مرتبط بأي آلية تدقيق أو إنفاذ.',
          'ميثاق سلوك موردين مواءَم مع معايير عمل معترف بها مُدرَج في عقود مجموعة فرعية من الموردين الأعلى مخاطرة، لكن صلاحيات التدقيق نادرًا ما تُمارَس عمليًا.',
          'ميثاق سلوك موردين ببنود تعاقدية وصلاحيات تدقيق يغطي معظم الموردين الجوهريين، مع إجراء تدقيقات للفئات الأعلى مخاطرة، لكن تغطية الموردين من الطبقة الأدنى أو الأصغر تبقى غير مكتملة.',
          'ميثاق سلوك موردين مواءَم مع اتفاقيات منظمة العمل الدولية، مدعوم ببنود تعاقدية وصلاحيات تدقيق، يمتد رسميًا بمعايير العمل على كل مورد جوهري.',
        ],
      },
      {
        q: 'How systematically is human rights due diligence conducted across your supply chain — including supplier screening, on-site audits, grievance mechanisms, and remediation processes?',
        qAr: 'ما مدى منهجية إجراء العناية الواجبة لحقوق الإنسان عبر سلسلة الإمداد — شاملًا فرز الموردين والتدقيقات الميدانية وآليات تلقّي الشكاوى وعمليات المعالجة؟',
        levels: [
          'No human rights due diligence process exists. Supplier labour practices are not assessed and no grievance mechanism is in place.',
          'Some awareness of human rights risks exists but supplier screening is limited to high-value contracts; no on-site audits or grievance channel for supplier workers is available.',
          'A supplier Code of Conduct covering human rights is distributed to key suppliers; high-risk suppliers are screened using questionnaires; a supplier grievance channel is available.',
          'Human rights due diligence is integrated into the supplier onboarding and review process; on-site audits are conducted for high-risk suppliers; documented remediation processes address findings.',
          'A systematic human rights due diligence programme aligned to the UN Guiding Principles is embedded; independent audits cover the entire strategic supplier base; remediation outcomes are tracked and disclosed.',
        ],
        levelsAr: [
          'لا توجد عملية عناية واجبة لحقوق الإنسان. ممارسات العمل لدى الموردين لا تُقيَّم ولا توجد آلية لتلقي الشكاوى.',
          'ثمة وعي ببعض مخاطر حقوق الإنسان لكن فرز الموردين مقتصر على العقود عالية القيمة؛ ولا تدقيقات ميدانية أو قناة شكاوى لعمال الموردين.',
          'ميثاق سلوك للموردين يشمل حقوق الإنسان يُوزَّع على الموردين الرئيسيين؛ والموردون عالو المخاطر يُفرَزون باستبيانات؛ وقناة شكاوى الموردين متاحة.',
          'العناية الواجبة لحقوق الإنسان مدمجة في عملية تأهيل الموردين ومراجعتهم؛ وتدقيقات ميدانية تُجرى للموردين عالي المخاطر؛ وعمليات معالجة موثّقة تعالج النتائج.',
          'برنامج منهجي للعناية الواجبة لحقوق الإنسان مواءَم مع مبادئ الأمم المتحدة التوجيهية متجذّر؛ وتدقيقات مستقلة تغطي قاعدة الموردين الاستراتيجيين بأكملها؛ ونتائج المعالجة مُتابَعة ومُفصَح عنها.',
        ],
      },
      {
        q: 'Are the highest labour-risk categories and sourcing geographies — labour-intensive manufacturing, construction, certain high-risk sourcing countries — specifically targeted for deeper labour-standards scrutiny, or does every supplier receive the same light-touch check regardless of actual labour risk profile?',
        qAr: 'هل تُستهدَف الفئات والجغرافيات الأعلى مخاطرة عمالية — التصنيع كثيف العمالة والإنشاءات وبعض دول التوريد عالية المخاطر — تحديدًا بفحص أعمق لمعايير العمل، أم يحصل كل مورد على نفس الفحص الخفيف بغض النظر عن ملف مخاطره العمالية الفعلي؟',
        levels: [
          'The same generic, light-touch labour check is applied to every supplier regardless of category or geography, with no differentiation for known higher-risk categories.',
          'There is informal recognition that certain categories or geographies carry higher labour risk, but the same standard check is still applied to every supplier regardless of that recognition.',
          'A risk categorisation of suppliers by labour risk has been developed, but scrutiny intensity has not yet been formally differentiated to match it — most suppliers still receive the same check.',
          'Labour risk scrutiny is scaled by category and geography for most of the supply base, with the highest-risk suppliers receiving deeper checks, though on-site audits are not yet consistently applied to every highest-risk supplier.',
          'Labour risk scrutiny is explicitly and proportionately scaled to category and geography risk, with the highest-risk suppliers subject to on-site audits and the lowest-risk to a lighter documented check.',
        ],
        levelsAr: [
          'نفس الفحص العمالي السطحي العام يُطبَّق على كل مورد بصرف النظر عن الفئة أو الجغرافيا، دون تمييز للفئات الأعلى مخاطرة المعروفة.',
          'هناك إدراك غير رسمي بأن فئات أو جغرافيات معينة تحمل مخاطر عمالية أعلى، لكن نفس الفحص المعياري لا يزال يُطبَّق على كل مورد بصرف النظر عن هذا الإدراك.',
          'تصنيف مخاطر للموردين حسب المخاطر العمالية أُعِد، لكن حدة التدقيق لم تُميَّز رسميًا بعد لتطابقه — ولا يزال معظم الموردين يخضعون لنفس الفحص.',
          'التدقيق في المخاطر العمالية مُتدرِّج حسب الفئة والجغرافيا لمعظم قاعدة الموردين، مع خضوع الموردين الأعلى مخاطرة لفحوصات أعمق، لكن التدقيقات الميدانية لا تُطبَّق بعد باتساق على كل مورد أعلى مخاطرة.',
          'التدقيق في مخاطر العمل مُتدرِّج صراحةً وبشكل متناسب وفق مخاطر الفئة والجغرافيا، والموردون الأعلى مخاطرة يخضعون لتدقيقات ميدانية والأدنى مخاطرة لفحص موثّق أخف.',
        ],
      },
      {
        q: 'Is there a functioning, accessible grievance channel that workers *employed by suppliers* — not just the buying organisation\'s own employees — can actually use to raise labour concerns that reach the buying organisation?',
        qAr: 'هل توجد قناة تظلّم فعّالة ويسهل الوصول إليها يمكن للعمال الموظفين لدى الموردين — لا موظفي المؤسسة الشارية فقط — استخدامها فعليًا لإثارة مخاوف عمالية تصل إلى المؤسسة الشارية؟',
        levels: [
          'No grievance channel exists for supplier-employed workers; any labour concern in the supply base would have to reach the buying organisation by accident.',
          'A grievance channel exists in principle, such as an email address referenced in the code of conduct, but it is not actively publicised at supplier sites and workers are largely unaware it exists.',
          'A grievance channel has been publicised at a subset of higher-risk supplier sites, but it is not multilingual and there is no documented process for how a raised case is actually handled.',
          'A grievance channel accessible to supplier-employed workers is publicised at most supplier sites, with a documented handling process, though language coverage or worker awareness remains incomplete.',
          'A functioning, multilingual grievance channel accessible to supplier-employed workers is actively publicised at supplier sites, with a documented process for every case raised.',
        ],
        levelsAr: [
          'لا توجد قناة شكاوى للعاملين لدى الموردين؛ وأي مخاوف عمالية في قاعدة الموردين لن تصل للمؤسسة الشارية إلا بالصدفة.',
          'قناة شكاوى موجودة من حيث المبدأ (كعنوان بريد إلكتروني مُشار إليه في ميثاق السلوك)، لكنها لا تُروَّج فعليًا في مواقع الموردين والعاملون غير مدركين لوجودها إلى حد كبير.',
          'قناة شكاوى رُوِّج لها في مجموعة فرعية من مواقع الموردين الأعلى مخاطرة، لكنها ليست متعددة اللغات ولا توجد عملية موثّقة لكيفية معالجة أي حالة تُرفَع فعليًا.',
          'قناة شكاوى متاحة للعاملين لدى الموردين تُروَّج لها في معظم مواقع الموردين، بعملية معالجة موثّقة، لكن تغطية اللغات أو وعي العاملين تبقى غير مكتملة.',
          'قناة شكاوى فعّالة ومتعددة اللغات ومتاحة للعاملين لدى الموردين تُروَّج لها فعليًا في مواقع الموردين، بعملية موثّقة لكل حالة تُرفَع.',
        ],
      },
      {
        q: 'When a supplier labour-standards audit finding surfaces, is there a tracked corrective action process with a defined closure timeline — or does the finding sit documented in a report with no systematic follow-through to confirm it was actually fixed?',
        qAr: 'عندما تظهر نتيجة تدقيق معايير عمل لدى مورد، هل توجد عملية إجراء تصحيحي متابَعة بجدول زمني إغلاق محدد — أم تبقى النتيجة موثّقة في تقرير دون متابعة منهجية للتأكد من إصلاحها فعليًا؟',
        levels: [
          'Audit findings are documented but there is no systematic process to track whether corrective action was actually taken; findings can sit unresolved indefinitely.',
          'Audit findings are logged in a spreadsheet or file, but there is no systematic follow-up process to check whether corrective action was actually taken.',
          'A corrective action process exists and is applied to the most serious findings, but deadlines are not consistently enforced and closure is not independently verified.',
          'Most labour-standards audit findings are tracked to closure through a defined corrective action process with deadlines, though independent verification of closure is applied only to the highest-severity findings.',
          'Every labour-standards audit finding is tracked to closure through a defined corrective action process with a set deadline, and independently verified before being marked resolved.',
        ],
        levelsAr: [
          'نتائج التدقيق موثّقة لكن لا توجد عملية منهجية لمتابعة ما إذا اتُّخذ الإجراء التصحيحي فعليًا؛ ويمكن أن تبقى النتائج غير محلولة إلى أجل غير مسمى.',
          'نتائج التدقيق تُسجَّل في جدول بيانات أو ملف، لكن لا توجد عملية متابعة منهجية للتحقق من اتخاذ الإجراء التصحيحي.',
          'عملية إجراء تصحيحي موجودة وتُطبَّق على أخطر النتائج، لكن المواعيد النهائية لا تُنفَّذ باتساق والإغلاق لا يُتحقَّق منه بشكل مستقل.',
          'معظم نتائج تدقيق معايير العمل تُتابَع حتى الإغلاق عبر عملية إجراء تصحيحي محددة بمواعيد نهائية، لكن التحقق المستقل من الإغلاق يُطبَّق فقط على النتائج الأعلى خطورة.',
          'كل نتيجة تدقيق معايير عمل تُتابَع حتى الإغلاق عبر عملية إجراء تصحيحي محددة بموعد نهائي، وتُتحقَّق منها بشكل مستقل قبل تصنيفها كمحلولة.',
        ],
      },
      {
        q: 'How current is supplier labour-standards certification and audit status tracked — can procurement confirm, right now, which suppliers\' labour audits have lapsed and are overdue for renewal?',
        qAr: 'ما مدى حداثة متابعة حالة شهادات وتدقيقات معايير العمل للموردين — هل يمكن للمشتريات أن تؤكد الآن أي تدقيقات عمالية للموردين انتهت وتأخرت عن التجديد؟',
        levels: [
          'There is no live view of which suppliers\' labour audits are current versus lapsed; confirming this would require manually checking individual supplier files.',
          'Audit status is recorded per supplier in individual files, but assembling a view of which are current versus lapsed requires manually opening each file.',
          'A consolidated spreadsheet tracks audit status for most suppliers, but it requires manual updating and is not always current, so it cannot be fully trusted at a glance.',
          'A centrally maintained tracker shows audit status for most suppliers subject to labour-standards requirements, with manual flags for overdue items rather than fully automatic alerts.',
          'A live, centrally maintained tracker shows the current audit/certification status of every supplier subject to labour-standards requirements, with automatic flags for anything overdue.',
        ],
        levelsAr: [
          'لا توجد رؤية حية لأي الموردين انتهت صلاحية تدقيقاتهم العمالية مقابل الحالية؛ وتأكيد ذلك يستلزم فحص ملفات الموردين الفردية يدويًا.',
          'حالة التدقيق تُسجَّل لكل مورد في ملفات فردية، لكن تجميع رؤية لمن هو حالي مقابل منتهي الصلاحية يستلزم فتح كل ملف يدويًا.',
          'جدول بيانات موحّد يتابع حالة التدقيق لمعظم الموردين، لكنه يستلزم تحديثًا يدويًا وليس حديثًا دائمًا، لذا لا يمكن الوثوق به بالكامل بنظرة سريعة.',
          'متتبع مُصان مركزيًا يُظهر حالة التدقيق لمعظم الموردين الخاضعين لمتطلبات معايير العمل، بتنبيهات يدوية للحالات المتأخرة لا تنبيهات آلية كاملة.',
          'متتبع حي مُصان مركزيًا يُظهر حالة التدقيق/الشهادة الحالية لكل مورد خاضع لمتطلبات معايير العمل، بتنبيهات آلية لأي حالة متأخرة.',
        ],
      },
      {
        q: 'Are supplier labour-standards audits conducted or verified by an independent third-party auditor — rather than relying on the supplier\'s own self-assessment questionnaire as the sole basis for a labour compliance conclusion?',
        qAr: 'هل تُجرى أو تُتحقَّق تدقيقات معايير العمل للموردين من مدقق مستقل من طرف ثالث — بدلاً من الاعتماد على استبيان التقييم الذاتي للمورد نفسه كأساس وحيد لاستنتاج امتثال عمالي؟',
        levels: [
          'Labour compliance conclusions rest entirely on the supplier\'s own self-assessment questionnaire, with no independent verification.',
          'Self-assessment questionnaires are supplemented occasionally by a desktop review of supporting documents, but no independent, on-the-ground verification occurs.',
          'Third-party audits have been commissioned for a small number of the highest-profile suppliers, but most higher-risk suppliers are still assessed through self-assessment alone.',
          'Third-party audits or verification cover most higher-risk suppliers, though a defined subset still relies on self-assessment due to resource or access constraints.',
          'Labour-standards audits for higher-risk suppliers are conducted or independently verified by a qualified third-party auditor, not self-assessed alone.',
        ],
        levelsAr: [
          'استنتاجات الامتثال العمالي تستند بالكامل إلى استبيان التقييم الذاتي للمورد، دون تحقق مستقل.',
          'استبيانات التقييم الذاتي تُكمَّل أحيانًا بمراجعة مكتبية للوثائق الداعمة، لكن لا يحدث تحقق مستقل ميداني.',
          'تدقيقات من طرف ثالث كُلِّفت لعدد صغير من الموردين الأبرز، لكن معظم الموردين الأعلى مخاطرة لا يزالون يُقيَّمون عبر التقييم الذاتي وحده.',
          'تدقيقات أو تحقق من طرف ثالث يغطي معظم الموردين الأعلى مخاطرة، لكن مجموعة فرعية محددة لا تزال تعتمد على التقييم الذاتي بسبب قيود الموارد أو الوصول.',
          'تدقيقات معايير العمل للموردين الأعلى مخاطرة تُجرى أو يُتحقَّق منها بشكل مستقل من مدقق مؤهَّل من طرف ثالث، لا التقييم الذاتي وحده.',
        ],
      },
      {
        q: 'Is the tracking of labour-standards certification expiry and grievance case status automated — flagging renewals due and open cases needing action — versus manually monitored with no systematic alerting?',
        qAr: 'هل مراقبة انتهاء شهادات معايير العمل وحالة قضايا التظلّم آلية — تُبلّغ عن التجديدات المستحقة والقضايا المفتوحة التي تحتاج إجراءً — مقابل مراقبة يدوية دون تنبيه منهجي؟',
        levels: [
          'Certification expiry and grievance case tracking, where it exists, is monitored manually with no systematic alerting; things fall through the cracks.',
          'A shared calendar or spreadsheet lists key certification dates, giving a partial early-warning signal, but there is no systematic alerting and grievance case tracking remains entirely manual.',
          'An automated system tracks certification expiry with reminder alerts, but grievance case status is still tracked manually in a separate, less structured way.',
          'An automated system tracks both certification expiry and grievance case status for most suppliers, with alerting occasionally missing edge cases or newly onboarded suppliers.',
          'Certification expiry and grievance case status are tracked in an automated system that flags renewals due and open cases requiring action, with no reliance on manual monitoring.',
        ],
        levelsAr: [
          'متابعة انتهاء صلاحية الشهادات العمالية وحالة قضايا الشكاوى، حيث تحدث، تُراقَب يدويًا دون تنبيه منهجي؛ وأمور تُفلِت.',
          'تقويم أو جدول بيانات مشترك يسرد التواريخ الرئيسية للشهادات، مما يوفر إشارة إنذار مبكر جزئية، لكن لا يوجد تنبيه منهجي ولا تزال متابعة قضايا الشكاوى يدوية بالكامل.',
          'نظام آلي يتابع انتهاء صلاحية الشهادات بتنبيهات تذكير، لكن حالة قضايا الشكاوى لا تزال تُتابَع يدويًا بطريقة منفصلة وأقل تنظيمًا.',
          'نظام آلي يتابع كلاً من انتهاء صلاحية الشهادات وحالة قضايا الشكاوى لمعظم الموردين، مع إغفال التنبيه أحيانًا للحالات الاستثنائية أو الموردين المنضمين حديثًا.',
          'حالة انتهاء صلاحية الشهادات وقضايا الشكاوى تُتابَع في نظام آلي يُبلّغ عن التجديدات المستحقة والقضايا المفتوحة التي تحتاج إجراءً، دون اعتماد على مراقبة يدوية.',
        ],
      },
      {
        q: 'Does a documented escalation and consequence policy govern what happens when a confirmed labour-standards violation is found — remediation deadline, contract suspension, exit — rather than a confirmed violation simply being noted with no defined organisational response?',
        qAr: 'هل تحكم سياسة تصعيد وعواقب موثّقة ما يحدث عند تأكيد خرق معايير عمل — مهلة معالجة أو تعليق عقد أو خروج — بدلاً من مجرد تدوين الخرق المؤكَّد دون استجابة مؤسسية محددة؟',
        levels: [
          'A confirmed labour-standards violation is documented but has no defined consequence; the supplier relationship continues unchanged.',
          'There is informal understanding among senior staff that a serious violation would prompt some response, but nothing is documented and consequences have not actually been applied consistently in past cases.',
          'A draft escalation policy exists defining possible consequences, but it has not been formally approved or referenced in supplier contracts, so its application depends on case-by-case judgement.',
          'A documented escalation and consequence policy is applied to most confirmed violations and is referenced in newer supplier contracts, though older contracts have not yet been updated to include it.',
          'A documented policy defines escalating, consistently applied consequences for confirmed violations — mandatory remediation deadline, contract suspension, exit — referenced explicitly in supplier contracts.',
        ],
        levelsAr: [
          'مخالفة معايير عمل مؤكدة تُوثَّق لكن ليس لها نتيجة محددة؛ والعلاقة مع المورد تستمر دون تغيير.',
          'هناك فهم غير رسمي لدى كبار الموظفين بأن مخالفة خطيرة ستستدعي استجابة ما، لكن لا شيء موثّق ولم تُطبَّق النتائج فعليًا باتساق في حالات سابقة.',
          'سياسة تصعيد مسودة تُحدّد نتائج محتملة، لكنها لم تُعتمَد رسميًا أو تُذكَر في عقود الموردين، لذا يعتمد تطبيقها على الحكم لكل حالة على حدة.',
          'سياسة تصعيد ونتائج موثّقة تُطبَّق على معظم المخالفات المؤكدة وتُذكَر في عقود الموردين الأحدث، لكن العقود الأقدم لم تُحدَّث بعد لتشملها.',
          'سياسة موثّقة تُحدّد نتائج متصاعدة ومُطبَّقة باتساق للمخالفات المؤكدة — موعد إصلاح إلزامي وتعليق عقد وخروج — يُشار إليها صراحةً في عقود الموردين.',
        ],
      },
      {
        q: 'Is the organisation\'s exposure to supply disruption from a confirmed forced-labour or serious labour-rights finding — including the real risk of import detention or market access restriction under forced-labour trade laws — actively assessed, or is labour risk treated purely as a reputational concern with no continuity dimension considered?',
        qAr: 'هل يُقيَّم بفاعلية تعرّض المؤسسة لاضطراب الإمداد الناتج عن نتيجة عمل قسري مؤكَّدة أو انتهاك جسيم لحقوق العمل — بما يشمل الخطر الحقيقي لاحتجاز الاستيراد أو تقييد الوصول للسوق بموجب قوانين تجارة العمل القسري — أم تُعامَل مخاطر العمالة كشأن سمعة بحت دون اعتبار بُعد الاستمرارية؟',
        levels: [
          'Labour risk is treated purely as a reputational or ethical concern; the possibility that a serious finding could trigger an actual supply disruption (e.g. an import detention) is not considered.',
          'There is informal awareness among senior staff that a forced-labour finding could carry legal or trade consequences beyond reputation, but no assessment has actually been conducted.',
          'A continuity exposure assessment has been conducted for a small number of the highest-profile, highest-risk suppliers, but it is not a standard practice applied across the high-risk category population.',
          'Continuity exposure from serious labour-rights findings is assessed for most high-risk categories, with findings shared with the risk function, though not yet fully integrated into formal contingency plans.',
          'Exposure to supply disruption from a serious labour-rights finding — including forced-labour trade restrictions — is explicitly assessed for high-risk categories and feeds into continuity contingency planning.',
        ],
        levelsAr: [
          'مخاطر العمل تُعامَل كشأن سمعي أو أخلاقي بحت؛ وإمكانية أن تُطلق نتيجة خطيرة اضطرابًا فعليًا في الإمداد (كاحتجاز استيراد مثلاً) غير مأخوذة بالاعتبار.',
          'هناك وعي غير رسمي لدى كبار الموظفين بأن نتيجة عمل قسري يمكن أن تحمل تبعات قانونية/تجارية تتجاوز السمعة، لكن لم يُجرَ أي تقييم فعليًا.',
          'تقييم للتعرّض لاستمرارية الإمداد أُجري لعدد صغير من الموردين الأبرز والأعلى مخاطرة، لكنه ليس ممارسة معيارية تُطبَّق عبر مجمل فئات المخاطرة العالية.',
          'التعرّض لاستمرارية الإمداد من نتائج خطيرة تتعلق بحقوق العمل يُقيَّم لمعظم الفئات عالية المخاطرة، والنتائج تُشارَك مع وظيفة المخاطر، لكنها لم تُدمَج بالكامل بعد في خطط الطوارئ الرسمية.',
          'التعرّض لاضطراب الإمداد الناتج عن نتيجة خطيرة تتعلق بحقوق العمل — بما في ذلك قيود تجارة العمل القسري — يُقيَّم صراحةً للفئات عالية المخاطرة ويُغذّي التخطيط الاحتياطي للاستمرارية.',
        ],
      },
    ],
  },
  {
    id: 'esg-responsible-sourcing',
    title: 'Responsible Sourcing (ISO 20400)',
    titleAr: 'المشتريات المسؤولة (ISO 20400)',
    hint: 'Assesses the extent to which sustainability criteria are embedded in sourcing decisions, procurement processes, and supplier selection methodology.',
    hintAr: 'يقيس مدى دمج معايير الاستدامة في قرارات التوريد وعمليات المشتريات ومنهجية اختيار الموردين.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'Supplier sustainability audit or EcoVadis scorecard',
      labelAr: 'تقرير تدقيق الاستدامة أو بطاقة EcoVadis للمورد',
      hint:    'Upload a supplier sustainability audit report, EcoVadis scorecard, or supplier code of conduct acknowledgement.',
      hintAr:  'ارفع تقرير تدقيق الاستدامة للمورد أو بطاقة EcoVadis أو إقرار الالتزام بمدونة سلوك الموردين.',
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'How comprehensively are environmental, social, and governance (ESG) criteria embedded in your supplier selection and evaluation methodology — including weighting in RFQ scoring and contract award decisions?',
        qAr: 'ما مدى شمولية دمج معايير البيئة والمجتمع والحوكمة (ESG) في منهجية اختيار وتقييم الموردين — بما في ذلك الوزن في تقييم طلبات عروض الأسعار وقرارات ترسية العقود؟',
        levels: [
          'No ESG criteria are included in supplier selection. Procurement decisions are based entirely on price and technical specification.',
          'ESG awareness exists but criteria are applied inconsistently and only for high-profile or government-mandated contracts.',
          'ESG criteria are formally defined and included in supplier qualification; a minimum sustainability weighting (e.g., 10%) is applied in sourcing evaluations.',
          'ESG criteria carry a defined minimum weighting (≥15%) in all significant sourcing events; supplier sustainability performance is tracked quarterly and feeds into contract renewal decisions.',
          'Responsible sourcing fully aligned to ISO 20400; ESG weighting is ≥20% in all tenders; leading suppliers are co-developing sustainability roadmaps; procurement function holds a Responsible Sourcing policy approved at board level.',
        ],
        levelsAr: [
          'لا تُدرَج معايير ESG في اختيار الموردين. قرارات المشتريات تستند كليًا إلى السعر والمواصفة التقنية.',
          'وعي بـ ESG قائم لكن المعايير تُطبَّق بشكل غير متسق وفقط للعقود عالية المعنوية أو الإلزامية حكوميًا.',
          'معايير ESG محددة رسميًا ومدرجة في تأهيل الموردين؛ وحد أدنى من أوزان الاستدامة (مثلًا 10%) يُطبَّق في تقييمات التوريد.',
          'معايير ESG تحمل وزنًا أدنى محددًا (≥15%) في جميع أحداث التوريد الجوهرية؛ وأداء الاستدامة للموردين يُتابَع فصليًا ويُغذّي قرارات تجديد العقود.',
          'مشتريات مسؤولة مواءَمة كليًا مع ISO 20400؛ ووزن ESG ≥20% في جميع المناقصات؛ والموردون الرياديون يُطوّرون معًا خرائط طريق استدامة؛ ووظيفة المشتريات تمتلك سياسة مشتريات مسؤولة معتمدة على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively do you assess and manage sustainability risks in your supply chain — including climate risk, natural resource depletion, and conflict-mineral exposure?',
        qAr: 'ما مدى فعالية تقييم وإدارة مخاطر الاستدامة في سلسلة الإمداد — شاملًا مخاطر المناخ واستنزاف الموارد الطبيعية والتعرض للمعادن من مناطق النزاع؟',
        levels: [
          'Supply chain sustainability risks are not formally assessed. Climate and resource risks are not considered in procurement or supplier management.',
          'Awareness of sustainability risks in the supply chain exists but no formal risk assessment, screening, or mapping has been completed.',
          'Key supply chain sustainability risks are identified through a documented screening process; high-risk categories and geographies are mapped; risk mitigation actions are assigned.',
          'A supply chain sustainability risk register is maintained and updated annually; physical and transition climate risks are assessed for key sourcing categories; mitigation plans are tracked.',
          'Supply chain climate risk is assessed using climate scenario analysis (e.g., TCFD); conflict-mineral due diligence is conducted; sustainability risk insights inform category strategies and board-level risk reporting.',
        ],
        levelsAr: [
          'مخاطر الاستدامة في سلسلة الإمداد لا تُقيَّم رسميًا. مخاطر المناخ والموارد لا تُؤخَذ بالاعتبار في المشتريات أو إدارة الموردين.',
          'وعي بمخاطر الاستدامة في سلسلة الإمداد قائم لكن لا تقييم رسمي أو فرز أو رسم خرائط مكتمل.',
          'مخاطر الاستدامة الرئيسية لسلسلة الإمداد مُحددة عبر عملية فرز موثّقة؛ والفئات والجغرافيات عالية المخاطر مرسومة؛ وإجراءات التخفيف مُسنَدة.',
          'سجل مخاطر الاستدامة لسلسلة الإمداد محفوظ ومحدَّث سنويًا؛ ومخاطر المناخ المادية والانتقالية مُقيَّمة لفئات التوريد الرئيسية؛ وخطط التخفيف متابَعة.',
          'مخاطر مناخ سلسلة الإمداد مُقيَّمة باستخدام تحليل سيناريوهات المناخ (كـ TCFD)؛ وعناية واجبة للمعادن من مناطق النزاع تُجرى؛ ورؤى مخاطر الاستدامة تُوجّه استراتيجيات الفئات وتقارير مجلس الإدارة.',
        ],
      },
      {
        q: 'How embedded is supplier sustainability development — including joint improvement programmes, supplier ESG capacity building, and preferential treatment for high-performing sustainable suppliers?',
        qAr: 'ما مدى ترسّخ تطوير استدامة الموردين — شاملًا برامج تحسين مشتركة وبناء قدرات ESG للموردين والمعاملة التفضيلية للموردين المستدامين عالي الأداء؟',
        levels: [
          'No supplier sustainability development programmes exist. Supplier ESG performance is neither assessed nor developed.',
          'Some high-level sustainability expectations are communicated to suppliers but no structured development programmes or incentive mechanisms are in place.',
          'Key suppliers are engaged on sustainability improvement through annual performance reviews that include ESG criteria; improvement targets are set for underperforming suppliers.',
          'A supplier sustainability development programme is in place; joint ESG improvement plans are co-created with strategic suppliers; high-ESG-performing suppliers receive preferential sourcing consideration.',
          'A differentiated supplier sustainability programme tiers suppliers by ESG maturity; best-in-class suppliers receive longer contracts and volume commitments; co-innovation on sustainability is tracked and publicly reported.',
        ],
        levelsAr: [
          'لا توجد برامج تطوير استدامة للموردين. أداء ESG للموردين لا يُقيَّم ولا يُطوَّر.',
          'بعض توقعات الاستدامة العالية المستوى تُوصَل للموردين لكن لا برامج تطوير منظمة أو آليات حوافز قائمة.',
          'الموردون الرئيسيون يُشارَكون في تحسين الاستدامة من خلال مراجعات أداء سنوية تشمل معايير ESG؛ ومستهدفات تحسين تُحدَّد للموردين ضعيفي الأداء.',
          'برنامج تطوير استدامة الموردين قائم؛ وخطط تحسين ESG مشتركة تُبتكَر مع الموردين الاستراتيجيين؛ والموردون عالو أداء ESG يحظون باعتبار تفضيلي في التوريد.',
          'برنامج استدامة موردين متمايز يُصنّف الموردين حسب نضج ESG؛ والموردون الرياديون يحصلون على عقود أطول والتزامات حجم؛ والابتكار المشترك في الاستدامة متابَع ومُبلَّغ عنه علنًا.',
        ],
      },
      {
        q: 'Is ESG weighting applied consistently across categories according to a documented policy — or does it vary so much by individual category manager that the same supplier could be scored very differently depending on who\'s running the sourcing event?',
        qAr: 'هل يُطبَّق ترجيح ESG باتساق عبر الفئات وفق سياسة موثّقة — أم يتفاوت كثيرًا حسب مدير الفئة الفردي بحيث يمكن أن يُسجَّل نفس المورد بشكل مختلف جدًا حسب من يُدير حدث التوريد؟',
        levels: [
          'ESG weighting, where applied, varies entirely by individual category manager preference, with no documented standard; the same supplier could receive a very different ESG score in two different sourcing events.',
          'A general principle that ESG should be weighted is understood informally, but weighting values are set ad hoc by each category manager with no reference document.',
          'A documented ESG weighting guideline exists, but it is treated as a suggestion; category managers frequently deviate from it without requiring approval.',
          'ESG weighting methodology and minimum thresholds are documented and applied by most category managers, though calibration checks across the group happen irregularly rather than on a defined schedule.',
          'ESG weighting methodology and minimum thresholds are documented centrally and applied consistently across categories, with periodic calibration checks across category managers.',
        ],
        levelsAr: [
          'ترجيح ESG، حيث يُطبَّق، يتفاوت كليًا حسب تفضيل مدير الفئة الفردي، دون معيار موثّق؛ ويمكن أن يحصل نفس المورد على درجة ESG مختلفة جدًا في حدثي توريد مختلفين.',
          'هناك مبدأ عام مفهوم بشكل غير رسمي بضرورة ترجيح ESG، لكن قيم الترجيح تُحدَّد بشكل عشوائي من قبل كل مدير فئة دون وثيقة مرجعية.',
          'توجد إرشادات ترجيح ESG موثّقة، لكنها تُعامَل كاقتراح؛ ويحيد عنها مديرو الفئات كثيرًا دون الحاجة لموافقة.',
          'منهجية ترجيح ESG والحدود الدنيا موثّقة ويُطبّقها معظم مديري الفئات، لكن فحوصات المعايرة عبر المجموعة تحدث بتفاوت لا وفق جدول محدد.',
          'منهجية ترجيح ESG والحدود الدنيا موثّقة مركزيًا ومُطبَّقة باتساق عبر الفئات، بفحوصات معايرة دورية عبر مديري الفئات.',
        ],
      },
      {
        q: 'Is ESG scoring actually completed and documented for every qualifying sourcing event — or does it get quietly skipped under time pressure, with the event scored on price and technical fit alone?',
        qAr: 'هل يُنجَز ويُوثَّق تسجيل ESG فعليًا لكل حدث توريد مؤهَّل — أم يُتجاوَز بهدوء تحت ضغط الوقت، ويُسجَّل الحدث على السعر والملاءمة التقنية فقط؟',
        levels: [
          'ESG scoring is frequently skipped under time pressure; sourcing events routinely get finalised on price and technical criteria alone with no documented ESG assessment.',
          'ESG scoring is expected as policy, but compliance depends on individual discipline; there is no system check preventing an event from being finalised without it.',
          'A manual sign-off step requires confirmation that ESG scoring was completed before award, but the check is a checkbox that can be marked without the scoring actually having substance behind it.',
          'ESG scoring is enforced by the sourcing system for most qualifying events, with a small number of legacy or exception-process events still able to bypass it.',
          'ESG scoring completion is a mandatory, system-enforced step for every qualifying sourcing event, with no path to award without it being documented.',
        ],
        levelsAr: [
          'تسجيل ESG كثيرًا ما يُتجاوَز تحت ضغط الوقت؛ وأحداث التوريد تُنهى بانتظام على السعر والملاءمة التقنية وحدهما دون تقييم ESG موثّق.',
          'تسجيل ESG متوقع كسياسة، لكن الامتثال يعتمد على انضباط الفرد؛ ولا يوجد فحص بالنظام يمنع إنهاء حدث دون إتمامه.',
          'خطوة اعتماد يدوية تستلزم تأكيد إتمام تسجيل ESG قبل الترسية، لكن الفحص مجرد مربع اختيار يمكن تعليمه دون أن يكون للتسجيل مضمون فعلي وراءه.',
          'تسجيل ESG يُفرَض بواسطة نظام التوريد لمعظم الأحداث المؤهَّلة، مع بقاء عدد صغير من الأحداث القديمة أو عمليات الاستثناء قادرة على تجاوزه.',
          'إكمال تسجيل ESG خطوة إلزامية مفروضة بالنظام لكل حدث توريد مؤهَّل، دون مسار للترسية بدون توثيقها.',
        ],
      },
      {
        q: 'Is a supplier\'s ESG score actually visible to the decision-maker at the moment of award — displayed in the same scorecard as price and quality — or does it live in a separate document that gets produced for the file but not actually looked at when the award decision is made?',
        qAr: 'هل تكون درجة ESG للمورد مرئية فعليًا لصانع القرار لحظة الترسية — معروضة في نفس بطاقة التقييم مع السعر والجودة — أم تعيش في وثيقة منفصلة تُنتَج للملف لكن لا يُنظَر إليها فعليًا عند اتخاذ قرار الترسية؟',
        levels: [
          'ESG scores are documented in a separate file that isn\'t actually consulted at the moment the award decision is made.',
          'ESG scores are recorded in the sourcing system but on a separate tab or screen the decision-maker has to navigate to deliberately rather than seeing by default.',
          'ESG score appears alongside price and quality in a summary report generated for the award decision, but the report is produced as a static document rather than a live, integrated view.',
          'ESG score is displayed in the same scorecard view as price and quality for most sourcing events, though a subset of smaller or off-system awards still bypass the integrated view.',
          'ESG score is displayed in the same integrated scorecard view as price and quality at the exact moment of award decision, impossible to overlook.',
        ],
        levelsAr: [
          'درجات ESG موثّقة في ملف منفصل لا يُستشار فعليًا لحظة اتخاذ قرار الترسية.',
          'درجات ESG تُسجَّل في نظام التوريد لكن في تبويب أو شاشة منفصلة يجب على صانع القرار الانتقال إليها عمدًا لا رؤيتها افتراضيًا.',
          'درجة ESG تظهر جنبًا إلى جنب مع السعر والجودة في تقرير ملخص يُعَد لقرار الترسية، لكن التقرير يُنتَج كوثيقة ثابتة لا كرؤية حية ومتكاملة.',
          'درجة ESG تظهر في نفس عرض بطاقة الأداء مع السعر والجودة لمعظم أحداث التوريد، لكن مجموعة فرعية من الترسيات الأصغر أو خارج النظام لا تزال تتجاوز الرؤية المتكاملة.',
          'درجة ESG تظهر في نفس بطاقة الأداء المتكاملة مع السعر والجودة لحظة قرار الترسية بالضبط، بحيث يستحيل إغفالها.',
        ],
      },
      {
        q: 'Are supplier ESG scores — whether self-reported or from a third-party platform such as EcoVadis — independently spot-checked, rather than accepted uncritically as an input to a contract award decision?',
        qAr: 'هل تُفحَص درجات ESG للموردين — سواء مُبلَّغ عنها ذاتيًا أو من منصة طرف ثالث مثل EcoVadis — بشكل مستقل وعشوائي، بدلاً من قبولها دون تمحيص كمُدخَل في قرار ترسية عقد؟',
        levels: [
          'Supplier ESG scores are accepted uncritically, with no independent spot-check of accuracy before being used to influence an award decision.',
          'ESG scores are occasionally questioned informally when a result looks surprising, but there is no defined process for spot-checking accuracy.',
          'A spot-check process exists and has been applied to a handful of the largest awards, but it is not a defined, repeatable sampling practice.',
          'ESG scores used in material award decisions are spot-checked on a defined sampling basis for most categories, though discrepancy investigation is not yet fully formalised.',
          'ESG scores used in material award decisions are independently spot-checked or audited on a defined sampling basis, with discrepancies formally investigated.',
        ],
        levelsAr: [
          'درجات ESG للموردين تُقبَل دون تشكيك، دون فحص عشوائي مستقل للدقة قبل استخدامها للتأثير في قرار ترسية.',
          'درجات ESG تُستَجوَب أحيانًا بشكل غير رسمي عندما تبدو نتيجة مفاجئة، لكن لا توجد عملية محددة لفحص الدقة عشوائيًا.',
          'عملية فحص عشوائي موجودة وطُبِّقت على عدد قليل من الترسيات الكبرى، لكنها ليست ممارسة عيّنات محددة وقابلة للتكرار.',
          'درجات ESG المستخدَمة في قرارات ترسية جوهرية تُفحَص عشوائيًا وفق عيّنة محددة لمعظم الفئات، لكن التحقيق في التباينات ليس مُنظَّمًا بالكامل بعد.',
          'درجات ESG المستخدَمة في قرارات ترسية جوهرية تُفحَص عشوائيًا أو تُدقَّق بشكل مستقل وفق عيّنة محددة، والتباينات تُحقَّق فيها رسميًا.',
        ],
      },
      {
        q: 'Is supplier ESG scoring integrated directly into the e-sourcing/e-procurement platform — visible automatically during evaluation — or maintained as a separate spreadsheet that has to be manually cross-referenced against the sourcing decision?',
        qAr: 'هل يُدمَج تسجيل ESG للموردين مباشرةً في منصة التوريد/المشتريات الإلكترونية — مرئيًا آليًا أثناء التقييم — أم يُصان كجدول بيانات منفصل يجب مراجعته يدويًا مقابل قرار التوريد؟',
        levels: [
          'ESG scoring lives in a separate spreadsheet that has to be manually cross-referenced against the sourcing tool; the two are not connected.',
          'ESG data is exported periodically from the spreadsheet into the sourcing tool as a static attachment, reducing but not eliminating manual cross-referencing.',
          'A basic integration links ESG scoring to the sourcing platform for a subset of categories, but most sourcing events still rely on a separate spreadsheet.',
          'ESG scoring is integrated into the e-sourcing platform for most categories, automatically populated during evaluation, with a remaining subset of categories or legacy processes still spreadsheet-based.',
          'ESG scoring is natively integrated into the e-sourcing platform, automatically populated and visible during bid evaluation without any manual cross-referencing.',
        ],
        levelsAr: [
          'تسجيل ESG يعيش في جدول بيانات منفصل يستلزم مقارنته يدويًا مقابل أداة التوريد؛ والاثنان غير مترابطين.',
          'بيانات ESG تُصدَّر دوريًا من جدول البيانات إلى أداة التوريد كمرفق ثابت، مما يُقلّل دون أن يُلغي المقارنة اليدوية.',
          'تكامل أساسي يربط تسجيل ESG بمنصة التوريد لمجموعة فرعية من الفئات، لكن معظم أحداث التوريد لا تزال تعتمد على جدول بيانات منفصل.',
          'تسجيل ESG مدمج في منصة التوريد الإلكتروني لمعظم الفئات، ويُعبَّأ آليًا أثناء التقييم، مع بقاء مجموعة فرعية من الفئات أو العمليات القديمة قائمة على جداول البيانات.',
          'تسجيل ESG مدمج بشكل أصيل في منصة التوريد الإلكتروني، ويُعبَّأ ويظهر آليًا أثناء تقييم العروض دون أي مقارنة يدوية.',
        ],
      },
      {
        q: 'Is there a minimum ESG score threshold that acts as a hard qualification gate for regulated or high-risk categories — a supplier who fails to meet it cannot be awarded the business regardless of price — or is ESG scoring always advisory, never actually binding on the final decision?',
        qAr: 'هل توجد عتبة درجة ESG دنيا تعمل كبوابة تأهيل صارمة للفئات المنظَّمة أو عالية المخاطر — بحيث لا يمكن ترسية الأعمال لمورد لا يستوفيها بغض النظر عن السعر — أم أن تسجيل ESG استشاري دائمًا وغير مُلزِم فعليًا للقرار النهائي؟',
        levels: [
          'ESG scoring is always advisory; a supplier can win the business on price alone regardless of how poorly they score on ESG.',
          'There is informal discouragement of awarding to very low ESG scorers, but no defined minimum threshold exists and the decision remains fully at the category manager\'s discretion.',
          'A minimum ESG score threshold has been proposed and documented for high-risk categories, but it has not yet been formally enforced as a binding qualification requirement.',
          'A minimum ESG score threshold is enforced as a hard gate for most defined high-risk or regulated categories, though an informal override path still exists for a small number of exception cases.',
          'A documented minimum ESG score threshold is a hard, non-negotiable qualification gate for defined high-risk or regulated categories, enforced with no informal override.',
        ],
        levelsAr: [
          'تسجيل ESG استشاري دائمًا؛ ويمكن للمورد الفوز بالعمل على السعر وحده بصرف النظر عن ضعف تسجيله في ESG.',
          'هناك تثبيط غير رسمي للترسية على موردين بدرجات ESG منخفضة جدًا، لكن لا يوجد حد أدنى محدد ويبقى القرار بتقدير مدير الفئة بالكامل.',
          'حد أدنى لدرجة ESG اقتُرِح ووُثِّق للفئات عالية المخاطرة، لكنه لم يُنفَّذ بعد رسميًا كمتطلب تأهيل مُلزِم.',
          'حد أدنى لدرجة ESG يُنفَّذ كبوابة صارمة لمعظم الفئات عالية المخاطرة أو المنظَّمة المحددة، لكن مسار تجاوز غير رسمي لا يزال موجودًا لعدد صغير من حالات الاستثناء.',
          'حد أدنى موثّق لدرجة ESG بوابة تأهيل صارمة وغير قابلة للتفاوض للفئات عالية المخاطرة أو المنظَّمة المحددة، مُنفَّذة دون تجاوز غير رسمي.',
        ],
      },
      {
        q: 'Does responsible sourcing practice explicitly guard against creating a new concentration risk — an over-reliance on a small pool of the highest-ESG-scoring suppliers — balancing sustainability ambition against the supply base diversification that resiliency also requires?',
        qAr: 'هل تحمي ممارسة التوريد المسؤول صراحةً من خلق مخاطرة تركّز جديدة — اعتماد مفرط على مجموعة صغيرة من الموردين الأعلى تسجيلاً في ESG — بموازنة طموح الاستدامة مع تنويع قاعدة التوريد الذي تتطلبه المرونة أيضًا؟',
        levels: [
          'Responsible sourcing pushes volume toward the same small pool of high-ESG suppliers with no consideration of the concentration risk this itself creates.',
          'There is informal awareness among some category managers that repeatedly favouring top ESG scorers could narrow the supplier pool, but no check exists to actually monitor or prevent it.',
          'A concentration risk review has been conducted once for a small number of categories with heavy ESG preference, but it is not a repeated or standard practice.',
          'A defined check for ESG-driven concentration risk is applied in most category strategies, with diversification considered alongside ESG performance, though not yet a mandatory step in every sourcing strategy review.',
          'Responsible sourcing strategy explicitly balances ESG performance against supply base diversification, with a defined check to ensure sustainability preference doesn\'t inadvertently create a new single-source or narrow-pool dependency.',
        ],
        levelsAr: [
          'التوريد المسؤول يوجّه الحجم نحو نفس المجموعة الصغيرة من الموردين عالي ESG دون مراعاة لمخاطر التركّز التي يخلقها هذا بحد ذاته.',
          'هناك إدراك غير رسمي لدى بعض مديري الفئات بأن تفضيل أصحاب أعلى درجات ESG بشكل متكرر يمكن أن يُضيّق مجموعة الموردين، لكن لا يوجد فحص فعلي لمراقبة ذلك أو منعه.',
          'مراجعة لمخاطر التركّز أُجريت مرة واحدة لعدد صغير من الفئات ذات التفضيل الكبير لـESG، لكنها ليست ممارسة متكررة أو معيارية.',
          'فحص محدد لمخاطر التركّز الناتج عن ESG يُطبَّق في معظم استراتيجيات الفئات، مع مراعاة التنويع جنبًا إلى جنب مع أداء ESG، لكنه ليس بعد خطوة إلزامية في كل مراجعة استراتيجية توريد.',
          'استراتيجية التوريد المسؤول تُوازن صراحةً بين أداء ESG وتنويع قاعدة الموردين، بفحص محدد لضمان ألا يخلق تفضيل الاستدامة اعتمادية مصدر وحيد أو مجموعة ضيقة جديدة دون قصد.',
        ],
      },
    ],
  },
  {
    id: 'esg-circular',
    title: 'Circular Economy & Waste Reduction',
    titleAr: 'الاقتصاد الدائري وخفض النفايات',
    hint: 'Measures the maturity of waste reduction, packaging redesign, product take-back, and circular supply chain practices.',
    hintAr: 'يقيس نضج خفض النفايات وإعادة تصميم التغليف وبرامج استرداد المنتج وممارسات سلسلة الإمداد الدائرية.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'How deliberately does procurement use purchasing specifications and supplier selection to reduce waste at the source — specifying recycled or recyclable content, reusable packaging, or take-back terms directly in RFx requirements — rather than treating waste reduction as solely a problem for internal operations to solve after materials have already arrived?',
        qAr: 'ما مدى تعمّد استخدام المشتريات لمواصفات الشراء واختيار الموردين لخفض النفايات من المصدر — باشتراط محتوى مُعاد تدويره أو قابل لإعادة التدوير أو تغليف قابل لإعادة الاستخدام أو شروط استرجاع مباشرةً في متطلبات طلب العروض — بدلاً من معاملة خفض النفايات كمشكلة تخص العمليات الداخلية وحدها لحلها بعد وصول المواد بالفعل؟',
        levels: [
          'Waste reduction is treated entirely as an internal operations problem to solve after materials arrive; purchasing specifications make no reference to packaging or material circularity.',
          'There is growing awareness that purchasing specifications could address circularity, and a handful of specifications have been amended informally, but there is no systematic requirement.',
          'A guideline recommends including recycled content or take-back terms in specifications for certain categories, but inclusion depends on individual category managers choosing to apply it.',
          'Purchasing specifications require recycled/recyclable content, reusable packaging, or take-back terms for most relevant categories, with a subset of categories not yet updated to reflect the requirement.',
          'Purchasing specifications systematically require recycled/recyclable content, reusable packaging, or take-back terms wherever relevant, treating source reduction as a sourcing decision, not just a downstream operations fix.',
        ],
        levelsAr: [
          'خفض النفايات يُعامَل بالكامل كمشكلة عمليات داخلية تُحل بعد وصول المواد؛ ومواصفات الشراء لا تُشير إطلاقًا لدورانية التغليف أو المواد.',
          'هناك وعي متزايد بأن مواصفات الشراء يمكن أن تعالج الدورانية، وعُدِّل عدد قليل من المواصفات بشكل غير رسمي، لكن لا يوجد متطلب منهجي.',
          'إرشاد يوصي بتضمين محتوى مُعاد تدويره أو شروط استرداد في المواصفات لفئات معينة، لكن الإدراج يعتمد على اختيار مديري الفئات الأفراد تطبيقه.',
          'مواصفات الشراء تستلزم محتوى مُعاد تدويره/قابل لإعادة التدوير أو تغليفًا قابلاً لإعادة الاستخدام أو شروط استرداد لمعظم الفئات ذات الصلة، مع بقاء مجموعة فرعية من الفئات لم تُحدَّث بعد لتعكس المتطلب.',
          'مواصفات الشراء تستلزم منهجيًا محتوى مُعاد تدويره/قابل لإعادة التدوير أو تغليفًا قابلاً لإعادة الاستخدام أو شروط استرداد حيثما ينطبق، بمعاملة خفض المصدر كقرار توريد لا مجرد إصلاح عمليات لاحق.',
        ],
      },
      {
        q: 'How mature is your approach to circular economy principles — including product and packaging redesign, take-back schemes, material recovery, and value chain collaboration on circularity?',
        qAr: 'ما مدى نضج نهجكم في مبادئ الاقتصاد الدائري — شاملًا إعادة تصميم المنتج والتغليف وبرامج استرداد المنتج واسترداد المواد والتعاون على الدورانية في سلسلة القيمة؟',
        levels: [
          'No circular economy principles are applied. Products and packaging are designed without consideration of end-of-life recovery or material reuse.',
          'Some awareness of circular economy exists but initiatives are isolated and project-based with no systematic strategy or cross-functional coordination.',
          'A circular economy strategy is documented; packaging redesign to reduce virgin material content is in progress; at least one take-back or material recovery programme is operational.',
          'Circular economy KPIs (recycled content %, take-back rate) are tracked; supplier collaboration on circular packaging and material recovery is formalised; circular design criteria are embedded in new product development.',
          'Circular economy is a core pillar of the supply chain strategy; product stewardship programmes are certified; circular metrics are publicly reported; circular supply chain initiatives contribute to measurable carbon reduction.',
        ],
        levelsAr: [
          'لا تُطبَّق مبادئ الاقتصاد الدائري. المنتجات والتغليف مصمّمة دون مراعاة الاسترداد في نهاية العمر الافتراضي أو إعادة استخدام المواد.',
          'وعي ببعض مبادئ الاقتصاد الدائري موجود لكن المبادرات معزولة وقائمة على المشاريع دون استراتيجية منهجية أو تنسيق متعدد الوظائف.',
          'استراتيجية الاقتصاد الدائري موثّقة؛ وإعادة تصميم التغليف لتقليل محتوى المواد الخام قيد التطبيق؛ وبرنامج استرداد أو تعافٍ واحد على الأقل يعمل.',
          'مؤشرات الاقتصاد الدائري (نسبة المحتوى المُعاد تدويره، معدل الاسترداد) متابَعة؛ والتعاون مع الموردين على التغليف الدائري واسترداد المواد مُضفَى عليه الطابع الرسمي؛ ومعايير التصميم الدائري مدمجة في تطوير المنتجات الجديدة.',
          'الاقتصاد الدائري ركيزة أساسية في استراتيجية سلسلة الإمداد؛ وبرامج الوصاية على المنتج معتمدة؛ والمقاييس الدائرية مُبلَّغ عنها علنًا؛ ومبادرات سلسلة الإمداد الدائرية تُسهم في خفض الكربون المقيس.',
        ],
      },
      {
        q: 'Are circular and packaging requirements written into standard supplier contracts and RFx templates as evaluable criteria — or dependent entirely on an individual category manager remembering to ask for them on a given sourcing event?',
        qAr: 'هل تُكتَب متطلبات الاقتصاد الدائري والتغليف في عقود الموردين القياسية ونماذج طلب العروض كمعايير قابلة للتقييم — أم تعتمد كليًا على تذكّر مدير فئة فردي طلبها في حدث توريد معين؟',
        levels: [
          'Circular/packaging requirements exist only if an individual category manager happens to think to include them; there is no standard template requirement.',
          'A reference clause library includes circular/packaging language that category managers can copy in, but nothing prompts them to do so and usage is inconsistent.',
          'Circular and packaging requirements are included in RFx templates for a small number of pilot categories, but the broader template library has not yet been updated.',
          'Circular and packaging requirements are built into RFx templates and contract clauses for most relevant categories, with a remaining subset of legacy templates not yet updated.',
          'Circular and packaging requirements are built into standard RFx templates and contract clauses for relevant categories, applied consistently regardless of who runs the sourcing event.',
        ],
        levelsAr: [
          'متطلبات الدورانية/التغليف موجودة فقط إذا فكّر مدير فئة فردي بإدراجها؛ ولا يوجد متطلب قالب معياري.',
          'مكتبة بنود مرجعية تتضمن صياغة دورانية/تغليف يمكن لمديري الفئات نسخها، لكن لا شيء يُذكّرهم بذلك والاستخدام غير متسق.',
          'متطلبات الدورانية والتغليف مُدرَجة في قوالب RFx لعدد صغير من الفئات التجريبية، لكن مكتبة القوالب الأوسع لم تُحدَّث بعد.',
          'متطلبات الدورانية والتغليف مُدمَجة في قوالب RFx وبنود العقود لمعظم الفئات ذات الصلة، مع بقاء مجموعة فرعية من القوالب القديمة لم تُحدَّث بعد.',
          'متطلبات الدورانية والتغليف مُدمَجة في قوالب RFx المعيارية وبنود العقود للفئات ذات الصلة، مُطبَّقة باتساق بصرف النظر عمّن يُدير حدث التوريد.',
        ],
      },
      {
        q: 'Does procurement track a supplier\'s actual circular economy performance — recycled content percentage, packaging take-back compliance — over the life of the contract, or is a circular claim made once during the sourcing event and never verified again?',
        qAr: 'هل تتابع المشتريات أداء المورد الفعلي في الاقتصاد الدائري — نسبة المحتوى المُعاد تدويره والامتثال لاسترجاع التغليف — طوال مدة العقد، أم يُقدَّم ادعاء دائري مرة واحدة أثناء حدث التوريد ولا يُتحقَّق منه مجددًا أبدًا؟',
        levels: [
          'A supplier\'s circular claims are made once during the sourcing event, taken at face value, and never checked again for the life of the contract.',
          'Circular claims are occasionally revisited informally when a contract comes up for renewal, but there is no systematic tracking during the life of the contract.',
          'Circular performance metrics have been added to scorecards for a small number of pilot suppliers, but verification is inconsistent and the practice has not been extended broadly.',
          'Supplier circular performance is tracked as a scorecard metric for most relevant suppliers throughout the contract, with periodic verification applied to higher-risk or higher-volume suppliers.',
          'Supplier circular performance (recycled content %, take-back compliance) is tracked as a live scorecard metric throughout the contract, verified periodically, not just claimed once.',
        ],
        levelsAr: [
          'ادعاءات الدورانية للمورد تُقدَّم مرة واحدة أثناء حدث التوريد وتُؤخَذ كما هي ولا تُفحَص مجددًا طوال مدة العقد.',
          'الادعاءات الدائرية تُراجَع أحيانًا بشكل غير رسمي عند اقتراب تجديد العقد، لكن لا توجد متابعة منهجية طوال مدة العقد.',
          'مقاييس أداء دورانية أُضيفت لبطاقات أداء عدد صغير من الموردين التجريبيين، لكن التحقق متفاوت ولم يُوسَّع النطاق بعد على نطاق واسع.',
          'أداء الدورانية للمورد يُتابَع كمقياس بطاقة أداء لمعظم الموردين ذوي الصلة طوال العقد، مع تحقق دوري يُطبَّق على الموردين الأعلى مخاطرة أو الأعلى حجمًا.',
          'أداء الدورانية للمورد (نسبة المحتوى المُعاد تدويره والامتثال لاسترداد التغليف) يُتابَع كمقياس بطاقة أداء حي طوال العقد، ويُتحقَّق منه دوريًا، لا مجرد ادعاء مرة واحدة.',
        ],
      },
      {
        q: 'Is packaging and materials waste data by supplier and category actually visible to procurement — or does that data live entirely with logistics/operations, leaving procurement with no visibility into which of its own sourcing decisions are driving the most waste?',
        qAr: 'هل تكون بيانات نفايات التغليف والمواد حسب المورد والفئة مرئية فعليًا للمشتريات — أم تعيش تلك البيانات بالكامل لدى الخدمات اللوجستية/العمليات، تاركةً المشتريات دون رؤية لأي من قراراتها الخاصة بالتوريد يقود أكبر قدر من النفايات؟',
        levels: [
          'Waste data by supplier or category is not visible to procurement at all; it lives entirely with logistics/operations with no feedback loop back to sourcing decisions.',
          'Procurement receives an annual summary report from operations, but it lacks the supplier/category-level detail needed to connect waste outcomes to specific sourcing decisions.',
          'Procurement can request waste data from logistics/operations and receives it within a reasonable time, but there is no standing, self-service access or automatic feed.',
          'Waste data by supplier and category is shared with procurement on a defined regular cycle, though it is not yet fully self-service or real-time.',
          'Packaging and materials waste data by supplier and category is directly visible to procurement, closing the feedback loop between sourcing decisions and downstream waste outcomes.',
        ],
        levelsAr: [
          'بيانات نفايات التغليف والمواد حسب المورد أو الفئة غير مرئية للمشتريات إطلاقًا؛ وتعيش بالكامل مع الخدمات اللوجستية/العمليات دون حلقة تغذية راجعة لقرارات التوريد.',
          'المشتريات تتلقى تقريرًا ملخصًا سنويًا من العمليات، لكنه يفتقر للتفصيل على مستوى المورد/الفئة اللازم لربط نتائج النفايات بقرارات توريد محددة.',
          'يمكن للمشتريات طلب بيانات النفايات من الخدمات اللوجستية/العمليات وتتلقاها خلال وقت معقول، لكن لا يوجد وصول ذاتي دائم أو تغذية آلية.',
          'بيانات النفايات حسب المورد والفئة تُشارَك مع المشتريات وفق دورة منتظمة محددة، لكنها ليست بعد ذاتية الخدمة أو آنية بالكامل.',
          'بيانات نفايات التغليف والمواد حسب المورد والفئة مرئية مباشرةً للمشتريات، مما يُغلق حلقة التغذية الراجعة بين قرارات التوريد ونتائج النفايات اللاحقة.',
        ],
      },
      {
        q: 'How quickly can procurement identify which of its current suppliers or contracts involve the highest volumes of single-use or non-recyclable packaging — as concrete candidates for near-term redesign — rather than this being unknown until someone happens to investigate?',
        qAr: 'ما مدى سرعة قدرة المشتريات على تحديد أي من مورديها أو عقودها الحالية ينطوي على أعلى أحجام تغليف أحادي الاستخدام أو غير قابل لإعادة التدوير — كمرشحين ملموسين لإعادة التصميم قريب المدى — بدلاً من أن يبقى ذلك مجهولاً حتى يحقق أحدهم فيه صدفةً؟',
        levels: [
          'Identifying which suppliers or contracts drive the most single-use/non-recyclable packaging would require a dedicated one-off investigation; there\'s no ready answer to this question.',
          'A rough sense of which suppliers use the most packaging exists anecdotally among category managers, but nothing is documented or data-backed.',
          'A one-off analysis has identified the highest single-use packaging suppliers, but the analysis has not been repeated or kept current since.',
          'The highest single-use/non-recyclable-packaging suppliers can be identified from existing data within a few days, though the data is not yet organised for instant, on-demand lookup.',
          'The highest single-use/non-recyclable-packaging suppliers or contracts are readily identifiable from existing data at any time, actively used to prioritise redesign candidates.',
        ],
        levelsAr: [
          'تحديد أي الموردين أو العقود يقود أكثر تغليف أحادي الاستخدام/غير قابل لإعادة التدوير يستلزم تحقيقًا مخصصًا لمرة واحدة؛ ولا توجد إجابة جاهزة لهذا السؤال.',
          'لدى مديري الفئات إحساس تقريبي غير موثّق بأي الموردين يستخدمون أكثر التغليف، لكن لا شيء موثّق أو مدعوم بالبيانات.',
          'تحليل لمرة واحدة حدد الموردين الأعلى في التغليف أحادي الاستخدام، لكن التحليل لم يُكرَّر أو يُبقَ حديثًا منذ ذلك الحين.',
          'الموردون الأعلى في التغليف أحادي الاستخدام/غير القابل لإعادة التدوير يمكن تحديدهم من البيانات القائمة خلال أيام قليلة، لكن البيانات ليست منظَّمة بعد للبحث الفوري عند الطلب.',
          'الموردون أو العقود الأعلى في التغليف أحادي الاستخدام/غير القابل لإعادة التدوير يمكن تحديدهم بسهولة من البيانات القائمة في أي وقت، وتُستخدَم فعليًا لترتيب أولويات مرشحي إعادة التصميم.',
        ],
      },
      {
        q: 'Are supplier claims of recycled content or circular packaging independently substantiated — through certification or testing — rather than taken on trust from the supplier\'s own marketing material or self-declaration?',
        qAr: 'هل تُثبَت ادعاءات الموردين بشأن المحتوى المُعاد تدويره أو التغليف الدائري بشكل مستقل — عبر شهادة أو اختبار — بدلاً من قبولها ثقةً من مواد تسويق المورد نفسه أو إقراره الذاتي؟',
        levels: [
          'Recycled content and circular claims are taken on trust from supplier marketing material, with no independent substantiation.',
          'Recycled content claims are occasionally cross-checked against a supplier\'s certification documents when provided voluntarily, but no systematic substantiation is requested.',
          'A substantiation requirement exists for the highest-profile claims, but it is applied inconsistently and most claims still rely on supplier self-declaration.',
          'Recycled content and circularity claims above the materiality threshold are substantiated for most relevant suppliers, though certification coverage for smaller suppliers remains incomplete.',
          'Recycled content and circularity claims above a materiality threshold require independent certification or testing before being relied upon in sourcing decisions or external reporting.',
        ],
        levelsAr: [
          'ادعاءات المحتوى المُعاد تدويره والدورانية تُؤخَذ ثقةً من مواد تسويق المورد الخاصة، دون إثبات مستقل.',
          'ادعاءات المحتوى المُعاد تدويره تُقارَن أحيانًا بوثائق شهادة المورد عند تقديمها طواعية، لكن لا يُطلَب إثبات منهجي.',
          'متطلب إثبات موجود لأبرز الادعاءات، لكنه يُطبَّق بتفاوت ولا تزال معظم الادعاءات تعتمد على الإقرار الذاتي للمورد.',
          'ادعاءات المحتوى المُعاد تدويره والدورانية فوق عتبة الجوهرية تُثبَت لمعظم الموردين ذوي الصلة، لكن تغطية الشهادات للموردين الأصغر تبقى غير مكتملة.',
          'ادعاءات المحتوى المُعاد تدويره والدورانية فوق عتبة جوهرية تستلزم شهادة أو اختبارًا مستقلاً قبل الاعتماد عليها في قرارات التوريد أو التقارير الخارجية.',
        ],
      },
      {
        q: 'Is packaging and material composition data tracked automatically across the supplier base — through a materials database or supplier data platform — or manually compiled item-by-item whenever someone needs an answer?',
        qAr: 'هل تُتابَع بيانات تركيبة التغليف والمواد آليًا عبر قاعدة الموردين — عبر قاعدة بيانات مواد أو منصة بيانات موردين — أم تُجمَّع يدويًا صنفًا بصنف كلما احتاج أحدهم إجابة؟',
        levels: [
          'Packaging and material composition data is compiled manually, item by item, only when someone specifically needs an answer, with nothing maintained centrally.',
          'A shared spreadsheet consolidates packaging and material data that was previously scattered across individual files, but updates still require manual compilation.',
          'A basic materials database has been built and covers a subset of categories, but most of the supply base is still tracked in spreadsheets outside the system.',
          'An integrated materials database covers most of the supply base and is queryable at any time, with a remaining subset of categories still requiring manual compilation.',
          'Packaging and material composition data is automatically tracked across the supplier base through an integrated materials database, queryable at any time without manual compilation.',
        ],
        levelsAr: [
          'بيانات تركيبة التغليف والمواد تُجمَّع يدويًا صنفًا تلو آخر فقط عندما يحتاج أحدهم إجابة تحديدًا، دون شيء يُصان مركزيًا.',
          'جدول بيانات مشترك يوحّد بيانات التغليف والمواد التي كانت مبعثرة سابقًا عبر ملفات فردية، لكن التحديثات لا تزال تستلزم تجميعًا يدويًا.',
          'قاعدة بيانات مواد أساسية بُنيت وتغطي مجموعة فرعية من الفئات، لكن معظم قاعدة الموردين لا تزال تُتابَع في جداول بيانات خارج النظام.',
          'قاعدة بيانات مواد متكاملة تغطي معظم قاعدة الموردين وقابلة للاستعلام في أي وقت، مع بقاء مجموعة فرعية من الفئات تستلزم تجميعًا يدويًا.',
          'بيانات تركيبة التغليف والمواد تُتابَع آليًا عبر قاعدة الموردين من خلال قاعدة بيانات مواد متكاملة، قابلة للاستعلام في أي وقت دون تجميع يدوي.',
        ],
      },
      {
        q: 'Are purchasing specifications and packaging requirements formally aligned to applicable extended producer responsibility and packaging regulations in the markets where the organisation operates — rather than circularity being purely a voluntary internal ambition disconnected from actual regulatory obligation?',
        qAr: 'هل تُواءَم مواصفات الشراء ومتطلبات التغليف رسميًا مع لوائح مسؤولية المنتج الممتدة والتغليف المُطبَّقة في الأسواق التي تعمل بها المؤسسة — بدلاً من أن يكون التوجه الدائري طموحًا داخليًا طوعيًا بحتًا منفصلاً عن الالتزام التنظيمي الفعلي؟',
        levels: [
          'Circular economy activity is treated purely as a voluntary internal ambition, with no formal check against actual extended producer responsibility or packaging regulatory obligations.',
          'There is general awareness that extended producer responsibility regulation applies in some markets of operation, but purchasing specifications have not been formally reviewed against it.',
          'A regulatory alignment review has been conducted for the organisation\'s largest market, but it has not been extended to other markets of operation.',
          'Purchasing specifications and packaging requirements are reviewed against applicable extended producer responsibility and packaging regulation in most markets of operation, with compliance tracking not yet complete for smaller or newer markets.',
          'Purchasing specifications and packaging requirements are formally reviewed and aligned against applicable extended producer responsibility and packaging regulation in every market of operation, with compliance tracked.',
        ],
        levelsAr: [
          'نشاط الاقتصاد الدائري يُعامَل كطموح داخلي طوعي بحت، دون فحص رسمي مقابل التزامات تنظيمية فعلية لمسؤولية المنتج الممتدة أو التغليف.',
          'هناك وعي عام بأن تنظيم مسؤولية المنتج الممتدة ينطبق في بعض أسواق التشغيل، لكن مواصفات الشراء لم تُراجَع رسميًا مقابله.',
          'مراجعة مواءمة تنظيمية أُجريت لأكبر سوق للمؤسسة، لكنها لم تُوسَّع إلى أسواق التشغيل الأخرى.',
          'مواصفات الشراء ومتطلبات التغليف تُراجَع مقابل تنظيم مسؤولية المنتج الممتدة والتغليف المنطبق في معظم أسواق التشغيل، مع عدم اكتمال متابعة الامتثال بعد للأسواق الأصغر أو الأحدث.',
          'مواصفات الشراء ومتطلبات التغليف تُراجَع وتُواءَم رسميًا مقابل تنظيم مسؤولية المنتج الممتدة والتغليف المنطبق في كل سوق تشغيل، والامتثال يُتابَع.',
        ],
      },
      {
        q: 'Does reliance on recycled or circular material inputs create its own supply risk — a narrower or less mature supplier pool for recycled feedstock — that is deliberately balanced against circularity goals rather than pursued without regard for the continuity trade-off it can create?',
        qAr: 'هل يخلق الاعتماد على مدخلات مواد مُعاد تدويرها أو دائرية مخاطرة توريد خاصة به — قاعدة موردين أضيق أو أقل نضجًا للمواد الخام المُعاد تدويرها — تُوازَن عمدًا مقابل أهداف الدائرية بدلاً من متابعتها دون اعتبار للمقايضة مع الاستمرارية التي يمكن أن تخلقها؟',
        levels: [
          'Circularity targets are pursued without any assessment of whether the supply of recycled/circular material inputs is itself reliable, mature, or diversified enough to sustain the commitment.',
          'There is informal awareness among some category managers that recycled feedstock suppliers can be less mature or reliable, but no assessment has been conducted to quantify this.',
          'A supply risk assessment of recycled material inputs has been conducted for a small number of the highest-circularity categories, but it is not a standard, repeated practice.',
          'Supply risk of recycled/circular material inputs is assessed for most relevant categories and factored into circularity targets, though formal contingency planning is not yet in place for every narrow-pool case.',
          'The supply risk of recycled/circular material inputs is explicitly assessed and deliberately balanced against circularity ambition, with contingency planning where the recycled-material supplier pool is narrow or immature.',
        ],
        levelsAr: [
          'مستهدفات الدورانية تُتابَع دون أي تقييم لما إذا كان إمداد المدخلات المُعاد تدويرها/الدائرية موثوقًا أو ناضجًا أو مُنوَّعًا بما يكفي لاستدامة الالتزام.',
          'هناك إدراك غير رسمي لدى بعض مديري الفئات بأن موردي المواد المُعاد تدويرها قد يكونون أقل نضجًا أو موثوقية، لكن لم يُجرَ تقييم لقياس ذلك.',
          'تقييم لمخاطر إمداد المدخلات المُعاد تدويرها أُجري لعدد صغير من الفئات الأعلى دورانية، لكنه ليس ممارسة معيارية متكررة.',
          'مخاطر إمداد المدخلات المُعاد تدويرها/الدائرية تُقيَّم لمعظم الفئات ذات الصلة وتُدرَج في مستهدفات الدورانية، لكن التخطيط الاحتياطي الرسمي ليس قائمًا بعد لكل حالة ذات مجموعة ضيقة.',
          'مخاطر إمداد المدخلات المُعاد تدويرها/الدائرية تُقيَّم صراحةً وتُوازَن عمدًا مقابل طموح الدورانية، بتخطيط احتياطي حيث تكون مجموعة موردي المواد المُعاد تدويرها ضيقة أو غير ناضجة.',
        ],
      },
    ],
  },
  {
    id: 'esg-governance',
    title: 'ESG Governance & Disclosure',
    titleAr: 'حوكمة ESG والإفصاح',
    hint: 'Assesses the board-level ownership, executive accountability structures, and quality of public sustainability disclosure for supply chain ESG.',
    hintAr: 'يقيس ملكية مجلس الإدارة وهياكل المساءلة التنفيذية وجودة الإفصاح العلني عن الاستدامة في سلسلة الإمداد.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.5, other: 1.0,
    },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'Is there a clearly named individual accountable specifically for supply chain and supplier ESG performance — with defined authority to set and enforce supplier ESG requirements — rather than supply chain ESG being a diffuse, unowned responsibility inside the broader corporate sustainability function?',
        qAr: 'هل يوجد فرد مُسمّى بوضوح مسؤول تحديدًا عن أداء ESG لسلسلة الإمداد والموردين — بصلاحية محددة لوضع وإنفاذ متطلبات ESG للموردين — بدلاً من أن يكون ESG لسلسلة الإمداد مسؤولية مبعثرة وغير مملوكة داخل وظيفة الاستدامة المؤسسية الأوسع؟',
        levels: [
          'No individual is specifically accountable for supply chain/supplier ESG; it falls into the gap between corporate sustainability (which doesn\'t own supplier relationships) and procurement (which may not see ESG as its job).',
          'A senior category manager has informally taken on supply chain ESG topics alongside their main role, but there is no formal designation or defined authority.',
          'A role has been formally named as accountable for supply chain ESG, but the role lacks defined enforcement authority over category managers who don\'t prioritise it.',
          'A named individual holds accountability and most of the authority needed to set supplier ESG requirements, formally recognised in the org structure, though enforcement power over resistant business units is not yet fully tested or complete.',
          'A named individual holds clear accountability and enforcement authority for supply chain ESG performance, formally recognised in the procurement organisation\'s structure.',
        ],
        levelsAr: [
          'لا يوجد فرد مسؤول تحديدًا عن أداء ESG لسلسلة الإمداد/الموردين؛ ويقع الأمر في الفجوة بين الاستدامة المؤسسية (التي لا تملك علاقات الموردين) والمشتريات (التي قد لا ترى ESG كجزء من مهمتها).',
          'مدير فئة كبير تولى بشكل غير رسمي مواضيع ESG لسلسلة الإمداد إلى جانب دوره الأساسي، لكن دون تسمية رسمية أو صلاحية محددة.',
          'دور سُمّي رسميًا كمسؤول عن ESG لسلسلة الإمداد، لكن الدور يفتقر لصلاحية إنفاذ محددة على مديري الفئات الذين لا يُعطونه الأولوية.',
          'فرد مُسمّى يحمل المساءلة ومعظم الصلاحية اللازمة لوضع متطلبات ESG للموردين، مُعترَف به رسميًا في الهيكل التنظيمي، لكن صلاحية الإنفاذ على وحدات الأعمال المقاومة ليست مُختبَرة أو مكتملة بعد بالكامل.',
          'فرد مُسمّى يحمل مساءلة واضحة وصلاحية إنفاذ لأداء ESG في سلسلة الإمداد، مُعترَف به رسميًا في هيكل تنظيم المشتريات.',
        ],
      },
      {
        q: 'Does procurement have its own documented Responsible/Sustainable Procurement policy — aligned to ISO 20400 or an equivalent standard, formally approved above the procurement function itself — or does supplier ESG expectation exist only informally, varying by whoever happens to be running a given sourcing event?',
        qAr: 'هل تملك المشتريات سياسة موثّقة خاصة بها للمشتريات المسؤولة/المستدامة — مُواءَمة مع ISO 20400 أو معيار معادل، معتمدة رسميًا فوق وظيفة المشتريات نفسها — أم توجد توقعات ESG للموردين بشكل غير رسمي فقط، تتفاوت حسب من يُدير حدث توريد معين؟',
        levels: [
          'Supplier ESG expectations exist only informally and vary by individual buyer; there is no documented, formally approved responsible procurement policy.',
          'A draft responsible procurement policy has been written, but it has not been formally approved above the procurement function and is not yet communicated to buyers.',
          'A responsible procurement policy has been approved within procurement itself, but it has not been elevated to formal approval above the function, and application by individual buyers is still inconsistent.',
          'A documented, formally approved Responsible Procurement policy aligned to ISO 20400 or equivalent exists and is applied by most buyers, with a subset of legacy categories or contracts not yet brought into alignment.',
          'A documented Responsible/Sustainable Procurement policy aligned to ISO 20400 or equivalent is formally approved above the procurement function and consistently applied.',
        ],
        levelsAr: [
          'توقعات ESG للموردين موجودة بشكل غير رسمي فقط وتتفاوت حسب المشتري الفردي؛ ولا توجد سياسة مشتريات مسؤولة موثّقة ومعتمدة رسميًا.',
          'سياسة مشتريات مسؤولة مسودة كُتبت، لكنها لم تُعتمَد رسميًا فوق وظيفة المشتريات ولم تُبلَّغ بعد للمشترين.',
          'سياسة مشتريات مسؤولة اعتُمدت داخل المشتريات نفسها، لكنها لم تُرفَع للاعتماد الرسمي فوق الوظيفة، ولا يزال تطبيقها من قبل المشترين الأفراد متفاوتًا.',
          'سياسة مشتريات مسؤولة موثّقة ومعتمدة رسميًا ومواءَمة مع ISO 20400 أو ما يعادله موجودة ويُطبّقها معظم المشترين، مع بقاء مجموعة فرعية من الفئات أو العقود القديمة لم تُواءَم بعد.',
          'سياسة مشتريات مسؤولة/مستدامة موثّقة مواءَمة مع ISO 20400 أو ما يعادله معتمدة رسميًا فوق وظيفة المشتريات ومُطبَّقة باتساق.',
        ],
      },
      {
        q: 'How systematically does procurement supply the underlying supplier-level ESG data that feeds the organisation\'s external ESG disclosures — sustainability report, investor ESG questionnaires, customer ESG requests — or does the sustainability/IR team have to chase procurement reactively for this data every single time a disclosure deadline comes around?',
        qAr: 'ما مدى منهجية توفير المشتريات لبيانات ESG على مستوى المورد التي تُغذّي إفصاحات ESG الخارجية للمؤسسة — تقرير الاستدامة واستبيانات ESG للمستثمرين وطلبات ESG للعملاء — أم يضطر فريق الاستدامة/علاقات المستثمرين لملاحقة المشتريات تفاعليًا لهذه البيانات في كل مرة يقترب فيها موعد إفصاح؟',
        levels: [
          'The sustainability/IR team has to chase procurement reactively, from scratch, every time an ESG disclosure deadline comes around; there is no standing data supply relationship.',
          'Procurement provides data when asked, and has begun keeping a running file of common requests, which speeds up some responses but remains fundamentally reactive.',
          'A semi-regular data hand-off happens ahead of the annual sustainability report, but ad hoc requests throughout the year still trigger a reactive scramble.',
          'Procurement supplies supplier ESG data on a defined cycle for most standard disclosures, with occasional ad hoc requests (e.g. a new customer questionnaire) still requiring reactive follow-up.',
          'Procurement proactively and systematically supplies current supplier ESG data on a defined cycle that feeds directly into external disclosures, with no reactive scrambling required.',
        ],
        levelsAr: [
          'فريق الاستدامة/علاقات المستثمرين يضطر لملاحقة المشتريات بشكل تفاعلي من الصفر في كل مرة يقترب فيها موعد إفصاح ESG؛ ولا توجد علاقة إمداد بيانات ثابتة.',
          'المشتريات تُقدّم البيانات عند الطلب، وبدأت بالاحتفاظ بملف جارٍ للطلبات الشائعة، مما يُسرّع بعض الاستجابات لكنه يبقى تفاعليًا في جوهره.',
          'تسليم بيانات شبه منتظم يحدث قبيل تقرير الاستدامة السنوي، لكن الطلبات الارتجالية طوال العام لا تزال تُطلق بحثًا تفاعليًا محمومًا.',
          'المشتريات تُمِد ببيانات ESG للموردين وفق دورة محددة لمعظم الإفصاحات المعيارية، مع احتياج الطلبات الارتجالية العرضية (كاستبيان عميل جديد) لمتابعة تفاعلية أحيانًا.',
          'المشتريات تُمِد استباقيًا ومنهجيًا ببيانات ESG حديثة للموردين وفق دورة محددة تُغذّي مباشرةً الإفصاحات الخارجية، دون الحاجة لملاحقة تفاعلية.',
        ],
      },
      {
        q: 'Are supplier ESG expectations communicated proactively and consistently to the entire supply base — through a published supplier code of conduct and a standard onboarding requirement — or only surfaced reactively when a specific customer or investor happens to ask about a specific supplier?',
        qAr: 'هل تُبلَّغ توقعات ESG للموردين استباقيًا وباتساق لكامل قاعدة التوريد — عبر مدونة سلوك موردين منشورة ومتطلب تأهيل موحَّد — أم تظهر فقط بشكل تفاعلي عندما يسأل عميل أو مستثمر محدد صدفةً عن مورد معين؟',
        levels: [
          'Supplier ESG expectations are only communicated reactively, in response to a specific customer or investor query about a specific supplier; there is no proactive, standard communication to the supply base.',
          'A code of conduct document exists and is shared with suppliers upon specific request, but it is not a standard part of onboarding and most existing suppliers have never received it.',
          'The code of conduct has been added to the onboarding packet for new suppliers, but existing suppliers onboarded before the change have not been proactively reached.',
          'Supplier ESG expectations are communicated through a published code of conduct and mandatory onboarding requirement for most of the supply base, with a residual population of legacy suppliers not yet covered.',
          'Supplier ESG expectations are proactively and consistently communicated to the entire supply base through a published code of conduct and mandatory onboarding requirement, independent of any external query.',
        ],
        levelsAr: [
          'توقعات ESG للموردين تُبلَّغ فقط بشكل تفاعلي، استجابةً لاستفسار محدد من عميل أو مستثمر حول مورد محدد؛ ولا يوجد تواصل استباقي ومعياري لقاعدة الموردين.',
          'وثيقة ميثاق سلوك موجودة وتُشارَك مع الموردين عند طلب محدد، لكنها ليست جزءًا معياريًا من الضمّ ولم يتلقاها معظم الموردين الحاليين أبدًا.',
          'ميثاق السلوك أُضيف لحزمة ضمّ الموردين الجدد، لكن الموردين الحاليين الذين انضموا قبل التغيير لم يتم الوصول إليهم استباقيًا.',
          'توقعات ESG للموردين تُبلَّغ عبر ميثاق سلوك منشور ومتطلب ضمّ إلزامي لمعظم قاعدة الموردين، مع بقاء مجموعة متبقية من الموردين القدامى غير مشمولة بعد.',
          'توقعات ESG للموردين تُبلَّغ استباقيًا وباتساق لكامل قاعدة الموردين عبر ميثاق سلوك منشور ومتطلب ضمّ إلزامي، بمعزل عن أي استفسار خارجي.',
        ],
      },
      {
        q: 'Is supplier ESG scorecard data kept current and centrally accessible — or does producing an up-to-date view require manually chasing multiple category managers, each holding their own partial, possibly outdated slice of the picture?',
        qAr: 'هل تُبقى بيانات بطاقة تقييم ESG للموردين حديثة ومتاحة مركزيًا — أم يستلزم إنتاج عرض محدَّث ملاحقة يدوية لعدة مديري فئات، كل منهم يملك شريحة جزئية وربما قديمة من الصورة؟',
        levels: [
          'An up-to-date view of supplier ESG performance requires manually chasing multiple category managers, each holding a partial and possibly outdated slice of the data.',
          'A central repository exists, but many category managers still keep their own working copies, so the central version often lags behind reality.',
          'The central repository is the primary source for most categories, but a subset of category managers still updates it inconsistently, requiring occasional direct follow-up.',
          'Supplier ESG scorecard data is maintained centrally and kept current for most of the supply base, with occasional lag for smaller or less-frequently-reviewed suppliers.',
          'Supplier ESG scorecard data is maintained centrally and kept current, giving anyone who needs it a single, reliable, up-to-date view without chasing individuals.',
        ],
        levelsAr: [
          'الحصول على رؤية حديثة لأداء ESG للموردين يستلزم ملاحقة عدة مديري فئات يدويًا، كل منهم يحمل شريحة جزئية وربما قديمة من الصورة.',
          'مستودع مركزي موجود، لكن لا يزال العديد من مديري الفئات يحتفظون بنسخهم الخاصة، لذا غالبًا ما تتأخر النسخة المركزية عن الواقع.',
          'المستودع المركزي هو المصدر الأساسي لمعظم الفئات، لكن مجموعة فرعية من مديري الفئات لا تزال تُحدّثه بتفاوت، مما يستلزم متابعة مباشرة أحيانًا.',
          'بيانات بطاقة أداء ESG للموردين تُصان مركزيًا وتبقى حديثة لمعظم قاعدة الموردين، مع تأخر أحيانًا للموردين الأصغر أو الأقل مراجعة.',
          'بيانات بطاقة أداء ESG للموردين تُصان مركزيًا وتبقى حديثة، مما يمنح أي شخص يحتاجها رؤية واحدة موثوقة وحديثة دون ملاحقة أفراد.',
        ],
      },
      {
        q: 'How quickly can procurement respond to an ad-hoc customer or investor ESG questionnaire about the supply base with accurate, current data — versus a multi-week scramble across category managers and supplier files every time one arrives?',
        qAr: 'ما مدى سرعة استجابة المشتريات لاستبيان ESG مخصص من عميل أو مستثمر بشأن قاعدة التوريد ببيانات دقيقة وحديثة — مقابل بحث محموم لعدة أسابيع عبر مديري الفئات وملفات الموردين في كل مرة يصل فيها استبيان؟',
        levels: [
          'An ad-hoc ESG questionnaire from a customer or investor triggers a multi-week scramble across category managers and supplier files to assemble an answer.',
          'A partial record of previously answered questionnaires exists, which speeds up some responses, but a new questionnaire still typically triggers a week-plus effort.',
          'A central supplier ESG record covers most strategic suppliers, cutting typical response time to roughly one to two weeks, though gaps still require manual follow-up.',
          'Most ad-hoc ESG questionnaires can be answered within about a week from the maintained record, with only unusual or highly detailed requests still requiring extended manual work.',
          'An ad-hoc ESG questionnaire can be answered with accurate, current data within days, drawn directly from the maintained central supplier ESG record.',
        ],
        levelsAr: [
          'استبيان ESG ارتجالي من عميل أو مستثمر يُطلق بحثًا محمومًا لأسابيع عبر مديري الفئات وملفات الموردين لتجميع إجابة.',
          'سجل جزئي للاستبيانات المُجاب عنها سابقًا موجود، مما يُسرّع بعض الاستجابات، لكن استبيانًا جديدًا لا يزال يستدعي عادةً جهدًا يتجاوز الأسبوع.',
          'سجل مركزي لـESG الموردين يغطي معظم الموردين الاستراتيجيين، مما يُقلّص وقت الاستجابة النموذجي إلى أسبوع أو أسبوعين تقريبًا، لكن الفجوات لا تزال تستلزم متابعة يدوية.',
          'معظم استبيانات ESG الارتجالية يمكن الإجابة عنها خلال أسبوع تقريبًا من السجل المُصان، مع احتياج الطلبات غير المعتادة أو المفصَّلة جدًا فقط لعمل يدوي ممتد.',
          'استبيان ESG ارتجالي يمكن الإجابة عنه ببيانات دقيقة وحديثة خلال أيام، مُستمَدة مباشرةً من سجل ESG المركزي المُصان للموردين.',
        ],
      },
      {
        q: 'Is supplier ESG data independently assured or audited before it is used in external disclosure — protecting the organisation from publishing supplier ESG claims that later turn out to be inaccurate or unsubstantiated — rather than data simply flowing through from supplier self-report to public disclosure with no check in between?',
        qAr: 'هل تُضمَن أو تُدقَّق بيانات ESG للموردين بشكل مستقل قبل استخدامها في الإفصاح الخارجي — لحماية المؤسسة من نشر ادعاءات ESG للموردين يتضح لاحقًا أنها غير دقيقة أو غير مثبتة — بدلاً من تدفق البيانات ببساطة من تقرير المورد الذاتي إلى الإفصاح العلني دون فحص بينهما؟',
        levels: [
          'Supplier ESG data flows directly from supplier self-report into external disclosure, with no independent check in between; the organisation is exposed if any of it turns out to be inaccurate.',
          'Supplier ESG data is reviewed internally by the sustainability team for plausibility before disclosure, but this is not the same as independent third-party assurance.',
          'External assurance has been obtained once for the sustainability report as a whole, but supplier-level ESG data specifically has not been separately or repeatedly assured.',
          'Supplier ESG data used in material external disclosures is assured or audited for most categories, though the assurance process is not yet extended to every disclosure channel (e.g. individual customer questionnaires).',
          'Supplier ESG data used in material external disclosures is independently assured or audited before publication, protecting the organisation from disclosing unsubstantiated claims.',
        ],
        levelsAr: [
          'بيانات ESG للموردين تتدفق مباشرةً من التقرير الذاتي للمورد إلى الإفصاح الخارجي، دون فحص مستقل بينهما؛ والمؤسسة معرَّضة إذا تبيّن عدم دقة أي منها.',
          'بيانات ESG للموردين تُراجَع داخليًا من فريق الاستدامة للتحقق من معقوليتها قبل الإفصاح، لكن هذا ليس بمثابة ضمان مستقل من طرف ثالث.',
          'ضمان خارجي حُصِل عليه مرة واحدة لتقرير الاستدامة ككل، لكن بيانات ESG على مستوى المورد تحديدًا لم تُضمَن بشكل منفصل أو متكرر.',
          'بيانات ESG للموردين المستخدَمة في الإفصاحات الخارجية الجوهرية تُضمَن أو تُدقَّق لمعظم الفئات، لكن عملية الضمان لم تُوسَّع بعد لكل قناة إفصاح (كاستبيانات العملاء الفردية).',
          'بيانات ESG للموردين المستخدَمة في الإفصاحات الخارجية الجوهرية تُضمَن أو تُدقَّق بشكل مستقل قبل النشر، مما يحمي المؤسسة من الإفصاح عن ادعاءات غير مُثبَتة.',
        ],
      },
      {
        q: 'Is supplier ESG data held in a single centralised platform accessible to both procurement and the sustainability/IR function — or scattered across individual category managers\' spreadsheets with no shared system of record?',
        qAr: 'هل تُحفَظ بيانات ESG للموردين في منصة مركزية واحدة يمكن لكل من المشتريات ووظيفة الاستدامة/علاقات المستثمرين الوصول إليها — أم مبعثرة عبر جداول بيانات مديري الفئات الفرديين دون نظام سجل مشترك؟',
        levels: [
          'Supplier ESG data is scattered across individual category managers\' personal spreadsheets, with no shared, centralised system of record.',
          'A shared drive folder consolidates spreadsheets from different category managers in one place, reducing scatter somewhat, but each spreadsheet still has its own format and update cadence.',
          'A centralised platform has been implemented and is used for a subset of categories, but the remaining categories still rely on individual spreadsheets outside the system.',
          'Supplier ESG data is held in a centralised platform accessible to both procurement and sustainability/IR for most of the supply base, with a residual set of legacy records not yet migrated.',
          'Supplier ESG data is held in a single centralised platform accessible to both procurement and sustainability/IR, eliminating scattered, duplicated, or conflicting records.',
        ],
        levelsAr: [
          'بيانات ESG للموردين مبعثرة عبر جداول بيانات شخصية لمديري فئات فرديين، دون نظام سجل مشترك مركزي.',
          'مجلد مشترك يوحّد جداول بيانات مديري الفئات المختلفين في مكان واحد، مما يُقلّل التبعثر إلى حد ما، لكن لكل جدول بيانات تنسيقه ووتيرة تحديثه الخاصة.',
          'منصة مركزية نُفِّذت وتُستخدَم لمجموعة فرعية من الفئات، لكن الفئات المتبقية لا تزال تعتمد على جداول بيانات فردية خارج النظام.',
          'بيانات ESG للموردين محفوظة في منصة مركزية يمكن للمشتريات وفريق الاستدامة/علاقات المستثمرين الوصول إليها لمعظم قاعدة الموردين، مع بقاء مجموعة متبقية من السجلات القديمة لم تُنقَل بعد.',
          'بيانات ESG للموردين محفوظة في منصة مركزية واحدة يمكن للمشتريات وفريق الاستدامة/علاقات المستثمرين الوصول إليها، مما يُلغي السجلات المبعثرة أو المكررة أو المتضاربة.',
        ],
      },
      {
        q: 'Does procurement\'s ESG governance structure have real, exercised authority to actually block or pause a sourcing decision on ESG grounds — or does ESG governance exist on paper with no track record of ever actually stopping a business unit that wanted to proceed anyway?',
        qAr: 'هل يملك هيكل حوكمة ESG للمشتريات صلاحية حقيقية ومُمارَسة لإيقاف أو تعليق قرار توريد فعليًا لأسباب ESG — أم توجد حوكمة ESG على الورق دون سجل بإيقاف وحدة أعمال أرادت المضي قدمًا فعليًا؟',
        levels: [
          'ESG governance exists as a policy document but has no real track record of ever blocking or pausing a sourcing decision that a determined business unit wanted to push through.',
          'The governance structure has documented authority on paper, but it has never actually been tested — no sourcing decision has yet been challenged on ESG grounds.',
          'The governance structure has intervened informally in a small number of cases, such as raising a concern that led to delay, but it has not yet formally blocked a sourcing decision outright.',
          'ESG governance has documented authority to block or pause sourcing decisions and has exercised it in a small number of specific, documented cases, though this remains the exception rather than an established pattern.',
          'ESG governance has clear, documented authority to block or pause sourcing decisions on ESG grounds, with a real track record of having exercised that authority.',
        ],
        levelsAr: [
          'حوكمة ESG موجودة كوثيقة سياسة لكن دون سجل فعلي لإيقاف أو تعليق أي قرار توريد أرادت وحدة أعمال مُصمّمة المضي فيه.',
          'هيكل الحوكمة يملك صلاحية موثّقة على الورق، لكنها لم تُختبَر فعليًا قط — ولم يُتحدَّ أي قرار توريد بعد على أسس ESG.',
          'هيكل الحوكمة تدخّل بشكل غير رسمي في عدد صغير من الحالات (كإثارة مخاوف أدت لتأخير)، لكنه لم يُوقِف بعد رسميًا قرار توريد بشكل قاطع.',
          'حوكمة ESG تملك صلاحية موثّقة لإيقاف أو تعليق قرارات التوريد ومارستها في عدد صغير من الحالات المحددة والموثّقة، لكن هذا يبقى الاستثناء لا نمطًا راسخًا.',
          'حوكمة ESG تملك صلاحية واضحة وموثّقة لإيقاف أو تعليق قرارات التوريد على أسس ESG، بسجل فعلي لممارسة تلك الصلاحية.',
        ],
      },
      {
        q: 'Could the organisation withstand hostile third-party scrutiny — an NGO campaign, investigative journalism, or an activist investor challenge — into its supply chain ESG claims without being caught contradicted by its own underlying data, or is public-facing ESG messaging materially ahead of what the underlying supplier data would actually support?',
        qAr: 'هل يمكن للمؤسسة الصمود أمام تدقيق معادٍ من طرف ثالث — حملة منظمة غير حكومية أو صحافة استقصائية أو تحدٍّ من مستثمر ناشط — بشأن ادعاءات ESG لسلسلة إمدادها دون أن تُضبَط متناقضة مع بياناتها الكامنة الخاصة، أم أن خطاب ESG الموجَّه للجمهور متقدم جوهريًا على ما تدعمه بيانات الموردين الكامنة فعليًا؟',
        levels: [
          'Public ESG messaging about the supply chain is materially ahead of what the underlying supplier data would actually support; a determined external investigation would likely find contradictions.',
          'Public ESG messaging has been reviewed once informally against underlying data by the sustainability team, but no systematic test against a hostile-scrutiny standard has been conducted.',
          'A gap analysis between public messaging and underlying supplier data has been conducted for the most visible claims, and some overstated language has been corrected, but the review is not repeated on a defined cycle.',
          'Public ESG claims about the supply chain are substantiated by underlying data for most material claims, with periodic testing against an external-scrutiny standard, though a handful of legacy statements have not yet been re-reviewed.',
          'Public ESG claims about the supply chain are fully substantiated by underlying, verifiable supplier data, tested periodically against the standard a hostile external investigation would apply.',
        ],
        levelsAr: [
          'رسائل ESG العلنية حول سلسلة الإمداد متقدمة جوهريًا على ما تدعمه بيانات الموردين الكامنة فعليًا؛ ومن المرجح أن يجد تحقيق خارجي مُصمِّم تناقضات.',
          'رسائل ESG العلنية رُوجِعت مرة واحدة بشكل غير رسمي مقابل البيانات الكامنة من فريق الاستدامة، لكن لم يُجرَ اختبار منهجي مقابل معيار التدقيق الخارجي المعادي.',
          'تحليل فجوة بين الرسائل العلنية والبيانات الكامنة للموردين أُجري لأبرز الادعاءات، وصُحِّحت بعض الصياغات المبالغ فيها، لكن المراجعة لا تتكرر وفق دورة محددة.',
          'ادعاءات ESG العلنية حول سلسلة الإمداد مُثبَتة ببيانات كامنة لمعظم الادعاءات الجوهرية، باختبار دوري مقابل معيار التدقيق الخارجي، لكن عددًا قليلاً من التصريحات القديمة لم يُعَد مراجعته بعد.',
          'ادعاءات ESG العلنية حول سلسلة الإمداد مُثبَتة بالكامل ببيانات موردين كامنة وقابلة للتحقق، تُختبَر دوريًا مقابل المعيار الذي سيُطبّقه تحقيق خارجي معادٍ.',
        ],
      },
    ],
  },
  {
    id: 'esg-supplier-diversity',
    title: 'Supplier Diversity & Inclusive Sourcing',
    titleAr: 'تنويع الموردين والتوريد الشامل',
    hint: 'Assesses whether procurement has a deliberate, resourced strategy for sourcing from diverse suppliers (SMEs, women-owned, minority/disability-owned, social enterprises) as a voluntary ESG commitment — distinct from mandatory local-content or workforce-nationalisation compliance programmes covered elsewhere.',
    hintAr: 'يقيم ما إذا كانت المشتريات تملك استراتيجية متعمدة ومدعومة بالموارد للتوريد من موردين متنوعين (منشآت صغيرة ومتوسطة وشركات مملوكة لنساء أو أقليات أو ذوي إعاقة ومؤسسات اجتماعية) كالتزام ESG طوعي — متمايز عن برامج الامتثال الإلزامية للمحتوى المحلي أو توطين القوى العاملة المُغطاة في مواضع أخرى.',
    benchmarks: { gcc: 1.7, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supplier diversity policy or spend report',
      labelAr: 'سياسة تنويع الموردين أو تقرير إنفاق',
      hint: 'Upload a supplier diversity strategy, policy, or diverse-supplier spend tracking report.',
      hintAr: 'ارفع استراتيجية أو سياسة تنويع موردين أو تقرير متابعة إنفاق الموردين المتنوعين.',
    },
    frameworks: ['ISO 20400', 'CIPS', 'GRI'],
    questions: [
      {
        q: 'Does the organisation have a documented, committed supplier diversity and inclusive sourcing strategy — covering SMEs, women-owned, minority- or disability-owned businesses, and social enterprises — with a defined ambition, distinct from mandatory local-content or workforce-nationalisation compliance programmes covered elsewhere?',
        qAr: 'هل تملك المؤسسة استراتيجية موثّقة وملتزم بها لتنويع الموردين والتوريد الشامل — تغطي المنشآت الصغيرة والمتوسطة والشركات المملوكة لنساء أو أقليات أو ذوي إعاقة والمؤسسات الاجتماعية — بطموح محدد، متمايزة عن برامج الالتزام الإلزامية بالمحتوى المحلي أو توطين القوى العاملة المُغطاة في مواضع أخرى؟',
        levels: [
          'No supplier diversity strategy exists; diverse suppliers are engaged only incidentally, if at all, with no distinction from — or connection to — any mandatory local-content programme.',
          'An informal aspiration to source more diversely exists, but nothing is documented, and there is no defined ambition or target distinguishing this from compliance-driven local-content requirements.',
          'A documented supplier diversity strategy exists with a stated ambition, though it has not been formally approved above the procurement function or linked to resourcing.',
          'A documented, approved supplier diversity strategy sets a defined ambition and is resourced, though execution is still concentrated in a subset of categories rather than applied organisation-wide.',
          'A documented, board/executive-approved supplier diversity and inclusive sourcing strategy sets a clear ambition, is resourced, and is applied consistently across the category base, distinct from and complementary to mandatory local-content compliance.',
        ],
        levelsAr: [
          'لا توجد استراتيجية تنويع موردين؛ ويُتعامَل مع الموردين المتنوعين بشكل عرضي فقط، إن حدث، دون تمايز عن أو ارتباط بأي برنامج محتوى محلي إلزامي.',
          'يوجد طموح غير رسمي بتنويع التوريد أكثر، لكن لا شيء موثّق ولا يوجد طموح أو هدف محدد يميّز هذا عن متطلبات المحتوى المحلي القائمة على الامتثال.',
          'توجد استراتيجية تنويع موردين موثّقة بطموح مُعلَن، لكنها لم تُعتمَد رسميًا فوق وظيفة المشتريات أو تُربَط بالموارد.',
          'استراتيجية تنويع موردين موثّقة ومعتمدة تُحدِّد طموحًا واضحًا ومُدعَّمة بالموارد، لكن التنفيذ لا يزال مُركّزًا في مجموعة فرعية من الفئات بدلاً من تطبيقه على مستوى المؤسسة بالكامل.',
          'استراتيجية تنويع موردين وتوريد شامل موثّقة ومعتمدة من مجلس الإدارة/التنفيذيين تُحدِّد طموحًا واضحًا ومُدعَّمة بالموارد وتُطبَّق باتساق عبر قاعدة الفئات، متمايزة عن الامتثال الإلزامي للمحتوى المحلي ومكمِّلة له.',
        ],
      },
      {
        q: 'Is diverse-supplier spend actually measured against a defined target — by category and business unit — or does the organisation only track how many diverse suppliers are in the vendor database, with no visibility into how much business they actually win?',
        qAr: 'هل يُقاس إنفاق الموردين المتنوعين فعليًا مقابل هدف محدد — حسب الفئة ووحدة الأعمال — أم تتابع المؤسسة فقط عدد الموردين المتنوعين في قاعدة بيانات الموردين دون رؤية لحجم الأعمال الذي يفوزون به فعليًا؟',
        levels: [
          'Diverse-supplier spend is not measured at all; the organisation cannot say what proportion of spend, if any, goes to diverse suppliers.',
          'The number of diverse suppliers registered in the vendor database is tracked, but actual spend awarded to them is not measured.',
          'Diverse-supplier spend is measured for a subset of categories, but there is no organisation-wide target against which performance is assessed.',
          'Diverse-supplier spend is measured against a defined target across most categories and business units, with periodic reporting, though target attainment varies.',
          'Diverse-supplier spend is measured against a defined, organisation-wide target by category and business unit, tracked continuously, and reported to leadership on a regular cycle.',
        ],
        levelsAr: [
          'لا يُقاس إنفاق الموردين المتنوعين إطلاقًا؛ ولا يمكن للمؤسسة تحديد نسبة الإنفاق، إن وُجدت، التي تذهب لموردين متنوعين.',
          'يُتابَع عدد الموردين المتنوعين المُسجَّلين في قاعدة بيانات الموردين، لكن الإنفاق الفعلي المُرسَى عليهم لا يُقاس.',
          'يُقاس إنفاق الموردين المتنوعين لمجموعة فرعية من الفئات، لكن لا يوجد هدف على مستوى المؤسسة يُقيَّم الأداء مقابله.',
          'يُقاس إنفاق الموردين المتنوعين مقابل هدف محدد عبر معظم الفئات ووحدات الأعمال، بإبلاغ دوري، لكن تحقيق الهدف متفاوت.',
          'يُقاس إنفاق الموردين المتنوعين مقابل هدف محدد على مستوى المؤسسة حسب الفئة ووحدة الأعمال، ويُتابَع باستمرار، ويُبلَّغ للقيادة وفق دورة منتظمة.',
        ],
      },
      {
        q: 'Does procurement proactively identify and engage diverse suppliers — through targeted scouting, supplier development programmes, or partnerships with diversity-certification bodies — or does it rely entirely on diverse suppliers finding and approaching the organisation themselves?',
        qAr: 'هل تُحدِّد المشتريات الموردين المتنوعين وتتواصل معهم استباقيًا — عبر استكشاف موجَّه أو برامج تطوير موردين أو شراكات مع جهات اعتماد التنوع — أم تعتمد كليًا على أن يجد الموردون المتنوعون المؤسسة ويتواصلوا معها بأنفسهم؟',
        levels: [
          'Procurement takes no proactive action to identify diverse suppliers; any diverse supplier in the base found the organisation on its own initiative.',
          'Occasional, informal outreach to diverse suppliers happens for specific sourcing events, but there is no defined scouting process or standing engagement channel.',
          'A defined process for identifying diverse suppliers exists (e.g., partnership with a certification body or diversity supplier directory), applied for a subset of categories.',
          'Proactive diverse-supplier identification and engagement is systematic across most categories, including supplier development support, though not yet organisation-wide.',
          'Procurement systematically and proactively identifies, engages, and develops diverse suppliers across the full category base, through scouting, certification-body partnerships, and structured development programmes.',
        ],
        levelsAr: [
          'لا تتخذ المشتريات أي إجراء استباقي لتحديد الموردين المتنوعين؛ وأي مورد متنوع في القاعدة وجد المؤسسة بمبادرته الخاصة.',
          'يحدث تواصل عرضي وغير رسمي مع موردين متنوعين لأحداث توريد محددة، لكن لا توجد عملية استكشاف محددة أو قناة تواصل دائمة.',
          'توجد عملية محددة لتحديد الموردين المتنوعين (شراكة مع جهة اعتماد أو دليل موردين متنوعين مثلاً)، مُطبَّقة لمجموعة فرعية من الفئات.',
          'تحديد الموردين المتنوعين والتواصل معهم استباقيًا منهجي عبر معظم الفئات، بما يشمل دعم تطوير الموردين، لكن ليس على مستوى المؤسسة بالكامل بعد.',
          'تُحدِّد المشتريات وتتواصل وتُطوِّر الموردين المتنوعين بشكل منهجي واستباقي عبر كامل قاعدة الفئات، عبر الاستكشاف وشراكات جهات الاعتماد وبرامج تطوير منظمة.',
        ],
      },
      {
        q: 'Are sourcing and RFx processes deliberately designed to remove structural barriers that disadvantage smaller or diverse suppliers — simplified bid requirements, staged qualification, reasonable insurance/bonding thresholds — or do standard heavy requirements structurally exclude them regardless of the diversity ambition on paper?',
        qAr: 'هل صُمِّمت عمليات التوريد وطلب العروض عمدًا لإزالة الحواجز الهيكلية التي تُضِر بالموردين الأصغر أو المتنوعين — متطلبات عطاء مبسّطة وتأهيل مرحلي وعتبات تأمين/ضمان معقولة — أم تستبعدهم المتطلبات الثقيلة القياسية هيكليًا بغض النظر عن طموح التنوع على الورق؟',
        levels: [
          'Standard sourcing requirements (insurance, bonding, minimum revenue thresholds, complex bid documentation) are applied uniformly regardless of supplier size, structurally excluding most diverse and smaller suppliers.',
          'Awareness exists that standard requirements can exclude smaller suppliers, but no adjustment has been made to sourcing processes.',
          'Adjusted, lighter-touch requirements exist for smaller/diverse suppliers in some categories, applied inconsistently and case-by-case.',
          'A defined policy adjusts sourcing requirements (staged qualification, proportionate insurance/bonding) for smaller and diverse suppliers across most categories.',
          'Sourcing and RFx processes are systematically designed with proportionate, staged requirements that remove structural barriers for smaller and diverse suppliers across the full category base, without compromising risk management.',
        ],
        levelsAr: [
          'تُطبَّق متطلبات التوريد القياسية (التأمين والضمان وحدود الإيراد الدنيا ووثائق العطاء المعقدة) بشكل موحَّد بغض النظر عن حجم المورد، مما يستبعد هيكليًا معظم الموردين المتنوعين والأصغر.',
          'يوجد وعي بأن المتطلبات القياسية يمكن أن تستبعد الموردين الأصغر، لكن لم يُجرَ أي تعديل على عمليات التوريد.',
          'توجد متطلبات مُعدَّلة وأخف للموردين الأصغر/المتنوعين في بعض الفئات، تُطبَّق بتفاوت وحالة بحالة.',
          'تُعدِّل سياسة محددة متطلبات التوريد (تأهيل مرحلي وتأمين/ضمان متناسب) للموردين الأصغر والمتنوعين عبر معظم الفئات.',
          'تُصمَّم عمليات التوريد وطلب العروض بشكل منهجي بمتطلبات متناسبة ومرحلية تُزيل الحواجز الهيكلية للموردين الأصغر والمتنوعين عبر كامل قاعدة الفئات، دون المساس بإدارة المخاطر.',
        ],
      },
      {
        q: 'Is diverse-supplier spend data tracked and retrievable by category and business unit at any given moment — or does producing a current picture require a manual, one-off data-pull each time someone asks?',
        qAr: 'هل تُتابَع بيانات إنفاق الموردين المتنوعين ويمكن استرجاعها حسب الفئة ووحدة الأعمال في أي لحظة معينة — أم يستلزم إنتاج صورة حالية سحب بيانات يدويًا لمرة واحدة في كل مرة يسأل فيها أحد؟',
        levels: [
          'Diverse-supplier spend cannot be retrieved at all; no system or process tracks it.',
          'A rough estimate of diverse-supplier spend can be produced, but only through a substantial manual, one-off data-gathering exercise each time.',
          'Diverse-supplier spend is tracked for a subset of categories and can be retrieved with moderate manual effort.',
          'Diverse-supplier spend is tracked across most categories and business units and can be retrieved within a day with limited manual reconciliation.',
          'Diverse-supplier spend by category and business unit is tracked continuously and retrievable on demand, in real time, with no manual data-pull required.',
        ],
        levelsAr: [
          'لا يمكن استرجاع إنفاق الموردين المتنوعين إطلاقًا؛ ولا يتابعه أي نظام أو عملية.',
          'يمكن إنتاج تقدير تقريبي لإنفاق الموردين المتنوعين، لكن فقط عبر ممارسة جمع بيانات يدوية كبيرة ولمرة واحدة في كل مرة.',
          'يُتابَع إنفاق الموردين المتنوعين لمجموعة فرعية من الفئات ويمكن استرجاعه بجهد يدوي معتدل.',
          'يُتابَع إنفاق الموردين المتنوعين عبر معظم الفئات ووحدات الأعمال ويمكن استرجاعه خلال يوم واحد بتسوية يدوية محدودة.',
          'يُتابَع إنفاق الموردين المتنوعين حسب الفئة ووحدة الأعمال باستمرار ويمكن استرجاعه عند الطلب آنيًا، دون سحب بيانات يدوي مطلوب.',
        ],
      },
      {
        q: 'Are diverse and smaller suppliers actually paid on prompt, favourable terms — recognising their greater cash-flow sensitivity — with payment performance tracked separately, or do they face the same extended payment terms as large suppliers with no differentiated treatment?',
        qAr: 'هل يُدفَع للموردين المتنوعين والأصغر فعليًا بشروط سريعة ومُفضَّلة — إقرارًا بحساسيتهم الأكبر للتدفق النقدي — مع متابعة أداء الدفع لهم بشكل منفصل، أم يواجهون نفس شروط الدفع الممتدة كالموردين الكبار دون معاملة متمايزة؟',
        levels: [
          'Payment terms are identical for all suppliers regardless of size; no distinction is made for diverse or smaller suppliers\' greater cash-flow sensitivity, and payment performance to this group is not tracked separately.',
          'Awareness exists that diverse/smaller suppliers are more cash-flow sensitive, but no differentiated payment terms or tracking has been implemented.',
          'Differentiated, faster payment terms are offered to diverse/smaller suppliers in some categories, though payment performance against this commitment is not systematically tracked.',
          'Differentiated prompt-payment terms for diverse/smaller suppliers are applied across most categories, with payment performance tracked, though not yet reported at leadership level.',
          'Diverse and smaller suppliers receive differentiated, prompt-payment terms as organisational policy, with payment performance tracked and reported separately to confirm the commitment is honoured in practice.',
        ],
        levelsAr: [
          'شروط الدفع متطابقة لجميع الموردين بغض النظر عن الحجم؛ ولا يوجد تمييز لحساسية التدفق النقدي الأكبر للموردين المتنوعين أو الأصغر، ولا يُتابَع أداء الدفع لهذه المجموعة بشكل منفصل.',
          'يوجد وعي بأن الموردين المتنوعين/الأصغر أكثر حساسية للتدفق النقدي، لكن لم تُطبَّق شروط دفع متمايزة أو متابعة.',
          'تُعرَض شروط دفع أسرع ومتمايزة للموردين المتنوعين/الأصغر في بعض الفئات، لكن أداء الدفع مقابل هذا الالتزام لا يُتابَع منهجيًا.',
          'تُطبَّق شروط دفع سريع متمايزة للموردين المتنوعين/الأصغر عبر معظم الفئات، ويُتابَع أداء الدفع، لكن دون إبلاغ على مستوى القيادة بعد.',
          'يحصل الموردون المتنوعون والأصغر على شروط دفع سريع متمايزة كسياسة مؤسسية، ويُتابَع أداء الدفع ويُبلَّغ عنه بشكل منفصل للتأكد من احترام الالتزام عمليًا.',
        ],
      },
      {
        q: 'Are diverse-supplier certifications (e.g., women-owned, minority-owned, SME status) independently verified by a recognised certification body — rather than accepted on the supplier\'s own self-declaration with no check?',
        qAr: 'هل تُتحقَّق شهادات تنوع الموردين (كالمملوكة لنساء أو أقليات أو حالة المنشأة الصغيرة والمتوسطة) بشكل مستقل من جهة اعتماد معترف بها — بدلاً من قبولها بناءً على إقرار المورد الذاتي دون فحص؟',
        levels: [
          'Diverse-supplier status is accepted entirely on the supplier\'s own self-declaration, with no independent verification of any kind.',
          'Verification is occasionally requested for high-profile suppliers, but there is no defined requirement and most status claims go unchecked.',
          'A defined policy requires certification from a recognised body for diverse-supplier status, and it is applied for a subset of categories or suppliers.',
          'Independent certification is required and verified for most diverse suppliers, with self-declaration accepted only for lower-value engagements.',
          'Diverse-supplier status is independently verified by a recognised certification body for every supplier counted toward diversity targets, with no reliance on unverified self-declaration.',
        ],
        levelsAr: [
          'تُقبَل حالة تنوع المورد بالكامل بناءً على إقراره الذاتي، دون أي تحقق مستقل.',
          'يُطلَب التحقق أحيانًا للموردين البارزين، لكن دون متطلب محدد ومعظم ادعاءات الحالة لا تُفحَص.',
          'تشترط سياسة محددة شهادة من جهة معترف بها لحالة تنوع المورد، وتُطبَّق لمجموعة فرعية من الفئات أو الموردين.',
          'تُشترَط وتُتحقَّق شهادة مستقلة لمعظم الموردين المتنوعين، ويُقبَل الإقرار الذاتي فقط للتعاملات الأقل قيمة.',
          'تُتحقَّق حالة تنوع المورد بشكل مستقل من جهة اعتماد معترف بها لكل مورد يُحتسَب ضمن أهداف التنوع، دون اعتماد على إقرار ذاتي غير مُتحقَّق منه.',
        ],
      },
      {
        q: 'Is diverse-supplier spend tracking and reporting automated through the procurement/ERP system — flagging diverse-supplier status and aggregating spend automatically — or manually compiled and cross-referenced against a separate diversity-status list each reporting cycle?',
        qAr: 'هل تتبّع وإبلاغ إنفاق الموردين المتنوعين آليان عبر نظام المشتريات/ERP — يُبلِّغان عن حالة تنوع المورد ويُجمِّعان الإنفاق آليًا — أم يُجمَّعان يدويًا ويُقارَنان مقابل قائمة حالة تنوع منفصلة في كل دورة إبلاغ؟',
        levels: [
          'Diverse-supplier spend tracking is entirely manual, requiring cross-referencing transaction data against a separate diversity-status list each time a report is needed.',
          'A partial manual process exists with some spreadsheet-based tracking, but no system integration.',
          'Diverse-supplier status is flagged in the procurement/ERP system for a subset of suppliers, with spend aggregation still requiring manual steps.',
          'Diverse-supplier status and spend aggregation are mostly automated within the procurement/ERP system, with only minor manual reconciliation needed.',
          'Diverse-supplier status and spend are automatically flagged and aggregated within the procurement/ERP system, producing current reporting without manual compilation.',
        ],
        levelsAr: [
          'تتبّع إنفاق الموردين المتنوعين يدوي بالكامل، ويستلزم مقارنة بيانات المعاملات يدويًا مقابل قائمة حالة تنوع منفصلة في كل مرة يلزم فيها تقرير.',
          'توجد عملية يدوية جزئية بتتبّع قائم على جداول بيانات، لكن دون تكامل نظامي.',
          'تُعلَّم حالة تنوع المورد في نظام المشتريات/ERP لمجموعة فرعية من الموردين، ولا يزال تجميع الإنفاق يستلزم خطوات يدوية.',
          'حالة تنوع المورد وتجميع الإنفاق آليان في معظمهما داخل نظام المشتريات/ERP، ولا تلزم سوى تسوية يدوية طفيفة.',
          'تُعلَّم حالة تنوع المورد والإنفاق آليًا وتُجمَّعان داخل نظام المشتريات/ERP، مما يُنتج إبلاغًا حديثًا دون تجميع يدوي.',
        ],
      },
      {
        q: 'Is there an executive-level target and accountability for diverse-supplier spend, tied to procurement leadership\'s own performance objectives — or does supplier diversity remain a policy statement with no one actually held accountable for the outcome?',
        qAr: 'هل يوجد هدف ومساءلة على المستوى التنفيذي لإنفاق الموردين المتنوعين، مرتبطان بأهداف أداء قيادة المشتريات نفسها — أم يبقى تنويع الموردين بيان سياسة دون مساءلة فعلية لأحد عن النتيجة؟',
        levels: [
          'No executive-level target or accountability exists for supplier diversity; it remains a policy statement with no consequence attached to whether it\'s achieved.',
          'A target exists informally, but it is not tied to any individual\'s performance objectives or formally tracked by leadership.',
          'A documented target for diverse-supplier spend exists and is reviewed periodically by leadership, though it is not formally tied to procurement leadership\'s own performance objectives.',
          'The diverse-supplier spend target is formally tied to procurement leadership\'s performance objectives, with regular reporting, though enforcement of consequences for missing it is inconsistent.',
          'Diverse-supplier spend targets are formally tied to procurement leadership\'s performance objectives, tracked and reported at a defined executive cadence, with genuine accountability for outcomes.',
        ],
        levelsAr: [
          'لا يوجد هدف أو مساءلة على المستوى التنفيذي لتنويع الموردين؛ ويبقى بيان سياسة دون عاقبة مرتبطة بتحقيقه.',
          'يوجد هدف بشكل غير رسمي، لكنه غير مرتبط بأهداف أداء أي فرد أو مُتابَع رسميًا من القيادة.',
          'يوجد هدف موثّق لإنفاق الموردين المتنوعين وتُراجعه القيادة دوريًا، لكنه غير مرتبط رسميًا بأهداف أداء قيادة المشتريات نفسها.',
          'يرتبط هدف إنفاق الموردين المتنوعين رسميًا بأهداف أداء قيادة المشتريات، بإبلاغ منتظم، لكن تطبيق العواقب عند عدم التحقيق غير متسق.',
          'ترتبط أهداف إنفاق الموردين المتنوعين رسميًا بأهداف أداء قيادة المشتريات، وتُتابَع وتُبلَّغ وفق وتيرة تنفيذية محددة، بمساءلة حقيقية عن النتائج.',
        ],
      },
      {
        q: 'Does the organisation deliberately assess and manage the continuity trade-off that can come with diversifying toward smaller or newer suppliers — recognising that a smaller supplier may carry higher operational or financial fragility — rather than pursuing diversity targets without regard for the resiliency implications?',
        qAr: 'هل تُقيِّم المؤسسة وتُدير عمدًا مقايضة الاستمرارية التي يمكن أن تصاحب التنويع نحو موردين أصغر أو أحدث — إقرارًا بأن مورد أصغر قد يحمل هشاشة تشغيلية أو مالية أكبر — بدلاً من متابعة أهداف التنويع دون اعتبار لتداعياتها على المرونة؟',
        levels: [
          'Supplier diversity efforts take no account of continuity risk; smaller or newer suppliers are onboarded without any assessment of their operational or financial fragility relative to established suppliers.',
          'Awareness exists informally that smaller suppliers can be more fragile, but no structured assessment is applied before onboarding.',
          'A basic risk assessment is applied to smaller/diverse suppliers for critical categories, though it is not consistently applied across the full diverse-supplier base.',
          'Continuity risk assessment is systematically applied to diverse suppliers across most categories, with mitigation (e.g., dual-sourcing alongside a diverse supplier) considered for higher-risk cases.',
          'Supplier diversity strategy is deliberately balanced against continuity risk through systematic assessment and mitigation, ensuring diversity ambition and supply resiliency are pursued together rather than traded off blindly.',
        ],
        levelsAr: [
          'لا تأخذ جهود تنويع الموردين مخاطر الاستمرارية بالاعتبار؛ ويُضَم موردون أصغر أو أحدث دون أي تقييم لهشاشتهم التشغيلية أو المالية مقارنةً بالموردين الراسخين.',
          'يوجد وعي غير رسمي بأن الموردين الأصغر يمكن أن يكونوا أكثر هشاشة، لكن لا يُطبَّق تقييم منظم قبل الضم.',
          'يُطبَّق تقييم مخاطر أساسي على الموردين الأصغر/المتنوعين للفئات الحرجة، لكن دون تطبيق متسق عبر كامل قاعدة الموردين المتنوعين.',
          'يُطبَّق تقييم مخاطر استمرارية منهجيًا على الموردين المتنوعين عبر معظم الفئات، مع اعتبار تخفيف (كتوريد مزدوج إلى جانب مورد متنوع) للحالات الأعلى مخاطرة.',
          'تُوازَن استراتيجية تنويع الموردين عمدًا مقابل مخاطر الاستمرارية عبر تقييم وتخفيف منهجيين، بما يضمن متابعة طموح التنويع ومرونة الإمداد معًا بدلاً من المقايضة بينهما عشوائيًا.',
        ],
      },
    ],
  },
  {
    id: 'esg-sustainable-finance',
    title: 'Sustainable Finance & ESG-Linked Supplier Incentives',
    titleAr: 'التمويل المستدام والحوافز المرتبطة بـ ESG للموردين',
    hint: 'Assesses whether procurement uses sustainability-linked financial instruments — supply chain finance, dynamic discounting, ESG-linked payment terms and rebates — as a deliberate lever to drive supplier ESG improvement, and whether these programmes are funded, verified, and governed rather than aspirational.',
    hintAr: 'يقيم ما إذا كانت المشتريات تستخدم أدوات مالية مرتبطة بالاستدامة — تمويل سلسلة الإمداد والخصم الديناميكي وشروط الدفع والحوافز المرتبطة بـ ESG — كرافعة متعمدة لدفع تحسين ESG لدى الموردين، وما إذا كانت هذه البرامج مُموَّلة ومُتحقَّق منها ومحوكَمة بدلاً من كونها طموحة فقط.',
    benchmarks: { gcc: 1.4, topQuartile: 3.3 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 0.8, technology: 1.0, banking: 1.5, other: 1.0,
    },
    evidence: {
      label: 'ESG-linked finance programme documentation',
      labelAr: 'وثائق برنامج التمويل المرتبط بـ ESG',
      hint: 'Upload sustainability-linked supply chain finance policy, dynamic discounting programme terms, or ESG-linked incentive/rebate records.',
      hintAr: 'ارفع سياسة تمويل سلسلة إمداد مرتبط بالاستدامة أو شروط برنامج خصم ديناميكي أو سجلات حوافز/خصومات مرتبطة بـ ESG.',
    },
    frameworks: ['ISO 20400', 'GRI', 'ICC Sustainable Trade Finance'],
    questions: [
      {
        q: 'Does procurement deliberately use sustainability-linked financial instruments — sustainability-linked supply chain finance, dynamic discounting tied to ESG score — as a lever to drive supplier ESG improvement, or does ESG remain entirely disconnected from how suppliers are paid and financed?',
        qAr: 'هل تستخدم المشتريات عمدًا أدوات مالية مرتبطة بالاستدامة — تمويل سلسلة إمداد مرتبط بالاستدامة أو خصم ديناميكي مرتبط بدرجة ESG — كرافعة لدفع تحسين ESG لدى الموردين، أم يبقى ESG منفصلاً تمامًا عن كيفية دفع وتمويل الموردين؟',
        levels: [
          'ESG performance has no connection to how suppliers are paid or financed; sustainability-linked financial instruments are not used at all.',
          'Awareness of sustainability-linked supply chain finance exists, but no programme has been implemented.',
          'A pilot sustainability-linked finance or dynamic-discounting programme tied to ESG score exists for a small number of suppliers.',
          'A sustainability-linked finance programme tied to ESG score is operating across a meaningful portion of the strategic supplier base, though not yet organisation-wide.',
          'Sustainability-linked financial instruments — supply chain finance, dynamic discounting tied to ESG score — are deliberately and systematically used across the supplier base as a core lever to drive ESG improvement.',
        ],
        levelsAr: [
          'أداء ESG ليس له أي ارتباط بكيفية دفع أو تمويل الموردين؛ ولا تُستخدَم أدوات مالية مرتبطة بالاستدامة إطلاقًا.',
          'يوجد وعي بتمويل سلسلة الإمداد المرتبط بالاستدامة، لكن لم يُطبَّق أي برنامج.',
          'يوجد برنامج تجريبي لتمويل مرتبط بالاستدامة أو خصم ديناميكي مرتبط بدرجة ESG لعدد صغير من الموردين.',
          'يعمل برنامج تمويل مرتبط بالاستدامة مرتبط بدرجة ESG عبر جزء ذي معنى من قاعدة الموردين الاستراتيجيين، لكن ليس على مستوى المؤسسة بالكامل بعد.',
          'تُستخدَم الأدوات المالية المرتبطة بالاستدامة — تمويل سلسلة الإمداد والخصم الديناميكي المرتبط بدرجة ESG — عمدًا ومنهجيًا عبر قاعدة الموردين كرافعة أساسية لدفع تحسين ESG.',
        ],
      },
      {
        q: 'Are payment terms and financial incentives deliberately differentiated by supplier ESG performance — better terms for higher performers — as a defined strategy, or are payment terms set purely by commercial leverage and category dynamics with no ESG dimension at all?',
        qAr: 'هل تُمَيَّز شروط الدفع والحوافز المالية عمدًا حسب أداء ESG للمورد — شروط أفضل لأصحاب الأداء الأعلى — كاستراتيجية محددة، أم تُحدَّد شروط الدفع بالكامل وفق النفوذ التجاري وديناميكيات الفئة دون أي بُعد ESG إطلاقًا؟',
        levels: [
          'Payment terms are set purely by commercial leverage and category dynamics; ESG performance plays no role whatsoever in payment terms or incentives.',
          'Informal discussion of linking payment terms to ESG performance has occurred, but no policy or practice exists.',
          'A documented strategy links payment terms to ESG performance for a subset of categories or suppliers, though not consistently applied.',
          'Payment terms are differentiated by ESG performance as a defined strategy across most categories, with periodic review of the linkage\'s effectiveness.',
          'Payment terms and financial incentives are systematically and consistently differentiated by supplier ESG performance across the full category base, as a core, defined procurement strategy.',
        ],
        levelsAr: [
          'تُحدَّد شروط الدفع بالكامل وفق النفوذ التجاري وديناميكيات الفئة؛ وأداء ESG لا يلعب أي دور إطلاقًا في شروط الدفع أو الحوافز.',
          'جرى نقاش غير رسمي لربط شروط الدفع بأداء ESG، لكن لا توجد سياسة أو ممارسة.',
          'تربط استراتيجية موثّقة شروط الدفع بأداء ESG لمجموعة فرعية من الفئات أو الموردين، لكن دون تطبيق متسق.',
          'تُمَيَّز شروط الدفع حسب أداء ESG كاستراتيجية محددة عبر معظم الفئات، بمراجعة دورية لفاعلية الربط.',
          'تُمَيَّز شروط الدفع والحوافز المالية منهجيًا وباتساق حسب أداء ESG للمورد عبر كامل قاعدة الفئات، كاستراتيجية مشتريات أساسية ومحددة.',
        ],
      },
      {
        q: 'Is there a structured programme offering sustainability-linked financing or preferential terms to suppliers investing in verified ESG improvements — renewable energy conversion, decent-work certification, emissions reduction — or is any such support offered informally and case-by-case, if at all?',
        qAr: 'هل يوجد برنامج منظم يُقدِّم تمويلاً مرتبطًا بالاستدامة أو شروطًا تفضيلية للموردين المستثمرين في تحسينات ESG مُتحقَّق منها — كالتحول للطاقة المتجددة أو شهادة العمل اللائق أو خفض الانبعاثات — أم يُقدَّم أي دعم من هذا القبيل بشكل غير رسمي وحالة بحالة، إن وُجد أصلاً؟',
        levels: [
          'No structured programme exists; any support for a supplier\'s ESG investment would be improvised on a one-off basis, if offered at all.',
          'Informal, case-by-case support has been given to a handful of suppliers, but no defined programme, eligibility criteria, or process exists.',
          'A structured programme exists with defined eligibility criteria, applied to a limited pool of suppliers or categories.',
          'A structured sustainability-linked financing programme operates across most of the strategic supplier base, with defined eligibility and verified improvement criteria.',
          'A structured, well-resourced sustainability-linked financing programme with clear eligibility and verified-improvement criteria is available across the supplier base, actively used to fund supplier ESG investment.',
        ],
        levelsAr: [
          'لا يوجد برنامج منظم؛ وأي دعم لاستثمار مورد في ESG سيكون مرتجلاً لمرة واحدة، إن قُدِّم أصلاً.',
          'قُدِّم دعم غير رسمي وحالة بحالة لعدد قليل من الموردين، لكن لا يوجد برنامج محدد أو معايير أهلية أو عملية.',
          'يوجد برنامج منظم بمعايير أهلية محددة، يُطبَّق لمجموعة محدودة من الموردين أو الفئات.',
          'يعمل برنامج تمويل مرتبط بالاستدامة منظم عبر معظم قاعدة الموردين الاستراتيجيين، بمعايير أهلية وتحسين مُتحقَّق منها محددة.',
          'يتوفر برنامج تمويل مرتبط بالاستدامة منظم وجيد الموارد بمعايير أهلية وتحسين مُتحقَّق منها واضحة عبر قاعدة الموردين، ويُستخدَم بفاعلية لتمويل استثمار الموردين في ESG.',
        ],
      },
      {
        q: 'Are ESG-linked rebates, discounts, or preferential financing terms actually funded and paid out to qualifying suppliers — or does this remain an aspirational policy with no real budget or execution behind it?',
        qAr: 'هل تُموَّل وتُدفَع فعليًا الخصومات أو الحوافز أو شروط التمويل التفضيلية المرتبطة بـ ESG للموردين المؤهَّلين — أم يبقى هذا سياسة طموحة دون ميزانية أو تنفيذ حقيقي وراءها؟',
        levels: [
          'No budget exists for ESG-linked rebates or preferential financing; the policy, where it exists, is purely aspirational with no funding behind it.',
          'A small, informal budget has been used once or twice, but there is no sustained funding commitment.',
          'A defined budget exists and rebates/preferential terms are paid out for a subset of qualifying suppliers, though funding is not guaranteed year-to-year.',
          'A sustained, defined budget funds ESG-linked rebates or preferential terms for most qualifying suppliers, with payouts tracked.',
          'ESG-linked rebates and preferential financing terms are fully funded, reliably paid out to every qualifying supplier, and tracked as a genuine financial commitment, not just a policy statement.',
        ],
        levelsAr: [
          'لا توجد ميزانية للحوافز المرتبطة بـ ESG أو التمويل التفضيلي؛ والسياسة، إن وُجدت، طموحة بحتة دون تمويل وراءها.',
          'استُخدمت ميزانية صغيرة وغير رسمية مرة أو مرتين، لكن لا يوجد التزام تمويل مستدام.',
          'توجد ميزانية محددة وتُدفَع الحوافز/الشروط التفضيلية لمجموعة فرعية من الموردين المؤهَّلين، لكن التمويل غير مضمون سنة بعد أخرى.',
          'تُموِّل ميزانية مستدامة ومحددة الحوافز أو الشروط التفضيلية المرتبطة بـ ESG لمعظم الموردين المؤهَّلين، وتُتابَع المدفوعات.',
          'الحوافز وشروط التمويل التفضيلية المرتبطة بـ ESG مُموَّلة بالكامل وتُدفَع بموثوقية لكل مورد مؤهَّل، وتُتابَع كالتزام مالي حقيقي، لا مجرد بيان سياسة.',
        ],
      },
      {
        q: 'Can procurement identify, at any given moment, exactly which suppliers are eligible for or enrolled in ESG-linked finance or incentive programmes — or does this require a manual cross-check across separate finance and ESG-scoring records every time?',
        qAr: 'هل يمكن للمشتريات تحديد أي الموردين مؤهَّلون أو مُسجَّلون في برامج التمويل أو الحوافز المرتبطة بـ ESG في أي لحظة معينة — أم يستلزم ذلك مقارنة يدوية عبر سجلات مالية وسجلات تسجيل ESG منفصلة في كل مرة؟',
        levels: [
          'There is no way to identify eligible or enrolled suppliers without a substantial, one-off manual investigation across disconnected finance and ESG records.',
          'A partial list exists but is maintained informally and is often out of date.',
          'Eligible/enrolled suppliers can be identified with moderate manual cross-referencing between finance and ESG-scoring systems.',
          'Eligible/enrolled suppliers are identifiable within a day through a mostly-linked view of finance and ESG-scoring data.',
          'Eligible and enrolled suppliers for ESG-linked finance or incentive programmes are identifiable instantly, through a live, integrated view linking finance and ESG-scoring data.',
        ],
        levelsAr: [
          'لا توجد طريقة لتحديد الموردين المؤهَّلين أو المُسجَّلين دون تحقيق يدوي كبير ولمرة واحدة عبر سجلات مالية وESG منفصلة.',
          'توجد قائمة جزئية لكنها تُصان بشكل غير رسمي وغالبًا ما تكون قديمة.',
          'يمكن تحديد الموردين المؤهَّلين/المُسجَّلين بمقارنة يدوية معتدلة بين أنظمة المالية وتسجيل ESG.',
          'يمكن تحديد الموردين المؤهَّلين/المُسجَّلين خلال يوم واحد عبر عرض مرتبط في معظمه لبيانات المالية وتسجيل ESG.',
          'يمكن تحديد الموردين المؤهَّلين والمُسجَّلين في برامج التمويل أو الحوافز المرتبطة بـ ESG فورًا، عبر عرض حي ومتكامل يربط بيانات المالية وتسجيل ESG.',
        ],
      },
      {
        q: 'Is supplier ESG score data operationally integrated with the finance/payment or supply chain finance platform — so incentive eligibility and pricing adjust automatically as scores change — or does linking an ESG score to a financial outcome require manual reconciliation every cycle?',
        qAr: 'هل تُدمَج بيانات درجة ESG للمورد تشغيليًا مع منصة المالية/الدفع أو تمويل سلسلة الإمداد — بحيث تتكيف أهلية الحوافز والتسعير آليًا مع تغيّر الدرجات — أم يستلزم ربط درجة ESG بنتيجة مالية تسوية يدوية في كل دورة؟',
        levels: [
          'Supplier ESG score data and the finance/payment platform are entirely disconnected; any link between an ESG score and a financial outcome must be manually calculated and applied every time.',
          'A partial, manual process links ESG scores to financial outcomes for a small number of suppliers, but there is no system integration.',
          'ESG score data is linked to the finance platform for a subset of suppliers, with adjustments still requiring manual triggering.',
          'ESG score data is integrated with the finance/supply chain finance platform for most enrolled suppliers, with incentive eligibility adjusting automatically in most cases.',
          'Supplier ESG score data is fully integrated with the finance/supply chain finance platform, automatically adjusting incentive eligibility and pricing as scores change, with no manual reconciliation required.',
        ],
        levelsAr: [
          'بيانات درجة ESG للمورد ومنصة المالية/الدفع منفصلتان تمامًا؛ وأي ربط بين درجة ESG ونتيجة مالية يجب حسابه وتطبيقه يدويًا في كل مرة.',
          'توجد عملية يدوية جزئية تربط درجات ESG بنتائج مالية لعدد صغير من الموردين، لكن دون تكامل نظامي.',
          'تُربَط بيانات درجة ESG بمنصة المالية لمجموعة فرعية من الموردين، وتستلزم التعديلات إطلاقًا يدويًا.',
          'تُدمَج بيانات درجة ESG مع منصة المالية/تمويل سلسلة الإمداد لمعظم الموردين المُسجَّلين، وتتكيف أهلية الحوافز آليًا في معظم الحالات.',
          'تُدمَج بيانات درجة ESG للمورد بالكامل مع منصة المالية/تمويل سلسلة الإمداد، وتتكيف أهلية الحوافز والتسعير آليًا مع تغيّر الدرجات، دون تسوية يدوية مطلوبة.',
        ],
      },
      {
        q: 'Are supplier ESG improvement claims independently verified before an ESG-linked financial incentive or preferential rate is released — rather than a supplier\'s self-reported improvement claim triggering a payout or rate change with no check?',
        qAr: 'هل تُتحقَّق ادعاءات تحسين ESG للموردين بشكل مستقل قبل إطلاق حافز مالي مرتبط بـ ESG أو معدل تفضيلي — بدلاً من أن يُطلق ادعاء تحسين مُبلَّغ عنه ذاتيًا من المورد دفعة أو تغيير معدل دون فحص؟',
        levels: [
          'Supplier ESG improvement claims are accepted entirely on self-report; any claimed improvement can trigger a financial incentive with no independent check.',
          'Verification happens occasionally and informally for high-value cases, but there is no defined verification requirement.',
          'A defined verification step exists before releasing an incentive, applied to a subset of claims or above a value threshold.',
          'Most ESG improvement claims triggering a financial incentive are independently verified before payout, through a defined process.',
          'Every ESG improvement claim triggering an ESG-linked financial incentive or preferential rate is independently verified before release, with no exceptions.',
        ],
        levelsAr: [
          'تُقبَل ادعاءات تحسين ESG للموردين بالكامل بالتقرير الذاتي؛ ويمكن لأي تحسين مُدَّعى أن يُطلق حافزًا ماليًا دون فحص مستقل.',
          'يحدث التحقق أحيانًا وبشكل غير رسمي للحالات عالية القيمة، لكن لا يوجد متطلب تحقق محدد.',
          'توجد خطوة تحقق محددة قبل إطلاق حافز، تُطبَّق على مجموعة فرعية من الادعاءات أو فوق حد قيمة.',
          'تُتحقَّق معظم ادعاءات تحسين ESG التي تُطلق حافزًا ماليًا بشكل مستقل قبل الدفع، عبر عملية محددة.',
          'يُتحقَّق من كل ادعاء تحسين ESG يُطلق حافزًا ماليًا مرتبطًا بـ ESG أو معدلاً تفضيليًا بشكل مستقل قبل الإطلاق، دون استثناءات.',
        ],
      },
      {
        q: 'How much of the ESG-linked finance workflow — score updates, eligibility checks, incentive calculation and payout — is automated versus requiring someone to manually trigger each step?',
        qAr: 'ما مقدار سير عمل التمويل المرتبط بـ ESG — تحديث الدرجات وفحوصات الأهلية وحساب الحوافز والدفع — الذي يكون آليًا مقابل ما يستلزم أن يُطلق أحدهم كل خطوة يدويًا؟',
        levels: [
          'The entire ESG-linked finance workflow is manual; every step from score update to payout requires someone to remember and trigger it.',
          'A small number of steps are automated (e.g., score updates), but eligibility checks and payout remain manual.',
          'Roughly half the workflow is automated, with defined manual steps remaining for eligibility confirmation or payout authorisation.',
          'Most of the workflow is automated, with only payout authorisation requiring manual sign-off.',
          'The full ESG-linked finance workflow — score updates, eligibility checks, incentive calculation, and payout — is automated end-to-end, with manual involvement limited to exception handling.',
        ],
        levelsAr: [
          'سير عمل التمويل المرتبط بـ ESG بالكامل يدوي؛ وكل خطوة من تحديث الدرجة إلى الدفع تستلزم أن يتذكرها أحدهم ويُطلقها.',
          'عدد قليل من الخطوات آلي (كتحديث الدرجات)، لكن فحوصات الأهلية والدفع تبقى يدوية.',
          'ما يقارب نصف سير العمل آلي، مع خطوات يدوية محددة متبقية لتأكيد الأهلية أو اعتماد الدفع.',
          'معظم سير العمل آلي، ولا يستلزم توقيعًا يدويًا سوى اعتماد الدفع.',
          'سير عمل التمويل المرتبط بـ ESG الكامل — تحديث الدرجات وفحوصات الأهلية وحساب الحوافز والدفع — آلي من طرف لطرف، ويقتصر التدخل اليدوي على معالجة الاستثناءات.',
        ],
      },
      {
        q: 'Is there a formal, board/executive-approved policy defining eligibility criteria, funding source, and governance for ESG-linked supplier finance — or does the programme, where it exists, run on ad hoc decisions with no documented policy framework above the procurement team running it?',
        qAr: 'هل توجد سياسة رسمية معتمدة من مجلس الإدارة/التنفيذيين تُحدِّد معايير الأهلية ومصدر التمويل والحوكمة لتمويل الموردين المرتبط بـ ESG — أم يعمل البرنامج، إن وُجد، بقرارات عشوائية دون إطار سياسة موثّق فوق فريق المشتريات الذي يُديره؟',
        levels: [
          'No policy exists; any ESG-linked finance decisions are made ad hoc by whoever runs the programme, with no documented framework or approval above that level.',
          'An informal set of guidelines exists, but it has not been formally approved or documented as policy.',
          'A documented policy exists defining eligibility and funding, though it has not been formally approved above the procurement function.',
          'A documented, approved policy defines eligibility criteria, funding source, and governance, with periodic review.',
          'A formal, board/executive-approved policy defines eligibility criteria, funding source, and governance for ESG-linked supplier finance, reviewed on a defined cycle.',
        ],
        levelsAr: [
          'لا توجد سياسة؛ وتُتخذ أي قرارات تمويل مرتبط بـ ESG بشكل عشوائي من قِبَل من يُدير البرنامج، دون إطار موثّق أو اعتماد فوق ذلك المستوى.',
          'توجد مجموعة إرشادات غير رسمية، لكنها لم تُعتمَد أو تُوثَّق رسميًا كسياسة.',
          'توجد سياسة موثّقة تُحدِّد الأهلية والتمويل، لكنها لم تُعتمَد رسميًا فوق وظيفة المشتريات.',
          'تُحدِّد سياسة موثّقة ومعتمدة معايير الأهلية ومصدر التمويل والحوكمة، بمراجعة دورية.',
          'تُحدِّد سياسة رسمية معتمدة من مجلس الإدارة/التنفيذيين معايير الأهلية ومصدر التمويل والحوكمة لتمويل الموردين المرتبط بـ ESG، وتُراجَع وفق دورة محددة.',
        ],
      },
      {
        q: 'Does reliance on a sustainability-linked finance programme create its own counterparty or liquidity risk — dependency on a single supply chain finance provider or funding source — that is assessed and managed as part of continuity planning, rather than assumed to be risk-free simply because its purpose is sustainability?',
        qAr: 'هل يخلق الاعتماد على برنامج تمويل مرتبط بالاستدامة مخاطرة طرف مقابل أو سيولة خاصة به — اعتماد على مزوّد تمويل سلسلة إمداد واحد أو مصدر تمويل واحد — تُقيَّم وتُدار كجزء من تخطيط الاستمرارية، بدلاً من افتراض أنها خالية من المخاطر لمجرد أن غرضها الاستدامة؟',
        levels: [
          'Counterparty or liquidity risk from the sustainability-linked finance programme is not assessed at all; dependency on a single provider or funding source is unexamined.',
          'Awareness exists informally that the programme depends on a single provider, but no formal risk assessment has been conducted.',
          'A basic assessment of provider/funding dependency has been conducted once, but it is not revisited or linked to continuity planning.',
          'Provider/funding dependency risk is assessed periodically and factored into continuity considerations, though not yet formally integrated into the broader continuity plan.',
          'Counterparty and liquidity risk from the sustainability-linked finance programme is formally assessed, with dependency on any single provider or funding source actively managed as an integrated part of supply continuity planning.',
        ],
        levelsAr: [
          'لا تُقيَّم مخاطرة الطرف المقابل أو السيولة من برنامج التمويل المرتبط بالاستدامة إطلاقًا؛ والاعتماد على مزوّد أو مصدر تمويل واحد غير مُفحَص.',
          'يوجد وعي غير رسمي بأن البرنامج يعتمد على مزوّد واحد، لكن لم يُجرَ تقييم مخاطر رسمي.',
          'أُجري تقييم أساسي لاعتماد المزوّد/التمويل مرة واحدة، لكن لا يُعاد فحصه أو يُربَط بتخطيط الاستمرارية.',
          'تُقيَّم مخاطرة اعتماد المزوّد/التمويل دوريًا وتُدرَج في اعتبارات الاستمرارية، لكن لم تُدمَج بعد رسميًا في خطة الاستمرارية الأوسع.',
          'تُقيَّم مخاطرة الطرف المقابل والسيولة من برنامج التمويل المرتبط بالاستدامة رسميًا، ويُدار الاعتماد على أي مزوّد أو مصدر تمويل واحد بفاعلية كجزء مُدمَج من تخطيط استمرارية الإمداد.',
        ],
      },
    ],
  },
];

export const DIGITAL_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 6-0  Technology Landscape Assessment ────────────────────────────── */
  {
    id: 'digital-landscape',
    title: 'Technology Landscape Assessment',
    titleAr: 'تقييم المشهد التقني',
    hint: 'Assesses how formally the existing supply chain technology estate is inventoried, evaluated for capability gaps, and governed through a structured roadmap.',
    hintAr: 'يقيس مدى رسمية حصر التقنيات القائمة لسلسلة الإمداد وتقييم فجوات القدرات وإدارتها عبر خارطة طريق منظمة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 1.0, other: 1.0,
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How comprehensively have you assessed your current supply chain technology landscape — identifying the systems in use, integration gaps, redundant tools, and overall capability shortfalls?',
        qAr: 'ما مدى شمولية تقييمكم للمشهد التقني الحالي لسلسلة الإمداد — بتحديد الأنظمة المستخدمة وفجوات التكامل والأدوات المكررة والقصور الإجمالي في القدرات؟',
        levels: [
          'No formal technology landscape assessment has been conducted. The supply chain technology estate is unknown and systems are used without a consolidated inventory.',
          'An informal list of major systems exists (e.g., ERP, WMS) but integration points, redundancies, and capability gaps have never been formally assessed.',
          'A technology landscape map has been completed; key systems, their integration status, and major gaps are documented; a business case for investment has been prepared for top-priority gaps.',
          'A structured technology assessment is conducted every 2 years; capability gaps are prioritised by business impact; a formal technology investment plan links to the supply chain strategy.',
          'A continuous technology landscape assessment process is embedded; digital maturity benchmarking against GCC peers is conducted annually; investment prioritisation is governed by a cross-functional technology steering committee.',
        ],
        levelsAr: [
          'لم يُجرَ تقييم رسمي للمشهد التقني. التقنيات القائمة لسلسلة الإمداد مجهولة والأنظمة تُستخدَم دون جرد موحّد.',
          'قائمة غير رسمية بالأنظمة الرئيسية (كـ ERP وWMS) موجودة لكن نقاط التكامل والتكرارات وفجوات القدرات لم تُقيَّم رسميًا قط.',
          'خارطة المشهد التقني مكتملة؛ والأنظمة الرئيسية وحالة تكاملها والفجوات الكبرى موثّقة؛ ومبرر تجاري للاستثمار مُعدَّة لأولى الأولويات.',
          'تقييم منهجي للتقنيات يُجرى كل سنتين؛ وفجوات القدرات مُرتَّبة حسب الأثر التجاري؛ وخطة استثمار تقني رسمية مرتبطة باستراتيجية سلسلة الإمداد.',
          'عملية مستمرة لتقييم المشهد التقني متجذّرة؛ والمقارنة المعيارية للنضج الرقمي مع نظراء الخليج تُجرى سنويًا؛ وتحديد أولويات الاستثمار يُحكَم بلجنة توجيهية تقنية متعددة الوظائف.',
        ],
      },
      {
        q: 'How formally is your supply chain technology roadmap defined, funded, and governed — ensuring alignment between digital investments and supply chain strategic priorities?',
        qAr: 'ما مدى رسمية تعريف خارطة الطريق التقنية لسلسلة الإمداد وتمويلها وحوكمتها — مما يضمن المواءَمة بين الاستثمارات الرقمية والأولويات الاستراتيجية لسلسلة الإمداد؟',
        levels: [
          'No technology roadmap exists. Digital investments are made on an ad-hoc basis driven by vendor proposals or operational crises.',
          'An informal technology wish-list exists among senior IT and supply chain leaders but without approved business cases, dedicated budgets, or governance structures.',
          'A documented technology roadmap is aligned to the supply chain strategy and reviewed at least annually by senior management.',
          'A funded technology roadmap with approved business cases is governed by a cross-functional steering committee and tracked actively against milestones.',
          'A rolling 3-year technology roadmap aligned to the supply chain strategy is approved at executive level, fully funded, and governed by a cross-functional steering committee with quarterly progress reviews.',
        ],
        levelsAr: [
          'لا توجد خارطة طريق تقنية. الاستثمارات الرقمية تُتخَذ بشكل ارتجالي مدفوعة بمقترحات موردين أو أزمات تشغيلية.',
          'قائمة أمنيات تقنية غير رسمية موجودة لكن دون دراسات جدوى معتمدة أو ميزانية مخصصة أو هياكل حوكمة.',
          'خارطة الطريق التقنية موثّقة ومواءَمة مع استراتيجية سلسلة الإمداد وتُراجَع سنويًا على الأقل من الإدارة.',
          'خارطة طريق تقنية ممولة بدراسات جدوى معتمدة تحكمها لجنة توجيهية متعددة الوظائف وتُتابَع بفاعلية مقابل المراحل.',
          'خارطة طريق تقنية متجددة لثلاث سنوات مواءَمة مع استراتيجية سلسلة الإمداد ومعتمدة على المستوى التنفيذي وممولة بالكامل وتحكمها لجنة توجيهية متعددة الوظائف بمراجعات تقدّم فصلية.',
        ],
      },
    ],
  },

  /* ── 6-1  ERP & Data Infrastructure ─────────────────────────────────── */
  {
    id: 'digital-erp',
    title: 'ERP & Data Infrastructure',
    titleAr: 'ERP والبنية التحتية للبيانات',
    hint: 'Evaluates ERP implementation quality, master data governance, system integration maturity, and data accessibility for supply chain decision-making.',
    hintAr: 'يقيّم جودة تطبيق ERP وحوكمة البيانات الرئيسية ونضج تكامل الأنظمة وإمكانية الوصول إلى البيانات لاتخاذ قرارات سلسلة الإمداد.',
    benchmarks: { gcc: 2.4, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'ERP system screenshot or implementation contract',
      labelAr: 'لقطة شاشة من نظام ERP أو عقد التطبيق',
      hint:    'Upload a screenshot of your ERP system dashboard or the implementation/maintenance contract showing the modules deployed.',
      hintAr:  'ارفع لقطة شاشة من لوحة تحكم نظام ERP أو عقد التطبيق/الصيانة الذي يُظهر الوحدات المُنشأة.',
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How effectively is your ERP system configured and utilised for supply chain processes — including purchasing, inventory, demand planning, and order management — with minimal reliance on shadow spreadsheets?',
        qAr: 'ما مدى فعالية تهيئة نظام ERP لديكم واستخدامه لعمليات سلسلة الإمداد — شاملًا المشتريات والمخزون وتخطيط الطلب وإدارة الطلبات — مع الحد الأدنى من الاعتماد على الجداول الموازية؟',
        levels: [
          'No ERP system is in use for supply chain processes. Core operations are managed through spreadsheets and manual processes with disconnected records.',
          'An ERP system is in place but heavily supplemented by spreadsheets; key supply chain modules are partially configured; significant data inconsistencies exist between systems.',
          'Core supply chain modules (procurement, inventory, order management) are operational in the ERP; major process exceptions are handled in the system; key reports are ERP-generated.',
          'The ERP is the system of record for all significant supply chain transactions; spreadsheet reliance is minimal; automated workflows reduce manual effort; data quality is monitored.',
          'A fully deployed ERP (or best-of-breed suite) covers all supply chain processes with high data quality; workflow automation is extensive; advanced modules (e.g., MRP II, APS) are operational.',
        ],
        levelsAr: [
          'لا يُستخدَم نظام ERP لعمليات سلسلة الإمداد. العمليات الأساسية تُدار عبر جداول البيانات والعمليات اليدوية بسجلات غير مترابطة.',
          'نظام ERP قائم لكن يُكمَّل بشكل مكثّف بجداول البيانات؛ وحدات سلسلة الإمداد الرئيسية مُهيَّأة جزئيًا؛ وتناقضات بيانات جوهرية بين الأنظمة.',
          'وحدات سلسلة الإمداد الأساسية (المشتريات والمخزون وإدارة الطلبات) تعمل في ERP؛ والاستثناءات الرئيسية تُعالَج في النظام؛ والتقارير الرئيسية مولّدة من ERP.',
          'ERP هو نظام السجلات لجميع معاملات سلسلة الإمداد الجوهرية؛ والاعتماد على الجداول الموازية ضئيل؛ والسير الآلي يُقلّص الجهد اليدوي؛ وجودة البيانات متابَعة.',
          'ERP مُنشَر بالكامل (أو مجموعة الأفضل في الفئة) يغطي جميع عمليات سلسلة الإمداد بجودة بيانات عالية؛ وأتمتة السير واسعة النطاق؛ والوحدات المتقدمة (كـ MRP II وAPS) تعمل.',
        ],
      },
      {
        q: 'How mature is your master data management (MDM) for supply chain — covering item master accuracy, supplier master completeness, and a governed data ownership model?',
        qAr: 'ما مدى نضج إدارة البيانات الرئيسية (MDM) لسلسلة الإمداد — شاملًا دقة بيانات الأصناف واكتمال بيانات الموردين ونموذج ملكية البيانات المُحكَم؟',
        levels: [
          'Master data is not governed. Duplicate supplier and item records, inconsistent naming, and missing fields are widespread; no MDM policy exists.',
          'Awareness of master data quality issues exists but resolution is reactive; no formal MDM policy, data stewards, or regular cleanse programme exists.',
          'An MDM policy is in place; data stewards own key master data domains (item, supplier, customer); annual master data cleanse is conducted.',
          'MDM is governed with defined ownership, quality KPIs (accuracy, completeness rates), and a governed change process; automated alerts flag data quality degradation.',
          'An enterprise MDM platform governs all supply chain master data domains; data quality KPIs are published quarterly; continuous automated validation maintains near-100% data accuracy.',
        ],
        levelsAr: [
          'البيانات الرئيسية غير محكومة. سجلات موردين وأصناف مكررة وتسمية غير متسقة وحقول مفقودة منتشرة؛ ولا توجد سياسة MDM.',
          'وعي بمشكلات جودة البيانات الرئيسية موجود لكن المعالجة تفاعلية؛ ولا سياسة MDM رسمية أو أمناء بيانات أو برنامج تنظيف منتظم.',
          'سياسة MDM قائمة؛ وأمناء البيانات يمتلكون نطاقات البيانات الرئيسية (الأصناف والموردين والعملاء)؛ وتنظيف سنوي للبيانات الرئيسية يُجرى.',
          'MDM محكومة بملكية محددة ومؤشرات جودة (معدلات الدقة والاكتمال) وعملية تغيير محكومة؛ وتنبيهات آلية تُبلّغ عن تدهور جودة البيانات.',
          'منصة MDM مؤسسية تحكم جميع نطاقات البيانات الرئيسية لسلسلة الإمداد؛ ومؤشرات جودة البيانات تُنشَر فصليًا؛ والتحقق الآلي المستمر يُحافظ على دقة بيانات تقارب 100%.',
        ],
      },
      {
        q: 'How well integrated are your supply chain systems — enabling seamless data exchange between procurement, inventory, warehouse, logistics, and finance with minimal manual reconciliation?',
        qAr: 'ما مدى تكامل أنظمة سلسلة الإمداد لديكم — مما يُتيح تبادل البيانات بسلاسة بين المشتريات والمخزون والمستودعات واللوجستيات والمالية مع حد أدنى من التسوية اليدوية؟',
        levels: [
          'Supply chain systems are not integrated. Data transfer between systems is entirely manual (re-keying, file exports), causing frequent errors and delays.',
          'Some automated interfaces exist between key systems but many data flows remain manual; reconciliation between systems is a significant operational burden.',
          'Core supply chain systems are integrated with automated data flows; key transactions (POs, GRNs, invoices) flow through without manual re-entry.',
          'Near-seamless integration across procurement, inventory, WMS, TMS, and finance; an integration layer (iPaaS / API hub) manages interfaces; integration health is monitored.',
          'A fully integrated supply chain data platform enables real-time data flows across all operational systems; API-first architecture enables rapid partner connectivity; integration SLAs are monitored and reported.',
        ],
        levelsAr: [
          'أنظمة سلسلة الإمداد غير متكاملة. نقل البيانات بين الأنظمة يدوي بالكامل (إعادة إدخال وتصدير ملفات) مما يسبب أخطاء وتأخيرات متكررة.',
          'بعض واجهات التكامل الآلية بين الأنظمة الرئيسية موجودة لكن كثيرًا من تدفقات البيانات تبقى يدوية؛ والتسوية بين الأنظمة عبء تشغيلي جوهري.',
          'أنظمة سلسلة الإمداد الأساسية متكاملة بتدفقات بيانات آلية؛ والمعاملات الرئيسية (أوامر الشراء وإشعارات الاستلام والفواتير) تتدفق دون إعادة إدخال يدوي.',
          'تكامل شبه سلس عبر المشتريات والمخزون وWMS وTMS والمالية؛ وطبقة تكامل (iPaaS / مركز API) تدير الواجهات؛ وصحة التكامل مُراقَبة.',
          'منصة بيانات سلسلة إمداد متكاملة بالكامل تُتيح تدفقات بيانات آنية عبر جميع الأنظمة التشغيلية؛ وبنية API-first تُتيح اتصالًا سريعًا مع الشركاء؛ واتفاقيات مستوى خدمة التكامل متابَعة ومُبلَّغ عنها.',
        ],
      },
    ],
  },

  /* ── 6-2  Supply Chain Visibility & Tracking ────────────────────────── */
  {
    id: 'digital-visibility',
    title: 'Supply Chain Visibility & Tracking',
    titleAr: 'رؤية سلسلة الإمداد والتتبّع',
    hint: 'Measures the extent to which real-time end-to-end supply chain visibility is achieved — from supplier to customer — enabling proactive exception management.',
    hintAr: 'يقيس مدى تحقيق الرؤية الآنية من طرف إلى طرف لسلسلة الإمداد — من المورد إلى العميل — مما يُتيح إدارة استثناءات استباقية.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Supply chain visibility dashboard or platform contract',
      labelAr: 'لوحة تحكم رؤية سلسلة التوريد أو عقد المنصة',
      hint:    'Upload a screenshot of your supply chain visibility platform or the vendor contract confirming real-time tracking capability.',
      hintAr:  'ارفع لقطة شاشة من منصة رؤية سلسلة التوريد أو عقد البائع الذي يؤكد قدرة التتبع الآني.',
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How much end-to-end real-time visibility do you have across your supply chain — from upstream supplier inventory to in-transit stock and customer delivery status?',
        qAr: 'ما مدى الرؤية الآنية من طرف إلى طرف لديكم عبر سلسلة الإمداد — من مخزون الموردين في المصدر إلى المخزون في الطريق وحالة التسليم للعملاء؟',
        levels: [
          'No real-time supply chain visibility. Stock positions and order status are determined manually through periodic reports, phone calls, or emails.',
          'Inventory visibility exists for own warehouses but upstream supplier stock and in-transit visibility is absent; tracking is reactive when issues arise.',
          'Key order and inventory positions are visible within the ERP/WMS; milestone-based shipment tracking is available for major lanes; exceptions are identified through daily reports.',
          'A control tower or visibility platform aggregates inventory, order, and transport status across the supply chain; near-real-time exception alerts enable proactive management.',
          'Full end-to-end supply chain visibility platform with real-time inventory, in-transit, and order status across all tiers; AI-driven exception management predicts and resolves disruptions before they escalate.',
        ],
        levelsAr: [
          'لا رؤية آنية لسلسلة الإمداد. مراكز المخزون وحالة الطلبات تُحدَّد يدويًا عبر تقارير دورية أو مكالمات هاتفية أو رسائل بريد.',
          'رؤية المخزون موجودة لمستودعات المنشأة لكن رؤية مخزون الموردين في المصدر والمخزون في العبور غائبة؛ والتتبّع تفاعلي عند ظهور المشكلات.',
          'مراكز الطلبات والمخزون الرئيسية مرئية داخل ERP/WMS؛ وتتبّع الشحنات القائم على المراحل متاح للخطوط الرئيسية؛ والاستثناءات مُحددة عبر تقارير يومية.',
          'برج تحكم أو منصة رؤية تجمّع مخزون وطلبات وحالة النقل عبر سلسلة الإمداد؛ وتنبيهات استثناءات شبه آنية تُتيح إدارة استباقية.',
          'منصة رؤية كاملة من طرف إلى طرف لسلسلة الإمداد بمخزون وعبور وحالة طلبات آنية عبر جميع المستويات؛ وإدارة استثناءات مدفوعة بالذكاء الاصطناعي تتنبأ بالاضطرابات وتعالجها قبل تفاقمها.',
        ],
      },
      {
        q: 'How effectively do you use IoT, RFID, or GPS tracking technologies to enhance supply chain asset and cargo visibility — and how is the data integrated into operational decision-making?',
        qAr: 'ما مدى فعالية استخدامكم لتقنيات إنترنت الأشياء وRFID وتتبّع GPS لتعزيز رؤية الأصول والبضائع في سلسلة الإمداد — وكيف تُدمَج البيانات في اتخاذ القرارات التشغيلية؟',
        levels: [
          'No IoT, RFID, or GPS tracking is in use for supply chain assets or cargo.',
          'GPS tracking is used for some fleet vehicles but data is not integrated with supply chain systems; RFID or IoT adoption is absent.',
          'GPS tracking is deployed for all own fleet; basic RFID is used in key warehouses; tracking data is available but not fully integrated into planning or operations systems.',
          'Integrated IoT/RFID/GPS platform provides asset and cargo visibility across key supply chain nodes; data feeds are integrated into the WMS, TMS, and control tower.',
          'Comprehensive IoT ecosystem with RFID, GPS, and sensor data covering all significant supply chain assets; real-time data is integrated into AI-powered supply chain platforms for autonomous exception management.',
        ],
        levelsAr: [
          'لا يُستخدَم إنترنت الأشياء أو RFID أو تتبّع GPS لأصول سلسلة الإمداد أو البضائع.',
          'تتبّع GPS مستخدَم لبعض سيارات الأسطول لكن البيانات غير مدمجة مع أنظمة سلسلة الإمداد؛ وتبني RFID أو إنترنت الأشياء غائب.',
          'تتبّع GPS منتشر لجميع الأسطول الخاص؛ وRFID أساسي يُستخدَم في المستودعات الرئيسية؛ وبيانات التتبّع متاحة لكن غير مدمجة بالكامل مع أنظمة التخطيط أو العمليات.',
          'منصة إنترنت الأشياء/RFID/GPS متكاملة توفر رؤية الأصول والبضائع عبر النقاط الرئيسية لسلسلة الإمداد؛ وتغذيات البيانات مدمجة في WMS وTMS وبرج التحكم.',
          'منظومة إنترنت أشياء شاملة بـ RFID وGPS وبيانات حساسات تغطي جميع أصول سلسلة الإمداد الجوهرية؛ والبيانات الآنية مدمجة في منصات سلسلة الإمداد المدفوعة بالذكاء الاصطناعي لإدارة استثناءات مستقلة.',
        ],
      },
    ],
  },

  /* ── 6-3  Predictive Analytics & AI Adoption ────────────────────────── */
  {
    id: 'digital-analytics',
    title: 'Predictive Analytics & AI Adoption',
    titleAr: 'التحليلات التنبؤية وتبنّي الذكاء الاصطناعي',
    hint: 'Evaluates the organisation\'s capability to use advanced analytics and AI/ML to forecast demand, predict supply risks, and optimise supply chain decisions.',
    hintAr: 'يقيّم قدرة المنشأة على توظيف التحليلات المتقدمة والذكاء الاصطناعي/تعلّم الآلة للتنبؤ بالطلب وتوقّع مخاطر الإمداد وتحسين قرارات سلسلة الإمداد.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.5, banking: 1.0, other: 1.0,
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How sophisticated is your use of data analytics for supply chain performance management — moving beyond descriptive reporting towards predictive and prescriptive analytics?',
        qAr: 'ما مدى تطوّر استخدامكم لتحليلات البيانات في إدارة أداء سلسلة الإمداد — بالتجاوز من التقارير الوصفية نحو التحليلات التنبؤية والتوصيفية؟',
        levels: [
          'Reporting is primarily manual (spreadsheets, email reports). No analytics platform is in use and decisions are based on historical summaries without predictive insights.',
          'Basic dashboards exist for key supply chain KPIs; reporting is largely descriptive (what happened); no predictive or prescriptive capability is in use.',
          'A supply chain analytics platform provides near-real-time performance dashboards; trend analysis identifies patterns; some ad-hoc predictive analysis is conducted by an analytics team.',
          'Predictive analytics models are deployed for key use cases (e.g., demand forecasting, lead time prediction, inventory optimisation); outputs feed operational decisions directly.',
          'Advanced AI/ML models drive supply chain decisions autonomously in defined categories; real-time prescriptive analytics surfaces recommended actions; model performance is monitored and improved continuously.',
        ],
        levelsAr: [
          'التقارير أساسًا يدوية (جداول بيانات وتقارير بريد إلكتروني). لا منصة تحليلات يُستخدَم والقرارات تستند إلى ملخصات تاريخية دون رؤى تنبؤية.',
          'لوحات معلومات أساسية لمؤشرات الأداء الرئيسية لسلسلة الإمداد موجودة؛ والتقارير وصفية في معظمها (ماذا حدث)؛ ولا قدرة تنبؤية أو توصيفية مستخدَمة.',
          'منصة تحليلات سلسلة إمداد توفر لوحات معلومات أداء شبه آنية؛ وتحليل الاتجاه يُحدّد الأنماط؛ وبعض التحليل التنبؤي غير المنتظم يُجريه فريق تحليلات.',
          'نماذج تحليلات تنبؤية مُنشَرة لحالات استخدام رئيسية (كالتنبؤ بالطلب وتنبؤ المهل وتحسين المخزون)؛ ومخرجاتها تُغذّي القرارات التشغيلية مباشرةً.',
          'نماذج ذكاء اصطناعي/تعلّم آلة متقدمة تقود قرارات سلسلة الإمداد باستقلالية في فئات محددة؛ والتحليلات التوصيفية الآنية تُبرز الإجراءات الموصى بها؛ وأداء النماذج يُراقَب ويُحسَّن باستمرار.',
        ],
      },
      {
        q: 'How mature is your organisation\'s adoption of AI and machine learning for supply chain applications — including demand sensing, supplier risk prediction, autonomous replenishment, and generative AI for procurement?',
        qAr: 'ما مدى نضج تبنّي مؤسستكم للذكاء الاصطناعي وتعلّم الآلة لتطبيقات سلسلة الإمداد — شاملًا استشعار الطلب وتوقّع مخاطر الموردين والتجديد المستقل والذكاء الاصطناعي التوليدي للمشتريات؟',
        levels: [
          'No AI or machine learning is in use for supply chain applications. Decisions are made through manual analysis and experience.',
          'AI/ML awareness is high but deployment is limited to experimental pilots with no production implementation or measurable business impact.',
          'AI/ML is deployed in production for 1-2 use cases (e.g., demand forecasting, delivery ETA prediction); business impact is tracked and positive.',
          'AI/ML is deployed across multiple supply chain domains; a data science team manages models in production; model governance (performance monitoring, bias checking) is in place.',
          'AI is a core supply chain capability; agentic AI handles autonomous decisions in defined categories; generative AI accelerates procurement and contract analysis; AI governance is board-approved.',
        ],
        levelsAr: [
          'لا يُستخدَم ذكاء اصطناعي أو تعلّم آلة لتطبيقات سلسلة الإمداد. القرارات تُتخَذ عبر تحليل يدوي وخبرة.',
          'الوعي بالذكاء الاصطناعي/تعلّم الآلة عالٍ لكن التطبيق مقتصر على تجارب تجريبية دون تطبيق إنتاجي أو أثر تجاري قابل للقياس.',
          'الذكاء الاصطناعي/تعلّم الآلة مُنشَر في الإنتاج لـ 1-2 حالة استخدام (كالتنبؤ بالطلب وتنبؤ الوصول)؛ والأثر التجاري متابَع وإيجابي.',
          'الذكاء الاصطناعي/تعلّم الآلة مُنشَر عبر نطاقات سلسلة إمداد متعددة؛ وفريق علوم البيانات يدير النماذج في الإنتاج؛ وحوكمة النماذج (مراقبة الأداء وفحص التحيّز) قائمة.',
          'الذكاء الاصطناعي قدرة أساسية في سلسلة الإمداد؛ والذكاء الاصطناعي الوكيلي يتولى قرارات مستقلة في فئات محددة؛ والذكاء الاصطناعي التوليدي يُسرّع تحليل المشتريات والعقود؛ وحوكمة الذكاء الاصطناعي معتمدة من مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 6-4  Automation & Process Digitalisation ───────────────────────── */
  {
    id: 'digital-automation',
    title: 'Automation & Process Digitalisation',
    titleAr: 'الأتمتة والرقمنة التشغيلية',
    hint: 'Assesses the degree to which manual supply chain processes have been automated — covering RPA, workflow automation, e-procurement, and touchless operations.',
    hintAr: 'يقيس مدى أتمتة العمليات اليدوية لسلسلة الإمداد — شاملًا RPA وأتمتة السير والمشتريات الإلكترونية والعمليات غير اللمسية.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.0, other: 1.0,
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How automated are your procure-to-pay and order-to-cash processes — including purchase requisition approval, PO creation, invoice processing, and payment initiation?',
        qAr: 'ما مدى أتمتة عمليات الشراء حتى السداد والطلب حتى التحصيل — شاملًا اعتماد طلبات الشراء وإنشاء أوامر الشراء ومعالجة الفواتير وبدء الدفع؟',
        levels: [
          'P2P and O2C processes are predominantly manual. Purchase requisitions are raised on paper or email; invoice processing requires full manual data entry.',
          'Electronic workflows exist for purchase approval but PO creation, invoice matching, and payment initiation still involve significant manual steps.',
          'P2P is substantially automated; e-procurement covers most spend categories; automated 3-way matching handles the majority of standard invoices.',
          'Touchless P2P is achieved for standard spend categories (≥70% of invoices are processed without human intervention); exceptions are flagged automatically for review.',
          'Fully automated P2P with ≥90% touchless invoices; AI-powered invoice processing handles exceptions; robotic process automation (RPA) covers remaining manual steps; e-procurement extends to supplier self-service.',
        ],
        levelsAr: [
          'عمليات P2P وO2C في معظمها يدوية. طلبات الشراء تُرفَع ورقيًا أو بالبريد الإلكتروني؛ ومعالجة الفواتير تتطلب إدخالًا يدويًا كاملًا.',
          'سير إلكترونية للموافقة على المشتريات موجودة لكن إنشاء أوامر الشراء ومطابقة الفواتير وبدء الدفع تتضمن خطوات يدوية جوهرية.',
          'P2P مُؤتمَتة جوهريًا؛ والمشتريات الإلكترونية تغطي معظم فئات الإنفاق؛ والمطابقة الثلاثية الآلية تعالج غالبية الفواتير القياسية.',
          'P2P غير لمسية تتحقق لفئات الإنفاق القياسية (≥70% من الفواتير تُعالَج دون تدخل بشري)؛ والاستثناءات تُبلَّغ آليًا للمراجعة.',
          'P2P مُؤتمَتة بالكامل بـ ≥90% فواتير غير لمسية؛ ومعالجة فواتير مدفوعة بالذكاء الاصطناعي تتولى الاستثناءات؛ والأتمتة الروبوتية (RPA) تغطي الخطوات اليدوية المتبقية؛ والمشتريات الإلكترونية تمتد لخدمة ذاتية للموردين.',
        ],
      },
      {
        q: 'How broadly has robotic process automation (RPA) or intelligent automation been deployed across supply chain back-office functions — and how is ROI tracked and validated?',
        qAr: 'ما مدى انتشار الأتمتة الروبوتية للعمليات (RPA) أو الأتمتة الذكية عبر وظائف المكتب الخلفي لسلسلة الإمداد — وكيف يُتابَع العائد على الاستثمار ويُتحقَّق منه؟',
        levels: [
          'No RPA or intelligent automation is deployed. All back-office supply chain tasks (data entry, reconciliation, reporting) are performed manually.',
          'RPA awareness and interest exist; one or two isolated automation scripts may exist but no formal programme, governance, or ROI tracking is in place.',
          'An RPA programme is underway with 5-10 processes automated in supply chain back-office functions; ROI is tracked for each bot; a Centre of Excellence (CoE) is being established.',
          'RPA is deployed across 10+ supply chain processes; intelligent automation (ML-enhanced RPA) handles complex exception cases; ROI is measured and reported quarterly; the CoE governs the pipeline.',
          'Hyperautomation is embedded as a strategic capability; AI-driven process discovery identifies new automation opportunities continuously; the full automation programme delivers measurable cost and efficiency gains reported at board level.',
        ],
        levelsAr: [
          'لا يُنشَر RPA أو أتمتة ذكية. جميع مهام المكتب الخلفي لسلسلة الإمداد (إدخال البيانات والتسوية والتقارير) تُؤدَّى يدويًا.',
          'وعي بـ RPA واهتمام به موجودان؛ وقد يوجد نص أتمتة أو اثنان معزولان لكن دون برنامج رسمي أو حوكمة أو تتبّع عائد استثمار.',
          'برنامج RPA جارٍ بـ 5-10 عمليات مُؤتمَتة في وظائف المكتب الخلفي لسلسلة الإمداد؛ وعائد الاستثمار متابَع لكل روبوت؛ ومركز الامتياز (CoE) قيد التأسيس.',
          'RPA مُنشَر عبر 10+ عمليات سلسلة إمداد؛ والأتمتة الذكية (RPA المُعزَّزة بتعلّم الآلة) تتولى حالات الاستثناءات المعقدة؛ وعائد الاستثمار يُقاس ويُبلَّغ عنه فصليًا؛ ومركز الامتياز يحكم خط الأنابيب.',
          'الفائق الأتمتة متجذّر كقدرة استراتيجية؛ واكتشاف العمليات المدفوع بالذكاء الاصطناعي يُحدّد فرص أتمتة جديدة باستمرار؛ وبرنامج الأتمتة الكامل يحقق مكاسب تكلفة وكفاءة مقيسة تُبلَّغ على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 6-5  Cybersecurity & Data Governance ───────────────────────────── */
  {
    id: 'digital-cyber',
    title: 'Cybersecurity & Data Governance',
    titleAr: 'الأمن السيبراني وحوكمة البيانات',
    hint: 'Evaluates the maturity of supply chain cybersecurity, data privacy compliance, third-party cyber risk management, and information security governance.',
    hintAr: 'يقيّم نضج الأمن السيبراني لسلسلة الإمداد وامتثال خصوصية البيانات وإدارة المخاطر السيبرانية للأطراف الثالثة وحوكمة أمن المعلومات.',
    benchmarks: { gcc: 2.2, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.0,
    },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How robustly is supply chain cybersecurity governed — covering information security policies, access controls for supply chain systems, incident response plans, and regular penetration testing?',
        qAr: 'ما مدى متانة حوكمة الأمن السيبراني لسلسلة الإمداد — شاملًا سياسات أمن المعلومات وضوابط الوصول لأنظمة سلسلة الإمداد وخطط الاستجابة للحوادث واختبارات الاختراق المنتظمة؟',
        levels: [
          'No formal cybersecurity governance exists for supply chain systems. Access controls are informal and no incident response plan is in place.',
          'Basic IT security measures (passwords, antivirus) are in place but no supply chain-specific cybersecurity framework, ISMS, or incident response plan exists.',
          'An information security management system (ISO 27001 or equivalent) covers supply chain systems; access controls are defined; an incident response plan exists and is tested annually.',
          'ISO 27001-certified ISMS governs supply chain systems; role-based access controls are enforced; annual penetration testing is conducted; incident response exercises are run with cross-functional teams.',
          'Best-in-class supply chain cybersecurity: zero-trust architecture deployed; continuous threat monitoring; automated incident response; ISO 27001 and NCA (Saudi cybersecurity) requirements are met and externally audited.',
        ],
        levelsAr: [
          'لا توجد حوكمة أمن سيبراني رسمية لأنظمة سلسلة الإمداد. ضوابط الوصول غير رسمية ولا توجد خطة استجابة للحوادث.',
          'تدابير أمن IT أساسية (كلمات مرور ومضاد فيروسات) موجودة لكن لا إطار أمن سيبراني خاص بسلسلة الإمداد أو نظام ISMS أو خطة استجابة للحوادث.',
          'نظام إدارة أمن المعلومات (ISO 27001 أو ما يعادله) يغطي أنظمة سلسلة الإمداد؛ وضوابط الوصول محددة؛ وخطة استجابة للحوادث موجودة وتُختبَر سنويًا.',
          'نظام ISMS معتمد وفق ISO 27001 يحكم أنظمة سلسلة الإمداد؛ وضوابط الوصول القائمة على الأدوار مُطبَّقة؛ واختبار اختراق سنوي يُجرى؛ وتدريبات الاستجابة للحوادث تُنفَّذ مع فرق متعددة الوظائف.',
          'أمن سيبراني لسلسلة الإمداد بمستوى الأفضل في الفئة: بنية ثقة صفرية مُنشَرة؛ ومراقبة مستمرة للتهديدات؛ واستجابة آلية للحوادث؛ ومتطلبات ISO 27001 والهيئة الوطنية للأمن السيبراني مُستوفاة ومدقَّقة خارجيًا.',
        ],
      },
      {
        q: 'How effectively is third-party and supplier cyber risk managed — including cyber due diligence for new suppliers, ongoing monitoring, contractual cybersecurity requirements, and supply chain attack response?',
        qAr: 'ما مدى فعالية إدارة المخاطر السيبرانية للأطراف الثالثة والموردين — شاملًا العناية الواجبة السيبرانية للموردين الجدد والمراقبة المستمرة ومتطلبات الأمن السيبراني التعاقدية والاستجابة لهجمات سلسلة الإمداد؟',
        levels: [
          'Third-party cyber risk is not assessed. Suppliers are onboarded without any cybersecurity due diligence and no contractual security requirements are in place.',
          'Basic cybersecurity requirements are included in major supplier contracts but due diligence is ad-hoc; no ongoing monitoring or supplier security assessment framework exists.',
          'A third-party cyber risk framework screens new suppliers above a defined spend or system access threshold; contractual cybersecurity clauses are standard; periodic supplier security questionnaires are used.',
          'Third-party cyber risk is assessed for all significant suppliers using a tiered risk framework; high-risk suppliers undergo annual independent audits; supply chain attack scenarios are included in incident response exercises.',
          'Comprehensive third-party cyber risk programme aligned to NIST CSF or ISO 27036; continuous supplier security monitoring via intelligence feeds; supply chain cyber incidents are tracked and remediated; disclosed in annual reporting.',
        ],
        levelsAr: [
          'المخاطر السيبرانية للأطراف الثالثة لا تُقيَّم. الموردون يُؤهَّلون دون أي عناية واجبة في الأمن السيبراني ولا متطلبات أمنية تعاقدية قائمة.',
          'متطلبات أمن سيبراني أساسية مُدرَجة في عقود الموردين الكبرى لكن العناية الواجبة ارتجالية؛ ولا إطار مراقبة مستمرة أو تقييم أمني للموردين.',
          'إطار مخاطر سيبرانية للأطراف الثالثة يفرز الموردين الجدد فوق عتبة إنفاق أو وصول نظام محددة؛ وبنود الأمن السيبراني التعاقدية معيارية؛ واستبيانات الأمن الدورية للموردين تُستخدَم.',
          'المخاطر السيبرانية للأطراف الثالثة تُقيَّم لجميع الموردين الجوهريين باستخدام إطار مخاطر متدرج؛ والموردون عالو المخاطر يخضعون لتدقيقات مستقلة سنوية؛ وسيناريوهات الهجمات السيبرانية على سلسلة الإمداد مدرجة في تدريبات الاستجابة.',
          'برنامج شامل لمخاطر الأطراف الثالثة مواءَم مع NIST CSF أو ISO 27036؛ ومراقبة مستمرة لأمن الموردين عبر تغذيات الاستخبارات؛ والحوادث السيبرانية في سلسلة الإمداد متابَعة ومعالَجة؛ ومُفصَح عنها في التقارير السنوية.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 7 — DEMAND PLANNING & S&OP  (segIdx 7)
   Sub-segments:
     0 Forecasting Methods & Accuracy
     1 S&OP Integration
     2 Demand Sensing
     3 Collaborative Forecasting (CPFR)
     4 Seasonal & Promotional Planning
     5 New Product Introduction Planning
═══════════════════════════════════════════════════════════════════════════ */

export const DEMAND_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 7-0  Forecasting Methods & Accuracy ─────────────────────────────── */
  {
    id: 'demand-forecasting',
    title: 'Forecasting Methods & Accuracy',
    titleAr: 'أساليب التنبؤ ودقته',
    hint: 'Evaluates the statistical rigour of forecasting methods, MAPE/BIAS measurement, and continuous improvement of forecast accuracy.',
    hintAr: 'يقيّم الصرامة الإحصائية لأساليب التنبؤ وقياس MAPE/BIAS والتحسين المستمر لدقة التنبؤ.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 0.5, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Forecast accuracy report or MAPE trend data',
      labelAr: 'تقرير دقة التنبؤ أو بيانات MAPE',
      hint:    'Upload your most recent demand forecast accuracy report showing MAPE, bias, and trend data.',
      hintAr:  'ارفع أحدث تقرير دقة التنبؤ بالطلب يُظهر MAPE والتحيز وبيانات الاتجاه.',
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How sophisticated are the statistical methods used to generate demand forecasts — and how consistently is forecast accuracy (MAPE, BIAS) measured, reported, and improved?',
        qAr: 'ما مدى تطوّر الأساليب الإحصائية المستخدمة لإعداد توقعات الطلب — وما مدى اتساق قياس دقة التنبؤ (MAPE وBIAS) والإبلاغ عنها وتحسينها؟',
        levels: [
          'Demand forecasts are based on informal gut-feel or simple extrapolation of recent sales. No statistical methods are applied and forecast accuracy is never measured.',
          'Basic statistical methods (e.g., moving average) are applied to major SKUs; forecast accuracy is estimated informally but not tracked as a KPI.',
          'Statistical forecasting methods (exponential smoothing, seasonal decomposition) are applied across all significant SKUs; MAPE is calculated monthly for major categories.',
          'Advanced statistical models (ARIMA, multiple regression) are used; MAPE and BIAS are tracked at SKU level with defined improvement targets; root-cause analysis is performed for major misses.',
          'ML-powered forecasting models are deployed and continuously refined; Forecast Value Add (FVA) analysis validates that statistical models outperform naive benchmarks; MAPE is benchmarked against industry leaders; statistical model selection is automated by SKU attribute; forecast bias is near-zero.',
        ],
        levelsAr: [
          'توقعات الطلب تستند إلى الحدس غير الرسمي أو استقراء بسيط للمبيعات الأخيرة. لا أساليب إحصائية تُطبَّق ودقة التنبؤ لا تُقاس أبدًا.',
          'أساليب إحصائية أساسية (كالمتوسط المتحرك) تُطبَّق على أصناف SKU الرئيسية؛ ودقة التنبؤ تُقدَّر بشكل غير رسمي لكن لا تُتابَع كمؤشر أداء.',
          'أساليب تنبؤ إحصائية (تمهيد أسّي وتحليل موسمي) تُطبَّق على جميع أصناف SKU الجوهرية؛ وMAPE تُحسَب شهريًا للفئات الرئيسية.',
          'نماذج إحصائية متقدمة (ARIMA والانحدار المتعدد) تُستخدَم؛ وMAPE وBIAS تُتابَعان على مستوى SKU بمستهدفات تحسين محددة؛ وتحليل السبب الجذري يُجرى للانحرافات الكبرى.',
          'نماذج تنبؤ مدفوعة بتعلّم الآلة مُنشَرة ومُحسَّنة باستمرار؛ وتحليل القيمة المضافة للتنبؤ (FVA) يُتحقَّق به من أن النماذج الإحصائية تتفوق على مرجع التنبؤ البسيط؛ وMAPE تُقارَن معياريًا بقادة القطاع؛ وانتقاء النماذج الإحصائية آلي حسب خصائص SKU؛ وانحياز التنبؤ شبه معدوم.',
        ],
      },
      {
        q: 'How effectively are demand planning inputs integrated from multiple sources — including sales pipeline data, market intelligence, promotional plans, and customer forecasts — to improve accuracy?',
        qAr: 'ما مدى فعالية دمج مدخلات تخطيط الطلب من مصادر متعددة — شاملًا بيانات خط مبيعات واستخبارات السوق وخطط الترويج وتوقعات العملاء — لتحسين الدقة؟',
        levels: [
          'Demand planning relies on internal historical sales data only. External inputs (market intelligence, customer forecasts, promotions) are not systematically incorporated.',
          'Sales team input is occasionally sought for major accounts but the process is informal; promotional plans are not systematically included in demand forecasts.',
          'A structured demand planning process collects sales pipeline data and promotional calendar inputs; customer forecasts are sought for key accounts on a regular basis.',
          'Multi-source demand inputs (sales, marketing, customers, market data) are formally integrated through a structured review process; inputs are reconciled and weighted by reliability.',
          'A demand planning platform integrates real-time sales, customer sell-through data, market signals, and ML-generated external indicators; a formal input governance process ensures data quality and timeliness.',
        ],
        levelsAr: [
          'تخطيط الطلب يعتمد فقط على بيانات المبيعات التاريخية الداخلية. المدخلات الخارجية (استخبارات السوق وتوقعات العملاء والترويج) لا تُدمَج منهجيًا.',
          'مدخلات فريق المبيعات تُطلَب أحيانًا للحسابات الكبرى لكن العملية غير رسمية؛ وخطط الترويج لا تُدرَج منهجيًا في توقعات الطلب.',
          'عملية منظمة لتخطيط الطلب تجمع بيانات خط المبيعات ومدخلات التقويم الترويجي؛ وتوقعات العملاء تُطلَب من الحسابات الرئيسية بانتظام.',
          'مدخلات الطلب من مصادر متعددة (المبيعات والتسويق والعملاء وبيانات السوق) مدمجة رسميًا عبر عملية مراجعة منظمة؛ والمدخلات متسوّاة وموزونة حسب الموثوقية.',
          'منصة تخطيط طلب تدمج مبيعات آنية وبيانات مبيعات العملاء وإشارات السوق ومؤشرات خارجية يولّدها تعلّم الآلة؛ وعملية حوكمة مدخلات رسمية تضمن جودة البيانات وحسن توقيتها.',
        ],
      },
    ],
  },

  /* ── 7-1  S&OP Integration ───────────────────────────────────────────── */
  {
    id: 'demand-sop',
    title: 'S&OP Integration',
    titleAr: 'تكامل S&OP',
    hint: 'Assesses the maturity of the Sales & Operations Planning process — cross-functional alignment, cadence discipline, and decision authority.',
    hintAr: 'يقيس نضج عملية التخطيط للمبيعات والعمليات — المواءَمة المتعددة الوظائف وانتظام الدورة وصلاحية اتخاذ القرار.',
    benchmarks: { gcc: 2.2, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 0.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How mature and disciplined is your S&OP process — in terms of cross-functional participation, meeting cadence, data quality, decision-making authority, and executive sponsorship?',
        qAr: 'ما مدى نضج وانضباط عملية S&OP لديكم — من حيث المشاركة المتعددة الوظائف وانتظام الاجتماعات وجودة البيانات وصلاحية اتخاذ القرار والرعاية التنفيذية؟',
        levels: [
          'No formal S&OP process exists. Sales, operations, and finance make independent plans that are not reconciled, causing regular supply-demand imbalances.',
          'Informal S&OP meetings occur irregularly; attendance is inconsistent; discussions are dominated by short-term firefighting with no structured agenda or decision log.',
          'A monthly S&OP cycle is in place with defined steps (demand review, supply review, financial reconciliation, executive S&OP); key functions attend consistently; minutes and decisions are documented.',
          'A disciplined S&OP cycle runs monthly with structured pre-reviews, executive sign-off on the consensus plan, and a formal decision log; performance against the plan is reviewed in each cycle.',
          'IBP (Integrated Business Planning) extends S&OP to a rolling 24-36 month horizon; financial and strategic planning are fully integrated; the process is governed by the executive team with board-level visibility.',
        ],
        levelsAr: [
          'لا توجد عملية S&OP رسمية. المبيعات والعمليات والمالية تضع خططًا مستقلة غير متسوّاة مما يسبب اختلالات منتظمة في الإمداد والطلب.',
          'اجتماعات S&OP غير رسمية تُعقَد بشكل غير منتظم؛ والحضور غير متسق؛ والنقاشات يهيمن عليها إطفاء حرائق قصير المدى دون أجندة منظمة أو سجل قرارات.',
          'دورة S&OP شهرية قائمة بخطوات محددة (مراجعة الطلب ومراجعة الإمداد والتسوية المالية وS&OP التنفيذية)؛ والوظائف الرئيسية تحضر باتساق؛ والمحاضر والقرارات موثّقة.',
          'دورة S&OP منضبطة تُنفَّذ شهريًا بمراجعات تمهيدية منظمة وموافقة تنفيذية على الخطة التوافقية وسجل قرارات رسمي؛ وأداء مقابل الخطة يُراجَع في كل دورة.',
          'التخطيط التجاري المتكامل (IBP) يوسّع S&OP لأفق متجدد 24-36 شهرًا؛ والتخطيط المالي والاستراتيجي مدمجان بالكامل؛ والعملية محكومة من الفريق التنفيذي برؤية على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively does the S&OP process translate into actionable supply plans — with clear supply constraints surfaced, trade-offs resolved, and confirmed commitments to customers?',
        qAr: 'ما مدى فعالية ترجمة عملية S&OP إلى خطط إمداد قابلة للتنفيذ — مع إبراز قيود الإمداد الواضحة وحل المفاضلات وتأكيد الالتزامات للعملاء؟',
        levels: [
          'S&OP output does not produce a binding supply plan. Supply capabilities are not formally checked against the demand plan and customer commitments are made without supply confirmation.',
          'A supply review is conducted but supply constraints are communicated late or informally; trade-offs between service, stock, and cost are not explicitly resolved in the S&OP forum.',
          'Supply capability is formally reviewed against the demand plan in each S&OP cycle; capacity and material constraints are identified and escalated; a consensus supply plan is produced.',
          'Rough-cut capacity planning (RCCP) integrates with the S&OP cycle; supply constraints are quantified and trade-offs are explicitly resolved with cost and service impact modelling.',
          'IBP-level supply planning integrates capacity, materials, and financial constraints in a fully aligned plan; automated scenario modelling optimises trade-offs; customer commitments are confirmed from a validated supply plan.',
        ],
        levelsAr: [
          'مخرج S&OP لا يُنتج خطة إمداد ملزمة. قدرات الإمداد لا تُتحقَّق رسميًا مقابل خطة الطلب والتزامات العملاء تُقطَع دون تأكيد إمداد.',
          'مراجعة الإمداد تُجرى لكن قيود الإمداد تُوصَّل متأخرة أو بشكل غير رسمي؛ والمفاضلات بين الخدمة والمخزون والتكلفة لا تُحسَم صراحةً في منتدى S&OP.',
          'قدرة الإمداد تُراجَع رسميًا مقابل خطة الطلب في كل دورة S&OP؛ وقيود الطاقة والمواد مُحددة ومُصعَّدة؛ وخطة إمداد توافقية تُنتَج.',
          'تخطيط الطاقة التقريبي (RCCP) مدمج مع دورة S&OP؛ وقيود الإمداد مُقاسة والمفاضلات محسومة صراحةً بنمذجة أثر التكلفة والخدمة.',
          'تخطيط الإمداد على مستوى IBP يدمج قيود الطاقة والمواد والمالية في خطة متوافقة بالكامل؛ ونمذجة سيناريوهات آلية تُحسّن المفاضلات؛ والتزامات العملاء مؤكَّدة من خطة إمداد مُتحقَّق منها.',
        ],
      },
    ],
  },

  /* ── 7-2  Demand Sensing ─────────────────────────────────────────────── */
  {
    id: 'demand-sensing',
    title: 'Demand Sensing',
    titleAr: 'استشعار الطلب',
    hint: 'Assesses the use of real-time or near-real-time demand signals to improve short-cycle forecasting and operational responsiveness.',
    hintAr: 'يقيس استخدام إشارات الطلب الآنية أو شبه الآنية لتحسين التنبؤ قصير الدورة والاستجابة التشغيلية.',
    benchmarks: { gcc: 1.9, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.0, marine: 0.5, construction: 0.5, oil_gas: 1.0,
      government: 0.5, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How effectively does your organisation use near-real-time demand signals — such as point-of-sale data, distributor sell-out, e-commerce trends, and web analytics — to adjust short-term demand plans?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لإشارات الطلب شبه الآنية — كبيانات نقطة البيع ومبيعات الموزعين واتجاهات التجارة الإلكترونية وتحليلات الويب — لتعديل خطط الطلب قصيرة المدى؟',
        levels: [
          'Demand signals beyond historical order data are not used. Near-real-time data (POS, sell-through) is not available or not connected to demand planning.',
          'Some POS or sell-through data is available but is reviewed monthly or less frequently and is not systematically fed into the demand planning process.',
          'POS or distributor sell-through data is reviewed weekly; significant anomalies are flagged to the demand planning team; short-term forecast adjustments are made when data supports it.',
          'Near-real-time POS and e-commerce data is integrated into the demand planning platform; automated alerts flag significant deviations; short-term forecasts are updated weekly based on actual demand signals.',
          'A fully deployed demand sensing capability integrates all available real-time demand signals; AI-driven models update short-term forecasts daily; demand sensing outputs directly drive replenishment decisions.',
        ],
        levelsAr: [
          'إشارات الطلب ما وراء بيانات الطلبات التاريخية لا تُستخدَم. البيانات شبه الآنية (نقطة البيع والمبيعات الفعلية) غير متوفرة أو غير مرتبطة بتخطيط الطلب.',
          'بعض بيانات نقطة البيع أو مبيعات الموزعين متاحة لكن تُراجَع شهريًا أو أقل ولا تُغذَّى منهجيًا في عملية تخطيط الطلب.',
          'بيانات نقطة البيع أو مبيعات الموزعين تُراجَع أسبوعيًا؛ والانحرافات الجوهرية تُبلَّغ لفريق تخطيط الطلب؛ وتعديلات التنبؤ قصير المدى تُجرى عندما تدعم البيانات ذلك.',
          'بيانات نقطة البيع والتجارة الإلكترونية شبه الآنية مدمجة في منصة تخطيط الطلب؛ وتنبيهات آلية تُبلّغ عن الانحرافات الجوهرية؛ والتنبؤات قصيرة المدى تُحدَّث أسبوعيًا بناءً على إشارات الطلب الفعلية.',
          'قدرة استشعار طلب مُنشَرة بالكامل تدمج جميع إشارات الطلب الآنية المتاحة؛ ونماذج مدفوعة بالذكاء الاصطناعي تُحدّث التنبؤات قصيرة المدى يوميًا؛ ومخرجات استشعار الطلب تُوجّه مباشرةً قرارات التجديد.',
        ],
      },
      {
        q: 'How well does your organisation manage demand volatility — through exception-based management, demand shaping levers, and structured escalation processes for supply-demand imbalances?',
        qAr: 'ما مدى جودة إدارة مؤسستكم لتقلّب الطلب — عبر الإدارة القائمة على الاستثناءات وروافع تشكيل الطلب وعمليات التصعيد المنظمة لاختلالات الإمداد والطلب؟',
        levels: [
          'Demand volatility is managed entirely reactively. Supply-demand imbalances are discovered only when they cause stockouts or over-stocks.',
          'Significant demand deviations are identified from monthly reports; responses are ad-hoc with no structured demand shaping or escalation process.',
          'Exception-based demand management flags significant deviations (±15% vs. plan) for review; a defined escalation path exists for supply-demand imbalances exceeding defined thresholds.',
          'Automated exception management is embedded in the demand planning platform; demand shaping levers (pricing, promotions, substitution) are actively used to manage imbalances; escalation paths are defined by value and urgency.',
          'Intelligent exception management with AI-driven root cause analysis; demand shaping playbooks are deployed by scenario; real-time supply-demand balancing is achieved with minimal human intervention for standard cases.',
        ],
        levelsAr: [
          'تقلّب الطلب يُدار تفاعليًا كليًا. اختلالات الإمداد والطلب لا تُكتشَف إلا حين تسبب نفاد مخزون أو تراكمه.',
          'الانحرافات الجوهرية في الطلب مُحددة من التقارير الشهرية؛ والاستجابات ارتجالية دون عملية منظمة لتشكيل الطلب أو التصعيد.',
          'الإدارة القائمة على الاستثناءات تُبلّغ عن الانحرافات الجوهرية (±15% مقابل الخطة) للمراجعة؛ ومسار تصعيد محدد موجود لاختلالات الإمداد والطلب التي تتجاوز عتبات محددة.',
          'إدارة الاستثناءات الآلية متجذّرة في منصة تخطيط الطلب؛ وروافع تشكيل الطلب (التسعير والترويج والبدائل) تُستخدَم فعليًا لإدارة الاختلالات؛ ومسارات التصعيد محددة حسب القيمة والإلحاح.',
          'إدارة استثناءات ذكية بتحليل سبب جذري مدفوع بالذكاء الاصطناعي؛ وكتيبات تشكيل الطلب مُنشَرة حسب السيناريو؛ وتحقيق توازن آني للإمداد والطلب بأدنى تدخل بشري للحالات القياسية.',
        ],
      },
    ],
  },

  /* ── 7-3  Collaborative Forecasting (CPFR) ───────────────────────────── */
  {
    id: 'demand-cpfr',
    title: 'Collaborative Forecasting (CPFR)',
    titleAr: 'التنبؤ التعاوني (CPFR)',
    hint: 'Evaluates the maturity of collaborative planning, forecasting, and replenishment programmes with key customers and suppliers.',
    hintAr: 'يقيّم نضج برامج التخطيط والتنبؤ والتجديد التعاوني مع العملاء الرئيسيين والموردين.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.0, marine: 0.5, construction: 0.5, oil_gas: 1.0,
      government: 0.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How mature is your collaborative planning, forecasting, and replenishment (CPFR) programme with key customers — in terms of data sharing, joint forecast reconciliation, and supply commitment protocols?',
        qAr: 'ما مدى نضج برنامج التخطيط والتنبؤ والتجديد التعاوني (CPFR) مع عملائكم الرئيسيين — من حيث تبادل البيانات والتسوية المشتركة للتنبؤ وبروتوكولات التزامات الإمداد؟',
        levels: [
          'No collaborative forecasting with customers. Customer demand is estimated from historical orders only with no direct data sharing or joint planning.',
          'Informal demand signals are received from some key customers (phone, email) but there is no structured CPFR agreement, shared platform, or formal joint forecast process.',
          'Formal collaborative forecasting agreements are in place with top 5 customers; quarterly joint forecast reviews are held; customer sell-through data is shared and incorporated into forecasts.',
          'CPFR is implemented with top 10+ customers covering ≥50% of revenue; a shared visibility platform is used; weekly joint forecast alignment meetings resolve significant deviations; VMI is in place for key accounts.',
          'Best-in-class CPFR with all strategic customers via an integrated digital platform; real-time sell-through data is shared; AI-driven joint forecast optimisation; replenishment is triggered automatically from agreed stock norms.',
        ],
        levelsAr: [
          'لا تنبؤ تعاوني مع العملاء. الطلب من العملاء يُقدَّر من الطلبات التاريخية فقط دون تبادل بيانات مباشر أو تخطيط مشترك.',
          'إشارات طلب غير رسمية تُستقبَل من بعض العملاء الرئيسيين (هاتف وبريد إلكتروني) لكن دون اتفاقية CPFR منظمة أو منصة مشتركة أو عملية تنبؤ مشترك رسمية.',
          'اتفاقيات تنبؤ تعاوني رسمية قائمة مع أعلى 5 عملاء؛ واجتماعات مراجعة تنبؤ مشترك فصلية تُعقَد؛ وبيانات مبيعات العملاء الفعلية تُشارَك وتُدمَج في التنبؤات.',
          'CPFR مُطبَّق مع أعلى 10+ عملاء يغطي ≥50% من الإيرادات؛ ومنصة رؤية مشتركة تُستخدَم؛ واجتماعات توافق أسبوعية لتنبؤ مشترك تعالج الانحرافات الجوهرية؛ وVMI قائم للحسابات الرئيسية.',
          'CPFR بمستوى الأفضل في الفئة مع جميع العملاء الاستراتيجيين عبر منصة رقمية متكاملة؛ وبيانات المبيعات الفعلية الآنية تُشارَك؛ وتحسين تنبؤ مشترك مدفوع بالذكاء الاصطناعي؛ والتجديد يُطلَق آليًا من معايير مخزون متفق عليها.',
        ],
      },
    ],
  },

  /* ── 7-4  Seasonal & Promotional Planning ───────────────────────────── */
  {
    id: 'demand-seasonal',
    title: 'Seasonal & Promotional Planning',
    titleAr: 'التخطيط الموسمي والترويجي',
    hint: 'Measures the rigour of planning for seasonal demand peaks and promotional events — pre-build strategies, supply readiness, and post-event reviews.',
    hintAr: 'يقيس صرامة التخطيط لذروات الطلب الموسمي والأحداث الترويجية — استراتيجيات البناء المسبق وجاهزية الإمداد ومراجعات ما بعد الحدث.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 0.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How rigorously are peak season and major promotional events planned from a supply chain perspective — covering pre-build inventory, supplier capacity confirmation, logistics capacity booking, and post-event performance review?',
        qAr: 'ما مدى صرامة تخطيط ذروات الموسم والأحداث الترويجية الكبرى من منظور سلسلة الإمداد — شاملًا مخزون ما قبل البناء وتأكيد طاقة الموردين وحجز طاقة اللوجستيات ومراجعة الأداء بعد الحدث؟',
        levels: [
          'Peak season and promotional events are managed reactively. Supply chain implications are identified only when stock shortages or logistics constraints become visible.',
          'Some informal advance planning occurs for major seasonal peaks (e.g., Ramadan, National Day) but supply confirmation, pre-build targets, and logistics booking are not formally managed.',
          'A formal seasonal and promotional planning process is in place; supply chain implications are identified 8-12 weeks in advance; pre-build targets and logistics capacity are confirmed before the event.',
          'A comprehensive promotional and seasonal planning calendar is managed cross-functionally; supplier capacity and logistics are confirmed 12-16 weeks ahead; pre-build norms are modelled; post-event reviews are conducted.',
          'Best-in-class seasonal and promotional S&OP: 6-month forward planning horizon; AI-driven event uplift modelling; automated pre-build and replenishment triggers; post-event P&L reviews inform future planning.',
        ],
        levelsAr: [
          'ذروات الموسم والأحداث الترويجية تُدار بشكل تفاعلي. تداعيات سلسلة الإمداد لا تُحدَّد إلا عند ظهور نقص المخزون أو قيود اللوجستيات.',
          'بعض التخطيط المسبق غير الرسمي يحدث للذروات الموسمية الكبرى (رمضان واليوم الوطني) لكن تأكيد الإمداد ومستهدفات ما قبل البناء وحجز اللوجستيات لا تُدار رسميًا.',
          'عملية رسمية للتخطيط الموسمي والترويجي قائمة؛ وتداعيات سلسلة الإمداد تُحدَّد قبل 8-12 أسبوعًا؛ ومستهدفات ما قبل البناء وطاقة اللوجستيات مؤكَّدة قبل الحدث.',
          'تقويم شامل للتخطيط الترويجي والموسمي يُدار متعدد الوظائف؛ وطاقة الموردين واللوجستيات مؤكَّدة قبل 12-16 أسبوعًا؛ ومعايير ما قبل البناء منمذَجة؛ ومراجعات ما بعد الحدث تُجرى.',
          'S&OP موسمي وترويجي بمستوى الأفضل في الفئة: أفق تخطيط ستة أشهر؛ ونمذجة رفع الأحداث بالذكاء الاصطناعي؛ ومحفزات آلية لما قبل البناء والتجديد؛ ومراجعات الربح والخسارة بعد الحدث تُوجّه التخطيط المستقبلي.',
        ],
      },
    ],
  },

  /* ── 7-5  New Product Introduction Planning ──────────────────────────── */
  {
    id: 'demand-npi',
    title: 'New Product Introduction Planning',
    titleAr: 'تخطيط إطلاق المنتجات الجديدة',
    hint: 'Evaluates the supply chain readiness process for new product launches — demand ramp planning, supplier qualification, and launch inventory build.',
    hintAr: 'يقيّم عملية جاهزية سلسلة الإمداد لإطلاق المنتجات الجديدة — تخطيط تصاعد الطلب وتأهيل الموردين وبناء مخزون الإطلاق.',
    benchmarks: { gcc: 2.1, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 0.5, marine: 0.5, construction: 0.5, oil_gas: 1.0,
      government: 0.5, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How formally is supply chain planning integrated into the new product introduction (NPI) process — covering supply chain readiness reviews, launch inventory build, supplier qualification timelines, and ramp-up monitoring?',
        qAr: 'ما مدى رسمية دمج تخطيط سلسلة الإمداد في عملية إطلاق المنتجات الجديدة (NPI) — شاملًا مراجعات جاهزية سلسلة الإمداد وبناء مخزون الإطلاق وجداول تأهيل الموردين ومراقبة التصاعد؟',
        levels: [
          'Supply chain is not formally involved in NPI. New products arrive in the launch plan with no confirmed supply, no supplier qualification, and no inventory plan.',
          'Supply chain is consulted informally during NPI but involvement is late and reactive; launch inventory is planned ad-hoc and supplier qualification often delays launch timelines.',
          'Supply chain participates formally in NPI stage-gates; a supply chain readiness checklist covers supplier qualification, component lead time, and minimum launch inventory; readiness is confirmed before launch approval.',
          'A formal NPI supply chain playbook defines readiness gates, launch inventory build models, supplier qualification standards, and ramp-up KPIs; deviations are escalated through a defined risk process.',
          'Supply chain is a co-equal partner in NPI governance; end-to-end supply chain readiness is confirmed at each stage-gate; AI-assisted ramp forecasting models demand uncertainty; launch performance (availability, waste) is tracked vs. plan.',
        ],
        levelsAr: [
          'سلسلة الإمداد غير مُشرَكة رسميًا في NPI. المنتجات الجديدة تصل في خطة الإطلاق دون إمداد مؤكَّد أو تأهيل موردين أو خطة مخزون.',
          'سلسلة الإمداد تُستشار بشكل غير رسمي أثناء NPI لكن المشاركة متأخرة وتفاعلية؛ ومخزون الإطلاق مُخطَّط ارتجاليًا وتأهيل الموردين كثيرًا ما يؤخر مواعيد الإطلاق.',
          'سلسلة الإمداد تشارك رسميًا في بوابات مراحل NPI؛ وقائمة مراجعة جاهزية سلسلة الإمداد تغطي تأهيل الموردين ومهل المكوّنات والحد الأدنى من مخزون الإطلاق؛ والجاهزية مؤكَّدة قبل الموافقة على الإطلاق.',
          'كتيّب رسمي لسلسلة إمداد NPI يُعرّف بوابات الجاهزية ونماذج بناء مخزون الإطلاق ومعايير تأهيل الموردين ومؤشرات التصاعد؛ والانحرافات تُصعَّد عبر عملية مخاطر محددة.',
          'سلسلة الإمداد شريك متكافئ في حوكمة NPI؛ وجاهزية سلسلة الإمداد من طرف إلى طرف مؤكَّدة في كل بوابة مرحلة؛ ونمذجة تنبؤ التصاعد بالذكاء الاصطناعي تُقدّر عدم اليقين في الطلب؛ وأداء الإطلاق (التوافر والهدر) متابَع مقابل الخطة.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 8 — INVENTORY MANAGEMENT  (segIdx 8)
   Sub-segments:
     0 ABC/XYZ Classification
     1 Safety Stock Methodology
     2 Replenishment Policy
     3 Slow-moving & Obsolete Inventory (SLOB)
     4 Multi-location Inventory Coordination
     5 Inventory Technology & Visibility
═══════════════════════════════════════════════════════════════════════════ */

export const INVENTORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 8-0  ABC/XYZ Classification ─────────────────────────────────────── */
  {
    id: 'inv-abc',
    title: 'ABC/XYZ Classification',
    titleAr: 'تصنيف ABC/XYZ',
    hint: 'Assesses how rigorously inventory is segmented by value (ABC) and demand variability (XYZ) — enabling differentiated management policies.',
    hintAr: 'يقيس مدى صرامة تقسيم المخزون حسب القيمة (ABC) وتقلّب الطلب (XYZ) — مما يُتيح سياسات إدارة متمايزة.',
    benchmarks: { gcc: 2.4, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'ABC / XYZ inventory analysis report',
      labelAr: 'تقرير تحليل المخزون ABC / XYZ',
      hint:    'Upload your most recent inventory classification report (ABC, XYZ, or similar) showing item segmentation and policy outcomes.',
      hintAr:  'ارفع أحدث تقرير تصنيف المخزون (ABC أو XYZ أو ما يماثلها) يُظهر تصنيف البنود ونتائج السياسة.',
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How comprehensively is your inventory segmented using ABC (value) and XYZ (demand variability) classification — and how are differentiated policies applied by segment?',
        qAr: 'ما مدى شمولية تقسيم مخزونكم باستخدام تصنيف ABC (القيمة) وXYZ (تقلّب الطلب) — وكيف تُطبَّق السياسات المتمايزة حسب الشريحة؟',
        levels: [
          'No formal inventory segmentation. All SKUs are managed with the same policies regardless of value or demand variability.',
          'Basic ABC classification exists for major product lines but it is applied inconsistently; no XYZ analysis is conducted; policies are not differentiated by segment.',
          'ABC/XYZ classification is applied across all significant SKUs and reviewed annually; basic policy differentiation (review frequency, safety stock approach) exists by segment.',
          'ABC/XYZ classification is reviewed quarterly; differentiated replenishment policies, service level targets, and review cycles are formally defined and applied by segment.',
          'Multi-dimensional inventory segmentation (ABC/XYZ plus lifecycle, criticality, substitutability) drives fully differentiated management policies; classification is dynamic and auto-updated by the inventory management system.',
        ],
        levelsAr: [
          'لا يوجد تقسيم رسمي للمخزون. جميع أصناف SKU تُدار بنفس السياسات بصرف النظر عن القيمة أو تقلّب الطلب.',
          'تصنيف ABC أساسي موجود لخطوط المنتجات الرئيسية لكن يُطبَّق بشكل غير متسق؛ ولا تحليل XYZ يُجرى؛ والسياسات غير مُمايَزة حسب الشريحة.',
          'تصنيف ABC/XYZ مُطبَّق على جميع أصناف SKU الجوهرية ويُراجَع سنويًا؛ وتمايز سياسات أساسي (تكرار المراجعة ونهج مخزون الأمان) موجود حسب الشريحة.',
          'تصنيف ABC/XYZ يُراجَع فصليًا؛ وسياسات تجديد متمايزة ومستهدفات مستوى خدمة ودورات مراجعة محددة رسميًا ومطبَّقة حسب الشريحة.',
          'تقسيم مخزون متعدد الأبعاد (ABC/XYZ ودورة الحياة والأهمية الحرجة وقابلية الاستبدال) يُوجّه سياسات إدارة متمايزة بالكامل؛ والتصنيف ديناميكي ومُحدَّث آليًا بواسطة نظام إدارة المخزون.',
        ],
      },
      {
        q: 'How effectively are high-value (A-class) and high-variability (X and Z-class) SKUs actively managed — with appropriate replenishment, service targets, and dedicated management attention?',
        qAr: 'ما مدى فعالية الإدارة الفعّالة لأصناف SKU ذات القيمة العالية (الفئة A) وعالية التقلّب (الفئتان X وZ) — بتجديد مناسب ومستهدفات خدمة واهتمام إداري مخصص؟',
        levels: [
          'High-value and high-variability SKUs receive no differentiated management. Strategic items receive the same treatment as commodity or slow-moving stock.',
          'Senior supply chain managers are aware of the top A-class items but there is no formal differentiated management approach, tracking, or review cadence for these items.',
          'Top A-class SKUs have dedicated review cycles (weekly or bi-weekly); service level targets are defined by segment; replenishment decisions for A-class items involve a senior manager.',
          'A-class SKUs are managed through a formal demand-driven replenishment model; X/Y/Z segmentation drives safety stock and review frequency; management attention is allocated proportionally to business impact.',
          'Real-time inventory management for all A and AX SKUs with automated alerts; AI-driven replenishment recommendations; service level management by segment is automated; quarterly segmentation review updates all policies.',
        ],
        levelsAr: [
          'أصناف SKU ذات القيمة والتقلّب العاليين لا تحظى بإدارة متمايزة. الأصناف الاستراتيجية تُعامَل بنفس طريقة مخزون السلع أو البطيء الحركة.',
          'كبار مديري سلسلة الإمداد يعيون أهم أصناف الفئة A لكن لا نهج إدارة متمايز رسمي أو تتبّع أو دورة مراجعة لهذه الأصناف.',
          'أصناف SKU الفئة A الكبرى لها دورات مراجعة مخصصة (أسبوعية أو نصف أسبوعية)؛ ومستهدفات مستوى الخدمة محددة حسب الشريحة؛ وقرارات التجديد لأصناف الفئة A يشارك فيها مدير أول.',
          'أصناف الفئة A تُدار عبر نموذج تجديد مُوجَّه بالطلب رسمي؛ وتقسيم X/Y/Z يُوجّه مخزون الأمان وتكرار المراجعة؛ والاهتمام الإداري مُخصَّص بما يتناسب مع الأثر التجاري.',
          'إدارة مخزون آنية لجميع أصناف A وAX بتنبيهات آلية؛ وتوصيات تجديد مدفوعة بالذكاء الاصطناعي؛ وإدارة مستوى الخدمة حسب الشريحة آلية؛ ومراجعة التصنيف الفصلية تُحدّث جميع السياسات.',
        ],
      },
    ],
  },

  /* ── 8-1  Safety Stock Methodology ──────────────────────────────────── */
  {
    id: 'inv-safety-stock',
    title: 'Safety Stock Methodology',
    titleAr: 'منهجية مخزون الأمان',
    hint: 'Evaluates the statistical rigour of safety stock calculation — incorporating demand variability, lead time variability, and target service levels.',
    hintAr: 'يقيّم الصرامة الإحصائية لحساب مخزون الأمان — بدمج تقلّب الطلب وتقلّب مهل التوريد ومستهدفات مستوى الخدمة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How rigorously is safety stock calculated — using statistical methods that account for demand variability, lead time variability, and required service levels — rather than fixed days-of-stock rules?',
        qAr: 'ما مدى صرامة حساب مخزون الأمان — باستخدام أساليب إحصائية تأخذ في الاعتبار تقلّب الطلب وتقلّب مهل التوريد ومستويات الخدمة المطلوبة — بدلًا من قواعد ثابتة لأيام المخزون؟',
        levels: [
          'Safety stock is based on gut-feel or fixed days-of-supply rules applied uniformly. No statistical analysis of demand or lead time variability is used.',
          'Some variation in safety stock levels exists by product category but calculation methodology is informal and not linked to target service levels or variability statistics.',
          'Safety stock is calculated using basic statistical methods (e.g., standard deviation of demand × service factor) for key SKUs; target service levels are defined by category.',
          'Statistical safety stock (incorporating demand σ and lead time σ) is calculated for all significant SKUs; service level targets are formally set by ABC/XYZ segment; recalculation is triggered by significant lead time or variability changes.',
          'Dynamic safety stock recalculated continuously by the inventory optimisation engine; demand and lead time distributions are modelled by SKU; service level targets cascade from customer commitments; capital-service level trade-off is modelled at executive level.',
        ],
        levelsAr: [
          'لا توجد منهجية علمية لحساب مخزون الأمان. المستويات تُحدَّد بالحدس أو بقواعد ثابتة لأيام الإمداد مُطبَّقة بصورة موحّدة على جميع الأصناف. لا تحليل إحصائي لتقلّب الطلب أو مهل التوريد يُستخدَم مطلقًا.',
          'بعض التباين في مستويات مخزون الأمان موجود حسب فئة المنتج لكن منهجية الحساب غير رسمية وغير مرتبطة بمستهدفات مستوى الخدمة أو إحصاءات التقلّب.',
          'مخزون الأمان يُحسَب باستخدام أساليب إحصائية أساسية (مثل الانحراف المعياري للطلب × عامل الخدمة) لأصناف SKU الرئيسية؛ ومستهدفات مستوى الخدمة محددة حسب الفئة.',
          'مخزون الأمان الإحصائي (المدمج لـ σ الطلب وσ مهل التوريد) محسوب لجميع أصناف SKU الجوهرية؛ ومستهدفات مستوى الخدمة محددة رسميًا حسب شريحة ABC/XYZ؛ وإعادة الحساب تُطلَق عند تغييرات جوهرية في مهل التوريد أو التقلّب.',
          'مخزون أمان ديناميكي يُعاد حسابه باستمرار بواسطة محرّك تحسين المخزون؛ وتوزيعات الطلب ومهل التوريد منمذَجة حسب SKU؛ ومستهدفات مستوى الخدمة مُتدرَّجة من التزامات العملاء؛ ومفاضلة رأس المال ومستوى الخدمة منمذَجة على المستوى التنفيذي.',
        ],
      },
    ],
  },

  /* ── 8-2  Replenishment Policy ───────────────────────────────────────── */
  {
    id: 'inv-replenishment',
    title: 'Replenishment Policy',
    titleAr: 'سياسة التجديد',
    hint: 'Assesses the maturity of replenishment triggers, order quantity optimisation, and automation of standard replenishment decisions.',
    hintAr: 'يقيس نضج محفزات التجديد وتحسين كمية الطلب وأتمتة قرارات التجديد القياسية.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How formally are replenishment policies defined — including reorder point (ROP), economic order quantity (EOQ), and min/max parameters — and how consistently are they applied and reviewed across the SKU portfolio?',
        qAr: 'ما مدى رسمية تعريف سياسات التجديد — شاملًا نقطة إعادة الطلب (ROP) والكمية الاقتصادية للطلب (EOQ) ومعاملات الحد الأدنى/الأقصى — وما مدى اتساق تطبيقها ومراجعتها عبر محفظة SKU؟',
        levels: [
          'Replenishment is entirely reactive and judgment-based. No formal reorder points, safety stock, or order quantity policies are in place.',
          'Basic min/max parameters exist in the ERP for some SKUs but they are set informally, rarely reviewed, and many are at default values that do not reflect actual demand or lead times.',
          'ROP and EOQ are formally calculated and set in the ERP for all significant SKUs; parameters are reviewed at least annually; replenishment exceptions are flagged by the system.',
          'Replenishment parameters (ROP, EOQ, min/max) are reviewed quarterly and updated when demand or lead times change by ≥15%; automated replenishment handles ≥60% of standard orders.',
          'A fully optimised, dynamic replenishment policy is managed by the inventory management system; parameters are continuously optimised; automated replenishment covers ≥90% of standard orders; planners focus on exceptions only.',
        ],
        levelsAr: [
          'التجديد تفاعلي كليًا ومبني على الحكم الشخصي. لا نقاط إعادة طلب رسمية أو مخزون أمان أو سياسات كمية طلب قائمة.',
          'معاملات أدنى/أقصى أساسية موجودة في ERP لبعض أصناف SKU لكنها مُحدَّدة بشكل غير رسمي ونادرًا ما تُراجَع وكثيرًا ما تكون على قيم افتراضية لا تعكس الطلب أو مهل التوريد الفعلية.',
          'ROP وEOQ محسوبان رسميًا ومُدخَلان في ERP لجميع أصناف SKU الجوهرية؛ والمعاملات تُراجَع سنويًا على الأقل؛ واستثناءات التجديد تُبلَّغ بواسطة النظام.',
          'معاملات التجديد (ROP وEOQ وأدنى/أقصى) تُراجَع فصليًا وتُحدَّث عند تغيّر الطلب أو مهل التوريد بنسبة ≥15%؛ والتجديد الآلي يعالج ≥60% من الطلبات القياسية.',
          'سياسة تجديد ديناميكية محسَّنة بالكامل يديرها نظام إدارة المخزون؛ والمعاملات محسَّنة باستمرار؛ والتجديد الآلي يغطي ≥90% من الطلبات القياسية؛ والمخططون يركّزون على الاستثناءات فقط.',
        ],
      },
    ],
  },

  /* ── 8-3  Slow-moving & Obsolete Inventory (SLOB) ───────────────────── */
  {
    id: 'inv-slob',
    title: 'Slow-moving & Obsolete Inventory (SLOB)',
    titleAr: 'المخزون بطيء الحركة والبائد (SLOB)',
    hint: 'Evaluates SLOB identification, write-down processes, disposal governance, and root cause prevention to reduce working capital tied up in non-moving stock.',
    hintAr: 'يقيّم تحديد SLOB وعمليات الشطب وحوكمة التصرف والوقاية من الأسباب الجذرية للحد من رأس المال العامل المقيَّد في مخزون غير متحرك.',
    benchmarks: { gcc: 2.1, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How systematically is slow-moving and obsolete inventory identified, reported to management, and acted upon — through write-down provisioning, disposal, or recovery programmes?',
        qAr: 'ما مدى منهجية تحديد المخزون بطيء الحركة والبائد والإبلاغ عنه للإدارة واتخاذ إجراءات بشأنه — عبر مخصصات الشطب أو برامج التصرف أو الاسترداد؟',
        levels: [
          'SLOB inventory is not systematically identified or tracked. Obsolete stock accumulates without management visibility, creating hidden working capital waste.',
          'SLOB is identified informally at year-end when inventory counts reveal ageing stock; there is no monthly reporting, provisioning policy, or disposal programme.',
          'SLOB is formally identified monthly using ageing thresholds; provisions are made in line with an approved write-down policy; disposal decisions require finance and supply chain sign-off.',
          'A quarterly SLOB review is held with cross-functional attendance (supply chain, finance, commercial); disposal actions are tracked; root cause analysis is conducted to prevent recurrence.',
          'Real-time SLOB monitoring with automated ageing alerts; a structured recovery programme (liquidation, rework, donations) minimises disposal losses; SLOB KPIs are linked to supply chain and commercial objectives; root cause data drives sourcing and NPI decisions.',
        ],
        levelsAr: [
          'مخزون SLOB لا يُحدَّد أو يُتابَع منهجيًا. المخزون البائد يتراكم دون رؤية إدارية مما يُفضي إلى هدر خفي في رأس المال العامل.',
          'تحديد SLOB يتم بشكل غير رسمي في نهاية العام عند الجرد الذي يكشف عن مخزون متقادم؛ ولا تقارير شهرية أو سياسة مخصصات أو برنامج تصرف.',
          'تحديد SLOB رسمي شهريًا باستخدام عتبات تقادم؛ والمخصصات تُكوَّن وفق سياسة شطب معتمدة؛ وقرارات التصرف تستلزم موافقة المالية وسلسلة الإمداد.',
          'مراجعة SLOB فصلية تُعقَد بحضور متعدد الوظائف (سلسلة الإمداد والمالية والتجاري)؛ وإجراءات التصرف متابَعة؛ وتحليل السبب الجذري يُجرى لمنع التكرار.',
          'رصد SLOB آني بتنبيهات تقادم آلية؛ وبرنامج استرداد منظم (تصفية وإعادة معالجة وتبرعات) يُقلّص خسائر التصرف؛ ومؤشرات SLOB مرتبطة بأهداف سلسلة الإمداد والتجاريين؛ وبيانات السبب الجذري تُوجّه قرارات التوريد وNPI.',
        ],
      },
    ],
  },

  /* ── 8-4  Multi-location Inventory Coordination ─────────────────────── */
  {
    id: 'inv-multiloc',
    title: 'Multi-location Inventory Coordination',
    titleAr: 'تنسيق المخزون متعدد المواقع',
    hint: 'Assesses how well inventory is optimised across a network of warehouses, distribution centres, and in-transit stock — minimising total network inventory while meeting service targets.',
    hintAr: 'يقيس مدى تحسين المخزون عبر شبكة مستودعات ومراكز توزيع ومخزون في العبور — مع تقليص إجمالي مخزون الشبكة والوفاء بمستهدفات الخدمة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How effectively is inventory optimised across your distribution network — balancing stock across locations to minimise total holding cost while protecting service levels?',
        qAr: 'ما مدى فعالية تحسين المخزون عبر شبكة التوزيع لديكم — بتوازن المخزون بين المواقع لتقليص إجمالي تكاليف الاحتجاز مع الحفاظ على مستويات الخدمة؟',
        levels: [
          'Each location manages its own inventory independently with no network-wide visibility or coordination. Significant stock imbalances across locations are common.',
          'Stock transfers between locations occur when shortages or surpluses are identified but there is no systematic network inventory review or optimisation process.',
          'Network-level inventory reporting shows stock positions by location; periodic inter-warehouse transfers balance excess vs. shortage locations; network inventory KPI (total DIO) is tracked.',
          'Network inventory optimisation reviews are conducted monthly; lateral stock transfers are triggered by system alerts when imbalances exceed defined thresholds; total network inventory is a tracked executive KPI.',
          'A dynamic network inventory optimisation model continuously allocates stock across all nodes to minimise total holding cost at the required service level; lateral transfers and deployment decisions are system-generated.',
        ],
        levelsAr: [
          'كل موقع يدير مخزونه باستقلالية كاملة دون رؤية شبكية أو تنسيق. اختلالات جوهرية في المخزون بين المواقع شائعة.',
          'تحويلات المخزون بين المواقع تحدث عند تحديد نقص أو فائض لكن لا مراجعة أو عملية تحسين منهجية لمخزون الشبكة.',
          'تقارير المخزون على مستوى الشبكة تُظهر مراكز المخزون حسب الموقع؛ وتحويلات دورية بين المستودعات توازن مواقع الفائض مقابل النقص؛ ومؤشر مخزون الشبكة الإجمالي (إجمالي DIO) متابَع.',
          'مراجعات تحسين مخزون الشبكة تُجرى شهريًا؛ وتحويلات المخزون الجانبية تُطلَق بتنبيهات النظام عند تجاوز الاختلالات عتبات محددة؛ وإجمالي مخزون الشبكة مؤشر تنفيذي متابَع.',
          'نموذج تحسين مخزون شبكي ديناميكي يُوزّع المخزون باستمرار عبر جميع نقاط الشبكة لتقليص إجمالي تكاليف الاحتجاز بمستوى الخدمة المطلوب؛ وقرارات التحويل الجانبي والنشر يولّدها النظام.',
        ],
      },
    ],
  },

  /* ── 8-5  Inventory Technology & Visibility ──────────────────────────── */
  {
    id: 'inv-technology',
    title: 'Inventory Technology & Visibility',
    titleAr: 'تقنية المخزون والرؤية',
    hint: 'Evaluates the maturity of warehouse management systems, real-time stock visibility, and inventory tracking technologies (RFID, barcode, IoT).',
    hintAr: 'يقيّم نضج أنظمة إدارة المستودعات والرؤية الآنية للمخزون وتقنيات تتبّع المخزون (RFID والباركود وإنترنت الأشياء).',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How advanced is your warehouse management system (WMS) and inventory tracking technology — in terms of real-time stock accuracy, putaway/picking optimisation, and integration with supply chain systems?',
        qAr: 'ما مدى تقدّم نظام إدارة المستودعات (WMS) وتقنية تتبّع المخزون لديكم — من حيث دقة المخزون الآنية وتحسين التخزين/الانتقاء والتكامل مع أنظمة سلسلة الإمداد؟',
        levels: [
          'No WMS is in use. Warehouse operations are managed through manual paper-based processes and stock accuracy is verified only at periodic physical counts.',
          'Basic WMS is operational for major warehouses but stock accuracy is not tracked in real-time; putaway and picking are not optimised; integration with ERP/TMS is minimal.',
          'WMS covers all significant warehouses with barcode scanning; real-time stock accuracy is tracked and KPIs are reported; WMS is integrated with ERP for inventory transactions.',
          'Advanced WMS with directed putaway and picking, real-time slot management, and cross-docking; stock accuracy ≥99% (perpetual inventory); WMS fully integrated with ERP, TMS, and demand planning.',
          'Next-generation WMS with RFID/IoT-enabled real-time inventory visibility; automated storage and retrieval systems (AS/RS) for high-volume operations; stock accuracy ≥99.9%; AI-optimised warehouse operations.',
        ],
        levelsAr: [
          'لا يُستخدَم WMS. عمليات المستودع تُدار عبر عمليات ورقية يدوية ودقة المخزون لا تُتحقَّق إلا في الجردات الدورية.',
          'WMS أساسي يعمل للمستودعات الرئيسية لكن دقة المخزون لا تُتابَع آنيًا؛ والتخزين والانتقاء غير مُحسَّنَين؛ والتكامل مع ERP/TMS ضئيل.',
          'WMS يغطي جميع المستودعات الجوهرية بمسح الباركود؛ ودقة المخزون الآنية متابَعة ومؤشراتها مُبلَّغ عنها؛ وWMS مدمج مع ERP لمعاملات المخزون.',
          'WMS متقدم بتخزين وانتقاء موجَّه وإدارة مواقع آنية وعبور مباشر؛ ودقة المخزون ≥99% (جرد دائم)؛ وWMS مدمج بالكامل مع ERP وTMS وتخطيط الطلب.',
          'WMS الجيل التالي بـ RFID/إنترنت الأشياء لرؤية مخزون آنية؛ وأنظمة تخزين واسترداد آلية (AS/RS) للعمليات عالية الحجم؛ ودقة مخزون ≥99.9%؛ وعمليات مستودع محسَّنة بالذكاء الاصطناعي.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 9 — LOGISTICS & DISTRIBUTION  (segIdx 9)
   Sub-segments:
     0 Transport Mode Optimisation
     1 Carrier & 3PL Management
     2 Last-mile & Distribution Network
     3 Warehousing Efficiency
     4 Customs & Trade Compliance
     5 Reverse Logistics
═══════════════════════════════════════════════════════════════════════════ */

export const LOGISTICS_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 9-0  Transport Mode Optimisation ───────────────────────────────── */
  {
    id: 'logi-transport',
    title: 'Transport Mode Optimisation',
    titleAr: 'تحسين وسيلة النقل',
    hint: 'Assesses how effectively transport modes (road, sea, air, rail) are selected and optimised for cost, speed, sustainability, and risk.',
    hintAr: 'يقيس مدى فعالية اختيار وسائل النقل (البري والبحري والجوي والسككي) وتحسينها من حيث التكلفة والسرعة والاستدامة والمخاطر.',
    benchmarks: { gcc: 2.5, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How systematically are transport mode decisions made — balancing total cost (freight, inventory-in-transit, tariffs), speed, reliability, and carbon footprint across your inbound and outbound freight?',
        qAr: 'ما مدى منهجية اتخاذ قرارات وسيلة النقل — بموازنة التكلفة الإجمالية (الشحن والمخزون في العبور والرسوم الجمركية) والسرعة والموثوقية والبصمة الكربونية عبر شحنكم الوارد والصادر؟',
        levels: [
          'Transport mode decisions are informal and based on convention. Air freight is used as the default when speed is needed without TCO analysis or sustainability consideration.',
          'Basic mode selection guidelines exist for common routes but decisions are not consistently made using TCO modelling; carbon footprint is not considered.',
          'A documented mode selection framework applies defined cost, speed, and risk criteria; TCO analysis is conducted for significant freight decisions; air vs. sea trade-offs are formally evaluated.',
          'Mode selection is governed by a formal transport optimisation policy; total landed cost (freight, duty, inventory-in-transit) is calculated; modal shift to sea freight is tracked as a sustainability KPI.',
          'AI-driven transport optimisation continuously evaluates mode decisions across all freight flows; carbon cost is explicitly included in mode selection; modal shift targets are set and publicly disclosed as part of Scope 3 reduction commitments.',
        ],
        levelsAr: [
          'قرارات وسيلة النقل غير رسمية وقائمة على العرف. الشحن الجوي يُستخدَم كخيار افتراضي عند الحاجة للسرعة دون تحليل TCO أو مراعاة الاستدامة.',
          'إرشادات أساسية لاختيار الوسيلة موجودة للمسارات الشائعة لكن القرارات لا تُتخَذ باتساق باستخدام نمذجة TCO؛ والبصمة الكربونية لا تُؤخَذ في الاعتبار.',
          'إطار اختيار وسيلة موثّق يُطبّق معايير تكلفة وسرعة ومخاطر محددة؛ وتحليل TCO يُجرى للقرارات اللوجستية الجوهرية؛ والمفاضلات بين الجوي والبحري تُقيَّم رسميًا.',
          'اختيار الوسيلة محكوم بسياسة تحسين نقل رسمية؛ والتكلفة الإجمالية المُوصَّلة (الشحن والرسوم والمخزون في العبور) تُحسَب؛ والتحوّل للشحن البحري متابَع كمؤشر استدامة.',
          'تحسين نقل مدفوع بالذكاء الاصطناعي يُقيّم باستمرار قرارات الوسيلة عبر جميع تدفقات الشحن؛ وتكلفة الكربون مدرجة صراحةً في اختيار الوسيلة؛ ومستهدفات التحوّل النمطي محددة ومُفصَح عنها علنًا ضمن التزامات خفض النطاق الثالث.',
        ],
      },
      {
        q: 'How effectively is freight consolidation managed — reducing per-unit shipping costs through load optimisation, hub consolidation, and backhaul utilisation?',
        qAr: 'ما مدى فعالية إدارة توحيد الشحنات — بخفض تكلفة الشحن لكل وحدة عبر تحسين الحمولة وتوحيد المحاور واستغلال الرحلات العودة؟',
        levels: [
          'Freight consolidation is not practised. Shipments are sent as individual full-load or LCL consignments without any load optimisation or consolidation planning.',
          'Some consolidation occurs informally for common lanes but load fill rates are not measured; backhaul is not considered in carrier negotiations.',
          'Load fill rates are tracked for primary lanes; a consolidation programme combines LCL shipments into FCL on key trade lanes; backhaul opportunities are identified for major domestic carriers.',
          'Freight consolidation is managed through a formal load planning process; load fill rate KPI is tracked (target ≥85%); backhaul utilisation agreements are in place with key carriers; consolidation hub strategy is documented.',
          'AI-driven load planning optimises freight consolidation in real time; load fill rates ≥92%; a dynamic backhaul marketplace matches return loads to vehicles; freight CO₂ per unit is tracked and reduced year-on-year.',
        ],
        levelsAr: [
          'توحيد الشحنات غير مُمارَس. الشحنات تُرسَل كحمولات كاملة أو شحنات LCL فردية دون أي تحسين للحمولة أو تخطيط توحيد.',
          'بعض التوحيد يحدث بشكل غير رسمي للخطوط الشائعة لكن معدلات إشغال الحمولة لا تُقاس؛ ورحلات العودة لا تُؤخَذ في اعتبار مفاوضات الناقلين.',
          'معدلات إشغال الحمولة متابَعة للخطوط الرئيسية؛ وبرنامج توحيد يدمج شحنات LCL في FCL على خطوط تجارة رئيسية؛ وفرص رحلات العودة مُحددة للناقلين المحليين الرئيسيين.',
          'توحيد الشحنات مُدار عبر عملية تخطيط حمولة رسمية؛ ومؤشر معدل إشغال الحمولة متابَع (مستهدف ≥85%)؛ واتفاقيات استغلال رحلات العودة قائمة مع الناقلين الرئيسيين؛ واستراتيجية محاور التوحيد موثّقة.',
          'تخطيط حمولة مدفوع بالذكاء الاصطناعي يُحسّن توحيد الشحنات آنيًا؛ ومعدلات إشغال الحمولة ≥92%؛ وسوق ديناميكية لرحلات العودة تُطابق الأحمال العائدة بالمركبات؛ وCO₂ للشحن لكل وحدة متابَع ومُخفَّض من عام لآخر.',
        ],
      },
    ],
  },

  /* ── 9-1  Carrier & 3PL Management ──────────────────────────────────── */
  {
    id: 'logi-carrier',
    title: 'Carrier & 3PL Management',
    titleAr: 'إدارة الناقلين ومزوّدي 3PL',
    hint: 'Evaluates the governance of logistics service providers — SLAs, KPI management, performance reviews, and strategic relationship development.',
    hintAr: 'يقيّم حوكمة مزوّدي الخدمات اللوجستية — اتفاقيات مستوى الخدمة وإدارة المؤشرات ومراجعات الأداء وتطوير العلاقة الاستراتيجية.',
    benchmarks: { gcc: 2.6, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How formally are your logistics carriers and 3PL providers governed — in terms of SLA completeness, KPI definition, performance review cadence, and escalation and exit protocols?',
        qAr: 'ما مدى رسمية حوكمة ناقليكم ومزوّدي 3PL — من حيث اكتمال اتفاقيات مستوى الخدمة وتعريف مؤشرات الأداء ووتيرة مراجعة الأداء وبروتوكولات التصعيد والخروج؟',
        levels: [
          'Logistics providers are engaged without formal SLA agreements. Performance is not measured and problems are resolved informally. No DIFOT, freight-claim ratio, or cost-per-tonne-KM baseline exists.',
          'Some performance KPIs exist (e.g., on-time delivery rate) but SLAs are incomplete, reviews are infrequent, and non-performance has no defined consequences. DIFOT and freight-claim data are not consistently tracked.',
          'All significant logistics providers are contracted with formal SLAs including DIFOT, freight-claim ratio, and cost-per-tonne-KM KPIs, reviewed at least quarterly; corrective action processes are documented.',
          'A carrier and 3PL performance management system tracks DIFOT, freight-claim ratio, transit-time variance, and cost-per-tonne-KM monthly; performance is benchmarked against contract and market standards; a formal escalation and exit protocol is in place.',
          'All carriers and 3PLs are governed through multi-tier SLAs with automated KPI dashboards covering DIFOT, freight claims, carbon-per-tonne-KM, and cost efficiency; monthly performance reviews link to incentive/penalty mechanisms; strategic 3PL partners participate in annual supply chain strategy sessions.',
        ],
        levelsAr: [
          'مزوّدو اللوجستيات يُشارَكون دون اتفاقيات مستوى خدمة رسمية. الأداء لا يُقاس والمشكلات تُحلّ بشكل غير رسمي. لا خط أساس لـ DIFOT أو نسبة مطالبات الشحن أو التكلفة لكل طن-كيلومتر.',
          'بعض مؤشرات الأداء موجودة (كمعدل التسليم في الوقت) لكن اتفاقيات مستوى الخدمة غير مكتملة والمراجعات متفرقة وضعف الأداء ليس له عواقب محددة. بيانات DIFOT ومطالبات الشحن لا تُتابَع باتساق.',
          'جميع مزوّدي اللوجستيات الجوهريين متعاقَد معهم باتفاقيات مستوى خدمة رسمية تشمل DIFOT ونسبة مطالبات الشحن والتكلفة لكل طن-كيلومتر تُراجَع ربع سنويًا على الأقل؛ وعمليات التصحيح موثّقة.',
          'نظام إدارة أداء الناقلين و3PL يتتبّع DIFOT ونسبة مطالبات الشحن وتباين وقت العبور والتكلفة لكل طن-كيلومتر شهريًا؛ والأداء مُقارَن معياريًا بمعايير العقد والسوق؛ وبروتوكول تصعيد وخروج رسمي قائم.',
          'جميع الناقلين و3PL محكومون باتفاقيات مستوى خدمة متعددة المستويات مع لوحات معلومات مؤشرات آلية تغطي DIFOT ومطالبات الشحن وكربون/طن-كيلومتر وكفاءة التكلفة؛ ومراجعات الأداء الشهرية مرتبطة بآليات حوافز/عقوبات؛ وشركاء 3PL الاستراتيجيون يشاركون في جلسات استراتيجية سلسلة الإمداد السنوية.',
        ],
      },
    ],
  },

  /* ── 9-2  Last-mile & Distribution Network ──────────────────────────── */
  {
    id: 'logi-lastmile',
    title: 'Last-mile & Distribution Network',
    titleAr: 'الميل الأخير وشبكة التوزيع',
    hint: 'Assesses distribution network design decisions — hub-spoke structure, delivery zone coverage, carrier selection for last-mile, and slot management — and measures delivery OTIF performance at the network level.',
    hintAr: 'يقيّم قرارات تصميم شبكة التوزيع — هيكل المحاور والمناطق وتغطية مناطق التسليم واختيار الناقلين للميل الأخير وإدارة الشُّقَق الزمنية — ويقيس أداء OTIF على مستوى الشبكة.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How deliberately is your last-mile distribution network designed — covering hub-spoke vs. direct delivery trade-offs, delivery zone assignments, multi-carrier orchestration, and service-level differentiation by customer segment?',
        qAr: 'ما مدى تعمّد تصميم شبكة توزيع الميل الأخير لديكم — شاملًا المفاضلات بين نموذج المحاور والتسليم المباشر وتحديد مناطق التسليم وتنسيق تعدد الناقلين وتمايز مستوى الخدمة حسب شريحة العميل؟',
        levels: [
          'No network design analysis has been conducted. Carrier selection and delivery zones are inherited from historical practice; no trade-off modelling exists.',
          'Delivery zones are defined but not optimised; carrier selection is based primarily on rate and availability; no formal service-level differentiation by customer segment is applied.',
          'A distribution network review has been completed; hub-spoke structure is documented; multi-carrier contracts cover major zones; OTIF is tracked by delivery region.',
          'Distribution network design is reviewed annually using quantitative modelling; service-level differentiation (priority, standard, economy) is applied by customer tier; carrier mix is optimised for cost-service balance.',
          'Network design uses digital twin simulation with continuous optimisation; multi-carrier orchestration dynamically allocates shipments by cost, speed, and CO₂; OTIF ≥95% is a contractual customer commitment backed by real-time tracking.',
        ],
        levelsAr: [
          'لم يُجرَ أي تحليل لتصميم الشبكة. اختيار الناقلين ومناطق التسليم موروثة من الممارسة التاريخية دون نمذجة مفاضلات.',
          'مناطق التسليم محددة لكن غير مُحسَّنة؛ واختيار الناقلين يستند أساسًا إلى التسعيرة والتوافر؛ ولا تمايز رسمي لمستوى الخدمة حسب شريحة العميل.',
          'مراجعة شبكة التوزيع مُنجَزة؛ وهيكل المحاور موثّق؛ وعقود تعدد الناقلين تغطي المناطق الرئيسية؛ وOTIF متابَع حسب منطقة التوزيع.',
          'تصميم شبكة التوزيع يُراجَع سنويًا بنمذجة كمية؛ وتمايز مستوى الخدمة (أولوية وقياسي واقتصادي) مُطبَّق حسب درجة العميل؛ ومزيج الناقلين مُحسَّن لتوازن التكلفة والخدمة.',
          'تصميم الشبكة يستخدم محاكاة التوأم الرقمي مع تحسين مستمر؛ وتنسيق تعدد الناقلين يُخصَّص الشحنات ديناميكيًا حسب التكلفة والسرعة وCO₂؛ وOTIF ≥95% التزام تعاقدي مع العملاء مدعوم بتتبّع آني.',
        ],
      },
    ],
  },

  /* ── 9-3  Warehousing Efficiency ─────────────────────────────────────── */
  {
    id: 'logi-warehouse',
    title: 'Warehousing Efficiency',
    titleAr: 'كفاءة التخزين',
    hint: 'Evaluates warehouse operations maturity — space utilisation, labour productivity, order fulfilment speed, and accuracy.',
    hintAr: 'يقيّم نضج عمليات المستودعات — استغلال المساحة وإنتاجية العمالة وسرعة تلبية الطلبات ودقتها.',
    benchmarks: { gcc: 2.5, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How efficiently are your warehouse operations managed — measuring space utilisation, pick accuracy, order cycle time, labour productivity, and the use of automation?',
        qAr: 'ما مدى كفاءة إدارة عمليات مستودعاتكم — بقياس استغلال المساحة ودقة الانتقاء وزمن دورة الطلبات وإنتاجية العمالة واستخدام الأتمتة؟',
        levels: [
          'Warehouse operations are managed informally with no KPIs. Space utilisation, pick accuracy, and labour productivity are unknown and not measured.',
          'Basic warehouse metrics exist (shipments per day, on-time dispatch) but space utilisation, pick accuracy, and cycle time are not systematically tracked.',
          'Key warehouse KPIs (space utilisation, pick accuracy ≥98%, order cycle time) are tracked monthly; improvement programmes address recurring operational issues.',
          'Warehouse operations are managed through a formal performance management system; KPIs are tracked daily; slotting optimisation improves pick density; labour scheduling is data-driven.',
          'World-class warehouse operations with automation (conveyor, sorters, AMRs); pick accuracy ≥99.9%; real-time labour and space utilisation dashboards; AI-driven slotting and replenishment; benchmark against global leaders.',
        ],
        levelsAr: [
          'عمليات المستودع تُدار بشكل غير رسمي دون مؤشرات أداء. استغلال المساحة ودقة الانتقاء وإنتاجية العمالة مجهولة وغير مقيسة.',
          'مقاييس مستودع أساسية موجودة (شحنات يوميًا وإرسال في الوقت) لكن استغلال المساحة ودقة الانتقاء وزمن الدورة لا تُتابَع منهجيًا.',
          'مؤشرات المستودع الرئيسية (استغلال المساحة ودقة الانتقاء ≥98% وزمن دورة الطلبات) متابَعة شهريًا؛ وبرامج التحسين تعالج المشكلات التشغيلية المتكررة.',
          'عمليات المستودع تُدار عبر نظام إدارة أداء رسمي؛ ومؤشرات الأداء متابَعة يوميًا؛ وتحسين مواقع التخزين يُحسّن كثافة الانتقاء؛ وجدولة العمالة مبنية على البيانات.',
          'عمليات مستودع من الدرجة العالمية مع أتمتة (ناقلات ومصنّفات وروبوتات AMR)؛ ودقة انتقاء ≥99.9%؛ ولوحات معلومات آنية لاستغلال العمالة والمساحة؛ ومواقع تخزين وتجديد محسَّنة بالذكاء الاصطناعي؛ ومقارنة معيارية بالقادة العالميين.',
        ],
      },
    ],
  },

  /* ── 9-4  Customs & Trade Compliance ─────────────────────────────────── */
  {
    id: 'logi-customs',
    title: 'Customs & Trade Compliance',
    titleAr: 'الجمارك والامتثال التجاري',
    hint: 'Assesses the maturity of customs clearance processes, trade compliance controls, AEO/trusted trader status, and duty optimisation.',
    hintAr: 'يقيس نضج عمليات التخليص الجمركي وضوابط الامتثال التجاري وحالة AEO/التاجر الموثوق وتحسين الرسوم الجمركية.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Customs compliance certificate or AEO authorisation',
      labelAr: 'شهادة الامتثال الجمركي أو ترخيص AEO',
      hint:    'Upload your Authorised Economic Operator (AEO) certificate, customs compliance audit report, or equivalent authorisation.',
      hintAr:  'ارفع شهادة المشغّل الاقتصادي المعتمد (AEO) أو تقرير تدقيق الامتثال الجمركي أو ما يعادلها.',
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How mature is your customs and trade compliance programme — in terms of documentation completeness, HS code accuracy, import/export licensing, and proactive regulatory monitoring?',
        qAr: 'ما مدى نضج برنامج الجمارك والامتثال التجاري لديكم — من حيث اكتمال الوثائق ودقة رموز HS والترخيص باستيراد/تصدير والمراقبة التنظيمية الاستباقية؟',
        levels: [
          'Customs compliance is managed reactively. HS code accuracy is not validated; documentation errors frequently cause delays; trade compliance knowledge resides with one or two individuals.',
          'Basic customs procedures are followed but HS code accuracy is not routinely verified; import/export licences are tracked informally; trade regulation changes are not proactively monitored.',
          'A trade compliance programme covers HS classification, documentation standards, and licence management; a dedicated customs team (internal or 3PL) manages clearance; compliance training is provided.',
          'Trade compliance is managed through a formal compliance management system; HS code accuracy is validated quarterly; duty recovery and free trade agreement optimisation are actively pursued; AEO status is in progress or achieved.',
          'Best-in-class trade compliance: Authorised Economic Operator (AEO) status achieved; automated HS classification; trade compliance management system integrates with customs authorities; FTA benefit rate ≥95% of applicable imports; duty recovery programme captures all entitlements.',
        ],
        levelsAr: [
          'الامتثال الجمركي يُدار تفاعليًا. دقة رموز HS لا تُتحقَّق منها؛ وأخطاء الوثائق تسبب تأخيرات متكررة؛ ومعرفة الامتثال التجاري لدى فرد أو اثنين فقط.',
          'الإجراءات الجمركية الأساسية تُتّبَع لكن دقة رموز HS لا تُتحقَّق منها بشكل روتيني؛ والتراخيص تُتابَع بشكل غير رسمي؛ وتغييرات اللوائح التجارية لا تُراقَب استباقيًا.',
          'برنامج امتثال تجاري يغطي تصنيف HS ومعايير التوثيق وإدارة التراخيص؛ وفريق جمارك مخصص (داخلي أو 3PL) يدير التخليص؛ والتدريب على الامتثال يُقدَّم.',
          'الامتثال التجاري مُدار عبر نظام إدارة امتثال رسمي؛ ودقة رموز HS مُتحقَّق منها فصليًا؛ واسترداد الرسوم وتحسين اتفاقيات التجارة الحرة يُمارَسان فعليًا؛ وحالة AEO قيد التحقيق أو محققة.',
          'امتثال تجاري بمستوى الأفضل في الفئة: حالة المشغّل الاقتصادي المعتمد (AEO) محققة؛ وتصنيف HS آلي؛ ونظام إدارة الامتثال التجاري مدمج مع سلطات الجمارك؛ ومعدل استفادة اتفاقيات التجارة الحرة ≥95% من الواردات المؤهلة؛ وبرنامج استرداد الرسوم يلتقط جميع المستحقات.',
        ],
      },
    ],
  },

  /* ── 9-5  Reverse Logistics ───────────────────────────────────────────── */
  {
    id: 'logi-reverse',
    title: 'Reverse Logistics',
    titleAr: 'اللوجستيات العكسية',
    hint: 'Evaluates the maturity of returns management, product recovery, refurbishment, and recycling processes — linking reverse logistics to circular economy goals.',
    hintAr: 'يقيّم نضج إدارة المرتجعات واسترداد المنتج وعمليات التجديد وإعادة التدوير — ربط اللوجستيات العكسية بأهداف الاقتصاد الدائري.',
    benchmarks: { gcc: 2.0, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How mature is your reverse logistics operation — covering returns authorisation, product recovery grading, refurbishment, disposal, and customer credits — and how effectively are return costs tracked?',
        qAr: 'ما مدى نضج عمليات اللوجستيات العكسية لديكم — شاملًا التفويض بالإرجاع وتقييم استرداد المنتج والتجديد والتخلص ومستحقات العملاء — وما مدى فعالية تتبّع تكاليف المرتجعات؟',
        levels: [
          'Reverse logistics has no formal process. Returns are handled ad-hoc with no standard authorisation, grading, or recovery process; costs are not tracked.',
          'A basic returns authorisation (RMA) process exists for major customers but recovery grading, refurbishment, and disposal are informal; cost of returns is not reported.',
          'A formal reverse logistics process covers RMA, product grading, and recovery decisions (refurbish, recycle, dispose); return rate KPIs are tracked monthly; cost of returns is reported to management.',
          'Returns are managed through an integrated returns management system; recovery rates (refurbishment, recycling) are tracked as KPIs; return cost is analysed by root cause to drive defect reduction.',
          'Best-in-class reverse logistics: automated RMA and returns tracking; AI-driven recovery classification; refurbishment and circular recovery rates are maximised; reverse logistics costs are a supply chain P&L line item; returns data informs product quality programmes.',
        ],
        levelsAr: [
          'اللوجستيات العكسية ليس لها عملية رسمية. المرتجعات تُعالَج ارتجاليًا دون تفويض قياسي أو تقييم أو عملية استرداد؛ والتكاليف لا تُتابَع.',
          'عملية تفويض مرتجعات أساسية (RMA) موجودة للعملاء الرئيسيين لكن تقييم الاسترداد والتجديد والتخلص غير رسمية؛ وتكلفة المرتجعات لا تُبلَّغ عنها.',
          'عملية لوجستيات عكسية رسمية تغطي RMA وتقييم المنتج وقرارات الاسترداد (تجديد وإعادة تدوير وتخلص)؛ ومؤشرات معدل الإرجاع متابَعة شهريًا؛ وتكلفة المرتجعات مُبلَّغ عنها للإدارة.',
          'المرتجعات تُدار عبر نظام إدارة مرتجعات متكامل؛ ومعدلات الاسترداد (التجديد وإعادة التدوير) متابَعة كمؤشرات أداء؛ وتكلفة الإرجاع تُحلَّل حسب السبب الجذري للحدّ من العيوب.',
          'لوجستيات عكسية بمستوى الأفضل في الفئة: RMA آلي وتتبّع مرتجعات؛ وتصنيف استرداد مدفوع بالذكاء الاصطناعي؛ ومعدلات الاسترداد الدائرية والتجديد مُعظَّمة؛ وتكاليف اللوجستيات العكسية بند في أرباح وخسائر سلسلة الإمداد؛ وبيانات المرتجعات تُوجّه برامج جودة المنتج.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 10 — ORGANISATION & TALENT  (segIdx 10)
   Sub-segments:
     0 Structure & Span of Control
     1 Competency Framework
     2 Learning & Development
     3 Talent Attraction & Retention
     4 Succession Planning
     5 Change Management Capability
═══════════════════════════════════════════════════════════════════════════ */

export const ORG_TALENT_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 10-0  Structure & Span of Control ───────────────────────────────── */
  {
    id: 'org-structure',
    title: 'Structure & Span of Control',
    titleAr: 'الهيكل ونطاق الإشراف',
    hint: 'Assesses how well the supply chain organisation structure — reporting lines, spans of control, and cross-functional integration — is designed to deliver strategic objectives.',
    hintAr: 'يقيس مدى جودة تصميم هيكل منشأة سلسلة الإمداد — خطوط التقارير ونطاق الإشراف والتكامل متعدد الوظائف — لتحقيق الأهداف الاستراتيجية.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How well is your supply chain organisation structured — with clearly defined roles, appropriate spans of control, unambiguous reporting lines, and cross-functional coordination mechanisms?',
        qAr: 'ما مدى جودة هيكلة منشأة سلسلة الإمداد لديكم — بأدوار محددة بوضوح ونطاقات إشراف مناسبة وخطوط تقارير لا لبس فيها وآليات تنسيق متعددة الوظائف؟',
        levels: [
          'The supply chain organisation has no formal structure or defined roles. Responsibilities overlap significantly and accountability for key outcomes is unclear.',
          'Organisational roles are broadly defined but spans of control are inconsistent; reporting lines are unclear in some areas; cross-functional coordination is informal.',
          'A formal organisational design is documented with clear role definitions, spans of control (typically 5-8 direct reports), and reporting lines; cross-functional teams are used for key projects.',
          'The organisation design is reviewed annually against strategy; role definitions include accountability mapping; spans of control are optimised; a cross-functional governance model (e.g., CoE, Business Partners) supports integration.',
          'The organisation design is a strategic capability; spans of control and role design are continuously benchmarked; network-based organisational structures (virtual teams, digital CoEs) are used to access skills dynamically.',
        ],
        levelsAr: [
          'منشأة سلسلة الإمداد ليس لها هيكل رسمي أو أدوار محددة. المسؤوليات تتداخل بشكل جوهري والمساءلة عن النتائج الرئيسية غير واضحة.',
          'الأدوار التنظيمية محددة بشكل عام لكن نطاقات الإشراف غير متسقة؛ وخطوط التقارير غير واضحة في بعض المجالات؛ والتنسيق متعدد الوظائف غير رسمي.',
          'تصميم تنظيمي رسمي موثّق بتعريفات أدوار واضحة ونطاقات إشراف (عادةً 5-8 مرؤوسين مباشرين) وخطوط تقارير؛ وفرق متعددة الوظائف تُستخدَم للمشاريع الرئيسية.',
          'تصميم المنشأة يُراجَع سنويًا مقابل الاستراتيجية؛ وتعريفات الأدوار تشمل رسم خريطة المساءلة؛ ونطاقات الإشراف مُحسَّنة؛ ونموذج حوكمة متعدد الوظائف (كمراكز الامتياز والشركاء التجاريين) يدعم التكامل.',
          'تصميم المنشأة قدرة استراتيجية؛ ونطاقات الإشراف وتصميم الأدوار تُقارَن معياريًا باستمرار؛ والهياكل التنظيمية القائمة على الشبكات (الفرق الافتراضية ومراكز الامتياز الرقمية) تُستخدَم للوصول الديناميكي للمهارات.',
        ],
      },
      {
        q: 'How effectively is the supply chain function positioned at executive level — including CPO/CSCO reporting line, representation in executive and board discussions, and influence on corporate strategy?',
        qAr: 'ما مدى فعالية تموضع وظيفة سلسلة الإمداد على المستوى التنفيذي — شاملًا مستوى تقارير CPO/CSCO والتمثيل في النقاشات التنفيذية ومجلس الإدارة والتأثير على الاستراتيجية المؤسسية؟',
        levels: [
          'Supply chain is managed as an operational function with no executive representation. CPO or CSCO reports below C-suite level and supply chain has no voice in corporate strategy.',
          'A senior supply chain leader exists but reports to operations or finance rather than the CEO; supply chain input to corporate strategy is informal and reactive.',
          'A Chief Procurement Officer or Chief Supply Chain Officer reports at C-suite level; supply chain strategy is presented annually to the executive committee.',
          'CPO/CSCO sits on the executive committee; supply chain performance is reviewed by the board at least annually; the supply chain strategy is formally co-developed with the CFO and CEO.',
          'CPO/CSCO is a key strategic partner on the executive committee; supply chain resilience, ESG, and digital transformation are board-level agenda items; supply chain is recognised as a source of competitive advantage.',
        ],
        levelsAr: [
          'سلسلة الإمداد تُدار كوظيفة تشغيلية دون تمثيل تنفيذي. CPO أو CSCO يُقدّم تقاريره دون مستوى كبار المدراء التنفيذيين ولا صوت لسلسلة الإمداد في الاستراتيجية المؤسسية.',
          'قائد أول لسلسلة الإمداد موجود لكنه يُقدّم تقاريره للعمليات أو المالية وليس للرئيس التنفيذي؛ ومدخلات سلسلة الإمداد للاستراتيجية المؤسسية غير رسمية وتفاعلية.',
          'مدير مشتريات رئيسي أو مدير سلسلة إمداد رئيسي يُقدّم تقاريره على مستوى كبار المدراء؛ واستراتيجية سلسلة الإمداد تُعرَض سنويًا على اللجنة التنفيذية.',
          'CPO/CSCO عضو في اللجنة التنفيذية؛ وأداء سلسلة الإمداد يُراجَع من مجلس الإدارة سنويًا على الأقل؛ واستراتيجية سلسلة الإمداد مُطوَّرة رسميًا بالتشارك مع CFO والرئيس التنفيذي.',
          'CPO/CSCO شريك استراتيجي رئيسي في اللجنة التنفيذية؛ ومرونة سلسلة الإمداد وESG والتحول الرقمي بنود على أجندة مجلس الإدارة؛ وسلسلة الإمداد معترَف بها كمصدر للميزة التنافسية.',
        ],
      },
    ],
  },

  /* ── 10-1  Competency Framework ──────────────────────────────────────── */
  {
    id: 'org-competency',
    title: 'Competency Framework',
    titleAr: 'إطار الكفاءات',
    hint: 'Evaluates the definition, deployment, and consistent application of a supply chain competency framework across all roles and levels.',
    hintAr: 'يقيّم تعريف إطار كفاءات سلسلة الإمداد ونشره وتطبيقه المتسق عبر جميع الأدوار والمستويات.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Supply chain competency framework document',
      labelAr: 'وثيقة إطار الكفاءات لسلسلة التوريد',
      hint:    'Upload your documented supply chain competency framework, role profiles, or competency assessment results.',
      hintAr:  'ارفع إطار الكفاءات الموثّق لسلسلة التوريد أو ملفات الأدوار أو نتائج تقييم الكفاءات.',
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How comprehensively is a supply chain competency framework defined and applied — covering technical skills, leadership behaviours, digital literacy, and sustainability knowledge across all supply chain roles?',
        qAr: 'ما مدى شمولية تعريف إطار كفاءات سلسلة الإمداد وتطبيقه — شاملًا المهارات التقنية وسلوكيات القيادة والمحو الأمية الرقمية ومعرفة الاستدامة عبر جميع أدوار سلسلة الإمداد؟',
        levels: [
          'No supply chain competency framework exists. Role requirements are defined informally and assessment of skills gaps is absent.',
          'Generic company competency frameworks are applied to supply chain roles but supply chain-specific technical competencies (procurement, logistics, planning) are not defined.',
          'A supply chain competency framework defines technical competencies (procurement, logistics, planning), leadership behaviours, and legal and ethical procurement standards for major role families; it is used in annual performance reviews and development planning.',
          'A comprehensive supply chain competency framework (including digital literacy, sustainability, and supply chain ethics and contract law) is applied consistently in recruitment, performance management, and development planning; gap analysis is conducted annually.',
          'A best-in-class supply chain competency framework aligned to CIPS/APICS standards — explicitly including ethics, contracting authority, and legal compliance — is refreshed annually; digital and sustainability competencies evolve with business needs; the framework drives talent decisions across the entire lifecycle.',
        ],
        levelsAr: [
          'لا يوجد إطار كفاءات لسلسلة الإمداد. متطلبات الأدوار محددة بشكل غير رسمي وتقييم فجوات المهارات غائب.',
          'أطر الكفاءات المؤسسية العامة مُطبَّقة على أدوار سلسلة الإمداد لكن الكفاءات التقنية الخاصة بسلسلة الإمداد (المشتريات واللوجستيات والتخطيط) غير محددة.',
          'إطار كفاءات سلسلة إمداد يُعرّف الكفاءات التقنية (مشتريات ولوجستيات وتخطيط) وسلوكيات القيادة ومعايير أخلاقيات المشتريات والالتزام القانوني لعائلات الأدوار الرئيسية؛ ويُستخدَم في مراجعات الأداء السنوية وتخطيط التطوير.',
          'إطار كفاءات شامل لسلسلة الإمداد (شاملًا المحو الأمية الرقمية والاستدامة وأخلاقيات المشتريات وقانون العقود) يُطبَّق باتساق في التعيين وإدارة الأداء وتخطيط التطوير؛ وتحليل الفجوات يُجرى سنويًا.',
          'إطار كفاءات سلسلة إمداد بمستوى الأفضل في الفئة مواءَم مع معايير CIPS/APICS — يشمل صراحةً الأخلاقيات وسلطة التعاقد والامتثال القانوني — يُحدَّث سنويًا؛ والكفاءات الرقمية والاستدامة تتطوّر مع احتياجات العمل؛ والإطار يُوجّه قرارات المواهب عبر دورة الحياة الكاملة.',
        ],
      },
    ],
  },

  /* ── 10-2  Learning & Development ───────────────────────────────────── */
  {
    id: 'org-learning',
    title: 'Learning & Development',
    titleAr: 'التعلّم والتطوير',
    hint: 'Assesses the investment, reach, and effectiveness of supply chain learning and development programmes — including formal training, professional certification, and digital learning.',
    hintAr: 'يقيس الاستثمار والانتشار وفعالية برامج التعلّم والتطوير لسلسلة الإمداد — شاملًا التدريب الرسمي والاعتماد المهني والتعلّم الرقمي.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    evidence: {
      label:   'Learning & development programme plan or training records',
      labelAr: 'خطة برنامج التعلّم والتطوير أو سجلات التدريب',
      hint:    'Upload your L&D programme calendar, training completion records, or formal development plan for supply chain staff.',
      hintAr:  'ارفع تقويم برنامج التعلّم والتطوير أو سجلات إتمام التدريب أو خطة التطوير الرسمية لموظفي سلسلة التوريد.',
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How structured and effective are supply chain learning and development programmes — covering training needs analysis, programme delivery (formal, digital, on-the-job), and measured outcomes?',
        qAr: 'ما مدى منهجية وفعالية برامج التعلّم والتطوير لسلسلة الإمداد — شاملًا تحليل احتياجات التدريب وتقديم البرامج (الرسمية والرقمية وأثناء العمل) والنتائج المقيسة؟',
        levels: [
          'No structured supply chain L&D programme exists. Training is ad-hoc, reactive to immediate needs, and not linked to competency gaps or business outcomes.',
          'Some training is provided for supply chain roles but it is not guided by a formal training needs analysis; attendance is tracked but learning effectiveness is not measured.',
          'A formal supply chain L&D programme is in place based on annual training needs analysis; a mix of classroom, digital, and on-the-job training is delivered; completion rates are tracked.',
          'A structured L&D programme is aligned to the supply chain competency framework; training effectiveness is measured (knowledge tests, application assessments); investment per FTE is tracked and benchmarked.',
          'A supply chain learning academy offers a curated curriculum aligned to career pathways; digital learning platforms deliver personalised content; training ROI is measured; top talent accelerators and CIPS/APICS certifications are funded.',
        ],
        levelsAr: [
          'لا يوجد برنامج منظم للتعلّم والتطوير لسلسلة الإمداد. التدريب ارتجالي وتفاعلي للاحتياجات الآنية وغير مرتبط بفجوات الكفاءة أو نتائج الأعمال.',
          'بعض التدريب يُقدَّم لأدوار سلسلة الإمداد لكنه غير مُوجَّه بتحليل احتياجات تدريب رسمي؛ والحضور يُتابَع لكن فعالية التعلّم لا تُقاس.',
          'برنامج رسمي للتعلّم والتطوير لسلسلة الإمداد قائم مبني على تحليل احتياجات تدريب سنوي؛ ومزيج من التدريب الصفي والرقمي وأثناء العمل يُقدَّم؛ ومعدلات الاكتمال متابَعة.',
          'برنامج منظم للتعلّم والتطوير مواءَم مع إطار كفاءات سلسلة الإمداد؛ وفعالية التدريب مقيسة (اختبارات معرفية وتقييمات تطبيق)؛ والاستثمار لكل موظف متابَع ومُقارَن معياريًا.',
          'أكاديمية تعلّم سلسلة إمداد تقدّم منهجًا منتقى مواءَمًا لمسارات الوظائف؛ ومنصات التعلّم الرقمي تُقدّم محتوى مُخصَّصًا؛ وعائد استثمار التدريب مقيس؛ وبرامج تسريع أفضل المواهب واعتمادات CIPS/APICS ممولة.',
        ],
      },
    ],
  },

  /* ── 10-3  Talent Attraction & Retention ─────────────────────────────── */
  {
    id: 'org-talent',
    title: 'Talent Attraction & Retention',
    titleAr: 'استقطاب المواهب والاحتفاظ بها',
    hint: 'Evaluates the supply chain employer brand, talent pipeline strength, onboarding quality, and voluntary attrition management.',
    hintAr: 'يقيّم العلامة التجارية لأصحاب العمل في سلسلة الإمداد وقوة مسار استقطاب المواهب وتطويرها وجودة الاستقبال وإدارة معدل الاستقالة.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How effective is your organisation at attracting qualified supply chain talent — including employer brand, university partnerships, Saudization pipeline, and competitive compensation benchmarking?',
        qAr: 'ما مدى فعالية مؤسستكم في استقطاب المواهب المؤهلة لسلسلة الإمداد — شاملًا العلامة التجارية لأصحاب العمل والشراكات الجامعية ومسار السعودة في الأدوار التقنية والمقارنة التعويضية التنافسية؟',
        levels: [
          'No proactive talent attraction strategy for supply chain. Vacancies are filled reactively through job boards without any employer branding or pipeline development.',
          'Recruitment is managed through standard channels (LinkedIn, recruitment agencies) but no employer brand or supply chain-specific talent pipeline is in place.',
          'A defined supply chain employer brand is communicated through targeted recruitment; relationships with 2-3 universities producing supply chain graduates are maintained; Saudization hiring pipeline is tracked.',
          'A supply chain talent attraction programme includes employer brand, university partnerships, graduate scheme, and competitive compensation benchmarked against GCC market data; Saudization targets are integrated into the recruitment plan.',
          'Best-in-class supply chain employer brand with national recognition; structured graduate and apprenticeship programmes; AI-assisted talent sourcing; total reward benchmarking updated annually; Saudization pipeline exceeds regulatory targets.',
        ],
        levelsAr: [
          'لا استراتيجية استباقية لاستقطاب مواهب سلسلة الإمداد. الوظائف الشاغرة تُملأ بشكل تفاعلي عبر لوحات الوظائف دون علامة تجارية لأصحاب العمل أو بناء مسار استقطاب منظم.',
          'التوظيف يُدار عبر القنوات القياسية (LinkedIn ووكالات توظيف) لكن لا علامة تجارية لأصحاب العمل أو مسار مواهب مخصص لسلسلة الإمداد.',
          'علامة تجارية محددة لأصحاب العمل في سلسلة الإمداد تُوصَّل عبر التوظيف الموجَّه؛ وعلاقات مع 2-3 جامعات تُخرّج خريجي سلسلة الإمداد مُحافَظ عليها؛ ومسار توظيف السعودة في الأدوار التقنية متابَع.',
          'برنامج استقطاب مواهب سلسلة الإمداد يشمل العلامة التجارية والشراكات الجامعية ومخطط الخريجين والتعويض التنافسي المُقارَن معياريًا ببيانات سوق الخليج؛ ومستهدفات السعودة مدمجة في خطة التوظيف.',
          'علامة تجارية لأصحاب العمل في سلسلة الإمداد بمستوى الأفضل في الفئة بتقدير وطني؛ وبرامج منظمة للخريجين والمتدربين؛ واستهداف المواهب بالذكاء الاصطناعي؛ ومقارنة الإجمالي التعويضي مُحدَّثة سنويًا؛ ومسار السعودة في الأدوار التقنية يتجاوز المستهدفات التنظيمية.',
        ],
      },
      {
        q: 'How effectively does the organisation manage voluntary attrition — tracking root causes of supply chain talent departure, acting on findings, and building retention strategies for critical roles?',
        qAr: 'ما مدى فعالية إدارة المؤسسة للاستقالة الطوعية — بتتبّع الأسباب الجذرية لمغادرة مواهب سلسلة الإمداد والتصرف بناءً على النتائج وبناء استراتيجيات احتفاظ للأدوار الحرجة؟',
        levels: [
          'Supply chain attrition is not tracked or managed. Departures are handled reactively with no exit interviews, root cause analysis, or retention strategy.',
          'Basic attrition rate is tracked annually but root causes are not systematically identified; retention strategies for critical supply chain roles are absent.',
          'Attrition rate by supply chain function is tracked quarterly; exit interviews are conducted and themes are shared with leadership; targeted retention initiatives address recurring issues.',
          'Supply chain attrition is benchmarked against GCC peers; root cause analysis identifies systemic issues (compensation, growth, management quality); retention programmes for critical roles are formally managed.',
          'Real-time attrition risk modelling predicts flight risk for critical supply chain talent; proactive retention conversations are triggered automatically; attrition rate for key roles is in the top quartile of GCC benchmarks.',
        ],
        levelsAr: [
          'معدل استقالة سلسلة الإمداد لا يُتابَع أو يُدار. المغادرات تُعالَج تفاعليًا دون مقابلات خروج أو تحليل سببي أو استراتيجية احتفاظ.',
          'معدل الاستقالة الأساسي يُتابَع سنويًا لكن الأسباب الجذرية لا تُحدَّد منهجيًا؛ واستراتيجيات الاحتفاظ للأدوار الحرجة في سلسلة الإمداد غائبة.',
          'معدل الاستقالة حسب وظيفة سلسلة الإمداد متابَع فصليًا؛ ومقابلات الخروج تُجرى والأنماط تُشارَك مع القيادة؛ ومبادرات احتفاظ موجَّهة تعالج المشكلات المتكررة.',
          'معدل استقالة سلسلة الإمداد مُقارَن معياريًا بنظراء الخليج؛ وتحليل السبب الجذري يُحدّد المشكلات النظامية (التعويض والنمو وجودة الإدارة)؛ وبرامج احتفاظ للأدوار الحرجة مُدارة رسميًا.',
          'نمذجة آنية لمخاطر الاستقالة تتنبأ بمخاطر الانسحاب لمواهب سلسلة الإمداد الحرجة؛ ومحادثات احتفاظ استباقية تُطلَق آليًا؛ ومعدل الاستقالة للأدوار الرئيسية في الربع الأعلى من مقاييس الخليج.',
        ],
      },
    ],
  },

  /* ── 10-4  Succession Planning ───────────────────────────────────────── */
  {
    id: 'org-succession',
    title: 'Succession Planning',
    titleAr: 'تخطيط التعاقب',
    hint: 'Evaluates the depth and rigour of supply chain succession planning — identification of critical roles, readiness assessments, and development of internal successors.',
    hintAr: 'يقيّم عمق وصرامة تخطيط التعاقب في سلسلة الإمداد — تحديد الأدوار الحرجة وتقييمات الجاهزية وتطوير الخلفاء الداخليين.',
    benchmarks: { gcc: 2.1, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 0.5, other: 1.0,
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How formally and rigorously is supply chain succession planning managed — identifying critical roles, assessing successor readiness (Ready Now / 1-2 years / 3-5 years), and developing accelerated pathways for high-potential talent?',
        qAr: 'ما مدى رسمية وصرامة إدارة تخطيط التعاقب في سلسلة الإمداد — بتحديد الأدوار الحرجة وتقييم جاهزية الخلفاء (جاهز الآن / 1-2 سنة / 3-5 سنوات) وتطوير مسارات مُسرَّعة للمواهب عالية الإمكانات؟',
        levels: [
          'No formal succession planning exists for supply chain. Key-person dependency is high and role vacancies at senior levels take months to fill.',
          'Succession planning is discussed informally at senior leadership level but no documented succession maps, readiness assessments, or development plans for successors exist.',
          'Critical supply chain roles (top 10) are identified; at least one internal successor is named for each; basic readiness assessments are completed; development plans for successors are documented.',
          'A formal succession review is conducted annually for all supply chain roles at grade 3+ (or equivalent); successor readiness ratings are tracked; development assignments accelerate high-potential talent.',
          'Succession planning covers all critical supply chain roles; 80%+ of senior vacancies are filled internally; a structured talent review cadence links succession to L&D, mobility, and performance data; board reviews succession depth annually.',
        ],
        levelsAr: [
          'لا يوجد تخطيط رسمي للتعاقب في سلسلة الإمداد. الاعتماد على أشخاص بعينهم مرتفع وشغل الوظائف الشاغرة على المستويات العليا يستغرق أشهرًا.',
          'تخطيط التعاقب يُناقَش بشكل غير رسمي على مستوى القيادة العليا لكن لا خرائط تعاقب موثّقة أو تقييمات جاهزية أو خطط تطوير للخلفاء.',
          'الأدوار الحرجة لسلسلة الإمداد (أعلى 10) محددة؛ وخليفة داخلي واحد على الأقل مُسمَّى لكل دور؛ وتقييمات جاهزية أساسية مكتملة؛ وخطط تطوير للخلفاء موثّقة.',
          'مراجعة تعاقب رسمية تُجرى سنويًا لجميع أدوار سلسلة الإمداد في الدرجة 3+ أو ما يعادلها؛ وتقييمات جاهزية الخلفاء متابَعة؛ ومهام التطوير تُسرّع المواهب عالية الإمكانات.',
          'تخطيط التعاقب يغطي جميع أدوار سلسلة الإمداد الحرجة؛ و80%+ من الشواغر العليا تُشغَل داخليًا؛ ودورة مراجعة مواهب منظمة تربط التعاقب بالتعلّم والتطوير والحراك ومعطيات الأداء؛ ومجلس الإدارة يراجع عمق التعاقب سنويًا.',
        ],
      },
    ],
  },

  /* ── 10-5  Change Management Capability ──────────────────────────────── */
  {
    id: 'org-change',
    title: 'Change Management Capability',
    titleAr: 'قدرة إدارة التغيير',
    hint: 'Assesses the organisation\'s capability to plan, communicate, and embed supply chain transformation programmes through structured change management methodologies.',
    hintAr: 'يقيس قدرة المنشأة على تخطيط برامج تحول سلسلة الإمداد والتواصل بشأنها وترسيخها عبر منهجيات إدارة تغيير منظمة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How effectively does your organisation manage the people and culture dimension of supply chain transformation — using structured change management methodologies, stakeholder engagement plans, and adoption measurement?',
        qAr: 'ما مدى فعالية إدارة مؤسستكم للبُعد البشري والثقافي لتحول سلسلة الإمداد — باستخدام منهجيات إدارة تغيير منظمة وخطط تفاعل أصحاب المصلحة وقياس التبنّي؟',
        levels: [
          'Change management is not considered in supply chain transformation projects. System and process changes are implemented without structured communication, training, or stakeholder engagement.',
          'Some communication occurs during major projects but change management is ad-hoc; stakeholder resistance is managed reactively; adoption is assumed rather than measured.',
          'A formal change management plan is developed for significant supply chain transformation projects; stakeholder analysis, communication plans, and training programmes are in place.',
          'A structured change management methodology (e.g., Prosci ADKAR) is applied to all major supply chain programmes; a dedicated change management team supports transformation; adoption rates are measured post-go-live.',
          'Change management is an embedded organisational capability; certified change practitioners lead all major supply chain transformations; change readiness assessments, adoption dashboards, and benefits realisation tracking are standard.',
        ],
        levelsAr: [
          'إدارة التغيير لا تُؤخَذ في الاعتبار في مشاريع تحول سلسلة الإمداد. تغييرات الأنظمة والعمليات تُطبَّق دون تواصل منظم أو تدريب أو تفاعل مع أصحاب المصلحة.',
          'بعض التواصل يحدث خلال المشاريع الكبرى لكن إدارة التغيير ارتجالية؛ ومقاومة أصحاب المصلحة تُعالَج تفاعليًا؛ والتبنّي مفترَض وليس مقيسًا.',
          'خطة رسمية لإدارة التغيير تُطوَّر لمشاريع التحول الجوهرية في سلسلة الإمداد؛ وتحليل أصحاب المصلحة وخطط التواصل وبرامج التدريب قائمة.',
          'منهجية منظمة لإدارة التغيير (كـ Prosci ADKAR) مُطبَّقة على جميع برامج سلسلة الإمداد الكبرى؛ وفريق إدارة تغيير مخصص يدعم التحول؛ ومعدلات التبنّي تُقاس بعد البدء الفعلي.',
          'إدارة التغيير قدرة تنظيمية متجذّرة؛ وممارسو إدارة التغيير المعتمدون يقودون جميع تحولات سلسلة الإمداد الكبرى؛ وتقييمات جاهزية التغيير ولوحات معلومات التبنّي وتتبّع تحقيق الفوائد معيارية.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   INDUSTRY MODULE A — MANUFACTURING & PRODUCTION OPERATIONS
   Module ID: mfg_ops
   Sub-segments:
     0 Production Planning & Scheduling
     1 Quality Management System
     2 OEE & Asset Effectiveness
     3 BOM Accuracy & Engineering Change Control
     4 Lean & Continuous Improvement
     5 Make-or-Buy & Outsourcing Governance
═══════════════════════════════════════════════════════════════════════════ */

export const MFG_OPS_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── mfg_ops-0  Production Planning & Scheduling ─────────────────────── */
  {
    id: 'mfg-prod-planning',
    title: 'Production Planning & Scheduling',
    titleAr: 'تخطيط الإنتاج وجدولته',
    hint: 'Assesses Master Production Schedule accuracy, capacity planning integration, constraint-based scheduling, and schedule adherence measurement.',
    hintAr: 'يقيس دقة خطة الإنتاج الرئيسية وتكامل تخطيط الطاقة والجدولة القائمة على القيود وقياس الالتزام بالجدول.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 0.5, marine: 0.5, construction: 1.5, oil_gas: 1.0,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How mature is your production planning and scheduling — including Master Production Schedule accuracy, capacity planning integration with the S&OP cycle, and schedule adherence measurement?',
        qAr: 'ما مدى نضج تخطيط الإنتاج وجدولته — شاملًا دقة خطة الإنتاج الرئيسية وتكامل تخطيط الطاقة مع دورة S&OP وقياس الالتزام بالجدول؟',
        levels: [
          'Production planning is reactive and ad-hoc. No master production schedule exists; work is scheduled informally based on immediate orders with no capacity visibility.',
          'A basic production schedule exists but is frequently revised due to material shortages, machine breakdowns, or sales changes; adherence is not measured.',
          'A formal MPS is produced monthly from the S&OP cycle with defined inputs from sales and materials planning; schedule adherence is tracked.',
          'MPS and capacity planning are integrated in the ERP/APS; schedule adherence ≥85% is measured weekly; constraint-based scheduling minimises changeover and downtime.',
          'Advanced planning and scheduling (APS) tools optimise production sequences in real-time; schedule adherence ≥95%; digital integration with procurement ensures near-zero material-caused stoppages.',
        ],
        levelsAr: [
          'تخطيط الإنتاج تفاعلي وارتجالي. لا توجد خطة إنتاج رئيسية؛ وتُجدوَل الأعمال بشكل غير رسمي بناءً على الطلبات الآنية دون رؤية للطاقة.',
          'توجد جدولة إنتاج أساسية لكنها تُراجَع بشكل متكرر بسبب نقص المواد أو أعطال الآلات أو تغيّرات المبيعات؛ والالتزام بالجدول لا يُقاس.',
          'تُنتَج خطة إنتاج رئيسية رسمية شهريًا من دورة S&OP بمدخلات محددة من المبيعات وتخطيط المواد؛ ويُتابَع الالتزام بالجدول.',
          'خطة الإنتاج الرئيسية وتخطيط الطاقة مدمجان في ERP/APS؛ والالتزام بالجدول ≥85% يُقاس أسبوعيًا؛ والجدولة القائمة على القيود تُقلّل أوقات التغيير والتوقف.',
          'تُحسَّن أدوات التخطيط والجدولة المتقدمة (APS) تسلسلات الإنتاج آنيًا؛ والالتزام بالجدول ≥95%؛ والتكامل الرقمي مع المشتريات يضمن توقفات ناجمة عن المواد شبه معدومة.',
        ],
      },
    ],
  },

  /* ── mfg_ops-1  Quality Management System ───────────────────────────── */
  {
    id: 'mfg-quality',
    title: 'Quality Management System',
    titleAr: 'نظام إدارة الجودة',
    hint: 'Evaluates the rigour of in-process quality control, First Pass Yield measurement, defect root cause analysis, and supplier quality linkage.',
    hintAr: 'يقيّم صرامة ضبط الجودة أثناء العملية وقياس معدل النجاح من أول مرور وتحليل السبب الجذري للعيوب وربط جودة الموردين.',
    benchmarks: { gcc: 2.5, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 0.5, marine: 0.5, construction: 1.5, oil_gas: 1.0,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'Quality management system certificate (ISO 9001 or equivalent)',
      labelAr: 'شهادة نظام إدارة الجودة (ISO 9001 أو ما يعادلها)',
      hint:    'Upload your ISO 9001 or equivalent quality management certificate, or a recent internal/external quality audit report.',
      hintAr:  'ارفع شهادة ISO 9001 أو ما يعادلها لنظام إدارة الجودة أو تقرير تدقيق جودة داخلي/خارجي حديث.',
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How effectively is production quality controlled — including in-process inspection, First Pass Yield (FPY) measurement, defect root-cause analysis, and supplier quality linkage?',
        qAr: 'ما مدى فعالية ضبط جودة الإنتاج — بما في ذلك الفحص أثناء العملية وقياس معدل النجاح من أول مرور (FPY) وتحليل السبب الجذري للعيوب وربط جودة الموردين؟',
        levels: [
          'Quality inspection is informal and end-of-line only. FPY and defect rates are not measured and quality feedback to suppliers is absent.',
          'Basic quality checks exist at key production stages but FPY and defect rates are tracked inconsistently; no structured root-cause analysis process exists.',
          'In-process quality control is formalised with defined inspection points; FPY is tracked by line/product and defect data is reviewed monthly with corrective actions assigned.',
          'Statistical Process Control (SPC) is applied to critical processes; FPY targets are set by product; supplier quality defects are tracked separately and quality trends are reported to management.',
          'Six Sigma / SPC drives near-zero defect production; FPY ≥97% sustained across lines; supplier quality data is integrated into the SRM platform; quality cost (CoQ) is a board-reported KPI.',
        ],
        levelsAr: [
          'الفحص الجودوي غير رسمي ويقتصر على نهاية الخط. معدل النجاح من أول مرور ومعدلات العيوب لا تُقاس وتغذية جودة الموردين الراجعة غائبة.',
          'توجد فحوصات جودة أساسية في مراحل إنتاج رئيسية لكن FPY ومعدلات العيوب تُتابَع بشكل غير متسق؛ ولا توجد عملية منظمة للتحليل السببي.',
          'ضبط الجودة أثناء العملية مُضفَى عليه الطابع الرسمي بنقاط فحص محددة؛ وتُتابَع FPY حسب الخط/المنتج وتُراجَع بيانات العيوب شهريًا مع إسناد إجراءات تصحيحية.',
          'تُطبَّق ضوابط العمليات الإحصائية (SPC) على العمليات الحرجة؛ وتُحدَّد مستهدفات FPY حسب المنتج وتُتابَع عيوب جودة الموردين بشكل منفصل وتُرفَع اتجاهات الجودة للإدارة.',
          'يقود Six Sigma / SPC إنتاجًا بعيوب شبه معدومة؛ وFPY ≥97% مستدام عبر الخطوط؛ وبيانات جودة الموردين مدمجة في منصة SRM؛ وتكلفة الجودة (CoQ) مؤشر يُرفَع لمجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── mfg_ops-2  OEE & Asset Effectiveness ───────────────────────────── */
  {
    id: 'mfg-oee',
    title: 'OEE & Asset Effectiveness',
    titleAr: 'الفعالية الكلية للمعدات وفعالية الأصول',
    hint: 'Measures the maturity of Overall Equipment Effectiveness tracking, loss-tree analysis, and TPM (Total Productive Maintenance) deployment.',
    hintAr: 'يقيس نضج تتبّع الفعالية الكلية للمعدات وتحليل شجرة الخسائر ونشر الصيانة الإنتاجية الشاملة (TPM).',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 0.5, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    evidence: {
      label:   'OEE dashboard or plant performance report',
      labelAr: 'لوحة تحكم OEE أو تقرير أداء المصنع',
      hint:    'Upload your OEE dashboard screenshot or a plant performance report showing Availability, Performance, and Quality metrics.',
      hintAr:  'ارفع لقطة شاشة من لوحة تحكم OEE أو تقرير أداء المصنع يُظهر مقاييس التوافرية والأداء والجودة.',
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How well do you measure and manage Overall Equipment Effectiveness (OEE) — and how systematically are availability, performance, and quality losses analysed and reduced through a TPM programme?',
        qAr: 'ما مدى جودة قياسكم وإدارتكم للفعالية الكلية للمعدات (OEE) — وما مدى منهجية تحليل وتقليص خسائر التوافر والأداء والجودة عبر برنامج TPM؟',
        levels: [
          'OEE is not measured. Downtime, speed losses, and quality rejects are not tracked systematically and maintenance is break-fix only.',
          'Availability (downtime) is tracked informally for critical equipment but performance and quality losses are not measured; OEE is not reported.',
          'OEE is calculated monthly for key production assets; the three OEE components are tracked and losses reviewed in monthly operations reviews.',
          'OEE is tracked daily for all significant production assets; loss-tree analysis identifies root causes; improvement projects target dominant loss sources; a TPM programme is in place.',
          'OEE ≥75% is sustained across key assets with real-time monitoring; TPM is fully embedded with pillar leadership; OEE trends are reviewed at executive level and linked to capex decisions.',
        ],
        levelsAr: [
          'لا تُقاس OEE. وقت التوقف وخسائر السرعة ورفض الجودة لا تُتابَع بشكل منهجي والصيانة إصلاحية فقط عند العطل.',
          'يُتابَع التوافر (وقت التوقف) بشكل غير رسمي للمعدات الحرجة لكن خسائر الأداء والجودة لا تُقاس؛ ولا تُرفَع تقارير OEE.',
          'تُحسَب OEE شهريًا للأصول الإنتاجية الرئيسية؛ وتُتابَع المكوّنات الثلاثة وتُراجَع الخسائر في مراجعات العمليات الشهرية.',
          'تُتابَع OEE يوميًا لجميع الأصول الإنتاجية الجوهرية؛ ويُحدّد تحليل شجرة الخسائر الأسباب الجذرية؛ ومشاريع التحسين تستهدف مصادر الخسائر السائدة؛ وبرنامج TPM قائم.',
          'تُحافَظ على OEE ≥75% عبر الأصول الرئيسية بمراقبة آنية؛ وTPM متجذّر بالكامل بقيادة ركائز؛ وتُراجَع اتجاهات OEE على المستوى التنفيذي وتُربَط بقرارات النفقات الرأسمالية.',
        ],
      },
    ],
  },

  /* ── mfg_ops-3  BOM Accuracy & Engineering Change Control ───────────── */
  {
    id: 'mfg-bom',
    title: 'BOM Accuracy & Engineering Change Control',
    titleAr: 'دقة BOM وضبط التغييرات الهندسية',
    hint: 'Assesses Bill of Materials accuracy, engineering change management (ECN) process rigour, and integration with procurement to prevent production disruptions.',
    hintAr: 'يقيس دقة قائمة مكوّنات المواد (BOM) وصرامة عملية إدارة التغييرات الهندسية (ECN) والتكامل مع المشتريات لمنع اضطرابات الإنتاج.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 0.5, marine: 0.5, construction: 1.0, oil_gas: 1.0,
      government: 0.5, technology: 1.5, banking: 0.5, other: 0.5,
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How accurately is your Bill of Materials (BOM) maintained — and how effectively is engineering change management controlled to prevent production disruptions and material waste?',
        qAr: 'ما مدى دقة الحفاظ على قائمة مكوّنات المواد (BOM) لديكم — وما مدى فعالية ضبط إدارة التغييرات الهندسية لمنع اضطرابات الإنتاج وهدر المواد؟',
        levels: [
          'BOMs are incomplete, inaccurate, or outdated. Engineering changes are implemented informally, often causing material shortages or over-purchasing.',
          'BOMs exist in the ERP for most products but accuracy is not regularly validated; engineering change management is informal and errors frequently cause material issues.',
          'BOM accuracy is reviewed annually; an engineering change management (ECN) process defines authorisation, communication, and effective date management for all changes.',
          'BOM accuracy ≥95% is measured quarterly; the ECN process integrates with procurement to pre-clear material changes before production impact.',
          'BOM accuracy ≥99% is a KPI with continuous validation; a digital change management system integrates design, procurement, and production; AI-assisted impact analysis reviews all ECNs before release.',
        ],
        levelsAr: [
          'قوائم مكوّنات المواد غير مكتملة أو غير دقيقة أو قديمة. تُطبَّق التغييرات الهندسية بشكل غير رسمي مما يتسبب في نقص المواد أو المشتريات الزائدة.',
          'توجد قوائم مكوّنات في ERP لمعظم المنتجات لكن دقتها لا تُتحقَّق بانتظام؛ وإدارة التغييرات الهندسية غير رسمية وأخطاؤها تسبب مشكلات مواد بشكل متكرر.',
          'تُراجَع دقة BOM سنويًا؛ وتُعرّف عملية إدارة التغييرات الهندسية (ECN) التفويض والتواصل وإدارة تاريخ النفاذ لجميع التغييرات.',
          'دقة BOM ≥95% تُقاس فصليًا؛ وتتكامل عملية ECN مع المشتريات لمسح مسبق لتغييرات المواد قبل أثرها على الإنتاج.',
          'دقة BOM ≥99% مؤشر أداء بتحقق مستمر؛ ونظام إدارة تغييرات رقمي يدمج التصميم والمشتريات والإنتاج؛ وتحليل الأثر بالذكاء الاصطناعي يراجع جميع ECNs قبل الإصدار.',
        ],
      },
    ],
  },

  /* ── mfg_ops-4  Lean & Continuous Improvement ───────────────────────── */
  {
    id: 'mfg-lean',
    title: 'Lean & Continuous Improvement',
    titleAr: 'التصنيع الرشيق والتحسين المستمر',
    hint: 'Evaluates the deployment of Lean manufacturing tools (5S, Kaizen, VSM, SMED), CI governance, and the embedding of a continuous improvement culture.',
    hintAr: 'يقيّم نشر أدوات التصنيع الرشيق (5S وKaizen وVSM وSMED) وحوكمة التحسين المستمر وترسيخ ثقافة التحسين المستمر.',
    benchmarks: { gcc: 2.2, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.0,
      government: 0.5, technology: 0.5, banking: 0.5, other: 0.5,
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How deeply are Lean manufacturing principles and continuous improvement methodologies embedded — including 5S, Kaizen events, Value Stream Mapping, and systematic waste elimination across production operations?',
        qAr: 'ما مدى عمق ترسّخ مبادئ التصنيع الرشيق ومنهجيات التحسين المستمر — شاملًا 5S وفعاليات Kaizen ورسم خريطة تدفق القيمة والقضاء المنهجي على الهدر عبر عمليات الإنتاج؟',
        levels: [
          'No Lean programme or CI methodology is in use. Waste and inefficiency are accepted as part of normal operations.',
          'Basic 5S is applied in some areas but is not sustained; Kaizen events occur informally and are not connected to a structured CI programme or governance model.',
          'A formal Lean/CI programme is in place; 5S is sustained across the production floor; Value Stream Mapping is used to identify improvement priorities; Kaizen events are scheduled and tracked.',
          'Lean is embedded as an operational philosophy; VSM-led improvement programmes target each of the 7 wastes; a CI governance board tracks projects and captures savings; Lean metrics are reported to operations leadership.',
          'World-class Lean manufacturing: all staff are Lean-trained; CI is a management accountability at all levels; a digital Kaizen tracker captures all CI activity; annual CI savings are benchmarked against best-in-class manufacturers.',
        ],
        levelsAr: [
          'لا برنامج رشيق أو منهجية تحسين مستمر مستخدَمة. الهدر والكفاءة المنخفضة مقبولان كجزء من العمليات الاعتيادية.',
          'تُطبَّق 5S الأساسية في بعض المناطق لكنها لا تُستدام؛ وفعاليات Kaizen تحدث بشكل غير رسمي وغير مرتبطة ببرنامج CI منظم أو نموذج حوكمة.',
          'برنامج رسمي للتصنيع الرشيق/التحسين المستمر قائم؛ و5S مستدامة عبر طوابق الإنتاج؛ ورسم خريطة تدفق القيمة يُستخدَم لتحديد أولويات التحسين؛ وفعاليات Kaizen مجدولة ومتابَعة.',
          'التصنيع الرشيق متجذّر كفلسفة تشغيلية؛ وبرامج تحسين قائمة على VSM تستهدف كل من المهدرات السبع؛ ومجلس حوكمة CI يتتبّع المشاريع ويرصد المدخرات؛ ومقاييس التصنيع الرشيق تُبلَّغ لقيادة العمليات.',
          'تصنيع رشيق من الدرجة العالمية: جميع الموظفين مدرَّبون على التصنيع الرشيق؛ والتحسين المستمر مسؤولية إدارية على جميع المستويات؛ ومتتبّع Kaizen رقمي يلتقط جميع نشاط CI؛ ومدخرات التحسين المستمر السنوية مُقارَنة معياريًا بالمصنّعين الرياديين.',
        ],
      },
    ],
  },

  /* ── mfg_ops-5  Make-or-Buy & Outsourcing Governance ────────────────── */
  {
    id: 'mfg-makeorbuy',
    title: 'Make-or-Buy & Outsourcing Governance',
    titleAr: 'التصنيع أو الشراء وحوكمة الاستعانة بمصادر خارجية',
    hint: 'Evaluates the rigour of make-or-buy decision frameworks, TCO analysis, and governance of outsourced manufacturing relationships.',
    hintAr: 'يقيّم صرامة أُطر قرارات التصنيع أو الشراء وتحليل التكلفة الإجمالية للملكية وحوكمة علاقات التصنيع المُستعان به.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 0.5,
      logistics: 0.5, marine: 0.5, construction: 1.5, oil_gas: 1.5,
      government: 0.5, technology: 1.0, banking: 0.5, other: 0.5,
    },
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How rigorously do you analyse make-or-buy decisions and govern outsourced manufacturing relationships — ensuring strategic alignment, cost competitiveness, quality control, and resilience?',
        qAr: 'ما مدى صرامة تحليلكم لقرارات التصنيع أو الشراء وحوكمة علاقات التصنيع المُستعان به — مما يضمن المواءَمة الاستراتيجية والتنافسية التكليفية وضبط الجودة والمرونة؟',
        levels: [
          'Make-or-buy decisions are never formally analysed. Outsourcing decisions are based on convenience or precedent with no TCO analysis or strategic review.',
          'Some informal cost comparison occurs when outsourcing decisions arise but no structured framework, TCO model, or strategic criteria are consistently applied.',
          'A make-or-buy framework applies defined criteria (cost, quality, IP risk, strategic fit) to significant outsourcing decisions; outcomes are documented and reviewed.',
          'Make-or-buy analysis uses full TCO modelling and strategic risk assessment; major outsourcing relationships are governed with SLAs, quality audits, and regular performance reviews.',
          'Make-or-buy strategy is a board-level decision aligned to the overall supply chain strategy; all significant outsourcing is governed with SLA, TCO benchmarking, quality audits, and supplier development programmes.',
        ],
        levelsAr: [
          'قرارات التصنيع أو الشراء لا تُحلَّل رسميًا أبدًا. تستند قرارات الاستعانة بمصادر خارجية إلى الملاءمة أو السابقة دون تحليل TCO أو مراجعة استراتيجية.',
          'يُجرى بعض المقارنة غير الرسمية للتكلفة عند ظهور قرارات الاستعانة بمصادر خارجية لكن لا يُطبَّق إطار منظم أو نموذج TCO أو معايير استراتيجية بشكل متسق.',
          'يُطبّق إطار التصنيع أو الشراء معايير محددة (التكلفة والجودة ومخاطر الملكية الفكرية والملاءمة الاستراتيجية) على قرارات الاستعانة الجوهرية؛ والنتائج موثّقة وتُراجَع.',
          'يستخدم تحليل التصنيع أو الشراء نمذجة TCO الكاملة وتقييم المخاطر الاستراتيجية؛ وعلاقات الاستعانة الكبرى تُحكَم باتفاقيات مستوى خدمة وتدقيق جودة ومراجعات أداء منتظمة.',
          'استراتيجية التصنيع أو الشراء قرار على مستوى مجلس الإدارة مواءَم مع استراتيجية سلسلة الإمداد الكلية؛ وجميع الاستعانة الجوهرية تُحكَم باتفاقيات مستوى خدمة ومقارنة معيارية لـ TCO وتدقيق جودة وبرامج تطوير الموردين.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   INDUSTRY MODULE B — FLEET, PORT & DISTRIBUTION OPERATIONS
   Module ID: fleet_ops
   Sub-segments:
     0 Fleet Utilisation & Cost Management
     1 Port/Hub Operational Performance
     2 Dangerous Goods & Hazmat Compliance
     3 Intermodal & Multimodal Coordination
     4 Last-mile & Urban Delivery (Fleet)
     5 Predictive Maintenance & Asset Health
═══════════════════════════════════════════════════════════════════════════ */

export const FLEET_OPS_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── fleet_ops-0  Fleet Utilisation & Cost Management ───────────────── */
  {
    id: 'fleet-utilisation',
    title: 'Fleet Utilisation & Cost Management',
    titleAr: 'استخدام الأسطول وإدارة التكاليف',
    hint: 'Assesses fleet KPI tracking (utilisation, cost-per-km, on-time delivery), route planning maturity, and driver performance management.',
    hintAr: 'يقيس تتبّع مؤشرات أداء الأسطول (الاستخدام وتكلفة/كم والتسليم في الوقت) ونضج تخطيط المسار وإدارة أداء السائقين.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How effectively is your fleet managed — in terms of utilisation, route efficiency, cost-per-km tracking, driver performance management, and use of TMS/fleet telematics?',
        qAr: 'ما مدى فعالية إدارة أسطولكم — من حيث معدل الاستخدام وكفاءة المسار وتتبّع التكلفة لكل كيلومتر وإدارة أداء السائقين واستخدام TMS/تتبّع الأسطول؟',
        levels: [
          'Fleet management is reactive. No utilisation KPIs, route planning tools, cost-per-km tracking, or maintenance scheduling; maintenance is break-fix only.',
          'Fleet utilisation is tracked informally for key vehicles; maintenance is scheduled but not optimised; cost-per-km is not consistently measured.',
          'Fleet utilisation and cost-per-km are tracked monthly; preventive maintenance schedules are in place; basic route planning tools are used for major delivery lanes.',
          'A TMS enables real-time fleet tracking, route optimisation, and load utilisation; cost-per-km, on-time delivery, and utilisation KPIs are reviewed monthly.',
          'A fully connected fleet management platform delivers GPS tracking, predictive maintenance, automated route optimisation, and driver behaviour analytics; cost-per-km is benchmarked against market rates.',
        ],
        levelsAr: [
          'إدارة الأسطول تفاعلية. لا توجد مؤشرات استخدام أو أدوات تخطيط مسار أو تتبّع تكلفة/كم أو جدولة صيانة؛ والصيانة إصلاحية عند العطل فقط.',
          'يُتابَع استخدام الأسطول بشكل غير رسمي للمركبات الرئيسية؛ والصيانة مجدولة لكن غير مُحسَّنة؛ وتكلفة/كم لا تُقاس بشكل متسق.',
          'يُتابَع استخدام الأسطول وتكلفة/كم شهريًا؛ وجداول الصيانة الوقائية قائمة؛ وأدوات تخطيط مسار أساسية تُستخدَم للخطوط الرئيسية.',
          'يُتيح نظام TMS التتبّع الآني للأسطول وتحسين المسار واستخدام الحمل؛ وتُراجَع مؤشرات تكلفة/كم والتسليم في الوقت والاستخدام شهريًا.',
          'منصة إدارة أسطول متصلة بالكامل توفر تتبّع GPS والصيانة التنبؤية وتحسين المسار الآلي وتحليلات سلوك السائقين؛ وتكلفة/كم تُقارَن معياريًا بأسعار السوق.',
        ],
      },
    ],
  },

  /* ── fleet_ops-1  Port/Hub Operational Performance ──────────────────── */
  {
    id: 'fleet-port',
    title: 'Port/Hub Operational Performance',
    titleAr: 'أداء عمليات الميناء/المركز',
    hint: 'Evaluates berth utilisation, dwell time management, cargo handling efficiency, and benchmarking against GCC port standards.',
    hintAr: 'يقيّم استخدام الأرصفة وإدارة وقت الإقامة وكفاءة مناولة البضائع والمقارنة المعيارية مع معايير موانئ الخليج.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How efficiently are your port or hub operations managed — tracking berth utilisation, dwell time, cargo handling rates, and turnaround times against GCC benchmarks?',
        qAr: 'ما مدى كفاءة إدارة عمليات الميناء أو المركز — بتتبّع استخدام الأرصفة ووقت الإقامة ومعدلات مناولة البضائع وأوقات التحوّل مقابل معايير الخليج؟',
        levels: [
          'Port/hub operations are not formally measured. Dwell time, berth utilisation, and handling rates are unknown beyond invoice reconciliation.',
          'Basic operational metrics (vessel/truck turnaround) are tracked informally; significant idle time and congestion occur without systematic analysis.',
          'Key port KPIs (dwell time, berth utilisation, crane/handling rate) are tracked monthly and reviewed with terminal operators; targets are defined.',
          'Port KPIs are tracked in near-real-time; dwell time and turnaround are benchmarked against GCC peers; congestion and demurrage are systematically managed.',
          'AI-driven port operations management optimises berth scheduling, crane allocation, and yard planning in real-time; performance exceeds GCC benchmarks; reviewed at board level.',
        ],
        levelsAr: [
          'عمليات الميناء/المركز لا تُقاس رسميًا. وقت الإقامة واستخدام الأرصفة ومعدلات المناولة مجهولة فيما يتجاوز مطابقة الفواتير.',
          'تُتابَع مقاييس التشغيل الأساسية (دوران السفن/الشاحنات) بشكل غير رسمي؛ ووقت الخمول والازدحام ملحوظان دون تحليل منهجي.',
          'تُتابَع مؤشرات الميناء الرئيسية (وقت الإقامة واستخدام الرصيف ومعدل الرافعات/المناولة) شهريًا وتُراجَع مع مشغّلي المحطة؛ والمستهدفات محددة.',
          'تُتابَع مؤشرات الميناء في شبه الوقت الحقيقي؛ ووقت الإقامة والدوران يُقارَنان معياريًا بنظراء الخليج؛ والازدحام والإقامة يُدارَان بشكل منهجي.',
          'يُحسّن تشغيل الميناء المدفوع بالذكاء الاصطناعي جدولة الأرصفة وتخصيص الرافعات وتخطيط الساحة آنيًا؛ والأداء يتجاوز معايير الخليج؛ ويُراجَع على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── fleet_ops-2  Dangerous Goods & Hazmat Compliance ───────────────── */
  {
    id: 'fleet-dg',
    title: 'Dangerous Goods & Hazmat Compliance',
    titleAr: 'البضائع الخطرة والامتثال للمواد الخطرة',
    hint: 'Evaluates DG/hazmat handling compliance with IMDG/IATA/ADR, staff certification, incident tracking, and zero-incident performance management.',
    hintAr: 'يقيّم الامتثال لمناولة DG/hazmat وفق IMDG/IATA/ADR وشهادات الموظفين وتتبّع الحوادث وإدارة أداء معدوم الحوادث.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 0.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How effectively do you manage dangerous goods (DG) and hazardous materials — in terms of IMDG/IATA/ADR regulatory compliance, staff certification, incident prevention, and third-party audit performance?',
        qAr: 'ما مدى فعالية إدارتكم للبضائع الخطرة والمواد الخطرة — من حيث الامتثال التنظيمي لـ IMDG/IATA/ADR وشهادات الموظفين والوقاية من الحوادث وأداء تدقيقات الطرف الثالث؟',
        levels: [
          'DG/hazmat compliance is not formally managed. Handling, labelling, and documentation are based on operator knowledge with no formal programme or training.',
          'Basic DG procedures exist but are not consistently followed; staff training is sporadic; compliance audits are not conducted.',
          'A formal DG/hazmat management programme includes IMDG/IATA/ADR compliance procedures, trained staff, and annual compliance audits.',
          'DG compliance is managed systematically; staff are certified (IMDG/IATA Level 1+); incident tracking is maintained; non-conformances are root-cause analysed.',
          'Zero-incident DG/hazmat performance is maintained through rigorous procedures, certified staff, third-party audits, and continuous safety improvement; benchmarked against global leaders.',
        ],
        levelsAr: [
          'الامتثال لـ DG/hazmat لا يُدار رسميًا. المناولة والتسمية والوثائق تعتمد على معرفة المشغّل دون برنامج رسمي أو تدريب.',
          'توجد إجراءات DG أساسية لكنها لا تُتّبَع باتساق والتدريب متقطّع وعمليات تدقيق الامتثال لا تُجرى.',
          'يشمل برنامج رسمي لإدارة DG/hazmat إجراءات امتثال IMDG/IATA/ADR وموظفين مدرَّبين وتدقيقات امتثال سنوية.',
          'يُدار الامتثال لـ DG بشكل منهجي؛ والموظفون حاملو شهادات (IMDG/IATA المستوى 1+)، وتُحفَظ سجلات الحوادث، وتُحلَّل عدم المطابقات سببيًا.',
          'يُحافَظ على أداء معدوم الحوادث في DG/hazmat عبر إجراءات صارمة وموظفين معتمدين وتدقيقات طرف ثالث وتحسين سلامة مستمر؛ مُقارَن معياريًا بالقادة العالميين.',
        ],
      },
    ],
  },

  /* ── fleet_ops-3  Intermodal & Multimodal Coordination ──────────────── */
  {
    id: 'fleet-intermodal',
    title: 'Intermodal & Multimodal Coordination',
    titleAr: 'التنسيق متعدد الوسائط',
    hint: 'Assesses the maturity of intermodal logistics coordination — seamless cargo transfer, visibility across modes, and SLA performance for multimodal corridors.',
    hintAr: 'يقيس نضج تنسيق اللوجستيات متعدد الوسائط — النقل السلس للبضائع والرؤية عبر الوسائط وأداء اتفاقيات مستوى الخدمة للممرات متعددة الوسائط.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.5, pharma: 1.0, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How well coordinated is your intermodal and multimodal logistics — enabling seamless cargo transfer between sea, road, rail, and air with near-zero handoff delays and full visibility across all modes?',
        qAr: 'ما مدى تنسيق لوجستياتكم متعددة الوسائط — مما يُتيح نقلاً سلسًا للبضائع بين البحر والطريق والسكة الحديد والجو بتأخيرات شبه معدومة عند نقاط التسليم ورؤية كاملة عبر جميع الوسائط؟',
        levels: [
          'Intermodal coordination is ad-hoc. Mode changes involve significant manual effort, data re-entry, and frequent delays at handoff points.',
          'Some coordination procedures exist for common intermodal routes but handoff documentation is manual and delays are frequent.',
          'Defined intermodal processes and documentation standards reduce handoff delays; key intermodal corridors have SLAs with modal operators.',
          'An intermodal visibility platform tracks cargo across all modes in near-real-time; exception alerts flag at-risk handoffs; transit time KPIs are tracked by corridor.',
          'A fully integrated intermodal visibility platform provides real-time cargo tracking; predictive ETAs are shared with customers; handoff delays near-zero on managed corridors.',
        ],
        levelsAr: [
          'التنسيق متعدد الوسائط ارتجالي. تتضمّن تغييرات الوسيلة جهدًا يدويًا كبيرًا وإعادة إدخال بيانات وتأخيرات متكررة عند نقاط التسليم.',
          'توجد بعض إجراءات التنسيق للمسارات متعددة الوسائط الشائعة لكن وثائق التسليم يدوية والتأخيرات متكررة.',
          'تُقلّص عمليات متعددة الوسائط المحددة ومعايير التوثيق تأخيرات التسليم؛ والممرات الرئيسية لها اتفاقيات مستوى خدمة مع مشغّلي الوسائط.',
          'تتتبّع منصة رؤية متعددة الوسائط البضائع عبر جميع الوسائط في شبه الوقت الحقيقي؛ وتنبيهات الاستثناءات تُبلّغ عن التسليمات المعرّضة للخطر؛ ومؤشرات زمن العبور تُتابَع حسب الممر.',
          'منصة رؤية متعددة الوسائط متكاملة بالكامل توفر تتبّعًا آنيًا؛ وأوقات الوصول التنبؤية تُشارَك مع العملاء؛ وتأخيرات التسليم شبه معدومة على الممرات المُدارة.',
        ],
      },
    ],
  },

  /* ── fleet_ops-4  Last-mile & Urban Delivery ─────────────────────────── */
  {
    id: 'fleet-lastmile',
    title: 'Last-mile & Urban Delivery',
    titleAr: 'التوصيل الحضري للميل الأخير',
    hint: 'Assesses vehicle-level and driver-level urban delivery maturity — telematics utilisation, driver behaviour scoring, micro-hub and consolidation point strategy, and adoption of low-emission urban delivery modes.',
    hintAr: 'يقيّم نضج التوصيل الحضري على مستوى المركبة والسائق — استخدام التتبّع الإلكتروني وتقييم سلوك السائق واستراتيجية المراكز المصغّرة ونقاط التوحيد واعتماد أوضاع التوصيل الحضري المنخفضة الانبعاثات.',
    benchmarks: { gcc: 2.4, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 0.5, fmcg: 1.5, pharma: 1.0, retail: 1.5,
      logistics: 1.5, marine: 0.5, construction: 0.5, oil_gas: 0.5,
      government: 1.0, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How mature is your urban delivery operation at the vehicle and driver level — measuring telematics utilisation, driver behaviour scoring, first-attempt delivery rate, cost-per-stop, and adoption of sustainable urban delivery modes (EVs, cargo bikes, micro-hubs)?',
        qAr: 'ما مدى نضج عمليات التوصيل الحضري على مستوى المركبة والسائق — بقياس استخدام التتبّع الإلكتروني وتقييم سلوك السائق ومعدل التسليم من أول محاولة والتكلفة لكل توقف واعتماد أوضاع التوصيل الحضري المستدام (المركبات الكهربائية والدراجات الشحنية والمراكز المصغّرة)؟',
        levels: [
          'Urban deliveries are managed without telematics. Driver behaviour, cost-per-stop, and first-attempt delivery rates are unknown; no sustainable delivery modes are deployed.',
          'Basic GPS tracking is in place but telematics data (fuel consumption, driver behaviour, idling time) is not systematically analysed; driver performance feedback is absent.',
          'Telematics data is used to monitor driver behaviour (speeding, idling, harsh braking); cost-per-stop is tracked; first-attempt delivery rate ≥85%; driver performance reviews occur monthly.',
          'Driver behaviour scoring drives performance management; route assignments factor in driver ratings; micro-hub feasibility has been assessed; first-attempt delivery rate ≥93%; CO₂ per delivery is tracked.',
          'AI-driven driver coaching uses real-time telematics; micro-hubs or consolidation points serve dense urban zones; EV or low-emission vehicles cover ≥30% of urban stops; CO₂ per delivery is a published sustainability KPI.',
        ],
        levelsAr: [
          'التوصيل الحضري يُدار دون تتبّع إلكتروني. سلوك السائق والتكلفة لكل توقف ومعدلات التسليم من أول محاولة مجهولة؛ ولا أوضاع توصيل مستدام مُنشَرة.',
          'تتبّع GPS أساسي متاح لكن بيانات التتبّع الإلكتروني (استهلاك الوقود وسلوك السائق ووقت التوقف) لا تُحلَّل منهجيًا؛ وتغذية راجعة لأداء السائق غائبة.',
          'بيانات التتبّع الإلكتروني تُستخدَم لمراقبة سلوك السائق (التجاوز والتوقف والكبح المفاجئ)؛ والتكلفة لكل توقف متابَعة؛ ومعدل التسليم من أول محاولة ≥85%؛ ومراجعات أداء السائقين شهرية.',
          'تقييم سلوك السائق يُوجّه إدارة الأداء؛ وتحديدات المسار تُراعي تقييمات السائقين؛ وجدوى المراكز المصغّرة مُقيَّمة؛ ومعدل التسليم من أول محاولة ≥93%؛ وCO₂ لكل توصيل متابَع.',
          'توجيه سائقين مدفوع بالذكاء الاصطناعي يستخدم التتبّع الإلكتروني الآني؛ ومراكز مصغّرة أو نقاط توحيد تخدم المناطق الحضرية الكثيفة؛ والمركبات الكهربائية أو المنخفضة الانبعاثات تغطي ≥30% من التوقفات الحضرية؛ وCO₂ لكل توصيل مؤشر استدامة منشور.',
        ],
      },
    ],
  },

  /* ── fleet_ops-5  Predictive Maintenance & Asset Health ─────────────── */
  {
    id: 'fleet-predictive-maint',
    title: 'Predictive Maintenance & Asset Health',
    titleAr: 'الصيانة التنبؤية وصحة الأصول',
    hint: 'Evaluates the maturity of fleet and port asset maintenance strategies — from reactive break-fix to AI-driven predictive maintenance.',
    hintAr: 'يقيّم نضج استراتيجيات صيانة أصول الأسطول والميناء — من الإصلاح التفاعلي عند الأعطال إلى الصيانة التنبؤية المدفوعة بالذكاء الاصطناعي.',
    benchmarks: { gcc: 2.2, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 0.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How mature is your fleet and asset maintenance strategy — moving beyond reactive break-fix and preventive maintenance towards condition-based and predictive maintenance using telematics and IoT data?',
        qAr: 'ما مدى نضج استراتيجية صيانة الأسطول والأصول لديكم — بالتجاوز من الإصلاح التفاعلي والصيانة الوقائية نحو الصيانة القائمة على الحالة والتنبؤية باستخدام بيانات التتبّع وإنترنت الأشياء؟',
        levels: [
          'Fleet and asset maintenance is reactive only. Vehicles and equipment are repaired only when they fail; downtime is frequent and unplanned.',
          'Preventive maintenance schedules exist on paper but adherence is poor; maintenance history is not well captured and there is no condition monitoring.',
          'A preventive maintenance programme is in place with scheduled servicing based on mileage/hours; maintenance records are maintained in the system; critical asset downtime is tracked.',
          'Condition-based maintenance uses telematics data (engine diagnostics, fuel efficiency, tyre wear) to schedule interventions before failure; breakdown rate KPIs are tracked and reviewed monthly.',
          'AI-powered predictive maintenance uses real-time IoT sensor data to predict component failures before they occur; maintenance schedules are fully optimised; breakdown rate near-zero; asset lifecycle costs are managed at a strategic level.',
        ],
        levelsAr: [
          'صيانة الأسطول والأصول تفاعلية فقط. المركبات والمعدات تُصلَح فقط عند العطل؛ وأوقات التوقف متكررة وغير مخططة.',
          'جداول الصيانة الوقائية موجودة على الورق لكن الالتزام بها ضعيف؛ وتاريخ الصيانة لا يُسجَّل جيدًا ولا توجد مراقبة للحالة.',
          'برنامج صيانة وقائية قائم بصيانة مجدولة مبنية على المسافة/ساعات التشغيل؛ وسجلات الصيانة محفوظة في النظام؛ وأوقات التوقف للأصول الحرجة متابَعة.',
          'الصيانة القائمة على الحالة تستخدم بيانات التتبّع (تشخيصات المحرك وكفاءة الوقود وتآكل الإطارات) لجدولة التدخلات قبل العطل؛ ومؤشرات معدل الأعطال متابَعة ومراجَعة شهريًا.',
          'الصيانة التنبؤية بالذكاء الاصطناعي تستخدم بيانات أجهزة استشعار IoT الآنية للتنبؤ بأعطال المكوّنات قبل وقوعها؛ وجداول الصيانة مُحسَّنة بالكامل؛ ومعدل الأعطال شبه معدوم؛ وتكاليف دورة حياة الأصول تُدار على المستوى الاستراتيجي.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   INDUSTRY MODULE C — REGULATORY & LOCALISATION COMPLIANCE
   Module ID: regulatory
   Sub-segments:
     0 Nitaqat / Saudization Compliance
     1 IKTVA & Local Content
     2 Import / Export Licensing & Controls
     3 Product Regulatory Compliance
     4 Government Procurement Regulations
     5 Halal & Islamic Commerce Standards
═══════════════════════════════════════════════════════════════════════════ */

export const REGULATORY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── regulatory-0  Nitaqat / Saudization Compliance ─────────────────── */
  {
    id: 'reg-nitaqat',
    title: 'Nitaqat / Saudization Compliance',
    titleAr: 'الامتثال لنطاقات / السعودة',
    hint: 'Assesses the rigour of Nitaqat compliance tracking by supply chain function, proactive Saudization pipeline management, and Vision 2030 workforce alignment.',
    hintAr: 'يقيم صرامة تتبّع الامتثال لنطاقات حسب وظيفة سلسلة الإمداد وإدارة مسار السعودة الاستباقي ومواءَمة القوى العاملة مع رؤية 2030.',
    benchmarks: { gcc: 2.5, topQuartile: 4.1 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.5, other: 1.5,
    },
    evidence: {
      label:   'Nitaqat / Saudisation certificate (Absher/Qiwa)',
      labelAr: 'شهادة نطاقات / السعودة (أبشر / قوى)',
      hint:    'Upload your most recent Nitaqat compliance certificate from Absher Business or Qiwa showing your Saudisation tier.',
      hintAr:  'ارفع أحدث شهادة الامتثال لنطاقات من أبشر للأعمال أو قوى يُظهر درجة السعودة.',
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How proactively does your organisation manage Nitaqat (Saudization) requirements — tracking localisation percentages by supply chain function, maintaining target band status, and linking procurement hiring to Saudi workforce plans?',
        qAr: 'ما مدى استباقية مؤسستكم في إدارة متطلبات نطاقات (السعودة) — بتتبّع نسب التوطين حسب وظيفة سلسلة الإمداد والحفاظ على حالة النطاق المستهدف وربط توظيف المشتريات بخطط القوى العاملة السعودية؟',
        levels: [
          'Nitaqat compliance is tracked reactively — only when an inspection or renewal is due. Current Saudization percentages for supply chain roles are unknown.',
          'Saudization percentages are tracked at company level but not broken down by supply chain function; hiring decisions are made without reference to Nitaqat targets.',
          'Saudization targets for supply chain roles are monitored monthly; hiring plans incorporate localisation requirements; compliance status is reported to leadership.',
          'Saudization tracking is automated by department; supply chain hiring pipelines proactively manage Nitaqat targets; compliance is reviewed quarterly at executive level.',
          'Proactive Nitaqat management maintains premium/platinum status; a structured Saudi supply chain talent pipeline is linked to Vision 2030 workforce plans; Saudization is an executive scorecard KPI.',
        ],
        levelsAr: [
          'متابعة الامتثال لنطاقات تفاعلية — فقط عند التفتيش أو التجديد. النسب المئوية الحالية للسعودة لأدوار سلسلة الإمداد مجهولة.',
          'نسب السعودة متابَعة على مستوى الشركة لكن غير مفصَّلة حسب وظيفة سلسلة الإمداد؛ وقرارات التوظيف تُتخَذ دون الإشارة إلى مستهدفات نطاقات.',
          'مستهدفات السعودة لأدوار سلسلة الإمداد متابَعة شهريًا؛ وخطط التوظيف تدمج متطلبات التوطين؛ وحالة الامتثال تُبلَّغ للقيادة.',
          'تتبّع السعودة آلي حسب القسم؛ وإجراءات التوظيف في سلسلة الإمداد تدير مستهدفات نطاقات استباقيًا؛ والامتثال يُراجَع فصليًا على المستوى التنفيذي.',
          'إدارة استباقية لنطاقات تُحافظ على حالة المميزة/البلاتينية؛ ومسار منظم لتطوير مواهب سلسلة الإمداد السعودية مرتبط بخطط القوى العاملة لرؤية 2030؛ والسعودة مؤشر في بطاقة الأداء التنفيذية.',
        ],
      },
      {
        q: 'How effectively is a Saudi supply chain talent pipeline built and managed — including university partnerships, graduate development programmes, targeted training for technical supply chain roles, and succession from expat to Saudi talent?',
        qAr: 'ما مدى فعالية بناء وإدارة مسار استقطاب مواهب سلسلة الإمداد السعودية وتطويرها — شاملًا الشراكات الجامعية وبرامج تطوير الخريجين والتدريب الموجَّه للأدوار التقنية في سلسلة الإمداد والتعاقب من المواهب الوافدة إلى السعودية؟',
        levels: [
          'No Saudi supply chain talent pipeline exists. Expatriate dependency is high and no Saudization succession plan is in place for technical roles.',
          'Some Saudi nationals are hired into supply chain roles but development programmes are absent; expat-to-Saudi knowledge transfer is informal and unstructured.',
          'A Saudi supply chain talent development programme targets 2-3 technical role families; university partnerships provide a graduate hiring pipeline; structured onboarding and mentoring are in place.',
          'A structured Saudi supply chain capability development programme covers all critical roles; expat-to-Saudi succession plans are documented; Saudi talent representation in senior roles is tracked as a KPI.',
          'Saudi talent is the primary pipeline for all supply chain roles; a supply chain academy develops Saudi nationals for leadership; Saudi supply chain executives mentor and coach Saudi talent; Saudization in senior supply chain roles exceeds 70%.',
        ],
        levelsAr: [
          'لا يوجد مسار منظم لاستقطاب مواهب سلسلة الإمداد السعودية. الاعتماد على الوافدين مرتفع ولا توجد خطة تعاقب سعودة للأدوار التقنية.',
          'بعض السعوديين يُوظَّفون في أدوار سلسلة الإمداد لكن برامج التطوير غائبة؛ ونقل المعرفة من الوافدين للسعوديين غير رسمي وغير منظم.',
          'برنامج تطوير مواهب سلسلة إمداد سعودية يستهدف 2-3 عائلات أدوار تقنية؛ والشراكات الجامعية توفر مسار توظيف الخريجين؛ والتوجيه والإرشاد المنظمان قائمان.',
          'برنامج منظم لتطوير قدرات سلسلة الإمداد السعودية يغطي جميع الأدوار الحرجة؛ وخطط تعاقب الوافدين-السعوديين موثّقة؛ وتمثيل المواهب السعودية في الأدوار العليا متابَع كمؤشر.',
          'المواهب السعودية هي المصدر الرئيسي لشغل جميع أدوار سلسلة الإمداد؛ وأكاديمية سلسلة إمداد تُطوّر السعوديين للقيادة؛ وتنفيذيو سلسلة الإمداد السعوديون يُرشدون المواهب السعودية؛ والسعودة في الأدوار العليا لسلسلة الإمداد تتجاوز 70%.',
        ],
      },
    ],
  },

  /* ── regulatory-1  IKTVA & Local Content ────────────────────────────── */
  {
    id: 'reg-iktva',
    title: 'IKTVA & Local Content',
    titleAr: 'IKTVA والمحتوى المحلي',
    hint: 'Evaluates compliance with IKTVA (In-Kingdom Total Value Add) and other GCC local content programmes — measurement, reporting, and strategic local content development.',
    hintAr: 'يقيّم الامتثال لبرنامج IKTVA (القيمة المضافة الكلية في المملكة) وبرامج المحتوى المحلي الأخرى في دول الخليج — القياس والتقارير والتطوير الاستراتيجي للمحتوى المحلي.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'IKTVA scorecard or in-kingdom value-add report',
      labelAr: 'بطاقة IKTVA أو تقرير القيمة المضافة الوطنية',
      hint:    'Upload your most recent IKTVA scorecard issued by Saudi Aramco or the relevant authority.',
      hintAr:  'ارفع أحدث بطاقة IKTVA الصادرة من أرامكو السعودية أو الجهة المختصة.',
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How rigorously does your organisation measure, manage, and maximise IKTVA (or equivalent local content) performance — including supplier local content data collection, reporting accuracy, and strategic local content development plans?',
        qAr: 'ما مدى صرامة قياس مؤسستكم وإدارة وتعظيم أداء IKTVA (أو ما يعادله من المحتوى المحلي) — شاملًا جمع بيانات المحتوى المحلي من الموردين ودقة التقارير وخطط التطوير الاستراتيجي للمحتوى المحلي؟',
        levels: [
          'IKTVA compliance is managed reactively. Local content percentages are estimated informally at reporting time with no systematic data collection from suppliers.',
          'IKTVA reporting is completed annually for regulatory compliance but supplier data quality is poor; no strategic local content development plan exists.',
          'A formal IKTVA management process collects local content data from suppliers quarterly; reporting accuracy is reviewed internally before submission; a local content improvement target is set.',
          'IKTVA management is proactive; local content data is collected monthly from all significant suppliers; an IKTVA development plan targets specific local content gaps with supplier qualification and development actions.',
          'Best-in-class IKTVA management: real-time local content tracking platform; IKTVA performance embedded in procurement decisions; a strategic local content development programme creates new local suppliers for critical categories; IKTVA performance benchmarked against sector leaders.',
        ],
        levelsAr: [
          'إدارة IKTVA تفاعلية. النسب المئوية للمحتوى المحلي تُقدَّر بشكل غير رسمي عند الإبلاغ دون جمع منهجي للبيانات من الموردين.',
          'تقارير IKTVA تُكتمَل سنويًا للامتثال التنظيمي لكن جودة بيانات الموردين ضعيفة؛ ولا توجد خطة استراتيجية لتطوير المحتوى المحلي.',
          'عملية رسمية لإدارة IKTVA تجمع بيانات المحتوى المحلي من الموردين فصليًا؛ ودقة التقارير تُراجَع داخليًا قبل التقديم؛ ومستهدف تحسين المحتوى المحلي محدد.',
          'إدارة IKTVA استباقية؛ وبيانات المحتوى المحلي تُجمَع شهريًا من جميع الموردين الجوهريين؛ وخطة تطوير IKTVA تستهدف فجوات محتوى محلي محددة بإجراءات تأهيل وتطوير الموردين.',
          'إدارة IKTVA بمستوى الأفضل في الفئة: منصة تتبّع محتوى محلي آنية؛ وأداء IKTVA مدمج في قرارات المشتريات؛ وبرنامج تطوير محتوى محلي استراتيجي يُنشئ موردين محليين جدد للفئات الحرجة؛ وأداء IKTVA مُقارَن معياريًا بقادة القطاع.',
        ],
      },
    ],
  },

  /* ── regulatory-2  Import / Export Licensing & Controls ─────────────── */
  {
    id: 'reg-import-export',
    title: 'Import / Export Licensing & Controls',
    titleAr: 'تراخيص الاستيراد/التصدير والضوابط',
    hint: 'Assesses the rigour of import/export licensing management, dual-use controls, sanctions compliance, and customs power-of-attorney governance.',
    hintAr: 'يقيس صرامة إدارة تراخيص الاستيراد/التصدير وضوابط الاستخدام المزدوج وامتثال العقوبات وحوكمة وكالة الجمارك.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.0, other: 1.0,
    },
    evidence: {
      label:   'Import/export licence or customs broker authorisation',
      labelAr: 'رخصة الاستيراد/التصدير أو تفويض الوكيل الجمركي',
      hint:    'Upload your import/export licence, customs broker authorisation letter, or most recent trade compliance audit.',
      hintAr:  'ارفع رخصة الاستيراد/التصدير أو خطاب تفويض الوكيل الجمركي أو أحدث تدقيق امتثال تجاري.',
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How comprehensively are import and export licences managed — covering licence tracking, renewal scheduling, dual-use item controls, international sanctions screening, and customs broker governance?',
        qAr: 'ما مدى شمولية إدارة تراخيص الاستيراد والتصدير — شاملًا تتبّع التراخيص وجدولة التجديد وضوابط عناصر الاستخدام المزدوج وفحص العقوبات الدولية وحوكمة وكيل الجمارك؟',
        levels: [
          'Import/export licence management is informal. Licences are tracked through spreadsheets or email reminders; renewal lapses are common; no sanctions screening process exists.',
          'Major import/export licences are tracked but dual-use item controls and sanctions compliance are managed informally; customs broker performance is not governed.',
          'A formal licence register covers all significant import/export licences with renewal alerts; a basic sanctions screening process is in place; customs brokers are contracted with defined performance expectations.',
          'A trade compliance management system tracks all licences and regulatory controls; automated sanctions screening is applied to all transactions; customs broker SLAs are formally governed.',
          'Best-in-class import/export compliance: automated licence management with regulatory change monitoring; real-time sanctions screening integrated with procurement and logistics systems; AEO status; customs broker performance managed through an SLA scorecard.',
        ],
        levelsAr: [
          'إدارة تراخيص الاستيراد/التصدير غير رسمية. التراخيص تُتابَع عبر جداول البيانات أو تذكيرات البريد الإلكتروني؛ وانتهاء التجديد شائع؛ ولا توجد عملية فحص العقوبات.',
          'التراخيص الرئيسية للاستيراد/التصدير متابَعة لكن ضوابط عناصر الاستخدام المزدوج وامتثال العقوبات يُدارَان بشكل غير رسمي؛ وأداء وكيل الجمارك غير محكوم.',
          'سجل تراخيص رسمي يغطي جميع تراخيص الاستيراد/التصدير الجوهرية بتنبيهات تجديد؛ وعملية فحص عقوبات أساسية قائمة؛ ووكلاء الجمارك متعاقَد معهم بتوقعات أداء محددة.',
          'نظام إدارة الامتثال التجاري يتتبّع جميع التراخيص والضوابط التنظيمية؛ وفحص العقوبات الآلي مُطبَّق على جميع المعاملات؛ واتفاقيات مستوى خدمة وكلاء الجمارك محكومة رسميًا.',
          'امتثال استيراد/تصدير بمستوى الأفضل في الفئة: إدارة تراخيص آلية مع مراقبة تغييرات التشريعات؛ وفحص عقوبات آنية مدمج مع أنظمة المشتريات واللوجستيات؛ وحالة AEO؛ وأداء وكيل الجمارك مُدار عبر بطاقة أداء SLA.',
        ],
      },
    ],
  },

  /* ── regulatory-3  Product Regulatory Compliance ─────────────────────── */
  {
    id: 'reg-product',
    title: 'Product Regulatory Compliance',
    titleAr: 'الامتثال التنظيمي للمنتج',
    hint: 'Evaluates product certification management, SASO/SFDA/GSO compliance, labelling requirements, and product recall readiness.',
    hintAr: 'يقيّم إدارة شهادات المنتج والامتثال لـ SASO/SFDA/GSO ومتطلبات التسمية وجاهزية سحب المنتج.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 0.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 0.5, other: 1.0,
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How comprehensively is product regulatory compliance managed — including SASO/SFDA/GSO certification tracking, product labelling compliance, shelf-life management, and product recall readiness?',
        qAr: 'ما مدى شمولية إدارة الامتثال التنظيمي للمنتج — شاملًا تتبّع شهادات SASO/SFDA/GSO والامتثال لتسمية المنتج وإدارة العمر الافتراضي وجاهزية سحب المنتج؟',
        levels: [
          'Product regulatory compliance is managed reactively. Certification status is unknown until an inspection occurs; no recall plan exists.',
          'Major product certifications are tracked but renewal management is informal; labelling compliance is spot-checked; no formal product recall procedure exists.',
          'A product compliance register tracks all required certifications with renewal alerts; labelling compliance checks are built into the product launch process; a basic product recall procedure exists.',
          'Product compliance is managed through an integrated system; certification renewals are managed 90+ days in advance; full labelling compliance is verified before product goes to market; a recall procedure is tested annually.',
          'Best-in-class product compliance: a digital compliance management platform tracks all certifications, labelling requirements, and regulatory changes in real-time; product recall procedures are exercised annually with supply chain and commercial teams; zero compliance incidents.',
        ],
        levelsAr: [
          'الامتثال التنظيمي للمنتج يُدار تفاعليًا. حالة الشهادات مجهولة حتى يحدث التفتيش؛ ولا خطة سحب موجودة.',
          'الشهادات الرئيسية للمنتجات متابَعة لكن إدارة التجديد غير رسمية؛ وامتثال التسمية يُفحَص عشوائيًا؛ ولا إجراء رسمي لسحب المنتج.',
          'سجل امتثال المنتج يتتبّع جميع الشهادات المطلوبة بتنبيهات تجديد؛ وفحوصات امتثال التسمية مدمجة في عملية إطلاق المنتج؛ وإجراء سحب منتج أساسي موجود.',
          'الامتثال يُدار عبر نظام متكامل؛ وتجديدات الشهادات تُدار قبل 90+ يومًا؛ والامتثال الكامل للتسمية يُتحقَّق منه قبل طرح المنتج في السوق؛ وإجراء السحب يُختبَر سنويًا.',
          'امتثال منتج بمستوى الأفضل في الفئة: منصة رقمية لإدارة الامتثال تتتبّع جميع الشهادات ومتطلبات التسمية والتغييرات التنظيمية آنيًا؛ وإجراءات سحب المنتج تُنفَّذ سنويًا مع فرق سلسلة الإمداد والتجاريين؛ وصفر حوادث امتثال.',
        ],
      },
    ],
  },

  /* ── regulatory-4  Government Procurement Regulations ───────────────── */
  {
    id: 'reg-gov-procurement',
    title: 'Government Procurement Regulations',
    titleAr: 'لوائح المشتريات الحكومية',
    hint: 'Assesses compliance with Saudi government procurement regulations (Regulation of the Government Tenders and Procurement Law), pre-qualification requirements, and public sector contract governance.',
    hintAr: 'يقيّم الامتثال للوائح المشتريات الحكومية السعودية (نظام المنافسات والمشتريات الحكومية) ومتطلبات التأهيل المسبق وحوكمة عقود القطاع العام.',
    benchmarks: { gcc: 2.4, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 0.5,
      logistics: 1.5, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.5, banking: 1.0, other: 1.0,
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How rigorously does your organisation comply with Saudi government procurement laws and regulations — including Regulation of Government Tenders & Procurement, ETIMAD portal requirements, mandatory local content, and public sector contract governance?',
        qAr: 'ما مدى صرامة امتثال مؤسستكم لقوانين ولوائح المشتريات الحكومية السعودية — شاملًا نظام المنافسات والمشتريات الحكومية ومتطلبات منصة اعتماد والمحتوى المحلي الإلزامي وحوكمة العقود الحكومية؟',
        levels: [
          'Government procurement regulations are managed reactively. Compliance is addressed only when a tender process or inspection requires it.',
          'Basic awareness of government procurement requirements exists but compliance tracking is informal; ETIMAD/Unified Procurement Portal is used for transactions but compliance monitoring is limited.',
          'A formal compliance programme covers key government procurement regulations; staff responsible for public sector tenders are trained on the Tenders and Procurement Law; compliance is reviewed internally before contract award.',
          'Government procurement compliance is systematically managed; a designated compliance team monitors regulatory changes; all public sector contracts are reviewed for compliance before signing; audit trail documentation is maintained.',
          'Best-in-class government procurement compliance: a compliance management platform monitors regulatory changes in real-time; all staff involved in public sector supply chain are certified; zero compliance breaches in the last 3 years; proactive engagement with regulatory authorities on emerging requirements.',
        ],
        levelsAr: [
          'لوائح المشتريات الحكومية تُدار تفاعليًا. الامتثال يُعالَج فقط عند مقتضى عملية مناقصة أو تفتيش.',
          'وعي أساسي بمتطلبات المشتريات الحكومية موجود لكن تتبّع الامتثال غير رسمي؛ ومنصة اعتماد/البوابة الموحدة للمشتريات تُستخدَم للمعاملات لكن مراقبة الامتثال محدودة.',
          'برنامج امتثال رسمي يغطي اللوائح الرئيسية للمشتريات الحكومية؛ والموظفون المسؤولون عن مناقصات القطاع العام مدرَّبون على نظام المنافسات والمشتريات؛ والامتثال يُراجَع داخليًا قبل ترسية العقد.',
          'الامتثال للمشتريات الحكومية مُدار منهجيًا؛ وفريق امتثال مخصص يراقب التغييرات التنظيمية؛ وجميع عقود القطاع العام تُراجَع للامتثال قبل التوقيع؛ وتوثيق سجل التدقيق محفوظ.',
          'امتثال مشتريات حكومية بمستوى الأفضل في الفئة: منصة إدارة امتثال ترصد التغييرات التنظيمية آنيًا؛ وجميع الموظفين المشاركين في سلسلة إمداد القطاع العام معتمدون؛ وصفر خروقات امتثال في آخر 3 سنوات؛ وتفاعل استباقي مع الجهات التنظيمية على المتطلبات الناشئة.',
        ],
      },
    ],
  },

  /* ── regulatory-5  Halal & Islamic Commerce Standards ───────────────── */
  {
    id: 'reg-halal',
    title: 'Halal & Islamic Commerce Standards',
    titleAr: 'معايير الحلال والتجارة الإسلامية',
    hint: 'Evaluates Halal certification management across the supply chain — from raw material sourcing through processing, storage, logistics, and retail — and Islamic finance compliance in procurement.',
    hintAr: 'يقيّم إدارة اعتماد الحلال عبر سلسلة الإمداد — من تحصيل المواد الخام عبر المعالجة والتخزين واللوجستيات والتجزئة — وامتثال التمويل الإسلامي في المشتريات.',
    benchmarks: { gcc: 2.6, topQuartile: 4.2 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.5, technology: 0.5, banking: 1.5, other: 1.0,
    },
    evidence: {
      label:   'Halal certification (SASO / GCC-approved body)',
      labelAr: 'شهادة الحلال (هيئة SASO / هيئة معتمدة من دول الخليج)',
      hint:    'Upload your current Halal certification issued by SASO or a GCC-approved certification body.',
      hintAr:  'ارفع شهادة الحلال الحالية الصادرة من هيئة SASO أو هيئة اعتماد معتمدة من دول مجلس التعاون.',
    },
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How comprehensively is Halal certification managed across your supply chain — covering raw material supplier certification, production segregation, cold chain integrity, logistics Halal controls, and end-to-end traceability?',
        qAr: 'ما مدى شمولية إدارة اعتماد الحلال عبر سلسلة الإمداد — شاملًا اعتماد موردي المواد الخام وفصل الإنتاج وسلامة سلسلة التبريد وضوابط الحلال اللوجستية وإمكانية التتبّع من طرف إلى طرف؟',
        levels: [
          'Halal certification is obtained for end-products only. The supply chain behind certified products is not audited for Halal integrity; cross-contamination risks in logistics and storage are not managed.',
          'Key suppliers have Halal certificates but these are collected and filed reactively; segregation in production and logistics is inconsistently applied; end-to-end Halal traceability is absent.',
          'A Halal supply chain management programme covers certified supplier selection, production segregation protocols, and Halal-dedicated logistics lanes; certificates are tracked and renewed proactively.',
          'End-to-end Halal supply chain integrity is assured through a documented Halal management system; independent Halal audits cover suppliers, production, logistics, and retail; Halal traceability is available from source to shelf.',
          'Best-in-class Halal supply chain management aligned to GSO 2055 and SASO Halal standards; digital Halal traceability platform covers the full supply chain; proactive engagement with SFDA and GCC Halal authorities; Halal integrity is a board-level supply chain commitment.',
        ],
        levelsAr: [
          'اعتماد الحلال يُحصَّل للمنتجات النهائية فقط. سلسلة الإمداد وراء المنتجات المعتمدة لا تُدقَّق لسلامة الحلال؛ ومخاطر التلوث المتبادل في اللوجستيات والتخزين لا تُدار.',
          'الموردون الرئيسيون لديهم شهادات حلال لكنها تُجمَع وتُودَع بشكل تفاعلي؛ والفصل في الإنتاج واللوجستيات يُطبَّق بشكل غير متسق؛ وإمكانية التتبّع الكاملة للحلال من طرف إلى طرف غائبة.',
          'برنامج إدارة سلسلة إمداد حلال يغطي اختيار الموردين المعتمدين وبروتوكولات فصل الإنتاج وخطوط لوجستيات مخصصة للحلال؛ والشهادات متابَعة ومجدَّدة استباقيًا.',
          'سلامة سلسلة الإمداد الحلال من طرف إلى طرف مضمونة عبر نظام إدارة حلال موثّق؛ وتدقيقات حلال مستقلة تغطي الموردين والإنتاج واللوجستيات والتجزئة؛ وإمكانية تتبّع الحلال متاحة من المصدر حتى الرف.',
          'إدارة سلسلة إمداد حلال بمستوى الأفضل في الفئة مواءَمة مع GSO 2055 ومعايير SASO للحلال؛ ومنصة رقمية لتتبّع الحلال تغطي سلسلة الإمداد الكاملة؛ وتفاعل استباقي مع SFDA وسلطات الحلال في دول الخليج؛ وسلامة الحلال التزام سلسلة إمداد على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

];
