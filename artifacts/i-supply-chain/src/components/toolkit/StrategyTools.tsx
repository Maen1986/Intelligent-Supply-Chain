/**
 * Supply Chain Strategic Health Check — flagship tool for the
 * Supply Chain Strategy Solution page (#132).
 *
 * Four integrated modules:
 * 1. SCOR Process Maturity Scorer  — rate the 6 SCOR Level-1 processes vs GCC benchmark
 * 2. Network Design Diagnostic     — weighted trigger checklist → redesign urgency score
 * 3. S&OP / IBP Maturity Check     — 5-dimension planning-process assessment → maturity band
 * 4. AI Strategy Brief             — AI-generated executive synthesis across all three
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Download, Target, Network, Repeat, Sparkles, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface StrategyToolsProps { isAr: boolean; }

/** Stable server-side key for this tool's AI plan slot (#132). */
export const STRATEGY_TOOL_KEY = 'strategy-healthcheck' as const;

/* ── storage helpers ─────────────────────────────────────────────────── */
const SK_SCOR    = 'isc-tool-strategy-scor-v1';
const SK_NETWORK = 'isc-tool-strategy-network-v1';
const SK_SOP     = 'isc-tool-strategy-sop-v1';

function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function downloadText(filename: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Module 1: SCOR Process Maturity ─────────────────────────────────── */

interface ScorProcess { id: string; label: string; labelAr: string; desc: string; descAr: string; benchmark: number; }

const SCOR_PROCESSES: ScorProcess[] = [
  { id: 'plan',    label: 'Plan',    labelAr: 'التخطيط',      desc: 'Demand/supply balancing, S&OP integration, resource & capacity planning', descAr: 'موازنة العرض والطلب، تكامل S&OP، تخطيط الموارد والطاقة', benchmark: 3.4 },
  { id: 'source',  label: 'Source',  labelAr: 'التوريد',       desc: 'Supplier selection, procurement execution, inbound quality & delivery', descAr: 'اختيار الموردين، تنفيذ المشتريات، جودة وتسليم الوارد', benchmark: 3.6 },
  { id: 'make',    label: 'Make',    labelAr: 'التصنيع/التنفيذ', desc: 'Production or service execution, quality control, capacity utilisation', descAr: 'تنفيذ الإنتاج أو الخدمة، ضبط الجودة، استغلال الطاقة', benchmark: 3.2 },
  { id: 'deliver', label: 'Deliver', labelAr: 'التسليم',       desc: 'Order management, warehousing, transportation, customer service', descAr: 'إدارة الطلبات، التخزين، النقل، خدمة العملاء', benchmark: 3.5 },
  { id: 'return',  label: 'Return',  labelAr: 'الإرجاع',       desc: 'Reverse logistics, defective/excess returns, warranty management', descAr: 'اللوجستيات العكسية، إرجاع التالف/الفائض، إدارة الضمان', benchmark: 2.8 },
  { id: 'enable',  label: 'Enable',  labelAr: 'التمكين',       desc: 'Data, technology, contracts, regulatory compliance & risk supporting all processes', descAr: 'البيانات والتقنية والعقود والامتثال التنظيمي والمخاطر الداعمة لكل العمليات', benchmark: 3.3 },
];

const SCOR_LEVEL_LABELS_EN: Record<number, string> = { 1: 'Ad Hoc', 2: 'Defined', 3: 'Managed', 4: 'Integrated', 5: 'Optimised' };
const SCOR_LEVEL_LABELS_AR: Record<number, string> = { 1: 'عشوائي', 2: 'مُعرَّف', 3: 'مُدار', 4: 'متكامل', 5: 'مُحسَّن' };

/* ── Module 2: Network Design Diagnostic ─────────────────────────────── */

interface NetworkTrigger { id: string; label: string; labelAr: string; weight: number; }

const NETWORK_TRIGGERS: NetworkTrigger[] = [
  { id: 'demand_growth', label: 'Demand has grown more than 20% in the last 2 years without a network redesign', labelAr: 'نما الطلب أكثر من 20% خلال آخر سنتين دون إعادة تصميم للشبكة', weight: 12 },
  { id: 'lead_time',     label: 'Customer complaints about delivery lead time have increased', labelAr: 'ازدادت شكاوى العملاء بشأن مدة التسليم', weight: 10 },
  { id: 'freight_cost',  label: 'Freight/logistics cost as % of revenue is growing faster than revenue itself', labelAr: 'تكلفة الشحن/اللوجستيات كنسبة من الإيرادات تنمو أسرع من الإيرادات نفسها', weight: 12 },
  { id: 'new_market',    label: 'Entering a new geographic market or sales channel within the next 12 months', labelAr: 'دخول سوق جغرافي أو قناة بيع جديدة خلال 12 شهرًا القادمة', weight: 10 },
  { id: 'm_and_a',       label: 'Recent or upcoming M&A, divestiture, or major facility change', labelAr: 'استحواذ/اندماج أو تصفية أو تغيير كبير في المرافق مؤخرًا أو قادم', weight: 10 },
  { id: 'single_region', label: 'More than 60% of sourcing or production is concentrated in a single region/country', labelAr: 'أكثر من 60% من التوريد أو الإنتاج مُركَّز في منطقة/دولة واحدة', weight: 12 },
  { id: 'capacity',      label: 'Any distribution centre, plant, or hub is operating above 85% capacity', labelAr: 'أي مركز توزيع أو مصنع أو محور يعمل بأكثر من 85% من طاقته', weight: 10 },
  { id: 'inventory',     label: 'Inventory days-on-hand has grown for 3 or more consecutive quarters', labelAr: 'ارتفعت أيام تغطية المخزون لثلاثة أرباع متتالية أو أكثر', weight: 8 },
  { id: 'sustainability',label: 'New carbon/ESG targets require re-evaluating transport modes or node locations', labelAr: 'أهداف كربونية/ESG جديدة تستوجب إعادة تقييم وسائط النقل أو مواقع العقد', weight: 8 },
  { id: 'omnichannel',   label: 'The shift to e-commerce/omnichannel is straining the existing fulfilment network', labelAr: 'يضع التحول نحو التجارة الإلكترونية/تعدد القنوات ضغطًا على شبكة التنفيذ الحالية', weight: 8 },
];

const NETWORK_BANDS = [
  { min: 75, label: 'Critical',  labelAr: 'حرج',    color: '#dc2626', action: 'Commission an immediate network redesign initiative — active cost, capacity, or service risk.', actionAr: 'إطلاق مبادرة إعادة تصميم شبكة فورية — مخاطر تكلفة أو طاقة أو خدمة نشطة.' },
  { min: 50, label: 'High',      labelAr: 'مرتفع',  color: '#d97706', action: 'Commission a formal network optimisation study within 6 months.', actionAr: 'تكليف دراسة رسمية لتحسين الشبكة خلال 6 أشهر.' },
  { min: 25, label: 'Moderate',  labelAr: 'متوسط',  color: '#ca8a04', action: 'Plan a scoping study for a network review within 12 months.', actionAr: 'التخطيط لدراسة تمهيدية لمراجعة الشبكة خلال 12 شهرًا.' },
  { min: 0,  label: 'Low',       labelAr: 'منخفض',  color: '#059669', action: 'Monitor triggers annually — no immediate redesign case.', actionAr: 'مراقبة المؤشرات سنويًا — لا توجد حاجة عاجلة لإعادة التصميم.' },
];
function getNetworkBand(score: number) { return NETWORK_BANDS.find(b => score >= b.min) ?? NETWORK_BANDS[NETWORK_BANDS.length - 1]; }

/* ── Module 3: S&OP / IBP Maturity ───────────────────────────────────── */

interface SopDim { id: string; label: string; labelAr: string; desc: string; descAr: string; }

const SOP_DIMENSIONS: SopDim[] = [
  { id: 'cadence',        label: 'Process Rhythm & Cadence', labelAr: 'إيقاع العملية ودوريتها', desc: 'A monthly (or more frequent) S&OP cycle is consistently executed against a fixed calendar', descAr: 'دورة S&OP شهرية (أو أكثر تكرارًا) تُنفَّذ باستمرار وفق تقويم ثابت' },
  { id: 'demand',         label: 'Demand Planning Rigor', labelAr: 'صرامة تخطيط الطلب', desc: 'Statistical forecasting combined with collaborative Sales/Marketing input; accuracy (MAPE/bias) is tracked', descAr: 'تنبؤ إحصائي مع مدخلات تعاونية من المبيعات/التسويق؛ تُتبَّع دقة التنبؤ' },
  { id: 'supply',         label: 'Supply Planning Integration', labelAr: 'تكامل تخطيط التوريد', desc: 'A constrained supply plan is reconciled against the demand plan with visible capacity and inventory positions', descAr: 'خطة توريد مقيَّدة تتم مطابقتها مع خطة الطلب مع رؤية واضحة للطاقة والمخزون' },
  { id: 'reconciliation', label: 'Executive Reconciliation & Decisions', labelAr: 'المطابقة التنفيذية والقرارات', desc: 'A formal executive S&OP meeting resolves gaps and trade-offs with documented decisions and owners', descAr: 'اجتماع S&OP تنفيذي رسمي يحسم الفجوات والمفاضلات بقرارات موثَّقة ومسؤولين محدَّدين' },
  { id: 'technology',     label: 'Technology & Data Integration', labelAr: 'تكامل التقنية والبيانات', desc: 'A single source of truth (APS/IBP platform) is used rather than disconnected spreadsheets', descAr: 'مصدر بيانات موحَّد (منصة APS/IBP) بدل جداول بيانات منفصلة' },
];

const SOP_STAGES = [
  { min: 4.5, label: 'Leading / Integrated Business Planning', labelAr: 'رائد / تخطيط أعمال متكامل', desc: 'Financially integrated, scenario-driven IBP tied directly to strategy execution', descAr: 'تخطيط أعمال متكامل مالياً ومبني على سيناريوهات ومرتبط مباشرة بتنفيذ الاستراتيجية' },
  { min: 3.5, label: 'Extended S&OP', labelAr: 'S&OP موسَّع', desc: 'Cross-functional process that also covers new-product and portfolio decisions', descAr: 'عملية متعددة الوظائف تغطي أيضًا قرارات المنتجات الجديدة والمحفظة' },
  { min: 2.5, label: 'Standard S&OP', labelAr: 'S&OP قياسي', desc: 'Regular monthly cycle with demand-supply balancing and executive reconciliation', descAr: 'دورة شهرية منتظمة مع موازنة العرض والطلب ومطابقة تنفيذية' },
  { min: 1.5, label: 'Basic / Reactive Planning', labelAr: 'تخطيط أساسي / تفاعلي', desc: 'Ad hoc, siloed, spreadsheet-driven planning with no consistent cadence', descAr: 'تخطيط عشوائي ومنعزل ومعتمد على جداول البيانات دون إيقاع ثابت' },
  { min: 0,   label: 'Not Assessed / Pre-S&OP', labelAr: 'غير مقيَّم / ما قبل S&OP', desc: 'No formal planning process exists', descAr: 'لا توجد عملية تخطيط رسمية' },
];
function getSopStage(avg: number) { return SOP_STAGES.find(s => avg >= s.min) ?? SOP_STAGES[SOP_STAGES.length - 1]; }

/* ── Tab type ─────────────────────────────────────────────────────────── */

type Tab = 'scor' | 'network' | 'sop' | 'ai';

/* ── Main Component ──────────────────────────────────────────────────── */

export function StrategyToolsSection({ isAr }: StrategyToolsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('scor');

  /* Module 1: SCOR scores */
  const [scorScores, setScorScores] = useState<Record<string, number>>(() => loadJson(SK_SCOR, {}));
  const setScor = (id: string, val: number) => setScorScores(prev => {
    const next = { ...prev, [id]: val };
    safeSetItem(SK_SCOR, JSON.stringify(next));
    return next;
  });
  const scorFilled = SCOR_PROCESSES.filter(p => scorScores[p.id] !== undefined);
  const scorAvg = scorFilled.length > 0 ? scorFilled.reduce((s, p) => s + (scorScores[p.id] ?? 0), 0) / scorFilled.length : 0;
  const benchmarkAvg = SCOR_PROCESSES.reduce((s, p) => s + p.benchmark, 0) / SCOR_PROCESSES.length;
  const weakestProcess = scorFilled.length > 0
    ? [...scorFilled].sort((a, b) => (scorScores[a.id] ?? 5) - (scorScores[b.id] ?? 5))[0]
    : null;

  const scorRadarData = SCOR_PROCESSES.map(p => ({
    process: isAr ? p.labelAr : p.label,
    [isAr ? 'الحالي' : 'Current']: scorScores[p.id] ?? 0,
    [isAr ? 'المعيار الخليجي' : 'GCC Benchmark']: p.benchmark,
  }));

  /* Module 2: Network triggers */
  const [triggers, setTriggers] = useState<Record<string, boolean>>(() => loadJson(SK_NETWORK, {}));
  const toggleTrigger = (id: string) => setTriggers(prev => {
    const next = { ...prev, [id]: !prev[id] };
    safeSetItem(SK_NETWORK, JSON.stringify(next));
    return next;
  });
  const networkScore = NETWORK_TRIGGERS.reduce((s, t) => s + (triggers[t.id] ? t.weight : 0), 0);
  const networkBand = getNetworkBand(networkScore);
  const activeTriggers = NETWORK_TRIGGERS.filter(t => triggers[t.id]);

  /* Module 3: S&OP dimensions */
  const [sopScores, setSopScores] = useState<Record<string, number>>(() => loadJson(SK_SOP, {}));
  const setSop = (id: string, val: number) => setSopScores(prev => {
    const next = { ...prev, [id]: val };
    safeSetItem(SK_SOP, JSON.stringify(next));
    return next;
  });
  const sopFilled = SOP_DIMENSIONS.filter(d => sopScores[d.id] !== undefined);
  const sopAvg = sopFilled.length > 0 ? sopFilled.reduce((s, d) => s + (sopScores[d.id] ?? 0), 0) / sopFilled.length : 0;
  const sopStage = sopAvg > 0 ? getSopStage(sopAvg) : null;
  const weakestSop = sopFilled.length > 0
    ? [...sopFilled].sort((a, b) => (sopScores[a.id] ?? 5) - (sopScores[b.id] ?? 5))[0]
    : null;

  /* AI prompt spanning all three modules */
  const buildPrompt = useCallback(() => {
    const scorLines = SCOR_PROCESSES.map(p => {
      const v = scorScores[p.id];
      return v !== undefined ? `- ${p.label}: ${v}/5 (GCC benchmark ${p.benchmark}/5)` : `- ${p.label}: not yet assessed`;
    }).join('\n');
    const sopLines = SOP_DIMENSIONS.map(d => {
      const v = sopScores[d.id];
      return v !== undefined ? `- ${d.label}: ${v}/5` : `- ${d.label}: not yet assessed`;
    }).join('\n');
    return [
      `## Supply Chain Strategic Health Check — Executive Brief`,
      '',
      `## SCOR Process Maturity (1-5 scale)`,
      scorLines,
      `Overall SCOR score: ${scorAvg > 0 ? scorAvg.toFixed(1) : 'N/A'}/5 vs GCC benchmark ${benchmarkAvg.toFixed(1)}/5`,
      `Weakest process: ${weakestProcess ? weakestProcess.label : 'not yet assessed'}`,
      '',
      `## Network Design Diagnostic`,
      `Redesign urgency score: ${networkScore}/100 (${networkBand.label})`,
      `Active triggers: ${activeTriggers.map(t => t.label).join('; ') || 'None flagged'}`,
      '',
      `## S&OP / IBP Maturity`,
      sopLines,
      `Overall S&OP score: ${sopAvg > 0 ? sopAvg.toFixed(1) : 'N/A'}/5 → Stage: ${sopStage ? sopStage.label : 'Not assessed'}`,
      `Weakest dimension: ${weakestSop ? weakestSop.label : 'not yet assessed'}`,
      '',
      '## Your Task',
      'Generate a 5-6 paragraph executive Supply Chain Strategy Brief:',
      '1. Overall strategic health synthesis — combine the three diagnostics into a single narrative of readiness',
      '2. SCOR quick wins — 2-3 specific actions to close the gap on the weakest process(es)',
      '3. Network decision recommendation — interpret the urgency score and state whether/when to commission a network study',
      '4. S&OP/IBP improvement roadmap — 2-3 specific actions to advance to the next maturity stage',
      '5. Top 3 strategic priorities for the next 90 days, each labelled [HIGH]/[MEDIUM]/[LOW]',
      '6. One paragraph on how these three areas interconnect (e.g. a network decision should be informed by S&OP demand signals)',
    ].join('\n');
  }, [scorScores, scorAvg, benchmarkAvg, weakestProcess, networkScore, networkBand, activeTriggers, sopScores, sopAvg, sopStage, weakestSop]);

  const canGenerate = scorFilled.length >= 3 || sopFilled.length >= 3 || activeTriggers.length > 0;
  const aiPlan = useAIPlan(buildPrompt, isAr, STRATEGY_TOOL_KEY, canGenerate);

  const handleDownload = () => {
    const date = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
    const lines = [
      isAr ? `تقرير الصحة الاستراتيجية لسلسلة الإمداد — ${date}` : `Supply Chain Strategic Health Check — ${date}`,
      '',
      isAr ? '── نضج عمليات SCOR ──' : '── SCOR Process Maturity ──',
      ...SCOR_PROCESSES.map(p => `${isAr ? p.labelAr : p.label}: ${scorScores[p.id] ?? '—'}/5 (${isAr ? 'المعيار' : 'benchmark'} ${p.benchmark}/5)`),
      '',
      isAr ? `── تشخيص تصميم الشبكة: ${networkScore}/100 (${networkBand.labelAr}) ──` : `── Network Design Diagnostic: ${networkScore}/100 (${networkBand.label}) ──`,
      ...activeTriggers.map(t => `✓ ${isAr ? t.labelAr : t.label}`),
      '',
      isAr ? `── نضج S&OP/IBP: ${sopAvg > 0 ? sopAvg.toFixed(1) : '—'}/5 (${sopStage ? sopStage.labelAr : '—'}) ──` : `── S&OP/IBP Maturity: ${sopAvg > 0 ? sopAvg.toFixed(1) : '—'}/5 (${sopStage ? sopStage.label : '—'}) ──`,
      ...SOP_DIMENSIONS.map(d => `${isAr ? d.labelAr : d.label}: ${sopScores[d.id] ?? '—'}/5`),
    ];
    downloadText('strategic-health-check.txt', lines.join('\n'));
  };

  /* Tab bar keyboard nav */
  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'scor',    icon: <Target className="w-3.5 h-3.5" />,  label: 'SCOR Maturity',   labelAr: 'نضج SCOR' },
    { id: 'network', icon: <Network className="w-3.5 h-3.5" />, label: 'Network Diagnostic', labelAr: 'تشخيص الشبكة' },
    { id: 'sop',     icon: <Repeat className="w-3.5 h-3.5" />,  label: 'S&OP / IBP',      labelAr: 'S&OP / IBP' },
    { id: 'ai',      icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Strategy Brief', labelAr: 'موجز AI الاستراتيجي' },
  ];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % count;
      setActiveTab(tabs[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + count) % count;
      setActiveTab(tabs[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabs[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs[count - 1].id);
      tabRefs.current[count - 1]?.focus();
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-blue-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '🧭 فحص الصحة الاستراتيجية لسلسلة الإمداد' : '🧭 Supply Chain Strategic Health Check'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم نضج SCOR وحاجة إعادة تصميم الشبكة ونضج S&OP في أداة واحدة متكاملة' : 'Assess SCOR maturity, network redesign urgency, and S&OP maturity in one integrated tool'}</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={scorFilled.length === 0 && activeTriggers.length === 0 && sopFilled.length === 0}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-blue-200 text-blue-900 hover:bg-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          {isAr ? 'تنزيل التقرير' : 'Download Report'}
        </button>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id}
            id={`strategy-tab-${t.id}`}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-controls={`strategy-panel-${t.id}`}
            tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => setActiveTab(t.id)}
            onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-[#082C6B] text-[#082C6B] bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">

      {/* ── TAB 1: SCOR Maturity ── */}
      {activeTab === 'scor' && (
        <div id="strategy-panel-scor" role="tabpanel" aria-labelledby="strategy-tab-scor" className="space-y-4">
          {scorFilled.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'درجتك الإجمالية' : 'Your Overall Score'}</p>
                <p className="text-xl font-bold text-[#082C6B]">{scorAvg.toFixed(1)}/5</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'المعيار الخليجي' : 'GCC Benchmark'}</p>
                <p className="text-xl font-bold text-slate-600">{benchmarkAvg.toFixed(1)}/5</p>
              </div>
              {weakestProcess && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[11px] text-amber-600 font-semibold">{isAr ? 'أضعف عملية' : 'Weakest Process'}</p>
                  <p className="text-sm font-bold text-amber-800">{isAr ? weakestProcess.labelAr : weakestProcess.label}</p>
                </div>
              )}
            </div>
          )}

          {scorFilled.length >= 2 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={scorRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="process" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar name={isAr ? 'الحالي' : 'Current'} dataKey={isAr ? 'الحالي' : 'Current'} stroke="#082C6B" fill="#082C6B" fillOpacity={0.35} />
                  <Radar name={isAr ? 'المعيار الخليجي' : 'GCC Benchmark'} dataKey={isAr ? 'المعيار الخليجي' : 'GCC Benchmark'} stroke="#d97706" fill="#d97706" fillOpacity={0.12} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-3">
            {SCOR_PROCESSES.map(p => {
              const v = scorScores[p.id] ?? 0;
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-bold text-sm text-slate-800">{isAr ? p.labelAr : p.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? p.descAr : p.desc}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setScor(p.id, n)}
                          aria-label={`${isAr ? p.labelAr : p.label} ${n}/5`}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-[#082C6B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {v > 0 && (
                    <p className="text-[11px] text-slate-400 mt-2">{isAr ? SCOR_LEVEL_LABELS_AR[v] : SCOR_LEVEL_LABELS_EN[v]} · {isAr ? `مقابل معيار ${p.benchmark}/5` : `vs benchmark ${p.benchmark}/5`}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: Network Design Diagnostic ── */}
      {activeTab === 'network' && (
        <div id="strategy-panel-network" role="tabpanel" aria-labelledby="strategy-tab-network" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{isAr ? 'حدّد المؤشرات المنطبقة عليك. كل مؤشر يحمل وزنًا يُجمَع في درجة إلحاح إعادة تصميم الشبكة من 100.' : 'Check every trigger that applies. Each carries a weight that rolls up into a network redesign urgency score out of 100.'}</p>
          </div>

          <div className={`rounded-2xl p-4 border-2`} style={{ borderColor: networkBand.color, background: `${networkBand.color}10` }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold" style={{ color: networkBand.color }}>{isAr ? 'درجة إلحاح إعادة التصميم' : 'Redesign Urgency Score'}</p>
                <p className="text-2xl font-bold" style={{ color: networkBand.color }}>{networkScore}/100 — {isAr ? networkBand.labelAr : networkBand.label}</p>
              </div>
              {networkScore >= 50 ? <AlertTriangle className="w-8 h-8 shrink-0" style={{ color: networkBand.color }} /> : <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: networkBand.color }} />}
            </div>
            <div className="w-full h-2.5 bg-white rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(networkScore, 100)}%`, background: networkBand.color }} />
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: networkBand.color }}>{isAr ? networkBand.actionAr : networkBand.action}</p>
          </div>

          <div className="space-y-2">
            {NETWORK_TRIGGERS.map(t => {
              const checked = !!triggers[t.id];
              return (
                <label key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleTrigger(t.id)} className="mt-0.5 w-4 h-4 accent-[#082C6B]" />
                  <span className="text-sm text-slate-700 flex-1">{isAr ? t.labelAr : t.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">+{t.weight}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: S&OP / IBP Maturity ── */}
      {activeTab === 'sop' && (
        <div id="strategy-panel-sop" role="tabpanel" aria-labelledby="strategy-tab-sop" className="space-y-4">
          {sopAvg > 0 && sopStage && (
            <div className="rounded-2xl p-4 border-2 border-[#082C6B] bg-blue-50">
              <p className="text-[11px] font-semibold text-[#082C6B]">{isAr ? 'مرحلة النضج' : 'Maturity Stage'}</p>
              <p className="text-lg font-bold text-[#082C6B]">{sopAvg.toFixed(1)}/5 — {isAr ? sopStage.labelAr : sopStage.label}</p>
              <p className="text-xs text-slate-600 mt-1">{isAr ? sopStage.descAr : sopStage.desc}</p>
            </div>
          )}

          <div className="space-y-3">
            {SOP_DIMENSIONS.map(d => {
              const v = sopScores[d.id] ?? 0;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-bold text-sm text-slate-800">{isAr ? d.labelAr : d.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{isAr ? d.descAr : d.desc}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setSop(d.id, n)}
                          aria-label={`${isAr ? d.labelAr : d.label} ${n}/5`}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-[#082C6B] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {weakestSop && sopFilled.length === SOP_DIMENSIONS.length && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800"><strong>{isAr ? 'أولوية التحسين: ' : 'Improvement priority: '}</strong>{isAr ? weakestSop.labelAr : weakestSop.label}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: AI Strategy Brief ── */}
      {activeTab === 'ai' && (
        <div id="strategy-panel-ai" role="tabpanel" aria-labelledby="strategy-tab-ai">
          <AIPlanPanel
            loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error}
            onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved}
            rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds}
            saveError={aiPlan.saveError}
            onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد الموجز الاستراتيجي ✨' : 'Generate Strategy Brief ✨'}
            isAr={isAr} toolKey={STRATEGY_TOOL_KEY}
            disabled={!canGenerate}
          />
          {!canGenerate && (
            <p className="text-[11px] text-slate-400 mt-3 text-center">{isAr ? 'أكمل 3 عناصر تقييم على الأقل في تبويب SCOR أو S&OP، أو حدّد مؤشرًا واحدًا في تشخيص الشبكة، لتفعيل التوليد.' : 'Score at least 3 items in SCOR or S&OP, or flag one network trigger, to enable generation.'}</p>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
