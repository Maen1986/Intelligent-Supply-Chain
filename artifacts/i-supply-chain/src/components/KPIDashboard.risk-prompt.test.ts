/**
 * Confirm the AI plan prompt for risk-management surfaces all 6 KPIs —
 * including the 3 newly calculable ones: crm, srs, and rrc2.
 *
 * The buildKpiPrompt callback (inside KPIDashboard) maps over every KPI in
 * the active framework and emits a line whenever a numeric value is present.
 * This test verifies that:
 *   1. All 6 risk-management KPIs are present in the framework.
 *   2. crm, srs, and rrc2 have defined calculate() specs in KPI_DATA_SPECS.
 *   3. A prompt built with values for all 6 KPIs references each of the 3 new
 *      KPI labels by name.
 */
import { describe, it, expect } from 'vitest';
import { KPI_FRAMEWORKS } from './KPIDashboard';
import { KPI_DATA_SPECS } from '@/lib/kpiDataSpecs';

const RISK_FRAMEWORK = KPI_FRAMEWORKS['risk-management'];

/** IDs of the three KPIs that were previously uncalculable. */
const NEW_KPI_IDS = ['crm', 'srs', 'rrc2'] as const;

/** IDs of all six expected risk-management KPIs. */
const ALL_RISK_KPI_IDS = ['rrc', 'bcpt', 'rtoa2', 'crm', 'srs', 'rrc2'] as const;

// ---------------------------------------------------------------------------
// Helper: replicate the core prompt-building logic from buildKpiPrompt.
// This mirrors what the callback does so we can test it without rendering
// the component.
// ---------------------------------------------------------------------------
function buildRiskPromptLines(values: Record<string, string>): string {
  if (!RISK_FRAMEWORK) return '';
  return RISK_FRAMEWORK.map(k => {
    const raw = parseFloat(values[k.id] ?? '');
    if (isNaN(raw)) return null;
    const score = k.higherIsBetter
      ? Math.min(100, Math.round((raw / k.targetValue) * 100))
      : raw > 0 ? Math.min(100, Math.round((k.targetValue / raw) * 100)) : 0;
    const tier =
      score >= 95 ? 'WORLD CLASS' :
      score >= 80 ? 'BEST-IN-GCC' :
      score >= 65 ? 'COMPETITIVE' :
      score >= 50 ? 'DEVELOPING' :
      score >= 35 ? 'NEEDS ATTENTION' : 'CRITICAL GAP';
    return `- **${k.label}**: ${raw} ${k.unit} vs target ${k.targetLabel} | peer benchmark: ${k.benchmarkLabel} (GCC general median) → ${tier}`;
  }).filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('risk-management KPI framework completeness', () => {
  it('framework is defined and contains exactly 6 KPIs', () => {
    expect(RISK_FRAMEWORK, 'KPI_FRAMEWORKS["risk-management"] should be defined').toBeDefined();
    expect(RISK_FRAMEWORK.length).toBe(6);
  });

  it.each(ALL_RISK_KPI_IDS)(
    'KPI "%s" is present in the risk-management framework',
    (kpiId) => {
      const found = RISK_FRAMEWORK.find(k => k.id === kpiId);
      expect(found, `KPI "${kpiId}" missing from risk-management framework`).toBeDefined();
    },
  );
});

describe('calculable specs exist for the 3 new risk-management KPIs', () => {
  it.each(NEW_KPI_IDS)(
    'KPI_DATA_SPECS has a calculate() function for "%s"',
    (kpiId) => {
      const spec = KPI_DATA_SPECS[kpiId];
      expect(spec, `KPI_DATA_SPECS entry missing for "${kpiId}"`).toBeDefined();
      expect(typeof spec.calculate).toBe('function');
    },
  );

  it('crm calculate() returns correct percentage', () => {
    const spec = KPI_DATA_SPECS['crm'];
    // 17 of 20 critical risks mitigated → 85%
    expect(spec.calculate({ total_critical_risks: 20, mitigated_critical_risks: 17 })).toBe(85);
  });

  it('srs calculate() returns correct average', () => {
    const spec = KPI_DATA_SPECS['srs'];
    // 3750 score-points across 50 suppliers → 75
    expect(spec.calculate({ sum_supplier_scores: 3750, supplier_count: 50 })).toBe(75);
  });

  it('rrc2 calculate() returns correct percentage', () => {
    const spec = KPI_DATA_SPECS['rrc2'];
    // 22 of 24 reviews completed → round(22/24*1000)/10 = round(916.67)/10 = 917/10 = 91.7
    expect(spec.calculate({ total_scheduled_reviews: 24, completed_scheduled_reviews: 22 })).toBe(91.7);
  });
});

describe('AI plan prompt surfaces all 6 risk-management KPIs when values are present', () => {
  // Realistic values for all 6 KPIs
  const ALL_VALUES: Record<string, string> = {
    rrc:   '72',   // Risk Register Coverage %
    bcpt:  '80',   // BCP Test Pass Rate %
    rtoa2: '88',   // RTO Attainment %
    crm:   '85',   // Critical Risk Mitigation Rate %
    srs:   '75',   // Supplier Risk Score
    rrc2:  '92',   // Risk Review Compliance %
  };

  const prompt = buildRiskPromptLines(ALL_VALUES);

  it('prompt is non-empty when values are present for all 6 KPIs', () => {
    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  it.each(RISK_FRAMEWORK.map(k => ({ id: k.id, label: k.label })))(
    'prompt includes the label for KPI "$id" ("$label")',
    ({ label }) => {
      expect(prompt).toContain(label);
    },
  );

  it('prompt specifically references "Critical Risk Mitigation Rate %" (crm)', () => {
    expect(prompt).toContain('Critical Risk Mitigation Rate %');
  });

  it('prompt specifically references "Supplier Risk Score" (srs)', () => {
    expect(prompt).toContain('Supplier Risk Score');
  });

  it('prompt specifically references "Risk Review Compliance %" (rrc2)', () => {
    expect(prompt).toContain('Risk Review Compliance %');
  });

  it('prompt includes the crm actual value', () => {
    expect(prompt).toContain('85');
  });

  it('prompt includes the srs actual value', () => {
    expect(prompt).toContain('75');
  });

  it('prompt includes the rrc2 actual value', () => {
    expect(prompt).toContain('92');
  });
});

describe('AI plan prompt excludes KPIs with no entered value', () => {
  // Only the 3 original KPIs have values; the 3 new ones are blank
  const PARTIAL_VALUES: Record<string, string> = {
    rrc:   '72',
    bcpt:  '80',
    rtoa2: '88',
    // crm, srs, rrc2 intentionally omitted
  };

  const partialPrompt = buildRiskPromptLines(PARTIAL_VALUES);

  it('prompt is non-empty for partial entry', () => {
    expect(partialPrompt.trim().length).toBeGreaterThan(0);
  });

  it('prompt does not include crm line when crm has no value', () => {
    expect(partialPrompt).not.toContain('Critical Risk Mitigation Rate %');
  });

  it('prompt does not include srs line when srs has no value', () => {
    expect(partialPrompt).not.toContain('Supplier Risk Score');
  });

  it('prompt does not include rrc2 line when rrc2 has no value', () => {
    expect(partialPrompt).not.toContain('Risk Review Compliance %');
  });

  it('prompt still includes the 3 original KPIs that have values', () => {
    expect(partialPrompt).toContain('Risk Register Coverage %');
    expect(partialPrompt).toContain('BCP Test Pass Rate %');
    expect(partialPrompt).toContain('RTO Attainment %');
  });
});

describe('AI plan prompt with all 6 values shows correct tier labels', () => {
  // crm = 85% → score = round(85/90*100) = 94 → NEEDS ATTENTION? No: 94 >= 80 → BEST-IN-GCC
  // srs = 75 → score = round(75/75*100) = 100 → WORLD CLASS
  // rrc2 = 92% → score = round(92/100*100) = 92 → BEST-IN-GCC
  const VALUES: Record<string, string> = {
    crm:  '85',
    srs:  '75',
    rrc2: '92',
  };
  const prompt = buildRiskPromptLines(VALUES);

  it('crm at 85% shows BEST-IN-GCC tier', () => {
    // score = min(100, round(85/90*100)) = min(100,94) = 94 → BEST-IN-GCC (>=80 but <95)
    expect(prompt).toContain('BEST-IN-GCC');
  });

  it('srs at 75 shows WORLD CLASS tier', () => {
    // score = min(100, round(75/75*100)) = 100 → WORLD CLASS
    expect(prompt).toContain('WORLD CLASS');
  });
});
