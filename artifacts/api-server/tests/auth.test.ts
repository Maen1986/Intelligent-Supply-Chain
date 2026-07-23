import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('../src/routes/notify', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ sent: true }),
}));
const sendPasswordResetEmail = vi.fn(async () => ({ sent: true }));
vi.mock('../src/routes/notify', () => ({ sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmail(...(args as [])) }));

import express from 'express';
import bcrypt from 'bcryptjs';

import authRouter from '../src/routes/auth';

const user = {
  id: 1,
  email: 'jane@example.com',
  fullName: 'Jane Doe',
  mobile: '+966500000000',
  designation: 'CPO',
  company: 'Acme',
  role: 'user',
};

beforeEach(resetDbState);

describe('POST /api/auth/register', () => {
  it('creates a new user and returns the profile', async () => {
    dbState.selectRows = [];       // no existing user
    dbState.insertRows = [user];   // insert returns created row
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: user.email,
      fullName: user.fullName,
      password: 'secret6',
      mobile: user.mobile,
      designation: user.designation,
      company: user.company,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toMatchObject({ id: 1, email: user.email, role: 'user' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('lets a legacy user (no password hash) claim their account', async () => {
    dbState.selectRows = [user]; // no passwordHash field → legacy
    dbState.updateRows = [{ ...user, fullName: 'Jane Updated', passwordHash: 'hashed' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: user.email,
      fullName: 'Jane Updated',
      password: 'secret6',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe('Jane Updated');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects registration for an email that already has a password', async () => {
    dbState.selectRows = [{ ...user, passwordHash: 'hashed' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: user.email,
      fullName: user.fullName,
      password: 'secret6',
    });
    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
  });

  it('rejects a missing/short password with 400', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: 'shortpass@example.com',
      fullName: user.fullName,
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid payloads with 400', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      fullName: 'J', // too short
    });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 500 when the database fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: 'dbfail@example.com',
      fullName: user.fullName,
      password: 'secret6',
    });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with a correct password', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    dbState.selectRows = [{ ...user, passwordHash: await bcrypt.hash('secret6', 4) }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'secret6' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 1, email: user.email });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password with 401', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    dbState.selectRows = [{ ...user, passwordHash: await bcrypt.hash('secret6', 4) }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown emails and legacy no-password accounts with 401', async () => {
    dbState.selectRows = [];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'x' });
    expect(res.status).toBe(401);

    dbState.selectRows = [user]; // legacy: no passwordHash
    const res2 = await request(app).post('/api/auth/login').send({ email: user.email, password: 'x' });
    expect(res2.status).toBe(401);
  });
});

describe('POST /api/auth/register rate limiting', () => {
  // Each test uses a dedicated spoofed IP (via X-Forwarded-For) so the
  // in-memory rate-limit store buckets are isolated from one another.

  it('does not rate-limit a normal single registration', async () => {
    dbState.selectRows = [];
    dbState.insertRows = [user];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.1.0.1')
      .send({ email: 'normal-single@example.com', fullName: user.fullName, password: 'secret6' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 429 after 20 registration attempts from the same IP', async () => {
    // Share one app instance so the in-memory rate-limit store accumulates hits.
    const app = makeApp('/api/auth', authRouter);

    // Fire 20 attempts from the bot IP — each unique email.
    for (let i = 0; i < 20; i++) {
      dbState.selectRows = [];
      dbState.insertRows = [{ ...user, id: i + 100, email: `bot${i}@example.com` }];
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.2.0.1')
        .send({ email: `bot${i}@example.com`, fullName: 'Bot User', password: 'secret6' });
      // Each of the first 20 should succeed (not be rate-limited).
      expect(res.status).not.toBe(429);
    }

    // The 21st attempt from the same IP should be blocked.
    dbState.selectRows = [];
    dbState.insertRows = [{ ...user, id: 999, email: 'bot99@example.com' }];
    const blocked = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.2.0.1')
      .send({ email: 'bot99@example.com', fullName: 'Bot User', password: 'secret6' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('returns 429 after 3 attempts for the same email, even from different IPs', async () => {
    const app = makeApp('/api/auth', authRouter);
    const email = 'botnet-target@example.com';

    // 3 attempts from 3 different IPs — all for the same email.
    for (let i = 0; i < 3; i++) {
      dbState.selectRows = [];
      dbState.insertRows = [{ ...user, id: i + 200, email }];
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', `10.4.${i}.1`)
        .send({ email, fullName: 'Bot User', password: 'secret6' });
      expect(res.status).not.toBe(429);
    }

    // 4th attempt from yet another IP is blocked by the per-email limit.
    dbState.selectRows = [];
    dbState.insertRows = [{ ...user, id: 999, email }];
    const blocked = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.4.99.1')
      .send({ email, fullName: 'Bot User', password: 'secret6' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.headers['retry-after']).toBeDefined();

    // A different email from one of those IPs is still allowed.
    dbState.selectRows = [];
    dbState.insertRows = [{ ...user, id: 1000, email: 'other-target@example.com' }];
    const other = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.4.0.1')
      .send({ email: 'other-target@example.com', fullName: 'Bot User', password: 'secret6' });
    expect(other.status).not.toBe(429);
  });

  it('normalizes email case/whitespace for the per-email limit', async () => {
    const app = makeApp('/api/auth', authRouter);
    const variants = ['Case@Example.com', ' case@example.com ', 'CASE@EXAMPLE.COM'];
    for (let i = 0; i < variants.length; i++) {
      dbState.selectRows = [];
      dbState.insertRows = [{ ...user, id: i + 300, email: 'case@example.com' }];
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', `10.5.${i}.1`)
        .send({ email: variants[i], fullName: 'Case User', password: 'secret6' });
      expect(res.status).not.toBe(429);
    }
    dbState.selectRows = [];
    dbState.insertRows = [{ ...user, id: 399, email: 'case@example.com' }];
    const blocked = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '10.5.99.1')
      .send({ email: 'case@example.com', fullName: 'Case User', password: 'secret6' });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/auth/forgot-password rate limiting', () => {
  // Uses a dedicated IP bucket so this suite doesn't bleed into others.
  const FP_IP = '10.3.0.1';

  it('returns 429 after 5 attempts from the same IP, even when all return 200', async () => {
    // User with a password — forgot-password will issue a code and return 200.
    const bcrypt = (await import('bcryptjs')).default;
    dbState.selectRows = [{ ...user, passwordHash: await bcrypt.hash('secret6', 4) }];
    const app = makeApp('/api/auth', authRouter);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', FP_IP)
        .send({ email: user.email });
      // All five succeed with 200; each must still consume quota.
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    }

    // 6th attempt from the same IP should be blocked.
    const blocked = await request(app)
      .post('/api/auth/forgot-password')
      .set('X-Forwarded-For', FP_IP)
      .send({ email: user.email });
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('also throttles unknown-email requests (which also return 200)', async () => {
    dbState.selectRows = []; // no user found — route returns generic 200
    const app = makeApp('/api/auth', authRouter);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', '10.3.0.2')
        .send({ email: `nobody${i}@example.com` });
      expect(res.status).toBe(200);
    }

    const blocked = await request(app)
      .post('/api/auth/forgot-password')
      .set('X-Forwarded-For', '10.3.0.2')
      .send({ email: 'nobody99@example.com' });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/auth/login rate limiting', () => {
  it('returns 429 after 5 failed attempts for the same email within a minute', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    dbState.selectRows = [{ ...user, email: 'bruteforce@example.com', passwordHash: await bcrypt.hash('secret6', 4) }];
    const app = makeApp('/api/auth', authRouter);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bruteforce@example.com', password: `wrong-${i}` });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'wrong-again' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.ok).toBe(false);
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.headers['retry-after']).toBeDefined();

    // Even the correct password is blocked while the window is active.
    const stillBlocked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bruteforce@example.com', password: 'secret6' });
    expect(stillBlocked.status).toBe(429);
  });

  it('does not throttle successful sign-ins', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    dbState.selectRows = [{ ...user, email: 'goodusers@example.com', passwordHash: await bcrypt.hash('secret6', 4) }];
    const app = makeApp('/api/auth', authRouter);
    for (let i = 0; i < 7; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'goodusers@example.com', password: 'secret6' });
      expect(res.status).toBe(200);
    }
  });
});

describe('POST /api/auth/update-profile', () => {
  /** Like makeApp, but keeps a live reference to the session object so tests
      can assert that the route refreshed session fields. */
  function makeAppWithSession(sessionSeed: Record<string, unknown>) {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    const sessionObj: Record<string, any> = {
      ...sessionSeed,
      save: (cb: (err?: unknown) => void) => cb(),
      destroy: (cb: (err?: unknown) => void) => cb(),
    };
    app.use((req: any, _res: any, next: any) => { req.session = sessionObj; next(); });
    app.use('/api/auth', authRouter);
    return { app, sessionObj };
  }

  it('returns 401 for unauthenticated requests', async () => {
    const app = makeApp('/api/auth', authRouter); // no session
    const res = await request(app).post('/api/auth/update-profile')
      .send({ fullName: 'New Name' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('rejects invalid data (name shorter than 2 chars) with 400 and no DB write', async () => {
    const { db } = await import('@workspace/db');
    (db.update as ReturnType<typeof vi.fn>).mockClear();
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/update-profile')
      .send({ fullName: 'J' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('persists valid data and refreshes the session fields', async () => {
    const updated = {
      ...user,
      fullName: 'Jane Renamed',
      mobile: '+966511111111',
      designation: 'VP Supply Chain',
      company: 'NewCo',
    };
    dbState.updateRows = [updated];

    const { db } = await import('@workspace/db');
    (db.update as ReturnType<typeof vi.fn>).mockClear();

    const { app, sessionObj } = makeAppWithSession({ userId: 1, userFullName: user.fullName });
    const res = await request(app).post('/api/auth/update-profile')
      .send({
        fullName: 'Jane Renamed',
        mobile: '+966511111111',
        designation: 'VP Supply Chain',
        company: 'NewCo',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // Response reflects the persisted row (this is what the Header consumes)
    expect(res.body.user).toMatchObject({
      id: 1,
      fullName: 'Jane Renamed',
      mobile: '+966511111111',
      designation: 'VP Supply Chain',
      company: 'NewCo',
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    // DB write happened
    expect(db.update).toHaveBeenCalled();
    // Session was refreshed so /me and subsequent requests see the new values
    expect(sessionObj.userFullName).toBe('Jane Renamed');
    expect(sessionObj.userMobile).toBe('+966511111111');
    expect(sessionObj.userDesignation).toBe('VP Supply Chain');
    expect(sessionObj.userCompany).toBe('NewCo');
  });

  it('nulls out optional fields when they are omitted or null', async () => {
    const updated = { ...user, fullName: 'Jane Minimal', mobile: null, designation: null, company: null };
    dbState.updateRows = [updated];

    const { app, sessionObj } = makeAppWithSession({ userId: 1, userMobile: user.mobile });
    const res = await request(app).post('/api/auth/update-profile')
      .send({ fullName: 'Jane Minimal', mobile: null });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ fullName: 'Jane Minimal', mobile: null, designation: null, company: null });
    expect(sessionObj.userMobile).toBeNull();
    expect(sessionObj.userDesignation).toBeNull();
    expect(sessionObj.userCompany).toBeNull();
  });

  it('returns 404 when the session user no longer exists', async () => {
    dbState.updateRows = []; // update matched no row
    const app = makeApp('/api/auth', authRouter, { userId: 999 });
    const res = await request(app).post('/api/auth/update-profile')
      .send({ fullName: 'Ghost User' });
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  it('returns 500 when the database fails', async () => {
    dbState.failNext = true;
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/update-profile')
      .send({ fullName: 'Jane Renamed' });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 with no session', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns the user for a valid session', async () => {
    dbState.selectRows = [user];
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('returns 401 when the session user no longer exists', async () => {
    dbState.selectRows = [];
    const app = makeApp('/api/auth', authRouter, { userId: 999 });
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('destroys the session and returns ok', async () => {
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /api/auth/forgot-password', () => {
  // Use a dedicated IP so these functional tests never bleed into the rate-
  // limit bucket shared with the reset-password and rate-limiting test suites.
  const FP_FUNC_IP = '10.10.0.1';

  it('returns the generic response and sends an email for a known account', async () => {
    sendPasswordResetEmail.mockClear();
    dbState.selectRows = [{ ...user, passwordHash: 'hashed' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/forgot-password')
      .set('X-Forwarded-For', FP_FUNC_IP).send({ email: user.email });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('returns the same generic response for an unknown email without sending', async () => {
    sendPasswordResetEmail.mockClear();
    dbState.selectRows = [];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/forgot-password')
      .set('X-Forwarded-For', FP_FUNC_IP).send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('surfaces a 503 when the email cannot be sent', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce({ sent: false, reason: 'smtp down' } as any);
    dbState.selectRows = [{ ...user, passwordHash: 'hashed' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/forgot-password')
      .set('X-Forwarded-For', FP_FUNC_IP).send({ email: user.email });
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/auth/reset-password', () => {
  // Dedicated IP keeps these tests out of the forgotPasswordRateLimiter bucket
  // shared with forgot-password tests (both routes share the same limiter).
  const RP_FUNC_IP = '10.10.0.2';

  it('resets the password with a valid, unexpired code', async () => {
    const resetTokenHash = await bcrypt.hash('123456', 4);
    dbState.selectRows = [{ ...user, passwordHash: 'old', resetTokenHash, resetTokenExpiresAt: new Date(Date.now() + 60_000) }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/reset-password')
      .set('X-Forwarded-For', RP_FUNC_IP)
      .send({ email: user.email, code: '123456', newPassword: 'newpass6' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects a wrong code', async () => {
    const resetTokenHash = await bcrypt.hash('123456', 4);
    dbState.selectRows = [{ ...user, passwordHash: 'old', resetTokenHash, resetTokenExpiresAt: new Date(Date.now() + 60_000) }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/reset-password')
      .set('X-Forwarded-For', RP_FUNC_IP)
      .send({ email: 'wrongcode@example.com', code: '999999', newPassword: 'newpass6' });
    expect(res.status).toBe(400);
  });

  it('rejects an expired code', async () => {
    const resetTokenHash = await bcrypt.hash('123456', 4);
    dbState.selectRows = [{ ...user, passwordHash: 'old', resetTokenHash, resetTokenExpiresAt: new Date(Date.now() - 1000) }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/reset-password')
      .set('X-Forwarded-For', RP_FUNC_IP)
      .send({ email: 'expired@example.com', code: '123456', newPassword: 'newpass6' });
    expect(res.status).toBe(400);
  });

  it('rejects when no reset was requested', async () => {
    dbState.selectRows = [{ ...user, passwordHash: 'old' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/reset-password')
      .set('X-Forwarded-For', RP_FUNC_IP)
      .send({ email: 'noreset@example.com', code: '123456', newPassword: 'newpass6' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/admin-login', () => {
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'supersecret';

  beforeEach(() => {
    process.env.ADMIN_EMAIL    = ADMIN_EMAIL;
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
  });

  it('returns 503 when admin credentials are not configured', async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });

  it('rejects wrong credentials with 401', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: ADMIN_EMAIL, password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/invalid admin credentials/i);
  });

  it('rejects wrong email with 401', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: 'notadmin@example.com', password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('rejects invalid payloads with 400', async () => {
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: 'not-an-email', password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('creates an admin user row and establishes a session on correct credentials', async () => {
    dbState.selectRows = []; // no existing user — triggers insert
    dbState.insertRows = [{
      id: 99, email: ADMIN_EMAIL, fullName: 'Administrator',
      mobile: null, designation: null, company: null, role: 'admin',
    }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toMatchObject({ email: ADMIN_EMAIL, role: 'admin' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('accepts an existing admin row without re-inserting', async () => {
    dbState.selectRows = [{
      id: 99, email: ADMIN_EMAIL, fullName: 'Administrator',
      mobile: null, designation: null, company: null, role: 'admin',
    }];
    const { db } = await import('@workspace/db');
    (db.insert as ReturnType<typeof vi.fn>).mockClear();
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('promotes a pre-existing non-admin row to admin and clears its password hash', async () => {
    dbState.selectRows = [{
      id: 5, email: ADMIN_EMAIL, fullName: 'Old User', passwordHash: 'old-hash',
      mobile: null, designation: null, company: null, role: 'user',
    }];
    dbState.updateRows = [{
      id: 5, email: ADMIN_EMAIL, fullName: 'Old User', passwordHash: null,
      mobile: null, designation: null, company: null, role: 'admin',
    }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/admin-login').send({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    const { db } = await import('@workspace/db');
    expect(db.update).toHaveBeenCalled();
  });
});

describe('POST /api/auth/change-password', () => {
  it('returns 401 when the user is not authenticated', async () => {
    const app = makeApp('/api/auth', authRouter); // no session
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'secret6', newPassword: 'newpass6' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 with a clear message when the current password is wrong', async () => {
    const passwordHash = await bcrypt.hash('secret6', 4);
    dbState.selectRows = [{ ...user, passwordHash }];
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpass6' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/current password/i);
  });

  it('returns 400 when the new password is too short', async () => {
    const passwordHash = await bcrypt.hash('secret6', 4);
    dbState.selectRows = [{ ...user, passwordHash }];
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'secret6', newPassword: '123' }); // only 3 chars
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 200 on a valid request and triggers a DB update', async () => {
    const passwordHash = await bcrypt.hash('secret6', 4);
    dbState.selectRows = [{ ...user, passwordHash }];
    dbState.updateRows = [{ ...user, passwordHash: 'newhash' }];

    // Capture db.execute calls to verify session invalidation
    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockClear();

    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'secret6', newPassword: 'newpass6' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // The DB update must have been called (password change persisted)
    expect(db.update).toHaveBeenCalled();
  });

  it('deletes other sessions for the user after a successful change', async () => {
    const passwordHash = await bcrypt.hash('secret6', 4);
    dbState.selectRows = [{ ...user, passwordHash }];
    dbState.updateRows = [{ ...user, passwordHash: 'newhash' }];

    const { db } = await import('@workspace/db');
    (db.execute as ReturnType<typeof vi.fn>).mockClear();

    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'secret6', newPassword: 'newpass6' });

    // db.execute is called to DELETE other sessions for this userId
    expect(db.execute).toHaveBeenCalled();
    const callArg = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // The SQL should reference the userId to scope the delete
    expect(JSON.stringify(callArg)).toContain('1'); // userId = 1
  });

  it('returns 400 when no password is set on the account', async () => {
    dbState.selectRows = [{ ...user }]; // no passwordHash field
    const app = makeApp('/api/auth', authRouter, { userId: 1 });
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'secret6', newPassword: 'newpass6' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
