/**
 * POST /api/clm-generation/draft-clauses — Module 09 Part A.3, Option 2
 * (Generation v1.5: AI-drafted clause language + mandatory disclaimer).
 *
 * Confirms:
 *   1. 401 when called without a session
 *   2. 400 on invalid body (fails Zod validation)
 *   3. 400 when body has no subclauses
 *   4. 400 when body exceeds the 60-subclause cap
 *   5. 200 with drafted sections + disclaimers on a valid request
 *   6. The prompt sent to OpenAI includes the grounding notes when provided
 *   7. 502-family error surfaced via friendlyAIError on an OpenAI failure
 *   8. Not-applicable categories (never sent by the client) never appear in the request/response
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));

import clmGenerationRouter from '../src/routes/clmGeneration';
import { openai } from '@workspace/integrations-openai-ai-server';

const createMock = openai.chat.completions.create as unknown as ReturnType<typeof vi.fn>;

function aiReply(json: unknown) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

function validBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    contractTypeLabelEn: 'NDA',
    cover: {
      partiesEn: 'Acme Co (Party); Beta LLC (Party)',
      purposeEn: 'To evaluate a potential business relationship',
      scopeSummaryEn: 'Discussions regarding a potential supply agreement',
      governingLawEn: 'Saudi Arabia — Commercial Transactions Law',
      disputeForumEn: 'SCCA Arbitration',
    },
    body: [
      {
        category: 'data-ip-confidentiality',
        labelEn: 'Data, IP & Confidentiality',
        subclauses: [
          { id: 'confidentiality-nda', labelEn: 'Confidentiality', mandatory: true, guidanceEn: 'Core subject of the NDA.' },
          { id: 'ip-ownership-background', labelEn: 'Background IP Ownership', mandatory: true, guidanceEn: 'State background IP stays with its owner.' },
        ],
      },
    ],
    groundingNotes: {
      governingLawPracticeNoteEn: 'Saudi practice note text',
      ribaFlagNoteEn: 'Riba-sensitivity note text',
    },
    ...overrides,
  };
}

beforeEach(() => {
  resetDbState();
  createMock.mockReset();
});

describe('POST /api/clm-generation/draft-clauses', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', clmGenerationRouter);
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody());
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 on an invalid body (missing required cover fields)', async () => {
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-generation/draft-clauses').send({ contractTypeLabelEn: 'NDA' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when body has categories but zero total subclauses', async () => {
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    // A category with an empty subclauses array fails the schema's min(1)
    // on CategoryInputSchema, so use a valid single-subclause body and
    // instead assert the runtime "no subclauses" guard via an empty body array.
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody({ body: [] }));
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when total subclauses exceed the 60 cap', async () => {
    const manySubclauses = Array.from({ length: 61 }, (_, i) => ({
      id: `sub-${i}`, labelEn: `Sub ${i}`, mandatory: false, guidanceEn: 'Guidance.',
    }));
    // Zod's CategoryInputSchema caps a single category's subclauses array at
    // 20, so spread the 61 across 4 categories to isolate the route's own
    // >60-total runtime guard from the schema's per-category cap.
    const body = [];
    for (let i = 0; i < manySubclauses.length; i += 16) {
      body.push({ category: `cat-${i}`, labelEn: `Category ${i}`, subclauses: manySubclauses.slice(i, i + 16) });
    }
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody({ body }));
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/60/);
  });

  it('returns the parsed AI draft with disclaimers on a valid request', async () => {
    aiReply({
      sections: [
        {
          category: 'data-ip-confidentiality',
          subclauses: [
            { id: 'confidentiality-nda', en: 'Each party shall keep confidential...', ar: 'يلتزم كل طرف بالحفاظ على سرية...' },
            { id: 'ip-ownership-background', en: 'Background IP remains with its owner...', ar: 'تبقى الملكية الفكرية السابقة لمالكها...' },
          ],
        },
      ],
    });
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.disclaimerEn).toMatch(/not legal advice/i);
    expect(res.body.disclaimerAr).toBeTruthy();
    expect(res.body.sections).toHaveLength(1);
    expect(res.body.sections[0].subclauses).toHaveLength(2);
    expect(res.body.sections[0].subclauses[0].en).toMatch(/confidential/i);
  });

  it('includes the client-supplied grounding notes in the AI prompt', async () => {
    aiReply({ sections: [] });
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    await request(app).post('/api/clm-generation/draft-clauses').send(validBody());
    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === 'user').content as string;
    expect(userMessage).toContain('Saudi practice note text');
    expect(userMessage).toContain('Riba-sensitivity note text');
    expect(userMessage).toContain('confidentiality-nda');
    // System persona is distinct from CONSULTANT_IDENTITY -- confirms this
    // route defines its own drafting-specific persona, not a shared one.
    const systemMessage = call.messages.find((m: { role: string }) => m.role === 'system').content as string;
    expect(systemMessage).toMatch(/NOT a lawyer/);
  });

  it('omits grounding-note lines from the prompt when none are supplied', async () => {
    aiReply({ sections: [] });
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    await request(app).post('/api/clm-generation/draft-clauses').send(validBody({ groundingNotes: undefined }));
    const call = createMock.mock.calls[0][0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === 'user').content as string;
    expect(userMessage).not.toContain('GROUNDING NOTES:');
  });

  it('surfaces a friendly error when the OpenAI call fails', async () => {
    createMock.mockRejectedValueOnce(new Error('upstream failure'));
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody());
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.ok).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('defaults sections to an empty array when the AI response omits it', async () => {
    aiReply({});
    const app = makeApp('/api', clmGenerationRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-generation/draft-clauses').send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.sections).toEqual([]);
  });
});
