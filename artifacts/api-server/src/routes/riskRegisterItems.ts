/**
 * /api/risk-register-items -- server store for the E4 risk register (#866).
 *
 * Whole-state sync, same pattern as working_capital_analyses:
 *   GET /api/risk-register-items  -- the signed-in user's register.
 *   PUT /api/risk-register-items  -- transactionally REPLACE all of the
 *     user's risks with the given array; returns the stored rows.
 * Auth: session cookie only. Each user reads and writes only their own rows;
 * no admin route reads them. The score is never stored.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { riskRegisterItemsTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

export const MAX_RISKS = 500;
export const exceedsCap = (n: number) => n > MAX_RISKS;
const CATEGORIES = ['supply', 'demand', 'operational', 'financial', 'geopolitical', 'regulatory', 'cyber', 'environmental'];
const VELOCITIES = ['slow', 'medium', 'fast'];
const STATUSES = ['open', 'in-progress', 'closed', 'accepted'];
const MITIGATION_STATUSES = ['not-started', 'in-progress', 'completed'];
const SOURCES = ['manual', 'imported-file'];

interface RiskPayload {
  clientKey: string; category: string; description: string; driver: string; affectedArea: string;
  likelihood: number; impact: number; velocity: string; mitigationAction: string; owner: string;
  dueDate: string; status: string; mitigationStatus: string;
  residualLikelihood: number; residualImpact: number; dataSource?: string;
}

const isScale = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

export function isValidRisk(a: unknown): a is RiskPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0 && r.clientKey.length <= 100
    && typeof r.category === 'string' && CATEGORIES.includes(r.category)
    && isText(r.description, 4000)
    && isText(r.driver, 2000) && isText(r.affectedArea, 2000)
    && isScale(r.likelihood) && isScale(r.impact)
    && typeof r.velocity === 'string' && VELOCITIES.includes(r.velocity)
    && isText(r.mitigationAction, 4000) && isText(r.owner, 500) && isText(r.dueDate, 40)
    && typeof r.status === 'string' && STATUSES.includes(r.status)
    && typeof r.mitigationStatus === 'string' && MITIGATION_STATUSES.includes(r.mitigationStatus)
    && isScale(r.residualLikelihood) && isScale(r.residualImpact)
    && (r.dataSource === undefined || (typeof r.dataSource === 'string' && SOURCES.includes(r.dataSource)));
}

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db.select().from(riskRegisterItemsTable).where(eq(riskRegisterItemsTable.userId, userId));
    rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id - b.id);
    res.json({ ok: true, risks: rows });
  } catch (err) {
    logger.error({ err }, '[risk-register-items] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

router.put('/', async (req, res) => {
  const body = req.body as { risks?: unknown };
  if (!Array.isArray(body.risks) || !body.risks.every(isValidRisk)) {
    res.status(400).json({ ok: false, error: 'Invalid risks shape -- every risk needs a clientKey, a known category, velocity and statuses, and likelihood, impact and residual values as whole numbers 1 to 5' });
    return;
  }
  const risks = body.risks as RiskPayload[];
  if (exceedsCap(risks.length)) {
    res.status(400).json({ ok: false, error: `Too many risks in one sync (max ${MAX_RISKS})` });
    return;
  }
  if (new Set(risks.map(r => r.clientKey)).size !== risks.length) {
    res.status(400).json({ ok: false, error: 'Duplicate clientKey in one sync' });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const [userRow] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const organizationId = userRow?.organizationId ?? null;
    const inserted = await db.transaction(async (tx) => {
      await tx.delete(riskRegisterItemsTable).where(eq(riskRegisterItemsTable.userId, userId));
      if (risks.length === 0) return [];
      return tx.insert(riskRegisterItemsTable).values(risks.map((r) => ({
        userId, organizationId,
        clientKey: r.clientKey, category: r.category, description: r.description,
        driver: r.driver, affectedArea: r.affectedArea,
        likelihood: r.likelihood, impact: r.impact, velocity: r.velocity,
        mitigationAction: r.mitigationAction, owner: r.owner, dueDate: r.dueDate,
        status: r.status, mitigationStatus: r.mitigationStatus,
        residualLikelihood: r.residualLikelihood, residualImpact: r.residualImpact,
        dataSource: r.dataSource ?? 'manual',
      }))).returning();
    });
    logger.info({ userId, count: inserted.length }, '[risk-register-items] Synced');
    res.json({ ok: true, risks: inserted });
  } catch (err) {
    logger.error({ err }, '[risk-register-items] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
