import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import submissionsRouter from '../src/routes/submissions';

beforeEach(resetDbState);

describe('POST /api/submissions', () => {
  it('saves a submission and returns its id', async () => {
    dbState.insertRows = [{ id: 42 }];
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send({
      tool: 'diagnostic',
      contactEmail: 'lead@example.com',
      inputs: { industry: 'FMCG' },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, id: 42 });
  });

  it('fills contact info from the session when omitted', async () => {
    dbState.insertRows = [{ id: 7 }];
    const app = makeApp('/api/submissions', submissionsRouter, {
      userId: 3,
      userEmail: 'session@example.com',
      userFullName: 'Session User',
    });
    const res = await request(app).post('/api/submissions').send({ tool: 'lead' });
    expect(res.status).toBe(200);
    expect(dbState.insertedValues[0]).toMatchObject({
      tool: 'lead',
      userId: 3,
      contactEmail: 'session@example.com',
      contactName: 'Session User',
    });
  });

  it('rejects an unknown tool with 400', async () => {
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send({ tool: 'not_a_tool' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 500 when the database insert fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send({ tool: 'booking' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/submissions', () => {
  const adminSession = { userId: 1, userRole: 'admin' };

  it('rejects unauthenticated requests with 401', async () => {
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users with 403', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(403);
  });

  it('rejects a session with a valid userId but no userRole with 403', async () => {
    // Simulates a cleared/invalidated session where userRole was stripped
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 1 });
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(403);
  });

  it('rejects a session with an unexpected role (moderator) with 403', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 3, userRole: 'moderator' });
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(403);
  });

  it('lists submissions newest first with a total for an admin', async () => {
    dbState.selectRows = [{ id: 2 }, { id: 1 }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.submissions).toHaveLength(2);
  });

  it('returns 500 when the query fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/submissions/by-tool/:tool', () => {
  const adminSession = { userId: 1, userRole: 'admin' };

  it('rejects unauthenticated requests with 401', async () => {
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions/by-tool/lead');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users with 403', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).get('/api/submissions/by-tool/lead');
    expect(res.status).toBe(403);
  });

  it('filters by tool for an admin', async () => {
    dbState.selectRows = [{ id: 5, tool: 'lead' }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/by-tool/lead');
    expect(res.status).toBe(200);
    expect(res.body.submissions[0].tool).toBe('lead');
  });
});

/* ── Briefing PDF storage & re-download ────────────────────────────────────── */

// Object storage mock shared across the tests below.
const storageState = {
  saved: [] as { path: string; bytes: number }[],
  failSave: false,
  fileExists: true,
};

vi.mock('../src/lib/objectStorage', () => {
  class ObjectNotFoundError extends Error {}
  class ObjectStorageService {
    getPrivateObjectDir() { return '/test-bucket/.private'; }
    async getObjectEntityFile(objectPath: string) {
      if (!storageState.fileExists) throw new ObjectNotFoundError();
      return {
        getMetadata: async () => [{ contentType: 'application/pdf', size: 11 }],
        createReadStream: () => {
          const { Readable } = require('stream');
          return Readable.from([Buffer.from('%PDF-1.4 ok')]);
        },
      };
    }
  }
  return {
    ObjectStorageService,
    ObjectNotFoundError,
    objectStorageClient: {
      bucket: () => ({
        file: (name: string) => ({
          save: async (buf: Buffer) => {
            if (storageState.failSave) throw new Error('storage down (test)');
            storageState.saved.push({ path: name, bytes: buf.length });
          },
        }),
      }),
    },
  };
});

describe('POST /api/submissions — command_centre PDF persistence', () => {
  beforeEach(() => {
    storageState.saved = [];
    storageState.failSave = false;
    storageState.fileExists = true;
  });

  it('stores the PDF and records pdfObjectPath/pdfFilename on the row', async () => {
    dbState.insertRows = [{ id: 9 }];
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send({
      tool: 'command_centre',
      pdfBase64: Buffer.from('%PDF fake').toString('base64'),
      pdfFilename: 'briefing.pdf',
    });
    expect(res.status).toBe(200);
    // storage received the decoded bytes, keyed by submission id
    expect(storageState.saved).toHaveLength(1);
    expect(storageState.saved[0].path).toContain('briefings/9.pdf');
    // an update ran to persist the object path
    const { db } = await import('@workspace/db');
    expect((db.update as any)).toHaveBeenCalled();
  });

  it('still succeeds (and still emails) when PDF storage fails', async () => {
    storageState.failSave = true;
    dbState.insertRows = [{ id: 10 }];
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions').send({
      tool: 'command_centre',
      pdfBase64: Buffer.from('x').toString('base64'),
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, id: 10 });
  });
});

describe('GET /api/submissions/:id/briefing-pdf', () => {
  const adminSession = { userId: 1, userRole: 'admin' };

  it('rejects unauthenticated requests with 401', async () => {
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions/1/briefing-pdf');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users with 403', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).get('/api/submissions/1/briefing-pdf');
    expect(res.status).toBe(403);
  });

  it('streams the stored PDF for an admin', async () => {
    dbState.selectRows = [{ id: 1, pdfObjectPath: '/objects/briefings/1.pdf', pdfFilename: 'b.pdf' }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/1/briefing-pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('b.pdf');
    expect(res.body.toString()).toContain('%PDF');
  });

  it('returns 404 when the submission has no stored PDF', async () => {
    dbState.selectRows = [{ id: 1, pdfObjectPath: null }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/1/briefing-pdf');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the submission does not exist', async () => {
    dbState.selectRows = [];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/99/briefing-pdf');
    expect(res.status).toBe(404);
  });

  it('returns 404 when the object is missing from storage', async () => {
    storageState.fileExists = false;
    dbState.selectRows = [{ id: 1, pdfObjectPath: '/objects/briefings/1.pdf' }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/1/briefing-pdf');
    expect(res.status).toBe(404);
  });

  it('rejects a non-numeric id with 400', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).get('/api/submissions/abc/briefing-pdf');
    expect(res.status).toBe(400);
  });
});

/* ── Resend-email auth guard ────────────────────────────────────────────────── */

vi.mock('../src/routes/notify', () => ({
  sendBriefingEmail:    vi.fn(async () => ({ sent: true })),
  sendPasswordResetEmail: vi.fn(async () => ({ sent: true })),
}));

describe('POST /api/submissions/:id/resend-email', () => {
  const adminSession = { userId: 1, userRole: 'admin' };

  it('rejects unauthenticated requests with 401', async () => {
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).post('/api/submissions/1/resend-email');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('rejects non-admin users with 403', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).post('/api/submissions/1/resend-email');
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
  });

  it('returns 404 when the submission does not exist', async () => {
    dbState.selectRows = [];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).post('/api/submissions/99/resend-email');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when the submission is not a command_centre briefing', async () => {
    dbState.selectRows = [{ id: 1, tool: 'diagnostic', emailSentAt: null, pdfObjectPath: null }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).post('/api/submissions/1/resend-email');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 409 when the email was already sent', async () => {
    dbState.selectRows = [{
      id: 1, tool: 'command_centre', emailSentAt: new Date(), pdfObjectPath: null,
      inputs: {}, outputs: {},
    }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).post('/api/submissions/1/resend-email');
    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
  });

  it('rejects a non-numeric id with 400', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, adminSession);
    const res = await request(app).post('/api/submissions/abc/resend-email');
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
