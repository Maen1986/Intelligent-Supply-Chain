/**
 * Supplier Scorecard — roster persistence and scoring unit tests
 *
 * Covers:
 *  1. loadRoster — fresh empty localStorage (fallback to blank roster)
 *  2. loadRoster — happy path: round-trip through localStorage
 *  3. loadRoster — backward-compatible migration from the old single-supplier key
 *  4. loadRoster — corrupted / invalid JSON falls back gracefully
 *  5. loadRoster — multi-supplier roster survives a full round-trip
 *  6. calcDimScore — all sub-indicators filled, partial, all-empty, boundary values
 *  7. calcWeightedScore — all-filled, any-null propagation, all-empty, boundary values
 *  8. Delete supplier B leaves supplier A's subScores unchanged
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadRoster } from '../SupplierScorecard';
import {
  calcDimScore,
  calcWeightedScore,
  DIMS,
  SUB_INDICATORS,
  type SupplierRecord,
  type ScorecardConfig,
} from '@/lib/scorecardCsv';

/* ─── Storage key constants (mirror the component) ─── */
const ROSTER_KEY = 'isc-tool-supplier-roster';
const LEGACY_KEY = 'isc-tool-supplier-scorecard';

/* ─── Default config used by calcWeightedScore ─── */
const DEFAULT_CONFIG: ScorecardConfig = {
  weights: { delivery: 25, quality: 25, cost: 20, compliance: 15, innovation: 10, relationship: 5 },
  tiers: { strategic: 75, preferred: 55 },
};

/* ─── Fully-scored subScores fixture ─── */
const FULL_SUB_SCORES: Record<string, Record<string, string>> = {
  delivery:     { otif: '90', lead_time: '80', fill_rate: '85', expedite: '75' },
  quality:      { defect: '88', ftr: '91', cert: '95', nonconf: '80' },
  cost:         { savings: '65', invoice: '97', cost_reduction: '50', tco: '72' },
  compliance:   { regulatory: '100', esg: '74', docs: '89', ethics: '83' },
  innovation:   { ideas: '60', implemented: '45', tech: '77' },
  relationship: { responsiveness: '90', resolution: '82', collaboration: '68' },
};

/* ─── Helper: build a SupplierRecord fixture ─── */
function makeSupplier(
  id: string,
  name: string,
  subScores: Record<string, Record<string, string>> = {},
): SupplierRecord {
  return { id, name, tier: 'Strategic', subScores };
}

beforeEach(() => {
  localStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — loadRoster: localStorage states
══════════════════════════════════════════════════════════════════════════ */

describe('loadRoster — fresh / empty localStorage', () => {
  it('returns a roster with exactly one supplier when localStorage is empty', () => {
    const { suppliers } = loadRoster();
    expect(suppliers).toHaveLength(1);
  });

  it('returns an activeId that matches the single supplier\'s id', () => {
    const { suppliers, activeId } = loadRoster();
    expect(activeId).toBe(suppliers[0].id);
  });

  it('the fallback supplier has an empty name', () => {
    const { suppliers } = loadRoster();
    expect(suppliers[0].name).toBe('');
  });

  it('the fallback supplier has an empty subScores object', () => {
    const { suppliers } = loadRoster();
    expect(suppliers[0].subScores).toEqual({});
  });

  it('the fallback supplier id starts with "sup-"', () => {
    const { suppliers } = loadRoster();
    expect(suppliers[0].id).toMatch(/^sup-/);
  });
});

describe('loadRoster — valid roster in localStorage', () => {
  it('returns the stored roster when ROSTER_KEY holds valid JSON', () => {
    const stored = {
      suppliers: [makeSupplier('sup-1', 'Alpha Corp', FULL_SUB_SCORES)],
      activeId: 'sup-1',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { suppliers, activeId } = loadRoster();
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toBe('Alpha Corp');
    expect(activeId).toBe('sup-1');
  });

  it('preserves sub-scores through the localStorage round-trip', () => {
    const stored = {
      suppliers: [makeSupplier('sup-1', 'Alpha Corp', FULL_SUB_SCORES)],
      activeId: 'sup-1',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { suppliers } = loadRoster();
    expect(suppliers[0].subScores).toEqual(FULL_SUB_SCORES);
  });

  it('preserves the activeId from the stored roster', () => {
    const stored = {
      suppliers: [
        makeSupplier('sup-1', 'Alpha Corp'),
        makeSupplier('sup-2', 'Beta Ltd'),
      ],
      activeId: 'sup-2',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { activeId } = loadRoster();
    expect(activeId).toBe('sup-2');
  });
});

describe('loadRoster — multi-supplier round-trip', () => {
  it('loads all suppliers when the roster has multiple entries', () => {
    const stored = {
      suppliers: [
        makeSupplier('sup-a', 'Alpha Corp', FULL_SUB_SCORES),
        makeSupplier('sup-b', 'Beta Ltd', { delivery: { otif: '70' } }),
        makeSupplier('sup-c', 'Gamma GmbH', {}),
      ],
      activeId: 'sup-a',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { suppliers } = loadRoster();
    expect(suppliers).toHaveLength(3);
    expect(suppliers.map(s => s.name)).toEqual(['Alpha Corp', 'Beta Ltd', 'Gamma GmbH']);
  });

  it('preserves each supplier\'s sub-scores independently', () => {
    const stored = {
      suppliers: [
        makeSupplier('sup-a', 'Alpha Corp', { delivery: { otif: '90', lead_time: '85' } }),
        makeSupplier('sup-b', 'Beta Ltd',   { delivery: { otif: '50', lead_time: '45' } }),
      ],
      activeId: 'sup-a',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { suppliers } = loadRoster();
    expect(suppliers[0].subScores.delivery?.otif).toBe('90');
    expect(suppliers[1].subScores.delivery?.otif).toBe('50');
    // No cross-contamination
    expect(suppliers[0].subScores.delivery?.lead_time).toBe('85');
    expect(suppliers[1].subScores.delivery?.lead_time).toBe('45');
  });

  it('all supplier IDs survive the round-trip unchanged', () => {
    const stored = {
      suppliers: [
        makeSupplier('sup-a', 'Alpha Corp'),
        makeSupplier('sup-b', 'Beta Ltd'),
      ],
      activeId: 'sup-a',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(stored));

    const { suppliers } = loadRoster();
    expect(suppliers[0].id).toBe('sup-a');
    expect(suppliers[1].id).toBe('sup-b');
  });
});

describe('loadRoster — migration from legacy single-supplier key', () => {
  it('migrates a legacy record when ROSTER_KEY is absent', () => {
    const legacy = { name: 'Legacy Supplier', tier: 'Preferred', scores: { delivery: '80' } };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const { suppliers } = loadRoster();
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toBe('Legacy Supplier');
  });

  it('preserves the tier from the legacy record', () => {
    const legacy = { name: 'Old Corp', tier: 'Preferred', scores: {} };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const { suppliers } = loadRoster();
    expect(suppliers[0].tier).toBe('Preferred');
  });

  it('maps legacy top-level scores onto the first sub-indicator of each dimension', () => {
    // The migration puts old.scores[dimId] → subScores[dimId][firstSub.id]
    const legacy = { name: 'Old Corp', tier: 'Strategic', scores: { delivery: '75' } };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const { suppliers } = loadRoster();
    const firstDeliverySub = SUB_INDICATORS['delivery']?.[0];
    expect(firstDeliverySub).toBeDefined();
    expect(suppliers[0].subScores['delivery']?.[firstDeliverySub!.id]).toBe('75');
  });

  it('returns a valid activeId pointing at the migrated supplier', () => {
    const legacy = { name: 'Old Corp', tier: 'Strategic', scores: {} };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const { suppliers, activeId } = loadRoster();
    expect(activeId).toBe(suppliers[0].id);
  });

  it('ignores the legacy key if ROSTER_KEY already holds a valid non-empty roster', () => {
    const roster = {
      suppliers: [makeSupplier('sup-new', 'New Supplier')],
      activeId: 'sup-new',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ name: 'Old Corp', tier: 'Strategic', scores: {} }));

    const { suppliers } = loadRoster();
    expect(suppliers[0].name).toBe('New Supplier'); // new roster wins
  });
});

describe('loadRoster — corrupted / invalid localStorage', () => {
  it('falls back to a blank single-supplier roster when ROSTER_KEY is not valid JSON', () => {
    localStorage.setItem(ROSTER_KEY, 'NOT_VALID_JSON!!!');

    const { suppliers, activeId } = loadRoster();
    expect(suppliers).toHaveLength(1);
    expect(activeId).toBe(suppliers[0].id);
  });

  it('falls back gracefully when ROSTER_KEY holds a JSON object with no suppliers array', () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({ foo: 'bar' }));

    // No suppliers array → treat as empty → fall through
    const { suppliers } = loadRoster();
    expect(suppliers).toHaveLength(1);
  });

  it('falls back gracefully when ROSTER_KEY holds an empty suppliers array', () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({ suppliers: [], activeId: '' }));

    const { suppliers } = loadRoster();
    // Empty array is rejected; should produce one blank supplier
    expect(suppliers).toHaveLength(1);
  });

  it('falls back gracefully when LEGACY_KEY is also corrupted JSON', () => {
    localStorage.setItem(LEGACY_KEY, '{BROKEN');

    const { suppliers, activeId } = loadRoster();
    expect(suppliers).toHaveLength(1);
    expect(activeId).toBe(suppliers[0].id);
  });

  it('returns a no-crash roster when both keys are corrupted', () => {
    localStorage.setItem(ROSTER_KEY, 'BAD');
    localStorage.setItem(LEGACY_KEY, 'ALSO_BAD');

    expect(() => loadRoster()).not.toThrow();
    const { suppliers } = loadRoster();
    expect(suppliers.length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — calcDimScore
══════════════════════════════════════════════════════════════════════════ */

describe('calcDimScore', () => {
  it('returns null when no sub-indicators are filled', () => {
    expect(calcDimScore('delivery', {})).toBeNull();
  });

  it('returns null when the sub-scores object is empty for the dimension', () => {
    expect(calcDimScore('delivery', { delivery: {} })).toBeNull();
  });

  it('averages all four delivery sub-indicators when fully scored', () => {
    const subScores = { delivery: { otif: '80', lead_time: '60', fill_rate: '100', expedite: '40' } };
    // average = (80 + 60 + 100 + 40) / 4 = 70
    expect(calcDimScore('delivery', subScores)).toBe(70);
  });

  it('averages only the filled sub-indicators (partial fill)', () => {
    // Only otif and lead_time filled → average = (90 + 70) / 2 = 80
    const subScores = { delivery: { otif: '90', lead_time: '70' } };
    expect(calcDimScore('delivery', subScores)).toBe(80);
  });

  it('returns 0 for boundary value 0 (single sub-indicator)', () => {
    const subScores = { delivery: { otif: '0' } };
    expect(calcDimScore('delivery', subScores)).toBe(0);
  });

  it('returns 100 for boundary value 100 (single sub-indicator)', () => {
    const subScores = { delivery: { otif: '100' } };
    expect(calcDimScore('delivery', subScores)).toBe(100);
  });

  it('returns 100 when all sub-indicators for a dimension are 100', () => {
    const subScores = {
      delivery: { otif: '100', lead_time: '100', fill_rate: '100', expedite: '100' },
    };
    expect(calcDimScore('delivery', subScores)).toBe(100);
  });

  it('returns 0 when all sub-indicators for a dimension are 0', () => {
    const subScores = {
      delivery: { otif: '0', lead_time: '0', fill_rate: '0', expedite: '0' },
    };
    expect(calcDimScore('delivery', subScores)).toBe(0);
  });

  it('rounds the result to the nearest integer', () => {
    // (67 + 68) / 2 = 67.5 → rounds to 68
    const subScores = { delivery: { otif: '67', lead_time: '68' } };
    expect(calcDimScore('delivery', subScores)).toBe(68);
  });

  it('works for the quality dimension', () => {
    const subScores = { quality: { defect: '80', ftr: '80', cert: '80', nonconf: '80' } };
    expect(calcDimScore('quality', subScores)).toBe(80);
  });

  it('works for the compliance dimension', () => {
    const subScores = { compliance: { regulatory: '100', esg: '60', docs: '80', ethics: '80' } };
    // average = (100 + 60 + 80 + 80) / 4 = 80
    expect(calcDimScore('compliance', subScores)).toBe(80);
  });

  it('returns null for an unknown dimension id', () => {
    expect(calcDimScore('unknown_dim', { unknown_dim: { x: '50' } })).toBeNull();
  });

  it('does not bleed scores between dimensions', () => {
    const subScores = {
      delivery:  { otif: '90' },
      quality:   { defect: '50' },
    };
    expect(calcDimScore('delivery', subScores)).toBe(90);
    expect(calcDimScore('quality',  subScores)).toBe(50);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — calcWeightedScore
══════════════════════════════════════════════════════════════════════════ */

describe('calcWeightedScore', () => {
  it('returns null when all sub-scores are empty', () => {
    expect(calcWeightedScore({}, DEFAULT_CONFIG)).toBeNull();
  });

  it('returns null when any one dimension has no scored sub-indicators', () => {
    // delivery is filled but quality is empty → one null dim score → result is null
    const partial: Record<string, Record<string, string>> = {
      delivery:     { otif: '80', lead_time: '80', fill_rate: '80', expedite: '80' },
      // quality, cost, compliance, innovation, relationship: all missing
    };
    expect(calcWeightedScore(partial, DEFAULT_CONFIG)).toBeNull();
  });

  it('returns a number when all six dimensions have at least one sub-indicator scored', () => {
    // One sub-indicator per dim — calcDimScore returns non-null for each
    const onePerDim: Record<string, Record<string, string>> = {
      delivery:     { otif: '80' },
      quality:      { defect: '80' },
      cost:         { savings: '80' },
      compliance:   { regulatory: '80' },
      innovation:   { ideas: '80' },
      relationship: { responsiveness: '80' },
    };
    const result = calcWeightedScore(onePerDim, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });

  it('returns 80 when all sub-indicators for all dimensions are exactly 80', () => {
    // Every dim score = 80 → weighted average = 80 regardless of weights
    const sub80: Record<string, Record<string, string>> = {};
    for (const dim of DIMS) {
      sub80[dim.id] = {};
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        sub80[dim.id][sub.id] = '80';
      }
    }
    expect(calcWeightedScore(sub80, DEFAULT_CONFIG)).toBe(80);
  });

  it('returns 100 when all sub-indicators are 100 (boundary max)', () => {
    const sub100: Record<string, Record<string, string>> = {};
    for (const dim of DIMS) {
      sub100[dim.id] = {};
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        sub100[dim.id][sub.id] = '100';
      }
    }
    expect(calcWeightedScore(sub100, DEFAULT_CONFIG)).toBe(100);
  });

  it('returns 0 when all sub-indicators are 0 (boundary min)', () => {
    const sub0: Record<string, Record<string, string>> = {};
    for (const dim of DIMS) {
      sub0[dim.id] = {};
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        sub0[dim.id][sub.id] = '0';
      }
    }
    expect(calcWeightedScore(sub0, DEFAULT_CONFIG)).toBe(0);
  });

  it('respects custom weights — a higher-weight dimension has more influence', () => {
    // delivery (weight 100) all 100; all others all 0
    const heavyDelivery: Record<string, Record<string, string>> = {};
    for (const dim of DIMS) {
      heavyDelivery[dim.id] = {};
      const score = dim.id === 'delivery' ? '100' : '0';
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        heavyDelivery[dim.id][sub.id] = score;
      }
    }
    const allWeightOnDelivery: ScorecardConfig = {
      weights: { delivery: 100, quality: 0, cost: 0, compliance: 0, innovation: 0, relationship: 0 },
      tiers: { strategic: 75, preferred: 55 },
    };
    expect(calcWeightedScore(heavyDelivery, allWeightOnDelivery)).toBe(100);
  });

  it('returns null when total weight is 0', () => {
    const filledAll: Record<string, Record<string, string>> = {};
    for (const dim of DIMS) {
      filledAll[dim.id] = {};
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        filledAll[dim.id][sub.id] = '80';
      }
    }
    const zeroWeights: ScorecardConfig = {
      weights: { delivery: 0, quality: 0, cost: 0, compliance: 0, innovation: 0, relationship: 0 },
      tiers: { strategic: 75, preferred: 55 },
    };
    expect(calcWeightedScore(filledAll, zeroWeights)).toBeNull();
  });

  it('returns a rounded integer, never a decimal', () => {
    // Use one sub-indicator per dim to get a potentially non-integer weighted average
    const mixed: Record<string, Record<string, string>> = {
      delivery:     { otif: '67' },
      quality:      { defect: '68' },
      cost:         { savings: '67' },
      compliance:   { regulatory: '68' },
      innovation:   { ideas: '67' },
      relationship: { responsiveness: '68' },
    };
    const result = calcWeightedScore(mixed, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(Number.isInteger(result)).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Deleting supplier B leaves supplier A's subScores unchanged
══════════════════════════════════════════════════════════════════════════ */

describe('delete supplier — does not affect remaining suppliers', () => {
  const SUPPLIER_A: SupplierRecord = {
    id: 'sup-a',
    name: 'Alpha Corp',
    tier: 'Strategic',
    subScores: {
      delivery:     { otif: '90', lead_time: '85', fill_rate: '80', expedite: '75' },
      quality:      { defect: '88', ftr: '91', cert: '95', nonconf: '80' },
      cost:         { savings: '65', invoice: '97', cost_reduction: '50', tco: '72' },
      compliance:   { regulatory: '100', esg: '74', docs: '89', ethics: '83' },
      innovation:   { ideas: '60', implemented: '45', tech: '77' },
      relationship: { responsiveness: '90', resolution: '82', collaboration: '68' },
    },
  };

  const SUPPLIER_B: SupplierRecord = {
    id: 'sup-b',
    name: 'Beta Ltd',
    tier: 'Preferred',
    subScores: {
      delivery:     { otif: '50', lead_time: '45' },
      quality:      { defect: '60' },
    },
  };

  const SUPPLIER_C: SupplierRecord = {
    id: 'sup-c',
    name: 'Gamma GmbH',
    tier: 'Transactional',
    subScores: { delivery: { otif: '40' } },
  };

  /** Simulates the deleteSupplier logic from the component. */
  function simulateDelete(
    suppliers: SupplierRecord[],
    activeId: string,
    deleteId: string,
  ): { suppliers: SupplierRecord[]; activeId: string } {
    const remaining = suppliers.filter(s => s.id !== deleteId);
    if (remaining.length === 0) {
      // Would normally create a blank supplier; for this test, not triggered.
      return { suppliers: remaining, activeId: '' };
    }
    const nextActive = deleteId === activeId ? remaining[0].id : activeId;
    return { suppliers: remaining, activeId: nextActive };
  }

  it('supplier A is still in the roster after deleting supplier B', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    expect(suppliers.find(s => s.id === 'sup-a')).toBeDefined();
  });

  it('supplier B is no longer in the roster after being deleted', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    expect(suppliers.find(s => s.id === 'sup-b')).toBeUndefined();
  });

  it('supplier A\'s subScores are byte-identical after deleting supplier B', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    const afterA = suppliers.find(s => s.id === 'sup-a')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
  });

  it('supplier A\'s delivery sub-scores are individually unchanged', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    const afterA = suppliers.find(s => s.id === 'sup-a')!;
    expect(afterA.subScores.delivery?.otif).toBe('90');
    expect(afterA.subScores.delivery?.lead_time).toBe('85');
    expect(afterA.subScores.delivery?.fill_rate).toBe('80');
    expect(afterA.subScores.delivery?.expedite).toBe('75');
  });

  it('supplier A\'s quality sub-scores are individually unchanged', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    const afterA = suppliers.find(s => s.id === 'sup-a')!;
    expect(afterA.subScores.quality?.defect).toBe('88');
    expect(afterA.subScores.quality?.ftr).toBe('91');
    expect(afterA.subScores.quality?.cert).toBe('95');
    expect(afterA.subScores.quality?.nonconf).toBe('80');
  });

  it('supplier A remains the activeId after deleting the non-active supplier B', () => {
    const { activeId } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    expect(activeId).toBe(SUPPLIER_A.id);
  });

  it('activeId shifts to supplier A when active supplier B is deleted', () => {
    // B is active; deleting B → active becomes first remaining = A
    const { activeId } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_B.id, SUPPLIER_B.id);
    expect(activeId).toBe(SUPPLIER_A.id);
  });

  it('deleting B from a three-supplier roster leaves A and C untouched', () => {
    const { suppliers } = simulateDelete(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      SUPPLIER_A.id,
      SUPPLIER_B.id,
    );
    expect(suppliers).toHaveLength(2);
    const afterA = suppliers.find(s => s.id === 'sup-a')!;
    const afterC = suppliers.find(s => s.id === 'sup-c')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
  });

  it('supplier A\'s name and tier survive the delete of supplier B', () => {
    const { suppliers } = simulateDelete([SUPPLIER_A, SUPPLIER_B], SUPPLIER_A.id, SUPPLIER_B.id);
    const afterA = suppliers.find(s => s.id === 'sup-a')!;
    expect(afterA.name).toBe('Alpha Corp');
    expect(afterA.tier).toBe('Strategic');
  });
});
