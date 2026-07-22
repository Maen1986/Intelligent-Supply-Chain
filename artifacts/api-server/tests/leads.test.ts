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
  });
});
