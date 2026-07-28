/**
 * PrepareDownloadModal — n8n URL field visibility
 *
 * Confirms:
 *   E. Make.com template → n8n Instance URL input is NOT rendered
 *   F. Zapier template   → n8n Instance URL input is NOT rendered
 *   G. n8n template      → n8n Instance URL input IS rendered
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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

afterEach(() => {
  cleanup();
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

/* ══════════════════════════════════════════════════════════════════════════════
   Arabic mode (ar=true) — n8n URL field visibility
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — n8n URL field visibility (Arabic mode)', () => {

  /* ── H. Make.com template ──────────────────────────────────────────────── */

  it('H — Make.com template (ar=true): Arabic n8n label is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('make')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('عنوان n8n (اختياري)'),
    ).toBeNull();
  });

  /* ── I. Zapier template ────────────────────────────────────────────────── */

  it('I — Zapier template (ar=true): Arabic n8n label is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('zapier')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('عنوان n8n (اختياري)'),
    ).toBeNull();
  });

  /* ── J. n8n template ───────────────────────────────────────────────────── */

  it('J — n8n template (ar=true): Arabic n8n label IS present', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByPlaceholderText('https://your-n8n.example.com'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('عنوان n8n (اختياري)'),
    ).toBeInTheDocument();
  });

});
