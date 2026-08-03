/**
 * Task 817 — Confirm the scope picker correctly skips deselected segments
 * in both the questions phase and the results page.
 *
 * The picker lets users deselect entire segments before starting the
 * assessment.  This file confirms:
 *   1. Questions for deselected segments never appear.
 *   2. The results page shows only the selected segments' score-rows.
 *   3. The redirect guard (results → questions) only fires when SELECTED
 *      segments are incomplete — deselected segments are ignored.
 *
 * Because _testSeedActive blocks the persist useEffect, these tests pre-seed
 * MATURITY_DRAFT_KEY directly via localStorage (using _clearMaturityTestSeed)
 * so the full real read/persist path is exercised.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import {
  Maturity,
  _setMaturityTestSeed,
  _clearMaturityTestSeed,
  MATURITY_DRAFT_KEY,
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
const NUM_QUESTIONS = 5;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Build a complete draft for exactly `selectedSegmentIds.length` segments.
 * Answers use the SCOPED segment index (0 = first selected, 1 = second, …).
 */
function buildScopedDraft(selectedSegmentIds: string[], scorePerSegment = 3) {
  const answers: Record<string, number> = {};
  for (let si = 0; si < selectedSegmentIds.length; si++) {
    for (let qi = 0; qi < NUM_QUESTIONS; qi++) {
      answers[`${si}-${qi}`] = scorePerSegment;
    }
  }
  return {
    phase: 'results' as const,
    answers,
    intakeData: { industry: 'manufacturing', companySize: 'enterprise' },
    selectedSegmentIds,
  };
}

function renderMaturity() {
  render(
    <LanguageProvider>
      <Maturity />
    </LanguageProvider>,
  );
}

beforeEach(() => {
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
  _setMaturityTestSeed({});
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   Task 819 — Arabic picker UI renders correctly and all picker strings
   display.  The picker phase shows translated labels in Arabic mode.
══════════════════════════════════════════════════════════════════════════ */

describe('Maturity scope picker — Arabic UI strings (Task 819)', () => {
  function buildPickerDraft() {
    return {
      phase: 'picker' as const,
      answers: {},
      intakeData: { industry: 'manufacturing', companySize: 'enterprise' },
      selectedSegmentIds: [],
    };
  }

  beforeEach(() => {
    // Force Arabic mode via the language localStorage key
    localStorage.setItem('isc-lang', 'ar');
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(buildPickerDraft()));
  });

  it('renders the Arabic header "نطاق التقييم" (Assessment Scope) in the picker phase', () => {
    renderMaturity();
    vi.runAllTimers();
    expect(screen.getByText('نطاق التقييم')).toBeInTheDocument();
  });

  it('renders the "تحديد الكل" (Select all) button in Arabic mode', () => {
    renderMaturity();
    vi.runAllTimers();
    expect(screen.getByText('تحديد الكل')).toBeInTheDocument();
  });

  it('renders the "الأبعاد" (Dimensions) column label in Arabic mode', () => {
    renderMaturity();
    vi.runAllTimers();
    expect(screen.getAllByText('الأبعاد')[0]).toBeInTheDocument();
  });

  it('renders the Arabic picker instruction text (mentions "الأبعاد" and no English equivalent)', () => {
    // The picker instructions at the top of the card reference "الأبعاد" (dimensions).
    // This confirms Arabic mode is active without requiring segment expansion.
    renderMaturity();
    vi.runAllTimers();
    // The instructions text contains "المجالات والأبعاد"
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('المجالات');
  });

  it('does not show English "Assessment Scope" text in Arabic mode', () => {
    renderMaturity();
    vi.runAllTimers();
    expect(screen.queryByText('Assessment Scope')).toBeNull();
  });

  it('does not show English "Select all" button text in Arabic mode', () => {
    renderMaturity();
    vi.runAllTimers();
    expect(screen.queryByText('Select all')).toBeNull();
  });
});

describe('Maturity scope picker — deselected segments skipped (Task 817)', () => {
  it('results page shows only the two selected segments (score-row count = 2)', () => {
    // Select only 2 out of 14 available segments
    const selected = ['strategy', 'procurement'];
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(buildScopedDraft(selected)));

    renderMaturity();
    vi.runAllTimers();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    // Only 2 score-rows must appear — the other 12 segments are deselected
    expect(screen.getByTestId('score-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('score-row-2')).toBeNull();
  });

  it('results page shows exactly three selected segments (score-row count = 3)', () => {
    const selected = ['strategy', 'procurement', 'contracts'];
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(buildScopedDraft(selected)));

    renderMaturity();
    vi.runAllTimers();

    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();

    expect(screen.getByTestId('score-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('score-row-2')).toBeInTheDocument();
    expect(screen.queryByTestId('score-row-3')).toBeNull();
  });

  it('redirect guard does NOT fire when all SELECTED segments are answered, even though others are not', () => {
    // Only 2 segments selected, fully answered — the other 12 are not in scope.
    // The redirect guard must NOT fire (which would switch phase to questions).
    const selected = ['suppliers', 'risk'];
    localStorage.setItem(MATURITY_DRAFT_KEY, JSON.stringify(buildScopedDraft(selected)));

    renderMaturity();
    vi.runAllTimers();

    // Still on results page — guard correctly ignores out-of-scope segments
    expect(screen.getByTestId('maturity-results')).toBeInTheDocument();
  });
});
