/**
 * AuthContext — updateProfile tests
 *
 * Confirms the two behaviours required by the task:
 *  1. A successful updateProfile call updates the local user state so the
 *     Header (and other consumers) immediately reflect the new name without
 *     a page reload.
 *  2. A failed (non-ok or throws) updateProfile call throws an error and
 *     leaves the user state unchanged.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

/* ── Silence the /auth/me bootstrap fetch that runs on mount ────────────── */
vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Wrapper that provides the real AuthProvider so useAuth has a real context. */
function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/**
 * Stub global fetch so that:
 *  - The first call (GET /auth/me on mount) returns a logged-in user.
 *  - The second call (POST /auth/update-profile) returns the value specified
 *    by `updateResponse`.
 */
function stubFetchWithUser(
  initialUser: object,
  updateResponse: { ok: boolean; json: () => Promise<object> } | 'network-error',
) {
  const fetchMock = vi.fn();

  // Bootstrap: /auth/me returns the initial user
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, user: initialUser }),
  });

  if (updateResponse === 'network-error') {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
  } else {
    fetchMock.mockResolvedValueOnce(updateResponse);
  }

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Wait for the bootstrap /auth/me to resolve and populate user state. */
async function waitForBootstrap(result: { current: ReturnType<typeof useAuth> }) {
  // loading starts true; after the /auth/me fetch it becomes false
  await act(async () => {
    await vi.waitFor(() => result.current.loading === false);
  });
}

/* ── lifecycle ────────────────────────────────────────────────────────────── */

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Successful update reflects in user state immediately
══════════════════════════════════════════════════════════════════════════ */

describe('updateProfile — successful response', () => {
  const INITIAL_USER = {
    id: 42,
    fullName: 'Alice Smith',
    email: 'alice@example.com',
    mobile: null,
    designation: null,
    company: null,
    role: 'user',
  };

  const UPDATED_USER = {
    ...INITIAL_USER,
    fullName: 'Alice Jones',
    mobile: '+1234567890',
    designation: 'Engineer',
    company: 'Acme Corp',
  };

  it('updates user.fullName in context so the Header re-renders with the new name', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: true,
      json: async () => ({ ok: true, user: UPDATED_USER }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    expect(result.current.user?.fullName).toBe('Alice Smith');

    await act(async () => {
      await result.current.updateProfile({
        fullName:    'Alice Jones',
        mobile:      '+1234567890',
        designation: 'Engineer',
        company:     'Acme Corp',
      });
    });

    expect(result.current.user?.fullName).toBe('Alice Jones');
  });

  it('updates all returned profile fields (mobile, designation, company) at once', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: true,
      json: async () => ({ ok: true, user: UPDATED_USER }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    await act(async () => {
      await result.current.updateProfile({
        fullName:    'Alice Jones',
        mobile:      '+1234567890',
        designation: 'Engineer',
        company:     'Acme Corp',
      });
    });

    expect(result.current.user?.mobile).toBe('+1234567890');
    expect(result.current.user?.designation).toBe('Engineer');
    expect(result.current.user?.company).toBe('Acme Corp');
  });

  it('preserves unchanged fields (id, email, role) after a profile update', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: true,
      json: async () => ({ ok: true, user: UPDATED_USER }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    await act(async () => {
      await result.current.updateProfile({
        fullName:    'Alice Jones',
        mobile:      null,
        designation: null,
        company:     null,
      });
    });

    expect(result.current.user?.id).toBe(42);
    expect(result.current.user?.email).toBe('alice@example.com');
    expect(result.current.user?.role).toBe('user');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Failed update throws and leaves user state unchanged
══════════════════════════════════════════════════════════════════════════ */

describe('updateProfile — failed response', () => {
  const INITIAL_USER = {
    id: 7,
    fullName: 'Bob Brown',
    email: 'bob@example.com',
    mobile: null,
    designation: null,
    company: null,
    role: 'user',
  };

  it('throws when the server returns ok:false and does not change user state', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: false,
      json: async () => ({ ok: false, error: 'Validation failed' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    expect(result.current.user?.fullName).toBe('Bob Brown');

    await act(async () => {
      await expect(
        result.current.updateProfile({
          fullName:    'Bob Updated',
          mobile:      null,
          designation: null,
          company:     null,
        }),
      ).rejects.toThrow('Validation failed');
    });

    // User state must be unchanged
    expect(result.current.user?.fullName).toBe('Bob Brown');
  });

  it('throws when the HTTP status is non-ok even if ok:true in body and leaves state unchanged', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: false,
      json: async () => ({ ok: true }), // body claims ok but HTTP status says otherwise
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    await act(async () => {
      await expect(
        result.current.updateProfile({
          fullName:    'Bob Updated',
          mobile:      null,
          designation: null,
          company:     null,
        }),
      ).rejects.toThrow();
    });

    expect(result.current.user?.fullName).toBe('Bob Brown');
  });

  it('uses the server error message in the thrown error', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: false,
      json: async () => ({ ok: false, error: 'Name too short' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    await act(async () => {
      await expect(
        result.current.updateProfile({
          fullName:    'B',
          mobile:      null,
          designation: null,
          company:     null,
        }),
      ).rejects.toThrow('Name too short');
    });
  });

  it('falls back to a default error message when the server sends no error field', async () => {
    stubFetchWithUser(INITIAL_USER, {
      ok: false,
      json: async () => ({ ok: false }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForBootstrap(result);

    await act(async () => {
      await expect(
        result.current.updateProfile({
          fullName:    'Bob Updated',
          mobile:      null,
          designation: null,
          company:     null,
        }),
      ).rejects.toThrow('Could not update profile.');
    });
  });
});
