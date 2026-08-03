/**
 * Header — mobile menu Admin Dashboard link (Task 344)
 *
 * The Header renders two separate admin-link branches:
 *   • Desktop utility bar (line ~121): shows "Admin" text
 *   • Mobile menu (line ~314): shows "Admin Dashboard" with icon
 *
 * These tests target the mobile branch specifically, confirming that:
 *   1. "Admin Dashboard" appears in the mobile section for an admin user
 *   2. "Admin Dashboard" is absent for a non-admin user
 *   3. "Admin Dashboard" disappears immediately after the mobile Sign Out
 *      is clicked (no page reload required)
 */

import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

/* ── Module stubs ──────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('./Logo', () => ({ Logo: () => <div data-testid="logo" /> }));

vi.mock('wouter', () => ({
  Link: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    <a href={href} {...rest}>{children}</a>,
  useLocation: () => ['/', vi.fn()],
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

/* ── Controllable AuthContext mock ─────────────────────────────────────────── */

type UserProfile = {
  id: number; fullName: string; email: string;
  mobile: null; designation: null; company: null; role: string;
};

const ADMIN_USER: UserProfile  = {
  id: 1, fullName: 'Alice Admin', email: 'alice@example.com',
  mobile: null, designation: null, company: null, role: 'admin',
};
const REGULAR_USER: UserProfile = {
  id: 2, fullName: 'Bob User', email: 'bob@example.com',
  mobile: null, designation: null, company: null, role: 'user',
};

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ── Helpers ───────────────────────────────────────────────────────────────── */

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
   Suite — Admin Dashboard link in the mobile menu
══════════════════════════════════════════════════════════════════════════════ */

describe('Header — mobile menu Admin Dashboard link (Task 344)', () => {
  it('renders an "Admin Dashboard" link in the mobile section after opening the mobile menu', async () => {
    mockUseAuth.mockReturnValue({
      user: ADMIN_USER, isAuthenticated: true, loading: false, logout: mockLogout,
    });
    const Header = await getHeader();
    render(<Header />);

    // The mobile menu is conditionally rendered — open it via the hamburger button
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

    // The mobile section shows "Admin Dashboard" (not just "Admin" as in the desktop bar)
    const link = screen.getByRole('link', { name: /Admin Dashboard/i });
    expect((link as HTMLAnchorElement).href).toContain('/admin');
  });

  it('does NOT render an "Admin Dashboard" link for a non-admin user even when the mobile menu is open', async () => {
    mockUseAuth.mockReturnValue({
      user: REGULAR_USER, isAuthenticated: true, loading: false, logout: mockLogout,
    });
    const Header = await getHeader();
    render(<Header />);

    // Open the mobile menu
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

    // Non-admin user must not see Admin Dashboard
    const link = screen.queryByRole('link', { name: /Admin Dashboard/i });
    expect(link).toBeNull();
  });

  it('Admin Dashboard link disappears immediately when the mobile Sign Out button is clicked', async () => {
    const Header = await getHeader();

    function AuthController() {
      const [authed, setAuthed] = useState(true);
      mockUseAuth.mockReturnValue({
        user:            authed ? ADMIN_USER : null,
        isAuthenticated: authed,
        loading:         false,
        logout: async () => { setAuthed(false); },
      });
      return <Header />;
    }

    render(<AuthController />);

    // Open the mobile menu
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

    // Before logout: "Admin Dashboard" link present in mobile section
    expect(screen.getByRole('link', { name: /Admin Dashboard/i })).toBeInTheDocument();

    // Click the mobile "Sign Out" button (plain text button inside the mobile flex column)
    const signOutBtns = screen.getAllByRole('button', { name: /sign out/i });
    await act(async () => { fireEvent.click(signOutBtns[0]); });

    // After logout: no "Admin Dashboard" link anywhere
    expect(screen.queryByRole('link', { name: /Admin Dashboard/i })).toBeNull();
  });
});
