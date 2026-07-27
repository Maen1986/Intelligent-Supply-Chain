/**
 * Scorecard framework config persistence tests
 *
 * Verifies:
 *  1. loadConfig — fresh (empty) storage returns DEFAULT_CONFIG; a persisted
 *     config round-trips correctly; corrupted JSON falls back to defaults.
 *  2. calcWeightedScore — custom weights produce the expected normalised score;
 *     weights that don't sum to 100 still return a finite number; zero
 *     total weight returns null; any unscored dimension returns null.
 *  3. getTier — custom thresholds route scores to the correct tier band.
 *  4. setTierThreshold enforcement — the strategic > preferred invariant is
 *     maintained when either threshold is adjusted.
 *
 * All helpers are pure / use only jsdom localStorage — no React rendering.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { calcWeightedScore, getTier } from '@/lib/scorecardCsv';
import { loadConfig, DEFAULT_CONFIG, CONFIG_KEY } from '../SupplierScorecard';
import type { ScorecardConfig } from '@/lib/scorecardCsv';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/**
 * Pure mirror of the setTierThreshold logic inside SupplierScorecardTool.
 * Kept here so the invariant can be exercised without mounting the component.
 */
function applyThreshold(
  current: ScorecardConfig['tiers'],
  key: 'strategic' | 'preferred',
  raw: string,
): ScorecardConfig['tiers'] {
  const val = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
  const next = { ...current, [key]: val };
  if (key === 'preferred' && val >= current.strategic) {
    next.preferred = Math.max(0, current.strategic - 1);
  }
  if (key === 'strategic' && val <= current.preferred) {
    next.strategic = current.preferred + 1;
  }
  return next;
}

/* ── fixtures ─────────────────────────────────────────────────────────────── */

/**
 * Sub-scores with exactly one filled sub-indicator per dimension.
 * calcDimScore returns non-null for each dim → calcWeightedScore is computable.
 */
const ALL_DIMS_SCORED: Record<string, Record<string, string>> = {
  delivery:     { otif:          '80' },
  quality:      { ftr:           '60' },
  cost:         { savings:       '70' },
  compliance:   { regulatory:    '90' },
  innovation:   { ideas:         '50' },
  relationship: { responsiveness:'100' },
};

beforeEach(() => {
  localStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — loadConfig
══════════════════════════════════════════════════════════════════════════ */

describe('loadConfig', () => {
  it('returns DEFAULT_CONFIG when localStorage is empty', () => {
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('returns DEFAULT_CONFIG after localStorage.clear()', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ weights: { delivery: 50 }, tiers: { strategic: 90, preferred: 70 } }));
    localStorage.clear();
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('round-trips a persisted config correctly', () => {
    const custom: ScorecardConfig = {
      weights: { delivery: 30, quality: 30, cost: 15, compliance: 10, innovation: 10, relationship: 5 },
      tiers: { strategic: 80, preferred: 60 },
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(custom));
    expect(loadConfig()).toEqual(custom);
  });

  it('round-trips the default config after an explicit save', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('falls back to DEFAULT_CONFIG on corrupted JSON', () => {
    localStorage.setItem(CONFIG_KEY, '{broken json[[[');
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('falls back to DEFAULT_CONFIG when stored object is missing the weights field', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ tiers: { strategic: 80, preferred: 60 } }));
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('falls back to DEFAULT_CONFIG when stored object is missing the tiers field', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ weights: { delivery: 50 } }));
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('falls back to DEFAULT_CONFIG when stored value is null JSON', () => {
    localStorage.setItem(CONFIG_KEY, 'null');
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('returns independent copies — mutating the result does not affect a second call', () => {
    const a = loadConfig();
    a.weights.delivery = 999;
    const b = loadConfig();
    expect(b.weights.delivery).toBe(DEFAULT_CONFIG.weights.delivery);
  });

  it('uses the correct storage key (isc-tool-scorecard-config)', () => {
    expect(CONFIG_KEY).toBe('isc-tool-scorecard-config');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — calcWeightedScore
══════════════════════════════════════════════════════════════════════════ */

describe('calcWeightedScore', () => {
  it('returns null when no dimension has any sub-score', () => {
    expect(calcWeightedScore({}, DEFAULT_CONFIG)).toBeNull();
  });

  it('returns null when at least one dimension has no sub-scores at all', () => {
    // delivery is empty → calcDimScore('delivery') returns null
    const partial: Record<string, Record<string, string>> = {
      delivery:     {},
      quality:      { ftr: '80' },
      cost:         { savings: '70' },
      compliance:   { regulatory: '90' },
      innovation:   { ideas: '60' },
      relationship: { responsiveness: '50' },
    };
    expect(calcWeightedScore(partial, DEFAULT_CONFIG)).toBeNull();
  });

  it('returns null when the total weight is zero', () => {
    const zeroWeights: ScorecardConfig = {
      weights: { delivery: 0, quality: 0, cost: 0, compliance: 0, innovation: 0, relationship: 0 },
      tiers: { strategic: 75, preferred: 55 },
    };
    expect(calcWeightedScore(ALL_DIMS_SCORED, zeroWeights)).toBeNull();
  });

  it('returns a number (not NaN, not Infinity) with DEFAULT_CONFIG', () => {
    const result = calcWeightedScore(ALL_DIMS_SCORED, DEFAULT_CONFIG);
    expect(result).not.toBeNull();
    expect(Number.isFinite(result as number)).toBe(true);
    expect(Number.isNaN(result)).toBe(false);
  });

  it('produces the expected score with DEFAULT_CONFIG weights (sum=100)', () => {
    // delivery:80 quality:60 cost:70 compliance:90 innovation:50 relationship:100
    // weighted = (80*25 + 60*25 + 70*20 + 90*15 + 50*10 + 100*5) / 100 / 100 * 100
    // = (20 + 15 + 14 + 13.5 + 5 + 5) / 100 * 100 = 72.5 → 73
    expect(calcWeightedScore(ALL_DIMS_SCORED, DEFAULT_CONFIG)).toBe(73);
  });

  it('produces the expected score with equal custom weights (sum=60, not 100)', () => {
    const equalWeights: ScorecardConfig = {
      weights: { delivery: 10, quality: 10, cost: 10, compliance: 10, innovation: 10, relationship: 10 },
      tiers: { strategic: 75, preferred: 55 },
    };
    // (80+60+70+90+50+100) / 100 * 10 each; totalWeight=60
    // = (8+6+7+9+5+10) / 60 * 100 = 45/60*100 = 75
    expect(calcWeightedScore(ALL_DIMS_SCORED, equalWeights)).toBe(75);
  });

  it('produces a valid finite score when weights sum to something other than 100', () => {
    // delivery:40, quality:40, rest:0 → totalWeight=80
    // = (80/100*40 + 60/100*40) / 80 * 100 = (32+24)/80*100 = 70
    const skewedWeights: ScorecardConfig = {
      weights: { delivery: 40, quality: 40, cost: 0, compliance: 0, innovation: 0, relationship: 0 },
      tiers: { strategic: 75, preferred: 55 },
    };
    const result = calcWeightedScore(ALL_DIMS_SCORED, skewedWeights);
    expect(result).not.toBeNull();
    expect(Number.isFinite(result as number)).toBe(true);
    expect(result).toBe(70);
  });

  it('score is within the 0–100 range for realistic inputs', () => {
    const result = calcWeightedScore(ALL_DIMS_SCORED, DEFAULT_CONFIG) as number;
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns 100 when all dim scores are 100', () => {
    const perfect: Record<string, Record<string, string>> = {
      delivery:     { otif: '100' },
      quality:      { ftr: '100' },
      cost:         { savings: '100' },
      compliance:   { regulatory: '100' },
      innovation:   { ideas: '100' },
      relationship: { responsiveness: '100' },
    };
    expect(calcWeightedScore(perfect, DEFAULT_CONFIG)).toBe(100);
  });

  it('returns 0 when all dim scores are 0', () => {
    const zero: Record<string, Record<string, string>> = {
      delivery:     { otif: '0' },
      quality:      { ftr: '0' },
      cost:         { savings: '0' },
      compliance:   { regulatory: '0' },
      innovation:   { ideas: '0' },
      relationship: { responsiveness: '0' },
    };
    expect(calcWeightedScore(zero, DEFAULT_CONFIG)).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — getTier with custom thresholds
══════════════════════════════════════════════════════════════════════════ */

describe('getTier with custom thresholds', () => {
  const customConfig: ScorecardConfig = {
    weights: { ...DEFAULT_CONFIG.weights },
    tiers: { strategic: 80, preferred: 60 },
  };

  it('score equal to strategic threshold → Strategic', () => {
    expect(getTier(80, customConfig).label).toBe('Strategic');
  });

  it('score above strategic threshold → Strategic', () => {
    expect(getTier(95, customConfig).label).toBe('Strategic');
  });

  it('score between preferred and strategic → Preferred', () => {
    expect(getTier(70, customConfig).label).toBe('Preferred');
  });

  it('score equal to preferred threshold → Preferred', () => {
    expect(getTier(60, customConfig).label).toBe('Preferred');
  });

  it('score below preferred threshold → Transactional', () => {
    expect(getTier(59, customConfig).label).toBe('Transactional');
  });

  it('score of 0 → Transactional', () => {
    expect(getTier(0, customConfig).label).toBe('Transactional');
  });

  it('uses DEFAULT_CONFIG thresholds correctly (strategic=75, preferred=55)', () => {
    expect(getTier(75, DEFAULT_CONFIG).label).toBe('Strategic');
    expect(getTier(74, DEFAULT_CONFIG).label).toBe('Preferred');
    expect(getTier(55, DEFAULT_CONFIG).label).toBe('Preferred');
    expect(getTier(54, DEFAULT_CONFIG).label).toBe('Transactional');
  });

  it('extremely tight thresholds (strategic=51, preferred=50) still route correctly', () => {
    const tight: ScorecardConfig = {
      weights: { ...DEFAULT_CONFIG.weights },
      tiers: { strategic: 51, preferred: 50 },
    };
    expect(getTier(51, tight).label).toBe('Strategic');
    expect(getTier(50, tight).label).toBe('Preferred');
    expect(getTier(49, tight).label).toBe('Transactional');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Tier threshold enforcement (strategic > preferred invariant)
══════════════════════════════════════════════════════════════════════════ */

describe('tier threshold enforcement (strategic > preferred invariant)', () => {
  const base: ScorecardConfig['tiers'] = { strategic: 75, preferred: 55 };

  it('setting preferred below strategic is accepted as-is', () => {
    const result = applyThreshold(base, 'preferred', '60');
    expect(result.preferred).toBe(60);
    expect(result.strategic).toBe(75);
  });

  it('setting preferred equal to strategic clamps preferred to strategic − 1', () => {
    const result = applyThreshold(base, 'preferred', '75');
    expect(result.preferred).toBe(74);
    expect(result.strategic).toBe(75); // strategic unchanged
  });

  it('setting preferred above strategic clamps preferred to strategic − 1', () => {
    const result = applyThreshold(base, 'preferred', '90');
    expect(result.preferred).toBe(74);
  });

  it('setting strategic above preferred is accepted as-is', () => {
    const result = applyThreshold(base, 'strategic', '80');
    expect(result.strategic).toBe(80);
    expect(result.preferred).toBe(55);
  });

  it('setting strategic equal to preferred bumps strategic to preferred + 1', () => {
    const result = applyThreshold(base, 'strategic', '55');
    expect(result.strategic).toBe(56);
    expect(result.preferred).toBe(55); // preferred unchanged
  });

  it('setting strategic below preferred bumps strategic to preferred + 1', () => {
    const result = applyThreshold(base, 'strategic', '40');
    expect(result.strategic).toBe(56);
  });

  it('preferred is never clamped below 0 when strategic is 0', () => {
    const edge: ScorecardConfig['tiers'] = { strategic: 0, preferred: 0 };
    const result = applyThreshold(edge, 'preferred', '5');
    // preferred(5) >= strategic(0) → clamp to max(0, 0-1) = 0
    expect(result.preferred).toBeGreaterThanOrEqual(0);
  });

  it('resulting config always has strategic strictly greater than preferred', () => {
    const cases: Array<[typeof base, 'strategic' | 'preferred', string]> = [
      [base, 'preferred', '80'],
      [base, 'preferred', '75'],
      [base, 'strategic', '50'],
      [base, 'strategic', '55'],
      [{ strategic: 10, preferred: 5 }, 'strategic', '5'],
      [{ strategic: 10, preferred: 5 }, 'preferred', '10'],
    ];
    for (const [tiers, key, raw] of cases) {
      const result = applyThreshold(tiers, key, raw);
      expect(result.strategic).toBeGreaterThan(result.preferred);
    }
  });
});
