/**
 * maturitySubSegData1to5.ts
 *
 * Sub-segment content for CORE_SEGMENTS indices 0–4:
 *   0 = Strategy   1 = Procurement   2 = CLM   3 = SRM   4 = Risk
 *
 * Answer key convention (Option A — flat, 3-part):
 *   "{segIdx}-{subIdx}-{questionIdx}"
 *
 * These are distinct from the legacy 5 flat questions which use the
 * 2-part "{segIdx}-{questionIdx}" format and are read by segScore().
 * The two formats coexist with no key conflicts.
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

// ── Local type (structurally compatible with SubSegment in maturityData.tsx) ─

export interface SubSegmentData {
  id: string;
  title: string;
  titleAr: string;
  hint?: string;
  hintAr?: string;
  questions: {
    q: string;
    qAr: string;
    levels:   [string, string, string, string, string];
    levelsAr: [string, string, string, string, string];
  }[];
  benchmarks: { gcc: number; topQuartile: number };
  industryWeights: Record<string, number>;
  evidence?: { label: string; labelAr: string; hint: string; hintAr: string };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 0 — STRATEGY  (segIdx 0)
   Sub-segments:
     0 Strategic Alignment · 1 Network Design & Footprint
     2 S&OP / IBP Integration · 3 Scenario Planning
     4 Performance Governance · 5 Digital & Innovation Roadmap
═══════════════════════════════════════════════════════════════════════════ */

export const STRATEGY_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 0-0  Strategic Alignment ─────────────────────────────────────────── */
  {
    id: 'strategy-align',
    title: 'Strategic Alignment',
    titleAr: 'المواءمة الاستراتيجية',
    hint: 'Assesses whether the supply chain strategy is formally documented, explicitly linked to corporate objectives, and owned at board level.',
    hintAr: 'يقيس مدى توثيق استراتيجية سلسلة الإمداد رسميًا وارتباطها الصريح بالأهداف المؤسسية وملكيتها على مستوى مجلس الإدارة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supply chain strategy document',
      labelAr: 'وثيقة استراتيجية سلسلة الإمداد',
      hint: 'Upload your supply chain strategy document (board-approved, dated within the last 12 months).',
      hintAr: 'ارفع وثيقة استراتيجية سلسلة الإمداد (معتمدة من مجلس الإدارة، خلال آخر 12 شهرًا).',
    },
    questions: [
      {
        q: 'How clearly is your supply chain strategy documented and explicitly linked to the organisation\'s corporate strategic objectives?',
        qAr: 'ما مدى وضوح توثيق استراتيجية سلسلة الإمداد لديكم وارتباطها الصريح بالأهداف الاستراتيجية للمؤسسة؟',
        levels: [
          'No supply chain strategy document exists. The function operates from tacit knowledge and day-to-day operational instinct with no documented direction.',
          'A high-level supply chain direction exists informally in senior management\'s minds but has never been documented or connected to corporate goals.',
          'A documented supply chain strategy is approved at director level, explicitly references corporate objectives, and is shared with supply chain leadership.',
          'A board-endorsed supply chain strategy maps clearly to corporate strategic pillars, includes measurable outcomes per objective, and is reviewed annually.',
          'The supply chain strategy is a formally approved board document, updated annually, with every objective traceable to a corporate KPI and a named executive accountable for delivery.',
        ],
        levelsAr: [
          'لا توجد وثيقة استراتيجية لسلسلة الإمداد. تعمل الوظيفة كليًا من المعرفة الضمنية والحدس التشغيلي اليومي دون أي توجّه موثّق.',
          'يوجد توجّه عام لسلسلة الإمداد في أذهان الإدارة العليا بشكل غير رسمي لكنه لم يُوثَّق قط أو يُربط بالأهداف المؤسسية.',
          'استراتيجية موثّقة لسلسلة الإمداد معتمدة على مستوى المدير، تشير صراحةً إلى الأهداف المؤسسية، وتُتداوَل مع قيادة سلسلة الإمداد.',
          'استراتيجية سلسلة الإمداد المعتمدة من مجلس الإدارة متوافقة بوضوح مع الركائز الاستراتيجية المؤسسية، وتتضمن نتائج قابلة للقياس لكل هدف، وتُراجَع سنويًا.',
          'استراتيجية سلسلة الإمداد وثيقة معتمدة رسميًا من مجلس الإدارة، تُحدَّث سنويًا، وكل هدف فيها قابل للتتبّع إلى مؤشر أداء مؤسسي مع مدير تنفيذي مسمّى مسؤول بشكل رسمي عن تحقيقه.',
        ],
      },
      {
        q: 'How consistently is the supply chain strategy communicated across the business and understood by managers responsible for its execution?',
        qAr: 'ما مدى اتساق تواصل استراتيجية سلسلة الإمداد عبر المؤسسة وفهمها من قِبَل المديرين المسؤولين عن تنفيذها؟',
        levels: [
          'The supply chain strategy — if it exists — is known only to the most senior leader. Mid-level managers and operational teams are unaware of any strategic direction.',
          'The strategy is known to senior supply chain leaders but has not been communicated in a structured way to mid-level managers or cross-functional teams.',
          'The strategy is communicated annually through team briefings; most supply chain managers can articulate the key priorities in broad terms.',
          'The strategy is actively cascaded to all supply chain tiers; individuals can connect their personal objectives to strategic priorities and explain how their work contributes.',
          'The strategy is embedded through formal cascading, team objectives linked to strategy maps, and regular communication from the CPO — verified through annual engagement surveys tracking strategic clarity scores.',
        ],
        levelsAr: [
          'استراتيجية سلسلة الإمداد — إن وُجدت — لا يعرفها سوى القائد الأكثر أقدميةً. يجهل المديرون في المستوى الوسيط والفرق التشغيلية أي توجّه استراتيجي.',
          'الاستراتيجية معروفة لدى كبار قادة سلسلة الإمداد لكنها لم تُبلَّغ بشكل منظم للمديرين في المستوى الوسيط أو للفرق متعددة الوظائف.',
          'تُبلَّغ الاستراتيجية سنويًا عبر إيجازات الفرق؛ ويستطيع معظم مديري سلسلة الإمداد صياغة الأولويات الرئيسية بمصطلحات عامة.',
          'تُنقَل الاستراتيجية بفاعلية إلى جميع مستويات سلسلة الإمداد؛ ويستطيع الأفراد ربط أهدافهم الشخصية بالأولويات الاستراتيجية وشرح كيفية إسهام عملهم فيها.',
          'الاستراتيجية متجذّرة عبر توزيع رسمي وأهداف الفرق المرتبطة بخرائط الاستراتيجية وتواصل منتظم من CPO — يُتحقَّق منها عبر استطلاعات مشاركة سنوية لقياس درجات الوضوح الاستراتيجي.',
        ],
      },
      {
        q: 'How effectively is the supply chain strategy reviewed and updated in response to material shifts in the competitive landscape, business model, or macroeconomic environment?',
        qAr: 'ما مدى فعالية مراجعة استراتيجية سلسلة الإمداد وتحديثها استجابةً للتحولات الجوهرية في المشهد التنافسي أو نموذج الأعمال أو البيئة الاقتصادية الكلية؟',
        levels: [
          'The strategy is never reviewed. It remains unchanged regardless of significant shifts in market conditions, competitor actions, or business direction.',
          'The strategy is reviewed informally only when a major crisis forces the issue — not proactively in response to market signals or business change.',
          'A formal annual review of the supply chain strategy incorporates key market and business updates, with documented decisions on what to continue, change, or stop.',
          'A structured strategy review runs within the annual planning cycle, with trigger-based interim reviews activated by specific market events, M&A activity, or significant regulatory changes.',
          'Strategy reviews are built into the board and executive planning calendar; pre-defined environmental triggers (regulatory, geopolitical, competitive) initiate interim reviews; all revisions are version-controlled and board-approved.',
        ],
        levelsAr: [
          'لا تُراجَع الاستراتيجية أبدًا. تظل دون تغيير بصرف النظر عن التحولات الجوهرية في ظروف السوق أو تحركات المنافسين أو التوجّه التجاري.',
          'تُراجَع الاستراتيجية بشكل غير رسمي فقط عند حدوث أزمة كبرى تُجبر على ذلك — لا استباقيًا استجابةً لإشارات السوق أو التغييرات التجارية.',
          'تدمج مراجعة سنوية رسمية للاستراتيجية التحديثات الرئيسية للسوق والأعمال، مع قرارات موثّقة حول ما يُستمر فيه أو يُغيَّر أو يُوقَف.',
          'تُجرى مراجعة منظمة للاستراتيجية ضمن دورة التخطيط السنوي مع مراجعات مؤقتة مُحفَّزة تُفعَّل عند حدوث أحداث سوقية محددة أو نشاط اندماج واستحواذ أو تغييرات تنظيمية جوهرية.',
          'مراجعات الاستراتيجية مدمجة في تقويم التخطيط لمجلس الإدارة والإدارة التنفيذية؛ ومحفّزات بيئية محددة مسبقًا (تنظيمية، جيوسياسية، تنافسية) تُطلق مراجعات مؤقتة؛ وجميع المراجعات مضبوطة بإصدارات ومعتمدة من مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 0-1  Network Design & Footprint ──────────────────────────────────── */
  {
    id: 'strategy-network',
    title: 'Network Design & Footprint',
    titleAr: 'تصميم الشبكة والبصمة التشغيلية',
    hint: 'Assesses the rigour and frequency of supply chain network design reviews, including facility locations, transportation lanes, and distribution models.',
    hintAr: 'يقيس مدى صرامة وتكرار مراجعات تصميم شبكة سلسلة الإمداد، بما في ذلك مواقع المنشآت ومسارات النقل ونماذج التوزيع.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    evidence: {
      label: 'Network design study or footprint review',
      labelAr: 'دراسة تصميم الشبكة أو مراجعة البصمة التشغيلية',
      hint: 'Upload a network design report or executive summary of a footprint review conducted within the last 3 years.',
      hintAr: 'ارفع تقرير تصميم الشبكة أو ملخصًا تنفيذيًا لمراجعة البصمة التشغيلية أُجريت خلال السنوات الثلاث الأخيرة.',
    },
    questions: [
      {
        q: 'How rigorously and regularly do you review your supply chain network design — covering facility locations, distribution channels, and transportation models — against evolving business requirements?',
        qAr: 'ما مدى صرامة وانتظام مراجعتكم لتصميم شبكة سلسلة الإمداد — بما يشمل مواقع المنشآت وقنوات التوزيع ونماذج النقل — مقابل متطلبات الأعمال المتطورة؟',
        levels: [
          'The supply chain network has never been formally mapped or reviewed for optimisation. Facilities and distribution arrangements reflect historical decisions that have never been challenged.',
          'Informal reviews occur reactively when a specific problem (e.g., service failure or cost spike) forces the issue; no structured methodology or regular cadence exists.',
          'A network review is conducted every 3–5 years with defined scope, though without advanced modelling tools or scenario analysis.',
          'Annual network design reviews apply quantitative modelling to evaluate cost, service level, and risk tradeoffs across the end-to-end network.',
          'Bi-annual reviews use digital twin modelling and multi-scenario simulation to continuously optimise the network footprint; findings directly inform the capital allocation plan.',
        ],
        levelsAr: [
          'لم تُرسَم شبكة سلسلة الإمداد أو تُراجَع رسميًا لتحديد فرص التحسين. المنشآت وترتيبات التوزيع تعكس قرارات تاريخية لم تُتحدَّى قط.',
          'تُجرى مراجعات غير رسمية بشكل تفاعلي عند حدوث مشكلة محددة (مثل إخفاق في الخدمة أو ارتفاع التكاليف)؛ دون منهجية منظمة أو وتيرة منتظمة.',
          'تُجرى مراجعة للشبكة كل 3–5 سنوات بنطاق محدد، لكن دون أدوات نمذجة متقدمة أو تحليل للسيناريوهات.',
          'تُطبّق مراجعات سنوية لتصميم الشبكة النمذجة الكمية لتقييم مفاضلات التكلفة ومستوى الخدمة والمخاطر عبر الشبكة الكاملة.',
          'تستخدم المراجعات نصف السنوية نمذجة التوأم الرقمي ومحاكاة السيناريوهات المتعددة لتحسين البصمة التشغيلية للشبكة بشكل مستمر؛ وتُغذّي النتائج مباشرةً خطة تخصيص رأس المال.',
        ],
      },
      {
        q: 'How effectively do you use quantitative modelling to evaluate the cost-service-risk tradeoffs before making network footprint decisions (e.g., new facilities, consolidation, nearshoring)?',
        qAr: 'ما مدى فعالية استخدامكم للنمذجة الكمية لتقييم مفاضلات التكلفة والخدمة والمخاطر قبل اتخاذ قرارات البصمة التشغيلية للشبكة (مثل المنشآت الجديدة والتوحيد والتوطين القريب)؟',
        levels: [
          'Network decisions are based entirely on intuition, precedent, or cost alone. No quantitative modelling of tradeoffs has ever been conducted.',
          'Basic spreadsheet analysis (cost-only, single-scenario) is used informally for major decisions, but service level and risk dimensions are not modelled.',
          'Structured cost-service tradeoff analysis using spreadsheet models informs major network decisions, though risk and resilience are not quantified.',
          'Multi-criteria quantitative models — covering cost, service level, risk, and carbon — are used for all significant network decisions, with documented assumptions and sensitivity analysis.',
          'Dedicated network design software (e.g., AIMMS, LLamasoft, or equivalent) runs multi-scenario optimisation for every major network decision; outputs are reviewed at executive level before capital commitment.',
        ],
        levelsAr: [
          'تستند قرارات الشبكة كليًا إلى الحدس أو السابقة أو التكلفة وحدها. لم تُجرَ أي نمذجة كمية للمفاضلات على الإطلاق.',
          'يُستخدم تحليل جداول بيانات أساسي (تكلفة فقط، سيناريو واحد) بشكل غير رسمي للقرارات الكبرى، لكن لا يُنمذَج بُعدا مستوى الخدمة والمخاطر.',
          'تحليل مُنظَّم لمفاضلات التكلفة والخدمة بنماذج جداول بيانات يُغذّي قرارات الشبكة الكبرى، لكن المخاطر والمرونة لا يُقيَّسان.',
          'نماذج كمية متعددة المعايير — تغطي التكلفة ومستوى الخدمة والمخاطر والكربون — تُستخدَم في جميع قرارات الشبكة الجوهرية، مع افتراضات موثّقة وتحليل حساسية.',
          'برامج تصميم شبكات متخصصة تُشغّل تحسينًا متعدد السيناريوهات لكل قرار شبكة كبير؛ وتُراجَع المخرجات على المستوى التنفيذي قبل الالتزام برأس المال.',
        ],
      },
      {
        q: 'How well does your network design account for differentiated customer service requirements, last-mile delivery needs, and omnichannel fulfilment expectations by segment?',
        qAr: 'ما مدى مراعاة تصميم شبكتكم لمتطلبات خدمة العملاء المتمايزة واحتياجات التسليم للمرحلة الأخيرة وتوقعات الوفاء متعدد القنوات حسب الشريحة؟',
        levels: [
          'Network design is supply-driven with no consideration of customer segmentation or differentiated service requirements. All customers are served through the same model.',
          'Some informal awareness of key customer service requirements exists, but these are not systematically translated into network design decisions.',
          'Major customer segments are defined and their service requirements (lead time, delivery frequency) are documented and inform network design trade-offs.',
          'Network design explicitly models differentiated service levels by customer tier, with last-mile and omnichannel requirements fully factored into facility and distribution decisions.',
          'Customer segmentation, real-time service level data, and omnichannel fulfilment requirements drive continuous network optimisation; differentiated service commitments are tracked and reported.',
        ],
        levelsAr: [
          'تصميم الشبكة مدفوع بجانب العرض دون أي اعتبار لتقسيم العملاء أو متطلبات الخدمة المتمايزة. يُخدَم جميع العملاء عبر النموذج ذاته.',
          'يوجد بعض الوعي غير الرسمي بمتطلبات خدمة العملاء الرئيسيين، لكنها لا تُترجَم بشكل منهجي إلى قرارات تصميم الشبكة.',
          'شرائح العملاء الرئيسية محددة ومتطلبات خدمتها (مهل التسليم وتكراره) موثّقة وتُغذّي مفاضلات تصميم الشبكة.',
          'تُنمذَج قرارات تصميم الشبكة صراحةً مستويات الخدمة المتمايزة حسب فئة العملاء، مع الأخذ الكامل باحتياجات التسليم للمرحلة الأخيرة ومتطلبات الوفاء متعدد القنوات.',
          'يقود تقسيم العملاء وبيانات مستوى الخدمة الآنية ومتطلبات الوفاء متعدد القنوات تحسينًا مستمرًا للشبكة؛ والتزامات الخدمة المتمايزة تُتابَع وتُرفَع.',
        ],
      },
    ],
  },

  /* ── 0-2  S&OP / IBP Integration ──────────────────────────────────────── */
  {
    id: 'strategy-sop',
    title: 'S&OP / IBP Integration',
    titleAr: 'تكامل تخطيط المبيعات والعمليات / التخطيط التجاري المتكامل',
    hint: 'Assesses the maturity of the S&OP or IBP process in integrating supply chain plans with financial forecasting, capital allocation, and executive decision-making.',
    hintAr: 'يقيس نضج عملية S&OP أو IBP في دمج خطط سلسلة الإمداد مع التنبؤ المالي وتخصيص رأس المال وصنع القرار التنفيذي.',
    benchmarks: { gcc: 2.1, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'S&OP or IBP process documentation',
      labelAr: 'توثيق عملية S&OP أو IBP',
      hint: 'Upload an S&OP or IBP process charter, meeting agenda template, or monthly executive pack sample.',
      hintAr: 'ارفع ميثاق عملية S&OP أو IBP أو نموذج جدول اجتماع أو نموذجًا للحزمة التنفيذية الشهرية.',
    },
    questions: [
      {
        q: 'How mature is your S&OP or IBP process in integrating supply chain plans with financial forecasting and strategic capital allocation decisions?',
        qAr: 'ما مدى نضج عملية S&OP أو IBP لديكم في دمج خطط سلسلة الإمداد مع التنبؤ المالي وقرارات تخصيص رأس المال الاستراتيجي؟',
        levels: [
          'No S&OP process exists. Supply chain plans and financial plans are developed independently with no cross-functional alignment or reconciliation.',
          'S&OP meetings occur occasionally but attendance is inconsistent, inputs are unreliable, and outputs rarely influence financial planning or capital decisions.',
          'A monthly S&OP cycle is established with defined inputs from sales, operations, and finance, a consistent meeting cadence, and basic action assignments.',
          'S&OP includes formal financial reconciliation and executive review, consistently linking supply chain plans to near-term procurement, production, and capital decisions.',
          'A fully integrated IBP process runs monthly with board-level executive engagement, direct linkage between supply chain strategy and financial forecasting, and supply chain inputs that materially shape capital allocation at board level.',
        ],
        levelsAr: [
          'لا توجد عملية S&OP. تُطوَّر خطط سلسلة الإمداد والخطط المالية بشكل مستقل دون أي مواءمة أو مطابقة متعددة الوظائف.',
          'تُعقد اجتماعات S&OP أحيانًا لكن الحضور غير منتظم والمدخلات غير موثوقة ونادرًا ما تؤثر المخرجات في التخطيط المالي أو قرارات رأس المال.',
          'أُنشئت دورة S&OP شهرية بمدخلات محددة من المبيعات والعمليات والمالية، ووتيرة اجتماعات منتظمة وإسناد إجراءات أساسية.',
          'تشمل S&OP مطابقة مالية رسمية ومراجعة تنفيذية، وتربط باستمرار خطط سلسلة الإمداد بقرارات الشراء والإنتاج ورأس المال قصيرة المدى.',
          'تعمل عملية IBP متكاملة تمامًا شهريًا بمشاركة تنفيذية على مستوى مجلس الإدارة وربط مباشر بين استراتيجية سلسلة الإمداد والتنبؤ المالي، ومدخلات سلسلة الإمداد تُشكّل بشكل ملموس تخصيص رأس المال على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively does executive leadership actively own and drive the S&OP or IBP process — rather than delegating it entirely to the planning team?',
        qAr: 'ما مدى فعالية تملّك القيادة التنفيذية وقيادتها الفعلية لعملية S&OP أو IBP — بدلاً من تفويضها بالكامل لفريق التخطيط؟',
        levels: [
          'The S&OP process — if it exists — is owned exclusively by the supply chain or planning team. Executive leaders neither attend nor review outputs.',
          'Senior leaders receive the S&OP output report but do not actively participate in the process; decisions remain siloed within functions.',
          'The CPO and supply chain director participate in the S&OP executive meeting; decisions are minuted and tracked but cross-functional ownership is inconsistent.',
          'CEO or COO chairs the monthly S&OP executive review; all business units are represented; decisions bind procurement, production, and sales plans for the period.',
          'The CEO chairs an IBP executive review that is a board-level calendar commitment; unresolved conflicts are escalated to the board; S&OP decisions are the single source of truth for the business plan.',
        ],
        levelsAr: [
          'عملية S&OP — إن وُجدت — مملوكة حصريًا لفريق سلسلة الإمداد أو التخطيط. لا يحضر القادة التنفيذيون ولا يراجعون المخرجات.',
          'يتلقّى القادة الكبار تقرير مخرجات S&OP لكنهم لا يشاركون بفاعلية في العملية؛ والقرارات تبقى محصورة داخل الوظائف المنعزلة.',
          'يشارك CPO ومدير سلسلة الإمداد في اجتماع S&OP التنفيذي؛ والقرارات مُدوَّنة ومتابَعة لكن الملكية متعددة الوظائف غير متسقة.',
          'يترأس الرئيس التنفيذي أو المدير التشغيلي المراجعة التنفيذية الشهرية لـ S&OP؛ وجميع وحدات الأعمال ممثَّلة؛ والقرارات تُلزم خطط الشراء والإنتاج والمبيعات للفترة.',
          'يترأس الرئيس التنفيذي المراجعة التنفيذية لـ IBP بوصفها التزامًا ثابتًا في تقويم مجلس الإدارة؛ وتُصعَّد النزاعات غير المحسومة للمجلس؛ وقرارات S&OP هي المرجع الوحيد لخطة الأعمال.',
        ],
      },
      {
        q: 'How consistently do the decisions made in the S&OP or IBP process translate into binding, tracked actions for procurement, production, and inventory management within the same planning cycle?',
        qAr: 'ما مدى اتساق ترجمة القرارات المتخذة في عملية S&OP أو IBP إلى إجراءات ملزمة ومتابَعة للمشتريات والإنتاج وإدارة المخزون خلال دورة التخطيط ذاتها؟',
        levels: [
          'S&OP decisions are discussed but rarely acted upon. Procurement and production plans continue largely unchanged regardless of the S&OP output.',
          'Some decisions lead to informal adjustments but there is no formal mechanism to translate S&OP outputs into binding operational changes with assigned owners.',
          'Key S&OP decisions are documented in meeting minutes and assigned to owners; follow-through is tracked at the next monthly meeting.',
          'All S&OP decisions generate action items with owners, due dates, and specific KPI impacts; adherence is reviewed monthly with escalation if missed.',
          'S&OP decisions are automatically translated into ERP purchasing, production, and inventory parameters within 48 hours; adherence rates are a board-reviewed process health KPI.',
        ],
        levelsAr: [
          'تُناقَش قرارات S&OP لكنها نادرًا ما يُعمَل بها. تستمر خطط الشراء والإنتاج إلى حد كبير دون تغيير بصرف النظر عن مخرجات S&OP.',
          'تُفضي بعض القرارات إلى تعديلات غير رسمية لكن لا توجد آلية رسمية لترجمة مخرجات S&OP إلى تغييرات تشغيلية ملزمة بمالكين محددين.',
          'تُوثَّق قرارات S&OP الرئيسية في محاضر الاجتماعات وتُسنَد لمالكين؛ ويُتابَع التنفيذ في الاجتماع الشهري التالي.',
          'تُولّد جميع قرارات S&OP إجراءات بمالكين وتواريخ استحقاق وأثر محدد على مؤشرات الأداء؛ والامتثال يُراجَع شهريًا مع التصعيد عند الإخلال.',
          'تُترجَم قرارات S&OP آليًا إلى معاملات شراء وإنتاج ومخزون في ERP خلال 48 ساعة؛ ومعدلات الامتثال مؤشر لصحة العملية يُراجَع على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 0-3  Scenario Planning ────────────────────────────────────────────── */
  {
    id: 'strategy-scenario',
    title: 'Scenario Planning',
    titleAr: 'تخطيط السيناريوهات',
    hint: 'Assesses the rigour and discipline of scenario planning used to evaluate strategic options, stress-test the supply chain, and inform capital and sourcing decisions.',
    hintAr: 'يقيس صرامة وانضباط تخطيط السيناريوهات المُستخدَم لتقييم الخيارات الاستراتيجية واختبار الإجهاد لسلسلة الإمداد وإثراء قرارات رأس المال والتوريد.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How systematically do you apply scenario planning to evaluate major strategic supply chain options before committing to capital or structural decisions?',
        qAr: 'ما مدى منهجية تطبيقكم لتخطيط السيناريوهات لتقييم خيارات سلسلة الإمداد الاستراتيجية الكبرى قبل الالتزام برأس المال أو القرارات الهيكلية؟',
        levels: [
          'No scenario planning is conducted. Major decisions are based on a single set of assumptions with no structured consideration of alternative outcomes.',
          'Informal "what-if" discussions occur among senior leaders but are not documented, consistently structured, or used to formally drive decisions.',
          'Basic scenario analysis using spreadsheet models is applied to major strategic decisions, with at least two scenarios (base and downside) evaluated.',
          'Structured scenario planning with quantified financial and operational outcomes is embedded in the annual strategic planning cycle and used for all capital decisions above a defined threshold.',
          'Advanced simulation tools model multiple demand, risk, and disruption scenarios with full financial impact quantification before every major strategic supply chain decision; outputs are board-reviewed.',
        ],
        levelsAr: [
          'لا يُجرى تخطيط للسيناريوهات. تستند القرارات الكبرى إلى مجموعة واحدة من الافتراضات دون أي اعتبار منظم للنتائج البديلة.',
          'تُجرى نقاشات غير رسمية حول "ماذا لو" بين كبار القادة لكنها غير موثّقة وغير منظمة بشكل متسق ولا تُستخدَم لتوجيه القرارات رسميًا.',
          'يُطبَّق تحليل سيناريو أساسي بنماذج جداول بيانات على القرارات الاستراتيجية الكبرى، مع تقييم سيناريوهين على الأقل (الأساسي والسلبي).',
          'تخطيط منظم للسيناريوهات بنتائج مالية وتشغيلية مُقاسة مضمَّن في دورة التخطيط الاستراتيجي السنوي ومُستخدَم في جميع قرارات رأس المال فوق حد محدد.',
          'تُنمذَج أدوات محاكاة متقدمة سيناريوهات متعددة للطلب والمخاطر والاضطرابات بتقييم مالي كامل لكل قرار استراتيجي كبير في سلسلة الإمداد؛ والمخرجات تُراجَع على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How well are disruption scenarios — including geopolitical shifts, commodity price volatility, climate events, and key supplier failure — modelled and quantified in financial and operational terms?',
        qAr: 'ما مدى جودة نمذجة وتقييم سيناريوهات الاضطراب — بما في ذلك التحولات الجيوسياسية وتقلّبات أسعار السلع والأحداث المناخية وفشل الموردين الرئيسيين — بمصطلحات مالية وتشغيلية؟',
        levels: [
          'Disruption scenarios are not modelled. The organisation has no quantified understanding of the financial impact of a major supply chain disruption.',
          'High-level disruption scenarios are discussed informally in risk meetings but are not quantified in financial terms and do not produce documented contingency positions.',
          'Key disruption scenarios (e.g., single-source supplier failure, port closure) are modelled with estimated financial impact and documented response options.',
          'A library of quantified disruption scenarios — with financial impact, probability assessment, and pre-planned responses — is reviewed and updated at least annually.',
          'A dynamic scenario library covers all material supply chain risk categories, is quantified in revenue, margin, and cash flow terms, stress-tests the annual business plan, and is reviewed quarterly by the executive committee.',
        ],
        levelsAr: [
          'لا تُنمذَج سيناريوهات الاضطراب. ليس لدى المؤسسة فهم مُقاس للأثر المالي لاضطراب كبير في سلسلة الإمداد.',
          'تُناقَش سيناريوهات الاضطراب رفيعة المستوى بشكل غير رسمي في اجتماعات المخاطر لكنها لا تُقيَّس ماليًا ولا تُنتج مواقف احتياطية موثّقة.',
          'تُنمذَج سيناريوهات الاضطراب الرئيسية (مثل فشل مورد مصدر وحيد أو إغلاق ميناء) بأثر مالي مُقدَّر وخيارات استجابة موثّقة.',
          'مكتبة من سيناريوهات الاضطراب المُقاسة — بأثر مالي وتقييم احتمالية واستجابات مُخطَّطة مسبقًا — تُراجَع وتُحدَّث سنويًا على الأقل.',
          'مكتبة سيناريوهات ديناميكية تغطي جميع فئات مخاطر سلسلة الإمداد الجوهرية، مُقاسة بمصطلحات الإيرادات والهامش والتدفق النقدي، وتختبر الخطة التجارية السنوية ضغطيًا، وتُراجَع فصليًا من قِبَل اللجنة التنفيذية.',
        ],
      },
      {
        q: 'How reliably do scenario planning findings drive specific, documented changes to the supply chain strategy, contingency plans, or capital allocation — rather than being filed and forgotten?',
        qAr: 'ما مدى موثوقية توجيه نتائج تخطيط السيناريوهات لتغييرات محددة وموثّقة في استراتيجية سلسلة الإمداد أو الخطط الاحتياطية أو تخصيص رأس المال — بدلاً من حفظها وإهمالها؟',
        levels: [
          'Scenario planning outputs are never formally used to change strategy or plans. Exercises are conducted periodically but findings are not actioned.',
          'Findings are presented to leadership but follow-through is inconsistent; most scenario outputs do not translate into documented strategic changes.',
          'Scenario planning findings are formally reviewed by leadership, and specific action items or contingency plan updates are assigned with owners and timelines.',
          'Scenario outputs are integrated into the strategic planning document; contingency triggers and pre-authorised response budgets are documented for each scenario.',
          'Scenario findings directly update strategy documents, risk registers, and pre-authorised contingency budgets; trigger conditions that activate specific responses are formally agreed at board level.',
        ],
        levelsAr: [
          'مخرجات تخطيط السيناريوهات لا تُستخدَم رسميًا قط لتغيير الاستراتيجية أو الخطط. تُجرى التمارين دوريًا لكن النتائج لا يُعمَل بها.',
          'تُعرض النتائج على القيادة لكن المتابعة غير متسقة؛ ومعظم مخرجات السيناريوهات لا تتحول إلى تغييرات استراتيجية موثّقة.',
          'تُراجَع نتائج تخطيط السيناريوهات رسميًا من القيادة، وتُسنَد إجراءات محددة أو تحديثات للخطط الاحتياطية بمالكين وجداول زمنية.',
          'مخرجات السيناريوهات مدمجة في وثيقة التخطيط الاستراتيجي؛ ومحفّزات الطوارئ والميزانيات الاحتياطية المُعتمَدة مسبقًا موثّقة لكل سيناريو.',
          'نتائج السيناريوهات تُحدّث مباشرةً وثائق الاستراتيجية وسجلات المخاطر والميزانيات الاحتياطية المُعتمَدة مسبقًا؛ وشروط التشغيل التي تُفعّل استجابات محددة تُتَّفق عليها رسميًا على مستوى مجلس الإدارة.',
        ],
      },
    ],
  },

  /* ── 0-4  Performance Governance ──────────────────────────────────────── */
  {
    id: 'strategy-governance',
    title: 'Performance Governance',
    titleAr: 'حوكمة الأداء',
    hint: 'Assesses the comprehensiveness of the supply chain KPI framework, the rigour of performance reviews, and the clarity of ownership and accountability at every level.',
    hintAr: 'يقيس شمولية إطار مؤشرات أداء سلسلة الإمداد وصرامة مراجعات الأداء ووضوح الملكية والمساءلة على كل مستوى.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supply chain KPI dashboard or scorecard',
      labelAr: 'لوحة مؤشرات أداء سلسلة الإمداد أو بطاقة الأداء',
      hint: 'Upload a sample KPI dashboard or scorecard report showing supply chain metrics, owners, and targets.',
      hintAr: 'ارفع نموذجًا للوحة مؤشرات الأداء أو تقرير بطاقة الأداء يُظهر مقاييس سلسلة الإمداد ومالكيها ومستهدفاتها.',
    },
    questions: [
      {
        q: 'How comprehensive and well-cascaded is your supply chain KPI framework — from board-level strategic metrics down to operational team targets?',
        qAr: 'ما مدى شمولية إطار مؤشرات أداء سلسلة الإمداد لديكم وجودة توزيعه — من المقاييس الاستراتيجية على مستوى مجلس الإدارة وصولاً إلى مستهدفات الفرق التشغيلية؟',
        levels: [
          'No supply chain KPI framework exists. Performance is not measured systematically and there are no defined targets at any level of the organisation.',
          'A few high-level supply chain metrics exist (e.g., on-time delivery, inventory value) but they are tracked inconsistently and not linked to individual or team accountability.',
          'A defined set of supply chain KPIs is tracked regularly, assigned to owners, and reported to management monthly, though cascading to operational teams is limited.',
          'A comprehensive KPI framework is cascaded to team level with clearly assigned owners, reviewed in weekly and monthly governance forums, and triggers action when targets are missed.',
          'A balanced supply chain scorecard — covering cost, service, quality, and sustainability — is cascaded to individual level, linked to performance incentives, and reviewed monthly at board level with year-on-year trend analysis.',
        ],
        levelsAr: [
          'لا يوجد إطار مؤشرات أداء لسلسلة الإمداد. لا يُقاس الأداء بشكل منهجي ولا توجد مستهدفات محددة على أي مستوى في المؤسسة.',
          'توجد بضعة مقاييس عامة لسلسلة الإمداد (مثل التسليم في الوقت والقيمة المخزنية) لكنها تُتابَع بشكل غير متسق وغير مرتبطة بالمساءلة الفردية أو الفريق.',
          'تُتابَع مجموعة محددة من مؤشرات الأداء بانتظام وتُسنَد لمالكين وتُرفَع للإدارة شهريًا، لكن التوزيع على الفرق التشغيلية محدود.',
          'إطار شامل لمؤشرات الأداء موزَّع على مستوى الفريق بمالكين محددين بوضوح، يُراجَع في منتديات حوكمة أسبوعية وشهرية ويُطلق إجراءً عند تفويت الأهداف.',
          'بطاقة أداء متوازنة لسلسلة الإمداد — تغطي التكلفة والخدمة والجودة والاستدامة — موزَّعة على المستوى الفردي ومرتبطة بحوافز الأداء وتُراجَع شهريًا على مستوى مجلس الإدارة مع تحليل الاتجاه السنوي.',
        ],
      },
      {
        q: 'How rigorously are supply chain performance gaps reviewed, root-caused, and actioned — and how quickly are improvement actions verified for effectiveness?',
        qAr: 'ما مدى صرامة مراجعة فجوات أداء سلسلة الإمداد وتحليل أسبابها الجذرية ومعالجتها — وما سرعة التحقق من فعالية إجراءات التحسين؟',
        levels: [
          'Performance gaps are rarely discussed in formal forums. When identified, the response is reactive and undocumented with no structured root-cause analysis.',
          'Performance gaps are noted in monthly reports but root-cause analysis is superficial and follow-up is inconsistent; the same issues recur repeatedly.',
          'Significant performance gaps trigger a structured root-cause analysis process with documented findings and corrective action plans assigned to owners.',
          'All KPI breaches trigger a structured root-cause process; corrective actions are tracked to closure in a governance forum; effectiveness is verified after 60–90 days.',
          'An automated performance management system flags KPI deviations in real time; root-cause analysis is conducted within 5 days; corrective action effectiveness is tracked and lessons learned are fed back into the KPI framework.',
        ],
        levelsAr: [
          'نادرًا ما تُناقَش فجوات الأداء في منتديات رسمية. عند تحديدها، الاستجابة تفاعلية وغير موثّقة دون تحليل منظم للسبب الجذري.',
          'تُلاحَظ فجوات الأداء في التقارير الشهرية لكن تحليل السبب الجذري سطحي والمتابعة غير متسقة؛ والمشكلات ذاتها تتكرر باستمرار.',
          'تُطلق فجوات الأداء الجوهرية عملية منظمة لتحليل السبب الجذري مع نتائج موثّقة وخطط إجراءات تصحيحية مُسنَدة لمالكين.',
          'جميع إخلالات مؤشرات الأداء تُطلق عملية منظمة للسبب الجذري؛ وإجراءات التصحيح تُتابَع حتى الإغلاق في منتدى الحوكمة؛ والفعالية تُتحقَّق منها بعد 60–90 يومًا.',
          'نظام إدارة أداء آلي يُبلّغ عن انحرافات مؤشرات الأداء آنيًا؛ ويُجرى تحليل السبب الجذري خلال 5 أيام؛ وفعالية الإجراءات التصحيحية تُتابَع والدروس المستفادة تُغذّى في إطار مؤشرات الأداء.',
        ],
      },
      {
        q: 'How effectively are your supply chain KPIs benchmarked against GCC peers and global best-practice standards, and how do findings drive target-setting?',
        qAr: 'ما مدى فعالية المقارنة المعيارية لمؤشرات أداء سلسلة الإمداد لديكم مع النظراء في الخليج والمعايير العالمية لأفضل الممارسات، وكيف تُغذّي النتائج تحديد الأهداف؟',
        levels: [
          'No external benchmarking is conducted. KPI targets are set based on historical performance only, with no reference to peer performance or industry standards.',
          'Informal awareness of industry benchmarks exists (e.g., from conferences) but targets are not formally adjusted in response to external data.',
          'Annual benchmarking against published industry reports (e.g., Gartner, APICS) informs KPI target-setting for major metrics.',
          'Formal benchmarking against GCC-specific and global peers is conducted annually; findings are reviewed at leadership level and used to set stretch targets for the coming year.',
          'Continuous benchmarking through membership in a GCC supply chain peer group or global network (e.g., Gartner peer community) provides quarterly data; findings are reviewed quarterly and directly shape the annual KPI target-setting exercise at executive level.',
        ],
        levelsAr: [
          'لا تُجرى أي مقارنة معيارية خارجية. تُحدَّد مستهدفات مؤشرات الأداء بناءً على الأداء التاريخي فقط، دون أي إشارة إلى أداء النظراء أو معايير الصناعة.',
          'يوجد وعي غير رسمي بمعايير الصناعة (مثلًا من المؤتمرات) لكن الأهداف لا تُعدَّل رسميًا استجابةً للبيانات الخارجية.',
          'المقارنة المعيارية السنوية مع تقارير الصناعة المنشورة (مثل Gartner وAPIC/ASCM) تُغذّي تحديد مستهدفات مؤشرات الأداء للمقاييس الرئيسية.',
          'تُجرى مقارنة معيارية رسمية مع النظراء في الخليج وعالميًا سنويًا؛ وتُراجَع النتائج على مستوى القيادة وتُستخدَم لتحديد أهداف تطوير للعام القادم.',
          'المقارنة المعيارية المستمرة عبر العضوية في مجموعة نظراء خليجية أو شبكة عالمية توفر بيانات فصلية؛ والنتائج تُراجَع فصليًا وتُشكّل مباشرةً تمرين تحديد مستهدفات مؤشرات الأداء السنوي على المستوى التنفيذي.',
        ],
      },
    ],
  },

  /* ── 0-5  Digital & Innovation Roadmap ────────────────────────────────── */
  {
    id: 'strategy-digital',
    title: 'Digital & Innovation Roadmap',
    titleAr: 'خارطة طريق الرقمنة والابتكار',
    hint: 'Assesses the maturity of the supply chain digital transformation roadmap, the rigour of technology evaluation, and the governance of innovation from ideation to deployment.',
    hintAr: 'يقيس نضج خارطة طريق التحول الرقمي لسلسلة الإمداد وصرامة تقييم التقنيات وحوكمة الابتكار من الفكرة حتى النشر.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 1.5, other: 1.0,
    },
    questions: [
      {
        q: 'How mature and specific is your supply chain digital transformation roadmap — with clear technology priorities, investment cases, delivery timelines, and benefit realisation milestones?',
        qAr: 'ما مدى نضج وتحديد خارطة طريق التحول الرقمي لسلسلة الإمداد لديكم — بأولويات تقنية واضحة وحالات استثمار ومواعيد تسليم وأهداف تحقق الفوائد؟',
        levels: [
          'No digital roadmap exists for the supply chain. Technology decisions are ad-hoc, driven by vendor relationships or budget availability rather than strategic needs.',
          'A wish list of technology projects exists informally, but there is no structured roadmap, investment cases, sequencing rationale, or ownership.',
          'A documented digital roadmap covers the next 12–24 months with defined technology priorities, estimated investment, and assigned executive sponsors.',
          'A 3-year digital roadmap with approved investment cases, delivery milestones, and benefit realisation targets is reviewed quarterly and updated annually.',
          'A board-approved 3–5 year digital supply chain transformation roadmap is reviewed quarterly, with investment cases tied to measurable business outcomes, and benefit realisation tracked against commitments.',
        ],
        levelsAr: [
          'لا توجد خارطة طريق رقمية لسلسلة الإمداد. قرارات التقنية ارتجالية يقودها العلاقة بالموردين أو توافر الميزانية لا الاحتياجات الاستراتيجية.',
          'يوجد غير رسمي قائمة أمنيات بمشاريع تقنية، لكن دون خارطة طريق منظمة أو حالات استثمار أو منطق تسلسل أو ملكية.',
          'خارطة طريق رقمية موثّقة تغطي الـ 12–24 شهرًا القادمة بأولويات تقنية محددة واستثمار مُقدَّر وراعين تنفيذيين معيَّنين.',
          'خارطة طريق رقمية لـ 3 سنوات بحالات استثمار معتمدة وأهداف تسليم وأهداف تحقق الفوائد تُراجَع فصليًا وتُحدَّث سنويًا.',
          'خارطة طريق معتمدة من مجلس الإدارة للتحول الرقمي في سلسلة الإمداد لـ 3–5 سنوات تُراجَع فصليًا، بحالات استثمار مرتبطة بنتائج أعمال قابلة للقياس وتحقق الفوائد يُتابَع مقابل الالتزامات.',
        ],
      },
      {
        q: 'How systematically do you evaluate and pilot emerging supply chain technologies — such as AI, IoT, digital twins, and autonomous planning — before committing to scaled deployment?',
        qAr: 'ما مدى منهجية تقييمكم وتجريبكم للتقنيات الناشئة في سلسلة الإمداد — مثل الذكاء الاصطناعي وإنترنت الأشياء والتوأم الرقمي والتخطيط الذاتي — قبل الالتزام بالنشر الموسّع؟',
        levels: [
          'New supply chain technologies are adopted only when a vendor demonstrates the product or a peer organisation has already implemented it at scale — no structured evaluation process exists.',
          'Technology pilots occur reactively based on vendor proposals; there is no formal evaluation framework, success criteria, or structured decision to scale or abandon.',
          'A structured technology evaluation process defines minimum criteria (use case fit, ROI, integration risk) before piloting; pilots have defined scope, timelines, and success measures.',
          'Technology pilots follow a stage-gate process with defined investment, success criteria, evaluation period, and executive sign-off required before scaling decisions are made.',
          'A dedicated supply chain innovation programme systematically scans the technology landscape quarterly, runs structured pilots against defined success criteria, and uses a stage-gate process to scale winners — supported by a ring-fenced innovation budget.',
        ],
        levelsAr: [
          'لا تُتبنّى تقنيات سلسلة الإمداد الجديدة إلا عندما يعرضها مورد أو تطبّقها مؤسسة نظيرة على نطاق واسع — لا توجد عملية تقييم منظمة.',
          'تحدث تجارب التقنية بشكل تفاعلي بناءً على مقترحات الموردين؛ دون إطار تقييم رسمي أو معايير نجاح أو قرار منظم بالتوسيع أو الإلغاء.',
          'عملية تقييم تقنية منظمة تحدد حدًا أدنى من المعايير (مدى ملاءمة حالة الاستخدام والعائد على الاستثمار ومخاطر التكامل) قبل التجريب؛ والتجارب ذات نطاق وجداول زمنية ومقاييس نجاح محددة.',
          'تتبع تجارب التقنية عملية بوابات متدرجة بمعايير نجاح واستثمار محدد وفترة تقييم وموافقة تنفيذية مطلوبة قبل اتخاذ قرارات التوسيع.',
          'برنامج ابتكار متفرغ لسلسلة الإمداد يفحص منهجيًا المشهد التقني فصليًا ويُجري تجارب منظمة وفق معايير نجاح محددة ويستخدم عملية بوابات متدرجة لتوسيع الفائزين — مدعومًا بميزانية ابتكار محجوزة.',
        ],
      },
      {
        q: 'How effectively is supply chain innovation governed — from structured ideation and business case development through pilot evaluation and scaled deployment with verified value realisation?',
        qAr: 'ما مدى فعالية حوكمة الابتكار في سلسلة الإمداد — من توليد الأفكار المنظم وتطوير حالة الأعمال، مرورًا بتقييم التجارب، وحتى النشر الموسّع مع تحقق قيمة مُتحقَّق منها؟',
        levels: [
          'Innovation is unstructured and occasional. Ideas emerge informally and are not evaluated against strategic need, invested in systematically, or tracked for value delivery.',
          'A basic innovation forum or suggestion mechanism exists but ideas are rarely progressed through a structured evaluation and investment process.',
          'An innovation governance process captures, evaluates, and prioritises supply chain improvement ideas; funded pilots are tracked for outcomes.',
          'A formal supply chain innovation governance board reviews a pipeline of ideas quarterly, approves pilots, tracks benefit realisation, and scales successful innovations across the business.',
          'A supply chain centre of excellence owns the innovation pipeline, reports a balanced portfolio of pilots and scaled programmes, tracks cumulative value realisation, and benchmarks innovation ROI against supply chain peers.',
        ],
        levelsAr: [
          'الابتكار غير منظم وعرضي. تنبثق الأفكار بشكل غير رسمي ولا تُقيَّم مقابل الحاجة الاستراتيجية ولا يُستثمَر فيها بشكل منهجي ولا يُتابَع تسليمها للقيمة.',
          'يوجد منتدى ابتكار أساسي أو آلية اقتراح لكن الأفكار نادرًا ما تُطوَّر عبر عملية تقييم واستثمار منظمة.',
          'عملية حوكمة الابتكار تلتقط وتقيّم وتُرتّب أفكار تحسين سلسلة الإمداد حسب الأولوية؛ والتجارب الممولة تُتابَع مخرجاتها.',
          'مجلس حوكمة ابتكار رسمي في سلسلة الإمداد يراجع مسار أفكار فصليًا ويعتمد التجارب ويتابع تحقق الفوائد ويُوسّع الابتكارات الناجحة عبر الأعمال.',
          'مركز تميّز في سلسلة الإمداد يملك مسار الابتكار ويُبلّغ عن محفظة متوازنة من التجارب والبرامج الموسّعة ويتابع تحقق القيمة التراكمية ويُقارن عائد استثمار الابتكار مع النظراء.',
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 1 — PROCUREMENT  (segIdx 1)
   Sub-segments:
     0 Sourcing Strategy & Category Plans · 1 RFx & Tendering Excellence
     2 Spend Analytics & Intelligence    · 3 Total Cost of Ownership
     4 Contract Award & SLA Baseline     · 5 Procurement Technology
═══════════════════════════════════════════════════════════════════════════ */

export const PROCUREMENT_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 1-0  Sourcing Strategy & Category Plans ───────────────────────────── */
  {
    id: 'proc-category',
    title: 'Sourcing Strategy & Category Plans',
    titleAr: 'استراتيجية التوريد وخطط الفئات',
    hint: 'Assesses how structured and consistently applied your category management approach is across all direct and indirect spend categories.',
    hintAr: 'يقيس مدى تنظيم نهج إدارة الفئات واتساق تطبيقه عبر جميع فئات الإنفاق المباشر وغير المباشر.',
    benchmarks: { gcc: 2.3, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Category strategy document',
      labelAr: 'وثيقة استراتيجية الفئة',
      hint: 'Upload a category strategy or sourcing plan for one of your strategic spend categories.',
      hintAr: 'ارفع استراتيجية فئة أو خطة توريد لإحدى فئات الإنفاق الاستراتيجية لديكم.',
    },
    questions: [
      {
        q: 'How structured and consistently applied is your category management approach — with documented category strategies, defined sourcing levers, and market intelligence informing decisions?',
        qAr: 'ما مدى تنظيم نهج إدارة الفئات لديكم واتساق تطبيقه — باستراتيجيات فئات موثّقة ورافعات توريد محددة واستخبارات سوق تُغذّي القرارات؟',
        levels: [
          'No category management exists. All spend is managed reactively using identical tactical approaches regardless of category value, complexity, or strategic importance.',
          'A few high-spend categories are managed with basic plans, but the approach is informal, inconsistent, and lacks market intelligence or stakeholder input.',
          'Category management is applied to major spend areas with documented strategies, defined ownership, supplier analysis, and basic sourcing lever identification.',
          'Category plans cover all significant spend, are updated annually, and include market intelligence, strategic objectives, sourcing levers, and supplier segmentation.',
          'All spend is managed through structured category plans with deep market intelligence, multi-year strategies, dedicated category managers, defined sourcing levers, and regular governance reviews with business stakeholders.',
        ],
        levelsAr: [
          'لا توجد إدارة للفئات. يُدار كل الإنفاق بشكل تفاعلي بأساليب تكتيكية متطابقة بصرف النظر عن قيمة الفئة وتعقيدها وأهميتها الاستراتيجية.',
          'تُدار بضع فئات عالية الإنفاق بخطط أساسية، لكن النهج غير رسمي وغير متسق ويفتقر إلى استخبارات السوق أو مدخلات أصحاب المصلحة.',
          'تُطبَّق إدارة الفئات على مجالات الإنفاق الرئيسية باستراتيجيات موثّقة وملكية محددة وتحليل موردين وتحديد أساسي لرافعات التوريد.',
          'تغطي خطط الفئات كل الإنفاق الجوهري وتُحدَّث سنويًا وتشمل استخبارات السوق والأهداف الاستراتيجية ورافعات التوريد وتقسيم الموردين.',
          'يُدار كل الإنفاق عبر خطط فئات منظمة باستخبارات سوق عميقة واستراتيجيات متعددة السنوات ومديري فئات متفرغين ورافعات توريد محددة ومراجعات حوكمة منتظمة مع أصحاب المصلحة من الأعمال.',
        ],
      },
      {
        q: 'How effectively does your sourcing strategy differentiate between strategic, leverage, bottleneck, and routine categories — applying the right sourcing approach for each quadrant?',
        qAr: 'ما مدى فعالية استراتيجية التوريد لديكم في التمييز بين الفئات الاستراتيجية ورافعات التفاوض وعوامل الاختناق والفئات الروتينية — بتطبيق نهج التوريد المناسب لكل ربع؟',
        levels: [
          'All categories are sourced using the same process regardless of their strategic importance or supply market risk. No Kraljic or equivalent segmentation is applied.',
          'Some informal differentiation exists for the most strategic or risky categories, but it is based on individual experience rather than a structured portfolio model.',
          'A portfolio segmentation model (e.g., Kraljic matrix or equivalent) is used to classify spend categories, with broadly differentiated sourcing strategies for each quadrant.',
          'Portfolio segmentation drives clearly differentiated sourcing strategies by quadrant, with the approach documented in category plans and reviewed when supply market conditions change.',
          'Portfolio segmentation is fully embedded in the category planning process; sourcing strategies are tailored by quadrant; the portfolio is reviewed annually and updated when supply market dynamics or business priorities change materially.',
        ],
        levelsAr: [
          'يُوفَّر المورد لجميع الفئات بالعملية ذاتها بصرف النظر عن أهميتها الاستراتيجية أو مخاطر سوق التوريد. لا يُطبَّق نموذج Kraljic أو ما يعادله.',
          'يوجد بعض التمييز غير الرسمي للفئات الأكثر استراتيجية أو خطورة، لكنه يستند إلى الخبرة الفردية لا إلى نموذج محفظة منظم.',
          'يُستخدَم نموذج تقسيم المحفظة (مثل مصفوفة Kraljic أو ما يعادلها) لتصنيف فئات الإنفاق، باستراتيجيات توريد متمايزة بوجه عام لكل ربع.',
          'تقسيم المحفظة يقود استراتيجيات توريد متمايزة بوضوح حسب الربع، مع توثيق النهج في خطط الفئات وتحديثه عند تغيّر ظروف سوق التوريد.',
          'تقسيم المحفظة مدمَج بالكامل في عملية تخطيط الفئات؛ واستراتيجيات التوريد مُكيَّفة حسب الربع؛ والمحفظة تُراجَع سنويًا وتُحدَّث عند تغيّر ديناميكيات سوق التوريد أو الأولويات التجارية بشكل جوهري.',
        ],
      },
      {
        q: 'How well-defined are your annual procurement savings targets, and how rigorously are realised savings tracked, validated by finance, and reported to leadership?',
        qAr: 'ما مدى تحديد مستهدفات وفورات المشتريات السنوية لديكم، وما مدى صرامة تتبّع الوفورات المحققة والتحقق منها من قِبَل المالية ورفعها للقيادة؟',
        levels: [
          'No savings targets exist. Procurement does not track, validate, or report cost savings delivered to the business.',
          'Savings are recorded informally for some projects but methodology is inconsistent, finance does not validate, and reporting to leadership is ad-hoc.',
          'A savings tracking process distinguishes cost avoidance from hard savings and reports results to management quarterly.',
          'Annual savings targets are set and cascaded; savings are tracked rigorously, validated by finance, clearly categorised by type, and reported to leadership monthly.',
          'Procurement operates a rigorous savings pipeline managed to an annual board-approved target; savings are validated by finance, categorised (hard, soft, cost avoidance), and reported monthly with cumulative year-to-date tracking.',
        ],
        levelsAr: [
          'لا توجد مستهدفات وفورات. لا تتبع المشتريات وفورات التكلفة المُحققة أو تتحقق منها أو ترفع تقارير بشأنها للأعمال.',
          'تُسجَّل الوفورات بشكل غير رسمي لبعض المشاريع لكن المنهجية غير متسقة والمالية لا تتحقق منها والتقارير للقيادة عشوائية.',
          'عملية تتبّع وفورات تميّز بين تجنّب التكلفة والوفورات الفعلية وترفع النتائج للإدارة فصليًا.',
          'تُحدَّد مستهدفات وفورات سنوية وتُوزَّع؛ والوفورات تُتابَع بصرامة ويتحقق منها القسم المالي وتُصنَّف بوضوح حسب النوع وتُرفَع للقيادة شهريًا.',
          'تُدير المشتريات مسار وفورات صارمًا وفق مستهدف سنوي معتمد من مجلس الإدارة؛ والوفورات مُتحقَّق منها من المالية ومُصنَّفة (فعلية، وغير مباشرة، وتجنّب تكلفة)، وتُرفَع تقارير شهرية بالتراكم حتى الآن.',
        ],
      },
    ],
  },

  /* ── 1-1  RFx & Tendering Excellence ──────────────────────────────────── */
  {
    id: 'proc-rfx',
    title: 'RFx & Tendering Excellence',
    titleAr: 'التميّز في طلبات العروض والمناقصات',
    hint: 'Assesses the consistency and rigour of formal sourcing processes — including RFQ, RFP, e-auctions, multi-criteria evaluation, and documented award decisions.',
    hintAr: 'يقيس اتساق وصرامة عمليات التوريد الرسمية — بما في ذلك RFQ وRFP والمزادات الإلكترونية والتقييم متعدد المعايير وقرارات الترسية الموثّقة.',
    benchmarks: { gcc: 2.5, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'RFP or tender evaluation report',
      labelAr: 'تقرير تقييم طلب تقديم المقترحات أو المناقصة',
      hint: 'Upload an anonymised RFP evaluation scorecard or tender award summary.',
      hintAr: 'ارفع بطاقة تقييم مُجهَّلة لـ RFP أو ملخص ترسية المناقصة.',
    },
    questions: [
      {
        q: 'How consistently do you apply a formal, multi-stage sourcing methodology — covering market sounding, RFI, RFQ/RFP, evaluation, negotiation, and award — when selecting or renewing strategic suppliers?',
        qAr: 'ما مدى اتساق تطبيقكم لمنهجية توريد رسمية متعددة المراحل — تشمل استطلاع السوق وطلب المعلومات وRFQ/RFP والتقييم والتفاوض والترسية — عند اختيار الموردين الاستراتيجيين أو تجديد التعاقد معهم؟',
        levels: [
          'Supplier selection is entirely informal, based on existing relationships or personal familiarity. No defined sourcing process, RFx templates, or evaluation criteria exist.',
          'Competitive quotes are sought for some purchases, but the process is inconsistent, undocumented, and lacks formal evaluation criteria or award rationale.',
          'A defined sourcing process with RFQ/RFP templates and basic multi-criteria scoring is applied to major spend decisions above a defined threshold.',
          'A formal multi-stage sourcing methodology is consistently applied to all significant spend, with documented evaluation scores, structured negotiation, and a written award rationale.',
          'A rigorous multi-stage sourcing methodology with structured market sounding, competitive RFx, multi-criteria scoring, negotiation, and documented award rationale is applied to all material spend, with lessons captured and applied to future events.',
        ],
        levelsAr: [
          'اختيار الموردين غير رسمي بالكامل، يستند إلى العلاقات القائمة أو المعرفة الشخصية. لا توجد عملية توريد محددة أو قوالب RFx أو معايير تقييم.',
          'تُطلَب عروض تنافسية لبعض المشتريات، لكن العملية غير متسقة وغير موثّقة وتفتقر إلى معايير تقييم رسمية أو مبرر للترسية.',
          'عملية توريد محددة بقوالب RFQ/RFP وتسجيل أساسي متعدد المعايير تُطبَّق على قرارات الإنفاق الكبرى فوق حد محدد.',
          'منهجية توريد رسمية متعددة المراحل تُطبَّق باتساق على كل الإنفاق الجوهري، بدرجات تقييم موثّقة وتفاوض منظم ومبرر ترسية خطي.',
          'منهجية توريد صارمة متعددة المراحل باستطلاع سوق منظم وRFx تنافسية وتسجيل متعدد المعايير وتفاوض ومبرر ترسية موثّق تُطبَّق على كل الإنفاق الجوهري، والدروس المستفادة مُلتقَطة ومُطبَّقة على الأحداث المستقبلية.',
        ],
      },
      {
        q: 'How effectively do you incorporate non-price criteria — such as quality, sustainability, innovation capability, and financial stability — into supplier evaluation and award decisions?',
        qAr: 'ما مدى فعالية دمجكم لمعايير غير السعر — مثل الجودة والاستدامة وقدرة الابتكار والاستقرار المالي — في تقييم الموردين وقرارات الترسية؟',
        levels: [
          'All award decisions are based on purchase price only. Non-price criteria such as quality, service, and sustainability are never formally evaluated.',
          'Some informal consideration of quality or delivery performance occurs but non-price criteria carry no formal weighting in evaluation scores or award decisions.',
          'Multi-criteria evaluation includes quality, delivery, and commercial performance with a defined weighting; evaluation results are documented for major decisions.',
          'Evaluation scorecards with clearly defined and weighted criteria — including quality, delivery, ESG, and innovation — are applied consistently and signed off by a governance committee.',
          'Multi-criteria evaluation with a transparent, pre-approved weighting framework — covering commercial, quality, ESG, innovation, and financial resilience — is applied to all material awards and results are published to internal stakeholders.',
        ],
        levelsAr: [
          'تستند جميع قرارات الترسية إلى سعر الشراء فقط. معايير غير السعر كالجودة والخدمة والاستدامة لا تُقيَّم رسميًا أبدًا.',
          'يُراعى بعض الاعتبار غير الرسمي للجودة أو الأداء في التسليم، لكن معايير غير السعر لا تحمل وزنًا رسميًا في درجات التقييم أو قرارات الترسية.',
          'التقييم متعدد المعايير يشمل الجودة والتسليم والأداء التجاري بأوزان محددة؛ ونتائج التقييم موثّقة للقرارات الكبرى.',
          'بطاقات تقييم بمعايير محددة وموزونة بوضوح — تشمل الجودة والتسليم والمعايير البيئية والاجتماعية والحوكمية والابتكار — تُطبَّق باتساق ويوقّع عليها بالاعتماد لجنة حوكمة.',
          'تقييم متعدد المعايير بإطار أوزان شفاف ومعتمد مسبقًا — يغطي التجاري والجودة والمعايير البيئية والاجتماعية والحوكمية والابتكار والمتانة المالية — يُطبَّق على جميع الترسيات الجوهرية والنتائج تُنشَر لأصحاب المصلحة الداخليين.',
        ],
      },
      {
        q: 'How well are tendering records, award rationale, and post-award performance reviews documented and retained to support audit, continuous improvement, and future sourcing events?',
        qAr: 'ما مدى جودة توثيق سجلات المناقصات ومبررات الترسية ومراجعات الأداء بعد الترسية وحفظها لدعم التدقيق والتحسين المستمر وأحداث التوريد المستقبلية؟',
        levels: [
          'Tendering records are not systematically retained. Award decisions are undocumented and the organisation cannot reconstruct why a supplier was selected.',
          'Basic award notification letters exist but evaluation records, scoring rationale, and negotiation minutes are not consistently retained or filed in a structured way.',
          'Evaluation scorecards and award rationale are documented for major decisions and retained in a shared folder for at least 3 years.',
          'All tendering records — including evaluation scores, negotiation outcomes, award rationale, and supplier debrief notes — are retained in a structured repository and are available for audit at short notice.',
          'A complete audit trail for every material tendering event — evaluation scores, correspondence, negotiation minutes, award rationale, and post-award performance reviews — is retained in a searchable system for a defined retention period; lessons learned feed the next tendering cycle.',
        ],
        levelsAr: [
          'لا تُحفَظ سجلات المناقصات بشكل منهجي. قرارات الترسية غير موثّقة والمؤسسة لا تستطيع إعادة تكوين أسباب اختيار مورد معيّن.',
          'توجد رسائل إخطار ترسية أساسية لكن سجلات التقييم ومبررات التسجيل ومحاضر التفاوض لا تُحفَظ باتساق أو تُحفَظ بطريقة منظمة.',
          'بطاقات التقييم ومبررات الترسية موثّقة للقرارات الكبرى ومحفوظة في مجلد مشترك لمدة 3 سنوات على الأقل.',
          'جميع سجلات المناقصات — بما في ذلك درجات التقييم ونتائج التفاوض ومبررات الترسية وملاحظات إيجاز الموردين — محفوظة في مستودع منظم ومتاحة للتدقيق في وقت قصير.',
          'مسار تدقيق كامل لكل حدث مناقصة جوهري — درجات التقييم والمراسلات ومحاضر التفاوض ومبرر الترسية ومراجعات الأداء بعد الترسية — محفوظ في نظام قابل للبحث لفترة احتفاظ محددة؛ والدروس المستفادة تُغذّي دورة المناقصة التالية.',
        ],
      },
    ],
  },

  /* ── 1-2  Spend Analytics & Intelligence ───────────────────────────────── */
  {
    id: 'proc-spend',
    title: 'Spend Analytics & Intelligence',
    titleAr: 'تحليلات الإنفاق واستخباراته',
    hint: 'Assesses the accuracy, coverage, and frequency of spend analysis — including classification, maverick spend detection, and savings opportunity identification.',
    hintAr: 'يقيس دقة تحليل الإنفاق وتغطيته وتكراره — بما في ذلك التصنيف واكتشاف الإنفاق الخارج عن السياسات وتحديد فرص التوفير.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How advanced and frequently refreshed is your spend analytics capability — including spend classification accuracy, coverage across all spend categories, and insight generation?',
        qAr: 'ما مدى تقدّم قدرتكم على تحليل الإنفاق وتكرار تحديثها — بما في ذلك دقة تصنيف الإنفاق والتغطية عبر جميع فئات الإنفاق وتوليد الرؤى؟',
        levels: [
          'Spend data is not centrally available or analysed. The organisation does not know what it buys, from whom, or at what price across the business.',
          'Basic spend reports are produced periodically but data quality is poor, classification is incomplete, and insights are rarely acted upon.',
          'Spend analysis is conducted at least quarterly, classifying the majority of spend with reasonable accuracy and producing basic trend and supplier reports.',
          'Spend analytics are automated, run monthly, classify 80%+ of spend accurately, identify maverick purchasing, and surface top savings opportunities by category.',
          'Real-time spend analytics powered by an integrated data platform classify 95%+ of spend, automatically flag policy violations and maverick purchasing, and surface quantified savings opportunities continuously to all category managers.',
        ],
        levelsAr: [
          'بيانات الإنفاق غير متاحة أو محلَّلة مركزيًا. لا تعرف المؤسسة ماذا تشتري ومن مَن وبأي سعر عبر الأعمال.',
          'تُنتَج تقارير إنفاق أساسية دوريًا لكن جودة البيانات ضعيفة والتصنيف غير مكتمل ونادرًا ما يُعمَل بالرؤى.',
          'يُجرى تحليل الإنفاق فصليًا على الأقل، يُصنَّف غالبية الإنفاق بدقة معقولة وينتج تقارير اتجاهات وموردين أساسية.',
          'تحليلات الإنفاق مؤتمتة وتعمل شهريًا وتُصنّف أكثر من 80% من الإنفاق بدقة وتُحدّد الشراء الخارج عن السياسات وتُبرز أبرز فرص التوفير حسب الفئة.',
          'تحليلات الإنفاق الآنية المدعومة بمنصة بيانات متكاملة تُصنّف أكثر من 95% من الإنفاق وتُبلّغ آليًا عن مخالفات السياسات والشراء الخارج عن السياسات وتُبرز فرص توفير مُقاسة باستمرار لجميع مديري الفئات.',
        ],
      },
      {
        q: 'How effectively do you use spend data to identify and actively reduce maverick purchasing — transactions made outside approved channels, preferred suppliers, or contracted pricing?',
        qAr: 'ما مدى فعالية استخدامكم لبيانات الإنفاق لتحديد الشراء الخارج عن السياسات وتقليصه بفاعلية — المعاملات التي تتم خارج القنوات المعتمدة أو الموردين المفضّلين أو التسعير التعاقدي؟',
        levels: [
          'Maverick purchasing is not measured or monitored. The organisation has no visibility of the proportion of spend occurring outside approved channels or contracted arrangements.',
          'Some awareness of maverick purchasing exists but it is not quantified, tracked, or systematically managed, and no corrective policy is in place.',
          'Maverick purchasing is estimated as a percentage of total spend from spend analysis and is tracked; the major sources of non-compliance are identified and reported to management.',
          'Maverick purchasing is tracked monthly by category and business unit; findings drive targeted compliance improvement actions, and trends are reported to procurement leadership.',
          'Maverick purchasing is tracked in real time; automated alerts are sent to buyers and their managers when non-compliant purchases are detected; compliance rates are a procurement KPI reported to the CPO monthly.',
        ],
        levelsAr: [
          'الشراء الخارج عن السياسات لا يُقاس أو يُراقَب. ليس لدى المؤسسة أي رؤية لنسبة الإنفاق الذي يحدث خارج القنوات المعتمدة أو الترتيبات التعاقدية.',
          'يوجد بعض الوعي بالشراء الخارج عن السياسات لكنه غير مُقاس وغير مُتابَع وغير مُدار بشكل منهجي، ولا توجد سياسة تصحيحية.',
          'الشراء الخارج عن السياسات يُقدَّر كنسبة مئوية من إجمالي الإنفاق من تحليل الإنفاق ويُتابَع؛ وأبرز مصادر عدم الامتثال تُحدَّد وتُرفَع للإدارة.',
          'الشراء الخارج عن السياسات يُتابَع شهريًا حسب الفئة والوحدة التجارية؛ والنتائج تقود إجراءات تحسين امتثال مستهدفة، والاتجاهات تُرفَع لقيادة المشتريات.',
          'الشراء الخارج عن السياسات يُتابَع آنيًا؛ وتُرسَل تنبيهات آلية للمشترين ومديريهم عند اكتشاف مشتريات غير ممتثلة؛ ومعدلات الامتثال مؤشر أداء مشتريات يُرفَع للـ CPO شهريًا.',
        ],
      },
      {
        q: 'How effectively do you leverage spend analytics to identify market pricing trends, consolidation opportunities, and supplier rationalisation targets that inform category strategy?',
        qAr: 'ما مدى فعالية توظيفكم لتحليلات الإنفاق لتحديد اتجاهات أسعار السوق وفرص التوحيد ومستهدفات ترشيد قاعدة الموردين التي تُغذّي استراتيجية الفئة؟',
        levels: [
          'Spend data is not used to inform category strategy. Market pricing trends and consolidation opportunities are identified — if at all — through vendor conversations alone.',
          'Basic spend reports show top suppliers and spend by category, but insights are not systematically used to update category strategies or drive supplier rationalisation.',
          'Spend analysis identifies the top 5 suppliers by category, highlights consolidation opportunities, and informs the annual category strategy update.',
          'Spend analytics are used quarterly to benchmark supplier pricing against market rates, identify consolidation opportunities, and produce a rated list of supplier rationalisation targets reviewed by procurement leadership.',
          'Spend analytics feed directly into the category strategy cycle; pricing benchmarks, consolidation opportunities, and supplier rationalisation targets are updated quarterly and presented at the procurement governance board as a standing agenda item.',
        ],
        levelsAr: [
          'لا تُستخدَم بيانات الإنفاق لإثراء استراتيجية الفئة. اتجاهات أسعار السوق وفرص التوحيد تُحدَّد — إن حدث — من خلال محادثات الموردين وحدها.',
          'التقارير الأساسية للإنفاق تُظهر أبرز الموردين والإنفاق حسب الفئة، لكن الرؤى لا تُستخدَم بشكل منهجي لتحديث استراتيجيات الفئة أو دفع ترشيد قاعدة الموردين.',
          'تحليل الإنفاق يُحدّد أكبر 5 موردين حسب الفئة ويُبرز فرص التوحيد ويُغذّي تحديث استراتيجية الفئة السنوي.',
          'تُستخدَم تحليلات الإنفاق فصليًا للمقارنة المعيارية لتسعير الموردين مع أسعار السوق وتحديد فرص التوحيد وإعداد قائمة مُقيَّمة لمستهدفات ترشيد الموردين تُراجَع من قيادة المشتريات.',
          'تحليلات الإنفاق تُغذّي مباشرةً دورة استراتيجية الفئة؛ والمعايير التسعيرية وفرص التوحيد ومستهدفات ترشيد الموردين تُحدَّث فصليًا وتُقدَّم في مجلس حوكمة المشتريات كبند ثابت على جدول الأعمال.',
        ],
      },
    ],
  },

  /* ── 1-3  Total Cost of Ownership ──────────────────────────────────────── */
  {
    id: 'proc-tco',
    title: 'Total Cost of Ownership (TCO)',
    titleAr: 'التكلفة الإجمالية للملكية',
    hint: 'Assesses how consistently TCO analysis — including quality, logistics, risk, lifecycle, and sustainability costs — is applied in sourcing decisions beyond purchase price alone.',
    hintAr: 'يقيس مدى اتساق تطبيق تحليل التكلفة الإجمالية للملكية — بما في ذلك الجودة والخدمات اللوجستية والمخاطر وتكاليف دورة الحياة والاستدامة — في قرارات التوريد بما يتجاوز سعر الشراء وحده.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'TCO model or analysis',
      labelAr: 'نموذج أو تحليل التكلفة الإجمالية للملكية',
      hint: 'Upload a TCO model, analysis template, or sourcing decision document that applies TCO methodology.',
      hintAr: 'ارفع نموذج TCO أو قالب تحليل أو وثيقة قرار توريد تُطبّق منهجية التكلفة الإجمالية للملكية.',
    },
    questions: [
      {
        q: 'How consistently do you apply Total Cost of Ownership analysis — accounting for logistics, quality defects, lifecycle maintenance, supplier risk, and import duties — in preference to purchase price alone?',
        qAr: 'ما مدى اتساق تطبيقكم لتحليل التكلفة الإجمالية للملكية — بمراعاة الخدمات اللوجستية وعيوب الجودة والصيانة على مدى دورة الحياة ومخاطر الموردين والرسوم الجمركية — بدلاً من سعر الشراء وحده؟',
        levels: [
          'All sourcing decisions are based on purchase price per unit only. Hidden costs, quality implications, risk premiums, and lifecycle costs are never modelled.',
          'Some additional costs (e.g., logistics or import duties) are occasionally noted informally, but no structured TCO model or methodology is applied to any decision.',
          'TCO analysis is applied to strategic category sourcing decisions using a defined model that accounts for quality, logistics, risk, and total lifecycle costs.',
          'TCO is consistently applied across all significant sourcing decisions, with documented models reviewed in the governance process and reported to stakeholders.',
          'TCO models are applied to all strategic and leverage categories; sourcing decisions routinely demonstrate 10–25% additional value beyond purchase price; TCO methodology is embedded in all category plan templates.',
        ],
        levelsAr: [
          'تستند جميع قرارات التوريد إلى سعر شراء الوحدة فقط. التكاليف الخفية وأثر الجودة وأقساط المخاطر وتكاليف دورة الحياة لا تُنمذَج أبدًا.',
          'تُلاحَظ بعض التكاليف الإضافية (مثل الخدمات اللوجستية أو الرسوم الجمركية) أحيانًا بشكل غير رسمي، لكن لا يُطبَّق نموذج TCO منظم أو منهجية على أي قرار.',
          'يُطبَّق تحليل TCO على قرارات توريد الفئات الاستراتيجية باستخدام نموذج محدد يراعي الجودة والخدمات اللوجستية والمخاطر وإجمالي تكاليف دورة الحياة.',
          'يُطبَّق TCO باتساق عبر جميع قرارات التوريد الجوهرية، بنماذج موثّقة تُراجَع في عملية الحوكمة وتُرفَع لأصحاب المصلحة.',
          'نماذج TCO تُطبَّق على جميع الفئات الاستراتيجية ورافعات التفاوض؛ وقرارات التوريد تُظهر بانتظام قيمة إضافية بنسبة 10–25% تتجاوز سعر الشراء؛ ومنهجية TCO مدمجة في جميع قوالب خطة الفئات.',
        ],
      },
      {
        q: 'How well-developed are your TCO models — and how accurately do they capture second-order costs such as supplier switching costs, warranty claims, rework, and supply disruption risk premia?',
        qAr: 'ما مدى تطوّر نماذج التكلفة الإجمالية للملكية لديكم — وما مدى دقة التقاطها للتكاليف من الدرجة الثانية كتكاليف تغيير الموردين وطلبات الضمان وإعادة العمل وأقساط مخاطر انقطاع الإمداد؟',
        levels: [
          'No TCO models exist. The concept of total cost is understood informally by some individuals but has never been quantified or documented.',
          'A basic cost model exists for some categories, capturing purchase price, logistics, and import duties — but not quality, risk, or lifecycle costs.',
          'A documented TCO model captures 5–7 cost categories including quality defect costs, logistics, duties, and basic supplier risk assessment.',
          'TCO models are category-specific, capturing all direct and indirect cost components including switching costs, quality costs, and a risk-adjusted cost premium; models are updated annually.',
          'TCO models are regularly validated against actuals; they capture all first- and second-order costs including switching costs, warranty experience, supply disruption risk premia, and sustainability compliance costs; results are used to score suppliers in evaluations.',
        ],
        levelsAr: [
          'لا توجد نماذج TCO. مفهوم التكلفة الإجمالية مفهوم غير رسمي لدى بعض الأفراد لكنه لم يُقيَّس أو يُوثَّق قط.',
          'يوجد نموذج تكلفة أساسي لبعض الفئات يلتقط سعر الشراء والخدمات اللوجستية والرسوم الجمركية — لكنه لا يلتقط الجودة أو المخاطر أو تكاليف دورة الحياة.',
          'نموذج TCO موثّق يلتقط 5–7 فئات تكلفة تشمل تكاليف عيوب الجودة والخدمات اللوجستية والرسوم وتقييم مخاطر موردين أساسي.',
          'نماذج TCO خاصة بالفئة تلتقط جميع مكوّنات التكلفة المباشرة وغير المباشرة بما في ذلك تكاليف التحول وتكاليف الجودة وقسط مخاطر مُعدَّل؛ وتُحدَّث النماذج سنويًا.',
          'نماذج TCO تُتحقَّق منها بانتظام مقابل الفعلي؛ وتلتقط جميع تكاليف الدرجة الأولى والثانية بما في ذلك تكاليف التحول وتجربة الضمان وأقساط مخاطر انقطاع الإمداد وتكاليف الامتثال للاستدامة؛ والنتائج تُستخدَم لتقييم الموردين.',
        ],
      },
      {
        q: 'How effectively are TCO insights shared with internal stakeholders — and how consistently do they challenge and override decisions based on purchase price alone?',
        qAr: 'ما مدى فعالية مشاركة رؤى التكلفة الإجمالية للملكية مع أصحاب المصلحة الداخليين — وما مدى اتساق تحديها وتجاوزها للقرارات القائمة على سعر الشراء وحده؟',
        levels: [
          'TCO insights, when they exist, are not shared beyond the procurement team. Business stakeholders base budget requests on purchase price and are unaware of total cost implications.',
          'TCO data is occasionally shared informally, but it rarely changes stakeholder decisions, which continue to be driven by initial purchase price.',
          'TCO analysis is presented to business stakeholders for major purchasing decisions, and in most cases the full-cost view influences the final choice.',
          'TCO is embedded in the business case process; any procurement request above a defined threshold must include a TCO model approved by procurement before budget is committed.',
          'TCO literacy is actively built across the business; the procurement business case template mandates TCO analysis for all spend above threshold; procurement routinely presents TCO evidence to challenge purchase-price-driven business cases — and wins.',
        ],
        levelsAr: [
          'رؤى التكلفة الإجمالية للملكية، حين تتوفر، لا تُشارَك خارج فريق المشتريات. أصحاب المصلحة في الأعمال يستندون إلى سعر الشراء في طلبات الميزانية وغير مدركين لتداعيات التكلفة الإجمالية.',
          'بيانات TCO تُشارَك أحيانًا بشكل غير رسمي، لكنها نادرًا ما تُغيّر قرارات أصحاب المصلحة التي تستمر في الاعتماد على سعر الشراء الأولي.',
          'تُقدَّم تحليلات TCO لأصحاب المصلحة في الأعمال للقرارات الشرائية الكبرى، وفي معظم الحالات يؤثر المنظور التكلفوي الشامل في الاختيار النهائي.',
          'TCO مدمَج في عملية حالة الأعمال؛ وأي طلب مشتريات فوق حد محدد يجب أن يتضمن نموذج TCO معتمدًا من المشتريات قبل الالتزام بالميزانية.',
          'ثقافة TCO تُبنى بفاعلية عبر الأعمال؛ وقالب حالة أعمال المشتريات يلزم بتحليل TCO لكل الإنفاق فوق الحد؛ والمشتريات تُقدّم بانتظام أدلة TCO لتحدي حالات الأعمال المدفوعة بسعر الشراء — وتكسب.',
        ],
      },
    ],
  },

  /* ── 1-4  Contract Award & SLA Baseline ────────────────────────────────── */
  {
    id: 'proc-award',
    title: 'Contract Award & SLA Baseline',
    titleAr: 'ترسية العقود وأساس اتفاقية مستوى الخدمة',
    hint: 'Assesses the rigour of contract award governance, the quality of SLA and KPI definition at award stage, and the baseline established before supplier onboarding.',
    hintAr: 'يقيس صرامة حوكمة ترسية العقود وجودة تعريف اتفاقيات مستوى الخدمة ومؤشرات الأداء في مرحلة الترسية والأساس المُرسَى قبل ضمّ المورد.',
    benchmarks: { gcc: 2.2, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Contract award governance documentation',
      labelAr: 'وثائق حوكمة ترسية العقود',
      hint: 'Upload an authority matrix, contract award approval template, or SLA schedule from a supplier contract.',
      hintAr: 'ارفع مصفوفة الصلاحيات أو قالب اعتماد ترسية العقد أو جدول اتفاقية مستوى الخدمة من عقد مورد.',
    },
    questions: [
      {
        q: 'How well-defined are your contract award authority thresholds and governance process — ensuring that award decisions are made at the appropriate level with documented rationale and audit trail?',
        qAr: 'ما مدى وضوح حدود صلاحية ترسية العقود وعملية الحوكمة لديكم — مما يضمن اتخاذ قرارات الترسية على المستوى الملائم بمبرر موثّق ومسار تدقيق؟',
        levels: [
          'No formal authority matrix exists for contract awards. Individuals award contracts based on their own judgement without reference to a governance framework or spending limit.',
          'A basic financial authority limit exists but it is informally applied, rarely enforced, and the rationale for award decisions is not consistently documented.',
          'A formal authority matrix defines signing limits by contract value; awards above threshold require management sign-off and documented award rationale.',
          'A tiered authority matrix covering procurement, finance, legal, and executive sign-off thresholds is consistently applied; all awards include a written rationale retained in the contract register.',
          'A fully documented authority matrix is communicated and trained across the organisation; all awards above a defined threshold are approved by a cross-functional committee; award rationales are retained with full audit trail and available for external review on demand.',
        ],
        levelsAr: [
          'لا توجد مصفوفة صلاحيات رسمية لترسية العقود. يُرسّي الأفراد العقود وفق تقديرهم الشخصي دون الرجوع إلى إطار حوكمة أو حد للإنفاق.',
          'يوجد حد مالي أساسي للصلاحية لكنه يُطبَّق بشكل غير رسمي ونادرًا ما يُنفَّذ، ومبرر قرارات الترسية لا يُوثَّق باتساق.',
          'مصفوفة صلاحيات رسمية تحدد حدود التوقيع حسب قيمة العقد؛ والترسيات فوق الحد تستلزم موافقة الإدارة ومبرر ترسية موثّق.',
          'مصفوفة صلاحيات متدرجة تغطي حدود توقيع المشتريات والمالية والقانونية والتنفيذية تُطبَّق باتساق؛ وجميع الترسيات تتضمن مبررًا خطيًا محفوظًا في سجل العقود.',
          'مصفوفة صلاحيات موثّقة بالكامل مُبلَّغة ومُدرَّبة عبر المؤسسة؛ وجميع الترسيات فوق حد محدد معتمدة من لجنة متعددة الوظائف؛ ومبررات الترسية محفوظة بمسار تدقيق كامل ومتاحة للمراجعة الخارجية عند الطلب.',
        ],
      },
      {
        q: 'How rigorously are SLAs, performance KPIs, and remedy provisions defined at contract award stage — ensuring measurable, enforceable commitments before the supplier relationship begins?',
        qAr: 'ما مدى صرامة تعريف اتفاقيات مستوى الخدمة ومؤشرات الأداء وأحكام التعويض في مرحلة ترسية العقد — مما يضمن التزامات قابلة للقياس والإنفاذ قبل بدء علاقة المورد؟',
        levels: [
          'SLAs and KPIs are not defined in supplier contracts. Contracts specify only price and quantity; performance expectations are discussed informally and never enforced.',
          'Some contracts reference SLAs informally but they are poorly defined, lack measurable targets, and remedy provisions are absent or vague.',
          'Key supplier contracts include defined SLAs with measurable targets, reporting obligations, and basic remedy provisions (e.g., service credits or cure periods).',
          'All significant contracts include a fully defined SLA schedule with quantified KPIs, clear reporting obligations, structured remedy provisions, and defined escalation paths.',
          'All material contracts include a comprehensive SLA schedule with SMART KPIs, data-driven reporting obligations, structured remedy provisions, step-in rights, and termination for cause — reviewed by legal and procurement before award.',
        ],
        levelsAr: [
          'اتفاقيات مستوى الخدمة ومؤشرات الأداء غير معرَّفة في عقود الموردين. العقود تحدد السعر والكمية فقط؛ وتوقعات الأداء تُناقَش بشكل غير رسمي ولا تُنفَّذ أبدًا.',
          'بعض العقود تشير إلى اتفاقيات مستوى خدمة بشكل غير رسمي لكنها محددة تحديدًا ضعيفًا وتفتقر إلى مستهدفات قابلة للقياس وأحكام التعويض غائبة أو مبهمة.',
          'عقود الموردين الرئيسيين تتضمن اتفاقيات مستوى خدمة محددة بمستهدفات قابلة للقياس والتزامات تقارير وأحكام تعويض أساسية (مثل ائتمانات الخدمة أو فترات الإصلاح).',
          'جميع العقود الجوهرية تتضمن جدول اتفاقية مستوى خدمة معرَّفًا بالكامل بمؤشرات أداء مُقاسة والتزامات تقارير واضحة وأحكام تعويض منظمة ومسارات تصعيد محددة.',
          'جميع العقود الجوهرية تتضمن جدول اتفاقية خدمة شاملًا بمؤشرات أداء SMART والتزامات تقارير قائمة على البيانات وأحكام تعويض منظمة وحقوق تدخل وإنهاء للتعثّر — تُراجَعها القانونية والمشتريات قبل الترسية.',
        ],
      },
      {
        q: 'How thoroughly is supplier performance baselined before contract go-live — including baseline KPI data collection, system integration testing, and onboarding verification?',
        qAr: 'ما مدى شمولية تأسيس أداء المورد كمرجعية قبل بدء سريان العقد — بما في ذلك جمع بيانات مؤشرات الأداء المرجعية واختبار تكامل النظام والتحقق من الضمّ؟',
        levels: [
          'No baseline is established before a supplier goes live. Performance measurement begins only after issues arise — making it impossible to establish whether the problem existed before or after contract start.',
          'Some informal data collection occurs before go-live but it is inconsistent and not used to establish a documented performance baseline against which the contract SLAs are measured.',
          'A basic baseline data collection exercise captures key performance metrics before go-live; the results are documented and used as the starting reference point for SLA measurement.',
          'A structured pre-go-live baseline exercise captures all SLA metrics, verifies system integrations, and documents any known deviations — with agreed remediation timelines before the supplier is formally accepted.',
          'A mandatory pre-go-live checklist covers baseline data capture for all KPIs, system integration testing, security verification, and sign-off by procurement, IT, and operations before the supplier is formally activated — with all baseline data stored in the contract register.',
        ],
        levelsAr: [
          'لا تُؤسَّس مرجعية قبل بدء تشغيل المورد. قياس الأداء لا يبدأ إلا عند ظهور مشكلات — مما يجعل من المستحيل تحديد ما إذا كانت المشكلة موجودة قبل أو بعد بدء العقد.',
          'يُجمَع بعض البيانات بشكل غير رسمي قبل التشغيل لكنه غير متسق ولا يُستخدَم لتأسيس مرجعية أداء موثّقة يُقاس العقد وفق اتفاقيات مستوى الخدمة منها.',
          'تمرين جمع بيانات مرجعية أساسي يلتقط مقاييس الأداء الرئيسية قبل التشغيل؛ والنتائج موثّقة وتُستخدَم كنقطة مرجع بداية لقياس اتفاقيات مستوى الخدمة.',
          'تمرين منظم لتأسيس المرجعية قبل التشغيل يلتقط جميع مقاييس اتفاقية مستوى الخدمة ويتحقق من تكاملات النظام ويوثّق أي انحرافات معروفة — بجداول إصلاح متّفق عليها قبل القبول الرسمي للمورد.',
          'قائمة تحقق إلزامية قبل التشغيل تغطي جمع بيانات المرجعية لجميع مؤشرات الأداء واختبار تكامل النظام والتحقق الأمني وموافقة المشتريات وتقنية المعلومات والعمليات قبل تفعيل المورد رسميًا — مع حفظ جميع بيانات المرجعية في سجل العقود.',
        ],
      },
    ],
  },

  /* ── 1-5  Procurement Technology & Enablement ──────────────────────────── */
  {
    id: 'proc-tech',
    title: 'Procurement Technology & Enablement',
    titleAr: 'تقنية المشتريات والتمكين الرقمي',
    hint: 'Assesses the maturity of procurement technology adoption — from e-procurement and e-sourcing through to AI-enabled spend intelligence and autonomous procurement workflows.',
    hintAr: 'يقيس نضج اعتماد تقنية المشتريات — من المشتريات الإلكترونية والتوريد الإلكتروني حتى استخبارات الإنفاق بالذكاء الاصطناعي وسير عمل المشتريات الذاتي.',
    benchmarks: { gcc: 2.1, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How advanced is your procurement technology stack — and how well-integrated are your e-sourcing, e-procurement, contract management, and spend analytics systems?',
        qAr: 'ما مدى تقدّم منظومة تقنية المشتريات لديكم — وما مدى تكامل أنظمة التوريد الإلكتروني والمشتريات الإلكترونية وإدارة العقود وتحليلات الإنفاق؟',
        levels: [
          'Procurement operates on email, spreadsheets, and phone calls. There are no dedicated procurement technology tools and all processes are entirely manual.',
          'Basic ERP purchasing modules are used for purchase orders but e-sourcing, contract management, and spend analytics are absent or managed in disconnected spreadsheets.',
          'An e-procurement platform handles purchase orders, approvals, and supplier catalogues; some contract storage exists; spend analysis is produced periodically from ERP data.',
          'An integrated procurement technology suite covers e-sourcing, purchase-to-pay, contract management, and spend analytics — with data flowing between modules with minimal manual intervention.',
          'A fully integrated, cloud-based procurement platform connects e-sourcing, P2P, CLM, spend analytics, and supplier performance management — with real-time data across modules and AI-assisted recommendations driving procurement decisions.',
        ],
        levelsAr: [
          'تعمل المشتريات بالبريد الإلكتروني وجداول البيانات والمكالمات الهاتفية. لا توجد أدوات تقنية مشتريات متخصصة وجميع العمليات يدوية بالكامل.',
          'وحدات شراء ERP الأساسية تُستخدَم لطلبات الشراء لكن التوريد الإلكتروني وإدارة العقود وتحليلات الإنفاق غائبة أو مُدارة في جداول بيانات منفصلة.',
          'منصة مشتريات إلكترونية تُعالج طلبات الشراء والموافقات وكتالوجات الموردين؛ ويوجد بعض تخزين العقود؛ وتحليل الإنفاق يُنتَج دوريًا من بيانات ERP.',
          'مجموعة تقنية مشتريات متكاملة تغطي التوريد الإلكتروني والشراء للدفع وإدارة العقود وتحليلات الإنفاق — مع تدفق البيانات بين الوحدات بأدنى تدخل يدوي.',
          'منصة مشتريات سحابية متكاملة بالكامل تربط التوريد الإلكتروني والشراء للدفع وCLM وتحليلات الإنفاق وإدارة أداء الموردين — ببيانات آنية عبر الوحدات وتوصيات مدعومة بالذكاء الاصطناعي تقود قرارات المشتريات.',
        ],
      },
      {
        q: 'How effectively does your procurement technology drive compliant purchasing behaviour — through guided buying, automated approvals, and real-time policy enforcement?',
        qAr: 'ما مدى فعالية تقنية المشتريات لديكم في توجيه سلوك الشراء الممتثل — عبر الشراء الموجَّه والموافقات الآلية وإنفاذ السياسات آنيًا؟',
        levels: [
          'Procurement technology does not enforce policy. Buyers can raise purchase orders freely without approval workflows, preferred supplier steering, or spend threshold controls.',
          'Basic approval workflows exist for high-value purchases but low-value spend, catalogue selection, and preferred supplier steering are not enforced by the system.',
          'An e-procurement system enforces approval workflows and preferred supplier catalogues for routine spend; some policy rules are automated but exceptions are common.',
          'The procurement system enforces approval thresholds, preferred supplier catalogues, and spend policy rules automatically; exceptions require documented justification and management approval.',
          'A guided buying experience with AI-assisted supplier recommendations, automated policy enforcement, and real-time compliance monitoring drives 95%+ of spend through compliant channels; exceptions are tracked and reported monthly.',
        ],
        levelsAr: [
          'تقنية المشتريات لا تُنفّذ السياسات. يمكن للمشترين إصدار طلبات شراء بحرية دون مسارات موافقة أو توجيه للموردين المفضّلين أو ضوابط حدود الإنفاق.',
          'مسارات موافقة أساسية تُوجَد للمشتريات عالية القيمة لكن الإنفاق المنخفض القيمة واختيار الكتالوج وتوجيه الموردين المفضّلين لا يُنفَّذ من قِبَل النظام.',
          'نظام مشتريات إلكترونية يُنفّذ مسارات الموافقة وكتالوجات الموردين المفضّلين للإنفاق الروتيني؛ وبعض قواعد السياسة مؤتمتة لكن الاستثناءات شائعة.',
          'النظام يُنفّذ تلقائيًا حدود الموافقة وكتالوجات الموردين المفضّلين وقواعد سياسة الإنفاق؛ والاستثناءات تستلزم مبررًا موثّقًا وموافقة إدارة.',
          'تجربة شراء موجَّهة بتوصيات موردين مدعومة بالذكاء الاصطناعي وإنفاذ آلي للسياسات ومراقبة امتثال آنية تقود أكثر من 95% من الإنفاق عبر قنوات ممتثلة؛ والاستثناءات تُتابَع وتُرفَع شهريًا.',
        ],
      },
      {
        q: 'How well does your procurement technology produce actionable management information — enabling category managers, CPO, and the board to make decisions from trusted, timely data?',
        qAr: 'ما مدى جودة إنتاج تقنية المشتريات لمعلومات إدارية قابلة للتطبيق — مما يمكّن مديري الفئات والـ CPO ومجلس الإدارة من اتخاذ القرارات استنادًا إلى بيانات موثوقة وحديثة؟',
        levels: [
          'Procurement has no reliable management information system. Reports are produced manually by extracting data from multiple disconnected systems, taking days to compile and often inaccurate.',
          'Some standard reports are available from the ERP or finance system but they are produced monthly at best, require manual manipulation, and lack category-level or supplier-level granularity.',
          'A monthly procurement MI pack covers spend by category, savings versus target, and top supplier performance; data is reasonably accurate but requires manual preparation.',
          'A live procurement dashboard provides the CPO and category managers with daily access to spend, savings, compliance, and supplier performance data with category and supplier level drill-down.',
          'A real-time procurement intelligence platform provides the CPO with a single view of spend, savings, compliance, risk, and supplier performance — refreshed daily, with predictive analytics flagging emerging risks and opportunities before they materialise.',
        ],
        levelsAr: [
          'لا يمتلك قسم المشتريات نظامًا موثوقًا للمعلومات الإدارية. تُنتَج التقارير يدويًا باستخراج البيانات من أنظمة منفصلة متعددة، يستغرق إعدادها أيامًا وكثيرًا ما تكون غير دقيقة.',
          'بعض التقارير القياسية متاحة من ERP أو نظام المالية لكنها تُنتَج شهريًا في أحسن الأحوال وتستلزم معالجة يدوية وتفتقر إلى تفاصيل على مستوى الفئة أو المورد.',
          'حزمة المعلومات الإدارية الشهرية للمشتريات تغطي الإنفاق حسب الفئة والوفورات مقابل الأهداف وأداء الموردين الرئيسيين؛ والبيانات دقيقة بشكل معقول لكنها تستلزم إعدادًا يدويًا.',
          'لوحة معلومات مشتريات حية توفر للـ CPO ومديري الفئات وصولاً يوميًا لبيانات الإنفاق والوفورات والامتثال وأداء الموردين مع إمكانية التعمق على مستوى الفئة والمورد.',
          'منصة استخبارات مشتريات آنية توفر للـ CPO رؤية موحدة للإنفاق والوفورات والامتثال والمخاطر وأداء الموردين — تُحدَّث يوميًا، بتحليلات تنبؤية تُبلّغ عن المخاطر والفرص الناشئة قبل تحقّقها.',
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 2 — CONTRACT LIFECYCLE MANAGEMENT  (segIdx 2)
   Sub-segments:
     0 Contract Drafting & Standards · 1 Obligation & Milestone Tracking
     2 Variation & Change Management · 3 Renewal & Expiry Management
     4 Compliance & Audit Trail      · 5 CLM Technology & Repository
═══════════════════════════════════════════════════════════════════════════ */

export const CLM_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 2-0  Contract Drafting & Standards ────────────────────────────────── */
  {
    id: 'clm-drafting',
    title: 'Contract Drafting & Standards',
    titleAr: 'صياغة العقود والمعايير',
    hint: 'Assesses the quality of contract templates, approval workflows, negotiation playbooks, and legal review standards applied before signature.',
    hintAr: 'يقيس جودة قوالب العقود ومسارات الموافقة وأدلة التفاوض ومعايير المراجعة القانونية المُطبَّقة قبل التوقيع.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.5, other: 1.0,
    },
    evidence: {
      label: 'Contract template or playbook',
      labelAr: 'قالب عقد أو دليل تفاوض',
      hint: 'Upload a standard contract template, negotiation playbook, or approved fallback positions document.',
      hintAr: 'ارفع قالب عقد معياري أو دليل تفاوض أو وثيقة مواقف احتياطية معتمدة.',
    },
    questions: [
      {
        q: 'How mature are your standard contract templates — covering key risk protections, liability caps, IP rights, termination provisions, and data security obligations — and how consistently are they used?',
        qAr: 'ما مدى نضج قوالب العقود المعيارية لديكم — التي تغطي حمايات المخاطر الرئيسية وسقف المسؤولية وحقوق الملكية الفكرية وأحكام الإنهاء والتزامات أمن البيانات — وما مدى اتساق استخدامها؟',
        levels: [
          'No standard contract templates exist. Every contract is drafted from scratch or taken directly from supplier templates with no legal review or standard protections.',
          'A few template contracts exist for common agreement types but they are outdated, inconsistently used, and lawyers review only high-value agreements.',
          'A library of standard templates covers most common contract types; templates are legally approved, include key risk protections, and are the mandatory starting point for all new contracts.',
          'A comprehensive template library covers all procurement contract types; each template is reviewed annually by legal, updated for regulatory changes, and deviation from standard requires documented approval.',
          'A dynamic template library is maintained by legal and procurement jointly; templates cover all contract types with pre-approved fallback positions for key clauses; deviation from standard requires written approval from legal and procurement leadership; templates are updated within 30 days of any regulatory change.',
        ],
        levelsAr: [
          'لا توجد قوالب عقود معيارية. كل عقد يُصاغ من الصفر أو يُؤخذ مباشرةً من قوالب الموردين دون مراجعة قانونية أو حمايات معيارية.',
          'توجد بضعة عقود قالبية لأنواع الاتفاقيات الشائعة لكنها قديمة وغير مُستخدَمة باتساق ولا يراجع المحامون إلا الاتفاقيات عالية القيمة.',
          'مكتبة قوالب معيارية تغطي معظم أنواع العقود الشائعة؛ القوالب معتمدة قانونيًا وتتضمن حمايات مخاطر رئيسية وهي نقطة البداية الإلزامية لجميع العقود الجديدة.',
          'مكتبة قوالب شاملة تغطي جميع أنواع عقود المشتريات؛ كل قالب تُراجَعه القانونية سنويًا ويُحدَّث للتغييرات التنظيمية والانحراف عن المعياري يستلزم موافقة موثّقة.',
          'مكتبة قوالب ديناميكية تُدارها القانونية والمشتريات مشتركةً؛ تغطي جميع أنواع العقود بمواقف احتياطية معتمدة مسبقًا للبنود الرئيسية؛ والانحراف عن المعياري يستلزم موافقة خطية من قيادة القانونية والمشتريات؛ والقوالب تُحدَّث في غضون 30 يومًا من أي تغيير تنظيمي.',
        ],
      },
      {
        q: 'How structured and consistently applied is your contract negotiation process — including use of a commercial playbook, pre-approved fallback positions, red-line authorities, and lessons-learned capture?',
        qAr: 'ما مدى تنظيم عملية التفاوض على العقود لديكم واتساق تطبيقها — بما في ذلك استخدام دليل تجاري ومواقف احتياطية معتمدة مسبقًا وصلاحيات الخطوط الحمراء والتقاط الدروس المستفادة؟',
        levels: [
          'Negotiation is conducted informally based on individual style and personal judgement. No playbook, authority thresholds, red-line limits, or structured framework exist.',
          'Some negotiation guidance exists informally but it is not documented, not consistently applied, and negotiation outcomes are not recorded for future reference.',
          'A basic negotiation framework defines pre-approved positions and authority thresholds for common commercial points; outcomes are documented for major contracts.',
          'A commercial playbook with pre-approved fallback positions, red-line authorities, and escalation protocols is consistently applied to all significant contracts; outcomes are centrally documented.',
          'A comprehensive commercial playbook with pre-approved fallback positions, red-line authority levels, escalation protocols, and strategic negotiation guidance is applied to all material contracts; outcomes, win/loss analysis, and lessons learned are captured centrally and feed the next negotiation cycle.',
        ],
        levelsAr: [
          'يُجرى التفاوض بشكل غير رسمي وفق الأسلوب الفردي والتقدير الشخصي. لا يوجد دليل أو حدود صلاحيات أو حدود خطوط حمراء أو إطار منظم.',
          'يوجد بعض الإرشاد التفاوضي بشكل غير رسمي لكنه غير موثّق وغير مطبّق باتساق ولا تُسجَّل نتائج التفاوض للرجوع إليها مستقبلاً.',
          'إطار تفاوض أساسي يحدد مواقف معتمدة مسبقًا وحدود صلاحيات للنقاط التجارية الشائعة؛ والنتائج موثّقة للعقود الكبرى.',
          'دليل تجاري بمواقف احتياطية معتمدة مسبقًا وصلاحيات خطوط حمراء وبروتوكولات تصعيد يُطبَّق باتساق على جميع العقود الجوهرية؛ والنتائج موثّقة مركزيًا.',
          'دليل تجاري شامل بمواقف احتياطية معتمدة مسبقًا ومستويات صلاحية خطوط حمراء وبروتوكولات تصعيد وإرشاد تفاوضي استراتيجي يُطبَّق على جميع العقود الجوهرية؛ والنتائج وتحليل الربح/الخسارة والدروس المستفادة مُلتقَطة مركزيًا وتُغذّي دورة التفاوض التالية.',
        ],
      },
      {
        q: 'How effectively are contract risks — including indemnification clauses, liability exposure, data protection obligations, and regulatory compliance requirements — identified and mitigated before signature?',
        qAr: 'ما مدى فعالية تحديد مخاطر العقد — بما في ذلك بنود التعويض والتعرّض للمسؤولية والتزامات حماية البيانات ومتطلبات الامتثال التنظيمي — والحدّ منها قبل التوقيع؟',
        levels: [
          'Contract risks are not formally assessed before signature. Contracts are signed based on commercial terms alone; legal risks are only identified post-signature when disputes arise.',
          'Legal review occurs for high-value contracts but the scope is narrow; liability caps, indemnification, and data protection clauses are not consistently reviewed for all material agreements.',
          'A pre-signature legal review covers key risk areas (liability, indemnification, IP, data protection) for all contracts above a defined value threshold.',
          'A structured pre-signature risk assessment covers all material risk categories for contracts above threshold; risk findings are resolved before signing, and any accepted risks are documented with management approval.',
          'A mandatory pre-signature risk checklist — covering commercial, legal, data protection, regulatory, and cybersecurity risks — is applied to all material contracts; unresolved risks require written sign-off from legal and the relevant business owner before the contract is executed.',
        ],
        levelsAr: [
          'لا تُقيَّم مخاطر العقد رسميًا قبل التوقيع. تُوقَّع العقود بناءً على البنود التجارية وحدها؛ ولا تُحدَّد المخاطر القانونية إلا بعد التوقيع عند نشوء النزاعات.',
          'تُجرى مراجعة قانونية للعقود عالية القيمة لكن نطاقها ضيّق؛ وسقف المسؤولية والتعويض وبنود حماية البيانات لا تُراجَع باتساق في جميع الاتفاقيات الجوهرية.',
          'مراجعة قانونية قبل التوقيع تغطي مجالات المخاطر الرئيسية (المسؤولية والتعويض والملكية الفكرية وحماية البيانات) لجميع العقود فوق حد قيمي محدد.',
          'تقييم منظم للمخاطر قبل التوقيع يغطي جميع فئات المخاطر الجوهرية للعقود فوق الحد؛ ونتائج المخاطر تُحلّ قبل التوقيع وأي مخاطر مقبولة موثّقة بموافقة الإدارة.',
          'قائمة تحقق إلزامية للمخاطر قبل التوقيع — تغطي المخاطر التجارية والقانونية وحماية البيانات والتنظيمية والأمن السيبراني — تُطبَّق على جميع العقود الجوهرية؛ والمخاطر غير المحلولة تستلزم موافقة خطية من القانونية ومالك الأعمال المعني قبل تنفيذ العقد.',
        ],
      },
    ],
  },

  /* ── 2-1  Obligation & Milestone Tracking ──────────────────────────────── */
  {
    id: 'clm-obligations',
    title: 'Obligation & Milestone Tracking',
    titleAr: 'متابعة الالتزامات والمراحل',
    hint: 'Assesses how consistently contract obligations, SLAs, and delivery milestones are tracked post-signature — and how quickly breaches are identified, escalated, and resolved.',
    hintAr: 'يقيم مدى اتساق متابعة التزامات العقد واتفاقيات مستوى الخدمة ومراحل التسليم بعد التوقيع — وما سرعة تحديد الإخلالات وتصعيدها وحلّها.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.5, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Obligation register or SLA tracking report',
      labelAr: 'سجل الالتزامات أو تقرير متابعة اتفاقية مستوى الخدمة',
      hint: 'Upload an obligation register, SLA monitoring dashboard, or compliance report from a key supplier contract.',
      hintAr: 'ارفع سجل التزامات أو لوحة مراقبة اتفاقية مستوى الخدمة أو تقرير امتثال من عقد مورد رئيسي.',
    },
    questions: [
      {
        q: 'How consistently are contract obligations and SLA commitments tracked post-signature — and how well does the organisation know, in real time, whether key contractual obligations are being met?',
        qAr: 'ما مدى اتساق متابعة التزامات العقد وتعهدات اتفاقيات مستوى الخدمة بعد التوقيع — وما مدى معرفة المؤسسة آنيًا بمدى الوفاء بالالتزامات التعاقدية الرئيسية؟',
        levels: [
          'Contract obligations are largely forgotten once a contract is signed. Supplier SLAs and commitments are never monitored and breaches go undetected until a crisis occurs.',
          'Key obligations are noted at contract signing but monitoring relies on informal follow-up and is inconsistent across contracts and supplier managers.',
          'A basic obligation tracking process captures key SLA milestones and generates alerts for known or imminent breaches for major contracts.',
          'All material obligations are tracked systematically in a central register with defined escalation paths, monthly compliance reports, and documented breach management.',
          'All contract obligations are tracked in real time against supplier performance data, with automated alerts on any breach, a defined multi-level escalation process, and monthly compliance dashboards shared with business stakeholders.',
        ],
        levelsAr: [
          'تُنسى التزامات العقد إلى حد كبير بمجرد توقيعه. اتفاقيات مستوى خدمة الموردين والتعهدات لا تُراقَب وتمرّ الإخلالات دون اكتشاف حتى تقع أزمة.',
          'تُلاحَظ الالتزامات الرئيسية عند التوقيع لكن المراقبة تعتمد على متابعة غير رسمية وغير متسقة عبر العقود ومديري الموردين.',
          'عملية متابعة التزامات أساسية تلتقط مراحل اتفاقيات مستوى الخدمة الرئيسية وتُنشئ تنبيهات للمراحل الوشيكة أو الإخلالات المعروفة للعقود الكبرى.',
          'جميع الالتزامات الجوهرية تُتابَع بشكل منهجي في سجل مركزي بمسارات تصعيد محددة وتقارير امتثال شهرية وإدارة موثّقة للإخلالات.',
          'جميع التزامات العقد تُتابَع آنيًا مقابل بيانات أداء الموردين، بتنبيهات آلية عند أي إخلال وعملية تصعيد متعددة المستويات محددة ولوحات امتثال شهرية تُشارَك مع أصحاب المصلحة في الأعمال.',
        ],
      },
      {
        q: 'How effectively are contract milestone payments, deliverable acceptance, and evidence of completion managed — ensuring the organisation only pays when contractual conditions are met?',
        qAr: 'ما مدى فعالية إدارة مدفوعات مراحل العقد وقبول المستخلصات وإثبات الإنجاز — مما يضمن أن المؤسسة لا تدفع إلا عند استيفاء الشروط التعاقدية؟',
        levels: [
          'Milestone payments are processed based on supplier invoices alone, with no verification that contractual deliverables or acceptance criteria have been met.',
          'Some informal check occurs before major milestone payments but no structured acceptance process, documented sign-off, or link between payment and contractual fulfilment exists.',
          'A defined acceptance process verifies key milestones against contractual deliverables before payment; major milestone sign-offs are documented and retained.',
          'All milestone payments require formal acceptance sign-off against defined criteria, documented evidence of completion, and procurement approval before invoice is released for payment.',
          'A fully documented milestone management process links every payment event to verified deliverable acceptance; acceptance evidence is retained in the contract record; payment is blocked in the system until acceptance is confirmed by the defined authority.',
        ],
        levelsAr: [
          'تُعالَج مدفوعات المراحل بناءً على فواتير الموردين وحدها، دون أي تحقق من استيفاء المستخلصات التعاقدية أو معايير القبول.',
          'يُجرى بعض الفحص غير الرسمي قبل مدفوعات المراحل الكبرى لكن لا توجد عملية قبول منظمة أو توقيع موثّق أو رابط بين الدفع والوفاء التعاقدي.',
          'عملية قبول محددة تتحقق من المراحل الرئيسية مقابل المستخلصات التعاقدية قبل الدفع؛ والتوقيعات على مراحل الإنجاز الكبرى موثّقة ومحفوظة.',
          'جميع مدفوعات المراحل تستلزم توقيع قبول رسمي مقابل معايير محددة وإثبات موثّق للإنجاز وموافقة المشتريات قبل إصدار الفاتورة للدفع.',
          'عملية إدارة مراحل موثّقة بالكامل تربط كل حدث دفع بقبول مستخلصات مُتحقَّق منه؛ وإثبات القبول محفوظ في سجل العقد؛ والدفع محجوب في النظام حتى يُؤكَّد القبول من الجهة المختصة.',
        ],
      },
      {
        q: 'How quickly and consistently are contract breaches identified, escalated, and resolved — including the application of remedy provisions, cure periods, and financial penalties where applicable?',
        qAr: 'ما مدى سرعة واتساق تحديد إخلالات العقود وتصعيدها وحلّها — بما في ذلك تطبيق أحكام التعويض وفترات الإصلاح والغرامات المالية حيثما ينطبق؟',
        levels: [
          'Contract breaches are rarely formally identified or escalated. The organisation tolerates supplier underperformance rather than invoking contractual remedy provisions.',
          'Breaches are sometimes noted informally and raised with the supplier verbally, but remedy provisions are rarely invoked and financial penalties are never applied.',
          'Significant breaches are formally communicated to the supplier in writing, with remedy provisions invoked on a case-by-case basis and corrective action plans requested.',
          'All SLA breaches trigger a defined escalation process; remedy provisions including service credits and cure periods are applied consistently; significant and repeated breaches escalate to commercial review.',
          'A structured breach management process automatically identifies SLA breaches, triggers escalation to the appropriate level within 48 hours, applies remedy provisions, and tracks corrective action to closure; persistent breaches escalate to contract termination review.',
        ],
        levelsAr: [
          'إخلالات العقود نادرًا ما تُحدَّد أو تُصعَّد رسميًا. تتسامح المؤسسة مع ضعف أداء الموردين بدلاً من تفعيل أحكام التعويض التعاقدية.',
          'تُلاحَظ الإخلالات أحيانًا بشكل غير رسمي وتُرفَع شفهيًا للمورد، لكن أحكام التعويض نادرًا ما تُفعَّل والغرامات المالية لا تُطبَّق أبدًا.',
          'الإخلالات الجوهرية تُبلَّغ رسميًا خطيًا للمورد، وأحكام التعويض تُفعَّل حسب كل حالة وتُطلَب خطط إجراءات تصحيحية.',
          'جميع إخلالات اتفاقيات مستوى الخدمة تُطلق عملية تصعيد محددة؛ وأحكام التعويض بما في ذلك ائتمانات الخدمة وفترات الإصلاح تُطبَّق باتساق؛ والإخلالات الجوهرية والمتكررة تُصعَّد إلى مراجعة تجارية.',
          'عملية منظمة لإدارة الإخلالات تُحدّد تلقائيًا إخلالات اتفاقيات مستوى الخدمة وتُطلق التصعيد للمستوى الملائم خلال 48 ساعة وتُطبّق أحكام التعويض وتتابع الإجراءات التصحيحية حتى الإغلاق؛ والإخلالات المستمرة تُصعَّد إلى مراجعة إنهاء العقد.',
        ],
      },
    ],
  },

  /* ── 2-2  Variation & Change Management ────────────────────────────────── */
  {
    id: 'clm-variation',
    title: 'Variation & Change Management',
    titleAr: 'إدارة التعديلات والتغييرات',
    hint: 'Assesses the rigour of the contract change control process — ensuring variations are formally documented, commercially evaluated, and approved before scope or price changes are accepted.',
    hintAr: 'يقيم صرامة عملية ضبط تعديلات العقد — لضمان توثيق التغييرات رسميًا وتقييمها تجاريًا واعتمادها قبل قبول أي تغيير في النطاق أو السعر.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How rigorously is contract change control managed — ensuring all scope, specification, and price changes are formally documented, evaluated, and approved before being accepted?',
        qAr: 'ما مدى صرامة إدارة ضبط تغييرات العقد — لضمان توثيق جميع تغييرات النطاق والمواصفات والسعر رسميًا وتقييمها واعتمادها قبل قبولها؟',
        levels: [
          'No change control process exists. Scope and price changes are agreed informally by phone or email without a formal change order or commercial evaluation.',
          'Some awareness of change control exists but changes are often accepted verbally from suppliers before they are formally evaluated or approved.',
          'A defined change control process requires written change requests and management approval before scope or price changes are accepted; major changes are commercially evaluated.',
          'All contract changes require a formal change order, commercial impact assessment, and approval by the authority defined in the contract before work proceeds or costs are committed.',
          'A rigorous change control process requires a formal change request, full commercial and technical impact assessment, and multi-level authority approval before any change is accepted; all change orders are logged in the contract record with cumulative impact tracked.',
        ],
        levelsAr: [
          'لا توجد عملية لضبط التغييرات. تُوافَق على تغييرات النطاق والسعر بشكل غير رسمي عبر الهاتف أو البريد الإلكتروني دون أمر تغيير رسمي أو تقييم تجاري.',
          'يوجد بعض الوعي بضبط التغييرات لكن التغييرات كثيرًا ما تُقبَل شفهيًا من الموردين قبل تقييمها أو اعتمادها رسميًا.',
          'عملية ضبط تغييرات محددة تستلزم طلبات تغيير خطية وموافقة الإدارة قبل قبول تغييرات النطاق أو السعر؛ والتغييرات الكبرى تُقيَّم تجاريًا.',
          'جميع تغييرات العقد تستلزم أمر تغيير رسمي وتقييم أثر تجاري وموافقة الجهة المختصة المحددة في العقد قبل المضي في العمل أو الالتزام بالتكاليف.',
          'عملية ضبط تغييرات صارمة تستلزم طلب تغيير رسمي وتقييمًا كاملاً للأثر التجاري والتقني وموافقة متعددة المستويات قبل قبول أي تغيير؛ وجميع أوامر التغيير مُسجَّلة في سجل العقد مع تتبّع الأثر التراكمي.',
        ],
      },
      {
        q: 'How effectively does your change management process protect the organisation\'s commercial position — preventing supplier-driven scope creep, gold-plating, and opportunistic repricing?',
        qAr: 'ما مدى فعالية عملية إدارة التغيير لديكم في حماية المركز التجاري للمؤسسة — ومنع التوسّع غير المُبرَّر في النطاق بقيادة المورد والإفراط في التحسينات وإعادة التسعير الانتهازية؟',
        levels: [
          'The organisation routinely accepts supplier-proposed changes without commercial evaluation. Scope creep and opportunistic repricing are commonplace and go unchallenged.',
          'Some commercial pushback occurs on major scope changes, but the organisation lacks the data and processes to reliably evaluate whether supplier claims are justified.',
          'A commercial evaluation process challenges supplier change requests against original scope definitions and market rates before changes are accepted.',
          'A structured commercial evaluation — including scope validation, benchmark pricing, and TCO assessment — is applied to all change requests; unjustified claims are formally rejected with documented rationale.',
          'Change requests are evaluated against a locked scope baseline, market rate benchmarks, and the original commercial model; patterns of excessive change requests are flagged as a supplier performance risk; suppliers with high rates of claimed variations are reviewed at the SRM governance forum.',
        ],
        levelsAr: [
          'تقبل المؤسسة بانتظام التغييرات التي يقترحها الموردون دون تقييم تجاري. التوسّع غير المُبرَّر في النطاق وإعادة التسعير الانتهازية أمر شائع ومرور بدون تحدٍّ.',
          'يحدث بعض الدفع التجاري العكسي في تغييرات النطاق الكبرى، لكن المؤسسة تفتقر إلى البيانات والعمليات اللازمة لتقييم ما إذا كانت مطالبات المورد مُبرَّرة بشكل موثوق.',
          'عملية تقييم تجاري تطعن في طلبات تغيير الموردين مقابل تعريفات النطاق الأصلية وأسعار السوق قبل قبول التغييرات.',
          'تقييم تجاري منظم — يشمل التحقق من النطاق والتسعير المعياري وتقييم TCO — يُطبَّق على جميع طلبات التغيير؛ والمطالبات غير المُبرَّرة تُرفَض رسميًا بمبرر موثّق.',
          'طلبات التغيير تُقيَّم مقابل خط أساس نطاق مُقفَل ومعايير تسعير السوق والنموذج التجاري الأصلي؛ وأنماط طلبات التغيير المفرطة تُبلَّغ كمخاطر أداء موردين؛ والموردون ذوو معدلات ادعاء تعديلات مرتفعة يُراجَعون في منتدى حوكمة SRM.',
        ],
      },
      {
        q: 'How effectively are contract variations documented, priced, and incorporated into the master contract record — ensuring the current version always reflects the agreed commercial position?',
        qAr: 'ما مدى فعالية توثيق تعديلات العقد وتسعيرها ودمجها في سجل العقد الرئيسي — مما يضمن أن النسخة الحالية تعكس دائمًا المركز التجاري المتّفق عليه؟',
        levels: [
          'Variations are agreed verbally or by email and never formally documented. The master contract is not updated and the current agreed position cannot be reconstructed from contract records.',
          'Major variations are occasionally documented in a separate schedule or amendment letter, but the master contract is rarely updated and records are inconsistent.',
          'A defined variation management process requires formal amendment letters for all material changes, which are signed by both parties and filed alongside the master contract.',
          'All variations are formally documented in signed amendment letters, referenced to the change order, and appended to the master contract in the central repository within 10 business days of agreement.',
          'A fully auditable variation management process produces signed variation agreements for all changes, immediately updates the master contract in the CLM system, maintains a complete variation log with cumulative commercial impact, and flags the contract owner when the total variation value exceeds a defined threshold.',
        ],
        levelsAr: [
          'يُوافَق على التعديلات شفهيًا أو بالبريد الإلكتروني ولا تُوثَّق رسميًا أبدًا. لا يُحدَّث العقد الرئيسي ولا يمكن إعادة تكوين المركز المُتّفق عليه الحالي من سجلات العقود.',
          'التعديلات الكبرى تُوثَّق أحيانًا في جدول منفصل أو خطاب تعديل، لكن العقد الرئيسي نادرًا ما يُحدَّث والسجلات غير متسقة.',
          'عملية إدارة تعديلات محددة تستلزم خطابات تعديل رسمية لجميع التغييرات الجوهرية، يوقّع عليها الطرفان وتُودَع إلى جانب العقد الرئيسي.',
          'جميع التعديلات موثّقة رسميًا في خطابات تعديل موقّعة مُشار إليها في أمر التغيير ومُلحَقة بالعقد الرئيسي في المستودع المركزي خلال 10 أيام عمل من الاتفاق.',
          'عملية إدارة تعديلات كاملة التدقيق تُنتج اتفاقيات تعديل موقّعة لجميع التغييرات وتُحدّث العقد الرئيسي فورًا في نظام CLM وتحتفظ بسجل تعديلات كامل بالأثر التجاري التراكمي وتُنبّه مالك العقد عند تجاوز إجمالي قيمة التعديلات حدًا محددًا.',
        ],
      },
    ],
  },

  /* ── 2-3  Renewal & Expiry Management ──────────────────────────────────── */
  {
    id: 'clm-renewal',
    title: 'Renewal & Expiry Management',
    titleAr: 'إدارة التجديد والانتهاء',
    hint: 'Assesses the proactivity and rigour of contract renewal management — including market testing, benchmarking, and applying competitive tension at renewal rather than allowing auto-renewal on existing terms.',
    hintAr: 'يقيم استباقية وصرامة إدارة تجديد العقود — بما في ذلك اختبار السوق والمقارنة المعيارية وتوظيف المنافسة عند التجديد بدلاً من السماح بالتجديد التلقائي وفق البنود القائمة.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How proactively and consistently do you manage the contract renewal pipeline — ensuring all material contracts are reviewed, benchmarked, and renegotiated well before their expiry date?',
        qAr: 'ما مدى استباقيتكم واتساقكم في إدارة مسار تجديد العقود — لضمان مراجعة جميع العقود الجوهرية ومقارنتها معياريًا وإعادة التفاوض عليها قبل تاريخ انتهائها بوقت كافٍ؟',
        levels: [
          'Most contracts auto-renew on existing terms without review. Procurement is not alerted to upcoming renewals until the supplier issues a renewal notice — or the contract has already expired.',
          'Some renewals are reviewed but without consistent lead time, structured market benchmarking, or deliberate use of competitive tension at renewal stage.',
          'A renewals register is maintained with defined review lead times; major renewals are subject to market testing and some negotiation before renewal is agreed.',
          'A rolling 12-month renewal pipeline is actively managed; all significant contracts are reviewed with structured benchmarking, formal negotiation, and competitive tension at least 6 months before expiry.',
          'A rolling 18-month renewal pipeline is managed by procurement; all material contracts undergo formal market benchmarking, a structured sourcing event or negotiation, and executive sign-off before renewal; every renewal is treated as a value recovery opportunity.',
        ],
        levelsAr: [
          'معظم العقود تتجدد تلقائيًا وفق البنود القائمة دون مراجعة. لا تتلقى المشتريات تنبيهات بشأن التجديدات القادمة حتى يُصدر المورد إشعار تجديد — أو حتى تكون مدة العقد قد انقضت بالفعل.',
          'تُراجَع بعض التجديدات لكن دون مهلة زمنية متسقة أو مقارنة معيارية منظمة للسوق أو توظيف متعمَّد للمنافسة في مرحلة التجديد.',
          'يُحفَظ سجل تجديدات بمهل مراجعة محددة؛ والتجديدات الكبرى تخضع لاختبار السوق وبعض التفاوض قبل الموافقة على التجديد.',
          'مسار تجديد متجدد لـ 12 شهرًا يُدار بفاعلية؛ وجميع العقود الجوهرية تُراجَع بمقارنة معيارية منظمة وتفاوض رسمي ومنافسة قبل 6 أشهر على الأقل من الانتهاء.',
          'مسار تجديد متجدد لـ 18 شهرًا تُديره المشتريات؛ وجميع العقود الجوهرية تخضع لمقارنة معيارية رسمية للسوق وحدث توريد منظم أو تفاوض وموافقة تنفيذية قبل التجديد؛ وكل تجديد يُعامَل كفرصة لاسترداد القيمة.',
        ],
      },
      {
        q: 'How effectively do you use market intelligence and competitive benchmarking at renewal to ensure pricing, terms, and service levels remain competitive?',
        qAr: 'ما مدى فعالية استخدامكم لاستخبارات السوق والمقارنة المعيارية التنافسية عند التجديد لضمان بقاء الأسعار والشروط ومستويات الخدمة تنافسية؟',
        levels: [
          'No market testing or benchmarking is conducted at renewal. Contracts are renewed on the supplier\'s proposed terms with no reference to external market pricing or competitor alternatives.',
          'Some informal awareness of market pricing exists (e.g., from trade publications) but it is not formally used to challenge or benchmark supplier renewal proposals.',
          'Market pricing research is conducted before major renewals using published benchmarks or informal market soundings to provide a reference point for negotiation.',
          'Formal market benchmarking — using independent data, third-party surveys, or competitive RFI — is conducted before all significant contract renewals; findings are used to set negotiation targets.',
          'Competitive benchmarking using third-party spend analytics, market intelligence reports, or live competitive RFI/RFQ events is mandated before every material contract renewal; findings are documented and used as the basis for negotiation targets approved by procurement leadership.',
        ],
        levelsAr: [
          'لا يُجرى اختبار سوق أو مقارنة معيارية عند التجديد. تُجدَّد العقود وفق شروط المورد المقترحة دون أي إشارة إلى تسعير السوق الخارجي أو البدائل التنافسية.',
          'يوجد بعض الوعي غير الرسمي بتسعير السوق (مثلًا من المطبوعات التجارية) لكنه لا يُستخدَم رسميًا لتحدي مقترحات تجديد الموردين أو المقارنة المعيارية معها.',
          'تُجرى أبحاث تسعير السوق قبل التجديدات الكبرى باستخدام معايير منشورة أو استطلاعات سوق غير رسمية لتوفير نقطة مرجعية للتفاوض.',
          'مقارنة معيارية رسمية للسوق — باستخدام بيانات مستقلة أو مسوحات من جهات خارجية أو RFI تنافسية — تُجرى قبل جميع تجديدات العقود الجوهرية؛ والنتائج تُستخدَم لتحديد مستهدفات التفاوض.',
          'المقارنة المعيارية التنافسية باستخدام تحليلات إنفاق من جهات خارجية أو تقارير استخبارات سوق أو أحداث RFI/RFQ تنافسية حية تُلزَم بها قبل كل تجديد عقد جوهري؛ والنتائج موثّقة وتُستخدَم كأساس لمستهدفات التفاوض المعتمدة من قيادة المشتريات.',
        ],
      },
      {
        q: 'How well does your organisation prevent value leakage from contracts that run past their expiry date — including ensuring continuity pricing terms and re-procurement timelines are planned in advance?',
        qAr: 'ما مدى جودة منع مؤسستكم لتسرّب القيمة من العقود التي تتجاوز تاريخ انتهائها — بما في ذلك ضمان التخطيط المسبق لأسعار الاستمرارية والجداول الزمنية لإعادة الشراء؟',
        levels: [
          'Contracts routinely expire without a replacement in place, forcing the organisation to continue operating on lapsed terms, accept unfavourable extension pricing, or face supply disruption.',
          'Some awareness of expiry risk exists but action is rarely taken with enough lead time to avoid holdover situations or last-minute renewals on unfavourable terms.',
          'A defined alert process notifies contract owners 90 days before expiry; a basic plan for replacement, renewal, or holdover pricing is documented before expiry.',
          'All contracts above a defined value threshold have a documented renewal or re-sourcing plan in place at least 6 months before expiry; holdover pricing terms are agreed and activated only as a last resort.',
          'A 12-month forward-looking contract expiry report is reviewed monthly by procurement leadership; every material contract has a documented renewal or re-sourcing strategy in place 9 months before expiry; zero contracts expire without a plan in place.',
        ],
        levelsAr: [
          'العقود كثيرًا ما تنتهي دون بديل جاهز، مما يُجبر المؤسسة على الاستمرار وفق بنود منتهية أو قبول أسعار تمديد غير مواتية أو مواجهة انقطاع في الإمداد.',
          'يوجد بعض الوعي بمخاطر الانتهاء لكن نادرًا ما يُتخذ إجراء بمهلة كافية لتجنّب حالات التمديد الاضطراري أو التجديدات اللحظية بشروط غير مواتية.',
          'عملية تنبيه محددة تُخطر مالكي العقود قبل 90 يومًا من الانتهاء؛ وخطة أساسية للاستبدال أو التجديد أو أسعار الاستمرارية موثّقة قبل الانتهاء.',
          'جميع العقود فوق حد قيمي محدد لديها خطة تجديد أو إعادة توريد موثّقة قبل 6 أشهر على الأقل من الانتهاء؛ وأسعار التمديد الاضطراري مُتّفق عليها ولا تُفعَّل إلا كملاذ أخير.',
          'تقرير انتهاء عقود استشرافي لـ 12 شهرًا تُراجَعه قيادة المشتريات شهريًا؛ وكل عقد جوهري لديه استراتيجية تجديد أو إعادة توريد موثّقة قبل 9 أشهر من الانتهاء؛ ولا يوجد عقد ينتهي دون خطة جاهزة.',
        ],
      },
    ],
  },

  /* ── 2-4  Compliance & Audit Trail ─────────────────────────────────────── */
  {
    id: 'clm-compliance',
    title: 'Compliance & Audit Trail',
    titleAr: 'الامتثال ومسار التدقيق',
    hint: 'Assesses how well contract compliance is monitored, how complete the audit trail is across the contract lifecycle, and how effectively regulatory and policy requirements are enforced.',
    hintAr: 'يقيم مدى جودة مراقبة امتثال العقود وشمولية مسار التدقيق عبر دورة حياة العقد وفعالية إنفاذ المتطلبات التنظيمية والسياسات.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.5, other: 1.0,
    },
    evidence: {
      label: 'Compliance report or audit findings',
      labelAr: 'تقرير الامتثال أو نتائج التدقيق',
      hint: 'Upload a compliance monitoring report, internal audit finding, or contract compliance dashboard.',
      hintAr: 'ارفع تقرير مراقبة امتثال أو نتيجة تدقيق داخلي أو لوحة امتثال عقود.',
    },
    questions: [
      {
        q: 'How comprehensively is contract compliance monitored — covering supplier regulatory certifications, insurance requirements, data protection obligations, and export control restrictions?',
        qAr: 'ما مدى شمولية مراقبة امتثال العقود — التي تشمل شهادات الموردين التنظيمية ومتطلبات التأمين والتزامات حماية البيانات وقيود ضوابط التصدير؟',
        levels: [
          'Contract compliance is not monitored. Supplier certifications and regulatory requirements are collected at onboarding and never refreshed, leaving the organisation exposed to lapsed compliance.',
          'Key compliance items (e.g., insurance certificates) are tracked manually for major suppliers, but monitoring is inconsistent and many obligations are missed.',
          'A compliance monitoring process tracks key supplier certifications, insurance, and regulatory requirements for all critical suppliers, with expiry alerts and an annual refresh cycle.',
          'All material compliance obligations — including regulatory certifications, insurance, data protection, and export controls — are tracked systematically for all contracted suppliers, with automated expiry alerts and verified refreshes.',
          'A fully automated compliance monitoring system tracks all contractual and regulatory compliance obligations in real time, triggers alerts 60 days before expiry, blocks payments if compliance lapses, and provides a live compliance dashboard to procurement and legal leadership.',
        ],
        levelsAr: [
          'امتثال العقود لا يُراقَب. تُجمَع شهادات الموردين والمتطلبات التنظيمية عند الضمّ ولا تُحدَّث أبدًا، مما يُعرّض المؤسسة للامتثال المنتهي.',
          'البنود الرئيسية للامتثال (مثل شهادات التأمين) تُتابَع يدويًا للموردين الرئيسيين، لكن المراقبة غير متسقة والتزامات كثيرة تُفوَّت.',
          'عملية مراقبة امتثال تتابع الشهادات الرئيسية للموردين والتأمين والمتطلبات التنظيمية لجميع الموردين الحرجين، بتنبيهات انتهاء ودورة تحديث سنوية.',
          'جميع التزامات الامتثال الجوهرية — بما في ذلك الشهادات التنظيمية والتأمين وحماية البيانات وضوابط التصدير — تُتابَع بشكل منهجي لجميع الموردين المتعاقد معهم، بتنبيهات انتهاء آلية وتجديدات متحقَّق منها.',
          'نظام مراقبة امتثال مؤتَمت بالكامل يتابع جميع التزامات الامتثال التعاقدية والتنظيمية آنيًا ويُطلق تنبيهات قبل 60 يومًا من الانتهاء ويحجب المدفوعات عند انتهاء الامتثال ويوفر لوحة امتثال حية لقيادة المشتريات والقانونية.',
        ],
      },
      {
        q: 'How complete and auditable is your contract management audit trail — including records of approvals, amendments, communications, and performance history for every material contract?',
        qAr: 'ما مدى اكتمال وقابلية تدقيق مسار التدقيق في إدارة العقود لديكم — بما في ذلك سجلات الموافقات والتعديلات والمراسلات وسجل الأداء لكل عقد جوهري؟',
        levels: [
          'No meaningful contract audit trail exists. Records are fragmented across individual email inboxes, paper files, and personal drives — making it impossible to reconstruct the history of a contract.',
          'Some records are retained for major contracts but they are inconsistently filed, incomplete, and not stored in a structured system accessible to all relevant parties.',
          'Key contract documents — original signed contracts, major amendments, and approval emails — are filed in a central shared folder for all significant contracts.',
          'A structured contract management system retains a complete audit trail — including all approvals, amendments, change orders, performance records, and communications — for all material contracts, accessible to authorised users.',
          'A fully auditable CLM system maintains a complete, time-stamped, tamper-evident record of all contract events — from initial draft through to post-expiry retention — for every contract; audit reports can be generated within 24 hours for any contract on request.',
        ],
        levelsAr: [
          'لا يوجد مسار تدقيق ذو معنى لإدارة العقود. السجلات مجزّأة عبر صناديق بريد الأفراد والملفات الورقية والأقراص الشخصية — مما يجعل من المستحيل إعادة تكوين تاريخ العقد.',
          'تُحفَظ بعض السجلات للعقود الكبرى لكنها مُودَعة بشكل غير متسق وغير مكتملة وغير مُخزَّنة في نظام منظم يمكن الوصول إليه من قِبَل جميع الأطراف المعنية.',
          'الوثائق الرئيسية للعقد — العقود الأصلية الموقّعة والتعديلات الكبرى ورسائل الموافقة الإلكترونية — مُودَعة في مجلد مشترك مركزي لجميع العقود الجوهرية.',
          'نظام إدارة عقود منظم يحتفظ بمسار تدقيق كامل — يشمل جميع الموافقات والتعديلات وأوامر التغيير وسجلات الأداء والمراسلات — لجميع العقود الجوهرية، يمكن الوصول إليه من قِبَل المستخدمين المُعتمَدين.',
          'نظام CLM كامل التدقيق يحتفظ بسجل كامل مُختوم بالوقت ومؤمَّن ضد التلاعب لجميع أحداث العقد — من المسودة الأولى حتى الاحتفاظ ما بعد الانتهاء — لكل عقد؛ وتقارير التدقيق يمكن إنشاؤها خلال 24 ساعة لأي عقد عند الطلب.',
        ],
      },
      {
        q: 'How effectively are internal contracting policies and procurement compliance requirements enforced — and how quickly are policy violations identified and remediated?',
        qAr: 'ما مدى فعالية إنفاذ سياسات التعاقد الداخلية ومتطلبات الامتثال في المشتريات — وما سرعة تحديد مخالفات السياسات ومعالجتها؟',
        levels: [
          'Internal contracting policies are documented but not enforced. Policy violations — such as contracts without legal review, unapproved vendors, or missing authority sign-offs — are not tracked or actioned.',
          'Policy violations are occasionally identified during internal reviews or audits, but the response is inconsistent and corrective actions are rarely tracked to completion.',
          'A basic compliance monitoring process identifies common policy violations (e.g., contracts without approval, missing authority sign-offs) and reports these to procurement leadership quarterly.',
          'All procurement compliance obligations are monitored monthly; violations are tracked in a compliance register, assigned to owners for remediation, and reported to procurement and legal leadership with trend analysis.',
          'A real-time compliance monitoring system automatically detects policy violations, triggers immediate alerts to the contract owner and procurement leadership, and tracks remediation to closure; a monthly compliance scorecard is reported to the CPO and reviewed by the audit committee annually.',
        ],
        levelsAr: [
          'سياسات التعاقد الداخلية موثّقة لكنها غير مُنفَّذة. مخالفات السياسات — مثل العقود دون مراجعة قانونية أو الموردين غير المعتمدين أو توقيعات الصلاحيات المفقودة — لا تُتابَع أو يُتخذ بشأنها إجراء.',
          'تُحدَّد مخالفات السياسات أحيانًا خلال المراجعات الداخلية أو عمليات التدقيق، لكن الاستجابة غير متسقة والإجراءات التصحيحية نادرًا ما تُتابَع حتى الإكمال.',
          'عملية مراقبة امتثال أساسية تُحدّد مخالفات السياسات الشائعة (مثل العقود دون موافقة والتوقيعات الصلاحية المفقودة) وترفع تقارير بها لقيادة المشتريات فصليًا.',
          'جميع التزامات الامتثال في المشتريات تُراقَب شهريًا؛ والمخالفات تُتابَع في سجل الامتثال وتُسنَد لمالكين للمعالجة وتُرفَع لقيادة المشتريات والقانونية مع تحليل الاتجاهات.',
          'نظام مراقبة امتثال آني يكتشف آليًا مخالفات السياسات ويُطلق تنبيهات فورية لمالك العقد وقيادة المشتريات ويتابع المعالجة حتى الإغلاق؛ وبطاقة أداء امتثال شهرية تُرفَع للـ CPO وتُراجَع من قِبَل لجنة التدقيق سنويًا.',
        ],
      },
    ],
  },

  /* ── 2-5  CLM Technology & Repository ──────────────────────────────────── */
  {
    id: 'clm-tech',
    title: 'CLM Technology & Repository',
    titleAr: 'تقنية إدارة دورة حياة العقود والمستودع',
    hint: 'Assesses the maturity of CLM technology adoption — from centralised contract repositories through AI-assisted drafting, obligation extraction, and contract analytics.',
    hintAr: 'يقيم نضج اعتماد تقنية إدارة دورة حياة العقود — من مستودعات العقود المركزية حتى الصياغة المدعومة بالذكاء الاصطناعي واستخلاص الالتزامات وتحليلات العقود.',
    benchmarks: { gcc: 1.8, topQuartile: 3.4 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How centralised, searchable, and well-governed is your contract repository — and what percentage of active contracts are stored in a single, controlled location with role-based access?',
        qAr: 'ما مدى مركزية مستودع العقود لديكم وقابليته للبحث وجودة حوكمته — وما نسبة العقود السارية المُخزَّنة في موقع واحد مُتحكَّم به بصلاحيات وصول قائمة على الأدوار؟',
        levels: [
          'Contracts are stored in personal email folders, shared drives, or physical files with no central inventory. The organisation cannot produce a complete list of active contracts.',
          'A shared folder or basic digital storage exists but is incomplete (<50% of active contracts stored), inconsistently maintained, and without access controls or search capability.',
          'A centralised repository holds most (>70%) active contracts with controlled access, basic metadata tagging, and manual expiry reminders.',
          'A structured CLM repository holds 90%+ of active contracts with metadata tagging, automated expiry alerts, full-text search, role-based access, and a complete contract inventory report available on demand.',
          'A fully managed CLM repository holds 100% of active contracts with rich metadata, automated expiry and milestone alerts, full-text search, role-based access, and a live contract inventory report — zero contracts in personal or uncontrolled storage.',
        ],
        levelsAr: [
          'تُخزَّن العقود في مجلدات بريد شخصية أو أقراص مشتركة أو ملفات ورقية دون جرد مركزي. لا تستطيع المؤسسة إنتاج قائمة كاملة بالعقود السارية.',
          'يوجد مجلد مشترك أو تخزين رقمي أساسي لكنه غير مكتمل (أقل من 50% من العقود السارية مُخزَّنة) وغير مُصان باتساق ودون ضوابط وصول أو قدرة بحث.',
          'مستودع مركزي يحتوي على معظم (أكثر من 70%) العقود السارية بوصول مُتحكَّم به ووسم بيانات وصفية أساسي وتذكيرات انتهاء يدوية.',
          'مستودع CLM منظم يحتوي على أكثر من 90% من العقود السارية بوسم بيانات وصفية وتنبيهات انتهاء آلية وبحث نصي كامل ووصول قائم على الأدوار وتقرير جرد عقود كامل متاح عند الطلب.',
          'مستودع CLM مُدار بالكامل يحتوي على 100% من العقود السارية بيانات وصفية غنية وتنبيهات انتهاء ومراحل آلية وبحث نصي كامل ووصول قائم على الأدوار وتقرير جرد عقود حي — دون أي عقود في التخزين الشخصي أو غير المُتحكَّم به.',
        ],
      },
      {
        q: 'How advanced is your CLM technology — and how effectively does it automate obligation extraction, milestone alerts, and SLA monitoring to reduce manual contract management effort?',
        qAr: 'ما مدى تقدّم تقنية إدارة دورة حياة العقود لديكم — وما مدى فعالية أتمتتها لاستخلاص الالتزامات وتنبيهات المراحل ومراقبة اتفاقيات مستوى الخدمة لتقليل جهد إدارة العقود اليدوي؟',
        levels: [
          'No CLM technology is in use. Contract management is entirely manual — tracking obligations, milestones, and renewals via personal calendars, emails, and spreadsheets.',
          'A basic document management system or shared folder stores contracts, but SLA tracking, obligation management, and renewal alerts are all managed manually.',
          'A CLM tool provides a contract repository with basic expiry alerts and milestone reminders; obligation tracking is partially automated but still requires significant manual input.',
          'A CLM platform automates obligation extraction, SLA monitoring, renewal alerts, and compliance reporting; manual contract management effort is reduced by >50% versus a manual process.',
          'An AI-powered CLM platform automates obligation extraction, risk flagging, SLA monitoring, renewal alerts, and contract analytics; manual contract management effort is minimal; AI-assisted drafting reduces contract preparation time by >30%.',
        ],
        levelsAr: [
          'لا تُستخدَم أي تقنية CLM. إدارة العقود يدوية بالكامل — متابعة الالتزامات والمراحل والتجديدات عبر التقويمات الشخصية والبريد الإلكتروني وجداول البيانات.',
          'نظام إدارة وثائق أساسي أو مجلد مشترك يُخزّن العقود، لكن متابعة اتفاقيات مستوى الخدمة وإدارة الالتزامات وتنبيهات التجديد تُدار يدويًا جميعها.',
          'أداة CLM توفر مستودع عقود بتنبيهات انتهاء أساسية وتذكيرات مراحل؛ متابعة الالتزامات مؤتمتة جزئيًا لكنها لا تزال تستلزم مدخلات يدوية جوهرية.',
          'منصة CLM تُؤتمت استخلاص الالتزامات ومراقبة اتفاقيات مستوى الخدمة وتنبيهات التجديد وتقارير الامتثال؛ وجهد إدارة العقود اليدوي منخفض بأكثر من 50% مقارنةً بالعملية اليدوية.',
          'منصة CLM مدعومة بالذكاء الاصطناعي تُؤتمت استخلاص الالتزامات وتبليغ المخاطر ومراقبة اتفاقيات مستوى الخدمة وتنبيهات التجديد وتحليلات العقود؛ وجهد إدارة العقود اليدوي ضئيل؛ والصياغة المدعومة بالذكاء الاصطناعي تُقلّص وقت إعداد العقود بأكثر من 30%.',
        ],
      },
      {
        q: 'How effectively is contract data used as a strategic intelligence source — enabling spend commitment tracking, risk analysis, and sourcing insight from the contract portfolio?',
        qAr: 'ما مدى فعالية استخدام بيانات العقود كمصدر استخباراتي استراتيجي — مما يُمكّن من متابعة التزامات الإنفاق وتحليل المخاطر والرؤى التوريدية من محفظة العقود؟',
        levels: [
          'Contract data is not used for analytics or strategic intelligence. The organisation has no systematic understanding of total contractual commitments, upcoming spend, or portfolio risk.',
          'Some manual analysis is performed periodically (e.g., an annual contract register review) but contract data is not systematically used to inform sourcing or financial decisions.',
          'The contract repository supports basic reporting — contract volume by category, expiry pipeline, and total committed spend — reviewed by procurement leadership at least quarterly.',
          'Contract analytics provide monthly insights into committed spend, risk concentration, expiry pipeline, and SLA performance; findings are used to inform category strategies and financial planning.',
          'A contract intelligence platform provides real-time analytics on committed spend, risk concentration, SLA trends, and supplier dependency across the full contract portfolio; insights are shared monthly with procurement, finance, and legal leadership and used to drive category and risk strategy.',
        ],
        levelsAr: [
          'بيانات العقود لا تُستخدَم للتحليلات أو الاستخبارات الاستراتيجية. ليس لدى المؤسسة فهم منهجي للالتزامات التعاقدية الإجمالية أو الإنفاق القادم أو مخاطر المحفظة.',
          'يُجرى بعض التحليل اليدوي دوريًا (مثل مراجعة سجل العقود السنوية) لكن بيانات العقود لا تُستخدَم منهجيًا لإثراء قرارات التوريد أو المالية.',
          'مستودع العقود يدعم التقارير الأساسية — حجم العقود حسب الفئة ومسار الانتهاء وإجمالي الإنفاق المُلتزَم به — تُراجَعها قيادة المشتريات فصليًا على الأقل.',
          'تحليلات العقود توفر رؤى شهرية حول الإنفاق المُلتزَم به وتركّز المخاطر ومسار الانتهاء وأداء اتفاقيات مستوى الخدمة؛ والنتائج تُستخدَم لإثراء استراتيجيات الفئات والتخطيط المالي.',
          'منصة استخبارات عقود توفر تحليلات آنية للإنفاق المُلتزَم به وتركّز المخاطر واتجاهات اتفاقيات مستوى الخدمة والاعتماد على الموردين عبر محفظة العقود الكاملة؛ والرؤى تُشارَك شهريًا مع قيادة المشتريات والمالية والقانونية وتُستخدَم لتوجيه استراتيجية الفئات والمخاطر.',
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 3 — SUPPLIER RELATIONSHIP MANAGEMENT  (segIdx 3)
   Sub-segments:
     0 Supplier Segmentation           · 1 Onboarding & Pre-qualification
     2 Performance Review Cadence      · 3 Relationship Development
     4 Supplier Development & CAPA     · 5 Strategic Partnership Governance
═══════════════════════════════════════════════════════════════════════════ */

export const SRM_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 3-0  Supplier Segmentation ────────────────────────────────────────── */
  {
    id: 'srm-segmentation',
    title: 'Supplier Segmentation',
    titleAr: 'تقسيم الموردين',
    hint: 'Assesses the rigour and consistency of supplier segmentation — ensuring differentiated management approaches, governance cadences, and investment levels by tier.',
    hintAr: 'يقيم صرامة واتساق تقسيم الموردين — لضمان أساليب إدارة متمايزة ووتيرة حوكمة ومستويات استثمار حسب الفئة.',
    benchmarks: { gcc: 2.1, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supplier segmentation model or tier list',
      labelAr: 'نموذج تقسيم الموردين أو قائمة الفئات',
      hint: 'Upload your supplier segmentation framework, tier definitions, or classified supplier list.',
      hintAr: 'ارفع إطار تقسيم الموردين أو تعريفات الفئات أو قائمة الموردين المُصنَّفة.',
    },
    questions: [
      {
        q: 'How rigorously is your supplier base segmented using a multi-factor model — covering spend, strategic importance, risk exposure, and supply market complexity — with clearly defined tiers and differentiated management approaches?',
        qAr: 'ما مدى صرامة تقسيم قاعدة الموردين لديكم باستخدام نموذج متعدد العوامل — يشمل الإنفاق والأهمية الاستراتيجية والتعرّض للمخاطر وتعقيد سوق التوريد — بفئات محددة بوضوح وأساليب إدارة متمايزة؟',
        levels: [
          'All suppliers are treated identically regardless of spend, strategic importance, or risk profile. No segmentation model exists and management approaches are undifferentiated.',
          'Informal differentiation exists — certain suppliers are "known" as important — but no structured multi-factor segmentation model or documented tier definitions have been applied.',
          'A basic segmentation model (strategic / preferred / approved / transactional) is defined, applied to suppliers above a defined spend threshold, and reviewed annually.',
          'All suppliers above defined spend or risk thresholds are formally segmented using a multi-factor model; tier definitions are clear; each tier has differentiated governance cadences and management investment levels.',
          'The full supplier base is formally segmented using a quantified multi-factor model updated annually; tier definitions and management norms are documented; segmentation drives differentiated investment in SRM programmes, governance intensity, and performance expectations by tier.',
        ],
        levelsAr: [
          'يُعامَل جميع الموردين بشكل متطابق بصرف النظر عن الإنفاق أو الأهمية الاستراتيجية أو ملف المخاطر. لا يوجد نموذج تقسيم وأساليب الإدارة غير متمايزة.',
          'يوجد تمييز غير رسمي — موردون معيّنون "معروفون" بالأهمية — لكن لم يُطبَّق نموذج تقسيم منظم متعدد العوامل أو تعريفات فئات موثّقة.',
          'نموذج تقسيم أساسي (استراتيجي / مفضّل / معتمد / معاملي) محدد ومُطبَّق على الموردين فوق حد إنفاق محدد ويُراجَع سنويًا.',
          'جميع الموردين فوق حدود الإنفاق أو المخاطر المحددة مُقسَّمون رسميًا بنموذج متعدد العوامل؛ وتعريفات الفئات واضحة؛ ولكل فئة وتيرة حوكمة متمايزة ومستوى استثمار إداري.',
          'قاعدة الموردين الكاملة مُقسَّمة رسميًا بنموذج متعدد العوامل مُقيَّم يُحدَّث سنويًا؛ وتعريفات الفئات ومعايير الإدارة موثّقة؛ والتقسيم يقود استثمارًا متمايزًا في برامج SRM وكثافة الحوكمة وتوقعات الأداء حسب الفئة.',
        ],
      },
      {
        q: 'How effectively does supplier segmentation drive differentiated resource allocation — ensuring that strategic suppliers receive dedicated relationship management, while transactional suppliers are managed efficiently?',
        qAr: 'ما مدى فعالية تقسيم الموردين في توجيه تخصيص موارد متمايز — مما يضمن حصول الموردين الاستراتيجيين على إدارة علاقات متخصصة بينما يُدار الموردون المعاملاتيون بكفاءة؟',
        levels: [
          'Resource allocation for supplier management is not driven by segmentation. The most vocal or troublesome suppliers receive attention, not the most strategically important ones.',
          'Some awareness exists that strategic suppliers should receive more attention but there is no structured difference in resources, time, or tools applied across the supplier base.',
          'Strategic suppliers have named relationship managers who invest time in regular engagement; transactional suppliers are managed through automated processes where possible.',
          'Dedicated SRM resources are allocated by tier; strategic suppliers receive dedicated category/relationship managers; preferred suppliers receive quarterly reviews; transactional suppliers are managed through self-service portals.',
          'Segmentation directly determines SRM programme investment by tier; strategic supplier programmes include dedicated executive sponsors, joint business plans, and innovation forums; preferred tier includes structured quarterly reviews; transactional tier is managed through fully automated P2P and catalogue purchasing.',
        ],
        levelsAr: [
          'تخصيص الموارد لإدارة الموردين لا يُقاد بالتقسيم. الموردون الأكثر صوتًا أو إشكالية يتلقون الاهتمام لا الأكثر أهمية استراتيجيًا.',
          'يوجد بعض الوعي بأن الموردين الاستراتيجيين يجب أن يتلقوا مزيدًا من الاهتمام لكن لا يوجد اختلاف منظم في الموارد أو الوقت أو الأدوات المُطبَّقة عبر قاعدة الموردين.',
          'الموردون الاستراتيجيون لديهم مديرو علاقات مُعيَّنون بالاسم يستثمرون الوقت في التفاعل المنتظم؛ والموردون المعاملاتيون يُدارون عبر عمليات مؤتمتة حيثما أمكن.',
          'موارد SRM متفرغة مُخصَّصة حسب الفئة؛ الموردون الاستراتيجيون لديهم مدراء فئات/علاقات متفرغون؛ والموردون المفضّلون يحصلون على مراجعات فصلية؛ والموردون المعاملاتيون يُدارون عبر بوابات الخدمة الذاتية.',
          'التقسيم يحدد مباشرةً استثمار برنامج SRM حسب الفئة؛ برامج الموردين الاستراتيجيين تشمل راعين تنفيذيين متفرغين وخطط أعمال مشتركة ومنتديات ابتكار؛ الفئة المفضّلة تشمل مراجعات فصلية منظمة؛ الفئة المعاملاتية تُدار عبر شراء P2P وكتالوجات مؤتمتة بالكامل.',
        ],
      },
      {
        q: 'How regularly and rigorously is supplier segmentation reviewed and updated — reflecting changes in the supply market, business strategy, supplier performance, or risk profile?',
        qAr: 'ما مدى انتظام وصرامة مراجعة تقسيم الموردين وتحديثه — بما يعكس التغييرات في سوق التوريد واستراتيجية الأعمال وأداء الموردين أو ملف المخاطر؟',
        levels: [
          'Supplier segmentation is never reviewed. The same suppliers remain in the same tiers indefinitely, regardless of changes in spend, performance, or strategic relevance.',
          'Segmentation is reviewed informally when a significant event (e.g., major supplier failure or new category strategy) forces a reassessment — not proactively.',
          'An annual segmentation review is conducted that checks whether current tier placements remain appropriate based on spend, performance, and strategic importance data.',
          'The annual segmentation review uses quantified scoring criteria to assess all suppliers against the segmentation model; tier movements are documented with rationale and communicated to affected relationship managers.',
          'A structured annual segmentation review uses quantified multi-factor scoring to assess all suppliers; tier promotions and demotions are formally approved, communicated to the supplier where appropriate, and reflected in updated SRM programme plans within 30 days of the review.',
        ],
        levelsAr: [
          'تقسيم الموردين لا يُراجَع أبدًا. الموردون ذاتهم يبقون في الفئات ذاتها إلى أجل غير مسمى، بصرف النظر عن التغييرات في الإنفاق أو الأداء أو الأهمية الاستراتيجية.',
          'يُراجَع التقسيم بشكل غير رسمي عند حدوث حدث جوهري (مثل فشل مورد كبير أو استراتيجية فئة جديدة) يُجبر على إعادة التقييم — لا استباقيًا.',
          'مراجعة سنوية للتقسيم تتحقق مما إذا كانت التصنيفات الحالية لا تزال مناسبة بناءً على بيانات الإنفاق والأداء والأهمية الاستراتيجية.',
          'المراجعة السنوية للتقسيم تستخدم معايير تسجيل مُقيَّسة لتقييم جميع الموردين مقابل النموذج؛ وتنقلات الفئات موثّقة بمبرر ومُبلَّغة لمديري العلاقات المعنيين.',
          'مراجعة سنوية منظمة للتقسيم تستخدم تسجيلًا متعدد العوامل مُقيَّسًا لتقييم جميع الموردين؛ وترقيات وتخفيضات الفئات معتمدة رسميًا ومُبلَّغة للمورد حيثما يناسب ومُعكَسة في خطط برنامج SRM المحدَّثة خلال 30 يومًا من المراجعة.',
        ],
      },
    ],
  },

  /* ── 3-1  Onboarding & Pre-qualification ────────────────────────────────── */
  {
    id: 'srm-onboarding',
    title: 'Onboarding & Pre-qualification',
    titleAr: 'ضمّ الموردين والتأهيل المسبق',
    hint: 'Assesses the rigour and consistency of supplier onboarding and pre-qualification — covering financial vetting, ESG compliance, capability assessment, and risk scoring.',
    hintAr: 'يقيم صرامة واتساق ضمّ الموردين والتأهيل المسبق — بما يشمل الفحص المالي والامتثال البيئي والاجتماعي والحوكمي وتقييم القدرات وتسجيل المخاطر.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.5, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supplier onboarding process or qualification checklist',
      labelAr: 'عملية ضمّ الموردين أو قائمة التحقق من التأهيل',
      hint: 'Upload your supplier onboarding process document, pre-qualification checklist, or due diligence questionnaire.',
      hintAr: 'ارفع وثيقة عملية ضمّ الموردين أو قائمة التحقق من التأهيل المسبق أو استبيان العناية الواجبة.',
    },
    questions: [
      {
        q: 'How rigorous and consistently applied is your supplier pre-qualification process — covering financial health, legal standing, ESG compliance, operational capability, and risk scoring before a supplier is approved?',
        qAr: 'ما مدى صرامة عملية التأهيل المسبق للموردين لديكم واتساق تطبيقها — بما تشمل السلامة المالية والوضع القانوني والامتثال البيئي والاجتماعي والحوكمي والقدرات التشغيلية وتسجيل المخاطر قبل اعتماد المورد؟',
        levels: [
          'Supplier onboarding is entirely informal. New suppliers are added to the approved list without any formal qualification, vetting, financial check, or risk assessment.',
          'A basic qualification checklist exists but is applied inconsistently; financial vetting is minimal and ESG compliance, operational capacity, and risk scoring are not assessed.',
          'A structured onboarding process covers legal, financial, and quality requirements for all new suppliers above a defined spend threshold, with documented sign-off.',
          'All new suppliers above a defined threshold complete a comprehensive qualification covering financial health, ESG compliance, operational capacity, and risk scoring before receiving approved status.',
          'A gated pre-qualification process — covering financial health, ESG compliance, operational capacity, cybersecurity posture, and risk scoring — is mandatory for all new suppliers; approvals require cross-functional sign-off; qualification data is refreshed periodically based on risk tier.',
        ],
        levelsAr: [
          'ضمّ الموردين غير رسمي بالكامل. يُضاف الموردون الجدد لقائمة المعتمدين دون أي تأهيل رسمي أو فحص أو تحقق مالي أو تقييم مخاطر.',
          'توجد قائمة تحقق تأهيل أساسية لكنها تُطبَّق بشكل غير متسق؛ والتحقق المالي شحيح ولا يُقيَّم الامتثال البيئي والاجتماعي والحوكمي أو الطاقة التشغيلية أو تسجيل المخاطر.',
          'عملية ضمّ منظمة تغطي المتطلبات القانونية والمالية والجودة لجميع الموردين الجدد فوق حد إنفاق محدد، بتوقيعات موثّقة.',
          'جميع الموردين الجدد فوق حد محدد يُكملون تأهيلاً شاملاً يغطي السلامة المالية والامتثال البيئي والاجتماعي والحوكمي والطاقة التشغيلية وتسجيل المخاطر قبل الحصول على صفة المورد المعتمد.',
          'عملية تأهيل مسبق ذات بوابات — تغطي السلامة المالية والامتثال البيئي والاجتماعي والحوكمي والطاقة التشغيلية ووضع الأمن السيبراني وتسجيل المخاطر — إلزامية لجميع الموردين الجدد؛ والاعتمادات تستلزم موافقة متعددة الوظائف؛ وبيانات التأهيل تُحدَّث دوريًا بناءً على فئة المخاطر.',
        ],
      },
      {
        q: 'How effectively does your supplier onboarding process set up new suppliers for success — including system integration, documentation handover, performance baseline, and relationship introduction?',
        qAr: 'ما مدى فعالية عملية ضمّ الموردين في تهيئة الموردين الجدد للنجاح — بما في ذلك تكامل النظام ونقل الوثائق وتأسيس مرجعية الأداء وتعارف العلاقة؟',
        levels: [
          'Onboarding ends with system setup and purchase order issuance. No structured handover, performance baseline, or relationship introduction is provided to new suppliers.',
          'Some basic setup is completed (e.g., supplier master data in ERP) but new suppliers are largely left to navigate requirements independently with no structured support.',
          'A structured onboarding checklist covers system setup, document collection, initial performance expectations, and an introductory meeting with the key relationship owner.',
          'A formal onboarding programme provides new suppliers with a structured introduction — covering commercial terms, performance expectations, communication channels, KPI baseline, and system access — within 30 days of award.',
          'A comprehensive onboarding programme provides all new suppliers with a structured 60-day activation plan covering commercial terms, performance KPIs, system integration, compliance requirements, contact directory, and an introductory executive meeting — tracked to completion before the first live order.',
        ],
        levelsAr: [
          'الضمّ ينتهي بإعداد النظام وإصدار طلب الشراء. لا يُقدَّم للموردين الجدد تسليم منظم أو مرجعية أداء أو تعارف علاقة.',
          'يُنجَز بعض الإعداد الأساسي (مثل بيانات المورد الرئيسية في ERP) لكن الموردين الجدد يُتركون إلى حد كبير للتعامل مع المتطلبات بشكل مستقل دون دعم منظم.',
          'قائمة تحقق ضمّ منظمة تغطي إعداد النظام وجمع الوثائق وتوقعات الأداء الأولية واجتماعًا تعريفيًا مع مالك العلاقة الرئيسي.',
          'برنامج ضمّ رسمي يُزوّد الموردين الجدد بتعارف منظم — يغطي الشروط التجارية وتوقعات الأداء وقنوات التواصل ومرجعية مؤشر الأداء وصلاحية الوصول للنظام — في غضون 30 يومًا من الترسية.',
          'برنامج ضمّ شامل يُزوّد جميع الموردين الجدد بخطة تفعيل منظمة لـ 60 يومًا تغطي الشروط التجارية ومؤشرات الأداء وتكامل النظام ومتطلبات الامتثال ودليل جهات الاتصال واجتماعًا تنفيذيًا تعريفيًا — يُتابَع حتى الإكمال قبل أول طلب حي.',
        ],
      },
      {
        q: 'How well-defined and consistently applied is your supplier exit process — ensuring that supplier deactivation, data handling, transition planning, and obligation settlement are managed in an orderly way?',
        qAr: 'ما مدى وضوح عملية إنهاء التعاقد مع الموردين واتساق تطبيقها — مما يضمن إدارة إلغاء تنشيط المورد ومعالجة البيانات والتخطيط للانتقال وتسوية الالتزامات بطريقة منظمة؟',
        levels: [
          'No formal supplier exit process exists. When a supplier relationship ends, it happens informally and ad-hoc — often leaving open purchase orders, unresolved obligations, or unmanaged data.',
          'Supplier deactivation from the ERP system occurs eventually, but there is no structured checklist for obligation settlement, data handling, or transition management.',
          'A basic supplier exit process covers ERP deactivation, open purchase order management, and documentation archiving, with management sign-off required.',
          'A structured exit process covers obligation settlement, transition planning to replacement supplier, data handling, access revocation, and a formal exit review — with documented sign-off before deactivation.',
          'A fully documented supplier exit protocol manages obligation settlement, data handling, access revocation, transition to replacement supplier, final performance review, and lessons-learned capture — all tracked against a formal exit checklist before the supplier is deactivated in all systems.',
        ],
        levelsAr: [
          'لا توجد عملية رسمية لإنهاء التعاقد مع المورد. عند انتهاء علاقة المورد، تحدث بشكل غير رسمي وارتجالي — كثيرًا ما تترك طلبات شراء مفتوحة أو التزامات غير محلولة أو بيانات غير مُدارة.',
          'إلغاء تنشيط المورد من نظام ERP يحدث في نهاية المطاف، لكن لا توجد قائمة تحقق منظمة لتسوية الالتزامات أو معالجة البيانات أو إدارة الانتقال.',
          'عملية خروج أساسية تغطي إلغاء التنشيط في ERP وإدارة طلبات الشراء المفتوحة وأرشفة الوثائق، بموافقة الإدارة المطلوبة.',
          'عملية خروج منظمة تغطي تسوية الالتزامات والتخطيط للانتقال لمورد بديل ومعالجة البيانات وإلغاء الوصول ومراجعة خروج رسمية — بتوقيع موثّق قبل إلغاء التنشيط.',
          'بروتوكول خروج موردين موثّق بالكامل يُدير تسوية الالتزامات ومعالجة البيانات وإلغاء الوصول والانتقال لمورد بديل ومراجعة أداء ختامية والتقاط الدروس المستفادة — كل ذلك يُتابَع مقابل قائمة تحقق خروج رسمية قبل إلغاء تنشيط المورد في جميع الأنظمة.',
        ],
      },
    ],
  },

  /* ── 3-2  Performance Review Cadence ───────────────────────────────────── */
  {
    id: 'srm-reviews',
    title: 'Performance Review Cadence',
    titleAr: 'وتيرة مراجعات الأداء',
    hint: 'Assesses the regularity, rigour, and bilateral quality of supplier performance reviews — including scorecard completeness, two-way feedback, and action plan tracking.',
    hintAr: 'يقيم انتظام وصرامة وجودة مراجعات أداء الموردين الثنائية — بما في ذلك اكتمال بطاقة الأداء والتغذية الراجعة الثنائية ومتابعة خطط الإجراءات.',
    benchmarks: { gcc: 2.1, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supplier scorecard or performance review report',
      labelAr: 'بطاقة أداء المورد أو تقرير مراجعة الأداء',
      hint: 'Upload a completed supplier scorecard or quarterly business review pack for a strategic supplier.',
      hintAr: 'ارفع بطاقة أداء مورد مُكتملة أو حزمة مراجعة أعمال فصلية لمورد استراتيجي.',
    },
    questions: [
      {
        q: 'How regularly and formally do you conduct structured, two-way performance reviews with strategic and preferred suppliers — using balanced scorecards covering quality, delivery, commercial, and relationship dimensions?',
        qAr: 'ما مدى انتظام ورسمية إجراء مراجعات أداء منظمة ثنائية الاتجاه مع الموردين الاستراتيجيين والمفضّلين — باستخدام بطاقات أداء متوازنة تغطي أبعاد الجودة والتسليم والجوانب التجارية والعلاقة؟',
        levels: [
          'Supplier performance is never formally reviewed. Issues are only addressed reactively when they escalate to operational crises or contract disputes.',
          'Informal feedback is provided to some suppliers occasionally, but without structured scorecards, defined meeting cadence, or documented outputs.',
          'Structured performance reviews occur at least annually for strategic suppliers using defined metrics covering quality, delivery, and commercial performance.',
          'Quarterly performance reviews with balanced scorecards covering quality, delivery, commercial, ESG, and relationship dimensions are conducted for all strategic and preferred suppliers, with improvement action plans tracked to closure.',
          'Strategic suppliers receive quarterly formal reviews with balanced scorecards, executive sponsorship, bilateral feedback (supplier rates the customer too), improvement action plans with defined timelines, and outcomes shared with the supplier in writing after each review.',
        ],
        levelsAr: [
          'أداء الموردين لا يُراجَع رسميًا أبدًا. المشكلات تُعالَج بشكل تفاعلي فقط عند تصاعدها إلى أزمات تشغيلية أو نزاعات تعاقدية.',
          'تُقدَّم تغذية راجعة غير رسمية لبعض الموردين أحيانًا، لكن دون بطاقات أداء منظمة أو وتيرة اجتماعات محددة أو مخرجات موثّقة.',
          'مراجعات أداء منظمة تُجرى سنويًا على الأقل للموردين الاستراتيجيين باستخدام مقاييس محددة تغطي الجودة والتسليم والأداء التجاري.',
          'مراجعات أداء فصلية ببطاقات أداء متوازنة تغطي الجودة والتسليم والجوانب التجارية والمعايير البيئية والاجتماعية والحوكمية وأبعاد العلاقة تُجرى لجميع الموردين الاستراتيجيين والمفضّلين، مع متابعة خطط تحسين حتى الإغلاق.',
          'الموردون الاستراتيجيون يحصلون على مراجعات رسمية فصلية ببطاقات أداء متوازنة ورعاية تنفيذية وتغذية راجعة ثنائية (المورد يُقيّم العميل أيضًا) وخطط تحسين بجداول زمنية محددة ونتائج تُشارَك مع المورد خطيًا بعد كل مراجعة.',
        ],
      },
      {
        q: 'How well are supplier performance improvement action plans tracked, managed, and verified for effectiveness — and how quickly are recurring performance issues escalated?',
        qAr: 'ما مدى جودة متابعة وإدارة والتحقق من فعالية خطط تحسين أداء الموردين — وما سرعة تصعيد مشكلات الأداء المتكررة؟',
        levels: [
          'Supplier performance improvement plans are not tracked. Agreed actions are rarely followed up and the same supplier underperformance issues recur without resolution.',
          'Some improvement actions are agreed verbally but are not formally tracked, and there is no defined escalation process for suppliers who repeatedly miss targets.',
          'Improvement action plans are documented and tracked in the next quarterly review; suppliers who miss targets in two consecutive reviews are flagged for escalation.',
          'All improvement actions are tracked in a central SRM system with defined owners, due dates, and verification criteria; actions overdue by 30 days trigger automatic escalation to the category manager.',
          'A structured performance improvement management process tracks all actions in a central SRM platform with real-time dashboards; overdue or inadequate improvement actions automatically escalate to the appropriate leadership level; suppliers with persistent underperformance enter a formal remediation or exit process.',
        ],
        levelsAr: [
          'خطط تحسين أداء الموردين لا تُتابَع. الإجراءات المتفق عليها نادرًا ما يُتابَع تنفيذها ومشكلات ضعف أداء الموردين ذاتها تتكرر دون حل.',
          'بعض إجراءات التحسين تُتّفق عليها شفهيًا لكنها لا تُتابَع رسميًا، ولا توجد عملية تصعيد محددة للموردين الذين يفشلون بشكل متكرر في تحقيق الأهداف.',
          'خطط إجراءات التحسين موثّقة ومتابَعة في المراجعة الفصلية التالية؛ والموردون الذين يفشلون في المستهدفات في مراجعتين متتاليتين يُبلَّغ عنهم للتصعيد.',
          'جميع إجراءات التحسين تُتابَع في نظام SRM مركزي بمالكين ومواعيد استحقاق ومعايير تحقق محددة؛ والإجراءات المتأخرة 30 يومًا تُطلق تصعيدًا آليًا لمدير الفئة.',
          'عملية إدارة منظمة لتحسين الأداء تتابع جميع الإجراءات في منصة SRM مركزية بلوحات معلومات آنية؛ والإجراءات المتأخرة أو غير الكافية تُصعَّد آليًا للمستوى القيادي المناسب؛ والموردون ذوو الأداء الضعيف المستمر يدخلون عملية إصلاح رسمية أو خروج.',
        ],
      },
      {
        q: 'How effectively does your performance review process use data-driven scorecards — drawing from ERP, quality systems, and logistics platforms — rather than relying on subjective assessments?',
        qAr: 'ما مدى فعالية عملية مراجعة الأداء لديكم في استخدام بطاقات أداء قائمة على البيانات — مُستمَدة من ERP وأنظمة الجودة ومنصات الخدمات اللوجستية — بدلاً من الاعتماد على التقييمات الذاتية؟',
        levels: [
          'Supplier performance reviews are based entirely on the subjective opinions of the buyer or category manager. No objective data, system-generated metrics, or KPI evidence is used.',
          'Some data (e.g., on-time delivery rates from ERP) is occasionally referenced but scorecard inputs remain predominantly subjective and manually compiled.',
          'Key scorecard metrics are drawn from system data (ERP, quality, logistics) for most significant suppliers; some metrics still require manual data collection.',
          'Supplier scorecards are predominantly data-driven, with most metrics automatically populated from integrated systems; data quality is reviewed before each scorecard is issued.',
          'Supplier scorecards are fully automated and data-driven — all metrics populated from integrated ERP, quality, logistics, and financial systems; data is refreshed in real time; scorecard generation requires minimal manual effort; suppliers can view their own scorecard data through a self-service portal.',
        ],
        levelsAr: [
          'مراجعات أداء الموردين تستند كليًا إلى الآراء الذاتية للمشتري أو مدير الفئة. لا تُستخدَم بيانات موضوعية أو مقاييس مُولَّدة من النظام أو أدلة مؤشرات أداء.',
          'بعض البيانات (مثل معدلات التسليم في الوقت من ERP) تُستخدَم أحيانًا كمرجع لكن مدخلات بطاقة الأداء تبقى ذاتية في معظمها ومُجمَّعة يدويًا.',
          'المقاييس الرئيسية لبطاقة الأداء مُستمَدة من بيانات النظام (ERP والجودة والخدمات اللوجستية) لمعظم الموردين الجوهريين؛ وبعض المقاييس لا تزال تستلزم جمع بيانات يدوي.',
          'بطاقات أداء الموردين قائمة على البيانات في معظمها، مع معظم المقاييس مُعبَّأة آليًا من أنظمة متكاملة؛ وجودة البيانات تُراجَع قبل إصدار كل بطاقة.',
          'بطاقات أداء الموردين مؤتمتة بالكامل وقائمة على البيانات — جميع المقاييس مُعبَّأة من أنظمة ERP والجودة والخدمات اللوجستية والمالية المتكاملة؛ والبيانات تُحدَّث آنيًا؛ وإنشاء بطاقة الأداء يستلزم أدنى جهد يدوي؛ والموردون يمكنهم الاطلاع على بيانات بطاقة أدائهم عبر بوابة الخدمة الذاتية.',
        ],
      },
    ],
  },

  /* ── 3-3  Relationship Development ──────────────────────────────────────── */
  {
    id: 'srm-relationship',
    title: 'Relationship Development',
    titleAr: 'تطوير العلاقات',
    hint: 'Assesses the depth and quality of the relationship with strategic suppliers — including executive sponsorship, joint business planning, and trust-building beyond transactional interactions.',
    hintAr: 'يقيم عمق وجودة العلاقة مع الموردين الاستراتيجيين — بما في ذلك الرعاية التنفيذية والتخطيط المشترك للأعمال وبناء الثقة بما يتجاوز التفاعلات المعاملية.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How effectively do you invest in building strategic supplier relationships beyond transactional interactions — including senior executive engagement, relationship health assessments, and joint agenda-setting?',
        qAr: 'ما مدى فعالية استثماركم في بناء علاقات الموردين الاستراتيجيين بما يتجاوز التفاعلات المعاملية — بما في ذلك مشاركة كبار المديرين التنفيذيين وتقييم صحة العلاقة وتحديد الأجندة المشتركة؟',
        levels: [
          'Supplier relationships are purely transactional and commercial. Contact with suppliers occurs only when there is a problem, a purchase order, or a contract renewal.',
          'Some informal relationship-building occurs at operational level (e.g., regular site visits or ad-hoc calls) but strategic supplier relationships are not managed with executive engagement or structured investment.',
          'Strategic suppliers have named relationship owners who proactively maintain regular contact and escalate issues before they become crises; annual executive meetings occur for top strategic suppliers.',
          'Strategic supplier relationships are actively managed with quarterly executive-level contact, annual relationship health assessments, and a joint agenda covering commercial, operational, and strategic topics.',
          'Strategic supplier relationships are managed through a structured programme including executive sponsors on both sides, bilateral annual relationship reviews, a joint relationship improvement plan, and regular structured engagement beyond commercial transactions.',
        ],
        levelsAr: [
          'علاقات الموردين معاملية وتجارية بحتة. التواصل مع الموردين يحدث فقط عند وجود مشكلة أو طلب شراء أو تجديد عقد.',
          'يحدث بعض بناء العلاقات غير الرسمي على المستوى التشغيلي (مثل الزيارات الموقعية المنتظمة أو المكالمات الارتجالية) لكن علاقات الموردين الاستراتيجيين لا تُدار بمشاركة تنفيذية أو استثمار منظم.',
          'الموردون الاستراتيجيون لديهم مالكو علاقات مُعيَّنون بالاسم يحتفظون استباقيًا بتواصل منتظم ويُصعّدون المشكلات قبل تحوّلها لأزمات؛ واجتماعات تنفيذية سنوية تعقد لأبرز الموردين الاستراتيجيين.',
          'علاقات الموردين الاستراتيجيين تُدار بفاعلية بتواصل تنفيذي فصلي وتقييمات سنوية لصحة العلاقة وأجندة مشتركة تغطي موضوعات تجارية وتشغيلية واستراتيجية.',
          'علاقات الموردين الاستراتيجيين تُدار عبر برنامج منظم يشمل راعين تنفيذيين من كلا الجانبين ومراجعات علاقة سنوية ثنائية وخطة مشتركة لتحسين العلاقة وتفاعلًا منظمًا منتظمًا يتجاوز المعاملات التجارية.',
        ],
      },
      {
        q: 'How mature and structured is your joint business planning process with strategic suppliers — including shared objectives, co-investment commitments, and bilateral performance targets?',
        qAr: 'ما مدى نضج وتنظيم عملية التخطيط المشترك للأعمال مع الموردين الاستراتيجيين — بما في ذلك الأهداف المشتركة والتزامات الاستثمار المشترك والمستهدفات الثنائية للأداء؟',
        levels: [
          'No joint business planning exists with any supplier. Commercial interactions are entirely reactive and transactional with no shared forward-looking agenda.',
          'Some informal discussions about future plans occur with key suppliers, but they are ad-hoc, not documented, and produce no joint commitments or shared objectives.',
          'Annual joint business plans are established with the top 5 strategic suppliers, covering shared commercial objectives, key service and quality targets, and defined improvement initiatives.',
          'Formal joint business plans with all strategic suppliers include shared objectives, co-investment commitments, bilateral performance targets, and a joint governance review at least annually.',
          'All strategic suppliers have a comprehensive annual joint business plan reviewed quarterly at executive level; plans include bilateral objectives, co-investment commitments, innovation streams, and a formal mid-year health check — with progress tracked and published to both parties.',
        ],
        levelsAr: [
          'لا يوجد تخطيط مشترك للأعمال مع أي مورد. التفاعلات التجارية معاملية وتفاعلية بالكامل دون أجندة مستقبلية مشتركة.',
          'تحدث بعض النقاشات غير الرسمية حول الخطط المستقبلية مع الموردين الرئيسيين، لكنها ارتجالية وغير موثّقة ولا تُنتج التزامات مشتركة أو أهدافًا مشتركة.',
          'خطط أعمال مشتركة سنوية تُرسَى مع أبرز 5 موردين استراتيجيين، تغطي الأهداف التجارية المشتركة ومستهدفات الخدمة والجودة الرئيسية والمبادرات التحسينية المحددة.',
          'خطط أعمال مشتركة رسمية مع جميع الموردين الاستراتيجيين تتضمن أهدافًا مشتركة والتزامات استثمار مشترك ومستهدفات أداء ثنائية ومراجعة حوكمة مشتركة سنويًا على الأقل.',
          'جميع الموردين الاستراتيجيين لديهم خطة أعمال مشتركة سنوية شاملة تُراجَع فصليًا على المستوى التنفيذي؛ تتضمن الخطط أهدافًا ثنائية والتزامات استثمار مشترك ومسارات ابتكار وفحصًا صحيًا رسميًا في منتصف العام — مع متابعة التقدم ونشره للطرفين.',
        ],
      },
      {
        q: 'How actively do you solicit and act on supplier feedback about the quality of your organisation as a customer — including payment reliability, communication clarity, and commercial fairness?',
        qAr: 'ما مدى فاعلية استطلاع ملاحظات الموردين حول جودة مؤسستكم كعميل — بما في ذلك موثوقية الدفع ووضوح التواصل والإنصاف التجاري — والتصرف بناءً عليها؟',
        levels: [
          'Supplier feedback is never solicited. The organisation views the supply relationship as one-directional and has no mechanism to receive or act on supplier views.',
          'Informal supplier feedback is occasionally received during operational interactions but is not structured, recorded, or acted upon systematically.',
          'An annual supplier satisfaction survey is conducted for strategic suppliers; results are reviewed by procurement leadership and any significant issues are escalated.',
          'A structured annual supplier satisfaction survey covers payment reliability, communication, commercial fairness, and relationship quality; results are benchmarked year-on-year and actioned improvement plans are communicated back to suppliers.',
          'An annual bilateral relationship review — where the supplier formally rates the organisation as a customer — is a standard part of the SRM programme for all strategic suppliers; findings are reviewed at executive level, improvement actions are agreed bilaterally, and progress is tracked over the following year.',
        ],
        levelsAr: [
          'لا يُستطلَع أبدًا رأي الموردين. المؤسسة تنظر للعلاقة مع الموردين باعتبارها أحادية الاتجاه وليس لديها آلية لتلقّي آراء الموردين أو التصرف بناءً عليها.',
          'تغذية راجعة غير رسمية من الموردين تُتلقّى أحيانًا خلال التفاعلات التشغيلية لكنها غير منظمة وغير مُسجَّلة وغير مُتصرَّف بها بشكل منهجي.',
          'استطلاع سنوي لرضا الموردين يُجرى للموردين الاستراتيجيين؛ والنتائج تُراجَع من قيادة المشتريات وأي مشكلات جوهرية تُصعَّد.',
          'استطلاع سنوي منظم لرضا الموردين يغطي موثوقية الدفع والتواصل والإنصاف التجاري وجودة العلاقة؛ والنتائج تُقارَن معياريًا بين الأعوام وخطط التحسين المُتصرَّف بها تُبلَّغ للموردين.',
          'مراجعة علاقة ثنائية سنوية — يُقيّم فيها المورد رسميًا المؤسسة كعميل — جزء معياري من برنامج SRM لجميع الموردين الاستراتيجيين؛ والنتائج تُراجَع على المستوى التنفيذي وإجراءات التحسين تُتّفق عليها بشكل ثنائي والتقدم يُتابَع خلال العام التالي.',
        ],
      },
    ],
  },

  /* ── 3-4  Supplier Development & Corrective Action ─────────────────────── */
  {
    id: 'srm-development',
    title: 'Supplier Development & Corrective Action',
    titleAr: 'تطوير الموردين والإجراءات التصحيحية',
    hint: 'Assesses the maturity of proactive supplier development programmes and corrective action processes — going beyond performance monitoring to actively investing in supplier capability improvement.',
    hintAr: 'يقيم نضج برامج تطوير الموردين الاستباقية وعمليات الإجراءات التصحيحية — ما يتجاوز مراقبة الأداء للاستثمار الفعلي في تحسين قدرات المورد.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How proactively do you invest in developing the capabilities of strategic suppliers — including technical support, process audits, training, and joint improvement projects — beyond simply managing performance?',
        qAr: 'ما مدى استباقيتكم في الاستثمار في تطوير قدرات الموردين الاستراتيجيين — بما في ذلك الدعم التقني وعمليات التدقيق وبرامج التدريب والمشاريع التحسينية المشتركة — بما يتجاوز مجرد إدارة الأداء؟',
        levels: [
          'Supplier development is not practised. When a supplier underperforms, the organisation\'s only response is to raise complaints or consider switching suppliers.',
          'Some informal guidance or feedback is provided to struggling suppliers, but no structured development programmes, resources, or investment are committed.',
          'Supplier development is provided reactively to underperforming critical suppliers — including process reviews, corrective action plans, and technical assistance on an ad-hoc basis.',
          'Proactive supplier development programmes are in place for strategic suppliers, including planned capability assessments, targeted improvement projects, and defined investment commitments.',
          'A structured supplier development programme offers all strategic suppliers an annual capability assessment, co-funded improvement initiatives, and access to technical resources; development ROI is tracked and reported to the procurement governance board annually.',
        ],
        levelsAr: [
          'تطوير الموردين لا يُمارَس. عند ضعف أداء مورد، الاستجابة الوحيدة للمؤسسة هي رفع الشكاوى أو النظر في تغيير الموردين.',
          'يُقدَّم بعض التوجيه أو التغذية الراجعة غير الرسمية للموردين المتعثرين، لكن لا توجد برامج تطوير منظمة أو موارد أو استثمارات مُلتزَم بها.',
          'يُقدَّم تطوير الموردين بشكل تفاعلي للموردين الحرجين ضعيفي الأداء — بما في ذلك مراجعات العمليات وخطط الإجراءات التصحيحية والمساعدة التقنية بشكل ارتجالي.',
          'برامج تطوير موردين استباقية قائمة للموردين الاستراتيجيين، تشمل تقييمات قدرات مُخطَّطة ومشاريع تحسين مستهدفة والتزامات استثمار محددة.',
          'برنامج تطوير موردين منظم يُقدّم لجميع الموردين الاستراتيجيين تقييمًا سنويًا للقدرات ومبادرات تحسين مشتركة التمويل والوصول لموارد تقنية؛ وعائد استثمار التطوير يُتابَع ويُرفَع لمجلس حوكمة المشتريات سنويًا.',
        ],
      },
      {
        q: 'How structured and rigorous is your Corrective Action and Preventive Action (CAPA) process for addressing quality failures, delivery misses, and compliance breaches with suppliers?',
        qAr: 'ما مدى تنظيم وصرامة عملية الإجراءات التصحيحية والوقائية (CAPA) لمعالجة إخفاقات الجودة وتأخيرات التسليم وإخلالات الامتثال لدى الموردين؟',
        levels: [
          'No formal CAPA process exists. Quality failures and delivery issues are managed informally through conversations with the supplier, with no documentation or systematic tracking.',
          'Corrective action requests are raised with suppliers for significant issues, but the process is informal, response is inconsistent, and root-cause analysis is rarely required.',
          'A formal CAPA process requires suppliers to submit root-cause analysis and corrective action plans for significant quality failures within a defined timeframe.',
          'A rigorous CAPA process requires a formal root-cause analysis, verified corrective action plan, and evidence of effectiveness for all quality or delivery failures above defined thresholds — tracked to closure.',
          'A fully documented CAPA process requires suppliers to complete an 8D or equivalent root-cause analysis, submit a corrective action plan within defined SLAs, provide implementation evidence, and verify effectiveness over a defined monitoring period; persistent CAPA failures escalate to contract review.',
        ],
        levelsAr: [
          'لا توجد عملية CAPA رسمية. إخفاقات الجودة ومشكلات التسليم تُدار بشكل غير رسمي من خلال المحادثات مع المورد، دون توثيق أو متابعة منهجية.',
          'طلبات الإجراءات التصحيحية تُرفَع للموردين في حالات جوهرية، لكن العملية غير رسمية والاستجابة غير متسقة وتحليل السبب الجذري نادرًا ما يُطلَب.',
          'عملية CAPA رسمية تُلزم الموردين بتقديم تحليل السبب الجذري وخطط الإجراءات التصحيحية لإخفاقات الجودة الجوهرية خلال إطار زمني محدد.',
          'عملية CAPA صارمة تستلزم تحليلاً رسميًا للسبب الجذري وخطة إجراءات تصحيحية متحقَّق منها وإثباتًا للفعالية لجميع إخفاقات الجودة أو التسليم فوق حدود محددة — مُتابَعة حتى الإغلاق.',
          'عملية CAPA موثّقة بالكامل تُلزم الموردين بإكمال تحليل 8D أو ما يعادله وتقديم خطة إجراءات تصحيحية خلال اتفاقيات مستوى خدمة محددة وتقديم إثبات التطبيق والتحقق من الفعالية خلال فترة مراقبة محددة؛ وإخفاقات CAPA المستمرة تُصعَّد إلى مراجعة العقد.',
        ],
      },
      {
        q: 'How effectively do supplier development outcomes translate into measurable improvements in supplier performance KPIs — and how is development ROI tracked and reported?',
        qAr: 'ما مدى فعالية ترجمة نتائج تطوير الموردين إلى تحسينات قابلة للقياس في مؤشرات أداء الموردين — وكيف يُتابَع عائد استثمار التطوير ويُرفَع؟',
        levels: [
          'No measurement of supplier development outcomes exists. The organisation invests time or resource in supplier development without ever tracking whether it produced improvement.',
          'Some informal awareness exists of whether development efforts worked, but outcomes are not systematically measured against baseline KPIs or reported to leadership.',
          'Supplier development outcomes are tracked by comparing pre- and post-development KPI scores; findings are documented and shared with the supplier at the next review.',
          'Supplier development ROI is calculated for all formal development programmes — comparing investment (time, cost) against measured KPI improvement — and reported to procurement leadership annually.',
          'A structured supplier development ROI framework calculates and reports the full investment cost and measurable KPI improvement for every formal development programme; results are reviewed at the SRM governance board; cumulative ROI is reported as a procurement value creation metric to the CPO.',
        ],
        levelsAr: [
          'لا يوجد قياس لنتائج تطوير الموردين. المؤسسة تستثمر الوقت أو الموارد في تطوير الموردين دون متابعة ما إذا كان ذلك أنتج تحسينًا.',
          'يوجد بعض الوعي غير الرسمي بما إذا كانت جهود التطوير نجحت، لكن النتائج لا تُقاس بشكل منهجي مقابل مؤشرات الأداء الأساسية ولا تُرفَع للقيادة.',
          'نتائج تطوير الموردين تُتابَع بمقارنة درجات مؤشرات الأداء قبل وبعد التطوير؛ والنتائج موثّقة ومشتركة مع المورد في المراجعة التالية.',
          'عائد استثمار تطوير الموردين يُحسَب لجميع برامج التطوير الرسمية — بمقارنة الاستثمار (الوقت والتكلفة) مع تحسين مؤشرات الأداء المُقاس — ويُرفَع لقيادة المشتريات سنويًا.',
          'إطار منظم لعائد استثمار تطوير الموردين يحسب ويُبلّغ عن تكلفة الاستثمار الكاملة والتحسين المُقاس في مؤشرات الأداء لكل برنامج تطوير رسمي؛ والنتائج تُراجَع في مجلس حوكمة SRM؛ وعائد الاستثمار التراكمي يُرفَع كمقياس لخلق القيمة في المشتريات للـ CPO.',
        ],
      },
    ],
  },

  /* ── 3-5  Strategic Partnership Governance ──────────────────────────────── */
  {
    id: 'srm-partnership',
    title: 'Strategic Partnership Governance',
    titleAr: 'حوكمة الشراكات الاستراتيجية',
    hint: 'Assesses the maturity of strategic supplier partnership governance — including co-innovation, shared IP arrangements, executive steering committees, and joint risk management.',
    hintAr: 'يقيم نضج حوكمة الشراكات الاستراتيجية مع الموردين — بما في ذلك الابتكار المشترك وترتيبات الملكية الفكرية المشتركة ولجان التوجيه التنفيذية وإدارة المخاطر المشتركة.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How actively do you co-innovate with strategic suppliers — including structured innovation sessions, early involvement in product or process development, and formal tracking of innovation value delivered?',
        qAr: 'ما مدى فاعلية الابتكار المشترك مع الموردين الاستراتيجيين — بما في ذلك جلسات الابتكار المنظمة والإشراك المبكر في تطوير المنتجات أو العمليات والمتابعة الرسمية لقيمة الابتكار المحققة؟',
        levels: [
          'Supplier innovation is not pursued. The relationship is entirely transactional and suppliers are not seen as a potential source of innovation or competitive advantage.',
          'Suppliers occasionally propose improvements informally, but the organisation has no structured mechanism to receive, evaluate, or act on supplier innovation ideas.',
          'Innovation is discussed informally with top strategic suppliers and occasional improvement ideas are implemented, but there is no formal innovation programme, governance, or tracking.',
          'A supplier innovation programme with defined scope, a formal intake process, and an annual joint innovation forum is in place for strategic suppliers; innovation outcomes are tracked.',
          'All strategic suppliers participate in an annual co-innovation programme; joint innovation sessions are structured, supplier ideas are evaluated against commercial criteria, co-developed innovations are tracked for value delivered, and IP ownership is formally agreed before development begins.',
        ],
        levelsAr: [
          'الابتكار مع الموردين لا يُسعى إليه. العلاقة معاملية بالكامل والموردون لا يُنظَر إليهم كمصدر محتمل للابتكار أو الميزة التنافسية.',
          'الموردون أحيانًا يقترحون تحسينات بشكل غير رسمي، لكن المؤسسة لا تمتلك آلية منظمة لتلقّي أفكار ابتكار الموردين أو تقييمها أو التصرف بناءً عليها.',
          'الابتكار يُناقَش بشكل غير رسمي مع أبرز الموردين الاستراتيجيين وأفكار تحسين عرضية تُنفَّذ أحيانًا، لكن لا يوجد برنامج ابتكار رسمي أو حوكمة أو متابعة.',
          'برنامج ابتكار موردين بنطاق محدد وعملية استقبال رسمية ومنتدى ابتكار مشترك سنوي قائم للموردين الاستراتيجيين؛ ونتائج الابتكار تُتابَع.',
          'جميع الموردين الاستراتيجيين يشاركون في برنامج ابتكار مشترك سنوي؛ وجلسات الابتكار المشتركة منظمة وأفكار الموردين تُقيَّم مقابل معايير تجارية والابتكارات المطوَّرة مشتركًا تُتابَع من حيث القيمة المُحققة وملكية الملكية الفكرية تُتّفق عليها رسميًا قبل بدء التطوير.',
        ],
      },
      {
        q: 'How mature is the executive governance structure for strategic supplier partnerships — including executive steering committees, escalation pathways, and joint risk management processes?',
        qAr: 'ما مدى نضج هيكل الحوكمة التنفيذية للشراكات الاستراتيجية مع الموردين — بما في ذلك لجان التوجيه التنفيذية ومسارات التصعيد وعمليات إدارة المخاطر المشتركة؟',
        levels: [
          'No executive governance structure exists for any supplier partnership. All supplier engagement is managed at operational or procurement manager level only.',
          'Some strategic suppliers have executive-level contact (e.g., annual dinners or trade visits) but no structured governance forum, escalation pathway, or joint agenda exists.',
          'A biannual executive steering committee meets with the top 3–5 strategic suppliers with a structured agenda covering commercial, operational, and strategic topics.',
          'Formal executive steering committees with structured agendas, bilateral participants, and documented minutes are established for all strategic suppliers, meeting at least quarterly with clear escalation pathways.',
          'All strategic supplier partnerships are governed by a formal executive steering committee meeting quarterly, with bilateral executive sponsors, a rolling joint agenda, documented decisions, and a defined escalation pathway that connects to the procurement governance board for unresolved issues.',
        ],
        levelsAr: [
          'لا يوجد هيكل حوكمة تنفيذية لأي شراكة مع مورد. جميع التفاعل مع الموردين يُدار على مستوى تشغيلي أو مدير مشتريات فقط.',
          'بعض الموردين الاستراتيجيين لديهم تواصل على مستوى تنفيذي (مثل اللقاءات السنوية أو الزيارات التجارية) لكن لا يوجد منتدى حوكمة منظم أو مسار تصعيد أو أجندة مشتركة.',
          'لجنة توجيه تنفيذية تجتمع نصف سنويًا مع أبرز 3–5 موردين استراتيجيين بأجندة منظمة تغطي الموضوعات التجارية والتشغيلية والاستراتيجية.',
          'لجان توجيه تنفيذية رسمية بأجندات منظمة ومشاركين ثنائيين ومحاضر موثّقة مُرسَّخة لجميع الموردين الاستراتيجيين، تجتمع فصليًا على الأقل بمسارات تصعيد واضحة.',
          'جميع الشراكات الاستراتيجية مع الموردين تُحكَم بلجنة توجيه تنفيذية رسمية تجتمع فصليًا، براعين تنفيذيين ثنائيين وأجندة مشتركة متجددة وقرارات موثّقة ومسار تصعيد محدد يتصل بمجلس حوكمة المشتريات للمسائل غير المحسومة.',
        ],
      },
      {
        q: 'How effectively are strategic supplier partnerships governed from a risk management perspective — including shared risk mapping, joint contingency planning, and mutual early-warning systems?',
        qAr: 'ما مدى فعالية حوكمة الشراكات الاستراتيجية مع الموردين من منظور إدارة المخاطر — بما في ذلك رسم المخاطر المشترك والتخطيط الاحتياطي المشترك وأنظمة الإنذار المبكر المتبادل؟',
        levels: [
          'No joint risk management exists with strategic suppliers. The organisation manages supply risk unilaterally without sharing risk information or contingency plans with the supplier.',
          'Some risk information is shared informally with strategic suppliers when a specific issue arises, but there is no structured joint risk mapping or shared contingency planning.',
          'Annual risk reviews with strategic suppliers identify shared risk exposures and agree basic mutual notification protocols for significant supply chain risk events.',
          'Joint risk mapping and contingency planning sessions are conducted annually with strategic suppliers; mutual early-warning notification protocols are agreed and tested; shared risk mitigation actions are documented.',
          'Strategic supplier partnerships include a formal joint risk management framework — covering shared risk mapping, mutual notification protocols, joint contingency planning, and annual stress-testing — reviewed at the executive steering committee and updated when material risk conditions change.',
        ],
        levelsAr: [
          'لا توجد إدارة مخاطر مشتركة مع الموردين الاستراتيجيين. المؤسسة تُدير مخاطر الإمداد من جانب واحد دون مشاركة معلومات المخاطر أو الخطط الاحتياطية مع المورد.',
          'تُشارَك بعض معلومات المخاطر بشكل غير رسمي مع الموردين الاستراتيجيين عند حدوث مشكلة محددة، لكن لا يوجد رسم مشترك منظم للمخاطر أو تخطيط احتياطي مشترك.',
          'مراجعات مخاطر سنوية مع الموردين الاستراتيجيين تُحدّد التعرّضات للمخاطر المشتركة وتتّفق على بروتوكولات إخطار متبادلة أساسية لأحداث مخاطر سلسلة الإمداد الجوهرية.',
          'جلسات رسم مخاطر مشترك وتخطيط احتياطي تُجرى سنويًا مع الموردين الاستراتيجيين؛ وبروتوكولات الإخطار المبكر المتبادلة مُتّفق عليها ومُختبَرة؛ وإجراءات تخفيف المخاطر المشتركة موثّقة.',
          'الشراكات الاستراتيجية مع الموردين تتضمن إطارًا رسميًا لإدارة المخاطر المشتركة — يغطي رسم المخاطر المشترك وبروتوكولات الإخطار المتبادل والتخطيط الاحتياطي المشترك والاختبار السنوي للضغط — يُراجَع في لجنة التوجيه التنفيذية ويُحدَّث عند تغيّر ظروف المخاطر الجوهرية.',
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENT 4 — SUPPLY CHAIN RISK  (segIdx 4)
   Sub-segments:
     0 Risk Identification & Register  · 1 Probability & Impact Scoring
     2 Supply Continuity Planning      · 3 Crisis Response & BCP
     4 Supplier Financial & Geo-political Risk · 5 Regulatory & Compliance Risk
═══════════════════════════════════════════════════════════════════════════ */

export const RISK_SUB_SEGMENTS: SubSegmentData[] = [

  /* ── 4-0  Risk Identification & Register ────────────────────────────────── */
  {
    id: 'risk-register',
    title: 'Risk Identification & Register',
    titleAr: 'تحديد المخاطر وسجلها',
    hint: 'Assesses the comprehensiveness and currency of supply chain risk identification — including the risk register, tier-2 supplier visibility, and risk taxonomy.',
    hintAr: 'يقيم شمولية وحداثة تحديد مخاطر سلسلة الإمداد — بما في ذلك سجل المخاطر ورؤية موردي المستوى الثاني وتصنيف المخاطر.',
    benchmarks: { gcc: 2.0, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supply chain risk register',
      labelAr: 'سجل مخاطر سلسلة الإمداد',
      hint: 'Upload your supply chain risk register or risk assessment report (risks, owners, ratings).',
      hintAr: 'ارفع سجل مخاطر سلسلة الإمداد أو تقرير تقييم المخاطر (المخاطر والمالكون والتقييمات).',
    },
    questions: [
      {
        q: 'How comprehensively and systematically have supply chain risks been identified and catalogued — including all major risk categories such as supplier concentration, geographic, geopolitical, and climate risk?',
        qAr: 'ما مدى شمولية ومنهجية تحديد مخاطر سلسلة الإمداد وتصنيفها — بما في ذلك جميع فئات المخاطر الرئيسية مثل تركّز الموردين والمخاطر الجغرافية والجيوسياسية والمناخية؟',
        levels: [
          'No formal risk identification has been conducted. The organisation operates reactively, becoming aware of supply chain risks only after disruptions have occurred.',
          'A basic list of obvious supply chain risks exists informally, but it is incomplete, lacks structured categorisation, and has not been produced through a systematic identification exercise.',
          'A structured risk identification exercise — covering major risk categories including supplier concentration, geographic, and operational risks — has produced a documented risk register reviewed at least annually.',
          'A comprehensive risk register covers all material supply chain risk categories with structured taxonomy, risk ownership, and tier-2 supplier visibility for critical categories; updated at least semi-annually.',
          'A comprehensive, live risk register covers all supply chain risk categories with structured taxonomy, multi-tier supplier visibility, quantified exposure, named owners, and automated refresh from monitoring tools; reviewed quarterly at the executive risk committee.',
        ],
        levelsAr: [
          'لم يُجرَ تحديد رسمي للمخاطر. المؤسسة تعمل بشكل تفاعلي ولا تُدرَك مخاطر سلسلة الإمداد إلا بعد وقوع الاضطرابات.',
          'توجد قائمة أساسية بالمخاطر الواضحة لسلسلة الإمداد بشكل غير رسمي، لكنها غير مكتملة وتفتقر إلى تصنيف منظم ولم تُنتَج من خلال ممارسة تحديد منهجية.',
          'ممارسة تحديد مخاطر منظمة — تغطي فئات المخاطر الرئيسية بما في ذلك تركّز الموردين والمخاطر الجغرافية والتشغيلية — أنتجت سجل مخاطر موثّق يُراجَع سنويًا على الأقل.',
          'سجل مخاطر شامل يغطي جميع فئات مخاطر سلسلة الإمداد الجوهرية بتصنيف منظم وملكية مخاطر ورؤية لموردي المستوى الثاني للفئات الحرجة؛ يُحدَّث نصف سنويًا على الأقل.',
          'سجل مخاطر شامل وحي يغطي جميع فئات مخاطر سلسلة الإمداد بتصنيف منظم ورؤية متعددة المستويات للموردين وتعرّض مُقيَّس ومالكين مُعيَّنين وتحديث آلي من أدوات المراقبة؛ يُراجَع فصليًا في لجنة المخاطر التنفيذية.',
        ],
      },
      {
        q: 'How well does your risk register capture supply chain dependency risks — including single-source dependencies, sole-region concentration, and critical skill or technology lock-in?',
        qAr: 'ما مدى جودة التقاط سجل المخاطر لمخاطر اعتماديات سلسلة الإمداد — بما في ذلك اعتماديات المصدر الوحيد وتركّز منطقة واحدة والارتباط بمهارات أو تقنيات حرجة؟',
        levels: [
          'Dependency risks are not captured in any risk register. The organisation does not know which categories or inputs have single-source or single-region dependencies.',
          'Some awareness of single-source dependencies exists among category managers, but this knowledge is not systematically captured in a risk register or formally assessed.',
          'Single-source and critical-category concentration risks are documented in the risk register with basic mitigation plans and annual review.',
          'A dependency risk map covers all critical categories — including single-source, sole-region, and technology/skill lock-in risks — with quantified financial exposure and documented mitigation strategies for each dependency.',
          'A fully quantified dependency risk map covers all critical supply categories and inputs; single-source, sole-region, and sole-capability risks are ranked by financial impact; mitigation strategies are funded and tracked; the dependency map is refreshed annually and reviewed by the executive risk committee.',
        ],
        levelsAr: [
          'مخاطر الاعتماديات غير ملتقطة في أي سجل مخاطر. لا تعرف المؤسسة أي الفئات أو المدخلات لديها اعتماديات على مصدر أو منطقة واحدة.',
          'يوجد بعض الوعي باعتماديات المصدر الوحيد لدى مديري الفئات، لكن هذه المعرفة غير ملتقطة بشكل منهجي في سجل مخاطر أو مُقيَّمة رسميًا.',
          'مخاطر اعتماد المصدر الوحيد وتركّز الفئات الحرجة موثّقة في سجل المخاطر بخطط تخفيف أساسية ومراجعة سنوية.',
          'خريطة مخاطر اعتماديات تغطي جميع الفئات الحرجة — بما في ذلك مخاطر المصدر الوحيد ومنطقة الاعتماد الواحدة والارتباط بالتقنيات/المهارات — بتعرّض مالي مُقيَّس واستراتيجيات تخفيف موثّقة لكل اعتمادية.',
          'خريطة مخاطر اعتماديات مُقيَّسة بالكامل تغطي جميع فئات الإمداد والمدخلات الحرجة؛ ومخاطر المصدر الوحيد ومنطقة الاعتماد الواحدة والقدرة الفريدة مُرتَّبة حسب الأثر المالي؛ واستراتيجيات التخفيف مُموَّلة ومتابَعة؛ وخريطة الاعتماديات تُحدَّث سنويًا وتُراجَع من لجنة المخاطر التنفيذية.',
        ],
      },
      {
        q: 'How actively and systematically are supply chain risk owners assigned, held accountable, and supported in monitoring and reporting on their risks?',
        qAr: 'ما مدى فاعلية ومنهجية تعيين مالكي مخاطر سلسلة الإمداد ومحاسبتهم ودعمهم في مراقبة مخاطرهم والإبلاغ عنها؟',
        levels: [
          'No risk ownership is assigned. The risk register — if it exists — has no named owners and risks are monitored by no one in particular.',
          'Some risks have informal owners but accountability is unclear, monitoring is inconsistent, and risks are not formally reported in any governance forum.',
          'All risks in the register have named owners; owners are expected to monitor and update their risks at least quarterly and report material changes to the procurement or risk committee.',
          'Risk owners are formally assigned with defined responsibilities, monitoring frequencies, and escalation protocols; risk status is reported monthly at a risk governance forum.',
          'All supply chain risks have named executive-level owners with defined responsibilities, monitoring frequencies, and escalation pathways; risk status is reported monthly at the executive risk committee; owners are accountable for mitigation action completion and are assessed on risk management outcomes in their annual performance review.',
        ],
        levelsAr: [
          'لا تُعيَّن ملكية المخاطر. سجل المخاطر — إن وُجد — لا يحتوي على مالكين مُعيَّنين بالاسم والمخاطر لا يراقبها أحد بشكل محدد.',
          'بعض المخاطر لديها مالكون غير رسميين لكن المساءلة غير واضحة والمراقبة غير متسقة والمخاطر لا تُرفَع رسميًا في أي منتدى حوكمة.',
          'جميع المخاطر في السجل لديها مالكون مُعيَّنون بالاسم؛ والمالكون مُتوقَّع منهم مراقبة وتحديث مخاطرهم فصليًا على الأقل والإبلاغ عن التغييرات الجوهرية للجنة المشتريات أو المخاطر.',
          'مالكو المخاطر مُعيَّنون رسميًا بمسؤوليات محددة وترددات مراقبة وبروتوكولات تصعيد؛ وحالة المخاطر تُرفَع شهريًا في منتدى حوكمة المخاطر.',
          'جميع مخاطر سلسلة الإمداد لديها مالكون تنفيذيون مُعيَّنون بالاسم بمسؤوليات محددة وترددات مراقبة ومسارات تصعيد؛ وحالة المخاطر تُرفَع شهريًا في لجنة المخاطر التنفيذية؛ والمالكون مسؤولون عن إكمال إجراءات التخفيف ويُقيَّمون على نتائج إدارة المخاطر في مراجعة أدائهم السنوية.',
        ],
      },
    ],
  },

  /* ── 4-1  Probability & Impact Scoring ──────────────────────────────────── */
  {
    id: 'risk-scoring',
    title: 'Probability & Impact Scoring',
    titleAr: 'تسجيل الاحتمالية والأثر',
    hint: 'Assesses the rigour and consistency of risk quantification — including probability assessment, financial impact modelling, and risk prioritisation methodology.',
    hintAr: 'يقيم صرامة واتساق تقييم المخاطر — بما في ذلك تقييم الاحتمالية ونمذجة الأثر المالي ومنهجية تحديد أولويات المخاطر.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How rigorously and consistently are supply chain risks scored for probability and financial impact — using a defined methodology that enables meaningful prioritisation and comparison across risk categories?',
        qAr: 'ما مدى صرامة واتساق تسجيل مخاطر سلسلة الإمداد من حيث الاحتمالية والأثر المالي — باستخدام منهجية محددة تُمكّن من تحديد أولويات وتحليل مقارن ذي معنى عبر فئات المخاطر؟',
        levels: [
          'Risks are not scored or quantified. The risk register — if it exists — lists risks without any assessment of probability, impact, or priority.',
          'Risks are informally ranked as "high/medium/low" by individual judgement, but no consistent methodology, scoring matrix, or financial quantification is applied.',
          'A defined risk scoring matrix rates probability and impact on a 5×5 scale; composite risk scores prioritise mitigation effort; major risks have estimated financial exposure documented.',
          'All registered risks are scored using a consistent probability-impact matrix with financial quantification; scores are validated by the risk owner and reviewed in the governance forum; heat maps visualise the risk portfolio.',
          'All risks are quantified using a consistent scoring methodology with financial impact expressed as expected monetary value (EMV); scores are validated by risk owners and reviewed quarterly at the executive risk committee; risk appetite thresholds determine escalation levels.',
        ],
        levelsAr: [
          'المخاطر لا تُسجَّل أو تُقيَّس. سجل المخاطر — إن وُجد — يُدرج المخاطر دون أي تقييم للاحتمالية أو الأثر أو الأولوية.',
          'المخاطر تُرتَّب غير رسميًا كـ "عالية/متوسطة/منخفضة" بتقدير فردي، لكن لا تُطبَّق منهجية متسقة أو مصفوفة تسجيل أو تقييم مالي.',
          'مصفوفة تسجيل مخاطر محددة تُقيّم الاحتمالية والأثر على مقياس 5×5؛ ودرجات المخاطر المركّبة تُحدّد أولويات جهود التخفيف؛ والمخاطر الكبرى لديها تعرّض مالي مُقدَّر موثّق.',
          'جميع المخاطر المُسجَّلة مُسجَّلة باستخدام مصفوفة احتمالية-أثر متسقة مع تقييم مالي؛ والدرجات مُتحقَّق منها من مالك المخاطر ومُراجَعة في منتدى الحوكمة؛ والخرائط الحرارية تُصوّر محفظة المخاطر.',
          'جميع المخاطر مُقيَّسة بمنهجية تسجيل متسقة مع الأثر المالي معبَّرًا عنه كقيمة نقدية متوقعة (EMV)؛ والدرجات مُتحقَّق منها من مالكي المخاطر ومُراجَعة فصليًا في لجنة المخاطر التنفيذية؛ وعتبات الشهية للمخاطر تُحدد مستويات التصعيد.',
        ],
      },
      {
        q: 'How effectively are risk scores updated to reflect changing conditions — including supplier news, geopolitical developments, commodity price movements, and post-incident learnings?',
        qAr: 'ما مدى فعالية تحديث درجات المخاطر لتعكس الظروف المتغيرة — بما في ذلك أخبار الموردين والتطورات الجيوسياسية وتحركات أسعار السلع والدروس المستفادة بعد الحوادث؟',
        levels: [
          'Risk scores are never updated after initial assessment. The risk register reflects a static point-in-time view that does not evolve as conditions change.',
          'Risk scores are updated infrequently — typically only when triggered by a crisis or a formal annual review — and the update process is manual and inconsistent.',
          'Risk scores are reviewed and updated at least quarterly; significant external events (e.g., a major supplier failure or geopolitical disruption) trigger an ad-hoc review.',
          'A defined risk refresh process updates all scores at least quarterly; monitoring tools automatically flag events that should trigger score updates; post-incident learnings are formally incorporated.',
          'Risk scores are updated continuously based on automated monitoring signals; significant events trigger immediate score review within 48 hours; post-incident learnings are formally incorporated within 30 days; the risk portfolio heat map is refreshed in real time and reviewed at each executive risk committee meeting.',
        ],
        levelsAr: [
          'درجات المخاطر لا تُحدَّث أبدًا بعد التقييم الأولي. سجل المخاطر يعكس رؤية ثابتة لنقطة زمنية لا تتطور مع تغيّر الظروف.',
          'درجات المخاطر تُحدَّث بشكل غير متكرر — عادةً فقط عند تحفيزها بأزمة أو مراجعة سنوية رسمية — وعملية التحديث يدوية وغير متسقة.',
          'درجات المخاطر تُراجَع وتُحدَّث فصليًا على الأقل؛ والأحداث الخارجية الجوهرية (مثل فشل مورد رئيسي أو اضطراب جيوسياسي) تُطلق مراجعة ارتجالية.',
          'عملية تحديث مخاطر محددة تُحدّث جميع الدرجات فصليًا على الأقل؛ وأدوات المراقبة تُبلّغ آليًا عن الأحداث التي يجب أن تُطلق تحديثات الدرجات؛ والدروس المستفادة بعد الحوادث تُدمَج رسميًا.',
          'درجات المخاطر تُحدَّث باستمرار بناءً على إشارات مراقبة آلية؛ والأحداث الجوهرية تُطلق مراجعة فورية للدرجات خلال 48 ساعة؛ والدروس المستفادة بعد الحوادث تُدمَج رسميًا خلال 30 يومًا؛ والخريطة الحرارية لمحفظة المخاطر تُحدَّث آنيًا وتُراجَع في كل اجتماع للجنة المخاطر التنفيذية.',
        ],
      },
      {
        q: 'How effectively do risk scores drive mitigation investment decisions — ensuring that resources are allocated to the highest-priority risks rather than the most visible or loudest ones?',
        qAr: 'ما مدى فعالية توجيه درجات المخاطر لقرارات الاستثمار في التخفيف — مما يضمن تخصيص الموارد للمخاطر الأعلى أولوية لا للأكثر ظهورًا أو للأعلى صوتًا؟',
        levels: [
          'Risk mitigation resources are not allocated based on risk scores. Resources go to whoever raises the loudest complaint or the most recent incident — regardless of strategic risk priority.',
          'Some informal alignment exists between high-rated risks and mitigation effort, but the link is not formalised and resource allocation is frequently driven by operational fire-fighting.',
          'Risk scores inform the annual prioritisation of mitigation initiatives; the highest-scoring risks receive funded mitigation plans with defined owners and timelines.',
          'A formal risk mitigation investment framework allocates budget and resources to risks above defined score thresholds; mitigation effectiveness is reviewed annually and resources are reallocated if effectiveness is insufficient.',
          'Risk scores directly drive mitigation investment decisions through a formal risk mitigation investment process; budget is allocated by risk score rank; mitigation effectiveness is reviewed quarterly at the executive risk committee; resources are reallocated within 30 days if mitigation is deemed ineffective.',
        ],
        levelsAr: [
          'موارد تخفيف المخاطر لا تُخصَّص بناءً على درجات المخاطر. الموارد تذهب لمن يرفع أعلى شكوى أو أحدث حادثة — بصرف النظر عن أولوية المخاطر الاستراتيجية.',
          'يوجد بعض المواءمة غير الرسمية بين المخاطر ذات التقييم المرتفع وجهود التخفيف، لكن الرابط غير رسمي وتخصيص الموارد كثيرًا ما يُقاد بالتعامل مع الأزمات التشغيلية.',
          'درجات المخاطر تُغذّي تحديد أولويات المبادرات التخفيفية السنوي؛ والمخاطر ذات الدرجات الأعلى تحصل على خطط تخفيف مُموَّلة بمالكين ومواعيد زمنية محددة.',
          'إطار استثمار رسمي لتخفيف المخاطر يُخصّص الميزانية والموارد للمخاطر فوق عتبات درجات محددة؛ وفعالية التخفيف تُراجَع سنويًا وتُعاد إعادة تخصيص الموارد إذا كانت الفعالية غير كافية.',
          'درجات المخاطر تُوجّه مباشرةً قرارات الاستثمار في التخفيف عبر عملية استثمار رسمية لتخفيف المخاطر؛ والميزانية تُخصَّص حسب ترتيب درجة المخاطر؛ وفعالية التخفيف تُراجَع فصليًا في لجنة المخاطر التنفيذية؛ والموارد تُعاد إعادة تخصيصها خلال 30 يومًا إذا تبيّن عدم فعالية التخفيف.',
        ],
      },
    ],
  },

  /* ── 4-2  Supply Continuity Planning ────────────────────────────────────── */
  {
    id: 'risk-continuity',
    title: 'Supply Continuity Planning',
    titleAr: 'تخطيط استمرارية الإمداد',
    hint: 'Assesses the robustness of supply continuity plans — including alternative sourcing options, inventory buffers, recovery time objectives, and dual-sourcing strategies.',
    hintAr: 'يقيم متانة خطط استمرارية الإمداد — بما في ذلك خيارات التوريد البديل ومخزونات الأمان وأهداف وقت التعافي واستراتيجيات التوريد المزدوج.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Supply continuity or business continuity plan',
      labelAr: 'خطة استمرارية الإمداد أو استمرارية الأعمال',
      hint: 'Upload a supply continuity plan, BCP extract, or alternative sourcing strategy for a critical category.',
      hintAr: 'ارفع خطة استمرارية إمداد أو مقتطفًا من خطة استمرارية الأعمال أو استراتيجية توريد بديل لفئة حرجة.',
    },
    questions: [
      {
        q: 'How robust and consistently maintained are your supply continuity plans for critical categories — covering identified and qualified alternative sources, inventory buffer policies, and recovery time objectives?',
        qAr: 'ما مدى متانة خطط استمرارية الإمداد للفئات الحرجة لديكم والاحتفاظ بها باتساق — التي تغطي مصادر بديلة محددة ومؤهَّلة وسياسات مخزون الأمان وأهداف وقت التعافي؟',
        levels: [
          'No supply continuity plans exist for any category. There are no documented recovery options, buffer stock policies, or alternative sourcing strategies for any supply interruption scenario.',
          'Some informal workarounds are known to experienced team members for common supply disruptions, but these are undocumented, untested, and personal-knowledge dependent.',
          'Business continuity plans exist for the highest-risk supply categories, with documented alternative sourcing options and basic inventory buffer policies reviewed annually.',
          'Supply continuity plans cover all critical categories with identified and qualified alternative suppliers, defined inventory buffer levels, documented RTO targets, and an annual review process.',
          'Comprehensive supply continuity plans cover all critical supply categories with pre-qualified alternative suppliers, capacity-validated contingency sources, defined safety stock policies, documented RTO and RPO targets, and are reviewed and tested annually.',
        ],
        levelsAr: [
          'لا توجد خطط استمرارية إمداد لأي فئة. لا توجد خيارات تعافٍ موثّقة أو سياسات مخزون أمان أو استراتيجيات توريد بديل لأي سيناريو انقطاع في الإمداد.',
          'بعض الحلول البديلة غير الرسمية معروفة لأعضاء الفريق ذوي الخبرة للاضطرابات الشائعة في الإمداد، لكنها غير موثّقة وغير مختبَرة وتعتمد على المعرفة الشخصية.',
          'خطط استمرارية أعمال قائمة لفئات الإمداد الأعلى مخاطرة، بخيارات توريد بديل موثّقة وسياسات مخزون أمان أساسية تُراجَع سنويًا.',
          'خطط استمرارية الإمداد تغطي جميع الفئات الحرجة بموردين بدلاء محددين ومؤهَّلين ومستويات مخزون أمان محددة وأهداف RTO موثّقة وعملية مراجعة سنوية.',
          'خطط استمرارية إمداد شاملة تغطي جميع فئات الإمداد الحرجة بموردين بدلاء مؤهَّلين مسبقًا ومصادر احتياطية متحقَّق من طاقتها وسياسات مخزون أمان محددة وأهداف RTO وRPO موثّقة، وتُراجَع وتُختبَر سنويًا.',
        ],
      },
      {
        q: 'How effectively are dual-sourcing or multi-sourcing strategies applied for critical categories — and how regularly is the independence and real-world capacity of contingency sources validated?',
        qAr: 'ما مدى فعالية تطبيق استراتيجيات التوريد المزدوج أو المتعدد للفئات الحرجة — وما مدى انتظام التحقق من استقلالية وطاقة المصادر الاحتياطية في الواقع الفعلي؟',
        levels: [
          'Many critical categories have a single source with no validated alternative. Single-source dependency is not tracked or actively managed as a supply chain risk.',
          'Dual sourcing exists for some critical items, but alternatives are often unqualified, have untested capacity, and are not maintained as viable live options.',
          'Dual sourcing is in place for the highest-risk categories with qualified alternatives and periodic capacity validation; contingency pricing is negotiated in advance.',
          'All critical categories operate on a dual or multi-source model with pre-qualified capacity; sourcing independence is validated through annual supplier audits; contingency prices and lead times are pre-agreed.',
          'All critical categories use a dual or multi-source model with validated independent capacity, pre-negotiated contingency pricing, and a quarterly independence audit confirming alternatives remain credible; concentration above 70% with any single supplier triggers mandatory re-sourcing.',
        ],
        levelsAr: [
          'كثير من الفئات الحرجة لديها مصدر واحد دون بديل مُتحقَّق منه. الاعتماد على المصدر الوحيد لا يُتابَع أو يُدار فاعلياً كمخاطر سلسلة إمداد.',
          'التوريد المزدوج قائم لبعض الأصناف الحرجة، لكن البدائل كثيرًا ما تكون غير مؤهَّلة وطاقتها غير مختبَرة ولا تُحافَظ عليها كخيارات حية قابلة للتطبيق.',
          'التوريد المزدوج قائم للفئات الأعلى مخاطرة ببدائل مؤهَّلة والتحقق الدوري من الطاقة؛ وأسعار الطوارئ مُفاوَض عليها مسبقًا.',
          'جميع الفئات الحرجة تعمل بنموذج توريد مزدوج أو متعدد بطاقة مؤهَّلة مسبقًا؛ والاستقلالية التوريدية تُتحقَّق منها عبر عمليات تدقيق سنوية للموردين؛ وأسعار الطوارئ ومهل التوريد مُتّفق عليها مسبقًا.',
          'جميع الفئات الحرجة تستخدم نموذج توريد مزدوج أو متعدد بطاقة مستقلة مُتحقَّق منها وأسعار طوارئ مُتفاوَض عليها مسبقًا وتدقيق استقلالية فصلي يؤكد بقاء البدائل موثوقة؛ والتركّز فوق 70% مع أي مورد واحد يُطلق إعادة توريد إلزامية.',
        ],
      },
      {
        q: 'How effectively are supply continuity plans tested, maintained, and updated — and how quickly are plan gaps identified and remediated after a real disruption or simulation exercise?',
        qAr: 'ما مدى فعالية اختبار خطط استمرارية الإمداد وصيانتها وتحديثها — وما سرعة تحديد الفجوات في الخطط ومعالجتها بعد اضطراب حقيقي أو تمرين محاكاة؟',
        levels: [
          'Supply continuity plans have never been tested. Plans exist on paper but the organisation has no practical knowledge of whether they would work in a real disruption.',
          'Plans are reviewed annually but testing is informal; gaps identified in the review are noted but not systematically actioned before the next annual cycle.',
          'A structured tabletop simulation or formal plan test is conducted annually; findings are documented and used to update plans within 90 days.',
          'Annual stress-test simulations cover multiple disruption scenarios for critical categories; findings generate specific plan updates with owners and 30-day completion targets.',
          'Annual supply continuity stress tests simulate multiple realistic disruption scenarios; findings generate specific, time-bound plan updates actioned within 30 days; plan gaps discovered in real disruptions are closed within 5 business days and trigger an immediate lessons-learned review.',
        ],
        levelsAr: [
          'خطط استمرارية الإمداد لم تُختبَر أبدًا. الخطط موجودة على الورق لكن ليس لدى المؤسسة أي معرفة عملية بما إذا كانت ستنجح في اضطراب حقيقي.',
          'تُراجَع الخطط سنويًا لكن الاختبار غير رسمي؛ والفجوات المحددة في المراجعة تُلاحَظ لكنها لا تُعالَج بشكل منهجي قبل الدورة السنوية التالية.',
          'محاكاة على الطاولة منظمة أو اختبار رسمي للخطة يُجرى سنويًا؛ والنتائج موثّقة وتُستخدَم لتحديث الخطط خلال 90 يومًا.',
          'محاكاة اختبار إجهاد سنوية تغطي سيناريوهات اضطراب متعددة للفئات الحرجة؛ والنتائج تُولّد تحديثات خطط محددة بمالكين وأهداف إكمال خلال 30 يومًا.',
          'اختبارات إجهاد استمرارية إمداد سنوية تحاكي سيناريوهات اضطراب واقعية متعددة؛ والنتائج تُولّد تحديثات خطط محددة ومحددة بوقت تُنجَز خلال 30 يومًا؛ والفجوات المكتشفة في الاضطرابات الحقيقية تُغلَق خلال 5 أيام عمل وتُطلق مراجعة فورية للدروس المستفادة.',
        ],
      },
    ],
  },

  /* ── 4-3  Crisis Response & BCP ─────────────────────────────────────────── */
  {
    id: 'risk-crisis',
    title: 'Crisis Response & BCP',
    titleAr: 'الاستجابة للأزمات وخطة استمرارية الأعمال',
    hint: 'Assesses the maturity of supply chain crisis response — including incident management protocols, escalation pathways, communication plans, and post-crisis review processes.',
    hintAr: 'يقيم نضج الاستجابة لأزمات سلسلة الإمداد — بما في ذلك بروتوكولات إدارة الحوادث ومسارات التصعيد وخطط التواصل وعمليات مراجعة ما بعد الأزمة.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How well-defined and consistently followed are your supply chain crisis response protocols — including incident declaration triggers, escalation pathways, command structures, and communication plans?',
        qAr: 'ما مدى وضوح بروتوكولات الاستجابة لأزمات سلسلة الإمداد لديكم واتساق اتباعها — بما في ذلك مُحفّزات الإعلان عن الحوادث ومسارات التصعيد وهياكل القيادة وخطط التواصل؟',
        levels: [
          'No supply chain crisis response protocols exist. When a major disruption occurs, the response is improvised by whoever happens to be available — without a defined command structure or communication plan.',
          'Some informal awareness of how to escalate supply chain crises exists among senior team members, but it is not documented and varies depending on who is available.',
          'A basic crisis response protocol is documented, including a defined escalation pathway, key contacts, and a communication template for major supply chain disruptions.',
          'A formal supply chain crisis response plan defines incident triggers, command structure, escalation pathways, communication plans for internal and external stakeholders, and an activation checklist — reviewed annually.',
          'A comprehensive supply chain crisis response plan — including incident declaration triggers, command structure, escalation matrix, internal and external communication protocols, supplier engagement playbook, and a media response framework — is reviewed annually, tested through simulations, and activated within 2 hours of a qualifying event.',
        ],
        levelsAr: [
          'لا توجد بروتوكولات استجابة لأزمات سلسلة الإمداد. عند حدوث اضطراب كبير، الاستجابة تكون مرتجلة من قِبَل من يتواجد — دون هيكل قيادة محدد أو خطة تواصل.',
          'يوجد بعض الوعي غير الرسمي بكيفية تصعيد أزمات سلسلة الإمداد لدى كبار أعضاء الفريق، لكنه غير موثّق ويتباين بحسب من يتواجد.',
          'بروتوكول استجابة للأزمات أساسي موثّق، يتضمن مسار تصعيد محدد وجهات اتصال رئيسية وقالب تواصل للاضطرابات الكبرى في سلسلة الإمداد.',
          'خطة استجابة رسمية لأزمات سلسلة الإمداد تُحدّد محفّزات الحوادث وهيكل القيادة ومسارات التصعيد وخطط التواصل مع أصحاب المصلحة الداخليين والخارجيين وقائمة تحقق للتفعيل — تُراجَع سنويًا.',
          'خطة استجابة شاملة لأزمات سلسلة الإمداد — تتضمن محفّزات الإعلان عن الحوادث وهيكل القيادة ومصفوفة التصعيد وبروتوكولات التواصل الداخلي والخارجي ودليل التفاعل مع الموردين وإطار الاستجابة الإعلامية — تُراجَع سنويًا وتُختبَر عبر محاكاة وتُفعَّل خلال ساعتين من وقوع حدث مؤهَّل.',
        ],
      },
      {
        q: 'How effectively does your supply chain BCP ensure continuity of critical procurement and supply operations during an extended disruption — including remote working, alternative sites, and supplier communication?',
        qAr: 'ما مدى فعالية خطة استمرارية الأعمال في سلسلة الإمداد في ضمان استمرارية عمليات الشراء والإمداد الحرجة خلال اضطراب ممتد — بما في ذلك العمل عن بُعد والمواقع البديلة والتواصل مع الموردين؟',
        levels: [
          'No BCP addresses supply chain operations. In the event of a major disruption, the organisation would have no documented plan for maintaining procurement or supply continuity.',
          'A general business continuity plan exists but supply chain operations (procurement, logistics, supplier communication) are not specifically addressed or tested.',
          'The BCP includes a supply chain section covering the most critical procurement activities — including key system access, supplier contact lists, and minimum viable supply chain operations.',
          'The supply chain BCP covers all critical procurement activities with defined minimum service levels, alternative working arrangements, key supplier notification protocols, and annual testing.',
          'A fully tested supply chain BCP covers all critical operations with defined minimum service levels, alternative site and remote working arrangements, supplier communication protocols, system failover procedures, and recovery time objectives — tested against specific disruption scenarios annually.',
        ],
        levelsAr: [
          'لا تتناول خطة استمرارية الأعمال عمليات سلسلة الإمداد. في حال وقوع اضطراب كبير، لن يكون لدى المؤسسة أي خطة موثّقة للحفاظ على استمرارية الشراء أو الإمداد.',
          'توجد خطة عامة لاستمرارية الأعمال لكن عمليات سلسلة الإمداد (الشراء والخدمات اللوجستية والتواصل مع الموردين) لا تُعالَج تحديدًا أو تُختبَر.',
          'خطة استمرارية الأعمال تتضمن قسمًا لسلسلة الإمداد يغطي أنشطة الشراء الأكثر حرجًا — بما في ذلك الوصول للأنظمة الرئيسية وقوائم جهات اتصال الموردين والحد الأدنى لعمليات سلسلة الإمداد القابلة للتطبيق.',
          'خطة استمرارية أعمال سلسلة الإمداد تغطي جميع أنشطة الشراء الحرجة بمستويات خدمة دنيا محددة وترتيبات عمل بديلة وبروتوكولات إخطار الموردين الرئيسيين واختبار سنوي.',
          'خطة استمرارية أعمال سلسلة إمداد مُختبَرة بالكامل تغطي جميع العمليات الحرجة بمستويات خدمة دنيا محددة وترتيبات مواقع بديلة وعمل عن بُعد وبروتوكولات تواصل مع الموردين وإجراءات التعافي للأنظمة وأهداف وقت التعافي — تُختبَر مقابل سيناريوهات اضطراب محددة سنويًا.',
        ],
      },
      {
        q: 'How systematically do you conduct post-crisis reviews — capturing lessons learned, updating risk registers, and improving crisis response protocols based on what actually happened?',
        qAr: 'ما مدى منهجية إجرائكم لمراجعات ما بعد الأزمة — بالتقاط الدروس المستفادة وتحديث سجلات المخاطر وتحسين بروتوكولات الاستجابة بناءً على ما حدث فعليًا؟',
        levels: [
          'Post-crisis reviews are never conducted. After a supply chain disruption, the organisation returns to business as usual without formally reviewing what happened or why.',
          'Some informal discussion about what went wrong occurs after major disruptions, but findings are not documented and no systematic process exists for incorporating lessons into risk plans.',
          'A structured post-incident review is conducted after all significant supply chain disruptions; findings are documented and specific action items are assigned with owners.',
          'A formal post-crisis review process captures root causes, response effectiveness, and improvement actions within 30 days; findings are used to update the risk register, BCP, and crisis response protocols.',
          'A mandatory post-crisis review process captures root causes, response effectiveness, and improvement actions within 14 days of incident resolution; findings update the risk register, BCP, crisis protocols, and mitigation plans; review outputs are presented to the executive risk committee and lessons are built into the next annual crisis simulation.',
        ],
        levelsAr: [
          'مراجعات ما بعد الأزمة لا تُجرى أبدًا. بعد اضطراب سلسلة الإمداد، تعود المؤسسة لأعمالها المعتادة دون مراجعة رسمية لما حدث أو لماذا.',
          'تحدث بعض النقاشات غير الرسمية حول ما أخفق بعد الاضطرابات الكبرى، لكن النتائج غير موثّقة ولا توجد عملية منهجية لدمج الدروس في خطط المخاطر.',
          'مراجعة منظمة بعد الحادث تُجرى لجميع اضطرابات سلسلة الإمداد الجوهرية؛ والنتائج موثّقة وإجراءات محددة مُسنَدة لمالكين.',
          'عملية مراجعة رسمية بعد الأزمة تلتقط الأسباب الجذرية وفعالية الاستجابة وإجراءات التحسين خلال 30 يومًا؛ والنتائج تُستخدَم لتحديث سجل المخاطر وخطة استمرارية الأعمال وبروتوكولات الاستجابة للأزمات.',
          'عملية مراجعة إلزامية بعد الأزمة تلتقط الأسباب الجذرية وفعالية الاستجابة وإجراءات التحسين خلال 14 يومًا من حل الحادث؛ والنتائج تُحدّث سجل المخاطر وخطة استمرارية الأعمال وبروتوكولات الأزمات وخطط التخفيف؛ ومخرجات المراجعة تُقدَّم للجنة المخاطر التنفيذية والدروس مدمجة في المحاكاة السنوية التالية للأزمات.',
        ],
      },
    ],
  },

  /* ── 4-4  Supplier Financial & Geo-political Risk ───────────────────────── */
  {
    id: 'risk-supplier-financial',
    title: 'Supplier Financial & Geo-political Risk',
    titleAr: 'مخاطر المورد المالية والجيوسياسية',
    hint: 'Assesses the monitoring and management of supplier financial health risks and geo-political risks — including early warning systems, financial distress indicators, and country risk management.',
    hintAr: 'يقيم مراقبة وإدارة مخاطر السلامة المالية للموردين والمخاطر الجيوسياسية — بما في ذلك أنظمة الإنذار المبكر ومؤشرات الضائقة المالية وإدارة مخاطر الدول.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    questions: [
      {
        q: 'How actively do you monitor the financial health of critical suppliers — using financial statements, credit risk scores, payment behaviour analysis, and early warning indicators?',
        qAr: 'ما مدى فاعلية مراقبتكم للسلامة المالية للموردين الحرجين — باستخدام البيانات المالية ودرجات مخاطر الائتمان وتحليل سلوك الدفع ومؤشرات الإنذار المبكر؟',
        levels: [
          'Supplier financial health is never formally monitored. The organisation only discovers a supplier is in financial distress when the supplier fails to deliver or closes.',
          'Some informal awareness of key supplier financial performance exists (e.g., news headlines) but no structured monitoring of financial statements or credit risk is conducted.',
          'Annual financial health reviews of critical suppliers cover key financial ratios; credit risk scores from third-party sources are checked periodically for strategic suppliers.',
          'Quarterly financial health monitoring of all critical and strategic suppliers uses financial statements, credit scores, and payment behaviour data; early warning indicators trigger alerts when thresholds are breached.',
          'An automated supplier financial monitoring platform continuously tracks financial health indicators, credit risk signals, and payment behaviour for all critical suppliers; risk score changes trigger immediate alerts with pre-planned response protocols; financial health is a standing agenda item at SRM governance reviews.',
        ],
        levelsAr: [
          'السلامة المالية للموردين لا تُراقَب رسميًا أبدًا. لا تكتشف المؤسسة أن مورداً في ضائقة مالية إلا عند فشل المورد في التسليم أو إغلاقه.',
          'يوجد بعض الوعي غير الرسمي بالأداء المالي للموردين الرئيسيين (مثل عناوين الأخبار) لكن لا تُجرى رقابة منظمة على البيانات المالية أو مخاطر الائتمان.',
          'مراجعات سنوية للسلامة المالية للموردين الحرجين تغطي النسب المالية الرئيسية؛ ودرجات مخاطر الائتمان من مصادر خارجية تُفحَص دوريًا للموردين الاستراتيجيين.',
          'مراقبة فصلية للسلامة المالية لجميع الموردين الحرجين والاستراتيجيين تستخدم البيانات المالية ودرجات الائتمان وبيانات سلوك الدفع؛ ومؤشرات الإنذار المبكر تُطلق تنبيهات عند تجاوز الحدود.',
          'منصة آلية لمراقبة المالية للموردين تتابع باستمرار مؤشرات السلامة المالية وإشارات مخاطر الائتمان وسلوك الدفع لجميع الموردين الحرجين؛ وتغييرات درجات المخاطر تُطلق تنبيهات فورية ببروتوكولات استجابة مُعدَّة مسبقًا؛ والسلامة المالية بند ثابت في أجندة مراجعات حوكمة SRM.',
        ],
      },
      {
        q: 'How systematically do you assess and manage geo-political risk in your supply chain — including country risk scoring, conflict zone exposure, and supply chain reshoring or diversification strategies?',
        qAr: 'ما مدى منهجية تقييمكم وإدارتكم للمخاطر الجيوسياسية في سلسلة الإمداد — بما في ذلك تسجيل مخاطر الدول والتعرّض لمناطق الصراع واستراتيجيات إعادة التوطين أو التنويع؟',
        levels: [
          'Geo-political risk is not formally assessed or managed. Supply chain sourcing decisions are made without reference to country risk, political stability, or sanctions compliance.',
          'Some awareness of geo-political risk exists informally but no country risk scoring, structured exposure mapping, or formal management response is in place.',
          'Country risk assessments are conducted annually for key sourcing countries; exposure is documented and major risk events trigger an informal review of sourcing arrangements.',
          'A formal geo-political risk framework assesses all significant sourcing country exposures using country risk indices; high-risk country exposures are mitigated through diversification, pre-qualification of alternative sources, or buffer stock policies.',
          'A comprehensive geo-political risk management framework continuously monitors country risk using third-party risk indices, sanctions screening, and conflict monitoring; supply chain exposure is mapped by country for all critical inputs; diversification or reshoring strategies are pre-approved for high-risk country scenarios above a defined threshold.',
        ],
        levelsAr: [
          'المخاطر الجيوسياسية لا تُقيَّم أو تُدار رسميًا. تُتخذ قرارات التوريد في سلسلة الإمداد دون أي إشارة لمخاطر الدول أو الاستقرار السياسي أو الامتثال للعقوبات.',
          'يوجد بعض الوعي غير الرسمي بالمخاطر الجيوسياسية لكن لا يوجد تسجيل لمخاطر الدول أو رسم منظم للتعرّض أو استجابة إدارية رسمية.',
          'تقييمات مخاطر الدول تُجرى سنويًا لدول التوريد الرئيسية؛ والتعرّض موثّق والأحداث الجسيمة تُطلق مراجعة غير رسمية لترتيبات التوريد.',
          'إطار رسمي لمخاطر الجيوسياسية يقيّم جميع تعرّضات دول التوريد الجوهرية باستخدام مؤشرات مخاطر الدول؛ وتعرّضات الدول ذات المخاطر العالية تُخفَّف عبر التنويع أو التأهيل المسبق لمصادر بديلة أو سياسات المخزون الاحتياطي.',
          'إطار شامل لإدارة المخاطر الجيوسياسية يراقب باستمرار مخاطر الدول باستخدام مؤشرات مخاطر من جهات خارجية وفحص العقوبات ومراقبة النزاعات؛ وتعرّض سلسلة الإمداد مرسوم حسب الدولة لجميع المدخلات الحرجة؛ واستراتيجيات التنويع أو إعادة التوطين معتمدة مسبقًا لسيناريوهات الدول ذات المخاطر العالية فوق حد محدد.',
        ],
      },
      {
        q: 'How proactively do you manage the risk of strategic supplier concentration — ensuring that no single supplier accounts for an unacceptable proportion of critical supply, and diversification is actively pursued?',
        qAr: 'ما مدى استباقيتكم في إدارة مخاطر تركّز الموردين الاستراتيجيين — مما يضمن عدم استحواذ مورد واحد على نسبة غير مقبولة من الإمداد الحرج، وأن التنويع يُتابَع بفاعلية؟',
        levels: [
          'Supplier concentration risk is not tracked. The organisation has no visibility of what proportion of critical supply is sourced from individual suppliers or regions.',
          'Some awareness of high-concentration categories exists informally, but concentration levels are not measured against defined risk thresholds or formally managed.',
          'Supplier concentration is measured annually for critical categories; categories where a single supplier exceeds 70% of supply are flagged for review and risk mitigation consideration.',
          'A formal supplier concentration policy defines acceptable concentration thresholds; categories exceeding the threshold trigger mandatory sourcing diversification plans with defined timelines and progress reviewed quarterly.',
          'A live supplier concentration dashboard tracks concentration levels by category, supplier, and country; categories approaching risk thresholds trigger automated alerts; a board-approved concentration policy defines maximum concentration limits, and plans to reduce concentration above the limit are approved and tracked at executive risk committee level.',
        ],
        levelsAr: [
          'مخاطر تركّز الموردين لا تُتابَع. ليس لدى المؤسسة أي رؤية لنسبة الإمداد الحرج المستمَدة من الموردين أو المناطق الفردية.',
          'يوجد بعض الوعي غير الرسمي بالفئات عالية التركّز، لكن مستويات التركّز لا تُقاس مقابل عتبات مخاطر محددة ولا تُدار رسميًا.',
          'يُقاس تركّز الموردين سنويًا للفئات الحرجة؛ والفئات التي يتجاوز فيها مورد واحد 70% من الإمداد تُبلَّغ للمراجعة وتُنظَر في تخفيف المخاطر.',
          'سياسة رسمية لتركّز الموردين تُحدّد حدود تركّز مقبولة؛ والفئات التي تتجاوز الحد تُطلق خطط تنويع توريد إلزامية بجداول زمنية محددة والتقدم يُراجَع فصليًا.',
          'لوحة معلومات حية لتركّز الموردين تتابع مستويات التركّز حسب الفئة والمورد والدولة؛ والفئات التي تقترب من عتبات المخاطر تُطلق تنبيهات آلية؛ وسياسة تركّز معتمدة من مجلس الإدارة تُحدّد حدودًا قصوى للتركّز وخطط لتخفيض التركّز فوق الحد معتمدة ومتابَعة على مستوى لجنة المخاطر التنفيذية.',
        ],
      },
    ],
  },

  /* ── 4-5  Regulatory & Compliance Risk ──────────────────────────────────── */
  {
    id: 'risk-regulatory',
    title: 'Regulatory & Compliance Risk',
    titleAr: 'المخاطر التنظيمية ومخاطر الامتثال',
    hint: 'Assesses the management of supply chain regulatory and compliance risks — including customs and trade compliance, anti-bribery, sanctions screening, and sector-specific regulations.',
    hintAr: 'يقيم إدارة المخاطر التنظيمية ومخاطر الامتثال في سلسلة الإمداد — بما في ذلك الامتثال الجمركي والتجاري ومكافحة الرشوة وفحص العقوبات واللوائح الخاصة بالقطاع.',
    benchmarks: { gcc: 2.1, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.5, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.5, technology: 1.0, banking: 1.5, other: 1.0,
    },
    evidence: {
      label: 'Regulatory compliance framework or trade compliance policy',
      labelAr: 'إطار الامتثال التنظيمي أو سياسة الامتثال التجاري',
      hint: 'Upload your trade compliance policy, sanctions screening process, or supply chain regulatory risk assessment.',
      hintAr: 'ارفع سياسة الامتثال التجاري أو عملية فحص العقوبات أو تقييم مخاطر تنظيمية لسلسلة الإمداد.',
    },
    questions: [
      {
        q: 'How comprehensively and consistently are supply chain regulatory compliance obligations managed — including customs, trade controls, sanctions screening, and sector-specific requirements?',
        qAr: 'ما مدى شمولية واتساق إدارة التزامات الامتثال التنظيمي في سلسلة الإمداد — بما في ذلك الجمارك وضوابط التجارة وفحص العقوبات والمتطلبات الخاصة بالقطاع؟',
        levels: [
          'Supply chain regulatory compliance is not formally managed. The organisation has no systematic process for identifying, tracking, or ensuring compliance with applicable trade, customs, or sector-specific regulations.',
          'Some awareness of key regulatory requirements exists informally, but compliance monitoring is inconsistent and there is no structured process for tracking regulatory changes or supplier compliance.',
          'A defined regulatory compliance process covers key obligations (customs, trade controls, sanctions) for critical supply routes and sectors; compliance is reviewed annually.',
          'All significant regulatory compliance obligations are formally tracked; a compliance calendar monitors all key deadlines; sanctions screening is conducted before new supplier approval; sector-specific requirements are reviewed quarterly.',
          'A comprehensive supply chain regulatory compliance programme covers all applicable trade, customs, sanctions, anti-bribery, and sector-specific regulations; automated sanctions screening is integrated into supplier onboarding and payment flows; regulatory change monitoring alerts the compliance team when new rules apply; compliance status is reported to the executive risk committee quarterly.',
        ],
        levelsAr: [
          'الامتثال التنظيمي لسلسلة الإمداد لا يُدار رسميًا. ليس لدى المؤسسة عملية منهجية لتحديد أو متابعة أو ضمان الامتثال للوائح التجارة والجمارك والقطاع المنطبقة.',
          'يوجد بعض الوعي غير الرسمي بالمتطلبات التنظيمية الرئيسية، لكن مراقبة الامتثال غير متسقة ولا توجد عملية منظمة لتتبّع التغييرات التنظيمية أو امتثال الموردين.',
          'عملية امتثال تنظيمي محددة تغطي الالتزامات الرئيسية (الجمارك وضوابط التجارة والعقوبات) لمسارات الإمداد والقطاعات الحرجة؛ والامتثال يُراجَع سنويًا.',
          'جميع التزامات الامتثال التنظيمي الجوهرية تُتابَع رسميًا؛ وتقويم امتثال يراقب جميع المواعيد الرئيسية؛ وفحص العقوبات يُجرى قبل اعتماد المورد الجديد؛ والمتطلبات الخاصة بالقطاع تُراجَع فصليًا.',
          'برنامج شامل للامتثال التنظيمي لسلسلة الإمداد يغطي جميع لوائح التجارة والجمارك والعقوبات ومكافحة الرشوة والقطاع المنطبقة؛ وفحص العقوبات الآلي مدمَج في مسارات ضمّ الموردين والمدفوعات؛ ومراقبة التغييرات التنظيمية تُنبّه فريق الامتثال عند تطبيق قواعد جديدة؛ وحالة الامتثال تُرفَع للجنة المخاطر التنفيذية فصليًا.',
        ],
      },
      {
        q: 'How effectively are anti-corruption, anti-bribery, and modern slavery risks managed within the supply chain — including supplier due diligence, policy requirements, and training?',
        qAr: 'ما مدى فعالية إدارة مخاطر مكافحة الفساد والرشوة والعبودية الحديثة في سلسلة الإمداد — بما في ذلك العناية الواجبة للموردين ومتطلبات السياسات والتدريب؟',
        levels: [
          'Anti-corruption and modern slavery risks in the supply chain are not formally managed. No supplier due diligence process, code of conduct, or compliance policy exists.',
          'A code of conduct covering anti-corruption and ethical standards exists but is not consistently distributed to suppliers or enforced through due diligence or monitoring.',
          'All significant suppliers are required to sign an anti-corruption and ethical conduct code; self-assessment questionnaires are used for high-risk suppliers.',
          'A structured supply chain integrity programme covers all significant suppliers with risk-based due diligence, mandatory code of conduct adherence, contractual compliance clauses, and periodic training for procurement staff.',
          'A comprehensive supply chain integrity programme uses risk-based due diligence, third-party screening, mandatory ethical code adherence, whistleblowing channels, annual training for procurement staff, and modern slavery supply chain mapping — reviewed annually and reported to the board audit committee.',
        ],
        levelsAr: [
          'مخاطر مكافحة الفساد والرشوة والعبودية الحديثة في سلسلة الإمداد لا تُدار رسميًا. لا توجد عملية عناية واجبة للموردين أو ميثاق سلوك أو سياسة امتثال.',
          'ميثاق سلوك يغطي مكافحة الفساد والمعايير الأخلاقية موجود لكنه لا يُوزَّع باتساق على الموردين ولا يُنفَّذ عبر العناية الواجبة أو المراقبة.',
          'جميع الموردين الجوهريين مُطالَبون بتوقيع ميثاق مكافحة الفساد والسلوك الأخلاقي؛ واستبيانات التقييم الذاتي تُستخدَم للموردين ذوي المخاطر العالية.',
          'برنامج منظم لنزاهة سلسلة الإمداد يغطي جميع الموردين الجوهريين بعناية واجبة قائمة على المخاطر والالتزام الإلزامي بميثاق السلوك وبنود امتثال تعاقدية وتدريب دوري لموظفي المشتريات.',
          'برنامج شامل لنزاهة سلسلة الإمداد يستخدم عناية واجبة قائمة على المخاطر وفحص من جهات خارجية والالتزام الإلزامي بميثاق أخلاقي وقنوات للإبلاغ عن المخالفات وتدريبًا سنويًا لموظفي المشتريات ورسمًا لسلسلة إمداد العبودية الحديثة — يُراجَع سنويًا ويُرفَع للجنة تدقيق مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively do you monitor and respond to changes in trade regulations, tariffs, sanctions, and import/export controls that could affect your supply chain sourcing or cost base?',
        qAr: 'ما مدى فعالية مراقبتكم والاستجابة لتغييرات لوائح التجارة والتعريفات والعقوبات وضوابط الاستيراد/التصدير التي قد تؤثر في توريد سلسلة الإمداد أو قاعدة التكلفة؟',
        levels: [
          'Trade regulation changes are not monitored. The organisation discovers changes in tariffs, sanctions, or import restrictions only when they cause an operational problem or a financial impact.',
          'Some awareness of major regulatory changes exists (e.g., through trade associations) but there is no structured monitoring process and the supply chain impact of regulatory changes is not systematically assessed.',
          'A basic regulatory monitoring process tracks major trade regulation changes relevant to key sourcing countries; potential impacts are assessed and reported to procurement leadership.',
          'A structured regulatory monitoring programme tracks all relevant trade, tariff, and sanctions changes for all significant sourcing countries; impact assessments are completed within 30 days and procurement decisions are adjusted accordingly.',
          'Dedicated trade regulatory intelligence — using third-party monitoring services — tracks all relevant trade regulation, tariff, and sanctions changes in real time; impact assessments are completed within 14 days; procurement response plans are pre-approved for high-probability regulatory scenarios; the compliance team briefs the executive committee quarterly on the regulatory outlook.',
        ],
        levelsAr: [
          'تغييرات اللوائح التجارية لا تُراقَب. لا تكتشف المؤسسة التغييرات في التعريفات أو العقوبات أو قيود الاستيراد إلا عند تسببها في مشكلة تشغيلية أو أثر مالي.',
          'يوجد بعض الوعي بالتغييرات التنظيمية الكبرى (مثلًا عبر الجمعيات التجارية) لكن لا توجد عملية مراقبة منظمة ولا يُقيَّم بشكل منهجي الأثر على سلسلة الإمداد من التغييرات التنظيمية.',
          'عملية مراقبة تنظيمية أساسية تتابع التغييرات الكبرى في اللوائح التجارية ذات الصلة بدول التوريد الرئيسية؛ والآثار المحتملة تُقيَّم وتُرفَع لقيادة المشتريات.',
          'برنامج مراقبة تنظيمية منظم يتابع جميع التغييرات ذات الصلة في التجارة والتعريفات والعقوبات لجميع دول التوريد الجوهرية؛ وتقييمات الأثر تُنجَز خلال 30 يومًا وقرارات المشتريات تُعدَّل وفق ذلك.',
          'استخبارات تنظيمية تجارية متخصصة — باستخدام خدمات مراقبة من جهات خارجية — تتابع آنيًا جميع التغييرات ذات الصلة في لوائح التجارة والتعريفات والعقوبات؛ وتقييمات الأثر تُنجَز خلال 14 يومًا؛ وخطط استجابة المشتريات معتمدة مسبقًا للسيناريوهات التنظيمية ذات الاحتمالية العالية؛ وفريق الامتثال يُحيط اللجنة التنفيذية فصليًا بالتوقعات التنظيمية.',
        ],
      },
    ],
  },
];
