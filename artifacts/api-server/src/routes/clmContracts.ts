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
 *
 * #184 (Commitment Tracking): every PUT also mirrors each contract's
 * renewal-notice obligation into findings_actions (source='contract') --
 * see mirrorContractsIntoFindingsActions() below. This is the one real,
 * already-computed obligation per contract today (the NOTIFY NOW / notice-
 * period logic already live in CLMTools.tsx); it deliberately does not
 * invent obligations for Module 02's broader subclause taxonomy, which has
 * no per-contract due-date computation wired up. Mirror-write failures are
 * logged, never block the contract sync itself -- same non-blocking
 * pattern as maturitySnapshots.ts's remedy-actions mirror.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { clmContractsTable, usersTable } from '@workspace/db/schema';
import { eq, sql } from 'drizzle-orm';
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

/**
 * #184 (Commitment Tracking) -- mirrors each synced contract's real,
 * already-computed renewal-notice obligation into findings_actions
 * (source='contract'). Runs after the whole-state contract sync succeeds;
 * never blocks or fails the sync response -- errors are logged only, same
 * discipline as maturitySnapshots.ts's remedy-actions mirror.
 *
 * itemKey is the constant 'renewal-notice' -- the one obligation type this
 * pass wires up, matching the one obligation CLMTools.tsx already computes
 * a real due date for (endDate - noticePeriodDays, surfaced as the NOTIFY
 * NOW / AUTO-RENEWAL badges). status is derived from the contract's own
 * `renewalDecision` field -- 'undecided' (the Contract type's own default)
 * maps to 'not_started'; any real decision (renew/renegotiate/retender/
 * terminate) maps to 'done'. No new field is invented to track this --
 * renewalDecision already IS the real signal of whether this obligation
 * has been acted on.
 *
 * Also deletes any stale 'contract' findings_actions rows for this user
 * whose sourceRefKey is no longer present in the freshly-synced contract
 * set -- whole-state sync semantics, matching clm_contracts' own
 * delete-all+reinsert behaviour, so a deleted contract's obligation row
 * doesn't linger forever.
 */
async function mirrorContractsIntoFindingsActions(
  userId: number,
  contracts: ClmContractPayload[],
): Promise<void> {
  const validKeys = contracts.map((c) => c.clientKey);

  try {
    // Whole-state cleanup: remove 'contract' rows for clientKeys no longer present.
    if (validKeys.length > 0) {
      await db.execute(sql`
        DELETE FROM findings_actions
        WHERE user_id = ${userId} AND source = 'contract'
          AND source_ref_key NOT IN (${sql.join(validKeys, sql`, `)})
      `);
    } else {
      await db.execute(sql`
        DELETE FROM findings_actions WHERE user_id = ${userId} AND source = 'contract'
      `);
    }
  } catch (err) {
    logger.error({ err, userId }, '[clm-contracts] findings_actions cleanup failed');
  }

  for (const c of contracts) {
    const data = c.data as Record<string, unknown>;
    const endDate         = typeof data.endDate === 'string' ? data.endDate : null;
    const noticePeriodDays = typeof data.noticePeriodDays === 'number' ? data.noticePeriodDays : null;
    const renewalDecision  = typeof data.renewalDecision === 'string' ? data.renewalDecision : 'undecided';
    const supplier          = typeof data.supplier === 'string' ? data.supplier : null;

    // Only mirror an obligation when the contract actually has the fields
    // that make the obligation real -- an incomplete contract (e.g. mid-
    // entry, no end date yet) gets no findings_actions row rather than a
    // fabricated one with a fake due date.
    if (!endDate || noticePeriodDays === null) continue;

    const status = renewalDecision === 'undecided' ? 'not_started' : 'done';
    const noticeDeadline = new Date(new Date(endDate).getTime() - noticePeriodDays * 86400000)
      .toISOString().slice(0, 10);
    const action = `Renewal decision needed for "${c.name}"${supplier ? ` (${supplier})` : ''} -- ` +
      `notice period ${noticePeriodDays}d before contract end ${endDate}`;
    const measurableTarget = `Decide renew / renegotiate / retender / terminate before the notice deadline (${noticeDeadline})`;

    try {
      await db.execute(sql`
        INSERT INTO findings_actions
          (user_id, source, source_ref_key, item_key, phase, segment_title, action, measurable_target, status, completed_at)
        VALUES
          (${userId}, 'contract', ${c.clientKey}, 'renewal-notice', NULL, ${supplier}, ${action}, ${measurableTarget},
           ${status}, ${status === 'done' ? sql`NOW()` : sql`NULL`})
        ON CONFLICT (user_id, source, source_ref_key, item_key)
        DO UPDATE SET
          segment_title      = EXCLUDED.segment_title,
          action             = EXCLUDED.action,
          measurable_target  = EXCLUDED.measurable_target,
          status             = EXCLUDED.status,
          completed_at       = CASE WHEN EXCLUDED.status = 'done' AND findings_actions.completed_at IS NULL
                                     THEN NOW() ELSE findings_actions.completed_at END,
          updated_at         = NOW()
      `);
    } catch (err) {
      logger.error({ err, userId, clientKey: c.clientKey }, '[clm-contracts] findings_actions mirror failed');
    }
  }
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

    // #184 -- mirror obligations after the sync succeeds, never before (so
    // a mirror failure can never block the actual contract save). Fire
    // synchronously (awaited) so tests can assert on it deterministically,
    // but its own internal try/catch means a mirror failure still can't
    // turn a successful contract sync into a failed response.
    await mirrorContractsIntoFindingsActions(userId, contracts);

    res.json({ ok: true, contracts: inserted });
  } catch (err) {
    logger.error({ err }, '[clm-contracts] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
