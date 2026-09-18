// src/pages/LocalContentICVCheck.tsx
//
// SI Module 08 UI -- Local Content / ICV Eligibility Check (15 Sep 2026,
// rebuilt 15 Sep 2026 per an independent senior-QA review run against
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
// "add to portfolio" step. The 15 Sep 2026 QA review found this was the
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
  COUNTRY_FRAMEWORKS, PROGRAMS, PROGRAMS_BY_COUNTRY, DEFAULT_PROGRAM_BY_COUNTRY,
  TAWAZUN_OFFSET_THRESHOLD_AED, actionableNextStepForSabicLcGate, SABIC_LC_DEVIATION_TOLERANCE_PCT,
  type LocalContentCountry, type ProcurementContext, type SupplierLocalContentInputs,
  type LocalContentApplicability, type LocalContentAssessment, type PortfolioLocalContentInput,
  type LocalContentProgram, type LocalContentMechanismType, type CommitmentDeviationGateResult,
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
type AeTawazunInputs = NonNullable<SupplierLocalContentInputs['aeTawazun']>;
type JoContractorQuotaInputs = NonNullable<SupplierLocalContentInputs['joContractorQuota']>;
type OmMandatoryListInputs = NonNullable<SupplierLocalContentInputs['omMandatoryList']>;
type OmOqPricePreferenceInputs = NonNullable<SupplierLocalContentInputs['omOqPricePreference']>;
type QaInputs = NonNullable<SupplierLocalContentInputs['qa']>;
type BhSmeInputs = NonNullable<SupplierLocalContentInputs['bhSme']>;
type KwLocalSpendInputs = NonNullable<SupplierLocalContentInputs['kwLocalSpend']>;
type EgInputs = NonNullable<SupplierLocalContentInputs['eg']>;
type EgOilGasInputs = NonNullable<SupplierLocalContentInputs['egOilGas']>;
type TrInputs = NonNullable<SupplierLocalContentInputs['tr']>;
type UkInputs = NonNullable<SupplierLocalContentInputs['uk']>;
type UsaInputs = NonNullable<SupplierLocalContentInputs['usa']>;
type UsaBabaInputs = NonNullable<SupplierLocalContentInputs['usaBaba']>;
type CnInputs = NonNullable<SupplierLocalContentInputs['cn']>;
type CnSmeInputs = NonNullable<SupplierLocalContentInputs['cnSme']>;
type RawafedStcInputs = NonNullable<SupplierLocalContentInputs['rawafedStc']>;
type SabicLcCommitmentInputs = NonNullable<SupplierLocalContentInputs['sabicLcCommitment']>;

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
function emptyAeTawazun(): AeTawazunInputs {
  return { contractValueAED: null, offsetCreditsEarnedAED: null };
}
function emptyJoContractorQuota(): JoContractorQuotaInputs {
  return { isRegisteredJordanianContractor: null };
}
function emptyOmMandatoryList(): OmMandatoryListInputs {
  return { inMandatoryListCategory: null, certifiedForCategory: null };
}
function emptyOmOqPricePreference(): OmOqPricePreferenceInputs {
  return { bidValueLocallyManufacturedPct: null };
}
function emptyQa(): QaInputs {
  return {
    localTangibleGoodsMaterialsQAR: null, localServicesQAR: null,
    qatariNationalResidentTrainingCostQAR: null, supplierTrainingCertificationCostQAR: null,
    qatarAssetDepreciationQAR: null, totalQatarRevenueExclExportsQAR: null,
    isEligibleManufacturer: null, isMicroOrSmallSupplier: null, selfReportedBonusPct: null,
  };
}
function emptyBhSme(): BhSmeInputs {
  return { qualifiesAsSme: null };
}
function emptyKwLocalSpend(): KwLocalSpendInputs {
  return { isRegisteredKuwaitiSupplier: null };
}
function emptyEg(): EgInputs {
  return { egyptianContentSharePct: null };
}
function emptyEgOilGas(): EgOilGasInputs {
  return { isLocalEgyptianContractor: null };
}
function emptyTr(): TrInputs {
  return { bidValueDomesticCertifiedPct: null };
}
function emptyUk(): UkInputs {
  return { isBelowThresholdReservedProcurement: null, isQualifyingUkGeographySupplier: null };
}
function emptyUsa(): UsaInputs {
  return { domesticContentSharePct: null, isSmallBusinessConcern: null };
}
function emptyUsaBaba(): UsaBabaInputs {
  return { isFederallyFundedInfrastructureProcurement: null, meetsBabaDomesticContentRequirement: null };
}
function emptyCn(): CnInputs {
  return { meetsDomesticProductCriteria: null, bundleDomesticCostSharePct: null, article10ExemptionApplies: null };
}
function emptyCnSme(): CnSmeInputs {
  return { supplierRole: null, procurementType: null, consortiumSmallEnterpriseSubcontractSharePct: null };
}
function emptyRawafedStc(): RawafedStcInputs {
  return {
    localGoodsServicesSAR: null, totalGoodsServicesSAR: null,
    localSalariesSAR: null, totalSalariesSAR: null,
    localAssetDepreciationSAR: null, totalAssetDepreciationSAR: null,
    localCapacityDevelopmentSAR: null, totalCapacityDevelopmentSAR: null,
  };
}
function emptySabicLcCommitment(): SabicLcCommitmentInputs {
  return { proposedTargetPct: null, actualAuditedPct: null };
}

// Old (pre-16-Sep-2026-generalization) Saudi-only program keys, still
// possibly sitting in a returning user's localStorage/server row from
// before this pass -- migrated to their new 'sa-'-prefixed
// LocalContentProgram keys so an existing user's saved entry doesn't
// silently break (framework/country mismatch) on first load after this
// deploy. Never guessed -- a straight 1:1 rename of the exact 6 old keys.
const LEGACY_SA_PROGRAM_MIGRATION: Record<string, LocalContentProgram> = {
  'lcgpa-general': 'sa-lcgpa-general',
  'mandatory-list': 'sa-mandatory-list',
  'price-preference': 'sa-price-preference',
  'iktva-aramco': 'sa-iktva-aramco',
  'gami-defense': 'sa-gami-defense',
  likt: 'sa-likt',
};

/** Resolves a possibly-stale/legacy/missing program value against the
 * entry's CURRENT country selection -- never trusts a persisted program
 * value that doesn't actually belong to that country (the real bug this
 * guards against: switching countrySelection without also resetting
 * program would otherwise leave `framework` and `assessment` reading a
 * different country's methodology than the one displayed). */
function normalizeProgram(raw: unknown, countrySelection: CountrySelection): LocalContentProgram {
  const country = countrySelection === 'OTHER' ? null : (countrySelection as LocalContentCountry);
  const fallback: LocalContentProgram = country ? DEFAULT_PROGRAM_BY_COUNTRY[country] : 'sa-lcgpa-general';
  if (typeof raw !== 'string') return fallback;
  const migrated = LEGACY_SA_PROGRAM_MIGRATION[raw] ?? (raw as LocalContentProgram);
  if (country && PROGRAMS_BY_COUNTRY[country].includes(migrated)) return migrated;
  return fallback;
}

// 'OTHER' is a client-only pseudo-value for a supplier whose country is not
// one of the 12 this module's engine can represent at all (e.g. Germany,
// India) -- Egypt, then Turkey, then the UK moved from this "not yet
// representable" list to a real LocalContentCountry across the 15-16 Sep
// 2026 Part 2 pass, then the USA, then China moved from this "not yet
// representable" list across the 16 Sep 2026 Part 2 continuation, the same
// growth pattern documented for it in the engine file's own header. The UK
// is a different kind of addition, though: it has no above-threshold price
// preference at all (a structural PA23 s.90 non-discrimination fact, not a
// research gap) -- only a below-threshold reservation gate, PPN 005 -- so
// it is representable, but not with the same mechanism shape as every
// GCC/Jordan/Egypt/Turkey country before it.
// 'OTHER' is never passed to assessSupplierLocalContent, which only
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
  /** Always resolved to a program valid for the current countrySelection --
   * see PROGRAMS_BY_COUNTRY and normalizeProgram(). Defaults to
   * DEFAULT_PROGRAM_BY_COUNTRY[country], each country's own original single
   * pre-existing mechanism. Every country now has more than one program
   * (15 Sep 2026 continuation), so every country shows the routing-question
   * button row -- each entry still always carries a program value (its
   * default when the reader hasn't chosen otherwise). */
  program: LocalContentProgram;
  context: ProcurementContext;
  spendSharePct: number | null;
  sa: SaInputs;
  saMandatoryList: SaMandatoryListInputs;
  saPricePreference: SaPricePreferenceInputs;
  iktva: IktvaInputs;
  ae: AeInputs;
  aeTawazun: AeTawazunInputs;
  jo: JoInputs;
  joContractorQuota: JoContractorQuotaInputs;
  omMandatoryList: OmMandatoryListInputs;
  omOqPricePreference: OmOqPricePreferenceInputs;
  qa: QaInputs;
  bhSme: BhSmeInputs;
  kwLocalSpend: KwLocalSpendInputs;
  eg: EgInputs;
  egOilGas: EgOilGasInputs;
  tr: TrInputs;
  uk: UkInputs;
  usa: UsaInputs;
  usaBaba: UsaBabaInputs;
  cn: CnInputs;
  cnSme: CnSmeInputs;
  rawafedStc: RawafedStcInputs;
  sabicLcCommitment: SabicLcCommitmentInputs;
}

function newLocalContentEntry(): LocalContentEntry {
  return {
    id: `lc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    countrySelection: 'SA',
    program: DEFAULT_PROGRAM_BY_COUNTRY.SA,
    context: 'government',
    spendSharePct: null,
    sa: emptySa(), saMandatoryList: emptySaMandatoryList(), saPricePreference: emptySaPricePreference(), iktva: emptyIktva(),
    ae: emptyAe(), aeTawazun: emptyAeTawazun(), jo: emptyJo(),
    joContractorQuota: emptyJoContractorQuota(), omMandatoryList: emptyOmMandatoryList(), omOqPricePreference: emptyOmOqPricePreference(),
    qa: emptyQa(), bhSme: emptyBhSme(), kwLocalSpend: emptyKwLocalSpend(),
    eg: emptyEg(), egOilGas: emptyEgOilGas(), tr: emptyTr(), uk: emptyUk(),
    usa: emptyUsa(), usaBaba: emptyUsaBaba(), cn: emptyCn(), cnSme: emptyCnSme(),
    rawafedStc: emptyRawafedStc(), sabicLcCommitment: emptySabicLcCommitment(),
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
            program: normalizeProgram(e.program, e.countrySelection ?? 'SA'),
            context: e.context ?? 'government',
            spendSharePct: e.spendSharePct ?? null,
            sa: { ...emptySa(), ...e.sa },
            saMandatoryList: { ...emptySaMandatoryList(), ...e.saMandatoryList },
            saPricePreference: { ...emptySaPricePreference(), ...e.saPricePreference },
            iktva: { ...emptyIktva(), ...e.iktva },
            ae: { ...emptyAe(), ...e.ae },
            aeTawazun: { ...emptyAeTawazun(), ...e.aeTawazun },
            jo: { ...emptyJo(), ...e.jo },
            joContractorQuota: { ...emptyJoContractorQuota(), ...e.joContractorQuota },
            omMandatoryList: { ...emptyOmMandatoryList(), ...e.omMandatoryList },
            omOqPricePreference: { ...emptyOmOqPricePreference(), ...e.omOqPricePreference },
            qa: { ...emptyQa(), ...e.qa },
            bhSme: { ...emptyBhSme(), ...e.bhSme },
            kwLocalSpend: { ...emptyKwLocalSpend(), ...e.kwLocalSpend },
            eg: { ...emptyEg(), ...e.eg },
            egOilGas: { ...emptyEgOilGas(), ...e.egOilGas },
            tr: { ...emptyTr(), ...e.tr },
            uk: { ...emptyUk(), ...e.uk },
            usa: { ...emptyUsa(), ...e.usa },
            usaBaba: { ...emptyUsaBaba(), ...e.usaBaba },
            cn: { ...emptyCn(), ...e.cn },
            cnSme: { ...emptyCnSme(), ...e.cnSme },
            rawafedStc: { ...emptyRawafedStc(), ...e.rawafedStc },
            sabicLcCommitment: { ...emptySabicLcCommitment(), ...e.sabicLcCommitment },
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

const COUNTRY_ORDER: LocalContentCountry[] = ['SA', 'AE', 'JO', 'OM', 'QA', 'BH', 'KW', 'EG', 'TR', 'UK', 'USA', 'CN', 'IN', 'DE', 'JP', 'KR'];
const COUNTRY_FLAG: Record<LocalContentCountry, string> = { SA: '🇸🇦', AE: '🇦🇪', JO: '🇯🇴', OM: '🇴🇲', QA: '🇶🇦', BH: '🇧🇭', KW: '🇰🇼', EG: '🇪🇬', TR: '🇹🇷', UK: '🇬🇧', USA: '🇺🇸', CN: '🇨🇳', IN: '🇮🇳', DE: '🇩🇪', JP: '🇯🇵', KR: '🇰🇷' };

const CONTEXT_TABS: { v: ProcurementContext; en: string; ar: string }[] = [
  { v: 'government', en: 'Government', ar: 'حكومي' },
  { v: 'semi-government-soe', en: 'Semi-Government / SOE', ar: 'شبه حكومي / مملوك للدولة' },
  { v: 'private-commercial', en: 'Private Commercial', ar: 'تجاري خاص' },
];

// Program routing question (task #115, generalized 15 Sep 2026 from SA-only
// to any country with more than one program -- since 15 Sep 2026 that is
// every one of the 10 countries, and since 16 Sep 2026 the USA too, so 11
// total): which mechanism is this assessment for.
// Short bilingual labels for the
// button row and the portfolio table; the full sourced methodology stays in
// the accordion below, keyed off PROGRAMS[program] automatically. Every
// LocalContentProgram key gets a label (not just the multi-program
// countries') so the portfolio table can show a program-aware group label
// for any country uniformly, not just SA.
const PROGRAM_LABELS: Record<LocalContentProgram, { en: string; ar: string }> = {
  'sa-lcgpa-general': { en: 'LCGPA General Score', ar: 'الدرجة العامة (الهيئة)' },
  'sa-mandatory-list': { en: 'Mandatory List Gate', ar: 'بوابة القائمة الإلزامية' },
  'sa-price-preference': { en: 'Price Preference (10%)', ar: 'تفضيل السعر (١٠٪)' },
  'sa-iktva-aramco': { en: 'Aramco IKTVA', ar: 'إكتفاء أرامكو' },
  'sa-gami-defense': { en: 'GAMI Defense', ar: 'التوطين الدفاعي (GAMI)' },
  'sa-likt': { en: 'LIKT', ar: 'LIKT' },
  'sa-rawafed-stc': { en: 'stc Rawafed', ar: 'روافد (STC)' },
  'sa-sabic-lc-commitment': { en: 'SABIC Commitment Gate', ar: 'بوابة التزام سابك' },
  'sa-tharwah-maaden': { en: "Ma'aden Tharwah (not sourced)", ar: 'ثروة (معادن) — غير موثّق' },
  'ae-icv-general': { en: 'National ICV Score', ar: 'الدرجة الوطنية لـICV' },
  'ae-tawazun-offset': { en: 'Tawazun Offset', ar: 'مقاصة توازن' },
  'jo-price-preference': { en: 'Price Preference (20%)', ar: 'تفضيل السعر (٢٠٪)' },
  'jo-contractor-quota': { en: 'Contractor Quota (35%)', ar: 'حصة المقاولين (٣٥٪)' },
  'om-icv': { en: 'ICV (not sourced)', ar: 'ICV (غير موثّق)' },
  'om-mandatory-list': { en: 'PTLC Mandatory List Gate', ar: 'بوابة القائمة الإلزامية (PTLC)' },
  'om-oq-price-preference': { en: 'OQ Price Preference (10%)', ar: 'تفضيل سعر OQ (١٠٪)' },
  'qa-national-strategy': { en: 'National Strategy (not sourced)', ar: 'الاستراتيجية الوطنية (غير موثّقة)' },
  'qa-icv-tawteen': { en: 'Tawteen / ICV (icv.qa)', ar: 'توطين / ICV (icv.qa)' },
  'bh-local-content': { en: 'Local Content (not sourced)', ar: 'المحتوى المحلي (غير موثّق)' },
  'bh-sme-price-preference': { en: 'SME Price Preference (10%)', ar: 'تفضيل سعر المنشآت الصغيرة والمتوسطة (١٠٪)' },
  'bh-sme-spend-setaside': { en: 'SME Spend Set-Aside (20%)', ar: 'تخصيص إنفاق للمنشآت الصغيرة والمتوسطة (٢٠٪)' },
  'kw-local-content': { en: 'Local Content (not sourced)', ar: 'المحتوى المحلي (غير موثّق)' },
  'kw-kpc-local-spend': { en: 'KPC Local Spend Target (30%)', ar: 'هدف إنفاق KPC المحلي (٣٠٪)' },
  'eg-price-preference': { en: 'Price Preference (15%)', ar: 'تفضيل السعر (١٥٪)' },
  'eg-oil-gas-price-preference': { en: 'Oil & Gas PSA Preference (10%)', ar: 'تفضيل اتفاقية تقاسم الإنتاج النفطية (١٠٪)' },
  'eg-auto-local-content': { en: 'Automotive Local Content (not sourced)', ar: 'المحتوى المحلي لصناعة السيارات (غير موثّق)' },
  'tr-price-preference': { en: 'Domestic Goods Price Preference (up to 15%)', ar: 'تفضيل سعر السلع المحلية (حتى ١٥٪)' },
  'tr-defense-offset': { en: 'SSB Defense Offset (not sourced)', ar: 'تعويض SSB الدفاعي (غير موثّق)' },
  'uk-below-threshold-reservation': { en: 'Below-Threshold Reservation (PPN 005)', ar: 'تخصيص دون العتبة (PPN 005)' },
  'usa-buy-american-price-preference': { en: 'Buy American Act Preference', ar: 'تفضيل قانون الشراء الأمريكي' },
  'usa-baba-infrastructure-gate': { en: 'BABA Infrastructure Gate', ar: 'بوابة BABA للبنية التحتية' },
  'usa-sba-small-business-setaside': { en: 'SBA Small Business Set-Aside', ar: 'تخصيص المنشآت الصغيرة (SBA)' },
  'usa-berry-amendment-dod': { en: 'Berry Amendment (DoD) -- not yet sourced', ar: 'تعديل بيري (وزارة الدفاع) — غير موثّق بعد' },
  'cn-domestic-product-price-preference': { en: 'Domestic Product Price Preference (20%)', ar: 'تفضيل سعر المنتج المحلي (٢٠٪)' },
  'cn-govt-procurement-law-domestic-mandate': { en: 'Article 10 Domestic Mandate Gate', ar: 'بوابة تفويض المادة العاشرة' },
  'cn-sme-price-deduction': { en: 'SME Price Deduction', ar: 'خصم سعر المنشآت الصغيرة' },
  'cn-defense-domestic-sourcing': { en: 'PLA Defense Sourcing -- not yet sourced', ar: 'مشتريات الدفاع (جيش التحرير الشعبي) — غير موثّق بعد' },
  'in-make-in-india-price-preference': { en: 'Make in India Preference (20%)', ar: 'تفضيل صنع في الهند (٢٠٪)' },
  'in-dap-2020-defense-offset': { en: 'DAP 2020 Defense Offset -- not yet sourced', ar: 'تعويض الدفاع DAP 2020 — غير موثّق بعد' },
  'de-eu-gpa-non-discrimination-baseline': { en: 'No Local-Content Preference -- confirmed absent', ar: 'لا يوجد تفضيل للمحتوى المحلي — غياب مؤكَّد' },
  'de-edip-defense-local-content': { en: 'EDIP EU-Content Threshold -- not yet sourced', ar: 'عتبة محتوى EDIP الأوروبي — غير موثّق بعد' },
  'jp-kankoju-sme-target-ratio': { en: 'Kankouju SME Target Ratio', ar: 'نسبة استهداف كانكوجو للمنشآت الصغيرة والمتوسطة' },
  'kr-sme-purchase-target-ratio': { en: 'SME Purchase Target Ratio (50% / 15%)', ar: 'نسبة استهداف شراء المنشآت الصغيرة والمتوسطة (٥٠٪ / ١٥٪)' },
  'kr-sme-competitive-products-gate': { en: 'SME Competitive Products Gate', ar: 'بوابة المنتجات التنافسية للمنشآت الصغيرة والمتوسطة' },
};

// Dual-sided (buyer + supplier) value framing, per mechanism TYPE (not per
// program -- 7 real mechanism shapes, not 13 country-specific programs) --
// explicit instruction (15 Sep 2026): "every mechanism ... carries an
// explicit buyer-side and supplier-side value reading, not just a
// compliance number", applied retroactively to Saudi Arabia's own live UI
// too, not only new UAE work or the worked-example doc's Section 8/9. Built
// entirely from facts already sourced and disclosed elsewhere in this file
// (mechanismType semantics, applicableContexts, the recommendation logic's
// own primary/alternative shape) -- no new claim or statistic introduced,
// same Decision Record 8.7 discipline as the rest of the module. Omitted
// for 'not-yet-sourced' -- there is no real mechanism yet to frame value
// around, and inventing one would violate the same rule this exists to
// serve.
const MECHANISM_VALUE_FRAMING: Partial<Record<LocalContentMechanismType, { buyerEn: string; buyerAr: string; supplierEn: string; supplierAr: string }>> = {
  'eligible-spend-ratio': {
    buyerEn: 'Verifiable assurance that spend genuinely reaches the local economy (real labor, goods & services, capacity-building) -- not a paper promise.',
    buyerAr: 'ضمان قابل للتحقق بأن الإنفاق يصل فعلياً إلى الاقتصاد المحلي (عمالة، سلع وخدمات، بناء قدرات حقيقية) -- وليس وعداً على الورق.',
    supplierEn: 'A transparent, improvable score: each pillar shows exactly where to invest next to raise it, rather than a single opaque pass/fail number.',
    supplierAr: 'درجة شفافة وقابلة للتحسين: يوضّح كل ركن أين يجب الاستثمار تحديداً لرفعها، بدلاً من رقم نجاح/فشل واحد غامض.',
  },
  'weighted-pillar-score': {
    buyerEn: 'A single certified score usable directly in tender evaluation weighting, cutting the due-diligence cost of assessing each bidder\'s real local footprint.',
    buyerAr: 'درجة معتمدة واحدة قابلة للاستخدام مباشرة في ترجيح تقييم العطاءات، ما يقلّل تكلفة التحقق من الأثر المحلي الحقيقي لكل مقدّم عطاء.',
    supplierEn: 'Certification becomes a reusable competitive asset (14-month validity) that narrows the evaluated price gap against foreign competitors across every tender it applies to, not just one.',
    supplierAr: 'تتحول الشهادة إلى أصل تنافسي قابل لإعادة الاستخدام (صلاحية ١٤ شهراً) يقلّص فجوة السعر المُقيَّمة أمام المنافسين الأجانب في كل مناقصة تنطبق عليها، وليس في مناقصة واحدة فقط.',
  },
  'price-preference-margin': {
    buyerEn: 'Keeps national industrial capacity competitive for public spend without a hard quota -- the market still decides, with a disclosed thumb on the scale.',
    buyerAr: 'يحافظ على تنافسية الصناعة الوطنية في الإنفاق العام دون فرض حصة إلزامية -- يظل السوق هو الفيصل، مع ترجيح مُعلَن وواضح.',
    supplierEn: 'A quantifiable price cushion: increasing the locally-manufactured share of a bid converts directly into a larger, calculable competitive discount.',
    supplierAr: 'وسادة سعرية قابلة للقياس: زيادة الحصة المصنّعة محلياً في العطاء تتحول مباشرة إلى خصم تنافسي أكبر وقابل للحساب.',
  },
  'category-eligibility-gate': {
    buyerEn: 'Removes negotiation entirely for strategic categories -- certainty of local sourcing by design, not by hoping a price preference is enough to win the bid.',
    buyerAr: 'يزيل التفاوض تماماً في الفئات الاستراتيجية -- يقين بالتوريد المحلي بالتصميم، لا بالأمل في أن يكون التفضيل السعري كافياً للفوز بالعطاء.',
    supplierEn: 'Certification in a gated category is a genuine moat: uncertified competitors, local or foreign, cannot bid at all -- not just at a disadvantage.',
    supplierAr: 'الاعتماد في فئة مشمولة بالبوابة يمثّل ميزة تنافسية حقيقية: لا يمكن للمنافسين غير المعتمدين، محليين كانوا أم أجانب، التقديم إطلاقاً -- وليس فقط التنافس بوضع أضعف.',
  },
  'anchor-buyer-score': {
    buyerEn: 'A single anchor-buyer program pulls supplier investment, training, and R&D spend into the country at a scale broader than what government procurement rules alone can mandate.',
    buyerAr: 'برنامج مشترٍ رئيسي واحد يجذب استثمارات الموردين وإنفاقهم على التدريب والبحث والتطوير إلى الداخل بحجم يتجاوز ما تستطيع أنظمة المشتريات الحكومية وحدها فرضه.',
    supplierEn: 'Five distinct, separately-improvable levers count toward the same score -- workforce development and R&D investment score just as much as pure local purchasing, widening the paths to a higher number.',
    supplierAr: 'خمسة روافع مستقلة وقابلة للتحسين كل على حدة تُحتسب ضمن الدرجة نفسها -- يُحتسب تطوير القوى العاملة والاستثمار في البحث والتطوير بقدر الشراء المحلي البحت، ما يوسّع مسارات رفع الدرجة.',
  },
  'offset-obligation-gate': {
    buyerEn: 'Converts a portion of defense spend into real in-country economic activity (investment, JV, technology transfer) or a cash/guarantee-backed shortfall payment -- value is captured either way, never simply lost to a foreign contractor.',
    buyerAr: 'يحوّل جزءاً من الإنفاق الدفاعي إلى نشاط اقتصادي محلي حقيقي (استثمار، مشروع مشترك، نقل تقني) أو دفعة تعويض مدعومة نقداً/ضماناً عند النقص -- تُستحصَل القيمة في الحالتين، ولا تُفقَد ببساطة لمقاول أجنبي.',
    supplierEn: 'Banking real offset credits early (investment, JV, tech transfer) avoids the 8.5% cash/guarantee cost -- a supplier who plans offset activity from day one turns a compliance obligation into a genuine local partnership, not a penalty to absorb at the end.',
    supplierAr: 'اكتساب ائتمانات مقاصة حقيقية مبكراً (استثمار، مشروع مشترك، نقل تقني) يتجنب تكلفة ٨.٥٪ النقدية/الضمانية -- المورّد الذي يخطط لنشاط المقاصة منذ اليوم الأول يحوّل التزام الامتثال إلى شراكة محلية حقيقية، لا غرامة يتحملها في النهاية.',
  },
  'spend-set-aside-target': {
    buyerEn: 'Guarantees a real, measurable share of spend reaches the reserved supplier class (SMEs, national contractors) without policing every individual award -- the target share itself does the enforcement.',
    buyerAr: 'يضمن وصول حصة حقيقية وقابلة للقياس من الإنفاق إلى فئة الموردين المخصصة (المنشآت الصغيرة والمتوسطة، المقاولون الوطنيون) دون الحاجة لمراقبة كل قرار ترسية على حدة -- فالحصة المستهدفة نفسها تفرض التنفيذ.',
    supplierEn: 'Once qualified, this supplier competes within a smaller, reserved pool instead of the full open market -- qualification itself is the lever, not incremental spend or score-building.',
    supplierAr: 'بعد التأهل، يتنافس هذا المورّد ضمن مجموعة أصغر ومخصصة بدلاً من السوق المفتوح بالكامل -- التأهل نفسه هو الرافعة، وليس زيادة الإنفاق أو بناء الدرجة تدريجياً.',
  },
  'modified-icv-score': {
    buyerEn: "A single official score (icv.qa) usable directly in bid evaluation, with real, disclosed modifiers (manufacturer boost, small-supplier floor) that reward the specific behaviors Qatar's strategy wants without inventing a new methodology.",
    buyerAr: 'درجة رسمية واحدة (icv.qa) قابلة للاستخدام مباشرة في تقييم العطاءات، مع معدِّلات حقيقية ومُفصَح عنها (مكافأة المصنّعين، حد أدنى للموردين الصغار) تكافئ السلوكيات التي تستهدفها استراتيجية قطر دون ابتكار منهجية جديدة.',
    supplierEn: "Multiple real levers raise this score beyond raw spend: eligible-manufacturer status applies a 50% boost, and genuinely small/micro suppliers get a guaranteed 30% floor regardless of spend data -- both are policy facts worth checking before assuming a gap requires new spend.",
    supplierAr: 'توجد عدة روافع حقيقية لرفع هذه الدرجة إلى جانب الإنفاق وحده: صفة "المصنّع المؤهل" تمنح مكافأة ٥٠٪، ويحصل الموردون متناهو الصغر/الصغار فعلياً على حد أدنى مضمون ٣٠٪ بغض النظر عن بيانات الإنفاق -- وكلاهما حقيقة سياسية تستحق التحقق منها قبل افتراض أن سد الفجوة يتطلب إنفاقاً جديداً.',
  },
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
  localTangibleGoodsMaterials: { en: 'Local Tangible Goods & Materials', ar: 'السلع والمواد المحلية الملموسة' },
  localServices: { en: 'Local Services', ar: 'الخدمات المحلية' },
  qatariNationalResidentTraining: { en: 'Qatari National/Resident Training', ar: 'تدريب المواطنين والمقيمين القطريين' },
  supplierTrainingCertification: { en: 'Supplier Training & Certification', ar: 'تدريب واعتماد الموردين' },
  qatarAssetDepreciation: { en: 'Qatar Asset Depreciation', ar: 'إهلاك الأصول في قطر' },
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
  // Generalized 15 Sep 2026 from an SA-only check, then again the same day
  // (15 Sep 2026) when the 5-country continuation gave every remaining country
  // a second program: any country whose PROGRAMS_BY_COUNTRY list has more than
  // one entry gets the routing question row below (as of 15 Sep 2026, that is
  // all 12 countries, as of the 15-16 Sep 2026 Egypt/Turkey/UK Part-2 additions,
  // plus the 16 Sep 2026 USA Part-2 continuation, and the same-day China
  // Part-2 continuation).
  const hasMultiplePrograms = !isOther && PROGRAMS_BY_COUNTRY[entry.countrySelection as LocalContentCountry].length > 1;
  const framework = !isOther ? PROGRAMS[entry.program] : null;
  const assessment: LocalContentAssessment | null = !isOther
    ? assessSupplierLocalContent(
        entry.countrySelection as LocalContentCountry, entry.context,
        { sa: entry.sa, ae: entry.ae, jo: entry.jo, saMandatoryList: entry.saMandatoryList, saPricePreference: entry.saPricePreference, iktva: entry.iktva, aeTawazun: entry.aeTawazun, joContractorQuota: entry.joContractorQuota, omMandatoryList: entry.omMandatoryList, omOqPricePreference: entry.omOqPricePreference, qa: entry.qa, bhSme: entry.bhSme, kwLocalSpend: entry.kwLocalSpend, eg: entry.eg, egOilGas: entry.egOilGas, tr: entry.tr, uk: entry.uk, usa: entry.usa, usaBaba: entry.usaBaba, cn: entry.cn, cnSme: entry.cnSme, rawafedStc: entry.rawafedStc, sabicLcCommitment: entry.sabicLcCommitment },
        entry.program,
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
    if (c.mechanismType === 'offset-obligation-gate') return c.triggersObligation !== null;
    if (c.mechanismType === 'spend-set-aside-target') return c.qualifiesForSetAside !== null;
    if (c.mechanismType === 'modified-icv-score') return c.finalScorePct !== null;
    if (c.mechanismType === 'commitment-deviation-gate') return c.withinTolerance !== null;
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
                onClick={() => onUpdate(entry.id, {
                  countrySelection: c,
                  // REAL DEFECT AVOIDED (15 Sep 2026 QA pass, generalization):
                  // switching country without resetting program would leave
                  // `framework`/`assessment` reading a DIFFERENT country's
                  // methodology than the one just selected (e.g. still showing
                  // Aramco IKTVA's Saudi framework after switching to AE).
                  // Always reset to the new country's own default program.
                  program: DEFAULT_PROGRAM_BY_COUNTRY[c],
                })}
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

        {/* ── Program routing question (task #115; generalized 15 Sep 2026 from
             SA-only to any country with more than one program -- since
             15 Sep 2026 that is every one of the 10 countries, as of the
             15-16 Sep 2026 Egypt/Turkey/UK Part-2 additions, and all 11 as of
             the 16 Sep 2026 USA Part-2 continuation). Shown before
             context/methodology, since it changes which framework and
             applicable contexts apply. ── */}
        {hasMultiplePrograms && (
          <div className="mb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {isAr
                ? `أي برنامج في ${COUNTRY_FRAMEWORKS[entry.countrySelection as LocalContentCountry].countryNameAr}؟`
                : `Which ${COUNTRY_FRAMEWORKS[entry.countrySelection as LocalContentCountry].countryNameEn} program?`}
            </p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={isAr ? 'اختيار برنامج المحتوى المحلي' : 'Select local-content program'}>
              {PROGRAMS_BY_COUNTRY[entry.countrySelection as LocalContentCountry].map(p => {
                const active = entry.program === p;
                const notSourced = PROGRAMS[p].mechanismType === 'not-yet-sourced';
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      // QA fix (15 Sep 2026 pass, generalized): a program with
                      // exactly one sourced applicable context (e.g. Aramco IKTVA
                      // -> semi-government-soe only; Tawazun -> government only)
                      // auto-selects that context too, so picking the program
                      // doesn't silently leave the reader on a context where it reads
                      // "not applicable" for a reason they'd have to go hunting for.
                      // Multi-context programs (lcgpa-general, mandatory-list,
                      // price-preference, ae-icv-general) are left exactly as the
                      // reader set them.
                      const targetContexts = PROGRAMS[p].applicableContexts;
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
                    {isAr ? PROGRAM_LABELS[p].ar : PROGRAM_LABELS[p].en}
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
                ? 'هذه الوحدة تغطي حالياً ستّ عشرة دولة فقط: السعودية والإمارات والأردن وعُمان وقطر والبحرين والكويت ومصر وتركيا والمملكة المتحدة والولايات المتحدة والصين والهند وألمانيا واليابان وكوريا الجنوبية، ولكل منها برنامج واحد أو أكثر بصيغة موثّقة قابلة للحساب أو إفصاح صادق موثّق (ألمانيا حالة خاصة: كلا برنامجيها "غير موثّق" -- الأول لأنه غياب مؤكَّد للتفضيل بموجب قواعد الاتحاد الأوروبي ومنظمة التجارة العالمية، والثاني لأن برنامج EDIP الأوروبي بوابة تمويل فوق وطنية وليس تفضيلاً مدنياً لكل عطاء؛ يُعرض ذلك صراحة عند اختياره، لا كدرجة صفرية). أي دولة أخرى (مثل فرنسا أو البرازيل) غير قابلة للتمثيل في هذه المكتبة إطلاقاً -- لا يوجد فحص محتوى محلي متاح لها هنا، وليس درجة صفرية أو "غير مطبَّق".'
                : "This module currently covers only sixteen countries: Saudi Arabia, the UAE, Jordan, Oman, Qatar, Bahrain, Kuwait, Egypt, Turkey, the UK, the USA, China, India, Germany, Japan, and South Korea, each with one or more sourced, computable-formula programs or an honestly-sourced disclosure (Germany is a special case: BOTH of its programs are not-yet-sourced -- one because it's a confirmed absence of any preference under EU/WTO non-discrimination rules, the other because the EU's EDIP program is a supra-national funding gate, not a per-bid civil preference; disclosed explicitly when selected, not shown as a zero score). Any other country (e.g. France or Brazil) isn't representable by this library at all -- no local-content check is available for it here, and this is not a zero score or a \"not applicable\" verdict."}
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

            {/* ── Dual-sided value framing (buyer + supplier), every country including
                 SA -- explicit instruction (15 Sep 2026): a compliance number alone is
                 not enough; every mechanism must show who benefits and how, on both
                 sides of the transaction. Keyed by mechanism TYPE, so it's automatic
                 for every current and future program, not hand-added per country. ── */}
            {framework && MECHANISM_VALUE_FRAMING[framework.mechanismType] && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 mb-3 grid sm:grid-cols-2 gap-2.5">
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">
                    {isAr ? 'القيمة للمشتري' : 'Value for the Buyer'}
                  </p>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    {isAr ? MECHANISM_VALUE_FRAMING[framework.mechanismType]!.buyerAr : MECHANISM_VALUE_FRAMING[framework.mechanismType]!.buyerEn}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">
                    {isAr ? 'القيمة للمورّد' : 'Value for the Supplier'}
                  </p>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    {isAr ? MECHANISM_VALUE_FRAMING[framework.mechanismType]!.supplierAr : MECHANISM_VALUE_FRAMING[framework.mechanismType]!.supplierEn}
                  </p>
                </div>
              </div>
            )}

            {/* ── Usage notes (any program that has them -- today sa-lcgpa-general
                 and ae-icv-general): "how the same score gets used differently by
                 context" -- per the brief's own UAE precedent, this is disclosure
                 text about the score above, never a second score. Generalized
                 15 Sep 2026 from an sa-lcgpa-general-only condition so AE's real
                 sourced Abu Dhabi ADLC 40%-weighting note surfaces here too. ── */}
            {framework && framework.usageNotesEn && framework.usageNotesEn.length > 0 && (
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
                {entry.countrySelection === 'SA' && entry.program === 'sa-lcgpa-general' && (
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

                {entry.countrySelection === 'SA' && entry.program === 'sa-mandatory-list' && (
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

                {entry.countrySelection === 'SA' && entry.program === 'sa-price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة القيمة المصنّعة محلياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                      hint={isAr ? `تفضيل السعر الأقصى ${PROGRAMS['sa-price-preference'].programNameAr}: ١٠٪` : 'Maximum price preference margin: 10%'}
                      unit="%"
                      max={100}
                      value={entry.saPricePreference.bidValueLocallyManufacturedPct}
                      onChange={v => onUpdate(entry.id, { saPricePreference: { ...entry.saPricePreference, bidValueLocallyManufacturedPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'SA' && entry.program === 'sa-iktva-aramco' && (
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

                {entry.countrySelection === 'AE' && entry.program === 'ae-icv-general' && (
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

                {entry.countrySelection === 'AE' && entry.program === 'ae-tawazun-offset' && (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <NumberField
                        label={isAr ? 'قيمة العقد الدفاعي' : 'Defense Contract Value'}
                        hint={isAr ? `عتبة الالتزام: ${TAWAZUN_OFFSET_THRESHOLD_AED.toLocaleString()} درهم (≈ ١٠ ملايين دولار)` : `Obligation threshold: AED ${TAWAZUN_OFFSET_THRESHOLD_AED.toLocaleString()} (≈ USD 10M)`}
                        unit={isAr ? 'د.إ' : 'AED'}
                        value={entry.aeTawazun.contractValueAED}
                        onChange={v => onUpdate(entry.id, { aeTawazun: { ...entry.aeTawazun, contractValueAED: v } })}
                      />
                      <NumberField
                        label={isAr ? 'ائتمانات المقاصة المكتسبة حتى الآن (اختياري)' : 'Offset Credits Earned So Far (optional)'}
                        hint={isAr ? 'اتركه فارغاً إذا كان غير معروف بعد -- يبقى النقص غير معروف، وليس صفراً' : 'Leave blank if not yet known -- shortfall stays unknown, not zero'}
                        unit={isAr ? 'د.إ' : 'AED'}
                        value={entry.aeTawazun.offsetCreditsEarnedAED}
                        onChange={v => onUpdate(entry.id, { aeTawazun: { ...entry.aeTawazun, offsetCreditsEarnedAED: v } })}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      {isAr
                        ? 'يتطلب البرنامج ائتمانات مقاصة تعادل ٦٠٪ من قيمة العقد؛ أي نقص عند نهاية فترة الأداء يُسوَّى بنسبة ٨.٥٪ نقداً أو عبر ضمان بنكي.'
                        : 'The program requires offset credits equal to 60% of contract value; any shortfall at period end settles at 8.5%, cash or via bank guarantee.'}
                    </p>
                  </div>
                )}

                {entry.countrySelection === 'JO' && entry.program === 'jo-price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة القيمة المصنّعة محلياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                      hint={isAr ? `تفضيل السعر الأقصى ${PROGRAMS['jo-price-preference'].programNameAr}: ٢٠٪` : 'Maximum price preference margin: 20%'}
                      unit="%"
                      max={100}
                      value={entry.jo.bidValueLocallyManufacturedPct}
                      onChange={v => onUpdate(entry.id, { jo: { ...entry.jo, bidValueLocallyManufacturedPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'JO' && entry.program === 'jo-contractor-quota' && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isAr ? 'هل هذا المورّد مقاول أردني مسجّل رسمياً؟' : 'Is this supplier a registered Jordanian contractor?'}
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة التسجيل كمقاول أردني' : 'Jordanian-contractor registration status'}>
                      {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={entry.joContractorQuota.isRegisteredJordanianContractor === v}
                          onClick={() => onUpdate(entry.id, { joContractorQuota: { ...entry.joContractorQuota, isRegisteredJordanianContractor: v } })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            entry.joContractorQuota.isRegisteredJordanianContractor === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {entry.countrySelection === 'OM' && entry.program === 'om-mandatory-list' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل هذه الفئة مدرجة في القائمة الإلزامية لهيئة المناقصات والمشتريات العامة والمحتوى المحلي؟' : "Is this category on PTLC's Mandatory List?"}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'الإدراج في القائمة الإلزامية' : 'Mandatory List membership'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.omMandatoryList.inMandatoryListCategory === v}
                            onClick={() => onUpdate(entry.id, { omMandatoryList: { ...entry.omMandatoryList, inMandatoryListCategory: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.omMandatoryList.inMandatoryListCategory === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                    </div>
                    {entry.omMandatoryList.inMandatoryListCategory === true && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'هل هذا المورّد معتمد لهذه الفئة؟' : 'Is this supplier certified for this category?'}
                        </p>
                        <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة الاعتماد' : 'Certification status'}>
                          {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={entry.omMandatoryList.certifiedForCategory === v}
                              onClick={() => onUpdate(entry.id, { omMandatoryList: { ...entry.omMandatoryList, certifiedForCategory: v } })}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                entry.omMandatoryList.certifiedForCategory === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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

                {entry.countrySelection === 'OM' && entry.program === 'om-oq-price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة القيمة المصنّعة عُمانياً من قيمة العطاء' : 'Locally-Manufactured Share of Bid Value'}
                      hint={isAr ? `تفضيل السعر الأقصى ${PROGRAMS['om-oq-price-preference'].programNameAr}: ١٠٪` : 'Maximum price preference margin: 10%'}
                      unit="%"
                      max={100}
                      value={entry.omOqPricePreference.bidValueLocallyManufacturedPct}
                      onChange={v => onUpdate(entry.id, { omOqPricePreference: { ...entry.omOqPricePreference, bidValueLocallyManufacturedPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'QA' && entry.program === 'qa-icv-tawteen' && (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <NumberField label={isAr ? 'السلع والمواد المحلية الملموسة' : 'Local Tangible Goods & Materials'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.localTangibleGoodsMaterialsQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, localTangibleGoodsMaterialsQAR: v } })} />
                      <NumberField label={isAr ? 'الخدمات المحلية' : 'Local Services'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.localServicesQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, localServicesQAR: v } })} />
                      <NumberField label={isAr ? 'تكلفة تدريب المواطنين/المقيمين القطريين' : 'Qatari National/Resident Training Cost'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.qatariNationalResidentTrainingCostQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, qatariNationalResidentTrainingCostQAR: v } })} />
                      <NumberField label={isAr ? 'تكلفة تدريب واعتماد الموردين' : 'Supplier Training & Certification Cost'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.supplierTrainingCertificationCostQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, supplierTrainingCertificationCostQAR: v } })} />
                      <NumberField label={isAr ? 'إهلاك الأصول في قطر' : 'Qatar Asset Depreciation'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.qatarAssetDepreciationQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, qatarAssetDepreciationQAR: v } })} />
                      <NumberField label={isAr ? 'إجمالي إيرادات قطر (باستثناء الصادرات)' : 'Total Qatar Revenue (excl. exports)'} unit={isAr ? 'ر.ق' : 'QAR'} value={entry.qa.totalQatarRevenueExclExportsQAR} onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, totalQatarRevenueExclExportsQAR: v } })} />
                      <NumberField
                        label={isAr ? 'مكافأة سلوك استراتيجي ذاتية (اختياري، مبسّطة)' : 'Self-Reported Strategic-Behaviour Bonus (optional, simplified)'}
                        hint={isAr ? 'حد أقصى ١٥٪ -- تبسيط مُفصَح عنه لمعايير icv.qa الفرعية الكاملة' : "Capped at 15% -- disclosed simplification of icv.qa's full sub-criteria"}
                        unit="%" max={15}
                        value={entry.qa.selfReportedBonusPct}
                        onChange={v => onUpdate(entry.id, { qa: { ...entry.qa, selfReportedBonusPct: v } })}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label htmlFor={`qa-manufacturer-${entry.id}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Checkbox id={`qa-manufacturer-${entry.id}`} checked={entry.qa.isEligibleManufacturer === true} onCheckedChange={c => onUpdate(entry.id, { qa: { ...entry.qa, isEligibleManufacturer: c === true } })} />
                        {isAr ? 'مصنّع مؤهل بموجب سياسة ICV+ (مكافأة +٥٠٪)' : 'Eligible manufacturer under ICV+ policy (+50% boost)'}
                      </label>
                      <label htmlFor={`qa-microsmall-${entry.id}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Checkbox id={`qa-microsmall-${entry.id}`} checked={entry.qa.isMicroOrSmallSupplier === true} onCheckedChange={c => onUpdate(entry.id, { qa: { ...entry.qa, isMicroOrSmallSupplier: c === true } })} />
                        {isAr ? 'مورّد متناهي الصغر أو صغير (حد أدنى مضمون ٣٠٪)' : 'Micro or small supplier (guaranteed 30% floor)'}
                      </label>
                    </div>
                  </div>
                )}

                {entry.countrySelection === 'BH' && (entry.program === 'bh-sme-price-preference' || entry.program === 'bh-sme-spend-setaside') && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isAr ? 'هل يستوفي هذا المورّد شروط التصنيف كمنشأة صغيرة أو متوسطة (القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦)؟' : 'Does this supplier qualify as an SME (Ministerial Decision No. 23 of 2026)?'}
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة تأهل المنشآت الصغيرة والمتوسطة' : 'SME qualification status'}>
                      {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={entry.bhSme.qualifiesAsSme === v}
                          onClick={() => onUpdate(entry.id, { bhSme: { ...entry.bhSme, qualifiesAsSme: v } })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            entry.bhSme.qualifiesAsSme === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {isAr ? 'الحد: ≤٢٥٠ موظفاً أو ≤٢٠ مليون دينار بحريني إيرادات سنوية.' : 'Ceiling: <=250 employees or <=BHD 20M annual revenue.'}
                    </p>
                  </div>
                )}

                {entry.countrySelection === 'KW' && entry.program === 'kw-kpc-local-spend' && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isAr ? 'هل هذا المورّد مسجّل رسمياً كمورّد كويتي؟' : 'Is this supplier a registered Kuwaiti supplier?'}
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة التسجيل كمورّد كويتي' : 'Kuwaiti-supplier registration status'}>
                      {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={entry.kwLocalSpend.isRegisteredKuwaitiSupplier === v}
                          onClick={() => onUpdate(entry.id, { kwLocalSpend: { ...entry.kwLocalSpend, isRegisteredKuwaitiSupplier: v } })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            entry.kwLocalSpend.isRegisteredKuwaitiSupplier === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {isAr ? 'لم يُسنَد بعد تعريف تأهل أكثر تفصيلاً وموثّقاً -- التسجيل الرسمي هو الحقيقة المتاحة حالياً.' : 'A more granular sourced qualification definition has not been located yet -- formal registration is the fact available today.'}
                    </p>
                  </div>
                )}

                {entry.countrySelection === 'EG' && entry.program === 'eg-price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة المحتوى المصري المقدَّرة من قيمة العطاء' : 'Estimated Egyptian Local-Content Share of Bid Value'}
                      hint={isAr ? 'يتطلب القانون ٥ لسنة ٢٠١٥ (المعدَّل بالقانون ٩٠ لسنة ٢٠١٨) حداً أدنى ٤٠٪ للتأهل؛ العطاءات المؤهلة تحصل على تفضيل سعري ثابت بنسبة ١٥٪ (بوابة حدّية، وليست تدرجاً مستمراً).' : 'Law 5/2015 (as amended by Law 90/2018) requires a minimum 40% to qualify; qualifying bids then receive a flat 15% price preference (a threshold gate, not a continuous scale).'}
                      unit="%"
                      max={100}
                      value={entry.eg.egyptianContentSharePct}
                      onChange={v => onUpdate(entry.id, { eg: { ...entry.eg, egyptianContentSharePct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'EG' && entry.program === 'eg-oil-gas-price-preference' && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isAr ? 'هل هذا المورّد مقاول مصري محلي مؤهل ضمن اتفاقية تقاسم الإنتاج (أداء مماثل وسعر لا يتجاوز أقل عرض بأكثر من ١٠٪)؟' : 'Is this supplier a qualifying local Egyptian PSA contractor (comparable performance, price within 10% of the lowest bid)?'}
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة المقاول المحلي في اتفاقية تقاسم الإنتاج' : 'PSA local-contractor status'}>
                      {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={entry.egOilGas.isLocalEgyptianContractor === v}
                          onClick={() => onUpdate(entry.id, { egOilGas: { ...entry.egOilGas, isLocalEgyptianContractor: v } })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            entry.egOilGas.isLocalEgyptianContractor === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {isAr ? 'وفق شروط اتفاقيات تقاسم الإنتاج (PSA) الخاصة بوزارة البترول -- تفضيل بهامش ١٠٪ لأسعار المقاولين المحليين المؤهلين.' : "Per Ministry of Petroleum PSA contractual terms -- a 10% price-band preference for qualifying local contractors."}
                    </p>
                  </div>
                )}

                {entry.countrySelection === 'TR' && entry.program === 'tr-price-preference' && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <NumberField
                      label={isAr ? 'نسبة السلع المحلية المعتمدة (وثيقة يرلي مالي) من قيمة العطاء' : 'Yerli Mali Belgesi-Certified Domestic Share of Bid Value'}
                      hint={isAr ? 'يتيح القانون رقم ٤٧٣٤ المادة ٦٣(ج) تفضيلاً يصل إلى ١٥٪ (إلزامي للسلع متوسطة/عالية التقنية المدرجة)، يُطبَّق بنداً بنداً حسب الاعتماد.' : 'Law 4734 Art. 63(c) allows up to 15% (mandatory for listed medium/high-tech goods), applied item-by-item by certification.'}
                      unit="%"
                      max={100}
                      value={entry.tr.bidValueDomesticCertifiedPct}
                      onChange={v => onUpdate(entry.id, { tr: { ...entry.tr, bidValueDomesticCertifiedPct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'UK' && entry.program === 'uk-below-threshold-reservation' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل هذه المناقصة مخصصة دون العتبة بموجب مذكرة PPN 005؟' : 'Is this procurement reserved below-threshold under PPN 005?'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة التخصيص دون العتبة' : 'Below-threshold reservation status'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.uk.isBelowThresholdReservedProcurement === v}
                            onClick={() => onUpdate(entry.id, { uk: { ...entry.uk, isBelowThresholdReservedProcurement: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.uk.isBelowThresholdReservedProcurement === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'دون عتبات القانون (سلع/خدمات: ١٣٥,٠١٨ جنيهاً للحكومة المركزية / ٢٠٧,٧٢٠ جنيهاً لغيرها؛ أشغال: ٥,١٩٣,٠٠٠ جنيه) يجوز لجهة التعاقد تخصيص العقد جغرافياً.' : 'Below the Act\'s thresholds (goods/services: GBP 135,018 central govt / 207,720 other; works: GBP 5,193,000), the authority may reserve the contract by geography.'}
                      </p>
                    </div>
                    {entry.uk.isBelowThresholdReservedProcurement === true && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'هل يستوفي هذا المورّد النطاق الجغرافي المُعلن لهذه المناقصة (ربما مقروناً بصفة منشأة صغيرة/متوسطة أو مجتمعية)؟' : "Does this supplier meet this tender's stated geography reservation (possibly combined with SME/VCSE status)?"}
                        </p>
                        <div className="flex gap-1.5" role="group" aria-label={isAr ? 'التأهل الجغرافي' : 'Geography qualification'}>
                          {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={entry.uk.isQualifyingUkGeographySupplier === v}
                              onClick={() => onUpdate(entry.id, { uk: { ...entry.uk, isQualifyingUkGeographySupplier: v } })}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                entry.uk.isQualifyingUkGeographySupplier === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {isAr ? 'يُخصَّص وفق النطاق الجغرافي (المملكة المتحدة/مقاطعة/حي لندني) لا وفق أقاليم المملكة المتحدة المكوِّنة.' : 'Reserved by geography (UK-wide/county/London borough), never by constituent UK nation.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {entry.countrySelection === 'USA' && entry.program === 'usa-buy-american-price-preference' && (
                  <div className="space-y-3">
                    <NumberField
                      label={isAr ? 'نسبة المحتوى المحلي الأمريكي المعتمدة من قيمة العطاء' : 'Certified Domestic Content Share of Bid Value'}
                      hint={isAr ? 'يتطلب قانون Buy American (FAR الفصل الفرعي ٢٥.١/٢٥.٢) حداً أدنى ٦٥٪ للتأهل (يرتفع إلى ٧٥٪ اعتباراً من ٢٠٢٩)؛ العطاءات المؤهلة تحصل على تفضيل سعري ثابت (بوابة حدّية، وليست تدرجاً مستمراً).' : "FAR Subpart 25.1/25.2 (Buy American Act) requires a minimum 65% to qualify (rising to 75% from 2029); qualifying bids then receive a flat price preference (a threshold gate, not a continuous scale)."}
                      unit="%"
                      max={100}
                      value={entry.usa.domesticContentSharePct}
                      onChange={v => onUpdate(entry.id, { usa: { ...entry.usa, domesticContentSharePct: v } })}
                    />
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل هذا المورّد "منشأة صغيرة" بموجب معايير SBA (يرفع الهامش من ٢٠٪ إلى ٣٠٪)؟' : 'Is this supplier a "small business concern" under SBA size standards (raises the margin from 20% to 30%)?'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة المنشأة الصغيرة' : 'Small business concern status'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.usa.isSmallBusinessConcern === v}
                            onClick={() => onUpdate(entry.id, { usa: { ...entry.usa, isSmallBusinessConcern: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.usa.isSmallBusinessConcern === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'الافتراضي عند عدم الإدخال: هامش المنشآت الكبيرة (٢٠٪) -- افتراض مُفصَح عنه وقابل للتجاوز من قِبل المستخدم.' : 'Default when not entered: large-business margin (20%) -- a disclosed, caller-overridable default.'}
                      </p>
                    </div>
                  </div>
                )}

                {entry.countrySelection === 'USA' && entry.program === 'usa-baba-infrastructure-gate' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل هذا مشروع بنية تحتية ممول اتحادياً يخضع لقانون Build America, Buy America (BABA)؟' : 'Is this a federally-funded infrastructure procurement subject to the Build America, Buy America Act (BABA)?'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة مشروع BABA' : 'BABA procurement status'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.usaBaba.isFederallyFundedInfrastructureProcurement === v}
                            onClick={() => onUpdate(entry.id, { usaBaba: { ...entry.usaBaba, isFederallyFundedInfrastructureProcurement: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.usaBaba.isFederallyFundedInfrastructureProcurement === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'قانون IIJA (البند التاسع) يشمل الحديد والصلب (١٠٠٪)، مواد البناء (١٠٠٪)، والمنتجات المصنّعة (٥٥٪) -- مع إخلاء طرف محتمل لكل جهة تمويل على حدة.' : 'IIJA Title IX covers iron & steel (100%), construction materials (100%), and manufactured products (55%) -- with a possible per-agency waiver.'}
                      </p>
                    </div>
                    {entry.usaBaba.isFederallyFundedInfrastructureProcurement === true && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'هل يستوفي هذا المورّد متطلبات المحتوى المحلي بموجب BABA لهذه الفئة؟' : "Does this supplier meet BABA's domestic content requirement for this category?"}
                        </p>
                        <div className="flex gap-1.5" role="group" aria-label={isAr ? 'التأهل بموجب BABA' : 'BABA qualification'}>
                          {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={entry.usaBaba.meetsBabaDomesticContentRequirement === v}
                              onClick={() => onUpdate(entry.id, { usaBaba: { ...entry.usaBaba, meetsBabaDomesticContentRequirement: v } })}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                entry.usaBaba.meetsBabaDomesticContentRequirement === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {isAr ? 'بوابة تأهل فئة، وليست تدرجاً -- يُستوفى الحد أو لا يُستوفى لكل فئة منتج.' : 'A category eligibility gate, not a scale -- the threshold is met or not, per product category.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {entry.countrySelection === 'USA' && entry.program === 'usa-sba-small-business-setaside' && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isAr ? 'هل هذا المورّد "منشأة صغيرة" بموجب معايير حجم SBA؟' : 'Is this supplier a "small business concern" under SBA size standards?'}
                    </p>
                    <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة المنشأة الصغيرة' : 'Small business concern status'}>
                      {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={entry.usa.isSmallBusinessConcern === v}
                          onClick={() => onUpdate(entry.id, { usa: { ...entry.usa, isSmallBusinessConcern: v } })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            entry.usa.isSmallBusinessConcern === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {isAr ? 'هدف حكومي عام ٢٣٪ (FAR 19.502-2) مع "قاعدة الاثنين" -- نفس الحقل المستخدم في هامش قانون Buy American أعلاه.' : 'A government-wide 23% goal (FAR 19.502-2) with the "Rule of Two" -- the same field used by the Buy American margin above.'}
                    </p>
                  </div>
                )}

                {entry.countrySelection === 'CN' && entry.program === 'cn-domestic-product-price-preference' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل يستوفي هذا المنتج تصنيف "المنتج المحلي" وفق وثيقة مجلس الدولة رقم [2025] 34؟' : 'Does this product meet the "domestic product" classification test under State Council Document [2025] No. 34?'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة تصنيف المنتج المحلي' : 'Domestic-product classification status'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.cn.meetsDomesticProductCriteria === v}
                            onClick={() => onUpdate(entry.id, { cn: { ...entry.cn, meetsDomesticProductCriteria: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.cn.meetsDomesticProductCriteria === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'تحول جوهري داخل الصين، يستثني التجميع البسيط أو التعبئة أو إعادة التوسيم.' : 'A substantial transformation within China, excluding simple assembly, packaging, or relabeling.'}
                      </p>
                    </div>
                    <NumberField
                      label={isAr ? 'حصة تكلفة المنتجات المحلية من إجمالي حزمة المشتريات المختلطة (إن وُجدت)' : "Domestically-Made Share of a Mixed Procurement Bundle's Total Cost (if applicable)"}
                      hint={isAr ? 'مسار بديل ومستقل: بلوغ ٨٠٪ على الأقل من تكلفة منتجات حزمة مشتريات مختلطة يؤهل للخصم ذاته حتى لو فشل هذا المنتج بمفرده في اختبار التصنيف أعلاه.' : "An independent, alternative path: reaching at least 80% of a mixed procurement bundle's product cost qualifies for the same deduction even if this product alone fails the classification test above."}
                      unit="%"
                      max={100}
                      value={entry.cn.bundleDomesticCostSharePct}
                      onChange={v => onUpdate(entry.id, { cn: { ...entry.cn, bundleDomesticCostSharePct: v } })}
                    />
                  </div>
                )}

                {entry.countrySelection === 'CN' && entry.program === 'cn-govt-procurement-law-domestic-mandate' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'هل ينطبق أحد إعفاءات المادة العاشرة الثلاثة على هذه المناقصة؟' : 'Does one of the three Article 10 exemptions apply to this tender?'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة إعفاء المادة العاشرة' : 'Article 10 exemption status'}>
                        {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.cn.article10ExemptionApplies === v}
                            onClick={() => onUpdate(entry.id, { cn: { ...entry.cn, article10ExemptionApplies: v } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.cn.article10ExemptionApplies === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'عدم التوفر محلياً أو بشروط تجارية معقولة؛ الاستخدام خارج الصين؛ أو نص قانوني أو لائحة أخرى.' : 'Domestic unavailability or unreasonable commercial terms; use outside China; or another statute or regulation.'}
                      </p>
                    </div>
                    {entry.cn.article10ExemptionApplies === false && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'هل يستوفي منتج هذا المورّد تصنيف "المنتج المحلي" (نفس حقل تفضيل السعر أعلاه)؟' : "Does this supplier's product meet the domestic-product classification (the same field as the price-preference program above)?"}
                        </p>
                        <div className="flex gap-1.5" role="group" aria-label={isAr ? 'حالة تصنيف المنتج المحلي' : 'Domestic-product classification status'}>
                          {([['yes', true], ['no', false]] as const).map(([k, v]) => (
                            <button
                              key={k}
                              type="button"
                              aria-pressed={entry.cn.meetsDomesticProductCriteria === v}
                              onClick={() => onUpdate(entry.id, { cn: { ...entry.cn, meetsDomesticProductCriteria: v } })}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                entry.cn.meetsDomesticProductCriteria === v ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {k === 'yes' ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {isAr ? 'بوابة على أهلية العطاء نفسها بموجب المادة العاشرة، وليست تفضيلاً سعرياً.' : "A gate on bid eligibility itself under Article 10, not a price preference."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {entry.countrySelection === 'CN' && entry.program === 'cn-sme-price-deduction' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'دور المزايد' : "Bidder's Role"}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'دور المزايد' : "Bidder's role"}>
                        {([
                          ['direct-small-micro', isAr ? 'منشأة صغيرة/متناهية الصغر مباشرة' : 'Direct Small/Micro Enterprise'],
                          ['large-medium-consortium-subcontract', isAr ? 'كبيرة/متوسطة (تحالف أو تعاقد من الباطن)' : 'Large/Medium (Consortium or Subcontract)'],
                        ] as const).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.cnSme.supplierRole === k}
                            onClick={() => onUpdate(entry.id, { cnSme: { ...entry.cnSme, supplierRole: k } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.cnSme.supplierRole === k ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {isAr ? 'نوع المشتريات' : 'Procurement Type'}
                      </p>
                      <div className="flex gap-1.5" role="group" aria-label={isAr ? 'نوع المشتريات' : 'Procurement type'}>
                        {([
                          ['goods-services', isAr ? 'سلع/خدمات' : 'Goods/Services'],
                          ['engineering-works', isAr ? 'أشغال هندسية' : 'Engineering Works'],
                        ] as const).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={entry.cnSme.procurementType === k}
                            onClick={() => onUpdate(entry.id, { cnSme: { ...entry.cnSme, procurementType: k } })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                              entry.cnSme.procurementType === k ? 'bg-[#082C6B] border-[#082C6B] text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {isAr ? 'يحدد النطاق المطبَّق دور المزايد ونوع المشتريات معاً -- مصفوفة ٢×٢.' : 'The applicable band depends on bidder role AND procurement type together -- a 2x2 matrix.'}
                      </p>
                    </div>
                    {entry.cnSme.supplierRole === 'large-medium-consortium-subcontract' && (
                      <NumberField
                        label={isAr ? 'حصة المنشآت الصغيرة من قيمة العقد في التحالف/التعاقد من الباطن' : "Small-Enterprise Share of Contract Value in the Consortium/Subcontract"}
                        hint={isAr ? 'بوابة حقيقية: دون بلوغ ٣٠٪ على الأقل، الخصم صفر وليس جزئياً.' : 'A real gate: below at least 30%, the deduction is zero, not partial.'}
                        unit="%"
                        max={100}
                        value={entry.cnSme.consortiumSmallEnterpriseSubcontractSharePct}
                        onChange={v => onUpdate(entry.id, { cnSme: { ...entry.cnSme, consortiumSmallEnterpriseSubcontractSharePct: v } })}
                      />
                    )}
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
                    {assessment.computation.preferenceMarginMinPct !== undefined && assessment.computation.preferenceMarginMaxPct !== undefined ? (
                      <p className="text-[11px] text-slate-600">
                        {isAr
                          ? `الأرضية القانونية المضمونة: ${assessment.computation.preferenceMarginMinPct} نقطة -- والسقف القانوني حتى ${assessment.computation.preferenceMarginMaxPct} نقطة وفق تقدير جهة الشراء ضمن هذا النطاق (وليس رقماً ثابتاً)`
                          : `Guaranteed legal floor: ${assessment.computation.preferenceMarginMinPct} pts -- statutory ceiling up to ${assessment.computation.preferenceMarginMaxPct} pts, at the procuring entity's discretion within the range (not a fixed figure)`}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-600">
                        {isAr
                          ? `من أصل ${assessment.computation.preferenceMarginPct} نقطة كحد أقصى لتفضيل السعر`
                          : `Out of a maximum ${assessment.computation.preferenceMarginPct}-point price preference`}
                      </p>
                    )}
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
                {assessment.computation.mechanismType === 'offset-obligation-gate' && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'التزام المقاصة (توازن)' : 'Offset Obligation (Tawazun)'}
                      </span>
                      <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
                        assessment.computation.triggersObligation === true ? 'bg-amber-100 text-amber-700'
                          : assessment.computation.triggersObligation === false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {assessment.computation.triggersObligation === true ? (isAr ? 'مفعّل' : 'Triggered')
                          : assessment.computation.triggersObligation === false ? (isAr ? 'دون العتبة' : 'Below threshold') : (isAr ? 'غير مكتمل' : 'Incomplete')}
                      </span>
                    </div>
                    {assessment.computation.triggersObligation === true && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{isAr ? 'ائتمانات المقاصة المطلوبة (٦٠٪)' : 'Required Offset Credits (60%)'}</span>
                          <span className="font-semibold">{isAr ? 'د.إ' : 'AED'} {assessment.computation.requiredOffsetCreditsAED?.toLocaleString() ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{isAr ? 'ائتمانات مكتسبة' : 'Credits Earned'}</span>
                          <span className="font-semibold">{assessment.computation.offsetCreditsEarnedAED !== null ? `${isAr ? 'د.إ' : 'AED'} ${assessment.computation.offsetCreditsEarnedAED.toLocaleString()}` : (isAr ? 'غير معروف' : 'unknown')}</span>
                        </div>
                        {assessment.computation.shortfallAED !== null && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={assessment.computation.shortfallAED > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                              {assessment.computation.shortfallAED > 0 ? (isAr ? 'النقص' : 'Shortfall') : (isAr ? 'مغطّى بالكامل' : 'Fully covered')}
                            </span>
                            <span className="font-semibold">{isAr ? 'د.إ' : 'AED'} {assessment.computation.shortfallAED.toLocaleString()}</span>
                          </div>
                        )}
                        {assessment.computation.shortfallPenaltyAED !== null && assessment.computation.shortfallPenaltyAED > 0 && (
                          <p className="text-[10px] text-amber-700 font-semibold">
                            {isAr
                              ? `غرامة تسوية النقص (٨.٥٪): ${assessment.computation.shortfallPenaltyAED.toLocaleString()} درهم`
                              : `Shortfall settlement penalty (8.5%): AED ${assessment.computation.shortfallPenaltyAED.toLocaleString()}`}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {assessment.computation.mechanismType === 'spend-set-aside-target' && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'الحصة المستهدفة المخصصة' : 'Reserved Target Share'}
                      </span>
                      <span className="text-2xl font-black text-[#082C6B]">{assessment.computation.targetSharePct}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{isAr ? 'مؤهل للحصة المخصصة' : 'Qualifies for Reserved Share'}</span>
                      <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
                        assessment.computation.eligibleForReservedShare === true ? 'bg-emerald-100 text-emerald-700'
                          : assessment.computation.eligibleForReservedShare === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {assessment.computation.eligibleForReservedShare === true ? (isAr ? 'نعم' : 'Yes')
                          : assessment.computation.eligibleForReservedShare === false ? (isAr ? 'لا' : 'No') : (isAr ? 'غير مكتمل' : 'Incomplete')}
                      </span>
                    </div>
                  </>
                )}
                {assessment.computation.mechanismType === 'modified-icv-score' && (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'الدرجة النهائية (توطين/ICV)' : 'Final Score (Tawteen/ICV)'}
                      </span>
                      <span className="text-2xl font-black text-[#082C6B]">
                        {assessment.computation.finalScorePct !== null ? `${assessment.computation.finalScorePct.toFixed(1)}%` : '—'}
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
                    <p className="text-[10px] text-slate-500">
                      {isAr
                        ? `النسبة الأساسية: ${assessment.computation.baseScorePct !== null ? `${assessment.computation.baseScorePct.toFixed(1)}٪` : '—'}${assessment.computation.isEligibleManufacturer ? ' — مكافأة المصنّع المؤهل (×١.٥) مطبّقة' : ''}${assessment.computation.isMicroOrSmallSupplier ? ' — الحد الأدنى الشامل ٣٠٪ مطبّق' : ''}`
                        : `Base ratio: ${assessment.computation.baseScorePct !== null ? `${assessment.computation.baseScorePct.toFixed(1)}%` : '—'}${assessment.computation.isEligibleManufacturer ? ' — ICV+ manufacturer boost (x1.5) applied' : ''}${assessment.computation.isMicroOrSmallSupplier ? ' — blanket 30% floor applied' : ''}`}
                    </p>
                  </>
                )}
                {assessment.computation.mechanismType === 'commitment-deviation-gate' && (() => {
                  const c = assessment.computation as CommitmentDeviationGateResult;
                  const nextStep = actionableNextStepForSabicLcGate(c);
                  return (
                    <>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {isAr ? 'الالتزام مقابل الفعلي' : 'Committed vs. Actual'}
                        </span>
                        <span className={`text-sm font-black px-2.5 py-1 rounded-full ${
                          c.withinTolerance === true ? 'bg-emerald-100 text-emerald-700'
                            : c.withinTolerance === false ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.withinTolerance === true ? (isAr ? 'ضمن التسامح' : 'Within tolerance')
                            : c.withinTolerance === false ? (isAr ? 'تجاوز التسامح' : 'Breach') : (isAr ? 'غير مكتمل' : 'Incomplete')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{isAr ? 'الهدف المتفاوض عليه' : 'Negotiated Target'}</span>
                          <span className="font-semibold">{c.proposedTargetPct !== null ? `${c.proposedTargetPct.toFixed(1)}%` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{isAr ? 'الأداء الفعلي المدقّق' : 'Actual Audited'}</span>
                          <span className="font-semibold">{c.actualAuditedPct !== null ? `${c.actualAuditedPct.toFixed(1)}%` : '—'}</span>
                        </div>
                        {c.deviationPct !== null && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={c.deviationPct > c.toleranceThresholdPct ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                              {isAr ? 'الانحراف' : 'Deviation'}
                            </span>
                            <span className="font-semibold">{c.deviationPct.toFixed(1)} pts</span>
                          </div>
                        )}
                      </div>
                      {nextStep && (
                        <p className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-2 leading-relaxed">
                          {isAr ? nextStep.ar : nextStep.en}
                        </p>
                      )}
                    </>
                  );
                })()}
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
    // Same legacy-program migration as loadState() -- a server row can be
    // just as stale as a localStorage entry (e.g. synced before this pass).
    return {
      ...row.data, id: row.clientKey, label: row.name,
      program: normalizeProgram(row.data.program, row.data.countrySelection ?? 'SA'),
      aeTawazun: { ...emptyAeTawazun(), ...row.data.aeTawazun },
      rawafedStc: { ...emptyRawafedStc(), ...row.data.rawafedStc },
      sabicLcCommitment: { ...emptySabicLcCommitment(), ...row.data.sabicLcCommitment },
    };
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
        { sa: e.sa, ae: e.ae, jo: e.jo, saMandatoryList: e.saMandatoryList, saPricePreference: e.saPricePreference, iktva: e.iktva, aeTawazun: e.aeTawazun, joContractorQuota: e.joContractorQuota, omMandatoryList: e.omMandatoryList, omOqPricePreference: e.omOqPricePreference, qa: e.qa, bhSme: e.bhSme, kwLocalSpend: e.kwLocalSpend, eg: e.eg, egOilGas: e.egOilGas, tr: e.tr, uk: e.uk, usa: e.usa, usaBaba: e.usaBaba, cn: e.cn, cnSme: e.cnSme, rawafedStc: e.rawafedStc, sabicLcCommitment: e.sabicLcCommitment },
        e.program,
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
                {isAr ? 'فحص أهلية المحتوى المحلي عبر ستّ عشرة دولة خليجية وعربية وتركيا والمملكة المتحدة والولايات المتحدة والصين والهند وألمانيا واليابان وكوريا الجنوبية' : 'Local Content / ICV Eligibility Check'}
              </h1>
            </div>
          </div>
          <p className="text-white/75 text-base max-w-2xl leading-relaxed mb-4">
            {isAr
              ? 'المحتوى المحلي ليس معياراً إقليمياً واحداً -- إنه آليات مختلفة جوهرياً عبر ستّ عشرة دولة: درجة نسبة مئوية معتمدة في السعودية (LCGPA)، درجة مرجحة متعددة الأركان في الإمارات (ICV)، تفضيل سعري في عطاءات الأردن وعُمان والبحرين ومصر وتركيا والولايات المتحدة والصين والهند (عاماً، وفي قطاع النفط والغاز لمصر، وبخصم مُدرَّج حسب دور المزايد ونوع المشتريات للمنشآت الصغيرة في الصين، وببوابة تصنيف ثلاثية الفئات في الهند)، بوابة أهلية للفئات في القائمة الإلزامية بالسعودية وعُمان وبوابة التخصيص دون العتبة في المملكة المتحدة (PPN 005) وبوابة أهلية بنية تحتية BABA في الولايات المتحدة وبوابة المادة العاشرة من قانون المشتريات الحكومية الصيني وبوابة المنتجات التنافسية للمنشآت الصغيرة والمتوسطة الكورية، درجة توطين/ICV رسمية في قطر (icv.qa)، وحصص إنفاق مخصصة في الأردن والبحرين والكويت والولايات المتحدة (هدف SBA للمنشآت الصغيرة) وكوريا الجنوبية (نسبة استهداف بمُحدِّد فئة ثنائي) واليابان (نسبة استهداف كانكوجو التي تحددها الحكومة سنوياً بدل نسبة ثابتة)، وغياب مؤكَّد وموثَّق بصدق لأي تفضيل محلي أحادي في ألمانيا. سمِّ كل مورّد، اختر الدولة والبرنامج وسياق الشراء، واحصل على قراءة أهلية صادقة فوراً.'
              : "Local content isn't one regional standard -- it's genuinely different mechanisms across sixteen countries: a certified percentage score in Saudi Arabia (LCGPA), a weighted multi-pillar score in the UAE (ICV), a bid-evaluation price preference in Jordan, Oman, Bahrain, Egypt, Turkey, the USA, China, and India (general procurement, plus a separate oil & gas PSA preference in Egypt, a role/procurement-type-banded SME deduction in China, and a three-tier local-content classification gate in India), a category-eligibility gate on Saudi and Omani Mandatory Lists plus the UK's below-threshold reservation gate (PPN 005), the USA's Build America, Buy America Act infrastructure gate, China's Government Procurement Law Article 10 domestic-mandate gate, and South Korea's SME-Exclusive Competitive Products gate, an official Tawteen/ICV score in Qatar (icv.qa), and reserved spend set-asides in Jordan, Bahrain, Kuwait, the USA (SBA small-business goal), South Korea (a 2-way category-selected SME purchase target), and Japan (a Kankouju target ratio set annually by the government rather than a fixed percentage) -- plus a confirmed, honestly-sourced absence of any unilateral local-content preference in Germany. Name each supplier, pick the country, program, and buyer context, and get an honest applicability read immediately."}
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
                    <tr key={`${g.country}-${g.program}-${g.procurementContext}-${i}`} className="border-b border-slate-100">
                      <td className="py-1.5 pe-3 font-semibold text-slate-700">
                        <span aria-hidden="true">{COUNTRY_FLAG[g.country]}</span>{' '}
                        {PROGRAMS_BY_COUNTRY[g.country].length > 1
                          ? (isAr ? PROGRAM_LABELS[g.program].ar : PROGRAM_LABELS[g.program].en)
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
                          : g.totalShortfallPenaltyAED !== null ? (isAr ? `التعرض المالي ${g.totalShortfallPenaltyAED.toLocaleString()} درهم` : `AED ${g.totalShortfallPenaltyAED.toLocaleString()} exposure`)
                          : g.setAsideQualifyingSharePct !== null ? (isAr ? `${g.setAsideQualifyingSharePct.toFixed(0)}٪ مؤهل للحصة` : `${g.setAsideQualifyingSharePct.toFixed(0)}% qualify for set-aside`)
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
            ? 'هذه الأداة لا تحل محل تدقيق رسمي من الجهة المعنية (هيئة المحتوى المحلي والمشتريات الحكومية في السعودية، وزارة الصناعة والتقنية المتقدمة في الإمارات، الجهة الأردنية المختصة، هيئة المناقصات والمشتريات العامة والمحتوى المحلي PTLC في عُمان، icv.qa في قطر، الجهة البحرينية أو الكويتية المختصة، أو الجهة المصرية المختصة بموجب القانون رقم ٥ لسنة ٢٠١٥ أو وزارة البترول) أو استشارة قانونية/محاسبية متخصصة.'
            : "This tool is not a substitute for a formal audit from the relevant authority (Saudi Arabia's LCGPA, the UAE's MoIAT, Jordan's competent ministry, Oman's PTLC, Qatar's icv.qa, Bahrain's or Kuwait's competent authority, or Egypt's competent authority under Law No. 5 of 2015 or the Ministry of Petroleum) or specialist legal/accounting advice."}
        </p>
      </div>
    </div>
  );
}
