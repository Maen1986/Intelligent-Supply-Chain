/**
 * Integration tests: platform-wide data isolation
 *
 * Verifies a two-user scenario at the HTTP level:
 *  - User A creates a conversation and a submission
 *  - User B cannot list, read, or delete User A's resources
 *  - User B receives 404 (not 403) on ownership mismatch — prevents existence leakage
 *  - Unauthenticated callers receive 401 on all protected endpoints
 *  - Admin session retains full visibility of all submissions
 *
 * ── Conversations ──────────────────────────────────────────────────────────
 *  C1  GET  /conversations          — User B gets empty list
 *  C2  GET  /conversations/:id      — User B gets 404 for User A's id
 *  C3  DELETE /conversations/:id    — User B gets 404 for User A's id
 *  C4  GET  /conversations/:id/messages — User B gets 404
 *  C5  POST /conversations/:id/messages — User B gets 404 (before SSE opens)
 *  C6  GET  /conversations          — User A sees their own conversation
 *  C7  POST /conversations          — requires auth; 401 without session
 *  C8  GET  /conversations          — 401 without session
 *
 * ── Submissions ────────────────────────────────────────────────────────────
 *  S1  GET  /mine              — User B gets empty list (no User A rows)
 *  S2  GET  /mine/:id          — User B gets 404 for User A's submission
 *  S3  GET  /mine/:id          — 401 without session
 *  S4  GET  /mine/:id          — 400 for non-integer id
 *  S5  GET  /mine/:id          — User A can read their own submission
 *  S6  GET  /                  — Admin sees all submissions including User A's
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

// Mock the OpenAI integration so importing the openai router doesn't fail
vi.mock('@workspace/integrations-openai-ai-server', () => ({
  openai: {
    chat:  { completions: { create: vi.fn(async () => ({ choices: [] })) } },
    audio: { speech: { create: vi.fn() } },
  },
}));

// Mock aiConfig — the openai router imports this
vi.mock('../src/lib/aiConfig', () => ({
  OPENAI_MODEL:     'gpt-4o',
  OPENAI_TTS_MODEL: 'tts-1',
  friendlyAIError:  (e: unknown) => ({ message: String(e), status: 500 }),
}));

// Mock objectStorage so the submissions router doesn't crash
vi.mock('../src/lib/objectStorage', () => {
  class ObjectNotFoundError extends Error {}
  class ObjectStorageService {
    getPrivateObjectDir() { return '/test-bucket/.private'; }
    async getObjectEntityFile() { throw new ObjectNotFoundError(); }
  }
  return { ObjectStorageService, ObjectNotFoundError, objectStorageClient: { bucket: vi.fn() } };
});

vi.mock('../src/routes/notify', () => ({
  sendBriefingEmail: vi.fn(async () => ({ sent: true })),
}));

// Import routers after mocks are registered
import openaiRouter   from '../src/routes/openai/index';
import submissionsRouter from '../src/routes/submissions';

/* ── Fixtures ────────────────────────────────────────────────────────────── */

const userA     = { userId: 1, userRole: 'user' };
const userB     = { userId: 2, userRole: 'user' };
const adminSess = { userId: 99, userRole: 'admin' };

// A conversation row that belongs to User A
const convA = {
  id:        1,
  title:     'User A chat',
  userId:    1,
  createdAt: new Date().toISOString(),
  messages:  [],
};

// A submission row that belongs to User A
const subA = {
  id:        42,
  tool:      'maturity',
  userId:    1,
  inputs:    { industry: 'retail' },
  outputs:   {},
  createdAt: new Date().toISOString(),
};

beforeEach(resetDbState);

/* ══════════════════════════════════════════════════════════════════════════
   Conversation isolation
══════════════════════════════════════════════════════════════════════════ */

describe('C1 — Conversation list: User B sees only their own conversations', () => {
  it('returns an empty array when User B has no conversations', async () => {
    // DB returns nothing — simulates WHERE user_id = 2 matched no rows
    dbState.selectRows = [];
    const app = makeApp('/openai', openaiRouter, userB);
    const res = await request(app).get('/openai/conversations');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app).get('/openai/conversations');
    expect(res.status).toBe(401);
  });
});

describe('C2 — Conversation fetch: User B gets 404 for User A conversation', () => {
  it('returns 404 (not 403) when ownership check fails', async () => {
    // DB returns nothing — simulates WHERE id=1 AND user_id=2 matched no rows
    dbState.selectRows = [];
    const app = makeApp('/openai', openaiRouter, userB);
    const res = await request(app).get('/openai/conversations/1');
    expect(res.status).toBe(404);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app).get('/openai/conversations/1');
    expect(res.status).toBe(401);
  });
});

describe('C3 — Conversation delete: User B gets 404 for User A conversation', () => {
  it('returns 404 (not 403) on ownership mismatch', async () => {
    dbState.selectRows = [];
    const app = makeApp('/openai', openaiRouter, userB);
    const res = await request(app).delete('/openai/conversations/1');
    expect(res.status).toBe(404);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app).delete('/openai/conversations/1');
    expect(res.status).toBe(401);
  });

  // Note: db.delete is not in the shared mock, so we only test the isolation
  // (ownership mismatch → 404) and auth (no session → 401) paths here.
  // The success path (204) would require a db.delete mock extension.
});

describe('C4 — Message list: User B gets 404 for User A conversation', () => {
  it('returns 404 (not 403) on ownership mismatch', async () => {
    dbState.selectRows = [];
    const app = makeApp('/openai', openaiRouter, userB);
    const res = await request(app).get('/openai/conversations/1/messages');
    expect(res.status).toBe(404);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app).get('/openai/conversations/1/messages');
    expect(res.status).toBe(401);
  });
});

describe('C5 — Message send (SSE): User B gets 404 before stream opens', () => {
  it('returns 404 when conversation does not belong to User B', async () => {
    dbState.selectRows = [];
    const app = makeApp('/openai', openaiRouter, userB);
    const res = await request(app)
      .post('/openai/conversations/1/messages')
      .send({ content: 'Hello' });
    expect(res.status).toBe(404);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app)
      .post('/openai/conversations/1/messages')
      .send({ content: 'Hello' });
    expect(res.status).toBe(401);
  });
});

describe('C6 — User A can read their own conversation', () => {
  it('returns the conversation when ownership matches', async () => {
    // First call (ownership check) returns convA; second call (messages) returns []
    dbState.selectRows = [convA];
    const app = makeApp('/openai', openaiRouter, userA);
    const res = await request(app).get('/openai/conversations/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('User A chat');
  });
});

describe('C7 — Conversation create: requires auth', () => {
  it('returns 401 without a session', async () => {
    const app = makeApp('/openai', openaiRouter, {});
    const res = await request(app)
      .post('/openai/conversations')
      .send({ title: 'My chat' });
    expect(res.status).toBe(401);
  });

  it('creates a conversation for authenticated User A and stores userId', async () => {
    dbState.insertRows = [{ id: 10, title: 'My chat', userId: 1, createdAt: new Date().toISOString() }];
    const app = makeApp('/openai', openaiRouter, userA);
    const res = await request(app)
      .post('/openai/conversations')
      .send({ title: 'My chat' });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(1);
    // Confirm userId was in the inserted values
    expect(dbState.insertedValues[0]?.userId).toBe(1);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Submission isolation
══════════════════════════════════════════════════════════════════════════ */

describe('S1 — Submission list: User B sees only their own submissions', () => {
  it("returns an empty list when User B has no submissions", async () => {
    dbState.selectRows = [];
    const app = makeApp('/api/submissions', submissionsRouter, userB);
    const res = await request(app).get('/api/submissions/mine');
    expect(res.status).toBe(200);
    expect(res.body.submissions).toHaveLength(0);
  });

  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, {});
    const res = await request(app).get('/api/submissions/mine');
    expect(res.status).toBe(401);
  });
});

describe('S2 — Single submission fetch: User B gets 404 for User A submission', () => {
  it('returns 404 (not 403) on ownership mismatch', async () => {
    // DB returns nothing — simulates WHERE id=42 AND user_id=2 matched no rows
    dbState.selectRows = [];
    const app = makeApp('/api/submissions', submissionsRouter, userB);
    const res = await request(app).get('/api/submissions/mine/42');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});

describe('S3 — Single submission fetch: auth guard', () => {
  it('returns 401 for an unauthenticated caller', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, {});
    const res = await request(app).get('/api/submissions/mine/42');
    expect(res.status).toBe(401);
  });
});

describe('S4 — Single submission fetch: invalid id', () => {
  it('returns 400 when the id is not a positive integer', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, userA);
    const res = await request(app).get('/api/submissions/mine/abc');
    expect(res.status).toBe(400);
  });

  it('returns 400 for id = 0', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, userA);
    const res = await request(app).get('/api/submissions/mine/0');
    expect(res.status).toBe(400);
  });
});

describe('S5 — Single submission fetch: User A can read their own submission', () => {
  it('returns the submission when id and userId match', async () => {
    dbState.selectRows = [subA];
    const app = makeApp('/api/submissions', submissionsRouter, userA);
    const res = await request(app).get('/api/submissions/mine/42');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.submission.id).toBe(42);
    expect(res.body.submission.tool).toBe('maturity');
  });

  it('returns 404 when the submission exists but belongs to User B (User A requests it)', async () => {
    // Simulates WHERE id=99 AND user_id=1 matched nothing (sub belongs to User B)
    dbState.selectRows = [];
    const app = makeApp('/api/submissions', submissionsRouter, userA);
    const res = await request(app).get('/api/submissions/mine/99');
    expect(res.status).toBe(404);
  });
});

describe('S6 — Admin retains full visibility of all submissions', () => {
  it('admin GET /api/submissions includes User A submission', async () => {
    dbState.selectRows = [subA, { id: 43, tool: 'lead', userId: 2, createdAt: new Date().toISOString() }];
    const app = makeApp('/api/submissions', submissionsRouter, adminSess);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.submissions.some((s: { id: number }) => s.id === 42)).toBe(true);
  });

  it('non-admin User B cannot access admin submission list', async () => {
    const app = makeApp('/api/submissions', submissionsRouter, userB);
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(403);
  });
});
