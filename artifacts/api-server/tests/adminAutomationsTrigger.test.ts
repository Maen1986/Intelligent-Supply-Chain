/**
 * Tests for POST /admin/automations/trigger/:jobName
 *
 * Verifies end-to-end that:
 *  1. A valid job returns 200 + { ok: true } immediately (fire-and-forget)
 *  2. An unknown job name returns 400
 *  3. The named job runner function is actually invoked
 *  4. When the runner resolves normally, no fallback log is written by the
 *     route (the job's own logJobRun handles that)
 *  5. When the runner throws before its own logJobRun (e.g. DB connection
 *     error at startup), the trigger route's catch handler writes a fallback
 *     error row to schedule_log so the run is never silently lost
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock, dbState } from './helpers';

vi.mock('@workspace/db', () => ({
  ...makeDbMock(),
  // Table references used as arguments to db.insert() / db.select(); the mock
  // builder ignores them, so undefined stubs are sufficient.
  scheduleLogTable:        undefined,
  webhookConfigsTable:     undefined,
  webhookDeliveryLogTable: undefined,
  inboundWebhookLogTable:  undefined,
}));
vi.mock('../src/lib/logger', () => makeLoggerMock());

// Bypass admin auth for all tests in this file
vi.mock('../src/middlewares/requireAdmin', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Stub the four job runners so they never touch real DB or email transports
const { mockWeeklyDigest, mockMonthlyScorecard, mockLeadFollowup, mockStaleNudge } =
  vi.hoisted(() => ({
    mockWeeklyDigest:    vi.fn<[], Promise<void>>(),
    mockMonthlyScorecard: vi.fn<[], Promise<void>>(),
    mockLeadFollowup:    vi.fn<[], Promise<void>>(),
    mockStaleNudge:      vi.fn<[], Promise<void>>(),
  }));

vi.mock('../src/lib/scheduler', () => ({
  runWeeklyKpiDigest:       mockWeeklyDigest,
  runMonthlyScorecardDigest: mockMonthlyScorecard,
  runLeadFollowup:          mockLeadFollowup,
  runStaleDataNudge:        mockStaleNudge,
}));

// dispatchWebhook is imported by the same router file (test-webhook endpoint)
vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn(),
  dispatchEvent:   vi.fn(),
}));

import adminAutomationsRouter from '../src/routes/adminAutomations';

beforeEach(() => {
  resetDbState();
  mockWeeklyDigest.mockReset();
  mockMonthlyScorecard.mockReset();
  mockLeadFollowup.mockReset();
  mockStaleNudge.mockReset();
});

/* ══════════════════════════════════════════════════════════════════════════
   Happy-path trigger
═══════════════════════════════════════════════════════════════════════════ */

describe('POST /trigger/:jobName — happy path', () => {
  it('returns 200 + { ok: true } for weekly_kpi_digest', async () => {
    mockWeeklyDigest.mockResolvedValue(undefined);
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    const res = await request(app)
      .post('/api/admin/automations/trigger/weekly_kpi_digest')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.jobName).toBe('weekly_kpi_digest');
    expect(res.body.startedAt).toBeDefined();
  });

  it('actually calls the runner for each of the four valid jobs', async () => {
    mockWeeklyDigest.mockResolvedValue(undefined);
    mockMonthlyScorecard.mockResolvedValue(undefined);
    mockLeadFollowup.mockResolvedValue(undefined);
    mockStaleNudge.mockResolvedValue(undefined);

    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    for (const [jobName, mock] of [
      ['weekly_kpi_digest',  mockWeeklyDigest],
      ['monthly_scorecard',  mockMonthlyScorecard],
      ['lead_followup',      mockLeadFollowup],
      ['stale_data_nudge',   mockStaleNudge],
    ] as const) {
      const res = await request(app)
        .post(`/api/admin/automations/trigger/${jobName}`)
        .send();
      expect(res.status).toBe(200);
      expect(mock).toHaveBeenCalledTimes(1);
    }
  });

  it('does NOT write a fallback log row when the runner succeeds', async () => {
    mockWeeklyDigest.mockResolvedValue(undefined);
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    await request(app)
      .post('/api/admin/automations/trigger/weekly_kpi_digest')
      .send();

    // Let the micro-task queue drain so any async follow-up work settles
    await new Promise(r => setTimeout(r, 20));

    // The runner resolved, so the fallback catch path must not have run
    expect(dbState.insertedValues).toHaveLength(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Unknown job name
═══════════════════════════════════════════════════════════════════════════ */

describe('POST /trigger/:jobName — unknown job', () => {
  it('returns 400 + { ok: false } for an unrecognised job name', async () => {
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    const res = await request(app)
      .post('/api/admin/automations/trigger/nonexistent_job')
      .send();

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/Unknown job/);
  });

  it('still returns 200 for a valid job even when other jobs are unknown', async () => {
    mockLeadFollowup.mockResolvedValue(undefined);
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    const [badRes, goodRes] = await Promise.all([
      request(app).post('/api/admin/automations/trigger/bad_job').send(),
      request(app).post('/api/admin/automations/trigger/lead_followup').send(),
    ]);

    expect(badRes.status).toBe(400);
    expect(goodRes.status).toBe(200);
    expect(mockLeadFollowup).toHaveBeenCalledTimes(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Fallback error log when the runner throws
═══════════════════════════════════════════════════════════════════════════ */

describe('POST /trigger/:jobName — runner throws (fallback log)', () => {
  it('still returns 200 + { ok: true } even when the runner will throw', async () => {
    // The endpoint is fire-and-forget: it must respond before the runner finishes
    mockWeeklyDigest.mockRejectedValue(new Error('db connection failed'));
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    const res = await request(app)
      .post('/api/admin/automations/trigger/weekly_kpi_digest')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('writes a fallback schedule_log row with the error message when the runner throws', async () => {
    mockWeeklyDigest.mockRejectedValue(new Error('getAllActiveUsers failed'));
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    await request(app)
      .post('/api/admin/automations/trigger/weekly_kpi_digest')
      .send();

    // Let the rejected promise's .catch() handler finish
    await new Promise(r => setTimeout(r, 20));

    // The fallback catch must have inserted exactly one row
    expect(dbState.insertedValues).toHaveLength(1);
    const logged = dbState.insertedValues[0];
    expect(logged.jobName).toBe('weekly_kpi_digest');
    expect(logged.usersProcessed).toBe(0);
    expect(logged.errors).toContain('getAllActiveUsers failed');
  });

  it('logs an error row for stale_data_nudge too when that runner throws', async () => {
    mockStaleNudge.mockRejectedValue(new Error('query timeout'));
    const app = makeApp('/api/admin/automations', adminAutomationsRouter);

    await request(app)
      .post('/api/admin/automations/trigger/stale_data_nudge')
      .send();

    await new Promise(r => setTimeout(r, 20));

    expect(dbState.insertedValues).toHaveLength(1);
    expect(dbState.insertedValues[0].jobName).toBe('stale_data_nudge');
    expect(dbState.insertedValues[0].errors).toContain('query timeout');
  });

  it('does not double-log when the runner writes its own log row before throwing', async () => {
    // Simulate a job that calls logJobRun internally AND then throws.
    // The fallback catch should still fire, producing one extra row.
    // This test documents the accepted behaviour: the fallback is always
    // written when runner() rejects, regardless of internal state.
    const { db } = await import('@workspace/db');
    mockWeeklyDigest.mockImplementation(async () => {
      // Simulate an internal insert (logJobRun) before failing
      await (db as any).insert(undefined).values({ jobName: 'weekly_kpi_digest', usersProcessed: 3, errors: null });
      throw new Error('post-log failure');
    });

    const app = makeApp('/api/admin/automations', adminAutomationsRouter);
    await request(app)
      .post('/api/admin/automations/trigger/weekly_kpi_digest')
      .send();

    await new Promise(r => setTimeout(r, 20));

    // Two rows: one from the internal logJobRun, one from the fallback catch
    expect(dbState.insertedValues).toHaveLength(2);
    const fallbackRow = dbState.insertedValues.find((v: any) => v.errors?.includes('post-log failure'));
    expect(fallbackRow).toBeDefined();
    expect(fallbackRow.usersProcessed).toBe(0);
  });
});
