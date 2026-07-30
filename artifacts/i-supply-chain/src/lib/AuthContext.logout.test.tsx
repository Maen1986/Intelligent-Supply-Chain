/**
 * AuthContext — logout sessionStorage cleanup tests (Task 765)
 *
 * Confirms that calling logout() wipes ALL pendingAIPlan_* keys from
 * sessionStorage, regardless of how many tool keys are present and
 * regardless of which useAIPlan hook instances are currently mounted.
 *
 * This is the guaranteed cleanup boundary for cross-user isolation.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Stub fetch so that:
 *   1st call  → GET /auth/me returns a logged-in user (bootstrap)
 *   2nd call  → POST /auth/logout returns ok
 */
function stubFetchForLogout(user = { id: 1, fullName: 'User A', email: 'a@test.com', role: 'user' }) {
  const fetchMock = vi.fn();
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, user }),
  });
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Wait for the AuthProvider bootstrap /auth/me to complete. */
async function waitForBootstrap(result: { current: ReturnType<typeof useAuth> }) {
  await act(async () => {
    await vi.waitFor(() => result.current.loading === false, { timeout: 3000 });
  });
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Single pending flag is wiped on logout
══════════════════════════════════════════════════════════════════════════ */
describe('AuthContext.logout — single pendingAIPlan_ key is removed', () => {
  it('removes a single pendingAIPlan_<toolKey> key from sessionStorage on logout', async () => {
    stubFetchForLogout();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    // Plant a flag while authenticated
    sessionStorage.setItem('pendingAIPlan_risk', '1');
    expect(sessionStorage.getItem('pendingAIPlan_risk')).toBe('1');

    // Log out
    await act(async () => { await result.current.logout(); });

    expect(sessionStorage.getItem('pendingAIPlan_risk')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Multiple pending flags across different tool keys are ALL wiped
══════════════════════════════════════════════════════════════════════════ */
describe('AuthContext.logout — all pendingAIPlan_* keys are removed globally', () => {
  it('removes every pendingAIPlan_* key regardless of how many tool keys exist', async () => {
    stubFetchForLogout();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    // Plant flags for multiple tool keys (simulates several tool pages visited)
    const keys = ['pendingAIPlan_risk', 'pendingAIPlan_supplier', 'pendingAIPlan_clm', 'pendingAIPlan_maturity'];
    keys.forEach(k => sessionStorage.setItem(k, '1'));
    // Also plant an unrelated key — it must survive
    sessionStorage.setItem('isc-lang', 'ar');

    // Log out
    await act(async () => { await result.current.logout(); });

    // All pending-plan flags are gone
    keys.forEach(k => {
      expect(sessionStorage.getItem(k)).toBeNull();
    });

    // Unrelated key is untouched
    expect(sessionStorage.getItem('isc-lang')).toBe('ar');
  });

  it('removes pendingAIPlan_* keys even when no useAIPlan hook is mounted at logout time', async () => {
    stubFetchForLogout();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    // No useAIPlan hook instances mounted — plant flags directly
    sessionStorage.setItem('pendingAIPlan_kri', '1');
    sessionStorage.setItem('pendingAIPlan_weekly', '1');

    await act(async () => { await result.current.logout(); });

    expect(sessionStorage.getItem('pendingAIPlan_kri')).toBeNull();
    expect(sessionStorage.getItem('pendingAIPlan_weekly')).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. Logout with no pending flags present — no crash
══════════════════════════════════════════════════════════════════════════ */
describe('AuthContext.logout — no crash when no pending flags exist', () => {
  it('does not throw when sessionStorage has no pendingAIPlan_* keys at logout', async () => {
    stubFetchForLogout();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    // No flags planted
    expect(sessionStorage.getItem('pendingAIPlan_risk')).toBeNull();

    await expect(
      act(async () => { await result.current.logout(); }),
    ).resolves.not.toThrow();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. isAuthenticated becomes false after logout (state cleanup)
══════════════════════════════════════════════════════════════════════════ */
describe('AuthContext.logout — auth state is cleared', () => {
  it('sets isAuthenticated to false after logout', async () => {
    stubFetchForLogout();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => { await result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
