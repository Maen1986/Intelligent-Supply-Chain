import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

const createMock = vi.fn();
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: { chat: { completions: { create: (...args: unknown[]) => createMock(...args) } } },
}));

import assessmentRouter from '../src/routes/assessment';

const validInput = {
  industry: 'Manufacturing',
  subIndustry: 'FMCG',
  revenueBand: 'SAR 100M–500M',
  painPoints: ['High procurement cost', 'Poor OTIF'],
  kpiRatings: { OTIF: 2, 'Inventory Turns': 3 },
  maturityRatings: { Procurement: 2, Planning: 3 },
  subDimensionRatings: { 'Procurement > CLM System & Automation': 1 },
  language: 'en',
};

const briefing = {
  executiveSummary: 'Summary.',
  maturityLevel: 'Developing',
  maturityScore: 42,
};

beforeEach(() => {
  createMock.mockReset();
});

describe('POST /api/assessment', () => {
  it('returns a generated briefing on success', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(briefing) } }],
    });
    const app = makeApp('/api', assessmentRouter);
    const res = await request(app).post('/api/assessment').send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.briefing).toEqual(briefing);
    expect(typeof res.body.generatedAt).toBe('string');
    expect(createMock).toHaveBeenCalledTimes(1);
    // Prompt should include the sub-dimension detail driving gap analysis
    const call = createMock.mock.calls[0][0] as { messages: { content: string }[] };
    expect(call.messages[1].content).toContain('CLM System & Automation');
  });

  it('rejects requests missing required fields with 400', async () => {
    const app = makeApp('/api', assessmentRouter);
    const res = await request(app).post('/api/assessment').send({ industry: 'Manufacturing' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('maps AI rate-limit errors to a friendly 503', async () => {
    createMock.mockRejectedValue(Object.assign(new Error('rate limited'), { status: 429 }));
    const app = makeApp('/api', assessmentRouter);
    const res = await request(app).post('/api/assessment').send(validInput);
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/busy/i);
  });

  it('maps unknown AI failures to a friendly 502 without leaking details', async () => {
    createMock.mockRejectedValue(new Error('secret internal detail'));
    const app = makeApp('/api', assessmentRouter);
    const res = await request(app).post('/api/assessment').send(validInput);
    expect(res.status).toBe(502);
    expect(res.body.error).not.toContain('secret internal detail');
  });

  it('returns 502 when the AI returns no content', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: null } }] });
    const app = makeApp('/api', assessmentRouter);
    const res = await request(app).post('/api/assessment').send(validInput);
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
  });
});
