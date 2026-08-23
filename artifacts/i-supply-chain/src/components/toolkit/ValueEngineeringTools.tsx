/**
 * Should-Cost & Value Engineering Toolkit — flagship tool for the
 * Value Engineering Solution page.
 *
 * 1. Should-Cost Calculator — bottom-up should-cost vs quoted price
 * 2. FAST Function Worksheet — function analysis, flag over-engineering
 * 3. VE Maturity Check — 5-dimension self-assessment
 * 4. AI VE Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import { Download, Calculator, ListTree, Gauge, Sparkles } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const VE_TOOL_KEY = 've-shouldcost' as const;

const SK_COST = 'isc-tool-ve-shouldcost-v1';
const SK_FUNCS = 'isc-tool-ve-functions-v1';
const SK_MATURITY = 'isc-tool-ve-maturity-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

interface CostInputs { material: number; labor: number; overheadPct: number; targetMarginPct: number; quotedPrice: number; }
const DEFAULT_COST: CostInputs = { material: 0, labor: 0, overheadPct: 15, targetMarginPct: 12, quotedPrice: 0 };

interface FuncRow { id: string; name: string; type: 'basic' | 'secondary'; allocatedCostPct: number; overEngineered: boolean; }
function defaultFuncRow(): FuncRow { return { id: Math.random().toString(36).slice(2), name: '', type: 'basic', allocatedCostPct: 0, overEngineered: false }; }

interface MaturityDim { id: string; label: string; labelAr: string; desc: string; descAr: string; }
const MATURITY_DIMS: MaturityDim[] = [
  { id: 'function', label: 'Function Analysis', labelAr: 'التحليل الوظيفي', desc: 'Systematic function identification (FAST) before cost work begins', descAr: 'تحديد الوظائف بشكل منهجي (FAST) قبل بدء عمل التكلفة' },
  { id: 'should_cost', label: 'Should-Cost Modelling', labelAr: 'نمذجة التكلفة المتوقّعة', desc: 'Bottom-up should-cost models exist for top spend categories', descAr: 'نماذج تكلفة متوقّعة من الأسفل للأعلى لأهم فئات الإنفاق' },
  { id: 'cross_func', label: 'Cross-Functional VE', labelAr: 'هندسة القيمة متعددة الوظائف', desc: 'Engineering, quality, and procurement collaborate on VE exercises', descAr: 'تعاون الهندسة والجودة والمشتريات في تمارين هندسة القيمة' },
  { id: 'conversion', label: 'Idea Conversion Rate', labelAr: 'معدّل تحويل الأفكار', desc: 'Share of VE ideas that get approved and implemented', descAr: 'نسبة أفكار هندسة القيمة المعتمدة والمنفَّذة' },
  { id: 'tracking', label: 'Savings Tracking', labelAr: 'تتبّع الوفورات', desc: 'VE savings are tracked and reported to leadership', descAr: 'وفورات هندسة القيمة تُتبَّع ويُبلَّغ عنها للقيادة' },
];

type Tab = 'shouldcost' | 'fast' | 'maturity' | 'ai';

export function ValueEngineeringToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('shouldcost');

  const [cost, setCost] = useState<CostInputs>(() => loadJson(SK_COST, DEFAULT_COST));
  const updateCost = (field: keyof CostInputs, value: number) => setCost(prev => { const next = { ...prev, [field]: value }; safeSetItem(SK_COST, JSON.stringify(next)); return next; });
  const shouldCost = cost.material + cost.labor + (cost.material + cost.labor) * (cost.overheadPct / 100);
  const shouldCostWithMargin = shouldCost * (1 + cost.targetMarginPct / 100);
  const savingsOpportunity = cost.quotedPrice > 0 ? Math.round(((cost.quotedPrice - shouldCostWithMargin) / cost.quotedPrice) * 100) : 0;

  const [funcs, setFuncs] = useState<FuncRow[]>(() => loadJson(SK_FUNCS, [defaultFuncRow()]));
  const saveFuncs = (f: FuncRow[]) => { setFuncs(f); safeSetItem(SK_FUNCS, JSON.stringify(f)); };
  const updateFunc = (id: string, field: keyof FuncRow, value: any) => saveFuncs(funcs.map(f => f.id === id ? { ...f, [field]: value } : f));
  const addFunc = () => saveFuncs([...funcs, defaultFuncRow()]);
  const removeFunc = (id: string) => saveFuncs(funcs.filter(f => f.id !== id));
  const validFuncs = funcs.filter(f => f.name);
  const secondaryCostPct = validFuncs.filter(f => f.type === 'secondary').reduce((s, f) => s + f.allocatedCostPct, 0);
  const overEngineeredCount = validFuncs.filter(f => f.overEngineered).length;

  const [maturity, setMaturity] = useState<Record<string, number>>(() => loadJson(SK_MATURITY, {}));
  const setMat = (id: string, v: number) => setMaturity(prev => { const next = { ...prev, [id]: v }; safeSetItem(SK_MATURITY, JSON.stringify(next)); return next; });
  const matFilled = MATURITY_DIMS.filter(d => maturity[d.id] !== undefined);
  const matAvg = matFilled.length > 0 ? matFilled.reduce((s, d) => s + (maturity[d.id] ?? 0), 0) / matFilled.length : 0;

  const buildPrompt = useCallback(() => {
    const matLines = MATURITY_DIMS.map(d => maturity[d.id] !== undefined ? `- ${d.label}: ${maturity[d.id]}/5` : `- ${d.label}: not assessed`).join('\n');
    return [
      '## Should-Cost & Value Engineering Brief', '',
      '## Should-Cost Analysis',
      `Material: ${cost.material} | Labor: ${cost.labor} | Overhead: ${cost.overheadPct}% | Target margin: ${cost.targetMarginPct}%`,
      `Calculated should-cost (with margin): ${shouldCostWithMargin.toFixed(0)} vs quoted price ${cost.quotedPrice} -> savings opportunity ${savingsOpportunity}%`,
      '', '## Function Analysis (FAST)',
      `${validFuncs.length} functions logged. Secondary-function cost share: ${secondaryCostPct}%. Flagged as over-engineered: ${overEngineeredCount}`,
      '', '## VE Maturity', matLines, `Overall: ${matAvg > 0 ? matAvg.toFixed(1) : 'N/A'}/5`,
      '', '## Your Task',
      'Generate a 4-5 paragraph executive VE brief: (1) interpret the should-cost gap and give a specific negotiation strategy, (2) flag which functions look over-engineered and why that matters, (3) 2-3 concrete actions to close the biggest VE maturity gap, (4) a 90-day action plan with [HIGH]/[MEDIUM]/[LOW] priority labels.',
    ].join('\n');
  }, [cost, shouldCostWithMargin, savingsOpportunity, validFuncs, secondaryCostPct, overEngineeredCount, maturity, matAvg]);

  const canGenerate = cost.quotedPrice > 0 || validFuncs.length >= 2 || matFilled.length >= 3;
  const aiPlan = useAIPlan(buildPrompt, isAr, VE_TOOL_KEY, canGenerate);

  const handleDownload = () => {
    downloadText('value-engineering-summary.txt', [
      isAr ? 'ملخص هندسة القيمة' : 'Value Engineering Summary', '',
      `Should-cost: ${shouldCostWithMargin.toFixed(0)} vs quoted ${cost.quotedPrice} (savings ${savingsOpportunity}%)`,
      `VE maturity: ${matAvg > 0 ? matAvg.toFixed(1) : '—'}/5`,
    ].join('\n'));
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'shouldcost', icon: <Calculator className="w-3.5 h-3.5" />, label: 'Should-Cost Calculator', labelAr: 'حاسبة التكلفة المتوقّعة' },
    { id: 'fast', icon: <ListTree className="w-3.5 h-3.5" />, label: 'FAST Function Worksheet', labelAr: 'ورقة تحليل الوظائف' },
    { id: 'maturity', icon: <Gauge className="w-3.5 h-3.5" />, label: 'VE Maturity', labelAr: 'نضج هندسة القيمة' },
    { id: 'ai', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI VE Brief', labelAr: 'موجز AI' },
  ];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); const n = (index + 1) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n = (index - 1 + count) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-amber-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '⚙️ أداة التكلفة المتوقّعة وهندسة القيمة' : '⚙️ Should-Cost & Value Engineering Toolkit'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'احسب التكلفة المتوقّعة وحلّل الوظائف وقيّم نضج هندسة القيمة' : 'Calculate should-cost, analyse functions, and assess VE maturity'}</p>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-amber-200 text-amber-900 hover:bg-amber-300 transition-colors">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل الملخص' : 'Download Summary'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-amber-600 text-amber-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'shouldcost' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">{isAr ? 'تكلفة المواد' : 'Material Cost'}
                <input type="number" value={cost.material || ''} onChange={e => updateCost('material', Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">{isAr ? 'تكلفة العمالة' : 'Labor Cost'}
                <input type="number" value={cost.labor || ''} onChange={e => updateCost('labor', Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">{isAr ? 'النفقات العامة %' : 'Overhead %'}
                <input type="number" value={cost.overheadPct} onChange={e => updateCost('overheadPct', Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600">{isAr ? 'هامش الربح المستهدف %' : 'Target Margin %'}
                <input type="number" value={cost.targetMarginPct} onChange={e => updateCost('targetMarginPct', Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">{isAr ? 'السعر المعروض من المورد' : 'Supplier Quoted Price'}
                <input type="number" value={cost.quotedPrice || ''} onChange={e => updateCost('quotedPrice', Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </label>
            </div>
            {(cost.material > 0 || cost.labor > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'التكلفة المتوقّعة' : 'Should-Cost'}</p><p className="text-lg font-bold text-[#082C6B]">{shouldCostWithMargin.toFixed(0)}</p></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'السعر المعروض' : 'Quoted Price'}</p><p className="text-lg font-bold text-slate-600">{cost.quotedPrice || '—'}</p></div>
                <div className={`rounded-xl p-3 border ${savingsOpportunity > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'فرصة التوفير' : 'Savings Opportunity'}</p><p className={`text-lg font-bold ${savingsOpportunity > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{savingsOpportunity}%</p></div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fast' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">{isAr ? 'أدرج وظائف المنتج/الخدمة وصنّفها أساسية أو ثانوية، وحدّد حصتها من التكلفة، وعلّم المبالغ فيها.' : 'List each product/service function, classify it as basic or secondary, allocate its cost share, and flag any that look over-engineered.'}</div>
            {funcs.map(f => (
              <div key={f.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                <input value={f.name} onChange={e => updateFunc(f.id, 'name', e.target.value)} placeholder={isAr ? 'اسم الوظيفة' : 'Function name'} className="flex-1 min-w-[140px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <select value={f.type} onChange={e => updateFunc(f.id, 'type', e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-sm">
                  <option value="basic">{isAr ? 'أساسية' : 'Basic'}</option>
                  <option value="secondary">{isAr ? 'ثانوية' : 'Secondary'}</option>
                </select>
                <input type="number" value={f.allocatedCostPct || ''} onChange={e => updateFunc(f.id, 'allocatedCostPct', Number(e.target.value))} placeholder="% cost" className="w-20 border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={f.overEngineered} onChange={e => updateFunc(f.id, 'overEngineered', e.target.checked)} className="accent-amber-600" />{isAr ? 'مبالغ فيها' : 'Over-eng.'}</label>
                <button onClick={() => removeFunc(f.id)} className="text-xs text-red-500 hover:underline">{isAr ? 'حذف' : 'Remove'}</button>
              </div>
            ))}
            <button onClick={addFunc} className="text-xs font-semibold text-amber-700 hover:underline">+ {isAr ? 'إضافة وظيفة' : 'Add function'}</button>
            {validFuncs.length > 0 && <p className="text-xs text-slate-500">{isAr ? `حصة تكلفة الوظائف الثانوية: ${secondaryCostPct}% · مبالغ فيها: ${overEngineeredCount}` : `Secondary-function cost share: ${secondaryCostPct}% · Over-engineered: ${overEngineeredCount}`}</p>}
          </div>
        )}

        {activeTab === 'maturity' && (
          <div className="space-y-3">
            {MATURITY_DIMS.map(d => {
              const v = maturity[d.id] ?? 0;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]"><p className="font-bold text-sm text-slate-800">{isAr ? d.labelAr : d.label}</p><p className="text-[11px] text-slate-400 mt-0.5">{isAr ? d.descAr : d.desc}</p></div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setMat(d.id, n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>))}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد موجز هندسة القيمة ✨' : 'Generate VE Brief ✨'} isAr={isAr} toolKey={VE_TOOL_KEY} disabled={!canGenerate} />
        )}
      </div>
    </div>
  );
}
