/**
 * Unit tests for the scheduled job handlers in src/lib/scheduler.ts
 *
 * Covers:
 *  - runWeeklyKpiDigest: skips users with no KPI data; sends email + logs for users with data
 *  - runMonthlyScorecardDigest: skips users with no suppliers; sends email + logs for users with suppliers
 *  - runLeadFollowup: only flags submissions older than 48 h; marks them `nudged`; sends admin summary
 *  - runStaleDataNudge: only targets users whose last_import_at is NULL or >14 days ago
 *  - schedule_log row is written (db.insert called via logJobRun) after each job run
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

/* ── Shared mock state ──────────────────────────────────────────────────── */

/** Rows returned by db.execute() calls — first call returns userRows / leadRows. */
let mockExecuteRows: any[] = [];
/** Track every db.execute() call for assertions. */
const executeCallArgs: any[] = [];
let executeCallCount = 0;

/** Track db.insert() calls (schedule_log writes). */
let insertCallCount = 0;
let insertedValues: any[] = [];

function resetState() {
  mockExecuteRows = [];
  executeCallArgs.length = 0;
  executeCallCount = 0;
  insertCallCount = 0;
  insertedValues = [];
}

/* ── Chain helper for drizzle insert (used by logJobRun) ─────────────────── */

function insertChain() {
  const c: any = {};
  c.values = (v: any) => {
    insertedValues.push(v);
    return c;
  };
  c.catch = (_fn: any) => c; // logJobRun does .catch(err => ...) on the insert chain
  c.then = (res: any, _rej: any) => Promise.resolve(undefined).then(res);
  return c;
}

/* ── @workspace/db mock ─────────────────────────────────────────────────── */

vi.mock('@workspace/db', () => ({
  db: {
    execute: vi.fn(async (sqlArg: any) => {
      const idx = executeCallCount++;
      executeCallArgs.push(sqlArg);
      // The first execute per job returns the main query rows;
      // subsequent ones (e.g. UPDATE submissions) return [].
      return { rows: idx === 0 ? mockExecuteRows : [] };
    }),
    insert: vi.fn(() => {
      insertCallCount++;
      return insertChain();
    }),
  },
  scheduleLogTable: { jobName: 'job_name', usersProcessed: 'users_processed', errors: 'errors' },
}));

/* ── notifyHelpers mock ──────────────────────────────────────────────────── */

const sendDigestEmail = vi.fn().mockResolvedValue({ sent: true });
const sendAlertEmail  = vi.fn().mockResolvedValue({ sent: true });

vi.mock('../src/lib/notifyHelpers', () => ({
  sendDigestEmail: (...args: any[]) => sendDigestEmail(...args),
  sendAlertEmail:  (...args: any[]) => sendAlertEmail(...args),
}));

/* ── webhookDispatch mock ────────────────────────────────────────────────── */

const dispatchEvent = vi.fn();

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchEvent: (...args: any[]) => dispatchEvent(...args),
}));

/* ── webhookRetry mock ───────────────────────────────────────────────────── */

vi.mock('../src/lib/webhookRetry', () => ({
  runWebhookRetries: vi.fn().mockResolvedValue(undefined),
}));

/* ── logger mock ─────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => {
  const noop = () => {};
  return { logger: { info: noop, warn: noop, error: noop, debug: noop } };
});

/* ── Import job handlers after mocks are registered ─────────────────────── */

import {
  runWeeklyKpiDigest,
  runMonthlyScorecardDigest,
  runLeadFollowup,
  runStaleDataNudge,
} from '../src/lib/scheduler';

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 1 — Weekly KPI Digest
═══════════════════════════════════════════════════════════════════════════ */

describe('runWeeklyKpiDigest', () => {
  beforeEach(() => {
    resetState();
    sendDigestEmail.mockClear();
    dispatchEvent.mockClear();
  });

  it('skips users with no KPI data (tool_data.kpis absent)', async () => {
    mockExecuteRows = [
      { id: 1, email: 'a@test.com', full_name: 'Alice', company: 'Acme', tool_data: null, scorecard_roster: null, last_import_at: null },
    ];

    await runWeeklyKpiDigest();

    expect(sendDigestEmail).not.toHaveBeenCalled();
    // schedule_log insert should still happen
    expect(insertCallCount).toBe(1);
    expect(insertedValues[0]).toMatchObject({ jobName: 'weekly_kpi_digest', usersProcessed: 0 });
  });

  it('skips users whose kpis.values is an empty object', async () => {
    mockExecuteRows = [
      {
        id: 2, email: 'b@test.com', full_name: 'Bob', company: null,
        tool_data: { kpis: { slug: 'scm', values: {} } },
        scorecard_roster: null, last_import_at: null,
      },
    ];

    await runWeeklyKpiDigest();

    expect(sendDigestEmail).not.toHaveBeenCalled();
    expect(insertedValues[0]).toMatchObject({ jobName: 'weekly_kpi_digest', usersProcessed: 0 });
  });

  it('sends one email per user who has KPI values', async () => {
    mockExecuteRows = [
      {
        id: 3, email: 'c@test.com', full_name: 'Carol', company: 'Corp',
        tool_data: { kpis: { slug: 'scm', values: { ot: 92, fill: 87 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];

    await runWeeklyKpiDigest();

    expect(sendDigestEmail).toHaveBeenCalledTimes(1);
    const call = sendDigestEmail.mock.calls[0][0];
    expect(call.to).toBe('c@test.com');
    expect(call.subject).toContain('Weekly KPI Summary');
    expect(call.rows['ot']).toBe('92');
    expect(call.rows['fill']).toBe('87');
    expect(call.rows['Framework']).toBe('scm');
  });

  it('sends separate emails for each qualifying user', async () => {
    mockExecuteRows = [
      {
        id: 4, email: 'd@test.com', full_name: 'Dave', company: null,
        tool_data: { kpis: { slug: 'kri', values: { kpi1: 10 } } },
        scorecard_roster: null, last_import_at: null,
      },
      {
        id: 5, email: 'e@test.com', full_name: 'Eve', company: 'Biz',
        tool_data: { kpis: { slug: 'kri', values: { kpi2: 20 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];

    await runWeeklyKpiDigest();

    expect(sendDigestEmail).toHaveBeenCalledTimes(2);
    expect(insertedValues[0]).toMatchObject({ jobName: 'weekly_kpi_digest', usersProcessed: 2 });
  });

  it('fires a dispatchEvent for each email sent', async () => {
    mockExecuteRows = [
      {
        id: 6, email: 'f@test.com', full_name: 'Frank', company: null,
        tool_data: { kpis: { slug: 'abc', values: { x: 1 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];

    await runWeeklyKpiDigest();

    expect(dispatchEvent).toHaveBeenCalledWith(
      6,
      'schedule.weekly_kpi_digest',
      expect.objectContaining({ slug: 'abc', kpiCount: 1 }),
    );
  });

  it('writes schedule_log row with correct jobName and processed count', async () => {
    mockExecuteRows = [
      {
        id: 7, email: 'g@test.com', full_name: 'Gina', company: null,
        tool_data: { kpis: { slug: 's', values: { a: 1, b: 2 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];

    await runWeeklyKpiDigest();

    expect(insertCallCount).toBe(1);
    expect(insertedValues[0]).toMatchObject({
      jobName:        'weekly_kpi_digest',
      usersProcessed: 1,
    });
  });

  it('still writes schedule_log even when sendDigestEmail rejects for one user', async () => {
    mockExecuteRows = [
      {
        id: 8, email: 'h@test.com', full_name: 'Hank', company: null,
        tool_data: { kpis: { slug: 's', values: { a: 1 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];
    sendDigestEmail.mockRejectedValueOnce(new Error('SMTP timeout'));

    await runWeeklyKpiDigest();

    // The error is caught per-user; schedule_log still written
    expect(insertCallCount).toBe(1);
    const logged = insertedValues[0];
    expect(logged.jobName).toBe('weekly_kpi_digest');
    expect(logged.usersProcessed).toBe(0);          // user was not counted
    expect(logged.errors).toContain('user 8');      // error message recorded
  });

  it('treats { sent: false } as an error — user not counted and no event dispatched', async () => {
    mockExecuteRows = [
      {
        id: 9, email: 'i@test.com', full_name: 'Ivan', company: null,
        tool_data: { kpis: { slug: 's', values: { a: 1 } } },
        scorecard_roster: null, last_import_at: null,
      },
    ];
    sendDigestEmail.mockResolvedValueOnce({ sent: false, reason: 'GMAIL_APP_PASSWORD not configured' });

    await runWeeklyKpiDigest();

    // Email transport failed — user must not be counted as processed
    expect(insertedValues[0].usersProcessed).toBe(0);
    expect(insertedValues[0].errors).toContain('user 9');
    // No webhook event when email was not actually sent
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 2 — Monthly Scorecard Digest
═══════════════════════════════════════════════════════════════════════════ */

describe('runMonthlyScorecardDigest', () => {
  beforeEach(() => {
    resetState();
    sendDigestEmail.mockClear();
    dispatchEvent.mockClear();
  });

  it('skips users with no scorecard_roster', async () => {
    mockExecuteRows = [
      { id: 1, email: 'a@test.com', full_name: 'Alice', company: null, tool_data: null, scorecard_roster: null, last_import_at: null },
    ];

    await runMonthlyScorecardDigest();

    expect(sendDigestEmail).not.toHaveBeenCalled();
    expect(insertedValues[0]).toMatchObject({ jobName: 'monthly_scorecard', usersProcessed: 0 });
  });

  it('skips users whose roster has an empty suppliers array', async () => {
    mockExecuteRows = [
      {
        id: 2, email: 'b@test.com', full_name: 'Bob', company: null,
        tool_data: null, scorecard_roster: { suppliers: [] }, last_import_at: null,
      },
    ];

    await runMonthlyScorecardDigest();

    expect(sendDigestEmail).not.toHaveBeenCalled();
    expect(insertedValues[0]).toMatchObject({ jobName: 'monthly_scorecard', usersProcessed: 0 });
  });

  it('sends email with supplier tiers for users with a roster', async () => {
    mockExecuteRows = [
      {
        id: 3, email: 'c@test.com', full_name: 'Carol', company: 'Corp',
        tool_data: null,
        scorecard_roster: {
          suppliers: [
            { id: 's1', name: 'SupA', tier: 'Gold' },
            { id: 's2', name: 'SupB', tier: 'Silver' },
          ],
        },
        last_import_at: null,
      },
    ];

    await runMonthlyScorecardDigest();

    expect(sendDigestEmail).toHaveBeenCalledTimes(1);
    const call = sendDigestEmail.mock.calls[0][0];
    expect(call.to).toBe('c@test.com');
    expect(call.subject).toContain('Monthly Supplier Scorecard');
    expect(call.rows['SupA']).toBe('Gold');
    expect(call.rows['SupB']).toBe('Silver');
    expect(call.rows['Suppliers Tracked']).toBe('2');
  });

  it('falls back to "Unclassified" when tier is missing', async () => {
    mockExecuteRows = [
      {
        id: 4, email: 'd@test.com', full_name: 'Dave', company: null,
        tool_data: null,
        scorecard_roster: { suppliers: [{ id: 's3', name: 'SupC' }] },
        last_import_at: null,
      },
    ];

    await runMonthlyScorecardDigest();

    const call = sendDigestEmail.mock.calls[0][0];
    expect(call.rows['SupC']).toBe('Unclassified');
  });

  it('fires a dispatchEvent per user processed', async () => {
    mockExecuteRows = [
      {
        id: 5, email: 'e@test.com', full_name: 'Eve', company: 'Biz',
        tool_data: null,
        scorecard_roster: { suppliers: [{ id: 's4', name: 'SupD', tier: 'Bronze' }] },
        last_import_at: null,
      },
    ];

    await runMonthlyScorecardDigest();

    expect(dispatchEvent).toHaveBeenCalledWith(
      5,
      'schedule.monthly_scorecard',
      expect.objectContaining({ supplierCount: 1 }),
    );
  });

  it('writes schedule_log row after processing', async () => {
    mockExecuteRows = [
      {
        id: 6, email: 'f@test.com', full_name: 'Frank', company: null,
        tool_data: null,
        scorecard_roster: { suppliers: [{ id: 's5', name: 'SupE', tier: 'Gold' }] },
        last_import_at: null,
      },
    ];

    await runMonthlyScorecardDigest();

    expect(insertCallCount).toBe(1);
    expect(insertedValues[0]).toMatchObject({
      jobName:        'monthly_scorecard',
      usersProcessed: 1,
    });
  });

  it('treats { sent: false } as an error — user not counted and no event dispatched', async () => {
    mockExecuteRows = [
      {
        id: 7, email: 'g@test.com', full_name: 'Grace', company: null,
        tool_data: null,
        scorecard_roster: { suppliers: [{ id: 's6', name: 'SupF', tier: 'Gold' }] },
        last_import_at: null,
      },
    ];
    sendDigestEmail.mockResolvedValueOnce({ sent: false, reason: 'GMAIL_APP_PASSWORD not configured' });

    await runMonthlyScorecardDigest();

    expect(insertedValues[0].usersProcessed).toBe(0);
    expect(insertedValues[0].errors).toContain('user 7');
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 3 — Lead Follow-up
═══════════════════════════════════════════════════════════════════════════ */

describe('runLeadFollowup', () => {
  beforeEach(() => {
    resetState();
    sendAlertEmail.mockClear();
    dispatchEvent.mockClear();
  });

  it('does nothing when no stale leads exist', async () => {
    mockExecuteRows = [];

    await runLeadFollowup();

    expect(dispatchEvent).not.toHaveBeenCalled();
    expect(sendAlertEmail).not.toHaveBeenCalled();
    expect(insertedValues[0]).toMatchObject({ jobName: 'lead_followup', usersProcessed: 0 });
  });

  it('dispatches event for each stale lead', async () => {
    const oldDate = new Date(Date.now() - 50 * 3_600_000).toISOString(); // 50 h ago
    mockExecuteRows = [
      {
        id: 101, contact_email: 'lead@test.com', contact_name: 'Lead One',
        contact_company: 'LeadCo', created_at: oldDate, outputs: null,
      },
    ];

    await runLeadFollowup();

    expect(dispatchEvent).toHaveBeenCalledWith(
      0,
      'schedule.lead_followup',
      expect.objectContaining({
        submissionId: 101,
        contactEmail: 'lead@test.com',
        contactName:  'Lead One',
        company:      'LeadCo',
      }),
    );
  });

  it('marks each processed lead as nudged via db.execute UPDATE', async () => {
    const oldDate = new Date(Date.now() - 60 * 3_600_000).toISOString(); // 60 h ago
    mockExecuteRows = [
      {
        id: 102, contact_email: 'lead2@test.com', contact_name: 'Lead Two',
        contact_company: null, created_at: oldDate, outputs: {},
      },
    ];

    await runLeadFollowup();

    // Second execute call should be the UPDATE setting nudged=true
    expect(executeCallCount).toBeGreaterThanOrEqual(2);
    // Verify at least one execute call after the first contains nudged
    const updateCallArg = executeCallArgs[1];
    const chunks: any[] = updateCallArg?.queryChunks ?? [];
    const sqlText = chunks
      .map((c: any) => (c == null ? '' : String(c.value ?? c)))
      .join('');
    expect(sqlText).toContain('nudged');
  });

  it('sends admin summary email when leads were processed', async () => {
    const oldDate = new Date(Date.now() - 72 * 3_600_000).toISOString(); // 72 h ago
    mockExecuteRows = [
      {
        id: 103, contact_email: 'lead3@test.com', contact_name: 'Lead Three',
        contact_company: 'Firm', created_at: oldDate, outputs: null,
      },
    ];

    await runLeadFollowup();

    expect(sendAlertEmail).toHaveBeenCalledTimes(1);
    const [subject, rows] = sendAlertEmail.mock.calls[0];
    expect(subject).toContain('Lead Follow-up');
    expect(rows['Leads Flagged']).toBe('1');
  });

  it('does NOT send admin email when no leads were processed', async () => {
    mockExecuteRows = [];

    await runLeadFollowup();

    expect(sendAlertEmail).not.toHaveBeenCalled();
  });

  it('writes schedule_log with correct processed count', async () => {
    const oldDate = new Date(Date.now() - 49 * 3_600_000).toISOString();
    mockExecuteRows = [
      {
        id: 104, contact_email: 'x@test.com', contact_name: 'X',
        contact_company: null, created_at: oldDate, outputs: null,
      },
      {
        id: 105, contact_email: 'y@test.com', contact_name: 'Y',
        contact_company: null, created_at: oldDate, outputs: null,
      },
    ];

    await runLeadFollowup();

    expect(insertedValues[0]).toMatchObject({ jobName: 'lead_followup', usersProcessed: 2 });
  });

  it('hoursElapsed is positive (> 48) in the dispatched event payload', async () => {
    const oldDate = new Date(Date.now() - 55 * 3_600_000).toISOString();
    mockExecuteRows = [
      {
        id: 106, contact_email: 'z@test.com', contact_name: 'Z',
        contact_company: null, created_at: oldDate, outputs: null,
      },
    ];

    await runLeadFollowup();

    const payload = dispatchEvent.mock.calls[0][2];
    expect(payload.hoursElapsed).toBeGreaterThanOrEqual(48);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 4 — Stale Data Nudge
═══════════════════════════════════════════════════════════════════════════ */

describe('runStaleDataNudge', () => {
  beforeEach(() => {
    resetState();
    sendDigestEmail.mockClear();
    dispatchEvent.mockClear();
  });

  it('does nothing when no stale users exist', async () => {
    mockExecuteRows = [];

    await runStaleDataNudge();

    expect(sendDigestEmail).not.toHaveBeenCalled();
    expect(insertedValues[0]).toMatchObject({ jobName: 'stale_data_nudge', usersProcessed: 0 });
  });

  it('sends nudge email to users whose last_import_at is NULL', async () => {
    mockExecuteRows = [
      { id: 10, email: 'stale1@test.com', full_name: 'Stale One', company: null, last_import_at: null },
    ];

    await runStaleDataNudge();

    expect(sendDigestEmail).toHaveBeenCalledTimes(1);
    const call = sendDigestEmail.mock.calls[0][0];
    expect(call.to).toBe('stale1@test.com');
    expect(call.subject).toContain('out of date');
    expect(call.rows['Last Import']).toBe('Never');
    expect(call.rows['Days Since']).toBe('N/A');
  });

  it('sends nudge email to users whose last_import_at is more than 14 days ago', async () => {
    const oldImport = new Date(Date.now() - 20 * 86_400_000).toISOString(); // 20 days ago
    mockExecuteRows = [
      { id: 11, email: 'stale2@test.com', full_name: 'Stale Two', company: 'OldCo', last_import_at: oldImport },
    ];

    await runStaleDataNudge();

    expect(sendDigestEmail).toHaveBeenCalledTimes(1);
    const call = sendDigestEmail.mock.calls[0][0];
    expect(call.to).toBe('stale2@test.com');
    // Days since should be ~20
    const daysSince = parseInt(call.rows['Days Since'], 10);
    expect(daysSince).toBeGreaterThanOrEqual(19);
    expect(call.rows['Last Import']).not.toBe('Never');
  });

  it('fires dispatchEvent for each stale user', async () => {
    const oldImport = new Date(Date.now() - 15 * 86_400_000).toISOString();
    mockExecuteRows = [
      { id: 12, email: 'stale3@test.com', full_name: 'Stale Three', company: null, last_import_at: oldImport },
    ];

    await runStaleDataNudge();

    expect(dispatchEvent).toHaveBeenCalledWith(
      12,
      'schedule.stale_data_nudge',
      expect.objectContaining({ lastImportAt: oldImport }),
    );
  });

  it('processes multiple stale users and reports correct count', async () => {
    mockExecuteRows = [
      { id: 13, email: 'a@test.com', full_name: 'A', company: null, last_import_at: null },
      { id: 14, email: 'b@test.com', full_name: 'B', company: null, last_import_at: null },
      { id: 15, email: 'c@test.com', full_name: 'C', company: null, last_import_at: null },
    ];

    await runStaleDataNudge();

    expect(sendDigestEmail).toHaveBeenCalledTimes(3);
    expect(insertedValues[0]).toMatchObject({
      jobName:        'stale_data_nudge',
      usersProcessed: 3,
    });
  });

  it('writes schedule_log even when sendDigestEmail throws for a user', async () => {
    mockExecuteRows = [
      { id: 16, email: 'err@test.com', full_name: 'Err', company: null, last_import_at: null },
    ];
    sendDigestEmail.mockRejectedValueOnce(new Error('Network error'));

    await runStaleDataNudge();

    expect(insertCallCount).toBe(1);
    const logged = insertedValues[0];
    expect(logged.jobName).toBe('stale_data_nudge');
    expect(logged.usersProcessed).toBe(0);
    expect(logged.errors).toContain('user 16');
  });

  it('treats { sent: false } as an error — user not counted and no event dispatched', async () => {
    mockExecuteRows = [
      { id: 17, email: 'creds@test.com', full_name: 'Creds', company: null, last_import_at: null },
    ];
    sendDigestEmail.mockResolvedValueOnce({ sent: false, reason: 'GMAIL_APP_PASSWORD not configured' });

    await runStaleDataNudge();

    expect(insertedValues[0].usersProcessed).toBe(0);
    expect(insertedValues[0].errors).toContain('user 17');
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   schedule_log (logJobRun) — cross-job verification
═══════════════════════════════════════════════════════════════════════════ */

describe('schedule_log — logJobRun writes after every job', () => {
  beforeEach(() => {
    resetState();
    sendDigestEmail.mockClear();
    sendAlertEmail.mockClear();
    dispatchEvent.mockClear();
  });

  it('always inserts a schedule_log row after runWeeklyKpiDigest (zero users)', async () => {
    mockExecuteRows = [];
    await runWeeklyKpiDigest();
    expect(insertCallCount).toBeGreaterThanOrEqual(1);
    expect(insertedValues.some(v => v.jobName === 'weekly_kpi_digest')).toBe(true);
  });

  it('always inserts a schedule_log row after runMonthlyScorecardDigest (zero users)', async () => {
    mockExecuteRows = [];
    await runMonthlyScorecardDigest();
    expect(insertCallCount).toBeGreaterThanOrEqual(1);
    expect(insertedValues.some(v => v.jobName === 'monthly_scorecard')).toBe(true);
  });

  it('always inserts a schedule_log row after runLeadFollowup (zero leads)', async () => {
    mockExecuteRows = [];
    await runLeadFollowup();
    expect(insertCallCount).toBeGreaterThanOrEqual(1);
    expect(insertedValues.some(v => v.jobName === 'lead_followup')).toBe(true);
  });

  it('always inserts a schedule_log row after runStaleDataNudge (zero users)', async () => {
    mockExecuteRows = [];
    await runStaleDataNudge();
    expect(insertCallCount).toBeGreaterThanOrEqual(1);
    expect(insertedValues.some(v => v.jobName === 'stale_data_nudge')).toBe(true);
  });

  it('errors field is null when no errors occurred', async () => {
    mockExecuteRows = [];
    await runWeeklyKpiDigest();
    const log = insertedValues.find(v => v.jobName === 'weekly_kpi_digest');
    expect(log?.errors).toBeNull();
  });
});
