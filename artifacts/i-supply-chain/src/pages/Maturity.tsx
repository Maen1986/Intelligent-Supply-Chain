import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { rankWeakest } from '@/lib/weakestAreas';
import { FeedbackModal, shouldShowFeedback } from '@/components/FeedbackModal';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronRight, ChevronLeft, BarChart3, Award,
  TrendingUp, RotateCcw,
  GitBranch, ShoppingCart, FileText, Users, Shield, Leaf, Cpu, RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   DATA MODEL
═══════════════════════════════════════════════════════════════════════════ */

const SCALE_LABELS = [
  { value: 1, short: 'Reactive',   shortAr: 'تفاعلي',   color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { value: 2, short: 'Aware',      shortAr: 'مُدرِك',    color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { value: 3, short: 'Defined',    shortAr: 'مُعرَّف',   color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A' },
  { value: 4, short: 'Managed',    shortAr: 'مُدار',     color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  { value: 5, short: 'Optimised',  shortAr: 'مُحسَّن',   color: '#0B3D91', bg: '#EFF6FF', border: '#BFDBFE' },
];

interface Question {
  q: string;
  qAr: string;
  /** Criteria for levels 1–5 (index 0 = level 1) */
  levels: [string, string, string, string, string];
  levelsAr: [string, string, string, string, string];
}

interface Segment {
  id: string;
  title: string;
  titleAr: string;
  shortTitle: string;
  shortTitleAr: string;
  icon: React.ElementType;
  color: string;
  questions: Question[];
  benchmarks: { gcc: number; global: number; best: number };
  recommendations: Record<string, string>;
  recommendationsAr: Record<string, string>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENTS — 8 × 5 questions, each question with 5 explicit level criteria
═══════════════════════════════════════════════════════════════════════════ */

const SEGMENTS: Segment[] = [
  /* ── 1. STRATEGY ───────────────────────────────────────────────────────── */
  {
    id: 'strategy',
    title: 'Supply Chain Strategy & Design',
    titleAr: 'استراتيجية وتصميم سلسلة الإمداد',
    shortTitle: 'Strategy',
    shortTitleAr: 'الاستراتيجية',
    icon: GitBranch,
    color: '#0B3D91',
    benchmarks: { gcc: 2.4, global: 2.9, best: 4.6 },
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
        qAr: 'ما مدى انتظامكم في إجراء مراجعات لتصميم شبكة سلسلة الإمداد من طرف إلى طرف، بما في ذلك البصمة التشغيلية ومسارات النقل ونماذج التوزيع؟',
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
          'تستخدم المراجعات نصف السنوية نمذجة التوأم الرقمي ومحاكاة السيناريوهات المتعددة لتحسين بصمة الشبكة الكاملة بشكل مستمر.',
        ],
      },
      {
        q: 'How mature is your Sales & Operations Planning (S&OP) or Integrated Business Planning (IBP) process across finance, sales, operations, and supply chain?',
        qAr: 'ما مدى نضج عملية تخطيط المبيعات والعمليات (S&OP) أو التخطيط المتكامل للأعمال (IBP) لديكم عبر المالية والمبيعات والعمليات وسلسلة الإمداد؟',
        levels: [
          'No S&OP process exists. Demand and supply plans are siloed within individual departments with no cross-functional alignment.',
          'Basic S&OP meetings occur but attendance is inconsistent, inputs are unreliable, and outputs are rarely translated into operational actions.',
          'A monthly S&OP cycle is established with defined inputs from sales, operations, and supply chain and consistent meeting cadence.',
          'S&OP includes financial reconciliation, executive review, and consistently drives near-term operational and procurement decisions.',
          'A fully integrated IBP process runs monthly with executive engagement, real-time demand sensing, and direct linkage to financial forecasting and capital allocation.',
        ],
        levelsAr: [
          'لا توجد عملية S&OP. خطط الطلب والإمداد منعزلة داخل الإدارات الفردية دون مواءمة عبر الوظائف.',
          'تُعقد اجتماعات S&OP أساسية لكن الحضور غير منتظم والمدخلات غير موثوقة ونادرًا ما تُترجم المخرجات إلى إجراءات تشغيلية.',
          'أُنشئت دورة S&OP شهرية بمدخلات محددة من المبيعات والعمليات وسلسلة الإمداد وبوتيرة اجتماعات منتظمة.',
          'تشمل عملية S&OP مطابقة مالية ومراجعة تنفيذية وتوجّه باستمرار القرارات التشغيلية والشرائية قصيرة المدى.',
          'تعمل عملية IBP متكاملة تمامًا شهريًا بمشاركة تنفيذية واستشعار للطلب في الوقت الحقيقي وربط مباشر بالتنبؤ المالي وتخصيص رأس المال.',
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
          'تقوم أدوات محاكاة متقدمة بنمذجة سيناريوهات متعددة بنتائج مخاطر وفرص مُقاسة قبل كل قرار استراتيجي كبير في سلسلة الإمداد.',
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
          'تُتابَع مجموعة محددة من مؤشرات أداء سلسلة الإمداد بانتظام وتُرفَع للإدارة شهريًا مع تحديد ملكية أساسية.',
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
  },

  /* ── 2. PROCUREMENT ─────────────────────────────────────────────────────── */
  {
    id: 'procurement',
    title: 'Procurement & Strategic Sourcing',
    titleAr: 'المشتريات والتوريد الاستراتيجي',
    shortTitle: 'Procurement',
    shortTitleAr: 'المشتريات',
    icon: ShoppingCart,
    color: '#C9A84C',
    benchmarks: { gcc: 2.6, global: 3.1, best: 4.5 },
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
          'تُطلب عروض أسعار تنافسية لبعض المشتريات لكن العملية غير متسقة وغير موثّقة وتفتقر إلى معايير تقييم رسمية.',
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
  },

  /* ── 3. CLM ─────────────────────────────────────────────────────────────── */
  {
    id: 'contracts',
    title: 'Contract Lifecycle Management',
    titleAr: 'إدارة دورة حياة العقود',
    shortTitle: 'CLM',
    shortTitleAr: 'إدارة العقود',
    icon: FileText,
    color: '#0B6E4F',
    benchmarks: { gcc: 2.0, global: 2.7, best: 4.4 },
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
          'A basic obligation tracking process monitors major SLAs and generates alerts for approaching milestones or known contract breaches.',
          'All material obligations are tracked systematically, with defined escalation paths, monthly compliance reporting, and documented breach resolution.',
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
      Managed:   'تطبيق تحليلات العقود المدعومة بالذكاء الاصطناعي لتحديد المخاطر واستخلاص الالتزامات وتتبّع التزامات الإنفاق. ربط CLM بنظام تخطيط الموارد المؤسسية (ERP) لالتزامات الإنفاق.',
      Optimised: 'نشر تقييم تنبؤي لمخاطر العقود والاستفادة من بيانات العقود كمصدر استخباراتي استراتيجي لقرارات التوريد وإدارة أداء الموردين.',
    },
  },

  /* ── 4. SRM ─────────────────────────────────────────────────────────────── */
  {
    id: 'suppliers',
    title: 'Supplier Relationship Management',
    titleAr: 'إدارة علاقات الموردين',
    shortTitle: 'SRM',
    shortTitleAr: 'علاقات الموردين',
    icon: Users,
    color: '#7B2D8B',
    benchmarks: { gcc: 2.2, global: 2.8, best: 4.5 },
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
  },

  /* ── 5. RISK ────────────────────────────────────────────────────────────── */
  {
    id: 'risk',
    title: 'Supply Chain Risk Management',
    titleAr: 'إدارة مخاطر سلسلة الإمداد',
    shortTitle: 'Risk',
    shortTitleAr: 'المخاطر',
    icon: Shield,
    color: '#B91C1C',
    benchmarks: { gcc: 2.1, global: 2.7, best: 4.3 },
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
        qAr: 'ما مدى انتظامكم في إجراء تمارين مخاطر سلسلة الإمداد أو اختبارات الإجهاد أو محاكاة الطاولة — وما سرعة ترجمة النتائج إلى تحديثات للخطط وإجراءات تخفيف؟',
        levels: [
          'Risk plans have never been tested. The organisation has never conducted a supply chain stress test, tabletop simulation, or disruption exercise.',
          'Informal discussions about risk scenarios occur occasionally but are not structured, documented, assigned to owners, or formally actioned.',
          'A structured tabletop exercise or formal risk review is conducted annually, with findings documented and used to update contingency plans.',
          'Annual stress-test exercises simulate specific disruption scenarios, with executive review and findings translated into actionable plan updates within 60 days.',
          'Annual supply chain stress-test exercises simulate multiple disruption scenarios, are reviewed at board level, and findings are translated into specific plan updates within 30 days.',
        ],
        levelsAr: [
          'لم تُختبَر خطط المخاطر قط. لم تُجرِ المؤسسة أبدًا اختبار إجهاد لسلسلة الإمداد أو محاكاة طاولة أو تمرين اضطراب.',
          'تُجرى نقاشات غير رسمية حول سيناريوهات المخاطر أحيانًا لكنها غير منظمة وغير موثّقة وغير مُسنَدة لمالكين أو مُتخَذ بشأنها إجراء رسمي.',
          'يُجرى تمرين طاولة منظم أو مراجعة مخاطر رسمية سنويًا، مع توثيق النتائج واستخدامها لتحديث الخطط الاحتياطية.',
          'تحاكي تمارين اختبار الإجهاد السنوية سيناريوهات اضطراب محددة، بمراجعة تنفيذية وترجمة النتائج إلى تحديثات خطط قابلة للتنفيذ خلال 60 يومًا.',
          'تحاكي تمارين اختبار الإجهاد السنوية لسلسلة الإمداد سيناريوهات اضطراب متعددة، وتُراجَع على مستوى مجلس الإدارة، وتُترجَم النتائج إلى تحديثات خطط محددة خلال 30 يومًا.',
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
      Defined:   'نشر أداة لمراقبة مخاطر الموردين. إضفاء الطابع الرسمي على خطط استمرارية الأعمال لجميع الفئات الحرجة وإجراء أول تمرين محاكاة على الطاولة.',
      Managed:   'تطبيق مراقبة مخاطر آنية مدعومة بالذكاء الاصطناعي. توسيع التوريد المزدوج ليشمل جميع الفئات الحرجة والبدء برسم مخاطر سلسلة الإمداد للمستوى الثاني مع الموردين الاستراتيجيين.',
      Optimised: 'توظيف التحليلات التنبؤية لاستباق الاضطرابات قبل وقوعها. بناء مرونة سلسلة الإمداد كميزة تنافسية تُبلَّغ للعملاء.',
    },
  },

  /* ── 6. ESG ─────────────────────────────────────────────────────────────── */
  {
    id: 'sustainability',
    title: 'Sustainability & ESG',
    titleAr: 'الاستدامة والحوكمة البيئية والاجتماعية',
    shortTitle: 'ESG',
    shortTitleAr: 'الاستدامة',
    icon: Leaf,
    color: '#15803D',
    benchmarks: { gcc: 1.8, global: 2.5, best: 4.2 },
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
      Defined:   'تطبيق برنامج تدقيق بيئي واجتماعي وحوكمي للموردين عالي المخاطرة. تحديد مستهدفات خفض مُقاسة للنطاق الثالث والمواءمة مع متطلبات الإفصاح البيئي والاجتماعي والحوكمي لهيئة السوق المالية السعودية.',
      Managed:   'نشر منصة استدامة للموردين لجمع البيانات البيئية والاجتماعية والحوكمية آنيًا. تطوير سياسة مشتريات دائرية ودمج مؤشرات الأداء البيئي والاجتماعي والحوكمي في بطاقات أداء الموردين.',
      Optimised: 'قيادة الشفافية البيئية والاجتماعية والحوكمية لسلسلة الإمداد بتقارير مضمونة خارجيًا. استخدام الريادة في هذا المجال كميزة تنافسية في تأهيل المناقصات الحكومية والدولية.',
    },
  },

  /* ── 7. DIGITAL ─────────────────────────────────────────────────────────── */
  {
    id: 'digital',
    title: 'Digital Transformation & Technology',
    titleAr: 'التحول الرقمي والتقنية',
    shortTitle: 'Digital',
    shortTitleAr: 'الرقمنة',
    icon: Cpu,
    color: '#5B21B6',
    benchmarks: { gcc: 2.3, global: 3.0, best: 4.6 },
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
      Managed:   'توسيع تبني الذكاء الاصطناعي/تعلّم الآلة ليشمل مراقبة مخاطر الموردين والذكاء التوليدي لصياغة طلبات عروض الأسعار. العمل نحو منصة بيانات موحّدة لرؤية سلسلة الإمداد من طرف إلى طرف.',
      Optimised: 'توظيف الذكاء الاصطناعي الوكيلي لمهام المشتريات المستقلة في فئات الإنفاق الطرفية. بناء أصول بيانات وقدرات تحليلات خاصة كميزة تنافسية.',
    },
  },

  /* ── 8. OPERATIONS ──────────────────────────────────────────────────────── */
  {
    id: 'operations',
    title: 'Operational Excellence & Resiliency',
    titleAr: 'التميّز التشغيلي والمرونة',
    shortTitle: 'Operations',
    shortTitleAr: 'العمليات',
    icon: RefreshCw,
    color: '#0369A1',
    benchmarks: { gcc: 2.5, global: 3.0, best: 4.4 },
    questions: [
      {
        q: 'How effectively do you measure and actively manage inventory optimisation — including inventory turnover, safety stock logic, obsolescence, and working capital impact?',
        qAr: 'ما مدى فعالية قياسكم وإدارتكم الفاعلة لتحسين المخزون — بما في ذلك معدل دوران المخزون ومنطق مخزون الأمان والتقادم وأثر رأس المال العامل؟',
        levels: [
          'Inventory levels are not actively managed. Ordering is based on habit or intuition with no formal inventory policy or stock optimisation model.',
          'Basic inventory targets (min/max levels) exist for some items but are not validated against actual demand patterns or regularly reviewed.',
          'A formal inventory policy defines safety stock levels for key SKUs, with regular stock reviews and defined replenishment triggers in place.',
          'Statistical safety stock models are applied to all significant SKUs, with regular turnover reviews, automated replenishment for fast-movers, and obsolescence tracked.',
          'Inventory is managed dynamically using statistical safety stock models, with turnover targets by category, automated replenishment, and monthly obsolescence reviews linked to write-off decisions.',
        ],
        levelsAr: [
          'لا تُدار مستويات المخزون بفاعلية. يستند الطلب إلى العادة أو الحدس دون سياسة مخزون رسمية أو نموذج لتحسين المخزون.',
          'توجد مستهدفات مخزون أساسية (حد أدنى/أقصى) لبعض الأصناف لكنها غير مُتحقَّق منها مقابل أنماط الطلب الفعلية ولا تُراجَع بانتظام.',
          'تحدد سياسة مخزون رسمية مستويات مخزون الأمان لأصناف SKU الرئيسية، مع مراجعات مخزون منتظمة ومحفّزات تجديد محددة.',
          'تُطبَّق نماذج إحصائية لمخزون الأمان على جميع أصناف SKU الجوهرية، مع مراجعات دوران منتظمة وتجديد آلي للأصناف سريعة الحركة وتتبّع للتقادم.',
          'يُدار المخزون ديناميكيًا باستخدام نماذج إحصائية لمخزون الأمان، بمستهدفات دوران حسب الفئة وتجديد آلي ومراجعات تقادم شهرية مرتبطة بقرارات الشطب.',
        ],
      },
      {
        q: 'How mature is your demand forecasting capability — in terms of accuracy, method, granularity, and integration of demand signals from sales, marketing, and customers?',
        qAr: 'ما مدى نضج قدرتكم على التنبؤ بالطلب — من حيث الدقة والأسلوب ومستوى التفصيل ودمج إشارات الطلب من المبيعات والتسويق والعملاء؟',
        levels: [
          'Demand forecasting does not exist. Orders are placed reactively when stock-outs occur or managers manually request replenishment.',
          'Basic forecasting is performed using historical sales averages or simple trending, without input from sales, marketing, or customers.',
          'A formal demand planning process runs monthly, incorporating sales input and historical data with defined forecast accuracy targets.',
          'Demand forecasting uses statistical models integrating multiple internal demand signals, with accuracy measured, reviewed, and continuously improved.',
          'Demand forecasting uses ML models incorporating internal sales history, external market signals, and point-of-sale data, achieving forecast accuracy above 85% at SKU level.',
        ],
        levelsAr: [
          'لا يوجد تنبؤ بالطلب. تُقدَّم الطلبات بشكل تفاعلي عند نفاد المخزون أو عندما يطلب المديرون التجديد يدويًا.',
          'يُجرى تنبؤ أساسي باستخدام متوسطات المبيعات التاريخية أو الاتجاهات البسيطة، دون مدخلات من المبيعات أو التسويق أو العملاء.',
          'تعمل عملية تخطيط طلب رسمية شهريًا، تدمج مدخلات المبيعات والبيانات التاريخية بمستهدفات محددة لدقة التنبؤ.',
          'يستخدم التنبؤ بالطلب نماذج إحصائية تدمج عدة إشارات طلب داخلية، مع قياس الدقة ومراجعتها وتحسينها المستمر.',
          'يستخدم التنبؤ بالطلب نماذج تعلّم آلة تدمج تاريخ المبيعات الداخلي وإشارات السوق الخارجية وبيانات نقاط البيع، محققًا دقة تنبؤ تتجاوز 85% على مستوى صنف SKU.',
        ],
      },
      {
        q: 'How well do you manage logistics performance — including carrier/3PL governance, on-time delivery measurement, cost-per-shipment analysis, and contract compliance?',
        qAr: 'ما مدى جودة إدارتكم لأداء الخدمات اللوجستية — بما في ذلك حوكمة الناقلين ومزوّدي الطرف الثالث وقياس التسليم في الوقت المحدد وتحليل تكلفة الشحنة والامتثال التعاقدي؟',
        levels: [
          'Logistics performance is not measured. Carrier selection is informal and there is no 3PL governance or performance management framework of any kind.',
          'Some KPIs (e.g., on-time delivery) are tracked informally for primary carriers, but reviews are infrequent, undocumented, and not linked to consequences.',
          'Formal SLA agreements exist for key logistics providers, with defined KPIs tracked and reviewed at least quarterly against contracted terms.',
          'All logistics carriers and 3PLs are governed through SLA agreements with monthly performance reviews, cost benchmarking, and documented corrective action processes.',
          'All logistics carriers and 3PLs are governed through formal SLA agreements with monthly KPI reviews, market rate benchmarking, and defined corrective action and exit protocols.',
        ],
        levelsAr: [
          'لا يُقاس أداء الخدمات اللوجستية. اختيار الناقلين غير رسمي ولا توجد حوكمة لمزوّدي الطرف الثالث أو إطار لإدارة الأداء من أي نوع.',
          'تُتابَع بعض المؤشرات (مثل التسليم في الوقت المحدد) بشكل غير رسمي للناقلين الرئيسيين، لكن المراجعات غير متكررة وغير موثّقة وغير مرتبطة بعواقب.',
          'توجد اتفاقيات مستوى خدمة رسمية لمزوّدي الخدمات اللوجستية الرئيسيين، بمؤشرات محددة تُتابَع وتُراجَع فصليًا على الأقل مقابل البنود المتعاقد عليها.',
          'تُحكَم جميع الناقلين ومزوّدي الطرف الثالث عبر اتفاقيات مستوى خدمة بمراجعات أداء شهرية ومقارنة معيارية للتكلفة وعمليات تصحيح موثّقة.',
          'تُحكَم جميع الناقلين ومزوّدي الطرف الثالث عبر اتفاقيات مستوى خدمة رسمية بمراجعات مؤشرات شهرية ومقارنة معيارية لأسعار السوق وبروتوكولات تصحيح وخروج محددة.',
        ],
      },
      {
        q: 'How effectively do you apply lean and continuous improvement principles — including waste identification, process standardisation, and cross-functional improvement projects — to supply chain operations?',
        qAr: 'ما مدى فعالية تطبيقكم لمبادئ التصنيع الرشيق والتحسين المستمر — بما في ذلك تحديد الهدر وتوحيد العمليات ومشاريع التحسين متعددة الوظائف — على عمليات سلسلة الإمداد؟',
        levels: [
          'Lean and continuous improvement are not practised. Processes are rarely reviewed, inefficiency is tolerated, and no structured improvement programme exists.',
          'Awareness of lean principles exists within the team and some localised improvements are made, but these are individual initiatives without structure or tracking.',
          'A continuous improvement programme exists with defined processes, cross-functional participation, and tracked outcomes reported to management.',
          'Kaizen events and structured improvement projects are conducted regularly, with process owners driving waste elimination and results reported to senior management.',
          'A culture of continuous improvement is embedded: kaizen events run quarterly, process owners drive waste elimination, and improvement outcomes are tracked and shared company-wide.',
        ],
        levelsAr: [
          'لا يُمارَس التصنيع الرشيق والتحسين المستمر. نادرًا ما تُراجَع العمليات، ويُتساهَل مع عدم الكفاءة، ولا يوجد برنامج تحسين منظم.',
          'يوجد وعي بمبادئ التصنيع الرشيق داخل الفريق وتُجرى بعض التحسينات المحلية، لكنها مبادرات فردية دون هيكل أو متابعة.',
          'يوجد برنامج تحسين مستمر بعمليات محددة ومشاركة متعددة الوظائف ونتائج متابَعة تُرفَع للإدارة.',
          'تُجرى فعاليات كايزن ومشاريع تحسين منظمة بانتظام، مع قيادة مالكي العمليات لإزالة الهدر ورفع النتائج للإدارة العليا.',
          'ثقافة التحسين المستمر متجذّرة: تُجرى فعاليات كايزن فصليًا، ويقود مالكو العمليات إزالة الهدر، وتُتابَع نتائج التحسين وتُشارَك على مستوى الشركة.',
        ],
      },
      {
        q: 'How resilient is your supply chain to disruption — measured by documented recovery time objectives, tested recovery plans, and proven ability to maintain service during adverse events?',
        qAr: 'ما مدى مرونة سلسلة الإمداد لديكم تجاه الاضطراب — مقاسةً بأهداف زمن تعافٍ موثّقة وخطط تعافٍ مختبَرة وقدرة مُثبَتة على الحفاظ على الخدمة أثناء الأحداث السلبية؟',
        levels: [
          'The supply chain has no documented Recovery Time Objectives. Disruptions lead to significant, prolonged service failures with no structured response protocol.',
          'Some informal workarounds for common disruptions are known but not documented, not tested, and their effectiveness has not been validated.',
          'Recovery Time Objectives are defined for critical supply chain processes and basic recovery plans are documented and assigned to owners.',
          'Recovery plans for all critical processes are documented, reviewed annually, and the organisation has demonstrated effective response to at least one significant real disruption.',
          'Recovery Time Objectives are defined for all critical supply chain processes, tested annually through live exercises, and the organisation has demonstrated >95% service maintenance during past disruption events.',
        ],
        levelsAr: [
          'ليس لدى سلسلة الإمداد أهداف زمن تعافٍ موثّقة. تؤدي الاضطرابات إلى إخفاقات خدمة كبيرة وممتدة دون بروتوكول استجابة منظم.',
          'تُعرف بعض الحلول البديلة غير الرسمية للاضطرابات الشائعة لكنها غير موثّقة وغير مختبَرة ولم تُتحقَّق فعاليتها.',
          'تُحدَّد أهداف زمن التعافي للعمليات الحرجة في سلسلة الإمداد وتُوثَّق خطط تعافٍ أساسية وتُسنَد لمالكين.',
          'تُوثَّق خطط التعافي لجميع العمليات الحرجة وتُراجَع سنويًا، وقد أثبتت المؤسسة استجابة فعّالة لاضطراب حقيقي كبير واحد على الأقل.',
          'تُحدَّد أهداف زمن التعافي لجميع العمليات الحرجة في سلسلة الإمداد وتُختبَر سنويًا عبر تمارين حية، وقد أثبتت المؤسسة الحفاظ على أكثر من 95% من الخدمة أثناء أحداث اضطراب سابقة.',
        ],
      },
    ],
    recommendations: {
      Reactive:  'Implement a basic inventory policy with minimum/maximum levels for all stock items. Introduce a simple demand planning process and start tracking on-time delivery from suppliers.',
      Aware:     'Deploy statistical safety stock modelling for your top 20% of SKUs. Introduce 3PL SLAs and begin monthly logistics performance reviews.',
      Defined:   'Implement formal demand sensing with customer input integration. Apply lean principles to your top 3 supply chain processes and establish recovery time objectives for critical flows.',
      Managed:   'Deploy ML-driven demand forecasting and automated replenishment. Implement a structured continuous improvement programme with cross-functional ownership.',
      Optimised: 'Operate a demand-driven supply chain with real-time customer signal integration. Build resilience metrics into executive reporting and customer SLA commitments.',
    },
    recommendationsAr: {
      Reactive:  'تطبيق سياسة مخزون أساسية بحدود دنيا/قصوى لجميع أصناف المخزون. إدخال عملية تخطيط طلب بسيطة والبدء بتتبّع التسليم في الوقت المحدد من الموردين.',
      Aware:     'نشر نمذجة إحصائية لمخزون الأمان لأعلى 20% من أصناف SKU لديكم. إدخال اتفاقيات مستوى خدمة لمزوّدي الطرف الثالث والبدء بمراجعات أداء لوجستي شهرية.',
      Defined:   'تطبيق استشعار طلب رسمي بدمج مدخلات العملاء. تطبيق مبادئ التصنيع الرشيق على أعلى 3 عمليات في سلسلة الإمداد وإرساء أهداف زمن تعافٍ للتدفقات الحرجة.',
      Managed:   'نشر التنبؤ بالطلب المدفوع بتعلّم الآلة والتجديد الآلي. تطبيق برنامج تحسين مستمر منظم بملكية متعددة الوظائف.',
      Optimised: 'تشغيل سلسلة إمداد مدفوعة بالطلب بدمج آني لإشارات العملاء. تضمين مقاييس المرونة في التقارير التنفيذية والتزامات اتفاقيات مستوى الخدمة مع العملاء.',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MATURITY LEVELS
═══════════════════════════════════════════════════════════════════════════ */

const MATURITY_LEVELS = [
  { label: 'Reactive',   labelAr: 'تفاعلي',   min: 1.0, max: 1.9, color: '#EF4444', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  { label: 'Aware',      labelAr: 'مُدرِك',    min: 2.0, max: 2.9, color: '#F97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200' },
  { label: 'Defined',    labelAr: 'مُعرَّف',   min: 3.0, max: 3.9, color: '#EAB308', bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200' },
  { label: 'Managed',    labelAr: 'مُدار',     min: 4.0, max: 4.4, color: '#22C55E', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  { label: 'Optimised',  labelAr: 'مُحسَّن',   min: 4.5, max: 5.0, color: '#0B3D91', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
];

function getLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) ?? MATURITY_LEVELS[0];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

type Phase = 'intro' | 'questions' | 'results';

export function Maturity() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [phase, setPhase]     = useState<Phase>('intro');
  const [segIdx, setSegIdx]   = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const topRef = useRef<HTMLDivElement>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Show the feedback modal once per session after results are rendered
  useEffect(() => {
    if (phase !== 'results') return;
    if (!shouldShowFeedback('maturity')) return;
    const id = setTimeout(() => setFeedbackOpen(true), 2500);
    return () => clearTimeout(id);
  }, [phase]);

  const scrollUp = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  const totalQuestions = SEGMENTS.length * 5;
  const answeredCount  = Object.keys(answers).length;
  const progress       = answeredCount / totalQuestions;

  const setAnswer = (seg: number, q: number, val: number) => {
    setAnswers(prev => ({ ...prev, [`${seg}-${q}`]: val }));
  };

  const segScore = (seg: number) => {
    const vals   = [0, 1, 2, 3, 4].map(q => answers[`${seg}-${q}`] ?? 0);
    const filled = vals.filter(v => v > 0);
    return filled.length === 5 ? filled.reduce((a, b) => a + b, 0) / 5 : null;
  };

  const currentSegComplete = () => [0, 1, 2, 3, 4].every(q => answers[`${segIdx}-${q}`]);

  const handleNext = () => {
    if (segIdx < SEGMENTS.length - 1) { setSegIdx(s => s + 1); scrollUp(); }
    else { setPhase('results'); scrollUp(); }
  };
  const handleBack = () => {
    if (segIdx > 0) { setSegIdx(s => s - 1); scrollUp(); }
    else { setPhase('intro'); scrollUp(); }
  };
  const handleReset = () => { setAnswers({}); setSegIdx(0); setPhase('intro'); scrollUp(); };

  const L = {
    yourScore:  ar ? 'نتيجتك' : 'Your Score',
    gccAvg:     ar ? 'متوسط دول الخليج' : 'GCC Average',
    globalAvg:  ar ? 'المتوسط العالمي' : 'Global Average',
    bestClass:  ar ? 'الأفضل في فئته' : 'Best-in-Class',
  };

  const radarData = SEGMENTS.map((seg, i) => ({
    segment: ar ? seg.shortTitleAr : seg.shortTitle,
    [L.yourScore]:  +(segScore(i) ?? 0).toFixed(2),
    [L.gccAvg]:     seg.benchmarks.gcc,
    [L.globalAvg]:  seg.benchmarks.global,
    [L.bestClass]:  seg.benchmarks.best,
  }));

  const overallScore = SEGMENTS.reduce((sum, _, i) => sum + (segScore(i) ?? 0), 0) / SEGMENTS.length;
  const overallLevel = getLevel(overallScore);

  /* ── INTRO ─────────────────────────────────────────────────────────────── */
  if (phase === 'intro') return (
    <div ref={topRef} className="w-full">
      <div className="relative w-full overflow-hidden bg-[#082C6B]" style={{ minHeight: 280 }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 100%, rgba(201,168,76,0.2) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 100%)' }} />
        <div className="relative z-10 container mx-auto px-4 py-16 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-5">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'نموذج تشخيص النضج' : 'Maturity Diagnostic Model'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {ar ? <>تقييم نضج سلسلة الإمداد<br />والمشتريات</> : <>Supply Chain &amp; Procurement<br />Maturity Assessment</>}
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">
            {ar
              ? 'تشخيص منظم من 40 سؤالاً عبر 8 مجالات محورية. يقدّم كل سؤال خمسة مستويات نضج موصوفة بوضوح — اختر المستوى الذي يصف مؤسستكم اليوم بأدق صورة.'
              : 'A structured 40-question diagnostic across 8 critical segments. Each question presents five clearly described maturity levels — select the one that most accurately describes your organisation today.'}
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(ar ? [
              { label: '8 مجالات',      sub: 'نطاق سلسلة الإمداد الكامل' },
              { label: '40 سؤالاً',     sub: '5 لكل مجال' },
              { label: '5 مستويات لكل سؤال', sub: 'معايير صريحة لكل مستوى' },
              { label: '~15 دقيقة',     sub: 'لإكمال التقييم' },
            ] : [
              { label: '8 Segments',    sub: 'Full supply chain scope' },
              { label: '40 Questions',  sub: '5 per segment' },
              { label: '5 Levels Each', sub: 'Explicit criteria per level' },
              { label: '~15 Minutes',   sub: 'Complete assessment' },
            ]).map(item => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-muted">
                <p className="text-2xl font-extrabold text-primary">{item.label}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">{ar ? 'ما الذي يغطيه هذا التقييم' : 'What This Assessment Covers'}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {SEGMENTS.map(seg => (
            <div key={seg.id} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-primary leading-tight">{ar ? seg.shortTitleAr : seg.shortTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{seg.questions.length} {ar ? 'أسئلة · 5 مستويات لكل سؤال' : 'questions · 5 levels each'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Maturity scale */}
        <div className="bg-muted rounded-2xl p-6 mb-10">
          <h3 className="font-bold text-primary mb-4 text-center text-sm uppercase tracking-widest">{ar ? 'مقياس النضج من 5 مستويات' : '5-Level Maturity Scale'}</h3>
          <div className="grid sm:grid-cols-5 gap-3">
            {SCALE_LABELS.map(s => (
              <div key={s.value} className="rounded-xl p-3 border text-center" style={{ backgroundColor: s.bg, borderColor: s.border }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-extrabold text-white text-sm" style={{ backgroundColor: s.color }}>{s.value}</div>
                <p className="font-bold text-sm" style={{ color: s.color }}>{ar ? s.shortAr : s.short}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={() => { setPhase('questions'); scrollUp(); }}
            data-testid="button-start-assessment"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-10 min-h-[52px] text-base shadow-lg">
            {ar ? 'ابدأ التقييم' : 'Start Assessment'} {ar ? <ChevronLeft className="w-5 h-5 mr-1" /> : <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
          <p className="text-muted-foreground text-sm mt-3">{ar ? 'لا يتطلب حسابًا · تُعرض النتائج فورًا · سرّي' : 'No account required · Results displayed instantly · Confidential'}</p>
        </div>
      </div>
    </div>
  );

  /* ── QUESTIONS ─────────────────────────────────────────────────────────── */
  if (phase === 'questions') {
    const seg        = SEGMENTS[segIdx];
    const segComplete = currentSegComplete();

    return (
      <div ref={topRef} className="w-full bg-muted min-h-screen" style={{ scrollMarginTop: 80 }}>
        {/* Sticky progress header */}
        <div className="sticky top-20 z-30 bg-white border-b border-border shadow-sm">
          <div className="h-1.5 bg-muted">
            <motion.div className="h-full bg-accent" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '20' }}>
                <seg.icon className="w-4 h-4" style={{ color: seg.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{ar ? `المجال ${segIdx + 1} من ${SEGMENTS.length}` : `Segment ${segIdx + 1} of ${SEGMENTS.length}`}</p>
                <p className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-primary">{answeredCount}</span>/{totalQuestions} {ar ? 'مُجاب عنها' : 'answered'}
            </div>
          </div>
          <div className="container mx-auto px-4 pb-2.5 flex gap-1.5">
            {SEGMENTS.map((s, i) => {
              const done   = segScore(i) !== null;
              const active = i === segIdx;
              return (
                <div key={s.id} title={ar ? s.shortTitleAr : s.shortTitle}
                  className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-25'}`}
                  style={{ backgroundColor: active ? seg.color : done ? '#22C55E' : '#CBD5E1' }}
                  onClick={() => { setSegIdx(i); scrollUp(); }}
                />
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={segIdx}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

              {/* Segment header */}
              <div className="bg-white rounded-2xl border border-border shadow-sm p-5 mb-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                  <seg.icon className="w-7 h-7" style={{ color: seg.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ar ? `المجال ${segIdx + 1}` : `Segment ${segIdx + 1}`}</p>
                  <h2 className="text-xl font-extrabold text-primary">{ar ? seg.titleAr : seg.title}</h2>
                </div>
              </div>

              {/* Questions */}
              {seg.questions.map((question, qi) => {
                const val = answers[`${segIdx}-${qi}`];
                return (
                  <div key={qi} className="bg-white rounded-2xl border border-border shadow-sm mb-5 overflow-hidden">
                    {/* Question text */}
                    <div className="flex items-start gap-3 p-5 pb-4 border-b border-border">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{qi + 1}</span>
                      <p className="font-semibold text-foreground text-sm leading-relaxed">{ar ? question.qAr : question.q}</p>
                    </div>

                    {/* Level rows — the core UI */}
                    <div className="divide-y divide-border">
                      {SCALE_LABELS.map((s, li) => {
                        const selected = val === s.value;
                        return (
                          <button
                            key={s.value}
                            data-testid={`answer-${segIdx}-${qi}-${s.value}`}
                            onClick={() => setAnswer(segIdx, qi, s.value)}
                            className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-all duration-150 group
                              ${selected ? 'ring-2 ring-inset' : 'hover:bg-muted/60'}`}
                            style={selected ? { backgroundColor: s.bg, '--tw-ring-color': s.color } as React.CSSProperties : {}}
                          >
                            {/* Level badge */}
                            <div className="shrink-0 flex flex-col items-center gap-1 w-16">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-base transition-all
                                ${selected ? 'text-white scale-110 shadow-md' : 'text-white/80'}`}
                                style={{ backgroundColor: selected ? s.color : s.color + 'AA' }}>
                                {s.value}
                              </div>
                              <span className={`text-[11px] font-bold leading-tight text-center transition-colors
                                ${selected ? '' : 'text-muted-foreground group-hover:text-foreground'}`}
                                style={selected ? { color: s.color } : {}}>
                                {ar ? s.shortAr : s.short}
                              </span>
                            </div>

                            {/* Criteria text */}
                            <p className={`text-sm leading-relaxed pt-1 flex-1 transition-colors
                              ${selected ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {ar ? question.levelsAr[li] : question.levels[li]}
                            </p>

                            {/* Selection indicator */}
                            <div className={`shrink-0 mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                              ${selected ? 'border-current' : 'border-border group-hover:border-muted-foreground'}`}
                              style={selected ? { borderColor: s.color } : {}}>
                              {selected && (
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected confirmation */}
                    {val && (
                      <div className="px-5 py-2.5 flex items-center gap-2 border-t border-border" style={{ backgroundColor: SCALE_LABELS[val - 1].bg }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SCALE_LABELS[val - 1].color }} />
                        <p className="text-xs font-semibold" style={{ color: SCALE_LABELS[val - 1].color }}>
                          {ar ? `المختار: المستوى ${val} — ${SCALE_LABELS[val - 1].shortAr}` : `Selected: Level ${val} — ${SCALE_LABELS[val - 1].short}`}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 gap-4">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {segIdx === 0 ? (ar ? 'المقدمة' : 'Intro') : (ar ? 'السابق' : 'Previous')}
                </Button>
                <div className="text-center">
                  {!segComplete && (
                    <p className="text-xs text-muted-foreground">{ar ? 'أجب عن جميع الأسئلة الخمسة للمتابعة' : 'Answer all 5 questions to continue'}</p>
                  )}
                </div>
                <Button onClick={handleNext} disabled={!segComplete}
                  data-testid="button-maturity-next"
                  className={`gap-2 ${segIdx === SEGMENTS.length - 1 ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'} text-white font-bold`}>
                  {segIdx === SEGMENTS.length - 1
                    ? <><Award className="w-4 h-4" /> {ar ? 'عرض النتائج' : 'View Results'}</>
                    : <>{ar ? 'المجال التالي' : 'Next Segment'} {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</>}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ── RESULTS ───────────────────────────────────────────────────────────── */
  return (
    <div ref={topRef} className="w-full" data-testid="maturity-results">
      <div className="bg-[#082C6B] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'نتائج نضجكم' : 'Your Maturity Results'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{ar ? 'تقرير نضج سلسلة الإمداد والمشتريات' : <>Supply Chain &amp; Procurement Maturity Report</>}</h1>
          <p className="text-white/70">{ar ? 'مقارَنة معياريًا بنظراء دول الخليج والمتوسطات العالمية والمؤسسات الأفضل في فئتها.' : 'Benchmarked against GCC peers, global averages, and best-in-class organisations.'}</p>

          <div className="mt-8 inline-flex items-center gap-6 bg-white/10 rounded-3xl px-8 py-5 border border-white/20">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{ar ? 'نتيجة النضج الإجمالية' : 'Overall Maturity Score'}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-extrabold text-white">{overallScore.toFixed(1)}</span>
                <span className="text-white/50 text-xl">/5.0</span>
              </div>
            </div>
            <div className={`px-5 py-2 rounded-full text-lg font-extrabold ${overallLevel.bg} ${overallLevel.text} border-2 ${overallLevel.border}`}>
              {ar ? overallLevel.labelAr : overallLevel.label}
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-6 flex-wrap text-sm">
            {[
              { label: ar ? 'مقابل متوسط الخليج' : 'vs GCC Average',    value: (overallScore - 2.3).toFixed(1), positive: overallScore >= 2.3 },
              { label: ar ? 'مقابل المتوسط العالمي' : 'vs Global Average', value: (overallScore - 2.8).toFixed(1), positive: overallScore >= 2.8 },
              { label: ar ? 'مقابل الأفضل في الفئة' : 'vs Best-in-Class',  value: (overallScore - 4.4).toFixed(1), positive: overallScore >= 4.4 },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span className="text-white/60">{b.label}</span>
                <span className={`font-bold ${b.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {b.positive ? '+' : ''}{b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">

        {/* Radar */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">{ar ? 'رادار النضج — مقارنة معيارية عبر 8 مجالات' : 'Maturity Radar — 8-Segment Benchmark Comparison'}</h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? 'نتائجكم مرسومة مقابل متوسط الخليج والمتوسط العالمي ومعايير الأفضل في الفئة.' : 'Your scores plotted against GCC average, global average, and best-in-class benchmarks.'}</p>
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="segment" tick={{ fontSize: 12, fontWeight: 600, fill: '#1E3A5F' }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10, fill: '#94A3B8' }} tickCount={6} />
                <Radar name={L.bestClass}  dataKey={L.bestClass}  stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 3" />
                <Radar name={L.globalAvg}  dataKey={L.globalAvg}  stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name={L.gccAvg}     dataKey={L.gccAvg}     stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="3 2" />
                <Radar name={L.yourScore}  dataKey={L.yourScore}  stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.2}  strokeWidth={2.5} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-xl font-bold text-primary mb-1">{ar ? 'تفصيل نتائج المجالات' : 'Segment Score Breakdown'}</h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? 'نتيجتكم لكل مجال مقارنةً بمتوسط الخليج والمتوسط العالمي والأفضل في الفئة.' : 'Your score per segment compared to GCC average, global average, and best-in-class.'}</p>
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="segment" tick={{ fontSize: 11, fontWeight: 600, fill: '#1E3A5F' }} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={L.yourScore}  fill="#0B3D91" radius={[4,4,0,0]} />
                <Bar dataKey={L.gccAvg}     fill="#22C55E" radius={[4,4,0,0]} opacity={0.7} />
                <Bar dataKey={L.globalAvg}  fill="#94A3B8" radius={[4,4,0,0]} opacity={0.6} />
                <Bar dataKey={L.bestClass}  fill="#C9A84C" radius={[4,4,0,0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-primary">{ar ? 'المقارنة المعيارية الكاملة' : 'Full Benchmark Comparison'}</h2>
            <p className="text-muted-foreground text-sm mt-1">{ar ? 'مقارنة مجالاً بمجال عبر جميع النقاط المرجعية الأربع.' : 'Segment-by-segment comparison across all four reference points.'}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3 font-bold text-primary">{ar ? 'المجال' : 'Segment'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'نتيجتك' : 'Your Score'}</th>
                  <th className="px-4 py-3 font-bold text-center text-green-700">{ar ? 'متوسط الخليج' : 'GCC Avg'}</th>
                  <th className="px-4 py-3 font-bold text-center text-slate-600">{ar ? 'المتوسط العالمي' : 'Global Avg'}</th>
                  <th className="px-4 py-3 font-bold text-center" style={{ color: '#C9A84C' }}>{ar ? 'الأفضل في الفئة' : 'Best-in-Class'}</th>
                  <th className="px-4 py-3 font-bold text-primary text-center">{ar ? 'المستوى' : 'Level'}</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map((seg, i) => {
                  const score  = segScore(i) ?? 0;
                  const level  = getLevel(score);
                  const vsGcc  = score - seg.benchmarks.gcc;
                  const vsBest = score - seg.benchmarks.best;
                  return (
                    <tr key={seg.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                            <seg.icon className="w-3.5 h-3.5" style={{ color: seg.color }} />
                          </div>
                          <span className="font-semibold text-foreground">{ar ? seg.shortTitleAr : seg.shortTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center"><span className="font-extrabold text-primary text-base">{score.toFixed(2)}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-muted-foreground">{seg.benchmarks.gcc}</span>
                        <span className={`ml-1.5 text-xs font-bold ${vsGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>{vsGcc >= 0 ? '+' : ''}{vsGcc.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground">{seg.benchmarks.global}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span style={{ color: '#C9A84C' }} className="font-medium">{seg.benchmarks.best}</span>
                        <span className="ml-1.5 text-xs font-bold text-muted-foreground">({vsBest.toFixed(1)})</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{ar ? level.labelAr : level.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td className="px-5 py-3.5 font-extrabold text-primary">{ar ? 'المتوسط الإجمالي' : 'Overall Average'}</td>
                  <td className="px-4 py-3.5 text-center font-extrabold text-primary text-base">{overallScore.toFixed(2)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.30</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">2.84</td>
                  <td className="px-4 py-3.5 text-center font-semibold" style={{ color: '#C9A84C' }}>4.44</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${overallLevel.bg} ${overallLevel.text} border ${overallLevel.border}`}>{ar ? overallLevel.labelAr : overallLevel.label}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Per-segment recommendations */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-2">{ar ? 'توصيات على مستوى المجال' : 'Segment-Level Recommendations'}</h2>
          <p className="text-muted-foreground text-sm mb-6">{ar ? 'إرشادات مصممة لكل مجال بناءً على مستوى نضجكم، من مَعِين الحقش MCIPS · CPSM.' : "Tailored guidance for each segment based on your maturity level, from Ma'in Alhaqash MCIPS · CPSM."}</p>
          <div className="grid md:grid-cols-2 gap-5">
            {SEGMENTS.map((seg, i) => {
              const score    = segScore(i) ?? 0;
              const level    = getLevel(score);
              const rec      = ar ? seg.recommendationsAr[level.label] : seg.recommendations[level.label];
              const gapToBest = seg.benchmarks.best - score;
              const gapToGcc  = score - seg.benchmarks.gcc;
              return (
                <div key={seg.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${level.border}`}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: seg.color + '18' }}>
                      <seg.icon className="w-5 h-5" style={{ color: seg.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-sm">{ar ? seg.titleAr : seg.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-primary font-extrabold">{score.toFixed(2)}</span>
                        <span className="text-muted-foreground text-xs">/5.0</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${level.bg} ${level.text} border ${level.border}`}>{ar ? level.labelAr : level.label}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-20">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: level.color }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>0</span><span>5</span></div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex gap-3 mb-3">
                      <span className={`text-xs font-bold ${gapToGcc >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gapToGcc >= 0 ? '↑' : '↓'} {Math.abs(gapToGcc).toFixed(1)} {ar ? 'مقابل متوسط الخليج' : 'vs GCC avg'}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">↑ {gapToBest.toFixed(1)} {ar ? 'للوصول إلى الأفضل في الفئة' : 'to best-in-class'}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{rec}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority action plan */}
        <div className="bg-[#082C6B] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-accent" />
            <h2 className="text-xl font-bold">{ar ? 'خطة العمل ذات الأولوية' : 'Priority Action Plan'}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {rankWeakest(
              SEGMENTS.map((seg, i) => ({ seg, i, score: segScore(i) ?? 0 })),
              item => item.score,
              3,
            )
              .map((item, rank) => (
                <div key={item.seg.id} className="bg-white/10 rounded-2xl p-5 border border-white/15">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">{rank + 1}</span>
                    <span className="text-xs font-bold text-accent uppercase tracking-widest">{ar ? `الأولوية ${rank + 1}` : `Priority ${rank + 1}`}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{ar ? item.seg.titleAr : item.seg.title}</h3>
                  <p className="text-white/60 text-xs">{ar ? 'النتيجة' : 'Score'}: {item.score.toFixed(2)} / 5.0 · {ar ? getLevel(item.score).labelAr : getLevel(item.score).label}</p>
                </div>
              ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                {ar ? "ناقش النتائج مع مَعِين" : "Discuss Results with Ma'in"} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
            <Button size="lg" variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary font-bold px-8"
              onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" /> {ar ? 'إعادة التقييم' : 'Retake Assessment'}
            </Button>
          </div>
        </div>

      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} tool="maturity" />
    </div>
  );
}
