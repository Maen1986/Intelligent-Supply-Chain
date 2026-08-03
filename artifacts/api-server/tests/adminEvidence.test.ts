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
      update:  vi.fn(() => makeChain(() => mockDb.selectRows)), // returning() yields selectRows
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

/* ══════════════════════════════════════════════════════════════════════════
   Task 871 — PATCH /api/admin/evidence-review/:id: consultant validation
   still succeeds after the re-confirm guard was added to POST /:id/confirm.
   The re-confirm guard only affects the user-facing confirm endpoint; the
   admin validation route is a separate code path and must remain functional.
══════════════════════════════════════════════════════════════════════════ */

describe('PATCH /api/admin/evidence-review/:id — consultant validation (Task 871)', () => {
  const EVIDENCE_ROW = {
    id: 1, userId: 10, snapshotId: 'snap-1',
    segId: 'strategy', subSegId: 'ss-1', subSegLabel: 'Strategy doc',
    originalFilename: 'strategy.pdf', mimeType: 'application/pdf',
    storagePath: 'tenant-1/evidence/ev-1', confidenceTier: 'ai_evaluated',
    aiEvaluation: null, consultantNotes: null,
    reviewedBy: null, reviewedAt: null, createdAt: new Date().toISOString(),
  };

  it('returns 200 and confidence_tier=consultant_validated when action=validate', async () => {
    // The update chain must return the updated row
    mockDb.selectRows = [{ ...EVIDENCE_ROW, confidenceTier: 'consultant_validated' }];
    const app = makeApp('/api', adminEvidenceRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'validate' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('consultant_validated');
  });

  it('returns 200 and confidence_tier=self_reported when action=reject', async () => {
    mockDb.selectRows = [{ ...EVIDENCE_ROW, confidenceTier: 'self_reported' }];
    const app = makeApp('/api', adminEvidenceRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'reject' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('self_reported');
  });

  it('returns 401 when unauthenticated', async () => {
    const app = makeApp('/api', adminEvidenceRouter, {});
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'validate' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when the requesting user is not an admin', async () => {
    const app = makeApp('/api', adminEvidenceRouter, { userId: 10, userRole: 'user' });
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'validate' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when action is not "validate" or "reject"', async () => {
    const app = makeApp('/api', adminEvidenceRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'approve' }); // invalid action
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
