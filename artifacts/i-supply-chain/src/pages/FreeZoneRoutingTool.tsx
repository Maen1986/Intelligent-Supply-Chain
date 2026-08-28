// src/pages/FreeZoneRoutingTool.tsx
//
// GCC Free-Zone / Bonded-Warehouse Routing Decision Tool (#379), 28 Aug 2026.
// Corrected premise (per the unblocking research pass -- see
// freeZoneRouting.ts header note): the original blocker assumed a Makasa
// "volume threshold" that does not exist; Makasa is a per-declaration stamp
// mechanism. The real, buildable decision is a storage-cost + import-duty
// deferral/avoidance comparison, on real published 2026 benchmark rates.
//
// Same v1-scoping discipline as Supplier Dependency (#378) and LCGPA
// Readiness (#373/#374): no new backend route (optional AI narrative reuses
// the existing generic /api/ai/plan endpoint via useAIPlan), localStorage
// persistence only, manual input, deterministic disclosed-rule calculation.
import React, { useState, useCallback, useMemo } from 'react';
import { Warehouse, Printer, Info, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type RoutingInputs, type FreeZone, type RoutingChoice,
  defaultRoutingInputs, defaultFreeZoneRate, computeRouting, buildFreeZoneRoutingPrompt,
  FREE_ZONE_BENCHMARKS, GCC_CET_RATE_PCT,
} from '@/lib/freeZoneRouting';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'isc-freezone-routing-v1';

function printZone(zone: string) {
  document.body.setAttribute('data-print', zone);
  const cleanup = () => {
    document.body.removeAttribute('data-print');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

function loadInputs(): RoutingInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RoutingInputs>;
      if (parsed) return { ...defaultRoutingInputs(), ...parsed };
    }
  } catch { /* fall through to default */ }
  return defaultRoutingInputs();
}

function NumberField({
  label, hint, value, onChange, isAr, unit, placeholder,
}: {
  label: string; hint?: string; value: number | null; onChange: (v: number | null) => void; isAr: boolean; unit: string; placeholder?: string;
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
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pe-14 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
        <span className="absolute inset-y-0 end-3 flex items-center text-[10px] font-bold text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function fmt(v: number | null): string {
  return v === null ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function FreeZoneRoutingTool() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const [inputs, setInputs] = useState<RoutingInputs>(loadInputs);

  const persist = useCallback((next: RoutingInputs) => {
    setInputs(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const onZoneChange = (zone: FreeZone) => {
    persist({ ...inputs, freeZone: zone, freeZoneRateAedSqmYr: defaultFreeZoneRate(zone) });
  };

  const result = useMemo(() => computeRouting(inputs), [inputs]);
  const benchmark = FREE_ZONE_BENCHMARKS[inputs.freeZone];

  const buildPrompt = useCallback(() => buildFreeZoneRoutingPrompt(inputs, result, isAr), [inputs, result, isAr]);
  const aiPlan = useAIPlan(buildPrompt, isAr, 'freeZoneRouting', result.hasEnoughForDuty || result.hasEnoughForStorage);

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Warehouse className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'مقارنة تكلفة معيارية' : 'Benchmark-Grade Cost Comparison'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'أداة توجيه المنطقة الحرة / المستودع المؤمّن' : 'Free-Zone / Bonded-Warehouse Routing Tool'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'قارن تكلفة التخزين في منطقة حرة (رسوم مؤجلة) مقابل التخزين المحلي (رسوم مدفوعة عند الدخول)، باستخدام معدلات معيارية منشورة قابلة للتعديل ورسوم جمركية موحدة GCC.'
              : 'Compare free-zone storage (duty-deferred) against mainland storage (duty-paid on entry), using editable published benchmark rates and the flat GCC import duty.'}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {(isAr
              ? ['معدلات منشورة قابلة للتعديل', `رسوم CET ٪${GCC_CET_RATE_PCT}`, 'آلية مكاسة لكل شحنة', 'عربي / إنجليزي']
              : ['Editable Published Rates', `${GCC_CET_RATE_PCT}% GCC CET`, 'Per-Shipment Makasa', 'Arabic / English']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <div className="no-print flex items-center justify-end">
          <button
            onClick={() => printZone('freezone-routing')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        <div className="print-zone-freezone-routing bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          <div className="hidden print:block pb-3 border-b border-gray-300">
            <p className="text-lg font-extrabold text-gray-900">
              {isAr ? '🏭 توجيه المنطقة الحرة / المستودع المؤمّن' : '🏭 Free-Zone / Bonded-Warehouse Routing'}
            </p>
            <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
          </div>

          {/* Free zone + rate */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'المنطقة الحرة' : 'Free Zone'}
              </label>
              <select
                value={inputs.freeZone}
                onChange={e => onZoneChange(e.target.value as FreeZone)}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              >
                {(Object.keys(FREE_ZONE_BENCHMARKS) as FreeZone[]).map(z => (
                  <option key={z} value={z}>{isAr ? FREE_ZONE_BENCHMARKS[z].labelAr : FREE_ZONE_BENCHMARKS[z].labelEn}</option>
                ))}
              </select>
            </div>
            <NumberField
              label={isAr ? 'سعر التخزين في المنطقة الحرة' : 'Free-Zone Storage Rate'}
              hint={isAr ? benchmark.sourceNoteAr : benchmark.sourceNoteEn}
              value={inputs.freeZoneRateAedSqmYr}
              onChange={v => persist({ ...inputs, freeZoneRateAedSqmYr: v })}
              isAr={isAr}
              unit={isAr ? 'د.إ/م²/سنة' : 'AED/sqm/yr'}
            />
          </div>

          <NumberField
            label={isAr ? 'سعر التخزين المحلي (غير مدعوم بمعيار منشور -- أدخل سعرك)' : "Mainland Storage Rate (no published benchmark -- enter your own)"}
            value={inputs.mainlandRateAedSqmYr}
            onChange={v => persist({ ...inputs, mainlandRateAedSqmYr: v })}
            isAr={isAr}
            unit={isAr ? 'د.إ/م²/سنة' : 'AED/sqm/yr'}
          />

          <div className="grid sm:grid-cols-3 gap-3">
            <NumberField
              label={isAr ? 'قيمة الشحنة (CIF)' : 'Shipment Value (CIF)'}
              value={inputs.shipmentValueCifAed}
              onChange={v => persist({ ...inputs, shipmentValueCifAed: v })}
              isAr={isAr}
              unit={isAr ? 'د.إ' : 'AED'}
            />
            <NumberField
              label={isAr ? 'مدة التخزين' : 'Storage Duration'}
              value={inputs.storageDurationMonths}
              onChange={v => persist({ ...inputs, storageDurationMonths: v })}
              isAr={isAr}
              unit={isAr ? 'شهر' : 'months'}
            />
            <NumberField
              label={isAr ? 'مساحة التخزين' : 'Storage Area'}
              value={inputs.storageAreaSqm}
              onChange={v => persist({ ...inputs, storageAreaSqm: v })}
              isAr={isAr}
              unit={isAr ? 'م²' : 'sqm'}
            />
          </div>

          {/* Routing choice */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {isAr ? 'مسار السلعة' : 'Goods Routing'}
            </label>
            <div className="flex gap-2">
              {([
                { v: 'reExport', en: 'Re-export via Makasa (duty avoided in UAE)', ar: 'إعادة تصدير عبر مكاسة (تُجنّب الرسوم في الإمارات)' },
                { v: 'mainlandSale', en: 'Sell into mainland (duty deferred, then paid)', ar: 'بيع في السوق المحلي (تأجيل الرسوم ثم سدادها)' },
              ] as { v: RoutingChoice; en: string; ar: string }[]).map(o => (
                <button
                  key={o.v}
                  onClick={() => persist({ ...inputs, routingChoice: o.v })}
                  className={`no-print flex-1 text-xs font-bold rounded-lg px-3 py-2 border transition-colors ${
                    inputs.routingChoice === o.v ? 'bg-[#082C6B] text-white border-[#082C6B]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isAr ? o.ar : o.en}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{isAr ? `الرسوم الجمركية (${GCC_CET_RATE_PCT}٪ من CIF)` : `Import duty (${GCC_CET_RATE_PCT}% of CIF)`}</span>
              <span className="font-bold text-slate-800">{fmt(result.dutyAmountAed)} {isAr ? 'د.إ' : 'AED'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{isAr ? 'تكلفة تخزين المنطقة الحرة' : 'Free-zone storage cost'}</span>
              <span className="font-bold text-slate-800">{fmt(result.freeZoneStorageCostAed)} {isAr ? 'د.إ' : 'AED'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black text-[#082C6B] pt-1 border-t border-slate-200">
              <span>{isAr ? 'إجمالي مسار المنطقة الحرة' : 'Free-zone path total'}</span>
              <span>{fmt(result.freeZonePathTotalAed)} {isAr ? 'د.إ' : 'AED'}</span>
            </div>

            {result.hasMainlandStorageRate ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2">
                  <span>{isAr ? 'تكلفة التخزين المحلي' : 'Mainland storage cost'}</span>
                  <span className="font-bold text-slate-800">{fmt(result.mainlandStorageCostAed)} {isAr ? 'د.إ' : 'AED'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
                  <span>{isAr ? 'إجمالي المسار المحلي' : 'Mainland path total'}</span>
                  <span>{fmt(result.mainlandPathTotalAed)} {isAr ? 'د.إ' : 'AED'}</span>
                </div>
                <div className={`flex items-center justify-between text-xs font-black pt-1 border-t border-slate-200 ${(result.savingsAed ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  <span>{isAr ? 'الوفورات التقديرية للمنطقة الحرة' : 'Estimated free-zone savings'}</span>
                  <span>{fmt(result.savingsAed)} {isAr ? 'د.إ' : 'AED'}</span>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 pt-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {isAr
                  ? 'أدخل سعر التخزين المحلي أعلاه لعرض مقارنة كاملة بين المسارين.'
                  : 'Enter the mainland storage rate above to see a full path comparison.'}
              </p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            {isAr
              ? 'المعدلات معيارية منشورة (٢٠٢٦) وليست عرض سعر تفاوضي فعلي -- عدّلها بسعرك الحقيقي عند توفره. هذه الأداة لا تُقيّم القيمة الزمنية للرسوم المؤجلة عند البيع المحلي.'
              : "Rates are published 2026 market benchmarks, not your actual negotiated quote -- edit them once you have a real one. This tool does not model the time-value of deferred duty on a mainland-sale path."}
          </p>

          {/* AI narrative (optional) */}
          {(result.hasEnoughForDuty || result.hasEnoughForStorage) && (
            <div className="no-print pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#082C6B]" />
                {isAr ? 'اقتراح خطوات بالذكاء الاصطناعي' : 'AI Next-Steps Suggestion'}
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
                disabled={!(result.hasEnoughForDuty || result.hasEnoughForStorage)}
                savedPlan={aiPlan.savedPlan}
                onViewSaved={aiPlan.viewSaved}
                onDeleteSaved={aiPlan.deleteSaved}
                rateLimited={aiPlan.rateLimited}
                retryAfterSeconds={aiPlan.retryAfterSeconds}
                toolKey="freeZoneRouting"
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
            ? 'هذه الأداة لا تحل محل استشارة جمركية أو لوجستية متخصصة أو عرض سعر فعلي من مشغل المنطقة الحرة.'
            : 'This tool is not a substitute for specialist customs/logistics advice or an actual quote from the free-zone operator.'}
        </p>
      </div>
    </div>
  );
}
