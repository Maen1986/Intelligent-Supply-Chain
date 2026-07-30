/**
 * Evidence tier badge — live-update tests (Task 761)
 *
 * Confirms that the ConfidenceTierBadge shown in the segment table of
 * MaturityDetail updates correctly across three transitions:
 *
 *   1. On mount with existing self_reported evidence → badge shows "Self-reported"
 *   2. After uploading a file (onChanged fires) → badge upgrades to "AI-evaluated"
 *   3. After removing the file (onChanged fires again) → badge reverts; row
 *      shows the "Add" placeholder instead
 *
 * Also tests getSegmentTier() directly for the multi-record best-tier scenario.
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { MaturityDetail } from '@/pages/MyAssessments';
import { getSegmentTier, ConfidenceTierBadge } from '@/components/ConfidenceTierBadge';
import type { EvidenceRecord } from '@/components/EvidenceUploadZone';

/* ── EvidenceUploadZone stub ────────────────────────────────────────────────
   Replaces the full upload widget with a simple button that fires onChanged.
   This lets tests simulate an upload or remove completing without real HTTP
   calls or file-system access.
────────────────────────────────────────────────────────────────────────── */
vi.mock('@/components/EvidenceUploadZone', () => ({
  EvidenceUploadZone: ({ onChanged }: { onChanged: () => void }) => (
    <button data-testid="mock-upload-zone" onClick={onChanged}>
      Upload / Remove
    </button>
  ),
}));

/* ── Navigation / auth stubs ───────────────────────────────────────────── */
vi.mock('wouter', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ['/', vi.fn()],
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, email: 'test@example.com' }, loading: false }),
}));

/* ── Test data ──────────────────────────────────────────────────────────── */
const SNAPSHOT_ID = 42;
const SEG_ID      = 'strategy';   // first CORE_SEGMENT; has STRATEGY_SUB_SEGMENTS with evidence fields

const SELF_REPORTED_EVIDENCE: EvidenceRecord[] = [
  {
    id:               1,
    segId:            SEG_ID,
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'strategy_doc.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'self_reported',
    aiEvaluation:     null,
  },
];

const AI_EVALUATED_EVIDENCE: EvidenceRecord[] = [
  {
    id:               1,
    segId:            SEG_ID,
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'strategy_doc.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation: {
      plausible_support: true,
      confidence:        'high',
      flag_reason:       null,
      summary:           'Document clearly supports the claimed maturity level.',
    },
  },
];

/* ── Fetch mock helpers ─────────────────────────────────────────────────── */
let currentEvidence: EvidenceRecord[] = [];

function stubFetch(evidence: EvidenceRecord[]) {
  currentEvidence = evidence;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      const urlStr = String(url);
      if (urlStr.includes('/maturity/evidence')) {
        return {
          ok:   true,
          json: async () => ({ ok: true, evidence: currentEvidence }),
        } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    }),
  );
}

/* ── Wrapper ────────────────────────────────────────────────────────────── */
function Wrapper() {
  const [expandedEvSeg, setExpandedEvSeg] = useState<Set<string>>(new Set());
  const evScrollPosRef = React.useRef<Record<string, number>>({});
  return (
    <LanguageProvider>
      <MaturityDetail
        inputs={{}}
        outputs={{
          overallScore:   3.5,
          overallLevel:   'Developing',
          segmentScores:  [{ id: SEG_ID, title: 'Strategy', score: 3.5, level: 'Developing' }],
        }}
        ar={false}
        snapshotId={SNAPSHOT_ID}
        lang="en"
        expandedEvSeg={expandedEvSeg}
        setExpandedEvSeg={setExpandedEvSeg}
        evScrollPosRef={evScrollPosRef}
      />
    </LanguageProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */
describe('MaturityDetail — evidence tier badge live updates', () => {
  beforeEach(() => {
    stubFetch(SELF_REPORTED_EVIDENCE);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── 1. Initial mount with self_reported evidence ─────────────────────── */
  it('shows the Self-reported badge on mount when evidence exists', async () => {
    render(<Wrapper />);

    await waitFor(() => {
      expect(screen.getByText('Self-reported')).toBeInTheDocument();
    });
  });

  /* ── 2. Badge upgrades after upload (onChanged → loadEvidence) ─────────── */
  it('upgrades the badge to AI-evaluated after the upload callback fires', async () => {
    render(<Wrapper />);

    // Wait for initial evidence to load
    await waitFor(() => {
      expect(screen.getByText('Self-reported')).toBeInTheDocument();
    });

    // Open the evidence accordion so EvidenceUploadZone instances are mounted
    const accordionButton = screen.getByTitle('Manage evidence');
    fireEvent.click(accordionButton);

    // Update the fetch stub to return ai_evaluated evidence
    stubFetch(AI_EVALUATED_EVIDENCE);

    // Simulate upload completing: clicking any mocked upload zone fires onChanged
    // which calls loadEvidence → re-fetches → updates evidenceList state
    const uploadButton = screen.getAllByTestId('mock-upload-zone')[0];
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    await waitFor(() => {
      expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      expect(screen.queryByText('Self-reported')).not.toBeInTheDocument();
    });
  });

  /* ── 3. Badge reverts after file removal ────────────────────────────────── */
  it('reverts to the Add placeholder after the remove callback fires', async () => {
    render(<Wrapper />);

    // Wait for initial badge
    await waitFor(() => {
      expect(screen.getByText('Self-reported')).toBeInTheDocument();
    });

    // Open accordion
    const accordionButton = screen.getByTitle('Manage evidence');
    fireEvent.click(accordionButton);

    // Update fetch to return empty evidence (simulates successful delete)
    stubFetch([]);

    const uploadButton = screen.getAllByTestId('mock-upload-zone')[0];
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    await waitFor(() => {
      // Badge gone — "Add" placeholder shown instead
      expect(screen.queryByText('Self-reported')).not.toBeInTheDocument();
      expect(screen.queryByText('AI-evaluated')).not.toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  /* ── 4. Zero → first file: badge appears when there was no evidence ──────── */
  it('shows the Self-reported badge after the very first upload when the segment had no evidence', async () => {
    // Override the beforeEach stub: start with no evidence
    stubFetch([]);

    render(<Wrapper />);

    // The evidence cell should show the "Add" placeholder, not any badge
    await waitFor(() => {
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.queryByText('Self-reported')).not.toBeInTheDocument();
      expect(screen.queryByText('AI-evaluated')).not.toBeInTheDocument();
    });

    // Open the evidence accordion so EvidenceUploadZone instances are mounted
    const accordionButton = screen.getByTitle('Manage evidence');
    fireEvent.click(accordionButton);

    // Now update the fetch stub to return one self_reported record
    stubFetch(SELF_REPORTED_EVIDENCE);

    // Simulate the first upload completing
    const uploadButton = screen.getAllByTestId('mock-upload-zone')[0];
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    await waitFor(() => {
      // Badge has appeared; "Add" placeholder is gone
      expect(screen.getByText('Self-reported')).toBeInTheDocument();
      expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   getSegmentTier() — multi-record best-tier unit tests
   Confirms the function picks the highest-ranked tier across all evidence
   records, so a regression in the ranking logic won't be invisible.
══════════════════════════════════════════════════════════════════════════ */
describe('getSegmentTier — best-tier selection across multiple records', () => {
  const selfReported: EvidenceRecord = {
    id:               20,
    segId:            'strategy',
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'doc_a.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'self_reported',
    aiEvaluation:     null,
  };

  const aiEvaluated: EvidenceRecord = {
    id:               21,
    segId:            'strategy',
    subSegId:         'strategy-risk',
    subSegLabel:      'Risk Management',
    originalFilename: 'doc_b.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation: {
      plausible_support: true,
      confidence:        'high',
      flag_reason:       null,
      summary:           'Supports the claimed level.',
    },
  };

  const consultantValidated: EvidenceRecord = {
    id:               22,
    segId:            'strategy',
    subSegId:         'strategy-goals',
    subSegLabel:      'Strategic Goals',
    originalFilename: 'doc_c.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'consultant_validated',
    aiEvaluation:     null,
  };

  it('returns ai_evaluated when one record is self_reported and another is ai_evaluated', () => {
    expect(getSegmentTier([selfReported, aiEvaluated])).toBe('ai_evaluated');
  });

  it('returns ai_evaluated regardless of record order (ai_evaluated first)', () => {
    expect(getSegmentTier([aiEvaluated, selfReported])).toBe('ai_evaluated');
  });

  it('upgrades to consultant_validated when a third record with that tier is added', () => {
    expect(getSegmentTier([selfReported, aiEvaluated, consultantValidated])).toBe('consultant_validated');
  });

  it('returns consultant_validated even when it is the only record present', () => {
    expect(getSegmentTier([consultantValidated])).toBe('consultant_validated');
  });

  it('returns self_reported when ai_evaluated record has plausible_support: false', () => {
    const flaggedAi: EvidenceRecord = {
      ...aiEvaluated,
      id: 4,
      aiEvaluation: {
        plausible_support: false,
        confidence:        'low',
        flag_reason:       'Insufficient detail.',
        summary:           'Does not support the claimed level.',
      },
    };
    expect(getSegmentTier([selfReported, flaggedAi])).toBe('self_reported');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   getSegmentTier() — order-independence / permutation tests (Task 840)

   The function uses Array.some() which short-circuits on the first match.
   These tests verify that the *best* tier always wins regardless of the
   order records arrive from the API.
══════════════════════════════════════════════════════════════════════════ */
describe('getSegmentTier — order-independence: two-record permutations [self_reported, ai_evaluated]', () => {
  const selfReported: EvidenceRecord = {
    id:               20,
    segId:            'strategy',
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'doc_a.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'self_reported',
    aiEvaluation:     null,
  };

  const aiEvaluated: EvidenceRecord = {
    id:               21,
    segId:            'strategy',
    subSegId:         'strategy-risk',
    subSegLabel:      'Risk Management',
    originalFilename: 'doc_b.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation: {
      plausible_support: true,
      confidence:        'high',
      flag_reason:       null,
      summary:           'Supports the claimed level.',
    },
  };

  // Both permutations of [self_reported, ai_evaluated]
  const permutations: Array<[string, EvidenceRecord[]]> = [
    ['[self_reported, ai_evaluated]', [selfReported, aiEvaluated]],
    ['[ai_evaluated, self_reported]', [aiEvaluated, selfReported]],
  ];

  it.each(permutations)(
    'returns ai_evaluated for permutation %s',
    (_label, records) => {
      expect(getSegmentTier(records)).toBe('ai_evaluated');
    },
  );
});

describe('getSegmentTier — order-independence: all six permutations of [self_reported, ai_evaluated, consultant_validated]', () => {
  const selfReported: EvidenceRecord = {
    id:               20,
    segId:            'strategy',
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'doc_a.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'self_reported',
    aiEvaluation:     null,
  };

  const aiEvaluated: EvidenceRecord = {
    id:               21,
    segId:            'strategy',
    subSegId:         'strategy-risk',
    subSegLabel:      'Risk Management',
    originalFilename: 'doc_b.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation: {
      plausible_support: true,
      confidence:        'high',
      flag_reason:       null,
      summary:           'Supports the claimed level.',
    },
  };

  const consultantValidated: EvidenceRecord = {
    id:               22,
    segId:            'strategy',
    subSegId:         'strategy-goals',
    subSegLabel:      'Strategic Goals',
    originalFilename: 'doc_c.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'consultant_validated',
    aiEvaluation:     null,
  };

  // All six permutations of three distinct elements
  const permutations: Array<[string, EvidenceRecord[]]> = [
    ['[self_reported, ai_evaluated, consultant_validated]',   [selfReported, aiEvaluated, consultantValidated]],
    ['[self_reported, consultant_validated, ai_evaluated]',   [selfReported, consultantValidated, aiEvaluated]],
    ['[ai_evaluated, self_reported, consultant_validated]',   [aiEvaluated, selfReported, consultantValidated]],
    ['[ai_evaluated, consultant_validated, self_reported]',   [aiEvaluated, consultantValidated, selfReported]],
    ['[consultant_validated, self_reported, ai_evaluated]',   [consultantValidated, selfReported, aiEvaluated]],
    ['[consultant_validated, ai_evaluated, self_reported]',   [consultantValidated, aiEvaluated, selfReported]],
  ];

  it.each(permutations)(
    'returns consultant_validated for permutation %s',
    (_label, records) => {
      expect(getSegmentTier(records)).toBe('consultant_validated');
    },
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   ConfidenceTierBadge — Arabic label for mixed-tier evidence (Task 839)
   Confirms that when evidence spans two sub-segments (self_reported +
   ai_evaluated), the badge rendered with lang="ar" shows the Arabic
   ai_evaluated label and does NOT show the Arabic self_reported label.
══════════════════════════════════════════════════════════════════════════ */
describe('ConfidenceTierBadge — Arabic label with mixed-tier multi-sub-segment evidence', () => {
  const selfReportedRecord: EvidenceRecord = {
    id:               10,
    segId:            'strategy',
    subSegId:         'strategy-align',
    subSegLabel:      'Strategic Alignment',
    originalFilename: 'doc_a.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'self_reported',
    aiEvaluation:     null,
  };

  const aiEvaluatedRecord: EvidenceRecord = {
    id:               11,
    segId:            'strategy',
    subSegId:         'strategy-risk',
    subSegLabel:      'Risk Management',
    originalFilename: 'doc_b.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation: {
      plausible_support: true,
      confidence:        'high',
      flag_reason:       null,
      summary:           'Supports the claimed level.',
    },
  };

  afterEach(() => {
    cleanup();
  });

  it('shows the Arabic ai_evaluated label when one record is self_reported and another is ai_evaluated', () => {
    const mixedEvidence = [selfReportedRecord, aiEvaluatedRecord];
    render(<ConfidenceTierBadge lang="ar" evidence={mixedEvidence} />);

    // Arabic AI-evaluated label must be present
    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();

    // Arabic self-reported label must be absent — the best tier wins
    expect(screen.queryByText('مُبلَّغ ذاتياً')).not.toBeInTheDocument();
  });

  it('shows the Arabic ai_evaluated label regardless of record order (ai_evaluated first)', () => {
    const mixedEvidence = [aiEvaluatedRecord, selfReportedRecord];
    render(<ConfidenceTierBadge lang="ar" evidence={mixedEvidence} />);

    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
    expect(screen.queryByText('مُبلَّغ ذاتياً')).not.toBeInTheDocument();
  });
});
