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
      mobile: user.mobile,
      designation: user.designation,
      company: user.company,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toMatchObject({ id: 1, email: user.email, role: 'user' });
  });

  it('updates an existing user profile', async () => {
    dbState.selectRows = [user];
    dbState.updateRows = [{ ...user, fullName: 'Jane Updated' }];
    const app = makeApp('/api/auth', authRouter);
    const res = await request(app).post('/api/auth/register').send({
      email: user.email,
      fullName: 'Jane Updated',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe('Jane Updated');
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
    });
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
