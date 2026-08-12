/**
 * Pure helpers for importing real Maturity Assessment scores into the
 * Command Centre's AI Executive Briefing self-rating widget (8 domains ×
 * 5 sub-dimensions each, integer 1-5 sliders).
 *
 * Extracted here — separate from CommandCenter.tsx — so the mapping and
 * precision logic can be unit-tested independently of the React component,
 * matching the pattern already used for maturityScoring.ts.
 */

/** The 8 self-rating domain ids used by the Command Centre briefing widget. */
export type MaturityDomainId =
  | 'strategy' | 'procurement' | 'clm' | 'srm'
  | 'operations' | 'risk' | 'digital' | 'esg';

/**
 * Maps each of the widget's 8 self-rating domains to the id(s) of the real
 * Maturity Assessment segment(s) that cover the same ground (see
 * pages/maturityData.tsx CORE_SEGMENTS). 'operations' folds together three
 * real segments (demand, inventory, logistics) since this widget doesn't
 * split them out. 'Organisation & Talent' and 'Quality Management & CI'
 * have no counterpart here and are intentionally absent from this map —
 * those two domains always stay manually-rated, even after an import.
 */
export const CC_DOMAIN_TO_SEGMENTS: Record<MaturityDomainId, string[]> = {
  strategy:    ['strategy'],
  procurement: ['procurement'],
  clm:         ['contracts'],
  srm:         ['suppliers'],
  operations:  ['demand', 'inventory', 'logistics'],
  risk:        ['risk'],
  digital:     ['digital'],
  esg:         ['sustainability'],
};

export interface SegmentScoreLike {
  id:    string;
  score: number;
}

/**
 * Distribute a real, possibly-fractional 1-5 score across `n` discrete
 * 1-5 slider values so their mean reproduces the real score as closely as
 * integers allow (off by at most 1/n).
 *
 * A crude "round the average, apply to every slider" approach throws away
 * precision: a real score of 3.6 would round to 4 and be applied to all 5
 * sliders, displaying a domain average of 4.0 — overstating the client's
 * actual maturity by 0.4. This function instead returns e.g. [4,4,4,3,3]
 * for (3.6, 5), whose mean is exactly 3.6.
 *
 * @param score  Real segment score, expected in [1, 5]. Clamped defensively.
 * @param n      Number of discrete sliders to distribute across.
 */
export function distributeScore(score: number, n: number): number[] {
  if (n <= 0) return [];
  const clamped  = Math.max(1, Math.min(5, score));
  const base     = Math.max(1, Math.min(5, Math.floor(clamped)));
  const remainder = clamped - base;
  const highCount = Math.max(0, Math.min(n, Math.round(remainder * n)));
  const vals = Array<number>(n).fill(base);
  for (let i = 0; i < highCount; i++) {
    vals[i] = Math.min(5, base + 1);
  }
  return vals;
}

/**
 * Given the real Maturity Assessment's segment scores, compute which of the
 * 8 self-rating domains have real-assessment coverage and the discrete
 * per-sub-dimension values to apply to each (via distributeScore).
 *
 * Domains with no matching segment data in `segmentScores` are omitted from
 * the returned plan — callers should leave those domains' existing
 * (manually-rated) values untouched, not overwrite them with a default.
 *
 * @param segmentScores  The real assessment's per-segment scores (1-5).
 * @param subsPerDomain  Number of sliders per domain (5 for every domain in
 *                        the current widget, but passed explicitly so this
 *                        stays correct if that ever changes).
 */
export function computeImportPlan(
  segmentScores: SegmentScoreLike[],
  subsPerDomain: Record<MaturityDomainId, number>,
): Partial<Record<MaturityDomainId, number[]>> {
  const scoreById = Object.fromEntries(segmentScores.map(s => [s.id, s.score]));
  const plan: Partial<Record<MaturityDomainId, number[]>> = {};

  (Object.keys(CC_DOMAIN_TO_SEGMENTS) as MaturityDomainId[]).forEach(domainId => {
    const segIds = CC_DOMAIN_TO_SEGMENTS[domainId];
    const vals = segIds
      .map(id => scoreById[id])
      .filter((v): v is number => typeof v === 'number' && v > 0);
    if (vals.length === 0) return; // no real-assessment coverage — leave domain manual

    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    plan[domainId] = distributeScore(avg, subsPerDomain[domainId] ?? 5);
  });

  return plan;
}
