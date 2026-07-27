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
import { dispatchEvent } from "../lib/webhookDispatch";

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

/* ─── KPI RAG helpers ───────────────────────────────────────────────────── */

type KpiBand = "green" | "amber" | "red";

interface KpiThreshold {
  amber: number;
  red: number;
  higherIsBetter?: boolean;
}

/**
 * Compute a KPI's RAG band from its numeric value and thresholds.
 * Returns null when the value cannot be parsed or no threshold is provided.
 */
function kpiBand(value: unknown, threshold: KpiThreshold | undefined): KpiBand | null {
  if (!threshold) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (isNaN(n)) return null;
  const { amber, red, higherIsBetter = false } = threshold;
  if (higherIsBetter) {
    if (n <= red)   return "red";
    if (n <= amber) return "amber";
    return "green";
  } else {
    if (n >= red)   return "red";
    if (n >= amber) return "amber";
    return "green";
  }
}

/**
 * POST /api/v1/kpis/import
 * Body: {
 *   slug: string,
 *   values: Record<kpiId, actualValue>,
 *   thresholds?: Record<kpiId, { amber: number; red: number; higherIsBetter?: boolean }>
 * }
 *
 * Fires `kpi.rag_changed` for each KPI that moves between RAG bands
 * (green / amber / red).  When `thresholds` is supplied the server computes
 * the RAG band before and after and fires only on an actual band transition.
 * When no thresholds are supplied for a KPI it falls back to firing on any
 * raw-value change.
 */
router.post("/kpis/import", async (req, res) => {
  const { slug, values, thresholds } = req.body ?? {};
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    res.status(400).json({ ok: false, error: 'Body must be { slug: string, values: Record<string,string>, thresholds?: Record<string,{amber,red,higherIsBetter?}> }' });
    return;
  }
  const userId = res.locals.userId as number;
  const thresholdMap: Record<string, KpiThreshold> =
    thresholds && typeof thresholds === "object" && !Array.isArray(thresholds)
      ? (thresholds as Record<string, KpiThreshold>)
      : {};

  try {
    // Read existing KPI values before overwriting so we can diff
    const row = await getUserRow(userId);
    const existingKpis = row?.tool_data?.kpis as { slug?: string; values?: Record<string, unknown> } | undefined;
    const oldValues: Record<string, unknown> = existingKpis?.values ?? {};

    await patchToolData(userId, { kpis: { slug: slug ?? "unknown", values } });

    // Dispatch kpi.rag_changed for each KPI that transitions between RAG bands
    const newValues = values as Record<string, unknown>;
    for (const kpiId of Object.keys(newValues)) {
      const oldValue = oldValues[kpiId];
      const newValue = newValues[kpiId];
      if (newValue === undefined) continue;

      const threshold = thresholdMap[kpiId];
      const oldBand = kpiBand(oldValue, threshold);
      const newBand = kpiBand(newValue, threshold);

      // With thresholds: fire only when the band actually changes
      // Without thresholds: fire when the raw value changes
      const shouldFire = threshold
        ? oldBand !== newBand
        : String(oldValue ?? "") !== String(newValue ?? "");

      if (shouldFire) {
        dispatchEvent(userId, "kpi.rag_changed", {
          kpiId,
          slug: slug ?? "unknown",
          oldValue: oldValue ?? null,
          newValue,
          ...(threshold ? { oldStatus: oldBand, newStatus: newBand } : {}),
        });
      }
    }

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

/* ─── KRI threshold helpers ─────────────────────────────────────────────── */

type RagStatus = "green" | "amber" | "red";

/**
 * Classify a KRI value against its amber/red thresholds.
 * When higherIsBetter (e.g. OTIF), low values are bad.
 * When !higherIsBetter (e.g. concentration), high values are bad.
 */
function kriStatus(value: number, amber: number, red: number, higherIsBetter: boolean): RagStatus {
  if (higherIsBetter) {
    if (value <= red)   return "red";
    if (value <= amber) return "amber";
    return "green";
  } else {
    if (value >= red)   return "red";
    if (value >= amber) return "amber";
    return "green";
  }
}

/**
 * POST /api/v1/risk-kris/import
 * Body: { kris: Array<{ id: string; label?: string; value: number; amber: number; red: number; higherIsBetter?: boolean }> }
 *
 * Persists incoming KRI values to tool_data.riskKris (Record<id, string>).
 * Fires `kri.threshold_breached` for any KRI whose RAG status worsens
 * (green→amber, green→red, amber→red) compared with the stored value.
 */
router.post("/risk-kris/import", async (req, res) => {
  if (!Array.isArray(req.body?.kris)) {
    res.status(400).json({
      ok: false,
      error: "Body must be { kris: Array<{ id, value, amber, red, higherIsBetter? }> }",
    });
    return;
  }

  const userId = res.locals.userId as number;
  const incoming = req.body.kris as unknown[];
  const errors: string[] = [];

  // Validate each KRI row
  const valid = incoming.filter((item, i) => {
    if (!item || typeof item !== "object") { errors.push(`Row ${i}: not an object`); return false; }
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id)           { errors.push(`Row ${i}: id required`);    return false; }
    if (typeof r.value !== "number")                  { errors.push(`Row ${i}: value must be a number`); return false; }
    if (typeof r.amber !== "number")                  { errors.push(`Row ${i}: amber threshold required`); return false; }
    if (typeof r.red   !== "number")                  { errors.push(`Row ${i}: red threshold required`);   return false; }
    return true;
  }) as Array<{ id: string; label?: string; value: number; amber: number; red: number; higherIsBetter?: boolean }>;

  try {
    // Load the existing KRI values (Record<id, string>) before overwriting
    const row = await getUserRow(userId);
    const oldKris = (row?.tool_data?.riskKris ?? {}) as Record<string, string>;

    // Build new values map for persistence
    const newKrisMap: Record<string, string> = { ...oldKris };
    for (const kri of valid) {
      newKrisMap[kri.id] = String(kri.value);
    }
    await patchToolData(userId, { riskKris: newKrisMap });

    // Detect threshold breaches (status worsening)
    const RAG_SEVERITY: Record<RagStatus, number> = { green: 0, amber: 1, red: 2 };
    for (const kri of valid) {
      const higherIsBetter = kri.higherIsBetter ?? false;
      const oldRaw = parseFloat(oldKris[kri.id] ?? "");
      const newStatus = kriStatus(kri.value, kri.amber, kri.red, higherIsBetter);

      // Only fire when the new value actually breaches amber or red
      if (newStatus === "green") continue;

      const oldStatus: RagStatus = isNaN(oldRaw)
        ? "green"
        : kriStatus(oldRaw, kri.amber, kri.red, higherIsBetter);

      if (RAG_SEVERITY[newStatus] > RAG_SEVERITY[oldStatus]) {
        dispatchEvent(userId, "kri.threshold_breached", {
          kriId:           kri.id,
          label:           kri.label ?? kri.id,
          oldValue:        isNaN(oldRaw) ? null : oldRaw,
          newValue:        kri.value,
          oldStatus,
          newStatus,
          amberThreshold:  kri.amber,
          redThreshold:    kri.red,
          higherIsBetter,
        });
      }
    }

    res.json({ ok: true, imported: valid.length, skipped: incoming.length - valid.length, errors });
  } catch (err) {
    logger.error({ err }, "[v1] POST /risk-kris/import");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
