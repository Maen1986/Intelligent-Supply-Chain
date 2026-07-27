/**
 * KPI Template download and import auto-calculation tests.
 *
 * Verifies:
 *  1. Template CSV structure for lean-six-sigma and risk-management frameworks
 *  2. Import round-trip: fill "Your Value" → auto-calculated KPI results match expected
 *  3. Legacy "Actual Value" direct-entry import format
 *  4. Fallback direct-entry rows for KPI IDs that have no spec in KPI_DATA_SPECS
 */

import { describe, it, expect } from 'vitest';
import { KPI_FRAMEWORKS } from './KPIDashboard';
import { KPI_DATA_SPECS, KpiDataSpec } from '@/lib/kpiDataSpecs';
import { parseCsvFile } from '@/lib/importCsv';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Escape a single CSV cell the same way downloadCsv does */
function escapeCell(cell: string): string {
  return `"${cell.replace(/"/g, '""')}"`;
}

/** Convert a 2-D rows array to CSV text (mirrors downloadCsv, minus the DOM/BOM) */
function rowsToCsvText(rows: string[][]): string {
  return rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
}

/**
 * Replicate the downloadKpiTemplate row-building logic as a pure function so
 * we can inspect and round-trip the template without a DOM.
 */
function buildTemplateRows(resolvedSlug: string): string[][] {
  const kpis = KPI_FRAMEWORKS[resolvedSlug];
  if (!kpis) throw new Error(`No KPI framework for slug "${resolvedSlug}"`);

  const frameworkLabel = resolvedSlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const allRows: string[][] = [
    ['I Supply Chain — KPI Data Collection Template', '', '', '', '', ''],
    [`Framework: ${frameworkLabel}`, '', '', '', '', ''],
    [`Generated: 1 January 2026 | Ma'in Alhaqash MCIPS CPSM | isupplychain.com`, '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['INSTRUCTIONS:', 'Fill in the "Your Value" column (column C) for EVERY input row.', '', '', '', ''],
    ['', 'Do NOT modify KPI ID, Input Field, Unit, or Formula columns.', '', '', '', ''],
    ['', 'When complete, click "Import CSV" in the KPI Dashboard to auto-calculate results.', '', '', '', ''],
    ['', 'Each KPI section shows what raw data to collect and exactly where to find it.', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['KPI ID', 'Input Field', 'Your Value', 'Unit', 'Data Source / Where to Find This', 'Calculation Formula'],
  ];

  kpis.forEach(k => {
    const spec: KpiDataSpec | undefined = KPI_DATA_SPECS[k.id];

    allRows.push(['', '', '', '', '', '']);
    allRows.push([
      `=== ${k.label.toUpperCase()} ===`,
      spec
        ? spec.methodology.substring(0, 120) + (spec.methodology.length > 120 ? '…' : '')
        : k.description,
      '', '', '',
      spec ? spec.formula : '',
    ]);

    if (spec) {
      spec.inputs.forEach(inp => {
        allRows.push([k.id, inp.label, '', inp.unit, inp.dataSource, '']);
      });
      if (spec.notes) {
        allRows.push(['', `📌 Note: ${spec.notes}`, '', '', '', '']);
      }
      allRows.push([
        `${k.id}__result`,
        `[AUTO-CALCULATED] ${k.label}`,
        '← calculated on import',
        k.unit,
        `Target: ${k.targetLabel} | GCC Benchmark: ${k.benchmarkLabel}`,
        spec.formula,
      ]);
    } else {
      // Fallback — no spec: simple direct entry
      allRows.push([k.id, `Enter your ${k.label} value directly`, '', k.unit, k.description, '']);
      allRows.push([
        `${k.id}__result`,
        `[DIRECT ENTRY] ${k.label}`,
        '',
        k.unit,
        `Target: ${k.targetLabel} | Benchmark: ${k.benchmarkLabel}`,
        'Direct value — no raw inputs required',
      ]);
    }
  });

  allRows.push(['', '', '', '', '', '']);
  allRows.push([
    '--- END OF TEMPLATE ---',
    'Return the completed file to I Supply Chain or import directly into the KPI Dashboard.',
    '', '', '', '',
  ]);

  return allRows;
}

/**
 * Replicate the handleKpiImport "new format" calculation logic as a pure
 * function that returns the computed KPI values (without React state).
 */
function runNewFormatImport(
  csvText: string,
  resolvedSlug: string,
): { values: Record<string, number>; log: string[] } {
  const kpis = KPI_FRAMEWORKS[resolvedSlug]!;
  const { rows: csvRows } = parseCsvFile(csvText, ['KPI ID', 'Input Field', 'Your Value', 'Unit']);
  const log: string[] = [];

  // Group numeric inputs by kpiId
  const inputsByKpi: Record<string, Record<string, number>> = {};
  csvRows.forEach(row => {
    const kpiId = row['KPI ID']?.trim().toLowerCase();
    const inputLabel = row['Input Field']?.trim();
    const rawVal = row['Your Value']?.trim();
    if (!kpiId || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId === '' || kpiId.endsWith('__result')) return;
    if (!rawVal || rawVal === '← calculated on import') return;
    const num = parseFloat(rawVal.replace(/,/g, ''));
    if (isNaN(num)) { log.push(`Skipped "${inputLabel}": "${rawVal}" is not a number.`); return; }

    const spec = KPI_DATA_SPECS[kpiId];
    if (!spec) return;

    const inputDef =
      spec.inputs.find(inp =>
        inputLabel.toLowerCase().includes(inp.id.toLowerCase()) ||
        inp.label.toLowerCase().substring(0, 30) === inputLabel.toLowerCase().substring(0, 30),
      ) ??
      spec.inputs.find((_, idx) => {
        const kpiRows = csvRows.filter(
          r => r['KPI ID']?.trim().toLowerCase() === kpiId &&
               r['Your Value']?.trim() &&
               r['Your Value']?.trim() !== '← calculated on import',
        );
        return kpiRows.indexOf(row) === idx;
      });

    if (!inputDef) return;
    if (!inputsByKpi[kpiId]) inputsByKpi[kpiId] = {};
    inputsByKpi[kpiId][inputDef.id] = num;
  });

  // Calculate each KPI
  const values: Record<string, number> = {};
  kpis.forEach(k => {
    const spec = KPI_DATA_SPECS[k.id];
    const inputs = inputsByKpi[k.id];
    if (!inputs || !spec) return;

    const requiredIds = spec.inputs.map(i => i.id);
    const missingIds = requiredIds.filter(id => inputs[id] === undefined);
    if (missingIds.length > 0) {
      const vals = Object.values(inputs);
      if (vals.length === requiredIds.length) {
        requiredIds.forEach((id, idx) => { inputs[id] = vals[idx]; });
      } else {
        log.push(`${k.label}: missing inputs (${missingIds.join(', ')}) — skipped.`);
        return;
      }
    }

    const result = spec.calculate(inputs);
    if (isNaN(result)) { log.push(`${k.label}: calculation returned invalid result.`); return; }
    values[k.id] = result;
    log.push(`✓ ${k.label}: ${result} ${k.unit}`);
  });

  return { values, log };
}

// ─── 1. Template structure ───────────────────────────────────────────────────

describe('KPI template structure', () => {
  for (const slug of ['lean-six-sigma', 'risk-management'] as const) {
    describe(`slug: ${slug}`, () => {
      const rows = buildTemplateRows(slug);
      const csvText = rowsToCsvText(rows);

      it('has branded header rows', () => {
        expect(rows[0][0]).toBe('I Supply Chain — KPI Data Collection Template');
        expect(rows[1][0]).toMatch(/Framework:/);
        expect(rows[2][0]).toContain("Ma'in Alhaqash MCIPS CPSM");
      });

      it('has column header row with required columns', () => {
        const headerRow = rows.find(r => r[0] === 'KPI ID');
        expect(headerRow).toBeDefined();
        expect(headerRow).toContain('Input Field');
        expect(headerRow).toContain('Your Value');
        expect(headerRow).toContain('Unit');
        expect(headerRow).toContain('Calculation Formula');
      });

      it('contains "Your Value" and "Input Field" tokens (enables new-format detection on import)', () => {
        expect(csvText).toContain('Your Value');
        expect(csvText).toContain('Input Field');
      });

      it('has per-KPI section headers for all KPIs', () => {
        const kpis = KPI_FRAMEWORKS[slug]!;
        kpis.forEach(k => {
          const sectionRow = rows.find(r => r[0] === `=== ${k.label.toUpperCase()} ===`);
          expect(sectionRow, `Missing section header for KPI "${k.label}"`).toBeDefined();
        });
      });

      it('has at least one input row per KPI that has a spec (blank "Your Value" column)', () => {
        const kpis = KPI_FRAMEWORKS[slug]!;
        kpis.forEach(k => {
          const spec = KPI_DATA_SPECS[k.id];
          if (!spec) return; // fallback KPIs tested separately
          const inputRows = rows.filter(r => r[0] === k.id);
          expect(inputRows.length, `No input rows for KPI "${k.id}"`).toBeGreaterThan(0);
          // "Your Value" column (index 2) must be blank in every input row
          inputRows.forEach(r => {
            expect(r[2], `"Your Value" must be blank in template row for ${k.id}`).toBe('');
          });
        });
      });

      it('has exactly one input row per defined input field for each spec KPI', () => {
        const kpis = KPI_FRAMEWORKS[slug]!;
        kpis.forEach(k => {
          const spec = KPI_DATA_SPECS[k.id];
          if (!spec) return;
          const inputRows = rows.filter(r => r[0] === k.id);
          expect(inputRows.length, `Expected ${spec.inputs.length} input rows for "${k.id}", got ${inputRows.length}`)
            .toBe(spec.inputs.length);
        });
      });

      it('has an AUTO-CALCULATED result placeholder row for each spec KPI', () => {
        const kpis = KPI_FRAMEWORKS[slug]!;
        kpis.forEach(k => {
          const spec = KPI_DATA_SPECS[k.id];
          if (!spec) return;
          const resultRow = rows.find(r => r[0] === `${k.id}__result`);
          expect(resultRow, `Missing __result row for "${k.id}"`).toBeDefined();
          expect(resultRow![1]).toContain('[AUTO-CALCULATED]');
          expect(resultRow![2]).toBe('← calculated on import');
        });
      });

      it('ends with END OF TEMPLATE footer', () => {
        const lastRows = rows.slice(-2);
        const hasFooter = lastRows.some(r => r[0].includes('END OF TEMPLATE'));
        expect(hasFooter).toBe(true);
      });
    });
  }
});

// ─── 2. Fallback rows for KPIs without a spec ───────────────────────────────

describe('Fallback direct-entry rows for KPIs without a spec', () => {
  it('risk-management: crm, srs, rrc2 have no spec and get DIRECT ENTRY placeholder rows', () => {
    const rows = buildTemplateRows('risk-management');
    // These three KPI IDs exist in the framework but NOT in KPI_DATA_SPECS
    for (const kpiId of ['crm', 'srs', 'rrc2']) {
      expect(KPI_DATA_SPECS[kpiId], `${kpiId} should not have a spec`).toBeUndefined();

      // Should have a direct-entry input row with kpiId as the row ID
      const directRow = rows.find(r => r[0] === kpiId);
      expect(directRow, `Missing direct-entry row for "${kpiId}"`).toBeDefined();
      expect(directRow![2]).toBe(''); // "Your Value" blank

      // Should have a DIRECT ENTRY result placeholder row
      const resultRow = rows.find(r => r[0] === `${kpiId}__result`);
      expect(resultRow, `Missing __result row for fallback KPI "${kpiId}"`).toBeDefined();
      expect(resultRow![1]).toContain('[DIRECT ENTRY]');
    }
  });
});

// ─── 3. Import round-trip — lean-six-sigma ──────────────────────────────────

describe('Import round-trip: lean-six-sigma', () => {
  it('calculates all 6 KPIs from example input values', () => {
    const rows = buildTemplateRows('lean-six-sigma');

    // Fill "Your Value" column (index 2) with the spec's example values
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });

    const csvText = rowsToCsvText(rows);
    const { values, log } = runNewFormatImport(csvText, 'lean-six-sigma');

    // pce: value_added_time=42, total_lead_time=380 → (42/380)*100 = 11.1%
    expect(values['pce'], 'pce').toBeCloseTo(11.1, 0);

    // sigma: defects=230, units_produced=5000, opps_per_unit=10 → dpmo=4600 → ~4.1σ
    expect(values['sigma'], 'sigma').toBeGreaterThan(3.5);
    expect(values['sigma'], 'sigma').toBeLessThan(5);

    // ftr: first_time_right=1840, total_units_ftr=2000 → 92%
    expect(values['ftr'], 'ftr').toBe(92);

    // ltr: baseline_lt=72, current_lt=28 → (72-28)/72*100 = 61.1%
    expect(values['ltr'], 'ltr').toBeCloseTo(61.1, 0);

    // copq: internal=180000, external=120000, appraisal=60000, revenue=37500000 → 0.96%
    expect(values['copq'], 'copq').toBeCloseTo(1, 0);

    // kaizen: direct count=7
    expect(values['kaizen'], 'kaizen').toBe(7);

    // All 6 KPIs should be calculated
    expect(log.filter(l => l.startsWith('✓')).length).toBe(6);
  });
});

// ─── 4. Import round-trip — risk-management ─────────────────────────────────

describe('Import round-trip: risk-management', () => {
  it('calculates the 3 spec KPIs (rrc, bcpt, rtoa2) and skips the 3 fallback KPIs', () => {
    const rows = buildTemplateRows('risk-management');

    // Fill spec-based KPIs with example values
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });

    const csvText = rowsToCsvText(rows);
    const { values, log } = runNewFormatImport(csvText, 'risk-management');

    // rrc: documented=24, total=28 → (24/28)*100 = 85.7%
    expect(values['rrc'], 'rrc').toBeCloseTo(85.7, 0);

    // bcpt: passed=7, conducted=8 → 87.5%
    expect(values['bcpt'], 'bcpt').toBe(87.5);

    // rtoa2: rto_met=9, total=10 → 90%
    expect(values['rtoa2'], 'rtoa2').toBe(90);

    // crm, srs, rrc2 have no spec — should not appear in results
    expect(values['crm'], 'crm should be skipped').toBeUndefined();
    expect(values['srs'], 'srs should be skipped').toBeUndefined();
    expect(values['rrc2'], 'rrc2 should be skipped').toBeUndefined();

    // Exactly 3 successful calculations
    expect(log.filter(l => l.startsWith('✓')).length).toBe(3);
  });
});

// ─── 5. Legacy "Actual Value" import format ──────────────────────────────────

describe('Legacy Actual Value import format', () => {
  it('imports direct KPI values without auto-calculation', () => {
    const legacyCsv = [
      ['KPI ID', 'KPI Name', 'Actual Value'],
      ['pce', 'Process Cycle Efficiency', '18.5'],
      ['sigma', 'Sigma Level', '3.8'],
      ['ftr', 'First-Time-Right Rate', '89'],
      ['unknown_kpi', 'Unknown', '55'],
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\r\n');

    // The legacy format detection: does NOT contain 'Your Value' and 'Input Field' together
    expect(legacyCsv).not.toContain('Your Value');

    const { rows, errors } = parseCsvFile(legacyCsv, ['KPI ID', 'Actual Value']);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(4);

    // Simulate legacy import processing
    const kpis = KPI_FRAMEWORKS['lean-six-sigma']!;
    const nextValues: Record<string, string> = {};
    const log: string[] = [];

    rows.forEach((row, i) => {
      const kpiId = row['KPI ID']?.trim();
      const val = row['Actual Value']?.trim();
      const kpiDef = kpis.find(k => k.id === kpiId || k.label === row['KPI Name']?.trim());
      if (!kpiDef) {
        if (kpiId) log.push(`Row ${i + 2}: KPI ID "${kpiId}" not recognised — skipped.`);
        return;
      }
      if (val !== undefined && val !== '') {
        const num = parseFloat(val);
        if (isNaN(num)) { log.push(`Row ${i + 2}: "${val}" must be a number — skipped.`); return; }
        nextValues[kpiDef.id] = val;
      }
    });

    expect(nextValues['pce']).toBe('18.5');
    expect(nextValues['sigma']).toBe('3.8');
    expect(nextValues['ftr']).toBe('89');
    expect(nextValues['unknown_kpi']).toBeUndefined();
    expect(log.some(l => l.includes('unknown_kpi'))).toBe(true);
  });

  it('rejects a CSV with missing required column', () => {
    const badCsv = [
      ['KPI ID', 'Description'],
      ['pce', 'some value'],
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\r\n');

    const { rows, errors } = parseCsvFile(badCsv, ['KPI ID', 'Actual Value']);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Actual Value');
    expect(rows).toHaveLength(0);
  });
});

// ─── 6. Manual calculation spot-checks for kpiDataSpecs ─────────────────────

describe('kpiDataSpecs calculate() functions', () => {
  it('por: perfect_orders / total_orders', () => {
    const spec = KPI_DATA_SPECS['por']!;
    expect(spec.calculate({ total_orders: 1200, perfect_orders: 1098 })).toBe(91.5);
  });

  it('c2c: DIO + DSO - DPO', () => {
    const spec = KPI_DATA_SPECS['c2c']!;
    const result = spec.calculate({
      avg_inventory: 4_500_000, cogs: 22_000_000,
      avg_ar: 3_200_000, revenue: 37_500_000,
      avg_ap: 2_100_000, cost_of_purchases: 18_000_000,
    });
    // DIO=74.7, DSO=31.2, DPO=42.6 → ~63.4
    expect(result).toBeGreaterThan(55);
    expect(result).toBeLessThan(75);
  });

  it('sigma: dpmo → sigma level', () => {
    const spec = KPI_DATA_SPECS['sigma']!;
    // DPMO = (230/(5000*10))*1e6 = 4600 → ~4.1σ
    const result = spec.calculate({ defects: 230, units_produced: 5000, opps_per_unit: 10 });
    expect(result).toBeGreaterThan(3.5);
    expect(result).toBeLessThan(5);
  });

  it('kaizen: direct count (no division)', () => {
    const spec = KPI_DATA_SPECS['kaizen']!;
    expect(spec.calculate({ kaizen_events: 7 })).toBe(7);
    expect(spec.calculate({ kaizen_events: 0 })).toBe(0);
  });

  it('rrc: (documented / total) * 100', () => {
    const spec = KPI_DATA_SPECS['rrc']!;
    expect(spec.calculate({ total_risk_categories: 28, documented_risk_categories: 24 }))
      .toBeCloseTo(85.7, 0);
  });

  it('returns NaN on zero denominators', () => {
    expect(KPI_DATA_SPECS['por']!.calculate({ total_orders: 0, perfect_orders: 100 })).toBeNaN();
    expect(KPI_DATA_SPECS['fa']!.calculate({ sum_actuals: 0, sum_abs_errors: 100 })).toBeNaN();
    expect(KPI_DATA_SPECS['ltr']!.calculate({ baseline_lt: 0, current_lt: 28 })).toBeNaN();
  });
});
