/**
 * /api/kraljic-workspace -- server persistence for the Kraljic module's
 * per-user working data (Round B5 gap KR-B5-1, 2 Nov 2026).
 *
 *   GET /api/kraljic-workspace -- the authenticated user's saved workspace,
 *     or { workspace: null } when nothing is saved yet.
 *   PUT /api/kraljic-workspace -- transactionally REPLACE the user's
 *     workspace with the given { data } document (delete + insert in one
 *     transaction), returning the stored row.
 *
 * `data` validation is structural only: the frontend owns the shape
 * ({ facts, reviews, extras, ledger }, see kraljicWorkspaceSync.ts). Size is
 * capped so one user cannot store an unbounded document.
 * Auth: session cookie only, like /api/rar-analyses.
 */
import { Router } from 'express';
import { db } from '@workspace/db';
import { kraljicWorkspacesTable, usersTable } from '@workspace/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '../middlewares/requireSession';
import { logger } from '../lib/logger';

const router = Router();
router.use(requireSession);

const MAX_BYTES = 1_000_000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

router.get('/', async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db.select().from(kraljicWorkspacesTable).where(eq(kraljicWorkspacesTable.userId, userId));
    res.json({ ok: true, workspace: rows[0] ?? null });
  } catch (err) {
    logger.error({ err }, '[kraljic-workspace] GET failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

router.put('/', async (req, res) => {
  const body = req.body as { data?: unknown };
  if (!isPlainObject(body.data)) {
    res.status(400).json({ ok: false, error: 'Invalid shape -- expected { data: object }' });
    return;
  }
  if (JSON.stringify(body.data).length > MAX_BYTES) {
    res.status(400).json({ ok: false, error: 'Workspace too large' });
    return;
  }
  const data = body.data;
  try {
    const userId = res.locals.userId as number;
    const [userRow] = await db.select({ organizationId: usersTable.organizationId }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const organizationId = userRow?.organizationId ?? null;
    const inserted = await db.transaction(async (tx) => {
      await tx.delete(kraljicWorkspacesTable).where(eq(kraljicWorkspacesTable.userId, userId));
      return tx.insert(kraljicWorkspacesTable).values({ userId, organizationId, data }).returning();
    });
    logger.info({ userId }, '[kraljic-workspace] Synced');
    res.json({ ok: true, workspace: inserted[0] ?? null });
  } catch (err) {
    logger.error({ err }, '[kraljic-workspace] PUT failed');
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
