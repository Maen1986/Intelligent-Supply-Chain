/**
 * SI Module 07 -- Portfolio summary + client pack (Round B3, Nov 2026).
 *
 * The procurement head's and the consultant's view of the same data the
 * category manager works from. Everything here is derived from
 * SupplierDecision (supplierDecisionView.ts); nothing is re-computed
 * differently, so the three views can never disagree.
 *
 * Honesty: a "data confidence" block shows, as separate percentages (never a
 * composite), how much of the portfolio the headline numbers actually rest on.
 * A CFO reading "COPQ $120K" must also see that only 3 of 9 CARs were costed.
 */
import type { SupplierDecision, Tier, CauseKey, WeeklyAction, Bilingual } from './supplierDecisionView';
import { assessESG, ESG_THEMES, type ESGTheme } from './supplierESG';
import type { CategoryConcentration } from './supplierDecisionView';
import type { RecoveryVerificationStatus } from './supplierRecoveryPortfolio';
import { csvCell } from './csvSafe';

export interface DataConfidence {
  suppliers: number;
  cars: number;
  pctSuppliersWith4PlusPeriods: number | null;
  pctSuppliersWithSpend: number | null;
  pctSuppliersWithPeriodLabels: number | null;
  pctCarsWithCause: number | null;
  pctCarsCosted: number | null;
}

export interface PortfolioSummary {
  asOfIso: string;
  supplierCount: number;
  tierCounts: Record<Tier, number>;
  escalatedCount: number;
  copq: { totalUSD: number | null; costedCars: number; totalCars: number; externalFailureCars: number };
  costByCause: Record<CauseKey, { cars: number; costUSD: number | null }>;
  recovery: Record<RecoveryVerificationStatus, number>;
  exposureEscalatedSAR: number;
  exposureEscalatedUnknownCount: number;
  concentration: CategoryConcentration[];
  esg: { notAssessed: number; partial: number; full: number; gapByTheme: Record<ESGTheme, number> };
  confidence: DataConfidence;
  headline: Bilingual;
}

const pct = (n: number, d: number): number | null => (d === 0 ? null : Math.round((1000 * n) / d) / 10);

export function buildPortfolioSummary(decisions: SupplierDecision[], asOfIso: string): PortfolioSummary {
  const tierCounts: Record<Tier, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const recovery: Record<RecoveryVerificationStatus, number> = {
    VERIFIED_RECOVERED: 0, CLOSED_NOT_RECOVERED: 0, NOT_ENOUGH_POST_CLOSURE_DATA: 0, NO_CLOSED_CAR: 0, NO_PERIOD_LABELS: 0,
  };
  const causeKeys: CauseKey[] = ['supplier', 'client', 'shared', 'external', 'measurement', 'unassessed'];
  const costByCause = Object.fromEntries(causeKeys.map((k) => [k, { cars: 0, costUSD: null as number | null }])) as PortfolioSummary['costByCause'];

  let totalCost: number | null = null;
  let costedCars = 0;
  let totalCars = 0;
  let carsWithCause = 0;
  let externalCars = 0;
  let exposure = 0;
  let exposureUnknown = 0;
  let escalated = 0;
  const esg = { notAssessed: 0, partial: 0, full: 0, gapByTheme: Object.fromEntries(ESG_THEMES.map((t) => [t, 0])) as Record<ESGTheme, number> };
  const seenCat = new Set<string>();
  const concentration: CategoryConcentration[] = [];

  for (const d of decisions) {
    tierCounts[d.tier]++;
    recovery[d.recovery.status]++;
    const isEsc = d.detection.recommendedIntervention !== 'REPAIR';
    if (isEsc) {
      escalated++;
      if (d.exposure.exposureBasis === 'INSUFFICIENT_DATA') exposureUnknown++;
      else exposure += d.exposure.exposureSAR;
    }
    for (const c of d.supplier.cars) {
      totalCars++;
      const k: CauseKey = c.cause ?? 'unassessed';
      if (c.cause) carsWithCause++;
      costByCause[k].cars++;
      if (typeof c.estimatedCostUSD === 'number') {
        costedCars++;
        totalCost = (totalCost ?? 0) + c.estimatedCostUSD;
        costByCause[k].costUSD = (costByCause[k].costUSD ?? 0) + c.estimatedCostUSD;
      }
      if (c.customerImpact === 'external') externalCars++;
    }
    const a = assessESG(d.supplier.esg, asOfIso);
    if (a.coverage === 'NOT_ASSESSED') esg.notAssessed++;
    else if (a.coverage === 'PARTIAL') esg.partial++;
    else esg.full++;
    a.gapThemes.forEach((t) => esg.gapByTheme[t]++);
    if (d.supplier.category && !seenCat.has(d.supplier.category)) {
      seenCat.add(d.supplier.category);
      concentration.push(d.concentration);
    }
  }

  const n = decisions.length;
  const confidence: DataConfidence = {
    suppliers: n, cars: totalCars,
    pctSuppliersWith4PlusPeriods: pct(decisions.filter((d) => d.supplier.scoreHistory12mo.length >= 4).length, n),
    pctSuppliersWithSpend: pct(decisions.filter((d) => typeof d.supplier.annualSpendSAR === 'number' && d.supplier.annualSpendSAR > 0).length, n),
    pctSuppliersWithPeriodLabels: pct(decisions.filter((d) => d.supplier.scorePeriods && d.supplier.scorePeriods.length === d.supplier.scoreHistory12mo.length).length, n),
    pctCarsWithCause: pct(carsWithCause, totalCars),
    pctCarsCosted: pct(costedCars, totalCars),
  };

  const headline: Bilingual = {
    en: `${escalated} of ${n} suppliers need intervention (${tierCounts.critical} critical, ${tierCounts.high} high). Costed cost of poor quality: ${totalCost === null ? 'not available (no CAR has a cost)' : '$' + Math.round(totalCost).toLocaleString('en-US')} across ${costedCars} of ${totalCars} CARs.`,
    ar: `${escalated} من ${n} موردين يحتاجون تدخلاً (${tierCounts.critical} حرج، ${tierCounts.high} مرتفع). كلفة سوء الجودة المحتسبة: ${totalCost === null ? 'غير متاحة (لا يوجد طلب بتكلفة)' : '$' + Math.round(totalCost).toLocaleString('en-US')} عبر ${costedCars} من ${totalCars} طلباً.`,
  };

  return {
    asOfIso, supplierCount: n, tierCounts, escalatedCount: escalated,
    copq: { totalUSD: totalCost, costedCars, totalCars, externalFailureCars: externalCars },
    costByCause, recovery, exposureEscalatedSAR: exposure, exposureEscalatedUnknownCount: exposureUnknown,
    concentration, esg, confidence, headline,
  };
}


/** Client-pack CSV for consultants: one row per supplier decision, plus the
 * action list. English column headers (spreadsheet-safe); Arabic text is
 * carried in the *_ar columns. */
export function buildClientPackCsv(decisions: SupplierDecision[], actions: WeeklyAction[]): string {
  const head = ['section', 'supplier', 'tier', 'primary_en', 'primary_ar', 'alternative_en', 'alternative_ar', 'tradeoff_en', 'tradeoff_ar', 'recurrence', 'trend', 'recovery', 'costed_copq_usd', 'exposure_sar', 'exposure_basis', 'owner', 'due'];
  const lines = [head.join(',')];
  // Round C #668 (scale): index the decision actions once instead of a find() per supplier (O(n^2)).
  const decisionActions = new Map<string, WeeklyAction>();
  for (const x of actions) if (!decisionActions.has(x.id)) decisionActions.set(x.id, x);
  for (const d of decisions) {
    const a = decisionActions.get(`${d.supplier.supplierId}:decision`);
    lines.push([
      'decision', d.supplier.name, d.tier, d.recommendation.primary.title.en, d.recommendation.primary.title.ar,
      d.recommendation.alternative.title.en, d.recommendation.alternative.title.ar, d.recommendation.tradeoff.en, d.recommendation.tradeoff.ar,
      d.detection.recurrenceCount, d.detection.trend, d.recovery.status, d.copq.totalUSD, d.exposure.exposureSAR, d.exposure.exposureBasis, a?.owner ?? '', a?.dueDate ?? '',
    ].map(csvCell).join(','));
  }
  for (const a of actions.filter((x) => x.kind === 'data-gap')) {
    lines.push(['data-gap', a.supplierName, a.tier, a.title.en, a.title.ar, '', '', a.detail.en, a.detail.ar, '', '', '', '', '', '', a.owner, a.dueDate].map(csvCell).join(','));
  }
  return lines.join('\n');
}
