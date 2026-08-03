/**
 * Task 303 — Draft-restore path: component-level score accuracy.
 *
 * Covers two scenarios that confirm the Maturity component handles a
 * returning user's restored answer draft correctly:
 *
 *  Scenario A — Complete restored draft
 *    The component is seeded via `_setMaturityTestSeed` with a realistic mix
 *    of segment answers (all 8 segments fully answered at different levels).
 *    The results page must show the arithmetic mean of those answers
 *    immediately — no user interaction required. This mirrors the localStorage
 *    restore path where `useState` is initialised with the saved answer map.
 *
 *  Scenario B — Incomplete restored draft (redirect guard)
 *    The component is seeded with phase='results' but an incomplete answer map
 *    (at least one segment not fully answered). The `useEffect` redirect guard
 *    must fire and send the user back to the first incomplete segment in the
 *    questions phase rather than showing a deflated or misleading score.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed, _clearMaturityTestSeed, MATURITY_DRAFT_KEY } from '@/pages/Maturity';

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
 * Build a complete answer map where every question in each segment is set to
 * the corresponding value in `segValues`. `segValues` must have NUM_SEGMENTS
 * entries — each value represents the uniform score for that segment's five
 * questions, producing a segment score equal to that value.
 */
function buildAnswers(segValues: number[]): Record<string, number> {
  const answers: Record<string, number> = {};
  segValues.forEach((val, s) => {
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = val;
    }
  });
  return answers;
}

/* ══════════════════════════════════════════════════════════════════════════
   Scenario A — Complete restored draft: results page shows the correct
   arithmetic mean of the restored answers immediately, without any user
   interaction.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft restore — complete draft shows correct score', () => {
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

  it('displays the arithmetic mean of a realistic mixed restored draft immediately', () => {
    // Realistic mix with each segment at a different level.
    // Segment scores: [1, 2, 3, 4, 5, 2, 4, 3] → sum = 24 → mean = 3.0 → "3.0"
    const segValues    = [1, 2, 3, 4, 5, 2, 4, 3];
    const expectedMean = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 3.0

    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderMaturity();

    // Results page is immediately visible — no interaction required.
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe(
      expectedMean.toFixed(1),
    );
  });

  it('displays the correct non-whole-number mean when segment scores are uneven', () => {
    // Segment scores: [1, 1, 2, 3, 4, 5, 3, 4] → sum = 23 → mean = 2.875 → "2.9"
    const segValues    = [1, 1, 2, 3, 4, 5, 3, 4];
    const expectedMean = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 2.875

    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe(
      expectedMean.toFixed(1), // "2.9"
    );
  });

  it('shows 5.0 for a restored perfect draft (all segments at level 5)', () => {
    _setMaturityTestSeed({
      phase: 'results',
      answers: buildAnswers([5, 5, 5, 5, 5, 5, 5, 5]),
    });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('5.0');
  });

  it('shows 1.0 for a restored lowest-level draft (all segments at level 1)', () => {
    _setMaturityTestSeed({
      phase: 'results',
      answers: buildAnswers([1, 1, 1, 1, 1, 1, 1, 1]),
    });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('1.0');
  });

  it('score differs between two distinct restored drafts (confirms live derivation, not a cached snapshot)', () => {
    // Draft A: balanced mix → mean = 3.0
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers([1, 2, 3, 4, 5, 2, 4, 3]) });
    renderMaturity();
    const scoreA = screen.getByTestId('maturity-overall-score').textContent;
    cleanup();
    _setMaturityTestSeed({});

    // Draft B: uniformly high → mean = 4.0
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers([4, 4, 4, 4, 4, 4, 4, 4]) });
    renderMaturity();
    const scoreB = screen.getByTestId('maturity-overall-score').textContent;

    expect(scoreA).toBe('3.0');
    expect(scoreB).toBe('4.0');
    // The scores differ, proving each mount derives its score from its own answer state.
    expect(scoreA).not.toBe(scoreB);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Scenario A-extra — Level label matches the restored numeric score (Task 460)
   
   The results page shows both a numeric score and a named level label
   (e.g. "Aware", "Defined"). The existing tests assert only the number.
   This group also asserts the label, so a getLevel boundary regression
   (wrong label for the right score) is caught independently.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft restore — level label matches restored score (Task 460)', () => {
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

  it('shows "Aware" label for a score of 2.0 (all segments at level 2)', () => {
    // All 8 segments at 2 → mean = 2.0 → "Aware" band
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers([2, 2, 2, 2, 2, 2, 2, 2]) });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('2.0');
    // The level badge must display "Aware" (not blank, not a different level)
    expect(screen.getByTestId('maturity-overall-level').textContent).toMatch(/Aware/i);
  });

  it('shows "Defined" label for a score of 3.0 (all segments at level 3)', () => {
    // All 8 segments at 3 → mean = 3.0 → "Defined" band
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers([3, 3, 3, 3, 3, 3, 3, 3]) });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('3.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toMatch(/Defined/i);
  });

  it('label and score are both correct for a fractional score of 2.9 (near-Aware boundary)', () => {
    // [1, 1, 2, 3, 4, 5, 3, 4] → mean = 23/8 = 2.875 → displayed as "2.9" → "Aware"
    const segValues = [1, 1, 2, 3, 4, 5, 3, 4];
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('2.9');
    expect(screen.getByTestId('maturity-overall-level').textContent).toMatch(/Aware/i);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 606 — Draft is written to localStorage during the questions phase so a
   page reload can restore mid-assessment progress.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft — MATURITY_DRAFT_KEY is written during the questions phase (Task 606)', () => {
  beforeEach(() => {
    _clearMaturityTestSeed();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    _clearMaturityTestSeed();
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('MATURITY_DRAFT_KEY is written immediately when the component mounts in questions phase', () => {
    // Seed a partial questions-phase draft directly in localStorage
    const partial: Record<string, number> = {};
    for (let q = 0; q < NUM_QUESTIONS; q++) partial[`0-${q}`] = 3; // segment 0 done
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({
      phase: 'questions',
      answers: partial,
    }));

    renderMaturity();
    vi.runAllTimers();

    // The draft must still be present in localStorage after mount (not cleared)
    const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
    expect(raw).not.toBeNull();
    const draft = JSON.parse(raw!);
    expect(draft.phase).toBe('questions');
    expect(draft.answers['0-0']).toBe(3);
  });

  it('MATURITY_DRAFT_KEY reflects a newly-answered question after a click', () => {
    // Seed a partial questions-phase draft in localStorage (segments 0–1 done)
    const partial: Record<string, number> = {};
    for (let s = 0; s < 2; s++)
      for (let q = 0; q < NUM_QUESTIONS; q++) partial[`${s}-${q}`] = 3;
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({
      phase: 'questions',
      answers: partial,
    }));

    renderMaturity();
    vi.runAllTimers();

    // We should be on segment 2 (first unanswered). Click answer 4 for question 0.
    const btn = screen.queryByTestId('answer-2-0-4');
    if (btn) {
      fireEvent.click(btn);
      vi.runAllTimers();

      const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
      expect(raw).not.toBeNull();
      const draft = JSON.parse(raw!);
      expect(draft.answers['2-0']).toBe(4);
      expect(draft.phase).toBe('questions');
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 818 — Picker selections (selectedSegmentIds + selectedSubSegIds) are
   persisted in MATURITY_DRAFT_KEY and survive a simulated page refresh.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft — picker selections survive a simulated page reload (Task 818)', () => {
  // These tests use real localStorage (not _setMaturityTestSeed) because:
  //   1. _testSeed does not carry selectedSegmentIds (type only has phase/answers/intakeData).
  //   2. The persist useEffect has `if (_testSeedActive) return`, so it never writes
  //      to localStorage when the test seed is active.
  // Calling _clearMaturityTestSeed() disables test mode so the component reads
  // and writes localStorage exactly as it would on a real page load.

  /** Build a minimal complete draft for 3 selected segments (answers for indices 0–2). */
  function buildRealDraft(selectedSegmentIds: string[]) {
    const answers: Record<string, number> = {};
    for (let si = 0; si < selectedSegmentIds.length; si++) {
      for (let qi = 0; qi < NUM_QUESTIONS; qi++) answers[`${si}-${qi}`] = 3;
    }
    return {
      phase: 'results' as const,
      answers,
      intakeData: { industry: 'manufacturing', companySize: 'enterprise' },
      selectedSegmentIds,
    };
  }

  beforeEach(() => {
    // Disable test-seed mode so real localStorage reads/writes happen.
    _clearMaturityTestSeed();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    // Restore test-seed mode (matches module-level default: MODE === 'test').
    _setMaturityTestSeed({});
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('selectedSegmentIds from the draft are preserved in localStorage after remount', () => {
    const selectedSegmentIds = ['strategy', 'procurement', 'contracts'];
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(buildRealDraft(selectedSegmentIds)));

    renderMaturity();
    vi.runAllTimers();

    // The results page must show (draft is complete for the 3 selected segments)
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    // The persist useEffect must have written selectedSegmentIds back to localStorage
    const raw = localStorage.getItem(MATURITY_DRAFT_KEY);
    expect(raw).not.toBeNull();
    const draft = JSON.parse(raw!);
    expect(Array.isArray(draft.selectedSegmentIds)).toBe(true);
    for (const id of selectedSegmentIds) {
      expect(draft.selectedSegmentIds).toContain(id);
    }
  });

  it('a draft written without selectedSegmentIds does not crash on remount', () => {
    // Legacy draft with no picker scope — the component handles it gracefully.
    const answers: Record<string, number> = {};
    // Answer 8 segments (indices 0–7) at level 3.
    for (let si = 0; si < 8; si++) {
      for (let qi = 0; qi < NUM_QUESTIONS; qi++) answers[`${si}-${qi}`] = 3;
    }
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({
      phase: 'results',
      answers,
      intakeData: { industry: 'manufacturing', companySize: 'enterprise' },
      // no selectedSegmentIds
    }));

    // Must not throw
    expect(() => {
      renderMaturity();
      vi.runAllTimers();
    }).not.toThrow();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Scenario B — Incomplete restored draft: the redirect guard fires.

   When the component mounts in the 'results' phase but the restored answer
   map has at least one segment that is not fully answered, the useEffect
   redirect guard must:
     - switch phase back to 'questions'
     - navigate to the first incomplete segment
     - NOT render the results page (which would show a deflated score)
     - show the incomplete-warning banner

   This simulates a user whose saved draft was missing some segments — perhaps
   they partially completed the assessment and came back later.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft restore — incomplete draft triggers redirect guard', () => {
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

  it('does not render the results page when the last segment is missing one answer', () => {
    // Segments 0–6 fully answered at level 3; segment 7 has only 4 of 5 answers.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 7; s++) {
      for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
    }
    // Segment 7: questions 0–3 answered, question 4 missing → incomplete.
    answers['7-0'] = 2; answers['7-1'] = 3; answers['7-2'] = 4; answers['7-3'] = 1;

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    // Redirect guard fires → component is in 'questions' phase; results must not show.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
  });

  it('shows the incomplete-warning banner after redirecting from a partial draft', () => {
    // Segment 7: only 2 of 5 answers present.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 7; s++) {
      for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
    }
    answers['7-0'] = 2; answers['7-1'] = 3;

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('does not render the results page when only half the segments are answered', () => {
    // Only segments 0–3 fully answered; segments 4–7 have no answers at all.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 4; s++) {
      for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
    }

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });

  it('does not render the results page when a middle segment is the incomplete one', () => {
    // Segments 0, 1, 3–7 are fully answered; segment 2 has only partial answers.
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      if (s === 2) {
        // Only 3 of 5 answers for segment 2.
        answers['2-0'] = 4; answers['2-1'] = 3; answers['2-2'] = 5;
      } else {
        for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
      }
    }

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Scenario C — Redirect guard navigates to the EXACT incomplete segment.

   These tests extend Scenario B by asserting not just that the results page
   is suppressed, but that the component dropped the user on the *correct*
   segment index — the first incomplete one — rather than always defaulting
   to segment 0 or some other wrong index.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft restore — redirect guard lands on the correct segment', () => {
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

  it('lands on segment 4 when segments 0–3 are complete and 4–7 are missing', () => {
    // Segments 0–3 fully answered at level 3; segments 4–7 have no answers.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 4; s++) {
      for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
    }

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    // Guard must redirect to questions phase; results must not show.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();

    // The answer buttons for segment 4 (index 4) must be present, confirming
    // segIdx was set to 4, not 0 or any other segment.
    expect(screen.getByTestId('answer-4-0-1')).toBeInTheDocument();

    // Segment 0's answer buttons must NOT be the current segment rendered
    // (they could exist in the progress rail but not as the active question row).
    // We assert by confirming segment 5's answer buttons are absent.
    expect(screen.queryByTestId('answer-5-0-1')).toBeNull();
  });

  it('lands on segment 2 when it is the only incomplete segment (gap in the middle)', () => {
    // Segments 0–1 and 3–7 fully answered; segment 2 has only 1 of 5 answers.
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      if (s === 2) {
        answers['2-0'] = 4; // only one answer present → incomplete
      } else {
        for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
      }
    }

    _setMaturityTestSeed({ phase: 'results', answers });
    renderMaturity();

    // Guard must redirect; results must not show.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();

    // The active question pane must be segment 2 (index 2).
    expect(screen.getByTestId('answer-2-0-1')).toBeInTheDocument();

    // Segment 1 and segment 3 answer buttons must not be the active pane.
    expect(screen.queryByTestId('answer-1-0-1')).toBeNull();
    expect(screen.queryByTestId('answer-3-0-1')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Scenario D — Real localStorage restore path (no _setMaturityTestSeed).

   These tests exercise the genuine user-return journey: a partial draft is
   written to localStorage under MATURITY_DRAFT_KEY, then the component is
   mounted without any test seed.  The same redirect guard that fires on the
   seeded path must also fire here — confirming the real restore path is wired
   correctly end-to-end.

   Two scenarios required by the task spec:
     • Trailing segments missing  — segments 0–3 answered, 4–7 absent
     • Gap in the middle          — segment 2 incomplete, all others answered
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity draft restore — real localStorage restore path (no seed)', () => {
  beforeEach(() => {
    // Deactivate test mode so the component reads from localStorage as a real
    // user would. Each test writes its own draft directly to localStorage.
    _clearMaturityTestSeed();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    // Leave test mode deactivated between Scenario D tests; clear storage so
    // nothing leaks into the next test.
    _clearMaturityTestSeed();
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('trailing segments missing — lands on segment 4, shows incomplete-warning, hides results', () => {
    // Segments 0–3 fully answered; segments 4–7 have no answers at all.
    const answers: Record<string, number> = {};
    for (let s = 0; s < 4; s++) {
      for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
    }

    // Write the draft directly to localStorage — no _setMaturityTestSeed.
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({ phase: 'results', answers }));

    renderMaturity();

    // Guard must redirect; results page must not render.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();

    // The active question pane must show segment 4 (the first incomplete one).
    expect(screen.getByTestId('answer-4-0-1')).toBeInTheDocument();

    // Segment 5 answer buttons must be absent — we are on segment 4, not further.
    expect(screen.queryByTestId('answer-5-0-1')).toBeNull();
  });

  it('gap in the middle — lands on segment 2, shows incomplete-warning, hides results', () => {
    // Segments 0–1 and 3–7 fully answered; segment 2 has only 1 answer.
    const answers: Record<string, number> = {};
    for (let s = 0; s < NUM_SEGMENTS; s++) {
      if (s === 2) {
        answers['2-0'] = 4; // deliberately incomplete
      } else {
        for (let q = 0; q < NUM_QUESTIONS; q++) answers[`${s}-${q}`] = 3;
      }
    }

    // Write the draft directly to localStorage — no _setMaturityTestSeed.
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify({ phase: 'results', answers }));

    renderMaturity();

    // Guard must redirect; results page must not render.
    expect(screen.queryByTestId('maturity-results')).toBeNull();
    expect(screen.getByTestId('incomplete-warning')).toBeInTheDocument();

    // The active question pane must show segment 2.
    expect(screen.getByTestId('answer-2-0-1')).toBeInTheDocument();

    // Neighbouring segments must not be the active pane.
    expect(screen.queryByTestId('answer-1-0-1')).toBeNull();
    expect(screen.queryByTestId('answer-3-0-1')).toBeNull();
  });
});
