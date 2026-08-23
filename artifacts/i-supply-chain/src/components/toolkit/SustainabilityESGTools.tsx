/**
 * ESG & Sustainability Scorecard — flagship tool for the
 * Sustainability & ESG Solution page.
 *
 * 1. Scope 1/2/3 Carbon Estimator (spend-based approximation)
 * 2. ESG Maturity Self-Assessment (E / S / G)
 * 3. Supplier ESG Risk Screener
 * 4. AI ESG Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import { Download, Leaf, Scale, Users2, Sparkles } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const ESG_TOOL_KEY = 'esg-scorecard' as const;

const SK_CARBON = 'isc-tool-esg-carbon-v1';
const SK_MATURITY = 'isc-tool-esg-maturity-v1';
const SK_SCREEN = 'isc-tool-esg-screen-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

/* Indicative spend-based emission factors (tCO2e per 1,000 currency units spend) -- illustrative, for directional estimate only */
const EMISSION_FACTORS: Record<string, number> = { materials: 0.45, logistics: 0.62, energy: 0.85, services: 0.12, packaging: 0.30 };
interface CarbonInputs { materials: number; logistics: number; energy: number; services: number; packaging: number; }
const DEFAULT_CARBON: CarbonInputs = { materials: 0, logistics: 0, energy: 0, services: 0, packaging: 0 };

interface EsgDim { id: string; pillar: 'E' | 'S' | 'G'; label: string; labelAr: string; desc: string; descAr: string; }
const ESG_DIMS: EsgDim[] = [
  { id: 'carbon_measurement', pillar: 'E', label: 'Carbon Measurement', labelAr: 'قياس الكربون', desc: 'Scope 1/2/3 emissions measured, at least directionally', descAr: 'قياس انبعاثات النطاق 1/2/3، ولو تقريبياً' },
  { id: 'circular', pillar: 'E', label: 'Circular Procurement', labelAr: 'المشتريات الدائرية', desc: 'Recyclability, packaging, and lifecycle cost considered in sourcing', descAr: 'مراعاة إعادة التدوير والتغليف وتكلفة دورة الحياة في التوريد' },
  { id: 'labour', pillar: 'S', label: 'Labour & Human Rights', labelAr: 'العمل وحقوق الإنسان', desc: 'Supplier code of conduct with labour standards enforced', descAr: 'مدوّنة سلوك للموردين تطبّق معايير العمل' },
  { id: 'local_content', pillar: 'S', label: 'Local Content / Community', labelAr: 'المحتوى المحلي/المجتمع', desc: 'Local content (Iktva-style) and community impact tracked', descAr: 'تتبّع المحتوى المحلي (على غرار اكتفاء) والأثر المجتمعي' },
  { id: 'policy', pillar: 'G', label: 'ESG Policy & Governance', labelAr: 'سياسة وحوكمة ESG', desc: 'Board-level ESG policy exists and is cascaded to procurement', descAr: 'توجد سياسة ESG على مستوى المجلس ومُتدرِّجة إلى المشتريات' },
  { id: 'disclosure', pillar: 'G', label: 'Regulatory Disclosure Readiness', labelAr: 'جاهزية الإفصاح التنظيمي', desc: 'Ready for CDP, CSDDD, or Saudi CMA ESG disclosure requirements', descAr: 'جاهزية لمتطلبات إفصاح CDP أو CSDDD أو هيئة السوق المالية' },
];

interface Supplier { id: string; name: string; noCoc: boolean; noAudit: boolean; highRiskGeo: boolean; noEsgData: boolean; }
function defaultSupplier(): Supplier { return { id: Math.random().toString(36).slice(2), name: '', noCoc: false, noAudit: false, highRiskGeo: false, noEsgData: false }; }

type Tab = 'carbon' | 'esg' | 'screen' | 'ai';

export function SustainabilityESGToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('carbon');

  const [carbon, setCarbon] = useState<CarbonInputs>(() => loadJson(SK_CARBON, DEFAULT_CARBON));
  const updateCarbon = (field: keyof CarbonInputs, value: number) => setCarbon(prev => { const next = { ...prev, [field]: value }; safeSetItem(SK_CARBON, JSON.stringify(next)); return next; });
  const carbonEstimate = Object.entries(carbon).reduce((sum, [k, v]) => sum + (v / 1000) * (EMISSION_FACTORS[k] ?? 0), 0);

  const [esg, setEsg] = useState<Record<string, number>>(() => loadJson(SK_MATURITY, {}));
  const setEsgVal = (id: string, v: number) => setEsg(prev => { const next = { ...prev, [id]: v }; safeSetItem(SK_MATURITY, JSON.stringify(next)); return next; });
  const pillarAvg = (p: 'E' | 'S' | 'G') => { const dims = ESG_DIMS.filter(d => d.pillar === p && esg[d.id] !== undefined); return dims.length > 0 ? dims.reduce((s, d) => s + (esg[d.id] ?? 0), 0) / dims.length : 0; };
  const esgFilled = ESG_DIMS.filter(d => esg[d.id] !== undefined);
  const esgOverall = esgFilled.length > 0 ? esgFilled.reduce((s, d) => s + (esg[d.id] ?? 0), 0) / esgFilled.length : 0;

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadJson(SK_SCREEN, [defaultSupplier()]));
  const saveSuppliers = (s: Supplier[]) => { setSuppliers(s); safeSetItem(SK_SCREEN, JSON.stringify(s)); };
  const updateSupplier = (id: string, field: keyof Supplier, value: any) => saveSuppliers(suppliers.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addSupplier = () => saveSuppliers([...suppliers, defaultSupplier()]);
  const removeSupplier = (id: string) => saveSuppliers(suppliers.filter(s => s.id !== id));
  const riskFlags = (s: Supplier) => [s.noCoc, s.noAudit, s.highRiskGeo, s.noEsgData].filter(Boolean).length;
  const riskTier = (n: number) => n >= 3 ? { label: 'High Risk', labelAr: 'مخاطر عالية', color: '#dc2626' } : n >= 1 ? { label: 'Medium Risk', labelAr: 'مخاطر متوسطة', color: '#d97706' } : { label: 'Low Risk', labelAr: 'مخاطر منخفضة', color: '#059669' };
  const validSuppliers = suppliers.filter(s => s.name);

  const buildPrompt = useCallback(() => {
    return [
      '## ESG & Sustainability Brief', '',
      `## Carbon Estimate (directional, spend-based): ~${carbonEstimate.toFixed(1)} tCO2e`,
      '', `## ESG Maturity — Environmental: ${pillarAvg('E').toFixed(1)}/5, Social: ${pillarAvg('S').toFixed(1)}/5, Governance: ${pillarAvg('G').toFixed(1)}/5. Overall: ${esgOverall > 0 ? esgOverall.toFixed(1) : 'N/A'}/5`,
      '', `## Supplier ESG Screening: ${validSuppliers.length} suppliers screened`,
      validSuppliers.map(s => `- ${s.name}: ${riskFlags(s)} risk flags (${riskTier(riskFlags(s)).label})`).join('\n'),
      '', '## Your Task',
      'Generate a 4-5 paragraph executive ESG brief: (1) interpret the carbon estimate and its regulatory relevance (CDP/CSDDD/Saudi CMA), (2) identify the weakest ESG pillar and 2-3 specific actions to close it, (3) flag the highest-risk suppliers and recommended next steps, (4) 90-day action plan with [HIGH]/[MEDIUM]/[LOW] labels.',
    ].join('\n');
  }, [carbonEstimate, esg, esgOverall, validSuppliers]);

  const canGenerate = carbonEstimate > 0 || esgFilled.length >= 3 || validSuppliers.length >= 1;
  const aiPlan = useAIPlan(buildPrompt, isAr, ESG_TOOL_KEY, canGenerate);

  const handleDownload = () => downloadText('esg-scorecard-summary.txt', [isAr ? 'ملخص بطاقة ESG' : 'ESG Scorecard Summary', '', `Carbon estimate: ~${carbonEstimate.toFixed(1)} tCO2e`, `ESG overall: ${esgOverall > 0 ? esgOverall.toFixed(1) : '—'}/5`].join('\n'));

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'carbon', icon: <Leaf className="w-3.5 h-3.5" />, label: 'Carbon Estimator', labelAr: 'مقدّر الكربون' },
    { id: 'esg', icon: <Scale className="w-3.5 h-3.5" />, label: 'ESG Maturity', labelAr: 'نضج ESG' },
    { id: 'screen', icon: <Users2 className="w-3.5 h-3.5" />, label: 'Supplier Screener', labelAr: 'فرز الموردين' },
    { id: 'ai', icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Brief', labelAr: 'موجز AI' },
  ];
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); const n = (index + 1) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); const n = (index - 1 + count) % count; setActiveTab(tabs[n].id); tabRefs.current[n]?.focus(); }
  }

  const pillarLabel = (p: 'E' | 'S' | 'G') => isAr ? { E: 'البيئة', S: 'المجتمع', G: 'الحوكمة' }[p] : { E: 'Environmental', S: 'Social', G: 'Governance' }[p];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border bg-emerald-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '🌱 بطاقة أداء ESG والاستدامة' : '🌱 ESG & Sustainability Scorecard'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'قدّر بصمة الكربون وقيّم نضج ESG وافحص مخاطر الموردين' : 'Estimate carbon footprint, assess ESG maturity, and screen supplier risk'}</p>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-emerald-200 text-emerald-900 hover:bg-emerald-300 transition-colors">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل الملخص' : 'Download Summary'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'carbon' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">{isAr ? 'أدخل الإنفاق التقريبي بكل فئة للحصول على تقدير اتجاهي مبني على الإنفاق (GHG Protocol Scope 3 Category 1 أسلوب مبسّط). للإفصاح الرسمي استخدم بيانات النشاط الفعلية.' : 'Enter approximate spend per category for a directional, spend-based estimate (simplified GHG Protocol Scope 3 Category 1 approach). Use actual activity data for formal disclosure.'}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(DEFAULT_CARBON) as (keyof CarbonInputs)[]).map(k => (
                <label key={k} className="text-xs font-semibold text-slate-600 capitalize">{k}
                  <input type="number" value={carbon[k] || ''} onChange={e => updateCarbon(k, Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </label>
              ))}
            </div>
            {carbonEstimate > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'التقدير الاتجاهي لانبعاثات الكربون' : 'Directional Carbon Estimate'}</p><p className="text-2xl font-bold text-emerald-700">~{carbonEstimate.toFixed(1)} tCO2e</p></div>
            )}
          </div>
        )}

        {activeTab === 'esg' && (
          <div className="space-y-4">
            {esgFilled.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {(['E', 'S', 'G'] as const).map(p => (
                  <div key={p} className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{pillarLabel(p)}</p><p className="text-lg font-bold text-emerald-700">{pillarAvg(p).toFixed(1)}/5</p></div>
                ))}
              </div>
            )}
            {ESG_DIMS.map(d => {
              const v = esg[d.id] ?? 0;
              return (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-bold text-sm text-slate-800"><span className="text-emerald-600">[{d.pillar}]</span> {isAr ? d.labelAr : d.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{isAr ? d.descAr : d.desc}</p>
                    </div>
                    <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setEsgVal(d.id, n)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${v === n ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{n}</button>))}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'screen' && (
          <div className="space-y-3">
            {suppliers.map(s => {
              const flags = riskFlags(s); const tier = riskTier(flags);
              return (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={s.name} onChange={e => updateSupplier(s.id, 'name', e.target.value)} placeholder={isAr ? 'اسم المورد' : 'Supplier name'} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    {s.name && <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: tier.color, background: `${tier.color}15` }}>{isAr ? tier.labelAr : tier.label}</span>}
                    <button onClick={() => removeSupplier(s.id)} className="text-red-500 text-xs shrink-0">{isAr ? 'حذف' : 'Remove'}</button>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={s.noCoc} onChange={e => updateSupplier(s.id, 'noCoc', e.target.checked)} className="accent-emerald-600" />{isAr ? 'لا مدوّنة سلوك' : 'No code of conduct'}</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={s.noAudit} onChange={e => updateSupplier(s.id, 'noAudit', e.target.checked)} className="accent-emerald-600" />{isAr ? 'لا تدقيق' : 'No audit history'}</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={s.highRiskGeo} onChange={e => updateSupplier(s.id, 'highRiskGeo', e.target.checked)} className="accent-emerald-600" />{isAr ? 'جغرافيا عالية المخاطر' : 'High-risk geography'}</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={s.noEsgData} onChange={e => updateSupplier(s.id, 'noEsgData', e.target.checked)} className="accent-emerald-600" />{isAr ? 'لا بيانات ESG' : 'No ESG data provided'}</label>
                  </div>
                </div>
              );
            })}
            <button onClick={addSupplier} className="text-xs font-semibold text-emerald-700 hover:underline">+ {isAr ? 'إضافة مورد' : 'Add supplier'}</button>
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد موجز ESG ✨' : 'Generate ESG Brief ✨'} isAr={isAr} toolKey={ESG_TOOL_KEY} disabled={!canGenerate} />
        )}
      </div>
    </div>
  );
}
