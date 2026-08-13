/**
 * Supply Chain Resilience Stress Test — flagship tool for the
 * Resiliency Solution page.
 *
 * 1. Risk Exposure Scorer   — 6-category exposure rating, radar vs target
 * 2. BCP Readiness Checker  — ISO 22301-aligned weighted checklist
 * 3. Disruption Simulator   — preset scenarios scaled by the user's exposure score
 * 4. AI Resilience Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Download, ShieldAlert, ClipboardCheck, Waves, Sparkles, AlertTriangle } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const RESILIENCY_TOOL_KEY = 'resiliency-stresstest' as const;

const SK_EXPOSURE = 'isc-tool-resiliency-exposure-v1';
const SK_BCP = 'isc-tool-resiliency-bcp-v1';
const SK_SCENARIO = 'isc-tool-resiliency-scenario-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

interface ExposureCat { id: string; label: string; labelAr: string; desc: string; descAr: string; }
const EXPOSURE_CATS: ExposureCat[] = [
  { id: 'single_source', label: 'Single-Source Dependency', labelAr: 'الاعتماد على مصدر واحد', desc: 'Share of critical spend with only one qualified supplier', descAr: 'حصة الإنفاق الحرج بمورد مؤهل واحد فقط' },
  { id: 'geo_concentration', label: 'Geographic Concentration', labelAr: 'التركّز الجغرافي', desc: 'Share of sourcing/production concentrated in one region', descAr: 'حصة التوريد/الإنتاج المركّزة في منطقة واحدة' },
  { id: 'logistics_corridor', label: 'Logistics Corridor Dependency', labelAr: 'الاعتماد على ممر لوجستي', desc: 'Reliance on a single port, route, or carrier', descAr: 'الاعتماد على ميناء أو مسار أو ناقل واحد' },
  { id: 'supplier_financial', label: 'Supplier Financial Health', labelAr: 'الصحة المالية للموردين', desc: 'Visibility into and risk of key supplier financial distress', descAr: 'الرؤية على مخاطر التعثر المالي للموردين الرئيسيين' },
  { id: 'cyber_it', label: 'Cyber / IT Dependency', labelAr: 'الاعتماد السيبراني/التقني', desc: 'Exposure to disruption from IT/OT or supplier cyber incidents', descAr: 'التعرّض للاضطراب من حوادث تقنية المعلومات أو السيبرانية للموردين' },
  { id: 'climate', label: 'Climate / Natural Disaster Exposure', labelAr: 'التعرّض المناخي/الكوارث', desc: 'Exposure of nodes to flood, heat, storm, or seismic risk', descAr: 'تعرّض العقد للفيضانات أو الحرارة أو العواصف أو الزلازل' },
];

interface BcpItem { id: string; label: string; labelAr: string; weight: number; }
const BCP_ITEMS: BcpItem[] = [
  { id: 'bia', label: 'Business Impact Analysis completed for critical processes', labelAr: 'إنجاز تحليل أثر الأعمال للعمليات الحرجة', weight: 15 },
  { id: 'rto', label: 'Recovery Time Objectives (RTO) defined per critical process', labelAr: 'تحديد أهداف زمن التعافي لكل عملية حرجة', weight: 15 },
  { id: 'alt_supply', label: 'Alternative suppliers pre-qualified for top critical items', labelAr: 'تأهيل موردين بديلين مسبقاً للأصناف الحرجة', weight: 15 },
  { id: 'alt_logistics', label: 'Alternative logistics routing pre-approved', labelAr: 'اعتماد مسارات لوجستية بديلة مسبقاً', weight: 15 },
  { id: 'comms', label: 'Crisis communication protocol documented', labelAr: 'توثيق بروتوكول الاتصال في الأزمات', weight: 10 },
  { id: 'buffer', label: 'Buffer stock / safety stock policy defined for critical items', labelAr: 'تحديد سياسة مخزون احتياطي للأصناف الحرجة', weight: 10 },
  { id: 'tested', label: 'BCP tested via tabletop or live exercise in last 12 months', labelAr: 'اختبار خطة الاستمرارية عبر تمرين مكتبي أو حي خلال 12 شهراً', weight: 15 },
  { id: 'certified', label: 'BCP aligned to ISO 22301 or equivalent standard', labelAr: 'مواءمة خطة الاستمرارية مع ISO 22301 أو معيار مكافئ', weight: 5 },
];

interface Scenario { id: string; label: string; labelAr: string; baseLeadDays: number; baseCostPct: number; desc: string; descAr: string; }
const SCENARIOS: Scenario[] = [
  { id: 'port_closure', label: 'Port Closure / Red Sea-Style Corridor Disruption', labelAr: 'إغلاق ميناء / اضطراب ممر على غرار البحر الأحمر', baseLeadDays: 20, baseCostPct: 250, desc: 'Primary sea corridor closed or heavily congested for 4+ weeks', descAr: 'إغلاق الممر البحري الرئيسي أو ازدحامه الشديد لأكثر من 4 أسابيع' },
  { id: 'supplier_failure', label: 'Single-Source Supplier Failure', labelAr: 'فشل مورد أحادي المصدر', baseLeadDays: 35, baseCostPct: 40, desc: 'Sole-source critical supplier ceases operations or defaults', descAr: 'توقف مورد أحادي المصدر حرج عن العمل أو التخلف عن التزاماته' },
  { id: 'freight_spike', label: 'Freight Cost Spike', labelAr: 'ارتفاع مفاجئ في تكلفة الشحن', baseLeadDays: 7, baseCostPct: 60, desc: 'Sudden freight rate spike from capacity shortage or fuel surcharge', descAr: 'ارتفاع مفاجئ في أسعار الشحن بسبب نقص السعة أو رسوم الوقود' },
  { id: 'cyber', label: 'Cyber Attack on ERP / Supplier Systems', labelAr: 'هجوم سيبراني على ERP/أنظمة الموردين', baseLeadDays: 12, baseCostPct: 30, desc: 'Ransomware or systems outage halting order processing', descAr: 'هجوم فدية أو تعطل أنظمة يوقف معالجة الطلبات' },
];

type Tab = 'exposure' | 'bcp' | 'scenario' | 'ai';

export function ResiliencyToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('exposure');

  const [exposure, setExposure] = useState<Record<string, number>>(() => loadJson(SK_EXPOSURE, {}));
  const setExp = (id: string, v: number) => setExposure(prev => { const next = { ...prev, [id]: v }; safeSetItem(SK_EXPOSURE, JSON.stringify(next)); return next; });
  const expFilled = EXPOSURE_CATS.filter(c => exposure[c.id] !== undefined);
  const expAvg = expFilled.length > 0 ? expFilled.reduce((s, c) => s + (exposure[c.id] ?? 0), 0) / expFilled.length : 0;
  const expRadar = EXPOSURE_CATS.map(c => ({ cat: isAr ? c.labelAr : c.label, [isAr ? 'الحالي' : 'Current']: exposure[c.id] ?? 0, [isAr ? 'الهدف' : 'Target']: 2 }));
  const highestExposure = expFilled.length > 0 ? [...expFilled].sort((a, b) => (exposure[b.id] ?? 0) - (exposure[a.id] ?? 0))[0] : null;

  const [bcp, setBcp] = useState<Record<string, boolean>>(() => loadJson(SK_BCP, {}));
  const toggleBcp = (id: string) => setBcp(prev => { const next = { ...prev, [id]: !prev[id] }; safeSetItem(SK_BCP, JSON.stringify(next)); return next; });
  const bcpScore = BCP_ITEMS.reduce((s, i) => s + (bcp[i.id] ? i.weight : 0), 0);
  const bcpBand = bcpScore >= 80 ? { label: 'Strong', labelAr: 'قوي', color: '#059669' } : bcpScore >= 50 ? { label: 'Developing', labelAr: 'ناشئ', color: '#d97706' } : { label: 'Weak', labelAr: 'ضعيف', color: '#dc2626' };

  const [scenarioId, setScenarioId] = useState<string>(() => loadJson(SK_SCENARIO, ''));
  const setScenario = (id: string) => { setScenarioId(id); safeSetItem(SK_SCENARIO, JSON.stringify(id)); };
  const scenario = SCENARIOS.find(s => s.id === scenarioId);
  const multiplier = 1 + (expAvg > 0 ? (expAvg - 1) * 0.15 : 0);
  const projectedLeadDays = scenario ? Math.round(scenario.baseLeadDays * multiplier) : 0;
  const projectedCostPct = scenario ? Math.round(scenario.baseCostPct * multiplier) : 0;

  const buildPrompt = useCallback(() => {
    const expLines = EXPOSURE_CATS.map(c => exposure[c.id] !== undefined ? `- ${c.label}: ${exposure[c.id]}/5` : `- ${c.label}: not assessed`).join('\n');
    const activeBcp = BCP_ITEMS.filter(i => bcp[i.id]).map(i => i.label);
    const missingBcp = BCP_ITEMS.filter(i => !bcp[i.id]).map(i => i.label);
    return [
      `## Supply Chain Resilience Stress Test — Executive Brief`,
      '', `## Risk Exposure (1-5, higher = more exposed)`, expLines,
      `Overall exposure: ${expAvg > 0 ? expAvg.toFixed(1) : 'N/A'}/5. Highest-risk category: ${highestExposure ? highestExposure.label : 'not yet assessed'}`,
      '', `## BCP Readiness: ${bcpScore}/100 (${bcpBand.label})`,
      `In place: ${activeBcp.join('; ') || 'None'}`, `Missing: ${missingBcp.join('; ') || 'None'}`,
      '', `## Disruption Scenario Modelled`,
      scenario ? `${scenario.label} -- projected lead time extension ${projectedLeadDays} days, projected cost impact +${projectedCostPct}%` : 'No scenario selected',
      '', '## Your Task',
      'Generate a 5-paragraph executive resilience brief: (1) overall exposure synthesis, (2) top 2 priority actions to close the highest-risk exposure category, (3) BCP gap-closure plan for the missing items above, (4) interpretation of the modelled scenario and a specific mitigation recommendation, (5) 90-day action plan with [HIGH]/[MEDIUM]/[LOW] labels.',
    ].join('\n');
  }, [exposure, expAvg, highestExposure, bcp, bcpScore, bcpBand, scenario, projectedLeadDays, projectedCostPct]);

  const canGenerate = expFilled.length >= 3 || Object.values(bcp).some(Boolean) || !!scenario;
  const aiPlan = useAIPlan(buildPrompt, isAr, RESILIENCY_TOOL_KEY, canGenerate);

  const handleDownload = () => {
    const lines = [
      isAr ? 'اختبار الإجهاد لمرونة سلسلة الإمداد' : 'Supply Chain Resilience Stress Test', '',
      ...EXPOSURE_CATS.map(c => `${isAr ? c.labelAr : c.label}: ${exposure[c.id] ?? '—'}/5`),
      '', `BCP: ${bcpScore}/100 (${isAr ? bcpBand.labelAr : bcpBand.label})`,
    ];
    downloadText('resilience-stress-test.txt', lines.join('\n'));
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'exposure', icon: <ShieldAlert className="w-3.5 h-3.5" />, label: 'Risk Exposure', labelAr: 'التعرّض للمخاطر' },
    { id: 'bcp', icon: <ClipboardCheck className="w-3.5 h-3.5" />, label: 'BCP Readiness', labelAr: 'جاهزية الاستمرارية' },
    { id: 'scenario', icon: <Waves className="w-3.5 h-3.5" />, label: 'Disruption Simulator', labelAr: 'محاكي الاضطراب' },
    { id: 'ai', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Resilience Brief', labelAr: 'موجز AI للمرونة' },
  ];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); const n = (index + 1) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n = (index - 1 + count) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-red-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '🛡️ اختبار الإجهاد لمرونة سلسلة الإمداد' : '🛡️ Supply Chain Resilience Stress Test'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم التعرّض للمخاطر وجاهزية خطة الاستمرارية وأثر سيناريوهات الاضطراب' : 'Assess risk exposure, BCP readiness, and the impact of disruption scenarios'}</p>
        </div>
        <button onClick={handleDownload} disabled={expFilled.length === 0} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-red-200 text-red-900 hover:bg-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل التقرير' : 'Download Report'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} id={`res-tab-${t.id}`} role="tab" aria-selected={activeTab === t.id} aria-controls={`res-panel-${t.id}`}
            tabIndex={activeTab === t.id ? 0 : -1} ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'exposure' && (
          <div id="res-panel-exposure" role="tabpanel" className="space-y-4">
            {expFilled.length >= 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-3" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={expRadar}>
                    <PolarGrid /><PolarAngleAxis dataKey="cat" tick={{ fontSize: 10 }} /><PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name={isAr ? 'الحالي' : 'Current'} dataKey={isAr ? 'الحالي' : 'Current'} stroke="#dc2626" fill="#dc2626" fillOpacity={0.35} />
                    <Radar name={isAr ? 'الهدف' : 'Target'} dataKey={isAr ? 'الهدف' : 'Target'} stroke="#059669" fill="#059669" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-3">
              {EXPOSURE_CATS.map(c => {
                const v = exposure[c.id] ?? 0;
                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-bold text-sm text-slate-800">{isAr ? c.labelAr : c.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? c.descAr : c.desc}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setExp(c.id, n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'bcp' && (
          <div id="res-panel-bcp" role="tabpanel" className="space-y-4">
            <div className="rounded-2xl p-4 border-2" style={{ borderColor: bcpBand.color, background: `${bcpBand.color}10` }}>
              <p className="text-[11px] font-semibold" style={{ color: bcpBand.color }}>{isAr ? 'جاهزية خطة الاستمرارية' : 'BCP Readiness'}</p>
              <p className="text-2xl font-bold" style={{ color: bcpBand.color }}>{bcpScore}/100 — {isAr ? bcpBand.labelAr : bcpBand.label}</p>
              <div className="w-full h-2.5 bg-white rounded-full mt-3 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${bcpScore}%`, background: bcpBand.color }} /></div>
            </div>
            <div className="space-y-2">
              {BCP_ITEMS.map(i => {
                const checked = !!bcp[i.id];
                return (
                  <label key={i.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleBcp(i.id)} className="mt-0.5 w-4 h-4 accent-red-600" />
                    <span className="text-sm text-slate-700 flex-1">{isAr ? i.labelAr : i.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">+{i.weight}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'scenario' && (
          <div id="res-panel-scenario" role="tabpanel" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setScenario(s.id)} className={`text-left p-4 rounded-2xl border-2 transition-colors ${scenarioId === s.id ? 'border-red-600 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                  <p className="font-bold text-sm text-slate-800">{isAr ? s.labelAr : s.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{isAr ? s.descAr : s.desc}</p>
                </button>
              ))}
            </div>
            {scenario && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">{isAr ? 'الأثر المُقدَّر (معدَّل حسب درجة تعرّضك)' : 'Projected Impact (scaled by your exposure score)'}</p>
                    <p className="text-xs text-amber-800 mt-1">{isAr ? `امتداد مهلة التوريد: ~${projectedLeadDays} يوماً · أثر التكلفة: +${projectedCostPct}%` : `Lead time extension: ~${projectedLeadDays} days · Cost impact: +${projectedCostPct}%`}</p>
                    {expFilled.length === 0 && <p className="text-[11px] text-amber-600 mt-1">{isAr ? 'قيّم التعرّض في التبويب الأول لتحسين دقة هذا التقدير' : 'Score exposure in the first tab to refine this estimate'}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div id="res-panel-ai" role="tabpanel">
            <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
              savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
              retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
              buttonLabel={isAr ? 'توليد موجز المرونة ✨' : 'Generate Resilience Brief ✨'} isAr={isAr} toolKey={RESILIENCY_TOOL_KEY} disabled={!canGenerate} />
          </div>
        )}
      </div>
    </div>
  );
}
