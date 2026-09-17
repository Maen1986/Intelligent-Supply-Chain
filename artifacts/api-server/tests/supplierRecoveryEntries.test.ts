/**
 * Tests for GET /api/supplier-recovery-entries and
 * PUT /api/supplier-recovery-entries (SI Module 07 persistence layer,
 * added 17 Sep 2026, closing the gap disclosed in
 * docs/SI_Module07_PerformanceRecovery_Worked_Example.md Section 7/11).
 *
 * Mirrors tests/supplierDependencyChecks.test.ts's mock patterns exactly
 * (whole-state sync via transaction: delete-all-then-insert,
 * organization_id stamped from the user's current row) -- this route's own
 * `entries` response key (not `checks`) matches
 * /api/local-content-icv-entries' naming, which this route was itself
 * mirrored from.
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
  supplierRecoveryEntriesTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', clientKey: 'clientKey',
    name: 'name', data: 'data', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import supplierRecoveryEntriesRouter from '../src/routes/supplierRecoveryEntries';

const VALID_ENTRY = {
  clientKey: 'sup-1735000000-1',
  name: 'Al-Rawabi Manufacturing',
  data: {
    supplierId: 'sup-1735000000-1',
    name: 'Al-Rawabi Manufacturing',
    category: 'Electro-mechanical',
    quadrant: 'strategic',
    quadrantPriorQuarter: 'strategic',
    scoreHistory12mo: [94, 89, 85, 83, 80, 77, 73, 71, 68, 67, 65, 64],
    cars: [
      { id: 'CAR-101', supplierId: 'sup-1735000000-1', category: 'delivery', scorecardDimension: 'delivery', rootCause: 'late-shipment-root-A', status: 'closed', createdAt: '2025-11-05', closedAt: '2025-12-20' },
    ],
  },
};

beforeEach(() => {
  resetDbState();
  txInsertedRows = [];
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/supplier-recovery-entries
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/supplier-recovery-entries', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter);
    const res = await request(app).get('/api/supplier-recovery-entries');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no saved entries', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-recovery-entries');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.entries).toEqual([]);
  });

  it('returns saved entries sorted newest-updated first', async () => {
    dbState.selectRows = [
      { id: 1, clientKey: 'a', name: 'Older Supplier', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, clientKey: 'b', name: 'Newer Supplier', updatedAt: '2026-08-01T00:00:00.000Z' },
    ];
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-recovery-entries');
    expect(res.status).toBe(200);
    expect(res.body.entries.map((e: any) => e.name)).toEqual(['Newer Supplier', 'Older Supplier']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).get('/api/supplier-recovery-entries');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/supplier-recovery-entries
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/supplier-recovery-entries', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter);
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when entries is not an array', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when an entry is missing clientKey', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const bad = { ...VALID_ENTRY, clientKey: undefined };
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has non-object data', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const bad = { ...VALID_ENTRY, data: 'not-an-object' };
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is an array (not a plain object)', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const bad = { ...VALID_ENTRY, data: [1, 2, 3] };
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the array exceeds the 50-entry cap', async () => {
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const many = Array.from({ length: 51 }, (_, i) => ({ clientKey: `k${i}`, name: 'n', data: {} }));
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/50/);
  });

  it('replaces the user\'s entries and returns the freshly-inserted rows with real ids', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 42, ...VALID_ENTRY, userId: 1, organizationId: 7 }];
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [VALID_ENTRY] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.entries).toEqual(txInsertedRows);
  });

  it('round-trips the supplier record fields inside data untouched', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 42, ...VALID_ENTRY, userId: 1, organizationId: null }];
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [VALID_ENTRY] });
    expect(res.status).toBe(200);
    expect(res.body.entries[0].data.category).toBe('Electro-mechanical');
    expect(res.body.entries[0].data.quadrant).toBe('strategic');
    expect(res.body.entries[0].data.scoreHistory12mo).toEqual([94, 89, 85, 83, 80, 77, 73, 71, 68, 67, 65, 64]);
    expect(res.body.entries[0].data.cars).toHaveLength(1);
    expect(res.body.entries[0].data.cars[0].rootCause).toBe('late-shipment-root-A');
  });

  it('handles an empty entries array (delete-all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [] });
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
  });

  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const app = makeApp('/api/supplier-recovery-entries', supplierRecoveryEntriesRouter, { userId: 1 });
    const res = await request(app).put('/api/supplier-recovery-entries').send({ entries: [VALID_ENTRY] });
    expect(res.status).toBe(500);
  });
});
