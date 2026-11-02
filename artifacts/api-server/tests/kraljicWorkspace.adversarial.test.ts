/**
 * Round C (#668) -- ADVERSARIAL tests for PUT/GET /api/kraljic-workspace.
 * Hostile bodies, wrong content types, prototype-pollution keys, NUL characters (PostgreSQL jsonb cannot
 * store U+0000), XSS text, Arabic payloads that are small in characters but large in bytes, concurrency.
 * Mirrors tests/kraljicWorkspace.test.ts mock patterns; the parser limit mirrors production (25 mb).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { dbState, resetDbState, makeLoggerMock } from './helpers';

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

/** Same as helpers.makeApp but with production's 25 mb JSON limit, so the route's OWN cap is what gets tested. */
function prodLikeApp(session: Record<string, unknown> = { userId: 1 }): Express {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use((req, _res, next) => { (req as any).session = { ...session, save: (cb: any) => cb(), destroy: (cb: any) => cb() }; next(); });
  app.use(URL, router);
  return app;
}

beforeEach(() => { resetDbState(); txInsertedRows = []; dbState.selectRows = [{ organizationId: null }]; });

describe('R-C PUT: hostile request shapes answer 400, never 500', () => {
  it('no body at all (Express 5 leaves req.body undefined)', async () => {
    const res = await request(prodLikeApp()).put(URL);
    expect(res.status).toBe(400);
  });
  it('wrong content type (text/plain, form-encoded) is a 400', async () => {
    const a = prodLikeApp();
    expect((await request(a).put(URL).set('Content-Type', 'text/plain').send('{"data":{}}')).status).toBe(400);
    expect((await request(a).put(URL).type('form').send('data=x')).status).toBe(400);
  });
  it('malformed JSON is a 4xx, never a 500', async () => {
    const res = await request(prodLikeApp()).put(URL).set('Content-Type', 'application/json').send('{"data": {');
    expect(res.status).toBeGreaterThanOrEqual(400); expect(res.status).toBeLessThan(500);
  });
  it.each([[null], [true], [0], ['s'], [[]], [[{}]]])('top-level JSON %j is a 400', async (v) => {
    const res = await request(prodLikeApp()).put(URL).set('Content-Type', 'application/json').send(JSON.stringify(v));
    expect(res.status).toBe(400);
  });
  it.each([[null], [1], ['x'], [[]], [true]])('data = %j is a 400', async (v) => {
    const res = await request(prodLikeApp()).put(URL).send({ data: v });
    expect(res.status).toBe(400);
  });
});

describe('R-C PUT: content that PostgreSQL jsonb cannot store is rejected up front (400), not a 500 after the delete', () => {
  it('a NUL character (\\u0000) inside any string, any depth, any key', async () => {
    const app = prodLikeApp();
    for (const data of [{ a: 'x\u0000y' }, { a: { b: [ 'ok', 'z\u0000' ] } }, { ['k\u0000']: 1 }]) {
      const res = await request(app).put(URL).send({ data });
      expect(res.status).toBe(400);
    }
    expect(dbState.insertedValues).toEqual([]);
  });
  it('lone surrogates in a string are rejected or stored safely -- never a 500', async () => {
    const res = await request(prodLikeApp()).put(URL).set('Content-Type', 'application/json').send('{"data":{"a":"\\ud800"}}');
    expect(res.status).toBeLessThan(500);
  });
});

describe('R-C PUT: size cap is in BYTES, so Arabic cannot slip a 2 MB document under a 1 M-character check', () => {
  it('600,000 Arabic characters (~1.2 MB UTF-8) is refused', async () => {
    const res = await request(prodLikeApp()).put(URL).send({ data: { note: 'ع'.repeat(600_000) } });
    expect(res.status).toBe(400);
    expect(String(res.body.error)).toMatch(/too large/i);
  });
  it('a document just under the cap (900,000 ASCII bytes) is accepted', async () => {
    txInsertedRows = [{ id: 1 }];
    const res = await request(prodLikeApp()).put(URL).send({ data: { note: 'x'.repeat(900_000) } });
    expect(res.status).toBe(200);
  });
  it('deeply nested but small documents do not crash the stringify check', async () => {
    let o: any = { leaf: 1 }; for (let i = 0; i < 400; i++) o = { n: o };
    txInsertedRows = [{ id: 1 }];
    const res = await request(prodLikeApp()).put(URL).send({ data: o });
    expect(res.status).toBeLessThan(500);
  });
});

describe('R-C PUT: prototype pollution and script text are inert data', () => {
  it('"__proto__", "constructor" and "prototype" keys are stored as plain data and pollute nothing', async () => {
    txInsertedRows = [{ id: 1 }];
    const raw = '{"data":{"__proto__":{"isAdmin":true},"constructor":{"prototype":{"polluted":1}},"facts":{"__proto__":{"x":1}}}}';
    const res = await request(prodLikeApp()).put(URL).set('Content-Type', 'application/json').send(raw);
    expect(res.status).toBe(200);
    expect(({} as any).isAdmin).toBeUndefined(); expect(({} as any).polluted).toBeUndefined(); expect(({} as any).x).toBeUndefined();
  });
  it('<script> / RTL-override / formula text is stored untouched (output encoding is the UI job) and answered as JSON', async () => {
    const data = { facts: { s1: { note: '<script>alert(1)</script>\u202Eevil =cmd|\' /c calc\'!A1' } } };
    txInsertedRows = [{ id: 1, data }];
    const res = await request(prodLikeApp()).put(URL).send({ data });
    expect(res.status).toBe(200); expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(dbState.insertedValues[0].data).toEqual(data);
  });
});

describe('R-C identity and concurrency', () => {
  it('a body-supplied userId / organizationId can never override the session user', async () => {
    txInsertedRows = [{ id: 1 }];
    await request(prodLikeApp({ userId: 5 })).put(URL).send({ data: {}, userId: 999, organizationId: 999 });
    expect(dbState.insertedValues[0].userId).toBe(5);
    expect(dbState.insertedValues[0].organizationId).not.toBe(999);
  });
  it('a missing / non-numeric session user is refused (401), never treated as user 0 or "undefined"', async () => {
    for (const s of [{}, { userId: 'abc' }, { userId: null }]) {
      const res = await request(prodLikeApp(s)).put(URL).send({ data: {} });
      expect(res.status).toBe(401);
    }
  });
  it('40 concurrent PUTs all answer, none 5xx, and each wrote exactly one row for the session user', async () => {
    txInsertedRows = [{ id: 1 }];
    const app = prodLikeApp({ userId: 3 });
    const rs = await Promise.all(Array.from({ length: 40 }, (_, i) => request(app).put(URL).send({ data: { i } })));
    expect(rs.every((r) => r.status === 200)).toBe(true);
    expect(dbState.insertedValues.length).toBe(40);
    expect(dbState.insertedValues.every((v: any) => v.userId === 3)).toBe(true);
  });
  it('GET never leaks another user: the query is scoped by the session user id', async () => {
    dbState.selectRows = [{ id: 1, userId: 3, data: {} }];
    const res = await request(prodLikeApp({ userId: 3 })).get(URL);
    expect(res.status).toBe(200); expect(dbState.whereArgs.length).toBeGreaterThan(0);
  });
});
