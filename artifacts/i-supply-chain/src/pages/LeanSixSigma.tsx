import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Zap, BarChart3, Target, RefreshCw, Shield, Leaf,
  CheckCircle, ChevronRight, AlertTriangle, TrendingUp,
  Activity, GitBranch, BookOpen, Award, Clock, Factory,
  ArrowRight, Layers, Star, Globe, Radio,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Overview', 'Lean Framework', 'Six Sigma (DMAIC)', 'Quality Management', 'Agile & Resilience', 'Industry Applications'];
const TABS_AR = ['نظرة عامة', 'إطار Lean', 'Six Sigma (DMAIC)', 'إدارة الجودة', 'الرشاقة والمرونة', 'تطبيقات القطاعات'];

const LEAN_WASTES = [
  { letter: 'T', name: 'Transportation', nameAr: 'النقل', desc: 'Unnecessary movement of goods', descAr: 'نقل غير ضروري للبضائع', example: 'Multi-leg routing of goods when direct delivery is possible; excess inter-warehouse transfers', exampleAr: 'توجيه البضائع عبر مراحل متعددة رغم إمكانية التسليم المباشر؛ عمليات نقل زائدة بين المستودعات' },
  { letter: 'I', name: 'Inventory', nameAr: 'المخزون', desc: 'Excess stock at any stage', descAr: 'مخزون زائد في أي مرحلة', example: 'Over-stocked warehouses, raw material buffers masking process problems, safety stock not demand-driven', exampleAr: 'مستودعات مكدّسة، ومخزونات مواد خام تخفي مشاكل العمليات، ومخزون أمان غير مبني على الطلب' },
  { letter: 'M', name: 'Motion', nameAr: 'الحركة', desc: 'Unnecessary people/equipment movement', descAr: 'حركة غير ضرورية للأفراد/المعدّات', example: 'Warehouse pickers travelling excessive distance; poor slotting strategy', exampleAr: 'قطع منتقي المستودع مسافات مفرطة؛ استراتيجية تخزين سيئة' },
  { letter: 'W', name: 'Waiting', nameAr: 'الانتظار', desc: 'Idle time between process steps', descAr: 'وقت خمول بين خطوات العملية', example: 'PO approval delays, goods waiting at customs, unscheduled supplier lead times', exampleAr: 'تأخّر اعتماد أوامر الشراء، وانتظار البضائع في الجمارك، ومهل توريد غير مجدولة' },
  { letter: 'O', name: 'Overproduction', nameAr: 'الإفراط في الإنتاج', desc: 'Making more than immediately needed', descAr: 'إنتاج أكثر من الحاجة الفورية', example: 'Manufacturing to forecast rather than order; buying in bulk to "save" cost', exampleAr: 'التصنيع وفق التوقّع بدلاً من الطلب؛ الشراء بالجملة لـ"توفير" التكلفة' },
  { letter: 'O', name: 'Over-processing', nameAr: 'الإفراط في المعالجة', desc: 'More work than customer requires', descAr: 'عمل أكثر مما يتطلّبه العميل', example: 'Multiple approval layers on low-value POs; triple-checking specs that are standardised', exampleAr: 'طبقات اعتماد متعددة على أوامر شراء منخفضة القيمة؛ فحص ثلاثي لمواصفات موحّدة' },
  { letter: 'D', name: 'Defects', nameAr: 'العيوب', desc: 'Errors requiring rework or returns', descAr: 'أخطاء تتطلّب إعادة عمل أو إرجاع', example: 'Supplier quality failures, incorrect shipments, invoice errors requiring correction', exampleAr: 'إخفاقات جودة المورّدين، وشحنات خاطئة، وأخطاء فواتير تتطلّب تصحيحاً' },
  { letter: 'S', name: 'Skills', nameAr: 'المهارات', desc: 'Underutilising people\'s capability', descAr: 'الاستخدام الناقص لقدرات الأفراد', example: 'MCIPS-qualified buyer processing purchase orders; analysts doing manual data entry', exampleAr: 'مشترٍ حاصل على MCIPS يعالج أوامر الشراء؛ محلّلون يقومون بإدخال بيانات يدوي' },
];

const DMAIC_PHASES = [
  { phase: 'Define', phaseAr: 'التعريف', color: 'bg-blue-600', tools: ['Project Charter', 'SIPOC Diagram', 'Voice of Customer (VOC)', 'CTQ Tree', 'Stakeholder Map'], deliverable: 'Approved project charter with scope, goals, timeline', deliverableAr: 'ميثاق مشروع معتمد بالنطاق والأهداف والجدول الزمني', example: 'Define procurement cycle reduction project: scope = direct materials PO-to-delivery, target = reduce from 28→10 days, baseline sigma = 1.9', exampleAr: 'تعريف مشروع خفض دورة المشتريات: النطاق = المواد المباشرة من أمر الشراء إلى التسليم، الهدف = الخفض من 28 إلى 10 أيام، سيجما الأساس = 1.9' },
  { phase: 'Measure', phaseAr: 'القياس', color: 'bg-indigo-600', tools: ['Process Capability (Cp/Cpk)', 'Gauge R&R', 'Data Collection Plan', 'Baseline Sigma Level', 'Run Charts'], deliverable: 'Baseline data showing current performance gap', deliverableAr: 'بيانات أساس تُظهر فجوة الأداء الحالية', example: 'Measure OTIF baseline: 78%, sigma level 2.4. Key data: 35% of late deliveries caused by supplier; 40% by internal approval delays', exampleAr: 'قياس أساس OTIF: 78%، مستوى سيجما 2.4. بيانات رئيسية: 35% من التأخيرات بسبب المورّد؛ 40% بسبب تأخّر الاعتماد الداخلي' },
  { phase: 'Analyze', phaseAr: 'التحليل', color: 'bg-purple-600', tools: ['Fishbone (Ishikawa)', '5-Why Analysis', 'Pareto 80/20', 'Regression Analysis', 'Hypothesis Testing'], deliverable: 'Validated root causes ranked by impact', deliverableAr: 'أسباب جذرية مُتحقَّق منها ومرتّبة بحسب الأثر', example: 'Root cause: 72% of late POs caused by ≥4 approval levels on items <SAR 50K. Pareto confirms: fix this = 72% problem solved', exampleAr: 'السبب الجذري: 72% من أوامر الشراء المتأخرة بسبب 4 مستويات اعتماد أو أكثر على أصناف أقل من 50 ألف ريال. يؤكّد باريتو: حلّ هذا = 72% من المشكلة' },
  { phase: 'Improve', phaseAr: 'التحسين', color: 'bg-emerald-600', tools: ['Design of Experiments (DoE)', 'Solution Selection Matrix', 'Pilot Plan', 'FMEA', 'Future-State VSM'], deliverable: 'Implemented improvement with measurable before/after', deliverableAr: 'تحسين مُطبَّق بقياس قبل/بعد', example: 'Redesign approval: items <SAR 50K approved by Procurement Manager only (1 level). Pilot in 4 weeks: cycle time dropped 28→11 days', exampleAr: 'إعادة تصميم الاعتماد: الأصناف أقل من 50 ألف ريال يعتمدها مدير المشتريات فقط (مستوى واحد). تجربة خلال 4 أسابيع: انخفض زمن الدورة من 28 إلى 11 يوماً' },
  { phase: 'Control', phaseAr: 'الضبط', color: 'bg-teal-600', tools: ['SPC Control Charts', 'Control Plan', 'Visual Management', 'Response Plan', 'Handover Documentation'], deliverable: 'Sustained performance with monitoring plan', deliverableAr: 'أداء مستدام مع خطة مراقبة', example: 'Control plan: weekly OTIF chart, monthly sigma review, process owner assigned. OTIF sustained at 93% for 6 months post-project', exampleAr: 'خطة الضبط: مخطط OTIF أسبوعي، ومراجعة سيجما شهرية، ومالك عملية مُسنَد. استمر OTIF عند 93% لمدة 6 أشهر بعد المشروع' },
];

const QUALITY_TOOLS = [
  { name: 'FMEA', use: 'New process/product launch', useAr: 'إطلاق عملية/منتج جديد', scApp: 'Pre-qualify new suppliers; assess new logistics routes before go-live', scAppAr: 'تأهيل مسبق للمورّدين الجدد؛ تقييم مسارات لوجستية جديدة قبل التشغيل' },
  { name: 'SPC / Control Charts', use: 'Monitoring ongoing processes', useAr: 'مراقبة العمليات الجارية', scApp: 'Monitor supplier OTIF weekly; flag when process goes out of control limits', scAppAr: 'مراقبة OTIF للمورّد أسبوعياً؛ التنبيه عند خروج العملية عن حدود الضبط' },
  { name: 'Pareto (80/20)', use: 'Prioritising improvement focus', useAr: 'ترتيب أولويات تركيز التحسين', scApp: 'Identify the 20% of suppliers causing 80% of quality issues', scAppAr: 'تحديد الـ 20% من المورّدين المسبّبين لـ 80% من مشاكل الجودة' },
  { name: 'Fishbone (Ishikawa)', use: 'Root cause analysis', useAr: 'تحليل السبب الجذري', scApp: 'Diagnose why on-time delivery is failing — people, process, systems, suppliers', scAppAr: 'تشخيص سبب إخفاق التسليم في الوقت — الأفراد والعمليات والأنظمة والمورّدون' },
  { name: '8D Problem Solving', use: 'Supplier quality incident response', useAr: 'الاستجابة لحادث جودة مورّد', scApp: 'Structured 8-discipline corrective action when a supplier causes a recall or shortage', scAppAr: 'إجراء تصحيحي منظّم من 8 خطوات عندما يسبّب مورّد استدعاءً أو نقصاً' },
  { name: 'MSA (Measurement System Analysis)', use: 'Validating data reliability', useAr: 'التحقّق من موثوقية البيانات', scApp: 'Ensure delivery time data from ERP is accurate before using for sigma calculations', scAppAr: 'التأكّد من دقّة بيانات وقت التسليم من ERP قبل استخدامها في حسابات سيجما' },
];

const INDUSTRY_APPS = [
  {
    industry: 'Manufacturing', industryAr: 'التصنيع', icon: '🏭', wastes: ['Overproduction (push scheduling)', 'Waiting (changeover time)', 'Defects (supplier quality)'], wastesAr: ['الإفراط في الإنتاج (جدولة الدفع)', 'الانتظار (زمن التحويل)', 'العيوب (جودة المورّد)'],
    project: { title: 'VSM & Kaizen Programme', titleAr: 'برنامج VSM وKaizen', tool: 'Lean VSM + SMED', savings: '20–30%', savingsAr: '20–30%', timeline: '10 weeks', timelineAr: '10 أسابيع' },
    quickWins: ['VSM 2 production lines', '5S in warehouse/dispatch', 'Kanban for top 20 MRO items'], quickWinsAr: ['رسم VSM لخطي إنتاج', 'تطبيق 5S في المستودع/الإرسال', 'Kanban لأعلى 20 صنف صيانة وتشغيل'],
    challenge: 'Long changeover times inflate batch sizes and inventory', challengeAr: 'أزمنة التحويل الطويلة تضخّم أحجام الدفعات والمخزون',
    solution: 'SMED workshop: external/internal setup separation reduces changeover 50–70%', solutionAr: 'ورشة SMED: فصل الإعداد الخارجي/الداخلي يقلّل زمن التحويل 50–70%',
  },
  {
    industry: 'Energy', industryAr: 'الطاقة', icon: '⚡', wastes: ['Waiting (maintenance MRO availability)', 'Inventory (excess critical spares)', 'Defects (incorrect parts issued)'], wastesAr: ['الانتظار (توفّر مواد الصيانة والتشغيل)', 'المخزون (فائض قطع الغيار الحرجة)', 'العيوب (صرف قطع خاطئة)'],
    project: { title: 'Shutdown Lean Optimisation', titleAr: 'تحسين Lean لإيقاف التشغيل', tool: 'VSM + FMEA', savings: '25%', savingsAr: '25%', timeline: '12 weeks', timelineAr: '12 أسبوعاً' },
    quickWins: ['Parts availability audit for next shutdown', 'Critical spare min/max review', 'Maintenance work order flow map'], quickWinsAr: ['تدقيق توفّر القطع لإيقاف التشغيل القادم', 'مراجعة الحد الأدنى/الأقصى للقطع الحرجة', 'خريطة تدفّق أوامر عمل الصيانة'],
    challenge: 'MRO stockouts cause production downtime — over-ordering is the "safe" response', challengeAr: 'نفاد مواد الصيانة والتشغيل يسبّب توقّف الإنتاج — والإفراط في الطلب هو الاستجابة "الآمنة"',
    solution: 'DDMRP buffer positioning: data-driven safety stock replaces gut-feel over-ordering. Reduces inventory 30–40% while improving availability', solutionAr: 'تموضع مخزون DDMRP: مخزون أمان مبني على البيانات يحلّ محلّ الإفراط الحدسي في الطلب. يقلّل المخزون 30–40% مع تحسين التوفّر',
  },
  {
    industry: 'Government', industryAr: 'الحكومة', icon: '🏛️', wastes: ['Waiting (multi-layer approvals)', 'Over-processing (redundant checks)', 'Skills (expert staff doing admin)'], wastesAr: ['الانتظار (اعتمادات متعددة الطبقات)', 'الإفراط في المعالجة (فحوص مكرّرة)', 'المهارات (كفاءات خبيرة تؤدّي عملاً إدارياً)'],
    project: { title: 'Procurement Process Lean', titleAr: 'Lean لعملية المشتريات', tool: 'VSM + DMAIC', savings: '40% cycle time', savingsAr: '40% من زمن الدورة', timeline: '10 weeks', timelineAr: '10 أسابيع' },
    quickWins: ['Map current approval flows', 'Identify and eliminate duplicate process steps', 'Automate routine approval for <SAR 50K'], quickWinsAr: ['رسم مسارات الاعتماد الحالية', 'تحديد وإزالة خطوات العملية المكرّرة', 'أتمتة الاعتماد الروتيني لما دون 50 ألف ريال'],
    challenge: 'GTPL compliance adds process steps — lean without losing audit trail', challengeAr: 'يضيف امتثال GTPL خطوات للعملية — الترشيق دون فقدان مسار التدقيق',
    solution: 'Process design separating compliance requirements from operational waste — automate compliance checks, eliminate non-mandatory steps', solutionAr: 'تصميم عملية يفصل متطلبات الامتثال عن الهدر التشغيلي — أتمتة فحوص الامتثال وإزالة الخطوات غير الإلزامية',
  },
  {
    industry: 'Pharma', industryAr: 'الأدوية', icon: '💊', wastes: ['Waiting (batch release)', 'Defects (GDP deviations)', 'Overproduction (demand forecast error)'], wastesAr: ['الانتظار (إطلاق الدفعات)', 'العيوب (انحرافات GDP)', 'الإفراط في الإنتاج (خطأ توقّع الطلب)'],
    project: { title: 'GDP-Compliant Lean Cold Chain', titleAr: 'سلسلة تبريد Lean متوافقة مع GDP', tool: 'DMAIC + Lean', savings: '18% cost', savingsAr: '18% من التكلفة', timeline: '14 weeks', timelineAr: '14 أسبوعاً' },
    quickWins: ['Cold chain VSM (from supplier to patient)', 'Batch release timeline analysis', 'Temperature excursion root cause'], quickWinsAr: ['رسم VSM لسلسلة التبريد (من المورّد إلى المريض)', 'تحليل الجدول الزمني لإطلاق الدفعات', 'السبب الجذري لتجاوز درجة الحرارة'],
    challenge: 'Lean must not compromise GDP compliance or SFDA requirements', challengeAr: 'يجب ألا يمسّ الترشيق بامتثال GDP أو متطلبات SFDA',
    solution: 'Quality-by-Design approach: lean tools selected specifically for GDP-compliant environments; every improvement FMEA-validated before implementation', solutionAr: 'نهج الجودة بالتصميم: أدوات Lean مختارة خصيصاً لبيئات متوافقة مع GDP؛ كل تحسين مُتحقَّق بـ FMEA قبل التطبيق',
  },
  {
    industry: 'Logistics', industryAr: 'الخدمات اللوجستية', icon: '🚛', wastes: ['Transportation (empty running)', 'Motion (warehouse travel)', 'Waiting (dock congestion)'], wastesAr: ['النقل (تشغيل فارغ)', 'الحركة (التنقّل داخل المستودع)', 'الانتظار (ازدحام الأرصفة)'],
    project: { title: 'Lean Warehouse & Route Design', titleAr: 'تصميم مستودع ومسارات Lean', tool: 'Lean + Route Optimisation', savings: '22% cost', savingsAr: '22% من التكلفة', timeline: '10 weeks', timelineAr: '10 أسابيع' },
    quickWins: ['Empty-running analysis on top 10 routes', 'Warehouse slotting audit', 'Dock scheduling board implementation'], quickWinsAr: ['تحليل التشغيل الفارغ لأعلى 10 مسارات', 'تدقيق تخزين المستودع', 'تطبيق لوحة جدولة الأرصفة'],
    challenge: 'Driver and vehicle utilisation low — difficult to improve without demand predictability', challengeAr: 'انخفاض استغلال السائقين والمركبات — يصعب تحسينه دون قابلية التنبؤ بالطلب',
    solution: 'Demand clustering and consolidation strategies, cross-docking design, dynamic route optimisation with 48h demand signal', solutionAr: 'استراتيجيات تجميع الطلب والدمج، وتصميم المناولة العابرة، وتحسين المسارات الديناميكي بإشارة طلب خلال 48 ساعة',
  },
  {
    industry: 'Healthcare', industryAr: 'الرعاية الصحية', icon: '🏥', wastes: ['Inventory (clinical consumables)', 'Motion (nurse supply collection)', 'Waiting (theatre supply delays)'], wastesAr: ['المخزون (المستهلكات السريرية)', 'الحركة (تجميع الممرّضات للوازم)', 'الانتظار (تأخّر لوازم غرف العمليات)'],
    project: { title: 'Hospital Supply Lean', titleAr: 'Lean لإمداد المستشفيات', tool: 'Lean + Par-Level Kanban', savings: '30–35%', savingsAr: '30–35%', timeline: '12 weeks', timelineAr: '12 أسبوعاً' },
    quickWins: ['Par-level audit for 3 high-cost wards', 'Theatre supply VSM', 'Top 20 high-cost consumable inventory review'], quickWinsAr: ['تدقيق مستوى المخزون لثلاثة أجنحة عالية التكلفة', 'رسم VSM للوازم غرف العمليات', 'مراجعة مخزون أعلى 20 مستهلكاً عالي التكلفة'],
    challenge: 'Clinical staff resistance to supply process changes — safety concerns', challengeAr: 'مقاومة الطواقم السريرية لتغييرات عملية الإمداد — مخاوف السلامة',
    solution: 'Co-design approach: clinical staff co-design supply process improvements. Par-level Kanban tested in pilot ward before roll-out. Safety stock maintained for critical items', solutionAr: 'نهج التصميم المشترك: تشارك الطواقم السريرية في تصميم تحسينات الإمداد. يُختبر Kanban في جناح تجريبي قبل التعميم. يُحتفظ بمخزون أمان للأصناف الحرجة',
  },
];

export function LeanSixSigma() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState(0);
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const [openWaste, setOpenWaste] = useState<number | null>(null);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-purple-900 py-14 px-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #C9A84C 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#C9A84C] animate-pulse" />
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">{isAr ? 'التميّز التشغيلي' : 'Operational Excellence'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{isAr ? 'Lean وSix Sigma وتميّز الجودة' : <>Lean, Six Sigma &amp; Quality Excellence</>}</h1>
          <p className="text-white/75 text-lg max-w-2xl">{isAr ? 'أزِل الهدر، وقلّل التباين، وابنِ الجودة في كل عملية بسلسلة الإمداد — من الاستراتيجية إلى التنفيذ التشغيلي عبر الخليج.' : 'Eliminate waste, reduce variation, and build quality into every supply chain process — from strategy to operational execution across the GCC.'}</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">{isAr ? 'احجز استشارة LSS' : 'Book LSS Consultation'}</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">{isAr ? 'تشخيص مجاني' : 'Free Diagnostic'}</Button></Link>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
              {isAr ? TABS_AR[i] : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">{isAr ? 'LSS متكامل لسلاسل الإمداد' : 'Integrated LSS for Supply Chains'}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{isAr ? 'يجمع Lean Six Sigma فلسفة إزالة الهدر في Lean مع صرامة تقليل التباين في Six Sigma. في سلاسل الإمداد يعني ذلك: مهل أسرع، وعيوب أقل، ومخزون أدنى، وأداء خدمة ثابت — مستدام عبر ثقافة التحسين المستمر.' : 'Lean Six Sigma combines the waste-elimination philosophy of Lean with the variation-reduction rigour of Six Sigma. In supply chains, this means: faster lead times, fewer defects, lower inventory, and consistent service performance — sustained through a culture of continuous improvement.'}</p>
                <p className="text-muted-foreground leading-relaxed">{isAr ? 'تنشر ISC منهجية LSS متكاملة مكيّفة خصيصاً لسلاسل الإمداد الخليجية — بمراعاة المتطلبات التنظيمية (SFDA، NCAR، GTPL) والديناميكيات الثقافية والتحديات الفريدة للعمل عبر السعودية والأردن والمنطقة الأوسع.' : 'ISC deploys an integrated LSS methodology specifically adapted to GCC supply chains — accounting for regulatory requirements (SFDA, NCAR, GTPL), cultural dynamics, and the unique challenges of operating across Saudi Arabia, Jordan, and the wider region.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ icon: Zap, label: 'Lean', labelAr: 'Lean', desc: 'Eliminate all 8 wastes. Create flow. Deliver value.', descAr: 'أزِل الأنواع الثمانية للهدر. أنشئ التدفّق. قدّم القيمة.', color: 'text-purple-600 bg-purple-50' },
                  { icon: Target, label: 'Six Sigma', labelAr: 'Six Sigma', desc: 'Reduce variation. Data-driven improvement. Sustained results.', descAr: 'قلّل التباين. تحسين مبني على البيانات. نتائج مستدامة.', color: 'text-blue-600 bg-blue-50' },
                  { icon: Award, label: 'Quality', labelAr: 'الجودة', desc: 'ISO 9001, TQM, and EFQM — excellence embedded in process.', descAr: 'ISO 9001 وTQM وEFQM — تميّز مضمّن في العملية.', color: 'text-emerald-600 bg-emerald-50' },
                  { icon: RefreshCw, label: 'Agile', labelAr: 'الرشاقة', desc: 'Sense demand. Respond fast. Absorb variability.', descAr: 'استشعر الطلب. استجب بسرعة. امتصّ التباين.', color: 'text-orange-600 bg-orange-50' },
                ].map(p => (
                  <div key={p.label} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color.split(' ')[1]}`}>
                      <p.icon className={`w-5 h-5 ${p.color.split(' ')[0]}`} />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{isAr ? p.labelAr : p.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? p.descAr : p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            {/* DMAIC roadmap visual */}
            <Reveal>
              <div className="bg-muted rounded-2xl p-6">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{isAr ? 'خارطة عملية DMAIC' : 'DMAIC Process Roadmap'}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {(isAr ? ['التعريف', 'القياس', 'التحليل', 'التحسين', 'الضبط'] : ['Define', 'Measure', 'Analyze', 'Improve', 'Control']).map((phase, i) => (
                    <div key={phase} className="flex-1 bg-white rounded-xl p-4 text-center border border-border relative">
                      <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
                      <p className="font-bold text-primary text-sm">{phase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal className="grid sm:grid-cols-3 gap-4">
              {[{ label: 'Avg Lead Time Reduction', labelAr: 'متوسط خفض مهلة التوريد', val: '35%' }, { label: 'Typical Sigma Improvement', labelAr: 'تحسّن سيجما النموذجي', val: '+1.4σ' }, { label: 'Average COPQ Reduction', labelAr: 'متوسط خفض تكلفة الجودة الرديئة', val: '55%' }].map(s => (
                <div key={s.label} className="bg-[#082C6B] rounded-2xl p-6 text-white text-center">
                  <p className="text-3xl font-extrabold text-[#C9A84C]">{s.val}</p>
                  <p className="text-white/70 text-sm mt-2">{isAr ? s.labelAr : s.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
        )}

        {/* TAB 1 — LEAN FRAMEWORK */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'مستويات إطار Lean' : 'Lean Framework Levels'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'من تصميم Lean على مستوى المؤسسة إلى أدوات التشغيل اليومية — تُنشر بالتسلسل لتحوّل مستدام.' : 'From enterprise lean design to day-to-day operational tools — deployed in sequence for sustainable transformation.'}</p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {[{
                level: 'L1 Strategic', levelAr: 'L1 استراتيجي', color: 'border-blue-500 bg-blue-50', tools: [
                  { name: 'Lean Enterprise Design', nameAr: 'تصميم مؤسسة Lean', desc: 'Zero-waste supply chain architecture', descAr: 'بنية سلسلة إمداد بلا هدر' },
                  { name: 'Theory of Constraints', nameAr: 'نظرية القيود', desc: 'Exploit the single system bottleneck', descAr: 'استغلال عنق الزجاجة الوحيد في النظام' },
                  { name: 'DDMRP', nameAr: 'DDMRP', desc: 'Demand-driven material requirements planning', descAr: 'تخطيط احتياجات المواد المبني على الطلب' },
                ]
              }, {
                level: 'L2 Tactical', levelAr: 'L2 تكتيكي', color: 'border-purple-500 bg-purple-50', tools: [
                  { name: 'Value Stream Mapping', nameAr: 'رسم خرائط تدفّق القيمة', desc: 'Current → future state flow design', descAr: 'تصميم تدفّق من الحالة الحالية إلى المستقبلية' },
                  { name: 'Pull System / Kanban', nameAr: 'نظام السحب / Kanban', desc: 'Signal-based replenishment', descAr: 'إعادة تموين مبنية على الإشارة' },
                  { name: 'Agile S&OP', nameAr: 'S&OP رشيق', desc: 'Short-cycle demand-supply alignment', descAr: 'مواءمة طلب-عرض قصيرة الدورة' },
                ]
              }, {
                level: 'L3 Operational', levelAr: 'L3 تشغيلي', color: 'border-emerald-500 bg-emerald-50', tools: [
                  { name: '5S / 6S', nameAr: '5S / 6S', desc: 'Organised, visual workplace', descAr: 'مكان عمل منظّم ومرئي' },
                  { name: 'Kaizen Events', nameAr: 'فعاليات Kaizen', desc: '3–5 day rapid improvement', descAr: 'تحسين سريع خلال 3–5 أيام' },
                  { name: 'Standard Work', nameAr: 'العمل المعياري', desc: 'Best method documented & followed', descAr: 'أفضل طريقة موثّقة ومتّبعة' },
                ]
              }].map((lv, li) => (
                <Reveal key={lv.level} delay={li * 0.07}>
                  <div className={`border-t-4 rounded-2xl p-6 bg-white shadow-sm h-full ${lv.color}`}>
                    <p className="font-bold text-primary text-lg mb-4">{isAr ? lv.levelAr : lv.level}</p>
                    <div className="space-y-4">
                      {lv.tools.map(t => (
                        <div key={t.name} className="border-l-2 border-primary/20 pl-3">
                          <p className="font-semibold text-primary text-sm">{isAr ? t.nameAr : t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{isAr ? t.descAr : t.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* 8 Wastes */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">{isAr ? 'الأنواع الثمانية للهدر (TIMWOODS) — أمثلة من سلسلة الإمداد' : 'The 8 Wastes (TIMWOODS) — Supply Chain Examples'}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LEAN_WASTES.map((w, i) => (
                  <button key={i} onClick={() => setOpenWaste(openWaste === i ? null : i)}
                    className="text-left bg-white border border-border rounded-2xl p-4 hover:border-purple-400 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-extrabold flex items-center justify-center">{w.letter}</span>
                      <p className="font-bold text-primary text-sm">{isAr ? w.nameAr : w.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{isAr ? w.descAr : w.desc}</p>
                    {openWaste === i && <p className="text-xs text-purple-700 mt-2 font-medium border-t border-border pt-2">{isAr ? 'مثال من سلسلة الإمداد: ' : 'SC Example: '}{isAr ? w.exampleAr : w.example}</p>}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Lean KPIs */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />{isAr ? 'مؤشرات Lean' : 'Lean KPIs'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Lead Time Reduction', nameAr: 'خفض مهلة التوريد', target: '>35%', benchmark: '18%' }, { name: 'Inventory Turns', nameAr: 'دوران المخزون', target: '>12/yr', targetAr: '>12/سنة', benchmark: '7.5/yr', benchmarkAr: '7.5/سنة' }, { name: 'OEE', nameAr: 'الفاعلية الكلية للمعدّات (OEE)', target: '>80%', benchmark: '68%' }, { name: 'Process Cycle Efficiency', nameAr: 'كفاءة دورة العملية', target: '>35%', benchmark: '22%' }, { name: 'WIP Reduction', nameAr: 'خفض العمل قيد التنفيذ', target: '>40%', benchmark: '15%' }, { name: 'First-Pass Yield', nameAr: 'ناتج المرور الأول', target: '>97%', benchmark: '91%' }].map(k => (
                    <div key={k.name} className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{isAr ? k.nameAr : k.name}</p>
                      <p className="text-xl font-extrabold text-[#C9A84C]">{isAr ? ((k as any).targetAr ?? k.target) : k.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? 'المعيار المرجعي: ' : 'Benchmark: '}{isAr ? ((k as any).benchmarkAr ?? k.benchmark) : k.benchmark}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 2 — SIX SIGMA (DMAIC) */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'Six Sigma — إطار DMAIC' : 'Six Sigma — DMAIC Framework'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'نهج منظّم مبني على البيانات لإزالة الأسباب الجذرية للعيوب والتباين في عمليات سلسلة الإمداد.' : 'Structured, data-driven approach to eliminating the root causes of defects and variation in supply chain processes.'}</p>
            </Reveal>
            <div className="space-y-4">
              {DMAIC_PHASES.map((phase, i) => (
                <Reveal key={phase.phase} delay={i * 0.05}>
                  <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button className="w-full text-left flex items-center gap-4 p-5 hover:bg-muted/50 transition-colors"
                      onClick={() => setOpenPhase(openPhase === i ? null : i)}>
                      <div className={`w-10 h-10 rounded-xl ${phase.color} text-white flex items-center justify-center font-extrabold shrink-0`}>{phase.phase[0]}</div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">{isAr ? phase.phaseAr : phase.phase}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? phase.deliverableAr : phase.deliverable}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${openPhase === i ? 'rotate-90' : ''}`} />
                    </button>
                    {openPhase === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                        <div className="p-5 grid md:grid-cols-2 gap-5">
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'الأدوات الرئيسية' : 'Key Tools'}</p>
                            <div className="flex flex-wrap gap-2">
                              {phase.tools.map(t => <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">{t}</span>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'مثال خليجي' : 'GCC Example'}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? phase.exampleAr : phase.example}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Sigma levels */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'أحزمة Six Sigma والنشر' : 'Six Sigma Belts & Deployment'}</h3>
                <div className="grid sm:grid-cols-5 gap-3">
                  {[{ belt: 'White', beltAr: 'الأبيض', color: 'bg-gray-100 text-gray-700', role: 'Awareness & participation in improvement events', roleAr: 'الوعي والمشاركة في فعاليات التحسين' }, { belt: 'Yellow', beltAr: 'الأصفر', color: 'bg-yellow-100 text-yellow-700', role: 'Apply basic LSS tools in daily work', roleAr: 'تطبيق أدوات LSS الأساسية في العمل اليومي' }, { belt: 'Green', beltAr: 'الأخضر', color: 'bg-green-100 text-green-700', role: 'Lead departmental improvement projects (part-time)', roleAr: 'قيادة مشاريع تحسين إدارية (بدوام جزئي)' }, { belt: 'Black', beltAr: 'الأسود', color: 'bg-gray-900 text-white', role: 'Full-time improvement leader; complex projects', roleAr: 'قائد تحسين بدوام كامل؛ مشاريع معقّدة' }, { belt: 'Master Black', beltAr: 'الأسود الماهر', color: 'bg-[#082C6B] text-white', role: 'Programme lead; coach black belts; strategic deployment', roleAr: 'قائد البرنامج؛ تدريب الأحزمة السوداء؛ النشر الاستراتيجي' }].map(b => (
                    <div key={b.belt} className={`rounded-xl p-4 text-center ${b.color}`}>
                      <p className="font-bold text-sm">{isAr ? `الحزام ${b.beltAr}` : `${b.belt} Belt`}</p>
                      <p className="text-xs mt-1 opacity-80">{isAr ? b.roleAr : b.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'مؤشرات Six Sigma' : 'Six Sigma KPIs'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Sigma Level', nameAr: 'مستوى سيجما', target: '>4.0σ', benchmark: '2.5–3.0σ' }, { name: 'DPMO (defects per million)', nameAr: 'DPMO (عيوب لكل مليون)', target: '<6,210', benchmark: '66,800' }, { name: 'Process Capability Cpk', nameAr: 'قدرة العملية Cpk', target: '>1.33', benchmark: '0.85' }, { name: 'Cost of Poor Quality (COPQ)', nameAr: 'تكلفة الجودة الرديئة (COPQ)', target: '<2% revenue', targetAr: 'أقل من 2% من الإيراد', benchmark: '5–8% revenue', benchmarkAr: '5–8% من الإيراد' }, { name: 'Defect Rate', nameAr: 'معدّل العيوب', target: '<0.5%', benchmark: '3.2%' }, { name: 'Rework/Correction Time', nameAr: 'زمن إعادة العمل/التصحيح', target: '<5% total', targetAr: 'أقل من 5% من الإجمالي', benchmark: '18%' }].map(k => (
                    <div key={k.name} className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{isAr ? k.nameAr : k.name}</p>
                      <p className="text-xl font-extrabold text-[#C9A84C]">{isAr ? ((k as any).targetAr ?? k.target) : k.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? 'المعيار المرجعي: ' : 'Benchmark: '}{isAr ? ((k as any).benchmarkAr ?? k.benchmark) : k.benchmark}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — QUALITY MANAGEMENT */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'إدارة الجودة من أجل التميّز' : 'Quality Management for Excellence'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'ISO 9001:2015 وTQM وEFQM — إدارة جودة مضمّنة في المشتريات وسلسلة الإمداد وإدارة المورّدين.' : 'ISO 9001:2015, TQM, and EFQM — quality management embedded in procurement, supply chain, and supplier management.'}</p>
            </Reveal>

            {/* QMS Implementation Phases */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">{isAr ? 'تطبيق نظام إدارة الجودة — 4 مراحل' : 'QMS Implementation — 4 Phases'}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ num: '01', title: 'Assessment', titleAr: 'التقييم', desc: 'Gap analysis vs ISO 9001:2015, baseline quality audit, management review', descAr: 'تحليل الفجوات مقابل ISO 9001:2015، وتدقيق جودة أساس، ومراجعة الإدارة', color: 'bg-blue-600' }, { num: '02', title: 'Design', titleAr: 'التصميم', desc: 'Quality policy, quality manual, process documentation, risk-based thinking framework', descAr: 'سياسة الجودة، ودليل الجودة، وتوثيق العمليات، وإطار التفكير المبني على المخاطر', color: 'bg-indigo-600' }, { num: '03', title: 'Implement', titleAr: 'التنفيذ', desc: 'Team training, document control, internal audits, corrective action process (CAR)', descAr: 'تدريب الفريق، وضبط الوثائق، والتدقيقات الداخلية، وعملية الإجراء التصحيحي (CAR)', color: 'bg-purple-600' }, { num: '04', title: 'Certify', titleAr: 'الاعتماد', desc: 'Pre-audit (stage 1), external certification audit (stage 2), non-conformance resolution', descAr: 'تدقيق مسبق (المرحلة 1)، وتدقيق اعتماد خارجي (المرحلة 2)، وحلّ حالات عدم المطابقة', color: 'bg-emerald-600' }].map(p => (
                  <div key={p.num} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl ${p.color} text-white flex items-center justify-center font-extrabold text-sm mb-3`}>{p.num}</div>
                    <p className="font-bold text-primary mb-2">{isAr ? p.titleAr : p.title}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? p.descAr : p.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* GCC Standards */}
            <Reveal>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-4 text-[#C9A84C]">{isAr ? 'مشهد معايير الجودة الخليجية' : 'GCC Quality Standards Landscape'}</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{ country: '🇸🇦 Saudi Arabia', countryAr: '🇸🇦 المملكة العربية السعودية', standards: ['SFDA — pharmaceutical, food & medical devices', 'NCAR — construction & engineering materials', 'SASO — general product standards', 'Saudi Quality Awards (King Khalid Quality Award)'], standardsAr: ['SFDA — الأدوية والأغذية والأجهزة الطبية', 'NCAR — مواد البناء والهندسة', 'SASO — معايير المنتجات العامة', 'جوائز الجودة السعودية (جائزة الملك خالد للجودة)'] }, { country: '🇯🇴 Jordan', countryAr: '🇯🇴 الأردن', standards: ['JISM (Jordan Institution for Standards & Metrology)', 'Jordan Food & Drug Administration (JFDA)', 'Jordan Engineering Association (JEA) standards'], standardsAr: ['JISM (المؤسسة الأردنية للمواصفات والمقاييس)', 'المؤسسة الأردنية للغذاء والدواء (JFDA)', 'معايير نقابة المهندسين الأردنيين (JEA)'] }, { country: '🌍 International', countryAr: '🌍 دولية', standards: ['ISO 9001:2015 Quality Management', 'ISO 14001:2015 Environmental', 'ISO 45001:2018 Health & Safety', 'IATF 16949 Automotive (manufacturing)'], standardsAr: ['ISO 9001:2015 إدارة الجودة', 'ISO 14001:2015 البيئة', 'ISO 45001:2018 الصحة والسلامة', 'IATF 16949 السيارات (التصنيع)'] }, { country: '🏥 Healthcare', countryAr: '🏥 الرعاية الصحية', standards: ['JCI Accreditation (US Joint Commission)', 'ASHP pharmaceutical standards', 'WHO Good Distribution Practice (GDP)', 'CBAHI (Saudi hospital accreditation)'], standardsAr: ['اعتماد JCI (اللجنة المشتركة الأمريكية)', 'معايير ASHP الدوائية', 'ممارسة التوزيع الجيّدة من WHO (GDP)', 'CBAHI (اعتماد المستشفيات السعودي)'] }].map(s => (
                    <div key={s.country} className="bg-white/10 rounded-xl p-4">
                      <p className="font-bold text-white mb-2">{isAr ? s.countryAr : s.country}</p>
                      <ul className="space-y-1">{(isAr ? s.standardsAr : s.standards).map(st => <li key={st} className="text-xs text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" />{st}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Quality tools */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'أدوات الجودة — تطبيقات سلسلة الإمداد' : 'Quality Tools — Supply Chain Applications'}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-2 font-bold text-primary pr-4">{isAr ? 'الأداة' : 'Tool'}</th><th className="text-left py-2 font-bold text-primary pr-4">{isAr ? 'متى تُستخدم' : 'When to Use'}</th><th className="text-left py-2 font-bold text-primary">{isAr ? 'تطبيق سلسلة الإمداد' : 'SC Application'}</th></tr></thead>
                    <tbody>
                      {QUALITY_TOOLS.map((t, i) => (
                        <tr key={t.name} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                          <td className="py-3 font-semibold text-primary pr-4 whitespace-nowrap">{t.name}</td>
                          <td className="py-3 text-muted-foreground pr-4 text-xs">{isAr ? t.useAr : t.use}</td>
                          <td className="py-3 text-muted-foreground text-xs">{isAr ? t.scAppAr : t.scApp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — AGILE & RESILIENCE */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'سلسلة الإمداد الرشيقة والمرونة' : <>Agile Supply Chain &amp; Resilience</>}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'ابنِ سلاسل إمداد تمتصّ تباين الطلب (الرشاقة) وتتعافى من الاضطرابات (المرونة) — مع الحفاظ على مكاسب الكفاءة من Lean.' : 'Build supply chains that absorb demand variability (Agile) and recover from disruptions (Resilience) — while maintaining efficiency gains from Lean.'}</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4"><RefreshCw className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-primary">{isAr ? 'إطار سلسلة الإمداد الرشيقة' : 'Agile Supply Chain Framework'}</h3></div>
                  <p className="text-sm text-muted-foreground mb-5">{isAr ? 'تستشعر سلاسل الإمداد الرشيقة إشارات الطلب وتستجيب بسرعة — مستبدلةً التوقّعات السنوية الجامدة بدورات تخطيط متجدّدة ومتكيّفة.' : 'Agile supply chains sense demand signals and respond fast — replacing rigid annual forecasts with rolling, adaptive planning cycles.'}</p>
                  <div className="space-y-4">
                    {[{ level: 'L1 Strategic', levelAr: 'L1 استراتيجي', desc: 'Scenario planning, adaptive strategy review quarterly, volatility-based portfolio segmentation', descAr: 'تخطيط السيناريوهات، ومراجعة استراتيجية متكيّفة ربع سنوياً، وتقسيم المحفظة على أساس التقلّب' }, { level: 'L2 Tactical', levelAr: 'L2 تكتيكي', desc: 'Rolling S&OP (monthly), flexible contracts with volume bands, postponement strategy for product differentiation', descAr: 'S&OP متجدّد (شهرياً)، وعقود مرنة بنطاقات كمية، واستراتيجية التأجيل لتمييز المنتجات' }, { level: 'L3 Operational', levelAr: 'L3 تشغيلي', desc: 'Weekly demand sensing, sprint-based procurement for fast-moving categories, Kanban with dynamic sizing', descAr: 'استشعار طلب أسبوعي، ومشتريات قائمة على السباقات للفئات سريعة الحركة، وKanban بحجم ديناميكي' }].map(l => (
                      <div key={l.level} className="border-l-2 border-orange-400 pl-4">
                        <p className="font-semibold text-primary text-sm">{isAr ? l.levelAr : l.level}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isAr ? l.descAr : l.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.07}>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-primary">{isAr ? 'إطار ISC للمرونة (4 ركائز)' : 'ISC Resilience Framework (4 Pillars)'}</h3></div>
                  <div className="space-y-4">
                    {[{ pillar: 'Visibility', pillarAr: 'الوضوح', color: 'bg-blue-50 border-blue-200', desc: 'End-to-end supply chain tracking, Tier-1/2 supplier mapping, risk radar, real-time transport visibility', descAr: 'تتبّع سلسلة الإمداد من طرف لطرف، ورسم موردي المستوى 1/2، ورادار المخاطر، ووضوح النقل اللحظي' }, { pillar: 'Flexibility', pillarAr: 'المرونة', color: 'bg-green-50 border-green-200', desc: 'Dual-source for critical categories, flexible volume contracts (+/-30% bands), modular product design', descAr: 'توريد ثنائي للفئات الحرجة، وعقود كمية مرنة (نطاقات ±30%)، وتصميم منتج معياري' }, { pillar: 'Collaboration', pillarAr: 'التعاون', color: 'bg-orange-50 border-orange-200', desc: 'Supplier information sharing, joint demand planning with key customers, crisis communication protocols', descAr: 'مشاركة معلومات المورّدين، وتخطيط طلب مشترك مع العملاء الرئيسيين، وبروتوكولات تواصل الأزمات' }, { pillar: 'Recovery', pillarAr: 'التعافي', color: 'bg-red-50 border-red-200', desc: 'BCP (ISO 22301), crisis playbooks by disruption type, rapid re-sourcing protocol, tested annually', descAr: 'خطة استمرارية (ISO 22301)، وأدلة أزمات حسب نوع الاضطراب، وبروتوكول إعادة توريد سريع، مُختبر سنوياً' }].map(p => (
                      <div key={p.pillar} className={`border rounded-xl p-4 ${p.color}`}>
                        <p className="font-bold text-primary text-sm">{isAr ? p.pillarAr : p.pillar}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isAr ? p.descAr : p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'مؤشرات المرونة' : 'Resilience KPIs'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Mean Time to Recovery (MTTR)', nameAr: 'متوسط زمن التعافي (MTTR)', target: '<72 hours', targetAr: 'أقل من 72 ساعة', benchmark: '5–10 days', benchmarkAr: '5–10 أيام' }, { name: 'Supply Risk Coverage', nameAr: 'تغطية مخاطر التوريد', target: '>85%', benchmark: '47%' }, { name: 'Dual-Source Coverage (critical)', nameAr: 'تغطية التوريد الثنائي (الحرجة)', target: '>65%', benchmark: '38%' }, { name: 'BCP Test Completion', nameAr: 'إتمام اختبار خطة الاستمرارية', target: 'Annual', targetAr: 'سنوي', benchmark: 'Ad hoc/none', benchmarkAr: 'عشوائي/لا شيء' }, { name: 'Disruption Cost % Revenue', nameAr: 'تكلفة الاضطراب كنسبة من الإيراد', target: '<0.5%', benchmark: '1.8%' }, { name: 'Alternate Source Activation', nameAr: 'تفعيل المصدر البديل', target: '<48 hours', targetAr: 'أقل من 48 ساعة', benchmark: '7–14 days', benchmarkAr: '7–14 يوماً' }].map(k => (
                    <div key={k.name} className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{isAr ? k.nameAr : k.name}</p>
                      <p className="text-xl font-extrabold text-[#C9A84C]">{isAr ? ((k as any).targetAr ?? k.target) : k.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? 'المعيار المرجعي: ' : 'Benchmark: '}{isAr ? ((k as any).benchmarkAr ?? k.benchmark) : k.benchmark}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 5 — INDUSTRY APPLICATIONS */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'LSS حسب القطاع' : 'LSS by Industry'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'أنواع هدر خاصة بكل قطاع، ومشاريع موصى بها، ومكاسب سريعة، وتحديات — من خبرة مَعِن الممتدة لأكثر من 20 عاماً عبر قطاعات الخليج.' : "Sector-specific waste types, recommended projects, quick wins, and challenges — from Ma'in's 20+ years across GCC industries."}</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {INDUSTRY_APPS.map((app, i) => (
                <Reveal key={app.industry} delay={i * 0.06}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{app.icon}</span>
                      <h3 className="font-bold text-primary text-lg">{isAr ? app.industryAr : app.industry}</h3>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{isAr ? 'أبرز أنواع الهدر' : 'Top Wastes'}</p>
                      <ul className="space-y-1">{(isAr ? app.wastesAr : app.wastes).map(w => <li key={w} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />{w}</li>)}</ul>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'مشروع موصى به' : 'Recommended Project'}</p>
                      <p className="font-semibold text-primary text-sm">{isAr ? app.project.titleAr : app.project.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{app.project.tool} · {isAr ? app.project.timelineAr : app.project.timeline} · <span className="text-emerald-700 font-bold">{isAr ? `توفير ${app.project.savingsAr}` : `${app.project.savings} savings`}</span></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{isAr ? 'مكاسب سريعة خلال 30 يوماً' : '30-Day Quick Wins'}</p>
                      <ul className="space-y-1">{(isAr ? app.quickWinsAr : app.quickWins).map(q => <li key={q} className="text-xs text-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{q}</li>)}</ul>
                    </div>
                    <div className="mt-auto border-t border-border pt-4">
                      <p className="text-xs font-bold text-orange-600 mb-1">{isAr ? 'التحدي الرئيسي' : 'Key Challenge'}</p>
                      <p className="text-xs text-muted-foreground mb-2">{isAr ? app.challengeAr : app.challenge}</p>
                      <p className="text-xs font-bold text-emerald-700">{isAr ? 'نهج ISC: ' : 'ISC Approach: '}<span className="font-normal text-muted-foreground">{isAr ? app.solutionAr : app.solution}</span></p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-gradient-to-r from-[#082C6B] to-purple-900 rounded-2xl p-8 text-white text-center">
              <Activity className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">{isAr ? 'جاهز لبدء رحلة LSS؟' : 'Ready to start your LSS journey?'}</h3>
              <p className="text-white/70 mb-5 text-sm max-w-xl mx-auto">{isAr ? 'تنشر ISC نظام Lean Six Sigma في السياق الخليجي — بمراعاة المتطلبات التنظيمية السعودية والديناميكيات الثقافية والواقع التشغيلي. احجز مكالمة تحديد نطاق لتعريف مشروعك الأول.' : 'ISC deploys Lean Six Sigma in the GCC context — accounting for Saudi regulatory requirements, cultural dynamics, and operational realities. Book a scoping call to define your first project.'}</p>
              <Link href="/governance-compliance"><span className="text-[#C9A84C] text-sm font-semibold underline cursor-pointer">{isAr ? 'يجب حوكمة LSS ← اطّلع على إطار الحوكمة لدينا' : 'LSS must be governed → See our Governance Framework'}</span></Link>
              <div className="mt-4 flex justify-center gap-3 flex-wrap">
                <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">{isAr ? 'احجز استشارة LSS' : 'Book LSS Consultation'}</Button></Link>
                <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">{isAr ? 'تشخيص مجاني' : 'Free Diagnostic'}</Button></Link>
              </div>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
