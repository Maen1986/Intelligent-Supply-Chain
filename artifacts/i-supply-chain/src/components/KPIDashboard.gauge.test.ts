/**
 * MiniGauge — score and colour logic unit tests.
 *
 * Covers:
 *  • scoreColor  6-tier colour boundaries (0, 34, 35, 49, 50, 64, 65, 79, 80, 94, 95, 100)
 *  • miniGaugeState  safeScore clamping (below 0, above 100)
 *  • miniGaugeState  strokeDash values at canonical boundaries
 *  • miniGaugeState  grey/neutral state when hasValue is false
 */
import { describe, it, expect } from 'vitest';
import { scoreColor, miniGaugeState, healthGaugeState, buildBarChartData, KPI_FRAMEWORKS, type KpiDef } from './KPIDashboard';

const R = 30;
const CIRCUMFERENCE = Math.PI * R;

// ─── scoreColor ────────────────────────────────────────────────────────────
describe('scoreColor — 6-tier colour boundaries', () => {
  // World Class tier (≥95)
  it('returns #059669 at score 95 (World Class)', () => {
    expect(scoreColor(95)).toBe('#059669');
  });
  it('returns #059669 at score 100 (World Class)', () => {
    expect(scoreColor(100)).toBe('#059669');
  });

  // Best-in-GCC tier (80–94)
  it('returns #10b981 at score 80 (Best-in-GCC)', () => {
    expect(scoreColor(80)).toBe('#10b981');
  });
  it('returns #10b981 at score 94 (Best-in-GCC)', () => {
    expect(scoreColor(94)).toBe('#10b981');
  });

  // Competitive tier (65–79)
  it('returns #3b82f6 at score 65 (Competitive)', () => {
    expect(scoreColor(65)).toBe('#3b82f6');
  });
  it('returns #3b82f6 at score 79 (Competitive)', () => {
    expect(scoreColor(79)).toBe('#3b82f6');
  });

  // Developing tier (50–64)
  it('returns #f59e0b at score 50 (Developing)', () => {
    expect(scoreColor(50)).toBe('#f59e0b');
  });
  it('returns #f59e0b at score 64 (Developing)', () => {
    expect(scoreColor(64)).toBe('#f59e0b');
  });

  // Needs Attention tier (35–49)
  it('returns #f97316 at score 35 (Needs Attention)', () => {
    expect(scoreColor(35)).toBe('#f97316');
  });
  it('returns #f97316 at score 49 (Needs Attention)', () => {
    expect(scoreColor(49)).toBe('#f97316');
  });

  // Critical Gap tier (<35)
  it('returns #ef4444 at score 34 (Critical Gap)', () => {
    expect(scoreColor(34)).toBe('#ef4444');
  });
  it('returns #ef4444 at score 0 (Critical Gap)', () => {
    expect(scoreColor(0)).toBe('#ef4444');
  });

  // Only the 6 canonical tier colours are ever produced
  it('only produces the six canonical tier colours across 0–100', () => {
    const TIER_COLORS = ['#059669', '#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
    for (let s = 0; s <= 100; s++) {
      expect(TIER_COLORS).toContain(scoreColor(s));
    }
  });
});

// ─── miniGaugeState — safeScore clamping ──────────────────────────────────
describe('miniGaugeState — safeScore clamping', () => {
  it('clamps negative rawScore to 0', () => {
    const { safeScore } = miniGaugeState(-10, true);
    expect(safeScore).toBe(0);
  });

  it('clamps rawScore > 100 to 100', () => {
    const { safeScore } = miniGaugeState(150, true);
    expect(safeScore).toBe(100);
  });

  it('passes through score 50 unchanged', () => {
    const { safeScore } = miniGaugeState(50, true);
    expect(safeScore).toBe(50);
  });
});

// ─── miniGaugeState — strokeDash at boundaries ───────────────────────────
describe('miniGaugeState — strokeDash at score boundaries', () => {
  it('strokeDash is 0 when score is 0', () => {
    const { strokeDash } = miniGaugeState(0, true);
    expect(strokeDash).toBe(0);
  });

  it('strokeDash equals full circumference when score is 100', () => {
    const { strokeDash } = miniGaugeState(100, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it('strokeDash is half circumference when score is 50', () => {
    const { strokeDash } = miniGaugeState(50, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE * 0.5, 5);
  });

  it('strokeDash is 80% of circumference when score is 80', () => {
    const { strokeDash } = miniGaugeState(80, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE * 0.8, 5);
  });
});

// ─── miniGaugeState — grey/neutral state ─────────────────────────────────
describe('miniGaugeState — grey/neutral state (no value entered)', () => {
  it('uses grey (#e5e7eb) track colour when hasValue is false', () => {
    const { color } = miniGaugeState(0, false);
    expect(color).toBe('#e5e7eb');
  });

  it('uses grey (#e5e7eb) even if a score is supplied but hasValue is false', () => {
    const { color } = miniGaugeState(90, false);
    expect(color).toBe('#e5e7eb');
  });

  it('uses tier colour when hasValue is true (score 80 → Best-in-GCC #10b981)', () => {
    const { color } = miniGaugeState(80, true);
    expect(color).toBe('#10b981');
  });

  it('uses tier colour when hasValue is true (score 95 → World Class #059669)', () => {
    const { color } = miniGaugeState(95, true);
    expect(color).toBe('#059669');
  });
});

// ─── healthGaugeState — neutral state when hasAnyValue is false ───────────
const R_HEALTH = 72;
const CIRCUMFERENCE_HEALTH = Math.PI * R_HEALTH;

describe('healthGaugeState — neutral state (no KPI values entered)', () => {
  it('returns grey (#e5e7eb) colour when hasAnyValue is false', () => {
    const { color } = healthGaugeState(0, false);
    expect(color).toBe('#e5e7eb');
  });

  it('strokeDash is 0 when hasAnyValue is false (arc shows no fill)', () => {
    const { strokeDash } = healthGaugeState(0, false);
    expect(strokeDash).toBe(0);
  });

  it('returns grey even if a non-zero score is passed while hasAnyValue is false', () => {
    const { color, strokeDash } = healthGaugeState(75, false);
    expect(color).toBe('#e5e7eb');
    expect(strokeDash).toBe(0);
  });

  it('uses tier colour when hasAnyValue is true (score 80 → Best-in-GCC #10b981)', () => {
    const { color } = healthGaugeState(80, true);
    expect(color).toBe('#10b981');
  });

  it('uses tier colour when hasAnyValue is true (score 95 → World Class #059669)', () => {
    const { color } = healthGaugeState(95, true);
    expect(color).toBe('#059669');
  });

  it('strokeDash is proportional to score when hasAnyValue is true', () => {
    const { strokeDash } = healthGaugeState(50, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE_HEALTH * 0.5, 5);
  });

  it('strokeDash equals full circumference at score 100 when hasAnyValue is true', () => {
    const { strokeDash } = healthGaugeState(100, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE_HEALTH, 5);
  });
});

// ─── buildBarChartData — empty state (no KPI values entered) ─────────────
describe('buildBarChartData — empty state (no KPI values entered)', () => {
  // Use the supply-chain-strategy framework as representative test data
  const sampleKpis = KPI_FRAMEWORKS['supply-chain-strategy'];

  // Simulate "no values entered": value is NaN (parseFloat of '' or undefined)
  const emptyScores = sampleKpis.map((k: KpiDef) => ({
    kpi: k,
    score: null as number | null,
    value: NaN,
  }));

  it('produces one data entry per KPI even when no values are entered', () => {
    const data = buildBarChartData(emptyScores, false);
    expect(data).toHaveLength(sampleKpis.length);
  });

  it('sets yours to 0 for every KPI when no values have been entered', () => {
    const data = buildBarChartData(emptyScores, false);
    data.forEach(d => expect(d.yours).toBe(0));
  });

  it('preserves target and benchmark values even when yours is 0', () => {
    const data = buildBarChartData(emptyScores, false);
    data.forEach((d, i) => {
      expect(d.target).toBe(sampleKpis[i].targetValue);
      expect(d.benchmark).toBe(sampleKpis[i].benchmarkValue);
    });
  });

  it('uses the English KPI label for name when isAr is false', () => {
    const data = buildBarChartData(emptyScores, false);
    data.forEach((d, i) => {
      expect(d.name).toBe(sampleKpis[i].label);
    });
  });

  it('uses the Arabic KPI label for name when isAr is true', () => {
    const data = buildBarChartData(emptyScores, true);
    data.forEach((d, i) => {
      expect(d.name).toBe(sampleKpis[i].labelAr);
    });
  });

  it('truncates nameShort to 18 characters with an ellipsis for long labels', () => {
    const data = buildBarChartData(emptyScores, false);
    data.forEach((d, i) => {
      const label = sampleKpis[i].label;
      if (label.length > 18) {
        expect(d.nameShort).toBe(label.substring(0, 18) + '…');
      } else {
        expect(d.nameShort).toBe(label);
      }
    });
  });
});

// ─── bar chart visibility guard — hasAnyValue logic ──────────────────────
describe('bar chart visibility guard — hasAnyValue', () => {
  const kpis = KPI_FRAMEWORKS['supply-chain-strategy'];

  it('is false when no values object keys match any KPI id', () => {
    const values: Record<string, string> = {};
    const hasAnyValue = kpis.some((k: KpiDef) => !isNaN(parseFloat(values[k.id] ?? '')));
    expect(hasAnyValue).toBe(false);
  });

  it('is false when all stored strings are empty', () => {
    const values: Record<string, string> = Object.fromEntries(kpis.map((k: KpiDef) => [k.id, '']));
    const hasAnyValue = kpis.some((k: KpiDef) => !isNaN(parseFloat(values[k.id] ?? '')));
    expect(hasAnyValue).toBe(false);
  });

  it('is true when at least one value string is a valid number', () => {
    const values: Record<string, string> = { [kpis[0].id]: '85' };
    const hasAnyValue = kpis.some((k: KpiDef) => !isNaN(parseFloat(values[k.id] ?? '')));
    expect(hasAnyValue).toBe(true);
  });

  it('is false when all value strings are non-numeric text', () => {
    const values: Record<string, string> = Object.fromEntries(kpis.map((k: KpiDef) => [k.id, 'abc']));
    const hasAnyValue = kpis.some((k: KpiDef) => !isNaN(parseFloat(values[k.id] ?? '')));
    expect(hasAnyValue).toBe(false);
  });
});
