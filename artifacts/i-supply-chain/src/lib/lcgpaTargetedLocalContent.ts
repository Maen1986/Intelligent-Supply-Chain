// Pure calculation behind ISC's "Targeted local content" calculator for Saudi Arabia.
// Mirrors LCGPA's two official supplier-side forms, as supplied by the platform owner (24 Oct 2026):
//   - OM-LRF-09 V.1  "Targeted local content (contract level)"      -> used by the Minimum-Threshold mechanism (contract level)
//   - OM-LRF-10 V.1  "Targeted local content (enterprise level)"    -> used by the Local-Content-Weight-in-Financial-Evaluation mechanism
// Both forms share the same six value lines. Honest limits (Decision Record 8.7):
//   - Sector percentages (Appendix A) and the 53.4% foreign-workforce factor are the forms' own constants.
//   - A supplier's audited local-content % (LCGPA-verified) is a user input; ISC cannot look it up.
//   - The enterprise form adds an R&D incentive (up to +10 points) and caps the result at 100%; the contract form has neither.
//   - ISC does not verify any figure and nothing here is an LCGPA determination.
import { sectorById } from './lcgpaContractMinimum';
import { LCGPA_FORM_FOREIGN_WORKFORCE_VALUE_ADDED, LCGPA_FORM_SAUDI_WORKFORCE_VALUE_ADDED } from './lcgpaContractMinimumData';

/** Local-content share the forms apply to depreciation of assets NOT produced in Saudi Arabia (Section 6, last row). */
export const FORM_NON_SAUDI_ASSET_SHARE = 0.3;
/** Enterprise form: R&D spend that earns the full incentive, as a share of revenue. */
export const FORM_RD_FULL_INCENTIVE_RATIO = 0.02;
/** Enterprise form: maximum R&D incentive, in percentage points of the result (0.10 = 10 points). */
export const FORM_RD_MAX_INCENTIVE = 0.1;

export type TargetedMode = 'contract' | 'enterprise';

export interface GoodsServicesLine {
  sectorId: number;
  /** Planned spend with this supplier (SAR). */
  spend: number;
  /** The supplier's latest audited local-content % (0-1), if it has one. Used instead of the sector % when > 0. */
  auditedPct?: number;
}

export interface TargetedInput {
  mode: TargetedMode;
  saudiCompensation: number;
  foreignCompensation: number;
  /** Total goods-and-services spend (SAR) for the whole contract / year, including lines not itemised below. */
  goodsServicesTotal: number;
  goodsServicesLines: GoodsServicesLine[];
  saudiTraining: number;
  supplierDevelopment: number;
  researchDevelopment: number;
  /** Total depreciation & amortisation (SAR). */
  depreciationTotal: number;
  /** Part of it on assets produced in Saudi Arabia (counted at 100%). The rest counts at 30%. */
  depreciationSaudiMade: number;
  /** Enterprise mode only: total revenue of the financial year before contract end (SAR). */
  revenue?: number;
}

export interface TargetedResult {
  contributions: {
    depreciation: number;
    workforce: number;
    goodsServices: number;
    training: number;
    supplierDevelopment: number;
    researchDevelopment: number;
  };
  totalCost: number;
  localValue: number;
  /** Local-content % before any incentive, 0-1. */
  basePct: number;
  rdIncentive: number;
  /** Final targeted %, 0-1. Enterprise mode adds the R&D incentive and caps at 100%. */
  targetedPct: number;
  /** Share of goods-and-services spend that was itemised (the form asks for at least 70% or the top 40 suppliers). */
  itemisedShare: number;
  warnings: string[];
}

/** Non-finite, negative or absurd (> 1e15) inputs are neutralised so no result can become NaN/Infinity. */
const nz = (n: number | undefined): number => (typeof n === 'number' && isFinite(n) && n > 0 ? Math.min(n, 1e15) : 0);

export function computeTargetedLocalContent(input: TargetedInput): TargetedResult {
  const warnings: string[] = [];
  const saudi = nz(input.saudiCompensation);
  const foreign = nz(input.foreignCompensation);
  const workforceTotal = saudi + foreign;
  const workforce = saudi * LCGPA_FORM_SAUDI_WORKFORCE_VALUE_ADDED + foreign * LCGPA_FORM_FOREIGN_WORKFORCE_VALUE_ADDED;

  let itemisedSpend = 0;
  let itemisedValue = 0;
  for (const l of input.goodsServicesLines) {
    const spend = nz(l.spend);
    const sector = sectorById(l.sectorId);
    const audited = typeof l.auditedPct === 'number' && l.auditedPct > 0 ? Math.min(1, l.auditedPct) : 0;
    const pct = audited > 0 ? audited : sector ? sector.pct : 0;
    if (!sector && audited <= 0) warnings.push('line-without-sector');
    itemisedSpend += spend;
    itemisedValue += spend * pct;
  }
  const gsTotal = Math.max(nz(input.goodsServicesTotal), itemisedSpend);
  if (nz(input.goodsServicesTotal) > 0 && nz(input.goodsServicesTotal) < itemisedSpend) warnings.push('itemised-exceeds-total');
  const weightedAvg = itemisedSpend > 0 ? itemisedValue / itemisedSpend : 0;
  // The form values the un-itemised remainder at the spend-weighted average of the itemised lines.
  const remainder = gsTotal - itemisedSpend;
  const goodsServices = itemisedValue + remainder * weightedAvg;
  const itemisedShare = gsTotal > 0 ? itemisedSpend / gsTotal : 0;
  if (gsTotal > 0 && itemisedShare < 0.7) warnings.push('itemised-below-70pct');
  if (input.goodsServicesLines.length > 40) warnings.push('more-than-40-suppliers');

  const depTotal = nz(input.depreciationTotal);
  const depSaudi = Math.min(nz(input.depreciationSaudiMade), depTotal);
  if (nz(input.depreciationSaudiMade) > depTotal) warnings.push('depreciation-saudi-exceeds-total');
  const depreciation = depSaudi * 1 + (depTotal - depSaudi) * FORM_NON_SAUDI_ASSET_SHARE;

  const training = nz(input.saudiTraining);
  const supplierDevelopment = nz(input.supplierDevelopment);
  const researchDevelopment = nz(input.researchDevelopment);

  const totalCost = workforceTotal + gsTotal + training + supplierDevelopment + researchDevelopment + depTotal;
  const localValue = depreciation + workforce + goodsServices + training + supplierDevelopment + researchDevelopment;
  const basePct = totalCost > 0 ? localValue / totalCost : 0;

  let rdIncentive = 0;
  let targetedPct = basePct;
  if (input.mode === 'enterprise') {
    const revenue = nz(input.revenue);
    if (revenue > 0) {
      const ratio = researchDevelopment / revenue;
      rdIncentive = ratio >= FORM_RD_FULL_INCENTIVE_RATIO ? FORM_RD_MAX_INCENTIVE : FORM_RD_MAX_INCENTIVE * (ratio / FORM_RD_FULL_INCENTIVE_RATIO);
    } else if (researchDevelopment > 0) {
      warnings.push('revenue-missing-for-rd-incentive');
    }
    targetedPct = Math.min(1, basePct + rdIncentive);
  }
  return {
    contributions: { depreciation, workforce, goodsServices, training, supplierDevelopment, researchDevelopment },
    totalCost, localValue, basePct, rdIncentive, targetedPct, itemisedShare, warnings,
  };
}

/** Gap to a threshold the buyer has set (e.g. the contract-minimum % in the tender). Positive = shortfall. */
export function gapToThreshold(targetedPct: number, thresholdPct: number): { shortfallPts: number; meets: boolean } {
  const shortfall = thresholdPct - targetedPct;
  return { shortfallPts: Math.max(0, shortfall), meets: shortfall <= 1e-9 };
}
