import React, { useState } from 'react';
import { motion  } from 'framer-motion';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Target, TrendingUp, Shield, Leaf, Zap, BarChart3,
  GitBranch, BookOpen, Users, Rocket, Award, CheckCircle,
  ChevronRight, ArrowLeft, AlertTriangle, Globe, Cpu,
  FileText, ClipboardList, Star, Clock, DollarSign,
  Factory, Activity, Building2, Layers, RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

interface Framework { name: string; nameAr?: string; desc: string; descAr?: string; tools: string[]; toolsAr?: string[]; standard: string; }
interface KPIMetric { name: string; nameAr?: string; target: string; targetAr?: string; benchmark: string; benchmarkAr?: string; unit: string; unitAr?: string; }
interface KPICategory { category: string; categoryAr?: string; metrics: KPIMetric[]; }
interface QuickProject { title: string; titleAr?: string; duration: string; durationAr?: string; impact: string; impactAr?: string; }
interface IndustryProject { industry: string; industryAr?: string; quickWins: string[]; quickWinsAr?: string[]; projects: QuickProject[]; }
interface Challenge { challenge: string; challengeAr?: string; impact: string; impactAr?: string; solution: string; solutionAr?: string; framework: string; }
interface Achievement { title: string; titleAr?: string; client: string; industry: string; industryAr?: string; result: string; resultAr?: string; timeframe: string; timeframeAr?: string; }
interface SolutionData {
  slug: string; title: string; titleAr?: string; tagline: string; taglineAr?: string; description: string; descriptionAr?: string;
  icon: React.ElementType; color: string; bgGrad: string;
  frameworks: { strategic: Framework[]; tactical: Framework[]; operational: Framework[]; };
  kpis: KPICategory[];
  projects: IndustryProject[];
  challenges: Challenge[];
  achievements: Achievement[];
}

const SOLUTIONS: SolutionData[] = [
  {
    slug: 'supply-chain-strategy', title: 'Supply Chain Strategy', titleAr: 'استراتيجية سلسلة الإمداد', icon: Target, color: 'text-blue-600', bgGrad: 'from-blue-600 to-blue-800',
    tagline: 'End-to-end supply chain design aligned to your business objectives and Vision 2030.',
    taglineAr: 'تصميم سلسلة إمداد من طرف لطرف متوائم مع أهداف أعمالك ورؤية 2030.',
    description: 'A robust supply chain strategy defines how your organisation plans, sources, makes, delivers, and returns — aligned to corporate objectives and competitive requirements. ISC deploys APICS SCOR, network design, and S&OP frameworks to build strategies that are resilient, cost-effective, and built for the GCC growth trajectory.',
    descriptionAr: 'تحدّد استراتيجية سلسلة الإمداد المتينة كيف تخطّط مؤسستك وتورّد وتصنّع وتسلّم وتُرجِع — بمواءمة مع الأهداف المؤسسية والمتطلبات التنافسية. تنشر ISC أطر APICS SCOR وتصميم الشبكة وS&OP لبناء استراتيجيات مرنة وفعّالة من حيث التكلفة ومصمّمة لمسار النمو الخليجي.',
    frameworks: {
      strategic: [
        { name: 'APICS SCOR Model', nameAr: 'نموذج APICS SCOR', desc: 'Supply Chain Operations Reference framework covering Plan-Source-Make-Deliver-Return-Enable at executive level.', descAr: 'إطار مرجعي لعمليات سلسلة الإمداد يغطّي التخطيط-التوريد-التصنيع-التسليم-الإرجاع-التمكين على المستوى التنفيذي.', tools: ['Process benchmarking', 'Performance metrics', 'Best-practice gap analysis'], toolsAr: ['المقارنة المرجعية للعمليات', 'مقاييس الأداء', 'تحليل فجوات أفضل الممارسات'], standard: 'APICS SCOR 12.0' },
        { name: 'Supply Chain Network Design', nameAr: 'تصميم شبكة سلسلة الإمداد', desc: 'Mathematical optimisation of facility locations, inventory positioning, and transport modes.', descAr: 'تحسين رياضي لمواقع المنشآت وتموضع المخزون وأنماط النقل.', tools: ['Scenario modelling', 'Cost-to-serve analysis', 'Risk-adjusted network scoring'], toolsAr: ['نمذجة السيناريوهات', 'تحليل تكلفة الخدمة', 'تسجيل شبكي معدّل بالمخاطر'], standard: 'Gartner / MIT CTL' },
        { name: 'S&OP / IBP Framework', nameAr: 'إطار S&OP / IBP', desc: 'Integrated Business Planning aligning demand, supply, finance, and product strategy in monthly cadence.', descAr: 'تخطيط أعمال متكامل يوائم بين الطلب والعرض والمالية واستراتيجية المنتج بإيقاع شهري.', tools: ['Consensus demand planning', 'Supply review process', 'Financial reconciliation'], toolsAr: ['تخطيط طلب توافقي', 'عملية مراجعة العرض', 'التسوية المالية'], standard: 'Oliver Wight Class A' },
      ],
      tactical: [
        { name: 'Make-Buy-Partner Analysis', nameAr: 'تحليل التصنيع-الشراء-الشراكة', desc: 'Systematic evaluation of internal vs external production and sourcing decisions by category.', descAr: 'تقييم منهجي لقرارات الإنتاج والتوريد الداخلي مقابل الخارجي حسب الفئة.', tools: ['TCO modelling', 'Core competency mapping', 'Strategic sourcing matrix'], toolsAr: ['نمذجة التكلفة الإجمالية للملكية', 'رسم الكفاءات الجوهرية', 'مصفوفة التوريد الاستراتيجي'], standard: 'CIPS / McKinsey' },
        { name: 'SCOR Level 2 Process Mapping', nameAr: 'رسم عمليات SCOR المستوى 2', desc: 'Detailed process blueprint mapping all supply chain sub-processes against SCOR best-practice.', descAr: 'مخطط عمليات تفصيلي يربط كل العمليات الفرعية لسلسلة الإمداد بأفضل ممارسات SCOR.', tools: ['Process diagrams', 'RACI assignment', 'KPI cascade'], toolsAr: ['مخططات العمليات', 'إسناد RACI', 'تدرّج مؤشرات الأداء'], standard: 'APICS SCOR' },
        { name: 'SKU Rationalisation', nameAr: 'ترشيد أصناف المخزون (SKU)', desc: 'Elimination of low-velocity, high-complexity SKUs to reduce supply chain cost and complexity.', descAr: 'إلغاء الأصناف بطيئة الحركة عالية التعقيد لخفض تكلفة سلسلة الإمداد وتعقيدها.', tools: ['ABC-XYZ analysis', 'Profitability by SKU', 'Portfolio review'], toolsAr: ['تحليل ABC-XYZ', 'الربحية حسب الصنف', 'مراجعة المحفظة'], standard: 'Lean / CSCMP' },
      ],
      operational: [
        { name: 'KPI Cascade & Dashboard Design', nameAr: 'تدرّج المؤشرات وتصميم اللوحات', desc: 'Translating strategic objectives into operational KPIs visible to every team in real time.', descAr: 'ترجمة الأهداف الاستراتيجية إلى مؤشرات أداء تشغيلية مرئية لكل فريق لحظياً.', tools: ['Balanced Scorecard', 'Power BI dashboards', 'Daily management boards'], toolsAr: ['بطاقة الأداء المتوازن', 'لوحات Power BI', 'لوحات إدارة يومية'], standard: 'Kaplan & Norton BSC' },
        { name: 'SLA & SOP Framework', nameAr: 'إطار SLA وSOP', desc: 'Documented service level agreements and standard operating procedures for all supply chain processes.', descAr: 'اتفاقيات مستوى خدمة وإجراءات تشغيل معيارية موثّقة لجميع عمليات سلسلة الإمداد.', tools: ['SLA templates', 'SOP authoring', 'Escalation matrices'], toolsAr: ['قوالب SLA', 'كتابة SOP', 'مصفوفات التصعيد'], standard: 'ISO 9001 / CIPS' },
      ],
    },
    kpis: [
      { category: 'Delivery & Service', categoryAr: 'التسليم والخدمة', metrics: [
        { name: 'Perfect Order Rate', nameAr: 'معدّل الطلب المثالي', target: '>95%', benchmark: '91%', unit: '%' },
        { name: 'On-Time In-Full (OTIF)', nameAr: 'التسليم في الوقت وبالكامل (OTIF)', target: '>92%', benchmark: '88%', unit: '%' },
        { name: 'Customer Satisfaction Score', nameAr: 'درجة رضا العملاء', target: '>4.3/5', benchmark: '3.9/5', unit: '/5' },
      ]},
      { category: 'Cost & Efficiency', categoryAr: 'التكلفة والكفاءة', metrics: [
        { name: 'Supply Chain Cost as % Revenue', nameAr: 'تكلفة سلسلة الإمداد كنسبة من الإيراد', target: '<8%', benchmark: '11%', unit: '%' },
        { name: 'Cash-to-Cash Cycle Time', nameAr: 'زمن دورة النقد إلى النقد', target: '<28 days', targetAr: 'أقل من 28 يوماً', benchmark: '42 days', benchmarkAr: '42 يوماً', unit: 'days', unitAr: 'أيام' },
        { name: 'Inventory Turns', nameAr: 'دوران المخزون', target: '>10/yr', targetAr: '>10/سنة', benchmark: '7/yr', benchmarkAr: '7/سنة', unit: 'turns/yr', unitAr: 'دورة/سنة' },
      ]},
      { category: 'Agility & Resilience', categoryAr: 'الرشاقة والمرونة', metrics: [
        { name: 'Forecast Accuracy', nameAr: 'دقّة التوقّع', target: '>85%', benchmark: '72%', unit: '%' },
        { name: 'Supply Flexibility Index', nameAr: 'مؤشر مرونة التوريد', target: '>0.80', benchmark: '0.65', unit: 'index', unitAr: 'مؤشر' },
        { name: 'Recovery Time (disruption)', nameAr: 'زمن التعافي (الاضطراب)', target: '<72h', targetAr: 'أقل من 72 ساعة', benchmark: '5–7 days', benchmarkAr: '5–7 أيام', unit: 'hours', unitAr: 'ساعات' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['Map current SCOR processes (2 days)', 'Identify top 5 cost drivers from spend data', 'Baseline OTIF from ERP data'], quickWinsAr: ['رسم عمليات SCOR الحالية (يومان)', 'تحديد أعلى 5 محرّكات تكلفة من بيانات الإنفاق', 'تأسيس خط أساس OTIF من بيانات ERP'], projects: [{ title: 'Supply Chain Strategy Redesign', titleAr: 'إعادة تصميم استراتيجية سلسلة الإمداد', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '15–22% cost reduction', impactAr: 'خفض التكلفة 15–22%' }, { title: 'S&OP Implementation', titleAr: 'تطبيق S&OP', duration: '8 weeks', durationAr: '8 أسابيع', impact: '18% forecast accuracy improvement', impactAr: 'تحسّن دقّة التوقّع 18%' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Turnaround supply chain mapping', 'MRO inventory baseline audit', 'Logistics corridor cost analysis'], quickWinsAr: ['رسم سلسلة إمداد أعمال الإيقاف الدوري', 'تدقيق أساس مخزون الصيانة والتشغيل', 'تحليل تكلفة الممر اللوجستي'], projects: [{ title: 'Shutdown Planning Optimisation', titleAr: 'تحسين تخطيط الإيقاف', duration: '10 weeks', durationAr: '10 أسابيع', impact: '25% shutdown cost reduction', impactAr: 'خفض تكلفة الإيقاف 25%' }, { title: 'Local Content Strategy (Iktva)', titleAr: 'استراتيجية المحتوى المحلي (Iktva)', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Iktva score +12 points', impactAr: 'زيادة درجة Iktva بمقدار 12 نقطة' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['GTPL compliance gap assessment', 'Contract expiry calendar build', 'Spend category mapping'], quickWinsAr: ['تقييم فجوة امتثال GTPL', 'بناء تقويم انتهاء العقود', 'رسم فئات الإنفاق'], projects: [{ title: 'National Procurement Strategy', titleAr: 'استراتيجية مشتريات وطنية', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: 'SAR 50M+ addressable savings', impactAr: 'وفورات ممكنة تتجاوز 50 مليون ريال' }, { title: 'Vision 2030 SC Alignment', titleAr: 'مواءمة سلسلة الإمداد مع رؤية 2030', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'Iktva / local content roadmap', impactAr: 'خارطة طريق Iktva / المحتوى المحلي' }] },
      { industry: 'Pharma', industryAr: 'الأدوية', quickWins: ['Cold chain map (GDP compliance)', 'Supplier OTIF baseline', 'SFDA audit readiness check'], quickWinsAr: ['رسم سلسلة التبريد (امتثال GDP)', 'خط أساس OTIF للمورّد', 'فحص جاهزية تدقيق SFDA'], projects: [{ title: 'Pharma SC Network Design', titleAr: 'تصميم شبكة سلسلة إمداد الأدوية', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: '18% logistics cost saving', impactAr: 'توفير تكلفة لوجستية 18%' }, { title: 'Demand Planning Enhancement', titleAr: 'تعزيز تخطيط الطلب', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Stockout rate -60%', impactAr: 'خفض معدّل النفاد 60%' }] },
    ],
    challenges: [
      { challenge: 'Siloed functional planning — demand, supply, finance not aligned', challengeAr: 'تخطيط وظيفي منعزل — الطلب والعرض والمالية غير متوائمة', impact: 'Bullwhip effect, excess inventory, and missed service targets', impactAr: 'أثر السوط، ومخزون زائد، وإخفاق في أهداف الخدمة', solution: 'Deploy Integrated Business Planning (IBP) with monthly cross-functional rhythm and single agreed demand signal', solutionAr: 'نشر تخطيط الأعمال المتكامل (IBP) بإيقاع شهري متعدد الوظائف وإشارة طلب موحّدة متّفق عليها', framework: 'Oliver Wight IBP / APICS S&OP' },
      { challenge: 'No SCOR baseline — cannot measure supply chain performance objectively', challengeAr: 'لا يوجد خط أساس SCOR — يتعذّر قياس أداء سلسلة الإمداد موضوعياً', impact: 'Decisions driven by opinion rather than data; benchmarking impossible', impactAr: 'قرارات مبنية على الرأي بدلاً من البيانات؛ المقارنة المرجعية مستحيلة', solution: 'Run SCOR diagnostic to establish baseline KPIs and compare against GCC industry peers', solutionAr: 'إجراء تشخيص SCOR لتأسيس مؤشرات أداء أساسية ومقارنتها بنظرائها في قطاعات الخليج', framework: 'APICS SCOR 12.0' },
      { challenge: 'Supply chain strategy disconnected from corporate strategy', challengeAr: 'استراتيجية سلسلة الإمداد منفصلة عن الاستراتيجية المؤسسية', impact: 'Investment misaligned; supply chain reactive rather than enabling growth', impactAr: 'استثمار غير متوائم؛ سلسلة إمداد تفاعلية بدلاً من ممكّنة للنمو', solution: 'Cascade corporate objectives into supply chain strategy using Balanced Scorecard and SCOR alignment workshops', solutionAr: 'تدرّج الأهداف المؤسسية في استراتيجية سلسلة الإمداد باستخدام بطاقة الأداء المتوازن وورش مواءمة SCOR', framework: 'BSC / Ansoff / Porter' },
      { challenge: 'Over-reliance on single supplier or logistics corridor', challengeAr: 'اعتماد مفرط على مورّد واحد أو ممر لوجستي واحد', impact: 'High disruption risk — Red Sea, COVID-19, port closures expose concentration', impactAr: 'مخاطر اضطراب عالية — البحر الأحمر وكوفيد-19 وإغلاق الموانئ تكشف التركّز', solution: 'Dual-source strategy, network re-design, and supply risk segmentation', solutionAr: 'استراتيجية توريد ثنائي، وإعادة تصميم الشبكة، وتقسيم مخاطر التوريد', framework: 'ISO 31000 / APICS SCOR-DS' },
      { challenge: 'ERP data quality prevents meaningful analytics', challengeAr: 'جودة بيانات ERP تمنع تحليلات ذات معنى', impact: 'Forecasting, inventory, and supplier KPIs unreliable', impactAr: 'مؤشرات التوقّع والمخزون والمورّدين غير موثوقة', solution: 'Data governance programme: master data cleanse, field mapping, and dashboard rebuild in Power BI', solutionAr: 'برنامج حوكمة بيانات: تنظيف البيانات الرئيسية، وربط الحقول، وإعادة بناء اللوحات في Power BI', framework: 'ISO 8000 Data Quality' },
    ],
    achievements: [
      { title: 'Perfect Order Rate lifted from 78% → 95%', titleAr: 'رفع معدّل الطلب المثالي من 78% إلى 95%', client: 'Saudi petrochemical distributor', industry: 'Energy', industryAr: 'الطاقة', result: 'Full SCOR Level 2 redesign, S&OP deployed, inventory cut by 22%', resultAr: 'إعادة تصميم كاملة لـ SCOR المستوى 2، ونشر S&OP، وخفض المخزون 22%', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' },
      { title: 'SAR 34M supply chain cost reduction', titleAr: 'خفض تكلفة سلسلة الإمداد بمقدار 34 مليون ريال', client: 'Government procurement entity', industry: 'Government', industryAr: 'الحكومة', result: 'Network redesign, supplier rationalisation, policy governance rebuild', resultAr: 'إعادة تصميم الشبكة، وترشيد المورّدين، وإعادة بناء حوكمة السياسات', timeframe: '6 months', timeframeAr: '6 أشهر' },
      { title: 'Iktva score 31% → 48% in 12 months', titleAr: 'درجة Iktva من 31% إلى 48% خلال 12 شهراً', client: 'GCC energy contractor', industry: 'Energy', industryAr: 'الطاقة', result: 'Local content strategy, supplier development programme, IKTVA reporting system', resultAr: 'استراتيجية المحتوى المحلي، وبرنامج تطوير المورّدين، ونظام تقارير IKTVA', timeframe: '12 months', timeframeAr: '12 شهراً' },
    ],
  },
  {
    slug: 'procurement-excellence', title: 'Procurement Excellence', titleAr: 'التميّز في المشتريات', icon: Award, color: 'text-amber-600', bgGrad: 'from-amber-600 to-amber-800',
    tagline: 'Strategic sourcing, supplier transformation, and procurement capability that delivers measurable savings.',
    taglineAr: 'توريد استراتيجي، وتحوّل للمورّدين، وقدرة مشتريات تحقّق وفورات قابلة للقياس.',
    description: 'Procurement Excellence transforms procurement from a transactional function to a strategic value driver. ISC deploys CIPS Category Management, Kraljic segmentation, and strategic sourcing methodologies to identify, capture, and sustain savings while building governance and resilience.',
    descriptionAr: 'يحوّل التميّز في المشتريات وظيفة المشتريات من دور معاملاتي إلى محرّك قيمة استراتيجي. تنشر ISC منهجيات إدارة الفئات من CIPS، وتقسيم Kraljic، والتوريد الاستراتيجي لتحديد الوفورات والتقاطها والحفاظ عليها مع بناء الحوكمة والمرونة.',
    frameworks: {
      strategic: [
        { name: 'CIPS Category Management', nameAr: 'إدارة الفئات من CIPS', desc: '7-step category management process: define scope, profile category, create strategy, generate options, select strategy, implement, review.', descAr: 'عملية إدارة فئات من 7 خطوات: تحديد النطاق، وتوصيف الفئة، وإنشاء الاستراتيجية، وتوليد الخيارات، واختيار الاستراتيجية، والتنفيذ، والمراجعة.', tools: ['Category profile', 'Spend analysis', 'Market intelligence', 'Category strategy'], toolsAr: ['ملف الفئة', 'تحليل الإنفاق', 'ذكاء السوق', 'استراتيجية الفئة'], standard: 'CIPS Level 6' },
        { name: 'Spend Portfolio Matrix', nameAr: 'مصفوفة محفظة الإنفاق', desc: 'Strategic mapping of all spend categories by business impact and supply market complexity.', descAr: 'رسم استراتيجي لجميع فئات الإنفاق حسب الأثر على الأعمال وتعقيد سوق التوريد.', tools: ['Spend segmentation', 'Strategic sourcing matrix', 'Category prioritisation'], toolsAr: ['تقسيم الإنفاق', 'مصفوفة التوريد الاستراتيجي', 'ترتيب أولوية الفئات'], standard: 'Kearney Purchasing Chessboard' },
        { name: 'Make-vs-Buy Strategic Decision', nameAr: 'قرار التصنيع مقابل الشراء الاستراتيجي', desc: 'Structured framework to evaluate which activities to retain internally versus outsource.', descAr: 'إطار منظّم لتقييم الأنشطة التي تُبقى داخلياً مقابل ما يُسنَد خارجياً.', tools: ['TCO modelling', 'Core competency mapping', 'Risk-adjusted analysis'], toolsAr: ['نمذجة التكلفة الإجمالية للملكية', 'رسم الكفاءات الجوهرية', 'تحليل معدّل بالمخاطر'], standard: 'CIPS / Deloitte' },
      ],
      tactical: [
        { name: 'Kraljic Supplier Segmentation', nameAr: 'تقسيم المورّدين بنموذج Kraljic', desc: 'Segment all suppliers by spend impact (high/low) and supply risk (high/low) to define relationship and negotiation strategies.', descAr: 'تقسيم جميع المورّدين حسب أثر الإنفاق (مرتفع/منخفض) ومخاطر التوريد (مرتفعة/منخفضة) لتحديد استراتيجيات العلاقة والتفاوض.', tools: ['Supplier mapping', 'Category risk scoring', 'Portfolio optimisation'], toolsAr: ['رسم المورّدين', 'تسجيل مخاطر الفئة', 'تحسين المحفظة'], standard: 'Harvard Business Review / CIPS' },
        { name: 'Strategic Sourcing (5-Step)', nameAr: 'التوريد الاستراتيجي (5 خطوات)', desc: 'Structured sourcing process: market analysis → RFI/RFQ → evaluation → negotiation → award/contract.', descAr: 'عملية توريد منظّمة: تحليل السوق ← RFI/RFQ ← التقييم ← التفاوض ← الترسية/التعاقد.', tools: ['RFx templates', 'Supplier scoring matrix', 'Negotiation planner'], toolsAr: ['قوالب RFx', 'مصفوفة تقييم المورّدين', 'مخطّط التفاوض'], standard: 'CIPS / APICS' },
        { name: 'SLA & KPI Framework', nameAr: 'إطار SLA ومؤشرات الأداء', desc: 'Define, negotiate, and govern service level agreements with all key suppliers.', descAr: 'تحديد اتفاقيات مستوى الخدمة مع جميع المورّدين الرئيسيين والتفاوض عليها وحوكمتها.', tools: ['SLA library', 'KPI scorecard', 'Penalty/incentive design'], toolsAr: ['مكتبة SLA', 'بطاقة مؤشرات الأداء', 'تصميم الغرامات/الحوافز'], standard: 'IACCM / CIPS' },
      ],
      operational: [
        { name: 'Purchase-to-Pay (P2P) Optimisation', nameAr: 'تحسين الشراء حتى الدفع (P2P)', desc: 'Streamline the end-to-end P2P process: requisition → approval → PO → receipt → invoice → payment.', descAr: 'تبسيط عملية P2P من طرف لطرف: الطلب ← الاعتماد ← أمر الشراء ← الاستلام ← الفاتورة ← الدفع.', tools: ['P2P workflow design', '3-way match', 'Exception management'], toolsAr: ['تصميم سير عمل P2P', 'المطابقة الثلاثية', 'إدارة الاستثناءات'], standard: 'APICS / SAP Best Practice' },
        { name: 'Catalogue & Contract Management', nameAr: 'إدارة الكتالوجات والعقود', desc: 'Deploy approved product catalogues and contract-backed pricing to eliminate maverick spend.', descAr: 'نشر كتالوجات منتجات معتمدة وتسعير مدعوم بالعقود لإزالة الإنفاق غير المنظّم.', tools: ['Catalogue design', 'Contracted price management', 'Compliance monitoring'], toolsAr: ['تصميم الكتالوج', 'إدارة الأسعار التعاقدية', 'مراقبة الامتثال'], standard: 'CIPS / Ariba' },
      ],
    },
    kpis: [
      { category: 'Cost Performance', categoryAr: 'أداء التكلفة', metrics: [
        { name: 'Procurement Savings (% of spend)', nameAr: 'وفورات المشتريات (% من الإنفاق)', target: '8–15%', benchmark: '6.2%', unit: '%' },
        { name: 'Cost Avoidance', nameAr: 'تجنّب التكلفة', target: '>5%', benchmark: '3.1%', unit: '% of spend', unitAr: '% من الإنفاق' },
        { name: 'Total Cost of Ownership Reduction', nameAr: 'خفض التكلفة الإجمالية للملكية', target: '>10%', benchmark: '7%', unit: '%' },
      ]},
      { category: 'Speed & Efficiency', categoryAr: 'السرعة والكفاءة', metrics: [
        { name: 'Procurement Cycle Time', nameAr: 'زمن دورة المشتريات', target: '<10 days', targetAr: 'أقل من 10 أيام', benchmark: '18 days', benchmarkAr: '18 يوماً', unit: 'days', unitAr: 'أيام' },
        { name: 'PO Approval Cycle Time', nameAr: 'زمن دورة اعتماد أمر الشراء', target: '<2 days', targetAr: 'أقل من يومين', benchmark: '5.5 days', benchmarkAr: '5.5 أيام', unit: 'days', unitAr: 'أيام' },
        { name: 'Time-to-Contract (from RFQ)', nameAr: 'الزمن حتى التعاقد (من RFQ)', target: '<28 days', targetAr: 'أقل من 28 يوماً', benchmark: '47 days', benchmarkAr: '47 يوماً', unit: 'days', unitAr: 'أيام' },
      ]},
      { category: 'Compliance & Quality', categoryAr: 'الامتثال والجودة', metrics: [
        { name: 'PO Compliance Rate', nameAr: 'معدّل امتثال أوامر الشراء', target: '>92%', benchmark: '78%', unit: '%' },
        { name: 'Supplier OTIF', nameAr: 'OTIF المورّد', target: '>94%', benchmark: '86%', unit: '%' },
        { name: 'Contract Coverage of Spend', nameAr: 'تغطية العقود للإنفاق', target: '>88%', benchmark: '66%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['Standardise MRO spec sheets & consolidate to 3 suppliers', 'Implement 3-way PO match in ERP', 'Create approved supplier list for top 20 categories'], quickWinsAr: ['توحيد أوراق مواصفات الصيانة والتشغيل ودمجها في 3 مورّدين', 'تطبيق المطابقة الثلاثية لأوامر الشراء في ERP', 'إنشاء قائمة مورّدين معتمدين لأعلى 20 فئة'], projects: [{ title: 'Strategic Sourcing Programme', titleAr: 'برنامج التوريد الاستراتيجي', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '12–18% spend savings', impactAr: 'وفورات إنفاق 12–18%' }, { title: 'Supplier Consolidation', titleAr: 'دمج المورّدين', duration: '8 weeks', durationAr: '8 أسابيع', impact: '25% supplier base reduction', impactAr: 'خفض قاعدة المورّدين 25%' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Map all sole-source contracts — flag risk', 'Renegotiate top 5 spend contracts', 'Issue Supplier Code of Conduct'], quickWinsAr: ['رسم جميع عقود المصدر الوحيد — وتمييز المخاطر', 'إعادة التفاوض على أعلى 5 عقود إنفاق', 'إصدار مدوّنة سلوك المورّدين'], projects: [{ title: 'Category Management Rollout', titleAr: 'إطلاق إدارة الفئات', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'SAR 8–15M savings pipeline', impactAr: 'خطّ وفورات 8–15 مليون ريال' }, { title: 'Local Content (Iktva) Programme', titleAr: 'برنامج المحتوى المحلي (Iktva)', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: 'Iktva score +10–15 points', impactAr: 'زيادة درجة Iktva 10–15 نقطة' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['GTPL compliance audit', 'Prequalification vendor list refresh', 'Tender evaluation template standardisation'], quickWinsAr: ['تدقيق امتثال GTPL', 'تحديث قائمة الموردين المؤهّلين مسبقاً', 'توحيد قالب تقييم المناقصات'], projects: [{ title: 'Government Procurement Transformation', titleAr: 'تحوّل المشتريات الحكومية', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: 'SAR 20M+ addressable savings', impactAr: 'وفورات ممكنة تتجاوز 20 مليون ريال' }, { title: 'e-Procurement Platform Deployment', titleAr: 'نشر منصة المشتريات الإلكترونية', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: '40% cycle time reduction', impactAr: 'خفض زمن الدورة 40%' }] },
      { industry: 'Retail & FMCG', industryAr: 'التجزئة والسلع الاستهلاكية', quickWins: ['Supplier OTIF baseline report', 'Top 10 product categories spend analysis', 'Renegotiate payment terms to +15 days'], quickWinsAr: ['تقرير أساس OTIF للمورّد', 'تحليل إنفاق أعلى 10 فئات منتجات', 'إعادة التفاوض على شروط الدفع إلى +15 يوماً'], projects: [{ title: 'FMCG Procurement Strategy', titleAr: 'استراتيجية مشتريات السلع الاستهلاكية', duration: '10 weeks', durationAr: '10 أسابيع', impact: '10% COGS reduction', impactAr: 'خفض تكلفة البضاعة المباعة 10%' }, { title: 'Demand-Driven Procurement', titleAr: 'مشتريات مدفوعة بالطلب', duration: '8 weeks', durationAr: '8 أسابيع', impact: '30% inventory reduction', impactAr: 'خفض المخزون 30%' }] },
    ],
    challenges: [
      { challenge: 'No strategic sourcing process — all procurement is reactive/spot-buying', challengeAr: 'لا توجد عملية توريد استراتيجي — كل المشتريات تفاعلية/شراء فوري', impact: '20–35% overspend vs contracted rates; no leverage with suppliers', impactAr: 'إنفاق زائد 20–35% مقابل الأسعار التعاقدية؛ لا نفوذ لدى المورّدين', solution: 'Deploy 5-step strategic sourcing process with category-by-category rollout, starting with top 5 spend categories', solutionAr: 'نشر عملية توريد استراتيجي من 5 خطوات بإطلاق فئة تلو الأخرى، بدءاً من أعلى 5 فئات إنفاق', framework: 'CIPS Strategic Sourcing' },
      { challenge: 'Procurement team viewed as "purchase order clerks" — no influence at strategy table', challengeAr: 'يُنظر إلى فريق المشتريات كـ"كتبة أوامر شراء" — بلا نفوذ على طاولة الاستراتيجية', impact: 'Value not captured; procurement becomes order-taking rather than value creation', impactAr: 'القيمة غير مُلتقطة؛ تصبح المشتريات تلقّياً للطلبات بدلاً من خلق القيمة', solution: 'Capability building programme + senior stakeholder engagement + quick-win delivery to build credibility', solutionAr: 'برنامج بناء قدرات + إشراك أصحاب المصلحة الكبار + تحقيق مكاسب سريعة لبناء المصداقية', framework: 'CIPS Procurement Leadership' },
      { challenge: 'High maverick spend — purchases made outside procurement process', challengeAr: 'إنفاق غير منظّم مرتفع — مشتريات تتم خارج عملية المشتريات', impact: 'Contract leakage, compliance risk, inflated costs', impactAr: 'تسرّب العقود، ومخاطر امتثال، وتكاليف متضخّمة', solution: 'P2P policy enforcement, catalogue deployment, approval workflow automation, spend analytics monitoring', solutionAr: 'إنفاذ سياسة P2P، ونشر الكتالوجات، وأتمتة سير عمل الاعتماد، ومراقبة تحليلات الإنفاق', framework: 'CIPS Policy Framework' },
      { challenge: 'Supplier quality and OTIF failures disrupting operations', challengeAr: 'إخفاقات جودة المورّد وOTIF تعطّل العمليات', impact: 'Production downtime, customer dissatisfaction, emergency expediting costs', impactAr: 'توقّف الإنتاج، وعدم رضا العملاء، وتكاليف تعجيل طارئة', solution: 'Supplier scorecard programme with quarterly business reviews, corrective action plans, and escalation thresholds', solutionAr: 'برنامج بطاقة أداء المورّدين مع مراجعات أعمال ربع سنوية، وخطط إجراء تصحيحي، وعتبات تصعيد', framework: 'CIPS SRM / ISO 9001' },
      { challenge: 'No TCO visibility — buying on price only', challengeAr: 'لا وضوح للتكلفة الإجمالية للملكية — الشراء على أساس السعر فقط', impact: 'Lowest-price supplier delivers highest total cost when quality, rework, and logistics are included', impactAr: 'المورّد الأقل سعراً يقدّم أعلى تكلفة إجمالية عند احتساب الجودة وإعادة العمل والخدمات اللوجستية', solution: 'TCO modelling for all strategic categories; integrate quality, logistics, and relationship costs into bid evaluation', solutionAr: 'نمذجة التكلفة الإجمالية للملكية لجميع الفئات الاستراتيجية؛ ودمج تكاليف الجودة والخدمات اللوجستية والعلاقة في تقييم العروض', framework: 'CIPS TCO / Kearney' },
    ],
    achievements: [
      { title: 'Procurement cycle cut from 28 → 9 days', titleAr: 'خفض دورة المشتريات من 28 إلى 9 أيام', client: 'Saudi petrochemical company', industry: 'Energy', industryAr: 'الطاقة', result: 'P2P redesign, ERP workflow automation, approval matrix restructure', resultAr: 'إعادة تصميم P2P، وأتمتة سير عمل ERP، وإعادة هيكلة مصفوفة الاعتماد', timeframe: '14 weeks', timeframeAr: '14 أسبوعاً' },
      { title: '$4.2M savings in 14 months', titleAr: 'وفورات 4.2 مليون دولار خلال 14 شهراً', client: 'Jordanian manufacturing group', industry: 'Manufacturing', industryAr: 'التصنيع', result: 'Category management deployed across 8 categories, 3-year strategic contracts negotiated', resultAr: 'نشر إدارة الفئات عبر 8 فئات، والتفاوض على عقود استراتيجية مدّتها 3 سنوات', timeframe: '14 months', timeframeAr: '14 شهراً' },
      { title: 'Iktva compliance achieved — contract awarded', titleAr: 'تحقيق امتثال Iktva — وترسية العقد', client: 'Saudi energy contractor (EPC)', industry: 'Energy', industryAr: 'الطاقة', result: 'Local supplier development programme, Iktva reporting system, strategic sourcing aligned to IKTVA targets', resultAr: 'برنامج تطوير مورّدين محليين، ونظام تقارير Iktva، وتوريد استراتيجي متوائم مع أهداف IKTVA', timeframe: '12 months', timeframeAr: '12 شهراً' },
    ],
  },
  {
    slug: 'risk-management-solution', title: 'Risk Management', titleAr: 'إدارة المخاطر', icon: Shield, color: 'text-red-600', bgGrad: 'from-red-600 to-red-800',
    tagline: 'Proactive, ISO 31000-aligned supply chain risk identification, assessment, and mitigation.',
    taglineAr: 'تحديد وتقييم وتخفيف مخاطر سلسلة الإمداد بشكل استباقي ومتوائم مع ISO 31000.',
    description: 'Supply chain risk management protects revenue, reputation, and operational continuity. ISC deploys ISO 31000:2018, APICS SCOR risk dimension, and FMEA frameworks to build proactive risk registers, heat maps, and business continuity plans that keep your supply chain operational under stress.',
    descriptionAr: 'تحمي إدارة مخاطر سلسلة الإمداد الإيرادات والسمعة واستمرارية العمليات. تنشر ISC أطر ISO 31000:2018، وبُعد المخاطر في APICS SCOR، وFMEA لبناء سجلّات مخاطر استباقية، وخرائط حرارية، وخطط استمرارية أعمال تُبقي سلسلة إمدادك عاملة تحت الضغط.',
    frameworks: {
      strategic: [
        { name: 'ISO 31000:2018 Risk Framework', nameAr: 'إطار المخاطر ISO 31000:2018', desc: 'International standard for enterprise risk management — principles, framework, and process aligned to supply chain operations.', descAr: 'معيار دولي لإدارة مخاطر المؤسسة — مبادئ وإطار وعملية متوائمة مع عمليات سلسلة الإمداد.', tools: ['Risk appetite statement', 'Risk governance structure', 'Board risk reporting'], toolsAr: ['بيان قابلية تحمّل المخاطر', 'هيكل حوكمة المخاطر', 'تقارير المخاطر للمجلس'], standard: 'ISO 31000:2018' },
        { name: 'APICS SCOR Risk Dimension', nameAr: 'بُعد المخاطر في APICS SCOR', desc: 'Supply chain risk assessment embedded within the SCOR model — risk by plan/source/make/deliver process.', descAr: 'تقييم مخاطر سلسلة الإمداد مضمّن داخل نموذج SCOR — المخاطر حسب عملية التخطيط/التوريد/التصنيع/التسليم.', tools: ['SCOR risk mapping', 'Disruption scenario analysis', 'Recovery strategy design'], toolsAr: ['رسم مخاطر SCOR', 'تحليل سيناريوهات الاضطراب', 'تصميم استراتيجية التعافي'], standard: 'APICS SCOR 12.0' },
        { name: 'Enterprise Supply Chain Risk Register', nameAr: 'سجلّ مخاطر سلسلة الإمداد المؤسسي', desc: 'Board-level risk register covering strategic, operational, financial, compliance, and reputational supply chain risks.', descAr: 'سجلّ مخاطر على مستوى المجلس يغطّي المخاطر الاستراتيجية والتشغيلية والمالية والامتثالية والسمعة.', tools: ['Risk identification workshops', 'Risk heat map', 'Quarterly risk review'], toolsAr: ['ورش تحديد المخاطر', 'خريطة حرارية للمخاطر', 'مراجعة مخاطر ربع سنوية'], standard: 'ISO 31000 / CIPS' },
      ],
      tactical: [
        { name: 'Dual/Multi-Source Strategy', nameAr: 'استراتيجية التوريد الثنائي/المتعدّد', desc: 'For every critical category: qualify and pre-negotiate with secondary suppliers before the primary supplier fails.', descAr: 'لكل فئة حرجة: تأهيل المورّدين الثانويين والتفاوض المسبق معهم قبل إخفاق المورّد الأساسي.', tools: ['Criticality assessment', 'Alternate supplier qualification', 'Split-award contracts'], toolsAr: ['تقييم الأهمية الحرجة', 'تأهيل مورّد بديل', 'عقود ترسية مجزّأة'], standard: 'CIPS Procurement Risk' },
        { name: 'FMEA (Failure Mode & Effects Analysis)', nameAr: 'تحليل أنماط الإخفاق وآثارها (FMEA)', desc: 'Structured analysis of potential failure points in supply chain processes and their effects on operations.', descAr: 'تحليل منظّم لنقاط الإخفاق المحتملة في عمليات سلسلة الإمداد وآثارها على العمليات.', tools: ['FMEA worksheet', 'RPN scoring (Severity × Occurrence × Detection)', 'Control plan'], toolsAr: ['ورقة عمل FMEA', 'تسجيل RPN (الخطورة × التكرار × الاكتشاف)', 'خطة الضبط'], standard: 'AIAG FMEA / IEC 60812' },
        { name: 'Business Continuity Planning (BCP)', nameAr: 'تخطيط استمرارية الأعمال (BCP)', desc: 'Documented plans for supply chain recovery from major disruptions — covering alternate sourcing, logistics, and communication.', descAr: 'خطط موثّقة لتعافي سلسلة الإمداد من الاضطرابات الكبرى — تغطّي التوريد البديل والخدمات اللوجستية والتواصل.', tools: ['BCP template', 'Incident response RACI', 'Recovery milestone tracker'], toolsAr: ['قالب BCP', 'RACI للاستجابة للحوادث', 'متتبّع معالم التعافي'], standard: 'ISO 22301' },
      ],
      operational: [
        { name: 'Supplier Risk Scoring', nameAr: 'تسجيل مخاطر المورّدين', desc: 'Continuous risk assessment of all strategic suppliers across financial health, geographic risk, ESG, and operational capability.', descAr: 'تقييم مستمر لمخاطر جميع المورّدين الاستراتيجيين عبر الصحة المالية والمخاطر الجغرافية وESG والقدرة التشغيلية.', tools: ['Supplier risk scorecard', 'Financial health monitoring', 'ESG screening'], toolsAr: ['بطاقة مخاطر المورّد', 'مراقبة الصحة المالية', 'فحص ESG'], standard: 'CIPS SRM / Dun & Bradstreet' },
        { name: 'Daily Risk Monitoring & Incident Response', nameAr: 'المراقبة اليومية للمخاطر والاستجابة للحوادث', desc: 'Real-time monitoring of supply chain risk signals with defined escalation and response protocols.', descAr: 'مراقبة لحظية لإشارات مخاطر سلسلة الإمداد مع بروتوكولات تصعيد واستجابة محدّدة.', tools: ['Risk dashboard (KRIs)', 'Incident log', 'Escalation matrix'], toolsAr: ['لوحة مخاطر (KRIs)', 'سجلّ الحوادث', 'مصفوفة التصعيد'], standard: 'ISO 31000 / SAP Risk' },
      ],
    },
    kpis: [
      { category: 'Risk Coverage', categoryAr: 'تغطية المخاطر', metrics: [
        { name: 'Supplier Risk Coverage (% assessed)', nameAr: 'تغطية مخاطر المورّدين (% المقيَّم)', target: '>90%', benchmark: '62%', unit: '%' },
        { name: 'Tier-1 Dual-Source Coverage', nameAr: 'تغطية التوريد الثنائي للمستوى 1', target: '>70%', benchmark: '45%', unit: '%' },
        { name: 'BCP Test Completion (annual)', nameAr: 'إتمام اختبار BCP (سنوي)', target: '100%', benchmark: '58%', unit: '%' },
      ]},
      { category: 'Response Performance', categoryAr: 'أداء الاستجابة', metrics: [
        { name: 'Risk Incident Response Time', nameAr: 'زمن الاستجابة لحادث المخاطر', target: '<48 hours', targetAr: 'أقل من 48 ساعة', benchmark: '5.2 days', benchmarkAr: '5.2 أيام', unit: 'hours', unitAr: 'ساعات' },
        { name: 'Recovery Time Objective (RTO)', nameAr: 'هدف زمن التعافي (RTO)', target: '<72 hours', targetAr: 'أقل من 72 ساعة', benchmark: 'Not defined', benchmarkAr: 'غير محدّد', unit: 'hours', unitAr: 'ساعات' },
        { name: 'Disruption Cost as % Revenue', nameAr: 'تكلفة الاضطراب كنسبة من الإيراد', target: '<0.5%', benchmark: '1.8%', unit: '%' },
      ]},
      { category: 'Governance', categoryAr: 'الحوكمة', metrics: [
        { name: 'Risk Register Review Frequency', nameAr: 'تكرار مراجعة سجلّ المخاطر', target: 'Quarterly', targetAr: 'ربع سنوي', benchmark: 'Annual/ad hoc', benchmarkAr: 'سنوي/عشوائي', unit: 'cadence', unitAr: 'إيقاع' },
        { name: 'Risk Owner Assignment', nameAr: 'إسناد مالك المخاطر', target: '100%', benchmark: '71%', unit: '%' },
        { name: 'Critical Risk Mitigation Implementation', nameAr: 'تطبيق تخفيف المخاطر الحرجة', target: '>85%', benchmark: '52%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Map all sole-source suppliers for critical MRO', 'Run supplier financial health check on top 20 vendors', 'Activate BCP review for Red Sea logistics corridor'], quickWinsAr: ['رسم جميع موردي المصدر الوحيد لمواد الصيانة والتشغيل الحرجة', 'إجراء فحص صحة مالية لأعلى 20 مورّداً', 'تفعيل مراجعة BCP لممر البحر الأحمر اللوجستي'], projects: [{ title: 'Supply Chain Risk Register Build', titleAr: 'بناء سجلّ مخاطر سلسلة الإمداد', duration: '6 weeks', durationAr: '6 أسابيع', impact: 'Full visibility of top 25 risks with owners', impactAr: 'وضوح كامل لأعلى 25 خطراً مع الملّاك' }, { title: 'Dual-Source Programme — Critical Items', titleAr: 'برنامج التوريد الثنائي — الأصناف الحرجة', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'Single-source dependency reduced 40%', impactAr: 'خفض الاعتماد على المصدر الوحيد 40%' }] },
      { industry: 'Pharma', industryAr: 'الأدوية', quickWins: ['GDP compliance audit on cold chain logistics', 'SFDA supplier qualification status review', 'API sole-source risk flag'], quickWinsAr: ['تدقيق امتثال GDP للوجستيات سلسلة التبريد', 'مراجعة حالة تأهيل مورّدي SFDA', 'تمييز مخاطر المصدر الوحيد للمكوّن الفعّال (API)'], projects: [{ title: 'Pharma BCP — Supply Risk', titleAr: 'BCP للأدوية — مخاطر التوريد', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'ISO 22301 aligned BCP for critical APIs', impactAr: 'BCP متوائم مع ISO 22301 للمكوّنات الفعّالة الحرجة' }, { title: 'Multi-Source Strategy (Active Ingredients)', titleAr: 'استراتيجية التوريد المتعدّد (المكوّنات الفعّالة)', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: '60% reduction in supply risk exposure', impactAr: 'خفض التعرّض لمخاطر التوريد 60%' }] },
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['FMEA on production supply inputs', 'Safety stock recalculation for top 20 components', 'Supplier risk score baseline'], quickWinsAr: ['FMEA على مدخلات إمداد الإنتاج', 'إعادة حساب مخزون الأمان لأعلى 20 مكوّناً', 'خط أساس درجة مخاطر المورّد'], projects: [{ title: 'Production Supply Risk Mitigation', titleAr: 'تخفيف مخاطر إمداد الإنتاج', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'Production downtime risk reduced 35%', impactAr: 'خفض مخاطر توقّف الإنتاج 35%' }, { title: 'Supply Chain Stress Test', titleAr: 'اختبار ضغط سلسلة الإمداد', duration: '4 weeks', durationAr: '4 أسابيع', impact: 'Disruption scenario playbook', impactAr: 'دليل سيناريوهات الاضطراب' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Compliance risk assessment (GTPL)', 'Contract risk flag — expiring >SAR 1M', 'Supplier financial risk screen'], quickWinsAr: ['تقييم مخاطر الامتثال (GTPL)', 'تمييز مخاطر العقود المنتهية بأكثر من مليون ريال', 'فحص المخاطر المالية للمورّدين'], projects: [{ title: 'Government SC Risk Framework', titleAr: 'إطار مخاطر سلسلة الإمداد الحكومية', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'ISO 31000 risk register + quarterly review', impactAr: 'سجلّ مخاطر ISO 31000 + مراجعة ربع سنوية' }, { title: 'Regulatory Compliance Programme', titleAr: 'برنامج الامتثال التنظيمي', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'GTPL audit readiness score >90%', impactAr: 'درجة جاهزية تدقيق GTPL تتجاوز 90%' }] },
    ],
    challenges: [
      { challenge: 'Risk is reactive — disruptions discovered only when operations stop', challengeAr: 'المخاطر تفاعلية — تُكتشف الاضطرابات فقط عند توقّف العمليات', impact: 'Revenue loss, emergency spend, customer penalties averaging 6–8% annual revenue', impactAr: 'خسارة إيرادات، وإنفاق طارئ، وغرامات عملاء بمتوسّط 6–8% من الإيراد السنوي', solution: 'Deploy real-time risk monitoring with KRI dashboards, supplier alerts, and structured weekly risk review meetings', solutionAr: 'نشر مراقبة مخاطر لحظية بلوحات KRI، وتنبيهات المورّدين، واجتماعات مراجعة مخاطر أسبوعية منظّمة', framework: 'ISO 31000 / APICS SCOR' },
      { challenge: 'No visibility beyond Tier-1 suppliers — Tier-2/3 blind spots', challengeAr: 'لا وضوح لما بعد موردي المستوى 1 — نقاط عمياء في المستوى 2/3', impact: 'Sub-tier disruptions cascade to operations without warning (e.g. 2021 semiconductor shortage)', impactAr: 'تتدرّج اضطرابات المستويات الأدنى إلى العمليات دون إنذار (مثل نقص أشباه الموصلات 2021)', solution: 'Supplier mapping exercise, Tier-2 disclosure requirements in contracts, and digital supply chain mapping tools', solutionAr: 'تمرين رسم المورّدين، ومتطلبات إفصاح المستوى 2 في العقود، وأدوات رسم سلسلة الإمداد الرقمية', framework: 'CIPS Supply Chain Mapping' },
      { challenge: 'Risk register exists but is not actively managed or reviewed', challengeAr: 'سجلّ المخاطر موجود لكنه غير مُدار أو مُراجَع فعلياً', impact: 'Outdated risks, no owner accountability, governance failure', impactAr: 'مخاطر قديمة، ولا مساءلة للمالك، وإخفاق في الحوكمة', solution: 'Assign risk owners, implement quarterly review cadence, integrate into management reporting, automate escalation alerts', solutionAr: 'إسناد ملّاك المخاطر، وتطبيق إيقاع مراجعة ربع سنوي، والدمج في تقارير الإدارة، وأتمتة تنبيهات التصعيد', framework: 'ISO 31000 Risk Governance' },
      { challenge: 'Single-source dependency for critical components/services', challengeAr: 'الاعتماد على مصدر وحيد للمكوّنات/الخدمات الحرجة', impact: 'Any disruption to that supplier = supply chain failure with no alternative', impactAr: 'أي اضطراب لذلك المورّد = إخفاق سلسلة الإمداد دون بديل', solution: 'Dual-source qualification programme, split-award contracts, pre-negotiated standby supplier agreements', solutionAr: 'برنامج تأهيل توريد ثنائي، وعقود ترسية مجزّأة، واتفاقيات مورّد احتياطي متفاوَض عليها مسبقاً', framework: 'CIPS Risk & Resiliency' },
      { challenge: 'No formal BCP — business continuity undocumented', challengeAr: 'لا يوجد BCP رسمي — استمرارية الأعمال غير موثّقة', impact: 'Crisis response chaotic, recovery prolonged, reputational damage amplified', impactAr: 'استجابة أزمات فوضوية، وتعافٍ مطوّل، وأضرار سمعة متضخّمة', solution: 'ISO 22301 aligned BCP covering alternate sourcing, logistics, communication, and recovery milestones — tested annually', solutionAr: 'BCP متوائم مع ISO 22301 يغطّي التوريد البديل والخدمات اللوجستية والتواصل ومعالم التعافي — مُختبر سنوياً', framework: 'ISO 22301' },
    ],
    achievements: [
      { title: 'Supply chain disruption cost reduced by 65%', titleAr: 'خفض تكلفة اضطراب سلسلة الإمداد بنسبة 65%', client: 'GCC energy contractor', industry: 'Energy', industryAr: 'الطاقة', result: 'Risk register, dual-source programme, BCP — all 3 activated during 2024 Red Sea crisis with zero production impact', resultAr: 'سجلّ مخاطر، وبرنامج توريد ثنائي، وBCP — فُعِّلت الثلاثة خلال أزمة البحر الأحمر 2024 دون أي أثر على الإنتاج', timeframe: '18 months to deploy', timeframeAr: '18 شهراً للنشر' },
      { title: 'Single-source dependencies reduced from 34 → 9 categories', titleAr: 'خفض الاعتماد على المصدر الوحيد من 34 إلى 9 فئات', client: 'Saudi manufacturing group', industry: 'Manufacturing', industryAr: 'التصنيع', result: 'Dual-source qualification across 25 critical component categories', resultAr: 'تأهيل توريد ثنائي عبر 25 فئة مكوّنات حرجة', timeframe: '12 weeks', timeframeAr: '12 أسبوعاً' },
      { title: 'ISO 22301 BCP certification achieved', titleAr: 'تحقيق اعتماد BCP وفق ISO 22301', client: 'Jordanian pharmaceutical company', industry: 'Pharma', industryAr: 'الأدوية', result: 'Full BCP development, crisis team training, tabletop exercise, and first external audit pass', resultAr: 'تطوير BCP كامل، وتدريب فريق الأزمات، وتمرين محاكاة، واجتياز أول تدقيق خارجي', timeframe: '20 weeks', timeframeAr: '20 أسبوعاً' },
    ],
  },
  {
    slug: 'lean-agile-supply-chain', title: 'Lean & Agile Supply Chain', titleAr: 'سلسلة الإمداد الرشيقة والمرنة', icon: Zap, color: 'text-purple-600', bgGrad: 'from-purple-600 to-purple-800',
    tagline: 'Waste elimination, flow optimisation, and agile response models that cut lead times and reduce inventory.',
    taglineAr: 'إزالة الهدر، وتحسين التدفّق، ونماذج استجابة رشيقة تقلّص المهل وتخفض المخزون.',
    description: 'Lean eliminates waste. Agile absorbs variability. Together they build supply chains that are both efficient and responsive. ISC deploys Value Stream Mapping, Kanban, Pull systems, and Agile S&OP to deliver measurable lead-time reduction, inventory optimisation, and throughput improvement.',
    descriptionAr: 'يُزيل Lean الهدر، وتمتصّ الرشاقة التباين. ومعاً يبنيان سلاسل إمداد فعّالة ومستجيبة في آنٍ واحد. تنشر ISC رسم خرائط تدفّق القيمة، وKanban، وأنظمة السحب، وS&OP الرشيق لتحقيق خفض قابل للقياس في المهل، وتحسين المخزون، وتحسّن الإنتاجية.',
    frameworks: {
      strategic: [
        { name: 'Lean Enterprise Design', nameAr: 'تصميم مؤسسة Lean', desc: 'Design supply chain flows with zero-waste architecture — eliminating all 8 wastes across the end-to-end value stream.', descAr: 'تصميم تدفّقات سلسلة الإمداد ببنية بلا هدر — بإزالة الأنواع الثمانية للهدر عبر تدفّق القيمة من طرف لطرف.', tools: ['Enterprise value stream map', 'Flow efficiency analysis', 'Waste taxonomy'], toolsAr: ['خريطة تدفّق قيمة المؤسسة', 'تحليل كفاءة التدفّق', 'تصنيف الهدر'], standard: 'Toyota Production System / Lean Enterprise Institute' },
        { name: 'Theory of Constraints (Goldratt)', nameAr: 'نظرية القيود (Goldratt)', desc: 'Identify and exploit the system constraint — the single bottleneck limiting throughput — before optimising anywhere else.', descAr: 'تحديد قيد النظام واستغلاله — عنق الزجاجة الوحيد المحدّد للإنتاجية — قبل التحسين في أي مكان آخر.', tools: ['Constraint identification', 'Drum-Buffer-Rope scheduling', 'Throughput accounting'], toolsAr: ['تحديد القيد', 'جدولة الطبل-المخزن-الحبل', 'محاسبة الإنتاجية'], standard: 'Theory of Constraints / APICS' },
        { name: 'Demand-Driven Material Requirements Planning (DDMRP)', nameAr: 'تخطيط احتياجات المواد المبني على الطلب (DDMRP)', desc: 'Position decoupling points based on variability and lead time to create demand-driven, pull-based flow.', descAr: 'تموضع نقاط الفصل بناءً على التباين والمهلة لإنشاء تدفّق مبني على الطلب وقائم على السحب.', tools: ['Buffer positioning', 'Dynamic buffer sizing', 'Demand-driven planning'], toolsAr: ['تموضع المخزون', 'تحجيم المخزون الديناميكي', 'تخطيط مبني على الطلب'], standard: 'Demand Driven Institute' },
      ],
      tactical: [
        { name: 'Value Stream Mapping (VSM)', nameAr: 'رسم خرائط تدفّق القيمة (VSM)', desc: 'Current-state and future-state mapping of every step in the supply chain from order to delivery, quantifying waste at each step.', descAr: 'رسم الحالة الحالية والمستقبلية لكل خطوة في سلسلة الإمداد من الطلب إلى التسليم، مع قياس الهدر في كل خطوة.', tools: ['VSM current state', 'Process time vs lead time analysis', 'Future state design'], toolsAr: ['VSM للحالة الحالية', 'تحليل زمن العملية مقابل المهلة', 'تصميم الحالة المستقبلية'], standard: 'Lean Enterprise Institute' },
        { name: 'Pull System Design (Kanban/JIT)', nameAr: 'تصميم نظام السحب (Kanban/JIT)', desc: 'Replace push-based planning with signal-driven replenishment — right product, right time, right quantity.', descAr: 'استبدال التخطيط القائم على الدفع بإعادة تموين مدفوعة بالإشارة — المنتج الصحيح، والوقت الصحيح، والكمية الصحيحة.', tools: ['Kanban design', 'Supermarket sizing', 'Replenishment signal design'], toolsAr: ['تصميم Kanban', 'تحجيم السوبرماركت', 'تصميم إشارة إعادة التموين'], standard: 'Toyota / APICS Lean' },
        { name: 'Agile S&OP (Rolling Horizon)', nameAr: 'S&OP الرشيق (أفق متجدّد)', desc: 'Short-cycle demand and supply planning review — monthly for strategy, weekly for execution — responsive to real market signals.', descAr: 'مراجعة تخطيط طلب وعرض قصيرة الدورة — شهرياً للاستراتيجية، وأسبوعياً للتنفيذ — مستجيبة لإشارات السوق الحقيقية.', tools: ['Rolling forecast', 'Weekly supply review', 'Scenario planning'], toolsAr: ['توقّع متجدّد', 'مراجعة عرض أسبوعية', 'تخطيط السيناريوهات'], standard: 'Oliver Wight / Gartner' },
      ],
      operational: [
        { name: '5S / 6S Workplace Organisation', nameAr: 'تنظيم مكان العمل 5S / 6S', desc: 'Sort, Set in order, Shine, Standardise, Sustain (+ Safety) — creating visual, efficient workplaces that sustain improvements.', descAr: 'الفرز، والترتيب، والتلميع، والتوحيد، والاستدامة (+ السلامة) — لإنشاء أماكن عمل مرئية وفعّالة تُحافظ على التحسينات.', tools: ['5S audit', 'Red-tag events', 'Visual standard documentation'], toolsAr: ['تدقيق 5S', 'فعاليات البطاقة الحمراء', 'توثيق معياري مرئي'], standard: 'Toyota / Lean Enterprise' },
        { name: 'Kaizen & Continuous Improvement', nameAr: 'Kaizen والتحسين المستمر', desc: 'Structured rapid-improvement events (3–5 days) targeting specific waste-producing processes for rapid transformation.', descAr: 'فعاليات تحسين سريع منظّمة (3–5 أيام) تستهدف عمليات محدّدة منتجة للهدر لتحوّل سريع.', tools: ['Kaizen event facilitiation', 'A3 problem-solving', 'Improvement tracking board'], toolsAr: ['تيسير فعاليات Kaizen', 'حل المشكلات A3', 'لوحة تتبّع التحسين'], standard: 'Imai / Lean Enterprise' },
      ],
    },
    kpis: [
      { category: 'Lead Time & Flow', categoryAr: 'المهلة والتدفّق', metrics: [
        { name: 'End-to-End Lead Time Reduction', nameAr: 'خفض المهلة من طرف لطرف', target: '>35%', benchmark: '18%', unit: '%' },
        { name: 'Process Cycle Efficiency', nameAr: 'كفاءة دورة العملية', target: '>35%', benchmark: '22%', unit: '%' },
        { name: 'Order-to-Cash Cycle', nameAr: 'دورة الطلب إلى النقد', target: '<18 days', targetAr: 'أقل من 18 يوماً', benchmark: '32 days', benchmarkAr: '32 يوماً', unit: 'days', unitAr: 'أيام' },
      ]},
      { category: 'Inventory', categoryAr: 'المخزون', metrics: [
        { name: 'Inventory Turns', nameAr: 'دوران المخزون', target: '>12/yr', targetAr: '>12/سنة', benchmark: '7.5/yr', benchmarkAr: '7.5/سنة', unit: 'turns/yr', unitAr: 'دورة/سنة' },
        { name: 'WIP Reduction', nameAr: 'خفض العمل قيد التنفيذ', target: '>40%', benchmark: '15%', unit: '%' },
        { name: 'Obsolete Inventory as % Total', nameAr: 'المخزون المتقادم كنسبة من الإجمالي', target: '<3%', benchmark: '9%', unit: '%' },
      ]},
      { category: 'Productivity & Quality', categoryAr: 'الإنتاجية والجودة', metrics: [
        { name: 'OEE (Overall Equipment Effectiveness)', nameAr: 'الفاعلية الكلية للمعدّات (OEE)', target: '>80%', benchmark: '68%', unit: '%' },
        { name: 'First-Pass Yield', nameAr: 'ناتج المرور الأول', target: '>97%', benchmark: '91%', unit: '%' },
        { name: 'Takt Time Adherence', nameAr: 'الالتزام بزمن الوتيرة (Takt)', target: '>92%', benchmark: '78%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['VSM of top 2 production lines in 3 days', '5S workshop in main warehouse', 'Kanban for top 20 MRO items'], quickWinsAr: ['VSM لأعلى خطي إنتاج خلال 3 أيام', 'ورشة 5S في المستودع الرئيسي', 'Kanban لأعلى 20 صنف صيانة وتشغيل'], projects: [{ title: 'Lean Transformation Programme', titleAr: 'برنامج تحوّل Lean', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: '30% lead time reduction, 20% inventory cut', impactAr: 'خفض المهلة 30%، وخفض المخزون 20%' }, { title: 'Kaizen Blitz — Assembly Line', titleAr: 'حملة Kaizen — خط التجميع', duration: '1 week/event', durationAr: 'أسبوع/فعالية', impact: '15% OEE improvement per event', impactAr: 'تحسّن OEE بنسبة 15% لكل فعالية' }] },
      { industry: 'Logistics', industryAr: 'الخدمات اللوجستية', quickWins: ['Dock scheduling visual board', 'Route efficiency quick analysis', 'Returns processing flow map'], quickWinsAr: ['لوحة جدولة أرصفة مرئية', 'تحليل سريع لكفاءة المسارات', 'خريطة تدفّق معالجة المرتجعات'], projects: [{ title: 'Lean Warehouse Design', titleAr: 'تصميم مستودع Lean', duration: '10 weeks', durationAr: '10 أسابيع', impact: '25% pick-pack efficiency gain', impactAr: 'زيادة كفاءة الانتقاء والتعبئة 25%' }, { title: 'Last-Mile Delivery Optimisation', titleAr: 'تحسين التسليم للميل الأخير', duration: '8 weeks', durationAr: '8 أسابيع', impact: '18% delivery cost reduction', impactAr: 'خفض تكلفة التسليم 18%' }] },
      { industry: 'Healthcare', industryAr: 'الرعاية الصحية', quickWins: ['Theatre supply VSM', 'Inventory count — high-cost consumables', 'Par-level optimisation for wards'], quickWinsAr: ['VSM للوازم غرف العمليات', 'جرد المخزون — المستهلكات عالية التكلفة', 'تحسين مستوى المخزون للأجنحة'], projects: [{ title: 'Hospital Supply Chain Lean', titleAr: 'Lean لسلسلة إمداد المستشفيات', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '35% supply cost reduction', impactAr: 'خفض تكلفة الإمداد 35%' }, { title: 'Demand-Driven Pharmacy Replenishment', titleAr: 'إعادة تموين صيدلية مبنية على الطلب', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Stockout rate -70%', impactAr: 'خفض معدّل النفاد 70%' }] },
      { industry: 'Retail', industryAr: 'التجزئة', quickWins: ['Replenishment signal audit', 'Slow-moving stock analysis', 'DC receiving process VSM'], quickWinsAr: ['تدقيق إشارة إعادة التموين', 'تحليل المخزون بطيء الحركة', 'VSM لعملية استلام مركز التوزيع'], projects: [{ title: 'Agile Replenishment Model', titleAr: 'نموذج إعادة تموين رشيق', duration: '10 weeks', durationAr: '10 أسابيع', impact: '28% inventory reduction', impactAr: 'خفض المخزون 28%' }, { title: 'Omnichannel Flow Optimisation', titleAr: 'تحسين التدفّق متعدّد القنوات', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '20% OTIF improvement', impactAr: 'تحسّن OTIF بنسبة 20%' }] },
    ],
    challenges: [
      { challenge: 'Push planning creates bullwhip — overstock at the front, stockouts downstream', challengeAr: 'التخطيط بالدفع يخلق أثر السوط — تكديس في المقدّمة ونفاد في المؤخّرة', impact: 'Excess inventory costs + service failures co-exist; classic bullwhip effect', impactAr: 'تعايش تكاليف المخزون الزائد مع إخفاقات الخدمة؛ أثر السوط الكلاسيكي', solution: 'VSM to expose demand signal distortion, then deploy pull-based Kanban/DDMRP with demand sensing', solutionAr: 'VSM لكشف تشوّه إشارة الطلب، ثم نشر Kanban/DDMRP القائم على السحب مع استشعار الطلب', framework: 'DDMRP / Lean Pull' },
      { challenge: 'Lean tools deployed in isolation (5S only) without flow transformation', challengeAr: 'نشر أدوات Lean بمعزل (5S فقط) دون تحوّل في التدفّق', impact: 'Clean warehouse, same lead time — surface improvement without systemic change', impactAr: 'مستودع نظيف، ونفس المهلة — تحسين سطحي دون تغيير منهجي', solution: 'Start with enterprise VSM before deploying any tools — flow transformation must precede point improvements', solutionAr: 'البدء بـ VSM على مستوى المؤسسة قبل نشر أي أدوات — يجب أن يسبق تحوّل التدفّق التحسينات الجزئية', framework: 'Lean Enterprise Institute' },
      { challenge: 'Cultural resistance — "we\'ve always done it this way" blocks change', challengeAr: 'مقاومة ثقافية — "هكذا اعتدنا دائماً" تعيق التغيير', impact: 'Improvement initiatives stall after pilot; no spread or sustainability', impactAr: 'تتعثّر مبادرات التحسين بعد التجربة؛ بلا انتشار أو استدامة', solution: 'Kaizen leadership engagement, quick-win delivery builds credibility, standard work embeds habits, visual management sustains', solutionAr: 'إشراك قيادة Kaizen، وتحقيق مكاسب سريعة يبني المصداقية، والعمل المعياري يرسّخ العادات، والإدارة المرئية تحافظ عليها', framework: 'Kotter 8-step / Lean Culture' },
      { challenge: 'Agile demand requires fast procurement response — current cycle too slow', challengeAr: 'يتطلّب الطلب الرشيق استجابة مشتريات سريعة — والدورة الحالية بطيئة جداً', impact: 'Cannot respond to market opportunities; competitors out-supply ISC clients', impactAr: 'تعذّر الاستجابة لفرص السوق؛ ويتفوّق المنافسون في التوريد على عملاء ISC', solution: 'Agile procurement model — pre-qualified supplier panels, pre-negotiated price bands, delegated approval authority for demand spikes', solutionAr: 'نموذج مشتريات رشيق — لجان مورّدين مؤهّلة مسبقاً، ونطاقات أسعار متفاوَض عليها مسبقاً، وصلاحية اعتماد مفوّضة لطفرات الطلب', framework: 'CIPS Agile Procurement' },
      { challenge: 'OEE not measured — maintenance and downtime impact on supply not visible', challengeAr: 'OEE غير مُقاس — أثر الصيانة والتوقّف على التوريد غير مرئي', impact: 'Capacity planning inaccurate; promised delivery dates missed due to unplanned downtime', impactAr: 'تخطيط سعة غير دقيق؛ وإخفاق في تواريخ التسليم الموعودة بسبب توقّف غير مخطّط', solution: 'OEE baseline measurement programme, SMED on major changeovers, planned maintenance calendar integration', solutionAr: 'برنامج قياس أساس OEE، وSMED على التحويلات الكبرى، ودمج تقويم الصيانة المخطّطة', framework: 'JIPM TPM / Lean' },
    ],
    achievements: [
      { title: 'Lead time reduced 38% in 14 weeks', titleAr: 'خفض المهلة 38% خلال 14 أسبوعاً', client: 'Saudi manufacturing company', industry: 'Manufacturing', industryAr: 'التصنيع', result: 'VSM, Pull system design, Kanban for 85 SKUs, Kaizen events on 3 production lines', resultAr: 'VSM، وتصميم نظام سحب، وKanban لـ 85 صنفاً، وفعاليات Kaizen على 3 خطوط إنتاج', timeframe: '14 weeks', timeframeAr: '14 أسبوعاً' },
      { title: 'Inventory turns increased from 5.2 → 11.8', titleAr: 'زيادة دوران المخزون من 5.2 إلى 11.8', client: 'GCC retail chain', industry: 'Retail', industryAr: 'التجزئة', result: 'Agile replenishment model, demand-driven ordering, slow-mover elimination', resultAr: 'نموذج إعادة تموين رشيق، وطلب مبني على الطلب، وإزالة بطيئات الحركة', timeframe: '6 months', timeframeAr: '6 أشهر' },
      { title: 'Hospital supply cost reduced 32%', titleAr: 'خفض تكلفة إمداد المستشفى 32%', client: 'Jordanian private hospital', industry: 'Healthcare', industryAr: 'الرعاية الصحية', result: 'Par-level optimisation, Kanban for theatres, pharmacy demand-driven replenishment', resultAr: 'تحسين مستوى المخزون، وKanban لغرف العمليات، وإعادة تموين صيدلية مبنية على الطلب', timeframe: '12 weeks', timeframeAr: '12 أسبوعاً' },
    ],
  },
  {
    slug: 'sustainability-esg', title: 'Sustainability & ESG', titleAr: 'الاستدامة والحوكمة البيئية والاجتماعية (ESG)', icon: Leaf, color: 'text-emerald-600', bgGrad: 'from-emerald-600 to-emerald-800',
    tagline: 'ESG integration, Scope 3 measurement, circular procurement, and Saudi Net Zero alignment.',
    taglineAr: 'دمج ESG، وقياس النطاق 3، والمشتريات الدائرية، والمواءمة مع الحياد الصفري السعودي.',
    description: 'Supply chain sustainability is now a regulatory requirement, investor expectation, and competitive differentiator. ISC deploys ISO 20400, GRI Standards, and Science-Based Targets frameworks to embed ESG into procurement decisions, measure Scope 3 emissions, and build circular supply chains aligned to Saudi Vision 2030 and global standards.',
    descriptionAr: 'أصبحت استدامة سلسلة الإمداد اليوم متطلباً تنظيمياً، وتوقّعاً من المستثمرين، وعامل تمييز تنافسي. تنشر ISC أطر ISO 20400، ومعايير GRI، والأهداف المبنية على العلم لتضمين ESG في قرارات المشتريات، وقياس انبعاثات النطاق 3، وبناء سلاسل إمداد دائرية متوائمة مع رؤية 2030 والمعايير العالمية.',
    frameworks: {
      strategic: [
        { name: 'Science-Based Targets (SBTi)', nameAr: 'الأهداف المبنية على العلم (SBTi)', desc: 'Align supply chain emissions reduction targets to the 1.5°C Paris Agreement pathway — with sector-specific decarbonisation roadmaps.', descAr: 'مواءمة أهداف خفض انبعاثات سلسلة الإمداد مع مسار اتفاق باريس عند 1.5°م — مع خرائط طريق إزالة الكربون الخاصة بكل قطاع.', tools: ['Emissions baseline (Scope 1/2/3)', 'Target setting methodology', 'Annual disclosure report'], toolsAr: ['خط أساس الانبعاثات (النطاق 1/2/3)', 'منهجية تحديد الأهداف', 'تقرير إفصاح سنوي'], standard: 'SBTi / CDP' },
        { name: 'GRI Sustainability Reporting Standards', nameAr: 'معايير GRI لتقارير الاستدامة', desc: 'Globally recognised framework for ESG disclosure — supply chain GRI 308 (supplier environmental) and 414 (supplier social assessment).', descAr: 'إطار معترف به عالمياً لإفصاح ESG — سلسلة الإمداد GRI 308 (البيئة للمورّد) و414 (التقييم الاجتماعي للمورّد).', tools: ['GRI index', 'Supply chain ESG data collection', 'Materiality assessment'], toolsAr: ['فهرس GRI', 'جمع بيانات ESG لسلسلة الإمداد', 'تقييم الأهمية النسبية'], standard: 'GRI Standards 2021' },
        { name: 'ISO 20400 Sustainable Procurement', nameAr: 'المشتريات المستدامة ISO 20400', desc: 'International standard defining how to integrate sustainability into procurement processes and decisions.', descAr: 'معيار دولي يحدّد كيفية دمج الاستدامة في عمليات وقرارات المشتريات.', tools: ['Sustainable procurement policy', 'ESG supplier assessment', 'Circular economy integration'], toolsAr: ['سياسة مشتريات مستدامة', 'تقييم ESG للمورّد', 'دمج الاقتصاد الدائري'], standard: 'ISO 20400:2017' },
      ],
      tactical: [
        { name: 'Scope 3 Supply Chain Inventory', nameAr: 'جرد النطاق 3 لسلسلة الإمداد', desc: 'Measure and manage Category 1 (purchased goods/services), 4 (upstream transport), and 11 (use of sold products) Scope 3 emissions.', descAr: 'قياس وإدارة انبعاثات النطاق 3 للفئة 1 (السلع/الخدمات المشتراة)، و4 (النقل الأمامي)، و11 (استخدام المنتجات المباعة).', tools: ['Spend-based emission factors', 'Activity-based modelling', 'Supplier-specific data collection'], toolsAr: ['عوامل انبعاث مبنية على الإنفاق', 'نمذجة مبنية على النشاط', 'جمع بيانات خاص بالمورّد'], standard: 'GHG Protocol / SBTi' },
        { name: 'Sustainable Supplier Assessment', nameAr: 'تقييم المورّد المستدام', desc: 'ESG risk scoring and development for all strategic suppliers across environmental, social, and governance dimensions.', descAr: 'تسجيل مخاطر ESG وتطوير جميع المورّدين الاستراتيجيين عبر الأبعاد البيئية والاجتماعية والحوكمية.', tools: ['ESG supplier questionnaire', 'On-site audit checklist', 'Improvement action plan'], toolsAr: ['استبيان ESG للمورّد', 'قائمة تدقيق ميداني', 'خطة إجراء تحسين'], standard: 'ISO 20400 / CIPS Ethics' },
        { name: 'Circular Procurement Framework', nameAr: 'إطار المشتريات الدائرية', desc: 'Design procurement specifications to require recycled content, take-back programmes, and extended product life.', descAr: 'تصميم مواصفات مشتريات تتطلّب محتوى معاد التدوير، وبرامج الاسترجاع، وإطالة عمر المنتج.', tools: ['Circular criteria library', 'Material passport requirements', 'Lifecycle cost modelling'], toolsAr: ['مكتبة معايير دائرية', 'متطلبات جواز سفر المواد', 'نمذجة تكلفة دورة الحياة'], standard: 'Ellen MacArthur Foundation' },
      ],
      operational: [
        { name: 'Carbon Data Collection per PO', nameAr: 'جمع بيانات الكربون لكل أمر شراء', desc: 'Embed supplier emissions data collection at purchase order level — enabling product-level carbon footprint calculation.', descAr: 'تضمين جمع بيانات انبعاثات المورّد على مستوى أمر الشراء — بما يمكّن حساب البصمة الكربونية على مستوى المنتج.', tools: ['PO-level carbon fields (ERP)', 'Supplier data portal', 'Carbon dashboard'], toolsAr: ['حقول كربون على مستوى أمر الشراء (ERP)', 'بوابة بيانات المورّد', 'لوحة الكربون'], standard: 'GHG Protocol' },
        { name: 'ESG Scorecard in Supplier Reviews', nameAr: 'بطاقة ESG في مراجعات المورّدين', desc: 'Integrate ESG performance (carbon, labour, governance) into quarterly supplier review scorecards alongside commercial KPIs.', descAr: 'دمج أداء ESG (الكربون والعمالة والحوكمة) في بطاقات مراجعة المورّدين الربع سنوية إلى جانب المؤشرات التجارية.', tools: ['ESG scorecard template', 'QBR ESG section', 'Improvement action tracker'], toolsAr: ['قالب بطاقة ESG', 'قسم ESG في المراجعة الربع سنوية', 'متتبّع إجراءات التحسين'], standard: 'CIPS Ethical & Sustainable' },
      ],
    },
    kpis: [
      { category: 'Carbon & Environment', categoryAr: 'الكربون والبيئة', metrics: [
        { name: 'Scope 3 Emission Coverage', nameAr: 'تغطية انبعاثات النطاق 3', target: '>75%', benchmark: '38%', unit: '% of supply spend', unitAr: '% من إنفاق التوريد' },
        { name: 'Carbon per SAR of Spend', nameAr: 'الكربون لكل ريال إنفاق', target: 'Year-on-year reduction', targetAr: 'خفض سنوي متتالٍ', benchmark: 'Not measured', benchmarkAr: 'غير مُقاس', unit: 'kgCO2e/SAR', unitAr: 'كغ CO2e/ريال' },
        { name: 'Recycled/Sustainable Content', nameAr: 'المحتوى المعاد تدويره/المستدام', target: '>25%', benchmark: '8%', unit: '% of spend', unitAr: '% من الإنفاق' },
      ]},
      { category: 'Supplier ESG', categoryAr: 'ESG للمورّدين', metrics: [
        { name: 'ESG-Assessed Strategic Suppliers', nameAr: 'المورّدون الاستراتيجيون المقيَّمون بـ ESG', target: '>90%', benchmark: '31%', unit: '%' },
        { name: 'Supplier ESG Score (avg)', nameAr: 'درجة ESG للمورّد (متوسط)', target: '>75/100', benchmark: '54/100', unit: '/100' },
        { name: 'High ESG-Risk Suppliers with Plans', nameAr: 'مورّدو مخاطر ESG العالية ذوو خطط', target: '100%', benchmark: '22%', unit: '%' },
      ]},
      { category: 'Circular Economy', categoryAr: 'الاقتصاد الدائري', metrics: [
        { name: 'Circular Procurement Spend', nameAr: 'إنفاق المشتريات الدائرية', target: '>15%', benchmark: '3%', unit: '%' },
        { name: 'Packaging Recyclability', nameAr: 'قابلية إعادة تدوير التغليف', target: '>80%', benchmark: '45%', unit: '%' },
        { name: 'Waste Diverted from Landfill', nameAr: 'النفايات المُحوّلة عن المكب', target: '>70%', benchmark: '41%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Scope 3 Category 1 spend-based estimate', 'ESG supplier questionnaire to top 30 vendors', 'Green procurement policy draft'], quickWinsAr: ['تقدير النطاق 3 الفئة 1 المبني على الإنفاق', 'استبيان ESG لأعلى 30 مورّداً', 'مسودّة سياسة مشتريات خضراء'], projects: [{ title: 'Scope 3 Inventory & Reduction Roadmap', titleAr: 'جرد النطاق 3 وخارطة طريق الخفض', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Scope 3 measurement to CDP standards', impactAr: 'قياس النطاق 3 وفق معايير CDP' }, { title: 'Sustainable Supplier Programme', titleAr: 'برنامج المورّد المستدام', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '85% of strategic suppliers ESG-assessed', impactAr: 'تقييم ESG لـ 85% من المورّدين الاستراتيجيين' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Green procurement criteria added to top 3 tender templates', 'Vision 2030 ESG alignment review', 'Supplier CoC issued with ESG clauses'], quickWinsAr: ['إضافة معايير مشتريات خضراء إلى أعلى 3 قوالب مناقصات', 'مراجعة مواءمة ESG مع رؤية 2030', 'إصدار مدوّنة سلوك المورّدين ببنود ESG'], projects: [{ title: 'Government Sustainable Procurement Policy', titleAr: 'سياسة المشتريات الحكومية المستدامة', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'ISO 20400 aligned policy', impactAr: 'سياسة متوائمة مع ISO 20400' }, { title: 'National ESG Supplier Development', titleAr: 'تطوير مورّدي ESG على المستوى الوطني', duration: '24 weeks', durationAr: '24 أسبوعاً', impact: 'Iktva + ESG integrated framework', impactAr: 'إطار متكامل Iktva + ESG' }] },
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['Waste-to-landfill baseline audit', 'Top 5 input materials carbon factor', 'Packaging recyclability audit'], quickWinsAr: ['تدقيق أساس النفايات إلى المكب', 'عامل كربون أعلى 5 مواد مدخلة', 'تدقيق قابلية إعادة تدوير التغليف'], projects: [{ title: 'Circular Procurement Design', titleAr: 'تصميم المشتريات الدائرية', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '20% packaging recyclability increase', impactAr: 'زيادة قابلية إعادة تدوير التغليف 20%' }, { title: 'SBTi Supply Chain Target Setting', titleAr: 'تحديد أهداف SBTi لسلسلة الإمداد', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Science-based Scope 3 target approved', impactAr: 'اعتماد هدف نطاق 3 مبني على العلم' }] },
      { industry: 'Pharma', industryAr: 'الأدوية', quickWins: ['GDP cold chain carbon mapping', 'SFDA ESG compliance review', 'API supplier ESG assessment'], quickWinsAr: ['رسم كربون سلسلة تبريد GDP', 'مراجعة امتثال ESG لـ SFDA', 'تقييم ESG لمورّد المكوّن الفعّال (API)'], projects: [{ title: 'Pharma ESG Procurement Framework', titleAr: 'إطار مشتريات ESG للأدوية', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: 'GRI 308+414 disclosure ready', impactAr: 'جاهزية إفصاح GRI 308+414' }, { title: 'Green Cold Chain Programme', titleAr: 'برنامج سلسلة تبريد خضراء', duration: '10 weeks', durationAr: '10 أسابيع', impact: '25% cold chain carbon reduction', impactAr: 'خفض كربون سلسلة التبريد 25%' }] },
    ],
    challenges: [
      { challenge: 'Scope 3 data collection from suppliers is voluntary and inconsistent', challengeAr: 'جمع بيانات النطاق 3 من المورّدين طوعي وغير متسق', impact: 'ESG reporting inaccurate; regulatory disclosure risk under EU CSDDD and Saudi CMA ESG rules', impactAr: 'تقارير ESG غير دقيقة؛ ومخاطر إفصاح تنظيمي بموجب EU CSDDD وقواعد ESG لهيئة السوق المالية السعودية', solution: 'Contractual Scope 3 data requirements, spend-based interim estimates, supplier portal for data submission, and phased enhanced data collection from Tier-1', solutionAr: 'متطلبات تعاقدية لبيانات النطاق 3، وتقديرات مؤقتة مبنية على الإنفاق، وبوابة مورّدين لتقديم البيانات، وجمع بيانات معزّز مرحلي من المستوى 1', framework: 'GHG Protocol / SBTi' },
      { challenge: 'ESG requirements perceived as cost-adding, not value-creating', challengeAr: 'يُنظر إلى متطلبات ESG كمُضيفة للتكلفة، لا خالقة للقيمة', impact: 'Resistance from procurement and operations teams; ESG initiative stalls', impactAr: 'مقاومة من فرق المشتريات والعمليات؛ وتعثّر مبادرة ESG', solution: 'Quantify ESG ROI: risk reduction value, access to green financing, contract wins from ESG-demanding customers, regulatory fine avoidance', solutionAr: 'تحديد العائد على الاستثمار في ESG كمياً: قيمة خفض المخاطر، والوصول إلى التمويل الأخضر، وكسب عقود من عملاء يطلبون ESG، وتجنّب الغرامات التنظيمية', framework: 'ISO 20400 Business Case' },
      { challenge: 'Saudi regulatory ESG landscape evolving rapidly — hard to track', challengeAr: 'مشهد ESG التنظيمي السعودي يتطوّر بسرعة — يصعب تتبّعه', impact: 'Compliance gaps; tender disqualification; investor concern', impactAr: 'فجوات امتثال؛ واستبعاد من المناقصات؛ وقلق المستثمرين', solution: 'ISC regulatory monitoring service — monthly ESG regulatory brief, impact assessment, and policy update', solutionAr: 'خدمة رصد تنظيمي من ISC — موجز ESG تنظيمي شهري، وتقييم أثر، وتحديث السياسات', framework: 'Saudi CMA / Vision 2030' },
      { challenge: 'No circular economy design capability in procurement team', challengeAr: 'لا قدرة على تصميم الاقتصاد الدائري في فريق المشتريات', impact: 'Specifications written for linear supply chains; circular options not evaluated', impactAr: 'مواصفات مكتوبة لسلاسل إمداد خطية؛ والخيارات الدائرية غير مُقيَّمة', solution: 'Circular procurement training, circular specification library, and product-level lifecycle cost assessment for top categories', solutionAr: 'تدريب على المشتريات الدائرية، ومكتبة مواصفات دائرية، وتقييم تكلفة دورة الحياة على مستوى المنتج لأعلى الفئات', framework: 'Ellen MacArthur / ISO 20400' },
      { challenge: 'Sustainability targets set centrally but not cascaded to procurement decisions', challengeAr: 'أهداف الاستدامة تُحدّد مركزياً لكنها لا تتدرّج إلى قرارات المشتريات', impact: 'ESG strategy stays at board level; does not change daily sourcing or supplier behaviour', impactAr: 'تبقى استراتيجية ESG على مستوى المجلس؛ ولا تغيّر التوريد اليومي أو سلوك المورّدين', solution: 'Cascade ESG KPIs into supplier scorecards, buyer performance reviews, and category strategy documentation', solutionAr: 'تدرّج مؤشرات ESG في بطاقات أداء المورّدين، ومراجعات أداء المشترين، وتوثيق استراتيجية الفئة', framework: 'CIPS Sustainable Procurement' },
    ],
    achievements: [
      { title: 'Scope 3 measured, CDP disclosure submitted', titleAr: 'قياس النطاق 3، وتقديم إفصاح CDP', client: 'Saudi listed energy company', industry: 'Energy', industryAr: 'الطاقة', result: 'Full Scope 3 Category 1+4 inventory, spend-based + activity-based, CDP B-score', resultAr: 'جرد كامل للنطاق 3 الفئة 1+4، مبني على الإنفاق + النشاط، ودرجة CDP فئة B', timeframe: '20 weeks', timeframeAr: '20 أسبوعاً' },
      { title: '100% strategic suppliers ESG-assessed', titleAr: 'تقييم ESG لـ 100% من المورّدين الاستراتيجيين', client: 'GCC pharmaceutical group', industry: 'Pharma', industryAr: 'الأدوية', result: 'ESG questionnaire, on-site audits, corrective action plans, scorecard integration', resultAr: 'استبيان ESG، وتدقيقات ميدانية، وخطط إجراء تصحيحي، ودمج بطاقة الأداء', timeframe: '12 months', timeframeAr: '12 شهراً' },
      { title: 'Green procurement policy — government tender win', titleAr: 'سياسة مشتريات خضراء — كسب مناقصة حكومية', client: 'Jordanian government supplier', industry: 'Government', industryAr: 'الحكومة', result: 'ISO 20400 policy, circular specs, ESG supplier programme helped win SAR 28M tender', resultAr: 'سياسة ISO 20400، ومواصفات دائرية، وبرنامج مورّدي ESG ساعد على كسب مناقصة بقيمة 28 مليون ريال', timeframe: '8 months', timeframeAr: '8 أشهر' },
    ],
  },
  {
    slug: 'digital-transformation', title: 'Digital Transformation', titleAr: 'التحوّل الرقمي', icon: Cpu, color: 'text-indigo-600', bgGrad: 'from-indigo-600 to-indigo-800',
    tagline: 'Technology enablement, ERP optimisation, and digital supply chain maturity roadmaps.',
    taglineAr: 'تمكين التقنية، وتحسين ERP، وخرائط طريق نضج سلسلة الإمداد الرقمية.',
    description: 'Digital transformation in supply chain is not about technology — it is about using technology to enable better processes, better decisions, and better outcomes. ISC deploys digital maturity assessments, technology roadmaps, and hands-on ERP implementation support across SAP MM/SCM, SAP Ariba, Microsoft Dynamics 365, IFS, and Odoo.',
    descriptionAr: 'التحوّل الرقمي في سلسلة الإمداد ليس عن التقنية — بل عن استخدام التقنية لتمكين عمليات أفضل، وقرارات أفضل، ونتائج أفضل. تنشر ISC تقييمات النضج الرقمي، وخرائط طريق التقنية، ودعماً عملياً لتطبيق ERP عبر SAP MM/SCM، وSAP Ariba، وMicrosoft Dynamics 365، وIFS، وOdoo.',
    frameworks: {
      strategic: [
        { name: 'Digital Supply Chain Maturity Model', nameAr: 'نموذج نضج سلسلة الإمداد الرقمية', desc: '5-level maturity model assessing digitisation across plan, source, make, deliver — from manual/paper-based to fully autonomous.', descAr: 'نموذج نضج من 5 مستويات يقيّم الرقمنة عبر التخطيط والتوريد والتصنيع والتسليم — من اليدوي/الورقي إلى الذاتي بالكامل.', tools: ['Maturity diagnostic', 'Technology gap analysis', 'Digital roadmap (3-year)'], toolsAr: ['تشخيص النضج', 'تحليل فجوة التقنية', 'خارطة طريق رقمية (3 سنوات)'], standard: 'Gartner / Deloitte Digital' },
        { name: 'Technology Architecture Design', nameAr: 'تصميم معمارية التقنية', desc: 'End-to-end technology stack design: ERP backbone, procurement platform, analytics layer, IoT/track-and-trace, and AI/ML overlay.', descAr: 'تصميم حزمة تقنية من طرف لطرف: العمود الفقري ERP، ومنصة المشتريات، وطبقة التحليلات، وإنترنت الأشياء/التتبّع، وطبقة الذكاء الاصطناعي/التعلّم الآلي.', tools: ['Architecture blueprint', 'Build-vs-buy analysis', 'Integration design'], toolsAr: ['مخطط المعمارية', 'تحليل البناء مقابل الشراء', 'تصميم التكامل'], standard: 'Gartner / McKinsey' },
        { name: 'Change Management Framework', nameAr: 'إطار إدارة التغيير', desc: 'Digital transformation succeeds through people adoption, not just system deployment. ISC deploys structured change management.', descAr: 'ينجح التحوّل الرقمي عبر تبنّي الأفراد، وليس مجرّد نشر النظام. تنشر ISC إدارة تغيير منظّمة.', tools: ['Stakeholder analysis', 'Change impact assessment', 'Training plan'], toolsAr: ['تحليل أصحاب المصلحة', 'تقييم أثر التغيير', 'خطة التدريب'], standard: 'Prosci ADKAR / Kotter' },
      ],
      tactical: [
        { name: 'ERP Optimisation (SAP / Dynamics / IFS / Odoo)', nameAr: 'تحسين ERP (SAP / Dynamics / IFS / Odoo)', desc: 'Configuration, process re-alignment, and master data management for existing ERP systems to unlock value from underused modules.', descAr: 'التهيئة، وإعادة مواءمة العمليات، وإدارة البيانات الرئيسية لأنظمة ERP القائمة لإطلاق القيمة من الوحدات غير المستغلّة.', tools: ['Process-ERP gap analysis', 'Configuration review', 'Master data cleanse'], toolsAr: ['تحليل فجوة العملية-ERP', 'مراجعة التهيئة', 'تنظيف البيانات الرئيسية'], standard: 'SAP Best Practice / Microsoft' },
        { name: 'e-Procurement Platform Deployment', nameAr: 'نشر منصة المشتريات الإلكترونية', desc: 'Procurement platform selection, configuration, supplier onboarding, and go-live support for SAP Ariba, Coupa, Jaggaer, or Zycus.', descAr: 'اختيار منصة المشتريات، والتهيئة، وإدماج المورّدين، ودعم التشغيل لـ SAP Ariba أو Coupa أو Jaggaer أو Zycus.', tools: ['Platform selection framework', 'Supplier onboarding plan', 'Adoption dashboard'], toolsAr: ['إطار اختيار المنصة', 'خطة إدماج المورّدين', 'لوحة التبنّي'], standard: 'Gartner Procurement Technology' },
        { name: 'Supply Chain Analytics & Power BI', nameAr: 'تحليلات سلسلة الإمداد وPower BI', desc: 'Design and build procurement and supply chain KPI dashboards connected to ERP data — enabling real-time decision-making.', descAr: 'تصميم وبناء لوحات مؤشرات المشتريات وسلسلة الإمداد المتصلة ببيانات ERP — بما يمكّن اتخاذ القرار اللحظي.', tools: ['KPI framework', 'Power BI development', 'Data governance'], toolsAr: ['إطار مؤشرات الأداء', 'تطوير Power BI', 'حوكمة البيانات'], standard: 'Microsoft / CIPS' },
      ],
      operational: [
        { name: 'System Training & Hyper-Care', nameAr: 'تدريب النظام والرعاية المكثّفة', desc: 'Role-based system training, go-live support, and post-implementation performance monitoring for all deployed platforms.', descAr: 'تدريب نظام قائم على الأدوار، ودعم التشغيل، ومراقبة الأداء بعد التطبيق لجميع المنصّات المنشورة.', tools: ['Training material', 'Job aids', 'Hyper-care help desk'], toolsAr: ['مواد تدريبية', 'أدلة عمل', 'مكتب مساعدة الرعاية المكثّفة'], standard: 'Prosci / WalkMe' },
        { name: 'Integration Testing & Data Migration', nameAr: 'اختبار التكامل وترحيل البيانات', desc: 'Structured data migration, integration testing, and cutover management to ensure clean system go-lives.', descAr: 'ترحيل بيانات منظّم، واختبار تكامل، وإدارة الانتقال لضمان تشغيل نظام نظيف.', tools: ['Data mapping', 'Migration scripts', 'UAT test scripts'], toolsAr: ['ربط البيانات', 'برامج الترحيل', 'برامج اختبار قبول المستخدم (UAT)'], standard: 'PRINCE2 / SAP Activate' },
      ],
    },
    kpis: [
      { category: 'Adoption & Coverage', categoryAr: 'التبنّي والتغطية', metrics: [
        { name: 'e-Procurement Adoption Rate', nameAr: 'معدّل تبنّي المشتريات الإلكترونية', target: '>85%', benchmark: '61%', unit: '%' },
        { name: 'Straight-Through PO Processing', nameAr: 'معالجة أوامر الشراء الآلية المباشرة', target: '>70%', benchmark: '42%', unit: '%' },
        { name: 'ERP Data Accuracy Score', nameAr: 'درجة دقّة بيانات ERP', target: '>92%', benchmark: '74%', unit: '%' },
      ]},
      { category: 'Efficiency Gains', categoryAr: 'مكاسب الكفاءة', metrics: [
        { name: 'PO Processing Cost Reduction', nameAr: 'خفض تكلفة معالجة أوامر الشراء', target: '>40%', benchmark: '21%', unit: '%' },
        { name: 'Invoice Processing Time', nameAr: 'زمن معالجة الفواتير', target: '<2 days', targetAr: 'أقل من يومين', benchmark: '8.5 days', benchmarkAr: '8.5 أيام', unit: 'days', unitAr: 'أيام' },
        { name: 'Manual Touchpoints Eliminated', nameAr: 'نقاط التلامس اليدوية المُزالة', target: '>60%', benchmark: '25%', unit: '%' },
      ]},
      { category: 'Insights & Analytics', categoryAr: 'الرؤى والتحليلات', metrics: [
        { name: 'Real-Time KPI Dashboard Coverage', nameAr: 'تغطية لوحة المؤشرات اللحظية', target: '100%', benchmark: '35%', unit: '% of KPIs', unitAr: '% من المؤشرات' },
        { name: 'Forecast Accuracy (AI-enhanced)', nameAr: 'دقّة التوقّع (معزّزة بالذكاء الاصطناعي)', target: '>87%', benchmark: '72%', unit: '%' },
        { name: 'Spend Visibility (% classified)', nameAr: 'وضوح الإنفاق (% المصنّف)', target: '>95%', benchmark: '68%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['ERP utilisation audit — identify unused modules', 'Spend data extraction and classification', 'Power BI procurement dashboard (4 weeks)'], quickWinsAr: ['تدقيق استخدام ERP — تحديد الوحدات غير المستخدمة', 'استخراج بيانات الإنفاق وتصنيفها', 'لوحة مشتريات Power BI (4 أسابيع)'], projects: [{ title: 'SAP MM/SCM Optimisation', titleAr: 'تحسين SAP MM/SCM', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: '35% manual process reduction', impactAr: 'خفض العمليات اليدوية 35%' }, { title: 'Procurement Analytics Dashboard', titleAr: 'لوحة تحليلات المشتريات', duration: '6 weeks', durationAr: '6 أسابيع', impact: 'Real-time spend & supplier KPI visibility', impactAr: 'وضوح لحظي لمؤشرات الإنفاق والمورّدين' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['ZATCA e-invoicing readiness check', 'Current procurement technology audit', 'Tender management workflow map'], quickWinsAr: ['فحص جاهزية الفوترة الإلكترونية لـ ZATCA', 'تدقيق تقنية المشتريات الحالية', 'خريطة سير عمل إدارة المناقصات'], projects: [{ title: 'e-Procurement Platform Deployment', titleAr: 'نشر منصة المشتريات الإلكترونية', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: '40% cycle time reduction, 100% audit trail', impactAr: 'خفض زمن الدورة 40%، ومسار تدقيق 100%' }, { title: 'Supply Chain Visibility Dashboard', titleAr: 'لوحة وضوح سلسلة الإمداد', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'Real-time procurement KPIs for leadership', impactAr: 'مؤشرات مشتريات لحظية للقيادة' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['SAP MM master data quality audit', 'MRO catalogue build (top 200 items)', 'Supplier portal readiness assessment'], quickWinsAr: ['تدقيق جودة البيانات الرئيسية لـ SAP MM', 'بناء كتالوج الصيانة والتشغيل (أعلى 200 صنف)', 'تقييم جاهزية بوابة المورّدين'], projects: [{ title: 'SAP Ariba Deployment', titleAr: 'نشر SAP Ariba', duration: '24 weeks', durationAr: '24 أسبوعاً', impact: 'Fully digitised source-to-pay process', impactAr: 'عملية توريد حتى الدفع مرقمنة بالكامل' }, { title: 'Maintenance Materials Optimisation', titleAr: 'تحسين مواد الصيانة', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '18% MRO inventory reduction via catalogue', impactAr: 'خفض مخزون الصيانة والتشغيل 18% عبر الكتالوج' }] },
      { industry: 'Retail', industryAr: 'التجزئة', quickWins: ['Demand planning tool assessment', 'Inventory management module review', 'Omnichannel flow data mapping'], quickWinsAr: ['تقييم أداة تخطيط الطلب', 'مراجعة وحدة إدارة المخزون', 'ربط بيانات التدفّق متعدّد القنوات'], projects: [{ title: 'Odoo/Dynamics SC Module', titleAr: 'وحدة سلسلة إمداد Odoo/Dynamics', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Integrated POS-to-replenishment flow', impactAr: 'تدفّق متكامل من نقطة البيع إلى إعادة التموين' }, { title: 'AI Demand Sensing Deployment', titleAr: 'نشر استشعار الطلب بالذكاء الاصطناعي', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '15% forecast accuracy improvement', impactAr: 'تحسّن دقّة التوقّع 15%' }] },
    ],
    challenges: [
      { challenge: 'ERP deployed but only 40% of modules used — investment not realised', challengeAr: 'ERP مُطبَّق لكن يُستخدم 40% فقط من وحداته — الاستثمار غير مُتحقَّق', impact: 'Manual workarounds persist; duplicate data entry; KPIs not available in real time', impactAr: 'حلول يدوية بديلة مستمرة؛ وإدخال بيانات مكرّر؛ ومؤشرات غير متاحة لحظياً', solution: 'ERP optimisation programme: process-to-system mapping, configuration review, master data cleanse, and user re-training', solutionAr: 'برنامج تحسين ERP: ربط العملية بالنظام، ومراجعة التهيئة، وتنظيف البيانات الرئيسية، وإعادة تدريب المستخدمين', framework: 'SAP Activate / Microsoft Sure Step' },
      { challenge: 'Technology selected before process designed — system amplifies broken process', challengeAr: 'اختيار التقنية قبل تصميم العملية — النظام يضخّم العملية المعطوبة', impact: 'Digital transformation delivers digital chaos — same problems, faster', impactAr: 'يقدّم التحوّل الرقمي فوضى رقمية — نفس المشاكل، بشكل أسرع', solution: 'Process-first principle: design future-state process, then configure technology to support it — not the reverse', solutionAr: 'مبدأ العملية أولاً: تصميم عملية الحالة المستقبلية، ثم تهيئة التقنية لدعمها — لا العكس', framework: 'ISC Digital Transformation Principle' },
      { challenge: 'Low user adoption after go-live — system not used as designed', challengeAr: 'تبنّي مستخدمين منخفض بعد التشغيل — النظام لا يُستخدم كما صُمّم', impact: 'ROI not achieved; business reverts to spreadsheets and workarounds within 6 months', impactAr: 'العائد على الاستثمار غير مُتحقَّق؛ وترتدّ الأعمال إلى الجداول والحلول البديلة خلال 6 أشهر', solution: 'Prosci ADKAR change management, role-based training, hyper-care support, and adoption monitoring dashboard', solutionAr: 'إدارة تغيير Prosci ADKAR، وتدريب قائم على الأدوار، ودعم رعاية مكثّفة، ولوحة مراقبة التبنّي', framework: 'Prosci ADKAR' },
      { challenge: 'Data quality prevents meaningful analytics — "garbage in, garbage out"', challengeAr: 'جودة البيانات تمنع تحليلات ذات معنى — "مدخلات رديئة، مخرجات رديئة"', impact: 'Management decisions based on unreliable data; dashboards distrust', impactAr: 'قرارات إدارية مبنية على بيانات غير موثوقة؛ وانعدام الثقة باللوحات', solution: 'Master data governance programme: data ownership, cleanse, validation rules, and ongoing data quality monitoring', solutionAr: 'برنامج حوكمة البيانات الرئيسية: ملكية البيانات، والتنظيف، وقواعد التحقّق، ومراقبة جودة البيانات المستمرة', framework: 'ISO 8000 / DAMA' },
      { challenge: 'Integration between systems is manual — islands of automation', challengeAr: 'التكامل بين الأنظمة يدوي — جزر أتمتة منعزلة', impact: 'Re-keying between ERP, procurement platform, and finance creates errors and delays', impactAr: 'إعادة الإدخال بين ERP ومنصة المشتريات والمالية تُنتج أخطاءً وتأخيراً', solution: 'Integration architecture design with API-based connections between ERP, e-procurement, logistics, and finance systems', solutionAr: 'تصميم معمارية تكامل باتصالات قائمة على API بين ERP والمشتريات الإلكترونية والخدمات اللوجستية وأنظمة المالية', framework: 'Enterprise Architecture / SAP Integration' },
    ],
    achievements: [
      { title: 'SAP Ariba deployed — 40% cycle time reduction', titleAr: 'نشر SAP Ariba — خفض زمن الدورة 40%', client: 'Saudi energy company', industry: 'Energy', industryAr: 'الطاقة', result: 'Full source-to-pay digitisation, 500+ suppliers onboarded, zero-paper procurement', resultAr: 'رقمنة كاملة للتوريد حتى الدفع، وإدماج أكثر من 500 مورّد، ومشتريات بلا ورق', timeframe: '24 weeks', timeframeAr: '24 أسبوعاً' },
      { title: 'Power BI dashboard — real-time procurement KPIs', titleAr: 'لوحة Power BI — مؤشرات مشتريات لحظية', client: 'Jordanian government ministry', industry: 'Government', industryAr: 'الحكومة', result: 'ERP-connected spend, supplier, and contract dashboards in leadership and operational views', resultAr: 'لوحات إنفاق ومورّدين وعقود متصلة بـ ERP في عرضَي القيادة والتشغيل', timeframe: '8 weeks', timeframeAr: '8 أسابيع' },
      { title: 'Odoo SCM implementation — integrated operations', titleAr: 'تطبيق Odoo SCM — عمليات متكاملة', client: 'GCC retail chain', industry: 'Retail', industryAr: 'التجزئة', result: 'POS-to-warehouse-to-replenishment fully integrated, manual PO entry eliminated', resultAr: 'تكامل كامل من نقطة البيع إلى المستودع إلى إعادة التموين، وإزالة الإدخال اليدوي لأوامر الشراء', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' },
    ],
  },
];

// remaining solutions as stubs with basic structure
const REMAINING_SLUGS = [
  'contract-lifecycle-management', 'supplier-relationship-governance', 'resiliency',
  'value-engineering', 'process-improvement-policy', 'training-capability-building',
];

const TABS = ['Overview', 'Frameworks', 'KPIs', 'Projects & Quick Wins', 'Challenges', 'Achievements'];

const TABS_AR = ['نظرة عامة', 'الأطر', 'مؤشرات الأداء', 'المشاريع والمكاسب السريعة', 'التحديات', 'الإنجازات'];

export function SolutionDetail() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const [activeTab, setActiveTab] = useState(0);
  const [frameworkLevel, setFrameworkLevel] = useState<'strategic' | 'tactical' | 'operational'>('strategic');
  const [industryIdx, setIndustryIdx] = useState(0);
  const [openChallenge, setOpenChallenge] = useState<number | null>(0);

  const sol = SOLUTIONS.find(s => s.slug === slug);

  if (!sol) {
    const isKnown = REMAINING_SLUGS.includes(slug);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
        <Shield className="w-16 h-16 text-primary/30" />
        <h1 className="text-2xl font-bold text-primary">
          {isKnown ? (isAr ? 'صفحة التفاصيل الكاملة قريباً' : 'Full detail page coming soon') : (isAr ? 'الحل غير موجود' : 'Solution not found')}
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          {isKnown
            ? (isAr ? 'نعمل على بناء المحتوى المتعمّق لهذا الحل. في هذه الأثناء، احجز استشارة لمناقشة كيف يمكننا المساعدة.' : "We're building the deep-dive content for this solution. In the meantime, book a consultation to discuss how we can help.")
            : (isAr ? 'تعذّر العثور على الحل الذي تبحث عنه.' : 'The solution you are looking for could not be found.')}
        </p>
        <div className="flex gap-3">
          <Link href="/#solutions"><Button variant="outline">{isAr ? '→ جميع الحلول' : '← All Solutions'}</Button></Link>
          <Link href="/consultant"><Button className="bg-primary text-white">{isAr ? 'احجز استشارة' : 'Book Consultation'}</Button></Link>
        </div>
      </div>
    );
  }

  const Icon = sol.icon;
  const fwLevel = sol.frameworks[frameworkLevel];
  const industryData = sol.projects[industryIdx] ?? sol.projects[0];

  return (
    <div className="w-full">
      {/* Hero */}
      <div className={`relative w-full overflow-hidden bg-gradient-to-br ${sol.bgGrad} py-14 px-4`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <Link href="/#solutions">
            <span className="flex items-center gap-1 text-white/60 text-sm mb-5 hover:text-white transition-colors cursor-pointer w-fit">
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {isAr ? 'جميع الحلول' : 'All Solutions'}
            </span>
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">{isAr ? (sol.titleAr ?? sol.title) : sol.title}</h1>
              <p className="text-white/75 text-lg max-w-2xl">{isAr ? (sol.taglineAr ?? sol.tagline) : sol.tagline}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">{isAr ? 'احجز استشارة' : 'Book a Consultation'}</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">{isAr ? 'تشخيص مجاني بالذكاء الاصطناعي' : 'Free AI Diagnostic'}</Button></Link>
          </div>
        </div>
      </div>

      {/* Sticky Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
              {isAr ? TABS_AR[i] : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary mb-3">{isAr ? (sol.titleAr ?? sol.title) : sol.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">{isAr ? (sol.descriptionAr ?? sol.description) : sol.description}</p>
              <div className="space-y-3">
                {sol.achievements.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground font-medium">{isAr ? (a.titleAr ?? a.title) : a.title}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[{ label: isAr ? 'متوسط التوفير' : 'Avg Savings', val: '12–18%' }, { label: isAr ? 'متوسط خفض المهلة' : 'Avg Lead Time ↓', val: '35%' }, { label: isAr ? 'عملاء تمّت خدمتهم' : 'Clients Served', val: '40+' }].map(s => (
                  <div key={s.label} className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.08} className="bg-[#082C6B] rounded-2xl p-7 text-white">
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-3">{isAr ? 'نهج ISC' : 'ISC Approach'}</p>
              <h3 className="font-bold text-lg mb-4">{isAr ? `كيف نقدّم ${sol.titleAr ?? sol.title}` : `How we deliver ${sol.title}`}</h3>
              <ol className="space-y-3">
                {(isAr
                  ? ['التشخيص — تقييم الوضع الحالي مقابل المعيار العالمي', 'الاستراتيجية — اختيار إطار مخصّص وخارطة طريق مرحلية', 'التنفيذ — نشر عملي مع فريقك', 'القياس — لوحة مؤشرات أداء والتحقّق من الأداء', 'الحوكمة — إيقاع مراجعة مستمر ودورة تحسين']
                  : ['Diagnostic — current-state assessment vs global benchmark', 'Strategy — tailored framework selection and phased roadmap', 'Implementation — hands-on deployment with your team', 'Measurement — KPI dashboard and performance verification', 'Governance — ongoing review cadence and improvement cycle']
                ).map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-5 pt-5 border-t border-white/15">
                <p className="text-xs text-white/60">{isAr ? 'مَعِن الحقش — MCIPS · CPSM · ماجستير · أكثر من 20 عاماً · BP · Maersk · الحكومة السعودية' : "Ma'in Alhaqash — MCIPS · CPSM · MSc · 20+ years · BP · Maersk · Saudi Government"}</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 1 — FRAMEWORKS */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{isAr ? 'الأطر حسب المستوى' : 'Frameworks by Level'}</h2>
                <p className="text-muted-foreground mt-1">{isAr ? 'أطر على مستوى المجلس والإدارة والتشغيل — من الاستراتيجية إلى التنفيذ اليومي.' : 'Board, management, and operational frameworks — from strategy to day-to-day execution.'}</p>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['strategic', 'tactical', 'operational'] as const).map(lvl => (
                  <button key={lvl} onClick={() => setFrameworkLevel(lvl)}
                    className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${frameworkLevel === lvl ? 'bg-primary text-white' : 'bg-white text-muted-foreground hover:bg-muted'}`}>
                    {lvl === 'strategic' ? (isAr ? 'L1 استراتيجي' : 'L1 Strategic') : lvl === 'tactical' ? (isAr ? 'L2 تكتيكي' : 'L2 Tactical') : (isAr ? 'L3 تشغيلي' : 'L3 Operational')}
                  </button>
                ))}
              </div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {fwLevel.map((fw, i) => (
                <Reveal key={fw.name} delay={i * 0.07}>
                  <div className="bg-white border border-border rounded-2xl p-6 h-full flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-primary text-lg leading-snug">{isAr ? (fw.nameAr ?? fw.name) : fw.name}</h3>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15 shrink-0 ml-3">{fw.standard}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? (fw.descAr ?? fw.desc) : fw.desc}</p>
                    <div className="mt-auto">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{isAr ? 'الأدوات الرئيسية' : 'Key Tools'}</p>
                      <div className="flex flex-wrap gap-2">
                        {(isAr ? (fw.toolsAr ?? fw.tools) : fw.tools).map(t => (
                          <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-muted border border-border rounded-2xl p-6">
              <p className="text-sm font-bold text-primary mb-2">{isAr ? 'كيف تختار ISC مستوى الإطار المناسب' : 'How ISC selects the right framework level'}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'يبدأ كل ارتباط بتشخيص لتحديد المستوى الأكثر ملاءمة. تستفيد المؤسسات في مراحلها المبكّرة من أدوات المستوى L3 التشغيلية أولاً؛ بينما تحتاج المؤسسات الناضجة إلى إعادة تصميم استراتيجي على مستوى L1. تنشر ISC الأطر ضمن سياقها — وليس كبرنامج موحّد للجميع.' : 'Every engagement starts with a diagnostic to determine which level is most relevant. Early-stage organisations benefit from L3 operational tools first; mature organisations need L1 strategic redesign. ISC deploys frameworks in context — never as a one-size-fits-all programme.'}</p>
            </Reveal>
          </div>
        )}

        {/* TAB 2 — KPIs */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'إطار مؤشرات الأداء' : 'KPI Framework'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'أهداف مستمدّة من المعايير المرجعية لقطاعات الخليج، ومعايير CIPS، وبيانات ارتباطات مَعِن عبر أكثر من 40 مؤسسة.' : "Targets derived from GCC industry benchmarks, CIPS standards, and Ma'in's engagement data across 40+ organisations."}</p>
            </Reveal>
            {sol.kpis.map((cat, ci) => (
              <Reveal key={cat.category} delay={ci * 0.06}>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />{isAr ? (cat.categoryAr ?? cat.category) : cat.category}</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {cat.metrics.map((m, mi) => (
                      <div key={mi} className="bg-muted rounded-xl p-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{isAr ? (m.nameAr ?? m.name) : m.name}</p>
                        <p className="text-2xl font-extrabold text-[#C9A84C] mb-1">{isAr ? (m.targetAr ?? m.target) : m.target}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{isAr ? 'المعيار المرجعي: ' : 'Benchmark: '}{isAr ? (m.benchmarkAr ?? m.benchmark) : m.benchmark}</span>
                          <span className="text-xs font-medium text-muted-foreground">{isAr ? (m.unitAr ?? m.unit) : m.unit}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full" style={{ width: '65%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal className="bg-[#082C6B] rounded-2xl p-6 text-white">
              <p className="font-bold mb-2">{isAr ? `لوحة مقترحة: ${sol.titleAr ?? sol.title}` : `Suggested Dashboard: ${sol.title}`}</p>
              <p className="text-white/70 text-sm mb-3">{isAr ? 'توصي ISC بلوحة من 3 طبقات: المجلس (شهرياً، 5–6 مؤشرات رئيسية)، الإدارة (أسبوعياً، 12–15 مؤشراً حسب الفئة)، التشغيل (يومياً، مقاييس على مستوى العملية). مبنية على Power BI ومتصلة ببيانات ERP.' : 'ISC recommends a 3-layer dashboard: Board (monthly, 5–6 headline KPIs), Management (weekly, 12–15 category KPIs), Operational (daily, process-level metrics). Built in Power BI, connected to ERP data.'}</p>
              <Link href="/consultant"><span className="text-[#C9A84C] text-sm font-semibold cursor-pointer hover:underline">{isAr ? 'اطلب تصميم لوحة ←' : 'Request dashboard design →'}</span></Link>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — PROJECTS & QUICK WINS */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{isAr ? 'المشاريع والمكاسب السريعة' : 'Projects & Quick Wins'}</h2>
                <p className="text-muted-foreground mt-1">{isAr ? 'برامج خاصة بكل قطاع ومكاسب سريعة خلال 30 يوماً لبدء تحقيق القيمة فوراً.' : 'Industry-specific programmes and 30-day quick wins to start generating value immediately.'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sol.projects.map((p, i) => (
                  <button key={p.industry} onClick={() => setIndustryIdx(i)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${industryIdx === i ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
                    {isAr ? (p.industryAr ?? p.industry) : p.industry}
                  </button>
                ))}
              </div>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="bg-white border border-border rounded-2xl p-6 h-full shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#C9A84C]" />
                    <h3 className="font-bold text-primary">{isAr ? 'مكاسب سريعة خلال 30 يوماً' : '30-Day Quick Wins'}</h3>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{isAr ? 'قيمة سريعة' : 'Fast Value'}</span>
                  </div>
                  <ul className="space-y-3">
                    {(isAr ? (industryData.quickWinsAr ?? industryData.quickWins) : industryData.quickWins).map((w, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={0.07}>
                <div className="bg-white border border-border rounded-2xl p-6 h-full shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Rocket className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-primary">{isAr ? 'مشاريع مقترحة' : 'Suggested Projects'}</h3>
                  </div>
                  <div className="space-y-4">
                    {industryData.projects.map((p, i) => (
                      <div key={i} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-primary text-sm leading-snug">{isAr ? (p.titleAr ?? p.title) : p.title}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shrink-0">{isAr ? (p.durationAr ?? p.duration) : p.duration}</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> {isAr ? (p.impactAr ?? p.impact) : p.impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        )}

        {/* TAB 4 — CHALLENGES */}
        {activeTab === 4 && (
          <div className="space-y-5">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'التحديات وكيفية تجاوزها' : 'Challenges & How to Overcome Them'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'أكثر العوائق شيوعاً التي تواجهها ISC — والنُّهج المُثبتة لحلّها.' : 'The most common barriers ISC encounters — and the proven approaches to resolving them.'}</p>
            </Reveal>
            {sol.challenges.map((c, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenChallenge(openChallenge === i ? null : i)}>
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-primary">{isAr ? (c.challengeAr ?? c.challenge) : c.challenge}</p>
                      <p className="text-xs text-red-600 font-medium mt-1">{isAr ? 'الأثر: ' : 'Impact: '}{isAr ? (c.impactAr ?? c.impact) : c.impact}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openChallenge === i ? 'rotate-90' : 'rtl:rotate-180'}`} />
                  </button>
                  {openChallenge === i && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                      <div className="p-5 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{isAr ? 'نهج ISC للحل' : 'ISC Solution Approach'}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? (c.solutionAr ?? c.solution) : c.solution}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-accent">{c.framework}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* TAB 5 — ACHIEVEMENTS */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'إنجازات واقعية' : 'Real-World Achievements'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'مُنجَزة بواسطة مَعِن الحقش MCIPS CPSM عبر الخليج والأردن وارتباطات دولية.' : "Delivered by Ma'in Alhaqash MCIPS CPSM across GCC, Jordan, and international engagements."}</p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {sol.achievements.map((a, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <div className="bg-gradient-to-br from-[#082C6B] to-[#0B3D91] rounded-2xl p-7 text-white flex flex-col h-full">
                    <Star className="w-6 h-6 text-[#C9A84C] mb-4" />
                    <p className="text-2xl font-extrabold text-[#C9A84C] mb-3 leading-tight">{isAr ? (a.titleAr ?? a.title) : a.title}</p>
                    <p className="text-white/75 text-sm leading-relaxed flex-1">{isAr ? (a.resultAr ?? a.result) : a.result}</p>
                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
                      <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5" />{isAr ? (a.industryAr ?? a.industry) : a.industry}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{isAr ? (a.timeframeAr ?? a.timeframe) : a.timeframe}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-2xl p-8 text-white text-center mt-4">
              <Award className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">{isAr ? 'جاهز لتحقيق نتائج مماثلة؟' : 'Ready to achieve similar results?'}</h3>
              <p className="text-white/70 mb-5 text-sm">{isAr ? 'احجز استشارة سرّية مدّتها 45 دقيقة مع مَعِن لمناقشة وضعك الخاص.' : "Book a confidential 45-minute consultation with Ma'in to discuss your specific situation."}</p>
              <Link href="/consultant">
                <Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold px-8">{isAr ? 'احجز استشارة' : 'Book Consultation'}</Button>
              </Link>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
