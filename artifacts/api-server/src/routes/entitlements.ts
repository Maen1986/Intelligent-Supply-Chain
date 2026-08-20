/**
 * /api/entitlements — à la carte Maturity Assessment module ownership (#188,
 * Decision Record 8.5, Layer 1).
 *
 * GET  /api/entitlements/mine           — the signed-in user's owned modules
 * GET  /api/admin/entitlements          — list all grants (admin)
 * POST /api/admin/entitlements/grant    — grant a module to a user (admin)
 * DELETE /api/admin/entitlements/:id    — revoke a grant (admin)
 *
 * Every grant is 'manual' today -- there is no payment collection yet
 * (#364, blocked on Stripe credentials). This is the provisioning path for
 * onboarding a first design-partner customer by hand, per site map #367.
 */
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, entitlementsTable, usersTable } from '@workspace/db';
import { requireSession } from '../middlewares/requireSession';
import { requireAdmin }   from '../middlewares/requireAdmin';
import { logger } from '../lib/logger';
import { ALL_MODULE_IDS, getEntitledModules, grantModule } from '../lib/entitlements';

const router = Router();

// ── GET /api/entitlements/mine ────────────────────────────────────────────────
router.get('/entitlements/mine', requireSession, async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const modules = await getEntitledModules(userId);
    res.json({ ok: true, modules: Array.from(modules) });
  } catch (err) {
    logger.error({ err }, '[entitlements/mine] GET failed');
    res.status(500).json({ ok: false, error: 'Failed to load entitlements' });
  }
});

// ── GET /api/admin/entitlements ───────────────────────────────────────────────
router.get('/admin/entitlements', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id:         entitlementsTable.id,
        userId:     entitlementsTable.userId,
        userEmail:  usersTable.email,
        moduleId:   entitlementsTable.moduleId,
        source:     entitlementsTable.source,
        grantedBy:  entitlementsTable.grantedBy,
        grantedAt:  entitlementsTable.grantedAt,
      })
      .from(entitlementsTable)
      .leftJoin(usersTable, eq(entitlementsTable.userId, usersTable.id))
      .orderBy(entitlementsTable.grantedAt);
    res.json({ ok: true, rows, total: rows.length });
  } catch (err) {
    logger.error({ err }, '[admin/entitlements] GET failed');
    res.status(500).json({ ok: false, error: 'Failed to load entitlements' });
  }
});

// ── POST /api/admin/entitlements/grant ────────────────────────────────────────
router.post('/admin/entitlements/grant', requireAdmin, async (req, res) => {
  try {
    const { userId, moduleId } = req.body as { userId?: number; moduleId?: string };
    if (!userId || !moduleId) {
      res.status(400).json({ ok: false, error: 'userId and moduleId are required' });
      return;
    }
    if (moduleId !== 'bundle' && !ALL_MODULE_IDS.includes(moduleId)) {
      res.status(400).json({ ok: false, error: `moduleId must be 'bundle' or one of ${ALL_MODULE_IDS.join(', ')}` });
      return;
    }
    const adminEmail = req.session.userEmail ?? null;
    await grantModule({ userId, moduleId, source: 'manual', grantedBy: adminEmail });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[admin/entitlements/grant] POST failed');
    res.status(500).json({ ok: false, error: 'Failed to grant entitlement' });
  }
});

// ── DELETE /api/admin/entitlements/:id ────────────────────────────────────────
router.delete('/admin/entitlements/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ ok: false, error: 'Invalid id' });
    return;
  }
  try {
    await db.delete(entitlementsTable).where(eq(entitlementsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, id }, '[admin/entitlements/:id] DELETE failed');
    res.status(500).json({ ok: false, error: 'Failed to revoke entitlement' });
  }
});

export default router;
