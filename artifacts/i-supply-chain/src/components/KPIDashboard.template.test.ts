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
