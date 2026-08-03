/**
 * SupplierScorecard — stale in-flight bootstrap guard (Task 379).
 *
 * Confirms that if the user switches accounts before the roster GET resolves,
 * the stale response from user A is silently discarded and does NOT overwrite
 * the already-settled roster for user B.
 *
 * Before Task 379 the bootstrapUserId capture was missing so user A's GET
 * could clobber user B's state even though serverLoadedForUserId.current had
 * already been updated to user B's id.
 */
import React from 'react';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('sonner',           () => ({ toast: { error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() } }));
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn(), t: (k: string) => k }),
}));

/* ── controllable AuthContext ──────────────────────────────────────────── */
const mockUser: { value: { id: number; name: string } | null } = { value: null };
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser.value,
    isAuthenticated: !!mockUser.value,
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

const ROSTER_KEY = 'isc-scorecard-roster';

const ROSTER_USER_A = {
  suppliers: [{ id: 'sa-1', name: 'User A Supplier', tier: 'Strategic', subScores: {} }],
  lastSyncAt: null,
};
const ROSTER_USER_B = {
  suppliers: [{ id: 'sb-1', name: 'User B Supplier', tier: 'Preferred', subScores: {} }],
  lastSyncAt: null,
};

describe('SupplierScorecard — stale in-flight bootstrap guard (Task 379)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    mockUser.value = null;
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    cleanup();
  });

  it('discards a stale GET response that arrives after the user has switched accounts', async () => {
    // ── Set up a two-phase fetch: user A's GET is deferred; user B's resolves immediately ──
    let resolveUserAGet!: (r: Response) => void;
    const userAGetPromise = new Promise<Response>(res => { resolveUserAGet = res; });

    const fetchMock = vi.fn()
      // User A bootstrap: roster GET (deferred) + config GET (immediate)
      .mockImplementationOnce(() => userAGetPromise)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, config: null }) } as unknown as Response)
      // User B bootstrap: roster GET (immediate, user B data) + config GET
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, roster: ROSTER_USER_B }),
      } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, config: null }) } as unknown as Response)
      // Any subsequent PUT calls
      .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    // Mount with user A
    mockUser.value = { id: 1, name: 'User A' };
    const { rerender } = render(<SupplierScorecardTool isAr={false} />);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Switch to user B before A's GET resolves
    mockUser.value = { id: 2, name: 'User B' };
    rerender(<SupplierScorecardTool isAr={false} />);
    await act(async () => { await vi.runAllTimersAsync(); });

    // Now user B's bootstrap has settled — B's supplier should be visible
    expect(screen.getByText('User B Supplier')).toBeInTheDocument();
    expect(screen.queryByText('User A Supplier')).toBeNull();

    // Resolve user A's stale GET — should be discarded
    await act(async () => {
      resolveUserAGet({
        ok: true,
        json: async () => ({ ok: true, roster: ROSTER_USER_A }),
      } as unknown as Response);
      await vi.runAllTimersAsync();
    });

    // User B's supplier must still be shown; user A's must NOT have clobbered it
    expect(screen.getByText('User B Supplier')).toBeInTheDocument();
    expect(screen.queryByText('User A Supplier')).toBeNull();
  });
});
