import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));
vi.mock('../src/routes/notify', () => ({
  sendEscalationEmail: vi.fn(),
  checkEmailConfig: vi.fn(),
  default: {},
}));

// consultancy.ts's /diagnose, /solution, and /refine routes all share the
// module-level leadsRateLimiter (5 requests/hour/IP — see lib/rateLimit.ts).
// This file exercises all three across 8 requests in one run, well past that
// budget, and isn't testing rate-limiting itself (that's covered by
// leads.test.ts against the real limiter), so stub it out here.
vi.mock('../src/lib/rateLimit', () => ({
  leadsRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import consultancyRouter from '../src/routes/consultancy';
import { openai } from '@workspace/integrations-openai-ai-server';
import { sendEscalationEmail } from '../src/routes/notify';

const createMock = openai.chat.completions.create as unknown as ReturnType<typeof vi.fn>;
const escalationMock = sendEscalationEmail as unknown as ReturnType<typeof vi.fn>;

function aiReply(json: unknown) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

beforeEach(() => {
  resetDbState();
  createMock.mockReset();
  escalationMock.mockReset();
  escalationMock.mockResolvedValue(undefined);
});

describe('POST /api/consultancy/diagnose', () => {
  // #364 billing gate (Decision Record 8.5): the whole Consultancy Engine is
  // subscription-only, so every route here requires a session. Checked once
  // at the top of the file's most-used route rather than on all four.
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter);
    const res = await request(app).post('/api/consultancy/diagnose').send({ industry: 'FMCG', challenge: 'Stockouts' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('requires industry and challenge', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({ industry: 'FMCG' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns the parsed AI diagnosis', async () => {
    aiReply({ challengeSummary: 'Late deliveries', riskAssessment: { level: 'High' } });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({
      industry: 'FMCG',
      challenge: 'OTIF is 62% and falling',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.diagnosis.challengeSummary).toBe('Late deliveries');
  });

  it('maps AI rate-limit errors to a friendly 503', async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }));
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({
      industry: 'FMCG',
      challenge: 'x',
    });
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    // Never leak raw SDK error text
    expect(JSON.stringify(res.body)).not.toContain('rate limited');
  });

  it('returns 502 when the AI returns no content', async () => {
    createMock.mockResolvedValueOnce({ choices: [] });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({
      industry: 'FMCG',
      challenge: 'x',
    });
    expect(res.status).toBe(502);
  });
});

describe('POST /api/consultancy/solution', () => {
  it('requires industry, challenge, and diagnosis', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/solution').send({
      industry: 'FMCG',
      challenge: 'x',
    });
    expect(res.status).toBe(400);
  });

  it('returns the parsed AI solution', async () => {
    aiReply({ executiveSolution: 'Fix sourcing', roi: '180%' });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/solution').send({
      industry: 'FMCG',
      challenge: 'x',
      diagnosis: { challengeSummary: 'y' },
    });
    expect(res.status).toBe(200);
    expect(res.body.solution.executiveSolution).toBe('Fix sourcing');
  });
});

describe('POST /api/consultancy/refine', () => {
  it('requires industry, previousSolution, and feedback', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/refine').send({ industry: 'FMCG' });
    expect(res.status).toBe(400);
  });

  it('returns the refined solution', async () => {
    aiReply({ executiveSolution: 'Refined', refinementNote: 'Shortened phase 1' });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/refine').send({
      industry: 'FMCG',
      challenge: 'x',
      previousSolution: { executiveSolution: 'Old' },
      feedback: 'Too slow',
    });
    expect(res.status).toBe(200);
    expect(res.body.solution.refinementNote).toBe('Shortened phase 1');
  });
});

describe('POST /api/consultancy/escalate', () => {
  it('sends the escalation email and persists the case', async () => {
    dbState.insertRows = [{ id: 9 }];
    const app = makeApp('/api/consultancy', consultancyRouter, {
      userId: 5,
      userFullName: 'Sam Lead',
      userEmail: 'sam@corp.com',
    });
    const res = await request(app).post('/api/consultancy/escalate').send({
      industry: 'Retail',
      challenge: 'Stockouts',
      satisfactionScore: 2,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(escalationMock).toHaveBeenCalledOnce();
    expect(escalationMock.mock.calls[0][0]).toMatchObject({
      clientName: 'Sam Lead',
      clientEmail: 'sam@corp.com',
    });
    expect(dbState.insertedValues[0]).toMatchObject({ tool: 'lead', userId: 5 });
  });

  it('returns 500 when the escalation email fails', async () => {
    escalationMock.mockRejectedValueOnce(new Error('smtp down'));
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/escalate').send({
      industry: 'Retail',
      challenge: 'Stockouts',
    });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
