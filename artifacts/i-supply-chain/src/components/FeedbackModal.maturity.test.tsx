/**
 * Tests for the feedback-modal session-gate and non-blocking behaviour
 * on the Maturity page.
 *
 * Covers:
 *  - The modal auto-opens once after the Maturity results render
 *    (2500 ms delay), scoped to the 'maturity' session key.
 *  - Dismissing the modal does not remove or obscure the results beneath it.
 *  - A submission failure does not remove or obscure the results beneath it.
 *  - The gate prevents a second auto-open within the same session.
 *
 * NOTE: shouldShowFeedback unit tests and FeedbackModal dismiss unit tests
 * already live in FeedbackModal.session.test.tsx — they are not duplicated here.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed } from '@/pages/Maturity';

/* ── jsdom stubs ───────────────────────────────────────────────────────── */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

// jsdom does not implement scrollIntoView; stub it so scrollUp() doesn't throw.
Element.prototype.scrollIntoView = () => {};

/* ── Shared mocks ─────────────────────────────────────────────────────── */
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

/**
 * Framer-motion uses timer-based animations. With fake timers in test
 * the exit animation never completes, so AnimatePresence never mounts
 * the entering segment. Replace both primitives with transparent wrappers
 * so segment transitions are instant.
 */
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
        <div ref={ref} {...rest}>{children}</div>
      ),
    },
  };
});

/* ── Constants ─────────────────────────────────────────────────────────── */
const NUM_SEGMENTS = 8;
const NUM_QUESTIONS = 5;

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Select level 1 for every question in the current segment. */
function answerCurrentSegment(segIdx: number) {
  for (let qi = 0; qi < NUM_QUESTIONS; qi++) {
    fireEvent.click(screen.getByTestId(`answer-${segIdx}-${qi}-1`));
  }
}

/**
 * Drive the Maturity page from 'intro' through all 8 segments to 'results'.
 * Fake timers must already be active before calling this.
 */
function completeMaturityAssessment() {
  // Start the assessment
  fireEvent.click(screen.getByTestId('button-start-assessment'));

  // Answer all segments and advance
  for (let seg = 0; seg < NUM_SEGMENTS; seg++) {
    answerCurrentSegment(seg);
    fireEvent.click(screen.getByTestId('button-maturity-next'));
  }
  // After the last click, phase becomes 'results' synchronously.
}

function renderMaturity() {
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Maturity page — modal auto-opens once, results remain visible
══════════════════════════════════════════════════════════════════════════ */
describe('Maturity page feedback modal integration', () => {
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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('results render immediately after completing the assessment', () => {
    renderMaturity();
    completeMaturityAssessment();
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
  }, 20_000);

  it('modal does not auto-open before the 2500 ms delay', () => {
    renderMaturity();
    completeMaturityAssessment();

    // Results visible, but modal not yet open
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
  }, 20_000);

  it('modal auto-opens after the 2500 ms delay', async () => {
    renderMaturity();
    completeMaturityAssessment();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
  }, 20_000);

  it('results remain fully visible while the modal is open', async () => {
    renderMaturity();
    completeMaturityAssessment();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    // Both the results section and the modal dismiss button are in the DOM
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
  }, 20_000);

  it('dismissing the modal does not remove or hide the results', async () => {
    renderMaturity();
    completeMaturityAssessment();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    // Results still present
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    // Modal form is gone
    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
  });

  it('modal does not auto-open a second time within the same session', async () => {
    renderMaturity();
    completeMaturityAssessment();

    // Let the modal open, then dismiss it
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });
    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    // Retake the assessment from scratch
    fireEvent.click(screen.getByText(/Retake Assessment/i));
    completeMaturityAssessment();

    // Advance well past the delay — modal must NOT reappear
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Maturity page: incomplete-segment redirect guard
══════════════════════════════════════════════════════════════════════════ */

/**
 * Build an answer map where segments 0..(lastFull) are fully answered at
 * level 1, and optionally one segment has only (partialCount) answers.
 */
function buildAnswers(
  lastFullSeg: number,
  partialSeg?: number,
  partialCount?: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (let seg = 0; seg <= lastFullSeg; seg++) {
    const count = seg === partialSeg ? (partialCount ?? NUM_QUESTIONS) : NUM_QUESTIONS;
    for (let q = 0; q < count; q++) {
      out[`${seg}-${q}`] = 1;
    }
  }
  return out;
}

describe('Maturity page: incomplete-segment redirect guard', () => {
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
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Always clear the test seed so other tests are not affected
    _setMaturityTestSeed({});
  });

  it('redirects to the first incomplete segment and shows a warning when results are entered with partial answers', async () => {
    // Seed: segments 0–6 fully answered, segment 7 unanswered → null segScore for seg 7
    const partialAnswers = buildAnswers(NUM_SEGMENTS - 2, undefined, undefined);
    _setMaturityTestSeed({ phase: 'results', answers: partialAnswers });

    render(
      <LanguageProvider>
        <Maturity />
      </LanguageProvider>,
    );

    // Guard useEffect fires on mount (phase is already 'results'):
    // results must NOT be shown; component should be back on questions phase
    expect(screen.queryByTestId('maturity-results')).toBeNull();

    // Warning banner must be visible
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('redirects to the correct (first) incomplete segment index', async () => {
    // Segments 0–5 fully answered, segment 6 missing one answer, segment 7 fully answered.
    // Guard should redirect to segment 6 (the FIRST incomplete one).
    const answers: Record<string, number> = {
      ...buildAnswers(5), // segs 0–5 fully answered
      // seg 6: only 4 questions answered
      '6-0': 1, '6-1': 1, '6-2': 1, '6-3': 1,
      // seg 7: fully answered
      '7-0': 1, '7-1': 1, '7-2': 1, '7-3': 1, '7-4': 1,
    };
    _setMaturityTestSeed({ phase: 'results', answers });

    render(
      <LanguageProvider>
        <Maturity />
      </LanguageProvider>,
    );

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
    // Progress header should show segment 7 of 8 (segment 6, 0-indexed → "Segment 7 of 8")
    expect(screen.getByText(/Segment 7 of 8/i)).toBeInTheDocument();
  });

  it('does NOT redirect when all segments are complete', () => {
    renderMaturity();
    completeMaturityAssessment();
    // Results should render without the warning
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.queryByTestId('incomplete-warning')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Maturity page: submit failure does not block the results
══════════════════════════════════════════════════════════════════════════ */
describe('Maturity page: submit failure does not block the results', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/feedback')) {
          return { ok: false, status: 500 };
        }
        return { ok: true, status: 201, json: async () => ({}) };
      }) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('results are still visible and the error message is shown after a failed submit', async () => {
    renderMaturity();
    completeMaturityAssessment();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    // Give a star rating and submit
    fireEvent.click(screen.getByTestId('star-3'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    // Error is shown inside the modal
    expect(screen.getByTestId('text-feedback-error')).toBeInTheDocument();
    // Modal did not auto-close
    expect(screen.getByTestId('button-feedback-dismiss')).toBeInTheDocument();
    // The results behind the modal remain in the DOM
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
  });

  it('modal can still be dismissed after a submit failure, leaving results intact', async () => {
    renderMaturity();
    completeMaturityAssessment();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    fireEvent.click(screen.getByTestId('star-3'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('button-feedback-submit'));
    });

    fireEvent.click(screen.getByTestId('button-feedback-dismiss'));

    expect(screen.queryByTestId('button-feedback-dismiss')).toBeNull();
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
  });
});
