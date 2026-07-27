/**
 * Task 146 — Maturity results page: score updates live after answer edits.
 *
 * Covers two scenarios that confirm `overallScore` on the results page is
 * always derived from live React state rather than a stale snapshot:
 *
 *  Part A — Seeded mounts
 *    Two distinct complete answer sets both start the component in the
 *    'results' phase. Each should display the correct arithmetic mean of its
 *    own answers. If the score were cached or snapshotted the values would be
 *    identical; the fact that they differ confirms live derivation.
 *
 *  Part B — Full UI edit flow (no page reload)
 *    The user completes all 8 segments, navigates back to an earlier segment
 *    (using the "Previous" button), changes answers, navigates forward again,
 *    and arrives at the results page. The displayed score must reflect the
 *    edited answers, not the original ones — all within a single mounted
 *    component instance.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed } from '@/pages/Maturity';

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
        ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
          <div ref={ref} {...rest}>{children}</div>,
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
 * Build a complete answer map with every question in every segment set to
 * `defaultLevel`, optionally overriding one specific segment.
 */
function buildAnswers(
  defaultLevel: number,
  override?: { seg: number; level: number },
): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let s = 0; s < NUM_SEGMENTS; s++) {
    const level = override && s === override.seg ? override.level : defaultLevel;
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = level;
    }
  }
  return answers;
}

/** Answer all 5 questions in the CURRENTLY displayed segment at `level`. */
function answerCurrentSegment(segIdx: number, level: number) {
  for (let qi = 0; qi < NUM_QUESTIONS; qi++) {
    fireEvent.click(screen.getByTestId(`answer-${segIdx}-${qi}-${level}`));
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Part A — Seeded mounts: score is derived from the seeded answers, not a
   shared or cached snapshot.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — seeded answers produce correct live score', () => {
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

  it('displays 4.0 when all 8 segments are seeded at level 4', () => {
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(4) });
    renderMaturity();

    // overallScore = mean(4,4,4,4,4,4,4,4) = 4.0 → toFixed(1) = "4.0"
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('4.0');
  });

  it('displays 3.8 when segment 0 is level 2 and segments 1–7 are level 4', () => {
    // overallScore = (2 + 4×7) / 8 = 30/8 = 3.75 → toFixed(1) = "3.8"
    _setMaturityTestSeed({
      phase: 'results',
      answers: buildAnswers(4, { seg: 0, level: 2 }),
    });
    renderMaturity();

    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('3.8');
  });

  it('two different seeded answer sets produce two different displayed scores (live derivation confirmed)', () => {
    // First mount — all level 3
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(3) });
    renderMaturity();
    const scoreA = screen.getByTestId('maturity-overall-score').textContent;
    cleanup();
    _setMaturityTestSeed({});

    // Second mount — all level 5
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(5) });
    renderMaturity();
    const scoreB = screen.getByTestId('maturity-overall-score').textContent;

    // The two scores must differ — if the component used a stale snapshot or
    // cached value they would be the same.
    expect(scoreA).toBe('3.0');
    expect(scoreB).toBe('5.0');
    expect(scoreA).not.toBe(scoreB);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Part B — Full UI edit flow: user edits answers mid-session and the results
   page shows the recalculated score without a page reload.

   Flow:
     1. Start assessment; answer all 8 segments at level 3 (overallScore = 3.0).
     2. Before viewing results, navigate back (Previous ×7) to segment 0.
     3. Change all 5 answers in segment 0 from 3 → 1.
        New segment-0 score = 1.0; segments 1–7 remain 3.0.
        Expected overall = (1 + 3×7) / 8 = 22/8 = 2.75 → displayed "2.8".
     4. Navigate forward (Next ×7) back to segment 7, then click View Results.
     5. Assert the displayed score is "2.8", not the original "3.0".
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — score updates after mid-session answer edit (no page reload)', () => {
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

  it('shows the recalculated score after navigating back, editing answers, and returning to results', () => {
    renderMaturity();

    // ── Step 1: Start and answer all 8 segments at level 3 ──────────────
    fireEvent.click(screen.getByTestId('button-start-assessment'));

    for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
      answerCurrentSegment(seg, 3);
      if (seg < NUM_SEGMENTS - 1) {
        // Advance to next segment (not the last one yet)
        fireEvent.click(screen.getByTestId('button-maturity-next'));
      }
      // On the last segment (seg 7) we intentionally stay to navigate back
    }

    // Sanity: still on questions phase (haven't viewed results yet)
    expect(screen.queryByTestId('maturity-results')).toBeNull();

    // ── Step 2: Navigate back from segment 7 to segment 0 (7 clicks) ────
    // When segIdx > 0, the Back button reads "Previous".
    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    }

    // ── Step 3: Change all 5 answers in segment 0 from 3 → 1 ────────────
    // Clicking a different level replaces the stored answer for that question.
    for (let qi = 0; qi < NUM_QUESTIONS; qi++) {
      fireEvent.click(screen.getByTestId(`answer-0-${qi}-1`));
    }

    // ── Step 4: Navigate forward from segment 0 back to segment 7 ────────
    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      fireEvent.click(screen.getByTestId('button-maturity-next'));
    }

    // ── Step 5: View Results ──────────────────────────────────────────────
    fireEvent.click(screen.getByTestId('button-maturity-next'));

    // ── Step 6: Assert the updated score is shown ─────────────────────────
    // Segment 0: all 1s → score = 1.0
    // Segments 1–7: all 3s → score = 3.0 each
    // overallScore = (1.0 + 3.0×7) / 8 = 22/8 = 2.75 → toFixed(1) = "2.8"
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('2.8');
  });

  it('shows the original score when no answers are changed before viewing results', () => {
    renderMaturity();

    fireEvent.click(screen.getByTestId('button-start-assessment'));

    // Answer all 8 segments at level 3 and advance straight to results
    for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
      answerCurrentSegment(seg, 3);
      fireEvent.click(screen.getByTestId('button-maturity-next'));
    }

    // overallScore = 3.0 → "3.0"
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('3.0');
  });

  it('reflects an answer edit: score differs from the unedited baseline', () => {
    renderMaturity();

    // Complete all 8 segments at level 3
    fireEvent.click(screen.getByTestId('button-start-assessment'));
    for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
      answerCurrentSegment(seg, 3);
      if (seg < NUM_SEGMENTS - 1) {
        fireEvent.click(screen.getByTestId('button-maturity-next'));
      }
    }

    // Navigate back to segment 0
    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    }

    // Edit questions 0 and 1 in segment 0: change from 3 → 5.
    // Changing two questions avoids a floating-point edge case:
    //   one edit  → seg0 = 17/5 = 3.05… → toFixed(1) = "3.0" (rounds down in IEEE 754)
    //   two edits → seg0 = 19/5 = 3.799… → overall = 3.099… → toFixed(1) = "3.1" ✓
    fireEvent.click(screen.getByTestId('answer-0-0-5'));
    fireEvent.click(screen.getByTestId('answer-0-1-5'));

    // Navigate forward to results
    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      fireEvent.click(screen.getByTestId('button-maturity-next'));
    }
    fireEvent.click(screen.getByTestId('button-maturity-next'));

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    const displayedScore = screen.getByTestId('maturity-overall-score').textContent;

    // The score must differ from the unedited baseline of "3.0"
    expect(displayedScore).not.toBe('3.0');
    // seg0 = (5+5+3+3+3)/5 = 19/5 = 3.799…; overall = (3.799… + 3×7)/8 = 3.099… → "3.1"
    expect(displayedScore).toBe('3.1');
  });
});
