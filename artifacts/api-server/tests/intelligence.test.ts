import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

/* Mock the fs cache so tests never touch the real cache directory. */
const fsState = {
  fileExists: false,
  fileContent: '',
  written: [] as string[],
};
vi.mock('fs', () => ({
  existsSync: () => fsState.fileExists,
  readFileSync: () => fsState.fileContent,
  writeFileSync: (_path: string, data: string) => { fsState.written.push(data); },
  mkdirSync: () => undefined,
}));

import intelligenceRouter from '../src/routes/intelligence';

const generated = {
  news: [], tools: [], processes: [], tips: [],
};

const fetchMock = vi.fn();

beforeEach(() => {
  fsState.fileExists = false;
  fsState.fileContent = '';
  fsState.written = [];
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(generated) } }] }),
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('AI_INTEGRATIONS_OPENAI_BASE_URL', 'https://ai.example.test/v1');
  vi.stubEnv('AI_INTEGRATIONS_OPENAI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('GET /api/intelligence', () => {
  it('serves fresh cached content without calling the AI', async () => {
    fsState.fileExists = true;
    fsState.fileContent = JSON.stringify({ generatedAt: new Date().toISOString(), ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('regenerates when the cache is stale and writes the new cache', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    fsState.fileExists = true;
    fsState.fileContent = JSON.stringify({ generatedAt: eightDaysAgo, ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fsState.written.length).toBe(1);
    expect(res.body.generatedAt).toBeTruthy();
  });

  it('ignores a corrupt cache file and regenerates', async () => {
    fsState.fileExists = true;
    fsState.fileContent = 'not json {{{';
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('returns a friendly 502 when the AI call fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error).not.toContain('boom');
  });

  it('fails cleanly when AI env vars are not configured', async () => {
    vi.stubEnv('AI_INTEGRATIONS_OPENAI_BASE_URL', '');
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/intelligence/refresh', () => {
  it('bypasses a fresh cache and regenerates', async () => {
    fsState.fileExists = true;
    fsState.fileContent = JSON.stringify({ generatedAt: new Date().toISOString(), ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fsState.written.length).toBe(1);
  });

  it('returns a friendly error when regeneration fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
  });
});
