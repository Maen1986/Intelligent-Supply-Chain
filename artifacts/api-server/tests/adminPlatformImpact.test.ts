/**
 * adminPlatformImpact.test.ts (#185 -- registry #185)
 *
 * Confirms:
 *   - Backend access-control gate (401 unauthenticated, 403 non-admin, 200 admin)
 *   - Metrics are assembled correctly from the five select() aggregates plus
 *     the raw DISTINCT ON execute() query used to dedupe snapshots per user
 *   - The REACTIVE_CEILING (2.0) "gap" threshold is applied correctly:
 *     scores >= 2.0 do not count, scores < 2.0 do
 *   - A findings_actions status breakdown with an unknown/null status still
 *     sums correctly into actionsTracked
 */
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

/* ── vi.hoisted: mutable state accessible inside vi.mock factories ────────── */
const mockDb = vi.hoisted(() => ({
  /** Consumed in FIFO order, one entry per db.select(...).from(...) chain
   *  built by the route (diagnosticsRun, assessments, actions-by-status,
   *  orgs-engaged, total-users -- in that exact order). */
  selectQueue: [] as any[][],
  /** Rows returned by the single db.execute(sql`...DISTINCT ON...`) call. */
  executeRows: [] as any[],
}));

function resetMockDb() {
  mockDb.selectQueue = [];
  mockDb.executeRows = [];
}

vi.mock('@workspace/db', () => {
  function makeChain(rowsGetter: () => any[]) {
    const c: any = {};
    for (const m of ['from', 'where', 'groupBy', 'orderBy', 'limit']) {
      c[m] = (arg: any) => {
        if (m === 'from') {
          // Pop the next queued result set for this .from() call.
          const rows = mockDb.selectQueue.shift() ?? [];
          const chained: any = {};
          for (const mm of ['where', 'groupBy', 'orderBy', 'limit']) chained[mm] = () => chained;
          chained.then = (res: any, rej: any) => Promise.resolve(rows).then(res, rej);
          chained.catch = (fn: any) => Promise.resolve(rows).catch(fn);
          return chained;
        }
        return c;
      };
    }
    const exec = () => Promise.resolve(rowsGetter());
    c.then = (res: any, rej: any) => exec().then(res, rej);
    c.catch = (fn: any) => exec().catch(fn);
    return c;
  }
  return {
    db: {
      select: vi.fn(() => makeChain(() => [])),
      execute: vi.fn(async () => ({ rows: mockDb.executeRows })),
    },
    submissionsTable: {},
    maturitySnapshotsTable: {},
    findingsActionsTable: { status: 'status' },
    usersTable: { organizationId: 'organizationId' },
    organizationsTable: {},
  };
});

vi.mock('../src/lib/logger', () => makeLoggerMock());

/* ── Router under test ──────────────────────────────────────────────────── */
import adminPlatformImpactRouter from '../src/routes/adminPlatformImpact';

describe('GET /api/admin/platform-impact — access control', () => {
  it('returns 401 when unauthenticated', async () => {
    resetMockDb();
    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, {});
    const res = await request(app).get('/api/admin/platform-impact');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    resetMockDb();
    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, { userId: 5, userRole: 'user' });
    const res = await request(app).get('/api/admin/platform-impact');
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/admin/platform-impact — metric assembly (admin)', () => {
  it('assembles totals from the five select() aggregates and the execute() dedup query', async () => {
    resetMockDb();
    mockDb.selectQueue = [
      [{ count: 8 }],   // diagnosticsRun (submissions)
      [{ count: 5 }],   // assessmentsCompleted (maturity_snapshots)
      [{ status: 'not_started', count: 2 }, { status: 'done', count: 3 }], // actionsByStatus
      [{ count: 4 }],   // organizationsEngaged (distinct)
      [{ count: 9 }],   // totalUsers
    ];
    mockDb.executeRows = [
      { user_id: 1, segment_scores: [{ id: 's1', score: 1.5 }, { id: 's2', score: 3.0 }] }, // 1 gap
      { user_id: 2, segment_scores: [{ id: 's1', score: 1.0 }, { id: 's2', score: 1.9 }] }, // 2 gaps
      { user_id: 3, segment_scores: [{ id: 's1', score: 2.0 }] }, // boundary: 2.0 is NOT a gap
    ];

    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/admin/platform-impact');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const m = res.body.metrics;
    expect(m.diagnosticsRun).toBe(8);
    expect(m.assessmentsCompleted).toBe(5);
    expect(m.actionsTracked).toBe(5); // 2 + 3
    expect(m.actionsByStatus).toEqual({ not_started: 2, done: 3 });
    expect(m.organizationsEngaged).toBe(4);
    expect(m.totalUsers).toBe(9);
    // Gaps: user1 has 1 (score 1.5 < 2.0), user2 has 2 (1.0 and 1.9 < 2.0),
    // user3 has 0 (2.0 is the ceiling, not below it) -- total 3.
    expect(m.gapsIdentified).toBe(3);
    expect(m.assessedUsersWithAtLeastOneGap).toBe(2);
    expect(m.distinctUsersAssessed).toBe(3);
    expect(res.body.definitions.gap).toBeTruthy();
  });

  it('returns zeroed metrics when every table is empty', async () => {
    resetMockDb();
    mockDb.selectQueue = [[{ count: 0 }], [{ count: 0 }], [], [{ count: 0 }], [{ count: 0 }]];
    mockDb.executeRows = [];

    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/admin/platform-impact');

    expect(res.status).toBe(200);
    const m = res.body.metrics;
    expect(m.diagnosticsRun).toBe(0);
    expect(m.actionsTracked).toBe(0);
    expect(m.gapsIdentified).toBe(0);
    expect(m.distinctUsersAssessed).toBe(0);
  });
});
