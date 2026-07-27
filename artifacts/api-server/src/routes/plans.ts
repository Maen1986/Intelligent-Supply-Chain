/**
 * /api/plans/:toolKey — save / load / delete the most-recent generated plan per tool.
 *
 * Plans are stored inside the existing `tool_data` JSONB column under the
 * `generatedPlans` key, so no schema migration is needed.
 *
 * Auth: valid session cookie (session auth only — no API-key access, plans
 * are personal UI state, not machine-to-machine data).
 */
import { Router }  from "express";
import { sql }     from "drizzle-orm";
import { db }      from "@workspace/db";
import { requireSession } from "../middlewares/requireSession";
import { logger }  from "../lib/logger";
import { dispatchEvent } from "../lib/webhookDispatch";

const router = Router();
router.use(requireSession);

/* ─── helpers ──────────────────────────────────────────────────────────── */

const TOOL_KEY_RE = /^[a-z][a-z0-9-]{0,63}$/;

function validKey(k: unknown): k is string {
  return typeof k === "string" && TOOL_KEY_RE.test(k);
}

async function getGeneratedPlans(userId: number): Promise<Record<string, { text: string; savedAt: string }>> {
  const result = await db.execute(
    sql`SELECT tool_data FROM users WHERE id = ${userId}`,
  );
  const toolData = (result.rows?.[0] as { tool_data: Record<string, unknown> | null } | undefined)?.tool_data ?? {};
  return (toolData["generatedPlans"] ?? {}) as Record<string, { text: string; savedAt: string }>;
}

async function saveGeneratedPlans(userId: number, plans: Record<string, { text: string; savedAt: string }>) {
  await db.execute(
    sql`UPDATE users
        SET tool_data = COALESCE(tool_data, '{}'::jsonb) || jsonb_build_object('generatedPlans', ${JSON.stringify(plans)}::jsonb)
        WHERE id = ${userId}`,
  );
}

/* ─── GET /api/plans — return ALL saved plans for the authenticated user ── */

router.get("/", async (req, res) => {
  try {
    const plans = await getGeneratedPlans(res.locals.userId as number);
    // Return as a sorted array (newest first)
    const entries = Object.entries(plans)
      .map(([toolKey, plan]) => ({ toolKey, ...plan }))
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    res.json({ ok: true, plans: entries });
  } catch (err) {
    logger.error({ err }, "[plans] GET /");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── GET /api/plans/:toolKey ───────────────────────────────────────────── */

/** Matches keys like "scorecard-sup-1234567890-abc12" */
const SCORECARD_KEY_RE = /^scorecard-.+$/;

router.get("/:toolKey", async (req, res) => {
  const { toolKey } = req.params;
  if (!validKey(toolKey)) {
    res.status(400).json({ ok: false, error: "Invalid toolKey" });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const plans  = await getGeneratedPlans(userId);
    let   plan   = plans[toolKey] ?? null;

    // One-time migration: plans saved under the bare "scorecard" key (before
    // multi-supplier support) are moved to the new "scorecard-{supplierId}"
    // key on first access.  The old key is deleted so storage stays clean.
    if (!plan && SCORECARD_KEY_RE.test(toolKey) && plans["scorecard"]) {
      plan = plans["scorecard"];
      plans[toolKey] = plan;
      delete plans["scorecard"];
      await saveGeneratedPlans(userId, plans);
      logger.info({ userId, toolKey }, "[plans] migrated legacy 'scorecard' plan to new key");
    }

    res.json({ ok: true, plan });
  } catch (err) {
    logger.error({ err }, "[plans] GET");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST /api/plans/:toolKey ──────────────────────────────────────────── */

router.post("/:toolKey", async (req, res) => {
  const { toolKey } = req.params;
  if (!validKey(toolKey)) {
    res.status(400).json({ ok: false, error: "Invalid toolKey" });
    return;
  }
  const { text } = (req.body ?? {}) as { text?: unknown };
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ ok: false, error: "text is required" });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const plans  = await getGeneratedPlans(userId);
    plans[toolKey] = { text, savedAt: new Date().toISOString() };
    await saveGeneratedPlans(userId, plans);
    dispatchEvent(userId, 'plan.saved', {
      toolKey,
      savedAt: plans[toolKey].savedAt,
    });
    res.json({ ok: true, savedAt: plans[toolKey].savedAt });
  } catch (err) {
    logger.error({ err }, "[plans] POST");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── DELETE /api/plans/:toolKey ────────────────────────────────────────── */

router.delete("/:toolKey", async (req, res) => {
  const { toolKey } = req.params;
  if (!validKey(toolKey)) {
    res.status(400).json({ ok: false, error: "Invalid toolKey" });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    const plans  = await getGeneratedPlans(userId);
    delete plans[toolKey];
    await saveGeneratedPlans(userId, plans);
    dispatchEvent(userId, 'plan.deleted', { toolKey });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[plans] DELETE");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
