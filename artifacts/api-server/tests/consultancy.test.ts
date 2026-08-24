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
    // similarCase defaults to null with no prior submissions (db.execute -> { rows: [] } by default).
    expect(res.body.similarCase).toBeNull();
  });

  it('#176: surfaces a matching prior diagnosis from the SAME user as similarCase', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      rows: [{
        inputs: { challenge: 'Warehouse pick errors rising', industry: 'FMCG', subIndustry: 'Retail' },
        outputs: { challengeSummary: 'Pick-accuracy declining due to WMS mis-slotting' },
        created_at: '2026-07-01T00:00:00Z',
      }],
    });
    aiReply({ challengeSummary: 'Late deliveries', riskAssessment: { level: 'High' } });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({
      industry: 'FMCG',
      subIndustry: 'Retail',
      challenge: 'OTIF is 62% and falling',
    });
    expect(res.status).toBe(200);
    expect(res.body.similarCase).toMatchObject({
      challenge: 'Warehouse pick errors rising',
      challengeSummary: 'Pick-accuracy declining due to WMS mis-slotting',
      industry: 'FMCG',
      subIndustry: 'Retail',
      takenAt: '2026-07-01T00:00:00Z',
    });
  });

  it('#176: a similar-case lookup failure never blocks the diagnosis itself', async () => {
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db down (test)'));
    aiReply({ challengeSummary: 'Late deliveries', riskAssessment: { level: 'High' } });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/diagnose').send({
      industry: 'FMCG',
      challenge: 'OTIF is 62% and falling',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.diagnosis.challengeSummary).toBe('Late deliveries');
    expect(res.body.similarCase).toBeNull();
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

describe('POST /api/consultancy/ask (#191)', () => {
  it('requires industry, challenge, diagnosis, and question', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/ask').send({ industry: 'FMCG' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('rejects a whitespace-only question the same as a missing one', async () => {
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/ask').send({
      industry: 'FMCG', challenge: 'x', diagnosis: { challengeSummary: 'y' }, question: '   ',
    });
    expect(res.status).toBe(400);
  });

  it('returns a profound, framework-grounded answer shaped as answer/frameworkApplied/evidenceSummary/considerAlso', async () => {
    aiReply({
      answer: 'Your OTIF decline traces to a SCOR Source-process reliability gap...',
      frameworkApplied: 'SCOR — Source (Reliability, Responsiveness)',
      evidenceSummary: { dataUsed: ['P1: Carrier capacity mismatch'], assumptions: [], confidence: 82 },
      considerAlso: 'If the 3PL contract renews within 60 days, a renegotiated SLA may resolve this faster than a re-tender.',
    });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/ask').send({
      industry: 'FMCG',
      challenge: 'OTIF is 62% and falling',
      diagnosis: { challengeSummary: 'Late deliveries', problems: [{ id: 'P1', framework: 'SCOR - Source' }] },
      question: 'Why did you rate carrier capacity as the immediate cause instead of demand forecasting?',
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.answer.frameworkApplied).toBe('SCOR — Source (Reliability, Responsiveness)');
    expect(res.body.answer.answer).toContain('SCOR Source-process reliability gap');
    expect(res.body.answer.evidenceSummary.dataUsed).toEqual(['P1: Carrier capacity mismatch']);
    expect(res.body.answer.considerAlso).toContain('renegotiated SLA');
  });

  it('accepts an optional solution and includes it in the AI prompt context', async () => {
    aiReply({ answer: 'x', frameworkApplied: 'CIPS', evidenceSummary: { dataUsed: [], assumptions: [], confidence: 70 }, considerAlso: 'y' });
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/ask').send({
      industry: 'FMCG',
      challenge: 'x',
      diagnosis: { challengeSummary: 'y' },
      solution: { executiveSolution: 'Renegotiate SLA' },
      question: 'Does this apply to our Riyadh warehouse specifically?',
    });
    expect(res.status).toBe(200);
    const promptSent = createMock.mock.calls[0][0].messages[1].content as string;
    expect(promptSent).toContain('SOLUTION PLAN ALREADY GIVEN');
    expect(promptSent).toContain('Renegotiate SLA');
  });

  it('maps AI errors the same friendly way as the other routes', async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }));
    const app = makeApp('/api/consultancy', consultancyRouter, { userId: 1 });
    const res = await request(app).post('/api/consultancy/ask').send({
      industry: 'FMCG', challenge: 'x', diagnosis: { challengeSummary: 'y' }, question: 'Why?',
    });
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
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
