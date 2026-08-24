/**
 * /api/clm-contracts -- real backend persistence for the CLM Toolkit's
 * Contract Inventory (#179 Contract Value Tracker, Wave B-6, 2026-08-24).
 *
 * Whole-state sync, same shape as /api/tco-analyses and
 * /api/spend-variance-analyses:
 *
 *   GET /api/clm-contracts  -- list all contracts for the authenticated
 *     user.
 *   PUT /api/clm-contracts  -- transactionally REPLACE all of the user's
 *     contracts with the given array (delete-all + bulk-insert in one
 *     transaction). Returns the freshly-inserted rows (with real DB ids) so
 *     the frontend can reconcile them against its local clientKey values.
 *
 * `data` validation is intentionally light (structural checks only, same
 * depth as tco_analyses' `suppliers` / spend_variance_analyses' `rows`
 * validation) since the Contract shape is defined and owned by the
 * frontend (see CLMTools.tsx's Contract interface) -- this route does not
 * duplicate that shape.
 *
 * Auth: session cookie only, same as /api/tco-analyses,
 * /api/working-capital-analyses, and /api/spend-variance-analyses -- this
 * is personal UI state, not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { clmContractsTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Cap raised above the 50-scenario cap used for TCO/spend-variance
 *  "analyses" -- a contract register is a live business inventory, not a
 *  handful of named what-if scenarios. See schema file header. */
const MAX_CONTRACTS_PER_SYNC = 500;

interface ClmContractPayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is ClmContractPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/clm-contracts ────────────────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(clmContractsTable)
      .where(eq(clmContractsTable.userId, userId));
    // Newest-edited first -- matches the tco/spend-variance list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, contracts: rows });
  } catch (err) {
    logger.error({ err }, '[clm-contracts] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/clm-contracts ────────────────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { contracts?: unknown };
  if (!Array.isArray(body.contracts) || !body.contracts.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid contracts shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const contracts = body.contracts as ClmContractPayload[];
  if (contracts.length > MAX_CONTRACTS_PER_SYNC) {
    res.status(400).json({ ok: false, error: `Too many contracts in one sync (max ${MAX_CONTRACTS_PER_SYNC})` });
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
      await tx.delete(clmContractsTable).where(eq(clmContractsTable.userId, userId));
      if (contracts.length === 0) return [];
      return tx
        .insert(clmContractsTable)
        .values(contracts.map((c) => ({
          userId,
          organizationId,
          clientKey: c.clientKey,
          name:      c.name,
          data:      c.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[clm-contracts] Synced');
    res.json({ ok: true, contracts: inserted });
  } catch (err) {
    logger.error({ err }, '[clm-contracts] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
