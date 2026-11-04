/** Round C #668 (RC-4/RC-5): typed adversarial tests for kraljicScoring + kraljicWorkspaceSync. */
import { describe, it, expect } from 'vitest';
import { parseCSV, scoreItems, newItem } from './kraljicScoring';
import { parseWorkspace, isEmptyWorkspace } from './kraljicWorkspaceSync';

const finiteScores = (r: ReturnType<typeof scoreItems>) =>
  r.every(s => [s.profitImpactScore, s.supplyRiskScore, s.spendPct].every(Number.isFinite));

describe('kraljicScoring hostile input', () => {
  it('empty list and all-zero spend never produce NaN', () => {
    expect(scoreItems([], null)).toEqual([]);
    expect(finiteScores(scoreItems([newItem(), newItem()], null))).toBe(true);
  });
  it('negative, huge and non-finite spend stay finite', () => {
    const items = [-5, 1e308, 1e999, NaN].map(v => newItem({ annualSpend: v }));
    expect(finiteScores(scoreItems(items, null))).toBe(true);
  });
  it('out-of-range ratings stay finite', () => {
    const it1 = newItem({ qualityImpact: -9, revenueImpact: 99, supplierCount: -1, leadTimeDays: NaN });
    expect(finiteScores(scoreItems([it1], 'nonexistent-industry'))).toBe(true);
  });
  it('parseCSV: junk, header-only, quotes and giant numbers do not throw or poison scores', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('category,sub')).toEqual([]);
    const rows = parseCSV('category,sub,item,spend\n"A","B","=1+1",1e999\nx,y,z,abc\n,,,');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(finiteScores(scoreItems(rows, null))).toBe(true);
  });
});

describe('kraljicWorkspaceSync defensive parse', () => {
  it('wrong shapes become null or empty, never throw', () => {
    for (const bad of [null, undefined, 1, 'x', [], true]) expect(parseWorkspace(bad)).toBeNull();
    const w = parseWorkspace({ facts: 5, reviews: [], extras: 'x', ledger: 'no' });
    expect(w).not.toBeNull();
    expect(isEmptyWorkspace(w!)).toBe(true);
  });
  it('ledger is capped at the last 500 entries', () => {
    const w = parseWorkspace({ ledger: Array.from({ length: 900 }, (_, i) => i) })!;
    expect(w.ledger.length).toBe(500);
    expect(w.ledger[499]).toBe(899);
  });
});
