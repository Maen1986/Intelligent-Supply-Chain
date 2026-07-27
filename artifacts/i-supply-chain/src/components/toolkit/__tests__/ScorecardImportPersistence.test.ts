/**
 * Supplier Scorecard — import persistence tests
 *
 * Covers:
 *  1. Import → localStorage save → reload (page-refresh simulation)
 *     Confirms that all suppliers appended during an import are present
 *     after calling loadRoster() against the just-written localStorage entry.
 *
 *  2. Storage-clear event
 *     Confirms that clearing localStorage wipes the roster and loadRoster()
 *     falls back to a single blank supplier (not stale import data).
 *
 *  3. Duplicate-name detection after import
 *     - overwrite=true  → only the matched entry is modified, others untouched
 *     - overwrite=false → duplicates are skipped, new names are still added
 *     Both paths verify that *only* the expected entries change.
 *
 *  4. Score validation
 *     parseSubScoresFromRow rejects values outside [0, 100] and records
 *     per-column error messages, while still importing valid columns.
 *
 * Design notes
 * ─────────────
 * All tests are pure unit tests — no DOM interactions, no network calls.
 * The "import handler" is replicated here as `simulateImport`, which mirrors
 * the exact merge logic inside SupplierScorecard.tsx → handleScorecardImport.
 * Saving to localStorage is done via JSON.stringify → setItem, identical to
 * the component's `save()` helper (which calls safeSetItem → localStorage.setItem).
 * Reloading is done by calling the exported `loadRoster()` function, the same
 * code path exercised on a real page refresh.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadRoster } from '../SupplierScorecard';
import { parseCsvFile } from '@/lib/importCsv';
import {
  buildScorecardCsvString,
  parseSubScoresFromRow,
  type SupplierRecord,
} from '@/lib/scorecardCsv';

/* ─── Storage key (mirrors the component constant) ─── */
const ROSTER_KEY = 'isc-tool-supplier-roster';

/* ─── Fixtures ─── */

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
    delivery:     { otif: '70', lead_time: '65' },
    quality:      { defect: '72', ftr: '68' },
    cost:         { savings: '55' },
    compliance:   { regulatory: '80' },
    innovation:   { ideas: '40' },
    relationship: { responsiveness: '60' },
  },
};

const SUPPLIER_C: SupplierRecord = {
  id: 'sup-c',
  name: 'Gamma GmbH',
  tier: 'Transactional',
  subScores: {
    delivery:     { otif: '50' },
    quality:      { ftr: '55' },
    cost:         { invoice: '60' },
    compliance:   { regulatory: '70' },
    innovation:   { ideas: '30' },
    relationship: { collaboration: '45' },
  },
};

const NEW_SUPPLIER: SupplierRecord = {
  id: 'sup-new',
  name: 'Delta Inc',
  tier: 'Strategic',
  subScores: {
    delivery:     { otif: '88', lead_time: '82' },
    quality:      { ftr: '79', defect: '81' },
    cost:         { savings: '60', invoice: '91' },
    compliance:   { regulatory: '95', esg: '70' },
    innovation:   { ideas: '55', tech: '63' },
    relationship: { responsiveness: '85', collaboration: '72' },
  },
};

/* ─── Pure simulation of handleScorecardImport merge logic ─── */

interface ImportResult {
  nextSuppliers: SupplierRecord[];
  imported: number;
  skipped: number;
  log: string[];
}

function simulateImport(
  rosterSuppliers: SupplierRecord[],
  csvRows: Array<Record<string, string>>,
  overwrite: boolean,
): ImportResult {
  const nextSuppliers = rosterSuppliers.map(s => ({
    ...s,
    subScores: { ...s.subScores },
  }));

  let imported = 0;
  let skipped  = 0;
  const log: string[] = [];

  csvRows.forEach((row, ri) => {
    const rowNum = ri + 2;
    const name = row['Supplier Name']?.trim();
    if (!name) {
      log.push(`Row ${rowNum}: Supplier Name is empty — skipped.`);
      return;
    }

    const { subScores: incoming, errors: rowErrors } = parseSubScoresFromRow(row);
    rowErrors.forEach(e => log.push(`Row ${rowNum}: ${e}`));

    const existingIdx = nextSuppliers.findIndex(
      s => s.name.toLowerCase() === name.toLowerCase(),
    );

    if (existingIdx >= 0) {
      const existingName = nextSuppliers[existingIdx].name;
      const isCaseVariant = existingName !== name;
      if (overwrite) {
        nextSuppliers[existingIdx] = {
          ...nextSuppliers[existingIdx],
          tier: row['Current Tier']?.trim() || nextSuppliers[existingIdx].tier,
          subScores: incoming,
        };
        imported++;
        if (isCaseVariant) {
          log.push(`Row ${rowNum}: '${name}' matched existing '${existingName}' — merged.`);
        }
      } else {
        skipped++;
        if (isCaseVariant) {
          log.push(`Row ${rowNum}: '${name}' matched existing '${existingName}' — skipped.`);
        }
      }
    } else {
      nextSuppliers.push({
        id: `sup-imported-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        tier: row['Current Tier']?.trim() || 'Strategic',
        subScores: incoming,
      });
      imported++;
    }
  });

  return { nextSuppliers, imported, skipped, log };
}

/** Persist a roster to localStorage and return the result of loadRoster(). */
function saveAndReload(
  suppliers: SupplierRecord[],
  activeId: string,
): ReturnType<typeof loadRoster> {
  const roster = { suppliers, activeId };
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  return loadRoster();
}

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — Import → persist → reload (page-refresh simulation)
══════════════════════════════════════════════════════════════════════════ */

describe('Import persistence — page-refresh simulation', () => {
  beforeEach(() => localStorage.clear());

  it('all imported suppliers are present after saving to localStorage and calling loadRoster()', () => {
    // Start with one supplier in the roster; import two more.
    const csv = buildScorecardCsvString([SUPPLIER_B, NEW_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { suppliers } = saveAndReload(nextSuppliers, SUPPLIER_A.id);
    expect(suppliers).toHaveLength(3);
    expect(suppliers.map(s => s.name).sort()).toEqual(
      ['Alpha Corp', 'Beta Ltd', 'Delta Inc'].sort(),
    );
  });

  it('the original supplier is still present after a batch import', () => {
    const csv = buildScorecardCsvString([SUPPLIER_B, SUPPLIER_C]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { suppliers } = saveAndReload(nextSuppliers, SUPPLIER_A.id);
    const a = suppliers.find(s => s.id === 'sup-a');
    expect(a).toBeDefined();
    expect(a!.name).toBe('Alpha Corp');
  });

  it('imported supplier sub-scores survive the localStorage round-trip', () => {
    const csv = buildScorecardCsvString([NEW_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { suppliers } = saveAndReload(nextSuppliers, SUPPLIER_A.id);
    const delta = suppliers.find(s => s.name === 'Delta Inc')!;
    expect(delta).toBeDefined();
    expect(delta.subScores.delivery?.otif).toBe('88');
    expect(delta.subScores.quality?.ftr).toBe('79');
    expect(delta.subScores.compliance?.regulatory).toBe('95');
  });

  it('imported supplier tier survives the localStorage round-trip', () => {
    const csv = buildScorecardCsvString([SUPPLIER_B]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { suppliers } = saveAndReload(nextSuppliers, SUPPLIER_A.id);
    const b = suppliers.find(s => s.name === 'Beta Ltd')!;
    expect(b.tier).toBe('Preferred');
  });

  it('activeId is preserved correctly after import + reload', () => {
    const csv = buildScorecardCsvString([SUPPLIER_B, SUPPLIER_C]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { activeId } = saveAndReload(nextSuppliers, 'sup-a');
    expect(activeId).toBe('sup-a');
  });

  it('all sub-indicator values for all imported suppliers are byte-identical after reload', () => {
    const csv = buildScorecardCsvString([SUPPLIER_B, SUPPLIER_C, NEW_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A], rows, false);

    const { suppliers } = saveAndReload(nextSuppliers, SUPPLIER_A.id);

    // Alpha Corp is untouched
    const a = suppliers.find(s => s.id === 'sup-a')!;
    expect(a.subScores).toEqual(SUPPLIER_A.subScores);

    // Beta Ltd was imported — check a representative sub-score
    const b = suppliers.find(s => s.name === 'Beta Ltd')!;
    expect(b.subScores.delivery?.otif).toBe('70');
    expect(b.subScores.delivery?.lead_time).toBe('65');
  });

  it('roster is not lost when localStorage is written twice (second save wins)', () => {
    // First import: add B
    const csv1 = buildScorecardCsvString([SUPPLIER_B]);
    const { rows: rows1 } = parseCsvFile(csv1, ['Supplier Name']);
    const { nextSuppliers: after1 } = simulateImport([SUPPLIER_A], rows1, false);
    localStorage.setItem(ROSTER_KEY, JSON.stringify({ suppliers: after1, activeId: 'sup-a' }));

    // Second import: add C
    const csv2 = buildScorecardCsvString([SUPPLIER_C]);
    const { rows: rows2 } = parseCsvFile(csv2, ['Supplier Name']);
    const { nextSuppliers: after2 } = simulateImport(after1, rows2, false);
    localStorage.setItem(ROSTER_KEY, JSON.stringify({ suppliers: after2, activeId: 'sup-a' }));

    const { suppliers } = loadRoster();
    expect(suppliers).toHaveLength(3);
    expect(suppliers.map(s => s.name).sort()).toEqual(
      ['Alpha Corp', 'Beta Ltd', 'Gamma GmbH'].sort(),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — localStorage clear event
══════════════════════════════════════════════════════════════════════════ */

describe('Import persistence — storage-clear event', () => {
  beforeEach(() => localStorage.clear());

  it('loadRoster() returns a single blank supplier after localStorage is cleared post-import', () => {
    // Populate localStorage with an imported roster
    const csv = buildScorecardCsvString([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([], rows, false);
    localStorage.setItem(ROSTER_KEY, JSON.stringify({ suppliers: nextSuppliers, activeId: nextSuppliers[0].id }));

    // Simulate the storage-clear event
    localStorage.clear();

    // loadRoster() must fall back gracefully
    const { suppliers, activeId } = loadRoster();
    expect(suppliers).toHaveLength(1);
    expect(activeId).toBe(suppliers[0].id);
    expect(suppliers[0].name).toBe('');
  });

  it('after clear, the fallback supplier has an empty subScores object', () => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [SUPPLIER_A, SUPPLIER_B],
      activeId: 'sup-a',
    }));
    localStorage.clear();

    const { suppliers } = loadRoster();
    expect(suppliers[0].subScores).toEqual({});
  });

  it('clearing localStorage then re-importing restores the new batch cleanly', () => {
    // First, populate with old data
    localStorage.setItem(ROSTER_KEY, JSON.stringify({
      suppliers: [SUPPLIER_A, SUPPLIER_B],
      activeId: 'sup-a',
    }));

    // Clear simulates a "clear site data" browser action
    localStorage.clear();

    // Fresh import of a different batch
    const csv = buildScorecardCsvString([SUPPLIER_C, NEW_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    // Roster is fresh after clear — loadRoster gives us the blank seed
    const seed = loadRoster();
    // The blank seed supplier has no name; CSV rows carry the real data
    // Simulate the import against the cleared (seed) roster
    const { nextSuppliers } = simulateImport([], rows, false);
    const { suppliers } = saveAndReload(nextSuppliers, nextSuppliers[0].id);

    expect(suppliers).toHaveLength(2);
    expect(suppliers.map(s => s.name).sort()).toEqual(['Delta Inc', 'Gamma GmbH'].sort());
    // Old data (SUPPLIER_A / SUPPLIER_B) must not bleed through
    expect(suppliers.find(s => s.name === 'Alpha Corp')).toBeUndefined();
    expect(suppliers.find(s => s.name === 'Beta Ltd')).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — Duplicate-name detection modifies only the correct entries
══════════════════════════════════════════════════════════════════════════ */

describe('Import duplicate detection — only the right entries change', () => {
  beforeEach(() => localStorage.clear());

  // ── overwrite=true ──────────────────────────────────────────────────────

  it('overwrite: only the matched entry is updated; others are byte-identical', () => {
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '99' },
      },
    };
    const csv = buildScorecardCsvString([editedA]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      rows,
      true,
    );

    expect(imported).toBe(1);
    expect(skipped).toBe(0);
    expect(nextSuppliers).toHaveLength(3);

    // Only A changed
    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(afterA.subScores.delivery?.otif).toBe('99');

    // B and C are byte-identical to their fixtures
    const afterB = nextSuppliers.find(s => s.name === 'Beta Ltd')!;
    const afterC = nextSuppliers.find(s => s.name === 'Gamma GmbH')!;
    expect(afterB.subScores).toEqual(SUPPLIER_B.subScores);
    expect(afterB.tier).toBe(SUPPLIER_B.tier);
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
    expect(afterC.tier).toBe(SUPPLIER_C.tier);
  });

  it('overwrite: updating a middle entry does not disturb the first or last entry', () => {
    const editedB: SupplierRecord = {
      ...SUPPLIER_B,
      tier: 'Transactional',
      subScores: { delivery: { otif: '30' }, quality: {}, cost: {}, compliance: {}, innovation: {}, relationship: {} },
    };
    const csv = buildScorecardCsvString([editedB]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      rows,
      true,
    );

    const afterA = nextSuppliers.find(s => s.id === 'sup-a')!;
    const afterC = nextSuppliers.find(s => s.id === 'sup-c')!;

    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
    expect(afterA.tier).toBe('Strategic');
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
    expect(afterC.tier).toBe('Transactional');
  });

  it('overwrite: case-insensitive match still updates only the matched entry', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'beta ltd',
      'Current Tier': 'Strategic',
      'Delivery Performance — OTIF %': '99',
    };
    const { nextSuppliers, imported } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      true,
    );

    expect(imported).toBe(1);
    expect(nextSuppliers).toHaveLength(3);

    // B is updated; no ghost 'beta ltd' entry created
    const afterB = nextSuppliers.find(s => s.name === 'Beta Ltd')!;
    expect(afterB).toBeDefined();
    expect(afterB.subScores.delivery?.otif).toBe('99');

    const ghost = nextSuppliers.find(s => s.name === 'beta ltd');
    expect(ghost).toBeUndefined();

    // A and C untouched
    const afterA = nextSuppliers.find(s => s.id === 'sup-a')!;
    const afterC = nextSuppliers.find(s => s.id === 'sup-c')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
  });

  it('overwrite: a roster save + reload after duplicate overwrite preserves the new values', () => {
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: { ...SUPPLIER_A.subScores, delivery: { ...SUPPLIER_A.subScores.delivery, otif: '77' } },
    };
    const csv = buildScorecardCsvString([editedA]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A, SUPPLIER_B], rows, true);

    const { suppliers } = saveAndReload(nextSuppliers, 'sup-a');
    const a = suppliers.find(s => s.name === 'Alpha Corp')!;
    expect(a.subScores.delivery?.otif).toBe('77');

    // B is unchanged after reload
    const b = suppliers.find(s => s.name === 'Beta Ltd')!;
    expect(b.subScores).toEqual(SUPPLIER_B.subScores);
  });

  // ── overwrite=false ─────────────────────────────────────────────────────

  it('skip: duplicate supplier is untouched; a new supplier in the same CSV is still added', () => {
    const csv = buildScorecardCsvString([SUPPLIER_A, NEW_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      rows,
      false,
    );

    expect(skipped).toBe(1);
    expect(imported).toBe(1);
    expect(nextSuppliers).toHaveLength(4);

    // A is byte-identical (not modified)
    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);

    // Delta Inc was added
    const delta = nextSuppliers.find(s => s.name === 'Delta Inc')!;
    expect(delta).toBeDefined();
    expect(delta.subScores.delivery?.otif).toBe('88');
  });

  it('skip: all three existing suppliers are byte-identical when all three are duplicates', () => {
    const csv = buildScorecardCsvString([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    // Simulate user editing scores in the CSV then choosing Cancel
    const edited = rows.map(r => ({ ...r, 'Delivery Performance — OTIF %': '1' }));
    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      edited,
      false,
    );

    expect(imported).toBe(0);
    expect(skipped).toBe(3);
    expect(nextSuppliers).toHaveLength(3);

    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    const afterB = nextSuppliers.find(s => s.name === 'Beta Ltd')!;
    const afterC = nextSuppliers.find(s => s.name === 'Gamma GmbH')!;

    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
    expect(afterB.subScores).toEqual(SUPPLIER_B.subScores);
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
  });

  it('skip: a roster save + reload after skip-duplicate import keeps the original scores', () => {
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: { ...SUPPLIER_A.subScores, delivery: { ...SUPPLIER_A.subScores.delivery, otif: '1' } },
    };
    const csv = buildScorecardCsvString([editedA]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { nextSuppliers } = simulateImport([SUPPLIER_A, SUPPLIER_B], rows, false /* skip */);

    const { suppliers } = saveAndReload(nextSuppliers, 'sup-a');
    const a = suppliers.find(s => s.name === 'Alpha Corp')!;
    // Original otif is '90' — not the edited '1'
    expect(a.subScores.delivery?.otif).toBe('90');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Score validation (out-of-range rejection)
══════════════════════════════════════════════════════════════════════════ */

describe('Score validation — out-of-range values', () => {
  it('rejects a value of 101 and records an error message', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Delivery Performance — OTIF %': '101',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/101/);
    expect(subScores.delivery?.otif).toBeUndefined();
  });

  it('rejects a negative value and records an error message', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Quality — First-Time-Right %': '-1',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/-1/);
    expect(subScores.quality?.ftr).toBeUndefined();
  });

  it('rejects a non-numeric string and records an error message', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Cost Competitiveness — Invoice Accuracy %': 'N/A',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/N\/A/);
    expect(subScores.cost?.invoice).toBeUndefined();
  });

  it('accepts the boundary value 0 without error', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Delivery Performance — OTIF %': '0',
    });
    expect(errors).toHaveLength(0);
    expect(subScores.delivery?.otif).toBe('0');
  });

  it('accepts the boundary value 100 without error', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Quality — First-Time-Right %': '100',
    });
    expect(errors).toHaveLength(0);
    expect(subScores.quality?.ftr).toBe('100');
  });

  it('still imports valid columns from the same row that contains an invalid value', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Delivery Performance — OTIF %':             '85',   // valid
      'Quality — First-Time-Right %':               '150',  // invalid
      'Cost Competitiveness — Invoice Accuracy %':  '72',   // valid
      'Compliance — ESG Audit Score':               '-5',   // invalid
    });

    expect(errors).toHaveLength(2);
    // Valid cells are imported
    expect(subScores.delivery?.otif).toBe('85');
    expect(subScores.cost?.invoice).toBe('72');
    // Invalid cells produce no entry
    expect(subScores.quality?.ftr).toBeUndefined();
    expect(subScores.compliance?.esg).toBeUndefined();
  });

  it('records an error message for every invalid column in the row', () => {
    const { errors } = parseSubScoresFromRow({
      'Delivery Performance — OTIF %':             '-10',
      'Quality — First-Time-Right %':               '200',
      'Cost Competitiveness — Invoice Accuracy %':  'bad',
    });
    expect(errors).toHaveLength(3);
  });

  it('error messages name the offending column and value', () => {
    const { errors } = parseSubScoresFromRow({
      'Compliance — ESG Audit Score': '999',
    });
    expect(errors[0]).toMatch(/Compliance — ESG Audit Score/);
    expect(errors[0]).toMatch(/999/);
  });

  it('produces no errors and no phantom keys when every cell is blank', () => {
    const { subScores, errors } = parseSubScoresFromRow({});
    expect(errors).toHaveLength(0);
    expect(Object.keys(subScores)).toHaveLength(0);
  });

  it('accepts a decimal value such as 87.5 without error', () => {
    const { subScores, errors } = parseSubScoresFromRow({
      'Delivery Performance — OTIF %': '87.5',
    });
    expect(errors).toHaveLength(0);
    expect(subScores.delivery?.otif).toBe('87.5');
  });

  it('row-level error counting is reflected in the import log', () => {
    // Simulate handleScorecardImport collecting per-row errors into `log`
    const rows: Array<Record<string, string>> = [
      {
        'Supplier Name': 'Good Corp',
        'Delivery Performance — OTIF %': '85',        // valid
        'Quality — First-Time-Right %':   '150',       // invalid
      },
      {
        'Supplier Name': 'Bad Corp',
        'Delivery Performance — OTIF %': '-20',        // invalid
        'Cost Competitiveness — Invoice Accuracy %': '60', // valid
      },
    ];

    const log: string[] = [];
    rows.forEach((row, ri) => {
      const rowNum = ri + 2;
      const { errors: rowErrors } = parseSubScoresFromRow(row);
      rowErrors.forEach(e => log.push(`Row ${rowNum}: ${e}`));
    });

    // Row 2 has one invalid, Row 3 has one invalid
    expect(log).toHaveLength(2);
    expect(log[0]).toMatch(/Row 2/);
    expect(log[1]).toMatch(/Row 3/);
  });

  it('import handler skips a row with an empty Supplier Name and logs it', () => {
    // Simulates the "if (!name) { log.push(...); return; }" guard in handleScorecardImport
    const rows: Array<Record<string, string>> = [
      { 'Supplier Name': '', 'Delivery Performance — OTIF %': '80' },
    ];
    const log: string[] = [];
    rows.forEach((row, ri) => {
      const rowNum = ri + 2;
      const name = row['Supplier Name']?.trim();
      if (!name) {
        log.push(`Row ${rowNum}: Supplier Name is empty — skipped.`);
        return;
      }
    });

    expect(log).toHaveLength(1);
    expect(log[0]).toMatch(/Row 2/);
    expect(log[0]).toMatch(/empty/);
  });
});
