/**
 * Header — Pilot / Active Development badge (30 Aug 2026, owner-approved)
 *
 * Owner asked for a small, consistent platform-wide status badge so the
 * team can keep iterating without the build's active-development state
 * being mistaken for a finished product -- without undermining the real,
 * sourced data already live and in active outreach. Single insertion
 * point in Header.tsx (desktop bar + mobile menu) so it appears on every
 * page without per-page wiring.
 *
 * Covers:
 *   1. Badge renders in the desktop header for both languages.
 *   2. Badge also renders inside the mobile menu once opened.
 *   3. Badge text is NOT "Demo" -- deliberately distinct wording (see
 *      PilotStatusBadge.tsx header comment for the reasoning).
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('./Logo', () => ({ Logo: () => <div data-testid="logo" /> }));

vi.mock('wouter', () => ({
  Link: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: React.ReactNode }) =>
    <a href={href} {...rest}>{children}</a>,
  useLocation: () => ['/', vi.fn()],
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false, logout: vi.fn() }),
}));

let mockLang = 'en';
vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: mockLang, setLang: vi.fn() }),
}));

beforeEach(() => { cleanup(); mockLang = 'en'; vi.resetModules(); });

async function getHeader() {
  const mod = await import('./Header');
  return mod.Header;
}

describe('Header — Pilot / Active Development badge', () => {
  it('renders the English badge text in the desktop header', async () => {
    const Header = await getHeader();
    render(<Header />);
    expect(screen.getAllByTestId('pilot-status-badge')[0]).toHaveTextContent('Pilot');
    expect(screen.getAllByTestId('pilot-status-badge')[0]).toHaveTextContent('Active Development');
  });

  it('renders the Arabic badge text when lang is ar', async () => {
    mockLang = 'ar';
    const Header = await getHeader();
    render(<Header />);
    expect(screen.getAllByTestId('pilot-status-badge')[0]).toHaveTextContent('تجريبي');
  });

  it('never renders the word "Demo" -- deliberately distinct from illustrative-data labeling', async () => {
    const Header = await getHeader();
    render(<Header />);
    const badges = screen.getAllByTestId('pilot-status-badge');
    badges.forEach(b => expect(b.textContent).not.toMatch(/demo/i));
  });

  it('renders as a real, keyboard-focusable button, not a hover-only span (QA fix: mobile/touch users could see the label but never reach the explanation)', async () => {
    const Header = await getHeader();
    render(<Header />);
    const badge = screen.getAllByTestId('pilot-status-badge')[0];
    expect(badge.tagName).toBe('BUTTON');
    expect(badge).toHaveAttribute('type', 'button');
  });

  it('also renders inside the mobile menu once opened', async () => {
    const Header = await getHeader();
    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));
    const badges = screen.getAllByTestId('pilot-status-badge');
    // One in the desktop bar (hidden via CSS on mobile, still in the DOM)
    // and one inside the now-open mobile menu panel.
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});
