import { describe, it, expect } from 'vitest';
import { bubblePoints, R_MIN, R_MAX, type BubbleIn } from './kraljicPack';

const B = (o: Partial<BubbleIn> & Pick<BubbleIn, 'supplierId' | 'quadrant'>): BubbleIn => ({ name: o.supplierId, spendSAR: null, latest: null, ...o });

describe('bubble chart points (item 14)', () => {
  it('uses the latest scored review and marks it scored', () => {
    const [b] = bubblePoints([B({ supplierId: 'a', quadrant: 'strategic', latest: { riskPct: 80, profitPct: 70 } })]);
    expect(b.x).toBe(80); expect(b.y).toBe(70); expect(b.scored).toBe(true);
  });
  it('without a score it sits in its quadrant and is marked not scored', () => {
    const pts = bubblePoints([B({ supplierId: 'a', quadrant: 'bottleneck' }), B({ supplierId: 'b', quadrant: 'leverage' }), B({ supplierId: 'c', quadrant: 'non-critical' }), B({ supplierId: 'd', quadrant: 'strategic' })]);
    for (const p of pts) expect(p.scored).toBe(false);
    expect(pts[0].x).toBeGreaterThan(50); expect(pts[0].y).toBeLessThan(50);
    expect(pts[1].x).toBeLessThan(50); expect(pts[1].y).toBeGreaterThan(50);
    expect(pts[2].x).toBeLessThan(50); expect(pts[2].y).toBeLessThan(50);
    expect(pts[3].x).toBeGreaterThan(50); expect(pts[3].y).toBeGreaterThan(50);
  });
  it('spreads unscored bubbles of one quadrant so they do not sit on top of each other', () => {
    const pts = bubblePoints(Array.from({ length: 9 }, (_, i) => B({ supplierId: 's' + i, quadrant: 'leverage' })));
    const keys = new Set(pts.map((p) => `${p.x},${p.y}`));
    expect(keys.size).toBe(9);
    for (const p of pts) { expect(p.x).toBeGreaterThanOrEqual(6); expect(p.x).toBeLessThanOrEqual(94); expect(p.x).toBeLessThan(50); }
  });
  it('size follows spend; unknown spend is the smallest and flagged', () => {
    const pts = bubblePoints([B({ supplierId: 'big', quadrant: 'leverage', spendSAR: 1_000_000 }), B({ supplierId: 'small', quadrant: 'leverage', spendSAR: 10_000 }), B({ supplierId: 'none', quadrant: 'leverage', spendSAR: null }), B({ supplierId: 'zero', quadrant: 'leverage', spendSAR: 0 })]);
    expect(pts[0].r).toBe(R_MAX); expect(pts[1].r).toBeGreaterThan(R_MIN); expect(pts[1].r).toBeLessThan(R_MAX);
    expect(pts[2].r).toBe(R_MIN); expect(pts[2].spendKnown).toBe(false); expect(pts[3].spendKnown).toBe(false);
  });
  it('clamps out-of-range scores and ignores non-finite ones', () => {
    const [a, b] = bubblePoints([B({ supplierId: 'a', quadrant: 'leverage', latest: { riskPct: 150, profitPct: -5 } }), B({ supplierId: 'b', quadrant: 'leverage', latest: { riskPct: NaN, profitPct: 40 } })]);
    expect(a.x).toBe(100); expect(a.y).toBe(0);
    expect(b.scored).toBe(false);
  });
  it('empty input gives no bubbles', () => { expect(bubblePoints([])).toEqual([]); });
});
