/**
 * adminEvidence.test.ts
 *
 * Confirms the backend access-control gate on the evidence review API:
 *   - Unauthenticated requests  → 401
 *   - Non-admin authenticated   → 403
 *   - Admin authenticated       → 200 (passes through to DB)
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

/* ── vi.hoisted: mutable state accessible inside vi.mock factories ─────────── */
const mockDb = vi.hoisted(() => ({
  selectRows: [] as any[],
}));

/* ── Mocks ─────────────────────────────────────────────────────────────────── */

vi.mock('@workspace/db', () => {
  function makeChain(rowsGetter: () => any[]) {
    const c: any = {};
    for (const m of ['from', 'where', 'orderBy', 'limit', 'offset', 'set', 'returning', 'values']) {
      c[m] = () => c;
    }
    const exec = () => Promise.resolve(rowsGetter());
    c.then  = (res: any, rej: any) => exec().then(res, rej);
    c.catch = (fn: any) => exec().catch(fn);
    return c;
  }
  return {
    db: {
      select:  vi.fn(() => makeChain(() => mockDb.selectRows)),
      insert:  vi.fn(() => makeChain(() => [])),
      update:  vi.fn(() => makeChain(() => [])),
      execute: vi.fn(async () => ({ rows: [] })),
    },
  };
});

vi.mock('@workspace/db/schema', () => ({
  maturityEvidenceTable: {
    id: 'id', userId: 'userId', snapshotId: 'snapshotId',
    segId: 'segId', subSegId: 'subSegId', subSegLabel: 'subSegLabel',
    originalFilename: 'originalFilename', mimeType: 'mimeType',
    storagePath: 'storagePath', confidenceTier: 'confidenceTier',
    aiEvaluation: 'aiEvaluation', consultantNotes: 'consultantNotes',
    reviewedBy: 'reviewedBy', reviewedAt: 'reviewedAt', createdAt: 'createdAt',
  },
  usersTable: { id: 'id', role: 'role' },
}));

vi.mock('../src/lib/objectStorage', () => {
  class ObjectNotFoundError extends Error {}
  class ObjectStorageService {}
  return { ObjectStorageService, ObjectNotFoundError };
});

vi.mock('../src/lib/logger', () => makeLoggerMock());

/* ── Router under test ─────────────────────────────────────────────────────── */
import adminEvidenceRouter from '../src/routes/adminEvidence';

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe('GET /api/admin/evidence-review — access control', () => {
  it('returns 401 when the request carries no session (unauthenticated)', async () => {
    // No session fields → userId will be undefined
    const app = makeApp('/api', adminEvidenceRouter, {});
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 403 when the authenticated user has role "user" (non-admin)', async () => {
    const app = makeApp('/api', adminEvidenceRouter, { userId: 42, userRole: 'user' });
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  it('returns 403 when the authenticated user has role "consultant" (non-admin)', async () => {
    const app = makeApp('/api', adminEvidenceRouter, { userId: 99, userRole: 'consultant' });
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  it('returns 200 when the authenticated user is an admin', async () => {
    mockDb.selectRows = [];
    const app = makeApp('/api', adminEvidenceRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.records)).toBe(true);
  });
});
