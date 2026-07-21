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

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Framework', 'Regulatory Landscape', 'Compliance Strategy', 'Policy Architecture', 'Implementation', 'Client Benefits'];

const RACI = [
  { activity: 'Procurement Strategy Approval', board: 'A', cpo: 'R', catMgr: 'C', procMgr: 'I', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Category Plan Sign-off', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Contract Award >SAR 500K', board: 'A', cpo: 'R', catMgr: 'C', procMgr: 'I', finance: 'C', legal: 'C', audit: 'I' },
  { activity: 'Supplier Qualification', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'I', legal: 'C', audit: 'C' },
  { activity: 'PO Approval (<SAR 50K)', board: 'I', cpo: 'I', catMgr: 'I', procMgr: 'A/R', finance: 'C', legal: 'I', audit: 'I' },
  { activity: 'Supplier Performance Audit', board: 'I', cpo: 'A', catMgr: 'R', procMgr: 'C', finance: 'I', legal: 'I', audit: 'C' },
  { activity: 'Risk Escalation (Critical)', board: 'A', cpo: 'R', catMgr: 'I', procMgr: 'I', finance: 'C', legal: 'C', audit: 'C' },
];

const ROADMAP = [
  { weeks: 'Weeks 1–2', title: 'Governance Diagnostic', tasks: ['Current-state assessment vs best practice', 'Policy gap analysis against CIPS/ISO standards', 'Stakeholder mapping and engagement plan', 'Quick-win identification (30-day list)'], color: 'bg-blue-600' },
  { weeks: 'Weeks 3–4', title: 'Framework Design', tasks: ['Governance structure design (4-layer model)', 'Delegation of Authority (DoA) matrix', 'RACI for all key procurement activities', 'Policy hierarchy mapping'], color: 'bg-indigo-600' },
  { weeks: 'Weeks 5–6', title: 'Policy Development', tasks: ['Draft Procurement Policy (board-level)', 'Supplier Code of Conduct', 'Category policies for top 5 spend areas', 'Anti-corruption & conflict of interest policy'], color: 'bg-purple-600' },
  { weeks: 'Weeks 7–8', title: 'SOPs & Controls', tasks: ['Process SOPs for 15–25 key procurement activities', 'Approval workflow design (ERP-integrated)', 'Audit trail and documentation requirements', 'ERP access control mapping'], color: 'bg-violet-600' },
  { weeks: 'Weeks 9–10', title: 'Training & Communication', tasks: ['Policy training workshop for all procurement staff', 'Management briefings and sign-off', 'Supplier communication — Code of Conduct rollout', 'Internal audit team briefing'], color: 'bg-pink-600' },
  { weeks: 'Weeks 11–12', title: 'Go-Live & Monitoring', tasks: ['Policy launch and formal sign-off', 'KPI dashboard setup (Power BI)', 'First compliance review against new policy', 'Governance calendar (review cadence) established'], color: 'bg-rose-600' },
];

const QUICK_WINS_30 = [
  'Map all current procurement approvals — identify bottlenecks and bypass routes',
  'Issue Supplier Code of Conduct to all 100% of active suppliers',
  'Implement conflict-of-interest declaration for all procurement staff',
  'Create a contract expiry alert calendar for the next 90 days',
  'Run first spend analysis — identify top 10 maverick spend categories',
  'Document your current delegation of authority (even if informal)',
];

export function GovernanceCompliance() {
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
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">Governance & Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">Governance &amp; Compliance Framework</h1>
          <p className="text-white/75 text-lg max-w-2xl">Structured governance that protects, enables, and creates value — from policy architecture to board-level oversight — across the GCC regulatory landscape.</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">Governance Assessment</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">Free Diagnostic</Button></Link>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'}`}>
              {tab}
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
                <h2 className="text-2xl font-bold text-primary mb-3">ISC 4-Layer Governance Model</h2>
                <p className="text-muted-foreground leading-relaxed">Effective procurement governance operates at four distinct levels — from board-level strategic direction to system-level data controls. ISC deploys this model to ensure every procurement decision is authorised, traceable, and aligned to policy.</p>
                <div className="mt-5 space-y-3">
                  {[{ layer: 'Layer 1 — Board & Executive', desc: 'Risk appetite, strategic direction, performance accountability. Meets quarterly.', color: 'border-l-red-600 bg-red-50' }, { layer: 'Layer 2 — Management Governance', desc: 'Policies, delegation of authority, category strategies, spend thresholds. Meets monthly.', color: 'border-l-orange-500 bg-orange-50' }, { layer: 'Layer 3 — Operational Governance', desc: 'SOPs, approval workflows, supplier contracts, KPIs, audit trails. Daily/weekly.', color: 'border-l-yellow-500 bg-yellow-50' }, { layer: 'Layer 4 — System & Data Governance', desc: 'ERP access controls, data integrity, master data management, reporting. Continuous.', color: 'border-l-green-500 bg-green-50' }].map(l => (
                    <div key={l.layer} className={`border-l-4 rounded-xl p-4 ${l.color}`}>
                      <p className="font-bold text-primary text-sm">{l.layer}</p>
                      <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">Delegation of Authority (DoA)</p>
                <div className="space-y-3">
                  {[{ threshold: 'Up to SAR 50K', authority: 'Procurement Manager', note: 'Routine operational procurement' }, { threshold: 'SAR 50K–500K', authority: 'CPO / Procurement Director', note: 'Standard approval, risk assessment recommended' }, { threshold: 'SAR 500K–5M', authority: 'CEO / Board Sub-committee', note: 'Mandatory risk assessment, strategy sign-off' }, { threshold: 'SAR 5M+', authority: 'Full Board Approval', note: 'Board resolution required; external legal review' }, { threshold: 'Emergency Procurement', authority: 'CEO + Ratification <48h', note: 'Documented justification; post-event audit' }].map(d => (
                    <div key={d.threshold} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0 mt-2" />
                      <div>
                        <p className="font-bold text-white text-sm">{d.threshold} → {d.authority}</p>
                        <p className="text-xs text-white/60 mt-0.5">{d.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* RACI Table */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
                <h3 className="font-bold text-primary mb-4">RACI Matrix — Procurement Governance</h3>
                <table className="w-full text-xs min-w-[600px]">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-2 font-bold text-primary pr-4 min-w-[180px]">Activity</th>
                    {['Board', 'CPO', 'Cat Mgr', 'Proc Mgr', 'Finance', 'Legal', 'Audit'].map(h => <th key={h} className="text-center py-2 font-bold text-primary px-2 w-16">{h}</th>)}
                  </tr></thead>
                  <tbody>{RACI.map((r, i) => (
                    <tr key={r.activity} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                      <td className="py-2.5 pr-4 text-muted-foreground font-medium">{r.activity}</td>
                      {[r.board, r.cpo, r.catMgr, r.procMgr, r.finance, r.legal, r.audit].map((cell, ci) => (
                        <td key={ci} className="py-2.5 px-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-extrabold ${cell === 'A' ? 'bg-primary text-white' : cell === 'R' ? 'bg-emerald-100 text-emerald-700' : cell === 'C' ? 'bg-blue-100 text-blue-700' : cell === 'A/R' ? 'bg-purple-100 text-purple-700' : 'bg-muted text-muted-foreground'}`}>{cell}</span>
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3">R=Responsible, A=Accountable, C=Consulted, I=Informed</p>
              </div>
            </Reveal>

            {/* Governance KPIs */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Governance KPIs</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Policy Compliance Rate', target: '>92%', benchmark: '71%' }, { name: 'Procurement Audit Score', target: '>85/100', benchmark: '68/100' }, { name: 'Approved Supplier Adherence', target: '>95%', benchmark: '79%' }, { name: 'Contract Coverage of Spend', target: '>90%', benchmark: '63%' }, { name: 'Maverick Spend', target: '<5%', benchmark: '18%' }, { name: 'DoA Violation Incidents', target: '0 per quarter', benchmark: '3–5 per quarter' }].map(k => (
                    <div key={k.name} className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{k.name}</p>
                      <p className="text-xl font-extrabold text-[#C9A84C]">{k.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">Benchmark: {k.benchmark}</p>
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
              <h2 className="text-2xl font-bold text-primary">Regulatory Landscape — GCC &amp; Jordan</h2>
              <p className="text-muted-foreground mt-1">ISC monitors and interprets procurement and supply chain regulations across the GCC — ensuring clients stay compliant in a rapidly evolving environment.</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {[{
                country: '🇸🇦 Saudi Arabia — Primary Focus', color: 'border-t-green-600', regs: [
                  { name: 'GTPL (Government Tenders & Procurement Law)', impact: 'Mandatory for all government procurement. Tender process, prequalification, evaluation criteria, dispute resolution. 2019 amendments tightened transparency requirements.' },
                  { name: 'Iktva / Local Content Programme', impact: 'All energy sector suppliers must achieve and report Iktva score. ISC supports calculation, gap closure, and audit preparation.' },
                  { name: 'SFDA (Saudi Food & Drug Authority)', impact: 'Pharmaceutical, food, and medical device procurement — import approval, GDP compliance, labelling, and cold chain requirements.' },
                  { name: 'NCAR (National Construction Sector Dev.)', impact: 'Material qualification, testing standards, and contractor prequalification for infrastructure and EPC projects.' },
                  { name: 'ZATCA e-Invoicing', impact: 'Phase 2 mandatory e-invoicing (Fatoora) for B2B transactions. Procurement must ensure supplier compliance in contracts and POs.' },
                  { name: 'Vision 2030 Alignment', impact: 'All public sector procurement must demonstrate progress toward localisation, Saudisation, and sustainability — reportable to NTP/MISA.' },
                ]
              }, {
                country: '🇯🇴 Jordan', color: 'border-t-red-600', regs: [
                  { name: 'Public Procurement Bureau (PPB)', impact: 'Governs all government procurement above JOD 5,000. Prequalification, tender evaluation, and contract award protocols.' },
                  { name: 'JSMO (Jordan Standards & Metrology)', impact: 'National standards body — product compliance and testing for imported and locally manufactured goods.' },
                  { name: 'Jordan Food & Drug Administration', impact: 'JFDA registration and import clearance for pharma and food supply chains.' },
                  { name: 'CBJ FX Regulations', impact: 'Foreign currency controls affect import procurement, letter of credit requirements, and USD/JOD exposure management.' },
                ]
              }, {
                country: '🌍 International Standards', color: 'border-t-blue-600', regs: [
                  { name: 'ISO 20400 Sustainable Procurement', impact: 'International standard for integrating sustainability into procurement decisions and supplier management.' },
                  { name: 'ISO 44001 Collaborative Relationships', impact: 'Standard for managing strategic supplier and partner relationships — relevant for JVs, long-term contracts, and SPAs.' },
                  { name: 'FCPA / UK Bribery Act', impact: 'Anti-corruption regulations with extraterritorial reach — apply to multinationals operating procurement in KSA and Jordan.' },
                  { name: 'EU CSDDD (Corporate Sustainability Due Diligence)', impact: 'European companies must audit GCC suppliers for ESG risks. GCC exporters must provide ESG documentation or risk losing European contracts.' },
                ]
              }, {
                country: '📋 Procurement Standards', color: 'border-t-purple-600', regs: [
                  { name: 'CIPS Ethical & Professional Standards', impact: 'Global standard for procurement ethics — anti-corruption, conflict of interest, supplier conduct, and professional behaviour.' },
                  { name: 'APICS SCOR Supply Chain Standards', impact: 'Process, performance, and practice standards for supply chain operations aligned to global benchmarks.' },
                  { name: 'IACCM / World Commerce & Contracting', impact: 'Contract management standards, clause libraries, and commercial risk best practice for GCC contract professionals.' },
                  { name: 'UN Global Compact', impact: 'For multinationals: 10 principles covering human rights, labour, environment, and anti-corruption in supply chains.' },
                ]
              }].map((sec, i) => (
                <Reveal key={sec.country} delay={i * 0.06}>
                  <div className={`bg-white border border-border rounded-2xl shadow-sm overflow-hidden border-t-4 ${sec.color}`}>
                    <div className="p-5 pb-0">
                      <h3 className="font-bold text-primary mb-4">{sec.country}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {sec.regs.map((r, ri) => (
                        <div key={ri} className="px-5 py-3">
                          <p className="font-semibold text-primary text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.impact}</p>
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
                <p className="font-bold text-orange-800 mb-1">Regulatory Monitoring Service</p>
                <p className="text-sm text-orange-700 leading-relaxed">ISC provides a monthly GCC regulatory intelligence brief — covering new procurement law changes, SFDA/NCAR updates, Vision 2030 procurement targets, and international standard revisions. Clients receive 90-day impact assessments and recommended policy updates. Contact us to subscribe.</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 2 — COMPLIANCE STRATEGY */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Compliance Strategy — 4 Pillars</h2>
              <p className="text-muted-foreground mt-1">A complete compliance programme prevents, detects, responds to, and continuously improves compliance across procurement and supply chain operations.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{ pillar: 'PREVENT', icon: Shield, color: 'bg-blue-50 border-blue-200 text-blue-600', actions: ['Procurement policy covering all relevant regulations', 'Supplier Code of Conduct — mandatory for all active suppliers', 'Conflict of interest declaration — all procurement staff annually', 'Anti-corruption training (FCPA/UK Bribery Act awareness)', 'Supplier due diligence screening (Standard + Enhanced tiers)', 'Prequalification process with compliance criteria'] },
                { pillar: 'DETECT', icon: Eye, color: 'bg-orange-50 border-orange-200 text-orange-600', actions: ['Annual internal procurement audit (quarterly for high-risk)', 'Spend analytics — maverick spend and policy violation alerts', 'Supplier performance monitoring — anomaly flagging', 'Whistleblower channel — anonymous reporting available', 'Contract compliance monitoring — term adherence checks', 'ERP access log review — segregation of duties audit'] },
                { pillar: 'RESPOND', icon: AlertTriangle, color: 'bg-red-50 border-red-200 text-red-600', actions: ['Incident management protocol — classification, escalation, response', 'Corrective action plan (CAP) with owner and deadline', 'Regulatory notification process (GTPL, SFDA — where required)', 'Supplier suspension/termination protocol', 'Board reporting for material compliance incidents', 'Post-incident lessons-learned documentation'] },
                { pillar: 'IMPROVE', icon: TrendingUp, color: 'bg-green-50 border-green-200 text-green-600', actions: ['Annual policy review cycle — update for regulatory changes', 'Training refresh following incidents or policy updates', 'Benchmark compliance score vs GCC best practice', 'CIPS compliance framework self-assessment annually', 'Supplier development for compliance improvement', 'Governance effectiveness review (board-level, annual)'] },
              ].map(p => (
                <Reveal key={p.pillar} delay={0.05}>
                  <div className={`border rounded-2xl p-6 bg-white shadow-sm h-full flex flex-col gap-4 ${p.color.split(' ').slice(1).join(' ')}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.color}`}>
                        <p.icon className="w-5 h-5" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${p.color.replace('bg-', 'bg-').replace('text-', '')} ${p.color}`}>{p.pillar}</span>
                    </div>
                    <ul className="space-y-2 flex-1">
                      {p.actions.map(a => <li key={a} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{a}</li>)}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Audit types */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Compliance Audit Framework</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[{ type: 'Desktop Audit', desc: 'Document review, policy compliance check, contract term adherence. Remote. Annual for standard suppliers, semi-annual for high-risk.', badge: 'bg-blue-100 text-blue-700' }, { type: 'On-Site Audit', desc: 'Physical inspection, process observation, staff interviews, system access check. For Tier-1 strategic suppliers. Annual or triggered by incident.', badge: 'bg-orange-100 text-orange-700' }, { type: 'Third-Party Audit', desc: 'Independent external auditors for highest-risk categories (pharma GDP, ESG, anti-corruption). Required for regulatory compliance submission.', badge: 'bg-red-100 text-red-700' }].map(a => (
                    <div key={a.type} className="bg-muted rounded-xl p-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.badge} mb-3 inline-block`}>{a.type}</span>
                      <p className="text-sm text-muted-foreground">{a.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-bold text-primary mb-1">Audit Scoring</p>
                  <p className="text-xs text-muted-foreground">Non-conformance severity: <span className="font-bold text-red-700">Critical</span> (immediate corrective action, supplier suspension risk) · <span className="font-bold text-orange-700">Major</span> (30-day CAP required) · <span className="font-bold text-yellow-700">Minor</span> (90-day CAP required). Three Major NCs in 12 months triggers escalation to CPO and re-audit.</p>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — POLICY ARCHITECTURE */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Procurement Policy Architecture</h2>
              <p className="text-muted-foreground mt-1">A clear policy hierarchy ensures every procurement decision is guided by the right level of authority — from board-level charter to operational work instructions.</p>
            </Reveal>

            {/* Policy pyramid */}
            <Reveal>
              <div className="space-y-3">
                {[
                  { level: 'Level 1', title: 'Procurement Charter', owner: 'Board of Directors', desc: 'Strategic intent, mandate, and values of the procurement function. 5-year horizon. Sets the "why" and "what" of procurement governance.', covers: ['Procurement mandate and scope', 'Core values: integrity, transparency, value', 'Strategic procurement objectives', 'Alignment to corporate strategy'], color: 'bg-[#082C6B] text-white', accent: 'text-[#C9A84C]' },
                  { level: 'Level 2', title: 'Procurement Policy', owner: 'CEO / Board Approval', desc: 'Mandatory rules for all procurement activities. Defines authority, ethics, processes, and non-negotiable requirements.', covers: ['Scope and applicability', 'Delegation of Authority (DoA)', 'Ethics and conflict of interest rules', 'Emergency procurement provisions', 'Supplier selection requirements'], color: 'bg-blue-700 text-white', accent: 'text-blue-200' },
                  { level: 'Level 3', title: 'Category Policies', owner: 'CPO / Procurement Director', desc: 'Specific sourcing rules for each major spend category — IT, MRO, Professional Services, Capex, Logistics, Marketing.', covers: ['Category-specific sourcing strategy', 'Approved supplier requirements', 'Maximum contract durations', 'Local content requirements (Iktva)', 'Category risk parameters'], color: 'bg-indigo-600 text-white', accent: 'text-indigo-200' },
                  { level: 'Level 4', title: 'Standard Operating Procedures (SOPs)', owner: 'Procurement Manager', desc: 'Step-by-step process documentation for all key procurement activities — 15–25 SOPs covering the full procurement cycle.', covers: ['RFx process (RFI, RFQ, RFP)', 'Supplier qualification', 'Contract award process', 'PO creation and approval', 'Supplier performance review'], color: 'bg-purple-600 text-white', accent: 'text-purple-200' },
                  { level: 'Level 5', title: 'Work Instructions & Templates', owner: 'Procurement Team', desc: 'Detailed task-level guides and standardised templates used daily — forms, checklists, scoring matrices, contract templates.', covers: ['Tender evaluation scoring matrix', 'Supplier scorecard template', 'Contract variation request form', 'PO amendment process', 'Procurement approval checklist'], color: 'bg-gray-600 text-white', accent: 'text-gray-300' },
                ].map((p, i) => (
                  <Reveal key={p.level} delay={i * 0.05}>
                    <button className={`w-full text-left rounded-2xl p-5 shadow-sm flex items-start gap-5 hover:opacity-90 transition-opacity ${p.color}`}
                      onClick={() => setOpenPolicy(openPolicy === i ? null : i)}>
                      <div className={`shrink-0 ${p.accent} font-extrabold text-sm`}>{p.level}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-lg">{p.title}</p>
                            <p className={`text-xs ${p.accent} font-medium mt-0.5`}>Owner: {p.owner}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 opacity-60 transition-transform ${openPolicy === i ? 'rotate-90' : ''}`} />
                        </div>
                        {openPolicy === i && (
                          <div className="mt-4 grid sm:grid-cols-2 gap-4">
                            <p className="text-sm opacity-80 sm:col-span-2">{p.desc}</p>
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${p.accent}`}>Must Cover:</p>
                              <ul className="space-y-1">{p.covers.map(c => <li key={c} className="text-xs opacity-80 flex items-start gap-2"><CheckCircle className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />{c}</li>)}</ul>
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
              <p className="font-bold text-primary mb-2">ISC Policy Development Service</p>
              <p className="text-sm text-muted-foreground">ISC authors, reviews, and implements complete procurement policy frameworks — typically delivered in 4–8 weeks depending on organisational complexity. All documents aligned to CIPS standards, GTPL requirements (Saudi Arabia), and ISO 20400 where applicable.</p>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — IMPLEMENTATION */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">12-Week Implementation Roadmap</h2>
              <p className="text-muted-foreground mt-1">From governance diagnostic to live policy framework — structured delivery with clear milestones and stakeholder engagement at every phase.</p>
            </Reveal>
            <div className="space-y-4">
              {ROADMAP.map((phase, i) => (
                <Reveal key={phase.weeks} delay={i * 0.05}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex gap-5 items-start">
                    <div className={`w-12 h-12 rounded-xl ${phase.color} text-white flex items-center justify-center font-extrabold text-xs shrink-0 text-center leading-tight px-1`}>{phase.weeks.split(' ')[0]}<br/>{phase.weeks.split('–')[1] ? `–${phase.weeks.split('–')[1].split(' ').pop()}` : ''}</div>
                    <div className="flex-1">
                      <p className="font-bold text-primary mb-2">{phase.weeks} — {phase.title}</p>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                        {phase.tasks.map(t => <li key={t} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{t}</li>)}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <h3 className="font-bold text-[#C9A84C] mb-4">30-Day Quick Wins — Start Today</h3>
                <p className="text-white/70 text-sm mb-4">Before the full programme begins, these quick wins can be implemented immediately — building momentum and demonstrating governance intent.</p>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {QUICK_WINS_30.map((qw, i) => (
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
              <h2 className="text-2xl font-bold text-primary">Client Benefits &amp; Outcomes</h2>
              <p className="text-muted-foreground mt-1">Measurable value delivered by ISC governance programmes — based on Ma'in's engagements across Saudi Arabia, Jordan, and the GCC.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[{ metric: '12–18%', label: 'Maverick spend reduction', detail: 'Typical SAR 200K–2M saving depending on organisation size' }, { metric: '35–50%', label: 'Approval cycle time reduction', detail: 'Policy automation eliminates unnecessary approval layers' }, { metric: '95%', label: 'External audit pass rate', detail: 'Post-implementation clients pass procurement audits first time' }, { metric: '>90%', label: 'Contract coverage achieved', detail: 'Up from typical 60–65% — reducing leakage and risk exposure' }, { metric: '+20pts', label: 'Internal audit score improvement', detail: 'Typical improvement from 68% → 88% in 12 months' }, { metric: '30–40%', label: 'Supply chain incident reduction', detail: 'Governance programme reduces incidents through accountability' }].map(b => (
                <Reveal key={b.label} delay={0.05}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                    <p className="text-3xl font-extrabold text-[#C9A84C]">{b.metric}</p>
                    <p className="font-bold text-primary">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Case studies */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">Real-World Achievements</h3>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {[{ title: 'Audit score 61% → 91%', client: 'Saudi Ministry-level entity', result: 'Procurement governance framework deployed across 6 subsidiaries. 47 SOPs authored. SAR 18M maverick spend identified and captured.', timeframe: '24 weeks' }, { title: 'Zero GTPL non-conformances', client: 'Jordanian manufacturing group', result: 'Full policy architecture (8 policies, 23 SOPs), Iktva compliance programme. Passed GTPL audit with zero major non-conformances — first time in company history.', timeframe: '20 weeks' }, { title: 'Approval cycle 18 → 6 days', client: 'GCC energy company', result: 'DoA framework redesign, ERP workflow automation. Contract coverage increased from 58% → 94%. Maverick spend reduced from 21% → 4%.', timeframe: '16 weeks' }].map((cs, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <div className="bg-gradient-to-br from-[#082C6B] to-[#0B3D91] rounded-2xl p-7 text-white flex flex-col h-full">
                    <Star className="w-6 h-6 text-[#C9A84C] mb-3" />
                    <p className="text-xl font-extrabold text-[#C9A84C] mb-3">{cs.title}</p>
                    <p className="text-white/75 text-sm leading-relaxed flex-1">{cs.result}</p>
                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
                      <span><Building2 className="w-3.5 h-3.5 inline mr-1" />{cs.client}</span>
                      <span><Clock className="w-3.5 h-3.5 inline mr-1" />{cs.timeframe}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="bg-gradient-to-r from-[#082C6B] to-[#0B3D91] rounded-3xl p-10 text-white text-center">
              <Scale className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-3">Start with a Free Governance Assessment</h3>
              <p className="text-white/70 max-w-xl mx-auto mb-6 text-sm">ISC offers a complimentary 2-hour governance health check — scoring your current procurement governance against the ISC framework and identifying your top 3 quick wins.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold px-8">Book Free Assessment</Button></Link>
                <Link href="/risk-management"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold px-8">View Risk Management →</Button></Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
