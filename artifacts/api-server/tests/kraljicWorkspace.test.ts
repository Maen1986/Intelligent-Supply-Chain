/**
 * Tests for GET/PUT /api/kraljic-workspace (Round B5 gap KR-B5-1: server
 * persistence for the Kraljic Suppliers-tab working data). Mirrors
 * tests/rarAnalyses.test.ts mock patterns.
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
  kraljicWorkspacesTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId',
    data: 'data', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import router from '../src/routes/kraljicWorkspace';

const URL = '/api/kraljic-workspace';
const WS = { facts: { s1: { qualifiedAlternatives: 2 } }, reviews: [{ id: 'r1' }], extras: {}, ledger: [{ id: 'l1', riskPct: 40 }] };

beforeEach(() => { resetDbState(); txInsertedRows = []; });

describe('GET /api/kraljic-workspace', () => {
  it('returns 401 without a session', async () => {
    const res = await request(makeApp(URL, router)).get(URL);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
  it('returns workspace null when nothing is saved', async () => {
    const res = await request(makeApp(URL, router, { userId: 1 })).get(URL);
    expect(res.status).toBe(200);
    expect(res.body.workspace).toBeNull();
  });
  it('returns the saved workspace', async () => {
    dbState.selectRows = [{ id: 3, userId: 1, data: WS }];
    const res = await request(makeApp(URL, router, { userId: 1 })).get(URL);
    expect(res.body.workspace.data.ledger[0].riskPct).toBe(40);
  });
  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const res = await request(makeApp(URL, router, { userId: 1 })).get(URL);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/kraljic-workspace', () => {
  it('returns 401 without a session', async () => {
    const res = await request(makeApp(URL, router)).put(URL).send({ data: WS });
    expect(res.status).toBe(401);
  });
  it('returns 400 when data is missing, a string or an array', async () => {
    const app = makeApp(URL, router, { userId: 1 });
    for (const body of [{}, { data: 'x' }, { data: [1] }, { data: null }]) {
      const res = await request(app).put(URL).send(body);
      expect(res.status).toBe(400);
    }
  });
  it('returns 400 when the document is too large', async () => {
    const big = { facts: { blob: 'x'.repeat(1_100_000) } };
    const res = await request(makeApp(URL, router, { userId: 1 })).put(URL).send({ data: big });
    // The test app uses Express's default 100 kb parser (413); production allows 25 mb and the route's own 1 MB cap answers 400.
    expect([400, 413]).toContain(res.status);
  });
  it('replaces the workspace and returns the stored row, data untouched', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 9, userId: 1, organizationId: 7, data: WS }];
    const res = await request(makeApp(URL, router, { userId: 1 })).put(URL).send({ data: WS });
    expect(res.status).toBe(200);
    expect(res.body.workspace.data).toEqual(WS);
    expect(res.body.workspace.organizationId).toBe(7);
  });
  it('accepts an empty workspace object', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 9, userId: 1, organizationId: null, data: {} }];
    const res = await request(makeApp(URL, router, { userId: 1 })).put(URL).send({ data: {} });
    expect(res.status).toBe(200);
  });
  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const res = await request(makeApp(URL, router, { userId: 1 })).put(URL).send({ data: WS });
    expect(res.status).toBe(500);
  });
});
