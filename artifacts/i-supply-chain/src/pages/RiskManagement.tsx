import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Shield, AlertTriangle, BarChart3, ClipboardList, FileText,
  CheckCircle, ChevronRight, Globe, Cpu, DollarSign,
  Scale, Users, Leaf, Globe2, Lock, TrendingDown,
  ArrowRight, Clock, Filter, Eye, Layers,
} from 'lucide-react';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Overview', 'Risk Types', 'Heat Map', 'Risk Register', 'Mitigation Plans', 'Governance'];

const RISK_TYPES = [
  { icon: Globe, color: 'bg-red-50 text-red-600 border-red-200', badge: 'bg-red-100 text-red-700', name: 'Strategic Risk', examples: ['Aramco localisation (Iktva) requirements tightening', 'Trade sanctions impacting import corridors', 'Competitor supply chain advantage'], signals: ['Regulatory announcements', 'Competitor supplier shifts', 'Customer requirement changes'], response: 'Scenario planning, strategy review, supply chain redesign' },
  { icon: AlertTriangle, color: 'bg-orange-50 text-orange-600 border-orange-200', badge: 'bg-orange-100 text-orange-700', name: 'Operational Risk', examples: ['ERP migration failure causing data loss', 'Warehouse fire or flooding', 'Key equipment breakdown'], signals: ['System performance degradation', 'Maintenance backlog increase', 'Quality escape incidents'], response: 'BCP, preventive maintenance, redundant systems, FMEA' },
  { icon: DollarSign, color: 'bg-yellow-50 text-yellow-700 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', name: 'Financial Risk', examples: ['USD-denominated contracts with SAR fluctuation impact', 'Oil price spike on logistics costs', 'Tier-1 supplier insolvency'], signals: ['Supplier payment delays', 'Commodity price index movement', 'Credit rating change'], response: 'Hedging, financial monitoring, dual-source, contractual protections' },
  { icon: Scale, color: 'bg-blue-50 text-blue-600 border-blue-200', badge: 'bg-blue-100 text-blue-700', name: 'Compliance & Regulatory Risk', examples: ['SFDA new pharmaceutical import requirements', 'GTPL tender compliance breach', 'EU CSDDD extraterritorial impact on GCC exporters'], signals: ['Regulatory gazette alerts', 'Supplier audit non-conformances', 'Legal/procurement team flags'], response: 'Regulatory monitoring, compliance programme, internal audit, policy updates' },
  { icon: Users, color: 'bg-purple-50 text-purple-600 border-purple-200', badge: 'bg-purple-100 text-purple-700', name: 'Supplier & Concentration Risk', examples: ['80%+ spend with a single vendor', 'Undisclosed Tier-2 in conflict zone', 'Sole-source critical API (pharma)'], signals: ['Supplier financial health flags', 'Delivery performance deterioration', 'Capacity announcements'], response: 'Dual-source programme, supplier financial monitoring, tier-2 mapping' },
  { icon: Leaf, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', name: 'Reputational & ESG Risk', examples: ['Supplier linked to labour rights violation', 'Carbon disclosure inaccuracy (greenwashing)', 'Modern slavery in supply chain tier-2'], signals: ['Media / NGO reports on suppliers', 'ESG audit findings', 'Regulatory ESG disclosure requirements'], response: 'Supplier ESG audit, Code of Conduct, Scope 3 monitoring, incident response' },
  { icon: Globe2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', name: 'Geopolitical & Macro Risk', examples: ['Red Sea shipping disruption (2024 Houthi attacks)', 'Yemen conflict impact on KSA logistics', 'Trade war tariffs on component imports'], signals: ['Freight rate index spikes', 'Port congestion alerts', 'Political risk intelligence'], response: 'Alternative routing, inventory buffer increase, geopolitical risk monitoring' },
  { icon: Lock, color: 'bg-gray-50 text-gray-600 border-gray-200', badge: 'bg-gray-100 text-gray-700', name: 'Cyber & Digital Risk', examples: ['SAP system ransomware attack', 'Supplier portal data breach', 'Inventory data theft via ERP vulnerability'], signals: ['Security scan alerts', 'Supplier system change notifications', 'Anomalous access patterns'], response: 'Cyber policy, ERP access controls, supplier cybersecurity assessment, incident response plan' },
];

// 5x5 heat map grid — risk items positioned by [likelihood (1-5), impact (1-5)]
const HEAT_MAP_RISKS = [
  { id: 'R1', name: 'Supplier insolvency (Tier-1)', l: 3, i: 5 },
  { id: 'R2', name: 'FX/Commodity price spike', l: 4, i: 3 },
  { id: 'R3', name: 'Red Sea logistics disruption', l: 3, i: 4 },
  { id: 'R4', name: 'Regulatory change (SFDA/NCAR)', l: 3, i: 3 },
  { id: 'R5', name: 'ERP system failure', l: 2, i: 4 },
  { id: 'R6', name: 'Single-source supplier', l: 3, i: 5 },
  { id: 'R7', name: 'Demand forecast error >25%', l: 4, i: 2 },
  { id: 'R8', name: 'Quality recall', l: 2, i: 5 },
  { id: 'R9', name: 'Cyber attack on procurement', l: 2, i: 4 },
  { id: 'R10', name: 'ESG compliance failure', l: 3, i: 3 },
  { id: 'R11', name: 'Key talent departure', l: 3, i: 2 },
  { id: 'R12', name: 'Port/natural disaster', l: 2, i: 3 },
];

function cellColor(score: number) {
  if (score >= 15) return 'bg-red-500 text-white';
  if (score >= 10) return 'bg-orange-400 text-white';
  if (score >= 5) return 'bg-yellow-400 text-gray-900';
  return 'bg-green-400 text-white';
}

const REGISTER = [
  { ref: 'RSK-001', cat: 'Supplier Concentration', desc: '70%+ spend with single vendor; no qualified alternate', l: 4, i: 5, score: 20, owner: 'CPO', control: 'Dual-source qualification programme; vendor spend cap policy', residual: 'MEDIUM (8)', status: 'CRITICAL' },
  { ref: 'RSK-002', cat: 'Geopolitical', desc: 'Red Sea shipping disruption — extended re-routing adds 18+ days', l: 3, i: 4, score: 12, owner: 'Logistics Mgr', control: 'Alternative routing pre-approved; inventory buffer +30 days for sea-dependent items', residual: 'MEDIUM (6)', status: 'HIGH' },
  { ref: 'RSK-003', cat: 'Compliance', desc: 'SFDA / Vision 2030 regulatory change impacting product classification', l: 3, i: 3, score: 9, owner: 'Compliance', control: 'Regulatory monitoring subscription; 90-day impact assessment protocol', residual: 'LOW (4)', status: 'MEDIUM' },
  { ref: 'RSK-004', cat: 'Financial', desc: 'FX exposure — USD-denominated contracts vs SAR operational budget', l: 4, i: 3, score: 12, owner: 'CFO', control: 'FX hedging on >SAR 500K contracts; contractual USD/SAR floor provision', residual: 'MEDIUM (6)', status: 'HIGH' },
  { ref: 'RSK-005', cat: 'Operational', desc: 'ERP migration — data loss or integration failure during cutover', l: 2, i: 5, score: 10, owner: 'IT Director', control: 'Parallel run 4 weeks pre-cutover; full data backup; rollback plan', residual: 'MEDIUM (6)', status: 'HIGH' },
  { ref: 'RSK-006', cat: 'Supply Concentration', desc: 'Sole-source critical component — no alternate qualified or stocked', l: 4, i: 5, score: 20, owner: 'Category Mgr', control: 'Emergency qualification of 2nd source; 90-day safety stock for critical items', residual: 'HIGH (12)', status: 'CRITICAL' },
  { ref: 'RSK-007', cat: 'Demand', desc: 'Forecast accuracy <75% — overstock and stockout co-exist', l: 4, i: 3, score: 12, owner: 'Demand Planner', control: 'Demand sensing implementation; DDMRP buffer methodology; weekly demand review', residual: 'LOW (4)', status: 'HIGH' },
  { ref: 'RSK-008', cat: 'ESG / Reputational', desc: 'Supplier linked to labour violation or environmental breach', l: 3, i: 4, score: 12, owner: 'CPO', control: 'Annual ESG supplier audit; Supplier Code of Conduct with termination clause', residual: 'MEDIUM (6)', status: 'HIGH' },
  { ref: 'RSK-009', cat: 'Operational', desc: 'Warehouse or port infrastructure failure — earthquake, fire, flood', l: 2, i: 4, score: 8, owner: 'Operations Mgr', control: 'BCP with alternate storage; facility insurance; emergency supplier restocking protocol', residual: 'LOW (4)', status: 'MEDIUM' },
  { ref: 'RSK-010', cat: 'People', desc: 'Key procurement talent departure — critical category knowledge lost', l: 3, i: 3, score: 9, owner: 'CHRO', control: 'Knowledge management programme; succession plans for all critical roles; retention strategy', residual: 'LOW (3)', status: 'MEDIUM' },
];

function statusColor(s: string) {
  if (s === 'CRITICAL') return 'bg-red-100 text-red-700 border border-red-200';
  if (s === 'HIGH') return 'bg-orange-100 text-orange-700 border border-orange-200';
  if (s === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  return 'bg-green-100 text-green-700 border border-green-200';
}

export function RiskManagement() {
  const [activeTab, setActiveTab] = useState(0);
  const [openRiskType, setOpenRiskType] = useState<number | null>(0);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [registerFilter, setRegisterFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  const filteredRegister = registerFilter === 'ALL' ? REGISTER : REGISTER.filter(r => r.status === registerFilter);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#082C6B] via-red-900 to-[#082C6B] py-14 px-4">
        <div className="absolute inset-0 opacity-8" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(220,38,38,0.3) 0%, transparent 50%)' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">Risk Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">Supply Chain Risk Management</h1>
          <p className="text-white/75 text-lg max-w-2xl">Proactive, ISO 31000-aligned identification, assessment, and mitigation of supply chain risks — protecting revenue, operations, and reputation across the GCC.</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">Risk Assessment Consultation</Button></Link>
            <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold">Free Diagnostic</Button></Link>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 transition-all duration-200 ${activeTab === i ? 'border-red-600 text-red-600' : 'border-transparent text-muted-foreground hover:text-red-600 hover:border-red-300'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">ISC Risk Management Philosophy</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">ISC applies ISO 31000:2018 and APICS SCOR risk frameworks to build systematic, board-governed risk management programmes — moving organisations from reactive crisis management to proactive risk intelligence.</p>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {[{ val: '6–8%', label: 'Avg disruption cost as % revenue' }, { val: '74%', label: 'Companies with major disruption in 5 years' }, { val: '72h', label: 'Target recovery time (ISC BCP standard)' }, { val: '10×', label: 'Cost of response vs cost of prevention' }].map(s => (
                    <div key={s.label} className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-red-600">{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-3">5 Principles — ISO 31000</p>
                <ol className="space-y-3">
                  {['Integrated — risk management embedded in all processes, not a separate function', 'Structured — consistent framework enabling comparable and reliable results', 'Customised — aligned to context, organisation objectives, and risk appetite', 'Inclusive — stakeholders engaged; their knowledge and perspectives considered', 'Dynamic — anticipates and responds to change; continuously improving'].map((p, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">ISC Risk Management Toolkit</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[{ icon: BarChart3, label: 'Risk Heat Map', desc: '5×5 likelihood × impact matrix with real-time risk positioning' }, { icon: ClipboardList, label: 'Risk Register', desc: 'Structured register with owner, control, residual risk, and status tracking' }, { icon: Shield, label: 'BCP / ISO 22301', desc: 'Business continuity plan covering supply chain recovery scenarios' }, { icon: Eye, label: 'Supplier Risk Score', desc: 'Financial, operational, geographic, ESG scoring for all strategic vendors' }].map(t => (
                    <div key={t.label} className="bg-muted rounded-xl p-5 flex flex-col gap-3">
                      <t.icon className="w-6 h-6 text-primary" />
                      <div><p className="font-bold text-primary text-sm">{t.label}</p><p className="text-xs text-muted-foreground mt-1">{t.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 1 — RISK TYPES */}
        {activeTab === 1 && (
          <div className="space-y-5">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">8 Supply Chain Risk Categories</h2>
              <p className="text-muted-foreground mt-1">Every supply chain risk falls into one of these categories — each with distinct early warning signals and response strategies.</p>
            </Reveal>
            <div className="space-y-3">
              {RISK_TYPES.map((rt, i) => (
                <Reveal key={rt.name} delay={i * 0.04}>
                  <div className={`border rounded-2xl overflow-hidden bg-white shadow-sm ${rt.color.split(' ')[2]}`}>
                    <button className="w-full text-left flex items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                      onClick={() => setOpenRiskType(openRiskType === i ? null : i)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rt.color.split(' ')[0]} border ${rt.color.split(' ')[2]}`}>
                        <rt.icon className={`w-5 h-5 ${rt.color.split(' ')[1]}`} />
                      </div>
                      <p className="font-bold text-primary flex-1">{rt.name}</p>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${openRiskType === i ? 'rotate-90' : ''}`} />
                    </button>
                    {openRiskType === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                        <div className="p-5 grid md:grid-cols-3 gap-5">
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">GCC Examples</p>
                            <ul className="space-y-1">{rt.examples.map(e => <li key={e} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />{e}</li>)}</ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Early Warning Signals</p>
                            <ul className="space-y-1">{rt.signals.map(s => <li key={s} className="text-xs text-muted-foreground flex items-start gap-2"><Eye className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />{s}</li>)}</ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Response Strategy</p>
                            <p className="text-xs text-muted-foreground">{rt.response}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2 — HEAT MAP */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Risk Heat Map</h2>
              <p className="text-muted-foreground mt-1">5×5 matrix plotting likelihood against impact. Hover any cell to see the risks positioned there.</p>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
                <div className="min-w-[460px]">
                  {/* Y-axis label */}
                  <div className="flex gap-1 items-end mb-1">
                    <div className="w-20 shrink-0" />
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex-1 text-center text-xs text-muted-foreground font-medium">Impact {i}</div>)}
                    </div>
                  </div>
                  <div className="flex flex-col-reverse gap-1">
                    {[1, 2, 3, 4, 5].map(likelihood => (
                      <div key={likelihood} className="flex gap-1 items-center">
                        <div className="w-20 shrink-0 text-xs text-muted-foreground font-medium text-right pr-2">L={likelihood}</div>
                        {[1, 2, 3, 4, 5].map(impact => {
                          const score = likelihood * impact;
                          const risksHere = HEAT_MAP_RISKS.filter(r => r.l === likelihood && r.i === impact);
                          const cellId = `${likelihood}-${impact}`;
                          return (
                            <div key={impact} className={`flex-1 h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative ${cellColor(score)} ${hoveredCell === cellId ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                              onMouseEnter={() => setHoveredCell(cellId)} onMouseLeave={() => setHoveredCell(null)}>
                              <span className="text-xs font-extrabold">{score}</span>
                              {risksHere.length > 0 && <div className="flex gap-0.5 mt-0.5">{risksHere.map(r => <span key={r.id} className="w-1.5 h-1.5 rounded-full bg-white/70" />)}</div>}
                              {hoveredCell === cellId && risksHere.length > 0 && (
                                <div className="absolute bottom-full mb-1 left-0 bg-white border border-border rounded-xl p-2 shadow-lg z-20 w-48">
                                  {risksHere.map(r => <p key={r.id} className="text-xs text-foreground font-medium">{r.id}: {r.name}</p>)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <p className="text-xs font-bold text-muted-foreground">Legend:</p>
                    {[{ color: 'bg-green-400', label: 'Low (1–4)' }, { color: 'bg-yellow-400', label: 'Medium (5–9)' }, { color: 'bg-orange-400', label: 'High (10–14)' }, { color: 'bg-red-500', label: 'Critical (15–25)' }].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${l.color}`} /><span className="text-xs text-muted-foreground">{l.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-muted rounded-2xl p-5">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Risk Score Formula</p>
                <p className="text-sm text-foreground font-mono bg-white rounded-lg px-4 py-3 inline-block border border-border">Risk Score = Likelihood (1–5) × Impact (1–5) = 1–25</p>
                <p className="text-xs text-muted-foreground mt-3">Risk appetite thresholds are defined by the board. ISC default: Critical ≥15 = immediate mitigation required; High 10–14 = mitigation plan within 30 days; Medium 5–9 = quarterly review; Low 1–4 = monitor annually.</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="grid sm:grid-cols-2 gap-4">
                {HEAT_MAP_RISKS.slice(0, 6).map(r => {
                  const score = r.l * r.i;
                  return (
                    <div key={r.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${cellColor(score)}`}>{score}</div>
                      <div><p className="font-semibold text-primary text-sm">{r.id}: {r.name}</p><p className="text-xs text-muted-foreground">L={r.l} × I={r.i} = Score {score}</p></div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 3 — RISK REGISTER */}
        {activeTab === 3 && (
          <div className="space-y-5">
            <Reveal className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Risk Register</h2>
                <p className="text-muted-foreground mt-1">Structured register with risk owners, control measures, and residual risk tracking.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground self-center" />
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(f => (
                  <button key={f} onClick={() => setRegisterFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${registerFilter === f ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary/40'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </Reveal>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>{['Ref', 'Category', 'Risk Description', 'L', 'I', 'Score', 'Owner', 'Control Measures', 'Residual', 'Status'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredRegister.map((r, i) => (
                        <tr key={r.ref} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                          <td className="py-3 px-3 font-mono text-xs font-bold text-primary whitespace-nowrap">{r.ref}</td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap">{r.cat}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-[180px]">{r.desc}</td>
                          <td className="py-3 px-3 text-center font-bold">{r.l}</td>
                          <td className="py-3 px-3 text-center font-bold">{r.i}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${cellColor(r.score)}`}>{r.score}</span>
                          </td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap">{r.owner}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-[200px]">{r.control}</td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap text-muted-foreground">{r.residual}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor(r.status)}`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
            <Reveal className="bg-muted rounded-2xl p-5">
              <p className="text-xs font-bold text-primary mb-2">Register Governance</p>
              <p className="text-sm text-muted-foreground">Risk registers must be reviewed quarterly by the Risk Management Committee, with Critical risks reviewed monthly. Each risk must have a named owner who reports status at the management review. ISC provides the register template, governance process, and facilitated first review as part of every risk engagement.</p>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — MITIGATION PLANS */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Risk Mitigation Plans</h2>
              <p className="text-muted-foreground mt-1">4 response strategies — applied based on risk appetite, cost of mitigation, and organisational capability.</p>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-5">
              {[{ strategy: 'AVOID', color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: TrendingDown, desc: 'Eliminate the risk entirely by not proceeding with the activity. Highest cost mitigation — only appropriate when risk score is unacceptable and no other approach reduces it below appetite.', when: 'Risk score ≥20 with no viable mitigation; regulatory prohibition; reputational catastrophe', example: 'Do not source from a sanctioned country. Do not proceed with a sole-source contract for a critical item without a qualified alternate.' },
                { strategy: 'TRANSFER', color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: ArrowRight, desc: 'Shift the financial or operational consequence to a third party through insurance, contractual penalty/SLA, hedging, or third-party risk programmes.', when: 'Financial risks, supplier performance risk, logistics risk — where third party can absorb impact better', example: 'Cargo insurance on high-value shipments; FX hedging contract; SLA penalties on supplier for late delivery; third-party logistics performance bond.' },
                { strategy: 'MITIGATE', color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: Shield, desc: 'Reduce the likelihood of the risk occurring OR reduce the impact if it does occur. Most common and most valuable risk response. Requires investment in controls, processes, or capabilities.', when: 'Most supply chain operational and supplier risks — where the risk cannot be avoided but can be managed', example: 'Dual-source programme reduces impact of supplier failure. BCP + safety stock reduces recovery time. FMEA + process controls reduce defect rate.' },
                { strategy: 'ACCEPT', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', icon: CheckCircle, desc: 'Acknowledge the risk and decide not to act further — either because it is within appetite, the cost of mitigation exceeds the expected loss, or it cannot be controlled.', when: 'Low-score risks (1–4); risks where mitigation cost > risk impact; inherent business risks', example: 'Accept minor demand forecast variance within ±5%. Accept minor freight rate fluctuations within contracted tolerance. Document acceptance with board sign-off.' },
              ].map(s => (
                <Reveal key={s.strategy} delay={0.05}>
                  <div className={`border rounded-2xl p-6 bg-white shadow-sm h-full flex flex-col gap-4 ${s.color}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.badge}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div><span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${s.badge}`}>{s.strategy}</span></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-bold text-primary mb-1">When to use:</p>
                      <p className="text-xs text-muted-foreground mb-3">{s.when}</p>
                      <p className="text-xs font-bold text-primary mb-1">Example:</p>
                      <p className="text-xs text-muted-foreground">{s.example}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Supplier Risk Score */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Supplier Risk Score Model</h3>
                <div className="grid sm:grid-cols-5 gap-3 mb-5">
                  {[{ dim: 'Financial Health', weight: '30%', criteria: 'Altman Z-score, D&B rating, payment history, audit results' }, { dim: 'Operational Capability', weight: '25%', criteria: 'OTIF performance, capacity utilisation, quality certifications, contingency planning' }, { dim: 'Geographic Risk', weight: '20%', criteria: 'Country risk index, natural disaster exposure, political stability, logistics corridor risk' }, { dim: 'ESG / Compliance', weight: '15%', criteria: 'Environmental certifications, labour standards, anti-corruption record, regulatory compliance' }, { dim: 'Relationship Maturity', weight: '10%', criteria: 'Years of relationship, transparency, joint improvement programmes, communication responsiveness' }].map(d => (
                    <div key={d.dim} className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-primary">{d.weight}</p>
                      <p className="font-bold text-primary text-xs mt-1">{d.dim}</p>
                      <p className="text-xs text-muted-foreground mt-2">{d.criteria}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Score 0–100: ≥80 = Low Risk (Green); 60–79 = Medium Risk (Yellow); 40–59 = High Risk (Orange); &lt;40 = Critical Risk (Red) → development plan or disqualification required.</p>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 5 — GOVERNANCE */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Risk Governance Framework</h2>
              <p className="text-muted-foreground mt-1">Three-tier governance structure ensuring risk is owned, escalated, and addressed at the right level.</p>
            </Reveal>
            <div className="space-y-4">
              {[{ tier: 'Board Level', color: 'border-l-red-600 bg-red-50', items: ['Risk appetite statement — approved annually by full board', 'Quarterly risk review: top 5 risks, strategic risk profile', 'ESG and reputational risk oversight', 'Business continuity assurance'] },
                { tier: 'Executive / Management Level', color: 'border-l-orange-500 bg-orange-50', items: ['Risk Management Committee — meets monthly', 'Procurement risk dashboard review (KRI-based)', 'Escalation decision for Critical risks', 'Risk programme budget approval', 'Supplier risk review: strategic suppliers quarterly'] },
                { tier: 'Operational Level', color: 'border-l-yellow-500 bg-yellow-50', items: ['Risk owner accountability for assigned register items', 'Weekly risk monitoring against KRI thresholds', 'Incident reporting (within 24h of identification)', 'Monthly mitigation plan progress update', 'Supplier risk score updates (monthly for Tier-1)'] },
              ].map((tier, i) => (
                <Reveal key={tier.tier} delay={i * 0.06}>
                  <div className={`border-l-4 rounded-2xl p-6 bg-white shadow-sm ${tier.color}`}>
                    <p className="font-bold text-primary text-lg mb-3">{tier.tier}</p>
                    <ul className="space-y-2">{tier.items.map(item => <li key={item} className="text-sm text-muted-foreground flex items-start gap-3"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{item}</li>)}</ul>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-[#082C6B] rounded-2xl p-6 text-white">
              <h3 className="font-bold text-[#C9A84C] mb-3">Integration with Procurement Policy</h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[{ rule: 'All procurement above SAR 500K requires formal risk assessment sign-off before award' }, { rule: 'Any sole-source above SAR 100K requires risk register entry and CPO approval' }, { rule: 'Supplier with risk score &lt;40 cannot be awarded new strategic contracts without escalation' }, { rule: 'Annual risk register review mandatory — quarterly for categories above SAR 5M spend' }].map(r => (
                  <div key={r.rule} className="flex items-start gap-2"><Shield className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" /><p className="text-sm text-white/80">{r.rule}</p></div>
                ))}
              </div>
              <Link href="/governance-compliance"><span className="text-[#C9A84C] text-sm font-semibold hover:underline cursor-pointer flex items-center gap-1">Full Governance & Compliance Framework <ChevronRight className="w-4 h-4" /></span></Link>
            </Reveal>
            <Reveal className="text-center py-4">
              <Link href="/consultant"><Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-10">Request Risk Assessment</Button></Link>
              <p className="text-muted-foreground text-sm mt-3">ISC conducts a full supply chain risk assessment — delivering risk register, heat map, and mitigation roadmap — in 4–6 weeks.</p>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
