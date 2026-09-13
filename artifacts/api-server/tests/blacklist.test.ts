/**
 * HTTP-boundary tests for /api/blacklist (Item 6 Operational tier: draft /
 * finalize / reverse, 12 Sep 2026). Mirrors periodicEvaluation.test.ts's and
 * governanceTier.test.ts's pattern exactly: a local vi.mock('@workspace/db', ...)
 * with a queued sequential db.select(), plus a local vi.mock('@workspace/db/schema', ...).
 *
 * Call order the route actually issues:
 *   GET /current:      1. actor lookup, 2. blacklist_events for org+supplier
 *   POST /draft:       1. actor lookup, 2. [only when actor.orgRole !== 'org_admin'] RACI events, 3. insert (event)
 *   POST /finalize:    1. actor lookup (org_admin ONLY -- no RACI fallback query at all), 2. insert (blacklist event), 3. insert (asl cross-reference)
 *   POST /reverse:     1. actor lookup (org_admin ONLY), 2. blacklist_events replay (must be actively blacklisted), 3. insert (reversed event)
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
  c.returning = () => Promise.resolve([{ id: 701 + insertCalls.length, ...insertCalls[insertCalls.length - 1] }]);
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
  blacklistEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', action: 'action', evidence: 'evidence',
    rightToRespondConfirmed: 'rightToRespondConfirmed', durationType: 'durationType', effectiveUntil: 'effectiveUntil',
    actorUserId: 'actorUserId', notes: 'notes', createdAt: 'createdAt',
  },
  aslDecisionEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', decisionType: 'decisionType', reasonCategory: 'reasonCategory',
    reasonNote: 'reasonNote', approverUserId: 'approverUserId', qualificationGateStatusAtDecision: 'qualificationGateStatusAtDecision',
    dueDiligenceTierAtDecision: 'dueDiligenceTierAtDecision', reviewDueAt: 'reviewDueAt', data: 'data', createdAt: 'createdAt',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import blacklistRouter from '../src/routes/blacklist';

function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}
function blacklistEvent(supplierId: string, action: string, opts: Partial<{ durationType: string | null; effectiveUntil: Date | null }> = {}, createdAt = new Date('2026-09-01')) {
  return { id: 1, supplierId, action, durationType: opts.durationType ?? null, effectiveUntil: opts.effectiveUntil ?? null, createdAt };
}

const SUFFICIENT_EVIDENCE = [
  { category: 'compliance_violation', detailEn: 'Confirmed regulatory violation.', independentlySufficient: true },
];

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

describe('GET /api/blacklist/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(401);
  });

  it('400s when supplierId is missing', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).get('/api/blacklist/current');
    expect(res.status).toBe(400);
  });

  it('returns not-blacklisted defaults when no organization is linked to the account', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    selectQueue.push([{ organizationId: null }]);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.isBlacklisted).toBe(false);
    expect(res.body.latestEvent).toBeNull();
  });

  it('returns not-blacklisted when no events exist for this supplier', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([]);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.isBlacklisted).toBe(false);
  });

  it('returns isBlacklisted=true for a finalized permanent entry', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([blacklistEvent('SUP-RAWABI-01', 'finalized', { durationType: 'permanent' })]);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.isBlacklisted).toBe(true);
  });

  it('CORE REVERSAL CASE: a finalized entry followed by a reversed event is NOT blacklisted', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      blacklistEvent('SUP-RAWABI-01', 'finalized', { durationType: 'permanent' }, new Date('2026-09-01')),
      blacklistEvent('SUP-RAWABI-01', 'reversed', {}, new Date('2026-09-10')),
    ]);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.isBlacklisted).toBe(false);
  });

  it('BOUNDARY: filters correctly by supplierId even with another supplier\'s events present', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      blacklistEvent('SUP-OTHER-99', 'finalized', { durationType: 'permanent' }),
    ]);
    const res = await request(app).get('/api/blacklist/current?supplierId=SUP-RAWABI-01');
    expect(res.status).toBe(200);
    expect(res.body.isBlacklisted).toBe(false);
  });
});

describe('POST /api/blacklist/draft -- lighter write-gate (org_admin OR RACI Accountable), same pattern as Items 1-5', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter);
    const res = await request(app).post('/api/blacklist/draft').send({ supplierId: 'SUP-RAWABI-01', action: 'draft_set' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/draft').send({ action: 'draft_set' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for blacklist_decision', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(99, 'blacklist_decision')]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/draft').send({ supplierId: 'SUP-RAWABI-01', action: 'draft_set', evidence: SUFFICIENT_EVIDENCE });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS Accountable, but for a different RACI activity (periodic_evaluation, not blacklist_decision)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'periodic_evaluation')]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/draft').send({ supplierId: 'SUP-RAWABI-01', action: 'draft_set' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for blacklist_decision (a non-admin) is accepted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'blacklist_decision')]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/draft').send({ supplierId: 'SUP-RAWABI-01', action: 'draft_set', evidence: SUFFICIENT_EVIDENCE });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('draft_set');
  });

  it('POSITIVE CONTROL: org_admin is accepted with zero RACI query needed', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/draft').send({ supplierId: 'SUP-RAWABI-01', action: 'draft_clear' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('draft_clear');
    expect(insertCalls[0].evidence).toBeNull();
  });
});

describe('POST /api/blacklist/finalize -- STRICTER write-gate: org_admin ONLY, never the RACI Accountable holder alone', () => {
  it('401s an unauthenticated caller', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter);
    const res = await request(app).post('/api/blacklist/finalize').send({ supplierId: 'SUP-RAWABI-01', evidence: SUFFICIENT_EVIDENCE, rightToRespondConfirmed: true, durationType: 'permanent' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload before any gate/DB logic runs', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({ supplierId: 'SUP-RAWABI-01' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('CORE AUTHORIZATION-BAR CASE: 403s the genuine RACI Accountable holder for blacklist_decision -- accountable alone is explicitly NOT sufficient to finalize, only org_admin is', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    // Note: unlike /draft, the route never even issues a RACI query for
    // /finalize -- the gate is a pure orgRole check. Only one select is queued.
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({ supplierId: 'SUP-RAWABI-01', evidence: SUFFICIENT_EVIDENCE, rightToRespondConfirmed: true, durationType: 'permanent' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when evidence threshold is not met, even for an org_admin', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({
      supplierId: 'SUP-RAWABI-01',
      evidence: [{ category: 'other_documented_evidence', detailEn: 'one weak item', independentlySufficient: false }],
      rightToRespondConfirmed: true,
      durationType: 'permanent',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Evidence threshold/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when right-to-respond has not been confirmed, even with sufficient evidence and org_admin', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({
      supplierId: 'SUP-RAWABI-01',
      evidence: SUFFICIENT_EVIDENCE,
      rightToRespondConfirmed: false,
      durationType: 'permanent',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/right-to-respond/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a time_bound duration with no effectiveUntilIso', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({
      supplierId: 'SUP-RAWABI-01',
      evidence: SUFFICIENT_EVIDENCE,
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
    });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL + CORE CROSS-REFERENCE CASE: org_admin with a fully valid finalize payload inserts BOTH the blacklist event AND a real \'revoked\' row into asl_decision_events', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({
      supplierId: 'SUP-RAWABI-01',
      evidence: SUFFICIENT_EVIDENCE,
      rightToRespondConfirmed: true,
      durationType: 'time_bound',
      effectiveUntilIso: '2027-06-01T00:00:00.000Z',
      notes: 'Confirmed after formal review.',
    });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0].action).toBe('finalized');
    expect(insertCalls[0].durationType).toBe('time_bound');
    // The second insert is the real cross-reference into asl_decision_events --
    // never a duplicate parallel status field.
    expect(insertCalls[1].decisionType).toBe('revoked');
    expect(insertCalls[1].reasonCategory).toBe('compliance_violation');
    expect(insertCalls[1].reasonNote).toMatch(/blacklist event/i);
    expect(res.body.aslCrossReference).toBeTruthy();
    expect(res.body.aslCrossReference.decisionType).toBe('revoked');
  });

  it('accepts a permanent finalization with no effectiveUntilIso required', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/finalize').send({
      supplierId: 'SUP-RAWABI-01',
      evidence: SUFFICIENT_EVIDENCE,
      rightToRespondConfirmed: true,
      durationType: 'permanent',
    });
    expect(res.status).toBe(200);
    expect(insertCalls[0].durationType).toBe('permanent');
    expect(insertCalls[0].effectiveUntil).toBeNull();
  });
});

const VALID_REVERSAL_JUSTIFICATION = 'Appeal upheld -- evidence found insufficient on further review.';

describe('POST /api/blacklist/reverse -- STRICTER write-gate (org_admin ONLY), a required justification, and server-derived prior-state check', () => {
  it('401s an unauthenticated caller', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter);
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: VALID_REVERSAL_JUSTIFICATION });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload -- justificationNote missing entirely (gap found on independent review, closed here: previously optional)', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/justificationNote/);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload -- justificationNote is an empty string', async () => {
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: '' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member, including the genuine RACI Accountable holder for blacklist_decision -- reversal is equally consequential, org_admin only (a valid justification alone does not bypass the gate)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: VALID_REVERSAL_JUSTIFICATION });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when justificationNote is structurally present but below the due-process minimum length (org_admin, gate passes, due-process check does not) -- mirrors the same rigor /finalize applies to its own four gates', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: 'too short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/justification is required/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the supplier is NOT currently, actively blacklisted -- never trusts a client-supplied "it was blacklisted" claim (checked only after the justification itself is valid)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([]); // no blacklist_events at all for this supplier
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: VALID_REVERSAL_JUSTIFICATION });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not currently/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the supplier\'s blacklist entry has already expired (a time_bound entry past effectiveUntil is not "actively" blacklisted)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([blacklistEvent('SUP-RAWABI-01', 'finalized', { durationType: 'time_bound', effectiveUntil: new Date('2020-01-01') })]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: VALID_REVERSAL_JUSTIFICATION });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL + CORE APPEAL CASE: org_admin reverses an actively-blacklisted supplier with a valid justification, a \'reversed\' event is actually inserted, and the response includes the ASL-requalification suggestion', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([blacklistEvent('SUP-RAWABI-01', 'finalized', { durationType: 'permanent' })]);
    const app = makeApp('/api/blacklist', blacklistRouter, { userId: 5 });
    const res = await request(app).post('/api/blacklist/reverse').send({ supplierId: 'SUP-RAWABI-01', justificationNote: VALID_REVERSAL_JUSTIFICATION });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('reversed');
    expect(insertCalls[0].notes).toMatch(/Appeal upheld/i);
    expect(res.body.aslRequalificationSuggestion.suggestionEn).toContain('SUP-RAWABI-01');
    expect(res.body.aslRequalificationSuggestion.suggestionEn.toLowerCase()).toContain('does not automatically restore');
  });
});
