/**
 * AdminAutomations — Webhook Delivery Log: tier-change events (Task 405)
 *
 * The automated tests confirm that supplier.tier_changed events are dispatched
 * when a supplier's tier changes. This file confirms the complementary UI half:
 * that delivery log rows for supplier.tier_changed events actually appear in the
 * WebhookLogTab table, and that the event code is rendered in the DOM.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'admin' }, isAuthenticated: true, loading: false }),
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', ar: false }),
}));

vi.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
    <a href={href}>{children}</a>,
  useLocation: () => ['/admin', vi.fn()],
}));

/* ── Component under test ────────────────────────────────────────────────── */

import { WebhookLogTab } from '../AdminAutomations';

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const TIER_CHANGE_ROW = {
  id:           101,
  event:        'supplier.tier_changed',
  url:          'https://hook.example.com/webhook',
  attempted_at: new Date().toISOString(),
  status_code:  200,
  success:      true,
  attempts:     1,
  payload:      { supplierId: 'sup-1', oldTier: 'emerging', newTier: 'core' },
};

const OTHER_EVENT_ROW = {
  id:           102,
  event:        'supplier.update',
  url:          'https://hook.example.com/webhook',
  attempted_at: new Date().toISOString(),
  status_code:  200,
  success:      true,
  attempts:     1,
  payload:      {},
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function stubWebhookLogFetch(rows: object[]) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if ((url as string).includes('webhook-log')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, logs: rows, total: rows.length }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, logs: [], total: 0 }) });
  }));
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('WebhookLogTab — supplier.tier_changed rows in delivery log (Task 405)', () => {
  it('renders a supplier.tier_changed row in the delivery log table', async () => {
    stubWebhookLogFetch([TIER_CHANGE_ROW]);
    render(<WebhookLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('supplier.tier_changed')).toBeInTheDocument();
    });

    // The event code must be visible in the table cell
    const code = screen.getByText('supplier.tier_changed');
    expect(code.tagName.toLowerCase()).toBe('code');
  });

  it('renders tier_changed row alongside other event types', async () => {
    stubWebhookLogFetch([TIER_CHANGE_ROW, OTHER_EVENT_ROW]);
    render(<WebhookLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('supplier.tier_changed')).toBeInTheDocument();
      expect(screen.getByText('supplier.update')).toBeInTheDocument();
    });
  });

  it('shows "No records found." when the log is empty', async () => {
    stubWebhookLogFetch([]);
    render(<WebhookLogTab ar={false} refresh={0} />);

    await waitFor(() => {
      expect(screen.getByText('No records found.')).toBeInTheDocument();
    });
  });
});
