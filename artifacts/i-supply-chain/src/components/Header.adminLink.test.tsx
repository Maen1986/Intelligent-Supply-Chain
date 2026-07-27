/**
 * Header — Admin link visibility tests
 *
 * Confirms that the Admin link in the top utility bar:
 *   1. Is present when logged in as an admin user
 *   2. Disappears immediately after logout — no page reload required
 *   3. Is absent for a logged-in non-admin (regular) user
 */

import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

/* ── Module stubs ──────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

// Logo renders nothing meaningful in tests
vi.mock('./Logo', () => ({ Logo: () => <div data-testid="logo" /> }));

// wouter — Link renders a plain anchor; useLocation returns a stable pair
vi.mock('wouter', () => ({
  Link: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    <a href={href} {...rest}>{children}</a>,
  useLocation: () => ['/', vi.fn()],
}));

// LanguageContext — always English
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

/* ── Controllable AuthContext mock ─────────────────────────────────────────── */

type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  mobile: null;
  designation: null;
  company: null;
  role: string;
};

const ADMIN_USER: UserProfile = {
  id: 1, fullName: 'Alice Admin', email: 'alice@example.com',
  mobile: null, designation: null, company: null, role: 'admin',
};

const REGULAR_USER: UserProfile = {
  id: 2, fullName: 'Bob User', email: 'bob@example.com',
  mobile: null, designation: null, company: null, role: 'user',
};

// mockUseAuth is replaced per test via mockReturnValue
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ── Helpers ───────────────────────────────────────────────────────────────── */

// Lazy import so mocks are in place before the module loads
async function getHeader() {
  const mod = await import('./Header');
  return mod.Header;
}

beforeEach(() => {
  cleanup();
  mockLogout.mockReset();
  vi.resetModules();
});

/* ══════════════════════════════════════════════════════════════════════════════
   Suite 1 — Admin user: link is visible
══════════════════════════════════════════════════════════════════════════════ */
describe('Header — Admin link, admin user', () => {
  it('renders the Admin link in the desktop utility bar', async () => {
    mockUseAuth.mockReturnValue({ user: ADMIN_USER, isAuthenticated: true, loading: false, logout: mockLogout });
    const Header = await getHeader();
    render(<Header />);

    // The desktop bar renders an anchor pointing to /admin
    const adminLinks = screen.getAllByRole('link', { name: /admin/i });
    expect(adminLinks.length).toBeGreaterThanOrEqual(1);
    expect(adminLinks.some(el => (el as HTMLAnchorElement).href.includes('/admin'))).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Suite 2 — Admin link vanishes immediately after logout (no page reload)
══════════════════════════════════════════════════════════════════════════════ */
describe('Header — Admin link disappears on logout without a page reload', () => {
  it('hides the Admin link as soon as the auth state transitions to logged-out', async () => {
    /**
     * We wrap Header in a controller component that drives the auth state.
     * When the Sign Out button is clicked the controller calls its own
     * logout handler, which flips the user to null — exactly what
     * AuthContext.logout() does via setUser(null) in the real app.
     */
    const Header = await getHeader();

    function AuthController() {
      const [authed, setAuthed] = useState(true);

      // The mock returns a different snapshot depending on authed state
      mockUseAuth.mockReturnValue({
        user:            authed ? ADMIN_USER : null,
        isAuthenticated: authed,
        loading:         false,
        logout: async () => { setAuthed(false); },
      });

      return <Header />;
    }

    render(<AuthController />);

    // Before logout: Admin link must be present
    const before = screen.getAllByRole('link', { name: /admin/i });
    expect(before.some(el => (el as HTMLAnchorElement).href.includes('/admin'))).toBe(true);

    // Click the desktop "Sign out" button
    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    await act(async () => { fireEvent.click(signOutBtn); });

    // After logout (no reload): Admin link must be gone
    const adminLinks = screen.queryAllByRole('link', { name: /admin/i });
    expect(adminLinks.filter(el => (el as HTMLAnchorElement).href.includes('/admin'))).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════════
   Suite 3 — Regular (non-admin) user: link is never shown
══════════════════════════════════════════════════════════════════════════════ */
describe('Header — Admin link, non-admin user', () => {
  it('does not render the Admin link for a logged-in user with role "user"', async () => {
    mockUseAuth.mockReturnValue({ user: REGULAR_USER, isAuthenticated: true, loading: false, logout: mockLogout });
    const Header = await getHeader();
    render(<Header />);

    const adminLinks = screen.queryAllByRole('link', { name: /admin/i });
    expect(adminLinks.filter(el => (el as HTMLAnchorElement).href.includes('/admin'))).toHaveLength(0);
  });

  it('does not render the Admin link when no user is logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false, logout: mockLogout });
    const Header = await getHeader();
    render(<Header />);

    const adminLinks = screen.queryAllByRole('link', { name: /admin/i });
    expect(adminLinks.filter(el => (el as HTMLAnchorElement).href.includes('/admin'))).toHaveLength(0);
  });
});
