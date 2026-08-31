import React from 'react';
import { motion  } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { Award, Globe, Users, TrendingUp, CheckCircle, ChevronRight, Linkedin, Mail, Phone, BadgeCheck , ChevronLeft } from 'lucide-react';

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

const values = [
  {
    icon: Award,
    title: 'Excellence Without Compromise',
    titleAr: 'التميّز دون تنازل',
    desc: 'Every engagement is delivered with the rigor of a Big Four firm and the agility of a boutique consultancy. We hold ourselves to the highest professional standards on every project.',
    descAr: 'يُنفَّذ كل مشروع بدقة شركات الاستشارات الكبرى ومرونة المكاتب المتخصّصة. نلتزم بأعلى المعايير المهنية في كل مشروع نتولاه.',
  },
  {
    icon: Globe,
    title: 'Deep Regional Intelligence',
    titleAr: 'معرفة إقليمية عميقة',
    desc: 'Our work is rooted in the GCC and Levant. We understand Saudi Vision 2030, Jordanian industrial policy, and the nuances of operating across Arabic-speaking markets.',
    descAr: 'تتجذّر أعمالنا في دول الخليج وبلاد الشام. نفهم رؤية السعودية 2030 والسياسة الصناعية الأردنية ودقائق العمل عبر الأسواق الناطقة بالعربية.',
  },
  {
    icon: Users,
    title: 'Client-First Partnership',
    titleAr: 'شراكة تضع العميل أولًا',
    desc: 'We do not deliver reports and walk away. We stay engaged through implementation, ensuring strategies translate into measurable operational improvements.',
    descAr: 'لا نكتفي بتسليم التقارير ثم نمضي. نبقى منخرطين حتى مرحلة التنفيذ، لنضمن ترجمة الاستراتيجيات إلى تحسينات تشغيلية قابلة للقياس.',
  },
  {
    icon: TrendingUp,
    title: 'AI-Augmented Human Expertise',
    titleAr: 'خبرة بشرية معزَّزة بالذكاء الاصطناعي',
    desc: 'We combine AI-powered diagnostics with seasoned human judgment. The result is faster insights, deeper analysis, and recommendations that are practical to execute.',
    descAr: 'نمزج بين التشخيص المدعوم بالذكاء الاصطناعي والخبرة البشرية العميقة. والنتيجة رؤى أسرع وتحليل أعمق وتوصيات عملية قابلة للتنفيذ.',
  },
];

const certifications = [
  { en: 'MCIPS — Chartered Institute of Procurement & Supply', ar: 'MCIPS — المعهد المعتمد للمشتريات والتوريد' },
  { en: 'CPSM — Certified Professional in Supply Management (ISM)', ar: 'CPSM — محترف معتمد في إدارة التوريد (ISM)' },
  { en: 'MIPP — Maersk International Procurement Programme, Denmark', ar: 'MIPP — برنامج ميرسك الدولي للمشتريات، الدنمارك' },
  { en: 'MSc Procurement & Supply Chain, Robert Gordon University (Distinction)', ar: 'ماجستير في المشتريات وسلسلة الإمداد، جامعة Robert Gordon (بامتياز)' },
  { en: 'PEX Process Excellence — Sponsor Level (36 hrs)', ar: 'PEX التميّز في العمليات — مستوى الراعي (36 ساعة)' },
  { en: 'Saudi Procurement Competition Law Practitioner', ar: 'ممارس معتمد لقانون المنافسة في المشتريات السعودية' },
  { en: 'Anti-Corruption & Competition Compliance Certified', ar: 'معتمد في الامتثال لمكافحة الفساد والمنافسة' },
  { en: 'Vision 2030 & Iktva Localisation Compliance', ar: 'الامتثال لرؤية 2030 وبرنامج التوطين اكتفاء' },
  { en: 'SAP MM/SCM · Ariba · MS Dynamics 365 · IFS · Odoo · JD Edwards', ar: 'SAP MM/SCM · Ariba · MS Dynamics 365 · IFS · Odoo · JD Edwards' },
];

const achievements = [
  { metric: '$100M+', label: 'Cumulative cost savings delivered', labelAr: 'إجمالي وفورات التكاليف المحقّقة' },
  { metric: '50%', label: 'TCO reduction achieved for clients', labelAr: 'خفض التكلفة الإجمالية للملكية للعملاء' },
  { metric: '20+', label: 'Years of cross-sector leadership', labelAr: 'عامًا من القيادة عبر القطاعات' },
  { metric: '#1', label: 'Jeddah Chamber among 28 KSA chambers', labelAr: 'غرفة جدة بين 28 غرفة في السعودية' },
];

const expertise = [
  { en: 'Procurement Transformation', ar: 'تحول المشتريات' },
  { en: 'Strategic Sourcing', ar: 'التوريد الاستراتيجي' },
  { en: 'Contract Lifecycle Management (CLM)', ar: 'إدارة دورة حياة العقود (CLM)' },
  { en: 'Supplier Relationship Management (SRM)', ar: 'إدارة علاقات الموردين (SRM)' },
  { en: 'Digital Procurement (SAP / Ariba / Dynamics 365)', ar: 'المشتريات الرقمية (SAP / Ariba / Dynamics 365)' },
  { en: 'Change Management', ar: 'إدارة التغيير' },
  { en: 'Vision 2030 & Iktva Compliance', ar: 'الامتثال لرؤية 2030 واكتفاء' },
  { en: 'Spend Analysis & Category Management', ar: 'تحليل الإنفاق وإدارة الفئات' },
  { en: 'S&OP & Demand Planning', ar: 'تخطيط المبيعات والعمليات وتخطيط الطلب' },
  { en: 'Supply Chain Risk & Resiliency', ar: 'مخاطر سلسلة الإمداد ومرونتها' },
  { en: 'Value Engineering', ar: 'هندسة القيمة' },
  { en: 'Lean & Agile Supply Chain', ar: 'سلسلة إمداد رشيقة ومَرِنة' },
  { en: 'Process Improvement & Policy Development', ar: 'تحسين العمليات وتطوير السياسات' },
  { en: 'Training & Capability Building', ar: 'التدريب وبناء القدرات' },
  { en: 'Stakeholder Engagement', ar: 'إشراك أصحاب المصلحة' },
  { en: 'Total Cost of Ownership (TCO)', ar: 'التكلفة الإجمالية للملكية (TCO)' },
  { en: 'Supplier Diversity & ESG', ar: 'تنوّع الموردين والحوكمة البيئية والاجتماعية (ESG)' },
  { en: 'ISO 9001 / 14001 / 45001 Implementation', ar: 'تطبيق ISO 9001 / 14001 / 45001' },
];

export function About() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  const missionStats = [
    { value: '$100M+', label: 'Cost Savings Delivered', labelAr: 'وفورات التكاليف المحقّقة' },
    { value: '15+', label: 'Countries Served', labelAr: 'دولة تمّت خدمتها' },
    { value: '20+', label: 'Years of Expertise', labelAr: 'عامًا من الخبرة' },
    { value: '98%', label: 'Client Satisfaction', labelAr: 'رضا العملاء' },
  ];

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/about-team.jpg" alt="I Supply Chain" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/92 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            {ar ? 'عن I Supply Chain' : 'About I Supply Chain'}
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            {ar
              ? 'مكتب استشارات متخصّص في سلاسل الإمداد مُصمَّم لدول الخليج والعالم — يجمع بين الخبرة العالمية والمعرفة الإقليمية العميقة.'
              : 'A boutique supply chain consultancy built for the GCC and worldwide — combining global expertise with deep regional intelligence.'}
          </p>
        </div>
      </div>

      {/* Mission */}
      <RevealSection className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'مهمتنا' : 'Our Mission'}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
                {ar
                  ? 'بناء سلاسل إمداد تعزّز التنافسية الوطنية'
                  : 'Building Supply Chains That Drive National Competitiveness'}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {ar
                  ? 'تأسّست I Supply Chain على قناعة راسخة: لا يمكن تحقيق طموحات دول الخليج — رؤية 2030 والتنويع الاقتصادي والتوطين الصناعي — إلا من خلال بنية تحتية لسلاسل الإمداد بمستوى عالمي. نحن موجودون لبناء تلك البنية، مؤسسةً تلو الأخرى.'
                  : "I Supply Chain was founded on a clear conviction: the GCC's ambitions — Vision 2030, economic diversification, industrial localisation — can only be achieved through world-class supply chain infrastructure. We exist to build that infrastructure, one organisation at a time."}
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {ar
                  ? 'نخدم الشركات الناشئة التي تبحث عن أول مورّديها، والمنشآت الصغيرة والمتوسطة التي توسّع عملياتها، والشركات متعددة الجنسيات التي تدخل السوق السعودية، والجهات الحكومية التي تُحدِّث وظائف مشترياتها. ولكل عميل نقدّم الشيء ذاته: وضوحًا استراتيجيًا ونتائج تشغيلية.'
                  : 'We serve startups finding their first suppliers, SMEs scaling their operations, multinational enterprises entering the Saudi market, and government entities modernising their procurement functions. For every client, we deliver the same thing: strategic clarity and operational results.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {missionStats.map((stat) => (
                <div key={stat.label} className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
                  <p className="text-4xl font-extrabold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{ar ? stat.labelAr : stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Values */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 max-w-6xl">
          <RevealSection className="text-center mb-14">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'ما نؤمن به' : 'What We Stand For'}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{ar ? 'قيمنا الأساسية' : 'Our Core Values'}</h2>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <RevealSection key={v.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary text-lg">{ar ? v.titleAr : v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{ar ? v.descAr : v.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team — Ma'in only */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <RevealSection className="text-center mb-14">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'الخبير وراء ISC' : 'The Expert Behind ISC'}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{ar ? 'تعرّف على المؤسِّس' : 'Meet the Founder'}</h2>
          </RevealSection>

          <RevealSection>
            <div className="bg-white rounded-3xl shadow-xl border border-border overflow-hidden">

              {/* Full-width photo */}
              <div className="relative w-full bg-[#071e3d]">
                <img
                  src="/brand/maen-photo-isc.jpg"
                  alt="Ma'in Alhaqash — Supply Chain Consultant"
                  className="w-full h-auto block"
                  style={{ maxHeight: '75vh', objectFit: 'contain', objectPosition: 'center' }}
                />
                {/* Supply chain badge overlay */}
                <div className="absolute top-4 right-4 bg-[#082C6B]/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-[#C9A84C]/40">
                  <p className="text-[#C9A84C]">{ar ? '+20 عامًا' : '20+ Years'}</p>
                  <p>{ar ? 'سلسلة الإمداد' : 'Supply Chain'}</p>
                </div>
              </div>

              {/* Content below */}
              <div className="p-8 lg:p-10 flex flex-col gap-6">
                {/* Name / title */}
                <div>
                  <p className="text-accent font-bold text-xs uppercase tracking-widest mb-1">{ar ? 'الأردن · الرياض، المملكة العربية السعودية' : 'Jordan · Riyadh, Saudi Arabia'}</p>
                  <h3 className="text-2xl font-extrabold text-primary">{ar ? 'مَعِن الحقّاش' : "Ma'in Alhaqash"}</h3>
                  <p className="text-muted-foreground font-medium text-sm mt-0.5">{ar ? 'مدير المشتريات وسلسلة الإمداد | مستشار أول' : 'Procurement & Supply Chain Director | Senior Consultant'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <BadgeCheck className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-accent font-bold text-xs tracking-wide">MSc · MCIPS · CPSM · MIPP</span>
                  </div>
                </div>

                {/* Achievement metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {achievements.map((a) => (
                    <div key={a.label} className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                      <p className="text-lg font-extrabold text-primary leading-tight">{a.metric}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{ar ? a.labelAr : a.label}</p>
                    </div>
                  ))}
                </div>

                {/* Bio */}
                <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                  {ar ? (
                    <>
                      <p>
                        مدير للمشتريات وسلسلة الإمداد ومستشار أول ثنائي اللغة (الإنجليزية/العربية)، يتمتّع بأكثر من 20 عامًا من القيادة عبر القطاعات شملت الحكومة والنفط والغاز والسلع الاستهلاكية سريعة الدوران والتصنيع ومشاريع الإنشاءات والهندسة والمشتريات (EPC). موضع ثقة BP وMaersk وKaplan والوزارات الحكومية السعودية — بما فيها وزارات التعليم والداخلية والمالية والدفاع — لتصميم برامج تحوّل نوعية بسجلٍّ ثابت من <strong>وفورات تراكمية تتجاوز 100 مليون دولار</strong>.
                      </p>
                      <p>
                        شارك مَعِن في تأسيس إدارتين عامّتين ضمن وكالة التحول المؤسسي بوزارة التعليم، وصمّم نموذج نضج التحوّل الخاص — الذي اعتُمد مرجعًا رسميًا للإصلاح في الوزارة. وبصفته مدير مشتريات المجموعة في محطات Maersk (الأردن وجورجيا)، بنى نظام مشتريات رقمي مركزي حقّق رؤية إنفاق بنسبة 100% وحقّق خفضًا سنويًا في التكاليف بلغ 5 ملايين دولار.
                      </p>
                      <p>
                        يحمل <strong>ماجستيرًا في إدارة المشتريات وسلسلة الإمداد من جامعة Robert Gordon في أبردين (بامتياز — الحائز على جائزة العميد)</strong>، بأطروحة حول تحليلات البيانات الضخمة واستدامة سلسلة الإمداد. وهو أيضًا متحدّث دولي قدّم عروضًا في مؤتمر CQI North Sea في اسكتلندا.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        A bilingual (English/Arabic) Procurement and Supply Chain Director and Senior Consultant with 20+ years of cross-sector leadership spanning government, oil & gas, FMCG, manufacturing, and EPC construction. Trusted by BP, Maersk, Kaplan, and Saudi government ministries — including MoE, MoI, MoF, and MoD — to architect transformational programmes with a consistent record of <strong>$100M+ in cumulative cost savings</strong>.
                      </p>
                      <p>
                        Ma'in co-founded two General Departments within the Ministry of Education's Institutional Transformation Agency and designed a proprietary Transformation Maturity Model — adopted as the Ministry's official reform benchmark. As Cluster Procurement Manager at Maersk Terminals (Jordan & Georgia), he built a centralised digital procurement system achieving 100% spend visibility and delivered $5M in annual cost reductions.
                      </p>
                      <p>
                        He holds an <strong>MSc in Procurement & Supply Chain Management from Robert Gordon University Aberdeen (Distinction — Dean's Award Winner)</strong>, with a thesis on Big Data Analytics and Supply Chain Sustainability. He is also an international speaker, having presented at the CQI North Sea Conference in Scotland.
                      </p>
                    </>
                  )}
                </div>

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-2">
                  {expertise.map((tag) => (
                    <span key={tag.en} className="px-3 py-1 bg-primary/8 text-primary rounded-full text-xs font-semibold border border-primary/15">
                      {ar ? tag.ar : tag.en}
                    </span>
                  ))}
                </div>

                {/* Contact */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                  <a href="mailto:maen.haqash@yahoo.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    <Mail className="w-4 h-4" /> maen.haqash@yahoo.com
                  </a>
                  <a href="tel:+966549479722" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    <Phone className="w-4 h-4" /> +966 549 479 722
                  </a>
                  <a href="https://linkedin.com/in/maen-alhaqash" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-[#082C6B]">
        <div className="container mx-auto px-4 max-w-5xl">
          <RevealSection className="text-center mb-10">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{ar ? 'المعايير والأطر' : 'Standards & Frameworks'}</span>
            <h2 className="text-3xl font-bold text-white mt-3">{ar ? 'الشهادات والامتثال' : 'Certifications & Compliance'}</h2>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div key={cert.en} className="flex items-center gap-3 bg-white/10 rounded-xl p-4 border border-white/15">
                <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                <span className="text-white font-medium text-sm">{ar ? cert.ar : cert.en}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <RevealSection className="py-20 bg-white text-center">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            {ar ? 'هل أنت مستعد لتحويل سلسلة الإمداد لديك؟' : 'Ready to Transform Your Supply Chain?'}
          </h2>
          <p className="text-muted-foreground text-lg">
            {ar
              ? 'احجز استشارة سرّية مع مَعِن مباشرةً. لا التزام — مجرّد حوار صريح حول تحديات سلسلة الإمداد لديك.'
              : "Book a confidential consultation with Ma'in directly. No commitment — just a candid conversation about your supply chain challenges."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8">
                {ar ? 'احجز استشارة' : 'Book a Consultation'} {ar ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
            <Link href="/diagnostic">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-bold px-8">
                {ar ? 'ابدأ التشخيص الذكي المجاني' : 'Start Free AI Diagnostic'}
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
