/**
 * Task 507 — Maturity results page: Arabic maturity level label matches score
 *
 * When the LanguageProvider is set to Arabic, the level badge on the results
 * page must display the Arabic label (`labelAr`) corresponding to the
 * computed overall score — not the English label.
 *
 * Covers at least two maturity levels (Aware → مُدرِك and Defined → مُعرَّف)
 * plus boundary and non-trivial fractional cases.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed } from '@/pages/Maturity';
import { getLevel } from '@/lib/maturityScoring';

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
const NUM_SEGMENTS  = 8;
const NUM_QUESTIONS = 5;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Build a fully-complete answer map (all 8 segments answered) where every
 * segment is set to the same uniform score.
 */
function buildUniformAnswers(uniformScore: number): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let s = 0; s < NUM_SEGMENTS; s++) {
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = uniformScore;
    }
  }
  return answers;
}

/**
 * Build a fully-complete answer map from a per-segment value array.
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

/**
 * Render the Maturity page with the LanguageProvider set to Arabic.
 * `localStorage` must be primed before calling so LanguageProvider
 * initialises its state from 'ar'.
 */
function renderMaturityArabic() {
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Arabic level-label rendering on the results page
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — Arabic level label matches score', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Prime LanguageProvider to initialise in Arabic mode.
    localStorage.setItem('isc-lang', 'ar');
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) })) as unknown as typeof fetch,
    );
  });

  afterEach(() => {
    cleanup();
    _setMaturityTestSeed({});
    localStorage.removeItem('isc-lang');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows مُدرِك (Aware) for score 2.0 in Arabic mode', () => {
    // All 8 segments at level 2 → mean = 2.0 → Aware → مُدرِك
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(2) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('2.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('مُدرِك');
  });

  it('shows مُعرَّف (Defined) for score 3.0 in Arabic mode', () => {
    // All 8 segments at level 3 → mean = 3.0 → Defined → مُعرَّف
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(3) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('3.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('مُعرَّف');
  });

  it('shows تفاعلي (Reactive) for score 1.0 in Arabic mode', () => {
    // All 8 segments at level 1 → mean = 1.0 → Reactive → تفاعلي
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(1) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('1.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('تفاعلي');
  });

  it('shows مُدار (Managed) for score 4.0 in Arabic mode', () => {
    // All 8 segments at level 4 → mean = 4.0 → Managed → مُدار
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(4) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('4.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('مُدار');
  });

  it('shows مُحسَّن (Optimised) for score 5.0 in Arabic mode', () => {
    // All 8 segments at level 5 → mean = 5.0 → Optimised → مُحسَّن
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(5) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
    expect(screen.getByTestId('maturity-overall-score').textContent).toBe('5.0');
    expect(screen.getByTestId('maturity-overall-level').textContent).toBe('مُحسَّن');
  });

  it('Arabic label matches getLevel().labelAr for a fractional mean landing in Aware band', () => {
    // [1,2,3,4,3,2,1,2] → mean = 18/8 = 2.25 → Aware → مُدرِك
    const segValues = [1, 2, 3, 4, 3, 2, 1, 2];
    const mean      = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 2.25

    _setMaturityTestSeed({ phase: 'results', answers: buildFullAnswers(segValues) });
    renderMaturityArabic();

    const displayedLabel = screen.getByTestId('maturity-overall-level').textContent;
    expect(displayedLabel).toBe(getLevel(mean).labelAr);
    expect(displayedLabel).toBe('مُدرِك');
  });

  it('Arabic label matches getLevel().labelAr when segments span multiple bands', () => {
    // [1,2,3,4,5,3,2,4] → mean = 24/8 = 3.0 → Defined → مُعرَّف
    const segValues = [1, 2, 3, 4, 5, 3, 2, 4];
    const mean      = segValues.reduce((a, b) => a + b, 0) / NUM_SEGMENTS; // 3.0

    _setMaturityTestSeed({ phase: 'results', answers: buildFullAnswers(segValues) });
    renderMaturityArabic();

    const displayedLabel = screen.getByTestId('maturity-overall-level').textContent;
    expect(displayedLabel).toBe(getLevel(mean).labelAr);
    expect(displayedLabel).toBe('مُعرَّف');
  });

  it('does NOT show the English label when in Arabic mode', () => {
    // Score 2.0 → in Arabic mode must show مُدرِك, not "Aware"
    _setMaturityTestSeed({ phase: 'results', answers: buildUniformAnswers(2) });
    renderMaturityArabic();

    expect(screen.getByTestId('maturity-overall-level').textContent).not.toBe('Aware');
  });
});
