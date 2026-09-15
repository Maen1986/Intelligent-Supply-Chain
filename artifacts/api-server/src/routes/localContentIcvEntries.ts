/**
 * /api/local-content-icv-entries -- real backend persistence for SI Module
 * 08's Local Content / ICV Eligibility Check tool's saved supplier/entity
 * entries (16 Sep 2026, per the independent QA brief's explicit instruction
 * to mirror /api/supplier-dependency-checks' backend-sync-with-localStorage-
 * fallback pattern).
 *
 * Whole-state sync, same shape as /api/supplier-dependency-checks,
 * /api/rar-analyses, and /api/tco-analyses:
 *
 *   GET /api/local-content-icv-entries  -- list all saved entries for the
 *     authenticated user.
 *   PUT /api/local-content-icv-entries  -- transactionally REPLACE all of
 *     the user's entries with the given array (delete-all + bulk-insert in
 *     one transaction). Returns the freshly-inserted rows (with real DB
 *     ids) so the frontend can reconcile them against its local clientKey
 *     values.
 *
 * `data` validation is intentionally light (structural checks only, same
 * depth as supplier_dependency_checks' validation) since the
 * LocalContentEntry shape is defined and owned by the frontend (see
 * src/pages/LocalContentICVCheck.tsx) -- this route does not duplicate that
 * shape.
 *
 * Auth: session cookie only, same as /api/supplier-dependency-checks and
 * every other personal-UI-state route -- this is not machine-to-machine
 * data.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { localContentIcvEntriesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

/** Same 50-row cap used for RAR/TCO/supplier-dependency "analyses" -- see
 *  schema file header: a client's local-content portfolio for this
 *  directional tool is, by design, a working list of named
 *  suppliers/entities, not a full supplier master list. */
const MAX_ENTRIES_PER_SYNC = 50;

interface LocalContentEntryPayload {
  clientKey: string;
  name: string;
  data: Record<string, unknown>;
}

function isValidPayload(a: unknown): a is LocalContentEntryPayload {
  if (!a || typeof a !== 'object') return false;
  const r = a as Record<string, unknown>;
  return typeof r.clientKey === 'string' && r.clientKey.length > 0
    && typeof r.name === 'string'
    && typeof r.data === 'object' && r.data !== null && !Array.isArray(r.data);
}

/* ─── GET /api/local-content-icv-entries ────────────────────────────────── */

router.get('/', async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(localContentIcvEntriesTable)
      .where(eq(localContentIcvEntriesTable.userId, userId));
    // Newest-edited first -- matches the rar-analyses/supplier-dependency-checks list convention.
    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json({ ok: true, entries: rows });
  } catch (err) {
    logger.error({ err }, '[local-content-icv-entries] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

/* ─── PUT /api/local-content-icv-entries ────────────────────────────────── */

router.put('/', async (req, res) => {
  const body = req.body as { entries?: unknown };
  if (!Array.isArray(body.entries) || !body.entries.every(isValidPayload)) {
    res.status(400).json({ ok: false, error: 'Invalid entries shape -- expected an array of {clientKey, name, data}' });
    return;
  }
  const entries = body.entries as LocalContentEntryPayload[];
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
      await tx.delete(localContentIcvEntriesTable).where(eq(localContentIcvEntriesTable.userId, userId));
      if (entries.length === 0) return [];
      return tx
        .insert(localContentIcvEntriesTable)
        .values(entries.map((e) => ({
          userId,
          organizationId,
          clientKey: e.clientKey,
          name:      e.name,
          data:      e.data,
        })))
        .returning();
    });

    logger.info({ userId, count: inserted.length }, '[local-content-icv-entries] Synced');
    res.json({ ok: true, entries: inserted });
  } catch (err) {
    logger.error({ err }, '[local-content-icv-entries] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
