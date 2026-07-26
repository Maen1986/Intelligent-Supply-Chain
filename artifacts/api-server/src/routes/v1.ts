/**
 * /api/v1/* — authenticated REST endpoints for machine-to-machine integration.
 *
 * Auth: `Authorization: Bearer <api-key>` OR a valid session cookie.
 * The resolved user ID is available on `res.locals.userId`.
 */
import { Router } from "express";
import { sql }    from "drizzle-orm";
import { db }     from "@workspace/db";
import { requireApiKeyOrSession } from "../middlewares/requireApiKeyOrSession";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireApiKeyOrSession);

/* ─── helpers ──────────────────────────────────────────────────────────── */

async function getUserRow(userId: number) {
  const result = await db.execute(
    sql`SELECT scorecard_roster, tool_data FROM users WHERE id = ${userId}`,
  );
  return result.rows?.[0] as
    | { scorecard_roster: unknown; tool_data: Record<string, unknown> | null }
    | undefined;
}

async function patchToolData(userId: number, patch: Record<string, unknown>) {
  const row = await getUserRow(userId);
  const merged = { ...(row?.tool_data ?? {}), ...patch };
  await db.execute(
    sql`UPDATE users SET tool_data = ${JSON.stringify(merged)}::jsonb WHERE id = ${userId}`,
  );
}

/* ─── GET endpoints ─────────────────────────────────────────────────────── */

/** GET /api/v1/suppliers — supplier roster */
router.get("/suppliers", async (req, res) => {
  try {
    const row = await getUserRow(res.locals.userId as number);
    res.json({ ok: true, data: row?.scorecard_roster ?? null });
  } catch (err) {
    logger.error({ err }, "[v1] GET /suppliers");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** GET /api/v1/kpis — KPI values for the user's current framework */
router.get("/kpis", async (req, res) => {
  try {
    const row = await getUserRow(res.locals.userId as number);
    res.json({ ok: true, data: row?.tool_data?.kpis ?? null });
  } catch (err) {
    logger.error({ err }, "[v1] GET /kpis");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** GET /api/v1/risk-kris — KRI dashboard values */
router.get("/risk-kris", async (req, res) => {
  try {
    const row = await getUserRow(res.locals.userId as number);
    res.json({ ok: true, data: row?.tool_data?.riskKris ?? null });
  } catch (err) {
    logger.error({ err }, "[v1] GET /risk-kris");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** GET /api/v1/spend — spend Pareto rows */
router.get("/spend", async (req, res) => {
  try {
    const row = await getUserRow(res.locals.userId as number);
    res.json({ ok: true, data: row?.tool_data?.spend ?? null });
  } catch (err) {
    logger.error({ err }, "[v1] GET /spend");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/** GET /api/v1/training — training assessment matrix */
router.get("/training", async (req, res) => {
  try {
    const row = await getUserRow(res.locals.userId as number);
    res.json({ ok: true, data: row?.tool_data?.training ?? null });
  } catch (err) {
    logger.error({ err }, "[v1] GET /training");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ─── POST import endpoints ─────────────────────────────────────────────── */

/**
 * POST /api/v1/suppliers/import
 * Body: { suppliers: SupplierRecord[] }
 * Replaces the user's stored roster entirely.
 */
router.post("/suppliers/import", async (req, res) => {
  if (!Array.isArray(req.body?.suppliers)) {
    res.status(400).json({ ok: false, error: 'Body must be { suppliers: SupplierRecord[] }' });
    return;
  }
  const suppliers: unknown[] = req.body.suppliers;
  const errors: string[] = [];
  const valid = suppliers.filter((s, i) => {
    if (!s || typeof s !== "object") { errors.push(`Row ${i}: not an object`); return false; }
    const r = s as Record<string, unknown>;
    if (!r.id || !r.name) { errors.push(`Row ${i}: id and name are required`); return false; }
    return true;
  });

  try {
    const roster = { suppliers: valid, activeId: (valid[0] as Record<string, unknown>)?.id ?? "" };
    await db.execute(
      sql`UPDATE users SET scorecard_roster = ${JSON.stringify(roster)}::jsonb WHERE id = ${res.locals.userId}`,
    );
    res.json({ ok: true, imported: valid.length, skipped: suppliers.length - valid.length, errors });
  } catch (err) {
    logger.error({ err }, "[v1] POST /suppliers/import");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * POST /api/v1/kpis/import
 * Body: { slug: string, values: Record<kpiId, actualValue> }
 */
router.post("/kpis/import", async (req, res) => {
  const { slug, values } = req.body ?? {};
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    res.status(400).json({ ok: false, error: 'Body must be { slug: string, values: Record<string,string> }' });
    return;
  }
  try {
    await patchToolData(res.locals.userId as number, { kpis: { slug: slug ?? "unknown", values } });
    res.json({ ok: true, imported: Object.keys(values).length, skipped: 0, errors: [] });
  } catch (err) {
    logger.error({ err }, "[v1] POST /kpis/import");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * POST /api/v1/spend/import
 * Body: { rows: [{ name: string, spend: number }] }
 */
router.post("/spend/import", async (req, res) => {
  if (!Array.isArray(req.body?.rows)) {
    res.status(400).json({ ok: false, error: 'Body must be { rows: [{ name: string, spend: number }] }' });
    return;
  }
  const errors: string[] = [];
  const valid = (req.body.rows as unknown[]).filter((r, i) => {
    if (!r || typeof r !== "object") { errors.push(`Row ${i}: not an object`); return false; }
    const row = r as Record<string, unknown>;
    if (typeof row.name !== "string" || !row.name) { errors.push(`Row ${i}: name required`); return false; }
    if (typeof row.spend !== "number" || row.spend < 0) { errors.push(`Row ${i}: spend must be ≥ 0`); return false; }
    return true;
  });

  try {
    await patchToolData(res.locals.userId as number, { spend: valid.slice(0, 10) });
    res.json({ ok: true, imported: valid.length, skipped: req.body.rows.length - valid.length, errors });
  } catch (err) {
    logger.error({ err }, "[v1] POST /spend/import");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
