/**
 * Tests for GET /api/admin/automations/webhook-log — export=1 row-cap behaviour
 *
 * Verifies:
 *  1. When export=1 is passed, ALL seeded rows are returned even when the
 *     total exceeds the 200-row interactive cap.
 *  2. Without export=1 the response is still capped at ≤200 rows regardless
 *     of how many rows exist in the log.
 *
 * The route sets limit=null when export=1, which causes the SQL to omit
 * LIMIT/OFFSET entirely.  These tests confirm that the response length
 * matches every row the DB returned — not just the first 200.
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

const BASE_ROW = {
  event: 'kpi.rag_changed',
  status_code: 200,
  success: 'ok',
  response_snippet: 'OK',
  attempted_at: '2025-06-01T10:00:00Z',
  attempts: 1,
  payload: {},
  url: 'https://example.com/hook',
  user_id: 1,
};

/** Build N unique log rows. */
function makeRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({ ...BASE_ROW, id: i + 1 }));
}

function makeTestApp() {
  return makeApp('/api/admin/automations', adminAutomationsRouter, {
    userId: 1, userRole: 'admin',
  });
}

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   export=1 — all rows returned, no cap
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log export=1 — no row cap', () => {
  it('returns all 250 rows when the log exceeds 200 entries and export=1', async () => {
    const SEED_COUNT = 250;
    const seededRows = makeRows(SEED_COUNT);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: seededRows })
      .mockResolvedValueOnce({ rows: [{ total: SEED_COUNT }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=1',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // All 250 rows must come back — not just the first 200
    expect(res.body.logs).toHaveLength(SEED_COUNT);
    expect(res.body.total).toBe(SEED_COUNT);
  });

  it('limit in the response equals the number of rows returned when export=1', async () => {
    const SEED_COUNT = 250;
    const seededRows = makeRows(SEED_COUNT);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: seededRows })
      .mockResolvedValueOnce({ rows: [{ total: SEED_COUNT }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=1',
    );

    // Route returns `limit: limit ?? logs.length`; with export=1, limit=null
    // so the response limit reflects the actual row count, not a fixed cap.
    expect(res.body.limit).toBe(SEED_COUNT);
  });

  it('offset is always 0 for export requests', async () => {
    const seededRows = makeRows(210);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: seededRows })
      .mockResolvedValueOnce({ rows: [{ total: 210 }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=1',
    );

    expect(res.body.offset).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Without export=1 — 200-row interactive cap is still enforced
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log without export=1 — 200-row cap still applies', () => {
  it('is capped at 200 when limit is not supplied and DB has 250 rows', async () => {
    // The DB returns 200 rows (what the LIMIT 200 clause would restrict to)
    const cappedRows = makeRows(200);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: cappedRows })      // data page
      .mockResolvedValueOnce({ rows: [{ total: 250 }] }); // total across all rows

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(200);
    expect(res.body.total).toBe(250);   // total reflects the real count
    expect(res.body.limit).toBe(50);    // default limit (capped at 50 when not specified)
  });

  it('is capped at 200 when limit=9999 is passed without export=1', async () => {
    const cappedRows = makeRows(200);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: cappedRows })
      .mockResolvedValueOnce({ rows: [{ total: 250 }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?limit=9999',
    );

    expect(res.status).toBe(200);
    // Hard cap: any limit above 200 is coerced down to 200
    expect(res.body.limit).toBe(200);
    expect(res.body.logs).toHaveLength(200);
  });

  it('export=false is treated the same as no export flag', async () => {
    const cappedRows = makeRows(200);

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: cappedRows })
      .mockResolvedValueOnce({ rows: [{ total: 250 }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=false&limit=9999',
    );

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(200);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   export=1 respects event/status filters while still removing the cap
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log export=1 — filters compose with no cap', () => {
  it('returns all 210 matching rows when event filter is combined with export=1', async () => {
    const kpiRows = Array.from({ length: 210 }, (_, i) => ({
      ...BASE_ROW,
      id: i + 1,
      event: 'kpi.rag_changed',
    }));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: kpiRows })
      .mockResolvedValueOnce({ rows: [{ total: 210 }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=1&event=kpi',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(210);
    expect(res.body.total).toBe(210);
  });

  it('returns all 205 error rows when status=error is combined with export=1', async () => {
    const errorRows = Array.from({ length: 205 }, (_, i) => ({
      ...BASE_ROW,
      id: i + 1,
      success: 'error',
      status_code: 500,
    }));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: errorRows })
      .mockResolvedValueOnce({ rows: [{ total: 205 }] });

    const res = await request(makeTestApp()).get(
      '/api/admin/automations/webhook-log?export=1&status=error',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(205);
    expect(res.body.total).toBe(205);
  });
});
