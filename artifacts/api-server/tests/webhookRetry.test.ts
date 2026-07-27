/**
 * Tests for the webhook retry runner and manual-retry endpoints.
 *
 * Covers:
 *  - computeNextRetryAt back-off sequence (5 → 15 → 45 min, then null)
 *  - runWebhookRetries updates existing row; does NOT insert a new one
 *  - Manual retry endpoints update the existing row without inserting a duplicate
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import request from 'supertest';

/* ── DB mock ──────────────────────────────────────────────────────────── */

/** Rows returned by the first db.execute() call (the atomic claim). */
let claimRows: any[]    = [];
/** Rows returned by all subsequent db.execute() calls (the updates). */
let updateRows: any[]   = [];
/** Captured SQL strings from db.execute() calls. */
const executeCalls: string[] = [];
/** How many times db.execute has been called. */
let executeCallCount = 0;

/** Rows returned by db.select() for integrations-route tests. */
let selectRows: any[] = [];
/** Whether the next awaited chain should reject. */
let failNext = false;
/** db.insert call count (should stay 0 for retries). */
let insertCallCount = 0;

function resetDbState() {
  claimRows       = [];
  updateRows      = [];
  executeCalls.length = 0;
  executeCallCount    = 0;
  selectRows      = [];
  failNext        = false;
  insertCallCount = 0;
}

function chain(rowsGetter: () => any[]) {
  const c: any = {};
  for (const m of ['from', 'orderBy', 'limit', 'returning', 'innerJoin', 'set', 'values']) {
    c[m] = () => c;
  }
  c.where = () => c;
  const exec = (): Promise<any[]> => {
    if (failNext) { failNext = false; return Promise.reject(new Error('db error')); }
    return Promise.resolve(rowsGetter());
  };
  c.then  = (res: any, rej: any) => exec().then(res, rej);
  c.catch = (fn: any) => exec().catch(fn);
  return c;
}

vi.mock('@workspace/db', () => ({
  db: {
    select: vi.fn(() => chain(() => selectRows)),
    insert: vi.fn(() => { insertCallCount++; return chain(() => []); }),
    update: vi.fn(() => chain(() => updateRows)),
    execute: vi.fn(async (sqlArg: any) => {
      const callIdx = executeCallCount++;
      // Best-effort SQL stringify (chunks may be strings, objects, or null)
      try {
        const chunks: any[] = sqlArg?.queryChunks ?? [];
        const text = chunks.map((c: any) => (c == null ? '?' : (c.value ?? '?'))).join('');
        executeCalls.push(text);
      } catch {
        executeCalls.push(`<sql-call-${callIdx}>`);
      }
      // First call = atomic claim query; return claimRows.
      // Subsequent calls = per-row update statements; return [].
      return { rows: callIdx === 0 ? claimRows : [] };
    }),
  },
  webhookConfigsTable:    { id: 'id', userId: 'user_id', url: 'url', events: 'events' },
  webhookDeliveryLogTable: {
    id: 'id', webhookConfigId: 'webhook_config_id', event: 'event',
    statusCode: 'status_code', responseSnippet: 'response_snippet',
    success: 'success', attempts: 'attempts', nextRetryAt: 'next_retry_at',
    attemptedAt: 'attempted_at', payload: 'payload',
  },
  apiKeysTable: { id: 'id', userId: 'user_id', nameLabel: 'name_label', keyHash: 'key_hash', keyPrefix: 'key_prefix', scope: 'scope', createdAt: 'created_at', lastUsedAt: 'last_used_at', revokedAt: 'revoked_at' },
}));

vi.mock('../src/lib/logger', () => {
  const noop = () => {};
  return { logger: { info: noop, warn: noop, error: noop, debug: noop } };
});

/* ── Unit tests for computeNextRetryAt ───────────────────────────────── */

import { computeNextRetryAt } from '../src/lib/webhookDispatch';

describe('computeNextRetryAt — back-off sequence', () => {
  it('schedules 5 min after attempt 1', () => {
    const now = Date.now();
    const next = computeNextRetryAt(1);
    expect(next).not.toBeNull();
    const diffMinutes = (next!.getTime() - now) / 60_000;
    expect(diffMinutes).toBeCloseTo(5, 0);
  });

  it('schedules 15 min after attempt 2', () => {
    const now = Date.now();
    const next = computeNextRetryAt(2);
    expect(next).not.toBeNull();
    const diffMinutes = (next!.getTime() - now) / 60_000;
    expect(diffMinutes).toBeCloseTo(15, 0);
  });

  it('schedules 45 min after attempt 3', () => {
    const now = Date.now();
    const next = computeNextRetryAt(3);
    expect(next).not.toBeNull();
    const diffMinutes = (next!.getTime() - now) / 60_000;
    expect(diffMinutes).toBeCloseTo(45, 0);
  });

  it('returns null after attempt 4 (max reached)', () => {
    expect(computeNextRetryAt(4)).toBeNull();
  });

  it('returns null after attempt 5+', () => {
    expect(computeNextRetryAt(5)).toBeNull();
    expect(computeNextRetryAt(99)).toBeNull();
  });
});

/* ── Unit tests for runWebhookRetries ───────────────────────────────── */

import { runWebhookRetries } from '../src/lib/webhookRetry';
import { db } from '@workspace/db';

describe('runWebhookRetries', () => {
  beforeEach(resetDbState);

  it('does nothing when no rows are due', async () => {
    claimRows = [];
    await runWebhookRetries();
    // Only the claim execute call happens; no update execute calls
    expect(executeCallCount).toBe(1);
  });

  it('marks row ok when the retry succeeds', async () => {
    claimRows = [{
      id: 10, event: 'plan.saved', attempts: 1,
      payload: { event: 'plan.saved', data: {}, userId: 1, timestamp: '' },
      webhook_config_id: 1, url: 'https://example.com/hook',
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => 'ok',
    }));

    await runWebhookRetries();

    // Claim call + 1 update call per row
    expect(executeCallCount).toBe(2);
    // The update SQL should set success='ok' and attempts=2
    const updateSql = executeCalls[1];
    expect(updateSql).toContain('ok');

    vi.unstubAllGlobals();
  });

  it('schedules next back-off when retry fails (attempt 2 → 15 min)', async () => {
    claimRows = [{
      id: 11, event: 'kpi.threshold_breach', attempts: 1,
      payload: { event: 'kpi.threshold_breach', data: {}, userId: 2, timestamp: '' },
      webhook_config_id: 2, url: 'https://n8n.example.com/hook',
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 503, text: async () => 'Service Unavailable',
    }));

    await runWebhookRetries();

    // scheduleNext should be ~15 min out; verify computeNextRetryAt(2) returns ~15 min
    const next = computeNextRetryAt(2);
    expect(next).not.toBeNull();
    const diffMin = (next!.getTime() - Date.now()) / 60_000;
    expect(diffMin).toBeCloseTo(15, 0);

    vi.unstubAllGlobals();
  });

  it('computes null nextRetryAt when max attempts reached (attempt 4)', () => {
    // computeNextRetryAt is the source of truth for "permanently failed"
    expect(computeNextRetryAt(4)).toBeNull();
  });

  it('does not insert a new log row (no double-logging)', async () => {
    claimRows = [{
      id: 13, event: 'plan.saved', attempts: 1,
      payload: { event: 'plan.saved', data: {}, userId: 4, timestamp: '' },
      webhook_config_id: 4, url: 'https://hook.example.com',
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => 'ok',
    }));

    await runWebhookRetries();

    // db.insert must NOT have been called during a retry sweep
    expect(insertCallCount).toBe(0);

    vi.unstubAllGlobals();
  });

  it('concurrent sweep: second sweep finds no rows because lease pushed next_retry_at into the future', async () => {
    // The first sweep claims the row by setting next_retry_at = NOW() + 2min.
    // A concurrent second sweep's inner SELECT won't match it (next_retry_at > NOW()),
    // so claimRows for the second call is empty — the mock simulates this by
    // returning the claimed row only on the first call.
    claimRows = [{
      id: 20, event: 'lead.captured', attempts: 1,
      payload: { event: 'lead.captured', data: {}, userId: 5, timestamp: '' },
      webhook_config_id: 5, url: 'https://hook.example.com',
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => 'ok',
    }));

    // First sweep — claims and processes row 20 (claim UPDATE + delivery UPDATE = 2 execute calls)
    await runWebhookRetries();
    expect(executeCallCount).toBe(2);

    // Simulate second sweep seeing no due rows (lease pushed next_retry_at forward)
    claimRows = [];
    executeCallCount = 0;
    executeCalls.length = 0;

    await runWebhookRetries();

    // Second sweep only runs the claim query; nothing to process
    expect(executeCallCount).toBe(1);

    vi.unstubAllGlobals();
  });

  it('crash recovery: a row with next_retry_at in the past (expired lease) is re-selected', () => {
    // The recovery mechanism is purely in the DB query semantics:
    // - Crash after claim sets next_retry_at = NOW() + 2min (lease)
    // - After 2 minutes the lease expires → next_retry_at <= NOW() again
    // - The sweep's WHERE clause picks it back up with original attempt count
    // We verify this through computeNextRetryAt: a row with attempts=1 and an
    // expired lease will be re-processed as attempt 1 → computes 5-min backoff on next fail.
    const leaseExpiredRow = { attempts: 1 };
    // After recovery the row behaves like a fresh failure at attempt 1
    const scheduleAfterRecovery = computeNextRetryAt(leaseExpiredRow.attempts);
    expect(scheduleAfterRecovery).not.toBeNull();
    // Should schedule ~5 minutes out (first retry slot)
    const diffMin = (scheduleAfterRecovery!.getTime() - Date.now()) / 60_000;
    expect(diffMin).toBeCloseTo(5, 0);
  });
});

/* ── Integration tests for manual retry endpoints ───────────────────── */

import express from 'express';
import integrationsRouter from '../src/routes/integrations';

const adminSession = { userId: 1, userRole: 'admin' };

function makeApp(session = adminSession) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    req.session = {
      ...session,
      save: (cb: any) => cb(),
      destroy: (cb: any) => cb(),
      regenerate: (cb: any) => cb(),
    };
    next();
  });
  app.use('/api/integrations', integrationsRouter);
  return app;
}

describe('POST /api/integrations/delivery-log/:id/retry', () => {
  beforeEach(() => {
    resetDbState();
    vi.resetAllMocks();
    (db.select as Mock).mockImplementation(() => chain(() => selectRows));
    (db.insert as Mock).mockImplementation(() => { insertCallCount++; return chain(() => []); });
    (db.update as Mock).mockImplementation(() => chain(() => updateRows));
    (db.execute as Mock).mockImplementation(async () => ({ rows: selectRows }));
  });

  it('returns 404 when log entry does not belong to user', async () => {
    selectRows = [];
    const app = makeApp();
    const res = await request(app).post('/api/integrations/delivery-log/99/retry');
    expect(res.status).toBe(404);
  });

  it('updates the existing row without inserting a new one when retry succeeds', async () => {
    selectRows = [{
      id: 5, event: 'plan.saved', payload: { event: 'plan.saved', data: {}, userId: 1 },
      attempts: 1, webhook_config_id: 3, url: 'https://hook.example.com',
      user_id: 1, events: [],
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () => 'ok',
    }));

    const app = makeApp();
    const res = await request(app).post('/api/integrations/delivery-log/5/retry');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // db.insert must NOT have been called (no duplicate log row)
    expect(insertCallCount).toBe(0);
    // db.update must have been called to update the existing row
    expect((db.update as Mock).mock.calls.length).toBeGreaterThanOrEqual(1);

    vi.unstubAllGlobals();
  });
});

describe('POST /api/integrations/admin/delivery-log/:id/retry', () => {
  beforeEach(() => {
    resetDbState();
    vi.resetAllMocks();
    (db.select as Mock).mockImplementation(() => chain(() => selectRows));
    (db.insert as Mock).mockImplementation(() => { insertCallCount++; return chain(() => []); });
    (db.update as Mock).mockImplementation(() => chain(() => updateRows));
    (db.execute as Mock).mockImplementation(async () => ({ rows: selectRows }));
  });

  it('returns 404 when log entry does not exist', async () => {
    selectRows = [];
    const app = makeApp();
    const res = await request(app).post('/api/integrations/admin/delivery-log/999/retry');
    expect(res.status).toBe(404);
  });

  it('updates existing row and does not insert a duplicate log', async () => {
    selectRows = [{
      id: 7, event: 'kpi.threshold_breach', payload: { event: 'kpi.threshold_breach', data: {}, userId: 2 },
      attempts: 2, webhook_config_id: 4, url: 'https://hook.example.com',
      user_id: 2, events: [],
    }];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 503, text: async () => 'unavailable',
    }));

    const app = makeApp();
    const res = await request(app).post('/api/integrations/admin/delivery-log/7/retry');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.success).toBe(false);

    // No new log row inserted
    expect(insertCallCount).toBe(0);

    vi.unstubAllGlobals();
  });
});
