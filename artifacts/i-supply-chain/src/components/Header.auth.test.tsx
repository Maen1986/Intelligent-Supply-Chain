/**
 * Task 183 — Confirm the header user name and avatar update instantly when a
 * user logs in — no refresh needed.
 *
 * Covers:
 *  - Logged-out state: "Sign In / Register" link is visible, user name is absent
 *  - Logged-in state: user's first name is visible, "Sign In / Register" is absent
 *  - Login transition: after setUser() fires, header immediately shows the user name
 *  - Logout transition: after setUser(null) fires, header immediately returns to guest state
 *
 * Task 317 — Confirm the mobile header menu also updates instantly when a user
 * logs in or out.
 *
 * Additional mobile-menu covers:
 *  - Mobile menu open + logged-out: shows "Sign In / Register" guest button, no full name
 *  - Login transition: mobile menu immediately shows user's full name
 *  - Logout transition: mobile menu immediately returns to guest sign-in button
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
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

vi.mock('@/components/NotificationsBell', () => ({
  NotificationsBell: () => <div data-testid="notifications-bell" />,
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
  initialLoading = false,
  onSetLoadingRef,
}: {
  initialAuth: boolean;
  onFlipRef: React.MutableRefObject<((v: boolean) => void) | null>;
  initialLoading?: boolean;
  onSetLoadingRef?: React.MutableRefObject<((v: boolean) => void) | null>;
}) {
  const [authed, setAuthed] = useState(initialAuth);
  const [loading, setLoading] = useState(initialLoading);

  onFlipRef.current = setAuthed;
  if (onSetLoadingRef) onSetLoadingRef.current = setLoading;

  const fakeAuth = {
    isAuthenticated: authed,
    user: authed ? makeUser() : null,
    loading,
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

  it('shows "Sign In" when no user is logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    expect(screen.getByText('Sign In')).toBeTruthy();
    // User first name must NOT appear
    expect(screen.queryByText('Alice')).toBeNull();
  });

  // ── Authenticated baseline ─────────────────────────────────────────────

  it('shows the user first name and hides "Sign In" when already logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();
  });

  // ── Login transition ───────────────────────────────────────────────────

  it('instantly shows the user name after login — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    // Verify initial guest state
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.queryByText('Alice')).toBeNull();

    // Simulate login: equivalent to login() → setUser(data.user) in AuthContext
    await act(async () => { ref.current!(true); });

    // Header must update immediately without unmount/remount
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();
  });

  // ── Logout transition ──────────────────────────────────────────────────

  it('instantly returns to guest state after logout — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    // Verify initial authenticated state
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();

    // Simulate logout: equivalent to logout() → setUser(null) in AuthContext
    await act(async () => { ref.current!(false); });

    // Header must return to guest state immediately
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  // ── Sign-out link is present when authenticated ────────────────────────

  it('renders a "Sign out" control when the user is authenticated', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);

    // "Sign out" now lives inside the desktop account dropdown -- open it first
    act(() => { fireEvent.click(screen.getByText('Alice').closest('button')!); });

    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('does not render a "Sign out" control when no user is logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);

    expect(screen.queryByText('Sign out')).toBeNull();
  });

  // ── Loading placeholder ────────────────────────────────────────────────

  it('shows a placeholder and hides "Sign In" while loading', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} initialLoading={true} />);

    // Placeholder must be visible
    expect(screen.getByTestId('auth-loading-placeholder')).toBeTruthy();
    // Guest link must NOT flash during loading
    expect(screen.queryByText('Sign In')).toBeNull();
    // User name must not appear either
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('shows "Sign In" after loading resolves with no session', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    const loadingRef = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} initialLoading={true} onSetLoadingRef={loadingRef} />);

    // Still loading — no Sign In link
    expect(screen.queryByText('Sign In')).toBeNull();

    // Session check finishes: no user
    await act(async () => { loadingRef.current!(false); });

    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.queryByTestId('auth-loading-placeholder')).toBeNull();
  });

  it('shows user name after loading resolves with an active session', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    const loadingRef = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} initialLoading={true} onSetLoadingRef={loadingRef} />);

    // Still loading — no name yet
    expect(screen.queryByText('Alice')).toBeNull();
    expect(screen.queryByText('Sign In')).toBeNull();

    // Session check finishes: user is authenticated
    await act(async () => { loadingRef.current!(false); });

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Sign In')).toBeNull();
    expect(screen.queryByTestId('auth-loading-placeholder')).toBeNull();
  });
});

// ── Mobile menu auth tests ─────────────────────────────────────────────────

describe('Header — mobile menu auth-driven display', () => {

  /** Opens the mobile hamburger menu by clicking its toggle button. */
  function openMobileMenu() {
    const toggleBtn = screen.getByLabelText('Toggle menu');
    act(() => { fireEvent.click(toggleBtn); });
  }

  // ── Guest baseline (mobile) ────────────────────────────────────────────

  it('mobile menu shows "Sign In / Register" and no user name when logged out', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);
    openMobileMenu();

    // The mobile menu renders a Sign In / Register button
    const signInButtons = screen.getAllByText('Sign In / Register');
    expect(signInButtons.length).toBeGreaterThan(0);

    // Full name must NOT appear anywhere
    expect(screen.queryByText('Alice Johnson')).toBeNull();
  });

  // ── Authenticated baseline (mobile) ───────────────────────────────────

  it('mobile menu shows the full name and hides the sign-in button when already logged in', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);
    openMobileMenu();

    expect(screen.getByText('Alice Johnson')).toBeTruthy();
    // The mobile Sign In / Register button must not be rendered
    // (desktop utility bar is hidden via CSS on mobile; we look for the Button variant)
    const mobileSignIn = screen.queryByRole('button', { name: 'Sign In / Register' });
    expect(mobileSignIn).toBeNull();
  });

  // ── Login transition (mobile) ──────────────────────────────────────────

  it('mobile menu instantly shows the full name after login — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);
    openMobileMenu();

    // Verify guest state
    expect(screen.getAllByText('Sign In / Register').length).toBeGreaterThan(0);
    expect(screen.queryByText('Alice Johnson')).toBeNull();

    // Simulate login
    await act(async () => { ref.current!(true); });

    // Mobile menu must immediately show the full name
    expect(screen.getByText('Alice Johnson')).toBeTruthy();
    // Sign-in button must disappear from the mobile section
    expect(screen.queryByRole('button', { name: 'Sign In / Register' })).toBeNull();
  });

  // ── Logout transition (mobile) ─────────────────────────────────────────

  it('mobile menu instantly returns to guest state after logout — no page refresh required', async () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);
    openMobileMenu();

    // Verify authenticated state
    expect(screen.getByText('Alice Johnson')).toBeTruthy();

    // Simulate logout
    await act(async () => { ref.current!(false); });

    // Full name must be gone
    expect(screen.queryByText('Alice Johnson')).toBeNull();
    // Sign-in button must reappear in the mobile section
    const signInButtons = screen.getAllByText('Sign In / Register');
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  // ── Mobile "Sign Out" button ───────────────────────────────────────────

  it('mobile menu shows a "Sign Out" button when authenticated', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={true} onFlipRef={ref} />);
    openMobileMenu();

    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('mobile menu does not show "Sign Out" when logged out', () => {
    const ref = { current: null } as React.MutableRefObject<((v: boolean) => void) | null>;
    render(<HeaderAuthHarness initialAuth={false} onFlipRef={ref} />);
    openMobileMenu();

    expect(screen.queryByText('Sign Out')).toBeNull();
  });
});
