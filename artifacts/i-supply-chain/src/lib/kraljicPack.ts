/**
 * Report pack helpers (Round B5, enrichment item 14).
 * Pure functions behind the portfolio bubble chart: where each supplier is
 * drawn, and how big. Position comes from the latest scored review when there
 * is one (risk to the right, profit upward, 0 to 100). Without a scored review
 * the bubble sits in its quadrant, spread out so bubbles do not overlap, and is
 * marked as not scored. Size follows annual spend; unknown spend gets the
 * smallest size and is marked so. ISC never invents a score.
 *
 * STANDALONE-FIRST: no imports.
 */
export type Quadrant = 'strategic' | 'leverage' | 'bottleneck' | 'non-critical';

export interface BubbleIn {
  supplierId: string;
  name: string;
  quadrant: Quadrant;
  spendSAR: number | null;
  latest: { riskPct: number; profitPct: number } | null;
}

export interface Bubble {
  supplierId: string;
  name: string;
  quadrant: Quadrant;
  /** 0..100, risk (left low, right high). */
  x: number;
  /** 0..100, profit potential (bottom low, top high). */
  y: number;
  r: number;
  scored: boolean;
  spendKnown: boolean;
}

const CENTRE: Record<Quadrant, { x: number; y: number }> = {
  strategic: { x: 75, y: 75 },
  leverage: { x: 25, y: 75 },
  bottleneck: { x: 75, y: 25 },
  'non-critical': { x: 25, y: 25 },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const R_MIN = 4;
export const R_MAX = 12;

export function bubblePoints(items: BubbleIn[]): Bubble[] {
  const maxSpend = items.reduce((m, i) => Math.max(m, i.spendSAR !== null && i.spendSAR > 0 ? i.spendSAR : 0), 0);
  const slot: Record<Quadrant, number> = { strategic: 0, leverage: 0, bottleneck: 0, 'non-critical': 0 };
  return items.map((i) => {
    const spendKnown = i.spendSAR !== null && i.spendSAR > 0;
    const r = spendKnown && maxSpend > 0 ? R_MIN + (R_MAX - R_MIN) * Math.sqrt((i.spendSAR as number) / maxSpend) : R_MIN;
    const ok = i.latest && Number.isFinite(i.latest.riskPct) && Number.isFinite(i.latest.profitPct);
    if (ok) {
      return { supplierId: i.supplierId, name: i.name, quadrant: i.quadrant, x: clamp(i.latest!.riskPct, 0, 100), y: clamp(i.latest!.profitPct, 0, 100), r, scored: true, spendKnown };
    }
    const n = slot[i.quadrant]++;
    const dx = ((n % 3) - 1) * 12;
    const dy = (((Math.floor(n / 3)) % 3) - 1) * 12;
    const c = CENTRE[i.quadrant];
    return { supplierId: i.supplierId, name: i.name, quadrant: i.quadrant, x: clamp(c.x + dx, 6, 94), y: clamp(c.y + dy, 6, 94), r, scored: false, spendKnown };
  });
}
