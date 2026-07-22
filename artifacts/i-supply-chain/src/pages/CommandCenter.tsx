import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Link } from 'wouter';
import {
  Target, TrendingUp, ShieldAlert, Brain, ChevronRight, Check,
  AlertTriangle, Zap, BarChart2, DollarSign, Clock, Loader2,
  ArrowRight, Copy, CheckCircle2, Star, RefreshCw, Building2,
  MessageSquare, Languages, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '').replace('/i-supply-chain', '') + '/api-server/api';

// ─── KPI Configuration ────────────────────────────────────────────────────────
const KPI_CONFIG = [
  { id: 'otif',        label: 'OTIF',               unit: '%',    min: 50, max: 100, def: 76, median: 88,  topQ: 95,  norm: (v: number) => v,                                            higher: true  },
  { id: 'invTurns',   label: 'Inventory Turns',     unit: '×/yr', min: 1,  max: 20,  def: 5,  median: 57,  topQ: 100, norm: (v: number) => Math.min(100, (v / 14) * 100),                higher: true  },
  { id: 'procCycle',  label: 'Procurement Cycle',   unit: 'days', min: 3,  max: 60,  def: 28, median: 61,  topQ: 100, norm: (v: number) => Math.max(0, ((60 - v) / 53) * 100),           higher: false },
  { id: 'forecastAcc',label: 'Forecast Accuracy',   unit: '%',    min: 30, max: 99,  def: 63, median: 73,  topQ: 88,  norm: (v: number) => v,                                            higher: true  },
  { id: 'procCost',   label: 'Proc. Cost % Rev',    unit: '%rev', min: 3,  max: 25,  def: 14, median: 56,  topQ: 100, norm: (v: number) => Math.max(0, ((25 - v) / 20) * 100),           higher: false },
  { id: 'perfOrder',  label: 'Perfect Order Rate',  unit: '%',    min: 50, max: 100, def: 73, median: 87,  topQ: 96,  norm: (v: number) => v,                                            higher: true  },
];

const SAR_IMPACT_FACTOR: Record<string, number> = {
  otif: 0.0020, invTurns: 0.0018, procCycle: 0.0009, forecastAcc: 0.0025, procCost: 0.0045, perfOrder: 0.0012,
};

// ─── Savings Levers ───────────────────────────────────────────────────────────
const LEVERS = [
  { id: 'catMgmt',   label: 'Strategic Category Management',  short: 'Category Mgmt', maxPct: 0.13, color: '#082C6B' },
  { id: 'suppCons',  label: 'Supplier Consolidation',         short: 'Supplier Consol.', maxPct: 0.09, color: '#0B3D91' },
  { id: 'procAuto',  label: 'Process & eProcurement Automation', short: 'Automation',  maxPct: 0.05, color: '#C9A84C' },
  { id: 'invOpt',    label: 'Inventory Optimisation',         short: 'Inventory',     maxPct: 0.07, color: '#1a5c2e' },
  { id: 'demand',    label: 'Demand Forecasting Improvement', short: 'Forecasting',   maxPct: 0.04, color: '#7c3aed' },
];

// ─── Bilingual ───────────────────────────────────────────────────────────────
type Lang = 'en' | 'ar';

// ─── Industry Tree (12 industries with sub-sectors) ──────────────────────────
const INDUSTRY_TREE: Record<string, string[]> = {
  'Manufacturing':              ['Automotive & Assembly','Aerospace & Defense','Electronics & Semiconductors','FMCG Manufacturing','Heavy Industry & Steel','Chemicals & Petrochemicals','Plastics & Composites','Textiles & Apparel','Furniture & Wood Products','Medical Devices'],
  'Energy & Oil':               ['Oil & Gas Upstream','Oil & Gas Midstream / Pipelines','Oil & Gas Downstream / Refining','Petrochemicals','Renewable Energy (Solar/Wind)','Power Generation & Utilities','Mining & Extractives'],
  'Government / Public Sector': ['Federal / Central Government','Municipal Authorities','Defense & Security','Healthcare Authorities','Education Ministries','Infrastructure & Transport','Saudi Vision 2030 Entities (NDF, PIF)','Jordan Public Institutions','GCC Development Authorities'],
  'Pharmaceutical':             ['Branded Pharmaceuticals','Generic Pharmaceuticals','Medical Devices & Diagnostics','Biotechnology','Clinical Research Organizations','Healthcare Distribution','Veterinary Products'],
  'Retail & FMCG':              ['Grocery & Supermarkets','Fashion & Apparel','Electronics & Technology Retail','Home & Furniture','Health & Beauty','Foodservice & Restaurants','Wholesale & Distribution','Hypermarkets & Department Stores'],
  'Logistics & Transportation': ['3PL / 4PL Providers','Freight Forwarding','Warehousing & Distribution Centers','Last-Mile Delivery','Courier & Express','Cold Chain Logistics','Port & Customs Operations','Air Cargo','Road Haulage'],
  'Construction & EPC':         ['Residential Construction','Commercial & Office Construction','Infrastructure & Mega Projects','Oil & Gas EPC','Power & Utilities EPC','Industrial Facilities','Roads & Bridges','Smart Cities Development'],
  'Healthcare':                 ['Hospitals & Medical Centers','Diagnostics & Laboratories','Medical & Surgical Supplies','Home Healthcare','Specialist Clinics','Dental Chains','Ophthalmology Centers','Health Insurance'],
  'Technology & ICT':           ['Software & SaaS','Hardware & Electronics','Telecommunications','IT Services & Managed Services','Cloud & Data Centers','Cybersecurity','AI & Data Analytics','FinTech','EdTech'],
  'Food & Beverage':            ['Food Processing & Manufacturing','Dairy Products','Bakery & Confectionery','Beverages (Non-Alcoholic)','Halal Food Production','Agricultural Products & Trading','QSR & Fast Food Chains','Catering & Food Services'],
  'E-commerce':                 ['B2C E-Commerce Platform','B2B E-Commerce','Marketplace & Aggregators','D2C Brand','Cross-Border Trade','Social Commerce','Subscription Services'],
  'Services':                   ['Professional Services (Consulting, Legal, Audit)','Facilities Management (FM)','Hospitality & Tourism','Education & Training','Financial Services & Banking','Media & Entertainment','Real Estate & Property Management'],
};

const REVENUE_BANDS = ['< SAR 50M','SAR 50–200M','SAR 200M–1B','SAR 1–5B','> SAR 5B'];

const PAIN_POINTS = [
  // Cost & Efficiency
  'High procurement costs / maverick spend',
  'Low cost savings achievement vs targets',
  'High total cost of ownership (TCO)',
  // Cycle & Speed
  'Long procurement cycle times',
  'Slow supplier onboarding process',
  'Delayed deliveries / OTIF failures',
  // Supplier Management
  'Poor supplier performance & visibility',
  'Single-source dependencies / supply concentration',
  'No formal supplier segmentation or SRM program',
  'Weak supplier development & collaboration',
  // Inventory & Demand
  'Excess inventory / frequent stockouts',
  'Low inventory turns / high holding costs',
  'Poor demand forecasting accuracy',
  'No S&OP / IBP process',
  // Contract & Governance
  'Weak contract management & compliance',
  'Non-compliance with procurement policy',
  'Weak delegation of authority (DoA) framework',
  'No contract lifecycle management (CLM) system',
  // Digital & Process
  'Manual & paper-based processes',
  'Lack of spend visibility & analytics',
  'No integrated ERP or e-procurement system',
  'Fragmented data across departments',
  // Risk & Compliance
  'High supply chain disruption risk',
  'Weak business continuity planning (BCP)',
  'Regulatory / compliance gaps (GTPL, Vision 2030)',
  'Sole-source & geopolitical supply risk',
  // ESG & Localisation
  'ESG / sustainability compliance pressure',
  'IKTVA / local content compliance (Saudi Arabia)',
  'Vendor ESG risk & ethical sourcing gaps',
];

const MATURITY_DOMAINS = [
  'Strategy & Governance',
  'Procurement & Sourcing',
  'Contract Management (CLM)',
  'Supplier Relationship (SRM)',
  'Operations & Logistics',
  'Risk & Business Continuity',
  'Data & Digital Maturity',
  'Sustainability & ESG',
];

const KPI_DOMAINS = [
  'Cost Savings Achieved vs Target',
  'Supplier On-Time & In-Full (OTIF)',
  'Procurement Cycle Time',
  'Demand Forecast Accuracy',
  'Contract Compliance Rate',
  'Inventory Turnover Rate',
  'Supplier Performance Score',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSAR(v: number) {
  if (v >= 1_000_000) return `SAR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `SAR ${Math.round(v / 1_000)}K`;
  return `SAR ${Math.round(v)}`;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function gaugeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

function riskColor(score: number) {
  if (score < 30) return '#10b981';
  if (score < 55) return '#f59e0b';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

function riskLabel(score: number) {
  if (score < 30) return 'LOW';
  if (score < 55) return 'MODERATE';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const cx = 110, cy = 100, r = 72, sw = 14;
  const startDeg = 135, totalDeg = 270;
  const fillDeg = startDeg + (totalDeg * score) / 100;
  const endDeg = startDeg + totalDeg;
  const color = riskColor(score);
  return (
    <svg viewBox="0 0 220 130" className="w-full max-w-xs mx-auto">
      <path d={gaugeArc(cx, cy, r, startDeg, endDeg)} fill="none" stroke="#E5E7EB" strokeWidth={sw} strokeLinecap="round" />
      <motion.path
        d={gaugeArc(cx, cy, r, startDeg, fillDeg)}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" className="font-bold" style={{ fontSize: 28, fontWeight: 700, fill: color }}>{score}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 11, fill: '#6B7280' }}>/ 100</text>
      <text x={cx} y={cy + 32} textAnchor="middle" style={{ fontSize: 12, fontWeight: 700, fill: color, letterSpacing: 1 }}>{riskLabel(score)}</text>
    </svg>
  );
}

// ─── Tab 1: Benchmark Radar ───────────────────────────────────────────────────
function BenchmarkTab() {
  const defaultVals: Record<string, number> = Object.fromEntries(KPI_CONFIG.map(k => [k.id, k.def]));
  const [vals, setVals] = useState(defaultVals);
  const [revenue, setRevenue] = useState(200); // SAR M

  const radarData = useMemo(() => KPI_CONFIG.map(k => ({
    metric: k.label,
    'Your Score': Math.round(k.norm(vals[k.id] ?? k.def)),
    'GCC Median': k.median,
    'Top Quartile': k.topQ,
  })), [vals]);

  const gaps = useMemo(() => KPI_CONFIG.map(k => {
    const userNorm = k.norm(vals[k.id] ?? k.def);
    const gap = k.median - userNorm;
    const gapAbove = k.topQ - userNorm;
    const sarImpact = Math.max(0, gap) * revenue * 1_000_000 * SAR_IMPACT_FACTOR[k.id];
    return { ...k, userNorm, gap, gapAbove, sarImpact };
  }), [vals, revenue]);

  return (
    <div className="space-y-8">
      {/* Revenue input */}
      <div className="flex items-center gap-4 bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl px-5 py-3">
        <DollarSign className="w-5 h-5 text-[#082C6B] shrink-0" />
        <span className="text-sm font-semibold text-[#082C6B] whitespace-nowrap">Annual Revenue</span>
        <input type="range" min={10} max={5000} step={10} value={revenue} onChange={e => setRevenue(+e.target.value)}
          className="flex-1 accent-[#C9A84C]" />
        <span className="text-sm font-bold text-[#C9A84C] whitespace-nowrap w-24 text-right">SAR {revenue >= 1000 ? `${(revenue/1000).toFixed(1)}B` : `${revenue}M`}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* KPI Sliders */}
        <div className="space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">Your KPI Inputs</h3>
          {KPI_CONFIG.map(k => (
            <div key={k.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">{k.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#C9A84C]">{vals[k.id] ?? k.def}{k.unit}</span>
                  <span className="text-xs text-muted-foreground">/ Median: {k.higher ? '' : ''}{k.id === 'invTurns' ? '8×' : k.id === 'procCycle' ? '18d' : k.id === 'procCost' ? '11%' : `${k.id === 'otif' ? 88 : k.id === 'forecastAcc' ? 73 : 87}%`}</span>
                </div>
              </div>
              <input type="range" min={k.min} max={k.max} value={vals[k.id] ?? k.def}
                onChange={e => setVals(prev => ({ ...prev, [k.id]: +e.target.value }))}
                className="w-full accent-[#082C6B]" />
            </div>
          ))}
        </div>

        {/* Radar Chart */}
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-4">GCC Benchmark Comparison</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Radar name="Your Score" dataKey="Your Score" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.35} strokeWidth={2} />
              <Radar name="GCC Median" dataKey="GCC Median" stroke="#082C6B" fill="none" strokeDasharray="6 3" strokeWidth={1.5} />
              <Radar name="Top Quartile" dataKey="Top Quartile" stroke="#10b981" fill="none" strokeDasharray="3 2" strokeWidth={1} />
              <Legend iconSize={10} iconType="circle" />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Analysis Table */}
      <div>
        <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">Gap Analysis & Financial Impact</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-[#082C6B] text-white">
              <tr>
                {['KPI','Your Score','GCC Median','Gap to Median','Gap to Top Q','Est. Annual Impact'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gaps.map((g, i) => (
                <tr key={g.id} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/40'}>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{g.label}</td>
                  <td className="px-4 py-2.5 font-bold text-[#C9A84C]">{Math.round(g.userNorm)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{g.median}</td>
                  <td className={`px-4 py-2.5 font-semibold ${g.gap > 10 ? 'text-red-600' : g.gap > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {g.gap > 0 ? `−${Math.round(g.gap)}` : `+${Math.abs(Math.round(g.gap))}`}
                  </td>
                  <td className={`px-4 py-2.5 font-semibold ${g.gapAbove > 15 ? 'text-red-600' : g.gapAbove > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {g.gapAbove > 0 ? `−${Math.round(g.gapAbove)}` : `+${Math.abs(Math.round(g.gapAbove))}`}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-[#082C6B]">{g.sarImpact > 10000 ? formatSAR(g.sarImpact) : '< SAR 10K'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#082C6B]/5 border-t border-border">
              <tr>
                <td colSpan={5} className="px-4 py-2.5 font-bold text-[#082C6B] text-sm">Total Improvement Opportunity</td>
                <td className="px-4 py-2.5 font-bold text-[#C9A84C] text-base">{formatSAR(gaps.reduce((s, g) => s + g.sarImpact, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">* Impact estimates based on ISC GCC benchmark database. Actual results subject to organisational context and implementation quality.</p>
      </div>
    </div>
  );
}

// ─── Tab 2: Savings Calculator ────────────────────────────────────────────────
function SavingsTab() {
  const [revenue, setRevenue] = useState(500);
  const [spendPct, setSpendPct] = useState(28);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [levers, setLevers] = useState<Record<string, number>>(Object.fromEntries(LEVERS.map(l => [l.id, 40])));

  const spend = revenue * 1_000_000 * spendPct / 100;
  const calcSaving = (id: string, pct: number) => {
    const lever = LEVERS.find(l => l.id === id)!;
    return spend * lever.maxPct * pct / 100;
  };
  const totalSaving = useMemo(() => LEVERS.reduce((s, l) => s + calcSaving(l.id, levers[l.id] ?? 40), 0), [levers, spend]);
  const roi = totalSaving / (revenue * 1_000_000) * 100;

  const barData = LEVERS.map(l => ({ name: l.short, value: Math.round(calcSaving(l.id, levers[l.id] ?? 40) / 1000) }));

  return (
    <div className="space-y-7">
      {/* Inputs row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">Annual Revenue</label>
          <div className="flex items-center gap-2">
            <input type="range" min={50} max={5000} step={50} value={revenue} onChange={e => setRevenue(+e.target.value)} className="flex-1 accent-[#082C6B]" />
            <span className="text-sm font-bold text-[#C9A84C] w-20 text-right">SAR {revenue >= 1000 ? `${(revenue/1000).toFixed(1)}B` : `${revenue}M`}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">Procurement Spend % of Revenue</label>
          <div className="flex items-center gap-2">
            <input type="range" min={5} max={70} value={spendPct} onChange={e => setSpendPct(+e.target.value)} className="flex-1 accent-[#082C6B]" />
            <span className="text-sm font-bold text-[#C9A84C] w-12 text-right">{spendPct}%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">Industry</label>
          <select value={industry} onChange={e => setIndustry(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Levers */}
        <div className="lg:col-span-3 space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">Improvement Initiative Levers</h3>
          <p className="text-xs text-muted-foreground -mt-3">Slide each lever to indicate how fully you plan to deploy each initiative (0% = no action, 100% = full deployment)</p>
          {LEVERS.map(l => (
            <div key={l.id} className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{l.label}</span>
                <span className="text-sm font-bold" style={{ color: l.color }}>{formatSAR(calcSaving(l.id, levers[l.id] ?? 40))}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={100} value={levers[l.id] ?? 40}
                  onChange={e => setLevers(prev => ({ ...prev, [l.id]: +e.target.value }))}
                  className="flex-1" style={{ accentColor: l.color }} />
                <span className="text-xs text-muted-foreground w-10 text-right">{levers[l.id] ?? 40}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Max potential: {formatSAR(calcSaving(l.id, 100))} (at 100% deployment)</p>
            </div>
          ))}
        </div>

        {/* Total + Chart */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            key={Math.round(totalSaving / 10000)}
            initial={{ scale: 0.97, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#082C6B] rounded-2xl p-6 text-white text-center shadow-xl"
          >
            <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Total Savings Potential</p>
            <p className="text-4xl font-black text-[#C9A84C] mb-1">{formatSAR(totalSaving)}</p>
            <p className="text-sm text-white/80">per annum · {roi.toFixed(1)}% of revenue</p>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 text-center">
              <div><p className="text-white/60 text-xs">Addressable Spend</p><p className="font-bold">{formatSAR(spend)}</p></div>
              <div><p className="text-white/60 text-xs">Payback Period</p><p className="font-bold">6–12 months</p></div>
            </div>
          </motion.div>

          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">Savings Breakdown (SAR K)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v: number) => [`SAR ${v}K`, '']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {LEVERS.map(l => <Cell key={l.id} fill={l.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong className="font-bold">ISC Note:</strong> These estimates are based on ISC's GCC benchmark database and CIPS Category Management savings curves for {industry}. Actual savings depend on organisational readiness, procurement maturity, and implementation quality. Book a consultation for a precise opportunity assessment.
      </div>
    </div>
  );
}

// ─── Tab 3: Risk Exposure ─────────────────────────────────────────────────────
function RiskTab() {
  const [soleSource, setSoleSource] = useState(6);
  const [spendConc, setSpendConc] = useState(55);
  const [leadTime, setLeadTime] = useState(45);
  const [auditAge, setAuditAge] = useState(18);
  const [bcp, setBcp] = useState<'none' | 'partial' | 'full'>('partial');
  const [revenue, setRevenue] = useState(300);

  const score = useMemo(() => {
    const a = Math.min(30, soleSource * 5);
    const b = spendConc / 100 * 25;
    const c = Math.min(20, (leadTime / 90) * 20);
    const d = Math.min(15, (auditAge / 24) * 15);
    const e = bcp === 'none' ? 10 : bcp === 'partial' ? 5 : 0;
    return Math.round(a + b + c + d + e);
  }, [soleSource, spendConc, leadTime, auditAge, bcp]);

  const annualExposure = revenue * 1_000_000 * score * 0.00025;

  const recs = useMemo(() => {
    const all = [
      { cond: soleSource > 4,  text: `Dual-source your top ${Math.min(soleSource, 5)} critical sole-source suppliers within 90 days — each sole-source dependency represents 5+ risk points and potential 2–4 week disruption.`, priority: 'HIGH' },
      { cond: spendConc > 50,  text: `Spend concentration with top 3 suppliers exceeds the ISO 31000 recommended 40% threshold. Diversify by onboarding 2–3 qualified alternatives per category.`, priority: 'HIGH' },
      { cond: leadTime > 30,   text: `Average supplier lead time of ${leadTime} days is significantly above the GCC top quartile of 14 days. Implement VMI or buffer stock agreements for critical items.`, priority: 'MEDIUM' },
      { cond: auditAge > 12,   text: `Supplier audits are ${auditAge} months overdue — CIPS recommends annual audits for strategic suppliers. Schedule a rapid audit programme within 60 days.`, priority: 'MEDIUM' },
      { cond: bcp !== 'full',  text: `${bcp === 'none' ? 'No BCP exists' : 'BCP is incomplete'} — a documented and tested supply chain BCP is mandatory under Saudi GTPL Article 65 and APICS SCOR resilience standards.`, priority: bcp === 'none' ? 'HIGH' : 'MEDIUM' },
    ].filter(r => r.cond);
    return all.slice(0, 3);
  }, [soleSource, spendConc, leadTime, auditAge, bcp]);

  return (
    <div className="space-y-7">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">Risk Profile Inputs</h3>

          {[
            { label: 'Critical Sole-Source Suppliers', val: soleSource, set: setSoleSource, min: 0, max: 20, unit: ' suppliers', display: `${soleSource}` },
            { label: '% Spend with Top 3 Suppliers', val: spendConc, set: setSpendConc, min: 5, max: 100, unit: '%', display: `${spendConc}%` },
            { label: 'Average Supplier Lead Time', val: leadTime, set: setLeadTime, min: 3, max: 120, unit: ' days', display: `${leadTime}d` },
            { label: 'Months Since Last Supplier Audit', val: auditAge, set: setAuditAge, min: 0, max: 36, unit: ' months', display: auditAge === 0 ? 'This month' : `${auditAge}mo` },
          ].map(({ label, val, set, min, max, display }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-sm font-bold text-[#C9A84C]">{display}</span>
              </div>
              <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} className="w-full accent-[#082C6B]" />
            </div>
          ))}

          <div className="space-y-1">
            <span className="text-sm font-semibold">Business Continuity Plan (BCP) Status</span>
            <div className="flex gap-2 mt-1">
              {(['none', 'partial', 'full'] as const).map(opt => (
                <button key={opt} onClick={() => setBcp(opt)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${bcp === opt ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Annual Revenue (for exposure calc)</span>
              <span className="text-sm font-bold text-[#C9A84C]">SAR {revenue >= 1000 ? `${(revenue/1000).toFixed(1)}B` : `${revenue}M`}</span>
            </div>
            <input type="range" min={10} max={5000} step={10} value={revenue} onChange={e => setRevenue(+e.target.value)} className="w-full accent-[#082C6B]" />
          </div>
        </div>

        {/* Gauge + Exposure */}
        <div className="space-y-5">
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">Risk Exposure Score</h3>
          <RiskGauge score={score} />

          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 text-center border ${score >= 75 ? 'bg-red-50 border-red-200' : score >= 55 ? 'bg-orange-50 border-orange-200' : score >= 30 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Annual Disruption Cost</p>
              <p className={`text-xl font-black ${score >= 75 ? 'text-red-700' : score >= 55 ? 'text-orange-700' : score >= 30 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatSAR(annualExposure)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">estimated exposure</p>
            </div>
            <div className="rounded-xl p-4 text-center border bg-[#082C6B]/5 border-[#082C6B]/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">GCC Peer Benchmark</p>
              <p className="text-xl font-black text-[#082C6B]">Score 38</p>
              <p className="text-xs text-muted-foreground mt-0.5">median for your sector</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider">Risk Factor Breakdown</h4>
            {[
              { label: 'Sole-Source Concentration', pts: Math.min(30, soleSource * 5), max: 30 },
              { label: 'Supplier Spend Concentration', pts: Math.round(spendConc / 100 * 25), max: 25 },
              { label: 'Lead Time Exposure', pts: Math.round(Math.min(20, (leadTime / 90) * 20)), max: 20 },
              { label: 'Audit Freshness', pts: Math.round(Math.min(15, (auditAge / 24) * 15)), max: 15 },
              { label: 'BCP Readiness', pts: bcp === 'none' ? 10 : bcp === 'partial' ? 5 : 0, max: 10 },
            ].map(({ label, pts, max }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs w-44 truncate">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: riskColor((pts / max) * 100) }}
                    initial={{ width: 0 }} animate={{ width: `${(pts / max) * 100}%` }} transition={{ duration: 0.8 }} />
                </div>
                <span className="text-xs font-bold w-10 text-right">{pts}/{max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">Priority Risk Mitigations</h3>
          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className={`flex gap-3 rounded-xl p-4 border ${r.priority === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${r.priority === 'HIGH' ? 'text-red-600' : 'text-amber-600'}`} />
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${r.priority === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}>{r.priority} PRIORITY</span>
                  <p className="text-sm mt-0.5">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: AI Executive Briefing ─────────────────────────────────────────────
type BriefingStep = 'step1' | 'step2' | 'step3' | 'generating' | 'result';

interface Briefing {
  executiveSummary: string;
  maturityLevel: string;
  maturityScore: number;
  overallRiskLevel: string;
  criticalGaps: { title: string; businessImpact: string; urgency: string; detail: string; framework: string }[];
  quickWins: { action: string; timeframe: string; expectedSavingPct: number; effort: string; framework: string }[];
  strategicPriorities: { priority: number; title: string; rationale: string; expectedROI: string; timeline: string }[];
  ninetyDayPlan: { month1: { focus: string; milestones: string[] }; month2: { focus: string; milestones: string[] }; month3: { focus: string; milestones: string[] }; totalProjectedSaving: string };
  benchmarkInsight: string;
  sustainabilityOpportunity?: string;
  resiliencyGap?: string;
  recommendedPackage: string;
  recommendedPackageRationale: string;
  consultantNote: string;
}

function BriefingTab({ lang }: { lang: Lang }) {
  const [step, setStep] = useState<BriefingStep>('step1');
  const [industry, setIndustry] = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [subIndustry, setSubIndustry] = useState('');
  const [revenueBand, setRevenueBand] = useState(REVENUE_BANDS[1]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [kpiRatings, setKpiRatings] = useState<Record<string, number>>(Object.fromEntries(KPI_DOMAINS.map(d => [d, 3])));
  const [maturityRatings, setMaturityRatings] = useState<Record<string, number>>(Object.fromEntries(MATURITY_DOMAINS.map(d => [d, 2])));
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const togglePain = (p: string) => setPainPoints(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const generate = useCallback(async () => {
    setStep('generating');
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, revenueBand, painPoints, kpiRatings, maturityRatings, language: lang }),
      });
      const data = await resp.json() as { success: boolean; briefing: Briefing; error?: string };
      if (!data.success || !data.briefing) throw new Error(data.error || 'No briefing returned');
      setBriefing(data.briefing);
      setStep('result');
      // Persist to database — fire-and-forget, never blocks the UI
      fetch(`${API_BASE}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tool: 'command_centre',
          inputs: { industry, revenueBand, painPoints, kpiRatings, maturityRatings },
          outputs: data.briefing,
        }),
      }).catch(() => { /* non-blocking */ });
    } catch (err) {
      setError(String(err));
      setStep('step3');
    }
  }, [industry, revenueBand, painPoints, kpiRatings, maturityRatings]);

  const copyBriefing = () => {
    if (!briefing) return;
    const header = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'CONFIDENTIAL — © 2026 I Supply Chain. All Rights Reserved.',
      'Proprietary methodology — Ma\'in Alhaqash MCIPS · CPSM · MSc · MIPP',
      'Unauthorised reproduction, distribution or disclosure is strictly prohibited.',
      'Generated by ISC Command Centre — isupplychain.com',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
    ].join('\n');
    const body = `ISC EXECUTIVE SUPPLY CHAIN BRIEFING\n\nExecutive Summary:\n${briefing.executiveSummary}\n\nMaturity: ${briefing.maturityLevel} (${briefing.maturityScore}/100)\n\nCritical Gaps:\n${briefing.criticalGaps.map((g, i) => `${i+1}. ${g.title} — ${g.businessImpact}`).join('\n')}\n\nQuick Wins:\n${briefing.quickWins.map((w, i) => `${i+1}. ${w.action} (${w.timeframe}, ~${w.expectedSavingPct}% savings)`).join('\n')}\n\n90-Day Plan:\nMonth 1: ${briefing.ninetyDayPlan.month1.focus}\nMonth 2: ${briefing.ninetyDayPlan.month2.focus}\nMonth 3: ${briefing.ninetyDayPlan.month3.focus}\n\nProjected Year-1 Saving: ${briefing.ninetyDayPlan.totalProjectedSaving}\n\n— Ma'in Alhaqash, MCIPS · CPSM · MSc · MIPP\n   I Supply Chain | haqash.maen@gmail.com\n\n© 2026 I Supply Chain. All Rights Reserved. Proprietary & Confidential.`;
    navigator.clipboard.writeText(header + body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgencyColor: Record<string, string> = { Immediate: 'text-red-700 bg-red-50 border-red-200', '90-Day': 'text-amber-700 bg-amber-50 border-amber-200', '6-Month': 'text-blue-700 bg-blue-50 border-blue-200' };
  const effortColor: Record<string, string> = { Low: 'text-emerald-700 bg-emerald-50', Medium: 'text-amber-700 bg-amber-50', High: 'text-red-700 bg-red-50' };

  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-[#082C6B]" />
        </motion.div>
        <div className="text-center">
          <p className="font-bold text-[#082C6B] text-lg">Generating your Executive Briefing…</p>
          <p className="text-muted-foreground text-sm mt-1">Ma'in's AI is analysing your profile against GCC benchmarks</p>
        </div>
        {['Analysing KPI gaps vs GCC top quartile…','Cross-referencing CIPS & APICS SCOR frameworks…','Identifying highest-ROI interventions…','Drafting your 90-day action plan…'].map((t, i) => (
          <motion.p key={t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.6 }} className="text-xs text-muted-foreground">{t}</motion.p>
        ))}
      </div>
    );
  }

  if (step === 'result' && briefing) {
    const maturityBg = briefing.maturityScore < 40 ? 'bg-red-600' : briefing.maturityScore < 60 ? 'bg-amber-500' : briefing.maturityScore < 80 ? 'bg-blue-600' : 'bg-emerald-600';
    return (
      <div className="space-y-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Confidential Executive Briefing</span>
            <h2 className="text-2xl font-black text-[#082C6B] mt-0.5">{industry} Supply Chain Assessment</h2>
            <p className="text-sm text-muted-foreground">{revenueBand} · Ma'in Alhaqash MCIPS CPSM MSc</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyBriefing} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Briefing'}
            </button>
            <button onClick={() => { setStep('step1'); setBriefing(null); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" /> New Assessment
            </button>
          </div>
        </div>

        {/* Scores row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Maturity Level</p>
            <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-bold ${maturityBg}`}>{briefing.maturityLevel}</span>
            <p className="text-3xl font-black text-[#082C6B] mt-2">{briefing.maturityScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Risk Level</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${briefing.overallRiskLevel === 'Critical' ? 'bg-red-100 text-red-700' : briefing.overallRiskLevel === 'High' ? 'bg-orange-100 text-orange-700' : briefing.overallRiskLevel === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{briefing.overallRiskLevel}</span>
            <p className="text-sm text-muted-foreground mt-3">Overall supply chain risk exposure</p>
          </div>
          <div className="rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Package</p>
            <span className="inline-block px-3 py-1 rounded-full bg-[#082C6B] text-white text-sm font-bold">{briefing.recommendedPackage}</span>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{briefing.recommendedPackageRationale}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
          <h3 className="text-xs uppercase tracking-widest text-white/60 mb-3 font-semibold">Executive Summary</h3>
          <p className="text-base leading-relaxed">{briefing.executiveSummary}</p>
        </div>

        {/* Critical Gaps */}
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">Critical Gaps — Immediate Attention Required</h3>
          <div className="space-y-3">
            {briefing.criticalGaps.map((g, i) => (
              <div key={i} className={`rounded-xl border p-4 ${urgencyColor[g.urgency] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <h4 className="font-bold">{i + 1}. {g.title}</h4>
                  <div className="flex gap-2 items-center shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${urgencyColor[g.urgency]}`}>{g.urgency}</span>
                    <span className="text-xs bg-white/60 px-2 py-0.5 rounded-full font-semibold">{g.framework}</span>
                  </div>
                </div>
                <p className="font-bold text-sm mb-1">{g.businessImpact}</p>
                <p className="text-sm leading-relaxed opacity-90">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        <div>
          <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider mb-3">Quick Wins — Implement Now</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {briefing.quickWins.map((w, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-4 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{w.action}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-[#082C6B]/10 text-[#082C6B] px-2 py-0.5 rounded-full font-semibold"><Clock className="w-2.5 h-2.5 inline mr-1" />{w.timeframe}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${effortColor[w.effort]}`}>{w.effort} effort</span>
                    <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full font-semibold">~{w.expectedSavingPct}% saving</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{w.framework}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 90-Day Plan */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#082C6B] text-sm uppercase tracking-wider">90-Day Transformation Roadmap</h3>
            <span className="text-sm font-bold text-[#C9A84C]">{briefing.ninetyDayPlan.totalProjectedSaving} projected Year 1</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {([['month1','Month 1','#082C6B'],['month2','Month 2','#0B3D91'],['month3','Month 3','#C9A84C']] as const).map(([key, label, color]) => (
              <div key={key} className="rounded-xl border border-border p-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black mb-3" style={{ backgroundColor: color }}>{label.split(' ')[1]}</div>
                <p className="font-bold text-sm mb-2" style={{ color }}>{briefing.ninetyDayPlan[key].focus}</p>
                <ul className="space-y-1.5">
                  {briefing.ninetyDayPlan[key].milestones.map((m, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />{m}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark + Consultant Note */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-5">
            <h4 className="font-bold text-[#082C6B] text-xs uppercase tracking-wider mb-2">GCC Peer Benchmark Context</h4>
            <p className="text-sm text-foreground leading-relaxed">{briefing.benchmarkInsight}</p>
          </div>
          <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <img src="/i-supply-chain/maen-photo.jpg" alt="Ma'in" className="w-10 h-10 rounded-full object-cover object-top border-2 border-[#C9A84C]" />
              <div>
                <p className="font-bold text-[#082C6B] text-sm">Ma'in Alhaqash</p>
                <p className="text-xs text-muted-foreground">MCIPS · CPSM · MSc · MIPP</p>
              </div>
            </div>
            <p className="text-sm italic text-foreground leading-relaxed">"{briefing.consultantNote}"</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#082C6B] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white font-bold text-lg">Ready to activate these recommendations?</p>
            <p className="text-white/70 text-sm">Book a free 45-minute consultation to build your implementation plan.</p>
          </div>
          <Link href="/consultant">
            <Button className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
              Book Consultation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Wizard Steps ───────────────────────────────────────────────────────────
  const stepTitles = ['Your Organisation','Pain Points','Self-Assessment'];
  const stepIcons = [Building2, AlertTriangle, BarChart2];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress */}
      <div className="flex items-center gap-0">
        {stepTitles.map((t, i) => {
          const currentIdx = step === 'step1' ? 0 : step === 'step2' ? 1 : 2;
          const Icon = stepIcons[i];
          return (
            <React.Fragment key={t}>
              <div className={`flex flex-col items-center gap-1 ${i <= currentIdx ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${i < currentIdx ? 'bg-emerald-500 text-white' : i === currentIdx ? 'bg-[#082C6B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < currentIdx ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{t}</span>
              </div>
              {i < stepTitles.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      <AnimatePresence mode="wait">
        {step === 'step1' && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h3 className="text-xl font-bold text-[#082C6B]">Tell us about your organisation</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{lang === 'ar' ? 'القطاع الصناعي' : 'Industry / Sector'}</label>
              <select value={industry} onChange={e => { setIndustry(e.target.value); setSubIndustry(''); }}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                {Object.keys(INDUSTRY_TREE).map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{lang === 'ar' ? 'القطاع الفرعي (اختياري)' : 'Sub-Sector (optional)'}</label>
              <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                <option value="">{lang === 'ar' ? '— كل القطاعات الفرعية —' : '— All sub-sectors —'}</option>
                {(INDUSTRY_TREE[industry] ?? []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Annual Revenue Band</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REVENUE_BANDS.map(b => (
                  <button key={b} onClick={() => setRevenueBand(b)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${revenueBand === b ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setStep('step2')} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {step === 'step2' && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <h3 className="text-xl font-bold text-[#082C6B]">What are your biggest challenges?</h3>
            <p className="text-sm text-muted-foreground">Select all that apply — minimum 2</p>
            <div className="flex flex-wrap gap-2">
              {PAIN_POINTS.map(p => (
                <button key={p} onClick={() => togglePain(p)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${painPoints.includes(p) ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40'}`}>
                  {painPoints.includes(p) && <Check className="w-3 h-3 inline mr-1" />}{p}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('step1')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('step3')} disabled={painPoints.length < 2} className="flex-1 bg-[#082C6B] hover:bg-[#0B3D91] text-white">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'step3' && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h3 className="text-xl font-bold text-[#082C6B]">Rate your current performance</h3>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">KPI Performance (1 = Very Poor, 5 = Excellent)</h4>
              {KPI_DOMAINS.map(d => (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm w-48 shrink-0">{d}</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setKpiRatings(prev => ({ ...prev, [d]: n }))}
                        className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${(kpiRatings[d] ?? 3) >= n ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-muted-foreground border-border hover:border-[#082C6B]/40'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Process Maturity (1 = Reactive, 5 = World-Class)</h4>
              {MATURITY_DOMAINS.map(d => (
                <div key={d} className="flex items-center gap-3">
                  <span className="text-sm w-48 shrink-0">{d}</span>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setMaturityRatings(prev => ({ ...prev, [d]: n }))}
                        className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${(maturityRatings[d] ?? 2) >= n ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'bg-white text-muted-foreground border-border hover:border-[#C9A84C]/40'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('step2')} className="flex-1">Back</Button>
              <Button onClick={generate} className="flex-1 bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold">
                <Brain className="w-4 h-4 mr-2" /> Generate My Briefing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 5: AI Consultancy Engine ────────────────────────────────────────────
type ConsultStage = 'input' | 'diagnosing' | 'diagnosis' | 'solving' | 'solution' | 'refining';

interface DiagnosisResult {
  challengeSummary: string;
  rootCauses: { cause: string; framework: string; severity: string }[];
  riskAssessment: { level: string; topRisks: string[]; iso31000Score: number };
  maturityAssessment: { level: string; score: number; keyGaps: string[] };
  diagnosticSummary: string;
  urgentActions: string[];
  estimatedAnnualCost: string;
  consultantNote: string;
}

interface SolutionResult {
  executiveSolution: string;
  solutionPhases: { phase: number; title: string; duration: string; focus: string; activities: string[]; deliverables: string[]; kpis: string[]; framework: string }[];
  kpiDashboard: { kpi: string; baseline: string; target: string; timeframe: string }[];
  sustainabilityImpact: string;
  resiliencyImpact: string;
  totalProjectedSaving: string;
  roi: string;
  nextStep: string;
  consultantNote: string;
}

function ConsultancyTab({ lang }: { lang: Lang }) {
  const [stage, setStage]           = useState<ConsultStage>('input');
  const [industry, setIndustry]     = useState(Object.keys(INDUSTRY_TREE)[0]);
  const [subIndustry, setSubIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [challenge, setChallenge]   = useState('');
  const [diagnosis, setDiagnosis]   = useState<DiagnosisResult | null>(null);
  const [solution, setSolution]     = useState<SolutionResult | null>(null);
  const [error, setError]           = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [feedback, setFeedback]     = useState('');
  const [escalated, setEscalated]   = useState(false);
  const ar = lang === 'ar';

  const runDiagnosis = useCallback(async () => {
    if (challenge.trim().length < 20) return;
    setStage('diagnosing'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/diagnose`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, companySize: companySize || undefined, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Diagnosis failed');
      setDiagnosis(d.diagnosis); setStage('diagnosis');
    } catch (e) { setError(String(e)); setStage('input'); }
  }, [industry, subIndustry, challenge, companySize, lang]);

  const generateSolution = useCallback(async () => {
    if (!diagnosis) return;
    setStage('solving'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/solution`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, diagnosis, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Solution failed');
      setSolution(d.solution); setStage('solution');
    } catch (e) { setError(String(e)); setStage('diagnosis'); }
  }, [industry, subIndustry, challenge, diagnosis, lang]);

  const refineSolution = useCallback(async () => {
    if (!solution || !feedback.trim()) return;
    setStage('refining'); setError('');
    try {
      const r = await fetch(`${API_BASE}/consultancy/refine`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry: subIndustry || undefined, challenge, previousSolution: solution, feedback, language: lang }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Refinement failed');
      setSolution(d.solution); setFeedback(''); setStage('solution');
    } catch (e) { setError(String(e)); setStage('solution'); }
  }, [industry, subIndustry, challenge, solution, feedback, lang]);

  const escalate = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/consultancy/escalate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ industry, subIndustry, challenge, diagnosis, solution, satisfactionScore: satisfaction }),
      });
      setEscalated(true);
    } catch { /* best-effort */ }
  }, [industry, subIndustry, challenge, diagnosis, solution, satisfaction]);

  const isLoading = stage === 'diagnosing' || stage === 'solving' || stage === 'refining';

  if (isLoading) {
    const msg = stage === 'diagnosing' ? (ar ? 'جارٍ تشخيص تحديك...' : 'Running AI diagnosis...')
               : stage === 'solving'   ? (ar ? 'جارٍ إنشاء خطة الحل...' : 'Generating solution plan...')
               : (ar ? 'جارٍ تحسين الحل...' : 'Refining solution...');
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-[#082C6B]" />
        </motion.div>
        <p className="font-bold text-[#082C6B] text-lg text-center">{msg}</p>
        {stage === 'diagnosing' && (
          <div className="space-y-2 text-center">
            {[
              ar ? 'تطبيق نموذج SCOR...' : 'Applying SCOR model analysis...',
              ar ? 'تقييم إطار CIPS...' : 'Evaluating CIPS framework gaps...',
              ar ? 'تحديد الأسباب الجذرية...' : 'Identifying root causes (Six Sigma)...',
              ar ? 'تقييم مخاطر ISO 31000...' : 'Assessing ISO 31000 risk exposure...',
            ].map((t, i) => (
              <motion.p key={t} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.7 }} className="text-xs text-muted-foreground">{t}</motion.p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-7 ${ar ? 'text-right' : ''}`} dir={ar ? 'rtl' : 'ltr'}>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

      {/* INPUT */}
      {stage === 'input' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl mx-auto">
          <div>
            <h3 className="text-xl font-black text-[#082C6B]">{ar ? 'محرك الاستشارات الذكي' : 'AI Consultancy Engine'}</h3>
            <p className="text-muted-foreground text-sm mt-1">{ar ? 'صِف تحديك وسيقوم الذكاء الاصطناعي بتشخيصه وتقديم حلول عالمية المستوى بناءً على SCOR وCIPS وLean وSix Sigma' : 'Describe your challenge and receive a world-class, framework-grounded diagnosis and solution plan. Powered by SCOR, CIPS, Lean, Six Sigma, ISO 31000.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الصناعي' : 'Industry / Sector'}</label>
              <select value={industry} onChange={e => { setIndustry(e.target.value); setSubIndustry(''); }} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                {Object.keys(INDUSTRY_TREE).map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{ar ? 'القطاع الفرعي' : 'Sub-Sector'}</label>
              <select value={subIndustry} onChange={e => setSubIndustry(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
                <option value="">{ar ? '— اختر —' : '— All sub-sectors —'}</option>
                {(INDUSTRY_TREE[industry] ?? []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? 'حجم الشركة / الإيرادات' : 'Company Size / Revenue Band'}</label>
            <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30">
              <option value="">{ar ? '— اختر —' : '— Select —'}</option>
              {REVENUE_BANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">{ar ? 'صِف تحديك أو مشكلتك' : 'Describe your challenge or pain point'}</label>
            <textarea value={challenge} onChange={e => setChallenge(e.target.value)} rows={5}
              placeholder={ar ? 'مثال: نعاني من ارتفاع تكاليف المشتريات وطول دورة الشراء وضعف أداء الموردين وانعدام الرؤية في بيانات الإنفاق...' : 'Example: We struggle with high procurement costs, long cycle times, poor supplier performance, excess inventory, weak contract compliance, or lack of spend visibility...'}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 resize-none" />
            <p className="text-xs text-muted-foreground">{challenge.length}/2000</p>
          </div>
          <Button onClick={runDiagnosis} disabled={challenge.trim().length < 20} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold py-3">
            <Brain className="w-4 h-4 mr-2" />{ar ? 'ابدأ التشخيص الذكي' : 'Run AI Diagnosis'}
          </Button>
        </motion.div>
      )}

      {/* DIAGNOSIS */}
      {stage === 'diagnosis' && diagnosis && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{ar ? 'نتائج التشخيص' : 'AI Diagnosis Results'}</span>
              <h2 className="text-xl font-black text-[#082C6B] mt-0.5">{industry}{subIndustry ? ` — ${subIndustry}` : ''}</h2>
            </div>
            <button onClick={() => setStage('input')} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'تشخيص جديد' : 'New Diagnosis'}</button>
          </div>
          <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2">{ar ? 'ملخص التحدي' : 'Challenge Summary'}</p>
            <p className="text-base leading-relaxed">{diagnosis.challengeSummary}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'مستوى النضج' : 'Maturity'}</p>
              <p className="font-black text-[#082C6B] text-sm">{diagnosis.maturityAssessment.level}</p>
              <p className="text-2xl font-black text-[#082C6B] mt-1">{diagnosis.maturityAssessment.score}<span className="text-sm font-normal">/100</span></p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'المخاطر' : 'Risk Level'}</p>
              <p className={`font-black text-sm ${diagnosis.riskAssessment.level === 'Critical' ? 'text-red-600' : diagnosis.riskAssessment.level === 'High' ? 'text-orange-600' : diagnosis.riskAssessment.level === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>{diagnosis.riskAssessment.level}</p>
              <p className="text-2xl font-black mt-1" style={{ color: riskColor(diagnosis.riskAssessment.iso31000Score) }}>{diagnosis.riskAssessment.iso31000Score}<span className="text-sm font-normal">/100</span></p>
            </div>
            <div className="rounded-xl border p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'التكلفة السنوية' : 'Annual Cost'}</p>
              <p className="font-black text-[#C9A84C] text-sm mt-2 leading-tight">{diagnosis.estimatedAnnualCost}</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'الأسباب الجذرية' : 'Root Causes'}</h4>
            <div className="space-y-2">
              {(diagnosis.rootCauses ?? []).map((rc, i) => (
                <div key={i} className={`flex gap-3 rounded-xl p-4 border ${rc.severity === 'High' ? 'bg-red-50 border-red-200' : rc.severity === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${rc.severity === 'High' ? 'text-red-600' : rc.severity === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{rc.cause}</p><p className="text-xs text-muted-foreground mt-0.5">{rc.framework}</p></div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full h-fit shrink-0 ${rc.severity === 'High' ? 'bg-red-100 text-red-700' : rc.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{rc.severity}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-5">
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-2">{ar ? 'التشخيص التفصيلي' : 'Detailed Diagnosis'}</h4>
            <p className="text-sm leading-relaxed whitespace-pre-line">{diagnosis.diagnosticSummary}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'إجراءات فورية هذا الأسبوع' : 'Urgent Actions — This Week'}</h4>
            <div className="space-y-2">
              {(diagnosis.urgentActions ?? []).map((a, i) => (
                <div key={i} className="flex gap-3 items-start bg-white rounded-xl border border-border p-3">
                  <span className="w-6 h-6 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-xs font-black shrink-0">{i+1}</span>
                  <p className="text-sm">{a}</p>
                </div>
              ))}
            </div>
          </div>
          {diagnosis.consultantNote && (
            <div className="bg-[#082C6B]/5 border border-[#082C6B]/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <img src="/i-supply-chain/maen-photo.jpg" alt="Ma'in" className="w-9 h-9 rounded-full object-cover object-top border-2 border-[#C9A84C]" />
                <div><p className="font-bold text-[#082C6B] text-sm">Ma'in Alhaqash</p><p className="text-xs text-muted-foreground">MCIPS · CPSM · MSc · MIPP</p></div>
              </div>
              <p className="text-sm italic">"{diagnosis.consultantNote}"</p>
            </div>
          )}
          <Button onClick={generateSolution} className="w-full bg-[#082C6B] hover:bg-[#0B3D91] text-white font-bold py-3">
            <Zap className="w-4 h-4 mr-2" />{ar ? 'إنشاء خطة الحل الكاملة' : 'Generate Full Solution Plan'}
          </Button>
        </motion.div>
      )}

      {/* SOLUTION */}
      {stage === 'solution' && solution && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{ar ? 'خطة الحل' : 'Solution Plan'}</span>
              <h2 className="text-xl font-black text-[#082C6B] mt-0.5">{industry}{subIndustry ? ` — ${subIndustry}` : ''}</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStage('diagnosis')} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'العودة للتشخيص' : 'Back to Diagnosis'}</button>
              <button onClick={() => { setStage('input'); setDiagnosis(null); setSolution(null); setSatisfaction(0); }} className="text-xs text-muted-foreground hover:text-foreground underline">{ar ? 'بدء جديد' : 'Start Over'}</button>
            </div>
          </div>
          <div className="bg-[#082C6B] rounded-2xl p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2">{ar ? 'ملخص الحل التنفيذي' : 'Executive Solution'}</p>
            <p className="text-base leading-relaxed">{solution.executiveSolution}</p>
            <div className="flex gap-6 mt-4 flex-wrap">
              <div><p className="text-[#C9A84C] font-black text-lg">{solution.totalProjectedSaving}</p><p className="text-white/60 text-xs">{ar ? 'التوفير المتوقع' : 'Projected Saving'}</p></div>
              <div><p className="text-[#C9A84C] font-black text-lg">{solution.roi}</p><p className="text-white/60 text-xs">{ar ? 'العائد على الاستثمار' : 'ROI'}</p></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'مراحل التنفيذ' : 'Implementation Phases'}</h4>
            <div className="space-y-4">
              {(solution.solutionPhases ?? []).map(phase => (
                <div key={phase.phase} className="rounded-xl border border-border p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 rounded-full bg-[#082C6B] text-white flex items-center justify-center text-sm font-black shrink-0">{phase.phase}</span>
                    <div><p className="font-bold text-[#082C6B]">{phase.title}</p><p className="text-xs text-muted-foreground">{phase.duration} · {phase.framework}</p></div>
                  </div>
                  <p className="text-sm font-semibold mb-3">{phase.focus}</p>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'الأنشطة' : 'Activities'}</p>{phase.activities.map((a,i) => <p key={i} className="flex gap-1 mt-0.5"><Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />{a}</p>)}</div>
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'المخرجات' : 'Deliverables'}</p>{phase.deliverables.map((d,i) => <p key={i} className="flex gap-1 mt-0.5"><ChevronRight className="w-3 h-3 text-[#082C6B] shrink-0 mt-0.5" />{d}</p>)}</div>
                    <div><p className="font-bold text-muted-foreground uppercase tracking-wider mb-1">{ar ? 'مؤشرات الأداء' : 'KPIs'}</p>{phase.kpis.map((k,i) => <p key={i} className="flex gap-1 mt-0.5"><BarChart2 className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" />{k}</p>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {(solution.kpiDashboard ?? []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#082C6B] uppercase tracking-wider mb-3">{ar ? 'لوحة مؤشرات الأداء' : 'KPI Dashboard'}</h4>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="bg-muted border-b border-border">
                    <th className="px-4 py-2 text-left font-bold text-muted-foreground uppercase">{ar ? 'المؤشر' : 'KPI'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الوضع الحالي' : 'Baseline'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الهدف' : 'Target'}</th>
                    <th className="px-4 py-2 text-center font-bold text-muted-foreground uppercase">{ar ? 'الإطار الزمني' : 'Timeframe'}</th>
                  </tr></thead>
                  <tbody>{solution.kpiDashboard.map((row, i) => (
                    <tr key={i} className={`border-b border-border ${i%2===0?'bg-white':'bg-muted/20'}`}>
                      <td className="px-4 py-2 font-semibold">{row.kpi}</td>
                      <td className="px-4 py-2 text-center text-muted-foreground">{row.baseline}</td>
                      <td className="px-4 py-2 text-center font-bold text-emerald-700">{row.target}</td>
                      <td className="px-4 py-2 text-center text-[#082C6B] font-semibold">{row.timeframe}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C9A84C] mb-1">{ar ? 'الخطوة التالية الفورية' : 'Immediate Next Step'}</p>
            <p className="text-sm font-semibold">{solution.nextStep}</p>
          </div>
          {/* Sustainability + Resiliency */}
          {(solution.sustainabilityImpact || solution.resiliencyImpact) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {solution.sustainabilityImpact && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">{ar ? 'أثر الاستدامة' : 'Sustainability Impact'}</p><p className="text-sm text-emerald-900 leading-relaxed">{solution.sustainabilityImpact}</p></div>}
              {solution.resiliencyImpact && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">{ar ? 'أثر المرونة' : 'Resiliency Impact'}</p><p className="text-sm text-blue-900 leading-relaxed">{solution.resiliencyImpact}</p></div>}
            </div>
          )}
          {/* Satisfaction */}
          {!escalated && (
            <div className="rounded-xl border border-border p-5 space-y-3">
              <h4 className="text-sm font-bold text-[#082C6B]">{ar ? 'ما مدى رضاك عن هذا الحل؟' : 'How satisfied are you with this solution?'}</h4>
              <div className="flex gap-2 items-center">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setSatisfaction(n)}
                    className={`w-10 h-10 rounded-full border text-sm font-bold transition-all ${satisfaction >= n ? 'bg-[#C9A84C] text-white border-[#C9A84C]' : 'bg-white text-muted-foreground border-border hover:border-[#C9A84C]'}`}>
                    {n}
                  </button>
                ))}
                {satisfaction > 0 && <span className="text-sm text-muted-foreground ml-2">{satisfaction >= 4 ? (ar ? '— ممتاز!' : '— Great!') : (ar ? '— دعنا نحسّنه' : '— Let us improve')}</span>}
              </div>
              {satisfaction > 0 && satisfaction < 4 && (
                <div className="space-y-2">
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                    placeholder={ar ? 'ما الذي تريد تحسينه أو توضيحه؟' : 'What would you like improved or clarified?'}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#082C6B]/30 resize-none" />
                  <Button onClick={refineSolution} disabled={!feedback.trim()} className="bg-[#082C6B] hover:bg-[#0B3D91] text-white text-sm">
                    <RefreshCw className="w-3 h-3 mr-1" />{ar ? 'تحسين الحل' : 'Refine Solution'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {/* Escalate CTA */}
          <div className="bg-[#082C6B] rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold text-base">{ar ? "تريد متابعة شخصية من ما'ين الحقاش؟" : "Need personalised follow-up from Ma'in?"}</p>
              <p className="text-white/70 text-sm mt-1">{escalated ? (ar ? 'تم الإرسال! ستتلقى ردًا خلال 4 ساعات عمل.' : 'Escalated! Response within 4 business hours.') : (ar ? 'أرسل تحديك وتشخيصك لما\'ين مباشرة' : "Send your AI diagnosis to Ma'in for a human consultation.")}</p>
            </div>
            {!escalated ? (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={escalate} className="bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold shrink-0">
                  <MessageSquare className="w-4 h-4 mr-2" />{ar ? 'إحالة للمستشار' : 'Escalate to Consultant'}
                </Button>
                <Link href="/consultant">
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 shrink-0">
                    {ar ? 'احجز موعداً' : 'Book Consultation'} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'benchmark',   label: 'GCC Benchmark Radar',   icon: Target,      desc: 'Compare your KPIs against GCC quartiles' },
  { id: 'savings',     label: 'Savings Calculator',     icon: TrendingUp,  desc: 'Model your savings potential by initiative' },
  { id: 'risk',        label: 'Risk Exposure Score',    icon: ShieldAlert, desc: 'Quantify and prioritise supply chain risk' },
  { id: 'briefing',    label: 'AI Executive Briefing',  icon: Brain,       desc: 'Receive a personalised, AI-generated strategy report' },
  { id: 'consultancy', label: 'AI Consultancy Engine',  icon: Sparkles,    desc: 'Full AI diagnostic & solution workflow — SCOR, Lean, Six Sigma, ISO 31000' },
] as const;
type TabId = typeof TABS[number]['id'];

const TAB_LABELS_AR: Record<string, { label: string; desc: string }> = {
  benchmark:   { label: 'رادار المعيار الخليجي',   desc: 'قارن مؤشراتك بنظراء الخليج' },
  savings:     { label: 'حاسبة التوفير',            desc: 'احسب إمكانات التوفير المحتملة' },
  risk:        { label: 'مؤشر المخاطر',             desc: 'قيّم مخاطر سلسلة التوريد' },
  briefing:    { label: 'التقرير التنفيذي الذكي',   desc: 'تقرير استراتيجي مخصص بالذكاء الاصطناعي' },
  consultancy: { label: 'محرك الاستشارات الذكي',    desc: 'تشخيص وحل كامل بالذكاء الاصطناعي' },
};

const STAT_ITEMS = [
  { value: '14%', label: 'avg. procurement savings unlocked by ISC clients' },
  { value: '23d',  label: 'average reduction in procurement cycle time' },
  { value: '38%', label: 'reduction in supply chain disruption exposure' },
  { value: '6mo', label: 'typical payback period for ISC engagements' },
];

export function CommandCenter() {
  const [tab,  setTab]  = useState<TabId>('benchmark');
  const [lang, setLang] = useState<Lang>('en');
  const ar = lang === 'ar';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-[#082C6B] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,#C9A84C,transparent)]" />
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-[0.2em]">ISC Intelligence Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Supply Chain<br /><span className="text-[#C9A84C]">Command Centre</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
              The GCC's most advanced AI supply chain intelligence hub. Benchmark your KPIs, model savings potential, score your risk exposure, and receive an AI-generated executive strategy briefing — all in minutes, not months.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {STAT_ITEMS.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-black text-[#C9A84C]">{s.value}</p>
                <p className="text-white/70 text-xs mt-1 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="container mx-auto px-4 py-10">
        {/* Tab Nav */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`rounded-xl p-4 text-left border transition-all ${tab === t.id ? 'bg-[#082C6B] text-white border-[#082C6B] shadow-lg' : 'bg-white text-foreground border-border hover:border-[#082C6B]/40 hover:shadow-sm'}`}>
                <Icon className={`w-5 h-5 mb-2 ${tab === t.id ? 'text-[#C9A84C]' : 'text-[#082C6B]'}`} />
                <p className="font-bold text-sm leading-tight">{t.label}</p>
                <p className={`text-xs mt-1 leading-relaxed ${tab === t.id ? 'text-white/70' : 'text-muted-foreground'}`}>{t.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Active Panel */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {tab === 'benchmark'   && <BenchmarkTab />}
              {tab === 'savings'     && <SavingsTab />}
              {tab === 'risk'        && <RiskTab />}
              {tab === 'briefing'    && <BriefingTab lang={lang} />}
              {tab === 'consultancy' && <ConsultancyTab lang={lang} />}
              {tab === 'consultancy' && <ConsultancyTab lang={lang} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── How We Compare ──────────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-border">
          <div className="bg-[#082C6B] px-6 py-4">
            <h3 className="text-white font-black text-base">How ISC Command Centre Compares</h3>
            <p className="text-white/60 text-xs mt-0.5">The only AI supply chain intelligence platform built for the GCC — CIPS-grounded, affordable plans sized to your organisation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted w-44">What you need</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted">Traditional Consultant</th>
                  <th className="px-5 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted">McKinsey / Big-4</th>
                  <th className="px-5 py-3 text-center text-xs font-black uppercase tracking-wider bg-[#082C6B]/8 text-[#082C6B]">⚡ ISC Command Centre</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Time to first insight',         '2 – 4 weeks',        '3 – 6 months',        '60 seconds'],
                  ['Cost',                          'SAR 50K – 150K',     'SAR 500K – 2M+',      'SAR 250 – 2,500 / mo'],
                  ['GCC & Vision 2030 expertise',   '⚠️ Variable',         '⚠️ Variable',          '✅ Embedded'],
                  ['CIPS / APICS SCOR grounding',   '⚠️ Variable',         '❌ Rarely',            '✅ Always'],
                  ['Personalised to your data',     '✅ Manual',           '✅ Manual',            '✅ AI-powered'],
                  ['Quantified SAR impact',         '✅ Yes (delayed)',    '✅ Yes (delayed)',     '✅ Instant'],
                  ['90-day actionable roadmap',     '✅ Yes (weeks)',      '✅ Yes (months)',      '✅ In 60 seconds'],
                  ['Immediate next steps',          '⚠️ After engagement', '⚠️ After engagement', '✅ Right now'],
                ].map(([label, trad, big4, isc], i) => (
                  <tr key={i} className={`border-b border-border ${i % 2 === 0 ? 'bg-white' : 'bg-muted/30'}`}>
                    <td className="px-5 py-3 text-xs font-semibold text-foreground">{label}</td>
                    <td className="px-5 py-3 text-center text-xs text-muted-foreground">{trad}</td>
                    <td className="px-5 py-3 text-center text-xs text-muted-foreground">{big4}</td>
                    <td className="px-5 py-3 text-center text-xs font-bold text-[#082C6B] bg-[#082C6B]/5">{isc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-[#C9A84C]" />
            <p className="text-sm text-muted-foreground">These tools are powered by ISC's GCC benchmark database and 20+ years of hands-on transformation experience.</p>
          </div>
          <Link href="/consultant">
            <Button className="bg-[#082C6B] hover:bg-[#0B3D91] text-white shrink-0">
              Talk to Ma'in <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
