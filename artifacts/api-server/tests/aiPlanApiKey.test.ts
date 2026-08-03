/**
 * POST /api/ai/plan — API key (Bearer token) authentication & rate-limit tests
 *
 * Goes through the REAL aiPlanRouter → requireApiKeyOrSession chain so that a
 * regression in middleware ordering or userId propagation will break these tests.
 *
 * aiPlanRateLimiter is replaced with a minimal in-process rate limiter (limit=3)
 * using a synchronous vi.mock factory (avoids async-import deadlocks in Vitest).
 * The replacement mirrors the production keyGenerator: keyed by
 * res.locals.userId written by requireApiKeyOrSession — that is the critical
 * property under test.
 *
 * Confirms:
 *   1. Bearer-authenticated requests up to the limit pass through (not blocked)
 *   2. The (limit+1)th Bearer-authenticated request gets 429 with retryAfterSeconds
 *   3. Two different Bearer tokens for different users have independent buckets
 *   4. An unrecognised Bearer token gets 401 from requireApiKeyOrSession
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { RequestHandler } from 'express';
import request from 'supertest';
import { makeApp, makeDbMock, makeLoggerMock, resetDbState, dbState } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

// ── Inline tight rate limiter ────────────────────────────────────────────────
// Synchronous factory: no async import needed, no Vitest hoisting deadlock.
// Mirrors the production aiPlanRateLimiter's keyGenerator (res.locals.userId).
//
// A fresh store Map is created here so it persists for the file's lifetime.
// Tests use disjoint userId ranges (200, 201, 210/211) to avoid cross-test
// bucket collisions without needing a reset hook.
const _store = new Map<string, number>();
const _LIMIT = 3;

function _tightLimiter(): RequestHandler {
  return (req, res, next) => {
    const uid = (res.locals as any).userId as number | undefined;
    const key = uid != null ? `user:${uid}` : `ip:${req.ip ?? 'unknown'}`;
    const hits = (_store.get(key) ?? 0) + 1;
    _store.set(key, hits);
    if (hits > _LIMIT) {
      const retryAfterSeconds = 3600;
      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ ok: false, error: 'AI plan limit reached', retryAfterSeconds });
      return;
    }
    next();
  };
}

vi.mock('../src/lib/rateLimit', () => ({
  aiPlanRateLimiter: _tightLimiter(),
}));

// Import AFTER mocks are registered so the router picks up the mocked modules.
import aiPlanRouter from '../src/routes/aiPlan';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/**
 * Configure the DB mock so requireApiKeyOrSession resolves the Bearer token to
 * `userId`.  requireApiKeyOrSession runs two sequential selects:
 *   1. API-key row lookup  → needs { id, userId, scope, revokedAt }
 *   2. User existence check → needs any non-empty row
 * The mock chain returns dbState.selectRows for both; one row that satisfies
 * both checks is sufficient.
 */
function stubApiKeyDb(userId: number) {
  dbState.selectRows = [{ id: userId * 10, userId, scope: 'write', revokedAt: null }];
}

/** Unauthenticated (no session) app backed by the real router. */
function makeAnonApp() {
  return makeApp('/', aiPlanRouter, {});
}

/* ══════════════════════════════════════════════════════════════════════════
   Tests
══════════════════════════════════════════════════════════════════════════ */

beforeEach(() => {
  resetDbState();
  // The AI_INTEGRATIONS_OPENAI_* env vars may be configured in this environment,
  // causing outbound fetch calls that hang and time out.  Stub fetch so the
  // route returns quickly with a non-200 status — we are testing the rate
  // limiter, not the AI call.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ error: 'AI stub' }),
    text: async () => 'stub',
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /ai/plan — rate limiting via API key (Bearer token)', () => {
  it('does not block Bearer-authenticated requests until the limit is reached', async () => {
    // userId 200 — bucket unused by any other test in this file.
    stubApiKeyDb(200);
    const app = makeAnonApp();

    for (let i = 0; i < _LIMIT; i++) {
      const res = await request(app)
        .post('/ai/plan')
        .set('Authorization', 'Bearer isk_user200')
        .send({ prompt: 'test' });

      // Any response except 429 confirms the rate limiter passed the request.
      // (The handler returns 503 because AI env vars are not configured in this
      // test suite — that is intentional; we are testing the limiter, not the
      // AI call.)
      expect(res.status).not.toBe(429);
    }
  }, 20_000);

  it('returns 429 with ok:false and retryAfterSeconds once the limit is exceeded via Bearer token', async () => {
    // userId 201 — fresh bucket, isolated from the test above.
    stubApiKeyDb(201);
    const app = makeAnonApp();

    // Exhaust the quota (limit = _LIMIT requests)
    for (let i = 0; i < _LIMIT; i++) {
      await request(app)
        .post('/ai/plan')
        .set('Authorization', 'Bearer isk_user201')
        .send({ prompt: 'test' });
    }

    // The next request must be blocked by the rate limiter
    const blocked = await request(app)
      .post('/ai/plan')
      .set('Authorization', 'Bearer isk_user201')
      .send({ prompt: 'test' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(typeof blocked.body.retryAfterSeconds).toBe('number');
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
  }, 20_000);

  // 5 sequential real-HTTP requests through the full middleware stack.
  // The timeout is raised above the Vitest default (5 s) because the full test
  // suite's module-import phase can push each request to ~800 ms, making the
  // total close to or over 5 s.
  it('keeps independent rate-limit buckets for two API keys belonging to different users',
    async () => {
      const app = makeAnonApp();

      // Phase 1: exhaust user 210's bucket (userId 210 — fresh in this test)
      stubApiKeyDb(210);
      for (let i = 0; i < _LIMIT; i++) {
        await request(app)
          .post('/ai/plan')
          .set('Authorization', 'Bearer isk_user210')
          .send({ prompt: 'test' });
      }
      const blocked = await request(app)
        .post('/ai/plan')
        .set('Authorization', 'Bearer isk_user210')
        .send({ prompt: 'test' });
      expect(blocked.status).toBe(429);

      // Phase 2: user 211 uses the SAME limiter but a different userId bucket.
      // Their first request must NOT be rate-limited.
      stubApiKeyDb(211);
      const allowed = await request(app)
        .post('/ai/plan')
        .set('Authorization', 'Bearer isk_user211')
        .send({ prompt: 'test' });

      expect(allowed.status).not.toBe(429);
    },
    20_000, // explicit per-test timeout (ms)
  );

  it('returns 401 from requireApiKeyOrSession when the Bearer token is not found in the DB', async () => {
    // Empty selectRows → the API-key lookup returns no row → 401 before the
    // rate limiter is ever reached.
    dbState.selectRows = [];
    const app = makeAnonApp();

    const res = await request(app)
      .post('/ai/plan')
      .set('Authorization', 'Bearer isk_nonexistent_key')
      .send({ prompt: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 from requireApiKeyOrSession when no Authorization header is present', async () => {
    const app = makeAnonApp();

    const res = await request(app)
      .post('/ai/plan')
      .send({ prompt: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});
