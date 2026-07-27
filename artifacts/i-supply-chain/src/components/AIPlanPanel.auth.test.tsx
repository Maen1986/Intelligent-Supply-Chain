/**
 * Task 175 — Confirm the Generate button reappears instantly after login
 * without a page refresh.
 *
 * Task 184 — Confirm the Generate button stays hidden during the initial
 * auth-loading phase so it never flickers on cold load.
 *
 * Task 318 — Confirm the sign-in prompt disappears if the user navigates back
 * after logging in from another tab (visibilitychange-based re-validation).
 *
 * Covers:
 *  - Logged-out state: sign-in prompt is visible, Generate button is absent
 *  - Logged-in state: Generate button is visible, sign-in prompt is absent
 *  - Login transition: after setUser() fires, Generate button appears without unmount/remount
 *  - Logout transition: after setUser(null) fires, sign-in prompt reappears without unmount/remount
 *  - Arabic locale: both states show the correct localised text
 *  - Auth-loading phase: neither Generate button nor sign-in prompt is shown while loading
 *  - Loading → authenticated: Generate button appears after loading resolves
 *  - Loading → unauthenticated: sign-in prompt appears after loading resolves (not authenticated)
 *  - Cross-tab login: panel switches from sign-in prompt to Generate button when
 *    visibilitychange fires and the session re-check now returns a valid user
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AIPlanPanel } from './AIPlanPanel';
import * as AuthContextModule from '@/lib/AuthContext';
import { AuthProvider } from '@/lib/AuthContext';

afterEach(() => {
  cleanup();
});

// ─── Controllable auth wrapper ────────────────────────────────────────────────
// We wrap AIPlanPanel with a thin provider whose `isAuthenticated` value can
// be flipped at runtime — simulating what happens when login() calls setUser().

interface FakeAuthState {
  isAuthenticated: boolean;
  user: null | { id: number; fullName: string; email: string; mobile: null; designation: null; company: null; role: string };
  loading: boolean;
  register: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  changePassword: () => Promise<void>;
  updateProfile: () => Promise<void>;
}

// A component that renders AIPlanPanel and exposes a setter so tests can flip auth
function AuthFlipHarness({
  initialAuth,
  isAr = false,
  onFlipRef,
}: {
  initialAuth: boolean;
  isAr?: boolean;
  onFlipRef: React.MutableRefObject<((v: boolean) => void) | null>;
}) {
  const [authed, setAuthed] = useState(initialAuth);

  // Expose the setter so tests can call it outside React
  onFlipRef.current = setAuthed;

  const fakeAuth: FakeAuthState = {
    isAuthenticated: authed,
    user: authed
      ? { id: 1, fullName: 'Test User', email: 'test@example.com', mobile: null, designation: null, company: null, role: 'user' }
      : null,
    loading: false,
    register:       async () => {},
    login:          async () => {},
    logout:         async () => {},
    changePassword: async () => {},
    updateProfile:  async () => {},
  };

  // Spy on useAuth so AIPlanPanel picks up the fake value
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(fakeAuth);

  return (
    <AIPlanPanel
      loading={false}
      result={null}
      error={null}
      onGenerate={vi.fn()}
      onReset={vi.fn()}
      buttonLabel="Generate Plan ✨"
      isAr={isAr}
    />
  );
}

// ─── Auth-loading phase harness ───────────────────────────────────────────────
// Simulates the cold-load lifecycle: authLoading starts true, then resolves to
// either authenticated or unauthenticated.

interface LoadingFlipState {
  authLoading: boolean;
  isAuthenticated: boolean;
}

function AuthLoadingHarness({
  initialState,
  isAr = false,
  onFlipRef,
}: {
  initialState: LoadingFlipState;
  isAr?: boolean;
  onFlipRef: React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
}) {
  const [state, setState] = useState(initialState);

  onFlipRef.current = setState;

  const fakeAuth: FakeAuthState = {
    isAuthenticated: state.isAuthenticated,
    user: state.isAuthenticated
      ? { id: 1, fullName: 'Test User', email: 'test@example.com', mobile: null, designation: null, company: null, role: 'user' }
      : null,
    loading: state.authLoading,
    register:       async () => {},
    login:          async () => {},
    logout:         async () => {},
    changePassword: async () => {},
    updateProfile:  async () => {},
  };

  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(fakeAuth);

  return (
    <AIPlanPanel
      loading={false}
      result={null}
      error={null}
      onGenerate={vi.fn()}
      onReset={vi.fn()}
      buttonLabel="Generate Plan ✨"
      isAr={isAr}
    />
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AIPlanPanel — auth-driven Generate button visibility', () => {
  // ── Logged-out baseline ───────────────────────────────────────────────────

  it('shows sign-in prompt when user is not authenticated (EN)', () => {
    const ref = React.createRef() as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={false} onFlipRef={ref} />);

    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });

  it('shows sign-in prompt in Arabic when unauthenticated (AR)', () => {
    const ref = React.createRef() as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={false} isAr={true} onFlipRef={ref} />);

    expect(screen.getByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });

  // ── Logged-in baseline ────────────────────────────────────────────────────

  it('shows Generate button when user is already authenticated (EN)', () => {
    const ref = React.createRef() as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={true} onFlipRef={ref} />);

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();
  });

  it('shows Generate button when user is already authenticated (AR)', () => {
    const ref = React.createRef() as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={true} isAr={true} onFlipRef={ref} />);

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();
  });

  // ── Login transition (the core requirement) ───────────────────────────────

  it('replaces sign-in prompt with Generate button instantly on login — no remount needed (EN)', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={false} onFlipRef={ref} />);

    // Verify initial state: sign-in prompt visible
    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();

    // Simulate login: flip auth state (equivalent to login() → setUser(data.user))
    await act(async () => { ref.current!(true); });

    // Generate button must appear — sign-in prompt must disappear — no refresh
    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();
  });

  it('replaces sign-in prompt with Generate button instantly on login — no remount needed (AR)', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={false} isAr={true} onFlipRef={ref} />);

    expect(screen.getByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();

    await act(async () => { ref.current!(true); });

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();
  });

  // ── Logout transition ─────────────────────────────────────────────────────

  it('replaces Generate button with sign-in prompt instantly on logout (EN)', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={true} onFlipRef={ref} />);

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();

    // Simulate logout: flip auth to false (equivalent to logout() → setUser(null))
    await act(async () => { ref.current!(false); });

    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });

  it('replaces Generate button with sign-in prompt instantly on logout (AR)', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={true} isAr={true} onFlipRef={ref} />);

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();

    await act(async () => { ref.current!(false); });

    expect(screen.getByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });

  // ── Generate button is enabled/clickable when authenticated ───────────────

  it('Generate button is not disabled by default when authenticated', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<AuthFlipHarness initialAuth={true} onFlipRef={ref} />);

    const btn = screen.getByText('Generate Plan ✨').closest('button');
    expect(btn).toBeTruthy();
    expect(btn?.disabled).toBe(false);
  });
});

// ─── Auth-loading phase tests ─────────────────────────────────────────────────

describe('AIPlanPanel — auth-loading phase (cold load)', () => {
  // ── While loading: nothing rendered ──────────────────────────────────────

  it('shows neither Generate button nor sign-in prompt while auth is loading (EN)', () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        onFlipRef={ref}
      />,
    );

    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();
  });

  it('shows neither Generate button nor sign-in prompt while auth is loading (AR)', () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        isAr={true}
        onFlipRef={ref}
      />,
    );

    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();
  });

  // ── Loading → authenticated: Generate button appears ─────────────────────

  it('shows Generate button (not sign-in prompt) after loading resolves to authenticated (EN)', async () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        onFlipRef={ref}
      />,
    );

    // Sanity: nothing visible while loading
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();

    // Auth check resolves — user is logged in
    await act(async () => {
      ref.current!({ authLoading: false, isAuthenticated: true });
    });

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();
  });

  it('shows Generate button (not sign-in prompt) after loading resolves to authenticated (AR)', async () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        isAr={true}
        onFlipRef={ref}
      />,
    );

    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();

    await act(async () => {
      ref.current!({ authLoading: false, isAuthenticated: true });
    });

    expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();
  });

  // ── Loading → unauthenticated: sign-in prompt appears ────────────────────

  it('shows sign-in prompt (not Generate button) after loading resolves to unauthenticated (EN)', async () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        onFlipRef={ref}
      />,
    );

    // Sanity: nothing visible while loading
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();

    // Auth check resolves — no session found
    await act(async () => {
      ref.current!({ authLoading: false, isAuthenticated: false });
    });

    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });

  it('shows sign-in prompt (not Generate button) after loading resolves to unauthenticated (AR)', async () => {
    const ref = { current: null } as React.MutableRefObject<((s: LoadingFlipState) => void) | null>;
    render(
      <AuthLoadingHarness
        initialState={{ authLoading: true, isAuthenticated: false }}
        isAr={true}
        onFlipRef={ref}
      />,
    );

    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();

    await act(async () => {
      ref.current!({ authLoading: false, isAuthenticated: false });
    });

    expect(screen.getByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });
});

// ─── Sign-in button pending-plan flag tests ───────────────────────────────────

/** Render AIPlanPanel in unauthenticated state with an optional toolKey */
function renderUnauthenticated(toolKey?: string) {
  const fakeAuth = {
    isAuthenticated: false,
    user: null,
    loading: false,
    register:       async () => {},
    login:          async () => {},
    logout:         async () => {},
    changePassword: async () => {},
    updateProfile:  async () => {},
  };
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(fakeAuth);

  render(
    <AIPlanPanel
      loading={false}
      result={null}
      error={null}
      onGenerate={vi.fn()}
      onReset={vi.fn()}
      buttonLabel="Generate Plan ✨"
      isAr={false}
      toolKey={toolKey}
    />,
  );
}

describe('AIPlanPanel — sign-in button sets pending-plan sessionStorage flag', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.clear();
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    sessionStorage.clear();
    cleanup();
  });

  it('sets pendingAIPlan_<toolKey> = "1" in sessionStorage when toolKey is provided', () => {
    renderUnauthenticated('supplierPlan');

    const btn = screen.getByText('Sign in to generate an AI plan').closest('button')!;
    fireEvent.click(btn);

    expect(setItemSpy).toHaveBeenCalledWith('pendingAIPlan_supplierPlan', '1');
  });

  it('does NOT call sessionStorage.setItem when no toolKey is provided', () => {
    renderUnauthenticated(/* no toolKey */);

    const btn = screen.getByText('Sign in to generate an AI plan').closest('button')!;
    fireEvent.click(btn);

    // setItem may be called for other reasons (e.g. wouter) but never for a pendingAIPlan_ key
    const pendingCalls = setItemSpy.mock.calls.filter(([key]) =>
      typeof key === 'string' && key.startsWith('pendingAIPlan_'),
    );
    expect(pendingCalls).toHaveLength(0);
  });
});

// ─── Cross-tab login tests (Task 318) ─────────────────────────────────────────
//
// Scenario: user has two tabs open. On Tab A they are unauthenticated — the panel
// shows the sign-in prompt. They log in on Tab B. When they switch back to Tab A
// the document fires a `visibilitychange` event. AuthContext re-validates the
// session via /auth/me, finds a valid user, and updates state. AIPlanPanel must
// switch from sign-in prompt to Generate button — no page reload required.
//
// We use the real AuthProvider (not a useAuth mock) so the visibilitychange
// listener added to AuthContext is exercised end-to-end.

/** Simulate the document becoming visible (user switching to this tab). */
function fireVisibilityChange(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

/** A minimal fake authenticated user returned by /auth/me */
const FAKE_USER = {
  id: 1, fullName: 'Tab User', email: 'tab@example.com',
  mobile: null, designation: null, company: null, role: 'user',
};

/** Build a Response as /auth/me would return it */
function makeMeResponse(authed: boolean) {
  return new Response(
    JSON.stringify(authed ? { ok: true, user: FAKE_USER } : { ok: false }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  ) as unknown as Response;
}

describe('AIPlanPanel — cross-tab login via visibilitychange (Task 318)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Earlier suites mock `useAuth` via vi.spyOn and never restore the spy.
    // Restore all mocks so the real AuthProvider context flows through to
    // AIPlanPanel — otherwise AIPlanPanel.useAuth() returns stale fake data.
    vi.restoreAllMocks();
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    cleanup();
    // Restore visibilityState to 'visible' (jsdom default)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  /**
   * Render AIPlanPanel inside the real AuthProvider with fetch responses
   * pre-queued: first call (mount) → not authenticated, subsequent calls
   * (e.g. visibilitychange) → authenticated.
   */
  function renderWithRealAuth(isAr = false) {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
      // Mount-time /auth/me → no session
      .mockResolvedValueOnce(makeMeResponse(false))
      // visibilitychange /auth/me → valid session (user logged in on another tab)
      .mockResolvedValueOnce(makeMeResponse(true))
      // Any extra calls (e.g. hidden-tab test) → still no session
      .mockResolvedValue(makeMeResponse(false));

    return render(
      <AuthProvider>
        <AIPlanPanel
          loading={false}
          result={null}
          error={null}
          onGenerate={vi.fn()}
          onReset={vi.fn()}
          buttonLabel="Generate Plan ✨"
          isAr={isAr}
        />
      </AuthProvider>,
    );
  }

  it('switches from sign-in prompt to Generate button after cross-tab login (EN)', async () => {
    await act(async () => { renderWithRealAuth(false); });

    // After mount the session check returned no user — sign-in prompt is visible
    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();

    // User logged in on another tab; this tab regains visibility
    await act(async () => { fireVisibilityChange('visible'); });

    // Re-validation now returns a valid user — Generate button must appear
    await waitFor(() => {
      expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    });
    expect(screen.queryByText('Sign in to generate an AI plan')).toBeNull();
  });

  it('switches from sign-in prompt to Generate button after cross-tab login (AR)', async () => {
    await act(async () => { renderWithRealAuth(true); });

    // Arabic sign-in prompt is visible while unauthenticated
    expect(screen.getByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();

    // Simulate tab regaining focus after the other-tab login
    await act(async () => { fireVisibilityChange('visible'); });

    await waitFor(() => {
      expect(screen.getByText('Generate Plan ✨')).toBeTruthy();
    });
    expect(screen.queryByText('سجِّل دخولك لتوليد خطة الذكاء الاصطناعي')).toBeNull();
  });

  it('does NOT re-validate when the tab becomes hidden (only on visible)', async () => {
    await act(async () => { renderWithRealAuth(false); });

    const callsBefore = fetchSpy.mock.calls.length;

    // Tab hides — must NOT trigger another /auth/me call
    await act(async () => { fireVisibilityChange('hidden'); });

    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
    // Sign-in prompt still present — state unchanged
    expect(screen.getByText('Sign in to generate an AI plan')).toBeTruthy();
    expect(screen.queryByText('Generate Plan ✨')).toBeNull();
  });
});
