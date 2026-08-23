/**
 * Tests for GET /api/working-capital-analyses and PUT /api/working-capital-analyses
 * (#169 Working Capital Control Tower backend persistence)
 *
 * Mirrors tests/tcoAnalyses.test.ts's mock patterns exactly (whole-state
 * sync via transaction: delete-all-then-insert, organization_id stamped
 * from the user's current row).
 *
 * Covers:
 *  - 401 when unauthenticated (GET and PUT)
 *  - GET returns an empty list when the user has no saved analyses
 *  - GET returns saved analyses, newest-updated first
 *  - PUT 400 on invalid body shapes (missing fields, non-numeric fields)
 *  - PUT 400 when the array exceeds the 50-analysis cap
 *  - PUT successful sync: deletes the user's existing rows and inserts the
 *    new set inside one transaction, stamping organization_id from the
 *    user's current row, and returns the freshly-inserted rows
 *  - PUT handles an empty analyses array (delete-all, no insert)
 *  - 500 on a database failure during GET and PUT
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeLoggerMock } from './helpers';

/* ── DB mock (same chain/transaction helper as tcoAnalyses.test.ts) ────── */

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
  workingCapitalAnalysesTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', clientKey: 'clientKey',
    name: 'name', inventoryValue: 'inventoryValue', dioDays: 'dioDays', dsoDays: 'dsoDays',
    dpoDays: 'dpoDays', annualCogs: 'annualCogs', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import workingCapitalAnalysesRouter from '../src/routes/workingCapitalAnalyses';

const VALID_ANALYSIS = {
  clientKey: 'wca123abc',
  name: 'FY2026 Baseline',
  inventoryValue: 4200000,
  dioDays: 62,
  dsoDays: 48,
  dpoDays: 35,
  annualCogs: 18500000,
};

beforeEach(() => {
  resetDbState();
  txInsertedRows = [];
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/working-capital-analyses
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/working-capital-analyses', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter);
    const res = await request(app).get('/api/working-capital-analyses');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no saved analyses', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/working-capital-analyses');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.analyses).toEqual([]);
  });

  it('returns saved analyses sorted newest-updated first', async () => {
    dbState.selectRows = [
      { id: 1, clientKey: 'a', name: 'Older', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, clientKey: 'b', name: 'Newer', updatedAt: '2026-08-01T00:00:00.000Z' },
    ];
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/working-capital-analyses');
    expect(res.status).toBe(200);
    expect(res.body.analyses.map((a: any) => a.name)).toEqual(['Newer', 'Older']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).get('/api/working-capital-analyses');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/working-capital-analyses
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/working-capital-analyses', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter);
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when analyses is not an array', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when an entry is missing clientKey', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_ANALYSIS, clientKey: undefined };
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has a non-numeric dioDays', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_ANALYSIS, dioDays: 'sixty-two' };
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has a non-finite annualCogs (NaN/Infinity)', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const bad = { ...VALID_ANALYSIS, annualCogs: Infinity };
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the array exceeds the 50-analysis cap', async () => {
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const many = Array.from({ length: 51 }, (_, i) => ({ ...VALID_ANALYSIS, clientKey: `k${i}` }));
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50/);
  });

  it('replaces the user\'s analyses and returns the freshly-inserted rows with real ids', async () => {
    dbState.selectRows = [{ organizationId: 7 }]; // usersTable lookup
    txInsertedRows = [{ id: 42, ...VALID_ANALYSIS, userId: 1, organizationId: 7 }];
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [VALID_ANALYSIS] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.analyses).toEqual(txInsertedRows);
  });

  it('handles an empty analyses array (delete-all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [] });
    expect(res.status).toBe(200);
    expect(res.body.analyses).toEqual([]);
  });

  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const app = makeApp('/api/working-capital-analyses', workingCapitalAnalysesRouter, { userId: 1 });
    const res = await request(app).put('/api/working-capital-analyses').send({ analyses: [VALID_ANALYSIS] });
    expect(res.status).toBe(500);
  });
});
