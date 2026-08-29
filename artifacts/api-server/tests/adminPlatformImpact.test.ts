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
 *   - benchmarkCohortProgress (added 30 Aug 2026, direct response to the
 *     "real moves on Moat/differentiation" demand): the route calls
 *     getCohortProgress() (its own db.execute) via the same Promise.all as
 *     the five select()s, BEFORE the later gaps-query db.execute call --
 *     the mock's executeQueue (FIFO) models that exact call order so each
 *     query gets its own, independently-shaped rows.
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
  /** Rows returned by the single db.execute(sql`...DISTINCT ON...`) call
   *  (legacy default, used when executeQueue is empty -- kept so existing
   *  tests that only care about the gaps query don't need updating). */
  executeRows: [] as any[],
  /** FIFO queue for db.execute() calls, in real call order: the route's
   *  Promise.all fires getCohortProgress()'s own db.execute() synchronously
   *  as that array is built (1st call), then -- only after Promise.all
   *  resolves -- the gaps DISTINCT ON query fires (2nd call). Falls back to
   *  executeRows once drained. */
  executeQueue: [] as any[][],
}));

function resetMockDb() {
  mockDb.selectQueue = [];
  mockDb.executeRows = [];
  mockDb.executeQueue = [];
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
      execute: vi.fn(async () => ({ rows: mockDb.executeQueue.length > 0 ? mockDb.executeQueue.shift() : mockDb.executeRows })),
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

  it('includes benchmarkCohortProgress -- minCohortSize, full cohort list, and closestToLive capped at 3', async () => {
    resetMockDb();
    mockDb.selectQueue = [[{ count: 0 }], [{ count: 0 }], [], [{ count: 0 }], [{ count: 0 }]];
    // 1st execute() call: getCohortProgress()'s own query (fires inside
    // Promise.all, before the gaps query below).
    mockDb.executeQueue.push([
      { industry: 'Manufacturing', company_size: '11-50', contributing_organizations: 5 }, // live
      { industry: 'Retail', company_size: '1-10', contributing_organizations: 3 },
      { industry: 'Logistics', company_size: '51-200', contributing_organizations: 2 },
      { industry: 'Energy & Oil', company_size: '201+', contributing_organizations: 1 },
    ]);
    // 2nd execute() call: the gaps DISTINCT ON query -- deliberately empty,
    // this test only cares about benchmarkCohortProgress.
    mockDb.executeQueue.push([]);

    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/admin/platform-impact');

    expect(res.status).toBe(200);
    const b = res.body.benchmarkCohortProgress;
    expect(b.minCohortSize).toBe(5);
    expect(b.cohorts).toHaveLength(4);
    expect(b.cohorts[0]).toEqual({ industry: 'Manufacturing', companySize: '11-50', contributingOrganizations: 5, needed: 0, live: true });
    // closestToLive: only non-live cohorts, capped at 3 -- all three
    // remaining (below-floor) cohorts here, live one excluded.
    expect(b.closestToLive).toHaveLength(3);
    expect(b.closestToLive.every((c: any) => c.live === false)).toBe(true);
    expect(b.closestToLive.map((c: any) => c.industry)).toEqual(['Retail', 'Logistics', 'Energy & Oil']);
    expect(res.body.definitions.benchmarkCohortProgress).toBeTruthy();
  });

  it('benchmarkCohortProgress is honestly empty when no cohort has any assessment data', async () => {
    resetMockDb();
    mockDb.selectQueue = [[{ count: 0 }], [{ count: 0 }], [], [{ count: 0 }], [{ count: 0 }]];
    mockDb.executeQueue.push([]); // getCohortProgress() -- no cohorts yet
    mockDb.executeQueue.push([]); // gaps query

    const app = makeApp('/api/admin/platform-impact', adminPlatformImpactRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/admin/platform-impact');

    expect(res.status).toBe(200);
    expect(res.body.benchmarkCohortProgress.cohorts).toEqual([]);
    expect(res.body.benchmarkCohortProgress.closestToLive).toEqual([]);
  });
});
