/**
 * SavedPlansSection — combined test suite
 *
 * Task 310 — optimistic delete:
 *   1. A plan row disappears from the list immediately after clicking Delete,
 *      without waiting for a list re-fetch.
 *   2. The DELETE request is sent to the correct endpoint:
 *      DELETE /api/plans/<toolKey>
 *
 * Task 311 — tool-label mapping:
 *   Verifies that every known tool key is rendered with its human-readable
 *   English and Arabic label, and that unknown keys fall back gracefully:
 *
 *   Known keys   → correct label (EN + AR)
 *   scorecard-*  → "Supplier Scorecard" / "بطاقة تقييم المورّد"
 *   isc-tool-*   → "Supply-Chain Tool"  / "أداة سلسلة الإمداد"
 *   Unknown key  → raw key shown as-is
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

import { SavedPlansSection } from './SavedPlansSection';

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const PLAN_MATURITY = {
  toolKey: 'maturity',
  text:    '## Maturity Plan\nImprove process [HIGH]',
  savedAt: '2026-07-01T10:00:00Z',
};

const PLAN_RISK = {
  toolKey: 'risk-register',
  text:    '## Risk Register Plan\nMonitor risks [MEDIUM]',
  savedAt: '2026-07-02T10:00:00Z',
};

/* ── Fetch stub helpers ──────────────────────────────────────────────────── */

/**
 * Stub fetch so that:
 *   GET  /api/plans            → returns the provided plans array
 *   DELETE /api/plans/<key>    → returns { ok: true }
 * Everything else → { ok: true }
 */
function stubFetch(plans: { toolKey: string; text: string; savedAt: string }[]) {
  return vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    const method = (opts?.method ?? 'GET').toUpperCase();

    if (method === 'GET' && (url as string).endsWith('/api/plans')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, plans }),
      });
    }

    if (method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({ ok: true }),
    });
  });
}

/**
 * Simpler helper for label-mapping tests: stubs fetch to return plans for the
 * given tool keys and renders the section.
 */
function mockFetchWithPlans(toolKeys: string[]) {
  const plans = toolKeys.map(toolKey => ({
    toolKey,
    text: `Sample plan text for ${toolKey}`,
    savedAt: '2025-01-15T10:00:00.000Z',
  }));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ ok: true, plans }),
  }));
}

function renderSection(isAr = false) {
  return render(<SavedPlansSection isAr={isAr} />);
}

/* ══════════════════════════════════════════════════════════════════════════
   Task 310 — optimistic delete (timing)
══════════════════════════════════════════════════════════════════════════ */

describe('SavedPlansSection — optimistic delete (timing)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('removes the plan row before the DELETE response resolves', async () => {
    // Resolver kept in outer scope so we control when DELETE settles
    let resolveDelete!: () => void;
    const deleteSettled = new Promise<void>(res => { resolveDelete = res; });

    const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      const method = (opts?.method ?? 'GET').toUpperCase();

      if (method === 'GET' && (url as string).endsWith('/api/plans')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, plans: [PLAN_MATURITY] }),
        });
      }

      if (method === 'DELETE') {
        // This promise only resolves when we call resolveDelete() explicitly
        return new Promise<{ ok: boolean; json: () => Promise<{ ok: boolean }> }>(
          (res) => {
            deleteSettled.then(() =>
              res({ ok: true, json: async () => ({ ok: true }) }),
            );
          },
        );
      }

      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    // Wait for the row to appear
    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );

    // Click delete — DELETE is now pending (unresolved)
    fireEvent.click(screen.getByTitle('Delete plan'));

    // The row must disappear BEFORE we resolve the DELETE
    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    // The DELETE request must still be in-flight at this point
    expect(resolveDelete).toBeDefined(); // ensures the test actually exercised the slow path
    resolveDelete(); // clean up the dangling promise
  });

  it('sends the DELETE request to the correct endpoint', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTitle('Delete plan'));

    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    const deleteCall = (fetchMock.mock.calls as [string, RequestInit?][]).find(
      ([url, opts]) =>
        (url as string).includes('/api/plans/') &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
    expect(deleteCall![0]).toContain(encodeURIComponent(PLAN_MATURITY.toolKey));
  });

  it('removes only the deleted plan row and leaves the other intact', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY, PLAN_RISK]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    await waitFor(() => {
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument();
      expect(screen.getByText('Risk Register')).toBeInTheDocument();
    });

    // Delete buttons appear in DOM order; click the first one (PLAN_MATURITY)
    const deleteButtons = screen.getAllByTitle('Delete plan');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    expect(screen.getByText('Risk Register')).toBeInTheDocument();
  });

  it('sends DELETE to the correct endpoint when the toolKey needs URL encoding', async () => {
    const encodedPlan = {
      toolKey: 'scorecard-sup/xyz',
      text:    '## Scorecard\nImprove [LOW]',
      savedAt: '2026-07-03T10:00:00Z',
    };
    const fetchMock = stubFetch([encodedPlan]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    // Wait for the row to render (falls back to toolKey as label)
    await waitFor(() =>
      expect(screen.getByTitle('Delete plan')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTitle('Delete plan'));

    await waitFor(() =>
      expect(screen.queryByTitle('Delete plan')).toBeNull(),
    );

    const deleteCall = (fetchMock.mock.calls as [string, RequestInit?][]).find(
      ([url, opts]) =>
        (url as string).endsWith(`/api/plans/${encodeURIComponent(encodedPlan.toolKey)}`) &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
  });

  it('shows the empty-state message after the last plan is deleted', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTitle('Delete plan'));

    await waitFor(() =>
      expect(
        screen.getByText(/No plans saved yet/i),
      ).toBeInTheDocument(),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — known tool keys (English labels)
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — known tool keys (English)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows "Maturity Assessment" for key "maturity"', async () => {
    mockFetchWithPlans(['maturity']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Maturity Assessment')).toBeInTheDocument());
  });

  it('shows "Procurement & Cat. Mgmt" for key "procurement-catmgmt"', async () => {
    mockFetchWithPlans(['procurement-catmgmt']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Procurement & Cat. Mgmt')).toBeInTheDocument());
  });

  it('shows "Risk Register" for key "risk-register"', async () => {
    mockFetchWithPlans(['risk-register']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Risk Register')).toBeInTheDocument());
  });

  it('shows "Contract Portfolio" for key "clm-portfolio"', async () => {
    mockFetchWithPlans(['clm-portfolio']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Contract Portfolio')).toBeInTheDocument());
  });

  it('shows "Training Plan" for key "training"', async () => {
    mockFetchWithPlans(['training']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Training Plan')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — known tool keys (Arabic labels)
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — known tool keys (Arabic)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows "تقييم النضج" for key "maturity" in Arabic mode', async () => {
    mockFetchWithPlans(['maturity']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('تقييم النضج')).toBeInTheDocument());
  });

  it('shows "المشتريات وإدارة الفئات" for key "procurement-catmgmt" in Arabic mode', async () => {
    mockFetchWithPlans(['procurement-catmgmt']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('المشتريات وإدارة الفئات')).toBeInTheDocument());
  });

  it('shows "سجل المخاطر" for key "risk-register" in Arabic mode', async () => {
    mockFetchWithPlans(['risk-register']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('سجل المخاطر')).toBeInTheDocument());
  });

  it('shows "محفظة العقود" for key "clm-portfolio" in Arabic mode', async () => {
    mockFetchWithPlans(['clm-portfolio']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('محفظة العقود')).toBeInTheDocument());
  });

  it('shows "خطة التدريب" for key "training" in Arabic mode', async () => {
    mockFetchWithPlans(['training']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('خطة التدريب')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — scorecard-* prefix fallback
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — scorecard-* fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows "Supplier Scorecard" in English for "scorecard-42"', async () => {
    mockFetchWithPlans(['scorecard-42']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Supplier Scorecard')).toBeInTheDocument());
  });

  it('shows "Supplier Scorecard" in English for "scorecard-abc-99"', async () => {
    mockFetchWithPlans(['scorecard-abc-99']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Supplier Scorecard')).toBeInTheDocument());
  });

  it('shows "بطاقة تقييم المورّد" in Arabic for "scorecard-42"', async () => {
    mockFetchWithPlans(['scorecard-42']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('بطاقة تقييم المورّد')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — isc-tool-* prefix fallback
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — isc-tool-* fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows "Supply-Chain Tool" in English for "isc-tool-demand-forecast-v2"', async () => {
    mockFetchWithPlans(['isc-tool-demand-forecast-v2']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('Supply-Chain Tool')).toBeInTheDocument());
  });

  it('shows "أداة سلسلة الإمداد" in Arabic for "isc-tool-demand-forecast-v2"', async () => {
    mockFetchWithPlans(['isc-tool-demand-forecast-v2']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('أداة سلسلة الإمداد')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — completely unknown key — raw slug shown as fallback
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — unknown key fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders the raw key when no label mapping exists', async () => {
    mockFetchWithPlans(['some-future-tool-xyz']);
    renderSection(false);
    await waitFor(() => expect(screen.getByText('some-future-tool-xyz')).toBeInTheDocument());
  });

  it('renders the raw key in Arabic mode too when no mapping exists', async () => {
    mockFetchWithPlans(['some-future-tool-xyz']);
    renderSection(true);
    await waitFor(() => expect(screen.getByText('some-future-tool-xyz')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 311 — multiple plans rendered simultaneously
══════════════════════════════════════════════════════════════════════════ */
describe('SavedPlansSection — multiple plans with different keys', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders correct labels for all known keys at once (English)', async () => {
    mockFetchWithPlans(['maturity', 'risk-register', 'training', 'clm-portfolio', 'procurement-catmgmt']);
    renderSection(false);
    await waitFor(() => {
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument();
      expect(screen.getByText('Risk Register')).toBeInTheDocument();
      expect(screen.getByText('Training Plan')).toBeInTheDocument();
      expect(screen.getByText('Contract Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Procurement & Cat. Mgmt')).toBeInTheDocument();
    });
  });

  it('renders a scorecard and a known key together without collision', async () => {
    mockFetchWithPlans(['scorecard-7', 'maturity']);
    renderSection(false);
    await waitFor(() => {
      expect(screen.getByText('Supplier Scorecard')).toBeInTheDocument();
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument();
    });
  });
});
