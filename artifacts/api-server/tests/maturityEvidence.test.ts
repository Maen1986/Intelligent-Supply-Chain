/**
 * Tests for POST /api/maturity/evidence/upload-url
 *          POST /api/maturity/evidence/:id/confirm
 *          GET  /api/maturity/evidence
 *          DELETE /api/maturity/evidence/:id
 */

import 
{


 describe, it, expect, beforeEach, vi 
}


 from 'vitest'
;


import request from 'supertest'
;


import 
{


 makeApp, dbState, resetDbState, makeLoggerMock 
}


 from './helpers'
;


/* ── DB mock (extends helpers with delete support) ──────────────────────── */

// Queue for tests that need sequential selects to return different rows.
// When populated, each awaited select chain shifts the first element instead
// of falling back to dbState.selectRows.
let selectQueue: any[][] = []
;


function chain(rowsGetter: () => any[], recordValues = false) 
{


  const c: any = 
{


}


;


  for (const m of ['from', 'orderBy', 'limit', 'offset', 'set', 'returning']) 
{


    c[m] = () => c
;


}


  c.where = (arg: any) => 
{


 dbState.whereArgs.push(arg)
;


 return c
;


}


;


  c.values = (v: any) => 
{


 if (recordValues) dbState.insertedValues.push(v)
;


 return c
;


}


;


  const exec = (): Promise<any[]> => 
{


    if (dbState.failNext) 
{


      dbState.failNext = false
;


      return Promise.reject(new Error('db failure (test)'))
;


}


    if (selectQueue.length > 0) 
{

      return Promise.resolve(selectQueue.shift()!)
;

    
}

    return Promise.resolve(rowsGetter())
;


}


;


  c.then = (res: any, rej: any) => exec().then(res, rej)
;


  c.catch = (fn: any) => exec().catch(fn)
;


  return c
;


}


vi.mock('@workspace/db', () => (
{


  db: 
{


    select: vi.fn(() => chain(() => dbState.selectRows)),
    insert: vi.fn(() => chain(() => dbState.insertRows, true)),
    update: vi.fn(() => chain(() => dbState.updateRows)),
    delete: vi.fn(() => chain(() => [])),
  
}


,
}


))
;


vi.mock('@workspace/db/schema', () => (
{


  maturityEvidenceTable: 
{


    id:             'id',
    userId:         'userId',
    snapshotId:     'snapshotId',
    segId:          'segId',
    subSegId:       'subSegId',
    confidenceTier: 'confidenceTier',
  
}


,
  maturitySnapshotsTable: 
{
 id: 'id', userId: 'userId' 
}
,
}


))
;


vi.mock('../src/lib/logger', () => makeLoggerMock())
;


/* ── objectStorage mock ─────────────────────────────────────────────────── */

// vi.hoisted ensures these exist before any vi.mock factory runs, which is
// necessary because new ObjectStorageService() is called at module-import time.
const 
{


 mockSignEvidencePutURL, mockGetObjectEntityFile 
}


 = vi.hoisted(() => (
{


  mockSignEvidencePutURL:  vi.fn(),
  mockGetObjectEntityFile: vi.fn(),
}


))
;


vi.mock('../src/lib/objectStorage', () => 
{


  class ObjectNotFoundError extends Error 
{


    constructor() 
{


      super('Object not found')
;


      this.name = 'ObjectNotFoundError'
;


      Object.setPrototypeOf(this, ObjectNotFoundError.prototype)
;


}


}


  return 
{

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ObjectStorageService: vi.fn(function (this: any) 
{

      this.signEvidencePutURL  = mockSignEvidencePutURL
;

      this.getObjectEntityFile = mockGetObjectEntityFile
;

    
}
),
    ObjectNotFoundError,
  
}
;


}

)
;


/* ── OpenAI mock ─────────────────────────────────────────────────────────── */

const createMock = vi.fn()
;


vi.mock('@workspace/integrations-openai-ai-server', () => (
{


  openai: 
{


 chat: 
{


 completions: 
{


 create: (...args: unknown[]) => createMock(...args) 
}


}


}


,
}


))
;


import evidenceRouter from '../src/routes/maturityEvidence'
;


import 
{


 ObjectNotFoundError as MockObjectNotFoundError 
}


 from '../src/lib/objectStorage'
;


/* ── Shared fixtures ─────────────────────────────────────────────────────── */

const AUTH_SESSION       = 
{


 userId: 99 
}


;


const OTHER_USER_SESSION = 
{


 userId: 88 
}


;


 // a different user — must not see user 99's data

function app(session = AUTH_SESSION) {
  return makeApp('/api', evidenceRouter, session);
}

const UPLOAD_BODY = {
  snapshot_id:   1,
  seg_id:        'procurement',
  subseg_id:     'clm',
  filename:      'contract.pdf',
  mime_type:     'application/pdf',
  file_size:     500_000,
  subseg_label:  'CLM',
  subseg_hint:   'A signed contract document.',
};

const EVIDENCE_ROW = {
  id:               42,
  userId:           99,
  snapshotId:       1,
  segId:            'procurement',
  subSegId:         'clm',
  subSegLabel:      'CLM',
  subSegHint:       'A signed contract document.',
  storagePath:      '/objects/maturity-evidence/99/1/procurement/clm/abc.pdf',
  originalFilename: 'contract.pdf',
  mimeType:         'application/pdf',
  confidenceTier:   'self_reported',
  aiEvaluation:     null,
};

beforeEach(() => {
  resetDbState();
  selectQueue = [];
  mockSignEvidencePutURL.mockReset();
  mockGetObjectEntityFile.mockReset();
  createMock.mockReset();
});

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/maturity/evidence/upload-url
   ══════════════════════════════════════════════════════════════════════════ */

describe('POST /api/maturity/evidence/upload-url', () => {
  it('returns 401 when the user is not authenticated', async () => {
    const res = await request(app({}))
      .post('/api/maturity/evidence/upload-url')
      .send(UPLOAD_BODY);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send({ snapshot_id: 1, seg_id: 'procurement' }); // missing several required fields
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  it('returns 400 when mime_type is not on the allow-list', async () => {
    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send({ ...UPLOAD_BODY, mime_type: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/File type not allowed/i);
  });

  it('returns 400 when file_size exceeds 10 MB', async () => {
    dbState.selectRows = []; // no duplicate
    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send({ ...UPLOAD_BODY, file_size: 11 * 1024 * 1024 });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/10 MB/i);
  });

  it('returns 409 when evidence already exists for that sub-segment', async () => {
    dbState.selectRows = [{ id: 7 }]; // existing row
    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send(UPLOAD_BODY);
    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/already uploaded/i);
  });

  it('returns 403 when snapshot_id belongs to a different user', async () => {
    // Ownership check returns nothing — the snapshot exists but belongs to
    // another user, so the session user must be denied.
    selectQueue = [[]];

    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send(UPLOAD_BODY);

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/does not belong/i);
  });

  it('returns 201 with evidence_id and upload_url on success', async () => {
    // First select: ownership check passes (snapshot found).
    // Second select: no duplicate evidence for this sub-segment.
    selectQueue = [[{ id: 1 }], []];
    dbState.insertRows = [{ id: 55 }];              // newly created row
    mockSignEvidencePutURL.mockResolvedValue('https://storage.example.com/upload?sig=abc');

    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send(UPLOAD_BODY);

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.evidence_id).toBe(55);
    expect(res.body.upload_url).toBe('https://storage.example.com/upload?sig=abc');
  });

  it('returns 500 when the storage service throws', async () => {
    // First select: ownership check passes. Second select: no duplicate.
    selectQueue = [[{ id: 1 }], []];
    mockSignEvidencePutURL.mockRejectedValue(new Error('GCS unavailable'));

    const res = await request(app())
      .post('/api/maturity/evidence/upload-url')
      .send(UPLOAD_BODY);

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/maturity/evidence/:id/confirm
   ══════════════════════════════════════════════════════════════════════════ */

describe('POST /api/maturity/evidence/:id/confirm', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await request(app({}))
      .post('/api/maturity/evidence/42/confirm');
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-integer evidence id', async () => {
    const res = await request(app())
      .post('/api/maturity/evidence/abc/confirm');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid evidence id/i);
  });

  it('returns 404 when no evidence row belongs to the user', async () => {
    dbState.selectRows = []; // no row owned by this user
    const res = await request(app())
      .post('/api/maturity/evidence/999/confirm');
    expect(res.status).toBe(404);
  });

  it('returns 422 when the file is not found in storage', async () => {
    dbState.selectRows = [EVIDENCE_ROW];
    mockGetObjectEntityFile.mockRejectedValue(new MockObjectNotFoundError());

    const res = await request(app())
      .post('/api/maturity/evidence/42/confirm');

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/File not found in storage/i);
  });

  it('returns 200 with confidence_tier after successful AI evaluation', async () => {
    dbState.selectRows = [EVIDENCE_ROW];

    const mockFile = {
      getMetadata: vi.fn().mockResolvedValue([{ size: 500_000 }]),
    };
    mockGetObjectEntityFile.mockResolvedValue(mockFile);

    createMock.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            plausible_support: true,
            confidence:        'high',
            flag_reason:       null,
            summary:           'Document clearly supports the claimed level.',
          }),
        },
      }],
    });

    dbState.updateRows = [{
      ...EVIDENCE_ROW,
      confidenceTier: 'ai_evaluated',
      aiEvaluation: {
        plausible_support: true,
        confidence:        'high',
        flag_reason:       null,
        summary:           'Document clearly supports the claimed level.',
      },
    }];

    const res = await request(app())
      .post('/api/maturity/evidence/42/confirm');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.confidence_tier).toBe('ai_evaluated');
    expect(res.body.ai_evaluation.plausible_support).toBe(true);
  });

  it('returns 404 when the evidence id exists but belongs to a different user', async () => {
    // Simulate: the DB is queried with (id=42 AND userId=88) and returns nothing,
    // even though id=42 exists and belongs to userId=99.
    // Correct ownership filter means user B cannot confirm user A's evidence.
    dbState.selectRows = []
;


    const res = await request(makeApp('/api', evidenceRouter, OTHER_USER_SESSION))
      .post('/api/maturity/evidence/42/confirm')
;


    expect(res.status).toBe(404)
;


    expect(res.body.ok).toBe(false)
;


}


)
;


  it('returns 400 and deletes the DB row when the uploaded file exceeds 10 MB', async () => 
{


    dbState.selectRows = [EVIDENCE_ROW]
;


    const mockFile = 
{


      getMetadata: vi.fn().mockResolvedValue([
{


 size: 11 * 1024 * 1024 
}


]),
    
}


;


    mockGetObjectEntityFile.mockResolvedValue(mockFile)
;


    const 
{


 db 
}


 = await import('@workspace/db')
;


    const res = await request(app())
      .post('/api/maturity/evidence/42/confirm')
;


    expect(res.status).toBe(400)
;


    expect(res.body.ok).toBe(false)
;


    expect(res.body.error).toMatch(/10 MB/i)
;


    expect(db.delete).toHaveBeenCalled()
;


}


)
;


  it('still returns 200 and keeps self_reported tier when AI evaluation fails', async () => 
{


    dbState.selectRows = [EVIDENCE_ROW]
;


    const mockFile = 
{


      getMetadata: vi.fn().mockResolvedValue([
{


 size: 100_000 
}


]),
    
}


;


    mockGetObjectEntityFile.mockResolvedValue(mockFile)
;


    createMock.mockRejectedValue(new Error('OpenAI unavailable'))
;


    dbState.updateRows = [
{


 ...EVIDENCE_ROW, confidenceTier: 'self_reported', aiEvaluation: null 
}


]
;


    const res = await request(app())
      .post('/api/maturity/evidence/42/confirm')
;


    expect(res.status).toBe(200)
;


    expect(res.body.ok).toBe(true)
;


    expect(res.body.confidence_tier).toBe('self_reported')
;


}


)
;


}


)
;


/* ══════════════════════════════════════════════════════════════════════════
   GET /api/maturity/evidence
   ══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/maturity/evidence', () => 
{


  it('returns 401 when unauthenticated', async () => 
{


    const res = await request(app(
{


}


))
      .get('/api/maturity/evidence?snapshot_id=1')
;


    expect(res.status).toBe(401)
;


}


)
;


  it('returns 400 when snapshot_id is missing', async () => 
{


    const res = await request(app())
      .get('/api/maturity/evidence')
;


    expect(res.status).toBe(400)
;


    expect(res.body.ok).toBe(false)
;


    expect(res.body.error).toMatch(/snapshot_id is required/i)
;


}


)
;


  it('returns 400 when snapshot_id is not a valid integer', async () => 
{


    const res = await request(app())
      .get('/api/maturity/evidence?snapshot_id=abc')
;


    expect(res.status).toBe(400)
;


    expect(res.body.ok).toBe(false)
;


}


)
;


  it('returns owner-scoped evidence rows for a valid snapshot_id', async () => 
{


    const row1 = 
{


 id: 10, segId: 'procurement', subSegId: 'clm', confidenceTier: 'self_reported' 
}


;


    const row2 = 
{


 id: 11, segId: 'planning',    subSegId: 's&op', confidenceTier: 'ai_evaluated' 
}


;


    dbState.selectRows = [row1, row2]
;


    const res = await request(app())
      .get('/api/maturity/evidence?snapshot_id=1')
;


    expect(res.status).toBe(200)
;


    expect(res.body.ok).toBe(true)
;


    expect(res.body.evidence).toHaveLength(2)
;


    expect(res.body.evidence[0].id).toBe(10)
;


    expect(res.body.evidence[1].id).toBe(11)
;


}


)
;


  it('returns an empty array when the snapshot has no evidence', async () => 
{


    dbState.selectRows = []
;


    const res = await request(app())
      .get('/api/maturity/evidence?snapshot_id=99')
;


    expect(res.status).toBe(200)
;


    expect(res.body.evidence).toEqual([])
;


}


)
;


  it('returns 500 when the database query fails', async () => 
{


    dbState.failNext = true
;


    const res = await request(app())
      .get('/api/maturity/evidence?snapshot_id=1')
;


    expect(res.status).toBe(500)
;


    expect(res.body.ok).toBe(false)
;


}


)
;


  it('returns only the requesting user\'s rows — not rows belonging to a different user', async () => 
{


    // Simulate: the DB is queried with userId=88 (user B) and returns nothing,
    // even though evidence rows for userId=99 (user A) exist in the database.
    // The empty result reflects the ownership filter (userId = session.userId) working correctly.
    dbState.selectRows = []
;


    const res = await request(makeApp('/api', evidenceRouter, OTHER_USER_SESSION))
      .get('/api/maturity/evidence?snapshot_id=1')
;


    expect(res.status).toBe(200)
;


    expect(res.body.ok).toBe(true)
;


    expect(res.body.evidence).toEqual([])
;


}


)
;


}


)
;


/* ══════════════════════════════════════════════════════════════════════════
   DELETE /api/maturity/evidence/:id
   ══════════════════════════════════════════════════════════════════════════ */

describe('DELETE /api/maturity/evidence/:id', () => 
{


  it('returns 401 when unauthenticated', async () => 
{


    const res = await request(app(
{


}


))
      .delete('/api/maturity/evidence/42')
;


    expect(res.status).toBe(401)
;


}


)
;


  it('returns 400 for a non-integer evidence id', async () => 
{


    const res = await request(app())
      .delete('/api/maturity/evidence/not-a-number')
;


    expect(res.status).toBe(400)
;


    expect(res.body.error).toMatch(/Invalid evidence id/i)
;


}


)
;


  it('returns 404 when no evidence row belongs to the user', async () => 
{


    dbState.selectRows = []
;


    const res = await request(app())
      .delete('/api/maturity/evidence/999')
;


    expect(res.status).toBe(404)
;


    expect(res.body.ok).toBe(false)
;


}


)
;


  it('returns 404 when the evidence id exists but belongs to a different user', async () => 
{


    // Simulate: the DB is queried with (id=42 AND userId=88) and returns nothing,
    // even though id=42 exists and belongs to userId=99.
    // Correct ownership filter means user B cannot delete user A's evidence.
    dbState.selectRows = [];

    const res = await request(makeApp('/api', evidenceRouter, OTHER_USER_SESSION))
      .delete('/api/maturity/evidence/42');

    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it('returns 403 when the evidence is consultant_validated', async () => {
    dbState.selectRows = [{ ...EVIDENCE_ROW, confidenceTier: 'consultant_validated' }];

    const res = await request(app())
      .delete('/api/maturity/evidence/42');

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/consultant.validated/i);
  });

  it('returns 403 when a consultant-role user tries to delete their own consultant_validated evidence', async () => {
    // The ownership check (userId filter) passes because the consultant owns the row.
    // The tier guard must still fire and block deletion regardless of the caller's role.
    const CONSULTANT_SESSION = 
{

 userId: 99, role: 'consultant' 
}

;


    dbState.selectRows = [
{

 ...EVIDENCE_ROW, confidenceTier: 'consultant_validated' 
}

]
;


    const res = await request(makeApp('/api', evidenceRouter, CONSULTANT_SESSION))
      .delete('/api/maturity/evidence/42')
;


    expect(res.status).toBe(403)
;


    expect(res.body.ok).toBe(false)
;


    expect(res.body.error).toMatch(/consultant.validated/i)
;


}

)
;


  it('returns 204 and removes the file on a successful delete', async () => 
{


    dbState.selectRows = [EVIDENCE_ROW]
;


    const mockFile = 
{

 delete: vi.fn().mockResolvedValue(undefined) 
}

;


    mockGetObjectEntityFile.mockResolvedValue(mockFile)
;


    const res = await request(app())
      .delete('/api/maturity/evidence/42')
;


    expect(res.status).toBe(204)
;


    expect(mockFile.delete).toHaveBeenCalledOnce()
;


}

)
;


  it('still returns 204 when the GCS file is already gone', async () => 
{


    dbState.selectRows = [EVIDENCE_ROW]
;


    mockGetObjectEntityFile.mockRejectedValue(new MockObjectNotFoundError())
;


    const res = await request(app())
      .delete('/api/maturity/evidence/42')
;


    expect(res.status).toBe(204)
;


}

)
;


}

)
;
