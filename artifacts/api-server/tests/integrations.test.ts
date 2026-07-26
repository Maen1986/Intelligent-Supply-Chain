/**
 * Tests for:
 *   - requireApiKeyOrSession middleware
 *   - /api/v1/* data endpoints
 *   - /api/integrations/* CRUD endpoints
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { makeApp, makeLoggerMock, resetDbState, dbState } from './helpers';
import { createHash, randomBytes } from 'crypto';

/* ─── mocks ──────────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => makeLoggerMock());

// Track update calls separately so we can inspect last-used-at updates
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockExecute = vi.fn();
const mockDelete = vi.fn();

function makeSelectChain(rows: () => unknown[]) {
  const c: Record<string, unknown> = {};
  for (const m of ['from', 'orderBy', 'limit', 'where']) {
    c[m] = (..._args: unknown[]) => c;
  }
  c.then = (res: (v: unknown) => void, rej: (e: unknown) => void) =>
    Promise.resolve(rows()).then(res, rej);
  c.catch = (fn: (e: unknown) => void) => Promise.resolve(rows()).catch(fn);
  return c;
}
function makeUpdateChain() {
  const c: Record<string, unknown> = {};
  for (const m of ['set', 'where']) { c[m] = () => c; }
  c.then = (res: (v: unknown) => void) => Promise.resolve([]).then(res);
  c.catch = (fn: (e: unknown) => void) => Promise.resolve([]).catch(fn);
  return c;
}
function makeInsertChain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  for (const m of ['values', 'returning', 'where']) { c[m] = () => c; }
  c.then = (res: (v: unknown) => void) => Promise.resolve(rows).then(res);
  c.catch = (fn: (e: unknown) => void) => Promise.resolve(rows).catch(fn);
  return c;
}
function makeDeleteChain() {
  const c: Record<string, unknown> = {};
  c.where = () => c;
  c.then = (res: (v: unknown) => void) => Promise.resolve([]).then(res);
  c.catch = (fn: (e: unknown) => void) => Promise.resolve([]).catch(fn);
  return c;
}

// Shared db state for these tests
let apiKeyRows: unknown[] = [];
let webhookRows: unknown[] = [];
let insertReturn: unknown[] = [];

vi.mock('@workspace/db', () => ({
  db: {
    select:  (...args: unknown[]) => { mockSelect(...args); return makeSelectChain(() => apiKeyRows); },
    update:  (...args: unknown[]) => { mockUpdate(...args); return makeUpdateChain(); },
    insert:  (...args: unknown[]) => { mockInsert(...args); return makeInsertChain(insertReturn); },
    delete:  (...args: unknown[]) => { mockDelete(...args); return makeDeleteChain(); },
    execute: (...args: unknown[]) => { mockExecute(...args); return Promise.resolve({ rows: [] }); },
  },
  apiKeysTable:            { id: 'id', userId: 'user_id', keyHash: 'key_hash', revokedAt: 'revoked_at', nameLabel: 'name_label', keyPrefix: 'key_prefix', createdAt: 'created_at', lastUsedAt: 'last_used_at' },
  webhookConfigsTable:     { id: 'id', userId: 'user_id', url: 'url', events: 'events', createdAt: 'created_at' },
  webhookDeliveryLogTable: { id: 'id', webhookConfigId: 'webhook_config_id', event: 'event', statusCode: 'status_code', responseSnippet: 'response_snippet', success: 'success', attemptedAt: 'attempted_at' },
  usersTable:              { id: 'id', email: 'email' },
  eq: (a: unknown, b: unknown) => ({ op: 'eq', a, b }),
  and: (...args: unknown[]) => ({ op: 'and', args }),
  desc: (col: unknown) => ({ op: 'desc', col }),
  sql: Object.assign((strings: TemplateStringsArray, ...vals: unknown[]) => ({ sql: strings.join('?'), values: vals }), { raw: (s: string) => s }),
}));

vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchWebhook: vi.fn().mockResolvedValue({ success: true, statusCode: 200, responseSnippet: 'ok' }),
  dispatchEvent: vi.fn(),
}));

/* ─── helpers ──────────────────────────────────────────────────────────── */

function makeKey() {
  const raw = `isk_${randomBytes(8).toString('base64url')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/* ─── requireApiKeyOrSession ─────────────────────────────────────────────── */

describe('requireApiKeyOrSession middleware', () => {
  beforeEach(() => { apiKeyRows = []; mockSelect.mockClear(); mockUpdate.mockClear(); });

  it('returns 401 when no session and no Bearer header', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router);       // no session
    const res = await request(app).get('/api/v1/suppliers');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 for an unknown API key', async () => {
    apiKeyRows = [];   // key not found in DB
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', 'Bearer isk_notreal');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid API key/);
  });

  it('returns 401 for a revoked API key', async () => {
    const { raw } = makeKey();
    apiKeyRows = [{ id: 1, userId: 42, revokedAt: new Date().toISOString() }];
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${raw}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });

  it('accepts a valid API key and reaches the route handler', async () => {
    const { raw } = makeKey();
    apiKeyRows = [{ id: 7, userId: 99, revokedAt: null }];
    // execute returns empty user row → 200 with null data
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${raw}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('accepts session auth when no Bearer header is present', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 5 });
    const res = await request(app).get('/api/v1/kpis');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

/* ─── GET endpoints ──────────────────────────────────────────────────────── */

describe('GET /api/v1/* endpoints', () => {
  beforeEach(() => { apiKeyRows = []; });

  const endpoints = ['/suppliers', '/kpis', '/risk-kris', '/spend', '/training'];

  for (const path of endpoints) {
    it(`GET /api/v1${path} returns 200 with ok:true when authenticated`, async () => {
      const { default: v1Router } = await import('../src/routes/v1');
      const app = makeApp('/api/v1', v1Router, { userId: 1 });
      const res = await request(app).get(`/api/v1${path}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it(`GET /api/v1${path} returns 401 without auth`, async () => {
      const { default: v1Router } = await import('../src/routes/v1');
      const app = makeApp('/api/v1', v1Router);
      const res = await request(app).get(`/api/v1${path}`);
      expect(res.status).toBe(401);
    });
  }
});

/* ─── POST import endpoints ─────────────────────────────────────────────── */

describe('POST /api/v1/suppliers/import', () => {
  beforeEach(() => { apiKeyRows = []; mockExecute.mockClear(); });

  it('returns 400 when suppliers array is missing', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const res = await request(app).post('/api/v1/suppliers/import').send({ notSuppliers: [] });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns import summary with correct counts', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const suppliers = [
      { id: 's1', name: 'ACME Corp' },
      { id: 's2', name: 'Beta Ltd' },
      {},                               // missing id/name — should be skipped
    ];
    const res = await request(app)
      .post('/api/v1/suppliers/import')
      .send({ suppliers });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.imported).toBe(2);
    expect(res.body.skipped).toBe(1);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('accepts a valid API key for the import endpoint', async () => {
    const { raw } = makeKey();
    apiKeyRows = [{ id: 3, userId: 10, revokedAt: null }];
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .post('/api/v1/suppliers/import')
      .set('Authorization', `Bearer ${raw}`)
      .send({ suppliers: [{ id: 'x1', name: 'X Corp' }] });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
  });
});

describe('POST /api/v1/kpis/import', () => {
  it('returns 400 when values object is missing', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const res = await request(app).post('/api/v1/kpis/import').send({ slug: 'cips' });
    expect(res.status).toBe(400);
  });

  it('returns imported count equal to number of KPI values', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const res = await request(app).post('/api/v1/kpis/import').send({
      slug: 'cips',
      values: { 'kpi-ot': '95', 'kpi-fill': '88.2', 'kpi-defect': '1.1' },
    });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(3);
  });
});

describe('POST /api/v1/spend/import', () => {
  it('returns 400 when rows array is missing', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const res = await request(app).post('/api/v1/spend/import').send({});
    expect(res.status).toBe(400);
  });

  it('filters out invalid rows and reports errors', async () => {
    const { default: v1Router } = await import('../src/routes/v1');
    const app = makeApp('/api/v1', v1Router, { userId: 1 });
    const res = await request(app).post('/api/v1/spend/import').send({
      rows: [
        { name: 'ACME', spend: 150000 },
        { name: 'Beta', spend: -500 },   // negative → invalid
        { spend: 9000 },                  // missing name → invalid
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(2);
    expect(res.body.errors.length).toBe(2);
  });
});

/* ─── /api/integrations/* — admin-only access control ──────────────────── */

describe('Admin-only guard on /api/integrations/*', () => {
  it('returns 401 with no session', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter);  // no session at all
    const res = await request(app).get('/api/integrations/keys');
    expect(res.status).toBe(401);
  });

  it('returns 403 when session has userId but no admin role', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, { userId: 5, userRole: 'user' });
    const res = await request(app).get('/api/integrations/keys');
    expect(res.status).toBe(403);
  });

  it('returns 403 for non-admin on key generation', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, { userId: 5, userRole: 'user' });
    const res = await request(app).post('/api/integrations/keys').send({ nameLabel: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for non-admin on webhook creation', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, { userId: 5, userRole: 'user' });
    const res = await request(app).post('/api/integrations/webhooks').send({ url: 'https://attacker.example.com' });
    expect(res.status).toBe(403);
  });

  it('allows an admin session through to the route', async () => {
    apiKeyRows = [];
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, { userId: 1, userRole: 'admin' });
    const res = await request(app).get('/api/integrations/keys');
    expect(res.status).toBe(200);
  });
});

/* ─── /api/integrations/keys ─────────────────────────────────────────────── */

const ADMIN_SESSION = { userId: 1, userRole: 'admin' };

describe('GET /api/integrations/keys', () => {
  it('returns key list for an admin', async () => {
    apiKeyRows = [{ id: 1, nameLabel: 'SAP', keyPrefix: 'isk_abc…', createdAt: new Date(), lastUsedAt: null, revokedAt: null }];
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).get('/api/integrations/keys');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.keys)).toBe(true);
  });
});

describe('POST /api/integrations/keys', () => {
  beforeEach(() => {
    insertReturn = [{ id: 42, createdAt: new Date().toISOString() }];
    mockInsert.mockClear();
  });

  it('returns 400 when nameLabel is missing', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).post('/api/integrations/keys').send({});
    expect(res.status).toBe(400);
  });

  it('creates a key and returns the raw key once', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app)
      .post('/api/integrations/keys')
      .send({ nameLabel: 'SAP Production' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.key.rawKey).toBe('string');
    expect(res.body.key.rawKey).toMatch(/^isk_/);
    expect(res.body.key.rawKey.length).toBeGreaterThan(20);
    // Raw key must NOT appear in the prefix stored for display
    expect(res.body.key.rawKey).not.toBe(res.body.key.keyPrefix);
  });
});

describe('DELETE /api/integrations/keys/:id', () => {
  it('returns 401 without session', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter);
    const res = await request(app).delete('/api/integrations/keys/1');
    expect(res.status).toBe(401);
  });

  it('returns 400 for a non-numeric ID', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).delete('/api/integrations/keys/abc');
    expect(res.status).toBe(400);
  });

  it('returns 200 for a valid revocation', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).delete('/api/integrations/keys/7');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

/* ─── /api/integrations/webhooks — URL validation ───────────────────────── */

describe('Webhook URL validation', () => {
  beforeEach(() => {
    apiKeyRows = [];
    insertReturn = [{ id: 1, url: 'https://example.com', events: [], createdAt: new Date() }];
    mockInsert.mockClear(); mockSelect.mockClear();
  });

  const badUrls = [
    { url: 'ftp://example.com',                           desc: 'non-http scheme' },
    { url: 'not-a-url',                                   desc: 'malformed URL' },
    { url: 'http://localhost/hook',                       desc: 'localhost' },
    { url: 'http://127.0.0.1/hook',                       desc: 'IPv4 loopback 127.0.0.1' },
    { url: 'http://127.1.2.3/hook',                       desc: 'IPv4 loopback 127.x.x.x' },
    { url: 'http://0.0.0.0/hook',                         desc: '0.0.0.0' },
    { url: 'http://10.0.0.1/hook',                        desc: 'private 10.x' },
    { url: 'http://192.168.1.1/hook',                     desc: 'private 192.168.x' },
    { url: 'http://172.16.0.1/hook',                      desc: 'private 172.16.x' },
    { url: 'http://172.31.255.255/hook',                  desc: 'private 172.31.x (upper bound)' },
    { url: 'http://169.254.169.254/latest/meta-data/',    desc: 'AWS instance metadata (link-local)' },
    // IPv6 literals (URL.hostname includes brackets — must be stripped before matching)
    { url: 'http://[::1]/hook',                           desc: 'IPv6 loopback ::1' },
    { url: 'http://[fd00::1]/hook',                       desc: 'IPv6 ULA fd00::1' },
    { url: 'http://[fc00::1]/hook',                       desc: 'IPv6 ULA fc00::1' },
    { url: 'http://[fe80::1]/hook',                       desc: 'IPv6 link-local fe80::1' },
    // IPv4-mapped IPv6 wrapping private addresses
    { url: 'http://[::ffff:127.0.0.1]/hook',              desc: 'IPv4-mapped IPv6 loopback ::ffff:127.0.0.1' },
    { url: 'http://[::ffff:10.0.0.1]/hook',               desc: 'IPv4-mapped IPv6 private ::ffff:10.0.0.1' },
    { url: 'http://[::ffff:192.168.1.1]/hook',            desc: 'IPv4-mapped IPv6 private ::ffff:192.168.1.1' },
  ];

  for (const { url, desc } of badUrls) {
    it(`rejects ${desc} (${url})`, async () => {
      const { default: intRouter } = await import('../src/routes/integrations');
      const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
      const res = await request(app).post('/api/integrations/webhooks').send({ url });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  }

  it('accepts a valid public HTTPS URL', async () => {
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).post('/api/integrations/webhooks').send({
      url: 'https://my-erp.example.com/hook',
      events: ['supplier.tier_changed'],
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('enforces 5-webhook limit per admin', async () => {
    apiKeyRows = [1, 2, 3, 4, 5].map(id => ({ id }));
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).post('/api/integrations/webhooks').send({ url: 'https://sixth.example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Maximum 5/);
  });
});

describe('POST /api/integrations/webhooks/:id/test', () => {
  it('returns 404 when webhook is not found for this admin', async () => {
    apiKeyRows = [];
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).post('/api/integrations/webhooks/99/test');
    expect(res.status).toBe(404);
  });

  it('dispatches the test event and returns result', async () => {
    apiKeyRows = [{ id: 3, userId: 1, url: 'https://example.com/hook', events: [] }];
    const { default: intRouter } = await import('../src/routes/integrations');
    const app = makeApp('/api/integrations', intRouter, ADMIN_SESSION);
    const res = await request(app).post('/api/integrations/webhooks/3/test');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.success).toBe(true);
  });
});
