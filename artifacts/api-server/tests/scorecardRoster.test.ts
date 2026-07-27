/**
 * API tests for GET /api/scorecard-roster and PUT /api/scorecard-roster
 *
 * Covers:
 *  - 401 when unauthenticated (GET and PUT)
 *  - 400 on invalid body (PUT)
 *  - Successful round-trip: PUT stores data; subsequent GET returns it
 *  - GET returns null when the user has no stored roster
 *  - 500 on database failure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('../src/lib/webhookDispatch', () => ({ dispatchEvent: vi.fn() }));

import scorecardRosterRouter from '../src/routes/scorecardRoster';

/* ── shared fixture ────────────────────────────────────────────────────── */
const VALID_ROSTER = {
  suppliers: [
    {
      id: 'sup-1',
      name: 'Acme Corp',
      tier: 'Strategic',
      subScores: {
        delivery: { otif: '90', lead_time: '85' },
        quality:  { defect: '80' },
      },
    },
  ],
  activeId: 'sup-1',
};

beforeEach(resetDbState);

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/scorecard-roster
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/scorecard-roster', () => {
  it('returns 401 when called without a session', async () => {
    // makeApp with no session object → req.session.userId is undefined
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter);
    const res = await request(app).get('/api/scorecard-roster');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  it('returns null when the authenticated user has no stored roster', async () => {
    // db.execute returns { rows: [] } by default → row is undefined → roster is null
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-roster');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.roster).toBeNull();
  });

  it('returns the stored roster when one exists for the user', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{ scorecard_roster: VALID_ROSTER }],
    });
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-roster');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.roster).toMatchObject({
      activeId: 'sup-1',
      suppliers: expect.arrayContaining([
        expect.objectContaining({ name: 'Acme Corp', tier: 'Strategic' }),
      ]),
    });
  });

  it('returns 500 when the database fails', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure'));
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app).get('/api/scorecard-roster');
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/scorecard-roster
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/scorecard-roster', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter);
    const res = await request(app)
      .put('/api/scorecard-roster')
      .send(VALID_ROSTER);
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when the body is missing the suppliers array', async () => {
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });

    // No body at all
    const res1 = await request(app).put('/api/scorecard-roster').send({});
    expect(res1.status).toBe(400);
    expect(res1.body.ok).toBe(false);

    // Body exists but suppliers is not an array
    const res2 = await request(app)
      .put('/api/scorecard-roster')
      .send({ suppliers: 'not-an-array', activeId: 'x' });
    expect(res2.status).toBe(400);
    expect(res2.body.ok).toBe(false);

    // suppliers key missing entirely
    const res3 = await request(app)
      .put('/api/scorecard-roster')
      .send({ activeId: 'sup-1' });
    expect(res3.status).toBe(400);
    expect(res3.body.ok).toBe(false);
  });

  it('returns 400 for an empty body', async () => {
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app)
      .put('/api/scorecard-roster')
      .set('Content-Type', 'application/json')
      .send('');
    expect(res.status).toBe(400);
  });

  it('accepts a valid roster and returns ok: true', async () => {
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app)
      .put('/api/scorecard-roster')
      .send(VALID_ROSTER);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('accepts a roster with an empty suppliers array', async () => {
    // The route only validates that suppliers is an array — an empty one is valid
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app)
      .put('/api/scorecard-roster')
      .send({ suppliers: [], activeId: '' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('stores a roster so the subsequent GET returns the same data', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;

    // PUT now makes two db.execute calls: SELECT (pre-read) + UPDATE.
    // GET then makes a third SELECT call.
    executeMock
      .mockResolvedValueOnce({ rows: [] })                                     // PUT pre-read SELECT (no prior roster)
      .mockResolvedValueOnce({ rows: [] })                                     // PUT UPDATE
      .mockResolvedValueOnce({ rows: [{ scorecard_roster: VALID_ROSTER }] });  // GET SELECT

    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });

    const put = await request(app).put('/api/scorecard-roster').send(VALID_ROSTER);
    expect(put.status).toBe(200);
    expect(put.body.ok).toBe(true);

    const get = await request(app).get('/api/scorecard-roster');
    expect(get.status).toBe(200);
    expect(get.body.roster).toMatchObject({ activeId: 'sup-1' });
    expect(get.body.roster.suppliers).toHaveLength(1);
    expect(get.body.roster.suppliers[0].name).toBe('Acme Corp');
  });

  it('returns 500 when the database fails', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db failure'));
    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app).put('/api/scorecard-roster').send(VALID_ROSTER);
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
