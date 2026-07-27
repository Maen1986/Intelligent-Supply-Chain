/**
 * SavedPlansSection — optimistic delete
 *
 * Confirms (Task 310):
 *   1. A plan row disappears from the list immediately after clicking Delete,
 *      without waiting for a list re-fetch.
 *   2. The DELETE request is sent to the correct endpoint:
 *      DELETE /api/plans/<toolKey>
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
function stubFetch(plans: typeof PLAN_MATURITY[]) {
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

/* ══════════════════════════════════════════════════════════════════════════
   Tests
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
    const deleteCallMade = (fetchMock.mock.calls as [string, RequestInit?][]).some(
      ([url, opts]) =>
        (url as string).includes('/api/plans/maturity') &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCallMade).toBe(true);

    // Now let the DELETE settle — no errors should occur
    resolveDelete();
    await deleteSettled;
  });
});

describe('SavedPlansSection — optimistic delete', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders a plan row for each fetched plan', async () => {
    vi.stubGlobal('fetch', stubFetch([PLAN_MATURITY, PLAN_RISK]));

    render(<SavedPlansSection isAr={false} />);

    // Wait for loading to finish and rows to appear
    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );
    expect(screen.getByText('Risk Register')).toBeInTheDocument();
  });

  it('removes the deleted plan row immediately after clicking Delete', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY, PLAN_RISK]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    // Wait for both rows to appear
    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );
    expect(screen.getByText('Risk Register')).toBeInTheDocument();

    // Delete buttons are ordered by the plan list; click the first one (Maturity)
    const deleteButtons = screen.getAllByTitle('Delete plan');
    expect(deleteButtons).toHaveLength(2);
    fireEvent.click(deleteButtons[0]);

    // The maturity row must disappear without any additional GET /plans call
    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    // The risk-register row must remain
    expect(screen.getByText('Risk Register')).toBeInTheDocument();
  });

  it('does not re-fetch the plans list after deletion', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );

    // Record how many GET /plans calls happened during initial load
    const getCallsBeforeDelete = (fetchMock.mock.calls as [string, RequestInit?][]).filter(
      ([url, opts]) =>
        (url as string).endsWith('/api/plans') &&
        ((opts?.method ?? 'GET').toUpperCase() === 'GET'),
    ).length;

    fireEvent.click(screen.getByTitle('Delete plan'));

    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    // No additional GET /plans calls should have occurred
    const getCallsAfterDelete = (fetchMock.mock.calls as [string, RequestInit?][]).filter(
      ([url, opts]) =>
        (url as string).endsWith('/api/plans') &&
        ((opts?.method ?? 'GET').toUpperCase() === 'GET'),
    ).length;

    expect(getCallsAfterDelete).toBe(getCallsBeforeDelete);
  });

  it('sends DELETE to the correct endpoint for the clicked plan', async () => {
    const fetchMock = stubFetch([PLAN_MATURITY, PLAN_RISK]);
    vi.stubGlobal('fetch', fetchMock);

    render(<SavedPlansSection isAr={false} />);

    await waitFor(() =>
      expect(screen.getByText('Maturity Assessment')).toBeInTheDocument(),
    );

    // Click the delete button for the first plan (Maturity → toolKey: 'maturity')
    const deleteButtons = screen.getAllByTitle('Delete plan');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(screen.queryByText('Maturity Assessment')).toBeNull(),
    );

    // Verify the DELETE was sent to the right URL
    const deleteCall = (fetchMock.mock.calls as [string, RequestInit?][]).find(
      ([url, opts]) =>
        (url as string).endsWith('/api/plans/maturity') &&
        (opts?.method ?? '').toUpperCase() === 'DELETE',
    );
    expect(deleteCall).toBeDefined();
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
