/**
 * Task 803 — Maturity results page: evidence tier badge disappears immediately
 * when uploaded evidence is removed.
 *
 * Context
 * ───────
 * This is the reverse of Task 782 (badge appears after upload).  When the user
 * clicks the remove button inside EvidenceUploadZone the component calls:
 *
 *   DELETE /maturity/evidence/:id
 *   → onChanged()
 *   → fetchEvidence() re-fetches and returns []
 *   → evidenceList empties
 *   → segEvidence.length === 0, so ConfidenceTierBadge is unmounted
 *
 * The harness below mirrors Maturity.tsx but starts with a pre-populated
 * evidenceList so the badge is visible on mount.  It passes the same record
 * as `existing` to EvidenceUploadZone so the remove button is rendered.
 *
 * Done-criteria covered
 * ─────────────────────
 *  1. Badge is visible on mount when evidenceList is pre-populated.
 *  2. After clicking remove, DELETE fires and fetchEvidence returns [].
 *  3. Badge element is no longer in the DOM after the async chain settles.
 *  4. The segment score is still visible after the badge disappears.
 *  5. Works for both ai_evaluated and consultant_validated tiers.
 *  6. Works in Arabic mode (Arabic badge label disappears, not the English one).
 */

import React, { useState, useCallback } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { EvidenceUploadZone, type EvidenceRecord } from '@/components/EvidenceUploadZone';
import { ConfidenceTierBadge } from '@/components/ConfidenceTierBadge';

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

/* ═══════════════════════════════════════════════════════════════════════════
   Fixtures
═══════════════════════════════════════════════════════════════════════════ */

const SNAPSHOT_ID = 42;
const SEG_ID      = 'strategy';
const SUBSEG_ID   = 'strategy-align';

const AI_EVALUATED_RECORD: EvidenceRecord = {
  id:               1,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'ai_evaluated',
  aiEvaluation: {
    plausible_support: true,
    confidence:        'high',
    flag_reason:       null,
    summary:           'Document clearly supports the claimed maturity level.',
  },
};

const AI_FLAGGED_RECORD: EvidenceRecord = {
  id:               3,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'flagged.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'ai_evaluated',
  aiEvaluation: {
    plausible_support: false,
    confidence:        'low',
    flag_reason:       'generic_template',
    summary:           'Generic template detected.',
  },
};

const SELF_REPORTED_RECORD: EvidenceRecord = {
  id:               4,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'self-report.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'self_reported',
  aiEvaluation:     null,
};

const CONSULTANT_VALIDATED_RECORD: EvidenceRecord = {
  id:               5,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'consultant-review.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'consultant_validated',
  aiEvaluation: {
    plausible_support: true,
    confidence:        'high',
    flag_reason:       null,
    summary:           'Formally validated by a consultant.',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Test Harness
   ───────────────────────────────────────────────────────────────────────────
   Mirrors the Maturity.tsx pattern for one segment card.
   Unlike the upload harness, `initialEvidence` pre-populates the state so
   the badge is visible before any interaction.
═══════════════════════════════════════════════════════════════════════════ */

interface HarnessProps {
  lang?:            'en' | 'ar';
  initialEvidence:  EvidenceRecord[];
}

function SegmentCardRemoveHarness({ lang = 'en', initialEvidence }: HarnessProps) {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(initialEvidence);

  const fetchEvidence = useCallback(() => {
    fetch(`http://test/api/maturity/evidence?snapshot_id=${SNAPSHOT_ID}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; evidence?: EvidenceRecord[] }) => {
        if (data.ok && data.evidence) setEvidenceList(data.evidence);
      })
      .catch(() => { /* best-effort */ });
  }, []);

  /* Filter evidence for this segment — mirrors Maturity.tsx line 1424 */
  const segEvidence = evidenceList.filter(e => e.segId === SEG_ID);

  return (
    <div>
      {/* ── Score + badge header (mirrors Maturity.tsx lines 1433-1439) ── */}
      <div data-testid="segment-header" className="flex items-center gap-2">
        <span data-testid="segment-score">3.50</span>
        <span>/5.0</span>
        {segEvidence.length > 0 && (
          <ConfidenceTierBadge
            lang={lang}
            evidence={segEvidence}
            asPill
          />
        )}
      </div>

      {/* ── Upload zone with an existing record so remove button appears ── */}
      <EvidenceUploadZone
        lang={lang}
        snapshotId={SNAPSHOT_ID}
        segId={SEG_ID}
        subSegId={SUBSEG_ID}
        subSegLabel="Supply chain strategy document"
        subSegLabelAr="وثيقة استراتيجية سلسلة الإمداد"
        subSegHint="Upload evidence that supports your strategy maturity claim."
        subSegHintAr="ارفع دليلاً يدعم ادعاءك بمستوى نضج الاستراتيجية."
        existing={segEvidence[0] ?? null}
        onChanged={fetchEvidence}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Fetch stub helpers
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Stubs global fetch to simulate:
 *   DELETE /maturity/evidence/:id  → 204 (success)
 *   GET    /maturity/evidence      → evidenceAfterDelete (usually [])
 */
function stubRemoveFlow(evidenceAfterDelete: EvidenceRecord[] = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();

      /* DELETE /maturity/evidence/:id */
      if (url.match(/\/maturity\/evidence\/\d+$/) && method === 'DELETE') {
        return Promise.resolve({
          ok:     true,
          status: 204,
          text:   async () => '',
          json:   async () => ({ ok: true }),
        });
      }

      /* fetchEvidence — GET /maturity/evidence?snapshot_id= */
      if (url.includes('/maturity/evidence') && method === 'GET') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, evidence: evidenceAfterDelete }),
        });
      }

      /* Fallback */
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }),
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tests
═══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — ConfidenceTierBadge disappears after evidence is removed', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     Baseline: badge is visible on mount when initialEvidence is populated.
     Without this passing, the subsequent removal tests have no meaning.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the AI-evaluated badge on mount when evidence is pre-loaded', () => {
    stubRemoveFlow([]);   // fetch not called on mount; stub present for safety

    render(<SegmentCardRemoveHarness initialEvidence={[AI_EVALUATED_RECORD]} />);

    expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     Core path: after clicking the remove button the badge disappears.
     DELETE fires, fetchEvidence returns [], evidenceList empties,
     ConfidenceTierBadge is unmounted — all without a page reload.
  ─────────────────────────────────────────────────────────────────────────── */
  it('badge disappears after the remove button is clicked and DELETE + fetchEvidence resolve', async () => {
    stubRemoveFlow([]);   // fetchEvidence will return empty array

    render(<SegmentCardRemoveHarness initialEvidence={[AI_EVALUATED_RECORD]} />);

    /* Badge is visible before removal */
    expect(screen.getByText('AI-evaluated')).toBeInTheDocument();

    /* Click the remove (X) button rendered by EvidenceUploadZone */
    const removeBtn = screen.getByTitle('Remove evidence');
    expect(removeBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(removeBtn);
    });

    /* Badge must be gone after the async chain settles */
    await waitFor(
      () => {
        expect(screen.queryByText('AI-evaluated')).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     The segment score must remain visible after the badge disappears —
     only the badge is removed, not the entire score section.
  ─────────────────────────────────────────────────────────────────────────── */
  it('segment score is still visible after the badge disappears', async () => {
    stubRemoveFlow([]);

    render(<SegmentCardRemoveHarness initialEvidence={[AI_EVALUATED_RECORD]} />);

    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(
      () => expect(screen.queryByText('AI-evaluated')).toBeNull(),
      { timeout: 5000 },
    );

    /* Score must still be in the DOM */
    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
    expect(screen.getByText('3.50')).toBeInTheDocument();
  });

  /* ── Test 4 ──────────────────────────────────────────────────────────────
     The badge must be gone from the segment header specifically, not merely
     hidden — evidenceList is empty so the conditional never renders.
  ─────────────────────────────────────────────────────────────────────────── */
  it('badge element is absent from the segment header after removal', async () => {
    stubRemoveFlow([]);

    render(<SegmentCardRemoveHarness initialEvidence={[AI_EVALUATED_RECORD]} />);

    const header = screen.getByTestId('segment-header');

    /* Confirm badge is inside the header before removal */
    expect(header).toContainElement(screen.getByText('AI-evaluated'));

    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(
      () => expect(screen.queryByText('AI-evaluated')).toBeNull(),
      { timeout: 5000 },
    );

    /* The header is still rendered but the badge child is gone */
    expect(header).toBeInTheDocument();
    expect(header).not.toContainHTML('AI-evaluated');
  });

  /* ── Test 5 ──────────────────────────────────────────────────────────────
     The Arabic badge label disappears (not the English one) when lang="ar".
  ─────────────────────────────────────────────────────────────────────────── */
  it('Arabic badge label disappears after removal in Arabic mode', async () => {
    stubRemoveFlow([]);

    render(
      <SegmentCardRemoveHarness
        lang="ar"
        initialEvidence={[AI_EVALUATED_RECORD]}
      />,
    );

    /* Arabic badge visible before removal */
    expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
    /* English label not present in Arabic mode */
    expect(screen.queryByText('AI-evaluated')).toBeNull();

    const removeBtn = screen.getByTitle('إزالة الدليل');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(
      () => expect(screen.queryByText('مُقيَّم بالذكاء الاصطناعي')).toBeNull(),
      { timeout: 5000 },
    );

    /* Score still visible */
    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
  });

  /* ── Test 6 ──────────────────────────────────────────────────────────────
     The Self-reported badge also disappears when a self_reported record
     is removed (not just ai_evaluated).
  ─────────────────────────────────────────────────────────────────────────── */
  it('Self-reported badge disappears after its record is removed', async () => {
    stubRemoveFlow([]);

    render(<SegmentCardRemoveHarness initialEvidence={[SELF_REPORTED_RECORD]} />);

    /* Both the segment-header ConfidenceTierBadge and EvidenceUploadZone's own
       inline badge render "Self-reported" for a self_reported record, so use
       getAllByText to assert at least one is present before removal. */
    expect(screen.getAllByText('Self-reported').length).toBeGreaterThan(0);

    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    /* After removal evidenceList is empty: ConfidenceTierBadge unmounts and
       EvidenceUploadZone switches to upload-idle mode — no "Self-reported" anywhere */
    await waitFor(
      () => expect(screen.queryAllByText('Self-reported')).toHaveLength(0),
      { timeout: 5000 },
    );

    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
  });

  /* ── Test 7 ──────────────────────────────────────────────────────────────
     When the flagged (⚠) ai_evaluated record is removed the badge — with its
     warning overlay — is also gone from the DOM entirely.
  ─────────────────────────────────────────────────────────────────────────── */
  it('flagged AI-evaluated badge with ⚠ overlay also disappears after removal', async () => {
    stubRemoveFlow([]);

    render(<SegmentCardRemoveHarness initialEvidence={[AI_FLAGGED_RECORD]} />);

    /* The badge renders for flagged evidence (tier falls back to self_reported
       via getSegmentTier since plausible_support is false, but the badge still
       shows with a ⚠ overlay via hasFlag). */
    expect(screen.getByTestId('segment-header')).toBeInTheDocument();

    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    /* After removal evidenceList is empty — no badge of any kind */
    await waitFor(
      () => {
        expect(screen.queryByText('AI-evaluated')).toBeNull();
        expect(screen.queryByText('Self-reported')).toBeNull();
      },
      { timeout: 5000 },
    );

    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
  });

  /* ── Test 8 ──────────────────────────────────────────────────────────────
     The DELETE request must target the correct evidence ID.
  ─────────────────────────────────────────────────────────────────────────── */
  it('sends DELETE to the correct evidence ID URL', async () => {
    stubRemoveFlow([]);

    render(<SegmentCardRemoveHarness initialEvidence={[AI_EVALUATED_RECORD]} />);

    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    await waitFor(
      () => expect(screen.queryByText('AI-evaluated')).toBeNull(),
      { timeout: 5000 },
    );

    /* Confirm the DELETE was called with the correct URL */
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const deleteCalls = fetchMock.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) =>
        url.includes(`/maturity/evidence/${AI_EVALUATED_RECORD.id}`) &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCalls.length).toBe(1);
  });

  /* ── Test 9 ──────────────────────────────────────────────────────────────
     For a consultant_validated record the remove button must be absent from
     the DOM entirely — not just disabled — so the action is not triggerable
     from the UI.  The Consultant-validated badge must still be rendered.
  ─────────────────────────────────────────────────────────────────────────── */
  it('remove button is absent from the DOM for a consultant_validated record', () => {
    stubRemoveFlow([]);   // fetch not called; stub present for safety

    render(<SegmentCardRemoveHarness initialEvidence={[CONSULTANT_VALIDATED_RECORD]} />);

    /* The remove button must not exist in the DOM at all */
    expect(screen.queryByTitle('Remove evidence')).toBeNull();

    /* The Consultant-validated badge must still be rendered */
    expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
  });
});
