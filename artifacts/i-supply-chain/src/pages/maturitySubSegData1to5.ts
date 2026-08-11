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
  /** 1–4 industry framework/standard abbreviations most relevant to this sub-segment */
  frameworks?: string[];
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
  /* ── 0-0  Strategic Alignment ─────────────────────────────────────── */
  {
    id: 'strategy-align',
    title: 'Strategic Alignment',
    titleAr: 'المواءمة الاستراتيجية',
    hint: 'Assesses whether the supply chain strategy is a real, board-owned instrument that actually shapes decisions at every level — not whether a strategy document exists in a drawer somewhere.',
    hintAr: 'يقيس مدى توثيق استراتيجية سلسلة الإمداد رسميًا وارتباطها الصريح بالأهداف المؤسسية وملكيتها على مستوى مجلس الإدارة.',
    benchmarks: { gcc: 2.2, topQuartile: 3.9 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Board-approved supply chain strategy document (most recent version)',
      labelAr: 'وثيقة استراتيجية سلسلة الإمداد',
      hint: 'Upload board-approved supply chain strategy document (most recent version).',
      hintAr: 'ارفع وثيقة استراتيجية سلسلة الإمداد (معتمدة من مجلس الإدارة، خلال آخر 12 شهرًا).',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How clearly is your supply chain strategy documented and explicitly linked to the organisation\'s corporate strategic objectives?',
        qAr: 'ما مدى وضوح توثيق استراتيجية سلسلة الإمداد لديكم وارتباطها الصريح بالأهداف الاستراتيجية للمؤسسة؟',
        levels: [
          'No supply chain strategy document exists. The function operates from tacit knowledge and day-to-day operational instinct, with no documented direction and no visible link to corporate goals.',
          'A strategy exists in outline form (a slide deck or a short memo) but is not formally approved, rarely referenced in decisions, and its connection to corporate objectives is implied rather than stated.',
          'A formal, written supply chain strategy exists, is approved by senior management, and explicitly states how it supports 2–3 named corporate objectives (e.g. cost leadership, Vision 2030 localisation targets, service differentiation).',
          'The strategy is board-approved, reviewed on a fixed cycle (typically annually), and major supply chain investment or restructuring decisions are traceably justified against it.',
          'The strategy is a living document actively used by the board and C-suite to stress-test major business decisions (M&A, new market entry, capacity expansion) before they are finalised — supply chain strategy shapes corporate strategy, not just the reverse.',
        ],
        levelsAr: [
          'لا توجد وثيقة استراتيجية لسلسلة الإمداد. تعمل الوظيفة اعتمادًا على المعرفة الضمنية والفطرة التشغيلية اليومية، دون توجه موثّق أو ارتباط واضح بأهداف المؤسسة.',
          'توجد استراتيجية بشكل مبدئي (عرض تقديمي أو مذكرة مختصرة) لكنها غير معتمدة رسميًا، ونادرًا ما يُرجَع إليها في القرارات، وارتباطها بالأهداف المؤسسية ضمني وليس صريحًا.',
          'توجد استراتيجية موثّقة رسميًا ومعتمدة من الإدارة العليا، وتوضّح صراحةً كيفية دعمها لهدفين أو ثلاثة أهداف مؤسسية محددة (مثل قيادة التكلفة، مستهدفات التوطين ضمن رؤية 2030، أو تمايز الخدمة).',
          'الاستراتيجية معتمدة من مجلس الإدارة، وتُراجَع وفق دورة ثابتة (سنويًا عادةً)، وتُبرَّر القرارات الكبرى للاستثمار أو إعادة الهيكلة في سلسلة الإمداد استنادًا إليها بشكل قابل للتتبع.',
          'الاستراتيجية وثيقة حيّة يستخدمها المجلس والإدارة التنفيذية العليا لاختبار القرارات المؤسسية الكبرى (الاستحواذ، دخول أسواق جديدة، التوسع في الطاقة الإنتاجية) قبل اعتمادها — بحيث تُسهم استراتيجية سلسلة الإمداد في تشكيل الاستراتيجية المؤسسية وليس العكس فقط.',
        ],
      },
      {
        q: 'Who owns the supply chain strategy, and how actively does that ownership translate into resourcing and accountability?',
        qAr: 'مَن يمتلك ملكية استراتيجية سلسلة الإمداد، وإلى أي مدى تترجم هذه الملكية إلى تخصيص موارد ومساءلة فعلية؟',
        levels: [
          'No named owner. Strategic questions about the supply chain are answered ad hoc by whichever manager is available.',
          'A functional head (e.g. Head of Procurement or Logistics Manager) is informally regarded as the owner, but has no mandate or budget authority to act on strategic priorities beyond their own department.',
          'A named senior owner (CPO, VP Supply Chain, or equivalent) exists with a documented mandate and a ring-fenced budget line for strategic initiatives.',
          'The strategy owner sits on, or reports directly and regularly to, the executive committee, and strategic supply chain KPIs are a standing item on that committee\'s agenda.',
          'Supply chain strategy ownership sits at board level (a board member or board committee holds explicit oversight), with the strategy owner personally accountable for board-level KPIs tied to enterprise value, not just functional efficiency.',
        ],
        levelsAr: [
          'لا يوجد مالك محدد. تُجاب الأسئلة الاستراتيجية المتعلقة بسلسلة الإمداد بشكل عشوائي من قِبل أي مدير متاح.',
          'يُعتبر أحد رؤساء الوظائف (مثل رئيس المشتريات أو مدير الخدمات اللوجستية) مالكًا بشكل غير رسمي، دون تفويض أو صلاحية موازنة للتصرف بشأن الأولويات الاستراتيجية خارج نطاق قسمه.',
          'يوجد مالك أول محدد بالاسم (رئيس المشتريات، نائب رئيس سلسلة الإمداد، أو ما يعادلهما) بتفويض موثّق وبند موازنة مخصص للمبادرات الاستراتيجية.',
          'يشارك مالك الاستراتيجية في اللجنة التنفيذية أو يرفع تقاريره إليها مباشرة وبانتظام، وتُعدّ مؤشرات الأداء الاستراتيجية لسلسلة الإمداد بندًا ثابتًا في جدول أعمال تلك اللجنة.',
          'تكون ملكية استراتيجية سلسلة الإمداد على مستوى مجلس الإدارة (عضو مجلس أو لجنة تابعة له تتولى الإشراف الصريح)، ويكون مالك الاستراتيجية مسؤولًا شخصيًا عن مؤشرات أداء على مستوى المجلس مرتبطة بقيمة المؤسسة وليس فقط بالكفاءة الوظيفية.',
        ],
      },
      {
        q: 'How effectively does the supply chain strategy cascade into functional scorecards, annual operating plans, and mid-term (1–2 year) roadmaps that functional managers actually use?',
        qAr: 'ما مدى فعالية ترجمة استراتيجية سلسلة الإمداد إلى بطاقات أداء وظيفية وخطط تشغيلية سنوية وخرائط طريق متوسطة المدى (1–2 سنة) يستخدمها المديرون الوظيفيون فعليًا؟',
        levels: [
          'No cascade exists. Functional teams set their own annual priorities independently of any stated supply chain strategy.',
          'Some functions (typically procurement) loosely reference the strategy when setting goals, but there is no consistent mechanism translating it across all functions.',
          'A documented cascade process exists: each function (procurement, logistics, planning, warehousing) has an annual operating plan with objectives explicitly derived from the strategy.',
          'Functional scorecards are formally reviewed against the strategy on a quarterly cycle, with documented corrective action when a function\'s plan drifts from strategic priorities.',
          'The cascade is a live, two-way system — functional teams both receive strategic priorities and feed operational reality back up to refine the strategy itself, typically through a formal IBP/S&OP rhythm.',
        ],
        levelsAr: [
          'لا يوجد أي تسلسل تنازلي. تحدّد الفرق الوظيفية أولوياتها السنوية بشكل مستقل عن أي استراتيجية معلنة لسلسلة الإمداد.',
          'تشير بعض الوظائف (المشتريات عادةً) إلى الاستراتيجية بشكل غير منتظم عند وضع الأهداف، دون آلية متسقة لترجمتها عبر جميع الوظائف.',
          'توجد عملية تسلسل تنازلي موثّقة: لكل وظيفة (المشتريات، اللوجستيات، التخطيط، المستودعات) خطة تشغيلية سنوية بأهداف مشتقة صراحةً من الاستراتيجية.',
          'تُراجَع بطاقات الأداء الوظيفية رسميًا مقابل الاستراتيجية على دورة ربع سنوية، مع إجراءات تصحيحية موثّقة عند انحراف خطة أي وظيفة عن الأولويات الاستراتيجية.',
          'التسلسل التنازلي نظام حيّ ثنائي الاتجاه — تتلقى الفرق الوظيفية الأولويات الاستراتيجية وتغذّي في الوقت نفسه الواقع التشغيلي صعودًا لتحسين الاستراتيجية ذاتها، عادةً عبر إيقاع رسمي لتخطيط المبيعات والعمليات (S&OP/IBP).',
        ],
      },
      {
        q: 'How well do adjacent functions outside supply chain (Sales, Finance, Manufacturing) understand and actively commit resources to the supply chain strategy\'s priorities?',
        qAr: 'إلى أي درجة تفهم الوظائف المجاورة خارج سلسلة الإمداد (المبيعات، المالية، التصنيع) أولويات استراتيجية سلسلة الإمداد وتلتزم فعليًا بتخصيص موارد لها؟',
        levels: [
          'Other functions are unaware the supply chain strategy exists; conflicts (e.g. Sales promising delivery terms Supply Chain cannot support) are resolved case-by-case with no reference to strategy.',
          'Other functions have heard of the strategy\'s headline goals but do not factor them into their own planning or resource allocation.',
          'Formal touchpoints exist (e.g. a joint S&OP meeting, a shared planning calendar) where Sales, Finance, and Manufacturing engage with supply chain priorities at defined intervals.',
          'Cross-functional resource commitments to supply chain strategic initiatives are written into other functions\' own annual plans and performance objectives, not just supply chain\'s.',
          'Cross-functional leaders are jointly and formally accountable (shared KPIs, joint incentive structures) for supply chain strategic outcomes — the strategy is genuinely owned enterprise-wide, not defended by Supply Chain alone.',
        ],
        levelsAr: [
          'الوظائف الأخرى غير مدركة لوجود استراتيجية سلسلة الإمداد؛ تُحلّ التعارضات (مثل التزام المبيعات بشروط تسليم لا تستطيع سلسلة الإمداد الوفاء بها) بشكل فردي دون الرجوع إلى الاستراتيجية.',
          'تكون الوظائف الأخرى على علم بالأهداف الرئيسية للاستراتيجية لكنها لا تُدرجها ضمن تخطيطها أو تخصيص مواردها.',
          'توجد نقاط تواصل رسمية (مثل اجتماع مشترك لتخطيط المبيعات والعمليات، أو تقويم تخطيط مشترك) تتفاعل خلالها المبيعات والمالية والتصنيع مع أولويات سلسلة الإمداد على فترات محددة.',
          'تُدرَج التزامات الموارد المشتركة بين الوظائف تجاه المبادرات الاستراتيجية لسلسلة الإمداد ضمن الخطط السنوية وأهداف الأداء الخاصة بالوظائف الأخرى، وليس فقط ضمن خطط سلسلة الإمداد.',
          'يتحمّل قادة الوظائف المختلفة مسؤولية مشتركة ورسمية (مؤشرات أداء مشتركة، هياكل حوافز مشتركة) عن النتائج الاستراتيجية لسلسلة الإمداد — بحيث تكون الاستراتيجية مملوكة فعليًا على مستوى المؤسسة ككل، لا مسؤولية سلسلة الإمداد وحدها.',
        ],
      },
      {
        q: 'When frontline staff make day-to-day sourcing, expediting, or inventory decisions, how consistently can those decisions be traced back to stated strategic priorities?',
        qAr: 'عندما يتخذ موظفو الخط الأمامي قرارات يومية تتعلق بالتوريد أو التعجيل أو المخزون، إلى أي درجة يمكن ربط تلك القرارات بشكل متسق بالأولويات الاستراتيجية المعلنة؟',
        levels: [
          'Frontline decisions are made purely on immediate operational pressure (lowest price, fastest delivery) with no reference to strategic priorities such as supplier consolidation or localisation targets.',
          'Frontline staff are generally aware of strategic priorities but have no practical tools or guidance to apply them in daily decisions, so application is inconsistent and person-dependent.',
          'Documented decision guidelines exist that translate strategic priorities into practical criteria (e.g. a supplier selection matrix weighted toward strategic priorities) for frontline use.',
          'Frontline decision tools (sourcing matrices, approval workflows) are embedded in the ERP/procurement system itself, so strategic alignment is enforced systematically rather than left to individual judgement.',
          'Real-time analytics flag when frontline decisions are trending away from strategic priorities (e.g. spend leaking to non-strategic suppliers), triggering automatic escalation before the deviation becomes material.',
        ],
        levelsAr: [
          'تُتخذ قرارات الخط الأمامي بناءً على الضغط التشغيلي الفوري فقط (أقل سعر، أسرع تسليم) دون أي اعتبار للأولويات الاستراتيجية مثل توحيد الموردين أو مستهدفات التوطين.',
          'يكون موظفو الخط الأمامي على دراية عامة بالأولويات الاستراتيجية لكن دون أدوات أو إرشادات عملية لتطبيقها في القرارات اليومية، ما يجعل التطبيق غير متسق ومرتبطًا بالأفراد.',
          'توجد إرشادات قرار موثّقة تترجم الأولويات الاستراتيجية إلى معايير عملية (مثل مصفوفة اختيار موردين مرجّحة وفق الأولويات الاستراتيجية) لاستخدام الخط الأمامي.',
          'تكون أدوات قرار الخط الأمامي (مصفوفات التوريد، مسارات الاعتماد) مضمّنة داخل نظام تخطيط الموارد المؤسسية/المشتريات ذاته، بحيث تُفرَض المواءمة الاستراتيجية بشكل منهجي وليس متروكة للتقدير الفردي.',
          'تُنبّه التحليلات الآنية عند اتجاه قرارات الخط الأمامي بعيدًا عن الأولويات الاستراتيجية (مثل تسرّب الإنفاق نحو موردين غير استراتيجيين)، مع تصعيد تلقائي قبل أن يصبح الانحراف جوهريًا.',
        ],
      },
      {
        q: 'How is a departure from strategic direction at the operational level identified, escalated, and corrected in practice?',
        qAr: 'كيف يتم عمليًا تحديد أي انحراف عن التوجه الاستراتيجي على المستوى التشغيلي، وتصعيده، وتصحيحه؟',
        levels: [
          'Deviations are only discovered by accident or in hindsight (e.g. during an annual audit), long after any corrective action could have been timely.',
          'Deviations are sometimes noticed by managers during routine reviews, but there is no formal escalation path or defined response time.',
          'A defined escalation path exists (who is notified, within what timeframe) when operational metrics deviate materially from strategic targets.',
          'Deviation thresholds are quantified and monitored on a live dashboard, with root-cause analysis mandatory for any threshold breach.',
          'Deviation correction is closed-loop: root-cause findings automatically feed back into the tactical cascade (Q3) and, where the deviation reveals a genuine strategic gap, into the strategy review cycle itself (Q1).',
        ],
        levelsAr: [
          'لا تُكتشف الانحرافات إلا بالصدفة أو بأثر رجعي (مثل أثناء تدقيق سنوي)، بعد فوات وقت طويل على إمكانية اتخاذ إجراء تصحيحي في وقته.',
          'يلاحظ المديرون الانحرافات أحيانًا أثناء المراجعات الروتينية، لكن دون مسار تصعيد رسمي أو وقت استجابة محدد.',
          'يوجد مسار تصعيد محدد (من يُبلَّغ وخلال أي إطار زمني) عند انحراف المؤشرات التشغيلية بشكل جوهري عن المستهدفات الاستراتيجية.',
          'تكون حدود الانحراف مُحدَّدة كميًا ومُراقَبة عبر لوحة بيانات حيّة، مع إلزامية تحليل السبب الجذري عند أي تجاوز لتلك الحدود.',
          'تصحيح الانحراف نظام مغلق الحلقة: تُغذّي نتائج تحليل السبب الجذري التسلسل التنازلي التكتيكي (س3) تلقائيًا، وحين يكشف الانحراف عن فجوة استراتيجية حقيقية، تُغذّي دورة مراجعة الاستراتيجية ذاتها (س1).',
        ],
      },
      {
        q: 'How well does governance separate the individuals who set supply chain strategy from those with final authority to approve the capital and business cases that strategy subsequently justifies, guarding against self-serving investment decisions?',
        qAr: 'ما مدى فصل الحوكمة بين الأفراد الذين يضعون استراتيجية سلسلة الإمداد وأولئك الذين يملكون الصلاحية النهائية لاعتماد حالات الأعمال ورأس المال التي تُبرّرها تلك الاستراتيجية لاحقًا، للحماية من قرارات استثمار ذات مصلحة ذاتية؟',
        levels: [
          'The same individual or small group both authors the strategy and approves the capital allocated to execute it, with no independent check at any stage.',
          'A separate sign-off step exists on paper, but the approver rarely challenges the strategy owner\'s business case in practice.',
          'Strategy authorship and capital/business-case approval are formally assigned to separate roles, with the approver required to review underlying assumptions before signing.',
          'Segregation of duties is enforced through the governance/approval workflow itself, and an independent finance or strategy-office review validates key assumptions before any major capital ask reaches the board.',
          'Segregation controls are periodically tested (e.g. internal audit review of strategy-to-capital decision trails) to confirm they cannot be bypassed, and outcomes of approved business cases are tracked back to the strategy owner as an accountability measure.',
        ],
        levelsAr: [
          'نفس الفرد أو المجموعة الصغيرة يضع الاستراتيجية ويعتمد رأس المال المخصص لتنفيذها، دون أي تحقق مستقل في أي مرحلة.',
          'توجد خطوة اعتماد منفصلة نظريًا، لكن المُعتمِد نادرًا ما يُشكّك في حالة الأعمال التي يقدّمها مالك الاستراتيجية عمليًا.',
          'صياغة الاستراتيجية واعتماد حالة الأعمال/رأس المال مُسندان رسميًا إلى دورين منفصلين، ويُطلَب من المُعتمِد مراجعة الافتراضات الأساسية قبل التوقيع.',
          'يُنفَّذ فصل المهام عبر مسار الحوكمة/الاعتماد ذاته، وتُراجَع الافتراضات الرئيسية من جهة مستقلة (المالية أو مكتب الاستراتيجية) قبل وصول أي طلب رأسمالي كبير إلى المجلس.',
          'تُختبَر ضوابط الفصل دوريًا (مثل مراجعة التدقيق الداخلي لمسار القرارات من الاستراتيجية إلى رأس المال) للتأكد من استحالة تجاوزها، وتُتابَع نتائج حالات الأعمال المعتمدة وتُربَط بمالك الاستراتيجية كمقياس مساءلة.',
        ],
      },
      {
        q: 'How automated is the tracking of progress against stated strategic objectives — live data feeding a scorecard — versus a manually compiled slide updated ahead of each leadership meeting?',
        qAr: 'ما مدى أتمتة تتبّع التقدم مقابل الأهداف الاستراتيجية المعلنة — بيانات حيّة تُغذّي بطاقة أداء — مقابل شريحة عرض تُجمَّع يدويًا قبل كل اجتماع قيادي؟',
        levels: [
          'Progress against the strategy is not tracked in any structured way; updates, if given, are anecdotal.',
          'A slide or spreadsheet is manually updated ahead of leadership meetings, pulling numbers from disparate sources with no consistent method.',
          'A defined scorecard template with a standard set of strategic KPIs is populated on a fixed monthly or quarterly cycle.',
          'The strategic scorecard pulls most metrics automatically from underlying systems (ERP, S&OP, finance), reducing manual compilation to genuine judgement inputs only.',
          'A live, integrated strategy dashboard updates in near real time, automatically flags objectives trending off-track, and routes an alert to the accountable owner before the next scheduled review.',
        ],
        levelsAr: [
          'لا يُتابَع التقدم مقابل الاستراتيجية بأي طريقة منظمة؛ والتحديثات، إن قُدِّمت، تكون سردية غير موثّقة.',
          'تُحدَّث شريحة أو جدول بيانات يدويًا قبل الاجتماعات القيادية، بسحب أرقام من مصادر متفرقة دون منهجية متسقة.',
          'بطاقة أداء موحّدة بمجموعة معيارية من المؤشرات الاستراتيجية تُملأ وفق دورة شهرية أو ربع سنوية ثابتة.',
          'تسحب بطاقة الأداء الاستراتيجية معظم المؤشرات آليًا من الأنظمة الأساسية (تخطيط الموارد، S&OP، المالية)، مما يقلّص التجميع اليدوي إلى مدخلات الحكم الحقيقية فقط.',
          'لوحة استراتيجية حيّة ومتكاملة تُحدَّث شبه آنيًا، وتُنبّه تلقائيًا عند انحراف أي هدف عن مساره، وتُرسل تنبيهًا للمالك المسؤول قبل موعد المراجعة المجدولة التالي.',
        ],
      },
      {
        q: 'How explicitly does the supply chain strategy formally incorporate applicable regulatory and national policy mandates (Vision 2030 localisation/Iktva-type targets, Saudization/Emiratisation-type workforce requirements, trade and customs compliance) as binding design constraints rather than optional considerations?',
        qAr: 'ما مدى وضوح دمج استراتيجية سلسلة الإمداد للمتطلبات التنظيمية والسياسات الوطنية السارية (مستهدفات التوطين ضمن رؤية 2030/اكتفاء، متطلبات توطين القوى العاملة، الامتثال التجاري والجمركي) كقيود تصميم إلزامية لا اعتبارات اختيارية؟',
        levels: [
          'The strategy is written without reference to national policy or regulatory mandates; compliance is handled reactively, elsewhere, if at all.',
          'National policy targets are mentioned qualitatively in the strategy document but carry no quantified target or accountable owner.',
          'The strategy states specific, quantified national-policy targets (e.g. a defined local-content percentage) with an assigned owner and review point.',
          'Regulatory/national-policy targets are formally validated by legal/compliance as part of strategy sign-off and are tracked as standing KPIs alongside commercial objectives.',
          'Regulatory and national-policy performance is tracked over time, reported to the board alongside commercial KPIs, and feeds directly into the next strategy refresh cycle as a governance input, not a one-time compliance check.',
        ],
        levelsAr: [
          'تُكتَب الاستراتيجية دون الإشارة إلى السياسات الوطنية أو المتطلبات التنظيمية؛ ويُعالَج الامتثال بشكل تفاعلي في مكان آخر، إن حدث أصلاً.',
          'تُذكَر مستهدفات السياسة الوطنية نوعيًا في وثيقة الاستراتيجية لكن دون هدف كمي أو مالك مسؤول.',
          'تنص الاستراتيجية على مستهدفات سياسة وطنية محددة وكمية (مثل نسبة محتوى محلي محددة) بمالك معيّن ونقطة مراجعة.',
          'تُتحقَّق جهة القانونية/الامتثال رسميًا من مستهدفات السياسة التنظيمية/الوطنية كجزء من اعتماد الاستراتيجية، وتُتابَع كمؤشرات أداء ثابتة إلى جانب الأهداف التجارية.',
          'يُتابَع أداء الامتثال التنظيمي والسياسة الوطنية عبر الزمن، ويُرفَع للمجلس إلى جانب المؤشرات التجارية، ويُغذّي مباشرةً دورة تحديث الاستراتيجية التالية كمُدخَل حوكمة، لا فحص امتثال لمرة واحدة.',
        ],
      },
      {
        q: 'Is the strategy resilient to leadership turnover or a major external shock — is there a formal mechanism to stress-test and, where necessary, revise strategic direction when conditions change materially, rather than the strategy simply lapsing with its owner?',
        qAr: 'هل تصمد الاستراتيجية أمام تغيّر القيادة أو صدمة خارجية كبرى — وهل توجد آلية رسمية لاختبار التوجه الاستراتيجي تحت الضغط وتعديله عند الحاجة حين تتغيّر الظروف جوهريًا، بدلاً من سقوطها ببساطة برحيل صاحبها؟',
        levels: [
          'The strategy is closely tied to its author; when that person leaves or a major shock hits, the strategy is effectively abandoned until someone eventually writes a new one.',
          'The strategy document survives leadership change but is not actively revisited; it is assumed to still hold until someone notices it no longer fits reality.',
          'A defined process requires the strategy to be formally re-validated whenever there is a change of strategy owner or a materially significant external event.',
          'The strategy is periodically stress-tested against defined disruption scenarios (leadership exit, major market shock, regulatory change) as part of the annual review, with documented resilience findings.',
          'Strategic continuity is a formally governed discipline: succession planning for the strategy owner, a documented handover pack, and a board-agreed trigger mechanism ensure the strategy is actively revised — not just preserved — whenever a material shock occurs.',
        ],
        levelsAr: [
          'ترتبط الاستراتيجية ارتباطًا وثيقًا بواضعها؛ وعند مغادرته أو وقوع صدمة كبرى، تُهجَر الاستراتيجية فعليًا إلى أن يكتب أحدهم واحدة جديدة في النهاية.',
          'تبقى وثيقة الاستراتيجية بعد تغيّر القيادة لكن لا يُعاد النظر فيها بفاعلية؛ ويُفترَض أنها ما زالت سارية إلى أن يلاحظ أحدهم أنها لم تعد تناسب الواقع.',
          'عملية محددة تستلزم إعادة التحقق الرسمي من الاستراتيجية عند أي تغيّر في مالكها أو وقوع حدث خارجي جوهري.',
          'تُختبَر الاستراتيجية دوريًا تحت الضغط مقابل سيناريوهات اضطراب محددة (مغادرة القيادة، صدمة سوقية كبرى، تغيّر تنظيمي) كجزء من المراجعة السنوية، مع نتائج مرونة موثّقة.',
          'استمرارية الاستراتيجية انضباط محوكَم رسميًا: تخطيط تعاقب لمالك الاستراتيجية، وحزمة تسليم موثّقة، وآلية تحفيز مُتَّفَق عليها من المجلس تضمن تعديل الاستراتيجية فعليًا — لا مجرد الحفاظ عليها — عند وقوع أي صدمة جوهرية.',
        ],
      },
    ],
  },

  /* ── 0-1  Network Design & Footprint ─────────────────────────────────────── */
  {
    id: 'strategy-network',
    title: 'Network Design & Footprint',
    titleAr: 'تصميم الشبكة والنطاق التشغيلي',
    hint: 'Assesses whether the physical network (facilities, distribution channels, transport lanes) is the product of deliberate, resilience-aware design — not historical accident — and whether it\'s actually operated the way it was designed.',
    hintAr: 'يقيس مدى صرامة وتكرار مراجعات تصميم شبكة سلسلة الإمداد، بما في ذلك مواقع المنشآت ومسارات النقل ونماذج التوزيع.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.5, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.0, technology: 0.5, banking: 0.5, other: 1.0,
    },
    evidence: {
      label: 'Network design study or footprint review (last 3 years)',
      labelAr: 'دراسة تصميم الشبكة أو مراجعة النطاق التشغيلي',
      hint: 'Upload network design study or footprint review (last 3 years).',
      hintAr: 'ارفع تقرير تصميم الشبكة أو ملخصًا تنفيذيًا لمراجعة النطاق التشغيلي أُجريت خلال السنوات الثلاث الأخيرة.',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How explicitly does your network design account for GCC-specific structural risks — single-port dependency, regional geopolitical chokepoints (e.g. Red Sea/Bab-el-Mandeb routing), and cross-border customs friction — rather than optimising for cost alone?',
        qAr: 'إلى أي درجة يأخذ تصميم شبكتكم بعين الاعتبار المخاطر الهيكلية الخاصة بالخليج — الاعتماد على ميناء واحد، والاختناقات الجيوسياسية الإقليمية (مثل مسارات البحر الأحمر/باب المندب)، واحتكاك الجمارك عبر الحدود — بدلاً من التحسين على أساس التكلفة فقط؟',
        levels: [
          'Network footprint reflects historical decisions never re-evaluated. No consideration of port concentration, routing chokepoints, or cross-border risk has ever been documented.',
          'Leadership is aware single-port or single-route dependency is a risk, but no analysis has quantified the exposure or evaluated alternatives.',
          'A documented assessment identifies single-point-of-failure nodes in the network (ports, border crossings, single facilities) with estimated disruption impact.',
          'Network design actively incorporates dual-port/dual-route strategies for critical flows, with documented trade-offs between cost and resilience presented to leadership.',
          'Resilience-adjusted network design is a standing board input: every major footprint decision is scored on a documented cost-resilience framework specific to GCC chokepoint exposure, reviewed alongside Vision 2030 / national logistics strategy alignment.',
        ],
        levelsAr: [
          'يعكس النطاق الجغرافي للشبكة قرارات تاريخية لم تُعَد تقييمها قط. لم يُوثَّق أي اعتبار لتركّز الموانئ أو اختناقات المسارات أو مخاطر عبور الحدود.',
          'تُدرك القيادة أن الاعتماد على ميناء أو مسار واحد يمثّل خطرًا، لكن لم يُقيَّس هذا التعرّض أو تُقيَّم البدائل بأي تحليل.',
          'يحدّد تقييم موثّق نقاط الفشل الوحيدة في الشبكة (الموانئ، المعابر الحدودية، المنشآت الفردية) مع تقدير أثر الاضطراب.',
          'يدمج تصميم الشبكة بفاعلية استراتيجيات الموانئ/المسارات المزدوجة للتدفقات الحرجة، مع مفاضلات موثّقة بين التكلفة والمرونة تُعرَض على القيادة.',
          'تصميم الشبكة المعدَّل وفق المرونة مدخل ثابت لمجلس الإدارة: يُقيَّم كل قرار جوهري متعلق بنطاق الشبكة الجغرافي وفق إطار موثّق للتكلفة والمرونة خاص بالتعرّض لاختناقات الخليج، ويُراجَع بالتوازي مع التوافق مع رؤية 2030 / الاستراتيجية اللوجستية الوطنية.',
        ],
      },
      {
        q: 'How rigorously are major network footprint decisions (new facility, consolidation, nearshoring) linked to formal capital approval and executive sign-off before commitment?',
        qAr: 'ما مدى صرامة ربط قرارات النطاق الجغرافي الكبرى للشبكة (منشأة جديدة، توحيد، توطين قريب) بالاعتماد الرسمي لرأس المال وموافقة تنفيذية قبل الالتزام؟',
        levels: [
          'Facility and footprint decisions are made at operational manager level with no formal capital review process.',
          'Large decisions eventually reach finance for budget approval, but without a structured business case comparing alternatives.',
          'A standard business case template (cost, service impact, payback) is required for any footprint decision above a defined capital threshold.',
          'Footprint decisions require executive committee sign-off with documented alternatives analysis, including a resilience assessment per Q1.',
          'Board-level approval is mandatory above a defined threshold, with post-implementation review comparing realised outcomes to the original business case at 12 and 24 months.',
        ],
        levelsAr: [
          'تُتخذ قرارات المنشآت والنطاق الجغرافي على مستوى المدير التشغيلي دون عملية رسمية لمراجعة رأس المال.',
          'تصل القرارات الكبرى في النهاية إلى المالية لاعتماد الموازنة، لكن دون حالة أعمال منظمة تقارن البدائل.',
          'يُشترَط نموذج حالة أعمال موحّد (التكلفة، أثر الخدمة، فترة الاسترداد) لأي قرار يتعلق بالنطاق الجغرافي يتجاوز حدًا رأسماليًا محددًا.',
          'تتطلب قرارات النطاق الجغرافي موافقة اللجنة التنفيذية مع تحليل موثّق للبدائل، بما يشمل تقييم المرونة وفق السؤال الأول.',
          'الموافقة على مستوى مجلس الإدارة إلزامية فوق حد محدد، مع مراجعة لاحقة للتنفيذ تقارن النتائج الفعلية بحالة الأعمال الأصلية بعد 12 و24 شهرًا.',
        ],
      },
      {
        q: 'How rigorously and regularly do you review your supply chain network design using structured methodology, against evolving business requirements?',
        qAr: 'ما مدى صرامة وانتظام مراجعتكم لتصميم شبكة سلسلة الإمداد باستخدام منهجية منظمة، مقابل متطلبات الأعمال المتطورة؟',
        levels: [
          'The network has never been formally mapped or reviewed. Facilities and distribution arrangements have never been challenged.',
          'Informal reviews occur reactively when a specific problem forces the issue; no structured methodology or regular cadence exists.',
          'A network review is conducted every 3–5 years with defined scope, though without advanced modelling tools or scenario analysis.',
          'Annual network design reviews apply quantitative modelling to evaluate cost, service level, and risk tradeoffs across the end-to-end network.',
          'Bi-annual reviews use digital twin modelling and multi-scenario simulation to continuously optimise the network footprint; findings directly inform the capital allocation plan.',
        ],
        levelsAr: [
          'لم تُرسَم الشبكة أو تُراجَع رسميًا قط. لم تُتحدَّ ترتيبات المنشآت والتوزيع أبدًا.',
          'تُجرى مراجعات غير رسمية بشكل تفاعلي عند حدوث مشكلة محددة؛ دون منهجية منظمة أو وتيرة منتظمة.',
          'تُجرى مراجعة للشبكة كل 3–5 سنوات بنطاق محدد، لكن دون أدوات نمذجة متقدمة أو تحليل سيناريوهات.',
          'تُطبّق مراجعات سنوية للشبكة النمذجة الكمية لتقييم مفاضلات التكلفة ومستوى الخدمة والمخاطر عبر الشبكة الكاملة.',
          'تستخدم المراجعات نصف السنوية نمذجة التوأم الرقمي ومحاكاة السيناريوهات المتعددة لتحسين النطاق الجغرافي للشبكة باستمرار؛ وتُغذّي النتائج مباشرةً خطة تخصيص رأس المال.',
        ],
      },
      {
        q: 'How well does your network design account for differentiated customer service requirements, last-mile delivery needs, and omnichannel fulfilment expectations by segment?',
        qAr: 'ما مدى مراعاة تصميم شبكتكم لمتطلبات خدمة العملاء المتمايزة واحتياجات التسليم للمرحلة الأخيرة وتوقعات الوفاء متعدد القنوات حسب الشريحة؟',
        levels: [
          'Network design is supply-driven with no consideration of customer segmentation. All customers are served through the same model.',
          'Some informal awareness of key customer service requirements exists, but these are not systematically translated into network design decisions.',
          'Major customer segments are defined and their service requirements are documented and inform network design trade-offs.',
          'Network design explicitly models differentiated service levels by customer tier, with last-mile and omnichannel requirements fully factored in.',
          'Customer segmentation, real-time service level data, and omnichannel fulfilment requirements drive continuous network optimisation; differentiated service commitments are tracked and reported.',
        ],
        levelsAr: [
          'تصميم الشبكة مدفوع بجانب العرض دون اعتبار لتقسيم العملاء. يُخدَم جميع العملاء عبر النموذج ذاته.',
          'يوجد وعي غير رسمي بمتطلبات خدمة العملاء الرئيسيين، لكنها لا تُترجَم بشكل منهجي إلى قرارات تصميم الشبكة.',
          'شرائح العملاء الرئيسية محددة ومتطلبات خدمتها موثّقة وتُغذّي مفاضلات تصميم الشبكة.',
          'تُنمذَج قرارات تصميم الشبكة صراحةً مستويات الخدمة المتمايزة حسب فئة العملاء، مع الأخذ الكامل بمتطلبات المرحلة الأخيرة والقنوات المتعددة.',
          'يقود تقسيم العملاء وبيانات مستوى الخدمة الآنية ومتطلبات الوفاء متعدد القنوات تحسينًا مستمرًا للشبكة؛ والتزامات الخدمة المتمايزة تُتابَع وتُرفَع.',
        ],
      },
      {
        q: 'In day-to-day operations, how consistently are shipments and inventory allocations actually routed according to the designed network, versus ad hoc deviation?',
        qAr: 'في العمليات اليومية، ما مدى اتساق توجيه الشحنات وتخصيصات المخزون فعليًا وفق تصميم الشبكة، مقابل الانحراف العشوائي؟',
        levels: [
          'Routing and allocation decisions are made ad hoc by whoever is handling the shipment, with no reference to the intended network design.',
          'A designed network exists on paper, but operational teams frequently deviate from it under time pressure with no tracking of how often this happens.',
          'Routing guidelines derived from the network design are documented and followed for the majority of standard flows.',
          'Routing/allocation adherence to the designed network is systematically tracked, with deviations flagged and explained in operational reviews.',
          'Routing and allocation are enforced through system logic (TMS/ERP rules) aligned to the designed network; exceptions require documented approval and are analysed for recurring root causes.',
        ],
        levelsAr: [
          'تُتخذ قرارات التوجيه والتخصيص بشكل عشوائي من قِبَل من يتولى الشحنة، دون أي رجوع إلى تصميم الشبكة المقصود.',
          'يوجد تصميم شبكة موثّق نظريًا، لكن الفرق التشغيلية تنحرف عنه بكثرة تحت ضغط الوقت دون تتبّع لمعدل حدوث ذلك.',
          'إرشادات التوجيه المشتقة من تصميم الشبكة موثّقة ومتَّبعة لمعظم التدفقات القياسية.',
          'يُتابَع الالتزام بتوجيه/تخصيص الشبكة المصمَّمة بشكل منهجي، مع رصد الانحرافات وتفسيرها في المراجعات التشغيلية.',
          'يُفرَض التوجيه والتخصيص عبر منطق نظامي (أنظمة إدارة النقل/تخطيط الموارد) متوافق مع تصميم الشبكة؛ وتتطلب الاستثناءات موافقة موثّقة وتُحلَّل لأسبابها الجذرية المتكررة.',
        ],
      },
      {
        q: 'How systematically is actual facility utilisation and transport-lane cost/service performance monitored against the network design\'s original assumptions, with underperformance escalated?',
        qAr: 'ما مدى منهجية متابعة الاستخدام الفعلي للمنشآت وأداء التكلفة/الخدمة لمسارات النقل مقابل افتراضات تصميم الشبكة الأصلية، مع تصعيد التراجع في الأداء؟',
        levels: [
          'Facility utilisation and lane performance are not tracked against the original network design assumptions at all.',
          'Utilisation data exists in operational systems but is never compared back to the network design\'s original assumptions.',
          'Quarterly reports compare actual facility and lane performance to design assumptions, with variances noted.',
          'Underperforming facilities or lanes trigger a formal review with root-cause analysis and a corrective or redesign decision.',
          'Live dashboards track facility and lane performance against design assumptions in real time, automatically flagging structural drift that warrants network redesign before service or cost impact becomes material.',
        ],
        levelsAr: [
          'لا يُتابَع استخدام المنشآت وأداء المسارات مقابل افتراضات تصميم الشبكة الأصلية على الإطلاق.',
          'توجد بيانات الاستخدام في الأنظمة التشغيلية لكنها لا تُقارَن أبدًا بافتراضات تصميم الشبكة الأصلية.',
          'تقارير ربع سنوية تقارن الأداء الفعلي للمنشآت والمسارات بافتراضات التصميم، مع رصد الانحرافات.',
          'تُطلق المنشآت أو المسارات ضعيفة الأداء مراجعة رسمية بتحليل السبب الجذري وقرار تصحيحي أو إعادة تصميم.',
          'لوحات بيانات حيّة تتابع أداء المنشآت والمسارات مقابل افتراضات التصميم آنيًا، وتُنبّه تلقائيًا عند الانحراف الهيكلي الذي يستدعي إعادة تصميم الشبكة قبل أن يصبح الأثر على التكلفة أو الخدمة جوهريًا.',
        ],
      },
      {
        q: 'How well does governance separate the individuals who identify and recommend a specific facility site, port, or logistics partner from those with final authority to approve the commitment — guarding against undisclosed relationships or self-serving site selection?',
        qAr: 'ما مدى فصل الحوكمة بين الأفراد الذين يحددون ويوصون بموقع منشأة أو ميناء أو شريك لوجستي محدد وأولئك الذين يملكون الصلاحية النهائية لاعتماد الالتزام به — للحماية من العلاقات غير المُفصَح عنها أو اختيار الموقع لمصلحة ذاتية؟',
        levels: [
          'The same individual identifies the site, negotiates terms, and signs off the commitment, with no independent review at any stage.',
          'A second signature is technically required, but the approver rarely reviews the underlying site-selection rationale or discloses relevant relationships.',
          'Site recommendation and final approval are formally separated between two roles, with a conflict-of-interest declaration required before sign-off.',
          'Segregation is enforced through the capital-approval workflow itself, and an independent function (finance or internal audit) reviews the site-selection business case before major commitments.',
          'Segregation-of-duties controls are periodically tested, and conflict-of-interest declarations are cross-checked against supplier/landlord ownership data, with findings reported to the audit committee.',
        ],
        levelsAr: [
          'الفرد نفسه يحدد الموقع ويتفاوض على الشروط ويعتمد الالتزام، دون أي مراجعة مستقلة في أي مرحلة.',
          'يُشترط توقيع ثانٍ رسميًا، لكن المُعتمِد نادرًا ما يراجع مبرر اختيار الموقع أو يُفصح عن العلاقات ذات الصلة.',
          'التوصية بالموقع والاعتماد النهائي مفصولان رسميًا بين دورين، مع اشتراط إقرار تضارب مصالح قبل التوقيع.',
          'يُنفَّذ الفصل عبر مسار اعتماد رأس المال ذاته، وتُراجِع جهة مستقلة (المالية أو التدقيق الداخلي) حالة أعمال اختيار الموقع قبل الالتزامات الكبرى.',
          'تُختبَر ضوابط فصل المهام دوريًا، وتُقارَن إقرارات تضارب المصالح ببيانات ملكية الموردين/الملاك، وتُرفَع النتائج للجنة التدقيق.',
        ],
      },
      {
        q: 'How much of facility utilisation, transport-lane cost, and capacity data flows automatically into the network model, versus being manually gathered each time a review is due?',
        qAr: 'ما مدى تدفق بيانات استخدام المنشآت وتكلفة مسارات النقل والسعة آليًا إلى نموذج الشبكة، مقابل جمعها يدويًا في كل مرة تحين فيها المراجعة؟',
        levels: [
          'No system integration exists; every network review starts by manually requesting utilisation and cost data from each facility and carrier.',
          'Some data is available in spreadsheets from prior reviews but is not refreshed automatically and quickly becomes outdated.',
          'A defined data extract (WMS/TMS utilisation reports, freight cost data) is generated semi-automatically ahead of each scheduled network review.',
          'The network model pulls facility and lane data automatically from WMS/TMS/ERP via integration, minimising manual assembly to genuine judgement inputs.',
          'A live, integrated data layer feeds the network model continuously, with automated alerts when utilisation or cost drift crosses a threshold that warrants an off-cycle redesign review.',
        ],
        levelsAr: [
          'لا يوجد تكامل نظامي؛ وتبدأ كل مراجعة للشبكة بطلب بيانات الاستخدام والتكلفة يدويًا من كل منشأة وشركة نقل.',
          'تتوفر بعض البيانات في جداول بيانات من مراجعات سابقة لكنها لا تُحدَّث آليًا وتصبح قديمة بسرعة.',
          'مستخرَج بيانات محدد (تقارير استخدام من أنظمة إدارة المستودعات/النقل، بيانات تكلفة الشحن) يُولَّد شبه آليًا قبل كل مراجعة شبكة مجدولة.',
          'يسحب نموذج الشبكة بيانات المنشآت والمسارات آليًا من أنظمة المستودعات/النقل/تخطيط الموارد عبر التكامل، مما يقلّص التجميع اليدوي إلى مدخلات الحكم الحقيقية فقط.',
          'طبقة بيانات حية متكاملة تُغذّي نموذج الشبكة باستمرار، مع تنبيهات آلية عند تجاوز انحراف الاستخدام أو التكلفة حدًا يستدعي مراجعة إعادة تصميم خارج الدورة.',
        ],
      },
      {
        q: 'How rigorously does facility or footprint decision-making formally verify free-zone status, foreign-ownership rules, customs bonded-warehouse requirements, and local licensing before a site is committed to?',
        qAr: 'ما مدى صرامة التحقق الرسمي من وضع المنطقة الحرة وقواعد الملكية الأجنبية ومتطلبات المستودع الجمركي المرخّص والتراخيص المحلية قبل الالتزام بأي موقع لمنشأة أو نطاق شبكة؟',
        levels: [
          'Regulatory and customs requirements are discovered only after a site is committed to, often causing costly rework or delay.',
          'Someone checks basic licensing informally, but there is no standard checklist and findings are not documented.',
          'A standard site-selection checklist requires confirmation of free-zone/customs/foreign-ownership status before a recommendation proceeds to approval.',
          'Legal/compliance formally validates regulatory fit as a mandatory step in the site-approval workflow, not a self-declared checklist item.',
          'A maintained regulatory intelligence function tracks changes to free-zone, customs, and foreign-ownership rules across all operating jurisdictions, proactively flagging existing facilities that may fall out of compliance.',
        ],
        levelsAr: [
          'تُكتشَف المتطلبات التنظيمية والجمركية فقط بعد الالتزام بالموقع، مما يتسبب غالبًا بإعادة عمل مكلفة أو تأخير.',
          'يتحقق أحدهم من التراخيص الأساسية بشكل غير رسمي، لكن دون قائمة تحقق موحّدة أو توثيق للنتائج.',
          'قائمة تحقق موحّدة لاختيار الموقع تستلزم تأكيد وضع المنطقة الحرة/الجمارك/الملكية الأجنبية قبل تقديم التوصية للاعتماد.',
          'تتحقق جهة القانونية/الامتثال رسميًا من الملاءمة التنظيمية كخطوة إلزامية في مسار اعتماد الموقع، لا كبند إقرار ذاتي.',
          'وظيفة استخبارات تنظيمية دائمة تتابع التغييرات في قواعد المناطق الحرة والجمارك والملكية الأجنبية عبر جميع الولايات القضائية التشغيلية، وتُنبّه استباقيًا بشأن المنشآت القائمة التي قد تخرج عن الامتثال.',
        ],
      },
      {
        q: 'If a primary facility, port, or critical transport lane became unavailable tomorrow, how quickly and reliably could volume be rerouted to a pre-identified backup — and has that failover actually been tested in practice, not just planned on paper?',
        qAr: 'إذا أصبحت منشأة رئيسية أو ميناء أو مسار نقل حرج غير متاح غدًا، ما مدى سرعة وموثوقية إعادة توجيه الحجم إلى بديل مُحدَّد مسبقًا — وهل اختُبِر هذا التحويل فعليًا في الممارسة، لا على الورق فقط؟',
        levels: [
          'No backup facility, port, or route has ever been identified for any critical node; a loss would require an improvised response from scratch.',
          'Backup options are informally known to some staff but are not documented, assessed for capacity, or agreed with a backup provider.',
          'Backup facilities/routes for the most critical nodes are documented, with estimated capacity and an indicative activation lead time.',
          'Failover arrangements are formally agreed with backup providers (capacity reservation or standing contract) and are reviewed at least annually for continued viability.',
          'Failover to backup capacity has been actually tested (a live drill or a real activation), with documented time-to-recovery and lessons feeding back into the network resiliency design.',
        ],
        levelsAr: [
          'لم يُحدَّد أي بديل لمنشأة أو ميناء أو مسار حرج على الإطلاق؛ وسيتطلب فقدانه استجابة مرتجلة بالكامل من الصفر.',
          'يعرف بعض الموظفين خيارات بديلة بشكل غير رسمي، لكنها غير موثّقة أو مُقيَّمة من حيث السعة أو متفق عليها مع مزود بديل.',
          'البدائل للمنشآت/المسارات الأكثر أهمية موثّقة، مع سعة مُقدَّرة ومدة تفعيل إرشادية.',
          'ترتيبات التحويل مُتَّفَق عليها رسميًا مع مزودين بديلين (حجز سعة أو عقد قائم) وتُراجَع سنويًا على الأقل للتأكد من استمرار جدواها.',
          'التحويل إلى السعة البديلة اختُبِر فعليًا (تمرين حي أو تفعيل حقيقي)، مع وقت تعافٍ موثّق ودروس تُغذّي تصميم مرونة الشبكة.',
        ],
      },
    ],
  },

  /* ── 0-2  S&OP / IBP Integration ─────────────────────────────────────── */
  {
    id: 'strategy-sop',
    title: 'S&OP / IBP Integration',
    titleAr: 'تكامل تخطيط المبيعات والعمليات / التخطيط التجاري المتكامل',
    hint: 'Assesses whether Sales & Operations Planning (or Integrated Business Planning) is a genuine decision-making system connecting supply chain plans to financial reality — not a recurring meeting that produces minutes nobody acts on.',
    hintAr: 'يقيس نضج عملية S&OP أو IBP في دمج خطط سلسلة الإمداد مع التنبؤ المالي وتخصيص رأس المال وصنع القرار التنفيذي.',
    benchmarks: { gcc: 2.1, topQuartile: 3.8 },
    industryWeights: {
      manufacturing: 1.5, fmcg: 1.5, pharma: 1.5, retail: 1.5,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'S&OP/IBP process charter, agenda template, or executive pack sample',
      labelAr: 'توثيق عملية S&OP أو IBP',
      hint: 'Upload S&OP/IBP process charter, agenda template, or executive pack sample.',
      hintAr: 'ارفع ميثاق عملية S&OP أو IBP أو نموذج جدول اجتماع أو نموذجًا للحزمة التنفيذية الشهرية.',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How mature is your S&OP or IBP process in integrating supply chain plans with financial forecasting and strategic capital allocation decisions?',
        qAr: 'ما مدى نضج عملية S&OP أو IBP لديكم في دمج خطط سلسلة الإمداد مع التنبؤ المالي وقرارات تخصيص رأس المال الاستراتيجي؟',
        levels: [
          'No S&OP process exists. Supply chain plans and financial plans are developed independently with no cross-functional alignment.',
          'S&OP meetings occur occasionally but attendance is inconsistent and outputs rarely influence financial planning or capital decisions.',
          'A monthly S&OP cycle is established with defined inputs from sales, operations, and finance, and basic action assignments.',
          'S&OP includes formal financial reconciliation and executive review, consistently linking plans to near-term procurement, production, and capital decisions.',
          'A fully integrated IBP process runs monthly with board-level engagement, direct linkage between supply chain strategy and financial forecasting, and inputs that materially shape board-level capital allocation.',
        ],
        levelsAr: [
          'لا توجد عملية S&OP. تُطوَّر خطط سلسلة الإمداد والخطط المالية بشكل مستقل دون أي مواءمة متعددة الوظائف.',
          'تُعقد اجتماعات S&OP أحيانًا لكن الحضور غير منتظم ونادرًا ما تؤثر المخرجات في التخطيط المالي أو قرارات رأس المال.',
          'أُنشئت دورة S&OP شهرية بمدخلات محددة من المبيعات والعمليات والمالية وإسناد إجراءات أساسية.',
          'تشمل S&OP مطابقة مالية رسمية ومراجعة تنفيذية، وتربط باستمرار الخطط بقرارات الشراء والإنتاج ورأس المال قصيرة المدى.',
          'تعمل عملية IBP متكاملة تمامًا شهريًا بمشاركة على مستوى مجلس الإدارة وربط مباشر بالتنبؤ المالي، ومدخلات تُشكّل بشكل ملموس تخصيص رأس المال على مستوى المجلس.',
        ],
      },
      {
        q: 'How effectively does executive leadership actively own and drive the S&OP or IBP process — rather than delegating it entirely to the planning team?',
        qAr: 'ما مدى فعالية تملّك القيادة التنفيذية وقيادتها الفعلية لعملية S&OP أو IBP — بدلاً من تفويضها بالكامل لفريق التخطيط؟',
        levels: [
          'The process — if it exists — is owned exclusively by the planning team. Executive leaders neither attend nor review outputs.',
          'Senior leaders receive the output report but do not actively participate; decisions remain siloed within functions.',
          'The CPO and supply chain director participate in the executive meeting; decisions are minuted and tracked but ownership is inconsistent.',
          'CEO or COO chairs the monthly executive review; all business units are represented; decisions bind procurement, production, and sales plans.',
          'The CEO chairs a board-level-calendar IBP review; unresolved conflicts escalate to the board; decisions are the single source of truth for the business plan.',
        ],
        levelsAr: [
          'العملية — إن وُجدت — مملوكة حصريًا لفريق التخطيط. لا يحضر القادة التنفيذيون ولا يراجعون المخرجات.',
          'يتلقّى القادة الكبار تقرير المخرجات لكنهم لا يشاركون بفاعلية؛ والقرارات تبقى محصورة داخل الوظائف.',
          'يشارك رئيس المشتريات ومدير سلسلة الإمداد في الاجتماع التنفيذي؛ والقرارات مُدوَّنة ومتابَعة لكن الملكية غير متسقة.',
          'يترأس الرئيس التنفيذي أو المدير التشغيلي المراجعة الشهرية؛ وجميع وحدات الأعمال ممثَّلة؛ والقرارات تُلزم الخطط.',
          'يترأس الرئيس التنفيذي مراجعة IBP بوصفها التزامًا في تقويم المجلس؛ وتُصعَّد النزاعات غير المحسومة للمجلس؛ والقرارات هي المرجع الوحيد لخطة الأعمال.',
        ],
      },
      {
        q: 'How honest and reconciled are the inputs sales, operations, and finance bring into the S&OP cycle — versus each function protecting its own forecast without genuine reconciliation?',
        qAr: 'ما مدى صدق وتطابق المدخلات التي تُقدّمها المبيعات والعمليات والمالية في دورة S&OP — مقابل حماية كل وظيفة لتوقعها الخاص دون مطابقة حقيقية؟',
        levels: [
          'Each function brings its own unreconciled forecast; the meeting does not resolve discrepancies, it just records them.',
          'Discrepancies are discussed but resolution depends on whoever argues most forcefully, not data.',
          'A defined reconciliation step compares sales forecast, operations capacity, and financial plan, with documented assumptions for the gap.',
          'Forecast accuracy by function is tracked over time, feeding a bias-correction process that improves input quality cycle over cycle.',
          'A single unconstrained/constrained demand-supply reconciliation model is the accepted source of truth; functional forecast bias is a tracked KPI with individual accountability.',
        ],
        levelsAr: [
          'تُقدّم كل وظيفة توقعها الخاص غير المطابَق؛ ولا يحسم الاجتماع التناقضات، بل يسجّلها فقط.',
          'تُناقَش التناقضات لكن الحسم يعتمد على من يجادل بقوة أكبر، لا على البيانات.',
          'خطوة مطابقة محددة تقارن توقع المبيعات وسعة العمليات والخطة المالية، مع افتراضات موثّقة لسبب الفجوة.',
          'تُتابَع دقة التوقع لكل وظيفة عبر الوقت، وتُغذّي عملية تصحيح انحياز تُحسّن جودة المدخلات دورةً بعد دورة.',
          'نموذج موحّد لمطابقة الطلب والعرض (غير مقيّد/مقيّد) هو المرجع المعتمَد للحقيقة؛ وانحياز التوقع الوظيفي مؤشر أداء متابَع بمساءلة فردية.',
        ],
      },
      {
        q: 'Within the monthly S&OP cycle itself, how well can the process evaluate multiple demand/supply scenarios (not just a single consensus number) before committing to the plan?',
        qAr: 'ضمن دورة S&OP الشهرية ذاتها، ما مدى قدرة العملية على تقييم سيناريوهات متعددة للطلب والعرض (وليس رقمًا توافقيًا واحدًا فقط) قبل الالتزام بالخطة؟',
        levels: [
          'Only a single consensus number is produced each cycle; no alternative scenarios are modelled.',
          'Upside/downside is discussed verbally in the meeting but not quantified or documented.',
          'At least two quantified scenarios (base/downside) are presented and a contingency response is discussed for each.',
          'Multiple scenarios with quantified financial impact are modelled monthly, with pre-agreed trigger points for switching plans.',
          'Scenario modelling is automated within the planning system, generating multiple demand-supply plans in real time as new signals arrive, with the executive team selecting or blending scenarios monthly.',
        ],
        levelsAr: [
          'يُنتَج رقم توافقي واحد فقط كل دورة؛ ولا تُنمذَج سيناريوهات بديلة.',
          'تُناقَش الاحتمالات الإيجابية/السلبية شفهيًا في الاجتماع دون تحديد كمي أو توثيق.',
          'يُعرَض سيناريوهان مُقاسان على الأقل (أساسي/سلبي) وتُناقَش استجابة احتياطية لكل منهما.',
          'تُنمذَج سيناريوهات متعددة بأثر مالي مُقاس شهريًا، مع نقاط تحفيز مُتَّفَق عليها مسبقًا للتحوّل بين الخطط.',
          'نمذجة السيناريوهات آلية ضمن نظام التخطيط، وتُولّد خططًا متعددة للطلب والعرض آنيًا مع ورود إشارات جديدة، ويختار الفريق التنفيذي أو يمزج السيناريوهات شهريًا.',
        ],
      },
      {
        q: 'How consistently do decisions made in the S&OP process translate into binding, tracked actions for procurement, production, and inventory management within the same planning cycle?',
        qAr: 'ما مدى اتساق ترجمة قرارات S&OP إلى إجراءات ملزمة ومتابَعة للمشتريات والإنتاج وإدارة المخزون ضمن دورة التخطيط ذاتها؟',
        levels: [
          'S&OP decisions are discussed but rarely acted upon. Procurement and production plans continue largely unchanged.',
          'Some decisions lead to informal adjustments but there is no formal mechanism with assigned owners.',
          'Key decisions are documented in minutes and assigned to owners; follow-through is checked at the next monthly meeting.',
          'All decisions generate action items with owners, due dates, and specific KPI impacts; adherence is reviewed monthly with escalation if missed.',
          'Decisions are automatically translated into ERP purchasing, production, and inventory parameters within 48 hours; adherence rates are a board-reviewed process health KPI.',
        ],
        levelsAr: [
          'تُناقَش قرارات S&OP لكنها نادرًا ما يُعمَل بها. تستمر خطط الشراء والإنتاج دون تغيير يُذكر.',
          'تُفضي بعض القرارات إلى تعديلات غير رسمية لكن دون آلية رسمية بمالكين محددين.',
          'تُوثَّق القرارات الرئيسية في المحاضر وتُسنَد لمالكين؛ ويُتحقَّق من التنفيذ في الاجتماع الشهري التالي.',
          'تُولّد جميع القرارات إجراءات بمالكين وتواريخ استحقاق وأثر محدد على المؤشرات؛ ويُراجَع الالتزام شهريًا مع التصعيد عند الإخلال.',
          'تُترجَم القرارات آليًا إلى معاملات شراء وإنتاج ومخزون في نظام تخطيط الموارد خلال 48 ساعة؛ ومعدلات الامتثال مؤشر لصحة العملية يُراجَع على مستوى المجلس.',
        ],
      },
      {
        q: 'Do S&OP outputs actually flow into the systems that run daily operations (ERP purchasing parameters, production schedules, safety stock levels), or do they remain confined to meeting minutes and spreadsheets?',
        qAr: 'هل تتدفق مخرجات S&OP فعليًا إلى الأنظمة التي تُشغّل العمليات اليومية (معاملات الشراء في تخطيط الموارد، جداول الإنتاج، مستويات مخزون الأمان)، أم تبقى محصورة في محاضر الاجتماعات وجداول البيانات؟',
        levels: [
          'S&OP outputs live entirely in a slide deck or spreadsheet; operational systems are never updated to reflect them.',
          'Someone manually updates a few key parameters after the meeting, inconsistently and with delay.',
          'A defined handover process updates core ERP parameters (forecast, safety stock) within an agreed timeframe after each cycle.',
          'Most planning parameters update automatically or semi-automatically from the S&OP outcome, with a defined owner accountable for accuracy.',
          'S&OP is system-integrated end to end: the agreed plan directly drives ERP purchasing, production, and inventory parameters with no manual re-entry step, and a system-level audit trail confirms it.',
        ],
        levelsAr: [
          'تعيش مخرجات S&OP كليًا في عرض تقديمي أو جدول بيانات؛ ولا تُحدَّث الأنظمة التشغيلية لتعكسها أبدًا.',
          'يُحدّث أحدهم يدويًا بعض المعاملات الرئيسية بعد الاجتماع، بشكل غير متسق ومتأخر.',
          'عملية تسليم محددة تُحدّث معاملات تخطيط الموارد الأساسية (التوقع، مخزون الأمان) ضمن إطار زمني متفق عليه بعد كل دورة.',
          'تُحدَّث معظم معاملات التخطيط آليًا أو شبه آليًا من نتيجة S&OP، بمالك محدد مسؤول عن الدقة.',
          'S&OP متكاملة نظاميًا من طرف لطرف: تُشغّل الخطة المتفق عليها مباشرةً معاملات الشراء والإنتاج والمخزون في تخطيط الموارد دون خطوة إعادة إدخال يدوية، ويؤكد ذلك مسار تدقيق نظامي.',
        ],
      },
      {
        q: 'How well does governance separate the individuals who build the demand/supply forecast inputs from those with final authority to approve the consensus number that becomes the operating plan?',
        qAr: 'ما مدى فصل الحوكمة بين الأفراد الذين يُعِدّون مدخلات توقع الطلب/العرض وأولئك الذين يملكون الصلاحية النهائية لاعتماد الرقم التوافقي الذي يصبح الخطة التشغيلية؟',
        levels: [
          'The same planner builds the forecast and effectively decides the final number with no independent executive sign-off.',
          'An executive technically signs off the consensus plan, but does so without reviewing the underlying assumptions or challenging the number.',
          'Forecast preparation and consensus approval are formally assigned to separate roles, with the approver required to review assumptions and variance to prior cycle before signing.',
          'The S&OP governance charter formally documents decision rights at each step (who proposes, who reconciles, who approves), enforced by the meeting structure itself.',
          'Decision-rights adherence is periodically audited (e.g. comparing who actually changed the forecast in-system against the documented RACI), with findings reported to the executive sponsor.',
        ],
        levelsAr: [
          'نفس المخطط يُعِدّ التوقع ويحدد فعليًا الرقم النهائي دون اعتماد تنفيذي مستقل.',
          'يعتمد أحد التنفيذيين الخطة التوافقية رسميًا، لكن دون مراجعة الافتراضات الأساسية أو مساءلة الرقم.',
          'إعداد التوقع واعتماد التوافق مُسندان رسميًا لدورين منفصلين، ويُطلَب من المُعتمِد مراجعة الافتراضات والانحراف عن الدورة السابقة قبل التوقيع.',
          'ميثاق حوكمة S&OP يوثّق رسميًا صلاحيات القرار في كل خطوة (من يقترح، من يُطابِق، من يعتمد)، ويُفرَض ذلك عبر بنية الاجتماع ذاتها.',
          'يُدقَّق الالتزام بصلاحيات القرار دوريًا (مثل مقارنة من عدَّل التوقع فعليًا في النظام بمصفوفة الأدوار الموثّقة)، وتُرفَع النتائج للراعي التنفيذي.',
        ],
      },
      {
        q: 'Is the demand-supply reconciliation actually performed inside a planning system with an auditable calculation trail, or is it built and rebuilt in disconnected spreadsheets each cycle?',
        qAr: 'هل تُنفَّذ مطابقة الطلب والعرض فعليًا داخل نظام تخطيط بمسار حسابي قابل للتدقيق، أم تُبنى وتُعاد بناؤها في جداول بيانات منفصلة كل دورة؟',
        levels: [
          'Every cycle, forecasts and reconciliation are built from scratch in disconnected spreadsheets with no version control or audit trail.',
          'A standard spreadsheet template is reused cycle to cycle, but data is manually copied in from source systems, introducing error risk.',
          'A dedicated planning tool (APS or S&OP module) holds the reconciliation, though some inputs still require manual upload.',
          'The planning system automatically ingests demand, supply, and financial data and produces the reconciled plan with a full calculation and change-history trail.',
          'The system supports live, auditable what-if reconciliation during the meeting itself, with every override logged, attributed, and available for post-cycle review.',
        ],
        levelsAr: [
          'في كل دورة، تُبنى التوقعات والمطابقة من الصفر في جداول بيانات منفصلة دون ضبط إصدار أو مسار تدقيق.',
          'يُعاد استخدام قالب جدول بيانات موحّد من دورة لأخرى، لكن البيانات تُنسَخ يدويًا من الأنظمة المصدر، ما يُدخل مخاطر الخطأ.',
          'أداة تخطيط متخصصة (نظام تخطيط متقدم أو وحدة S&OP) تحتفظ بالمطابقة، رغم أن بعض المدخلات ما زالت تتطلب رفعًا يدويًا.',
          'نظام التخطيط يستوعب آليًا بيانات الطلب والعرض والمالية وينتج الخطة المطابَقة بمسار حسابي وسجل تغييرات كامل.',
          'يدعم النظام مطابقة حيّة وقابلة للتدقيق لسيناريوهات "ماذا لو" أثناء الاجتماع ذاته، مع تسجيل كل تجاوز يدوي وعزوه لصاحبه وإتاحته للمراجعة بعد الدورة.',
        ],
      },
      {
        q: 'Is the S&OP/IBP process governed by a formal, board-visible charter (defined steps, roles, timing, escalation rules) that is periodically audited for actual adherence — not just an informal habit that varies by who is running the meeting that month?',
        qAr: 'هل تُحوكَم عملية S&OP/IBP بميثاق رسمي مرئي للمجلس (خطوات محددة، أدوار، توقيت، قواعد تصعيد) يُدقَّق دوريًا للتحقق من الالتزام الفعلي — لا مجرد عادة غير رسمية تختلف بحسب من يدير الاجتماع في ذلك الشهر؟',
        levels: [
          'No documented process charter exists; the process runs however the current facilitator prefers, and changes unpredictably when that person changes.',
          'A basic outline of steps exists informally but is not a controlled document and is not consistently followed.',
          'A written process charter defines steps, roles, and timing, and is distributed to all participants ahead of the cycle.',
          'The charter is formally approved by executive sponsorship, includes defined escalation rules for unresolved conflicts, and is reviewed annually for continued fitness.',
          'Adherence to the charter is periodically audited (attendance, timing, decision documentation) with findings reported to the executive sponsor and process gaps formally remediated.',
        ],
        levelsAr: [
          'لا يوجد ميثاق عملية موثّق؛ وتُدار العملية وفق تفضيل الميسّر الحالي، وتتغيّر بشكل غير متوقع عند تغيّر ذلك الشخص.',
          'يوجد مخطط أساسي للخطوات بشكل غير رسمي لكنه ليس وثيقة مضبوطة ولا يُتَّبع باتساق.',
          'ميثاق عملية مكتوب يحدد الخطوات والأدوار والتوقيت، ويُوزَّع على جميع المشاركين قبل الدورة.',
          'الميثاق معتمد رسميًا من الراعي التنفيذي، ويتضمن قواعد تصعيد محددة للنزاعات غير المحسومة، ويُراجَع سنويًا للتأكد من ملاءمته المستمرة.',
          'يُدقَّق الالتزام بالميثاق دوريًا (الحضور، التوقيت، توثيق القرارات) وتُرفَع النتائج للراعي التنفيذي وتُعالَج فجوات العملية رسميًا.',
        ],
      },
      {
        q: 'When the standard monthly S&OP cycle itself is disrupted — a major holiday period, an unplanned crisis, a key participant\'s sudden absence — is there a defined fallback process to keep the plan current, or does the cycle simply lapse until things return to normal?',
        qAr: 'عندما تتعطل دورة S&OP الشهرية القياسية نفسها — فترة عطلة كبرى، أزمة غير مخطَّطة، غياب مفاجئ لمشارك رئيسي — هل توجد عملية احتياطية محددة لإبقاء الخطة محدَّثة، أم تتوقف الدورة ببساطة إلى أن تعود الأمور لطبيعتها؟',
        levels: [
          'If the standard cycle is disrupted for any reason, the plan simply goes stale until the next cycle can be convened, with no interim process.',
          'An ad hoc, informal workaround is improvised each time disruption occurs, with no consistency between incidents.',
          'A defined lightweight fallback process (e.g. an abbreviated review with core participants only) exists for when the full cycle cannot be run as scheduled.',
          'The fallback process has defined trigger conditions and a named deputy for each key role, so the cycle can run at reduced scope without a full lapse.',
          'Continuity of the planning cycle is stress-tested (e.g. a simulated key-person absence) and the fallback process has been actually exercised, with lessons formally incorporated into the process charter.',
        ],
        levelsAr: [
          'إذا تعطلت الدورة القياسية لأي سبب، تصبح الخطة ببساطة قديمة إلى أن يمكن عقد الدورة التالية، دون عملية بديلة مؤقتة.',
          'يُرتجَل حل بديل غير رسمي في كل مرة يقع فيها اضطراب، دون اتساق بين الحوادث.',
          'توجد عملية احتياطية مبسّطة محددة (مثل مراجعة مختصرة بحضور المشاركين الأساسيين فقط) لحالات تعذّر تشغيل الدورة الكاملة كما هو مجدول.',
          'للعملية الاحتياطية شروط تفعيل محددة ونائب معيّن لكل دور رئيسي، بحيث يمكن تشغيل الدورة بنطاق مخفَّض دون توقف كامل.',
          'استمرارية دورة التخطيط تُختبَر تحت الضغط (مثل محاكاة غياب شخص رئيسي) وقد جُرِّبَت العملية الاحتياطية فعليًا، مع دمج الدروس رسميًا في ميثاق العملية.',
        ],
      },
    ],
  },

  /* ── 0-3  Scenario Planning ─────────────────────────────────────── */
  {
    id: 'strategy-scenario',
    title: 'Scenario Planning',
    titleAr: 'تخطيط السيناريوهات',
    hint: 'Assesses the organisation\'s discipline in stress-testing its supply chain against disruption before it happens, in financially quantified terms — not generic risk awareness.',
    hintAr: 'يقيس صرامة وانضباط تخطيط السيناريوهات المُستخدَم لتقييم الخيارات الاستراتيجية واختبار الإجهاد لسلسلة الإمداد وإثراء قرارات رأس المال والتوريد.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.5, construction: 1.0, oil_gas: 1.5,
      government: 1.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How systematically do you apply scenario planning to evaluate major strategic supply chain options before committing to capital or structural decisions?',
        qAr: 'ما مدى منهجية تطبيقكم لتخطيط السيناريوهات لتقييم خيارات سلسلة الإمداد الاستراتيجية الكبرى قبل الالتزام برأس المال أو القرارات الهيكلية؟',
        levels: [
          'No scenario planning is conducted. Major decisions are based on a single set of assumptions.',
          'Informal "what-if" discussions occur among senior leaders but are not documented or used to formally drive decisions.',
          'Basic scenario analysis with at least two scenarios (base and downside) is applied to major strategic decisions.',
          'Structured scenario planning with quantified outcomes is embedded in the annual strategic planning cycle for all capital decisions above a defined threshold.',
          'Advanced simulation models multiple demand, risk, and disruption scenarios with full financial impact quantification before every major decision; outputs are board-reviewed.',
        ],
        levelsAr: [
          'لا يُجرى تخطيط للسيناريوهات. تستند القرارات الكبرى إلى مجموعة واحدة من الافتراضات.',
          'تُجرى نقاشات غير رسمية حول "ماذا لو" بين كبار القادة لكنها غير موثّقة ولا تُستخدَم لتوجيه القرارات رسميًا.',
          'يُطبَّق تحليل سيناريو أساسي بسيناريوهين على الأقل (أساسي وسلبي) على القرارات الاستراتيجية الكبرى.',
          'تخطيط منظم للسيناريوهات بنتائج مُقاسة مضمَّن في دورة التخطيط الاستراتيجي السنوي لجميع قرارات رأس المال فوق حد محدد.',
          'تُنمذَج أدوات محاكاة متقدمة سيناريوهات متعددة بتقييم مالي كامل قبل كل قرار كبير؛ والمخرجات تُراجَع على مستوى المجلس.',
        ],
      },
      {
        q: 'How directly do scenario planning outputs shape board and executive-level strategic direction — rather than being an analytical exercise conducted separately from real decision-making?',
        qAr: 'إلى أي درجة تُشكّل مخرجات تخطيط السيناريوهات التوجه الاستراتيجي على مستوى المجلس والإدارة التنفيذية مباشرةً — بدلاً من كونها تمرينًا تحليليًا منفصلاً عن صنع القرار الفعلي؟',
        levels: [
          'Scenario exercises, if conducted, never reach the board or executive committee.',
          'Outputs are occasionally shared with executives as background information, not as decision inputs.',
          'Scenario outputs are a standing agenda item at annual strategy sessions, informing but not binding the discussion.',
          'Major strategic decisions require documented reference to relevant scenario analysis before executive approval.',
          'The board formally reviews scenario planning quarterly as a standing risk-adjusted strategy input, with documented linkage between specific scenarios and specific board decisions taken.',
        ],
        levelsAr: [
          'تمارين السيناريوهات، إن وُجدت، لا تصل أبدًا إلى المجلس أو اللجنة التنفيذية.',
          'تُشارَك المخرجات أحيانًا مع التنفيذيين كمعلومات خلفية، لا كمدخلات قرار.',
          'مخرجات السيناريوهات بند ثابت في جلسات الاستراتيجية السنوية، تُثري النقاش دون أن تُلزمه.',
          'تتطلب القرارات الاستراتيجية الكبرى إشارة موثّقة إلى تحليل السيناريو ذي الصلة قبل الموافقة التنفيذية.',
          'يراجع المجلس رسميًا تخطيط السيناريوهات فصليًا كمدخل ثابت للاستراتيجية المعدَّلة وفق المخاطر، مع ربط موثّق بين سيناريوهات محددة وقرارات مجلس محددة اتُّخذت بناءً عليها.',
        ],
      },
      {
        q: 'How comprehensively are GCC-relevant disruption scenarios — Red Sea/regional shipping disruption, FX peg or currency policy shifts, key single-source supplier failure, extreme heat/climate operational impact — modelled and financially quantified?',
        qAr: 'ما مدى شمولية نمذجة وتقييم سيناريوهات الاضطراب ذات الصلة بالخليج ماليًا — اضطراب الشحن في البحر الأحمر/الإقليمي، وتحولات سياسة ربط العملة أو سعر الصرف، وفشل مورد رئيسي أحادي المصدر، والأثر التشغيلي لدرجات الحرارة القصوى/المناخ؟',
        levels: [
          'No GCC-specific disruption scenarios are modelled at all; risk discussion is generic and not quantified.',
          'GCC-specific risks are discussed informally in risk meetings but not quantified financially.',
          'Key GCC disruption scenarios are modelled with estimated financial impact and documented response options.',
          'A library of quantified GCC-relevant disruption scenarios — with probability assessment and pre-planned responses — is reviewed and updated at least annually.',
          'A dynamic, quantified scenario library covering all material GCC-specific risk categories stress-tests the annual business plan in revenue/margin/cash-flow terms and is reviewed quarterly by the executive committee.',
        ],
        levelsAr: [
          'لا تُنمذَج أي سيناريوهات اضطراب خاصة بالخليج على الإطلاق؛ ونقاش المخاطر عام وغير مُقاس.',
          'تُناقَش المخاطر الخاصة بالخليج بشكل غير رسمي في اجتماعات المخاطر لكن دون تقييم مالي.',
          'تُنمذَج سيناريوهات الاضطراب الرئيسية الخاصة بالخليج بأثر مالي مُقدَّر وخيارات استجابة موثّقة.',
          'مكتبة سيناريوهات اضطراب مُقاسة وذات صلة بالخليج — بتقييم احتمالية واستجابات مُخطَّطة مسبقًا — تُراجَع وتُحدَّث سنويًا على الأقل.',
          'مكتبة سيناريوهات ديناميكية ومُقاسة تغطي جميع فئات المخاطر الجوهرية الخاصة بالخليج تختبر الخطة التجارية السنوية بمصطلحات الإيرادات والهامش والتدفق النقدي، وتُراجَع فصليًا من اللجنة التنفيذية.',
        ],
      },
      {
        q: 'What methodology and tools are used to build and update scenarios — ad hoc spreadsheets, structured frameworks, or dedicated simulation software — and how often are they refreshed?',
        qAr: 'ما المنهجية والأدوات المُستخدَمة لبناء السيناريوهات وتحديثها — جداول بيانات عشوائية، أطر منظمة، أو برمجيات محاكاة متخصصة — وما وتيرة تحديثها؟',
        levels: [
          'No consistent methodology exists; scenarios, if built at all, are one-off and never refreshed.',
          'Basic spreadsheet models exist for one or two scenarios but are rebuilt from scratch each time rather than maintained.',
          'A structured spreadsheet-based framework with consistent assumptions is maintained and updated annually.',
          'Dedicated scenario-modelling tools or a structured platform maintain multiple live scenarios, updated semi-annually with fresh data.',
          'An integrated simulation platform maintains a continuously-updated scenario set, refreshed automatically as new market/risk data arrives, feeding directly into planning and risk systems.',
        ],
        levelsAr: [
          'لا توجد منهجية متسقة؛ والسيناريوهات، إن بُنيت أصلاً، تكون لمرة واحدة ولا تُحدَّث أبدًا.',
          'توجد نماذج جداول بيانات أساسية لسيناريو أو اثنين لكنها تُبنى من الصفر كل مرة بدلاً من صيانتها.',
          'إطار منظم قائم على جداول البيانات بافتراضات متسقة يُصان ويُحدَّث سنويًا.',
          'أدوات نمذجة سيناريوهات متخصصة أو منصة منظمة تُبقي عدة سيناريوهات حيّة، تُحدَّث نصف سنويًا ببيانات جديدة.',
          'منصة محاكاة متكاملة تُبقي مجموعة سيناريوهات مُحدَّثة باستمرار، تُحدَّث آليًا مع ورود بيانات سوق/مخاطر جديدة، وتُغذّي مباشرةً أنظمة التخطيط والمخاطر.',
        ],
      },
      {
        q: 'How reliably do scenario planning findings drive specific, documented changes to strategy, contingency plans, or capital allocation — rather than being filed and forgotten?',
        qAr: 'ما مدى موثوقية توجيه نتائج تخطيط السيناريوهات لتغييرات محددة وموثّقة في الاستراتيجية أو الخطط الاحتياطية أو تخصيص رأس المال — بدلاً من حفظها وإهمالها؟',
        levels: [
          'Findings are never formally used to change strategy or plans. Exercises are conducted but findings are not actioned.',
          'Findings are presented to leadership but follow-through is inconsistent; most do not translate into documented changes.',
          'Findings are formally reviewed by leadership, and specific action items or contingency updates are assigned with owners and timelines.',
          'Scenario outputs are integrated into the strategic planning document; contingency triggers and pre-authorised response budgets are documented per scenario.',
          'Findings directly update strategy documents, risk registers, and pre-authorised contingency budgets; trigger conditions activating specific responses are formally board-agreed.',
        ],
        levelsAr: [
          'لا تُستخدَم النتائج رسميًا قط لتغيير الاستراتيجية أو الخطط. تُجرى التمارين لكن لا يُعمَل بالنتائج.',
          'تُعرض النتائج على القيادة لكن المتابعة غير متسقة؛ ومعظمها لا يتحول إلى تغييرات موثّقة.',
          'تُراجَع النتائج رسميًا من القيادة، وتُسنَد إجراءات محددة أو تحديثات احتياطية بمالكين وجداول زمنية.',
          'مخرجات السيناريوهات مدمجة في وثيقة التخطيط الاستراتيجي؛ ومحفّزات الطوارئ والميزانيات الاحتياطية المُعتمَدة مسبقًا موثّقة لكل سيناريو.',
          'تُحدّث النتائج مباشرةً وثائق الاستراتيجية وسجلات المخاطر والميزانيات الاحتياطية المُعتمَدة مسبقًا؛ وشروط تفعيل استجابات محددة مُتَّفَق عليها رسميًا من المجلس.',
        ],
      },
      {
        q: 'Has a pre-planned scenario response actually been triggered and executed in a real disruption, and was its effectiveness afterward reviewed?',
        qAr: 'هل سبق تفعيل وتنفيذ استجابة سيناريو مُخطَّطة مسبقًا فعليًا في اضطراب حقيقي، وهل رُوجعت فعاليتها لاحقًا؟',
        levels: [
          'No pre-planned response has ever been activated; when disruption hit, the response was improvised from scratch.',
          'A plan existed on paper but was not followed during the last real disruption because it wasn\'t well-known or accessible.',
          'A pre-planned response was activated during a real disruption at least once, with a basic after-action note.',
          'Activated responses are formally reviewed after the event, with documented lessons learned feeding back into the scenario library.',
          'A track record of multiple activated scenario responses exists, each with a documented after-action review, measurable effectiveness score, and resulting refinement to the scenario and response library.',
        ],
        levelsAr: [
          'لم تُفعَّل أي استجابة مُخطَّطة مسبقًا قط؛ وعند وقوع الاضطراب، كانت الاستجابة مرتجلة بالكامل.',
          'كانت هناك خطة موثّقة لكن لم تُتَّبع خلال آخر اضطراب حقيقي لأنها لم تكن معروفة أو متاحة بشكل جيد.',
          'فُعِّلت استجابة مُخطَّطة مسبقًا خلال اضطراب حقيقي مرة واحدة على الأقل، مع مذكرة أساسية لما بعد الحدث.',
          'تُراجَع الاستجابات المُفعَّلة رسميًا بعد الحدث، مع دروس مستفادة موثّقة تُغذّي مكتبة السيناريوهات.',
          'يوجد سجل حافل لعدة استجابات سيناريو مُفعَّلة، لكل منها مراجعة موثّقة لما بعد الحدث ودرجة فعالية قابلة للقياس وتحسين ناتج لمكتبة السيناريوهات والاستجابات.',
        ],
      },
      {
        q: 'Are scenario assumptions and probability estimates independently challenged (e.g. by risk, finance, or an external party) before being used to justify strategic decisions — or are they built and validated by the same team that owns the response plan, with no independent check?',
        qAr: 'هل تُختبَر افتراضات السيناريو وتقديرات الاحتمالية بشكل مستقل (من المخاطر أو المالية أو جهة خارجية) قبل استخدامها لتبرير القرارات الاستراتيجية — أم تُبنى وتُصادَق من الفريق ذاته المالك لخطة الاستجابة، دون تحقق مستقل؟',
        levels: [
          'The same team that builds the scenario also validates it and decides how it\'s used; no one outside that team reviews the assumptions.',
          'Assumptions are occasionally questioned informally in the leadership meeting, but there is no structured challenge step.',
          'A defined review step requires risk or finance to sign off on key assumptions (probability, financial impact) before a scenario is presented to leadership.',
          'An independent function (risk committee, internal audit, or external advisor) formally stress-tests scenario assumptions for bias or optimism before they inform major decisions.',
          'Independent challenge is a standing, documented governance step for every material scenario, with a formal record of what was challenged, what changed as a result, and sign-off from the independent reviewer.',
        ],
        levelsAr: [
          'الفريق ذاته الذي يبني السيناريو يُصادِق عليه ويقرر كيفية استخدامه؛ ولا يراجع الافتراضات أحد خارج ذلك الفريق.',
          'تُناقَش الافتراضات أحيانًا بشكل غير رسمي في اجتماع القيادة، لكن دون خطوة تحدٍّ منظمة.',
          'خطوة مراجعة محددة تستلزم اعتماد المخاطر أو المالية للافتراضات الرئيسية (الاحتمالية، الأثر المالي) قبل عرض السيناريو على القيادة.',
          'جهة مستقلة (لجنة المخاطر، التدقيق الداخلي، أو مستشار خارجي) تختبر رسميًا افتراضات السيناريو تحت الضغط للتحقق من التحيّز أو التفاؤل المفرط قبل أن تُوجّه القرارات الكبرى.',
          'التحدي المستقل خطوة حوكمة ثابتة وموثّقة لكل سيناريو جوهري، مع سجل رسمي لما جرى تحديه وما تغيّر نتيجة لذلك واعتماد المراجع المستقل.',
        ],
      },
      {
        q: 'When a scenario response is triggered, how automatically do the associated actions (alternate sourcing, safety stock changes, reallocation) flow into the systems that execute them, versus requiring manual re-entry under time pressure?',
        qAr: 'عند تفعيل استجابة سيناريو، ما مدى انسياب الإجراءات المرتبطة بها (توريد بديل، تغييرات مخزون الأمان، إعادة التخصيص) آليًا إلى الأنظمة التي تُنفّذها، مقابل الحاجة لإعادة إدخال يدوي تحت ضغط الوقت؟',
        levels: [
          'Triggering a scenario response means someone manually re-keys new parameters into each operational system from scratch, under time pressure.',
          'Pre-written response actions exist in a document, but translating them into system parameters is still a manual, unassisted step.',
          'Pre-configured parameter sets for major scenarios exist and can be manually activated in the ERP/planning system with a defined, tested procedure.',
          'Activating a scenario response semi-automatically pushes pre-approved parameter changes into planning and procurement systems, with a human confirmation step.',
          'Scenario activation is system-integrated end to end: an authorised trigger automatically applies the pre-approved response parameters across ERP/planning/procurement systems, with a full audit trail of what changed and when.',
        ],
        levelsAr: [
          'تفعيل استجابة السيناريو يعني قيام أحدهم بإعادة إدخال معاملات جديدة يدويًا في كل نظام تشغيلي من الصفر، تحت ضغط الوقت.',
          'توجد إجراءات استجابة مكتوبة مسبقًا في وثيقة، لكن ترجمتها إلى معاملات نظامية لا تزال خطوة يدوية دون مساعدة.',
          'مجموعات معاملات مُعدَّة مسبقًا للسيناريوهات الرئيسية موجودة ويمكن تفعيلها يدويًا في نظام تخطيط الموارد/التخطيط بإجراء محدد ومُختبَر.',
          'تفعيل استجابة السيناريو يدفع شبه آليًا التغييرات المُعتمَدة مسبقًا في معاملات أنظمة التخطيط والشراء، مع خطوة تأكيد بشرية.',
          'تفعيل السيناريو متكامل نظاميًا من طرف لطرف: يُطبِّق المُحفِّز المُعتمَد تلقائيًا معاملات الاستجابة المُعتمَدة مسبقًا عبر أنظمة تخطيط الموارد/التخطيط/الشراء، مع مسار تدقيق كامل لما تغيّر ومتى.',
        ],
      },
      {
        q: 'Is there a formally documented policy or charter defining who owns the scenario planning programme, the mandatory review cadence, and the minimum scenario coverage required — or does the programme\'s existence depend entirely on current leadership\'s personal interest?',
        qAr: 'هل توجد سياسة أو ميثاق موثّق رسميًا يحدد مالك برنامج تخطيط السيناريوهات، ووتيرة المراجعة الإلزامية، والحد الأدنى المطلوب من تغطية السيناريوهات — أم أن استمرار البرنامج يعتمد كليًا على اهتمام القيادة الحالية الشخصي؟',
        levels: [
          'No policy or charter exists; scenario planning happens only when a current leader personally champions it, and stops when that leader moves on.',
          'An informal expectation exists that scenarios should be reviewed periodically, but it is not written down or formally owned.',
          'A documented policy names an accountable owner and a minimum review cadence for the scenario library.',
          'The charter is board-approved, specifies minimum required scenario coverage (by risk category), and ties non-compliance to a formal escalation.',
          'Programme governance is independently audited against the charter on a defined cycle, with findings reported to the board risk committee and gaps formally tracked to closure.',
        ],
        levelsAr: [
          'لا توجد سياسة أو ميثاق؛ ويحدث تخطيط السيناريوهات فقط عندما يتبنّاه أحد القادة الحاليين شخصيًا، ويتوقف عند رحيل ذلك القائد.',
          'يوجد توقّع غير رسمي بضرورة مراجعة السيناريوهات دوريًا، لكنه غير مكتوب أو مملوك رسميًا.',
          'سياسة موثّقة تُسمّي مالكًا مسؤولًا ووتيرة مراجعة دنيا لمكتبة السيناريوهات.',
          'الميثاق معتمد من المجلس، ويحدد الحد الأدنى المطلوب من تغطية السيناريوهات (حسب فئة المخاطر)، ويربط عدم الامتثال بتصعيد رسمي.',
          'تُدقَّق حوكمة البرنامج بشكل مستقل مقابل الميثاق وفق دورة محددة، وتُرفَع النتائج للجنة المخاطر في المجلس وتُتابَع الفجوات رسميًا حتى إغلاقها.',
        ],
      },
      {
        q: 'Are financial reserves or contingency funding lines for executing high-priority scenario responses pre-authorised and readily accessible — or does funding for a crisis response have to be sourced and approved from scratch after the disruption has already begun?',
        qAr: 'هل الاحتياطيات المالية أو خطوط التمويل الاحتياطية لتنفيذ استجابات السيناريوهات ذات الأولوية العالية مُعتمَدة مسبقًا ومتاحة بسهولة — أم يجب توفير تمويل الاستجابة للأزمة واعتماده من الصفر بعد بدء الاضطراب فعليًا؟',
        levels: [
          'No contingency funding is pre-authorised for any scenario; a disruption response has to go through the standard capital approval process from scratch, causing delay.',
          'Leadership generally understands that emergency funding could be found if needed, but no reserve or fast-track approval mechanism actually exists.',
          'A defined contingency reserve or fast-track approval threshold exists for the highest-priority scenarios, documented in the scenario response plan.',
          'Contingency funding is formally ring-fenced in the annual budget for the top-tier disruption scenarios, with pre-delegated approval authority to release it without a full board cycle.',
          'Pre-authorised contingency funding levels are reviewed and re-validated annually against updated scenario financial impact estimates, and release of funds has been tested in a real activation with time-to-release tracked as a KPI.',
        ],
        levelsAr: [
          'لا يوجد تمويل احتياطي مُعتمَد مسبقًا لأي سيناريو؛ ويجب أن تمر استجابة الاضطراب بعملية اعتماد رأس المال القياسية من الصفر، مما يسبب تأخيرًا.',
          'تُدرك القيادة عمومًا أنه يمكن إيجاد تمويل طارئ عند الحاجة، لكن لا يوجد احتياطي أو آلية اعتماد سريع فعليًا.',
          'احتياطي طارئ محدد أو حد اعتماد سريع موجود لأولى السيناريوهات ذات الأولوية، موثّق في خطة استجابة السيناريو.',
          'التمويل الاحتياطي محجوز رسميًا في الموازنة السنوية لأعلى فئات سيناريوهات الاضطراب، مع صلاحية اعتماد مُفوَّضة مسبقًا لصرفه دون دورة مجلس كاملة.',
          'مستويات التمويل الاحتياطي المُعتمَد مسبقًا تُراجَع وتُعاد المصادقة عليها سنويًا مقابل تقديرات الأثر المالي المُحدَّثة للسيناريوهات، وقد اختُبِر صرف الأموال في تفعيل حقيقي مع تتبّع وقت الصرف كمؤشر أداء.',
        ],
      },
    ],
  },

  /* ── 0-4  Performance Governance ─────────────────────────────────────── */
  {
    id: 'strategy-governance',
    title: 'Performance Governance',
    titleAr: 'حوكمة الأداء',
    hint: 'Assesses whether the KPI framework is a genuine management system with teeth — cascaded, reviewed, and enforced — not a dashboard nobody is accountable to.',
    hintAr: 'يقيس شمولية إطار مؤشرات أداء سلسلة الإمداد وصرامة مراجعات الأداء ووضوح الملكية والمساءلة على كل مستوى.',
    benchmarks: { gcc: 2.3, topQuartile: 4.0 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'KPI dashboard or scorecard sample',
      labelAr: 'لوحة مؤشرات أداء سلسلة الإمداد أو بطاقة الأداء',
      hint: 'Upload KPI dashboard or scorecard sample.',
      hintAr: 'ارفع نموذجًا للوحة مؤشرات الأداء أو تقرير بطاقة الأداء يُظهر مقاييس سلسلة الإمداد ومالكيها ومستهدفاتها.',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How comprehensive and well-cascaded is your supply chain KPI framework — from board-level strategic metrics down to operational team targets?',
        qAr: 'ما مدى شمولية إطار مؤشرات أداء سلسلة الإمداد لديكم وجودة توزيعه — من المقاييس الاستراتيجية على مستوى المجلس وصولاً إلى مستهدفات الفرق التشغيلية؟',
        levels: [
          'No KPI framework exists. Performance is not measured systematically and there are no defined targets at any level.',
          'A few high-level metrics exist but are tracked inconsistently and not linked to individual or team accountability.',
          'A defined set of KPIs is tracked regularly, assigned to owners, and reported monthly, though cascading to teams is limited.',
          'A comprehensive framework is cascaded to team level with clear owners, reviewed weekly/monthly, and triggers action when targets are missed.',
          'A balanced scorecard — cost, service, quality, sustainability — is cascaded to individual level, linked to incentives, reviewed monthly at board level with trend analysis.',
        ],
        levelsAr: [
          'لا يوجد إطار مؤشرات أداء. لا يُقاس الأداء بشكل منهجي ولا توجد مستهدفات محددة على أي مستوى.',
          'توجد بضعة مقاييس عامة لكنها تُتابَع بشكل غير متسق وغير مرتبطة بالمساءلة الفردية أو الفريق.',
          'مجموعة محددة من المؤشرات تُتابَع بانتظام وتُسنَد لمالكين وتُرفَع شهريًا، لكن التوزيع على الفرق محدود.',
          'إطار شامل موزَّع على مستوى الفريق بمالكين واضحين، يُراجَع أسبوعيًا/شهريًا ويُطلق إجراءً عند تفويت الأهداف.',
          'بطاقة أداء متوازنة — التكلفة والخدمة والجودة والاستدامة — موزَّعة على المستوى الفردي ومرتبطة بالحوافز، تُراجَع شهريًا على مستوى المجلس مع تحليل الاتجاه.',
        ],
      },
      {
        q: 'How effectively are your supply chain KPIs benchmarked against GCC peers and global best-practice standards, and how do findings drive target-setting?',
        qAr: 'ما مدى فعالية المقارنة المعيارية لمؤشرات أدائكم مع النظراء في الخليج والمعايير العالمية، وكيف تُغذّي النتائج تحديد الأهداف؟',
        levels: [
          'No external benchmarking is conducted. Targets are set from historical performance only.',
          'Informal awareness of industry benchmarks exists but targets are not formally adjusted.',
          'Annual benchmarking against published industry reports informs target-setting for major metrics.',
          'Formal benchmarking against GCC-specific and global peers is conducted annually and used to set stretch targets.',
          'Continuous benchmarking through a GCC peer network provides quarterly data that directly shapes the annual KPI target-setting exercise at executive level.',
        ],
        levelsAr: [
          'لا تُجرى أي مقارنة معيارية خارجية. تُحدَّد الأهداف من الأداء التاريخي فقط.',
          'يوجد وعي غير رسمي بمعايير الصناعة لكن الأهداف لا تُعدَّل رسميًا.',
          'المقارنة المعيارية السنوية مع تقارير الصناعة المنشورة تُغذّي تحديد الأهداف للمقاييس الرئيسية.',
          'تُجرى مقارنة معيارية رسمية مع النظراء في الخليج وعالميًا سنويًا وتُستخدَم لتحديد أهداف تطوير.',
          'مقارنة معيارية مستمرة عبر شبكة نظراء خليجية توفر بيانات فصلية تُشكّل مباشرةً تمرين تحديد مستهدفات المؤشرات السنوي على المستوى التنفيذي.',
        ],
      },
      {
        q: 'How structured is the review rhythm (weekly/monthly forums, defined attendees, standing agenda) through which KPI performance is actually governed?',
        qAr: 'ما مدى تنظيم إيقاع المراجعة (منتديات أسبوعية/شهرية، حضور محدد، جدول أعمال ثابت) الذي تُحوكَم من خلاله مؤشرات الأداء فعليًا؟',
        levels: [
          'No regular governance forum exists; KPIs are discussed only when someone happens to raise them.',
          'An informal, irregular review happens but without a fixed cadence, attendee list, or agenda.',
          'A monthly review forum exists with defined attendees and a standard agenda covering major KPIs.',
          'Weekly operational reviews and monthly management reviews are both structured, with different KPI granularity at each level.',
          'A full governance cadence (daily/weekly operational, monthly management, quarterly board) is documented with escalation rules between levels and consistently followed.',
        ],
        levelsAr: [
          'لا يوجد منتدى حوكمة منتظم؛ وتُناقَش المؤشرات فقط عندما يثيرها أحدهم صدفةً.',
          'تحدث مراجعة غير رسمية وغير منتظمة لكن دون وتيرة ثابتة أو قائمة حضور أو جدول أعمال.',
          'منتدى مراجعة شهري بحضور محدد وجدول أعمال قياسي يغطي المؤشرات الرئيسية.',
          'مراجعات تشغيلية أسبوعية ومراجعات إدارية شهرية منظمة، بمستوى تفصيل مختلف للمؤشرات في كل مستوى.',
          'إيقاع حوكمة كامل (تشغيلي يومي/أسبوعي، إداري شهري، مجلس ربع سنوي) موثّق بقواعد تصعيد بين المستويات ومُتَّبع باستمرار.',
        ],
      },
      {
        q: 'How rigorously are supply chain performance gaps root-caused — versus surface-level explanation that allows the same issue to recur?',
        qAr: 'ما مدى صرامة تحليل السبب الجذري لفجوات أداء سلسلة الإمداد — مقابل تفسير سطحي يسمح بتكرار المشكلة ذاتها؟',
        levels: [
          'Performance gaps are rarely discussed formally. Response is reactive and undocumented, with no root-cause analysis.',
          'Gaps are noted in reports but root-cause analysis is superficial and the same issues recur repeatedly.',
          'Significant gaps trigger a structured root-cause process with documented findings and corrective action plans.',
          'All KPI breaches trigger structured root-cause analysis; corrective actions are tracked to closure in a governance forum.',
          'An automated system flags deviations in real time; root-cause analysis is conducted within 5 days; lessons feed back into the KPI framework itself.',
        ],
        levelsAr: [
          'نادرًا ما تُناقَش فجوات الأداء رسميًا. الاستجابة تفاعلية وغير موثّقة، دون تحليل للسبب الجذري.',
          'تُلاحَظ الفجوات في التقارير لكن تحليل السبب الجذري سطحي والمشكلات ذاتها تتكرر باستمرار.',
          'تُطلق الفجوات الجوهرية عملية منظمة لتحليل السبب الجذري مع نتائج موثّقة وخطط إجراءات تصحيحية.',
          'جميع إخلالات المؤشرات تُطلق تحليلاً منظمًا للسبب الجذري؛ وتُتابَع الإجراءات التصحيحية حتى الإغلاق في منتدى الحوكمة.',
          'نظام آلي يُبلّغ عن الانحرافات آنيًا؛ ويُجرى تحليل السبب الجذري خلال 5 أيام؛ والدروس تُغذّي إطار المؤشرات ذاته.',
        ],
      },
      {
        q: 'After a corrective action is implemented, how rigorously is its actual effectiveness verified — versus being marked "closed" without confirming the problem stopped recurring?',
        qAr: 'بعد تنفيذ إجراء تصحيحي، ما مدى صرامة التحقق من فعاليته الفعلية — مقابل تصنيفه "مُغلَق" دون تأكيد توقف تكرار المشكلة؟',
        levels: [
          'Corrective actions are marked complete once implemented, with no follow-up to confirm the issue actually stopped.',
          'Occasional informal checks happen but there\'s no consistent process to verify effectiveness.',
          'A defined follow-up window (e.g. 30 days) checks whether the KPI has genuinely recovered before closing the action.',
          'Effectiveness verification (typically 60–90 days) is a mandatory closure step, tracked in the governance forum.',
          'Effectiveness is tracked as a formal metric (recurrence rate of "closed" issues), reviewed at board level, with recurring root causes escalated for structural fixes.',
        ],
        levelsAr: [
          'تُصنَّف الإجراءات التصحيحية مكتملة فور تنفيذها، دون متابعة لتأكيد توقف المشكلة فعليًا.',
          'تحدث مراجعات غير رسمية أحيانًا لكن دون عملية متسقة للتحقق من الفعالية.',
          'نافذة متابعة محددة (مثل 30 يومًا) تتحقق من تعافي المؤشر فعليًا قبل إغلاق الإجراء.',
          'التحقق من الفعالية (60–90 يومًا عادةً) خطوة إغلاق إلزامية، تُتابَع في منتدى الحوكمة.',
          'تُتابَع الفعالية كمقياس رسمي (معدل تكرار المشكلات "المُغلَقة")، يُراجَع على مستوى المجلس، مع تصعيد الأسباب الجذرية المتكررة لإصلاحات هيكلية.',
        ],
      },
      {
        q: 'Can frontline operational staff articulate the specific KPI targets relevant to their own role, and do they have real-time or near-real-time visibility into their own performance against those targets?',
        qAr: 'هل يستطيع موظفو الخط الأمامي التشغيليون تحديد مستهدفات المؤشرات المتعلقة بدورهم تحديدًا، وهل لديهم رؤية آنية أو شبه آنية لأدائهم مقابل تلك المستهدفات؟',
        levels: [
          'Frontline staff have no awareness of any KPIs relevant to their role; performance data, if it exists, stays at management level.',
          'Staff know broadly that "performance is measured" but cannot name their specific targets.',
          'Team-level targets are communicated and posted (physically or digitally) but updated infrequently.',
          'Staff have access to a dashboard showing their team\'s performance updated at least weekly against named targets.',
          'Individual or small-team performance is visible in near-real time via a live dashboard, with staff able to see exactly how their daily work moves the numbers.',
        ],
        levelsAr: [
          'لا يملك موظفو الخط الأمامي أي وعي بمؤشرات تخص دورهم؛ وبيانات الأداء، إن وُجدت، تبقى عند مستوى الإدارة.',
          'يعرف الموظفون بشكل عام أن "الأداء يُقاس" لكن لا يستطيعون تسمية مستهدفاتهم المحددة.',
          'تُبلَّغ مستهدفات الفريق وتُعرَض (ورقيًا أو رقميًا) لكن تُحدَّث بشكل غير متكرر.',
          'يملك الموظفون وصولاً إلى لوحة بيانات تُظهر أداء فريقهم مُحدَّثًا أسبوعيًا على الأقل مقابل مستهدفات محددة.',
          'أداء الفرد أو الفريق الصغير مرئي شبه آني عبر لوحة بيانات حيّة، ويستطيع الموظفون رؤية كيفية تأثير عملهم اليومي على الأرقام بدقة.',
        ],
      },
      {
        q: 'Are the people who set KPI targets independent of those who report actual performance against them — or can the same individuals who set an easy target also control how their own performance against it gets reported?',
        qAr: 'هل الأفراد الذين يحددون مستهدفات المؤشرات مستقلون عن أولئك الذين يُبلّغون عن الأداء الفعلي مقابلها — أم يستطيع الأفراد أنفسهم الذين يحددون مستهدفًا سهلًا التحكم أيضًا في كيفية إبلاغ أدائهم مقابله؟',
        levels: [
          'The same manager sets their own team\'s targets and self-reports performance against them, with no independent verification.',
          'Targets are nominally approved by a superior, but the approval is a formality and actual performance data still comes solely from the team being measured.',
          'Target-setting and performance data collection are formally assigned to separate roles (e.g. a central planning/reporting function pulls the actuals).',
          'KPI data is sourced directly from system-of-record reports (ERP/WMS/TMS) rather than self-submitted figures, removing the opportunity for the measured team to shape its own reported result.',
          'An independent function (internal audit or a central PMO) periodically samples KPI data integrity end-to-end, and any manual override of system-sourced figures requires documented, approved justification.',
        ],
        levelsAr: [
          'نفس المدير يحدد مستهدفات فريقه ويُبلّغ ذاتيًا عن الأداء مقابلها، دون تحقق مستقل.',
          'تُعتمَد المستهدفات اسميًا من رئيس أعلى، لكن الاعتماد شكلي وبيانات الأداء الفعلي ما زالت تأتي حصرًا من الفريق الخاضع للقياس.',
          'تحديد المستهدفات وجمع بيانات الأداء مُسندان رسميًا لدورين منفصلين (مثل جهة تخطيط/تقارير مركزية تسحب الأرقام الفعلية).',
          'تُستقى بيانات المؤشرات مباشرة من تقارير النظام المصدر (تخطيط الموارد/إدارة المستودعات/النقل) بدلاً من أرقام مُقدَّمة ذاتيًا، مما يُزيل فرصة تشكيل الفريق الخاضع للقياس لنتيجته المُبلَّغة.',
          'جهة مستقلة (التدقيق الداخلي أو مكتب إدارة مركزي) تُعاين دوريًا سلامة بيانات المؤشرات من طرف لطرف، وأي تجاوز يدوي للأرقام المصدرها النظام يتطلب مبررًا موثّقًا ومُعتمَدًا.',
        ],
      },
      {
        q: 'How much of the KPI dashboard is populated by automated data feeds from operational systems, versus manually compiled and potentially subject to error or selective reporting?',
        qAr: 'ما مدى تغذية لوحة بيانات المؤشرات ببيانات آلية من الأنظمة التشغيلية، مقابل بيانات مُجمَّعة يدويًا وعرضة للخطأ أو الإبلاغ الانتقائي؟',
        levels: [
          'All KPI figures are manually compiled into a spreadsheet or slide by whoever owns the report, with no system source-of-truth link.',
          'Some KPIs pull from systems, but many still require manual calculation or copying, especially cross-functional composite metrics.',
          'A defined subset of core KPIs is automatically extracted from source systems on a fixed schedule, with the rest still manual.',
          'The majority of KPIs are automated end-to-end from system to dashboard, with manual entry limited to a small number of genuinely qualitative metrics.',
          'The KPI framework is fully automated with a documented data lineage for every metric, and any manual adjustment is logged, time-stamped, and requires an approval workflow.',
        ],
        levelsAr: [
          'تُجمَّع جميع أرقام المؤشرات يدويًا في جدول بيانات أو عرض تقديمي من قِبل مالك التقرير، دون رابط بمصدر حقيقة نظامي.',
          'تسحب بعض المؤشرات من الأنظمة، لكن كثيرًا منها ما زال يتطلب حسابًا أو نسخًا يدويًا، خاصة المقاييس المركّبة متعددة الوظائف.',
          'مجموعة فرعية محددة من المؤشرات الأساسية تُستخرَج آليًا من الأنظمة المصدر وفق جدول ثابت، بينما تبقى البقية يدوية.',
          'معظم المؤشرات مؤتمتة من طرف لطرف من النظام إلى لوحة البيانات، ويقتصر الإدخال اليدوي على عدد محدود من المقاييس النوعية الحقيقية.',
          'إطار المؤشرات مؤتمت بالكامل بمسار بيانات موثّق لكل مقياس، وأي تعديل يدوي يُسجَّل بختم زمني ويتطلب مسار اعتماد.',
        ],
      },
      {
        q: 'Are KPI definitions and calculation methodologies formally documented, version-controlled, and periodically audited for consistency — or does "on-time delivery" (or any other metric) quietly mean something different depending on which team is reporting it?',
        qAr: 'هل تعريفات المؤشرات ومنهجيات حسابها موثّقة رسميًا وخاضعة لضبط الإصدار وتُدقَّق دوريًا للاتساق — أم أن "التسليم في الوقت المحدد" (أو أي مقياس آخر) يعني بهدوء شيئًا مختلفًا بحسب الفريق الذي يُبلّغ عنه؟',
        levels: [
          'KPI definitions exist only in each report-owner\'s head; the same-named metric can mean different things in different reports with no one noticing.',
          'A glossary of KPI definitions exists but is not consistently maintained or referenced when new reports are built.',
          'A version-controlled KPI dictionary defines calculation methodology for each core metric, and new reports are required to reference it.',
          'KPI definitions are formally owned by a governance function, changes require sign-off, and consistency is checked before any new dashboard goes live.',
          'KPI definition consistency is periodically audited across all reporting units, with discrepancies formally remediated and the dictionary treated as a controlled document subject to change management.',
        ],
        levelsAr: [
          'تعريفات المؤشرات موجودة فقط في ذهن مالك كل تقرير؛ ويمكن أن يعني المقياس نفسه الاسم أشياء مختلفة في تقارير مختلفة دون أن يلاحظ أحد ذلك.',
          'يوجد قاموس لتعريفات المؤشرات لكنه لا يُصان أو يُستخدَم باتساق عند بناء تقارير جديدة.',
          'قاموس مؤشرات خاضع لضبط الإصدار يحدد منهجية الحساب لكل مقياس أساسي، والتقارير الجديدة مُلزَمة بالرجوع إليه.',
          'تعريفات المؤشرات مملوكة رسميًا لجهة حوكمة، وتتطلب أي تغييرات اعتمادًا، ويُتحقَّق من الاتساق قبل إطلاق أي لوحة بيانات جديدة.',
          'يُدقَّق اتساق تعريفات المؤشرات دوريًا عبر جميع وحدات التقارير، وتُعالَج التباينات رسميًا، ويُعامَل القاموس كوثيقة مضبوطة خاضعة لإدارة التغيير.',
        ],
      },
      {
        q: 'If the primary KPI dashboard or reporting system became unavailable, is there a defined fallback process to keep performance governance running — or does the entire review cadence simply stop until the system is restored?',
        qAr: 'إذا أصبحت لوحة المؤشرات الرئيسية أو نظام التقارير غير متاح، هل توجد عملية احتياطية محددة لإبقاء حوكمة الأداء مستمرة — أم يتوقف إيقاع المراجعة بأكمله ببساطة إلى أن يُستعاد النظام؟',
        levels: [
          'There is no fallback; if the dashboard or reporting system is down, performance reviews are simply cancelled or postponed indefinitely.',
          'A manual workaround is improvised on an ad hoc basis when the system is down, with no consistency or defined process.',
          'A defined manual fallback process (e.g. pulling last-known figures from source systems directly) allows the review cadence to continue at reduced fidelity.',
          'A documented business-continuity procedure for the performance-governance system defines recovery time objectives and an interim manual reporting process.',
          'The fallback process has been actually tested (a simulated system outage), with a demonstrated ability to sustain governance cadence, and lessons formally incorporated into the IT disaster-recovery plan.',
        ],
        levelsAr: [
          'لا توجد خطة احتياطية؛ فإذا تعطلت لوحة البيانات أو نظام التقارير، تُلغى مراجعات الأداء ببساطة أو تُؤجَّل إلى أجل غير مسمى.',
          'يُرتجَل حل يدوي بديل بشكل عرضي عند تعطل النظام، دون اتساق أو عملية محددة.',
          'عملية احتياطية يدوية محددة (مثل سحب آخر أرقام معروفة مباشرة من الأنظمة المصدر) تسمح باستمرار إيقاع المراجعة بدقة مخفَّضة.',
          'إجراء استمرارية أعمال موثّق لنظام حوكمة الأداء يحدد أهداف زمن الاستعادة وعملية تقارير يدوية مؤقتة.',
          'العملية الاحتياطية اختُبِرَت فعليًا (محاكاة تعطل النظام)، مع قدرة مُثبَتة على الحفاظ على إيقاع الحوكمة، ودمج الدروس رسميًا في خطة التعافي من الكوارث لتقنية المعلومات.',
        ],
      },
    ],
  },

  /* ── 0-5  Digital & Innovation Roadmap ─────────────────────────────────────── */
  {
    id: 'strategy-digital',
    title: 'Digital & Innovation Roadmap',
    titleAr: 'خارطة طريق الرقمنة والابتكار',
    hint: 'Assesses whether digital transformation is a governed, business-outcome-driven programme — or a series of disconnected technology purchases that frontline staff quietly abandon after go-live.',
    hintAr: 'يقيس نضج خارطة طريق التحول الرقمي لسلسلة الإمداد وصرامة تقييم التقنيات وحوكمة الابتكار من الفكرة حتى النشر.',
    benchmarks: { gcc: 1.8, topQuartile: 3.5 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.5, banking: 1.5, other: 1.0,
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How mature and specific is your supply chain digital transformation roadmap — with clear technology priorities, investment cases, delivery timelines, and benefit realisation milestones?',
        qAr: 'ما مدى نضج وتحديد خارطة طريق التحول الرقمي لسلسلة الإمداد لديكم — بأولويات تقنية واضحة وحالات استثمار ومواعيد تسليم وأهداف تحقق الفوائد؟',
        levels: [
          'No digital roadmap exists. Technology decisions are ad-hoc, driven by vendor relationships or budget availability.',
          'A wish list of technology projects exists informally, with no structured roadmap or ownership.',
          'A documented roadmap covers the next 12–24 months with defined priorities, estimated investment, and assigned sponsors.',
          'A 3-year roadmap with approved investment cases and benefit realisation targets is reviewed quarterly.',
          'A board-approved 3–5 year roadmap is reviewed quarterly, with investment cases tied to measurable outcomes and benefit realisation tracked against commitments.',
        ],
        levelsAr: [
          'لا توجد خارطة طريق رقمية. قرارات التقنية ارتجالية يقودها العلاقة بالموردين أو توافر الميزانية.',
          'يوجد بشكل غير رسمي قائمة أمنيات بمشاريع تقنية، دون خارطة طريق منظمة أو ملكية.',
          'خارطة طريق موثّقة تغطي الـ 12–24 شهرًا القادمة بأولويات محددة واستثمار مُقدَّر وراعين معيَّنين.',
          'خارطة طريق لـ 3 سنوات بحالات استثمار معتمدة وأهداف تحقق فوائد تُراجَع فصليًا.',
          'خارطة طريق معتمدة من المجلس لـ 3–5 سنوات تُراجَع فصليًا، بحالات استثمار مرتبطة بنتائج قابلة للقياس وتحقق فوائد يُتابَع مقابل الالتزامات.',
        ],
      },
      {
        q: 'How rigorously are digital priorities validated against actual, quantified business pain points (e.g. specific bottlenecks, cost leakage, Arabic-language system usability, Etimad/Fasah/customs interface friction) — versus adopting technology because it is trending?',
        qAr: 'ما مدى صرامة التحقق من الأولويات الرقمية مقابل نقاط ألم فعلية ومُقاسة في الأعمال (اختناقات محددة، تسرّب تكاليف، قابلية استخدام الأنظمة باللغة العربية، احتكاك واجهات اعتماد/فسح/الجمارك) — مقابل تبنّي التقنية لأنها رائجة؟',
        levels: [
          'Technology is adopted because it\'s trending or a competitor has it, with no documented business pain point driving the decision.',
          'Some informal justification exists but it is not quantified or tied to a specific measurable problem.',
          'Each major digital investment has a documented business case identifying the specific pain point and expected quantified benefit.',
          'Digital priorities are ranked against a documented pain-point inventory (including GCC-specific friction points like government portal integration and Arabic UX), not just vendor pitches.',
          'A living pain-point register, continuously updated from frontline feedback and performance data, directly drives roadmap prioritisation, reviewed and re-ranked quarterly.',
        ],
        levelsAr: [
          'تُتبنّى التقنية لأنها رائجة أو لأن منافسًا يمتلكها، دون نقطة ألم موثّقة في الأعمال تقود القرار.',
          'يوجد تبرير غير رسمي لكنه غير مُقاس أو مرتبط بمشكلة محددة قابلة للقياس.',
          'كل استثمار رقمي رئيسي له حالة أعمال موثّقة تحدد نقطة الألم المحددة والفائدة المتوقعة المُقاسة.',
          'تُرتَّب الأولويات الرقمية مقابل قائمة موثّقة لنقاط الألم (بما يشمل نقاط احتكاك خاصة بالخليج مثل تكامل البوابات الحكومية وتجربة المستخدم بالعربية)، لا مجرد عروض الموردين.',
          'سجل حيّ لنقاط الألم، يُحدَّث باستمرار من ملاحظات الخط الأمامي وبيانات الأداء، يقود مباشرةً ترتيب أولويات خارطة الطريق، ويُراجَع ويُعاد ترتيبه فصليًا.',
        ],
      },
      {
        q: 'How systematically do you evaluate and pilot emerging supply chain technologies before committing to scaled deployment?',
        qAr: 'ما مدى منهجية تقييمكم وتجريبكم للتقنيات الناشئة في سلسلة الإمداد قبل الالتزام بالنشر الموسّع؟',
        levels: [
          'New technologies are adopted only when a vendor demonstrates the product; no structured evaluation process exists.',
          'Pilots occur reactively based on vendor proposals; no formal evaluation framework or success criteria.',
          'A structured evaluation process defines minimum criteria before piloting; pilots have defined scope and success measures.',
          'Pilots follow a stage-gate process with defined investment, success criteria, and executive sign-off before scaling.',
          'A dedicated innovation programme systematically scans the technology landscape quarterly and scales winners through a stage-gate process, backed by a ring-fenced budget.',
        ],
        levelsAr: [
          'تُتبنّى التقنيات الجديدة فقط عندما يعرضها مورد؛ ولا توجد عملية تقييم منظمة.',
          'تحدث التجارب بشكل تفاعلي بناءً على مقترحات الموردين؛ دون إطار تقييم رسمي أو معايير نجاح.',
          'عملية تقييم منظمة تحدد معايير دنيا قبل التجريب؛ والتجارب ذات نطاق ومقاييس نجاح محددة.',
          'تتبع التجارب عملية بوابات متدرجة بمعايير نجاح واستثمار محدد وموافقة تنفيذية قبل التوسيع.',
          'برنامج ابتكار متفرغ يفحص منهجيًا المشهد التقني فصليًا ويُوسّع الفائزين عبر عملية بوابات متدرجة، مدعومًا بميزانية محجوزة.',
        ],
      },
      {
        q: 'Is digital/innovation work resourced by a dedicated team with protected capacity, or does it compete informally with day-to-day IT support requests?',
        qAr: 'هل يُموَّل عمل الرقمنة/الابتكار بفريق متفرغ ذي طاقة محمية، أم يتنافس بشكل غير رسمي مع طلبات دعم تقنية المعلومات اليومية؟',
        levels: [
          'No dedicated resource exists; digital initiatives are squeezed in around IT\'s day-to-day support workload.',
          'One or two individuals are informally responsible, without protected time or a defined mandate.',
          'A small dedicated team or role exists with a defined mandate, though budget and headcount remain limited.',
          'A resourced digital/innovation function with its own budget line reports to a senior sponsor.',
          'A fully resourced centre of excellence with protected capacity, dedicated budget, and cross-functional authority drives the roadmap end to end.',
        ],
        levelsAr: [
          'لا يوجد مورد متفرغ؛ وتُحشَر المبادرات الرقمية بين أعباء الدعم اليومي لتقنية المعلومات.',
          'فرد أو اثنان مسؤولان بشكل غير رسمي، دون وقت محمي أو تفويض محدد.',
          'فريق أو دور متفرغ صغير موجود بتفويض محدد، لكن الميزانية والعدد الوظيفي محدودان.',
          'وظيفة رقمنة/ابتكار مموَّلة ببند موازنة خاص بها ترفع تقاريرها لراعٍ أول.',
          'مركز تميّز مموَّل بالكامل بطاقة محمية وميزانية مخصصة وصلاحية متعددة الوظائف يقود خارطة الطريق من طرف لطرف.',
        ],
      },
      {
        q: 'How effectively is supply chain innovation governed — from structured ideation and business case development through pilot evaluation and scaled deployment with verified value realisation?',
        qAr: 'ما مدى فعالية حوكمة الابتكار في سلسلة الإمداد — من توليد الأفكار المنظم وتطوير حالة الأعمال، مرورًا بتقييم التجارب، وحتى النشر الموسّع مع تحقق قيمة مُتحقَّق منها؟',
        levels: [
          'Innovation is unstructured and occasional. Ideas emerge informally and are not evaluated or tracked for value delivery.',
          'A basic suggestion mechanism exists but ideas rarely progress through structured evaluation.',
          'A governance process captures, evaluates, and prioritises ideas; funded pilots are tracked for outcomes.',
          'A formal governance board reviews a pipeline quarterly, approves pilots, tracks benefit realisation, and scales successes.',
          'A centre of excellence owns the pipeline, reports a balanced portfolio of pilots/scaled programmes, tracks cumulative value, and benchmarks innovation ROI against peers.',
        ],
        levelsAr: [
          'الابتكار غير منظم وعرضي. تنبثق الأفكار بشكل غير رسمي ولا تُقيَّم أو يُتابَع تسليمها للقيمة.',
          'يوجد آلية اقتراح أساسية لكن الأفكار نادرًا ما تُطوَّر عبر تقييم منظم.',
          'عملية حوكمة تلتقط وتقيّم وتُرتّب الأفكار حسب الأولوية؛ والتجارب الممولة تُتابَع مخرجاتها.',
          'مجلس حوكمة رسمي يراجع مسار الأفكار فصليًا ويعتمد التجارب ويتابع تحقق الفوائد ويُوسّع النجاحات.',
          'مركز تميّز يملك مسار الأفكار ويُبلّغ عن محفظة متوازنة من التجارب والبرامج الموسّعة ويتابع القيمة التراكمية ويُقارن عائد الابتكار مع النظراء.',
        ],
      },
      {
        q: 'After a digital tool is deployed, how well is actual frontline usage tracked and sustained — versus the tool quietly falling into disuse once the launch push ends?',
        qAr: 'بعد نشر أداة رقمية، ما مدى متابعة استخدام الخط الأمامي الفعلي واستمراريته — مقابل تراجع استخدام الأداة بهدوء بعد انتهاء زخم الإطلاق؟',
        levels: [
          'Usage is never tracked after go-live; anecdotally, most deployed tools fall into disuse within months.',
          'Usage data exists in the system but is not reviewed or acted upon.',
          'Adoption rate is checked at a defined milestone (e.g. 90 days post-launch) with a basic report.',
          'Adoption is tracked on an ongoing basis with a named owner accountable for driving usage back up if it drops.',
          'Live adoption dashboards track usage by team/individual against target, with a formal intervention playbook triggered automatically when adoption drops below threshold.',
        ],
        levelsAr: [
          'لا يُتابَع الاستخدام أبدًا بعد النشر؛ وتراجع معظم الأدوات المنشورة إلى عدم الاستخدام خلال أشهر بحسب الملاحظة غير الرسمية.',
          'توجد بيانات الاستخدام في النظام لكنها لا تُراجَع أو يُعمَل بها.',
          'يُتحقَّق من معدل التبني عند محطة محددة (مثل 90 يومًا بعد الإطلاق) بتقرير أساسي.',
          'يُتابَع التبني بشكل مستمر بمالك محدد مسؤول عن إعادة رفع الاستخدام إذا تراجع.',
          'لوحات بيانات حيّة تتابع التبني حسب الفريق/الفرد مقابل المستهدف، مع دليل تدخل رسمي يُفعَّل تلقائيًا عند انخفاض التبني دون الحد الأدنى.',
        ],
      },
      {
        q: 'How well does governance separate the individuals who evaluate and recommend a digital technology vendor from those with final authority to approve the contract and budget — guarding against vendor relationships influencing procurement decisions?',
        qAr: 'ما مدى فصل الحوكمة بين الأفراد الذين يُقيّمون ويوصون بمورّد تقنية رقمية وأولئك الذين يملكون الصلاحية النهائية لاعتماد العقد والموازنة — للحماية من تأثير العلاقات مع الموردين على قرارات الشراء؟',
        levels: [
          'The same individual evaluates the vendor, negotiates terms, and approves the contract, with no independent check.',
          'A second approval is technically required, but the approver rarely reviews the evaluation criteria or alternative vendors considered.',
          'Vendor evaluation and contract/budget approval are formally separated between two roles, with a documented comparison of at least two vendors required.',
          'Procurement policy enforces segregation through the approval workflow itself, and conflict-of-interest declarations are collected from evaluators before vendor selection is finalised.',
          'Segregation controls are periodically tested by internal audit, and vendor-selection decisions are sampled to confirm the documented evaluation criteria were genuinely applied, not retrofitted to justify a pre-decided choice.',
        ],
        levelsAr: [
          'نفس الفرد يُقيّم المورّد ويتفاوض على الشروط ويعتمد العقد، دون أي تحقق مستقل.',
          'يُشترط اعتماد ثانٍ رسميًا، لكن المُعتمِد نادرًا ما يراجع معايير التقييم أو الموردين البديلين الذين نُظر فيهم.',
          'تقييم المورّد واعتماد العقد/الموازنة مفصولان رسميًا بين دورين، مع اشتراط مقارنة موثّقة لموردين اثنين على الأقل.',
          'تفرض سياسة الشراء الفصل عبر مسار الاعتماد ذاته، وتُجمَع إقرارات تضارب المصالح من المُقيِّمين قبل نهائية اختيار المورّد.',
          'تُختبَر ضوابط الفصل دوريًا من التدقيق الداخلي، وتُعايَن قرارات اختيار الموردين للتأكد من التطبيق الحقيقي لمعايير التقييم الموثّقة، لا تبريرها لاحقًا لقرار مُتَّخَذ مسبقًا.',
        ],
      },
      {
        q: 'Is a formal cybersecurity and data-protection assessment a mandatory gate in the technology evaluation process — before a new digital tool touches supply chain data or systems — or is security reviewed only after go-live, if at all?',
        qAr: 'هل يُعدّ تقييم الأمن السيبراني وحماية البيانات بوابة إلزامية في عملية تقييم التقنية — قبل أن تلامس أداة رقمية جديدة بيانات أو أنظمة سلسلة الإمداد — أم يُراجَع الأمن فقط بعد الإطلاق، إن حدث أصلاً؟',
        levels: [
          'New digital tools are deployed with no formal security review; cybersecurity is considered only if an incident occurs afterward.',
          'IT informally checks basic security settings before go-live, but there is no standard assessment framework or documented sign-off.',
          'A standard security assessment (data classification, access controls, vendor security certification) is required before a new tool is approved for pilot.',
          'Cybersecurity sign-off is a mandatory, tracked gate in the stage-gate technology evaluation process, performed by a qualified security function, not self-assessed by the requesting team.',
          'Security posture is continuously monitored post-deployment (not just at go-live), with periodic penetration testing or vendor security re-certification required for tools handling critical supply chain data.',
        ],
        levelsAr: [
          'تُنشَر الأدوات الرقمية الجديدة دون مراجعة أمنية رسمية؛ ولا يُنظَر في الأمن السيبراني إلا في حال وقوع حادثة لاحقًا.',
          'تتحقق تقنية المعلومات بشكل غير رسمي من الإعدادات الأمنية الأساسية قبل الإطلاق، لكن دون إطار تقييم موحّد أو اعتماد موثّق.',
          'تقييم أمني موحّد (تصنيف البيانات، ضوابط الوصول، شهادات أمان المورّد) مطلوب قبل اعتماد أداة جديدة للتجريب.',
          'اعتماد الأمن السيبراني بوابة إلزامية متابَعة في عملية تقييم التقنية متعددة المراحل، تُنفّذها جهة أمنية مؤهَّلة، لا تقييم ذاتي من الفريق الطالب.',
          'تُراقَب الوضعية الأمنية باستمرار بعد النشر (لا عند الإطلاق فقط)، مع اختبار اختراق دوري أو إعادة اعتماد أمني للمورّد مطلوب للأدوات التي تتعامل مع بيانات سلسلة الإمداد الحرجة.',
        ],
      },
      {
        q: 'How explicitly does technology evaluation and rollout account for data residency, data privacy (e.g. PDPL-type regulation), and government-portal integration compliance requirements — as mandatory design constraints, not afterthoughts discovered post-deployment?',
        qAr: 'ما مدى وضوح مراعاة تقييم التقنية وطرحها لمتطلبات إقامة البيانات وخصوصيتها (مثل تنظيمات حماية البيانات الشخصية) ومتطلبات الامتثال لتكامل البوابات الحكومية — كقيود تصميم إلزامية، لا أفكارًا لاحقة تُكتشَف بعد النشر؟',
        levels: [
          'Data residency and privacy compliance are not considered during technology selection; issues are discovered, if at all, after deployment.',
          'Compliance is discussed informally but not documented as a formal requirement in the vendor selection criteria.',
          'A standard checklist requires confirmation of data residency and privacy compliance before a vendor contract is signed.',
          'Legal/compliance formally validates data governance requirements as a mandatory gate, and government-portal integration compliance (e.g. customs/tax platforms) is explicitly tested before go-live.',
          'Data governance and regulatory compliance are continuously monitored across the technology portfolio, with a maintained register tracking each tool\'s compliance status and any regulatory changes that could affect it.',
        ],
        levelsAr: [
          'لا يُنظَر في إقامة البيانات والامتثال للخصوصية أثناء اختيار التقنية؛ وتُكتشَف المشكلات، إن حدثت أصلاً، بعد النشر.',
          'يُناقَش الامتثال بشكل غير رسمي لكن دون توثيقه كمتطلب رسمي في معايير اختيار المورّد.',
          'قائمة تحقق موحّدة تستلزم تأكيد الامتثال لإقامة البيانات والخصوصية قبل توقيع عقد المورّد.',
          'تتحقق جهة القانونية/الامتثال رسميًا من متطلبات حوكمة البيانات كبوابة إلزامية، ويُختبَر صراحةً الامتثال لتكامل البوابات الحكومية (مثل منصات الجمارك/الضرائب) قبل الإطلاق.',
          'تُراقَب حوكمة البيانات والامتثال التنظيمي باستمرار عبر محفظة التقنية، مع سجل يُتابَع فيه حالة امتثال كل أداة وأي تغييرات تنظيمية قد تؤثر عليها.',
        ],
      },
      {
        q: 'If a critical digital supply chain system (ERP, TMS, WMS) suffered an outage, is there a tested manual fallback procedure to keep core operations running — or would operations simply stop until the system is restored?',
        qAr: 'إذا تعطل نظام رقمي حرج لسلسلة الإمداد (تخطيط الموارد، إدارة النقل، إدارة المستودعات)، هل توجد إجراءات احتياطية يدوية مُختبَرة لإبقاء العمليات الأساسية مستمرة — أم تتوقف العمليات ببساطة إلى أن يُستعاد النظام؟',
        levels: [
          'No fallback procedure exists for any critical system; an outage would halt core operations entirely until IT restores service.',
          'Staff know informally that "we\'d go back to manual" but there is no documented procedure or pre-prepared manual forms/tools.',
          'A documented manual fallback procedure exists for the most critical system(s), with pre-prepared forms or offline tools ready for use.',
          'Fallback procedures cover all critical digital systems, include a defined recovery time objective, and staff are trained on them periodically.',
          'Manual fallback procedures are actually tested through scheduled drills (not just documented), with recovery time measured against the objective and gaps formally remediated.',
        ],
        levelsAr: [
          'لا توجد إجراءات احتياطية لأي نظام حرج؛ وسيؤدي أي تعطل إلى توقف العمليات الأساسية بالكامل إلى أن تستعيد تقنية المعلومات الخدمة.',
          'يعرف الموظفون بشكل غير رسمي أنه "سنعود إلى العمل اليدوي" لكن دون إجراء موثّق أو نماذج/أدوات يدوية مُعدَّة مسبقًا.',
          'إجراء احتياطي يدوي موثّق موجود لأهم الأنظمة الحرجة، مع نماذج أو أدوات غير متصلة مُعدَّة مسبقًا وجاهزة للاستخدام.',
          'تغطي الإجراءات الاحتياطية جميع الأنظمة الرقمية الحرجة، وتتضمن هدف زمن استعادة محددًا، ويُدرَّب الموظفون عليها دوريًا.',
          'تُختبَر الإجراءات الاحتياطية اليدوية فعليًا عبر تمارين مجدولة (لا مجرد توثيقها)، ويُقاس وقت الاستعادة مقابل الهدف وتُعالَج الفجوات رسميًا.',
        ],
      },
    ],
  },

  /* ── 0-6  Supply Chain Financial Strategy & Value Creation ─────────────────────────────────────── */
  {
    id: 'strategy-financial',
    title: 'Supply Chain Financial Strategy & Value Creation',
    titleAr: 'الاستراتيجية المالية لسلسلة الإمداد وخلق القيمة',
    hint: 'Assesses whether supply chain strategy is deliberately and quantifiably linked to enterprise financial objectives — cost-to-serve strategy, working-capital strategy, supply chain P&L/value ownership, and investment/business-case discipline for major spend. This is a strategic-level financial linkage and governance lens, distinct from the operational execution of working-capital improvement covered elsewhere in the taxonomy: does supply chain leadership own and defend a P&L/value narrative to the board, is cost-to-serve modelled and used to shape strategy, is there rigorous business-case discipline for major capital asks, is working capital targeted strategically rather than just tactically managed.',
    hintAr: 'يقيس مدى امتلاك قيادة سلسلة الإمداد لسردية قيمة مالية مُقاسة والدفاع عنها، ونمذجة تكلفة الخدمة، وانضباط حالات الأعمال للاستثمارات الكبرى، واستهداف رأس المال العامل استراتيجيًا.',
    benchmarks: { gcc: 2.0, topQuartile: 3.7 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 0.5, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Cost-to-serve model, supply chain business-case template, or board value narrative sample',
      labelAr: 'نموذج تكلفة الخدمة أو نموذج حالة أعمال أو عرض سردية القيمة للمجلس',
      hint: 'Upload cost-to-serve model, supply chain business-case template, or board value narrative sample.',
      hintAr: 'ارفع نموذج تكلفة الخدمة، أو نموذج حالة أعمال لسلسلة الإمداد، أو نموذجًا لسردية القيمة المُقدَّمة لمجلس الإدارة.',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How rigorously is cost-to-serve modelled by customer/channel/segment, and how directly do the findings shape strategic decisions (pricing, channel strategy, service differentiation) — rather than sitting in a report no one acts on?',
        qAr: 'ما مدى صرامة نمذجة تكلفة الخدمة حسب العميل/القناة/الشريحة، وإلى أي درجة تُشكّل النتائج القرارات الاستراتيجية (التسعير، استراتيجية القنوات، تمايز الخدمة) — بدلاً من أن تبقى حبيسة تقرير لا يُعمَل به؟',
        levels: [
          'Cost-to-serve is not modelled at all. All customers and channels are assumed to be equally profitable; no data exists to challenge that assumption.',
          'A one-off cost-to-serve exercise has been done in the past, but it is outdated and was never repeated or acted upon.',
          'Cost-to-serve is modelled annually for major customer segments or channels, with findings presented to leadership.',
          'Cost-to-serve findings directly inform pricing, channel investment, and service-tier decisions, with a documented trail from analysis to decision.',
          'A continuously updated cost-to-serve model, granular to individual customer/SKU combinations, is a standing input to commercial strategy and is reviewed jointly by supply chain and commercial leadership at least quarterly.',
        ],
        levelsAr: [
          'لا تُنمذَج تكلفة الخدمة على الإطلاق. يُفترَض أن جميع العملاء والقنوات متساوون في الربحية؛ ولا توجد بيانات لتحدي هذا الافتراض.',
          'أُجري تمرين تكلفة خدمة لمرة واحدة في الماضي، لكنه قديم ولم يُكرَّر أو يُعمَل بنتائجه.',
          'تُنمذَج تكلفة الخدمة سنويًا للشرائح أو القنوات الرئيسية للعملاء، وتُعرَض النتائج على القيادة.',
          'تُوجّه نتائج تكلفة الخدمة مباشرةً قرارات التسعير والاستثمار في القنوات ومستويات الخدمة، مع مسار موثّق من التحليل إلى القرار.',
          'نموذج تكلفة خدمة مُحدَّث باستمرار، بدقة تصل إلى مستوى العميل/الصنف الفردي، مُدخَل ثابت في الاستراتيجية التجارية، وتُراجعه قيادة سلسلة الإمداد والقيادة التجارية معًا فصليًا على الأقل.',
        ],
      },
      {
        q: 'Does supply chain leadership own and personally defend a quantified value/P&L narrative in front of the board — articulating supply chain\'s contribution in financial terms — or is supply chain purely a cost centre reporting operational metrics upward?',
        qAr: 'هل تمتلك قيادة سلسلة الإمداد وتُدافع شخصيًا عن سردية قيمة/أرباح وخسائر مُقاسة أمام مجلس الإدارة — تُوضّح مساهمة سلسلة الإمداد بمصطلحات مالية — أم أن سلسلة الإمداد مجرد مركز تكلفة يرفع مؤشرات تشغيلية إلى الأعلى؟',
        levels: [
          'Supply chain reports only operational metrics (on-time delivery, inventory turns) to the board; there is no financial value narrative and no P&L framing at all.',
          'Cost figures are occasionally included in board reporting, but framed purely as spend, not as value created or protected.',
          'Supply chain leadership presents a defined set of financial contribution metrics (cost savings, working capital impact, cost avoidance) to the board annually.',
          'A quantified supply chain value narrative, tied to enterprise financial statements (margin, working capital, EBITDA impact), is presented and defended by supply chain leadership at least semi-annually.',
          'Supply chain leadership holds formal, board-recognised accountability for a value/P&L contribution target, reported and audited alongside other business unit P&Ls, with performance directly tied to leadership incentives.',
        ],
        levelsAr: [
          'تُرفَع لمجلس الإدارة مؤشرات تشغيلية فقط (التسليم في الوقت، دوران المخزون)؛ ولا توجد سردية قيمة مالية أو تأطير أرباح وخسائر على الإطلاق.',
          'تُدرَج أرقام التكلفة أحيانًا في تقارير المجلس، لكن تُؤطَّر كإنفاق فقط، لا كقيمة محقَّقة أو محمية.',
          'تعرض قيادة سلسلة الإمداد مجموعة محددة من مقاييس المساهمة المالية (وفورات التكلفة، أثر رأس المال العامل، تجنّب التكلفة) على المجلس سنويًا.',
          'سردية قيمة سلسلة إمداد مُقاسة، مرتبطة بالقوائم المالية المؤسسية (الهامش، رأس المال العامل، أثر الأرباح قبل الفوائد والضرائب والإهلاك)، تُعرَض وتُدافَع عنها قيادة سلسلة الإمداد نصف سنويًا على الأقل.',
          'تتحمّل قيادة سلسلة الإمداد مساءلة رسمية معترف بها من المجلس عن مستهدف مساهمة في القيمة/الأرباح والخسائر، تُرفَع وتُدقَّق إلى جانب أرباح وخسائر وحدات الأعمال الأخرى، ويرتبط الأداء مباشرةً بحوافز القيادة.',
        ],
      },
      {
        q: 'How rigorous and consistent is the business-case methodology required before major supply chain capital investment (new facility, automation, technology platform) is approved — and is realised value actually tracked against the original case afterward?',
        qAr: 'ما مدى صرامة واتساق منهجية حالة الأعمال المطلوبة قبل اعتماد استثمار رأسمالي كبير في سلسلة الإمداد (منشأة جديدة، أتمتة، منصة تقنية) — وهل تُتابَع القيمة المتحققة فعليًا مقابل الحالة الأصلية لاحقًا؟',
        levels: [
          'Major capital requests are approved based on a brief narrative with no standardised financial methodology (NPV, payback, IRR) required.',
          'A basic financial estimate is included informally, but methodology varies by requester and is not independently checked.',
          'A standard business-case template (defined financial methodology, sensitivity analysis) is required for all capital requests above a defined threshold.',
          'Business cases are independently reviewed by finance before executive approval, and a post-implementation check confirms whether projected benefits materialised at an agreed milestone.',
          'A formal capital governance process tracks realised value against every approved business case for 24+ months, feeding a documented track record that calibrates future business-case assumptions and improves approval discipline over time.',
        ],
        levelsAr: [
          'تُعتمَد طلبات رأس المال الكبرى بناءً على سرد مختصر دون اشتراط منهجية مالية موحّدة (صافي القيمة الحالية، فترة الاسترداد، معدل العائد الداخلي).',
          'يُدرَج تقدير مالي أساسي بشكل غير رسمي، لكن المنهجية تختلف حسب مقدّم الطلب ولا تُراجَع بشكل مستقل.',
          'قالب حالة أعمال موحّد (منهجية مالية محددة، تحليل حساسية) مطلوب لجميع طلبات رأس المال فوق حد محدد.',
          'تُراجَع حالات الأعمال بشكل مستقل من المالية قبل الاعتماد التنفيذي، وتُجرى مراجعة بعد التنفيذ للتحقق من تحقق الفوائد المتوقعة عند محطة متفق عليها.',
          'عملية حوكمة رأسمالية رسمية تتابع القيمة المتحققة مقابل كل حالة أعمال معتمدة لمدة 24 شهرًا فأكثر، وتُغذّي سجلًا موثّقًا يُعاير افتراضات حالات الأعمال المستقبلية ويُحسّن انضباط الاعتماد بمرور الوقت.',
        ],
      },
      {
        q: 'Is working capital (inventory, payables, receivables tied to supply chain decisions) targeted and owned as a deliberate strategic objective with board-level visibility — or is it managed reactively at a tactical level only when cash is tight?',
        qAr: 'هل يُستهدَف رأس المال العامل (المخزون، الذمم الدائنة، الذمم المدينة المرتبطة بقرارات سلسلة الإمداد) ويُمتلَك كهدف استراتيجي متعمَّد برؤية على مستوى المجلس — أم يُدار بشكل تفاعلي على المستوى التكتيكي فقط عندما تكون السيولة ضيقة؟',
        levels: [
          'Working capital is not a defined target at all. Attention to inventory or payables terms happens only reactively when cash is visibly tight.',
          'Working capital metrics (DIO, DPO, DSO) are tracked and reported, but with no formal target or strategic ownership.',
          'Defined working-capital targets exist for the supply chain function and are reviewed quarterly against actuals.',
          'Working capital targets are set jointly by supply chain and finance as part of the annual strategic planning cycle, with cross-functional initiatives (inventory strategy, payment terms strategy) explicitly designed to hit them.',
          'Working capital is a board-level strategic KPI with a multi-year improvement trajectory, benchmarked against GCC/global peers, and supply chain leadership is formally accountable for its contribution to enterprise cash conversion cycle.',
        ],
        levelsAr: [
          'رأس المال العامل ليس هدفًا محددًا على الإطلاق. يُولى الاهتمام بشروط المخزون أو الذمم الدائنة بشكل تفاعلي فقط عندما تكون السيولة ضيقة بشكل ملحوظ.',
          'تُتابَع مقاييس رأس المال العامل (أيام المخزون، أيام الذمم الدائنة، أيام الذمم المدينة) وتُرفَع تقاريرها، لكن دون هدف رسمي أو ملكية استراتيجية.',
          'مستهدفات محددة لرأس المال العامل موجودة لوظيفة سلسلة الإمداد وتُراجَع فصليًا مقابل الفعلي.',
          'تُحدَّد مستهدفات رأس المال العامل بشكل مشترك بين سلسلة الإمداد والمالية كجزء من دورة التخطيط الاستراتيجي السنوي، مع مبادرات متعددة الوظائف (استراتيجية المخزون، استراتيجية شروط الدفع) مصمَّمة صراحةً لتحقيقها.',
          'رأس المال العامل مؤشر استراتيجي على مستوى المجلس بمسار تحسين متعدد السنوات، يُقارَن مرجعيًا مع نظراء الخليج/العالميين، وتتحمّل قيادة سلسلة الإمداد مساءلة رسمية عن مساهمتها في دورة تحويل النقد المؤسسية.',
        ],
      },
      {
        q: 'After a major supply chain investment is completed, how rigorously is its actual financial return tracked against the original business case at the operational level — and are shortfalls investigated?',
        qAr: 'بعد اكتمال استثمار كبير في سلسلة الإمداد، ما مدى صرامة تتبّع عائده المالي الفعلي مقابل حالة الأعمال الأصلية على المستوى التشغيلي — وهل يُحقَّق في أوجه القصور؟',
        levels: [
          'Once an investment goes live, no one tracks whether it actually delivered the financial benefit the business case projected.',
          'Benefit realisation is checked informally, occasionally, by whoever remembers to ask, with no documented outcome.',
          'A defined checkpoint (e.g. 12 months post go-live) formally compares realised financial benefit to the original business case.',
          'Benefit realisation is tracked continuously against the business case, with shortfalls triggering a formal root-cause review and corrective action plan.',
          'An independent function validates realised value across the full investment portfolio, results feed back into how future business cases are appraised, and cumulative portfolio ROI is reported to the board.',
        ],
        levelsAr: [
          'بمجرد أن يبدأ الاستثمار العمل، لا يتابع أحد ما إذا كان قد حقق فعليًا الفائدة المالية التي توقعتها حالة الأعمال.',
          'يُتحقَّق من تحقق الفوائد بشكل غير رسمي وعرَضي من قِبل من يتذكّر السؤال، دون نتيجة موثّقة.',
          'نقطة تحقق محددة (مثل 12 شهرًا بعد الإطلاق) تقارن رسميًا الفائدة المالية المتحققة بحالة الأعمال الأصلية.',
          'يُتابَع تحقق الفوائد باستمرار مقابل حالة الأعمال، ويُطلق أي قصور مراجعة رسمية للسبب الجذري وخطة إجراء تصحيحي.',
          'جهة مستقلة تتحقق من القيمة المتحققة عبر محفظة الاستثمار الكاملة، وتُغذّي النتائج طريقة تقييم حالات الأعمال المستقبلية، ويُرفَع عائد الاستثمار التراكمي للمحفظة إلى المجلس.',
        ],
      },
      {
        q: 'Do frontline commercial and supply chain teams actually use cost-to-serve data to shape day-to-day decisions (order acceptance, service-level exceptions, channel routing) — or does the data stay confined to an annual strategy presentation?',
        qAr: 'هل تستخدم فرق المبيعات وسلسلة الإمداد في الخط الأمامي بيانات تكلفة الخدمة فعليًا لتشكيل القرارات اليومية (قبول الطلبات، استثناءات مستوى الخدمة، توجيه القنوات) — أم تبقى البيانات حبيسة عرض استراتيجي سنوي؟',
        levels: [
          'Frontline teams have no access to cost-to-serve data and no awareness it exists; every order or service exception is accepted regardless of profitability.',
          'Cost-to-serve findings are known to leadership but not translated into any practical guidance for frontline order or service decisions.',
          'Documented guidelines flag low-profitability customer/order profiles so frontline staff can apply extra scrutiny before accepting non-standard requests.',
          'Cost-to-serve thresholds are embedded in order-management or CRM system rules, flagging or requiring approval for orders that fall below a defined profitability bar.',
          'Real-time cost-to-serve visibility is available at the point of order entry, with automatic profitability scoring guiding accept/reject/escalate decisions, and outcomes are tracked to continuously refine the underlying model.',
        ],
        levelsAr: [
          'لا تملك فرق الخط الأمامي وصولاً إلى بيانات تكلفة الخدمة ولا وعيًا بوجودها؛ ويُقبَل كل طلب أو استثناء خدمة بصرف النظر عن الربحية.',
          'نتائج تكلفة الخدمة معروفة للقيادة لكنها لا تُترجَم إلى إرشادات عملية لقرارات الطلبات أو الخدمة في الخط الأمامي.',
          'إرشادات موثّقة تُشير إلى أنماط العملاء/الطلبات منخفضة الربحية بحيث يستطيع موظفو الخط الأمامي تطبيق تدقيق إضافي قبل قبول الطلبات غير القياسية.',
          'حدود تكلفة الخدمة مُضمَّنة في قواعد نظام إدارة الطلبات أو إدارة علاقات العملاء، وتُرصَد أو تتطلب اعتمادًا للطلبات التي تقل عن حد ربحية محدد.',
          'رؤية آنية لتكلفة الخدمة متاحة عند نقطة إدخال الطلب، مع تقييم ربحية آلي يوجّه قرارات القبول/الرفض/التصعيد، وتُتابَع النتائج لتحسين النموذج الأساسي باستمرار.',
        ],
      },
      {
        q: 'How well does governance separate the individuals who build a major supply chain business case from those with final authority to approve the capital — guarding against optimistic or self-serving projections going unchallenged?',
        qAr: 'ما مدى فصل الحوكمة بين الأفراد الذين يُعِدّون حالة أعمال كبرى لسلسلة الإمداد وأولئك الذين يملكون الصلاحية النهائية لاعتماد رأس المال — للحماية من مرور توقعات متفائلة أو ذات مصلحة ذاتية دون تحدٍّ؟',
        levels: [
          'The same team builds the business case and effectively controls its own approval, with no independent financial review.',
          'Finance technically signs off, but rarely challenges the assumptions behind the requesting team\'s projections.',
          'Business-case authorship and capital approval are formally separated, with finance required to independently validate key assumptions before sign-off.',
          'An independent capital-appraisal function stress-tests assumptions (demand, cost, timeline) and can reject or require revision of a business case before it reaches the board.',
          'Business-case approval decisions and their underlying assumptions are periodically audited against realised outcomes, with systematic optimism bias (if found) formally corrected in future appraisal methodology.',
        ],
        levelsAr: [
          'نفس الفريق يُعِدّ حالة الأعمال ويتحكّم فعليًا في اعتمادها، دون مراجعة مالية مستقلة.',
          'تعتمد المالية رسميًا، لكنها نادرًا ما تُشكّك في الافتراضات وراء توقعات الفريق الطالب.',
          'صياغة حالة الأعمال واعتماد رأس المال مفصولان رسميًا، وتتطلب المالية التحقق المستقل من الافتراضات الرئيسية قبل التوقيع.',
          'جهة تقييم رأسمالي مستقلة تختبر الافتراضات (الطلب، التكلفة، الجدول الزمني) تحت الضغط، ويمكنها رفض حالة الأعمال أو طلب تعديلها قبل وصولها للمجلس.',
          'تُدقَّق قرارات اعتماد حالات الأعمال وافتراضاتها الأساسية دوريًا مقابل النتائج المتحققة، ويُصحَّح أي تحيّز تفاؤل منهجي (إن وُجد) رسميًا في منهجية التقييم المستقبلية.',
        ],
      },
      {
        q: 'How much of the supply chain financial value narrative (cost-to-serve, working capital, benefit realisation) is generated from automated, system-sourced data — versus manually assembled from disparate spreadsheets each reporting cycle?',
        qAr: 'ما مدى تولّد سردية القيمة المالية لسلسلة الإمداد (تكلفة الخدمة، رأس المال العامل، تحقق الفوائد) من بيانات آلية مصدرها الأنظمة — مقابل تجميعها يدويًا من جداول بيانات متفرقة في كل دورة تقارير؟',
        levels: [
          'Every financial value report is manually rebuilt from scratch, pulling numbers from finance, ERP, and operational systems by hand.',
          'A standard template is reused, but the underlying data is still manually copied in and reconciled by hand each cycle.',
          'A defined data extract (cost, inventory, payables/receivables data) is generated semi-automatically from finance/ERP systems ahead of each reporting cycle.',
          'The value narrative dashboard pulls most figures automatically via system integration, with manual input limited to genuine judgement commentary.',
          'A live, integrated financial data layer feeds the value narrative continuously, with automated variance alerts when cost-to-serve or working-capital metrics drift materially from target.',
        ],
        levelsAr: [
          'كل تقرير قيمة مالية يُعاد بناؤه يدويًا من الصفر، بسحب الأرقام من المالية وتخطيط الموارد والأنظمة التشغيلية يدويًا.',
          'يُعاد استخدام قالب موحّد، لكن البيانات الأساسية تُنسَخ وتُطابَق يدويًا في كل دورة.',
          'مستخرَج بيانات محدد (التكلفة، المخزون، الذمم الدائنة/المدينة) يُولَّد شبه آليًا من أنظمة المالية/تخطيط الموارد قبل كل دورة تقارير.',
          'تسحب لوحة سردية القيمة معظم الأرقام آليًا عبر التكامل النظامي، ويقتصر الإدخال اليدوي على التعليقات التي تتطلب حكمًا فعليًا.',
          'طبقة بيانات مالية حية ومتكاملة تُغذّي سردية القيمة باستمرار، مع تنبيهات انحراف آلية عند ابتعاد مقاييس تكلفة الخدمة أو رأس المال العامل جوهريًا عن المستهدف.',
        ],
      },
      {
        q: 'Is there a documented policy governing how supply chain investment and working-capital decisions must be financially appraised and approved — consistent with enterprise finance policy — or does practice vary by whoever is requesting the spend?',
        qAr: 'هل توجد سياسة موثّقة تحكم كيفية التقييم المالي واعتماد قرارات استثمار سلسلة الإمداد ورأس المال العامل — بما يتسق مع سياسة المالية المؤسسية — أم تختلف الممارسة بحسب من يطلب الإنفاق؟',
        levels: [
          'No documented financial governance policy exists for supply chain investment; practice varies entirely by individual requester and approver.',
          'An informal understanding of expected practice exists but is not written down or consistently applied.',
          'A documented policy defines required financial methodology, approval thresholds, and roles for supply chain investment decisions.',
          'The policy is formally aligned with, and cross-referenced to, enterprise finance policy, and compliance with it is a mandatory gate before any capital request proceeds.',
          'Policy adherence is periodically audited, gaps are formally remediated, and the policy itself is reviewed and updated on a defined cycle to reflect evolving enterprise financial governance standards.',
        ],
        levelsAr: [
          'لا توجد سياسة حوكمة مالية موثّقة لاستثمار سلسلة الإمداد؛ وتختلف الممارسة كليًا بحسب الطالب والمُعتمِد الفرديين.',
          'يوجد فهم غير رسمي للممارسة المتوقعة لكنه غير مكتوب أو مُطبَّق باتساق.',
          'سياسة موثّقة تحدد المنهجية المالية المطلوبة وحدود الاعتماد والأدوار لقرارات استثمار سلسلة الإمداد.',
          'السياسة متسقة رسميًا ومُحال إليها من سياسة المالية المؤسسية، والامتثال لها بوابة إلزامية قبل المضي في أي طلب رأسمالي.',
          'يُدقَّق الالتزام بالسياسة دوريًا، وتُعالَج الفجوات رسميًا، وتُراجَع السياسة نفسها وتُحدَّث وفق دورة محددة لتعكس معايير حوكمة مالية مؤسسية متطورة.',
        ],
      },
      {
        q: 'When the business faces margin compression or a cash-flow shock, does supply chain have a pre-defined, financially quantified playbook of resilient responses (working-capital levers, cost-to-serve-based service tiering) ready to deploy — or is the response improvised and reactive?',
        qAr: 'عندما تواجه المؤسسة انضغاطًا في الهامش أو صدمة تدفق نقدي، هل تملك سلسلة الإمداد دليل استجابة مُحدَّدًا مسبقًا ومُقاسًا ماليًا (أدوات رأس المال العامل، تدرّج الخدمة القائم على تكلفة الخدمة) جاهزًا للتفعيل — أم أن الاستجابة مرتجلة وردّ فعل؟',
        levels: [
          'No pre-defined financial resiliency playbook exists; a margin or cash shock triggers an entirely improvised, ad hoc response.',
          'Leadership knows in general terms which levers could be pulled (delay capex, tighten inventory) but nothing is documented or quantified in advance.',
          'A documented list of working-capital and cost-to-serve levers exists, with an estimated financial impact for each, ready for leadership to consider.',
          'The playbook is formally pre-approved (trigger conditions, decision rights, sequencing of levers) so it can be activated quickly without a fresh approval cycle.',
          'The financial resiliency playbook has been activated in a real margin/cash event, with documented realised impact and lessons formally incorporated into the next version of the playbook.',
        ],
        levelsAr: [
          'لا يوجد دليل مرونة مالية مُحدَّد مسبقًا؛ وتُطلق صدمة الهامش أو النقد استجابة مرتجلة بالكامل.',
          'تُدرك القيادة بشكل عام الأدوات التي يمكن استخدامها (تأجيل النفقات الرأسمالية، تشديد المخزون) لكن دون توثيق أو تحديد كمي مسبق.',
          'قائمة موثّقة بأدوات رأس المال العامل وتكلفة الخدمة موجودة، مع أثر مالي مُقدَّر لكل منها، جاهزة لتنظر فيها القيادة.',
          'الدليل مُعتمَد رسميًا مسبقًا (شروط التفعيل، صلاحيات القرار، تسلسل الأدوات) بحيث يمكن تفعيله بسرعة دون دورة اعتماد جديدة.',
          'دليل المرونة المالية جرى تفعيله فعليًا في حدث حقيقي لضغط الهامش/النقد، مع أثر متحقق موثّق ودروس أُدمِجت رسميًا في النسخة التالية من الدليل.',
        ],
      },
    ],
  },

  /* ── 0-7  Operating Model & Organisational Design ─────────────────────────────────────── */
  {
    id: 'strategy-opmodel',
    title: 'Operating Model & Organisational Design',
    titleAr: 'النموذج التشغيلي والتصميم التنظيمي',
    hint: 'Assesses whether the supply chain function\'s structural design — centralized vs. decentralized, shared services vs. business-unit-embedded, regional vs. global, decision rights and RACI at leadership level — is a deliberate, periodically re-evaluated strategic choice, rather than historical accident. This is a structural/governance lens, distinct from the future Organisation & Talent segment, which owns capability-building, workforce planning, and talent development: is the operating model deliberately chosen and reviewed, are decision rights between corporate/regional/functional levels clearly defined, is there a defined process for redesigning the model when the business changes (M&A, new markets, growth), is accountability for end-to-end supply chain outcomes clearly owned rather than fragmented across silos.',
    hintAr: 'يقيس ما إذا كان التصميم الهيكلي لوظيفة سلسلة الإمداد — مركزي مقابل لا مركزي، خدمات مشتركة مقابل مدمج بوحدة الأعمال، إقليمي مقابل عالمي، وحقوق القرار على مستوى القيادة — خيارًا استراتيجيًا مقصودًا يُعاد تقييمه دوريًا، لا نتاج صدفة تاريخية.',
    benchmarks: { gcc: 1.9, topQuartile: 3.6 },
    industryWeights: {
      manufacturing: 1.0, fmcg: 1.0, pharma: 1.0, retail: 1.0,
      logistics: 1.0, marine: 1.0, construction: 1.0, oil_gas: 1.0,
      government: 1.0, technology: 1.0, banking: 1.0, other: 1.0,
    },
    evidence: {
      label: 'Organisational chart with decision-rights/RACI documentation, or most recent operating-model review',
      labelAr: 'مخطط تنظيمي بتوثيق حقوق القرار/RACI أو أحدث مراجعة للنموذج التشغيلي',
      hint: 'Upload organisational chart with decision-rights/RACI documentation, or most recent operating-model review.',
      hintAr: 'ارفع مخططًا تنظيميًا موضحًا حقوق القرار (RACI)، أو أحدث تقرير مراجعة للنموذج التشغيلي.',
    },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'Was your current supply chain operating model (centralized/decentralized, shared services/business-unit-embedded, regional/global) the result of a deliberate strategic choice, and is it periodically re-evaluated against changing business needs — or is it simply how things have always been structured?',
        qAr: 'هل كان نموذج التشغيل الحالي لسلسلة الإمداد لديكم (مركزي/لا مركزي، خدمات مشتركة/مُدمَج في وحدة الأعمال، إقليمي/عالمي) نتيجة خيار استراتيجي متعمَّد، وهل يُعاد تقييمه دوريًا مقابل احتياجات الأعمال المتغيرة — أم أنه ببساطة الشكل الذي كانت عليه الأمور دائمًا؟',
        levels: [
          'The current operating model is a product of historical accident — no one can articulate why it is structured this way, and it has never been formally re-evaluated.',
          'Leadership has an informal sense that the model "should probably change" but no formal review has ever been commissioned.',
          'A formal operating-model review has been conducted at least once, with documented rationale for the current structural choice.',
          'The operating model is reviewed on a defined cycle (e.g. every 2–3 years or triggered by major business change) with documented alternatives considered and trade-offs assessed.',
          'Operating-model design is a standing strategic discipline: it is explicitly re-tested against major business shifts (M&A, new market entry, digital transformation) as they occur, with board-level visibility into the rationale for the current structure.',
        ],
        levelsAr: [
          'النموذج التشغيلي الحالي نتاج صدفة تاريخية — لا يستطيع أحد توضيح سبب هذا الهيكل، ولم يُعَد تقييمه رسميًا قط.',
          'لدى القيادة إحساس غير رسمي بأن النموذج "ربما ينبغي أن يتغير" لكن لم تُكلَّف أي مراجعة رسمية قط.',
          'أُجريت مراجعة رسمية للنموذج التشغيلي مرة واحدة على الأقل، مع مبرر موثّق للخيار الهيكلي الحالي.',
          'يُراجَع النموذج التشغيلي وفق دورة محددة (كل 2-3 سنوات أو عند تغيّر جوهري في الأعمال) مع بدائل موثّقة مدروسة ومفاضلات مُقيَّمة.',
          'تصميم النموذج التشغيلي انضباط استراتيجي ثابت: يُعاد اختباره صراحةً مقابل التحولات الكبرى في الأعمال (الاستحواذ، دخول أسواق جديدة، التحول الرقمي) عند حدوثها، مع رؤية على مستوى المجلس لمبرر الهيكل الحالي.',
        ],
      },
      {
        q: 'Is there a single point of accountability for end-to-end supply chain performance (cost, service, cash) across the whole model — or is accountability fragmented across regional, functional, or business-unit silos with no one owning the full picture?',
        qAr: 'هل توجد نقطة مساءلة واحدة عن أداء سلسلة الإمداد من طرف لطرف (التكلفة، الخدمة، النقد) عبر النموذج بأكمله — أم أن المساءلة مجزّأة عبر صوامع إقليمية أو وظيفية أو خاصة بوحدات الأعمال دون أن يمتلك أحد الصورة الكاملة؟',
        levels: [
          'No single role or committee is accountable for end-to-end supply chain outcomes; performance issues are debated between silos with no clear owner.',
          'A senior leader is nominally titled "head of supply chain" but lacks actual authority over regional or business-unit-embedded teams that control most of the outcome.',
          'A defined RACI documents accountability for major end-to-end outcomes, though some decision rights remain genuinely shared or unclear at the margins.',
          'A single accountable executive has documented authority over the end-to-end model, with escalation paths clearly defined for cross-silo conflicts.',
          'End-to-end accountability is structurally embedded (reporting lines, budget authority, and incentive design all reinforce it), and is stress-tested by tracking how quickly and cleanly cross-silo issues actually get resolved.',
        ],
        levelsAr: [
          'لا يوجد دور أو لجنة واحدة مسؤولة عن نتائج سلسلة الإمداد من طرف لطرف؛ وتُناقَش مشكلات الأداء بين الصوامع دون مالك واضح.',
          'يحمل قائد أول لقب "رئيس سلسلة الإمداد" اسميًا لكنه يفتقر إلى صلاحية فعلية على الفرق الإقليمية أو المُدمَجة في وحدات الأعمال التي تتحكم بمعظم النتيجة.',
          'مصفوفة أدوار محددة توثّق المساءلة عن النتائج الرئيسية من طرف لطرف، رغم بقاء بعض صلاحيات القرار مشتركة فعليًا أو غير واضحة عند الحواف.',
          'تنفيذي مسؤول واحد يملك صلاحية موثّقة على النموذج من طرف لطرف، مع مسارات تصعيد محددة بوضوح لنزاعات الصوامع المتقاطعة.',
          'المساءلة من طرف لطرف مُضمَّنة هيكليًا (خطوط الرفع، صلاحية الموازنة، وتصميم الحوافز تُعزّزها جميعًا)، وتُختبَر تحت الضغط بتتبّع مدى سرعة ووضوح حل قضايا الصوامع المتقاطعة فعليًا.',
        ],
      },
      {
        q: 'How clearly are decision rights (who decides what — sourcing strategy, capex, supplier selection, service-level exceptions) documented and understood between corporate, regional, and functional/business-unit levels?',
        qAr: 'ما مدى وضوح توثيق وفهم صلاحيات القرار (من يقرر ماذا — استراتيجية التوريد، النفقات الرأسمالية، اختيار الموردين، استثناءات مستوى الخدمة) بين المستويات المؤسسية والإقليمية والوظيفية/وحدات الأعمال؟',
        levels: [
          'Decision rights are undocumented; the same type of decision might be made at corporate level in one instance and regionally in another, with no consistent logic.',
          'An informal understanding of "who usually decides" exists but is not written down, leading to recurring friction and duplicated effort.',
          'A documented decision-rights matrix (RACI or equivalent) covers the major decision categories across corporate/regional/functional levels.',
          'The decision-rights matrix is actively used to resolve real disputes, is embedded in governance forum charters, and is reviewed whenever a structural change occurs.',
          'Decision-rights clarity is measured (e.g. via a periodic survey of how consistently decisions are actually made at the documented level) and refined based on evidence of where real friction persists.',
        ],
        levelsAr: [
          'صلاحيات القرار غير موثّقة؛ وقد يُتَّخذ نوع القرار ذاته على المستوى المؤسسي في حالة وعلى المستوى الإقليمي في أخرى، دون منطق متسق.',
          'يوجد فهم غير رسمي لـ"من يقرر عادةً" لكنه غير مكتوب، مما يؤدي إلى احتكاك متكرر وازدواجية جهد.',
          'مصفوفة صلاحيات قرار موثّقة (RACI أو ما يعادلها) تغطي فئات القرار الرئيسية عبر المستويات المؤسسية والإقليمية والوظيفية.',
          'مصفوفة صلاحيات القرار تُستخدَم فعليًا لحل النزاعات الحقيقية، ومُضمَّنة في مواثيق منتديات الحوكمة، وتُراجَع عند حدوث أي تغيير هيكلي.',
          'يُقاس وضوح صلاحيات القرار (مثل عبر استطلاع دوري لمدى اتساق اتخاذ القرارات فعليًا عند المستوى الموثّق) ويُحسَّن استنادًا إلى أدلة على مواطن الاحتكاك الفعلي المستمرة.',
        ],
      },
      {
        q: 'When the business changes materially (M&A, new market entry, major growth or contraction), is there a defined process for evaluating whether the operating model needs to be redesigned — or does the existing structure simply get stretched to absorb the change?',
        qAr: 'عندما تتغير الأعمال جوهريًا (استحواذ، دخول سوق جديد، نمو أو انكماش كبير)، هل توجد عملية محددة لتقييم ما إذا كان النموذج التشغيلي بحاجة لإعادة تصميم — أم يُمَدَّد الهيكل الحالي ببساطة لاستيعاب التغيير؟',
        levels: [
          'Major business changes are absorbed into the existing structure by default; operating-model redesign is never formally considered as an option.',
          'Redesign is discussed informally when a major change occurs, but there is no defined trigger or process — it depends on whether someone happens to raise it.',
          'A defined trigger list (e.g. acquisition above a size threshold, entry into a new region) requires a formal operating-model assessment before integration proceeds.',
          'The redesign assessment process is standardised (defined methodology, timeline, decision-maker) and is consistently applied across all qualifying triggers.',
          'Operating-model redesign capability is a proven, repeatable competency — the organisation has successfully executed at least one material redesign, with a documented post-implementation review confirming the new structure delivered its intended outcomes.',
        ],
        levelsAr: [
          'تُستوعَب التغييرات الجوهرية في الأعمال ضمن الهيكل الحالي افتراضيًا؛ ولا يُنظَر أبدًا رسميًا في إعادة تصميم النموذج التشغيلي كخيار.',
          'تُناقَش إعادة التصميم بشكل غير رسمي عند حدوث تغيير كبير، لكن دون مُحفِّز أو عملية محددة — ويعتمد الأمر على ما إذا أثاره أحدهم صدفةً.',
          'قائمة مُحفِّزات محددة (مثل استحواذ يتجاوز حجمًا معينًا، دخول منطقة جديدة) تستلزم تقييمًا رسميًا للنموذج التشغيلي قبل المضي في الدمج.',
          'عملية تقييم إعادة التصميم موحّدة (منهجية وجدول زمني وصانع قرار محددون) وتُطبَّق باتساق عبر جميع المُحفِّزات المؤهِّلة.',
          'قدرة إعادة تصميم النموذج التشغيلي كفاءة مُثبَتة وقابلة للتكرار — نفّذت المؤسسة بنجاح إعادة تصميم جوهرية واحدة على الأقل، مع مراجعة موثّقة بعد التنفيذ تؤكد أن الهيكل الجديد حقق النتائج المقصودة.',
        ],
      },
      {
        q: 'In day-to-day practice, do cross-functional or cross-regional issues actually get escalated and resolved through the documented decision-rights structure — or do people route around it informally because the formal path doesn\'t really work?',
        qAr: 'في الممارسة اليومية، هل تُصعَّد القضايا متعددة الوظائف أو الأقاليم وتُحَل فعليًا عبر بنية صلاحيات القرار الموثّقة — أم يتحايل الأفراد عليها بشكل غير رسمي لأن المسار الرسمي لا يعمل فعليًا؟',
        levels: [
          'Staff routinely bypass the formal structure and resolve cross-functional issues through personal relationships, because the documented path is known not to work.',
          'The formal escalation path is used for major issues but is widely seen as slow, so minor-to-moderate issues are still handled informally.',
          'Most cross-functional and cross-regional issues are routed through the documented structure, with occasional informal exceptions.',
          'Adherence to the documented escalation structure is tracked (e.g. via governance forum minutes), with deviations flagged and discussed.',
          'The operating model functions as designed: escalation-path adherence is a tracked governance metric, and any recurring workaround is treated as a structural design signal that triggers a formal review.',
        ],
        levelsAr: [
          'يتجاوز الموظفون بشكل روتيني الهيكل الرسمي ويحلّون القضايا متعددة الوظائف عبر العلاقات الشخصية، لأن المسار الموثّق معروف بعدم عمله.',
          'يُستخدَم مسار التصعيد الرسمي للقضايا الكبرى لكنه يُعتبر بطيئًا على نطاق واسع، فتُعالَج القضايا الصغيرة إلى المتوسطة بشكل غير رسمي.',
          'تُوجَّه معظم القضايا متعددة الوظائف والأقاليم عبر الهيكل الموثّق، مع استثناءات غير رسمية عرضية.',
          'يُتابَع الالتزام ببنية التصعيد الموثّقة (مثل عبر محاضر منتديات الحوكمة)، وتُرصَد الانحرافات وتُناقَش.',
          'يعمل النموذج التشغيلي كما صُمِّم: الالتزام بمسار التصعيد مؤشر حوكمة مُتابَع، ويُعامَل أي تحايل متكرر كإشارة تصميم هيكلي تُطلق مراجعة رسمية.',
        ],
      },
      {
        q: 'Does actual staffing and reporting-line behaviour on the ground match the documented organisational structure — or has the org chart quietly drifted out of sync with how work actually gets done and by whom?',
        qAr: 'هل يتطابق التوظيف الفعلي وسلوك خطوط الرفع على أرض الواقع مع الهيكل التنظيمي الموثّق — أم انحرف المخطط التنظيمي بهدوء عن كيفية إنجاز العمل فعليًا ومَن ينجزه؟',
        levels: [
          'The org chart is significantly out of date; many staff report informally to someone different from their documented manager, and no one has reconciled this.',
          'Drift is acknowledged informally by managers but is not tracked or corrected in the system of record.',
          'A periodic reconciliation (e.g. annual HR audit) checks the org chart against actual reporting lines and staffing, correcting discrepancies found.',
          'The HR system of record is kept continuously synchronised with actual reporting relationships, with any change requiring formal approval before it takes effect informally.',
          'Structural drift is proactively monitored as a governance signal — a growing gap between documented and actual structure automatically triggers a review of whether the operating model itself needs updating.',
        ],
        levelsAr: [
          'المخطط التنظيمي قديم بشكل كبير؛ ويرفع كثير من الموظفين تقاريرهم بشكل غير رسمي لشخص مختلف عن مديرهم الموثّق، ولم يُوفَّق أحد بين ذلك.',
          'يُقِرّ المديرون بالانحراف بشكل غير رسمي لكنه لا يُتابَع أو يُصحَّح في النظام المرجعي.',
          'مطابقة دورية (مثل تدقيق موارد بشرية سنوي) تتحقق من المخطط التنظيمي مقابل خطوط الرفع والتوظيف الفعلية، وتصحح التباينات المكتشفة.',
          'نظام الموارد البشرية المرجعي يُبقى متزامنًا باستمرار مع علاقات الرفع الفعلية، ويتطلب أي تغيير اعتمادًا رسميًا قبل سريانه بشكل غير رسمي.',
          'يُراقَب الانحراف الهيكلي استباقيًا كإشارة حوكمة — وأي فجوة متنامية بين الهيكل الموثّق والفعلي تُطلق تلقائيًا مراجعة لما إذا كان النموذج التشغيلي نفسه بحاجة للتحديث.',
        ],
      },
      {
        q: 'When an operating-model redesign is proposed, is it independently reviewed (by a board committee, external advisor, or a function outside the one proposing the change) before adoption — guarding against a redesign that simply concentrates power with whoever proposed it?',
        qAr: 'عندما يُقترَح إعادة تصميم للنموذج التشغيلي، هل يُراجَع بشكل مستقل (من لجنة مجلس، مستشار خارجي، أو وظيفة خارج تلك التي اقترحت التغيير) قبل اعتماده — للحماية من إعادة تصميم يُركّز السلطة ببساطة لدى من اقترحه؟',
        levels: [
          'Operating-model changes are decided and implemented by whoever proposes them, with no independent review of the rationale or its implications.',
          'A senior leader technically approves the change, but rarely questions whether the proposed structure serves the enterprise better than the proposer\'s own interests.',
          'Major operating-model changes require review and sign-off by a governance body separate from the function proposing the redesign.',
          'An independent review (external advisor, internal audit, or a dedicated organisational-design committee) formally assesses proposed redesigns against enterprise-wide criteria before board approval.',
          'Operating-model decisions are periodically audited for concentration-of-power risk, and post-implementation outcomes are independently assessed against the enterprise-wide criteria used to justify the original change.',
        ],
        levelsAr: [
          'تُقرَّر تغييرات النموذج التشغيلي وتُنفَّذ من قِبل من يقترحها، دون مراجعة مستقلة للمبرر أو تبعاته.',
          'يعتمد قائد أول التغيير رسميًا، لكنه نادرًا ما يُشكّك في ما إذا كان الهيكل المقترح يخدم المؤسسة أفضل من مصالح مقدّم الاقتراح ذاته.',
          'تتطلب التغييرات الكبرى في النموذج التشغيلي مراجعة واعتمادًا من جهة حوكمة منفصلة عن الوظيفة المقترحة لإعادة التصميم.',
          'مراجعة مستقلة (مستشار خارجي، تدقيق داخلي، أو لجنة تصميم تنظيمي مخصصة) تُقيّم رسميًا إعادات التصميم المقترحة مقابل معايير مؤسسية شاملة قبل اعتماد المجلس.',
          'تُدقَّق قرارات النموذج التشغيلي دوريًا لمخاطر تركّز السلطة، وتُقيَّم النتائج بعد التنفيذ بشكل مستقل مقابل المعايير المؤسسية الشاملة التي استُخدِمت لتبرير التغيير الأصلي.',
        ],
      },
      {
        q: 'Is organisational structure, headcount, and decision-rights data maintained live in an HR/governance system that other systems (budget, approval workflows) can reference automatically — or does it live in a static chart that quickly falls out of date?',
        qAr: 'هل تُصان بيانات الهيكل التنظيمي والتوظيف وصلاحيات القرار حيّةً في نظام موارد بشرية/حوكمة يمكن لأنظمة أخرى (الموازنة، مسارات الاعتماد) الرجوع إليه آليًا — أم تعيش في مخطط ثابت يصبح قديمًا بسرعة؟',
        levels: [
          'Organisational structure exists only as a static chart (slide or PDF) that is manually redrawn whenever someone remembers to update it.',
          'An HR system holds basic reporting-line data, but approval workflows and budget systems maintain their own separate, inconsistent copies.',
          'A single system of record for organisational structure feeds approval workflows and budget systems through a defined (if periodic) synchronisation process.',
          'Organisational and decision-rights data is integrated live across HR, approval-workflow, and budget systems, so a structural change updates all downstream systems automatically.',
          'The live organisational data layer supports automated analytics (span of control, decision-rights bottleneck detection) that proactively flags structural issues before they cause operational friction.',
        ],
        levelsAr: [
          'يوجد الهيكل التنظيمي فقط كمخطط ثابت (عرض تقديمي أو ملف PDF) يُعاد رسمه يدويًا كلما تذكّر أحدهم تحديثه.',
          'يحتفظ نظام الموارد البشرية ببيانات خطوط رفع أساسية، لكن أنظمة الاعتماد والموازنة تحتفظ بنسخ منفصلة وغير متسقة خاصة بها.',
          'نظام مرجعي واحد للهيكل التنظيمي يُغذّي مسارات الاعتماد وأنظمة الموازنة عبر عملية مزامنة محددة (وإن كانت دورية).',
          'بيانات الهيكل التنظيمي وصلاحيات القرار متكاملة حيًا عبر أنظمة الموارد البشرية ومسارات الاعتماد والموازنة، بحيث يُحدَّث أي تغيير هيكلي جميع الأنظمة التابعة تلقائيًا.',
          'طبقة بيانات تنظيمية حية تدعم تحليلات آلية (نطاق الإشراف، رصد اختناقات صلاحيات القرار) تُنبّه استباقيًا بالمشكلات الهيكلية قبل أن تسبب احتكاكًا تشغيليًا.',
        ],
      },
      {
        q: 'Is there a documented policy defining who has authority to approve a change to the supply chain operating model (a new shared-services unit, a shift from regional to global ownership of a decision) — or can structural change happen informally without any consistent governance gate?',
        qAr: 'هل توجد سياسة موثّقة تحدد من يملك صلاحية اعتماد تغيير في النموذج التشغيلي لسلسلة الإمداد (وحدة خدمات مشتركة جديدة، تحوّل من ملكية إقليمية إلى عالمية لقرار ما) — أم يمكن أن يحدث التغيير الهيكلي بشكل غير رسمي دون أي بوابة حوكمة متسقة؟',
        levels: [
          'No policy defines who can approve a structural change; changes happen whenever a sufficiently senior person decides to make them.',
          'An informal norm exists that "big changes need executive sign-off" but it is not written down or consistently enforced.',
          'A documented policy defines the approval authority and required process for structural changes above a defined scope.',
          'The policy is formally integrated into enterprise governance (board committee charter, delegation-of-authority matrix) and compliance is a mandatory gate before implementation.',
          'Adherence to the operating-model governance policy is periodically audited, unauthorised structural drift is formally investigated when found, and the policy is reviewed on a defined cycle.',
        ],
        levelsAr: [
          'لا توجد سياسة تحدد من يستطيع اعتماد تغيير هيكلي؛ وتحدث التغييرات كلما قرر شخص أول بما يكفي إجراءها.',
          'يوجد عرف غير رسمي بأن "التغييرات الكبرى تحتاج اعتمادًا تنفيذيًا" لكنه غير مكتوب أو مُطبَّق باتساق.',
          'سياسة موثّقة تحدد صلاحية الاعتماد والعملية المطلوبة للتغييرات الهيكلية التي تتجاوز نطاقًا محددًا.',
          'السياسة مُدمَجة رسميًا في الحوكمة المؤسسية (ميثاق لجنة المجلس، مصفوفة تفويض الصلاحيات)، والامتثال بوابة إلزامية قبل التنفيذ.',
          'يُدقَّق الالتزام بسياسة حوكمة النموذج التشغيلي دوريًا، ويُحقَّق رسميًا في أي انحراف هيكلي غير مصرَّح به عند اكتشافه، وتُراجَع السياسة وفق دورة محددة.',
        ],
      },
      {
        q: 'If a key structural decision-maker (regional supply chain head, shared-services director) departed suddenly, would the operating model continue functioning as designed — or does the structure quietly depend on specific individuals holding it together informally?',
        qAr: 'إذا غادر صانع قرار هيكلي رئيسي (رئيس سلسلة إمداد إقليمي، مدير خدمات مشتركة) فجأة، هل سيستمر النموذج التشغيلي في العمل كما صُمِّم — أم أن الهيكل يعتمد بهدوء على أفراد محددين يُبقونه متماسكًا بشكل غير رسمي؟',
        levels: [
          'The operating model is known to depend heavily on a few key individuals; their sudden departure would likely cause visible structural breakdown.',
          'This dependency risk is acknowledged informally by leadership, but no succession or contingency plan exists for key structural roles.',
          'A defined succession plan exists for the most critical structural roles, with a named backup for each.',
          'Backups for key structural roles are actively cross-trained and have demonstrated working knowledge of the decision rights and relationships tied to the role, not just a title on a succession chart.',
          'Structural resilience to key-leader departure has been actually tested (a real transition or a simulated exercise), with a documented outcome confirming the model continued functioning without material disruption.',
        ],
        levelsAr: [
          'من المعروف أن النموذج التشغيلي يعتمد بشدة على عدد قليل من الأفراد الرئيسيين؛ ومن المرجح أن تتسبب مغادرتهم المفاجئة بانهيار هيكلي واضح.',
          'يُقِرّ القادة بمخاطر هذا الاعتماد بشكل غير رسمي، لكن لا توجد خطة تعاقب أو طوارئ للأدوار الهيكلية الرئيسية.',
          'خطة تعاقب محددة موجودة لأهم الأدوار الهيكلية الحرجة، ببديل مُسمّى لكل منها.',
          'البدائل للأدوار الهيكلية الرئيسية يخضعون لتدريب متبادل فعّال ولديهم معرفة عملية مُثبَتة بصلاحيات القرار والعلاقات المرتبطة بالدور، لا مجرد اسم على مخطط تعاقب.',
          'مرونة الهيكل أمام مغادرة قائد رئيسي اختُبِرَت فعليًا (انتقال حقيقي أو تمرين محاكاة)، مع نتيجة موثّقة تؤكد استمرار عمل النموذج دون اضطراب جوهري.',
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
          'ثقافة TCO تُبنى بفاعلية عبر الأعمال؛ وقالب مبرر تجاري المشتريات يلزم بتحليل TCO لكل الإنفاق فوق الحد؛ والمشتريات تُقدّم بانتظام أدلة TCO لتحدي حالات الأعمال المدفوعة بسعر الشراء — وتكسب.',
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
          'تمرين نظري (Tabletop) منظم أو اختبار رسمي للخطة يُجرى سنويًا؛ والنتائج موثّقة وتُستخدَم لتحديث الخطط خلال 90 يومًا.',
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
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
