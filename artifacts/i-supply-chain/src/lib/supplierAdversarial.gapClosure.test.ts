/**
 * Round C #668 — gap closure regression tests (RC-2 fail-closed numbers, RC-3 CSV injection).
 */
import { describe, it, expect } from 'vitest';
import { bandForHHI, flagForHHI, isValidHHI, HHI_HIGH_THRESHOLD, HHI_MODERATE_THRESHOLD } from './supplierConcentration';
import { rateCategoryScore } from './supplierPeriodicEvaluation';
import { quadrantFor, scoreItem } from './kraljicCipsScoring';
import { buildScorecardCsvString } from './scorecardCsv';
import { csvCell, csvSafeText } from './csvSafe';

const BAD = [NaN, Infinity, -Infinity];

describe('RC-2 fail-closed on invalid numbers', () => {
  it.each(BAD)('HHI %s is never reassuring', (v) => {
    expect(isValidHHI(v)).toBe(false);
    expect(bandForHHI(v)).toBe('highlyConcentrated');
    expect(flagForHHI(v)).not.toBe('DIVERSIFIED');
  });
  it('HHI out of range is invalid, boundaries valid', () => {
    expect(isValidHHI(-1)).toBe(false);
    expect(isValidHHI(10001)).toBe(false);
    expect(isValidHHI(0)).toBe(true);
    expect(isValidHHI(10000)).toBe(true);
  });
  it.each(BAD)('category score %s rates at_risk', (v) => {
    expect(rateCategoryScore(v)).toBe('at_risk');
  });
  it('quadrantFor with non-finite input does not claim a leverage/routine quadrant', () => {
    for (const v of BAD) {
      expect(quadrantFor(v, 50, 50)).toBe('strategic');
      expect(quadrantFor(50, v, 50)).toBe('strategic');
      expect(quadrantFor(50, 50, v)).toBe('strategic');
    }
  });
  it('scoreItem with an invalid config returns insufficient, not a quadrant', () => {
    const r = scoreItem({}, { boundaryPct: NaN });
    expect(r.status).toBe('insufficient');
    expect(r.quadrant).toBeNull();
    expect(r.stepsNoteEn).toMatch(/invalid number/i);
    const w = scoreItem({}, { weights: { x: -1 } });
    expect(w.status).toBe('insufficient');
  });
});

describe('RC-6 mutation-driven exact-boundary pins', () => {
  it('invalid HHI maps to exactly the cautious values', () => {
    expect(flagForHHI(NaN)).toBe('APPARENT_DIVERSIFICATION');
    expect(bandForHHI(NaN)).toBe('highlyConcentrated');
  });
  it('band boundaries are exact (high is strictly above 2500, moderate starts at 1500)', () => {
    expect(bandForHHI(HHI_HIGH_THRESHOLD)).toBe('moderatelyConcentrated');
    expect(bandForHHI(HHI_HIGH_THRESHOLD + 0.01)).toBe('highlyConcentrated');
    expect(bandForHHI(HHI_MODERATE_THRESHOLD)).toBe('moderatelyConcentrated');
    expect(bandForHHI(HHI_MODERATE_THRESHOLD - 0.01)).toBe('competitive');
  });
  it('flag boundary is exact and the HHI validity ceiling is inclusive', () => {
    expect(flagForHHI(HHI_MODERATE_THRESHOLD)).toBe('TRUE_DIVERSIFICATION');
    expect(flagForHHI(HHI_MODERATE_THRESHOLD + 0.01)).toBe('APPARENT_DIVERSIFICATION');
    expect(isValidHHI(10000 + 1e-6)).toBe(true);
    expect(isValidHHI(10000 + 1e-3)).toBe(false);
    expect(isValidHHI('5000' as unknown as number)).toBe(false);
  });
});

describe('RC-3 CSV formula injection', () => {
  it('csvSafeText prefixes formula starters but keeps plain numbers', () => {
    for (const s of ['=1+1', '+cmd', '-cmd', '@SUM(A1)', '\tx', '\rx']) {
      expect(csvSafeText(s).startsWith("'")).toBe(true);
    }
    expect(csvSafeText('-12.5')).toBe('-12.5');
    expect(csvSafeText('Acme')).toBe('Acme');
  });
  it('csvCell quotes and neutralises together', () => {
    expect(csvCell('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`);
    expect(csvCell(NaN)).toBe('');
    expect(csvCell(-3)).toBe('-3');
  });
  it('scorecard export neutralises a hostile supplier name', () => {
    const csv = buildScorecardCsvString([
      { id: 's1', name: '=HYPERLINK("http://evil","x")', tier: '', subScores: {} },
    ]);
    expect(csv).not.toMatch(/(^|,|\n)"?=HYPERLINK/);
    expect(csv).toContain("'=HYPERLINK");
  });
  it('a record with empty subScores exports without throwing (was TypeError)', () => {
    expect(() => buildScorecardCsvString([{ id: 's', name: 'A', tier: '', subScores: {} }])).not.toThrow();
  });
});
