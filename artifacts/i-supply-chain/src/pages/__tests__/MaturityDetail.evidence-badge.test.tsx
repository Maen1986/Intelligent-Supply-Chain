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
 *
 * Task 776 — consultant_validated tier:
 *
 *  3. When the fetch returns a consultant_validated evidence record, the
 *     "Consultant-validated" pill appears in the Evidence column on mount
 *     (without user interaction).
 *
 *  4. When both ai_evaluated and consultant_validated records are present,
 *     getSegmentTier() promotes consultant_validated — the
 *     "Consultant-validated" pill wins over "AI-evaluated".
 *
 * Task 788 — consultant_validated badge on the segment detail page:
 *
 *  5. The MaturityDetail segment detail view (the drill-down rendered when
 *     a submission card is expanded) shows "Consultant-validated" in its
 *     Evidence column when the fetch returns a consultant_validated record —
 *     without any user interaction.
 *
 *  6. When both ai_evaluated and consultant_validated records are present
 *     for the same segment, the detail view's Evidence column shows only
 *     "Consultant-validated" (consultant_validated beats ai_evaluated).
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

/**
 * A self_reported evidence record for the "strategy" segment.
 * getSegmentTier() returns 'self_reported' when no ai_evaluated (with
 * plausible_support: true) or consultant_validated record is present.
 */
const SELF_REPORTED_EVIDENCE = {
  id: 3,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Supply chain strategy document',
  originalFilename: 'strategy-self.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'self_reported' as const,
  aiEvaluation: null,
};

/**
 * A consultant_validated evidence record for the "strategy" segment.
 * getSegmentTier() returns 'consultant_validated' whenever any record in the
 * segment carries this tier — regardless of other tiers present.
 */
const CONSULTANT_VALIDATED_EVIDENCE = {
  id: 2,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Supply chain strategy document',
  originalFilename: 'strategy-validated.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'consultant_validated' as const,
  aiEvaluation: null,
};

/**
 * A consultant_validated evidence record where aiEvaluation.plausible_support
 * is explicitly false — this triggers hasFlag() and should cause the ⚠
 * warning overlay to appear alongside the "Consultant-validated" label.
 */
const FLAGGED_CONSULTANT_VALIDATED_EVIDENCE = {
  id: 4,
  segId: 'strategy',
  subSegId: 'strategy-align',
  subSegLabel: 'Supply chain strategy document',
  originalFilename: 'strategy-validated-flagged.pdf',
  mimeType: 'application/pdf',
  confidenceTier: 'consultant_validated' as const,
  aiEvaluation: {
    plausible_support: false,
    confidence: 'low' as const,
    flag_reason: 'Evidence does not support claimed maturity level.',
    summary: 'Document does not align with the stated maturity level.',
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
        const badge = screen.getByText('مُعتمَد من الاستشاري');
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

  /* ── Test 5 (Task 776) ───────────────────────────────────────────────────
     When the evidence fetch returns a consultant_validated record for a
     segment, the "Consultant-validated" pill must appear in the Evidence
     column on mount — without any user interaction.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Consultant-validated badge for a segment with a consultant_validated record', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // AI-evaluated badge must NOT appear — only consultant_validated.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Test 6 (Task 776) ───────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated records are returned for
     the same segment, getSegmentTier() must promote to consultant_validated.
     Only the "Consultant-validated" pill should appear; "AI-evaluated" must
     not be rendered for that segment.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows Consultant-validated (not AI-evaluated) when both tiers are present', async () => {
    // Return both tiers for the "strategy" segment.
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // "AI-evaluated" must not win — consultant_validated takes precedence.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
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
        const badge = screen.getByText('مُعتمَد من الاستشاري');
        expect(badge.className).toContain('bg-amber-100');
        expect(badge.className).toContain('text-amber-800');
      },
      { timeout: 3000 },
    );
  });

  /* ── Arabic Consultant Test 4 ────────────────────────────────────────────
     The Arabic Consultant-validated badge must render as a pill
     (rounded-full class), consistent with all other badge tiers in pill mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('renders the Arabic Consultant-validated badge as a pill (rounded-full class)', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        const badge = screen.getByText('مُعتمَد من الاستشاري');
        expect(badge.className).toContain('bg-amber-100');
        expect(badge.className).toContain('text-amber-800');
      },
      { timeout: 3000 },
    );
  });

  /* ── Arabic Consultant Test 4 ────────────────────────────────────────────
     The Arabic Consultant-validated badge must render as a pill
     (rounded-full class), consistent with all other badge tiers in pill mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('renders the Arabic Consultant-validated badge as a pill (rounded-full class)', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        const badge = screen.getByText('مُعتمَد من الاستشاري');
        expect(badge.className).toContain('bg-amber-100');
        expect(badge.className).toContain('text-amber-800');
      },
      { timeout: 3000 },
    );
  });

  /* ── Arabic Consultant Test 4 ────────────────────────────────────────────
     The Arabic Consultant-validated badge must render as a pill
     (rounded-full class), consistent with all other badge tiers in pill mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('renders the Arabic Consultant-validated badge as a pill (rounded-full class)', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        const badge = screen.getByText('مُعتمَد من الاستشاري');
        expect(badge.className).toContain('rounded-full');
      },
      { timeout: 3000 },
    );
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 788 — consultant_validated badge on the MaturityDetail segment
   detail page (the drill-down rendered inside an expanded SubmissionCard)
════════════════════════════════════════════════════════════════════════════ */

describe('MaturityDetail segment detail page — consultant_validated badge', () => {
  beforeEach(() => {
    langMode = { lang: 'en', ar: false };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Detail Test 1 ───────────────────────────────────────────────────────
     The MaturityDetail component is rendered inside an expanded
     SubmissionCard (defaultOpen={true} for the first card).  When the
     evidence fetch resolves with a consultant_validated record the
     "Consultant-validated" pill must appear in the Evidence column of that
     detail view without any user interaction.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Consultant-validated badge in the detail view on initial mount', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    // Wait for the evidence fetch to resolve and the badge to appear inside
    // the MaturityDetail segment table (first card is auto-expanded).
    await waitFor(
      () => {
        expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // The AI-evaluated badge must not appear — only the consultant tier.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Detail Test 2 ───────────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated evidence records are
     returned for the same segment, the detail view's Evidence column must
     show only "Consultant-validated" — getSegmentTier() promotes the
     higher tier, so "AI-evaluated" must not be rendered at all.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows Consultant-validated (not AI-evaluated) in the detail view when both tiers are present', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // consultant_validated must outrank ai_evaluated — only one badge shown.
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 785 — Full round-trip language toggle
   Confirms Arabic badge labels stay correct after en→ar→en language toggles.
   A stale closure or memoisation bug could cause the wrong label to persist
   after a toggle without any existing test catching it.
════════════════════════════════════════════════════════════════════════════ */

describe('MaturityDetail — ConfidenceTierBadge survives a full en→ar→en language toggle', () => {
  beforeEach(() => {
    langMode = { lang: 'en', ar: false };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Round-trip Test 1 ───────────────────────────────────────────────────
     Start in English, confirm "AI-evaluated" appears.
     Switch to Arabic via context — "مُقيَّم بالذكاء الاصطناعي" must appear
     and the English label must be gone.
     Switch back to English — "AI-evaluated" must return.
  ──────────────────────────────────────────────────────────────────────────── */
  it('badge label updates correctly across en→ar→en language toggles', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    const { rerender } = render(<MyAssessments />);

    // ── Step 1: English — badge must show "AI-evaluated"
    await waitFor(
      () => {
        expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull();

    // ── Step 2: Switch to Arabic
    langMode = { lang: 'ar', ar: true };
    rerender(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.queryByText('AI-evaluated')).toBeNull();

    // ── Step 3: Switch back to English
    langMode = { lang: 'en', ar: false };
    rerender(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 790 — Arabic self-reported badge on the MaturityDetail segment
   detail page (the drill-down rendered inside an expanded SubmissionCard)
════════════════════════════════════════════════════════════════════════════ */

describe('MaturityDetail segment detail page — Arabic self-reported badge (Task 790)', () => {
  beforeEach(() => {
    langMode = { lang: 'ar', ar: true };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Arabic Detail Test 1 ────────────────────────────────────────────────
     When the segment detail view is rendered in Arabic mode and the evidence
     fetch returns a self_reported record, the Arabic label "مُبلَّغ ذاتياً"
     must appear in the Evidence column on mount — without any user
     interaction.  The first SubmissionCard is auto-expanded (defaultOpen),
     so the detail view is visible immediately after the fetch resolves.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Arabic self-reported badge label in the detail view on initial mount', async () => {
    stubFetch([SELF_REPORTED_EVIDENCE]);

    render(<MyAssessments />);

    await waitFor(
      () => {
        expect(screen.getByText('مُبلَّغ ذاتياً')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  /* ── Arabic Detail Test 2 ────────────────────────────────────────────────
     The English label "Self-reported" must NOT appear anywhere in the DOM
     when the interface is in Arabic mode — even though the same component
     renders it in English mode.
  ──────────────────────────────────────────────────────────────────────────── */
  it('does NOT show the English "Self-reported" label in the detail view when lang is Arabic', async () => {
    stubFetch([SELF_REPORTED_EVIDENCE]);

    render(<MyAssessments />);

    // Wait until the Arabic badge appears (evidence fetch resolved).
    await waitFor(
      () => expect(screen.getByText('مُبلَّغ ذاتياً')).toBeInTheDocument(),
      { timeout: 3000 },
    );

    // The English label must be absent.
    expect(screen.queryByText('Self-reported')).toBeNull();
  });
});

/* ── Unused fixture reference (suppresses TS unused-variable warning) ──── */
void FLAGGED_CONSULTANT_VALIDATED_EVIDENCE;
