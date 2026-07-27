/**
 * API tests for GET /api/scorecard-config and PUT /api/scorecard-config
 *
 * Covers:
 *  - 401 when unauthenticated (GET and PUT)
 *  - 400 on invalid body (PUT)
 *  - Successful round-trip: PUT stores data; subsequent GET returns it
 *  - GET returns null when the user has no stored config
 *  - 500 on database failure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import scorecardConfigRouter from '../src/routes/scorecardConfig';

/* ── shared fixture ────────────────────────────────────────────────────── */
const VALID_CONFIG = {
  weights: { delivery: 25, quality: 25, cost: 20, compliance: 15, innovation: 10, relationship: 5 },
  tiers: { strategic: 75, preferred: 55 },
};

beforeEach(resetDbState);

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/scorecard-config
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/scorecard-config', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter);
    const res = await request(app).get('/api/scorecard-config');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  it('returns null when the authenticated user has no stored config', async () => {
    // db.execute returns { rows: [] } by default → row is undefined → config is null
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-config');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.config).toBeNull();
  });

  it('returns the stored config when one exists for the user', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ scorecard_config: VALID_CONFIG }],
    });
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-config');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.config).toMatchObject({
      weights: expect.objectContaining({ delivery: 25, quality: 25 }),
      tiers: { strategic: 75, preferred: 55 },
    });
  });

  it('returns 500 when the database fails', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure'));
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-config');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/scorecard-config
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/scorecard-config', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter);
    const res = await request(app)
      .put('/api/scorecard-config')
      .send(VALID_CONFIG);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when the body is missing the weights object', async () => {
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });

    // No body at all
    const res1 = await request(app).put('/api/scorecard-config').send({});
    expect(res1.status).toBe(400);
    expect(res1.body.ok).toBe(false);

    // weights missing
    const res2 = await request(app)
      .put('/api/scorecard-config')
      .send({ tiers: { strategic: 75, preferred: 55 } });
    expect(res2.status).toBe(400);
    expect(res2.body.ok).toBe(false);

    // tiers missing
    const res3 = await request(app)
      .put('/api/scorecard-config')
      .send({ weights: { delivery: 25 } });
    expect(res3.status).toBe(400);
    expect(res3.body.ok).toBe(false);

    // weights is not an object
    const res4 = await request(app)
      .put('/api/scorecard-config')
      .send({ weights: 'bad', tiers: { strategic: 75, preferred: 55 } });
    expect(res4.status).toBe(400);
    expect(res4.body.ok).toBe(false);
  });

  it('returns 400 for an empty body', async () => {
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app)
      .put('/api/scorecard-config')
      .set('Content-Type', 'application/json')
      .send('');
    expect(res.status).toBe(400);
  });

  it('accepts a valid config and returns ok: true', async () => {
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app)
      .put('/api/scorecard-config')
      .send(VALID_CONFIG);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('stores a config so the subsequent GET returns the same data', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;

    // PUT makes one UPDATE call; GET then makes a SELECT call.
    executeMock
      .mockResolvedValueOnce({ rows: [] })                                       // PUT UPDATE
      .mockResolvedValueOnce({ rows: [{ scorecard_config: VALID_CONFIG }] });    // GET SELECT

    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });

    const put = await request(app).put('/api/scorecard-config').send(VALID_CONFIG);
    expect(put.status).toBe(200);
    expect(put.body.ok).toBe(true);

    const get = await request(app).get('/api/scorecard-config');
    expect(get.status).toBe(200);
    expect(get.body.config).toMatchObject({
      tiers: { strategic: 75, preferred: 55 },
    });
    expect(get.body.config.weights.delivery).toBe(25);
  });

  it('returns 500 when the database fails', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure'));
    const app = makeApp('/api/scorecard-config', scorecardConfigRouter, { userId: 1 });
    const res = await request(app).put('/api/scorecard-config').send(VALID_CONFIG);
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
