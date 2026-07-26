/**
 * POST /api/ai/plan — endpoint tests
 *
 * Confirms:
 *   1. 401 when no session and no API key (unauthenticated)
 *   2. 400 when prompt is missing
 *   3. 400 when prompt is empty / whitespace-only
 *   4. 503 when AI environment variables are not configured
 *   5. 200 with { ok: true, text } on a successful OpenAI call
 *   6. 502 when the upstream OpenAI API returns an error
 *   7. Accepts language='ar' and passes it to the system prompt
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeDbMock, makeLoggerMock, resetDbState, dbState } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import aiPlanRouter from '../src/routes/aiPlan';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Build a minimal express app with an authenticated session. */
function makeAuthApp() {
  return makeApp('/', aiPlanRouter, { userId: 1 });
}

/** Build an express app with NO session (unauthenticated). */
function makeAnonApp() {
  return makeApp('/', aiPlanRouter, {});
}

const AI_BASE = 'https://ai.example.com/v1';
const AI_KEY  = 'test-key-abc123';

function setAiEnv() {
  process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'] = AI_BASE;
  process.env['AI_INTEGRATIONS_OPENAI_API_KEY']  = AI_KEY;
}

function clearAiEnv() {
  delete process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  delete process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
}

function stubOpenAiOk(content = '## Plan\n- Action [HIGH]') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content } }],
      }),
    }),
  );
}

function stubOpenAiFail(status = 500, body = 'Internal Server Error') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      text: async () => body,
    }),
  );
}

beforeEach(() => {
  resetDbState();
  clearAiEnv();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearAiEnv();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. Authentication guard
══════════════════════════════════════════════════════════════════════════ */
describe('POST /ai/plan — authentication', () => {
  it('returns 401 when there is no session and no Bearer token', async () => {
    const app = makeAnonApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Generate a plan', language: 'en' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 with an explanatory error field', async () => {
    const app = makeAnonApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'test', language: 'en' });

    expect(res.body.error).toBeTruthy();
  });

  it('proceeds past auth check when a valid session is present', async () => {
    // With AI env vars absent the route returns 503, NOT 401 —
    // confirming the auth guard was passed.
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'test', language: 'en' });

    expect(res.status).not.toBe(401);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. Input validation
══════════════════════════════════════════════════════════════════════════ */
describe('POST /ai/plan — input validation', () => {
  it('returns 400 when prompt field is absent', async () => {
    setAiEnv();
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ language: 'en' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/prompt/i);
  });

  it('returns 400 when prompt is an empty string', async () => {
    setAiEnv();
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: '', language: 'en' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when prompt is whitespace-only', async () => {
    setAiEnv();
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: '   ', language: 'en' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when prompt is a non-string value', async () => {
    setAiEnv();
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 42, language: 'en' });

    expect(res.status).toBe(400);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. AI service not configured
══════════════════════════════════════════════════════════════════════════ */
describe('POST /ai/plan — service configuration', () => {
  it('returns 503 when AI_INTEGRATIONS_OPENAI_BASE_URL is not set', async () => {
    delete process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
    process.env['AI_INTEGRATIONS_OPENAI_API_KEY'] = AI_KEY;
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Valid prompt text', language: 'en' });

    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });

  it('returns 503 when AI_INTEGRATIONS_OPENAI_API_KEY is not set', async () => {
    process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'] = AI_BASE;
    delete process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
    const app = makeAuthApp();
    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Valid prompt text', language: 'en' });

    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. Happy path
══════════════════════════════════════════════════════════════════════════ */
describe('POST /ai/plan — happy path', () => {
  it('returns 200 with { ok: true, text } on a successful OpenAI call', async () => {
    setAiEnv();
    stubOpenAiOk('## Supplier Development Plan\n- Improve OTIF [HIGH]');
    const app = makeAuthApp();

    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Generate a plan for supplier Acme', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.text).toBe('## Supplier Development Plan\n- Improve OTIF [HIGH]');
  });

  it('forwards the exact prompt to the OpenAI API', async () => {
    setAiEnv();
    stubOpenAiOk();
    const app = makeAuthApp();

    await request(app)
      .post('/ai/plan')
      .send({ prompt: 'My specific toolkit prompt', language: 'en' });

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(opts.body as string);
    expect(body.messages[1].content).toBe('My specific toolkit prompt');
  });

  it('uses a GCC Arabic system prompt when language=ar', async () => {
    setAiEnv();
    stubOpenAiOk();
    const app = makeAuthApp();

    await request(app)
      .post('/ai/plan')
      .send({ prompt: 'مطالبة التوليد', language: 'ar' });

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(opts.body as string);
    // System prompt should be in Arabic
    expect(body.messages[0].content).toMatch(/عربية|خليجية/);
  });

  it('defaults to English system prompt when language is not ar', async () => {
    setAiEnv();
    stubOpenAiOk();
    const app = makeAuthApp();

    await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Test prompt', language: 'en' });

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(opts.body as string);
    expect(body.messages[0].content).toMatch(/supply chain|procurement/i);
  });

  it('includes Authorization header in the OpenAI request', async () => {
    setAiEnv();
    stubOpenAiOk();
    const app = makeAuthApp();

    await request(app)
      .post('/ai/plan')
      .send({ prompt: 'prompt', language: 'en' });

    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.headers['Authorization']).toBe(`Bearer ${AI_KEY}`);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. OpenAI upstream errors
══════════════════════════════════════════════════════════════════════════ */
describe('POST /ai/plan — upstream errors', () => {
  it('returns a non-200 status when OpenAI API returns an error', async () => {
    setAiEnv();
    stubOpenAiFail(500, 'Internal Server Error');
    const app = makeAuthApp();

    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Valid prompt', language: 'en' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('does not expose raw OpenAI error details to the client', async () => {
    setAiEnv();
    stubOpenAiFail(500, 'sk-secret-key-leaked-in-error');
    const app = makeAuthApp();

    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Valid prompt', language: 'en' });

    // The raw body must not be passed through
    expect(JSON.stringify(res.body)).not.toContain('sk-secret-key-leaked-in-error');
  });

  it('returns a non-200 status when the fetch call itself rejects', async () => {
    setAiEnv();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
    const app = makeAuthApp();

    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'Valid prompt', language: 'en' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.ok).toBe(false);
  });
});
