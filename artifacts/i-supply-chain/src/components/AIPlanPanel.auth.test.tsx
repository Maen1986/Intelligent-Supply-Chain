/**
 * Task 175 — Confirm the Generate button reappears instantly after login
 * without a page refresh.
 *
 * Covers:
 *  - Logged-out state: sign-in prompt is visible, Generate button is absent
 *  - Logged-in state: Generate button is visible, sign-in prompt is absent
 *  - Login transition: after setUser() fires, Generate button appears without unmount/remount
 *  - Logout transition: after setUser(null) fires, sign-in prompt reappears without unmount/remount
 *  - Arabic locale: both states show the correct localised text
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AIPlanPanel } from './AIPlanPanel';
import * as AuthContextModule from '@/lib/AuthContext';

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
