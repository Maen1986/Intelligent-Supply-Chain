/**
 * maturityEvidence.test.ts
 *
 * 6-step live API verification of the evidence & confidence tier system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

/* ── vi.hoisted: mutable store accessible in vi.mock factories ────────────── */
const mockDb = vi.hoisted(() => ({
  selectRows: [] as any[],
  insertRows: [] as any[],
  updateRows: [] as any[],
  failNext:   false,
}));

/* ── @workspace/db mock ──────────────────────────────────────────────────── */
vi.mock('@workspace/db', () => {
  function makeChain(rowsGetter: () => any[]) {
    const c: any = {};
    for (const m of ['from', 'where', 'orderBy', 'limit', 'offset', 'set', 'returning', 'values']) {
      c[m] = () => c;
    }
    const exec = (): Promise<any[]> => {
      if (mockDb.failNext) { mockDb.failNext = false; return Promise.reject(new Error('db failure')); }
      return Promise.resolve(rowsGetter());
    };
    c.then  = (res: any, rej: any) => exec().then(res, rej);
    c.catch = (fn: any) => exec().catch(fn);
    return c;
  }
  return {
    db: {
      select:  vi.fn(() => makeChain(() => mockDb.selectRows)),
      insert:  vi.fn(() => makeChain(() => mockDb.insertRows)),
      update:  vi.fn(() => makeChain(() => mockDb.updateRows)),
      delete:  vi.fn(() => makeChain(() => [])),
      execute: vi.fn(async () => ({ rows: [] })),
    },
  };
});

/* ── @workspace/db/schema mock ───────────────────────────────────────────── */
vi.mock('@workspace/db/schema', () => ({
  maturityEvidenceTable:  { id: 'id', userId: 'userId', snapshotId: 'snapshotId',
                            segId: 'segId', subSegId: 'subSegId', confidenceTier: 'confidenceTier' },
  maturitySnapshotsTable: { id: 'id', userId: 'userId' },
  usersTable:             { id: 'id', role: 'role' },
}));

/* ── objectStorage mock ──────────────────────────────────────────────────── */
vi.mock('../src/lib/objectStorage', () => {
  class ObjectNotFoundError extends Error { constructor(msg?: string) { super(msg ?? 'Not found'); } }
  class ObjectStorageService {
    signEvidencePutURL()  { return Promise.resolve('https://storage.example.com/signed-put-url'); }
    getObjectEntityFile() {
      return Promise.resolve({
        download: () => Promise.resolve([Buffer.from('fake-content')]),
        exists:   () => Promise.resolve([true]),
        delete:   () => Promise.resolve(undefined),
      });
    }
    downloadObject() {
      const buf = Buffer.from('fake-pdf-content');
      return Promise.resolve({
        headers: { get: (h: string) => h === 'Content-Type' ? 'application/pdf' : null },
        arrayBuffer: () => Promise.resolve(buf.buffer),
      });
    }
    deleteObjectEntity() { return Promise.resolve(undefined); }
  }
  return { ObjectStorageService, ObjectNotFoundError };
});

/* ── OpenAI mock ─────────────────────────────────────────────────────────── */
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '{"plausible_support":true,"confidence":"high","flag_reason":null,"summary":"Document clearly evidences the claimed maturity level."}',
            },
          }],
        }),
      },
    },
    audio: { speech: { create: vi.fn() } },
  },
}));

/* ── Logger mock ─────────────────────────────────────────────────────────── */
vi.mock('../src/lib/logger', () => makeLoggerMock());

/* ── aiConfig mock ───────────────────────────────────────────────────────── */
vi.mock('../src/lib/aiConfig', () => ({
  OPENAI_MODEL:    'gpt-4o',
  friendlyAIError: (e: unknown) => ({ message: String(e), status: 500 }),
}));

/* ── drizzle-orm mock ────────────────────────────────────────────────────── */
vi.mock('drizzle-orm', () => ({
  eq:      vi.fn((_f: any, _v: any) => ({})),
  and:     vi.fn((..._a: any[]) => ({})),
  inArray: vi.fn((_f: any, _v: any[]) => ({})),
}));

// ── Route imports (after all mocks are registered) ──────────────────────────
import maturityEvidenceRouter from '../src/routes/maturityEvidence';
import adminEvidenceRouter    from '../src/routes/adminEvidence';

/* ── Fixtures ────────────────────────────────────────────────────────────── */
const USER_SESSION  = { userId: 1, userRole: 'user'  };
const ADMIN_SESSION = { userId: 2, userRole: 'admin' };

const PENDING_EVIDENCE_ROW = {
  id:              1,
  userId:          1,
  snapshotId:      42,
  segId:           'esg',
  subSegId:        'esg-env-baseline',
  subSegLabel:     'Environmental Performance Baseline',
  subSegHint:      'Upload your most recent environmental performance report.',
  storagePath:     '/objects/maturity-evidence/1/42/esg/esg-env-baseline/uuid.pdf',
  originalFilename:'env-report.pdf',
  mimeType:        'application/pdf',
  confidenceTier:  'self_reported',
  aiEvaluation:    null,
  consultantNotes: null,
  reviewedBy:      null,
  reviewedAt:      null,
  createdAt:       new Date().toISOString(),
};

const EVALUATED_EVIDENCE_ROW = {
  ...PENDING_EVIDENCE_ROW,
  confidenceTier: 'ai_evaluated',
  aiEvaluation:   {
    plausible_support: true,
    confidence:        'high',
    flag_reason:       null,
    summary:           'Document clearly evidences the claimed maturity level.',
  },
};

function resetMockDb() {
  mockDb.selectRows = [];
  mockDb.insertRows = [];
  mockDb.updateRows = [];
  mockDb.failNext   = false;
}

/* ════════════════════════════════════════════════════════════════════════════
   Step 1 — POST /api/maturity/evidence/upload-url
═══════════════════════════════════════════════════════════════════════════ */
describe('POST /api/maturity/evidence/upload-url', () => {
  beforeEach(resetMockDb);

  it('issues a presigned PUT URL and creates a pending DB row (201)', async () => {
    mockDb.selectRows = [];
    mockDb.insertRows = [PENDING_EVIDENCE_ROW];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .post('/api/maturity/evidence/upload-url')
      .send({
        snapshot_id:  42,
        seg_id:       'esg',
        subseg_id:    'esg-env-baseline',
        filename:     'env-report.pdf',
        mime_type:    'application/pdf',
        file_size:    512000,
        subseg_label: 'Environmental Performance Baseline',
        subseg_hint:  'Upload your most recent environmental performance report.',
      });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.evidence_id).toBeDefined();
    expect(res.body.upload_url).toContain('signed-put-url');
  });

  it('returns 401 when unauthenticated', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, {});
    const res = await request(app)
      .post('/api/maturity/evidence/upload-url')
      .send({ snapshot_id: 42, seg_id: 'esg', subseg_id: 'esg-env-baseline',
              filename: 'f.pdf', mime_type: 'application/pdf', file_size: 1000 });
    expect(res.status).toBe(401);
  });

  it('returns 400 for a disallowed MIME type', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .post('/api/maturity/evidence/upload-url')
      .send({ snapshot_id: 42, seg_id: 'esg', subseg_id: 'esg-env-baseline',
              filename: 'f.exe', mime_type: 'application/x-msdownload', file_size: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not allowed/i);
  });

  it('returns 400 when file_size exceeds 10 MB', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .post('/api/maturity/evidence/upload-url')
      .send({ snapshot_id: 42, seg_id: 'esg', subseg_id: 'esg-env-baseline',
              filename: 'big.pdf', mime_type: 'application/pdf',
              file_size: 11 * 1024 * 1024 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 mb/i);
  });

  it('returns 409 when a file already exists for this subsegment', async () => {
    mockDb.selectRows = [PENDING_EVIDENCE_ROW];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .post('/api/maturity/evidence/upload-url')
      .send({ snapshot_id: 42, seg_id: 'esg', subseg_id: 'esg-env-baseline',
              filename: 'f2.pdf', mime_type: 'application/pdf', file_size: 1000 });
    expect(res.status).toBe(409);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 2 — POST /api/maturity/evidence/:id/confirm
═══════════════════════════════════════════════════════════════════════════ */
describe('POST /api/maturity/evidence/:id/confirm', () => {
  beforeEach(() => {
    resetMockDb();
    mockDb.selectRows = [PENDING_EVIDENCE_ROW];
    mockDb.updateRows = [EVALUATED_EVIDENCE_ROW];
  });

  it('evaluates the document and returns ai_evaluated tier (200)', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).post('/api/maturity/evidence/1/confirm');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('ai_evaluated');
  });

  it('returns 404 when evidence not found', async () => {
    mockDb.selectRows = [];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).post('/api/maturity/evidence/999/confirm');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id (0)', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).post('/api/maturity/evidence/0/confirm');
    expect(res.status).toBe(400);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 3 — GET /api/maturity/evidence?snapshot_id=X
═══════════════════════════════════════════════════════════════════════════ */
describe('GET /api/maturity/evidence', () => {
  beforeEach(() => {
    resetMockDb();
    mockDb.selectRows = [EVALUATED_EVIDENCE_ROW];
  });

  it('returns an array of evidence records for the snapshot (200)', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).get('/api/maturity/evidence?snapshot_id=42');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.evidence)).toBe(true);
    expect(res.body.evidence.length).toBe(1);
  });

  it('returns 400 when snapshot_id is missing', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).get('/api/maturity/evidence');
    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const app = makeApp('/api', maturityEvidenceRouter, {});
    const res = await request(app).get('/api/maturity/evidence?snapshot_id=42');
    expect(res.status).toBe(401);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 4 — DELETE /api/maturity/evidence/:id
═══════════════════════════════════════════════════════════════════════════ */
describe('DELETE /api/maturity/evidence/:id', () => {
  beforeEach(resetMockDb);

  it('deletes an ai_evaluated record and returns 204', async () => {
    mockDb.selectRows = [EVALUATED_EVIDENCE_ROW];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).delete('/api/maturity/evidence/1');
    expect(res.status).toBe(204);
  });

  it('returns 403 when evidence is consultant_validated', async () => {
    mockDb.selectRows = [{ ...EVALUATED_EVIDENCE_ROW, confidenceTier: 'consultant_validated' }];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).delete('/api/maturity/evidence/1');
    expect(res.status).toBe(403);
  });

  it('returns 404 when evidence is not found', async () => {
    mockDb.selectRows = [];
    const app = makeApp('/api', maturityEvidenceRouter, USER_SESSION);
    const res = await request(app).delete('/api/maturity/evidence/1');
    expect(res.status).toBe(404);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 5 — GET /api/admin/evidence-review
═══════════════════════════════════════════════════════════════════════════ */
describe('GET /api/admin/evidence-review', () => {
  beforeEach(() => {
    resetMockDb();
    mockDb.selectRows = [EVALUATED_EVIDENCE_ROW];
  });

  it('returns all evidence records for admin (200)', async () => {
    const app = makeApp('/api', adminEvidenceRouter, ADMIN_SESSION);
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.records)).toBe(true);
  });

  it('returns 403 for non-admin users', async () => {
    const app = makeApp('/api', adminEvidenceRouter, USER_SESSION);
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(403);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const app = makeApp('/api', adminEvidenceRouter, {});
    const res = await request(app).get('/api/admin/evidence-review');
    expect(res.status).toBe(401);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 6 — PATCH /api/admin/evidence-review/:id
═══════════════════════════════════════════════════════════════════════════ */
describe('PATCH /api/admin/evidence-review/:id', () => {
  beforeEach(() => {
    resetMockDb();
    mockDb.updateRows = [{
      ...EVALUATED_EVIDENCE_ROW,
      id: 1,
      confidenceTier: 'consultant_validated',
      reviewedBy: 2,
      reviewedAt: new Date().toISOString(),
    }];
  });

  it('sets confidence_tier to consultant_validated on validate action (200)', async () => {
    const app = makeApp('/api', adminEvidenceRouter, ADMIN_SESSION);
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'validate', consultant_notes: 'Reviewed and approved.' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('consultant_validated');
  });

  it('reverts to self_reported on reject action (200)', async () => {
    mockDb.updateRows = [{
      ...EVALUATED_EVIDENCE_ROW,
      id: 1,
      confidenceTier: 'self_reported',
      reviewedBy: 2,
      reviewedAt: new Date().toISOString(),
    }];
    const app = makeApp('/api', adminEvidenceRouter, ADMIN_SESSION);
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'reject', consultant_notes: 'Document is too generic.' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('self_reported');
  });

  it('returns 400 for an unknown action', async () => {
    const app = makeApp('/api', adminEvidenceRouter, ADMIN_SESSION);
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'unknown' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for non-admin users', async () => {
    const app = makeApp('/api', adminEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .patch('/api/admin/evidence-review/1')
      .send({ action: 'validate' });
    expect(res.status).toBe(403);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Step 7 — GET /api/storage/objects/:seg/:ownerId/... (storage proxy auth)
═══════════════════════════════════════════════════════════════════════════ */
describe('GET /api/storage/objects/* (storage proxy)', () => {
  // Path format: /storage/objects/maturity-evidence/{ownerId}/{snapshotId}/{segId}/{subSegId}/{file}
  const EVIDENCE_PROXY_PATH = '/api/storage/objects/maturity-evidence/1/42/esg/esg-env-baseline/uuid.pdf';

  beforeEach(resetMockDb);

  it('returns 401 for unauthenticated requests', async () => {
    const app = makeApp('/api', adminEvidenceRouter, {});
    const res = await request(app).get(EVIDENCE_PROXY_PATH);
    expect(res.status).toBe(401);
  });

  it('returns 404 when a user tries to access another user\'s evidence file', async () => {
    // USER_SESSION has userId=1; path has ownerId=99
    const app = makeApp('/api', adminEvidenceRouter, { userId: 2, userRole: 'user' });
    const res = await request(app)
      .get('/api/storage/objects/maturity-evidence/1/42/esg/esg-env-baseline/uuid.pdf');
    expect(res.status).toBe(404);
  });

  it('returns 200 for the evidence owner accessing their own file', async () => {
    const app = makeApp('/api', adminEvidenceRouter, USER_SESSION); // userId=1 matches ownerId=1
    const res = await request(app).get(EVIDENCE_PROXY_PATH);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });

  it('returns 200 for an admin accessing any evidence file', async () => {
    const app = makeApp('/api', adminEvidenceRouter, ADMIN_SESSION); // admin can access ownerId=1
    const res = await request(app).get(EVIDENCE_PROXY_PATH);
    expect(res.status).toBe(200);
  });

  it('returns 403 for a non-admin user on a non-maturity-evidence path', async () => {
    const app = makeApp('/api', adminEvidenceRouter, USER_SESSION);
    const res = await request(app)
      .get('/api/storage/objects/other-bucket/1/42/seg/subseg/file.pdf');
    expect(res.status).toBe(403);
  });
});
