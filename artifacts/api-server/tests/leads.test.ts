import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock } from './helpers';

vi.mock('../src/lib/logger', () => makeLoggerMock());

import leadsRouter from '../src/routes/leads';

const validLead = {
  businessSize: 'SME',
  region: 'Saudi Arabia',
  industry: 'Manufacturing',
  focusArea: 'Procurement',
  challengeText: 'Long supplier lead times',
  reportSummary: 'Summary text',
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/* NOTE: the router keeps an in-memory per-IP rate limit (5/hour) shared across
   this whole file, so the total number of requests below is budgeted to allow
   the final test to trigger the 429. */
describe('POST /api/leads/diagnostic', () => {
  it('forwards a valid lead to the webhook and returns ok', async () => {
    const app = makeApp('/api/leads', leadsRouter);
    const res = await request(app).post('/api/leads/diagnostic').send(validLead); // hit 1
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, opts] = fetchMock.mock.calls[0];
    expect(JSON.parse(opts.body)).toMatchObject({ submissionType: 'diagnostic', ...validLead });
  });

  it('rejects invalid payloads with 400 and does not call the webhook', async () => {
    const app = makeApp('/api/leads', leadsRouter);
    const res = await request(app)
      .post('/api/leads/diagnostic')
      .send({ ...validLead, industry: 'Not A Real Industry' }); // hit 2
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still returns ok when the webhook call throws (best-effort capture)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const app = makeApp('/api/leads', leadsRouter);
    const res = await request(app).post('/api/leads/diagnostic').send(validLead); // hit 3
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('still returns ok when the webhook responds non-OK', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    const app = makeApp('/api/leads', leadsRouter);
    const res = await request(app).post('/api/leads/diagnostic').send(validLead); // hit 4
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('rate-limits after 5 submissions from the same IP', async () => {
    const app = makeApp('/api/leads', leadsRouter);
    const fifth = await request(app).post('/api/leads/diagnostic').send(validLead); // hit 5
    expect(fifth.status).toBe(200);
    const sixth = await request(app).post('/api/leads/diagnostic').send(validLead); // hit 6 → limited
    expect(sixth.status).toBe(429);
    expect(sixth.body.ok).toBe(false);
    // Retry-After header tells the client when the window frees up (seconds).
    const retryAfter = Number(sixth.headers['retry-after']);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(3600);
    expect(sixth.body.retryAfterSeconds).toBe(retryAfter);
  });

  it('gives distinct client IPs independent rate-limit buckets (trust proxy)', async () => {
    const app = makeApp('/api/leads', leadsRouter);
    // The previous test exhausted the shared/default IP bucket. A different
    // client IP (via X-Forwarded-For, honored because trust proxy is set)
    // must NOT be blocked by that bucket.
    const other = await request(app)
      .post('/api/leads/diagnostic')
      .set('X-Forwarded-For', '203.0.113.7')
      .send(validLead);
    expect(other.status).toBe(200);
    expect(other.body).toEqual({ ok: true });

    // And a third distinct IP also gets its own fresh bucket.
    const third = await request(app)
      .post('/api/leads/diagnostic')
      .set('X-Forwarded-For', '198.51.100.9')
      .send(validLead);
    expect(third.status).toBe(200);

    // Meanwhile the original (default) IP is still rate-limited.
    const stillLimited = await request(app).post('/api/leads/diagnostic').send(validLead);
    expect(stillLimited.status).toBe(429);
  });
});
