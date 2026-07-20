import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Newspaper, Cpu, GitBranch, Lightbulb, ExternalLink,
  ChevronRight, Zap, TrendingUp, Shield, Leaf, Radio,
  BookOpen, Clock, ArrowRight, BarChart3, Globe, Lock
} from 'lucide-react';

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── DATA ────────────────────────────────────────────────────────────────── */

const news = [
  {
    category: 'AI & Technology',
    date: 'July 2025',
    headline: 'Gartner Names Agentic AI the #1 Strategic Technology for Procurement in 2025',
    summary: "Gartner's 2025 Hype Cycle for Procurement identifies agentic AI — autonomous AI agents that can issue RFQs, evaluate bids, and manage POs without human intervention — as the single highest-impact technology in the procurement landscape. Early adopters in Fortune 500 companies report 35–60% reduction in routine procurement cycle time.",
    impact: 'High Impact',
    impactColor: 'bg-red-100 text-red-700',
    icon: Cpu,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    category: 'GCC Policy',
    date: 'June 2025',
    headline: 'Saudi Arabia Launches Unified National Procurement Portal Under Vision 2030',
    summary: 'The Saudi Ministry of Finance has launched a consolidated e-procurement portal integrating government procurement across 132 ministries and entities. The portal mandates digital submission of all tenders above SAR 100,000, full Iktva reporting, and real-time supplier performance tracking — raising the bar for supplier qualification across the Kingdom.',
    impact: 'Critical for KSA',
    impactColor: 'bg-green-100 text-green-700',
    icon: Globe,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  {
    category: 'Regulatory',
    date: 'May 2025',
    headline: 'EU CSDDD Enforcement Begins: GCC Exporters Face New Supply Chain Due Diligence Rules',
    summary: 'The EU Corporate Sustainability Due Diligence Directive (CSDDD) entered enforcement phase in May 2025, requiring European companies to audit their entire supply chains — including GCC suppliers — for human rights and environmental risks. Saudi, Jordanian, and UAE exporters supplying European buyers must now produce ESG due diligence documentation or risk contract termination.',
    impact: 'Regulatory Alert',
    impactColor: 'bg-orange-100 text-orange-700',
    icon: Lock,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
  {
    category: 'Market Intelligence',
    date: 'April 2025',
    headline: 'IMF: GCC Supply Chain Localisation Programs to Contribute $180B to GDP by 2030',
    summary: 'An IMF research note estimates that successful localisation programmes across the GCC — including Saudi Iktva, UAE ICV, and Qatar TAWTEEN — could contribute up to $180 billion to regional GDP by 2030 by substituting imported goods and services with domestic alternatives. Procurement leaders are urged to build local supplier development capabilities now.',
    impact: 'Strategic',
    impactColor: 'bg-blue-100 text-blue-700',
    icon: TrendingUp,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  {
    category: 'Digital Tools',
    date: 'March 2025',
    headline: 'SAP Ariba Releases GenAI Supplier Risk Scoring and Auto-RFx Drafting',
    summary: 'SAP Ariba\'s Spring 2025 release embeds generative AI into the supplier risk module, enabling real-time risk scores based on financial data, news feeds, and ESG ratings — and into the sourcing module with auto-generated RFQ and RFP documents based on category specifications. Existing Ariba customers gain access via standard subscription with a configuration update.',
    impact: 'Tool Update',
    impactColor: 'bg-purple-100 text-purple-700',
    icon: Zap,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    category: 'Sustainability',
    date: 'February 2025',
    headline: 'Scope 3 Emissions Now Mandatory Disclosure for GCC-Listed Companies Over SAR 1B Revenue',
    summary: 'The Saudi Capital Market Authority (CMA) has expanded ESG disclosure requirements to mandate Scope 3 (supply chain) emissions reporting for listed companies above SAR 1 billion in revenue. This brings procurement into the direct regulatory spotlight, requiring organisations to measure and disclose their suppliers\' carbon footprints for the first time.',
    impact: 'Compliance Alert',
    impactColor: 'bg-emerald-100 text-emerald-700',
    icon: Leaf,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
];

const tools = [
  {
    name: 'SAP Ariba',
    category: 'End-to-End Procurement',
    desc: 'The market-leading procurement platform for large enterprises. Covers strategic sourcing, supplier management, contract lifecycle, and procure-to-pay. Now with embedded GenAI for RFx drafting and supplier risk scoring.',
    bestFor: 'Enterprise · Government · Multi-entity',
    badge: 'Enterprise Grade',
    badgeColor: 'bg-blue-100 text-blue-700',
    rating: 'Industry Standard',
    logo: '🔵',
  },
  {
    name: 'Coupa',
    category: 'AI-Powered Spend Management',
    desc: 'Cloud-native platform combining spend management, supplier risk, contract management, and treasury in one suite. Coupa\'s AI benchmarks your spend against $6 trillion in community intelligence — instantly surfacing where you are overpaying versus market.',
    bestFor: 'Mid-Market · Enterprise · FMCG',
    badge: 'AI-Native',
    badgeColor: 'bg-purple-100 text-purple-700',
    rating: 'Gartner Leader 2025',
    logo: '🟣',
  },
  {
    name: 'Jaggaer ONE',
    category: 'Strategic Sourcing & SRM',
    desc: 'Deep strategic sourcing capabilities with advanced reverse auction, multi-attribute scoring, and supplier collaboration tools. Particularly strong for complex category management and supplier performance programmes.',
    bestFor: 'Manufacturing · Energy · EPC',
    badge: 'Sourcing-First',
    badgeColor: 'bg-orange-100 text-orange-700',
    rating: 'Forrester Strong Performer',
    logo: '🟠',
  },
  {
    name: 'Microsoft Dynamics 365 SCM',
    category: 'ERP + Supply Chain',
    desc: 'Microsoft\'s integrated ERP and supply chain suite. Excels at demand planning, inventory optimisation, and warehouse management — with Power BI native integration for real-time procurement dashboards and Copilot AI for purchase order management.',
    bestFor: 'SME · Mid-Market · Government',
    badge: 'ERP-Integrated',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    rating: 'Microsoft Ecosystem',
    logo: '🔷',
  },
  {
    name: 'Zycus iQ',
    category: 'AI Procurement Suite',
    desc: 'Zycus has repositioned around AI-first procurement, with its Merlin AI handling spend classification, contract review, supplier risk, and savings opportunity identification. Strong CLM module with AI-powered clause analysis and obligation tracking.',
    bestFor: 'CLM-Heavy · Multi-Contract',
    badge: 'AI-First',
    badgeColor: 'bg-violet-100 text-violet-700',
    rating: 'Gartner Visionary',
    logo: '🟡',
  },
  {
    name: 'Power BI + Fabric',
    category: 'Procurement Analytics',
    desc: 'Microsoft\'s analytics platform has become the de facto standard for procurement KPI dashboards. With Microsoft Fabric, teams can now connect ERP spend data, supplier scorecards, and contract data into unified semantic models — enabling real-time category spend analysis without an enterprise BI team.',
    bestFor: 'All sizes · Analytics teams',
    badge: 'Analytics',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    rating: 'Widely Deployed',
    logo: '📊',
  },
];

const processes = [
  {
    icon: Cpu,
    title: 'Agentic AI Procurement',
    tag: '2025 Trend',
    tagColor: 'bg-blue-100 text-blue-700',
    desc: 'AI agents that autonomously handle routine procurement tasks — generating RFQs from specs, comparing supplier bids, raising purchase orders within approved parameters, and chasing invoice approvals — without human intervention. Typically deployed for tail spend and repeat purchases first.',
    steps: ['Define policy guardrails and approval thresholds', 'Identify tail spend categories for automation', 'Pilot with one agent on a single category', 'Expand based on compliance and savings data'],
  },
  {
    icon: BarChart3,
    title: 'Continuous Spend Intelligence',
    tag: 'Best Practice',
    tagColor: 'bg-green-100 text-green-700',
    desc: 'Moving from annual spend reviews to real-time spend analytics. Modern procurement teams connect ERP transaction data to analytics platforms (Power BI, Tableau, Coupa Insights) that automatically classify spend, flag maverick purchasing, and surface savings opportunities on a rolling basis.',
    steps: ['Establish a clean spend data taxonomy', 'Connect ERP to analytics platform with live refresh', 'Build category-level KPI dashboards', 'Run monthly savings opportunity reviews'],
  },
  {
    icon: GitBranch,
    title: 'Dual-Sourcing as Standard Practice',
    tag: 'Resilience',
    tagColor: 'bg-red-100 text-red-700',
    desc: 'Post-pandemic supply chain disruptions have elevated dual-sourcing from a niche risk strategy to a standard operating model. Leading procurement organisations now mandate a secondary qualified supplier for all Tier-1 categories, with pre-negotiated contingency pricing and documented activation protocols.',
    steps: ['Map all single-source critical category dependencies', 'Qualify and pre-negotiate with contingency suppliers', 'Embed dual-source requirement in sourcing policy', 'Review and test activation quarterly'],
  },
  {
    icon: Leaf,
    title: 'Circular Procurement',
    tag: 'ESG',
    tagColor: 'bg-emerald-100 text-emerald-700',
    desc: 'Integrating circular economy principles into procurement specifications — requiring suppliers to take back end-of-life products, use recycled content, and design for disassembly. Increasingly required by government buyers and corporate sustainability commitments, and aligned with Saudi Net Zero 2060 targets.',
    steps: ['Add circular criteria to tender evaluation scoring', 'Require supplier material passports for key categories', 'Specify recycled content minimums in RFQ specifications', 'Track circular KPIs in supplier scorecards'],
  },
  {
    icon: Shield,
    title: 'Predictive Supplier Risk Monitoring',
    tag: 'Risk',
    tagColor: 'bg-orange-100 text-orange-700',
    desc: 'Moving beyond annual supplier audits to continuous, AI-powered risk monitoring. Tools like Resilinc, riskmethods, and SAP Ariba Risk scan supplier financial data, news, geopolitical events, and ESG ratings in real time — alerting procurement teams before a supplier failure becomes a supply disruption.',
    steps: ['Segment suppliers by business criticality', 'Deploy real-time risk monitoring for Tier-1 suppliers', 'Define risk tolerance thresholds and alert rules', 'Build risk response playbooks by category'],
  },
  {
    icon: Radio,
    title: 'Digital Twin Supply Chains',
    tag: 'Emerging',
    tagColor: 'bg-purple-100 text-purple-700',
    desc: 'A digital twin of the supply chain creates a virtual replica of physical supply chain operations — enabling scenario modelling, stress testing, and what-if analysis before decisions are made. Leading manufacturers use digital twins to simulate the impact of supplier disruptions, demand spikes, or logistics failures before they occur.',
    steps: ['Map the physical supply chain end-to-end', 'Build the digital model with ERP and IoT data', 'Run disruption simulations for top 5 risk scenarios', 'Integrate model outputs into S&OP planning'],
  },
];

const tips = [
  {
    number: '01',
    title: 'Start with spend data — everything else depends on it.',
    body: 'You cannot category-manage what you cannot see. The first investment in any procurement transformation is clean, classified spend data. Run a spend analysis before you redesign processes, deploy technology, or restructure your supplier base. The data tells you where the money actually goes — and it is almost always different from what leadership believes.',
    tag: 'Transformation Foundation',
  },
  {
    number: '02',
    title: 'Build the governance architecture before the technology.',
    body: 'Technology solves an execution problem; governance solves a structural problem. Organisations that deploy procurement systems without first establishing clear policy, delegation of authority, and approval workflows end up with expensive software that replicates their old broken processes faster. Design the governance first, then select and configure the tools to support it.',
    tag: 'Digital Transformation',
  },
  {
    number: '03',
    title: 'Treat your suppliers as strategic partners, not transactional vendors.',
    body: 'Your top 20% of suppliers by spend represent 80% of your supply chain risk and 80% of your innovation potential. Organisations that invest in structured Supplier Relationship Management — regular reviews, shared KPIs, development programmes, and early visibility of upcoming demand — consistently outperform those that manage suppliers at arm\'s length. The best suppliers give their collaborative customers their best capacity, pricing, and ideas first.',
    tag: 'Supplier Management',
  },
  {
    number: '04',
    title: 'Negotiate contracts — do not just accept them.',
    body: 'The majority of contracts in mid-market organisations are accepted as presented, with no meaningful commercial negotiation. Every contract has leverage points: payment terms, volume commitments, liability caps, IP ownership, renewal mechanics, and performance guarantees. A structured negotiation strategy — even for modest-sized contracts — typically recovers 5–15% of contract value and significantly reduces risk exposure.',
    tag: 'Contract Strategy',
  },
  {
    number: '05',
    title: 'Never let a contract auto-renew without a review.',
    body: 'Auto-renewal clauses in supplier contracts are a silent margin drain in most organisations. Suppliers know that procurement teams are under-resourced and rarely audit renewal dates proactively. Building a contract milestone alert system — even a simple spreadsheet calendar — that flags renewals 90 days in advance gives you the leverage window to negotiate, re-tender, or exit on your terms.',
    tag: 'CLM',
  },
  {
    number: '06',
    title: 'Make Vision 2030 localisation a sourcing strategy, not a compliance exercise.',
    body: 'Organisations in Saudi Arabia that treat Iktva and local content as a tick-box exercise are missing a genuine competitive advantage. Building a robust local supplier development programme — qualifying, training, and growing Saudi suppliers in your key categories — creates long-term cost advantage, reduces logistics risk, and builds the political capital that matters for large government contracts. Localisation done well is a competitive moat, not a regulatory burden.',
    tag: 'Vision 2030 / GCC',
  },
  {
    number: '07',
    title: 'Measure TCO, not just purchase price.',
    body: 'The lowest-price supplier is rarely the lowest-cost supplier when you account for quality failure rates, rework costs, delivery reliability, returns handling, and relationship management overhead. Organisations that shift their category strategies from purchase price to Total Cost of Ownership consistently identify 10–25% cost reduction opportunities that price-focused sourcing misses entirely.',
    tag: 'Cost Management',
  },
  {
    number: '08',
    title: 'Use AI as a thinking partner — not a replacement for expertise.',
    body: 'Generative AI tools (ChatGPT, Claude, Copilot) can dramatically accelerate procurement work: drafting RFQs and tender specifications, reviewing contract clauses, summarising supplier proposals, researching market benchmarks, and building first-draft procurement policies. But they require experienced procurement judgement to direct, validate, and refine the output. The highest-return use of AI in procurement is pairing it with a senior practitioner who knows what good looks like.',
    tag: 'AI & Technology',
  },
];

const tabs = ['Latest News', 'Tools Spotlight', 'Process Innovation', 'Expert Tips'];

/* ─── COMPONENT ───────────────────────────────────────────────────────────── */

export function Intelligence() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-[#082C6B]">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,76,0.18) 0%, transparent 60%), linear-gradient(135deg, #082C6B 0%, #0B3D91 60%, #0d4db8 100%)' }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-accent font-bold text-sm uppercase tracking-widest">Live Intelligence Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">
            Procurement &amp; Supply Chain Intelligence
          </h1>
          <p className="text-white/75 text-base md:text-lg max-w-2xl">
            Latest industry news, digital tools, process innovations, and transformation insights — curated by Ma'in Alhaqash, MCIPS.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab, i) => {
              const icons = [Newspaper, Cpu, GitBranch, Lightbulb];
              const Icon = icons[i];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-200 shrink-0 ${
                    activeTab === i
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">

        {/* ── Tab 0: Latest News ──────────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Latest Industry News</h2>
                <p className="text-muted-foreground mt-1">Curated developments shaping procurement and supply chain management in 2025.</p>
              </div>
              <span className="flex items-center gap-2 text-xs text-accent font-bold uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Updated July 2025
              </span>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {news.map((item, i) => (
                <Reveal key={item.headline} delay={i * 0.06}>
                  <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                        <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.impactColor} shrink-0`}>
                        {item.impact}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.category}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
                      </div>
                      <h3 className="font-bold text-primary text-base leading-snug mb-3">{item.headline}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.summary}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border">
                      <Link href="/consultant">
                        <span className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                          Discuss with a consultant <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="bg-primary/5 border border-primary/15 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-primary">Stay updated every month</p>
                <p className="text-muted-foreground text-sm">Subscribe to our intelligence briefing — GCC regulatory updates, tool releases, and market intelligence delivered to your inbox.</p>
              </div>
              <Link href="/insights#newsletter">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shrink-0">
                  Subscribe to Newsletter
                </Button>
              </Link>
            </Reveal>
          </div>
        )}

        {/* ── Tab 1: Tools Spotlight ──────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Digital Tools Spotlight</h2>
              <p className="text-muted-foreground mt-1">The platforms and technologies Ma'in and the I Supply Chain team deploy for clients — assessed independently.</p>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tools.map((tool, i) => (
                <Reveal key={tool.name} delay={i * 0.06}>
                  <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{tool.logo}</span>
                          <h3 className="font-bold text-primary text-lg">{tool.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{tool.category}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${tool.badgeColor} shrink-0 ml-2`}>
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{tool.desc}</p>
                    <div className="pt-4 border-t border-border space-y-2">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Best For</p>
                        <p className="text-sm text-foreground font-medium">{tool.bestFor}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-accent">{tool.rating}</span>
                        <Link href="/consultant">
                          <span className="text-primary text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                            Ask about implementation <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Expert note */}
            <Reveal className="bg-[#082C6B] text-white rounded-2xl p-7 flex gap-5 items-start">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">Ma'in Alhaqash's View — MCIPS, CPSM</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  "The mistake most organisations make is selecting the tool before designing the process. SAP Ariba in a broken procurement governance environment will give you broken outcomes faster. Before you invest in any platform, map your current-state process, define your future-state operating model, and build your governance structure. Only then will any technology deliver a genuine return. I have deployed SAP MM/SCM, Ariba, MS Dynamics 365, IFS, JD Edwards, and Odoo across KSA, Georgia, and Jordan — and the single biggest predictor of success in every implementation was the quality of the governance design upstream of the technology, not the platform itself."
                </p>
              </div>
            </Reveal>
          </div>
        )}

        {/* ── Tab 2: Process Innovation ───────────────────────────────── */}
        {activeTab === 2 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Process Innovations</h2>
              <p className="text-muted-foreground mt-1">The six most impactful procurement and supply chain process advances defining best practice in 2025.</p>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-6">
              {processes.map((proc, i) => (
                <Reveal key={proc.title} delay={i * 0.06}>
                  <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-7 flex flex-col gap-5 h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <proc.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${proc.tagColor}`}>{proc.tag}</span>
                        </div>
                        <h3 className="font-bold text-primary text-lg leading-tight">{proc.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{proc.desc}</p>
                    <div className="bg-muted rounded-xl p-4 mt-auto">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Implementation Pathway</p>
                      <ol className="space-y-2">
                        {proc.steps.map((step, si) => (
                          <li key={si} className="flex items-start gap-3 text-sm text-foreground">
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{si + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="text-center pt-4">
              <Link href="/diagnostic">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8">
                  Assess Your Process Maturity with AI <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-muted-foreground text-sm mt-3">Free 5-minute diagnostic — identify which process gaps cost you the most.</p>
            </Reveal>
          </div>
        )}

        {/* ── Tab 3: Expert Tips ──────────────────────────────────────── */}
        {activeTab === 3 && (
          <div className="space-y-8">
            <Reveal>
              <div className="flex items-start gap-5">
                <img
                  src="/brand/hero-consultant.jpg?v=3"
                  alt="Ma'in Alhaqash"
                  className="w-16 h-16 rounded-full object-cover object-top border-2 border-accent shrink-0 hidden sm:block"
                />
                <div>
                  <h2 className="text-2xl font-bold text-primary">Expert Transformation Tips</h2>
                  <p className="text-muted-foreground mt-1">
                    Eight principles from <span className="font-semibold text-primary">Ma'in Alhaqash</span> — 20+ years, $100M+ in savings, trusted by BP, Maersk, and Saudi government ministries.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-5">
              {tips.map((tip, i) => (
                <Reveal key={tip.number} delay={i * 0.05}>
                  <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow p-7 flex flex-col gap-4 h-full">
                    <div className="flex items-start gap-4">
                      <span className="text-5xl font-extrabold text-primary/10 leading-none font-mono shrink-0 select-none">{tip.number}</span>
                      <div className="flex-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15 mb-2 inline-block`}>
                          {tip.tag}
                        </span>
                        <h3 className="font-bold text-primary text-base leading-snug">{tip.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">{tip.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* CTA */}
            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-3xl p-10 text-white text-center">
              <Lightbulb className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Want these principles applied to your organisation?</h3>
              <p className="text-white/70 max-w-xl mx-auto mb-7 text-sm leading-relaxed">
                Book a 1-on-1 consultation with Ma'in to get a candid, expert assessment of where your procurement and supply chain function stands — and a concrete roadmap for transformation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consultant">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8">
                    Book a Consultation
                  </Button>
                </Link>
                <Link href="/diagnostic">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">
                    Start Free AI Diagnostic
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
