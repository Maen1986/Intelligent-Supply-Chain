/**
 * GET /api/admin/automations/inbound-log — export mode with action filter (Task 679).
 *
 * Confirms that export=1 removes the row cap and returns all matching rows when
 * an action filter is active, not just the first page (≤200 rows).
 *
 * Also confirms that:
 *  - export=1 without a filter returns all rows (no LIMIT applied).
 *  - A non-export request with the same action filter is capped at ≤200.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

vi.mock('../src/middlewares/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../src/lib/scheduler', () => ({
  runWeeklyKpiDigest:        vi.fn(),
  runMonthlyScorecardDigest: vi.fn(),
  runLeadFollowup:           vi.fn(),
  runStaleDataNudge:         vi.fn(),
}));

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn(),
  dispatchEvent:   vi.fn(),
}));

import adminAutomationsRouter from '../src/routes/adminAutomations';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function makeApp_() {
  return makeApp('/api/admin/automations', adminAutomationsRouter, {
    userId: 1, userRole: 'admin',
  });
}

function makeRow(id: number, action = 'create_notification') {
  return {
    id,
    action,
    bodySnippet: `{"event":"test"}`,
    status: 'ok',
    error: null,
    receivedAt: new Date(Date.now() - id * 1000).toISOString(),
  };
}

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 679 — export=1 with action filter returns all matching rows
══════════════════════════════════════════════════════════════════════════ */

describe('GET /inbound-log — export=1 with action filter (Task 679)', () => {
  it('returns all 250 matching rows when export=1 and action filter is active', async () => {
    // Simulate 250 rows that match the action filter — more than the 200-row cap.
    const matchingRows = Array.from({ length: 250 }, (_, i) =>
      makeRow(i + 1, 'create_notification'),
    );

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: matchingRows })   // data rows
      .mockResolvedValueOnce({ rows: [{ total: 250 }] }); // COUNT(*) total

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/inbound-log?export=1&action=create_notification',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(250);
    expect(res.body.total).toBe(250);
    // The limit field must reflect the actual number of rows (no cap applied).
    expect(res.body.limit).toBe(250);
  });

  it('export=1 without a filter also returns all rows uncapped', async () => {
    const allRows = Array.from({ length: 350 }, (_, i) => makeRow(i + 1));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: allRows })
      .mockResolvedValueOnce({ rows: [{ total: 350 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/inbound-log?export=1',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(350);
    expect(res.body.total).toBe(350);
    expect(res.body.limit).toBe(350);
  });

  it('non-export request with the same filter is capped at ≤200 rows', async () => {
    // Return 200 rows as the page (the real cap enforced by the route).
    const pageRows = Array.from({ length: 200 }, (_, i) =>
      makeRow(i + 1, 'create_notification'),
    );

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: pageRows })
      .mockResolvedValueOnce({ rows: [{ total: 250 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/inbound-log?action=create_notification&limit=200',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(200);
    expect(res.body.total).toBe(250);
    // Limit must be ≤200 for non-export requests.
    expect(res.body.limit).toBeLessThanOrEqual(200);
  });

  it('returns 200 with an empty logs array when no rows match the filter', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/inbound-log?export=1&action=no_such_action',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});
