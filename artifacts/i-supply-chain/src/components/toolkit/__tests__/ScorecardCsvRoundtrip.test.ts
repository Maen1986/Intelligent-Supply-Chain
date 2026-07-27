/**
 * Scorecard CSV round-trip tests
 *
 * Verifies that:
 *  1. Exporting a SupplierRecord to CSV then importing it produces
 *     byte-identical sub-indicator scores across all 6 dimensions (full round-trip).
 *  2. A partial import (only some sub-indicator columns filled) merges correctly
 *     without wiping existing columns.
 *
 * No browser APIs needed — runs entirely in jsdom (vitest environment).
 * The DOM parts of exportToCSV (Blob, URL.createObjectURL, anchor click) are
 * not exercised here; we test only the pure data transformation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { parseCsvFile } from '@/lib/importCsv';
import { DIMS, SUB_INDICATORS } from '../SupplierScorecard';

/* ─── Types ─── */

interface SupplierRecord {
  id: string;
  name: string;
  tier: string;
  subScores: Record<string, Record<string, string>>;
}

/* ─── Helpers (pure data logic extracted from SupplierScorecard.tsx) ─── */

/**
 * Mirror of the CSV-building logic inside exportToCSV.
 * Returns the raw CSV string without any DOM/download side-effects.
 */
function buildCsvString(suppliers: SupplierRecord[]): string {
  const dimHeaders = DIMS.map(d => `${d.label} Score (/100)`);
  const subHeaders: string[] = [];
  DIMS.forEach(d => {
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      subHeaders.push(`${d.label} — ${sub.label}`);
    });
  });
  const headers = [
    'Supplier Name', 'Current Tier',
    ...dimHeaders,
    ...subHeaders,
    'Weighted Score (/100)', 'Calculated Tier',
  ];

  function calcDimScore(dimId: string, subScores: Record<string, Record<string, string>>): number | null {
    const subs = SUB_INDICATORS[dimId] ?? [];
    const vals = subs
      .map(s => parseFloat(subScores[dimId]?.[s.id] ?? ''))
      .filter(v => !isNaN(v) && v >= 0);
    if (vals.length === 0) return null;
    return Math.min(100, Math.max(0, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)));
  }

  const rows = suppliers.map(s => {
    const dimScores = DIMS.map(d => {
      const sc = calcDimScore(d.id, s.subScores);
      return sc !== null ? String(sc) : '';
    });
    const subVals: string[] = [];
    DIMS.forEach(d => {
      (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
        subVals.push(s.subScores[d.id]?.[sub.id] ?? '');
      });
    });
    return [
      s.name || 'New Supplier',
      s.tier,
      ...dimScores,
      ...subVals,
      '',  // Weighted Score — computed, not needed for import round-trip
      '',  // Calculated Tier — computed, not needed for import round-trip
    ];
  });

  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
}

/**
 * Mirror of the sub-score parsing logic inside handleScorecardImport.
 * Maps a single CSV row (header → value) back to { dimId → { subId → value } }.
 */
function parseSubScoresFromRow(row: Record<string, string>): {
  subScores: Record<string, Record<string, string>>;
  errors: string[];
} {
  const subColToIds: Record<string, { dimId: string; subId: string }> = {};
  const subHeaders: string[] = [];
  DIMS.forEach(d => {
    (SUB_INDICATORS[d.id] ?? []).forEach(sub => {
      const col = `${d.label} — ${sub.label}`;
      subHeaders.push(col);
      subColToIds[col] = { dimId: d.id, subId: sub.id };
    });
  });

  const subScores: Record<string, Record<string, string>> = {};
  const errors: string[] = [];

  subHeaders.forEach(col => {
    const val = row[col]?.trim();
    if (val !== undefined && val !== '') {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        const { dimId, subId } = subColToIds[col];
        if (!subScores[dimId]) subScores[dimId] = {};
        subScores[dimId][subId] = val;
      } else {
        errors.push(`"${col}" value "${val}" must be 0–100 — ignored.`);
      }
    }
  });

  return { subScores, errors };
}

/* ─── Fixtures ─── */

/** Fully-scored supplier with non-trivial values across all 6 dimensions. */
const FULL_SUPPLIER: SupplierRecord = {
  id: 'sup-test-001',
  name: 'Acme Suppliers',
  tier: 'Strategic',
  subScores: {
    delivery:     { otif: '92', lead_time: '85', fill_rate: '78', expedite: '70' },
    quality:      { defect: '88', ftr: '91', cert: '95', nonconf: '80' },
    cost:         { savings: '65', invoice: '97', cost_reduction: '50', tco: '72' },
    compliance:   { regulatory: '100', esg: '74', docs: '89', ethics: '83' },
    innovation:   { ideas: '60', implemented: '45', tech: '77' },
    relationship: { responsiveness: '90', resolution: '82', collaboration: '68' },
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   Suite 1 — Full CSV round-trip
   export → parseCsvFile → parseSubScoresFromRow → assert exact equality
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard CSV — full round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('produces a CSV that parseCsvFile accepts without errors', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { errors } = parseCsvFile(csv, ['Supplier Name']);
    expect(errors).toHaveLength(0);
  });

  it('exports exactly one data row for one supplier', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows).toHaveLength(1);
  });

  it('includes all expected column headers (spot-check)', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { headers } = parseCsvFile(csv, ['Supplier Name']);
    expect(headers).toContain('Supplier Name');
    expect(headers).toContain('Current Tier');
    expect(headers).toContain('Delivery Performance — OTIF %');
    expect(headers).toContain('Quality — Low Defect / Rejection Rate score');
    expect(headers).toContain('Cost Competitiveness — Invoice Accuracy %');
    expect(headers).toContain('Compliance — ESG Audit Score');
    expect(headers).toContain('Innovation — Technology Readiness Score');
    expect(headers).toContain('Relationship Quality — Collaboration Score');
  });

  it('preserves the supplier name through the round-trip', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Supplier Name']).toBe('Acme Suppliers');
  });

  it('preserves the supplier tier through the round-trip', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Current Tier']).toBe('Strategic');
  });

  it('produces no import errors when re-parsing the exported CSV', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { errors } = parseSubScoresFromRow(rows[0]);
    expect(errors).toHaveLength(0);
  });

  it('restores delivery sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.delivery).toEqual(FULL_SUPPLIER.subScores.delivery);
  });

  it('restores quality sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.quality).toEqual(FULL_SUPPLIER.subScores.quality);
  });

  it('restores cost sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.cost).toEqual(FULL_SUPPLIER.subScores.cost);
  });

  it('restores compliance sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.compliance).toEqual(FULL_SUPPLIER.subScores.compliance);
  });

  it('restores innovation sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.innovation).toEqual(FULL_SUPPLIER.subScores.innovation);
  });

  it('restores relationship sub-scores exactly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);
    expect(subScores.relationship).toEqual(FULL_SUPPLIER.subScores.relationship);
  });

  it('restores all 22 sub-indicator keys — none missing, none added', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);

    const importedKeys = Object.values(subScores).flatMap(Object.keys).sort();
    const originalKeys = Object.values(FULL_SUPPLIER.subScores).flatMap(Object.keys).sort();
    expect(importedKeys).toEqual(originalKeys);
  });

  it('round-trips all 22 sub-indicator values with exact string equality', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);

    for (const dim of DIMS) {
      for (const sub of SUB_INDICATORS[dim.id] ?? []) {
        const original = FULL_SUPPLIER.subScores[dim.id]?.[sub.id];
        const restored = subScores[dim.id]?.[sub.id];
        expect(restored).toBe(original);
      }
    }
  });

  it('handles multi-supplier export without cross-contaminating scores', () => {
    const supplier2: SupplierRecord = {
      id: 'sup-test-002',
      name: 'Beta Logistics',
      tier: 'Preferred',
      subScores: {
        delivery:     { otif: '55', lead_time: '60' },
        quality:      { defect: '70', ftr: '65' },
        cost:         { savings: '40' },
        compliance:   { regulatory: '80' },
        innovation:   { ideas: '30' },
        relationship: { responsiveness: '50' },
      },
    };
    const csv = buildCsvString([FULL_SUPPLIER, supplier2]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows).toHaveLength(2);

    const { subScores: s1 } = parseSubScoresFromRow(rows[0]);
    const { subScores: s2 } = parseSubScoresFromRow(rows[1]);

    // First supplier's values are unaffected by second supplier
    expect(s1.delivery.otif).toBe('92');
    expect(s1.quality.ftr).toBe('91');
    expect(s1.cost.tco).toBe('72');

    // Second supplier's values are correctly isolated
    expect(s2.delivery.otif).toBe('55');
    expect(s2.quality.ftr).toBe('65');
    expect(s2.cost?.tco).toBeUndefined(); // not filled for supplier2
  });

  it('handles a supplier name containing a comma (RFC-4180 quoting)', () => {
    const supplierWithComma: SupplierRecord = {
      id: 'sup-comma',
      name: 'Smith, Jones & Co.',
      tier: 'Preferred',
      subScores: {
        delivery: { otif: '88' },
        quality: { ftr: '79' },
        cost: {}, compliance: {}, innovation: {}, relationship: {},
      },
    };
    const csv = buildCsvString([supplierWithComma]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Supplier Name']).toBe('Smith, Jones & Co.');
  });

  it('produces a BOM-prefixed CSV (Excel-friendly) that parseCsvFile strips correctly', () => {
    const csv = buildCsvString([FULL_SUPPLIER]);
    // exportToCSV prepends BOM; simulate that here to match the real export
    const withBom = '\uFEFF' + csv;
    const { headers, errors } = parseCsvFile(withBom, ['Supplier Name']);
    expect(errors).toHaveLength(0);
    expect(headers[0]).toBe('Supplier Name');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 2 — Partial import: only some sub-indicator columns filled
   Asserts the import merges correctly without wiping unrelated columns.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard CSV — partial import', () => {
  beforeEach(() => localStorage.clear());

  it('imports only the filled sub-indicator columns', () => {
    const partial: SupplierRecord = {
      id: 'sup-partial',
      name: 'Partial Corp',
      tier: 'Transactional',
      subScores: {
        delivery: { otif: '80', fill_rate: '75' },
        quality:  { ftr: '88' },
        // cost, compliance, innovation, relationship intentionally absent
      },
    };
    const csv = buildCsvString([partial]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores, errors } = parseSubScoresFromRow(rows[0]);

    expect(errors).toHaveLength(0);
    expect(subScores.delivery?.otif).toBe('80');
    expect(subScores.delivery?.fill_rate).toBe('75');
    expect(subScores.quality?.ftr).toBe('88');
  });

  it('does not create phantom keys for unfilled sub-indicators', () => {
    const partial: SupplierRecord = {
      id: 'sup-partial-2',
      name: 'Sparse Inc',
      tier: 'Preferred',
      subScores: {
        delivery: { otif: '80' },
        // all other dims empty
      },
    };
    const csv = buildCsvString([partial]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    const { subScores } = parseSubScoresFromRow(rows[0]);

    // Unfilled sub-indicators within delivery are absent
    expect(subScores.delivery?.lead_time).toBeUndefined();
    expect(subScores.delivery?.fill_rate).toBeUndefined();
    expect(subScores.delivery?.expedite).toBeUndefined();

    // Entirely absent dimensions produce no entry at all
    expect(subScores.cost).toBeUndefined();
    expect(subScores.compliance).toBeUndefined();
    expect(subScores.innovation).toBeUndefined();
    expect(subScores.relationship).toBeUndefined();
  });

  it('merging partial incoming scores onto an existing record preserves untouched keys', () => {
    // Simulate existing full record in the roster
    const existing: Record<string, Record<string, string>> = {
      delivery:     { otif: '92', lead_time: '85', fill_rate: '78', expedite: '70' },
      quality:      { defect: '88', ftr: '91', cert: '95', nonconf: '80' },
      cost:         { savings: '65', invoice: '97', cost_reduction: '50', tco: '72' },
      compliance:   { regulatory: '100', esg: '74', docs: '89', ethics: '83' },
      innovation:   { ideas: '60', implemented: '45', tech: '77' },
      relationship: { responsiveness: '90', resolution: '82', collaboration: '68' },
    };

    // CSV row that only updates two cells
    const incomingRow: Record<string, string> = {
      'Delivery Performance — OTIF %':       '99',
      'Quality — First-Time-Right %':         '95',
      // All other sub-indicator cells absent (not in row)
    };
    const { subScores: incoming } = parseSubScoresFromRow(incomingRow);

    // Simulate the overwrite merge used in handleScorecardImport:
    // spread existing, then per-dimension spread overwrites incoming keys only
    const merged: Record<string, Record<string, string>> = { ...existing };
    for (const dimId of Object.keys(incoming)) {
      merged[dimId] = { ...existing[dimId], ...incoming[dimId] };
    }

    // Updated values are applied
    expect(merged.delivery.otif).toBe('99');
    expect(merged.quality.ftr).toBe('95');

    // Neighbouring keys within the same dimension are not wiped
    expect(merged.delivery.lead_time).toBe('85');
    expect(merged.delivery.fill_rate).toBe('78');
    expect(merged.delivery.expedite).toBe('70');
    expect(merged.quality.defect).toBe('88');
    expect(merged.quality.cert).toBe('95');
    expect(merged.quality.nonconf).toBe('80');

    // Untouched dimensions are completely unchanged
    expect(merged.cost).toEqual(existing.cost);
    expect(merged.compliance).toEqual(existing.compliance);
    expect(merged.innovation).toEqual(existing.innovation);
    expect(merged.relationship).toEqual(existing.relationship);
  });

  it('rejects out-of-range values but still imports valid columns from the same row', () => {
    const incomingRow: Record<string, string> = {
      'Delivery Performance — OTIF %':                  '85',   // valid
      'Quality — First-Time-Right %':                    '150',  // invalid — exceeds 100
      'Cost Competitiveness — Invoice Accuracy %':       '72',   // valid
      'Compliance — ESG Audit Score':                    '-5',   // invalid — below 0
    };
    const { subScores, errors } = parseSubScoresFromRow(incomingRow);

    expect(errors).toHaveLength(2);
    expect(errors.some(e => e.includes('150'))).toBe(true);
    expect(errors.some(e => e.includes('-5'))).toBe(true);

    // Valid values are imported
    expect(subScores.delivery?.otif).toBe('85');
    expect(subScores.cost?.invoice).toBe('72');

    // Invalid values produce no entry
    expect(subScores.quality?.ftr).toBeUndefined();
    expect(subScores.compliance?.esg).toBeUndefined();
  });

  it('produces no errors and no phantom keys when every sub-indicator cell is blank', () => {
    const { subScores, errors } = parseSubScoresFromRow({});
    expect(errors).toHaveLength(0);
    expect(Object.keys(subScores)).toHaveLength(0);
  });

  it('accepts decimal sub-scores (e.g. 87.5) and preserves them as-is', () => {
    const incomingRow: Record<string, string> = {
      'Delivery Performance — OTIF %': '87.5',
    };
    const { subScores, errors } = parseSubScoresFromRow(incomingRow);
    expect(errors).toHaveLength(0);
    expect(subScores.delivery?.otif).toBe('87.5');
  });

  it('accepts boundary values 0 and 100 without error', () => {
    const incomingRow: Record<string, string> = {
      'Delivery Performance — OTIF %':       '0',
      'Quality — First-Time-Right %':         '100',
    };
    const { subScores, errors } = parseSubScoresFromRow(incomingRow);
    expect(errors).toHaveLength(0);
    expect(subScores.delivery?.otif).toBe('0');
    expect(subScores.quality?.ftr).toBe('100');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 3 — Partial roster import (real-world edit workflow)

   Simulates: export all 3 suppliers → user edits 1 row in Excel → re-import
   that 1-row CSV. The two untouched suppliers must be byte-identical after
   the merge, and the one edited supplier must reflect only the cells that
   changed.

   Also covers the "skip duplicates" path (overwrite = false) to confirm
   that choosing Cancel on the overwrite prompt leaves all scores intact.
══════════════════════════════════════════════════════════════════════════ */

/**
 * Pure simulation of the merge logic inside handleScorecardImport.
 *
 * @param rosterSuppliers  The existing roster (spread-copy, not mutated)
 * @param csvRows          Rows parsed from the incoming CSV
 * @param overwrite        Whether to overwrite existing suppliers (true = OK,
 *                         false = Cancel in the confirm() dialog)
 * @returns { nextSuppliers, imported, skipped }
 */
function simulateImport(
  rosterSuppliers: SupplierRecord[],
  csvRows: Array<Record<string, string>>,
  overwrite: boolean,
): { nextSuppliers: SupplierRecord[]; imported: number; skipped: number } {
  const nextSuppliers = rosterSuppliers.map(s => ({
    ...s,
    subScores: { ...s.subScores },
  }));

  let imported = 0;
  let skipped  = 0;

  for (const row of csvRows) {
    const name = row['Supplier Name']?.trim();
    if (!name) continue;

    const { subScores: incoming } = parseSubScoresFromRow(row);

    // Case-insensitive match — mirrors the fixed handleScorecardImport behaviour.
    const existingIdx = nextSuppliers.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      if (overwrite) {
        // Wholesale replace — mirrors handleScorecardImport exactly:
        //   nextSuppliers[existingIdx] = { ...nextSuppliers[existingIdx], tier, subScores }
        // `subScores` contains only what was present in the CSV row; nothing is
        // merged from the existing record.
        nextSuppliers[existingIdx] = {
          ...nextSuppliers[existingIdx],
          tier: row['Current Tier']?.trim() || nextSuppliers[existingIdx].tier,
          subScores: incoming,
        };
        imported++;
      } else {
        skipped++;
      }
    } else {
      nextSuppliers.push({
        id: `sup-imported-${name}`,
        name,
        tier: row['Current Tier']?.trim() || 'Strategic',
        subScores: incoming,
      });
      imported++;
    }
  }

  return { nextSuppliers, imported, skipped };
}

/* ─── Fixtures for Suite 3 ─── */

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

describe('Scorecard CSV — partial roster import (real-world edit workflow)', () => {
  beforeEach(() => localStorage.clear());

  it('leaves the two untouched suppliers byte-identical after re-importing only one', () => {
    // Roster has A, B, C — user exports, edits Alpha Corp's OTIF to 99, re-imports just that row.
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '99' },
      },
    };
    const onlyACsv   = buildCsvString([editedA]);
    const { rows }   = parseCsvFile(onlyACsv, ['Supplier Name']);

    const { nextSuppliers } = simulateImport([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, true);

    // Roster still has 3 entries
    expect(nextSuppliers).toHaveLength(3);

    const afterB = nextSuppliers.find(s => s.name === 'Beta Ltd')!;
    const afterC = nextSuppliers.find(s => s.name === 'Gamma GmbH')!;

    expect(afterB).toBeDefined();
    expect(afterC).toBeDefined();

    // B and C are byte-identical to the original fixtures
    expect(afterB.subScores).toEqual(SUPPLIER_B.subScores);
    expect(afterB.tier).toBe(SUPPLIER_B.tier);
    expect(afterC.subScores).toEqual(SUPPLIER_C.subScores);
    expect(afterC.tier).toBe(SUPPLIER_C.tier);
  });

  it('applies the edited score to the one changed supplier', () => {
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '99' },
      },
    };
    const onlyACsv   = buildCsvString([editedA]);
    const { rows }   = parseCsvFile(onlyACsv, ['Supplier Name']);

    const { nextSuppliers, imported } = simulateImport([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, true);

    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(imported).toBe(1);
    expect(afterA.subScores.delivery.otif).toBe('99');
  });

  it('preserves the unchanged sub-keys within the edited supplier\'s own dimension', () => {
    // Only OTIF changes — lead_time, fill_rate, expedite inside delivery must survive
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '99' },
      },
    };
    const onlyACsv   = buildCsvString([editedA]);
    const { rows }   = parseCsvFile(onlyACsv, ['Supplier Name']);

    const { nextSuppliers } = simulateImport([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, true);
    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;

    expect(afterA.subScores.delivery.lead_time).toBe(SUPPLIER_A.subScores.delivery.lead_time);
    expect(afterA.subScores.delivery.fill_rate).toBe(SUPPLIER_A.subScores.delivery.fill_rate);
    expect(afterA.subScores.delivery.expedite).toBe(SUPPLIER_A.subScores.delivery.expedite);
  });

  it('preserves all dimensions not mentioned in the one-row CSV', () => {
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '99' },
      },
    };
    const onlyACsv   = buildCsvString([editedA]);
    const { rows }   = parseCsvFile(onlyACsv, ['Supplier Name']);

    const { nextSuppliers } = simulateImport([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, true);
    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;

    expect(afterA.subScores.quality).toEqual(SUPPLIER_A.subScores.quality);
    expect(afterA.subScores.cost).toEqual(SUPPLIER_A.subScores.cost);
    expect(afterA.subScores.compliance).toEqual(SUPPLIER_A.subScores.compliance);
    expect(afterA.subScores.innovation).toEqual(SUPPLIER_A.subScores.innovation);
    expect(afterA.subScores.relationship).toEqual(SUPPLIER_A.subScores.relationship);
  });

  it('skip-duplicates path: choosing Cancel leaves all three suppliers byte-identical', () => {
    // User imports a CSV for Alpha Corp with changed scores but picks Cancel (overwrite = false)
    const editedA: SupplierRecord = {
      ...SUPPLIER_A,
      subScores: {
        ...SUPPLIER_A.subScores,
        delivery: { ...SUPPLIER_A.subScores.delivery, otif: '1' },
      },
    };
    const onlyACsv   = buildCsvString([editedA]);
    const { rows }   = parseCsvFile(onlyACsv, ['Supplier Name']);

    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, false /* overwrite = false */
    );

    expect(imported).toBe(0);
    expect(skipped).toBe(1);
    expect(nextSuppliers).toHaveLength(3);

    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
  });

  it('skip-duplicates path: a new supplier in the same CSV is still added', () => {
    // CSV contains Alpha Corp (duplicate → skip) and a brand-new Delta Inc
    const deltaInc: SupplierRecord = {
      id: 'sup-d',
      name: 'Delta Inc',
      tier: 'Strategic',
      subScores: {
        delivery: { otif: '88', lead_time: '82' },
        quality:  { ftr: '79' },
        cost: {}, compliance: {}, innovation: {}, relationship: {},
      },
    };
    const mixedCsv   = buildCsvString([SUPPLIER_A, deltaInc]);
    const { rows }   = parseCsvFile(mixedCsv, ['Supplier Name']);

    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, false /* overwrite = false */
    );

    expect(skipped).toBe(1);
    expect(imported).toBe(1);
    expect(nextSuppliers).toHaveLength(4);

    const added = nextSuppliers.find(s => s.name === 'Delta Inc')!;
    expect(added).toBeDefined();
    expect(added.subScores.delivery?.otif).toBe('88');

    // Original A is untouched
    const afterA = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(afterA.subScores).toEqual(SUPPLIER_A.subScores);
  });

  it('re-importing all 3 suppliers with edits updates all 3 without changing the roster size', () => {
    const editAll = [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C].map(s => ({
      ...s,
      subScores: {
        ...s.subScores,
        delivery: { ...(s.subScores.delivery ?? {}), otif: '55' },
      },
    }));
    const csv      = buildCsvString(editAll);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);

    const { nextSuppliers, imported } = simulateImport([SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], rows, true);

    expect(imported).toBe(3);
    expect(nextSuppliers).toHaveLength(3);
    for (const s of nextSuppliers) {
      expect(s.subScores.delivery?.otif).toBe('55');
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 4 — Case-insensitive supplier name matching

   Intent: a supplier name that differs only in letter case from an existing
   roster entry must NOT create a silent ghost duplicate. The import logic
   uses case-insensitive comparison so "alpha corp", "Alpha Corp", and
   "ALPHA CORP" all resolve to the same roster entry.

   Chosen behaviour: case-insensitive match → treat as the same supplier
   (merge/overwrite with the same confirm prompt, or skip — no silent add).
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard CSV — case-insensitive supplier name matching', () => {
  beforeEach(() => localStorage.clear());

  it('does not create a duplicate when CSV name is all-lowercase variant', () => {
    // Roster has "Alpha Corp"; CSV supplies "alpha corp"
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '77',
    };
    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      true, // overwrite
    );

    // Roster must still have exactly 3 entries — no ghost added
    expect(nextSuppliers).toHaveLength(3);
    expect(imported).toBe(1);
    expect(skipped).toBe(0);
  });

  it('does not create a duplicate when CSV name is all-uppercase variant', () => {
    const uppercaseRow: Record<string, string> = {
      'Supplier Name': 'ALPHA CORP',
      'Current Tier': 'Strategic',
      'Delivery Performance — OTIF %': '88',
    };
    const { nextSuppliers, imported } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [uppercaseRow],
      true,
    );

    expect(nextSuppliers).toHaveLength(3);
    expect(imported).toBe(1);
  });

  it('does not create a duplicate when CSV name has mixed case different from the roster', () => {
    const mixedRow: Record<string, string> = {
      'Supplier Name': 'aLpHa CoRp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '60',
    };
    const { nextSuppliers } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [mixedRow],
      true,
    );

    expect(nextSuppliers).toHaveLength(3);
  });

  it('overwrites the matched existing entry (not adds a new one) on overwrite=true', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '42',
    };
    const { nextSuppliers } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      true,
    );

    // The matched entry has the updated score; no ghost with lowercase name
    const original = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(original).toBeDefined();
    expect(original.subScores.delivery?.otif).toBe('42');

    const ghost = nextSuppliers.find(s => s.name === 'alpha corp');
    expect(ghost).toBeUndefined();
  });

  it('skips (does not add) the case-variant when overwrite=false', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '42',
    };
    const { nextSuppliers, imported, skipped } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      false, // user chose Cancel
    );

    expect(nextSuppliers).toHaveLength(3);
    expect(imported).toBe(0);
    expect(skipped).toBe(1);

    // Original entry is untouched
    const original = nextSuppliers.find(s => s.name === 'Alpha Corp')!;
    expect(original.subScores).toEqual(SUPPLIER_A.subScores);
  });

  it('still adds a genuinely new supplier whose name differs by more than case', () => {
    const newRow: Record<string, string> = {
      'Supplier Name': 'Alpha Corp International', // different name, not just case
      'Current Tier': 'Strategic',
      'Delivery Performance — OTIF %': '80',
    };
    const { nextSuppliers, imported } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [newRow],
      true,
    );

    // Roster grows to 4 — the new name is genuinely different
    expect(nextSuppliers).toHaveLength(4);
    expect(imported).toBe(1);
    const added = nextSuppliers.find(s => s.name === 'Alpha Corp International');
    expect(added).toBeDefined();
  });
});
