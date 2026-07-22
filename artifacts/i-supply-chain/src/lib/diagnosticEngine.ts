export interface DiagnosticReport {
  businessSize: string;
  region: string;
  industry: string;
  focusArea: string;
  challenge?: string;
  executiveSummary: string;
  diagnosis: string[];
  rootCauses: string[];
  recommendations: string[];
  kpis: string[];
  risks: { risk: string; mitigation: string }[];
  roadmap: {
    phase1: { title: string; timeframe: string; actions: string[] };
    phase2: { title: string; timeframe: string; actions: string[] };
    phase3: { title: string; timeframe: string; actions: string[] };
  };
  regionalAlignment?: string;
}

const summaryTemplates: Record<string, string> = {
  Startup: "As an early-stage {industry} organization, your supply chain foundation is at a critical formative stage. Decisions made now regarding procurement structure, supplier selection, and process governance will define your operational DNA for years to come. This diagnostic identifies your most pressing vulnerabilities and provides a prioritized roadmap for building a resilient, scalable supply chain from the ground up.",
  SME: "Your {industry} organization is navigating the critical transition from reactive operations to proactive supply chain management. This diagnostic identifies key structural gaps in your {focusArea} capability and outlines targeted interventions to accelerate maturity without over-engineering for your current scale.",
  "Mid-Market": "As a mid-market {industry} organization, supply chain complexity has outpaced the systems and processes originally designed to manage it. This diagnostic surfaces the structural misalignments in your {focusArea} function and prescribes a staged transformation that delivers near-term efficiency gains while building long-term capability.",
  Enterprise: "Your enterprise-scale {industry} supply chain operates across a complex network of suppliers, geographies, and regulatory environments. This diagnostic examines systemic vulnerabilities in your {focusArea} function and provides a transformation roadmap calibrated to your organizational scale and risk tolerance.",
  "Government Entity": "As a government entity in the {industry} sector, your procurement and supply chain operations must balance operational efficiency with public accountability, compliance requirements, and national development objectives. This diagnostic identifies structural gaps and aligns recommendations with applicable regulatory and policy frameworks."
};

const diagnosisDict: Record<string, string[]> = {
  "Supply Chain Strategy": [
    "Reactive rather than proactive supply chain management, driven by firefighting rather than strategic planning",
    "Insufficient end-to-end visibility across the supply network, creating blind spots in inventory and demand",
    "Misalignment between supply chain capabilities and broader organizational growth strategy",
    "Fragmented decision-making authority with no single owner of supply chain performance"
  ],
  "Procurement": [
    "Decentralized purchasing with limited spend visibility across categories and business units",
    "Over-reliance on incumbent suppliers without periodic competitive benchmarking",
    "Procurement function perceived as an administrative cost center rather than a strategic value driver",
    "Inconsistent contract terms and pricing across similar supplier categories"
  ],
  "CLM": [
    "Contracts stored in disparate systems with no centralized repository or expiry tracking",
    "Manual contract review processes creating bottlenecks and increasing legal risk exposure",
    "Limited post-award contract performance monitoring, leading to value leakage",
    "No standardized contract templates, resulting in inconsistent terms and negotiation inefficiency"
  ],
  "Supplier Governance": [
    "Supplier performance measured sporadically and without standardized KPI frameworks",
    "Overconcentration of spend in single-source suppliers creating supply continuity risk",
    "No formal supplier development or tiering program to optimize the supplier base",
    "Reactive supplier relationship management driven by crises rather than partnership strategy"
  ],
  "Risk Management": [
    "Risk identification is informal and undocumented, with no structured risk register",
    "Limited business continuity planning for critical supply disruptions",
    "Geographic concentration risk in sourcing, particularly relevant post-pandemic",
    "No early warning indicators or supply chain monitoring dashboard in place"
  ],
  "Sustainability": [
    "ESG criteria absent from supplier qualification and evaluation processes",
    "Limited carbon footprint visibility across Scope 3 supply chain emissions",
    "No formal sustainable procurement policy or supplier code of conduct",
    "Reputational and regulatory risk from uninvestigated supply chain labor practices"
  ],
  "Resiliency": [
    "Single-source dependencies in critical material categories with no approved alternates",
    "Inventory buffers and safety stock levels not calibrated to supply chain risk profile",
    "Limited dual-sourcing or regional sourcing strategies to offset global disruption risk",
    "No supply chain stress-testing or scenario planning process"
  ],
  "Digital Transformation": [
    "Core supply chain processes still managed via spreadsheets and email, limiting scalability",
    "Disconnected ERP, procurement, and logistics systems creating data silos",
    "Limited real-time data availability for decision-making in procurement and inventory",
    "Resistance to technology adoption without a clear digital transformation roadmap"
  ],
  "Organizational Design": [
    "Supply chain and procurement functions structurally siloed, limiting strategic integration",
    "Talent gaps in analytical and digital skills within the supply chain team",
    "Role ambiguity between procurement, logistics, and operations functions",
    "No formal capability development or succession planning for supply chain leadership"
  ],
  "Government Compliance": [
    "Incomplete alignment of procurement processes with applicable public procurement regulations",
    "Nationalization (Saudization/Iktva/Jordan Buy) targets not yet integrated into supplier selection criteria",
    "Audit readiness gaps in documentation and approval trail for public procurement",
    "Insufficient familiarity with government contract terms and dispute resolution mechanisms"
  ]
};

const rootCausesDict: Record<string, string[]> = {
  Startup: ["Early-stage resource constraints limiting investment in process infrastructure", "Founder-led procurement decisions without institutional process documentation", "Absence of dedicated supply chain or procurement function", "Reactive growth prioritization over operational foundation-building"],
  SME: ["Operational processes inherited from startup phase not re-engineered for scale", "Limited internal expertise to design and implement structured supply chain frameworks", "Technology investment deferred due to competing growth priorities", "No formal performance measurement system to identify and escalate problems"],
  "Mid-Market": ["Complexity has grown faster than the governance structures designed to manage it", "Patchwork of legacy systems and manual workarounds accumulated over growth years", "Fragmented organizational accountability for end-to-end supply chain performance", "Strategic intent exists but execution roadmaps lack specificity and ownership"],
  Enterprise: ["Organizational complexity and matrix structures slowing decision-making and change", "Technology debt from legacy ERP implementations limiting agility", "Competing functional priorities deprioritizing supply chain transformation investment", "Change management challenges in driving adoption across large, distributed teams"],
  "Government Entity": ["Rigid procurement regulations limiting flexibility and speed of response", "Politically complex supplier ecosystem balancing compliance with national content requirements", "Budget cycle constraints misaligned with supply chain investment timelines", "Limited private-sector expertise in government procurement leadership roles"]
};

const recommendationsDict: Record<string, string[]> = {
  "Supply Chain Strategy": ["Conduct a full supply chain network design review to map current-state flows and identify structural inefficiencies", "Establish a Supply Chain Centre of Excellence (CoE) with clear ownership and executive sponsorship", "Implement a supply chain maturity assessment (SCMM) to benchmark current capability against industry peers", "Build an integrated Sales & Operations Planning (S&OP) process connecting demand signals to supply decisions", "Define and deploy a 3-year supply chain roadmap with measurable milestones and quarterly review cadence"],
  "Procurement": ["Consolidate spend data from all business units into a single procurement analytics platform", "Implement a category management framework prioritizing the top 80% of spend by value", "Establish formal supplier qualification criteria and a pre-approved vendor list", "Introduce competitive tendering thresholds and a documented sourcing decision framework", "Reposition procurement as a strategic function reporting to CFO or COO level"],
  "CLM": ["Deploy a Contract Lifecycle Management (CLM) platform — even a lightweight tool — to centralize all contracts", "Implement automated contract expiry alerts with 90/60/30-day notification workflows", "Standardize contract templates by category with pre-approved legal clause libraries", "Establish quarterly contract performance reviews with key suppliers", "Define contract approval authority matrix and integrate with procurement governance"],
  "Supplier Governance": ["Design and implement a formal Supplier Performance Management (SPM) framework with quarterly scorecards", "Conduct a supplier rationalization exercise to reduce tail spend and consolidate the approved vendor list", "Establish a strategic supplier tiering program (Tier 1/2/3) with differentiated engagement models", "Introduce Supplier Days or quarterly business reviews with strategic partners", "Develop a supplier development program to improve capability in critical supply categories"],
  "Risk Management": ["Build a formal supply chain risk register covering demand, supply, operational, and external risk categories", "Conduct a single-source dependency analysis and implement dual-sourcing for critical items within 6 months", "Develop supply chain business continuity plans (BCP) for top-10 risk scenarios", "Implement basic supply chain monitoring dashboards with leading indicators", "Stress-test the supply chain with tabletop exercises covering disruption scenarios"],
  "Sustainability": ["Develop a Sustainable Procurement Policy and embed ESG criteria into supplier qualification scoring", "Commission a Scope 3 emissions baseline assessment for the top supply chain tiers", "Implement a Supplier Code of Conduct covering labor standards, environmental practices, and anti-corruption", "Set measurable ESG KPIs for the procurement function aligned to organizational sustainability commitments", "Engage top-10 strategic suppliers in joint sustainability improvement programs"],
  "Resiliency": ["Map critical single-source dependencies and initiate dual or multi-source qualification programs immediately", "Review and recalibrate safety stock levels based on supply lead time variability and demand uncertainty", "Develop regional sourcing alternatives for top-10 critical material categories", "Implement supply chain scenario planning as part of the annual strategic planning cycle", "Establish a Supply Chain Risk Committee meeting quarterly to review resilience posture"],
  "Digital Transformation": ["Conduct a digital maturity assessment to establish current-state baseline and prioritize investment areas", "Standardize core supply chain data on a single ERP or digital platform as the foundation for analytics", "Implement supplier portal technology to streamline purchase orders, invoicing, and performance tracking", "Deploy basic supply chain analytics dashboards covering procurement spend, inventory, and on-time delivery", "Develop a phased digital transformation roadmap: data foundation → process automation → advanced analytics"],
  "Organizational Design": ["Conduct an organizational design review to eliminate structural silos between procurement, logistics, and operations", "Define a RACI matrix for supply chain decision rights across functions and business units", "Invest in targeted supply chain talent development — analytics, negotiation, and digital skills", "Establish a Supply Chain leadership forum to align functional priorities and resolve inter-departmental conflicts", "Build a succession plan for critical supply chain roles to reduce key-person dependency"],
  "Government Compliance": ["Conduct a comprehensive procurement compliance audit against applicable public procurement regulations", "Integrate national content (Saudization/IKTVA/local content) requirements into supplier qualification and RFP evaluation criteria", "Implement document management processes to ensure full audit trail for all procurement decisions", "Train procurement team on applicable government procurement law and recent regulatory updates", "Establish a compliance calendar covering tender publication timelines, reporting obligations, and regulatory submissions"]
};

const kpisDict: Record<string, string[]> = {
  "Supply Chain Strategy": ["Perfect Order Rate: Target >95%", "Supply Chain Cost as % of Revenue: Target reduction of 15% over 18 months", "Forecast Accuracy: Target >85%", "Inventory Turns: Benchmark vs. industry median", "Supplier On-Time Delivery: Target >92%", "Supply Chain Maturity Score: Quarterly improvement tracking"],
  "Procurement": ["Procurement Cost Savings: Target 8-12% of addressable spend in Year 1", "Supplier Lead Time: Reduction of 20% within 12 months", "Contract Compliance Rate: Target >90% of purchases under contract", "Purchase Order Cycle Time: Target <3 business days", "Spend Under Management: Target >80% of total spend", "Supplier Quality Defect Rate: Target <2%"],
  "CLM": ["Contract Cycle Time (draft to signature): Target <10 business days", "Contract Renewal Rate: Target >85% of strategic contracts renewed on time", "Contract Value at Risk (expired/non-compliant): Target <5% of portfolio", "Post-Award Compliance Rate: Target >90%", "Savings Captured vs. Contract Terms: Quarterly variance reporting"],
  "Supplier Governance": ["Supplier On-Time Delivery: Target >92%", "Supplier Quality Acceptance Rate: Target >98%", "Supplier Scorecard Completion Rate: Target 100% quarterly", "Single-Source Dependency Ratio: Target reduction to <20% of spend", "Strategic Supplier Satisfaction Score: Annual survey, target >4/5", "Supplier Incident Response Time: Target <24 hours for critical issues"],
  "Risk Management": ["Supply Chain Risk Register Coverage: Target 100% of critical categories", "Business Continuity Plan (BCP) Coverage: Target 100% of Tier 1 risks", "Single-Source Exposure: Target <20% of total spend", "Supply Chain Disruption Recovery Time: Target <72 hours for non-critical, <24 hours for critical", "Risk Mitigation Action Completion Rate: Target >80% on time"],
  "Sustainability": ["Supplier ESG Audit Coverage: Target 100% of Tier 1 suppliers annually", "Scope 3 Emissions Baseline: Established within 12 months", "Sustainable Procurement Spend %: Target 30% of addressable spend within 2 years", "Supplier Code of Conduct Acceptance Rate: Target 100%", "ESG Non-Compliance Incidents: Target zero Tier 1 incidents"],
  "Resiliency": ["Single-Source Dependency Ratio: Target reduction to <20% of critical spend", "Safety Stock Coverage Days: Calibrated to lead time + demand variability", "Alternate Supplier Qualification Rate: Target 2+ approved sources for all critical items", "Supply Disruption Incident Rate: Track and target quarter-on-quarter reduction", "BCP Test Completion Rate: Target 100% of critical scenarios tested annually"],
  "Digital Transformation": ["ERP/System Data Quality Score: Target >95%", "Process Automation Rate: % of manual processes automated, target 40% in Year 1", "Supply Chain Visibility Coverage: % of spend with real-time tracking capability", "Report Generation Time: Reduction from manual to automated, target >70% time saving", "Digital Tool Adoption Rate: % of team actively using new tools, target >80%"],
  "Organizational Design": ["Role Clarity Index (internal survey): Target >80% clarity on supply chain roles", "Cross-Functional SLA Compliance: Target >90%", "Talent Retention Rate: Supply chain team, target >85%", "Training Hours per FTE: Target >40 hours/year", "Supply Chain Leadership Succession Coverage: Target 100% of critical roles"],
  "Government Compliance": ["Procurement Compliance Rate: Target 100% of regulated tenders compliant", "National Content Compliance: Meeting applicable Saudization/IKTVA/local content targets", "Audit Finding Rate: Target <5 findings per annual audit", "Tender Publication Lead Time: 100% compliance with mandatory notice periods", "Documentation Completeness Rate: Target 100% for all procurement decisions"]
};

const risksPool = [
  { risk: "Single point of failure in critical supply", mitigation: "Develop and qualify secondary suppliers within 6 months." },
  { risk: "Poor contract visibility leading to auto-renewals", mitigation: "Implement contract repository with 60-day expiry alerts." },
  { risk: "Misaligned KPIs between departments", mitigation: "Establish shared supply chain scorecards visible to executive team." },
  { risk: "Resistance to new digital tools", mitigation: "Appoint cross-functional champions and phase rollout with robust training." }
];

// ── Arabic (GCC business) content ──────────────────────────────────────────

const summaryTemplatesAr: Record<string, string> = {
  Startup: "بوصفكم منشأة ناشئة في قطاع {industry}، فإن أساس سلسلة الإمداد لديكم يمرّ بمرحلة تكوينية حاسمة. إن القرارات التي تُتَّخذ الآن بشأن هيكل المشتريات واختيار المورّدين وحوكمة العمليات ستحدّد الحمض النووي التشغيلي لمنشأتكم لسنوات مقبلة. يحدّد هذا التشخيص أبرز نقاط الضعف لديكم ويقدّم خارطة طريق مرتّبة حسب الأولوية لبناء سلسلة إمداد مرنة وقابلة للتوسّع من الأساس.",
  SME: "تجتاز منشأتكم في قطاع {industry} مرحلة انتقالية حاسمة من العمليات التفاعلية إلى الإدارة الاستباقية لسلسلة الإمداد. يحدّد هذا التشخيص الفجوات الهيكلية الرئيسية في قدرتكم على {focusArea}، ويرسم تدخّلات مستهدفة لتسريع النضج دون إفراط في التعقيد بالنسبة لحجمكم الحالي.",
  "Mid-Market": "بوصفكم منشأة متوسطة الحجم في قطاع {industry}، فقد تجاوز تعقيد سلسلة الإمداد الأنظمة والعمليات التي صُمِّمت أصلاً لإدارتها. يكشف هذا التشخيص أوجه الاختلال الهيكلي في وظيفة {focusArea} لديكم، ويصف تحوّلاً متدرّجاً يحقّق مكاسب كفاءة قريبة المدى مع بناء القدرات على المدى الطويل.",
  Enterprise: "تعمل سلسلة الإمداد المؤسسية لديكم في قطاع {industry} عبر شبكة معقّدة من المورّدين والمناطق الجغرافية والبيئات التنظيمية. يفحص هذا التشخيص نقاط الضعف المنهجية في وظيفة {focusArea} لديكم، ويقدّم خارطة طريق للتحوّل مُعايَرة وفق حجم منشأتكم ومدى تحمّلها للمخاطر.",
  "Government Entity": "بوصفكم جهة حكومية في قطاع {industry}، يجب أن توازن عمليات المشتريات وسلسلة الإمداد لديكم بين الكفاءة التشغيلية والمساءلة العامة ومتطلبات الامتثال وأهداف التنمية الوطنية. يحدّد هذا التشخيص الفجوات الهيكلية ويوائم التوصيات مع الأطر التنظيمية والسياساتية المعمول بها."
};

const diagnosisDictAr: Record<string, string[]> = {
  "Supply Chain Strategy": [
    "إدارة سلسلة إمداد تفاعلية بدلاً من الاستباقية، تُدار بإطفاء الحرائق بدلاً من التخطيط الاستراتيجي",
    "رؤية غير كافية من طرف إلى طرف عبر شبكة الإمداد، ما يخلق نقاطاً عمياء في المخزون والطلب",
    "عدم مواءمة بين قدرات سلسلة الإمداد واستراتيجية النمو الأوسع للمنشأة",
    "تشتّت صلاحية اتخاذ القرار دون مالك واحد لأداء سلسلة الإمداد"
  ],
  "Procurement": [
    "شراء لامركزي مع رؤية محدودة للإنفاق عبر الفئات ووحدات الأعمال",
    "اعتماد مفرط على المورّدين الحاليين دون مقارنة تنافسية دورية",
    "النظر إلى وظيفة المشتريات كمركز تكلفة إداري بدلاً من محرّك قيمة استراتيجي",
    "عدم اتساق شروط العقود والأسعار عبر فئات مورّدين متشابهة"
  ],
  "CLM": [
    "تخزين العقود في أنظمة متفرّقة دون مستودع مركزي أو تتبّع لتواريخ الانتهاء",
    "عمليات مراجعة عقود يدوية تخلق اختناقات وتزيد من التعرّض للمخاطر القانونية",
    "مراقبة محدودة لأداء العقود بعد الترسية، ما يؤدّي إلى تسرّب القيمة",
    "غياب قوالب عقود موحّدة، ما يؤدّي إلى شروط غير متسقة وعدم كفاءة في التفاوض"
  ],
  "Supplier Governance": [
    "قياس أداء المورّدين بشكل متقطّع ودون أطر موحّدة لمؤشرات الأداء",
    "تركّز مفرط للإنفاق لدى مورّدين وحيدي المصدر ما يخلق مخاطر على استمرارية الإمداد",
    "غياب برنامج رسمي لتطوير المورّدين أو تصنيفهم لتحسين قاعدة المورّدين",
    "إدارة علاقات مورّدين تفاعلية تُدار بالأزمات بدلاً من استراتيجية الشراكة"
  ],
  "Risk Management": [
    "تحديد المخاطر غير رسمي وغير موثّق، دون سجلّ مخاطر منظّم",
    "تخطيط محدود لاستمرارية الأعمال في مواجهة انقطاعات الإمداد الحرجة",
    "مخاطر التركّز الجغرافي في التوريد، وهو أمر بالغ الأهمية بعد الجائحة",
    "غياب مؤشرات إنذار مبكّر أو لوحة مراقبة لسلسلة الإمداد"
  ],
  "Sustainability": [
    "غياب معايير الحوكمة البيئية والاجتماعية والمؤسسية (ESG) عن عمليات تأهيل المورّدين وتقييمهم",
    "رؤية محدودة للبصمة الكربونية عبر انبعاثات النطاق الثالث في سلسلة الإمداد",
    "غياب سياسة رسمية للمشتريات المستدامة أو مدوّنة سلوك للمورّدين",
    "مخاطر تنظيمية وعلى السمعة نتيجة ممارسات عمالية غير مدقّقة في سلسلة الإمداد"
  ],
  "Resiliency": [
    "اعتماد على مصدر وحيد في فئات المواد الحرجة دون بدائل معتمدة",
    "عدم معايرة المخزونات الاحتياطية ومستويات مخزون الأمان وفق ملف مخاطر سلسلة الإمداد",
    "استراتيجيات محدودة للتوريد المزدوج أو الإقليمي لموازنة مخاطر الاضطراب العالمي",
    "غياب عملية اختبار إجهاد أو تخطيط سيناريوهات لسلسلة الإمداد"
  ],
  "Digital Transformation": [
    "إدارة العمليات الأساسية لسلسلة الإمداد عبر جداول البيانات والبريد الإلكتروني، ما يحدّ من القابلية للتوسّع",
    "أنظمة ERP والمشتريات والخدمات اللوجستية غير مترابطة تخلق جزراً معزولة من البيانات",
    "توافر محدود للبيانات الفورية لاتخاذ القرار في المشتريات والمخزون",
    "مقاومة تبنّي التقنية دون خارطة طريق واضحة للتحوّل الرقمي"
  ],
  "Organizational Design": [
    "انفصال هيكلي لوظائف سلسلة الإمداد والمشتريات، ما يحدّ من التكامل الاستراتيجي",
    "فجوات في المواهب التحليلية والرقمية داخل فريق سلسلة الإمداد",
    "غموض في الأدوار بين وظائف المشتريات والخدمات اللوجستية والعمليات",
    "غياب تطوير رسمي للقدرات أو تخطيط للتعاقب في قيادة سلسلة الإمداد"
  ],
  "Government Compliance": [
    "مواءمة غير مكتملة لعمليات المشتريات مع لوائح المشتريات العامة المعمول بها",
    "عدم دمج مستهدفات التوطين (السعودة/اكتفاء/شراء أردني) في معايير اختيار المورّدين بعد",
    "فجوات في جاهزية التدقيق فيما يخصّ التوثيق ومسار الاعتماد للمشتريات العامة",
    "إلمام غير كافٍ بشروط العقود الحكومية وآليات حل النزاعات"
  ]
};

const rootCausesDictAr: Record<string, string[]> = {
  Startup: ["قيود موارد المرحلة المبكّرة تحدّ من الاستثمار في البنية التحتية للعمليات", "قرارات مشتريات يقودها المؤسّسون دون توثيق مؤسسي للعمليات", "غياب وظيفة مخصّصة لسلسلة الإمداد أو المشتريات", "إعطاء الأولوية للنمو التفاعلي على بناء الأساس التشغيلي"],
  SME: ["عمليات تشغيلية موروثة من مرحلة التأسيس لم يُعَد تصميمها للتوسّع", "خبرة داخلية محدودة لتصميم وتنفيذ أطر منظّمة لسلسلة الإمداد", "تأجيل الاستثمار التقني بسبب أولويات النمو المتنافسة", "غياب نظام رسمي لقياس الأداء لتحديد المشكلات وتصعيدها"],
  "Mid-Market": ["نمو التعقيد بوتيرة أسرع من هياكل الحوكمة المصمّمة لإدارته", "خليط من الأنظمة القديمة والحلول اليدوية المؤقتة المتراكمة عبر سنوات النمو", "تشتّت المساءلة المؤسسية عن أداء سلسلة الإمداد من طرف إلى طرف", "وجود نيّة استراتيجية لكن خرائط التنفيذ تفتقر إلى التحديد والملكية"],
  Enterprise: ["التعقيد المؤسسي والهياكل المصفوفية تُبطئ اتخاذ القرار والتغيير", "الدَّين التقني الناتج عن تطبيقات ERP القديمة يحدّ من المرونة", "أولويات وظيفية متنافسة تخفّض أولوية الاستثمار في تحوّل سلسلة الإمداد", "تحدّيات إدارة التغيير في دفع التبنّي عبر فرق كبيرة وموزّعة"],
  "Government Entity": ["لوائح مشتريات صارمة تحدّ من المرونة وسرعة الاستجابة", "منظومة مورّدين معقّدة سياسياً توازن بين الامتثال ومتطلبات المحتوى الوطني", "قيود الدورة الميزانية غير المتوائمة مع جداول الاستثمار في سلسلة الإمداد", "خبرة محدودة من القطاع الخاص في المناصب القيادية للمشتريات الحكومية"]
};

const recommendationsDictAr: Record<string, string[]> = {
  "Supply Chain Strategy": ["إجراء مراجعة كاملة لتصميم شبكة سلسلة الإمداد لرسم التدفّقات في وضعها الحالي وتحديد أوجه القصور الهيكلية", "تأسيس مركز تميّز لسلسلة الإمداد (CoE) بملكية واضحة ورعاية تنفيذية", "تطبيق تقييم لنضج سلسلة الإمداد (SCMM) لمقارنة القدرة الحالية بنظرائكم في القطاع", "بناء عملية متكاملة لتخطيط المبيعات والعمليات (S&OP) تربط إشارات الطلب بقرارات الإمداد", "تحديد وتنفيذ خارطة طريق لسلسلة الإمداد مدّتها 3 سنوات بمعالم قابلة للقياس ووتيرة مراجعة ربع سنوية"],
  "Procurement": ["توحيد بيانات الإنفاق من جميع وحدات الأعمال في منصّة تحليلات مشتريات واحدة", "تطبيق إطار لإدارة الفئات يعطي الأولوية لأعلى 80% من الإنفاق قيمةً", "وضع معايير رسمية لتأهيل المورّدين وقائمة مورّدين معتمدة مسبقاً", "استحداث عتبات للمنافسة التنافسية وإطار موثّق لاتخاذ قرارات التوريد", "إعادة تموضع المشتريات كوظيفة استراتيجية ترفع تقاريرها إلى مستوى المدير المالي أو مدير العمليات"],
  "CLM": ["نشر منصّة لإدارة دورة حياة العقود (CLM) — ولو أداة بسيطة — لمركزة جميع العقود", "تطبيق تنبيهات آلية لانتهاء العقود بمسارات إشعار قبل 90/60/30 يوماً", "توحيد قوالب العقود حسب الفئة مع مكتبات بنود قانونية معتمدة مسبقاً", "إجراء مراجعات ربع سنوية لأداء العقود مع المورّدين الرئيسيين", "تحديد مصفوفة صلاحيات اعتماد العقود ودمجها مع حوكمة المشتريات"],
  "Supplier Governance": ["تصميم وتنفيذ إطار رسمي لإدارة أداء المورّدين (SPM) ببطاقات أداء ربع سنوية", "إجراء عملية ترشيد للمورّدين لخفض الإنفاق الهامشي وتوحيد قائمة المورّدين المعتمدين", "تأسيس برنامج لتصنيف المورّدين الاستراتيجيين (الفئة 1/2/3) بنماذج تعامل متمايزة", "استحداث أيام للمورّدين أو مراجعات أعمال ربع سنوية مع الشركاء الاستراتيجيين", "تطوير برنامج لتنمية المورّدين لتحسين القدرات في فئات الإمداد الحرجة"],
  "Risk Management": ["بناء سجلّ رسمي لمخاطر سلسلة الإمداد يغطّي فئات مخاطر الطلب والإمداد والتشغيل والمخاطر الخارجية", "إجراء تحليل للاعتماد على المصدر الوحيد وتطبيق التوريد المزدوج للأصناف الحرجة خلال 6 أشهر", "تطوير خطط استمرارية أعمال (BCP) لأعلى 10 سيناريوهات مخاطر", "تطبيق لوحات مراقبة أساسية لسلسلة الإمداد بمؤشرات استباقية", "اختبار إجهاد سلسلة الإمداد بتمارين محاكاة تغطّي سيناريوهات الاضطراب"],
  "Sustainability": ["تطوير سياسة للمشتريات المستدامة ودمج معايير ESG في تقييم تأهيل المورّدين", "تكليف بإجراء تقييم لخط أساس انبعاثات النطاق الثالث لأعلى مستويات سلسلة الإمداد", "تطبيق مدوّنة سلوك للمورّدين تغطّي معايير العمل والممارسات البيئية ومكافحة الفساد", "وضع مؤشرات أداء قابلة للقياس لمعايير ESG في وظيفة المشتريات متوائمة مع التزامات الاستدامة المؤسسية", "إشراك أعلى 10 مورّدين استراتيجيين في برامج مشتركة لتحسين الاستدامة"],
  "Resiliency": ["رسم خريطة للاعتمادات الحرجة على مصدر وحيد والبدء فوراً في برامج تأهيل مزدوجة أو متعدّدة المصادر", "مراجعة وإعادة معايرة مستويات مخزون الأمان بناءً على تباين مهلة التوريد وعدم يقين الطلب", "تطوير بدائل توريد إقليمية لأعلى 10 فئات مواد حرجة", "تضمين تخطيط السيناريوهات لسلسلة الإمداد ضمن دورة التخطيط الاستراتيجي السنوية", "تأسيس لجنة لمخاطر سلسلة الإمداد تجتمع ربع سنوياً لمراجعة وضع المرونة"],
  "Digital Transformation": ["إجراء تقييم للنضج الرقمي لتحديد خط الأساس للوضع الحالي وترتيب أولويات مجالات الاستثمار", "توحيد بيانات سلسلة الإمداد الأساسية على منصّة ERP أو منصّة رقمية واحدة كأساس للتحليلات", "تطبيق تقنية بوّابة المورّدين لتبسيط أوامر الشراء والفوترة وتتبّع الأداء", "نشر لوحات تحليلات أساسية لسلسلة الإمداد تغطّي إنفاق المشتريات والمخزون والتسليم في الموعد", "تطوير خارطة طريق متدرّجة للتحوّل الرقمي: أساس البيانات ← أتمتة العمليات ← التحليلات المتقدّمة"],
  "Organizational Design": ["إجراء مراجعة للتصميم المؤسسي لإزالة الانفصال الهيكلي بين المشتريات والخدمات اللوجستية والعمليات", "تحديد مصفوفة RACI لصلاحيات قرارات سلسلة الإمداد عبر الوظائف ووحدات الأعمال", "الاستثمار في تطوير مواهب سلسلة الإمداد المستهدفة — التحليلات والتفاوض والمهارات الرقمية", "تأسيس منتدى قيادي لسلسلة الإمداد لمواءمة الأولويات الوظيفية وحل النزاعات بين الإدارات", "بناء خطة تعاقب للأدوار الحرجة في سلسلة الإمداد لتقليل الاعتماد على الأشخاص الرئيسيين"],
  "Government Compliance": ["إجراء تدقيق شامل لامتثال المشتريات مقابل لوائح المشتريات العامة المعمول بها", "دمج متطلبات المحتوى الوطني (السعودة/اكتفاء/المحتوى المحلي) في معايير تأهيل المورّدين وتقييم كراسات الشروط", "تطبيق عمليات لإدارة الوثائق لضمان مسار تدقيق كامل لجميع قرارات المشتريات", "تدريب فريق المشتريات على قانون المشتريات الحكومية المعمول به وأحدث التحديثات التنظيمية", "إنشاء تقويم للامتثال يغطّي جداول نشر المنافسات والتزامات الإبلاغ والتقديمات التنظيمية"]
};

const kpisDictAr: Record<string, string[]> = {
  "Supply Chain Strategy": ["معدّل الطلب المثالي: المستهدف >95%", "تكلفة سلسلة الإمداد كنسبة من الإيرادات: خفض مستهدف بنسبة 15% خلال 18 شهراً", "دقّة التنبؤ: المستهدف >85%", "معدّل دوران المخزون: مقارنةً بالوسيط القطاعي", "التسليم في الموعد للمورّدين: المستهدف >92%", "درجة نضج سلسلة الإمداد: تتبّع التحسّن ربع السنوي"],
  "Procurement": ["وفورات تكلفة المشتريات: المستهدف 8-12% من الإنفاق القابل للمعالجة في السنة الأولى", "مهلة توريد المورّدين: خفض بنسبة 20% خلال 12 شهراً", "معدّل الالتزام بالعقود: المستهدف >90% من المشتريات ضمن عقود", "زمن دورة أمر الشراء: المستهدف <3 أيام عمل", "الإنفاق الخاضع للإدارة: المستهدف >80% من إجمالي الإنفاق", "معدّل عيوب جودة المورّدين: المستهدف <2%"],
  "CLM": ["زمن دورة العقد (من المسودّة إلى التوقيع): المستهدف <10 أيام عمل", "معدّل تجديد العقود: المستهدف >85% من العقود الاستراتيجية مجدّدة في موعدها", "قيمة العقود المعرّضة للخطر (المنتهية/غير الممتثلة): المستهدف <5% من المحفظة", "معدّل الامتثال بعد الترسية: المستهدف >90%", "الوفورات المحقّقة مقابل شروط العقد: تقرير تباين ربع سنوي"],
  "Supplier Governance": ["التسليم في الموعد للمورّدين: المستهدف >92%", "معدّل قبول جودة المورّدين: المستهدف >98%", "معدّل استكمال بطاقات أداء المورّدين: المستهدف 100% ربع سنوياً", "نسبة الاعتماد على المصدر الوحيد: خفض مستهدف إلى <20% من الإنفاق", "درجة رضا المورّدين الاستراتيجيين: استبيان سنوي، المستهدف >4/5", "زمن الاستجابة لحوادث المورّدين: المستهدف <24 ساعة للمسائل الحرجة"],
  "Risk Management": ["تغطية سجلّ مخاطر سلسلة الإمداد: المستهدف 100% من الفئات الحرجة", "تغطية خطة استمرارية الأعمال (BCP): المستهدف 100% من مخاطر الفئة الأولى", "التعرّض للمصدر الوحيد: المستهدف <20% من إجمالي الإنفاق", "زمن التعافي من اضطراب سلسلة الإمداد: المستهدف <72 ساعة لغير الحرج، <24 ساعة للحرج", "معدّل إنجاز إجراءات تخفيف المخاطر: المستهدف >80% في الموعد"],
  "Sustainability": ["تغطية تدقيق ESG للمورّدين: المستهدف 100% من مورّدي الفئة الأولى سنوياً", "خط أساس انبعاثات النطاق الثالث: يُنشأ خلال 12 شهراً", "نسبة إنفاق المشتريات المستدامة: المستهدف 30% من الإنفاق القابل للمعالجة خلال سنتين", "معدّل قبول مدوّنة سلوك المورّدين: المستهدف 100%", "حوادث عدم الامتثال لمعايير ESG: المستهدف صفر حادث في الفئة الأولى"],
  "Resiliency": ["نسبة الاعتماد على المصدر الوحيد: خفض مستهدف إلى <20% من الإنفاق الحرج", "أيام تغطية مخزون الأمان: مُعايَرة وفق مهلة التوريد + تباين الطلب", "معدّل تأهيل المورّدين البدلاء: المستهدف مصدران معتمدان أو أكثر لجميع الأصناف الحرجة", "معدّل حوادث اضطراب الإمداد: التتبّع واستهداف الخفض من ربع إلى آخر", "معدّل إنجاز اختبارات خطة استمرارية الأعمال: المستهدف اختبار 100% من السيناريوهات الحرجة سنوياً"],
  "Digital Transformation": ["درجة جودة بيانات نظام ERP: المستهدف >95%", "معدّل أتمتة العمليات: نسبة العمليات اليدوية المؤتمتة، المستهدف 40% في السنة الأولى", "تغطية رؤية سلسلة الإمداد: نسبة الإنفاق ذي قدرة التتبّع الفوري", "زمن إنشاء التقارير: خفض من اليدوي إلى المؤتمت، المستهدف توفير >70% من الوقت", "معدّل تبنّي الأدوات الرقمية: نسبة الفريق المستخدم فعلياً للأدوات الجديدة، المستهدف >80%"],
  "Organizational Design": ["مؤشّر وضوح الأدوار (استبيان داخلي): المستهدف >80% وضوح في أدوار سلسلة الإمداد", "الالتزام باتفاقيات مستوى الخدمة بين الوظائف: المستهدف >90%", "معدّل الاحتفاظ بالمواهب: فريق سلسلة الإمداد، المستهدف >85%", "ساعات التدريب لكل موظف بدوام كامل: المستهدف >40 ساعة/سنة", "تغطية التعاقب في قيادة سلسلة الإمداد: المستهدف 100% من الأدوار الحرجة"],
  "Government Compliance": ["معدّل امتثال المشتريات: المستهدف 100% من المنافسات المنظّمة ممتثلة", "الامتثال للمحتوى الوطني: تحقيق مستهدفات السعودة/اكتفاء/المحتوى المحلي المعمول بها", "معدّل ملاحظات التدقيق: المستهدف <5 ملاحظات لكل تدقيق سنوي", "مهلة نشر المنافسات: امتثال 100% لفترات الإشعار الإلزامية", "معدّل اكتمال التوثيق: المستهدف 100% لجميع قرارات المشتريات"]
};

const risksPoolAr = [
  { risk: "نقطة فشل واحدة في الإمداد الحرج", mitigation: "تطوير وتأهيل مورّدين ثانويين خلال 6 أشهر." },
  { risk: "ضعف رؤية العقود يؤدّي إلى تجديدات تلقائية", mitigation: "تطبيق مستودع عقود بتنبيهات انتهاء قبل 60 يوماً." },
  { risk: "عدم مواءمة مؤشرات الأداء بين الإدارات", mitigation: "تأسيس بطاقات أداء مشتركة لسلسلة الإمداد مرئية للفريق التنفيذي." },
  { risk: "مقاومة الأدوات الرقمية الجديدة", mitigation: "تعيين قادة تغيير بين الوظائف والتنفيذ التدريجي مع تدريب متين." }
];

const roadmapsAr: Record<string, DiagnosticReport['roadmap']> = {
  default: {
    phase1: { title: "المرحلة 1: المكاسب السريعة والتقييم", timeframe: "0-3 أشهر", actions: ["إجراء تحليل للإنفاق عبر جميع الفئات", "تحديد ومعالجة أعلى 3 مجالات مخاطر في المشتريات", "توحيد عملية أوامر الشراء والاعتماد"] },
    phase2: { title: "المرحلة 2: التحسين الهيكلي", timeframe: "3-12 شهراً", actions: ["تطبيق إدارة الفئات عبر أعلى فئات الإنفاق", "إطلاق بطاقات أداء رسمية للمورّدين", "وضع سياسة للمشتريات ومصفوفة صلاحيات الاعتماد"] },
    phase3: { title: "المرحلة 3: التحوّل الاستراتيجي", timeframe: "12-24 شهراً", actions: ["دمج المشتريات في دورة التخطيط الاستراتيجي", "تطبيق وحدة المشتريات في نظام ERP", "إطلاق برنامج شراكة استراتيجية مع المورّدين"] }
  },
  Startup: {
    phase1: { title: "المرحلة 1: إرساء الأسس", timeframe: "0-3 أشهر", actions: ["توثيق عملية المشتريات الحالية من طرف إلى طرف", "استقطاب 3-5 مورّدين استراتيجيين واعتمادهم باتفاقيات رسمية", "تطبيق مكتبة قوالب عقود أساسية", "إنشاء آلية لتتبّع الإنفاق"] },
    phase2: { title: "المرحلة 2: بناء القدرة الأساسية", timeframe: "3-9 أشهر", actions: ["تطبيق نظام مشتريات خفيف أو وحدة ERP سحابية", "إطلاق تتبّع أداء المورّدين (مراجعات شهرية)", "تطوير قائمة تحقّق لتأهيل المورّدين", "استحداث إدارة الفئات لأعلى 3 فئات إنفاق"] },
    phase3: { title: "المرحلة 3: التوسّع والتحسين", timeframe: "9-18 شهراً", actions: ["تطبيق نظام كامل لإدارة دورة حياة العقود (CLM)", "التوسّع إلى عملية رسمية لتخطيط المبيعات والعمليات (S&OP)", "نشر لوحة تحليلات لسلسلة الإمداد", "السعي للحصول على شهادة في سلسلة الإمداد أو تعاقد استشاري خارجي"] }
  },
  Enterprise: {
    phase1: { title: "المرحلة 1: التعبئة والتقييم", timeframe: "0-6 أشهر", actions: ["تشكيل مكتب لتحوّل سلسلة الإمداد برعاية تنفيذية", "إجراء تشخيص ومقارنة مرجعية لسلسلة الإمداد على مستوى المنشأة", "تحديد أعلى 10 فرص لخلق القيمة مع دراسة جدوى", "وضع مؤشرات خط أساس وإطار للقياس"] },
    phase2: { title: "المرحلة 2: تحويل العمليات الأساسية", timeframe: "6-24 شهراً", actions: ["نشر منصّة مؤسسية للمشتريات وإدارة العقود (CLM)", "تطبيق إدارة فئات عالمية وبرنامج توريد استراتيجي", "إطلاق برنامج ترشيد المورّدين والشراكة الاستراتيجية", "بناء عملية S&OP متكاملة بتمكين رقمي"] },
    phase3: { title: "المرحلة 3: الاستدامة والتوسّع", timeframe: "24-48 شهراً", actions: ["ترسيخ الذكاء الاصطناعي والتحليلات المتقدّمة عبر قرارات سلسلة الإمداد", "تحقيق معايير نضج رائدة في القطاع لجميع العمليات الأساسية", "ترسيخ سلسلة الإمداد كمصدر قابل للقياس للميزة التنافسية", "بناء ثقافة تحسين مستمرّ عبر مركز تميّز داخلي"] }
  },
  "Government Entity": {
    phase1: { title: "المرحلة 1: الامتثال والتقييم", timeframe: "0-3 أشهر", actions: ["إجراء تدقيق لامتثال المشتريات وتحليل الفجوات", "رسم العمليات الحالية مقابل المتطلبات التنظيمية المعمول بها", "تحديد ومعالجة أي فجوات امتثال حرجة فوراً", "وضع معايير لتوثيق المشتريات ومسار التدقيق"] },
    phase2: { title: "المرحلة 2: الحوكمة والكفاءة", timeframe: "3-18 شهراً", actions: ["تطبيق نظام مشتريات إلكتروني متوائم مع المعايير الحكومية", "دمج متطلبات المحتوى الوطني في جميع كراسات الشروط وعمليات التقييم", "إطلاق إطار حوكمة للمورّدين بمؤشرات أداء خاصة بالقطاع الحكومي", "تطوير قدرة فريق المشتريات في قانون المشتريات بالقطاع العام"] },
    phase3: { title: "المرحلة 3: القيمة الاستراتيجية والمواءمة مع رؤية 2030", timeframe: "18-36 شهراً", actions: ["مواءمة استراتيجية المشتريات مع أهداف خطة التنمية الوطنية", "تطبيق التوريد الاستراتيجي لفئات الأولوية الحكومية", "بناء برنامج لتنمية المورّدين يدعم البطولات الوطنية", "تموضع وظيفة المشتريات كممكّن للأهداف الاقتصادية الوطنية"] }
  },
  "Mid-Market": {
    phase1: { title: "المرحلة 1: التشخيص والمكاسب السريعة", timeframe: "0-6 أشهر", actions: ["تكليف بتقييم لسلسلة الإمداد بين الوظائف", "تطبيق مبادرات خفض تكلفة سريعة تستهدف وفورات 5%", "تأسيس هيكل حوكمة لسلسلة الإمداد ومصفوفة RACI", "توحيد قياس أداء المورّدين"] },
    phase2: { title: "المرحلة 2: التحوّل الأساسي", timeframe: "6-18 شهراً", actions: ["نشر منصّة متكاملة للمشتريات وإدارة العقود (CLM)", "تطبيق إدارة فئات كاملة عبر جميع فئات الإنفاق", "إطلاق برنامج لتنمية مورّدي الفئة الأولى", "بناء قدرة على تحليلات سلسلة الإمداد والتقارير"] },
    phase3: { title: "المرحلة 3: القدرة المتقدّمة", timeframe: "18-36 شهراً", actions: ["تطبيق تحليلات تنبّؤية لتخطيط الطلب والإمداد", "تحقيق معالم التحوّل الرقمي لسلسلة الإمداد", "تطوير نموذج مركز تميّز لبناء القدرات المستمرّ", "تموضع سلسلة الإمداد كعامل تمايز تنافسي قابل للقياس"] }
  }
};

const regionalAlignmentAr: Record<string, string> = {
  "Saudi Arabia": "يُوضع هذا التقييم في سياق أجندة التحوّل الاقتصادي لرؤية 2030 في المملكة العربية السعودية. وتشمل أبرز الانعكاسات على وظيفة سلسلة الإمداد والمشتريات لديكم: المواءمة مع متطلبات توطين القوى العاملة (نطاقات) في أدوار المشتريات والخدمات اللوجستية؛ والامتثال لمتطلبات المحتوى المحلي (اكتفاء) لسلاسل الإمداد الحكومية وقطاع الطاقة؛ وفرصة الاستفادة من منظومة تطوير سلسلة الإمداد لصندوق الاستثمارات العامة (PIF)؛ والمواءمة مع التزامات الاستدامة ضمن مبادرة السعودية الخضراء. وينبغي هيكلة عمليات المشتريات بما يتوافق مع منصّتي «اعتماد» والحوسبة الحكومية حيثما ينطبق.",
  "Jordan": "يُوضع هذا التقييم في سياق رؤية التحديث الاقتصادي (EMV) في الأردن والأطر التنظيمية المعمول بها. وتشمل أبرز الانعكاسات: المواءمة مع سياسة «اشترِ الأردني» ومتطلبات المحتوى المحلي في المشتريات الحكومية؛ والامتثال لقانون المشتريات العامة الأردني ومتطلبات دائرة العطاءات؛ وفرصة الاستفادة من الموقع الاستراتيجي للأردن كمركز إقليمي للخدمات اللوجستية والتصنيع (منطقة العقبة الاقتصادية الخاصة)؛ والتكامل مع أجندة الاقتصاد الرقمي الوطنية.",
  "Other GCC": "يُوضع هذا التقييم في سياق أجندة التنويع الاقتصادي الجماعية لدول الخليج والأطر الوطنية المعمول بها (الإمارات: عملية 300 مليار / السياسة الوطنية للمشتريات؛ قطر: رؤية 2030 / توطين؛ الكويت: رؤية الكويت الجديدة 2035؛ البحرين: رؤية البحرين الاقتصادية 2030؛ عُمان: رؤية عُمان 2040). وتشمل أبرز الانعكاسات: المواءمة مع متطلبات المحتوى الوطني والتوطين (التوطين/التقطير/التعمين)؛ والامتثال للوائح المشتريات الحكومية المعمول بها؛ وفرصة الاستفادة من مناطق التجارة الحرة الخليجية وشبكات الخدمات اللوجستية الإقليمية."
};

export function generateReport(params: {
  businessSize: string;
  region: string;
  industry: string;
  focusArea: string;
  challenge?: string;
}, lang: 'en' | 'ar' = 'en'): DiagnosticReport {

  const ar = lang === 'ar';

  const summaryTpl = ar
    ? (summaryTemplatesAr[params.businessSize] || summaryTemplatesAr["SME"])
    : (summaryTemplates[params.businessSize] || summaryTemplates["SME"]);
  const industryAr: Record<string, string> = {
    'Manufacturing': 'التصنيع', 'Marine': 'القطاع البحري', 'Retail': 'التجزئة', 'FMCG': 'السلع الاستهلاكية سريعة التداول',
    'Pharma': 'الأدوية', 'Logistics': 'الخدمات اللوجستية', 'Energy': 'الطاقة', 'Construction': 'الإنشاءات',
    'Tech': 'التقنية', 'Government': 'القطاع الحكومي', 'Ecommerce': 'التجارة الإلكترونية',
    'Food & Beverage': 'الأغذية والمشروبات', 'Healthcare': 'الرعاية الصحية',
  };
  const focusAreaAr: Record<string, string> = {
    'Supply Chain Strategy': 'استراتيجية سلسلة الإمداد', 'Procurement': 'المشتريات', 'CLM': 'إدارة دورة حياة العقود',
    'Supplier Governance': 'حوكمة المورّدين', 'Risk Management': 'إدارة المخاطر', 'Sustainability': 'الاستدامة',
    'Resiliency': 'المرونة التشغيلية', 'Digital Transformation': 'التحول الرقمي',
    'Organizational Design': 'التصميم المؤسسي', 'Government Compliance': 'الامتثال الحكومي',
  };
  const executiveSummary = summaryTpl
    .replace('{industry}', ar ? (industryAr[params.industry] || params.industry) : params.industry)
    .replace('{focusArea}', ar ? (focusAreaAr[params.focusArea] || params.focusArea) : params.focusArea);

  const diagnosis = ar
    ? (diagnosisDictAr[params.focusArea] || diagnosisDictAr["Supply Chain Strategy"])
    : (diagnosisDict[params.focusArea] || diagnosisDict["Supply Chain Strategy"]);
  const rootCauses = ar
    ? (rootCausesDictAr[params.businessSize] || rootCausesDictAr["SME"])
    : (rootCausesDict[params.businessSize] || rootCausesDict["SME"]);
  const recommendations = ar
    ? (recommendationsDictAr[params.focusArea] || recommendationsDictAr["Supply Chain Strategy"])
    : (recommendationsDict[params.focusArea] || recommendationsDict["Supply Chain Strategy"]);
  const kpis = ar
    ? (kpisDictAr[params.focusArea] || kpisDictAr["Supply Chain Strategy"])
    : (kpisDict[params.focusArea] || kpisDict["Supply Chain Strategy"]);

  const risks = (ar ? risksPoolAr : risksPool).slice(0, 3); // Just pick 3 generic risks for now

  if (ar) {
    const roadmap = roadmapsAr[params.businessSize] || roadmapsAr.default;
    const regionalAlignment = regionalAlignmentAr[params.region];
    return {
      ...params,
      executiveSummary,
      diagnosis,
      rootCauses,
      recommendations,
      kpis,
      risks,
      roadmap,
      regionalAlignment,
    };
  }

  let roadmap = {
    phase1: { title: "Phase 1: Quick Wins & Assessment", timeframe: "0-3 months", actions: ["Conduct spend analysis across all categories", "Identify and address top 3 procurement risk areas", "Standardize purchase order and approval process"] },
    phase2: { title: "Phase 2: Structural Improvement", timeframe: "3-12 months", actions: ["Implement category management across top spend categories", "Launch formal supplier performance scorecards", "Establish procurement policy and approval authority matrix"] },
    phase3: { title: "Phase 3: Strategic Transformation", timeframe: "12-24 months", actions: ["Integrate procurement into strategic planning cycle", "Implement ERP procurement module", "Launch strategic supplier partnership program"] }
  };

  if (params.businessSize === 'Startup') {
    roadmap = {
      phase1: { title: "Phase 1: Establish Foundations", timeframe: "0-3 months", actions: ["Document current procurement process end-to-end", "Select and onboard 3-5 strategic suppliers with formal agreements", "Implement basic contract template library", "Establish a spend tracking mechanism"] },
      phase2: { title: "Phase 2: Build Core Capability", timeframe: "3-9 months", actions: ["Implement lightweight procurement system or cloud ERP module", "Launch supplier performance tracking (monthly reviews)", "Develop supplier qualification checklist", "Introduce category management for top 3 spend categories"] },
      phase3: { title: "Phase 3: Scale and Optimize", timeframe: "9-18 months", actions: ["Implement full CLM system", "Expand to formal S&OP process", "Deploy supply chain analytics dashboard", "Pursue supply chain certification or external advisory engagement"] }
    };
  } else if (params.businessSize === 'Enterprise') {
    roadmap = {
      phase1: { title: "Phase 1: Mobilize & Assess", timeframe: "0-6 months", actions: ["Form Supply Chain Transformation Office with executive sponsorship", "Conduct enterprise-wide supply chain diagnostic and benchmarking", "Identify top-10 value creation opportunities with business case", "Establish baseline metrics and measurement framework"] },
      phase2: { title: "Phase 2: Transform Core Processes", timeframe: "6-24 months", actions: ["Deploy enterprise CLM and procurement platform", "Implement global category management and strategic sourcing program", "Launch supplier rationalization and strategic partnership program", "Build integrated S&OP process with digital enablement"] },
      phase3: { title: "Phase 3: Sustain & Scale", timeframe: "24-48 months", actions: ["Embed AI and advanced analytics across supply chain decision-making", "Achieve industry-leading maturity benchmarks in all core processes", "Establish supply chain as a measurable source of competitive advantage", "Build continuous improvement culture with internal Center of Excellence"] }
    };
  } else if (params.businessSize === 'Government Entity') {
    roadmap = {
      phase1: { title: "Phase 1: Compliance & Assessment", timeframe: "0-3 months", actions: ["Conduct procurement compliance audit and gap analysis", "Map current processes against applicable regulatory requirements", "Identify and remediate any critical compliance gaps immediately", "Establish procurement documentation and audit trail standards"] },
      phase2: { title: "Phase 2: Governance & Efficiency", timeframe: "3-18 months", actions: ["Implement e-procurement system aligned with government standards", "Integrate national content requirements into all RFP and evaluation processes", "Launch supplier governance framework with government-specific KPIs", "Develop procurement team capability in public sector procurement law"] },
      phase3: { title: "Phase 3: Strategic Value & Vision 2030 Alignment", timeframe: "18-36 months", actions: ["Align procurement strategy with national development plan objectives", "Implement strategic sourcing for government priority categories", "Build supplier development program supporting national champions", "Position procurement function as enabler of national economic objectives"] }
    };
  } else if (params.businessSize === 'Mid-Market') {
    roadmap = {
      phase1: { title: "Phase 1: Diagnostic & Quick Wins", timeframe: "0-6 months", actions: ["Commission cross-functional supply chain assessment", "Implement quick-win cost reduction initiatives targeting 5% savings", "Establish supply chain governance structure and RACI", "Standardize supplier performance measurement"] },
      phase2: { title: "Phase 2: Core Transformation", timeframe: "6-18 months", actions: ["Deploy integrated procurement and CLM platform", "Implement full category management across all spend categories", "Launch supplier development program for Tier 1 suppliers", "Build supply chain analytics and reporting capability"] },
      phase3: { title: "Phase 3: Advanced Capability", timeframe: "18-36 months", actions: ["Implement predictive analytics for demand and supply planning", "Achieve supply chain digital transformation milestones", "Develop center-of-excellence model for ongoing capability building", "Position supply chain as measurable competitive differentiator"] }
    };
  }

  let regionalAlignment = undefined;
  if (params.region === 'Saudi Arabia') {
    regionalAlignment = "This assessment is contextualized within Saudi Arabia's Vision 2030 economic transformation agenda. Key implications for your supply chain and procurement function include: alignment with Saudization (Nitaqat) workforce localization requirements in procurement and logistics roles; compliance with IKTVA (In-Kingdom Total Value Add) local content mandates for government and energy sector supply chains; opportunity to leverage the Public Investment Fund (PIF) supply chain development ecosystem; and alignment with Saudi Green Initiative sustainability commitments. Procurement processes should be structured for G-Cloud and ETIMAD compliance where applicable.";
  } else if (params.region === 'Jordan') {
    regionalAlignment = "This assessment is contextualized within Jordan's Economic Modernization Vision (EMV) and applicable regulatory frameworks. Key implications include: alignment with Buy Jordan policy and local content requirements in government procurement; compliance with Jordan's Public Procurement Law and Tender Directorate requirements; opportunity to leverage Jordan's strategic position as a regional logistics and manufacturing hub (JAFZA, Aqaba SEZ); and integration with Jordan's national Digital Economy agenda.";
  } else if (params.region === 'Other GCC') {
    regionalAlignment = "This assessment is contextualized within the GCC's collective economic diversification agenda and applicable national frameworks (UAE: Operation 300bn / National Procurement Policy; Qatar: National Vision 2030 / TAWTEEN; Kuwait: New Kuwait Vision 2035; Bahrain: Bahrain Economic Vision 2030; Oman: Oman Vision 2040). Key implications include: alignment with national content and Emiratization/Qatarization/Omanization requirements; compliance with applicable government procurement regulations; and opportunity to leverage GCC free trade zones and regional logistics networks.";
  }

  return {
    ...params,
    executiveSummary,
    diagnosis,
    rootCauses,
    recommendations,
    kpis,
    risks,
    roadmap,
    regionalAlignment
  };
}
