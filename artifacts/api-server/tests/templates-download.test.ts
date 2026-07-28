/**
 * Tests for GET /api/admin/automations/templates/:id/download
 *
 * Confirms:
 *  1. A valid ID whose file exists on disk is served successfully.
 *  2. An unknown template ID returns 404 with a clear JSON error.
 *  3. A valid ID whose file has been deleted returns 404 with a clear,
 *     user-readable JSON error — not a raw ENOENT or a silent blank response.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { makeApp, makeLoggerMock } from './helpers';

/* ── mocks ───────────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => makeLoggerMock());

vi.mock('../src/middlewares/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@workspace/db', () => ({
  db: {},
  scheduleLogTable: {},
  inboundWebhookLogTable: {},
  webhookDeliveryLogTable: {},
  webhookConfigsTable: {},
  sql: vi.fn(),
  desc: vi.fn(),
}));

vi.mock('../src/lib/scheduler', () => ({
  runWeeklyKpiDigest: vi.fn(),
  runMonthlyScorecardDigest: vi.fn(),
  runLeadFollowup: vi.fn(),
  runStaleDataNudge: vi.fn(),
}));

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn(),
}));

// Mock fs/promises: keep all real implementations but replace `access` with a
// controllable stub. Using `importOriginal` inside the factory avoids the
// circular-reference issue that occurs when the hoisted mock factory captures
// a top-level `import('fs/promises')` that is itself already mocked.

// Tracks whether the next `access` call should simulate a missing file.
let _simulateMissingFile = false;

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return {
    ...actual,
    access: (..._args: any[]) => {
      if (_simulateMissingFile) {
        _simulateMissingFile = false;
        return Promise.reject(
          Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
        );
      }
      return Promise.resolve();
    },
  };
});

/* ── fixtures ────────────────────────────────────────────────────────────── */

const MANIFEST_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public/n8n-templates/manifest.json',
);

let firstId: string;

beforeAll(() => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  firstId = manifest.templates[0].id as string;
});

/* ── tests ───────────────────────────────────────────────────────────────── */

describe('GET /api/admin/automations/templates/:id/download', () => {
  it('returns 200 and file content for a valid template ID', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${firstId}/download`,
    );

    expect(res.status).toBe(200);
    // Should be valid JSON (the template file)
    expect(() => JSON.parse(res.text)).not.toThrow();
  });

  it('returns 404 with a clear JSON error for an unknown template ID', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      '/api/admin/automations/templates/this-id-does-not-exist/download',
    );

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('returns 404 with a clear user-readable JSON error when the file is missing from disk', async () => {
    // The next `access` call in the route will reject (file deleted scenario).
    _simulateMissingFile = true;

    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${firstId}/download`,
    );

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
    // Error must explain the situation to the user — not expose raw filesystem details
    expect(res.body.error).not.toMatch(/ENOENT/i);
    expect(res.body.error).toMatch(/unavailable/i);
  });
});
