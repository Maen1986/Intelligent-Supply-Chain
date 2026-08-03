/**
 * TemplatesTab — nodes list renders in the UI (Task 620)
 *
 * Confirms the TemplatesTab component actually renders the `nodes` array
 * entries as visible text when the Setup guide is opened.  A silent empty
 * array (e.g. from an undefined nodes field) would be invisible to the
 * existing data-level manifest tests.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TemplatesTab } from '../AdminAutomations';

// ── Module stubs ──────────────────────────────────────────────────────────────

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', ar: false }),
}));

// ── Fake template data ────────────────────────────────────────────────────────

/** A minimal template manifest item with a non-empty nodes array. */
const FAKE_TEMPLATE = {
  id:               'n8n-kpi-breach-alert',
  name:             'KPI Breach Alert',
  nameAr:           'تنبيه خرق مؤشر الأداء',
  description:      'Notifies the team when a KPI drops below threshold.',
  descriptionAr:    'يُنبِّه الفريق عند انخفاض مؤشر أداء عن العتبة المحددة.',
  platform:         'n8n',
  category:         'Alerts',
  triggerEvent:     'kpi-breach',
  setupTimeMinutes: 10,
  downloadUrl:      'https://example.com/template.json',
  nodes:            ['HTTP Request', 'IF', 'Send Email'], // non-empty — the key assertion
};

/** Stub fetch to return the fake template from the API. */
function stubFetchTemplates() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/admin/automations/templates')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, templates: [FAKE_TEMPLATE] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TemplatesTab — nodes list renders in the UI (Task 620)', () => {
  it('renders the template name once the API response resolves', async () => {
    stubFetchTemplates();
    render(<TemplatesTab ar={false} />);

    await waitFor(() =>
      expect(screen.getByText('KPI Breach Alert')).toBeInTheDocument(),
    );
  });

  it('renders each node from the nodes array inside the Setup guide', async () => {
    stubFetchTemplates();
    render(<TemplatesTab ar={false} />);

    // Wait for the template card to appear
    await waitFor(() =>
      expect(screen.getByText('KPI Breach Alert')).toBeInTheDocument(),
    );

    // Open the Setup guide
    const setupBtn = screen.getByText('Setup');
    fireEvent.click(setupBtn);

    // Every node name must be visible (nodes appear in FlowPreview and in the
    // nodes list, so use getAllByText and check at least one match exists).
    for (const node of FAKE_TEMPLATE.nodes) {
      const matches = screen.getAllByText(node);
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it('shows a network-error message when the fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );
    render(<TemplatesTab ar={false} />);

    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument(),
    );
  });
});
