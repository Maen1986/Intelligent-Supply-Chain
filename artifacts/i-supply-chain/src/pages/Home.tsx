import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight, ArrowRight, Star, Quote, Cpu, Check, Clock, Users, Building2, Landmark, Rocket, TrendingUp } from 'lucide-react';

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
}: {
  pkg: {
    name: string;
    tag: string;
    icon: React.ElementType;
    color: string;
    duration: string;
    badge: string | null;
    forWho: string;
    deliverables: string[];
    outcomes: string[];
  };
  index: number;
  wide?: boolean;
}) {
  const Icon = pkg.icon;
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
      {pkg.badge && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: pkg.color }}>
          {pkg.badge}
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
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{pkg.tag}</p>
            <h3 className="text-lg font-extrabold text-primary leading-tight">{pkg.name}</h3>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span><span className="font-semibold text-foreground">Duration:</span> {pkg.duration}</span>
        </div>

        {/* Who it's for */}
        <div className="mt-3 bg-muted rounded-lg px-4 py-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Best For</p>
          <p className="text-sm text-foreground leading-relaxed">{pkg.forWho}</p>
        </div>
      </div>

      {/* Deliverables */}
      <div className={`px-7 py-5 flex-1 ${wide ? 'grid sm:grid-cols-2 gap-x-8' : ''}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: pkg.color }}>
            What's Included
          </p>
          <ul className="space-y-2.5">
            {pkg.deliverables.map((d, di) => (
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
            Expected Outcomes
          </p>
          <ul className="space-y-2">
            {pkg.outcomes.map((o, oi) => (
              <li key={oi} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-accent font-bold shrink-0 mt-0.5">→</span>
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
            Enquire About This Package
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Stats strip data ────────────────────────────────────────────────────────
const stats = [
  { value: 100, suffix: 'M+', label: 'Cost Savings Delivered (USD)' },
  { value: 15, suffix: '+', label: 'Countries Served' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
  { value: 20, suffix: '+', label: 'Years of Expertise' },
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

// ─── Floating hero orb ───────────────────────────────────────────────────────
function Orb({
  size,
  color,
  x,
  y,
  duration,
  delay = 0,
}: {
  size: number;
  color: string;
  x: string;
  y: string;
  duration: number;
  delay?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ width: size, height: size, background: color, left: x, top: y }}
      animate={{
        y: [0, -30, 0, 20, 0],
        x: [0, 15, -10, 5, 0],
        scale: [1, 1.06, 0.97, 1.03, 1],
        opacity: [0.35, 0.5, 0.3, 0.45, 0.35],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ─── Consultant carousel ─────────────────────────────────────────────────────
const consultants = [
  {
    src: '/brand/hero-consultant.jpg?v=3',
    alt: 'Saudi Supply Chain Consultant',
    label: 'GCC & Saudi Arabia Expert',
    sublabel: 'Strategic Advisor',
  },
  {
    src: '/brand/consultant-euro.jpg',
    alt: 'European Supply Chain Consultant',
    label: 'European Markets Expert',
    sublabel: 'Senior Consultant',
  },
  {
    src: '/brand/consultant-female.jpg',
    alt: 'Female Supply Chain Consultant',
    label: 'Global Strategy Advisor',
    sublabel: 'Lead Consultant',
  },
];

function ConsultantCarousel({ heroInView }: { heroInView: boolean }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setActive((p) => (p + 1) % consultants.length);
  }, []);

  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  const goTo = (i: number) => {
    setDirection(i > active ? 1 : -1);
    setActive(i);
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 60, scale: 0.97 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -60, scale: 0.97 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: 40 }}
      animate={heroInView ? { opacity: 1, scale: 1, x: 0 } : {}}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex justify-center items-end"
    >
      <div className="relative" style={{ width: '420px' }}>
        {/* Gold glow */}
        <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl pointer-events-none" />

        {/* Image frame */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/20" style={{ width: '420px', height: '520px' }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.img
              key={active}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              src={consultants[active].src}
              alt={consultants[active].alt}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'top center' }}
            />
          </AnimatePresence>

          {/* Name tag overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`label-${active}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="absolute top-4 right-4 bg-white/15 backdrop-blur-md rounded-xl px-3 py-1.5 text-white"
            >
              <p className="text-xs font-medium text-white/70">{consultants[active].sublabel}</p>
              <p className="text-sm font-bold leading-tight">{consultants[active].label}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating AI badge */}
        <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">AI-Powered</p>
            <p className="text-sm font-bold text-primary">Supply Chain Expert</p>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
          {consultants.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === active ? 'w-6 h-2.5 bg-accent' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Consultant ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function Home() {
  const { t } = useLanguage();

  const solutions = [
    { photo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=380&fit=crop&q=80', title: 'Supply Chain Strategy', desc: 'End-to-end supply chain design and operational strategy aligned with business objectives.', slug: 'supply-chain-strategy' },
    { photo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=380&fit=crop&q=80', title: 'Procurement Excellence', desc: 'Strategic sourcing, vendor selection, and full procurement transformation programmes.', slug: 'procurement-excellence' },
    { photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=380&fit=crop&q=80', title: 'Contract Lifecycle Management', desc: 'Full contract lifecycle from drafting and negotiation through to renewal and compliance.', slug: 'contract-lifecycle-management' },
    { photo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=380&fit=crop&q=80', title: 'Supplier Relationship & Governance', desc: 'Supplier performance management, scorecards, and structured governance frameworks.', slug: 'supplier-relationship-governance' },
    { photo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=380&fit=crop&q=80', title: 'Risk Management', desc: 'Proactive identification, assessment, and mitigation of supply chain risks.', slug: 'risk-management-solution' },
    { photo: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=600&h=380&fit=crop&q=80', title: 'Sustainability & ESG', desc: 'ESG integration, circular procurement practices, and Scope 3 emissions reporting.', slug: 'sustainability-esg' },
    { photo: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=380&fit=crop&q=80', title: 'Resiliency', desc: 'Building adaptive, disruption-resistant supply chains with dual-source strategies.', slug: 'resiliency' },
    { photo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=380&fit=crop&q=80', title: 'Digital Transformation', desc: 'Technology enablement, ERP optimisation (SAP MM/SCM, Ariba, Dynamics 365, IFS, Odoo), and digital supply chain maturity roadmaps.', slug: 'digital-transformation' },
    { photo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=380&fit=crop&q=80', title: 'Value Engineering', desc: 'Systematic function analysis and cost-reduction techniques that eliminate non-value-added spend without compromising quality or performance.', slug: 'value-engineering' },
    { photo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=380&fit=crop&q=80', title: 'Lean & Agile Supply Chain', desc: 'Waste elimination, flow optimisation, and agile replenishment models that cut lead times, reduce inventory, and increase throughput.', slug: 'lean-agile-supply-chain' },
    { photo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=380&fit=crop&q=80', title: 'Process Improvement & Policy', desc: 'End-to-end process redesign, SOP authoring, workflow automation, and procurement policy development aligned with Saudi regulations.', slug: 'process-improvement-policy' },
    { photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=380&fit=crop&q=80', title: 'Training & Capability Building', desc: 'Bespoke procurement and supply chain training programmes — workshops, coaching, and knowledge transfer — delivered to teams across government, energy, and private sector.', slug: 'training-capability-building' },
  ];

  const industries = [
    'Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics',
    'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce',
    'Food & Beverage', 'Healthcare',
  ];

  const packages = [
    {
      name: 'Startup Launchpad',
      tag: 'New & Early-Stage',
      icon: Rocket,
      color: '#0B3D91',
      duration: '4 weeks',
      badge: null,
      forWho: 'Companies under 3 years old or with fewer than 50 employees establishing supply chain processes for the first time.',
      deliverables: [
        'Supply chain maturity diagnostic (self-assessment + consultant review)',
        'Procurement policy template & standard operating procedures',
        'Supplier onboarding checklist & qualification criteria',
        'Basic vendor scoring matrix for top 10 suppliers',
        '1 × 90-minute strategy session with Ma\'in Alhaqash',
        '15-page strategic report with prioritised 90-day action plan',
      ],
      outcomes: ['Structured procurement process from day one', 'Avoid the common early-stage sourcing mistakes', '90-day implementation roadmap you can execute independently'],
    },
    {
      name: 'SME Growth',
      tag: 'Growing Businesses',
      icon: TrendingUp,
      color: '#C9A84C',
      duration: '6–8 weeks',
      badge: 'Most Popular',
      forWho: 'Businesses with 50–250 employees experiencing growth pressure on procurement, inventory, or supplier performance.',
      deliverables: [
        'Full AI-powered diagnostic across 5 supply chain dimensions',
        'Category management framework for top 5 spend categories',
        'Supplier segmentation model (strategic / preferred / transactional)',
        'Savings opportunity analysis with quantified potential',
        'Procurement KPI dashboard template with targets',
        '3 × 90-minute consultation sessions (strategy + review + sign-off)',
        '30-page strategy report + 6-month implementation roadmap',
      ],
      outcomes: ['Typical 10–20% cost reduction in addressable spend', 'Clear supplier tiers with differentiated management', 'Savings tracking mechanism operational from day one'],
    },
    {
      name: 'Mid-Market Excellence',
      tag: 'Scaling Organisations',
      icon: Building2,
      color: '#0B6E4F',
      duration: '8–12 weeks',
      badge: null,
      forWho: 'Organisations with 250–1,000 employees seeking competitive advantage through supply chain optimisation.',
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
      outcomes: ['Benchmarked maturity score vs GCC peers', 'Risk gaps identified and mitigation plans assigned', 'Board-ready strategy presentation on completion'],
    },
    {
      name: 'Enterprise Transformation',
      tag: 'Large Organisations',
      icon: Users,
      color: '#5B21B6',
      duration: 'Custom — typically 3–6 months',
      badge: null,
      forWho: 'Corporates, multinationals, and large family businesses requiring end-to-end supply chain transformation with dedicated senior support.',
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
      outcomes: ['Comprehensive maturity uplift across all supply chain dimensions', 'Technology and process transformation with measurable ROI', 'Capability transfer to internal teams'],
    },
    {
      name: 'Government & Public Sector',
      tag: 'Ministries · SOEs · Vision 2030',
      icon: Landmark,
      color: '#B91C1C',
      duration: 'Custom — project-based',
      badge: null,
      forWho: 'Saudi and GCC government ministries, sovereign entities, state-owned enterprises, and Vision 2030 programme offices.',
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
      outcomes: ['Regulatory compliance & audit readiness', 'National content targets met with documented evidence', 'Arabic-language policy documents and reporting'],
    },
  ];

  // Hero headline stagger
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="w-full flex flex-col min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative w-full bg-gradient-to-br from-[#0B3D91] to-[#082C6B] text-white overflow-hidden"
      >
        {/* Full-bleed background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/brand/hero-port.jpg')" }}
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/95 via-[#0B3D91]/80 to-[#0B3D91]/30" />

        {/* Animated orbs on top */}
        <Orb size={320} color="rgba(201,168,76,0.15)" x="55%" y="-5%" duration={9} delay={0} />
        <Orb size={200} color="rgba(201,168,76,0.10)" x="75%" y="55%" duration={12} delay={2} />

        <div className="container mx-auto px-4 relative z-10 flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-20">

            {/* Left — text */}
            <div className="space-y-8">
              <motion.h1
                initial={{ opacity: 0, x: -40 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
              >
                {t('hero.headline')}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, x: -30 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed"
              >
                {t('hero.subheadline')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col sm:flex-row gap-3"
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
                  {t('hero.ctaTertiary')} <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </div>

            {/* Right — consultant carousel */}
            <ConsultantCarousel heroInView={heroInView} />

          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="w-full bg-[#0B3D91] py-10 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
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
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-sm font-medium text-white/80">Strategic Advisory</p>
                <p className="text-xl font-bold">Global Supply Chain Excellence</p>
              </div>
            </div>
            {/* Text */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">
                Why I Supply Chain?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We combine deep domain expertise with cutting-edge AI to deliver supply chain strategies that are resilient, cost-efficient, and built for the GCC's evolving regulatory landscape.
              </p>
              <ul className="space-y-3">
                {[
                  'AI-driven diagnostics with actionable strategic reports',
                  'Senior consultants with 10+ years GCC experience',
                  'Vision 2030 and ESG-aligned frameworks',
                  'End-to-end from strategy to implementation',
                ].map((item, i) => (
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
                  Book a Consultation <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>

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
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow">{sol.title}</h3>
                  </div>
                </div>
                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{sol.desc}</p>
                  <Link href={`/solutions/${sol.slug}`}>
                    <span className="mt-3 flex items-center gap-1 text-primary text-xs font-bold hover:gap-2 transition-all cursor-pointer">
                      Frameworks, KPIs &amp; Case Studies <ChevronRight className="w-3.5 h-3.5" />
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
              <p className="text-muted-foreground">Expertise tailored to the unique demands of your specific sector.</p>
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
                  {ind}
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
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Engagement Models</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">{t('sections.packages')}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Each package has a defined scope, explicit deliverables, and clear outcomes — so you know exactly what you are getting before you commit.
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
              <PackageCard key={pkg.name} pkg={pkg} index={i} />
            ))}
          </div>
          {/* Bottom row — 2 wide cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.slice(3).map((pkg, i) => (
              <PackageCard key={pkg.name} pkg={pkg} index={i + 3} wide />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-14 bg-muted">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-10">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Client Voices</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">What Our Clients Say</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "I Supply Chain transformed how we manage our supplier base. We went from 47 fragmented vendors to 18 high-performance partners — and our procurement costs dropped by 23% in six months. The diagnostic report alone was worth the engagement.",
                name: "Chief Procurement Officer",
                company: "Saudi Pharmaceutical Group",
                region: "Riyadh, KSA",
                stars: 5,
              },
              {
                quote: "Maen and the team have a rare combination: genuine technical depth in supply chain and an intuitive understanding of how business is done in the GCC. Their Vision 2030 compliance framework gave us a competitive advantage we did not expect.",
                name: "VP Operations",
                company: "GCC Government Entity",
                region: "Abu Dhabi, UAE",
                stars: 5,
              },
              {
                quote: "The AI diagnostic identified three procurement gaps we had overlooked for years. Within 90 days of implementation, our raw material purchase cycle dropped from 28 days to 11. I recommend I Supply Chain to every operations leader I meet.",
                name: "General Manager",
                company: "Jordanian Manufacturing Company",
                region: "Amman, Jordan",
                stars: 5,
              },
              {
                quote: "We were struggling with out-of-stock rates above 15% during peak seasons. I Supply Chain redesigned our inventory policy and supplier SLA framework. Our stockouts are now below 5% and customer satisfaction has never been higher.",
                name: "Head of Supply Chain",
                company: "Regional Retail Chain",
                region: "Jeddah, KSA",
                stars: 5,
              },
              {
                quote: "The CSR free diagnostic was genuinely useful. As a startup we couldn't afford a full engagement, but the report gave us a practical 90-day roadmap that helped us win our first major procurement contract. Exceptional value.",
                name: "Founder & CEO",
                company: "Tech Startup",
                region: "Amman, Jordan",
                stars: 5,
              },
              {
                quote: "Sophie and James brought European best practice and adapted it perfectly to our local market context. Our ESG supplier framework opened three international tender opportunities within six months of completion.",
                name: "Sustainability Director",
                company: "Saudi Energy Services Company",
                region: "Dhahran, KSA",
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-2xl p-7 shadow-sm border border-border flex flex-col gap-5 hover:shadow-md transition-shadow"
              >
                <Quote className="w-7 h-7 text-accent/40 shrink-0" />
                <p className="text-foreground/80 text-sm leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="font-bold text-primary text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.company}</p>
                    <p className="text-xs text-muted-foreground">{t.region}</p>
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
        </div>
      </section>

      {/* ── Case Studies Teaser ───────────────────────────────────────────── */}
      <RevealSection className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <span className="text-accent font-bold text-sm uppercase tracking-widest">Proven Impact</span>
              <h2 className="text-3xl font-bold text-primary">23% Cost Reduction. 67% Fewer Stockouts. Zero Single-Source Dependencies.</h2>
              <p className="text-muted-foreground leading-relaxed">
                Real results for real organisations. Explore our case studies across pharma, manufacturing, retail, government, logistics, and energy.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/case-studies">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                  View All Case Studies <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/diagnostic">
                <Button size="lg" variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white font-bold">
                  Start Free Diagnostic
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
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Build a World-Class Supply Chain?</h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Start with a free 5-minute AI diagnostic and receive a strategic report tailored to your organisation — or book a confidential consultation with our senior team today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link href="/diagnostic">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 min-h-[52px]">
                  Start Free AI Diagnostic
                </Button>
              </Link>
              <Link href="/consultant">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8 min-h-[52px]">
                  Book a Consultation
                </Button>
              </Link>
            </div>
            <Link href="/insights" className="text-white/50 hover:text-accent text-sm underline underline-offset-4 inline-block transition-colors">
              Read our latest insights →
            </Link>
          </RevealSection>
        </div>
      </section>

    </div>
  );
}
