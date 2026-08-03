/**
 * /api/plans/:toolKey — plan save/load/delete and legacy 'scorecard' migration (Task 360).
 *
 * Tests the GET endpoint's one-time migration that moves a bare "scorecard" plan
 * to the new "scorecard-{supplierId}" key, confirms the old key is deleted, and
 * verifies a second GET for a different supplier does not pick up the already-
 * migrated plan.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeDbMock, makeLoggerMock, resetDbState } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());
vi.mock('../src/lib/webhookDispatch', () => ({
  dispatchEvent: vi.fn(async () => {}),
}));

import plansRouter from '../src/routes/plans';
import { db } from '@workspace/db';

const USER_ID = 42;

function makeAuthApp() {
  return makeApp('/', plansRouter, { userId: USER_ID });
}

/** Stub db.execute to return the given tool_data on the first SELECT call,
 *  then return empty rows for any subsequent UPDATE. */
function stubDb(toolData: Record<string, unknown>) {
  vi.mocked(db.execute)
    .mockResolvedValueOnce({ rows: [{ tool_data: toolData }] } as any)
    .mockResolvedValue({ rows: [] } as any);
}

const LEGACY_PLAN = { text: 'Legacy scorecard plan', savedAt: '2026-01-01T10:00:00.000Z' };
const SUPPLIER_ID = 'sup-abc-123';
const NEW_KEY     = `scorecard-${SUPPLIER_ID}`;

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   Basic CRUD
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/plans/:toolKey — basic', () => {
  it('returns 401 when not authenticated', async () => {
    const app = makeApp('/', plansRouter, {});
    const res = await request(app).get('/kpi');
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid toolKey', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockResolvedValue({ rows: [] } as any);
    const res = await request(app).get('/INVALID KEY!');
    expect(res.status).toBe(400);
  });

  it('returns { ok: true, plan: null } when no plan exists', async () => {
    const app = makeAuthApp();
    stubDb({ generatedPlans: {} });
    const res = await request(app).get('/kpi');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, plan: null });
  });

  it('returns the saved plan when one exists for the toolKey', async () => {
    const app = makeAuthApp();
    stubDb({ generatedPlans: { kpi: { text: 'KPI plan', savedAt: '2026-06-01T10:00:00.000Z' } } });
    const res = await request(app).get('/kpi');
    expect(res.status).toBe(200);
    expect(res.body.plan?.text).toBe('KPI plan');
  });
});

describe('POST /api/plans/:toolKey — basic', () => {
  it('saves a new plan and returns savedAt', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockResolvedValue({ rows: [{ tool_data: { generatedPlans: {} } }] } as any);
    const res = await request(app)
      .post('/kpi')
      .send({ text: 'New plan' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.savedAt).toBe('string');
  });

  it('returns 400 when text is missing', async () => {
    const app = makeAuthApp();
    const res = await request(app).post('/kpi').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/plans/:toolKey — basic', () => {
  it('returns { ok: true } when deletion succeeds', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockResolvedValue({ rows: [{ tool_data: { generatedPlans: { kpi: LEGACY_PLAN } } }] } as any);
    const res = await request(app).delete('/kpi');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Task 360 — Legacy 'scorecard' → 'scorecard-{supplierId}' migration
══════════════════════════════════════════════════════════════════════════ */

describe("GET /api/plans/:toolKey — legacy 'scorecard' migration (Task 360)", () => {
  it('returns the migrated plan when a bare "scorecard" plan exists and the new key is requested', async () => {
    const app = makeAuthApp();
    // DB holds the old bare 'scorecard' key
    stubDb({ generatedPlans: { scorecard: LEGACY_PLAN } });

    const res = await request(app).get(`/${NEW_KEY}`);

    expect(res.status).toBe(200);
    expect(res.body.plan?.text).toBe(LEGACY_PLAN.text);
    expect(res.body.plan?.savedAt).toBe(LEGACY_PLAN.savedAt);
  });

  it('calls saveGeneratedPlans (an extra db.execute) after migration to persist the new key', async () => {
    const app = makeAuthApp();
    stubDb({ generatedPlans: { scorecard: LEGACY_PLAN } });

    await request(app).get(`/${NEW_KEY}`);

    // db.execute is called twice: SELECT then UPDATE (the migration triggers a save)
    const executeCalls = vi.mocked(db.execute).mock.calls;
    expect(executeCalls.length).toBe(2);

    // The UPDATE call's second arg (the SQL params array) should contain a JSON
    // blob that includes the new key and does NOT include the bare 'scorecard' key.
    // Drizzle's sql`` tag stores values in its second argument or in queryChunks;
    // we serialise the whole call to a plain string for a broad but reliable check.
    const updateCallJson = JSON.stringify(executeCalls[1]);
    expect(updateCallJson).toContain(NEW_KEY);
    // Bare 'scorecard' entry must not survive — only the new per-supplier key remains
    expect(updateCallJson).not.toMatch(/"scorecard":\{"text"/);
  });

  it('does NOT migrate when the new scorecard key is requested but no legacy plan exists', async () => {
    const app = makeAuthApp();
    // DB has no plans at all
    stubDb({ generatedPlans: {} });

    const res = await request(app).get(`/${NEW_KEY}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toBeNull();

    // Only a SELECT was issued — no UPDATE
    expect(vi.mocked(db.execute).mock.calls.length).toBe(1);
  });

  it('does NOT migrate when a non-scorecard toolKey is requested', async () => {
    const app = makeAuthApp();
    // DB has a bare 'scorecard' plan AND a 'kpi' plan
    stubDb({ generatedPlans: { scorecard: LEGACY_PLAN, kpi: { text: 'KPI plan', savedAt: '2026-01-01T00:00:00.000Z' } } });

    const res = await request(app).get('/kpi');

    expect(res.status).toBe(200);
    expect(res.body.plan?.text).toBe('KPI plan');

    // Only a SELECT — no migration UPDATE
    expect(vi.mocked(db.execute).mock.calls.length).toBe(1);
  });

  it('does NOT return the legacy plan for a second different supplier after migration', async () => {
    const app = makeAuthApp();
    // After migration, only the new key exists — bare 'scorecard' is gone
    stubDb({ generatedPlans: { [NEW_KEY]: LEGACY_PLAN } });

    const res = await request(app).get('/scorecard-sup-different-999');

    expect(res.status).toBe(200);
    // Different supplier gets no plan — the migrated plan belongs to SUPPLIER_ID only
    expect(res.body.plan).toBeNull();
  });
});
