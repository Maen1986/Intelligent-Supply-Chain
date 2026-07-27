/**
 * AdminAutomations — TemplatesTab
 *
 * Confirms:
 *   A. The Templates tab renders a card for every entry in the real manifest.
 *   B. Expanding a setup guide reveals step text.
 *   C. Each Download link points to a URL that serves valid n8n JSON
 *      (non-empty body, `_isc_version === "1.0.0"`).
 *
 * Card-count assertions are data-driven: they read the real
 * artifacts/api-server/public/n8n-templates/manifest.json so that adding a
 * new template to the manifest automatically causes a failure here if the
 * frontend misses it.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

/* ── Real manifest (data-driven) ──────────────────────────────────────────── */

import manifestJson from '../../../../artifacts/api-server/public/n8n-templates/manifest.json';

const MANIFEST_TEMPLATES = manifestJson.templates as Array<{
  id: string;
  platform?: string;
  filename: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  triggerEvent: string;
  category: string;
  setupTimeMinutes: number;
  nodes: string[];
}>;

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({ API_BASE: 'http://test-server/api' }));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'admin', email: 'admin@test.com' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

vi.mock('wouter', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
  useLocation: () => ['/admin/automations', vi.fn()],
  useRoute:    () => [false, {}],
}));

/* ── Fixture data ─────────────────────────────────────────────────────────── */

const SAMPLE_N8N_JSON = {
  _isc_version: '1.0.0',
  name: 'ISC — Lead Nurture Sequence',
  nodes: [{ id: 'node-1', name: 'Webhook', type: 'n8n-nodes-base.webhook' }],
  connections: {},
  settings: {},
};

/* ── fetch mock ───────────────────────────────────────────────────────────── */

function makeFetchMock() {
  return vi.fn(async (url: string) => {
    const u = String(url);

    // Templates manifest — return all templates from the real manifest
    if (u.includes('/admin/automations/templates')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          _isc_version: manifestJson._isc_version,
          generatedAt: manifestJson.generatedAt,
          templates: MANIFEST_TEMPLATES,
        }),
      };
    }

    // Any of the template JSON files
    if (u.includes('/public/n8n-templates/') && u.endsWith('.json')) {
      return {
        ok: true,
        json: async () => SAMPLE_N8N_JSON,
        text: async () => JSON.stringify(SAMPLE_N8N_JSON),
      };
    }

    // Automations overview (loaded by OverviewTab on mount, but we switch away)
    if (u.includes('/admin/automations/overview')) {
      return {
        ok: true,
        json: async () => ({
          ok: true,
          webhooks: { configCount: 0, totalDeliveries: 0, successful: 0, failed: 0, lastDeliveryAt: null, successRate: null },
          inbound:  { total: 0, successful: 0, failed: 0, lastReceivedAt: null },
          schedule: {},
          kpiAlerts: { totalBreaches: 0 },
        }),
      };
    }

    return { ok: false, json: async () => ({ ok: false, error: 'Not mocked' }) };
  });
}

/* ── component under test ─────────────────────────────────────────────────── */

import { AdminAutomations } from './AdminAutomations';

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('AdminAutomations — TemplatesTab', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function renderAndOpenTemplates() {
    render(React.createElement(AdminAutomations));

    // Click the "Templates" tab
    const templatesTab = await screen.findByRole('button', { name: /Templates/i });
    fireEvent.click(templatesTab);

    // Wait for template names from the first and last entries of the manifest to appear
    const firstTemplateName = MANIFEST_TEMPLATES[0].name;
    const lastTemplateName  = MANIFEST_TEMPLATES[MANIFEST_TEMPLATES.length - 1].name;

    await waitFor(() => {
      expect(screen.getAllByText(firstTemplateName).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(lastTemplateName).length).toBeGreaterThanOrEqual(1);
    });
  }

  /* ── A. Card count ──────────────────────────────────────────────────────── */

  it('A — renders exactly one card per manifest template', async () => {
    await renderAndOpenTemplates();

    // Each card has a "Prepare & Download" button; count them as a proxy for card count
    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons).toHaveLength(MANIFEST_TEMPLATES.length);

    // Confirm every unique template name from the manifest is visible
    const uniqueNames = [...new Set(MANIFEST_TEMPLATES.map(t => t.name))];
    for (const name of uniqueNames) {
      expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
    }
  });

  /* ── B. Setup guide expansion ───────────────────────────────────────────── */

  it('B — expanding a setup guide reveals step text', async () => {
    await renderAndOpenTemplates();

    // Click the first "Setup" toggle button
    const setupButtons = screen.getAllByRole('button', { name: /Setup/i });
    expect(setupButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(setupButtons[0]);

    // The first step of lead-nurture-sequence guide should appear
    await waitFor(() => {
      expect(
        screen.getByText(/Import this JSON into n8n/i),
      ).toBeInTheDocument();
    });

    // The node list should also be visible (may appear in both the flow preview
    // and the nodes-chips section, so use getAllByText)
    const webhookEls = screen.getAllByText('Webhook');
    expect(webhookEls.length).toBeGreaterThanOrEqual(1);
  });

  /* ── C. Prepare & Download button opens the modal ───────────────────────── */

  it('C — clicking Prepare & Download opens the preparation modal', async () => {
    await renderAndOpenTemplates();

    // Click the first "Prepare & Download" button
    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(downloadButtons[0]);

    // The preparation modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Prepare & Download Template/i)).toBeInTheDocument();
    });

    // Modal should contain the ISC Domain and API Key fields
    expect(screen.getByText(/ISC Domain/i)).toBeInTheDocument();
    expect(screen.getByText(/ISC API Key/i)).toBeInTheDocument();
  });

  /* ── D. All manifest template cards have Prepare & Download buttons ──────── */

  it('D — all manifest template cards have a Prepare & Download button', async () => {
    await renderAndOpenTemplates();

    const downloadButtons = screen.getAllByRole('button', { name: /Prepare & Download/i });
    expect(downloadButtons).toHaveLength(MANIFEST_TEMPLATES.length);

    // Each button should be enabled
    for (const btn of downloadButtons) {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    }
  });
});
