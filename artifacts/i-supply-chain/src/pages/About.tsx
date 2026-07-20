import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { Award, Globe, Users, TrendingUp, CheckCircle, ChevronRight, Linkedin, Mail, Phone, BadgeCheck } from 'lucide-react';

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
    desc: 'Every engagement is delivered with the rigor of a Big Four firm and the agility of a boutique consultancy. We hold ourselves to the highest professional standards on every project.',
  },
  {
    icon: Globe,
    title: 'Deep Regional Intelligence',
    desc: 'Our work is rooted in the GCC and Levant. We understand Saudi Vision 2030, Jordanian industrial policy, and the nuances of operating across Arabic-speaking markets.',
  },
  {
    icon: Users,
    title: 'Client-First Partnership',
    desc: 'We do not deliver reports and walk away. We stay engaged through implementation, ensuring strategies translate into measurable operational improvements.',
  },
  {
    icon: TrendingUp,
    title: 'AI-Augmented Human Expertise',
    desc: 'We combine AI-powered diagnostics with seasoned human judgment. The result is faster insights, deeper analysis, and recommendations that are practical to execute.',
  },
];

const certifications = [
  'MCIPS — Chartered Institute of Procurement & Supply',
  'CPSM — Certified Professional in Supply Management (ISM)',
  'MIPP — Maersk International Procurement Programme, Denmark',
  'MSc Procurement & Supply Chain, Robert Gordon University (Distinction)',
  'PEX Process Excellence — Sponsor Level (36 hrs)',
  'Saudi Procurement Competition Law Practitioner',
  'Anti-Corruption & Competition Compliance Certified',
  'Vision 2030 & Iktva Localisation Compliance',
  'SAP MM/SCM · Ariba · MS Dynamics 365 · IFS · Odoo · JD Edwards',
];

const achievements = [
  { metric: '$100M+', label: 'Cumulative cost savings delivered' },
  { metric: '50%', label: 'TCO reduction achieved for clients' },
  { metric: '20+', label: 'Years of cross-sector leadership' },
  { metric: '#1', label: 'Jeddah Chamber among 28 KSA chambers' },
];

const expertise = [
  'Procurement Transformation', 'Strategic Sourcing', 'Contract Lifecycle Management (CLM)',
  'Supplier Relationship Management (SRM)', 'Digital Procurement (SAP / Ariba / Dynamics 365)',
  'Change Management', 'Vision 2030 & Iktva Compliance',
  'Spend Analysis & Category Management', 'S&OP & Demand Planning',
  'Supply Chain Risk & Resiliency', 'Value Engineering',
  'Lean & Agile Supply Chain', 'Process Improvement & Policy Development',
  'Training & Capability Building', 'Stakeholder Engagement',
  'Total Cost of Ownership (TCO)', 'Supplier Diversity & ESG',
  'ISO 9001 / 14001 / 45001 Implementation',
];

export function About() {
  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/about-team.jpg" alt="I Supply Chain" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B]/92 via-[#0B3D91]/80 to-[#0B3D91]/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">About I Supply Chain</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            A boutique supply chain consultancy built for the GCC — combining global expertise with deep regional intelligence.
          </p>
        </div>
      </div>

      {/* Mission */}
      <RevealSection className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-accent font-bold text-sm uppercase tracking-widest">Our Mission</span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
                Building Supply Chains That Drive National Competitiveness
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                I Supply Chain was founded on a clear conviction: the GCC's ambitions — Vision 2030, economic diversification, industrial localisation — can only be achieved through world-class supply chain infrastructure. We exist to build that infrastructure, one organisation at a time.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We serve startups finding their first suppliers, SMEs scaling their operations, multinational enterprises entering the Saudi market, and government entities modernising their procurement functions. For every client, we deliver the same thing: strategic clarity and operational results.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '$100M+', label: 'Cost Savings Delivered' },
                { value: '15+', label: 'Countries Served' },
                { value: '20+', label: 'Years of Expertise' },
                { value: '98%', label: 'Client Satisfaction' },
              ].map((stat) => (
                <div key={stat.label} className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
                  <p className="text-4xl font-extrabold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
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
            <span className="text-accent font-bold text-sm uppercase tracking-widest">What We Stand For</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">Our Core Values</h2>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <RevealSection key={v.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <v.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-primary text-lg">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{v.desc}</p>
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
            <span className="text-accent font-bold text-sm uppercase tracking-widest">The Expert Behind ISC</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">Meet the Founder</h2>
          </RevealSection>

          <RevealSection>
            <div className="grid lg:grid-cols-5 gap-0 bg-white rounded-3xl shadow-xl border border-border overflow-hidden">

              {/* Photo column */}
              <div className="lg:col-span-2 relative min-h-[420px] lg:min-h-[560px]">
                <img
                  src="/brand/maen-photo.jpg"
                  alt="Ma'in Alhaqash — Supply Chain Consultant"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#082C6B]/80 via-[#082C6B]/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#082C6B]/10" />
                {/* Bottom nameplate on mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:hidden">
                  <p className="text-[#C9A84C] font-bold text-xs uppercase tracking-widest mb-0.5">Jordan · Riyadh, KSA</p>
                  <h3 className="text-white text-xl font-extrabold">Ma'in Alhaqash</h3>
                  <p className="text-white/80 text-sm">MSc · MCIPS · CPSM · MIPP</p>
                </div>
                {/* Supply chain badge overlay */}
                <div className="absolute top-4 right-4 bg-[#082C6B]/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-[#C9A84C]/40">
                  <p className="text-[#C9A84C]">20+ Years</p>
                  <p>Supply Chain</p>
                </div>
              </div>

              {/* Content column */}
              <div className="lg:col-span-3 p-8 lg:p-10 flex flex-col gap-6">
                {/* Name / title — desktop */}
                <div className="hidden lg:block">
                  <p className="text-accent font-bold text-xs uppercase tracking-widest mb-1">Jordan · Riyadh, Saudi Arabia</p>
                  <h3 className="text-2xl font-extrabold text-primary">Ma'in Alhaqash</h3>
                  <p className="text-muted-foreground font-medium text-sm mt-0.5">Procurement & Supply Chain Director | Senior Consultant</p>
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
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{a.label}</p>
                    </div>
                  ))}
                </div>

                {/* Bio */}
                <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                  <p>
                    A bilingual (English/Arabic) Procurement and Supply Chain Director and Senior Consultant with 20+ years of cross-sector leadership spanning government, oil & gas, FMCG, manufacturing, and EPC construction. Trusted by BP, Maersk, Kaplan, and Saudi government ministries — including MoE, MoI, MoF, and MoD — to architect transformational programmes with a consistent record of <strong>$100M+ in cumulative cost savings</strong>.
                  </p>
                  <p>
                    Ma'in co-founded two General Departments within the Ministry of Education's Institutional Transformation Agency and designed a proprietary Transformation Maturity Model — adopted as the Ministry's official reform benchmark. As Cluster Procurement Manager at Maersk Terminals (Jordan & Georgia), he built a centralised digital procurement system achieving 100% spend visibility and delivered $5M in annual cost reductions.
                  </p>
                  <p>
                    He holds an <strong>MSc in Procurement & Supply Chain Management from Robert Gordon University Aberdeen (Distinction — Dean's Award Winner)</strong>, with a thesis on Big Data Analytics and Supply Chain Sustainability. He is also an international speaker, having presented at the CQI North Sea Conference in Scotland.
                  </p>
                </div>

                {/* Expertise tags */}
                <div className="flex flex-wrap gap-2">
                  {expertise.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/8 text-primary rounded-full text-xs font-semibold border border-primary/15">
                      {tag}
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
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Standards & Frameworks</span>
            <h2 className="text-3xl font-bold text-white mt-3">Certifications & Compliance</h2>
          </RevealSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div key={cert} className="flex items-center gap-3 bg-white/10 rounded-xl p-4 border border-white/15">
                <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                <span className="text-white font-medium text-sm">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <RevealSection className="py-20 bg-white text-center">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Ready to Transform Your Supply Chain?</h2>
          <p className="text-muted-foreground text-lg">
            Book a confidential consultation with Ma'in directly. No commitment — just a candid conversation about your supply chain challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultant">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8">
                Book a Consultation <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/diagnostic">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-bold px-8">
                Start Free AI Diagnostic
              </Button>
            </Link>
          </div>
        </div>
      </RevealSection>
    </div>
  );
}
