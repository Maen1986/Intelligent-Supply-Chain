import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Factory, Zap, Building2, Pill, ShoppingCart, Truck, Anchor, HardHat, Heart, Cpu,
  AlertTriangle, CheckCircle, ChevronRight, ArrowRight, BookOpen,
  ArrowUpCircle, CircleDot, ArrowDownCircle,
} from 'lucide-react';

interface Stream {
  type: 'upstream' | 'midstream' | 'downstream';
  name: string;
  nameAr: string;
  color: string;
  standards: string[];
  processes: string[];
  processesAr: string[];
  flow: string[];
  flowAr: string[];
  challenges: string[];
  challengesAr: string[];
  solution: string;
  solutionAr: string;
}

interface IndustryInfo {
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  intro: string;
  introAr: string;
  icon: React.ElementType;
  heroColor: string;
  streams: Stream[];
  cases: { client: string; challenge: string; result: string; clientAr: string; challengeAr: string; resultAr: string }[];
}

const STREAM_LABELS = {
  upstream: { label: 'UPSTREAM', labelAr: 'المنبع', icon: ArrowUpCircle, bg: '#082C6B', desc: 'Sourcing, Procurement & Supplier Management', descAr: 'التوريد والمشتريات وإدارة الموردين' },
  midstream: { label: 'MIDSTREAM', labelAr: 'الوسط', icon: CircleDot, bg: '#0B3D91', desc: 'Operations, Planning & Internal Processes', descAr: 'العمليات والتخطيط والعمليات الداخلية' },
  downstream: { label: 'DOWNSTREAM', labelAr: 'المصب', icon: ArrowDownCircle, bg: '#C9A84C', desc: 'Distribution, Delivery & Customer Fulfilment', descAr: 'التوزيع والتسليم وتلبية طلبات العملاء' },
};

const industryData: Record<string, IndustryInfo> = {

  manufacturing: {
    name: "Manufacturing",
    nameAr: "التصنيع",
    tagline: "Building the industrial backbone of Saudi Vision 2030",
    taglineAr: "بناء العمود الفقري الصناعي لرؤية السعودية 2030",
    intro: "Saudi Arabia's manufacturing sector is undergoing a historic transformation under Vision 2030, with the National Industrial Development and Logistics Programme (NIDLP) targeting a tripling of GDP contribution. CIPS Global Standard, APICS SCOR Model, and ISO 9001:2015 provide the professional framework to manage the complexity of raw-material procurement, Iktva localisation mandates, and lean production across FMCG, steel, chemicals, and automotive manufacturing sub-sectors.",
    introAr: "يشهد قطاع التصنيع في المملكة العربية السعودية تحولاً تاريخيًا في ظل رؤية 2030، مع استهداف البرنامج الوطني لتطوير الصناعة والخدمات اللوجستية (NIDLP) مضاعفة مساهمة الناتج المحلي الإجمالي ثلاث مرات. توفر معايير CIPS العالمية ونموذج APICS SCOR ومعيار ISO 9001:2015 الإطار المهني لإدارة تعقيد شراء المواد الخام ومتطلبات التوطين (اكتفاء) والإنتاج الرشيق عبر قطاعات السلع الاستهلاكية سريعة الحركة والصلب والكيماويات والسيارات.",
    icon: Factory,
    heroColor: "#1a4fa8",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Sourcing, Procurement & Supplier Management",
        nameAr: "المنبع — التوريد والمشتريات وإدارة الموردين",
        color: "#082C6B",
        standards: ["CIPS Category Management Standard", "CPSM Module 1: Supporting Organisational Goals", "APICS SCOR Source Domain (S1–S3)", "ISO 20400:2017 Sustainable Procurement", "Saudi NCAR Procurement Competition Law"],
        processes: [
          "Spend analysis & category strategy development (CIPS Category Cube)",
          "Strategic sourcing: RFI, RFQ, RFP & e-auctions aligned to CIPS 5-Rights framework",
          "Supplier pre-qualification, AVL management & Iktva localisation scoring",
          "TCO modelling & should-cost analysis (ISM CPSM Negotiation Module)",
          "Contract formation, award & SLA establishment (IACCM best-practice clauses)",
          "Supplier relationship management (SRM) — segmentation & joint improvement plans",
        ],
        processesAr: [
          "تحليل الإنفاق وتطوير استراتيجية الفئات (مكعب فئات CIPS)",
          "التوريد الاستراتيجي: طلبات المعلومات والأسعار والعروض والمزادات الإلكترونية بمواءمة إطار الحقوق الخمسة من CIPS",
          "التأهيل المسبق للموردين وإدارة قوائم الموردين المعتمدين وتقييم التوطين (اكتفاء)",
          "نمذجة التكلفة الإجمالية للملكية وتحليل التكلفة المتوقعة (وحدة التفاوض CPSM من ISM)",
          "تكوين العقود والترسية وإرساء اتفاقيات مستوى الخدمة (بنود أفضل الممارسات من IACCM)",
          "إدارة علاقات الموردين — التقسيم وخطط التحسين المشتركة",
        ],
        flow: ["Spend Analysis", "Category Strategy", "RFx & Sourcing", "Evaluation & Award", "Contract & SRM"],
        flowAr: ["تحليل الإنفاق", "استراتيجية الفئات", "طلبات العروض والتوريد", "التقييم والترسية", "العقد وإدارة الموردين"],
        challenges: [
          "Single-source dependencies on European/Asian raw-material suppliers expose manufacturers to SCOR risk tier R1 (supply disruption) — CIPS Risk Management Standard recommends dual-source strategies with a maximum 70:30 split for critical categories.",
          "Iktva localisation mandates (NIDLP requiring progressive local content increases) demand a structured supplier development programme most manufacturers lack — CIPS Supplier Development Model Level 3 is the applicable framework.",
          "Commodity price volatility (steel +40%, aluminium +35% in recent cycles) makes fixed-price contracting unsustainable — CPSM Module 2 covers price adjustment mechanisms including CPI-linked formulae and index-based contract provisions.",
        ],
        challengesAr: [
          "يُعرّض الاعتماد على مصدر وحيد من موردي المواد الخام الأوروبيين/الآسيويين المصنّعين لمستوى مخاطر SCOR من الفئة R1 (اضطراب التوريد) — يوصي معيار إدارة المخاطر من CIPS باستراتيجيات توريد مزدوج بنسبة تقسيم قصوى 70:30 للفئات الحرجة.",
          "تتطلب متطلبات التوطين (اكتفاء) التي يفرضها NIDLP بزيادة المحتوى المحلي تدريجيًا برنامج تطوير موردين منظمًا يفتقر إليه معظم المصنّعين — نموذج تطوير الموردين من CIPS المستوى الثالث هو الإطار المطبَّق.",
          "يجعل تقلب أسعار السلع (الصلب +40%، الألمنيوم +35% في الدورات الأخيرة) التعاقد بسعر ثابت غير مستدام — تغطي وحدة CPSM الثانية آليات تعديل الأسعار بما في ذلك الصيغ المرتبطة بمؤشر أسعار المستهلك والأحكام التعاقدية القائمة على المؤشرات.",
        ],
        solution: "ISC applies the CIPS Category Management 7-Step Model and CPSM strategic sourcing methodology to design dual-source strategies, Iktva supplier development programmes, and index-linked contract frameworks — typically delivering 15–25% total cost reduction whilst achieving full localisation compliance.",
        solutionAr: "تطبّق ISC نموذج إدارة الفئات المكوّن من 7 خطوات من CIPS ومنهجية التوريد الاستراتيجي CPSM لتصميم استراتيجيات توريد مزدوج وبرامج تطوير موردين للتوطين (اكتفاء) وأطر عقود مرتبطة بالمؤشرات — محققةً عادةً خفضًا في التكلفة الإجمالية بنسبة 15–25% مع تحقيق امتثال كامل للتوطين.",
      },
      {
        type: 'midstream',
        name: "Midstream — Operations, Planning & Quality Management",
        nameAr: "الوسط — العمليات والتخطيط وإدارة الجودة",
        color: "#0B3D91",
        standards: ["APICS CPIM Module 3: Managing Inventory", "APICS CPIM Module 4: Strategic Management of Resources", "APICS SCOR Make Domain (M1–M3)", "ISO 9001:2015 Quality Management Systems", "APICS S&OP Best Practices"],
        processes: [
          "Demand planning & Master Production Schedule (MPS) development",
          "Material Requirements Planning (MRP) — APICS CPIM Planning & Control",
          "Inventory optimisation: ABC/XYZ classification & safety-stock modelling",
          "MRO management: criticality classification, min-max policies & consignment",
          "Production quality gates: in-process inspection aligned to ISO 9001 Clause 8.5",
          "Capacity planning & constraint management (Theory of Constraints — Goldratt)",
        ],
        processesAr: [
          "تخطيط الطلب وتطوير جدول الإنتاج الرئيسي (MPS)",
          "تخطيط احتياجات المواد (MRP) — التخطيط والتحكم من APICS CPIM",
          "تحسين المخزون: تصنيف ABC/XYZ ونمذجة مخزون الأمان",
          "إدارة قطع الغيار والصيانة والتشغيل: تصنيف الأهمية وسياسات الحد الأدنى والأقصى والبيع بالأمانة",
          "بوابات جودة الإنتاج: الفحص أثناء العملية بمواءمة البند 8.5 من ISO 9001",
          "تخطيط الطاقة وإدارة القيود (نظرية القيود — غولدرات)",
        ],
        flow: ["Demand Forecast", "MPS / MRP Run", "Work Orders", "Production & QC", "Stock Receipt"],
        flowAr: ["توقّع الطلب", "تشغيل MPS / MRP", "أوامر العمل", "الإنتاج ومراقبة الجودة", "استلام المخزون"],
        challenges: [
          "Expedited purchasing averaging 25–40% of all POs signals a broken S&OP process — APICS recommends a consensus-driven demand review cycle with a 12-week rolling horizon to eliminate reactive procurement.",
          "MRO storerooms with 30–40% slow-moving or obsolete stock (a common GCC benchmark finding) indicate absence of ABC criticality classification — APICS CPIM Module 3 provides the VED/ABC/XYZ framework for rationalisation.",
          "Production downtime caused by quality escapes not detected at incoming inspection costs SAR 50K–500K per hour — ISO 9001:2015 Clause 8.4 (Control of Externally Provided Processes) requires supplier-specific quality plans and incoming inspection criteria.",
        ],
        challengesAr: [
          "الشراء العاجل الذي يبلغ متوسطه 25–40% من جميع أوامر الشراء يشير إلى خلل في عملية تخطيط المبيعات والعمليات — يوصي APICS بدورة مراجعة طلب قائمة على التوافق بأفق متجدد مدته 12 أسبوعًا للقضاء على الشراء التفاعلي.",
          "مخازن قطع الغيار والصيانة التي بها 30–40% مخزون بطيء الحركة أو متقادم (نتيجة معيارية شائعة في دول الخليج) تشير إلى غياب تصنيف الأهمية ABC — توفر وحدة APICS CPIM الثالثة إطار VED/ABC/XYZ للترشيد.",
          "توقّف الإنتاج الناجم عن عيوب جودة لم تُكتشف عند فحص الاستلام يكلّف 50–500 ألف SAR في الساعة — يتطلب البند 8.4 من ISO 9001:2015 (التحكم في العمليات المقدَّمة خارجيًا) خطط جودة خاصة بكل مورد ومعايير فحص استلام.",
        ],
        solution: "ISC deploys integrated S&OP programmes aligned with APICS best practices, implements ISO 9001-compliant quality management systems, and conducts MRO rationalisation using criticality-based stocking policies — reducing expedited purchasing by 60% and unplanned downtime by 40%.",
        solutionAr: "تنشر ISC برامج متكاملة لتخطيط المبيعات والعمليات مواءَمة مع أفضل ممارسات APICS، وتطبّق أنظمة إدارة جودة متوافقة مع ISO 9001، وتُجري ترشيدًا لقطع الغيار والصيانة باستخدام سياسات تخزين قائمة على الأهمية — مما يقلّل الشراء العاجل بنسبة 60% والتوقف غير المخطط بنسبة 40%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Distribution, Warehousing & Customer Fulfilment",
        nameAr: "المصب — التوزيع والتخزين وتلبية طلبات العملاء",
        color: "#C9A84C",
        standards: ["CSCMP Supply Chain Management Principles", "APICS SCOR Deliver Domain (D1–D4)", "APICS CSCP Module 5: Implementing Supply Chain strategies", "WERC Warehouse Management Best Practices", "GS1 Traceability Standard"],
        processes: [
          "Network design: warehouse footprint, DC locations & last-mile coverage modelling",
          "Order management & customer order fulfilment (SCOR D1 — Make-to-Stock Deliver)",
          "Warehouse management: slotting, pick-pack-ship & labour productivity metrics",
          "Carrier management: tender, SLA setting & freight invoice audit",
          "Returns management & reverse logistics (APICS SCOR Return domain SR/DR)",
          "Supply chain visibility: track-and-trace, GS1 barcode & RFID implementation",
        ],
        processesAr: [
          "تصميم الشبكة: نمذجة نطاق المستودعات ومواقع مراكز التوزيع وتغطية الميل الأخير",
          "إدارة الطلبات وتلبية طلبات العملاء (SCOR D1 — التسليم بالإنتاج للمخزون)",
          "إدارة المستودعات: توزيع المواقع والالتقاط والتغليف والشحن ومقاييس إنتاجية العمالة",
          "إدارة الناقلين: المناقصة وإرساء اتفاقيات مستوى الخدمة وتدقيق فواتير الشحن",
          "إدارة المرتجعات والخدمات اللوجستية العكسية (نطاق الإرجاع من APICS SCOR — SR/DR)",
          "رؤية سلسلة الإمداد: التتبّع، وتطبيق الباركود GS1 وتقنية RFID",
        ],
        flow: ["Customer Order", "ATP Check", "Pick & Pack", "QC & Despatch", "POD & OTIF Reporting"],
        flowAr: ["طلب العميل", "فحص التوافر", "الالتقاط والتغليف", "مراقبة الجودة والإرسال", "إثبات التسليم وتقارير OTIF"],
        challenges: [
          "OTIF (On-Time-In-Full) performance below 92% — the CSCMP global benchmark — signals warehouse slotting and carrier management deficiencies. WERC data shows top-quartile performers achieve 98.5%+ OTIF through velocity-based slotting and dedicated carrier SLAs.",
          "Distribution network designed pre-Vision 2030 is sub-optimal for new economic zones (NEOM, KAEC, Qiddiya) — APICS CSCP network modelling frameworks recommend re-baseline every 3–5 years or after major demand pattern shifts.",
          "Returns rates of 8–15% in B2C manufacturing erode margins and damage brand loyalty — APICS SCOR Return domain benchmarks best-in-class reverse logistics cycle time at under 5 days, vs. industry averages of 15–21 days in the GCC.",
        ],
        challengesAr: [
          "أداء التسليم في الوقت وبالكامل (OTIF) دون 92% — المعيار العالمي لـ CSCMP — يشير إلى قصور في توزيع مواقع المستودعات وإدارة الناقلين. تُظهر بيانات WERC أن أصحاب الأداء في الربع الأعلى يحققون OTIF بنسبة تتجاوز 98.5% عبر توزيع المواقع حسب السرعة واتفاقيات مستوى خدمة مخصصة للناقلين.",
          "شبكة التوزيع المصممة قبل رؤية 2030 دون المستوى الأمثل للمناطق الاقتصادية الجديدة (نيوم، مدينة الملك عبدالله الاقتصادية، القدية) — توصي أطر نمذجة الشبكات من APICS CSCP بإعادة تحديد خط الأساس كل 3–5 سنوات أو بعد تحولات كبيرة في أنماط الطلب.",
          "معدلات المرتجعات بنسبة 8–15% في تصنيع السلع الموجهة للمستهلك تقلّص الهوامش وتضر بولاء العلامة التجارية — يحدد نطاق الإرجاع من APICS SCOR زمن دورة اللوجستيات العكسية الأفضل في فئته دون 5 أيام، مقابل متوسطات القطاع 15–21 يومًا في دول الخليج.",
        ],
        solution: "ISC applies APICS SCOR Deliver domain benchmarks and CSCMP network design principles to redesign distribution footprints, consolidate carrier bases, and implement OTIF dashboards — achieving 98%+ OTIF rates and a 20–30% reduction in distribution cost-per-unit.",
        solutionAr: "تطبّق ISC معايير نطاق التسليم من APICS SCOR ومبادئ تصميم الشبكة من CSCMP لإعادة تصميم نطاقات التوزيع وتوحيد قواعد الناقلين وتطبيق لوحات معلومات OTIF — محققةً معدلات OTIF تتجاوز 98% وخفضًا بنسبة 20–30% في تكلفة التوزيع لكل وحدة.",
      },
    ],
    cases: [
      { client: "Jordanian Steel Manufacturer", clientAr: "مصنّع صلب أردني", challenge: "Raw material costs 22% above benchmark; single-source dependencies; no CIPS category management framework", challengeAr: "تكاليف مواد خام أعلى من المعيار بنسبة 22%؛ اعتماد على مصدر وحيد؛ لا يوجد إطار إدارة فئات من CIPS", result: "$15M annual savings; dual-source strategy deployed; CIPS-aligned category management implemented across 8 spend categories", resultAr: "توفير سنوي بقيمة 15 مليون دولار؛ نشر استراتيجية توريد مزدوج؛ تطبيق إدارة فئات متوافقة مع CIPS عبر 8 فئات إنفاق" },
      { client: "Saudi FMCG Producer", clientAr: "منتِج سعودي للسلع الاستهلاكية سريعة الحركة", challenge: "Iktva at 23% vs. 35% mandatory target; no supplier development programme; NIDLP compliance audit risk", challengeAr: "نسبة اكتفاء 23% مقابل مستهدف إلزامي 35%؛ لا يوجد برنامج تطوير موردين؛ مخاطر تدقيق امتثال NIDLP", result: "Iktva raised to 41% in 18 months; 12 local suppliers developed; NIDLP audit passed with zero major findings", resultAr: "رفع اكتفاء إلى 41% خلال 18 شهرًا؛ تطوير 12 موردًا محليًا؛ اجتياز تدقيق NIDLP دون ملاحظات جوهرية" },
    ],
  },

  energy: {
    name: "Energy & Oil",
    nameAr: "الطاقة والنفط",
    tagline: "Optimising supply chains for the Kingdom's energy transition",
    taglineAr: "تحسين سلاسل الإمداد لتحول المملكة في مجال الطاقة",
    intro: "The GCC energy sector — anchored by Saudi Aramco, SABIC, and the Kingdom's Vision 2030 energy diversification agenda — operates the world's most complex and high-stakes supply chains. CIPS Procurement Standards, APICS CPIM, and Aramco's own SQSP (Supplier Quality Standards Programme) define the professional framework. As the Kingdom expands into renewables, green hydrogen, and petrochemicals, supply chain strategies must evolve under ISM CPSM and ISO 14001:2015 sustainability obligations.",
    introAr: "يدير قطاع الطاقة في دول الخليج — الذي ترتكز عليه أرامكو السعودية وسابك وأجندة تنويع الطاقة ضمن رؤية 2030 — أكثر سلاسل الإمداد تعقيدًا وأهميةً في العالم. تحدد معايير المشتريات من CIPS وشهادة APICS CPIM وبرنامج أرامكو لمعايير جودة الموردين (SQSP) الإطار المهني. ومع توسّع المملكة في الطاقة المتجددة والهيدروجين الأخضر والبتروكيماويات، يجب أن تتطور استراتيجيات سلسلة الإمداد وفق ISM CPSM والتزامات الاستدامة في ISO 14001:2015.",
    icon: Zap,
    heroColor: "#1a5c3a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — CAPEX Procurement & Supplier Qualification",
        nameAr: "المنبع — مشتريات النفقات الرأسمالية وتأهيل الموردين",
        color: "#1a5c3a",
        standards: ["CIPS Major Projects & Programme Procurement Standard", "CPSM Module 2: Supply Management Strategy", "Aramco IK.SQSP Supplier Qualification", "ASME / API Vendor Qualification Standards", "ISO 44001:2017 Collaborative Business Relationships"],
        processes: [
          "Major equipment sourcing: compressors, turbines, heat exchangers — long-lead strategy",
          "LSTK (Lump Sum Turn Key) tender strategy & contract risk allocation (IACCM EPC framework)",
          "Material take-off (MTO) generation & long-lead item procurement scheduling",
          "Vendor inspection programme: ITP development, factory acceptance testing (FAT)",
          "Aramco SQSP pre-qualification: IK.SQSP-01 through IK.SQSP-07 compliance",
          "Local content programme management: Aramco Iktva & NIDLP compliance scoring",
        ],
        processesAr: [
          "توريد المعدات الكبرى: الضواغط والتوربينات والمبادلات الحرارية — استراتيجية الأصناف طويلة أمد التوريد",
          "استراتيجية مناقصة العقود بمبلغ إجمالي مقطوع (LSTK) وتوزيع مخاطر العقد (إطار EPC من IACCM)",
          "إعداد حصر المواد (MTO) وجدولة شراء الأصناف طويلة أمد التوريد",
          "برنامج فحص المورّدين: إعداد خطة الفحص والاختبار واختبار القبول بالمصنع (FAT)",
          "التأهيل المسبق ببرنامج أرامكو SQSP: الامتثال من IK.SQSP-01 حتى IK.SQSP-07",
          "إدارة برنامج المحتوى المحلي: تقييم امتثال اكتفاء أرامكو وNIDLP",
        ],
        flow: ["Project MTO", "Long-Lead Strategy", "Vendor Pre-Qual", "RFQ / Tender", "FAT & Delivery"],
        flowAr: ["حصر مواد المشروع", "استراتيجية الأصناف طويلة الأمد", "التأهيل المسبق للموردين", "طلب الأسعار / المناقصة", "اختبار القبول والتسليم"],
        challenges: [
          "Long-lead equipment (18–36 month delivery windows) requires CAPEX commitment before final engineering is complete — CIPS recommends a letter-of-intent (LOI) framework with conditional commitment clauses aligned to Engineering milestones to manage scope risk.",
          "LSTK contractor risk transfer is frequently mis-structured — IACCM research shows 60% of EPC disputes arise from ambiguous delay liquidated damages (DLD) and supply chain risk-sharing clauses; CIPSM Contract Management Standard provides the correct drafting framework.",
          "Vendor qualification for safety-critical equipment (pressure vessels per ASME VIII, valves per API 6A/6D) requires 12–18 months — most Saudi operators have no pre-qualified vendor shortlists, creating critical-path schedule risk on CAPEX projects.",
        ],
        challengesAr: [
          "تتطلب المعدات طويلة أمد التوريد (نوافذ تسليم 18–36 شهرًا) التزامًا بالنفقات الرأسمالية قبل اكتمال الهندسة النهائية — يوصي CIPS بإطار خطاب نوايا (LOI) ببنود التزام مشروطة مواءَمة مع مراحل الهندسة لإدارة مخاطر النطاق.",
          "غالبًا ما يُساء هيكلة نقل مخاطر مقاول LSTK — تُظهر أبحاث IACCM أن 60% من نزاعات EPC تنشأ من غموض شروط غرامات التأخير وبنود تقاسم مخاطر سلسلة الإمداد؛ يوفر معيار إدارة العقود من CIPS إطار الصياغة الصحيح.",
          "يتطلب تأهيل المورّدين للمعدات الحرجة للسلامة (أوعية الضغط وفق ASME VIII، الصمامات وفق API 6A/6D) من 12 إلى 18 شهرًا — لا يملك معظم المشغّلين السعوديين قوائم موردين مؤهَّلين مسبقًا، مما يخلق مخاطر جدولة على المسار الحرج لمشاريع النفقات الرأسمالية.",
        ],
        solution: "ISC provides CAPEX supply chain advisory aligned with CIPS Major Projects Standard and Aramco SQSP requirements — long-lead procurement strategies, LSTK contract structuring with IACCM-aligned risk provisions, and pre-qualified vendor databases — reducing CAPEX procurement cycle time by 30%.",
        solutionAr: "تقدّم ISC استشارات سلسلة إمداد للنفقات الرأسمالية مواءَمة مع معيار المشاريع الكبرى من CIPS ومتطلبات أرامكو SQSP — استراتيجيات شراء للأصناف طويلة أمد التوريد وهيكلة عقود LSTK ببنود مخاطر مواءَمة مع IACCM وقواعد بيانات موردين مؤهَّلين مسبقًا — مما يقلّل زمن دورة مشتريات النفقات الرأسمالية بنسبة 30%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Asset Management, MRO & Turnaround Planning",
        nameAr: "الوسط — إدارة الأصول وقطع الغيار وتخطيط عمليات الإيقاف والصيانة",
        color: "#2d7a4f",
        standards: ["APICS CPIM Module 3: Managing Inventory (MRO focus)", "ISO 55001:2014 Asset Management Systems", "SMRP (Society for Maintenance & Reliability Professionals) Metrics", "APICS SCOR Make Domain", "PAS 55 Asset Management"],
        processes: [
          "Spare parts criticality classification: ABC/VED/XYZ matrix per APICS CPIM",
          "Storeroom rationalisation: slow-moving & obsolete (SLOB) identification & disposal",
          "Min-max & reorder point optimisation using SMRP equipment criticality matrix",
          "Turnaround (TAR) supply chain planning: pre-staging, kitting & critical-path material scheduling",
          "ISO 55001-aligned asset management plan: lifecycle costing & replacement modelling",
          "OEM vs. independent repair/overhaul (MRO) cost benchmarking",
        ],
        processesAr: [
          "تصنيف أهمية قطع الغيار: مصفوفة ABC/VED/XYZ وفق APICS CPIM",
          "ترشيد المخازن: تحديد المخزون بطيء الحركة والمتقادم (SLOB) والتخلص منه",
          "تحسين الحد الأدنى والأقصى ونقطة إعادة الطلب باستخدام مصفوفة أهمية المعدات من SMRP",
          "تخطيط سلسلة إمداد عمليات الإيقاف والصيانة (TAR): التجهيز المسبق والتجميع وجدولة المواد على المسار الحرج",
          "خطة إدارة أصول مواءَمة مع ISO 55001: تحديد تكلفة دورة الحياة ونمذجة الاستبدال",
          "المقارنة المعيارية بين تكلفة الشركة المصنّعة الأصلية والإصلاح/العمرة المستقل",
        ],
        flow: ["Asset Criticality", "MRO Classification", "Stocking Policy", "TAR Pre-Staging", "Consumption Tracking"],
        flowAr: ["أهمية الأصل", "تصنيف قطع الغيار", "سياسة التخزين", "التجهيز المسبق للإيقاف", "تتبّع الاستهلاك"],
        challenges: [
          "MRO inventory worth SAR 200M–2B with 30–40% slow-moving or obsolete stock — ISO 55001 requires life-cycle cost analysis justifying stocking decisions; without it, organisations over-stock non-critical items while under-stocking genuine critical spares.",
          "TAR planning gaps cause 40–60% cost premiums on last-minute expedited procurement — SMRP Best Practice Guide recommends a 52-week TAR supply chain plan with 85% materials pre-committed 6 months before execution.",
          "OEM sole-source maintenance contracts are routinely priced 25–40% above independent MRO benchmarks — CIPSM strategic sourcing methodology for maintenance services includes market testing, reverse auctions, and performance-based contracting.",
        ],
        challengesAr: [
          "مخزون قطع الغيار والصيانة بقيمة 200 مليون – 2 مليار SAR مع 30–40% مخزون بطيء الحركة أو متقادم — يتطلب ISO 55001 تحليل تكلفة دورة الحياة لتبرير قرارات التخزين؛ وبدونه تفرط المؤسسات في تخزين الأصناف غير الحرجة بينما تنقص لديها قطع الغيار الحرجة الحقيقية.",
          "تسبّب فجوات تخطيط عمليات الإيقاف والصيانة علاوات تكلفة بنسبة 40–60% على الشراء العاجل في اللحظة الأخيرة — يوصي دليل أفضل الممارسات من SMRP بخطة سلسلة إمداد للإيقاف والصيانة مدتها 52 أسبوعًا مع الالتزام مسبقًا بـ85% من المواد قبل ستة أشهر من التنفيذ.",
          "تُسعَّر عقود الصيانة الحصرية من الشركة المصنّعة الأصلية عادةً بنسبة 25–40% أعلى من المعايير المستقلة — تتضمن منهجية التوريد الاستراتيجي من CIPS لخدمات الصيانة اختبار السوق والمزادات العكسية والتعاقد القائم على الأداء.",
        ],
        solution: "ISC conducts full MRO rationalisation using the APICS CPIM criticality framework and SMRP metrics, designs TAR supply chain playbooks aligned with world-class turnaround standards, and implements ISO 55001-compliant asset management plans — typically freeing 20–35% of inventory value and reducing TAR cost by 15–25%.",
        solutionAr: "تُجري ISC ترشيدًا كاملاً لقطع الغيار والصيانة باستخدام إطار الأهمية من APICS CPIM ومقاييس SMRP، وتصمّم أدلة عمل لسلسلة إمداد الإيقاف والصيانة مواءَمة مع معايير عالمية، وتطبّق خطط إدارة أصول متوافقة مع ISO 55001 — محررةً عادةً 20–35% من قيمة المخزون وخافضةً تكلفة الإيقاف والصيانة بنسبة 15–25%.",
      },
      {
        type: 'downstream',
        name: "Downstream — ESG, Offtake & Sustainability Reporting",
        nameAr: "المصب — الحوكمة البيئية والاجتماعية والبيع الآجل وتقارير الاستدامة",
        color: "#C9A84C",
        standards: ["ISO 14001:2015 Environmental Management", "ISO 20400:2017 Sustainable Procurement", "CIPS Ethical & Sustainable Procurement Standard", "GRI (Global Reporting Initiative) Standards", "TCFD Climate-Related Financial Disclosures"],
        processes: [
          "Scope 3 supply chain emissions mapping (GHG Protocol Category 1–3 methodology)",
          "Supplier ESG assessment & scoring (CIPS Sustainability Index)",
          "Responsible sourcing policy development (ISO 20400 implementation)",
          "Carbon reduction programme: low-carbon procurement specifications & supplier engagement",
          "ESG supply chain reporting: CDP A-List submission, GRI 308/414 compliance",
          "Product offtake contract management: price risk, volume commitment & destination clauses",
        ],
        processesAr: [
          "رسم انبعاثات النطاق الثالث لسلسلة الإمداد (منهجية GHG Protocol للفئات 1–3)",
          "تقييم وتسجيل أداء الموردين البيئي والاجتماعي والحوكمي (مؤشر الاستدامة من CIPS)",
          "تطوير سياسة توريد مسؤول (تطبيق ISO 20400)",
          "برنامج خفض الكربون: مواصفات شراء منخفضة الكربون وإشراك الموردين",
          "تقارير سلسلة الإمداد البيئية والاجتماعية والحوكمية: تقديم قائمة CDP A والامتثال لـ GRI 308/414",
          "إدارة عقود البيع الآجل للمنتجات: مخاطر السعر والتزام الكمية وبنود الوجهة",
        ],
        flow: ["Emissions Baseline", "Supplier ESG Audit", "Reduction Targets", "CDP Submission", "Annual Board Report"],
        flowAr: ["خط أساس الانبعاثات", "تدقيق أداء الموردين البيئي", "مستهدفات الخفض", "تقديم CDP", "التقرير السنوي للمجلس"],
        challenges: [
          "Scope 3 supply chain emissions represent 60–80% of total carbon footprint but are largely unmeasured — GHG Protocol Scope 3 Standard Category 1 (Purchased Goods & Services) requires supplier-level primary data, which most Saudi energy companies cannot yet produce.",
          "International institutional investors (BlackRock, Vanguard, sovereign funds) are requiring TCFD-aligned supply chain disclosures as a condition of capital allocation — organisations without structured ESG supply chain programmes face direct cost-of-capital impact.",
          "Iktva local content obligations and ESG supplier diversity standards are sometimes in tension — ISO 20400 provides the balanced framework for integrating local content, SME development, and environmental requirements into a single sustainable procurement policy.",
        ],
        challengesAr: [
          "تمثّل انبعاثات النطاق الثالث لسلسلة الإمداد 60–80% من إجمالي البصمة الكربونية لكنها غير مقاسة إلى حد كبير — يتطلب معيار النطاق الثالث من GHG Protocol الفئة 1 (السلع والخدمات المشتراة) بيانات أولية على مستوى المورد، وهو ما لا تستطيع معظم شركات الطاقة السعودية إنتاجه بعد.",
          "يشترط المستثمرون المؤسسيون الدوليون (بلاك روك، فانغارد، الصناديق السيادية) إفصاحات سلسلة إمداد مواءَمة مع TCFD كشرط لتخصيص رأس المال — تواجه المؤسسات التي تفتقر إلى برامج بيئية واجتماعية وحوكمية منظمة أثرًا مباشرًا على تكلفة رأس المال.",
          "قد تتعارض التزامات المحتوى المحلي (اكتفاء) مع معايير تنوع الموردين البيئية والاجتماعية والحوكمية — يوفر ISO 20400 الإطار المتوازن لدمج المحتوى المحلي وتطوير المنشآت الصغيرة والمتطلبات البيئية في سياسة توريد مستدام واحدة.",
        ],
        solution: "ISC builds ISO 14001 and ISO 20400-aligned sustainable procurement frameworks, delivers GRI and CDP supply chain reporting programmes, and integrates ESG metrics into supplier scorecards — enabling access to ESG-conscious capital and unlocking green financing at 50–150bps premium savings.",
        solutionAr: "تبني ISC أطر توريد مستدام مواءَمة مع ISO 14001 وISO 20400، وتقدّم برامج تقارير سلسلة الإمداد وفق GRI وCDP، وتدمج المقاييس البيئية والاجتماعية والحوكمية في بطاقات أداء الموردين — مما يتيح الوصول إلى رأس المال الواعي بالاستدامة ويفتح تمويلاً أخضر بوفورات علاوة تتراوح بين 50 و150 نقطة أساس.",
      },
    ],
    cases: [
      { client: "Saudi Energy Services Company", clientAr: "شركة خدمات طاقة سعودية", challenge: "No ESG supply chain metrics; failing international tender qualification on ISO 20400 criteria; CDP not submitted", challengeAr: "لا توجد مقاييس بيئية واجتماعية وحوكمية لسلسلة الإمداد؛ إخفاق في تأهيل المناقصات الدولية على معايير ISO 20400؛ لم يُقدَّم CDP", result: "CDP A- score achieved; 28% supply chain carbon reduction; 3 international tenders qualified; ISO 14001 certified", resultAr: "تحقيق درجة CDP A-؛ خفض كربون سلسلة الإمداد بنسبة 28%؛ تأهيل 3 مناقصات دولية؛ الحصول على شهادة ISO 14001" },
      { client: "GCC Petrochemical Operator", clientAr: "مشغّل بتروكيماويات خليجي", challenge: "MRO inventory SAR 1.2B with 38% SLOB; unplanned downtime 12% of production hours; no ISO 55001 programme", challengeAr: "مخزون قطع غيار وصيانة بقيمة 1.2 مليار SAR مع 38% مخزون بطيء ومتقادم؛ توقف غير مخطط بنسبة 12% من ساعات الإنتاج؛ لا يوجد برنامج ISO 55001", result: "SAR 290M inventory rationalised; downtime reduced to 4.5%; ISO 55001 implementation roadmap completed", resultAr: "ترشيد مخزون بقيمة 290 مليون SAR؛ خفض التوقف إلى 4.5%؛ إكمال خارطة طريق تطبيق ISO 55001" },
    ],
  },

  government: {
    name: "Government & Public Sector",
    nameAr: "الحكومة والقطاع العام",
    tagline: "Modernising public procurement for Vision 2030 compliance",
    taglineAr: "تحديث المشتريات الحكومية للامتثال لرؤية 2030",
    intro: "Saudi government procurement is governed by the Government Tenders and Procurement Law (Royal Decree M/128 2019) and administered through the NCAR (National Centre for Competitive Procurement). With Vision 2030 placing national procurement at the centre of economic transformation — Iktva, SME engagement, Etimad digital procurement — public sector supply chain leaders require the CIPS Public Sector Procurement Standard, CPSM ethics module, and OECD Procurement Integrity principles to deliver compliant, transparent, and value-driven procurement.",
    introAr: "تخضع المشتريات الحكومية السعودية لنظام المنافسات والمشتريات الحكومية (المرسوم الملكي م/128 لعام 2019) وتُدار عبر الهيئة العامة للمنافسة (NCAR). ومع وضع رؤية 2030 المشتريات الوطنية في صميم التحول الاقتصادي — اكتفاء، وإشراك المنشآت الصغيرة والمتوسطة، والمشتريات الرقمية عبر منصة اعتماد — يحتاج قادة سلسلة الإمداد في القطاع العام إلى معيار مشتريات القطاع العام من CIPS ووحدة الأخلاقيات في CPSM ومبادئ نزاهة المشتريات من منظمة OECD لتحقيق مشتريات ممتثلة وشفافة ومحققة للقيمة.",
    icon: Building2,
    heroColor: "#4a1a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Strategic Procurement, Policy & Tendering",
        nameAr: "المنبع — المشتريات الاستراتيجية والسياسات والمناقصات",
        color: "#4a1a6b",
        standards: ["CIPS Public Sector Procurement Standard", "OECD Principles for Integrity in Public Procurement", "Saudi Government Tenders & Procurement Law (M/128)", "NCAR Procurement Competition Guidelines", "ISO 37001:2016 Anti-Bribery Management"],
        processes: [
          "Annual procurement planning & spend mapping against approved budgets (NCAR framework)",
          "Category management strategy: consolidation of fragmented departmental spend",
          "Tender document development: TOR, technical specifications & evaluation criteria aligned to NCAR",
          "Framework agreement strategy: multi-supplier, multi-year agreements to reduce transaction cost",
          "SME & Iktva development programme aligned to Vision 2030 SME Authority targets",
          "Procurement policy drafting: delegation of authority matrices & approval workflows",
        ],
        processesAr: [
          "التخطيط السنوي للمشتريات ورسم الإنفاق مقابل الميزانيات المعتمدة (إطار NCAR)",
          "استراتيجية إدارة الفئات: توحيد الإنفاق المجزأ عبر الإدارات",
          "إعداد وثائق المناقصة: نطاق العمل والمواصفات الفنية ومعايير التقييم بمواءمة NCAR",
          "استراتيجية الاتفاقيات الإطارية: اتفاقيات متعددة الموردين ومتعددة السنوات لخفض تكلفة المعاملات",
          "برنامج تطوير المنشآت الصغيرة والمتوسطة واكتفاء بمواءمة مستهدفات هيئة المنشآت ضمن رؤية 2030",
          "صياغة سياسة المشتريات: مصفوفات تفويض الصلاحيات وسير عمل الاعتماد",
        ],
        flow: ["Procurement Plan", "Spend Analysis", "Tender Development", "Evaluation & Award", "Framework Agreement"],
        flowAr: ["خطة المشتريات", "تحليل الإنفاق", "إعداد المناقصة", "التقييم والترسية", "الاتفاقية الإطارية"],
        challenges: [
          "Reactive, uncoordinated procurement across departments eliminates volume leverage — CIPS research shows centralised category management in public sector organisations delivers 15–25% savings vs. fragmented departmental procurement.",
          "Compliance with Saudi Procurement Competition Law requires documented justification for sole-source awards — NCAR audit findings show 35–50% of sole-source awards in non-compliant government entities lack adequate documentation, creating financial audit exposure.",
          "Resistance from departmental budget-holders to centralised procurement models is the most common implementation challenge — OECD Procurement Integrity Principle 8 (Stakeholder Engagement) provides the structured change management approach for public sector transformation.",
        ],
        challengesAr: [
          "المشتريات التفاعلية غير المنسقة عبر الإدارات تلغي قدرة التفاوض على الحجم — تُظهر أبحاث CIPS أن إدارة الفئات المركزية في مؤسسات القطاع العام تحقق وفورات بنسبة 15–25% مقابل المشتريات الإدارية المجزأة.",
          "يتطلب الامتثال لنظام المنافسات السعودي تبريرًا موثّقًا لعمليات الترسية من مصدر وحيد — تُظهر نتائج تدقيق NCAR أن 35–50% من عمليات الترسية من مصدر وحيد في الجهات الحكومية غير الممتثلة تفتقر إلى توثيق كافٍ، مما يخلق تعرّضًا للتدقيق المالي.",
          "مقاومة مالكي ميزانيات الإدارات لنماذج المشتريات المركزية هي أكثر تحديات التطبيق شيوعًا — يوفر المبدأ الثامن لنزاهة المشتريات من OECD (إشراك أصحاب المصلحة) نهج إدارة التغيير المنظم لتحول القطاع العام.",
        ],
        solution: "ISC designs NCAR-compliant centralised procurement models and category management frameworks aligned with the CIPS Public Sector Standard — delivering 15–25% cost savings on consolidated spend, zero NCAR audit findings, and full Vision 2030 SME / Iktva compliance documentation.",
        solutionAr: "تصمّم ISC نماذج مشتريات مركزية متوافقة مع NCAR وأطر إدارة فئات مواءَمة مع معيار القطاع العام من CIPS — محققةً وفورات بنسبة 15–25% على الإنفاق الموحّد، وصفر ملاحظات تدقيق من NCAR، وتوثيق امتثال كامل للمنشآت الصغيرة والمتوسطة واكتفاء ضمن رؤية 2030.",
      },
      {
        type: 'midstream',
        name: "Midstream — Contract Management, PO Lifecycle & Governance",
        nameAr: "الوسط — إدارة العقود ودورة حياة أوامر الشراء والحوكمة",
        color: "#6b2d9e",
        standards: ["IACCM Contract Management Standard", "CIPS Contract Management Guide", "ISO 37001:2016 Anti-Bribery Management", "Saudi e-Government Etimad Platform Requirements", "World Bank Public Procurement Assessment Framework"],
        processes: [
          "Contract lifecycle management (CLM): drafting, review, approval workflow & register",
          "Etimad platform integration: e-tendering, digital contracting & PO management",
          "Supplier performance management: KPI dashboards, quarterly reviews & incentive mechanisms",
          "Contract variation management: scope change control, budget impact assessment & approval",
          "ZATCA compliance: e-invoicing (FATOORAH Phase 2), VAT on government procurement",
          "Audit-readiness: procurement file completeness, documentation standards & NCAR evidence",
        ],
        processesAr: [
          "إدارة دورة حياة العقود (CLM): الصياغة والمراجعة وسير عمل الاعتماد والسجل",
          "التكامل مع منصة اعتماد: المناقصات الإلكترونية والتعاقد الرقمي وإدارة أوامر الشراء",
          "إدارة أداء الموردين: لوحات مؤشرات الأداء والمراجعات الفصلية وآليات الحوافز",
          "إدارة التغييرات التعاقدية: التحكم في تغيير النطاق وتقييم أثر الميزانية والاعتماد",
          "الامتثال لهيئة الزكاة والضريبة والجمارك: الفوترة الإلكترونية (فاتورة المرحلة الثانية) وضريبة القيمة المضافة على المشتريات الحكومية",
          "الجاهزية للتدقيق: اكتمال ملفات المشتريات ومعايير التوثيق وأدلة NCAR",
        ],
        flow: ["Contract Drafting", "Legal Review", "Etimad Registration", "Award & PO Issue", "Performance Monitoring"],
        flowAr: ["صياغة العقد", "المراجعة القانونية", "التسجيل في اعتماد", "الترسية وإصدار أمر الشراء", "مراقبة الأداء"],
        challenges: [
          "Government entities manage thousands of contracts without a CLM system — IACCM research shows unmanaged contracts result in 9.2% value leakage through missed renewal savings, unclaimed liquidated damages, and scope creep.",
          "ZATCA Phase 2 e-invoicing requirements mandate that all government procurement is processed through FATOORAH-compliant systems — non-compliance risks VAT penalties of SAR 1,000 per non-compliant transaction.",
          "Supplier performance management is informal in most government entities — without KPI-linked contract mechanisms, poorly-performing contractors automatically renew because no documented grounds for termination exist.",
        ],
        challengesAr: [
          "تدير الجهات الحكومية آلاف العقود دون نظام لإدارة دورة حياة العقود — تُظهر أبحاث IACCM أن العقود غير المُدارة تؤدي إلى تسرّب قيمة بنسبة 9.2% عبر تفويت وفورات التجديد وعدم المطالبة بغرامات التأخير وزحف النطاق.",
          "تفرض متطلبات الفوترة الإلكترونية للمرحلة الثانية من هيئة الزكاة والضريبة والجمارك معالجة جميع المشتريات الحكومية عبر أنظمة متوافقة مع فاتورة — يُعرّض عدم الامتثال لغرامات ضريبة قيمة مضافة قدرها 1,000 SAR لكل معاملة غير ممتثلة.",
          "إدارة أداء الموردين غير رسمية في معظم الجهات الحكومية — بدون آليات تعاقدية مرتبطة بمؤشرات الأداء، تتجدد عقود المقاولين ضعيفي الأداء تلقائيًا لعدم وجود أسباب موثّقة للإنهاء.",
        ],
        solution: "ISC implements full CLM programmes aligned with IACCM standards and Etimad platform requirements — contract templates, KPI frameworks, ZATCA compliance, and audit-readiness documentation — recovering 9% average contract value leakage and achieving zero NCAR/MOF audit findings.",
        solutionAr: "تطبّق ISC برامج كاملة لإدارة دورة حياة العقود مواءَمة مع معايير IACCM ومتطلبات منصة اعتماد — قوالب عقود وأطر مؤشرات أداء والامتثال لهيئة الزكاة والضريبة والجمارك وتوثيق الجاهزية للتدقيق — مستردةً في المتوسط 9% من تسرّب قيمة العقود ومحققةً صفر ملاحظات تدقيق من NCAR ووزارة المالية.",
      },
      {
        type: 'downstream',
        name: "Downstream — Service Delivery, Audit Readiness & Beneficiary Reporting",
        nameAr: "المصب — تقديم الخدمة والجاهزية للتدقيق وتقارير المستفيدين",
        color: "#C9A84C",
        standards: ["CIPS Post-Award Contract Management Standard", "ISO 9001:2015 Clause 8.7 (Nonconforming Outputs)", "Saudi Vision 2030 KPI Reporting Framework", "World Bank Service Delivery Assessment", "GCC Data & Analytics for Public Sector Procurement"],
        processes: [
          "Service delivery monitoring: milestone verification, site inspection & acceptance protocols",
          "Beneficiary satisfaction measurement: survey design, data collection & reporting",
          "KPI dashboard design: spend-vs-budget, Iktva %, PO cycle time, supplier performance",
          "Audit-readiness programme: NCAR/MOF file review, gap analysis & evidence packing",
          "Procurement analytics: Power BI dashboard development for Ministry-level reporting",
          "Lessons learned & continuous improvement: CIPS PDCA cycle for procurement process",
        ],
        processesAr: [
          "مراقبة تقديم الخدمة: التحقق من المراحل والتفتيش الميداني وبروتوكولات القبول",
          "قياس رضا المستفيدين: تصميم الاستبيانات وجمع البيانات وإعداد التقارير",
          "تصميم لوحة مؤشرات الأداء: الإنفاق مقابل الميزانية ونسبة اكتفاء وزمن دورة أمر الشراء وأداء الموردين",
          "برنامج الجاهزية للتدقيق: مراجعة ملفات NCAR/وزارة المالية وتحليل الفجوات وتجهيز الأدلة",
          "تحليلات المشتريات: تطوير لوحات معلومات Power BI للتقارير على مستوى الوزارة",
          "الدروس المستفادة والتحسين المستمر: دورة PDCA من CIPS لعملية المشتريات",
        ],
        flow: ["Delivery Milestone", "Site Acceptance", "KPI Capture", "Dashboard Reporting", "Audit Evidence Pack"],
        flowAr: ["مرحلة التسليم", "القبول الميداني", "التقاط مؤشرات الأداء", "تقارير لوحة المعلومات", "حزمة أدلة التدقيق"],
        challenges: [
          "Government service delivery is frequently accepted without documented quality verification — ISO 9001 Clause 8.6 requires documented evidence of conformity to acceptance criteria before delivery sign-off; without it, warranty claims become unenforceable.",
          "Vision 2030 programme offices require granular Iktva, SME, and spend-efficiency KPI data that most procurement systems cannot produce — NCAR reporting requirements mandate quarterly data submissions that take weeks of manual effort to compile.",
          "Procurement audit findings carry personal liability implications under Saudi Anti-Corruption Law (NAZAHA) — CIPS recommends a structured procurement audit-readiness programme run 6 months before any scheduled review.",
        ],
        challengesAr: [
          "غالبًا ما يُقبَل تقديم الخدمة الحكومية دون تحقق موثّق من الجودة — يتطلب البند 8.6 من ISO 9001 أدلة موثّقة على مطابقة معايير القبول قبل اعتماد التسليم؛ وبدونها تصبح مطالبات الضمان غير قابلة للتنفيذ.",
          "تتطلب مكاتب برامج رؤية 2030 بيانات مؤشرات أداء دقيقة لاكتفاء والمنشآت الصغيرة وكفاءة الإنفاق يعجز معظم أنظمة المشتريات عن إنتاجها — تفرض متطلبات تقارير NCAR تقديم بيانات فصلية يستغرق تجميعها أسابيع من الجهد اليدوي.",
          "تترتب على ملاحظات تدقيق المشتريات تبعات مسؤولية شخصية بموجب نظام مكافحة الفساد السعودي (نزاهة) — يوصي CIPS ببرنامج منظم للجاهزية لتدقيق المشتريات يُنفَّذ قبل ستة أشهر من أي مراجعة مجدولة.",
        ],
        solution: "ISC designs government-grade KPI reporting frameworks and Power BI dashboards aligned with NCAR reporting requirements, implements ISO 9001-compliant service acceptance protocols, and runs audit-readiness programmes — achieving 100% NCAR compliance and delivering Vision 2030 reporting packs on time.",
        solutionAr: "تصمّم ISC أطر تقارير مؤشرات أداء بمستوى حكومي ولوحات معلومات Power BI مواءَمة مع متطلبات تقارير NCAR، وتطبّق بروتوكولات قبول خدمة متوافقة مع ISO 9001، وتُنفّذ برامج جاهزية للتدقيق — محققةً امتثالاً كاملاً لـ NCAR وتسليم حزم تقارير رؤية 2030 في الوقت المحدد.",
      },
    ],
    cases: [
      { client: "GCC Government Procurement Authority", clientAr: "هيئة مشتريات حكومية خليجية", challenge: "Manual supplier onboarding; 0% Iktva visibility; non-compliant contracts; NCAR audit imminent", challengeAr: "إدخال موردين يدوي؛ رؤية اكتفاء 0%؛ عقود غير ممتثلة؛ تدقيق NCAR وشيك", result: "Full NCAR compliance; 100% Iktva tracking; 60% faster onboarding; 35 contract templates standardised; zero audit findings", resultAr: "امتثال كامل لـ NCAR؛ تتبّع اكتفاء بنسبة 100%؛ إدخال أسرع بنسبة 60%؛ توحيد 35 قالب عقد؛ صفر ملاحظات تدقيق" },
      { client: "Saudi Ministry Procurement Directorate", clientAr: "إدارة مشتريات وزارة سعودية", challenge: "SAR 2.4B fragmented spend across 12 departments; no category management; Etimad not integrated", challengeAr: "إنفاق مجزأ بقيمة 2.4 مليار SAR عبر 12 إدارة؛ لا توجد إدارة فئات؛ منصة اعتماد غير متكاملة", result: "Category management programme live; SAR 380M Year-1 savings identified; Etimad fully integrated", resultAr: "برنامج إدارة فئات قيد التشغيل؛ تحديد وفورات بقيمة 380 مليون SAR في السنة الأولى؛ تكامل كامل مع منصة اعتماد" },
    ],
  },

  pharma: {
    name: "Pharmaceutical & Healthcare Products",
    nameAr: "المستحضرات الدوائية والمنتجات الصحية",
    tagline: "Securing medicine supply chains for the Kingdom's health ambitions",
    taglineAr: "تأمين سلاسل إمداد الأدوية لتطلعات المملكة الصحية",
    intro: "Saudi Arabia's pharmaceutical market exceeds SAR 30B annually, governed by SFDA regulations with strict cold-chain, GDP (Good Distribution Practice), and traceability requirements. Vision 2030 targets 40% local pharmaceutical manufacturing by 2030. CIPS Healthcare Procurement Standard, WHO Good Distribution Practice 2010, PIC/S GDP Guidelines, and APICS inventory management frameworks define professional best practice for this zero-tolerance supply chain sector.",
    introAr: "يتجاوز سوق الأدوية في المملكة العربية السعودية 30 مليار SAR سنويًا، ويخضع للوائح الهيئة العامة للغذاء والدواء (SFDA) بمتطلبات صارمة لسلسلة التبريد وممارسات التوزيع الجيدة (GDP) والتتبّع. تستهدف رؤية 2030 توطين 40% من التصنيع الدوائي المحلي بحلول 2030. تحدد معايير مشتريات الرعاية الصحية من CIPS، وممارسات التوزيع الجيدة من منظمة الصحة العالمية 2010، وإرشادات GDP من PIC/S، وأطر إدارة المخزون من APICS أفضل الممارسات المهنية لهذا القطاع عديم التسامح مع الخطأ.",
    icon: Pill,
    heroColor: "#1a6b4a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Procurement, Supplier Qualification & Regulatory Import",
        nameAr: "المنبع — المشتريات وتأهيل الموردين والاستيراد التنظيمي",
        color: "#1a6b4a",
        standards: ["CIPS Healthcare Procurement Standard", "WHO Good Distribution Practice (GDP) 2010", "PIC/S GDP Guidelines PE 011-1", "SFDA Import Registration Requirements", "ICH Q10 Pharmaceutical Quality System"],
        processes: [
          "SFDA product registration management: dossier submission, variation tracking & expiry monitoring",
          "GDP supplier qualification: site audits, quality agreements & GMP certificate verification",
          "Cold-chain import logistics: temperature-controlled shipment specifications (2°C–8°C, -20°C, -80°C)",
          "Customs clearance: SFDA import permit management, health certificate coordination",
          "Dual-source procurement strategy: primary + secondary supplier per WHO Essential Medicines guidance",
          "Trading terms management: reference pricing compliance, SFDA price-controlled product procurement",
        ],
        processesAr: [
          "إدارة تسجيل المنتجات لدى SFDA: تقديم الملفات وتتبّع التعديلات ومراقبة انتهاء الصلاحية",
          "تأهيل الموردين وفق GDP: تدقيق المواقع واتفاقيات الجودة والتحقق من شهادات GMP",
          "لوجستيات استيراد سلسلة التبريد: مواصفات الشحنات المتحكَّم في درجة حرارتها (2–8°م، -20°م، -80°م)",
          "التخليص الجمركي: إدارة تصاريح استيراد SFDA وتنسيق الشهادات الصحية",
          "استراتيجية توريد مزدوج: مورد رئيسي + ثانوي وفق إرشادات الأدوية الأساسية من منظمة الصحة العالمية",
          "إدارة الشروط التجارية: الامتثال للتسعير المرجعي وشراء المنتجات المحكومة السعر من SFDA",
        ],
        flow: ["SFDA Registration", "Supplier GDP Audit", "Import Permit", "Cold-Chain Shipment", "GDP Receipt Verification"],
        flowAr: ["التسجيل لدى SFDA", "تدقيق GDP للمورد", "تصريح الاستيراد", "شحنة سلسلة التبريد", "التحقق من الاستلام وفق GDP"],
        challenges: [
          "SFDA registration timelines (12–24 months) create stock-out risk as products awaiting registration cannot be imported commercially — ICH Q10 recommends a 24-month forward registration pipeline managed against sales forecast to maintain product availability.",
          "Cold-chain failures (temperature excursions in last-mile distribution) cause SAR 200M+ in product wastage annually across KSA — PIC/S GDP requires continuous temperature monitoring from manufacturer warehouse to pharmacy; most Saudi distributors only monitor at fixed warehousing points.",
          "Single-country API sourcing (India/China for 60%+ of global supply) was exposed as catastrophic during COVID-19 supply disruptions — WHO Essential Medicines Programme recommends a maximum 70% reliance on any single source country for critical medicines.",
        ],
        challengesAr: [
          "تخلق مهل تسجيل SFDA (12–24 شهرًا) مخاطر نفاد المخزون إذ لا يمكن استيراد المنتجات المنتظرة للتسجيل تجاريًا — يوصي ICH Q10 بخط تسجيل مستقبلي مدته 24 شهرًا يُدار مقابل توقّع المبيعات للحفاظ على توفر المنتج.",
          "تسبّب إخفاقات سلسلة التبريد (تجاوزات درجة الحرارة في توزيع الميل الأخير) هدرًا في المنتجات يتجاوز 200 مليون SAR سنويًا في المملكة — تتطلب GDP من PIC/S مراقبة مستمرة لدرجة الحرارة من مستودع المصنّع حتى الصيدلية؛ ومعظم الموزعين السعوديين يراقبون فقط عند نقاط تخزين ثابتة.",
          "تبيّن أن توريد المواد الفعّالة من دولة واحدة (الهند/الصين لأكثر من 60% من الإمداد العالمي) كارثي أثناء اضطرابات كوفيد-19 — يوصي برنامج الأدوية الأساسية من منظمة الصحة العالمية بحد أقصى 70% للاعتماد على أي دولة مصدر واحدة للأدوية الحرجة.",
        ],
        solution: "ISC implements WHO GDP-aligned multi-source procurement strategies, designs SFDA import pipeline management systems, and audits cold-chain infrastructure against PIC/S GDP PE 011-1 — reducing temperature excursion incidents by 85% and eliminating SFDA non-compliance risk.",
        solutionAr: "تطبّق ISC استراتيجيات توريد متعدد المصادر مواءَمة مع GDP من منظمة الصحة العالمية، وتصمّم أنظمة لإدارة خط استيراد SFDA، وتدقّق بنية سلسلة التبريد مقابل GDP من PIC/S PE 011-1 — مقللةً حوادث تجاوز درجة الحرارة بنسبة 85% ومزيلةً مخاطر عدم الامتثال لـ SFDA.",
      },
      {
        type: 'midstream',
        name: "Midstream — Pharmacy Operations, Inventory & Formulary Management",
        nameAr: "الوسط — عمليات الصيدلية والمخزون وإدارة القائمة الدوائية",
        color: "#2d8a5e",
        standards: ["APICS CPIM Module 3: Managing Inventory (Healthcare)", "American Society of Health-System Pharmacists (ASHP) Guidelines", "WHO Model Formulary Management Standard", "VEN/ABC Analysis (WHO Essential Medicines methodology)", "Joint Commission International (JCI) Supply Chain Standards"],
        processes: [
          "Hospital formulary management: DTC committee governance, VEN/ABC/XYZ analysis",
          "Demand forecasting: statistical models + physician consumption analysis (APICS IBF methodology)",
          "Reorder point & safety-stock optimisation: Days-on-Hand (DOH) target setting by category",
          "Expiry management: FEFO (First Expiry First Out) compliance, near-expiry redistribution",
          "Consignment & VMI programme management: negotiation, risk transfer & performance monitoring",
          "Controlled drug management: SFDA Schedule 1–5 procurement, storage & consumption recording",
        ],
        processesAr: [
          "إدارة القائمة الدوائية للمستشفى: حوكمة لجنة الأدوية والعلاجيات وتحليل VEN/ABC/XYZ",
          "التنبؤ بالطلب: نماذج إحصائية + تحليل استهلاك الأطباء (منهجية IBF من APICS)",
          "تحسين نقطة إعادة الطلب ومخزون الأمان: تحديد مستهدفات أيام التغطية (DOH) حسب الفئة",
          "إدارة انتهاء الصلاحية: الامتثال لـ FEFO (الأقرب انتهاءً يُصرف أولاً) وإعادة توزيع القريب من الانتهاء",
          "إدارة برامج البيع بالأمانة والمخزون المُدار من المورد: التفاوض ونقل المخاطر ومراقبة الأداء",
          "إدارة الأدوية الخاضعة للرقابة: شراء جداول SFDA 1–5 والتخزين وتسجيل الاستهلاك",
        ],
        flow: ["Formulary Review", "VEN/ABC Analysis", "DOH Targets", "VMI / PO Replenishment", "FEFO Dispensing"],
        flowAr: ["مراجعة القائمة الدوائية", "تحليل VEN/ABC", "مستهدفات أيام التغطية", "التجديد بالمخزون المُدار / أمر الشراء", "الصرف وفق FEFO"],
        challenges: [
          "Saudi hospital pharmacies carry an average 5.4 months of inventory vs. the JCI-recommended 2–2.5 months — ASHP Medication Management Standard requires pharmacy inventory reviews every 6 months using VEN/ABC analysis to right-size stocking levels by therapeutic category.",
          "Expiry wastage averaging 3–7% of pharmacy inventory value is preventable through FEFO inventory management and near-expiry return programmes — WHO GDP guidelines require documented FEFO procedures and monthly near-expiry stock reports.",
          "Antimicrobial stewardship (AMS) requirements under Saudi MoH Circular 2023 demand real-time antibiotic consumption data — this requires a pharmaceutical supply chain information system integrated with the hospital HIS, which most Saudi hospitals lack.",
        ],
        challengesAr: [
          "تحمل صيدليات المستشفيات السعودية في المتوسط مخزون 5.4 أشهر مقابل 2–2.5 شهر الموصى به من JCI — يتطلب معيار إدارة الأدوية من ASHP مراجعة مخزون الصيدلية كل 6 أشهر باستخدام تحليل VEN/ABC لضبط مستويات التخزين حسب الفئة العلاجية.",
          "هدر انتهاء الصلاحية الذي يبلغ متوسطه 3–7% من قيمة مخزون الصيدلية يمكن منعه عبر إدارة المخزون بـ FEFO وبرامج إرجاع القريب من الانتهاء — تتطلب إرشادات GDP من منظمة الصحة العالمية إجراءات FEFO موثّقة وتقارير شهرية للمخزون القريب من الانتهاء.",
          "تتطلب متطلبات ترشيد مضادات الميكروبات (AMS) بموجب تعميم وزارة الصحة السعودية 2023 بيانات استهلاك مضادات حيوية آنية — وهذا يستلزم نظام معلومات لسلسلة الإمداد الدوائية متكاملاً مع نظام معلومات المستشفى (HIS)، وهو ما يفتقر إليه معظم المستشفيات السعودية.",
        ],
        solution: "ISC builds JCI-compliant hospital pharmacy supply chain systems including VEN/ABC formulary management, ASHP-aligned demand forecasting, FEFO inventory controls, and VMI programmes with key suppliers — reducing pharmacy inventory from 5.4 to 2.8 months DOH and cutting wastage from 5% to under 1%.",
        solutionAr: "تبني ISC أنظمة سلسلة إمداد لصيدليات المستشفيات متوافقة مع JCI تشمل إدارة القائمة الدوائية بـ VEN/ABC والتنبؤ بالطلب المواءَم مع ASHP وضوابط مخزون FEFO وبرامج المخزون المُدار من المورد مع الموردين الرئيسيين — مقللةً مخزون الصيدلية من 5.4 إلى 2.8 شهر تغطية والهدر من 5% إلى أقل من 1%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Distribution, GDP Compliance & Traceability",
        nameAr: "المصب — التوزيع والامتثال لـ GDP والتتبّع",
        color: "#C9A84C",
        standards: ["PIC/S GDP Guidelines PE 011-1", "GS1 Healthcare Traceability Standard", "SFDA Track & Trace System (Salama)", "WHO Pre-qualification Programme for Distribution", "ISO 9001:2015 Healthcare Distribution"],
        processes: [
          "Pharmaceutical distribution network design: primary DC to hospital/pharmacy last-mile",
          "SFDA Salama track-and-trace compliance: serialisation, aggregation & verification scanning",
          "GDP transport qualification: lane validation, vehicle temperature monitoring & excursion response",
          "Hospital/pharmacy delivery: scheduled route planning, cold-chain integrity documentation",
          "Return goods management: SFDA-compliant recall procedures, suspect product quarantine",
          "Supplier performance scorecards: OTIF, order accuracy, temperature compliance & GDP audit findings",
        ],
        processesAr: [
          "تصميم شبكة التوزيع الدوائي: من مركز التوزيع الرئيسي إلى الميل الأخير للمستشفى/الصيدلية",
          "الامتثال لنظام التتبّع سلامة من SFDA: التسلسل والتجميع والمسح للتحقق",
          "تأهيل النقل وفق GDP: التحقق من المسارات ومراقبة درجة حرارة المركبات والاستجابة للتجاوزات",
          "التسليم للمستشفى/الصيدلية: تخطيط المسارات المجدولة وتوثيق سلامة سلسلة التبريد",
          "إدارة البضائع المرتجعة: إجراءات السحب المتوافقة مع SFDA وحجر المنتجات المشتبه بها",
          "بطاقات أداء الموردين: OTIF ودقة الطلب والامتثال لدرجة الحرارة ونتائج تدقيق GDP",
        ],
        flow: ["Distribution Order", "GDP Despatch Check", "Cold-Chain Transport", "Pharmacy Delivery", "Salama Scan & POD"],
        flowAr: ["أمر التوزيع", "فحص الإرسال وفق GDP", "نقل سلسلة التبريد", "التسليم للصيدلية", "مسح سلامة وإثبات التسليم"],
        challenges: [
          "SFDA Salama track-and-trace serialisation requirements are now mandatory for all pharmaceutical products in Saudi Arabia — distributors without serialisation infrastructure face SAR 1M+ fines and supply licence revocation.",
          "GDP transport lane qualification (required for cold-chain products by PIC/S GDP PE 011-1 Section 9) is absent in most Saudi pharmaceutical distributors — a single undocumented temperature excursion during transport can invalidate an entire cold-chain shipment.",
          "Hospital pharmaceutical recalls (averaging 3–4 SFDA Class II recalls per year in KSA) require 24-hour product traceability to the patient level — without GS1 Healthcare serialisation, hospitals cannot comply with SFDA recall notification requirements.",
        ],
        challengesAr: [
          "أصبحت متطلبات التسلسل والتتبّع في نظام سلامة من SFDA إلزامية لجميع المنتجات الدوائية في المملكة — يواجه الموزعون الذين يفتقرون إلى بنية التسلسل غرامات تتجاوز مليون SAR وإلغاء رخصة التوريد.",
          "تأهيل مسارات النقل وفق GDP (المطلوب لمنتجات سلسلة التبريد بموجب القسم 9 من PIC/S GDP PE 011-1) غائب لدى معظم موزعي الأدوية السعوديين — يمكن لتجاوز واحد غير موثّق لدرجة الحرارة أثناء النقل أن يُبطل شحنة سلسلة تبريد كاملة.",
          "تتطلب عمليات سحب الأدوية من المستشفيات (بمتوسط 3–4 عمليات سحب من الفئة الثانية سنويًا في المملكة) تتبّعًا للمنتج خلال 24 ساعة حتى مستوى المريض — بدون تسلسل GS1 للرعاية الصحية، لا تستطيع المستشفيات الامتثال لمتطلبات إشعار السحب من SFDA.",
        ],
        solution: "ISC designs SFDA Salama-compliant pharmaceutical distribution systems, implements GS1 Healthcare traceability programmes, and qualifies cold-chain transport lanes to PIC/S GDP standard — achieving 100% SFDA traceability compliance and eliminating all temperature excursion incidents.",
        solutionAr: "تصمّم ISC أنظمة توزيع دوائي متوافقة مع نظام سلامة من SFDA، وتطبّق برامج تتبّع GS1 للرعاية الصحية، وتؤهّل مسارات نقل سلسلة التبريد وفق معيار GDP من PIC/S — محققةً امتثالاً كاملاً لتتبّع SFDA بنسبة 100% ومزيلةً جميع حوادث تجاوز درجة الحرارة.",
      },
    ],
    cases: [
      { client: "Leading Saudi Pharmaceutical Group", clientAr: "مجموعة دوائية سعودية رائدة", challenge: "47 unqualified suppliers; no GDP audit programme; SFDA import delays averaging 45 days; 30-day payment disputes", challengeAr: "47 موردًا غير مؤهَّل؛ لا يوجد برنامج تدقيق GDP؛ تأخيرات استيراد SFDA بمتوسط 45 يومًا؛ نزاعات سداد 30 يومًا", result: "GDP audit programme implemented; import delays cut to 12 days; 23% procurement cost reduction; 94% on-time payment rate", resultAr: "تطبيق برنامج تدقيق GDP؛ خفض تأخيرات الاستيراد إلى 12 يومًا؛ خفض تكلفة المشتريات بنسبة 23%؛ معدل سداد في الوقت المحدد 94%" },
      { client: "GCC Hospital Network (12 facilities)", clientAr: "شبكة مستشفيات خليجية (12 منشأة)", challenge: "5.4 months inventory DOH; 5.2% expiry waste; 12 simultaneous critical medicine stock-outs; JCI non-conformance", challengeAr: "مخزون بتغطية 5.4 أشهر؛ هدر انتهاء صلاحية 5.2%؛ 12 حالة نفاد متزامنة لأدوية حرجة؛ عدم مطابقة لـ JCI", result: "2.8 months DOH; 1.1% wastage; zero critical stock-outs for 18 months; JCI supply chain standard achieved", resultAr: "تغطية 2.8 شهر؛ هدر 1.1%؛ صفر حالات نفاد حرجة لمدة 18 شهرًا؛ تحقيق معيار سلسلة الإمداد من JCI" },
    ],
  },

  retail: {
    name: "Retail & FMCG",
    nameAr: "التجزئة والسلع الاستهلاكية سريعة الحركة",
    tagline: "Demand-driven supply chains for the Kingdom's growing consumer market",
    taglineAr: "سلاسل إمداد مدفوعة بالطلب لسوق المستهلكين المتنامي في المملكة",
    intro: "Saudi Arabia's retail sector — the largest in MENA at SAR 500B+ — is being reshaped by e-commerce growth (35% YoY), Vision 2030 lifestyle changes, and global FMCG players entering the market. CIPS Category Management Standard, APICS IBF demand forecasting methodologies, ECR (Efficient Consumer Response) best practices, and GS1 supply chain standards define the professional framework for demand-driven, omnichannel supply chain excellence in GCC retail.",
    introAr: "يُعاد تشكيل قطاع التجزئة في المملكة العربية السعودية — الأكبر في الشرق الأوسط وشمال إفريقيا بأكثر من 500 مليار SAR — بفعل نمو التجارة الإلكترونية (35% سنويًا) وتغيّرات نمط الحياة ضمن رؤية 2030 ودخول كبار مشغّلي السلع الاستهلاكية العالميين إلى السوق. تحدد معيار إدارة الفئات من CIPS ومنهجيات التنبؤ بالطلب من APICS IBF وأفضل ممارسات الاستجابة الفعّالة للمستهلك (ECR) ومعايير سلسلة الإمداد GS1 الإطار المهني للتميّز في سلسلة الإمداد المدفوعة بالطلب ومتعددة القنوات في تجزئة دول الخليج.",
    icon: ShoppingCart,
    heroColor: "#6b1a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Category Management, Supplier Management & Trading Terms",
        nameAr: "المنبع — إدارة الفئات وإدارة الموردين والشروط التجارية",
        color: "#6b1a1a",
        standards: ["CIPS Category Management 7-Step Model", "ECR Europe Category Management Best Practices", "CPSM Module 1: Supply Management Strategy", "GS1 Product Information Management Standard", "CIPS Supplier Relationship Management Framework"],
        processes: [
          "Category strategy development: shopper insights, market data & CIPS Category Cube",
          "Supplier segmentation: strategic / preferred / transactional tiers (Kraljic Matrix)",
          "Joint Business Planning (JBP): annual volume commitments, promotional funding & NPD pipeline",
          "Trading terms negotiation: listing fees, rebates, promotional support & payment terms",
          "GS1 product data synchronisation: GTIN registration, product data quality & item master management",
          "Private label supplier development: product brief, factory audit & quality specification",
        ],
        processesAr: [
          "تطوير استراتيجية الفئة: رؤى المتسوّقين وبيانات السوق ومكعّب الفئات من CIPS",
          "تجزئة الموردين: فئات استراتيجية / مفضّلة / تعاملية (مصفوفة كرالجيك)",
          "التخطيط التجاري المشترك (JBP): التزامات الحجم السنوية وتمويل العروض وخط تطوير المنتجات الجديدة",
          "التفاوض على الشروط التجارية: رسوم الإدراج والحسومات ودعم العروض وشروط السداد",
          "مزامنة بيانات المنتجات GS1: تسجيل GTIN وجودة بيانات المنتج وإدارة السجل الرئيسي للأصناف",
          "تطوير موردي العلامة الخاصة: موجز المنتج وتدقيق المصنع ومواصفات الجودة",
        ],
        flow: ["Category Review", "Supplier Segmentation", "JBP Agreement", "Trading Terms", "Category Performance Review"],
        flowAr: ["مراجعة الفئة", "تجزئة الموردين", "اتفاقية JBP", "الشروط التجارية", "مراجعة أداء الفئة"],
        challenges: [
          "Supermarket chains managing 1,000–3,000 suppliers allocate equal management time to all — CIPS Supplier Segmentation Model and Kraljic Matrix analysis typically reveal that 80% of value comes from 15–20% of suppliers; re-allocating management effort generates 10–15% additional margin.",
          "Trading terms negotiations are transactional rather than value-creating — ECR Europe Best Practices show that retailers implementing structured JBP with top 20 suppliers achieve 8–12% category growth vs. 2–3% for non-JBP managed categories.",
          "Private label remains underdeveloped in GCC retail (8% penetration vs. 35–40% in UK/Germany) — CIPS Private Label Procurement Guide provides the sourcing and quality specification framework to develop margin-accretive own-brand ranges.",
        ],
        challengesAr: [
          "تخصّص سلاسل المتاجر الكبرى التي تدير 1,000–3,000 مورد وقت إدارة متساويًا للجميع — تكشف نموذج تجزئة الموردين من CIPS وتحليل مصفوفة كرالجيك عادةً أن 80% من القيمة تأتي من 15–20% من الموردين؛ إعادة توزيع جهد الإدارة يولّد هامشًا إضافيًا بنسبة 10–15%.",
          "مفاوضات الشروط التجارية تعاملية بدلاً من أن تخلق قيمة — تُظهر أفضل ممارسات ECR أوروبا أن تجار التجزئة الذين يطبّقون JBP منظمًا مع أفضل 20 موردًا يحققون نمو فئة 8–12% مقابل 2–3% للفئات غير المُدارة بـ JBP.",
          "تظل العلامة الخاصة غير مطوَّرة في تجزئة دول الخليج (انتشار 8% مقابل 35–40% في المملكة المتحدة/ألمانيا) — يوفر دليل مشتريات العلامة الخاصة من CIPS إطار التوريد ومواصفات الجودة لتطوير تشكيلات علامة خاصة معزّزة للهامش.",
        ],
        solution: "ISC implements CIPS Category Management methodology and ECR-aligned JBP frameworks with top suppliers — reallocating management effort via Kraljic Matrix, building JBP programmes with 20 strategic suppliers, and launching private label development — delivering 3–5% margin improvement.",
        solutionAr: "تطبّق ISC منهجية إدارة الفئات من CIPS وأطر JBP المواءَمة مع ECR مع كبار الموردين — بإعادة توزيع جهد الإدارة عبر مصفوفة كرالجيك وبناء برامج JBP مع 20 موردًا استراتيجيًا وإطلاق تطوير العلامة الخاصة — محققةً تحسّنًا في الهامش بنسبة 3–5%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Demand Planning, S&OP & Inventory Management",
        nameAr: "الوسط — تخطيط الطلب والتخطيط المتكامل للمبيعات والعمليات وإدارة المخزون",
        color: "#8b2020",
        standards: ["APICS IBF (Institute of Business Forecasting) Best Practices", "APICS CPIM Module 3: Managing Inventory", "ECR Efficient Replenishment Standard", "APICS S&OP Process Design", "GS1 Demand Signal Repository Standard"],
        processes: [
          "Statistical demand forecasting: time-series, causal & machine-learning models (APICS IBF Level 3)",
          "Ramadan / Hajj / seasonal demand surge planning: uplift factors & promotional stock pre-build",
          "S&OP cycle management: demand review, supply review & executive consensus meeting",
          "DC inventory management: ABC velocity analysis, safety-stock modelling & reorder optimisation",
          "Promotion management: promotional volume planning, cannibalism modelling & post-promo analysis",
          "Waste management: perishables DOH targets, markdown triggers & supplier return programmes",
        ],
        processesAr: [
          "التنبؤ الإحصائي بالطلب: نماذج السلاسل الزمنية والسببية والتعلّم الآلي (APICS IBF المستوى 3)",
          "تخطيط ذروة الطلب في رمضان/الحج/المواسم: عوامل الزيادة والبناء المسبق لمخزون العروض",
          "إدارة دورة التخطيط المتكامل للمبيعات والعمليات: مراجعة الطلب ومراجعة الإمداد واجتماع الإجماع التنفيذي",
          "إدارة مخزون مركز التوزيع: تحليل سرعة ABC ونمذجة مخزون الأمان وتحسين إعادة الطلب",
          "إدارة العروض: تخطيط حجم العروض ونمذجة التآكل وتحليل ما بعد العرض",
          "إدارة الهدر: مستهدفات تغطية القابل للتلف ومحفّزات التخفيض وبرامج إرجاع الموردين",
        ],
        flow: ["POS Data Capture", "Statistical Forecast", "S&OP Consensus", "Replenishment Order", "DC to Store"],
        flowAr: ["التقاط بيانات نقاط البيع", "التنبؤ الإحصائي", "إجماع التخطيط المتكامل", "أمر التجديد", "من المركز إلى المتجر"],
        challenges: [
          "Ramadan demand surges of 200–400% on specific categories cause simultaneous out-of-stocks and overstock — APICS IBF recommends category-specific seasonal adjustment factors built from 3-year POS history, not ad-hoc buyer estimates.",
          "Siloed buying and logistics functions mean promotional volumes are not integrated into replenishment plans — ECR Efficient Replenishment Standard requires a unified promotional demand management process that spans buying, supply chain, and logistics.",
          "Perishables wastage of 8–15% driven by LIFO (instead of FEFO) store rotation is preventable — GS1 Traceability Standard with shelf-life data in the barcode enables automated FEFO rotation in DC and store, reducing wastage to 2–4%.",
        ],
        challengesAr: [
          "تسبّب موجات الطلب في رمضان بنسبة 200–400% على فئات محددة نفادًا وفائضًا متزامنين — يوصي APICS IBF بعوامل تعديل موسمية خاصة بكل فئة مبنية على سجل نقاط بيع لثلاث سنوات، لا على تقديرات آنية من المشترين.",
          "انفصال وظائف الشراء واللوجستيات يعني عدم دمج أحجام العروض في خطط التجديد — يتطلب معيار التجديد الفعّال من ECR عملية موحّدة لإدارة طلب العروض تمتد عبر الشراء وسلسلة الإمداد واللوجستيات.",
          "هدر القابل للتلف بنسبة 8–15% الناتج عن التدوير في المتجر بأسلوب LIFO (بدلاً من FEFO) يمكن منعه — يتيح معيار التتبّع GS1 ببيانات مدة الصلاحية في الباركود تدويرًا آليًا بـ FEFO في المركز والمتجر، مقللاً الهدر إلى 2–4%.",
        ],
        solution: "ISC implements APICS IBF-aligned demand planning systems with Ramadan/seasonal adjustment factors, designs ECR-compliant S&OP cycles integrating buying and logistics, and implements GS1-enabled FEFO systems — reducing forecast error by 30%, out-of-stocks by 50%, and perishables wastage by 60%.",
        solutionAr: "تطبّق ISC أنظمة تخطيط طلب مواءَمة مع APICS IBF بعوامل تعديل رمضانية/موسمية، وتصمّم دورات تخطيط متكامل للمبيعات والعمليات متوافقة مع ECR تدمج الشراء واللوجستيات، وتطبّق أنظمة FEFO مدعومة بـ GS1 — مقللةً خطأ التنبؤ بنسبة 30% والنفاد بنسبة 50% وهدر القابل للتلف بنسبة 60%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Omnichannel Fulfilment, Last-Mile & Returns",
        nameAr: "المصب — التلبية متعددة القنوات والميل الأخير والمرتجعات",
        color: "#C9A84C",
        standards: ["APICS SCOR Deliver Domain (D1–D4)", "CSCMP Last-Mile Delivery Best Practices", "WERC Omnichannel Fulfilment Metrics", "GS1 E-commerce Traceability Standard", "APICS SCOR Return Domain (SR/DR)"],
        processes: [
          "Omnichannel OMS: unified inventory across stores, DC, and e-commerce (WERC DF-KPI-6)",
          "DC fulfilment: B2B store replenishment, B2C e-commerce pick-pack-ship & click-and-collect",
          "Last-mile carrier management: carrier KPI framework, route optimisation & SLA governance",
          "E-commerce delivery: same-day / next-day SLA commitment, dynamic routing & customer notifications",
          "Returns management: APICS SCOR DR (Defective Return) process — authorisation, receipt, credit & disposal",
          "Supply chain visibility: end-to-end order tracking, carrier API integration & customer communications",
        ],
        processesAr: [
          "نظام إدارة الطلبات متعدد القنوات: مخزون موحّد عبر المتاجر ومركز التوزيع والتجارة الإلكترونية (WERC DF-KPI-6)",
          "تلبية مركز التوزيع: تجديد المتاجر B2B وانتقاء وتغليف وشحن التجارة الإلكترونية B2C والشراء والاستلام",
          "إدارة ناقلي الميل الأخير: إطار مؤشرات أداء الناقل وتحسين المسارات وحوكمة اتفاقيات مستوى الخدمة",
          "توصيل التجارة الإلكترونية: التزام اتفاقية توصيل في نفس اليوم/اليوم التالي والتوجيه الديناميكي وإشعارات العملاء",
          "إدارة المرتجعات: عملية إرجاع المعيب من APICS SCOR — التفويض والاستلام والائتمان والتخلص",
          "رؤية سلسلة الإمداد: تتبّع الطلب من طرف لطرف وتكامل واجهة الناقل ومراسلات العملاء",
        ],
        flow: ["Order Capture (OMS)", "ATP & Channel Allocation", "DC Pick & Pack", "Carrier Handoff", "POD & Returns Processing"],
        flowAr: ["التقاط الطلب (OMS)", "التوفّر وتوزيع القنوات", "انتقاء وتغليف المركز", "التسليم للناقل", "إثبات التسليم ومعالجة المرتجعات"],
        challenges: [
          "Separate online and offline inventory systems cause simultaneous overselling online and dead stock in stores — WERC recommends a single unified inventory view (UII) across all channels as the foundational omnichannel capability, before any other digital investment.",
          "Last-mile delivery cost averaging SAR 22–35 per order makes e-commerce structurally loss-making below SAR 150 order values — CSCMP route optimisation benchmarks show top-quartile operators achieve SAR 14–18 per delivery through dynamic route clustering.",
          "High return rates (12–20% in fashion/electronics) with no reverse logistics infrastructure create unrecovered inventory value — APICS SCOR Return domain benchmarks show best-in-class retailers process returns within 5 days vs. GCC average of 21 days, recovering 40% more inventory value.",
        ],
        challengesAr: [
          "انفصال أنظمة المخزون عبر الإنترنت وخارجه يسبّب بيعًا زائدًا عبر الإنترنت ومخزونًا راكدًا في المتاجر في آنٍ واحد — يوصي WERC برؤية مخزون موحّدة واحدة عبر جميع القنوات باعتبارها القدرة الأساسية متعددة القنوات قبل أي استثمار رقمي آخر.",
          "تكلفة توصيل الميل الأخير التي تبلغ متوسطها 22–35 SAR للطلب تجعل التجارة الإلكترونية خاسرة هيكليًا دون قيمة طلب 150 SAR — تُظهر معايير تحسين المسارات من CSCMP أن مشغّلي الربع الأعلى يحققون 14–18 SAR للتوصيل عبر تجميع المسارات الديناميكي.",
          "معدلات الإرجاع المرتفعة (12–20% في الأزياء/الإلكترونيات) دون بنية لوجستيات عكسية تخلق قيمة مخزون غير مستردة — تُظهر معايير مجال الإرجاع من APICS SCOR أن أفضل تجار التجزئة يعالجون المرتجعات خلال 5 أيام مقابل متوسط 21 يومًا في دول الخليج، مسترجعين قيمة مخزون أعلى بنسبة 40%.",
        ],
        solution: "ISC designs unified omnichannel OMS architectures aligned with WERC standards, implements CSCMP-benchmarked last-mile carrier frameworks, and builds APICS SCOR Return-compliant reverse logistics programmes — reducing last-mile cost by 25–35% and return processing cost by 40%.",
        solutionAr: "تصمّم ISC بنى أنظمة إدارة طلبات موحّدة متعددة القنوات مواءَمة مع معايير WERC، وتطبّق أطر ناقلي الميل الأخير المعيارية من CSCMP، وتبني برامج لوجستيات عكسية متوافقة مع مجال الإرجاع من APICS SCOR — مقللةً تكلفة الميل الأخير بنسبة 25–35% وتكلفة معالجة المرتجعات بنسبة 40%.",
      },
    ],
    cases: [
      { client: "Saudi Regional Retail Chain (120+ Stores)", clientAr: "سلسلة تجزئة سعودية إقليمية (أكثر من 120 متجرًا)", challenge: "15–20% OOS during peaks; SAR 4.5M overstock write-offs; no S&OP; APICS IBF assessment score 38%", challengeAr: "نفاد مخزون 15–20% في الذروة؛ شطب فائض بقيمة 4.5 مليون SAR؛ لا يوجد تخطيط متكامل؛ درجة تقييم APICS IBF 38%", result: "67% OOS reduction; 31% inventory cost reduction; SAR 4.5M working capital released; APICS IBF score raised to 74%", resultAr: "خفض النفاد بنسبة 67%؛ خفض تكلفة المخزون بنسبة 31%؛ تحرير رأس مال عامل بقيمة 4.5 مليون SAR؛ رفع درجة APICS IBF إلى 74%" },
      { client: "Saudi FMCG Distributor", clientAr: "موزّع سلع استهلاكية سعودي", challenge: "Forecast error 38%; expedited POs 28%; no ECR Efficient Replenishment; carrier SLA at 76%", challengeAr: "خطأ تنبؤ 38%؛ أوامر شراء عاجلة 28%؛ لا يوجد تجديد فعّال ECR؛ اتفاقية مستوى خدمة الناقل 76%", result: "Forecast error 14%; expedited POs 6%; carrier SLA 97.2%; SAR 1.8M annual logistics savings", resultAr: "خطأ تنبؤ 14%؛ أوامر شراء عاجلة 6%؛ اتفاقية مستوى خدمة الناقل 97.2%؛ وفورات لوجستية سنوية بقيمة 1.8 مليون SAR" },
    ],
  },

  logistics: {
    name: "Logistics & Distribution",
    nameAr: "اللوجستيات والتوزيع",
    tagline: "Building the distribution backbone for the Kingdom's trade ambitions",
    taglineAr: "بناء العمود الفقري للتوزيع لطموحات المملكة التجارية",
    intro: "Saudi Arabia's National Transport and Logistics Strategy targets a top-10 global logistics ranking by 2030, with SAR 100B+ invested in logistics infrastructure. CSCMP Supply Chain Management Principles, APICS CSCP, the Logistics Management Institute (LMI) network design methodology, and ISO 9001:2015 for logistics service providers define the professional standards framework for world-class 3PL and logistics operations in the Kingdom.",
    introAr: "تستهدف الاستراتيجية الوطنية للنقل والخدمات اللوجستية في المملكة العربية السعودية دخول أفضل 10 مراكز لوجستية عالميًا بحلول 2030، باستثمار يتجاوز 100 مليار SAR في البنية التحتية اللوجستية. تحدد مبادئ إدارة سلسلة الإمداد من CSCMP وشهادة APICS CSCP ومنهجية تصميم الشبكات من معهد إدارة اللوجستيات (LMI) وISO 9001:2015 لمزوّدي الخدمات اللوجستية إطار المعايير المهنية لعمليات الطرف الثالث اللوجستية عالمية المستوى في المملكة.",
    icon: Truck,
    heroColor: "#6b4a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Fleet & Equipment Procurement, Fuel & Carrier Contracts",
        nameAr: "المنبع — شراء الأسطول والمعدات والوقود وعقود الناقلين",
        color: "#6b4a1a",
        standards: ["CIPS Fleet Category Management Standard", "CPSM Module 2: Supplier Selection & Management", "CSCMP Freight Procurement Best Practices", "ISO 14001:2015 Fleet Environmental Management", "IACCM Carrier Contract Standard"],
        processes: [
          "Fleet procurement strategy: buy vs. lease vs. outsource (TCO modelling per CIPS Fleet Guide)",
          "Vehicle specification & tender: LCV/HCV, refrigerated, flatbed — technical spec development",
          "Fuel management: bulk fuel contracts, fuel card procurement & consumption benchmarking",
          "Carrier and 3PL tender: RFQ design, rate card negotiation & IACCM-aligned SLA contracts",
          "Equipment & racking procurement: MHE tender, WMS hardware & IoT device sourcing",
          "Tyre, maintenance & MRO contracts: lifecycle costing, service level agreements & pooling",
        ],
        processesAr: [
          "استراتيجية شراء الأسطول: الشراء مقابل التأجير مقابل التعهيد (نمذجة التكلفة الكلية وفق دليل الأسطول من CIPS)",
          "مواصفات المركبات والمناقصة: المركبات الخفيفة/الثقيلة والمبردة والمسطحة — تطوير المواصفات الفنية",
          "إدارة الوقود: عقود الوقود بالجملة وشراء بطاقات الوقود والمقارنة المعيارية للاستهلاك",
          "مناقصة الناقلين والطرف الثالث اللوجستي: تصميم طلب الأسعار والتفاوض على جدول الأسعار وعقود اتفاقيات مستوى الخدمة المواءَمة مع IACCM",
          "شراء المعدات والرفوف: مناقصة معدات المناولة وأجهزة نظام إدارة المستودعات وتوريد أجهزة إنترنت الأشياء",
          "عقود الإطارات والصيانة وقطع الغيار: حساب تكلفة دورة الحياة واتفاقيات مستوى الخدمة والتجميع",
        ],
        flow: ["Fleet Strategy", "TCO Analysis", "Tender & Award", "Carrier Contract", "Performance Review"],
        flowAr: ["استراتيجية الأسطول", "تحليل التكلفة الكلية", "المناقصة والترسية", "عقد الناقل", "مراجعة الأداء"],
        challenges: [
          "Fleet ownership without TCO analysis is a common error — CIPS Fleet Procurement Guide shows lease-vs-buy TCO analysis consistently favours operating lease for urban LCVs but ownership for long-haul HCV fleets; incorrect decisions inflate total fleet cost by 15–20%.",
          "Fuel represents 30–40% of logistics operating cost and is procured transactionally by most Saudi 3PLs — CSCMP recommends a structured bulk fuel tender with price-cap options and volume rebates, reducing fuel cost by 8–12% vs. spot purchasing.",
          "Carrier fragmentation (managing 10–20 logistics providers with no master contract framework) creates inconsistent SLAs and no volume leverage — IACCM research shows that rationalising to 3–5 preferred carriers with volume-committed contracts reduces freight cost by 15–22%.",
        ],
        challengesAr: [
          "امتلاك الأسطول دون تحليل التكلفة الكلية خطأ شائع — يُظهر دليل شراء الأسطول من CIPS أن تحليل التأجير مقابل الشراء يفضّل باستمرار التأجير التشغيلي للمركبات الخفيفة الحضرية لكن الامتلاك لأساطيل المركبات الثقيلة طويلة المدى؛ القرارات الخاطئة ترفع إجمالي تكلفة الأسطول بنسبة 15–20%.",
          "يمثّل الوقود 30–40% من تكلفة التشغيل اللوجستية ويُشترى بشكل تعاملي لدى معظم مشغّلي الطرف الثالث السعوديين — يوصي CSCMP بمناقصة وقود بالجملة منظمة بخيارات سقف سعري وحسومات حجم، مقللةً تكلفة الوقود بنسبة 8–12% مقابل الشراء الفوري.",
          "تجزّؤ الناقلين (إدارة 10–20 مزوّدًا لوجستيًا دون إطار عقد رئيسي) يخلق اتفاقيات مستوى خدمة غير متسقة ولا قدرة تفاوض على الحجم — تُظهر أبحاث IACCM أن الترشيد إلى 3–5 ناقلين مفضّلين بعقود ملتزمة بالحجم يخفض تكلفة الشحن بنسبة 15–22%.",
        ],
        solution: "ISC conducts CIPS-aligned fleet TCO analysis, runs CSCMP-framework carrier tenders, and designs IACCM-compliant carrier contracts with volume commitments, KPI-linked pricing, and penalty mechanisms — typically reducing procurement-controllable logistics cost by 18–25%.",
        solutionAr: "تُجري ISC تحليل تكلفة كلية للأسطول مواءَمًا مع CIPS، وتدير مناقصات ناقلين وفق إطار CSCMP، وتصمّم عقود ناقلين متوافقة مع IACCM بالتزامات حجم وتسعير مرتبط بمؤشرات الأداء وآليات غرامات — مقللةً عادةً التكلفة اللوجستية القابلة للتحكم عبر المشتريات بنسبة 18–25%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Network Design, Warehouse Operations & Technology",
        nameAr: "الوسط — تصميم الشبكة وعمليات المستودعات والتقنية",
        color: "#8b6320",
        standards: ["APICS CSCP Module 3: Supply Chain Design", "WERC Annual DC Metrics Survey (KPI benchmarks)", "LMI Network Optimisation Methodology", "ISO 9001:2015 Clause 8 (Operations)", "APICS SCOR Plan & Source Domains"],
        processes: [
          "Logistics network optimisation: gravity modelling, node-count analysis & scenario planning (APICS CSCP)",
          "Warehouse slotting: velocity-based, ergonomic & weight-profile slotting (WERC best practice)",
          "WMS selection, implementation & go-live: functional gap analysis, vendor evaluation & UAT",
          "Labour productivity measurement: WERC KPIs — picks/hour, lines/hour, cost/unit shipped",
          "Route planning & TMS: dynamic routing, multi-drop optimisation & real-time visibility",
          "Lean warehouse process design: 5S, value stream mapping & waste elimination (Shingo Prize methodology)",
        ],
        processesAr: [
          "تحسين الشبكة اللوجستية: النمذجة الجاذبية وتحليل عدد العُقد وتخطيط السيناريوهات (APICS CSCP)",
          "تخصيص مواقع المستودع: التخصيص حسب السرعة والراحة الحركية وملف الوزن (أفضل ممارسات WERC)",
          "اختيار نظام إدارة المستودعات وتطبيقه وإطلاقه: تحليل الفجوات الوظيفية وتقييم المورد واختبار قبول المستخدم",
          "قياس إنتاجية العمالة: مؤشرات WERC — عمليات الانتقاء/الساعة والأسطر/الساعة والتكلفة/الوحدة المشحونة",
          "تخطيط المسارات ونظام إدارة النقل: التوجيه الديناميكي وتحسين التوصيل متعدد النقاط والرؤية الآنية",
          "تصميم عمليات مستودع رشيقة: 5S ورسم خرائط تدفّق القيمة وإزالة الهدر (منهجية جائزة شينغو)",
        ],
        flow: ["Network Baseline", "Gravity Model", "Footprint Decision", "WMS Go-Live", "WERC KPI Monitoring"],
        flowAr: ["خط أساس الشبكة", "النموذج الجاذبي", "قرار البصمة", "إطلاق نظام إدارة المستودعات", "مراقبة مؤشرات WERC"],
        challenges: [
          "Fleet utilisation averaging 58–65% across Saudi 3PLs is significantly below the WERC benchmark of 80–85% — indicating poor route planning, imbalanced load scheduling, and absence of a TMS; closing this gap alone reduces cost-per-pallet by 15–20%.",
          "Manual, paper-based warehouse operations with pick accuracy of 92–95% vs. the WERC WMS-enabled benchmark of 99.5%+ create customer SLA breaches and rework cost — WERC data shows WMS investment has a median payback of 14 months in operations above 50 picks/hour.",
          "Network footprints designed pre-2020 are no longer optimal — new Vision 2030 economic zones (NEOM, KAEC, Diriyah) have shifted demand gravity centres significantly; APICS CSCP recommends a full network re-baseline every 3–5 years or after >15% demand pattern change.",
        ],
        challengesAr: [
          "استخدام الأسطول بمتوسط 58–65% لدى مشغّلي الطرف الثالث السعوديين أدنى بكثير من معيار WERC البالغ 80–85% — مما يشير إلى ضعف تخطيط المسارات وعدم توازن جدولة الأحمال وغياب نظام إدارة النقل؛ سد هذه الفجوة وحده يخفض التكلفة لكل منصة نقالة بنسبة 15–20%.",
          "عمليات المستودعات اليدوية الورقية بدقة انتقاء 92–95% مقابل معيار WERC المدعوم بنظام إدارة المستودعات البالغ 99.5%+ تسبّب مخالفات لاتفاقيات مستوى خدمة العملاء وتكلفة إعادة عمل — تُظهر بيانات WERC أن استثمار نظام إدارة المستودعات له فترة استرداد وسطية 14 شهرًا في العمليات التي تتجاوز 50 عملية انتقاء/الساعة.",
          "بصمات الشبكات المصمَّمة قبل 2020 لم تعد مثلى — حوّلت المناطق الاقتصادية الجديدة ضمن رؤية 2030 (نيوم، مدينة الملك عبدالله الاقتصادية، الدرعية) مراكز جاذبية الطلب بشكل كبير؛ يوصي APICS CSCP بإعادة تأسيس كاملة للشبكة كل 3–5 سنوات أو بعد تغيّر نمط الطلب بأكثر من 15%.",
        ],
        solution: "ISC delivers APICS CSCP-aligned network optimisation studies, WERC-benchmarked warehouse operational improvements, and WMS implementation programmes — increasing fleet utilisation to 79%+, pick accuracy to 99.4%, and delivering 20–30% labour cost reduction.",
        solutionAr: "تقدّم ISC دراسات تحسين شبكة مواءَمة مع APICS CSCP وتحسينات تشغيلية للمستودعات معيارية وفق WERC وبرامج تطبيق نظام إدارة المستودعات — رافعةً استخدام الأسطول إلى أكثر من 79% ودقة الانتقاء إلى 99.4% ومحققةً خفض تكلفة العمالة بنسبة 20–30%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Customer SLA Management, Last-Mile & Risk",
        nameAr: "المصب — إدارة اتفاقيات مستوى خدمة العملاء والميل الأخير والمخاطر",
        color: "#C9A84C",
        standards: ["CSCMP OTIF (On-Time In-Full) Measurement Standard", "APICS SCOR Deliver Metrics (RL.2.1–RL.2.4)", "ISO 22301:2019 Business Continuity Management", "IACCM Service Contract KPI Framework", "CSCMP Risk Management in Logistics"],
        processes: [
          "Customer SLA design: OTIF, order-to-delivery lead time & damage-rate commitments",
          "SCOR Deliver metrics dashboard: RL.2.1 (Perfect Order Fulfilment), AM.2.1 (Cash-to-Cash)",
          "Last-mile delivery management: proof of delivery (POD), customer notification & exception handling",
          "Business continuity planning (BCP): ISO 22301 risk register, recovery time objectives & testing",
          "Logistics risk management: single-source dependencies, cyber risk, weather & geopolitical mapping",
          "Customer dispute management: IACCM SLA measurement, penalty administration & root-cause analysis",
        ],
        processesAr: [
          "تصميم اتفاقيات مستوى خدمة العملاء: OTIF ومهلة الطلب حتى التسليم والتزامات معدل التلف",
          "لوحة مؤشرات تسليم SCOR: RL.2.1 (تلبية الطلب المثالي)، AM.2.1 (النقد إلى النقد)",
          "إدارة توصيل الميل الأخير: إثبات التسليم وإشعار العميل ومعالجة الاستثناءات",
          "تخطيط استمرارية الأعمال (BCP): سجل مخاطر ISO 22301 وأهداف زمن التعافي والاختبار",
          "إدارة المخاطر اللوجستية: تبعيات المصدر الوحيد ومخاطر السيبرانية والطقس ورسم الخرائط الجيوسياسية",
          "إدارة نزاعات العملاء: قياس اتفاقية مستوى الخدمة وفق IACCM وإدارة الغرامات وتحليل السبب الجذري",
        ],
        flow: ["Customer Order", "Despatch & Route", "Last-Mile Delivery", "POD Capture", "SCOR KPI Reporting"],
        flowAr: ["طلب العميل", "الإرسال والمسار", "توصيل الميل الأخير", "التقاط إثبات التسليم", "تقارير مؤشرات SCOR"],
        challenges: [
          "Most Saudi 3PLs cannot report APICS SCOR Perfect Order Fulfilment (RL.2.1) — the industry gold-standard metric — because they track delivery separately from order accuracy, completeness, and documentation; world-class operators achieve 97%+ POF.",
          "Single-source dependencies on key technology systems (WMS, TMS) without BCP create catastrophic operational risk — ISO 22301 requires documented RTO (Recovery Time Objective) and RPO (Recovery Point Objective) for all critical systems, with annual tested rehearsal.",
          "Cyber-attack risk on logistics management systems (WMS, TMS, EDI) is growing but unaddressed — the 2021 Transnet ransomware attack (South Africa) shut a major port operator for 7 days; CSCMP recommends cyber risk as a Tier-1 supply chain risk from 2024.",
        ],
        challengesAr: [
          "لا يستطيع معظم مشغّلي الطرف الثالث السعوديين رفع تقارير تلبية الطلب المثالي من APICS SCOR (RL.2.1) — المقياس الذهبي في القطاع — لأنهم يتتبّعون التسليم بمعزل عن دقة الطلب واكتماله وتوثيقه؛ يحقق المشغّلون عالميو المستوى أكثر من 97% في هذا المقياس.",
          "تبعيات المصدر الوحيد على أنظمة تقنية رئيسية (نظام إدارة المستودعات ونظام إدارة النقل) دون خطة استمرارية أعمال تخلق مخاطر تشغيلية كارثية — يتطلب ISO 22301 توثيق هدف زمن التعافي (RTO) وهدف نقطة التعافي (RPO) لجميع الأنظمة الحرجة مع تدريب سنوي مُختبَر.",
          "مخاطر الهجمات السيبرانية على أنظمة الإدارة اللوجستية (WMS وTMS وEDI) في تزايد لكنها غير معالَجة — أوقف هجوم فدية ترانسنت 2021 (جنوب إفريقيا) مشغّل ميناء كبير لمدة 7 أيام؛ يوصي CSCMP باعتبار المخاطر السيبرانية من مخاطر سلسلة الإمداد من الفئة الأولى اعتبارًا من 2024.",
        ],
        solution: "ISC implements APICS SCOR Perfect Order Fulfilment measurement frameworks, designs ISO 22301-aligned BCP programmes for logistics operations, and deploys CSCMP risk management methodologies — reducing annual penalty exposure by SAR 2–5M and achieving 97%+ POF performance.",
        solutionAr: "تطبّق ISC أطر قياس تلبية الطلب المثالي من APICS SCOR، وتصمّم برامج استمرارية أعمال مواءَمة مع ISO 22301 للعمليات اللوجستية، وتنشر منهجيات إدارة المخاطر من CSCMP — مقللةً التعرّض السنوي للغرامات بمقدار 2–5 ملايين SAR ومحققةً أداء تلبية طلب مثالي يتجاوز 97%.",
      },
    ],
    cases: [
      { client: "International Logistics Operator (GCC)", clientAr: "مشغّل لوجستي دولي (الخليج)", challenge: "12 single-source critical suppliers; 1 insolvency caused SAR 900K in penalties; no BCP; SCOR score below 50th percentile", challengeAr: "12 موردًا حرجًا من مصدر وحيد؛ إعسار واحد سبّب غرامات بقيمة 900 ألف SAR؛ لا توجد خطة استمرارية أعمال؛ درجة SCOR دون المئين الخمسين", result: "Zero single-source dependencies; 48hr RTO for all critical systems; SCOR POF raised to 96.8%; SAR 2.1M avoided penalties", resultAr: "صفر تبعيات مصدر وحيد؛ هدف زمن تعافٍ 48 ساعة لجميع الأنظمة الحرجة؛ رفع تلبية الطلب المثالي إلى 96.8%؛ تجنّب غرامات بقيمة 2.1 مليون SAR" },
      { client: "Saudi 3PL (8 Warehouses)", clientAr: "مشغّل طرف ثالث لوجستي سعودي (8 مستودعات)", challenge: "Fleet utilisation 58%; manual WMS; pick accuracy 93.2%; WERC benchmarked at bottom quartile", challengeAr: "استخدام أسطول 58%؛ نظام إدارة مستودعات يدوي؛ دقة انتقاء 93.2%؛ تصنيف WERC في الربع الأدنى", result: "Fleet utilisation 79%; pick accuracy 99.4%; WERC KPIs at 3rd quartile; SAR 3.2M annual cost reduction", resultAr: "استخدام أسطول 79%؛ دقة انتقاء 99.4%؛ مؤشرات WERC في الربع الثالث؛ خفض تكلفة سنوي بقيمة 3.2 مليون SAR" },
    ],
  },

  marine: {
    name: "Marine & Port Operations",
    nameAr: "العمليات البحرية والموانئ",
    tagline: "Optimising supply chains at the Kingdom's maritime gateways",
    taglineAr: "تحسين سلاسل الإمداد عند البوابات البحرية للمملكة",
    intro: "Saudi Arabia's Red Sea and Arabian Gulf coastlines host some of the world's busiest maritime corridors. Jeddah Islamic Port, King Abdulaziz Port (Dammam), and Yanbu handle over 300M tonnes annually. The BIMCO (Baltic and International Maritime Council) standard terms, CIPS Marine Procurement Standard, IMPA (International Marine Purchasing Association) guidelines, and ISO 9001:2015 for port services define the professional procurement and supply chain framework for maritime operations.",
    introAr: "تحتضن سواحل البحر الأحمر والخليج العربي في المملكة العربية السعودية بعضًا من أكثر الممرات البحرية ازدحامًا في العالم. تتعامل ميناء جدة الإسلامي وميناء الملك عبدالعزيز (الدمام) وينبع مع أكثر من 300 مليون طن سنويًا. تحدد الشروط المعيارية من BIMCO (المجلس البحري الدولي والبلطيقي) ومعيار المشتريات البحرية من CIPS وإرشادات IMPA (الرابطة الدولية للمشتريات البحرية) وISO 9001:2015 لخدمات الموانئ الإطار المهني للمشتريات وسلسلة الإمداد للعمليات البحرية.",
    icon: Anchor,
    heroColor: "#1a4a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Marine Procurement, Chandlery & Bunker Management",
        nameAr: "المنبع — المشتريات البحرية وتموين السفن وإدارة الوقود البحري",
        color: "#1a4a6b",
        standards: ["IMPA (International Marine Purchasing Association) Guidelines", "CIPS Marine Procurement Standard", "BIMCO Standard Bunker Contract Terms", "ISO 8217:2017 Marine Fuel Quality Standard", "CPSM Module 2: Supplier Selection (Marine Context)"],
        processes: [
          "Ship chandlery consolidation: IMPA-coded catalogue management, consolidated procurement & rebate structures",
          "Bunker fuel procurement: ISO 8217-compliant specification, spot vs. contract strategy & price hedging",
          "Marine spare parts sourcing: OEM vs. approved equivalent strategy, criticality classification & lead-time management",
          "Dry-dock supply management: BOQ development, shipyard tender & pre-staging strategy",
          "Port services procurement: pilotage, towage, mooring & agency contract negotiation",
          "Safety & SOLAS compliance procurement: PPE, fire-fighting equipment & LSA (Life-Saving Appliances)",
        ],
        processesAr: [
          "توحيد تموين السفن: إدارة الكتالوج بترميز IMPA والشراء الموحّد وهياكل الحسومات",
          "شراء الوقود البحري: مواصفات متوافقة مع ISO 8217 واستراتيجية الفوري مقابل التعاقد وتحوّط الأسعار",
          "توريد قطع غيار السفن: استراتيجية الشركة المصنّعة الأصلية مقابل البديل المعتمد وتصنيف الأهمية وإدارة مهل التوريد",
          "إدارة توريد الحوض الجاف: إعداد جداول الكميات ومناقصة الحوض واستراتيجية التجهيز المسبق",
          "شراء خدمات الميناء: الإرشاد والقطر والإرساء والتفاوض على عقود الوكالة",
          "شراء متطلبات السلامة وامتثال SOLAS: معدات الوقاية الشخصية ومعدات مكافحة الحرائق وأجهزة إنقاذ الحياة (LSA)",
        ],
        flow: ["Vessel Schedule", "Provisions Planning", "IMPA-Coded PO", "Consolidated Delivery", "Master Sign-off"],
        flowAr: ["جدول السفينة", "تخطيط المؤن", "أمر شراء بترميز IMPA", "التسليم الموحّد", "اعتماد الربّان"],
        challenges: [
          "Decentralised chandlery procurement (vessel masters negotiating independently) eliminates corporate volume leverage — IMPA data shows that centralised, catalogue-managed chandlery procurement delivers 18–25% lower cost vs. vessel-level purchasing.",
          "Bunker fuel represents 30–50% of vessel operating cost; without price hedging strategies aligned with BIMCO standard contract terms, operators are fully exposed to commodity price swings of 40–80% annually — significantly exceeding budget tolerance.",
          "Marine spare parts procurement without criticality classification (ISO 55001-aligned) leads to simultaneous over-stocking of low-criticality items and under-stocking of mission-critical spares — causing costly vessel off-hire events averaging $15,000–$50,000 per day.",
        ],
        challengesAr: [
          "تموين السفن اللامركزي (تفاوض ربابنة السفن بشكل مستقل) يلغي قدرة التفاوض المؤسسية على الحجم — تُظهر بيانات IMPA أن تموين السفن المركزي المُدار بالكتالوج يحقق تكلفة أقل بنسبة 18–25% مقابل الشراء على مستوى السفينة.",
          "يمثّل الوقود البحري 30–50% من تكلفة تشغيل السفينة؛ وبدون استراتيجيات تحوّط سعري مواءَمة مع شروط عقود BIMCO المعيارية، يتعرّض المشغّلون بالكامل لتقلّبات أسعار السلع بنسبة 40–80% سنويًا — بما يتجاوز بشكل كبير هامش الميزانية.",
          "شراء قطع الغيار البحرية دون تصنيف أهمية (مواءَم مع ISO 55001) يؤدي إلى الإفراط في تخزين الأصناف منخفضة الأهمية ونقص قطع الغيار الحرجة في آنٍ واحد — مسبّبًا أحداث توقف مكلفة للسفن بمتوسط 15,000–50,000 دولار يوميًا.",
        ],
        solution: "ISC designs IMPA-aligned consolidated marine procurement programmes, implements BIMCO-compliant bunker hedging strategies, and conducts ISO 55001-based spare parts criticality classification — reducing vessel supply cost by 15–25% and eliminating supply-caused demurrage.",
        solutionAr: "تصمّم ISC برامج مشتريات بحرية موحّدة مواءَمة مع IMPA، وتطبّق استراتيجيات تحوّط للوقود البحري متوافقة مع BIMCO، وتُجري تصنيف أهمية لقطع الغيار وفق ISO 55001 — مقللةً تكلفة توريد السفن بنسبة 15–25% ومزيلةً غرامات التأخير الناتجة عن التوريد.",
      },
      {
        type: 'midstream',
        name: "Midstream — Port Operations, Terminal Management & Equipment",
        nameAr: "الوسط — عمليات الميناء وإدارة المحطات والمعدات",
        color: "#2d6b8a",
        standards: ["IAPH (International Association of Ports & Harbours) Standards", "ISO 28000:2022 Supply Chain Security", "APICS SCOR Plan Domain (Port context)", "Lloyd's Register Port Operations Standard", "PIANC Guidelines for Port Maintenance"],
        processes: [
          "Terminal throughput planning: berth allocation, vessel scheduling & crane gang planning",
          "Yard management: container stacking optimisation, RTG utilisation & dwell-time management",
          "Port equipment MRO: quay crane, RTG & reach stacker criticality-based maintenance",
          "Port Community System (PCS) integration: customs, freight forwarder & terminal data exchange",
          "Cargo tracking & visibility: RFID, IoT sensor management & port operational dashboards",
          "Hinterland connectivity: inland depot network, rail integration & last-mile freight management",
        ],
        processesAr: [
          "تخطيط إنتاجية المحطة: تخصيص الأرصفة وجدولة السفن وتخطيط فرق الرافعات",
          "إدارة الساحة: تحسين تكديس الحاويات واستخدام الرافعات المطاطية وإدارة زمن المكوث",
          "صيانة معدات الميناء: صيانة قائمة على الأهمية لرافعات الرصيف والرافعات المطاطية ورافعات الوصول",
          "تكامل نظام مجتمع الميناء (PCS): تبادل بيانات الجمارك ووكلاء الشحن والمحطة",
          "تتبّع البضائع والرؤية: إدارة RFID وحساسات إنترنت الأشياء ولوحات تشغيل الميناء",
          "الربط بالمناطق الخلفية: شبكة المستودعات الداخلية والتكامل مع السكك الحديدية وإدارة شحن الميل الأخير",
        ],
        flow: ["Vessel ETA Signal", "Berth Allocation", "Discharge Planning", "Yard Allocation", "Gate Release & POD"],
        flowAr: ["إشارة وقت الوصول المتوقع", "تخصيص الرصيف", "تخطيط التفريغ", "تخصيص الساحة", "الإفراج عند البوابة وإثبات التسليم"],
        challenges: [
          "Quay crane and RTG downtime directly impacts terminal throughput — PIANC guidelines require a proactive MRO programme with MTBF (Mean Time Between Failures) targets; best-in-class terminals achieve less than 3% equipment downtime vs. GCC averages of 8–14%.",
          "Port Community System gaps between customs, terminal operators, and freight forwarders create documentation delays averaging 12–24 hours per consignment — ISO 28000 Supply Chain Security standard provides the data exchange framework to eliminate these delays.",
          "Container dwell time in Saudi ports averages 4–6 days vs. world-class benchmarks of 2 days — IAPH performance indicators show dwell time reduction directly correlates with yard capacity utilisation, reducing the need for costly yard expansion.",
        ],
        challengesAr: [
          "يؤثّر توقف رافعات الرصيف والرافعات المطاطية مباشرةً على إنتاجية المحطة — تتطلب إرشادات PIANC برنامج صيانة استباقيًا بمستهدفات متوسط الزمن بين الأعطال (MTBF)؛ تحقق أفضل المحطات توقف معدات أقل من 3% مقابل متوسطات دول الخليج البالغة 8–14%.",
          "فجوات نظام مجتمع الميناء بين الجمارك ومشغّلي المحطات ووكلاء الشحن تخلق تأخيرات توثيق بمتوسط 12–24 ساعة لكل شحنة — يوفر معيار أمن سلسلة الإمداد ISO 28000 إطار تبادل البيانات لإزالة هذه التأخيرات.",
          "يبلغ متوسط زمن مكوث الحاويات في الموانئ السعودية 4–6 أيام مقابل معايير عالمية بيومين — تُظهر مؤشرات أداء IAPH أن خفض زمن المكوث يرتبط مباشرةً باستخدام سعة الساحة، مقللاً الحاجة إلى توسعة مكلفة للساحة.",
        ],
        solution: "ISC delivers PIANC and IAPH-aligned port supply chain optimisation programmes — equipment MRO criticality management, PCS integration advisory, and ISO 28000-compliant supply chain security — increasing terminal throughput by 15–20% and reducing container dwell time to under 2.5 days.",
        solutionAr: "تقدّم ISC برامج تحسين لسلسلة إمداد الموانئ مواءَمة مع PIANC وIAPH — إدارة أهمية صيانة المعدات واستشارات تكامل نظام مجتمع الميناء وأمن سلسلة الإمداد المتوافق مع ISO 28000 — رافعةً إنتاجية المحطة بنسبة 15–20% ومقللةً زمن مكوث الحاويات إلى أقل من 2.5 يوم.",
      },
      {
        type: 'downstream',
        name: "Downstream — Free Zone Management, Trade Facilitation & Cargo Release",
        nameAr: "المصب — إدارة المناطق الحرة وتيسير التجارة والإفراج عن البضائع",
        color: "#C9A84C",
        standards: ["WCO (World Customs Organisation) Supply Chain Security Framework", "ZATCA Customs Compliance (Saudi context)", "ISO 28000:2022 Supply Chain Security", "AEO (Authorised Economic Operator) Programme Standards", "CIPS Trade & International Procurement Standard"],
        processes: [
          "Free zone supply chain structuring: FZ vs. customs warehouse vs. bonded zone selection",
          "AEO (Authorised Economic Operator) certification: ZATCA AEO programme application & maintenance",
          "Re-export and transshipment supply chain design: origin documentation, certificate management",
          "Trade finance: letter of credit structuring, supply chain finance (SCF) & invoice discounting",
          "Customs classification & valuation: HS code management, duty optimisation & ZATCA compliance",
          "Import/export documentation: commercial invoice, packing list, COO & SFDA/SABER certificate management",
        ],
        processesAr: [
          "هيكلة سلسلة إمداد المناطق الحرة: اختيار المنطقة الحرة مقابل المستودع الجمركي مقابل المنطقة تحت الرقابة",
          "شهادة المشغّل الاقتصادي المعتمد (AEO): تقديم طلب برنامج AEO لدى هيئة الزكاة والضريبة والجمارك وصيانته",
          "تصميم سلسلة إمداد إعادة التصدير والشحن العابر: توثيق المنشأ وإدارة الشهادات",
          "تمويل التجارة: هيكلة الاعتمادات المستندية وتمويل سلسلة الإمداد (SCF) وخصم الفواتير",
          "التصنيف والتقييم الجمركي: إدارة رموز النظام المنسّق وتحسين الرسوم والامتثال لهيئة الزكاة والضريبة والجمارك",
          "توثيق الاستيراد/التصدير: الفاتورة التجارية وقائمة التعبئة وشهادة المنشأ وإدارة شهادات SFDA/سابر",
        ],
        flow: ["Trade Route Analysis", "Free Zone Setup", "AEO Registration", "Customs Clearance", "Cargo Release & POD"],
        flowAr: ["تحليل المسار التجاري", "إعداد المنطقة الحرة", "تسجيل AEO", "التخليص الجمركي", "الإفراج عن البضائع وإثبات التسليم"],
        challenges: [
          "Saudi free zone regulations are complex and frequently updated — ZATCA enforcement of the GCC Common Customs Law creates significant compliance risk; WCO AEO programme participation reduces customs inspection rates by 60–80% and average clearance time from 4 days to under 8 hours.",
          "Supply chain finance penetration in GCC trade is significantly below international benchmarks — CIPS Supply Chain Finance Guide shows SCF programmes reduce working capital requirements by 30–40 days on payables and 15–25 days on receivables.",
          "Trade document management (LC, COO, SABER certificates) is largely manual in Saudi importers — electronic document management aligned with CIPS International Procurement Standard reduces trade documentation errors by 75% and customs query rates by 60%.",
        ],
        challengesAr: [
          "لوائح المناطق الحرة السعودية معقّدة وتُحدَّث بشكل متكرر — يخلق تطبيق هيئة الزكاة والضريبة والجمارك للنظام الجمركي الموحّد لدول الخليج مخاطر امتثال كبيرة؛ تخفض المشاركة في برنامج AEO من WCO معدلات التفتيش الجمركي بنسبة 60–80% ومتوسط زمن التخليص من 4 أيام إلى أقل من 8 ساعات.",
          "انتشار تمويل سلسلة الإمداد في تجارة دول الخليج أدنى بكثير من المعايير الدولية — يُظهر دليل تمويل سلسلة الإمداد من CIPS أن برامج SCF تخفض متطلبات رأس المال العامل بمقدار 30–40 يومًا على الذمم الدائنة و15–25 يومًا على الذمم المدينة.",
          "إدارة المستندات التجارية (الاعتمادات المستندية وشهادات المنشأ وشهادات سابر) يدوية إلى حد كبير لدى المستوردين السعوديين — تخفض الإدارة الإلكترونية للمستندات المواءَمة مع معيار المشتريات الدولية من CIPS أخطاء التوثيق التجاري بنسبة 75% ومعدلات استفسارات الجمارك بنسبة 60%.",
        ],
        solution: "ISC provides ZATCA-aligned free zone supply chain structuring and AEO programme support, implements supply chain finance programmes per CIPS SCF Guide, and digitises trade documentation management — unlocking full duty-deferral benefits and reducing customs clearance time by 80%.",
        solutionAr: "توفّر ISC هيكلة سلسلة إمداد للمناطق الحرة مواءَمة مع هيئة الزكاة والضريبة والجمارك ودعم برنامج AEO، وتطبّق برامج تمويل سلسلة الإمداد وفق دليل SCF من CIPS، وترقمن إدارة المستندات التجارية — فاتحةً كامل مزايا تأجيل الرسوم ومقللةً زمن التخليص الجمركي بنسبة 80%.",
      },
    ],
    cases: [
      { client: "Red Sea Shipping Operator", clientAr: "مشغّل شحن في البحر الأحمر", challenge: "Decentralised chandlery; no bunker hedging; demurrage averaging $28,000 per vessel call; IMPA non-compliant", challengeAr: "تموين لامركزي؛ لا يوجد تحوّط للوقود البحري؛ غرامات تأخير بمتوسط 28,000 دولار لكل رسو سفينة؛ عدم امتثال لـ IMPA", result: "IMPA-aligned consolidated procurement; bunker hedging implemented; demurrage eliminated; 19% vessel supply cost reduction", resultAr: "مشتريات موحّدة مواءَمة مع IMPA؛ تطبيق تحوّط الوقود البحري؛ إزالة غرامات التأخير؛ خفض تكلفة توريد السفن بنسبة 19%" },
      { client: "Saudi Port Terminal Operator", clientAr: "مشغّل محطة ميناء سعودي", challenge: "Equipment downtime 14% of operating hours; no PIANC maintenance programme; MRO spend 35% above benchmark", challengeAr: "توقف المعدات 14% من ساعات التشغيل؛ لا يوجد برنامج صيانة PIANC؛ إنفاق صيانة يتجاوز المعيار بنسبة 35%", result: "Downtime 5.2%; PIANC-aligned MRO programme; SAR 8.5M annual MRO cost reduction", resultAr: "توقف 5.2%؛ برنامج صيانة مواءَم مع PIANC؛ خفض تكلفة صيانة سنوي بقيمة 8.5 ملايين SAR" },
    ],
  },

  construction: {
    name: "Construction & EPC",
    nameAr: "الإنشاءات والهندسة والتوريد والبناء",
    tagline: "Supply chains for the Kingdom's giga-project era",
    taglineAr: "سلاسل إمداد لعصر المشاريع العملاقة في المملكة",
    intro: "Saudi Arabia is executing the largest construction programme in human history — NEOM, The Line, Diriyah Gate, Qiddiya, Red Sea Project — alongside Vision 2030 social infrastructure. With SAR 1.4 trillion in active projects, construction supply chains require CIPS Major Projects & Programme Procurement Standard, CIOB (Chartered Institute of Building) supply chain management guidelines, APICS project supply chain management, and the NEC4 (New Engineering Contract) supply chain risk framework.",
    introAr: "تنفّذ المملكة العربية السعودية أكبر برنامج إنشاءات في تاريخ البشرية — نيوم وذا لاين وبوابة الدرعية والقدية ومشروع البحر الأحمر — إلى جانب البنية التحتية الاجتماعية ضمن رؤية 2030. ومع مشاريع نشطة بقيمة 1.4 تريليون SAR، تتطلب سلاسل إمداد الإنشاءات معيار مشتريات المشاريع والبرامج الكبرى من CIPS وإرشادات إدارة سلسلة الإمداد من CIOB (المعهد المعتمد للبناء) وإدارة سلسلة إمداد المشاريع من APICS وإطار مخاطر سلسلة الإمداد في عقد الهندسة الجديد NEC4.",
    icon: HardHat,
    heroColor: "#6b3a1a",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Material Procurement, Subcontractor Sourcing & BOQ Management",
        nameAr: "المنبع — شراء المواد وتوريد المقاولين من الباطن وإدارة جداول الكميات",
        color: "#6b3a1a",
        standards: ["CIPS Major Projects & Programme Procurement Standard", "CIOB Supply Chain Management in Construction", "FIDIC / NEC4 Procurement Clauses", "CPSM Module 3: Contract & Risk Management", "ISO 20400:2017 Sustainable Construction Procurement"],
        processes: [
          "BOQ extraction & procurement scheduling: material take-off aligned to design milestones",
          "Bulk material strategic sourcing: steel, cement, aggregates — long-lead pre-commitment strategy",
          "Subcontractor pre-qualification: financial health, safety record (ISO 45001), technical capability",
          "Subcontractor tender: scope of works, NEC4/FIDIC subcontract form selection & risk allocation",
          "Import procurement: international material sourcing, logistics coordination & customs clearance",
          "Sustainable procurement: LEED/BREEAM material specification, recycled content & carbon impact",
        ],
        processesAr: [
          "استخراج جداول الكميات وجدولة المشتريات: حصر المواد بمواءمة مراحل التصميم",
          "التوريد الاستراتيجي للمواد بالجملة: الحديد والأسمنت والركام — استراتيجية الالتزام المسبق للأصناف طويلة الأمد",
          "التأهيل المسبق للمقاولين من الباطن: السلامة المالية وسجل السلامة (ISO 45001) والقدرة الفنية",
          "مناقصة المقاولين من الباطن: نطاق الأعمال واختيار نموذج العقد الفرعي NEC4/FIDIC وتوزيع المخاطر",
          "شراء الاستيراد: توريد المواد الدولية وتنسيق اللوجستيات والتخليص الجمركي",
          "التوريد المستدام: مواصفات مواد LEED/BREEAM والمحتوى المعاد تدويره والأثر الكربوني",
        ],
        flow: ["Design Milestone", "BOQ Extraction", "Long-Lead Pre-Commit", "Subcontract Award", "Pre-Delivery Inspection"],
        flowAr: ["مرحلة التصميم", "استخراج جداول الكميات", "الالتزام المسبق للأصناف طويلة الأمد", "ترسية العقد الفرعي", "الفحص قبل التسليم"],
        challenges: [
          "Saudi construction demand is creating severe supply shortages in structural steel and MEP equipment — CIPS Major Projects Standard recommends a 6-month horizon procurement schedule with pre-commitment letters for lead times exceeding 12 weeks; most Saudi contractors start procurement 30–60 days after materials were needed on-site.",
          "Subcontractor pre-qualification without financial health screening is a common risk — CIOB Supply Chain guidance shows 40–60% of sub-contractor failures on large projects have identifiable financial distress signals 6 months before insolvency; CIPS Supplier Financial Risk Assessment provides the screening framework.",
          "Sustainable procurement obligations under LEED V4 (mandatory for many Vision 2030 projects) require material carbon data and recycled content documentation — ISO 20400 Sustainable Procurement provides the supplier engagement framework for construction materials.",
        ],
        challengesAr: [
          "يخلق الطلب الإنشائي السعودي نقصًا حادًا في إمداد الحديد الإنشائي ومعدات الأنظمة الكهروميكانيكية — يوصي معيار المشاريع الكبرى من CIPS بجدول مشتريات بأفق 6 أشهر بخطابات التزام مسبق لمهل التوريد التي تتجاوز 12 أسبوعًا؛ يبدأ معظم المقاولين السعوديين الشراء بعد 30–60 يومًا من حاجة الموقع للمواد.",
          "التأهيل المسبق للمقاولين من الباطن دون فحص السلامة المالية مخاطرة شائعة — تُظهر إرشادات سلسلة الإمداد من CIOB أن 40–60% من إخفاقات المقاولين من الباطن في المشاريع الكبرى لها إشارات ضائقة مالية يمكن تحديدها قبل ستة أشهر من الإعسار؛ يوفر تقييم المخاطر المالية للموردين من CIPS إطار الفحص.",
          "تتطلب التزامات التوريد المستدام بموجب LEED V4 (إلزامية للعديد من مشاريع رؤية 2030) بيانات كربون المواد وتوثيق المحتوى المعاد تدويره — يوفر التوريد المستدام ISO 20400 إطار إشراك الموردين لمواد البناء.",
        ],
        solution: "ISC implements CIPS Major Projects-aligned procurement scheduling with BOQ-integrated material management, conducts CIOB-standard subcontractor pre-qualification with financial health monitoring, and delivers ISO 20400-compliant sustainable procurement frameworks — reducing supply-caused schedule delays by 70%.",
        solutionAr: "تطبّق ISC جدولة مشتريات مواءَمة مع معيار المشاريع الكبرى من CIPS بإدارة مواد متكاملة مع جداول الكميات، وتُجري تأهيلاً مسبقًا للمقاولين من الباطن وفق معيار CIOB بمراقبة السلامة المالية، وتقدّم أطر توريد مستدام متوافقة مع ISO 20400 — مقللةً تأخيرات الجدول الناتجة عن التوريد بنسبة 70%.",
      },
      {
        type: 'midstream',
        name: "Midstream — Site Logistics, Material Management & Subcontractor Governance",
        nameAr: "الوسط — لوجستيات الموقع وإدارة المواد وحوكمة المقاولين من الباطن",
        color: "#8a4f20",
        standards: ["CIOB Site Logistics Management Guide", "APICS Project Supply Chain Management", "ISO 45001:2018 Occupational Health & Safety (Site)", "Lean Construction Institute (LCI) Principles", "CIPS Contract Administration Standard"],
        processes: [
          "Site logistics plan: traffic management, unloading zones, storage layout & access scheduling",
          "Material tracking: RFID/barcode material management system, delivery scheduling & gate control",
          "Just-in-time delivery: pull-based material delivery aligned to construction programme",
          "Subcontractor management: weekly look-ahead scheduling, constraint removal & payment governance",
          "Equipment hire management: utilisation tracking, hire rate benchmarking & return scheduling",
          "ISO 45001-compliant safety inspection: material handling, lifting operations & COSHH compliance",
        ],
        processesAr: [
          "خطة لوجستيات الموقع: إدارة الحركة ومناطق التفريغ وتخطيط التخزين وجدولة الدخول",
          "تتبّع المواد: نظام إدارة مواد بـ RFID/الباركود وجدولة التسليم والتحكم في البوابة",
          "التسليم في الوقت المناسب: تسليم مواد قائم على السحب بمواءمة برنامج الإنشاء",
          "إدارة المقاولين من الباطن: جدولة أسبوعية استباقية وإزالة القيود وحوكمة المدفوعات",
          "إدارة تأجير المعدات: تتبّع الاستخدام والمقارنة المعيارية لأسعار التأجير وجدولة الإرجاع",
          "تفتيش السلامة المتوافق مع ISO 45001: مناولة المواد وعمليات الرفع والامتثال لـ COSHH",
        ],
        flow: ["JIT Delivery Schedule", "Gate Receipt & RFID", "Site Warehouse", "Issue to Works", "Material Reconciliation"],
        flowAr: ["جدول التسليم في الوقت المناسب", "الاستلام عند البوابة وRFID", "مستودع الموقع", "الصرف للأعمال", "تسوية المواد"],
        challenges: [
          "Large construction sites (5–15 km2) waste 15–25% of labour hours on material searching — Lean Construction Institute research shows pull-based JIT delivery systems with site-level material tracking reduce labour waste to under 5% and improve productivity by 20%.",
          "Equipment hire idle time averaging 35–45% on Saudi mega-projects represents direct profit erosion — CIOB Site Logistics Guide recommends a hire utilisation tracking system with 75% minimum utilisation trigger for return decisions.",
          "Subcontractor payment governance failures — main contractors delaying payment by 90+ days — cascade into Tier-2 and Tier-3 supply chain failures; NEC4 contract Option Y(UK)2 and equivalent FIDIC provisions mandate payment within 21 days; structured payment governance prevents £/SAR millions in supply chain disruption.",
        ],
        challengesAr: [
          "تهدر مواقع الإنشاء الكبيرة (5–15 كم²) 15–25% من ساعات العمل في البحث عن المواد — تُظهر أبحاث معهد البناء الرشيق أن أنظمة التسليم في الوقت المناسب القائمة على السحب مع تتبّع المواد على مستوى الموقع تخفض هدر العمالة إلى أقل من 5% وترفع الإنتاجية بنسبة 20%.",
          "زمن خمول تأجير المعدات بمتوسط 35–45% في المشاريع العملاقة السعودية يمثّل تآكلاً مباشرًا للربح — يوصي دليل لوجستيات الموقع من CIOB بنظام تتبّع استخدام التأجير بمحفّز حد أدنى للاستخدام 75% لقرارات الإرجاع.",
          "إخفاقات حوكمة مدفوعات المقاولين من الباطن — تأخير المقاولين الرئيسيين للسداد أكثر من 90 يومًا — تتسلسل إلى إخفاقات سلسلة الإمداد من الطبقتين الثانية والثالثة؛ يُلزم خيار NEC4 Y(UK)2 والأحكام المكافئة في FIDIC بالسداد خلال 21 يومًا؛ حوكمة المدفوعات المنظمة تمنع اضطرابًا في سلسلة الإمداد بملايين الـ SAR.",
        ],
        solution: "ISC implements LCI-aligned JIT delivery systems with RFID material tracking, deploys hire utilisation management programmes, and establishes NEC4-compliant subcontractor payment governance — recovering 3–5% of total project cost and eliminating supply chain-caused schedule delays.",
        solutionAr: "تطبّق ISC أنظمة تسليم في الوقت المناسب مواءَمة مع معهد البناء الرشيق بتتبّع مواد بـ RFID، وتنشر برامج إدارة استخدام التأجير، وتؤسّس حوكمة مدفوعات للمقاولين من الباطن متوافقة مع NEC4 — مستردةً 3–5% من إجمالي تكلفة المشروع ومزيلةً تأخيرات الجدول الناتجة عن سلسلة الإمداد.",
      },
      {
        type: 'downstream',
        name: "Downstream — Commercial Recovery, Handover & Defects Liability Management",
        nameAr: "المصب — الاسترداد التجاري والتسليم وإدارة مسؤولية العيوب",
        color: "#C9A84C",
        standards: ["IACCM Contract Management & Commercial Recovery Standard", "FIDIC Red/Yellow/Silver Book Claims Provisions", "NEC4 Compensation Event Management", "CIPS Post-Award Contract Management Guide", "ISO 10005:2018 Quality Plans (Handover context)"],
        processes: [
          "Variation order (VO) management: NEC4/FIDIC Compensation Event tracking, quantification & submission",
          "Extension of time (EOT) claims: delay analysis methodology (TIA/Windows), supporting documentation",
          "Retention money management: retention release milestones, bond alternatives & cashflow management",
          "Practical completion & handover: defect punch-list management & ISO 10005 quality plan evidence",
          "Defects liability period (DLP): supply chain readiness for reactive maintenance, parts pre-stocking",
          "Final account settlement: Scott Schedules, conciliation & FIDIC/NEC dispute avoidance board",
        ],
        processesAr: [
          "إدارة أوامر التغيير (VO): تتبّع أحداث التعويض في NEC4/FIDIC وتحديد قيمتها وتقديمها",
          "مطالبات تمديد الوقت (EOT): منهجية تحليل التأخير (TIA/Windows) والمستندات الداعمة",
          "إدارة مبالغ الاحتجاز: مراحل الإفراج عن الاحتجاز وبدائل الضمان وإدارة التدفق النقدي",
          "الإنجاز الفعلي والتسليم: إدارة قائمة العيوب وأدلة خطة الجودة ISO 10005",
          "فترة مسؤولية العيوب (DLP): جاهزية سلسلة الإمداد للصيانة التفاعلية والتخزين المسبق لقطع الغيار",
          "تسوية الحساب الختامي: جداول سكوت والتوفيق ومجلس تجنّب النزاعات في FIDIC/NEC",
        ],
        flow: ["VO Identification", "Compensation Event Notice", "Quantification & Submission", "Employer Assessment", "Final Account"],
        flowAr: ["تحديد أمر التغيير", "إشعار حدث التعويض", "تحديد القيمة والتقديم", "تقييم صاحب العمل", "الحساب الختامي"],
        challenges: [
          "VO entitlement on Saudi projects averages 15–35% of contract value — yet most contractors fail to capture 40–60% of legitimate NEC4/FIDIC Compensation Events due to poor contractual notice compliance and inadequate commercial management systems.",
          "DLP supply chain planning is absent in most contractors — reactive maintenance during DLP requires material procurement, logistics, and labour mobilisation within 24–72 hours; without pre-positioned DLP supply chain agreements, contractors pay 30–50% premiums on emergency procurement.",
          "Final account settlement disputes lasting 24–48 months are common on Saudi mega-projects — IACCM data shows that contractors with structured contemporary record-keeping (daily site diaries, photographic evidence, resource records) settle final accounts 18 months faster and recover 25% more entitlement.",
        ],
        challengesAr: [
          "يبلغ متوسط استحقاق أوامر التغيير في المشاريع السعودية 15–35% من قيمة العقد — ومع ذلك يخفق معظم المقاولين في التقاط 40–60% من أحداث التعويض المشروعة في NEC4/FIDIC بسبب ضعف الامتثال للإشعار التعاقدي وقصور أنظمة الإدارة التجارية.",
          "تخطيط سلسلة إمداد فترة مسؤولية العيوب غائب لدى معظم المقاولين — تتطلب الصيانة التفاعلية خلال هذه الفترة شراء مواد ولوجستيات وحشد عمالة خلال 24–72 ساعة؛ وبدون اتفاقيات سلسلة إمداد مُعدّة مسبقًا، يدفع المقاولون علاوات 30–50% على الشراء الطارئ.",
          "نزاعات تسوية الحساب الختامي التي تستمر 24–48 شهرًا شائعة في المشاريع العملاقة السعودية — تُظهر بيانات IACCM أن المقاولين ذوي حفظ السجلات الآنية المنظّم (يوميات الموقع والأدلة المصوّرة وسجلات الموارد) يسوّون الحسابات الختامية أسرع بـ18 شهرًا ويستردّون استحقاقًا أعلى بنسبة 25%.",
        ],
        solution: "ISC provides FIDIC/NEC4-aligned commercial and supply chain advisory — VO capture programmes, DLP supply chain planning, and IACCM-standard final account management — recovering 5–15% of unclaimed contract entitlement and avoiding 18–24 months of dispute.",
        solutionAr: "تقدّم ISC استشارات تجارية وسلسلة إمداد مواءَمة مع FIDIC/NEC4 — برامج التقاط أوامر التغيير وتخطيط سلسلة إمداد فترة مسؤولية العيوب وإدارة الحساب الختامي وفق معيار IACCM — مستردةً 5–15% من استحقاق العقد غير المطالَب به ومتجنّبةً 18–24 شهرًا من النزاع.",
      },
    ],
    cases: [
      { client: "Major Saudi EPC Contractor", clientAr: "مقاول هندسة وتوريد وبناء سعودي كبير", challenge: "Material shortages causing 18-week schedule delay; SAR 42M VO entitlement untracked; no NEC4 CE log", challengeAr: "نقص مواد يسبّب تأخير جدول 18 أسبوعًا؛ استحقاق أوامر تغيير بقيمة 42 مليون SAR غير متتبَّع؛ لا يوجد سجل أحداث تعويض NEC4", result: "Bulk pre-commitment strategy eliminated material delays; SAR 42M VO recovered; NEC4 CE management system deployed", resultAr: "استراتيجية الالتزام المسبق بالجملة أزالت تأخيرات المواد؛ استرداد أوامر تغيير بقيمة 42 مليون SAR؛ نشر نظام إدارة أحداث التعويض NEC4" },
      { client: "Vision 2030 Giga-Project Subcontractor", clientAr: "مقاول من الباطن لمشروع عملاق ضمن رؤية 2030", challenge: "Equipment hire utilisation 41%; material losses SAR 3.2M; no site logistics plan; CIOB non-compliant", challengeAr: "استخدام تأجير المعدات 41%؛ خسائر مواد بقيمة 3.2 ملايين SAR؛ لا توجد خطة لوجستيات موقع؛ عدم امتثال لـ CIOB", result: "Utilisation 73%; material loss 0.8%; CIOB-compliant logistics plan; SAR 5.1M net annual saving", resultAr: "استخدام 73%؛ خسارة مواد 0.8%؛ خطة لوجستيات متوافقة مع CIOB؛ صافي وفورات سنوي بقيمة 5.1 ملايين SAR" },
    ],
  },

  healthcare: {
    name: "Healthcare",
    nameAr: "الرعاية الصحية",
    tagline: "Resilient health supply chains for the Kingdom's care transformation",
    taglineAr: "سلاسل إمداد صحية مرنة لتحوّل الرعاية في المملكة",
    intro: "Saudi Arabia's Health Sector Transformation Programme under Vision 2030 is privatising hospitals, expanding primary care networks, and digitalising clinical pathways. With MoH managing 2,500+ facilities and the private sector growing at 12% annually, healthcare supply chains require CIPS Healthcare Procurement Standard, NHS CIPS Supply Chain Management framework, JCI (Joint Commission International) supply chain standards, and ISO 9001:2015 for healthcare service providers.",
    introAr: "يعمل برنامج تحوّل القطاع الصحي في المملكة العربية السعودية ضمن رؤية 2030 على خصخصة المستشفيات وتوسيع شبكات الرعاية الأولية ورقمنة المسارات السريرية. ومع إدارة وزارة الصحة لأكثر من 2,500 منشأة ونمو القطاع الخاص بنسبة 12% سنويًا، تتطلب سلاسل إمداد الرعاية الصحية معيار مشتريات الرعاية الصحية من CIPS وإطار إدارة سلسلة إمداد NHS-CIPS ومعايير سلسلة الإمداد من JCI (اللجنة الدولية المشتركة) وISO 9001:2015 لمزوّدي خدمات الرعاية الصحية.",
    icon: Heart,
    heroColor: "#6b1a2d",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Medical Device Procurement, Tendering & Supplier Qualification",
        nameAr: "المنبع — شراء الأجهزة الطبية والمناقصات وتأهيل الموردين",
        color: "#6b1a2d",
        standards: ["CIPS Healthcare Procurement Standard", "SFDA Medical Device Regulation (MDR)", "NHS Supply Chain Category Management Framework", "ISO 13485:2016 Medical Devices Quality Management", "JCI Supply Chain Standard — Medical Equipment"],
        processes: [
          "Medical device category management: NHS-aligned category strategies for surgical consumables, imaging & diagnostics",
          "SFDA MDR pre-qualification: regulatory approval status verification & import documentation",
          "Physician preference item (PPI) value analysis: clinical equivalence assessment & total cost modelling",
          "MOH/NHC tender management: technical specification development, evaluation matrix & award",
          "ISO 13485-compliant supplier qualification: QMS certification, vigilance record & audit",
          "Consignment & VMI programme design: capital equipment, implants & high-value consumables",
        ],
        processesAr: [
          "إدارة فئات الأجهزة الطبية: استراتيجيات فئات مواءَمة مع NHS للمستهلكات الجراحية والتصوير والتشخيص",
          "التأهيل المسبق وفق لائحة الأجهزة الطبية من SFDA: التحقق من حالة الموافقة التنظيمية ووثائق الاستيراد",
          "تحليل قيمة أصناف تفضيل الطبيب (PPI): تقييم التكافؤ السريري ونمذجة التكلفة الكلية",
          "إدارة مناقصات وزارة الصحة/المركز الوطني: تطوير المواصفات الفنية ومصفوفة التقييم والترسية",
          "تأهيل الموردين المتوافق مع ISO 13485: شهادة نظام إدارة الجودة وسجل اليقظة والتدقيق",
          "تصميم برامج البيع بالأمانة والمخزون المُدار من المورد: المعدات الرأسمالية والغرسات والمستهلكات عالية القيمة",
        ],
        flow: ["Clinical Requirement", "Formulary Committee", "SFDA Verification", "Tender Development", "Contract & Consignment"],
        flowAr: ["المتطلب السريري", "لجنة القائمة الدوائية", "التحقق من SFDA", "إعداد المناقصة", "العقد والبيع بالأمانة"],
        challenges: [
          "Physician Preference Items (PPIs — implants, surgical instruments) drive 35–45% of consumable spend but are procured on clinical preference rather than value — NHS Supply Chain PPI Value Analysis programme shows structured equivalence reviews deliver 15–22% cost reduction without clinical compromise.",
          "SFDA MDR registration timelines create procurement gaps — ISO 13485 requires a documented supplier qualification process that verifies MDR registration status before any procurement commitment, to prevent SAR 500K+ compliance exposures from unregistered device procurement.",
          "Medical device tendering without properly designed technical specifications leads to either non-comparable bids (if over-specified to a single brand) or poor clinical outcomes (if under-specified) — CIPS Healthcare Standard requires technical specifications written to clinical outcome, not brand.",
        ],
        challengesAr: [
          "تدفع أصناف تفضيل الطبيب (الغرسات والأدوات الجراحية) 35–45% من إنفاق المستهلكات لكنها تُشترى وفق التفضيل السريري لا القيمة — يُظهر برنامج تحليل قيمة PPI من سلسلة إمداد NHS أن مراجعات التكافؤ المنظمة تحقق خفض تكلفة بنسبة 15–22% دون مساس سريري.",
          "تخلق مهل تسجيل الأجهزة الطبية لدى SFDA فجوات في المشتريات — يتطلب ISO 13485 عملية تأهيل موردين موثّقة تتحقق من حالة تسجيل الجهاز قبل أي التزام شرائي لمنع تعرّضات امتثال تتجاوز 500 ألف SAR من شراء أجهزة غير مسجّلة.",
          "مناقصة الأجهزة الطبية دون مواصفات فنية مصمَّمة جيدًا تؤدي إلى عروض غير قابلة للمقارنة (إن أُفرط في تحديدها لعلامة واحدة) أو نتائج سريرية ضعيفة (إن نقص تحديدها) — يتطلب معيار الرعاية الصحية من CIPS كتابة المواصفات الفنية وفق النتيجة السريرية لا العلامة التجارية.",
        ],
        solution: "ISC implements NHS-aligned PPI value analysis programmes, designs SFDA MDR-compliant supplier qualification processes, and develops outcome-based medical device tender specifications — reducing medical supply cost by 15–22% while maintaining full JCI supply chain compliance.",
        solutionAr: "تطبّق ISC برامج تحليل قيمة PPI مواءَمة مع NHS، وتصمّم عمليات تأهيل موردين متوافقة مع لائحة الأجهزة الطبية من SFDA، وتطوّر مواصفات مناقصات أجهزة طبية قائمة على النتائج — مقللةً تكلفة التوريد الطبي بنسبة 15–22% مع الحفاظ على امتثال كامل لسلسلة الإمداد وفق JCI.",
      },
      {
        type: 'midstream',
        name: "Midstream — Pharmacy, Formulary Management & Clinical Supply Operations",
        nameAr: "الوسط — الصيدلية وإدارة القائمة الدوائية وعمليات التوريد السريري",
        color: "#8b2040",
        standards: ["ASHP (American Society of Health-System Pharmacists) Medication Management Guidelines", "WHO Model Formulary Management Standard", "JCI Medication Management & Use (MMU) Standards", "APICS CPIM Inventory Management (Healthcare)", "Saudi MoH Antimicrobial Stewardship Programme"],
        processes: [
          "Hospital formulary governance: DTC committee, VEN/ABC/XYZ analysis & therapeutic substitution protocol",
          "Medicines demand forecasting: consumption-based statistical model (APICS IBF Level 2 Healthcare)",
          "Inventory optimisation: Days-on-Hand targets per VEN category (V=7 days, E=14 days, N=30 days)",
          "Cold-chain medicines management: biologics & vaccines — JCI MMU.3 compliance & excursion SOP",
          "AMS programme supply chain: antibiotic restriction formulary, de-escalation protocols",
          "Biomedical equipment management: lifecycle planning, PPM scheduling & ISO 13485 calibration",
        ],
        processesAr: [
          "حوكمة القائمة الدوائية للمستشفى: لجنة الأدوية وتحليل VEN/ABC/XYZ وبروتوكول الاستبدال العلاجي",
          "التنبؤ بالطلب على الأدوية: نموذج إحصائي قائم على الاستهلاك (APICS IBF المستوى 2 للرعاية الصحية)",
          "تحسين المخزون: مستهدفات أيام التغطية حسب فئة VEN (حيوي=7 أيام، أساسي=14 يومًا، غير أساسي=30 يومًا)",
          "إدارة الأدوية المبرَّدة: المستحضرات البيولوجية واللقاحات — الامتثال لـ JCI MMU.3 وإجراء تجاوز درجة الحرارة",
          "سلسلة إمداد برنامج ترشيد مضادات الميكروبات: قائمة تقييد المضادات الحيوية وبروتوكولات التخفيض",
          "إدارة المعدات الطبية الحيوية: تخطيط دورة الحياة وجدولة الصيانة الوقائية والمعايرة وفق ISO 13485",
        ],
        flow: ["Formulary Governance", "VEN/ABC Analysis", "DOH Targets", "Automated Replenishment", "FEFO Dispensing"],
        flowAr: ["حوكمة القائمة الدوائية", "تحليل VEN/ABC", "مستهدفات أيام التغطية", "التجديد الآلي", "الصرف وفق FEFO"],
        challenges: [
          "Saudi hospital pharmacies carry 5.4 months average inventory (vs. JCI-recommended 2–2.5 months) — ASHP recommends formulary-level DOH target setting using VEN classification: Vital items 7 days, Essential 14 days, Non-essential 30 days; this alone reduces pharmacy working capital by 40–50%.",
          "Biologics and specialty medicines (40–60% of pharmacy spend) require continuous cold-chain management that most Saudi hospitals handle informally — JCI MMU.3 requires documented cold-chain procedures with excursion response protocols and continuous temperature monitoring logs.",
          "Saudi MoH AMS circular 2023 mandates real-time antibiotic consumption reporting linked to microbiology data — ASHP AMS implementation requires a pharmacy information system integrated with HIS and microbiology LIS, which 70%+ of Saudi hospitals lack.",
        ],
        challengesAr: [
          "تحمل صيدليات المستشفيات السعودية مخزون 5.4 أشهر في المتوسط (مقابل 2–2.5 شهر الموصى به من JCI) — يوصي ASHP بتحديد مستهدفات أيام تغطية على مستوى القائمة الدوائية باستخدام تصنيف VEN: الأصناف الحيوية 7 أيام والأساسية 14 يومًا وغير الأساسية 30 يومًا؛ هذا وحده يخفض رأس المال العامل للصيدلية بنسبة 40–50%.",
          "تتطلب المستحضرات البيولوجية والأدوية المتخصصة (40–60% من إنفاق الصيدلية) إدارة سلسلة تبريد مستمرة يتعامل معها معظم المستشفيات السعودية بشكل غير رسمي — يتطلب JCI MMU.3 إجراءات سلسلة تبريد موثّقة ببروتوكولات استجابة للتجاوزات وسجلات مراقبة درجة حرارة مستمرة.",
          "يُلزم تعميم ترشيد مضادات الميكروبات من وزارة الصحة السعودية 2023 بتقارير آنية لاستهلاك المضادات الحيوية مرتبطة ببيانات الأحياء الدقيقة — يتطلب تطبيق AMS من ASHP نظام معلومات صيدلية متكاملاً مع نظام معلومات المستشفى ونظام معلومات مختبر الأحياء الدقيقة، وهو ما يفتقر إليه أكثر من 70% من المستشفيات السعودية.",
        ],
        solution: "ISC builds ASHP and JCI-compliant hospital pharmacy supply chain systems with VEN-based formulary management, automated DOH-based replenishment, JCI MMU-compliant cold-chain management, and AMS-ready pharmacy information architecture — reducing inventory from 5.4 to 2.8 months and wastage from 5% to under 1%.",
        solutionAr: "تبني ISC أنظمة سلسلة إمداد لصيدليات المستشفيات متوافقة مع ASHP وJCI بإدارة قائمة دوائية قائمة على VEN وتجديد آلي قائم على أيام التغطية وإدارة سلسلة تبريد متوافقة مع JCI MMU وبنية معلومات صيدلية جاهزة لترشيد مضادات الميكروبات — مقللةً المخزون من 5.4 إلى 2.8 شهر والهدر من 5% إلى أقل من 1%.",
      },
      {
        type: 'downstream',
        name: "Downstream — Clinical Logistics, FM Services & Biomedical Governance",
        nameAr: "المصب — اللوجستيات السريرية وخدمات إدارة المرافق وحوكمة المعدات الطبية الحيوية",
        color: "#C9A84C",
        standards: ["CIPS Healthcare Facilities Management Procurement Standard", "EFPIA (European Fed. of Pharmaceutical Industries) Supply Chain Principles", "ISO 9001:2015 Healthcare Service Provider Clause 8.5", "IHTSDO Clinical Terminology Standards (for supply chain coding)", "JCI Environment of Care (EC) Standards"],
        processes: [
          "Point-of-care (POC) supply delivery: ward-level kanban, pneumatic tube pharmacy & robot dispensing",
          "FM procurement governance: catering, linen, housekeeping & security — KPI-linked contracts",
          "Biomedical equipment maintenance: OEM vs. independent service provider benchmarking & tender",
          "Capital equipment replacement planning: ISO 55001 lifecycle costing & replacement schedule",
          "Infection control supply chain: PPE, sterilisation consumables & critical shortage protocol (ECDC framework)",
          "Vendor performance scorecards: OTIF, quality incidents, SFDA/JCI findings & response time",
        ],
        processesAr: [
          "توريد نقطة الرعاية (POC): كانبان على مستوى الجناح والصيدلية بالأنبوب الهوائي والصرف الآلي",
          "حوكمة مشتريات إدارة المرافق: التغذية والمفروشات والتدبير الفندقي والأمن — عقود مرتبطة بمؤشرات الأداء",
          "صيانة المعدات الطبية الحيوية: المقارنة المعيارية بين الشركة المصنّعة الأصلية ومزوّد الخدمة المستقل والمناقصة",
          "تخطيط استبدال المعدات الرأسمالية: حساب تكلفة دورة الحياة وفق ISO 55001 وجدول الاستبدال",
          "سلسلة إمداد مكافحة العدوى: معدات الوقاية الشخصية ومستهلكات التعقيم وبروتوكول النقص الحرج (إطار ECDC)",
          "بطاقات أداء الموردين: OTIF وحوادث الجودة ونتائج SFDA/JCI وزمن الاستجابة",
        ],
        flow: ["Ward Requisition", "POC Delivery (Kanban)", "FM Service Delivery", "Biomedical Maintenance", "Vendor KPI Review"],
        flowAr: ["طلب الجناح", "توصيل نقطة الرعاية (كانبان)", "تقديم خدمة إدارة المرافق", "صيانة المعدات الطبية الحيوية", "مراجعة مؤشرات أداء المورد"],
        challenges: [
          "FM contracts in Saudi hospitals are over-specified and under-managed — CIPS Healthcare FM Guide shows that KPI-free automatic renewal contracts deliver 20–30% below-benchmark service quality and 15–25% above-benchmark cost vs. competitively tendered, KPI-linked alternatives.",
          "Biomedical maintenance sole-sourced to OEMs at 25–40% premium over independent service providers (ISPs) — JCI EC standards require documented maintenance schedules but do not mandate OEM servicing; CIPS benchmarking shows ISP-managed biomedical programmes cost 22–35% less.",
          "Capital equipment replacement is reactive rather than planned — ISO 55001 asset lifecycle cost modelling shows that planned replacement programmes reduce emergency procurement (at 30–50% premium) and eliminate the patient safety risk of equipment failure during clinical use.",
        ],
        challengesAr: [
          "عقود إدارة المرافق في المستشفيات السعودية مُفرطة التحديد وضعيفة الإدارة — يُظهر دليل إدارة مرافق الرعاية الصحية من CIPS أن عقود التجديد التلقائي الخالية من مؤشرات الأداء تحقق جودة خدمة أدنى من المعيار بنسبة 20–30% وتكلفة أعلى من المعيار بنسبة 15–25% مقابل البدائل المطروحة تنافسيًا والمرتبطة بمؤشرات الأداء.",
          "صيانة المعدات الطبية الحيوية المُسندة حصريًا للشركات المصنّعة الأصلية بعلاوة 25–40% فوق مزوّدي الخدمة المستقلين — تتطلب معايير بيئة الرعاية من JCI جداول صيانة موثّقة لكنها لا تُلزم بخدمة الشركة المصنّعة؛ تُظهر مقارنة CIPS أن البرامج الطبية الحيوية المُدارة عبر مزوّد مستقل تكلّف أقل بنسبة 22–35%.",
          "استبدال المعدات الرأسمالية تفاعلي لا مخطط — تُظهر نمذجة تكلفة دورة حياة الأصول وفق ISO 55001 أن برامج الاستبدال المخطّطة تقلّل الشراء الطارئ (بعلاوة 30–50%) وتزيل مخاطر سلامة المريض الناتجة عن عطل المعدات أثناء الاستخدام السريري.",
        ],
        solution: "ISC conducts CIPS Healthcare FM procurement reviews introducing competitive tendering and KPI frameworks, benchmarks biomedical maintenance against ISP alternatives, and implements ISO 55001 capital replacement plans — saving 20–30% on non-clinical procurement and eliminating equipment safety risks.",
        solutionAr: "تُجري ISC مراجعات لمشتريات إدارة مرافق الرعاية الصحية بإدخال المناقصات التنافسية وأطر مؤشرات الأداء، وتقارن صيانة المعدات الطبية الحيوية ببدائل مزوّدي الخدمة المستقلين، وتطبّق خطط استبدال رأسمالي وفق ISO 55001 — موفّرةً 20–30% على المشتريات غير السريرية ومزيلةً مخاطر سلامة المعدات.",
      },
    ],
    cases: [
      { client: "GCC Hospital Network (12 facilities)", clientAr: "شبكة مستشفيات خليجية (12 منشأة)", challenge: "5.4 months pharmacy DOH; 5.2% expiry waste; 12 critical stock-outs; JCI MMU non-conformance; ASHP assessment: bottom quartile", challengeAr: "تغطية صيدلية 5.4 أشهر؛ هدر انتهاء صلاحية 5.2%؛ 12 حالة نفاد حرجة؛ عدم مطابقة JCI MMU؛ تقييم ASHP في الربع الأدنى", result: "2.8 months DOH; 1.1% wastage; zero stock-outs 18 months; JCI MMU achieved; ASHP assessment: 3rd quartile", resultAr: "تغطية 2.8 شهر؛ هدر 1.1%؛ صفر حالات نفاد لمدة 18 شهرًا؛ تحقيق JCI MMU؛ تقييم ASHP في الربع الثالث" },
      { client: "Private Saudi Hospital Group", clientAr: "مجموعة مستشفيات سعودية خاصة", challenge: "Biomedical maintenance SAR 18M/yr; OEM sole-source; 23% equipment past optimal lifecycle; ISO 55001 absent", challengeAr: "صيانة معدات طبية حيوية بقيمة 18 مليون SAR سنويًا؛ إسناد حصري للشركة المصنّعة؛ 23% من المعدات تجاوزت دورة الحياة المثلى؛ غياب ISO 55001", result: "SAR 4.8M annual saving; ISO 55001 replacement programme; ISP programme implemented; zero patient safety incidents", resultAr: "وفورات سنوية بقيمة 4.8 ملايين SAR؛ برنامج استبدال وفق ISO 55001؛ تطبيق برنامج مزوّد خدمة مستقل؛ صفر حوادث سلامة مرضى" },
    ],
  },

  tech: {
    name: "Technology & ICT",
    nameAr: "التقنية وتقنية المعلومات والاتصالات",
    tagline: "Supply chains for the Kingdom's digital economy ambitions",
    taglineAr: "سلاسل إمداد لطموحات الاقتصاد الرقمي في المملكة",
    intro: "Saudi Arabia's ICT sector — driven by Vision 2030 digital economy targets and NEOM's technology ambitions — is one of the world's fastest-growing. From hyperscale data centres to smart city infrastructure, technology supply chains require CIPS IT Procurement Standard, APICS SCOR digital transformation methodology, ISO/IEC 20000-1:2018 IT Service Management, and ITIL 4 supply chain principles to manage global hardware shortages, software licensing complexity, and IT vendor risk.",
    introAr: "يُعد قطاع تقنية المعلومات والاتصالات في المملكة العربية السعودية — المدفوع بمستهدفات الاقتصاد الرقمي ضمن رؤية 2030 وطموحات نيوم التقنية — من أسرع القطاعات نموًا في العالم. من مراكز البيانات فائقة السعة إلى بنية المدن الذكية، تتطلب سلاسل الإمداد التقنية معيار مشتريات تقنية المعلومات من CIPS ومنهجية التحول الرقمي من APICS SCOR وإدارة خدمات تقنية المعلومات ISO/IEC 20000-1:2018 ومبادئ سلسلة الإمداد في ITIL 4 لإدارة النقص العالمي في الأجهزة وتعقيد تراخيص البرمجيات ومخاطر موردي تقنية المعلومات.",
    icon: Cpu,
    heroColor: "#1a3a6b",
    streams: [
      {
        type: 'upstream',
        name: "Upstream — Hardware Procurement, Software Licensing & Vendor Management",
        nameAr: "المنبع — شراء الأجهزة وتراخيص البرمجيات وإدارة الموردين",
        color: "#1a3a6b",
        standards: ["CIPS IT Category Management Standard", "CPSM Module 2: Strategic Sourcing (Technology)", "BSA (Business Software Alliance) Software Asset Management Guide", "ISO/IEC 19770-1:2017 Software Asset Management", "IACCM IT Contract Management Standard"],
        processes: [
          "IT hardware category management: server, network, end-user devices & data centre — rolling 18-month pipeline",
          "Software licence optimisation: ISO/IEC 19770-1 SAM programme, true-up management & EA negotiation",
          "Cloud procurement strategy: OPEX vs. CAPEX, multi-cloud governance & FinOps framework",
          "IT vendor qualification: financial health, cybersecurity posture, SLA track record & reference checks",
          "IACCM-aligned IT contract management: SLA design, IP ownership, data ownership & exit provisions",
          "Shadow IT governance: procurement policy enforcement, approved tool catalogue & exception process",
        ],
        processesAr: [
          "إدارة فئات أجهزة تقنية المعلومات: الخوادم والشبكات وأجهزة المستخدم ومركز البيانات — خط متجدد لـ18 شهرًا",
          "تحسين تراخيص البرمجيات: برنامج إدارة أصول البرمجيات ISO/IEC 19770-1 وإدارة التسوية والتفاوض على الاتفاقيات المؤسسية",
          "استراتيجية شراء السحابة: النفقات التشغيلية مقابل الرأسمالية وحوكمة السحابة المتعددة وإطار FinOps",
          "تأهيل موردي تقنية المعلومات: السلامة المالية والوضع السيبراني وسجل اتفاقيات مستوى الخدمة والتحقق من المراجع",
          "إدارة عقود تقنية المعلومات المواءَمة مع IACCM: تصميم اتفاقية مستوى الخدمة وملكية الملكية الفكرية وملكية البيانات وأحكام الخروج",
          "حوكمة تقنية المعلومات الظلية: إنفاذ سياسة المشتريات وكتالوج الأدوات المعتمدة وعملية الاستثناء",
        ],
        flow: ["18-Month IT Forecast", "Category Strategy", "Vendor Qualification", "Contract Negotiation", "Asset Registration"],
        flowAr: ["توقّع تقنية المعلومات لـ18 شهرًا", "استراتيجية الفئة", "تأهيل المورد", "التفاوض على العقد", "تسجيل الأصول"],
        challenges: [
          "Global semiconductor shortages have extended server and networking equipment lead times to 40–80 weeks — CIPS IT Procurement Standard recommends an 18-month rolling hardware procurement forecast with pre-commitment framework agreements to avoid critical-path infrastructure delays.",
          "Software licence overspend of 25–35% is endemic — ISO/IEC 19770-1 Software Asset Management programme implementation requires a complete licence inventory, consumption reconciliation against entitlement, and elimination of unused subscriptions; this alone delivers 25–35% immediate savings.",
          "SaaS sprawl averaging 100–200 applications per Saudi enterprise (30–40% redundant) — CIPS IT Category Management Standard requires a unified SaaS governance process including a master subscription register, business justification review, and annual rationalisation cycle.",
        ],
        challengesAr: [
          "أدى النقص العالمي في أشباه الموصلات إلى تمديد مهل توريد الخوادم ومعدات الشبكات إلى 40–80 أسبوعًا — يوصي معيار مشتريات تقنية المعلومات من CIPS بتوقّع مشتريات أجهزة متجدد لـ18 شهرًا باتفاقيات إطارية بالتزام مسبق لتجنّب تأخيرات البنية التحتية على المسار الحرج.",
          "الإفراط في إنفاق تراخيص البرمجيات بنسبة 25–35% متوطّن — يتطلب تطبيق برنامج إدارة أصول البرمجيات ISO/IEC 19770-1 جردًا كاملاً للتراخيص وتسوية الاستهلاك مقابل الاستحقاق وإزالة الاشتراكات غير المستخدمة؛ هذا وحده يحقق وفورات فورية بنسبة 25–35%.",
          "انتشار برمجيات SaaS بمتوسط 100–200 تطبيق لكل مؤسسة سعودية (30–40% مكرر) — يتطلب معيار إدارة فئات تقنية المعلومات من CIPS عملية حوكمة SaaS موحّدة تشمل سجل اشتراكات رئيسيًا ومراجعة تبرير الأعمال ودورة ترشيد سنوية.",
        ],
        solution: "ISC implements ISO/IEC 19770-1 SAM programmes and CIPS IT category management with rolling hardware forecasts — eliminating 25–35% software overspend within 90 days, rationalising SaaS estates by 30–40%, and preventing hardware supply failures through 18-month pipeline procurement.",
        solutionAr: "تطبّق ISC برامج إدارة أصول البرمجيات ISO/IEC 19770-1 وإدارة فئات تقنية المعلومات من CIPS بتوقعات أجهزة متجددة — مزيلةً 25–35% من الإفراط في إنفاق البرمجيات خلال 90 يومًا ومرشّدةً حيازات SaaS بنسبة 30–40% ومانعةً إخفاقات إمداد الأجهزة عبر خط مشتريات لـ18 شهرًا.",
      },
      {
        type: 'midstream',
        name: "Midstream — IT Asset Management, Deployment & Cloud Governance",
        nameAr: "الوسط — إدارة أصول تقنية المعلومات والنشر وحوكمة السحابة",
        color: "#2d508a",
        standards: ["ITIL 4 Service Management (Asset & Configuration Management)", "FinOps Foundation Cloud Financial Management Standard", "ISO/IEC 27001:2022 Information Security Management", "APICS SCOR Digital Supply Chain Framework", "Gartner IT Asset Management Maturity Model"],
        processes: [
          "IT asset lifecycle management: procurement, deployment, maintenance, refresh & secure disposal",
          "ITIL 4 CMDB (Configuration Management Database): asset discovery, dependency mapping & change tracking",
          "Cloud FinOps governance: reserved instances, rightsizing, tag-based cost allocation & showback/chargeback",
          "IT security supply chain: ISO/IEC 27001-aligned vendor security assessments & TPRM programme",
          "Software deployment management: licence-compliant distribution, configuration management & patch governance",
          "IT project supply chain: hardware delivery scheduling, staging, configuration & deployment logistics",
        ],
        processesAr: [
          "إدارة دورة حياة أصول تقنية المعلومات: الشراء والنشر والصيانة والتحديث والتخلص الآمن",
          "قاعدة بيانات إدارة التكوين ITIL 4 (CMDB): اكتشاف الأصول ورسم التبعيات وتتبّع التغيير",
          "حوكمة FinOps السحابية: الحالات المحجوزة وتصحيح الحجم وتخصيص التكلفة القائم على الوسم وإظهار/تحميل التكاليف",
          "سلسلة إمداد أمن تقنية المعلومات: تقييمات أمن الموردين المواءَمة مع ISO/IEC 27001 وبرنامج إدارة مخاطر الطرف الثالث",
          "إدارة نشر البرمجيات: التوزيع المتوافق مع التراخيص وإدارة التكوين وحوكمة الترقيع",
          "سلسلة إمداد مشاريع تقنية المعلومات: جدولة تسليم الأجهزة والتجهيز والتكوين ولوجستيات النشر",
        ],
        flow: ["IT Procurement", "Asset Registration (CMDB)", "Deployment & Config", "Lifecycle Monitoring", "Refresh / Disposal"],
        flowAr: ["شراء تقنية المعلومات", "تسجيل الأصول (CMDB)", "النشر والتكوين", "مراقبة دورة الحياة", "التحديث / التخلص"],
        challenges: [
          "Cloud costs growing 40–80% annually without FinOps governance represent the fastest-growing uncontrolled cost in most Saudi technology organisations — FinOps Foundation data shows that organisations implementing FinOps reduce cloud waste by 30% in the first 90 days through reservation coverage and rightsizing alone.",
          "Unmanaged CMDB means IT teams cannot accurately answer 'what hardware do we have, where is it, and when does it need replacing?' — Gartner shows IT asset management maturity below Level 3 (out of 5) correlates with 20–30% excess inventory and 15–20% over-licencing.",
          "Third-party vendor cyber risk is the fastest-growing attack vector — ISO/IEC 27001:2022 requires a documented Third-Party Risk Management (TPRM) programme with security assessments for all vendors with access to organisational systems.",
        ],
        challengesAr: [
          "نمو تكاليف السحابة بنسبة 40–80% سنويًا دون حوكمة FinOps يمثّل أسرع التكاليف غير المنضبطة نموًا في معظم المؤسسات التقنية السعودية — تُظهر بيانات مؤسسة FinOps أن المؤسسات التي تطبّق FinOps تخفض هدر السحابة بنسبة 30% في أول 90 يومًا عبر تغطية الحجوزات وتصحيح الحجم وحدهما.",
          "قاعدة بيانات إدارة التكوين غير المُدارة تعني أن فرق تقنية المعلومات لا تستطيع الإجابة بدقة عن 'ما الأجهزة التي نملكها وأين هي ومتى تحتاج للاستبدال؟' — يُظهر Gartner أن نضج إدارة أصول تقنية المعلومات دون المستوى الثالث (من 5) يرتبط بمخزون فائض 20–30% وإفراط في الترخيص 15–20%.",
          "مخاطر الطرف الثالث السيبرانية هي أسرع متجهات الهجوم نموًا — يتطلب ISO/IEC 27001:2022 برنامج إدارة مخاطر طرف ثالث (TPRM) موثّقًا بتقييمات أمنية لجميع الموردين ذوي الوصول إلى أنظمة المؤسسة.",
        ],
        solution: "ISC implements ITIL 4 CMDB programmes, FinOps Foundation-aligned cloud governance, and ISO/IEC 27001-compliant TPRM programmes — reducing cloud waste by 30%, eliminating hardware over-procurement by 20%, and mitigating third-party cyber supply chain risk.",
        solutionAr: "تطبّق ISC برامج قاعدة بيانات إدارة التكوين ITIL 4 وحوكمة سحابية مواءَمة مع مؤسسة FinOps وبرامج إدارة مخاطر طرف ثالث متوافقة مع ISO/IEC 27001 — مقللةً هدر السحابة بنسبة 30% ومزيلةً الإفراط في شراء الأجهزة بنسبة 20% ومخففةً مخاطر سلسلة الإمداد السيبرانية من الطرف الثالث.",
      },
      {
        type: 'downstream',
        name: "Downstream — IT Service Management, Vendor Governance & Cybersecurity Supply Chain",
        nameAr: "المصب — إدارة خدمات تقنية المعلومات وحوكمة الموردين وسلسلة إمداد الأمن السيبراني",
        color: "#C9A84C",
        standards: ["ISO/IEC 20000-1:2018 IT Service Management", "ITIL 4 Supplier Management Practice", "NCSC (National Cyber Security Centre UK / NCA Saudi) Supply Chain Security", "IACCM IT Outsourcing Contract Standard", "CIS Controls v8 Supply Chain Security"],
        processes: [
          "IT service provider governance: ISO/IEC 20000-1 supplier management practice & quarterly reviews",
          "Outsourcing contract management: SLA measurement, penalty administration & service improvement plans",
          "Cybersecurity vendor management: CIS Controls v8 SC-03 assessment, penetration test review & patching SLA",
          "Service desk supply chain: hardware break-fix vendor management, parts availability & SLA compliance",
          "Vendor consolidation: rationalise 15–30 security vendors to integrated platform approach (CIPS)",
          "Exit management: data migration, knowledge transfer, parallel running & transition supply chain plan",
        ],
        processesAr: [
          "حوكمة مزوّدي خدمات تقنية المعلومات: ممارسة إدارة الموردين ISO/IEC 20000-1 والمراجعات الفصلية",
          "إدارة عقود التعهيد: قياس اتفاقية مستوى الخدمة وإدارة الغرامات وخطط تحسين الخدمة",
          "إدارة موردي الأمن السيبراني: تقييم CIS Controls v8 SC-03 ومراجعة اختبار الاختراق واتفاقية مستوى خدمة الترقيع",
          "سلسلة إمداد مكتب الخدمة: إدارة موردي إصلاح الأجهزة وتوفّر القطع والامتثال لاتفاقية مستوى الخدمة",
          "توحيد الموردين: ترشيد 15–30 مورد أمن إلى نهج منصة متكاملة (CIPS)",
          "إدارة الخروج: هجرة البيانات ونقل المعرفة والتشغيل المتوازي وخطة سلسلة إمداد الانتقال",
        ],
        flow: ["Service Request", "ISO 20000 SLA Gate", "Vendor Dispatch", "KPI Measurement", "Governance Review"],
        flowAr: ["طلب الخدمة", "بوابة اتفاقية مستوى الخدمة ISO 20000", "إرسال المورد", "قياس مؤشرات الأداء", "مراجعة الحوكمة"],
        challenges: [
          "IT outsourcing contracts in Saudi Arabia commonly lack enforceable SLA measurement methodologies — IACCM IT Outsourcing Standard shows that SLAs without agreed measurement tools and independent data sources are 40% less likely to trigger penalty payments, regardless of service failure.",
          "Cybersecurity vendor proliferation (15–30 security vendors) creates coverage gaps and management overload — CIS Controls v8 recommends a platform-based consolidation to 5–8 integrated security vendors; Gartner data shows consolidation reduces security management cost by 25–40%.",
          "IT supplier exit management is consistently underplanned — ITIL 4 Supplier Management Practice requires a documented exit management clause in every IT outsourcing contract, including knowledge transfer milestones, data repatriation timelines, and transition supply chain planning.",
        ],
        challengesAr: [
          "غالبًا ما تفتقر عقود تعهيد تقنية المعلومات في المملكة إلى منهجيات قابلة للإنفاذ لقياس اتفاقية مستوى الخدمة — يُظهر معيار تعهيد تقنية المعلومات من IACCM أن اتفاقيات مستوى الخدمة دون أدوات قياس متفق عليها ومصادر بيانات مستقلة أقل احتمالاً بنسبة 40% لتفعيل مدفوعات الغرامات بغضّ النظر عن فشل الخدمة.",
          "تكاثر موردي الأمن السيبراني (15–30 موردًا) يخلق فجوات تغطية وإرهاقًا في الإدارة — يوصي CIS Controls v8 بتوحيد قائم على منصة إلى 5–8 موردي أمن متكاملين؛ تُظهر بيانات Gartner أن التوحيد يخفض تكلفة إدارة الأمن بنسبة 25–40%.",
          "إدارة خروج موردي تقنية المعلومات ضعيفة التخطيط باستمرار — تتطلب ممارسة إدارة الموردين ITIL 4 بند إدارة خروج موثّقًا في كل عقد تعهيد لتقنية المعلومات يشمل مراحل نقل المعرفة وجداول إعادة توطين البيانات وتخطيط سلسلة إمداد الانتقال.",
        ],
        solution: "ISC designs ISO/IEC 20000-1-compliant IT service governance frameworks with IACCM-aligned outsourcing contracts, implements CIS Controls v8-based cybersecurity vendor consolidation strategies, and delivers ITIL 4 exit management programmes — reducing IT service management cost by 15–20% and closing all critical cyber supply chain gaps.",
        solutionAr: "تصمّم ISC أطر حوكمة خدمات تقنية معلومات متوافقة مع ISO/IEC 20000-1 بعقود تعهيد مواءَمة مع IACCM، وتطبّق استراتيجيات توحيد موردي الأمن السيبراني القائمة على CIS Controls v8، وتقدّم برامج إدارة الخروج وفق ITIL 4 — مقللةً تكلفة إدارة خدمات تقنية المعلومات بنسبة 15–20% ومغلِقةً جميع فجوات سلسلة الإمداد السيبرانية الحرجة.",
      },
    ],
    cases: [
      { client: "Saudi Government Technology Entity", clientAr: "جهة تقنية حكومية سعودية", challenge: "Software licence overspend SAR 22M/yr; 180 SaaS apps (45% underutilised); ISO 19770 not implemented; no SAM programme", challengeAr: "إفراط في إنفاق تراخيص البرمجيات بقيمة 22 مليون SAR سنويًا؛ 180 تطبيق SaaS (45% غير مستغَل)؛ لم يُطبَّق ISO 19770؛ لا يوجد برنامج إدارة أصول برمجيات", result: "SAR 8.4M annual saving; 110 SaaS apps (down from 180); ISO/IEC 19770-1 Level 2 achieved", resultAr: "وفورات سنوية بقيمة 8.4 ملايين SAR؛ 110 تطبيقات SaaS (بعد أن كانت 180)؛ تحقيق ISO/IEC 19770-1 المستوى الثاني" },
      { client: "GCC Telecom Operator", clientAr: "مشغّل اتصالات خليجي", challenge: "Hardware lead-time surprises (18+ months); no 18-month pipeline; FinOps absent; cloud costs growing 65% YoY", challengeAr: "مفاجآت في مهل توريد الأجهزة (أكثر من 18 شهرًا)؛ لا يوجد خط لـ18 شهرًا؛ غياب FinOps؛ نمو تكاليف السحابة بنسبة 65% سنويًا", result: "18-month rolling IT procurement plan; SAR 12M hardware savings; cloud waste reduced 32%; FinOps Level 2 achieved", resultAr: "خطة مشتريات تقنية معلومات متجددة لـ18 شهرًا؛ وفورات أجهزة بقيمة 12 مليون SAR؛ خفض هدر السحابة بنسبة 32%؛ تحقيق FinOps المستوى الثاني" },
    ],
  },

};

function ProcessFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <span className="px-3 py-1.5 bg-white border border-primary/20 rounded-lg text-xs font-semibold text-primary shadow-sm whitespace-nowrap">
            {step}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StandardsPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/6 border border-primary/15 rounded-full text-[11px] font-semibold text-primary/80 whitespace-nowrap">
      <BookOpen className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

function StreamCard({ stream, index }: { stream: Stream; index: number }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(index === 0);
  const meta = STREAM_LABELS[stream.type];
  const MetaIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
            style={{ background: meta.bg }}>
            <MetaIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                style={{ background: meta.bg }}>
                {ar ? meta.labelAr : meta.label}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">{ar ? meta.descAr : meta.desc}</span>
            </div>
            <h3 className="text-base font-extrabold text-primary leading-tight">{ar ? stream.nameAr : stream.name}</h3>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-6 border-t border-border">
          {/* Professional Standards */}
          <div className="pt-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">{ar ? 'المعايير المهنية المطبَّقة' : 'Professional Standards Applied'}</h4>
            <div className="flex flex-wrap gap-2">
              {stream.standards.map(s => <StandardsPill key={s} label={s} />)}
            </div>
          </div>

          {/* Processes */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{ar ? 'العمليات والأنشطة الرئيسية' : 'Key Processes & Activities'}</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {(ar ? stream.processesAr : stream.processes).map((p, i) => (
                <div key={p} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 text-white mt-0.5"
                    style={{ background: stream.color }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/80">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Process Flow */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{ar ? 'تدفّق العملية' : 'Process Flow'}</h4>
            <div className="bg-primary/3 rounded-xl p-4 border border-primary/10">
              <ProcessFlow steps={ar ? stream.flowAr : stream.flow} />
            </div>
          </div>

          {/* Challenges */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{ar ? 'تحديات القطاع' : 'Industry Challenges'}</h4>
            <div className="space-y-3">
              {(ar ? stream.challengesAr : stream.challenges).map((c, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50/60 rounded-xl p-4 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ISC Solution */}
          <div className="bg-[#C9A84C]/8 rounded-xl p-4 border border-[#C9A84C]/25 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-1">{ar ? 'حل ISC' : 'ISC Solution'}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{ar ? stream.solutionAr : stream.solution}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function IndustryPage() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const info = industryData[slug];

  if (!info) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold text-primary mb-4">{ar ? 'القطاع غير موجود' : 'Industry Not Found'}</h1>
        <p className="text-muted-foreground mb-6">{ar ? 'لم نتمكن من العثور على محتوى لهذا القطاع.' : 'We could not find content for that industry.'}</p>
        <Link href="/"><Button>{ar ? 'العودة إلى الرئيسية' : 'Back to Home'}</Button></Link>
      </div>
    );
  }

  const Icon = info.icon;
  const infoName = ar ? info.nameAr : info.name;

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full py-20 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${info.heroColor} 0%, #082C6B 60%, #0B3D91 100%)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.4) 0%, transparent 60%)' }} />
        <div className="relative z-10 container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">{ar ? 'التركيز القطاعي' : 'Industry Focus'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">{infoName}</h1>
          <p className="text-white/80 text-lg max-w-3xl">{ar ? info.taglineAr : info.tagline}</p>
        </div>
      </div>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-foreground/80 text-lg leading-relaxed border-l-4 border-[#C9A84C] pl-6"
          >
            {ar ? info.introAr : info.intro}
          </motion.p>
        </div>
      </section>

      {/* Stream Legend */}
      <section className="py-6 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(STREAM_LABELS) as [string, typeof STREAM_LABELS[keyof typeof STREAM_LABELS]][]).map(([key, meta]) => {
              const MIcon = meta.icon;
              return (
                <div key={key} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-border shadow-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ background: meta.bg }}>
                    <MIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: meta.bg }}>{ar ? meta.labelAr : meta.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{ar ? meta.descAr : meta.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Streams */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'بنية سلسلة الإمداد' : 'Supply Chain Architecture'}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-2">{ar ? 'المنبع · الوسط · المصب' : 'Upstream · Midstream · Downstream'}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{ar ? 'مواءَمة مع CIPS وCPSM وAPICS SCOR وISO والمعايير المهنية الخاصة بكل قطاع' : 'Aligned with CIPS, CPSM, APICS SCOR, ISO, and industry-specific professional standards'}</p>
          </motion.div>
          <div className="space-y-6">
            {info.streams.map((stream, si) => (
              <StreamCard key={stream.name} stream={stream} index={si} />
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'نتائج مثبتة' : 'Proven Results'}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mt-2">{ar ? `دراسات حالة ${infoName}` : `${infoName} Case Studies`}</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {info.cases.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: info.heroColor + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: info.heroColor }} />
                  </div>
                  <h3 className="font-bold text-primary leading-tight">{ar ? c.clientAr : c.client}</h3>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">{ar ? 'التحدي' : 'Challenge'}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{ar ? c.challengeAr : c.challenge}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-700 font-bold uppercase tracking-widest mb-1">{ar ? 'النتيجة' : 'Result'}</p>
                  <p className="text-sm text-green-800 font-medium leading-relaxed">{ar ? c.resultAr : c.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/case-studies">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                {ar ? 'عرض جميع دراسات الحالة' : 'View All Case Studies'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#082C6B]">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            {ar ? `هل أنت مستعد لتحويل سلسلة إمداد ${infoName}؟` : `Ready to Transform Your ${infoName} Supply Chain?`}
          </h2>
          <p className="text-white/70 text-lg">
            {ar
              ? 'احجز استشارة سرّية مع مَعِين الحقش MCIPS · CPSM · MSc — مصمّمة خصيصًا لتحديات المنبع والوسط والمصب في قطاعك.'
              : "Book a confidential consultation with Ma'in Alhaqash MCIPS · CPSM · MSc — tailored specifically to your industry's upstream, midstream, and downstream challenges."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-[#C9A84C] hover:bg-[#b8963e] text-white font-bold px-8">
                {ar ? 'احجز استشارة' : 'Book a Consultation'} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/maturity">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">
                {ar ? 'ابدأ تقييم النضج' : 'Start Maturity Assessment'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
