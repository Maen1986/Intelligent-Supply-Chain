/**
 * /api/negotiation-cases -- server persistence for the Negotiation Desk (E3, N0, 5 Nov 2026).
 * Whole-state sync, same shape as the existing RAR and supplier-dependency routes:
 *   GET /api/negotiation-cases -- list the authenticated user's saved cases (newest first).
 *   PUT /api/negotiation-cases -- transactionally REPLACE all of the user's cases with the given
 *     array of {clientKey, name, data} (max 20). `data` is validated structurally only; the shape is
 *     owned by the frontend (NegotiationDesk.tsx). Session cookie auth only; rows are scoped to the
 *     owning user.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { negotiationCasesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Cap per sync: a handful of named cases per user, not a business register. */
const MAX_CASES_PER_SYNC = 20;

interface NegotiationCasePayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is NegotiationCasePayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/negotiation-cases ─────────────────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(negotiationCasesTable)
      .where(eq(negotiationCasesTable.userId, userId));
    // Newest-edited first -- matches the tco/spend-variance/clm-contracts
    // list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, cases: rows });
  } catch (err) {
    logger.error({ err }, '[negotiation-cases] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/negotiation-cases ─────────────────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { cases?: unknown };
  if (!Array.isArray(body.cases) || !body.cases.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid cases shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const cases = body.cases as NegotiationCasePayload[];
  if (cases.length > MAX_CASES_PER_SYNC) {
    res.status(400).json({ ok: false, error: `Too many cases in one sync (max ${MAX_CASES_PER_SYNC})` });
    return;
  }
  try {
    const userId = res.locals.userId as number;

    // Look up the user's current organization_id (may be null) so new rows
    // carry it -- see schema file header for why this is captured but not
    // yet used for access control.
    const [userRow] = await db
      .select({ organizationId: usersTable.organizationId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const organizationId = userRow?.organizationId ?? null;

    const inserted = await db.transaction(async (tx) => {
      await tx.delete(negotiationCasesTable).where(eq(negotiationCasesTable.userId, userId));
      if (cases.length === 0) return [];
      return tx
        .insert(negotiationCasesTable)
        .values(cases.map((a) => ({
          userId,
          organizationId,
          clientKey: a.clientKey,
          name:      a.name,
          data:      a.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[negotiation-cases] Synced');
    res.json({ ok: true, cases: inserted });
  } catch (err) {
    logger.error({ err }, '[negotiation-cases] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
