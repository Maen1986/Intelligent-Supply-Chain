import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Zap, BarChart3, Target, RefreshCw, Shield, Leaf,
  CheckCircle, ChevronRight, AlertTriangle, TrendingUp,
  Activity, GitBranch, BookOpen, Award, Clock, Factory,
  ArrowRight, Layers, Star, Globe, Radio,
} from 'lucide-react';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

const TABS = ['Overview', 'Lean Framework', 'Six Sigma (DMAIC)', 'Quality Management', 'Agile & Resilience', 'Industry Applications'];

const LEAN_WASTES = [
  { letter: 'T', name: 'Transportation', desc: 'Unnecessary movement of goods', example: 'Multi-leg routing of goods when direct delivery is possible; excess inter-warehouse transfers' },
  { letter: 'I', name: 'Inventory', desc: 'Excess stock at any stage', example: 'Over-stocked warehouses, raw material buffers masking process problems, safety stock not demand-driven' },
  { letter: 'M', name: 'Motion', desc: 'Unnecessary people/equipment movement', example: 'Warehouse pickers travelling excessive distance; poor slotting strategy' },
  { letter: 'W', name: 'Waiting', desc: 'Idle time between process steps', example: 'PO approval delays, goods waiting at customs, unscheduled supplier lead times' },
  { letter: 'O', name: 'Overproduction', desc: 'Making more than immediately needed', example: 'Manufacturing to forecast rather than order; buying in bulk to "save" cost' },
  { letter: 'O', name: 'Over-processing', desc: 'More work than customer requires', example: 'Multiple approval layers on low-value POs; triple-checking specs that are standardised' },
  { letter: 'D', name: 'Defects', desc: 'Errors requiring rework or returns', example: 'Supplier quality failures, incorrect shipments, invoice errors requiring correction' },
  { letter: 'S', name: 'Skills', desc: 'Underutilising people\'s capability', example: 'MCIPS-qualified buyer processing purchase orders; analysts doing manual data entry' },
];

const DMAIC_PHASES = [
  { phase: 'Define', color: 'bg-blue-600', tools: ['Project Charter', 'SIPOC Diagram', 'Voice of Customer (VOC)', 'CTQ Tree', 'Stakeholder Map'], deliverable: 'Approved project charter with scope, goals, timeline', example: 'Define procurement cycle reduction project: scope = direct materials PO-to-delivery, target = reduce from 28→10 days, baseline sigma = 1.9' },
  { phase: 'Measure', color: 'bg-indigo-600', tools: ['Process Capability (Cp/Cpk)', 'Gauge R&R', 'Data Collection Plan', 'Baseline Sigma Level', 'Run Charts'], deliverable: 'Baseline data showing current performance gap', example: 'Measure OTIF baseline: 78%, sigma level 2.4. Key data: 35% of late deliveries caused by supplier; 40% by internal approval delays' },
  { phase: 'Analyze', color: 'bg-purple-600', tools: ['Fishbone (Ishikawa)', '5-Why Analysis', 'Pareto 80/20', 'Regression Analysis', 'Hypothesis Testing'], deliverable: 'Validated root causes ranked by impact', example: 'Root cause: 72% of late POs caused by ≥4 approval levels on items <SAR 50K. Pareto confirms: fix this = 72% problem solved' },
  { phase: 'Improve', color: 'bg-emerald-600', tools: ['Design of Experiments (DoE)', 'Solution Selection Matrix', 'Pilot Plan', 'FMEA', 'Future-State VSM'], deliverable: 'Implemented improvement with measurable before/after', example: 'Redesign approval: items <SAR 50K approved by Procurement Manager only (1 level). Pilot in 4 weeks: cycle time dropped 28→11 days' },
  { phase: 'Control', color: 'bg-teal-600', tools: ['SPC Control Charts', 'Control Plan', 'Visual Management', 'Response Plan', 'Handover Documentation'], deliverable: 'Sustained performance with monitoring plan', example: 'Control plan: weekly OTIF chart, monthly sigma review, process owner assigned. OTIF sustained at 93% for 6 months post-project' },
];

const QUALITY_TOOLS = [
  { name: 'FMEA', use: 'New process/product launch', scApp: 'Pre-qualify new suppliers; assess new logistics routes before go-live' },
  { name: 'SPC / Control Charts', use: 'Monitoring ongoing processes', scApp: 'Monitor supplier OTIF weekly; flag when process goes out of control limits' },
  { name: 'Pareto (80/20)', use: 'Prioritising improvement focus', scApp: 'Identify the 20% of suppliers causing 80% of quality issues' },
  { name: 'Fishbone (Ishikawa)', use: 'Root cause analysis', scApp: 'Diagnose why on-time delivery is failing — people, process, systems, suppliers' },
  { name: '8D Problem Solving', use: 'Supplier quality incident response', scApp: 'Structured 8-discipline corrective action when a supplier causes a recall or shortage' },
  { name: 'MSA (Measurement System Analysis)', use: 'Validating data reliability', scApp: 'Ensure delivery time data from ERP is accurate before using for sigma calculations' },
];

const INDUSTRY_APPS = [
  {
    industry: 'Manufacturing', icon: '🏭', wastes: ['Overproduction (push scheduling)', 'Waiting (changeover time)', 'Defects (supplier quality)'],
    project: { title: 'VSM & Kaizen Programme', tool: 'Lean VSM + SMED', savings: '20–30%', timeline: '10 weeks' },
    quickWins: ['VSM 2 production lines', '5S in warehouse/dispatch', 'Kanban for top 20 MRO items'],
    challenge: 'Long changeover times inflate batch sizes and inventory',
    solution: 'SMED workshop: external/internal setup separation reduces changeover 50–70%',
  },
  {
    industry: 'Energy', icon: '⚡', wastes: ['Waiting (maintenance MRO availability)', 'Inventory (excess critical spares)', 'Defects (incorrect parts issued)'],
    project: { title: 'Shutdown Lean Optimisation', tool: 'VSM + FMEA', savings: '25%', timeline: '12 weeks' },
    quickWins: ['Parts availability audit for next shutdown', 'Critical spare min/max review', 'Maintenance work order flow map'],
    challenge: 'MRO stockouts cause production downtime — over-ordering is the "safe" response',
    solution: 'DDMRP buffer positioning: data-driven safety stock replaces gut-feel over-ordering. Reduces inventory 30–40% while improving availability',
  },
  {
    industry: 'Government', icon: '🏛️', wastes: ['Waiting (multi-layer approvals)', 'Over-processing (redundant checks)', 'Skills (expert staff doing admin)'],
    project: { title: 'Procurement Process Lean', tool: 'VSM + DMAIC', savings: '40% cycle time', timeline: '10 weeks' },
    quickWins: ['Map current approval flows', 'Identify and eliminate duplicate process steps', 'Automate routine approval for <SAR 50K'],
    challenge: 'GTPL compliance adds process steps — lean without losing audit trail',
    solution: 'Process design separating compliance requirements from operational waste — automate compliance checks, eliminate non-mandatory steps',
  },
  {
    industry: 'Pharma', icon: '💊', wastes: ['Waiting (batch release)', 'Defects (GDP deviations)', 'Overproduction (demand forecast error)'],
    project: { title: 'GDP-Compliant Lean Cold Chain', tool: 'DMAIC + Lean', savings: '18% cost', timeline: '14 weeks' },
    quickWins: ['Cold chain VSM (from supplier to patient)', 'Batch release timeline analysis', 'Temperature excursion root cause'],
    challenge: 'Lean must not compromise GDP compliance or SFDA requirements',
    solution: 'Quality-by-Design approach: lean tools selected specifically for GDP-compliant environments; every improvement FMEA-validated before implementation',
  },
  {
    industry: 'Logistics', icon: '🚛', wastes: ['Transportation (empty running)', 'Motion (warehouse travel)', 'Waiting (dock congestion)'],
    project: { title: 'Lean Warehouse & Route Design', tool: 'Lean + Route Optimisation', savings: '22% cost', timeline: '10 weeks' },
    quickWins: ['Empty-running analysis on top 10 routes', 'Warehouse slotting audit', 'Dock scheduling board implementation'],
    challenge: 'Driver and vehicle utilisation low — difficult to improve without demand predictability',
    solution: 'Demand clustering and consolidation strategies, cross-docking design, dynamic route optimisation with 48h demand signal',
  },
  {
    industry: 'Healthcare', icon: '🏥', wastes: ['Inventory (clinical consumables)', 'Motion (nurse supply collection)', 'Waiting (theatre supply delays)'],
    project: { title: 'Hospital Supply Lean', tool: 'Lean + Par-Level Kanban', savings: '30–35%', timeline: '12 weeks' },
    quickWins: ['Par-level audit for 3 high-cost wards', 'Theatre supply VSM', 'Top 20 high-cost consumable inventory review'],
    challenge: 'Clinical staff resistance to supply process changes — safety concerns',
    solution: 'Co-design approach: clinical staff co-design supply process improvements. Par-level Kanban tested in pilot ward before roll-out. Safety stock maintained for critical items',
  },
];

export function LeanSixSigma() {
  const [activeTab, setActiveTab] = useState(0);
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const [openWaste, setOpenWaste] = useState<number | null>(null);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#082C6B] via-[#0B3D91] to-purple-900 py-14 px-4">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #C9A84C 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#C9A84C] animate-pulse" />
            <span className="text-[#C9A84C] font-bold text-sm uppercase tracking-widest">Operational Excellence</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">Lean, Six Sigma &amp; Quality Excellence</h1>
          <p className="text-white/75 text-lg max-w-2xl">Eliminate waste, reduce variation, and build quality into every supply chain process — from strategy to operational execution across the GCC.</p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">Book LSS Consultation</Button></Link>
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

        {/* TAB 0 — OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-8">
            <Reveal className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-3">Integrated LSS for Supply Chains</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">Lean Six Sigma combines the waste-elimination philosophy of Lean with the variation-reduction rigour of Six Sigma. In supply chains, this means: faster lead times, fewer defects, lower inventory, and consistent service performance — sustained through a culture of continuous improvement.</p>
                <p className="text-muted-foreground leading-relaxed">ISC deploys an integrated LSS methodology specifically adapted to GCC supply chains — accounting for regulatory requirements (SFDA, NCAR, GTPL), cultural dynamics, and the unique challenges of operating across Saudi Arabia, Jordan, and the wider region.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ icon: Zap, label: 'Lean', desc: 'Eliminate all 8 wastes. Create flow. Deliver value.', color: 'text-purple-600 bg-purple-50' },
                  { icon: Target, label: 'Six Sigma', desc: 'Reduce variation. Data-driven improvement. Sustained results.', color: 'text-blue-600 bg-blue-50' },
                  { icon: Award, label: 'Quality', desc: 'ISO 9001, TQM, and EFQM — excellence embedded in process.', color: 'text-emerald-600 bg-emerald-50' },
                  { icon: RefreshCw, label: 'Agile', desc: 'Sense demand. Respond fast. Absorb variability.', color: 'text-orange-600 bg-orange-50' },
                ].map(p => (
                  <div key={p.label} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color.split(' ')[1]}`}>
                      <p.icon className={`w-5 h-5 ${p.color.split(' ')[0]}`} />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            {/* DMAIC roadmap visual */}
            <Reveal>
              <div className="bg-muted rounded-2xl p-6">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">DMAIC Process Roadmap</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {['Define', 'Measure', 'Analyze', 'Improve', 'Control'].map((phase, i) => (
                    <div key={phase} className="flex-1 bg-white rounded-xl p-4 text-center border border-border relative">
                      <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
                      <p className="font-bold text-primary text-sm">{phase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal className="grid sm:grid-cols-3 gap-4">
              {[{ label: 'Avg Lead Time Reduction', val: '35%' }, { label: 'Typical Sigma Improvement', val: '+1.4σ' }, { label: 'Average COPQ Reduction', val: '55%' }].map(s => (
                <div key={s.label} className="bg-[#082C6B] rounded-2xl p-6 text-white text-center">
                  <p className="text-3xl font-extrabold text-[#C9A84C]">{s.val}</p>
                  <p className="text-white/70 text-sm mt-2">{s.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
        )}

        {/* TAB 1 — LEAN FRAMEWORK */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Lean Framework Levels</h2>
              <p className="text-muted-foreground mt-1">From enterprise lean design to day-to-day operational tools — deployed in sequence for sustainable transformation.</p>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5">
              {[{
                level: 'L1 Strategic', color: 'border-blue-500 bg-blue-50', tools: [
                  { name: 'Lean Enterprise Design', desc: 'Zero-waste supply chain architecture' },
                  { name: 'Theory of Constraints', desc: 'Exploit the single system bottleneck' },
                  { name: 'DDMRP', desc: 'Demand-driven material requirements planning' },
                ]
              }, {
                level: 'L2 Tactical', color: 'border-purple-500 bg-purple-50', tools: [
                  { name: 'Value Stream Mapping', desc: 'Current → future state flow design' },
                  { name: 'Pull System / Kanban', desc: 'Signal-based replenishment' },
                  { name: 'Agile S&OP', desc: 'Short-cycle demand-supply alignment' },
                ]
              }, {
                level: 'L3 Operational', color: 'border-emerald-500 bg-emerald-50', tools: [
                  { name: '5S / 6S', desc: 'Organised, visual workplace' },
                  { name: 'Kaizen Events', desc: '3–5 day rapid improvement' },
                  { name: 'Standard Work', desc: 'Best method documented & followed' },
                ]
              }].map((lv, li) => (
                <Reveal key={lv.level} delay={li * 0.07}>
                  <div className={`border-t-4 rounded-2xl p-6 bg-white shadow-sm h-full ${lv.color}`}>
                    <p className="font-bold text-primary text-lg mb-4">{lv.level}</p>
                    <div className="space-y-4">
                      {lv.tools.map(t => (
                        <div key={t.name} className="border-l-2 border-primary/20 pl-3">
                          <p className="font-semibold text-primary text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* 8 Wastes */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">The 8 Wastes (TIMWOODS) — Supply Chain Examples</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LEAN_WASTES.map((w, i) => (
                  <button key={i} onClick={() => setOpenWaste(openWaste === i ? null : i)}
                    className="text-left bg-white border border-border rounded-2xl p-4 hover:border-purple-400 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-extrabold flex items-center justify-center">{w.letter}</span>
                      <p className="font-bold text-primary text-sm">{w.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.desc}</p>
                    {openWaste === i && <p className="text-xs text-purple-700 mt-2 font-medium border-t border-border pt-2">SC Example: {w.example}</p>}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Lean KPIs */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Lean KPIs</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Lead Time Reduction', target: '>35%', benchmark: '18%' }, { name: 'Inventory Turns', target: '>12/yr', benchmark: '7.5/yr' }, { name: 'OEE', target: '>80%', benchmark: '68%' }, { name: 'Process Cycle Efficiency', target: '>35%', benchmark: '22%' }, { name: 'WIP Reduction', target: '>40%', benchmark: '15%' }, { name: 'First-Pass Yield', target: '>97%', benchmark: '91%' }].map(k => (
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

        {/* TAB 2 — SIX SIGMA (DMAIC) */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Six Sigma — DMAIC Framework</h2>
              <p className="text-muted-foreground mt-1">Structured, data-driven approach to eliminating the root causes of defects and variation in supply chain processes.</p>
            </Reveal>
            <div className="space-y-4">
              {DMAIC_PHASES.map((phase, i) => (
                <Reveal key={phase.phase} delay={i * 0.05}>
                  <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button className="w-full text-left flex items-center gap-4 p-5 hover:bg-muted/50 transition-colors"
                      onClick={() => setOpenPhase(openPhase === i ? null : i)}>
                      <div className={`w-10 h-10 rounded-xl ${phase.color} text-white flex items-center justify-center font-extrabold shrink-0`}>{phase.phase[0]}</div>
                      <div className="flex-1">
                        <p className="font-bold text-primary">{phase.phase}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.deliverable}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${openPhase === i ? 'rotate-90' : ''}`} />
                    </button>
                    {openPhase === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border">
                        <div className="p-5 grid md:grid-cols-2 gap-5">
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Key Tools</p>
                            <div className="flex flex-wrap gap-2">
                              {phase.tools.map(t => <span key={t} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">{t}</span>)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">GCC Example</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{phase.example}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Sigma levels */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Six Sigma Belts & Deployment</h3>
                <div className="grid sm:grid-cols-5 gap-3">
                  {[{ belt: 'White', color: 'bg-gray-100 text-gray-700', role: 'Awareness & participation in improvement events' }, { belt: 'Yellow', color: 'bg-yellow-100 text-yellow-700', role: 'Apply basic LSS tools in daily work' }, { belt: 'Green', color: 'bg-green-100 text-green-700', role: 'Lead departmental improvement projects (part-time)' }, { belt: 'Black', color: 'bg-gray-900 text-white', role: 'Full-time improvement leader; complex projects' }, { belt: 'Master Black', color: 'bg-[#082C6B] text-white', role: 'Programme lead; coach black belts; strategic deployment' }].map(b => (
                    <div key={b.belt} className={`rounded-xl p-4 text-center ${b.color}`}>
                      <p className="font-bold text-sm">{b.belt} Belt</p>
                      <p className="text-xs mt-1 opacity-80">{b.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Six Sigma KPIs</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Sigma Level', target: '>4.0σ', benchmark: '2.5–3.0σ' }, { name: 'DPMO (defects per million)', target: '<6,210', benchmark: '66,800' }, { name: 'Process Capability Cpk', target: '>1.33', benchmark: '0.85' }, { name: 'Cost of Poor Quality (COPQ)', target: '<2% revenue', benchmark: '5–8% revenue' }, { name: 'Defect Rate', target: '<0.5%', benchmark: '3.2%' }, { name: 'Rework/Correction Time', target: '<5% total', benchmark: '18%' }].map(k => (
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

        {/* TAB 3 — QUALITY MANAGEMENT */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Quality Management for Excellence</h2>
              <p className="text-muted-foreground mt-1">ISO 9001:2015, TQM, and EFQM — quality management embedded in procurement, supply chain, and supplier management.</p>
            </Reveal>

            {/* QMS Implementation Phases */}
            <Reveal>
              <h3 className="text-xl font-bold text-primary mb-4">QMS Implementation — 4 Phases</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ num: '01', title: 'Assessment', desc: 'Gap analysis vs ISO 9001:2015, baseline quality audit, management review', color: 'bg-blue-600' }, { num: '02', title: 'Design', desc: 'Quality policy, quality manual, process documentation, risk-based thinking framework', color: 'bg-indigo-600' }, { num: '03', title: 'Implement', desc: 'Team training, document control, internal audits, corrective action process (CAR)', color: 'bg-purple-600' }, { num: '04', title: 'Certify', desc: 'Pre-audit (stage 1), external certification audit (stage 2), non-conformance resolution', color: 'bg-emerald-600' }].map(p => (
                  <div key={p.num} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl ${p.color} text-white flex items-center justify-center font-extrabold text-sm mb-3`}>{p.num}</div>
                    <p className="font-bold text-primary mb-2">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* GCC Standards */}
            <Reveal>
              <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-4 text-[#C9A84C]">GCC Quality Standards Landscape</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{ country: '🇸🇦 Saudi Arabia', standards: ['SFDA — pharmaceutical, food & medical devices', 'NCAR — construction & engineering materials', 'SASO — general product standards', 'Saudi Quality Awards (King Khalid Quality Award)'] }, { country: '🇯🇴 Jordan', standards: ['JISM (Jordan Institution for Standards & Metrology)', 'Jordan Food & Drug Administration (JFDA)', 'Jordan Engineering Association (JEA) standards'] }, { country: '🌍 International', standards: ['ISO 9001:2015 Quality Management', 'ISO 14001:2015 Environmental', 'ISO 45001:2018 Health & Safety', 'IATF 16949 Automotive (manufacturing)'] }, { country: '🏥 Healthcare', standards: ['JCI Accreditation (US Joint Commission)', 'ASHP pharmaceutical standards', 'WHO Good Distribution Practice (GDP)', 'CBAHI (Saudi hospital accreditation)'] }].map(s => (
                    <div key={s.country} className="bg-white/10 rounded-xl p-4">
                      <p className="font-bold text-white mb-2">{s.country}</p>
                      <ul className="space-y-1">{s.standards.map(st => <li key={st} className="text-xs text-white/70 flex items-start gap-2"><CheckCircle className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" />{st}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Quality tools */}
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Quality Tools — Supply Chain Applications</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border"><th className="text-left py-2 font-bold text-primary pr-4">Tool</th><th className="text-left py-2 font-bold text-primary pr-4">When to Use</th><th className="text-left py-2 font-bold text-primary">SC Application</th></tr></thead>
                    <tbody>
                      {QUALITY_TOOLS.map((t, i) => (
                        <tr key={t.name} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                          <td className="py-3 font-semibold text-primary pr-4 whitespace-nowrap">{t.name}</td>
                          <td className="py-3 text-muted-foreground pr-4 text-xs">{t.use}</td>
                          <td className="py-3 text-muted-foreground text-xs">{t.scApp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* TAB 4 — AGILE & RESILIENCE */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">Agile Supply Chain &amp; Resilience</h2>
              <p className="text-muted-foreground mt-1">Build supply chains that absorb demand variability (Agile) and recover from disruptions (Resilience) — while maintaining efficiency gains from Lean.</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              <Reveal>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4"><RefreshCw className="w-5 h-5 text-orange-500" /><h3 className="font-bold text-primary">Agile Supply Chain Framework</h3></div>
                  <p className="text-sm text-muted-foreground mb-5">Agile supply chains sense demand signals and respond fast — replacing rigid annual forecasts with rolling, adaptive planning cycles.</p>
                  <div className="space-y-4">
                    {[{ level: 'L1 Strategic', desc: 'Scenario planning, adaptive strategy review quarterly, volatility-based portfolio segmentation' }, { level: 'L2 Tactical', desc: 'Rolling S&OP (monthly), flexible contracts with volume bands, postponement strategy for product differentiation' }, { level: 'L3 Operational', desc: 'Weekly demand sensing, sprint-based procurement for fast-moving categories, Kanban with dynamic sizing' }].map(l => (
                      <div key={l.level} className="border-l-2 border-orange-400 pl-4">
                        <p className="font-semibold text-primary text-sm">{l.level}</p>
                        <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.07}>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-primary">ISC Resilience Framework (4 Pillars)</h3></div>
                  <div className="space-y-4">
                    {[{ pillar: 'Visibility', color: 'bg-blue-50 border-blue-200', desc: 'End-to-end supply chain tracking, Tier-1/2 supplier mapping, risk radar, real-time transport visibility' }, { pillar: 'Flexibility', color: 'bg-green-50 border-green-200', desc: 'Dual-source for critical categories, flexible volume contracts (+/-30% bands), modular product design' }, { pillar: 'Collaboration', color: 'bg-orange-50 border-orange-200', desc: 'Supplier information sharing, joint demand planning with key customers, crisis communication protocols' }, { pillar: 'Recovery', color: 'bg-red-50 border-red-200', desc: 'BCP (ISO 22301), crisis playbooks by disruption type, rapid re-sourcing protocol, tested annually' }].map(p => (
                      <div key={p.pillar} className={`border rounded-xl p-4 ${p.color}`}>
                        <p className="font-bold text-primary text-sm">{p.pillar}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
            <Reveal>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">Resilience KPIs</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[{ name: 'Mean Time to Recovery (MTTR)', target: '<72 hours', benchmark: '5–10 days' }, { name: 'Supply Risk Coverage', target: '>85%', benchmark: '47%' }, { name: 'Dual-Source Coverage (critical)', target: '>65%', benchmark: '38%' }, { name: 'BCP Test Completion', target: 'Annual', benchmark: 'Ad hoc/none' }, { name: 'Disruption Cost % Revenue', target: '<0.5%', benchmark: '1.8%' }, { name: 'Alternate Source Activation', target: '<48 hours', benchmark: '7–14 days' }].map(k => (
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

        {/* TAB 5 — INDUSTRY APPLICATIONS */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <Reveal>
              <h2 className="text-2xl font-bold text-primary">LSS by Industry</h2>
              <p className="text-muted-foreground mt-1">Sector-specific waste types, recommended projects, quick wins, and challenges — from Ma'in's 20+ years across GCC industries.</p>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-5">
              {INDUSTRY_APPS.map((app, i) => (
                <Reveal key={app.industry} delay={i * 0.06}>
                  <div className="bg-white border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{app.icon}</span>
                      <h3 className="font-bold text-primary text-lg">{app.industry}</h3>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Top Wastes</p>
                      <ul className="space-y-1">{app.wastes.map(w => <li key={w} className="text-xs text-muted-foreground flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />{w}</li>)}</ul>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Recommended Project</p>
                      <p className="font-semibold text-primary text-sm">{app.project.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{app.project.tool} · {app.project.timeline} · <span className="text-emerald-700 font-bold">{app.project.savings} savings</span></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">30-Day Quick Wins</p>
                      <ul className="space-y-1">{app.quickWins.map(q => <li key={q} className="text-xs text-foreground flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{q}</li>)}</ul>
                    </div>
                    <div className="mt-auto border-t border-border pt-4">
                      <p className="text-xs font-bold text-orange-600 mb-1">Key Challenge</p>
                      <p className="text-xs text-muted-foreground mb-2">{app.challenge}</p>
                      <p className="text-xs font-bold text-emerald-700">ISC Approach: <span className="font-normal text-muted-foreground">{app.solution}</span></p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="bg-gradient-to-r from-[#082C6B] to-purple-900 rounded-2xl p-8 text-white text-center">
              <Activity className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Ready to start your LSS journey?</h3>
              <p className="text-white/70 mb-5 text-sm max-w-xl mx-auto">ISC deploys Lean Six Sigma in the GCC context — accounting for Saudi regulatory requirements, cultural dynamics, and operational realities. Book a scoping call to define your first project.</p>
              <Link href="/governance-compliance"><span className="text-[#C9A84C] text-sm font-semibold underline cursor-pointer">LSS must be governed → See our Governance Framework</span></Link>
              <div className="mt-4 flex justify-center gap-3 flex-wrap">
                <Link href="/consultant"><Button className="bg-[#C9A84C] hover:bg-[#b8943d] text-white font-bold">Book LSS Consultation</Button></Link>
                <Link href="/diagnostic"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">Free Diagnostic</Button></Link>
              </div>
            </Reveal>
          </div>
        )}

      </div>
    </div>
  );
}
