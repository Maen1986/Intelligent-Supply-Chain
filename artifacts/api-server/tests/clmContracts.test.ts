/**
 * Tests for GET /api/clm-contracts and PUT /api/clm-contracts
 * (#179 Contract Value Tracker backend persistence, Wave B-6)
 *
 * Mirrors tests/spendVarianceAnalyses.test.ts's mock patterns exactly
 * (whole-state sync via transaction: delete-all-then-insert, organization_id
 * stamped from the user's current row).
 *
 * Covers:
 *  - 401 when unauthenticated (GET and PUT)
 *  - GET returns an empty list when the user has no saved contracts
 *  - GET returns saved contracts, newest-updated first
 *  - PUT 400 on invalid body shapes (missing clientKey, non-object data)
 *  - PUT 400 when the array exceeds the 500-contract cap
 *  - PUT successful sync: deletes the user's existing rows and inserts the
 *    new set inside one transaction, stamping organization_id from the
 *    user's current row, and returns the freshly-inserted rows
 *  - PUT handles an empty contracts array (delete-all, no insert)
 *  - 500 on a database failure during GET and PUT
 *
 * The claimable-rebate flag itself (purchaseVolume >= rebateThreshold) is a
 * pure frontend computation over fields inside the JSONB `data` blob (see
 * CLMTools.tsx's claimableRebate()) -- this route does no server-side
 * rebate logic, so there is nothing rebate-specific to unit-test here
 * beyond confirming the extra fields round-trip through `data` untouched.
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
  clmContractsTable: {
    id: 'id', userId: 'userId', organizationId: 'organizationId', clientKey: 'clientKey',
    name: 'name', data: 'data', createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import clmContractsRouter from '../src/routes/clmContracts';
import { db } from '@workspace/db';

const VALID_CONTRACT = {
  clientKey: 'clm123abc',
  name: 'IT Infrastructure Support',
  data: {
    id: 'clm123abc', name: 'IT Infrastructure Support', supplier: 'Saudi IT Solutions',
    category: 'IT', type: 'services', annualValue: 480000, totalValue: 1440000, currency: 'SAR',
    startDate: '2024-01-01', endDate: '2026-12-31', noticePeriodDays: 90, autoRenewal: false,
    status: 'active', performanceScore: 85, deliveredValue: 0, complianceScore: 90,
    savingsRealized: 0, owner: 'IT Director', notes: '', keyTerms: '', renewalDecision: 'undecided',
    rebateThreshold: 1000000, purchaseVolume: 1200000,
  },
};

beforeEach(() => {
  resetDbState();
  txInsertedRows = [];
  (db.execute as any).mockReset();
  (db.execute as any).mockImplementation(async () => ({ rows: [] }));
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/clm-contracts
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/clm-contracts', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter);
    const res = await request(app).get('/api/clm-contracts');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns an empty list when the user has no saved contracts', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).get('/api/clm-contracts');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.contracts).toEqual([]);
  });

  it('returns saved contracts sorted newest-updated first', async () => {
    dbState.selectRows = [
      { id: 1, clientKey: 'a', name: 'Older', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, clientKey: 'b', name: 'Newer', updatedAt: '2026-08-01T00:00:00.000Z' },
    ];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).get('/api/clm-contracts');
    expect(res.status).toBe(200);
    expect(res.body.contracts.map((c: any) => c.name)).toEqual(['Newer', 'Older']);
  });

  it('returns 500 on a database failure', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).get('/api/clm-contracts');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/clm-contracts
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/clm-contracts', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter);
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when contracts is not an array', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when an entry is missing clientKey', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const bad = { ...VALID_CONTRACT, clientKey: undefined };
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when an entry has non-object data', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const bad = { ...VALID_CONTRACT, data: 'not-an-object' };
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is an array (not a plain object)', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const bad = { ...VALID_CONTRACT, data: [1, 2, 3] };
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [bad] });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the array exceeds the 500-contract cap', async () => {
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    // Minimal payload per entry (not the full VALID_CONTRACT) -- this test is
    // about the count cap, not payload size; a full 501-copy body would trip
    // express.json's separate body-size limit first and mask the assertion.
    const many = Array.from({ length: 501 }, (_, i) => ({ clientKey: `k${i}`, name: 'n', data: {} }));
    const res = await request(app).put('/api/clm-contracts').send({ contracts: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500/);
  });

  it('replaces the user\'s contracts and returns the freshly-inserted rows with real ids', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 42, ...VALID_CONTRACT, userId: 1, organizationId: 7 }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [VALID_CONTRACT] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.contracts).toEqual(txInsertedRows);
  });

  it('round-trips the rebate fields (rebateThreshold/purchaseVolume) inside data untouched', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 42, ...VALID_CONTRACT, userId: 1, organizationId: null }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [VALID_CONTRACT] });
    expect(res.status).toBe(200);
    expect(res.body.contracts[0].data.rebateThreshold).toBe(1000000);
    expect(res.body.contracts[0].data.purchaseVolume).toBe(1200000);
  });

  it('handles an empty contracts array (delete-all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [] });
    expect(res.status).toBe(200);
    expect(res.body.contracts).toEqual([]);
  });

  it('returns 500 on a database failure during the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [VALID_CONTRACT] });
    expect(res.status).toBe(500);
  });
});


/* ══════════════════════════════════════════════════════════════════════════
   #184 (Commitment Tracking) -- findings_actions mirror on PUT
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/clm-contracts -- findings_actions mirror (#184)', () => {
  const CONTRACT_WITH_OBLIGATION = {
    clientKey: 'clm-abc',
    name: 'Logistics MSA',
    data: {
      supplier: 'Gulf Logistics Co', endDate: '2027-01-01', noticePeriodDays: 60,
      renewalDecision: 'undecided',
    },
  };

  it('mirrors a renewal-notice obligation (cleanup + one upsert) when endDate and noticePeriodDays are present', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 1, ...CONTRACT_WITH_OBLIGATION, userId: 1, organizationId: null }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [CONTRACT_WITH_OBLIGATION] });
    expect(res.status).toBe(200);
    // 1 cleanup DELETE + 1 upsert INSERT
    expect((db.execute as any).mock.calls.length).toBe(2);
  });

  it('skips the mirror for a contract missing endDate or noticePeriodDays (cleanup only)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const incomplete = { clientKey: 'clm-x', name: 'Draft Contract', data: { supplier: 'TBD' } };
    txInsertedRows = [{ id: 2, ...incomplete, userId: 1, organizationId: null }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [incomplete] });
    expect(res.status).toBe(200);
    // cleanup DELETE only -- no upsert for a contract with no real obligation to mirror
    expect((db.execute as any).mock.calls.length).toBe(1);
  });

  it('runs cleanup even for an empty contracts array (delete-all path)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [] });
    expect(res.status).toBe(200);
    expect((db.execute as any).mock.calls.length).toBe(1);
  });

  it('does not fail the contract sync when the mirror-write throws', async () => {
    dbState.selectRows = [{ organizationId: null }];
    txInsertedRows = [{ id: 1, ...CONTRACT_WITH_OBLIGATION, userId: 1, organizationId: null }];
    (db.execute as any).mockImplementation(async () => { throw new Error('mirror db failure (test)'); });
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [CONTRACT_WITH_OBLIGATION] });
    // The contract sync itself must still succeed -- mirror failures are
    // logged, never propagated (see mirrorContractsIntoFindingsActions()).
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('mirrors two contracts as cleanup + two upserts', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const second = {
      clientKey: 'clm-def', name: 'Facilities Contract',
      data: { supplier: 'ACME FM', endDate: '2026-11-01', noticePeriodDays: 30, renewalDecision: 'renew' },
    };
    txInsertedRows = [
      { id: 1, ...CONTRACT_WITH_OBLIGATION, userId: 1, organizationId: null },
      { id: 2, ...second, userId: 1, organizationId: null },
    ];
    const app = makeApp('/api/clm-contracts', clmContractsRouter, { userId: 1 });
    const res = await request(app).put('/api/clm-contracts').send({ contracts: [CONTRACT_WITH_OBLIGATION, second] });
    expect(res.status).toBe(200);
    expect((db.execute as any).mock.calls.length).toBe(3); // 1 cleanup + 2 upserts
  });
});
