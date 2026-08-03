/**
 * Task 816 — Maturity question cards: FrameworkBadge renders inside each
 * question card, pulling frameworks from the parent segment.
 *
 * The badge is wired as:
 *   <FrameworkBadge
 *     frameworks={question.frameworks ?? seg.frameworks}
 *     lang={ar ? 'ar' : 'en'}
 *   />
 *
 * Because individual Question objects have no `frameworks` field populated
 * in the current data set, the fallback to `seg.frameworks` must fire and
 * surface the segment-level frameworks (e.g. ASCM/SCOR for the strategy
 * segment). This test verifies the end-to-end path from data → render.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { Maturity, _setMaturityTestSeed, _clearMaturityTestSeed } from '@/pages/Maturity';

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

/* ── Helpers ─────────────────────────────────────────────────────────────── */
/** Empty answers — forces the questions phase to show all unanswered questions */
const NO_ANSWERS: Record<string, number> = {};

function renderMaturity(lang: 'en' | 'ar' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <Maturity />
    </LanguageProvider>,
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tests
═══════════════════════════════════════════════════════════════════════════ */

describe('Maturity question cards — FrameworkBadge integration', () => {
  beforeEach(() => {
    _setMaturityTestSeed({ phase: 'questions', answers: NO_ANSWERS });
  });

  afterEach(() => {
    _clearMaturityTestSeed();
    cleanup();
  });

  it('renders at least one framework badge list container on the questions page', () => {
    renderMaturity();
    // seg.frameworks for strategy segment = ['ASCM/SCOR', 'Gartner', 'IBP']
    const badgeLists = screen.getAllByTestId('framework-badge-list');
    expect(badgeLists.length).toBeGreaterThan(0);
  });

  it('shows strategy-segment frameworks (ASCM/SCOR, Gartner, IBP) on question cards', () => {
    renderMaturity();
    // Strategy segment frameworks should appear on each of its question cards
    const ascmBadges = screen.getAllByTestId('framework-badge-ASCM-SCOR');
    expect(ascmBadges.length).toBeGreaterThan(0);

    const gartnerBadges = screen.getAllByTestId('framework-badge-Gartner');
    expect(gartnerBadges.length).toBeGreaterThan(0);

    const ibpBadges = screen.getAllByTestId('framework-badge-IBP');
    expect(ibpBadges.length).toBeGreaterThan(0);
  });

  it('renders the abbreviated framework text inside each badge pill', () => {
    renderMaturity();
    // getAllByText because the same framework appears on every question card
    expect(screen.getAllByText('ASCM/SCOR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gartner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('IBP').length).toBeGreaterThan(0);
  });

  it('renders framework badges in Arabic mode (LanguageProvider set via localStorage)', () => {
    // LanguageProvider reads from localStorage — set it before rendering
    localStorage.setItem('isc-lang', 'ar');
    renderMaturity();

    // Framework badge containers must still be present in Arabic mode
    const badgeLists = screen.getAllByTestId('framework-badge-list');
    expect(badgeLists.length).toBeGreaterThan(0);

    // Strategy-segment framework labels must appear
    expect(screen.getAllByText('ASCM/SCOR').length).toBeGreaterThan(0);

    localStorage.removeItem('isc-lang');
  });
});
