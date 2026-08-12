/**
 * Unit tests for the Command Centre "import real Maturity Assessment
 * scores" helpers.
 *
 * Covers:
 *  - distributeScore: precision (fractional scores), clamping, edge cases
 *  - computeImportPlan: correct domain mapping, multi-segment averaging
 *    (operations), missing-coverage domains omitted, empty input
 */

import { describe, it, expect } from 'vitest';
import {
  distributeScore,
  computeImportPlan,
  CC_DOMAIN_TO_SEGMENTS,
  type MaturityDomainId,
} from './maturityImport';

const SUBS_PER_DOMAIN = Object.fromEntries(
  (Object.keys(CC_DOMAIN_TO_SEGMENTS) as MaturityDomainId[]).map(id => [id, 5]),
) as Record<MaturityDomainId, number>;

/* ══════════════════════════════════════════════════════════════════════════
   distributeScore
══════════════════════════════════════════════════════════════════════════ */

describe('distributeScore', () => {
  it('returns a flat array when the score is a whole number', () => {
    expect(distributeScore(3, 5)).toEqual([3, 3, 3, 3, 3]);
    expect(distributeScore(1, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(distributeScore(5, 5)).toEqual([5, 5, 5, 5, 5]);
  });

  it('preserves fractional precision across n sliders (mean reproduces the real score)', () => {
    const vals = distributeScore(3.6, 5);
    expect(vals).toEqual([4, 4, 4, 3, 3]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    expect(mean).toBeCloseTo(3.6, 5);
  });

  it('handles a score just above a whole number (2.2 -> mostly 2s, one 3)', () => {
    const vals = distributeScore(2.2, 5);
    expect(vals).toEqual([3, 2, 2, 2, 2]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    expect(mean).toBeCloseTo(2.2, 5);
  });

  it('clamps scores below 1 up to 1', () => {
    expect(distributeScore(0, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(distributeScore(-2, 5)).toEqual([1, 1, 1, 1, 1]);
  });

  it('clamps scores above 5 down to 5', () => {
    expect(distributeScore(6, 5)).toEqual([5, 5, 5, 5, 5]);
    expect(distributeScore(4.9, 5)).toEqual([5, 5, 5, 5, 5]);
  });

  it('never exceeds 5 even when base is 5 and remainder rounds up', () => {
    // base=5, remainder effectively 0 after clamping — must not produce a 6
    const vals = distributeScore(5, 5);
    expect(vals.every(v => v <= 5)).toBe(true);
  });

  it('returns an empty array for n=0', () => {
    expect(distributeScore(3, 0)).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   computeImportPlan
══════════════════════════════════════════════════════════════════════════ */

describe('computeImportPlan', () => {
  it('maps 1:1 segments directly (strategy, procurement, clm, srm, risk, digital, esg)', () => {
    const plan = computeImportPlan(
      [
        { id: 'strategy',       score: 4 },
        { id: 'procurement',    score: 2 },
        { id: 'contracts',      score: 3 },
        { id: 'suppliers',      score: 5 },
        { id: 'risk',           score: 1 },
        { id: 'digital',        score: 3.5 },
        { id: 'sustainability', score: 2.5 },
      ],
      SUBS_PER_DOMAIN,
    );
    expect(plan.strategy).toEqual([4, 4, 4, 4, 4]);
    expect(plan.procurement).toEqual([2, 2, 2, 2, 2]);
    expect(plan.clm).toEqual([3, 3, 3, 3, 3]);
    expect(plan.srm).toEqual([5, 5, 5, 5, 5]);
    expect(plan.risk).toEqual([1, 1, 1, 1, 1]);
    expect(plan.digital).toEqual(distributeScore(3.5, 5));
    expect(plan.esg).toEqual(distributeScore(2.5, 5));
  });

  it('averages the three operations segments (demand, inventory, logistics)', () => {
    const plan = computeImportPlan(
      [
        { id: 'demand',    score: 4 },
        { id: 'inventory', score: 2 },
        { id: 'logistics', score: 3 },
      ],
      SUBS_PER_DOMAIN,
    );
    // (4 + 2 + 3) / 3 = 3.0 exactly
    expect(plan.operations).toEqual([3, 3, 3, 3, 3]);
  });

  it('averages operations correctly even when only some of the three segments are present', () => {
    const plan = computeImportPlan(
      [
        { id: 'demand',    score: 5 },
        { id: 'inventory', score: 3 },
        // logistics missing
      ],
      SUBS_PER_DOMAIN,
    );
    // (5 + 3) / 2 = 4.0
    expect(plan.operations).toEqual([4, 4, 4, 4, 4]);
  });

  it('omits domains with zero matching segment coverage instead of defaulting them', () => {
    const plan = computeImportPlan(
      [{ id: 'strategy', score: 4 }],
      SUBS_PER_DOMAIN,
    );
    expect(plan.strategy).toBeDefined();
    expect(plan.procurement).toBeUndefined();
    expect(plan.clm).toBeUndefined();
    expect(plan.operations).toBeUndefined();
  });

  it('returns an empty plan for empty segment scores', () => {
    const plan = computeImportPlan([], SUBS_PER_DOMAIN);
    expect(Object.keys(plan)).toHaveLength(0);
  });

  it('ignores non-positive or non-numeric scores rather than treating them as real zeros', () => {
    const plan = computeImportPlan(
      [{ id: 'strategy', score: 0 }],
      SUBS_PER_DOMAIN,
    );
    expect(plan.strategy).toBeUndefined();
  });

  it('never covers Organisation & Talent or Quality — no such keys exist in the domain map', () => {
    expect(Object.keys(CC_DOMAIN_TO_SEGMENTS)).not.toContain('org_talent');
    expect(Object.keys(CC_DOMAIN_TO_SEGMENTS)).not.toContain('quality_ci');
  });
});
