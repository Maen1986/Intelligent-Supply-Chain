/**
 * HTTP-boundary tests for /api/periodic-evaluation (Item 5 Operational
 * tier: cadence override + completed-evaluation sign-off, 12 Sep 2026).
 * Mirrors onboarding.test.ts's and governanceTier.test.ts's pattern
 * exactly: a local vi.mock('@workspace/db', ...) with a queued sequential
 * db.select(), plus a local vi.mock('@workspace/db/schema', ...).
 *
 * Call order the route actually issues:
 *   GET /current:            1. actor lookup, 2. periodic_evaluation_events for org+supplier
 *   POST /cadence-override:  1. actor lookup, 2. [only when actor.orgRole !== 'org_admin'] RACI events, 3. insert (event)
 *   POST /complete:          1. actor lookup, 2. [only when actor.orgRole !== 'org_admin'] RACI events, 3. insert (event), 4. [only if escalate_consider] insert (findings_actions)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeLoggerMock } from './helpers';

let selectQueue: any[][] = [];
let insertCalls: any[] = [];

function nextSelectChain() {
  const rows = selectQueue.shift() ?? [];
  const c: any = {};
  for (const m of ['from', 'where', 'orderBy', 'limit', 'offset']) c[m] = () => c;
  const exec = (): Promise<any[]> => {
    if (dbState.failNext) {
      dbState.failNext = false;
      return Promise.reject(new Error('db failure (test)'));
    }
    return Promise.resolve(rows);
  };
  c.then = (res: any, rej: any) => exec().then(res, rej);
  c.catch = (fn: any) => exec().catch(fn);
  return c;
}

function insertChain() {
  const c: any = {};
  for (const m of ['from', 'where', 'orderBy', 'limit', 'offset']) c[m] = () => c;
  c.values = (v: any) => { insertCalls.push(v); return c; };
  c.returning = () => Promise.resolve([{ id: 601 + insertCalls.length, ...insertCalls[insertCalls.length - 1] }]);
  return c;
}

vi.mock('@workspace/db', () => ({
  db: {
    select: vi.fn(() => nextSelectChain()),
    insert: vi.fn(() => insertChain()),
  },
}));

vi.mock('@workspace/db/schema', () => ({
  usersTable: { id: 'id', organizationId: 'organizationId', orgRole: 'orgRole' },
  raciAssignmentEventsTable: { id: 'id', organizationId: 'organizationId', activityKey: 'activityKey', role: 'role', userId: 'userId', action: 'action', createdAt: 'createdAt' },
  periodicEvaluationEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', action: 'action', cadence: 'cadence',
    categoryScores: 'categoryScores', overallRecommendation: 'overallRecommendation', actorUserId: 'actorUserId',
    notes: 'notes', createdAt: 'createdAt',
  },
  findingsActionsTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', source: 'source', sourceRefId: 'sourceRefId',
    sourceRefKey: 'sourceRefKey', itemKey: 'itemKey', phase: 'phase', segmentTitle: 'segmentTitle', action: 'action',
    framework: 'framework', measurableTarget: 'measurableTarget', status: 'status', notes: 'notes',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import periodicEvaluationRouter from '../src/routes/periodicEvaluation';

function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}
function cadenceOverrideEvent(supplierId: string, action: 'set' | 'clear', cadence: string | null, createdAt: Date) {
  return { id: 1, supplierId, action: action === 'set' ? 'cadence_override_set' : 'cadence_override_clear', cadence, createdAt };
}
function completedEvent(supplierId: string, overallRecommendation: string, createdAt: Date) {
  return { id: 2, supplierId, action: 'completed', categoryScores: [], overallRecommendation, createdAt };
}

const GOOD_SCORES = [
  { category: 'quality', score: 90, dataSource: 'manual' },
  { category: 'delivery_otif', score: 88, dataSource: 'manual' },
  { category: 'cost', score: 86, dataSource: 'manual' },
  { category: 'service_responsiveness', score: 91, dataSource: 'manual' },
  { category: 'compliance_esg', score: 95, dataSource: 'manual' },
];

const AT_RISK_SCORES = [
  { category: 'quality', score: 20, dataSource: 'manual' },
  { category: 'delivery_otif', score: 88, dataSource: 'manual' },
  { category: 'cost', score: 86, dataSource: 'manual' },
  { category: 'service_responsiveness', score: 91, dataSource: 'manual' },
  { category: 'compliance_esg', score: 95, dataSource: 'manual' },
];

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

describe('GET /api/periodic-evaluation/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(401);
  });

  it('400s when supplierId is missing', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).get('/api/periodic-evaluation/current');
    expect(res.status).toBe(400);
  });

  it('returns nulls when no organization is linked to the account', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: null }]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.cadenceOverride).toBeNull();
    expect(res.body.latestEvaluation).toBeNull();
  });

  it('returns nulls when no events exist for this supplier', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.cadenceOverride).toBeNull();
    expect(res.body.latestEvaluation).toBeNull();
  });

  it('returns the latest set cadence override, including its timestamp', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([cadenceOverrideEvent('SUP-RAWABI-01', 'set', 'semi_annual', new Date('2026-09-01T00:00:00.000Z'))]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.cadenceOverride).toEqual({ cadence: 'semi_annual', overriddenAt: '2026-09-01T00:00:00.000Z' });
  });

  it('CORE CASE: a later clear event correctly supersedes an earlier set event', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      cadenceOverrideEvent('SUP-RAWABI-01', 'set', 'semi_annual', new Date('2026-09-01')),
      cadenceOverrideEvent('SUP-RAWABI-01', 'clear', null, new Date('2026-09-05')),
    ]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.cadenceOverride).toBeNull();
  });

  it('returns the latest completed evaluation with its overallRecommendation', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([completedEvent('SUP-RAWABI-01', 'monitor_closely', new Date('2026-08-15T00:00:00.000Z'))]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.latestEvaluation).toMatchObject({ overallRecommendation: 'monitor_closely', completedAt: '2026-08-15T00:00:00.000Z' });
  });

  it('BOUNDARY: filters correctly by supplierId even with another supplier own events present', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      cadenceOverrideEvent('SUP-OTHER-99', 'set', 'annual', new Date('2026-09-10')),
      cadenceOverrideEvent('SUP-RAWABI-01', 'set', 'semi_annual', new Date('2026-09-01')),
    ]);
    const res = await request(app).get('/api/periodic-evaluation/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.cadenceOverride).toMatchObject({ cadence: 'semi_annual' });
  });
});

describe('POST /api/periodic-evaluation/cadence-override -- write-gate enforcement at the HTTP boundary', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter);
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload (set without a cadence) before touching the database', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a malformed cadence value ("quarterly", not a valid option)', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'quarterly' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for periodic_evaluation', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(99, 'periodic_evaluation')]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS Accountable, but for a different RACI activity (onboarding_signoff, not periodic_evaluation)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'onboarding_signoff')]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s a caller who WAS Accountable for periodic_evaluation but was reassigned since (unassigned)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([
      accountableEvent(5, 'periodic_evaluation', new Date('2026-06-01')),
      { id: 2, activityKey: 'periodic_evaluation', role: 'A', userId: 5, action: 'unassigned', createdAt: new Date('2026-07-01') },
    ]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: org_admin caller is accepted and a cadence_override_set event is actually inserted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 7 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'annual' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ organizationId: 1, supplierId: 'SUP-RAWABI-01', action: 'cadence_override_set', cadence: 'annual', actorUserId: 7 });
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for periodic_evaluation (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'periodic_evaluation')]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
  });

  it('POSITIVE CONTROL: a "clear" action is accepted and inserted with cadence: null (org_admin)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 7 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'clear' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ action: 'cadence_override_clear', cadence: null });
  });

  it('403s when the account has no organization at all', async () => {
    selectQueue.push([{ organizationId: null, orgRole: null }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/cadence-override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', cadence: 'semi_annual' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });
});

describe('POST /api/periodic-evaluation/complete -- validation, write-gate, and server-derived recommendation', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter);
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: GOOD_SCORES });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when categoryScores is missing entirely', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s an invalid category name', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const badScores = [{ category: 'not-a-real-category', score: 90, dataSource: 'manual' }];
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: badScores });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a score outside the 0-100 range', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const badScores = [{ category: 'quality', score: 150, dataSource: 'manual' }];
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: badScores });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s an invalid dataSource value', async () => {
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const badScores = [{ category: 'quality', score: 90, dataSource: 'carrier-pigeon' }];
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: badScores });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for periodic_evaluation', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(99, 'periodic_evaluation')]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: GOOD_SCORES });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL + no escalation: org_admin submits all-strong scores -- one event inserted, no findings-action escalation', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 7 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: GOOD_SCORES });
    expect(res.status).toBe(200);
    expect(res.body.overallRecommendation).toBe('continue_standard_cadence');
    expect(res.body.escalated).toBe(false);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ action: 'completed', overallRecommendation: 'continue_standard_cadence' });
  });

  it('CORE ESCALATION CASE: one at-risk category (quality=20) triggers escalate_consider AND a second insert into findings_actions (source periodic_evaluation), even though every other category is strong', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 7 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: AT_RISK_SCORES });
    expect(res.status).toBe(200);
    expect(res.body.overallRecommendation).toBe('escalate_consider');
    expect(res.body.escalated).toBe(true);
    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0]).toMatchObject({ action: 'completed', overallRecommendation: 'escalate_consider' });
    expect(insertCalls[1]).toMatchObject({ source: 'periodic_evaluation', itemKey: expect.stringContaining('periodic-evaluation-alert-') });
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for periodic_evaluation (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'periodic_evaluation')]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: GOOD_SCORES });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
  });

  it('403s when the account has no organization at all', async () => {
    selectQueue.push([{ organizationId: null, orgRole: null }]);
    const app = makeApp('/api/periodic-evaluation', periodicEvaluationRouter, { userId: 5 });
    const res = await request(app).post('/api/periodic-evaluation/complete').send({ supplierId: 'SUP-RAWABI-01', categoryScores: GOOD_SCORES });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });
});
