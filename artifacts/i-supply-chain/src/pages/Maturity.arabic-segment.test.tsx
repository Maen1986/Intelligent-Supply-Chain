/**
 * Task 594 — Confirm Arabic per-segment level badges on the results page
 * correctly show each segment's Arabic level label.
 *
 * Task 507 verified the overall level badge in Arabic mode. Each result-row
 * segment card (data-testid="score-row-{i}") also renders a per-segment
 * level badge with `{ar ? level.labelAr : level.label}`. A regression in the
 * per-segment path would not be caught by the overall-badge test.
 *
 * This test seeds a fully-answered draft, sets the language to Arabic, renders
 * the results page, and asserts that each segment's score-row contains the
 * correct Arabic level label (from getLevel().labelAr).
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { getLevel } from '@/lib/maturityScoring';
import {
  Maturity,
  _setMaturityTestSeed,
  _clearMaturityTestSeed,
} from '@/pages/Maturity';

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

function buildAnswers(segValues: number[]): Record<string, number> {
  const answers: Record<string, number> = {};
  segValues.forEach((val, s) => {
    for (let q = 0; q < NUM_QUESTIONS; q++) {
      answers[`${s}-${q}`] = val;
    }
  });
  return answers;
}

function renderArabicMaturity() {
  localStorage.setItem('isc-lang', 'ar');
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
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

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — Arabic per-segment level badges (Task 594)', () => {
  it('each segment badge shows the correct Arabic level label for a uniform-score draft', () => {
    // All 8 segments at level 2 → every segment label should be مُدرِك (Aware)
    const segValues = [2, 2, 2, 2, 2, 2, 2, 2];
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderArabicMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    const expectedArabicLabel = getLevel(2).labelAr; // مُدرِك

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const scoreRow = screen.getByTestId(`score-row-${i}`);
      // The badge span is inside score-row; it contains the level label
      expect(within(scoreRow).getByText(expectedArabicLabel)).toBeInTheDocument();
    }
  });

  it('each segment badge shows the correct Arabic label when segments have different scores', () => {
    // Scores: [1,2,3,4,5,2,4,3] → expected labels vary per band
    const segValues = [1, 2, 3, 4, 5, 2, 4, 3];
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderArabicMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const scoreRow = screen.getByTestId(`score-row-${i}`);
      const expectedLabel = getLevel(segValues[i]).labelAr;
      expect(within(scoreRow).getByText(expectedLabel)).toBeInTheDocument();
    }
  });

  it('English labels are never used inside score-row elements when in Arabic mode', () => {
    const segValues = [1, 2, 3, 4, 5, 2, 4, 3];
    _setMaturityTestSeed({ phase: 'results', answers: buildAnswers(segValues) });
    renderArabicMaturity();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    const englishLabels = ['Initial', 'Aware', 'Defined', 'Managed', 'Optimised'];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const scoreRow = screen.getByTestId(`score-row-${i}`);
      for (const label of englishLabels) {
        expect(within(scoreRow).queryByText(label)).toBeNull();
      }
    }
  });
});
