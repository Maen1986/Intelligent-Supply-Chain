/**
 * /api/supplier-dependency-checks -- real backend persistence for the
 * Supplier Dependency Check tool's saved checks (#378, backend-sync added
 * 28 Aug 2026 with the owner's explicit go-ahead -- see the #381 scoping
 * pass, shared-case-data-layer-381-scoping-draft.md).
 *
 * Whole-state sync, same shape as /api/rar-analyses, /api/tco-analyses,
 * and /api/clm-contracts:
 *
 *   GET /api/supplier-dependency-checks  -- list all saved checks for the
 *     authenticated user.
 *   PUT /api/supplier-dependency-checks  -- transactionally REPLACE all of
 *     the user's checks with the given array (delete-all + bulk-insert in
 *     one transaction). Returns the freshly-inserted rows (with real DB
 *     ids) so the frontend can reconcile them against its local clientKey
 *     values.
 *
 * `data` validation is intentionally light (structural checks only, same
 * depth as rar_analyses'/tco_analyses' validation) since the SupplierCheck
 * shape is defined and owned by the frontend (see lib/supplierDependency.ts)
 * -- this route does not duplicate that shape.
 *
 * Auth: session cookie only, same as /api/rar-analyses and every other
 * personal-UI-state route -- this is not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { supplierDependencyChecksTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Same 50-row cap used for RAR/TCO "analyses" -- see schema file header:
 *  a client's supplier dependency checks are, by design, a handful of named
 *  suppliers/categories, not a full supplier master list. */
const MAX_CHECKS_PER_SYNC = 50;

interface SupplierCheckPayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is SupplierCheckPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/supplier-dependency-checks ───────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(supplierDependencyChecksTable)
      .where(eq(supplierDependencyChecksTable.userId, userId));
    // Newest-edited first -- matches the rar-analyses/tco-analyses list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, checks: rows });
  } catch (err) {
    logger.error({ err }, '[supplier-dependency-checks] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/supplier-dependency-checks ───────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { checks?: unknown };
  if (!Array.isArray(body.checks) || !body.checks.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid checks shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const checks = body.checks as SupplierCheckPayload[];
  if (checks.length > MAX_CHECKS_PER_SYNC) {
    res.status(400).json({ ok: false, error: `Too many checks in one sync (max ${MAX_CHECKS_PER_SYNC})` });
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
      await tx.delete(supplierDependencyChecksTable).where(eq(supplierDependencyChecksTable.userId, userId));
      if (checks.length === 0) return [];
      return tx
        .insert(supplierDependencyChecksTable)
        .values(checks.map((c) => ({
          userId,
          organizationId,
          clientKey: c.clientKey,
          name:      c.name,
          data:      c.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[supplier-dependency-checks] Synced');
    res.json({ ok: true, checks: inserted });
  } catch (err) {
    logger.error({ err }, '[supplier-dependency-checks] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
