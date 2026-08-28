/**
 * /api/rfx-workspace -- T2 server-sync pass for the #395 Category-Aware RFx
 * Scope Build & Review Engine panel (CLMTools.tsx "RFx Builder" tab).
 *
 * Closes the honest gap logged in Module 03 doc section 8.10 ("Honest gaps
 * -- carried through the build, still open"): "No backend/DB persistence
 * -- same T1 client-side-only (localStorage) scope as the rest of this
 * tab and #394; a T2 server-sync pass (schema + API routes, following the
 * pattern already built for TCO/RAR/Working Capital) is not scheduled."
 * Built 28 Aug 2026, registry #371.
 *
 * Unlike TCO/RAR/Working Capital (which are lists of independently-named
 * analyses, one row per analysis), the RFx panel holds a SINGLE working
 * session's state -- one RFx type recommendation, one scope profile, one
 * set of field/WBS/response entries at a time (SK_RFX's 8 localStorage
 * keys in CLMTools.tsx). That shape matches the existing scorecard-roster /
 * generatedPlans precedent (one JSONB blob per user) much more closely
 * than the per-row TCO table -- so this route stores the whole workspace
 * object inside the existing `tool_data` JSONB column under the
 * `rfxWorkspace` key, exactly like plans.ts does for `generatedPlans`.
 * No schema migration needed.
 *
 *   GET /api/rfx-workspace  -- return the authenticated user's saved RFx
 *     workspace object, or null if they haven't synced one yet.
 *   PUT /api/rfx-workspace  -- replace the authenticated user's saved RFx
 *     workspace object with the given shape (whole-object sync, same
 *     "server has the single source of truth" pattern as scorecard-roster).
 *
 * Auth: session cookie only -- this is personal UI state, not
 * machine-to-machine data, same as /api/plans and /api/scorecard-roster.
 */
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { requireSession } from "../middlewares/requireSession";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireSession);

/** Mirrors RfxSelectionInputs / RfxScopeProfile-derived local state shapes
 *  in CLMTools.tsx. Kept loose (not importing the frontend's exact types
 *  into the api-server package) -- validated structurally below instead. */
interface RfxWorkspacePayload {
  selection: Record<string, unknown>;
  criteria: unknown[];
  bidders: unknown[];
  scopeBucket: string;
  scopeComplexity: string;
  fieldEntries: Record<string, unknown>;
  wbsFilled: Record<string, unknown>;
  responseEntries: Record<string, unknown>;
}

function isValidWorkspace(w: unknown): w is RfxWorkspacePayload {
  if (!w || typeof w !== "object") return false;
  const r = w as Record<string, unknown>;
  return typeof r.selection === "object" && r.selection !== null
    && Array.isArray(r.criteria)
    && Array.isArray(r.bidders)
    && typeof r.scopeBucket === "string"
    && typeof r.scopeComplexity === "string"
    && typeof r.fieldEntries === "object" && r.fieldEntries !== null
    && typeof r.wbsFilled === "object" && r.wbsFilled !== null
    && typeof r.responseEntries === "object" && r.responseEntries !== null;
}

/* ─── GET /api/rfx-workspace ────────────────────────────────────────────── */

router.get("/", async (req, res) => {
  try {
    const userId = res.locals.userId as number;
    const result = await db.execute(
      sql`SELECT tool_data FROM users WHERE id = ${userId}`,
    );
    const toolData = (result.rows?.[0] as { tool_data: Record<string, unknown> | null } | undefined)?.tool_data ?? {};
    res.json({ ok: true, workspace: toolData["rfxWorkspace"] ?? null });
  } catch (err) {
    logger.error({ err }, "[rfx-workspace] GET failed");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── PUT /api/rfx-workspace ────────────────────────────────────────────── */

router.put("/", async (req, res) => {
  const body = req.body as { workspace?: unknown };
  if (!isValidWorkspace(body.workspace)) {
    res.status(400).json({
      ok: false,
      error: "Invalid workspace shape -- expected {selection, criteria, bidders, scopeBucket, scopeComplexity, fieldEntries, wbsFilled, responseEntries}",
    });
    return;
  }
  try {
    const userId = res.locals.userId as number;
    await db.execute(
      sql`UPDATE users
          SET tool_data = COALESCE(tool_data, '{}'::jsonb) || jsonb_build_object('rfxWorkspace', ${JSON.stringify(body.workspace)}::jsonb)
          WHERE id = ${userId}`,
    );
    logger.info({ userId }, "[rfx-workspace] Synced");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "[rfx-workspace] PUT failed");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
