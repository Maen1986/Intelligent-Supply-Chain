// src/pages/LCGPAReadinessCheck.tsx
//
// LCGPA Readiness Self-Check (#373) + Tender Eligibility Triage (#374),
// 28 Aug 2026. Combined into one page/flow per the closing research pass's
// own recommendation (lcgpa-373-374-research-draft.md, 25 Aug 2026): #374
// depends on #373's score, so they are built as one directional tool --
// Section 1 computes the LCGPA baseline ratio from real, sourced pillar
// eligibility rules; Section 2 triages that score against real, sourced
// sector thresholds (or a client-entered tender-specific requirement).
//
// Same v1-scoping discipline as Supplier Dependency Check (#378): no new
// backend route (the optional "what should I focus on" narrative reuses the
// existing generic /api/ai/plan endpoint via useAIPlan), localStorage
// persistence only, manual input, deterministic disclosed-rule scoring
// (Decision Record 8.7 -- never an AI-invented score).
import React, { useState, useCallback, useMemo } from 'react';
import { Landmark, Printer, Info, Sparkles, ShieldAlert, ShieldCheck, ShieldQuestion, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type LocalContentInputs, type Sector, type TriageVerdict,
  emptyLocalContentInputs, computeBaselineScore, getSectorBenchmark, triage, buildLcgpaPrompt,
} from '@/lib/lcgpaLocalContent';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'isc-lcgpa-readiness-v1';

interface PersistedState {
  inputs: LocalContentInputs;
  sector: Sector;
  tenderValueSAR: number | null;
  customThresholdPct: number | null;
}

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed && parsed.inputs) {
        return {
          inputs: { ...emptyLocalContentInputs(), ...parsed.inputs },
          sector: parsed.sector ?? 'other',
          tenderValueSAR: parsed.tenderValueSAR ?? null,
          customThresholdPct: parsed.customThresholdPct ?? null,
        };
      }
    }
  } catch { /* fall through to default */ }
  return { inputs: emptyLocalContentInputs(), sector: 'other', tenderValueSAR: null, customThresholdPct: null };
}

const verdictStyles: Record<TriageVerdict, { badge: string; icon: React.ReactNode }> = {
  clears:         { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  gap:            { badge: 'bg-red-50 border-red-200 text-red-700',            icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  weightingOnly:  { badge: 'bg-amber-50 border-amber-200 text-amber-700',      icon: <Info className="w-3.5 h-3.5" /> },
  notYetInEffect: { badge: 'bg-sky-50 border-sky-200 text-sky-700',            icon: <Clock className="w-3.5 h-3.5" /> },
  noBenchmark:    { badge: 'bg-slate-100 border-slate-200 text-slate-500',     icon: <ShieldQuestion className="w-3.5 h-3.5" /> },
  incomplete:     { badge: 'bg-slate-100 border-slate-200 text-slate-500',     icon: <ShieldQuestion className="w-3.5 h-3.5" /> },
};

const pillarLabels: Record<string, { en: string; ar: string }> = {
  labor:            { en: 'Labor',                        ar: 'العمالة' },
  goodsServices:    { en: 'Goods & Services',              ar: 'السلع والخدمات' },
  capacityBuilding: { en: 'Capacity Building',             ar: 'بناء القدرات' },
  depreciation:     { en: 'Depreciation & Amortization',   ar: 'الإهلاك والاستهلاك' },
};

const sectorLabels: { v: Sector; en: string; ar: string }[] = [
  { v: 'hardFM',     en: 'Hard Facility Management', ar: 'إدارة المرافق الشاملة' },
  { v: 'consulting', en: 'Management Consulting',     ar: 'الاستشارات الإدارية' },
  { v: 'itServices', en: 'IT Services',                ar: 'خدمات تقنية المعلومات' },
  { v: 'other',      en: 'Other / Not Listed',         ar: 'أخرى / غير مدرجة' },
];

function NumberField({
  label, hint, value, onChange, isAr, placeholder,
}: {
  label: string; hint?: string; value: number | null; onChange: (v: number | null) => void; isAr: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0))}
          placeholder={placeholder ?? '0'}
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pe-12 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
        <span className="absolute inset-y-0 end-3 flex items-center text-[10px] font-bold text-slate-400">
          {isAr ? 'ر.س' : 'SAR'}
        </span>
      </div>
    </div>
  );
}

export function LCGPAReadinessCheck() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');
  const todayISO = useMemo(() => new Date().toISOString(), []);

  const [state, setState] = useState<PersistedState>(loadState);

  const persist = useCallback((next: PersistedState) => {
    setState(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateInputs = (patch: Partial<LocalContentInputs>) =>
    persist({ ...state, inputs: { ...state.inputs, ...patch } });

  const baseline = useMemo(() => computeBaselineScore(state.inputs), [state.inputs]);
  const benchmark = useMemo(
    () => getSectorBenchmark(state.sector, state.tenderValueSAR, todayISO),
    [state.sector, state.tenderValueSAR, todayISO],
  );
  const triageResult = useMemo(
    () => triage(baseline, benchmark, state.customThresholdPct),
    [baseline, benchmark, state.customThresholdPct],
  );

  const buildPrompt = useCallback(
    () => buildLcgpaPrompt(baseline, benchmark, triageResult, isAr),
    [baseline, benchmark, triageResult, isAr],
  );
  const aiPlan = useAIPlan(buildPrompt, isAr, 'lcgpaReadiness', baseline.baselineScorePct !== null);

  const style = verdictStyles[triageResult.verdict];

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Landmark className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'المحتوى المحلي (LCGPA) — تقدير توجيهي' : 'LCGPA Local Content — Directional Estimate'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'جاهزية المحتوى المحلي وفرز أهلية المناقصة' : 'Local Content Readiness & Tender Eligibility Triage'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'أدخل أرقام إنفاقك التقريبية عبر الأركان الأربعة لهيئة المحتوى المحلي، واحصل على درجة أساسية توجيهية وفق الصيغة الرسمية الفعلية، ثم قارنها بحدود قطاعية موثّقة قبل قرار التقدّم لمناقصة رسمي.'
              : "Enter your rough spend figures across LCGPA's four pillars and get a directional baseline score using the real official formula, then triage it against sourced sector thresholds before a formal tender decision."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {(isAr
              ? ['إدخال يدوي', 'الصيغة الرسمية من الدليل G1', 'حدود قطاعية موثّقة ومؤرخة', 'عربي / إنجليزي']
              : ['Manual Input', "Official Guide G1 Formula", 'Sourced, Dated Sector Thresholds', 'Arabic / English']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <div className="no-print flex items-center justify-end">
          <button
            onClick={() => printZone('lcgpa-readiness')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        <div className="print-zone-lcgpa-readiness bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          {/* Print-only header */}
          <div className="hidden print:block pb-3 border-b border-gray-300">
            <p className="text-lg font-extrabold text-gray-900">
              {isAr ? '🏛️ جاهزية المحتوى المحلي (LCGPA)' : '🏛️ LCGPA Local Content Readiness'}
            </p>
            <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
          </div>

          {/* ── Section 1: Readiness Self-Check ── */}
          <div>
            <h2 className="text-sm font-black text-slate-800 mb-1">
              {isAr ? '١) فحص الجاهزية الذاتي' : '1) Readiness Self-Check'}
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">
              {isAr
                ? 'الدرجة الأساسية = مجموع الإنفاق المؤهل محلياً عبر الأركان الأربعة ÷ مجموع إجمالي الإنفاق -- نسبة واحدة، وليست متوسطاً مرجحاً بين الأركان (وفق دليل الهيئة الرسمي G1).'
                : 'Baseline score = sum of locally-eligible spend across all four pillars ÷ sum of total spend -- a single ratio, not a weighted average of the pillars (per LCGPA\'s own official Guide G1).'}
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <NumberField
                label={isAr ? 'رواتب الموظفين السعوديين' : 'Saudi Employee Compensation'}
                hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'}
                value={state.inputs.saudiCompensationSAR}
                onChange={v => updateInputs({ saudiCompensationSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'رواتب الموظفين الوافدين' : 'Expatriate Employee Compensation'}
                hint={isAr ? '٣٧٪ مؤهل' : '37% eligible'}
                value={state.inputs.expatCompensationSAR}
                onChange={v => updateInputs({ expatCompensationSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'إنفاق محلي على السلع والخدمات' : 'In-Kingdom Goods & Services Spend'}
                hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'}
                value={state.inputs.localGoodsServicesSpendSAR}
                onChange={v => updateInputs({ localGoodsServicesSpendSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'إنفاق أجنبي على السلع والخدمات' : 'Foreign Goods & Services Spend'}
                hint={isAr ? '٠٪ مؤهل' : '0% eligible'}
                value={state.inputs.foreignGoodsServicesSpendSAR}
                onChange={v => updateInputs({ foreignGoodsServicesSpendSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'بناء القدرات (تدريب + تطوير موردين + بحث وتطوير محلي)' : 'Capacity Building (training + supplier dev + in-Kingdom R&D)'}
                hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'}
                value={state.inputs.capacityBuildingSpendSAR}
                onChange={v => updateInputs({ capacityBuildingSpendSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'إهلاك الأصول المحلية' : 'In-Kingdom Asset Depreciation'}
                hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'}
                value={state.inputs.inKingdomAssetDepreciationSAR}
                onChange={v => updateInputs({ inKingdomAssetDepreciationSAR: v })}
                isAr={isAr}
              />
              <NumberField
                label={isAr ? 'إجمالي إهلاك الأصول' : 'Total Asset Depreciation'}
                value={state.inputs.totalAssetDepreciationSAR}
                onChange={v => updateInputs({ totalAssetDepreciationSAR: v })}
                isAr={isAr}
              />
            </div>

            {baseline.baselineScorePct !== null ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {isAr ? 'الدرجة الأساسية التوجيهية' : 'Directional Baseline Score'}
                  </span>
                  <span className="text-2xl font-black text-[#082C6B]">{baseline.baselineScorePct.toFixed(1)}%</span>
                </div>
                <div className="space-y-1">
                  {baseline.pillars.map(p => (
                    <div key={p.key} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{isAr ? pillarLabels[p.key].ar : pillarLabels[p.key].en}</span>
                      <span className="font-semibold">
                        {p.total > 0 ? `${((p.eligible / p.total) * 100).toFixed(0)}%` : '—'}
                        <span className="text-slate-400 font-normal"> ({p.eligible.toLocaleString()} / {p.total.toLocaleString()} {isAr ? 'ر.س' : 'SAR'})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[10px] text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {isAr ? 'أدخل أرقاماً في ركن واحد على الأقل لعرض الدرجة الأساسية.' : 'Enter figures in at least one pillar to see the baseline score.'}
              </p>
            )}
          </div>

          {/* ── Section 2: Tender Eligibility Triage ── */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-black text-slate-800 mb-1">
              {isAr ? '٢) فرز أهلية المناقصة' : '2) Tender Eligibility Triage'}
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">
              {isAr
                ? 'الحد الدقيق لأي مناقصة تحدده الجهة الشارية ضمن إطار الهيئة -- استخدم الأمثلة القطاعية أدناه كمعايير توضيحية، أو أدخل المتطلب المذكور في مناقصتك مباشرة إن كان متوفراً.'
                : "The exact threshold for any tender is set by the procuring entity within LCGPA's framework -- use the sector examples below as illustrative benchmarks, or enter your tender's own stated requirement directly if you have it."}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  {isAr ? 'القطاع' : 'Sector'}
                </label>
                <select
                  value={state.sector}
                  onChange={e => persist({ ...state, sector: e.target.value as Sector })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
                >
                  {sectorLabels.map(s => (
                    <option key={s.v} value={s.v}>{isAr ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>
              <NumberField
                label={isAr ? 'قيمة المناقصة (اختياري)' : 'Tender Value (optional)'}
                value={state.tenderValueSAR}
                onChange={v => persist({ ...state, tenderValueSAR: v })}
                isAr={isAr}
                placeholder={isAr ? 'مثال: ١٥٠٠٠٠٠٠' : 'e.g. 15000000'}
              />
            </div>

            <NumberField
              label={isAr ? 'متطلب مناقصتك الخاص (اختياري -- يتجاوز المعيار القطاعي)' : "Your tender's own stated requirement % (optional -- overrides the sector benchmark)"}
              value={state.customThresholdPct}
              onChange={v => persist({ ...state, customThresholdPct: v })}
              isAr={isAr}
              placeholder="%"
            />

            <div className={`mt-3 rounded-xl border px-3 py-2.5 flex items-start gap-2 ${style.badge}`}>
              {style.icon}
              <p className="text-[11px]">{isAr ? triageResult.reasonAr : triageResult.reasonEn}</p>
            </div>

            <p className="mt-2 text-[10px] text-muted-foreground">{isAr ? benchmark.sourceNoteAr : benchmark.sourceNoteEn}</p>

            <p className="mt-3 text-[10px] text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {isAr
                ? 'هذا تقدير توجيهي ذاتي التصريح، وليس درجة معتمدة من هيئة المحتوى المحلي والمشتريات الحكومية -- استخدمه لاتخاذ قرار مبدئي قبل تدقيق رسمي.'
                : 'This is a directional, self-reported estimate, not a certified LCGPA score -- use it to make an early-stage decision before a formal audit.'}
            </p>
          </div>

          {/* AI narrative (optional) */}
          {baseline.baselineScorePct !== null && (
            <div className="no-print pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#082C6B]" />
                {isAr ? 'اقتراح خطوات تحسين بالذكاء الاصطناعي' : 'AI Improvement Suggestion'}
              </h4>
              <AIPlanPanel
                loading={aiPlan.loading}
                result={aiPlan.result}
                evidenceSummary={aiPlan.evidenceSummary}
                error={aiPlan.error}
                onGenerate={aiPlan.generate}
                onReset={aiPlan.reset}
                buttonLabel={isAr ? 'توليد اقتراح ✨' : 'Generate Suggestion ✨'}
                isAr={isAr}
                disabled={baseline.baselineScorePct === null}
                savedPlan={aiPlan.savedPlan}
                onViewSaved={aiPlan.viewSaved}
                onDeleteSaved={aiPlan.deleteSaved}
                rateLimited={aiPlan.rateLimited}
                retryAfterSeconds={aiPlan.retryAfterSeconds}
                toolKey="lcgpaReadiness"
                saveError={aiPlan.saveError}
                onDismissSaveError={aiPlan.dismissSaveError}
                onRetrySave={aiPlan.retrySave}
                deleteError={aiPlan.deleteError}
                onDismissDeleteError={aiPlan.dismissDeleteError}
              />
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {isAr
            ? 'هذه الأداة لا تحل محل تدقيق رسمي من هيئة المحتوى المحلي والمشتريات الحكومية أو استشارة قانونية/محاسبية متخصصة.'
            : 'This tool is not a substitute for a formal LCGPA audit or specialist legal/accounting advice.'}
        </p>
      </div>
    </div>
  );
}
