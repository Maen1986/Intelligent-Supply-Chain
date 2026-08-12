/**
 * maturityData.tsx
 * All segment definitions, industry modules, and intake options for the
 * Supply Chain Maturity Assessment.  Extracted so Maturity.tsx can stay
 * focused on component logic.
 */
import {
  GitBranch, ShoppingCart, FileText, Users, Shield, Leaf, Cpu,
  BarChart2, Package, Truck, GraduationCap,
  Factory, Ship, Scale, BadgeCheck,
} from 'lucide-react';
import {
  STRATEGY_SUB_SEGMENTS,
  PROCUREMENT_SUB_SEGMENTS,
  CLM_SUB_SEGMENTS,
  SRM_SUB_SEGMENTS,
  RISK_SUB_SEGMENTS,
} from './maturitySubSegData1to5';
import {
  ESG_SUB_SEGMENTS,
  DIGITAL_SUB_SEGMENTS,
  DEMAND_SUB_SEGMENTS,
  INVENTORY_SUB_SEGMENTS,
  LOGISTICS_SUB_SEGMENTS,
  ORG_TALENT_SUB_SEGMENTS,
  MFG_OPS_SUB_SEGMENTS,
  FLEET_OPS_SUB_SEGMENTS,
  REGULATORY_SUB_SEGMENTS,
  QUALITY_SUB_SEGMENTS,
} from './maturitySubSegData6to11';

/* ── Interfaces ──────────────────────────────────────────────────────────── */

export interface Question {
  q: string;
  qAr: string;
  levels:   [string, string, string, string, string];
  levelsAr: [string, string, string, string, string];
  /** 1–4 industry framework/standard abbreviations most relevant to this question */
  frameworks?: string[];
}

/**
 * A named sub-dimension within a Segment.
 * Answer keys: "{segIdx}-{subIdx}-{questionIdx}"  (3-part format)
 * Distinct from the legacy 5 flat questions which use "{segIdx}-{questionIdx}" (2-part).
 */
export interface SubSegment {
  id: string;
  title: string;
  titleAr: string;
  /** Optional hint shown to the user before they answer this sub-segment */
  hint?: string;
  hintAr?: string;
  /** 1–4 industry framework/standard abbreviations most relevant to this sub-segment */
  frameworks?: string[];
  questions: Question[];
  /** Sub-segment level benchmarks — distinct from parent segment benchmarks */
  benchmarks: { gcc: number; topQuartile: number };
  /**
   * Industry relevance weights: 0.5 = low, 1.0 = baseline, 1.5 = high.
   * Missing industry keys default to 1.0 in the scoring engine.
   */
  industryWeights: Record<string, number>;
  /**
   * Present on ~30–40 qualifying sub-segments where a documentable artefact
   * plausibly exists (frameworks, registers, scorecards, policy documents).
   * Populated by the evidence & confidence tier feature (#710).
   */
  evidence?: {
    label: string;
    labelAr: string;
    hint: string;
    hintAr: string;
  };
}

export interface Segment {
  id: string;
  title: string;
  titleAr: string;
  shortTitle: string;
  shortTitleAr: string;
  icon: React.ElementType;
  color: string;
  /** 1–4 industry framework/standard abbreviations most relevant to this segment */
  frameworks?: string[];
  questions: Question[];
  /** Named sub-segments (6 per segment). Populated via maturitySubSegData1to5.ts */
  subSegments?: SubSegment[];
  benchmarks: { gcc: number; global: number; best: number };
  recommendations:   Record<string, string>;
  recommendationsAr: Record<string, string>;
  /** Present only on industry modules — which industryId values trigger it */
  moduleFor?: string[];
}

export interface IntakeData {
  industry:    string;
  companySize: string;
}

/* ── Intake options ──────────────────────────────────────────────────────── */

export const INTAKE_INDUSTRIES = [
  { id: 'manufacturing',    label: 'Manufacturing',               labelAr: 'التصنيع' },
  { id: 'fmcg',             label: 'FMCG & Food',                 labelAr: 'السلع الاستهلاكية والغذاء' },
  { id: 'pharma',           label: 'Healthcare & Pharma',         labelAr: 'الرعاية الصحية والصيدلة' },
  { id: 'retail',           label: 'Retail & Consumer Goods',     labelAr: 'التجزئة والسلع الاستهلاكية' },
  { id: 'logistics',        label: 'Logistics & Distribution',    labelAr: 'اللوجستيات والتوزيع' },
  { id: 'marine',           label: 'Marine, Ports & Shipping',    labelAr: 'الملاحة والموانئ والشحن' },
  { id: 'construction',     label: 'Construction & Real Estate',  labelAr: 'المقاولات والعقارات' },
  { id: 'oil_gas',          label: 'Oil, Gas & Energy',           labelAr: 'النفط والغاز والطاقة' },
  { id: 'government',       label: 'Government & Public Sector',  labelAr: 'الحكومة والقطاع العام' },
  { id: 'technology',       label: 'Technology & Services',       labelAr: 'التقنية والخدمات' },
  { id: 'banking',          label: 'Banking & Financial Services', labelAr: 'البنوك والخدمات المالية' },
  { id: 'other',            label: 'Other',                       labelAr: 'أخرى' },
];

export const INTAKE_SIZES = [
  { id: 'startup',     label: 'Startup',           labelAr: 'شركة ناشئة',    sub: '< SAR 10M revenue',      subAr: 'أقل من 10 م ر.س إيرادات' },
  { id: 'sme',         label: 'SME',               labelAr: 'صغيرة ومتوسطة', sub: 'SAR 10M–100M',           subAr: '10–100 م ر.س' },
  { id: 'midmarket',   label: 'Mid-Market',        labelAr: 'متوسطة الحجم',   sub: 'SAR 100M–1B',            subAr: '100 م – 1 مليار ر.س' },
  { id: 'enterprise',  label: 'Enterprise',        labelAr: 'مؤسسة كبرى',    sub: 'SAR 1B+ revenue',        subAr: 'أكثر من مليار ر.س' },
  { id: 'government',  label: 'Government Entity', labelAr: 'جهة حكومية',    sub: 'Ministry / Authority / SOE', subAr: 'وزارة / هيئة / شركة حكومية' },
];

/* ── Helper: select the active industry module ───────────────────────────── */

export function getActiveModule(industryId: string): Segment | null {
  return INDUSTRY_MODULES.find(m => m.moduleFor?.includes(industryId)) ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CORE SEGMENTS — 11 universal segments (55 questions)
═══════════════════════════════════════════════════════════════════════════ */

export const CORE_SEGMENTS: Segment[] = [

  /* ── 1. STRATEGY ──────────────────────────────────────────────────────── */
  {
    id: 'strategy',
    title: 'Supply Chain Strategy & Design',
    titleAr: 'استراتيجية وتصميم سلسلة الإمداد',
    shortTitle: 'Strategy',
    shortTitleAr: 'الاستراتيجية',
    icon: GitBranch,
    color: '#0B3D91',
    benchmarks: { gcc: 2.4, global: 2.9, best: 4.6 },
    frameworks: ['ASCM/SCOR', 'Gartner', 'IBP'],
    questions: [
      {
        q: 'How well-defined and documented is your supply chain strategy, including its alignment to corporate goals and a 3–5 year roadmap?',
        qAr: 'ما مدى وضوح استراتيجية سلسلة الإمداد لديكم وتوثيقها، بما في ذلك مواءمتها مع الأهداف المؤسسية ووجود خارطة طريق لمدة 3–5 سنوات؟',
        levels: [
          'No formal strategy exists. Decisions are made reactively based on immediate operational pressures with no documented direction.',
          'A basic supply chain direction exists but is informal, undocumented, and not explicitly linked to corporate objectives.',
          'A documented supply chain strategy exists, is aligned to corporate goals, and is communicated to key stakeholders.',
          'The strategy is formally approved, reviewed annually, tracked against KPIs, and adjusted based on performance data and market changes.',
          'A board-approved, comprehensive supply chain strategy drives capital allocation decisions, is reviewed annually, and is a core input to corporate planning cycles.',
        ],
        levelsAr: [
          'لا توجد استراتيجية رسمية. تُتخذ القرارات بشكل تفاعلي استجابةً للضغوط التشغيلية الآنية دون توجّه موثّق.',
          'يوجد توجّه أساسي لسلسلة الإمداد لكنه غير رسمي وغير موثّق وغير مرتبط صراحةً بالأهداف المؤسسية.',
          'توجد استراتيجية موثّقة لسلسلة الإمداد، مواءَمة مع الأهداف المؤسسية، ويتم إبلاغها لأصحاب المصلحة الرئيسيين.',
          'الاستراتيجية معتمدة رسميًا وتُراجَع سنويًا وتُتابَع مقابل مؤشرات الأداء، وتُعدَّل بناءً على بيانات الأداء وتغيّرات السوق.',
          'استراتيجية شاملة معتمدة من مجلس الإدارة توجّه قرارات تخصيص رأس المال، وتُراجَع سنويًا، وتُعد مدخلاً محوريًا في دورات التخطيط المؤسسي.',
        ],
      },
      {
        q: 'How regularly do you conduct end-to-end supply chain network design reviews, including footprint, transportation lanes, and distribution models?',
        qAr: 'ما مدى انتظامكم في إجراء مراجعات لتصميم شبكة سلسلة الإمداد من طرف إلى طرف، بما في ذلك النطاق التشغيلي ومسارات النقل ونماذج التوزيع؟',
        levels: [
          'The supply chain network has never been formally mapped or evaluated for optimisation opportunities.',
          'Informal reviews occur reactively when problems arise; no structured methodology, tools, or defined scope is applied.',
          'Periodic network reviews are conducted with defined scope, though infrequently (every 3–5 years) and without advanced modelling tools.',
          'Annual network design reviews use quantitative modelling to evaluate trade-offs across cost, service level, and risk dimensions.',
          'Bi-annual reviews use digital twin modelling and multi-scenario simulation to continuously optimise the end-to-end network footprint.',
        ],
        levelsAr: [
          'لم يتم رسم خريطة شبكة سلسلة الإمداد أو تقييمها رسميًا لفرص التحسين على الإطلاق.',
          'تُجرى مراجعات غير رسمية بشكل تفاعلي عند ظهور المشكلات؛ دون منهجية منظمة أو أدوات أو نطاق محدّد.',
          'تُجرى مراجعات دورية للشبكة بنطاق محدّد، لكنها غير متكررة (كل 3–5 سنوات) ودون أدوات نمذجة متقدمة.',
          'تستخدم مراجعات تصميم الشبكة السنوية النمذجة الكمية لتقييم المفاضلات عبر أبعاد التكلفة ومستوى الخدمة والمخاطر.',
          'تستخدم المراجعات نصف السنوية نمذجة التوأم الرقمي ومحاكاة السيناريوهات المتعددة لتحسين النطاق التشغيلي للشبكة بالكامل بشكل مستمر.',
        ],
      },
      {
        q: 'How effectively is your supply chain strategy linked to financial planning and capital allocation through an executive IBP or S&OP governance process?',
        qAr: 'ما مدى فعالية ربط استراتيجية سلسلة الإمداد بالتخطيط المالي وتخصيص رأس المال من خلال عملية IBP أو S&OP تنفيذية؟',
        levels: [
          'No linkage exists between supply chain planning and financial planning. Capital allocation decisions are made independently of supply chain strategy.',
          'Basic S&OP meetings occur but financial reconciliation is absent; supply chain inputs rarely influence capital allocation decisions.',
          'An S&OP process provides supply chain inputs to financial planning with some alignment on major investment decisions.',
          'S&OP includes formal financial reconciliation and executive review, consistently linking supply chain plans to near-term capital and procurement decisions.',
          'A fully integrated IBP process runs monthly with executive engagement and direct linkage between supply chain strategy, financial forecasting, and capital allocation at board level.',
        ],
        levelsAr: [
          'لا توجد رابطة بين تخطيط سلسلة الإمداد والتخطيط المالي. تُتخذ قرارات تخصيص رأس المال بشكل مستقل عن استراتيجية سلسلة الإمداد.',
          'تُعقد اجتماعات S&OP أساسية لكن المطابقة المالية غائبة؛ ونادرًا ما تؤثر مدخلات سلسلة الإمداد في قرارات تخصيص رأس المال.',
          'توفر عملية S&OP مدخلات سلسلة الإمداد للتخطيط المالي مع بعض المواءمة على قرارات الاستثمار الكبرى.',
          'تشمل S&OP مطابقة مالية رسمية ومراجعة تنفيذية، وتربط باستمرار خطط سلسلة الإمداد بقرارات رأس المال والمشتريات قصيرة المدى.',
          'تعمل عملية IBP متكاملة تمامًا شهريًا بمشاركة تنفيذية وربط مباشر بين استراتيجية سلسلة الإمداد والتنبؤ المالي وتخصيص رأس المال على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively do you use scenario planning and supply chain simulation to evaluate strategic options (e.g., nearshoring, new markets, disruptions)?',
        qAr: 'ما مدى فعالية استخدامكم لتخطيط السيناريوهات ومحاكاة سلسلة الإمداد لتقييم الخيارات الاستراتيجية (مثل التوطين القريب والأسواق الجديدة والاضطرابات)؟',
        levels: [
          'No scenario planning is conducted. Major strategic decisions rely entirely on intuition and past experience.',
          'Informal "what-if" discussions occur but are undocumented, inconsistent, and not used to formally drive decisions.',
          'Basic scenario planning is applied to major decisions using spreadsheet-based analysis with limited variables modelled.',
          'Structured scenario planning with quantified financial and operational outcomes is embedded in annual strategic planning cycles.',
          'Advanced simulation tools model multiple scenarios with quantified risk and opportunity outcomes before every major strategic supply chain decision.',
        ],
        levelsAr: [
          'لا يُجرى تخطيط للسيناريوهات. تعتمد القرارات الاستراتيجية الكبرى كليًا على الحدس والخبرة السابقة.',
          'تُجرى نقاشات "ماذا لو" غير رسمية لكنها غير موثّقة وغير متسقة ولا تُستخدم لتوجيه القرارات رسميًا.',
          'يُطبَّق تخطيط أساسي للسيناريوهات على القرارات الكبرى باستخدام تحليل قائم على جداول البيانات بمتغيرات محدودة.',
          'تخطيط منظم للسيناريوهات بنتائج مالية وتشغيلية مُقاسة، مضمَّن في دورات التخطيط الاستراتيجي السنوية.',
          'تقوم أدوات محاكاة متقدمة بنمذجة سيناريوهات متعددة بنتائج مخاطر وفرص مُقاسة قبل كل قرار استراتيجي كبير.',
        ],
      },
      {
        q: 'How well are supply chain KPIs defined, cascaded to teams, and tracked against targets with clear ownership and accountability?',
        qAr: 'ما مدى جودة تعريف مؤشرات أداء سلسلة الإمداد وتوزيعها على الفرق ومتابعتها مقابل المستهدفات مع وضوح الملكية والمساءلة؟',
        levels: [
          'No KPIs are defined for supply chain performance. There is no formal measurement framework or performance reporting.',
          'A few high-level metrics exist but are inconsistently tracked, rarely reviewed in structured forums, and not linked to accountability.',
          'A defined set of supply chain KPIs is tracked regularly and reported to management monthly with basic ownership assigned.',
          'KPIs are cascaded to team level with clearly assigned owners, reviewed in weekly/monthly cadences, and trigger action when breached.',
          'A comprehensive KPI framework is cascaded across all levels, reviewed in weekly operational meetings, and linked to individual performance incentives and rewards.',
        ],
        levelsAr: [
          'لا توجد مؤشرات أداء معرّفة لأداء سلسلة الإمداد. لا يوجد إطار قياس رسمي أو تقارير أداء.',
          'توجد بضعة مقاييس عامة لكنها تُتابَع بشكل غير منتظم ونادرًا ما تُراجَع في منتديات منظمة وغير مرتبطة بالمساءلة.',
          'تُتابَع مجموعة محددة من مؤشرات الأداء بانتظام وتُرفَع للإدارة شهريًا مع تحديد ملكية أساسية.',
          'توزَّع المؤشرات على مستوى الفريق بمالكين محددين بوضوح، وتُراجَع بوتيرة أسبوعية/شهرية، وتُطلق إجراءً عند تجاوزها.',
          'إطار شامل لمؤشرات الأداء موزَّع عبر جميع المستويات، يُراجَع في اجتماعات تشغيلية أسبوعية، ومرتبط بحوافز ومكافآت الأداء الفردي.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Immediate priority: commission a current-state supply chain mapping exercise and develop a 3-year strategic roadmap. Engage a senior supply chain advisor to facilitate the process.',
      Aware:     'Formalise your S&OP process and establish a small set of headline KPIs. Conduct a network design review within the next 6 months.',
      Defined:   'Elevate S&OP to IBP by integrating financial planning. Introduce scenario planning tools and annual network design reviews with quantified outcomes.',
      Managed:   'Implement advanced analytics and digital twin capabilities for network modelling. Link supply chain strategy metrics directly to executive compensation.',
      Optimised: 'Benchmark against global peers and identify where you can leverage your supply chain as a competitive differentiator and a source of revenue growth.',
    },
    recommendationsAr: {
      Reactive:  'أولوية عاجلة: تكليف بإجراء عملية رسم للوضع الحالي لسلسلة الإمداد وتطوير خارطة طريق استراتيجية لثلاث سنوات. الاستعانة بمستشار أول في سلسلة الإمداد لتيسير العملية.',
      Aware:     'إضفاء الطابع الرسمي على عملية S&OP وإرساء مجموعة صغيرة من مؤشرات الأداء الرئيسية. إجراء مراجعة لتصميم الشبكة خلال الأشهر الستة القادمة.',
      Defined:   'الارتقاء بعملية S&OP إلى IBP عبر دمج التخطيط المالي. إدخال أدوات تخطيط السيناريوهات ومراجعات سنوية لتصميم الشبكة بنتائج مُقاسة.',
      Managed:   'تطبيق التحليلات المتقدمة وقدرات التوأم الرقمي لنمذجة الشبكة. ربط مقاييس استراتيجية سلسلة الإمداد مباشرةً بتعويضات المديرين التنفيذيين.',
      Optimised: 'المقارنة المعيارية مع النظراء عالميًا وتحديد المجالات التي يمكن فيها الاستفادة من سلسلة الإمداد كميزة تنافسية ومصدر لنمو الإيرادات.',
    },
    subSegments: STRATEGY_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 2. PROCUREMENT ──────────────────────────────────────────────────── */
  {
    id: 'procurement',
    title: 'Procurement & Strategic Sourcing',
    titleAr: 'المشتريات والتوريد الاستراتيجي',
    shortTitle: 'Procurement',
    shortTitleAr: 'المشتريات',
    icon: ShoppingCart,
    color: '#C9A84C',
    benchmarks: { gcc: 2.6, global: 3.1, best: 4.5 },
    frameworks: ['CIPS', 'ISM/CPSM', 'APICS'],
    questions: [
      {
        q: 'How structured and consistently applied is your category management approach across all direct and indirect spend categories?',
        qAr: 'ما مدى تنظيم نهج إدارة الفئات لديكم واتساق تطبيقه عبر جميع فئات الإنفاق المباشر وغير المباشر؟',
        levels: [
          'No category management exists. All spend categories are managed reactively using identical, tactical approaches regardless of strategic value.',
          'A few high-spend categories are managed with basic plans, but the approach is inconsistent, informal, and lacks market intelligence.',
          'Category management is applied to major spend areas with documented strategies, defined ownership, and basic supplier analysis.',
          'Category plans cover all significant spend, are updated annually, and include market intelligence, strategic objectives, and supplier segmentation.',
          'All spend is managed through structured category plans with market intelligence, multi-year strategies, dedicated category managers, and regular stakeholder governance.',
        ],
        levelsAr: [
          'لا توجد إدارة للفئات. تُدار جميع فئات الإنفاق بشكل تفاعلي بأساليب تكتيكية متطابقة بصرف النظر عن القيمة الاستراتيجية.',
          'تُدار بضع فئات عالية الإنفاق بخطط أساسية، لكن النهج غير متسق وغير رسمي ويفتقر إلى استخبارات السوق.',
          'تُطبَّق إدارة الفئات على مجالات الإنفاق الرئيسية باستراتيجيات موثّقة وملكية محددة وتحليل أساسي للموردين.',
          'تغطي خطط الفئات كل الإنفاق الجوهري وتُحدَّث سنويًا وتشمل استخبارات السوق والأهداف الاستراتيجية وتقسيم الموردين.',
          'يُدار كل الإنفاق عبر خطط فئات منظمة باستخبارات سوق واستراتيجيات متعددة السنوات ومديري فئات متفرغين وحوكمة منتظمة لأصحاب المصلحة.',
        ],
      },
      {
        q: 'How consistently do you apply formal strategic sourcing methodology (RFQ, RFP, e-auctions, multi-criteria evaluation) when selecting or renewing suppliers?',
        qAr: 'ما مدى اتساق تطبيقكم لمنهجية التوريد الاستراتيجي الرسمية (RFQ، RFP، المزادات الإلكترونية، التقييم متعدد المعايير) عند اختيار الموردين أو تجديد التعاقد معهم؟',
        levels: [
          'Supplier selection is informal and based on existing relationships or convenience. No defined sourcing process or evaluation criteria exists.',
          'Competitive quotes are sought for some purchases but the process is inconsistent, undocumented, and lacks formal evaluation criteria.',
          'A defined sourcing process with RFQ/RFP templates and multi-criteria evaluation is applied to major spend decisions.',
          'Strategic sourcing methodology is consistently applied to all significant spend, with documented award decisions and structured post-award reviews.',
          'All significant spend decisions follow a rigorous multi-stage sourcing process with documented criteria, competitive tension, audit trails, and lessons-learned capture.',
        ],
        levelsAr: [
          'اختيار الموردين غير رسمي ويستند إلى العلاقات القائمة أو الملاءمة. لا توجد عملية توريد محددة أو معايير تقييم.',
          'تُطلَب عروض أسعار تنافسية لبعض المشتريات لكن العملية غير متسقة وغير موثّقة وتفتقر إلى معايير تقييم رسمية.',
          'تُطبَّق عملية توريد محددة بقوالب RFQ/RFP وتقييم متعدد المعايير على قرارات الإنفاق الكبرى.',
          'تُطبَّق منهجية التوريد الاستراتيجي باتساق على كل الإنفاق الجوهري، مع توثيق قرارات الترسية ومراجعات منظمة بعد الترسية.',
          'تتبع جميع قرارات الإنفاق الجوهرية عملية توريد صارمة متعددة المراحل بمعايير موثّقة ومنافسة فعّالة ومسارات تدقيق وتوثيق للدروس المستفادة.',
        ],
      },
      {
        q: 'How advanced and frequently refreshed is your spend analysis capability — including spend classification, maverick spend detection, and savings opportunity identification?',
        qAr: 'ما مدى تقدّم قدرتكم على تحليل الإنفاق وتكرار تحديثها — بما في ذلك تصنيف الإنفاق واكتشاف الإنفاق الخارج عن السياسات وتحديد فرص التوفير؟',
        levels: [
          'Spend data is not centrally available or analysed. The organisation does not know what it buys, from whom, or at what price.',
          'Basic spend reports are produced periodically but data quality is poor, classification is incomplete, and insights are rarely acted upon.',
          'Spend analysis is conducted at least quarterly, covering the majority of spend with reasonable classification accuracy and basic trend reporting.',
          'Spend analytics are automated and run monthly, classifying 80%+ of spend, identifying maverick purchasing, and surfacing top savings opportunities.',
          'Real-time spend analytics classify 95%+ of spend, automatically flag maverick purchasing, and surface savings opportunities continuously for all category managers.',
        ],
        levelsAr: [
          'بيانات الإنفاق غير متاحة أو محلَّلة مركزيًا. لا تعرف المؤسسة ماذا تشتري ومن مَن وبأي سعر.',
          'تُنتَج تقارير إنفاق أساسية دوريًا لكن جودة البيانات ضعيفة والتصنيف غير مكتمل ونادرًا ما يُعمَل بالرؤى.',
          'يُجرى تحليل الإنفاق فصليًا على الأقل، يغطي غالبية الإنفاق بدقة تصنيف معقولة وتقارير اتجاهات أساسية.',
          'تحليلات الإنفاق مؤتمتة وتعمل شهريًا، تُصنّف أكثر من 80% من الإنفاق وتُحدّد الشراء الخارج عن السياسات وتُبرز أبرز فرص التوفير.',
          'تحليلات الإنفاق الآنية تُصنّف أكثر من 95% من الإنفاق وتُبلّغ آليًا عن الشراء الخارج عن السياسات وتُبرز فرص التوفير باستمرار لجميع مديري الفئات.',
        ],
      },
      {
        q: 'How effectively do you apply Total Cost of Ownership (TCO) analysis — including quality, logistics, risk, and lifecycle costs — in sourcing decisions rather than purchase price alone?',
        qAr: 'ما مدى فعالية تطبيقكم لتحليل التكلفة الإجمالية للملكية (TCO) — بما في ذلك الجودة والخدمات اللوجستية والمخاطر وتكاليف دورة الحياة — في قرارات التوريد بدلاً من سعر الشراء وحده؟',
        levels: [
          'All sourcing decisions are based on unit purchase price only. Hidden costs, quality implications, and lifecycle costs are never considered.',
          'Some consideration of additional costs (e.g., logistics or import duties) is made informally, but no structured TCO model or methodology is applied.',
          'TCO analysis is applied to strategic categories using a defined model that accounts for quality, logistics, risk, and total lifecycle costs.',
          'TCO is consistently applied across all significant sourcing decisions, with documented models reviewed in governance and reported to stakeholders.',
          'TCO models are applied to all strategic categories, and sourcing decisions routinely demonstrate 10–25% additional value beyond purchase price alone.',
        ],
        levelsAr: [
          'تستند جميع قرارات التوريد إلى سعر شراء الوحدة فقط. لا تُؤخذ التكاليف الخفية وأثر الجودة وتكاليف دورة الحياة في الحسبان مطلقًا.',
          'يُراعى بعض التكاليف الإضافية (مثل الخدمات اللوجستية أو رسوم الاستيراد) بشكل غير رسمي، لكن دون نموذج أو منهجية TCO منظمة.',
          'يُطبَّق تحليل TCO على الفئات الاستراتيجية باستخدام نموذج محدد يراعي الجودة والخدمات اللوجستية والمخاطر وإجمالي تكاليف دورة الحياة.',
          'يُطبَّق TCO باتساق عبر جميع قرارات التوريد الجوهرية، بنماذج موثّقة تُراجَع ضمن الحوكمة وتُرفَع لأصحاب المصلحة.',
          'تُطبَّق نماذج TCO على جميع الفئات الاستراتيجية، وتُظهر قرارات التوريد بانتظام قيمة إضافية بنسبة 10–25% تتجاوز سعر الشراء وحده.',
        ],
      },
      {
        q: 'How effectively does your procurement function operate against defined savings targets, track realised savings, and demonstrate value delivered to the business?',
        qAr: 'ما مدى فعالية عمل وظيفة المشتريات مقابل مستهدفات توفير محددة، وتتبّع الوفورات المحققة، وإثبات القيمة المقدَّمة للأعمال؟',
        levels: [
          'Procurement has no savings targets and does not track, validate, or report cost savings or value delivered to the business.',
          'Savings are recorded informally for some projects but methodology is inconsistent, finance does not validate, and reporting is ad-hoc.',
          'A savings tracking process exists, distinguishes cost avoidance from hard savings, and is reported to management quarterly.',
          'Savings are tracked rigorously against annual targets, validated by finance, clearly categorised, and reported to leadership monthly.',
          'Procurement operates a rigorous savings pipeline, distinguishes hard and soft savings, validates with finance, and reports monthly against a board-approved annual target.',
        ],
        levelsAr: [
          'ليس للمشتريات مستهدفات توفير ولا تتبع أو تتحقق من أو ترفع تقارير عن وفورات التكلفة أو القيمة المقدَّمة للأعمال.',
          'تُسجَّل الوفورات بشكل غير رسمي لبعض المشاريع لكن المنهجية غير متسقة والمالية لا تتحقق منها والتقارير عشوائية.',
          'توجد عملية لتتبع الوفورات تميّز بين تجنّب التكلفة والوفورات الفعلية، وتُرفَع للإدارة فصليًا.',
          'تُتابَع الوفورات بصرامة مقابل مستهدفات سنوية، ويتحقق منها القسم المالي، وتُصنَّف بوضوح وتُرفَع للقيادة شهريًا.',
          'تُدير المشتريات مسار توفير صارمًا، وتميّز بين الوفورات الفعلية وغير الفعلية، وتتحقق منها مع المالية، وترفع تقارير شهرية مقابل مستهدف سنوي معتمد من مجلس الإدارة.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Urgently implement a spend analysis exercise across all categories. Establish a basic sourcing policy and define a minimum procurement process for competitive tendering above a value threshold.',
      Aware:     'Implement category management for your top 5 spend categories. Build a savings tracking mechanism and begin applying TCO in all strategic sourcing decisions.',
      Defined:   'Extend category management to all significant spend. Introduce e-sourcing tools for competitive tendering and automate spend classification with analytics software.',
      Managed:   'Deploy advanced analytics and AI-powered spend intelligence. Implement a procurement performance scorecard tied to business outcomes beyond cost savings.',
      Optimised: 'Shift procurement\'s value proposition from cost to value creation — innovation sourcing, supply chain sustainability, and supplier-led R&D should be priority activities.',
    },
    recommendationsAr: {
      Reactive:  'تطبيق عاجل لعملية تحليل الإنفاق عبر جميع الفئات. إرساء سياسة توريد أساسية وتحديد حد أدنى لعملية المشتريات للمنافسة التنافسية فوق حد قيمي معيّن.',
      Aware:     'تطبيق إدارة الفئات على أعلى 5 فئات إنفاق لديكم. بناء آلية لتتبع الوفورات والبدء بتطبيق TCO في جميع قرارات التوريد الاستراتيجي.',
      Defined:   'توسيع إدارة الفئات لتشمل كل الإنفاق الجوهري. إدخال أدوات التوريد الإلكتروني للمنافسة التنافسية وأتمتة تصنيف الإنفاق ببرامج التحليلات.',
      Managed:   'نشر التحليلات المتقدمة واستخبارات الإنفاق المدعومة بالذكاء الاصطناعي. تطبيق بطاقة أداء للمشتريات مرتبطة بنتائج الأعمال بما يتجاوز وفورات التكلفة.',
      Optimised: 'تحويل القيمة المقترَحة للمشتريات من خفض التكلفة إلى خلق القيمة — يجب أن يكون التوريد الابتكاري واستدامة سلسلة الإمداد والبحث والتطوير بقيادة الموردين أنشطة ذات أولوية.',
    },
    subSegments: PROCUREMENT_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 3. CLM ──────────────────────────────────────────────────────────── */
  {
    id: 'contracts',
    title: 'Contract Lifecycle Management',
    titleAr: 'إدارة دورة حياة العقود',
    shortTitle: 'CLM',
    shortTitleAr: 'إدارة العقود',
    icon: FileText,
    color: '#0B6E4F',
    benchmarks: { gcc: 2.0, global: 2.7, best: 4.4 },
    frameworks: ['IACCM/WCC', 'ISO 9001', 'CIPS'],
    questions: [
      {
        q: 'How effectively do you manage the full contract lifecycle — from initiation and drafting through approval, execution, obligation tracking, and renewal or expiry?',
        qAr: 'ما مدى فعالية إدارتكم لدورة حياة العقد الكاملة — من الاستهلال والصياغة مرورًا بالموافقة والتنفيذ وتتبّع الالتزامات وحتى التجديد أو الانتهاء؟',
        levels: [
          'Contracts are drafted ad-hoc with no standard templates, no defined approval workflow, and no post-signature tracking or obligation management.',
          'Standard templates exist for some common contract types but approval processes are informal and post-signature tracking is largely absent.',
          'A defined contract process covers initiation, approval, and basic post-signature tracking for material contracts with clear roles assigned.',
          'A structured CLM process manages the full lifecycle with defined roles, approval thresholds, obligation registers, and milestone tracking.',
          'A fully automated CLM platform manages the complete lifecycle with AI-assisted drafting, e-signature, real-time obligation tracking, and automated renewal alerts.',
        ],
        levelsAr: [
          'تُصاغ العقود بشكل ارتجالي دون قوالب معيارية ولا مسار موافقة محدد ولا تتبّع بعد التوقيع أو إدارة للالتزامات.',
          'توجد قوالب معيارية لبعض أنواع العقود الشائعة لكن عمليات الموافقة غير رسمية والتتبّع بعد التوقيع غائب إلى حد كبير.',
          'تغطي عملية عقود محددة الاستهلال والموافقة وتتبّعًا أساسيًا بعد التوقيع للعقود الجوهرية مع تحديد أدوار واضحة.',
          'تُدير عملية CLM منظمة دورة الحياة الكاملة بأدوار محددة وحدود موافقة وسجلات التزامات وتتبّع للمراحل.',
          'تُدير منصة CLM مؤتمتة بالكامل دورة الحياة الكاملة بصياغة مدعومة بالذكاء الاصطناعي وتوقيع إلكتروني وتتبّع آني للالتزامات وتنبيهات تجديد آلية.',
        ],
      },
      {
        q: 'Do you have a centralised, searchable contract repository with metadata tagging, milestone alerts, and role-based access for all active contracts?',
        qAr: 'هل لديكم مستودع عقود مركزي قابل للبحث مع وسم بالبيانات الوصفية وتنبيهات للمراحل وصلاحيات وصول قائمة على الأدوار لجميع العقود السارية؟',
        levels: [
          'Contracts are stored in personal email folders or physical filing cabinets. There is no central repository or consistent filing system.',
          'A shared folder or basic digital storage exists but is incomplete, inconsistently used, unsearchable, and lacks access controls.',
          'A centralised digital repository holds most active contracts with basic metadata, controlled access, and manual expiry reminders.',
          'A structured repository holds all contracts with expiry alerts, obligation calendars, reliable full-text search, and role-based access controls.',
          'A structured digital repository holds 100% of contracts with automated expiry alerts, obligation calendars, full-text search, and role-based access — zero contracts in personal storage.',
        ],
        levelsAr: [
          'تُخزَّن العقود في مجلدات بريد شخصية أو خزائن ملفات ورقية. لا يوجد مستودع مركزي أو نظام حفظ متسق.',
          'يوجد مجلد مشترك أو تخزين رقمي أساسي لكنه غير مكتمل ويُستخدم بشكل غير متسق وغير قابل للبحث ويفتقر إلى ضوابط الوصول.',
          'يحتوي مستودع رقمي مركزي على معظم العقود السارية ببيانات وصفية أساسية ووصول مُتحكَّم به وتذكيرات انتهاء يدوية.',
          'يحتوي مستودع منظم على جميع العقود مع تنبيهات انتهاء وتقويمات التزامات وبحث نصي كامل موثوق وضوابط وصول قائمة على الأدوار.',
          'يحتوي مستودع رقمي منظم على 100% من العقود مع تنبيهات انتهاء آلية وتقويمات التزامات وبحث نصي كامل ووصول قائم على الأدوار — دون أي عقود في التخزين الشخصي.',
        ],
      },
      {
        q: 'How consistently are contract obligations, SLAs, and performance KPIs tracked and enforced post-signature, and how quickly are breaches identified and escalated?',
        qAr: 'ما مدى اتساق تتبّع وإنفاذ التزامات العقود واتفاقيات مستوى الخدمة ومؤشرات الأداء بعد التوقيع، وما سرعة اكتشاف الإخلالات وتصعيدها؟',
        levels: [
          'Contract terms are largely forgotten once signed. Supplier SLAs and obligations are never monitored and breaches go undetected until a crisis occurs.',
          'Key obligations are noted at contract signing but monitoring relies on manual follow-up and is inconsistent across contracts and teams.',
          'A basic process tracks key SLA milestones and creates alerts for known or imminent breaches.',
          'All material obligations are tracked systematically with defined escalation paths, monthly compliance reports, and documented breach handling.',
          'All obligations are tracked in real time against supplier performance data, with automated alerts on any breach and a defined multi-level escalation process.',
        ],
        levelsAr: [
          'تُنسى بنود العقد إلى حد كبير بمجرد توقيعه. لا تُراقَب اتفاقيات مستوى خدمة الموردين والتزاماتهم وتمرّ الإخلالات دون اكتشاف حتى تقع أزمة.',
          'تُدوَّن الالتزامات الرئيسية عند التوقيع لكن المراقبة تعتمد على متابعة يدوية وتفتقر إلى الاتساق عبر العقود والفرق.',
          'تراقب عملية أساسية لتتبّع الالتزامات اتفاقيات مستوى الخدمة الرئيسية وتُنشئ تنبيهات للمراحل الوشيكة أو الإخلالات المعروفة.',
          'تُتابَع جميع الالتزامات الجوهرية بشكل منهجي، بمسارات تصعيد محددة وتقارير امتثال شهرية ومعالجة موثّقة للإخلالات.',
          'تُتابَع جميع الالتزامات آنيًا مقابل بيانات أداء الموردين، بتنبيهات آلية عند أي إخلال وعملية تصعيد متعددة المستويات محددة.',
        ],
      },
      {
        q: 'How structured is your contract negotiation process, including use of a commercial playbook, fallback positions, red-line authority, and lessons learned capture?',
        qAr: 'ما مدى تنظيم عملية التفاوض على العقود لديكم، بما في ذلك استخدام دليل تفاوض تجاري ومواقف احتياطية وصلاحيات الخطوط الحمراء وتوثيق الدروس المستفادة؟',
        levels: [
          'Negotiation is conducted informally based on individual style and personal judgement. No playbook, authority matrix, or structured framework exists.',
          'Some negotiation guidance exists but is not consistently applied, outcomes are not documented, and lessons learned are not captured systematically.',
          'A basic negotiation framework with pre-approved positions and defined authority thresholds is used for material contracts.',
          'A commercial playbook with fallback positions and red-line authority is consistently applied to significant contracts, and outcomes are centrally documented.',
          'A commercial negotiation playbook with pre-approved fallback positions and red-line authority is used on all material contracts, with outcomes and lessons learned captured centrally and applied to future negotiations.',
        ],
        levelsAr: [
          'يُجرى التفاوض بشكل غير رسمي وفق الأسلوب الفردي والتقدير الشخصي. لا يوجد دليل تفاوض أو مصفوفة صلاحيات أو إطار منظم.',
          'توجد بعض إرشادات التفاوض لكنها لا تُطبَّق باتساق، ولا تُوثَّق النتائج، ولا تُلتقَط الدروس المستفادة بشكل منهجي.',
          'يُستخدم إطار تفاوض أساسي بمواقف مُعتمَدة مسبقًا وحدود صلاحيات محددة للعقود الجوهرية.',
          'يُطبَّق دليل تفاوض تجاري بمواقف احتياطية وصلاحيات خطوط حمراء باتساق على العقود الكبرى، وتُوثَّق النتائج مركزيًا.',
          'يُستخدم دليل تفاوض تجاري بمواقف احتياطية معتمدة مسبقًا وصلاحيات خطوط حمراء في جميع العقود الجوهرية، مع توثيق النتائج والدروس المستفادة مركزيًا وتطبيقها في المفاوضات المستقبلية.',
        ],
      },
      {
        q: 'How proactively do you manage contract renewals, renegotiations, and exits — including market testing, benchmarking, and leveraging competitive tension at renewal?',
        qAr: 'ما مدى استباقيتكم في إدارة تجديد العقود وإعادة التفاوض عليها والخروج منها — بما في ذلك اختبار السوق والمقارنة المعيارية وتوظيف المنافسة عند التجديد؟',
        levels: [
          'Most contracts auto-renew on existing terms without review. Procurement is not involved until a crisis or significant problem has already arisen.',
          'Some renewals are reviewed but without consistent lead time, structured market benchmarking, or deliberate competitive tension.',
          'A renewals list is maintained with defined review lead times, and major renewals are subject to market testing and some negotiation.',
          'A rolling renewal pipeline is actively managed with structured benchmarking, formal negotiation, and competitive tension applied to all significant contracts.',
          'A rolling 12-month renewal pipeline ensures every contract involving significant spend undergoes market benchmarking, competitive tension, and formal commercial negotiation before renewal.',
        ],
        levelsAr: [
          'تتجدد معظم العقود تلقائيًا وفق البنود القائمة دون مراجعة. لا تُشرَك المشتريات حتى تقع أزمة أو مشكلة جوهرية.',
          'تُراجَع بعض التجديدات لكن دون مهلة زمنية متسقة أو مقارنة معيارية منظمة للسوق أو منافسة متعمَّدة.',
          'تُحفَظ قائمة تجديدات بمُهل مراجعة محددة، وتخضع التجديدات الكبرى لاختبار السوق وبعض التفاوض.',
          'يُدار مسار تجديد متجدد بفاعلية بمقارنة معيارية منظمة وتفاوض رسمي ومنافسة تُطبَّق على جميع العقود الكبرى.',
          'يضمن مسار تجديد متجدد لمدة 12 شهرًا خضوع كل عقد ينطوي على إنفاق جوهري للمقارنة المعيارية بالسوق والمنافسة والتفاوض التجاري الرسمي قبل التجديد.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Implement a basic contract register immediately. Define standard contract templates for your most common agreement types and establish minimum approval workflows.',
      Aware:     'Deploy a CLM system to centralise contracts and automate expiry alerts. Train procurement and legal on contract fundamentals and negotiation basics.',
      Defined:   'Activate full obligation tracking and SLA monitoring. Build a commercial negotiation playbook and implement a structured renewal pipeline management process.',
      Managed:   'Implement AI-powered contract analytics for risk identification, obligation extraction, and spend commitment tracking. Integrate CLM with ERP for spend commitments.',
      Optimised: 'Deploy predictive contract risk scoring and leverage contract data as a strategic intelligence source for sourcing decisions and supplier performance management.',
    },
    recommendationsAr: {
      Reactive:  'تطبيق سجل عقود أساسي فورًا. تحديد قوالب عقود معيارية لأكثر أنواع الاتفاقيات شيوعًا لديكم وإرساء حدود دنيا لمسارات الموافقة.',
      Aware:     'نشر نظام CLM لمركزة العقود وأتمتة تنبيهات الانتهاء. تدريب المشتريات والشؤون القانونية على أساسيات العقود ومبادئ التفاوض.',
      Defined:   'تفعيل التتبّع الكامل للالتزامات ومراقبة اتفاقيات مستوى الخدمة. بناء دليل تفاوض تجاري وتطبيق عملية منظمة لإدارة مسار التجديد.',
      Managed:   'تطبيق تحليلات العقود المدعومة بالذكاء الاصطناعي لتحديد المخاطر واستخلاص الالتزامات وتتبّع التزامات الإنفاق. ربط CLM بنظام ERP.',
      Optimised: 'نشر تقييم تنبؤي لمخاطر العقود والاستفادة من بيانات العقود كمصدر استخباراتي استراتيجي لقرارات التوريد وإدارة أداء الموردين.',
    },
    subSegments: CLM_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 4. SRM ──────────────────────────────────────────────────────────── */
  {
    id: 'suppliers',
    title: 'Supplier Relationship Management',
    titleAr: 'إدارة علاقات الموردين',
    shortTitle: 'SRM',
    shortTitleAr: 'علاقات الموردين',
    icon: Users,
    color: '#7B2D8B',
    benchmarks: { gcc: 2.2, global: 2.8, best: 4.5 },
    frameworks: ['CIPS', 'ISO 44001', 'APICS'],
    questions: [
      {
        q: 'How formalised is your supplier segmentation model — distinguishing strategic, preferred, approved, and transactional suppliers by criticality and spend?',
        qAr: 'ما مدى رسمية نموذج تقسيم الموردين لديكم — الذي يميّز بين الموردين الاستراتيجيين والمفضّلين والمعتمدين والمعامليين حسب الأهمية الحرجة والإنفاق؟',
        levels: [
          'All suppliers are treated identically regardless of spend, strategic importance, or risk profile. No segmentation model exists.',
          'Informal differentiation exists (e.g., key suppliers are known informally) but no structured segmentation criteria or documented model has been applied.',
          'A basic segmentation model (strategic / preferred / transactional) is defined and applied to major suppliers with differentiated management approaches.',
          'All suppliers above defined spend or risk thresholds are formally segmented using multi-factor criteria, with clearly differentiated governance for each tier.',
          'All suppliers are formally segmented using a multi-factor model (spend, risk, strategic importance) with differentiated management programmes, governance cadences, and investment levels for each tier.',
        ],
        levelsAr: [
          'يُعامَل جميع الموردين بشكل متطابق بصرف النظر عن الإنفاق أو الأهمية الاستراتيجية أو ملف المخاطر. لا يوجد نموذج تقسيم.',
          'يوجد تمييز غير رسمي (مثل معرفة الموردين الرئيسيين بشكل غير رسمي) لكن دون معايير تقسيم منظمة أو نموذج موثّق مُطبَّق.',
          'يُعرَّف نموذج تقسيم أساسي (استراتيجي / مفضّل / معاملي) ويُطبَّق على الموردين الرئيسيين بأساليب إدارة متمايزة.',
          'يُقسَّم جميع الموردين فوق حدود إنفاق أو مخاطر محددة رسميًا بمعايير متعددة العوامل، بحوكمة متمايزة بوضوح لكل فئة.',
          'يُقسَّم جميع الموردين رسميًا بنموذج متعدد العوامل (الإنفاق، المخاطر، الأهمية الاستراتيجية) ببرامج إدارة متمايزة ووتيرة حوكمة ومستويات استثمار لكل فئة.',
        ],
      },
      {
        q: 'How regularly do you conduct structured, two-way supplier performance reviews using defined scorecards covering quality, delivery, commercial, and relationship dimensions?',
        qAr: 'ما مدى انتظامكم في إجراء مراجعات منظمة ثنائية الاتجاه لأداء الموردين باستخدام بطاقات أداء محددة تغطي أبعاد الجودة والتسليم والجوانب التجارية والعلاقة؟',
        levels: [
          'Supplier performance is never formally reviewed. Issues are only addressed reactively when they escalate into operational crises.',
          'Informal feedback is given to suppliers occasionally but without structured scorecards, defined review cycles, or documented outcomes.',
          'Structured performance reviews occur at least annually for strategic suppliers using defined metrics covering quality, delivery, and commercial performance.',
          'Quarterly performance reviews with balanced scorecards are conducted for strategic and preferred suppliers, with improvement action plans tracked to closure.',
          'Strategic suppliers receive quarterly formal performance reviews with balanced scorecards, executive sponsorship, defined improvement action plans, and tracked outcomes shared with the supplier.',
        ],
        levelsAr: [
          'لا يُراجَع أداء الموردين رسميًا أبدًا. تُعالَج المشكلات بشكل تفاعلي فقط عند تصاعدها إلى أزمات تشغيلية.',
          'تُقدَّم ملاحظات غير رسمية للموردين أحيانًا لكن دون بطاقات أداء منظمة أو دورات مراجعة محددة أو نتائج موثّقة.',
          'تُجرى مراجعات أداء منظمة سنويًا على الأقل للموردين الاستراتيجيين باستخدام مقاييس محددة تغطي الجودة والتسليم والأداء التجاري.',
          'تُجرى مراجعات أداء فصلية ببطاقات أداء متوازنة للموردين الاستراتيجيين والمفضّلين، مع متابعة خطط تحسين حتى الإغلاق.',
          'يحصل الموردون الاستراتيجيون على مراجعات أداء فصلية رسمية ببطاقات أداء متوازنة ورعاية تنفيذية وخطط تحسين محددة ونتائج متابَعة تُشارَك مع المورد.',
        ],
      },
      {
        q: 'How actively do you invest in supplier development — including training, capability-building, technology access, and collaborative problem-solving — to improve supplier performance?',
        qAr: 'ما مدى فاعلية استثماركم في تطوير الموردين — بما في ذلك التدريب وبناء القدرات وإتاحة التقنية وحل المشكلات التشاركي — لتحسين أداء الموردين؟',
        levels: [
          'No investment is made in supplier development. The organisation expects suppliers to self-improve without any support or structured engagement.',
          'Occasional ad-hoc support is provided to struggling suppliers but there is no structured programme, budget allocation, or measured outcomes.',
          'A basic supplier development programme exists for strategic suppliers with targeted capability-building initiatives and defined objectives.',
          'A funded supplier development programme covers all strategic suppliers with defined objectives, investment commitments, and measured performance improvement outcomes.',
          'A funded supplier development programme actively builds strategic supplier capability across multiple dimensions, with measured improvement in performance and innovation output tracked annually.',
        ],
        levelsAr: [
          'لا يُستثمَر في تطوير الموردين. تتوقع المؤسسة أن يحسّن الموردون أنفسهم دون أي دعم أو مشاركة منظمة.',
          'يُقدَّم دعم ارتجالي عرضي للموردين المتعثرين لكن دون برنامج منظم أو تخصيص ميزانية أو نتائج مُقاسة.',
          'يوجد برنامج أساسي لتطوير الموردين الاستراتيجيين بمبادرات موجَّهة لبناء القدرات وأهداف محددة.',
          'يغطي برنامج ممول لتطوير الموردين جميع الموردين الاستراتيجيين بأهداف محددة والتزامات استثمار ونتائج تحسين أداء مُقاسة.',
          'يبني برنامج ممول لتطوير الموردين قدرة الموردين الاستراتيجيين بفاعلية عبر أبعاد متعددة، بتحسّن مُقاس في الأداء ومخرجات الابتكار تُتابَع سنويًا.',
        ],
      },
      {
        q: 'How effectively do you collaborate with strategic suppliers on innovation, joint product development, cost reduction, and shared value creation beyond transactional buying?',
        qAr: 'ما مدى فعالية تعاونكم مع الموردين الاستراتيجيين في الابتكار والتطوير المشترك للمنتجات وخفض التكلفة وخلق القيمة المشتركة بما يتجاوز الشراء المعاملي؟',
        levels: [
          'Supplier relationships are purely transactional. Innovation and collaboration are not actively pursued with any supplier in any category.',
          'Collaboration occurs informally with a few suppliers based on individual relationships, but it is not systematically managed or measured.',
          'Collaborative initiatives are defined for strategic suppliers, including occasional joint problem-solving and structured cost reduction projects.',
          'Joint business plans with strategic suppliers include formal innovation objectives, shared investment commitments, and annual performance reviews with quantified outcomes.',
          'Strategic suppliers participate in joint innovation sessions, are involved early in NPD processes, and contribute measurable innovation value — tracked and reported annually.',
        ],
        levelsAr: [
          'علاقات الموردين معاملية بحتة. لا يُسعى بفاعلية إلى الابتكار والتعاون مع أي مورد في أي فئة.',
          'يحدث التعاون بشكل غير رسمي مع بضعة موردين استنادًا إلى العلاقات الفردية، لكنه لا يُدار أو يُقاس بشكل منهجي.',
          'تُعرَّف مبادرات تعاونية للموردين الاستراتيجيين، تشمل حل المشكلات المشترك العرضي ومشاريع خفض تكلفة منظمة.',
          'تتضمن خطط الأعمال المشتركة مع الموردين الاستراتيجيين أهداف ابتكار رسمية والتزامات استثمار مشتركة ومراجعات أداء سنوية بنتائج مُقاسة.',
          'يشارك الموردون الاستراتيجيون في جلسات ابتكار مشتركة، ويُشرَكون مبكرًا في عمليات تطوير المنتجات الجديدة، ويسهمون بقيمة ابتكارية مُقاسة تُتابَع وتُرفَع سنويًا.',
        ],
      },
      {
        q: 'How mature is your supplier onboarding, qualification, and exit process — including financial vetting, ESG compliance, capability assessment, and risk scoring?',
        qAr: 'ما مدى نضج عملية تأهيل الموردين وضمّهم والخروج منهم — بما في ذلك الفحص المالي والامتثال البيئي والاجتماعي والحوكمي وتقييم القدرات وتسجيل المخاطر؟',
        levels: [
          'Supplier onboarding is entirely informal. New suppliers are added to the system without any formal qualification, vetting, or risk assessment.',
          'A basic qualification checklist exists but is inconsistently applied and does not systematically cover ESG compliance or financial risk.',
          'A structured onboarding process covers legal, financial, and quality requirements for all new suppliers above a defined spend threshold.',
          'All new suppliers complete a comprehensive qualification covering financial health, ESG compliance, operational capacity, and risk scoring before approval.',
          'A rigorous, gated qualification process covering financial health, ESG compliance, capacity, and risk scoring governs all new supplier approvals. Exit protocols are equally structured and documented.',
        ],
        levelsAr: [
          'ضمّ الموردين غير رسمي بالكامل. يُضاف الموردون الجدد إلى النظام دون أي تأهيل رسمي أو فحص أو تقييم للمخاطر.',
          'توجد قائمة تأهيل أساسية لكنها تُطبَّق بشكل غير متسق ولا تغطي منهجيًا الامتثال البيئي والاجتماعي والحوكمي أو المخاطر المالية.',
          'تغطي عملية ضمّ منظمة المتطلبات القانونية والمالية والجودة لجميع الموردين الجدد فوق حد إنفاق محدد.',
          'يكمل جميع الموردين الجدد تأهيلاً شاملاً يغطي السلامة المالية والامتثال البيئي والاجتماعي والحوكمي والطاقة التشغيلية وتسجيل المخاطر قبل الاعتماد.',
          'تحكم عملية تأهيل صارمة ذات بوابات تغطي السلامة المالية والامتثال البيئي والاجتماعي والحوكمي والطاقة وتسجيل المخاطر جميع اعتمادات الموردين الجدد. وبروتوكولات الخروج منظمة وموثّقة بالقدر ذاته.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Define your top 20 suppliers by spend and risk. Introduce a basic supplier scorecard and schedule quarterly reviews. Formalise supplier qualification for all new additions.',
      Aware:     'Implement a three-tier supplier segmentation model. Develop scorecards for strategic and preferred suppliers and begin investing in 2–3 strategic supplier development initiatives.',
      Defined:   'Build a formal SRM programme with dedicated relationship managers for strategic suppliers. Introduce joint business plans for top 10 suppliers and an innovation forum.',
      Managed:   'Deploy a digital SRM platform with real-time performance dashboards. Expand supplier collaboration to joint cost modelling, demand visibility sharing, and co-innovation.',
      Optimised: 'Position your supply base as a strategic competitive asset. Lead supplier innovation ecosystems and co-invest in supplier capability as a growth strategy.',
    },
    recommendationsAr: {
      Reactive:  'تحديد أعلى 20 موردًا لديكم حسب الإنفاق والمخاطر. إدخال بطاقة أداء أساسية للموردين وجدولة مراجعات فصلية. إضفاء الطابع الرسمي على تأهيل الموردين لجميع الإضافات الجديدة.',
      Aware:     'تطبيق نموذج تقسيم موردين من ثلاث فئات. تطوير بطاقات أداء للموردين الاستراتيجيين والمفضّلين والبدء بالاستثمار في 2–3 مبادرات لتطوير الموردين الاستراتيجيين.',
      Defined:   'بناء برنامج رسمي لإدارة علاقات الموردين بمديري علاقات متفرغين للموردين الاستراتيجيين. إدخال خطط أعمال مشتركة لأعلى 10 موردين ومنتدى للابتكار.',
      Managed:   'نشر منصة رقمية لإدارة علاقات الموردين بلوحات أداء آنية. توسيع التعاون مع الموردين ليشمل نمذجة التكلفة المشتركة ومشاركة رؤية الطلب والابتكار المشترك.',
      Optimised: 'تموضع قاعدة التوريد لديكم كأصل تنافسي استراتيجي. قيادة منظومات ابتكار الموردين والاستثمار المشترك في قدرة الموردين كاستراتيجية نمو.',
    },
    subSegments: SRM_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 5. RISK ─────────────────────────────────────────────────────────── */
  {
    id: 'risk',
    title: 'Supply Chain Risk Management',
    titleAr: 'إدارة مخاطر سلسلة الإمداد',
    shortTitle: 'Risk',
    shortTitleAr: 'المخاطر',
    icon: Shield,
    color: '#B91C1C',
    benchmarks: { gcc: 2.1, global: 2.7, best: 4.3 },
    frameworks: ['ISO 31000', 'CIPS', 'APICS SCOR'],
    questions: [
      {
        q: 'How comprehensively have you mapped supply chain risks at tier 1 and tier 2 supplier level, including concentration, single-source, and geographic risk?',
        qAr: 'ما مدى شمولية رسمكم لمخاطر سلسلة الإمداد على مستوى الموردين من المستوى الأول والثاني، بما في ذلك مخاطر التركّز والمصدر الوحيد والمخاطر الجغرافية؟',
        levels: [
          'No formal risk mapping has been conducted. The organisation has little to no visibility of supply chain risk below its tier-1 suppliers.',
          'A basic list of key suppliers exists but risk exposure, concentration, geographic risk, and single-source dependencies are not formally assessed.',
          'A risk map covers critical tier-1 suppliers with identified risk types and basic concentration analysis, though tier-2 visibility is limited.',
          'Risk mapping covers all critical suppliers at tier-1 and most at tier-2, with quantified risk scores, concentration analysis, and geographic heat mapping.',
          'A live risk map covers all critical suppliers to tier-2, with quantified risk scores, concentration analysis, geographic disruption modelling, and automated refresh of underlying data.',
        ],
        levelsAr: [
          'لم يُجرَ رسم رسمي للمخاطر. لدى المؤسسة رؤية ضئيلة أو معدومة لمخاطر سلسلة الإمداد دون موردي المستوى الأول.',
          'توجد قائمة أساسية بالموردين الرئيسيين لكن لا يُقيَّم رسميًا التعرّض للمخاطر والتركّز والمخاطر الجغرافية والاعتماد على مصدر وحيد.',
          'تغطي خريطة مخاطر موردي المستوى الأول الحرجين بأنواع مخاطر محددة وتحليل تركّز أساسي، رغم محدودية الرؤية للمستوى الثاني.',
          'يغطي رسم المخاطر جميع الموردين الحرجين في المستوى الأول ومعظمهم في المستوى الثاني، بدرجات مخاطر مُقاسة وتحليل تركّز وخرائط حرارية جغرافية.',
          'تغطي خريطة مخاطر حية جميع الموردين الحرجين حتى المستوى الثاني، بدرجات مخاطر مُقاسة وتحليل تركّز ونمذجة اضطراب جغرافي وتحديث آلي للبيانات الأساسية.',
        ],
      },
      {
        q: 'How actively do you monitor supply chain risks in real time — including supplier financial health, geopolitical events, ESG risk signals, and capacity constraints?',
        qAr: 'ما مدى فاعلية مراقبتكم لمخاطر سلسلة الإمداد آنيًا — بما في ذلك السلامة المالية للموردين والأحداث الجيوسياسية وإشارات المخاطر البيئية والاجتماعية والحوكمية وقيود الطاقة؟',
        levels: [
          'Risk monitoring is entirely reactive. The organisation only becomes aware of supplier risk after a disruption has already occurred and caused impact.',
          'Occasional manual checks (e.g., ad-hoc news searches) are made for a handful of key suppliers but there is no systematic monitoring programme.',
          'Key risk indicators are tracked periodically for critical suppliers using manual processes, available financial data, and industry news sources.',
          'A risk monitoring tool provides alerts on supplier financial health, news events, and capacity changes for all critical and strategic suppliers.',
          'An AI-powered risk monitoring platform continuously scans supplier financial data, news feeds, ESG signals, and geopolitical risk indices — generating proactive, prioritised alerts.',
        ],
        levelsAr: [
          'مراقبة المخاطر تفاعلية بالكامل. لا تدرك المؤسسة مخاطر الموردين إلا بعد وقوع الاضطراب وإحداثه أثرًا بالفعل.',
          'تُجرى فحوص يدوية عرضية (مثل عمليات بحث إخبارية ارتجالية) لعدد قليل من الموردين الرئيسيين لكن دون برنامج مراقبة منهجي.',
          'تُتابَع مؤشرات المخاطر الرئيسية دوريًا للموردين الحرجين باستخدام عمليات يدوية والبيانات المالية المتاحة ومصادر الأخبار الصناعية.',
          'توفر أداة مراقبة المخاطر تنبيهات حول السلامة المالية للموردين والأحداث الإخبارية وتغيّرات الطاقة لجميع الموردين الحرجين والاستراتيجيين.',
          'تفحص منصة مراقبة مخاطر مدعومة بالذكاء الاصطناعي باستمرار البيانات المالية للموردين والتدفقات الإخبارية والإشارات البيئية والاجتماعية والحوكمية ومؤشرات المخاطر الجيوسياسية — وتُنشئ تنبيهات استباقية ذات أولوية.',
        ],
      },
      {
        q: 'How robust are your business continuity and supply chain resilience plans, including documented alternative sourcing options, inventory buffers, and recovery time objectives?',
        qAr: 'ما مدى متانة خطط استمرارية الأعمال ومرونة سلسلة الإمداد لديكم، بما في ذلك خيارات التوريد البديلة الموثّقة ومخزونات الأمان وأهداف زمن التعافي؟',
        levels: [
          'No business continuity plans exist for supply chain. There are no documented recovery options for a major supplier failure or disruption event.',
          'Some informal workarounds for common disruptions are known but are not documented, tested, and responsibility for activation is unclear.',
          'Business continuity plans exist for the most critical supply chain risks, are documented, and reviewed annually though not yet tested through simulation.',
          'BCPs cover all critical categories, include identified and qualified alternative suppliers, defined inventory buffer policies, and are reviewed at least annually.',
          'Comprehensive BCPs exist for all critical supply chain risks, tested annually through live simulations, with pre-qualified alternative suppliers and documented activation protocols.',
        ],
        levelsAr: [
          'لا توجد خطط استمرارية أعمال لسلسلة الإمداد. لا توجد خيارات تعافٍ موثّقة لفشل مورد رئيسي أو حدث اضطراب.',
          'تُعرف بعض الحلول البديلة غير الرسمية للاضطرابات الشائعة لكنها غير موثّقة وغير مختبَرة ومسؤولية تفعيلها غير واضحة.',
          'توجد خطط استمرارية أعمال لأكثر مخاطر سلسلة الإمداد حرجًا، موثّقة وتُراجَع سنويًا لكنها لم تُختبَر بعد عبر المحاكاة.',
          'تغطي خطط استمرارية الأعمال جميع الفئات الحرجة وتشمل موردين بدلاء محددين ومؤهَّلين وسياسات مخزون أمان محددة وتُراجَع سنويًا على الأقل.',
          'توجد خطط استمرارية أعمال شاملة لجميع مخاطر سلسلة الإمداد الحرجة، تُختبَر سنويًا عبر محاكاة حية، بموردين بدلاء مؤهَّلين مسبقًا وبروتوكولات تفعيل موثّقة.',
        ],
      },
      {
        q: 'How effectively do you apply dual-sourcing or multi-sourcing strategies for critical categories, and how regularly do you validate the independence and capability of contingency sources?',
        qAr: 'ما مدى فعالية تطبيقكم لاستراتيجيات التوريد المزدوج أو المتعدد للفئات الحرجة، وما مدى انتظامكم في التحقق من استقلالية وقدرة المصادر الاحتياطية؟',
        levels: [
          'Many critical categories have a single source of supply with no validated alternative. Single-source dependency is not tracked or actively managed.',
          'Some dual-sourcing exists for the most critical items, but alternatives are often unqualified, have untested capacity, and are not maintained as live options.',
          'Dual-sourcing is in place for the highest-risk categories, with qualified alternatives, documented contingency pricing, and periodic capacity validation.',
          'All critical categories operate on a dual or multi-source model with pre-qualified capacity and sourcing independence validated through annual supplier audits.',
          'All critical categories operate on a dual or multi-source model with pre-negotiated contingency pricing, validated capacity, and a quarterly independence audit to confirm alternatives remain credible.',
        ],
        levelsAr: [
          'يعتمد كثير من الفئات الحرجة على مصدر توريد وحيد دون بديل مُتحقَّق منه. لا يُتتبَّع الاعتماد على المصدر الوحيد أو يُدار بفاعلية.',
          'يوجد بعض التوريد المزدوج لأكثر الأصناف حرجًا، لكن البدائل غالبًا غير مؤهَّلة وقدرتها غير مختبَرة ولا تُحافَظ عليها كخيارات حية.',
          'يُطبَّق التوريد المزدوج على الفئات الأعلى مخاطرة، ببدائل مؤهَّلة وتسعير احتياطي موثّق والتحقق الدوري من الطاقة.',
          'تعمل جميع الفئات الحرجة بنموذج توريد مزدوج أو متعدد بطاقة مؤهَّلة مسبقًا واستقلالية توريد يُتحقَّق منها عبر عمليات تدقيق سنوية للموردين.',
          'تعمل جميع الفئات الحرجة بنموذج توريد مزدوج أو متعدد بتسعير احتياطي مُتفَاوَض عليه مسبقًا وطاقة مُتحقَّق منها وتدقيق استقلالية فصلي لتأكيد بقاء البدائل موثوقة.',
        ],
      },
      {
        q: 'How regularly do you conduct supply chain risk exercises, stress tests, or tabletop simulations — and how quickly are findings translated into plan updates and mitigations?',
        qAr: 'ما مدى انتظامكم في إجراء تمارين مخاطر سلسلة الإمداد أو اختبارات الإجهاد أو التمارين النظرية (Tabletop) — وما سرعة ترجمة النتائج إلى تحديثات للخطط وإجراءات تخفيف؟',
        levels: [
          'Risk plans have never been tested. The organisation has never conducted a supply chain stress test, tabletop simulation, or disruption exercise.',
          'Informal discussions about risk scenarios occur occasionally but are not structured, documented, assigned to owners, or formally actioned.',
          'A structured tabletop exercise or formal risk review is conducted annually, with findings documented and used to update contingency plans.',
          'Annual stress-test exercises simulate specific disruption scenarios, with executive review and findings translated into actionable plan updates within 60 days.',
          'Annual supply chain stress-test exercises simulate multiple disruption scenarios, are reviewed at board level, and findings are translated into specific plan updates within 30 days.',
        ],
        levelsAr: [
          'لم تُختبَر خطط المخاطر قط. لم تُجرِ المؤسسة أبدًا اختبار إجهاد لسلسلة الإمداد أو تمرين نظري (Tabletop) أو تمرين اضطراب.',
          'تُجرى نقاشات غير رسمية حول سيناريوهات المخاطر أحيانًا لكنها غير منظمة وغير موثّقة وغير مُسنَدة لمالكين أو مُتخَذ بشأنها إجراء رسمي.',
          'يُجرى تمرين نظري (Tabletop) منظم أو مراجعة مخاطر رسمية سنويًا، مع توثيق النتائج واستخدامها لتحديث الخطط الاحتياطية.',
          'تحاكي تمارين اختبار الإجهاد السنوية سيناريوهات اضطراب محددة، بمراجعة تنفيذية وترجمة النتائج إلى تحديثات خطط قابلة للتنفيذ خلال 60 يومًا.',
          'تحاكي تمارين اختبار الإجهاد السنوية سيناريوهات اضطراب متعددة، وتُراجَع على مستوى مجلس الإدارة، وتُترجَم النتائج إلى تحديثات خطط محددة خلال 30 يومًا.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Immediately map all single-source dependencies in critical categories. Develop a basic business continuity framework and identify at least one alternative source per critical item.',
      Aware:     'Implement a structured risk register for supply chain risks. Begin dual-sourcing the top 5 highest-risk single-source categories and qualify contingency suppliers.',
      Defined:   'Deploy a supplier risk monitoring tool. Formalise BCPs for all critical categories and conduct your first tabletop simulation exercise.',
      Managed:   'Implement real-time AI-powered risk monitoring. Extend dual-sourcing to all critical categories and begin tier-2 supply chain risk mapping with strategic suppliers.',
      Optimised: 'Leverage predictive analytics to anticipate disruptions before they occur. Build supply chain resilience as a competitive differentiator communicated to customers.',
    },
    recommendationsAr: {
      Reactive:  'رسم جميع أوجه الاعتماد على مصدر وحيد في الفئات الحرجة فورًا. تطوير إطار أساسي لاستمرارية الأعمال وتحديد مصدر بديل واحد على الأقل لكل صنف حرج.',
      Aware:     'تطبيق سجل مخاطر منظم لمخاطر سلسلة الإمداد. البدء بالتوريد المزدوج لأعلى 5 فئات مخاطرة تعتمد على مصدر وحيد وتأهيل موردين احتياطيين.',
      Defined:   'نشر أداة لمراقبة مخاطر الموردين. إضفاء الطابع الرسمي على خطط استمرارية الأعمال لجميع الفئات الحرجة وإجراء أول تمرين محاكاة نظري (Tabletop).',
      Managed:   'تطبيق مراقبة مخاطر آنية مدعومة بالذكاء الاصطناعي. توسيع التوريد المزدوج ليشمل جميع الفئات الحرجة والبدء برسم مخاطر سلسلة الإمداد للمستوى الثاني.',
      Optimised: 'توظيف التحليلات التنبؤية لاستباق الاضطرابات قبل وقوعها. بناء مرونة سلسلة الإمداد كميزة تنافسية تُبلَّغ للعملاء.',
    },
    subSegments: RISK_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 6. ESG ──────────────────────────────────────────────────────────── */
  {
    id: 'sustainability',
    title: 'Sustainability & ESG',
    titleAr: 'الاستدامة والحوكمة البيئية والاجتماعية',
    shortTitle: 'ESG',
    shortTitleAr: 'الاستدامة',
    icon: Leaf,
    color: '#15803D',
    benchmarks: { gcc: 1.8, global: 2.5, best: 4.2 },
    frameworks: ['ISO 14001', 'ISO 45001', 'GRI'],
    questions: [
      {
        q: 'How comprehensively have you assessed and measured Scope 3 (supply chain) greenhouse gas emissions, including methodology, data quality, and coverage of spend categories?',
        qAr: 'ما مدى شمولية تقييمكم وقياسكم لانبعاثات الغازات الدفيئة من النطاق الثالث (سلسلة الإمداد)، بما في ذلك المنهجية وجودة البيانات وتغطية فئات الإنفاق؟',
        levels: [
          'Scope 3 emissions have not been measured or estimated. The organisation has no visibility of its supply chain carbon footprint.',
          'A basic Scope 3 estimate has been made using a spend-based methodology but coverage is limited and data quality is poor.',
          'Scope 3 emissions are measured for major spend categories using a recognised methodology with reasonable data quality and coverage.',
          'Scope 3 emissions are measured to 70%+ spend coverage, disclosed internally, and a quantified reduction target has been set and communicated.',
          'Scope 3 emissions are measured to >80% spend coverage using GHG Protocol methodology, publicly disclosed, and actively reduced through a structured supplier engagement programme.',
        ],
        levelsAr: [
          'لم تُقَس انبعاثات النطاق الثالث أو تُقدَّر. ليس لدى المؤسسة رؤية لبصمتها الكربونية في سلسلة الإمداد.',
          'أُجري تقدير أساسي للنطاق الثالث باستخدام منهجية قائمة على الإنفاق لكن التغطية محدودة وجودة البيانات ضعيفة.',
          'تُقاس انبعاثات النطاق الثالث لفئات الإنفاق الرئيسية باستخدام منهجية معترف بها بجودة بيانات وتغطية معقولتين.',
          'تُقاس انبعاثات النطاق الثالث بتغطية إنفاق تتجاوز 70% ويُفصَح عنها داخليًا، وقد حُدِّد مستهدف خفض مُقاس وأُبلِغ به.',
          'تُقاس انبعاثات النطاق الثالث بتغطية إنفاق تتجاوز 80% باستخدام منهجية GHG Protocol، ويُفصَح عنها علنًا وتُخفَّض بفاعلية عبر برنامج منظم لإشراك الموردين.',
        ],
      },
      {
        q: 'How systematically are ESG and sustainability criteria integrated into your supplier selection, evaluation, and sourcing decisions?',
        qAr: 'ما مدى منهجية دمج معايير الاستدامة والحوكمة البيئية والاجتماعية في اختيار الموردين وتقييمهم وقرارات التوريد لديكم؟',
        levels: [
          'ESG is not a factor in any supplier selection or sourcing decision. Cost and quality are the only evaluation criteria applied.',
          'ESG is referenced in supplier questionnaires or communications but carries no formal weighting in evaluation scoring or award decisions.',
          'ESG criteria are included in supplier evaluations with a defined minimum weighting applied to major sourcing decisions.',
          'ESG performance influences supplier tiering and contract renewal decisions across all significant spend categories.',
          'ESG criteria carry a defined weighting (15–25%) in all supplier evaluations, and ESG performance directly influences supplier tiering and contract award decisions.',
        ],
        levelsAr: [
          'المعايير البيئية والاجتماعية والحوكمية ليست عاملاً في أي اختيار للموردين أو قرار توريد. التكلفة والجودة هما معيارا التقييم الوحيدان.',
          'يُشار إلى المعايير البيئية والاجتماعية والحوكمية في استبيانات أو مراسلات الموردين لكنها لا تحمل وزنًا رسميًا في التقييم أو قرارات الترسية.',
          'تُدرَج المعايير البيئية والاجتماعية والحوكمية في تقييمات الموردين بوزن أدنى محدد يُطبَّق على قرارات التوريد الكبرى.',
          'يؤثر الأداء البيئي والاجتماعي والحوكمي في تصنيف الموردين وقرارات تجديد العقود عبر جميع فئات الإنفاق الجوهرية.',
          'تحمل المعايير البيئية والاجتماعية والحوكمية وزنًا محددًا (15–25%) في جميع تقييمات الموردين، ويؤثر الأداء فيها مباشرةً في تصنيف الموردين وقرارات ترسية العقود.',
        ],
      },
      {
        q: 'How actively do you require, verify, and support supplier ESG compliance — including codes of conduct, audit programmes, and supplier capacity-building?',
        qAr: 'ما مدى فاعلية اشتراطكم للامتثال البيئي والاجتماعي والحوكمي للموردين والتحقق منه ودعمه — بما في ذلك مواثيق السلوك وبرامج التدقيق وبناء قدرات الموردين؟',
        levels: [
          'No ESG requirements are placed on suppliers. No code of conduct, audit programme, or disclosure requirement of any kind exists.',
          'A supplier code of conduct exists but is not consistently distributed, enforced, audited, or used to drive supplier management decisions.',
          'All significant suppliers are required to sign a code of conduct, with self-assessment questionnaires used to monitor basic compliance.',
          'ESG compliance requirements are contractualised and high-risk suppliers are subject to third-party audits with documented corrective action plans.',
          'All suppliers above a spend threshold sign a mandatory ESG code of conduct, are audited against it, and high-risk suppliers receive structured improvement support and follow-up.',
        ],
        levelsAr: [
          'لا تُفرَض متطلبات بيئية واجتماعية وحوكمية على الموردين. لا يوجد ميثاق سلوك أو برنامج تدقيق أو متطلب إفصاح من أي نوع.',
          'يوجد ميثاق سلوك للموردين لكنه لا يُوزَّع أو يُنفَّذ أو يُدقَّق باتساق ولا يُستخدم لتوجيه قرارات إدارة الموردين.',
          'يُطلَب من جميع الموردين الجوهريين توقيع ميثاق سلوك، مع استخدام استبيانات تقييم ذاتي لمراقبة الامتثال الأساسي.',
          'تُدرَج متطلبات الامتثال البيئي والاجتماعي والحوكمي في العقود، ويخضع الموردون عالو المخاطرة لتدقيق طرف ثالث بخطط تصحيحية موثّقة.',
          'يوقّع جميع الموردين فوق حد إنفاق معيّن ميثاق سلوك بيئي واجتماعي وحوكمي إلزامي ويُدقَّقون مقابله، ويحصل الموردون عالو المخاطرة على دعم تحسين منظم ومتابعة.',
        ],
      },
      {
        q: 'How mature is your circular procurement practice — including specifications for recycled content, take-back requirements, product lifecycle design, and waste reduction?',
        qAr: 'ما مدى نضج ممارسة المشتريات الدائرية لديكم — بما في ذلك مواصفات المحتوى المُعاد تدويره ومتطلبات الاسترجاع وتصميم دورة حياة المنتج وخفض النفايات؟',
        levels: [
          'Circular economy principles have no influence on procurement specifications, supplier requirements, or purchasing decisions of any kind.',
          'Awareness of circular procurement exists within the team but no formal policies, specifications, or supplier requirements have been implemented.',
          'Circular procurement criteria (e.g., minimum recycled content) are applied to a limited number of categories or pilot projects.',
          'Circular procurement is embedded in category strategies for most major spend areas, with measurable KPIs tracked and reported.',
          'Circular procurement criteria are embedded in all category strategies, with minimum recycled content specified, take-back requirements contractualised, and waste KPIs tracked and published.',
        ],
        levelsAr: [
          'لا تؤثر مبادئ الاقتصاد الدائري في مواصفات المشتريات أو متطلبات الموردين أو قرارات الشراء من أي نوع.',
          'يوجد وعي بالمشتريات الدائرية داخل الفريق لكن لم تُطبَّق سياسات أو مواصفات أو متطلبات موردين رسمية.',
          'تُطبَّق معايير المشتريات الدائرية (مثل حد أدنى للمحتوى المُعاد تدويره) على عدد محدود من الفئات أو المشاريع التجريبية.',
          'تُضمَّن المشتريات الدائرية في استراتيجيات الفئات لمعظم مجالات الإنفاق الرئيسية، بمؤشرات أداء قابلة للقياس تُتابَع وتُرفَع.',
          'تُضمَّن معايير المشتريات الدائرية في جميع استراتيجيات الفئات، بتحديد حد أدنى للمحتوى المُعاد تدويره وإدراج متطلبات الاسترجاع في العقود ومتابعة مؤشرات النفايات ونشرها.',
        ],
      },
      {
        q: 'How transparently and comprehensively do you report supply chain sustainability performance to internal and external stakeholders, including customers, regulators, and investors?',
        qAr: 'ما مدى شفافية وشمولية رفعكم لتقارير أداء استدامة سلسلة الإمداد لأصحاب المصلحة الداخليين والخارجيين، بما في ذلك العملاء والجهات التنظيمية والمستثمرين؟',
        levels: [
          'No supply chain sustainability reporting is produced. ESG performance is not tracked, measured, or disclosed to any stakeholder.',
          'Basic internal ESG data is collected but it is not structured, not verified, and not reported against any recognised framework.',
          'Internal sustainability reporting covering key supply chain metrics is produced annually, though not yet externally disclosed or independently assured.',
          'Supply chain sustainability performance is reported publicly against a recognised framework (GRI or equivalent), with key metrics disclosed to investors and regulators.',
          'An annual supply chain sustainability report is published against GRI, SASB, or TCFD, aligned to regulatory requirements, independently assured, and shared proactively with all key stakeholders.',
        ],
        levelsAr: [
          'لا تُنتَج تقارير استدامة لسلسلة الإمداد. لا يُتتبَّع الأداء البيئي والاجتماعي والحوكمي أو يُقاس أو يُفصَح عنه لأي صاحب مصلحة.',
          'تُجمَع بيانات بيئية واجتماعية وحوكمية داخلية أساسية لكنها غير منظمة وغير مُتحقَّق منها ولا تُرفَع مقابل أي إطار معترف به.',
          'تُنتَج تقارير استدامة داخلية تغطي مقاييس سلسلة الإمداد الرئيسية سنويًا، لكنها لم يُفصَح عنها خارجيًا أو تُضمَن بشكل مستقل بعد.',
          'يُرفَع أداء استدامة سلسلة الإمداد علنًا مقابل إطار معترف به (GRI أو ما يعادله)، مع الإفصاح عن مقاييس رئيسية للمستثمرين والجهات التنظيمية.',
          'يُنشَر تقرير استدامة سنوي لسلسلة الإمداد مقابل GRI أو SASB أو TCFD، مواءَم مع المتطلبات التنظيمية ومضمون بشكل مستقل ويُشارَك استباقيًا مع جميع أصحاب المصلحة الرئيسيين.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Start with a Scope 3 emissions estimation using spend-based methodology. Introduce a basic supplier ESG questionnaire for your top 20 suppliers by spend.',
      Aware:     'Adopt a Supplier Code of Conduct covering human rights, environment, and governance. Begin integrating ESG criteria (10% weighting minimum) into sourcing evaluations.',
      Defined:   'Implement a supplier ESG audit programme for high-risk suppliers. Set quantified Scope 3 reduction targets and align to Saudi CMA ESG disclosure requirements.',
      Managed:   'Deploy a supplier sustainability platform for real-time ESG data collection. Develop a circular procurement policy and integrate ESG KPIs into supplier scorecards.',
      Optimised: 'Lead supply chain ESG transparency with externally assured reporting. Use ESG leadership as a competitive advantage in public sector and international tender qualification.',
    },
    recommendationsAr: {
      Reactive:  'ابدأ بتقدير انبعاثات النطاق الثالث باستخدام منهجية قائمة على الإنفاق. إدخال استبيان بيئي واجتماعي وحوكمي أساسي لأعلى 20 موردًا لديكم حسب الإنفاق.',
      Aware:     'اعتماد ميثاق سلوك للموردين يغطي حقوق الإنسان والبيئة والحوكمة. البدء بدمج المعايير البيئية والاجتماعية والحوكمية (بوزن 10% كحد أدنى) في تقييمات التوريد.',
      Defined:   'تطبيق برنامج تدقيق بيئي واجتماعي وحوكمي للموردين عالي المخاطرة. تحديد مستهدفات خفض مُقاسة للنطاق الثالث والمواءمة مع متطلبات الإفصاح لهيئة السوق المالية السعودية.',
      Managed:   'نشر منصة استدامة للموردين لجمع البيانات البيئية والاجتماعية والحوكمية آنيًا. تطوير سياسة مشتريات دائرية ودمج مؤشرات الأداء البيئي والاجتماعي والحوكمي في بطاقات أداء الموردين.',
      Optimised: 'قيادة الشفافية البيئية والاجتماعية والحوكمية لسلسلة الإمداد بتقارير مضمونة خارجيًا. استخدام الريادة في هذا المجال كميزة تنافسية في تأهيل المناقصات الحكومية والدولية.',
    },
    subSegments: ESG_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 7. DIGITAL ──────────────────────────────────────────────────────── */
  {
    id: 'digital',
    title: 'Digital Transformation & Technology',
    titleAr: 'التحول الرقمي والتقنية',
    shortTitle: 'Digital',
    shortTitleAr: 'الرقمنة',
    icon: Cpu,
    color: '#5B21B6',
    benchmarks: { gcc: 2.3, global: 3.0, best: 4.6 },
    frameworks: ['Gartner', 'ISO 27001', 'ASCM'],
    questions: [
      {
        q: 'How fully digitised is your procure-to-pay (P2P) process — from purchase requisition through purchase order, goods receipt, invoice, and payment?',
        qAr: 'ما مدى الرقمنة الكاملة لعملية الشراء حتى السداد (P2P) لديكم — من طلب الشراء مرورًا بأمر الشراء واستلام البضائع والفاتورة وحتى الدفع؟',
        levels: [
          'The P2P process is largely manual (paper, email, spreadsheets). There is no e-procurement system and no digital workflow in use.',
          'Some steps are partially digitised (e.g., electronic POs) but the overall process requires significant manual intervention and data re-entry.',
          'An e-procurement system is in use for most purchase types with basic workflow automation and reasonable spend visibility.',
          'The P2P process is largely automated with e-catalogues, 3-way matching, and automated invoice processing achieving 70%+ touchless processing rates.',
          'The P2P process is fully automated with e-catalogues, 3-way matching, automated invoice processing, and real-time spend visibility — achieving >95% touchless processing.',
        ],
        levelsAr: [
          'عملية P2P يدوية إلى حد كبير (ورق، بريد إلكتروني، جداول بيانات). لا يوجد نظام مشتريات إلكتروني ولا سير عمل رقمي مُستخدَم.',
          'رُقمنت بعض الخطوات جزئيًا (مثل أوامر الشراء الإلكترونية) لكن العملية الكلية تتطلب تدخلاً يدويًا كبيرًا وإعادة إدخال للبيانات.',
          'يُستخدَم نظام مشتريات إلكتروني لمعظم أنواع الشراء بأتمتة أساسية لسير العمل ورؤية معقولة للإنفاق.',
          'عملية P2P مؤتمتة إلى حد كبير بكتالوجات إلكترونية ومطابقة ثلاثية ومعالجة فواتير آلية تحقق معدلات معالجة دون تدخل تتجاوز 70%.',
          'عملية P2P مؤتمتة بالكامل بكتالوجات إلكترونية ومطابقة ثلاثية ومعالجة فواتير آلية ورؤية إنفاق آنية — محققةً معالجة دون تدخل تتجاوز 95%.',
        ],
      },
      {
        q: 'How effectively do you use data analytics, dashboards, and business intelligence tools to support procurement and supply chain decision-making?',
        qAr: 'ما مدى فعالية استخدامكم لتحليلات البيانات ولوحات المعلومات وأدوات ذكاء الأعمال لدعم اتخاذ القرار في المشتريات وسلسلة الإمداد؟',
        levels: [
          'Reporting is manual and infrequent. Decisions are made without reliable data and rely primarily on intuition, experience, or spreadsheets.',
          'Basic reports are produced periodically but are manually compiled, often out of date, and not consistently used in structured decision-making.',
          'Standard procurement and supply chain dashboards are available and used regularly for performance monitoring and management reporting.',
          'Real-time dashboards provide category managers and supply chain leaders with live KPI visibility updated daily or more frequently, driving proactive actions.',
          'Real-time dashboards provide live KPI visibility to all relevant roles; predictive analytics surface issues and opportunities before they materialise in operational outcomes.',
        ],
        levelsAr: [
          'التقارير يدوية وغير متكررة. تُتخذ القرارات دون بيانات موثوقة وتعتمد أساسًا على الحدس أو الخبرة أو جداول البيانات.',
          'تُنتَج تقارير أساسية دوريًا لكنها تُجمَع يدويًا وغالبًا ما تكون قديمة ولا تُستخدم باتساق في اتخاذ قرار منظم.',
          'تتوفر لوحات معلومات معيارية للمشتريات وسلسلة الإمداد وتُستخدم بانتظام لمراقبة الأداء وتقارير الإدارة.',
          'توفر لوحات المعلومات الآنية لمديري الفئات وقادة سلسلة الإمداد رؤية حية لمؤشرات الأداء تُحدَّث يوميًا أو أكثر، مما يوجّه إجراءات استباقية.',
          'توفر لوحات المعلومات الآنية رؤية حية لمؤشرات الأداء لجميع الأدوار ذات الصلة؛ وتُبرز التحليلات التنبؤية المشكلات والفرص قبل ظهورها في النتائج التشغيلية.',
        ],
      },
      {
        q: 'How advanced is your use of AI and machine learning — including demand forecasting, supplier risk scoring, spend classification, anomaly detection, or generative AI for drafting?',
        qAr: 'ما مدى تقدّم استخدامكم للذكاء الاصطناعي وتعلّم الآلة — بما في ذلك التنبؤ بالطلب وتسجيل مخاطر الموردين وتصنيف الإنفاق واكتشاف الشذوذ أو الذكاء الاصطناعي التوليدي للصياغة؟',
        levels: [
          'No AI or machine learning tools are in use in procurement or supply chain. There is no active exploration or roadmap for AI adoption.',
          'AI/ML is being explored or piloted in one area but no live applications are delivering measurable, sustained value to the business.',
          'One or two AI applications are live (e.g., automated spend classification or basic demand forecasting) and delivering measurable improvement.',
          'Multiple AI applications are live across procurement and supply chain, with clear ROI demonstrated against baselines and a defined roadmap for expansion.',
          'Multiple AI applications drive measurable value: ML demand forecasting, AI supplier risk scoring, GenAI for RFQ drafting, and NLP contract review are all live and integrated.',
        ],
        levelsAr: [
          'لا تُستخدَم أدوات ذكاء اصطناعي أو تعلّم آلة في المشتريات أو سلسلة الإمداد. لا يوجد استكشاف نشط أو خارطة طريق لتبني الذكاء الاصطناعي.',
          'يُستكشَف الذكاء الاصطناعي/تعلّم الآلة أو يُجرَّب في مجال واحد لكن لا توجد تطبيقات فعلية تقدّم قيمة مُقاسة ومستدامة للأعمال.',
          'يوجد تطبيق أو اثنان للذكاء الاصطناعي قيد التشغيل (مثل تصنيف الإنفاق الآلي أو التنبؤ الأساسي بالطلب) ويحققان تحسّنًا مُقاسًا.',
          'توجد تطبيقات متعددة للذكاء الاصطناعي قيد التشغيل عبر المشتريات وسلسلة الإمداد، بعائد استثمار واضح مُثبَت مقابل خطوط أساس وخارطة طريق محددة للتوسع.',
          'تقود تطبيقات متعددة للذكاء الاصطناعي قيمةً مُقاسة: التنبؤ بالطلب بتعلّم الآلة، وتسجيل مخاطر الموردين بالذكاء الاصطناعي، والذكاء التوليدي لصياغة طلبات عروض الأسعار، ومراجعة العقود بمعالجة اللغة الطبيعية — كلها فعلية ومتكاملة.',
        ],
      },
      {
        q: 'How well-integrated are your supply chain and procurement technology systems (ERP, SRM, CLM, WMS, TMS) — and how reliably do they share data to support end-to-end visibility?',
        qAr: 'ما مدى تكامل أنظمة تقنية سلسلة الإمداد والمشتريات لديكم (ERP، SRM، CLM، WMS، TMS) — وما مدى موثوقية مشاركتها للبيانات لدعم الرؤية من طرف إلى طرف؟',
        levels: [
          'Systems are completely fragmented silos with no integration. Data must be manually exported and reconciled across platforms on a regular basis.',
          'Some point-to-point integrations exist between key systems but data flows are incomplete, unreliable, and require frequent manual intervention.',
          'Core systems (ERP and procurement) share data through basic integration, enabling consolidated reporting for key processes.',
          'Most supply chain and procurement systems are integrated with automated data sharing and near-real-time reporting available across functions.',
          'A unified data architecture integrates all supply chain and procurement systems with real-time data sharing, single-source-of-truth reporting, and zero manual reconciliation required.',
        ],
        levelsAr: [
          'الأنظمة عبارة عن جزر منفصلة تمامًا دون تكامل. يجب تصدير البيانات ومطابقتها يدويًا عبر المنصات بانتظام.',
          'توجد بعض التكاملات المباشرة بين الأنظمة الرئيسية لكن تدفقات البيانات غير مكتملة وغير موثوقة وتتطلب تدخلاً يدويًا متكررًا.',
          'تتشارك الأنظمة الأساسية (ERP والمشتريات) البيانات عبر تكامل أساسي، مما يتيح تقارير موحّدة للعمليات الرئيسية.',
          'معظم أنظمة سلسلة الإمداد والمشتريات متكاملة بمشاركة بيانات آلية وتقارير شبه آنية متاحة عبر الوظائف.',
          'بنية بيانات موحّدة تدمج جميع أنظمة سلسلة الإمداد والمشتريات بمشاركة بيانات آنية وتقارير من مصدر حقيقة واحد ودون أي مطابقة يدوية.',
        ],
      },
      {
        q: 'How well does your technology roadmap support your supply chain strategy — with defined investments, clear business cases, and governance for prioritisation?',
        qAr: 'ما مدى دعم خارطة طريقكم التقنية لاستراتيجية سلسلة الإمداد لديكم — باستثمارات محددة ودراسات جدوى واضحة وحوكمة لتحديد الأولويات؟',
        levels: [
          'No technology roadmap exists for supply chain or procurement. Technology decisions are reactive and driven by vendor relationships rather than strategy.',
          'An informal technology wish-list exists but has no approved business case, allocated budget, or governance framework to prioritise investment.',
          'A technology roadmap is documented, aligned to the supply chain strategy, and reviewed at least annually by management.',
          'A funded technology roadmap with approved business cases is governed by a cross-functional steering committee and actively tracked against milestones.',
          'A 3-year technology roadmap aligned to the supply chain strategy is approved at executive level, fully funded, and governed by a cross-functional steering committee with quarterly progress reviews.',
        ],
        levelsAr: [
          'لا توجد خارطة طريق تقنية لسلسلة الإمداد أو المشتريات. القرارات التقنية تفاعلية وتقودها علاقات المورّدين بدلاً من الاستراتيجية.',
          'توجد قائمة أمنيات تقنية غير رسمية لكن دون دراسة جدوى معتمدة أو ميزانية مخصصة أو إطار حوكمة لتحديد أولويات الاستثمار.',
          'خارطة الطريق التقنية موثّقة ومواءَمة مع استراتيجية سلسلة الإمداد وتُراجَع سنويًا على الأقل من الإدارة.',
          'خارطة طريق تقنية ممولة بدراسات جدوى معتمدة تحكمها لجنة توجيهية متعددة الوظائف وتُتابَع بفاعلية مقابل المراحل.',
          'خارطة طريق تقنية لثلاث سنوات مواءَمة مع استراتيجية سلسلة الإمداد ومعتمدة على المستوى التنفيذي وممولة بالكامل وتحكمها لجنة توجيهية متعددة الوظائف بمراجعات تقدّم فصلية.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Deploy a basic e-procurement system as an immediate priority. Eliminate spreadsheet-based P2P processes and establish a central spend data repository.',
      Aware:     'Implement a spend analytics platform and build basic procurement dashboards. Develop a technology roadmap aligned to your procurement and supply chain strategy.',
      Defined:   'Integrate key systems (ERP, procurement, CLM) and deploy automated invoice processing. Begin piloting AI tools for demand forecasting or spend classification.',
      Managed:   'Expand AI/ML adoption to supplier risk monitoring and generative AI for RFQ drafting. Work toward a unified data platform for end-to-end supply chain visibility.',
      Optimised: 'Leverage agentic AI for autonomous procurement tasks in tail spend categories. Build proprietary data assets and analytics capabilities as a competitive differentiator.',
    },
    recommendationsAr: {
      Reactive:  'نشر نظام مشتريات إلكتروني أساسي كأولوية عاجلة. إلغاء عمليات P2P القائمة على جداول البيانات وإرساء مستودع مركزي لبيانات الإنفاق.',
      Aware:     'تطبيق منصة تحليلات إنفاق وبناء لوحات معلومات مشتريات أساسية. تطوير خارطة طريق تقنية مواءَمة مع استراتيجية المشتريات وسلسلة الإمداد لديكم.',
      Defined:   'دمج الأنظمة الرئيسية (ERP والمشتريات وCLM) ونشر معالجة الفواتير الآلية. البدء بتجربة أدوات الذكاء الاصطناعي للتنبؤ بالطلب أو تصنيف الإنفاق.',
      Managed:   'توسيع تبني الذكاء الاصطناعي/تعلّم الآلة ليشمل مراقبة مخاطر الموردين والذكاء التوليدي لصياغة طلبات عروض الأسعار. العمل نحو منصة بيانات موحّدة.',
      Optimised: 'توظيف الذكاء الاصطناعي الوكيلي لمهام المشتريات المستقلة في فئات الإنفاق الطرفية. بناء أصول بيانات وقدرات تحليلات خاصة كميزة تنافسية.',
    },
    subSegments: DIGITAL_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 8. DEMAND PLANNING & S&OP (new) ─────────────────────────────────── */
  {
    id: 'demand',
    title: 'Demand Planning & S&OP',
    titleAr: 'تخطيط الطلب وS&OP',
    shortTitle: 'Demand Planning',
    shortTitleAr: 'تخطيط الطلب',
    icon: BarChart2,
    color: '#0369A1',
    benchmarks: { gcc: 2.3, global: 2.9, best: 4.5 },
    frameworks: ['ASCM', 'APICS', 'IBP'],
    questions: [
      {
        q: 'How formal, accurate, and statistically rigorous is your demand forecasting process — including methodology, forecast accuracy measurement (MAPE/bias), and external signal integration?',
        qAr: 'ما مدى رسمية وصحة ودقة عملية التنبؤ بالطلب لديكم — بما في ذلك المنهجية وقياس دقة التنبؤ (MAPE/الانحياز) ودمج إشارات السوق الخارجية؟',
        levels: [
          'No demand forecasting exists. Replenishment is purely reactive based on stock-outs or manager intuition, with no forward-looking plan.',
          'Basic demand plans use simple moving averages or last-year-plus-growth. No formal accuracy measurement exists and sales/customer inputs are not incorporated.',
          'A formal monthly demand planning process uses statistical methods (e.g. exponential smoothing), measures MAPE, and is reviewed against actuals in a structured forum.',
          'Statistical forecasting models incorporating multiple demand signals (sales, promotions, seasonality) run monthly, with MAPE ≤20% for A-class items reviewed and actioned.',
          'ML-driven demand forecasting integrates point-of-sale data, external economic indicators, and supplier lead-time signals; MAPE ≤12% at SKU-level with continuous model refinement.',
        ],
        levelsAr: [
          'لا يوجد تنبؤ بالطلب. تُقدَّم الطلبات بشكل تفاعلي عند نفاد المخزون أو بناءً على حدس المدير، دون أي خطة مستقبلية.',
          'تستخدم خطط الطلب الأساسية متوسطات متحركة بسيطة أو نمو بالنسبة للعام الماضي. لا يوجد قياس رسمي للدقة ولا تُدمَج مدخلات المبيعات أو العملاء.',
          'تعمل عملية تخطيط طلب رسمية شهريًا باستخدام أساليب إحصائية (مثل التمهيد الأسي)، وتقيس MAPE وتُراجَع مقابل الفعلي في منتدى منظم.',
          'تعمل نماذج تنبؤ إحصائية تدمج إشارات طلب متعددة (المبيعات، الترويج، الموسمية) شهريًا، بـ MAPE ≤20% لأصناف الفئة A تُراجَع ويُتخذ إجراء بشأنها.',
          'يدمج التنبؤ بالطلب بتعلّم الآلة بيانات نقاط البيع والمؤشرات الاقتصادية الخارجية وإشارات مهل التوريد، بـ MAPE ≤12% على مستوى SKU مع تحسين مستمر للنماذج.',
        ],
      },
      {
        q: 'How mature and cross-functional is your S&OP cycle — in terms of inputs from sales, operations, and finance, meeting cadence, and translation of decisions into procurement and production actions?',
        qAr: 'ما مدى نضج وتعددية وظائف دورة S&OP لديكم — من حيث مدخلات المبيعات والعمليات والمالية ووتيرة الاجتماعات وترجمة القرارات إلى إجراءات شراء وإنتاج؟',
        levels: [
          'No S&OP process exists. Supply and demand plans are siloed with no cross-functional reconciliation or alignment.',
          'Informal S&OP meetings occur but attendance is inconsistent, inputs are unreliable, and outputs rarely translate to procurement or production actions.',
          'A monthly S&OP cycle is established with defined inputs from sales, operations, and supply chain, consistent meeting cadence, and basic actions assigned.',
          'S&OP includes financial reconciliation and executive review, consistently driving near-term procurement, production, and inventory decisions.',
          'A fully integrated IBP process runs monthly with executive engagement, real-time demand sensing, financial linkage, and direct integration with procurement and production planning.',
        ],
        levelsAr: [
          'لا توجد عملية S&OP. خطط الإمداد والطلب منعزلة دون مطابقة أو مواءمة متعددة الوظائف.',
          'تُعقد اجتماعات S&OP غير رسمية لكن الحضور غير منتظم والمدخلات غير موثوقة ونادرًا ما تُترجم المخرجات إلى إجراءات شراء أو إنتاج.',
          'أُنشئت دورة S&OP شهرية بمدخلات محددة من المبيعات والعمليات وسلسلة الإمداد، ووتيرة اجتماعات منتظمة وإجراءات أساسية مُسنَدة.',
          'تشمل S&OP مطابقة مالية ومراجعة تنفيذية، وتوجّه باستمرار قرارات الشراء والإنتاج والمخزون قصيرة المدى.',
          'تعمل عملية IBP متكاملة تمامًا شهريًا بمشاركة تنفيذية واستشعار للطلب في الوقت الحقيقي وربط مالي وتكامل مباشر مع التخطيط الشرائي والإنتاجي.',
        ],
      },
      {
        q: 'How effectively do you manage demand variability from promotions, seasonal peaks, and new product introductions — and how well do you track forecast error by root cause?',
        qAr: 'ما مدى فعالية إدارتكم لتقلّبات الطلب الناجمة عن الترويج والذروات الموسمية وإطلاق المنتجات الجديدة — وما مدى تتبّعكم لأخطاء التنبؤ حسب السبب الجذري؟',
        levels: [
          'Demand variability is not planned for. Promotions and seasonal surges regularly cause stock-outs or significant overstock with no structured response.',
          'Some informal adjustments are made for known seasonal peaks but no structured event-management process, post-event analysis, or bias tracking exists.',
          'A formal event management process captures promotions and new product introductions and adjusts the demand plan; forecast error is tracked at category level.',
          'Statistical event modelling quantifies the impact of promotions and NPIs; post-event analysis drives continuous forecast improvement; bias vs. noise is distinguished in error reporting.',
          'Advanced demand segmentation applies differentiated planning rules by customer, channel, and SKU tier; post-event analysis and root-cause decomposition drive self-improving forecast models.',
        ],
        levelsAr: [
          'لا يُخطَّط لتقلّبات الطلب. تتسبّب الحملات الترويجية والذروات الموسمية بانتظام في نفاد المخزون أو الإفراط فيه دون استجابة منظمة.',
          'تُجرى بعض التعديلات غير الرسمية للذروات الموسمية المعروفة لكن لا توجد عملية منظمة لإدارة الأحداث أو تحليل ما بعد الحدث أو تتبّع الانحياز.',
          'تلتقط عملية رسمية لإدارة الأحداث الحملات الترويجية وإطلاق المنتجات الجديدة وتعدّل خطة الطلب؛ وتُتابَع أخطاء التنبؤ على مستوى الفئة.',
          'تُقيس نمذجة الأحداث الإحصائية أثر الحملات الترويجية وإطلاق المنتجات الجديدة؛ ويوجّه تحليل ما بعد الحدث التحسين المستمر للتنبؤ مع التمييز بين الانحياز والضوضاء في تقارير الأخطاء.',
          'يُطبّق تقسيم متقدم للطلب قواعد تخطيط متمايزة حسب العميل والقناة وفئة SKU؛ ويوجّه تحليل ما بعد الحدث والتحليل السببي نماذج تنبؤ تتحسّن ذاتيًا.',
        ],
      },
      {
        q: 'How well-integrated is your demand plan with supply-side constraints — covering supplier lead times, production capacity, and procurement commitments in near-real time?',
        qAr: 'ما مدى تكامل خطة الطلب لديكم مع قيود جانب العرض — بما في ذلك مهل موردين وطاقة الإنتاج والتزامات الشراء في شبه الوقت الحقيقي؟',
        levels: [
          'Demand plans and supply plans are completely disconnected. Supply constraints are only discovered when shortages or production stoppages occur.',
          'Some ad-hoc coordination exists between demand and supply teams but no structured process links demand signals to supplier commitments or capacity plans.',
          'Monthly demand and supply integration reviews align the near-term demand plan with key supplier lead times and production capacity constraints.',
          'Demand-supply integration runs in near-real-time; demand plan changes automatically trigger procurement and production plan adjustments within the planning cycle.',
          'A fully integrated demand-supply planning system provides real-time constraint visibility; demand changes instantly ripple through procurement, production, and logistics plans with automated alerts.',
        ],
        levelsAr: [
          'خطط الطلب والإمداد منفصلة تمامًا. لا تُكتشَف قيود الإمداد إلا عند حدوث نقص أو توقّف إنتاجي.',
          'يوجد بعض التنسيق الارتجالي بين فرق الطلب والإمداد لكن لا تربط عملية منظمة إشارات الطلب بالتزامات الموردين أو خطط الطاقة.',
          'تواءِم مراجعات التكامل الشهرية بين الطلب والإمداد خطة الطلب قصيرة المدى مع مهل الموردين الرئيسيين وقيود طاقة الإنتاج.',
          'يعمل تكامل الطلب والإمداد في شبه الوقت الحقيقي؛ وتُؤدّي تغييرات خطة الطلب تلقائيًا إلى تعديل خطط الشراء والإنتاج خلال دورة التخطيط.',
          'يوفر نظام تخطيط متكامل للطلب والإمداد رؤية قيود آنية؛ وتنتشر تغييرات الطلب فورًا عبر خطط الشراء والإنتاج واللوجستيات مع تنبيهات آلية.',
        ],
      },
      {
        q: 'How reliably do you measure and continuously improve forecast accuracy — with defined accuracy KPIs, structured root-cause analysis, and a process for applying learnings?',
        qAr: 'ما مدى موثوقية قياسكم وتحسينكم المستمر لدقة التنبؤ — بمؤشرات دقة محددة وتحليل منظم للسبب الجذري وعملية لتطبيق الدروس المستفادة؟',
        levels: [
          'Forecast accuracy is never measured. There is no baseline understanding of how far actuals deviate from plans.',
          'Actual vs. plan variance is noted informally after the fact; no structured accuracy KPI, root-cause analysis, or corrective process exists.',
          'Forecast accuracy (MAPE or bias) is tracked monthly by segment or category; breaches of defined thresholds are investigated and actioned.',
          'Forecast accuracy is tracked by SKU/category, error is broken down by type (bias vs. noise), and findings drive model adjustments reviewed with sales and operations.',
          'Forecast accuracy is tracked at SKU level with automated dashboards; error decomposed by source (demand noise, model bias, data latency); drives quarterly algorithm reviews and continuous model improvement.',
        ],
        levelsAr: [
          'لا تُقاس دقة التنبؤ أبدًا. لا يوجد فهم أساسي لمدى انحراف الفعلي عن الخطط.',
          'يُلاحَظ الفارق بين الفعلي والخطط بعد الوقوعة بشكل غير رسمي؛ ولا توجد مؤشرات دقة منظمة أو تحليل سببي أو عملية تصحيحية.',
          'تُتابَع دقة التنبؤ (MAPE أو الانحياز) شهريًا حسب الشريحة أو الفئة؛ وتُحقَّق في تجاوزات الحدود المحددة ويُتخذ إجراء بشأنها.',
          'تُتابَع دقة التنبؤ حسب SKU/الفئة ويُصنَّف الخطأ حسب النوع (انحياز مقابل ضوضاء)، وتوجّه النتائج تعديلات النماذج التي تُراجَع مع المبيعات والعمليات.',
          'تُتابَع دقة التنبؤ على مستوى SKU بلوحات معلومات آلية؛ يُحلَّل الخطأ حسب المصدر (ضوضاء الطلب، انحياز النموذج، تأخّر البيانات)؛ ويوجّه مراجعات فصلية للخوارزمية وتحسينًا مستمرًا للنماذج.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Establish a basic monthly demand planning cadence using historical sales data. Define a simple MAPE target and begin tracking actuals vs. forecast for your top 20 SKUs.',
      Aware:     'Implement a formal S&OP process with monthly cross-functional meetings. Introduce statistical forecasting methods (exponential smoothing) and measure MAPE by category.',
      Defined:   'Integrate sales and customer inputs into the demand plan. Build a promotional event calendar and introduce post-event analysis to reduce forecast bias systematically.',
      Managed:   'Deploy a demand planning tool with statistical modelling. Embed real-time demand-supply integration and set MAPE targets at SKU level with monthly accuracy reviews.',
      Optimised: 'Pilot ML demand forecasting with external signal integration. Achieve MAPE ≤12% on A-class SKUs and integrate demand sensing directly into procurement commitments.',
    },
    recommendationsAr: {
      Reactive:  'إرساء وتيرة شهرية أساسية لتخطيط الطلب باستخدام البيانات التاريخية للمبيعات. تحديد مستهدف MAPE بسيط والبدء بتتبّع الفعلي مقابل التنبؤ لأعلى 20 صنفًا.',
      Aware:     'تطبيق عملية S&OP رسمية باجتماعات شهرية متعددة الوظائف. إدخال أساليب التنبؤ الإحصائية (التمهيد الأسي) وقياس MAPE حسب الفئة.',
      Defined:   'دمج مدخلات المبيعات والعملاء في خطة الطلب. بناء تقويم أحداث ترويجية وإدخال تحليل ما بعد الحدث لتقليل انحياز التنبؤ بشكل منهجي.',
      Managed:   'نشر أداة تخطيط الطلب بنمذجة إحصائية. تضمين تكامل آني للطلب والإمداد وتحديد مستهدفات MAPE على مستوى SKU بمراجعات دقة شهرية.',
      Optimised: 'تجربة تنبؤ الطلب بتعلّم الآلة مع دمج الإشارات الخارجية. تحقيق MAPE ≤12% على أصناف الفئة A ودمج استشعار الطلب مباشرةً في التزامات الشراء.',
    },
    subSegments: DEMAND_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 9. INVENTORY MANAGEMENT (new) ──────────────────────────────────── */
  {
    id: 'inventory',
    title: 'Inventory Management',
    titleAr: 'إدارة المخزون',
    shortTitle: 'Inventory',
    shortTitleAr: 'المخزون',
    icon: Package,
    color: '#059669',
    benchmarks: { gcc: 2.4, global: 3.0, best: 4.5 },
    frameworks: ['ASCM', 'APICS', 'ABC-XYZ'],
    questions: [
      {
        q: 'How rigorously is your inventory policy defined — covering safety stock methodology, reorder point logic, and min/max levels — and how regularly is it reviewed and updated?',
        qAr: 'ما مدى صرامة تعريف سياسة المخزون لديكم — بما في ذلك منهجية مخزون الأمان ومنطق نقطة إعادة الطلب والحدود الدنيا والقصوى — وما مدى انتظام مراجعتها وتحديثها؟',
        levels: [
          'No formal inventory policy exists. Order quantities and timing are based on habit or manager intuition with no documented logic.',
          'Basic min/max levels exist for some high-value items but are set intuitively, rarely reviewed, and not validated against actual demand patterns.',
          'A formal inventory policy defines safety stock and reorder points for key SKUs using historical demand data, reviewed at least annually.',
          'Statistical safety stock models (service-level-based EOQ/ROP) are applied to all significant SKUs, reviewed quarterly, and updated when demand patterns change.',
          'Dynamic safety stock models recalibrate automatically based on real-time demand variability, lead-time changes, and target service levels; reorder parameters self-adjust continuously.',
        ],
        levelsAr: [
          'لا توجد سياسة مخزون رسمية. تستند كميات الطلب وتوقيته إلى العادة أو حدس المدير دون منطق موثّق.',
          'توجد حدود دنيا/قصوى أساسية لبعض الأصناف عالية القيمة لكنها مُحدَّدة بشكل حدسي ونادرًا ما تُراجَع ولا تُتحقَّق مقابل أنماط الطلب الفعلية.',
          'تحدد سياسة مخزون رسمية مخزون الأمان ونقاط إعادة الطلب لأصناف SKU الرئيسية باستخدام بيانات الطلب التاريخية، وتُراجَع سنويًا على الأقل.',
          'تُطبَّق نماذج إحصائية لمخزون الأمان (EOQ/ROP القائمة على مستوى الخدمة) على جميع أصناف SKU الجوهرية، وتُراجَع فصليًا وتُحدَّث عند تغيّر أنماط الطلب.',
          'تُعيد نماذج مخزون الأمان الديناميكية معايرتها تلقائيًا بناءً على تقلّبات الطلب الآنية وتغيّرات مهل التوريد ومستويات الخدمة المستهدفة؛ وتتعدّل معاملات إعادة الطلب باستمرار.',
        ],
      },
      {
        q: 'How effectively is your inventory segmented and managed by ABC/XYZ or equivalent classification — ensuring differentiated service levels, ordering rules, and review frequencies by tier?',
        qAr: 'ما مدى فعالية تقسيم مخزونكم وإدارته وفق تصنيف ABC/XYZ أو ما يعادله — مما يضمن مستويات خدمة متمايزة وقواعد طلب وترددات مراجعة حسب الفئة؟',
        levels: [
          'All SKUs are managed with identical policies regardless of value, volume, or criticality. No formal classification model is in use.',
          'A rough split of fast vs. slow movers exists informally but no structured ABC/XYZ segmentation drives differentiated policies or ordering rules.',
          'ABC classification by value is applied, with higher-value A items receiving more frequent review and tighter ordering rules than B and C items.',
          'ABC/XYZ segmentation (value × demand variability) drives differentiated inventory policies, reorder rules, and review frequencies across all SKU tiers.',
          'Multi-dimensional segmentation (value, variability, criticality, lead time) drives fully differentiated policies per segment, refreshed quarterly and integrated with sourcing strategy.',
        ],
        levelsAr: [
          'تُدار جميع أصناف SKU بسياسات متطابقة بصرف النظر عن القيمة أو الحجم أو الأهمية الحرجة. لا يُستخدَم نموذج تصنيف رسمي.',
          'يوجد تقسيم خشن للأصناف سريعة مقابل بطيئة الحركة بشكل غير رسمي لكن لا يوجد تقسيم ABC/XYZ منظم يدفع سياسات متمايزة أو قواعد طلب.',
          'يُطبَّق تصنيف ABC حسب القيمة، مع منح أصناف A عالية القيمة مراجعة أكثر تكرارًا وقواعد طلب أكثر صرامة من أصناف B وC.',
          'يدفع تقسيم ABC/XYZ (القيمة × تقلّب الطلب) سياسات مخزون متمايزة وقواعد إعادة طلب وترددات مراجعة عبر جميع فئات SKU.',
          'يدفع التقسيم متعدد الأبعاد (القيمة، التقلّب، الأهمية الحرجة، مهلة التوريد) سياسات متمايزة بالكامل لكل شريحة، يُحدَّث فصليًا ومدمَج مع استراتيجية التوريد.',
        ],
      },
      {
        q: 'How accurate is your inventory data — in terms of location accuracy, quantity accuracy, and the frequency and rigour of your cycle-count programme?',
        qAr: 'ما مدى دقة بيانات مخزونكم — من حيث دقة الموقع والكمية ووتيرة وصرامة برنامج الجرد الدوري لديكم؟',
        levels: [
          'Inventory records are frequently inaccurate. There is no cycle-count programme and discrepancies are only discovered when a stock-out or audit occurs.',
          'An annual full stocktake is conducted but interim accuracy checks are absent; significant discrepancies between system records and physical stock are common.',
          'A cycle-count programme covers A-class items monthly and all other items annually; inventory accuracy is tracked and reported at ≥90% for key items.',
          'A structured cycle-count programme achieves ≥95% inventory location and quantity accuracy for all tiers, with root-cause analysis of discrepancies driving process corrections.',
          'Continuous cycle counting with RFID/barcode scanning achieves ≥99% inventory accuracy across all locations; discrepancy root-cause analysis drives systemic process improvements.',
        ],
        levelsAr: [
          'سجلات المخزون غير دقيقة بشكل متكرر. لا يوجد برنامج جرد دوري وتُكتشَف الفوارق فقط عند نفاد المخزون أو إجراء تدقيق.',
          'يُجرى جرد كامل سنوي لكن فحوصات الدقة المؤقتة غائبة؛ وتشيع الفوارق الكبيرة بين سجلات النظام والمخزون الفعلي.',
          'يغطي برنامج جرد دوري أصناف الفئة A شهريًا وجميع الأصناف الأخرى سنويًا؛ وتُتابَع دقة المخزون وتُرفَع بنسبة ≥90% للأصناف الرئيسية.',
          'يحقق برنامج جرد دوري منظم دقة ≥95% في موقع المخزون وكميته لجميع الفئات، مع تحليل سببي للفوارق يوجّه تصحيحات العمليات.',
          'يحقق الجرد المستمر بمسح RFID/باركود دقة مخزون ≥99% عبر جميع المواقع؛ ويوجّه تحليل السبب الجذري للفوارق تحسينات منهجية في العمليات.',
        ],
      },
      {
        q: 'How effectively do you identify, manage, and disposition slow-moving, obsolete, and excess inventory (SLOB) — with structured governance and transparent leadership reporting?',
        qAr: 'ما مدى فعالية تحديدكم وإدارتكم والتصرف في مخزون الأصناف البطيئة الحركة والمتقادمة والزائدة (SLOB) — بحوكمة منظمة وتقارير شفافة للقيادة؟',
        levels: [
          'SLOB inventory is not tracked or managed. Obsolete stock accumulates indefinitely with no systematic review, governance, or write-off process.',
          'SLOB is identified informally at year-end during financial review, but there is no proactive governance, disposition process, or leadership reporting.',
          'A quarterly SLOB review identifies slow-moving and obsolete items; a defined disposition process covers markdown, return to supplier, or write-off with management approval.',
          'Monthly SLOB reporting triggers proactive disposition actions; write-off authority thresholds are defined, disposition outcomes are tracked, and SLOB KPIs are reported to leadership.',
          'SLOB is monitored in real-time with automated ageing alerts; disposition decisions are driven by margin optimisation logic; SLOB as % of total inventory is a board-reported KPI.',
        ],
        levelsAr: [
          'لا يُتابَع مخزون SLOB أو يُدار. يتراكم المخزون المتقادم إلى أجل غير مسمى دون مراجعة منهجية أو حوكمة أو عملية شطب.',
          'يُحدَّد SLOB بشكل غير رسمي في نهاية العام خلال المراجعة المالية، لكن لا توجد حوكمة استباقية أو عملية التصرف أو تقارير للقيادة.',
          'تُحدد مراجعة SLOB فصلية الأصناف بطيئة الحركة والمتقادمة؛ وتغطي عملية التصرف المحددة التخفيض والإعادة للمورد أو الشطب بموافقة الإدارة.',
          'تُطلق تقارير SLOB الشهرية إجراءات التصرف الاستباقية؛ وتُحدَّد حدود صلاحيات الشطب وتُتابَع نتائج التصرف وتُرفَع مؤشرات SLOB للقيادة.',
          'يُراقَب SLOB آنيًا بتنبيهات تقادم آلية؛ وتُوجَّه قرارات التصرف بمنطق تحسين الهامش؛ ونسبة SLOB إلى إجمالي المخزون مؤشر يُرفَع لمجلس الإدارة.',
        ],
      },
      {
        q: 'How well are inventory levels optimised to balance service-level targets against working capital efficiency — and how is inventory performance reported to leadership?',
        qAr: 'ما مدى تحسين مستويات المخزون لتحقيق التوازن بين مستهدفات مستوى الخدمة وكفاءة رأس المال العامل — وكيف يُرفَع أداء المخزون للقيادة؟',
        levels: [
          'No connection exists between inventory levels and working capital management. Inventory is not reported as a financial metric to leadership.',
          'Inventory turns are tracked informally for some categories but there is no explicit service-level target, working capital optimisation model, or structured leadership reporting.',
          'Inventory turns and a target fill-rate or service-level are defined per category; inventory value is reported monthly to finance and supply chain leadership.',
          'Inventory is managed against explicit service-level targets by SKU tier with working capital trade-off modelling; days-inventory-outstanding (DIO) is a key leadership KPI.',
          'Inventory optimisation models simultaneously maximise service level and minimise working capital; DIO, SLOB %, and fill-rate by tier are reported at board level with year-on-year trends.',
        ],
        levelsAr: [
          'لا توجد صلة بين مستويات المخزون وإدارة رأس المال العامل. لا يُرفَع المخزون كمقياس مالي للقيادة.',
          'تُتابَع معدلات دوران المخزون بشكل غير رسمي لبعض الفئات لكن لا توجد مستهدفات مستوى خدمة صريحة أو نموذج تحسين لرأس المال العامل أو تقارير قيادة منظمة.',
          'تُحدَّد معدلات دوران المخزون ومعدل التعبئة أو مستوى الخدمة المستهدف لكل فئة؛ وتُرفَع قيمة المخزون للمالية وقيادة سلسلة الإمداد شهريًا.',
          'يُدار المخزون مقابل مستهدفات مستوى خدمة صريحة حسب فئة SKU مع نمذجة مفاضلة رأس المال العامل؛ وأيام المخزون القائم (DIO) مؤشر قيادة رئيسي.',
          'تعظّم نماذج تحسين المخزون في آنٍ واحد مستوى الخدمة وتُقلّل رأس المال العامل؛ ويُرفَع DIO ونسبة SLOB ومعدل التعبئة حسب الفئة على مستوى مجلس الإدارة باتجاهات سنوية.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Define a basic inventory policy with min/max levels for all stock items. Introduce ABC classification and prioritise safety stock modelling for your top 20% of SKUs by value.',
      Aware:     'Implement statistical safety stock (EOQ/ROP) for A-class items. Launch a monthly cycle-count programme and establish a quarterly SLOB review with defined disposition authority.',
      Defined:   'Extend ABC/XYZ segmentation to all SKUs. Set DIO as a leadership KPI and build a working capital trade-off model linking service levels to inventory investment.',
      Managed:   'Deploy a WMS or inventory optimisation module. Integrate demand-supply planning for automated reorder parameter updates and launch a real-time SLOB ageing dashboard.',
      Optimised: 'Implement dynamic safety stock with real-time recalibration. Drive inventory turns to best-in-class levels and link DIO directly to executive scorecards and capital allocation reviews.',
    },
    recommendationsAr: {
      Reactive:  'تعريف سياسة مخزون أساسية بحدود دنيا/قصوى لجميع أصناف المخزون. إدخال تصنيف ABC وتحديد الأولوية لنمذجة مخزون الأمان لأعلى 20% من أصناف SKU حسب القيمة.',
      Aware:     'تطبيق مخزون الأمان الإحصائي (EOQ/ROP) لأصناف الفئة A. إطلاق برنامج جرد دوري شهري وإرساء مراجعة SLOB فصلية بصلاحيات تصرف محددة.',
      Defined:   'توسيع تقسيم ABC/XYZ ليشمل جميع أصناف SKU. تحديد DIO كمؤشر قيادة وبناء نموذج مفاضلة رأس المال العامل الرابط بين مستويات الخدمة والاستثمار في المخزون.',
      Managed:   'نشر WMS أو وحدة تحسين المخزون. دمج تخطيط الطلب والإمداد لتحديث آلي لمعاملات إعادة الطلب وإطلاق لوحة معلومات آنية لتقادم SLOB.',
      Optimised: 'تطبيق مخزون أمان ديناميكي بإعادة معايرة آنية. رفع معدلات دوران المخزون إلى مستويات الأفضل في الفئة وربط DIO مباشرةً ببطاقات الأداء التنفيذية ومراجعات تخصيص رأس المال.',
    },
    subSegments: INVENTORY_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 10. LOGISTICS & DISTRIBUTION (new) ─────────────────────────────── */
  {
    id: 'logistics',
    title: 'Logistics & Distribution',
    titleAr: 'اللوجستيات والتوزيع',
    shortTitle: 'Logistics',
    shortTitleAr: 'اللوجستيات',
    icon: Truck,
    color: '#0E7490',
    benchmarks: { gcc: 2.5, global: 3.1, best: 4.4 },
    frameworks: ['CSCMP', 'FIATA', 'Incoterms'],
    questions: [
      {
        q: 'How formally are your logistics carriers and 3PLs governed — in terms of SLA agreements, KPI definitions, performance review cadence, and consequences for non-performance?',
        qAr: 'ما مدى رسمية حوكمة ناقليكم ومزوّدي الخدمات اللوجستية من الطرف الثالث (3PL) — من حيث اتفاقيات مستوى الخدمة وتعريفات مؤشرات الأداء ووتيرة مراجعة الأداء وعواقب ضعف الأداء؟',
        levels: [
          'Carrier and 3PL relationships are informal with no SLA agreements, no KPIs defined, and no governance process of any kind.',
          'Some KPIs (e.g., on-time delivery) are tracked informally for primary carriers but reviews are infrequent, undocumented, and not linked to consequences.',
          'Formal SLA agreements exist for key logistics providers with defined KPIs tracked and reviewed at least quarterly against contracted terms.',
          'All logistics carriers and 3PLs are governed through SLA agreements with monthly performance reviews, cost benchmarking, and documented corrective action processes.',
          'All carriers and 3PLs are governed through formal SLAs with monthly KPI reviews, market-rate benchmarking, automated performance dashboards, and defined corrective-action and exit protocols.',
        ],
        levelsAr: [
          'علاقات الناقلين ومزوّدي الطرف الثالث غير رسمية دون اتفاقيات مستوى خدمة أو مؤشرات أداء أو أي عملية حوكمة.',
          'تُتابَع بعض المؤشرات (مثل التسليم في الوقت المحدد) بشكل غير رسمي للناقلين الرئيسيين لكن المراجعات غير متكررة وغير موثّقة وغير مرتبطة بعواقب.',
          'توجد اتفاقيات مستوى خدمة رسمية لمزوّدي الخدمات اللوجستية الرئيسيين بمؤشرات محددة تُتابَع وتُراجَع فصليًا على الأقل مقابل البنود المتعاقد عليها.',
          'تُحكَم جميع الناقلين ومزوّدي الطرف الثالث عبر اتفاقيات مستوى خدمة بمراجعات أداء شهرية ومقارنة معيارية للتكلفة وعمليات تصحيح موثّقة.',
          'تُحكَم جميع الناقلين ومزوّدي الطرف الثالث عبر اتفاقيات مستوى خدمة رسمية بمراجعات مؤشرات شهرية ومقارنة معيارية لأسعار السوق ولوحات أداء آلية وبروتوكولات تصحيح وخروج محددة.',
        ],
      },
      {
        q: 'How mature is your transportation network optimisation — covering mode selection, route planning, load consolidation, and cost-per-unit-shipped analysis?',
        qAr: 'ما مدى نضج تحسين شبكة النقل لديكم — بما يشمل اختيار الوسيلة وتخطيط المسار وتوحيد الأحمال وتحليل تكلفة الشحنة الواحدة؟',
        levels: [
          'Transportation decisions are made reactively and individually without any network analysis, mode optimisation, or cost-per-shipment tracking.',
          'Some informal cost comparison between modes occurs for major shipments but no structured optimisation methodology, tools, or data-driven decisions are applied.',
          'Regular transportation cost analysis identifies consolidation opportunities; mode selection guidelines exist and cost-per-shipment is tracked and reported.',
          'Route optimisation tools are used to minimise transportation cost and transit time; load consolidation is actively managed; cost-per-tonne-km is a tracked KPI.',
          'A TMS optimises mode, route, and load across the full network in real-time; cost-per-tonne-km is benchmarked against market; carrier scorecards drive allocation decisions.',
        ],
        levelsAr: [
          'تُتخذ قرارات النقل بشكل تفاعلي وفردي دون أي تحليل للشبكة أو تحسين للوسيلة أو تتبّع لتكلفة الشحنة.',
          'يُجرى بعض المقارنة غير الرسمية للتكلفة بين الوسائل للشحنات الكبرى لكن دون منهجية تحسين منظمة أو أدوات أو قرارات مدفوعة بالبيانات.',
          'يُحدّد تحليل تكاليف النقل المنتظم فرص التوحيد؛ وتوجد إرشادات اختيار الوسيلة وتُتابَع تكلفة الشحنة وتُرفَع.',
          'تُستخدَم أدوات تحسين المسار لتقليل تكلفة النقل وزمن العبور؛ ويُدار توحيد الأحمال بفاعلية؛ وتكلفة الطن/كم مؤشر متابَع.',
          'يُحسَّن نظام TMS الوسيلة والمسار والحمل عبر الشبكة الكاملة آنيًا؛ وتُقارَن تكلفة الطن/كم معياريًا بالسوق؛ وتوجّه بطاقات أداء الناقلين قرارات التخصيص.',
        ],
      },
      {
        q: 'How effectively do you measure and manage OTIF (on-time in-full) delivery performance at customer and shipment level — with root-cause analysis and continuous improvement?',
        qAr: 'ما مدى فعالية قياسكم وإدارتكم لأداء OTIF (التسليم في الوقت المحدد وبالكمية الكاملة) على مستوى العميل والشحنة — مع تحليل السبب الجذري والتحسين المستمر؟',
        levels: [
          'OTIF is not measured. Delivery performance is unknown and customer complaints about delivery are handled reactively.',
          'On-time delivery is tracked informally for major customers but there is no OTIF definition, no structured measurement, and no accountability framework.',
          'OTIF is formally defined and measured monthly across all customers; delivery accuracy and rejection rates are tracked and reviewed with logistics providers.',
          'OTIF is measured daily at customer and route level; delivery failure root causes are analysed, corrective actions are assigned, and OTIF trends are reported to operations leadership.',
          'OTIF is measured in real-time at shipment level; predictive models flag at-risk deliveries before failure; customer-facing delivery dashboards drive continuous improvement; OTIF ≥95% sustained.',
        ],
        levelsAr: [
          'لا تُقاس OTIF. أداء التسليم مجهول وتُعالَج شكاوى العملاء المتعلقة بالتسليم بشكل تفاعلي.',
          'يُتابَع التسليم في الوقت المحدد بشكل غير رسمي للعملاء الرئيسيين لكن لا تعريف لـ OTIF ولا قياس منظم ولا إطار مساءلة.',
          'تُعرَّف OTIF وتُقاس شهريًا عبر جميع العملاء؛ وتُتابَع دقة التسليم ومعدلات الرفض وتُراجَع مع مزوّدي الخدمات اللوجستية.',
          'تُقاس OTIF يوميًا على مستوى العميل والمسار؛ وتُحلَّل أسباب فشل التسليم وتُسنَد إجراءات تصحيحية وتُرفَع اتجاهات OTIF لقيادة العمليات.',
          'تُقاس OTIF آنيًا على مستوى الشحنة؛ وتُبلّغ النماذج التنبؤية عن التسليمات المعرّضة للخطر قبل الفشل؛ وتوجّه لوحات تسليم مواجهة العملاء التحسين المستمر؛ وتُحافَظ على OTIF ≥95%.',
        ],
      },
      {
        q: 'How effectively do you manage customs, trade compliance, and import/export documentation — minimising delays, demurrage costs, and regulatory penalties?',
        qAr: 'ما مدى فعالية إدارتكم للجمارك والامتثال التجاري ووثائق الاستيراد/التصدير — مما يُقلّل التأخيرات وتكاليف الإقامة والغرامات التنظيمية؟',
        levels: [
          'Customs and trade compliance are managed reactively. Documentation errors, delays, and demurrage costs are frequent and not systematically tracked.',
          'Basic customs processes exist but are largely manual; document errors are common and compliance knowledge is held by one or two individuals.',
          'A defined import/export process with standard document checklists is in place; a customs broker is formally appointed; HS code accuracy is reviewed periodically.',
          'Customs compliance is managed systematically with pre-clearance processes, HS code validation, and demurrage tracking; customs KPIs are reported to management.',
          'A dedicated trade compliance function manages proactive HS code management, AEO status, pre-arrival clearance, and customs analytics; demurrage and duty leakage are near-zero.',
        ],
        levelsAr: [
          'تُدار الجمارك والامتثال التجاري بشكل تفاعلي. أخطاء الوثائق والتأخيرات وتكاليف الإقامة متكررة وغير متابَعة بشكل منهجي.',
          'توجد عمليات جمركية أساسية لكنها يدوية إلى حد كبير؛ وأخطاء الوثائق شائعة ومعرفة الامتثال محصورة في فرد أو اثنين.',
          'تُطبَّق عملية استيراد/تصدير محددة بقوائم وثائق معيارية؛ ويُعيَّن وسيط جمركي رسميًا؛ وتُراجَع دقة رموز HS بشكل دوري.',
          'يُدار الامتثال الجمركي بشكل منهجي بعمليات التخليص المسبق والتحقق من رموز HS وتتبّع الإقامة؛ وتُرفَع مؤشرات الجمارك للإدارة.',
          'تُدير دالة امتثال تجاري متخصصة إدارة رموز HS الاستباقية وحالة AEO والتخليص قبل الوصول وتحليلات الجمارك؛ وتكاليف الإقامة وتسريب الرسوم شبه معدومة.',
        ],
      },
      {
        q: 'How mature is your reverse logistics and returns management capability — covering customer returns authorisation, condition assessment, disposition routing, and recovery value optimisation?',
        qAr: 'ما مدى نضج قدرتكم على اللوجستيات العكسية وإدارة المرتجعات — بما في ذلك تفويض مرتجعات العملاء وتقييم الحالة وتوجيه التصرف وتحسين قيمة الاسترداد؟',
        levels: [
          'Returns are handled ad-hoc with no defined process, no returns policy, and no tracking of return volumes, costs, or recovery value.',
          'A basic returns process exists for customer returns but it is manual, slow, lacks cost-accounting, and supplier returns and end-of-life disposition are unmanaged.',
          'A formal returns management process defines authorisation, condition assessment, disposition routing, and crediting for both customer and supplier returns.',
          'Returns KPIs (return rate by reason, processing time, recovery value) are tracked monthly; reverse logistics costs are reported and actioned; supplier return processes are contractualised.',
          'A fully automated reverse logistics platform tracks returns from authorisation to final disposition; recovery rate optimisation maximises refurbishment/resale value; returns analytics drive quality and packaging improvements.',
        ],
        levelsAr: [
          'تُعالَج المرتجعات بشكل ارتجالي دون عملية محددة أو سياسة مرتجعات أو تتبّع لأحجام المرتجعات أو التكاليف أو قيمة الاسترداد.',
          'توجد عملية مرتجعات أساسية لمرتجعات العملاء لكنها يدوية وبطيئة وتفتقر إلى محاسبة التكاليف، ومرتجعات الموردين والتخلّص من المنتهية الصلاحية غير مُدارة.',
          'تُعرَّف عملية رسمية لإدارة المرتجعات بالتفويض وتقييم الحالة وتوجيه التصرف والائتمان لمرتجعات العملاء والموردين على حدٍّ سواء.',
          'تُتابَع مؤشرات المرتجعات (معدل المرتجعات حسب السبب، زمن المعالجة، قيمة الاسترداد) شهريًا؛ وتُرفَع تكاليف اللوجستيات العكسية ويُتخذ إجراء بشأنها؛ وعمليات مرتجعات الموردين مُدرَجة في العقود.',
          'تتتبّع منصة لوجستيات عكسية مؤتمتة بالكامل المرتجعات من التفويض إلى التصرف النهائي؛ وتعظّم نماذج تحسين معدل الاسترداد قيمة التجديد/إعادة البيع؛ وتوجّه تحليلات المرتجعات تحسينات الجودة والتغليف.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Establish formal SLA agreements with all primary carriers. Define OTIF as a core supply chain KPI and begin measuring it monthly. Implement a basic customs compliance checklist.',
      Aware:     'Deploy 3PL performance scorecards with monthly review cadence. Build a transportation cost analysis framework and introduce a formal returns management process.',
      Defined:   'Implement a TMS for route optimisation and load consolidation. Set OTIF targets by customer segment and begin root-cause analysis of delivery failures.',
      Managed:   'Extend TMS to multi-modal optimisation. Achieve OTIF ≥90% across key lanes and integrate customs compliance into the procurement and logistics planning cycle.',
      Optimised: 'Deploy real-time shipment tracking with predictive OTIF analytics. Achieve AEO status for customs and build a reverse logistics platform that maximises recovery value.',
    },
    recommendationsAr: {
      Reactive:  'إرساء اتفاقيات مستوى خدمة رسمية مع جميع الناقلين الرئيسيين. تعريف OTIF كمؤشر أداء رئيسي لسلسلة الإمداد والبدء بقياسها شهريًا. تطبيق قائمة امتثال جمركي أساسية.',
      Aware:     'نشر بطاقات أداء 3PL بوتيرة مراجعة شهرية. بناء إطار تحليل تكاليف النقل وإدخال عملية رسمية لإدارة المرتجعات.',
      Defined:   'تطبيق TMS لتحسين المسار وتوحيد الأحمال. تحديد مستهدفات OTIF حسب شريحة العملاء والبدء بتحليل السبب الجذري لإخفاقات التسليم.',
      Managed:   'توسيع TMS ليشمل التحسين متعدد الوسائل. تحقيق OTIF ≥90% عبر المسارات الرئيسية ودمج الامتثال الجمركي في دورة تخطيط الشراء واللوجستيات.',
      Optimised: 'نشر تتبّع الشحنات آنيًا بتحليلات OTIF التنبؤية. تحقيق حالة AEO للجمارك وبناء منصة لوجستيات عكسية تعظّم قيمة الاسترداد.',
    },
    subSegments: LOGISTICS_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── 11. ORGANISATION & TALENT (new) ────────────────────────────────── */
  {
    id: 'org_talent',
    title: 'Organisation & Talent',
    titleAr: 'الهيكل التنظيمي والكوادر',
    shortTitle: 'Org & Talent',
    shortTitleAr: 'الهيكل والكوادر',
    icon: GraduationCap,
    color: '#7C3AED',
    benchmarks: { gcc: 2.2, global: 2.8, best: 4.4 },
    frameworks: ['CIPS', 'CSCMP', 'SHRM'],
    questions: [
      {
        q: 'How clearly defined is your supply chain organisation structure — in terms of reporting lines, role clarity, functional boundaries, and alignment to your supply chain strategy?',
        qAr: 'ما مدى وضوح هيكل مؤسسة سلسلة الإمداد لديكم — من حيث خطوط الإبلاغ ووضوح الأدوار والحدود الوظيفية والمواءمة مع استراتيجية سلسلة الإمداد؟',
        levels: [
          'Supply chain responsibilities are fragmented across departments with no dedicated function, unclear ownership, and significant gaps or overlaps in accountability.',
          'A supply chain team exists but reporting lines are unclear, roles overlap with other functions, and the structure is not aligned to the supply chain strategy.',
          'A dedicated supply chain function has clear reporting lines, defined roles, and responsibilities aligned to the supply chain strategy; an org chart is documented and maintained.',
          'The supply chain org structure is reviewed annually against strategic requirements with clear functional boundaries, a defined governance model, and formal interface agreements with commercial and operations teams.',
          'A world-class supply chain org design optimises for end-to-end accountability; structure is reviewed and adjusted in response to strategic changes; centre-of-excellence or shared-service models are deployed where appropriate.',
        ],
        levelsAr: [
          'مسؤوليات سلسلة الإمداد مجزّأة عبر الإدارات دون وظيفة متخصصة أو ملكية واضحة وفجوات أو تداخلات كبيرة في المساءلة.',
          'يوجد فريق لسلسلة الإمداد لكن خطوط الإبلاغ غير واضحة والأدوار تتداخل مع وظائف أخرى والهيكل غير مواءَم مع استراتيجية سلسلة الإمداد.',
          'تمتلك وظيفة سلسلة الإمداد المتخصصة خطوط إبلاغ واضحة وأدوارًا ومسؤوليات محددة مواءَمة مع الاستراتيجية؛ والهيكل التنظيمي موثّق ومحدَّث.',
          'يُراجَع هيكل مؤسسة سلسلة الإمداد سنويًا مقابل المتطلبات الاستراتيجية بحدود وظيفية واضحة ونموذج حوكمة محدد واتفاقيات واجهة رسمية مع فرق التجاري والعمليات.',
          'يُحسَّن تصميم مؤسسة سلسلة الإمداد لتحقيق المساءلة من طرف إلى طرف؛ ويُراجَع الهيكل ويُعدَّل استجابةً للتغيّرات الاستراتيجية؛ وتُنشَر نماذج مركز الخبرة أو الخدمات المشتركة عند الاقتضاء.',
        ],
      },
      {
        q: 'How comprehensively have you defined the supply chain skills and competencies required for each role — and how regularly do you assess and close the capability gap?',
        qAr: 'ما مدى شمولية تعريفكم للمهارات والكفاءات المطلوبة لكل دور في سلسلة الإمداد — وما مدى انتظامكم في تقييم وسدّ فجوة القدرات؟',
        levels: [
          'No competency framework exists for supply chain roles. Hiring and development decisions are based on intuition with no structured skills assessment.',
          'Job descriptions exist for supply chain roles but a formal competency framework, skills taxonomy, or capability gap assessment has never been conducted.',
          'A supply chain competency framework is defined for key roles; a gap assessment has been conducted and results inform hiring and development priorities.',
          'The competency framework covers all supply chain roles; annual capability gap assessments drive targeted development plans for individuals and teams.',
          'A dynamic supply chain capability framework benchmarked against CIPS/APICS/ASCM standards; gap assessments run annually per role; analysis drives multi-year talent investment decisions at board level.',
        ],
        levelsAr: [
          'لا يوجد إطار كفاءات لأدوار سلسلة الإمداد. تستند قرارات التوظيف والتطوير إلى الحدس دون تقييم منظم للمهارات.',
          'توجد توصيفات وظيفية لأدوار سلسلة الإمداد لكن لم يُجرَ إطار كفاءات رسمي أو تصنيف مهارات أو تقييم لفجوة القدرات مطلقًا.',
          'يُعرَّف إطار كفاءات سلسلة الإمداد للأدوار الرئيسية؛ وأُجري تقييم للفجوة وتوجّه نتائجه أولويات التوظيف والتطوير.',
          'يغطي إطار الكفاءات جميع أدوار سلسلة الإمداد؛ وتوجّه تقييمات الفجوة السنوية خطط التطوير المستهدفة للأفراد والفرق.',
          'إطار قدرات سلسلة الإمداد الديناميكي مُقارَن معياريًا بمعايير CIPS/APICS/ASCM؛ وتُجرى تقييمات الفجوة سنويًا حسب الدور؛ ويوجّه التحليل قرارات الاستثمار في المواهب متعددة السنوات على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How structured and well-funded is your supply chain learning & development programme — covering professional certifications (CIPS/APICS), on-the-job development, and external benchmarking?',
        qAr: 'ما مدى تنظيم وتمويل برنامج التعلّم والتطوير في سلسلة الإمداد لديكم — بما يشمل الشهادات المهنية (CIPS/APICS) والتطوير أثناء العمل والمقارنة المعيارية الخارجية؟',
        levels: [
          'No formal supply chain training programme exists. Capability development is entirely ad-hoc and relies on self-initiative with no budget or structure.',
          'Some ad-hoc training occurs but there is no defined curriculum, no structured development plan, and no training budget specifically allocated for supply chain roles.',
          'A structured L&D programme with a defined supply chain curriculum, a training budget, and professional certification sponsorship (e.g. CIPS, APICS/ASCM) is in place for key roles.',
          'A comprehensive L&D programme covers all supply chain tiers with CIPS/APICS certification pathways, mentoring, job-rotation opportunities, and individual development plans tracked to completion.',
          'An industry-leading L&D programme delivers CIPS/APICS certification across all tiers, includes GCC-peer benchmarking visits, executive coaching, and supply chain innovation exposure; investment per head exceeds GCC peers.',
        ],
        levelsAr: [
          'لا يوجد برنامج تدريبي رسمي لسلسلة الإمداد. تطوير القدرات ارتجالي بالكامل ويعتمد على المبادرة الذاتية دون ميزانية أو هيكل.',
          'يحدث بعض التدريب الارتجالي لكن لا يوجد منهج محدد أو خطة تطوير منظمة أو ميزانية تدريب مخصصة تحديدًا لأدوار سلسلة الإمداد.',
          'يوجد برنامج L&D منظم بمنهج محدد لسلسلة الإمداد وميزانية تدريب ورعاية الشهادات المهنية (مثل CIPS وAPIC/ASCM) للأدوار الرئيسية.',
          'يغطي برنامج L&D شامل جميع مستويات سلسلة الإمداد بمسارات شهادات CIPS/APICS والإرشاد وفرص التناوب الوظيفي وخطط التطوير الفردية المتابَعة حتى الإكمال.',
          'يقدّم برنامج L&D رائد في الصناعة شهادات CIPS/APICS عبر جميع المستويات ويشمل زيارات المقارنة المعيارية مع النظراء في الخليج والتوجيه التنفيذي والتعرض لابتكارات سلسلة الإمداد؛ والاستثمار لكل موظف يتجاوز نظراء الخليج.',
        ],
      },
      {
        q: 'How mature is your supply chain succession planning — ensuring critical-role dependencies are mapped, successors are identified, and readiness is actively developed and reviewed?',
        qAr: 'ما مدى نضج التخطيط للخلافة في سلسلة الإمداد لديكم — مما يضمن رسم اعتماديات الأدوار الحرجة وتحديد الخلفاء وتطوير جاهزيتهم ومراجعتها بفاعلية؟',
        levels: [
          'No succession planning exists. The organisation is heavily dependent on a small number of key individuals with no documented handover or backup coverage.',
          'Key-person risks are informally acknowledged but no formal succession plans, cross-training, or knowledge-capture processes are in place.',
          'Succession plans exist for the most critical supply chain roles (CPO, supply chain director) with identified successors and basic development actions documented.',
          'Succession planning covers all manager-level supply chain roles; successors are identified, development plans are active, and annual talent reviews assess readiness.',
          'A fully developed succession pipeline covers all critical supply chain roles at every level; readiness assessments are conducted annually; the pipeline is reviewed by the board as a supply chain risk metric.',
        ],
        levelsAr: [
          'لا يوجد تخطيط للخلافة. تعتمد المؤسسة اعتمادًا كبيرًا على عدد قليل من الأفراد الرئيسيين دون وثائق تسليم أو تغطية احتياطية.',
          'تُدرَك مخاطر الاعتماد على أفراد رئيسيين بشكل غير رسمي لكن لا توجد خطط خلافة رسمية أو تدريب تبادلي أو عمليات التقاط المعرفة.',
          'توجد خطط خلافة للأدوار الأكثر حرجًا في سلسلة الإمداد (CPO، مدير سلسلة الإمداد) بخلفاء محددين وإجراءات تطوير أساسية موثّقة.',
          'يغطي التخطيط للخلافة جميع الأدوار الإدارية في سلسلة الإمداد؛ والخلفاء محدَّدون وخطط التطوير نشطة ومراجعات المواهب السنوية تقيّم الجاهزية.',
          'يغطي مسار خلافة متكامل جميع الأدوار الحرجة في سلسلة الإمداد على كل المستويات؛ وتُجرى تقييمات الجاهزية سنويًا؛ ويُراجَع المسار من مجلس الإدارة كمقياس لمخاطر سلسلة الإمداد.',
        ],
      },
      {
        q: 'How effectively does your supply chain function manage organisational change — including system implementations, process redesigns, and restructuring — through a structured change management methodology?',
        qAr: 'ما مدى فعالية إدارة وظيفة سلسلة الإمداد للتغيير التنظيمي — بما في ذلك تطبيقات الأنظمة وإعادة تصميم العمليات وإعادة الهيكلة — من خلال منهجية منظمة لإدارة التغيير؟',
        levels: [
          'Change management is not practised. System and process changes are imposed without communication plans, training programmes, or adoption tracking.',
          'Some communication about changes is provided before major implementations but there is no structured change management methodology, stakeholder mapping, or adoption measurement.',
          'A defined change management approach (communication plan, training, key-user network) is applied to major supply chain programmes with adoption tracked.',
          'A structured change management methodology (ADKAR, Prosci, or equivalent) is consistently applied to all significant supply chain transformations, with adoption and behaviour-change metrics tracked.',
          'Change management excellence is a core supply chain capability; dedicated change management resource is embedded in transformation programmes; post-implementation adoption reviews drive continuous improvement of the methodology.',
        ],
        levelsAr: [
          'لا تُمارَس إدارة التغيير. تُفرَض تغييرات الأنظمة والعمليات دون خطط تواصل أو برامج تدريب أو تتبّع للتبني.',
          'يُقدَّم بعض التواصل حول التغييرات قبل التطبيقات الكبرى لكن لا توجد منهجية منظمة لإدارة التغيير أو رسم أصحاب المصلحة أو قياس للتبني.',
          'يُطبَّق نهج محدد لإدارة التغيير (خطة تواصل، تدريب، شبكة مستخدمين رئيسيين) على البرامج الكبرى في سلسلة الإمداد مع تتبّع التبني.',
          'تُطبَّق منهجية منظمة لإدارة التغيير (ADKAR أو Prosci أو ما يعادلها) باتساق على جميع التحولات الجوهرية في سلسلة الإمداد، مع تتبّع مقاييس التبني وتغيير السلوك.',
          'التميّز في إدارة التغيير قدرة جوهرية في سلسلة الإمداد؛ وموارد إدارة التغيير المتخصصة مضمّنة في برامج التحول؛ ومراجعات التبني بعد التطبيق تقود التحسين المستمر للمنهجية.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Define clear supply chain roles and reporting lines. Map key-person dependencies immediately and document minimum handover procedures for the top 3 critical roles.',
      Aware:     'Develop a basic supply chain competency framework. Identify two or three high-potential individuals for structured development and budget for CIPS or APICS/ASCM enrolment.',
      Defined:   'Launch a formal succession planning process for all manager-level roles. Introduce an annual capability gap assessment and link findings to individual development plans.',
      Managed:   'Deploy a structured change management methodology (Prosci ADKAR) for all major transformation programmes. Expand CIPS/APICS certification to all supply chain tiers.',
      Optimised: 'Benchmark your supply chain talent model against GCC best practice. Invest in executive supply chain coaching and build a proprietary capability academy as a talent differentiator.',
    },
    recommendationsAr: {
      Reactive:  'تعريف أدوار وخطوط إبلاغ واضحة في سلسلة الإمداد. رسم اعتماديات الأفراد الرئيسيين فورًا وتوثيق الحد الأدنى من إجراءات التسليم لأعلى 3 أدوار حرجة.',
      Aware:     'تطوير إطار كفاءات أساسي لسلسلة الإمداد. تحديد اثنين أو ثلاثة من ذوي الإمكانات العالية لتطوير منظم وتخصيص ميزانية لالتحاق بـ CIPS أو APICS/ASCM.',
      Defined:   'إطلاق عملية رسمية للتخطيط للخلافة لجميع الأدوار الإدارية. إدخال تقييم سنوي لفجوة القدرات وربط النتائج بخطط التطوير الفردية.',
      Managed:   'نشر منهجية منظمة لإدارة التغيير (Prosci ADKAR) لجميع برامج التحول الكبرى. توسيع شهادات CIPS/APICS لتشمل جميع مستويات سلسلة الإمداد.',
      Optimised: 'المقارنة المعيارية لنموذج مواهب سلسلة الإمداد مع أفضل الممارسات في الخليج. الاستثمار في التوجيه التنفيذي لسلسلة الإمداد وبناء أكاديمية قدرات خاصة كميّزة تنافسية في المواهب.',
    },
    subSegments: ORG_TALENT_SUB_SEGMENTS as unknown as SubSegment[],
  },
  /* ── MODULE: Quality Management & Continuous Improvement ─────────────── */
  {
    id: 'quality_ci',
    title: 'Quality Management & Continuous Improvement',
    titleAr: 'إدارة الجودة والتحسين المستمر',
    shortTitle: 'Quality & CI',
    shortTitleAr: 'الجودة والتحسين',
    icon: BadgeCheck,
    color: '#0F766E',
    benchmarks: { gcc: 2.1, global: 2.6, best: 4.4 },
    frameworks: ['ISO 9001', 'Six Sigma', 'Lean/TPS'],
    questions: [
      {
        q: 'Does the organization maintain a documented quality policy with strategic quality objectives that are genuinely integrated into overall business strategy, rather than existing as a standalone QA-department document?',
        qAr: 'هل تحتفظ المؤسسة بسياسة جودة موثقة وأهداف جودة استراتيجية مندمجة فعلياً في الاستراتيجية العامة للأعمال، بدلاً من كونها وثيقة معزولة تخص إدارة الجودة فقط؟',
        levels: [
          'No documented quality policy exists, and quality is never referenced in strategic planning discussions.',
          'A quality policy exists on paper but is generic or copied from a template, disconnected from actual business objectives.',
          'A quality policy with defined objectives exists and is reviewed periodically, but integration with the overall business strategy is inconsistent across functions.',
          'Quality policy and objectives are formally integrated into the strategic plan, with defined KPIs, timelines, and accountable owners.',
          'Quality strategy is fully embedded in enterprise strategy, cascaded to all business units, reviewed at executive/board level, and explicitly linked to competitive positioning and customer value.',
        ],
        levelsAr: [
          'لا توجد سياسة جودة موثقة، ولا يُشار إلى الجودة إطلاقاً في مناقشات التخطيط الاستراتيجي.',
          'توجد سياسة جودة على الورق لكنها عامة أو منسوخة من نموذج جاهز، ومنفصلة عن أهداف العمل الفعلية.',
          'توجد سياسة جودة بأهداف محددة تُراجَع دورياً، لكن اندماجها مع الاستراتيجية العامة للأعمال متفاوت بين الوظائف المختلفة.',
          'تُدمج سياسة وأهداف الجودة رسمياً ضمن الخطة الاستراتيجية، مع مؤشرات أداء رئيسية وجداول زمنية ومسؤولين محددين.',
          'تُدمج استراتيجية الجودة بالكامل ضمن استراتيجية المؤسسة، وتُنقل إلى جميع وحدات الأعمال، وتُراجَع على مستوى الإدارة التنفيذية/مجلس الإدارة، وترتبط صراحة بالموقع التنافسي وقيمة العميل.',
        ],
      },
      {
        q: 'Does the organization have an enterprise-wide Lean/Six Sigma deployment strategy sponsored at executive/board level, as opposed to isolated departmental pilots?',
        qAr: 'هل تمتلك المؤسسة استراتيجية نشر للتصنيع الرشيق/ستة سيجما على مستوى المؤسسة بأكملها وبرعاية تنفيذية/مجلس إدارة، بدلاً من مشاريع تجريبية معزولة على مستوى الأقسام؟',
        levels: [
          'No Lean or Six Sigma activity exists anywhere in the organization.',
          'Isolated Lean/Six Sigma pilots have been attempted in one department, with no enterprise strategy or executive sponsorship.',
          'A documented deployment strategy exists and covers more than one function, but executive sponsorship is nominal rather than active.',
          'An enterprise-wide deployment strategy is actively sponsored by executives, with defined targets, resourcing, and a multi-year roadmap.',
          'Lean/Six Sigma deployment is a board-level strategic pillar, integrated into the operating model across all functions, with sponsorship that survives leadership transitions.',
        ],
        levelsAr: [
          'لا يوجد أي نشاط للتصنيع الرشيق أو ستة سيجما في أي جزء من المؤسسة.',
          'جرت محاولات تجريبية معزولة للتصنيع الرشيق/ستة سيجما في قسم واحد، دون استراتيجية مؤسسية أو رعاية تنفيذية.',
          'توجد استراتيجية نشر موثقة تغطي أكثر من وظيفة واحدة، لكن الرعاية التنفيذية شكلية وليست فعّالة.',
          'تُدعم استراتيجية النشر على مستوى المؤسسة بشكل فعّال من قبل الإدارة التنفيذية، بأهداف محددة وموارد وخارطة طريق متعددة السنوات.',
          'يشكّل نشر التصنيع الرشيق/ستة سيجما ركيزة استراتيجية على مستوى مجلس الإدارة، ومندمجاً في نموذج التشغيل عبر جميع الوظائف، وتستمر رعايته حتى مع تغيّر القيادات.',
        ],
      },
      {
        q: 'Is cost of poor quality (COPQ) formally measured, tracked, and reported to leadership as a strategic metric, rather than being an anecdotal or "felt sense" issue?',
        qAr: 'هل تُقاس تكلفة الجودة الرديئة (COPQ) وتُتابَع وتُرفَع تقاريرها إلى الإدارة العليا كمؤشر استراتيجي رسمي، بدلاً من كونها قضية تُستشعر بشكل غير موثق؟',
        levels: [
          'COPQ is never measured; quality-related losses are invisible to leadership.',
          'COPQ is discussed anecdotally ("we know rework is expensive") but never quantified or reported.',
          'COPQ is measured for some categories (e.g., scrap, warranty claims) but not comprehensively across prevention/appraisal/failure costs.',
          'COPQ is comprehensively measured across all major categories and reported to leadership on a regular cadence with trend analysis.',
          'COPQ is a standing board-level metric, benchmarked against external research (industry averages of roughly 15–20% of sales, with world-class organizations below 5%), and directly informs investment and pricing decisions.',
        ],
        levelsAr: [
          'لا تُقاس تكلفة الجودة الرديئة إطلاقاً؛ وتكون الخسائر المرتبطة بالجودة غير مرئية للإدارة العليا.',
          'تُناقَش تكلفة الجودة الرديئة بشكل غير موثق ("نعلم أن إعادة العمل مكلفة") لكن دون قياسها أو رفع تقاريرها.',
          'تُقاس تكلفة الجودة الرديئة لبعض الفئات (كالهالك ومطالبات الضمان) لكن دون شمولية عبر تكاليف الوقاية والتقييم والفشل.',
          'تُقاس تكلفة الجودة الرديئة بشكل شامل عبر جميع الفئات الرئيسية وتُرفَع تقاريرها للإدارة العليا بوتيرة منتظمة مع تحليل الاتجاهات.',
          'تكون تكلفة الجودة الرديئة مؤشراً ثابتاً على مستوى مجلس الإدارة، ويُقارَن بأبحاث خارجية (متوسطات صناعية تتراوح بين 15-20% من المبيعات، فيما تحافظ المؤسسات الرائدة عالمياً على مستوى أقل من 5%)، ويُوجّه مباشرة قرارات الاستثمار والتسعير.',
        ],
      },
      {
        q: 'Is continuous improvement recognized and resourced by executive leadership as a strategic priority — with dedicated budget, headcount, and visible sponsorship — rather than an unfunded aspiration?',
        qAr: 'هل يُعترَف بالتحسين المستمر ويُخصَّص له الدعم من الإدارة التنفيذية كأولوية استراتيجية — بميزانية وكوادر ورعاية واضحة — بدلاً من كونه طموحاً غير مموَّل؟',
        levels: [
          'Continuous improvement is not recognized as a priority; there is no budget, headcount, or executive attention allocated to it.',
          'CI is mentioned in aspirational statements but receives negligible resourcing and no defined ownership.',
          'CI has a small dedicated budget and team, but resourcing is vulnerable to being cut during downturns.',
          'CI is resourced as a durable strategic function with a protected budget, dedicated headcount, and visible executive sponsorship.',
          'CI investment is treated as core infrastructure, scaling with the organization\'s growth, with executives publicly and consistently championing it as a defining element of the company\'s identity.',
        ],
        levelsAr: [
          'لا يُعترَف بالتحسين المستمر كأولوية؛ ولا تُخصَّص له أي ميزانية أو كوادر أو اهتمام تنفيذي.',
          'يُذكَر التحسين المستمر في تصريحات طموحة لكنه يحصل على موارد ضئيلة ودون ملكية محددة.',
          'يمتلك التحسين المستمر ميزانية وفريقاً مخصصاً صغيراً، لكن هذه الموارد عرضة للتخفيض خلال فترات التراجع.',
          'يُموَّل التحسين المستمر كوظيفة استراتيجية مستدامة بميزانية محمية وكوادر مخصصة ورعاية تنفيذية واضحة.',
          'يُعامَل الاستثمار في التحسين المستمر كبنية تحتية أساسية، تتوسع مع نمو المؤسسة، وتروّج له الإدارة التنفيذية علناً وباستمرار كعنصر مُعرِّف لهوية الشركة.',
        ],
      },
      {
        q: 'How mature is your end-to-end supply chain traceability — the ability to track a lot/batch/serial number forward from raw material through production and distribution to the point of sale, and backward from a finished-goods issue to the originating material lot?',
        qAr: 'ما مدى نضج تتبّع سلسلة الإمداد الشاملة لديكم — القدرة على تتبّع رقم الدفعة/التشغيلة/المسلسل تصاعدياً من المادة الخام عبر الإنتاج والتوزيع حتى نقطة البيع، وتنازلياً من مشكلة في المنتج النهائي إلى دفعة المادة الأصلية؟',
        levels: [
          'No lot/batch traceability exists. If a quality issue arose, there would be no reliable way to identify which other products or customers were affected.',
          'Basic lot records exist at the production stage only; forward traceability to customer/distribution and backward traceability to raw material are both manual and unreliable.',
          'One-up-one-back traceability is documented at each stage (supplier to receiving, production to shipment), meeting a basic regulatory standard, though full end-to-end trace requires manual reconciliation across systems.',
          'A digital traceability system links lot data across production, warehousing, and distribution in one platform, enabling an end-to-end trace to be assembled within hours rather than days.',
          'Real-time, system-integrated traceability spans the full network from multi-tier suppliers through to the end customer; a full forward-and-backward trace can be generated in minutes and is tested regularly as part of recall readiness.',
        ],
        levelsAr: [
          'لا يوجد تتبّع للدفعات/التشغيلات. إذا نشأت مشكلة جودة، فلا توجد طريقة موثوقة لتحديد المنتجات أو العملاء الآخرين المتأثرين.',
          'توجد سجلات دفعات أساسية عند مرحلة الإنتاج فقط؛ والتتبّع التصاعدي للعميل/التوزيع والتنازلي للمادة الخام كلاهما يدوي وغير موثوق.',
          'يُوثَّق التتبّع "خطوة للأمام وخطوة للخلف" في كل مرحلة (المورد إلى الاستلام والإنتاج إلى الشحن)، بما يلبي معياراً تنظيمياً أساسياً، رغم أن التتبّع الشامل من طرف لطرف يتطلب مطابقة يدوية عبر الأنظمة.',
          'نظام تتبّع رقمي يربط بيانات الدفعات عبر الإنتاج والتخزين والتوزيع في منصة واحدة، مما يُتيح تجميع تتبّع شامل من طرف لطرف خلال ساعات بدلاً من أيام.',
          'تتبّع آني متكامل مع الأنظمة يمتد عبر الشبكة الكاملة من الموردين متعددي المستويات حتى العميل النهائي؛ ويمكن توليد تتبّع تصاعدي وتنازلي كامل خلال دقائق ويُختبَر بانتظام كجزء من جاهزية الاستدعاء.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Establish a documented quality policy and pursue ISO 9001 certification for your core operations. Begin tracking cost of poor quality (COPQ) as a first step toward CAPA discipline.',
      Aware:  'Build a structured internal audit programme aligned to ISO 19011 and formalise a CAPA process with root-cause tools (5-Why, 8D). Launch a pilot Lean/Six Sigma project with executive sponsorship.',
      Defined:  'Digitise your QMS through a dedicated e-QMS platform and formalise a belt-based Lean/Six Sigma programme with a tracked project pipeline. Extend traceability beyond Tier-1 suppliers and run your first mock recall.',
      Managed:  'Embed continuous improvement as a distributed capability with active employee suggestion systems and cross-functional Kaizen cadence. Achieve consistent multi-site certification scope and closure-velocity targets for CAPA.',
      Optimised: 'Lead GCC best practice in enterprise quality governance — publish COPQ trends, sustain sub-4-hour trace times, and treat quality and CI maturity as board-level, externally benchmarked capabilities integrated into corporate strategy.',
    },
    recommendationsAr: {
      Reactive:  'إرساء سياسة جودة موثقة والسعي لاعتماد الأيزو 9001 لعملياتكم الأساسية. البدء بتتبّع تكلفة الجودة الرديئة (COPQ) كخطوة أولى نحو انضباط CAPA.',
      Aware:  'بناء برنامج تدقيق داخلي منظم متوافق مع الأيزو 19011 وإضفاء الطابع الرسمي على عملية CAPA بأدوات تحديد السبب الجذري (لماذا الخماسي و8D). إطلاق مشروع تجريبي للتصنيع الرشيق/ستة سيجما برعاية تنفيذية.',
      Defined:  'رقمنة نظام إدارة الجودة عبر منصة e-QMS مخصصة وإضفاء الطابع الرسمي على برنامج أحزمة للتصنيع الرشيق/ستة سيجما بخط أنابيب مشاريع متابَع. توسيع التتبّع لما بعد موردي المستوى الأول وإجراء أول استدعاء تجريبي.',
      Managed:  'ترسيخ التحسين المستمر كقدرة موزّعة بأنظمة اقتراحات موظفين نشطة ووتيرة كايزن متعددة الوظائف. تحقيق نطاق اعتماد متسق متعدد المواقع ومستهدفات سرعة إغلاق لـ CAPA.',
      Optimised: 'قيادة أفضل الممارسات الخليجية في حوكمة الجودة المؤسسية — نشر اتجاهات COPQ والحفاظ على أوقات تتبّع أقل من 4 ساعات ومعاملة نضج الجودة والتحسين المستمر كقدرات على مستوى مجلس الإدارة مُقارَنة معياريًا خارجيًا ومدمجة في الاستراتيجية المؤسسية.',
    },
    subSegments: QUALITY_SUB_SEGMENTS as unknown as SubSegment[],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   INDUSTRY MODULES — conditional segments (1 per respondent, if applicable)
═══════════════════════════════════════════════════════════════════════════ */

export const INDUSTRY_MODULES: Segment[] = [

  /* ── MODULE A: Manufacturing & Production Operations ─────────────────── */
  {
    id: 'mfg_ops',
    title: 'Manufacturing & Production Operations',
    titleAr: 'التصنيع وعمليات الإنتاج',
    shortTitle: 'Manufacturing',
    shortTitleAr: 'التصنيع',
    icon: Factory,
    color: '#B45309',
    benchmarks: { gcc: 2.4, global: 3.0, best: 4.5 },
    moduleFor: ['manufacturing', 'pharma', 'fmcg', 'construction'],
    frameworks: ['ISO 9001', 'IATF 16949', 'OEE', 'TPM'],
    questions: [
      {
        q: 'How mature is your production planning and scheduling — in terms of Master Production Schedule (MPS) accuracy, capacity planning, and schedule adherence?',
        qAr: 'ما مدى نضج تخطيط الإنتاج وجدولته — من حيث دقة خطة الإنتاج الرئيسية (MPS) وتخطيط الطاقة والالتزام بالجدول الزمني؟',
        levels: [
          'Production planning is reactive and ad-hoc. There is no master production schedule; work is scheduled informally based on immediate orders with no capacity visibility.',
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
      {
        q: 'How effectively is production quality controlled — including in-process inspection, First Pass Yield (FPY) measurement, defect root-cause analysis, and supplier quality linkage?',
        qAr: 'ما مدى فعالية ضبط جودة الإنتاج — بما في ذلك الفحص أثناء العملية وقياس معدل النجاح من أول مرور (FPY) وتحليل السبب الجذري للعيوب وربط جودة الموردين؟',
        levels: [
          'Quality inspection is informal and end-of-line only. First Pass Yield and defect rates are not measured and quality feedback to suppliers is absent.',
          'Basic quality checks exist at key production stages but FPY and defect rates are tracked inconsistently; no structured root-cause analysis process exists.',
          'In-process quality control is formalised with defined inspection points; FPY is tracked by line/product and defect data is reviewed monthly with corrective actions assigned.',
          'Statistical Process Control (SPC) is applied to critical processes; FPY targets are set by product, supplier quality defects are tracked separately, and quality trends are reported to management.',
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
      {
        q: 'How well do you measure and manage Overall Equipment Effectiveness (OEE) — and how systematically are availability, performance, and quality losses analysed and reduced?',
        qAr: 'ما مدى جودة قياسكم وإدارتكم للفعالية الكلية للمعدات (OEE) — وما مدى منهجية تحليل وتقليص خسائر التوافر والأداء والجودة؟',
        levels: [
          'OEE is not measured. Downtime, speed losses, and quality rejects are not tracked systematically and maintenance is break-fix only.',
          'Availability (downtime) is tracked informally for critical equipment but performance and quality losses are not measured; OEE is not reported.',
          'OEE is calculated monthly for key production assets; the three OEE components are tracked and losses reviewed in monthly operations reviews.',
          'OEE is tracked daily for all significant production assets; loss-tree analysis identifies root causes by category; improvement projects target dominant loss sources.',
          'OEE ≥75% is sustained across key assets with real-time monitoring; TPM (Total Productive Maintenance) is embedded; OEE trends are reviewed at executive level and linked to capex decisions.',
        ],
        levelsAr: [
          'لا تُقاس OEE. وقت التوقف وخسائر السرعة ورفض الجودة لا تُتابَع بشكل منهجي والصيانة إصلاحية فقط عند العطل.',
          'يُتابَع التوافر (وقت التوقف) بشكل غير رسمي للمعدات الحرجة لكن خسائر الأداء والجودة لا تُقاس؛ ولا تُرفَع تقارير OEE.',
          'تُحسَب OEE شهريًا للأصول الإنتاجية الرئيسية؛ وتُتابَع المكوّنات الثلاثة وتُراجَع الخسائر في مراجعات العمليات الشهرية.',
          'تُتابَع OEE يوميًا لجميع الأصول الإنتاجية الجوهرية؛ ويُحدّد تحليل شجرة الخسائر الأسباب الجذرية حسب الفئة؛ ومشاريع التحسين تستهدف مصادر الخسائر السائدة.',
          'تُحافَظ على OEE ≥75% عبر الأصول الرئيسية بمراقبة آنية؛ والصيانة الإنتاجية الشاملة (TPM) متجذّرة؛ وتُراجَع اتجاهات OEE على المستوى التنفيذي وتُربَط بقرارات النفقات الرأسمالية.',
        ],
      },
      {
        q: 'How accurately is your Bill of Materials (BOM) maintained — and how effectively is engineering change management controlled to prevent production disruptions?',
        qAr: 'ما مدى دقة الحفاظ على قائمة مكوّنات المواد (BOM) لديكم — وما مدى فعالية ضبط إدارة التغييرات الهندسية لمنع اضطرابات الإنتاج؟',
        levels: [
          'BOMs are incomplete, inaccurate, or outdated. Engineering changes are implemented informally, often causing material shortages or over-purchasing.',
          'BOMs exist in the ERP for most products but accuracy is not regularly validated; engineering change management is informal and errors frequently cause material issues.',
          'BOM accuracy is reviewed annually; an engineering change management (ECN) process defines authorisation, communication, and effective date management for all changes.',
          'BOM accuracy ≥95% is measured quarterly; ECN process integrates with procurement to pre-clear material changes before production impact.',
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
      {
        q: 'How rigorously do you analyse make-or-buy decisions and govern outsourcing relationships — ensuring strategic alignment, quality control, and cost competitiveness?',
        qAr: 'ما مدى صرامة تحليلكم لقرارات التصنيع أو الشراء وحوكمة علاقات الاستعانة بمصادر خارجية — مما يضمن المواءمة الاستراتيجية وضبط الجودة والتنافسية التكليفية؟',
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
          'يُطبّق إطار التصنيع أو الشراء معايير محددة (التكلفة، الجودة، مخاطر الملكية الفكرية، الملاءمة الاستراتيجية) على قرارات الاستعانة الجوهرية؛ والنتائج موثّقة وتُراجَع.',
          'يستخدم تحليل التصنيع أو الشراء نمذجة TCO الكاملة وتقييم المخاطر الاستراتيجية؛ وعلاقات الاستعانة الكبرى تُحكَم باتفاقيات مستوى خدمة وتدقيق جودة ومراجعات أداء منتظمة.',
          'استراتيجية التصنيع أو الشراء قرار على مستوى مجلس الإدارة مواءَم مع استراتيجية سلسلة الإمداد الكلية؛ وجميع الاستعانة الجوهرية تُحكَم باتفاقيات مستوى خدمة ومقارنة معيارية لـ TCO وتدقيق جودة وبرامج تطوير الموردين.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Formalise your production schedule with a basic MPS linked to the S&OP cycle. Implement FPY measurement on all production lines and define a minimum BOM accuracy standard.',
      Aware:     'Deploy SPC on critical production processes. Build an ECN governance process and establish a make-or-buy framework for your top 10 outsourced components.',
      Defined:   'Implement OEE tracking for all key assets. Achieve BOM accuracy ≥95% and launch a TPM programme for your most critical production equipment.',
      Managed:   'Deploy APS for constraint-based scheduling and achieve schedule adherence ≥90%. Integrate supplier quality data into your SRM platform and track CoQ as a leadership KPI.',
      Optimised: 'Drive OEE ≥80% with AI-assisted TPM. Deploy Six Sigma programmes across key processes and build a digital manufacturing intelligence platform for real-time visibility.',
    },
    recommendationsAr: {
      Reactive:  'إضفاء الطابع الرسمي على جدول الإنتاج بخطة إنتاج رئيسية أساسية مرتبطة بدورة S&OP. تطبيق قياس FPY على جميع خطوط الإنتاج وتحديد معيار أدنى لدقة BOM.',
      Aware:     'نشر SPC على العمليات الإنتاجية الحرجة. بناء عملية حوكمة ECN وإرساء إطار التصنيع أو الشراء لأعلى 10 مكوّنات مُستعان في تصنيعها بمصادر خارجية.',
      Defined:   'تطبيق تتبّع OEE لجميع الأصول الرئيسية. تحقيق دقة BOM ≥95% وإطلاق برنامج TPM لأهم معدات الإنتاج الحرجة.',
      Managed:   'نشر APS للجدولة القائمة على القيود وتحقيق الالتزام بالجدول ≥90%. دمج بيانات جودة الموردين في منصة SRM ومتابعة CoQ كمؤشر قيادي.',
      Optimised: 'قيادة OEE ≥80% بـ TPM مدعومة بالذكاء الاصطناعي. نشر برامج Six Sigma عبر العمليات الرئيسية وبناء منصة ذكاء تصنيعي رقمي للرؤية الآنية.',
    },
    subSegments: MFG_OPS_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── MODULE B: Fleet, Port & Distribution Operations ────────────────── */
  {
    id: 'fleet_ops',
    title: 'Fleet, Port & Distribution Operations',
    titleAr: 'الأسطول والموانئ وعمليات التوزيع',
    shortTitle: 'Fleet & Ports',
    shortTitleAr: 'الأسطول والموانئ',
    icon: Ship,
    color: '#0369A1',
    benchmarks: { gcc: 2.3, global: 2.9, best: 4.4 },
    moduleFor: ['logistics', 'marine'],
    frameworks: ['IATA', 'FIATA', 'ISO 28001'],
    questions: [
      {
        q: 'How effectively is your fleet managed — in terms of utilisation, route efficiency, maintenance scheduling, cost-per-km tracking, and driver performance management?',
        qAr: 'ما مدى فعالية إدارة أسطولكم — من حيث معدل الاستخدام وكفاءة المسار وجدولة الصيانة وتتبّع التكلفة لكل كيلومتر وإدارة أداء السائقين؟',
        levels: [
          'Fleet management is reactive. No utilisation KPIs, route planning tools, cost-per-km tracking, or maintenance scheduling exists; maintenance is break-fix only.',
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
      {
        q: 'How efficiently are your port or hub operations managed — in terms of berth utilisation, dwell time, cargo handling rates, and turnaround time benchmarking?',
        qAr: 'ما مدى كفاءة إدارة عمليات الموانئ أو المراكز لديكم — من حيث استخدام الأرصفة وزمن الإقامة ومعدلات معالجة البضائع ومقارنة أوقات التحوّل المعيارية؟',
        levels: [
          'Port/hub operations are not formally measured beyond invoice reconciliation. Dwell time, berth utilisation, and handling rates are unknown.',
          'Basic operational metrics (vessel/truck turnaround) are tracked informally; significant idle time and congestion occur without systematic analysis or corrective action.',
          'Key port KPIs (dwell time, berth utilisation, crane/handling rate) are tracked monthly and reviewed with terminal operators; targets are defined.',
          'Port KPIs are tracked in near-real-time; dwell time and turnaround are benchmarked against regional peers; congestion and demurrage are systematically managed and costs reported.',
          'AI-driven port operations management optimises berth scheduling, crane allocation, and yard planning in real-time; dwell time and handling rates exceed GCC benchmarks; reviewed at board level.',
        ],
        levelsAr: [
          'عمليات الميناء/المركز لا تُقاس رسميًا فيما يتجاوز مطابقة الفواتير. وقت الإقامة واستخدام الأرصفة ومعدلات المناولة مجهولة.',
          'تُتابَع مقاييس التشغيل الأساسية (دوران السفن/الشاحنات) بشكل غير رسمي؛ ووقت الخمول والازدحام ملحوظان دون تحليل منهجي أو إجراء تصحيحي.',
          'تُتابَع مؤشرات الميناء الرئيسية (وقت الإقامة، استخدام الرصيف، معدل الرافعات/المناولة) شهريًا وتُراجَع مع مشغّلي المحطة؛ والمستهدفات محددة.',
          'تُتابَع مؤشرات الميناء في شبه الوقت الحقيقي؛ ووقت الإقامة والدوران يُقارَنان معياريًا بنظراء إقليميين؛ والازدحام والإقامة يُدارَان بشكل منهجي.',
          'يُحسّن تشغيل الميناء المدفوع بالذكاء الاصطناعي جدولة الأرصفة وتخصيص الرافعات وتخطيط الساحة آنيًا؛ وزمن الإقامة ومعدلات المناولة تتجاوز معايير الخليج؛ وتُراجَع على مستوى مجلس الإدارة.',
        ],
      },
      {
        q: 'How effectively do you manage dangerous goods (DG), hazardous materials, or temperature-sensitive cargo — in terms of regulatory compliance, staff certification, and incident prevention?',
        qAr: 'ما مدى فعالية إدارتكم للبضائع الخطرة (DG) أو المواد الخطرة أو البضائع الحساسة للحرارة — من حيث الامتثال التنظيمي وشهادات الموظفين والوقاية من الحوادث؟',
        levels: [
          'DG/hazmat compliance is not formally managed. Handling, labelling, and documentation are based on operator knowledge with no formal programme or training.',
          'Basic DG procedures exist but are not consistently followed, staff training is sporadic, and compliance audits are not conducted.',
          'A formal DG/hazmat management programme includes IMDG/IATA/ADR compliance procedures, trained staff, and annual compliance audits.',
          'DG compliance is managed systematically; staff are certified (IMDG/IATA Level 1+), incident tracking is maintained, and non-conformances are root-cause analysed.',
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
      {
        q: 'How effectively is your intermodal and multimodal integration managed — enabling seamless cargo transfer between sea, road, rail, and air modes with minimal handoff delays?',
        qAr: 'ما مدى فعالية إدارة تكاملكم متعدد الوسائط — مما يُتيح نقلاً سلسًا للبضائع بين وسائل البحر والطريق والسكة الحديد والجو بأدنى تأخيرات عند نقاط التسليم؟',
        levels: [
          'Intermodal coordination is ad-hoc. Mode changes involve significant manual effort, data re-entry, and frequent delays at handoff points.',
          'Some coordination procedures exist for common intermodal routes but handoff documentation is manual and delays are frequent.',
          'Defined intermodal processes and documentation standards reduce handoff delays; key intermodal corridors have SLAs with modal operators.',
          'An intermodal visibility platform tracks cargo across all modes in near-real-time; exception alerts flag at-risk handoffs; transit time KPIs are tracked by corridor.',
          'A fully integrated intermodal visibility platform provides real-time cargo tracking across all modes; predictive ETAs shared with customers; handoff delays near-zero on managed corridors.',
        ],
        levelsAr: [
          'التنسيق متعدد الوسائط ارتجالي. تتضمّن تغييرات الوسيلة جهدًا يدويًا كبيرًا وإعادة إدخال بيانات وتأخيرات متكررة عند نقاط التسليم.',
          'توجد بعض إجراءات التنسيق للمسارات متعددة الوسائط الشائعة لكن وثائق التسليم يدوية والتأخيرات متكررة.',
          'تُقلّص عمليات متعددة الوسائط المحددة ومعايير التوثيق تأخيرات التسليم؛ والممرات الرئيسية متعددة الوسائط لها اتفاقيات مستوى خدمة مع مشغّلي الوسائط.',
          'تتتبّع منصة رؤية متعددة الوسائط البضائع عبر جميع الوسائط في شبه الوقت الحقيقي؛ وتنبيهات الاستثناءات تُبلّغ عن التسليمات المعرّضة للخطر؛ ومؤشرات زمن العبور تُتابَع حسب الممر.',
          'منصة رؤية متعددة الوسائط متكاملة بالكامل توفر تتبّعًا آنيًا عبر جميع الوسائط؛ وأوقات الوصول التنبؤية تُشارَك مع العملاء؛ وتأخيرات التسليم شبه معدومة على الممرات المُدارة.',
        ],
      },
      {
        q: 'How mature is your last-mile and urban delivery management — in terms of route density optimisation, first-attempt delivery rate, customer communication, and sustainability of delivery options?',
        qAr: 'ما مدى نضج إدارة التوصيل للميل الأخير والتوصيل الحضري لديكم — من حيث تحسين كثافة المسار ومعدل التسليم من أول محاولة وتواصل العملاء واستدامة خيارات التوصيل؟',
        levels: [
          'Last-mile delivery is outsourced entirely with no performance tracking. Customer delivery issues are handled reactively with no SLA.',
          'Basic delivery success rates are tracked for major routes but no route density analysis, customer pre-notification, or sustainability considerations are applied.',
          'Last-mile KPIs (delivery success rate, customer satisfaction) are tracked; route density analysis is conducted periodically; customers are notified of major delays.',
          'Last-mile route optimisation tools improve density; first-attempt delivery rate ≥90%; real-time customer tracking is available; delivery failure root causes are analysed.',
          'AI-optimised last-mile routing achieves ≥97% first-attempt delivery; real-time customer tracking with dynamic rescheduling; sustainable delivery options (EV, consolidation points) are deployed and tracked.',
        ],
        levelsAr: [
          'التوصيل للميل الأخير مُعهَد به خارجيًا بالكامل دون متابعة أداء. مشكلات توصيل العملاء تُعالَج بشكل تفاعلي دون اتفاقية مستوى خدمة.',
          'تُتابَع معدلات نجاح التسليم الأساسية للمسارات الرئيسية لكن لا تحليل لكثافة المسار أو إخطار مسبق للعملاء أو اعتبارات استدامة.',
          'تُتابَع مؤشرات الميل الأخير (معدل نجاح التسليم، رضا العملاء)؛ ويُجرى تحليل كثافة المسار دوريًا؛ ويُخطَر العملاء بالتأخيرات الكبيرة.',
          'أدوات تحسين مسار الميل الأخير تُحسّن الكثافة؛ ومعدل التسليم من أول محاولة ≥90%؛ والتتبّع الآني للعملاء متاح؛ وأسباب فشل التسليم تُحلَّل.',
          'يحقق التوجيه المُحسَّن بالذكاء الاصطناعي للميل الأخير تسليمًا من أول محاولة ≥97%؛ وتتبّع آني للعملاء مع إعادة جدولة ديناميكية؛ وخيارات توصيل مستدامة (EV، نقاط توحيد) مُنشَأة ومتابَعة.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Establish basic fleet utilisation and cost-per-km KPIs. Define DG compliance procedures and begin measuring port/hub dwell time and turnaround against targets.',
      Aware:     'Deploy a TMS for route optimisation and real-time fleet tracking. Certify all DG-handling staff and establish intermodal SLAs for key corridors.',
      Defined:   'Implement predictive maintenance for critical fleet assets. Achieve first-attempt delivery rate ≥85% and establish demurrage tracking for all port operations.',
      Managed:   'Integrate multimodal visibility across all logistics modes. Deploy an AI-powered route optimisation engine and benchmark port KPIs against GCC regional leaders.',
      Optimised: 'Achieve zero-incident DG compliance and first-attempt delivery ≥97%. Implement sustainable last-mile options and build a digital twin for end-to-end logistics network optimisation.',
    },
    recommendationsAr: {
      Reactive:  'إرساء مؤشرات استخدام الأسطول وتكلفة/كم الأساسية. تعريف إجراءات الامتثال لـ DG والبدء بقياس وقت إقامة الميناء/المركز ودوران الأسطول مقابل المستهدفات.',
      Aware:     'نشر TMS لتحسين المسار والتتبّع الآني للأسطول. اعتماد جميع موظفي مناولة DG وإرساء اتفاقيات مستوى خدمة متعددة الوسائط للممرات الرئيسية.',
      Defined:   'تطبيق الصيانة التنبؤية لأصول الأسطول الحرجة. تحقيق معدل تسليم من أول محاولة ≥85% وإرساء تتبّع الإقامة لجميع عمليات الميناء.',
      Managed:   'دمج الرؤية متعددة الوسائط عبر جميع أوضاع اللوجستيات. نشر محرّك تحسين مسار مدفوع بالذكاء الاصطناعي ومقارنة مؤشرات الميناء معياريًا بالقادة الإقليميين في الخليج.',
      Optimised: 'تحقيق امتثال معدوم الحوادث لـ DG وتسليم من أول محاولة ≥97%. تطبيق خيارات الميل الأخير المستدامة وبناء توأم رقمي لتحسين شبكة اللوجستيات من طرف إلى طرف.',
    },
    subSegments: FLEET_OPS_SUB_SEGMENTS as unknown as SubSegment[],
  },

  /* ── MODULE C: Regulatory & Localisation Compliance ─────────────────── */
  {
    id: 'regulatory',
    title: 'Regulatory & Localisation Compliance (Saudi Arabia)',
    titleAr: 'الامتثال التنظيمي والتوطين (المملكة العربية السعودية)',
    shortTitle: 'Regulatory (KSA)',
    shortTitleAr: 'الامتثال التنظيمي (السعودية)',
    icon: Scale,
    color: '#1D4ED8',
    benchmarks: { gcc: 2.0, global: 2.5, best: 4.3 },
    moduleFor: ['government'],
    frameworks: ['Saudi Vision 2030', 'IKTVA', 'Nitaqat'],
    questions: [
      {
        q: 'How proactively does your organisation manage Saudi Nitaqat (Saudization) requirements — tracking localisation percentages by function, maintaining target status, and linking procurement hiring to workforce plans?',
        qAr: 'ما مدى استباقية مؤسستكم في إدارة متطلبات نطاقات (السعودة) — بتتبّع نسب التوطين حسب الوظيفة والحفاظ على حالة المستهدف وربط توظيف المشتريات بخطط القوى العاملة؟',
        levels: [
          'Nitaqat compliance is tracked reactively — only when an inspection or renewal is due. Current Saudization percentages for supply chain roles are unknown.',
          'Saudization percentages are tracked at company level but not broken down by supply chain function; hiring decisions are made without reference to localisation targets.',
          'Saudization targets for supply chain roles are monitored monthly; hiring plans incorporate localisation requirements and compliance status is reported to leadership.',
          'Saudization tracking is automated by department; supply chain hiring pipelines proactively manage Nitaqat targets; compliance is reviewed quarterly at executive level.',
          'Proactive Nitaqat management maintains premium/platinum status; a structured Saudi talent pipeline for supply chain is linked to Vision 2030 workforce plans; localisation is an executive scorecard KPI.',
        ],
        levelsAr: [
          'الامتثال لنطاقات يُتابَع بشكل تفاعلي — فقط عند حلول موعد التفتيش أو التجديد. نسب السعودة الحالية لأدوار سلسلة الإمداد مجهولة.',
          'تُتابَع نسب السعودة على مستوى الشركة لكن لا تُفصَّل حسب وظيفة سلسلة الإمداد؛ وتُتخذ قرارات التوظيف دون مرجعية لمستهدفات التوطين.',
          'تُراقَب مستهدفات السعودة لأدوار سلسلة الإمداد شهريًا؛ وتُدمَج خطط التوظيف متطلبات التوطين وتُرفَع حالة الامتثال للقيادة.',
          'تتبّع السعودة مؤتمت حسب الإدارة؛ وتُدير مسارات توظيف سلسلة الإمداد مستهدفات نطاقات استباقيًا؛ والامتثال يُراجَع فصليًا على المستوى التنفيذي.',
          'إدارة نطاقات الاستباقية تحافظ على الحالة المتميّزة/البلاتينية؛ ومسار مواهب سعودية منظم لسلسلة الإمداد مرتبط بخطط قوى العمل لرؤية 2030؛ والتوطين مؤشر في بطاقة الأداء التنفيذية.',
        ],
      },
      {
        q: 'How rigorously does your organisation track and maximise IKTVA (In-Kingdom Total Value Add) local content — with a proactive local supplier development programme and verified reporting?',
        qAr: 'ما مدى صرامة مؤسستكم في تتبّع وتعظيم المحتوى المحلي IKTVA (القيمة المضافة الإجمالية داخل المملكة) — ببرنامج استباقي لتطوير الموردين المحليين وتقارير موثّقة؟',
        levels: [
          'IKTVA is not tracked or reported. There is no understanding of the current local-content percentage or how procurement decisions affect it.',
          'IKTVA reporting is completed as a compliance exercise with minimal management attention; local content in procurement is not actively maximised.',
          'IKTVA compliance is tracked quarterly; a basic local-content analysis of procurement spend identifies the current percentage and main gaps.',
          'IKTVA is managed proactively; local suppliers are actively developed and preferred in sourcing decisions; local-content percentage is tracked and reported to leadership monthly.',
          'IKTVA is a strategic priority; a dedicated local supplier development programme increases local content year-on-year; IKTVA leadership is a competitive advantage in tender qualification.',
        ],
        levelsAr: [
          'IKTVA لا يُتتبَّع أو يُرفَع عنه. لا يوجد فهم لنسبة المحتوى المحلي الحالية أو كيفية تأثير قرارات الشراء عليها.',
          'يُنجَز إبلاغ IKTVA كتمرين امتثال باهتمام إداري ضئيل؛ والمحتوى المحلي في المشتريات لا يُعظَّم بفاعلية.',
          'يُتابَع الامتثال لـ IKTVA فصليًا؛ وتحليل أساسي للمحتوى المحلي في إنفاق المشتريات يُحدّد النسبة الحالية والفجوات الرئيسية.',
          'تُدار IKTVA استباقيًا؛ والموردون المحليون يُطوَّرون بفاعلية ويُفضَّلون في قرارات التوريد؛ ونسبة المحتوى المحلي تُتابَع وتُرفَع للقيادة شهريًا.',
          'IKTVA أولوية استراتيجية؛ وبرنامج متخصص لتطوير الموردين المحليين يزيد المحتوى المحلي سنة بعد سنة؛ وريادة IKTVA ميزة تنافسية في تأهيل المناقصات.',
        ],
      },
      {
        q: 'How comprehensively does your procurement function comply with the Government Tendering and Procurement Law (GTPL) — including tendering thresholds, documentation standards, and audit-ready award justifications?',
        qAr: 'ما مدى شمولية امتثال وظيفة المشتريات لديكم لنظام المنافسات والمشتريات الحكومية (GTPL) — بما في ذلك حدود المنافسة ومعايير الوثائق ومبررات ترسية قابلة للتدقيق؟',
        levels: [
          'GTPL compliance is not systematically managed. Procurement staff have limited knowledge of legal requirements and documentation is frequently incomplete.',
          'Basic GTPL awareness exists; major contracts are tendered but compliance is inconsistent, documentation is incomplete, and audit trails are insufficient.',
          'A GTPL compliance framework defines tendering thresholds, required documentation, and award justification requirements; staff are trained and audited annually.',
          'GTPL compliance is fully embedded; all transactions above threshold are tendered, fully documented, and reviewed by a compliance function; audit findings are near-zero.',
          'GTPL compliance excellence: zero material audit findings; procurement staff hold GTPL specialist certification; best-practice processes are benchmarked against leading government entities.',
        ],
        levelsAr: [
          'الامتثال لـ GTPL لا يُدار بشكل منهجي. معرفة موظفي المشتريات بالمتطلبات القانونية محدودة والوثائق ناقصة في أغلب الأحيان.',
          'يوجد وعي أساسي بـ GTPL؛ والعقود الكبرى تُناقَص لكن الامتثال غير متسق والوثائق غير مكتملة ومسارات التدقيق غير كافية.',
          'يُعرّف إطار الامتثال لـ GTPL حدود المنافسة ومتطلبات الوثائق ومتطلبات مبررات الترسية؛ والموظفون مدرَّبون ويخضعون للتدقيق سنويًا.',
          'الامتثال لـ GTPL مضمَّن بالكامل؛ وجميع المعاملات فوق الحد تُناقَص وتُوثَّق بالكامل وتُراجَع من دالة الامتثال؛ ونتائج التدقيق شبه معدومة.',
          'تميّز الامتثال لـ GTPL: نتائج تدقيق جوهرية معدومة؛ وموظفو المشتريات حاملو شهادات متخصصة في GTPL؛ وعمليات أفضل الممارسات تُقارَن معياريًا بالجهات الحكومية الرائدة.',
        ],
      },
      {
        q: 'How effectively does your organisation use the Monafasat/NCA procurement platform — including registration accuracy, bid quality, compliance with publication requirements, and use of platform analytics?',
        qAr: 'ما مدى فعالية استخدام مؤسستكم لمنصة منافسات/هيئة المنافسة — بما في ذلك دقة التسجيل وجودة العروض والامتثال لمتطلبات النشر واستخدام تحليلات المنصة؟',
        levels: [
          'Monafasat/NCA platform usage is minimal or inconsistent. Tender registrations and submissions frequently contain errors or omissions.',
          'Monafasat is used for mandatory tender publication but platform capabilities are not fully utilised; submission quality is inconsistent and errors are frequent.',
          'All required tenders are published on Monafasat with complete, accurate documentation; compliance is verified before every submission.',
          'Monafasat usage is fully optimised; all procurement above threshold is managed through the platform; platform analytics are used to benchmark against peer entities.',
          'Platform excellence: zero documentation errors, full utilisation of Monafasat analytics for peer benchmarking and improvement; proactive engagement with NCA; recognised as a leading procurement entity.',
        ],
        levelsAr: [
          'استخدام منصة منافسات/هيئة المنافسة ضئيل أو غير متسق. تسجيلات المناقصات وعمليات التقديم تحتوي على أخطاء أو إغفالات بشكل متكرر.',
          'تُستخدَم منافسات لنشر المناقصات الإلزامي لكن قدرات المنصة لا تُستغَل بالكامل؛ وجودة التقديم غير متسقة والأخطاء متكررة.',
          'تُنشَر جميع المناقصات المطلوبة على منافسات بوثائق كاملة ودقيقة؛ والامتثال يُتحقَّق منه قبل كل تقديم.',
          'استخدام منافسات مُحسَّن بالكامل؛ وجميع المشتريات فوق الحد تُدار عبر المنصة؛ وتحليلات المنصة تُستخدَم للمقارنة المعيارية مع الجهات المماثلة.',
          'تميّز في المنصة: أخطاء وثائق معدومة، استخدام كامل لتحليلات منافسات للمقارنة المعيارية والتحسين؛ ومشاركة استباقية مع هيئة المنافسة؛ ومعترف بها كجهة مشتريات رائدة.',
        ],
      },
      {
        q: 'How comprehensively is your supply chain governance documented and audit-ready — including policies, delegation of authority, conflict-of-interest management, and supplier code of conduct?',
        qAr: 'ما مدى شمولية توثيق حوكمة سلسلة الإمداد لديكم وجاهزيتها للتدقيق — بما في ذلك السياسات وتفويض الصلاحيات وإدارة تضارب المصالح وميثاق سلوك الموردين؟',
        levels: [
          'Supply chain governance documentation is absent or severely incomplete. Audits regularly surface undocumented decisions and informal processes.',
          'Some supply chain policies exist but are outdated, incomplete, and not consistently followed; delegation of authority is informal and undocumented.',
          'A documented governance framework covers procurement policies, delegation of authority, conflict-of-interest declarations, and supplier onboarding; documents are reviewed annually.',
          'Supply chain governance is comprehensive, regularly audited by internal audit with zero material findings; the governance manual is versioned, communicated, and owned.',
          'Governance excellence: externally benchmarked framework, zero material audit findings for 3+ years, transparent reporting to oversight bodies; a recognised model for peer government entities.',
        ],
        levelsAr: [
          'وثائق حوكمة سلسلة الإمداد غائبة أو ناقصة بشكل حاد. عمليات التدقيق تكشف باستمرار عن قرارات غير موثّقة وعمليات غير رسمية.',
          'توجد بعض سياسات سلسلة الإمداد لكنها قديمة وغير مكتملة وغير متّبَعة باتساق؛ وتفويض الصلاحيات غير رسمي وغير موثّق.',
          'يغطي إطار حوكمة موثّق سياسات المشتريات وتفويض الصلاحيات وإقرارات تضارب المصالح وإجراءات ضمّ الموردين؛ والوثائق تُراجَع سنويًا.',
          'حوكمة سلسلة الإمداد شاملة وتُدقَّق بانتظام من التدقيق الداخلي بنتائج جوهرية معدومة؛ ودليل الحوكمة مُصدَّر إصداراته ومُبلَّغ به ومُسنَد.',
          'تميّز في الحوكمة: إطار مُقارَن معياريًا خارجيًا، نتائج جوهرية معدومة لأكثر من 3 سنوات، تقارير شفافة لهيئات الرقابة؛ ونموذج معترف به للجهات الحكومية المماثلة.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Immediately audit your Nitaqat status by supply chain function. Establish a GTPL compliance checklist for all procurement staff and register all required tenders on Monafasat.',
      Aware:     'Build a GTPL compliance framework and train all procurement staff. Conduct your first IKTVA local-content analysis and identify the top 5 categories to shift to local supply.',
      Defined:   'Automate Saudization tracking by department. Develop a supplier governance manual that satisfies internal audit and begin proactive Monafasat platform utilisation reporting.',
      Managed:   'Launch a dedicated local supplier development programme targeting IKTVA improvement. Achieve zero audit findings in GTPL compliance and link Nitaqat to executive scorecards.',
      Optimised: 'Lead GCC best practice in government procurement governance. Publish IKTVA local-content performance and target premium Nitaqat status as a competitive differentiator for talent and tenders.',
    },
    recommendationsAr: {
      Reactive:  'تدقيق فوري في حالة نطاقات حسب وظيفة سلسلة الإمداد. إرساء قائمة تدقيق الامتثال لـ GTPL لجميع موظفي المشتريات وتسجيل جميع المناقصات المطلوبة على منافسات.',
      Aware:     'بناء إطار الامتثال لـ GTPL وتدريب جميع موظفي المشتريات. إجراء أول تحليل للمحتوى المحلي لـ IKTVA وتحديد أعلى 5 فئات للتحوّل إلى التوريد المحلي.',
      Defined:   'أتمتة تتبّع السعودة حسب الإدارة. تطوير دليل حوكمة الموردين المُرضي للتدقيق الداخلي والبدء بالإبلاغ الاستباقي عن استخدام منصة منافسات.',
      Managed:   'إطلاق برنامج متخصص لتطوير الموردين المحليين يستهدف تحسين IKTVA. تحقيق نتائج تدقيق معدومة في الامتثال لـ GTPL وربط نطاقات ببطاقات الأداء التنفيذية.',
      Optimised: 'قيادة أفضل الممارسات الخليجية في حوكمة المشتريات الحكومية. نشر أداء المحتوى المحلي لـ IKTVA واستهداف حالة نطاقات المتميّزة كميزة تنافسية في المواهب والمناقصات.',
    },
    subSegments: REGULATORY_SUB_SEGMENTS as unknown as SubSegment[],
  },
];
