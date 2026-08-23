/**
 * Lean & Agile Diagnostic — flagship tool for the
 * Lean & Agile Supply Chain Solution page.
 *
 * 1. 8 Wastes (DOWNTIME) Assessment
 * 2. Demand Agility / Bullwhip Diagnostic
 * 3. Kaizen Event Tracker
 * 4. AI Lean & Agile Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import { Download, Trash2 as WasteIcon, Waves, ListChecks, Sparkles, Plus, Trash2 } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const LEAN_TOOL_KEY = 'lean-agile' as const;

const SK_WASTES = 'isc-tool-lean-wastes-v1';
const SK_BULLWHIP = 'isc-tool-lean-bullwhip-v1';
const SK_KAIZEN = 'isc-tool-lean-kaizen-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

interface Waste { id: string; label: string; labelAr: string; desc: string; descAr: string; }
const WASTES: Waste[] = [
  { id: 'defects', label: 'Defects', labelAr: 'العيوب', desc: 'Rework, returns, quality failures', descAr: 'إعادة العمل، المرتجعات، إخفاقات الجودة' },
  { id: 'overproduction', label: 'Overproduction', labelAr: 'الإنتاج الزائد', desc: 'Making/ordering more than needed', descAr: 'الإنتاج أو الطلب أكثر من الحاجة' },
  { id: 'waiting', label: 'Waiting', labelAr: 'الانتظار', desc: 'Idle time between process steps', descAr: 'وقت الخمول بين خطوات العملية' },
  { id: 'non_utilized_talent', label: 'Non-Utilized Talent', labelAr: 'المواهب غير المستغلة', desc: 'Underused skills and ideas', descAr: 'مهارات وأفكار غير مستغلة' },
  { id: 'transportation', label: 'Transportation', labelAr: 'النقل', desc: 'Unnecessary movement of goods', descAr: 'حركة غير ضرورية للبضائع' },
  { id: 'inventory', label: 'Inventory', labelAr: 'المخزون', desc: 'Excess stock tying up capital', descAr: 'مخزون زائد يُجمِّد رأس المال' },
  { id: 'motion', label: 'Motion', labelAr: 'الحركة', desc: 'Unnecessary movement of people', descAr: 'حركة غير ضرورية للعاملين' },
  { id: 'extra_processing', label: 'Extra Processing', labelAr: 'المعالجة الزائدة', desc: 'Work beyond what the customer values', descAr: 'عمل يتجاوز ما يقدّره العميل' },
];

interface BwQ { id: string; label: string; labelAr: string; }
const BULLWHIP_Q: BwQ[] = [
  { id: 'forecast_accuracy', label: 'Forecast accuracy is low or not tracked', labelAr: 'دقة التنبؤ منخفضة أو غير مُتتبَّعة' },
  { id: 'order_batching', label: 'Orders are batched (weekly/monthly) rather than placed as needed', labelAr: 'الطلبات مجمَّعة (أسبوعياً/شهرياً) بدل تقديمها حسب الحاجة' },
  { id: 'lead_variability', label: 'Supplier lead time varies significantly and unpredictably', labelAr: 'مهلة التوريد لدى الموردين متفاوتة وغير متوقَّعة بشكل كبير' },
  { id: 'promotions', label: 'Frequent promotions or price changes distort the demand signal', labelAr: 'العروض الترويجية أو تغييرات الأسعار المتكررة تشوّه إشارة الطلب' },
  { id: 'no_pull', label: 'No pull/Kanban signal — replenishment is push-based', labelAr: 'لا توجد إشارة سحب/Kanban — إعادة التموين قائمة على الدفع' },
  { id: 'siloed_planning', label: 'Demand and supply planning are done in separate silos', labelAr: 'تخطيط الطلب والتوريد يتمّان في معزل عن بعضهما' },
];

interface KaizenEvent { id: string; name: string; metric: string; before: number; after: number; }
function defaultEvent(): KaizenEvent { return { id: Math.random().toString(36).slice(2), name: '', metric: '', before: 0, after: 0 }; }

type Tab = 'wastes' | 'bullwhip' | 'kaizen' | 'ai';

export function LeanAgileToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('wastes');

  const [wastes, setWastes] = useState<Record<string, number>>(() => loadJson(SK_WASTES, {}));
  const setWaste = (id: string, v: number) => setWastes(prev => { const next = { ...prev, [id]: v }; safeSetItem(SK_WASTES, JSON.stringify(next)); return next; });
  const wasteFilled = WASTES.filter(w => wastes[w.id] !== undefined);
  const worstWaste = wasteFilled.length > 0 ? [...wasteFilled].sort((a, b) => (wastes[b.id] ?? 0) - (wastes[a.id] ?? 0))[0] : null;
  const wasteAvg = wasteFilled.length > 0 ? wasteFilled.reduce((s, w) => s + (wastes[w.id] ?? 0), 0) / wasteFilled.length : 0;

  const [bullwhip, setBullwhip] = useState<Record<string, boolean>>(() => loadJson(SK_BULLWHIP, {}));
  const toggleBw = (id: string) => setBullwhip(prev => { const next = { ...prev, [id]: !prev[id] }; safeSetItem(SK_BULLWHIP, JSON.stringify(next)); return next; });
  const bwCount = BULLWHIP_Q.filter(q => bullwhip[q.id]).length;
  const bwRisk = bwCount >= 4 ? { label: 'High Bullwhip Risk', labelAr: 'خطر أثر سوط مرتفع', color: '#dc2626' } : bwCount >= 2 ? { label: 'Moderate Bullwhip Risk', labelAr: 'خطر أثر سوط متوسط', color: '#d97706' } : { label: 'Low Bullwhip Risk', labelAr: 'خطر أثر سوط منخفض', color: '#059669' };

  const [events, setEvents] = useState<KaizenEvent[]>(() => loadJson(SK_KAIZEN, [defaultEvent()]));
  const saveEvents = (e: KaizenEvent[]) => { setEvents(e); safeSetItem(SK_KAIZEN, JSON.stringify(e)); };
  const updateEvent = (id: string, field: keyof KaizenEvent, value: string | number) => saveEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  const addEvent = () => saveEvents([...events, defaultEvent()]);
  const removeEvent = (id: string) => saveEvents(events.filter(e => e.id !== id));
  const validEvents = events.filter(e => e.name);

  const buildPrompt = useCallback(() => {
    const wasteLines = WASTES.map(w => wastes[w.id] !== undefined ? `- ${w.label}: ${wastes[w.id]}/5` : `- ${w.label}: not assessed`).join('\n');
    return [
      '## Lean & Agile Supply Chain Brief', '',
      '## 8 Wastes (DOWNTIME) Assessment', wasteLines,
      `Highest-severity waste: ${worstWaste ? worstWaste.label : 'not assessed'}. Overall avg: ${wasteAvg > 0 ? wasteAvg.toFixed(1) : 'N/A'}/5`,
      '', `## Bullwhip Diagnostic: ${bwCount}/6 risk factors present (${bwRisk.label})`,
      `Present: ${BULLWHIP_Q.filter(q => bullwhip[q.id]).map(q => q.label).join('; ') || 'None'}`,
      '', `## Kaizen Events Logged: ${validEvents.length}`,
      validEvents.map(e => `- ${e.name}: ${e.metric} ${e.before} -> ${e.after}`).join('\n'),
      '', '## Your Task',
      'Generate a 4-5 paragraph executive brief: (1) interpret the worst waste category and give 2-3 specific countermeasures, (2) interpret the bullwhip risk and recommend a specific demand-signal fix, (3) comment on the kaizen event results and what to tackle next, (4) 90-day action plan with [HIGH]/[MEDIUM]/[LOW] labels.',
    ].join('\n');
  }, [wastes, worstWaste, wasteAvg, bwCount, bwRisk, bullwhip, validEvents]);

  const canGenerate = wasteFilled.length >= 3 || bwCount > 0 || validEvents.length >= 1;
  const aiPlan = useAIPlan(buildPrompt, isAr, LEAN_TOOL_KEY, canGenerate);

  const handleDownload = () => downloadText('lean-agile-summary.txt', [isAr ? 'ملخص Lean & Agile' : 'Lean & Agile Summary', '', `Worst waste: ${worstWaste ? worstWaste.label : '—'}`, `Bullwhip risk: ${bwRisk.label}`, `Kaizen events: ${validEvents.length}`].join('\n'));

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'wastes', icon: <WasteIcon className="w-3.5 h-3.5" />, label: '8 Wastes', labelAr: 'الهدر الثماني' },
    { id: 'bullwhip', icon: <Waves className="w-3.5 h-3.5" />, label: 'Bullwhip Diagnostic', labelAr: 'تشخيص أثر السوط' },
    { id: 'kaizen', icon: <ListChecks className="w-3.5 h-3.5" />, label: 'Kaizen Tracker', labelAr: 'متتبّع Kaizen' },
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
      <div className="p-5 border-b border-border bg-purple-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '⚡ التشخيص الرشيق والمرن' : '⚡ Lean & Agile Diagnostic'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قيّم الهدر الثماني وخطر أثر السوط وتتبّع فعاليات Kaizen' : 'Assess the 8 wastes, bullwhip risk, and track kaizen events'}</p>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-purple-200 text-purple-900 hover:bg-purple-300 transition-colors">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل الملخص' : 'Download Summary'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'wastes' && (
          <div className="space-y-3">
            {wasteFilled.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'المتوسط العام' : 'Overall Average'}</p><p className="text-lg font-bold text-purple-700">{wasteAvg.toFixed(1)}/5</p></div>
                {worstWaste && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-[11px] text-amber-600 font-semibold">{isAr ? 'أعلى هدر' : 'Worst Waste'}</p><p className="text-sm font-bold text-amber-800">{isAr ? worstWaste.labelAr : worstWaste.label}</p></div>}
              </div>
            )}
            {WASTES.map(w => {
              const v = wastes[w.id] ?? 0;
              return (
                <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]"><p className="font-bold text-sm text-slate-800">{isAr ? w.labelAr : w.label}</p><p className="text-[11px] text-slate-400 mt-0.5">{isAr ? w.descAr : w.desc}</p></div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setWaste(w.id, n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>))}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'bullwhip' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 border-2" style={{ borderColor: bwRisk.color, background: `${bwRisk.color}10` }}>
              <p className="text-[11px] font-semibold" style={{ color: bwRisk.color }}>{isAr ? 'خطر أثر السوط' : 'Bullwhip Risk'}</p>
              <p className="text-xl font-bold" style={{ color: bwRisk.color }}>{bwCount}/6 — {isAr ? bwRisk.labelAr : bwRisk.label}</p>
            </div>
            <div className="space-y-2">
              {BULLWHIP_Q.map(q => {
                const checked = !!bullwhip[q.id];
                return (
                  <label key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleBw(q.id)} className="mt-0.5 w-4 h-4 accent-purple-600" />
                    <span className="text-sm text-slate-700 flex-1">{isAr ? q.labelAr : q.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'kaizen' && (
          <div className="space-y-3">
            {events.map(e => (
              <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-3 grid gap-2 sm:grid-cols-5">
                <input value={e.name} onChange={ev => updateEvent(e.id, 'name', ev.target.value)} placeholder={isAr ? 'اسم الفعالية' : 'Event name'} className="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <input value={e.metric} onChange={ev => updateEvent(e.id, 'metric', ev.target.value)} placeholder={isAr ? 'المؤشر' : 'Metric'} className="border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                <input type="number" value={e.before || ''} onChange={ev => updateEvent(e.id, 'before', Number(ev.target.value))} placeholder={isAr ? 'قبل' : 'Before'} className="border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                <div className="flex items-center gap-1">
                  <input type="number" value={e.after || ''} onChange={ev => updateEvent(e.id, 'after', Number(ev.target.value))} placeholder={isAr ? 'بعد' : 'After'} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                  <button onClick={() => removeEvent(e.id)} className="text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button onClick={addEvent} className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline"><Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة فعالية' : 'Add event'}</button>
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد موجز Lean & Agile ✨' : 'Generate Lean & Agile Brief ✨'} isAr={isAr} toolKey={LEAN_TOOL_KEY} disabled={!canGenerate} />
        )}
      </div>
    </div>
  );
}
