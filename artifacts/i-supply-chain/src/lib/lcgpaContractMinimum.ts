// Pure calculation behind ISC's "Contract minimum local content" panel.
// Mirrors the structure of LCGPA's official study form (V1): workforce section, item section, baseline %, minimum %, financial impact.
// Honest limits (Decision Record 8.7):
//  - Sector percentages and the 53.4% foreign-workforce factor are the form's own constants (see lcgpaContractMinimumData.ts).
//  - The minimum % LCGPA assigns to an item is NOT in the form: the user enters it (the form's own "minimum case" input).
//  - No figure here is a legal determination; the authority's evaluation of the submitted form governs.
import {
  LCGPA_SECTORS,
  LCGPA_FORM_SAUDI_WORKFORCE_VALUE_ADDED,
  LCGPA_FORM_FOREIGN_WORKFORCE_VALUE_ADDED,
  type LcgpaSector,
} from './lcgpaContractMinimumData';

export interface WorkforceInput {
  /** Total compensation paid to Saudi nationals over the contract (SAR). */
  saudiCompensation: number;
  /** Total compensation paid to non-Saudi workforce over the contract (SAR). */
  foreignCompensation: number;
}

export interface ItemInput {
  sectorId: number;
  subSector?: string;
  /** Contract spend on this item (SAR), at the price the bidder will actually pay. */
  spend: number;
  /** Minimum % LCGPA assigns (or the bidder commits) for this item. Optional; used only if >= the sector baseline. */
  minPct?: number;
  /** Extra cost (SAR) of buying local instead of import, included in the minimum case. */
  localPriceDifferential?: number;
}

export interface ContractMinimumInput {
  workforce: WorkforceInput;
  items: ItemInput[];
  /** Override of total contract cost (SAR). Default = workforce + items. */
  totalCostOverride?: number;
}

export interface ItemResult {
  sector: LcgpaSector | undefined;
  baselinePct: number;
  appliedMinPct: number;
  baselineValue: number;
  minimumValue: number;
  minimumSpend: number;
  minPctIgnored: boolean;
}

export interface ContractMinimumResult {
  workforceLocalValue: number;
  workforceTotal: number;
  items: ItemResult[];
  totalCost: number;
  minimumCaseCost: number;
  baselineLocalValue: number;
  minimumLocalValue: number;
  baselinePct: number;
  minimumPct: number;
  financialImpact: number;
  financialImpactPct: number;
  warnings: string[];
}

export function sectorById(id: number): LcgpaSector | undefined {
  return LCGPA_SECTORS.find((s) => s.id === id);
}

/** Non-finite, negative or absurd (> 1e15) inputs are neutralised so no result can become NaN/Infinity. */
const nz = (n: number | undefined): number => (typeof n === 'number' && isFinite(n) && n > 0 ? Math.min(n, 1e15) : 0);

export function computeContractMinimum(input: ContractMinimumInput): ContractMinimumResult {
  const warnings: string[] = [];
  const saudi = nz(input.workforce.saudiCompensation);
  const foreign = nz(input.workforce.foreignCompensation);
  const workforceTotal = saudi + foreign;
  const workforceLocalValue =
    saudi * LCGPA_FORM_SAUDI_WORKFORCE_VALUE_ADDED + foreign * LCGPA_FORM_FOREIGN_WORKFORCE_VALUE_ADDED;

  const items: ItemResult[] = input.items.map((it) => {
    const sector = sectorById(it.sectorId);
    const spend = nz(it.spend);
    const baselinePct = sector ? sector.pct : 0;
    const wantsMin = typeof it.minPct === 'number' && isFinite(it.minPct) && it.minPct > 0 && it.minPct <= 1;
    const minPctIgnored = wantsMin && it.minPct! < baselinePct;
    const appliedMinPct = wantsMin && !minPctIgnored ? it.minPct! : baselinePct;
    const minimumSpend = spend + nz(it.localPriceDifferential);
    if (!sector) warnings.push('missing-sector');
    return {
      sector,
      baselinePct,
      appliedMinPct,
      baselineValue: spend * baselinePct,
      minimumValue: minimumSpend * appliedMinPct,
      minimumSpend,
      minPctIgnored,
    };
  });

  const itemsSpend = input.items.reduce((a, it) => a + nz(it.spend), 0);
  const itemsMinSpend = items.reduce((a, r) => a + r.minimumSpend, 0);
  const derivedCost = workforceTotal + itemsSpend;
  const totalCost = input.totalCostOverride && input.totalCostOverride > 0 ? input.totalCostOverride : derivedCost;
  const minimumCaseCost = totalCost + (itemsMinSpend - itemsSpend);

  // +/-10% sanity check against the derived cost, as in the form.
  if (input.totalCostOverride && derivedCost > 0 && Math.abs(input.totalCostOverride - derivedCost) / derivedCost > 0.1) {
    warnings.push('cost-mismatch-10pct');
  }

  const baselineLocalValue = workforceLocalValue + items.reduce((a, r) => a + r.baselineValue, 0);
  const minimumLocalValue = workforceLocalValue + items.reduce((a, r) => a + r.minimumValue, 0);
  const baselinePct = totalCost > 0 ? baselineLocalValue / totalCost : 0;
  const minimumPct = minimumCaseCost > 0 ? minimumLocalValue / minimumCaseCost : 0;
  const financialImpact = minimumCaseCost - totalCost;
  return {
    workforceLocalValue,
    workforceTotal,
    items,
    totalCost,
    minimumCaseCost,
    baselineLocalValue,
    minimumLocalValue,
    baselinePct,
    minimumPct,
    financialImpact,
    financialImpactPct: totalCost > 0 ? financialImpact / totalCost : 0,
    warnings,
  };
}

// ---- Financial-evaluation weight (60% price / 40% local content), Art. 19 as encoded in ISC's sourced note ----
export interface FinancialEvaluationInput {
  bidders: { name: string; price: number; localContentPct: number }[];
  priceWeight?: number; // default 0.6
  localContentWeight?: number; // default 0.4
}
export interface FinancialEvaluationRow {
  name: string;
  priceScore: number;
  lcScore: number;
  total: number;
  rank: number;
}
/** Price score = lowest price / bidder price; local-content score = bidder % / highest % among bidders. Weighted sum. */
export function financialEvaluation(input: FinancialEvaluationInput): FinancialEvaluationRow[] {
  const pw = input.priceWeight ?? 0.6;
  const lw = input.localContentWeight ?? 0.4;
  const valid = input.bidders.filter((b) => Number.isFinite(b.price) && b.price > 0);
  if (!valid.length) return [];
  const minPrice = valid.reduce((m, b) => Math.min(m, b.price), Infinity);
  const lcOf = (b: { localContentPct: number }) => (Number.isFinite(b.localContentPct) ? Math.max(0, b.localContentPct) : 0);
  const maxLc = valid.reduce((m, b) => Math.max(m, lcOf(b)), 0);
  const rows = valid.map((b) => {
    const priceScore = minPrice / b.price;
    const lcScore = maxLc > 0 ? lcOf(b) / maxLc : 0;
    return { name: b.name, priceScore, lcScore, total: pw * priceScore + lw * lcScore, rank: 0 };
  });
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  sorted.forEach((r, i) => (r.rank = i + 1));
  return rows.map((r) => ({ ...r, rank: sorted.indexOf(r) + 1 }));
}
