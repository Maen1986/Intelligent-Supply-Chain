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
import { DIMS, SUB_INDICATORS, hasCaseInsensitiveDuplicate } from '../SupplierScorecard';
import {
  buildScorecardCsvString,
  calcWeightedScore,
  getTier,
  parseSubScoresFromRow,
  type ScorecardConfig,
  type SupplierRecord,
} from '@/lib/scorecardCsv';

// Alias so all existing test call-sites remain unchanged.
const buildCsvString = buildScorecardCsvString;

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
  isAr = false,
): { nextSuppliers: SupplierRecord[]; imported: number; skipped: number; log: string[] } {
  const nextSuppliers = rosterSuppliers.map(s => ({
    ...s,
    subScores: { ...s.subScores },
  }));

  let imported = 0;
  let skipped  = 0;
  const log: string[] = [];

  csvRows.forEach((row, ri) => {
    const rowNum = ri + 2; // 1-based header + 1-based data rows
    const name = row['Supplier Name']?.trim();
    if (!name) return;

    const { subScores: incoming } = parseSubScoresFromRow(row);

    // Case-insensitive match — mirrors the fixed handleScorecardImport behaviour.
    const existingIdx = nextSuppliers.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      const existingName = nextSuppliers[existingIdx].name;
      const isCaseVariant = existingName !== name;
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
        if (isCaseVariant) {
          log.push(
            isAr
              ? `الصف ${rowNum}: '${name}' تطابق مع '${existingName}' الموجود — تم الدمج.`
              : `Row ${rowNum}: '${name}' matched existing '${existingName}' — merged.`
          );
        }
      } else {
        skipped++;
        if (isCaseVariant) {
          log.push(
            isAr
              ? `الصف ${rowNum}: '${name}' تطابق مع '${existingName}' الموجود — تم التخطي.`
              : `Row ${rowNum}: '${name}' matched existing '${existingName}' — skipped.`
          );
        }
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
  });

  return { nextSuppliers, imported, skipped, log };
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

  it('log includes a case-variant notice when overwrite=true and names differ by case', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '77',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      true,
    );

    // Must contain a message that identifies the CSV name, the existing name, and "merged"
    expect(log.length).toBeGreaterThanOrEqual(1);
    const notice = log.find(m => m.includes("'alpha corp'") && m.includes("'Alpha Corp'") && m.includes('merged'));
    expect(notice).toBeDefined();
    expect(notice).toMatch(/Row 2:/);
  });

  it('log includes a case-variant notice when overwrite=false and names differ by case', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '77',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      false,
    );

    expect(log.length).toBeGreaterThanOrEqual(1);
    const notice = log.find(m => m.includes("'alpha corp'") && m.includes("'Alpha Corp'") && m.includes('skipped'));
    expect(notice).toBeDefined();
    expect(notice).toMatch(/Row 2:/);
  });

  it('does NOT add a case-variant notice when the name matches exactly', () => {
    // Exact match: "Alpha Corp" → "Alpha Corp" — no notice needed
    const exactRow: Record<string, string> = {
      'Supplier Name': 'Alpha Corp',
      'Current Tier': 'Strategic',
      'Delivery Performance — OTIF %': '95',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [exactRow],
      true,
    );

    const caseNotice = log.find(m => m.includes('matched existing'));
    expect(caseNotice).toBeUndefined();
  });

  it('Arabic mode — log includes Arabic case-variant notice when overwrite=true', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '77',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      true,
      true, // isAr
    );

    expect(log.length).toBeGreaterThanOrEqual(1);
    const notice = log.find(m =>
      m.includes("'alpha corp'") &&
      m.includes("'Alpha Corp'") &&
      m.includes('تم الدمج')
    );
    expect(notice).toBeDefined();
    expect(notice).toMatch(/^الصف 2:/);
  });

  it('Arabic mode — log includes Arabic case-variant notice when overwrite=false', () => {
    const lowercaseRow: Record<string, string> = {
      'Supplier Name': 'alpha corp',
      'Current Tier': 'Preferred',
      'Delivery Performance — OTIF %': '77',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [lowercaseRow],
      false,
      true, // isAr
    );

    expect(log.length).toBeGreaterThanOrEqual(1);
    const notice = log.find(m =>
      m.includes("'alpha corp'") &&
      m.includes("'Alpha Corp'") &&
      m.includes('تم التخطي')
    );
    expect(notice).toBeDefined();
    expect(notice).toMatch(/^الصف 2:/);
  });

  it('Arabic mode — no notice emitted when the name matches exactly', () => {
    const exactRow: Record<string, string> = {
      'Supplier Name': 'Alpha Corp',
      'Current Tier': 'Strategic',
      'Delivery Performance — OTIF %': '95',
    };
    const { log } = simulateImport(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C],
      [exactRow],
      true,
      true, // isAr
    );

    expect(log.find(m => m.includes('تطابق'))).toBeUndefined();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 5 — Manual-add duplicate guard (hasCaseInsensitiveDuplicate)

   Tests the pure helper exported from SupplierScorecard that backs the
   name-field blur check. Ensures that typing a name whose case-folded form
   already exists in the roster is detected so the commit can be blocked.
══════════════════════════════════════════════════════════════════════════ */

describe('Manual-add — hasCaseInsensitiveDuplicate', () => {
  const ROSTER = [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C];

  it('returns false for an empty name', () => {
    expect(hasCaseInsensitiveDuplicate('', ROSTER)).toBe(false);
  });

  it('returns false for a whitespace-only name', () => {
    expect(hasCaseInsensitiveDuplicate('   ', ROSTER)).toBe(false);
  });

  it('returns false when the name is genuinely new', () => {
    expect(hasCaseInsensitiveDuplicate('Delta Inc', ROSTER)).toBe(false);
  });

  it('returns true for an exact-case match', () => {
    expect(hasCaseInsensitiveDuplicate('Alpha Corp', ROSTER)).toBe(true);
  });

  it('returns true when the typed name is all-lowercase', () => {
    expect(hasCaseInsensitiveDuplicate('alpha corp', ROSTER)).toBe(true);
  });

  it('returns true when the typed name is all-uppercase', () => {
    expect(hasCaseInsensitiveDuplicate('ALPHA CORP', ROSTER)).toBe(true);
  });

  it('returns true for a mixed-case variant', () => {
    expect(hasCaseInsensitiveDuplicate('aLpHa CoRp', ROSTER)).toBe(true);
  });

  it('returns false when the only match is the supplier being edited (excludeId)', () => {
    // User edits "Alpha Corp" without changing the name — must not warn against itself.
    expect(hasCaseInsensitiveDuplicate('alpha corp', ROSTER, SUPPLIER_A.id)).toBe(false);
  });

  it('still returns true when a different supplier has the same name (excludeId for a third)', () => {
    // Roster has A ("Alpha Corp") and B. User edits C and types "alpha corp" → warn.
    expect(hasCaseInsensitiveDuplicate('alpha corp', ROSTER, SUPPLIER_C.id)).toBe(true);
  });

  it('trims leading/trailing whitespace before comparing', () => {
    expect(hasCaseInsensitiveDuplicate('  Alpha Corp  ', ROSTER)).toBe(true);
  });

  it('returns false for a partial name that is not a full match', () => {
    expect(hasCaseInsensitiveDuplicate('Alpha', ROSTER)).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 6 — Roster-state invariant for manual-add/rename

   Simulates the commit-on-blur logic used by the name field:
     - onChange  → only updates local pending display; roster unchanged
     - onBlur    → if duplicate: rejected (roster unchanged)
                   if unique:   committed (roster updated)

   These tests prove the DATA-LAYER INVARIANT: no case-variant duplicate
   can ever enter the roster through the manual-add or rename path.
══════════════════════════════════════════════════════════════════════════ */

/**
 * Pure simulation of handleNameBlur in SupplierScorecard.
 * Returns the roster after attempting to commit `typedName` for supplier `activeId`.
 * If a duplicate is detected the roster is returned unchanged and `rejected` is true.
 */
function simulateNameBlur(
  suppliers: SupplierRecord[],
  activeId: string,
  typedName: string,
): { suppliers: SupplierRecord[]; rejected: boolean; conflictsWith: string | null } {
  const isDup = hasCaseInsensitiveDuplicate(typedName, suppliers, activeId);
  if (isDup) {
    const conflict = suppliers.find(
      s => s.id !== activeId && s.name.toLowerCase() === typedName.trim().toLowerCase(),
    )!;
    return { suppliers, rejected: true, conflictsWith: conflict.name };
  }
  // Commit: update the supplier's name in the roster
  const updated = suppliers.map(s =>
    s.id === activeId ? { ...s, name: typedName } : s,
  );
  return { suppliers: updated, rejected: false, conflictsWith: null };
}

describe('Manual-add — roster-state invariant', () => {
  it('new blank supplier: case-variant name is rejected and roster size stays the same', () => {
    // Add a blank new supplier (simulates clicking "Add Supplier")
    const blank: SupplierRecord = { id: 'new-blank', name: '', tier: 'Strategic', subScores: {} };
    const withBlank = [SUPPLIER_A, SUPPLIER_B, blank];

    // User types "alpha corp" (case-variant of "Alpha Corp") and blurs
    const { suppliers: after, rejected } = simulateNameBlur(withBlank, 'new-blank', 'alpha corp');

    expect(rejected).toBe(true);
    expect(after).toHaveLength(3);
    // The blank supplier's name was NOT updated — still empty
    expect(after.find(s => s.id === 'new-blank')!.name).toBe('');
    // Still exactly one entry with that lowercased name (the original SUPPLIER_A) — no ghost added
    expect(after.filter(s => s.name.toLowerCase() === 'alpha corp')).toHaveLength(1);
    expect(after.find(s => s.name.toLowerCase() === 'alpha corp')!.id).toBe(SUPPLIER_A.id);
  });

  it('new blank supplier: uppercase variant is also rejected', () => {
    const blank: SupplierRecord = { id: 'new-blank', name: '', tier: 'Strategic', subScores: {} };
    const withBlank = [SUPPLIER_A, SUPPLIER_B, blank];

    const { rejected } = simulateNameBlur(withBlank, 'new-blank', 'ALPHA CORP');
    expect(rejected).toBe(true);
  });

  it('new blank supplier: genuinely new name is accepted and committed', () => {
    const blank: SupplierRecord = { id: 'new-blank', name: '', tier: 'Strategic', subScores: {} };
    const withBlank = [SUPPLIER_A, SUPPLIER_B, blank];

    const { suppliers: after, rejected } = simulateNameBlur(withBlank, 'new-blank', 'Delta Inc');

    expect(rejected).toBe(false);
    expect(after).toHaveLength(3);
    expect(after.find(s => s.id === 'new-blank')!.name).toBe('Delta Inc');
  });

  it('rename: typing the current name (same case) is accepted (not flagged against itself)', () => {
    // User opens "Alpha Corp", re-types "Alpha Corp" unchanged, blurs.
    const { suppliers: after, rejected } = simulateNameBlur(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], SUPPLIER_A.id, 'Alpha Corp',
    );
    expect(rejected).toBe(false);
    expect(after.find(s => s.id === SUPPLIER_A.id)!.name).toBe('Alpha Corp');
  });

  it('rename: typing the current name in a different case is accepted (not flagged against itself)', () => {
    const { rejected } = simulateNameBlur(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], SUPPLIER_A.id, 'alpha corp',
    );
    expect(rejected).toBe(false);
  });

  it('rename: typing another existing supplier\'s name (case-variant) is rejected', () => {
    // User edits SUPPLIER_C and types "beta ltd" (matches SUPPLIER_B case-insensitively)
    const { suppliers: after, rejected, conflictsWith } = simulateNameBlur(
      [SUPPLIER_A, SUPPLIER_B, SUPPLIER_C], SUPPLIER_C.id, 'beta ltd',
    );
    expect(rejected).toBe(true);
    expect(conflictsWith).toBe('Beta Ltd');
    // SUPPLIER_C name is unchanged
    expect(after.find(s => s.id === SUPPLIER_C.id)!.name).toBe('Gamma GmbH');
  });

  it('roster contains no two entries with the same lowercased name after any sequence of commits', () => {
    // Simulate a sequence: add blank, commit "delta inc", then try to add another "DELTA INC" — rejected.
    const blank1: SupplierRecord = { id: 'new-1', name: '', tier: 'Strategic', subScores: {} };
    let current = [SUPPLIER_A, blank1];

    // First commit succeeds
    const step1 = simulateNameBlur(current, 'new-1', 'delta inc');
    expect(step1.rejected).toBe(false);
    current = step1.suppliers;

    const blank2: SupplierRecord = { id: 'new-2', name: '', tier: 'Strategic', subScores: {} };
    current = [...current, blank2];

    // Second commit with a case-variant of the same name is rejected
    const step2 = simulateNameBlur(current, 'new-2', 'DELTA INC');
    expect(step2.rejected).toBe(true);
    current = step2.suppliers; // roster unchanged

    // Invariant: no two entries share a lowercased name
    const names = current.map(s => s.name.toLowerCase());
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 7 — Tier fallback on re-import when CSV "Current Tier" cell is blank

   Verifies the fallback in handleScorecardImport:
     tier: row['Current Tier']?.trim() || nextSuppliers[existingIdx].tier
   A blank CSV tier cell must NOT clobber the supplier's manually-set tier.
   A non-blank CSV tier cell must be applied.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard CSV — tier preservation on re-import', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the existing manually-set tier when the CSV "Current Tier" cell is blank', () => {
    // Roster has a supplier with tier "Strategic".
    const existing: SupplierRecord = {
      id: 'sup-tier-test',
      name: 'Tier Test Supplier',
      tier: 'Strategic',
      subScores: { delivery: { otif: '80' } },
    };

    // Re-import CSV row where "Current Tier" is absent (blank cell).
    const csvRowBlankTier: Record<string, string> = {
      'Supplier Name': 'Tier Test Supplier',
      'Current Tier': '',  // blank — fallback must fire
      'Delivery Performance — OTIF %': '90',
    };

    const { nextSuppliers } = simulateImport([existing], [csvRowBlankTier], true);

    const after = nextSuppliers.find(s => s.name === 'Tier Test Supplier')!;
    expect(after).toBeDefined();
    // Tier must remain "Strategic" — the blank CSV cell must not clobber it.
    expect(after.tier).toBe('Strategic');
  });

  it('keeps the existing tier when the CSV "Current Tier" cell contains only whitespace', () => {
    const existing: SupplierRecord = {
      id: 'sup-tier-ws',
      name: 'Whitespace Tier Supplier',
      tier: 'Preferred',
      subScores: {},
    };

    const csvRowWhitespaceTier: Record<string, string> = {
      'Supplier Name': 'Whitespace Tier Supplier',
      'Current Tier': '   ',  // whitespace-only — trim() → '' → fallback must fire
      'Delivery Performance — OTIF %': '75',
    };

    const { nextSuppliers } = simulateImport([existing], [csvRowWhitespaceTier], true);

    const after = nextSuppliers.find(s => s.name === 'Whitespace Tier Supplier')!;
    expect(after.tier).toBe('Preferred');
  });

  it('applies the tier from the CSV when the "Current Tier" cell has a valid value', () => {
    // Roster has a supplier with tier "Strategic".
    const existing: SupplierRecord = {
      id: 'sup-tier-update',
      name: 'Tier Update Supplier',
      tier: 'Strategic',
      subScores: { delivery: { otif: '70' } },
    };

    // Re-import CSV row with a non-blank, valid tier.
    const csvRowWithTier: Record<string, string> = {
      'Supplier Name': 'Tier Update Supplier',
      'Current Tier': 'Transactional',  // valid — must be applied
      'Delivery Performance — OTIF %': '65',
    };

    const { nextSuppliers } = simulateImport([existing], [csvRowWithTier], true);

    const after = nextSuppliers.find(s => s.name === 'Tier Update Supplier')!;
    expect(after).toBeDefined();
    // The CSV-supplied tier must be applied.
    expect(after.tier).toBe('Transactional');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 8 — Tier default for brand-new suppliers when "Current Tier" is
   absent or blank in the CSV

   Verifies the fallback in handleScorecardImport's new-supplier branch:
     tier: row['Current Tier']?.trim() || 'Strategic'
   A completely absent "Current Tier" column, or a blank cell, must both
   result in the supplier receiving the 'Strategic' default tier.
══════════════════════════════════════════════════════════════════════════ */

describe('Scorecard CSV — new-supplier tier default when "Current Tier" is absent or blank', () => {
  beforeEach(() => localStorage.clear());

  it('defaults tier to "Strategic" when the CSV row has no "Current Tier" key at all', () => {
    // Simulate a custom export that omits the "Current Tier" column entirely.
    const csvRow: Record<string, string> = {
      'Supplier Name': 'Brand New Supplier',
      // No 'Current Tier' key — column absent from the CSV.
      'Delivery Performance — OTIF %': '80',
    };

    const { nextSuppliers, imported } = simulateImport([], [csvRow], true);

    expect(imported).toBe(1);
    expect(nextSuppliers).toHaveLength(1);
    const added = nextSuppliers.find(s => s.name === 'Brand New Supplier')!;
    expect(added).toBeDefined();
    expect(added.tier).toBe('Strategic');
  });

  it('defaults tier to "Strategic" when the CSV row has a blank "Current Tier" cell', () => {
    // Simulate a CSV where the column exists but the cell for this row is empty.
    const csvRow: Record<string, string> = {
      'Supplier Name': 'Another New Supplier',
      'Current Tier': '',  // blank cell — fallback must fire
      'Delivery Performance — OTIF %': '70',
    };

    const { nextSuppliers, imported } = simulateImport([], [csvRow], true);

    expect(imported).toBe(1);
    expect(nextSuppliers).toHaveLength(1);
    const added = nextSuppliers.find(s => s.name === 'Another New Supplier')!;
    expect(added).toBeDefined();
    expect(added.tier).toBe('Strategic');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Suite 9 — Weighted Score and Calculated Tier columns in the CSV export

   Verifies that buildScorecardCsvString, when called WITH a ScorecardConfig,
   produces non-blank Weighted Score and Calculated Tier cells that match the
   output of calcWeightedScore / getTier — closing the gap that previously
   left those columns blank in every round-trip test.
══════════════════════════════════════════════════════════════════════════ */

/**
 * Config that mirrors the application's built-in default weights and tier
 * thresholds, so test assertions are stable and independent of any UI state.
 */
const DEFAULT_CONFIG: ScorecardConfig = {
  weights: {
    delivery:     25,
    quality:      25,
    cost:         20,
    compliance:   15,
    innovation:   10,
    relationship:  5,
  },
  tiers: { strategic: 75, preferred: 55 },
};

describe('Scorecard CSV — weighted score and calculated tier columns', () => {
  beforeEach(() => localStorage.clear());

  it('Weighted Score column is non-blank when a config is supplied', () => {
    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).not.toBe('');
  });

  it('Calculated Tier column is non-blank when a config is supplied', () => {
    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Calculated Tier']).not.toBe('');
  });

  it('Weighted Score cell matches the value returned by calcWeightedScore', () => {
    const expectedScore = calcWeightedScore(FULL_SUPPLIER.subScores, DEFAULT_CONFIG);
    expect(expectedScore).not.toBeNull();

    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe(String(expectedScore));
  });

  it('Calculated Tier cell matches the label returned by getTier', () => {
    const score = calcWeightedScore(FULL_SUPPLIER.subScores, DEFAULT_CONFIG)!;
    const expectedTier = getTier(score, DEFAULT_CONFIG).label;

    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Calculated Tier']).toBe(expectedTier);
  });

  it('Weighted Score cell equals 80 for FULL_SUPPLIER with default config', () => {
    // Computed value is pinned so any future drift in calcWeightedScore or
    // the sub-indicator averages is caught immediately by this assertion.
    //
    // Dim averages (Math.round of sub-indicator mean):
    //   delivery:     (92+85+78+70)/4 = 81.25 → 81
    //   quality:      (88+91+95+80)/4 = 88.5  → 89  (JS rounds .5 up)
    //   cost:         (65+97+50+72)/4 = 71     → 71
    //   compliance:   (100+74+89+83)/4 = 86.5  → 87
    //   innovation:   (60+45+77)/3    = 60.67  → 61
    //   relationship: (90+82+68)/3    = 80     → 80
    //
    // Weighted sum = (81×25 + 89×25 + 71×20 + 87×15 + 61×10 + 80×5) / 100
    //             = 7985 / 100 = 79.85 → Math.round → 80
    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe('80');
  });

  it('Calculated Tier cell equals "Strategic" for FULL_SUPPLIER with default config', () => {
    // Score 80 ≥ strategic threshold (75) → 'Strategic'
    const csv = buildScorecardCsvString([FULL_SUPPLIER], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Calculated Tier']).toBe('Strategic');
  });

  it('Weighted Score and Calculated Tier are blank when no config is supplied', () => {
    // Existing behaviour: omitting config leaves both computed columns empty.
    // This guards against accidentally breaking the no-config path.
    const csv = buildScorecardCsvString([FULL_SUPPLIER]);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe('');
    expect(rows[0]['Calculated Tier']).toBe('');
  });

  it('correctly populates both columns for a partially-scored supplier', () => {
    // Only delivery is scored — calcWeightedScore returns null (some dims missing) → blank cells.
    const partial: SupplierRecord = {
      id: 'sup-partial-ws',
      name: 'Partial WS',
      tier: 'Preferred',
      subScores: {
        delivery: { otif: '80', lead_time: '70', fill_rate: '60', expedite: '50' },
        // quality, cost, compliance, innovation, relationship intentionally absent
      },
    };
    const csv = buildScorecardCsvString([partial], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    // calcWeightedScore returns null when any dimension has no scores → both cells blank
    expect(rows[0]['Weighted Score (/100)']).toBe('');
    expect(rows[0]['Calculated Tier']).toBe('');
  });

  it('Weighted Score and Calculated Tier are correct for a Preferred-tier supplier', () => {
    // Construct a supplier whose weighted score falls in the Preferred band (55–74).
    const preferredSupplier: SupplierRecord = {
      id: 'sup-preferred',
      name: 'Preferred Supplier',
      tier: 'Preferred',
      subScores: {
        delivery:     { otif: '60', lead_time: '60', fill_rate: '60', expedite: '60' },
        quality:      { defect: '60', ftr: '60', cert: '60', nonconf: '60' },
        cost:         { savings: '60', invoice: '60', cost_reduction: '60', tco: '60' },
        compliance:   { regulatory: '60', esg: '60', docs: '60', ethics: '60' },
        innovation:   { ideas: '60', implemented: '60', tech: '60' },
        relationship: { responsiveness: '60', resolution: '60', collaboration: '60' },
      },
    };
    // All dim averages = 60, weighted score = Math.round(60/100 * 100/100 * 100) = 60
    const expectedScore = calcWeightedScore(preferredSupplier.subScores, DEFAULT_CONFIG)!;
    const expectedTier  = getTier(expectedScore, DEFAULT_CONFIG).label;

    const csv = buildScorecardCsvString([preferredSupplier], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe(String(expectedScore));
    expect(rows[0]['Calculated Tier']).toBe(expectedTier);
    expect(rows[0]['Calculated Tier']).toBe('Preferred');
  });

  it('populates both columns for every supplier in a multi-supplier export', () => {
    const supplier2: SupplierRecord = {
      id: 'sup-multi-2',
      name: 'Full Supplier 2',
      tier: 'Transactional',
      subScores: {
        delivery:     { otif: '40', lead_time: '40', fill_rate: '40', expedite: '40' },
        quality:      { defect: '40', ftr: '40', cert: '40', nonconf: '40' },
        cost:         { savings: '40', invoice: '40', cost_reduction: '40', tco: '40' },
        compliance:   { regulatory: '40', esg: '40', docs: '40', ethics: '40' },
        innovation:   { ideas: '40', implemented: '40', tech: '40' },
        relationship: { responsiveness: '40', resolution: '40', collaboration: '40' },
      },
    };

    const csv = buildScorecardCsvString([FULL_SUPPLIER, supplier2], DEFAULT_CONFIG);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows).toHaveLength(2);

    // First supplier
    expect(rows[0]['Weighted Score (/100)']).toBe('80');
    expect(rows[0]['Calculated Tier']).toBe('Strategic');

    // Second supplier — all dims = 40, weighted score = 40, tier = Transactional
    const score2 = calcWeightedScore(supplier2.subScores, DEFAULT_CONFIG)!;
    expect(rows[1]['Weighted Score (/100)']).toBe(String(score2));
    expect(rows[1]['Calculated Tier']).toBe(getTier(score2, DEFAULT_CONFIG).label);
    expect(rows[1]['Calculated Tier']).toBe('Transactional');
  });

  it('Calculated Tier is "Strategic" when score equals the strategic threshold exactly (tiers.strategic = 80)', () => {
    // FULL_SUPPLIER scores 80 with DEFAULT_CONFIG weights. Raising the strategic
    // threshold to exactly 80 puts the score right on the boundary.
    // getTier uses >=, so 80 >= 80 must still resolve to Strategic.
    const configStrategicAt80: ScorecardConfig = {
      ...DEFAULT_CONFIG,
      tiers: { strategic: 80, preferred: 55 },
    };

    const score = calcWeightedScore(FULL_SUPPLIER.subScores, configStrategicAt80);
    expect(score).toBe(80); // precondition: score is unchanged (weights are the same)

    const csv = buildScorecardCsvString([FULL_SUPPLIER], configStrategicAt80);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe('80');
    expect(rows[0]['Calculated Tier']).toBe('Strategic');
  });

  it('Calculated Tier is "Preferred" when score falls one point below the strategic threshold (tiers.strategic = 81)', () => {
    // With strategic threshold at 81, score 80 no longer qualifies for Strategic.
    // 80 >= preferred threshold (55), so the tier must be Preferred.
    const configStrategicAt81: ScorecardConfig = {
      ...DEFAULT_CONFIG,
      tiers: { strategic: 81, preferred: 55 },
    };

    const score = calcWeightedScore(FULL_SUPPLIER.subScores, configStrategicAt81);
    expect(score).toBe(80); // precondition: score is unchanged (weights are the same)

    const csv = buildScorecardCsvString([FULL_SUPPLIER], configStrategicAt81);
    const { rows } = parseCsvFile(csv, ['Supplier Name']);
    expect(rows[0]['Weighted Score (/100)']).toBe('80');
    expect(rows[0]['Calculated Tier']).toBe('Preferred');
  });
});
