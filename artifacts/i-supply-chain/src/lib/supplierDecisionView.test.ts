import { describe, it, expect } from 'vitest';
import {
  computeCauseMix, recommend, buildSupplierDecision, buildDecisions, buildWeeklyActions, computeCategoryConcentration, computeTier,
  FIX_OUR_SIDE_MIN_PCT, DUE_DAYS_BY_TIER, OVERDUE_CAR_DAYS, ACTION_CATALOGUE,
} from './supplierDecisionView';
import { buildPortfolioSummary, buildClientPackCsv } from './supplierPortfolioSummary';
import { assessESG, ESG_THEMES, ESG_STALE_AFTER_DAYS } from './supplierESG';
import { parseScoresCsv, parseCarsCsv, mergeImport } from './supplierPortfolioImport';
import { detectSupplier, verifyRecovery, type SupplierRecord, type CARRecord } from './supplierRecoveryPortfolio';

const ASOF = '2026-11-01';
const car = (id: string, rc: string, created: string, o: Partial<CARRecord> = {}): CARRecord => ({
  id, supplierId: 's', category: 'delivery', scorecardDimension: 'delivery', rootCause: rc, status: 'open', createdAt: created, closedAt: null, ...o,
});
const sup = (o: Partial<SupplierRecord> & { name: string }): SupplierRecord => ({
  supplierId: o.name, category: 'Cat', quadrant: 'leverage', quadrantPriorQuarter: null,
  scoreHistory12mo: [85, 85, 85, 85, 85, 85], cars: [], ...o,
});
const ctx = (all: SupplierRecord[]) => ({ asOfIso: ASOF, categoryItems: [], shares: [], allSuppliers: all });

describe('cause mix -- is it really the supplier\'s fault?', () => {
  it('unassessed is its own bucket and is never counted as supplier fault', () => {
    const m = computeCauseMix(sup({ name: 'A', cars: [car('1', 'x', '2026-01-01'), car('2', 'x', '2026-02-01', { cause: 'client' })] }));
    expect(m.counts.unassessed).toBe(1);
    expect(m.assessed).toBe(1);
    expect(m.supplierCausedPctOfAssessed).toBe(0);
    expect(m.notSupplierCausedPctOfAssessed).toBe(100);
  });
  it('no CARs: percentages null, not 0', () => {
    const m = computeCauseMix(sup({ name: 'A' }));
    expect(m.supplierCausedPctOfAssessed).toBeNull();
    expect(m.dominant).toBeNull();
  });
});

describe('recommendation: primary + alternative, trade-off always present (rule 8)', () => {
  const declining = [95, 92, 89, 86, 83, 80, 77, 74];
  it('every catalogue action has bilingual title and what-to-do', () => {
    for (const a of Object.values(ACTION_CATALOGUE)) {
      expect(a.title.en && a.title.ar && a.whatToDo.en && a.whatToDo.ar).toBeTruthy();
    }
  });
  it('healthy supplier -> MONITOR with a different alternative and a trade-off', () => {
    const s = sup({ name: 'A' });
    const d = buildSupplierDecision(s, ctx([s]));
    expect(d.recommendation.primary.key).toBe('MONITOR');
    expect(d.recommendation.alternative.key).not.toBe(d.recommendation.primary.key);
    expect(d.recommendation.tradeoff.en && d.recommendation.tradeoff.ar).toBeTruthy();
    expect(d.tier).toBe('low');
  });
  it('declining, no repeat -> DEVELOPMENT_PLAN, alternative FORMAL_SCAR', () => {
    const s = sup({ name: 'A', scoreHistory12mo: declining });
    const d = buildSupplierDecision(s, ctx([s]));
    expect(d.recommendation.primary.key).toBe('DEVELOPMENT_PLAN');
    expect(d.recommendation.alternative.key).toBe('FORMAL_SCAR');
  });
  it('core M07 rule: mostly NOT supplier-caused -> fix our side first, even when declining', () => {
    const s = sup({ name: 'A', scoreHistory12mo: declining, cars: [car('1', 'x', '2026-01-01', { cause: 'client' }), car('2', 'y', '2026-02-01', { cause: 'measurement' })] });
    const d = buildSupplierDecision(s, ctx([s]));
    expect(d.recommendation.primary.key).toBe('FIX_OUR_SIDE');
  });
  it('boundary: exactly 50% not-supplier with 2 assessed triggers; 1 assessed does not', () => {
    expect(FIX_OUR_SIDE_MIN_PCT).toBe(50);
    const two = sup({ name: 'A', scoreHistory12mo: declining, cars: [car('1', 'x', '2026-01-01', { cause: 'client' }), car('2', 'y', '2026-02-01', { cause: 'supplier' })] });
    expect(buildSupplierDecision(two, ctx([two])).recommendation.primary.key).toBe('FIX_OUR_SIDE');
    const one = sup({ name: 'B', scoreHistory12mo: declining, cars: [car('1', 'x', '2026-01-01', { cause: 'client' })] });
    expect(buildSupplierDecision(one, ctx([one])).recommendation.primary.key).toBe('DEVELOPMENT_PLAN');
  });
  const repeat = (q: SupplierRecord['quadrant']) => sup({
    name: 'R', quadrant: q, scoreHistory12mo: declining,
    cars: [car('1', 'rc', '2026-01-01', { status: 'closed', closedAt: '2026-02-01', cause: 'supplier' }), car('2', 'rc', '2026-04-01', { status: 'closed', closedAt: '2026-05-01', cause: 'supplier' }), car('3', 'rc', '2026-08-01', { cause: 'supplier' })],
  });
  it('3rd occurrence on a STRATEGIC supplier -> qualify second source, alternative contract remedy (not exit)', () => {
    const s = repeat('strategic');
    const d = buildSupplierDecision(s, ctx([s]));
    expect(d.detection.recurrenceCount).toBe(2);
    expect(d.recommendation.primary.key).toBe('QUALIFY_SECOND_SOURCE');
    expect(d.recommendation.alternative.key).toBe('CONTRACT_REMEDY');
    expect(d.tier).toBe('critical');
  });
  it('3rd occurrence on a NON-CRITICAL supplier -> competitive RFP, alternative second source', () => {
    const s = repeat('non-critical');
    const d = buildSupplierDecision(s, ctx([s]));
    expect(d.recommendation.primary.key).toBe('COMPETITIVE_RFP');
    expect(d.recommendation.alternative.key).toBe('QUALIFY_SECOND_SOURCE');
  });
  it('closed-not-recovered on an otherwise healthy rung escalates to FORMAL_SCAR (direct, non-vacuous)', () => {
    const s = sup({ name: 'N' });
    const det = { ...detectSupplier(s), recommendedIntervention: 'REPAIR' as const, trend: 'stable' as const };
    const rec = recommend(det, computeCauseMix(s), s.quadrant, { ...verifyRecovery(s), status: 'CLOSED_NOT_RECOVERED' }, null);
    expect(rec.primary.key).toBe('FORMAL_SCAR');
    expect(rec.alternative.key).toBe('CHECK_IN');
  });
  it('M02 link: quadrant-specific solution set and ideal posture are attached (real data, not text)', () => {
    const s = sup({ name: 'A', quadrant: 'bottleneck' });
    const rec = buildSupplierDecision(s, ctx([s])).recommendation;
    expect(rec.quadrantActions.length).toBeGreaterThan(0);
    expect(rec.idealPosture).toBe('collaborative');
  });
});

describe('M05 link: category concentration from real client spend', () => {
  it('computes HHI only when every supplier in the category has spend', () => {
    const a = sup({ name: 'A', annualSpendSAR: 800 });
    const b = sup({ name: 'B', annualSpendSAR: 200 });
    const c = computeCategoryConcentration([a, b], a);
    expect(c.basis).toBe('client-supplied-spend');
    expect(c.hhi).toBe(6800); // 80^2 + 20^2
    expect(c.band).toBe('highlyConcentrated');
    expect(c.supplierSharePct).toBe(80);
  });
  it('hardest: one peer missing spend -> INSUFFICIENT_DATA (a partial set would understate concentration)', () => {
    const a = sup({ name: 'A', annualSpendSAR: 800 });
    const b = sup({ name: 'B' });
    expect(computeCategoryConcentration([a, b], a).basis).toBe('INSUFFICIENT_DATA');
  });
  it('a single supplier in a category is not a concentration reading', () => {
    const a = sup({ name: 'A', annualSpendSAR: 800 });
    expect(computeCategoryConcentration([a], a).basis).toBe('INSUFFICIENT_DATA');
  });
  it('high concentration on a replaceable supplier flips RFP to second-source-first', () => {
    const decl = [95, 92, 89, 86, 83, 80, 77, 74];
    const cars = [car('1', 'rc', '2026-01-01', { status: 'closed', closedAt: '2026-02-01' }), car('2', 'rc', '2026-04-01', { status: 'closed', closedAt: '2026-05-01' }), car('3', 'rc', '2026-08-01')];
    const a = sup({ name: 'A', quadrant: 'non-critical', scoreHistory12mo: decl, cars, annualSpendSAR: 900 });
    const b = sup({ name: 'B', annualSpendSAR: 100 });
    expect(buildSupplierDecision(a, ctx([a, b])).recommendation.primary.key).toBe('QUALIFY_SECOND_SOURCE');
  });
});

describe('weekly action list', () => {
  it('orders by tier then kind then due date; due dates follow the disclosed cadence', () => {
    const crit = sup({ name: 'Crit', quadrant: 'strategic', scoreHistory12mo: [95, 92, 89, 86, 83, 80, 77, 74], cars: [
      car('1', 'rc', '2026-01-01', { status: 'closed', closedAt: '2026-02-01', cause: 'supplier' }), car('2', 'rc', '2026-04-01', { status: 'closed', closedAt: '2026-05-01', cause: 'supplier' }), car('3', 'rc', '2026-08-01', { cause: 'supplier' })] });
    const med = sup({ name: 'Med', scoreHistory12mo: [95, 92, 89, 86, 83, 80, 77, 74] });
    const ok = sup({ name: 'Ok' });
    const ds = buildDecisions([ok, med, crit], { asOfIso: ASOF, categoryItems: [], shares: [] });
    const acts = buildWeeklyActions(ds, ASOF);
    expect(acts[0]!.supplierName).toBe('Crit');
    expect(acts[0]!.dueDate).toBe('2026-11-04');
    expect(DUE_DAYS_BY_TIER.critical).toBe(3);
    expect(acts.find((a) => a.supplierName === 'Ok')).toBeUndefined(); // healthy suppliers do not clutter the list
  });
  it('raises data-gap actions: uncosted open CAR, unassessed cause', () => {
    const s = sup({ name: 'A', cars: [car('1', 'x', '2026-10-01')] });
    const acts = buildWeeklyActions(buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] }), ASOF);
    expect(acts.filter((a) => a.kind === 'data-gap').map((a) => a.id).sort()).toEqual(['A:cause', 'A:cost']);
  });
  it('owner override is honoured', () => {
    const s = sup({ name: 'A', scoreHistory12mo: [95, 92, 89, 86, 83, 80, 77, 74] });
    const acts = buildWeeklyActions(buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] }), ASOF, { A: 'Sara' });
    expect(acts[0]!.owner).toBe('Sara');
  });
  it('boundary: CAR open exactly 90 days is NOT overdue; 91 is', () => {
    const mk = (created: string) => buildSupplierDecision(sup({ name: 'A', cars: [car('1', 'x', created)] }), ctx([]));
    expect(OVERDUE_CAR_DAYS).toBe(90);
    expect(mk('2026-08-03').signals.some((x) => x.key === 'overdue-car')).toBe(false); // 90 days before 2026-11-01
    expect(mk('2026-08-02').signals.some((x) => x.key === 'overdue-car')).toBe(true);
  });
  it('empty portfolio -> empty list', () => {
    expect(buildWeeklyActions([], ASOF)).toEqual([]);
  });
});

describe('ESG: evidence, not a score', () => {
  it('nothing recorded -> NOT_ASSESSED with four gap themes', () => {
    const a = assessESG(undefined, ASOF);
    expect(a.coverage).toBe('NOT_ASSESSED');
    expect(a.gapThemes).toHaveLength(ESG_THEMES.length);
  });
  it('third-party verified is strong; self-declared is partial; stale beats strong', () => {
    const a = assessESG({
      environment: { level: 'third_party_verified', checkedOn: '2026-06-01' },
      ethics: { level: 'self_declared' },
      labor_human_rights: { level: 'third_party_verified', checkedOn: '2024-01-01' },
    }, ASOF);
    const by = Object.fromEntries(a.themes.map((t) => [t.theme, t.status]));
    expect(by.environment).toBe('strong');
    expect(by.ethics).toBe('partial');
    expect(by.labor_human_rights).toBe('stale');
    expect(by.sustainable_procurement).toBe('gap');
    expect(a.coverage).toBe('PARTIAL');
  });
  it('boundary: exactly 365 days is not stale, 366 is', () => {
    expect(ESG_STALE_AFTER_DAYS).toBe(365);
    expect(assessESG({ ethics: { level: 'documented_policy', checkedOn: '2025-11-01' } }, ASOF).themes[2]!.status).toBe('partial');
    expect(assessESG({ ethics: { level: 'documented_policy', checkedOn: '2025-10-31' } }, ASOF).themes[2]!.status).toBe('stale');
  });
  it('no composite score field exists in the output', () => {
    expect(Object.keys(assessESG(undefined, ASOF))).not.toContain('score');
  });
});

describe('portfolio summary: data confidence is shown beside the headline', () => {
  it('reports costed-CAR coverage so a CFO sees what the cost number rests on', () => {
    const s = sup({ name: 'A', cars: [car('1', 'x', '2026-01-01', { estimatedCostUSD: 1000, cause: 'supplier' }), car('2', 'y', '2026-02-01'), car('3', 'z', '2026-03-01'), car('4', 'w', '2026-04-01')] });
    const sum = buildPortfolioSummary(buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] }), ASOF);
    expect(sum.copq.totalUSD).toBe(1000);
    expect(sum.confidence.pctCarsCosted).toBe(25);
    expect(sum.confidence.pctCarsWithCause).toBe(25);
    expect(sum.headline.en).toMatch(/1 of 4 CARs/);
    expect(sum.headline.ar).toMatch(/1 من 4/);
  });
  it('no costs at all -> total is null, headline says not available (never $0)', () => {
    const s = sup({ name: 'A', cars: [car('1', 'x', '2026-01-01')] });
    const sum = buildPortfolioSummary(buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] }), ASOF);
    expect(sum.copq.totalUSD).toBeNull();
    expect(sum.headline.en).toMatch(/not available/);
  });
  it('empty portfolio: no division by zero, nulls not NaN', () => {
    const sum = buildPortfolioSummary([], ASOF);
    expect(sum.confidence.pctCarsCosted).toBeNull();
    expect(sum.confidence.pctSuppliersWithSpend).toBeNull();
    expect(sum.supplierCount).toBe(0);
  });
  it('escalated suppliers without spend are counted as unknown exposure, not zero', () => {
    const s = sup({ name: 'A', scoreHistory12mo: [95, 92, 89, 86, 83, 80, 77, 74] });
    const sum = buildPortfolioSummary(buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] }), ASOF);
    expect(sum.exposureEscalatedUnknownCount).toBe(1);
    expect(sum.exposureEscalatedSAR).toBe(0);
  });
});

describe('client pack CSV', () => {
  it('escapes commas/quotes and carries bilingual columns', () => {
    const s = sup({ name: 'Acme, "Inc"' });
    const ds = buildDecisions([s], { asOfIso: ASOF, categoryItems: [], shares: [] });
    const csv = buildClientPackCsv(ds, buildWeeklyActions(ds, ASOF));
    expect(csv.split('\n')[0]).toContain('primary_ar');
    expect(csv).toContain('"Acme, ""Inc"""');
  });
});

describe('CHAINED: import -> M07 detection -> decision -> summary -> pack (cross-module, rule 7)', () => {
  it('a realistic exported portfolio flows end to end with no demo data anywhere', () => {
    const scoresCsv = [
      'supplier,category,quadrant,period,score,annual_spend_sar',
      ...['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map((p, i) => `Alpha Freight,Logistics,bottleneck,${p},${[92, 90, 87, 84, 80, 76, 72, 68][i]},${i === 0 ? 6000000 : ''}`),
      ...['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map((p, i) => `Beta Haulage,Logistics,leverage,${p},${[88, 88, 89, 87, 88, 89, 88, 88][i]},${i === 0 ? 1000000 : ''}`),
    ].join('\n');
    const carsCsv = [
      'supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact',
      'Alpha Freight,A1,delivery,delivery,route-disruption,closed,2026-01-10,2026-02-15,supplier,9000,observed,internal',
      'Alpha Freight,A2,delivery,delivery,route-disruption,closed,2026-04-10,2026-05-15,supplier,12000,observed,internal',
      'Alpha Freight,A3,delivery,delivery,route-disruption,open,2026-08-01,,supplier,15000,estimated,external',
    ].join('\n');
    const sc = parseScoresCsv(scoresCsv);
    const cr = parseCarsCsv(carsCsv);
    expect(sc.report.rejected).toHaveLength(0);
    expect(cr.report.rejected).toHaveLength(0);
    const { merged } = mergeImport([], sc.suppliers, cr.cars);
    const ds = buildDecisions(merged, { asOfIso: ASOF, categoryItems: [], shares: [] });
    const alpha = ds.find((d) => d.supplier.name === 'Alpha Freight')!;
    const beta = ds.find((d) => d.supplier.name === 'Beta Haulage')!;

    // M07: per-root-cause recurrence (2 prior), bottleneck supplier
    expect(alpha.detection.recurrenceCount).toBe(2);
    // M05: concentration from real spend (6.0M vs 1.0M => 85.7% / 14.3%)
    expect(alpha.concentration.basis).toBe('client-supplied-spend');
    expect(alpha.concentration.band).toBe('highlyConcentrated');
    // M02: bottleneck + recurrence -> second source, not exit; alternative is the contract remedy
    expect(alpha.recommendation.primary.key).toBe('QUALIFY_SECOND_SOURCE');
    expect(alpha.recommendation.alternative.key).toBe('CONTRACT_REMEDY');
    expect(alpha.tier).toBe('critical');
    // M01 COPQ: real costs, external failure flagged
    expect(alpha.copq.totalUSD).toBe(36000);
    expect(alpha.copq.externalSharePct).toBeGreaterThan(0);
    // M06/M03 hand-off package carries verified facts
    expect(alpha.evidence.handoffTo.map((h) => h.module)).toEqual(['M06', 'M03']);
    expect(alpha.evidence.costedCarCount).toBe(3);
    // healthy peer stays out of the weekly list
    expect(beta.tier).toBe('low');
    const actions = buildWeeklyActions(ds, ASOF);
    expect(actions[0]!.supplierName).toBe('Alpha Freight');
    expect(actions.some((a) => a.supplierName === 'Beta Haulage' && a.kind === 'decision')).toBe(false);
    // summary agrees with the per-supplier numbers (one source of truth)
    const sum = buildPortfolioSummary(ds, ASOF);
    expect(sum.copq.totalUSD).toBe(alpha.copq.totalUSD);
    expect(sum.exposureEscalatedSAR).toBe(6000000);
    expect(sum.confidence.pctCarsCosted).toBe(100);
    expect(sum.confidence.pctSuppliersWithPeriodLabels).toBe(100);
  });
});

describe('tier is ordinal, never a composite', () => {
  it('computeTier on no signals is low', () => {
    expect(computeTier({ recommendedIntervention: 'REPAIR', combinedSignalFlag: false } as never, [])).toBe('low');
  });
});
