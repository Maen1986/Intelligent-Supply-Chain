import React, { useState } from 'react';
import { motion  } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { ChevronRight, TrendingDown, TrendingUp, Clock, Shield, Leaf, Cpu , ChevronLeft } from 'lucide-react';

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const industries = [
  { key: 'All', en: 'All', ar: 'الكل' },
  { key: 'Manufacturing', en: 'Manufacturing', ar: 'التصنيع' },
  { key: 'Pharma', en: 'Pharma', ar: 'الأدوية' },
  { key: 'Retail', en: 'Retail', ar: 'التجزئة' },
  { key: 'Government', en: 'Government', ar: 'القطاع الحكومي' },
  { key: 'Logistics', en: 'Logistics', ar: 'الخدمات اللوجستية' },
  { key: 'Energy', en: 'Energy', ar: 'الطاقة' },
];

const cases = [
  {
    id: 1,
    client: 'Leading Saudi Pharmaceutical Group',
    clientAr: 'مجموعة أدوية سعودية رائدة',
    industry: 'Pharma',
    region: 'Saudi Arabia',
    regionAr: 'المملكة العربية السعودية',
    challenge: 'The client was operating with 47 unqualified active suppliers, no performance scorecard system, and procurement decisions being made reactively. Supplier invoice disputes were causing 30–45 day payment delays and eroding supplier trust.',
    challengeAr: 'كان العميل يعمل مع 47 مورّدًا نشطًا غير مؤهّل، دون نظام لبطاقات قياس الأداء، وكانت قرارات المشتريات تُتّخذ بردّ الفعل. وتسبّبت النزاعات على فواتير الموردين في تأخير السداد من 30 إلى 45 يومًا وتآكل ثقة الموردين.',
    approach: 'We designed and implemented a full Supplier Governance Framework including a tiered approved vendor list, quarterly performance reviews, and a contract standardisation programme aligned with SFDA regulatory requirements.',
    approachAr: 'صمّمنا ونفّذنا إطارًا متكاملاً لحوكمة الموردين شمل قائمة موردين معتمدين متعددة المستويات، ومراجعات أداء ربع سنوية، وبرنامجًا لتوحيد العقود بما يتوافق مع متطلبات هيئة الغذاء والدواء (SFDA).',
    results: [
      { metric: '23%', label: 'Reduction in procurement costs', labelAr: 'انخفاض في تكاليف المشتريات' },
      { metric: '47 → 18', label: 'Suppliers rationalised', labelAr: 'ترشيد عدد الموردين' },
      { metric: '94%', label: 'On-time payment rate achieved', labelAr: 'معدّل السداد في الوقت المحدّد' },
      { metric: '6 months', label: 'Full implementation timeline', labelAr: 'مدة التنفيذ الكامل (6 أشهر)' },
    ],
    icon: TrendingDown,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    tag: 'Supplier Governance',
    tagAr: 'حوكمة الموردين',
  },
  {
    id: 2,
    client: 'Jordanian Industrial Manufacturer',
    clientAr: 'شركة تصنيع صناعية أردنية',
    industry: 'Manufacturing',
    region: 'Jordan',
    regionAr: 'الأردن',
    challenge: 'Rapid production growth had outpaced the company\'s procurement capabilities. Spot purchasing was driving 18% cost premiums on raw materials, and no procurement approval workflow existed above JOD 5,000.',
    challengeAr: 'تجاوز النمو السريع في الإنتاج قدرات المشتريات لدى الشركة. وكان الشراء الفوري يؤدي إلى علاوات تكلفة بنسبة 18% على المواد الخام، ولم يكن هناك أي مسار لاعتماد المشتريات لما يتجاوز 5,000 دينار أردني.',
    approach: 'We built a strategic sourcing programme for the top 8 raw material categories, negotiated framework agreements with preferred suppliers, and deployed a purchase order workflow with delegated authority levels.',
    approachAr: 'أنشأنا برنامج توريد استراتيجي لأهم 8 فئات من المواد الخام، وتفاوضنا على اتفاقيات إطارية مع الموردين المفضّلين، ونشرنا مسار عمل لأوامر الشراء بمستويات صلاحيات مفوّضة.',
    results: [
      { metric: '18%', label: 'Raw material cost reduction', labelAr: 'خفض تكلفة المواد الخام' },
      { metric: '3 weeks', label: 'Average procurement cycle time saved', labelAr: 'اختصار زمن دورة المشتريات (3 أسابيع)' },
      { metric: '100%', label: 'PO compliance within 90 days', labelAr: 'الالتزام بأوامر الشراء خلال 90 يومًا' },
      { metric: '$1.2M', label: 'Annual savings identified', labelAr: 'وفورات سنوية محدّدة' },
    ],
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    tag: 'Procurement Excellence',
    tagAr: 'التميّز في المشتريات',
  },
  {
    id: 3,
    client: 'GCC Government Procurement Authority',
    clientAr: 'هيئة حكومية خليجية للمشتريات',
    industry: 'Government',
    region: 'GCC',
    regionAr: 'دول مجلس التعاون الخليجي',
    challenge: 'A government procurement entity needed to align its supplier onboarding, contract management, and Iktva localisation reporting with Vision 2030 mandates. Existing processes were manual and non-compliant with new regulations.',
    challengeAr: 'احتاجت جهة حكومية للمشتريات إلى مواءمة عمليات ضمّ الموردين وإدارة العقود وتقارير التوطين (اكتفاء) مع متطلبات رؤية 2030. وكانت العمليات القائمة يدوية وغير متوافقة مع اللوائح الجديدة.',
    approach: 'We delivered a comprehensive procurement transformation: redesigned the supplier registration and evaluation process, created Iktva-compliant contract templates, and built a governance framework for managing strategic national suppliers.',
    approachAr: 'قدّمنا تحوّلاً شاملاً في المشتريات: أعدنا تصميم عملية تسجيل الموردين وتقييمهم، وأنشأنا نماذج عقود متوافقة مع اكتفاء، وبنينا إطار حوكمة لإدارة الموردين الوطنيين الاستراتيجيين.',
    results: [
      { metric: '100%', label: 'Iktva regulatory compliance achieved', labelAr: 'الامتثال التنظيمي لاكتفاء' },
      { metric: '60%', label: 'Reduction in supplier onboarding time', labelAr: 'خفض زمن ضمّ الموردين' },
      { metric: '35+', label: 'Contract templates standardised', labelAr: 'نموذج عقد تمّ توحيده' },
      { metric: '2030', label: 'Vision alignment certified', labelAr: 'مواءمة معتمدة مع الرؤية' },
    ],
    icon: Shield,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    tag: 'Government Compliance',
    tagAr: 'الامتثال الحكومي',
  },
  {
    id: 4,
    client: 'Regional Retail Chain — 120+ Stores',
    clientAr: 'سلسلة تجزئة إقليمية — أكثر من 120 متجرًا',
    industry: 'Retail',
    region: 'Saudi Arabia',
    regionAr: 'المملكة العربية السعودية',
    challenge: 'Seasonal demand volatility was causing both overstock write-offs and 15–20% out-of-stock rates during peak periods. The supply chain had no integrated demand forecasting and relied entirely on manual re-ordering.',
    challengeAr: 'تسبّب تقلّب الطلب الموسمي في شطب فائض المخزون وارتفاع معدّلات نفاد المخزون إلى 15–20% خلال فترات الذروة. ولم يكن لدى سلسلة الإمداد تنبؤ متكامل بالطلب، واعتمدت كليًا على إعادة الطلب اليدوي.',
    approach: 'We restructured the category procurement model, designed a tiered safety stock policy by product velocity, and created a supplier SLA framework with penalty clauses for lead-time failures.',
    approachAr: 'أعدنا هيكلة نموذج مشتريات الفئات، وصمّمنا سياسة مخزون أمان متعددة المستويات وفق سرعة دوران المنتجات، وأنشأنا إطار اتفاقيات مستوى الخدمة (SLA) للموردين مع بنود جزائية لإخفاقات مهلة التوريد.',
    results: [
      { metric: '67%', label: 'Reduction in out-of-stock events', labelAr: 'انخفاض في حالات نفاد المخزون' },
      { metric: '31%', label: 'Inventory holding cost reduction', labelAr: 'خفض تكلفة الاحتفاظ بالمخزون' },
      { metric: '2.8x', label: 'Inventory turnover improvement', labelAr: 'تحسّن معدّل دوران المخزون' },
      { metric: 'SAR 4.5M', label: 'Annual working capital released', labelAr: 'رأس مال عامل سنوي محرّر' },
    ],
    icon: Clock,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    tag: 'Supply Chain Strategy',
    tagAr: 'استراتيجية سلسلة الإمداد',
  },
  {
    id: 5,
    client: 'International Logistics Operator',
    clientAr: 'مشغّل خدمات لوجستية دولي',
    industry: 'Logistics',
    region: 'Saudi Arabia / UAE',
    regionAr: 'السعودية / الإمارات',
    challenge: 'The company faced critical single-source dependencies on 12 equipment suppliers, creating severe operational risk. One supplier insolvency had already caused a 3-week service disruption and SAR 900K in client penalties.',
    challengeAr: 'واجهت الشركة اعتمادًا حرجًا على مصدر وحيد لدى 12 مورّدًا للمعدات، ما خلق مخاطر تشغيلية حادّة. وقد تسبّب إعسار أحد الموردين بالفعل في تعطّل الخدمة لمدة 3 أسابيع وغرامات للعملاء بلغت 900 ألف ريال.',
    approach: 'We conducted a full supply chain risk mapping exercise, developed a dual-sourcing strategy for all critical categories, and created a Business Continuity Plan with defined trigger thresholds and pre-negotiated contingency contracts.',
    approachAr: 'أجرينا عملية شاملة لرسم خريطة مخاطر سلسلة الإمداد، وطوّرنا استراتيجية توريد مزدوج لجميع الفئات الحرجة، وأنشأنا خطة استمرارية أعمال بحدود تفعيل محدّدة وعقود طوارئ مُتفاوض عليها مسبقًا.',
    results: [
      { metric: '12 → 0', label: 'Single-source critical dependencies', labelAr: 'اعتمادات حرجة على مصدر وحيد' },
      { metric: '48 hours', label: 'Maximum recovery time objective', labelAr: 'الحد الأقصى لزمن التعافي المستهدف' },
      { metric: 'SAR 2.1M', label: 'Avoided penalty exposure per year', labelAr: 'تجنّب التعرّض للغرامات سنويًا' },
      { metric: '100%', label: 'Tier-1 supplier BCP coverage', labelAr: 'تغطية خطة الاستمرارية لموردي المستوى الأول' },
    ],
    icon: Shield,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    tag: 'Risk Management',
    tagAr: 'إدارة المخاطر',
  },
  {
    id: 6,
    client: 'Saudi Energy Services Company',
    clientAr: 'شركة سعودية لخدمات الطاقة',
    industry: 'Energy',
    region: 'Saudi Arabia',
    regionAr: 'المملكة العربية السعودية',
    challenge: 'The client required ESG-aligned procurement practices to qualify for international project bids and attract European investment. Their supply chain had no sustainability KPIs, carbon tracking, or responsible sourcing standards.',
    challengeAr: 'احتاج العميل إلى ممارسات مشتريات متوافقة مع معايير الحوكمة البيئية والاجتماعية (ESG) للتأهّل لمناقصات المشاريع الدولية وجذب الاستثمار الأوروبي. ولم يكن لدى سلسلة الإمداد أي مؤشرات أداء للاستدامة أو تتبّع للكربون أو معايير للتوريد المسؤول.',
    approach: 'We designed a Sustainable Procurement Policy aligned with the UN Global Compact, built a carbon footprint baseline for the top 20 suppliers, and created a supplier code of conduct with annual assessment criteria.',
    approachAr: 'صمّمنا سياسة مشتريات مستدامة متوافقة مع الميثاق العالمي للأمم المتحدة، وأنشأنا خط أساس للبصمة الكربونية لأهم 20 مورّدًا، ووضعنا مدونة سلوك للموردين بمعايير تقييم سنوية.',
    results: [
      { metric: '28%', label: 'Supply chain carbon footprint reduction', labelAr: 'خفض البصمة الكربونية لسلسلة الإمداد' },
      { metric: '100%', label: 'Tier-1 supplier ESG assessment coverage', labelAr: 'تغطية تقييم ESG لموردي المستوى الأول' },
      { metric: '3', label: 'International tenders qualified for', labelAr: 'مناقصات دولية تمّ التأهّل لها' },
      { metric: 'A-', label: 'CDP Supply Chain score achieved', labelAr: 'درجة CDP لسلسلة الإمداد المحقّقة' },
    ],
    icon: Leaf,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    tag: 'Sustainability',
    tagAr: 'الاستدامة',
  },
];

export function CaseStudies() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? cases : cases.filter((c) => c.industry === filter);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-[#082C6B]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B] via-[#0B3D91] to-[#0B3D91]/70" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <span className="text-accent font-bold text-sm uppercase tracking-widest mb-3">{ar ? 'نتائج مثبتة' : 'Proven Results'}</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{ar ? 'دراسات الحالة' : 'Case Studies'}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            {ar
              ? 'تحديات حقيقية. نتائج قابلة للقياس. اكتشف كيف ساعدنا المؤسسات على تحويل سلاسل الإمداد لديها عبر دول الخليج وخارجها.'
              : 'Real challenges. Measurable outcomes. Explore how we have helped organisations transform their supply chains across the GCC and beyond.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 max-w-6xl">
        {/* Filter */}
        <RevealSection className="flex flex-wrap gap-2 mb-12 justify-center">
          {industries.map((ind) => (
            <button
              key={ind.key}
              onClick={() => setFilter(ind.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                filter === ind.key
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white text-foreground border-border hover:border-primary hover:text-primary'
              }`}
            >
              {ar ? ind.ar : ind.en}
            </button>
          ))}
        </RevealSection>

        {/* Cases */}
        <div className="space-y-10">
          {filtered.map((c, i) => (
            <RevealSection key={c.id} delay={i * 0.06}>
              <div className="bg-white rounded-3xl shadow-md border border-border overflow-hidden">
                <div className="grid lg:grid-cols-3">
                  {/* Left meta */}
                  <div className="bg-primary/5 border-r border-border p-8 flex flex-col gap-6">
                    <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center`}>
                      <c.icon className={`w-7 h-7 ${c.iconColor}`} />
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-accent/15 text-accent-foreground rounded-full text-xs font-bold uppercase tracking-wide border border-accent/30">
                        {ar ? c.tagAr : c.tag}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">{ar ? 'العميل' : 'Client'}</p>
                      <p className="font-bold text-primary text-lg leading-tight">{ar ? c.clientAr : c.client}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">{ar ? 'المنطقة' : 'Region'}</p>
                      <p className="font-semibold text-foreground">{ar ? c.regionAr : c.region}</p>
                    </div>
                    {/* Results */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      {c.results.map((r) => (
                        <div key={r.label} className="bg-white rounded-xl p-3 border border-border text-center shadow-sm">
                          <p className="text-xl font-extrabold text-primary leading-tight">{r.metric}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{ar ? r.labelAr : r.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right detail */}
                  <div className="lg:col-span-2 p-8 flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">{ar ? 'التحدّي' : 'The Challenge'}</h3>
                      <p className="text-foreground leading-relaxed">{ar ? c.challengeAr : c.challenge}</p>
                    </div>
                    <div>
                      <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">{ar ? 'نهجنا' : 'Our Approach'}</h3>
                      <p className="text-foreground leading-relaxed">{ar ? c.approachAr : c.approach}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
                      <Link href="/consultant">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                          {ar ? 'ناقش تحديًا مماثلاً' : 'Discuss a Similar Challenge'} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                      </Link>
                      <Link href="/diagnostic">
                        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                          {ar ? 'ابدأ التشخيص المجاني' : 'Start Free Diagnostic'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Bottom CTA */}
        <RevealSection className="mt-20 text-center bg-[#082C6B] rounded-3xl p-10 text-white">
          <Cpu className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">{ar ? 'هل أنت مستعد لكتابة قصة نجاحك؟' : 'Ready to Write Your Own Success Story?'}</h2>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            {ar
              ? 'ابدأ بتشخيصنا الذكي المجاني — تقييم من 5 خطوات يقدّم تقريرًا استراتيجيًا مصمّمًا لمؤسستك في أقل من 5 دقائق.'
              : 'Start with our free AI diagnostic — a 5-step assessment that delivers a strategic report tailored to your organisation in under 5 minutes.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/diagnostic">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                {ar ? 'ابدأ التشخيص الذكي المجاني' : 'Start Free AI Diagnostic'}
              </Button>
            </Link>
            <Link href="/consultant">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">
                {ar ? 'احجز استشارة' : 'Book a Consultation'}
              </Button>
            </Link>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
