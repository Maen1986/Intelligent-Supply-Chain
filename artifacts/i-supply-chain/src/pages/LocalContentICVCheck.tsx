// src/pages/LocalContentICVCheck.tsx
//
// SI Module 08 UI -- Local Content / ICV Eligibility Check (15 Sep 2026,
// rebuilt 16 Sep 2026 per an independent senior-QA review run against
// origin/main @ b9dab44 -- 33/33 engine tests re-verified, every
// worked-example number hand-recomputed and matched).
//
// This is the live UI for supplierLocalContentEligibility.ts. It is a
// separate page/route from the pre-existing LCGPAReadinessCheck.tsx
// (#373/#374, Saudi-only, client-own-spend self-check) rather than a rewrite
// of it: that page and its engine (lcgpaLocalContent.ts) remain live and
// completely untouched, and neither page shares state with the other.
//
// v1 (15 Sep 2026) shipped as a single-entity form with a separate
// "add to portfolio" step. The 16 Sep 2026 QA review found this was the
// wrong shape for a module whose real differentiator is the portfolio view:
// rebuilt around a supplier/entity LIST (one row per entity, add/remove,
// mirroring SupplierDependencyCheck.tsx's list pattern) so every entity IS
// a portfolio member from the moment it's added -- no separate step.
// Country + procurement context are asked up front, before any numeric
// input, so the ~40% of real cases that resolve to "not applicable" or
// "not yet sourced" short-circuit immediately instead of showing a blank
// input form first.
//
// Also fixed this pass: a real bilingual-completeness bug in the engine
// itself (assessSupplierLocalContent's reasonAr previously dropped the
// score value and spliced a raw English enum literal into Arabic sentences
// -- see supplierLocalContentEligibility.ts's PROCUREMENT_CONTEXT_LABEL_AR
// fix and its 6 new regression tests).
//
// Persistence: backend-sync-with-localStorage-fallback, mirroring
// SupplierDependencyCheck.tsx's pattern exactly (see that file's header for
// the full rationale) -- whole-list PUT to /api/local-content-icv-entries,
// localStorage remains the source of truth on fetch failure or for an
// unauthenticated visitor, never breaking the UI.
//
// v1 scope, still disclosed rather than silently omitted: no AI-narrative
// panel yet (LCGPAReadinessCheck.tsx's optional useAIPlan/AIPlanPanel
// integration is a natural fast-follow, not wired here to keep this pass
// focused and independently verifiable). Manual input, deterministic
// disclosed-rule scoring throughout (Decision Record 8.7 -- never an
// AI-invented score) -- the module refuses to guess where no sourced
// program applies, and that refusal is surfaced as a persistent, visible
// trust signal rather than buried in a footnote.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import {
  Globe2, Printer, Info, ShieldAlert, ShieldCheck, ShieldQuestion,
  ChevronDown, Plus, Trash2, ExternalLink, BookOpenCheck, Compass, Scale3D,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { Checkbox } from '@/components/ui/checkbox';
import { safeSetItem } from '@/lib/storage';
import {
  assessSupplierLocalContent, recommendLocalContentAction, rollUpPortfolioLocalContent,
  COUNTRY_FRAMEWORKS, SAUDI_PROGRAMS, SAUDI_PROGRAMS_LIST,
  type LocalContentCountry, type ProcurementContext, type SupplierLocalContentInputs,
  type LocalContentApplicability, type LocalContentAssessment, type PortfolioLocalContentInput,
  type SaudiProgram,
} from '@/lib/supplierLocalContentEligibility';
// Module 05 cross-reference (side-by-side callout only -- two independent
// dimensions, per Core Instruction / Rule 7, never blended into one
// fabricated composite). Both are small, pure, already-tested functions;
// this is page-level composition of two engines' outputs, not the engine
// importing from a sibling engine -- supplierLocalContentEligibility.ts
// itself has zero runtime imports from Module 05, same standalone-first
// discipline as ever.
import { computeHHI, bandForHHI, type ConcentrationBand } from '@/lib/supplierConcentration';

const STORAGE_KEY = 'isc-local-content-icv-v2';

type SaInputs = NonNullable<SupplierLocalContentInputs['sa']>;
type AeInputs = NonNullable<SupplierLocalContentInputs['ae']>;
type JoInputs = NonNullable<SupplierLocalContentInputs['jo']>;
type SaMandatoryListInputs = NonNullable<SupplierLocalContentInputs['saMandatoryList']>;
type SaPricePreferenceInputs = NonNullable<SupplierLocalContentInputs['saPricePreference']>;
type IktvaInputs = NonNullable<SupplierLocalContentInputs['iktva']>;

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
function emptySaMandatoryList(): SaMandatoryListInputs {
  return { inMandatoryListCategory: null, certifiedForCategory: null };
}
function emptySaPricePreference(): SaPricePreferenceInputs {
  return { bidValueLocallyManufacturedPct: null };
}
function emptyIktva(): IktvaInputs {
  return {
    goodsServicesLocalSAR: null, assetDepreciationLocalSAR: null, expatCompensationInSaudiSAR: null,
    saudiWorkforceCompensationSAR: null, trainingDevelopmentSAR: null, supplierDevelopmentSAR: null,
    localRnDSAR: null, totalCostsSAR: null, incentiveBonusPct: null,
  };
}

// 'OTHER' is a client-only pseudo-value for a supplier whose country is not
// one of the 7 this module's engine can represent at all (e.g. China,
// Turkey, Egypt) -- never passed to assessSupplierLocalContent, which only
// accepts a real LocalContentCountry. This is its own explicit UI state,
// distinct from 'insufficient-data' (a real program that's just not sourced
// yet) and 'not-applicable' (a real, sourced program that doesn't cover
// this buyer context) -- three different honest reasons for "no number",
// never collapsed into one.
type CountrySelection = LocalContentCountry | 'OTHER';

interface LocalContentEntry {
  id: string;
  label: string;
  countrySelection: CountrySelection;
  /** Only meaningful when countrySelection === 'SA' -- see SAUDI_PROGRAMS_LIST.
   * Defaults to 'lcgpa-general', the module's original single Saudi program. */
  program: SaudiProgram;
  context: ProcurementContext;
  spendSharePct: number | null;
  sa: SaInputs;
  saMandatoryList: SaMandatoryListInputs;
  saPricePreference: SaPricePreferenceInputs;
  iktva: IktvaInputs;
  ae: AeInputs;
  jo: JoInputs;
}

function newLocalContentEntry(): LocalContentEntry {
  return {
    id: `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    countrySelection: 'SA',
    program: 'lcgpa-general',
    context: 'government',
    spendSharePct: null,
    sa: emptySa(), saMandatoryList: emptySaMandatoryList(), saPricePreference: emptySaPricePreference(), iktva: emptyIktva(),
    ae: emptyAe(), jo: emptyJo(),
  };
}

interface PersistedState {
  entries: LocalContentEntry[];
  targetThresholdPct: number | null;
}

function defaultState(): PersistedState {
  return { entries: [newLocalContentEntry()], targetThresholdPct: null };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        return {
          entries: parsed.entries.map(e => ({
            id: e.id ?? newLocalContentEntry().id,
            label: e.label ?? '',
            countrySelection: e.countrySelection ?? 'SA',
            program: e.program ?? 'lcgpa-general',
            context: e.context ?? 'government',
            spendSharePct: e.spendSharePct ?? null,
            sa: { ...emptySa(), ...e.sa },
            saMandatoryList: { ...emptySaMandatoryList(), ...e.saMandatoryList },
            saPricePreference: { ...emptySaPricePreference(), ...e.saPricePreference },
            iktva: { ...emptyIktva(), ...e.iktva },
            ae: { ...emptyAe(), ...e.ae },
            jo: { ...emptyJo(), ...e.jo },
          })),
          targetThresholdPct: parsed.targetThresholdPct ?? null,
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

// Saudi Arabia routing question (task #115): which of the (now 6) Saudi
// mechanisms is this assessment for. Short bilingual labels for the button
// row; the full sourced methodology stays in the accordion below, keyed off
// SAUDI_PROGRAMS[program] automatically.
const SAUDI_PROGRAM_LABELS: Record<SaudiProgram, { en: string; ar: string }> = {
  'lcgpa-general': { en: 'LCGPA General Score', ar: 'الدرجة العامة (الهيئة)' },
  'mandatory-list': { en: 'Mandatory List Gate', ar: 'بوابة القائمة الإلزامية' },
  'price-preference': { en: 'Price Preference (10%)', ar: 'تفضيل السعر (١٠٪)' },
  'iktva-aramco': { en: 'Aramco IKTVA', ar: 'إكتفاء أرامكو' },
  'gami-defense': { en: 'GAMI Defense', ar: 'التوطين الدفاعي (GAMI)' },
  likt: { en: 'LIKT', ar: 'LIKT' },
};

// Pillar keys come straight off the engine's computation result (SA: labor/goodsServices/
// capacityBuilding/depreciation; AE: manufacturingOrThirdPartySpend/investment/emiratisation/
// expatriateContribution/bonus). QA pass finding (15 Sep 2026): these were being shown via a raw
// English regex fallback even in Arabic mode -- fixed by mapping every real key to a proper
// bilingual label (same English pillar names already used in LCGPAReadinessCheck.tsx's own
// pillarLabels map, for the two keys the two pages share).
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

// DOJ/FTC merger-guideline convention (same source Module 05 itself cites --
// see supplierConcentration.ts) -- bilingual labels for the 3 HHI bands,
// used only in this page's side-by-side concentration callout.
const CONCENTRATION_BAND_LABEL: Record<ConcentrationBand, { en: string; ar: string }> = {
  competitive: { en: 'Competitive', ar: 'تنافسي' },
  moderatelyConcentrated: { en: 'Moderately Concentrated', ar: 'تركّز متوسط' },
  highlyConcentrated: { en: 'Highly Concentrated', ar: 'تركّز عالٍ' },
};

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

/* ── Per-entry card (owns its own methodology-accordion state) ─────────── */

function LocalContentEntryCard({
  entry, isAr, targetThresholdPct, onUpdate, onRemove,
}: {
  entry: LocalContentEntry;
  isAr: boolean;
  targetThresholdPct: number | null;
  onUpdate: (id: string, patch: Partial<LocalContentEntry>) => void;
  onRemove: (id: string) => void;
}) {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const isOther = entry.countrySelection === 'OTHER';
  const isSA = entry.countrySelection === 'SA';
  const framework = !isOther
    ? (isSA ? SAUDI_PROGRAMS[entry.program] : COUNTRY_FRAMEWORKS[entry.countrySelection as LocalContentCountry])
    : null;
  const assessment: LocalContentAssessment | null = !isOther
    ? assessSupplierLocalContent(
        entry.countrySelection as LocalContentCountry, entry.context,
        { sa: entry.sa, ae: entry.ae, jo: entry.jo, saMandatoryList: entry.saMandatoryList, saPricePreference: entry.saPricePreference, iktva: entry.iktva },
        isSA ? entry.program : undefined,
      )
    : null;
  const style = assessment ? applicabilityStyle[assessment.applicability] : null;
  const recommendation = assessment ? recommendLocalContentAction(assessment, targetThresholdPct) : null;

  const hasMeaningfulResult = (() => {
    if (!assessment || !assessment.computation) return false;
    const c = assessment.computation;
    if (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score' || c.mechanismType === 'anchor-buyer-score') return c.scorePct !== null;
    if (c.mechanismType === 'price-preference-margin') return c.locallyManufacturedSharePct !== null;
    if (c.mechanismType === 'category-eligibility-gate') return c.eligibleToBid !== null;
    return false;
  })();

  return (
    <div className="print-zone-local-content-icv bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Print-only header */}
      <div className="hidden print:block pb-3 border-b border-gray-300">
        <p className="text-lg font-extrabold text-gray-900">
          {isAr ? '🌍 فحص أهلية المحتوى المحلي / ICV' : '🌍 Local Content / ICV Eligibility Check'}
        </p>
        <p className="text-sm font-semibold text-gray-700">{entry.label || (isAr ? 'بدون اسم' : 'Unnamed')}</p>
      </div>

      {/* ── Header: name + spend share + remove ── */}
      <div className="flex items-start gap-3">
        <input
          type="text"
          value={entry.label}
          onChange={e => onUpdate(entry.id, { label: e.target.value })}
          placeholder={isAr ? 'اسم المورّد أو الجهة' : 'Supplier or entity name'}
          className="flex-1 text-sm font-semibold border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#082C6B]"
        />
        <div className="w-28 shrink-0">
          <NumberField
            label={isAr ? 'حصة الإنفاق' : 'Spend Share'}
            unit="%"
            max={100}
            value={entry.spendSharePct}
            onChange={v => onUpdate(entry.id, { spendSharePct: v })}
          />
        </div>
        <button
          type="button"
          aria-label={isAr ? `إزالة ${entry.label || 'المورّد'}` : `Remove ${entry.label || 'supplier'}`}
          onClick={() => onRemove(entry.id)}
          className="no-print p-2 text-slate-300 hover:text-red-500 shrink-0 mt-5"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Step 1: Country + Context, up front, before any numeric input ── */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2" role="group" aria-label={isAr ? 'اختيار الدولة' : 'Select country'}>
          {COUNTRY_ORDER.map(c => {
            const active = entry.countrySelection === c;
            const fw = COUNTRY_FRAMEWORKS[c];
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => onUpdate(entry.id, { countrySelection: c })}
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
          <button
            type="button"
            aria-pressed={isOther}
            onClick={() => onUpdate(entry.id, { countrySelection: 'OTHER' })}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
              isOther ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            {isAr ? 'أخرى / غير مدرجة' : 'Other / not listed'}
          </button>
        </div>

        {/* ── Saudi Arabia routing question (task #115): which of the 6 Saudi
             mechanisms applies. Shown only for SA, before context/methodology,
             since it changes which framework and applicable contexts apply. ── */}
        {!isOther && isSA && (
          <div className="mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {isAr ? 'أي برنامج سعودي؟' : 'Which Saudi program?'}
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={isAr ? 'اختيار برنامج المحتوى المحلي السعودي' : 'Select Saudi local-content program'}>
              {SAUDI_PROGRAMS_LIST.map(p => {
                const active = entry.program === p;
                const notSourced = SAUDI_PROGRAMS[p].mechanismType === 'not-yet-sourced';
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      // QA fix (16 Sep 2026 pass): a program with exactly one sourced
                      // applicable context (e.g. Aramco IKTVA -> semi-government-soe
                      // only) auto-selects that context too, so picking the program
                      // doesn't silently leave the reader on a context where it reads
                      // "not applicable" for a reason they'd have to go hunting for.
                      // Multi-context programs (lcgpa-general, mandatory-list,
                      // price-preference) are left exactly as the reader set them.
                      const targetContexts = SAUDI_PROGRAMS[p].applicableContexts;
                      const patch: Partial<LocalContentEntry> = { program: p };
                      if (targetContexts.length === 1 && !targetContexts.includes(entry.context)) {
                        patch.context = targetContexts[0];
                      }
                      onUpdate(entry.id, patch);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      active ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? SAUDI_PROGRAM_LABELS[p].ar : SAUDI_PROGRAM_LABELS[p].en}
                    {notSourced && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>
                        {isAr ? 'غير موثّق' : 'not sourced'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isOther ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 flex items-start gap-2">
            <Compass className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {isAr
                ? 'هذه الوحدة تغطي حالياً سبع دول فقط: السعودية والإمارات والأردن (صيغ موثّقة قابلة للحساب) بالإضافة إلى عُمان وقطر والبحرين والكويت (برامج حقيقية لم تُوثَّق صيغتها بعد). أي دولة أخرى (مثل الصين أو تركيا أو مصر) غير قابلة للتمثيل في هذه المكتبة إطلاقاً -- لا يوجد فحص محتوى محلي متاح لها هنا، وليس درجة صفرية أو "غير مطبَّق".'
                : "This module currently covers only seven countries: Saudi Arabia, the UAE, and Jordan (sourced, computable formulas), plus Oman, Qatar, Bahrain, and Kuwait (real programs whose formula isn't sourced yet). Any other country (e.g. China, Turkey, Egypt) isn't representable by this library at all -- no local-content check is available for it here, and this is not a zero score or a \"not applicable\" verdict."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label={isAr ? 'اختيار سياق الشراء' : 'Select buyer context'}>
              {CONTEXT_TABS.map(ctx => {
                const active = entry.context === ctx.v;
                return (
                  <button
                    key={ctx.v}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdate(entry.id, { context: ctx.v })}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      active ? 'bg-[#C9A84C] border-[#C9A84C] text-[#082C6B]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? ctx.ar : ctx.en}
                  </button>
                );
              })}
            </div>

            {/* ── Sourced methodology (collapsible, keyboard-operable, never hover-only) ── */}
            <div className="border border-slate-100 rounded-xl mb-3">
              <button
                type="button"
                aria-expanded={methodologyOpen}
                onClick={() => setMethodologyOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpenCheck className="w-3.5 h-3.5 text-[#082C6B]" />
                  {isAr ? `المنهجية الموثّقة — ${framework!.programNameAr}` : `Sourced Methodology — ${framework!.programNameEn}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${methodologyOpen ? 'rotate-180' : ''}`} />
              </button>
              {methodologyOpen && (
                <p className="px-3 pb-3 text-[11px] text-muted-foreground leading-relaxed">
                  {isAr ? framework!.sourceNoteAr : framework!.sourceNoteEn}
                </p>
              )}
            </div>

            {/* ── Usage notes (lcgpa-general only): "how the same score gets used
                 differently by context" -- per the brief's own UAE precedent, this is
                 disclosure text about the score above, never a second score. ── */}
            {isSA && entry.program === 'lcgpa-general' && framework!.usageNotesEn && framework!.usageNotesEn!.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 mb-3 space-y-1.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {isAr ? 'كيف تُستخدم هذه الدرجة في التقييم' : 'How this score gets used in evaluation'}
                </p>
                {(isAr ? framework!.usageNotesAr! : framework!.usageNotesEn!).map((note, i) => (
                  <p key={i} className="text-[11px] text-slate-600 leading-relaxed">{note}</p>
                ))}
              </div>
            )}

            {/* ── Applicability read (always shown first -- context resolves this BEFORE any input form) ── */}
            {assessment && style && (
              <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${style.badge}`}>
                {style.icon}
                <p className="text-[11px]">{isAr ? assessment.reasonAr : assessment.reasonEn}</p>
              </div>
            )}

            {/* ── Step 2: input form -- ONLY once applicability resolves to 'applicable' ── */}
            {assessment?.applicability === 'applicable' && (
              <div className="mt-3">
                {entry.countrySelection === 'SA' && entry.program === 'lcgpa-general' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField label={isAr ? 'رواتب العمالة المحلية' : 'Local Labor Compensation'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.localLaborSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, localLaborSAR: v } })} />
                    <NumberField label={isAr ? 'رواتب العمالة الوافدة' : 'Expatriate Labor Compensation'} hint={isAr ? '٣٧٪ مؤهل' : '37% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.expatLaborSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, expatLaborSAR: v } })} />
                    <NumberField label={isAr ? 'إنفاق محلي على السلع والخدمات' : 'Local Goods & Services Spend'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.localGoodsServicesSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, localGoodsServicesSAR: v } })} />
                    <NumberField label={isAr ? 'إنفاق أجنبي على السلع والخدمات' : 'Foreign Goods & Services Spend'} hint={isAr ? '٠٪ مؤهل' : '0% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.foreignGoodsServicesSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, foreignGoodsServicesSAR: v } })} />
                    <NumberField label={isAr ? 'إنفاق بناء القدرات' : 'Capacity Building Spend'} hint={isAr ? '١٠٠٪ مؤهل' : '100% eligible'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.capacityBuildingSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, capacityBuildingSAR: v } })} />
                    <NumberField label={isAr ? 'إهلاك الأصول المحلية' : 'Local Asset Depreciation'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.localAssetDepreciationSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, localAssetDepreciationSAR: v } })} />
                    <NumberField label={isAr ? 'إجمالي إهلاك الأصول' : 'Total Asset Depreciation'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.sa.totalAssetDepreciationSAR} onChange={v => onUpdate(entry.id, { sa: { ...entry.sa, totalAssetDepreciationSAR: v } })} />
                  </div>
                )}

                {entry.countrySelection === 'SA' && entry.program === 'mandatory-list' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل هذه الفئة مدرجة في القائمة الإلزامية لهيئة المحتوى المحلي؟' : "Is this category on LCGPA's Mandatory List?"}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'الإدراج في القائمة الإلزامية' : 'Mandatory List membership'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.saMandatoryList.inMandatoryListCategory === v}
                            onClick={() => onUpdate(entry.id, { saMandatoryList: { ...entry.saMandatoryList, inMandatoryListCategory: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.saMandatoryList.inMandatoryListCategory === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                    </div>
                    {entry.saMandatoryList.inMandatoryListCategory === true && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'هل هذا المورّد معتمد من الهيئة لهذه الفئة؟' : 'Is this supplier LCGPA-certified for this category?'}
                        </p>
                        <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة الاعتماد' : 'Certification status'}>
                          {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={entry.saMandatoryList.certifiedForCategory === v}
                              onClick={() => onUpdate(entry.id, { saMandatoryList: { ...entry.saMandatoryList, certifiedForCategory: v } })}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                entry.saMandatoryList.certifiedForCategory === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {entry.countrySelection === 'SA' && entry.program === 'price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة القيمة المصنّعة محلياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                      hint={isAr ? `تفضيل السعر الأقصى ${SAUDI_PROGRAMS['price-preference'].programNameAr}: ١٠٪` : 'Maximum price preference margin: 10%'}
                      unit="%"
                      max={100}
                      value={entry.saPricePreference.bidValueLocallyManufacturedPct}
                      onChange={v => onUpdate(entry.id, { saPricePreference: { ...entry.saPricePreference, bidValueLocallyManufacturedPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'SA' && entry.program === 'iktva-aramco' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField label={isAr ? 'A: السلع/الخدمات المحلية' : 'A: Local Goods & Services'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.goodsServicesLocalSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, goodsServicesLocalSAR: v } })} />
                    <NumberField label={isAr ? 'A: إهلاك الأصول المحلية' : 'A: Local Asset Depreciation'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.assetDepreciationLocalSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, assetDepreciationLocalSAR: v } })} />
                    <NumberField label={isAr ? 'A: تعويضات العمالة الوافدة المقيمة في السعودية' : 'A: Saudi-Based Expatriate Compensation'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.expatCompensationInSaudiSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, expatCompensationInSaudiSAR: v } })} />
                    <NumberField label={isAr ? 'B: تعويضات القوى العاملة السعودية' : 'B: Saudi Workforce Compensation'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.saudiWorkforceCompensationSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, saudiWorkforceCompensationSAR: v } })} />
                    <NumberField label={isAr ? 'C: إنفاق التدريب والتطوير' : 'C: Training & Development Spend'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.trainingDevelopmentSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, trainingDevelopmentSAR: v } })} />
                    <NumberField label={isAr ? 'D: إنفاق تطوير الموردين' : 'D: Supplier Development Spend'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.supplierDevelopmentSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, supplierDevelopmentSAR: v } })} />
                    <NumberField label={isAr ? 'R: إنفاق البحث والتطوير المحلي' : 'R: Local R&D Spend'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.localRnDSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, localRnDSAR: v } })} />
                    <NumberField label={isAr ? 'E: إجمالي التكاليف (المقام)' : 'E: Total Costs (denominator)'} unit={isAr ? 'ر.س' : 'SAR'} value={entry.iktva.totalCostsSAR} onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, totalCostsSAR: v } })} />
                    <NumberField
                      label={isAr ? 'I: نقاط مكافأة تحفيزية (اختياري، مبسّطة)' : 'I: Incentive Bonus Points (optional, simplified)'}
                      hint={isAr ? 'حد أقصى ١٠ نقاط -- تبسيط مُفصَح عنه لصيغة أرامكو الفرعية الكاملة' : "Capped at 10 points -- disclosed simplification of Aramco's full bonus sub-formula"}
                      unit="pts" max={10}
                      value={entry.iktva.incentiveBonusPct}
                      onChange={v => onUpdate(entry.id, { iktva: { ...entry.iktva, incentiveBonusPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'AE' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField label={isAr ? 'الإنفاق على التصنيع/الطرف الثالث داخل الإمارات' : 'UAE-Based Manufacturing/Third-Party Spend'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.manufacturingOrThirdPartySpendLocalAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, manufacturingOrThirdPartySpendLocalAED: v } })} />
                    <NumberField label={isAr ? 'إجمالي إنفاق التصنيع/الطرف الثالث' : 'Total Manufacturing/Third-Party Spend'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.manufacturingOrThirdPartySpendTotalAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, manufacturingOrThirdPartySpendTotalAED: v } })} />
                    <NumberField label={isAr ? 'صافي القيمة الدفترية للأصول داخل الإمارات' : 'UAE-Based Asset Net Book Value'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.investmentNBVLocalAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, investmentNBVLocalAED: v } })} />
                    <NumberField label={isAr ? 'إجمالي صافي القيمة الدفترية للأصول' : 'Total Asset Net Book Value'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.investmentNBVTotalAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, investmentNBVTotalAED: v } })} />
                    <NumberField label={isAr ? 'الإنفاق السنوي على التوطين' : 'Emiratisation Annual Spend'} hint={isAr ? 'حدّ أدنى ٢٪ حتى ≥٢٠ مليون درهم = ١٥٪' : 'Floors at 2%, reaches 15% at >=AED 20M'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.emiratisationAnnualSpendAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, emiratisationAnnualSpendAED: v } })} />
                    <NumberField label={isAr ? 'عدد العمالة الوافدة' : 'Expatriate Headcount'} value={entry.ae.expatriateHeadcount} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, expatriateHeadcount: v } })} />
                    <NumberField label={isAr ? 'إيرادات التصدير (اختياري)' : 'Export Revenue (optional)'} unit={isAr ? 'د.إ' : 'AED'} value={entry.ae.exportRevenueAED} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, exportRevenueAED: v } })} />
                    <NumberField label={isAr ? 'نسبة نمو التوطين (اختياري)' : 'Emirati Headcount Growth % (optional)'} unit="%" max={100} value={entry.ae.emiratiHeadcountGrowthPct} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, emiratiHeadcountGrowthPct: v } })} />
                    <NumberField label={isAr ? 'نسبة نمو الاستثمار (اختياري)' : 'Investment Growth % (optional)'} unit="%" max={100} value={entry.ae.investmentGrowthPct} onChange={v => onUpdate(entry.id, { ae: { ...entry.ae, investmentGrowthPct: v } })} />
                    <label htmlFor={`ae-mainland-${entry.id}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
                      <Checkbox id={`ae-mainland-${entry.id}`} checked={entry.ae.registeredOnMainland === true} onCheckedChange={c => onUpdate(entry.id, { ae: { ...entry.ae, registeredOnMainland: c === true } })} />
                      {isAr ? 'مسجّلة في البر الرئيسي بالإمارات (حافز +١٠٪)' : 'Registered on UAE Mainland (+10% uplift)'}
                    </label>
                  </div>
                )}

                {entry.countrySelection === 'JO' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة القيمة المصنّعة محلياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                      hint={isAr ? `تفضيل السعر الأقصى ${COUNTRY_FRAMEWORKS.JO.programNameAr}: ٢٠٪` : 'Maximum price preference margin: 20%'}
                      unit="%"
                      max={100}
                      value={entry.jo.bidValueLocallyManufacturedPct}
                      onChange={v => onUpdate(entry.id, { jo: { ...entry.jo, bidValueLocallyManufacturedPct: v } })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Result: score, pillar breakdown (always visible, never click-to-reveal), certification caveat (persistent footnote, never hover) ── */}
            {assessment?.applicability === 'applicable' && assessment.computation && hasMeaningfulResult && (
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
                {assessment.computation.mechanismType === 'category-eligibility-gate' && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'أهلية التقديم' : 'Bid Eligibility'}
                      </span>
                      <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
                        assessment.computation.eligibleToBid === true ? 'bg-emerald-100 text-emerald-700'
                          : assessment.computation.eligibleToBid === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {assessment.computation.eligibleToBid === true ? (isAr ? 'مؤهل' : 'Eligible')
                          : assessment.computation.eligibleToBid === false ? (isAr ? 'مستبعد' : 'Gated out') : (isAr ? 'غير مكتمل' : 'Incomplete')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {isAr
                        ? `في القائمة الإلزامية: ${assessment.computation.inMandatoryListCategory === true ? 'نعم' : assessment.computation.inMandatoryListCategory === false ? 'لا' : 'غير محدد'} — معتمد للفئة: ${assessment.computation.certifiedForCategory === true ? 'نعم' : assessment.computation.certifiedForCategory === false ? 'لا' : 'غير محدد'}`
                        : `On Mandatory List: ${assessment.computation.inMandatoryListCategory === true ? 'Yes' : assessment.computation.inMandatoryListCategory === false ? 'No' : 'Unknown'} — Certified for category: ${assessment.computation.certifiedForCategory === true ? 'Yes' : assessment.computation.certifiedForCategory === false ? 'No' : 'Unknown'}`}
                    </p>
                  </>
                )}
                {assessment.computation.mechanismType === 'anchor-buyer-score' && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'الدرجة التوجيهية (إكتفاء)' : 'Directional Score (iktva)'}
                      </span>
                      <span className="text-2xl font-black text-[#082C6B]">
                        {assessment.computation.scorePct !== null ? `${assessment.computation.scorePct.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {assessment.computation.components.map(comp => (
                        <div key={comp.key} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{isAr ? comp.noteAr : comp.noteEn}</span>
                          <span className="font-semibold">{comp.amountSAR.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {assessment.computation.incentiveBonusPct !== null && assessment.computation.incentiveBonusPct > 0 && (
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        {isAr ? `+ مكافأة تحفيزية ${assessment.computation.incentiveBonusPct} نقطة (مبسّطة)` : `+ Incentive bonus ${assessment.computation.incentiveBonusPct} pts (simplified)`}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {assessment?.applicability === 'applicable' && assessment.computation && !hasMeaningfulResult && (
              <p className="mt-3 text-[10px] text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {isAr ? 'أدخل الأرقام أعلاه لعرض النتيجة.' : 'Enter the figures above to see the result.'}
              </p>
            )}

            {assessment?.applicability === 'applicable' && (
              <p className="mt-2 text-[10px] text-muted-foreground">{isAr ? assessment.certificationCaveatAr : assessment.certificationCaveatEn}</p>
            )}

            {/* ── Recommendation: two visually distinct cards, never one card with a caveat bolted on (Rule 8) ── */}
            {recommendation && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2.5">
                  <p className="text-[10px] font-black text-sky-800 uppercase tracking-wider mb-1">{isAr ? '✓ التوصية الأساسية' : '✓ Primary Recommendation'}</p>
                  <p className="text-[11px] text-sky-900 leading-relaxed">{isAr ? recommendation.primaryAr : recommendation.primaryEn}</p>
                </div>
                <div className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">{isAr ? '⇄ البديل القوي' : '⇄ Strong Alternative'}</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{isAr ? recommendation.alternativeAr : recommendation.alternativeEn}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function LocalContentICVCheck() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const today = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-GB');

  const [state, setState] = useState<PersistedState>(loadState);

  // ── Server sync -- mirrors SupplierDependencyCheck.tsx's sync block
  // exactly (see that file's header for the full rationale): whole-list
  // PUT, localStorage remains source of truth on fetch failure, an
  // unauthenticated visitor gets the unchanged local-only experience.
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const serverLoadedForUserId = useRef<number | null>(null);
  const bootstrapSettled = useRef(false);
  const localWinsDuringBootstrap = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entriesRef = useRef<LocalContentEntry[]>(state.entries);
  entriesRef.current = state.entries;

  interface ServerEntryRow { id: number; clientKey: string; name: string; data: LocalContentEntry; updatedAt: string; }
  function serverRowToEntry(row: ServerEntryRow): LocalContentEntry {
    return { ...row.data, id: row.clientKey, label: row.name };
  }
  function entryToPayload(e: LocalContentEntry) {
    return { clientKey: e.id, name: e.label, data: e };
  }

  const syncToServerImmediate = (list: LocalContentEntry[]) => {
    if (!user) return;
    setSyncStatus('saving');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/local-content-icv-entries`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: list.map(entryToPayload) }),
        });
        setSyncStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSyncStatus('idle'), 2500);
      } catch {
        setSyncStatus('error');
      }
    }, 400);
  };
  const syncToServer = (list: LocalContentEntry[]) => {
    if (!user) return;
    if (!bootstrapSettled.current) { localWinsDuringBootstrap.current = true; return; }
    syncToServerImmediate(list);
  };

  const persist = useCallback((next: PersistedState) => {
    setState(next);
    safeSetItem(STORAGE_KEY, JSON.stringify(next));
    syncToServer(next.entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (serverLoadedForUserId.current !== null) {
        serverLoadedForUserId.current = null;
        bootstrapSettled.current = false;
        localWinsDuringBootstrap.current = false;
        setSyncStatus('idle');
      }
      return;
    }
    if (serverLoadedForUserId.current === user.id) return;
    serverLoadedForUserId.current = user.id;
    bootstrapSettled.current = false;
    localWinsDuringBootstrap.current = false;
    const bootstrapUserId = user.id;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/local-content-icv-entries`, { credentials: 'include' });
        if (serverLoadedForUserId.current !== bootstrapUserId) return;
        if (res.ok) {
          const data = await res.json() as { ok: boolean; entries: ServerEntryRow[] };
          if (data.ok && Array.isArray(data.entries) && data.entries.length > 0) {
            if (!localWinsDuringBootstrap.current) {
              const converted = data.entries.map(serverRowToEntry);
              setState(s => ({ ...s, entries: converted }));
              safeSetItem(STORAGE_KEY, JSON.stringify({ ...loadState(), entries: converted }));
            }
          } else if (!localWinsDuringBootstrap.current) {
            const current = entriesRef.current;
            if (current && current.length > 0) syncToServerImmediate(current);
          }
        }
      } catch { /* offline -- localStorage keeps working */ }
      bootstrapSettled.current = true;
      if (localWinsDuringBootstrap.current) {
        const current = entriesRef.current;
        if (current) syncToServerImmediate(current);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addEntry = () => persist({ ...state, entries: [...state.entries, newLocalContentEntry()] });
  const removeEntry = (id: string) => persist({ ...state, entries: state.entries.length > 1 ? state.entries.filter(e => e.id !== id) : [newLocalContentEntry()] });
  const updateEntry = (id: string, patch: Partial<LocalContentEntry>) =>
    persist({ ...state, entries: state.entries.map(e => e.id === id ? { ...e, ...patch } : e) });

  // ── Portfolio rollup (every entry IS a portfolio member -- no separate
  // "add to portfolio" step; Rule 7: grouped, spend-weighted, never
  // averaged across incompatible mechanisms) ──
  const assessableEntries = state.entries
    .filter(e => e.countrySelection !== 'OTHER')
    .map(e => ({
      entry: e,
      assessment: assessSupplierLocalContent(
        e.countrySelection as LocalContentCountry, e.context,
        { sa: e.sa, ae: e.ae, jo: e.jo, saMandatoryList: e.saMandatoryList, saPricePreference: e.saPricePreference, iktva: e.iktva },
        e.countrySelection === 'SA' ? e.program : undefined,
      ),
    }));
  const otherCountryEntries = state.entries.filter(e => e.countrySelection === 'OTHER');

  const rollupInputs: PortfolioLocalContentInput[] = assessableEntries.map(({ entry, assessment }) => ({
    supplierId: entry.id,
    spendShare: entry.spendSharePct ?? 0,
    assessment,
  }));
  const portfolioRollup = rollUpPortfolioLocalContent(rollupInputs);

  const applicableCount = assessableEntries.filter(x => x.assessment.applicability === 'applicable').length;
  const notApplicableCount = assessableEntries.filter(x => x.assessment.applicability === 'not-applicable').length;
  const insufficientDataCount = assessableEntries.filter(x => x.assessment.applicability === 'insufficient-data').length;

  // ── Module 05 side-by-side concentration callout (two independent
  // dimensions -- Rule 7: never blended into this page's local-content
  // rollup). Gated at >=2 spend-bearing entries so a single-entity "100%
  // concentrated" read never gets shown as if it meant something. ──
  const spendShares = state.entries.map(e => e.spendSharePct).filter((v): v is number => v !== null && v > 0);
  const showConcentrationCallout = spendShares.length >= 2;
  const hhi = showConcentrationCallout ? computeHHI(spendShares) : null;
  const hhiBand = hhi !== null ? bandForHHI(hhi) : null;
  const spendShareSum = spendShares.reduce((s, v) => s + v, 0);

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
              ? 'المحتوى المحلي ليس معياراً إقليمياً واحداً -- إنه ثلاث آليات مختلفة جوهرياً: درجة نسبة مئوية معتمدة في السعودية (LCGPA)، درجة مرجحة متعددة الأركان في الإمارات (ICV)، وتفضيل سعري في العطاءات بالأردن. سمِّ كل مورّد، اختر الدولة وسياق الشراء، واحصل على قراءة أهلية صادقة فوراً.'
              : "Local content isn't one regional standard -- it's three genuinely different mechanisms: a certified percentage score in Saudi Arabia (LCGPA), a weighted multi-pillar score in the UAE (ICV), and a bid-evaluation price preference in Jordan. Name each supplier, pick the country and buyer context, and get an honest applicability read immediately."}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/60 mb-4">
            {(isAr
              ? ['إدخال يدوي', 'صيغ رسمية موثّقة لكل دولة', 'تفريق حكومي / خاص صريح', 'مستوى المورّد + مستوى المحفظة', 'عربي / إنجليزي']
              : ['Manual Input', 'Sourced Official Formulas Per Country', 'Explicit Government/Private Split', 'Entity Level + Portfolio Level', 'Arabic / English']
            ).map(t => (
              <span key={t} className="px-3 py-1 rounded-full border border-white/20 bg-white/5">{t}</span>
            ))}
          </div>
          {/* Persistent trust-signal line -- the module's real credibility feature made visible, not buried. */}
          <div className="flex items-start gap-2 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-2.5 max-w-2xl mb-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
            <p className="text-xs text-white/90 leading-relaxed">
              {isAr
                ? 'تُعرض نتيجة هنا فقط عندما ينطبق برنامج حكومي حقيقي وموثّق -- نحن لا نقدّر رقماً حيث لا يوجد واحد.'
                : "A result only appears here when a real, sourced government program applies -- we don't estimate one where there isn't."}
            </p>
          </div>
          <Link href="/lcgpa-readiness" className="no-print mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A84C] hover:text-white transition-colors">
            {isAr ? 'تبحث فقط عن فحص السعودية الذاتي لإنفاقك الخاص؟ افتح أداة جاهزية LCGPA' : "Only need Saudi Arabia's own-spend self-check? Open the LCGPA Readiness tool"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        {/* ── Toolbar ── */}
        <div className="no-print flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={addEntry}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#082C6B] rounded-lg px-4 py-2 hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة مورّد / جهة' : 'Add a supplier / entity'}
            </button>
            {user && syncStatus !== 'idle' && (
              <span className="text-[11px] text-muted-foreground">
                {syncStatus === 'saving' ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
                  : syncStatus === 'saved' ? (isAr ? 'تم الحفظ' : 'Saved')
                  : (isAr ? 'تعذّر الحفظ (محفوظ محلياً)' : 'Save failed (kept locally)')}
              </span>
            )}
          </div>
          <button
            onClick={() => printZone('local-content-icv')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title={isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'تصدير PDF' : 'Export PDF'}
          </button>
        </div>

        {/* ── Target threshold (shared across every entry's recommendation) + sourced-threshold-library note ── */}
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="sm:w-64">
            <NumberField
              label={isAr ? 'الحد المستهدف للمناقصة (اختياري)' : 'Target Tender Threshold (optional)'}
              unit="%"
              max={100}
              value={state.targetThresholdPct}
              onChange={v => persist({ ...state, targetThresholdPct: v })}
              placeholder="%"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            {isAr
              ? <>لا توجد مكتبة حدود دنيا موثّقة في هذه الوحدة بعد -- أدخل حد مناقصتك المذكور هنا. الفحص الذاتي الخاص بالسعودية (<Link href="/lcgpa-readiness" className="underline font-semibold">/lcgpa-readiness</Link>) يحتوي جدول حدود قطاعية موثّق صغير لثلاثة قطاعات (إدارة المرافق الشاملة، الاستشارات، خدمات تقنية المعلومات) -- راجعه إن كان قطاعك مطابقاً.</>
              : <>No sourced threshold library exists in this module yet -- enter your tender's own stated requirement above. Saudi Arabia's dedicated self-check (<Link href="/lcgpa-readiness" className="underline font-semibold">/lcgpa-readiness</Link>) has a small sourced sector-threshold table for 3 sectors (Hard Facility Management, Consulting, IT Services) -- check there if your sector matches.</>}
          </p>
        </div>

        {/* ── Supplier / entity list ── */}
        <div className="space-y-3">
          {state.entries.map(entry => (
            <LocalContentEntryCard
              key={entry.id}
              entry={entry}
              isAr={isAr}
              targetThresholdPct={state.targetThresholdPct}
              onUpdate={updateEntry}
              onRemove={removeEntry}
            />
          ))}
        </div>

        {/* ── Portfolio rollup ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-black text-slate-800 mb-1">
            {isAr ? 'نظرة المحفظة على مستوى العميل' : 'Client-Level Portfolio View'}
          </h2>
          <p className="text-[11px] text-muted-foreground mb-3">
            {isAr
              ? 'مُجمَّعة حسب الدولة وسياق الشراء وآلية المحتوى المحلي، مرجحة بحصة الإنفاق -- لا يُدمَج مطلقاً بين آليات مختلفة في رقم واحد.'
              : 'Grouped by country, buyer context, and local-content mechanism, spend-weighted -- never averaged across different mechanisms into one number.'}
          </p>

          <p className="text-[11px] text-slate-600 mb-3">
            {isAr
              ? `${state.entries.length} مورّداً/جهة مُدخلة — ${applicableCount} قابل للتقييم، ${notApplicableCount} لا ينطبق، ${insufficientDataCount} غير موثّق بعد${otherCountryEntries.length > 0 ? `، ${otherCountryEntries.length} دولة غير مغطاة بهذه الوحدة إطلاقاً` : ''}.`
              : `${state.entries.length} supplier(s)/entity(ies) entered — ${applicableCount} assessed, ${notApplicableCount} not applicable, ${insufficientDataCount} not yet sourced${otherCountryEntries.length > 0 ? `, ${otherCountryEntries.length} whose country isn't covered by this module at all` : ''}.`}
          </p>

          {portfolioRollup.length > 0 ? (
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
                    <tr key={`${g.country}-${g.program ?? ''}-${g.procurementContext}-${i}`} className="border-b border-slate-100">
                      <td className="py-1.5 pe-3 font-semibold text-slate-700">
                        <span aria-hidden="true">{COUNTRY_FLAG[g.country]}</span>{' '}
                        {g.country === 'SA' && g.program
                          ? (isAr ? SAUDI_PROGRAM_LABELS[g.program].ar : SAUDI_PROGRAM_LABELS[g.program].en)
                          : (isAr ? COUNTRY_FRAMEWORKS[g.country].countryNameAr : COUNTRY_FRAMEWORKS[g.country].countryNameEn)}
                        <span className="text-slate-400 font-normal"> — {isAr ? CONTEXT_TABS.find(c => c.v === g.procurementContext)?.ar : CONTEXT_TABS.find(c => c.v === g.procurementContext)?.en}</span>
                      </td>
                      <td className="py-1.5 pe-3 text-slate-600">
                        {g.supplierCount}
                        {(g.suppliersWithInsufficientData > 0 || g.suppliersNotApplicable > 0) && (
                          <span className="text-slate-400">
                            {' '}({g.suppliersNotApplicable > 0 ? (isAr ? `${g.suppliersNotApplicable} لا ينطبق` : `${g.suppliersNotApplicable} n/a`) : ''}
                            {g.suppliersWithInsufficientData > 0 ? (isAr ? ` ${g.suppliersWithInsufficientData} غير موثّق` : ` ${g.suppliersWithInsufficientData} not sourced`) : ''})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pe-3 text-slate-600">{g.portfolioSpendSharePct.toFixed(0)}%</td>
                      <td className="py-1.5 pe-3 font-bold text-[#082C6B]">
                        {g.weightedScorePct !== null ? `${g.weightedScorePct.toFixed(1)}%`
                          : g.weightedEffectiveDiscountPct !== null ? `${g.weightedEffectiveDiscountPct.toFixed(1)} pts`
                          : g.gateEligibleSharePct !== null ? (isAr ? `${g.gateEligibleSharePct.toFixed(0)}٪ مؤهل` : `${g.gateEligibleSharePct.toFixed(0)}% eligible`)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {isAr ? 'لا توجد مجموعات محفظة بعد -- كل الموردين المُدخلين إما بلا دولة مُختارة أو خارج نطاق هذه المكتبة.' : 'No portfolio groups yet -- every entered supplier is either uncountried or outside this library’s scope.'}
            </p>
          )}

          {/* ── Module 05 side-by-side concentration callout -- a genuinely separate dimension, never blended into the local-content rollup above. ── */}
          {showConcentrationCallout && hhi !== null && hhiBand !== null && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3 flex items-start gap-2.5">
                <Scale3D className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-indigo-900 mb-0.5">
                    {isAr ? 'بُعد منفصل: تركّز المحفظة (الوحدة ٠٥)' : 'Separate dimension: portfolio concentration (Module 05)'}
                  </p>
                  <p className="text-[11px] text-indigo-800">
                    {isAr
                      ? `مؤشر HHI = ${hhi.toFixed(0)} (${CONCENTRATION_BAND_LABEL[hhiBand].ar}) -- بناءً على حصص الإنفاق نفسها المُدخلة أعلاه. هذا مقياس منفصل تماماً عن أهلية المحتوى المحلي ولا يُدمَج معها أبداً في رقم واحد.`
                      : `HHI = ${hhi.toFixed(0)} (${CONCENTRATION_BAND_LABEL[hhiBand].en}) -- based on the same spend shares entered above. This is a fully separate measure from local-content eligibility and is never blended with it into one number.`}
                  </p>
                  {Math.abs(spendShareSum - 100) > 5 && (
                    <p className="text-[10px] text-indigo-700/80 mt-1">
                      {isAr
                        ? `ملاحظة: تجمع حصص الإنفاق المُدخلة إلى ${spendShareSum.toFixed(0)}٪ فقط -- هذه القراءة تفترض أن الحصص المُدخلة تمثّل كامل قاعدة الإنفاق ذات الصلة.`
                        : `Note: the entered spend shares sum to only ${spendShareSum.toFixed(0)}% -- this reading assumes the entered shares represent the full relevant spend base.`}
                    </p>
                  )}
                </div>
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
