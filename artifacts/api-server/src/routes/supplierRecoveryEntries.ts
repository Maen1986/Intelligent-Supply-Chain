/**
 * /api/supplier-recovery-entries -- real backend persistence for SI Module
 * 07's Supplier Recovery Portfolio dashboard's saved supplier entries
 * (17 Sep 2026, closing the persistence gap disclosed in
 * docs/SI_Module07_PerformanceRecovery_Worked_Example.md Section 7/11 --
 * "the natural next step once real per-supplier spend/performance data
 * exists to persist"). Mirrors /api/local-content-icv-entries' route
 * exactly, which itself mirrors /api/supplier-dependency-checks and
 * /api/rar-analyses -- see that route's own header for the full family
 * rationale this one shares.
 *
 * Whole-state sync:
 *
 *   GET /api/supplier-recovery-entries  -- list all saved entries for the
 *     authenticated user.
 *   PUT /api/supplier-recovery-entries  -- transactionally REPLACE all of
 *     the user's entries with the given array (delete-all + bulk-insert in
 *     one transaction). Returns the freshly-inserted rows (with real DB
 *     ids) so the frontend can reconcile them against its local clientKey
 *     values.
 *
 * `data` validation is intentionally light (structural checks only, same
 * depth as local_content_icv_entries' / supplier_dependency_checks'
 * validation) since the SupplierRecord shape is defined and owned by the
 * frontend (see src/lib/supplierRecoveryPortfolio.ts) -- this route does
 * not duplicate that shape.
 *
 * Auth: session cookie only, same as every other personal-UI-state route
 * in this family -- this is not machine-to-machine data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { supplierRecoveryEntriesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Same 50-row cap used for local-content-icv/RAR/TCO/supplier-dependency
 *  "analyses" -- see schema file header: a client's recovery portfolio is,
 *  by design, a working list of named suppliers under active management,
 *  not a full supplier master list. */
const MAX_ENTRIES_PER_SYNC = 50;

interface SupplierRecoveryEntryPayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is SupplierRecoveryEntryPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/supplier-recovery-entries ────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(supplierRecoveryEntriesTable)
      .where(eq(supplierRecoveryEntriesTable.userId, userId));
    // Newest-edited first -- matches the local-content-icv-entries/rar-analyses/
    // supplier-dependency-checks list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, entries: rows });
  } catch (err) {
    logger.error({ err }, '[supplier-recovery-entries] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/supplier-recovery-entries ────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { entries?: unknown };
  if (!Array.isArray(body.entries) || !body.entries.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid entries shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const entries = body.entries as SupplierRecoveryEntryPayload[];
  if (entries.length > MAX_ENTRIES_PER_SYNC) {
    res.status(400).json({ ok: false, error: `Too many entries in one sync (max ${MAX_ENTRIES_PER_SYNC})` });
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
      await tx.delete(supplierRecoveryEntriesTable).where(eq(supplierRecoveryEntriesTable.userId, userId));
      if (entries.length === 0) return [];
      return tx
        .insert(supplierRecoveryEntriesTable)
        .values(entries.map((e) => ({
          userId,
          organizationId,
          clientKey: e.clientKey,
          name:      e.name,
          data:      e.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[supplier-recovery-entries] Synced');
    res.json({ ok: true, entries: inserted });
  } catch (err) {
    logger.error({ err }, '[supplier-recovery-entries] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
