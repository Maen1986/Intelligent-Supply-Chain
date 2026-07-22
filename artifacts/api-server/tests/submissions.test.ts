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
  it('lists submissions newest first with a total', async () => {
    dbState.selectRows = [{ id: 2 }, { id: 1 }];
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.submissions).toHaveLength(2);
  });

  it('returns 500 when the query fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/submissions/by-tool/:tool', () => {
  it('filters by tool', async () => {
    dbState.selectRows = [{ id: 5, tool: 'lead' }];
    const app = makeApp('/api/submissions', submissionsRouter);
    const res = await request(app).get('/api/submissions/by-tool/lead');
    expect(res.status).toBe(200);
    expect(res.body.submissions[0].tool).toBe('lead');
  });
});
