/**
 * Scorecard column-name stability test
 *
 * The column headers used in exportToCSV and handleScorecardImport are
 * constructed by string concatenation (`${d.label} — ${sub.label}`).
 * If a dimension label or sub-indicator label is ever edited, the export
 * and import column names will drift — existing CSVs will no longer
 * re-import correctly.
 *
 * This test imports DIMS and SUB_INDICATORS directly from the component
 * (rather than mirroring them) and snapshot-tests the derived column list.
 * Any label change that would break round-trip compatibility will cause
 * this test to fail at CI time, making the breakage explicit.
 *
 * To intentionally rename a label:
 *   1. Update the label in SupplierScorecard.tsx.
 *   2. Run `pnpm run test --update-snapshots` to accept the new golden list.
 *   3. Re-export / re-import any CSVs generated before the rename.
 */

import { describe, expect, it } from 'vitest';
import { DIMS, SUB_INDICATORS } from '../SupplierScorecard';

/** Derives the ordered list of sub-indicator CSV column names exactly as
 *  exportToCSV and handleScorecardImport do in SupplierScorecard.tsx. */
function deriveSubIndicatorColumns(): string[] {
  const cols: string[] = [];
  DIMS.forEach(d => {
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      cols.push(`${d.label} — ${sub.label}`);
    });
  });
  return cols;
}

/** Derives the full ordered header row that exportToCSV writes. */
function deriveAllHeaders(): string[] {
  const dimHeaders = DIMS.map(d => `${d.label} Score (/100)`);
  const subHeaders = deriveSubIndicatorColumns();
  return [
    'Supplier Name',
    'Current Tier',
    ...dimHeaders,
    ...subHeaders,
    'Weighted Score (/100)',
    'Calculated Tier',
  ];
}

describe('Scorecard CSV column-name stability', () => {
  it('sub-indicator column names match the golden snapshot', () => {
    expect(deriveSubIndicatorColumns()).toMatchSnapshot();
  });

  it('full header row matches the golden snapshot', () => {
    expect(deriveAllHeaders()).toMatchSnapshot();
  });

  it('sub-indicator column count is exactly 22', () => {
    // 4+4+4+4+3+3 = 22 sub-indicators across the 6 dimensions
    expect(deriveSubIndicatorColumns()).toHaveLength(22);
  });

  it('dimension score header count equals number of dimensions (6)', () => {
    expect(DIMS).toHaveLength(6);
  });

  it('every dimension id referenced in SUB_INDICATORS matches a DIMS entry', () => {
    const dimIds = new Set(DIMS.map(d => d.id));
    for (const dimId of Object.keys(SUB_INDICATORS)) {
      expect(dimIds.has(dimId)).toBe(true);
    }
  });

  it('no sub-indicator column name contains an undefined or empty segment', () => {
    const cols = deriveSubIndicatorColumns();
    for (const col of cols) {
      expect(col).not.toContain('undefined');
      expect(col.trim()).not.toBe('');
      // Must match the pattern "<dim label> — <sub label>"
      expect(col).toMatch(/.+ — .+/);
    }
  });

  it('all sub-indicator column names are unique (no duplicates)', () => {
    const cols = deriveSubIndicatorColumns();
    const unique = new Set(cols);
    expect(unique.size).toBe(cols.length);
  });

  it('column names are stable across two independent derivations (no side-effects)', () => {
    const first = deriveSubIndicatorColumns();
    const second = deriveSubIndicatorColumns();
    expect(first).toEqual(second);
  });
});
