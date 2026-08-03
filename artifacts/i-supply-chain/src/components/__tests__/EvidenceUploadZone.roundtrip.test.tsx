/**
 * EvidenceUploadZone — upload & remove round-trip tests (Task 736)
 *
 * Covers:
 *  1. Upload flow: idle → uploading → evaluating → done
 *     - POST /upload-url is called with the right fields
 *     - File is PUT to the presigned URL
 *     - POST /confirm is called
 *     - onChanged fires after a successful confirm
 *
 *  2. After upload, rendering with existing=ai_evaluated evidence shows
 *     the ConfidenceTierBadge at "AI-evaluated" tier.
 *
 *  3. After upload, rendering with existing=self_reported evidence shows
 *     the "Self-reported" badge tier.
 *
 *  4. Remove flow: clicking the X on an existing record calls DELETE,
 *     onChanged fires, and the upload zone is shown again.
 *
 *  5. Upload error: network failure shows an error message and a Retry link.
 *
 *  6. Duplicate sub-segment (409 from /upload-url) surfaces an error message.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { EvidenceUploadZone, type EvidenceRecord } from '../EvidenceUploadZone';
import { ConfidenceTierBadge, getSegmentTier } from '../ConfidenceTierBadge';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── Shared props ─────────────────────────────────────────────────────────── */

const BASE_PROPS = {
  lang:          'en' as const,
  snapshotId:    42,
  segId:         'procurement',
  subSegId:      'supplier_selection',
  subSegLabel:   'Supplier Selection',
  subSegLabelAr: 'اختيار المورد',
  subSegHint:    'Upload a supplier evaluation report.',
  subSegHintAr:  'ارفع تقرير تقييم المورد.',
  existing:      null,
};

function mkFile(name = 'evidence.pdf', type = 'application/pdf') {
  return new File(['dummy content'], name, { type });
}

/* ── Fetch stubs ──────────────────────────────────────────────────────────── */

/** Happy-path fetch: upload-url → GCS PUT → confirm */
function stubHappyPath(tier: 'ai_evaluated' | 'self_reported' = 'ai_evaluated') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      // 1. POST /upload-url
      if (method === 'POST' && String(url).includes('/upload-url')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok:          true,
            evidence_id: 101,
            upload_url:  'https://storage.example.com/presigned-put?token=abc',
          }),
        });
      }
      // 2. PUT to GCS presigned URL
      if (method === 'PUT' && String(url).includes('storage.example.com')) {
        return Promise.resolve({ ok: true, status: 200 });
      }
      // 3. POST /confirm
      if (method === 'POST' && String(url).includes('/confirm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, confidence_tier: tier }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

/** Stub that makes the first POST (/upload-url) reject with a network error */
function stubUploadUrlNetworkError() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      if (method === 'POST' && String(url).includes('/upload-url')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

/** Stub that makes /upload-url return 409 (duplicate sub-segment) */
function stubUploadUrl409() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      if (method === 'POST' && String(url).includes('/upload-url')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            ok:    false,
            error: 'Evidence already uploaded for this sub-segment. Remove the existing file first.',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

/** Stub for DELETE — returns 204 */
function stubDeleteOk() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      if (method === 'DELETE') return Promise.resolve({ ok: true, status: 204 });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function renderZone(overrides: Partial<typeof BASE_PROPS> = {}) {
  const onChanged = vi.fn();
  const { rerender } = render(
    <EvidenceUploadZone {...BASE_PROPS} {...overrides} onChanged={onChanged} />,
  );
  return { onChanged, rerender };
}

/** Simulate picking a file via the hidden <input> */
function pickFile(file: File) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [file] } });
}

/* ══════════════════════════════════════════════════════════════════════════
   1. Upload flow — happy path
══════════════════════════════════════════════════════════════════════════ */
describe('EvidenceUploadZone — upload happy path', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('calls POST /upload-url with correct fields', async () => {
    stubHappyPath();
    renderZone();

    await act(async () => { pickFile(mkFile()); });

    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const uploadUrlCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        String(url).includes('/upload-url') &&
        (opts?.method ?? '').toUpperCase() === 'POST',
    );
    expect(uploadUrlCall).toBeDefined();

    const body = JSON.parse(uploadUrlCall![1].body as string);
    expect(body.snapshot_id).toBe(42);
    expect(body.seg_id).toBe('procurement');
    expect(body.subseg_id).toBe('supplier_selection');
    expect(body.mime_type).toBe('application/pdf');
  });

  it('PUTs the file to the presigned GCS URL', async () => {
    stubHappyPath();
    renderZone();

    const file = mkFile();
    await act(async () => { pickFile(file); });

    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const putCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        String(url).includes('storage.example.com') &&
        (opts?.method ?? '').toUpperCase() === 'PUT',
    );
    expect(putCall).toBeDefined();
    expect(putCall![1].body).toBe(file);
  });

  it('calls POST /confirm with the evidence_id from upload-url', async () => {
    stubHappyPath();
    renderZone();

    await act(async () => { pickFile(mkFile()); });

    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const confirmCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        String(url).includes('/101/confirm') &&
        (opts?.method ?? '').toUpperCase() === 'POST',
    );
    expect(confirmCall).toBeDefined();
  });

  it('calls onChanged after successful confirm', async () => {
    stubHappyPath();
    const { onChanged } = renderZone();

    await act(async () => { pickFile(mkFile()); });

    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Badge tier after upload — rendered with existing evidence record
══════════════════════════════════════════════════════════════════════════ */
describe('ConfidenceTierBadge — tier reflects evidence state', () => {
  afterEach(() => cleanup());

  it('shows "AI-evaluated" pill when tier is ai_evaluated with plausible support', () => {
    const evidence: EvidenceRecord[] = [{
      id:               101,
      segId:            'procurement',
      subSegId:         'supplier_selection',
      subSegLabel:      'Supplier Selection',
      originalFilename: 'evidence.pdf',
      mimeType:         'application/pdf',
      confidenceTier:   'ai_evaluated',
      aiEvaluation:     { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Good doc.' },
    }];

    render(<ConfidenceTierBadge lang="en" evidence={evidence} asPill />);
    expect(screen.getByText('AI-evaluated')).toBeInTheDocument();
  });

  it('shows "Self-reported" pill when tier is self_reported', () => {
    const evidence: EvidenceRecord[] = [{
      id:               102,
      segId:            'procurement',
      subSegId:         'supplier_selection',
      subSegLabel:      'Supplier Selection',
      originalFilename: 'evidence.pdf',
      mimeType:         'application/pdf',
      confidenceTier:   'self_reported',
    }];

    render(<ConfidenceTierBadge lang="en" evidence={evidence} asPill />);
    expect(screen.getByText('Self-reported')).toBeInTheDocument();
  });

  it('shows "Consultant-validated" pill when tier is consultant_validated', () => {
    const evidence: EvidenceRecord[] = [{
      id:               103,
      segId:            'procurement',
      subSegId:         'supplier_selection',
      subSegLabel:      'Supplier Selection',
      originalFilename: 'evidence.pdf',
      mimeType:         'application/pdf',
      confidenceTier:   'consultant_validated',
    }];

    render(<ConfidenceTierBadge lang="en" evidence={evidence} asPill />);
    expect(screen.getByText('Consultant-validated')).toBeInTheDocument();
  });

  it('getSegmentTier returns ai_evaluated when any evidence has that tier with plausible support', () => {
    const evidence: EvidenceRecord[] = [
      {
        id: 104, segId: 'procurement', subSegId: 'ss', subSegLabel: 'SS',
        originalFilename: 'f.pdf', mimeType: 'application/pdf',
        confidenceTier: 'self_reported',
      },
      {
        id: 105, segId: 'procurement', subSegId: 'ss2', subSegLabel: 'SS2',
        originalFilename: 'f2.pdf', mimeType: 'application/pdf',
        confidenceTier: 'ai_evaluated',
        aiEvaluation: { plausible_support: true, confidence: 'medium', flag_reason: null, summary: '' },
      },
    ];
    expect(getSegmentTier(evidence)).toBe('ai_evaluated');
  });

  it('getSegmentTier returns self_reported when all evidence is self_reported', () => {
    const evidence: EvidenceRecord[] = [{
      id: 106, segId: 'p', subSegId: 'ss', subSegLabel: 'SS',
      originalFilename: 'f.pdf', mimeType: 'application/pdf',
      confidenceTier: 'self_reported',
    }];
    expect(getSegmentTier(evidence)).toBe('self_reported');
  });

  it('getSegmentTier returns consultant_validated if any evidence has that tier', () => {
    const evidence: EvidenceRecord[] = [
      {
        id: 107, segId: 'p', subSegId: 'ss', subSegLabel: 'SS',
        originalFilename: 'f.pdf', mimeType: 'application/pdf',
        confidenceTier: 'ai_evaluated',
        aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: '' },
      },
      {
        id: 108, segId: 'p', subSegId: 'ss2', subSegLabel: 'SS2',
        originalFilename: 'f2.pdf', mimeType: 'application/pdf',
        confidenceTier: 'consultant_validated',
      },
    ];
    expect(getSegmentTier(evidence)).toBe('consultant_validated');
  });

  /* ── Task 852 — flagged ai_evaluated must NOT suppress consultant_validated ── */

  const FLAGGED_AI_EV: EvidenceRecord = {
    id: 201, segId: 'p', subSegId: 'ss', subSegLabel: 'SS',
    originalFilename: 'flagged-ai.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: false, confidence: 'low', flag_reason: 'scope mismatch', summary: '' },
  };

  const CONSULTANT_EV: EvidenceRecord = {
    id: 202, segId: 'p', subSegId: 'ss2', subSegLabel: 'SS2',
    originalFilename: 'cv.pdf', mimeType: 'application/pdf',
    confidenceTier: 'consultant_validated',
  };

  it('getSegmentTier returns consultant_validated when ai_evaluated is flagged and consultant_validated is also present', () => {
    // getSegmentTier checks consultant_validated first; a flagged ai_evaluated
    // record (plausible_support:false) must never suppress the consultant tier.
    expect(getSegmentTier([FLAGGED_AI_EV, CONSULTANT_EV])).toBe('consultant_validated');
  });

  it('getSegmentTier returns consultant_validated regardless of record order (Task 852)', () => {
    // Order should not matter — consultant_validated must win in both permutations.
    expect(getSegmentTier([CONSULTANT_EV, FLAGGED_AI_EV])).toBe('consultant_validated');
  });

  it('getSegmentTier returns self_reported (not ai_evaluated) when the only ai_evaluated record is flagged', () => {
    // Flagged ai_evaluated (plausible_support:false) does not qualify as ai_evaluated tier.
    expect(getSegmentTier([FLAGGED_AI_EV])).toBe('self_reported');
  });

  /* ── Task 848 — consultant_validated → ai_evaluated demotion ──────────── */

  const AI_EV: EvidenceRecord = {
    id: 203, segId: 'p', subSegId: 'ss3', subSegLabel: 'SS3',
    originalFilename: 'ai.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: '' },
  };

  it('getSegmentTier returns ai_evaluated when consultant_validated is removed and only ai_evaluated remains (Task 848)', () => {
    // Before removal: consultant_validated wins
    expect(getSegmentTier([CONSULTANT_EV, AI_EV])).toBe('consultant_validated');
    // After removal: only the ai_evaluated record remains — tier demotes
    expect(getSegmentTier([AI_EV])).toBe('ai_evaluated');
  });

  it('removing the consultant_validated record does not leave a stale tier (Task 848)', () => {
    // The function must re-evaluate the list on every call — no caching
    const before = [CONSULTANT_EV, AI_EV];
    const after  = [AI_EV];
    expect(getSegmentTier(before)).toBe('consultant_validated');
    expect(getSegmentTier(after)).toBe('ai_evaluated');
  });

  /* ── Task 849 — empty evidence array ─────────────────────────────────── */

  it('getSegmentTier returns self_reported when evidenceList is empty — does not crash (Task 849)', () => {
    expect(getSegmentTier([])).toBe('self_reported');
  });

  it('getSegmentTier with empty array returns a defined string, never undefined or null (Task 849)', () => {
    const result = getSegmentTier([]);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(typeof result).toBe('string');
  });

  /* ── Task 853 — duplicate sub-segment IDs don't confuse tier resolution ─ */

  it('getSegmentTier returns the best tier when duplicate sub-segment IDs exist (Task 853)', () => {
    // Two records share the same subSegId — an older self_reported and a newer ai_evaluated.
    // getSegmentTier iterates all records; the best tier must still win.
    const older: EvidenceRecord = {
      id: 300, segId: 'p', subSegId: 'dup-sub', subSegLabel: 'Dup',
      originalFilename: 'old.pdf', mimeType: 'application/pdf',
      confidenceTier: 'self_reported',
    };
    const newer: EvidenceRecord = {
      id: 301, segId: 'p', subSegId: 'dup-sub', subSegLabel: 'Dup',
      originalFilename: 'new.pdf', mimeType: 'application/pdf',
      confidenceTier: 'ai_evaluated',
      aiEvaluation: { plausible_support: true, confidence: 'high', flag_reason: null, summary: '' },
    };
    expect(getSegmentTier([older, newer])).toBe('ai_evaluated');
  });

  it('consultant_validated wins even when a duplicate sub-segment also has a self_reported record (Task 853)', () => {
    const srDup: EvidenceRecord = {
      id: 302, segId: 'p', subSegId: 'dup-sub', subSegLabel: 'Dup',
      originalFilename: 'old.pdf', mimeType: 'application/pdf',
      confidenceTier: 'self_reported',
    };
    const cvDup: EvidenceRecord = {
      id: 303, segId: 'p', subSegId: 'dup-sub', subSegLabel: 'Dup',
      originalFilename: 'new.pdf', mimeType: 'application/pdf',
      confidenceTier: 'consultant_validated',
    };
    expect(getSegmentTier([srDup, cvDup])).toBe('consultant_validated');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 861 — getSegmentTier stays correct when aiEvaluation is null on an
   ai_evaluated record (e.g. a partially-migrated row from the API).
   The function must not crash and must fall back to self_reported rather
   than treating the null field as a valid plausible_support: true entry.
══════════════════════════════════════════════════════════════════════════ */
describe('getSegmentTier — null aiEvaluation on ai_evaluated record (Task 861)', () => {
  const NULL_AI_EV: EvidenceRecord = {
    id: 901, segId: 'p', subSegId: 'ss', subSegLabel: 'SS',
    originalFilename: 'partial.pdf', mimeType: 'application/pdf',
    confidenceTier: 'ai_evaluated',
    aiEvaluation: null,
  };

  it('returns self_reported when the only record is ai_evaluated with null aiEvaluation', () => {
    // aiEvaluation is null → plausible_support is undefined → does NOT qualify
    // as ai_evaluated tier → falls back to self_reported
    expect(getSegmentTier([NULL_AI_EV])).toBe('self_reported');
  });

  it('does not crash when aiEvaluation is null', () => {
    expect(() => getSegmentTier([NULL_AI_EV])).not.toThrow();
  });

  it('consultant_validated still wins even when one record has null aiEvaluation', () => {
    const cv: EvidenceRecord = {
      id: 902, segId: 'p', subSegId: 'ss2', subSegLabel: 'SS2',
      originalFilename: 'cv.pdf', mimeType: 'application/pdf',
      confidenceTier: 'consultant_validated',
    };
    expect(getSegmentTier([NULL_AI_EV, cv])).toBe('consultant_validated');
  });
});

/** Stub for DELETE — returns a non-ok status (simulates server error) */
function stubDeleteFail(status = 500) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();
      if (method === 'DELETE') {
        return Promise.resolve({ ok: false, status });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. Remove flow — existing evidence
══════════════════════════════════════════════════════════════════════════ */
describe('EvidenceUploadZone — remove existing evidence', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const EXISTING: EvidenceRecord = {
    id:               200,
    segId:            'procurement',
    subSegId:         'supplier_selection',
    subSegLabel:      'Supplier Selection',
    originalFilename: 'my-doc.pdf',
    mimeType:         'application/pdf',
    confidenceTier:   'ai_evaluated',
    aiEvaluation:     { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Looks good.' },
  };

  it('calls DELETE /maturity/evidence/:id when the remove button is clicked', async () => {
    stubDeleteOk();
    renderZone({ existing: EXISTING });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });

    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const deleteCall = fetchMock.mock.calls.find(
      ([url, opts]: [string, RequestInit]) =>
        String(url).includes('/maturity/evidence/200') &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
  });

  it('calls onChanged after a successful DELETE', async () => {
    stubDeleteOk();
    const { onChanged } = renderZone({ existing: EXISTING });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });

    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
  });

  it('shows the upload zone (not the file card) after remove — rerender with no existing', async () => {
    stubDeleteOk();
    const { onChanged, rerender } = renderZone({ existing: EXISTING });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });

    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());

    // Parent would re-render with existing=null after onChanged fires
    rerender(
      <EvidenceUploadZone {...BASE_PROPS} existing={null} onChanged={onChanged} />,
    );

    expect(screen.getByText(/Add supporting evidence/)).toBeInTheDocument();
    expect(screen.queryByText('my-doc.pdf')).toBeNull();
  });

  /* ── Task 838 — DELETE fails: badge stays and error message appears ───────
     When the DELETE call returns a non-ok response (e.g. 500), handleRemove
     catches the failure, sets an error message, and does NOT call onChanged.
     The file card (and badge) must remain visible.
  ─────────────────────────────────────────────────────────────────────────── */
  it('shows an error message and does NOT call onChanged when DELETE returns 500 (Task 838)', async () => {
    stubDeleteFail(500);
    const { onChanged } = renderZone({ existing: EXISTING });

    // File card visible before the failed remove
    expect(screen.getByText('my-doc.pdf')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });

    // onChanged must NOT be called — the evidence is still on the server
    expect(onChanged).not.toHaveBeenCalled();

    // An error message must appear so the user knows the removal failed
    await waitFor(() =>
      expect(screen.getByText(/Could not remove file/i)).toBeInTheDocument(),
    );
  });

  it('file card stays visible after a failed DELETE (badge is not removed, Task 838)', async () => {
    stubDeleteFail(500);
    const { onChanged } = renderZone({ existing: EXISTING });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });

    // File card must still be in the DOM — parent was never asked to reload
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByText('my-doc.pdf')).toBeInTheDocument();
  });

  it('does not show the remove button for consultant_validated evidence', () => {
    renderZone({
      existing: { ...EXISTING, confidenceTier: 'consultant_validated' },
    });
    expect(screen.queryByTitle('Remove evidence')).toBeNull();
  });

  it('does not show the Arabic remove button for consultant_validated evidence in Arabic mode (Task 750)', () => {
    // In Arabic mode the remove button carries the title 'إزالة الدليل'.
    // Consultant-validated evidence must suppress it regardless of language.
    renderZone({
      lang: 'ar' as const,
      existing: { ...EXISTING, confidenceTier: 'consultant_validated' },
    });
    expect(screen.queryByTitle('إزالة الدليل')).toBeNull();
    // English title must also be absent (button is not rendered at all)
    expect(screen.queryByTitle('Remove evidence')).toBeNull();
  });

  it('does not show the remove button when tier arrives with non-canonical casing (Task 857)', () => {
    // The API should always return lowercase tier strings, but the guard must
    // be robust to casing differences (e.g. 'Consultant_Validated') so an
    // inconsistent API response cannot inadvertently re-expose the button.
    renderZone({
      existing: {
        ...EXISTING,
        // Simulate a raw API string with different casing
        confidenceTier: 'Consultant_Validated' as 'consultant_validated',
      },
    });
    // The remove button must be absent even with non-lowercase tier
    expect(screen.queryByTitle('Remove evidence')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. Upload error handling
══════════════════════════════════════════════════════════════════════════ */
describe('EvidenceUploadZone — upload error handling', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows an error message and Retry link when the network fails', async () => {
    stubUploadUrlNetworkError();
    renderZone();

    await act(async () => { pickFile(mkFile()); });

    await waitFor(() =>
      expect(screen.getByText(/Network error/i)).toBeInTheDocument(),
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows a friendly 409 message when the confirm endpoint rejects the re-confirm (Task 834)', async () => {
    // Stub: upload-url succeeds, GCS PUT succeeds, but POST /confirm returns 409
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        const method = (opts?.method ?? 'GET').toUpperCase();
        if (method === 'POST' && String(url).includes('/upload-url')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, evidence_id: 55, upload_url: 'https://storage.example.com/put?tok=x' }),
          });
        }
        if (method === 'PUT' && String(url).includes('storage.example.com')) {
          return Promise.resolve({ ok: true, status: 200 });
        }
        if (method === 'POST' && String(url).includes('/confirm')) {
          // API returns 409 when evidence is already AI-evaluated
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({
              ok:    false,
              error: 'Evidence is already AI-evaluated and cannot be re-confirmed. Remove the file first.',
              confidence_tier: 'ai_evaluated',
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    renderZone();
    await act(async () => { pickFile(mkFile()); });

    // The friendly API error message must appear — not a raw status code, not silent
    await waitFor(() =>
      expect(
        screen.getByText(/Evidence is already AI-evaluated/i),
      ).toBeInTheDocument(),
    );

    // Retry link must be offered so the user can try again
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows the duplicate-error from a 409 response', async () => {
    stubUploadUrl409();
    renderZone();

    await act(async () => { pickFile(mkFile()); });

    await waitFor(() =>
      expect(
        screen.getByText(/Evidence already uploaded for this sub-segment/i),
      ).toBeInTheDocument(),
    );
  });

  it('clicking Retry returns to idle so another file can be picked', async () => {
    stubUploadUrlNetworkError();
    renderZone();

    await act(async () => { pickFile(mkFile()); });

    await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Retry'));

    // Upload zone button should be visible again
    expect(screen.getByText(/Add supporting evidence/i)).toBeInTheDocument();
  });

  it('rejects files larger than 10 MB before hitting the network', async () => {
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    renderZone();
    await act(async () => { pickFile(bigFile); });

    expect(screen.getByText(/File exceeds 10 MB limit/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects unsupported file types before hitting the network', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    renderZone();
    await act(async () => { pickFile(mkFile('script.exe', 'application/x-msdownload')); });

    expect(screen.getByText(/File type not allowed/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. Badge upgrade — ai_evaluated appears after successful upload
      Simulates the full reload cycle: upload succeeds → parent reloads
      evidence list → zone re-renders with the returned EvidenceRecord.
══════════════════════════════════════════════════════════════════════════ */
describe('EvidenceUploadZone — badge upgrade after upload round-trip', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('ConfidenceTierBadge upgrades from "Add" to AI-evaluated after upload + reload', async () => {
    stubHappyPath('ai_evaluated');

    // Simulate parent state: evidenceList starts empty, populated after onChanged
    let evidenceList: EvidenceRecord[] = [];
    const onChanged = vi.fn().mockImplementation(() => {
      evidenceList = [{
        id:               101,
        segId:            'procurement',
        subSegId:         'supplier_selection',
        subSegLabel:      'Supplier Selection',
        originalFilename: 'evidence.pdf',
        mimeType:         'application/pdf',
        confidenceTier:   'ai_evaluated',
        aiEvaluation:     { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Good doc.' },
      }];
    });

    const { rerender } = render(
      <EvidenceUploadZone {...BASE_PROPS} existing={null} onChanged={onChanged} />,
    );

    // Initially no badge — just the upload zone
    expect(screen.getByText(/Add supporting evidence/i)).toBeInTheDocument();
    expect(screen.queryByText('AI-evaluated')).toBeNull();

    // Upload a file
    await act(async () => { pickFile(mkFile()); });
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());

    // Parent re-renders with the new evidence record (simulating loadEvidence reload)
    rerender(
      <EvidenceUploadZone
        {...BASE_PROPS}
        existing={evidenceList[0]}
        onChanged={onChanged}
      />,
    );

    // File card is now visible
    expect(screen.getByText('evidence.pdf')).toBeInTheDocument();
    expect(screen.getByText('AI-verified ✓')).toBeInTheDocument();
  });

  /* ── Task 850 — Arabic consultant_validated label after re-upload promotion ─ */
  it('Arabic "مُعتمَد من الاستشاري" label appears in the file card after consultant_validated upload (Task 850)', async () => {
    stubHappyPath('consultant_validated');

    let evidenceList: EvidenceRecord[] = [];
    const onChanged = vi.fn().mockImplementation(() => {
      evidenceList = [{
        id:               102,
        segId:            'procurement',
        subSegId:         'supplier_selection',
        subSegLabel:      'Supplier Selection',
        originalFilename: 'validated.pdf',
        mimeType:         'application/pdf',
        confidenceTier:   'consultant_validated',
        aiEvaluation:     null,
      }];
    });

    const { rerender } = render(
      <EvidenceUploadZone {...BASE_PROPS} lang="ar" existing={null} onChanged={onChanged} />,
    );

    // Upload
    await act(async () => { pickFile(mkFile()); });
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());

    // Parent re-renders with the consultant_validated record
    rerender(
      <EvidenceUploadZone
        {...BASE_PROPS}
        lang="ar"
        existing={evidenceList[0]}
        onChanged={onChanged}
      />,
    );

    // Arabic consultant_validated label must appear — not the English one
    expect(screen.getByText(/مُعتمَد من الاستشاري/)).toBeInTheDocument();
    expect(screen.queryByText('Consultant-validated')).toBeNull();
  });

  it('ConfidenceTierBadge returns to "Add" state after remove + reload', async () => {
    stubDeleteOk();

    const EXISTING: EvidenceRecord = {
      id:               200,
      segId:            'procurement',
      subSegId:         'supplier_selection',
      subSegLabel:      'Supplier Selection',
      originalFilename: 'my-doc.pdf',
      mimeType:         'application/pdf',
      confidenceTier:   'ai_evaluated',
      aiEvaluation:     { plausible_support: true, confidence: 'high', flag_reason: null, summary: 'Good.' },
    };

    const onChanged = vi.fn();

    const { rerender } = render(
      <EvidenceUploadZone {...BASE_PROPS} existing={EXISTING} onChanged={onChanged} />,
    );

    // File card is visible
    expect(screen.getByText('my-doc.pdf')).toBeInTheDocument();

    // Click remove
    await act(async () => {
      fireEvent.click(screen.getByTitle('Remove evidence'));
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());

    // Parent re-renders with no evidence (simulating loadEvidence reload)
    rerender(
      <EvidenceUploadZone {...BASE_PROPS} existing={null} onChanged={onChanged} />,
    );

    // Upload zone is back; file card is gone
    expect(screen.getByText(/Add supporting evidence/i)).toBeInTheDocument();
    expect(screen.queryByText('my-doc.pdf')).toBeNull();
  });
});
