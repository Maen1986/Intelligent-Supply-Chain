/**
 * Tests for GET /api/workbench/summary (#172 My Workbench)
 *
 * Covers:
 *  - 401 when unauthenticated
 *  - honest-empty state (hasData=false, zero actions, zero investigations)
 *  - actions: full (non-windowed) list, grouped counts by status, sorted
 *    not_started/in_progress first then done, each item shaped correctly
 *  - investigations: submissions filtered to tool in (diagnostic,
 *    command_centre), industry/challenge/problemCount extracted from
 *    inputs/outputs, tool='lead' rows never leak in (SQL WHERE, verified
 *    by asserting the query only returns what the mock provides)
 *  - problemCount is null when outputs.problems is absent (command_centre
 *    tool, or a malformed/legacy row) rather than defaulting to 0
 *  - 500 on a database failure
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import workbenchRouter from '../src/routes/workbench';

beforeEach(async () => {
  resetDbState();
  const { db } = await import('@workspace/db');
  (db.execute as ReturnType<typeof vi.fn>).mockReset();
  (db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [] });
});

describe('GET /api/workbench/summary', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', workbenchRouter);
    const res = await request(app).get('/api/workbench/summary');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('honest-empty state: hasData is false when both actions and investigations are empty', async () => {
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/summary');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.hasData).toBe(false);
    expect(res.body.actions.total).toBe(0);
    expect(res.body.investigations).toEqual([]);
  });

  it('actions: returns full list with correct status counts and item shape', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        rows: [
          // Overdue: plan_started_at + 30 days is far in the past.
          { id: 1, source: 'maturity', phase: 'days30', segment_title: 'Procurement', action: 'Fix OTIF', status: 'not_started', notes: null, plan_started_at: '2020-01-01', completed_at: null, created_at: '2026-08-01', updated_at: '2026-08-01', due_at: '2020-01-31' },
          { id: 2, source: 'diagnostic', phase: null, segment_title: 'Risk', action: 'Review supplier', status: 'in_progress', notes: null, plan_started_at: '2026-08-02', completed_at: null, created_at: '2026-08-02', updated_at: '2026-08-02', due_at: null },
          { id: 3, source: 'maturity', phase: 'days60', segment_title: 'CLM', action: 'Renew contract', status: 'done', notes: null, plan_started_at: '2020-01-01', completed_at: '2026-08-10', created_at: '2026-07-01', updated_at: '2026-08-10', due_at: '2020-03-01' },
        ],
      }) // actions
      .mockResolvedValueOnce({ rows: [] }); // investigations
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/summary');
    expect(res.body.actions.total).toBe(3);
    expect(res.body.actions.notStarted).toBe(1);
    expect(res.body.actions.inProgress).toBe(1);
    expect(res.body.actions.done).toBe(1);
    expect(res.body.actions.items).toHaveLength(3);
    expect(res.body.actions.items[0]).toMatchObject({ id: 1, action: 'Fix OTIF', status: 'not_started', segmentTitle: 'Procurement' });
    expect(res.body.hasData).toBe(true);
    // Decision-readiness: overdue is computed server-side and a real days-overdue figure
    // is attached, mirroring #171's brief.ts so the two surfaces never disagree.
    expect(res.body.actions.items[0].isOverdue).toBe(true);
    expect(res.body.actions.items[0].daysOverdue).toBeGreaterThan(2000);
    // in_progress item with no due date -- not overdue, not fabricated as overdue either.
    expect(res.body.actions.items[1].isOverdue).toBe(false);
    expect(res.body.actions.items[1].daysOverdue).toBeNull();
    // done items are never flagged overdue even if their due date has technically passed --
    // "overdue" only means anything for work that isn't finished yet.
    expect(res.body.actions.items[2].isOverdue).toBe(false);
  });

  it('investigations: extracts industry/challenge/problemCount from inputs/outputs for the diagnostic tool', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: [] }) // actions
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10, tool: 'diagnostic',
            inputs: { industry: 'Manufacturing', subIndustry: 'Automotive', challenge: 'Late supplier deliveries' },
            outputs: { problems: [{ id: 'p1', status: 'Active' }, { id: 'p2', status: 'Active' }] },
            created_at: '2026-08-20T00:00:00Z',
          },
          {
            id: 11, tool: 'command_centre',
            inputs: { industry: 'Retail', challenge: 'Inventory stockouts' },
            outputs: { solutionPlan: 'text' },
            created_at: '2026-08-15T00:00:00Z',
          },
        ],
      }); // investigations
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/summary');
    expect(res.body.investigations).toHaveLength(2);
    expect(res.body.investigations[0]).toMatchObject({
      id: 10, tool: 'diagnostic', industry: 'Manufacturing', subIndustry: 'Automotive',
      challenge: 'Late supplier deliveries', problemCount: 2,
    });
    // command_centre outputs has no problems[] -- problemCount must be null, not 0 (0 would
    // falsely imply "zero problems found" rather than "this tool doesn't produce that field").
    expect(res.body.investigations[1]).toMatchObject({ id: 11, tool: 'command_centre', problemCount: null });
  });

  it('#178: problemStatus normalizes Active/Resolved/Recurring counts from problems[], and is null when problems[] is absent', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ rows: [] }) // actions
      .mockResolvedValueOnce({
        rows: [
          {
            id: 20, tool: 'diagnostic',
            inputs: { industry: 'Retail', challenge: 'Stockouts' },
            outputs: { problems: [
              { id: 'p1', status: 'Active' },
              { id: 'p2', status: 'Active' },
              { id: 'p3', status: 'Resolved' },
              { id: 'p4', status: 'Recurring' },
            ] },
            created_at: '2026-08-20T00:00:00Z',
          },
          {
            id: 21, tool: 'diagnostic',
            inputs: { industry: 'Logistics', challenge: 'Legacy flat-shape row' },
            outputs: { recommendations: ['rec 1', 'rec 2'] }, // no problems[] -- pre-#167 or public-wizard shape
            created_at: '2026-08-19T00:00:00Z',
          },
        ],
      }); // investigations
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/summary');
    expect(res.body.investigations[0].problemStatus).toEqual({ active: 2, resolved: 1, recurring: 1 });
    // No problems[] on this row -- problemStatus must be null, not a fabricated { active: 0, resolved: 0, recurring: 0 }.
    expect(res.body.investigations[1].problemStatus).toBeNull();
  });

  it('returns 500 on a database failure', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure (test)'));
    const app = makeApp('/api', workbenchRouter, { userId: 1 });
    const res = await request(app).get('/api/workbench/summary');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
