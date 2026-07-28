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
import { buildKpiTemplateRows, KPI_FRAMEWORKS, type KpiDef } from './KPIDashboard';
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
 *
 * Pass `isAr: true` to exercise the Arabic code-path (mirrors the component's
 * `isAr` branch so we can assert Arabic strings in the log).
 */
function runNewFormatImport(
  csvText: string,
  resolvedSlug: string,
  isAr = false,
): { values: Record<string, number>; log: string[] } {
  const kpis = KPI_FRAMEWORKS[resolvedSlug]!;
  const { rows: csvRows } = parseCsvFile(csvText, ['KPI ID', 'Input Field', 'Your Value', 'Unit']);
  const log: string[] = [];

  const inputsByKpi: Record<string, Record<string, number>> = {};
  // Track which input ids have already been matched for each KPI so that when
  // two inputs share the same first-30-char label prefix (e.g. mpr's two
  // "Number of manual process steps…" rows) the second row isn't silently
  // double-assigned to the first input.
  const usedInputIds: Record<string, Set<string>> = {};
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

    if (!usedInputIds[kpiId]) usedInputIds[kpiId] = new Set();

    // Match priority (highest to lowest):
    //  1. Exact label match (case-insensitive) — structurally collision-proof
    //  2. Input-ID substring match (label contains the spec input id)
    //  3. 30-char prefix match — kept as a last-resort fuzzy fallback
    //  4. Positional fallback — order in CSV matches order in spec
    // Steps 1-3 all respect the usedInputIds guard so the same input slot is
    // never claimed twice even when two labels share a common prefix.
    const inputDef =
      spec.inputs.find(inp =>
        !usedInputIds[kpiId].has(inp.id) &&
        inp.label.toLowerCase() === inputLabel.toLowerCase(),
      ) ??
      spec.inputs.find(inp =>
        !usedInputIds[kpiId].has(inp.id) &&
        inputLabel.toLowerCase().includes(inp.id.toLowerCase()),
      ) ??
      spec.inputs.find(inp =>
        !usedInputIds[kpiId].has(inp.id) &&
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
    usedInputIds[kpiId].add(inputDef.id);
    if (!inputsByKpi[kpiId]) inputsByKpi[kpiId] = {};
    inputsByKpi[kpiId][inputDef.id] = num;
  });

  let count = 0;
  const values: Record<string, number> = {};
  kpis.forEach(k => {
    const spec = KPI_DATA_SPECS[k.id];
    const inputs = inputsByKpi[k.id];
    if (!inputs || !spec) {
      if (spec) log.push(`${k.label}: no input values found — skipped.`);
      return;
    }

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
    count++;
  });

  const manualKpis = kpis.filter(k => !KPI_DATA_SPECS[k.id]);
  if (manualKpis.length > 0) {
    const labels = manualKpis.map(k => isAr ? k.labelAr : k.label).join(', ');
    log.push(isAr
      ? `📝 ${manualKpis.length} مؤشر(ات) تتطلّب إدخالاً يدوياً: ${labels}`
      : `📝 ${manualKpis.length} KPI(s) require manual entry: ${labels}`);
  }

  const manualSuffix = manualKpis.length > 0
    ? (isAr ? `، ${manualKpis.length} تتطلّب إدخالاً يدوياً` : `, ${manualKpis.length} require manual entry`)
    : '';
  log.unshift(isAr
    ? `✓ تم احتساب ${count} مؤشر(ات) تلقائياً${manualSuffix}.`
    : `✓ ${count} KPI(s) auto-calculated${manualSuffix}.`);

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
        row[1]?.trim().toLowerCase() === inp.label.toLowerCase(),
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
    // log[0] is the auto-calculated summary line; the remaining ✓ lines are per-KPI
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});

// ─── Risk-management partial import ─────────────────────────────────────────
//
//  The risk-management framework has 6 KPIs: rrc, bcpt, rtoa2, crm, srs, rrc2.
//  This suite verifies that when a user fills in only rrc and bcpt the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//
describe('risk-management import — partial inputs (only rrc and bcpt filled)', () => {
  /**
   * Build a risk-management template with only rrc and bcpt "Your Value"
   * cells populated.  All other KPI rows are left blank.
   */
  function buildPartialRiskRows(): string[][] {
    const rows = buildTemplateRows('risk-management');
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!['rrc', 'bcpt'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.trim().toLowerCase() === inp.label.toLowerCase(),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates rrc correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { values } = runNewFormatImport(csvText, 'risk-management');
    // rrc: pct(24, 28) = 85.7
    expect(values['rrc'], 'rrc').toBeCloseTo(85.7, 0);
  });

  it('calculates bcpt correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { values } = runNewFormatImport(csvText, 'risk-management');
    // bcpt: pct(7, 8) = 87.5
    expect(values['bcpt'], 'bcpt').toBeCloseTo(87.5, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { values } = runNewFormatImport(csvText, 'risk-management');

    expect(values['rtoa2'], 'rtoa2 should be absent').toBeUndefined();
    expect(values['crm'],   'crm should be absent').toBeUndefined();
    expect(values['srs'],   'srs should be absent').toBeUndefined();
    expect(values['rrc2'],  'rrc2 should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { values } = runNewFormatImport(csvText, 'risk-management');

    expect(Object.keys(values).sort()).toEqual(['bcpt', 'rrc']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { log } = runNewFormatImport(csvText, 'risk-management');

    const skipLines = log.filter(l => l.includes('skipped'));
    // rtoa2, crm, srs, rrc2 — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { log } = runNewFormatImport(csvText, 'risk-management');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialRiskRows());
    const { log } = runNewFormatImport(csvText, 'risk-management');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('RTO Attainment');      // rtoa2
    expect(skipText).toContain('Critical Risk');       // crm
    expect(skipText).toContain('Supplier Risk Score'); // srs
    expect(skipText).toContain('Risk Review');         // rrc2

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Risk Register Coverage');
    expect(skipText).not.toContain('BCP Test Pass Rate');
  });
});

// ─── Arabic import log — risk-management (lang="ar") ────────────────────────
//
// Verifies that runNewFormatImport with isAr=true uses the Arabic code-path
// that mirrors handleKpiImport's `isAr` branch in KPIDashboard.tsx:
//
//   • Summary line:  ✓ تم احتساب N مؤشر(ات) تلقائياً.
//   • Manual notice: 📝 N مؤشر(ات) تتطلّب إدخالاً يدوياً: <Arabic labels>
//
// All 6 risk-management KPIs currently have calculation specs, so the 📝
// notice will not fire for this framework.  The labelAr assertions below
// confirm that the Arabic strings are correctly defined so they would render
// properly if the notice did fire.

describe('Arabic import log — risk-management (lang="ar")', () => {
  /**
   * Build a minimal risk-management new-format CSV that supplies inputs only
   * for rrc and bcpt (the two simplest KPIs), leaving the remaining four
   * without data so we can test partial-import behaviour in Arabic mode.
   */
  function buildPartialRmCsv(): string {
    const rows: string[][] = [
      ['I Supply Chain — KPI Data Collection Template', '', '', ''],
      ['Framework: Risk Management', '', '', ''],
      ["Generated: 1 January 2024 | Ma'in Alhaqash MCIPS CPSM | isupplychain.com", '', '', ''],
      ['', '', '', ''],
      ['KPI ID', 'Input Field', 'Your Value', 'Unit'],
      // rrc: Risk Register Coverage %
      ['rrc', 'Total supply chain risk categories identified', '28', 'categories'],
      ['rrc', 'Risk categories with formal documentation', '24', 'categories'],
      // bcpt: BCP Test Pass Rate %
      ['bcpt', 'Total BCP exercises / tests conducted in the period', '8', 'tests'],
      ['bcpt', 'BCP tests where all objectives were met and RTO achieved', '7', 'tests'],
    ];
    return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  /**
   * Build a full risk-management CSV with example values for all 6 KPIs.
   */
  function buildFullRmCsv(): string {
    const rows: string[][] = [
      ['I Supply Chain — KPI Data Collection Template', '', '', ''],
      ['Framework: Risk Management', '', '', ''],
      ["Generated: 1 January 2024 | Ma'in Alhaqash MCIPS CPSM | isupplychain.com", '', '', ''],
      ['', '', '', ''],
      ['KPI ID', 'Input Field', 'Your Value', 'Unit'],
      // rrc
      ['rrc', 'Total supply chain risk categories identified', '28', 'categories'],
      ['rrc', 'Risk categories with formal documentation', '24', 'categories'],
      // bcpt
      ['bcpt', 'Total BCP exercises / tests conducted in the period', '8', 'tests'],
      ['bcpt', 'BCP tests where all objectives were met and RTO achieved', '7', 'tests'],
      // rtoa2
      ['rtoa2', 'Total supply disruption events in the period', '10', 'events'],
      ['rtoa2', 'Events where operations recovered within the defined RTO', '9', 'events'],
      // crm
      ['crm', 'Total supply chain risks classified as High or Critical', '20', 'risks'],
      ['crm', 'Critical risks with a fully implemented and evidenced mitigation control', '17', 'risks'],
      // srs
      ['srs', 'Sum of individual supplier health scores across all assessed suppliers', '3750', 'score-points'],
      ['srs', 'Number of suppliers assessed / scored in the period', '50', 'suppliers'],
      // rrc2
      ['rrc2', 'Total risk reviews scheduled in the period', '24', 'reviews'],
      ['rrc2', 'Risk reviews completed on or before the scheduled due date', '22', 'reviews'],
    ];
    return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  it('summary line uses the Arabic تم احتساب … تلقائياً template', () => {
    const { log } = runNewFormatImport(buildPartialRmCsv(), 'risk-management', true);
    const summary = log[0];
    expect(summary).toMatch(/^✓/);
    expect(summary).toContain('تم احتساب');
    expect(summary).toContain('مؤشر(ات) تلقائياً');
  });

  it('exactly 2 KPIs are calculated from the partial CSV (rrc and bcpt)', () => {
    const { log } = runNewFormatImport(buildPartialRmCsv(), 'risk-management', true);
    expect(log[0]).toContain('2');
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('تم احتساب'));
    expect(kpiLines.length).toBe(2);
  });

  it('rrc and bcpt values are calculated correctly from Arabic-mode import', () => {
    const { values } = runNewFormatImport(buildPartialRmCsv(), 'risk-management', true);
    // rrc: 24/28 × 100 ≈ 85.7
    expect(values['rrc']).toBeCloseTo(85.7, 0);
    // bcpt: 7/8 × 100 = 87.5
    expect(values['bcpt']).toBeCloseTo(87.5, 0);
  });

  it('all 6 KPIs calculated from a full risk-management CSV in Arabic mode', () => {
    const { log } = runNewFormatImport(buildFullRmCsv(), 'risk-management', true);
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('تم احتساب'));
    expect(kpiLines.length).toBe(6);
    expect(log[0]).toContain('6');
  });

  it('no 📝 manual-entry notice — all risk-management KPIs have calculation specs', () => {
    const { log } = runNewFormatImport(buildFullRmCsv(), 'risk-management', true);
    expect(log.find(l => l.startsWith('📝'))).toBeUndefined();
  });

  it('Arabic labelAr strings for crm, srs, rrc2 are non-empty and form a valid 📝 notice', () => {
    // Verify the Arabic KPI label fields are correctly defined so they would
    // render properly inside the 📝 manual-entry notice if those KPIs ever
    // lost their calculation spec.
    const rmKpis = KPI_FRAMEWORKS['risk-management'];
    const crm  = rmKpis.find(k => k.id === 'crm')!;
    const srs  = rmKpis.find(k => k.id === 'srs')!;
    const rrc2 = rmKpis.find(k => k.id === 'rrc2')!;

    expect(crm,  'crm KPI definition missing').toBeDefined();
    expect(srs,  'srs KPI definition missing').toBeDefined();
    expect(rrc2, 'rrc2 KPI definition missing').toBeDefined();

    // Each labelAr must be a non-empty Arabic string
    expect(crm.labelAr.trim().length,  'crm.labelAr is empty').toBeGreaterThan(0);
    expect(srs.labelAr.trim().length,  'srs.labelAr is empty').toBeGreaterThan(0);
    expect(rrc2.labelAr.trim().length, 'rrc2.labelAr is empty').toBeGreaterThan(0);

    // Construct what the Arabic 📝 notice would look like for these three KPIs
    const manualKpis = [crm, srs, rrc2];
    const labels = manualKpis.map(k => k.labelAr).join(', ');
    const notice = `📝 ${manualKpis.length} مؤشر(ات) تتطلّب إدخالاً يدوياً: ${labels}`;

    expect(notice).toMatch(/^📝/);
    expect(notice).toContain('مؤشر(ات) تتطلّب إدخالاً يدوياً');
    expect(notice).toContain(crm.labelAr);
    expect(notice).toContain(srs.labelAr);
    expect(notice).toContain(rrc2.labelAr);
  });

  it('Arabic summary includes manual-suffix when there would be manual KPIs', () => {
    // Simulate how the summary line would look if 3 KPIs were manual
    // (mirrors the manualSuffix branch in handleKpiImport)
    const manualCount = 3;
    const manualSuffix = `، ${manualCount} تتطلّب إدخالاً يدوياً`;
    const calculatedCount = 3;
    const summary = `✓ تم احتساب ${calculatedCount} مؤشر(ات) تلقائياً${manualSuffix}.`;

    expect(summary).toContain('تم احتساب');
    expect(summary).toContain('تتطلّب إدخالاً يدوياً');
    expect(summary).toMatch(/^✓/);
    expect(summary).toContain('3');
  });
});

// ─── Excel-mutated template round-trip (risk-management) ─────────────────────
//
//  Mirrors the lean-six-sigma round-trip suite but for the risk-management
//  framework, which has a different set of KPIs:
//    rrc, bcpt, rtoa2, crm, srs, rrc2
//
//  Expected values from example inputs (see kpiDataSpecs.ts):
//    rrc   : pct(24, 28) ≈ 85.7  (Risk Register Coverage %)
//    bcpt  : pct(7, 8)   = 87.5  (BCP Test Pass Rate %)
//    rtoa2 : pct(9, 10)  = 90.0  (RTO Attainment %)
//    crm   : pct(17, 20) = 85.0  (Critical Risk Mitigation Rate %)
//    srs   : avg(3750, 50) = 75.0 (Avg Supplier Risk Score)
//    rrc2  : pct(22, 24) ≈ 91.7  (Risk Review Compliance %)

describe('Excel-mutated template round-trip (risk-management)', () => {
  /** Return risk-management template rows with all example values filled in. */
  function buildFilledRows(): string[][] {
    const rows = buildTemplateRows('risk-management');
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.trim().toLowerCase() === inp.label.toLowerCase(),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  /** Shared KPI value assertions for all mutation variants. */
  function assertKpiValues(values: Record<string, number>): void {
    expect(values['rrc'],   'rrc').toBeCloseTo(85.7, 0);
    expect(values['bcpt'],  'bcpt').toBeCloseTo(87.5, 0);
    expect(values['rtoa2'], 'rtoa2').toBeCloseTo(90.0, 0);
    expect(values['crm'],   'crm').toBeCloseTo(85.0, 0);
    expect(values['srs'],   'srs').toBeCloseTo(75.0, 0);
    expect(values['rrc2'],  'rrc2').toBeCloseTo(91.7, 0);
  }

  it('imports correctly with CRLF line endings (Windows / Excel default)', () => {
    const rows = buildFilledRows();
    const csvCrlf = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvCrlf, 'risk-management');
    assertKpiValues(values);
  });

  it('imports correctly when there is no UTF-8 BOM (Excel drops the BOM on re-save)', () => {
    const rows = buildFilledRows();
    const csvNoBom = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    expect(csvNoBom.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvNoBom, 'risk-management');
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
    const { values } = runNewFormatImport(csvText, 'risk-management');
    assertKpiValues(values);
  });

  it('imports correctly when cell values have leading and trailing whitespace', () => {
    const rows = buildFilledRows();
    const padCell = (c: string): string => `"  ${c.replace(/"/g, '""')}  "`;
    const csvText = rows.map(r => r.map(padCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'risk-management');
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
    const { values } = runNewFormatImport(csvText, 'risk-management');
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
    const { log } = runNewFormatImport(csvText, 'risk-management');
    // log[0] is the auto-calculated summary line; remaining ✓ lines are per-KPI
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});

// ─── Excel-mutated template round-trip (procurement-excellence) ──────────────
//
//  Mirrors the lean-six-sigma and risk-management round-trip suites but for
//  the procurement-excellence framework, which has its own distinct KPI set:
//    savings, pocycle, pocomp, sotif, ccov, ttc
//
//  Expected values from example inputs (see kpiDataSpecs.ts):
//    savings : pct(1_800_000, 22_000_000) ≈ 8.2  (Procurement Savings %)
//    pocycle : avg(3_850, 440)            = 8.8  (PO Cycle Time, days)
//    pocomp  : pct(405, 440)             = 92.0  (PO Compliance Rate %)
//    sotif   : pct(1_128, 1_200)         = 94.0  (Supplier OTIF %)
//    ccov    : pct(17_600_000, 22_000_000) = 80.0 (Contract Coverage %)
//    ttc     : avg(1_680, 60)            = 28.0  (Time-to-Contract, days)

describe('Excel-mutated template round-trip (procurement-excellence)', () => {
  /** Return procurement-excellence template rows with all example values filled in. */
  function buildFilledRows(): string[][] {
    const rows = buildTemplateRows('procurement-excellence');
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  /** Shared KPI value assertions for all mutation variants. */
  function assertKpiValues(values: Record<string, number>): void {
    expect(values['savings'], 'savings').toBeCloseTo(8.2, 0);
    expect(values['pocycle'], 'pocycle').toBeCloseTo(8.8, 0);
    expect(values['pocomp'],  'pocomp').toBeCloseTo(92.0, 0);
    expect(values['sotif'],   'sotif').toBeCloseTo(94.0, 0);
    expect(values['ccov'],    'ccov').toBeCloseTo(80.0, 0);
    expect(values['ttc'],     'ttc').toBeCloseTo(28.0, 0);
  }

  it('imports correctly with CRLF line endings (Windows / Excel default)', () => {
    const rows = buildFilledRows();
    const csvCrlf = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvCrlf, 'procurement-excellence');
    assertKpiValues(values);
  });

  it('imports correctly when there is no UTF-8 BOM (Excel drops the BOM on re-save)', () => {
    const rows = buildFilledRows();
    const csvNoBom = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    expect(csvNoBom.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvNoBom, 'procurement-excellence');
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
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');
    assertKpiValues(values);
  });

  it('imports correctly when cell values have leading and trailing whitespace', () => {
    const rows = buildFilledRows();
    const padCell = (c: string): string => `"  ${c.replace(/"/g, '""')}  "`;
    const csvText = rows.map(r => r.map(padCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');
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
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');
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
    const { log } = runNewFormatImport(csvText, 'procurement-excellence');
    // log[0] is the auto-calculated summary line; remaining ✓ lines are per-KPI
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});

// ─── Procurement-excellence partial import ───────────────────────────────────
//
//  The procurement-excellence framework has 6 KPIs:
//    savings, pocycle, pocomp, sotif, ccov, ttc
//  This suite verifies that when a user fills in only savings and pocycle the
//  import:
//   • calculates the two filled KPIs correctly
//   • skips the four unfilled KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//   • emits exactly 2 per-KPI success lines (summary line excluded)
//
describe('procurement-excellence import — partial inputs (only savings and pocycle filled)', () => {
  /**
   * Build a procurement-excellence template with only savings and pocycle
   * "Your Value" cells populated.  All other KPI rows are left blank.
   *
   * Uses positional-index matching (consistent with the round-trip suite)
   * so input rows are assigned in declaration order.
   */
  function buildPartialPeRows(): string[][] {
    const rows = buildTemplateRows('procurement-excellence');
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      // Only fill savings and pocycle
      if (!['savings', 'pocycle'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates savings correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');
    // savings: pct(1_800_000, 22_000_000) ≈ 8.2
    expect(values['savings'], 'savings').toBeCloseTo(8.2, 0);
  });

  it('calculates pocycle correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');
    // pocycle: avg(3_850, 440) = 8.75 → rounds to 8.8
    expect(values['pocycle'], 'pocycle').toBeCloseTo(8.8, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');

    expect(values['pocomp'], 'pocomp should be absent').toBeUndefined();
    expect(values['sotif'],  'sotif should be absent').toBeUndefined();
    expect(values['ccov'],   'ccov should be absent').toBeUndefined();
    expect(values['ttc'],    'ttc should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { values } = runNewFormatImport(csvText, 'procurement-excellence');

    expect(Object.keys(values).sort()).toEqual(['pocycle', 'savings']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { log } = runNewFormatImport(csvText, 'procurement-excellence');

    const skipLines = log.filter(l => l.includes('skipped'));
    // pocomp, sotif, ccov, ttc — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { log } = runNewFormatImport(csvText, 'procurement-excellence');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialPeRows());
    const { log } = runNewFormatImport(csvText, 'procurement-excellence');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('PO Compliance Rate');      // pocomp
    expect(skipText).toContain('Supplier OTIF');           // sotif
    expect(skipText).toContain('Contract Coverage');       // ccov
    expect(skipText).toContain('Time-to-Contract');        // ttc

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Procurement Savings');
    expect(skipText).not.toContain('PO Cycle Time');
  });
});

// ─── Excel-mutated template round-trip (digital-transformation) ──────────────
//
//  Mirrors the lean-six-sigma and risk-management round-trip suites but for the
//  digital-transformation framework, which has 6 KPIs:
//    erpu, auto, stp, da, dar, mpr
//
//  Expected values from example inputs (see kpiDataSpecs.ts):
//    erpu : pct(14, 18)     ≈ 77.8  (ERP Module Utilisation %)
//    auto : pct(22, 35)     ≈ 62.9  (Process Automation Rate %)
//    stp  : pct(308, 440)   = 70.0  (Straight-Through PO Rate %)
//    da   : pct(468, 500)   = 93.6  (Data Accuracy Rate %)
//    dar  : pct(72, 85)     ≈ 84.7  (Digital Adoption Rate %)
//    mpr  : ((145−52)/145)×100 ≈ 64.1  (Manual Process Reduction %)

describe('Excel-mutated template round-trip (digital-transformation)', () => {
  /** Return digital-transformation template rows with all example values filled in. */
  function buildFilledRows(): string[][] {
    const rows = buildTemplateRows('digital-transformation');
    // Use positional matching: track how many input rows we have seen for each
    // KPI and assign example values in order.  This avoids failures when two
    // inputs of the same KPI share the same first 30 characters (e.g. mpr's
    // "Number of manual process steps BEFORE…" vs "…currently…").
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  /** Shared KPI value assertions for all mutation variants. */
  function assertKpiValues(values: Record<string, number>): void {
    expect(values['erpu'], 'erpu').toBeCloseTo(77.8, 0);
    expect(values['auto'], 'auto').toBeCloseTo(62.9, 0);
    expect(values['stp'],  'stp').toBeCloseTo(70.0, 0);
    expect(values['da'],   'da').toBeCloseTo(93.6, 0);
    expect(values['dar'],  'dar').toBeCloseTo(84.7, 0);
    expect(values['mpr'],  'mpr').toBeCloseTo(64.1, 0);
  }

  it('imports correctly with CRLF line endings (Windows / Excel default)', () => {
    const rows = buildFilledRows();
    const csvCrlf = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvCrlf, 'digital-transformation');
    assertKpiValues(values);
  });

  it('imports correctly when there is no UTF-8 BOM (Excel drops the BOM on re-save)', () => {
    const rows = buildFilledRows();
    const csvNoBom = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    expect(csvNoBom.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvNoBom, 'digital-transformation');
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
    const { values } = runNewFormatImport(csvText, 'digital-transformation');
    assertKpiValues(values);
  });

  it('imports correctly when cell values have leading and trailing whitespace', () => {
    const rows = buildFilledRows();
    const padCell = (c: string): string => `"  ${c.replace(/"/g, '""')}  "`;
    const csvText = rows.map(r => r.map(padCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'digital-transformation');
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
    const { values } = runNewFormatImport(csvText, 'digital-transformation');
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
    const { log } = runNewFormatImport(csvText, 'digital-transformation');
    // log[0] is the auto-calculated summary line; remaining ✓ lines are per-KPI
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});

// ─── Digital-transformation partial import ───────────────────────────────────
//
//  The digital-transformation framework has 6 KPIs: erpu, auto, stp, da, dar, mpr.
//  This suite verifies that when a user fills in only erpu and auto the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//
describe('digital-transformation import — partial inputs (only erpu and auto filled)', () => {
  /**
   * Build a digital-transformation template with only erpu and auto "Your Value"
   * cells populated.  All other KPI rows are left blank.
   *
   * Uses the same positional-index matching as the round-trip suite because
   * mpr's two inputs share the same first-30-char prefix.
   */
  function buildPartialDtRows(): string[][] {
    const rows = buildTemplateRows('digital-transformation');
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      // Only fill erpu and auto
      if (!['erpu', 'auto'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates erpu correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { values } = runNewFormatImport(csvText, 'digital-transformation');
    // erpu: pct(14, 18) ≈ 77.8
    expect(values['erpu'], 'erpu').toBeCloseTo(77.8, 0);
  });

  it('calculates auto correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { values } = runNewFormatImport(csvText, 'digital-transformation');
    // auto: pct(22, 35) ≈ 62.9
    expect(values['auto'], 'auto').toBeCloseTo(62.9, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { values } = runNewFormatImport(csvText, 'digital-transformation');

    expect(values['stp'], 'stp should be absent').toBeUndefined();
    expect(values['da'],  'da should be absent').toBeUndefined();
    expect(values['dar'], 'dar should be absent').toBeUndefined();
    expect(values['mpr'], 'mpr should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { values } = runNewFormatImport(csvText, 'digital-transformation');

    expect(Object.keys(values).sort()).toEqual(['auto', 'erpu']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { log } = runNewFormatImport(csvText, 'digital-transformation');

    const skipLines = log.filter(l => l.includes('skipped'));
    // stp, da, dar, mpr — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { log } = runNewFormatImport(csvText, 'digital-transformation');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialDtRows());
    const { log } = runNewFormatImport(csvText, 'digital-transformation');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('Straight-Through PO Rate'); // stp
    expect(skipText).toContain('Data Accuracy Rate');       // da
    expect(skipText).toContain('Digital Adoption Rate');    // dar
    expect(skipText).toContain('Manual Process Reduction'); // mpr

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('ERP Module Utilisation');
    expect(skipText).not.toContain('Process Automation Rate');
  });
});

// ─── Sustainability-ESG partial import ───────────────────────────────────────
//
//  The sustainability-esg framework has 6 KPIs: esga, s3, lc, ss, cr, esgs.
//  This suite verifies that when a user fills in only esga and s3 the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//
describe('sustainability-esg import — partial inputs (only esga and s3 filled)', () => {
  /**
   * Build a sustainability-esg template with only esga and s3 "Your Value"
   * cells populated.  All other KPI rows are left blank.
   */
  function buildPartialEsgRows(): string[][] {
    const rows = buildTemplateRows('sustainability-esg');
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!['esga', 's3'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates esga correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { values } = runNewFormatImport(csvText, 'sustainability-esg');
    // esga: pct(102, 120) = 85.0
    expect(values['esga'], 'esga').toBeCloseTo(85.0, 0);
  });

  it('calculates s3 correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { values } = runNewFormatImport(csvText, 'sustainability-esg');
    // s3: pct(9, 12) = 75.0
    expect(values['s3'], 's3').toBeCloseTo(75.0, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { values } = runNewFormatImport(csvText, 'sustainability-esg');

    expect(values['lc'],   'lc should be absent').toBeUndefined();
    expect(values['ss'],   'ss should be absent').toBeUndefined();
    expect(values['cr'],   'cr should be absent').toBeUndefined();
    expect(values['esgs'], 'esgs should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { values } = runNewFormatImport(csvText, 'sustainability-esg');

    expect(Object.keys(values).sort()).toEqual(['esga', 's3']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { log } = runNewFormatImport(csvText, 'sustainability-esg');

    const skipLines = log.filter(l => l.includes('skipped'));
    // lc, ss, cr, esgs — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { log } = runNewFormatImport(csvText, 'sustainability-esg');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialEsgRows());
    const { log } = runNewFormatImport(csvText, 'sustainability-esg');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('Local Content');          // lc
    expect(skipText).toContain('Sustainable Spend');      // ss
    expect(skipText).toContain('Carbon Reduction');       // cr
    expect(skipText).toContain('ESG-Compliant Suppliers'); // esgs

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Supplier ESG Audit Coverage');
    expect(skipText).not.toContain('Scope 3 Coverage');
  });
});

// ─── Governance-compliance partial import ────────────────────────────────────
//
//  The governance-compliance framework has 6 KPIs: pcr, aud, cco, mav, doa, asa.
//  This suite verifies that when a user fills in only pcr and asa the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//   • reports exactly 2 KPIs in the values object
//
describe('governance-compliance import — partial inputs (only pcr and asa filled)', () => {
  /**
   * Build a governance-compliance template with only pcr and asa "Your Value"
   * cells populated.  All other KPI rows are left blank.
   */
  function buildPartialGcRows(): string[][] {
    const rows = buildTemplateRows('governance-compliance');
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!['pcr', 'asa'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates pcr correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { values } = runNewFormatImport(csvText, 'governance-compliance');
    // pcr: pct(267, 300) = 89.0
    expect(values['pcr'], 'pcr').toBeCloseTo(89.0, 0);
  });

  it('calculates asa correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { values } = runNewFormatImport(csvText, 'governance-compliance');
    // asa: pct(20_900_000, 22_000_000) = 95.0
    expect(values['asa'], 'asa').toBeCloseTo(95.0, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { values } = runNewFormatImport(csvText, 'governance-compliance');

    expect(values['aud'], 'aud should be absent').toBeUndefined();
    expect(values['cco'], 'cco should be absent').toBeUndefined();
    expect(values['mav'], 'mav should be absent').toBeUndefined();
    expect(values['doa'], 'doa should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { values } = runNewFormatImport(csvText, 'governance-compliance');

    expect(Object.keys(values).sort()).toEqual(['asa', 'pcr']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { log } = runNewFormatImport(csvText, 'governance-compliance');

    const skipLines = log.filter(l => l.includes('skipped'));
    // aud, cco, mav, doa — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { log } = runNewFormatImport(csvText, 'governance-compliance');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialGcRows());
    const { log } = runNewFormatImport(csvText, 'governance-compliance');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('Audit Score');           // aud
    expect(skipText).toContain('Contract Coverage');     // cco
    expect(skipText).toContain('Maverick Spend');        // mav
    expect(skipText).toContain('DoA Violations');        // doa

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Policy Compliance Rate');
    expect(skipText).not.toContain('Approved Supplier Adherence');
  });
});

// ─── Supply-chain-strategy partial import ────────────────────────────────────
//
//  The supply-chain-strategy framework has 6 KPIs: por, otif, sccost, c2c, fa, turns.
//  This suite verifies that when a user fills in only por and otif the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//
describe('supply-chain-strategy import — partial inputs (only por and otif filled)', () => {
  /**
   * Build a supply-chain-strategy template with only por and otif "Your Value"
   * cells populated.  All other KPI rows are left blank.
   */
  function buildPartialScsRows(): string[][] {
    const rows = buildTemplateRows('supply-chain-strategy');
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!['por', 'otif'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      const inputDef = spec.inputs.find(inp =>
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
      );
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates por correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
    // por: pct(1098, 1200) = 91.5
    expect(values['por'], 'por').toBeCloseTo(91.5, 0);
  });

  it('calculates otif correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
    // otif: pct(782, 850) = 92.0
    expect(values['otif'], 'otif').toBeCloseTo(92.0, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');

    expect(values['sccost'], 'sccost should be absent').toBeUndefined();
    expect(values['c2c'],    'c2c should be absent').toBeUndefined();
    expect(values['fa'],     'fa should be absent').toBeUndefined();
    expect(values['turns'],  'turns should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');

    expect(Object.keys(values).sort()).toEqual(['otif', 'por']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    const skipLines = log.filter(l => l.includes('skipped'));
    // sccost, c2c, fa, turns — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('SC Cost');          // sccost
    expect(skipText).toContain('Cash-to-Cash');     // c2c
    expect(skipText).toContain('Forecast Accuracy');// fa
    expect(skipText).toContain('Inventory Turns');  // turns

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Perfect Order Rate');
    expect(skipText).not.toContain('OTIF');
  });
});

// ─── Multi-KPI sequence: Status formula cell reference ───────────────────────
//
//  buildKpiTemplateRows tracks the current Excel row number by counting array
//  pushes.  With multiple KPIs the preamble, section headers, input rows, and
//  notes rows all shift the index, so this suite verifies that the row number
//  embedded in every Status formula matches the actual 1-indexed position of
//  that __result row in the returned array — for both spec-backed KPIs and
//  fallback (direct-entry) KPIs.
//
//  KPIs used:
//    KPI_A  — por  (supply-chain-strategy[0])  spec-backed, higherIsBetter: true
//    KPI_B  — sccost (supply-chain-strategy[2]) spec-backed, higherIsBetter: false
//    KPI_FALLBACK — synthetic id not in KPI_DATA_SPECS, fallback path, higherIsBetter: true

const KPI_FALLBACK: KpiDef = {
  id: '__test_fallback_kpi__',
  label: 'Test Fallback KPI',
  labelAr: 'مؤشر اختبار',
  unit: '%',
  unitAr: '%',
  targetValue: 50,
  targetLabel: '>50%',
  benchmarkValue: 30,
  benchmarkLabel: '30%',
  higherIsBetter: true,
  description: 'Synthetic KPI without a spec — exercises the fallback (direct-entry) path.',
  descriptionAr: 'مؤشر اصطناعي بدون مواصفة — يختبر مسار الإدخال المباشر.',
};

/** Extract the first C<n> row reference from a Status formula string. */
function extractFormulaRowNum(formula: string): number {
  const m = formula.match(/C(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}

describe('buildKpiTemplateRows – Status formula cell reference in multi-KPI sequence', () => {
  const THREE_KPIS = [
    KPI_FRAMEWORKS['supply-chain-strategy'][0], // por  — spec-backed, higherIsBetter: true
    KPI_FRAMEWORKS['supply-chain-strategy'][2], // sccost — spec-backed, higherIsBetter: false
    KPI_FALLBACK,                                // synthetic — fallback, higherIsBetter: true
  ];

  it('every __result row formula references its own 1-indexed array position (3-KPI sequence)', () => {
    const rows = buildKpiTemplateRows(THREE_KPIS, FRAMEWORK_LABEL, TODAY);

    for (const kpi of THREE_KPIS) {
      const idx = rows.findIndex(r => r[0] === `${kpi.id}__result`);
      expect(idx, `__result row not found for "${kpi.id}"`).toBeGreaterThan(-1);

      const oneIndexed = idx + 1;
      const formula = rows[idx][6];
      const formulaRow = extractFormulaRowNum(formula);

      expect(formulaRow, `Formula C-ref for "${kpi.id}" should be ${oneIndexed}, got ${formulaRow} in: ${formula}`)
        .toBe(oneIndexed);
    }
  });

  it('spec-backed higherIsBetter: true KPI has correct formula direction and row ref', () => {
    const rows = buildKpiTemplateRows(THREE_KPIS, FRAMEWORK_LABEL, TODAY);
    const kpi = KPI_FRAMEWORKS['supply-chain-strategy'][0]; // por
    const idx = rows.findIndex(r => r[0] === `${kpi.id}__result`);
    const formula = rows[idx][6];

    expect(formula).toContain('>=');
    expect(formula).not.toContain('<=');
    expect(extractFormulaRowNum(formula)).toBe(idx + 1);
  });

  it('spec-backed higherIsBetter: false KPI has correct formula direction and row ref', () => {
    const rows = buildKpiTemplateRows(THREE_KPIS, FRAMEWORK_LABEL, TODAY);
    const kpi = KPI_FRAMEWORKS['supply-chain-strategy'][2]; // sccost
    const idx = rows.findIndex(r => r[0] === `${kpi.id}__result`);
    const formula = rows[idx][6];

    expect(formula).toContain('<=');
    expect(formula).not.toContain('>=');
    expect(extractFormulaRowNum(formula)).toBe(idx + 1);
  });

  it('fallback (direct-entry) KPI has correct formula direction and row ref', () => {
    const rows = buildKpiTemplateRows(THREE_KPIS, FRAMEWORK_LABEL, TODAY);
    const idx = rows.findIndex(r => r[0] === `${KPI_FALLBACK.id}__result`);
    const formula = rows[idx][6];

    // KPI_FALLBACK.higherIsBetter = true → >=
    expect(formula).toContain('>=');
    expect(formula).not.toContain('<=');
    expect(extractFormulaRowNum(formula)).toBe(idx + 1);
  });

  it('formula row refs are strictly increasing across the sequence (each KPI shifts the index)', () => {
    const rows = buildKpiTemplateRows(THREE_KPIS, FRAMEWORK_LABEL, TODAY);

    const refs = THREE_KPIS.map(kpi => {
      const idx = rows.findIndex(r => r[0] === `${kpi.id}__result`);
      return extractFormulaRowNum(rows[idx][6]);
    });

    // Each subsequent KPI occupies a higher row number
    expect(refs[1]).toBeGreaterThan(refs[0]);
    expect(refs[2]).toBeGreaterThan(refs[1]);
  });

  it('two-KPI sequence: both formula refs are correct (minimal repro)', () => {
    const TWO_KPIS = [
      KPI_FRAMEWORKS['supply-chain-strategy'][0], // por — spec-backed, higherIsBetter: true
      KPI_FALLBACK,                                // fallback, higherIsBetter: true
    ];
    const rows = buildKpiTemplateRows(TWO_KPIS, FRAMEWORK_LABEL, TODAY);

    for (const kpi of TWO_KPIS) {
      const idx = rows.findIndex(r => r[0] === `${kpi.id}__result`);
      expect(idx, `__result row not found for "${kpi.id}"`).toBeGreaterThan(-1);
      expect(extractFormulaRowNum(rows[idx][6])).toBe(idx + 1);
    }
  });
});

// ─── Excel-mutated template round-trip (supply-chain-strategy) ───────────────
//
//  Mirrors the lean-six-sigma, risk-management, procurement-excellence, and
//  digital-transformation round-trip suites for the supply-chain-strategy
//  framework, which has 6 KPIs:
//    por, otif, sccost, c2c, fa, turns
//
//  Expected values from example inputs (see kpiDataSpecs.ts):
//    por    : pct(1_098, 1_200)              ≈ 91.5  (Perfect Order Rate %)
//    otif   : pct(782, 850)                 = 92.0  (On-Time In-Full %)
//    sccost : pct(3_000_000, 37_500_000)    =  8.0  (SC Cost % Revenue)
//    c2c    : DIO + DSO − DPO              ≈ 63.2  (Cash-to-Cash days)
//             DIO = (4_500_000 / 22_000_000) × 365 ≈ 74.7
//             DSO = (3_200_000 / 37_500_000) × 365 ≈ 31.1
//             DPO = (2_100_000 / 18_000_000) × 365 ≈ 42.6
//    fa     : (1 − 8_160/48_000) × 100     = 83.0  (Forecast Accuracy %)
//    turns  : 22_000_000 / 2_200_000        = 10.0  (Inventory Turns/yr)

describe('Excel-mutated template round-trip (supply-chain-strategy)', () => {
  /**
   * Return supply-chain-strategy template rows with all example values filled in.
   *
   * Uses positional-index matching (consistent with other multi-input suites)
   * so each input row is assigned its example value in declaration order,
   * avoiding any reliance on first-30-char label prefix uniqueness.
   */
  function buildFilledRows(): string[][] {
    const rows = buildTemplateRows('supply-chain-strategy');
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!kpiId || kpiId === '' || kpiId.startsWith('===') || kpiId.startsWith('---') || kpiId.endsWith('__result')) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  /** Shared KPI value assertions for all mutation variants. */
  function assertKpiValues(values: Record<string, number>): void {
    expect(values['por'],    'por').toBeCloseTo(91.5, 0);
    expect(values['otif'],   'otif').toBeCloseTo(92.0, 0);
    expect(values['sccost'], 'sccost').toBeCloseTo(8.0, 0);
    expect(values['c2c'],    'c2c').toBeCloseTo(63.2, 0);
    expect(values['fa'],     'fa').toBeCloseTo(83.0, 0);
    expect(values['turns'],  'turns').toBeCloseTo(10.0, 0);
  }

  it('imports correctly with CRLF line endings (Windows / Excel default)', () => {
    const rows = buildFilledRows();
    const csvCrlf = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvCrlf, 'supply-chain-strategy');
    assertKpiValues(values);
  });

  it('imports correctly when there is no UTF-8 BOM (Excel drops the BOM on re-save)', () => {
    const rows = buildFilledRows();
    const csvNoBom = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    expect(csvNoBom.charCodeAt(0)).not.toBe(0xFEFF);
    const { values } = runNewFormatImport(csvNoBom, 'supply-chain-strategy');
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
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
    assertKpiValues(values);
  });

  it('imports correctly when cell values have leading and trailing whitespace', () => {
    const rows = buildFilledRows();
    const padCell = (c: string): string => `"  ${c.replace(/"/g, '""')}  "`;
    const csvText = rows.map(r => r.map(padCell).join(',')).join('\r\n');
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
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
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
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
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');
    // log[0] is the auto-calculated summary line; remaining ✓ lines are per-KPI
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length).toBe(6);
    expect(log.find(l => l.includes('require manual entry'))).toBeUndefined();
  });
});

// ─── Supply-chain-strategy partial import ────────────────────────────────────
//
//  The supply-chain-strategy framework has 6 KPIs: por, otif, sccost, c2c, fa, turns.
//  This suite verifies that when a user fills in only por and otif the import:
//   • calculates the two complete KPIs correctly
//   • skips the four incomplete KPIs without zeroing them
//   • records a skip-reason log entry for each uncalculable KPI
//   • emits exactly 2 per-KPI success lines (summary line excluded)
//
describe('supply-chain-strategy import — partial inputs (only por and otif filled)', () => {
  /**
   * Build a supply-chain-strategy template with only por and otif "Your Value"
   * cells populated.  All other KPI rows are left blank.
   */
  function buildPartialScsRows(): string[][] {
    const rows = buildTemplateRows('supply-chain-strategy');
    const kpiInputIndex: Record<string, number> = {};
    rows.forEach(row => {
      const kpiId = row[0]?.trim().toLowerCase();
      if (!['por', 'otif'].includes(kpiId)) return;
      const spec = KPI_DATA_SPECS[kpiId];
      if (!spec) return;
      if (kpiInputIndex[kpiId] === undefined) kpiInputIndex[kpiId] = 0;
      const inputDef = spec.inputs[kpiInputIndex[kpiId]];
      kpiInputIndex[kpiId]++;
      if (inputDef) row[2] = String(inputDef.example);
    });
    return rows;
  }

  it('calculates por correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
    // por: pct(1_098, 1_200) = 91.5
    expect(values['por'], 'por').toBeCloseTo(91.5, 0);
  });

  it('calculates otif correctly from its example inputs', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');
    // otif: pct(782, 850) = 92.0
    expect(values['otif'], 'otif').toBeCloseTo(92.0, 0);
  });

  it('skipped KPIs are absent from the values map — not zeroed', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');

    expect(values['sccost'], 'sccost should be absent').toBeUndefined();
    expect(values['c2c'],    'c2c should be absent').toBeUndefined();
    expect(values['fa'],     'fa should be absent').toBeUndefined();
    expect(values['turns'],  'turns should be absent').toBeUndefined();
  });

  it('exactly 2 KPIs are calculated — no more, no less', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { values } = runNewFormatImport(csvText, 'supply-chain-strategy');

    expect(Object.keys(values).sort()).toEqual(['otif', 'por']);
  });

  it('log contains a skip-reason entry for each uncalculable KPI', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    const skipLines = log.filter(l => l.includes('skipped'));
    // sccost, c2c, fa, turns — all four should have a skip entry
    expect(skipLines.length, 'skip-reason log entries').toBeGreaterThanOrEqual(4);
  });

  it('log contains exactly 2 per-KPI success lines (summary line excluded)', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    // log[0] is the auto-calculated summary; filter it out before counting
    const kpiLines = log.filter(l => l.startsWith('✓') && !l.includes('auto-calculated'));
    expect(kpiLines.length, 'per-KPI success log lines').toBe(2);
  });

  it('skip-reason entries name the skipped KPIs, not the calculated ones', () => {
    const csvText = rowsToCsvText(buildPartialScsRows());
    const { log } = runNewFormatImport(csvText, 'supply-chain-strategy');

    const skipLines = log.filter(l => l.includes('skipped'));
    const skipText = skipLines.join('\n');

    // Skipped KPI labels appear in the log
    expect(skipText).toContain('SC Cost');          // sccost
    expect(skipText).toContain('Cash-to-Cash');     // c2c
    expect(skipText).toContain('Forecast Accuracy'); // fa
    expect(skipText).toContain('Inventory Turns');   // turns

    // Calculated KPI labels must NOT appear in the skip lines
    expect(skipText).not.toContain('Perfect Order');
    expect(skipText).not.toContain('On-Time In-Full');
  });
});

// ─── Status formula target value (threshold) correctness ────────────────────
//
//  The Status formula embeds k.targetValue directly, e.g.
//    =IF(C12="","",IF(C12>=95,"✅ On Target","❌ Below Target"))
//
//  These tests assert the embedded numeric threshold equals k.targetValue for
//  every KPI across six diverse frameworks, covering the following unit types:
//    %  days  PPM  /100  /qtr  events  σ  /5  turns  pts  hrs
//  Both spec-backed (auto-calculated) and direct-entry KPIs are covered.
//

describe('buildKpiTemplateRows – Status formula embeds correct targetValue', () => {
  /**
   * Extract the numeric threshold from an Excel IF formula of the form
   *   =IF(Cn="","",IF(Cn>=VALUE,"✅ On Target","❌ Below Target"))
   * Returns null if no threshold is found (e.g. empty formula string).
   */
  function extractThreshold(formula: string): number | null {
    const m = formula.match(/(?:>=|<=)([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  }

  /**
   * For every KPI in the given framework slug, assert that the threshold
   * embedded in the Status formula equals k.targetValue.
   */
  function assertAllTargetValues(slug: string): void {
    const kpis = KPI_FRAMEWORKS[slug];
    expect(kpis, `No KPI framework for slug "${slug}"`).toBeDefined();

    const label = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const rows = buildKpiTemplateRows(kpis, label, TODAY);

    kpis.forEach(k => {
      const resultRow = getResultRow(rows, k.id);
      expect(resultRow, `No __result row for KPI "${k.id}" in "${slug}"`).toBeDefined();

      const formula = resultRow![6];
      const embedded = extractThreshold(formula);

      expect(
        embedded,
        `KPI "${k.id}" (unit: ${k.unit}) in "${slug}": ` +
        `formula threshold ${embedded} should equal targetValue ${k.targetValue}`,
      ).toBe(k.targetValue);
    });
  }

  // ── supply-chain-strategy: %, days, turns ─────────────────────────────────
  // por 95%, otif 92%, sccost 8%, c2c 28 days, fa 85%, turns 10
  it('supply-chain-strategy – all 6 KPIs embed the correct targetValue (%, days, turns)', () => {
    assertAllTargetValues('supply-chain-strategy');
  });

  // ── lean-six-sigma: %, σ, events ──────────────────────────────────────────
  // pce 25%, sigma 4.0σ, ftr 92%, ltr 35%, copq 2%, kaizen 6 events
  it('lean-six-sigma – all 6 KPIs embed the correct targetValue (%, σ, events)', () => {
    assertAllTargetValues('lean-six-sigma');
  });

  // ── supplier-relationship-governance: %, PPM, /100 ────────────────────────
  // sotif2 94%, ppm 500 PPM, ss2 20%, jbp 100%, esga2 100%, sc2 95%
  it('supplier-relationship-governance – all 6 KPIs embed the correct targetValue (%, PPM)', () => {
    assertAllTargetValues('supplier-relationship-governance');
  });

  // ── governance-compliance: %, /100, /qtr ─────────────────────────────────
  // pcr 92%, aud 85/100, cco 90%, mav 5%, doa 0/qtr, asa 95%
  it('governance-compliance – all 6 KPIs embed the correct targetValue (%, /100, /qtr)', () => {
    assertAllTargetValues('governance-compliance');
  });

  // ── value-engineering: %, days, /5 ───────────────────────────────────────
  // ves 10%, scv 5%, iir 60%, spc 98%, tis 90 days, ssat 4.2/5
  it('value-engineering – all 6 KPIs embed the correct targetValue (%, days, /5)', () => {
    assertAllTargetValues('value-engineering');
  });

  // ── training-capability-building: %, pts ─────────────────────────────────
  // asi 25 pts, tcr 90%, cepr 80%, bcs 70%, kpii 15%, roi 400%
  it('training-capability-building – all 6 KPIs embed the correct targetValue (%, pts)', () => {
    assertAllTargetValues('training-capability-building');
  });

  // ── resiliency: %, days, hrs ─────────────────────────────────────────────
  // rtoa 95%, mttr 72 hrs, dsc 90%, buf 30 days, sld 80%, rar 3%
  it('resiliency – all 6 KPIs embed the correct targetValue (%, days, hrs)', () => {
    assertAllTargetValues('resiliency');
  });

  // ── direct-entry KPIs (no KPI_DATA_SPEC) also embed the correct targetValue
  //
  //  KPI_FALLBACK is a synthetic KpiDef whose id is not in KPI_DATA_SPECS, so
  //  buildKpiTemplateRows takes the else-branch (direct-entry path). Its
  //  targetValue is 50 and higherIsBetter is true, so the expected formula
  //  is: =IF(C…="","",IF(C…>=50,"✅ On Target","❌ Below Target"))
  it('direct-entry path (no spec): Status formula embeds the correct targetValue', () => {
    // KPI_FALLBACK has no entry in KPI_DATA_SPECS — confirmed by design
    expect(KPI_DATA_SPECS[KPI_FALLBACK.id], 'KPI_FALLBACK must not have a spec').toBeUndefined();

    const rows = buildKpiTemplateRows([KPI_FALLBACK], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, KPI_FALLBACK.id);

    expect(resultRow, 'No __result row for KPI_FALLBACK').toBeDefined();

    const formula = resultRow![6];
    const embedded = extractThreshold(formula);

    expect(
      embedded,
      `Direct-entry KPI_FALLBACK: formula threshold ${embedded} should equal targetValue ${KPI_FALLBACK.targetValue}`,
    ).toBe(KPI_FALLBACK.targetValue); // 50
  });

  // ── lower-is-better direct-entry KPI: threshold is still the raw targetValue
  it('direct-entry lower-is-better KPI: formula embeds the correct targetValue', () => {
    const LOWER_FALLBACK: KpiDef = {
      ...KPI_FALLBACK,
      id: '__test_fallback_lower__',
      targetValue: 3,
      targetLabel: '<3%',
      higherIsBetter: false,
    };
    expect(KPI_DATA_SPECS[LOWER_FALLBACK.id], 'LOWER_FALLBACK must not have a spec').toBeUndefined();

    const rows = buildKpiTemplateRows([LOWER_FALLBACK], FRAMEWORK_LABEL, TODAY);
    const resultRow = getResultRow(rows, LOWER_FALLBACK.id);

    expect(resultRow, 'No __result row for LOWER_FALLBACK').toBeDefined();

    const formula = resultRow![6];
    expect(formula).toContain('<=');
    const embedded = extractThreshold(formula);
    expect(embedded).toBe(LOWER_FALLBACK.targetValue); // 3
  });
});
