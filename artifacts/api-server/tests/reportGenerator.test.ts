/**
 * Tests for POST /api/report/generate (#168/#170 TCO reporting --
 * wiring the client's saved TCO Engine analyses into the Report Generator
 * prompt, 2026-08-23).
 *
 * Covers:
 *  - 400 when contactInfo.name/company missing
 *  - Backward compatibility: no tcoData -- prompt is unchanged, report still
 *    generates from maturityData alone (or with neither)
 *  - tcoData present -- the TCO analyses appear in the prompt sent to the
 *    AI, grounded with the client's real SAR figures
 *  - tcoData empty array -- treated the same as absent (no TCO section)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));

import reportGeneratorRouter from '../src/routes/reportGenerator';
import { openai } from '@workspace/integrations-openai-ai-server';

const createMock = openai.chat.completions.create as unknown as ReturnType<typeof vi.fn>;

function aiReply(json: unknown) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

const MINIMAL_REPORT = { reportTitle: 'Test Report', executiveSummary: { headline: 'x', body: 'y' } };

const CONTACT_INFO = { name: 'Jane Doe', company: 'Acme Co', industry: 'manufacturing', companySize: '50-200' };

beforeEach(() => {
  resetDbState();
  createMock.mockReset();
});

describe('POST /api/report/generate', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api/report', reportGeneratorRouter);
    const res = await request(app).post('/api/report/generate').send({ tier: 'sme_growth', contactInfo: CONTACT_INFO });
    expect(res.status).toBe(401);
  });

  it('returns 400 when contactInfo.name or company is missing', async () => {
    const app = makeApp('/api/report', reportGeneratorRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/report/generate')
      .send({ tier: 'sme_growth', contactInfo: { name: '', company: '', industry: 'x', companySize: 'y' } });
    expect(res.status).toBe(400);
  });

  it('generates a report with no tcoData and no maturityData (backward-compatible path)', async () => {
    aiReply(MINIMAL_REPORT);
    const app = makeApp('/api/report', reportGeneratorRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/report/generate')
      .send({ tier: 'sme_growth', contactInfo: CONTACT_INFO });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.report).toEqual(MINIMAL_REPORT);

    const userPrompt = createMock.mock.calls[0][0].messages[1].content as string;
    expect(userPrompt).not.toContain('TCO ENGINE ANALYSES ON FILE');
  });

  it('folds tcoData into the prompt with the real SAR figures when provided', async () => {
    aiReply(MINIMAL_REPORT);
    const app = makeApp('/api/report', reportGeneratorRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/report/generate')
      .send({
        tier: 'sme_growth',
        contactInfo: CONTACT_INFO,
        tcoData: [
          {
            name: 'Bearing supplier comparison',
            itemName: 'Bearing 6205-ZZ',
            bestSupplierName: 'Supplier A',
            bestTcoPerUnit: 142.5,
            bestTcoAnnual: 14250,
            savingsPct: 12.3,
            supplierCount: 3,
          },
        ],
      });
    expect(res.status).toBe(200);

    const userPrompt = createMock.mock.calls[0][0].messages[1].content as string;
    expect(userPrompt).toContain('TCO ENGINE ANALYSES ON FILE');
    expect(userPrompt).toContain('Bearing supplier comparison');
    expect(userPrompt).toContain('Bearing 6205-ZZ');
    expect(userPrompt).toContain('Supplier A');
    expect(userPrompt).toContain('142.5');
    expect(userPrompt).toContain('12.3% savings potential');
    expect(userPrompt).toContain('do not invent SAR figures');
  });

  it('treats an empty tcoData array the same as absent -- no TCO section in the prompt', async () => {
    aiReply(MINIMAL_REPORT);
    const app = makeApp('/api/report', reportGeneratorRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/report/generate')
      .send({ tier: 'sme_growth', contactInfo: CONTACT_INFO, tcoData: [] });
    expect(res.status).toBe(200);

    const userPrompt = createMock.mock.calls[0][0].messages[1].content as string;
    expect(userPrompt).not.toContain('TCO ENGINE ANALYSES ON FILE');
  });

  it('returns 500 with a friendly error when the AI call fails', async () => {
    createMock.mockRejectedValueOnce(new Error('boom'));
    const app = makeApp('/api/report', reportGeneratorRouter, { userId: 1 });
    const res = await request(app)
      .post('/api/report/generate')
      .send({ tier: 'sme_growth', contactInfo: CONTACT_INFO });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeTruthy();
  });
});
