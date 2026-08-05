import React, { useState } from 'react';
import { motion  } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield, AlertTriangle, BarChart3, ClipboardList, FileText,
  CheckCircle, ChevronRight, Globe, Cpu, DollarSign,
  Scale, Users, Leaf, Globe2, Lock, TrendingDown,
  ArrowRight, Clock, Filter, Eye, Layers,
  ChevronLeft, Info,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { KPIDashboard } from '@/components/KPIDashboard';
import { RiskToolsSection } from '@/components/toolkit/RiskTools';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Overview', 'Risk Types', 'Heat Map', 'Risk Register', 'Your Risk Toolkit', 'Governance', 'KPI Dashboard'];
const TABS_AR = ['نظرة عامة', 'أنواع المخاطر', 'خريطة الحرارة', 'سجلّ المخاطر', 'أدواتك التفاعلية', 'الحوكمة', 'لوحة المؤشرات'];

const RISK_TYPES = [
  { icon: Globe, color: 'bg-red-50 text-red-600 border-red-200', badge: 'bg-red-100 text-red-700', name: 'Strategic Risk', nameAr: 'المخاطر الاستراتيجية', examples: ['Aramco localisation (Iktva) requirements tightening', 'Trade sanctions impacting import corridors', 'Competitor supply chain advantage'], examplesAr: ['تشديد متطلبات التوطين (Iktva) لدى أرامكو', 'عقوبات تجارية تؤثّر في ممرّات الاستيراد', 'تفوّق سلسلة إمداد المنافس'], signals: ['Regulatory announcements', 'Competitor supplier shifts', 'Customer requirement changes'], signalsAr: ['الإعلانات التنظيمية', 'تحوّلات مورّدي المنافسين', 'تغيّرات متطلبات العملاء'], response: 'Scenario planning, strategy review, supply chain redesign', responseAr: 'تخطيط السيناريوهات، ومراجعة الاستراتيجية، وإعادة تصميم سلسلة الإمداد' },
  { icon: AlertTriangle, color: 'bg-orange-50 text-orange-600 border-orange-200', badge: 'bg-orange-100 text-orange-700', name: 'Operational Risk', nameAr: 'المخاطر التشغيلية', examples: ['ERP migration failure causing data loss', 'Warehouse fire or flooding', 'Key equipment breakdown'], examplesAr: ['فشل ترحيل نظام ERP يؤدي إلى فقدان البيانات', 'حريق أو فيضان في المستودع', 'تعطّل معدّات رئيسية'], signals: ['System performance degradation', 'Maintenance backlog increase', 'Quality escape incidents'], signalsAr: ['تدهور أداء النظام', 'تزايد متأخرات الصيانة', 'حوادث تسرّب عيوب الجودة'], response: 'BCP, preventive maintenance, redundant systems, FMEA', responseAr: 'خطة استمرارية الأعمال، والصيانة الوقائية، والأنظمة الاحتياطية، وتحليل FMEA' },
  { icon: DollarSign, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', name: 'Financial Risk', nameAr: 'المخاطر المالية', examples: ['USD-denominated contracts with SAR fluctuation impact', 'Oil price spike on logistics costs', 'Tier-1 supplier insolvency'], examplesAr: ['عقود مقوّمة بالدولار متأثّرة بتقلّب الريال', 'ارتفاع أسعار النفط على تكاليف الخدمات اللوجستية', 'إعسار مورّد من المستوى الأول'], signals: ['Supplier payment delays', 'Commodity price index movement', 'Credit rating change'], signalsAr: ['تأخّر مدفوعات المورّدين', 'حركة مؤشر أسعار السلع', 'تغيّر التصنيف الائتماني'], response: 'Hedging, financial monitoring, dual-source, contractual protections', responseAr: 'التحوّط، والمراقبة المالية، والتوريد الثنائي، والحمايات التعاقدية' },
  { icon: Scale, color: 'bg-blue-50 text-blue-600 border-blue-200', badge: 'bg-blue-100 text-blue-700', name: 'Compliance & Regulatory Risk', nameAr: 'مخاطر الامتثال والتنظيم', examples: ['SFDA new pharmaceutical import requirements', 'GTPL tender compliance breach', 'EU CSDDD extraterritorial impact on GCC exporters'], examplesAr: ['متطلبات استيراد دوائية جديدة من هيئة الغذاء والدواء (SFDA)', 'مخالفة امتثال منافسة وفق نظام المنافسات (GTPL)', 'أثر توجيه EU CSDDD خارج الحدود على مصدّري الخليج'], signals: ['Regulatory gazette alerts', 'Supplier audit non-conformances', 'Legal/procurement team flags'], signalsAr: ['تنبيهات الجرائد الرسمية التنظيمية', 'حالات عدم مطابقة في تدقيق المورّدين', 'إشارات من الفريق القانوني/المشتريات'], response: 'Regulatory monitoring, compliance programme, internal audit, policy updates', responseAr: 'المراقبة التنظيمية، وبرنامج الامتثال، والتدقيق الداخلي، وتحديثات السياسات' },
  { icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200', badge: 'bg-purple-100 text-purple-700', name: 'Supplier & Concentration Risk', nameAr: 'مخاطر المورّدين والتركّز', examples: ['80%+ spend with a single vendor', 'Undisclosed Tier-2 in conflict zone', 'Sole-source critical API (pharma)'], examplesAr: ['أكثر من 80% من الإنفاق مع مورّد واحد', 'مورّد من المستوى الثاني غير مُفصح عنه في منطقة نزاع', 'مصدر وحيد لمادة فعّالة حرجة (أدوية)'], signals: ['Supplier financial health flags', 'Delivery performance deterioration', 'Capacity announcements'], signalsAr: ['إشارات الصحة المالية للمورّد', 'تدهور أداء التسليم', 'إعلانات الطاقة الإنتاجية'], response: 'Dual-source programme, supplier financial monitoring, tier-2 mapping', responseAr: 'برنامج التوريد الثنائي، ومراقبة الوضع المالي للمورّدين، ورسم خرائط المستوى الثاني' },
  { icon: Leaf, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', name: 'Reputational & ESG Risk', nameAr: 'مخاطر السمعة وESG', examples: ['Supplier linked to labour rights violation', 'Carbon disclosure inaccuracy (greenwashing)', 'Modern slavery in supply chain tier-2'], examplesAr: ['مورّد مرتبط بانتهاك لحقوق العمالة', 'عدم دقّة الإفصاح الكربوني (التمويه الأخضر)', 'العبودية الحديثة في المستوى الثاني لسلسلة الإمداد'], signals: ['Media / NGO reports on suppliers', 'ESG audit findings', 'Regulatory ESG disclosure requirements'], signalsAr: ['تقارير إعلامية أو من منظمات غير حكومية عن المورّدين', 'نتائج تدقيق ESG', 'متطلبات إفصاح ESG التنظيمية'], response: 'Supplier ESG audit, Code of Conduct, Scope 3 monitoring, incident response', responseAr: 'تدقيق ESG للمورّدين، ومدوّنة السلوك، ومراقبة النطاق 3، والاستجابة للحوادث' },
  { icon: Globe2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', name: 'Geopolitical & Macro Risk', nameAr: 'المخاطر الجيوسياسية والكلّية', examples: ['Red Sea shipping disruption (2024 Houthi attacks)', 'Yemen conflict impact on KSA logistics', 'Trade war tariffs on component imports'], examplesAr: ['اضطراب الشحن في البحر الأحمر (هجمات 2024)', 'أثر نزاع اليمن على الخدمات اللوجستية السعودية', 'رسوم الحرب التجارية على استيراد المكوّنات'], signals: ['Freight rate index spikes', 'Port congestion alerts', 'Political risk intelligence'], signalsAr: ['قفزات مؤشر أسعار الشحن', 'تنبيهات ازدحام الموانئ', 'معلومات المخاطر السياسية'], response: 'Alternative routing, inventory buffer increase, geopolitical risk monitoring', responseAr: 'المسارات البديلة، وزيادة المخزون الاحتياطي، ومراقبة المخاطر الجيوسياسية' },
  { icon: Lock, color: 'bg-gray-50 text-gray-600 border-gray-200', badge: 'bg-gray-100 text-gray-700', name: 'Cyber & Digital Risk', nameAr: 'المخاطر السيبرانية والرقمية', examples: ['SAP system ransomware attack', 'Supplier portal data breach', 'Inventory data theft via ERP vulnerability'], examplesAr: ['هجوم فدية على نظام SAP', 'اختراق بيانات بوابة المورّدين', 'سرقة بيانات المخزون عبر ثغرة في ERP'], signals: ['Security scan alerts', 'Supplier system change notifications', 'Anomalous access patterns'], signalsAr: ['تنبيهات الفحص الأمني', 'إشعارات تغيير أنظمة المورّدين', 'أنماط وصول غير اعتيادية'], response: 'Cyber policy, ERP access controls, supplier cybersecurity assessment, incident response plan', responseAr: 'السياسة السيبرانية، وضوابط الوصول لنظام ERP، وتقييم الأمن السيبراني للمورّدين، وخطة الاستجابة للحوادث' },
];

// 5x5 heat map grid — risk items positioned by [likelihood (1-5), impact (1-5)]
const HEAT_MAP_RISKS = [
  { id: 'R1', name: 'Supplier insolvency (Tier-1)', nameAr: 'إعسار مورّد (المستوى الأول)', l: 3, i: 5 },
  { id: 'R2', name: 'FX/Commodity price spike', nameAr: 'قفزة أسعار العملات/السلع', l: 4, i: 3 },
  { id: 'R3', name: 'Red Sea logistics disruption', nameAr: 'اضطراب لوجستي في البحر الأحمر', l: 3, i: 4 },
  { id: 'R4', name: 'Regulatory change (SFDA/NCAR)', nameAr: 'تغيّر تنظيمي (SFDA/NCAR)', l: 3, i: 3 },
  { id: 'R5', name: 'ERP system failure', nameAr: 'فشل نظام ERP', l: 2, i: 4 },
  { id: 'R6', name: 'Single-source supplier', nameAr: 'مورّد أحادي المصدر', l: 3, i: 5 },
  { id: 'R7', name: 'Demand forecast error >25%', nameAr: 'خطأ توقّع الطلب أكثر من 25%', l: 4, i: 2 },
  { id: 'R8', name: 'Quality recall', nameAr: 'سحب بسبب الجودة', l: 2, i: 5 },
  { id: 'R9', name: 'Cyber attack on procurement', nameAr: 'هجوم سيبراني على المشتريات', l: 2, i: 4 },
  { id: 'R10', name: 'ESG compliance failure', nameAr: 'فشل الامتثال لـ ESG', l: 3, i: 3 },
  { id: 'R11', name: 'Key talent departure', nameAr: 'مغادرة كفاءة رئيسية', l: 3, i: 2 },
  { id: 'R12', name: 'Port/natural disaster', nameAr: 'كارثة طبيعية/بالميناء', l: 2, i: 3 },
];

function cellColor(score: number) {
  if (score >= 15) return 'bg-red-500 text-white';
  if (score >= 10) return 'bg-orange-400 text-white';
  if (score >= 5) return 'bg-yellow-400 text-gray-900';
  return 'bg-green-400 text-white';
}

const REGISTER = [
  { ref: 'RSK-001', cat: 'Supplier Concentration', catAr: 'تركّز المورّدين', desc: '70%+ spend with single vendor; no qualified alternate', descAr: 'أكثر من 70% من الإنفاق مع مورّد واحد؛ لا بديل مؤهّل', l: 4, i: 5, score: 20, owner: 'CPO', ownerAr: 'رئيس المشتريات', control: 'Dual-source qualification programme; vendor spend cap policy', controlAr: 'برنامج تأهيل توريد ثنائي؛ سياسة سقف إنفاق للمورّد', residual: 'MEDIUM (8)', residualAr: 'متوسط (8)', status: 'CRITICAL' },
  { ref: 'RSK-002', cat: 'Geopolitical', catAr: 'جيوسياسي', desc: 'Red Sea shipping disruption — extended re-routing adds 18+ days', descAr: 'اضطراب شحن البحر الأحمر — إعادة التوجيه تضيف أكثر من 18 يوماً', l: 3, i: 4, score: 12, owner: 'Logistics Mgr', ownerAr: 'مدير الخدمات اللوجستية', control: 'Alternative routing pre-approved; inventory buffer +30 days for sea-dependent items', controlAr: 'مسارات بديلة معتمدة مسبقاً؛ مخزون احتياطي +30 يوماً للأصناف المعتمدة على البحر', residual: 'MEDIUM (6)', residualAr: 'متوسط (6)', status: 'HIGH' },
  { ref: 'RSK-003', cat: 'Compliance', catAr: 'الامتثال', desc: 'SFDA / Vision 2030 regulatory change impacting product classification', descAr: 'تغيّر تنظيمي من SFDA / رؤية 2030 يؤثّر في تصنيف المنتج', l: 3, i: 3, score: 9, owner: 'Compliance', ownerAr: 'الامتثال', control: 'Regulatory monitoring subscription; 90-day impact assessment protocol', controlAr: 'اشتراك مراقبة تنظيمية؛ بروتوكول تقييم أثر خلال 90 يوماً', residual: 'LOW (4)', residualAr: 'منخفض (4)', status: 'MEDIUM' },
  { ref: 'RSK-004', cat: 'Financial', catAr: 'مالي', desc: 'FX exposure — USD-denominated contracts vs SAR operational budget', descAr: 'انكشاف صرف العملات — عقود بالدولار مقابل موازنة تشغيلية بالريال', l: 4, i: 3, score: 12, owner: 'CFO', ownerAr: 'المدير المالي', control: 'FX hedging on >SAR 500K contracts; contractual USD/SAR floor provision', controlAr: 'تحوّط للعملات على العقود التي تتجاوز 500 ألف ريال؛ بند حدّ أدنى تعاقدي للدولار/الريال', residual: 'MEDIUM (6)', residualAr: 'متوسط (6)', status: 'HIGH' },
  { ref: 'RSK-005', cat: 'Operational', catAr: 'تشغيلي', desc: 'ERP migration — data loss or integration failure during cutover', descAr: 'ترحيل ERP — فقدان بيانات أو فشل تكامل أثناء التحوّل', l: 2, i: 5, score: 10, owner: 'IT Director', ownerAr: 'مدير تقنية المعلومات', control: 'Parallel run 4 weeks pre-cutover; full data backup; rollback plan', controlAr: 'تشغيل متوازٍ لأربعة أسابيع قبل التحوّل؛ نسخ احتياطي كامل؛ خطة تراجع', residual: 'MEDIUM (6)', residualAr: 'متوسط (6)', status: 'HIGH' },
  { ref: 'RSK-006', cat: 'Supply Concentration', catAr: 'تركّز التوريد', desc: 'Sole-source critical component — no alternate qualified or stocked', descAr: 'مكوّن حرج أحادي المصدر — لا بديل مؤهّل أو مخزّن', l: 4, i: 5, score: 20, owner: 'Category Mgr', ownerAr: 'مدير الفئة', control: 'Emergency qualification of 2nd source; 90-day safety stock for critical items', controlAr: 'تأهيل طارئ لمصدر ثانٍ؛ مخزون أمان 90 يوماً للأصناف الحرجة', residual: 'HIGH (12)', residualAr: 'مرتفع (12)', status: 'CRITICAL' },
  { ref: 'RSK-007', cat: 'Demand', catAr: 'الطلب', desc: 'Forecast accuracy <75% — overstock and stockout co-exist', descAr: 'دقّة التوقّع أقل من 75% — تكدّس ونفاد مخزون معاً', l: 4, i: 3, score: 12, owner: 'Demand Planner', ownerAr: 'مخطّط الطلب', control: 'Demand sensing implementation; DDMRP buffer methodology; weekly demand review', controlAr: 'تطبيق استشعار الطلب؛ منهجية مخزون DDMRP؛ مراجعة طلب أسبوعية', residual: 'LOW (4)', residualAr: 'منخفض (4)', status: 'HIGH' },
  { ref: 'RSK-008', cat: 'ESG / Reputational', catAr: 'ESG / السمعة', desc: 'Supplier linked to labour violation or environmental breach', descAr: 'مورّد مرتبط بمخالفة عمالية أو انتهاك بيئي', l: 3, i: 4, score: 12, owner: 'CPO', ownerAr: 'رئيس المشتريات', control: 'Annual ESG supplier audit; Supplier Code of Conduct with termination clause', controlAr: 'تدقيق ESG سنوي للمورّدين؛ مدوّنة سلوك للمورّد مع بند إنهاء', residual: 'MEDIUM (6)', residualAr: 'متوسط (6)', status: 'HIGH' },
  { ref: 'RSK-009', cat: 'Operational', catAr: 'تشغيلي', desc: 'Warehouse or port infrastructure failure — earthquake, fire, flood', descAr: 'فشل بنية المستودع أو الميناء — زلزال، حريق، فيضان', l: 2, i: 4, score: 8, owner: 'Operations Mgr', ownerAr: 'مدير العمليات', control: 'BCP with alternate storage; facility insurance; emergency supplier restocking protocol', controlAr: 'خطة استمرارية مع تخزين بديل؛ تأمين المنشأة؛ بروتوكول إعادة تموين طارئ من المورّدين', residual: 'LOW (4)', residualAr: 'منخفض (4)', status: 'MEDIUM' },
  { ref: 'RSK-010', cat: 'People', catAr: 'الموارد البشرية', desc: 'Key procurement talent departure — critical category knowledge lost', descAr: 'مغادرة كفاءة مشتريات رئيسية — فقدان معرفة فئة حرجة', l: 3, i: 3, score: 9, owner: 'CHRO', ownerAr: 'رئيس الموارد البشرية', control: 'Knowledge management programme; succession plans for all critical roles; retention strategy', controlAr: 'برنامج إدارة المعرفة؛ خطط إحلال لجميع الأدوار الحرجة؛ استراتيجية استبقاء', residual: 'LOW (3)', residualAr: 'منخفض (3)', status: 'MEDIUM' },
];

const STATUS_AR: Record<string, string> = { ALL: 'الكل', CRITICAL: 'حرج', HIGH: 'مرتفع', MEDIUM: 'متوسط', LOW: 'منخفض' };

function statusColor(s: string) {
  if (s === 'CRITICAL') return 'bg-red-100 text-red-700 border border-red-200';
  if (s === 'HIGH') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (s === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

export function RiskManagement() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState(0);
  const [openRiskType, setOpenRiskType] = useState<number | null>(0);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [registerFilter, setRegisterFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  const filteredRegister = registerFilter === 'ALL' ? REGISTER : REGISTER.filter(r => r.status === registerFilter);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#082C6B] via-red-900 to-[#082C6B] py-14 px-4">
        <div className="absolute inset-0 opacity-8" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(220,38,38,0.3) 0%, transparent 50%)' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">{isAr ? 'إدارة المخاطر' : 'Risk Management'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{isAr ? 'إدارة مخاطر سلسلة الإمداد' : 'Supply Chain Risk Management'}</h1>
          <p className="text-white/75 text-lg max-w-2xl">{isAr ? 'تحديد وتقييم وتخفيف استباقي لمخاطر سلسلة الإمداد بما يتوافق مع ISO 31000 — لحماية الإيرادات والعمليات والسمعة عبر الخليج.' : 'Proactive, ISO 31000-aligned identification, assessment, and mitigation of supply chain risks — protecting revenue, operations, and reputation across the GCC.'}</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">{isAr ? 'استشارة تقييم المخاطر' : 'Risk Assessment Consultation'}</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">{isAr ? 'تشخيص مجاني' : 'Free Diagnostic'}</Button></Link>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-red-600 text-red-600' : 'border-transparent text-muted-foreground hover:text-red-600 hover:border-red-300'}`}>
              {isAr ? TABS_AR[i] : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">{isAr ? 'فلسفة ISC في إدارة المخاطر' : 'ISC Risk Management Philosophy'}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{isAr ? 'تُطبّق ISC أُطر مخاطر ISO 31000:2018 وAPICS SCOR لبناء برامج إدارة مخاطر منهجية ومحكومة على مستوى المجلس — لنقل المنشآت من إدارة الأزمات الرَّدّية إلى ذكاء المخاطر الاستباقي.' : 'ISC applies ISO 31000:2018 and APICS SCOR risk frameworks to build systematic, board-governed risk management programmes — moving organisations from reactive crisis management to proactive risk intelligence.'}</p>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {[{ val: '6–8%', label: 'Avg disruption cost as % revenue', labelAr: 'متوسط تكلفة الاضطراب كنسبة من الإيراد' }, { val: '74%', label: 'Companies with major disruption in 5 years', labelAr: 'شركات واجهت اضطراباً كبيراً خلال 5 سنوات' }, { val: '72h', label: 'Target recovery time (ISC BCP standard)', labelAr: 'زمن التعافي المستهدف (معيار ISC للاستمرارية)' }, { val: '10×', label: 'Cost of response vs cost of prevention', labelAr: 'تكلفة الاستجابة مقابل تكلفة الوقاية' }].map(s => (
                    <div key={s.label} className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-red-600">{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? s.labelAr : s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-3">{isAr ? '5 مبادئ — ISO 31000' : '5 Principles — ISO 31000'}</p>
                <ol className="space-y-3">
                  {(isAr
                    ? ['متكاملة — إدارة المخاطر مضمّنة في كل العمليات، لا وظيفة منفصلة', 'مُنظّمة — إطار متّسق يتيح نتائج قابلة للمقارنة وموثوقة', 'مُخصّصة — متوائمة مع السياق وأهداف المنشأة وقابلية تحمّل المخاطر', 'شاملة — إشراك أصحاب المصلحة والأخذ بمعرفتهم ووجهات نظرهم', 'ديناميكية — تستبق التغيير وتستجيب له مع تحسّن مستمر']
                    : ['Integrated — risk management embedded in all processes, not a separate function', 'Structured — consistent framework enabling comparable and reliable results', 'Customised — aligned to context, organisation objectives, and risk appetite', 'Inclusive — stakeholders engaged; their knowledge and perspectives considered', 'Dynamic — anticipates and responds to change; continuously improving']
                  ).map((p, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'أدوات ISC لإدارة المخاطر' : 'ISC Risk Management Toolkit'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ icon: BarChart3, label: 'Risk Heat Map', labelAr: 'خريطة حرارة المخاطر', desc: '5×5 likelihood × impact matrix with real-time risk positioning', descAr: 'مصفوفة 5×5 للاحتمالية × الأثر مع تموضع لحظي للمخاطر' }, { icon: ClipboardList, label: 'Risk Register', labelAr: 'سجلّ المخاطر', desc: 'Structured register with owner, control, residual risk, and status tracking', descAr: 'سجلّ منظّم مع المالك والضابط والمخاطر المتبقية وتتبّع الحالة' }, { icon: Shield, label: 'BCP / ISO 22301', labelAr: 'استمرارية الأعمال / ISO 22301', desc: 'Business continuity plan covering supply chain recovery scenarios', descAr: 'خطة استمرارية أعمال تغطّي سيناريوهات تعافي سلسلة الإمداد' }, { icon: Eye, label: 'Supplier Risk Score', labelAr: 'درجة مخاطر المورّد', desc: 'Financial, operational, geographic, ESG scoring for all strategic vendors', descAr: 'تقييم مالي وتشغيلي وجغرافي وESG لجميع المورّدين الاستراتيجيين' }].map(t => (
                    <div key={t.label} className="bg-muted rounded-xl p-5 flex flex-col gap-3">
                      <t.icon className="w-6 h-6 text-primary" />
                      <div><p className="font-bold text-primary text-sm">{isAr ? t.labelAr : t.label}</p><p className="text-xs text-muted-foreground mt-1">{isAr ? t.descAr : t.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 1 — RISK TYPES */}
        {activeTab === 1 && (
          <div className="space-y-5">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? '8 فئات لمخاطر سلسلة الإمداد' : '8 Supply Chain Risk Categories'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'يندرج كل خطر في سلسلة الإمداد ضمن إحدى هذه الفئات — ولكلٍّ منها إشارات إنذار مبكر واستراتيجيات استجابة مميّزة.' : 'Every supply chain risk falls into one of these categories — each with distinct early warning signals and response strategies.'}</p>
            </Reveal>
            <div className="space-y-3">
              {RISK_TYPES.map((rt, i) => (
                <Reveal key={rt.name} delay={i * 0.04}>
                  <div className={`border rounded-2xl overflow-hidden bg-white shadow-sm ${rt.color.split(' ')[2]}`}>
                    <button className="w-full text-left flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                      onClick={() => setOpenRiskType(openRiskType === i ? null : i)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rt.color.split(' ')[0]} border ${rt.color.split(' ')[2]}`}>
                        <rt.icon className={`w-5 h-5 ${rt.color.split(' ')[1]}`} />
                      </div>
                      <p className="font-bold text-primary flex-1">{isAr ? rt.nameAr : rt.name}</p>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${openRiskType === i ? 'rotate-90' : 'rtl:rotate-180'}`} />
                    </button>
                    {openRiskType === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                        <div className="p-5 grid md:grid-cols-3 gap-5">
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'أمثلة خليجية' : 'GCC Examples'}</p>
                            <ul className="space-y-1">{(isAr ? rt.examplesAr : rt.examples).map(e => <li key={e} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />{e}</li>)}</ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'إشارات الإنذار المبكر' : 'Early Warning Signals'}</p>
                            <ul className="space-y-1">{(isAr ? rt.signalsAr : rt.signals).map(s => <li key={s} className="text-xs text-muted-foreground flex items-start gap-2"><Eye className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />{s}</li>)}</ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{isAr ? 'استراتيجية الاستجابة' : 'Response Strategy'}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? rt.responseAr : rt.response}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2 — HEAT MAP */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'خريطة حرارة المخاطر' : 'Risk Heat Map'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'مصفوفة 5×5 ترسم الاحتمالية مقابل الأثر. مرّر المؤشّر فوق أي خلية لرؤية المخاطر الموضوعة فيها.' : '5×5 matrix plotting likelihood against impact. Hover any cell to see the risks positioned there.'}</p>
            </Reveal>
            <Reveal>
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {isAr
                      ? 'هذا مثال توضيحي بمخاطر نموذجية لشرح المنهجية. لبناء خريطة حرارة حيّة من بياناتك الخاصة — مع سجلّ مخاطر قابل للتحرير وموجز تخفيف بالذكاء الاصطناعي:'
                      : "This is a worked example with illustrative risks, shown to explain the methodology. To build a live heat map from your own data — with an editable risk register and an AI-generated mitigation brief:"}
                  </p>
                  <button onClick={() => setActiveTab(4)} className="mt-2 text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? 'افتح أدواتك التفاعلية' : 'Open Your Risk Toolkit'} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
                <div className="min-w-[460px]">
                  {/* Y-axis label */}
                  <div className="flex gap-1 items-end mb-1">
                    <div className="w-20 shrink-0" />
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex-1 text-center text-xs text-muted-foreground font-medium">{isAr ? `أثر ${i}` : `Impact ${i}`}</div>)}
                    </div>
                  </div>
                  <div className="flex flex-col-reverse gap-1">
                    {[1, 2, 3, 4, 5].map(likelihood => (
                      <div key={likelihood} className="flex gap-1 items-center">
                        <div className="w-20 shrink-0 text-xs text-muted-foreground font-medium text-right pr-2">L={likelihood}</div>
                        {[1, 2, 3, 4, 5].map(impact => {
                          const score = likelihood * impact;
                          const risksHere = HEAT_MAP_RISKS.filter(r => r.l === likelihood && r.i === impact);
                          const cellId = `${likelihood}-${impact}`;
                          return (
                            <div key={impact} className={`flex-1 h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative ${cellColor(score)} ${hoveredCell === cellId ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                              onMouseEnter={() => setHoveredCell(cellId)} onMouseLeave={() => setHoveredCell(null)}>
                              <span className="text-xs font-extrabold">{score}</span>
                              {risksHere.length > 0 && <div className="flex gap-0.5 mt-0.5">{risksHere.map(r => <span key={r.id} className="w-1.5 h-1.5 rounded-full bg-white/70" />)}</div>}
                              {hoveredCell === cellId && risksHere.length > 0 && (
                                <div className="absolute bottom-full mb-1 left-0 bg-white border border-border rounded-xl p-2 shadow-lg z-20 w-48">
                                  {risksHere.map(r => <p key={r.id} className="text-xs text-foreground font-medium">{r.id}: {isAr ? r.nameAr : r.name}</p>)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <p className="text-xs font-bold text-muted-foreground">{isAr ? 'المفتاح:' : 'Legend:'}</p>
                    {[{ color: 'bg-green-400', label: 'Low (1–4)', labelAr: 'منخفض (1–4)' }, { color: 'bg-yellow-400', label: 'Medium (5–9)', labelAr: 'متوسط (5–9)' }, { color: 'bg-orange-400', label: 'High (10–14)', labelAr: 'مرتفع (10–14)' }, { color: 'bg-red-500', label: 'Critical (15–25)', labelAr: 'حرج (15–25)' }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${l.color}`} /><span className="text-xs text-muted-foreground">{isAr ? l.labelAr : l.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-muted rounded-2xl p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{isAr ? 'معادلة درجة المخاطرة' : 'Risk Score Formula'}</p>
                <p className="text-sm text-foreground font-mono bg-white rounded-lg px-4 py-3 inline-block border border-border">{isAr ? 'درجة المخاطرة = الاحتمالية (1–5) × الأثر (1–5) = 1–25' : 'Risk Score = Likelihood (1–5) × Impact (1–5) = 1–25'}</p>
                <p className="text-xs text-muted-foreground mt-3">{isAr ? 'يحدّد المجلس حدود قابلية تحمّل المخاطر. الإعداد الافتراضي لـ ISC: حرج ≥15 = تخفيف فوري مطلوب؛ مرتفع 10–14 = خطة تخفيف خلال 30 يوماً؛ متوسط 5–9 = مراجعة ربع سنوية؛ منخفض 1–4 = مراقبة سنوية.' : 'Risk appetite thresholds are defined by the board. ISC default: Critical ≥15 = immediate mitigation required; High 10–14 = mitigation plan within 30 days; Medium 5–9 = quarterly review; Low 1–4 = monitor annually.'}</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="grid sm:grid-cols-2 gap-4">
                {HEAT_MAP_RISKS.slice(0, 6).map(r => {
                  const score = r.l * r.i;
                  return (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${cellColor(score)}`}>{score}</div>
                      <div><p className="font-semibold text-primary text-sm">{r.id}: {isAr ? r.nameAr : r.name}</p><p className="text-xs text-muted-foreground">{isAr ? `احتمالية=${r.l} × أثر=${r.i} = درجة ${score}` : `L=${r.l} × I=${r.i} = Score ${score}`}</p></div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — RISK REGISTER */}
        {activeTab === 3 && (
          <div className="space-y-5">
            <Reveal>
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {isAr
                      ? 'السجلّ أدناه مثال توضيحي ثابت. لإنشاء سجلّ حيّ ببياناتك الخاصة، قابل للإضافة والتحرير، مع درجات تُحسَب تلقائياً وموجز تخفيف بالذكاء الاصطناعي:'
                      : "The register below is a static worked example. To create a live register with your own data — add and edit rows, auto-calculated scores, and an AI-generated mitigation brief:"}
                  </p>
                  <button onClick={() => setActiveTab(4)} className="mt-2 text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                    {isAr ? 'افتح أدواتك التفاعلية' : 'Open Your Risk Toolkit'} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </Reveal>
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{isAr ? 'سجلّ المخاطر' : 'Risk Register'}</h2>
                <p className="text-muted-foreground mt-1">{isAr ? 'سجلّ منظّم مع مالكي المخاطر وتدابير الضبط وتتبّع المخاطر المتبقية.' : 'Structured register with risk owners, control measures, and residual risk tracking.'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground self-center" />
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(f => (
                  <button key={f} onClick={() => setRegisterFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${registerFilter === f ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
                    {isAr ? STATUS_AR[f] : f}
                  </button>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>{(isAr ? ['المرجع', 'الفئة', 'وصف المخاطرة', 'احتمالية', 'أثر', 'درجة', 'المالك', 'تدابير الضبط', 'المتبقية', 'الحالة'] : ['Ref', 'Category', 'Risk Description', 'L', 'I', 'Score', 'Owner', 'Control Measures', 'Residual', 'Status']).map(h => <th key={h} className="text-left py-3 px-3 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRegister.map((r, i) => (
                        <tr key={r.ref} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                          <td className="py-3 px-3 font-mono text-xs font-bold text-primary whitespace-nowrap">{r.ref}</td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap">{isAr ? r.catAr : r.cat}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-[180px]">{isAr ? r.descAr : r.desc}</td>
                          <td className="py-3 px-3 text-center font-bold">{r.l}</td>
                          <td className="py-3 px-3 text-center font-bold">{r.i}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${cellColor(r.score)}`}>{r.score}</span>
                          </td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap">{isAr ? r.ownerAr : r.owner}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-[200px]">{isAr ? r.controlAr : r.control}</td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap text-muted-foreground">{isAr ? r.residualAr : r.residual}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(r.status)}`}>{isAr ? STATUS_AR[r.status] : r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
            <Reveal className="bg-muted rounded-2xl p-5">
              <p className="text-xs font-bold text-primary mb-2">{isAr ? 'حوكمة السجلّ' : 'Register Governance'}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'يجب مراجعة سجلّات المخاطر ربع سنوياً من قِبل لجنة إدارة المخاطر، مع مراجعة المخاطر الحرجة شهرياً. ويجب أن يكون لكل خطر مالك مسمّى يرفع تقرير الحالة في المراجعة الإدارية. وتوفّر ISC قالب السجلّ وعملية الحوكمة وتيسير المراجعة الأولى كجزء من كل ارتباط لإدارة المخاطر.' : 'Risk registers must be reviewed quarterly by the Risk Management Committee, with Critical risks reviewed monthly. Each risk must have a named owner who reports status at the management review. ISC provides the register template, governance process, and facilitated first review as part of every risk engagement.'}</p>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — MITIGATION PLANS */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'خطط تخفيف المخاطر' : 'Risk Mitigation Plans'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? '4 استراتيجيات استجابة — تُطبَّق بناءً على قابلية تحمّل المخاطر وتكلفة التخفيف وقدرة المنشأة.' : '4 response strategies — applied based on risk appetite, cost of mitigation, and organisational capability.'}</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{ strategy: 'AVOID', strategyAr: 'التجنّب', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: TrendingDown, desc: 'Eliminate the risk entirely by not proceeding with the activity. Highest cost mitigation — only appropriate when risk score is unacceptable and no other approach reduces it below appetite.', descAr: 'إزالة الخطر كلياً بعدم المضي في النشاط. أعلى تكاليف التخفيف — مناسب فقط عندما تكون درجة المخاطرة غير مقبولة ولا يخفّضها أي نهج آخر دون حدّ القبول.', when: 'Risk score ≥20 with no viable mitigation; regulatory prohibition; reputational catastrophe', whenAr: 'درجة مخاطرة ≥20 دون تخفيف ممكن؛ حظر تنظيمي؛ كارثة سمعة', example: 'Do not source from a sanctioned country. Do not proceed with a sole-source contract for a critical item without a qualified alternate.', exampleAr: 'عدم التوريد من دولة خاضعة لعقوبات. عدم المضي في عقد أحادي المصدر لصنف حرج دون بديل مؤهّل.' },
                { strategy: 'TRANSFER', strategyAr: 'النقل', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: ArrowRight, desc: 'Shift the financial or operational consequence to a third party through insurance, contractual penalty/SLA, hedging, or third-party risk programmes.', descAr: 'نقل التبعة المالية أو التشغيلية إلى طرف ثالث عبر التأمين أو الغرامات التعاقدية/اتفاقية مستوى الخدمة أو التحوّط أو برامج مخاطر الأطراف الثالثة.', when: 'Financial risks, supplier performance risk, logistics risk — where third party can absorb impact better', whenAr: 'المخاطر المالية ومخاطر أداء المورّدين والمخاطر اللوجستية — حيث يستطيع طرف ثالث امتصاص الأثر بشكل أفضل', example: 'Cargo insurance on high-value shipments; FX hedging contract; SLA penalties on supplier for late delivery; third-party logistics performance bond.', exampleAr: 'تأمين شحنات عالية القيمة؛ عقد تحوّط للعملات؛ غرامات اتفاقية مستوى الخدمة على المورّد للتأخير؛ ضمان أداء لوجستي من طرف ثالث.' },
                { strategy: 'MITIGATE', strategyAr: 'التخفيف', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: Shield, desc: 'Reduce the likelihood of the risk occurring OR reduce the impact if it does occur. Most common and most valuable risk response. Requires investment in controls, processes, or capabilities.', descAr: 'تقليل احتمالية وقوع الخطر أو تقليل أثره إن وقع. أكثر استجابات المخاطر شيوعاً وقيمةً. ويتطلّب استثماراً في الضوابط أو العمليات أو القدرات.', when: 'Most supply chain operational and supplier risks — where the risk cannot be avoided but can be managed', whenAr: 'معظم مخاطر العمليات والمورّدين في سلسلة الإمداد — حيث لا يمكن تجنّب الخطر لكن يمكن إدارته', example: 'Dual-source programme reduces impact of supplier failure. BCP + safety stock reduces recovery time. FMEA + process controls reduce defect rate.', exampleAr: 'برنامج التوريد الثنائي يقلّل أثر فشل المورّد. خطة الاستمرارية + مخزون الأمان يقلّلان زمن التعافي. تحليل FMEA + ضوابط العمليات يقلّلان معدّل العيوب.' },
                { strategy: 'ACCEPT', strategyAr: 'القبول', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', icon: CheckCircle, desc: 'Acknowledge the risk and decide not to act further — either because it is within appetite, the cost of mitigation exceeds the expected loss, or it cannot be controlled.', descAr: 'الإقرار بالخطر وقرار عدم اتخاذ إجراء إضافي — إما لأنه ضمن حدّ القبول، أو لأن تكلفة التخفيف تتجاوز الخسارة المتوقّعة، أو لأنه غير قابل للضبط.', when: 'Low-score risks (1–4); risks where mitigation cost > risk impact; inherent business risks', whenAr: 'مخاطر منخفضة الدرجة (1–4)؛ مخاطر تكلفة تخفيفها أكبر من أثرها؛ مخاطر أعمال متأصّلة', example: 'Accept minor demand forecast variance within ±5%. Accept minor freight rate fluctuations within contracted tolerance. Document acceptance with board sign-off.', exampleAr: 'قبول تباين طفيف في توقّع الطلب ضمن ±5%. قبول تقلّبات طفيفة في أسعار الشحن ضمن التفاوت المتعاقد عليه. توثيق القبول باعتماد المجلس.' },
              ].map(s => (
                <Reveal key={s.strategy} delay={0.05}>
                  <div className={`border rounded-2xl p-6 bg-white shadow-sm h-full flex flex-col gap-4 ${s.color}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.badge}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div><span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${s.badge}`}>{isAr ? s.strategyAr : s.strategy}</span></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{isAr ? s.descAr : s.desc}</p>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-bold text-primary mb-1">{isAr ? 'متى تُستخدم:' : 'When to use:'}</p>
                      <p className="text-xs text-muted-foreground mb-3">{isAr ? s.whenAr : s.when}</p>
                      <p className="text-xs font-bold text-primary mb-1">{isAr ? 'مثال:' : 'Example:'}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? s.exampleAr : s.example}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Supplier Risk Score */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'نموذج درجة مخاطر المورّد' : 'Supplier Risk Score Model'}</h3>
                <div className="grid sm:grid-cols-5 gap-3 mb-5">
                  {[{ dim: 'Financial Health', dimAr: 'الصحة المالية', weight: '30%', criteria: 'Altman Z-score, D&B rating, payment history, audit results', criteriaAr: 'مؤشّر Altman Z، وتصنيف D&B، وسجل السداد، ونتائج التدقيق' }, { dim: 'Operational Capability', dimAr: 'القدرة التشغيلية', weight: '25%', criteria: 'OTIF performance, capacity utilisation, quality certifications, contingency planning', criteriaAr: 'أداء OTIF، واستغلال الطاقة، وشهادات الجودة، وتخطيط الطوارئ' }, { dim: 'Geographic Risk', dimAr: 'المخاطر الجغرافية', weight: '20%', criteria: 'Country risk index, natural disaster exposure, political stability, logistics corridor risk', criteriaAr: 'مؤشّر مخاطر الدولة، والتعرّض للكوارث الطبيعية، والاستقرار السياسي، ومخاطر الممرّ اللوجستي' }, { dim: 'ESG / Compliance', dimAr: 'ESG / الامتثال', weight: '15%', criteria: 'Environmental certifications, labour standards, anti-corruption record, regulatory compliance', criteriaAr: 'الشهادات البيئية، ومعايير العمل، وسجل مكافحة الفساد، والامتثال التنظيمي' }, { dim: 'Relationship Maturity', dimAr: 'نضج العلاقة', weight: '10%', criteria: 'Years of relationship, transparency, joint improvement programmes, communication responsiveness', criteriaAr: 'سنوات العلاقة، والشفافية، وبرامج التحسين المشتركة، وسرعة الاستجابة في التواصل' }].map(d => (
                    <div key={d.dim} className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-primary">{d.weight}</p>
                      <p className="font-bold text-primary text-xs mt-1">{isAr ? d.dimAr : d.dim}</p>
                      <p className="text-xs text-muted-foreground mt-2">{isAr ? d.criteriaAr : d.criteria}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{isAr ? 'الدرجة 0–100: ≥80 = مخاطر منخفضة (أخضر)؛ 60–79 = مخاطر متوسطة (أصفر)؛ 40–59 = مخاطر مرتفعة (برتقالي)؛ أقل من 40 = مخاطر حرجة (أحمر) ← يلزم خطة تطوير أو استبعاد.' : 'Score 0–100: ≥80 = Low Risk (Green); 60–79 = Medium Risk (Yellow); 40–59 = High Risk (Orange); <40 = Critical Risk (Red) → development plan or disqualification required.'}</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-primary text-white">{isAr ? '🛠 أداة تفاعلية' : '🛠 Interactive Tool'}</span>
                <h3 className="font-bold text-primary">{isAr ? 'سجلّ مخاطرك الحيّ' : 'Your Live Risk Register'}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{isAr ? 'أضف مخاطرك، واحصل على درجات ودرجات متبقية محسوبة تلقائياً، وخريطة حرارة ومراقب KRI وموجز تخفيف بالذكاء الاصطناعي — كل ذلك محفوظ لحسابك.' : "Add your own risks and get auto-calculated scores, a live heat map, a KRI monitor, and an AI-generated mitigation brief — saved to your account."}</p>
              <RiskToolsSection isAr={isAr} />
            </Reveal>
          </div>
        )}

        {/* TAB 5 — GOVERNANCE */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'إطار حوكمة المخاطر' : 'Risk Governance Framework'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'هيكل حوكمة ثلاثي المستويات يضمن امتلاك المخاطر وتصعيدها ومعالجتها على المستوى الصحيح.' : 'Three-tier governance structure ensuring risk is owned, escalated, and addressed at the right level.'}</p>
            </Reveal>
            <div className="space-y-4">
              {[{ tier: 'Board Level', tierAr: 'مستوى المجلس', color: 'border-l-red-600 bg-red-50', items: ['Risk appetite statement — approved annually by full board', 'Quarterly risk review: top 5 risks, strategic risk profile', 'ESG and reputational risk oversight', 'Business continuity assurance'], itemsAr: ['بيان قابلية تحمّل المخاطر — يعتمده المجلس بالكامل سنوياً', 'مراجعة مخاطر ربع سنوية: أهم 5 مخاطر وملف المخاطر الاستراتيجي', 'الإشراف على مخاطر ESG والسمعة', 'ضمان استمرارية الأعمال'] },
                { tier: 'Executive / Management Level', tierAr: 'المستوى التنفيذي / الإداري', color: 'border-l-orange-500 bg-orange-50', items: ['Risk Management Committee — meets monthly', 'Procurement risk dashboard review (KRI-based)', 'Escalation decision for Critical risks', 'Risk programme budget approval', 'Supplier risk review: strategic suppliers quarterly'], itemsAr: ['لجنة إدارة المخاطر — تجتمع شهرياً', 'مراجعة لوحة مخاطر المشتريات (المبنية على مؤشرات المخاطر الرئيسية)', 'قرار التصعيد للمخاطر الحرجة', 'اعتماد موازنة برنامج المخاطر', 'مراجعة مخاطر المورّدين: المورّدون الاستراتيجيون ربع سنوياً'] },
                { tier: 'Operational Level', tierAr: 'المستوى التشغيلي', color: 'border-l-yellow-500 bg-yellow-50', items: ['Risk owner accountability for assigned register items', 'Weekly risk monitoring against KRI thresholds', 'Incident reporting (within 24h of identification)', 'Monthly mitigation plan progress update', 'Supplier risk score updates (monthly for Tier-1)'], itemsAr: ['مساءلة مالك المخاطرة عن بنود السجلّ المسندة إليه', 'مراقبة مخاطر أسبوعية مقابل حدود مؤشرات المخاطر الرئيسية', 'الإبلاغ عن الحوادث (خلال 24 ساعة من التحديد)', 'تحديث شهري لتقدّم خطة التخفيف', 'تحديث درجات مخاطر المورّدين (شهرياً للمستوى الأول)'] },
              ].map((tier, i) => (
                <Reveal key={tier.tier} delay={i * 0.06}>
                  <div className={`border-l-4 rounded-2xl p-6 bg-white shadow-sm ${tier.color}`}>
                    <p className="font-bold text-primary text-lg mb-3">{isAr ? tier.tierAr : tier.tier}</p>
                    <ul className="space-y-2">{(isAr ? tier.itemsAr : tier.items).map(item => <li key={item} className="text-sm text-muted-foreground flex items-start gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{item}</li>)}</ul>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-[#082C6B] rounded-2xl p-6 text-white">
              <h3 className="font-bold text-[#C9A84C] mb-3">{isAr ? 'التكامل مع سياسة المشتريات' : 'Integration with Procurement Policy'}</h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[{ rule: 'All procurement above SAR 500K requires formal risk assessment sign-off before award', ruleAr: 'كل مشتريات تتجاوز 500 ألف ريال تتطلّب اعتماد تقييم مخاطر رسمي قبل الترسية' }, { rule: 'Any sole-source above SAR 100K requires risk register entry and CPO approval', ruleAr: 'أي توريد أحادي المصدر يتجاوز 100 ألف ريال يتطلّب قيداً في سجلّ المخاطر واعتماد رئيس المشتريات' }, { rule: 'Supplier with risk score <40 cannot be awarded new strategic contracts without escalation', ruleAr: 'لا يمكن ترسية عقود استراتيجية جديدة على مورّد درجة مخاطره أقل من 40 دون تصعيد' }, { rule: 'Annual risk register review mandatory — quarterly for categories above SAR 5M spend', ruleAr: 'مراجعة سنوية إلزامية لسجلّ المخاطر — ربع سنوية للفئات التي يتجاوز إنفاقها 5 ملايين ريال' }].map(r => (
                  <div key={r.rule} className="flex items-start gap-2"><Shield className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" /><p className="text-sm text-white/80">{isAr ? r.ruleAr : r.rule}</p></div>
                ))}
              </div>
              <Link href="/governance-compliance"><span className="text-[#C9A84C] text-sm font-semibold hover:underline cursor-pointer flex items-center gap-1">{isAr ? 'إطار الحوكمة والامتثال الكامل' : 'Full Governance & Compliance Framework'} {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span></Link>
            </Reveal>
            <Reveal className="text-center py-4">
              <Link href="/consultant"><Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-10">{isAr ? 'اطلب تقييم المخاطر' : 'Request Risk Assessment'}</Button></Link>
              <p className="text-muted-foreground text-sm mt-3">{isAr ? 'تُجري ISC تقييماً كاملاً لمخاطر سلسلة الإمداد — يشمل سجلّ المخاطر وخريطة الحرارة وخارطة طريق التخفيف — خلال 4–6 أسابيع.' : 'ISC conducts a full supply chain risk assessment — delivering risk register, heat map, and mitigation roadmap — in 4–6 weeks.'}</p>
            </Reveal>
          </div>
        )}

        {/* TAB 6 — KPI Dashboard */}
        {activeTab === 6 && (
          <KPIDashboard slug="risk-management" />
        )}
      </div>
    </div>
  );
}
