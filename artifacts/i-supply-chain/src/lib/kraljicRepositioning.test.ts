import { describe, it, expect } from 'vitest';
import { evaluateReposition, type ReviewPoint } from './kraljicRepositioning';

const rv = (dateIso: string, quadrant: ReviewPoint['quadrant'], riskPct?: number, profitPct?: number): ReviewPoint => ({ dateIso, quadrant, riskPct, profitPct });
const base = { asOfIso: '2026-11-01' };

describe('repositioning method (ISC synthesis)', () => {
  it('holds when the latest review matches the confirmed quadrant', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'leverage', reviews: [rv('2026-09-01', 'leverage')] });
    expect(r.decision).toBe('hold');
    expect(r.basis).toBe('isc-synthesis');
  });
  it('flags review due after the interval (boundary: exactly 365 days)', () => {
    const due = evaluateReposition({ asOfIso: '2026-09-01', confirmedQuadrant: 'leverage', reviews: [rv('2025-09-01', 'leverage')] });
    expect(due.decision).toBe('review-due');
    const notDue = evaluateReposition({ asOfIso: '2026-08-31', confirmedQuadrant: 'leverage', reviews: [rv('2025-09-01', 'leverage')] });
    expect(notDue.decision).toBe('hold');
  });
  it('asks for a first review when none exists', () => {
    expect(evaluateReposition({ ...base, confirmedQuadrant: 'leverage', reviews: [] }).decision).toBe('review-due');
  });
  it('hysteresis: one review in a new quadrant is only watch', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-05-01', 'bottleneck'), rv('2026-10-01', 'non-critical')] });
    expect(r.decision).toBe('watch');
    expect(r.candidate).toBe('non-critical');
    expect(r.consecutive).toBe(1);
    expect(r.handover.length).toBeGreaterThan(0);
  });
  it('hysteresis: two consecutive reviews confirm the move', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-05-01', 'non-critical'), rv('2026-10-01', 'non-critical')] });
    expect(r.decision).toBe('confirm-move');
    expect(r.handover.length).toBeGreaterThanOrEqual(3);
  });
  it('a flip-flop (new, old, new) does not count as consecutive', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-03-01', 'non-critical'), rv('2026-06-01', 'bottleneck'), rv('2026-10-01', 'non-critical')] });
    expect(r.decision).toBe('watch');
    expect(r.consecutive).toBe(1);
  });
  it('margin: a clear crossing confirms after one review', () => {
    // bottleneck -> non-critical: risk axis changes, needs >=10 points beyond 50
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-10-01', 'non-critical', 30, 20)] });
    expect(r.decision).toBe('confirm-move');
    const near = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-10-01', 'non-critical', 45, 20)] });
    expect(near.decision).toBe('watch');
  });
  it('margin boundary: exactly 10 points beyond confirms', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-10-01', 'non-critical', 40, 20)] });
    expect(r.decision).toBe('confirm-move');
  });
  it('persistence test: shock shorter than time-to-survive is situational, no move', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'non-critical', reviews: [rv('2026-10-01', 'bottleneck')],
      event: { type: 'market-shock', expectedDurationDays: 20, timeToSurviveDays: 45 } });
    expect(r.decision).toBe('situational');
  });
  it('persistence test: equal duration is not short (boundary) and proceeds to the structural check', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'non-critical', reviews: [rv('2026-10-01', 'bottleneck')],
      event: { type: 'market-shock', expectedDurationDays: 45, timeToSurviveDays: 45 } });
    expect(r.decision).toBe('watch');
  });
  it('never guesses: unknown durations ask for the facts', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'non-critical', reviews: [rv('2026-10-01', 'bottleneck')],
      event: { type: 'supplier-failure', expectedDurationDays: null, timeToSurviveDays: 30 } });
    expect(r.decision).toBe('need-facts');
    expect(r.missing).toHaveLength(1);
  });
  it('config overrides apply (confirmReviews 3)', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', confirmReviews: 3, reviews: [rv('2026-05-01', 'non-critical'), rv('2026-10-01', 'non-critical')] });
    expect(r.decision).toBe('watch');
    expect(r.needed).toBe(3);
  });
  it('bilingual text is present everywhere', () => {
    const r = evaluateReposition({ ...base, confirmedQuadrant: 'bottleneck', reviews: [rv('2026-10-01', 'non-critical')] });
    for (const t of [r.headline, ...r.reasons, ...r.handover]) { expect(t.en.length).toBeGreaterThan(5); expect(/[؀-ۿ]/.test(t.ar)).toBe(true); }
  });
});
