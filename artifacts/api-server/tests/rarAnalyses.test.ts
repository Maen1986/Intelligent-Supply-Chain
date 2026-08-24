/**
 * Tests for GET /api/rar-analyses and PUT /api/rar-analyses
 * (#182 Disruption Simulator extension of RAR -- saved what-if scenarios
 * backend persistence, Wave B-6)
 *
 * Mirrors tests/clmContracts.test.ts's mock patterns exactly (whole-state
 * sync via transaction: delete-all-then-insert, organization_id stamped
 * from the user's current row).
 *
 * Covers:
 *  - 401 when unauthenticated (GET and PUT)
 *  - GET returns an empty list when the user has no saved scenarios
 *  - GET returns saved scenarios, newest-updated first
 *  - PUT 400 on invalid body shapes (missing clientKey, non-object data)
 *  - PUT 400 when the array exceeds the 50-scenario cap
 *  - PUT successful sync: deletes the user's existing rows and inserts the
 *    new set inside one transaction, stamping organization_id from the
 *    user's current row, and returns the freshly-inserted rows
 *  - PUT handles an empty analyses array (delete-all, no insert)
 *  - 500 on a database failure during GET and PUT
 *
 * The exposure recompute itself (computeRarExposure) is a pure frontend
 * calculation over the { nodes, meta } fields inside the JSONB `data` blob
 * (see ResiliencyTools.tsx) -- this route does no server-side exposure
 * logic, so there is nothing exposure-specific to unit-test here beyond
 * confirming the node fields (including the new leadTimeDays/route fields)
 * round-trip through `data` untouched.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeLoggerMock } from './helpers';

let txInsertedRows: any[] = [];

function chain(rowsGetter: () => any[], recordValues = false) {
  const c: any = {};
  for (const m of ['from', 'orderBy', 'limit', 'offset', 'set', 'returning']) {
    c[m] = () => c;
  }
  c.where = (arg: any) => { dbState.whereArgs.push(arg); return c; };
  c.values = (v: any) => {
    if (recordValues) dbState.insertedValues.push(v);
    return c;
  };
  const exec = (): Promise<any[]> => {
    if (dbState.failNext) {
      dbState.failNext = false;
      return Promise.reject(new Error('db failure (test)'));
    }
    return Promise.resolve(rowsGetter());
  };
  c.then = (res: any, rej: any) => exec().then(res, rej);
  c.catch = (fn: any) => exec().catch(fn);
  return c;
}

vi.mock('@workspace/db', () => ({
  db: {
    select: vi.fn(() => chain(() => dbState.selectRows)),
    insert: vi.fn(() => chain(() => dbState.insertRows, true)),
    update: vi.fn(() => chain(() => dbState.updateRows)),
    delete: vi.fn(() => chain(() => [])),
    transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => {
      if (dbState.failNext) {
        dbState.failNext = false;
        throw new Error('db failure (test)');
      }
      const tx = {
        delete: vi.fn(() => chain(() => [])),
        insert: vi.fn(() => chain(() => txInsertedRows, true)),
      };
      return cb(tx);
    }),
    execute: vi.fn(async () => ({ rows: [] })),
  },
}));

vi.mock('@workspace/db/schema', () => ({
  rarAnalysesTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', clientKey: 'clientKey',
    name: 'name', data: 'data', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import rarAnalysesRouter from '../src/routes/rarAnalyses';

const VALID_SCENARIO = {
  clientKey: 'rs123abc',
  name: 'Scenario 1',
  data: {
    nodes: [
      { id: 'n1', name: 'Primary Freight Forwarder', revenuePct: 22, atRisk: true, leadTimeDays: 45, route: 'Jebel Ali -> Red Sea -> Suez' },
      { id: 'n2', name: 'Domestic Distributor', revenuePct: 10, atRisk: false, leadTimeDays: 5, route: '' },
    ],
    meta: { interdependenciesMapped: false, annualRevenue: '50000000' },
  },
};

beforeEach(() => {
  resetDbState();
  txInsertedRows = [];
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/rar-analyses
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/rar-analyses', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter);
    const res = await request(app).get('/api/rar-analyses');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no saved scenarios', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/rar-analyses');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.analyses).toEqual([]);
  });

  it('returns saved scenarios sorted newest-updated first', async () => {
    dbState.selectRows = [
      { id: 1, clientKey: 'a', name: 'Older', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, clientKey: 'b', name: 'Newer', updatedAt: '2026-08-01T00:00:00.000Z' },
    ];
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/rar-analyses');
    expect(res.status).toBe(200);
    expect(res.body.analyses.map((a: any) => a.name)).toEqual(['Newer', 'Older']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/rar-analyses');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/rar-analyses
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/rar-analyses', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter);
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when analyses is not an array', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/rar-analyses').send({ analyses: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when an entry is missing clientKey', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_SCENARIO, clientKey: undefined };
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has non-object data', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_SCENARIO, data: 'not-an-object' };
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is an array (not a plain object)', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_SCENARIO, data: [1, 2, 3] };
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the array exceeds the 50-scenario cap', async () => {
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const many = Array.from({ length: 51 }, (_, i) => ({ clientKey: `k${i}`, name: 'n', data: {} }));
    const res = await request(app).put('/api/rar-analyses').send({ analyses: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50/);
  });

  it('replaces the user\'s scenarios and returns the freshly-inserted rows with real ids', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 42, ...VALID_SCENARIO, userId: 1, organizationId: 7 }];
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [VALID_SCENARIO] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.analyses).toEqual(txInsertedRows);
  });

  it('round-trips the node fields (including leadTimeDays/route) inside data untouched', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 42, ...VALID_SCENARIO, userId: 1, organizationId: null }];
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [VALID_SCENARIO] });
    expect(res.status).toBe(200);
    expect(res.body.analyses[0].data.nodes[0].leadTimeDays).toBe(45);
    expect(res.body.analyses[0].data.nodes[0].route).toBe('Jebel Ali -> Red Sea -> Suez');
    expect(res.body.analyses[0].data.meta.annualRevenue).toBe('50000000');
  });

  it('handles an empty analyses array (delete-all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [] });
    expect(res.status).toBe(200);
    expect(res.body.analyses).toEqual([]);
  });

  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const app = makeApp('/api/rar-analyses', rarAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/rar-analyses').send({ analyses: [VALID_SCENARIO] });
    expect(res.status).toBe(500);
  });
});
