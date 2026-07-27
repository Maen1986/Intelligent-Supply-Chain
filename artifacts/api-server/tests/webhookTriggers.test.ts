/**
 * Tests for automatic webhook event dispatch:
 *   - supplier.tier_changed  (PUT /api/scorecard-roster)
 *   - kpi.rag_changed        (POST /api/v1/kpis/import)
 *   - kri.threshold_breached (POST /api/v1/risk-kris/import)
 *
 * dispatchEvent is mocked so we only assert on what would be dispatched —
 * the delivery transport layer is covered by its own unit tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { makeApp, resetDbState, makeDbMock, makeLoggerMock } from './helpers';

vi.mock('@workspace/db', () => makeDbMock());
vi.mock('../src/lib/logger', () => makeLoggerMock());

// vi.hoisted ensures the variable is available when the hoisted vi.mock factory runs
const { mockDispatchEvent } = vi.hoisted(() => ({ mockDispatchEvent: vi.fn() }));
vi.mock('../src/lib/webhookDispatch', () => ({ dispatchEvent: mockDispatchEvent }));

// Bypass API-key/session auth for v1 routes
vi.mock('../src/middlewares/requireApiKeyOrSession', () => ({
  requireApiKeyOrSession: (_req: any, res: any, next: any) => {
    res.locals.userId = 1;
    next();
  },
}));

import scorecardRosterRouter from '../src/routes/scorecardRoster';
import v1Router from '../src/routes/v1';

beforeEach(() => {
  resetDbState();
  mockDispatchEvent.mockClear();
});

/* ══════════════════════════════════════════════════════════════════════════
   supplier.tier_changed
══════════════════════════════════════════════════════════════════════════ */

describe('supplier.tier_changed webhook event', () => {
  const existingRoster = {
    suppliers: [{ id: 'sup-1', name: 'Acme Corp', tier: 'Preferred', subScores: {} }],
    activeId: 'sup-1',
  };
  const updatedRoster = {
    suppliers: [{ id: 'sup-1', name: 'Acme Corp', tier: 'Strategic', subScores: {} }],
    activeId: 'sup-1',
  };

  it('dispatches supplier.tier_changed when a supplier tier changes', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // pre-read returns the existing roster; UPDATE succeeds
    executeMock
      .mockResolvedValueOnce({ rows: [{ scorecard_roster: existingRoster }] })
      .mockResolvedValueOnce({ rows: [] });

    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    const res = await request(app).put('/api/scorecard-roster').send(updatedRoster);

    expect(res.status).toBe(200);
    // supplier.tier_changed + supplier.updated (bulk save confirmation)
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'supplier.tier_changed',
      expect.objectContaining({
        supplierId: 'sup-1',
        oldTier: 'Preferred',
        newTier: 'Strategic',
      }),
    );
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'supplier.updated',
      expect.objectContaining({ supplierCount: expect.any(Number) }),
    );
  });

  it('does NOT dispatch supplier.tier_changed when a supplier tier is unchanged', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [{ scorecard_roster: existingRoster }] })
      .mockResolvedValueOnce({ rows: [] });

    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    // Send the same roster (tier unchanged) — supplier.updated still fires
    await request(app).put('/api/scorecard-roster').send(existingRoster);

    // supplier.updated always fires on save; supplier.tier_changed must NOT fire
    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchEvent).toHaveBeenCalledWith(1, 'supplier.updated', expect.any(Object));
    expect(mockDispatchEvent).not.toHaveBeenCalledWith(1, 'supplier.tier_changed', expect.anything());
  });

  it('does NOT dispatch supplier.tier_changed when there is no prior roster', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // No existing roster
    executeMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    await request(app).put('/api/scorecard-roster').send(updatedRoster);

    // supplier.updated always fires; no tier_changed without a prior roster to diff against
    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchEvent).toHaveBeenCalledWith(1, 'supplier.updated', expect.any(Object));
    expect(mockDispatchEvent).not.toHaveBeenCalledWith(1, 'supplier.tier_changed', expect.anything());
  });

  it('dispatches once per changed supplier when multiple tiers change', async () => {
    const multiRosterOld = {
      suppliers: [
        { id: 'a', name: 'A', tier: 'Preferred', subScores: {} },
        { id: 'b', name: 'B', tier: 'Transactional', subScores: {} },
        { id: 'c', name: 'C', tier: 'Strategic', subScores: {} },
      ],
      activeId: 'a',
    };
    const multiRosterNew = {
      suppliers: [
        { id: 'a', name: 'A', tier: 'Strategic', subScores: {} },   // changed
        { id: 'b', name: 'B', tier: 'Transactional', subScores: {} }, // unchanged
        { id: 'c', name: 'C', tier: 'Preferred', subScores: {} },   // changed
      ],
      activeId: 'a',
    };

    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({ rows: [{ scorecard_roster: multiRosterOld }] })
      .mockResolvedValueOnce({ rows: [] });

    const app = makeApp('/api/scorecard-roster', scorecardRosterRouter, { userId: 1 });
    await request(app).put('/api/scorecard-roster').send(multiRosterNew);

    // 2x supplier.tier_changed + 1x supplier.updated
    expect(mockDispatchEvent).toHaveBeenCalledTimes(3);
    const calls = mockDispatchEvent.mock.calls;
    const tierChangedCalls = calls.filter((c: any[]) => c[1] === 'supplier.tier_changed');
    const ids = tierChangedCalls.map((c: any[]) => c[2].supplierId);
    expect(ids).toContain('a');
    expect(ids).toContain('c');
    expect(ids).not.toContain('b');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   kpi.rag_changed
══════════════════════════════════════════════════════════════════════════ */

describe('kpi.rag_changed webhook event', () => {
  const THRESHOLDS = {
    delivery: { amber: 80, red: 60, higherIsBetter: true },
    cost:     { amber: 10, red: 20, higherIsBetter: false },
  };

  it('dispatches kpi.rag_changed when a KPI crosses a band boundary (with thresholds)', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // Existing KPI: delivery=85 (green), cost=5 (green)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { kpis: { slug: 'q1', values: { delivery: '85', cost: '5' } } } }],
      })
      .mockResolvedValueOnce({ rows: [] }); // patchToolData inner getUserRow
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    // delivery drops to 75 (amber), cost stays green at 8
    const res = await request(app)
      .post('/api/v1/kpis/import')
      .send({ slug: 'q1', values: { delivery: '75', cost: '8' }, thresholds: THRESHOLDS });

    expect(res.status).toBe(200);
    // kpi.rag_changed + kpi.imported (bulk confirmation)
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kpi.rag_changed',
      expect.objectContaining({
        kpiId: 'delivery',
        oldStatus: 'green',
        newStatus: 'amber',
      }),
    );
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kpi.imported',
      expect.objectContaining({ slug: 'q1' }),
    );
  });

  it('does NOT dispatch kpi.rag_changed when a KPI value changes but stays in the same band', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // delivery=85 (green) → 82 (still green)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { kpis: { slug: 'q1', values: { delivery: '85' } } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    await request(app)
      .post('/api/v1/kpis/import')
      .send({ slug: 'q1', values: { delivery: '82' }, thresholds: THRESHOLDS });

    // kpi.imported always fires; kpi.rag_changed must NOT fire
    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchEvent).toHaveBeenCalledWith(1, 'kpi.imported', expect.any(Object));
    expect(mockDispatchEvent).not.toHaveBeenCalledWith(1, 'kpi.rag_changed', expect.anything());
  });

  it('dispatches when a KPI jumps directly from green to red', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // delivery=85 (green) → 50 (red, below the red threshold of 60)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { kpis: { slug: 'q1', values: { delivery: '85' } } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    await request(app)
      .post('/api/v1/kpis/import')
      .send({ slug: 'q1', values: { delivery: '50' }, thresholds: THRESHOLDS });

    // kpi.rag_changed + kpi.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kpi.rag_changed',
      expect.objectContaining({ kpiId: 'delivery', oldStatus: 'green', newStatus: 'red' }),
    );
  });

  it('falls back to value-change detection when no thresholds are provided', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { kpis: { slug: 'q1', values: { delivery: '85' } } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    // No thresholds — any value change triggers
    await request(app)
      .post('/api/v1/kpis/import')
      .send({ slug: 'q1', values: { delivery: '84' } });

    // kpi.rag_changed + kpi.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kpi.rag_changed',
      expect.objectContaining({ kpiId: 'delivery', oldValue: '85', newValue: '84' }),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   kri.threshold_breached
══════════════════════════════════════════════════════════════════════════ */

describe('kri.threshold_breached webhook event', () => {
  const KRI_ROWS_GREEN_TO_AMBER = [
    { id: 'concentration', label: 'Supplier Concentration', value: 42, amber: 40, red: 60, higherIsBetter: false },
  ];
  const KRI_ROWS_UNCHANGED = [
    { id: 'concentration', value: 35, amber: 40, red: 60, higherIsBetter: false },
  ];
  const KRI_ROWS_GREEN_TO_RED = [
    { id: 'concentration', label: 'Supplier Concentration', value: 65, amber: 40, red: 60, higherIsBetter: false },
  ];

  it('dispatches kri.threshold_breached when a KRI moves from green to amber', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // Old value: concentration=35 (green); new value: 42 (amber)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { concentration: '35' } } }],
      })
      .mockResolvedValueOnce({ rows: [] }); // patchToolData inner getUserRow
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .post('/api/v1/risk-kris/import')
      .send({ kris: KRI_ROWS_GREEN_TO_AMBER });

    expect(res.status).toBe(200);
    // kri.threshold_breached + risk_kri.imported (bulk confirmation)
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kri.threshold_breached',
      expect.objectContaining({
        kriId: 'concentration',
        oldStatus: 'green',
        newStatus: 'amber',
        oldValue: 35,
        newValue: 42,
      }),
    );
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'risk_kri.imported',
      expect.objectContaining({ imported: 1 }),
    );
  });

  it('dispatches kri.threshold_breached when a KRI jumps directly from green to red', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { concentration: '35' } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .post('/api/v1/risk-kris/import')
      .send({ kris: KRI_ROWS_GREEN_TO_RED });

    expect(res.status).toBe(200);
    // kri.threshold_breached + risk_kri.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kri.threshold_breached',
      expect.objectContaining({ kriId: 'concentration', oldStatus: 'green', newStatus: 'red' }),
    );
  });

  it('does NOT dispatch kri.threshold_breached when the KRI value stays in the green zone', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { concentration: '30' } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    await request(app).post('/api/v1/risk-kris/import').send({ kris: KRI_ROWS_UNCHANGED });

    // risk_kri.imported always fires; threshold_breached must NOT fire
    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchEvent).toHaveBeenCalledWith(1, 'risk_kri.imported', expect.any(Object));
    expect(mockDispatchEvent).not.toHaveBeenCalledWith(1, 'kri.threshold_breached', expect.anything());
  });

  it('does NOT dispatch kri.threshold_breached when the KRI was already amber and stays amber', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // Old value 42 (amber); new value 45 (still amber)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { concentration: '42' } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    await request(app)
      .post('/api/v1/risk-kris/import')
      .send({ kris: [{ id: 'concentration', value: 45, amber: 40, red: 60, higherIsBetter: false }] });

    // risk_kri.imported always fires; threshold_breached must NOT fire
    expect(mockDispatchEvent).toHaveBeenCalledTimes(1);
    expect(mockDispatchEvent).toHaveBeenCalledWith(1, 'risk_kri.imported', expect.any(Object));
    expect(mockDispatchEvent).not.toHaveBeenCalledWith(1, 'kri.threshold_breached', expect.anything());
  });

  it('dispatches kri.threshold_breached when a KRI jumps green→red with higherIsBetter: true', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // OTIF: old value 90 (green, above amber=80); new value 50 (red, below red=60)
    // Skips the amber band entirely in a single import
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { otif: '90' } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .post('/api/v1/risk-kris/import')
      .send({
        kris: [{ id: 'otif', label: 'On-Time In-Full', value: 50, amber: 80, red: 60, higherIsBetter: true }],
      });

    expect(res.status).toBe(200);
    // Exactly one kri.threshold_breached + one risk_kri.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kri.threshold_breached',
      expect.objectContaining({
        kriId:     'otif',
        oldStatus: 'green',
        newStatus: 'red',
        oldValue:  90,
        newValue:  50,
        higherIsBetter: true,
      }),
    );
  });

  it('dispatches when the KRI moves from amber to red', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // Old: amber (42); new: red (65)
    executeMock
      .mockResolvedValueOnce({
        rows: [{ scorecard_roster: null, tool_data: { riskKris: { concentration: '42' } } }],
      })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    await request(app)
      .post('/api/v1/risk-kris/import')
      .send({ kris: KRI_ROWS_GREEN_TO_RED });

    // kri.threshold_breached + risk_kri.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kri.threshold_breached',
      expect.objectContaining({ oldStatus: 'amber', newStatus: 'red' }),
    );
  });

  it('treats a KRI with no prior stored value as green when checking for worsening', async () => {
    const { db } = await import('@workspace/db');
    const executeMock = db.execute as ReturnType<typeof vi.fn>;
    // No existing KRI data at all
    executeMock
      .mockResolvedValueOnce({ rows: [{ scorecard_roster: null, tool_data: {} }] })
      .mockResolvedValueOnce({ rows: [] });
    executeMock.mockResolvedValue({ rows: [] });

    const app = makeApp('/api/v1', v1Router);
    const res = await request(app)
      .post('/api/v1/risk-kris/import')
      .send({ kris: KRI_ROWS_GREEN_TO_AMBER });

    expect(res.status).toBe(200);
    // kri.threshold_breached + risk_kri.imported
    expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      1,
      'kri.threshold_breached',
      expect.objectContaining({ oldValue: null, newValue: 42, oldStatus: 'green', newStatus: 'amber' }),
    );
  });

  it('returns 400 when the body is missing the kris array', async () => {
    const app = makeApp('/api/v1', v1Router);
    const res = await request(app).post('/api/v1/risk-kris/import').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
