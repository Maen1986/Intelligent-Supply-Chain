/**
 * Unit tests for buildKpiTemplateRows — the pure helper that generates the
 * KPI data-collection CSV template.
 *
 * Verified properties
 * ───────────────────
 * 1. Status formula uses >= for higherIsBetter: true KPIs
 * 2. Status formula uses <= for higherIsBetter: false KPIs
 * 3. Target column (index 4) of __result rows matches k.targetLabel
 * 4. GCC Benchmark column (index 5) of __result rows matches k.benchmarkLabel
 * 5. The column-header row contains exactly 7 columns
 */
import { describe, it, expect } from 'vitest';
import { buildKpiTemplateRows, KPI_FRAMEWORKS } from './KPIDashboard';
import { KPI_DATA_SPECS, KpiDataSpec } from '@/lib/kpiDataSpecs';
import { parseCsvFile } from '@/lib/importCsv';

// Pick representative KPIs with known higherIsBetter values
// supply-chain-strategy[0] = Perfect Order Rate  (higherIsBetter: true)
// supply-chain-strategy[2] = SC Cost % Revenue   (higherIsBetter: false)
const HIGHER_KPI = KPI_FRAMEWORKS['supply-chain-strategy'][0]; // por, >=
const LOWER_KPI  = KPI_FRAMEWORKS['supply-chain-strategy'][2]; // sccost, <=

const FRAMEWORK_LABEL = 'Supply Chain Strategy';
const TODAY = '1 January 2024';

function getResultRow(rows: string[][], kpiId: string): string[] | undefined {
  return rows.find(r => r[0] === `${kpiId}__result`);
}

describe('buildKpiTemplateRows – Status formula direction', () => {
  it('uses >= for a higherIsBetter: true KPI', () => {
    const rows = buildKpiTemplateRows([HIGHER_KPI], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, HIGHER_KPI.id);

    expect(resultRow, `No __result row found for KPI id "${HIGHER_KPI.id}"`).toBeDefined();
    // Status is column 6
    expect(resultRow![6]).toContain('>=');
    expect(resultRow![6]).not.toContain('<=');
  });

  it('uses <= for a higherIsBetter: false KPI', () => {
    const rows = buildKpiTemplateRows([LOWER_KPI], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, LOWER_KPI.id);

    expect(resultRow, `No __result row found for KPI id "${LOWER_KPI.id}"`).toBeDefined();
    // Status is column 6
    expect(resultRow![6]).toContain('<=');
    expect(resultRow![6]).not.toContain('>=');
  });
});

describe('buildKpiTemplateRows – Target and Benchmark columns', () => {
  it('Target column (index 4) of __result row matches k.targetLabel', () => {
    const rows = buildKpiTemplateRows([HIGHER_KPI], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, HIGHER_KPI.id);

    expect(resultRow![4]).toBe(HIGHER_KPI.targetLabel);
  });

  it('GCC Benchmark column (index 5) of __result row matches k.benchmarkLabel', () => {
    const rows = buildKpiTemplateRows([HIGHER_KPI], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, HIGHER_KPI.id);

    expect(resultRow![5]).toBe(HIGHER_KPI.benchmarkLabel);
  });

  it('Target and Benchmark columns are correct for a lower-is-better KPI too', () => {
    const rows = buildKpiTemplateRows([LOWER_KPI], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, LOWER_KPI.id);

    expect(resultRow![4]).toBe(LOWER_KPI.targetLabel);
    expect(resultRow![5]).toBe(LOWER_KPI.benchmarkLabel);
  });
});

describe('buildKpiTemplateRows – header row structure', () => {
  it('column-header row contains exactly 7 columns', () => {
    const rows = buildKpiTemplateRows([HIGHER_KPI], FRAMEWORK_LABEL, TODAY);
    const headerRow = rows.find(r => r[0] === 'KPI ID');

    expect(headerRow, 'No header row with "KPI ID" found').toBeDefined();
    expect(headerRow!).toHaveLength(7);
  });

  it('7th column of header is "Status"', () => {
    const rows = buildKpiTemplateRows([HIGHER_KPI], FRAMEWORK_LABEL, TODAY);
    const headerRow = rows.find(r => r[0] === 'KPI ID')!;

    expect(headerRow[6]).toBe('Status');
  });
});

// ─── Excel-mutated template round-trip ──────────────────────────────────────
//
//  Excel commonly alters CSVs on re-save:
//   • Strips the UTF-8 BOM
//   • Switches to CRLF line endings
//   • Adds extra blank rows between sections
//   • Adds leading/trailing whitespace inside quoted cells
//
//  These helpers re-implement the import-template row-builder and the
//  handleKpiImport calculation logic as pure functions so the round-trip can
//  be exercised without a DOM or React component.

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

  const manualKpis = kpis.filter(k => !KPI_DATA_SPECS[k.id]);
  if (manualKpis.length > 0) {
    const labels = manualKpis.map(k => k.label).join(', ');
    log.push(`📝 ${manualKpis.length} KPI(s) require manual entry: ${labels}`);
  }

  return { values, log };
}

describe('Excel-mutated template round-trip (lean-six-sigma)', () => {
  /** Return the lean-six-sigma template rows with example values already filled in. */
  function buildFilledRows(): string[][] {
    const rows = buildTemplateRows('lean-six-sigma');
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
    return rows;
  }

  /** Shared KPI value assertions for all mutation variants. */
  function assertKpiValues(values: Record<string, number>): void {
    expect(values['pce'], 'pce').toBeCloseTo(11.1, 0);
    expect(values['sigma'], 'sigma').toBeGreaterThan(3.5);
    expect(values['sigma'], 'sigma').toBeLessThan(5);
    expect(values['ftr'], 'ftr').toBe(92);
    expect(values['ltr'], 'ltr').toBeCloseTo(61.1, 0);
    expect(values['copq'], 'copq').toBeCloseTo(1, 0);
    expect(values['kaizen'], 'kaizen').toBe(7);
  }

  it('imports correctly with CRLF line endings (Windows / Excel default)', () => {
    const rows = buildFilledRows();
    const csvCrlf = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvCrlf, 'lean-six-sigma');
    assertKpiValues(values);
  });

  it('imports correctly when there is no UTF-8 BOM (Excel drops the BOM on re-save)', () => {
    const rows = buildFilledRows();
    const csvNoBom = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    expect(csvNoBom.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvNoBom, 'lean-six-sigma');
    assertKpiValues(values);
  });

  it('imports correctly when extra blank rows are scattered between sections', () => {
    const rows = buildFilledRows();
    const mutated: string[][] = [];
    for (const row of rows) {
      mutated.push(row);
      if (row[0]?.startsWith('===')) {
        mutated.push(['', '', '', '', '', '']);
        mutated.push(['', '', '', '', '', '']);
      }
    }
    const csvText = mutated.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'lean-six-sigma');
    assertKpiValues(values);
  });

  it('imports correctly when cell values have leading and trailing whitespace', () => {
    const rows = buildFilledRows();
    const padCell = (c: string): string => `"  ${c.replace(/"/g, '""')}  "`;
    const csvText = rows.map(r => r.map(padCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'lean-six-sigma');
    assertKpiValues(values);
  });

  it('imports correctly with all mutations combined (no BOM + CRLF + blank rows + whitespace padding)', () => {
    const rows = buildFilledRows();
    const withBlanks: string[][] = [];
    for (const row of rows) {
      withBlanks.push(row);
      if (row[0]?.startsWith('===')) withBlanks.push(['', '', '', '', '', '']);
    }
    const padCell = (c: string): string => `" ${c.replace(/"/g, '""')} "`;
    const csvText = withBlanks.map(r => r.map(padCell).join(',')).join('\r\n');
    expect(csvText.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvText, 'lean-six-sigma');
    assertKpiValues(values);
  });

  it('all 6 KPIs are calculated — no manual-entry notice — in the mutated file', () => {
    const rows = buildFilledRows();
    const mutated: string[][] = [];
    for (const row of rows) {
      mutated.push(row);
      if (row[0]?.startsWith('===')) mutated.push(['', '', '', '', '', '']);
    }
    const padCell = (c: string): string => `" ${c.replace(/"/g, '""')} "`;
    const csvText = mutated.map(r => r.map(padCell).join(',')).join('\r\n');
    const { log } = runNewFormatImport(csvText, 'lean-six-sigma');
    expect(log.filter(l => l.startsWith('✓')).length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});
