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

  /* ── 5-0  Environmental Performance Baseline ──────────────────────────── */
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
        q: 'How comprehensively has your organisation established and documented an environmental performance baseline — covering energy consumption, water usage, waste generation, and air emissions?',
        qAr: 'ما مدى شمولية إرساء مؤسستكم وتوثيق خط الأساس للأداء البيئي — شاملًا استهلاك الطاقة واستخدام المياه وتوليد النفايات وانبعاثات الهواء؟',
        levels: [
          'No environmental performance data is systematically collected. Energy, water, and waste figures are unavailable or exist only in disconnected utility invoices.',
          'Some environmental data is collected informally (e.g., electricity bills, waste disposal invoices) but is not consolidated, benchmarked, or used for management decision-making.',
          'An environmental baseline covering energy, water, and waste is documented for major facilities; data is reviewed annually and reported to functional management.',
          'A comprehensive environmental baseline is maintained for all significant operational sites; data is tracked monthly, benchmarked against industry peers, and reported in the annual sustainability report.',
          'A real-time environmental data platform tracks all material consumption and emissions across the value chain; the baseline is verified by a third party annually, disclosed in ESG reporting, and drives reduction targets.',
        ],
        levelsAr: [
          'لا تُجمَع بيانات الأداء البيئي بشكل منهجي. أرقام الطاقة والمياه والنفايات غير متوفرة أو موجودة فقط في فواتير المرافق غير المترابطة.',
          'تُجمَع بعض البيانات البيئية بشكل غير رسمي (كفواتير الكهرباء وفواتير التخلص من النفايات) لكنها غير مجمّعة أو مُقارَنة معياريًا أو مُوظَّفة في قرارات الإدارة.',
          'خط الأساس البيئي الشامل للطاقة والمياه والنفايات موثّق للمرافق الرئيسية؛ وتُراجَع البيانات سنويًا وتُرفَع للإدارة المعنية.',
          'يُحافَظ على خط أساس بيئي شامل لجميع المواقع التشغيلية الجوهرية؛ وتُتابَع البيانات شهريًا وتُقارَن معياريًا بنظراء القطاع وتُدرَج في تقرير الاستدامة السنوي.',
          'منصة بيانات بيئية آنية تتتبّع جميع الاستهلاك المادي والانبعاثات عبر سلسلة القيمة؛ والخط الأساسي يُتحقَّق منه طرف ثالث سنويًا ويُفصَح عنه في التقارير البيئية والاجتماعية والحوكمية ويُوجِّه مستهدفات التخفيض.',
        ],
      },
      {
        q: 'To what extent has your organisation set specific, time-bound environmental reduction targets — and how rigorously are progress and shortfalls tracked and reported?',
        qAr: 'إلى أي مدى حددت مؤسستكم مستهدفات بيئية خفض محددة وذات أُطر زمنية — وما مدى صرامة متابعة التقدم والفجوات والإبلاغ عنها؟',
        levels: [
          'No formal environmental reduction targets exist. Environmental performance is not monitored against any objectives.',
          'Broad aspirational environmental commitments have been stated by leadership but no specific KPIs, baselines, or timelines have been set.',
          'Specific energy or waste reduction targets are defined for the current year; progress is reported annually to sustainability or risk committees.',
          'Quantified environmental targets (energy intensity, water intensity, waste-to-landfill) are linked to executive scorecards; quarterly progress reviews track actuals against targets with corrective action plans.',
          'Science-based environmental targets aligned to Net Zero pathways are set, publicly disclosed, and independently assured; a dedicated ESG management system tracks real-time performance against targets.',
        ],
        levelsAr: [
          'لا توجد مستهدفات رسمية لخفض البيئة. الأداء البيئي لا يُراقَب مقابل أي أهداف.',
          'تعهّدات بيئية طموحة عامة أبدتها القيادة لكن دون مؤشرات أداء محددة أو خطوط أساس أو جداول زمنية.',
          'مستهدفات محددة لخفض الطاقة أو النفايات معرّفة للسنة الحالية؛ ويُبلَّغ عن التقدم سنويًا للجان الاستدامة أو المخاطر.',
          'مستهدفات بيئية مُقاسة (كثافة الطاقة وكثافة المياه والنفايات إلى مكبّ النفايات) مرتبطة ببطاقات أداء تنفيذية؛ ومراجعات تقدم فصلية تتتبع الفعلي مقابل المستهدف مع خطط تصحيحية.',
          'مستهدفات بيئية قائمة على العلم مواءَمة مع مسارات الحياد الكربوني محددة ومُفصَح عنها علنًا ومضمونة باستقلالية؛ ونظام إدارة بيئية واجتماعية وحوكمية مخصص يتتبع الأداء آنيًا.',
        ],
      },
      {
        q: 'How formally is your environmental management system structured — covering ISO 14001 certification, legal compliance monitoring, incident reporting, and continual improvement programmes?',
        qAr: 'ما مدى رسمية هيكل نظام إدارتكم البيئية — شاملًا اعتماد ISO 14001 ومراقبة الامتثال القانوني والإبلاغ عن الحوادث وبرامج التحسين المستمر؟',
        levels: [
          'No formal environmental management system exists. Environmental legal compliance is managed reactively without any structured programme.',
          'Some environmental legal requirements are tracked informally; incidents are reported when they occur but there is no systematic EMS, risk register, or audit programme.',
          'An environmental management framework is in place with defined compliance monitoring, incident reporting procedures, and an internal audit programme; ISO 14001 is planned or in progress.',
          'An ISO 14001-certified EMS is operational; legal compliance is monitored systematically; incidents are investigated and root-cause analyses performed; continual improvement targets are set annually.',
          'A certified ISO 14001 EMS is integrated with the broader risk management framework; digital tools automate compliance monitoring; all environmental incidents trigger formal RCA; the EMS is reviewed at board level.',
        ],
        levelsAr: [
          'لا يوجد نظام إدارة بيئية رسمي. الامتثال القانوني البيئي يُدار بشكل تفاعلي دون أي برنامج منهجي.',
          'بعض المتطلبات القانونية البيئية تُتابَع بشكل غير رسمي؛ والحوادث تُبلَّغ عند وقوعها لكن دون نظام إدارة بيئية منهجي أو سجل مخاطر أو برنامج تدقيق.',
          'إطار إدارة بيئية قائم بمراقبة امتثال محددة وإجراءات الإبلاغ عن الحوادث وبرنامج تدقيق داخلي؛ وISO 14001 مخطط له أو قيد التطبيق.',
          'نظام إدارة بيئية معتمد وفق ISO 14001 يعمل بصورة فعلية؛ والامتثال القانوني يُراقَب منهجيًا؛ والحوادث تُحقَّق فيها وتُجرى تحليلات سببية؛ ومستهدفات تحسين مستمر تُحدَّد سنويًا.',
          'نظام إدارة بيئية معتمد وفق ISO 14001 مدمج مع إطار إدارة المخاطر الأشمل؛ وأدوات رقمية تؤتمت مراقبة الامتثال؛ وجميع الحوادث البيئية تستدعي تحليلًا رسميًا للسبب الجذري؛ ويُراجَع النظام على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 5-1  Emissions Measurement & Reporting ───────────────────────────── */
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
        q: 'How rigorously do you measure and manage Scope 1 and Scope 2 greenhouse gas emissions — including data completeness, calculation methodology, and internal verification?',
        qAr: 'ما مدى صرامة قياس وإدارة انبعاثات غازات الدفيئة من النطاقين 1 و2 — شاملًا اكتمال البيانات ومنهجية الحساب والتحقق الداخلي؟',
        levels: [
          'Scope 1 and 2 emissions are not measured. GHG emissions from operations are unknown and no calculation methodology has been adopted.',
          'Some Scope 1 data is estimated informally (fuel consumption) but Scope 2 is absent or inconsistent; the GHG Protocol has not been formally adopted.',
          'Scope 1 and 2 GHG inventories are calculated annually using GHG Protocol methodology; data is reviewed internally and disclosed in the annual sustainability report.',
          'Scope 1 and 2 emissions are measured and reported quarterly using certified emission factors; internal verification confirms data quality; reduction initiatives are tracked against the inventory.',
          'Scope 1 and 2 inventories are third-party assured annually; a digital carbon accounting platform provides near-real-time emissions tracking; carbon intensity KPIs are executive scorecard items.',
        ],
        levelsAr: [
          'انبعاثات النطاقين 1 و2 لا تُقاس. انبعاثات غازات الدفيئة من العمليات مجهولة ولا توجد منهجية حساب معتمدة.',
          'بعض بيانات النطاق الأول تُقدَّر بشكل غير رسمي (استهلاك الوقود) لكن النطاق الثاني غائب أو متناقض؛ وبروتوكول غازات الدفيئة لم يُعتمَد رسميًا.',
          'جرود غازات الدفيئة للنطاقين 1 و2 تُحسَب سنويًا باستخدام منهجية بروتوكول GHG؛ وتُراجَع البيانات داخليًا وتُفصَح عنها في تقرير الاستدامة السنوي.',
          'تُقاس وتُبلَّغ انبعاثات النطاقين 1 و2 فصليًا باستخدام عوامل انبعاث معتمدة؛ والتحقق الداخلي يؤكد جودة البيانات؛ ومبادرات الخفض تُتابَع مقابل الجرد.',
          'جرود النطاقين 1 و2 مضمونة من طرف ثالث سنويًا؛ ومنصة محاسبة كربونية رقمية توفر تتبّعًا شبه آني للانبعاثات؛ ومؤشرات كثافة الكربون ضمن بطاقات الأداء التنفيذية.',
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
        q: 'How aligned is your ESG reporting with recognised international frameworks — such as GRI, TCFD, SASB, or IFRS S1/S2 — and how consistent is your year-on-year disclosure?',
        qAr: 'ما مدى مواءَمة تقاريركم البيئية والاجتماعية والحوكمية مع الأطر الدولية المعترف بها — كـ GRI وTCFD وSASB أو IFRS S1/S2 — وما مدى اتساق الإفصاح من عام لآخر؟',
        levels: [
          'No formal ESG reporting framework is used. Environmental and sustainability disclosures are absent or limited to one-off press statements.',
          'Some sustainability information is included in the annual report but there is no alignment to a recognised framework and content is qualitative only.',
          'An ESG report is published annually with reference to GRI standards; key quantitative metrics are disclosed; year-on-year comparability is maintained for major indicators.',
          'ESG reporting aligns to GRI and TCFD; climate-related risks and opportunities are disclosed; performance data is reviewed by an audit committee before publication.',
          'ESG disclosure aligns to IFRS S1/S2 or equivalent; all material sustainability metrics are third-party assured; the report is integrated with the annual report and filed with the relevant regulator (e.g., Saudi CMA).',
        ],
        levelsAr: [
          'لا يُستخدَم إطار تقارير بيئي واجتماعي وحوكمي رسمي. الإفصاحات البيئية والاستدامة غائبة أو تقتصر على بيانات صحفية منفردة.',
          'بعض معلومات الاستدامة مُدرَجة في التقرير السنوي لكن دون مواءَمة مع إطار معترف به والمحتوى نوعي فقط.',
          'تقرير بيئي واجتماعي وحوكمي يُنشَر سنويًا بالإشارة إلى معايير GRI؛ ومقاييس كمية رئيسية مُفصَح عنها؛ وقابلية المقارنة من عام لآخر محفوظة للمؤشرات الكبرى.',
          'تقارير ESG مواءَمة مع GRI وTCFD؛ والمخاطر والفرص المرتبطة بالمناخ مُفصَح عنها؛ وبيانات الأداء تُراجَع من لجنة تدقيق قبل النشر.',
          'إفصاح ESG مواءَم مع IFRS S1/S2 أو ما يعادله؛ وجميع مقاييس الاستدامة الجوهرية مضمونة من طرف ثالث؛ والتقرير مدمج مع التقرير السنوي ومقدَّم للجهة التنظيمية المختصة (كهيئة السوق المالية).',
        ],
      },
    ],
  },

  /* ── 5-2  Social & Labour Standards ──────────────────────────────────── */
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
        q: 'How comprehensively does your organisation monitor and enforce labour standards across its own operations — including working hours, wages, health and safety, and freedom of association?',
        qAr: 'ما مدى شمولية مراقبة مؤسستكم وإنفاذ معايير العمل عبر عملياتها — بما في ذلك ساعات العمل والأجور والصحة والسلامة وحرية تكوين الجمعيات؟',
        levels: [
          'Labour standard compliance is managed reactively and only in response to regulatory inspections. No internal monitoring programme exists.',
          'Basic legal labour compliance is monitored for own operations but coverage is inconsistent; health and safety programmes are limited; no global standard (ILO) is referenced.',
          'A formal labour standards framework aligned to ILO conventions governs own operations; H&S management system (OHSAS 18001 / ISO 45001) is in place; annual audits are conducted.',
          'Labour standards compliance is monitored systematically; ISO 45001 is certified; H&S KPIs (TRIR, LTIR) are tracked monthly and reviewed at executive level; worker welfare surveys are conducted annually.',
          'Best-in-class worker welfare practices; zero-tolerance policy on forced labour and child labour is independently audited; worker voice mechanisms are embedded; H&S outcomes are publicly reported and benchmarked.',
        ],
        levelsAr: [
          'الامتثال لمعايير العمل يُدار بشكل تفاعلي واستجابةً للتفتيش التنظيمي فقط. لا يوجد برنامج رقابة داخلية.',
          'الامتثال القانوني العمالي الأساسي يُراقَب لعمليات المنشأة لكن التغطية غير متسقة؛ وبرامج الصحة والسلامة محدودة؛ ولا يُشار إلى أي معيار دولي (ILO).',
          'إطار رسمي لمعايير العمل مواءَم مع اتفاقيات منظمة العمل الدولية يحكم العمليات الداخلية؛ ونظام إدارة الصحة والسلامة (OHSAS 18001 / ISO 45001) قائم؛ وعمليات تدقيق سنوية تُجرى.',
          'الامتثال لمعايير العمل يُراقَب منهجيًا؛ وISO 45001 معتمد؛ ومؤشرات السلامة (معدل الإصابات الإجمالي والمُفقِدة للوقت) تُتابَع شهريًا وتُراجَع تنفيذيًا؛ واستبيانات رعاية العمال تُجرى سنويًا.',
          'ممارسات رعاية عمالية بمستوى الأفضل في الفئة؛ وسياسة عدم التسامح مع العمل القسري وعمالة الأطفال مضمونة باستقلالية؛ وآليات التعبير عن رأي العمال متجذّرة؛ ونتائج الصحة والسلامة مُبلَّغ عنها علنًا ومُقارَنة معياريًا.',
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
    ],
  },

  /* ── 5-3  Responsible Sourcing (ISO 20400) ───────────────────────────── */
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
    ],
  },

  /* ── 5-4  Circular Economy & Waste Reduction ─────────────────────────── */
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
        q: 'How systematically does your organisation reduce operational waste — measuring waste generation by type, diverting waste from landfill, and embedding waste reduction targets in operational improvement plans?',
        qAr: 'ما مدى منهجية مؤسستكم في تقليص النفايات التشغيلية — بقياس توليد النفايات حسب النوع وتحويل النفايات عن المكبّات ودمج مستهدفات تخفيض النفايات في خطط التحسين التشغيلي؟',
        levels: [
          'Waste is not measured or managed systematically. Disposal is handled by contractors without tracking by type, volume, or cost.',
          'Total waste volumes are tracked at site level for regulatory compliance; segregation by type is inconsistent; no waste reduction targets are set.',
          'Waste is segregated into key streams (general, recyclable, hazardous); diversion rates are tracked; annual waste reduction targets are set and progress reported.',
          'Waste-to-landfill is a tracked KPI with a defined reduction target; circular alternatives (reuse, recycling, recovery) are maximised by category; waste cost is reported to management.',
          'Zero-waste-to-landfill target is set and publicly disclosed; waste streams are digitally tracked in real time; waste cost and diversion rates are board-level sustainability KPIs.',
        ],
        levelsAr: [
          'النفايات لا تُقاس أو تُدار منهجيًا. التخلص منها يتولاه مقاولون دون تتبّع حسب النوع أو الحجم أو التكلفة.',
          'إجمالي أحجام النفايات يُتابَع على مستوى المنشأة للامتثال التنظيمي؛ والفرز حسب النوع غير متسق؛ ولا مستهدفات خفض نفايات محددة.',
          'النفايات مفرزة إلى تدفقات رئيسية (عامة وقابلة لإعادة التدوير وخطرة)؛ ومعدلات التحويل متابَعة؛ ومستهدفات خفض النفايات السنوية محددة والتقدم مُبلَّغ عنه.',
          'النفايات إلى المكبّات مؤشر متابَع بمستهدف خفض محدد؛ والبدائل الدائرية (إعادة الاستخدام وإعادة التدوير والاسترداد) مُعظَّمة حسب الفئة؛ وتكلفة النفايات مُبلَّغ عنها للإدارة.',
          'مستهدف عدم وجود نفايات إلى المكبّات محدد ومُفصَح عنه علنًا؛ وتدفقات النفايات تُتابَع رقميًا آنيًا؛ وتكلفة النفايات ومعدلات التحويل مؤشرات استدامة على مستوى مجلس الإدارة.',
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
    ],
  },

  /* ── 5-5  ESG Governance & Disclosure ────────────────────────────────── */
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
        q: 'How effectively is ESG governance structured at board and executive level — including board oversight of supply chain ESG risks, executive ownership, and ESG-linked executive remuneration?',
        qAr: 'ما مدى فعالية هيكل حوكمة ESG على مستوى مجلس الإدارة والتنفيذيين — شاملًا إشراف مجلس الإدارة على مخاطر ESG لسلسلة الإمداد والملكية التنفيذية والمكافآت التنفيذية المرتبطة بـ ESG؟',
        levels: [
          'ESG has no formal governance structure. Supply chain ESG risks are not discussed at board level and there is no named executive accountable for sustainability.',
          'ESG awareness exists at senior management level but board oversight is absent; no formal governance structure, policies, or executive accountability mechanism is in place.',
          'A named executive (e.g., Chief Sustainability Officer or CPO) owns ESG for the supply chain; an ESG committee or working group meets quarterly; a sustainability policy is approved at executive level.',
          'Board-level oversight of supply chain ESG is formalised through an ESG or audit committee; executive ESG targets are linked to performance reviews; an ESG governance framework is documented and published.',
          'ESG governance is fully integrated with corporate governance; the board ESG committee reviews supply chain sustainability performance quarterly; a material portion of executive remuneration is tied to ESG KPIs; governance disclosed in annual reporting.',
        ],
        levelsAr: [
          'لا يوجد هيكل حوكمة رسمي لـ ESG. مخاطر ESG لسلسلة الإمداد لا تُناقَش على مستوى مجلس الإدارة ولا يوجد مدير تنفيذي مسمّى مسؤول عن الاستدامة.',
          'وعي بـ ESG على مستوى الإدارة العليا لكن إشراف مجلس الإدارة غائب؛ ولا هيكل حوكمة رسمي أو سياسات أو آلية مساءلة تنفيذية قائمة.',
          'مدير تنفيذي مسمّى (كمدير الاستدامة الرئيسي أو CPO) يمتلك ESG لسلسلة الإمداد؛ ولجنة ESG أو مجموعة عمل تجتمع فصليًا؛ وسياسة استدامة معتمدة على المستوى التنفيذي.',
          'الإشراف على مستوى مجلس الإدارة على ESG لسلسلة الإمداد مُضفَى عليه الطابع الرسمي من خلال لجنة ESG أو تدقيق؛ ومستهدفات ESG التنفيذية مرتبطة بمراجعات الأداء؛ وإطار حوكمة ESG موثّق ومنشور.',
          'حوكمة ESG مدمجة كليًا مع حوكمة الشركة؛ ولجنة ESG في مجلس الإدارة تراجع أداء الاستدامة لسلسلة الإمداد فصليًا؛ وجزء جوهري من مكافآت التنفيذيين مرتبط بمؤشرات ESG؛ والحوكمة مُفصَح عنها في التقارير السنوية.',
        ],
      },
      {
        q: 'How comprehensively does your organisation integrate supply chain ESG performance data into stakeholder communication — including investor relations, customer reporting, and regulatory submissions?',
        qAr: 'ما مدى شمولية دمج بيانات أداء ESG لسلسلة الإمداد في تواصل أصحاب المصلحة — شاملًا علاقات المستثمرين وتقارير العملاء والتقديمات التنظيمية؟',
        levels: [
          'Supply chain ESG performance data is not reported externally. Investor and customer ESG questionnaires receive minimal or inconsistent responses.',
          'Some ESG information is provided on request but there is no proactive disclosure, consistent data set, or structured communication programme.',
          'An annual ESG/sustainability report covering key supply chain metrics is published; investor ESG questionnaires (e.g., MSCI, Sustainalytics) are completed annually.',
          'ESG performance data is proactively communicated to investors, customers, and regulators; supply chain ESG metrics are disclosed in the annual report with year-on-year trending.',
          'Best-in-class stakeholder ESG communication: integrated annual report with assured sustainability data; proactive investor ESG engagement; customer supply chain transparency portals; regulatory ESG submissions filed on schedule.',
        ],
        levelsAr: [
          'بيانات أداء ESG لسلسلة الإمداد لا تُبلَّغ عنها خارجيًا. استبيانات ESG للمستثمرين والعملاء تحظى بردود هزيلة أو غير متسقة.',
          'بعض معلومات ESG تُقدَّم عند الطلب لكن لا إفصاح استباقي أو مجموعة بيانات متسقة أو برنامج تواصل منظم.',
          'تقرير بيئي واجتماعي وحوكمي / استدامة سنوي يغطي المقاييس الرئيسية لسلسلة الإمداد يُنشَر؛ واستبيانات ESG للمستثمرين (كـ MSCI وSustainalytics) تُكتمَل سنويًا.',
          'بيانات أداء ESG تُوصَل استباقيًا للمستثمرين والعملاء والجهات التنظيمية؛ ومقاييس ESG لسلسلة الإمداد مُفصَح عنها في التقرير السنوي مع توجّه من عام لآخر.',
          'تواصل ESG مع أصحاب المصلحة بمستوى الأفضل في الفئة: تقرير سنوي متكامل ببيانات استدامة مضمونة؛ وتفاعل استباقي مع المستثمرين على ESG؛ وبوابات شفافية سلسلة الإمداد للعملاء؛ وتقديمات ESG التنظيمية مُقدَّمة في الوقت المحدد.',
        ],
      },
    ],
  },

];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 6 — DIGITAL TRANSFORMATION & TECHNOLOGY  (segIdx 6)
   Sub-segments:
     0 Technology Landscape Assessment
     1 ERP & Data Infrastructure
     2 Supply Chain Visibility & Tracking
     3 Predictive Analytics & AI Adoption
     4 Automation & Process Digitalisation
     5 Cybersecurity & Data Governance
═══════════════════════════════════════════════════════════════════════════ */

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
