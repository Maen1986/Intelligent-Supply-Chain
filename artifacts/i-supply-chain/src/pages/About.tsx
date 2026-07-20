import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/LanguageContext';
import { Award, Globe, Users, TrendingUp, CheckCircle, ChevronRight, Linkedin, Mail, Phone, GraduationCap, BadgeCheck } from 'lucide-react';

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

const teamMembers = [
  {
    name: "Ma'in Alhaqash",
    title: 'Procurement & Supply Chain Director | Senior Consultant',
    credentials: 'MSc · MCIPS · CPSM · MIPP',
    origin: 'Jordan · Riyadh, Saudi Arabia',
    bio: `A bilingual (English/Arabic) Procurement and Supply Chain Director and Senior Consultant with 20+ years of progressive, cross-sector leadership spanning government, oil & gas, FMCG, manufacturing, and EPC construction. Trusted by BP, Maersk, Kaplan, and Saudi government ministries — including MoE, MoI, MoF, and MoD — to architect and deliver transformational programmes at scale, with a consistent record of $100M+ in cumulative cost savings and sustained operational uplift.

Ma'in co-founded two General Departments within the Ministry of Education's Institutional Transformation Agency and designed a proprietary Transformation Maturity Model — adopted as the Ministry's official reform benchmark, the first of its kind within the MoE. As Cluster Procurement Manager at Maersk Terminals (Jordan & Georgia), he built a centralised digital procurement system achieving 100% spend visibility and delivered $5M in annual cost reductions. At SOLB Steel, he delivered $15M in cost savings through strategic sourcing and value engineering. At Saudi Pan Gulf Group (Vita Foods), he redesigned end-to-end supply chain operations achieving 90% forecast accuracy and 0% stock obsolescence.

He holds an MSc in Procurement & Supply Chain Management from Robert Gordon University Aberdeen (Distinction — Dean's Award Winner), with a thesis on "The Influence of Big Data Analytics on Supply Chain Sustainability and Resiliency." He is also an international speaker, having presented at the CQI North Sea Conference in Scotland, and has provided voluntary consultancy to Cfine and the North Sea Food Industry sector in the UK.`,
    expertise: ['Procurement Transformation', 'Strategic Sourcing', 'CLM', 'Supplier Governance', 'Digital Procurement (SAP/Ariba)', 'Change Management', 'Vision 2030 & Iktva', 'Spend Analysis', 'Category Management', 'S&OP & Demand Planning'],
    achievements: [
      { metric: '$100M+', label: 'Cumulative cost savings delivered' },
      { metric: '50%', label: 'TCO reduction achieved for clients' },
      { metric: '100%', label: 'Supply chain efficiency improvement' },
      { metric: '#1', label: 'Jeddah Chamber among 28 KSA chambers' },
    ],
    photo: '/brand/hero-consultant.jpg?v=3',
    linkedin: 'https://linkedin.com/in/maen-alhaqash',
    email: 'maen.haqash@yahoo.com',
    phone: '+966 549 479 722',
  },
  {
    name: 'Sophie Laurent',
    title: 'Senior Consultant — European Markets',
    origin: 'France / UAE',
    bio: 'Sophie specialises in cross-border procurement and sustainability frameworks. With a background in European supply chain regulation, she bridges global best practice with GCC market realities, helping multinationals and regional companies align their supply chains with international ESG standards.',
    expertise: ['Sustainability & ESG', 'Cross-Border Procurement', 'Digital Transformation', 'Compliance'],
    photo: '/brand/consultant-female.jpg',
    linkedin: '#',
    email: 'contact@isupplychain.com',
    phone: '+966 549 479 722',
  },
  {
    name: 'James Whitfield',
    title: 'Senior Consultant — Operations & Logistics',
    origin: 'UK / Saudi Arabia',
    bio: 'James focuses on operational supply chain design, logistics network optimisation, and resiliency planning. He has led large-scale transformation programmes for enterprise clients in Saudi Arabia, UAE, and the UK, delivering significant cost reductions and service-level improvements.',
    expertise: ['Logistics Optimisation', 'Resiliency', 'Organisational Design', 'KPI Frameworks'],
    photo: '/brand/consultant-euro.jpg',
    linkedin: '#',
    email: 'contact@isupplychain.com',
    phone: '+966 549 479 722',
  },
];

export function About() {
  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src="/brand/about-team.jpg" alt="I Supply Chain team" className="absolute inset-0 w-full h-full object-cover object-center" />
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

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <RevealSection className="text-center mb-14">
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Our People</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3">Meet the Team</h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Senior professionals with deep sector expertise, regional fluency, and a track record of delivering results.
            </p>
          </RevealSection>

          <div className="space-y-12">
            {teamMembers.map((member, i) => (
              <RevealSection key={member.name} delay={i * 0.1}>
                <div className={`grid lg:grid-cols-3 gap-8 items-start bg-white rounded-3xl shadow-md border border-border overflow-hidden ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Photo */}
                  <div className={`relative h-72 lg:h-full min-h-[320px] ${i % 2 === 1 ? 'lg:col-start-3' : ''}`}>
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#082C6B]/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#082C6B]/20" />
                  </div>
                  {/* Content */}
                  <div className={`lg:col-span-2 p-8 flex flex-col gap-5 ${i % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    {/* Header */}
                    <div>
                      <p className="text-accent font-bold text-sm uppercase tracking-widest mb-1">{member.origin}</p>
                      <h3 className="text-2xl font-bold text-primary">{member.name}</h3>
                      <p className="text-muted-foreground font-medium mt-0.5">{member.title}</p>
                      {'credentials' in member && (
                        <div className="flex items-center gap-2 mt-2">
                          <BadgeCheck className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-accent font-bold text-xs tracking-wide">{(member as any).credentials}</span>
                        </div>
                      )}
                    </div>

                    {/* Achievements grid — only for Maen */}
                    {'achievements' in member && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(member as any).achievements.map((a: { metric: string; label: string }) => (
                          <div key={a.label} className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                            <p className="text-xl font-extrabold text-primary leading-tight">{a.metric}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{a.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bio — split on double newlines */}
                    <div className="space-y-3">
                      {member.bio.split('\n\n').map((para, pi) => (
                        <p key={pi} className="text-foreground/80 leading-relaxed text-sm">{para}</p>
                      ))}
                    </div>

                    {/* Expertise tags */}
                    <div className="flex flex-wrap gap-2">
                      {member.expertise.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-primary/8 text-primary rounded-full text-xs font-semibold border border-primary/15">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                      <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-4 h-4" /> {member.email}
                      </a>
                      <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Phone className="w-4 h-4" /> {member.phone}
                      </a>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
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
            Book a confidential consultation with our senior team. No commitment — just a candid conversation about your supply chain challenges and how we can help.
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
