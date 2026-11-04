// Round C #668 browser walkthrough finding RC-6: hostile numbers in a Kraljic CSV (Infinity, 1e999, NaN)
// previously reached the page as annualSpend=Infinity ("SAR ∞" / "NaN" in the breakdown).
import { describe, it, expect } from 'vitest';
import { parseCSV } from './kraljicScoring';

describe('parseCSV hostile numbers (RC-6)', () => {
  it('never returns a non-finite number', () => {
    const csv = 'Category,Sub,Item,Spend,Qty\nHW,x,A,Infinity,NaN\nHW,x,B,1e999,-Infinity\nHW,x,C,5000,2';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(3);
    for (const r of rows) for (const v of Object.values(r)) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    expect(rows[0].annualSpend).toBe(0);
    expect(rows[1].annualSpend).toBe(0);
    expect(rows[2].annualSpend).toBe(5000);
  });
  it('caps absurd finite values', () => {
    const rows = parseCSV('Category,Sub,Item,Spend\nHW,x,A,9e300');
    expect(rows[0].annualSpend).toBe(1e15);
  });
});
