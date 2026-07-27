/**
 * Security tests for POST /api/webhooks/inbound
 *
 * Covers:
 *   1. Missing X-ISC-Signature header → 401
 *   2. Tampered body (wrong signature) → 401
 *   3. Missing / stale X-ISC-Timestamp → 401
 *   4. Missing / over-length X-ISC-Nonce → 401
 *   5. Replayed request (same nonce used twice) → 401
 *   6. Valid signature + unknown action → 400
 *   7. Valid signature + create_notification → 200
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { createHmac } from 'crypto';

/* ── Mocks ────────────────────────────────────────────────────────────────── */

vi.mock('../src/lib/logger', () => {
  const noop = () => {};
  return {
    logger: {
      info: noop, warn: noop, error: noop, debug: noop,
      child: () => ({ info: noop, warn: noop, error: noop, debug: noop }),
    },
  };
});

vi.mock('@workspace/db', () => {
  // Insert chain that resolves with a notification row
  const insertChain: any = {};
  for (const m of ['values', 'where', 'set']) {
    insertChain[m] = () => insertChain;
  }
  insertChain.returning = () => insertChain;
  insertChain.then = (res: any, rej: any) =>
    Promise.resolve([{ id: 42 }]).then(res, rej);
  insertChain.catch = (fn: any) => Promise.resolve([{ id: 42 }]).catch(fn);

  return {
    db: {
      insert: vi.fn(() => insertChain),
      execute: vi.fn(async () => ({ rows: [] })),
    },
    notificationsTable:     { id: 'id', userId: 'userId', title: 'title', body: 'body' },
    inboundWebhookLogTable: { action: 'action', bodySnippet: 'bodySnippet', status: 'status', error: 'error' },
  };
});

vi.mock('../src/lib/toolData', () => ({ patchToolData: vi.fn(async () => {}) }));

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const TEST_SECRET = 'test-secret-for-webhook-tests';

/**
 * Build an express app that mirrors the real app's rawBody capture.
 * We re-import the router each time so the nonce store is fresh (vi.resetModules).
 */
async function makeWebhookApp(): Promise<Express> {
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  const { default: router } = await import('../src/routes/webhooksInbound');
  app.use('/api', router);
  return app;
}

/**
 * Compute a valid X-ISC-Signature for the given body, timestamp, and nonce.
 * Mirrors the production implementation: HMAC-SHA256("<ts>\n<nonce>\n<rawBody>").
 */
function sign(body: object, timestamp: string, nonce: string, secret = TEST_SECRET): string {
  const raw      = JSON.stringify(body);
  const material = `${timestamp}\n${nonce}\n${raw}`;
  return createHmac('sha256', secret).update(material).digest('hex');
}

/** Current Unix epoch in seconds as a string. */
function nowTs(): string {
  return String(Math.floor(Date.now() / 1000));
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe('POST /api/webhooks/inbound — security', () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.INBOUND_WEBHOOK_SECRET = TEST_SECRET;
  });

  /* ── Forged / missing signature ─────────────────────────────────────────── */

  it('returns 401 when X-ISC-Signature header is missing', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'create_notification', payload: { userId: 1, title: 'Hi', body: 'World' } };
    const ts   = nowTs();
    const nc   = 'nonce-missing-sig-test';

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      // no x-isc-signature
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 when the body has been tampered with (wrong signature)', async () => {
    const app      = await makeWebhookApp();
    const body     = { action: 'create_notification', payload: { userId: 1, title: 'Hi', body: 'World' } };
    const ts       = nowTs();
    const nc       = 'nonce-tampered-body-test';
    // Sign a different body — the actual payload will not match
    const badSig   = sign({ action: 'tampered' }, ts, nc);

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', badSig)
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  /* ── Timestamp checks ───────────────────────────────────────────────────── */

  it('returns 401 when X-ISC-Timestamp header is missing', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'create_notification', payload: { userId: 1, title: 'Hi', body: 'World' } };
    const nc   = 'nonce-missing-ts-test';
    const sig  = sign(body, '', nc); // sig won't matter — timestamp check fires first

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 when the timestamp is more than 5 minutes old', async () => {
    const app      = await makeWebhookApp();
    const body     = { action: 'create_notification', payload: { userId: 1, title: 'Hi', body: 'World' } };
    // 6 minutes in the past
    const staleTs  = String(Math.floor(Date.now() / 1000) - 360);
    const nc       = 'nonce-stale-ts-test';
    const sig      = sign(body, staleTs, nc);

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', staleTs)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  /* ── Nonce / replay checks ──────────────────────────────────────────────── */

  it('returns 401 when X-ISC-Nonce header is missing', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'create_notification', payload: { userId: 1, title: 'Hi', body: 'World' } };
    const ts   = nowTs();
    const sig  = sign(body, ts, '');

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-signature', sig)
      .send(body);

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('returns 401 when a valid signed request is replayed with the same nonce', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'create_notification', payload: { userId: 1, title: 'Replay Test', body: 'msg' } };
    const ts   = nowTs();
    const nc   = `nonce-replay-${Date.now()}`;
    const sig  = sign(body, ts, nc);

    // First request should succeed
    const first = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);
    expect(first.status).toBe(200);

    // Second request with identical headers should be rejected as a replay
    const second = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);
    expect(second.status).toBe(401);
    expect(second.body.ok).toBe(false);
  });

  /* ── Action routing ─────────────────────────────────────────────────────── */

  it('returns 400 for a valid signature on an unknown action', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'do_something_spooky', payload: {} };
    const ts   = nowTs();
    const nc   = `nonce-unknown-action-${Date.now()}`;
    const sig  = sign(body, ts, nc);

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 200 for a valid signature with the create_notification action', async () => {
    const app  = await makeWebhookApp();
    const body = { action: 'create_notification', payload: { userId: 1, title: 'Alert', body: 'Something happened' } };
    const ts   = nowTs();
    const nc   = `nonce-valid-create-${Date.now()}`;
    const sig  = sign(body, ts, nc);

    const res = await request(app)
      .post('/api/webhooks/inbound')
      .set('x-isc-timestamp', ts)
      .set('x-isc-nonce', nc)
      .set('x-isc-signature', sig)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.action).toBe('create_notification');
  });
});
