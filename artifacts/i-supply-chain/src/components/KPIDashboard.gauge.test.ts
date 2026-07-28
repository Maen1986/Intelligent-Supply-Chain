/**
 * MiniGauge — score and colour logic unit tests.
 *
 * Scoring model (scoreKpi):
 *   score = 50 at industry benchmark (50th percentile)
 *   score = 100 at best-in-class target (≈ top 10 %)
 *   score = 0 when value is as far BELOW benchmark as benchmark is ABOVE target
 *
 * 7-tier colour map (scoreTier / scoreColor):
 *   ≥ 90  #b45309  Top 10 % — Market Leaders (gold)
 *   ≥ 75  #059669  Top 25 %                   (dark emerald)
 *   ≥ 55  #10b981  Top 50 % — Above Average   (green)
 *   ≥ 40  #3b82f6  Industry Benchmark          (blue — accepted)
 *   ≥ 25  #f59e0b  Bottom 50 % — Below Avg     (amber)
 *   ≥ 10  #ef4444  Bottom 25 % — Far Below     (red)
 *    < 10  #b91c1c  Bottom 10 % — Critical      (dark red)
 *
 * Sources: APICS/ASCM SCOR v12, Hackett Group WC Procurement 2023,
 * Gartner SC Top 25 2024, CIPS/CIPSA Benchmarking Survey 2024.
 */
import { describe, it, expect } from 'vitest';
import {
  scoreColor, miniGaugeState, healthGaugeState,
  buildBarChartData, KPI_FRAMEWORKS, type KpiDef,
} from './KPIDashboard';

const R            = 30;
const CIRCUMFERENCE = Math.PI * R;

// ─── scoreColor — 7-tier industry-percentile colour boundaries ───────────────
describe('scoreColor — 7-tier industry-percentile colour boundaries', () => {

  // Top 10 % — Market Leaders (≥ 90)
  it('returns #b45309 at score 90 (Top 10% — Market Leaders)', () => {
    expect(scoreColor(90)).toBe('#b45309');
  });
  it('returns #b45309 at score 100 (Top 10% — Market Leaders)', () => {
    expect(scoreColor(100)).toBe('#b45309');
  });

  // Top 25 % (75–89)
  it('returns #059669 at score 75 (Top 25%)', () => {
    expect(scoreColor(75)).toBe('#059669');
  });
  it('returns #059669 at score 89 (Top 25%)', () => {
    expect(scoreColor(89)).toBe('#059669');
  });

  // Top 50 % — Above Average (55–74)
  it('returns #10b981 at score 55 (Top 50% — Above Average)', () => {
    expect(scoreColor(55)).toBe('#10b981');
  });
  it('returns #10b981 at score 74 (Top 50% — Above Average)', () => {
    expect(scoreColor(74)).toBe('#10b981');
  });

  // Industry Benchmark (40–54)
  it('returns #3b82f6 at score 50 (Industry Benchmark — midpoint)', () => {
    expect(scoreColor(50)).toBe('#3b82f6');
  });
  it('returns #3b82f6 at score 40 (Industry Benchmark — lower edge)', () => {
    expect(scoreColor(40)).toBe('#3b82f6');
  });
  it('returns #3b82f6 at score 54 (Industry Benchmark — upper edge)', () => {
    expect(scoreColor(54)).toBe('#3b82f6');
  });

  // Bottom 50 % — Below Average (25–39)
  it('returns #f59e0b at score 25 (Bottom 50% — Below Avg)', () => {
    expect(scoreColor(25)).toBe('#f59e0b');
  });
  it('returns #f59e0b at score 39 (Bottom 50% — Below Avg)', () => {
    expect(scoreColor(39)).toBe('#f59e0b');
  });

  // Bottom 25 % — Far Below (10–24)
  it('returns #ef4444 at score 10 (Bottom 25% — Far Below)', () => {
    expect(scoreColor(10)).toBe('#ef4444');
  });
  it('returns #ef4444 at score 24 (Bottom 25% — Far Below)', () => {
    expect(scoreColor(24)).toBe('#ef4444');
  });

  // Bottom 10 % — Critical (< 10)
  it('returns #b91c1c at score 9 (Bottom 10% — Critical)', () => {
    expect(scoreColor(9)).toBe('#b91c1c');
  });
  it('returns #b91c1c at score 0 (Bottom 10% — Critical)', () => {
    expect(scoreColor(0)).toBe('#b91c1c');
  });

  // Exhaustive: only the seven canonical tier colours appear across 0–100
  it('only produces the seven canonical tier colours across 0–100', () => {
    const TIER_COLORS = ['#b45309', '#059669', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#b91c1c'];
    for (let s = 0; s <= 100; s++) {
      expect(TIER_COLORS, `score ${s} produced an unexpected colour`).toContain(scoreColor(s));
    }
  });
});

// ─── miniGaugeState — safeScore clamping ────────────────────────────────────
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

// ─── miniGaugeState — strokeDash at score boundaries ───────────────────────
describe('miniGaugeState — strokeDash at score boundaries', () => {
  it('strokeDash is 0 when score is 0', () => {
    const { strokeDash } = miniGaugeState(0, true);
    expect(strokeDash).toBe(0);
  });

  it('strokeDash equals full circumference when score is 100', () => {
    const { strokeDash } = miniGaugeState(100, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE, 5);
  });

  it('strokeDash is half circumference when score is 50 (= industry benchmark)', () => {
    const { strokeDash } = miniGaugeState(50, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE * 0.5, 5);
  });

  it('strokeDash is 80 % of circumference when score is 80', () => {
    const { strokeDash } = miniGaugeState(80, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE * 0.8, 5);
  });
});

// ─── miniGaugeState — grey/neutral state ────────────────────────────────────
describe('miniGaugeState — grey/neutral state (no value entered)', () => {
  it('uses grey (#e5e7eb) track colour when hasValue is false', () => {
    const { color } = miniGaugeState(0, false);
    expect(color).toBe('#e5e7eb');
  });

  it('uses grey (#e5e7eb) even if a score is supplied but hasValue is false', () => {
    const { color } = miniGaugeState(90, false);
    expect(color).toBe('#e5e7eb');
  });

  it('uses tier colour when hasValue is true (score 75 → Top 25% #059669)', () => {
    const { color } = miniGaugeState(75, true);
    expect(color).toBe('#059669');
  });

  it('uses tier colour when hasValue is true (score 90 → Top 10% Market Leaders #b45309)', () => {
    const { color } = miniGaugeState(90, true);
    expect(color).toBe('#b45309');
  });

  it('uses tier colour when hasValue is true (score 50 → Industry Benchmark #3b82f6)', () => {
    const { color } = miniGaugeState(50, true);
    expect(color).toBe('#3b82f6');
  });
});

// ─── healthGaugeState — neutral state when hasAnyValue is false ─────────────
const R_HEALTH          = 72;
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

  it('uses tier colour when hasAnyValue is true (score 75 → Top 25% #059669)', () => {
    const { color } = healthGaugeState(75, true);
    expect(color).toBe('#059669');
  });

  it('uses tier colour when hasAnyValue is true (score 90 → Top 10% Market Leaders #b45309)', () => {
    const { color } = healthGaugeState(90, true);
    expect(color).toBe('#b45309');
  });

  it('strokeDash is proportional to score when hasAnyValue is true (50 % fill at score 50)', () => {
    const { strokeDash } = healthGaugeState(50, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE_HEALTH * 0.5, 5);
  });

  it('strokeDash equals full circumference at score 100 when hasAnyValue is true', () => {
    const { strokeDash } = healthGaugeState(100, true);
    expect(strokeDash).toBeCloseTo(CIRCUMFERENCE_HEALTH, 5);
  });
});

// ─── buildBarChartData — empty state (no KPI values entered) ─────────────────
describe('buildBarChartData — empty state (no KPI values entered)', () => {
  const sampleKpis   = KPI_FRAMEWORKS['supply-chain-strategy'];
  const emptyScores  = sampleKpis.map((k: KpiDef) => ({
    kpi:   k,
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

// ─── bar chart visibility guard — hasAnyValue logic ─────────────────────────
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
