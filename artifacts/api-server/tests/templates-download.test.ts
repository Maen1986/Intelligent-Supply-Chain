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
let makeId: string;
let zapierId: string;

beforeAll(() => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as {
    templates: Array<{ id: string; platform?: string }>;
  };
  firstId = manifest.templates[0].id;
  const makeEntry = manifest.templates.find(t => t.platform === 'make');
  const zapierEntry = manifest.templates.find(t => t.platform === 'zapier');
  if (!makeEntry) throw new Error('No make template found in manifest');
  if (!zapierEntry) throw new Error('No zapier template found in manifest');
  makeId = makeEntry.id;
  zapierId = zapierEntry.id;
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

  it('returns 200 and parseable JSON for a make template ID', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${makeId}/download`,
    );

    expect(res.status).toBe(200);
    expect(() => JSON.parse(res.text)).not.toThrow();
  });

  it('returns 200 and parseable JSON for a zapier template ID', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${zapierId}/download`,
    );

    expect(res.status).toBe(200);
    expect(() => JSON.parse(res.text)).not.toThrow();
  });

  it('serves a make template from the make-templates folder — content has make schema keys', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${makeId}/download`,
    );

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    // Make templates have a `flow` key (scenario steps); zapier templates use `steps` instead.
    expect(body).toHaveProperty('flow');
    expect(body).not.toHaveProperty('steps');
  });

  it('serves a zapier template from the zapier-templates folder — content has zapier schema keys', async () => {
    const adminRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminRouter, { userId: 1, role: 'admin' });

    const res = await request(app).get(
      `/api/admin/automations/templates/${zapierId}/download`,
    );

    expect(res.status).toBe(200);
    const body = JSON.parse(res.text);
    // Zapier templates have a `steps` array; make templates use `flow` instead.
    expect(body).toHaveProperty('steps');
    expect(body).not.toHaveProperty('flow');
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
