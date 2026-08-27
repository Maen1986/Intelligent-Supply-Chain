/**
 * POST /api/clm-review-extraction/extract — Module 09 Part B.3
 * (Review v2: document upload/extraction, T2).
 *
 * Confirms:
 *   1. 401 when called without a session
 *   2. 400 on invalid body (fails Zod validation)
 *   3. 400 on a disallowed MIME type
 *   4. 400 when the decoded file exceeds the 10MB cap
 *   5. 422 when the parser throws (corrupted/unparseable file)
 *   6. 422 when extracted text is empty (e.g. a scanned, image-only PDF)
 *   7. 200 with sanitized extracted fields on a valid PDF request
 *   8. 200 with sanitized extracted fields on a valid DOCX request (mammoth path)
 *   9. AI-returned values not present in the client-sent taxonomy menus are dropped, never trusted as-is
 *   10. truncated: true when extracted text exceeds the char cap
 *   11. 502-family error surfaced via friendlyAIError on an OpenAI failure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));
vi.mock('pdf-parse/lib/pdf-parse.js', () => ({ default: vi.fn() }));
vi.mock('mammoth', () => ({ default: { extractRawText: vi.fn() } }));

import clmReviewExtractionRouter from '../src/routes/clmReviewExtraction';
import { openai } from '@workspace/integrations-openai-ai-server';
import PdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

const createMock = openai.chat.completions.create as unknown as ReturnType<typeof vi.fn>;
const pdfMock = PdfParse as unknown as ReturnType<typeof vi.fn>;
const mammothMock = mammoth.extractRawText as unknown as ReturnType<typeof vi.fn>;

function aiReply(json: unknown) {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(json) } }],
  });
}

const TAXONOMY_MENUS = {
  governingLawTracks: [{ id: 'saudi-ctl', label: 'Saudi CTL' }],
  arbitrationInstitutions: [{ id: 'scca', label: 'SCCA' }],
  pricingTypes: [{ id: 'ffp', label: 'Firm Fixed-Price' }],
  industryBuckets: [{ id: 'supply-goods', label: 'Supply / Goods' }],
  fidicBooks: [{ id: 'red', label: 'Red Book' }],
  subclausesByCategory: {
    'commercial-payment': {
      categoryLabel: 'Commercial / Payment',
      subclauses: [{ id: 'price-consideration', label: 'Price / Consideration' }],
    },
    'data-ip-confidentiality': {
      categoryLabel: 'Data, IP & Confidentiality',
      subclauses: [{ id: 'confidentiality-nda', label: 'Confidentiality' }],
    },
  },
};

function validBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    filename: 'contract.pdf',
    mimeType: 'application/pdf',
    fileBase64: Buffer.from('dummy pdf bytes').toString('base64'),
    taxonomyMenus: TAXONOMY_MENUS,
    ...overrides,
  };
}

beforeEach(() => {
  resetDbState();
  createMock.mockReset();
  pdfMock.mockReset();
  mammothMock.mockReset();
});

describe('POST /api/clm-review-extraction/extract', () => {
  it('returns 401 when called without a session', async () => {
    const app = makeApp('/api', clmReviewExtractionRouter);
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 on an invalid body (missing taxonomyMenus)', async () => {
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send({ filename: 'a.pdf', mimeType: 'application/pdf', fileBase64: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 on a disallowed MIME type', async () => {
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    // application/msword (legacy .doc) is intentionally not in the Zod enum
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody({ mimeType: 'application/msword' }));
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when the decoded file exceeds the 10MB cap', async () => {
    // makeApp() uses express.json() with its default 100kb limit, far below
    // the >10MB payload this test needs to send -- unlike the real app.ts
    // (25mb limit), so body-parser itself would 413 before this route's own
    // byte-length guard ever runs. Build a local app with a larger limit,
    // matching production's actual express.json({ limit: '25mb' }) config,
    // to test this route's OWN application-level cap, not body-parser's.
    const app = express();
    app.use(express.json({ limit: '25mb' }));
    app.use((req: any, _res, next) => { req.session = { userId: 1 }; next(); });
    app.use('/api', clmReviewExtractionRouter);
    const oversized = Buffer.alloc(11 * 1024 * 1024, 'a').toString('base64');
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody({ fileBase64: oversized }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 MB/);
  });

  it('returns 422 when the PDF parser throws', async () => {
    pdfMock.mockRejectedValueOnce(new Error('corrupted PDF'));
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
  });

  it('returns 422 when extracted text is empty (scanned/image-only document)', async () => {
    pdfMock.mockResolvedValueOnce({ text: '   ', numpages: 1 });
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/No extractable text/);
  });

  it('returns sanitized extracted fields on a valid PDF request', async () => {
    pdfMock.mockResolvedValueOnce({ text: 'Governing law: Saudi Arabia. Pricing: Firm Fixed-Price.', numpages: 1 });
    aiReply({
      name: 'Supply Agreement', supplier: 'Acme Co',
      governingLawClause: 'saudi-ctl', pricingPrimary: 'ffp',
      industryBucket: 'supply-goods',
      clausesPresent: { 'commercial-payment': ['price-consideration'] },
      extractionNotesEn: 'Found governing law and pricing.',
    });
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.extractedFields.name).toBe('Supply Agreement');
    expect(res.body.extractedFields.governingLawClause).toBe('saudi-ctl');
    expect(res.body.extractedFields.clausesPresent['commercial-payment']).toEqual(['price-consideration']);
    expect(res.body.disclaimerEn).toMatch(/NOT a verified legal reading/);
    expect(res.body.disclaimerAr).toBeTruthy();
    expect(res.body.truncated).toBe(false);
  });

  it('returns sanitized extracted fields on a valid DOCX request (mammoth path)', async () => {
    mammothMock.mockResolvedValueOnce({ value: 'Supplier: Beta LLC. Dispute forum: SCCA.', messages: [] });
    aiReply({ supplier: 'Beta LLC', arbitrationInstitution: 'scca' });
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody({
      filename: 'contract.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }));
    expect(res.status).toBe(200);
    expect(res.body.extractedFields.supplier).toBe('Beta LLC');
    expect(res.body.extractedFields.arbitrationInstitution).toBe('scca');
    expect(pdfMock).not.toHaveBeenCalled();
  });

  it('drops AI-returned values that are not in the client-sent taxonomy menus', async () => {
    pdfMock.mockResolvedValueOnce({ text: 'Some contract text.', numpages: 1 });
    aiReply({
      governingLawClause: 'made-up-track-id', // not in TAXONOMY_MENUS.governingLawTracks
      pricingPrimary: 'ffp', // valid
      type: 'not-a-real-type', // not in the hardcoded contractType enum
      clausesPresent: { 'commercial-payment': ['price-consideration', 'not-a-real-subclause-id'] },
    });
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.extractedFields.governingLawClause).toBeUndefined();
    expect(res.body.extractedFields.type).toBeUndefined();
    expect(res.body.extractedFields.pricingPrimary).toBe('ffp');
    expect(res.body.extractedFields.clausesPresent['commercial-payment']).toEqual(['price-consideration']);
  });

  it('sets truncated: true when extracted text exceeds the char cap', async () => {
    const longText = 'x'.repeat(30001);
    pdfMock.mockResolvedValueOnce({ text: longText, numpages: 50 });
    aiReply({});
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBe(200);
    expect(res.body.truncated).toBe(true);
    expect(res.body.extractedCharCount).toBe(30001);
  });

  it('surfaces a friendly error when the OpenAI call fails', async () => {
    pdfMock.mockResolvedValueOnce({ text: 'Some contract text.', numpages: 1 });
    createMock.mockRejectedValueOnce(new Error('upstream failure'));
    const app = makeApp('/api', clmReviewExtractionRouter, { userId: 1 });
    const res = await request(app).post('/api/clm-review-extraction/extract').send(validBody());
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.ok).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });
});
