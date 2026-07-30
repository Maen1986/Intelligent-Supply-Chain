/**
 * Task 798 — ConfidenceTierBadge on the Maturity results page
 *
 * ConfidenceTierBadge is rendered in two places inside Maturity.tsx when the
 * results phase is active:
 *
 *   1. The segment score table (~line 1373)
 *      evidenceList.some(e => e.segId === seg.id) → <ConfidenceTierBadge … />
 *
 *   2. The per-segment recommendation cards (~line 1438)
 *      segEvidence.length > 0 → <ConfidenceTierBadge … asPill />
 *
 * Tests in MaturityDetail.evidence-badge.test.tsx only cover the MyAssessments
 * (history) context. This file covers the live Maturity results page so a
 * regression there would be caught independently.
 *
 * Evidence loading chain (non-test mode):
 *   phase → 'results' + user present
 *     → POST /maturity/snapshots → { ok: true, id: 42 }
 *     → setCurrentSnapshotId(42)
 *     → fetchEvidence() → GET /maturity/evidence?snapshot_id=42
 *     → setEvidenceList([…])
 *     → ConfidenceTierBadge rendered
 *
 * Because fetchEvidence() is guarded by `_testSeedActive`, these tests call
 * `_clearMaturityTestSeed()` to disable test mode and drive the component via
 * a pre-seeded localStorage draft instead of the module-level seed.
 *
 * Done-criteria
 * ─────────────
 *  1. "Consultant-validated" appears in the segment score table on mount when
 *     the evidence fetch returns a consultant_validated record for a segment.
 *  2. consultant_validated beats ai_evaluated when both records are present.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';

/* ── Module mocks (must precede the imports they affect) ─────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('wouter', () => ({
  Link:      ({ href, children }: { href: string; children: React.ReactNode }) =>
               <a href={href}>{children}</a>,
  useSearch: () => '',
  useLocation: () => ['/maturity', vi.fn()],
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

/* langMode is mutated per describe block to switch between en/ar */
let langMode: { lang: 'en' | 'ar'; ar: boolean } = { lang: 'en', ar: false };

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({
    ...langMode,
    /** Minimal t() stub — returns the key so assertions don't break */
    t: (key: string) => key,
  }),
}));

/* ── Component under test ────────────────────────────────────────────────── */

import {
  Maturity,
  MATURITY_DRAFT_KEY,
  _setMaturityTestSeed,
  _clearMaturityTestSeed,
} from '@/pages/Maturity';

/* ── jsdom stubs ─────────────────────────────────────────────────────────── */

class ResizeObserverStub {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

Element.prototype.scrollIntoView = () => {};

/* ── Fixtures ────────────────────────────────────────────────────────────── */

/**
 * Complete answer map for 12 core segments × 5 questions, all set to 3 (Defined).
 * CORE_SEGMENTS has 12 entries; every question must be answered or the guard
 * useEffect redirects back to the questions phase before the results table renders.
 * (The 8-segment cap only applies when _testSeedActive is true, which it is not
 * in these tests.)
 */
function buildCompleteAnswers(): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let s = 0; s < 12; s++) {
    for (let q = 0; q < 5; q++) {
      answers[`${s}-${q}`] = 3;
    }
  }
  return answers;
}

/**
 * The first CORE_SEGMENT ID in maturityData.tsx is 'strategy'.
 * We attach evidence to this segment so the badge appears in its row.
 */
const SEG_ID     = 'strategy';
const SUBSEG_ID  = 'strategy-align';
const SNAPSHOT_ID = 42;

const CONSULTANT_VALIDATED_EVIDENCE = {
  id:               1,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy-validated.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'consultant_validated' as const,
  aiEvaluation:     null,
};

const AI_EVALUATED_EVIDENCE = {
  id:               2,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy-ai.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'ai_evaluated' as const,
  aiEvaluation: {
    plausible_support: true,
    confidence:        'high' as const,
    flag_reason:       null,
    summary:           'Document supports the maturity claim.',
  },
};

const SELF_REPORTED_EVIDENCE = {
  id:               3,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy-self.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'self_reported' as const,
  aiEvaluation:     null,
};

/* ── Auth mock helpers ───────────────────────────────────────────────────── */

let authUser: object | null = null;

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: authUser, loading: false }),
}));

/* ── Fetch stub ──────────────────────────────────────────────────────────── */

/**
 * Stubs global fetch so that:
 *  - POST /maturity/snapshots → { ok: true, id: SNAPSHOT_ID }
 *  - GET  /maturity/snapshots → { ok: true, snapshots: [] }
 *  - GET  /maturity/evidence  → { ok: true, evidence: evidenceRecords }
 *  - anything else            → generic ok
 */
function stubFetch(evidenceRecords: object[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = opts?.method?.toUpperCase() ?? 'GET';

      if ((url as string).includes('/maturity/snapshots') && method === 'POST') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, id: SNAPSHOT_ID }),
        });
      }
      if ((url as string).includes('/maturity/snapshots') && method === 'GET') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, snapshots: [] }),
        });
      }
      if ((url as string).includes('/maturity/evidence')) {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, evidence: evidenceRecords }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }),
  );
}

/* ── Shared setup/teardown ───────────────────────────────────────────────── */

/**
 * Seed localStorage with a complete 'results' draft and disable test mode
 * so the component drives state from localStorage rather than the module seed.
 * This is the only way to allow fetchEvidence() to execute — the function is
 * guarded by `_testSeedActive` and exits early when test mode is on.
 */
function prepareDraft() {
  localStorage.setItem(
    MATURITY_DRAFT_KEY,
    JSON.stringify({
      phase:      'results',
      answers:    buildCompleteAnswers(),
      intakeData: { industry: '', companySize: '' },
    }),
  );
  _clearMaturityTestSeed();
}

/* ════════════════════════════════════════════════════════════════════════════
   Tests
════════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — ConfidenceTierBadge in segment score table', () => {
  beforeEach(() => {
    langMode  = { lang: 'en', ar: false };
    authUser  = { id: 1, fullName: 'Test User', email: 'test@example.com' };
    prepareDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    /* Restore test mode so other test files in the suite are unaffected */
    _setMaturityTestSeed({});
    cleanup();
  });

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     The segment score table renders a ConfidenceTierBadge when evidenceList
     contains a record for that segment. The badge text must be
     "Consultant-validated" on mount — no user interaction required.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "Consultant-validated" in the segment score table on initial mount', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    /*
     * The badge appears in two places on the results page:
     *  1. The segment score table (~line 1373)
     *  2. The per-segment recommendation card (~line 1438)
     * getAllByText succeeds as long as at least one instance is present.
     */
    await waitFor(
      () => {
        const badges = screen.getAllByText('Consultant-validated');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* No lower tier should leak through */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    expect(screen.queryByText('Self-reported')).toBeNull();
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated evidence records are
     returned for the same segment, getSegmentTier() must promote to
     consultant_validated. Only "Consultant-validated" should be rendered.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "Consultant-validated" (not "AI-evaluated") when both tiers are present', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    await waitFor(
      () => {
        const badges = screen.getAllByText('Consultant-validated');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* consultant_validated must outrank ai_evaluated */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 814 — ConfidenceTierBadge inside the per-segment recommendation cards
   ════════════════════════════════════════════════════════════════════════════
   The Maturity results page renders ConfidenceTierBadge in two distinct places:
     1. The segment score table (~line 1731 in Maturity.tsx)
     2. The per-segment recommendation card header (~line 1796 in Maturity.tsx),
        inside the div with data-testid="score-row-{i}"
   These tests scope queries to data-testid="score-row-0" (the first segment,
   'strategy') so a regression that removes the badge only from the cards is
   detected independently of the score-table render.
════════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — ConfidenceTierBadge in per-segment recommendation cards', () => {
  beforeEach(() => {
    langMode = { lang: 'en', ar: false };
    authUser = { id: 1, fullName: 'Test User', email: 'test@example.com' };
    prepareDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    _setMaturityTestSeed({});
    cleanup();
  });

  /* ── Test 1 ────────────────────────────────────────────────────────────────
     The recommendation card for the first segment renders a ConfidenceTierBadge
     when that segment has evidence. The badge must be found *inside*
     data-testid="score-row-0", not just somewhere on the page.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the badge inside the recommendation card (score-row-0) for a consultant_validated segment', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    /* Wait for the card container to appear */
    const scoreRow = await waitFor(
      () => screen.getByTestId('score-row-0'),
      { timeout: 4000 },
    );

    /* Badge must be inside the card, not just somewhere on the page */
    await waitFor(
      () => {
        const badge = within(scoreRow).getByText('Consultant-validated');
        expect(badge).toBeTruthy();
      },
      { timeout: 4000 },
    );
  });

  /* ── Test 2 ────────────────────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated records are present,
     the recommendation card must show only "Consultant-validated".
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "Consultant-validated" in the card when both tiers are present for the segment', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    const scoreRow = await waitFor(
      () => screen.getByTestId('score-row-0'),
      { timeout: 4000 },
    );

    await waitFor(
      () => {
        expect(within(scoreRow).getByText('Consultant-validated')).toBeTruthy();
      },
      { timeout: 4000 },
    );

    /* Lower tier must not appear inside the card */
    expect(within(scoreRow).queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Test 3 ────────────────────────────────────────────────────────────────
     When a segment has no evidence at all, no ConfidenceTierBadge should
     appear in its recommendation card.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows no badge in the recommendation card when the segment has no evidence', async () => {
    /* Fetch returns evidence for a different segment — not 'strategy' */
    stubFetch([{ ...CONSULTANT_VALIDATED_EVIDENCE, segId: 'sourcing' }]);

    render(<Maturity />);

    const scoreRow = await waitFor(
      () => screen.getByTestId('score-row-0'),
      { timeout: 4000 },
    );

    /* Give any async state time to settle */
    await waitFor(
      () => expect(screen.getByTestId('score-row-0')).toBeTruthy(),
      { timeout: 4000 },
    );

    expect(within(scoreRow).queryByText('Consultant-validated')).toBeNull();
    expect(within(scoreRow).queryByText('AI-evaluated')).toBeNull();
    expect(within(scoreRow).queryByText('Self-reported')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 813 — Arabic-mode tests
   Confirms the Arabic badge label "مُعتمَد من الاستشاري" appears on the
   Maturity results page (not just history) when lang="ar" is active.
════════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — ConfidenceTierBadge in Arabic mode', () => {
  beforeEach(() => {
    langMode  = { lang: 'ar', ar: true };
    authUser  = { id: 1, fullName: 'Test User', email: 'test@example.com' };
    prepareDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    _setMaturityTestSeed({});
    cleanup();
  });

  /* ── Arabic Test 1 ───────────────────────────────────────────────────────
     When lang="ar", the badge must show the Arabic label
     "مُعتمَد من الاستشاري" for a consultant_validated evidence record.
     The English label "Consultant-validated" must NOT appear.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Arabic label "مُعتمَد من الاستشاري" on mount in Arabic mode', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    await waitFor(
      () => {
        const badges = screen.getAllByText('مُعتمَد من الاستشاري');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* English label must not appear when Arabic mode is active */
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });

  /* ── Arabic Test 2 ───────────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated evidence records are
     present, the Arabic label for the winning tier (consultant_validated)
     is shown and the AI-evaluated Arabic label is not rendered.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُعتمَد من الاستشاري" (not the AI Arabic label) when both tiers are present', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    await waitFor(
      () => {
        const badges = screen.getAllByText('مُعتمَد من الاستشاري');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* Lower-tier Arabic label must not bleed through */
    expect(screen.queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull();
    /* English labels must not appear in Arabic mode */
    expect(screen.queryByText('Consultant-validated')).toBeNull();
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Arabic Test 3 ───────────────────────────────────────────────────────
     Task 825 — self_reported tier in Arabic mode.
     When lang="ar" and the evidence is self_reported, the badge must show
     "مُبلَّغ ذاتياً" and the English label "Self-reported" must not appear.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُبلَّغ ذاتياً" for a self_reported evidence record in Arabic mode', async () => {
    stubFetch([SELF_REPORTED_EVIDENCE]);

    render(<Maturity />);

    await waitFor(
      () => {
        const badges = screen.getAllByText('مُبلَّغ ذاتياً');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* English label must not appear in Arabic mode */
    expect(screen.queryByText('Self-reported')).toBeNull();
    /* Higher-tier labels must not appear */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    expect(screen.queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull();
  });

  /* ── Arabic Test 4 ───────────────────────────────────────────────────────
     Task 825 — ai_evaluated tier in Arabic mode.
     When lang="ar" and the evidence is ai_evaluated with plausible_support:true,
     the badge must show "مُقيَّم بالذكاء الاصطناعي" and the English label
     "AI-evaluated" must not appear.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُقيَّم بالذكاء الاصطناعي" for an ai_evaluated evidence record in Arabic mode', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE]);

    render(<Maturity />);

    await waitFor(
      () => {
        const badges = screen.getAllByText('مُقيَّم بالذكاء الاصطناعي');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 4000 },
    );

    /* English label must not appear in Arabic mode */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
    /* Other English labels must not appear */
    expect(screen.queryByText('Self-reported')).toBeNull();
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 827 — Arabic-mode tests scoped to the per-segment recommendation card
   Confirms that the Arabic badge label "مُعتمَد من الاستشاري" appears *inside*
   data-testid="score-row-0" when lang="ar" is active, and that lower-tier
   Arabic labels are absent when a higher tier is present.
════════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — ConfidenceTierBadge in recommendation card (Arabic mode)', () => {
  beforeEach(() => {
    langMode  = { lang: 'ar', ar: true };
    authUser  = { id: 1, fullName: 'Test User', email: 'test@example.com' };
    prepareDraft();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    _setMaturityTestSeed({});
    cleanup();
  });

  /* ── Arabic Card Test 1 ─────────────────────────────────────────────────
     The recommendation card for the first segment ("strategy") must render
     the Arabic consultant-validated label inside data-testid="score-row-0"
     when the evidence fetch returns a consultant_validated record.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Arabic label "مُعتمَد من الاستشاري" inside the recommendation card (score-row-0)', async () => {
    stubFetch([CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    /* Wait for the card container to appear */
    const scoreRow = await waitFor(
      () => screen.getByTestId('score-row-0'),
      { timeout: 4000 },
    );

    /* Arabic badge must be inside the card, not just somewhere on the page */
    await waitFor(
      () => {
        const badge = within(scoreRow).getByText('مُعتمَد من الاستشاري');
        expect(badge).toBeTruthy();
      },
      { timeout: 4000 },
    );

    /* English label must not appear when Arabic mode is active */
    expect(within(scoreRow).queryByText('Consultant-validated')).toBeNull();
  });

  /* ── Arabic Card Test 2 ─────────────────────────────────────────────────
     When both ai_evaluated and consultant_validated records are present,
     only the Arabic consultant-validated label should appear inside the
     recommendation card — the lower-tier Arabic label must be absent.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows "مُعتمَد من الاستشاري" (not the AI Arabic label) inside the card when both tiers are present', async () => {
    stubFetch([AI_EVALUATED_EVIDENCE, CONSULTANT_VALIDATED_EVIDENCE]);

    render(<Maturity />);

    const scoreRow = await waitFor(
      () => screen.getByTestId('score-row-0'),
      { timeout: 4000 },
    );

    await waitFor(
      () => {
        expect(within(scoreRow).getByText('مُعتمَد من الاستشاري')).toBeTruthy();
      },
      { timeout: 4000 },
    );

    /* Lower-tier Arabic label must not appear inside the card */
    expect(within(scoreRow).queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull();
    /* English labels must not appear in Arabic mode */
    expect(within(scoreRow).queryByText('Consultant-validated')).toBeNull();
    expect(within(scoreRow).queryByText('AI-evaluated')).toBeNull();
  });
});
