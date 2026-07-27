/**
 * /api/notifications — in-app notification inbox for authenticated users.
 *
 * GET  /api/notifications          — list the 50 most-recent notifications
 * PATCH /api/notifications/read-all — mark every unread notification as read
 * PATCH /api/notifications/:id/read — mark a single notification as read
 *
 * Auth: session only (personal UI state).
 */
import { Router }             from "express";
import { eq, and, desc }      from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireSession }     from "../middlewares/requireSession";
import { logger }             from "../lib/logger";

const router = Router();
router.use(requireSession);

/* ── GET /api/notifications ───────────────────────────────────────────────── */

router.get("/", async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    const unreadCount = rows.filter(r => !r.read).length;
    res.json({ ok: true, notifications: rows, unreadCount });
  } catch (err) {
    logger.error({ err }, "[notifications] GET /");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ── PATCH /api/notifications/read-all ───────────────────────────────────── */

router.patch("/read-all", async (_req, res) => {
  try {
    const userId = res.locals.userId as number;
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(
        eq(notificationsTable.userId, userId),
        eq(notificationsTable.read,   false),
      ));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[notifications] PATCH /read-all");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ── PATCH /api/notifications/:id/read ───────────────────────────────────── */

router.patch("/:id/read", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ ok: false, error: "Invalid notification id" });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const [row] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(and(
        eq(notificationsTable.id,     id),
        eq(notificationsTable.userId, userId),
      ))
      .returning({ id: notificationsTable.id });
    if (!row) {
      res.status(404).json({ ok: false, error: "Notification not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[notifications] PATCH /:id/read");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
