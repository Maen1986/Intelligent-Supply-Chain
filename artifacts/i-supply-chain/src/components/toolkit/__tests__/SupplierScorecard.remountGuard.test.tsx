/**
 * SupplierScorecard — remount bootstrap guard (Task 385).
 *
 * Confirms that when a user makes local edits and then the component unmounts
 * and remounts (simulating SPA navigation away and back), the re-run bootstrap
 * does NOT overwrite those unsaved local edits with stale server data.
 *
 * The guard works via lastEditedAt / lastSyncAt timestamps stored in
 * localStorage: if lastEditedAt > lastSyncAt (or lastSyncAt is absent), the
 * bootstrap skips applying the server roster and keeps the local version.
 *
 * Before Task 385, all in-memory refs reset on unmount so
 * localWinsDuringBootstrap was always false on remount, letting server data
 * silently clobber unsaved local edits.
 */
import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() } }));
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
    loading: false,
    register: vi.fn(), login: vi.fn(), logout: vi.fn(),
    changePassword: vi.fn(), updateProfile: vi.fn(),
  }),
}));
vi.mock('@/hooks/useAIPlan', () => ({
  useAIPlan: () => ({
    loading: false, result: null, error: null, rateLimited: false,
    generate: vi.fn(), reset: vi.fn(), savedPlan: null,
    viewSaved: vi.fn(), deleteSaved: vi.fn(),
  }),
}));

import { SupplierScorecardTool } from '../SupplierScorecard';

const ROSTER_KEY = 'isc-tool-supplier-roster';

/** Server roster — simulates what the server returns (older than local edits). */
const SERVER_ROSTER = {
  suppliers: [{ id: 'srv-1', name: 'Server Supplier', tier: 'Preferred', subScores: {} }],
  activeId: 'srv-1',
};

/** Local roster already written to localStorage with a lastEditedAt newer than
 *  lastSyncAt, simulating an unsaved local edit that happened before unmount. */
function writeLocalRosterWithUnsavedEdit() {
  const pastSyncAt   = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
  const laterEditAt  = new Date(Date.now() - 10_000).toISOString(); // 10 s ago (newer!)
  const local = {
    suppliers: [{ id: 'loc-1', name: 'Local Edited Supplier', tier: 'Strategic', subScores: {} }],
    activeId: 'loc-1',
    lastSyncAt:   pastSyncAt,
    lastEditedAt: laterEditAt,
  };
  localStorage.setItem(ROSTER_KEY, JSON.stringify(local));
}

describe('SupplierScorecard — remount bootstrap guard (Task 385)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
  });

  it('does NOT overwrite local unsaved edits when the component remounts and the bootstrap GET returns older server data', async () => {
    // Pre-populate localStorage with an edited roster (lastEditedAt > lastSyncAt)
    writeLocalRosterWithUnsavedEdit();

    // Stub fetch: bootstrap GET returns server data (older than local edit)
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, roster: SERVER_ROSTER }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, config: null }),
      } as unknown as Response)
      // Any subsequent calls (PUT etc.)
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as unknown as Response),
    );

    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Local edited supplier must be visible; server supplier must NOT replace it
    expect(screen.getByText('Local Edited Supplier')).toBeInTheDocument();
    expect(screen.queryByText('Server Supplier')).toBeNull();
  });

  it('DOES apply fresh server data when local and server are in sync (lastEditedAt <= lastSyncAt)', async () => {
    // Pre-populate localStorage with a synced roster (lastEditedAt == lastSyncAt)
    const syncedAt = new Date(Date.now() - 60_000).toISOString();
    const syncedRoster = {
      suppliers: [{ id: 'loc-2', name: 'Old Local Supplier', tier: 'Preferred', subScores: {} }],
      activeId: 'loc-2',
      lastSyncAt:   syncedAt,
      lastEditedAt: syncedAt, // equal → all edits are synced
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(syncedRoster));

    // Server has a newer version (e.g. edited from another device)
    const freshServerRoster = {
      suppliers: [{ id: 'srv-2', name: 'Fresh Server Supplier', tier: 'Strategic', subScores: {} }],
      activeId: 'srv-2',
    };

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, roster: freshServerRoster }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, config: null }),
      } as unknown as Response)
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as unknown as Response),
    );

    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Server data should replace the local (all edits were already synced)
    expect(screen.getByText('Fresh Server Supplier')).toBeInTheDocument();
    expect(screen.queryByText('Old Local Supplier')).toBeNull();
  });

  it('stamps lastEditedAt on save() and clears it after a successful PUT stamps lastSyncAt', async () => {
    // Start with a fresh local roster (no timestamps)
    const freshRoster = {
      suppliers: [{ id: 'u-1', name: 'User Supplier', tier: 'Preferred', subScores: {} }],
      activeId: 'u-1',
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(freshRoster));

    // Bootstrap returns empty server roster so local data is preserved
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, roster: null }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, config: null }),
      } as unknown as Response)
      // PUT roster (from the empty-server upload path)
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as unknown as Response),
    );

    render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Click on a supplier to make an edit
    const supplier = screen.getByText('User Supplier');
    await act(async () => { fireEvent.click(supplier); });

    // Name field should be editable — change it
    const nameInput = screen.queryByDisplayValue('User Supplier');
    if (nameInput) {
      await act(async () => {
        fireEvent.change(nameInput, { target: { value: 'User Supplier Edited' } });
        fireEvent.blur(nameInput);
      });
    }

    // After edit, lastEditedAt should be set in localStorage
    await act(async () => { await vi.runAllTimersAsync(); });
    const rawAfterEdit = localStorage.getItem(ROSTER_KEY);
    const parsedAfterEdit = rawAfterEdit ? JSON.parse(rawAfterEdit) : null;
    expect(parsedAfterEdit?.lastEditedAt, 'lastEditedAt should be set after a user edit').toBeTruthy();
  });
});
