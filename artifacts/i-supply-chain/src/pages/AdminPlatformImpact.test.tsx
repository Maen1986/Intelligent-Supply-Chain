/**
 * #185 Platform Impact Dashboard — admin gate + metric rendering.
 *
 * Covers:
 *  - Spinner while auth is loading (neither the dashboard nor the block shown)
 *  - "Admin access required" for a logged-out or non-admin user
 *  - Admin user sees the Platform Impact heading and fetched metric values
 *  - A failed fetch (non-ok response) surfaces the error message, not a crash
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { AdminPlatformImpact } from './AdminPlatformImpact';

afterEach(cleanup);

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));
vi.mock('@/lib/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));

const mockAuthState = {
  user: null as null | { id: number; fullName: string; email: string; role: string },
  loading: false,
};
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: mockAuthState.user, loading: mockAuthState.loading }),
}));

vi.mock('wouter', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}));

function renderPage() {
  return render(React.createElement(AdminPlatformImpact));
}

describe('AdminPlatformImpact — auth gate', () => {
  it('shows a spinner while auth is still loading', () => {
    mockAuthState.loading = true;
    mockAuthState.user = null;
    renderPage();

    expect(document.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText(/Platform Impact/i)).toBeNull();
    expect(screen.queryByText(/Admin access required/i)).toBeNull();

    mockAuthState.loading = false;
  });

  it('shows "Admin access required" for a logged-out user', () => {
    mockAuthState.loading = false;
    mockAuthState.user = null;
    renderPage();

    expect(screen.getByText('Admin access required')).toBeTruthy();
  });

  it('shows "Admin access required" for a non-admin user', () => {
    mockAuthState.loading = false;
    mockAuthState.user = { id: 2, fullName: 'Regular User', email: 'user@example.com', role: 'user' };
    renderPage();

    expect(screen.getByText('Admin access required')).toBeTruthy();

    mockAuthState.user = null;
  });
});

describe('AdminPlatformImpact — admin dashboard', () => {
  it('renders fetched metrics for an admin user', async () => {
    mockAuthState.loading = false;
    mockAuthState.user = { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin' };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        generatedAt: '2026-08-28T00:00:00.000Z',
        metrics: {
          diagnosticsRun: 42,
          assessmentsCompleted: 17,
          actionsTracked: 9,
          actionsByStatus: { not_started: 4, in_progress: 3, done: 2 },
          gapsIdentified: 5,
          assessedUsersWithAtLeastOneGap: 3,
          distinctUsersAssessed: 12,
          organizationsEngaged: 6,
          totalUsers: 20,
        },
        definitions: { gap: 'A segment scoring below 2.0...' },
      }),
    }) as unknown as typeof fetch;

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Platform Impact').length).toBeGreaterThan(0);
    });
    expect(await screen.findByText('42')).toBeTruthy();
    expect(await screen.findByText('17')).toBeTruthy();
    expect(screen.queryByText('Admin access required')).toBeNull();

    mockAuthState.user = null;
  });

  it('shows a failure message when the fetch response is not ok', async () => {
    mockAuthState.loading = false;
    mockAuthState.user = { id: 1, fullName: 'Admin', email: 'admin@example.com', role: 'admin' };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    renderPage();

    expect(await screen.findByText(/Failed to load platform impact data/i)).toBeTruthy();

    mockAuthState.user = null;
  });
});
