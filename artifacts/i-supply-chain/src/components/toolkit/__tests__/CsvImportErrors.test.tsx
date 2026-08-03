/**
 * CsvImportErrors.test.ts
 *
 * Confirms that bad CSV rows produce clear error messages and leave existing
 * tool data untouched.  Divided into four sections:
 *
 *  A. parseCsvFile (importCsv.ts) — specific error-message text
 *       Exercises the real exported function, no local mirrors.
 *
 *  B. parseSubScoresFromRow (scorecardCsv.ts) — per-cell validation
 *       Exercises the real exported function, no local mirrors.
 *
 *  C. SupplierScorecardTool component integration tests
 *       Renders the real component, mocks FileReader, and asserts on
 *       the rendered import log.  The real handleScorecardImport code
 *       path is exercised end-to-end.
 *
 *  D. TrainingNeedsAssessment component integration tests
 *       Same approach for the Training Needs Assessment import handler.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── module-level mocks (shared across all sections) ─────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock('@/lib/storage', () => ({ safeSetItem: vi.fn(() => true) }));

vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(),
    savedPlan: null, viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

vi.mock('@/components/AIPlanPanel', () => ({ AIPlanPanel: () => null }));

/* ── lazy imports (after mocks are registered) ───────────────────────── */

import { parseCsvFile } from '@/lib/importCsv';
import {
  DIMS,
  SUB_INDICATORS,
  parseSubScoresFromRow,
} from '@/lib/scorecardCsv';
import { SupplierScorecardTool } from '../SupplierScorecard';
import { TrainingNeedsAssessment } from '../TrainingTools';

/* ── shared lifecycle ────────────────────────────────────────────────── */

beforeEach(() => {
  localStorage.clear();
  cleanup();
  vi.stubGlobal('confirm', vi.fn().mockReturnValue(false)); // never overwrite duplicates
  // Silence network calls that SupplierScorecardTool makes when user is null:
  // the component skips the server fetch when user===null, so no fetch stub needed.
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   Helper: mock FileReader so it calls onload synchronously with `text`.
   Returned stub can be re-used across calls — each new `new FileReader()`
   gets a fresh instance whose readAsText fires onload immediately.
══════════════════════════════════════════════════════════════════════════ */

function mockFileReaderWith(text: string) {
  vi.stubGlobal('FileReader', vi.fn().mockImplementation(function(
    this: { onload: ((e: unknown) => void) | null; readAsText: (f: Blob) => void }
  ) {
    this.onload = null;
    this.readAsText = (_f: Blob) => {
      this.onload?.({ target: { result: text } });
    };
  }));
}

/**
 * Find the hidden file input labelled "Import CSV file" (English) or
 * "استيراد ملف CSV" (Arabic) and fire a change event so the component's
 * onChange handler runs.
 */
function fireImportFile(csvText: string, ar = false) {
  const label = ar ? 'استيراد ملف CSV' : 'Import CSV file';
  const input = screen.getByLabelText(label);
  const file  = new File([csvText], 'test.csv', { type: 'text/csv' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

/* ── Scorecard sub-indicator column helpers ──────────────────────────── */

function deliveryOtifCol() {
  return `${DIMS.find(d => d.id === 'delivery')!.label} — ${SUB_INDICATORS['delivery'][0].label}`;
}
function qualityDefectCol() {
  return `${DIMS.find(d => d.id === 'quality')!.label} — ${SUB_INDICATORS['quality'][0].label}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   A. parseCsvFile — specific error-message text
      These tests call the real exported function — no local mirrors.
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — empty file error message', () => {
  it('errors array contains the word "empty" for a completely empty string', () => {
    const { errors } = parseCsvFile('', []);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].toLowerCase()).toMatch(/empty/);
  });

  it('errors array contains the word "empty" for a whitespace-only file', () => {
    const { errors } = parseCsvFile('   \n   \n', []);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].toLowerCase()).toMatch(/empty/);
  });

  it('rows is empty when the file is empty', () => {
    expect(parseCsvFile('', []).rows).toHaveLength(0);
  });

  it('headers is empty when the file is empty', () => {
    expect(parseCsvFile('', []).headers).toHaveLength(0);
  });
});

describe('parseCsvFile — missing required column error message', () => {
  it('error message tells the user the header was not found in the first 30 rows', () => {
    const { errors } = parseCsvFile('Category,Description\nsupply,Some risk', ['Supplier Name']);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });

  it('returns a single clear error when none of the required headers are present', () => {
    const { errors } = parseCsvFile('Category\nsupply', ['KRI ID', 'Value']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });

  it('rows is empty when a required column is missing', () => {
    expect(parseCsvFile('Category\nsupply', ['Supplier Name']).rows).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   A2. parseCsvFile — KRI import: header-scan exhaustion (31+ filler rows)

   The KRI import flow calls parseCsvFile with ['KRI ID', 'Value'].
   Files that have more than 30 annotation rows before the real header row
   should return the specific "Could not locate…" message, not a generic
   failure.  Files whose header row lands within the first 30 lines must
   still be parsed without error.
══════════════════════════════════════════════════════════════════════════ */

/** Build a CSV string with `fillerCount` annotation rows before the KRI header. */
function kriCsvWithFillerRows(fillerCount: number, dataRows: string[] = ['kri-001,42']): string {
  const filler = Array.from({ length: fillerCount }, (_, i) => `Annotation row ${i + 1},`);
  return [...filler, 'KRI ID,Value', ...dataRows].join('\n');
}

describe('parseCsvFile — KRI import: 31 filler rows exhaust the header scan', () => {
  it('returns the specific header-not-found error when 30 filler rows precede the KRI header', () => {
    // 30 filler rows → header is at line index 30 (the 31st line), outside the 30-row scan window
    const csv = kriCsvWithFillerRows(30);
    const { errors } = parseCsvFile(csv, ['KRI ID', 'Value']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });

  it('rows is empty when 30 filler rows push the header past the scan limit', () => {
    const csv = kriCsvWithFillerRows(30);
    expect(parseCsvFile(csv, ['KRI ID', 'Value']).rows).toHaveLength(0);
  });

  it('headers is empty when the scan is exhausted', () => {
    const csv = kriCsvWithFillerRows(30);
    expect(parseCsvFile(csv, ['KRI ID', 'Value']).headers).toHaveLength(0);
  });

  it('still fails with 50 filler rows (well past the limit)', () => {
    const csv = kriCsvWithFillerRows(50);
    const { errors } = parseCsvFile(csv, ['KRI ID', 'Value']);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });
});

describe('parseCsvFile — KRI import: header within first 30 rows succeeds', () => {
  it('parses successfully when the KRI header is at row 1 (no filler rows)', () => {
    const csv = kriCsvWithFillerRows(0);
    const { errors, rows } = parseCsvFile(csv, ['KRI ID', 'Value']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]['KRI ID']).toBe('kri-001');
  });

  it('parses successfully when the KRI header is at row 29 (29 filler rows — last valid position)', () => {
    // 29 filler rows → header is at line index 29 (the 30th line), the last position the scan checks
    const csv = kriCsvWithFillerRows(29);
    const { errors, rows } = parseCsvFile(csv, ['KRI ID', 'Value']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]['Value']).toBe('42');
  });

  it('returns all data rows after the KRI header when the header is preceded by filler', () => {
    const csv = kriCsvWithFillerRows(10, ['kri-001,10', 'kri-002,20', 'kri-003,30']);
    const { errors, rows } = parseCsvFile(csv, ['KRI ID', 'Value']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[2]['KRI ID']).toBe('kri-003');
  });
});

describe('parseCsvFile — BOM stripped before header detection', () => {
  it('first header name does not start with the BOM character', () => {
    const { headers } = parseCsvFile('\uFEFFSupplier Name,Score\nAlpha,75', ['Supplier Name']);
    expect(headers[0]).toBe('Supplier Name');
    expect(headers[0].charCodeAt(0)).not.toBe(0xFEFF);
  });

  it('finds the required column after BOM stripping (no error)', () => {
    const { errors } = parseCsvFile('\uFEFFSupplier Name,Tier\nAlpha,Preferred', ['Supplier Name']);
    expect(errors).toHaveLength(0);
  });

  it('parses data rows correctly after BOM stripping', () => {
    const { rows } = parseCsvFile('\uFEFFSupplier Name,Score\nBeta,90', ['Supplier Name']);
    expect(rows[0]['Supplier Name']).toBe('Beta');
    expect(rows[0]['Score']).toBe('90');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   B. parseSubScoresFromRow — per-cell validation
      Calls the real exported function — no local mirrors.
══════════════════════════════════════════════════════════════════════════ */

/** Row with every sub-indicator column present but empty (blank = not entered). */
function emptyRow(overrides: Record<string, string> = {}): Record<string, string> {
  const row: Record<string, string> = {};
  DIMS.forEach(d =>
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      row[`${d.label} — ${sub.label}`] = '';
    }),
  );
  return { ...row, ...overrides };
}

describe('parseSubScoresFromRow — non-numeric values', () => {
  it('adds an error when a sub-indicator column contains a non-numeric string', () => {
    const { errors } = parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: 'N/A' }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('error message mentions the column name', () => {
    const col = deliveryOtifCol();
    const { errors } = parseSubScoresFromRow(emptyRow({ [col]: 'good' }));
    expect(errors[0]).toMatch(new RegExp(col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  it('does NOT store the bad column in subScores', () => {
    const { subScores } = parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: 'N/A' }));
    expect(subScores['delivery']).toBeUndefined();
  });

  it('still parses valid columns from the same row when one is invalid', () => {
    const { subScores, errors } = parseSubScoresFromRow(emptyRow({
      [deliveryOtifCol()]: 'not-a-number',
      [qualityDefectCol()]: '85',
    }));
    expect(errors.length).toBeGreaterThan(0);
    expect(subScores['quality']?.[SUB_INDICATORS['quality'][0].id]).toBe('85');
  });

  it('accepts "0" (lower boundary) without an error', () => {
    expect(parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: '0' })).errors).toHaveLength(0);
  });

  it('accepts "100" (upper boundary) without an error', () => {
    expect(parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: '100' })).errors).toHaveLength(0);
  });
});

describe('parseSubScoresFromRow — out-of-range values', () => {
  it('rejects a value above 100 and does not store it', () => {
    const { errors, subScores } = parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: '150' }));
    expect(errors.length).toBeGreaterThan(0);
    expect(subScores['delivery']).toBeUndefined();
  });

  it('rejects a negative value and does not store it', () => {
    const { errors, subScores } = parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: '-5' }));
    expect(errors.length).toBeGreaterThan(0);
    expect(subScores['delivery']).toBeUndefined();
  });

  it('does not flag blank cells as errors (blanks mean "not entered")', () => {
    expect(parseSubScoresFromRow(emptyRow({ [deliveryOtifCol()]: '' })).errors).toHaveLength(0);
  });
});

describe('parseSubScoresFromRow — all columns bad', () => {
  it('returns empty subScores when every column has a non-numeric value', () => {
    const all = emptyRow();
    DIMS.forEach(d =>
      (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
        all[`${d.label} — ${sub.label}`] = 'bad';
      }),
    );
    const { subScores, errors } = parseSubScoresFromRow(all);
    expect(Object.keys(subScores)).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   C. SupplierScorecardTool — component integration tests
      Mocks FileReader and asserts on the rendered import log.
      Uses the real handleScorecardImport code path.
══════════════════════════════════════════════════════════════════════════ */

/** Minimal valid scorecard CSV with one good row. */
function scorecardCsv(rows: string[]): string {
  return ['Supplier Name,Current Tier', ...rows].join('\n');
}

describe('SupplierScorecardTool — empty file shows failure message', () => {
  it('renders "Import failed:" when the CSV is empty', async () => {
    mockFileReaderWith('');
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile('');
    await waitFor(() =>
      expect(screen.getByText('Import failed:')).toBeInTheDocument(),
    );
  });

  it('renders "Import failed:" when the required column is missing', async () => {
    const csv = 'Category,Score\nfoo,80';
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(screen.getByText('Import failed:')).toBeInTheDocument(),
    );
  });
});

describe('SupplierScorecardTool — empty Supplier Name row is skipped', () => {
  it('renders a skip message for the row with an empty Supplier Name', async () => {
    // Row 2: comma-separated row with blank first field (empty Supplier Name)
    // Row 3: valid row
    const csv = scorecardCsv([',Strategic', 'Alpha Corp,Strategic']);
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Row 2') && txt.toLowerCase().includes('empty')),
      ).toBeInTheDocument(),
    );
  });

  it('still imports the valid row that follows the skipped row', async () => {
    const csv = scorecardCsv([',Strategic', 'Beta Ltd,Preferred']);
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      // Success banner confirms at least one supplier was imported
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );
  });
});

describe('SupplierScorecardTool — non-numeric sub-score column', () => {
  it('renders an "ignored" error for a non-numeric sub-indicator value', async () => {
    const col = deliveryOtifCol();
    const csv = scorecardCsv([`Alpha Corp,Strategic,${col}=N/A`]);
    // Build a proper CSV with the column header and a bad value
    const fullCsv = [`Supplier Name,Current Tier,${col}`, `Alpha Corp,Strategic,N/A`].join('\n');
    mockFileReaderWith(fullCsv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(fullCsv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.toLowerCase().includes('ignored')),
      ).toBeInTheDocument(),
    );
  });

  it('still imports the supplier despite the bad sub-score column', async () => {
    const col = deliveryOtifCol();
    const fullCsv = [`Supplier Name,Current Tier,${col}`, `Alpha Corp,Strategic,N/A`].join('\n');
    mockFileReaderWith(fullCsv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(fullCsv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );
  });
});

/* ── Task 408: Arabic case-variant notice renders in log panel (isAr=true) ── */

describe('SupplierScorecardTool — Arabic case-variant notice in import log panel (Task 408)', () => {
  it('renders the Arabic case-variant detection string when isAr=true and name casing differs', async () => {
    // Pre-load an existing supplier named 'Alpha Corp'
    localStorage.setItem(
      'isc-tool-supplier-roster',
      JSON.stringify({
        suppliers: [{ id: 's-alpha', name: 'Alpha Corp', tier: 'Strategic', subScores: {} }],
        activeId: 's-alpha',
      }),
    );

    // Upload a CSV with 'alpha corp' (lower-case variant of 'Alpha Corp').
    // The beforeEach confirm stub returns false → row is skipped rather than overwritten.
    // Arabic skip message: "الصف 2: 'alpha corp' تطابق مع 'Alpha Corp' الموجود — تم التخطي."
    const csv = 'Supplier Name,Current Tier\nalpha corp,Preferred';
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={true} />);
    fireImportFile(csv, true);

    // The Arabic case-variant detection substring ('الموجود') must appear in
    // the rendered import log panel. The amber styling in SupplierScorecard.tsx
    // also depends on this substring — so its presence also verifies the
    // correct styling branch fires.
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('الموجود')),
      ).toBeInTheDocument(),
    );
  });

  it('does not show English case-variant text when isAr=true', async () => {
    localStorage.setItem(
      'isc-tool-supplier-roster',
      JSON.stringify({
        suppliers: [{ id: 's-beta', name: 'Beta Ltd', tier: 'Preferred', subScores: {} }],
        activeId: 's-beta',
      }),
    );

    const csv = 'Supplier Name,Current Tier\nbeta ltd,Strategic';
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={true} />);
    fireImportFile(csv, true);

    // Wait for the log to appear
    await waitFor(() =>
      expect(screen.getByText((txt) => txt.includes('الموجود'))).toBeInTheDocument(),
    );

    // The English 'matched existing' phrase must be absent
    expect(screen.queryByText((txt) => txt.includes('matched existing'))).toBeNull();
  });
});

/* ── Task 425: header-only blank template doesn't crash ──────────────────── */

describe('SupplierScorecardTool — completely blank template (headers only) import (Task 425)', () => {
  it('does not crash when the CSV has headers but no data rows', async () => {
    // A template downloaded with only the header row and no supplier data
    const csv = 'Supplier Name,Current Tier';
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);
    // Must show the result of importing 0 suppliers, never an unhandled error
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Imported 0') || txt.includes('Import failed:')),
      ).toBeInTheDocument(),
    );
  });

  it('shows 0 in the import summary, not a misleading non-zero count', async () => {
    const csv = 'Supplier Name,Current Tier';
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('0 supplier')),
      ).toBeInTheDocument(),
    );
  });
});

/* ── Task 435: import log panel is visible and shows skip messages ────────── */

describe('SupplierScorecardTool — import log panel visible with skip messages (Task 435)', () => {
  it('renders the import log panel when a partial CSV is uploaded', async () => {
    // One empty-name row (skipped) + one valid row (imported)
    const csv = scorecardCsv([',Strategic', 'Alpha Corp,Strategic']);
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);

    // The import log panel must appear — success banner starts with ✓
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );

    // The skip message for row 2 must also be visible inside the log panel
    expect(
      screen.getByText((txt) => txt.includes('Row 2') && txt.toLowerCase().includes('empty')),
    ).toBeInTheDocument();
  });

  it('import log shows both the skip count and the imported count on a partial upload', async () => {
    // Two empty-name rows (skipped) + one valid row (imported)
    const csv = scorecardCsv([',Strategic', ',Preferred', 'Delta Corp,Transactional']);
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);

    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );

    // Both row-2 and row-3 skip messages must appear
    expect(
      screen.getByText((txt) => txt.includes('Row 2') && txt.toLowerCase().includes('empty')),
    ).toBeInTheDocument();
    expect(
      screen.getByText((txt) => txt.includes('Row 3') && txt.toLowerCase().includes('empty')),
    ).toBeInTheDocument();
  });
});

/* ── Task 335: partial import exercises the real production merge handler ─── */

/**
 * Drift-prevention test (Task 335).
 *
 * ScorecardCsvRoundtrip.test.ts contains a local reimplementation of the merge
 * loop at lines ~299-301 that can silently drift from the production code in
 * SupplierScorecard.tsx if someone changes one without the other. This test
 * exercises the actual component handler (handleScorecardImport) through the
 * rendered UI, so any change to the production merge logic that breaks partial
 * imports will fail here immediately.
 */
describe('SupplierScorecardTool — partial CSV import uses real production merge handler (Task 335 drift guard)', () => {
  beforeEach(() => {
    // Override the shared "cancel all overwrites" stub so that when the
    // component asks "Overwrite existing supplier?" the answer is yes.
    // This lets us exercise the real production merge path.
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
  });

  it('a partial import for an existing supplier reports "Imported 1" — production merge path exercised', async () => {
    // Pre-load a supplier with a delivery score so we have a baseline.
    localStorage.setItem(
      'isc-tool-supplier-roster',
      JSON.stringify({
        suppliers: [
          { id: 's-dt335', name: 'Delta Corp', tier: 'Strategic', subScores: { delivery: { otif: '90' } } },
        ],
        activeId: 's-dt335',
      }),
    );

    // Partial CSV: only the OTIF column is updated (same supplier name → exact match → overwrite/merge).
    const col = deliveryOtifCol();
    const csv = [`Supplier Name,Current Tier,${col}`, `Delta Corp,Preferred,99`].join('\n');
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);

    // The production merge handler must report 1 imported supplier, not 0.
    // If the merge code were accidentally replaced with a skip, this count would
    // drop to 0 and the test would immediately catch the drift.
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported 1')),
      ).toBeInTheDocument(),
    );
  });
});

describe('SupplierScorecardTool — file with only bad rows leaves existing state unchanged', () => {
  it('shows no new supplier in the roster when every CSV row has an empty name', async () => {
    // Pre-load a known roster so we have a baseline
    const existingRoster = {
      suppliers: [{ id: 'pre-1', name: 'Pre-existing Corp', tier: 'Strategic', subScores: {} }],
      activeId: 'pre-1',
    };
    localStorage.setItem('isc-tool-supplier-roster', JSON.stringify(existingRoster));

    const csv = scorecardCsv([',Strategic', ',Preferred']); // all empty names
    mockFileReaderWith(csv);
    render(<SupplierScorecardTool isAr={false} />);
    fireImportFile(csv);

    // Wait for the import summary line — exact text avoids matching multiple elements
    await screen.findByText('✓ Imported 0 supplier(s).');

    // The pre-existing supplier should still be shown; no new supplier was added
    expect(screen.getByDisplayValue('Pre-existing Corp')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   D. TrainingNeedsAssessment — component integration tests
      Mocks FileReader and asserts on the rendered import log.
      Uses the real handleTrainingImport code path.
══════════════════════════════════════════════════════════════════════════ */

/** Minimal training CSV: header + data rows. */
function trainingCsv(rows: string[]): string {
  return ['Member Name,Strategy & Planning', ...rows].join('\n');
}

describe('TrainingNeedsAssessment — empty file shows failure message', () => {
  it('renders "Import failed:" when the CSV is empty', async () => {
    mockFileReaderWith('');
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile('');
    await waitFor(() =>
      expect(screen.getByText('Import failed:')).toBeInTheDocument(),
    );
  });

  it('renders "Import failed:" when the required column is missing', async () => {
    const csv = 'Score,Level\n3,Competent';
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(screen.getByText('Import failed:')).toBeInTheDocument(),
    );
  });
});

describe('TrainingNeedsAssessment — empty Member Name row is skipped', () => {
  it('renders a row-number skip message for the empty-name row', async () => {
    // Row 2: empty name (comma-separated, blank first field)
    // Row 3: valid row
    const csv = trainingCsv([',3', 'Jane Smith,4']);
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Row 2') && txt.toLowerCase().includes('empty')),
      ).toBeInTheDocument(),
    );
  });

  it('still imports the valid member after the skipped row', async () => {
    const csv = trainingCsv([',3', 'Jane Smith,4']);
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );
  });
});

describe('TrainingNeedsAssessment — non-numeric domain score column', () => {
  it('renders an "ignored" error for a non-numeric domain score', async () => {
    const csv = trainingCsv(['Jane Smith,excellent']); // "excellent" is not 1–5
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.toLowerCase().includes('ignored')),
      ).toBeInTheDocument(),
    );
  });

  it('still imports the member despite the bad domain score', async () => {
    const csv = trainingCsv(['Jane Smith,excellent']);
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.startsWith('✓') && txt.includes('Imported')),
      ).toBeInTheDocument(),
    );
  });

  it('renders an "ignored" error for a domain score outside 1–5 range', async () => {
    const csv = trainingCsv(['Jane Smith,10']); // 10 is out of range
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.toLowerCase().includes('ignored')),
      ).toBeInTheDocument(),
    );
  });
});

describe('TrainingNeedsAssessment — file with only bad rows leaves existing state unchanged', () => {
  it('pre-loaded members remain visible when every CSV row has an empty Member Name', async () => {
    // Pre-load members in localStorage
    localStorage.setItem('isc-tool-training-members', JSON.stringify(['Existing Member']));

    const csv = trainingCsv([',3', ',4']); // all empty names
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);

    // Wait for the import summary line — exact text avoids matching multiple elements
    await screen.findByText('✓ Imported 0 member(s).');

    // The pre-existing member name should still be rendered
    expect(screen.getByDisplayValue('Existing Member')).toBeInTheDocument();
  });

  it('shows skip messages for each empty-name row', async () => {
    const csv = trainingCsv([',3', ',4']);
    mockFileReaderWith(csv);
    render(<TrainingNeedsAssessment isAr={false} />);
    fireImportFile(csv);
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Row 2') && txt.toLowerCase().includes('empty')),
      ).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByText((txt) => txt.includes('Row 3') && txt.toLowerCase().includes('empty')),
      ).toBeInTheDocument(),
    );
  });
});
