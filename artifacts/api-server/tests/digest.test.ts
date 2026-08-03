/**
 * Digest email tests — Task #320
 *
 * Confirms that runWeeklyKpiDigest, runMonthlyScorecardDigest, and
 * runStaleDataNudge:
 *   1. Send emails to the correct recipient with the correct subject.
 *   2. Include the right data rows (Account, Framework / suppliers / staleness).
 *   3. Skip users with no relevant data (no KPI values / no suppliers / not stale).
 *   4. Log the job run to the schedule_log table with accurate counts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeLoggerMock } from './helpers';

/* ── Hoist mocks so they are accessible inside vi.mock factories ─────────── */
const { sendDigestEmailMock, scheduleLogInserts } = vi.hoisted(() => ({
  sendDigestEmailMock: vi.fn().mockResolvedValue({ sent: true }),
  scheduleLogInserts: [] as Array<{ jobName: string; usersProcessed: number; errors: string | null }>,
}));

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => makeLoggerMock());

// Spy on sendDigestEmail; keep real buildAlertHtml for Suite 4.
vi.mock('../src/lib/notifyHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/notifyHelpers')>();
  return {
    ...actual,
    sendAlertEmail:  vi.fn().mockResolvedValue({ sent: true }),
    sendDigestEmail: sendDigestEmailMock,
  };
});

vi.mock('@workspace/db', () => {
  const scheduleLogTable = {};
  const db = {
    execute: vi.fn(async () => ({ rows: [] as unknown[] })),
    insert: vi.fn(() => ({
      values: (v: { jobName: string; usersProcessed: number; errors: string | null }) => {
        scheduleLogInserts.push(v);
        return Promise.resolve();
      },
    })),
  };
  return { db, scheduleLogTable };
});

// Webhook dispatch is a side-effect not under test here.
vi.mock('../src/lib/webhookDispatch', () => ({ dispatchEvent: vi.fn() }));

/* ── Import scheduler AFTER mocks are in place ──────────────────────────── */
import { runWeeklyKpiDigest, runMonthlyScorecardDigest, runStaleDataNudge } from '../src/lib/scheduler';
import { db } from '@workspace/db';

/* ── Seed helper ─────────────────────────────────────────────────────────── */
function seedUsers(rows: unknown[]) {
  vi.mocked(db.execute).mockResolvedValueOnce({ rows } as { rows: unknown[] });
}

/* ─────────────────────────────────────────────────────────────────────────
   Suite 1 — Weekly KPI digest
───────────────────────────────────────────────────────────────────────── */

describe('runWeeklyKpiDigest', () => {
  beforeEach(() => {
    vi.mocked(db.execute).mockReset();
    sendDigestEmailMock.mockClear();
    scheduleLogInserts.splice(0);
  });

  it('sends an email to a user who has KPI values with the correct subject', async () => {
    seedUsers([{
      id: 1, email: 'alice@example.com', full_name: 'Alice Smith', company: 'Acme Corp',
      tool_data: { kpis: { slug: 'risk-management', values: { crm: 85, srs: 72 } } },
      scorecard_roster: null, last_import_at: null,
    }]);

    await runWeeklyKpiDigest();

    expect(sendDigestEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDigestEmailMock.mock.calls[0][0];
    expect(call.to).toBe('alice@example.com');
    expect(call.subject).toContain('Weekly KPI Summary');
    expect(call.rows['Account']).toContain('alice@example.com');
    expect(call.rows['Framework']).toBe('risk-management');
    expect(call.rows['crm']).toBe('85');
    expect(call.rows['srs']).toBe('72');
    expect(call.rows['Week Ending']).toBeTruthy();
  });

  it('includes the Company row when the user has a company set', async () => {
    seedUsers([{
      id: 2, email: 'bob@co.com', full_name: 'Bob', company: 'Bob LLC',
      tool_data: { kpis: { slug: 'quality', values: { ftr: 90 } } },
      scorecard_roster: null, last_import_at: null,
    }]);

    await runWeeklyKpiDigest();

    expect(sendDigestEmailMock.mock.calls[0][0].rows['Company']).toBe('Bob LLC');
  });

  it('skips users with no KPI values and does not send any email', async () => {
    seedUsers([
      { id: 3, email: 'empty@example.com', full_name: 'Empty', company: null,
        tool_data: { kpis: { slug: 'quality', values: {} } }, scorecard_roster: null, last_import_at: null },
      { id: 4, email: 'nodata@example.com', full_name: 'No Data', company: null,
        tool_data: null, scorecard_roster: null, last_import_at: null },
    ]);

    await runWeeklyKpiDigest();

    expect(sendDigestEmailMock).not.toHaveBeenCalled();
  });

  it('logs the job run with the number of processed users', async () => {
    seedUsers([{
      id: 5, email: 'a@x.com', full_name: 'A', company: null,
      tool_data: { kpis: { slug: 'q', values: { x: 1 } } },
      scorecard_roster: null, last_import_at: null,
    }]);

    await runWeeklyKpiDigest();

    expect(scheduleLogInserts).toHaveLength(1);
    expect(scheduleLogInserts[0].jobName).toBe('weekly_kpi_digest');
    expect(scheduleLogInserts[0].usersProcessed).toBe(1);
    expect(scheduleLogInserts[0].errors).toBeNull();
  });

  it('logs zero processed and no error when all users have empty KPI data', async () => {
    seedUsers([
      { id: 6, email: 'z@x.com', full_name: 'Z', company: null,
        tool_data: null, scorecard_roster: null, last_import_at: null },
    ]);

    await runWeeklyKpiDigest();

    expect(scheduleLogInserts[0].usersProcessed).toBe(0);
    expect(scheduleLogInserts[0].errors).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Suite 2 — Monthly scorecard digest
───────────────────────────────────────────────────────────────────────── */

describe('runMonthlyScorecardDigest', () => {
  beforeEach(() => {
    vi.mocked(db.execute).mockReset();
    sendDigestEmailMock.mockClear();
    scheduleLogInserts.splice(0);
  });

  it('sends an email containing each supplier name and tier', async () => {
    seedUsers([{
      id: 10, email: 'carol@example.com', full_name: 'Carol', company: 'Carol Ltd',
      tool_data: null, last_import_at: null,
      scorecard_roster: {
        suppliers: [
          { id: 's1', name: 'Alpha Corp', tier: 'Strategic' },
          { id: 's2', name: 'Beta Inc',   tier: 'Preferred' },
        ],
      },
    }]);

    await runMonthlyScorecardDigest();

    expect(sendDigestEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDigestEmailMock.mock.calls[0][0];
    expect(call.to).toBe('carol@example.com');
    expect(call.subject).toContain('Monthly Supplier Scorecard Digest');
    expect(call.rows['Account']).toContain('carol@example.com');
    expect(call.rows['Suppliers Tracked']).toBe('2');
    expect(call.rows['Alpha Corp']).toBe('Strategic');
    expect(call.rows['Beta Inc']).toBe('Preferred');
    expect(call.rows['Month']).toBeTruthy();
  });

  it('defaults a supplier with no tier to "Unclassified"', async () => {
    seedUsers([{
      id: 11, email: 'dave@example.com', full_name: 'Dave', company: null,
      tool_data: null, last_import_at: null,
      scorecard_roster: { suppliers: [{ id: 's3', name: 'Gamma Ltd' }] },
    }]);

    await runMonthlyScorecardDigest();

    expect(sendDigestEmailMock.mock.calls[0][0].rows['Gamma Ltd']).toBe('Unclassified');
  });

  it('skips users with an empty supplier roster and sends no email', async () => {
    seedUsers([
      { id: 12, email: 'skip@example.com', full_name: 'Skip', company: null,
        tool_data: null, last_import_at: null, scorecard_roster: { suppliers: [] } },
      { id: 13, email: 'null@example.com', full_name: 'Null', company: null,
        tool_data: null, last_import_at: null, scorecard_roster: null },
    ]);

    await runMonthlyScorecardDigest();

    expect(sendDigestEmailMock).not.toHaveBeenCalled();
  });

  it('logs the job run with the processed count', async () => {
    seedUsers([{
      id: 14, email: 'eve@example.com', full_name: 'Eve', company: null,
      tool_data: null, last_import_at: null,
      scorecard_roster: { suppliers: [{ id: 's4', name: 'Delta Corp', tier: 'Approved' }] },
    }]);

    await runMonthlyScorecardDigest();

    expect(scheduleLogInserts[0].jobName).toBe('monthly_scorecard');
    expect(scheduleLogInserts[0].usersProcessed).toBe(1);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Suite 3 — Stale data nudge
───────────────────────────────────────────────────────────────────────── */

describe('runStaleDataNudge', () => {
  beforeEach(() => {
    vi.mocked(db.execute).mockReset();
    sendDigestEmailMock.mockClear();
    scheduleLogInserts.splice(0);
  });

  it('sends a stale-data nudge email with Last Import and Days Since rows', async () => {
    const staleDate = new Date(Date.now() - 20 * 86_400_000).toISOString();
    seedUsers([{
      id: 20, email: 'frank@example.com', full_name: 'Frank', company: 'Frank & Co',
      last_import_at: staleDate,
    }]);

    await runStaleDataNudge();

    expect(sendDigestEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDigestEmailMock.mock.calls[0][0];
    expect(call.to).toBe('frank@example.com');
    expect(call.subject).toContain('KPI data may be out of date');
    expect(call.rows['Account']).toContain('frank@example.com');
    expect(call.rows['Last Import']).toBeTruthy();
    expect(Number(call.rows['Days Since'])).toBeGreaterThanOrEqual(20);
    expect(call.rows['Action']).toContain('import fresh KPI data');
    expect(call.rows['Platform']).toContain('isupplychain.io');
  });

  it('shows "Never" as Last Import when last_import_at is null', async () => {
    seedUsers([{
      id: 21, email: 'grace@example.com', full_name: 'Grace', company: null, last_import_at: null,
    }]);

    await runStaleDataNudge();

    const call = sendDigestEmailMock.mock.calls[0][0];
    expect(call.rows['Last Import']).toBe('Never');
    expect(call.rows['Days Since']).toBe('N/A');
  });

  it('logs the job run with the correct processed count', async () => {
    seedUsers([
      { id: 22, email: 'h@example.com', full_name: 'H', company: null, last_import_at: null },
      { id: 23, email: 'i@example.com', full_name: 'I', company: null, last_import_at: null },
    ]);

    await runStaleDataNudge();

    expect(scheduleLogInserts[0].jobName).toBe('stale_data_nudge');
    expect(scheduleLogInserts[0].usersProcessed).toBe(2);
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   Suite 4 — buildAlertHtml (unit — template structure)
───────────────────────────────────────────────────────────────────────── */

describe('buildAlertHtml', () => {
  it('renders every key/value pair in the HTML output', async () => {
    const { buildAlertHtml } = await import('../src/lib/notifyHelpers');
    const html = buildAlertHtml('Weekly KPI Summary', {
      Account: 'Jane <jane@example.com>',
      Framework: 'logistics',
    });
    expect(html).toContain('Weekly KPI Summary');
    expect(html).toContain('Account');
    expect(html).toContain('jane@example.com');
    expect(html).toContain('Framework');
    expect(html).toContain('logistics');
    expect(html).toContain('I Supply Chain');
  });

  it('renders an em-dash for empty values', async () => {
    const { buildAlertHtml } = await import('../src/lib/notifyHelpers');
    const html = buildAlertHtml('Test', { 'Company': '' });
    expect(html).toContain('—');
  });
});
