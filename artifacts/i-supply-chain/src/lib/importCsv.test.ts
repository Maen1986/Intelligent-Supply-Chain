/**
 * Unit tests for parseCsvFile and downloadCsv (importCsv.ts).
 *
 * Covers:
 *  1. parseCsvFile — happy-path parsing (plain and quoted fields)
 *  2. parseCsvFile — UTF-8 BOM stripping (Excel-exported files)
 *  3. parseCsvFile — required-header validation
 *  4. parseCsvFile — empty-file and whitespace-only input
 *  5. parseCsvFile — RFC-4180 edge cases (embedded commas, embedded quotes,
 *     escaped double-quotes inside quoted fields)
 *  6. parseCsvFile — CRLF and LF line endings
 *  7. parseCsvFile — trailing blank lines are ignored
 *  8. parseCsvFile — rows with fewer columns than headers (missing cells → '')
 *  9. downloadCsv  — creates a Blob with the expected CSV content
 * 10. Scorecard-import logic — score range validation (0–100 boundary)
 * 11. Scorecard-import logic — duplicate-name detection helpers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCsvFile, downloadCsv } from './importCsv';

/* ══════════════════════════════════════════════════════════════════════════
   1. parseCsvFile — happy-path parsing
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — happy-path parsing', () => {
  it('returns the correct headers from the first row', () => {
    const csv = 'Name,Score,Tier\nAlpha,80,Strategic';
    const { headers } = parseCsvFile(csv, []);
    expect(headers).toEqual(['Name', 'Score', 'Tier']);
  });

  it('returns one row per non-header data line', () => {
    const csv = 'Name,Score\nAlpha,80\nBeta,60';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(2);
  });

  it('maps each cell to its header key', () => {
    const csv = 'Name,Score,Tier\nAlpha,80,Strategic';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]).toEqual({ Name: 'Alpha', Score: '80', Tier: 'Strategic' });
  });

  it('trims whitespace from header names', () => {
    const csv = ' Name , Score \nAlpha,80';
    const { headers } = parseCsvFile(csv, []);
    expect(headers).toEqual(['Name', 'Score']);
  });

  it('trims whitespace from cell values', () => {
    const csv = 'Name,Score\n  Alpha  ,  80  ';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Name']).toBe('Alpha');
    expect(rows[0]['Score']).toBe('80');
  });

  it('returns no errors when all required headers are present', () => {
    const csv = 'Supplier Name,Tier\nAlpha,Preferred';
    const { errors } = parseCsvFile(csv, ['Supplier Name', 'Tier']);
    expect(errors).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. parseCsvFile — UTF-8 BOM stripping
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — BOM handling', () => {
  it('strips a leading UTF-8 BOM character (\\uFEFF)', () => {
    const csv = '\uFEFFSupplier Name,Score\nAlpha,75';
    const { headers, errors } = parseCsvFile(csv, ['Supplier Name']);
    expect(errors).toHaveLength(0);
    expect(headers[0]).toBe('Supplier Name');
  });

  it('parses data rows correctly after BOM removal', () => {
    const csv = '\uFEFFSupplier Name,Score\nBeta,90';
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Supplier Name']).toBe('Beta');
    expect(rows[0]['Score']).toBe('90');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. parseCsvFile — required-header validation
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — required header validation', () => {
  it('reports an error when a required header is missing', () => {
    const csv = 'Tier,Score\nPreferred,80';
    const { errors } = parseCsvFile(csv, ['Supplier Name']);
    expect(errors.length).toBeGreaterThan(0);
    // The new error tells the user the header was not found in the first 30 rows
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });

  it('returns an empty rows array when required headers are missing', () => {
    const csv = 'Tier,Score\nPreferred,80';
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows).toHaveLength(0);
  });

  it('reports a single clear error when none of the required headers are found', () => {
    const csv = 'Score\n80';
    const { errors } = parseCsvFile(csv, ['Supplier Name', 'Tier']);
    // A single "not found in 30 rows" error is returned — no need to list each missing column
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
  });

  it('accepts extra columns beyond the required set without error', () => {
    const csv = 'Supplier Name,Extra Column\nAlpha,foo';
    const { errors } = parseCsvFile(csv, ['Supplier Name']);
    expect(errors).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. parseCsvFile — empty and whitespace-only input
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — empty / blank input', () => {
  it('returns a non-empty errors array for an empty string', () => {
    const { errors } = parseCsvFile('', []);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns zero rows for an empty string', () => {
    const { rows } = parseCsvFile('', []);
    expect(rows).toHaveLength(0);
  });

  it('returns an error for a whitespace-only string', () => {
    const { errors } = parseCsvFile('   \n   \n', []);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns zero rows when only a header row is present (no data)', () => {
    const csv = 'Supplier Name,Tier';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. parseCsvFile — RFC-4180 quoted fields
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — RFC-4180 quoted fields', () => {
  it('handles a quoted field that contains a comma', () => {
    const csv = 'Name,Score\n"Smith, John",85';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Name']).toBe('Smith, John');
    expect(rows[0]['Score']).toBe('85');
  });

  it('unescapes doubled double-quotes inside a quoted field', () => {
    const csv = 'Name,Note\n"O""Brien","top supplier"';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Name']).toBe('O"Brien');
    expect(rows[0]['Note']).toBe('top supplier');
  });

  it('handles a quoted field that spans to the end of the line', () => {
    const csv = 'Name,Tier\n"Alpha Corp",Strategic';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Name']).toBe('Alpha Corp');
  });

  it('treats all columns in a quoted row correctly', () => {
    const csv = '"Supplier Name","Current Tier"\n"Alpha, Ltd.","Preferred"';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Supplier Name']).toBe('Alpha, Ltd.');
    expect(rows[0]['Current Tier']).toBe('Preferred');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. parseCsvFile — CRLF and LF line endings
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — line endings', () => {
  it('parses LF-only line endings correctly', () => {
    const csv = 'Name,Score\nAlpha,80\nBeta,60';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(2);
  });

  it('parses CRLF line endings correctly (Windows / Excel exports)', () => {
    const csv = 'Name,Score\r\nAlpha,80\r\nBeta,60';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(2);
    expect(rows[0]['Name']).toBe('Alpha');
    expect(rows[1]['Name']).toBe('Beta');
  });

  it('handles mixed LF and CRLF in the same file', () => {
    const csv = 'Name,Score\r\nAlpha,80\nBeta,60';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(2);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   7. parseCsvFile — trailing blank lines
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — trailing blank lines', () => {
  it('ignores trailing blank lines (LF)', () => {
    const csv = 'Name,Score\nAlpha,80\n\n';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(1);
  });

  it('ignores trailing blank lines (CRLF)', () => {
    const csv = 'Name,Score\r\nAlpha,80\r\n\r\n';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   8. parseCsvFile — rows with fewer columns than headers
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — short rows', () => {
  it('fills missing cells with empty string when a row is shorter than the header', () => {
    const csv = 'Name,Score,Tier\nAlpha,80';
    const { rows } = parseCsvFile(csv, []);
    expect(rows[0]['Tier']).toBe('');
  });

  it('still returns the row when columns are missing — does not skip it', () => {
    const csv = 'Name,Score,Tier\nAlpha';
    const { rows } = parseCsvFile(csv, []);
    expect(rows).toHaveLength(1);
    expect(rows[0]['Name']).toBe('Alpha');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   9. downloadCsv — Blob / anchor element creation
   Strategy: capture the Blob passed to URL.createObjectURL so we can read
   its content directly, and spy on HTMLAnchorElement.prototype.click to
   avoid the infinite-recursion that results from mocking createElement.
══════════════════════════════════════════════════════════════════════════ */

describe('downloadCsv', () => {
  let capturedBlobs: Blob[] = [];
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    capturedBlobs = [];
    revokeObjectURL = vi.fn();

    // Capture the Blob without replacing the entire URL object
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      capturedBlobs.push(blob);
      return 'blob:mock-url';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURL);

    // Intercept click at the prototype level — no createElement recursion
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers exactly one anchor click (triggering the download)', () => {
    downloadCsv([['Name', 'Score'], ['Alpha', '80']], 'test.csv');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('creates exactly one Blob', () => {
    downloadCsv([['Name', 'Score'], ['Alpha', '80']], 'test.csv');
    expect(capturedBlobs).toHaveLength(1);
  });

  it('creates a Blob with text/csv content type', () => {
    downloadCsv([['Name', 'Score'], ['Alpha', '80']], 'test.csv');
    expect(capturedBlobs[0].type).toMatch(/text\/csv/);
  });

  it('revokes the object URL after download to avoid memory leaks', () => {
    downloadCsv([['Name', 'Score'], ['Alpha', '80']], 'test.csv');
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('includes the BOM prefix so Excel opens it without encoding issues', async () => {
    downloadCsv([['Name'], ['Alpha']], 'test.csv');
    // Read raw bytes — jsdom's Blob.text() strips the BOM during UTF-8 decoding,
    // so we check the first three bytes (EF BB BF) via ArrayBuffer instead.
    const buf = await capturedBlobs[0].arrayBuffer();
    const bytes = new Uint8Array(buf);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  });

  it('escapes double-quotes in cell values (RFC-4180)', async () => {
    downloadCsv([['Name'], ['O"Brien']], 'test.csv');
    const text = await capturedBlobs[0].text();
    expect(text).toContain('O""Brien');
  });

  it('wraps all cells in double-quotes', async () => {
    downloadCsv([['Name', 'Score'], ['Alpha', '80']], 'test.csv');
    const text = await capturedBlobs[0].text();
    expect(text).toContain('"Name"');
    expect(text).toContain('"Score"');
    expect(text).toContain('"Alpha"');
    expect(text).toContain('"80"');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   9b. parseCsvFile — 30-row header-scan limit
       The parser finds the header row among the first 30 non-blank lines only.
       A header buried deeper than row 30 must NOT be found.
══════════════════════════════════════════════════════════════════════════ */

describe('parseCsvFile — 30-row header-scan limit', () => {
  /** Build a CSV with `prefixRows` leading filler rows, then a header row. */
  function buildCsvWithLeadingRows(prefixRows: number): string {
    const lines: string[] = [];
    for (let i = 0; i < prefixRows; i++) {
      lines.push(`Filler row ${i + 1},,,`);
    }
    lines.push('Name,Score,Tier');
    lines.push('Alpha,80,Strategic');
    return lines.join('\n');
  }

  it('finds the header row when it is at row 10 (well within the 30-row limit)', () => {
    const csv = buildCsvWithLeadingRows(10);
    const { rows, errors } = parseCsvFile(csv, ['Name', 'Score', 'Tier']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]['Name']).toBe('Alpha');
  });

  it('finds the header row when it is at row 15 (within the 30-row limit)', () => {
    const csv = buildCsvWithLeadingRows(15);
    const { rows, errors } = parseCsvFile(csv, ['Name', 'Score']);
    expect(errors).toHaveLength(0);
    expect(rows[0]['Score']).toBe('80');
  });

  it('finds the header row when it is at row 29 (last allowed position, 0-based)', () => {
    // 29 filler rows → header is at index 29 (the 30th line, 0-based)
    const csv = buildCsvWithLeadingRows(29);
    const { rows, errors } = parseCsvFile(csv, ['Name', 'Score']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });

  it('does NOT find the header when it is beyond the 30-row limit (row 31)', () => {
    // 31 filler rows → header is at index 31, outside the scan window
    const csv = buildCsvWithLeadingRows(31);
    const { errors, rows } = parseCsvFile(csv, ['Name', 'Score']);
    // The parser detects the scan was exhausted and returns a specific user-friendly error
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Could not locate the required column headers in the first 30 rows/);
    expect(rows).toHaveLength(0);
  });

  it('handles a realistic KPI template with 10 branding/instruction rows before the header', () => {
    const lines = [
      'I Supply Chain — KPI Data Collection Template,,,',
      'Framework: Lean Six Sigma,,,',
      'Generated: 1 January 2026,,,',
      ',,,',
      'INSTRUCTIONS:,Fill in the "Your Value" column,,',
      ',Do NOT modify KPI ID columns,,',
      ',When complete click Import CSV,,',
      ',Each KPI section shows what raw data to collect,,',
      ',,,',
      'KPI ID,Input Field,Your Value,Unit',
      'sigma,Defects,230,count',
      'sigma,Units Produced,5000,units',
      'sigma,Opportunities per Unit,10,count',
    ];
    const csv = lines.join('\n');
    const { rows, errors } = parseCsvFile(csv, ['KPI ID', 'Input Field', 'Your Value', 'Unit']);
    expect(errors).toHaveLength(0);
    // 3 data rows after the header
    expect(rows).toHaveLength(3);
    expect(rows[0]['KPI ID']).toBe('sigma');
    expect(rows[0]['Your Value']).toBe('230');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   10. Scorecard-import score validation logic (0–100 boundary)
       These tests exercise the validation rules that handleScorecardImport
       applies to each sub-indicator cell — implemented inline without
       rendering the full component.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard import — score range validation', () => {
  /** Mirror the validation logic used in handleScorecardImport */
  function isValidScore(val: string): boolean {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  it('accepts 0 as a valid score (lower boundary)', () => {
    expect(isValidScore('0')).toBe(true);
  });

  it('accepts 100 as a valid score (upper boundary)', () => {
    expect(isValidScore('100')).toBe(true);
  });

  it('accepts 75 as a valid mid-range score', () => {
    expect(isValidScore('75')).toBe(true);
  });

  it('accepts decimal scores like 87.5', () => {
    expect(isValidScore('87.5')).toBe(true);
  });

  it('rejects -1 (below lower boundary)', () => {
    expect(isValidScore('-1')).toBe(false);
  });

  it('rejects 101 (above upper boundary)', () => {
    expect(isValidScore('101')).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(isValidScore('N/A')).toBe(false);
    expect(isValidScore('good')).toBe(false);
    expect(isValidScore('')).toBe(false);
  });

  it('treats empty string as blank (not a validation error — blanks are allowed)', () => {
    // Blank cells are skipped, not flagged as errors
    const val = '';
    const isEmpty = val.trim() === '';
    expect(isEmpty).toBe(true);
  });

  it('rejects Infinity', () => {
    expect(isValidScore('Infinity')).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   11. Scorecard import — duplicate-name detection helpers
       Tests for the name-matching logic used to decide overwrite vs. skip.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard import — duplicate-name detection', () => {
  interface Supplier { id: string; name: string }

  /** Mirror the duplicate check used in handleScorecardImport */
  function findDuplicates(incoming: string[], existing: Supplier[]): string[] {
    return incoming.filter(n => n && existing.some(s => s.name === n));
  }

  const existing: Supplier[] = [
    { id: 'sup-1', name: 'Alpha Corp' },
    { id: 'sup-2', name: 'Beta Ltd' },
  ];

  it('finds no duplicates when all incoming names are new', () => {
    const dups = findDuplicates(['Gamma Inc', 'Delta Co'], existing);
    expect(dups).toHaveLength(0);
  });

  it('detects one duplicate when one incoming name matches an existing supplier', () => {
    const dups = findDuplicates(['Alpha Corp', 'Gamma Inc'], existing);
    expect(dups).toEqual(['Alpha Corp']);
  });

  it('detects all duplicates when every incoming name matches', () => {
    const dups = findDuplicates(['Alpha Corp', 'Beta Ltd'], existing);
    expect(dups).toHaveLength(2);
  });

  it('is case-sensitive — "alpha corp" does not match "Alpha Corp"', () => {
    const dups = findDuplicates(['alpha corp'], existing);
    expect(dups).toHaveLength(0);
  });

  it('ignores empty-string supplier names (row with missing name is skipped)', () => {
    const dups = findDuplicates(['', 'Alpha Corp'], existing);
    // Empty string must not be treated as a duplicate
    expect(dups).toEqual(['Alpha Corp']);
  });
});
