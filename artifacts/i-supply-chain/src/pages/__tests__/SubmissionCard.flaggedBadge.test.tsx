/**
 * SubmissionCard — flagged AI-evaluated badge in the segment detail view (Task 867)
 *
 * Task 841 confirmed the flagged ⚠ badge survives an en→ar→en toggle in the
 * MyAssessments list-view. This file confirms the same badge (⚠ overlay +
 * title) also renders in the segment detail drill-down — the table row inside
 * the expanded SubmissionCard — via a separate ConfidenceTierBadge render path.
 *
 * hasFlag(evidence) returns true when any record has
 *   aiEvaluation.plausible_support === false.
 *
 * The badge renders inside the Evidence column of each segment row.
 * Once evidence loads the button shows the badge (pill + ⚠ if flagged), and
 * clicking it opens the EvidenceUploadZone accordion. We verify ⚠ appears
 * in the badge BEFORE the accordion is opened (visible in the table cell).
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 1 }, loading: false }),
}));

const mockLang = { lang: 'en' as 'en' | 'ar' };
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang.lang, ar: mockLang.lang === 'ar' }),
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

/** A submission with the "strategy" segment so the Evidence column renders. */
const SUBMISSION = {
  id: 42,
  tool: 'maturity',
  inputs: { intakeData: { industry: 'Manufacturing', companySize: 'SME' } },
  outputs: {
    overallScore: '3.5',
    overallLevel: 'Defined',
    segmentScores: [
      { id: 'strategy', title: 'Supply Chain Strategy', score: 3.5, level: 'Defined' },
    ],
    // Evidence UI (badge under test) is gated on this field being present —
    // see MyAssessments.tsx's MaturityOutputs comment.
    maturitySnapshotId: 42,
  },
  createdAt: new Date().toISOString(),
};

/**
 * Evidence with a flagged AI evaluation (plausible_support=false → hasFlag=true).
 * segId MUST match the segment id used in SUBMISSION so that
 * `segEv = evidenceList.filter(e => e.segId === s.id)` returns this record.
 */
const FLAGGED_EVIDENCE = [
  {
    id:             'ev-1',
    segId:          'strategy', // must match SUBMISSION.outputs.segmentScores[0].id
    gcsPath:        'tenant-1/maturity/strategy/doc.pdf',
    fileName:       'strategy-evidence.pdf',
    uploadedAt:     new Date().toISOString(),
    confidenceTier: 'ai_evaluated',
    aiEvaluation:   {
      summary:           'Partially relevant.',
      plausible_support: false, // ← triggers hasFlag → shows ⚠
      details:           {},
    },
  },
];

/** Evidence where plausible_support=true → no flag, no ⚠. */
const UNFLAGGED_EVIDENCE = [
  {
    id:             'ev-2',
    segId:          'strategy',
    gcsPath:        'tenant-1/maturity/strategy/doc2.pdf',
    fileName:       'strategy-ok.pdf',
    uploadedAt:     new Date().toISOString(),
    confidenceTier: 'ai_evaluated',
    aiEvaluation:   {
      summary:           'Strong relevance.',
      plausible_support: true,
      details:           {},
    },
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function stubFetchWithEvidence(evidence: object[]) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if ((url as string).includes('/submissions/mine')) {
      return Promise.resolve({
        ok: true, json: async () => ({ ok: true, submissions: [SUBMISSION] }),
      });
    }
    if ((url as string).includes('/maturity/evidence')) {
      return Promise.resolve({
        ok: true, json: async () => ({ ok: true, evidence }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
  }));
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('SubmissionCard — flagged badge in segment detail view (Task 867)', () => {
  it('renders ⚠ in the Evidence column badge when evidence has plausible_support=false', async () => {
    stubFetchWithEvidence(FLAGGED_EVIDENCE);
    render(<MyAssessments />);

    // Wait for the submission to load and evidence badge to appear in the table
    await waitFor(
      () => {
        // ⚠ appears as text inside the badge span with the tooltip title
        const flaggedSpan = document.querySelector('[title="Flagged evidence — review recommended"]');
        expect(flaggedSpan).not.toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('⚠ tooltip also switches to Arabic when language is Arabic', async () => {
    // Switch the mutable language mock to Arabic for this test
    mockLang.lang = 'ar';

    stubFetchWithEvidence(FLAGGED_EVIDENCE);
    render(<MyAssessments />);

    await waitFor(
      () => {
        // Arabic tooltip: 'دليل مُحدَّد يتطلب مراجعة'
        const flaggedSpan = document.querySelector('[title="دليل مُحدَّد يتطلب مراجعة"]');
        expect(flaggedSpan).not.toBeNull();
      },
      { timeout: 3000 },
    );

    // Restore to English for subsequent tests
    mockLang.lang = 'en';
  });

  it('does NOT render ⚠ when evidence has plausible_support=true', async () => {
    stubFetchWithEvidence(UNFLAGGED_EVIDENCE);
    render(<MyAssessments />);

    // Wait for the badge to appear (the ▼ toggle must be present for evidence to have loaded)
    await waitFor(
      () => {
        const btns = Array.from(document.querySelectorAll('button'));
        expect(btns.some(b => b.textContent?.includes('▼'))).toBe(true);
      },
      { timeout: 3000 },
    );

    // No ⚠ flag should be present
    expect(document.querySelector('[title="Flagged evidence — review recommended"]')).toBeNull();
    expect(screen.queryByText('⚠')).toBeNull();
  });
});
