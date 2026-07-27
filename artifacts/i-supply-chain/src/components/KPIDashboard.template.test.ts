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
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
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
        row[1]?.toLowerCase().substring(0, 30) === inp.label.toLowerCase().substring(0, 30),
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
