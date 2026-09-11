/**
 * HTTP-boundary tests for /api/pre-qualification (Item 3, Pre-Qualification
 * & ASL Operational tier) -- added 11 Sep 2026 in response to the owner's
 * review point #3: prove the write-gate is enforced at the route boundary
 * itself, not only in the pure derivation functions covered by
 * supplierPreQualification.test.ts.
 *
 * Mirrors tests/supplierDependencyChecks.test.ts's pattern for a route
 * whose tables aren't in the shared helpers.ts factory: a local
 * vi.mock('@workspace/db', ...) built on the shared dbState/resetDbState,
 * plus a local vi.mock('@workspace/db/schema', ...) for
 * aslDecisionEventsTable / raciAssignmentEventsTable / usersTable.
 *
 * This route issues several DIFFERENT-shaped sequential db.select() calls
 * within one POST /decisions request (actor lookup, then conditionally the
 * org's RACI events, then the supplier's prior ASL state), so the shared
 * single-queue chain() in helpers.ts (which always returns dbState.selectRows
 * for every select) is not expressive enough here. Instead db.select itself
 * is a vi.fn() that pops the next queued result set off selectQueue in call
 * order -- each test pushes exactly the sequence of rows the route's own
 * calls will consume, in the order the route file (fetched from the live
 * repo and read line-by-line before writing this file) actually issues them:
 *   1. actor lookup (usersTable: organizationId, orgRole)
 *   2. [only when actor.orgRole !== 'org_admin'] raciAssignmentEventsTable rows
 *   3. prior ASL state for this supplier (aslDecisionEventsTable)
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
  c.returning = () => Promise.resolve([{ id: 501, ...insertCalls[insertCalls.length - 1] }]);
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
  aslDecisionEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', decisionType: 'decisionType',
    reasonCategory: 'reasonCategory', reasonNote: 'reasonNote', approverUserId: 'approverUserId',
    qualificationGateStatusAtDecision: 'qualificationGateStatusAtDecision',
    dueDiligenceTierAtDecision: 'dueDiligenceTierAtDecision', reviewDueAt: 'reviewDueAt',
    data: 'data', createdAt: 'createdAt',
  },
  raciAssignmentEventsTable: {
    id: 'id', organizationId: 'organizationId', activityKey: 'activityKey', role: 'role',
    userId: 'userId', action: 'action', createdAt: 'createdAt',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import preQualificationRouter from '../src/routes/preQualification';

const QUALIFIED_GATE = { overallStatus: 'QUALIFIED', blockingGate: null, dueDiligenceTier: 'STANDARD' };

const VALID_APPROVAL_BODY = {
  supplierId: 'SUP-RAWABI-01',
  decisionType: 'approved',
  reasonCategory: 'audit',
  gate: QUALIFIED_GATE,
};

/** One RACI 'assigned' event making `userId` the current Accountable holder for `activityKey`. */
function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

describe('GET /api/pre-qualification/register', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/pre-qualification', preQualificationRouter);
    const res = await request(app).get('/api/pre-qualification/register');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/pre-qualification/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/pre-qualification', preQualificationRouter);
    const res = await request(app).get('/api/pre-qualification/current');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/pre-qualification/decisions -- write-gate enforcement at the HTTP boundary', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/pre-qualification', preQualificationRouter);
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload (bad decisionType) before touching the database', async () => {
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app)
      .post('/api/pre-qualification/decisions')
      .send({ ...VALID_APPROVAL_BODY, decisionType: 'rubber_stamped' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s a plain member who is neither org_admin nor the RACI Accountable holder, and never inserts', async () => {
    // actor lookup: orgRole is a plain member, not org_admin
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    // raci lookup: the real Accountable holder for this activity is user 99, not the caller (5)
    selectQueue.push([accountableEvent(99, 'prequalification_approval')]);
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/org's admin|Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS an Accountable holder, but for a DIFFERENT RACI activity (not prequalification_approval)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    // caller (5) is genuinely Accountable -- just for the wrong activity key.
    selectQueue.push([accountableEvent(5, 'raci_maintenance')]);
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller whose Accountable assignment for the right activity was since unassigned', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([
      accountableEvent(5, 'prequalification_approval', new Date('2026-06-01')),
      { id: 2, activityKey: 'prequalification_approval', role: 'A', userId: 5, action: 'unassigned', createdAt: new Date('2026-07-01') },
    ]);
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s even with a syntactically-valid, fully-qualified approval payload -- the gate is on WHO is calling, not on payload shape', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([]); // no RACI assignment at all for this org/activity
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: org_admin caller is accepted and the decision is actually inserted (proves the harness is not just always-403)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]); // actor lookup -- no RACI lookup follows for an admin
    selectQueue.push([]); // prior ASL state for this supplier (none yet)
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 7 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ organizationId: 1, supplierId: 'SUP-RAWABI-01', decisionType: 'approved', approverUserId: 7 });
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]); // actor lookup
    selectQueue.push([accountableEvent(5, 'prequalification_approval')]); // raci lookup: caller IS the accountable holder
    selectQueue.push([]); // prior ASL state
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 5 });
    const res = await request(app).post('/api/pre-qualification/decisions').send(VALID_APPROVAL_BODY);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
  });

  it('an authorized caller (org_admin) is still refused with 400 if the gate result does not actually support the decision -- the write-gate and the derivation rule are two independent, both-enforced checks', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([]); // prior ASL state (unused before validation short-circuits, but queued for shape parity)
    const app = makeApp('/api/pre-qualification', preQualificationRouter, { userId: 7 });
    const res = await request(app)
      .post('/api/pre-qualification/decisions')
      .send({ ...VALID_APPROVAL_BODY, gate: { overallStatus: 'NOT_QUALIFIED', blockingGate: 'financial', dueDiligenceTier: 'STANDARD' } });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(insertCalls).toHaveLength(0);
  });
});
