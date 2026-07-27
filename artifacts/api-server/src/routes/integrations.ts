/**
 * /api/integrations/* — admin CRUD for API keys and webhooks.
 * Requires an authenticated session (cookie-based).
 */
import { Router }                   from "express";
import { createHash, randomBytes }  from "crypto";
import { eq, and, desc }            from "drizzle-orm";
import { sql }                      from "drizzle-orm";
import { db, apiKeysTable, webhookConfigsTable } from "@workspace/db";
import { requireAdmin }             from "../middlewares/requireAdmin";
import { dispatchWebhook }          from "../lib/webhookDispatch";
import { validateWebhookUrl }       from "../lib/validateWebhookUrl";
import { logger }                   from "../lib/logger";

const router = Router();

// All integration-management routes require an authenticated admin session.
// The UI gate in AdminIntegrations.tsx is a UX convenience only — this
// server-side check is the real security boundary.
router.use(requireAdmin);

/* ══════════════════════════════════════════════════════════════
   API KEYS
   ══════════════════════════════════════════════════════════════ */

/** GET /api/integrations/keys — list caller's API keys (no raw key) */
router.get("/keys", async (req, res) => {
  try {
    const keys = await db
      .select({
        id:          apiKeysTable.id,
        nameLabel:   apiKeysTable.nameLabel,
        keyPrefix:   apiKeysTable.keyPrefix,
        scope:       apiKeysTable.scope,
        createdAt:   apiKeysTable.createdAt,
        lastUsedAt:  apiKeysTable.lastUsedAt,
        revokedAt:   apiKeysTable.revokedAt,
      })
      .from(apiKeysTable)
      .where(eq(apiKeysTable.userId, req.session.userId!))
      .orderBy(desc(apiKeysTable.createdAt));
    res.json({ ok: true, keys });
  } catch (err) {
    logger.error({ err }, "[integrations] GET /keys");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * POST /api/integrations/keys — generate a new API key.
 * Body: { nameLabel: string }
 * Returns the raw key ONCE — not stored, not retrievable again.
 */
router.post("/keys", async (req, res) => {
  const { nameLabel, scope } = req.body ?? {};
  if (typeof nameLabel !== "string" || !nameLabel.trim()) {
    res.status(400).json({ ok: false, error: "nameLabel is required" });
    return;
  }
  const resolvedScope = scope === "read" ? "read" : "write";
  try {
    const rawKey  = `isk_${randomBytes(24).toString("base64url")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12) + "…";

    const [row] = await db
      .insert(apiKeysTable)
      .values({ userId: req.session.userId!, nameLabel: nameLabel.trim(), keyHash, keyPrefix, scope: resolvedScope })
      .returning({ id: apiKeysTable.id, createdAt: apiKeysTable.createdAt });

    res.json({
      ok: true,
      key: { id: row.id, nameLabel: nameLabel.trim(), keyPrefix, scope: resolvedScope, createdAt: row.createdAt, rawKey },
    });
  } catch (err) {
    logger.error({ err }, "[integrations] POST /keys");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** PATCH /api/integrations/keys/:id — update scope of an active API key */
router.patch("/keys/:id", async (req, res) => {
  const keyId = parseInt(req.params.id, 10);
  if (isNaN(keyId)) { res.status(400).json({ ok: false, error: "Invalid key ID" }); return; }
  const { scope } = req.body ?? {};
  if (scope !== "read" && scope !== "write") {
    res.status(400).json({ ok: false, error: "scope must be 'read' or 'write'" });
    return;
  }
  try {
    const [updated] = await db
      .update(apiKeysTable)
      .set({ scope })
      .where(
        and(
          eq(apiKeysTable.id, keyId),
          eq(apiKeysTable.userId, req.session.userId!),
          sql`${apiKeysTable.revokedAt} IS NULL`,
        ),
      )
      .returning({ id: apiKeysTable.id, scope: apiKeysTable.scope });
    if (!updated) {
      res.status(404).json({ ok: false, error: "Key not found or already revoked" });
      return;
    }
    res.json({ ok: true, key: updated });
  } catch (err) {
    logger.error({ err }, "[integrations] PATCH /keys/:id");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** DELETE /api/integrations/keys/:id — revoke an API key */
router.delete("/keys/:id", async (req, res) => {
  const keyId = parseInt(req.params.id, 10);
  if (isNaN(keyId)) { res.status(400).json({ ok: false, error: "Invalid key ID" }); return; }
  try {
    await db
      .update(apiKeysTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeysTable.id, keyId), eq(apiKeysTable.userId, req.session.userId!)));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[integrations] DELETE /keys/:id");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   WEBHOOKS
   ══════════════════════════════════════════════════════════════ */

/** GET /api/integrations/webhooks */
router.get("/webhooks", async (req, res) => {
  try {
    const webhooks = await db
      .select()
      .from(webhookConfigsTable)
      .where(eq(webhookConfigsTable.userId, req.session.userId!))
      .orderBy(desc(webhookConfigsTable.createdAt));
    res.json({ ok: true, webhooks });
  } catch (err) {
    logger.error({ err }, "[integrations] GET /webhooks");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** POST /api/integrations/webhooks — add a webhook URL */
router.post("/webhooks", async (req, res) => {
  const { url, events } = req.body ?? {};
  if (typeof url !== "string" || !url.trim()) {
    res.status(400).json({ ok: false, error: "A valid HTTP(S) URL is required" });
    return;
  }
  const urlCheck = validateWebhookUrl(url);
  if (!urlCheck.valid) {
    res.status(400).json({ ok: false, error: urlCheck.reason });
    return;
  }
  try {
    const existing = await db
      .select({ id: webhookConfigsTable.id })
      .from(webhookConfigsTable)
      .where(eq(webhookConfigsTable.userId, req.session.userId!));
    if (existing.length >= 5) {
      res.status(400).json({ ok: false, error: "Maximum 5 webhook URLs per account" });
      return;
    }
    const [row] = await db
      .insert(webhookConfigsTable)
      .values({
        userId: req.session.userId!,
        url:    url.trim(),
        events: Array.isArray(events) ? events : [],
      })
      .returning();
    res.json({ ok: true, webhook: row });
  } catch (err) {
    logger.error({ err }, "[integrations] POST /webhooks");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** DELETE /api/integrations/webhooks/:id */
router.delete("/webhooks/:id", async (req, res) => {
  const whId = parseInt(req.params.id, 10);
  if (isNaN(whId)) { res.status(400).json({ ok: false, error: "Invalid webhook ID" }); return; }
  try {
    await db
      .delete(webhookConfigsTable)
      .where(and(eq(webhookConfigsTable.id, whId), eq(webhookConfigsTable.userId, req.session.userId!)));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[integrations] DELETE /webhooks/:id");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** POST /api/integrations/webhooks/:id/test — send a synthetic test payload */
router.post("/webhooks/:id/test", async (req, res) => {
  const whId = parseInt(req.params.id, 10);
  if (isNaN(whId)) { res.status(400).json({ ok: false, error: "Invalid webhook ID" }); return; }
  try {
    const rows = await db
      .select()
      .from(webhookConfigsTable)
      .where(and(eq(webhookConfigsTable.id, whId), eq(webhookConfigsTable.userId, req.session.userId!)))
      .limit(1);
    const wh = rows[0];
    if (!wh) { res.status(404).json({ ok: false, error: "Webhook not found" }); return; }

    const result = await dispatchWebhook(
      wh,
      "webhook.test",
      { message: "Test payload from ISC Integration Hub" },
      req.session.userId!,
    );
    res.json({ ok: true, result });
  } catch (err) {
    logger.error({ err }, "[integrations] POST /webhooks/:id/test");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   ACTIVITY LOG
   ══════════════════════════════════════════════════════════════ */

/** GET /api/integrations/activity — last 20 delivery attempts for this user */
router.get("/activity", async (req, res) => {
  try {
    const logs = await db.execute(
      sql`SELECT wdl.id, wdl.event, wdl.status_code, wdl.success,
                 wdl.response_snippet, wdl.attempted_at, wc.url
          FROM   webhook_delivery_log wdl
          JOIN   webhook_configs wc ON wc.id = wdl.webhook_config_id
          WHERE  wc.user_id = ${req.session.userId!}
          ORDER  BY wdl.attempted_at DESC
          LIMIT  20`,
    );
    res.json({ ok: true, logs: logs.rows });
  } catch (err) {
    logger.error({ err }, "[integrations] GET /activity");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
