/**
 * Task 764 — MaturityDetail: evidence badge appears on initial mount
 *
 * MaturityDetail fires GET /api/maturity/evidence?snapshot_id= on mount.
 * These tests confirm that:
 *
 *  1. When the fetch returns an ai_evaluated evidence record for a segment,
 *     the ConfidenceTierBadge pill ("AI-evaluated") appears in the Evidence
 *     column for that segment without any user interaction.
 *
 *  2. A segment whose sub-segments are evidence-eligible but have no returned
 *     evidence records shows the "Add" placeholder instead of a badge.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

/* ── Module mocks (must precede the imports they affect) ─────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 }, loading: false }),
}));

/* langMode is mutated per describe block to switch between en/ar */
let langMode: { lang: 'en' | 'ar'; ar: boolean } = { lang: 'en', ar: false };

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => langMode,
}));

vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
  useLocation: () => ['/my-assessments', vi.fn()],
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

/* ── Component under test ────────────────────────────────────────────────── */

import { MyAssessments } from '../MyAssessments';

/* ── Fixtures ────────────────────────────────────────────────────────────── */

/**
 * A maturity submission with two segments:
 *  - "strategy"    — has sub-segments with evidence fields (qualSubs.length > 0)
 *  - "procurement" — also has sub-segments with evidence fields
 *
 * Both segments are evidence-eligible so the Evidence column renders either
 * a ConfidenceTierBadge (when records exist) or an "Add" placeholder.
 */
const TWO_SEGMENT_SUBMISSION = {
  id: 99,
  tool: 'maturity',
  inputs: { intakeData: { industry: 'Manufacturing', companySize: 'SME' } },
  outputs: {
    overallScore: '3.5',
    overallLevel: 'Defined',
    segmentScores: [
      { id: 'strategy',    title: 'Supply Chain Strategy', score: 3.5, level: 'Defined' },
      { id: 'procurement', title: 'Procurement',           score: 2.8, level: 'Aware'   },
    ],
  },
  createdAt: new Date().toISOString(),
};

/**
 * A pre-existing ai_evaluated evidence record for the "strategy" segment.
 * `aiEvaluation.plausible_support: true` is required for getSegmentTier()
 * to return 'ai_evaluated' (and therefore render the "AI-evaluated" badge).
 */
const AI_EVALUATED_EVIDENCE = {
  id: 1,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Supply chain strategy document',
  originalFilename: 'strategy.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'ai_evaluated' as const,
  aiEvaluation: {
    plausible_support: true,
    confidence: 'high' as const,
    flag_reason: null,
    summary: 'Document clearly supports the claimed maturity level.',
  },
};

/* ── Fetch stub ──────────────────────────────────────────────────────────── */

/**
 * Stubs global fetch so that:
 *  - /submissions/mine  → returns the given submission
 *  - /maturity/evidence → returns the given evidence array
 *  - anything else      → generic ok
 */
function stubFetch(evidenceRecords: object[] = [AI_EVALUATED_EVIDENCE]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if ((url as string).includes('/submissions/mine')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, submissions: [TWO_SEGMENT_SUBMISSION] }),
        });
      }
      if ((url as string).includes('/maturity/evidence')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, evidence: evidenceRecords }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }),
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Tests
════════════════════════════════════════════════════════════════════════════ */

describe('MaturityDetail — ConfidenceTierBadge appears on initial mount', () => {
  beforeEach(() => {
    langMode = { lang: 'en', ar: false };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     The "AI-evaluated" badge pill must appear in the Evidence column for
     the strategy segment as soon as the evidence fetch resolves — before
     the user clicks anything.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the AI-evaluated badge for a segment that has a returned ai_evaluated record', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    // The first SubmissionCard is pre-expanded (defaultOpen={i === 0}).
    // Wait for the evidence fetch to resolve and the badge to appear.
    await waitFor(
      () => {
        expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     The badge must be a pill element (rendered with asPill={true}), which
     means it carries rounded-full styling — not just an inline span.
     We verify this by confirming the element with "AI-evaluated" text has
     the rounded-full CSS class applied by ConfidenceTierBadge in pill mode.
  ─────────────────────────────────────────────────────────────────────────── */
  it('renders the badge as a pill (rounded-full class) not a plain inline span', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        const badge = screen.getByText('AI-evaluated');
        expect(badge.className).toContain('rounded-full');
      },
      { timeout: 3000 },
    );
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     Segments with evidence-eligible sub-segments but NO matching evidence
     records in the fetch response must show the "Add" placeholder instead
     of a ConfidenceTierBadge.  Here "procurement" has no returned evidence.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Add placeholder (not a badge) for a segment with no returned evidence', async () => {
    // Return evidence only for "strategy"; "procurement" gets nothing.
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    // Wait until the evidence fetch resolves (strategy badge appears first).
    await waitFor(
      () => expect(screen.getByText('AI-evaluated')).toBeInTheDocument(),
      { timeout: 3000 },
    );

    // At least one "Add" placeholder must be visible (for procurement).
    const addButtons = screen.getAllByText('Add');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  /* ── Test 4 ──────────────────────────────────────────────────────────────
     When the evidence fetch returns an empty array, NO ConfidenceTierBadge
     should appear — every eligible segment shows "Add" instead.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows no badge when the evidence fetch returns an empty array', async () => {
    stubFetch([]); // No evidence records at all

    render(<MyAssessments />);

    // Wait for the submissions to load and the accordion toggle to appear.
    await waitFor(
      () => {
        const btns = Array.from(document.querySelectorAll('button'));
        return expect(btns.some(b => b.textContent?.includes('▼'))).toBe(true);
      },
      { timeout: 3000 },
    );

    // No "AI-evaluated" badge should be present.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    // No "Self-reported" badge either (no evidence of any kind).
    expect(screen.queryByText('Self-reported')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Arabic-mode tests — Task 775
   Confirms the ai_evaluated badge renders its Arabic label in lang="ar" mode
   and that the English label never leaks through.
════════════════════════════════════════════════════════════════════════════ */

describe('MaturityDetail — ConfidenceTierBadge in Arabic mode (lang="ar")', () => {
  beforeEach(() => {
    langMode = { lang: 'ar', ar: true };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Arabic Test 1 ───────────────────────────────────────────────────────
     When the page is rendered in Arabic mode and the evidence fetch returns
     an ai_evaluated record, the Arabic badge label
     "مُقيَّم بالذكاء الاصطناعي" must appear in the Evidence column on mount
     without any user interaction.
  ──────────────────────────────────────────────────────────────────────────── */
  it('shows the Arabic AI-evaluated badge label for a segment with an ai_evaluated record', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  /* ── Arabic Test 2 ───────────────────────────────────────────────────────
     The English label "AI-evaluated" must NOT appear anywhere in the DOM
     when the interface is in Arabic mode — even though the same component
     renders it in English mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('does NOT show the English "AI-evaluated" label when lang is Arabic', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    // Wait until the Arabic badge appears (evidence fetch resolved).
    await waitFor(
      () => expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument(),
      { timeout: 3000 },
    );

    // The English label must be absent.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Arabic Test 3 ───────────────────────────────────────────────────────
     The Arabic badge must also be a pill element (rounded-full styling),
     consistent with the English pill in asPill mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('renders the Arabic badge as a pill (rounded-full class)', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        const badge = screen.getByText('مُقيَّم بالذكاء الاصطناعي');
        expect(badge.className).toContain('rounded-full');
      },
      { timeout: 3000 },
    );
  });
});
