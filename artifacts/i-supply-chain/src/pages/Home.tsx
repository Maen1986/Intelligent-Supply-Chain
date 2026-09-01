import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight, Star, Quote, Cpu, Check, Clock, Users, Building2, Landmark, Rocket, TrendingUp, Eye, ShieldCheck, Brain, Scale, Radar, Lock } from 'lucide-react';

// ─── Animated counter hook ──────────────────────────────────────────────────
function useAnimatedCounter(target: number, shouldStart: boolean, duration = 2) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    const controls = animate(count, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return controls.stop;
  }, [shouldStart, target, duration, count]);

  return display;
}

// ─── Scroll section wrapper ──────────────────────────────────────────────────
function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Package card component ───────────────────────────────────────────────────
function PackageCard({
  pkg,
  index,
  wide = false,
  isAr = false,
}: {
  pkg: {
    name: string;
    nameAr: string;
    tag: string;
    tagAr: string;
    icon: React.ElementType;
    color: string;
    duration: string;
    durationAr: string;
    badge: string | null;
    badgeAr: string | null;
    forWho: string;
    forWhoAr: string;
    deliverables: string[];
    deliverablesAr: string[];
    outcomes: string[];
    outcomesAr: string[];
  };
  index: number;
  wide?: boolean;
  isAr?: boolean;
}) {
  const Icon = pkg.icon;
  const name = isAr ? pkg.nameAr : pkg.name;
  const tag = isAr ? pkg.tagAr : pkg.tag;
  const duration = isAr ? pkg.durationAr : pkg.duration;
  const badge = isAr ? pkg.badgeAr : pkg.badge;
  const forWho = isAr ? pkg.forWhoAr : pkg.forWho;
  const deliverables = isAr ? pkg.deliverablesAr : pkg.deliverables;
  const outcomes = isAr ? pkg.outcomesAr : pkg.outcomes;
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-white border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Colour bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: pkg.color }} />

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: pkg.color }}>
          {badge}
        </div>
      )}

      {/* Header */}
      <div className="px-7 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: pkg.color + '18' }}>
            <Icon className="w-5 h-5" style={{ color: pkg.color }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tag}</p>
            <h3 className="text-lg font-extrabold text-primary leading-tight">{name}</h3>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span><span className="font-semibold text-foreground">{isAr ? 'المدة:' : 'Duration:'}</span> {duration}</span>
        </div>

        {/* Who it's for */}
        <div className="mt-3 bg-muted rounded-lg px-4 py-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{isAr ? 'الأنسب لـ' : 'Best For'}</p>
          <p className="text-sm text-foreground leading-relaxed">{forWho}</p>
        </div>
      </div>

      {/* Deliverables */}
      <div className={`px-7 py-5 flex-1 ${wide ? 'grid sm:grid-cols-2 gap-x-8' : ''}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: pkg.color }}>
            {isAr ? 'ما يشمله' : "What's Included"}
          </p>
          <ul className="space-y-2.5">
            {deliverables.map((d, di) => (
              <li key={di} className="flex items-start gap-2.5 text-sm text-foreground">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: pkg.color + '18' }}>
                  <Check className="w-2.5 h-2.5" style={{ color: pkg.color }} />
                </div>
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Outcomes */}
        <div className={wide ? '' : 'mt-5'}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-muted-foreground">
            {isAr ? 'النتائج المتوقعة' : 'Expected Outcomes'}
          </p>
          <ul className="space-y-2">
            {outcomes.map((o, oi) => (
              <li key={oi} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-accent font-bold shrink-0 mt-0.5 rtl:rotate-180">→</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="px-7 pb-6 pt-2">
        <Link href="/consultant">
          <Button className="w-full font-bold group text-white"
            style={{ backgroundColor: pkg.color }}>
            {isAr ? 'استفسر عن هذه الباقة' : 'Enquire About This Package'}
            <ChevronRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Stats strip data ────────────────────────────────────────────────────────
const stats = [
  { value: 100, suffix: 'M+', label: 'Cost Savings Delivered (USD)', labelAr: 'وفورات محققة في التكاليف (دولار أمريكي)' },
  { value: 15, suffix: '+', label: 'Countries Served', labelAr: 'دولة تم خدمتها' },
  { value: 98, suffix: '%', label: 'Client Satisfaction', labelAr: 'رضا العملاء' },
  { value: 20, suffix: '+', label: 'Years of Expertise', labelAr: 'عاماً من الخبرة' },
];

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const count = useAnimatedCounter(value, isInView, 2.2);
  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-4xl md:text-5xl font-extrabold text-white tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-white/60 text-sm font-medium tracking-wide uppercase">{label}</span>
    </div>
  );
}

// ─── Hero service carousel ───────────────────────────────────────────────────
const heroSlides = [
  { src: '/brand/hero-service-journey.jpg?v=7', alt: 'ISC Services — Our Journey', label: 'Our Services Journey', labelAr: 'رحلة خدماتنا' },
  { src: '/brand/hero-service-advantage.jpg?v=3', alt: 'ISC — Supply Chain Advantage', label: 'Supply Chain Advantage', labelAr: 'ميزة سلسلة الإمداد التنافسية' },
  { src: '/brand/hero-service-maturity.jpg?v=4', alt: 'ISC Maturity Assessment', label: 'Maturity Assessment', labelAr: 'تقييم النضج' },
  { src: '/brand/hero-service-kpi.jpg?v=4', alt: 'ISC KPIs & Benchmarking', label: 'KPIs & Benchmarking', labelAr: 'مؤشرات الأداء والمقارنة المرجعية' },
  { src: '/brand/hero-service-tco.jpg?v=3', alt: 'ISC Total Cost of Ownership', label: 'Total Cost of Ownership (TCO)', labelAr: 'التكلفة الإجمالية للملكية' },
  { src: '/brand/hero-service-clm.jpg?v=4', alt: 'ISC Contract Intelligence', label: 'Contract Intelligence (CLM)', labelAr: 'إدارة دورة حياة العقود' },
  { src: '/brand/hero-service-srm.jpg?v=4', alt: 'ISC Supplier Intelligence', label: 'Supplier Intelligence (SRM)', labelAr: 'إدارة علاقات الموردين' },
  { src: '/brand/hero-service-risk.jpg?v=5', alt: 'ISC Supply Chain Resiliency & Risk', label: 'SC Resiliency & Risk', labelAr: 'مرونة سلسلة الإمداد وإدارة المخاطر' },
];

// Shared slide-rotation state, lifted out so the image (in the full-bleed
// photo section) and the badge/dots (in the flat section below) can stay in
// sync without nesting one inside the other.
function useHeroCarousel() {
  const [active, setActive] = useState(0);
  // Paused while the mouse is over the hero image, so a slide doesn't
  // change out from under someone who's actually looking at/reading it --
  // requested live, 1 Sep 2026. Resumes automatically on mouse-leave.
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % heroSlides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 15000);
    return () => clearInterval(id);
  }, [next, paused]);

  const goTo = (i: number) => setActive(i);

  return { active, goTo, pause: () => setPaused(true), resume: () => setPaused(false) };
}

// All 8 hero slides (final set, 1 Sep 2026) are 1774x887 infographic
// panels -- this is the shared box the hero section is sized to, so every
// slide fills it edge-to-edge at full viewport width with zero cropping
// and zero letterbox, all 8, not just one.
const HERO_ASPECT_RATIO = 1774 / 887;

// Guarantees the hero NEVER requires scroll to see in full on load, on any
// real viewport, WITHOUT ever pillarboxing -- the earlier height-only clamp
// shrank the section's height but kept it 100% viewport width, which on
// short/wide viewports left the box WIDER than HERO_ASPECT_RATIO; since
// object-fit:contain fits the image to whichever dimension the box
// under-supplies, that mismatch showed as visible black bars down both
// sides (reported live, 1 Sep 2026) even for the one slide that already
// matches HERO_ASPECT_RATIO exactly. Fix: shrink WIDTH and HEIGHT together,
// keeping the box locked to HERO_ASPECT_RATIO at all times, so contain has
// nothing to compensate for -- on an ordinary viewport this is identical to
// before (full width, natural height). Only on a viewport too short for
// full-width-at-this-ratio does the box narrow below 100% width (centered),
// trading a small amount of the section's own background showing on the
// sides for zero scroll and zero crop -- never a scroll, never a bar.
function useHeroFitBox(sectionRef: React.RefObject<HTMLElement | null>) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    function measure() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Document-relative top offset of the hero = combined height of
      // everything stacked above it (banner + header), independent of
      // current scroll position. rect.width is the section's own width,
      // which stays 100% of the viewport regardless of any previous
      // measurement (the section itself is never narrowed -- only the
      // inner image box is), so this is a stable full-viewport-width read.
      const viewportWidth = rect.width;
      const naturalHeight = viewportWidth / HERO_ASPECT_RATIO;
      // Guard against a transient bad read (window.innerHeight or layout not
      // yet settled -- observed to happen momentarily on some load paths).
      // A real viewport never has zero/negative width or space below the
      // header, so treat that as "not measured yet" and skip committing --
      // never lock the hero at zero size. The ResizeObserver below supplies
      // a good value as soon as layout actually settles.
      if (viewportWidth <= 0) return;
      // Owner's call (1 Sep 2026, eighth pass): full width now wins over
      // zero-scroll. The short/wide-viewport branch that used to shrink
      // WIDTH to fit "available" height traded a small scroll for visible
      // navy gutters down both sides of the hero -- reported live as "it
      // must be wider, closing most of the two sides." Full width, natural
      // height (viewportWidth / HERO_ASPECT_RATIO) always -- on an
      // ordinary viewport this is identical to before; on an unusually
      // short window the hero may now be taller than the visible area
      // above the fold, which the owner has said is the better trade.
      setBox(prev => (prev && prev.width === viewportWidth && prev.height === naturalHeight)
        ? prev
        : { width: viewportWidth, height: naturalHeight });
    }

    measure();

    // Re-measure whenever ANY layout change alters the space above the hero
    // -- the announcement banner's height:0->auto mount/dismiss animation,
    // a web-font swap reflow, or anything else that shifts chromeAbove. A
    // fixed setTimeout schedule (the previous approach) can't guarantee it
    // outlasts an animation duration or a slow/cached font load -- it was
    // observed live to leave the hero ~9px taller than the viewport (a
    // scroll sliver) whenever the banner's mount animation settled after
    // the last scheduled re-measure. Observing real layout via
    // ResizeObserver on the document body self-heals regardless of timing,
    // and also correctly re-fits the hero when the banner is dismissed
    // (which shrinks chromeAbove and should let the hero grow back).
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [sectionRef]);

  return box;
}

// The presentation image itself -- a full-bleed layer that fills the entire
// hero section, which is itself sized to this exact aspect ratio (see the
// <section> element in Home() below) so the image needs no letterboxing.
function HeroCarouselImage({ active, heroInView }: { active: number; heroInView: boolean }) {
  // Owner's call (31 Aug 2026, fourth pass): the hero slides are NOT plain
  // ambient photography -- they are infographic panels with headline text,
  // stat callouts and icon rows baked in right up to the top and bottom
  // edges. object-fit:cover (used in the third pass to kill scrolling by
  // forcing the image into a viewport-height-driven box) was cropping that
  // real content whenever the box's aspect ratio didn't match the image's
  // own ratio. Fixed in the fifth pass: the <section> itself is sized to
  // HERO_ASPECT_RATIO. As of the final image set (1 Sep 2026), all 8
  // slides are exactly 1774x887 -- pixel-identical to HERO_ASPECT_RATIO --
  // so this is now full width, zero crop, zero letterbox for all 8, not
  // just some. object-fit:contain stays in place as a safety net for any
  // future replacement image that doesn't share the exact ratio, backed
  // by a near-black navy fill that matches these images' own dark corners.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={heroInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-[#040910]"
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={active}
          initial={{ opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ opacity: { duration: 1.4, ease: [0.4, 0, 0.2, 1] }, scale: { duration: 15, ease: 'linear' } }}
          src={heroSlides[active].src}
          alt={heroSlides[active].alt}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ objectPosition: 'center center' }}
        />
      </AnimatePresence>
    </motion.div>
  );
}

// Badge + dot indicators -- lives in the flat section below the photo, "attached"
// to (but visually separate from) the presentation above it.
function HeroCarouselControls({ active, goTo, isAr = false }: { active: number; goTo: (i: number) => void; isAr?: boolean }) {
  // Owner's call (31 Aug 2026): the "AI-Powered / Supply Chain Expert" badge
  // above the dots was removed -- it added no information the page doesn't
  // already convey elsewhere (the section title + AI Control Tower widget),
  // so it was just clutter attached to the carousel. Dots only, now.
  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${i === active ? 'w-6 h-2.5 bg-accent' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
            aria-label={isAr ? heroSlides[i].labelAr : heroSlides[i].label}
          />
        ))}
      </div>
    </div>
  );
}


// ─── Main component ──────────────────────────────────────────────────────────
export function Home() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const solutions = [
    { photo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=380&fit=crop&q=80', title: 'Supply Chain Strategy', titleAr: 'استراتيجية سلسلة الإمداد', desc: 'End-to-end supply chain design and operational strategy aligned with business objectives.', descAr: 'تصميم متكامل لسلسلة الإمداد واستراتيجية تشغيلية متوافقة مع الأهداف المؤسسية.', slug: 'supply-chain-strategy' },
    { photo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=380&fit=crop&q=80', title: 'Procurement Excellence', titleAr: 'التميّز في المشتريات', desc: 'Strategic sourcing, vendor selection, and full procurement transformation programmes.', descAr: 'التوريد الاستراتيجي واختيار الموردين وبرامج تحوّل شاملة لوظيفة المشتريات.', slug: 'procurement-excellence' },
    { photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=380&fit=crop&q=80', title: 'Contract Lifecycle Management', titleAr: 'إدارة دورة حياة العقود', desc: 'Full contract lifecycle from drafting and negotiation through to renewal and compliance.', descAr: 'إدارة كاملة لدورة حياة العقود من الصياغة والتفاوض حتى التجديد والامتثال.', slug: 'contract-lifecycle-management' },
    { photo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=380&fit=crop&q=80', title: 'Supplier Relationship & Governance', titleAr: 'علاقات الموردين والحوكمة', desc: 'Supplier performance management, scorecards, and structured governance frameworks.', descAr: 'إدارة أداء الموردين وبطاقات التقييم وأطر حوكمة منظّمة.', slug: 'supplier-relationship-governance' },
    { photo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=380&fit=crop&q=80', title: 'Risk Management', titleAr: 'إدارة المخاطر', desc: 'Proactive identification, assessment, and mitigation of supply chain risks.', descAr: 'التحديد الاستباقي لمخاطر سلسلة الإمداد وتقييمها والتخفيف من آثارها.', slug: 'risk-management-solution' },
    { photo: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=600&h=380&fit=crop&q=80', title: 'Sustainability & ESG', titleAr: 'الاستدامة والحوكمة البيئية والاجتماعية (ESG)', desc: 'ESG integration, circular procurement practices, and Scope 3 emissions reporting.', descAr: 'دمج معايير ESG وممارسات المشتريات الدائرية وإعداد تقارير انبعاثات النطاق الثالث.', slug: 'sustainability-esg' },
    { photo: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=380&fit=crop&q=80', title: 'Resiliency', titleAr: 'المرونة التشغيلية', desc: 'Building adaptive, disruption-resistant supply chains with dual-source strategies.', descAr: 'بناء سلاسل إمداد مرنة وقادرة على مقاومة الاضطرابات عبر استراتيجيات التوريد المزدوج.', slug: 'resiliency' },
    { photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=380&fit=crop&q=80', title: 'Digital Transformation', titleAr: 'التحول الرقمي', desc: 'Technology enablement, ERP optimisation (SAP MM/SCM, Ariba, Dynamics 365, IFS, Odoo), and digital supply chain maturity roadmaps.', descAr: 'تمكين التقنية وتحسين أنظمة تخطيط الموارد (SAP MM/SCM وAriba وDynamics 365 وIFS وOdoo) وخرائط طريق النضج الرقمي لسلسلة الإمداد.', slug: 'digital-transformation' },
    { photo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=380&fit=crop&q=80', title: 'Value Engineering', titleAr: 'هندسة القيمة', desc: 'Systematic function analysis and cost-reduction techniques that eliminate non-value-added spend without compromising quality or performance.', descAr: 'تحليل منهجي للوظائف وأساليب لخفض التكاليف تلغي الإنفاق غير المضيف للقيمة دون المساس بالجودة أو الأداء.', slug: 'value-engineering' },
    { photo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=380&fit=crop&q=80', title: 'Lean & Agile Supply Chain', titleAr: 'سلسلة الإمداد الرشيقة والمرنة', desc: 'Waste elimination, flow optimisation, and agile replenishment models that cut lead times, reduce inventory, and increase throughput.', descAr: 'إزالة الهدر وتحسين التدفق ونماذج تجديد مخزون رشيقة تقلّص مهل التوريد وتخفض المخزون وترفع الإنتاجية.', slug: 'lean-agile-supply-chain' },
    { photo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=380&fit=crop&q=80', title: 'Process Improvement & Policy', titleAr: 'تحسين العمليات والسياسات', desc: 'End-to-end process redesign, SOP authoring, workflow automation, and procurement policy development aligned with Saudi regulations.', descAr: 'إعادة تصميم شاملة للعمليات وإعداد إجراءات التشغيل المعيارية وأتمتة سير العمل وتطوير سياسات المشتريات بما يتوافق مع الأنظمة السعودية.', slug: 'process-improvement-policy' },
    { photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=380&fit=crop&q=80', title: 'Training & Capability Building', titleAr: 'التدريب وبناء القدرات', desc: 'Bespoke procurement and supply chain training programmes — workshops, coaching, and knowledge transfer — delivered to teams across government, energy, and private sector.', descAr: 'برامج تدريب مصمّمة خصيصاً للمشتريات وسلسلة الإمداد — ورش عمل وإرشاد ونقل معرفة — تُقدَّم لفرق العمل في القطاعات الحكومية والطاقة والخاص.', slug: 'training-capability-building' },
  ];

  const industries: { en: string; ar: string }[] = [
    { en: 'Manufacturing', ar: 'التصنيع' }, { en: 'Marine', ar: 'القطاع البحري' }, { en: 'Retail', ar: 'التجزئة' },
    { en: 'FMCG', ar: 'السلع الاستهلاكية سريعة الدوران' }, { en: 'Pharma', ar: 'الأدوية' }, { en: 'Logistics', ar: 'الخدمات اللوجستية' },
    { en: 'Energy', ar: 'الطاقة' }, { en: 'Construction', ar: 'الإنشاءات' }, { en: 'Tech', ar: 'التقنية' },
    { en: 'Government', ar: 'القطاع الحكومي' }, { en: 'Ecommerce', ar: 'التجارة الإلكترونية' },
    { en: 'Food & Beverage', ar: 'الأغذية والمشروبات' }, { en: 'Healthcare', ar: 'الرعاية الصحية' },
  ];

  const packages = [
    {
      name: 'Startup Launchpad',
      nameAr: 'منصة انطلاق الشركات الناشئة',
      tag: 'New & Early-Stage',
      tagAr: 'الشركات الجديدة والمبكرة',
      icon: Rocket,
      color: '#0B3D91',
      duration: '4 weeks',
      durationAr: '4 أسابيع',
      badge: null,
      badgeAr: null,
      forWho: 'Companies under 3 years old or with fewer than 50 employees establishing supply chain processes for the first time.',
      forWhoAr: 'الشركات التي يقل عمرها عن 3 سنوات أو التي تضم أقل من 50 موظفاً وتؤسس عمليات سلسلة الإمداد لأول مرة.',
      deliverables: [
        'Supply chain maturity diagnostic (self-assessment + consultant review)',
        'Procurement policy template & standard operating procedures',
        'Supplier onboarding checklist & qualification criteria',
        'Basic vendor scoring matrix for top 10 suppliers',
        '1 × 90-minute strategy session with Ma\'in Alhaqash',
        '15-page strategic report with prioritised 90-day action plan',
      ],
      deliverablesAr: [
        'تشخيص نضج سلسلة الإمداد (تقييم ذاتي + مراجعة استشارية)',
        'قالب سياسة المشتريات وإجراءات التشغيل المعيارية',
        'قائمة تحقق لإدماج الموردين ومعايير التأهيل',
        'مصفوفة تقييم أساسية لأفضل 10 موردين',
        'جلسة استراتيجية واحدة مدتها 90 دقيقة مع معن الحقش',
        'تقرير استراتيجي من 15 صفحة مع خطة عمل مُرتّبة الأولويات لمدة 90 يوماً',
      ],
      outcomes: ['Structured procurement process from day one', 'Avoid the common early-stage sourcing mistakes', '90-day implementation roadmap you can execute independently'],
      outcomesAr: ['عملية مشتريات منظّمة منذ اليوم الأول', 'تجنّب أخطاء التوريد الشائعة في المراحل المبكرة', 'خارطة طريق تنفيذية لمدة 90 يوماً يمكنك تنفيذها باستقلالية'],
    },
    {
      name: 'SME Growth',
      nameAr: 'نمو المنشآت الصغيرة والمتوسطة',
      tag: 'Growing Businesses',
      tagAr: 'الشركات النامية',
      icon: TrendingUp,
      color: '#C9A84C',
      duration: '6–8 weeks',
      durationAr: '6–8 أسابيع',
      badge: 'Most Popular',
      badgeAr: 'الأكثر طلباً',
      forWho: 'Businesses with 50–250 employees experiencing growth pressure on procurement, inventory, or supplier performance.',
      forWhoAr: 'الشركات التي تضم من 50 إلى 250 موظفاً وتواجه ضغوط النمو على المشتريات أو المخزون أو أداء الموردين.',
      deliverables: [
        'Full AI-powered diagnostic across 5 supply chain dimensions',
        'Category management framework for top 5 spend categories',
        'Supplier segmentation model (strategic / preferred / transactional)',
        'Savings opportunity analysis with quantified potential',
        'Procurement KPI dashboard template with targets',
        '3 × 90-minute consultation sessions (strategy + review + sign-off)',
        '30-page strategy report + 6-month implementation roadmap',
      ],
      deliverablesAr: [
        'تشخيص شامل مدعوم بالذكاء الاصطناعي عبر 5 أبعاد لسلسلة الإمداد',
        'إطار إدارة الفئات لأهم 5 فئات إنفاق',
        'نموذج تصنيف الموردين (استراتيجي / مفضّل / معاملاتي)',
        'تحليل فرص التوفير مع تقدير كمّي للإمكانات',
        'قالب لوحة مؤشرات أداء المشتريات مع مستهدفات',
        '3 جلسات استشارية مدة كل منها 90 دقيقة (استراتيجية + مراجعة + اعتماد)',
        'تقرير استراتيجي من 30 صفحة + خارطة طريق تنفيذية لمدة 6 أشهر',
      ],
      outcomes: ['Typical 10–20% cost reduction in addressable spend', 'Clear supplier tiers with differentiated management', 'Savings tracking mechanism operational from day one'],
      outcomesAr: ['خفض التكاليف عادةً بنسبة 10–20% ضمن الإنفاق القابل للمعالجة', 'مستويات موردين واضحة مع إدارة متمايزة', 'آلية لتتبّع التوفير جاهزة للعمل منذ اليوم الأول'],
    },
    {
      name: 'Mid-Market Excellence',
      nameAr: 'التميّز للشركات المتوسطة',
      tag: 'Scaling Organisations',
      tagAr: 'المنظمات المتوسّعة',
      icon: Building2,
      color: '#0B6E4F',
      duration: '8–12 weeks',
      durationAr: '8–12 أسبوعاً',
      badge: null,
      badgeAr: null,
      forWho: 'Organisations with 250–1,000 employees seeking competitive advantage through supply chain optimisation.',
      forWhoAr: 'المنظمات التي تضم من 250 إلى 1,000 موظف وتسعى إلى ميزة تنافسية عبر تحسين سلسلة الإمداد.',
      deliverables: [
        'Full 8-segment maturity assessment with GCC & global benchmarking',
        'Category management programme across all significant spend',
        'Contract lifecycle management setup: templates, register & approval workflow',
        'Supplier performance scorecard system (SRM Lite)',
        'Supply chain risk register with tier-1 mapping & BCP framework',
        '6 × consultation sessions including C-suite workshop',
        'Executive presentation deck + full implementation roadmap',
        'Optional: technology tool selection shortlist (CLM / SRM / analytics)',
      ],
      deliverablesAr: [
        'تقييم نضج كامل من 8 أقسام مع مقارنة مرجعية خليجية وعالمية',
        'برنامج إدارة الفئات يشمل جميع الإنفاق الجوهري',
        'إعداد إدارة دورة حياة العقود: قوالب وسجل ومسار اعتماد',
        'نظام بطاقات تقييم أداء الموردين (SRM Lite)',
        'سجل مخاطر سلسلة الإمداد مع تحديد موردي المستوى الأول وإطار استمرارية الأعمال',
        '6 جلسات استشارية تشمل ورشة عمل للإدارة التنفيذية العليا',
        'عرض تقديمي تنفيذي + خارطة طريق تنفيذية كاملة',
        'اختياري: قائمة مختصرة لاختيار الأدوات التقنية (CLM / SRM / التحليلات)',
      ],
      outcomes: ['Benchmarked maturity score vs GCC peers', 'Risk gaps identified and mitigation plans assigned', 'Board-ready strategy presentation on completion'],
      outcomesAr: ['درجة نضج مقارنة مرجعياً بالنظراء في الخليج', 'تحديد فجوات المخاطر وإسناد خطط التخفيف', 'عرض استراتيجي جاهز لمجلس الإدارة عند الإنجاز'],
    },
    {
      name: 'Enterprise Transformation',
      nameAr: 'التحول المؤسسي',
      tag: 'Large Organisations',
      tagAr: 'المؤسسات الكبرى',
      icon: Users,
      color: '#5B21B6',
      duration: 'Custom — typically 3–6 months',
      durationAr: 'مخصّص — عادةً 3–6 أشهر',
      badge: null,
      badgeAr: null,
      forWho: 'Corporates, multinationals, and large family businesses requiring end-to-end supply chain transformation with dedicated senior support.',
      forWhoAr: 'الشركات الكبرى والمتعددة الجنسيات والشركات العائلية الكبيرة التي تحتاج إلى تحول متكامل لسلسلة الإمداد مع دعم متخصص من كبار الخبراء.',
      deliverables: [
        'End-to-end transformation programme across all 8 supply chain domains',
        'Dedicated engagement lead: Ma\'in Alhaqash MCIPS · CPSM (primary contact)',
        'Full diagnostic, strategy design, and phased implementation support',
        'Change management framework & stakeholder engagement plan',
        'Technology evaluation, vendor RFP, and selection support',
        'Monthly board-level reporting with KPI dashboards',
        'Unlimited consultation access for the duration of the engagement',
        'Monthly retainer option available post-engagement',
      ],
      deliverablesAr: [
        'برنامج تحول متكامل يشمل جميع مجالات سلسلة الإمداد الثمانية',
        'قائد ارتباط متخصص: معن الحقش MCIPS · CPSM (جهة الاتصال الرئيسية)',
        'تشخيص كامل وتصميم استراتيجي ودعم تنفيذ على مراحل',
        'إطار إدارة التغيير وخطة إشراك أصحاب المصلحة',
        'تقييم التقنية وإعداد كراسات طلب العروض ودعم الاختيار',
        'تقارير شهرية على مستوى مجلس الإدارة مع لوحات مؤشرات الأداء',
        'وصول غير محدود للاستشارات طوال مدة الارتباط',
        'خيار عقد شهري متاح بعد انتهاء الارتباط',
      ],
      outcomes: ['Comprehensive maturity uplift across all supply chain dimensions', 'Technology and process transformation with measurable ROI', 'Capability transfer to internal teams'],
      outcomesAr: ['ارتقاء شامل بمستوى النضج عبر جميع أبعاد سلسلة الإمداد', 'تحول تقني وعملياتي بعائد استثمار قابل للقياس', 'نقل القدرات إلى الفرق الداخلية'],
    },
    {
      name: 'Government & Public Sector',
      nameAr: 'القطاع الحكومي والعام',
      tag: 'Ministries · SOEs · Vision 2030',
      tagAr: 'الوزارات · الشركات المملوكة للدولة · رؤية 2030',
      icon: Landmark,
      color: '#B91C1C',
      duration: 'Custom — project-based',
      durationAr: 'مخصّص — حسب المشروع',
      badge: null,
      badgeAr: null,
      forWho: 'Saudi and GCC government ministries, sovereign entities, state-owned enterprises, and Vision 2030 programme offices.',
      forWhoAr: 'الوزارات الحكومية السعودية والخليجية والجهات السيادية والشركات المملوكة للدولة ومكاتب برامج رؤية 2030.',
      deliverables: [
        'Vision 2030 / national development strategy procurement alignment',
        'Saudisation (Nitaqat) & GCC nationalisation compliance framework',
        'Government procurement regulation advisory (NCAR / GPSD aligned)',
        'Public sector supplier development & local content programme',
        'ESG and sustainability reporting framework for government entities',
        'Audit-readiness and governance framework for procurement function',
        'Bilingual (Arabic / English) deliverables and executive reporting',
        'Policy drafting support for procurement manuals and regulations',
      ],
      deliverablesAr: [
        'مواءمة المشتريات مع رؤية 2030 واستراتيجيات التنمية الوطنية',
        'إطار الامتثال للسعودة (نطاقات) والتوطين الخليجي',
        'استشارات أنظمة المشتريات الحكومية (بما يتوافق مع NCAR / GPSD)',
        'برنامج تطوير موردي القطاع العام والمحتوى المحلي',
        'إطار إعداد تقارير الاستدامة ومعايير ESG للجهات الحكومية',
        'إطار الجاهزية للتدقيق وحوكمة وظيفة المشتريات',
        'مخرجات وتقارير تنفيذية ثنائية اللغة (عربي / إنجليزي)',
        'دعم صياغة السياسات لأدلة ولوائح المشتريات',
      ],
      outcomes: ['Regulatory compliance & audit readiness', 'National content targets met with documented evidence', 'Arabic-language policy documents and reporting'],
      outcomesAr: ['الامتثال التنظيمي والجاهزية للتدقيق', 'تحقيق مستهدفات المحتوى الوطني بأدلة موثّقة', 'وثائق سياسات وتقارير باللغة العربية'],
    },
  ];

  // Real, attributed client testimonials go here once clients consent to
  // being quoted. Intentionally empty — see the Testimonials section below
  // for why (previous content here was AI-generated, not real).
  const testimonials: {
    quote: string; quoteAr: string;
    name: string; nameAr: string;
    company: string; companyAr: string;
    region: string; regionAr: string;
    stars: number;
  }[] = [];

  // Hero headline stagger
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const { active: heroActive, goTo: heroGoTo, pause: heroPause, resume: heroResume } = useHeroCarousel();
  const heroBox = useHeroFitBox(heroRef);

  return (
    <div className="w-full flex flex-col min-h-screen">

      {/* ── Hero: full-bleed photo slide, edge-to-edge, nothing else in this section ──
          Owner's call (1 Sep 2026, seventh pass): full width AND zero scroll
          AND zero crop, all three, on every real viewport. useHeroFitBox
          (above) sizes this section's box to HERO_ASPECT_RATIO at all times
          -- full viewport width whenever that fits within the space below
          the banner+header, narrower-and-centered (never letterboxed by
          object-fit:contain, never a scroll) on the rare viewport too short
          for that. See useHeroFitBox's own comment for why width and height
          must shrink together, not height alone. */}
      <section
        ref={heroRef}
        // Solid #082C6B (not the earlier from-[#0B3D91] gradient) -- unified
        // with the header and footer's own navy so there's no visible seam
        // between the header bar and the hero section, reported live via
        // screenshot as two distinct blues stacked on top of each other.
        className="relative w-full text-white overflow-hidden bg-[#082C6B]"
        style={heroBox !== null ? { height: `${heroBox.height}px` } : { aspectRatio: `${HERO_ASPECT_RATIO}` }}
        onMouseEnter={heroPause}
        onMouseLeave={heroResume}
      >
        {/* Inner image box -- locked to HERO_ASPECT_RATIO at all times and
            centered. On an ordinary viewport this spans the full section
            width (identical to before). Only narrows on a short/wide
            viewport, in which case the section's own solid navy
            background (not black, not a crop, not a scroll) shows on
            either side instead of a letterbox. */}
        <div
          className="relative h-full mx-auto"
          style={heroBox !== null ? { width: `${heroBox.width}px` } : { width: '100%' }}
        >
          <HeroCarouselImage active={heroActive} heroInView={heroInView} />
        </div>

        {/* Headline kept for SEO/accessibility (heading hierarchy), hidden visually per design */}
        <h1 className="sr-only">{t('hero.headline')}</h1>
      </section>

      {/* ── Flat section: badge/dots + copy + CTAs, "attached" below the presentation ── */}
      <section className="w-full bg-[#082C6B] py-12 text-white text-center">
        <div className="mx-auto px-4 flex flex-col items-center gap-6" style={{ maxWidth: '760px' }}>

          <HeroCarouselControls active={heroActive} goTo={heroGoTo} isAr={isAr} />

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed"
          >
            {t('hero.subheadline')}
          </motion.p>

          {/* CTA buttons — immediately below the subheadline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/diagnostic">
              <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg min-h-[52px] text-base">
                {t('hero.ctaPrimary')}
              </Button>
            </Link>
            <Link href="/consultant">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/70 text-white hover:bg-white hover:text-primary font-bold px-8 min-h-[52px] text-base">
                {t('hero.ctaSecondary')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link href="/csr" className="text-sm text-white/60 hover:text-accent underline underline-offset-4 font-medium inline-flex items-center gap-1 transition-colors">
              {t('hero.ctaTertiary')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="w-full bg-[#0B3D91] py-10 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} value={s.value} suffix={s.suffix} label={isAr ? s.labelAr : s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Maturity Journey (#165, 21 Aug 2026) ─────────────────────────────
          Visibility -> Control -> Intelligence -> Decision -> Prediction.
          Every stage but the last maps to a real, live, clickable feature;
          Prediction is honestly labeled as roadmap, not implied as live --
          per the platform's standing "never fake it" rule. Additive
          narrative layer, doesn't touch the existing Reactive->Optimised
          maturity-score taxonomy used elsewhere (maturityScoring.ts). ── */}
      <section className="w-full bg-[#0A1628] py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-4">
              {isAr ? '🧭 مسار النضج' : '🧭 The Maturity Journey'}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              {isAr ? 'من الرؤية إلى التنبؤ' : 'From Visibility to Prediction'}
            </h2>
            <p className="text-white/50 text-base max-w-2xl mx-auto mt-3">
              {isAr
                ? 'كل أداة في آي سبلاي تشين تنقلك خطوة أعلى في هذا المسار — إليك ما تفتحه كل مرحلة اليوم.'
                : "Every I Supply Chain tool moves you one rung up this ladder — here's what each stage unlocks today."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(isAr
              ? [
                  { icon: Eye,         stage: 'الرؤية',      tool: 'التشخيص المجاني',     href: '/diagnostic',      live: true,  body: 'اكتشف أين تقف خلال 60 ثانية — بدون تسجيل.' },
                  { icon: ShieldCheck, stage: 'التحكّم',      tool: 'تقييم النضج',        href: '/maturity',        live: true,  body: 'قيّم 8 مجالات مقابل معايير الخليج المرجعية.' },
                  { icon: Brain,       stage: 'الذكاء',       tool: 'برج التحكم',         href: '/command-center',  live: true,  body: 'رادار المقارنة، حاسبة التوفير، مؤشر المخاطر.' },
                  { icon: Scale,       stage: 'القرار',       tool: 'مختبر القرار',        href: '/decision-lab',    live: true,  body: 'قارن خياراتك بمعايير مرجّحة وترتيب واضح.' },
                  { icon: Radar,       stage: 'التنبؤ',       tool: 'قريباً',              href: null,               live: false, body: 'إنذار مبكر قائم على اتجاهات تقييماتك السابقة.' },
                ]
              : [
                  { icon: Eye,         stage: 'Visibility',   tool: 'Free Diagnostic',    href: '/diagnostic',      live: true,  body: 'See where you stand in 60 seconds — no sign-up.' },
                  { icon: ShieldCheck, stage: 'Control',      tool: 'Maturity Assessment',href: '/maturity',        live: true,  body: 'Score 8 domains against GCC benchmarks.' },
                  { icon: Brain,       stage: 'Intelligence', tool: 'Control Tower',      href: '/command-center',  live: true,  body: 'Benchmark radar, savings calculator, risk score.' },
                  { icon: Scale,       stage: 'Decision',     tool: 'Decision Lab',       href: '/decision-lab',    live: true,  body: 'Compare your options on weighted criteria, clearly ranked.' },
                  { icon: Radar,       stage: 'Prediction',   tool: 'Coming Soon',        href: null,               live: false, body: 'Early-warning trend detection from your assessment history.' },
                ]
            ).map((s, i) => {
              const Icon = s.icon;
              const card = (
                <div className={`h-full rounded-2xl border p-5 transition-all ${s.live ? 'bg-white/5 border-white/10 hover:border-[#C9A84C]/40 hover:bg-white/10' : 'bg-white/[0.02] border-white/5 border-dashed'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.live ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-white/5 text-white/30'}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    {!s.live && <Lock className="w-3.5 h-3.5 text-white/25" />}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${s.live ? 'text-[#C9A84C]' : 'text-white/25'}`}>{i + 1}. {s.stage}</p>
                  <p className={`text-sm font-bold mb-1.5 ${s.live ? 'text-white' : 'text-white/40'}`}>{s.tool}</p>
                  <p className={`text-xs leading-relaxed ${s.live ? 'text-white/50' : 'text-white/25'}`}>{s.body}</p>
                  {!s.live && (
                    <p className="text-[10px] text-white/25 mt-2 uppercase tracking-wider font-bold">
                      {isAr ? 'على خارطة الطريق' : 'On our roadmap'}
                    </p>
                  )}
                </div>
              );
              return s.href ? (
                <Link key={i} href={s.href} className="block h-full">{card}</Link>
              ) : (
                <div key={i} className="h-full">{card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── About / Visual Strip ─────────────────────────────────────────── */}
      <RevealSection className="w-full bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Photo */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/brand/about-team.jpg"
                alt="I Supply Chain strategy team"
                className="w-full h-80 lg:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#082C6B]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 rtl:left-auto rtl:right-6 text-white">
                <p className="text-sm font-medium text-white/80">{isAr ? 'الاستشارات الاستراتيجية' : 'Strategic Advisory'}</p>
                <p className="text-xl font-bold">{isAr ? 'التميّز العالمي في سلاسل الإمداد' : 'Global Supply Chain Excellence'}</p>
              </div>
            </div>
            {/* Text */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">
                {isAr ? 'لماذا I Supply Chain؟' : 'Why I Supply Chain?'}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {isAr
                  ? 'حين تحمل قرارات سلسلة الإمداد تبعات بملايين الريالات، لا تكفي النصائح العامة. تجلب ISC أكثر من 20 عاماً من الخبرة الميدانية في الخليج ومنطقة الشرق الأوسط وشمال إفريقيا — من إصلاح المشتريات ضمن رؤية السعودية 2030 إلى ديناميكيات البوابة التجارية في الأردن — مدمجةً مع الذكاء الاصطناعي الذي يختصر أسابيع من التحليل إلى دقائق من الرؤى.'
                  : "When supply chain decisions carry SAR-million consequences, generic advice won't cut it. ISC brings 20+ years of hands-on GCC and MENA expertise — from Saudi Vision 2030 procurement reform to Jordan's trade gateway dynamics — fused with AI that compresses weeks of analysis into minutes of insight."}
              </p>
              <ul className="space-y-3">
                {(isAr
                  ? [
                      'تشخيصات مدعومة بالذكاء الاصطناعي تكشف فرص توفير بملايين الريالات خلال دقائق',
                      'مستشارون كبار بخبرة تتجاوز 20 عاماً في سلاسل الإمداد بالخليج والشرق الأوسط وشمال إفريقيا',
                      'منهجيات متوافقة مع رؤية السعودية 2030 وCIPS وAPICS SCOR ومعايير ESG',
                      'من الخارطة الاستراتيجية إلى التنفيذ الميداني — نبقى معكم حتى تظهر النتائج',
                    ]
                  : [
                      'AI diagnostics that surface SAR-million savings opportunities in minutes',
                      'Senior consultants with 20+ years of GCC & MENA supply chain experience',
                      'Saudi Vision 2030, CIPS, APICS SCOR & ESG-aligned methodologies',
                      'From strategic roadmap to hands-on implementation — we stay until results show',
                    ]
                ).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground">
                    <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/consultant">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6">
                  {isAr ? 'احجز استشارة' : 'Book a Consultation'} <ChevronRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Reliable Partner ─────────────────────────────────────────────── */}
      <RevealSection className="w-full bg-muted py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{isAr ? 'لماذا الشراكة معنا' : 'Why Partner With Us'}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{isAr ? 'آي سبلاي تشين — شريككم الموثوق' : 'ISC Is Your Reliable Partner'}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mt-4">
              {isAr
                ? 'معاً، نبني سلاسل إمداد أقوى وأذكى وأكثر مرونة.'
                : 'Together, we build stronger, smarter, and more resilient supply chains.'}
            </p>
          </div>
          <img
            src="/brand/isc-reliable-partner.jpg"
            alt={isAr ? 'آي سبلاي تشين شريككم الموثوق' : 'ISC Is Your Reliable Partner'}
            className="w-full rounded-2xl shadow-xl border border-border"
          />
        </div>
      </RevealSection>

      {/* ── Command Centre Spotlight ─────────────────────────────────────── */}
      <section className="relative bg-[#060F1E] overflow-hidden py-20">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0B3D91 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(201,168,76,0.3) 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(201,168,76,0.3) 40px)' }} />

        <div className="container mx-auto px-4 relative z-10">

          {/* Label + Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              {isAr ? '⚡ ذكاء اصطناعي لسلسلة الإمداد' : '⚡ AI-Powered Supply Chain Intelligence'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              {isAr ? (<>رؤى كانت تستغرق أسابيع.<br /><span className="text-[#C9A84C]">أصبحت تستغرق 60 ثانية.</span></>) : (<>Insights that took weeks.<br /><span className="text-[#C9A84C]">Now take 60 seconds.</span></>)}
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'برج التحكم هو محرك الذكاء الاصطناعي من آي سبلاي تشين — مصمم للمؤسسات حول العالم، ومبني على أسس CIPS وAPICS SCOR وخبرة 20 عاماً متجذرة في الخليج. خطط بأسعار مناسبة تُصمَّم بحسب حجم منشأتك.'
                : "The Control Tower is I Supply Chain's AI-powered intelligence engine — built for enterprises worldwide, grounded in CIPS, APICS SCOR, and 20 years of GCC-rooted expertise. Affordable plans sized to your organisation."}
            </p>
            <p className="text-white/30 text-xs mt-2 uppercase tracking-wider font-bold">
              {isAr ? 'مبني على التقييم والمقارنة المرجعية اليوم — المراقبة الحية المستمرة على خارطة الطريق.' : 'Assessment & benchmark-driven today -- continuous live monitoring is on our roadmap.'}
            </p>
          </motion.div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {(isAr
              ? [
                  { icon: '🎯', title: 'رادار المقارنة المرجعية الخليجية', body: 'قارن مؤشرات الأداء الستة الرئيسية لديك بمعايير الربع الأعلى والوسيط في الخليج. اطّلع على فجواتك وأثرها بالريال.', time: '30 ثانية' },
                  { icon: '💰', title: 'حاسبة التوفير', body: 'قدّر إمكانات التوفير عبر 5 مبادرات للمشتريات. حرّك المؤشر — وشاهد ملايين الريالات تظهر لحظياً.', time: 'دقيقتان' },
                  { icon: '🛡️', title: 'درجة التعرّض للمخاطر', body: 'أدخل 5 عوامل خطر لتحصل على درجة متوافقة مع ISO 31000 وتكلفة الاضطراب السنوية وإجراءات تخفيف مُرتّبة الأولويات.', time: 'دقيقة واحدة' },
                  { icon: '🧠', title: 'الإحاطة التنفيذية بالذكاء الاصطناعي', body: 'معالج من 3 أسئلة ← يتقمّص GPT-4o دور معن ← ينتج تقريراً تنفيذياً كاملاً يتضمن الفجوات والمكاسب السريعة وخطة 90 يوماً.', time: '60 ثانية' },
                ]
              : [
                  { icon: '🎯', title: 'GCC Benchmark Radar', body: 'Compare your 6 key KPIs against GCC top-quartile and median benchmarks. See your gaps. See the SAR impact.', time: '30 sec' },
                  { icon: '💰', title: 'Savings Calculator', body: 'Model your savings potential across 5 procurement initiatives. Move a slider — watch SAR millions appear in real time.', time: '2 min' },
                  { icon: '🛡️', title: 'Risk Exposure Score', body: 'Input 5 risk factors. Receive an ISO 31000-aligned score, annual disruption cost, and prioritised mitigations.', time: '1 min' },
                  { icon: '🧠', title: 'AI Executive Briefing', body: 'A 3-question wizard → GPT-4o acts as Ma\'in → produces a full executive report with gaps, quick wins & 90-day plan.', time: '60 sec' },
                ]
            ).map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#C9A84C]/30 transition-all group">
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed mb-3">{f.body}</p>
                <span className="inline-flex items-center gap-1 text-[#C9A84C] text-xs font-bold">
                  {isAr ? `⏱ جاهز خلال ${f.time}` : `⏱ Ready in ${f.time}`}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Before / After Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-12">
            <div className="rounded-2xl overflow-hidden border border-white/10">
              {/* Table header */}
              <div className="grid grid-cols-3 text-xs font-black uppercase tracking-wider">
                <div className="bg-white/5 px-4 py-3 text-white/40">{isAr ? 'ما تحتاجه' : 'What you need'}</div>
                <div className="bg-white/10 px-4 py-3 text-white/40 text-center">{isAr ? 'الاستشاري التقليدي' : 'Traditional Consultant'}</div>
                <div className="px-4 py-3 text-center text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.12)' }}>{isAr ? '⚡ برج التحكم ISC' : '⚡ ISC Control Tower'}</div>
              </div>
              {(isAr
                ? [
                    ['الوقت حتى أول رؤية', '2 – 4 أسابيع', '60 ثانية'],
                    ['التكلفة', 'SAR 50K – 150K', 'SAR 250 – 2,500 / شهرياً'],
                    ['خبرة الخليج ورؤية 2030', '⚠️ متفاوتة', '✅ متضمّنة'],
                    ['الاستناد إلى CIPS / APICS SCOR', '⚠️ متفاوت', '✅ دائماً'],
                    ['التخصيص وفق بياناتك', '✅ نعم (يدوياً)', '✅ نعم (بالذكاء الاصطناعي)'],
                    ['الخطوات التالية الفورية', '⚠️ متأخرة', '✅ فورية'],
                  ]
                : [
                    ['Time to first insight', '2 – 4 weeks', '60 seconds'],
                    ['Cost', 'SAR 50K – 150K', 'SAR 250 – 2,500 / mo'],
                    ['GCC & Vision 2030 expertise', '⚠️ Variable', '✅ Embedded'],
                    ['CIPS / APICS SCOR grounding', '⚠️ Variable', '✅ Always'],
                    ['Personalised to your data', '✅ Yes (manual)', '✅ Yes (AI)'],
                    ['Immediate next steps', '⚠️ Delayed', '✅ Instant'],
                  ]
              ).map(([label, trad, isc], i) => (
                <div key={i} className={`grid grid-cols-3 text-sm border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <div className="px-4 py-3 text-white/60 font-medium text-xs">{label}</div>
                  <div className="px-4 py-3 text-center text-white/40 text-xs">{trad}</div>
                  <div className="px-4 py-3 text-center font-bold text-[#C9A84C] text-xs" style={{ background: 'rgba(201,168,76,0.05)' }}>{isc}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Persona Consultant */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.25 }}
            className="max-w-4xl mx-auto mb-12">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/brand/isc-ai-persona-consultant.jpg"
                alt={isAr ? 'مستشار الذكاء الاصطناعي من آي سبلاي تشين' : 'ISC AI Persona Consultant'}
                className="w-full block"
              />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="text-center">
            <Link href="/command-center">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(201,168,76,0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 bg-[#C9A84C] hover:bg-[#b8973e] text-white font-black text-base px-8 py-4 rounded-2xl transition-colors shadow-xl cursor-pointer"
              >
                {isAr ? '⚡ ادخل إلى برج التحكم' : '⚡ Launch Control Tower'}
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </motion.button>
            </Link>
            <p className="text-white/30 text-xs mt-3">{isAr ? 'بدون تسجيل · بدون بطاقة ائتمان · مجاني للتجربة' : "No sign-up · No credit card · Free to try"}</p>
          </motion.div>

        </div>
      </section>

      {/* ── Solutions ────────────────────────────────────────────────────── */}
      <section id="solutions" className="py-14 bg-muted">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">{t('sections.solutions')}</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-1 bg-accent mx-auto mt-5 rounded-full origin-center"
            />
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {solutions.map((sol, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(11,61,145,0.15)' }}
                className="bg-white rounded-2xl border border-border shadow-sm group overflow-hidden flex flex-col"
              >
                {/* Photo */}
                <div className="relative h-40 overflow-hidden shrink-0">
                  <img
                    src={sol.photo}
                    alt={sol.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082C6B]/80 via-[#082C6B]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow">{isAr ? sol.titleAr : sol.title}</h3>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{isAr ? sol.descAr : sol.desc}</p>
                  <Link href={`/solutions/${sol.slug}`}>
                    <span className="mt-3 flex items-center gap-1 text-primary text-xs font-bold hover:gap-2 transition-all cursor-pointer">
                      {isAr ? 'الأطر ومؤشرات الأداء ودراسات الحالة' : 'Frameworks, KPIs & Case Studies'} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ───────────────────────────────────────────────────── */}
      <section id="industries" className="py-16 bg-white border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <RevealSection className="md:w-1/3 text-center md:text-start md:rtl:text-right">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">{t('sections.industries')}</h2>
              <p className="text-muted-foreground">{isAr ? 'خبرة مصمّمة لتلبية المتطلبات الفريدة لقطاعك تحديداً.' : 'Expertise tailored to the unique demands of your specific sector.'}</p>
            </RevealSection>

            <div className="md:w-2/3 flex overflow-x-auto md:flex-wrap gap-3 md:justify-end pb-2 md:pb-0 snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {industries.map((ind, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: 'easeOut' }}
                  whileHover={{ scale: 1.06, backgroundColor: 'var(--color-primary)', color: '#fff' }}
                  className="snap-start shrink-0 md:shrink px-4 py-2 rounded-full bg-muted border border-border text-primary text-sm font-medium cursor-default"
                >
                  {isAr ? ind.ar : ind.en}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────────────────── */}
      <section id="packages" className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-7xl">
          <RevealSection className="text-center mb-12">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{isAr ? 'نماذج التعاقد' : 'Engagement Models'}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{t('sections.packages')}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {isAr
                ? 'لكل باقة نطاق محدّد ومخرجات صريحة ونتائج واضحة — لتعرف تماماً ما ستحصل عليه قبل الالتزام.'
                : 'Each package has a defined scope, explicit deliverables, and clear outcomes — so you know exactly what you are getting before you commit.'}
            </p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-1 bg-accent mx-auto mt-6 rounded-full origin-center"
            />
          </RevealSection>

          {/* Top row — 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {packages.slice(0, 3).map((pkg, i) => (
              <PackageCard key={pkg.name} pkg={pkg} index={i} isAr={isAr} />
            ))}
          </div>
          {/* Bottom row — 2 wide cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.slice(3).map((pkg, i) => (
              <PackageCard key={pkg.name} pkg={pkg} index={i + 3} wide isAr={isAr} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────
          The quotes previously shown here were AI-generated by Replit and
          presented as real client testimonials — they were not real, and
          have been removed (founder decision, Aug 2026). This section stays
          as a ready-to-fill scaffold: add genuine, attributed quotes to the
          `testimonials` array above (once clients consent) and the cards
          below render automatically. Until then it shows an honest
          placeholder instead of fabricated content. */}
      <section className="py-14 bg-muted">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-10">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">{isAr ? 'أصوات عملائنا' : 'Client Voices'}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{isAr ? 'ماذا يقول عملاؤنا' : 'What Our Clients Say'}</h2>
          </RevealSection>
          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-2xl p-7 shadow-sm border border-border flex flex-col gap-5 hover:shadow-md transition-shadow"
                >
                  <Quote className="w-7 h-7 text-accent/40 shrink-0" />
                  <p className="text-foreground/80 text-sm leading-relaxed flex-1 italic">"{isAr ? t.quoteAr : t.quote}"</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-bold text-primary text-sm">{isAr ? t.nameAr : t.name}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? t.companyAr : t.company}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? t.regionAr : t.region}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, si) => (
                        <Star key={si} className="w-3.5 h-3.5 text-accent fill-accent" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto text-center bg-white rounded-2xl p-8 border border-border">
              <Quote className="w-6 h-6 text-accent/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isAr
                  ? 'نجمع حالياً شهادات موثّقة من عملائنا الحقيقيين — وستُنشر هنا فور اكتمال أول المشاركات الفعلية وموافقة العملاء.'
                  : "We're gathering verified testimonials from real clients — they'll appear here as engagements are completed and clients consent to being quoted."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Case Studies Teaser ───────────────────────────────────────────── */}
      <RevealSection className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <span className="text-accent font-bold text-sm uppercase tracking-widest">{isAr ? 'سيناريوهات تطبيقية' : 'Representative Scenarios'}</span>
              <h2 className="text-3xl font-bold text-primary">{isAr ? 'مصمّمة لخفض التكاليف وتقليل نفاد المخزون وإزالة مخاطر الاعتماد على مصدر واحد' : 'Built to Cut Cost, Reduce Stockouts, and Remove Single-Source Risk'}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? 'استكشف سيناريوهات توضيحية تُبيّن كيفية تطبيق أطرنا في قطاعات الأدوية والتصنيع والتجزئة والقطاع الحكومي والخدمات اللوجستية والطاقة — مبنية على منهجية ISC ومعايير مرجعية للقطاع، وليست نتائج عملاء موثّقة بعد. سننشر هنا النتائج الفعلية فور اكتمال المشاركات الحقيقية.'
                  : "Explore illustrative scenarios showing how our frameworks apply across pharma, manufacturing, retail, government, logistics, and energy — built on ISC's methodology and industry benchmarks, not yet verified client outcomes. As real engagements are completed, we'll publish the actual results here."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/case-studies">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                  {isAr ? 'عرض جميع دراسات الحالة' : 'View All Case Studies'} <ChevronRight className="w-4 h-4 ml-1 rtl:ml-0 rtl:mr-1 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/diagnostic">
                <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white font-bold">
                  {isAr ? 'ابدأ التشخيص المجاني' : 'Start Free Diagnostic'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#082C6B] to-[#0B3D91] text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <RevealSection className="space-y-6">
            <Cpu className="w-12 h-12 text-accent mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">{isAr ? 'هل أنت مستعد لبناء سلسلة إمداد عالمية المستوى؟' : 'Ready to Build a World-Class Supply Chain?'}</h2>
            <p className="text-white/75 text-lg leading-relaxed">
              {isAr
                ? 'ابدأ بتشخيص ذكي مجاني مدته 5 دقائق واحصل على تقرير استراتيجي مصمّم خصيصاً لمنشأتك — أو احجز استشارة سرية مع فريقنا من كبار الخبراء اليوم.'
                : 'Start with a free 5-minute AI diagnostic and receive a strategic report tailored to your organisation — or book a confidential consultation with our senior team today.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/diagnostic">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 min-h-[52px]">
                  {isAr ? 'ابدأ التشخيص الذكي المجاني' : 'Start Free AI Diagnostic'}
                </Button>
              </Link>
              <Link href="/consultant">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8 min-h-[52px]">
                  {isAr ? 'احجز استشارة' : 'Book a Consultation'}
                </Button>
              </Link>
            </div>
            <Link href="/insights" className="text-white/50 hover:text-accent text-sm underline underline-offset-4 inline-block transition-colors">
              {isAr ? 'اقرأ أحدث رؤانا ←' : 'Read our latest insights →'}
            </Link>
          </RevealSection>
        </div>
      </section>

    </div>
  );
}
