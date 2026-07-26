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
import { KPIDashboard } from '@/components/KPIDashboard';
import { ChallengeToolkitPanel } from '@/components/toolkit/ChallengeChecklists';
import { ProcurementToolsSection } from '@/components/toolkit/ProcurementTools';
import { RiskToolsSection } from '@/components/toolkit/RiskTools';
import { SupplierScorecardTool } from '@/components/toolkit/SupplierScorecard';
import { ContractHealthChecker } from '@/components/toolkit/CLMTools';
import { TrainingNeedsAssessment } from '@/components/toolkit/TrainingTools';
import { MaturityAssessmentTool } from '@/components/toolkit/MaturityTools';

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
      { title: 'ISC dashboard — real-time procurement KPIs', titleAr: 'لوحة ISC — مؤشرات مشتريات لحظية', client: 'Jordanian government ministry', industry: 'Government', industryAr: 'الحكومة', result: 'ERP-connected spend, supplier, and contract dashboards in leadership and operational views', resultAr: 'لوحات إنفاق ومورّدين وعقود متصلة بـ ERP في عرضَي القيادة والتشغيل', timeframe: '8 weeks', timeframeAr: '8 أسابيع' },
      { title: 'Odoo SCM implementation — integrated operations', titleAr: 'تطبيق Odoo SCM — عمليات متكاملة', client: 'GCC retail chain', industry: 'Retail', industryAr: 'التجزئة', result: 'POS-to-warehouse-to-replenishment fully integrated, manual PO entry eliminated', resultAr: 'تكامل كامل من نقطة البيع إلى المستودع إلى إعادة التموين، وإزالة الإدخال اليدوي لأوامر الشراء', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' },
    ],
  },

  /* ─── CONTRACT LIFECYCLE MANAGEMENT ─── */
  {
    slug: 'contract-lifecycle-management',
    title: 'Contract Lifecycle Management', titleAr: 'إدارة دورة حياة العقود',
    tagline: 'From contract authoring to renewal — full CLM that protects value, ensures compliance, and eliminates leakage across the GCC.',
    taglineAr: 'من صياغة العقد إلى تجديده — إدارة متكاملة لدورة حياة العقد تحمي القيمة وتضمن الامتثال وتلغي التسرّب عبر الخليج.',
    description: 'Most GCC organisations manage contracts in email folders and spreadsheets — losing track of obligations, missing renewal windows, and exposing themselves to regulatory non-compliance. ISC deploys the IACCM CLM framework to transform contract management from an administrative task into a strategic commercial capability: structured authoring, obligation tracking, risk allocation, and renewal intelligence.',
    descriptionAr: 'تدير معظم المنشآت الخليجية عقودها عبر صناديق البريد والجداول الحسابية — مما يُفقدها متابعة الالتزامات، ويُفوّتها نوافذ التجديد، ويُعرّضها لعدم الامتثال التنظيمي. تنشر ISC إطار IACCM لإدارة دورة حياة العقود لتحويل إدارة العقود من مهمة إدارية إلى قدرة تجارية استراتيجية: صياغة منظّمة، وتتبّع الالتزامات، وتوزيع المخاطر، وذكاء التجديد.',
    icon: FileText, color: 'text-violet-600', bgGrad: 'from-violet-700 to-violet-900',
    frameworks: {
      strategic: [
        { name: 'IACCM CLM Framework', nameAr: 'إطار IACCM لإدارة دورة حياة العقود', desc: 'World Commerce & Contracting 7-stage lifecycle: Initiation → Authoring → Negotiation → Approval → Execution → Obligation Management → Renewal/Close.', descAr: 'دورة حياة من 7 مراحل من World Commerce & Contracting: البدء ← الصياغة ← التفاوض ← الاعتماد ← التنفيذ ← إدارة الالتزامات ← التجديد/الإغلاق.', tools: ['Contract playbook', 'Clause library', 'Risk allocation matrix', 'Obligation register'], toolsAr: ['دليل العقود', 'مكتبة البنود', 'مصفوفة توزيع المخاطر', 'سجلّ الالتزامات'], standard: 'IACCM / World Commerce & Contracting' },
        { name: 'Commercial Risk Allocation', nameAr: 'توزيع المخاطر التجارية', desc: 'Systematic identification and allocation of commercial, legal, and operational risks at contract inception — before negotiation begins.', descAr: 'تحديد ممنهج لمخاطر الأعمال والمخاطر القانونية والتشغيلية وتوزيعها عند بدء التعاقد — قبل الشروع في التفاوض.', tools: ['Risk register (contract-level)', 'Indemnity mapping', 'Liability cap analysis', 'Force majeure clauses'], toolsAr: ['سجلّ المخاطر (على مستوى العقد)', 'رسم خرائط التعويض', 'تحليل سقف المسؤولية', 'بنود القوة القاهرة'], standard: 'IACCM / FIDIC / Saudi Law' },
        { name: 'Compliance & Regulatory Alignment', nameAr: 'المواءمة مع الامتثال والتنظيم', desc: 'Aligning every contract with ZATCA, GTPL, SFDA, Vision 2030 local content requirements, and applicable GCC commercial law.', descAr: 'مواءمة كل عقد مع ZATCA ونظام المنافسات (GTPL) وهيئة الغذاء والدواء (SFDA) ومتطلبات المحتوى المحلي لرؤية 2030 وقانون التجارة الخليجي المعمول به.', tools: ['Regulatory clause checklist', 'e-Invoicing (Fatoora) compliance', 'Local content schedules', 'GTPL tender clauses'], toolsAr: ['قائمة تدقيق البنود التنظيمية', 'امتثال الفوترة الإلكترونية (فاتورة)', 'جداول المحتوى المحلي', 'بنود مناقصات GTPL'], standard: 'ZATCA / GTPL / SFDA' },
      ],
      tactical: [
        { name: 'Contract Playbook Design', nameAr: 'تصميم دليل العقود', desc: 'Pre-negotiated preferred, acceptable, and fallback positions for every standard clause — reducing negotiation time and risk.', descAr: 'مواقف مفضّلة ومقبولة وبديلة مُتفاوَض عليها مسبقاً لكل بند قياسي — لتقليص وقت التفاوض والمخاطر.', tools: ['Clause-by-clause playbook', 'Escalation matrix', 'Red-line vs fallback map'], toolsAr: ['دليل بند بند', 'مصفوفة التصعيد', 'خريطة الخطوط الحمراء مقابل البدائل'], standard: 'IACCM Best Practice' },
        { name: 'Obligation Management System', nameAr: 'نظام إدارة الالتزامات', desc: 'Extract, assign, and track every obligation from every contract — with automated alerts for milestones, deliverables, and renewal windows.', descAr: 'استخراج كل التزام من كل عقد وإسناده وتتبّعه — مع تنبيهات آلية للمعالم والمخرجات ونوافذ التجديد.', tools: ['Obligation extraction template', 'Milestone tracker', 'Renewal calendar (90-day alerts)', 'KPI/SLA monitoring'], toolsAr: ['قالب استخراج الالتزامات', 'متتبّع المعالم', 'تقويم تجديد (تنبيهات 90 يوماً)', 'متابعة مؤشرات الأداء/SLA'], standard: 'IACCM / ISO 44001' },
        { name: 'Negotiation Strategy Framework', nameAr: 'إطار استراتيجية التفاوض', desc: 'Structured preparation, BATNA analysis, and negotiation planning for high-value and complex contracts.', descAr: 'تحضير منظّم وتحليل BATNA وتخطيط تفاوضي للعقود عالية القيمة والمعقّدة.', tools: ['BATNA worksheet', 'Negotiation planner', 'Concession map', 'Authority matrix'], toolsAr: ['ورقة تحليل BATNA', 'مخطّط التفاوض', 'خريطة التنازلات', 'مصفوفة الصلاحيات'], standard: 'Harvard Negotiation / IACCM' },
      ],
      operational: [
        { name: 'Contract Repository & Governance', nameAr: 'مستودع العقود والحوكمة', desc: 'Centralised, searchable contract repository with access controls, version history, and audit trails — replacing email-based management.', descAr: 'مستودع عقود مركزي قابل للبحث مع ضوابط الوصول وتاريخ الإصدارات ومسارات التدقيق — يحلّ محل الإدارة القائمة على البريد الإلكتروني.', tools: ['Repository structure design', 'Metadata taxonomy', 'Access control matrix', 'Audit trail'], toolsAr: ['تصميم هيكل المستودع', 'تصنيف البيانات الوصفية', 'مصفوفة التحكم بالوصول', 'مسار التدقيق'], standard: 'ISO 27001 / IACCM' },
        { name: 'SLA & KPI Monitoring', nameAr: 'متابعة SLA ومؤشرات الأداء', desc: 'Regular measurement of supplier performance against contracted SLAs and KPIs — with penalty/incentive triggers and formal review meetings.', descAr: 'قياس منتظم لأداء المورّد مقابل مستويات الخدمة التعاقدية ومؤشرات الأداء — مع محفّزات الغرامات/الحوافز واجتماعات المراجعة الرسمية.', tools: ['SLA scorecard', 'Performance review agenda', 'Penalty/incentive calculator', 'Dispute resolution process'], toolsAr: ['بطاقة SLA', 'جدول أعمال مراجعة الأداء', 'حاسبة الغرامات/الحوافز', 'إجراء حل النزاعات'], standard: 'IACCM / CIPS' },
      ],
    },
    kpis: [
      { category: 'Cycle Time & Speed', categoryAr: 'زمن الدورة والسرعة', metrics: [
        { name: 'Contract Authoring Cycle Time', nameAr: 'زمن دورة صياغة العقد', target: '<10 days', targetAr: 'أقل من 10 أيام', benchmark: '28 days', benchmarkAr: '28 يوماً', unit: 'days', unitAr: 'أيام' },
        { name: 'Negotiation Cycle Time', nameAr: 'زمن دورة التفاوض', target: '<15 days', targetAr: 'أقل من 15 يوماً', benchmark: '35 days', benchmarkAr: '35 يوماً', unit: 'days', unitAr: 'أيام' },
        { name: 'Contract-to-Execution Time', nameAr: 'الزمن من التعاقد إلى التنفيذ', target: '<5 days', targetAr: 'أقل من 5 أيام', benchmark: '12 days', benchmarkAr: '12 يوماً', unit: 'days', unitAr: 'أيام' },
      ]},
      { category: 'Compliance & Risk', categoryAr: 'الامتثال والمخاطر', metrics: [
        { name: 'Contract Compliance Rate', nameAr: 'معدّل امتثال العقود', target: '>95%', benchmark: '74%', unit: '%' },
        { name: 'Deviation from Template Rate', nameAr: 'معدّل الانحراف عن القالب', target: '<15%', benchmark: '38%', unit: '%' },
        { name: 'Regulatory Clause Coverage', nameAr: 'تغطية البنود التنظيمية', target: '100%', benchmark: '68%', unit: '%' },
      ]},
      { category: 'Value & Renewal', categoryAr: 'القيمة والتجديد', metrics: [
        { name: 'On-Time Renewal Capture Rate', nameAr: 'معدّل التقاط التجديد في الوقت المحدد', target: '>95%', benchmark: '61%', unit: '%' },
        { name: 'Contract Value Leakage', nameAr: 'تسرّب قيمة العقد', target: '<2%', benchmark: '8.5%', unit: '% of contract value', unitAr: '% من قيمة العقد' },
        { name: 'SLA Breach Rate (supplier)', nameAr: 'معدّل مخالفة SLA (المورّد)', target: '<3%', benchmark: '14%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Audit all active contracts — flag expiries in next 90 days', 'Create a standard contract template for top 3 spend categories', 'Issue playbook: approved vs red-line clauses for recurring contracts'], quickWinsAr: ['تدقيق جميع العقود النشطة — تمييز تواريخ انتهاء الـ 90 يوماً القادمة', 'إنشاء قالب عقد قياسي لأعلى 3 فئات إنفاق', 'إصدار دليل: البنود المعتمدة مقابل الخطوط الحمراء للعقود المتكرّرة'], projects: [{ title: 'CLM Framework Deployment', titleAr: 'نشر إطار إدارة دورة حياة العقود', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: '60% reduction in authoring cycle time', impactAr: 'خفض زمن دورة الصياغة 60%' }, { title: 'GTPL-Aligned Contract Playbook', titleAr: 'دليل عقود متوائم مع GTPL', duration: '6 weeks', durationAr: '6 أسابيع', impact: '100% regulatory clause coverage', impactAr: 'تغطية 100% للبنود التنظيمية' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Map all sole-source and long-term contracts for renewal risk', 'Add ZATCA e-invoicing clause to all active supplier contracts', 'Build 90-day expiry alert calendar in shared drive'], quickWinsAr: ['رسم خرائط جميع عقود المصدر الوحيد والطويلة الأجل لمخاطر التجديد', 'إضافة بند الفوترة الإلكترونية (ZATCA) إلى جميع عقود المورّدين النشطة', 'بناء تقويم تنبيهات انتهاء 90 يوماً في مجلد مشترك'], projects: [{ title: 'EPC Contract Governance', titleAr: 'حوكمة عقود EPC', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'SAR 12M+ value leakage recovered', impactAr: 'استرداد تسرّب قيمة يتجاوز 12 مليون ريال' }, { title: 'Iktva Contract Clause Programme', titleAr: 'برنامج بنود عقود Iktva', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Iktva compliance score +8 points', impactAr: 'زيادة درجة امتثال Iktva بمقدار 8 نقاط' }] },
      { industry: 'Pharma', industryAr: 'الأدوية', quickWins: ['Extract all SLA obligations from top 10 supplier contracts', 'Build penalty/incentive clause template for GDP-critical suppliers', 'Run first contract compliance audit against SFDA requirements'], quickWinsAr: ['استخراج جميع التزامات SLA من أعلى 10 عقود مورّدين', 'بناء قالب بند غرامات/حوافز للمورّدين الحرجين من حيث GDP', 'إجراء أول تدقيق امتثال عقود مقابل متطلبات SFDA'], projects: [{ title: 'Pharma CLM & SLA Framework', titleAr: 'إطار CLM وSLA للأدوية', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'SLA breach rate reduced from 22% to 4%', impactAr: 'خفض معدّل مخالفة SLA من 22% إلى 4%' }, { title: 'Contract Repository Build', titleAr: 'بناء مستودع العقود', duration: '6 weeks', durationAr: '6 أسابيع', impact: '100% contract visibility achieved', impactAr: 'تحقيق رؤية 100% للعقود' }] },
      { industry: 'Construction', industryAr: 'الإنشاءات', quickWins: ['Map all FIDIC contracts — assign obligation owners', 'Identify top 5 variation claims and build resolution protocol', 'Create a standard sub-contractor SLA with penalty schedule'], quickWinsAr: ['رسم خرائط جميع عقود FIDIC — تعيين مُلّاك الالتزامات', 'تحديد أعلى 5 مطالبات تعديل وبناء بروتوكول حل', 'إنشاء SLA معياري للمقاولين من الباطن مع جدول غرامات'], projects: [{ title: 'EPC Subcontract Governance', titleAr: 'حوكمة تعاقدات الباطن في EPC', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: '35% reduction in variation claims', impactAr: 'خفض مطالبات التعديل 35%' }, { title: 'FIDIC Playbook Deployment', titleAr: 'نشر دليل FIDIC', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Negotiation cycle time cut by 50%', impactAr: 'خفض زمن دورة التفاوض 50%' }] },
    ],
    challenges: [
      { challenge: 'Contracts managed in email and shared drives — no central repository', challengeAr: 'إدارة العقود عبر البريد الإلكتروني والمجلدات المشتركة — لا مستودع مركزي', impact: 'Renewal windows missed; obligations untraceable; regulatory exposure in audits', impactAr: 'ضياع نوافذ التجديد؛ وعدم إمكانية تتبّع الالتزامات؛ وانكشاف تنظيمي في حالات التدقيق', solution: 'Deploy structured contract repository with metadata taxonomy, version control, and automated 90-day renewal alerts across all active contracts', solutionAr: 'نشر مستودع عقود منظّم بتصنيف بيانات وصفية وتحكّم في الإصدارات وتنبيهات تجديد آلية لمدة 90 يوماً لجميع العقود النشطة', framework: 'IACCM CLM' },
      { challenge: 'Contract authoring is ad hoc — no standard clauses or playbook', challengeAr: 'صياغة العقود عشوائية — لا بنود قياسية ولا دليل تفاوضي', impact: 'Inconsistent risk allocation; lawyers rewrite the same clauses repeatedly; delays in execution', impactAr: 'توزيع غير متّسق للمخاطر؛ وإعادة صياغة نفس البنود مراراً من قِبَل المحامين؛ وتأخّر في التنفيذ', solution: 'Build a contract playbook with preferred/acceptable/fallback positions for every standard clause; create a clause library approved by legal for procurement staff to use directly', solutionAr: 'بناء دليل عقود بمواقف مفضّلة/مقبولة/بديلة لكل بند قياسي؛ وإنشاء مكتبة بنود معتمدة قانونياً لاستخدام موظفي المشتريات مباشرةً', framework: 'IACCM / World Commerce & Contracting' },
      { challenge: 'Obligation management is manual — SLAs not tracked post-signature', challengeAr: 'إدارة الالتزامات يدوية — لا متابعة لـ SLA بعد التوقيع', impact: 'Supplier under-performance goes undetected; penalty clauses never enforced; contract value leaks', impactAr: 'يمرّ ضعف أداء المورّد دون اكتشاف؛ ولا تُطبَّق بنود الغرامات قط؛ وتتسرّب قيمة العقد', solution: 'Extract all obligations from active contracts; assign owners; build KPI scorecard and SLA review meeting cadence; automate milestone alerts', solutionAr: 'استخراج جميع الالتزامات من العقود النشطة؛ وتعيين ملّاك؛ وبناء بطاقة مؤشرات أداء ووتيرة اجتماعات مراجعة SLA؛ وأتمتة تنبيهات المعالم', framework: 'IACCM / ISO 44001' },
      { challenge: 'GCC regulatory clauses (ZATCA, GTPL, SFDA) not systematically included', challengeAr: 'البنود التنظيمية الخليجية (ZATCA وGTPL وSFDA) غير مدرجة بصورة منهجية', impact: 'Regulatory non-compliance discovered only at audit; fines and contract voidance risk', impactAr: 'عدم الامتثال التنظيمي يُكتشف فقط عند التدقيق؛ ومخاطر الغرامات وإبطال العقد', solution: 'Build a regulatory clause checklist by jurisdiction (KSA, Jordan, UAE) and contract type; integrate into authoring template as mandatory completion fields', solutionAr: 'بناء قائمة تدقيق بنود تنظيمية حسب الاختصاص القضائي (السعودية، الأردن، الإمارات) ونوع العقد؛ وإدراجها في قالب الصياغة كحقول إلزامية', framework: 'ZATCA / GTPL / SFDA' },
      { challenge: 'No visibility on contract expirations — renewals are reactive', challengeAr: 'لا رؤية على تواريخ انتهاء العقود — التجديدات تفاعلية', impact: 'Contracts auto-renew at unfavourable terms; emergency re-sourcing when contract lapses', impactAr: 'تُجدَّد العقود تلقائياً بشروط غير ملائمة؛ وإعادة توريد طارئة عند انتهاء العقد', solution: 'Build a contract expiry calendar with 180, 90, and 30-day automated alerts; tie renewal decisions to strategic sourcing review cycle', solutionAr: 'بناء تقويم انتهاء عقود مع تنبيهات آلية قبل 180 و90 و30 يوماً؛ وربط قرارات التجديد بدورة مراجعة التوريد الاستراتيجي', framework: 'IACCM CLM / CIPS' },
    ],
    achievements: [
      { title: '60% reduction in contract authoring time', titleAr: 'خفض زمن صياغة العقود 60%', client: 'Saudi government ministry', industry: 'Government', industryAr: 'الحكومة', result: 'CLM playbook and clause library deployed; regulatory compliance rate reached 100%; 0 missed renewals in 12 months', resultAr: 'نشر دليل CLM ومكتبة البنود؛ وبلوغ معدّل امتثال تنظيمي 100%؛ ولا تجديدات فائتة في 12 شهراً', timeframe: '14 weeks', timeframeAr: '14 أسبوعاً' },
      { title: 'SAR 12M value leakage recovered in EPC contracts', titleAr: 'استرداد 12 مليون ريال تسرّباً في عقود EPC', client: 'GCC construction conglomerate', industry: 'Construction', industryAr: 'الإنشاءات', result: 'Obligation management deployed; SLA enforcement activated; variation claims reduced 35%', resultAr: 'نشر إدارة الالتزامات؛ وتفعيل تطبيق SLA؛ وخفض مطالبات التعديل 35%', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' },
      { title: 'SLA breach rate: 22% → 4% (pharma supply chain)', titleAr: 'معدّل مخالفة SLA: من 22% إلى 4% (سلسلة إمداد الأدوية)', client: 'KSA pharmaceutical distributor', industry: 'Pharma', industryAr: 'الأدوية', result: 'All 200+ supplier contracts migrated to structured repository; automated obligation tracking deployed', resultAr: 'ترحيل أكثر من 200 عقد مورّد إلى مستودع منظّم؛ ونشر تتبّع الالتزامات الآلي', timeframe: '10 weeks', timeframeAr: '10 أسابيع' },
    ],
  },

  /* ─── SUPPLIER RELATIONSHIP & GOVERNANCE ─── */
  {
    slug: 'supplier-relationship-governance',
    title: 'Supplier Relationship & Governance', titleAr: 'علاقات الموردين والحوكمة',
    tagline: 'From transactional buying to strategic partnerships — structured SRM that drives performance, resilience, and mutual value across your supplier base.',
    taglineAr: 'من الشراء المعاملاتي إلى الشراكات الاستراتيجية — إدارة علاقات المورّدين المنظّمة التي تدفع الأداء والمرونة والقيمة المشتركة عبر قاعدة مورّديك.',
    description: 'Supplier performance in the GCC is often measured by price alone — missing the bigger picture of quality, reliability, strategic alignment, and long-term risk. ISC deploys a structured SRM programme using CIPS Supplier Segmentation, Kraljic portfolio analysis, and the ISC Supplier Governance Model to transform how organisations select, develop, and govern their supplier relationships.',
    descriptionAr: 'غالباً ما يُقاس أداء المورّدين في الخليج بالسعر وحده — متجاهلاً الصورة الأشمل من جودة وموثوقية ومواءمة استراتيجية ومخاطر طويلة الأجل. تنشر ISC برنامج SRM منظّماً باستخدام تقسيم المورّدين من CIPS وتحليل محفظة Kraljic ونموذج ISC لحوكمة المورّدين لتحويل كيفية اختيار المنشآت لعلاقات المورّدين وتطويرها وحوكمتها.',
    icon: Users, color: 'text-teal-600', bgGrad: 'from-teal-700 to-teal-900',
    frameworks: {
      strategic: [
        { name: 'ISC Supplier Segmentation Model', nameAr: 'نموذج ISC لتقسيم المورّدين', desc: 'Three-tier segmentation: Strategic (joint value creation, exec sponsorship), Preferred (performance partnership, SLA-governed), Transactional (commodity buy, price-led). Different governance models for each tier.', descAr: 'تقسيم ثلاثي: استراتيجي (خلق قيمة مشتركة، رعاية تنفيذية)، مفضّل (شراكة أداء، محكوم بـ SLA)، معاملاتي (شراء سلع، قائم على السعر). نماذج حوكمة مختلفة لكل مستوى.', tools: ['Supplier segmentation matrix', 'Spend-risk portfolio', 'Tier criteria scorecard', 'Executive sponsor map'], toolsAr: ['مصفوفة تقسيم المورّدين', 'محفظة الإنفاق-المخاطر', 'بطاقة معايير المستوى', 'خريطة الراعي التنفيذي'], standard: 'CIPS SRM / Kraljic' },
        { name: 'Joint Business Planning', nameAr: 'التخطيط التجاري المشترك', desc: 'Annual joint business plans with strategic suppliers: shared goals, innovation pipeline, capacity planning, and mutual investment commitments.', descAr: 'خطط أعمال مشتركة سنوية مع المورّدين الاستراتيجيين: أهداف مشتركة وخط أنابيب ابتكار وتخطيط طاقة والتزامات استثمار متبادل.', tools: ['JBP template', 'Innovation pipeline tracker', 'Capacity commitment schedule', 'Relationship health survey'], toolsAr: ['قالب التخطيط التجاري المشترك', 'متتبّع خط أنابيب الابتكار', 'جدول التزام الطاقة', 'استبيان صحة العلاقة'], standard: 'ISO 44001 / CIPS Level 6' },
        { name: 'Supplier Development Programme', nameAr: 'برنامج تطوير المورّدين', desc: 'Structured investment in building supplier capability — quality systems, capacity, digital capability, and GCC compliance readiness.', descAr: 'استثمار منظّم في بناء قدرات المورّدين — أنظمة الجودة والطاقة والقدرة الرقمية والاستعداد للامتثال الخليجي.', tools: ['Supplier capability assessment', 'Development action plan', 'Iktva/local content development', 'Training co-investment'], toolsAr: ['تقييم قدرات المورّد', 'خطة عمل التطوير', 'تطوير Iktva/المحتوى المحلي', 'التدريب المشترك'], standard: 'CIPS / ISO 9001 / Iktva' },
      ],
      tactical: [
        { name: 'Supplier Scorecard & KPIs', nameAr: 'بطاقة تقييم المورّد ومؤشرات الأداء', desc: 'Weighted scorecard measuring suppliers across Delivery, Quality, Cost, Compliance, Innovation, and Relationship dimensions — reviewed monthly/quarterly.', descAr: 'بطاقة تقييم موزونة تقيس المورّدين عبر أبعاد التسليم والجودة والتكلفة والامتثال والابتكار والعلاقة — تُراجَع شهرياً/ربع سنوياً.', tools: ['Weighted scorecard template', 'KPI library by supplier tier', 'Escalation trigger rules', 'Performance trend chart'], toolsAr: ['قالب بطاقة تقييم موزونة', 'مكتبة مؤشرات أداء حسب مستوى المورّد', 'قواعد محفّزات التصعيد', 'مخطّط اتجاه الأداء'], standard: 'CIPS SRM / ISO 9001' },
        { name: 'Supplier Risk Monitoring', nameAr: 'مراقبة مخاطر المورّدين', desc: 'Continuous monitoring of financial health, ESG compliance, geographic exposure, and performance degradation signals for all strategic and preferred suppliers.', descAr: 'مراقبة مستمرة للصحة المالية وامتثال ESG والانكشاف الجغرافي وإشارات تدهور الأداء لجميع المورّدين الاستراتيجيين والمفضّلين.', tools: ['Financial health dashboard', 'ESG audit checklist', 'Supplier risk score', 'Early warning alert system'], toolsAr: ['لوحة الصحة المالية', 'قائمة تدقيق ESG', 'درجة مخاطر المورّد', 'نظام تنبيه الإنذار المبكر'], standard: 'ISO 31000 / CIPS' },
        { name: 'Escalation & Remediation Framework', nameAr: 'إطار التصعيد والمعالجة', desc: 'Structured escalation process when supplier performance falls below threshold — from informal warning through formal improvement plan to exit strategy.', descAr: 'عملية تصعيد منظّمة عند انخفاض أداء المورّد دون العتبة — من التحذير غير الرسمي عبر خطة تحسين رسمية حتى استراتيجية الخروج.', tools: ['Performance improvement plan (PIP)', 'Escalation matrix', 'Exit/transition protocol', 'Root cause analysis template'], toolsAr: ['خطة تحسين الأداء (PIP)', 'مصفوفة التصعيد', 'بروتوكول الخروج/الانتقال', 'قالب تحليل السبب الجذري'], standard: 'CIPS SRM' },
      ],
      operational: [
        { name: 'Supplier Onboarding Process', nameAr: 'عملية إدماج المورّدين', desc: 'Structured onboarding covering prequalification, KYS (Know Your Supplier), compliance checks, system setup, and first-order quality review.', descAr: 'إدماج منظّم يغطّي التأهيل المسبق ومعرفة مورّدك وفحوصات الامتثال وإعداد النظام ومراجعة جودة أول طلب.', tools: ['Prequalification questionnaire', 'KYS compliance checklist', 'IBAN/banking setup process', 'First-article inspection protocol'], toolsAr: ['استبيان التأهيل المسبق', 'قائمة تدقيق امتثال معرفة المورّد', 'عملية إعداد IBAN/الحسابات المصرفية', 'بروتوكول فحص المادة الأولى'], standard: 'CIPS / ZATCA IBAN' },
        { name: 'Supplier Communication Calendar', nameAr: 'تقويم تواصل المورّدين', desc: 'Structured meeting cadence with each supplier tier: strategic (monthly exec review + quarterly JBP), preferred (quarterly scorecard review), transactional (annual only).', descAr: 'وتيرة اجتماعات منظّمة مع كل مستوى مورّدين: استراتيجي (مراجعة تنفيذية شهرية + جلسة تخطيط مشترك ربع سنوية)، مفضّل (مراجعة بطاقة ربع سنوية)، معاملاتي (سنوياً فقط).', tools: ['Meeting agenda templates', 'Supplier communication log', 'Action tracker', 'Relationship health survey'], toolsAr: ['قوالب جدول أعمال الاجتماع', 'سجلّ تواصل المورّدين', 'متتبّع الإجراءات', 'استبيان صحة العلاقة'], standard: 'ISO 44001 / CIPS' },
      ],
    },
    kpis: [
      { category: 'Performance', categoryAr: 'الأداء', metrics: [
        { name: 'Supplier OTIF (On-Time In-Full)', nameAr: 'OTIF المورّد (في الوقت وبالكامل)', target: '>94%', benchmark: '84%', unit: '%' },
        { name: 'Supplier Defect Rate (PPM)', nameAr: 'معدّل عيوب المورّد (PPM)', target: '<500 PPM', benchmark: '2,200 PPM', unit: 'PPM' },
        { name: 'Supplier NPS Score', nameAr: 'درجة NPS للمورّد', target: '>55', benchmark: '32', unit: 'NPS' },
      ]},
      { category: 'Risk & Concentration', categoryAr: 'المخاطر والتركّز', metrics: [
        { name: 'Single-Source Dependency Index', nameAr: 'مؤشر الاعتماد على مصدر وحيد', target: '<20% of critical spend', targetAr: 'أقل من 20% من الإنفاق الحرج', benchmark: '48%', unit: '%', unitAr: '%' },
        { name: 'Supplier Financial Health Score', nameAr: 'درجة الصحة المالية للمورّد', target: '>75/100', benchmark: '58/100', unit: '/100' },
        { name: 'ESG Audit Coverage', nameAr: 'تغطية تدقيق ESG', target: '100% of strategic suppliers', targetAr: '100% من المورّدين الاستراتيجيين', benchmark: '34%', unit: '%', unitAr: '%' },
      ]},
      { category: 'Relationship & Development', categoryAr: 'العلاقة والتطوير', metrics: [
        { name: 'Suppliers with Joint Business Plan', nameAr: 'المورّدون الذين لديهم خطة أعمال مشتركة', target: '100% of strategic tier', targetAr: '100% من المستوى الاستراتيجي', benchmark: '12%', unit: '%', unitAr: '%' },
        { name: 'Supplier Development Actions Completed', nameAr: 'إجراءات تطوير المورّدين المكتملة', target: '>80%', benchmark: '41%', unit: '%' },
        { name: 'On-Time Scorecard Review Rate', nameAr: 'معدّل مراجعة بطاقة التقييم في الوقت المحدد', target: '>95%', benchmark: '52%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Segment all active suppliers into Strategic/Preferred/Transactional', 'Issue Supplier Code of Conduct to 100% of strategic suppliers', 'Build 90-day scorecard for top 10 suppliers'], quickWinsAr: ['تقسيم جميع المورّدين النشطين إلى استراتيجي/مفضّل/معاملاتي', 'إصدار مدوّنة سلوك المورّدين لـ 100% من المورّدين الاستراتيجيين', 'بناء بطاقة تقييم 90 يوماً لأعلى 10 مورّدين'], projects: [{ title: 'Strategic Supplier SRM Programme', titleAr: 'برنامج SRM للمورّدين الاستراتيجيين', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'OTIF improvement from 81% to 94%', impactAr: 'تحسين OTIF من 81% إلى 94%' }, { title: 'Local Supplier Development (Iktva)', titleAr: 'تطوير المورّدين المحليين (Iktva)', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: 'Iktva score +15 points', impactAr: 'زيادة درجة Iktva بمقدار 15 نقطة' }] },
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['Map all sole-source critical components — dual-source programme', 'Run financial health check on top 20 suppliers', 'Conduct first supplier day (relationship investment)'], quickWinsAr: ['رسم خرائط جميع المكوّنات الحرجة أحادية المصدر — برنامج التوريد الثنائي', 'إجراء فحص صحة مالية لأعلى 20 مورّداً', 'تنظيم أول يوم للمورّدين (استثمار في العلاقة)'], projects: [{ title: 'Supplier Consolidation & Governance', titleAr: 'دمج المورّدين وحوكمتهم', duration: '14 weeks', durationAr: '14 أسبوعاً', impact: '40% supplier base reduction, 15% cost saving', impactAr: 'خفض قاعدة المورّدين 40%، وتوفير تكلفة 15%' }, { title: 'Supplier Scorecard Deployment', titleAr: 'نشر بطاقة تقييم المورّدين', duration: '6 weeks', durationAr: '6 أسابيع', impact: 'Defect rate reduced 60% within 6 months', impactAr: 'خفض معدّل العيوب 60% خلال 6 أشهر' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Prequalify all active vendors against GTPL criteria', 'Create a vendor panel for top 5 spend categories', 'Run annual performance review for all contracts >SAR 500K'], quickWinsAr: ['التأهيل المسبق لجميع الموردين النشطين وفق معايير GTPL', 'إنشاء لجنة موردين لأعلى 5 فئات إنفاق', 'إجراء مراجعة أداء سنوية لجميع العقود التي تتجاوز 500 ألف ريال'], projects: [{ title: 'Government Vendor Governance Framework', titleAr: 'إطار حوكمة الموردين الحكوميين', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Policy compliance rate from 58% to 95%', impactAr: 'معدّل امتثال السياسات من 58% إلى 95%' }, { title: 'Supplier ESG Audit Programme', titleAr: 'برنامج تدقيق ESG للمورّدين', duration: '10 weeks', durationAr: '10 أسابيع', impact: '100% ESG coverage for strategic tier', impactAr: 'تغطية ESG 100% للمستوى الاستراتيجي' }] },
    ],
    challenges: [
      { challenge: 'All suppliers treated the same — no differentiated governance or investment', challengeAr: 'معاملة جميع المورّدين على قدم المساواة — لا حوكمة متمايزة ولا استثمار مختلف', impact: 'Strategic suppliers under-invested; transactional over-governed; management time wasted', impactAr: 'المورّدون الاستراتيجيون يفتقرون إلى الاستثمار؛ والمعاملاتيون مُقيَّدون بحوكمة زائدة؛ وإهدار وقت الإدارة', solution: 'Deploy ISC Supplier Segmentation Model; design differentiated governance, SLA, and investment approach for each tier; redirect strategic management attention to strategic suppliers', solutionAr: 'نشر نموذج ISC لتقسيم المورّدين؛ وتصميم نهج حوكمة وSLA واستثمار متمايز لكل مستوى؛ وإعادة توجيه اهتمام الإدارة الاستراتيجية نحو المورّدين الاستراتيجيين', framework: 'CIPS SRM / Kraljic' },
      { challenge: 'Single-source critical suppliers with no alternative qualified', challengeAr: 'مورّدون حرجون أحاديو المصدر بلا بديل مؤهَّل', impact: 'Any disruption to that supplier stops operations — unacceptable for GCC production environments', impactAr: 'أي اضطراب لذلك المورّد يوقف العمليات — غير مقبول في بيئات الإنتاج الخليجية', solution: 'Map all sole-source criticalities; launch emergency dual-source qualification programme; build 90-day safety stock for highest-risk items during qualification period', solutionAr: 'رسم خريطة جميع الاعتماديات أحادية المصدر؛ وإطلاق برنامج تأهيل طارئ للمصدر الثنائي؛ وبناء مخزون أمان 90 يوماً للأصناف الأعلى خطورة خلال فترة التأهيل', framework: 'ISO 31000 / APICS SCOR' },
      { challenge: 'Supplier performance measured by delivery only — quality and compliance ignored', challengeAr: 'أداء المورّد يُقاس بالتسليم فقط — الجودة والامتثال مهملان', impact: 'ESG, quality, and financial risks accumulate undetected until a crisis forces them into view', impactAr: 'مخاطر ESG والجودة والمالية تتراكم دون رصد حتى تجبرها أزمة على الظهور', solution: 'Deploy weighted supplier scorecard covering Delivery, Quality, Cost Competitiveness, Compliance, ESG, and Relationship; review monthly with strategic suppliers and quarterly with preferred', solutionAr: 'نشر بطاقة تقييم مورّد موزونة تغطّي التسليم والجودة والتنافسية السعرية والامتثال وESG والعلاقة؛ مراجعتها شهرياً مع المورّدين الاستراتيجيين وربع سنوياً مع المفضّلين', framework: 'CIPS SRM / ISO 9001' },
      { challenge: 'GCC cultural context makes supplier conversations difficult to structure', challengeAr: 'السياق الثقافي الخليجي يجعل محادثات المورّدين صعبة التنظيم', impact: 'Performance issues raised informally and not resolved; relationships prioritised over accountability', impactAr: 'تُطرح مشكلات الأداء بصورة غير رسمية ولا تُحلّ؛ والعلاقات تُقدَّم على المساءلة', solution: 'Design a culturally calibrated SRM meeting structure: relationship-first agenda framing, data-led performance review, collaborative problem-solving, and clear escalation only as a last resort', solutionAr: 'تصميم هيكل اجتماع SRM مُعايَر ثقافياً: تأطير أجندة قائمة على العلاقة أولاً، ومراجعة أداء مدفوعة بالبيانات، وحل مشكلات تعاوني، وتصعيد واضح كملاذ أخير فقط', framework: 'CIPS / ISO 44001 Collaborative Relationships' },
    ],
    achievements: [
      { title: 'Supplier OTIF: 79% → 96% in 6 months', titleAr: 'OTIF المورّد: من 79% إلى 96% في 6 أشهر', client: 'Saudi manufacturing group', industry: 'Manufacturing', industryAr: 'التصنيع', result: 'Scorecard deployed; monthly review cadence established; 3 underperforming suppliers placed on PIP', resultAr: 'نشر بطاقة التقييم؛ وترسيخ وتيرة مراجعة شهرية؛ ووضع 3 مورّدين ضعيفي الأداء في خطة تحسين', timeframe: '6 months', timeframeAr: '6 أشهر' },
      { title: 'Iktva score +18 points through local supplier development', titleAr: 'زيادة درجة Iktva بمقدار 18 نقطة عبر تطوير المورّدين المحليين', client: 'GCC energy contractor', industry: 'Energy', industryAr: 'الطاقة', result: 'ISC deployed local supplier development programme; 12 new local vendors qualified; JBPs signed with 5 strategic partners', resultAr: 'نشرت ISC برنامج تطوير المورّدين المحليين؛ وتأهيل 12 مورّداً محلياً جديداً؛ وتوقيع خطط أعمال مشتركة مع 5 شركاء استراتيجيين', timeframe: '12 months', timeframeAr: '12 شهراً' },
      { title: 'SAR 8M savings from supplier consolidation & renegotiation', titleAr: 'توفير 8 ملايين ريال من دمج المورّدين وإعادة التفاوض', client: 'Jordanian government entity', industry: 'Government', industryAr: 'الحكومة', result: 'Supplier base reduced 45%; tier-based governance deployed; policy compliance reached 97%', resultAr: 'خفض قاعدة المورّدين 45%؛ ونشر حوكمة قائمة على المستويات؛ وبلوغ امتثال السياسات 97%', timeframe: '14 weeks', timeframeAr: '14 أسبوعاً' },
    ],
  },

  /* ─── RESILIENCY ─── */
  {
    slug: 'resiliency',
    title: 'Resiliency', titleAr: 'المرونة التشغيلية',
    tagline: 'Build supply chains that absorb disruption, recover fast, and emerge stronger — designed for the GCC\'s unique geopolitical and logistical realities.',
    taglineAr: 'ابنِ سلاسل إمداد تمتصّ الاضطرابات وتتعافى بسرعة وتخرج أقوى — مصمَّمة لخصوصية الواقع الجيوسياسي واللوجستي في الخليج.',
    description: 'The GCC operates in one of the world\'s most complex supply chain environments: Red Sea shipping disruptions, geopolitical volatility, single-corridor dependencies, and rapid regulatory change. ISC applies APICS SCOR Reliability principles, ISO 22301 Business Continuity, and GCC-specific scenario planning to build supply chains that are engineered for disruption — not destroyed by it.',
    descriptionAr: 'يعمل الخليج في واحدة من أكثر بيئات سلاسل الإمداد تعقيداً في العالم: اضطرابات الشحن في البحر الأحمر، والتقلّب الجيوسياسي، والاعتماد على ممرّ واحد، والتغيير التنظيمي السريع. تطبّق ISC مبادئ موثوقية APICS SCOR واستمرارية الأعمال وفق ISO 22301 والتخطيط للسيناريوهات الخاصة بالخليج لبناء سلاسل إمداد مصمَّمة للاضطراب — لا مُدمَّرة به.',
    icon: RefreshCw, color: 'text-emerald-600', bgGrad: 'from-emerald-700 to-emerald-900',
    frameworks: {
      strategic: [
        { name: 'APICS SCOR Reliability Framework', nameAr: 'إطار موثوقية APICS SCOR', desc: 'SCOR reliability metrics and process design to achieve consistent, accurate, and complete delivery performance under normal and stressed conditions.', descAr: 'مقاييس موثوقية SCOR وتصميم العمليات لتحقيق أداء تسليم متّسق ودقيق ومكتمل في الظروف العادية والمجهدة.', tools: ['SCOR reliability scorecard', 'Perfect Order Rate tracking', 'Demand variability analysis', 'Buffer strategy design'], toolsAr: ['بطاقة موثوقية SCOR', 'تتبّع معدّل الطلب المثالي', 'تحليل تقلّب الطلب', 'تصميم استراتيجية المخزن الاحتياطي'], standard: 'APICS SCOR 12.0' },
        { name: 'ISO 22301 Business Continuity', nameAr: 'استمرارية الأعمال وفق ISO 22301', desc: 'Business Impact Analysis, Recovery Time Objectives, and a documented BCP covering all critical supply chain processes — tested annually.', descAr: 'تحليل أثر الأعمال، وأهداف زمن التعافي، وخطة استمرارية أعمال موثّقة تغطّي جميع عمليات سلسلة الإمداد الحرجة — تُختبَر سنوياً.', tools: ['Business Impact Analysis (BIA)', 'BCP template', 'Recovery Time Objectives (RTO)', 'Annual BCP test protocol'], toolsAr: ['تحليل أثر الأعمال (BIA)', 'قالب خطة الاستمرارية', 'أهداف زمن التعافي (RTO)', 'بروتوكول اختبار الخطة السنوي'], standard: 'ISO 22301:2019' },
        { name: 'Supply Chain Stress Testing', nameAr: 'اختبار الإجهاد لسلسلة الإمداد', desc: 'Scenario-based stress tests simulating GCC-specific disruptions: port closures, single-supplier failure, regulatory shock, FX crisis, and natural disaster.', descAr: 'اختبارات إجهاد قائمة على سيناريوهات تحاكي اضطرابات خاصة بالخليج: إغلاق الموانئ، وفشل مورّد واحد، وصدمة تنظيمية، وأزمة عملات، وكارثة طبيعية.', tools: ['Scenario playbook (GCC)', 'Monte Carlo disruption model', 'Revenue-at-risk calculation', 'Recovery pathway mapping'], toolsAr: ['دليل السيناريوهات (الخليج)', 'نموذج اضطراب مونتي كارلو', 'حساب الإيراد المعرّض للخطر', 'رسم مسارات التعافي'], standard: 'APICS / ISO 31000' },
      ],
      tactical: [
        { name: 'Dual-Source & Multi-Modal Strategy', nameAr: 'استراتيجية التوريد الثنائي وتعدّد وسائل النقل', desc: 'Eliminating single points of failure across the supply base and logistics network — dual suppliers, multi-modal routing, and buffer stock by risk tier.', descAr: 'إزالة نقاط الفشل الفردية عبر قاعدة التوريد وشبكة الخدمات اللوجستية — مورّدون ثنائيون ومسارات نقل متعددة ومخزون احتياطي حسب مستوى المخاطر.', tools: ['Supply base mapping', 'Single-point-of-failure audit', 'Alternative routing register', 'Buffer stock calculator'], toolsAr: ['رسم خريطة قاعدة التوريد', 'تدقيق نقاط الفشل الفردية', 'سجلّ المسارات البديلة', 'حاسبة المخزون الاحتياطي'], standard: 'APICS SCOR / ISO 22301' },
        { name: 'Inventory Buffering (DDMRP)', nameAr: 'تخزين احتياطي للمخزون (DDMRP)', desc: 'Demand-Driven MRP methodology: position strategic decoupling points and buffer zones to absorb demand variability and supply disruptions.', descAr: 'منهجية تخطيط الموارد المدفوعة بالطلب: وضع نقاط فصل استراتيجية ومناطق مخزن احتياطي لامتصاص تقلّب الطلب واضطرابات التوريد.', tools: ['Decoupling point analysis', 'Buffer size calculator', 'Flow replenishment model', 'DDMRP KPIs'], toolsAr: ['تحليل نقاط الفصل', 'حاسبة حجم المخزن الاحتياطي', 'نموذج التجديد التدفّقي', 'مؤشرات أداء DDMRP'], standard: 'DDMRP / APICS' },
        { name: 'Geopolitical Risk Intelligence', nameAr: 'ذكاء المخاطر الجيوسياسية', desc: 'Continuous monitoring of GCC geopolitical risk signals: Red Sea freight rates, port congestion, trade policy changes, and regional instability indicators.', descAr: 'مراقبة مستمرة لإشارات المخاطر الجيوسياسية الخليجية: أسعار شحن البحر الأحمر وازدحام الموانئ وتغيّرات السياسة التجارية ومؤشرات عدم الاستقرار الإقليمي.', tools: ['Freight rate index dashboard', 'Port congestion alert feed', 'Trade policy change tracker', 'Geopolitical risk score'], toolsAr: ['لوحة مؤشر أسعار الشحن', 'تغذية تنبيهات ازدحام الموانئ', 'متتبّع تغيّرات السياسة التجارية', 'درجة المخاطر الجيوسياسية'], standard: 'ISO 31000 / APICS' },
      ],
      operational: [
        { name: 'BCP Activation Playbook', nameAr: 'دليل تفعيل خطة الاستمرارية', desc: 'Role-specific, step-by-step BCP activation guide for each disruption scenario — covering first 24h, 72h, and 7-day recovery milestones.', descAr: 'دليل تفعيل خطة الاستمرارية خطوة بخطوة حسب الدور لكل سيناريو اضطراب — يغطّي معالم التعافي خلال 24 ساعة و72 ساعة و7 أيام.', tools: ['Disruption response checklist', 'Communications tree', 'Alternative supplier activation protocol', 'Customer communication template'], toolsAr: ['قائمة تدقيق الاستجابة للاضطراب', 'شجرة الاتصالات', 'بروتوكول تفعيل المورّد البديل', 'قالب التواصل مع العملاء'], standard: 'ISO 22301 / APICS' },
        { name: 'Supply Chain Resilience KPIs', nameAr: 'مؤشرات أداء مرونة سلسلة الإمداد', desc: 'Operational dashboard tracking resilience metrics in real time: RTO attainment, disruption frequency, recovery velocity, and buffer stock health.', descAr: 'لوحة تشغيلية تتتبّع مقاييس المرونة في الوقت الفعلي: تحقّق هدف زمن التعافي وتكرار الاضطراب وسرعة التعافي وصحة المخزون الاحتياطي.', tools: ['Resilience KPI dashboard', 'Disruption log', 'MTTR tracking', 'Buffer stock health monitor'], toolsAr: ['لوحة مؤشرات أداء المرونة', 'سجلّ الاضطرابات', 'تتبّع متوسط زمن التعافي', 'مراقب صحة المخزون الاحتياطي'], standard: 'APICS SCOR / ISO 22301' },
      ],
    },
    kpis: [
      { category: 'Recovery & Continuity', categoryAr: 'التعافي والاستمرارية', metrics: [
        { name: 'Recovery Time Objective (RTO) Attainment', nameAr: 'تحقيق هدف زمن التعافي (RTO)', target: '>95%', benchmark: '52%', unit: '%' },
        { name: 'Mean Time to Recover (MTTR)', nameAr: 'متوسط زمن التعافي (MTTR)', target: '<72h', targetAr: 'أقل من 72 ساعة', benchmark: '6–8 days', benchmarkAr: '6–8 أيام', unit: 'hours', unitAr: 'ساعات' },
        { name: 'BCP Test Pass Rate', nameAr: 'معدّل نجاح اختبار خطة الاستمرارية', target: '100%', benchmark: '38%', unit: '%' },
      ]},
      { category: 'Supply Base Risk', categoryAr: 'مخاطر قاعدة التوريد', metrics: [
        { name: 'Dual-Source Coverage (critical items)', nameAr: 'تغطية المصدر الثنائي (أصناف حرجة)', target: '>90%', benchmark: '32%', unit: '%' },
        { name: 'Supply Chain Stress Score', nameAr: 'درجة إجهاد سلسلة الإمداد', target: '<30/100', benchmark: '61/100', unit: '/100' },
        { name: 'Buffer Stock Days of Supply', nameAr: 'أيام إمداد المخزون الاحتياطي', target: '>30 days for critical', targetAr: 'أكثر من 30 يوماً للأصناف الحرجة', benchmark: '12 days', benchmarkAr: '12 يوماً', unit: 'days', unitAr: 'أيام' },
      ]},
      { category: 'Performance Under Disruption', categoryAr: 'الأداء خلال الاضطراب', metrics: [
        { name: 'Service Level Maintained During Disruption', nameAr: 'مستوى الخدمة المحافظ عليه خلال الاضطراب', target: '>80%', benchmark: '45%', unit: '%' },
        { name: 'Revenue at Risk (supply disruption)', nameAr: 'الإيراد المعرّض للخطر (اضطراب التوريد)', target: '<3%', benchmark: '11%', unit: '% annual revenue', unitAr: '% إيراد سنوي' },
        { name: 'Disruption Event Frequency', nameAr: 'تكرار أحداث الاضطراب', target: 'Reduction of >40%', targetAr: 'خفض بأكثر من 40%', benchmark: 'Baseline year', benchmarkAr: 'سنة الأساس', unit: 'events/yr', unitAr: 'حدث/سنة' },
      ]},
    ],
    projects: [
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Map all sole-source critical MRO items — safety stock calculation', 'Pre-approve 2 alternative logistics corridors for sea cargo', 'Run first BCP desktop exercise with leadership team'], quickWinsAr: ['رسم خرائط جميع أصناف الصيانة والتشغيل الحرجة أحادية المصدر — حساب المخزون الأمني', 'الموافقة المسبقة على ممرَّي خدمات لوجستية بديلَين للشحن البحري', 'إجراء أول تمرين مكتبي لخطة الاستمرارية مع فريق القيادة'], projects: [{ title: 'Supply Chain BCP Build', titleAr: 'بناء خطة استمرارية سلسلة الإمداد', duration: '10 weeks', durationAr: '10 أسابيع', impact: 'RTO reduced from 8 days to 72h', impactAr: 'تقليص هدف زمن التعافي من 8 أيام إلى 72 ساعة' }, { title: 'Red Sea Disruption Contingency', titleAr: 'خطة طوارئ اضطراب البحر الأحمر', duration: '6 weeks', durationAr: '6 أسابيع', impact: 'Alternative routing activated within 48h of disruption', impactAr: 'تفعيل المسارات البديلة خلال 48 ساعة من الاضطراب' }] },
      { industry: 'Pharma', industryAr: 'الأدوية', quickWins: ['Classify all APIs and critical raw materials by disruption risk', 'Build emergency import clearance protocol with SFDA', 'Set up cold chain backup storage agreement with 3rd-party LSP'], quickWinsAr: ['تصنيف جميع المواد الفعّالة والمواد الخام الحرجة حسب خطر الاضطراب', 'بناء بروتوكول تخليص استيراد طارئ مع هيئة الغذاء والدواء', 'إبرام اتفاقية تخزين احتياطي لسلسلة التبريد مع مقدّم خدمات لوجستية طرف ثالث'], projects: [{ title: 'Pharma Supply Resilience Programme', titleAr: 'برنامج مرونة التوريد الدوائي', duration: '14 weeks', durationAr: '14 أسابيع', impact: 'Stockout risk reduced 65% for critical APIs', impactAr: 'خفض خطر نفاد المخزون 65% للمواد الفعّالة الحرجة' }, { title: 'GDP Cold Chain BCP', titleAr: 'خطة استمرارية سلسلة التبريد GDP', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'ISO 22301 certified BCP for cold chain', impactAr: 'خطة استمرارية معتمدة وفق ISO 22301 لسلسلة التبريد' }] },
      { industry: 'Retail & FMCG', industryAr: 'التجزئة والسلع الاستهلاكية', quickWins: ['Map top 20 SKUs by supply risk — safety stock review', 'Dual-source all promotional/seasonal key items', 'Build supplier alert protocol: define escalation thresholds'], quickWinsAr: ['رسم خريطة أعلى 20 صنفاً حسب خطر التوريد — مراجعة المخزون الأمني', 'التوريد الثنائي لجميع الأصناف الرئيسية الترويجية/الموسمية', 'بناء بروتوكول تنبيه المورّدين: تحديد عتبات التصعيد'], projects: [{ title: 'FMCG Supply Resilience Redesign', titleAr: 'إعادة تصميم مرونة تعرض السلع الاستهلاكية', duration: '12 weeks', durationAr: '12 أسابيع', impact: '18% reduction in out-of-stock events', impactAr: 'خفض أحداث نفاد المخزون 18%' }, { title: 'DDMRP Buffer Deployment', titleAr: 'نشر مخزن احتياطي DDMRP', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Inventory reduced 20%, service rate maintained', impactAr: 'خفض المخزون 20% مع الحفاظ على معدّل الخدمة' }] },
    ],
    challenges: [
      { challenge: 'No business continuity plan — first disruption is a crisis', challengeAr: 'لا توجد خطة استمرارية أعمال — أول اضطراب يتحوّل إلى أزمة', impact: 'Revenue loss, customer defection, and regulatory/contractual penalties during any significant disruption', impactAr: 'خسارة إيرادات وتحوّل العملاء وغرامات تنظيمية/تعاقدية خلال أي اضطراب كبير', solution: 'Conduct Business Impact Analysis; define RTOs for each critical process; build BCP covering alternative suppliers, logistics corridors, and communication protocols; test annually', solutionAr: 'إجراء تحليل أثر الأعمال؛ وتحديد أهداف زمن التعافي لكل عملية حرجة؛ وبناء خطة استمرارية تغطّي المورّدين البديلين وممرّات الخدمات اللوجستية وبروتوكولات الاتصال؛ واختبارها سنوياً', framework: 'ISO 22301 / APICS' },
      { challenge: 'Red Sea / GCC logistics disruption with no pre-approved alternatives', challengeAr: 'اضطراب في الخدمات اللوجستية بالبحر الأحمر/الخليج بلا بدائل معتمدة مسبقاً', impact: 'Lead time extensions of 18–25 days; freight cost spikes 200–400%; stockout cascade', impactAr: 'امتداد مهل التوريد 18–25 يوماً؛ وارتفاع تكاليف الشحن 200–400%؛ وتسلسل نفاد المخزون', solution: 'Pre-qualify and contract alternative routing (air, land bridge, Cape of Good Hope); build freight cost delta into scenario planning; activate graduated buffer stock protocol', solutionAr: 'التأهيل المسبق والتعاقد على مسارات بديلة (جوي، جسر بري، رأس الرجاء الصالح)؛ وإدراج الفارق في تكاليف الشحن في تخطيط السيناريوهات؛ وتفعيل بروتوكول المخزون الاحتياطي التدريجي', framework: 'ISO 22301 / APICS SCOR' },
      { challenge: 'Single-corridor logistics dependence — Jeddah Islamic Port or King Abdullah Port', challengeAr: 'اعتماد على ممرّ لوجستي واحد — ميناء جدة الإسلامي أو ميناء الملك عبدالله', impact: 'Any port congestion or closure stops all sea imports; no pre-approved alternatives exist', impactAr: 'أي ازدحام أو إغلاق في الميناء يوقف جميع الواردات البحرية؛ ولا توجد بدائل معتمدة مسبقاً', solution: 'Diversify port entry points; pre-qualify inland customs posts (Haradh, Al-Batha); assess air freight for high-value critical items; build port-specific contingency protocols', solutionAr: 'تنويع نقاط الدخول عبر الموانئ؛ والتأهيل المسبق لمنافذ الجمارك البرية (حرض، البطحاء)؛ وتقييم الشحن الجوي للأصناف عالية القيمة الحرجة؛ وبناء بروتوكولات طوارئ خاصة بكل ميناء', framework: 'APICS SCOR / ISO 31000' },
      { challenge: 'Resilience vs efficiency trade-off — leadership resists buffer stock investment', challengeAr: 'مقايضة المرونة مقابل الكفاءة — القيادة تقاوم الاستثمار في المخزون الاحتياطي', impact: 'Lean operations look efficient until disruption hits — then cost of recovery dwarfs inventory savings', impactAr: 'العمليات الرشيقة تبدو فعّالة حتى يضرب الاضطراب — فتتجاوز تكلفة التعافي وفورات المخزون بكثير', solution: 'Model Revenue-at-Risk per disruption scenario; quantify cost of disruption vs cost of buffer; present decision to leadership as risk-adjusted ROI investment', solutionAr: 'نمذجة الإيراد المعرّض للخطر لكل سيناريو اضطراب؛ وقياس تكلفة الاضطراب مقابل تكلفة المخزون الاحتياطي؛ وتقديم القرار للقيادة كاستثمار ذو عائد معدّل بالمخاطر', framework: 'ISO 31000 / Risk-Adjusted ROI' },
    ],
    achievements: [
      { title: 'RTO reduced: 8 days → 68 hours for critical operations', titleAr: 'تقليص هدف زمن التعافي: من 8 أيام إلى 68 ساعة للعمليات الحرجة', client: 'Saudi energy contractor', industry: 'Energy', industryAr: 'الطاقة', result: 'Full BCP built and tested; dual-source programme launched for 23 critical items; Red Sea contingency pre-approved', resultAr: 'بناء خطة استمرارية كاملة واختبارها؛ وإطلاق برنامج توريد ثنائي لـ 23 صنفاً حرجاً؛ ومصادقة مسبقة على خطة طوارئ البحر الأحمر', timeframe: '10 weeks', timeframeAr: '10 أسابيع' },
      { title: 'Stockout events reduced 65% — pharma critical APIs protected', titleAr: 'خفض أحداث نفاد المخزون 65% — حماية المواد الفعّالة الحرجة في الأدوية', client: 'KSA pharmaceutical company', industry: 'Pharma', industryAr: 'الأدوية', result: 'DDMRP buffer positions deployed; emergency supplier protocols activated; ISO 22301 BCP certified', resultAr: 'نشر مواضع مخزن احتياطي DDMRP؛ وتفعيل بروتوكولات المورّد الطارئ؛ والحصول على شهادة ISO 22301 لخطة الاستمرارية', timeframe: '14 weeks', timeframeAr: '14 أسبوعاً' },
      { title: 'Supply chain survived Red Sea crisis — 0 customer stockouts', titleAr: 'سلسلة الإمداد نجت من أزمة البحر الأحمر — صفر حالات نفاد مخزون للعملاء', client: 'GCC FMCG distributor', industry: 'Retail & FMCG', industryAr: 'التجزئة والسلع الاستهلاكية', result: 'Cape of Good Hope routing activated within 48h; buffer stock protocol prevented any customer impact', resultAr: 'تفعيل مسار رأس الرجاء الصالح خلال 48 ساعة؛ وبروتوكول المخزون الاحتياطي منع أي أثر على العملاء', timeframe: '2024 crisis event', timeframeAr: 'أزمة 2024' },
    ],
  },

  /* ─── VALUE ENGINEERING ─── */
  {
    slug: 'value-engineering',
    title: 'Value Engineering', titleAr: 'هندسة القيمة',
    tagline: 'Systematic function analysis that eliminates non-value-added cost without compromising quality, performance, or compliance — critical for GCC capital projects.',
    taglineAr: 'تحليل منهجي للوظائف يلغي التكاليف غير المضيفة للقيمة دون المساس بالجودة أو الأداء أو الامتثال — ضرورة حتمية لمشاريع رأس المال في الخليج.',
    description: 'Value Engineering is a structured, team-based methodology to achieve required functions at the lowest possible total cost. In the GCC context — where capital projects routinely overrun by 20–40%, government procurement demands cost justification, and ARAMCO/SABIC supply chains are scrutinised for efficiency — VE delivers both cost reduction and quality assurance. ISC applies SAVE International VE standards with deep GCC market pricing knowledge.',
    descriptionAr: 'هندسة القيمة منهجية منظّمة تعتمد على الفريق لتحقيق الوظائف المطلوبة بأقل إجمالي تكلفة ممكن. في السياق الخليجي — حيث تتجاوز المشاريع الرأسمالية ميزانياتها بشكل روتيني بنسبة 20–40%، وتتطلّب المشتريات الحكومية تبرير التكاليف، وتخضع سلاسل إمداد أرامكو وسابك لتدقيق الكفاءة — تحقّق هندسة القيمة كلاً من خفض التكاليف وضمان الجودة. تطبّق ISC معايير هندسة القيمة من SAVE International مع معرفة عميقة بأسعار السوق الخليجي.',
    icon: Layers, color: 'text-orange-600', bgGrad: 'from-orange-600 to-orange-900',
    frameworks: {
      strategic: [
        { name: 'SAVE International VE Methodology', nameAr: 'منهجية SAVE International لهندسة القيمة', desc: '5-phase VE Job Plan: Information → Function Analysis → Creative → Evaluation → Implementation. Delivers functions at optimum life-cycle cost.', descAr: 'خطة عمل VE من 5 مراحل: المعلومات ← تحليل الوظائف ← الإبداع ← التقييم ← التنفيذ. تحقّق الوظائف بأمثل تكلفة دورة حياة.', tools: ['Function Analysis System Technique (FAST)', 'Value Index calculation', 'Life-cycle cost model', 'VE workshop facilitation'], toolsAr: ['تقنية FAST لتحليل الوظائف', 'حساب مؤشر القيمة', 'نموذج تكلفة دورة الحياة', 'تيسير ورشة هندسة القيمة'], standard: 'SAVE International / BS EN 12973' },
        { name: 'Total Cost of Ownership (TCO) Analysis', nameAr: 'تحليل التكلفة الإجمالية للملكية (TCO)', desc: 'Full lifecycle cost model: acquisition, installation, operation, maintenance, disposal — ensuring VE decisions optimise total cost not just purchase price.', descAr: 'نموذج تكلفة دورة حياة كاملة: الاقتناء والتركيب والتشغيل والصيانة والتخلّص — لضمان أن قرارات هندسة القيمة تُحسّن إجمالي التكلفة لا مجرد سعر الشراء.', tools: ['TCO model template', 'Should-cost analysis', 'Lifecycle cost comparison', 'NPV analysis tool'], toolsAr: ['قالب نموذج TCO', 'تحليل التكلفة المتوقّعة', 'مقارنة تكلفة دورة الحياة', 'أداة تحليل القيمة الحالية الصافية'], standard: 'SAVE / ISO 15686' },
        { name: 'Should-Cost Modelling', nameAr: 'نمذجة التكلفة المتوقّعة', desc: 'Bottom-up cost build from raw materials, labour, overhead, and margin — establishing what a product or service should cost independent of supplier price.', descAr: 'بناء تكلفة من الأسفل إلى الأعلى بدءاً من المواد الخام والعمالة والنفقات العامة والهامش — لتأسيس ما يجب أن تكلّفه المنتج أو الخدمة بمعزل عن سعر المورّد.', tools: ['Should-cost model', 'Cost driver analysis', 'Benchmark price database (GCC)', 'Negotiation target setting'], toolsAr: ['نموذج التكلفة المتوقّعة', 'تحليل محرّكات التكلفة', 'قاعدة بيانات أسعار مرجعية (الخليج)', 'تحديد أهداف التفاوض'], standard: 'CIPS / APQC' },
      ],
      tactical: [
        { name: 'Function Analysis System Technique (FAST)', nameAr: 'تقنية FAST لتحليل نظام الوظائف', desc: 'FAST diagram maps all functions of a product/service from basic to secondary, identifying which functions are worth their cost.', descAr: 'مخطّط FAST يرسم جميع وظائف منتج/خدمة من الأساسية إلى الثانوية، ويحدّد الوظائف التي تستحق تكلفتها.', tools: ['FAST diagram workshop', 'Function cost assignment', 'Value Index per function', 'Non-value-add elimination list'], toolsAr: ['ورشة مخطّط FAST', 'إسناد تكلفة الوظيفة', 'مؤشر القيمة لكل وظيفة', 'قائمة إزالة ما لا يضيف قيمة'], standard: 'SAVE International' },
        { name: 'Design-to-Cost (DTC)', nameAr: 'التصميم وفق التكلفة المستهدفة', desc: 'Cost targets set before design begins — engineers design to meet function and cost targets simultaneously rather than designing then costing.', descAr: 'تُحدَّد أهداف التكلفة قبل البدء بالتصميم — يصمّم المهندسون لتحقيق أهداف الوظيفة والتكلفة في آنٍ واحد بدلاً من التصميم ثم تكليفه.', tools: ['Target costing framework', 'DTC workshop', 'Value engineering index', 'Design variance tracking'], toolsAr: ['إطار التكلفة المستهدفة', 'ورشة التصميم وفق التكلفة', 'مؤشر هندسة القيمة', 'تتبّع انحراف التصميم'], standard: 'Toyota Production System / SAE' },
        { name: 'Value vs Cost Mapping', nameAr: 'رسم خريطة القيمة مقابل التكلفة', desc: 'Plotting all spend items on a value-vs-cost matrix to identify where the organisation is over-specifying (over-cost) or under-specifying (quality risk).', descAr: 'رسم جميع بنود الإنفاق على مصفوفة القيمة مقابل التكلفة لتحديد ما تزيد فيه المواصفات (تكلفة زائدة) أو تقصر (مخاطر جودة).', tools: ['Value-cost matrix', 'Specification audit', 'Over-engineering checklist', 'Scope reduction register'], toolsAr: ['مصفوفة القيمة والتكلفة', 'تدقيق المواصفات', 'قائمة تدقيق التصميم المبالغ فيه', 'سجلّ تقليص النطاق'], standard: 'SAVE / CIPS' },
      ],
      operational: [
        { name: 'VE Idea Generation & Evaluation', nameAr: 'توليد أفكار هندسة القيمة وتقييمها', desc: 'Structured creative phase generating alternative solutions to required functions; evaluation by weighted criteria (cost, quality, risk, timeline).', descAr: 'مرحلة إبداعية منظّمة لتوليد حلول بديلة للوظائف المطلوبة؛ وتقييمها بمعايير موزونة (التكلفة والجودة والمخاطر والجدول الزمني).', tools: ['Brainstorming template', 'Evaluation matrix', 'Risk-adjusted value scoring', 'Implementation feasibility filter'], toolsAr: ['قالب العصف الذهني', 'مصفوفة التقييم', 'تسجيل القيمة المعدّلة بالمخاطر', 'مصفوفة تصفية جدوى التنفيذ'], standard: 'SAVE International' },
        { name: 'VE Implementation Tracking', nameAr: 'تتبّع تنفيذ هندسة القيمة', desc: 'Tracking approved VE ideas through to implementation — owner, timeline, savings realisation, and quality verification.', descAr: 'تتبّع أفكار هندسة القيمة المعتمدة حتى التنفيذ — المالك والجدول الزمني وتحقّق الوفورات والتحقّق من الجودة.', tools: ['VE tracker', 'Savings realisation report', 'Quality sign-off protocol', 'Lessons learned register'], toolsAr: ['متتبّع هندسة القيمة', 'تقرير تحقّق الوفورات', 'بروتوكول اعتماد الجودة', 'سجلّ الدروس المستفادة'], standard: 'SAVE / PMI' },
      ],
    },
    kpis: [
      { category: 'Cost Reduction', categoryAr: 'خفض التكلفة', metrics: [
        { name: 'VE Savings as % of Spend', nameAr: 'وفورات هندسة القيمة كنسبة من الإنفاق', target: '8–15%', benchmark: '3.2%', unit: '%' },
        { name: 'Cost Avoidance (Design-to-Cost)', nameAr: 'تجنّب التكلفة (التصميم وفق التكلفة المستهدفة)', target: '>10%', benchmark: '4.1%', unit: '% of project budget', unitAr: '% من ميزانية المشروع' },
        { name: 'Should-Cost Variance', nameAr: 'انحراف التكلفة المتوقّعة', target: '<5%', benchmark: '18%', unit: '%' },
      ]},
      { category: 'Process Efficiency', categoryAr: 'كفاءة العملية', metrics: [
        { name: 'VE Ideas Generated per Workshop', nameAr: 'أفكار هندسة القيمة المولَّدة لكل ورشة', target: '>40', benchmark: '12', unit: 'ideas' },
        { name: 'Idea-to-Implementation Rate', nameAr: 'معدّل الأفكار المطبَّقة', target: '>60%', benchmark: '28%', unit: '%' },
        { name: 'Time from Idea to Savings Realisation', nameAr: 'الوقت من الفكرة إلى تحقّق الوفورات', target: '<90 days', targetAr: 'أقل من 90 يوماً', benchmark: '210 days', benchmarkAr: '210 أيام', unit: 'days', unitAr: 'أيام' },
      ]},
      { category: 'Quality Assurance', categoryAr: 'ضمان الجودة', metrics: [
        { name: 'Quality Non-Conformances Post-VE', nameAr: 'عدم المطابقات الجودية بعد هندسة القيمة', target: '0', benchmark: '4–8%', unit: 'incidents', unitAr: 'حادثة' },
        { name: 'Specification Compliance Rate', nameAr: 'معدّل الامتثال للمواصفات', target: '>98%', benchmark: '88%', unit: '%' },
        { name: 'Stakeholder Satisfaction (VE outcome)', nameAr: 'رضا أصحاب المصلحة (نتائج هندسة القيمة)', target: '>4.2/5', benchmark: '3.4/5', unit: '/5' },
      ]},
    ],
    projects: [
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Run FAST analysis on top 3 highest-cost procurement categories', 'Apply should-cost model to annual turnaround MRO spend', 'Identify over-specified materials vs ARAMCO/SABIC actual requirements'], quickWinsAr: ['إجراء تحليل FAST لأعلى 3 فئات مشتريات من حيث التكلفة', 'تطبيق نموذج التكلفة المتوقّعة على إنفاق الصيانة والتشغيل السنوي', 'تحديد المواد المبالغ في تحديد مواصفاتها مقابل متطلبات أرامكو/سابك الفعلية'], projects: [{ title: 'EPC Value Engineering Programme', titleAr: 'برنامج هندسة القيمة لمشاريع EPC', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '14% project cost reduction', impactAr: 'خفض تكلفة المشروع 14%' }, { title: 'MRO Should-Cost Analysis', titleAr: 'تحليل التكلفة المتوقّعة لمواد الصيانة والتشغيل', duration: '6 weeks', durationAr: '6 أسابيع', impact: 'SAR 6M+ cost avoidance', impactAr: 'تجنّب تكاليف يتجاوز مبلغها 6 ملايين ريال' }] },
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Map all capital project specifications — flag over-engineering vs GTPL requirements', 'Apply TCO model to top 10 infrastructure categories', 'Train procurement team in FAST diagram technique'], quickWinsAr: ['رسم خرائط جميع مواصفات المشاريع الرأسمالية — تمييز المبالغة في التصميم مقابل متطلبات GTPL', 'تطبيق نموذج TCO على أعلى 10 فئات بنية تحتية', 'تدريب فريق المشتريات على تقنية مخطّط FAST'], projects: [{ title: 'Government Capital VE Audit', titleAr: 'تدقيق هندسة القيمة للمشاريع الحكومية الرأسمالية', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'SAR 25M+ addressable savings identified', impactAr: 'تحديد وفورات ممكنة تتجاوز 25 مليون ريال' }, { title: 'DTC Implementation in Tender Specs', titleAr: 'تطبيق التصميم وفق التكلفة في مواصفات المناقصات', duration: '10 weeks', durationAr: '10 أسابيع', impact: '20% reduction in tender specification cost', impactAr: 'خفض تكلفة مواصفات المناقصات 20%' }] },
      { industry: 'Construction', industryAr: 'الإنشاءات', quickWins: ['FAST analysis on top 5 cost drivers in current build specification', 'Material value audit: steel, concrete, MEP vs alternatives', 'Build a VE clause into all sub-contracts >SAR 1M'], quickWinsAr: ['تحليل FAST لأعلى 5 محرّكات تكلفة في مواصفات البناء الحالية', 'تدقيق قيمة المواد: الصلب والخرسانة والكهرومغناطيسية والسباكة مقابل البدائل', 'إدراج بند هندسة القيمة في جميع عقود الباطن التي تتجاوز مليون ريال'], projects: [{ title: 'Structural VE Workshop — SAR 200M project', titleAr: 'ورشة هندسة القيمة الإنشائية — مشروع بقيمة 200 مليون ريال', duration: '3 weeks', durationAr: '3 أسابيع', impact: '11% construction cost reduction, no scope change', impactAr: 'خفض تكلفة البناء 11% بلا تغيير في النطاق' }, { title: 'MEP Value Optimisation', titleAr: 'تحسين قيمة الكهروميكانيكا', duration: '4 weeks', durationAr: '4 أسابيع', impact: 'SAR 3.5M MEP savings with equivalent performance', impactAr: 'توفير 3.5 مليون ريال في الكهروميكانيكا بأداء مماثل' }] },
    ],
    challenges: [
      { challenge: 'VE confused with cost cutting — stakeholders resist', challengeAr: 'هندسة القيمة مُلتبِسة بتخفيض التكاليف — أصحاب المصلحة يقاومون', impact: 'VE initiatives stall at approval stage; quality concerns override cost improvement', impactAr: 'مبادرات هندسة القيمة تتوقّف عند مرحلة الاعتماد؛ ومخاوف الجودة تطغى على تحسين التكلفة', solution: 'Position VE as function-first: start every VE exercise with a function analysis that proves required functions are preserved; present VE savings alongside quality verification evidence', solutionAr: 'تموضع هندسة القيمة بوصفها وظيفة أولاً: بدء كل تمرين بتحليل وظائف يُثبت الحفاظ على الوظائف المطلوبة؛ وتقديم وفورات هندسة القيمة مقرونة بأدلة التحقّق من الجودة', framework: 'SAVE International VE' },
      { challenge: 'No should-cost data — suppliers control price information', challengeAr: 'لا توجد بيانات التكلفة المتوقّعة — المورّدون يتحكّمون في معلومات الأسعار', impact: 'Negotiations conducted from a position of ignorance; GCC suppliers exploit information asymmetry', impactAr: 'التفاوضات تجري من موقع جهل؛ والمورّدون الخليجيون يستغلّون عدم التماثل المعلوماتي', solution: 'Build bottom-up should-cost models for top 10 spend categories using raw material prices, GCC labour rates, and published overhead benchmarks; use as negotiation anchor', solutionAr: 'بناء نماذج تكلفة متوقّعة من الأسفل إلى الأعلى لأعلى 10 فئات إنفاق باستخدام أسعار المواد الخام ومعدلات العمالة الخليجية والمعايير المرجعية المنشورة للنفقات العامة؛ واستخدامها كمرساة تفاوضية', framework: 'CIPS / APQC Should-Cost' },
      { challenge: 'Over-specified materials in GCC capital projects — "gold-plating"', challengeAr: 'مواصفات مبالغ فيها في المشاريع الرأسمالية الخليجية — "تذهيب المواصفات"', impact: '15–25% cost premium on materials that exceed actual performance requirements', impactAr: 'علاوة تكلفة 15–25% على مواد تتجاوز متطلبات الأداء الفعلية', solution: 'Conduct specification audit against actual functional requirements; eliminate over-specification; align materials to minimum qualifying standard without compromising safety or compliance', solutionAr: 'إجراء تدقيق مواصفات مقابل متطلبات الوظيفة الفعلية؛ وإزالة المبالغة في التحديد؛ ومواءمة المواد مع الحدّ الأدنى من المعايير المؤهِّلة دون المساس بالسلامة أو الامتثال', framework: 'SAVE International / BS EN 12973' },
    ],
    achievements: [
      { title: '14% cost reduction on SAR 180M EPC project', titleAr: 'خفض تكلفة 14% على مشروع EPC بقيمة 180 مليون ريال', client: 'Saudi energy EPC contractor', industry: 'Energy', industryAr: 'الطاقة', result: 'FAST workshops on 8 cost drivers; 23 VE ideas implemented; full quality compliance maintained', resultAr: 'ورش FAST على 8 محرّكات تكلفة؛ وتطبيق 23 فكرة من هندسة القيمة؛ والحفاظ على الامتثال الكامل للجودة', timeframe: '12 weeks', timeframeAr: '12 أسبوعاً' },
      { title: 'SAR 25M+ government capital savings — no scope reduction', titleAr: 'توفير أكثر من 25 مليون ريال في المشاريع الحكومية الرأسمالية — بلا تقليص في النطاق', client: 'Saudi government ministry', industry: 'Government', industryAr: 'الحكومة', result: 'VE audit on tender specifications; 40 items over-specified; savings realised while GTPL compliance maintained', resultAr: 'تدقيق هندسة القيمة على مواصفات المناقصات؛ و40 بنداً مبالغاً في تحديده؛ وتحقيق الوفورات مع الحفاظ على الامتثال لـ GTPL', timeframe: '8 weeks', timeframeAr: '8 أسابيع' },
      { title: 'SAR 3.5M MEP savings — equivalent performance guaranteed', titleAr: 'توفير 3.5 مليون ريال في الكهروميكانيكا — مع ضمان الأداء المماثل', client: 'GCC construction developer', industry: 'Construction', industryAr: 'الإنشاءات', result: 'Should-cost analysis revealed 18% MEP over-specification; alternative systems adopted with written engineer approval', resultAr: 'كشف تحليل التكلفة المتوقّعة عن مبالغة 18% في مواصفات الكهروميكانيكا؛ واعتماد أنظمة بديلة بموافقة مهندس مكتوبة', timeframe: '4 weeks', timeframeAr: '4 أسابيع' },
    ],
  },

  /* ─── PROCESS IMPROVEMENT & POLICY ─── */
  {
    slug: 'process-improvement-policy',
    title: 'Process Improvement & Policy', titleAr: 'تحسين العمليات والسياسات',
    tagline: 'Lean, Six Sigma, and structured policy design that eliminates waste, standardises operations, and ensures compliance with Saudi and GCC regulatory requirements.',
    taglineAr: 'تحسين مستمر ومنهجي للعمليات وتصميم سياسات منظّم يلغي الهدر ويوحّد العمليات ويضمن الامتثال للمتطلبات التنظيمية السعودية والخليجية.',
    description: 'Process inefficiency costs GCC organisations an estimated 20–30% of operational capacity — through rework, manual workarounds, excessive approvals, and undocumented variation. ISC applies Lean Six Sigma (DMAIC), value stream mapping, and structured policy development to redesign processes from the ground up, deploying SOPs that stick and policies that protect the organisation from compliance risk.',
    descriptionAr: 'تُكلّف غير الكفاءة العملياتية المنشآت الخليجية ما يُقدَّر بـ 20–30% من الطاقة التشغيلية — عبر إعادة العمل والحلول البديلة اليدوية واعتمادات مفرطة وتباين غير موثّق. تطبّق ISC Lean Six Sigma (DMAIC) ورسم خرائط تدفّق القيمة وتطوير السياسات المنظّم لإعادة تصميم العمليات من الأساس، مع نشر إجراءات تشغيل معيارية راسخة وسياسات تحمي المنشأة من مخاطر الامتثال.',
    icon: GitBranch, color: 'text-indigo-600', bgGrad: 'from-indigo-700 to-indigo-900',
    frameworks: {
      strategic: [
        { name: 'DMAIC Process Improvement', nameAr: 'منهجية DMAIC لتحسين العمليات', desc: 'Six Sigma Define-Measure-Analyse-Improve-Control cycle to systematically eliminate defects and reduce variation in supply chain and procurement processes.', descAr: 'دورة Six Sigma للتعريف-القياس-التحليل-التحسين-التحكّم لإزالة العيوب بصورة منهجية وتقليص التباين في عمليات سلسلة الإمداد والمشتريات.', tools: ['Process capability analysis', 'Root cause analysis (fishbone)', 'Control charts (SPC)', 'SIPOC diagram'], toolsAr: ['تحليل قدرة العملية', 'تحليل السبب الجذري (عظمة السمكة)', 'مخططات التحكّم (SPC)', 'مخطّط SIPOC'], standard: 'ASQ Six Sigma / IASSC' },
        { name: 'Lean Value Stream Mapping', nameAr: 'رسم خريطة تدفّق القيمة (VSM)', desc: 'Visualise the entire value stream from supplier to customer, identifying waste (muda), bottlenecks, and non-value-added steps for elimination.', descAr: 'تصوير تدفّق القيمة بأكمله من المورّد إلى العميل، وتحديد الهدر (مودا) والاختناقات والخطوات غير المضيفة للقيمة للإزالة.', tools: ['Current-state VSM', 'Future-state VSM', '7 wastes audit (TIMWOOD)', 'Flow efficiency calculation'], toolsAr: ['خريطة الوضع الحالي', 'خريطة الوضع المستقبلي', 'تدقيق الهدر السبعة (TIMWOOD)', 'حساب كفاءة التدفّق'], standard: 'Toyota Production System / Lean Enterprise Institute' },
        { name: 'Procurement Policy Architecture', nameAr: 'هيكل سياسات المشتريات', desc: '4-tier policy hierarchy: Board Policy → Procurement Manual → Category Policies → SOPs. Aligned to GTPL, CIPS standards, and organisational risk appetite.', descAr: 'تسلسل هرمي للسياسات من 4 مستويات: سياسة المجلس ← الدليل التشغيلي للمشتريات ← سياسات الفئات ← الإجراءات المعيارية. متوائم مع GTPL ومعايير CIPS وقابلية تحمّل المخاطر المؤسسية.', tools: ['Policy hierarchy map', 'Gap analysis vs GTPL', 'CIPS standards alignment', 'Board policy template'], toolsAr: ['خريطة التسلسل الهرمي للسياسات', 'تحليل الفجوات مقابل GTPL', 'مواءمة معايير CIPS', 'قالب سياسة المجلس'], standard: 'CIPS / GTPL / ISO 9001' },
      ],
      tactical: [
        { name: 'SOP Authoring Framework', nameAr: 'إطار كتابة الإجراءات المعيارية', desc: 'Structured SOP writing methodology — plain language, visual process maps, role-based instructions, and version control — for all key supply chain and procurement activities.', descAr: 'منهجية كتابة إجراءات معيارية منظّمة — لغة واضحة وخرائط عمليات بصرية وتعليمات قائمة على الأدوار والتحكّم في الإصدارات — لجميع أنشطة سلسلة الإمداد والمشتريات الرئيسية.', tools: ['SOP template', 'Process map (swim lane)', 'Approval workflow diagram', 'SOP compliance checklist'], toolsAr: ['قالب الإجراءات المعيارية', 'مخطّط العملية (حارة السباحة)', 'مخطّط سير عمل الاعتماد', 'قائمة تدقيق امتثال الإجراءات المعيارية'], standard: 'ISO 9001 / CIPS' },
        { name: 'Kaizen & Continuous Improvement', nameAr: 'كايزن والتحسين المستمر', desc: 'Structured kaizen events (rapid improvement workshops) targeting specific process bottlenecks — typically 3–5 day events producing immediate measurable gains.', descAr: 'أحداث كايزن منظّمة (ورش تحسين سريع) تستهدف اختناقات عملية محدّدة — عادةً أحداث 3–5 أيام تنتج مكاسب فورية قابلة للقياس.', tools: ['Kaizen event facilitation', 'A3 problem-solving', '5-Why analysis', 'Improvement tracking board'], toolsAr: ['تيسير حدث كايزن', 'حلّ المشكلات بالنموذج A3', 'تحليل 5 لماذا', 'لوحة تتبّع التحسين'], standard: 'Toyota / JIPM' },
        { name: '5S Workplace Organisation', nameAr: 'منهجية 5S لتنظيم مكان العمل', desc: 'Sort-Set-Shine-Standardise-Sustain: eliminating waste at the operational level across warehouses, procurement offices, and supply chain operations.', descAr: 'فرز-ترتيب-تلميع-توحيد-استدامة: إزالة الهدر على المستوى التشغيلي عبر المستودعات ومكاتب المشتريات وعمليات سلسلة الإمداد.', tools: ['5S audit checklist', 'Before/after documentation', 'Visual management tools', 'Sustain audit schedule'], toolsAr: ['قائمة تدقيق 5S', 'توثيق قبل/بعد', 'أدوات الإدارة البصرية', 'جدول تدقيق الاستدامة'], standard: 'Toyota Production System' },
      ],
      operational: [
        { name: 'Process Cycle Efficiency Measurement', nameAr: 'قياس كفاءة دورة العملية', desc: 'Quantifying the ratio of value-added time to total lead time in every supply chain and procurement process — target >25% for complex processes.', descAr: 'قياس نسبة الوقت المضيف للقيمة إلى إجمالي مهلة التسليم في كل عملية لسلسلة الإمداد والمشتريات — المستهدف أكثر من 25% للعمليات المعقّدة.', tools: ['Process timeline mapping', 'Value-added time analysis', 'Cycle time measurement', 'Bottleneck identification'], toolsAr: ['رسم خريطة الجدول الزمني للعملية', 'تحليل الوقت المضيف للقيمة', 'قياس زمن الدورة', 'تحديد الاختناق'], standard: 'Lean / APICS' },
        { name: 'Audit & Compliance Monitoring', nameAr: 'التدقيق ومراقبة الامتثال', desc: 'Regular internal audit programme to verify SOP adherence, policy compliance, and regulatory alignment — with structured finding management and root cause remediation.', descAr: 'برنامج تدقيق داخلي منتظم للتحقّق من الالتزام بالإجراءات المعيارية وامتثال السياسات والمواءمة التنظيمية — مع إدارة منظّمة للملاحظات ومعالجة السبب الجذري.', tools: ['Audit programme', 'Finding register', 'CAPA tracker', 'Root cause elimination framework'], toolsAr: ['برنامج التدقيق', 'سجلّ الملاحظات', 'متتبّع الإجراءات التصحيحية والوقائية', 'إطار إزالة السبب الجذري'], standard: 'ISO 9001 / CIPS / GTPL' },
      ],
    },
    kpis: [
      { category: 'Process Efficiency', categoryAr: 'كفاءة العملية', metrics: [
        { name: 'Process Cycle Efficiency', nameAr: 'كفاءة دورة العملية', target: '>25%', benchmark: '8%', unit: '%' },
        { name: 'Process Lead Time Reduction', nameAr: 'خفض مهلة العملية', target: '>40%', benchmark: 'Baseline', unit: '%', unitAr: '%' },
        { name: 'Rework Rate', nameAr: 'معدّل إعادة العمل', target: '<2%', benchmark: '12%', unit: '%' },
      ]},
      { category: 'Quality & Defects', categoryAr: 'الجودة والعيوب', metrics: [
        { name: 'Defect Rate (Sigma level)', nameAr: 'معدّل العيوب (مستوى سيجما)', target: '>4.0σ', benchmark: '2.8σ', unit: 'σ' },
        { name: 'Process Capability (Cpk)', nameAr: 'قدرة العملية (Cpk)', target: '>1.33', benchmark: '0.87', unit: 'Cpk' },
        { name: 'First-Time-Right Rate', nameAr: 'معدّل الصحة من أول مرة', target: '>92%', benchmark: '74%', unit: '%' },
      ]},
      { category: 'Policy & Compliance', categoryAr: 'السياسات والامتثال', metrics: [
        { name: 'Policy Compliance Rate', nameAr: 'معدّل امتثال السياسات', target: '>95%', benchmark: '68%', unit: '%' },
        { name: 'Audit Finding Closure Time', nameAr: 'زمن إغلاق ملاحظات التدقيق', target: '<30 days', targetAr: 'أقل من 30 يوماً', benchmark: '95 days', benchmarkAr: '95 يوماً', unit: 'days', unitAr: 'أيام' },
        { name: 'Repeat Finding Rate', nameAr: 'معدّل تكرار الملاحظات', target: '<5%', benchmark: '31%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Map the end-to-end PO process — identify approval bottlenecks', 'Run 5-Why analysis on top 3 compliance audit findings', 'Draft Procurement Policy aligned to GTPL (board-ready)'], quickWinsAr: ['رسم خريطة عملية أمر الشراء من طرف إلى طرف — تحديد اختناقات الاعتماد', 'إجراء تحليل 5 لماذا على أعلى 3 ملاحظات تدقيق امتثال', 'صياغة سياسة مشتريات متوائمة مع GTPL (جاهزة للمجلس)'], projects: [{ title: 'Government Procurement Process Redesign', titleAr: 'إعادة تصميم عمليات المشتريات الحكومية', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: '55% PO cycle time reduction', impactAr: 'خفض زمن دورة أمر الشراء 55%' }, { title: 'GTPL-Aligned Policy Suite', titleAr: 'حزمة سياسات متوائمة مع GTPL', duration: '8 weeks', durationAr: '8 أسابيع', impact: 'Policy compliance from 62% to 97%', impactAr: 'امتثال السياسات من 62% إلى 97%' }] },
      { industry: 'Manufacturing', industryAr: 'التصنيع', quickWins: ['Value stream map the procurement and goods-receipt process', 'Run 5S in warehouse — document baseline and targets', 'Identify top 5 defect types — launch DMAIC project'], quickWinsAr: ['رسم خريطة تدفّق القيمة لعملية المشتريات واستلام البضائع', 'تطبيق 5S في المستودع — توثيق الخط الأساسي والأهداف', 'تحديد أعلى 5 أنواع عيوب — إطلاق مشروع DMAIC'], projects: [{ title: 'Lean Procurement Transformation', titleAr: 'تحوّل المشتريات الرشيقة', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: '40% process lead time reduction', impactAr: 'خفض مهلة العملية 40%' }, { title: 'Quality System ISO 9001 Alignment', titleAr: 'مواءمة نظام الجودة مع ISO 9001', duration: '12 weeks', durationAr: '12 أسبوعاً', impact: 'Audit pass rate from 58% to 94%', impactAr: 'معدّل نجاح التدقيق من 58% إلى 94%' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Run VSM on turnaround procurement process — flag NVA steps', 'Document top 10 procurement SOPs not yet in writing', 'Compliance gap analysis vs ARAMCO procurement standards'], quickWinsAr: ['إجراء رسم خريطة VSM على عملية مشتريات الإيقاف الدوري — تمييز الخطوات غير المضيفة للقيمة', 'توثيق أعلى 10 إجراءات مشتريات لم تُوثَّق بعد', 'تحليل فجوات الامتثال مقابل معايير مشتريات أرامكو'], projects: [{ title: 'Turnaround Procurement Process Lean', titleAr: 'تحسين عملية مشتريات الإيقاف الدوري', duration: '10 weeks', durationAr: '10 أسابيع', impact: '3-day reduction in turnaround procurement lead time', impactAr: 'خفض مهلة مشتريات الإيقاف بمقدار 3 أيام' }, { title: 'ARAMCO-Compliant SOP Suite', titleAr: 'حزمة إجراءات معيارية متوائمة مع أرامكو', duration: '8 weeks', durationAr: '8 أسابيع', impact: '0 repeat non-conformances in next audit', impactAr: 'صفر حالات عدم مطابقة متكرّرة في التدقيق القادم' }] },
    ],
    challenges: [
      { challenge: 'Processes exist only in people\'s heads — no documented SOPs', challengeAr: 'العمليات موجودة فقط في أذهان الناس — لا إجراءات معيارية موثّقة', impact: 'Key person dependency; inconsistent output; regulatory audit failures; knowledge lost at turnover', impactAr: 'اعتماد على أشخاص محدّدين؛ ومخرجات غير متّسقة؛ وإخفاقات في التدقيق التنظيمي؛ وضياع المعرفة عند دوران العمالة', solution: 'Run process capture workshops with process owners; document SOPs in plain language with visual swim-lane maps; validate with operations team; implement approval and version control', solutionAr: 'إجراء ورش التقاط العمليات مع ملّاك العمليات؛ وتوثيق الإجراءات المعيارية بلغة واضحة مع خرائط بصرية؛ والتحقّق منها مع الفريق التشغيلي؛ وتطبيق الاعتماد والتحكّم في الإصدارات', framework: 'ISO 9001 / Lean SOP' },
      { challenge: 'SOPs exist but nobody follows them — compliance is low', challengeAr: 'الإجراءات المعيارية موجودة لكن لا أحد يتّبعها — الامتثال منخفض', impact: 'Policies become shelf documents; audit findings repeated year after year; regulatory risk remains', impactAr: 'تتحوّل السياسات إلى وثائق على الرفوف؛ وتتكرّر ملاحظات التدقيق عاماً بعد عام؛ وتبقى المخاطر التنظيمية', solution: 'Investigate root cause of non-compliance (unclear language, impractical steps, no enforcement); redesign the SOP with process owners; integrate into ERP workflows; measure compliance monthly', solutionAr: 'التحقيق في السبب الجذري لعدم الامتثال (لغة غير واضحة، خطوات غير عملية، لا تطبيق)؛ وإعادة تصميم الإجراءات مع ملّاك العمليات؛ ودمجها في سير عمل ERP؛ وقياس الامتثال شهرياً', framework: 'DMAIC / Lean' },
      { challenge: 'Approval process takes longer than the procurement itself', challengeAr: 'عملية الاعتماد تستغرق وقتاً أطول من عملية المشتريات ذاتها', impact: 'PO cycle times extend to 30–60 days; urgent purchases become emergencies; maverick spend rises', impactAr: 'تمتدّ دورات أوامر الشراء إلى 30–60 يوماً؛ وتصبح المشتريات العاجلة حالات طارئة؛ ويرتفع الإنفاق خارج القنوات', solution: 'Map approval workflow; identify bottlenecks; simplify delegation of authority; automate routine approvals in ERP; reserve senior approval for high-value/high-risk only', solutionAr: 'رسم خريطة سير عمل الاعتماد؛ وتحديد الاختناقات؛ وتبسيط تفويض الصلاحيات؛ وأتمتة الاعتمادات الروتينية في ERP؛ وحصر الاعتماد الرفيع المستوى للقيمة العالية/المخاطر العالية فقط', framework: 'Lean / DMAIC' },
      { challenge: 'SDAIA / Vision 2030 digital transformation requirements create policy gaps', challengeAr: 'متطلبات التحوّل الرقمي لـ SDAIA ورؤية 2030 تخلق فجوات في السياسات', impact: 'Digital initiatives fail governance review; data policies non-compliant with PDPL (Personal Data Protection Law)', impactAr: 'تفشل المبادرات الرقمية في مراجعة الحوكمة؛ وسياسات البيانات غير متوائمة مع نظام حماية البيانات الشخصية (PDPL)', solution: 'Audit current policies against PDPL, SDAIA data governance framework, and Vision 2030 procurement digitisation targets; develop digital procurement policy suite aligned to all three', solutionAr: 'تدقيق السياسات الحالية مقابل نظام PDPL وإطار حوكمة بيانات SDAIA وأهداف رقمنة مشتريات رؤية 2030؛ وتطوير حزمة سياسات مشتريات رقمية متوائمة مع الثلاثة', framework: 'SDAIA / PDPL / GTPL' },
    ],
    achievements: [
      { title: 'PO cycle time: 47 days → 8 days', titleAr: 'زمن دورة أمر الشراء: من 47 يوماً إلى 8 أيام', client: 'Saudi government ministry', industry: 'Government', industryAr: 'الحكومة', result: 'End-to-end P2P process redesigned; approval workflow automated in ERP; GTPL-aligned policy suite deployed', resultAr: 'إعادة تصميم عملية P2P من طرف إلى طرف؛ وأتمتة سير عمل الاعتماد في ERP؛ ونشر حزمة سياسات متوائمة مع GTPL', timeframe: '12 weeks', timeframeAr: '12 أسبوعاً' },
      { title: 'Audit compliance: 58% → 94% in one cycle', titleAr: 'امتثال التدقيق: من 58% إلى 94% في دورة واحدة', client: 'GCC energy operator', industry: 'Energy', industryAr: 'الطاقة', result: '25 SOPs documented and deployed; ARAMCO-compliant process suite; 0 repeat findings in next audit', resultAr: 'توثيق ونشر 25 إجراءاً معيارياً؛ وحزمة عمليات متوائمة مع أرامكو؛ وصفر ملاحظات متكرّرة في التدقيق التالي', timeframe: '10 weeks', timeframeAr: '10 أسابيع' },
      { title: '40% process lead time reduction — manufacturing procurement', titleAr: 'خفض مهلة العملية 40% — مشتريات التصنيع', client: 'Saudi manufacturing company', industry: 'Manufacturing', industryAr: 'التصنيع', result: 'VSM identified 18 non-value-added steps; kaizen events eliminated 12; Cpk improved from 0.87 to 1.38', resultAr: 'رسم خريطة VSM حدّد 18 خطوة غير مضيفة للقيمة؛ وأحداث كايزن أزالت 12 منها؛ وتحسّن Cpk من 0.87 إلى 1.38', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' },
    ],
  },

  /* ─── TRAINING & CAPABILITY BUILDING ─── */
  {
    slug: 'training-capability-building',
    title: 'Training & Capability Building', titleAr: 'التدريب وبناء القدرات',
    tagline: 'CIPS-aligned procurement and supply chain learning programmes — designed for the GCC workforce, delivered in Arabic and English, and built to stick.',
    taglineAr: 'برامج تعلّم متوائمة مع CIPS في المشتريات وسلسلة الإمداد — مصمَّمة للقوى العاملة الخليجية، تُقدَّم بالعربية والإنجليزية، ومبنية لتدوم.',
    description: 'Most GCC supply chain and procurement teams carry significant capability gaps — in strategic sourcing, category management, contract governance, and digital tools. ISC delivers structured learning pathways built around CIPS/MCIPS standards, the Saudi Tamheer/Hadaf frameworks, and real GCC business cases. Training that moves from theory to application — with coaching, assessment, and measurable behaviour change.',
    descriptionAr: 'تحمل معظم فرق سلسلة الإمداد والمشتريات الخليجية فجوات كبيرة في القدرات — في التوريد الاستراتيجي وإدارة الفئات وحوكمة العقود والأدوات الرقمية. تقدّم ISC مسارات تعلّم منظّمة مبنية حول معايير CIPS/MCIPS وأطر تمهير/حافز السعودية وحالات أعمال خليجية حقيقية. تدريب ينتقل من النظرية إلى التطبيق — مع إرشاد وتقييم وتغيير سلوكي قابل للقياس.',
    icon: BookOpen, color: 'text-rose-600', bgGrad: 'from-rose-700 to-rose-900',
    frameworks: {
      strategic: [
        { name: 'ISC Learning Pathway Architecture', nameAr: 'هيكل مسار التعلّم من ISC', desc: '3-tier pathway: Foundation (procurement fundamentals) → Practitioner (strategic sourcing, category management) → Leadership (commercial strategy, board-level governance). Each tier includes assessment and certification.', descAr: 'مسار من 3 مستويات: أساسي (أساسيات المشتريات) ← ممارس (توريد استراتيجي، إدارة فئات) ← قيادي (استراتيجية تجارية، حوكمة على مستوى المجلس). كل مستوى يتضمّن تقييماً وشهادة.', tools: ['Capability gap assessment', 'Learning pathway map', 'Role-based training plan', 'Progress tracker'], toolsAr: ['تقييم فجوات القدرات', 'خريطة مسار التعلّم', 'خطة تدريب قائمة على الأدوار', 'متتبّع التقدّم'], standard: 'CIPS Level 2–6 / MCIPS' },
        { name: 'CIPS / MCIPS Alignment Programme', nameAr: 'برنامج المواءمة مع CIPS/MCIPS', desc: 'Structured preparation for CIPS qualification at Levels 2–6, and MCIPS membership for senior practitioners — including study groups, mock assessments, and coaching.', descAr: 'تحضير منظّم لمؤهّل CIPS في المستويات 2–6، وعضوية MCIPS للممارسين الكبار — يتضمّن مجموعات دراسة وتقييمات تجريبية وإرشاداً.', tools: ['CIPS syllabus mapping', 'Mock assessment bank', 'Study group facilitation', 'Portfolio of evidence guidance'], toolsAr: ['رسم خريطة منهج CIPS', 'بنك التقييمات التجريبية', 'تيسير مجموعات الدراسة', 'إرشاد حافظة الأدلة'], standard: 'CIPS Level 4–6 / MCIPS' },
        { name: 'Saudi Nationalisation (Saudization) Capability Programme', nameAr: 'برنامج تنمية القدرات للسعودة', desc: 'Accelerated procurement capability development for Saudi nationals — aligned to Tamheer, Hadaf, and Vision 2030 Saudization targets in procurement and supply chain functions.', descAr: 'تطوير متسارع لقدرات المشتريات للمواطنين السعوديين — متوائم مع تمهير وحافز وأهداف سعودة رؤية 2030 في وظائف المشتريات وسلسلة الإمداد.', tools: ['Saudization-aligned curriculum', 'Arabic-language learning materials', 'Mentoring & coaching programme', 'Competency assessment (Arabic)'], toolsAr: ['منهج متوائم مع السعودة', 'مواد تعليمية باللغة العربية', 'برنامج توجيه وإرشاد', 'تقييم الكفاءة (عربي)'], standard: 'Tamheer / Hadaf / Vision 2030' },
      ],
      tactical: [
        { name: 'Blended Learning Design', nameAr: 'تصميم التعلّم المدمج', desc: 'Combination of instructor-led workshops, e-learning modules, on-the-job application projects, peer learning communities, and 1:1 coaching — maximising knowledge retention.', descAr: 'مزج بين ورش مُقدَّمة من مدرّب ووحدات تعلّم إلكتروني ومشاريع تطبيق أثناء العمل ومجتمعات تعلّم الأقران والإرشاد الفردي — لتعظيم الاحتفاظ بالمعرفة.', tools: ['Workshop facilitation guide', 'E-learning module library', 'On-the-job project template', 'Coaching framework'], toolsAr: ['دليل تيسير ورش العمل', 'مكتبة وحدات التعلّم الإلكتروني', 'قالب مشروع تطبيق أثناء العمل', 'إطار الإرشاد'], standard: 'CIPS / ATD' },
        { name: 'Capability Gap Assessment', nameAr: 'تقييم فجوات القدرات', desc: 'Role-by-role capability assessment against CIPS competency framework — producing individual and team gap maps and prioritised training plans.', descAr: 'تقييم القدرات دوراً بدور مقابل إطار كفاءات CIPS — ينتج خرائط فجوات فردية وجماعية وخططاً تدريبية مرتّبة حسب الأولوية.', tools: ['Competency assessment tool', 'Gap heatmap', 'Individual development plan (IDP)', 'Team skills matrix'], toolsAr: ['أداة تقييم الكفاءة', 'خريطة حرارة الفجوات', 'خطة التطوير الفردي', 'مصفوفة مهارات الفريق'], standard: 'CIPS Competency Framework' },
        { name: 'Training ROI & Behaviour Change Measurement', nameAr: 'قياس عائد الاستثمار في التدريب وتغيير السلوك', desc: 'Kirkpatrick 4-level evaluation: Reaction → Learning → Behaviour → Results. Measuring not just satisfaction but on-the-job behaviour change and business impact.', descAr: 'تقييم كيركباتريك من 4 مستويات: ردّة الفعل ← التعلّم ← السلوك ← النتائج. قياس تغيّر السلوك في العمل والأثر التجاري، لا مجرد الرضا.', tools: ['Pre/post assessment', 'Behaviour change observation (90-day)', 'KPI improvement tracking', 'ROI calculation model'], toolsAr: ['تقييم ما قبل/ما بعد', 'مراقبة تغيير السلوك (90 يوماً)', 'تتبّع تحسين مؤشرات الأداء', 'نموذج حساب عائد الاستثمار'], standard: 'Kirkpatrick / CIPS' },
      ],
      operational: [
        { name: 'GCC Business Case Library', nameAr: 'مكتبة حالات أعمال خليجية', desc: 'All ISC training uses real GCC procurement and supply chain scenarios — Saudi government procurement, energy sector MRO, Jordanian infrastructure, pharma supply chains — making learning immediately applicable.', descAr: 'يستخدم تدريب ISC سيناريوهات مشتريات وسلسلة إمداد خليجية حقيقية — مشتريات حكومية سعودية وصيانة وتشغيل قطاع الطاقة والبنية التحتية الأردنية وسلاسل إمداد الأدوية — مما يجعل التعلّم قابلاً للتطبيق فوراً.', tools: ['Case study library (GCC)', 'Role-play scenario bank', 'Real-data exercises', 'Industry simulation'], toolsAr: ['مكتبة دراسات الحالة (الخليج)', 'بنك سيناريوهات لعب الأدوار', 'تمارين بيانات حقيقية', 'محاكاة قطاعية'], standard: 'CIPS / APICS' },
        { name: 'Arabic-Language Delivery Capability', nameAr: 'قدرة التقديم باللغة العربية', desc: 'All ISC training programmes available in Arabic — written materials, facilitation, assessments, and coaching — ensuring accessibility for Arabic-speaking professionals across the GCC.', descAr: 'جميع برامج ISC التدريبية متاحة بالعربية — المواد المكتوبة والتيسير والتقييمات والإرشاد — لضمان إمكانية الوصول للمهنيين الناطقين بالعربية عبر الخليج.', tools: ['Arabic workshop materials', 'Arabic e-learning modules', 'Arabic assessment papers', 'Arabic coaching resources'], toolsAr: ['مواد ورش عربية', 'وحدات تعلّم إلكتروني بالعربية', 'أوراق تقييم بالعربية', 'موارد إرشاد بالعربية'], standard: 'CIPS / Tamheer' },
      ],
    },
    kpis: [
      { category: 'Learning Outcomes', categoryAr: 'مخرجات التعلّم', metrics: [
        { name: 'Assessment Score Improvement', nameAr: 'تحسين درجة التقييم', target: '>25 points', targetAr: 'أكثر من 25 نقطة', benchmark: '12 points', benchmarkAr: '12 نقطة', unit: 'points pre→post', unitAr: 'نقطة قبل←بعد' },
        { name: 'Training Completion Rate', nameAr: 'معدّل إكمال التدريب', target: '>90%', benchmark: '64%', unit: '%' },
        { name: 'CIPS Exam Pass Rate', nameAr: 'معدّل نجاح اختبار CIPS', target: '>80%', benchmark: '62%', unit: '%' },
      ]},
      { category: 'Behaviour Change', categoryAr: 'تغيير السلوك', metrics: [
        { name: 'On-the-Job Behaviour Change Score (90-day)', nameAr: 'درجة تغيير السلوك الوظيفي (90 يوماً)', target: '>70%', benchmark: '35%', unit: '% observed', unitAr: '% مُلاحَظ' },
        { name: 'Post-Training KPI Improvement', nameAr: 'تحسين مؤشرات الأداء بعد التدريب', target: '>15%', benchmark: '5%', unit: '% on target KPIs', unitAr: '% على مؤشرات الأداء المستهدفة' },
        { name: 'Manager Satisfaction (trainee performance)', nameAr: 'رضا المدير (أداء المتدرّب)', target: '>4.0/5', benchmark: '2.9/5', unit: '/5' },
      ]},
      { category: 'Nationalisation & Certification', categoryAr: 'الوطنية والاعتماد', metrics: [
        { name: 'Saudi National Procurement Staff Certified', nameAr: 'موظفو مشتريات سعوديون حاصلون على شهادة', target: '>80% of team', targetAr: 'أكثر من 80% من الفريق', benchmark: '18%', unit: '%', unitAr: '%' },
        { name: 'Training ROI', nameAr: 'عائد الاستثمار في التدريب', target: '>400%', benchmark: '120%', unit: '%' },
        { name: 'Certification Attainment Rate', nameAr: 'معدّل الحصول على الشهادات', target: '>75%', benchmark: '31%', unit: '%' },
      ]},
    ],
    projects: [
      { industry: 'Government', industryAr: 'الحكومة', quickWins: ['Run capability gap assessment for entire procurement team', 'Identify all staff eligible for Tamheer/Hadaf sponsorship', 'Launch CIPS Level 4 study group (Arabic)'], quickWinsAr: ['إجراء تقييم فجوات القدرات لفريق المشتريات بأكمله', 'تحديد جميع الموظفين المؤهّلين لرعاية تمهير/حافز', 'إطلاق مجموعة دراسة CIPS المستوى 4 (عربي)'], projects: [{ title: 'Government Procurement Capability Programme', titleAr: 'برنامج بناء قدرات المشتريات الحكومية', duration: '24 weeks', durationAr: '24 أسبوعاً', impact: '78% of team CIPS Level 4 certified', impactAr: '78% من الفريق حاصل على شهادة CIPS المستوى 4' }, { title: 'Saudization Accelerator (Procurement)', titleAr: 'مسرّع السعودة (المشتريات)', duration: '16 weeks', durationAr: '16 أسبوعاً', impact: 'Saudization target exceeded by 12%', impactAr: 'تجاوز هدف السعودة بنسبة 12%' }] },
      { industry: 'Energy', industryAr: 'الطاقة', quickWins: ['Assess ARAMCO vendor qualification team against MCIPS standards', 'Build category management training programme for MRO buyers', 'Implement coaching programme for 3 high-potential Saudi nationals'], quickWinsAr: ['تقييم فريق تأهيل موردي أرامكو مقابل معايير MCIPS', 'بناء برنامج تدريب إدارة الفئات لمشتري الصيانة والتشغيل', 'تطبيق برنامج إرشاد لـ 3 مواطنين سعوديين ذوي إمكانيات عالية'], projects: [{ title: 'Category Management Certification', titleAr: 'شهادة إدارة الفئات', duration: '20 weeks', durationAr: '20 أسبوعاً', impact: 'SAR 4M+ savings from trained category managers', impactAr: 'وفورات تتجاوز 4 ملايين ريال من مديري الفئات المدرَّبين' }, { title: 'MCIPS Pathway Programme', titleAr: 'برنامج مسار MCIPS', duration: '12 months', durationAr: '12 شهراً', impact: '5 senior staff achieve MCIPS in 12 months', impactAr: '5 موظفين كبار يحصلون على MCIPS في 12 شهراً' }] },
      { industry: 'Healthcare', industryAr: 'الرعاية الصحية', quickWins: ['Baseline assessment: procurement team vs CIPS Level 3 standard', 'GDP-aware procurement training for all buyers handling medicines', 'Arabic e-learning modules for basic P2P process'], quickWinsAr: ['تقييم أساسي: فريق المشتريات مقابل معيار CIPS المستوى 3', 'تدريب مشتريات واعٍ بـ GDP لجميع المشترين المتعاملين مع الأدوية', 'وحدات تعلّم إلكتروني بالعربية لعملية P2P الأساسية'], projects: [{ title: 'Healthcare Procurement Competency Build', titleAr: 'بناء كفاءة مشتريات الرعاية الصحية', duration: '16 weeks', durationAr: '16 أسابيع', impact: 'SFDA/GDP procurement compliance from 58% to 92%', impactAr: 'امتثال مشتريات SFDA/GDP من 58% إلى 92%' }, { title: 'Arabic CIPS Level 4 Cohort', titleAr: 'مجموعة CIPS المستوى 4 (عربي)', duration: '24 weeks', durationAr: '24 أسبوعاً', impact: '82% pass rate — highest in GCC healthcare sector', impactAr: 'معدّل نجاح 82% — الأعلى في قطاع الرعاية الصحية الخليجي' }] },
    ],
    challenges: [
      { challenge: 'Training budget approved but no structured programme — money wasted on generic courses', challengeAr: 'ميزانية التدريب معتمدة لكن لا برنامج منظّم — أموال تُهدَر على دورات عامة', impact: 'Generic training produces no measurable capability change; ROI near zero; leadership withdraws training investment', impactAr: 'التدريب العام لا ينتج أي تغيير قابل للقياس في القدرات؛ وعائد الاستثمار قريب من الصفر؛ والقيادة تسحب الاستثمار في التدريب', solution: 'Start with a capability gap assessment to identify actual gaps; design a role-specific learning pathway; measure before and after; report behaviour change not just completion certificates', solutionAr: 'البدء بتقييم فجوات القدرات لتحديد الفجوات الفعلية؛ وتصميم مسار تعلّم خاص بكل دور؛ والقياس قبل وبعد؛ والإبلاغ عن تغيير السلوك لا مجرد شهادات الإتمام', framework: 'Kirkpatrick / CIPS' },
      { challenge: 'Saudi nationals lack procurement career pathway — high turnover', challengeAr: 'المواطنون السعوديون يفتقرون إلى مسار مهني في المشتريات — معدّل دوران مرتفع', impact: 'Knowledge walks out the door; Saudization targets missed; Tamheer/Hadaf funding underutilised', impactAr: 'المعرفة تغادر المؤسسة؛ وأهداف السعودة لا تتحقّق؛ ومخصصات تمهير/حافز لا تُستغَل', solution: 'Design a clear procurement career pathway from junior buyer to CPO; align to CIPS qualifications; tap Tamheer/Hadaf funding; partner with CIPS Arabia for dual Arabic/English certification delivery', solutionAr: 'تصميم مسار مهني مشتريات واضح من مشترٍ مبتدئ إلى رئيس مشتريات؛ والمواءمة مع مؤهّلات CIPS؛ والاستفادة من تمويل تمهير/حافز؛ والشراكة مع CIPS Arabia لتقديم شهادة مزدوجة عربية/إنجليزية', framework: 'CIPS / Tamheer / Vision 2030' },
      { challenge: 'Training delivered in English — Arabic speakers disengage', challengeAr: 'التدريب يُقدَّم بالإنجليزية — الناطقون بالعربية يفقدون الاهتمام', impact: 'Comprehension drops; application of learning fails; assessment scores poor for Arabic-dominant staff', impactAr: 'الفهم ينخفض؛ وتطبيق التعلّم يفشل؛ ودرجات التقييم ضعيفة للموظفين الذين تسود لديهم العربية', solution: 'Deliver all ISC training in both Arabic and English; Arabic-language CIPS materials; Arabic facilitators with GCC business experience; code-switching welcome in group discussions', solutionAr: 'تقديم جميع تدريبات ISC بالعربية والإنجليزية؛ ومواد CIPS بالعربية؛ وميسّرون عرب ذوو خبرة في أعمال الخليج؛ والترحيب بالتبديل بين اللغتين في النقاشات الجماعية', framework: 'CIPS Arabia / Tamheer' },
      { challenge: 'No post-training measurement — nobody knows if it worked', challengeAr: 'لا قياس بعد التدريب — لا أحد يعرف إن كان قد نجح', impact: 'Training investment seen as a cost, not an investment; capability gaps persist; same training repeated', impactAr: 'الاستثمار في التدريب يُرى تكلفةً لا استثماراً؛ وفجوات القدرات تستمرّ؛ والتدريب ذاته يتكرّر', solution: 'Implement Kirkpatrick 4-level evaluation: pre/post assessment, 90-day behaviour change observation, KPI tracking, and ROI calculation; report results to leadership as investment performance', solutionAr: 'تطبيق تقييم كيركباتريك من 4 مستويات: تقييم قبل/بعد، ومراقبة تغيير السلوك لمدة 90 يوماً، وتتبّع مؤشرات الأداء، وحساب عائد الاستثمار؛ والإبلاغ عن النتائج للقيادة كأداء استثماري', framework: 'Kirkpatrick / CIPS' },
    ],
    achievements: [
      { title: '78% of government procurement team CIPS Level 4 certified', titleAr: '78% من فريق المشتريات الحكومي حاصل على CIPS المستوى 4', client: 'Saudi government entity', industry: 'Government', industryAr: 'الحكومة', result: 'Arabic-language CIPS cohort; Tamheer funding leveraged; behaviour change score 74% at 90 days', resultAr: 'مجموعة CIPS باللغة العربية؛ والاستفادة من تمويل تمهير؛ ودرجة تغيير السلوك 74% عند 90 يوماً', timeframe: '24 weeks', timeframeAr: '24 أسبوعاً' },
      { title: 'SAR 4M savings from trained category managers (energy)', titleAr: 'وفورات 4 ملايين ريال من مديري الفئات المدرَّبين (الطاقة)', client: 'GCC energy company', industry: 'Energy', industryAr: 'الطاقة', result: 'Category management programme delivered; trained teams applied skills immediately; savings attributed directly to training investment', resultAr: 'تسليم برنامج إدارة الفئات؛ والفرق المدرَّبة طبّقت المهارات فوراً؛ والوفورات تُعزى مباشرةً إلى الاستثمار في التدريب', timeframe: '20 weeks', timeframeAr: '20 أسبوعاً' },
      { title: '5 senior procurement leaders achieve MCIPS', titleAr: '5 قادة مشتريات كبار يحصلون على MCIPS', client: 'Jordanian conglomerate', industry: 'Energy', industryAr: 'الطاقة', result: 'MCIPS pathway programme; 1:1 coaching; portfolio of evidence support; all 5 passed on first attempt', resultAr: 'برنامج مسار MCIPS؛ وإرشاد فردي؛ ودعم حافظة الأدلة؛ ونجاح الخمسة من المحاولة الأولى', timeframe: '12 months', timeframeAr: '12 شهراً' },
    ],
  },
];

// All slugs are now fully implemented
const REMAINING_SLUGS: string[] = [];

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

        {/* TAB 2 — KPI Dashboard */}
        {activeTab === 2 && (
          <KPIDashboard slug={sol.slug} />
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
            {sol.slug === 'procurement-excellence' && (
              <Reveal>
                <ProcurementToolsSection isAr={isAr} />
              </Reveal>
            )}
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
                        <ChallengeToolkitPanel slug={sol.slug} challengeIndex={i} isAr={isAr} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </Reveal>
            ))}
            {sol.slug === 'procurement-excellence' && <Reveal><ProcurementToolsSection isAr={isAr} /></Reveal>}
            {sol.slug === 'risk-management-solution' && <Reveal><RiskToolsSection isAr={isAr} /></Reveal>}
            {sol.slug === 'contract-lifecycle-management' && <Reveal><ContractHealthChecker isAr={isAr} /></Reveal>}
            {sol.slug === 'supplier-relationship-governance' && <Reveal><SupplierScorecardTool isAr={isAr} /></Reveal>}
            {sol.slug === 'training-capability-building' && <Reveal><TrainingNeedsAssessment isAr={isAr} /></Reveal>}
            {(sol.slug === 'resiliency' || sol.slug === 'value-engineering' || sol.slug === 'process-improvement-policy' || sol.slug === 'lean-agile-supply-chain' || sol.slug === 'supply-chain-strategy' || sol.slug === 'sustainability-esg' || sol.slug === 'digital-transformation') && (
              <Reveal><MaturityAssessmentTool slug={sol.slug} isAr={isAr} /></Reveal>
            )}
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
