// src/pages/GccSeasonalCalendar.tsx
//
// GCC Seasonal Operations Calendar (#376, Tier A), 30 Aug 2026. Unblocked
// per direct owner instruction ("ok let us finalize them two") after being
// held since 25 Aug. See lib/gccSeasonalCalendar.ts header for the full
// sourcing discipline (Decision Record 8.7 -- no fabricated freight-delay
// severity figures; real, cited Ramadan-hours law + 2026 Eid dates + one
// sourced Hajj-season Jeddah Port case study instead).
//
// Same v1-scoping discipline as Free-Zone Routing (#379) and LCGPA
// Readiness (#373/#374): no new backend route (optional AI narrative
// reuses the existing generic /api/ai/plan endpoint via useAIPlan),
// localStorage persistence for the country/industry picker only,
// deterministic disclosed-rule calculation for the countdown.
import React, { useState, useCallback, useMemo } from 'react';
import { CalendarClock, Printer, Info, Sparkles, AlertTriangle, Package } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  type GccCountry, GCC_COUNTRIES, GCC_SEASONAL_DATA,
  hasYearData, getYearData, getHajjAdvisory, buildCountdown, buildSeasonalCalendarPrompt,
} from '@/lib/gccSeasonalCalendar';
import {
  type ReorderPointInputs, defaultReorderPointInputs, computeReorderPoint, buildReorderPointPrompt,
} from '@/lib/reorderPointRamadan';
import { INTAKE_INDUSTRIES } from '@/pages/maturityData';
import { useAIPlan } from '@/hooks/useAIPlan';
import { AIPlanPanel } from '@/components/AIPlanPanel';
import { safeSetItem } from '@/lib/storage';

const STORAGE_KEY = 'isc-gcc-seasonal-calendar-v1';

interface Selection {
  country: GccCountry;
  industry: string;
}

function loadSelection(): Selection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Selection>;
      if (parsed?.country) return { country: parsed.country, industry: parsed.industry ?? 'manufacturing' };
    }
  } catch { /* fall through to default */ }
  return { country: 'saudi', industry: 'manufacturing' };
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

const REPORT_YEAR = 2026;

export function GccSeasonalCalendar() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const [sel, setSel] = useState<Selection>(loadSelection);
  const persist = useCallback((next: Selection) => {
    setSel(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const data = GCC_SEASONAL_DATA[sel.country];
  const h = data.ramadanHours;
  const yearData = getYearData(sel.country, REPORT_YEAR);
  const hajjAdvisory = getHajjAdvisory(sel.country, isAr);

  const countdown = useMemo(() => buildCountdown(sel.country, todayIso, isAr), [sel.country, todayIso, isAr]);
  const upcoming = countdown.filter(c => !c.isPast);
  const pastRecord = countdown.filter(c => c.isPast);

  const buildPrompt = useCallback(() => buildSeasonalCalendarPrompt(sel.country, sel.industry, isAr), [sel, isAr]);
  const aiPlan = useAIPlan(buildPrompt, isAr, 'gccSeasonalCalendar', true);

  // Tier B (#377) -- kept as a separate lib/state from Tier A per the
  // original scoping note ("deliberately not bundled with it"), but
  // surfaced on the same page for discoverability.
  const [rop, setRop] = useState<ReorderPointInputs>(() => {
    try {
      const raw = localStorage.getItem('isc-reorder-point-ramadan-v1');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ReorderPointInputs>;
        if (parsed) return { ...defaultReorderPointInputs(), ...parsed, country: sel.country };
      }
    } catch { /* fall through to default */ }
    return { ...defaultReorderPointInputs(), country: sel.country };
  });
  const persistRop = useCallback((next: ReorderPointInputs) => {
    setRop(next);
    safeSetItem('isc-reorder-point-ramadan-v1', JSON.stringify(next));
  }, []);
  const ropEffective = useMemo(() => ({ ...rop, country: sel.country }), [rop, sel.country]);
  const ropResult = useMemo(() => computeReorderPoint(ropEffective), [ropEffective]);
  const buildRopPrompt = useCallback(() => buildReorderPointPrompt(ropEffective, ropResult, isAr), [ropEffective, ropResult, isAr]);
  const ropAiPlan = useAIPlan(buildRopPrompt, isAr, 'reorderPointRamadan', ropResult.hasEnoughInputs);

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <CalendarClock className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'مرجع تشغيلي موسمي، غير معتمد على التقدير' : 'Sourced Operational Reference, Not an Estimate'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'التقويم الموسمي الخليجي' : 'GCC Seasonal Operations Calendar'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-6">
            {isAr
              ? 'قواعد ساعات عمل رمضان الحقيقية لكل دولة، وتواريخ عطلات العيد الرسمية لعام 2026، ونظام عد تنازلي للمشتريات (٩٠/٦٠/٣٠/١٤ يوماً) مبني على هذه الحقائق -- دون اختلاق أي رقم لشدة الازدحام.'
              : "Real per-country Ramadan working-hours rules, official 2026 Eid holiday dates, and a T-90/60/30/14 procurement countdown built from those facts -- no invented congestion-severity number."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {(isAr
              ? ['٦ دول', 'أساس قانوني موثّق', 'عربي / إنجليزي', 'لا تقدير مُختلق']
              : ['6 Countries', 'Cited Legal Basis', 'Arabic / English', 'No Fabricated Estimate']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <div className="no-print flex items-center justify-end">
          <button
            onClick={() => printZone('gcc-seasonal-calendar')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        <div className="print-zone-gcc-seasonal-calendar bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          <div className="hidden print:block pb-3 border-b border-gray-300">
            <p className="text-lg font-extrabold text-gray-900">
              {isAr ? '📅 التقويم الموسمي الخليجي' : '📅 GCC Seasonal Operations Calendar'}
            </p>
            <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${todayDisplay}` : `Exported: ${todayDisplay}`}</p>
          </div>

          {/* Country + industry picker */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'الدولة' : 'Country'}
              </label>
              <select
                value={sel.country}
                onChange={e => persist({ ...sel, country: e.target.value as GccCountry })}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              >
                {GCC_COUNTRIES.map(c => (
                  <option key={c} value={c}>{isAr ? GCC_SEASONAL_DATA[c].labelAr : GCC_SEASONAL_DATA[c].labelEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'الصناعة' : 'Industry'}
              </label>
              <select
                value={sel.industry}
                onChange={e => persist({ ...sel, industry: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              >
                {INTAKE_INDUSTRIES.map(ind => (
                  <option key={ind.id} value={ind.id}>{isAr ? ind.labelAr : ind.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ramadan hours rule -- evergreen, not date-dependent */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-800">
              {isAr ? 'قاعدة ساعات عمل رمضان' : 'Ramadan Working-Hours Rule'}
            </p>
            {h.mandated ? (
              <p className="text-[11px] text-slate-700">
                {isAr
                  ? `إلزامي (${h.appliesTo === 'all_employees' ? 'جميع الموظفين' : 'الموظفين المسلمين فقط'}): ${h.privateSectorHoursPerDay} ساعات/يوم، ${h.privateSectorHoursPerWeek} ساعة/أسبوع في القطاع الخاص.`
                  : `Mandated (${h.appliesTo === 'all_employees' ? 'all employees' : 'Muslim employees only'}): ${h.privateSectorHoursPerDay}h/day, ${h.privateSectorHoursPerWeek}h/week, private sector.`}
              </p>
            ) : (
              <p className="text-[11px] text-slate-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                {isAr
                  ? 'لا يوجد تخفيض إلزامي لساعات العمل في القطاع الخاص -- يُحدد ذلك كل صاحب عمل بنفسه. استثناء حقيقي عن بقية دول المجموعة.'
                  : 'No mandated private-sector hour reduction -- employer discretion. A genuine outlier vs. the rest of this country set.'}
              </p>
            )}
            <p className="text-[11px] text-slate-600">{isAr ? h.publicSectorScheduleAr : h.publicSectorScheduleEn}</p>
            <p className="text-[11px] text-slate-600">{isAr ? h.payNoteAr : h.payNoteEn}</p>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-slate-200">
              {isAr ? `الأساس القانوني: ${h.legalBasisAr}` : `Legal basis: ${h.legalBasisEn}`}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isAr ? h.sourceNoteAr : h.sourceNoteEn}
            </p>
          </div>

          {/* 2026 Eid calendar -- historical record, see date-reality note */}
          {yearData && (
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-xs font-bold text-slate-800">
                {isAr ? 'تقويم عيد 2026 (سجل تاريخي -- انظر ملاحظة أدناه)' : '2026 Eid Calendar (historical record -- see note below)'}
              </p>
              <div className="text-[11px] text-slate-700 space-y-1">
                <p><strong>{isAr ? 'عيد الفطر:' : 'Eid al-Fitr:'}</strong> {yearData.eidAlFitr.startDate} → {yearData.eidAlFitr.endDate} — {isAr ? yearData.eidAlFitr.noteAr : yearData.eidAlFitr.noteEn}</p>
                <p><strong>{isAr ? 'عيد الأضحى:' : 'Eid al-Adha:'}</strong> {yearData.eidAlAdha.startDate} → {yearData.eidAlAdha.endDate} — {isAr ? yearData.eidAlAdha.noteAr : yearData.eidAlAdha.noteEn}</p>
              </div>
            </div>
          )}

          {/* Hajj advisory -- Saudi only */}
          {hajjAdvisory && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-900 mb-1">
                {isAr ? 'إرشاد موسم الحج (السعودية فقط)' : 'Hajj-Season Advisory (Saudi Arabia only)'}
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed">{hajjAdvisory}</p>
            </div>
          )}

          {/* Countdown */}
          <div>
            <p className="text-xs font-bold text-slate-800 mb-2">
              {isAr ? 'العد التنازلي للمشتريات (٩٠/٦٠/٣٠/١٤ يوماً)' : 'Procurement Countdown (T-90/60/30/14)'}
            </p>
            {upcoming.length > 0 ? (
              <div className="space-y-1.5">
                {upcoming.map((c, i) => (
                  <div key={i} className="text-[11px] text-slate-700 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="font-bold text-[#082C6B]">{c.dueDate}</span> — {isAr ? c.actionAr : c.actionEn}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {isAr
                  ? `لا توجد مواعيد قادمة -- جميع مواعيد عام ${REPORT_YEAR} قد مضت، ولم تُنشر تواريخ عام 2027 الرسمية بعد من قِبل حكومات المجموعة (تُعلن عادة قبل الموعد بيوم أو يومين فقط عبر ترائي الهلال). ستُحدَّث هذه الصفحة فور توفر تلك التواريخ.`
                  : `No upcoming dates -- every ${REPORT_YEAR} milestone has already passed, and official 2027 dates have not yet been published by any GCC government (typically confirmed only 1-2 days ahead via moon sighting). This page will be updated the moment those dates are sourced.`}
              </p>
            )}
            {pastRecord.length > 0 && (
              <details className="mt-2">
                <summary className="text-[10px] text-muted-foreground cursor-pointer">
                  {isAr ? `عرض سجل ${REPORT_YEAR} التاريخي (${pastRecord.length} بنداً، منقضية)` : `Show ${REPORT_YEAR} historical record (${pastRecord.length} items, past)`}
                </summary>
                <div className="space-y-1 mt-2 opacity-60">
                  {pastRecord.map((c, i) => (
                    <div key={i} className="text-[10px] text-slate-500 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5">
                      <span className="font-bold">{c.dueDate}</span> — {isAr ? c.actionAr : c.actionEn}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            {isAr
              ? 'الساعات القانونية حقائق مستقرة مبنية على القانون. تواريخ الهلال تقديرات مسبقة قابلة للتغيير بيوم أو يومين عند الإعلان الرسمي. لا تُقيّم هذه الأداة شدة ازدحام الشحن كرقم دوري -- فقط دراسة حالة واحدة موثّقة لعام 2026 للسعودية.'
              : 'Statutory hours are stable, law-based facts. Moon-sighting dates are advance estimates that can shift by 1-2 days at official announcement. This tool does not score freight-congestion severity as a recurring index -- only one sourced, dated 2026 Saudi case study.'}
          </p>

          {/* AI narrative (optional) */}
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
              disabled={false}
              savedPlan={aiPlan.savedPlan}
              onViewSaved={aiPlan.viewSaved}
              onDeleteSaved={aiPlan.deleteSaved}
              rateLimited={aiPlan.rateLimited}
              retryAfterSeconds={aiPlan.retryAfterSeconds}
              toolKey="gccSeasonalCalendar"
              saveError={aiPlan.saveError}
              onDismissSaveError={aiPlan.dismissSaveError}
              onRetrySave={aiPlan.retrySave}
              deleteError={aiPlan.deleteError}
              onDismissDeleteError={aiPlan.dismissDeleteError}
            />
          </div>
        </div>

        {/* Tier B (#377): Reorder-Point Adjustment -- separate card, separate module */}
        <div className="print-zone-gcc-seasonal-calendar bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#082C6B]" />
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isAr ? 'الطبقة الثانية (#377): تعديل نقطة إعادة الطلب' : 'Tier B (#377): Reorder-Point Adjustment'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? 'وحدة منفصلة عمداً عن التقويم أعلاه -- انظر الإفصاح أدناه' : 'Deliberately a separate module from the calendar above -- see disclosure below'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? `يستخدم الدولة المختارة أعلاه: ${data.labelAr}` : `Uses the country selected above: ${data.labelEn}`}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'متوسط الاستهلاك اليومي' : 'Average Daily Usage'}
              </label>
              <input
                type="number" min={0}
                value={rop.avgDailyUsage ?? ''}
                onChange={e => persistRop({ ...rop, avgDailyUsage: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0) })}
                placeholder="0"
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'مهلة التوريد الأساسية (أيام)' : 'Base Lead Time (days)'}
              </label>
              <input
                type="number" min={0}
                value={rop.baseLeadTimeDays ?? ''}
                onChange={e => persistRop({ ...rop, baseLeadTimeDays: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0) })}
                placeholder="0"
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'تاريخ الطلب' : 'Order Date'}
              </label>
              <input
                type="date"
                value={rop.orderDate}
                onChange={e => persistRop({ ...rop, orderDate: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                {isAr ? 'مضاعف الطلب الموسمي (١.٠ = بدون تغيير)' : 'Seasonal Demand Multiplier (1.0 = no change)'}
              </label>
              <input
                type="number" min={0} step={0.05}
                value={rop.seasonalDemandMultiplier}
                onChange={e => persistRop({ ...rop, seasonalDemandMultiplier: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {isAr ? 'مصدر مضاعف الطلب (اختياري لكن يُنصح به)' : 'Demand Multiplier Source (optional but recommended)'}
            </label>
            <input
              type="text"
              value={rop.demandMultiplierSource}
              onChange={e => persistRop({ ...rop, demandMultiplierSource: e.target.value })}
              placeholder={isAr ? 'مثال: بيانات نقاط البيع لعام ٢٠٢٥' : 'e.g. 2025 POS data for this SKU'}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{isAr ? 'عامل السعة (من ساعات رمضان الحقيقية)' : 'Capacity factor (from real Ramadan hours)'}</span>
              <span className="font-bold text-slate-800">{ropResult.capacityFactor.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{isAr ? 'أيام إغلاق العيد المتداخلة' : 'Overlapping Eid closure days'}</span>
              <span className="font-bold text-slate-800">{ropResult.eidClosureOverlapDays}</span>
            </div>
            {ropResult.hasEnoughInputs ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{isAr ? 'مهلة التوريد الفعلية' : 'Effective lead time'}</span>
                  <span className="font-bold text-slate-800">{ropResult.effectiveLeadTimeDays!.toFixed(1)} {isAr ? 'يوم' : 'days'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>{isAr ? 'نقطة إعادة الطلب الأساسية' : 'Baseline reorder point'}</span>
                  <span className="font-bold text-slate-800">{ropResult.baselineReorderPoint!.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-[#082C6B]">
                  <span>{isAr ? 'نقطة إعادة الطلب المعدّلة' : 'Adjusted reorder point'}</span>
                  <span>{ropResult.adjustedReorderPoint!.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className={`flex items-center justify-between text-[11px] font-bold ${(ropResult.deltaUnits ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  <span>{isAr ? 'الفرق' : 'Delta'}</span>
                  <span>{(ropResult.deltaUnits ?? 0) >= 0 ? '+' : ''}{ropResult.deltaUnits!.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 pt-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {isAr ? 'أدخل متوسط الاستهلاك اليومي ومهلة التوريد لعرض النقطة المعدّلة.' : 'Enter average daily usage and lead time to see the adjusted reorder point.'}
              </p>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            {isAr
              ? 'عامل السعة وأيام إغلاق العيد محسوبان من نفس الحقائق الموثّقة أعلاه -- وليسا تقديراً. مضاعف الطلب الموسمي مُدخل من العميل بالكامل: لا يوجد رقم موحّد موثوق لتغير الطلب حسب المنتج عبر كل الصناعات والدول، وأي رقم كهذا سيكون اختلاقاً (مبدأ القرار 8.7). استخدم بيانات نقاط البيع أو تخطيط الموارد الخاصة بك.'
              : 'The capacity factor and Eid closure days are computed from the same sourced facts above -- not an estimate. The seasonal demand multiplier is entirely client-supplied: no single trustworthy figure exists for how demand shifts by product across every industry and country, and inventing one would violate Decision Record 8.7. Use your own POS or ERP history.'}
          </p>

          <div className="no-print pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#082C6B]" />
              {isAr ? 'اقتراح خطوات بالذكاء الاصطناعي' : 'AI Next-Steps Suggestion'}
            </h4>
            <AIPlanPanel
              loading={ropAiPlan.loading}
              result={ropAiPlan.result}
              evidenceSummary={ropAiPlan.evidenceSummary}
              error={ropAiPlan.error}
              onGenerate={ropAiPlan.generate}
              onReset={ropAiPlan.reset}
              buttonLabel={isAr ? 'توليد اقتراح ✨' : 'Generate Suggestion ✨'}
              isAr={isAr}
              disabled={!ropResult.hasEnoughInputs}
              savedPlan={ropAiPlan.savedPlan}
              onViewSaved={ropAiPlan.viewSaved}
              onDeleteSaved={ropAiPlan.deleteSaved}
              rateLimited={ropAiPlan.rateLimited}
              retryAfterSeconds={ropAiPlan.retryAfterSeconds}
              toolKey="reorderPointRamadan"
              saveError={ropAiPlan.saveError}
              onDismissSaveError={ropAiPlan.dismissSaveError}
              onRetrySave={ropAiPlan.retrySave}
              deleteError={ropAiPlan.deleteError}
              onDismissDeleteError={ropAiPlan.dismissDeleteError}
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {isAr
            ? 'هذه الأداة لا تحل محل استشارة جمركية أو لوجستية أو قانونية متخصصة، ولا تؤكد مواعيد ترائي الهلال الرسمية.'
            : 'This tool is not a substitute for specialist customs, logistics, or legal advice, and does not constitute an official moon-sighting date confirmation.'}
        </p>
      </div>
    </div>
  );
}
