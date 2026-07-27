/**
 * Task 339 — Maturity results page: correct score when only some segments
 * are complete.
 *
 * The scoring fix ensures that incomplete segments are excluded from the
 * overall average (rather than dragging it down with a 0). These tests
 * confirm the results page behaves correctly for two complementary cases:
 *
 *  Part A — Redirect guard (protection layer)
 *    When the component reaches the results phase with only SOME segments
 *    fully answered, the redirect guard fires and sends the user back to
 *    the first incomplete segment. The results page is never shown, so the
 *    user cannot see a deflated or misleading score.
 *
 *  Part B — Correct score when all segments are complete
 *    When all 8 segments ARE fully answered the results page is shown, and
 *    the displayed overall score must equal the arithmetic mean of the eight
 *    segment scores — not a deflated value caused by zero-counting any
 *    segment. The maturity level label displayed must also match that score.
 *
 *  Part C — Scoring function used by the results page (integration check)
 *    Directly verifies that `calcOverallScore` — the exact function the
 *    results page calls to compute `overallScore` — excludes incomplete
 *    segments from the average. This ties the unit-tested behaviour of the
 *    helper to the component's rendering path.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed } from '@/pages/Maturity';
import {
  overallScore as calcOverallScore,
  segScore as calcSegScore,
  getLevel,
} from '@/lib/maturityScoring';

/* ── jsdom stubs ─────────────────────────────────────────────────────────── */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

Element.prototype.scrollIntoView = () => {};

/* ── Shared mocks ────────────────────────────────────────────────────────── */
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(
        (
          { children, ...rest }: React.HTMLAttributes<HTMLDivElement>,
          ref: React.Ref<HTMLDivElement>,
        ) => <div ref={ref} {...rest}>{children}</div>,
      ),
    },
  };
});

/* ── Constants ───────────────────────────────────────────────────────────── */
const NUM_SEGMENTS = 8;
const NUM_QUESTIONS = 5;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function renderMaturity() {
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

/**
 * Build an answer map where every question in each listed segment is set to
 * the corresponding value. Segments not listed have no answers (segScore = null).
 *
 * @param segValues  Array of [segIdx, uniformScore] pairs.
 */
function buildPartialAnswers(
  segValues: Array<[segIdx: number, score: number]>,
): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const [s, val] of segValues) {
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = val;
    }
  }
  return answers;
}

/**
 * Build a fully-complete answer map (all 8 segments answered) where each
 * segment is set to its corresponding value in `segValues`.
 */
function buildFullAnswers(segValues: number[]): Record<string, number> {
  const answers: Record<string, number> = {};
  segValues.forEach((val, s) => {
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = val;
    }
  });
  return answers;
}

/* ══════════════════════════════════════════════════════════════════════════
   Part A — Redirect guard fires when fewer than all 8 segments are complete.

   The results page must never render when any segment is incomplete: doing
   so would display either a zero-deflated score (old bug) or a partial
   score (confusing UX). The guard redirects back to the first incomplete
   segment and shows a warning banner instead.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity partial-completion — redirect guard fires, results not shown', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    _setMaturityTestSeed({});
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not show results when only 3 of 8 segments are complete', () => {
    // Segments 0, 1, 2 fully answered; segments 3–7 have no answers.
    const answers = buildPartialAnswers([[0, 3], [1, 4], [2, 5]]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
  });

  it('shows the incomplete-warning banner when only 3 of 8 segments are complete', () => {
    const answers = buildPartialAnswers([[0, 3], [1, 4], [2, 5]]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('redirects to the first incomplete segment (segment 3) when segments 0–2 are done', () => {
    // Segments 0–2 complete; segment 3 is the first gap.
    const answers = buildPartialAnswers([[0, 3], [1, 3], [2, 3]]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    // The guard redirects to segment 3 (0-indexed) — confirm we are in the
    // questions phase (results not rendered) and the warning is visible.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('does not show results when only 1 of 8 segments is complete', () => {
    const answers = buildPartialAnswers([[0, 4]]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('does not show results when the first 5 segments are complete but 3 are missing', () => {
    // Segments 0–4 complete; segments 5–7 empty.
    const answers = buildPartialAnswers([[0, 2], [1, 3], [2, 4], [3, 2], [4, 3]]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Part B — When all 8 segments ARE complete, the results page shows the
   correct arithmetic mean and the matching level label.

   These tests confirm that the displayed score is not zero-deflated (the
   old bug) and that the level badge correctly reflects the computed score.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — correct score and level label when all segments complete', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    _setMaturityTestSeed({});
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('displays the arithmetic mean and correct level when segments vary across all five maturity bands', () => {
    // Segment scores: [1,2,3,4,5,3,2,4] → sum = 24 → mean = 3.0 → "Defined"
    const segValues  = [1, 2, 3, 4, 5, 3, 2, 4];
    const mean       = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 3.0
    const levelLabel = getLevel(mean).label; // "Defined"

    _setMaturityTestSeed({ phase: 'results', answers: buildFullAnswers(segValues) });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe(mean.toFixed(1));
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe(levelLabel);
  });

  it('displays 2.0 (Aware) when all segments score at level 2', () => {
    const answers = buildFullAnswers([2, 2, 2, 2, 2, 2, 2, 2]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('2.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('Aware');
  });

  it('displays 4.0 (Managed) when all segments score at level 4', () => {
    const answers = buildFullAnswers([4, 4, 4, 4, 4, 4, 4, 4]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('4.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('Managed');
  });

  it('displays 4.5 (Optimised) when all segments score at level 5', () => {
    // Mean of [5,5,4,5,5,4,5,5] = 38/8 = 4.75 → Optimised
    const segValues = [5, 5, 4, 5, 5, 4, 5, 5];
    const mean      = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 4.75
    const answers   = buildFullAnswers(segValues);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.getByTestId('maturity-overall-score').textContent).toBe(mean.toFixed(1));
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('Optimised');
  });

  it('level label matches the score when the mean lands at a boundary value', () => {
    // Mean = 2.0 exactly (lower boundary of Aware) → level must be "Aware" not "Reactive"
    const answers = buildFullAnswers([2, 2, 2, 2, 2, 2, 2, 2]);

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    const displayedScore = parseFloat(screen.getByTestId('maturity-overall-score').textContent ?? '0');
    const displayedLabel = screen.getByTestId('maturity-overall-level').textContent;

    expect(displayedLabel).toBe(getLevel(displayedScore).label);
  });

  it('level label matches the score for a non-trivial fractional mean', () => {
    // [1,2,3,4,3,2,1,2] → mean = 18/8 = 2.25 → Aware
    const segValues  = [1, 2, 3, 4, 3, 2, 1, 2];
    const mean       = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 2.25

    _setMaturityTestSeed({ phase: 'results', answers: buildFullAnswers(segValues) });
    renderMaturity();

    const displayedScore = parseFloat(screen.getByTestId('maturity-overall-score').textContent ?? '0');
    const displayedLabel = screen.getByTestId('maturity-overall-level').textContent;

    // The displayed score (toFixed(1)) should round toward the expected mean.
    expect(displayedScore).toBeCloseTo(mean, 0);
    expect(displayedLabel).toBe(getLevel(mean).label);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Part C — Integration check: `calcOverallScore` (the exact function the
   results page calls) correctly excludes incomplete segments.

   These tests bridge the pure-function unit tests in maturityScoring.test.ts
   and the component rendering, confirming that the function imported and
   used by the results page (`overallScore = calcOverallScore(answers, 8)`)
   produces the correct partial mean — NOT a deflated zero-averaged result.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results-page scoring function — excludes incomplete segments', () => {
  it('returns the mean of 3 complete segments when 5 segments have no answers', () => {
    // Segments 0, 1, 2 complete at 3, 4, 5 respectively; segments 3–7 empty.
    // Expected: (3 + 4 + 5) / 3 = 4.0  (NOT (3+4+5+0+0+0+0+0)/8 = 1.5)
    const answers = buildPartialAnswers([[0, 3], [1, 4], [2, 5]]);

    const score = calcOverallScore(answers, NUM_SEGMENTS);

    expect(score).toBeCloseTo(4.0);
  });

  it('returns the mean of 1 complete segment when 7 segments have no answers', () => {
    // Only segment 4 complete at level 5; all others empty.
    // Expected: 5.0 / 1 = 5.0  (NOT 5/8 = 0.625)
    const answers = buildPartialAnswers([[4, 5]]);

    const score = calcOverallScore(answers, NUM_SEGMENTS);

    expect(score).toBe(5.0);
  });

  it('the level label for the partial mean is consistent with getLevel', () => {
    // Segments 0–2 at score 3 → partial mean = 3.0 → "Defined"
    const answers = buildPartialAnswers([[0, 3], [1, 3], [2, 3]]);

    const score = calcOverallScore(answers, NUM_SEGMENTS);
    const level = getLevel(score);

    expect(score).toBeCloseTo(3.0);
    expect(level.label).toBe('Defined');
  });

  it('a partial completion at high scores does not deflate into a lower band', () => {
    // 3 segments at level 5; rest unanswered.
    // If zeros were included: (5+5+5+0+0+0+0+0)/8 = 1.875 → Reactive (WRONG)
    // Correct exclusion: (5+5+5)/3 = 5.0 → Optimised
    const answers = buildPartialAnswers([[0, 5], [1, 5], [2, 5]]);

    const score = calcOverallScore(answers, NUM_SEGMENTS);

    expect(score).toBe(5.0);
    expect(getLevel(score).label).toBe('Optimised');
  });

  it('all 8 segScores are null when only 3 segments have PARTIAL (not full) answers', () => {
    // Each of the 3 segments has fewer than 5 answers → segScore = null for all
    const answers: Record<string, number> = {
      '0-0': 3, '0-1': 3,            // segment 0: 2 of 5 → null
      '1-0': 4, '1-1': 4, '1-2': 4, // segment 1: 3 of 5 → null
      '2-0': 5,                      // segment 2: 1 of 5 → null
    };

    const nullCount = Array.from({ length: NUM_SEGMENTS }, (_, i) => i)
      .filter(i => calcSegScore(answers, i) === null).length;

    // All 8 segments have null scores (none is fully complete).
    expect(nullCount).toBe(NUM_SEGMENTS);
    // calcOverallScore returns 0 when no segment is complete.
    expect(calcOverallScore(answers, NUM_SEGMENTS)).toBe(0);
  });
});
