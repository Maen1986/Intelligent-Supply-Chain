/**
 * Tests for POST /api/tco-trend-snapshots and GET /api/tco-trend-snapshots
 * (#168 TCO reporting -- trend history backend, 2026-08-23)
 *
 * Covers:
 *  - 401 when unauthenticated (POST and GET)
 *  - POST 400 on invalid body shapes
 *  - POST successful upsert: stores a server-computed month (ignores any
 *    client-sent month), calls onConflictDoUpdate on the composite unique
 *    key, and returns the saved row
 *  - GET 400 when analysisClientKey query param is missing
 *  - GET returns an empty list when the user has no snapshots for that key
 *  - GET returns snapshots oldest-first
 *  - 500 on a database failure during POST and GET
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

/* ── DB mock -- supports select().from().where().orderBy().limit() and
      insert().values().onConflictDoUpdate({...}).returning(), following the
      same manual-mock pattern intelligence.test.ts uses for onConflictDoUpdate
      (the shared helpers.ts chain() does not cover that method). ────────── */

const dbState = {
  selectRows: [] as any[],
  lastUpsertSet: null as any,
  lastInsertValues: null as any,
  failNext: false,
};

function resetDbState() {
  dbState.selectRows = [];
  dbState.lastUpsertSet = null;
  dbState.lastInsertValues = null;
  dbState.failNext = false;
}

vi.mock('@workspace/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: async () => {
              if (dbState.failNext) { dbState.failNext = false; throw new Error('db failure (test)'); }
              return dbState.selectRows;
            },
          }),
        }),
      }),
    })),
    insert: vi.fn(() => ({
      values: (v: any) => {
        dbState.lastInsertValues = v;
        return {
          onConflictDoUpdate: (opts: { set: any }) => {
            dbState.lastUpsertSet = opts.set;
            return {
              returning: async () => {
                if (dbState.failNext) { dbState.failNext = false; throw new Error('db failure (test)'); }
                return [{ id: 1, userId: 1, ...v }];
              },
            };
          },
        };
      },
    })),
  },
}));

vi.mock('@workspace/db/schema', () => ({
  tcoTrendSnapshotsTable: {
    id: 'id', userId: 'userId', analysisClientKey: 'analysisClientKey', month: 'month',
    analysisName: 'analysisName', itemName: 'itemName', bestSupplierName: 'bestSupplierName',
    bestTcoPerUnit: 'bestTcoPerUnit', bestTcoAnnual: 'bestTcoAnnual', savingsPct: 'savingsPct',
    supplierCount: 'supplierCount', createdAt: 'createdAt',
  },
}));

vi.mock('drizzle-orm', () => ({ and: () => ({}), eq: () => ({}), desc: () => ({}) }));

vi.mock('../src/lib/logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

import tcoTrendSnapshotsRouter from '../src/routes/tcoTrendSnapshots';

const VALID_SNAPSHOT = {
  analysisClientKey: 'tcoa123abc',
  analysisName: 'Bearing supplier comparison',
  itemName: 'Bearing 6205-ZZ',
  bestSupplierName: 'Supplier A',
  bestTcoPerUnit: 142.5,
  bestTcoAnnual: 14250,
  savingsPct: 12.3,
  supplierCount: 3,
};

beforeEach(() => {
  resetDbState();
});

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/tco-trend-snapshots
══════════════════════════════════════════════════════════════════════════ */

describe('POST /api/tco-trend-snapshots', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter);
    const res = await request(app).post('/api/tco-trend-snapshots').send(VALID_SNAPSHOT);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when analysisClientKey is missing', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const { analysisClientKey, ...rest } = VALID_SNAPSHOT;
    const res = await request(app).post('/api/tco-trend-snapshots').send(rest);
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when bestTcoPerUnit is not a finite number', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/tco-trend-snapshots')
      .send({ ...VALID_SNAPSHOT, bestTcoPerUnit: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('ignores any client-sent month and stamps the current server month', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/tco-trend-snapshots')
      .send({ ...VALID_SNAPSHOT, month: '2099-01' }); // attempted tamper
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const expectedMonth = new Date().toISOString().slice(0, 7);
    expect(dbState.lastInsertValues.month).toBe(expectedMonth);
    expect(dbState.lastInsertValues.month).not.toBe('2099-01');
  });

  it('upserts via onConflictDoUpdate and returns the saved row', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 7 });
    const res = await request(app).post('/api/tco-trend-snapshots').send(VALID_SNAPSHOT);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.snapshot.analysisClientKey).toBe('tcoa123abc');
    expect(res.body.snapshot.bestTcoPerUnit).toBe('142.5');
    expect(dbState.lastUpsertSet).toBeTruthy();
    expect(dbState.lastUpsertSet.bestTcoPerUnit).toBe('142.5');
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app).post('/api/tco-trend-snapshots').send(VALID_SNAPSHOT);
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/tco-trend-snapshots
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/tco-trend-snapshots', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter);
    const res = await request(app).get('/api/tco-trend-snapshots?analysisClientKey=tcoa123abc');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when analysisClientKey query param is missing', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app).get('/api/tco-trend-snapshots');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no snapshots for that key', async () => {
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app).get('/api/tco-trend-snapshots?analysisClientKey=tcoa123abc');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.snapshots).toEqual([]);
  });

  it('returns snapshots oldest-first', async () => {
    // Route selects DESC then reverses in JS -- mock returns them already
    // in the DESC order the DB query would produce.
    dbState.selectRows = [
      { id: 2, month: '2026-08', bestTcoPerUnit: '140.00' },
      { id: 1, month: '2026-07', bestTcoPerUnit: '150.00' },
    ];
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app).get('/api/tco-trend-snapshots?analysisClientKey=tcoa123abc');
    expect(res.status).toBe(200);
    expect(res.body.snapshots.map((s: any) => s.month)).toEqual(['2026-07', '2026-08']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/tco-trend-snapshots', tcoTrendSnapshotsRouter, { userId: 1 });
    const res = await request(app).get('/api/tco-trend-snapshots?analysisClientKey=tcoa123abc');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
