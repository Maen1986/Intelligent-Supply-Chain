/**
 * Round C #668 — gap closure regression tests (RC-2 fail-closed numbers, RC-3 CSV injection).
 */
import { describe, it, expect } from 'vitest';
import { bandForHHI, flagForHHI, isValidHHI } from './supplierConcentration';
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
