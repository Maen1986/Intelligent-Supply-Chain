/**
 * Round C (#668) -- SCALE. A real client portfolio can be thousands of suppliers; the pipeline must stay
 * usable (time budget) and linear-ish. Budgets are deliberately generous (CI machines vary) but would
 * fail an O(n^2) regression at 10k.
 */
import { describe, it, expect } from 'vitest';
import { parseScoresCsv, parseCarsCsv, mergeImport } from './supplierPortfolioImport';
import { buildDecisions, buildWeeklyActions } from './supplierDecisionView';
import { buildPortfolioSummary, buildClientPackCsv } from './supplierPortfolioSummary';
import { rng, pick, int } from './supplierAdversarialKit';

const CATS = ['Packaging', 'Freight', 'Raw material', 'IT', 'مواد التعبئة', 'Facilities', ''];
const QUADS = ['strategic', 'leverage', 'bottleneck', 'non-critical', ''];
function scoresCsv(n: number, seed: number): string {
  const r = rng(seed); const rows = ['supplier,category,quadrant,period,score,annual_spend_sar'];
  for (let i = 0; i < n; i++) {
    const name = i % 7 === 0 ? `مورد ${i}` : `Supplier ${i} Co.`;
    const cat = pick(r, CATS); const q = pick(r, QUADS); const spend = r() < 0.2 ? '' : String(int(r, 1000, 9_000_000));
    for (let m = 1; m <= 4; m++) rows.push(`${name},${cat},${q},2026-0${m},${int(r, 30, 99)},${m === 1 ? spend : ''}`);
  }
  return rows.join('\n');
}
function carsCsv(n: number, seed: number): string {
  const r = rng(seed); const rows = ['supplier,car_id,category,dimension,root_cause,status,opened,closed,cause,cost_usd,cost_basis,customer_impact'];
  for (let i = 0; i < n; i++) rows.push(`Supplier ${i} Co.,CAR-${i}-1,quality,quality,rc-${i % 50},open,2026-02-0${1 + (i % 8)},,,${int(r, 0, 5000)},estimate,none`);
  return rows.join('\n');
}
function run(n: number) {
  const t: Record<string, number> = {}; const tick = (k: string, t0: number) => { t[k] = Math.round(performance.now() - t0); };
  let t0 = performance.now();
  const s = parseScoresCsv(scoresCsv(n, 11)); tick('parseScores', t0);
  t0 = performance.now(); const c = parseCarsCsv(carsCsv(Math.floor(n / 2), 12)); tick('parseCars', t0);
  t0 = performance.now(); const { merged } = mergeImport([], s.suppliers, c.cars); tick('merge', t0);
  t0 = performance.now(); const d = buildDecisions(merged, { asOfIso: '2026-05-01', categoryItems: [], shares: [] }); tick('decisions', t0);
  t0 = performance.now(); const a = buildWeeklyActions(d, '2026-05-01'); tick('actions', t0);
  t0 = performance.now(); const sum = buildPortfolioSummary(d, '2026-05-01'); tick('summary', t0);
  t0 = performance.now(); const csv = buildClientPackCsv(d, a); tick('csv', t0);
  return { t, n: merged.length, decisions: d.length, actions: a.length, csvLen: csv.length, sum };
}

describe('R-C scale: import -> merge -> decisions -> actions -> summary -> CSV', () => {
  it('1,000 suppliers stays under 5 s and keeps every supplier', () => {
    const r = run(1000); console.log('SCALE 1k', JSON.stringify(r.t));
    expect(r.n).toBe(1000); expect(r.decisions).toBe(1000);
    expect(Object.values(r.t).reduce((a, b) => a + b, 0)).toBeLessThan(5000);
  });
  it("5,000 suppliers stays under 8 s", () => {
    const r = run(5000); console.log('SCALE 5k', JSON.stringify(r.t));
    expect(r.n).toBe(5000);
    expect(Object.values(r.t).reduce((a, b) => a + b, 0)).toBeLessThan(8000);
  }, 60000);
  it('50,000 suppliers (messy, bilingual) finishes under 60 s with every supplier kept and no duplicate id', () => {
    const r = run(50000); console.log('SCALE 50k', JSON.stringify(r.t));
    expect(r.n).toBe(50000); expect(r.decisions).toBe(50000);
    expect(Object.values(r.t).reduce((a, b) => a + b, 0)).toBeLessThan(60000);
  }, 120000);
  it('10,000 suppliers: time budget 15 s and the process heap stays under 1.5 GB afterwards (absolute, not a delta -- GC makes deltas meaningless)', () => {
    const r = run(10000); const heapMB = process.memoryUsage().heapUsed / 1e6;
    console.log('SCALE 10k heap MB', Math.round(heapMB), JSON.stringify(r.t));
    expect(Object.values(r.t).reduce((a, b) => a + b, 0)).toBeLessThan(15000);
    expect(heapMB).toBeLessThan(1500);
  }, 90000);
});
