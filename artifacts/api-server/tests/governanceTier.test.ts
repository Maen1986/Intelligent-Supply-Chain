/**
 * HTTP-boundary tests for /api/governance-tier (durable override
 * persistence, added 12 Sep 2026 after a QA review of Item 4's close-out).
 * Mirrors onboarding.test.ts's pattern exactly: a local
 * vi.mock('@workspace/db', ...) with a queued sequential db.select(), plus
 * a local vi.mock('@workspace/db/schema', ...).
 *
 * Call order the route actually issues:
 *   GET /current:        1. actor lookup, 2. override events for org+supplier
 *   POST /override:      1. actor lookup, 2. [only when actor.orgRole !== 'org_admin'] RACI events, 3. insert
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
  raciAssignmentEventsTable: { id: 'id', organizationId: 'organizationId', activityKey: 'activityKey', role: 'role', userId: 'userId', action: 'action', createdAt: 'createdAt' },
  governanceTierOverrideEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', action: 'action', tier: 'tier',
    actorUserId: 'actorUserId', createdAt: 'createdAt',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import governanceTierRouter from '../src/routes/governanceTier';

function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}
function overrideEvent(supplierId: string, action: 'set' | 'clear', tier: string | null, createdAt: Date) {
  return { id: 1, supplierId, action, tier, createdAt };
}

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

describe('GET /api/governance-tier/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter);
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(401);
  });

  it('400s when supplierId is missing', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    const res = await request(app).get('/api/governance-tier/current');
    expect(res.status).toBe(400);
  });

  it('returns override: null when no organization is linked to the account', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: null }]);
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.override).toBeNull();
  });

  it('returns override: null when no override events exist for this supplier', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]); // actor lookup
    selectQueue.push([]); // no override events
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.override).toBeNull();
  });

  it('returns the latest set override, including its timestamp', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([overrideEvent('SUP-RAWABI-01', 'set', 'operational', new Date('2026-09-01T00:00:00.000Z'))]);
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.override).toEqual({ tier: 'operational', overriddenAt: '2026-09-01T00:00:00.000Z' });
  });

  it('CORE CASE: a later clear event correctly overrides an earlier set event', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      overrideEvent('SUP-RAWABI-01', 'set', 'operational', new Date('2026-09-01')),
      overrideEvent('SUP-RAWABI-01', 'clear', null, new Date('2026-09-05')),
    ]);
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.override).toBeNull();
  });

  it('BOUNDARY: only the latest event for THIS supplier is used, not another supplier events for the same org', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    // Route already filters by supplierId in the WHERE clause; this proves the
    // in-process replay also filters defensively rather than trusting the DB alone.
    selectQueue.push([
      overrideEvent('SUP-OTHER-99', 'set', 'operational', new Date('2026-09-10')),
      overrideEvent('SUP-RAWABI-01', 'set', 'advisory', new Date('2026-09-01')),
    ]);
    const res = await request(app).get('/api/governance-tier/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.override).toMatchObject({ tier: 'advisory' });
  });
});

describe('POST /api/governance-tier/override -- write-gate enforcement at the HTTP boundary', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter);
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload (set without a tier) before touching the database', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a malformed tier value ("super-operational")', async () => {
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'super-operational' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for onboarding_signoff', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(99, 'onboarding_signoff')]); // real Accountable is user 99, not caller (5)
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS Accountable, but for a different RACI activity', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'prequalification_approval')]);
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('HARDEST: 403s a caller who WAS Accountable for onboarding_signoff but was reassigned since (unassigned)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([
      accountableEvent(5, 'onboarding_signoff', new Date('2026-06-01')),
      { id: 2, activityKey: 'onboarding_signoff', role: 'A', userId: 5, action: 'unassigned', createdAt: new Date('2026-07-01') },
    ]);
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: org_admin caller is accepted and a "set" event is actually inserted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]); // actor lookup -- no RACI lookup follows for an admin
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 7 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'advisory' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ organizationId: 1, supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'advisory', actorUserId: 7 });
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for onboarding_signoff (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'onboarding_signoff')]);
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
  });

  it('POSITIVE CONTROL: a "clear" action is accepted and inserted with tier: null (org_admin)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 7 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'clear' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({ organizationId: 1, supplierId: 'SUP-RAWABI-01', action: 'clear', tier: null, actorUserId: 7 });
  });

  it('403s when the account has no organization at all', async () => {
    selectQueue.push([{ organizationId: null, orgRole: null }]);
    const app = makeApp('/api/governance-tier', governanceTierRouter, { userId: 5 });
    const res = await request(app).post('/api/governance-tier/override').send({ supplierId: 'SUP-RAWABI-01', action: 'set', tier: 'operational' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });
});
