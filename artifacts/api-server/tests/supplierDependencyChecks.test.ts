/**
 * Tests for GET /api/supplier-dependency-checks and
 * PUT /api/supplier-dependency-checks (#378 backend-sync, added 28 Aug 2026).
 *
 * Mirrors tests/rarAnalyses.test.ts's mock patterns exactly (whole-state
 * sync via transaction: delete-all-then-insert, organization_id stamped
 * from the user's current row).
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
  supplierDependencyChecksTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', clientKey: 'clientKey',
    name: 'name', data: 'data', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import supplierDependencyChecksRouter from '../src/routes/supplierDependencyChecks';

const VALID_CHECK = {
  clientKey: 'sdep1735000000-1',
  name: 'Acme Logistics',
  data: {
    id: 'sdep1735000000-1',
    name: 'Acme Logistics',
    hasNamedAlternative: false,
    contractType: 'relationship',
    switchingCostNote: 'Lead time would double',
    volumeConcentrationPct: 80,
    hasRecentStressSignal: true,
    recentStressNote: 'Late delivery last quarter',
  },
};

beforeEach(() => {
  resetDbState();
  txInsertedRows = [];
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/supplier-dependency-checks
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/supplier-dependency-checks', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter);
    const res = await request(app).get('/api/supplier-dependency-checks');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no saved checks', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-dependency-checks');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.checks).toEqual([]);
  });

  it('returns saved checks sorted newest-updated first', async () => {
    dbState.selectRows = [
      { id: 1, clientKey: 'a', name: 'Older Supplier', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, clientKey: 'b', name: 'Newer Supplier', updatedAt: '2026-08-01T00:00:00.000Z' },
    ];
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-dependency-checks');
    expect(res.status).toBe(200);
    expect(res.body.checks.map((c: any) => c.name)).toEqual(['Newer Supplier', 'Older Supplier']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-dependency-checks');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/supplier-dependency-checks
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/supplier-dependency-checks', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter);
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when checks is not an array', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when an entry is missing clientKey', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const bad = { ...VALID_CHECK, clientKey: undefined };
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has non-object data', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const bad = { ...VALID_CHECK, data: 'not-an-object' };
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is an array (not a plain object)', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const bad = { ...VALID_CHECK, data: [1, 2, 3] };
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the array exceeds the 50-check cap', async () => {
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const many = Array.from({ length: 51 }, (_, i) => ({ clientKey: `k${i}`, name: 'n', data: {} }));
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50/);
  });

  it('replaces the user\'s checks and returns the freshly-inserted rows with real ids', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 42, ...VALID_CHECK, userId: 1, organizationId: 7 }];
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [VALID_CHECK] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.checks).toEqual(txInsertedRows);
  });

  it('round-trips the answer fields inside data untouched', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 42, ...VALID_CHECK, userId: 1, organizationId: null }];
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [VALID_CHECK] });
    expect(res.status).toBe(200);
    expect(res.body.checks[0].data.hasNamedAlternative).toBe(false);
    expect(res.body.checks[0].data.contractType).toBe('relationship');
    expect(res.body.checks[0].data.volumeConcentrationPct).toBe(80);
  });

  it('handles an empty checks array (delete-all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [] });
    expect(res.status).toBe(200);
    expect(res.body.checks).toEqual([]);
  });

  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const app = makeApp('/api/supplier-dependency-checks', supplierDependencyChecksRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-dependency-checks').send({ checks: [VALID_CHECK] });
    expect(res.status).toBe(500);
  });
});
