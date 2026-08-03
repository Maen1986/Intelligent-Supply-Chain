/**
 * Task 431 — Confirm the pending-plan sessionStorage flag is removed from
 * sessionStorage when the user authenticates (isAuthenticated transitions
 * false → true), regardless of whether canGenerate is true or false.
 *
 * The removal happens in useAIPlan's Effect B (src/hooks/useAIPlan.ts line ~96-125).
 * Tests verify:
 *   1. Flag is removed when canGenerate is true (deferred generate path).
 *   2. Flag is removed when canGenerate is false (discard path — form not ready).
 *   3. Flag for a DIFFERENT toolKey is NOT removed (bucket isolation).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIPlan } from './useAIPlan';

/* ── Auth mock ─────────────────────────────────────────────────────────────── */
const mockUseAuth = vi.fn();
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

function fakeAuth(isAuthenticated: boolean) {
  mockUseAuth.mockReturnValue({
    isAuthenticated,
    user: isAuthenticated ? { id: 1 } : null,
    loading: false,
  });
}

/* ── Silence outbound fetch calls ──────────────────────────────────────────── */
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, plan: null }),
    text: async () => '',
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

const PROMPT_FN = () => 'test prompt';

describe('useAIPlan — pending-plan sessionStorage flag is removed after login (Task 431)', () => {
  it('removes the flag on false→true auth transition when canGenerate is true', async () => {
    const TOOL_KEY = 'scorecard-s1';
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    fakeAuth(false);
    const { rerender } = renderHook(
      () => useAIPlan(PROMPT_FN, false, TOOL_KEY, /* canGenerate */ true),
    );

    // Simulate login
    fakeAuth(true);
    await act(async () => { rerender(); });

    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();
  });

  it('removes the flag on false→true auth transition even when canGenerate is false', async () => {
    const TOOL_KEY = 'scorecard-s2';
    sessionStorage.setItem(`pendingAIPlan_${TOOL_KEY}`, '1');

    fakeAuth(false);
    const { rerender } = renderHook(
      () => useAIPlan(PROMPT_FN, false, TOOL_KEY, /* canGenerate */ false),
    );

    fakeAuth(true);
    await act(async () => { rerender(); });

    expect(sessionStorage.getItem(`pendingAIPlan_${TOOL_KEY}`)).toBeNull();
  });

  it('does NOT remove a flag for a different toolKey', async () => {
    const TOOL_KEY   = 'scorecard-s3';
    const OTHER_KEY  = 'scorecard-other';
    sessionStorage.setItem(`pendingAIPlan_${OTHER_KEY}`, '1');

    fakeAuth(false);
    const { rerender } = renderHook(
      () => useAIPlan(PROMPT_FN, false, TOOL_KEY, true),
    );

    fakeAuth(true);
    await act(async () => { rerender(); });

    // The flag for a different tool must remain untouched
    expect(sessionStorage.getItem(`pendingAIPlan_${OTHER_KEY}`)).toBe('1');
  });
});
