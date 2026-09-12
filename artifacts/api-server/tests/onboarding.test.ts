/**
 * HTTP-boundary tests for /api/onboarding (Item 4, Onboarding Operational
 * tier) -- proves the double write-gate (ASL onASL + RACI Accountable
 * holder for 'onboarding_signoff') is enforced at the route boundary
 * itself, not only in the pure derivation/validation functions covered by
 * supplierOnboarding.test.ts. Mirrors preQualification.test.ts's pattern:
 * a local vi.mock('@workspace/db', ...) with a queued sequential
 * db.select() (this route issues several different-shaped selects within
 * one POST /events request: actor lookup, ASL events, then conditionally
 * RACI events, then this supplier's prior onboarding events), plus a local
 * vi.mock('@workspace/db/schema', ...).
 *
 * Call order the route (read line-by-line before writing this file)
 * actually issues for POST /events:
 *   1. actor lookup (usersTable: organizationId, orgRole)
 *   2. aslDecisionEventsTable rows for this org (ALL suppliers -- filtered
 *      to the target supplierId in-process by currentAslState())
 *   3. [only when actor.orgRole !== 'org_admin'] raciAssignmentEventsTable rows
 *   4. onboardingStepEventsTable rows for this org+supplier (prior events)
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
  c.returning = () => Promise.resolve([{ id: 901, ...insertCalls[insertCalls.length - 1] }]);
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
  aslDecisionEventsTable: { id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', decisionType: 'decisionType', createdAt: 'createdAt' },
  raciAssignmentEventsTable: { id: 'id', organizationId: 'organizationId', activityKey: 'activityKey', role: 'role', userId: 'userId', action: 'action', createdAt: 'createdAt' },
  onboardingStepEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', stepKey: 'stepKey', action: 'action',
    actorUserId: 'actorUserId', note: 'note', verificationChannelNote: 'verificationChannelNote',
    firstPaymentHoldAcknowledged: 'firstPaymentHoldAcknowledged', aslStatusAtEvent: 'aslStatusAtEvent', createdAt: 'createdAt',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import onboardingRouter from '../src/routes/onboarding';

const VALID_BODY = { supplierId: 'SUP-RAWABI-01', stepKey: 'nda_signed', action: 'completed' as const };

const BANKING_BODY = {
  supplierId: 'SUP-RAWABI-01',
  stepKey: 'banking_details_verified',
  action: 'completed' as const,
  verificationChannelNote: 'Called +966-5xx already on file',
  firstPaymentHoldAcknowledged: true,
};

function aslEvent(supplierId: string, decisionType: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, supplierId, decisionType, createdAt };
}
function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

describe('GET /api/onboarding/register', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/onboarding', onboardingRouter);
    const res = await request(app).get('/api/onboarding/register');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/onboarding/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/onboarding', onboardingRouter);
    const res = await request(app).get('/api/onboarding/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(401);
  });

  it('400s when supplierId is missing', async () => {
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    const res = await request(app).get('/api/onboarding/current');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/onboarding/events -- double write-gate enforcement at the HTTP boundary', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/onboarding', onboardingRouter);
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload (bad action) before touching the database', async () => {
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/onboarding/events').send({ ...VALID_BODY, action: 'rubber_stamped' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s -- a step marked complete for a supplier that was never actually ASL-approved -- gate 1 refuses before RACI is even checked', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]); // actor lookup
    selectQueue.push([]); // no ASL events at all for this supplier -> NEVER_ASSESSED, not onASL
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Approved Supplier List/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s -- ASL state exists but is currently suspended, not approved', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved', new Date('2026-06-01')), aslEvent('SUP-RAWABI-01', 'suspended', new Date('2026-07-01'))]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for onboarding_signoff (ASL gate passes first)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([accountableEvent(99, 'onboarding_signoff')]); // real Accountable is user 99, not caller (5)
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS Accountable, but for a different RACI activity (not onboarding_signoff)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([accountableEvent(5, 'prequalification_approval')]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s -- the caller was Accountable for onboarding_signoff but was reassigned mid-onboarding (since unassigned)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([
      accountableEvent(5, 'onboarding_signoff', new Date('2026-06-01')),
      { id: 2, activityKey: 'onboarding_signoff', role: 'A', userId: 5, action: 'unassigned', createdAt: new Date('2026-07-01') },
    ]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: org_admin caller is accepted and the event is actually inserted (proves the harness is not just always-403)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]); // actor lookup -- no RACI lookup follows for an admin
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]); // ASL state
    selectQueue.push([]); // prior onboarding events (none yet)
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ organizationId: 1, supplierId: 'SUP-RAWABI-01', stepKey: 'nda_signed', action: 'completed', actorUserId: 7 });
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for onboarding_signoff (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([accountableEvent(5, 'onboarding_signoff')]);
    selectQueue.push([]); // prior onboarding events
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
  });

  it('HARDEST: 400s a duplicate completion for an already-completed step, even from an authorized admin caller -- write-gate and checklist validation are independent, both enforced', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([{ stepKey: 'nda_signed', action: 'completed', createdAt: new Date('2026-08-01') }]); // already completed
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(VALID_BODY);
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 400s a completion event for a step key that does not exist in the checklist', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send({ ...VALID_BODY, stepKey: 'made_up_step' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 400s banking_details_verified before banking_details_submitted (ordered dependency enforced server-side too)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([]); // no prior onboarding events -- banking_details_submitted never completed
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(BANKING_BODY);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requires these steps/);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s banking_details_verified with the dependency satisfied but no verification channel / hold acknowledgement', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([{ stepKey: 'banking_details_submitted', action: 'completed', createdAt: new Date('2026-08-01') }]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send({ supplierId: 'SUP-RAWABI-01', stepKey: 'banking_details_verified', action: 'completed' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: banking_details_verified succeeds once dependency + verification channel + hold ack are all satisfied', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([{ stepKey: 'banking_details_submitted', action: 'completed', createdAt: new Date('2026-08-01') }]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send(BANKING_BODY);
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ stepKey: 'banking_details_verified', verificationChannelNote: BANKING_BODY.verificationChannelNote, firstPaymentHoldAcknowledged: true });
  });

  it('SOFT: a reopen event for a genuinely-completed step is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([{ stepKey: 'nda_signed', action: 'completed', createdAt: new Date('2026-08-01') }]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send({ supplierId: 'SUP-RAWABI-01', stepKey: 'nda_signed', action: 'reopened' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
  });

  it('400s a reopen event for a step that was never completed', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([aslEvent('SUP-RAWABI-01', 'approved')]);
    selectQueue.push([]);
    const app = makeApp('/api/onboarding', onboardingRouter, { userId: 7 });
    const res = await request(app).post('/api/onboarding/events').send({ supplierId: 'SUP-RAWABI-01', stepKey: 'nda_signed', action: 'reopened' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });
});
