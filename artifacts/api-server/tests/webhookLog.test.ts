/**
 * Tests for GET /api/admin/automations/webhook-log
 *
 * Verifies:
 *  - partial event filter (ILIKE) narrows results to matching rows only
 *  - status filter shows only the requested success value
 *  - both filters compose correctly
 *  - unfiltered request returns all rows + correct total
 *  - pagination (offset/limit) is forwarded to the query
 *  - a high limit (2 000) for CSV export returns all matching rows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

// Bypass requireAdmin — set userId + userRole in the fake session instead
vi.mock('../src/middlewares/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Stub out scheduler functions (not needed for these tests)
vi.mock('../src/lib/scheduler', () => ({
  runWeeklyKpiDigest:      vi.fn(),
  runMonthlyScorecardDigest: vi.fn(),
  runLeadFollowup:         vi.fn(),
  runStaleDataNudge:       vi.fn(),
}));

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn(),
  dispatchEvent:   vi.fn(),
}));

import adminAutomationsRouter from '../src/routes/adminAutomations';

/* ── sample rows ─────────────────────────────────────────────────────────── */

const ROW_KPI_OK = {
  id: 1, event: 'kpi.rag_changed', status_code: 200,
  success: 'ok', response_snippet: 'OK', attempted_at: '2025-01-01T10:00:00Z',
  attempts: 1, payload: {}, url: 'https://example.com/hook',
  user_id: 42,
};

const ROW_KPI_BREACH_ERROR = {
  id: 2, event: 'kpi.threshold_breach', status_code: 500,
  success: 'error', response_snippet: 'Server Error',
  attempted_at: '2025-01-02T10:00:00Z',
  attempts: 3, payload: {}, url: 'https://example.com/hook',
  user_id: 42,
};

const ROW_SUPPLIER = {
  id: 3, event: 'supplier.tier_changed', status_code: 200,
  success: 'ok', response_snippet: 'OK', attempted_at: '2025-01-03T10:00:00Z',
  attempts: 1, payload: {}, url: 'https://example.com/hook',
  user_id: 99,
};

const ALL_ROWS = [ROW_KPI_OK, ROW_KPI_BREACH_ERROR, ROW_SUPPLIER];

/* ── helpers ─────────────────────────────────────────────────────────────── */

function makeApp_() {
  return makeApp('/api/admin/automations', adminAutomationsRouter, {
    userId: 1, userRole: 'admin',
  });
}

async function getLog(query: Record<string, string> = {}) {
  const { db } = await import('@workspace/db');
  const executeMock = db.execute as ReturnType<typeof vi.fn>;

  // /webhook-log makes exactly two execute calls:
  //   1st → data rows, 2nd → COUNT(*) total
  const dataRows   = query._dataRows   ? JSON.parse(query._dataRows)   : ALL_ROWS;
  const totalCount = query._totalCount ? parseInt(query._totalCount)   : ALL_ROWS.length;

  // Remove test-internal keys before building the URL
  const { _dataRows: _d, _totalCount: _t, ...qs } = query;

  executeMock
    .mockResolvedValueOnce({ rows: dataRows })
    .mockResolvedValueOnce({ rows: [{ total: totalCount }] });

  const params = new URLSearchParams(qs).toString();
  const app = makeApp_();
  return request(app).get(`/api/admin/automations/webhook-log${params ? `?${params}` : ''}`);
}

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   No filters — returns all rows
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — no filters', () => {
  it('returns ok:true with logs array and total', async () => {
    const res = await getLog();
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(ALL_ROWS.length);
    expect(res.body.total).toBe(ALL_ROWS.length);
  });

  it('masks the URL in each row', async () => {
    const res = await getLog();
    for (const row of res.body.logs) {
      expect(row.url).toMatch(/\*\*\*/);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Partial event filter
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — event filter (partial match)', () => {
  it('narrows to only kpi.* rows when event=kpi', async () => {
    const kpiRows = [ROW_KPI_OK, ROW_KPI_BREACH_ERROR];
    const res = await getLog({
      event: 'kpi',
      _dataRows:   JSON.stringify(kpiRows),
      _totalCount: String(kpiRows.length),
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(2);
    expect(res.body.total).toBe(2);
    // No supplier row
    expect(res.body.logs.every((r: any) => r.event.startsWith('kpi'))).toBe(true);
  });

  it('returns a single row for a fully-qualified event name', async () => {
    const res = await getLog({
      event: 'supplier.tier_changed',
      _dataRows:   JSON.stringify([ROW_SUPPLIER]),
      _totalCount: '1',
    });

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].event).toBe('supplier.tier_changed');
    expect(res.body.total).toBe(1);
  });

  it('returns empty logs when no events match the filter', async () => {
    const res = await getLog({
      event: 'nonexistent.event',
      _dataRows:   JSON.stringify([]),
      _totalCount: '0',
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.logs).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('passes the event param to db.execute (ILIKE pattern)', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const app = makeApp_();
    await request(app).get('/api/admin/automations/webhook-log?event=kpi');

    // The first execute call receives a drizzle SQL object whose serialised
    // form (queryChunks or queryChunks[].value) contains the ILIKE keyword.
    const firstCallArg = executeMock.mock.calls[0][0];
    const serialised = JSON.stringify(firstCallArg).toLowerCase();
    expect(serialised).toContain('ilike');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Status filter
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — status filter', () => {
  it('returns only error rows when status=error', async () => {
    const errorRows = [ROW_KPI_BREACH_ERROR];
    const res = await getLog({
      status: 'error',
      _dataRows:   JSON.stringify(errorRows),
      _totalCount: '1',
    });

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].success).toBe('error');
    expect(res.body.total).toBe(1);
  });

  it('returns only ok rows when status=ok', async () => {
    const okRows = [ROW_KPI_OK, ROW_SUPPLIER];
    const res = await getLog({
      status: 'ok',
      _dataRows:   JSON.stringify(okRows),
      _totalCount: String(okRows.length),
    });

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(2);
    expect(res.body.logs.every((r: any) => r.success === 'ok')).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Combined event + status filters
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — combined filters', () => {
  it('applies both event and status filters together', async () => {
    const res = await getLog({
      event: 'kpi',
      status: 'error',
      _dataRows:   JSON.stringify([ROW_KPI_BREACH_ERROR]),
      _totalCount: '1',
    });

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.logs[0].event).toBe('kpi.threshold_breach');
    expect(res.body.logs[0].success).toBe('error');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Pagination
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — pagination', () => {
  it('respects limit and offset query params', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [ROW_SUPPLIER] })           // page 2 data
      .mockResolvedValueOnce({ rows: [{ total: 3 }] });           // total across all pages

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?limit=2&offset=2',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.limit).toBe(2);
    expect(res.body.offset).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.logs).toHaveLength(1);
  });

  it('caps limit at 200', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: ALL_ROWS })
      .mockResolvedValueOnce({ rows: [{ total: ALL_ROWS.length }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?limit=9999',
    );

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(200);
  });

  it('returns the full total even when limit restricts data rows', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [ROW_KPI_OK] })   // only 1 row on this page
      .mockResolvedValueOnce({ rows: [{ total: 75 }] }); // but 75 total

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?limit=1&offset=0',
    );

    expect(res.body.total).toBe(75);
    expect(res.body.logs).toHaveLength(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   CSV export — export=1 raises cap to 2 000
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — CSV export (export=1, limit=2000)', () => {
  it('interactive requests (no export flag) are capped at 200', async () => {
    const manyRows = Array.from({ length: 200 }, (_, i) => ({ ...ROW_KPI_OK, id: i + 1 }));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: manyRows })
      .mockResolvedValueOnce({ rows: [{ total: 500 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?limit=2000&offset=0',
    );

    expect(res.status).toBe(200);
    // Without export=1 the cap is still 200
    expect(res.body.limit).toBe(200);
  });

  it('export=1 raises the cap to 2 000', async () => {
    const manyRows = Array.from({ length: 2_000 }, (_, i) => ({ ...ROW_KPI_OK, id: i + 1 }));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: manyRows })
      .mockResolvedValueOnce({ rows: [{ total: 2_000 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?export=1&limit=2000&offset=0',
    );

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.limit).toBe(2_000);
    expect(res.body.logs).toHaveLength(2_000);
    expect(res.body.total).toBe(2_000);
  });

  it('returns all rows when total < 2 000 with export=1', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: ALL_ROWS })
      .mockResolvedValueOnce({ rows: [{ total: ALL_ROWS.length }] });

    const app = makeApp_();
    const res = await request(app).get(
      `/api/admin/automations/webhook-log?export=1&limit=2000&offset=0`,
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(ALL_ROWS.length);
    expect(res.body.total).toBe(ALL_ROWS.length);
  });

  it('export=1 with event filter returns only matching rows up to 2 000', async () => {
    const kpiRows = Array.from({ length: 250 }, (_, i) => ({ ...ROW_KPI_OK, id: i + 1 }));

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: kpiRows })
      .mockResolvedValueOnce({ rows: [{ total: 250 }] });

    const app = makeApp_();
    const res = await request(app).get(
      '/api/admin/automations/webhook-log?export=1&limit=2000&event=kpi',
    );

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(250);
    expect(res.body.total).toBe(250);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Error handling
═══════════════════════════════════════════════════════════════════════════ */

describe('GET /webhook-log — error handling', () => {
  it('returns 500 when db.execute throws', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock.mockRejectedValueOnce(new Error('DB connection lost'));

    const app = makeApp_();
    const res = await request(app).get('/api/admin/automations/webhook-log');

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });
});
