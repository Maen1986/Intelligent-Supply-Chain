/**
 * MiniGauge — score and colour logic unit tests.
 *
 * Covers:
 *  • scoreColor  RAG boundaries (0, 49, 50, 79, 80, 100)
 *  • miniGaugeState  safeScore clamping (below 0, above 100)
 *  • miniGaugeState  strokeDash values at canonical boundaries
 *  • miniGaugeState  grey/neutral state when hasValue is false
 */
import { describe, it, expect } from 'vitest';
import { scoreColor, miniGaugeState } from './KPIDashboard';

const R = 30;
const CIRCUMFERENCE = Math.PI * R;

// ─── scoreColor ────────────────────────────────────────────────────────────
describe('scoreColor — RAG colour boundaries', () => {
  it('returns green (#22c55e) at score 80', () => {
    expect(scoreColor(80)).toBe('#22c55e');
  });

  it('returns green (#22c55e) at score 100', () => {
    expect(scoreColor(100)).toBe('#22c55e');
  });

  it('returns amber (#f59e0b) at score 79 (just below green threshold)', () => {
    expect(scoreColor(79)).toBe('#f59e0b');
  });

  it('returns amber (#f59e0b) at score 50', () => {
    expect(scoreColor(50)).toBe('#f59e0b');
  });

  it('returns red (#ef4444) at score 49 (just below amber threshold)', () => {
    expect(scoreColor(49)).toBe('#ef4444');
  });

  it('returns red (#ef4444) at score 0', () => {
    expect(scoreColor(0)).toBe('#ef4444');
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

  it('uses RAG colour when hasValue is true', () => {
    const { color } = miniGaugeState(80, true);
    expect(color).toBe('#22c55e'); // green
  });
});
