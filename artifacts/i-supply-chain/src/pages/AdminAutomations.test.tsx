/**
 * AdminAutomations — PrepareDownloadModal placeholder substitution
 *
 * Tests the exported `applyTemplatePlaceholders` function that powers the
 * client-side substitution inside PrepareDownloadModal.handleDownload.
 *
 * Confirms:
 *   A. All three placeholder strings are replaced when every field is filled.
 *   B. The n8n URL placeholders survive intact when the n8n URL field is left
 *      blank (optional field) — they are NOT replaced with an empty string.
 *   C. A whitespace-only n8n URL is treated the same as blank (no replacement).
 *   D. The domain falls back to the provided hostname when the domain field is
 *      left empty, so YOUR_ISC_DOMAIN is still replaced rather than kept.
 */

import { describe, it, expect } from 'vitest';
import { applyTemplatePlaceholders } from './AdminAutomations';

/* ── Fixture ──────────────────────────────────────────────────────────────── */

/**
 * A minimal n8n template JSON string containing every placeholder that
 * PrepareDownloadModal is responsible for substituting.
 */
const FIXTURE = JSON.stringify({
  _isc_version: '1.0.0',
  name: 'ISC — Test Workflow',
  nodes: [
    {
      id: 'node-webhook',
      parameters: {
        webhookUrl: 'https://YOUR_ISC_DOMAIN/api/v1/webhooks/inbound',
        apiKey: 'REPLACE_WITH_ISC_API_KEY',
      },
    },
    {
      id: 'node-http',
      parameters: {
        url: 'https://YOUR_ISC_DOMAIN/api/v1/kpis',
        headers: { 'x-api-key': 'REPLACE_WITH_ISC_API_KEY' },
      },
    },
    {
      id: 'node-n8n-callback',
      parameters: {
        // Both n8n URL placeholder variants must be replaced together
        url: 'YOUR_N8N_INSTANCE_URL/webhook/trigger',
        altUrl: 'REPLACE_WITH_N8N_INSTANCE_URL/api/v1/workflows',
      },
    },
  ],
  connections: {},
});

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('applyTemplatePlaceholders', () => {

  /* ── A. All fields filled — no placeholder survives ───────────────────── */

  it('A — no placeholder string survives when all fields are filled', () => {
    const output = applyTemplatePlaceholders(FIXTURE, {
      apiKey: 'isc_live_abc123xyz',
      domain: 'app.example.com',
      n8nUrl: 'https://n8n.mycompany.com',
      fallbackHostname: 'fallback.example.com',
    });

    // All three placeholder families must be gone
    expect(output).not.toContain('REPLACE_WITH_ISC_API_KEY');
    expect(output).not.toContain('YOUR_ISC_DOMAIN');
    expect(output).not.toContain('YOUR_N8N_INSTANCE_URL');
    expect(output).not.toContain('REPLACE_WITH_N8N_INSTANCE_URL');

    // Substituted values must be present
    expect(output).toContain('isc_live_abc123xyz');
    expect(output).toContain('app.example.com');
    expect(output).toContain('https://n8n.mycompany.com');
  });

  /* ── B. n8n URL left blank — its placeholders survive intact ──────────── */

  it('B — n8n URL placeholders survive when the n8n URL field is empty', () => {
    const output = applyTemplatePlaceholders(FIXTURE, {
      apiKey: 'isc_live_abc123xyz',
      domain: 'app.example.com',
      n8nUrl: '',                          // optional field left blank
      fallbackHostname: 'fallback.example.com',
    });

    // API key and domain must still be replaced
    expect(output).not.toContain('REPLACE_WITH_ISC_API_KEY');
    expect(output).not.toContain('YOUR_ISC_DOMAIN');

    // n8n URL placeholders must remain (not replaced with empty string)
    expect(output).toContain('YOUR_N8N_INSTANCE_URL');
    expect(output).toContain('REPLACE_WITH_N8N_INSTANCE_URL');
  });

  /* ── C. Whitespace-only n8n URL is treated as blank ──────────────────── */

  it('C — whitespace-only n8n URL is treated the same as blank', () => {
    const output = applyTemplatePlaceholders(FIXTURE, {
      apiKey: 'isc_live_abc123xyz',
      domain: 'app.example.com',
      n8nUrl: '   ',                       // only spaces — treated as blank
      fallbackHostname: 'fallback.example.com',
    });

    expect(output).toContain('YOUR_N8N_INSTANCE_URL');
    expect(output).toContain('REPLACE_WITH_N8N_INSTANCE_URL');
  });

  /* ── D. Empty domain falls back to fallbackHostname ──────────────────── */

  it('D — empty domain falls back to fallbackHostname so YOUR_ISC_DOMAIN is still replaced', () => {
    const output = applyTemplatePlaceholders(FIXTURE, {
      apiKey: 'isc_live_abc123xyz',
      domain: '',                          // user cleared the field
      n8nUrl: '',
      fallbackHostname: 'localhost',
    });

    // YOUR_ISC_DOMAIN must still be gone (replaced with 'localhost')
    expect(output).not.toContain('YOUR_ISC_DOMAIN');
    expect(output).toContain('localhost');
  });
});
