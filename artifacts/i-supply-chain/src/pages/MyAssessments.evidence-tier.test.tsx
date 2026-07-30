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
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { MaturityDetail } from '@/pages/MyAssessments';
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
});
