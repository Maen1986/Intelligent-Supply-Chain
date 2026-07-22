import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

/* Mock the DB cache so tests never touch the real database. */
const dbState = {
  row: null as { key: string; value: unknown; generatedAt: Date } | null,
  written: [] as unknown[],
};
vi.mock('@workspace/db', () => ({
  appCacheTable: { key: 'key' },
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (dbState.row ? [dbState.row] : []),
        }),
      }),
    }),
    insert: () => ({
      values: (v: { key: string; value: unknown; generatedAt: Date }) => ({
        onConflictDoUpdate: async () => {
          dbState.written.push(v.value);
          dbState.row = v;
        },
      }),
    }),
  },
}));
vi.mock('drizzle-orm', () => ({ eq: () => ({}) }));

/* Helper: put an entry in the mocked cache the way the route stores it. */
function seedCache(value: unknown) {
  const generatedAt = (value as { generatedAt?: string })?.generatedAt;
  dbState.row = { key: 'intelligence', value, generatedAt: generatedAt ? new Date(generatedAt) : new Date(0) };
}

import intelligenceRouter from '../src/routes/intelligence';

const newsItem = {
  category: 'AI & Technology', date: 'July 2026', headline: 'Headline here',
  summary: 'Summary here.', impact: 'High Impact',
  impactColor: 'bg-red-100 text-red-700', iconName: 'Cpu',
};
const toolItem = {
  name: 'Tool', category: 'Sourcing', desc: 'Desc.', bestFor: 'Enterprise',
  badge: 'AI-Native', badgeColor: 'bg-blue-100 text-blue-700',
  rating: 'Gartner Leader 2026', logo: '🤖',
};
const processItem = {
  iconName: 'Cpu', title: 'Process', tag: '2026 Trend',
  tagColor: 'bg-blue-100 text-blue-700', desc: 'Desc.',
  steps: ['a', 'b', 'c', 'd'],
};
const tipItem = {
  number: '01', title: 'Do the thing', body: 'Body.', tag: 'Strategy',
};

const generated = {
  news: Array.from({ length: 6 }, () => ({ ...newsItem })),
  tools: Array.from({ length: 6 }, () => ({ ...toolItem })),
  processes: Array.from({ length: 6 }, () => ({ ...processItem })),
  tips: Array.from({ length: 8 }, (_, i) => ({ ...tipItem, number: String(i + 1).padStart(2, '0') })),
};

const fetchMock = vi.fn();

beforeEach(() => {
  dbState.row = null;
  dbState.written = [];
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
    seedCache({ generatedAt: new Date().toISOString(), ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves stale cache instantly and refreshes in the background', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    seedCache({ generatedAt: eightDaysAgo, ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('STALE');
    // The visitor gets the old cache immediately.
    expect(res.body.generatedAt).toBe(eightDaysAgo);
    // The background refresh regenerates and writes the new cache.
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(dbState.written.length).toBe(1);
    });
  });

  it('keeps the old cache when the background refresh fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    seedCache({ generatedAt: eightDaysAgo, ...generated });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('STALE');
    expect(res.body.generatedAt).toBe(eightDaysAgo);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Failed refresh never overwrote the cache.
    expect(dbState.written.length).toBe(0);
  });

  it('ignores a corrupt cache file and regenerates', async () => {
    seedCache('not json {{{');
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('treats a wrong-shaped but valid-JSON cache as a miss and regenerates', async () => {
    seedCache({
      generatedAt: new Date().toISOString(),
      news: [],
      tools: 'nope',
    });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dbState.written.length).toBe(1);
  });

  it('returns a friendly 502 when the AI call fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
    expect(res.body.error).not.toContain('boom');
  });

  it('rejects malformed AI content (wrong shape) after one retry, without caching it', async () => {
    const malformed = {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ news: [], tools: [], processes: [], tips: [] }) } }] }),
    };
    fetchMock.mockResolvedValueOnce(malformed).mockResolvedValueOnce(malformed);
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dbState.written.length).toBe(0);
  });

  it('retries once on malformed content and serves + caches the good retry result', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json {{{' } }] }),
    });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dbState.written.length).toBe(1);
    expect(res.body.news).toHaveLength(6);
  });

  it('includes a correction hint about zod issues in the retry request body', async () => {
    const bad = { news: [], tools: [], processes: [], tips: [] };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(bad) } }] }),
    });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(secondBody).not.toEqual(firstBody);
    const firstPrompt = firstBody.messages[0].content as string;
    const secondPrompt = secondBody.messages[0].content as string;
    expect(firstPrompt).not.toContain('previous output was rejected');
    expect(secondPrompt).toContain('previous output was rejected');
    expect(secondPrompt).toContain('news');
  });

  it('includes an invalid-JSON correction hint in the retry request body', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json {{{' } }] }),
    });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondPrompt = JSON.parse(fetchMock.mock.calls[1][1].body as string).messages[0].content as string;
    expect(secondPrompt).toContain('previous output was rejected');
    expect(secondPrompt).toContain('not valid JSON');
  });

  it('does not retry when the AI API call itself fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects AI content with missing item fields after one retry, without caching it', async () => {
    const bad = { ...generated, news: generated.news.map(({ headline: _h, ...rest }) => rest) };
    const malformed = {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(bad) } }] }),
    };
    fetchMock.mockResolvedValueOnce(malformed).mockResolvedValueOnce(malformed);
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dbState.written.length).toBe(0);
  });

  it('rejects non-JSON AI content after one retry, without caching it', async () => {
    const malformed = {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json {{{' } }] }),
    };
    fetchMock.mockResolvedValueOnce(malformed).mockResolvedValueOnce(malformed);
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dbState.written.length).toBe(0);
  });

  it('shares a single generation across concurrent cache-miss requests', async () => {
    let resolveFetch!: (v: unknown) => void;
    fetchMock.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );
    const app = makeApp('/api', intelligenceRouter);
    const requests = Promise.all([
      request(app).get('/api/intelligence'),
      request(app).get('/api/intelligence'),
      request(app).get('/api/intelligence'),
    ]);
    // Wait until the (single) AI call is in flight, then let it complete.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    resolveFetch({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify(generated) } }] }),
    });
    const responses = await requests;
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.headers['x-cache']).toBe('MISS');
      expect(res.body.news).toHaveLength(6);
    }
    // Only one AI generation and one cache write for the whole burst.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dbState.written.length).toBe(1);
  });

  it('propagates a shared generation failure to all concurrent miss requests without extra AI calls', async () => {
    let rejectFetch!: (e: unknown) => void;
    fetchMock.mockImplementation(
      () => new Promise((_resolve, reject) => { rejectFetch = reject; }),
    );
    const app = makeApp('/api', intelligenceRouter);
    const requests = Promise.all([
      request(app).get('/api/intelligence'),
      request(app).get('/api/intelligence'),
    ]);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    rejectFetch(new Error('network down'));
    const responses = await requests;
    for (const res of responses) {
      expect(res.status).toBe(502);
      expect(res.body.error).toBeTruthy();
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dbState.written.length).toBe(0);
  });

  it('fails cleanly when AI env vars are not configured', async () => {
    vi.stubEnv('AI_INTEGRATIONS_OPENAI_BASE_URL', '');
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).get('/api/intelligence');
    expect(res.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

const adminSession = { userId: 1, userRole: 'admin' };

describe('POST /api/intelligence/refresh', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const app = makeApp('/api', intelligenceRouter);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects authenticated non-admin callers with 403', async () => {
    const app = makeApp('/api', intelligenceRouter, { userId: 2, userRole: 'user' });
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bypasses a fresh cache and regenerates', async () => {
    seedCache({ generatedAt: new Date().toISOString(), ...generated });
    const app = makeApp('/api', intelligenceRouter, adminSession);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dbState.written.length).toBe(1);
  });

  it('keeps the previous cache when refreshed content is malformed', async () => {
    seedCache({ generatedAt: new Date().toISOString(), ...generated });
    const malformed = {
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ news: [] }) } }] }),
    };
    fetchMock.mockResolvedValueOnce(malformed).mockResolvedValueOnce(malformed);
    const app = makeApp('/api', intelligenceRouter, adminSession);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
    expect(dbState.written.length).toBe(0);
    // Old cache remains untouched and still served
    const getRes = await request(app).get('/api/intelligence');
    expect(getRes.status).toBe(200);
    expect(getRes.headers['x-cache']).toBe('HIT');
  });

  it('returns a friendly error when regeneration fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const app = makeApp('/api', intelligenceRouter, adminSession);
    const res = await request(app).post('/api/intelligence/refresh');
    expect(res.status).toBe(502);
    expect(res.body.error).toBeTruthy();
  });
});
