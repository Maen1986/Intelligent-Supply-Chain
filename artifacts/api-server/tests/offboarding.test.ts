/**
 * HTTP-boundary tests for /api/offboarding (Item 7 Operational tier: open /
 * checklist / close / reopen, 13 Sep 2026). Mirrors blacklist.test.ts's own
 * pattern exactly: a local vi.mock('@workspace/db', ...) with a queued
 * sequential db.select(), plus a local vi.mock('@workspace/db/schema', ...).
 *
 * Call order the route actually issues:
 *   GET /current:    1. actor lookup, 2. transition_events for org+supplier
 *   POST /open:      1. actor lookup, 2. [only when actor.orgRole !== 'org_admin'] RACI events, 3. insert (opened event)
 *   POST /checklist: 1. actor lookup, 2. [RACI if not admin], 3. transition_events replay, 4. insert (checklist_item_updated event)
 *   POST /close:     1. actor lookup, 2. [RACI if not admin], 3. transition_events replay, 4. insert (closed event), 5. [only for ordinary triggers] asl_decision_events lookup, 6. [only if not already off ASL] insert (asl cross-reference)
 *   POST /reopen:    1. actor lookup, 2. [RACI if not admin], 3. transition_events replay, 4. insert (reopened event)
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
  c.returning = () => Promise.resolve([{ id: 801 + insertCalls.length, ...insertCalls[insertCalls.length - 1] }]);
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
  transitionEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', action: 'action',
    triggerReason: 'triggerReason', cooperationLevel: 'cooperationLevel', replacementSupplierNamed: 'replacementSupplierNamed',
    checklistItemKey: 'checklistItemKey', itemStatus: 'itemStatus', actorUserId: 'actorUserId', notes: 'notes', data: 'data', createdAt: 'createdAt',
  },
  aslDecisionEventsTable: {
    id: 'id', organizationId: 'organizationId', supplierId: 'supplierId', decisionType: 'decisionType', reasonCategory: 'reasonCategory',
    reasonNote: 'reasonNote', approverUserId: 'approverUserId', qualificationGateStatusAtDecision: 'qualificationGateStatusAtDecision',
    dueDiligenceTierAtDecision: 'dueDiligenceTierAtDecision', reviewDueAt: 'reviewDueAt', data: 'data', createdAt: 'createdAt',
  },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import offboardingRouter from '../src/routes/offboarding';

function accountableEvent(userId: number, activityKey: string, createdAt = new Date('2026-08-01')) {
  return { id: 1, activityKey, role: 'A', userId, action: 'assigned', createdAt };
}
function transitionEvent(supplierId: string, action: string, opts: Partial<{ triggerReason: string | null; cooperationLevel: string | null; replacementSupplierNamed: boolean | null; checklistItemKey: string | null; itemStatus: string | null }> = {}, createdAt = new Date('2026-09-13')) {
  return {
    id: 1, supplierId, action,
    triggerReason: opts.triggerReason ?? null, cooperationLevel: opts.cooperationLevel ?? null, replacementSupplierNamed: opts.replacementSupplierNamed ?? null,
    checklistItemKey: opts.checklistItemKey ?? null, itemStatus: opts.itemStatus ?? null, createdAt,
  };
}
function aslDecisionEvent(decisionType: string, createdAt = new Date('2026-09-01')) {
  return { id: 1, decisionType, createdAt };
}
const GATING_KEYS_COOPERATIVE = ['access_revocation', 'data_return_or_destruction', 'final_settlement', 'contractual_closeout', 'open_commitment_wind_down', 'asset_recovery', 'exit_feedback_and_reference'];

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  insertCalls = [];
});

const VALID_OPEN_COOPERATIVE = { supplierId: 'SUP-RAWABI-06', triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' };

describe('GET /api/offboarding/current', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(401);
  });

  it('400s when supplierId is missing', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).get('/api/offboarding/current');
    expect(res.status).toBe(400);
  });

  it('returns isOpen=false defaults when no organization is linked to the account', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: null }]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(false);
    expect(res.body.latestEvent).toBeNull();
  });

  it('returns isOpen=false when no transition_events exist for this supplier', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(false);
  });

  it('replays an opened event into the correct requirement levels for a cooperative, no-replacement transition', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: false })]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(true);
    expect(res.body.isClosed).toBe(false);
    const byKey = Object.fromEntries(res.body.checklist.map((c: any) => [c.key, c.requirement]));
    expect(byKey.access_revocation).toBe('mandatory');
    expect(byKey.knowledge_transfer).toBe('recommended');
    expect(byKey.exit_feedback_and_reference).toBe('mandatory');
    expect(byKey.post_exit_follow_up).toBe('recommended');
  });

  it('marks exit_feedback_and_reference not_applicable for an adversarial cooperation level', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial', replacementSupplierNamed: false })]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    const byKey = Object.fromEntries(res.body.checklist.map((c: any) => [c.key, c.requirement]));
    expect(byKey.exit_feedback_and_reference).toBe('not_applicable');
  });

  it('CONDITIONAL_MANDATORY: knowledge_transfer becomes conditional_mandatory when replacementSupplierNamed is true', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative', replacementSupplierNamed: true })]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    const byKey = Object.fromEntries(res.body.checklist.map((c: any) => [c.key, c.requirement]));
    expect(byKey.knowledge_transfer).toBe('conditional_mandatory');
  });

  it('BOUNDARY: filters correctly by supplierId even with another suppliers events present', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([transitionEvent('SUP-OTHER-99', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' })]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(false);
  });

  it('a closed-then-reopened record replays back to isOpen=true, isClosed=false', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    selectQueue.push([{ organizationId: 1 }]);
    selectQueue.push([
      transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01')),
      transitionEvent('SUP-RAWABI-06', 'closed', {}, new Date('2026-09-05')),
      transitionEvent('SUP-RAWABI-06', 'reopened', {}, new Date('2026-09-06')),
    ]);
    const res = await request(app).get('/api/offboarding/current?supplierId=SUP-RAWABI-06');
    expect(res.status).toBe(200);
    expect(res.body.isOpen).toBe(true);
    expect(res.body.isClosed).toBe(false);
  });
});

describe('POST /api/offboarding/open -- standard write-gate (org_admin OR RACI Accountable for offboarding_decision)', () => {
  it('401s an unauthenticated caller before any gate logic runs', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter);
    const res = await request(app).post('/api/offboarding/open').send(VALID_OPEN_COOPERATIVE);
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload -- missing triggerReason', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send({ supplierId: 'SUP-RAWABI-06', cooperationLevel: 'cooperative' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s an invalid triggerReason value not in the 7-value vocabulary', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send({ supplierId: 'SUP-RAWABI-06', triggerReason: 'bankruptcy', cooperationLevel: 'cooperative' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is neither org_admin nor the RACI Accountable holder for offboarding_decision', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(99, 'offboarding_decision')]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send(VALID_OPEN_COOPERATIVE);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Accountable holder/i);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: 403s a caller who IS Accountable, but for a different RACI activity (blacklist_decision, not offboarding_decision)', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'blacklist_decision')]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send(VALID_OPEN_COOPERATIVE);
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: the genuine RACI Accountable holder for offboarding_decision (a non-admin) is accepted -- confirms the STANDARD gate, unlike blacklist.ts finalize which is org_admin-only', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([accountableEvent(5, 'offboarding_decision')]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send(VALID_OPEN_COOPERATIVE);
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('opened');
    expect(insertCalls[0].triggerReason).toBe('natural_contract_end');
    expect(insertCalls[0].replacementSupplierNamed).toBe(false);
  });

  it('POSITIVE CONTROL: org_admin is accepted with zero RACI query needed', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/open').send({ ...VALID_OPEN_COOPERATIVE, replacementSupplierNamed: true, notes: 'Contract expires naturally, replacement already onboarded.' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].replacementSupplierNamed).toBe(true);
    expect(insertCalls[0].notes).toMatch(/replacement already onboarded/);
  });
});

describe('POST /api/offboarding/checklist -- same standard gate, requires an open, non-closed transition record', () => {
  it('401s an unauthenticated caller', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter);
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'access_revocation', itemStatus: 'complete' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid checklistItemKey', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'delete_everything', itemStatus: 'complete' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is not the Accountable holder', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'access_revocation', itemStatus: 'complete' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when no open transition record exists for this supplier yet', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'access_revocation', itemStatus: 'complete' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No open transition record/);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the transition record is already closed -- must reopen first', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([
      transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01')),
      transitionEvent('SUP-RAWABI-06', 'closed', {}, new Date('2026-09-05')),
    ]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'access_revocation', itemStatus: 'complete' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already closed/);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: updates a single checklist item on an open, non-closed record', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' })]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/checklist').send({ supplierId: 'SUP-RAWABI-06', checklistItemKey: 'knowledge_transfer', itemStatus: 'in_progress', notes: 'Handover docs in progress.' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('checklist_item_updated');
    expect(insertCalls[0].checklistItemKey).toBe('knowledge_transfer');
    expect(insertCalls[0].itemStatus).toBe('in_progress');
  });
});


describe('POST /api/offboarding/close -- same standard gate, server-side closure re-validation, guarded ASL cross-reference', () => {
  it('401s an unauthenticated caller', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter);
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload -- missing supplierId', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({});
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is not the Accountable holder', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when no open transition record exists', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No open transition record/);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the record is already closed', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([
      transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01')),
      transitionEvent('SUP-RAWABI-06', 'closed', {}, new Date('2026-09-05')),
    ]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already closed/);
    expect(insertCalls).toHaveLength(0);
  });

  it('CORE VALIDATION CASE: 400s and names the blocking items when mandatory checklist items are not yet complete -- never trusts a client-supplied ready-to-close claim', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' })]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mandatory checklist items are not yet complete/);
    expect(res.body.error).toMatch(/access_revocation/);
    expect(insertCalls).toHaveLength(0);
  });

  it('BOUNDARY: recommended items (knowledge_transfer, post_exit_follow_up) left pending do NOT block closure once all gating items are complete', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const events = [transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01'))];
    GATING_KEYS_COOPERATIVE.forEach((key, i) => {
      events.push(transitionEvent('SUP-RAWABI-06', 'checklist_item_updated', { checklistItemKey: key, itemStatus: 'complete' }, new Date(`2026-09-0${2 + i}`)));
    });
    selectQueue.push(events);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06', notes: 'All mandatory items closed out.' });
    expect(res.status).toBe(200);
    expect(insertCalls[0].action).toBe('closed');
    expect(insertCalls[0].data.checklistSnapshot).toBeTruthy();
  });

  it('POSITIVE CONTROL + CORE CROSS-REFERENCE CASE: an ordinary trigger with a clean ASL history inserts BOTH the closed event AND a real revoked row into asl_decision_events', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const events = [transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'supplier_initiated_exit', cooperationLevel: 'limited' }, new Date('2026-09-01'))];
    GATING_KEYS_COOPERATIVE.forEach((key, i) => {
      events.push(transitionEvent('SUP-RAWABI-06', 'checklist_item_updated', { checklistItemKey: key, itemStatus: 'complete' }, new Date(`2026-09-0${2 + i}`)));
    });
    selectQueue.push(events);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0].action).toBe('closed');
    expect(insertCalls[1].decisionType).toBe('revoked');
    expect(insertCalls[1].reasonCategory).toBe('voluntary_exit');
    expect(insertCalls[1].reasonNote).toMatch(/Item 7 transition event/);
    expect(res.body.aslCrossReference).toBeTruthy();
    expect(res.body.aslCrossReference.decisionType).toBe('revoked');
  });

  it('DUPLICATE-WRITE GUARD: skips the ASL cross-reference write when the supplier is already off the ASL', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const events = [transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01'))];
    GATING_KEYS_COOPERATIVE.forEach((key, i) => {
      events.push(transitionEvent('SUP-RAWABI-06', 'checklist_item_updated', { checklistItemKey: key, itemStatus: 'complete' }, new Date(`2026-09-0${2 + i}`)));
    });
    selectQueue.push(events);
    selectQueue.push([aslDecisionEvent('revoked', new Date('2026-08-01'))]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('closed');
    expect(res.body.aslCrossReference).toBeNull();
  });

  it('CROSS-REFERENCED-TRIGGER GUARD: a blacklist_finalized-triggered transition skips the ASL write entirely -- Item 6 already decided, no lookup or insert issued', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    const events = [transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'blacklist_finalized', cooperationLevel: 'adversarial' }, new Date('2026-09-01'))];
    const adversarialGating = GATING_KEYS_COOPERATIVE.filter((k) => k !== 'exit_feedback_and_reference');
    adversarialGating.forEach((key, i) => {
      events.push(transitionEvent('SUP-RAWABI-06', 'checklist_item_updated', { checklistItemKey: key, itemStatus: 'complete' }, new Date(`2026-09-0${2 + i}`)));
    });
    selectQueue.push(events);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/close').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('closed');
    expect(res.body.aslCrossReference).toBeNull();
  });
});

describe('POST /api/offboarding/reopen -- same standard gate, only a closed record can be reopened', () => {
  it('401s an unauthenticated caller', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter);
    const res = await request(app).post('/api/offboarding/reopen').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(401);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s a structurally invalid payload', async () => {
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/reopen').send({});
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('403s a plain member who is not the Accountable holder', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'member' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/reopen').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(403);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the transition record was never opened at all', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/reopen').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Only a closed transition record/);
    expect(insertCalls).toHaveLength(0);
  });

  it('400s when the transition record is open but not yet closed -- nothing to reopen', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' })]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/reopen').send({ supplierId: 'SUP-RAWABI-06' });
    expect(res.status).toBe(400);
    expect(insertCalls).toHaveLength(0);
  });

  it('POSITIVE CONTROL: a genuinely closed record is reopened -- an append-only reopened event is inserted, no data mutated or deleted', async () => {
    selectQueue.push([{ organizationId: 1, orgRole: 'org_admin' }]);
    selectQueue.push([
      transitionEvent('SUP-RAWABI-06', 'opened', { triggerReason: 'natural_contract_end', cooperationLevel: 'cooperative' }, new Date('2026-09-01')),
      transitionEvent('SUP-RAWABI-06', 'closed', {}, new Date('2026-09-05')),
    ]);
    const app = makeApp('/api/offboarding', offboardingRouter, { userId: 5 });
    const res = await request(app).post('/api/offboarding/reopen').send({ supplierId: 'SUP-RAWABI-06', notes: 'Client requested one more asset return window.' });
    expect(res.status).toBe(200);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].action).toBe('reopened');
    expect(insertCalls[0].notes).toMatch(/asset return window/);
  });
});
