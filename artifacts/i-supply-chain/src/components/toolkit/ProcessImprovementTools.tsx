/**
 * Process Excellence & Policy Compliance Toolkit — flagship tool for the
 * Process Improvement & Policy Solution page.
 *
 * 1. SOP Documentation Coverage Tracker
 * 2. CI / DMAIC Project Tracker with savings
 * 3. Policy Compliance Scorer
 * 4. AI Process Excellence Brief
 */
import React, { useState, useCallback, useRef } from 'react';
import { Download, FileText, TrendingUp, ShieldCheck, Sparkles, Plus, Trash2 } from 'lucide-react';
import { safeSetItem } from '@/lib/storage';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';

interface Props { isAr: boolean; }
export const PI_TOOL_KEY = 'process-improvement' as const;

const SK_SOP = 'isc-tool-pi-sop-v1';
const SK_PROJECTS = 'isc-tool-pi-projects-v1';
const SK_COMPLIANCE = 'isc-tool-pi-compliance-v1';
function loadJson<T>(key: string, fallback: T): T { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function downloadText(filename: string, content: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }

interface SopRow { id: string; process: string; documented: boolean; complianceMeasured: boolean; }
function defaultSop(): SopRow { return { id: Math.random().toString(36).slice(2), process: '', documented: false, complianceMeasured: false }; }

interface CiProject { id: string; name: string; baseline: number; target: number; actual: number; savings: number; }
function defaultProject(): CiProject { return { id: Math.random().toString(36).slice(2), name: '', baseline: 0, target: 0, actual: 0, savings: 0 }; }

interface ComplianceItem { id: string; label: string; labelAr: string; weight: number; }
const COMPLIANCE_ITEMS: ComplianceItem[] = [
  { id: 'gtpl', label: 'Procurement policy aligned to GTPL / applicable regulation', labelAr: 'سياسة المشتريات متوائمة مع GTPL/التنظيم المعمول به', weight: 20 },
  { id: 'doa', label: 'Delegation of Authority (DoA) matrix defined and enforced', labelAr: 'مصفوفة تفويض الصلاحيات محدَّدة ومطبَّقة', weight: 15 },
  { id: 'audit_freq', label: 'Internal audit runs at a defined, regular frequency', labelAr: 'التدقيق الداخلي يُجرى بتكرار محدَّد ومنتظم', weight: 15 },
  { id: 'erp_workflow', label: 'Approval workflow automated in ERP, not manual/email', labelAr: 'سير عمل الاعتماد مؤتمت في ERP وليس يدوياً/بالبريد', weight: 15 },
  { id: 'pdpl', label: 'Data policies reviewed against PDPL / SDAIA governance requirements', labelAr: 'مراجعة سياسات البيانات مقابل متطلبات PDPL/حوكمة SDAIA', weight: 15 },
  { id: 'repeat_findings', label: 'No repeat audit findings from the prior audit cycle', labelAr: 'لا توجد ملاحظات تدقيق متكررة من الدورة السابقة', weight: 20 },
];

type Tab = 'sop' | 'ci' | 'compliance' | 'ai';

export function ProcessImprovementToolsSection({ isAr }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('sop');

  const [sops, setSops] = useState<SopRow[]>(() => loadJson(SK_SOP, [defaultSop()]));
  const saveSops = (s: SopRow[]) => { setSops(s); safeSetItem(SK_SOP, JSON.stringify(s)); };
  const updateSop = (id: string, field: keyof SopRow, value: any) => saveSops(sops.map(s => s.id === id ? { ...s, [field]: value } : s));
  const addSop = () => saveSops([...sops, defaultSop()]);
  const removeSop = (id: string) => saveSops(sops.filter(s => s.id !== id));
  const validSops = sops.filter(s => s.process);
  const docCoverage = validSops.length > 0 ? Math.round((validSops.filter(s => s.documented).length / validSops.length) * 100) : 0;
  const complianceMeasuredPct = validSops.length > 0 ? Math.round((validSops.filter(s => s.complianceMeasured).length / validSops.length) * 100) : 0;

  const [projects, setProjects] = useState<CiProject[]>(() => loadJson(SK_PROJECTS, [defaultProject()]));
  const saveProjects = (p: CiProject[]) => { setProjects(p); safeSetItem(SK_PROJECTS, JSON.stringify(p)); };
  const updateProject = (id: string, field: keyof CiProject, value: number | string) => saveProjects(projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  const addProject = () => saveProjects([...projects, defaultProject()]);
  const removeProject = (id: string) => saveProjects(projects.filter(p => p.id !== id));
  const validProjects = projects.filter(p => p.name);
  const totalSavings = validProjects.reduce((s, p) => s + (Number(p.savings) || 0), 0);

  const [compliance, setCompliance] = useState<Record<string, boolean>>(() => loadJson(SK_COMPLIANCE, {}));
  const toggleCompliance = (id: string) => setCompliance(prev => { const next = { ...prev, [id]: !prev[id] }; safeSetItem(SK_COMPLIANCE, JSON.stringify(next)); return next; });
  const complianceScore = COMPLIANCE_ITEMS.reduce((s, i) => s + (compliance[i.id] ? i.weight : 0), 0);
  const complianceBand = complianceScore >= 80 ? { label: 'Strong', labelAr: 'قوي', color: '#059669' } : complianceScore >= 50 ? { label: 'Developing', labelAr: 'ناشئ', color: '#d97706' } : { label: 'Weak', labelAr: 'ضعيف', color: '#dc2626' };

  const buildPrompt = useCallback(() => {
    return [
      '## Process Excellence & Policy Compliance Brief', '',
      `## SOP Coverage: ${docCoverage}% documented, ${complianceMeasuredPct}% with compliance measured (${validSops.length} processes logged)`,
      '', `## CI / DMAIC Projects: ${validProjects.length} logged, total savings ${totalSavings}`,
      validProjects.map(p => `- ${p.name}: baseline ${p.baseline} -> target ${p.target}, actual ${p.actual}, savings ${p.savings}`).join('\n'),
      '', `## Policy Compliance: ${complianceScore}/100 (${complianceBand.label})`,
      `Missing: ${COMPLIANCE_ITEMS.filter(i => !compliance[i.id]).map(i => i.label).join('; ') || 'None'}`,
      '', '## Your Task',
      'Generate a 4-5 paragraph executive brief: (1) SOP documentation gap and its risk, (2) interpretation of CI project results and where to focus next, (3) policy compliance gap-closure plan for the missing items, (4) 90-day action plan with [HIGH]/[MEDIUM]/[LOW] labels.',
    ].join('\n');
  }, [docCoverage, complianceMeasuredPct, validSops.length, validProjects, totalSavings, complianceScore, complianceBand, compliance]);

  const canGenerate = validSops.length >= 2 || validProjects.length >= 1 || Object.values(compliance).some(Boolean);
  const aiPlan = useAIPlan(buildPrompt, isAr, PI_TOOL_KEY, canGenerate);

  const handleDownload = () => downloadText('process-excellence-summary.txt', [isAr ? 'ملخص تحسين العمليات' : 'Process Excellence Summary', '', `SOP coverage: ${docCoverage}%`, `CI savings total: ${totalSavings}`, `Policy compliance: ${complianceScore}/100`].join('\n'));

  const tabs: { id: Tab; icon: React.ReactNode; label: string; labelAr: string }[] = [
    { id: 'sop', icon: <FileText className="w-3.5 h-3.5" />, label: 'SOP Coverage', labelAr: 'تغطية الإجراءات' },
    { id: 'ci', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'CI Project Tracker', labelAr: 'متتبّع مشاريع التحسين' },
    { id: 'compliance', icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Policy Compliance', labelAr: 'الامتثال للسياسات' },
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
      <div className="p-5 border-b border-border bg-teal-50 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-primary">{isAr ? '📋 أداة تميّز العمليات والامتثال للسياسات' : '📋 Process Excellence & Policy Compliance Toolkit'}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? 'تتبّع توثيق الإجراءات ومشاريع التحسين والامتثال للسياسات' : 'Track SOP documentation, CI projects, and policy compliance'}</p>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-teal-200 text-teal-900 hover:bg-teal-300 transition-colors">
          <Download className="w-3.5 h-3.5" />{isAr ? 'تنزيل الملخص' : 'Download Summary'}
        </button>
      </div>

      <div role="tablist" className="flex gap-1 bg-slate-50 border-b border-slate-200 px-4 pt-3 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} tabIndex={activeTab === t.id ? 0 : -1}
            ref={el => { tabRefs.current[i] = el; }} onClick={() => setActiveTab(t.id)} onKeyDown={e => handleTabKeyDown(e, i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[12px] font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === t.id ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            {t.icon}<span>{isAr ? t.labelAr : t.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {activeTab === 'sop' && (
          <div className="space-y-3">
            {validSops.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'التغطية الموثَّقة' : 'Documented Coverage'}</p><p className="text-lg font-bold text-teal-700">{docCoverage}%</p></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><p className="text-[11px] text-slate-400 font-semibold">{isAr ? 'الامتثال المُقاس' : 'Compliance Measured'}</p><p className="text-lg font-bold text-teal-700">{complianceMeasuredPct}%</p></div>
              </div>
            )}
            {sops.map(s => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-3">
                <input value={s.process} onChange={e => updateSop(s.id, 'process', e.target.value)} placeholder={isAr ? 'اسم العملية' : 'Process name'} className="flex-1 min-w-[160px] border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={s.documented} onChange={e => updateSop(s.id, 'documented', e.target.checked)} className="accent-teal-600" />{isAr ? 'موثّقة' : 'Documented'}</label>
                <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={s.complianceMeasured} onChange={e => updateSop(s.id, 'complianceMeasured', e.target.checked)} className="accent-teal-600" />{isAr ? 'الامتثال مُقاس' : 'Compliance measured'}</label>
                <button onClick={() => removeSop(s.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={addSop} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"><Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة عملية' : 'Add process'}</button>
          </div>
        )}

        {activeTab === 'ci' && (
          <div className="space-y-3">
            {validProjects.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-[11px] text-emerald-600 font-semibold">{isAr ? 'إجمالي الوفورات' : 'Total Savings'}</p><p className="text-lg font-bold text-emerald-700">{totalSavings}</p></div>
            )}
            {projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-3 grid gap-2 sm:grid-cols-5">
                <input value={p.name} onChange={e => updateProject(p.id, 'name', e.target.value)} placeholder={isAr ? 'اسم المشروع' : 'Project name'} className="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={p.baseline || ''} onChange={e => updateProject(p.id, 'baseline', Number(e.target.value))} placeholder={isAr ? 'الأساس' : 'Baseline'} className="border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                <input type="number" value={p.actual || ''} onChange={e => updateProject(p.id, 'actual', Number(e.target.value))} placeholder={isAr ? 'الفعلي' : 'Actual'} className="border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                <div className="flex items-center gap-1">
                  <input type="number" value={p.savings || ''} onChange={e => updateProject(p.id, 'savings', Number(e.target.value))} placeholder={isAr ? 'الوفورات' : 'Savings'} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm" />
                  <button onClick={() => removeProject(p.id)} className="text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button onClick={addProject} className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"><Plus className="w-3.5 h-3.5" />{isAr ? 'إضافة مشروع' : 'Add project'}</button>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 border-2" style={{ borderColor: complianceBand.color, background: `${complianceBand.color}10` }}>
              <p className="text-[11px] font-semibold" style={{ color: complianceBand.color }}>{isAr ? 'درجة الامتثال' : 'Compliance Score'}</p>
              <p className="text-2xl font-bold" style={{ color: complianceBand.color }}>{complianceScore}/100 — {isAr ? complianceBand.labelAr : complianceBand.label}</p>
              <div className="w-full h-2.5 bg-white rounded-full mt-3 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${complianceScore}%`, background: complianceBand.color }} /></div>
            </div>
            <div className="space-y-2">
              {COMPLIANCE_ITEMS.map(i => {
                const checked = !!compliance[i.id];
                return (
                  <label key={i.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleCompliance(i.id)} className="mt-0.5 w-4 h-4 accent-teal-600" />
                    <span className="text-sm text-slate-700 flex-1">{isAr ? i.labelAr : i.label}</span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">+{i.weight}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPlanPanel loading={aiPlan.loading} result={aiPlan.result} evidenceSummary={aiPlan.evidenceSummary} error={aiPlan.error} onGenerate={aiPlan.generate} onReset={aiPlan.reset}
            savedPlan={aiPlan.savedPlan} onViewSaved={aiPlan.viewSaved} onDeleteSaved={aiPlan.deleteSaved} rateLimited={aiPlan.rateLimited}
            retryAfterSeconds={aiPlan.retryAfterSeconds} saveError={aiPlan.saveError} onDismissSaveError={aiPlan.dismissSaveError}
            buttonLabel={isAr ? 'توليد موجز التحسين ✨' : 'Generate Process Brief ✨'} isAr={isAr} toolKey={PI_TOOL_KEY} disabled={!canGenerate} />
        )}
      </div>
    </div>
  );
}
