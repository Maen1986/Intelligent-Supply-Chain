/**
 * Digital Maturity & Technology Roadmap Tool — flagship tool for the
 * Digital Transformation Solution page.
 *
 * 1. Digital Maturity Scorer (ERP, Data, Automation, Analytics, Integration)
 * 2. ERP / Technology Module Utilisation Checklist
 * 3. Digital Roadmap Prioritisation Matrix (effort vs impact quadrant)
 * 4. AI Digital Transformation Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Download, Gauge, Puzzle, LayoutGrid, Sparkles, Plus, Trash2 } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const DT_TOOL_KEY = 'digital-transformation' as const;

const SK_MATURITY = 'isc-tool-dt-maturity-v1';
const SK_MODULES = 'isc-tool-dt-modules-v1';
const SK_ROADMAP = 'isc-tool-dt-roadmap-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

interface DtDim { id: string; label: string; labelAr: string; desc: string; descAr: string; }
const DT_DIMS: DtDim[] = [
  { id: 'erp', label: 'ERP Utilisation', labelAr: 'استخدام ERP', desc: 'Share of ERP modules actually used vs licensed', descAr: 'حصة وحدات ERP المستخدمة فعلياً مقابل المرخّصة' },
  { id: 'data', label: 'Data Quality & Governance', labelAr: 'جودة وحوكمة البيانات', desc: 'Master data accuracy, ownership, and validation rules', descAr: 'دقة البيانات الرئيسية وملكيتها وقواعد التحقّق' },
  { id: 'automation', label: 'Process Automation', labelAr: 'أتمتة العمليات', desc: 'Share of routine transactions automated end-to-end', descAr: 'حصة المعاملات الروتينية المؤتمتة من طرف لطرف' },
  { id: 'analytics', label: 'Analytics & Reporting', labelAr: 'التحليلات والتقارير', desc: 'Real-time dashboards vs manual spreadsheet reporting', descAr: 'لوحات لحظية مقابل تقارير جداول بيانات يدوية' },
  { id: 'integration', label: 'System Integration', labelAr: 'تكامل الأنظمة', desc: 'API-based connections vs manual re-keying between systems', descAr: 'اتصالات قائمة على API مقابل إعادة إدخال يدوي بين الأنظمة' },
];

interface Module { id: string; name: string; status: 'not_started' | 'planned' | 'implemented' | 'fully_utilized'; }
function defaultModule(): Module { return { id: Math.random().toString(36).slice(2), name: '', status: 'not_started' }; }
const STATUS_LABELS: Record<Module['status'], { en: string; ar: string; color: string }> = {
  not_started: { en: 'Not Started', ar: 'لم يبدأ', color: '#94a3b8' },
  planned: { en: 'Planned', ar: 'مخطَّط', color: '#d97706' },
  implemented: { en: 'Implemented', ar: 'مُطبَّق', color: '#2563eb' },
  fully_utilized: { en: 'Fully Utilised', ar: 'مُستَغَل بالكامل', color: '#059669' },
};

interface Initiative { id: string; name: string; effort: number; impact: number; }
function defaultInitiative(): Initiative { return { id: Math.random().toString(36).slice(2), name: '', effort: 3, impact: 3 }; }
function quadrantLabel(effort: number, impact: number, isAr: boolean): string {
  if (impact >= 3 && effort < 3) return isAr ? 'مكسب سريع' : 'Quick Win';
  if (impact >= 3 && effort >= 3) return isAr ? 'مشروع كبير' : 'Major Project';
  if (impact < 3 && effort < 3) return isAr ? 'مهمة تكميلية' : 'Fill-In';
  return isAr ? 'إعادة نظر' : 'Reconsider';
}

type Tab = 'maturity' | 'modules' | 'roadmap' | 'ai';

export function DigitalTransformationToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('maturity');

  const [maturity, setMaturity] = useState<Record<string, number>>(() => loadJson(SK_MATURITY, {}));
  const setMat = (id: string, v: number) => setMaturity(prev => { const next = { ...prev, [id]: v }; safeSetItem(SK_MATURITY, JSON.stringify(next)); return next; });
  const matFilled = DT_DIMS.filter(d => maturity[d.id] !== undefined);
  const matAvg = matFilled.length > 0 ? matFilled.reduce((s, d) => s + (maturity[d.id] ?? 0), 0) / matFilled.length : 0;
  const weakestDim = matFilled.length > 0 ? [...matFilled].sort((a, b) => (maturity[a.id] ?? 5) - (maturity[b.id] ?? 5))[0] : null;
  const radarData = DT_DIMS.map(d => ({ dim: isAr ? d.labelAr : d.label, [isAr ? 'الحالي' : 'Current']: maturity[d.id] ?? 0, [isAr ? 'الهدف' : 'Target']: 4 }));

  const [modules, setModules] = useState<Module[]>(() => loadJson(SK_MODULES, [defaultModule()]));
  const saveModules = (m: Module[]) => { setModules(m); safeSetItem(SK_MODULES, JSON.stringify(m)); };
  const updateModule = (id: string, field: keyof Module, value: string) => saveModules(modules.map(m => m.id === id ? { ...m, [field]: value } : m));
  const addModule = () => saveModules([...modules, defaultModule()]);
  const removeModule = (id: string) => saveModules(modules.filter(m => m.id !== id));
  const validModules = modules.filter(m => m.name);
  const utilizedPct = validModules.length > 0 ? Math.round((validModules.filter(m => m.status === 'fully_utilized').length / validModules.length) * 100) : 0;

  const [roadmap, setRoadmap] = useState<Initiative[]>(() => loadJson(SK_ROADMAP, [defaultInitiative()]));
  const saveRoadmap = (r: Initiative[]) => { setRoadmap(r); safeSetItem(SK_ROADMAP, JSON.stringify(r)); };
  const updateInitiative = (id: string, field: keyof Initiative, value: string | number) => saveRoadmap(roadmap.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addInitiative = () => saveRoadmap([...roadmap, defaultInitiative()]);
  const removeInitiative = (id: string) => saveRoadmap(roadmap.filter(r => r.id !== id));
  const validInitiatives = roadmap.filter(r => r.name);

  const buildPrompt = useCallback(() => {
    const matLines = DT_DIMS.map(d => maturity[d.id] !== undefined ? `- ${d.label}: ${maturity[d.id]}/5` : `- ${d.label}: not assessed`).join('\n');
    return [
      '## Digital Transformation Brief', '',
      '## Digital Maturity', matLines, `Overall: ${matAvg > 0 ? matAvg.toFixed(1) : 'N/A'}/5. Weakest: ${weakestDim ? weakestDim.label : 'not assessed'}`,
      '', `## Technology Module Utilisation: ${utilizedPct}% fully utilised (${validModules.length} modules tracked)`,
      '', `## Roadmap Initiatives (${validInitiatives.length})`,
      validInitiatives.map(i => `- ${i.name}: effort ${i.effort}/5, impact ${i.impact}/5 -> ${quadrantLabel(i.effort, i.impact, false)}`).join('\n'),
      '', '## Your Task',
      'Generate a 4-5 paragraph executive digital transformation brief: (1) interpret overall maturity and the weakest dimension, (2) comment on module utilisation and where the biggest ERP waste is, (3) recommend which roadmap initiatives to sequence first based on the effort/impact quadrant, (4) 90-day action plan with [HIGH]/[MEDIUM]/[LOW] labels.',
    ].join('\n');
  }, [maturity, matAvg, weakestDim, utilizedPct, validModules.length, validInitiatives]);

  const canGenerate = matFilled.length >= 3 || validModules.length >= 1 || validInitiatives.length >= 1;
  const aiPlan = useAIPlan(buildPrompt, isAr, DT_TOOL_KEY, canGenerate);

  const handleDownload = () => downloadText('digital-transformation-summary.txt', [isAr ? 'ملخص التحوّل الرقمي' : 'Digital Transformation Summary', '', `Maturity: ${matAvg > 0 ? matAvg.toFixed(1) : '—'}/5`, `Module utilisation: ${utilizedPct}%`, `Roadmap initiatives: ${validInitiatives.length}`].join('\n'));

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'maturity', icon: <Gauge className="w-3.5 h-3.5" />, label: 'Digital Maturity', labelAr: 'النضج الرقمي' },
    { id: 'modules', icon: <Puzzle className="w-3.5 h-3.5" />, label: 'Module Utilisation', labelAr: 'استخدام الوحدات' },
    { id: 'roadmap', icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Roadmap Matrix', labelAr: 'مصفوفة خارطة الطريق' },
    { id: 'ai', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Brief', labelAr: 'موجز AI' },
  ];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); const n = (index + 1) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n = (index - 1 + count) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-indigo-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '💻 أداة النضج الرقمي وخارطة طريق التقنية' : '💻 Digital Maturity & Technology Roadmap Tool'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم النضج الرقمي واستخدام وحدات ERP ورتّب أولويات خارطة الطريق' : 'Assess digital maturity, ERP module utilisation, and prioritise the roadmap'}</p>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-indigo-200 text-indigo-900 hover:bg-indigo-300 transition-colors">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل الملخص' : 'Download Summary'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'maturity' && (
          <div className="space-y-4">
            {matFilled.length >= 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-3" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid /><PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} /><PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name={isAr ? 'الحالي' : 'Current'} dataKey={isAr ? 'الحالي' : 'Current'} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.35} />
                    <Radar name={isAr ? 'الهدف' : 'Target'} dataKey={isAr ? 'الهدف' : 'Target'} stroke="#059669" fill="#059669" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            {DT_DIMS.map(d => {
              const v = maturity[d.id] ?? 0;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]"><p className="font-bold text-sm text-slate-800">{isAr ? d.labelAr : d.label}</p><p className="text-[11px] text-slate-400 mt-0.5">{isAr ? d.descAr : d.desc}</p></div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setMat(d.id, n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>))}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-3">
            {validModules.length > 0 && <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'مستغَل بالكامل' : 'Fully Utilised'}</p><p className="text-lg font-bold text-indigo-700">{utilizedPct}%</p></div>}
            {modules.map(m => (
              <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                <input value={m.name} onChange={e => updateModule(m.id, 'name', e.target.value)} placeholder={isAr ? 'اسم الوحدة/النظام' : 'Module/system name'} className="flex-1 min-w-[160px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <select value={m.status} onChange={e => updateModule(m.id, 'status', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                  {(Object.keys(STATUS_LABELS) as Module['status'][]).map(s => (<option key={s} value={s}>{isAr ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}</option>))}
                </select>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_LABELS[m.status].color }} />
                <button onClick={() => removeModule(m.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={addModule} className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"><Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة وحدة' : 'Add module'}</button>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="relative bg-white border border-slate-200 rounded-2xl p-2" style={{ height: 260 }}>
              <div className="absolute inset-2 border-l border-b border-slate-300">
                <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200" />
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-200" />
                {validInitiatives.map(i => (
                  <div key={i.id} title={i.name} className="absolute w-3 h-3 rounded-full bg-indigo-600 -translate-x-1/2 translate-y-1/2 border-2 border-white shadow"
                    style={{ left: `${(i.effort / 5) * 100}%`, bottom: `${(i.impact / 5) * 100}%` }} />
                ))}
              </div>
              <span className="absolute bottom-0 left-2 text-[10px] text-slate-400">{isAr ? 'الجهد ←' : 'Effort →'}</span>
              <span className="absolute top-2 left-2 text-[10px] text-slate-400" style={{ writingMode: 'vertical-rl' }}>{isAr ? 'الأثر ↑' : 'Impact ↑'}</span>
            </div>
            <div className="space-y-2">
              {roadmap.map(i => (
                <div key={i.id} className="bg-white border border-slate-200 rounded-2xl p-3 grid gap-2 sm:grid-cols-4 items-center">
                  <input value={i.name} onChange={e => updateInitiative(i.id, 'name', e.target.value)} placeholder={isAr ? 'اسم المبادرة' : 'Initiative name'} className="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  <label className="text-[11px] text-slate-500">{isAr ? 'الجهد' : 'Effort'}<input type="range" min={1} max={5} value={i.effort} onChange={e => updateInitiative(i.id, 'effort', Number(e.target.value))} className="w-full accent-indigo-600" /></label>
                  <label className="text-[11px] text-slate-500">{isAr ? 'الأثر' : 'Impact'}<input type="range" min={1} max={5} value={i.impact} onChange={e => updateInitiative(i.id, 'impact', Number(e.target.value))} className="w-full accent-indigo-600" /></label>
                  {i.name && <p className="sm:col-span-4 text-[11px] font-semibold text-indigo-700">{quadrantLabel(i.effort, i.impact, isAr)}</p>}
                  <button onClick={() => removeInitiative(i.id)} className="text-xs text-red-500 hover:underline sm:col-span-4 text-left">{isAr ? 'حذف' : 'Remove'}</button>
                </div>
              ))}
              <button onClick={addInitiative} className="text-xs font-semibold text-indigo-700 hover:underline">+ {isAr ? 'إضافة مبادرة' : 'Add initiative'}</button>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد موجز التحوّل الرقمي ✨' : 'Generate Digital Brief ✨'} isAr={isAr} toolKey={DT_TOOL_KEY} disabled={!canGenerate} />
        )}
      </div>
    </div>
  );
}
