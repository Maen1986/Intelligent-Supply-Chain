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
import { scoreColor, miniGaugeState, healthGaugeState } from './KPIDashboard';

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
