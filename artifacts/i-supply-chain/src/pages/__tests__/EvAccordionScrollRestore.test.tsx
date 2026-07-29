/**
 * Evidence accordion — scroll-position restore across card collapse/re-expand
 *
 * Confirms:
 *   1. Opening an evidence panel and scrolling within it, then collapsing the
 *      parent card, then re-expanding it restores the panel's scrollTop.
 *   2. The accordion open/closed state is preserved (existing behaviour, no
 *      regression).
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';

/* ── Module mocks (must be hoisted before any imports of the mocked modules) ── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 }, loading: false }),
}));
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en' }),
}));
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
  useLocation: () => ['/my-assessments', vi.fn()],
}));

/* Mock framer-motion so AnimatePresence renders children immediately */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', { className, style }, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

/* Mock EvidenceUploadZone — we only need it to render a placeholder */
vi.mock('@/components/EvidenceUploadZone', () => ({
  EvidenceUploadZone: ({ subSegId }: { subSegId: string }) =>
    React.createElement('div', { 'data-testid': `ev-zone-${subSegId}` }, 'upload zone'),
}));

vi.mock('@/components/ConfidenceTierBadge', () => ({
  ConfidenceTierBadge: () => React.createElement('span', null, 'tier'),
  getSegmentTier: () => 'basic',
}));

/* Stub ALL_SEGMENTS lookup — inject a segment with one evidence sub-segment */
vi.mock('@/pages/maturityData', () => {
  const icon = () => React.createElement('span', null, '●');
  return {
    CORE_SEGMENTS: [
      {
        id: 'strategy',
        title: 'Strategy',
        titleAr: 'الاستراتيجية',
        shortTitle: 'Strategy',
        shortTitleAr: 'الاستراتيجية',
        icon,
        color: '#0B3D91',
        benchmarks: { gcc: 2.4, global: 2.9, best: 4.6 },
        questions: [],
        recommendations: {},
        recommendationsAr: {},
        subSegments: [
          {
            id: 'ss-strat-1',
            title: 'Strategic planning',
            titleAr: 'التخطيط الاستراتيجي',
            evidence: { hint: 'Upload your strategy doc', hintAr: 'ارفع وثيقة الاستراتيجية' },
          },
          {
            id: 'ss-strat-2',
            title: 'KPI framework',
            titleAr: 'إطار مؤشرات الأداء',
            evidence: { hint: 'Upload KPI dashboard', hintAr: 'ارفع لوحة مؤشرات الأداء' },
          },
        ],
      },
    ],
    INDUSTRY_MODULES: [],
  };
});

/* ── Component under test ─────────────────────────────────────────────────── */
import { SubmissionCard } from '../MyAssessments';

const MATURITY_SUB: Parameters<typeof SubmissionCard>[0]['sub'] = {
  id: 42,
  tool: 'maturity',
  inputs: {},
  outputs: {
    overallScore: 3.2,
    overallLevel: 'Defined',
    segmentScores: [{ id: 'strategy', title: 'Strategy', score: 3.2, level: 'Defined' }],
  },
  createdAt: '2024-06-01T10:00:00Z',
};

/* ── Setup / teardown ─────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, evidence: [] }),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Open the card, wait for evidence to load, then open the evidence accordion */
async function openCardAndAccordion() {
  render(<SubmissionCard sub={MATURITY_SUB} ar={false} />);

  // Expand the card
  fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
  await waitFor(() => expect(screen.getByText(/retake assessment/i)).toBeInTheDocument());

  // Open the evidence accordion for the 'strategy' segment
  const evToggle = screen.getByTitle('Manage evidence');
  fireEvent.click(evToggle);
  await waitFor(() => expect(screen.getByTestId('ev-zone-ss-strat-1')).toBeInTheDocument());
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('Evidence accordion — accordion state survives card collapse', () => {
  it('re-expanding the card shows the evidence panel that was open before collapse', async () => {
    await openCardAndAccordion();

    // Collapse the card
    fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    await waitFor(() => expect(screen.queryByText(/retake assessment/i)).toBeNull());

    // Re-expand
    fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    await waitFor(() => expect(screen.getByTestId('ev-zone-ss-strat-1')).toBeInTheDocument());
  });
});

describe('Evidence accordion — scroll position restored on re-expand', () => {
  it('sets scrollTop on the panel div to the value saved when the card collapsed', async () => {
    await openCardAndAccordion();

    // Locate the scrollable evidence panel div and simulate a scroll
    const panel = screen.getByTestId('ev-zone-ss-strat-1').closest('div.overflow-y-auto') as HTMLDivElement;
    expect(panel).not.toBeNull();
    // Set scrollTop and fire the scroll event so the onScroll handler saves the position
    Object.defineProperty(panel, 'scrollTop', { writable: true, configurable: true, value: 180 });
    fireEvent.scroll(panel);

    // Collapse the card
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    });
    await waitFor(() => expect(screen.queryByText(/retake assessment/i)).toBeNull());

    // Re-expand — the callback ref should restore scrollTop to 180
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    });
    await waitFor(() => expect(screen.getByTestId('ev-zone-ss-strat-1')).toBeInTheDocument());

    const restoredPanel = screen.getByTestId('ev-zone-ss-strat-1').closest('div.overflow-y-auto') as HTMLDivElement;
    expect(restoredPanel.scrollTop).toBe(180);
  });

  it('leaves scrollTop at 0 when the panel was never scrolled', async () => {
    await openCardAndAccordion();

    // Panel scrollTop stays at default (0) — no manual scroll
    const panel = screen.getByTestId('ev-zone-ss-strat-1').closest('div.overflow-y-auto') as HTMLDivElement;
    expect(panel.scrollTop).toBe(0);

    // Collapse then re-expand
    fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    await waitFor(() => expect(screen.queryByText(/retake assessment/i)).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /maturity assessment/i }));
    await waitFor(() => expect(screen.getByTestId('ev-zone-ss-strat-1')).toBeInTheDocument());

    const restoredPanel = screen.getByTestId('ev-zone-ss-strat-1').closest('div.overflow-y-auto') as HTMLDivElement;
    expect(restoredPanel.scrollTop).toBe(0);
  });
});
