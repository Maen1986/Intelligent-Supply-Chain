/**
 * Task 782 — Maturity results page: evidence tier badge appears next to the
 * segment score immediately after an upload completes.
 *
 * Context
 * ───────
 * In Maturity.tsx the segment card header (lines ~1418–1439) renders a
 * ConfidenceTierBadge pill next to the score whenever the segment has at
 * least one evidence record:
 *
 *   const segEvidence = evidenceList.filter(e => e.segId === seg.id);
 *   …
 *   {segEvidence.length > 0 && (
 *     <ConfidenceTierBadge lang={lang} evidence={segEvidence} asPill />
 *   )}
 *
 * The `evidenceList` state is populated by `fetchEvidence()`, which is
 * called as the `onChanged` callback of every `EvidenceUploadZone`.
 *
 * Because `_testSeedActive` is always `true` in the test environment
 * (guarded by `import.meta.env.MODE === 'test'`) the guard inside
 * `fetchEvidence` (`if (… _testSeedActive) return`) prevents the full
 * `Maturity` component from exercising this path directly. The tests below
 * reproduce the exact same data-flow in a minimal harness that:
 *
 *  • holds `evidenceList` state (mirrors Maturity.tsx line 173)
 *  • calls `fetchEvidence()` on upload completion (onChanged → fetchEvidence)
 *  • renders `ConfidenceTierBadge` when evidence exists (mirrors lines 1437-1439)
 *  • uses the real `EvidenceUploadZone` component so the upload path is not faked
 *
 * Done-criteria covered
 * ─────────────────────
 *  1. After the upload callback fires the badge is visible next to the score.
 *  2. The badge tier matches the uploaded evidence's `confidenceTier` field
 *     (ai_evaluated → "AI-evaluated"; consultant_validated → "Consultant-validated").
 *  3. Before upload (empty evidenceList) no badge is rendered.
 */

import React, { useState, useCallback } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

const CONSULTANT_VALIDATED_RECORD: EvidenceRecord = {
  id:               2,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy-validated.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'consultant_validated',
  aiEvaluation:     null,
};

/* A minimal PDF that passes the `file.type` and `file.size` guards in
   EvidenceUploadZone without needing a real file on disk.              */
function makePdf(name = 'evidence.pdf'): File {
  return new File(['%PDF-1.4 stub'], name, { type: 'application/pdf' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Test Harness
   ───────────────────────────────────────────────────────────────────────────
   Mirrors the Maturity.tsx pattern for one segment card:
     • evidenceList state (starts empty)
     • fetchEvidence() — calls GET /maturity/evidence and updates state
     • renders score + ConfidenceTierBadge pill when evidence exists
     • renders EvidenceUploadZone with onChanged={fetchEvidence}
═══════════════════════════════════════════════════════════════════════════ */

interface HarnessProps {
  lang?: 'en' | 'ar';
}

function SegmentCardHarness({ lang = 'en' }: HarnessProps) {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);

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

      {/* ── Upload zone (mirrors Maturity.tsx lines 1526-1538) ─────────── */}
      <EvidenceUploadZone
        lang={lang}
        snapshotId={SNAPSHOT_ID}
        segId={SEG_ID}
        subSegId={SUBSEG_ID}
        subSegLabel="Supply chain strategy document"
        subSegLabelAr="وثيقة استراتيجية سلسلة الإمداد"
        subSegHint="Upload evidence that supports your strategy maturity claim."
        subSegHintAr="ارفع دليلاً يدعم ادعاءك بمستوى نضج الاستراتيجية."
        existing={null}
        onChanged={fetchEvidence}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Fetch stub helpers
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Stubs global fetch to simulate the three-step upload flow in
 * EvidenceUploadZone.handleFile, followed by a GET evidence response that
 * returns `evidenceToReturn` so fetchEvidence() can update evidenceList.
 */
function stubUploadFlow(evidenceToReturn: EvidenceRecord[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();

      /* Step 1 — POST /maturity/evidence/upload-url */
      if (url.includes('/maturity/evidence/upload-url') && method === 'POST') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({
            ok:          true,
            evidence_id: 1,
            upload_url:  'https://storage.test/upload',
          }),
        });
      }

      /* Step 2 — PUT to presigned GCS URL */
      if (url.startsWith('https://storage.test/') && method === 'PUT') {
        return Promise.resolve({ ok: true });
      }

      /* Step 3 — POST /maturity/evidence/:id/confirm */
      if (url.includes('/maturity/evidence/') && url.includes('/confirm') && method === 'POST') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({
            ok:               true,
            confidence_tier:  evidenceToReturn[0]?.confidenceTier ?? 'ai_evaluated',
          }),
        });
      }

      /* fetchEvidence — GET /maturity/evidence?snapshot_id= */
      if (url.includes('/maturity/evidence') && method === 'GET') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, evidence: evidenceToReturn }),
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

describe('Maturity results page — ConfidenceTierBadge appears after upload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Test 1 ──────────────────────────────────────────────────────────────
     Before any upload the badge must be absent — evidenceList is empty so
     `segEvidence.length > 0` is false and the badge is not rendered.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows no badge before upload (evidenceList is empty)', () => {
    stubUploadFlow([]);

    render(<SegmentCardHarness />);

    expect(screen.queryByText('AI-evaluated')).toBeNull();
    expect(screen.queryByText('Consultant-validated')).toBeNull();
    expect(screen.queryByText('Self-reported')).toBeNull();

    /* Score is always visible */
    expect(screen.getByTestId('segment-score')).toBeInTheDocument();
  });

  /* ── Test 2 ──────────────────────────────────────────────────────────────
     After a successful upload of an ai_evaluated document the
     "AI-evaluated" badge pill must appear next to the score without a page
     reload. The onChanged callback triggers fetchEvidence(), which updates
     evidenceList, which makes ConfidenceTierBadge render.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the AI-evaluated badge immediately after upload completes', async () => {
    stubUploadFlow([AI_EVALUATED_RECORD]);

    render(<SegmentCardHarness />);

    /* No badge before upload */
    expect(screen.queryByText('AI-evaluated')).toBeNull();

    /* Simulate user choosing a file via the hidden <input> */
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf()] } });
    });

    /* Wait for the full async upload → confirm → fetchEvidence chain */
    await waitFor(
      () => {
        expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    /* Badge must be next to the score in the same header */
    const header = screen.getByTestId('segment-header');
    expect(header).toContainElement(screen.getByText('AI-evaluated'));
  });

  /* ── Test 3 ──────────────────────────────────────────────────────────────
     The badge rendered after upload must be a pill (rounded-full class),
     matching the `asPill` rendering used in Maturity.tsx line 1438.
  ─────────────────────────────────────────────────────────────────────────── */
  it('renders the post-upload badge as a pill (rounded-full class)', async () => {
    stubUploadFlow([AI_EVALUATED_RECORD]);

    render(<SegmentCardHarness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf()] } });
    });

    await waitFor(
      () => {
        const badge = screen.getByText('AI-evaluated');
        expect(badge.className).toContain('rounded-full');
      },
      { timeout: 5000 },
    );
  });

  /* ── Test 4 ──────────────────────────────────────────────────────────────
     The badge tier must match the uploaded evidence's confidenceTier.
     When the confirm endpoint returns consultant_validated and the evidence
     GET returns a consultant_validated record, the "Consultant-validated"
     pill (not "AI-evaluated") must appear next to the score.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows Consultant-validated badge when the uploaded evidence is consultant_validated', async () => {
    stubUploadFlow([CONSULTANT_VALIDATED_RECORD]);

    render(<SegmentCardHarness />);

    /* Confirm no badge before upload */
    expect(screen.queryByText('Consultant-validated')).toBeNull();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf('validated.pdf')] } });
    });

    await waitFor(
      () => {
        expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    /* "AI-evaluated" must not appear — tier must match the record */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Test 5 ──────────────────────────────────────────────────────────────
     The badge label must match the language mode. In Arabic mode the
     "مُقيَّم بالذكاء الاصطناعي" label must appear and the English
     "AI-evaluated" label must be absent.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows the Arabic badge label after upload when lang is ar', async () => {
    stubUploadFlow([AI_EVALUATED_RECORD]);

    render(<SegmentCardHarness lang="ar" />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf()] } });
    });

    await waitFor(
      () => {
        expect(screen.getByText('مُقيَّم بالذكاء الاصطناعي')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    /* English label must not appear in Arabic mode */
    expect(screen.queryByText('AI-evaluated')).toBeNull();
  });

  /* ── Test 6 ──────────────────────────────────────────────────────────────
     The badge must remain visible after a second render cycle (i.e. the
     state update from fetchEvidence() is durable and does not reset).
  ─────────────────────────────────────────────────────────────────────────── */
  it('badge stays visible after the evidenceList state settles (no flicker)', async () => {
    stubUploadFlow([AI_EVALUATED_RECORD]);

    render(<SegmentCardHarness />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf()] } });
    });

    /* First waitFor: badge appears */
    await waitFor(
      () => expect(screen.getByText('AI-evaluated')).toBeInTheDocument(),
      { timeout: 5000 },
    );

    /* Second waitFor: badge is still there (state is stable) */
    await waitFor(
      () => expect(screen.getByText('AI-evaluated')).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Fixtures — tier promotion scenario (Task 804)
═══════════════════════════════════════════════════════════════════════════ */

const SELF_REPORTED_RECORD: EvidenceRecord = {
  id:               10,
  segId:            SEG_ID,
  subSegId:         SUBSEG_ID,
  subSegLabel:      'Supply chain strategy document',
  originalFilename: 'strategy-draft.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'self_reported',
  aiEvaluation:     null,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Extended Harness — starts with seeded evidenceList
   ───────────────────────────────────────────────────────────────────────────
   Mirrors the same Maturity.tsx pattern as SegmentCardHarness but accepts an
   initialEvidence prop so the evidenceList is non-empty at mount. The
   `existing` prop passed to EvidenceUploadZone is derived from evidenceList
   (mirrors the real Maturity.tsx data-flow where `existing` comes from the
   same evidenceList state, not a separate store).
═══════════════════════════════════════════════════════════════════════════ */

interface HarnessWithInitialProps {
  lang?:            'en' | 'ar';
  initialEvidence:  EvidenceRecord[];
}

function SegmentCardHarnessWithInitialEvidence({
  lang = 'en',
  initialEvidence,
}: HarnessWithInitialProps) {
  const [evidenceList, setEvidenceList] = React.useState<EvidenceRecord[]>(initialEvidence);

  const fetchEvidence = React.useCallback(() => {
    fetch(`http://test/api/maturity/evidence?snapshot_id=${SNAPSHOT_ID}`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: { ok: boolean; evidence?: EvidenceRecord[] }) => {
        if (data.ok && data.evidence) setEvidenceList(data.evidence);
      })
      .catch(() => { /* best-effort */ });
  }, []);

  /* Derive badge evidence and the per-subseg existing record from the same
     evidenceList — exactly as Maturity.tsx does (lines 1418–1424, 1526-1530) */
  const segEvidence = evidenceList.filter(e => e.segId === SEG_ID);
  const existing    = segEvidence.find(e => e.subSegId === SUBSEG_ID) ?? null;

  return (
    <div>
      {/* ── Score + badge header ──────────────────────────────────────── */}
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

      {/* ── Upload zone ───────────────────────────────────────────────── */}
      <EvidenceUploadZone
        lang={lang}
        snapshotId={SNAPSHOT_ID}
        segId={SEG_ID}
        subSegId={SUBSEG_ID}
        subSegLabel="Supply chain strategy document"
        subSegLabelAr="وثيقة استراتيجية سلسلة الإمداد"
        subSegHint="Upload evidence that supports your strategy maturity claim."
        subSegHintAr="ارفع دليلاً يدعم ادعاءك بمستوى نضج الاستراتيجية."
        existing={existing}
        onChanged={fetchEvidence}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Fetch stub — two-phase re-upload scenario
   ───────────────────────────────────────────────────────────────────────────
   Phase A (before deletion): GET /evidence returns the self_reported record.
   Deletion (DELETE /evidence/:id): acknowledged with 204, sets phase → B.
   Phase B (after deletion, before new upload): GET returns [].
   Upload flow (POST upload-url → PUT GCS → POST confirm): completes upload.
   Phase C (after confirm): GET returns [AI_EVALUATED_RECORD].
═══════════════════════════════════════════════════════════════════════════ */

function stubReUploadFlow() {
  type Phase = 'initial' | 'deleted' | 'confirmed';
  let phase: Phase = 'initial';

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();

      /* DELETE existing evidence record ─────────────────────────────── */
      if (url.includes('/maturity/evidence/') && method === 'DELETE') {
        phase = 'deleted';
        return Promise.resolve({ ok: true, status: 204, text: async () => '' });
      }

      /* POST upload-url ──────────────────────────────────────────────── */
      if (url.includes('/maturity/evidence/upload-url') && method === 'POST') {
        return Promise.resolve({
          ok:   true,
          json: async () => ({
            ok:          true,
            evidence_id: 99,
            upload_url:  'https://storage.test/upload',
          }),
        });
      }

      /* PUT to presigned GCS URL ─────────────────────────────────────── */
      if (url.startsWith('https://storage.test/') && method === 'PUT') {
        return Promise.resolve({ ok: true });
      }

      /* POST confirm ─────────────────────────────────────────────────── */
      if (url.includes('/maturity/evidence/') && url.includes('/confirm') && method === 'POST') {
        phase = 'confirmed';
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, confidence_tier: 'ai_evaluated' }),
        });
      }

      /* GET /evidence (fetchEvidence) ────────────────────────────────── */
      if (url.includes('/maturity/evidence') && method === 'GET') {
        if (phase === 'initial') {
          return Promise.resolve({
            ok:   true,
            json: async () => ({ ok: true, evidence: [SELF_REPORTED_RECORD] }),
          });
        }
        if (phase === 'deleted') {
          return Promise.resolve({
            ok:   true,
            json: async () => ({ ok: true, evidence: [] }),
          });
        }
        /* phase === 'confirmed' */
        return Promise.resolve({
          ok:   true,
          json: async () => ({ ok: true, evidence: [AI_EVALUATED_RECORD] }),
        });
      }

      /* Fallback */
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    }),
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tests — badge tier promotion via re-upload (Task 804)
═══════════════════════════════════════════════════════════════════════════ */

describe('Maturity results page — badge tier updates when a second file replaces the first', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  /* ── Test 7 ──────────────────────────────────────────────────────────────
     Tier-promotion path: self_reported → ai_evaluated via re-upload.

     Start: evidenceList already contains one self_reported record so the
       "Self-reported" badge is visible next to the score.
     Action 1: user clicks the remove (×) button — triggers DELETE then
       fetchEvidence(), which returns [] so evidenceList clears, `existing`
       becomes null, and the upload zone renders.
     Action 2: user picks a new file — triggers the three-step upload flow
       then fetchEvidence(), which returns the AI_EVALUATED_RECORD.
     End: badge updates to "AI-evaluated" without a page reload.
  ─────────────────────────────────────────────────────────────────────────── */
  it('upgrades badge from Self-reported to AI-evaluated after remove + re-upload', async () => {
    stubReUploadFlow();

    render(
      <SegmentCardHarnessWithInitialEvidence
        initialEvidence={[SELF_REPORTED_RECORD]}
      />,
    );

    /* Initial state: at least one "Self-reported" label visible (badge in
       header + inline label inside EvidenceUploadZone both render it when
       the tier is self_reported — using getAllByText handles both)         */
    expect(screen.getAllByText('Self-reported').length).toBeGreaterThan(0);
    expect(screen.queryByText('AI-evaluated')).toBeNull();

    /* ── Step 1: remove the existing self_reported record ───────────── */
    const removeBtn = screen.getByTitle('Remove evidence');
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    /* After deletion + fetchEvidence ALL "Self-reported" labels must be gone
       (evidenceList is empty → badge hidden; existing=null → upload zone shown) */
    await waitFor(
      () => expect(screen.queryAllByText('Self-reported')).toHaveLength(0),
      { timeout: 5000 },
    );

    /* The upload zone is now visible (no `existing` record) */
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();

    /* ── Step 2: upload a new, stronger file ───────────────────────── */
    await act(async () => {
      fireEvent.change(input, { target: { files: [makePdf('strategy-v2.pdf')] } });
    });

    /* After confirm + fetchEvidence the badge must upgrade to "AI-evaluated" */
    await waitFor(
      () => {
        expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    /* "Self-reported" must not linger after the upgrade (neither badge nor
       upload-zone inline label should show it)                             */
    expect(screen.queryAllByText('Self-reported')).toHaveLength(0);

    /* Badge must be inside the score header — no page reload needed */
    const header = screen.getByTestId('segment-header');
    expect(header).toContainElement(screen.getByText('AI-evaluated'));
  });
});
