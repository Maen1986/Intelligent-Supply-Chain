import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Scale, Shield, FileText, ClipboardList, CheckCircle,
  ChevronRight, Globe, AlertTriangle, Users, BookOpen,
  TrendingUp, Award, Clock, Building2, Layers, Star,
  ArrowRight, BarChart3, Eye, Cpu, Flag,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { KPIDashboard } from '@/components/KPIDashboard';
import { MaturityAssessmentTool } from '@/components/toolkit/MaturityTools';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Framework', 'Regulatory Landscape', 'Compliance Strategy', 'Policy Architecture', 'Implementation', 'Client Benefits', 'KPI Dashboard'];
const TABS_AR = ['الإطار', 'المشهد التنظيمي', 'استراتيجية الامتثال', 'هيكل السياسات', 'التنفيذ', 'فوائد العملاء', 'لوحة المؤشرات'];

const RACI = [
  { activity: 'Procurement Strategy Approval', activityAr: 'اعتماد استراتيجية المشتريات', board: 'A', cpo: 'R', catMgr: 'C', procMgr: 'I', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Category Plan Sign-off', activityAr: 'اعتماد خطة الفئة', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Contract Award >SAR 500K', activityAr: 'ترسية عقد تتجاوز 500 ألف ريال', board: 'A', cpo: 'R', catMgr: 'C', procMgr: 'I', finance: 'C', legal: 'C', audit: 'I' },
  { activity: 'Supplier Qualification', activityAr: 'تأهيل المورّدين', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'I', legal: 'C', audit: 'C' },
  { activity: 'PO Approval (<SAR 50K)', activityAr: 'اعتماد أمر شراء (أقل من 50 ألف ريال)', board: 'I', cpo: 'I', catMgr: 'I', procMgr: 'A/R', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Supplier Performance Audit', activityAr: 'تدقيق أداء المورّدين', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'I', legal: 'I', audit: 'C' },
  { activity: 'Risk Escalation (Critical)', activityAr: 'تصعيد المخاطر (الحرجة)', board: 'A', cpo: 'R', catMgr: 'I', procMgr: 'I', finance: 'C', legal: 'C', audit: 'C' },
];

const ROADMAP = [
  { weeks: 'Weeks 1–2', weeksAr: 'الأسبوع 1–2', title: 'Governance Diagnostic', titleAr: 'تشخيص الحوكمة', tasks: ['Current-state assessment vs best practice', 'Policy gap analysis against CIPS/ISO standards', 'Stakeholder mapping and engagement plan', 'Quick-win identification (30-day list)'], tasksAr: ['تقييم الوضع الحالي مقابل أفضل الممارسات', 'تحليل فجوات السياسات مقابل معايير CIPS/ISO', 'رسم خرائط أصحاب المصلحة وخطة الإشراك', 'تحديد المكاسب السريعة (قائمة 30 يوماً)'], color: 'bg-blue-600' },
  { weeks: 'Weeks 3–4', weeksAr: 'الأسبوع 3–4', title: 'Framework Design', titleAr: 'تصميم الإطار', tasks: ['Governance structure design (4-layer model)', 'Delegation of Authority (DoA) matrix', 'RACI for all key procurement activities', 'Policy hierarchy mapping'], tasksAr: ['تصميم هيكل الحوكمة (نموذج 4 طبقات)', 'مصفوفة تفويض الصلاحيات (DoA)', 'مصفوفة RACI لجميع أنشطة المشتريات الرئيسية', 'رسم التسلسل الهرمي للسياسات'], color: 'bg-indigo-600' },
  { weeks: 'Weeks 5–6', weeksAr: 'الأسبوع 5–6', title: 'Policy Development', titleAr: 'تطوير السياسات', tasks: ['Draft Procurement Policy (board-level)', 'Supplier Code of Conduct', 'Category policies for top 5 spend areas', 'Anti-corruption & conflict of interest policy'], tasksAr: ['صياغة سياسة المشتريات (على مستوى المجلس)', 'مدوّنة سلوك المورّدين', 'سياسات الفئات لأعلى 5 مجالات إنفاق', 'سياسة مكافحة الفساد وتضارب المصالح'], color: 'bg-purple-600' },
  { weeks: 'Weeks 7–8', weeksAr: 'الأسبوع 7–8', title: 'SOPs & Controls', titleAr: 'الإجراءات والضوابط', tasks: ['Process SOPs for 15–25 key procurement activities', 'Approval workflow design (ERP-integrated)', 'Audit trail and documentation requirements', 'ERP access control mapping'], tasksAr: ['إجراءات تشغيل معيارية لـ 15–25 نشاط مشتريات رئيسي', 'تصميم مسار اعتماد (متكامل مع ERP)', 'متطلبات مسار التدقيق والتوثيق', 'رسم ضوابط الوصول لنظام ERP'], color: 'bg-violet-600' },
  { weeks: 'Weeks 9–10', weeksAr: 'الأسبوع 9–10', title: 'Training & Communication', titleAr: 'التدريب والتواصل', tasks: ['Policy training workshop for all procurement staff', 'Management briefings and sign-off', 'Supplier communication — Code of Conduct rollout', 'Internal audit team briefing'], tasksAr: ['ورشة تدريب على السياسات لجميع موظفي المشتريات', 'إحاطات الإدارة والاعتماد', 'التواصل مع المورّدين — إطلاق مدوّنة السلوك', 'إحاطة فريق التدقيق الداخلي'], color: 'bg-pink-600' },
  { weeks: 'Weeks 11–12', weeksAr: 'الأسبوع 11–12', title: 'Go-Live & Monitoring', titleAr: 'الإطلاق والمراقبة', tasks: ['Policy launch and formal sign-off', 'KPI dashboard setup (ISC Dashboard Builder)', 'First compliance review against new policy', 'Governance calendar (review cadence) established'], tasksAr: ['إطلاق السياسة والاعتماد الرسمي', 'إعداد لوحة مؤشرات الأداء (ISC Dashboard Builder)', 'أول مراجعة امتثال مقابل السياسة الجديدة', 'ترسيخ تقويم الحوكمة (وتيرة المراجعة)'], color: 'bg-rose-600' },
];

const QUICK_WINS_30 = [
  'Map all current procurement approvals — identify bottlenecks and bypass routes',
  'Issue Supplier Code of Conduct to all 100% of active suppliers',
  'Implement conflict-of-interest declaration for all procurement staff',
  'Create a contract expiry alert calendar for the next 90 days',
  'Run first spend analysis — identify top 10 maverick spend categories',
  'Document your current delegation of authority (even if informal)',
];
const QUICK_WINS_30_AR = [
  'رسم خريطة جميع اعتمادات المشتريات الحالية — تحديد الاختناقات ومسارات الالتفاف',
  'إصدار مدوّنة سلوك المورّدين لجميع المورّدين النشطين (100%)',
  'تطبيق إقرار تضارب المصالح لجميع موظفي المشتريات',
  'إنشاء تقويم تنبيهات انتهاء العقود للـ 90 يوماً القادمة',
  'إجراء أول تحليل إنفاق — تحديد أعلى 10 فئات إنفاق خارج القنوات',
  'توثيق تفويض الصلاحيات الحالي لديك (حتى وإن كان غير رسمي)',
];

export function GovernanceCompliance() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState(0);
  const [openPolicy, setOpenPolicy] = useState<number | null>(0);
  const [openCompliance, setOpenCompliance] = useState<number | null>(null);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-[#0d2a6b] py-14 px-4">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 50%)' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">{isAr ? 'الحوكمة والامتثال' : 'Governance & Compliance'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{isAr ? 'إطار الحوكمة والامتثال' : <>Governance &amp; Compliance Framework</>}</h1>
          <p className="text-white/75 text-lg max-w-2xl">{isAr ? 'حوكمة منظّمة تحمي وتمكّن وتخلق القيمة — من هيكل السياسات إلى الإشراف على مستوى المجلس — عبر المشهد التنظيمي الخليجي.' : 'Structured governance that protects, enables, and creates value — from policy architecture to board-level oversight — across the GCC regulatory landscape.'}</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">{isAr ? 'تقييم الحوكمة' : 'Governance Assessment'}</Button></Link>
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

        {/* TAB 0 — FRAMEWORK */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">{isAr ? 'نموذج ISC للحوكمة رباعي الطبقات' : 'ISC 4-Layer Governance Model'}</h2>
                <p className="text-muted-foreground leading-relaxed">{isAr ? 'تعمل حوكمة المشتريات الفعّالة على أربعة مستويات متمايزة — من التوجيه الاستراتيجي على مستوى المجلس إلى ضوابط البيانات على مستوى النظام. تنشر ISC هذا النموذج لضمان أن كل قرار مشتريات مُخوَّل وقابل للتتبّع ومتوائم مع السياسة.' : 'Effective procurement governance operates at four distinct levels — from board-level strategic direction to system-level data controls. ISC deploys this model to ensure every procurement decision is authorised, traceable, and aligned to policy.'}</p>
                <div className="mt-5 space-y-3">
                  {[{ layer: 'Layer 1 — Board & Executive', layerAr: 'الطبقة 1 — المجلس والإدارة التنفيذية', desc: 'Risk appetite, strategic direction, performance accountability. Meets quarterly.', descAr: 'قابلية تحمّل المخاطر، والتوجيه الاستراتيجي، ومساءلة الأداء. تجتمع ربع سنوياً.', color: 'border-l-red-600 bg-red-50' }, { layer: 'Layer 2 — Management Governance', layerAr: 'الطبقة 2 — حوكمة الإدارة', desc: 'Policies, delegation of authority, category strategies, spend thresholds. Meets monthly.', descAr: 'السياسات، وتفويض الصلاحيات، واستراتيجيات الفئات، وحدود الإنفاق. تجتمع شهرياً.', color: 'border-l-orange-500 bg-orange-50' }, { layer: 'Layer 3 — Operational Governance', layerAr: 'الطبقة 3 — الحوكمة التشغيلية', desc: 'SOPs, approval workflows, supplier contracts, KPIs, audit trails. Daily/weekly.', descAr: 'الإجراءات المعيارية، ومسارات الاعتماد، وعقود المورّدين، ومؤشرات الأداء، ومسارات التدقيق. يومياً/أسبوعياً.', color: 'border-l-yellow-500 bg-yellow-50' }, { layer: 'Layer 4 — System & Data Governance', layerAr: 'الطبقة 4 — حوكمة النظام والبيانات', desc: 'ERP access controls, data integrity, master data management, reporting. Continuous.', descAr: 'ضوابط الوصول لنظام ERP، وسلامة البيانات، وإدارة البيانات الرئيسية، والتقارير. مستمرّة.', color: 'border-l-green-500 bg-green-50' }].map(l => (
                    <div key={l.layer} className={`border-l-4 rounded-xl p-4 ${l.color}`}>
                      <p className="font-bold text-primary text-sm">{isAr ? l.layerAr : l.layer}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isAr ? l.descAr : l.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">{isAr ? 'تفويض الصلاحيات (DoA)' : 'Delegation of Authority (DoA)'}</p>
                <div className="space-y-3">
                  {[{ threshold: 'Up to SAR 50K', thresholdAr: 'حتى 50 ألف ريال', authority: 'Procurement Manager', authorityAr: 'مدير المشتريات', note: 'Routine operational procurement', noteAr: 'مشتريات تشغيلية روتينية' }, { threshold: 'SAR 50K–500K', thresholdAr: '50 ألف–500 ألف ريال', authority: 'CPO / Procurement Director', authorityAr: 'رئيس المشتريات / مدير المشتريات', note: 'Standard approval, risk assessment recommended', noteAr: 'اعتماد قياسي، يُوصى بتقييم المخاطر' }, { threshold: 'SAR 500K–5M', thresholdAr: '500 ألف–5 ملايين ريال', authority: 'CEO / Board Sub-committee', authorityAr: 'الرئيس التنفيذي / لجنة فرعية من المجلس', note: 'Mandatory risk assessment, strategy sign-off', noteAr: 'تقييم مخاطر إلزامي، واعتماد الاستراتيجية' }, { threshold: 'SAR 5M+', thresholdAr: 'أكثر من 5 ملايين ريال', authority: 'Full Board Approval', authorityAr: 'اعتماد المجلس بالكامل', note: 'Board resolution required; external legal review', noteAr: 'يلزم قرار من المجلس؛ مراجعة قانونية خارجية' }, { threshold: 'Emergency Procurement', thresholdAr: 'المشتريات الطارئة', authority: 'CEO + Ratification <48h', authorityAr: 'الرئيس التنفيذي + مصادقة خلال 48 ساعة', note: 'Documented justification; post-event audit', noteAr: 'مبرّر موثّق؛ تدقيق لاحق' }].map(d => (
                    <div key={d.threshold} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0 mt-2" />
                      <div>
                        <p className="font-bold text-white text-sm">{isAr ? d.thresholdAr : d.threshold} → {isAr ? d.authorityAr : d.authority}</p>
                        <p className="text-xs text-white/60 mt-0.5">{isAr ? d.noteAr : d.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* RACI Table */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'مصفوفة RACI — حوكمة المشتريات' : 'RACI Matrix — Procurement Governance'}</h3>
                <table className="w-full text-xs min-w-[600px]">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-2 font-bold text-primary pr-4 min-w-[180px]">{isAr ? 'النشاط' : 'Activity'}</th>
                    {(isAr ? ['المجلس', 'رئيس المشتريات', 'مدير الفئة', 'مدير المشتريات', 'المالية', 'القانونية', 'التدقيق'] : ['Board', 'CPO', 'Cat Mgr', 'Proc Mgr', 'Finance', 'Legal', 'Audit']).map(h => <th key={h} className="text-center py-2 font-bold text-primary px-2 w-16">{h}</th>)}
                  </tr></thead>
                  <tbody>{RACI.map((r, i) => (
                    <tr key={r.activity} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                      <td className="py-2.5 pr-4 text-muted-foreground font-medium">{isAr ? r.activityAr : r.activity}</td>
                      {[r.board, r.cpo, r.catMgr, r.procMgr, r.finance, r.legal, r.audit].map((cell, ci) => (
                        <td key={ci} className="py-2.5 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-extrabold ${cell === 'A' ? 'bg-primary text-white' : cell === 'R' ? 'bg-emerald-100 text-emerald-700' : cell === 'C' ? 'bg-blue-100 text-blue-700' : cell === 'A/R' ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>{cell}</span>
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3">{isAr ? 'R=مسؤول عن التنفيذ، A=المساءل، C=يُستشار، I=يُبلَّغ' : 'R=Responsible, A=Accountable, C=Consulted, I=Informed'}</p>
              </div>
            </Reveal>

            {/* Governance KPIs */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />{isAr ? 'مؤشرات أداء الحوكمة' : 'Governance KPIs'}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Policy Compliance Rate', nameAr: 'معدّل الامتثال للسياسات', target: '>92%', benchmark: '71%' }, { name: 'Procurement Audit Score', nameAr: 'درجة تدقيق المشتريات', target: '>85/100', benchmark: '68/100' }, { name: 'Approved Supplier Adherence', nameAr: 'الالتزام بالمورّدين المعتمدين', target: '>95%', benchmark: '79%' }, { name: 'Contract Coverage of Spend', nameAr: 'تغطية العقود للإنفاق', target: '>90%', benchmark: '63%' }, { name: 'Maverick Spend', nameAr: 'الإنفاق خارج القنوات', target: '<5%', benchmark: '18%' }, { name: 'DoA Violation Incidents', nameAr: 'حوادث مخالفة تفويض الصلاحيات', target: '0 per quarter', targetAr: '0 كل ربع', benchmark: '3–5 per quarter', benchmarkAr: '3–5 كل ربع' }].map(k => (
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

        {/* TAB 1 — REGULATORY LANDSCAPE */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'المشهد التنظيمي — الخليج والأردن' : <>Regulatory Landscape — GCC &amp; Jordan</>}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'ترصد ISC وتفسّر لوائح المشتريات وسلسلة الإمداد عبر الخليج — لضمان بقاء العملاء ملتزمين في بيئة سريعة التطوّر.' : 'ISC monitors and interprets procurement and supply chain regulations across the GCC — ensuring clients stay compliant in a rapidly evolving environment.'}</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {[{
                country: '🇸🇦 Saudi Arabia — Primary Focus', countryAr: '🇸🇦 المملكة العربية السعودية — التركيز الأساسي', color: 'border-t-green-600', regs: [
                  { name: 'GTPL (Government Tenders & Procurement Law)', impact: 'Mandatory for all government procurement. Tender process, prequalification, evaluation criteria, dispute resolution. 2019 amendments tightened transparency requirements.', impactAr: 'إلزامي لجميع المشتريات الحكومية. عملية المنافسات والتأهيل المسبق ومعايير التقييم وحل النزاعات. عزّزت تعديلات 2019 متطلبات الشفافية.' },
                  { name: 'Iktva / Local Content Programme', impact: 'All energy sector suppliers must achieve and report Iktva score. ISC supports calculation, gap closure, and audit preparation.', impactAr: 'على جميع موردي قطاع الطاقة تحقيق درجة Iktva والإبلاغ عنها. تدعم ISC الحساب وسد الفجوات والاستعداد للتدقيق.' },
                  { name: 'SFDA (Saudi Food & Drug Authority)', impact: 'Pharmaceutical, food, and medical device procurement — import approval, GDP compliance, labelling, and cold chain requirements.', impactAr: 'مشتريات الأدوية والأغذية والأجهزة الطبية — موافقة الاستيراد والامتثال لـ GDP والوسم ومتطلبات سلسلة التبريد.' },
                  { name: 'NCAR (National Construction Sector Dev.)', impact: 'Material qualification, testing standards, and contractor prequalification for infrastructure and EPC projects.', impactAr: 'تأهيل المواد ومعايير الاختبار والتأهيل المسبق للمقاولين لمشاريع البنية التحتية وEPC.' },
                  { name: 'ZATCA e-Invoicing', impact: 'Phase 2 mandatory e-invoicing (Fatoora) for B2B transactions. Procurement must ensure supplier compliance in contracts and POs.', impactAr: 'المرحلة الثانية من الفوترة الإلكترونية الإلزامية (فاتورة) للمعاملات بين المنشآت. يجب أن تضمن المشتريات امتثال المورّدين في العقود وأوامر الشراء.' },
                  { name: 'Vision 2030 Alignment', impact: 'All public sector procurement must demonstrate progress toward localisation, Saudisation, and sustainability — reportable to NTP/MISA.', impactAr: 'يجب أن تُظهر جميع مشتريات القطاع العام تقدّماً نحو التوطين والسعودة والاستدامة — قابلة للإبلاغ إلى NTP/MISA.' },
                ]
              }, {
                country: '🇯🇴 Jordan', countryAr: '🇯🇴 الأردن', color: 'border-t-red-600', regs: [
                  { name: 'Public Procurement Bureau (PPB)', impact: 'Governs all government procurement above JOD 5,000. Prequalification, tender evaluation, and contract award protocols.', impactAr: 'ينظّم جميع المشتريات الحكومية التي تتجاوز 5,000 دينار. بروتوكولات التأهيل المسبق وتقييم المنافسات وترسية العقود.' },
                  { name: 'JSMO (Jordan Standards & Metrology)', impact: 'National standards body — product compliance and testing for imported and locally manufactured goods.', impactAr: 'هيئة المواصفات الوطنية — امتثال المنتجات واختبارها للسلع المستوردة والمصنّعة محلياً.' },
                  { name: 'Jordan Food & Drug Administration', impact: 'JFDA registration and import clearance for pharma and food supply chains.', impactAr: 'تسجيل JFDA وتخليص الاستيراد لسلاسل إمداد الأدوية والأغذية.' },
                  { name: 'CBJ FX Regulations', impact: 'Foreign currency controls affect import procurement, letter of credit requirements, and USD/JOD exposure management.', impactAr: 'تؤثّر ضوابط العملات الأجنبية في مشتريات الاستيراد ومتطلبات الاعتمادات المستندية وإدارة انكشاف الدولار/الدينار.' },
                ]
              }, {
                country: '🌍 International Standards', countryAr: '🌍 المعايير الدولية', color: 'border-t-blue-600', regs: [
                  { name: 'ISO 20400 Sustainable Procurement', impact: 'International standard for integrating sustainability into procurement decisions and supplier management.', impactAr: 'معيار دولي لدمج الاستدامة في قرارات المشتريات وإدارة المورّدين.' },
                  { name: 'ISO 44001 Collaborative Relationships', impact: 'Standard for managing strategic supplier and partner relationships — relevant for JVs, long-term contracts, and SPAs.', impactAr: 'معيار لإدارة علاقات المورّدين والشركاء الاستراتيجيين — مهم للمشاريع المشتركة والعقود طويلة الأجل واتفاقيات الشراء.' },
                  { name: 'FCPA / UK Bribery Act', impact: 'Anti-corruption regulations with extraterritorial reach — apply to multinationals operating procurement in KSA and Jordan.', impactAr: 'لوائح مكافحة الفساد ذات النطاق خارج الحدود — تنطبق على الشركات متعددة الجنسيات التي تدير مشتريات في السعودية والأردن.' },
                  { name: 'EU CSDDD (Corporate Sustainability Due Diligence)', impact: 'European companies must audit GCC suppliers for ESG risks. GCC exporters must provide ESG documentation or risk losing European contracts.', impactAr: 'يجب على الشركات الأوروبية تدقيق موردي الخليج بشأن مخاطر ESG. وعلى المصدّرين الخليجيين تقديم وثائق ESG أو المخاطرة بفقدان العقود الأوروبية.' },
                ]
              }, {
                country: '📋 Procurement Standards', countryAr: '📋 معايير المشتريات', color: 'border-t-purple-600', regs: [
                  { name: 'CIPS Ethical & Professional Standards', impact: 'Global standard for procurement ethics — anti-corruption, conflict of interest, supplier conduct, and professional behaviour.', impactAr: 'معيار عالمي لأخلاقيات المشتريات — مكافحة الفساد وتضارب المصالح وسلوك المورّدين والسلوك المهني.' },
                  { name: 'APICS SCOR Supply Chain Standards', impact: 'Process, performance, and practice standards for supply chain operations aligned to global benchmarks.', impactAr: 'معايير العمليات والأداء والممارسة لعمليات سلسلة الإمداد متوائمة مع المعايير المرجعية العالمية.' },
                  { name: 'IACCM / World Commerce & Contracting', impact: 'Contract management standards, clause libraries, and commercial risk best practice for GCC contract professionals.', impactAr: 'معايير إدارة العقود ومكتبات البنود وأفضل ممارسات المخاطر التجارية لمحترفي العقود في الخليج.' },
                  { name: 'UN Global Compact', impact: 'For multinationals: 10 principles covering human rights, labour, environment, and anti-corruption in supply chains.', impactAr: 'للشركات متعددة الجنسيات: 10 مبادئ تغطّي حقوق الإنسان والعمل والبيئة ومكافحة الفساد في سلاسل الإمداد.' },
                ]
              }].map((sec, i) => (
                <Reveal key={sec.country} delay={i * 0.06}>
                  <div className={`bg-white border border-border rounded-2xl shadow-sm overflow-hidden border-t-4 ${sec.color}`}>
                    <div className="p-5 pb-0">
                      <h3 className="font-bold text-primary mb-4">{isAr ? sec.countryAr : sec.country}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {sec.regs.map((r, ri) => (
                        <div key={ri} className="px-5 py-3">
                          <p className="font-semibold text-primary text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{isAr ? r.impactAr : r.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4 items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-800 mb-1">{isAr ? 'خدمة الرصد التنظيمي' : 'Regulatory Monitoring Service'}</p>
                <p className="text-sm text-orange-700 leading-relaxed">{isAr ? 'توفّر ISC موجزاً شهرياً للاستخبارات التنظيمية الخليجية — يغطّي تغيّرات قوانين المشتريات الجديدة وتحديثات SFDA/NCAR وأهداف مشتريات رؤية 2030 ومراجعات المعايير الدولية. يتلقّى العملاء تقييمات أثر خلال 90 يوماً وتحديثات سياسات موصى بها. تواصل معنا للاشتراك.' : 'ISC provides a monthly GCC regulatory intelligence brief — covering new procurement law changes, SFDA/NCAR updates, Vision 2030 procurement targets, and international standard revisions. Clients receive 90-day impact assessments and recommended policy updates. Contact us to subscribe.'}</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 2 — COMPLIANCE STRATEGY */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'استراتيجية الامتثال — 4 ركائز' : 'Compliance Strategy — 4 Pillars'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'برنامج امتثال متكامل يمنع ويكتشف ويستجيب ويحسّن الامتثال باستمرار عبر عمليات المشتريات وسلسلة الإمداد.' : 'A complete compliance programme prevents, detects, responds to, and continuously improves compliance across procurement and supply chain operations.'}</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{ pillar: 'PREVENT', pillarAr: 'المنع', icon: Shield, color: 'bg-blue-50 border-blue-200 text-blue-600', actions: ['Procurement policy covering all relevant regulations', 'Supplier Code of Conduct — mandatory for all active suppliers', 'Conflict of interest declaration — all procurement staff annually', 'Anti-corruption training (FCPA/UK Bribery Act awareness)', 'Supplier due diligence screening (Standard + Enhanced tiers)', 'Prequalification process with compliance criteria'], actionsAr: ['سياسة مشتريات تغطّي جميع اللوائح ذات الصلة', 'مدوّنة سلوك المورّدين — إلزامية لجميع المورّدين النشطين', 'إقرار تضارب المصالح — لجميع موظفي المشتريات سنوياً', 'تدريب مكافحة الفساد (توعية بـ FCPA/UK Bribery Act)', 'فحص العناية الواجبة للمورّدين (مستوى قياسي + معزّز)', 'عملية تأهيل مسبق بمعايير امتثال'] },
                { pillar: 'DETECT', pillarAr: 'الكشف', icon: Eye, color: 'bg-orange-50 border-orange-200 text-orange-600', actions: ['Annual internal procurement audit (quarterly for high-risk)', 'Spend analytics — maverick spend and policy violation alerts', 'Supplier performance monitoring — anomaly flagging', 'Whistleblower channel — anonymous reporting available', 'Contract compliance monitoring — term adherence checks', 'ERP access log review — segregation of duties audit'], actionsAr: ['تدقيق داخلي سنوي للمشتريات (ربع سنوي للمخاطر العالية)', 'تحليلات الإنفاق — تنبيهات الإنفاق خارج القنوات ومخالفة السياسات', 'مراقبة أداء المورّدين — الإبلاغ عن الحالات الشاذّة', 'قناة الإبلاغ عن المخالفات — إبلاغ مجهول متاح', 'مراقبة امتثال العقود — فحص الالتزام بالشروط', 'مراجعة سجل الوصول لـ ERP — تدقيق فصل الواجبات'] },
                { pillar: 'RESPOND', pillarAr: 'الاستجابة', icon: AlertTriangle, color: 'bg-red-50 border-red-200 text-red-600', actions: ['Incident management protocol — classification, escalation, response', 'Corrective action plan (CAP) with owner and deadline', 'Regulatory notification process (GTPL, SFDA — where required)', 'Supplier suspension/termination protocol', 'Board reporting for material compliance incidents', 'Post-incident lessons-learned documentation'], actionsAr: ['بروتوكول إدارة الحوادث — التصنيف والتصعيد والاستجابة', 'خطة إجراء تصحيحي (CAP) بمالك وموعد نهائي', 'عملية الإبلاغ التنظيمي (GTPL، SFDA — عند اللزوم)', 'بروتوكول تعليق/إنهاء المورّد', 'رفع تقارير للمجلس عن حوادث الامتثال الجوهرية', 'توثيق الدروس المستفادة بعد الحادث'] },
                { pillar: 'IMPROVE', pillarAr: 'التحسين', icon: TrendingUp, color: 'bg-green-50 border-green-200 text-green-600', actions: ['Annual policy review cycle — update for regulatory changes', 'Training refresh following incidents or policy updates', 'Benchmark compliance score vs GCC best practice', 'CIPS compliance framework self-assessment annually', 'Supplier development for compliance improvement', 'Governance effectiveness review (board-level, annual)'], actionsAr: ['دورة مراجعة سنوية للسياسات — تحديث للتغيّرات التنظيمية', 'تحديث التدريب عقب الحوادث أو تحديثات السياسات', 'مقارنة درجة الامتثال بأفضل الممارسات الخليجية', 'تقييم ذاتي سنوي لإطار امتثال CIPS', 'تطوير المورّدين لتحسين الامتثال', 'مراجعة فاعلية الحوكمة (على مستوى المجلس، سنوياً)'] },
              ].map(p => (
                <Reveal key={p.pillar} delay={0.05}>
                  <div className={`border rounded-2xl p-6 bg-white shadow-sm h-full flex flex-col gap-4 ${p.color.split(' ').slice(1).join(' ')}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.color}`}>
                        <p.icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${p.color.replace('bg-', 'bg-').replace('text-', '')} ${p.color}`}>{isAr ? p.pillarAr : p.pillar}</span>
                    </div>
                    <ul className="space-y-2 flex-1">
                      {(isAr ? p.actionsAr : p.actions).map(a => <li key={a} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{a}</li>)}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Audit types */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{isAr ? 'إطار تدقيق الامتثال' : 'Compliance Audit Framework'}</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[{ type: 'Desktop Audit', typeAr: 'تدقيق مكتبي', desc: 'Document review, policy compliance check, contract term adherence. Remote. Annual for standard suppliers, semi-annual for high-risk.', descAr: 'مراجعة الوثائق وفحص الامتثال للسياسات والالتزام بشروط العقد. عن بُعد. سنوي للمورّدين القياسيين، ونصف سنوي للمخاطر العالية.', badge: 'bg-blue-100 text-blue-700' }, { type: 'On-Site Audit', typeAr: 'تدقيق ميداني', desc: 'Physical inspection, process observation, staff interviews, system access check. For Tier-1 strategic suppliers. Annual or triggered by incident.', descAr: 'معاينة ميدانية ومراقبة العمليات ومقابلات الموظفين وفحص الوصول للنظام. للمورّدين الاستراتيجيين من المستوى الأول. سنوي أو عند وقوع حادث.', badge: 'bg-orange-100 text-orange-700' }, { type: 'Third-Party Audit', typeAr: 'تدقيق طرف ثالث', desc: 'Independent external auditors for highest-risk categories (pharma GDP, ESG, anti-corruption). Required for regulatory compliance submission.', descAr: 'مدققون خارجيون مستقلون للفئات الأعلى مخاطرة (GDP الأدوية، وESG، ومكافحة الفساد). مطلوب لتقديم الامتثال التنظيمي.', badge: 'bg-red-100 text-red-700' }].map(a => (
                    <div key={a.type} className="bg-muted rounded-xl p-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.badge} mb-3 inline-block`}>{isAr ? a.typeAr : a.type}</span>
                      <p className="text-sm text-muted-foreground">{isAr ? a.descAr : a.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold text-primary mb-1">{isAr ? 'تقييم التدقيق' : 'Audit Scoring'}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? <>شدّة عدم المطابقة: <span className="font-bold text-red-700">حرجة</span> (إجراء تصحيحي فوري، وخطر تعليق المورّد) · <span className="font-bold text-orange-700">كبيرة</span> (تلزم خطة تصحيح خلال 30 يوماً) · <span className="font-bold text-yellow-700">طفيفة</span> (تلزم خطة تصحيح خلال 90 يوماً). ثلاث حالات عدم مطابقة كبيرة خلال 12 شهراً تستوجب التصعيد إلى رئيس المشتريات وإعادة التدقيق.</> : <>Non-conformance severity: <span className="font-bold text-red-700">Critical</span> (immediate corrective action, supplier suspension risk) · <span className="font-bold text-orange-700">Major</span> (30-day CAP required) · <span className="font-bold text-yellow-700">Minor</span> (90-day CAP required). Three Major NCs in 12 months triggers escalation to CPO and re-audit.</>}</p>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-primary text-white">{isAr ? '🛠 أداة تفاعلية' : '🛠 Interactive Tool'}</span>
                <h3 className="font-bold text-primary">{isAr ? 'قيّم نضج حوكمتك والامتثال' : 'Assess Your Governance & Compliance Maturity'}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{isAr ? 'أجب عن أسئلة موجزة لتحصل على درجة نضج فورية عبر ركائز المنع والكشف والاستجابة والتحسين، مع توصيات مُرتّبة حسب الأولوية.' : 'Answer a short set of questions for an instant maturity score across the Prevent, Detect, Respond, and Improve pillars, with prioritised recommendations.'}</p>
              <MaturityAssessmentTool slug="governance-compliance" isAr={isAr} />
            </Reveal>
          </div>
        )}

        {/* TAB 3 — POLICY ARCHITECTURE */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'هيكل سياسات المشتريات' : 'Procurement Policy Architecture'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'يضمن التسلسل الهرمي الواضح للسياسات أن يُوجَّه كل قرار مشتريات بالمستوى الصحيح من الصلاحية — من ميثاق مستوى المجلس إلى تعليمات العمل التشغيلية.' : 'A clear policy hierarchy ensures every procurement decision is guided by the right level of authority — from board-level charter to operational work instructions.'}</p>
            </Reveal>

            {/* Policy pyramid */}
            <Reveal>
              <div className="space-y-3">
                {[
                  { level: 'Level 1', levelAr: 'المستوى 1', title: 'Procurement Charter', titleAr: 'ميثاق المشتريات', owner: 'Board of Directors', ownerAr: 'مجلس الإدارة', desc: 'Strategic intent, mandate, and values of the procurement function. 5-year horizon. Sets the "why" and "what" of procurement governance.', descAr: 'النية الاستراتيجية وتفويض وقيم وظيفة المشتريات. أفق خمس سنوات. يحدّد "لماذا" و"ماذا" في حوكمة المشتريات.', covers: ['Procurement mandate and scope', 'Core values: integrity, transparency, value', 'Strategic procurement objectives', 'Alignment to corporate strategy'], coversAr: ['تفويض المشتريات ونطاقها', 'القيم الجوهرية: النزاهة والشفافية والقيمة', 'أهداف المشتريات الاستراتيجية', 'التوافق مع استراتيجية المؤسسة'], color: 'bg-[#082C6B] text-white', accent: 'text-[#C9A84C]' },
                  { level: 'Level 2', levelAr: 'المستوى 2', title: 'Procurement Policy', titleAr: 'سياسة المشتريات', owner: 'CEO / Board Approval', ownerAr: 'الرئيس التنفيذي / اعتماد المجلس', desc: 'Mandatory rules for all procurement activities. Defines authority, ethics, processes, and non-negotiable requirements.', descAr: 'قواعد إلزامية لجميع أنشطة المشتريات. تحدّد الصلاحية والأخلاقيات والعمليات والمتطلبات غير القابلة للتفاوض.', covers: ['Scope and applicability', 'Delegation of Authority (DoA)', 'Ethics and conflict of interest rules', 'Emergency procurement provisions', 'Supplier selection requirements'], coversAr: ['النطاق والانطباق', 'تفويض الصلاحيات (DoA)', 'قواعد الأخلاقيات وتضارب المصالح', 'أحكام المشتريات الطارئة', 'متطلبات اختيار المورّدين'], color: 'bg-blue-700 text-white', accent: 'text-blue-200' },
                  { level: 'Level 3', levelAr: 'المستوى 3', title: 'Category Policies', titleAr: 'سياسات الفئات', owner: 'CPO / Procurement Director', ownerAr: 'رئيس المشتريات / مدير المشتريات', desc: 'Specific sourcing rules for each major spend category — IT, MRO, Professional Services, Capex, Logistics, Marketing.', descAr: 'قواعد توريد محدّدة لكل فئة إنفاق رئيسية — تقنية المعلومات، والصيانة والتشغيل، والخدمات المهنية، والنفقات الرأسمالية، والخدمات اللوجستية، والتسويق.', covers: ['Category-specific sourcing strategy', 'Approved supplier requirements', 'Maximum contract durations', 'Local content requirements (Iktva)', 'Category risk parameters'], coversAr: ['استراتيجية توريد خاصة بالفئة', 'متطلبات المورّدين المعتمدين', 'الحد الأقصى لمدد العقود', 'متطلبات المحتوى المحلي (Iktva)', 'معايير مخاطر الفئة'], color: 'bg-indigo-600 text-white', accent: 'text-indigo-200' },
                  { level: 'Level 4', levelAr: 'المستوى 4', title: 'Standard Operating Procedures (SOPs)', titleAr: 'إجراءات التشغيل المعيارية (SOPs)', owner: 'Procurement Manager', ownerAr: 'مدير المشتريات', desc: 'Step-by-step process documentation for all key procurement activities — 15–25 SOPs covering the full procurement cycle.', descAr: 'توثيق العمليات خطوة بخطوة لجميع أنشطة المشتريات الرئيسية — 15–25 إجراءً تغطّي دورة المشتريات الكاملة.', covers: ['RFx process (RFI, RFQ, RFP)', 'Supplier qualification', 'Contract award process', 'PO creation and approval', 'Supplier performance review'], coversAr: ['عملية RFx (RFI، RFQ، RFP)', 'تأهيل المورّدين', 'عملية ترسية العقود', 'إنشاء واعتماد أوامر الشراء', 'مراجعة أداء المورّدين'], color: 'bg-purple-600 text-white', accent: 'text-purple-200' },
                  { level: 'Level 5', levelAr: 'المستوى 5', title: 'Work Instructions & Templates', titleAr: 'تعليمات العمل والقوالب', owner: 'Procurement Team', ownerAr: 'فريق المشتريات', desc: 'Detailed task-level guides and standardised templates used daily — forms, checklists, scoring matrices, contract templates.', descAr: 'أدلة تفصيلية على مستوى المهام وقوالب موحّدة تُستخدم يومياً — نماذج وقوائم تحقّق ومصفوفات تقييم وقوالب عقود.', covers: ['Tender evaluation scoring matrix', 'Supplier scorecard template', 'Contract variation request form', 'PO amendment process', 'Procurement approval checklist'], coversAr: ['مصفوفة تقييم المنافسات', 'قالب بطاقة أداء المورّد', 'نموذج طلب تعديل العقد', 'عملية تعديل أمر الشراء', 'قائمة تحقّق اعتماد المشتريات'], color: 'bg-gray-600 text-white', accent: 'text-gray-300' },
                ].map((p, i) => (
                  <Reveal key={p.level} delay={i * 0.05}>
                    <button className={`w-full text-left rounded-2xl p-5 shadow-sm flex items-start gap-5 hover:opacity-90 transition-opacity ${p.color}`}
                      onClick={() => setOpenPolicy(openPolicy === i ? null : i)}>
                      <div className={`shrink-0 ${p.accent} font-extrabold text-sm`}>{isAr ? p.levelAr : p.level}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg">{isAr ? p.titleAr : p.title}</p>
                            <p className={`text-xs ${p.accent} font-medium mt-0.5`}>{isAr ? 'المالك: ' : 'Owner: '}{isAr ? p.ownerAr : p.owner}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 opacity-60 transition-transform ${openPolicy === i ? 'rotate-90' : 'rtl:rotate-180'}`} />
                        </div>
                        {openPolicy === i && (
                          <div className="mt-4 grid sm:grid-cols-2 gap-4">
                            <p className="text-sm opacity-80 sm:col-span-2">{isAr ? p.descAr : p.desc}</p>
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.accent}`}>{isAr ? 'يجب أن يغطّي:' : 'Must Cover:'}</p>
                              <ul className="space-y-1">{(isAr ? p.coversAr : p.covers).map(c => <li key={c} className="text-xs opacity-80 flex items-start gap-2"><CheckCircle className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />{c}</li>)}</ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </Reveal>
                ))}
              </div>
            </Reveal>
            <Reveal className="bg-muted border border-border rounded-2xl p-5">
              <p className="font-bold text-primary mb-2">{isAr ? 'خدمة ISC لتطوير السياسات' : 'ISC Policy Development Service'}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'تؤلّف ISC وتراجع وتطبّق أُطر سياسات مشتريات كاملة — تُسلَّم عادةً خلال 4–8 أسابيع حسب تعقيد المنشأة. جميع الوثائق متوائمة مع معايير CIPS ومتطلبات GTPL (السعودية) وISO 20400 حيثما ينطبق.' : 'ISC authors, reviews, and implements complete procurement policy frameworks — typically delivered in 4–8 weeks depending on organisational complexity. All documents aligned to CIPS standards, GTPL requirements (Saudi Arabia), and ISO 20400 where applicable.'}</p>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — IMPLEMENTATION */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'خارطة تنفيذ خلال 12 أسبوعاً' : '12-Week Implementation Roadmap'}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'من تشخيص الحوكمة إلى إطار سياسات فاعل — تسليم منظّم بمعالم واضحة وإشراك أصحاب المصلحة في كل مرحلة.' : 'From governance diagnostic to live policy framework — structured delivery with clear milestones and stakeholder engagement at every phase.'}</p>
            </Reveal>
            <div className="space-y-4">
              {ROADMAP.map((phase, i) => (
                <Reveal key={phase.weeks} delay={i * 0.05}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex gap-5 items-start">
                    <div className={`w-12 h-12 rounded-xl ${phase.color} text-white flex items-center justify-center font-extrabold text-xs shrink-0 text-center leading-tight px-1`}>{phase.weeks.split(' ')[0]}<br/>{phase.weeks.split('–')[1] ? `–${phase.weeks.split('–')[1].split(' ').pop()}` : ''}</div>
                    <div className="flex-1">
                      <p className="font-bold text-primary mb-2">{isAr ? phase.weeksAr : phase.weeks} — {isAr ? phase.titleAr : phase.title}</p>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {(isAr ? phase.tasksAr : phase.tasks).map(t => <li key={t} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{t}</li>)}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <h3 className="font-bold text-[#C9A84C] mb-4">{isAr ? 'مكاسب سريعة خلال 30 يوماً — ابدأ اليوم' : '30-Day Quick Wins — Start Today'}</h3>
                <p className="text-white/70 text-sm mb-4">{isAr ? 'قبل بدء البرنامج الكامل، يمكن تطبيق هذه المكاسب السريعة فوراً — لبناء الزخم وإظهار نية الحوكمة.' : 'Before the full programme begins, these quick wins can be implemented immediately — building momentum and demonstrating governance intent.'}</p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {(isAr ? QUICK_WINS_30_AR : QUICK_WINS_30).map((qw, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <span className="w-6 h-6 rounded-full bg-[#C9A84C] text-white text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                      {qw}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 5 — CLIENT BENEFITS */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">{isAr ? 'فوائد العملاء والنتائج' : <>Client Benefits &amp; Outcomes</>}</h2>
              <p className="text-muted-foreground mt-1">{isAr ? 'قيمة قابلة للقياس تقدّمها برامج حوكمة ISC — استناداً إلى ارتباطات مَعِن عبر السعودية والأردن والخليج.' : "Measurable value delivered by ISC governance programmes — based on Ma'in's engagements across Saudi Arabia, Jordan, and the GCC."}</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[{ metric: '12–18%', label: 'Maverick spend reduction', labelAr: 'خفض الإنفاق خارج القنوات', detail: 'Typical SAR 200K–2M saving depending on organisation size', detailAr: 'توفير نموذجي بين 200 ألف و2 مليون ريال حسب حجم المنشأة' }, { metric: '35–50%', label: 'Approval cycle time reduction', labelAr: 'خفض زمن دورة الاعتماد', detail: 'Policy automation eliminates unnecessary approval layers', detailAr: 'أتمتة السياسات تُلغي طبقات الاعتماد غير الضرورية' }, { metric: '95%', label: 'External audit pass rate', labelAr: 'معدّل اجتياز التدقيق الخارجي', detail: 'Post-implementation clients pass procurement audits first time', detailAr: 'يجتاز العملاء بعد التنفيذ تدقيقات المشتريات من المرة الأولى' }, { metric: '>90%', label: 'Contract coverage achieved', labelAr: 'تغطية العقود المحقّقة', detail: 'Up from typical 60–65% — reducing leakage and risk exposure', detailAr: 'ارتفاعاً من نحو 60–65% — لتقليل التسرّب والانكشاف للمخاطر' }, { metric: '+20pts', label: 'Internal audit score improvement', labelAr: 'تحسّن درجة التدقيق الداخلي', detail: 'Typical improvement from 68% → 88% in 12 months', detailAr: 'تحسّن نموذجي من 68% إلى 88% خلال 12 شهراً' }, { metric: '30–40%', label: 'Supply chain incident reduction', labelAr: 'خفض حوادث سلسلة الإمداد', detail: 'Governance programme reduces incidents through accountability', detailAr: 'برنامج الحوكمة يقلّل الحوادث عبر المساءلة' }].map(b => (
                <Reveal key={b.label} delay={0.05}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                    <p className="text-3xl font-extrabold text-[#C9A84C]">{b.metric}</p>
                    <p className="font-bold text-primary">{isAr ? b.labelAr : b.label}</p>
                    <p className="text-xs text-muted-foreground">{isAr ? b.detailAr : b.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Case studies */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">{isAr ? 'إنجازات واقعية' : 'Real-World Achievements'}</h3>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {[{ title: 'Audit score 61% → 91%', titleAr: 'درجة التدقيق 61% ← 91%', client: 'Saudi Ministry-level entity', clientAr: 'جهة سعودية على مستوى وزارة', result: 'Procurement governance framework deployed across 6 subsidiaries. 47 SOPs authored. SAR 18M maverick spend identified and captured.', resultAr: 'نُشر إطار حوكمة المشتريات عبر 6 شركات تابعة. تأليف 47 إجراء تشغيل معياري. تحديد واستعادة 18 مليون ريال من الإنفاق خارج القنوات.', timeframe: '24 weeks', timeframeAr: '24 أسبوعاً' }, { title: 'Zero GTPL non-conformances', titleAr: 'صفر حالات عدم مطابقة لـ GTPL', client: 'Jordanian manufacturing group', clientAr: 'مجموعة تصنيع أردنية', result: 'Full policy architecture (8 policies, 23 SOPs), Iktva compliance programme. Passed GTPL audit with zero major non-conformances — first time in company history.', resultAr: 'هيكل سياسات كامل (8 سياسات، 23 إجراءً)، وبرنامج امتثال Iktva. اجتياز تدقيق GTPL بصفر حالات عدم مطابقة كبيرة — لأول مرة في تاريخ الشركة.', timeframe: '20 weeks', timeframeAr: '20 أسبوعاً' }, { title: 'Approval cycle 18 → 6 days', titleAr: 'دورة الاعتماد 18 ← 6 أيام', client: 'GCC energy company', clientAr: 'شركة طاقة خليجية', result: 'DoA framework redesign, ERP workflow automation. Contract coverage increased from 58% → 94%. Maverick spend reduced from 21% → 4%.', resultAr: 'إعادة تصميم إطار تفويض الصلاحيات وأتمتة مسار ERP. ارتفعت تغطية العقود من 58% إلى 94%. انخفض الإنفاق خارج القنوات من 21% إلى 4%.', timeframe: '16 weeks', timeframeAr: '16 أسبوعاً' }].map((cs, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div className="bg-gradient-to-br from-[#082C6B] to-[#0B3D91] rounded-2xl p-7 text-white flex flex-col h-full">
                    <Star className="w-6 h-6 text-[#C9A84C] mb-3" />
                    <p className="text-xl font-extrabold text-[#C9A84C] mb-3">{isAr ? cs.titleAr : cs.title}</p>
                    <p className="text-white/75 text-sm leading-relaxed flex-1">{isAr ? cs.resultAr : cs.result}</p>
                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
                      <span><Building2 className="w-3.5 h-3.5 inline mr-1" />{isAr ? cs.clientAr : cs.client}</span>
                      <span><Clock className="w-3.5 h-3.5 inline mr-1" />{isAr ? cs.timeframeAr : cs.timeframe}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-3xl p-10 text-white text-center">
              <Scale className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">{isAr ? 'ابدأ بتقييم حوكمة مجاني' : 'Start with a Free Governance Assessment'}</h3>
              <p className="text-white/70 max-w-xl mx-auto mb-6 text-sm">{isAr ? 'تقدّم ISC فحص صحة حوكمة مجانياً لمدة ساعتين — يقيّم حوكمة مشترياتك الحالية مقابل إطار ISC ويحدّد أهم 3 مكاسب سريعة لديك.' : 'ISC offers a complimentary 2-hour governance health check — scoring your current procurement governance against the ISC framework and identifying your top 3 quick wins.'}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold px-8">{isAr ? 'احجز تقييماً مجانياً' : 'Book Free Assessment'}</Button></Link>
                <Link href="/risk-management"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">{isAr ? 'عرض إدارة المخاطر ←' : 'View Risk Management →'}</Button></Link>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 6 — KPI Dashboard */}
        {activeTab === 6 && (
          <KPIDashboard slug="governance-compliance" />
        )}
      </div>
    </div>
  );
}
