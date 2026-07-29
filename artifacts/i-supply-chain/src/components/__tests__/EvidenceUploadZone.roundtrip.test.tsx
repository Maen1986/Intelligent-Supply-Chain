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
});

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

  it('does not show the remove button for consultant_validated evidence', () => {
    renderZone({
      existing: { ...EXISTING, confidenceTier: 'consultant_validated' },
    });
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
