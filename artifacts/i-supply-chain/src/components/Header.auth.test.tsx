/**
 * Task 183 — Confirm the header user name and avatar update instantly when a
 * user logs in — no refresh needed.
 *
 * Covers:
 *  - Logged-out state: "Sign In / Register" link is visible, user name is absent
 *  - Logged-in state: user's first name is visible, "Sign In / Register" is absent
 *  - Login transition: after setUser() fires, header immediately shows the user name
 *  - Logout transition: after setUser(null) fires, header immediately returns to guest state
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import * as AuthContextModule from '@/lib/AuthContext';

// ── Lightweight stubs for Header's dependencies ────────────────────────────

vi.mock('wouter', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    <a href={href} {...props}>{children}</a>,
  useLocation: () => ['/'],
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

vi.mock('@/components/Logo', () => ({
  Logo: () => <div data-testid="logo" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) =>
    <button {...props}>{children}</button>,
}));

// ── Import the real Header after mocks are in place ────────────────────────
import { Header } from './Header';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── Controllable auth harness ──────────────────────────────────────────────
// Renders Header with a fake AuthContext whose `user` value can be flipped at
// runtime — simulating what happens when login() calls setUser(data.user).

function makeUser(name = 'Alice Johnson') {
  return {
    id: 1,
    fullName: name,
    email: 'alice@example.com',
    mobile: null,
    designation: null,
    company: null,
    role: 'user',
  };
}

function HeaderAuthHarness({
  initialAuth,
  onFlipRef,
}: {
  initialAuth: boolean;
  onFlipRef: React.MutableRefObject<((v: boolean) => void) | null>;
}) {
  const [authed, setAuthed] = useState(initialAuth);

  onFlipRef.current = setAuthed;

  const fakeAuth = {
    isAuthenticated: authed,
    user: authed ? makeUser() : null,
    loading: false,
    register:       async () => {},
    login:          async () => {},
    logout:         vi.fn(async () => { setAuthed(false); }),
    changePassword: async () => {},
    updateProfile:  async () => {},
  };

  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(fakeAuth);

  return <Header />;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Header — auth-driven user name display', () => {

  // ── Guest baseline ─────────────────────────────────────────────────────

  it('shows "Sign In / Register" when no user is logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    expect(screen.getByText('Sign In / Register')).toBeTruthy();
    // User first name must NOT appear
    expect(screen.queryByText('Alice')).toBeNull();
  });

  // ── Authenticated baseline ─────────────────────────────────────────────

  it('shows the user first name and hides "Sign In / Register" when already logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In / Register')).toBeNull();
  });

  // ── Login transition ───────────────────────────────────────────────────

  it('instantly shows the user name after login — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    // Verify initial guest state
    expect(screen.getByText('Sign In / Register')).toBeTruthy();
    expect(screen.queryByText('Alice')).toBeNull();

    // Simulate login: equivalent to login() → setUser(data.user) in AuthContext
    await act(async () => { ref.current!(true); });

    // Header must update immediately without unmount/remount
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In / Register')).toBeNull();
  });

  // ── Logout transition ──────────────────────────────────────────────────

  it('instantly returns to guest state after logout — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    // Verify initial authenticated state
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In / Register')).toBeNull();

    // Simulate logout: equivalent to logout() → setUser(null) in AuthContext
    await act(async () => { ref.current!(false); });

    // Header must return to guest state immediately
    expect(screen.getByText('Sign In / Register')).toBeTruthy();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  // ── Sign-out link is present when authenticated ────────────────────────

  it('renders a "Sign out" control when the user is authenticated', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('does not render a "Sign out" control when no user is logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    expect(screen.queryByText('Sign out')).toBeNull();
  });
});
