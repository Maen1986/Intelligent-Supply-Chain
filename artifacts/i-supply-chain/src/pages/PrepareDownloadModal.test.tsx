/**
 * PrepareDownloadModal — n8n URL field visibility
 *
 * Confirms:
 *   E. Make.com template → n8n Instance URL input is NOT rendered
 *   F. Zapier template   → n8n Instance URL input is NOT rendered
 *   G. n8n template      → n8n Instance URL input IS rendered
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrepareDownloadModal } from './AdminAutomations';

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({
  API_BASE: 'http://localhost/api',
}));

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Minimal TemplateManifestItem — only fields PrepareDownloadModal reads.
 */
function makeTemplate(platform: string) {
  return {
    id: `test-${platform}`,
    platform,
    filename: `test-${platform}.json`,
    downloadPath: `automation-templates/${platform}/test.json`,
    name: `Test ${platform} Template`,
    nameAr: `قالب ${platform} للاختبار`,
    description: 'Test template',
    descriptionAr: 'قالب للاختبار',
    triggerEvent: 'kpi.threshold_breach',
    category: 'Alerts',
    setupTimeMinutes: 5,
    nodes: ['HTTP Request'],
  };
}

/* ── Setup ────────────────────────────────────────────────────────────────── */

beforeEach(() => {
  /* Stub fetch so the useEffect key-loading call resolves immediately */
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, keys: [] }),
    }),
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — n8n URL field visibility', () => {

  /* ── E. Make.com template ──────────────────────────────────────────────── */

  it('E — Make.com template: n8n Instance URL input is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('make')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('n8n Instance URL (optional)'),
    ).toBeNull();
  });

  /* ── F. Zapier template ────────────────────────────────────────────────── */

  it('F — Zapier template: n8n Instance URL input is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('zapier')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('n8n Instance URL (optional)'),
    ).toBeNull();
  });

  /* ── G. n8n template ───────────────────────────────────────────────────── */

  it('G — n8n template: n8n Instance URL input IS present', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByPlaceholderText('https://your-n8n.example.com'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('n8n Instance URL (optional)'),
    ).toBeInTheDocument();
  });

});
