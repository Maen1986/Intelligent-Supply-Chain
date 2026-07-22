import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, dbState, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

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
      email: user.email,
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
      email: user.email,
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
