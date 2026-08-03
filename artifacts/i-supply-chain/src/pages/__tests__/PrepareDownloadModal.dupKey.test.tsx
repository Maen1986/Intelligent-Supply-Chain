/**
 * PrepareDownloadModal — duplicate-key de-duplication guard (Task 609).
 *
 * Confirms that clicking "Create a new key for this template" shows an error
 * message instead of creating a new key when a non-revoked key with the same
 * label ("Template: <name>") already exists in the loaded list.
 *
 * Also confirms the happy path: when NO existing key has that label, the
 * create-key fetch is attempted (i.e. the guard does not fire falsely).
 */
import React from 'react';
import { render, fireEvent, cleanup, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

import { PrepareDownloadModal } from '../AdminAutomations';

/* ── Minimal TemplateManifestItem fixture ──────────────────────────────── */
const TEMPLATE = {
  id: 'kpi-breach-alert',
  name: 'KPI Breach Alert',
  platform: 'n8n' as const,
  description: 'Fires when a KPI breaches its threshold',
  webhookEvent: 'kpi.threshold_breach',
  nodes: [],
  setupSteps: [],
  fileUrl: '/templates/n8n/kpi-breach-alert.json',
  previewImageUrl: '',
};

/** An existing key with the same label that the modal would create. */
const EXISTING_KEY = {
  id: 1,
  nameLabel: 'Template: KPI Breach Alert',
  keyPrefix: 'isc_test_',
  scope: 'read' as const,
  revokedAt: null,
};

/** An existing key with a different label — should NOT trigger the guard. */
const OTHER_KEY = {
  id: 2,
  nameLabel: 'Template: Some Other Template',
  keyPrefix: 'isc_other_',
  scope: 'read' as const,
  revokedAt: null,
};

/** A key with the same label but already revoked — should NOT trigger the guard. */
const REVOKED_DUPE_KEY = {
  id: 3,
  nameLabel: 'Template: KPI Breach Alert',
  keyPrefix: 'isc_rev_',
  scope: 'read' as const,
  revokedAt: '2025-01-01T00:00:00Z',
};

function stubFetchWithKeys(keys: typeof EXISTING_KEY[]) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('/integrations/keys')) {
      return {
        ok: true,
        json: async () => ({ ok: true, keys }),
      };
    }
    return { ok: true, json: async () => ({}) };
  }));
}

describe('PrepareDownloadModal — duplicate-key guard (Task 609)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
  });

  it('shows a duplicate-key error and does NOT call POST /integrations/keys when a matching active key already exists', async () => {
    stubFetchWithKeys([EXISTING_KEY]);

    const { container } = render(
      <PrepareDownloadModal template={TEMPLATE} ar={false} onClose={vi.fn()} />,
    );

    // Let the initial GET /integrations/keys resolve and populate the state.
    await act(async () => { vi.runAllTimers(); });

    const fetchMock = vi.mocked(fetch);
    const callCountBefore = fetchMock.mock.calls.length;

    // Click the "Create a new key" button.
    const createBtn = screen.getByRole('button', { name: /create a new key/i });
    fireEvent.click(createBtn);

    // An error about the duplicate should now be visible.
    expect(container.textContent).toContain('already exists');
    expect(container.textContent).toContain('Template: KPI Breach Alert');

    // No new fetch calls should have been made (guard aborted before the POST).
    expect(fetchMock.mock.calls.length).toBe(callCountBefore);
  });

  it('shows the Arabic duplicate-key error when ar=true', async () => {
    stubFetchWithKeys([EXISTING_KEY]);

    render(<PrepareDownloadModal template={TEMPLATE} ar={true} onClose={vi.fn()} />);

    await act(async () => { vi.runAllTimers(); });

    const createBtn = screen.getByRole('button', { name: /إنشاء مفتاح جديد/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/مفتاح بهذا الاسم موجود بالفعل/)).toBeInTheDocument();
  });

  it('does NOT fire the duplicate guard when the matching key is revoked', async () => {
    stubFetchWithKeys([REVOKED_DUPE_KEY]);

    const fetchMock = vi.mocked(fetch);
    // Intercept the POST /integrations/keys call and return a success.
    fetchMock.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method === 'POST' && String(url).includes('/integrations/keys')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            key: { id: 99, nameLabel: 'Template: KPI Breach Alert', keyPrefix: 'isc_new_', scope: 'read', rawKey: 'isc_new_rawkey' },
          }),
        } as Response;
      }
      // fallback — initial keys list
      return {
        ok: true,
        json: async () => ({ ok: true, keys: [REVOKED_DUPE_KEY] }),
      } as Response;
    });

    render(<PrepareDownloadModal template={TEMPLATE} ar={false} onClose={vi.fn()} />);

    await act(async () => { vi.runAllTimers(); });

    const createBtn = screen.getByRole('button', { name: /create a new key/i });
    await act(async () => { fireEvent.click(createBtn); });

    // The POST should have been called (guard did not block it).
    const postCalls = fetchMock.mock.calls.filter(
      ([u, o]) => (o as RequestInit)?.method === 'POST' && String(u).includes('/integrations/keys'),
    );
    expect(postCalls.length).toBe(1);

    // No "already exists" error rendered.
    expect(screen.queryByText(/already exists/i)).toBeNull();
  });

  it('does NOT fire the duplicate guard when only a different-label key exists', async () => {
    stubFetchWithKeys([OTHER_KEY]);

    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method === 'POST' && String(url).includes('/integrations/keys')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            key: { id: 88, nameLabel: 'Template: KPI Breach Alert', keyPrefix: 'isc_n_', scope: 'read', rawKey: 'isc_n_rawkey' },
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ ok: true, keys: [OTHER_KEY] }),
      } as Response;
    });

    render(<PrepareDownloadModal template={TEMPLATE} ar={false} onClose={vi.fn()} />);

    await act(async () => { vi.runAllTimers(); });

    const createBtn = screen.getByRole('button', { name: /create a new key/i });
    await act(async () => { fireEvent.click(createBtn); });

    const postCalls = fetchMock.mock.calls.filter(
      ([u, o]) => (o as RequestInit)?.method === 'POST' && String(u).includes('/integrations/keys'),
    );
    expect(postCalls.length).toBe(1);
    expect(screen.queryByText(/already exists/i)).toBeNull();
  });
});
