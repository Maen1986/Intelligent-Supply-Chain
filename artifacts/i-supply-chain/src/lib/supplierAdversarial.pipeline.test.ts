/**
 * Round C (#668) -- adversarial pipeline test.
 * Real client path: CSV text -> import -> merge -> decisions -> weekly actions
 * -> portfolio summary -> client-pack CSV -> signal feed.
 * Every failure prints its seed so it reproduces exactly.
 */
import { describe, it, expect } from 'vitest';
import { parseScoresCsv, parseCarsCsv, mergeImport, parseCsvText } from './supplierPortfolioImport';
import { buildDecisions, buildWeeklyActions } from './supplierDecisionView';
import { buildPortfolioSummary, buildClientPackCsv } from './supplierPortfolioSummary';
import { toSignalFeed } from './supplierEvidenceLinks';
import type { SupplierRecord } from './supplierRecoveryPortfolio';
import {
  rng, pick, int, findBad, findCsvInjection,
  HOSTILE_NAMES, HOSTILE_NUMBER_STRINGS, HOSTILE_PERIODS, HOSTILE_DATES, QUADRANT_WORDS, HOSTILE_BOM,
} from './supplierAdversarialKit';

const ASOF = '2026-11-01';
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const ctx = { asOfIso: ASOF, categoryItems: [], shares: [] };

function hostileScoresCsv(seed: number): string {
  const r = rng(seed);
  const nl = pick(r, ['\n', '\r\n', '\r']);
  const rows: string[] = ['supplier,category,quadrant,period,score,annual_spend_sar'];
  const n = int(r, 0, 40);
  for (let i = 0; i < n; i++) {
    rows.push([q(pick(r, HOSTILE_NAMES)), q(pick(r, HOSTILE_NAMES)), pick(r, QUADRANT_WORDS), pick(r, HOSTILE_PERIODS), pick(r, HOSTILE_NUMBER_STRINGS), pick(r, HOSTILE_NUMBER_STRINGS)].join(','));
  }
  let text = rows.join(nl);
  if (r() < 0.2) text = HOSTILE_BOM + text;
  if (r() < 0.1) text = text.slice(0, Math.floor(text.length * r()));          // truncated upload
  if (r() < 0.1) text += `${nl}"unterminated,quote,row`;                        // broken quoting
  return text;
}
function hostileCarsCsv(seed: number): string {
  const r = rng(seed);
  const rows = ['supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact'];
  const n = int(r, 0, 30);
  for (let i = 0; i < n; i++) {
    rows.push([
      q(pick(r, HOSTILE_NAMES)), q(pick(r, HOSTILE_NAMES)), pick(r, ['quality', 'delivery', '', 'weird']), pick(r, ['delivery', 'cost', '', 'x']),
      q(pick(r, HOSTILE_NAMES)), pick(r, ['open', 'closed', 'in-progress', '', 'done']), pick(r, HOSTILE_DATES), pick(r, HOSTILE_DATES),
      pick(r, ['supplier', 'client', '', 'nobody']), pick(r, HOSTILE_NUMBER_STRINGS), pick(r, ['estimated', 'actual', '', 'guess']), pick(r, ['internal', 'external', '']),
    ].join(','));
  }
  return rows.join(pick(r, ['\n', '\r\n']));
}

const SEEDS = Array.from({ length: 400 }, (_, i) => 1000 + i);

describe('R-C hostile CSV import: never throws, never invents, always reconciles', () => {
  it('parseCsvText survives hostile text', () => {
    for (const s of SEEDS) {
      expect(() => parseCsvText(hostileScoresCsv(s)), `seed ${s}`).not.toThrow();
    }
  });

  it('parseScoresCsv: invariants hold for 400 hostile files', () => {
    const failures: string[] = [];
    for (const s of SEEDS) {
      const text = hostileScoresCsv(s);
      let res;
      try { res = parseScoresCsv(text); } catch (e) { failures.push(`seed ${s}: THROW ${(e as Error).message}`); continue; }
      const { suppliers, report } = res;
      if (report.rowsRead !== report.rowsAccepted + report.rejected.length) failures.push(`seed ${s}: rowsRead ${report.rowsRead} != accepted ${report.rowsAccepted} + rejected ${report.rejected.length}`);
      const ids = new Set<string>();
      for (const sup of suppliers) {
        if (!sup.supplierId) failures.push(`seed ${s}: empty supplierId for "${sup.name.slice(0, 30)}"`);
        if (ids.has(sup.supplierId)) failures.push(`seed ${s}: DUPLICATE supplierId ${sup.supplierId} for distinct suppliers`);
        ids.add(sup.supplierId);
        if (!sup.name.trim()) failures.push(`seed ${s}: blank supplier name accepted`);
        if (sup.scoreHistory12mo.some((x) => !Number.isFinite(x) || x < 0 || x > 100)) failures.push(`seed ${s}: score out of 0-100 in ${sup.name.slice(0, 20)}`);
        if (sup.scorePeriods && sup.scorePeriods.length !== sup.scoreHistory12mo.length) failures.push(`seed ${s}: periods/scores length mismatch`);
        if (sup.annualSpendSAR != null && (!Number.isFinite(sup.annualSpendSAR) || sup.annualSpendSAR < 0)) failures.push(`seed ${s}: bad spend ${sup.annualSpendSAR}`);
      }
      const bad = findBad({ suppliers, report });
      if (bad.length) failures.push(`seed ${s}: leak ${bad[0]!.path} ${bad[0]!.reason} "${bad[0]!.sample}"`);
    }
    expect(failures.slice(0, 15)).toEqual([]);
  });

  it('parseCarsCsv: invariants hold for 400 hostile files', () => {
    const failures: string[] = [];
    for (const s of SEEDS) {
      let res;
      try { res = parseCarsCsv(hostileCarsCsv(s)); } catch (e) { failures.push(`seed ${s}: THROW ${(e as Error).message}`); continue; }
      const { cars, report } = res;
      if (report.rowsRead !== report.rowsAccepted + report.rejected.length) failures.push(`seed ${s}: rowsRead != accepted+rejected`);
      for (const c of cars) {
        if (c.closedAt && c.createdAt && c.closedAt < c.createdAt) failures.push(`seed ${s}: CAR ${c.id} closes before it opens (${c.createdAt} > ${c.closedAt})`);
        if (c.status === 'closed' && !c.closedAt) failures.push(`seed ${s}: CAR ${c.id} closed with no close date`);
        if (c.status !== 'closed' && c.closedAt) failures.push(`seed ${s}: CAR ${c.id} open but has close date`);
        if (c.costUSD != null && (!Number.isFinite(c.costUSD) || c.costUSD < 0)) failures.push(`seed ${s}: CAR ${c.id} bad cost ${c.costUSD}`);
      }
      const bad = findBad({ cars, report });
      if (bad.length) failures.push(`seed ${s}: leak ${bad[0]!.path} "${bad[0]!.sample}"`);
    }
    expect(failures.slice(0, 15)).toEqual([]);
  });

  it('no prototype pollution from hostile names', () => {
    parseScoresCsv('supplier,period,score\n__proto__,2026-01,50\nconstructor,2026-02,50\nprototype,2026-03,50\n');
    parseCarsCsv('supplier,car_id,category,dimension,root_cause,status,opened\n__proto__,__proto__,quality,delivery,__proto__,open,2026-01-01\n');
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect(Object.keys(Object.prototype)).toEqual([]);
  });
});

describe('R-C full pipeline on hostile portfolios: decisions, actions, summary, exports', () => {
  it('300 hostile portfolios: no throw, no NaN/undefined leak, no formula injection in CSV export', () => {
    const failures: string[] = [];
    for (const s of SEEDS.slice(0, 300)) {
      try {
        const sc = parseScoresCsv(hostileScoresCsv(s));
        const cr = parseCarsCsv(hostileCarsCsv(s + 7));
        const { merged } = mergeImport([], sc.suppliers, cr.cars);
        const decisions = buildDecisions(merged, ctx);
        const actions = buildWeeklyActions(decisions, ASOF);
        const summary = buildPortfolioSummary(decisions, ASOF);
        const csv = buildClientPackCsv(decisions, actions);
        const feed = toSignalFeed(decisions, ASOF);
        const bad = findBad({ decisions, actions, summary, feed });
        if (bad.length) failures.push(`seed ${s}: leak ${bad[0]!.path} ${bad[0]!.reason} "${bad[0]!.sample}"`);
        const inj = findCsvInjection(csv);
        if (inj.length) failures.push(`seed ${s}: CSV injection cell "${inj[0]}"`);
        if (decisions.length !== merged.length) failures.push(`seed ${s}: decisions ${decisions.length} != suppliers ${merged.length}`);
        JSON.stringify({ decisions, summary });
      } catch (e) { failures.push(`seed ${s}: THROW ${(e as Error).message.slice(0, 120)}`); }
    }
    expect(failures.slice(0, 15)).toEqual([]);
  });

  it('empty portfolio is a calm, honest state everywhere', () => {
    const decisions = buildDecisions([], ctx);
    expect(decisions).toEqual([]);
    expect(findBad(buildPortfolioSummary(decisions, ASOF))).toEqual([]);
    expect(() => buildClientPackCsv([], [])).not.toThrow();
    expect(buildWeeklyActions([], ASOF)).toEqual([]);
  });
});

describe('R-C merge policy: nothing silently overwritten', () => {
  const sup = (o: Partial<SupplierRecord> & { name: string }): SupplierRecord => ({
    supplierId: o.name, category: 'Cat', quadrant: 'strategic', quadrantPriorQuarter: null, scoreHistory12mo: [80, 80, 80, 80], cars: [], ...o,
  });
  it('re-importing scores WITHOUT a quadrant column must not downgrade a supplier the user already classed strategic', () => {
    const existing = [sup({ name: 'Gulf Co', quadrant: 'strategic' })];
    const incoming = parseScoresCsv('supplier,period,score\nGulf Co,2026-01,90\nGulf Co,2026-02,91\nGulf Co,2026-03,92\nGulf Co,2026-04,93\n').suppliers;
    const { merged } = mergeImport(existing, incoming, []);
    expect(merged[0]!.quadrant).toBe('strategic');
  });
  it('two different names must never share one supplierId', () => {
    const { suppliers } = parseScoresCsv('supplier,period,score\nA B,2026-01,50\nA-B,2026-01,60\nA  B!,2026-01,70\n');
    const ids = suppliers.map((x) => x.supplierId);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('re-import keeps annual spend and prior-quarter quadrant the user already had when the file omits them', () => {
    const existing = [sup({ name: 'Gulf Co', annualSpendSAR: 5_000_000, quadrantPriorQuarter: 'leverage' })];
    const incoming = parseScoresCsv('supplier,period,score\nGulf Co,2026-01,90\n').suppliers;
    const { merged } = mergeImport(existing, incoming, []);
    expect(merged[0]!.annualSpendSAR).toBe(5_000_000);
    expect(merged[0]!.quadrantPriorQuarter).toBe('leverage');
  });
});
