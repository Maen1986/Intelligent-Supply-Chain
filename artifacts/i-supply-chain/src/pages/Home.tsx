import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { GitBranch, ShoppingCart, FileText, Users, ShieldAlert, Leaf, RefreshCw, Cpu, ChevronRight, ArrowRight } from 'lucide-react';

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

// ─── Stats strip data ────────────────────────────────────────────────────────
const stats = [
  { value: 500, suffix: '+', label: 'Projects Delivered' },
  { value: 15, suffix: '+', label: 'Countries Served' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
  { value: 10, suffix: '+', label: 'Years of Expertise' },
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

// ─── Main component ──────────────────────────────────────────────────────────
export function Home() {
  const { t } = useLanguage();

  const solutions = [
    { icon: GitBranch, title: 'Supply Chain Strategy', desc: 'End-to-end supply chain design and operational strategy.' },
    { icon: ShoppingCart, title: 'Procurement Excellence', desc: 'Strategic sourcing, vendor selection, and procurement transformation.' },
    { icon: FileText, title: 'Contract Lifecycle Management', desc: 'Full contract lifecycle from drafting to renewal and compliance.' },
    { icon: Users, title: 'Supplier Relationship & Governance', desc: 'Supplier performance management and governance frameworks.' },
    { icon: ShieldAlert, title: 'Risk Management', desc: 'Proactive identification and mitigation of supply chain risks.' },
    { icon: Leaf, title: 'Sustainability', desc: 'ESG integration and sustainable procurement practices.' },
    { icon: RefreshCw, title: 'Resiliency', desc: 'Building adaptive, disruption-resistant supply chains.' },
    { icon: Cpu, title: 'Digital Transformation', desc: 'Technology enablement and digital supply chain maturity.' },
  ];

  const industries = [
    'Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics',
    'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce',
    'Food & Beverage', 'Healthcare',
  ];

  const packages = [
    {
      name: 'Startup',
      desc: 'For early-stage companies establishing their first supply chain processes. Includes AI diagnostic, basic procurement framework, and 1 consultation session.',
    },
    {
      name: 'SME',
      desc: 'For growing businesses scaling operations. Includes full AI diagnostic, procurement strategy, supplier onboarding support, and 3 consultation sessions.',
    },
    {
      name: 'Mid-Market',
      desc: 'For mid-sized organizations optimizing complex supply chains. Includes advanced diagnostics, CLM setup, risk assessment, and 6 consultation sessions.',
    },
    {
      name: 'Enterprise',
      desc: 'For large organizations requiring comprehensive transformation. Custom scope, dedicated consultant, full suite of services, ongoing support.',
    },
    {
      name: 'Government',
      desc: 'Tailored for public sector entities aligned with Vision 2030 (Saudi Arabia) and GCC national development programs. Includes regulatory compliance, nationalization strategy, and governance frameworks.',
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
        style={{ minHeight: '92vh' }}
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

        <div className="container mx-auto px-4 relative z-10 flex items-center" style={{ minHeight: '92vh' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full py-20 lg:py-0">

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

            {/* Right — consultant photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 40 }}
              animate={heroInView ? { opacity: 1, scale: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex justify-center items-end"
            >
              <div className="relative">
                {/* Gold glow behind photo */}
                <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-2xl" />
                <img
                  src="/brand/hero-consultant.jpg?v=2"
                  alt="Maen — AI Supply Chain Consultant"
                  className="relative rounded-3xl shadow-2xl object-cover ring-2 ring-white/20"
                  style={{ width: '420px', height: '520px', objectPosition: 'top center' }}
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">AI-Powered</p>
                    <p className="text-sm font-bold text-primary">Supply Chain Expert</p>
                  </div>
                </div>
              </div>
            </motion.div>

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
      <section id="solutions" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">{t('sections.solutions')}</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-1 bg-accent mx-auto mt-6 rounded-full origin-center"
            />
          </RevealSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((sol, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(11,61,145,0.12)' }}
                className="bg-white p-6 rounded-xl border border-border shadow-sm cursor-default group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors"
                >
                  <sol.icon className="w-6 h-6" />
                </motion.div>
                <h3 className="text-xl font-bold text-foreground mb-3">{sol.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{sol.desc}</p>
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
      <section id="packages" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">{t('sections.packages')}</h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-1 bg-accent mx-auto mt-6 rounded-full origin-center"
            />
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {packages.map((pkg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(11,61,145,0.13)' }}
                className={`bg-white border rounded-2xl p-8 flex flex-col border-border shadow-sm transition-colors
                  ${pkg.name === 'Enterprise' ? 'lg:col-span-1 md:col-span-2' : ''}
                  ${pkg.name === 'Government' ? 'lg:col-span-2 md:col-span-2 bg-gradient-to-br from-white to-muted' : ''}`}
              >
                <h3 className="text-2xl font-bold text-primary mb-4">{pkg.name}</h3>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">{pkg.desc}</p>
                <Link href="/consultant">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold group">
                    Get Started <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
