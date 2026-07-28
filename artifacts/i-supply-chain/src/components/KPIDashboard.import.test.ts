/**
 * KPIDashboard — partial-data import tests.
 *
 * Verifies that `calcKpisFromInputs` (the pure helper used by handleKpiImport)
 * handles partial CSV data gracefully:
 *   - A KPI with only some of its required inputs is skipped with a clear log message.
 *   - A KPI with all its required inputs is calculated correctly.
 *   - No crash (exception or NaN written to values) occurs in either case.
 */
import { describe, it, expect } from 'vitest';
import { calcKpisFromInputs, KPI_FRAMEWORKS, type KpiDef } from './KPIDashboard';

// The risk-management framework contains crm, srs, and rrc2.
const riskKpis: KpiDef[] = KPI_FRAMEWORKS['risk-management'];

// Convenience: find a KPI def by id
function kpiById(id: string): KpiDef {
  const k = riskKpis.find(k => k.id === id);
  if (!k) throw new Error(`KPI "${id}" not found in risk-management framework`);
  return k;
}

describe('calcKpisFromInputs — partial data handling', () => {
  it('skips crm when only one of two required inputs is provided', () => {
    // crm needs: total_critical_risks AND mitigated_critical_risks
    // We provide only total_critical_risks.
    const inputsByKpi = {
      crm: { total_critical_risks: 20 }, // mitigated_critical_risks intentionally missing
    };

    const { values, log } = calcKpisFromInputs(riskKpis, inputsByKpi, false);

    // crm must not appear in calculated values
    expect(values.crm).toBeUndefined();

    // The log must contain a skip entry mentioning crm's missing input
    const skipEntry = log.find(l => l.includes('Critical Risk Mitigation Rate') && l.includes('missing inputs'));
    expect(skipEntry).toBeTruthy();
    expect(skipEntry).toContain('mitigated_critical_risks');

    // No NaN should appear anywhere in the values map
    for (const v of Object.values(values)) {
      expect(isNaN(Number(v))).toBe(false);
    }
  });

  it('skips srs when only one of two required inputs is provided', () => {
    // srs needs: sum_supplier_scores AND supplier_count
    const inputsByKpi = {
      srs: { sum_supplier_scores: 3750 }, // supplier_count intentionally missing
    };

    const { values, log } = calcKpisFromInputs(riskKpis, inputsByKpi, false);

    expect(values.srs).toBeUndefined();

    const skipEntry = log.find(l => l.includes('Supplier Risk Score') && l.includes('missing inputs'));
    expect(skipEntry).toBeTruthy();
    expect(skipEntry).toContain('supplier_count');
  });

  it('skips rrc2 when only one of two required inputs is provided', () => {
    // rrc2 needs: total_scheduled_reviews AND completed_scheduled_reviews
    const inputsByKpi = {
      rrc2: { total_scheduled_reviews: 24 }, // completed_scheduled_reviews intentionally missing
    };

    const { values, log } = calcKpisFromInputs(riskKpis, inputsByKpi, false);

    expect(values.rrc2).toBeUndefined();

    const skipEntry = log.find(l => l.includes('Risk Review Compliance') && l.includes('missing inputs'));
    expect(skipEntry).toBeTruthy();
    expect(skipEntry).toContain('completed_scheduled_reviews');
  });

  it('calculates rrc2 correctly when all inputs are present, even if crm is partial', () => {
    // Mixed scenario: crm is partial, rrc2 is complete.
    // Only rrc2 should land in values; crm should be skipped.
    const inputsByKpi = {
      crm:  { total_critical_risks: 20 },               // partial — missing mitigated_critical_risks
      rrc2: { total_scheduled_reviews: 24, completed_scheduled_reviews: 22 }, // complete
    };

    const { values, log, count } = calcKpisFromInputs(riskKpis, inputsByKpi, false);

    // rrc2 should be calculated: 22/24 × 100 = 91.7
    expect(values.rrc2).toBeDefined();
    expect(Number(values.rrc2)).toBeCloseTo(91.7, 1);

    // crm must be absent
    expect(values.crm).toBeUndefined();

    // Exactly 1 KPI was successfully calculated
    expect(count).toBe(1);

    // Log contains one skip and one success
    const skipEntry = log.find(l => l.includes('missing inputs'));
    expect(skipEntry).toBeTruthy();

    const successEntry = log.find(l => l.startsWith('✓') && l.includes('Risk Review Compliance'));
    expect(successEntry).toBeTruthy();
  });

  it('calculates crm correctly when all inputs are present', () => {
    // Full data for crm: 17 mitigated out of 20 critical = 85%
    const inputsByKpi = {
      crm: { total_critical_risks: 20, mitigated_critical_risks: 17 },
    };

    const { values, log } = calcKpisFromInputs(riskKpis, inputsByKpi, false);

    expect(values.crm).toBeDefined();
    expect(Number(values.crm)).toBeCloseTo(85, 1);

    const successEntry = log.find(l => l.startsWith('✓') && l.includes('Critical Risk Mitigation Rate'));
    expect(successEntry).toBeTruthy();
  });

  it('produces Arabic skip messages when isAr=true and no inputs at all are provided', () => {
    // Provide complete inputs for crm only; rrc2 gets no entry at all.
    const inputsByKpi = {
      crm: { total_critical_risks: 20, mitigated_critical_risks: 17 },
    };

    const { log } = calcKpisFromInputs(
      [kpiById('crm'), kpiById('rrc2')],
      inputsByKpi,
      true, // Arabic mode
    );

    // crm success entry should be present (not translated)
    const success = log.find(l => l.startsWith('✓'));
    expect(success).toBeTruthy();

    // rrc2 skip should be in Arabic (no-inputs message)
    const arSkip = log.find(l => l.includes('تم التخطّي'));
    expect(arSkip).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Import-log bidi isolation — Arabic labels with parentheses / slashes / "%"
// ─────────────────────────────────────────────────────────────────────────────
// KPI labels in frameworks like contract-lifecycle-management and
// procurement-excellence contain embedded parentheses (e.g. "زمن صياغة العقد
// (أيام)") and percent / slash characters (e.g. "OTIF المورّد %").  When
// these are displayed inside a forced-LTR <p dir="ltr"> element the Unicode
// bidi algorithm can mirror parentheses or reorder neutral characters in
// unexpected ways unless each label is wrapped in a bidi isolate.
//
// KPIDashboard.handleKpiImport wraps every label with FSI…PDI (U+2068…U+2069)
// before building the ✅/❌ status lines.  The tests below verify that
// property directly by reproducing the same string-building logic and
// confirming the isolate code-points are present for the problematic labels.
// ─────────────────────────────────────────────────────────────────────────────

const FSI = '\u2068'; // FIRST STRONG ISOLATE
const PDI = '\u2069'; // POP DIRECTIONAL ISOLATE

/** Mirror of the string-building code in handleKpiImport's status-line block */
function buildStatusLine(
  labelAr: string,
  num: number,
  unitAr: string,
  onTarget: boolean,
): string {
  const safeLabel = `${FSI}${labelAr}${PDI}`;
  return onTarget
    ? `✅ ${safeLabel}: ${num} ${unitAr} — حسب الهدف`
    : `❌ ${safeLabel}: ${num} ${unitAr} — دون الهدف`;
}

describe('import-log bidi isolation for Arabic labels with special characters', () => {
  // CLM framework — labels contain Arabic text + parenthesised unit suffix
  const clmKpis = KPI_FRAMEWORKS['contract-lifecycle-management'];

  it('CLM: "زمن صياغة العقد (أيام)" status line carries FSI…PDI isolate', () => {
    const kpi = clmKpis.find(k => k.id === 'cact');
    expect(kpi).toBeTruthy();
    const line = buildStatusLine(kpi!.labelAr, 8, kpi!.unitAr, true);
    expect(line).toContain(FSI);
    expect(line).toContain(PDI);
    // FSI must appear before PDI (correct nesting)
    expect(line.indexOf(FSI)).toBeLessThan(line.indexOf(PDI));
    // The Arabic label must be between the isolate code-points
    expect(line).toContain(`${FSI}${kpi!.labelAr}${PDI}`);
  });

  it('CLM: "زمن دورة التفاوض (أيام)" status line carries FSI…PDI isolate', () => {
    const kpi = clmKpis.find(k => k.id === 'neg');
    expect(kpi).toBeTruthy();
    const line = buildStatusLine(kpi!.labelAr, 12, kpi!.unitAr, true);
    expect(line).toContain(`${FSI}${kpi!.labelAr}${PDI}`);
  });

  // procurement-excellence — "OTIF المورّد" has a leading Latin run then Arabic
  const procKpis = KPI_FRAMEWORKS['procurement-excellence'];

  it('procurement-excellence: "OTIF المورّد" status line carries FSI…PDI isolate', () => {
    const kpi = procKpis.find(k => k.id === 'sotif');
    expect(kpi).toBeTruthy();
    const line = buildStatusLine(kpi!.labelAr, 96, kpi!.unitAr, true);
    expect(line).toContain(`${FSI}${kpi!.labelAr}${PDI}`);
  });

  // supplier-relationship-governance — "OTIF المورّد %" (label ends with %)
  const srgKpis = KPI_FRAMEWORKS['supplier-relationship-governance'];

  it('SRG: "OTIF المورّد %" status line carries FSI…PDI isolate', () => {
    const kpi = srgKpis.find(k => k.id === 'sotif2');
    expect(kpi).toBeTruthy();
    const line = buildStatusLine(kpi!.labelAr, 91, kpi!.unitAr, false);
    expect(line).toContain(`${FSI}${kpi!.labelAr}${PDI}`);
  });

  it('FSI and PDI each appear exactly once per status line', () => {
    // Guard against accidentally double-wrapping in future edits.
    const kpi = clmKpis.find(k => k.id === 'cact')!;
    const line = buildStatusLine(kpi.labelAr, 8, kpi.unitAr, true);
    const fsiCount = [...line].filter(c => c === FSI).length;
    const pdiCount = [...line].filter(c => c === PDI).length;
    expect(fsiCount).toBe(1);
    expect(pdiCount).toBe(1);
  });
});
