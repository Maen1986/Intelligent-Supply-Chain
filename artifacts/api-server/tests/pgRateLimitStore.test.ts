import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { PgRateLimitStore } from '../src/lib/pgRateLimitStore';

/* Exercises the PostgreSQL-backed rate-limit store against the real dev
   database, proving counts persist across store instances (i.e. across
   server restarts / multiple app instances sharing one database). */

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
// Unique prefix per run so repeated test runs never collide.
const prefix = `test:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const initOpts = { windowMs: 60_000 } as any;

afterAll(async () => {
  await pool.query(`DELETE FROM rate_limit_hits WHERE key LIKE $1`, [`${prefix}%`]);
  await pool.end();
});

describe('PgRateLimitStore', () => {
  it('counts hits within a window', async () => {
    const store = new PgRateLimitStore(pool, prefix);
    store.init(initOpts);
    const first = await store.increment('1.2.3.4');
    expect(first.totalHits).toBe(1);
    expect(first.resetTime!.getTime()).toBeGreaterThan(Date.now());
    const second = await store.increment('1.2.3.4');
    expect(second.totalHits).toBe(2);
  });

  it('persists counts across store instances (simulated restart)', async () => {
    const before = new PgRateLimitStore(pool, prefix);
    before.init(initOpts);
    for (let i = 0; i < 5; i++) await before.increment('5.6.7.8');

    // A brand-new store instance (new process after a restart, or another
    // app instance) sees the same counter.
    const after = new PgRateLimitStore(pool, prefix);
    after.init(initOpts);
    const res = await after.increment('5.6.7.8');
    expect(res.totalHits).toBe(6);
  });

  it('keeps distinct keys independent and supports resetKey', async () => {
    const store = new PgRateLimitStore(pool, prefix);
    store.init(initOpts);
    await store.increment('9.9.9.9');
    const other = await store.increment('8.8.8.8');
    expect(other.totalHits).toBe(1);
    await store.resetKey('9.9.9.9');
    const fresh = await store.increment('9.9.9.9');
    expect(fresh.totalHits).toBe(1);
  });

  it('starts a new window after expiry', async () => {
    const store = new PgRateLimitStore(pool, prefix);
    store.init({ windowMs: 50 } as any);
    await store.increment('7.7.7.7');
    await store.increment('7.7.7.7');
    await new Promise(r => setTimeout(r, 80));
    const res = await store.increment('7.7.7.7');
    expect(res.totalHits).toBe(1);
  });

  it('fails open when the database is unreachable', async () => {
    const badPool = new pg.Pool({
      connectionString: 'postgresql://nope:nope@127.0.0.1:59999/nope',
      connectionTimeoutMillis: 500,
    });
    const store = new PgRateLimitStore(badPool as any, prefix);
    store.init(initOpts);
    const res = await store.increment('1.1.1.1');
    expect(res.totalHits).toBe(1); // allowed through, not an error
    await badPool.end();
  });
});
