/**
 * Tests for GET and PUT /api/risk-register-items (#866 risk register server store).
 * Mirrors tests/workingCapitalAnalyses.test.ts (whole-state sync in one transaction).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeLoggerMock } from './helpers';

let txInsertedRows: any[] = [];

function chain(rowsGetter: () => any[], recordValues = false) {
  const c: any = {};
  for (const m of ['from', 'orderBy', 'limit', 'offset', 'set', 'returning']) c[m] = () => c;
  c.where = (arg: any) => { dbState.whereArgs.push(arg); return c; };
  c.values = (v: any) => { if (recordValues) dbState.insertedValues.push(v); return c; };
  const exec = (): Promise<any[]> => {
    if (dbState.failNext) { dbState.failNext = false; return Promise.reject(new Error('db failure (test)')); }
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
      if (dbState.failNext) { dbState.failNext = false; throw new Error('db failure (test)'); }
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
  riskRegisterItemsTable: { id: 'id', userId: 'userId', clientKey: 'clientKey', createdAt: 'createdAt' },
  usersTable: { id: 'id', organizationId: 'organizationId' },
}));

vi.mock('../src/lib/logger', () => makeLoggerMock());

import riskRegisterItemsRouter, { isValidRisk, MAX_RISKS } from '../src/routes/riskRegisterItems';

const URL = '/api/risk-register-items';
const VALID = {
  clientKey: 'r1abc', category: 'supply', description: 'Single-source resin supplier', driver: 'Port delay',
  affectedArea: 'Production', likelihood: 4, impact: 5, velocity: 'fast', mitigationAction: 'Qualify a second source',
  owner: 'Head of Procurement', dueDate: '2026-12-31', status: 'open', mitigationStatus: 'not-started',
  residualLikelihood: 2, residualImpact: 3,
};
const app = (user = true) => makeApp(URL, riskRegisterItemsRouter, user ? { userId: 1 } : undefined);

beforeEach(() => { resetDbState(); txInsertedRows = []; });

describe('GET /api/risk-register-items', () => {
  it('401 without a session', async () => {
    const res = await request(app(false)).get(URL);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
  it('returns an empty list when nothing is saved', async () => {
    const res = await request(app()).get(URL);
    expect(res.status).toBe(200);
    expect(res.body.risks).toEqual([]);
  });
  it('returns the register oldest first', async () => {
    dbState.selectRows = [
      { id: 2, clientKey: 'b', createdAt: '2026-08-01T00:00:00.000Z' },
      { id: 1, clientKey: 'a', createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    const res = await request(app()).get(URL);
    expect(res.body.risks.map((r: any) => r.clientKey)).toEqual(['a', 'b']);
  });
  it('500 on a database failure', async () => {
    dbState.failNext = true;
    const res = await request(app()).get(URL);
    expect(res.status).toBe(500);
  });
});

describe('isValidRisk (limits)', () => {
  it('accepts the 1 and 5 edges and rejects 0, 6, decimals and strings', () => {
    expect(isValidRisk({ ...VALID, likelihood: 1, impact: 5, residualLikelihood: 1, residualImpact: 5 })).toBe(true);
    expect(isValidRisk({ ...VALID, likelihood: 0 })).toBe(false);
    expect(isValidRisk({ ...VALID, impact: 6 })).toBe(false);
    expect(isValidRisk({ ...VALID, likelihood: 2.5 })).toBe(false);
    expect(isValidRisk({ ...VALID, residualImpact: '3' })).toBe(false);
    expect(isValidRisk({ ...VALID, residualLikelihood: 0 })).toBe(false);
  });
  it('rejects unknown category, velocity and statuses', () => {
    expect(isValidRisk({ ...VALID, category: 'weather' })).toBe(false);
    expect(isValidRisk({ ...VALID, velocity: 'instant' })).toBe(false);
    expect(isValidRisk({ ...VALID, status: 'done' })).toBe(false);
    expect(isValidRisk({ ...VALID, mitigationStatus: 'finished' })).toBe(false);
  });
  it('rejects a missing or oversized key and an unknown data source', () => {
    expect(isValidRisk({ ...VALID, clientKey: '' })).toBe(false);
    expect(isValidRisk({ ...VALID, clientKey: 'x'.repeat(101) })).toBe(false);
    expect(isValidRisk({ ...VALID, dataSource: 'scraped' })).toBe(false);
    expect(isValidRisk({ ...VALID, dataSource: 'imported-file' })).toBe(true);
  });
});

describe('PUT /api/risk-register-items', () => {
  it('401 without a session', async () => {
    const res = await request(app(false)).put(URL).send({ risks: [] });
    expect(res.status).toBe(401);
  });
  it('400 when risks is not an array', async () => {
    const res = await request(app()).put(URL).send({ risks: 'nope' });
    expect(res.status).toBe(400);
  });
  it('400 on an out-of-range score', async () => {
    const res = await request(app()).put(URL).send({ risks: [{ ...VALID, impact: 9 }] });
    expect(res.status).toBe(400);
  });
  it('400 when over the cap', async () => {
    const many = Array.from({ length: MAX_RISKS + 1 }, (_, i) => ({ ...VALID, clientKey: 'k' + i }));
    const res = await request(app()).put(URL).send({ risks: many });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500/);
  });
  it('400 on a duplicate clientKey', async () => {
    const res = await request(app()).put(URL).send({ risks: [VALID, { ...VALID }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Duplicate/);
  });
  it('replaces the register and returns the stored rows; the score is never stored', async () => {
    dbState.selectRows = [{ organizationId: 7 }];
    txInsertedRows = [{ id: 42, ...VALID, userId: 1, organizationId: 7 }];
    const res = await request(app()).put(URL).send({ risks: [VALID] });
    expect(res.status).toBe(200);
    expect(res.body.risks).toEqual(txInsertedRows);
    const written = dbState.insertedValues.flat()[0];
    expect(written.userId).toBe(1);
    expect(written.organizationId).toBe(7);
    expect(written.dataSource).toBe('manual');
    expect(written).not.toHaveProperty('score');
  });
  it('handles an empty list (delete all, no insert)', async () => {
    dbState.selectRows = [{ organizationId: null }];
    const res = await request(app()).put(URL).send({ risks: [] });
    expect(res.status).toBe(200);
    expect(res.body.risks).toEqual([]);
  });
  it('500 on a database failure in the transaction', async () => {
    dbState.selectRows = [{ organizationId: null }];
    dbState.failNext = true;
    const res = await request(app()).put(URL).send({ risks: [VALID] });
    expect(res.status).toBe(500);
  });
});
