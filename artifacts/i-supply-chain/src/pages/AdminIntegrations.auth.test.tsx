/**
 * Task 171 — Confirm the Integration Hub is invisible after an admin logs out.
 *
 * Covers:
 *  - While auth is loading, a spinner is shown (not the hub, not the block)
 *  - When user is null (logged-out), the "Admin access required" block is shown
 *  - When user has role 'user' (non-admin), the "Admin access required" block is shown
 *  - When user has role 'admin', the Integration Hub heading is shown
 *  - Transition: hub visible → logout → "Admin access required" without unmount/remount
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { AdminIntegrations } from './AdminIntegrations';

afterEach(cleanup);

/* ─── Module mocks ──────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));

// Controlled auth mock — tests flip values via mockAuthState
const mockAuthState = {
  user: null as null | { id: number; fullName: string; email: string; role: string },
  loading: false,
};
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthState.user, loading: mockAuthState.loading }),
}));

// Stub wouter so <Link> doesn't need a Router
vi.mock('wouter', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}));

// Suppress fetch errors from child sections (ApiKeysSection etc.) — we only test the gate
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ ok: true, keys: [], webhooks: [], logs: [] }),
  }) as unknown as typeof fetch;
});

/* ─── Helper ────────────────────────────────────────────────────────────── */

function renderHub() {
  return render(React.createElement(AdminIntegrations));
}

/* ─── Tests ─────────────────────────────────────────────────────────────── */

describe('AdminIntegrations — auth gate', () => {
  it('shows a spinner while auth is still loading', () => {
    mockAuthState.loading = true;
    mockAuthState.user = null;
    renderHub();

    // Spinner present; neither the hub heading nor the block should be visible
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
    expect(screen.queryByText(/Integration Hub/i)).toBeNull();
    expect(screen.queryByText(/Admin access required/i)).toBeNull();

    mockAuthState.loading = false;
  });

  it('shows "Admin access required" when user is null (logged out)', () => {
    mockAuthState.loading = false;
    mockAuthState.user = null;
    renderHub();

    expect(screen.getByText('Admin access required')).toBeTruthy();
    expect(screen.queryByText(/Integration Hub/i)).toBeNull();
  });

  it('shows "Admin access required" when user has a non-admin role', () => {
    mockAuthState.loading = false;
    mockAuthState.user = { id: 2, fullName: 'Regular User', email: 'user@example.com', role: 'user' };
    renderHub();

    expect(screen.getByText('Admin access required')).toBeTruthy();
    expect(screen.queryByText(/Integration Hub/i)).toBeNull();

    mockAuthState.user = null;
  });

  it('shows the Integration Hub heading for an admin user', () => {
    mockAuthState.loading = false;
    mockAuthState.user = { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin' };
    renderHub();

    // The heading and the nav tab both say "Integration Hub" — confirm at least one exists
    expect(screen.getAllByText('Integration Hub').length).toBeGreaterThan(0);
    expect(screen.queryByText('Admin access required')).toBeNull();

    mockAuthState.user = null;
  });
});

/* ─── Transition test: hub visible → logout → access blocked ────────────── */

describe('AdminIntegrations — logout transition', () => {
  it('switches from hub to "Admin access required" when the user logs out', async () => {
    // Start as admin
    mockAuthState.loading = false;
    mockAuthState.user = { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin' };

    // Use a wrapper component whose auth state can be toggled
    function LogoutHarness({
      onFlipRef,
    }: {
      onFlipRef: React.MutableRefObject<((isAdmin: boolean) => void) | null>;
    }) {
      const [isAdmin, setIsAdmin] = useState(true);
      onFlipRef.current = setIsAdmin;

      // Mirror what AdminIntegrations reads via useAuth()
      mockAuthState.user = isAdmin
        ? { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin' }
        : null;
      mockAuthState.loading = false;

      return React.createElement(AdminIntegrations);
    }

    const flipRef = React.createRef<((v: boolean) => void) | null>() as React.MutableRefObject<
      ((v: boolean) => void) | null
    >;
    flipRef.current = null;

    render(React.createElement(LogoutHarness, { onFlipRef: flipRef }));

    // Hub is visible before logout
    expect(screen.getAllByText('Integration Hub').length).toBeGreaterThan(0);
    expect(screen.queryByText('Admin access required')).toBeNull();

    // Simulate logout: clear the user
    await act(async () => {
      flipRef.current?.(false);
    });

    // After logout, access-blocked UI is shown; hub content is gone
    expect(screen.getByText('Admin access required')).toBeTruthy();
    expect(screen.queryByText('Integration Hub')).toBeNull();

    // Reset for other tests
    mockAuthState.user = null;
  });
});
