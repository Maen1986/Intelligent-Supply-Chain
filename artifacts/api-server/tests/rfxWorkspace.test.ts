/**
 * /api/rfx-workspace -- T2 server-sync pass for the #395 Category-Aware RFx
 * Scope Build & Review Engine panel (registry #371, 28 Aug 2026).
 *
 * Stores the whole workspace object under tool_data.rfxWorkspace, same
 * JSONB-blob-under-tool_data pattern as /api/plans's generatedPlans key --
 * see tests/plans.test.ts for the harness this mirrors.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, makeDbMock, makeLoggerMock, resetDbState } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

import rfxWorkspaceRouter from '../src/routes/rfxWorkspace';
import { db } from '@workspace/db';

const USER_ID = 42;

function makeAuthApp() {
  return makeApp('/', rfxWorkspaceRouter, { userId: USER_ID });
}

function stubDb(toolData: Record<string, unknown>) {
  vi.mocked(db.execute)
    .mockResolvedValueOnce({ rows: [{ tool_data: toolData }] } as any)
    .mockResolvedValue({ rows: [] } as any);
}

const VALID_WORKSPACE = {
  selection: { specificationsFixed: true, supplierCapabilityKnown: false, needsApproachComparison: true },
  criteria: [{ id: 'price', label: 'Price', weight: 40 }],
  bidders: [{ bidderId: 'b1', bidderName: 'Acme Co', scores: {} }],
  scopeBucket: 'construction',
  scopeComplexity: 'level-2-standard',
  fieldEntries: { field1: { completeness: 'complete' } },
  wbsFilled: { wbs1: true },
  responseEntries: { resp1: { status: 'compliant' } },
};

beforeEach(() => {
  resetDbState();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/rfx-workspace
══════════════════════════════════════════════════════════════════════════ */

describe('GET /api/rfx-workspace', () => {
  it('returns 401 when not authenticated', async () => {
    const app = makeApp('/', rfxWorkspaceRouter, {});
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });

  it('returns { ok: true, workspace: null } when nothing has been synced yet', async () => {
    const app = makeAuthApp();
    stubDb({});
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, workspace: null });
  });

  it('returns the saved workspace when one exists', async () => {
    const app = makeAuthApp();
    stubDb({ rfxWorkspace: VALID_WORKSPACE });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.workspace).toEqual(VALID_WORKSPACE);
  });

  it('does not leak an unrelated tool_data key (generatedPlans) into the response', async () => {
    const app = makeAuthApp();
    stubDb({ generatedPlans: { kpi: { text: 'x', savedAt: '2026-01-01' } } });
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.workspace).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/rfx-workspace
══════════════════════════════════════════════════════════════════════════ */

describe('PUT /api/rfx-workspace', () => {
  it('returns 401 when not authenticated', async () => {
    const app = makeApp('/', rfxWorkspaceRouter, {});
    const res = await request(app).put('/').send({ workspace: VALID_WORKSPACE });
    expect(res.status).toBe(401);
  });

  it('accepts a valid workspace and persists it under tool_data.rfxWorkspace', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockResolvedValue({ rows: [] } as any);

    const res = await request(app).put('/').send({ workspace: VALID_WORKSPACE });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const updateCallJson = JSON.stringify(vi.mocked(db.execute).mock.calls[0]);
    expect(updateCallJson).toContain('rfxWorkspace');
    expect(updateCallJson).toContain('construction');
  });

  it('returns 400 when workspace is missing entirely', async () => {
    const app = makeAuthApp();
    const res = await request(app).put('/').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 when criteria is not an array', async () => {
    const app = makeAuthApp();
    const bad = { ...VALID_WORKSPACE, criteria: 'not-an-array' };
    const res = await request(app).put('/').send({ workspace: bad });
    expect(res.status).toBe(400);
  });

  it('returns 400 when scopeBucket is missing', async () => {
    const app = makeAuthApp();
    const { scopeBucket, ...rest } = VALID_WORKSPACE;
    const res = await request(app).put('/').send({ workspace: rest });
    expect(res.status).toBe(400);
  });

  it('returns 400 when fieldEntries is not an object', async () => {
    const app = makeAuthApp();
    const bad = { ...VALID_WORKSPACE, fieldEntries: 'nope' };
    const res = await request(app).put('/').send({ workspace: bad });
    expect(res.status).toBe(400);
  });

  it('accepts an empty (freshly-reset) workspace shape', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockResolvedValue({ rows: [] } as any);
    const empty = {
      selection: {}, criteria: [], bidders: [],
      scopeBucket: '', scopeComplexity: 'level-2-standard',
      fieldEntries: {}, wbsFilled: {}, responseEntries: {},
    };
    const res = await request(app).put('/').send({ workspace: empty });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 500 when the db update throws', async () => {
    const app = makeAuthApp();
    vi.mocked(db.execute).mockRejectedValue(new Error('db down'));
    const res = await request(app).put('/').send({ workspace: VALID_WORKSPACE });
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
