/**
 * Smoke-tests for the automation template library.
 *
 * Confirms:
 *  1. GET /api/admin/automations/templates returns all 24 templates (8 n8n +
 *     8 make + 8 zapier) — including the 10 new Make.com and Zapier entries.
 *  2. Every template has a well-formed downloadPath that points to an actual
 *     file on disk (no 404s).
 *  3. Platform filter counts: make === 8, zapier === 8, n8n === 8.
 *  4. The 10 new template IDs are present in the response.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { makeApp, makeLoggerMock } from './helpers';

/* ── mocks ───────────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => makeLoggerMock());

// requireAdmin middleware: grant admin access unconditionally in tests.
vi.mock('../src/middlewares/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// The templates route has no DB calls, but the router module imports @workspace/db
// at the top level; we stub it so the import resolves.
vi.mock('@workspace/db', () => ({
  db: {},
  scheduleLogTable: {},
  inboundWebhookLogTable: {},
  webhookDeliveryLogTable: {},
  webhookConfigsTable: {},
  sql: vi.fn(),
  desc: vi.fn(),
}));

// Scheduler functions imported at module level.
vi.mock('../src/lib/scheduler', () => ({
  runWeeklyKpiDigest: vi.fn(),
  runMonthlyScorecardDigest: vi.fn(),
  runLeadFollowup: vi.fn(),
  runStaleDataNudge: vi.fn(),
}));

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn(),
}));

/* ── constants ───────────────────────────────────────────────────────────── */

const NEW_MAKE_IDS = [
  'make-lead-nurture-sequence',
  'make-ai-plan-ready-notification',
  'make-monthly-supplier-scorecard',
  'make-erp-data-sync',
  'make-escalation-router',
];

const NEW_ZAPIER_IDS = [
  'zapier-lead-nurture-sequence',
  'zapier-ai-plan-ready-notification',
  'zapier-monthly-supplier-scorecard',
  'zapier-erp-data-sync',
  'zapier-escalation-router',
];

const PUBLIC_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public',
);

/* ── tests ───────────────────────────────────────────────────────────────── */

describe('GET /api/admin/automations/templates', () => {
  let body: any;

  beforeAll(async () => {
    const adminAutomationsRouter = (await import('../src/routes/adminAutomations')).default;
    const app = makeApp('/api/admin/automations', adminAutomationsRouter, {
      userId: 1,
      role: 'admin',
    });
    const res = await request(app).get('/api/admin/automations/templates');
    expect(res.status).toBe(200);
    body = res.body;
  });

  it('returns ok:true', () => {
    expect(body.ok).toBe(true);
  });

  it('returns exactly 24 templates (8 n8n + 8 make + 8 zapier)', () => {
    expect(body.templates).toHaveLength(24);
  });

  it('returns 8 Make.com templates', () => {
    const make = body.templates.filter((t: any) => t.platform === 'make');
    expect(make).toHaveLength(8);
  });

  it('returns 8 Zapier templates', () => {
    const zapier = body.templates.filter((t: any) => t.platform === 'zapier');
    expect(zapier).toHaveLength(8);
  });

  it('includes all 5 new Make.com template IDs', () => {
    const ids: string[] = body.templates.map((t: any) => t.id);
    for (const id of NEW_MAKE_IDS) {
      expect(ids, `missing make template: ${id}`).toContain(id);
    }
  });

  it('includes all 5 new Zapier template IDs', () => {
    const ids: string[] = body.templates.map((t: any) => t.id);
    for (const id of NEW_ZAPIER_IDS) {
      expect(ids, `missing zapier template: ${id}`).toContain(id);
    }
  });

  it('every template has a downloadPath field', () => {
    for (const t of body.templates) {
      expect(t.downloadPath, `${t.id} missing downloadPath`).toBeTruthy();
    }
  });

  it('every Make.com template downloadPath starts with make-templates/', () => {
    const make = body.templates.filter((t: any) => t.platform === 'make');
    for (const t of make) {
      expect(
        t.downloadPath,
        `${t.id} has wrong folder`,
      ).toMatch(/^make-templates\//);
    }
  });

  it('every Zapier template downloadPath starts with zapier-templates/', () => {
    const zapier = body.templates.filter((t: any) => t.platform === 'zapier');
    for (const t of zapier) {
      expect(
        t.downloadPath,
        `${t.id} has wrong folder`,
      ).toMatch(/^zapier-templates\//);
    }
  });

  it('every downloadPath resolves to an existing file on disk (no 404s)', () => {
    for (const t of body.templates) {
      const fullPath = join(PUBLIC_DIR, t.downloadPath);
      expect(
        existsSync(fullPath),
        `file missing for ${t.id}: ${t.downloadPath}`,
      ).toBe(true);
    }
  });

  it('every template has bilingual name and description', () => {
    for (const t of body.templates) {
      expect(t.name,        `${t.id} missing name`).toBeTruthy();
      expect(t.nameAr,      `${t.id} missing nameAr`).toBeTruthy();
      expect(t.description, `${t.id} missing description`).toBeTruthy();
      expect(t.descriptionAr, `${t.id} missing descriptionAr`).toBeTruthy();
    }
  });
});
