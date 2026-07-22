import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeDbMock, makeLoggerMock, dbState, resetDbState } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import feedbackRouter, { extractTopKeywords } from '../src/routes/feedback';

const adminSession = { userId: 1, userRole: 'admin' };

beforeEach(() => {
  resetDbState();
});

/* NOTE: the in-memory feedback rate limiter (5/hour) is shared across this
   file; POST requests below are budgeted so the last test can hit the 429. */
describe('POST /api/feedback', () => {
  it('persists a valid entry and returns 201', async () => {
    dbState.insertRows = [{ id: 7 }];
    const app = makeApp('/api/feedback', feedbackRouter);
    const res = await request(app)
      .post('/api/feedback')
      .send({ tool: 'diagnostic', rating: 4, nps: 9, comment: 'Great tool', company: 'Acme' }); // hit 1
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, id: 7 });
    expect(dbState.insertedValues[0]).toMatchObject({
      tool: 'diagnostic',
      rating: 4,
      nps: 9,
      comment: 'Great tool',
      company: 'Acme',
      sentiment: null,
      submissionId: null,
    });
  });

  it('rejects invalid payloads with 400', async () => {
    const app = makeApp('/api/feedback', feedbackRouter);
    const bad = await request(app).post('/api/feedback').send({ tool: 'diagnostic', rating: 6 }); // hit 2
    expect(bad.status).toBe(400);
    const missing = await request(app).post('/api/feedback').send({ rating: 3 }); // hit 3
    expect(missing.status).toBe(400);
    expect(dbState.insertedValues.length).toBe(0);
  });

  it('returns 500 when the database insert fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/feedback', feedbackRouter);
    const res = await request(app).post('/api/feedback').send({ tool: 'maturity', rating: 2 }); // hit 4
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  it('rate-limits after 5 submissions from the same IP', async () => {
    dbState.insertRows = [{ id: 8 }];
    const app = makeApp('/api/feedback', feedbackRouter);
    const fifth = await request(app).post('/api/feedback').send({ tool: 'diagnostic', rating: 5 }); // hit 5
    expect(fifth.status).toBe(201);
    const sixth = await request(app).post('/api/feedback').send({ tool: 'diagnostic', rating: 5 }); // hit 6 → limited
    expect(sixth.status).toBe(429);
    expect(sixth.body.ok).toBe(false);
    expect(Number(sixth.headers['retry-after'])).toBeGreaterThan(0);
  });
});

describe('GET /api/feedback', () => {
  it('requires authentication', async () => {
    const app = makeApp('/api/feedback', feedbackRouter);
    const res = await request(app).get('/api/feedback');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin sessions', async () => {
    const app = makeApp('/api/feedback', feedbackRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).get('/api/feedback');
    expect(res.status).toBe(403);
  });

  it('returns rows with pagination metadata for admins', async () => {
    dbState.selectRows = [
      { id: 1, tool: 'diagnostic', rating: 5, createdAt: new Date().toISOString() },
    ];
    const app = makeApp('/api/feedback', feedbackRouter, adminSession);
    const res = await request(app).get('/api/feedback?tool=diagnostic&min_rating=4&page=2&per_page=10');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.feedback.length).toBe(1);
    expect(res.body.page).toBe(2);
    expect(res.body.perPage).toBe(10);
  });
});

describe('GET /api/feedback/analytics', () => {
  it('requires admin', async () => {
    const app = makeApp('/api/feedback', feedbackRouter);
    const res = await request(app).get('/api/feedback/analytics');
    expect(res.status).toBe(401);
  });

  it('aggregates rating, NPS, per-tool and keyword stats', async () => {
    const now = new Date();
    dbState.selectRows = [
      { tool: 'diagnostic', rating: 5, nps: 10, comment: 'Excellent supplier insights', createdAt: now },
      { tool: 'diagnostic', rating: 4, nps: 8,  comment: 'Useful supplier report',      createdAt: now },
      { tool: 'maturity',   rating: 2, nps: 3,  comment: null,                           createdAt: now },
    ];
    const app = makeApp('/api/feedback', feedbackRouter, adminSession);
    const res = await request(app).get('/api/feedback/analytics');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.averageRating).toBeCloseTo(3.67, 2);
    expect(res.body.npsBreakdown).toEqual({ promoters: 1, passives: 1, detractors: 1 });
    expect(res.body.byTool).toEqual([
      { tool: 'diagnostic', count: 2, averageRating: 4.5 },
      { tool: 'maturity',   count: 1, averageRating: 2 },
    ]);
    expect(res.body.weeklyTrend).toHaveLength(8);
    expect(res.body.weeklyTrend[7].count).toBe(3); // all rows fall in the current week
    const words = res.body.topKeywords.map((k: { word: string }) => k.word);
    expect(words).toContain('supplier');
    expect(res.body.topKeywords.find((k: { word: string }) => k.word === 'supplier').count).toBe(2);
  });

  it('handles an empty table', async () => {
    const app = makeApp('/api/feedback', feedbackRouter, adminSession);
    const res = await request(app).get('/api/feedback/analytics');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.averageRating).toBeNull();
    expect(res.body.topKeywords).toEqual([]);
  });
});

describe('extractTopKeywords', () => {
  it('drops stop-words, short tokens, and ranks by frequency', () => {
    const out = extractTopKeywords([
      'The report was great and the report was fast',
      'Great insights',
    ]);
    // 'great' and 'report' both occur twice; ties sort alphabetically.
    expect(out.slice(0, 2)).toEqual([
      { word: 'great', count: 2 },
      { word: 'report', count: 2 },
    ]);
    expect(out.map((k) => k.word)).toContain('great');
    expect(out.map((k) => k.word)).not.toContain('the');
    expect(out.map((k) => k.word)).not.toContain('was');
  });

  it('caps the list at the limit', () => {
    const comments = Array.from({ length: 30 }, (_, i) => `keyword${i} keyword${i}`);
    expect(extractTopKeywords(comments).length).toBe(20);
  });
});
