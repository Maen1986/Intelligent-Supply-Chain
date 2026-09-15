// src/pages/LocalContentICVCheck.tsx
//
// SI Module 08 UI -- Local Content / ICV Eligibility Check (15 Sep 2026).
//
// This is the live UI for supplierLocalContentEligibility.ts. It is a
// separate page/route from the pre-existing LCGPAReadinessCheck.tsx
// (#373/#374, Saudi-only, client-own-spend self-check) rather than a rewrite
// of it: that page and its engine (lcgpaLocalContent.ts) remain live and
// completely untouched. This page generalizes the same idea across three
// genuinely different sourced mechanisms (Saudi LCGPA, UAE ICV, Jordan's
// price-preference margin), lets the user pick which government/private
// buyer context they're assessing against, and -- per the "why not both"
// decision -- adds a portfolio rollup on top of the single-entity check, so
// the same screen answers both "how does this one entity look" and "how
// does my whole GCC/Jordan-relevant portfolio look."
//
// v1 scope, disclosed rather than silently omitted: no AI-narrative panel
// yet (LCGPAReadinessCheck.tsx's optional useAIPlan/AIPlanPanel integration
// is a natural fast-follow, not wired here to keep this first pass focused
// and independently verifiable). localStorage persistence only, manual
// input, deterministic disclosed-rule scoring throughout (Decision Record
// 8.7 -- never an AI-invented score).
import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Globe2, Printer, Info, ShieldAlert, ShieldCheck, ShieldQuestion,
  ChevronDown, Plus, Trash2, ExternalLink, BookOpenCheck,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { safeSetItem } from '@/lib/storage';
import {
  assessSupplierLocalContent, recommendLocalContentAction, rollUpPortfolioLocalContent,
  COUNTRY_FRAMEWORKS,
  type LocalContentCountry, type ProcurementContext, type SupplierLocalContentInputs,
  type LocalContentApplicability, type LocalContentAssessment,
} from '@/lib/supplierLocalContentEligibility';

const STORAGE_KEY = 'isc-local-content-icv-v1';

type SaInputs = NonNullable<SupplierLocalContentInputs['sa']>;
type AeInputs = NonNullable<SupplierLocalContentInputs['ae']>;
type JoInputs = NonNullable<SupplierLocalContentInputs['jo']>;

function emptySa(): SaInputs {
  return {
    localLaborSAR: null, expatLaborSAR: null,
    localGoodsServicesSAR: null, foreignGoodsServicesSAR: null,
    capacityBuildingSAR: null,
    localAssetDepreciationSAR: null, totalAssetDepreciationSAR: null,
  };
}
function emptyAe(): AeInputs {
  return {
    manufacturingOrThirdPartySpendLocalAED: null, manufacturingOrThirdPartySpendTotalAED: null,
    investmentNBVLocalAED: null, investmentNBVTotalAED: null,
    emiratisationAnnualSpendAED: null,
    expatriateHeadcount: null,
    exportRevenueAED: null,
    emiratiHeadcountGrowthPct: null,
    investmentGrowthPct: null,
    registeredOnMainland: null,
  };
}
function emptyJo(): JoInputs {
  return { bidValueLocallyManufacturedPct: null };
}

interface PortfolioEntry {
  id: string;
  label: string;
  country: LocalContentCountry;
  context: ProcurementContext;
  spendSharePct: number;
  inputs: SupplierLocalContentInputs;
}

interface PersistedState {
  country: LocalContentCountry;
  context: ProcurementContext;
  sa: SaInputs;
  ae: AeInputs;
  jo: JoInputs;
  targetThresholdPct: number | null;
  portfolio: PortfolioEntry[];
}

function defaultState(): PersistedState {
  return { country: 'SA', context: 'government', sa: emptySa(), ae: emptyAe(), jo: emptyJo(), targetThresholdPct: null, portfolio: [] };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed) {
        return {
          country: parsed.country ?? 'SA',
          context: parsed.context ?? 'government',
          sa: { ...emptySa(), ...parsed.sa },
          ae: { ...emptyAe(), ...parsed.ae },
          jo: { ...emptyJo(), ...parsed.jo },
          targetThresholdPct: parsed.targetThresholdPct ?? null,
          portfolio: Array.isArray(parsed.portfolio) ? parsed.portfolio : [],
        };
      }
    }
  } catch { /* fall through to default */ }
  return defaultState();
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

const applicabilityStyle: Record<LocalContentApplicability, { badge: string; icon: React.ReactNode }> = {
  applicable: { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  'not-applicable': { badge: 'bg-slate-100 border-slate-200 text-slate-600', icon: <ShieldQuestion className="w-3.5 h-3.5" /> },
  'insufficient-data': { badge: 'bg-amber-50 border-amber-200 text-amber-700', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
};

const COUNTRY_ORDER: LocalContentCountry[] = ['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW'];
const COUNTRY_FLAG: Record<LocalContentCountry, string> = { SA: '🇸🇦', AE: '🇦🇪', JO: '🇯🇴', OM: '🇴🇲', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼' };

const CONTEXT_TABS: { v: ProcurementContext; en: string; ar: string }[] = [
  { v: 'government', en: 'Government', ar: 'حكومي' },
  { v: 'semi-government-soe', en: 'Semi-Government / SOE', ar: 'شبه حكومي / مملوك للدولة' },
  { v: 'private-commercial', en: 'Private Commercial', ar: 'تجاري خاص' },
];

// Pillar keys come straight off the engine's computation result (SA: labor/goodsServices/
// capacityBuilding/depreciation; AE: manufacturingOrThirdPartySpend/investment/emiratisation/
// expatriateContribution/bonus). QA pass finding: these were being shown via a raw English regex
// fallback even in Arabic mode -- fixed by mapping every real key to a proper bilingual label
// (same English pillar names already used in LCGPAReadinessCheck.tsx's own pillarLabels map, for
// the two keys the two pages share).
const PILLAR_LABELS: Record<string, { en: string; ar: string }> = {
  labor: { en: 'Labor', ar: 'العمالة' },
  goodsServices: { en: 'Goods & Services', ar: 'السلع والخدمات' },
  capacityBuilding: { en: 'Capacity Building', ar: 'بناء القدرات' },
  depreciation: { en: 'Depreciation & Amortization', ar: 'الإهلاك والاستهلاك' },
  manufacturingOrThirdPartySpend: { en: 'Manufacturing / Third-Party Spend', ar: 'التصنيع / إنفاق الطرف الثالث' },
  investment: { en: 'Investment', ar: 'الاستثمار' },
  emiratisation: { en: 'Emiratisation', ar: 'التوطين' },
  expatriateContribution: { en: 'Expatriate Contribution', ar: 'مساهمة العمالة الوافدة' },
  bonus: { en: 'Bonus Categories', ar: 'فئات المكافآت' },
};
function pillarLabel(key: string, isAr: boolean): string {
  const l = PILLAR_LABELS[key];
  return l ? (isAr ? l.ar : l.en) : key;
}

function NumberField({
  label, hint, value, onChange, unit, placeholder, max,
}: {
  label: string; hint?: string; value: number | null; onChange: (v: number | null) => void; unit?: string; placeholder?: string; max?: number;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground mb-1.5">{hint}</p>}
      <div className="relative">
        <input
          type="number"
          min={0}
          max={max}
          value={value ?? ''}
          onChange={e => {
            if (e.target.value === '') { onChange(null); return; }
            let v = parseFloat(e.target.value);
            if (Number.isNaN(v)) v = 0;
            v = Math.max(0, v);
            if (max !== undefined) v = Math.min(max, v);
            onChange(v);
          }}
          placeholder={placeholder ?? '0'}
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 pe-14 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
        {unit && <span className="absolute inset-y-0 end-3 flex items-center text-[10px] font-bold text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
      />
    </div>
  );
}

export function LocalContentICVCheck() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const [state, setState] = useState<PersistedState>(loadState);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [addLabel, setAddLabel] = useState('');
  const [addSpendShare, setAddSpendShare] = useState<number | null>(null);

  const persist = (next: PersistedState) => {
    setState(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
  };

  const framework = COUNTRY_FRAMEWORKS[state.country];

  const currentInputs: SupplierLocalContentInputs = useMemo(() => {
    if (state.country === 'SA') return { sa: state.sa };
    if (state.country === 'AE') return { ae: state.ae };
    if (state.country === 'JO') return { jo: state.jo };
    return {};
  }, [state.country, state.sa, state.ae, state.jo]);

  const assessment: LocalContentAssessment = useMemo(
    () => assessSupplierLocalContent(state.country, state.context, currentInputs),
    [state.country, state.context, currentInputs],
  );

  const recommendation = useMemo(
    () => recommendLocalContentAction(assessment, state.targetThresholdPct),
    [assessment, state.targetThresholdPct],
  );

  const portfolioRollup = useMemo(() => {
    if (state.portfolio.length === 0) return [];
    return rollUpPortfolioLocalContent(
      state.portfolio.map(p => ({
        supplierId: p.id,
        spendShare: p.spendSharePct,
        assessment: assessSupplierLocalContent(p.country, p.context, p.inputs),
      })),
    );
  }, [state.portfolio]);

  const style = applicabilityStyle[assessment.applicability];

  // QA-pass fix: only treat a computation as having a real, renderable result once its actual
  // headline figure is non-null -- otherwise (first load, or every relevant field still empty)
  // show a clean "enter figures" hint instead of a card full of zeros and em-dashes.
  const hasMeaningfulResult = (() => {
    const c = assessment.computation;
    if (!c) return false;
    if (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score') return c.scorePct !== null;
    if (c.mechanismType === 'price-preference-margin') return c.locallyManufacturedSharePct !== null;
    return false;
  })();

  const canAddToPortfolio = addLabel.trim().length > 0 && addSpendShare !== null && addSpendShare > 0;

  const addToPortfolio = () => {
    if (!canAddToPortfolio) return;
    const id = `entity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: PortfolioEntry = {
      id, label: addLabel.trim(), country: state.country, context: state.context,
      spendSharePct: addSpendShare!, inputs: currentInputs,
    };
    persist({ ...state, portfolio: [...state.portfolio, entry] });
    setAddLabel('');
    setAddSpendShare(null);
  };

  const removeFromPortfolio = (id: string) => {
    persist({ ...state, portfolio: state.portfolio.filter(p => p.id !== id) });
  };

  return (
    <div className={`min-h-screen bg-slate-50 ${isAr ? 'rtl' : 'ltr'}`}>
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#082C6B] via-[#0e3d8a] to-[#1a1a3e] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4f46e5 0%, transparent 50%)' }} />
        <div className="relative container mx-auto px-6 py-14">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Globe2 className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-[#C9A84C] text-sm font-bold uppercase tracking-widest mb-1">
                {isAr ? 'المحتوى المحلي / القيمة المحلية المضافة — متعدد الدول' : 'Local Content / ICV — Multi-Country'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight">
                {isAr ? 'فحص أهلية المحتوى المحلي عبر السعودية والإمارات والأردن' : 'Local Content / ICV Eligibility Check'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-4">
            {isAr
              ? 'المحتوى المحلي ليس معياراً إقليمياً واحداً -- إنه ثلاث آليات مختلفة جوهرياً: درجة نسبة مئوية معتمدة في السعودية (LCGPA)، درجة مرجحة متعددة الأركان في الإمارات (ICV)، وتفضيل سعري في العطاءات بالأردن. اختر الدولة وسياق الشراء لترى الآلية الصحيحة والحالة الصادقة لأهليتها.'
              : "Local content isn't one regional standard -- it's three genuinely different mechanisms: a certified percentage score in Saudi Arabia (LCGPA), a weighted multi-pillar score in the UAE (ICV), and a bid-evaluation price preference in Jordan. Pick the country and buyer context to see the right mechanism and an honest applicability read."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            {(isAr
              ? ['إدخال يدوي', 'صيغ رسمية موثّقة لكل دولة', 'تفريق حكومي / خاص صريح', 'مستوى المورّد + مستوى المحفظة', 'عربي / إنجليزي']
              : ['Manual Input', 'Sourced Official Formulas Per Country', 'Explicit Government/Private Split', 'Entity Level + Portfolio Level', 'Arabic / English']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
          <Link href="/lcgpa-readiness" className="no-print mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] hover:text-white transition-colors">
            {isAr ? 'تبحث فقط عن فحص السعودية الذاتي لإنفاقك الخاص؟ افتح أداة جاهزية LCGPA' : "Only need Saudi Arabia's own-spend self-check? Open the LCGPA Readiness tool"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <div className="no-print flex items-center justify-end">
          <button
            onClick={() => printZone('local-content-icv')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        <div className="print-zone-local-content-icv bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          {/* Print-only header */}
          <div className="hidden print:block pb-3 border-b border-gray-300">
            <p className="text-lg font-extrabold text-gray-900">
              {isAr ? '🌍 فحص أهلية المحتوى المحلي / ICV' : '🌍 Local Content / ICV Eligibility Check'}
            </p>
            <p className="text-xs text-gray-500">{isAr ? `تاريخ التصدير: ${today}` : `Exported: ${today}`}</p>
          </div>

          {/* ── Step 1: Country + Context selectors ── */}
          <div>
            <h2 className="text-sm font-black text-slate-800 mb-1">
              {isAr ? '١) الدولة وسياق الشراء' : '1) Country & Buyer Context'}
            </h2>
            <p className="text-[11px] text-muted-foreground mb-3">
              {isAr
                ? 'لم يُوثَّق أي من الآليات الثلاث الممولة بالبحث كساري على المشتريات التجارية بين القطاع الخاص فقط -- لذلك نطلب سياق الشراء صراحة بدلاً من افتراضه.'
                : "None of the three sourced mechanisms has documented evidence of applying to pure private-to-private commercial procurement -- so buyer context is asked explicitly rather than assumed."}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label={isAr ? 'اختيار الدولة' : 'Select country'}>
              {COUNTRY_ORDER.map(c => {
                const active = state.country === c;
                const fw = COUNTRY_FRAMEWORKS[c];
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => persist({ ...state, country: c })}
                    className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      active ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span aria-hidden="true">{COUNTRY_FLAG[c]}</span>
                    {isAr ? fw.countryNameAr : fw.countryNameEn}
                    {fw.mechanismType === 'not-yet-sourced' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                        {isAr ? 'غير موثّق' : 'not sourced'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label={isAr ? 'اختيار سياق الشراء' : 'Select buyer context'}>
              {CONTEXT_TABS.map(ctx => {
                const active = state.context === ctx.v;
                return (
                  <button
                    key={ctx.v}
                    type="button"
                    aria-pressed={active}
                    onClick={() => persist({ ...state, context: ctx.v })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      active ? 'bg-[#C9A84C] border-[#C9A84C] text-[#082C6B]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? ctx.ar : ctx.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sourced methodology (collapsible, keyboard-operable, never hover-only) ── */}
          <div className="border border-slate-100 rounded-xl">
            <button
              type="button"
              aria-expanded={methodologyOpen}
              onClick={() => setMethodologyOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold text-slate-700"
            >
              <span className="flex items-center gap-1.5">
                <BookOpenCheck className="w-3.5 h-3.5 text-[#082C6B]" />
                {isAr ? `المنهجية الموثّقة — ${framework.programNameAr}` : `Sourced Methodology — ${framework.programNameEn}`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${methodologyOpen ? 'rotate-180' : ''}`} />
            </button>
            {methodologyOpen && (
              <p className="px-3 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                {isAr ? framework.sourceNoteAr : framework.sourceNoteEn}
              </p>
            )}
          </div>

          {/* ── Step 2: mechanism-specific inputs, or the not-yet-sourced state ── */}
          {framework.mechanismType === 'not-yet-sourced' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">
                  {isAr ? 'لا توجد صيغة موثّقة بعد لهذه الدولة' : 'No sourced formula for this country yet'}
                </p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  {isAr ? framework.sourceNoteAr : framework.sourceNoteEn}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-black text-slate-800 mb-3">
                {isAr ? '٢) بيانات الإدخال' : '2) Input Figures'}
              </h2>

              {state.country === 'SA' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <NumberField label={isAr ? 'رواتب العمالة المحلية' : 'Local Labor Compensation'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.localLaborSAR} onChange={v => persist({ ...state, sa: { ...state.sa, localLaborSAR: v } })} />
                  <NumberField label={isAr ? 'رواتب العمالة الوافدة' : 'Expatriate Labor Compensation'} hint={isAr ? '٣٧٪ مؤهل' : '37% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.expatLaborSAR} onChange={v => persist({ ...state, sa: { ...state.sa, expatLaborSAR: v } })} />
                  <NumberField label={isAr ? 'إنفاق محلي على السلع والخدمات' : 'Local Goods & Services Spend'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.localGoodsServicesSAR} onChange={v => persist({ ...state, sa: { ...state.sa, localGoodsServicesSAR: v } })} />
                  <NumberField label={isAr ? 'إنفاق أجنبي على السلع والخدمات' : 'Foreign Goods & Services Spend'} hint={isAr ? '٠٪ مؤهل' : '0% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.foreignGoodsServicesSAR} onChange={v => persist({ ...state, sa: { ...state.sa, foreignGoodsServicesSAR: v } })} />
                  <NumberField label={isAr ? 'إنفاق بناء القدرات' : 'Capacity Building Spend'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.capacityBuildingSAR} onChange={v => persist({ ...state, sa: { ...state.sa, capacityBuildingSAR: v } })} />
                  <NumberField label={isAr ? 'إهلاك الأصول المحلية' : 'Local Asset Depreciation'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.localAssetDepreciationSAR} onChange={v => persist({ ...state, sa: { ...state.sa, localAssetDepreciationSAR: v } })} />
                  <NumberField label={isAr ? 'إجمالي إهلاك الأصول' : 'Total Asset Depreciation'} unit={isAr ? 'ر.س' : 'SAR'} value={state.sa.totalAssetDepreciationSAR} onChange={v => persist({ ...state, sa: { ...state.sa, totalAssetDepreciationSAR: v } })} />
                </div>
              )}

              {state.country === 'AE' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <NumberField label={isAr ? 'الإنفاق على التصنيع/الطرف الثالث داخل الإمارات' : 'UAE-Based Manufacturing/Third-Party Spend'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.manufacturingOrThirdPartySpendLocalAED} onChange={v => persist({ ...state, ae: { ...state.ae, manufacturingOrThirdPartySpendLocalAED: v } })} />
                  <NumberField label={isAr ? 'إجمالي إنفاق التصنيع/الطرف الثالث' : 'Total Manufacturing/Third-Party Spend'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.manufacturingOrThirdPartySpendTotalAED} onChange={v => persist({ ...state, ae: { ...state.ae, manufacturingOrThirdPartySpendTotalAED: v } })} />
                  <NumberField label={isAr ? 'صافي القيمة الدفترية للأصول داخل الإمارات' : 'UAE-Based Asset Net Book Value'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.investmentNBVLocalAED} onChange={v => persist({ ...state, ae: { ...state.ae, investmentNBVLocalAED: v } })} />
                  <NumberField label={isAr ? 'إجمالي صافي القيمة الدفترية للأصول' : 'Total Asset Net Book Value'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.investmentNBVTotalAED} onChange={v => persist({ ...state, ae: { ...state.ae, investmentNBVTotalAED: v } })} />
                  <NumberField label={isAr ? 'الإنفاق السنوي على التوطين' : 'Emiratisation Annual Spend'} hint={isAr ? 'حدّ أدنى ٢٪ حتى ≥٢٠ مليون درهم = ١٥٪' : 'Floors at 2%, reaches 15% at >=AED 20M'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.emiratisationAnnualSpendAED} onChange={v => persist({ ...state, ae: { ...state.ae, emiratisationAnnualSpendAED: v } })} />
                  <NumberField label={isAr ? 'عدد العمالة الوافدة' : 'Expatriate Headcount'} value={state.ae.expatriateHeadcount} onChange={v => persist({ ...state, ae: { ...state.ae, expatriateHeadcount: v } })} />
                  <NumberField label={isAr ? 'إيرادات التصدير (اختياري)' : 'Export Revenue (optional)'} unit={isAr ? 'د.إ' : 'AED'} value={state.ae.exportRevenueAED} onChange={v => persist({ ...state, ae: { ...state.ae, exportRevenueAED: v } })} />
                  <NumberField label={isAr ? 'نسبة نمو التوطين (اختياري)' : 'Emirati Headcount Growth % (optional)'} unit="%" max={100} value={state.ae.emiratiHeadcountGrowthPct} onChange={v => persist({ ...state, ae: { ...state.ae, emiratiHeadcountGrowthPct: v } })} />
                  <NumberField label={isAr ? 'نسبة نمو الاستثمار (اختياري)' : 'Investment Growth % (optional)'} unit="%" max={100} value={state.ae.investmentGrowthPct} onChange={v => persist({ ...state, ae: { ...state.ae, investmentGrowthPct: v } })} />
                  <label htmlFor="ae-mainland" className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                    <Checkbox id="ae-mainland" checked={state.ae.registeredOnMainland === true} onCheckedChange={c => persist({ ...state, ae: { ...state.ae, registeredOnMainland: c === true } })} />
                    {isAr ? 'مسجّلة في البر الرئيسي بالإمارات (حافز +١٠٪)' : 'Registered on UAE Mainland (+10% uplift)'}
                  </label>
                </div>
              )}

              {state.country === 'JO' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <NumberField
                    label={isAr ? 'نسبة القيمة المصنّعة محلياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                    hint={isAr ? `تفضيل السعر الأقصى ${COUNTRY_FRAMEWORKS.JO.programNameAr}: ٢٠٪` : 'Maximum price preference margin: 20%'}
                    unit="%"
                    max={100}
                    value={state.jo.bidValueLocallyManufacturedPct}
                    onChange={v => persist({ ...state, jo: { ...state.jo, bidValueLocallyManufacturedPct: v } })}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {framework.mechanismType !== 'not-yet-sourced' && (
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-black text-slate-800 mb-2">
                {isAr ? '٣) النتيجة' : '3) Result'}
              </h2>

              <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${style.badge}`}>
                {style.icon}
                <p className="text-[11px]">{isAr ? assessment.reasonAr : assessment.reasonEn}</p>
              </div>

              {assessment.applicability === 'applicable' && assessment.computation && hasMeaningfulResult && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {assessment.computation.mechanismType === 'eligible-spend-ratio' && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {isAr ? 'الدرجة التوجيهية' : 'Directional Score'}
                        </span>
                        <span className="text-2xl font-black text-[#082C6B]">
                          {assessment.computation.scorePct !== null ? `${assessment.computation.scorePct.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {assessment.computation.pillars.map(p => (
                          <div key={p.key} className="flex items-center justify-between text-[11px] text-slate-600">
                            <span>{pillarLabel(p.key, isAr)}</span>
                            <span className="font-semibold">
                              {p.total > 0 ? `${((p.eligible / p.total) * 100).toFixed(0)}%` : '—'}
                              <span className="text-slate-400 font-normal"> ({p.eligible.toLocaleString()} / {p.total.toLocaleString()})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {assessment.computation.mechanismType === 'weighted-pillar-score' && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {isAr ? 'الدرجة التوجيهية' : 'Directional Score'}
                        </span>
                        <span className="text-2xl font-black text-[#082C6B]">
                          {assessment.computation.scorePct !== null ? `${assessment.computation.scorePct.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {assessment.computation.pillars.map(p => (
                          <div key={p.key} className="text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                              <span>{pillarLabel(p.key, isAr)}</span>
                              <span className="font-semibold">{p.contributionPct.toFixed(1)} pts</span>
                            </div>
                          </div>
                        ))}
                        {assessment.computation.mainlandUpliftApplied && (
                          <p className="text-[10px] text-emerald-700 font-semibold">
                            {isAr ? '+ حافز التسجيل في البر الرئيسي (١٠٪) مطبّق' : '+ Mainland registration uplift (10%) applied'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {assessment.computation.mechanismType === 'price-preference-margin' && (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {isAr ? 'الخصم السعري الفعلي' : 'Effective Bid Discount'}
                        </span>
                        <span className="text-2xl font-black text-[#082C6B]">
                          {assessment.computation.effectiveBidDiscountPct !== null ? `${assessment.computation.effectiveBidDiscountPct.toFixed(1)} pts` : '—'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {isAr
                          ? `من أصل ${assessment.computation.preferenceMarginPct} نقطة كحد أقصى لتفضيل السعر`
                          : `Out of a maximum ${assessment.computation.preferenceMarginPct}-point price preference`}
                      </p>
                    </>
                  )}
                </div>
              )}

              {assessment.applicability === 'applicable' && assessment.computation && !hasMeaningfulResult && (
                <p className="mt-3 text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  {isAr ? 'أدخل الأرقام أعلاه لعرض النتيجة.' : 'Enter the figures above to see the result.'}
                </p>
              )}

              <p className="mt-2 text-[10px] text-muted-foreground">{isAr ? assessment.certificationCaveatAr : assessment.certificationCaveatEn}</p>

              {/* ── Recommendation (Rule 8: primary + alternative) ── */}
              {assessment.applicability === 'applicable' && (
                <div className="mt-3">
                  <NumberField
                    label={isAr ? 'الحد المستهدف للمناقصة (اختياري)' : 'Target Tender Threshold (optional)'}
                    unit="%"
                    max={100}
                    value={state.targetThresholdPct}
                    onChange={v => persist({ ...state, targetThresholdPct: v })}
                    placeholder="%"
                  />
                  {recommendation && (
                    <div className="mt-2 space-y-2">
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                        <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-0.5">{isAr ? 'التوصية الأساسية' : 'Primary Recommendation'}</p>
                        <p className="text-[11px] text-sky-900">{isAr ? recommendation.primaryAr : recommendation.primaryEn}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{isAr ? 'البديل القوي' : 'Strong Alternative'}</p>
                        <p className="text-[11px] text-slate-700">{isAr ? recommendation.alternativeAr : recommendation.alternativeEn}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Add to portfolio ── */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-800 mb-2">
                  {isAr ? 'إضافة إلى المحفظة' : 'Add to Portfolio'}
                </h3>
                <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2 items-end">
                  <TextField label={isAr ? 'اسم الجهة/المورّد' : 'Entity / Supplier Name'} value={addLabel} onChange={setAddLabel} placeholder={isAr ? 'مثال: شركة الصلب المحلية' : 'e.g. Local Steel Partner Co.'} />
                  <NumberField label={isAr ? 'حصة الإنفاق' : 'Spend Share'} unit="%" max={100} value={addSpendShare} onChange={setAddSpendShare} />
                  <button
                    type="button"
                    disabled={!canAddToPortfolio}
                    onClick={addToPortfolio}
                    className="no-print flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#082C6B] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0e3d8a] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Portfolio rollup ── */}
          {state.portfolio.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-black text-slate-800 mb-1">
                {isAr ? '٤) نظرة المحفظة على مستوى العميل' : '4) Client-Level Portfolio View'}
              </h2>
              <p className="text-[11px] text-muted-foreground mb-3">
                {isAr
                  ? 'مُجمَّعة حسب الدولة وسياق الشراء وآلية المحتوى المحلي، مرجحة بحصة الإنفاق -- لا يُدمَج مطلقاً بين آليات مختلفة في رقم واحد.'
                  : 'Grouped by country, buyer context, and local-content mechanism, spend-weighted -- never averaged across different mechanisms into one number.'}
              </p>

              <div className="space-y-2 mb-4">
                {state.portfolio.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span aria-hidden="true">{COUNTRY_FLAG[p.country]}</span>
                      {p.label}
                      <span className="text-slate-400 font-normal">
                        ({isAr ? COUNTRY_FRAMEWORKS[p.country].countryNameAr : COUNTRY_FRAMEWORKS[p.country].countryNameEn}, {p.spendSharePct}%)
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={isAr ? `إزالة ${p.label}` : `Remove ${p.label}`}
                      onClick={() => removeFromPortfolio(p.id)}
                      className="no-print text-slate-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 pe-3 font-bold">{isAr ? 'المجموعة' : 'Group'}</th>
                      <th className="py-1.5 pe-3 font-bold">{isAr ? 'الموردون' : 'Entities'}</th>
                      <th className="py-1.5 pe-3 font-bold">{isAr ? 'حصة المحفظة' : 'Portfolio Share'}</th>
                      <th className="py-1.5 pe-3 font-bold">{isAr ? 'النتيجة المرجحة' : 'Weighted Result'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioRollup.map((g, i) => (
                      <tr key={`${g.country}-${g.procurementContext}-${i}`} className="border-b border-slate-100">
                        <td className="py-1.5 pe-3 font-semibold text-slate-700">
                          {isAr ? COUNTRY_FRAMEWORKS[g.country].countryNameAr : COUNTRY_FRAMEWORKS[g.country].countryNameEn}
                          <span className="text-slate-400 font-normal"> — {isAr ? CONTEXT_TABS.find(c => c.v === g.procurementContext)?.ar : CONTEXT_TABS.find(c => c.v === g.procurementContext)?.en}</span>
                        </td>
                        <td className="py-1.5 pe-3 text-slate-600">
                          {g.supplierCount}
                          {(g.suppliersWithInsufficientData > 0 || g.suppliersNotApplicable > 0) && (
                            <span className="text-slate-400"> ({g.suppliersNotApplicable > 0 ? (isAr ? `${g.suppliersNotApplicable} لا ينطبق` : `${g.suppliersNotApplicable} n/a`) : ''}{g.suppliersWithInsufficientData > 0 ? (isAr ? `${g.suppliersWithInsufficientData} غير كافٍ` : `${g.suppliersWithInsufficientData} insufficient`) : ''})</span>
                          )}
                        </td>
                        <td className="py-1.5 pe-3 text-slate-600">{g.portfolioSpendSharePct.toFixed(0)}%</td>
                        <td className="py-1.5 pe-3 font-bold text-[#082C6B]">
                          {g.weightedScorePct !== null ? `${g.weightedScorePct.toFixed(1)}%`
                            : g.weightedEffectiveDiscountPct !== null ? `${g.weightedEffectiveDiscountPct.toFixed(1)} pts`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          {isAr
            ? 'هذه الأداة لا تحل محل تدقيق رسمي من الجهة المعنية (هيئة المحتوى المحلي والمشتريات الحكومية، وزارة الصناعة والتقنية المتقدمة، أو الجهة الأردنية المختصة) أو استشارة قانونية/محاسبية متخصصة.'
            : "This tool is not a substitute for a formal audit from the relevant authority (LCGPA, the UAE's MoIAT, or Jordan's competent ministry) or specialist legal/accounting advice."}
        </p>
      </div>
    </div>
  );
}
