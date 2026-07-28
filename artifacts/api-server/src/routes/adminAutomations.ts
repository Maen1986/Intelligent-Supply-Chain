/**
 * /api/admin/automations/* — Admin Automation Hub endpoints.
 * All routes require an authenticated admin session (requireAdmin middleware).
 *
 * GET  /api/admin/automations/overview         — aggregated stats
 * GET  /api/admin/automations/webhook-log      — paginated delivery log
 * GET  /api/admin/automations/inbound-log      — paginated inbound webhook log
 * GET  /api/admin/automations/schedule-log     — paginated schedule job log
 * GET  /api/admin/automations/kpi-alerts       — KPI threshold breach events
 * POST /api/admin/automations/trigger/:jobName — manually run a scheduled job
 * POST /api/admin/automations/test-webhook/:id — send test.ping to a webhook
 */
import { Router } from "express";
import { sql, desc } from "drizzle-orm";
import { db, scheduleLogTable, inboundWebhookLogTable, webhookDeliveryLogTable, webhookConfigsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import { dispatchWebhook } from "../lib/webhookDispatch";
import {
  runWeeklyKpiDigest,
  runMonthlyScorecardDigest,
  runLeadFollowup,
  runStaleDataNudge,
} from "../lib/scheduler";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAdmin);

/* ══════════════════════════════════════════════════════════════
   OVERVIEW — aggregated stats for all automation types
   ══════════════════════════════════════════════════════════════ */

router.get("/overview", async (_req, res) => {
  try {
    // 1. Webhook delivery stats (all users, last 30 days)
    const webhookStats = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                         AS total_deliveries,
        COUNT(*) FILTER (WHERE success = 'ok')::int                          AS successful,
        COUNT(*) FILTER (WHERE success = 'error')::int                       AS failed,
        MAX(attempted_at)                                                    AS last_delivery_at
      FROM webhook_delivery_log
      WHERE attempted_at > NOW() - INTERVAL '30 days'
    `);

    const webhookConfigCount = await db.execute(sql`
      SELECT COUNT(*)::int AS total FROM webhook_configs
    `);

    // 2. Latest run of each scheduled job
    const scheduleStats = await db.execute(sql`
      SELECT DISTINCT ON (job_name) job_name, ran_at, users_processed, errors
      FROM schedule_log
      ORDER BY job_name, ran_at DESC
    `);

    // 3. KPI alert breaches (last 30 days, from delivery log)
    const kpiAlertStats = await db.execute(sql`
      SELECT COUNT(*)::int AS total_breaches
      FROM webhook_delivery_log
      WHERE event = 'kpi.threshold_breach'
        AND attempted_at > NOW() - INTERVAL '30 days'
    `);

    // 4. Inbound webhook stats (last 30 days)
    const inboundStats = await db.execute(sql`
      SELECT
        COUNT(*)::int                                               AS total,
        COUNT(*) FILTER (WHERE status = 'ok')::int                 AS successful,
        COUNT(*) FILTER (WHERE status = 'error')::int              AS failed,
        MAX(received_at)                                           AS last_received_at
      FROM inbound_webhook_log
      WHERE received_at > NOW() - INTERVAL '30 days'
    `);

    const ws = webhookStats.rows[0] as {
      total_deliveries: number; successful: number; failed: number; last_delivery_at: string | null;
    };
    const iw = inboundStats.rows[0] as {
      total: number; successful: number; failed: number; last_received_at: string | null;
    };

    const jobMap: Record<string, { ranAt: string | null; usersProcessed: number; errors: string | null }> = {
      weekly_kpi_digest:     { ranAt: null, usersProcessed: 0, errors: null },
      monthly_scorecard:     { ranAt: null, usersProcessed: 0, errors: null },
      lead_followup:         { ranAt: null, usersProcessed: 0, errors: null },
      stale_data_nudge:      { ranAt: null, usersProcessed: 0, errors: null },
    };
    for (const row of scheduleStats.rows as { job_name: string; ran_at: string; users_processed: number; errors: string | null }[]) {
      if (jobMap[row.job_name] !== undefined) {
        jobMap[row.job_name] = { ranAt: row.ran_at, usersProcessed: row.users_processed, errors: row.errors };
      }
    }

    res.json({
      ok: true,
      webhooks: {
        configCount:      (webhookConfigCount.rows[0] as { total: number }).total,
        totalDeliveries:  ws.total_deliveries ?? 0,
        successful:       ws.successful ?? 0,
        failed:           ws.failed ?? 0,
        lastDeliveryAt:   ws.last_delivery_at ?? null,
        successRate:      ws.total_deliveries > 0 ? Math.round((ws.successful / ws.total_deliveries) * 100) : null,
      },
      inbound: {
        total:          iw.total ?? 0,
        successful:     iw.successful ?? 0,
        failed:         iw.failed ?? 0,
        lastReceivedAt: iw.last_received_at ?? null,
      },
      schedule: jobMap,
      kpiAlerts: {
        totalBreaches: (kpiAlertStats.rows[0] as { total_breaches: number }).total_breaches ?? 0,
      },
    });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /overview");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   WEBHOOK DELIVERY LOG
   ══════════════════════════════════════════════════════════════ */

router.get("/webhook-log", async (req, res) => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? "50"), 10) || 50, 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;
  const event  = typeof req.query.event  === "string" ? req.query.event  : null;
  const status = typeof req.query.status === "string" ? req.query.status : null;

  try {
    const eventFilter  = event  ? sql`AND wdl.event   = ${event}`  : sql``;
    const statusFilter = status ? sql`AND wdl.success = ${status}` : sql``;

    const rows = await db.execute(sql`
      SELECT wdl.id, wdl.event, wdl.status_code, wdl.success,
             wdl.response_snippet, wdl.attempted_at, wdl.attempts,
             wdl.payload, wc.url, wc.user_id
      FROM   webhook_delivery_log wdl
      JOIN   webhook_configs wc ON wc.id = wdl.webhook_config_id
      WHERE  1=1 ${eventFilter} ${statusFilter}
      ORDER  BY wdl.attempted_at DESC
      LIMIT  ${limit} OFFSET ${offset}
    `);

    const totalRow = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM   webhook_delivery_log wdl
      JOIN   webhook_configs wc ON wc.id = wdl.webhook_config_id
      WHERE  1=1 ${eventFilter} ${statusFilter}
    `);

    // Mask URL — keep scheme + host only
    const logs = (rows.rows as Array<Record<string, unknown>>).map(r => ({
      ...r,
      url: maskUrl(String(r.url ?? "")),
    }));

    res.json({ ok: true, logs, total: (totalRow.rows[0] as { total: number }).total, limit, offset });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /webhook-log");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   INBOUND WEBHOOK LOG
   ══════════════════════════════════════════════════════════════ */

router.get("/inbound-log", async (req, res) => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? "50"), 10) || 50, 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;

  try {
    const rows = await db
      .select()
      .from(inboundWebhookLogTable)
      .orderBy(desc(inboundWebhookLogTable.receivedAt))
      .limit(limit)
      .offset(offset);

    const totalRow = await db.execute(sql`SELECT COUNT(*)::int AS total FROM inbound_webhook_log`);

    res.json({ ok: true, logs: rows, total: (totalRow.rows[0] as { total: number }).total, limit, offset });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /inbound-log");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   SCHEDULE LOG
   ══════════════════════════════════════════════════════════════ */

router.get("/schedule-log", async (req, res) => {
  const limit  = Math.min(parseInt(String(req.query.limit  ?? "50"), 10) || 50, 200);
  const offset = parseInt(String(req.query.offset ?? "0"), 10) || 0;

  try {
    const rows = await db
      .select()
      .from(scheduleLogTable)
      .orderBy(desc(scheduleLogTable.ranAt))
      .limit(limit)
      .offset(offset);

    const totalRow = await db.execute(sql`SELECT COUNT(*)::int AS total FROM schedule_log`);

    res.json({ ok: true, logs: rows, total: (totalRow.rows[0] as { total: number }).total, limit, offset });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /schedule-log");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   KPI ALERT LOG (threshold_breach events from delivery log)
   ══════════════════════════════════════════════════════════════ */

router.get("/kpi-alerts", async (req, res) => {
  const limit    = Math.min(parseInt(String(req.query.limit    ?? "50"), 10) || 50, 200);
  const offset   = parseInt(String(req.query.offset   ?? "0"),  10) || 0;
  const severity = typeof req.query.severity === "string" ? req.query.severity : null;

  try {
    const sevFilter = severity
      ? sql`AND (wdl.payload->>'severity') = ${severity}`
      : sql``;

    const rows = await db.execute(sql`
      SELECT wdl.id,
             wdl.payload->>'kpiId'            AS kpi_id,
             wdl.payload->>'label'            AS kpi_label,
             wdl.payload->>'severity'         AS severity,
             wdl.payload->>'value'            AS value,
             wdl.payload->>'warnThreshold'    AS warn_threshold,
             wdl.payload->>'criticalThreshold' AS critical_threshold,
             wdl.attempted_at,
             wc.user_id
      FROM   webhook_delivery_log wdl
      JOIN   webhook_configs wc ON wc.id = wdl.webhook_config_id
      WHERE  wdl.event = 'kpi.threshold_breach'
      ${sevFilter}
      ORDER  BY wdl.attempted_at DESC
      LIMIT  ${limit} OFFSET ${offset}
    `);

    const totalRow = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM   webhook_delivery_log wdl
      WHERE  wdl.event = 'kpi.threshold_breach'
      ${sevFilter}
    `);

    res.json({ ok: true, alerts: rows.rows, total: (totalRow.rows[0] as { total: number }).total, limit, offset });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /kpi-alerts");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   MANUAL TRIGGER — run a scheduled job now
   ══════════════════════════════════════════════════════════════ */

const JOB_RUNNERS: Record<string, () => Promise<void>> = {
  weekly_kpi_digest:  runWeeklyKpiDigest,
  monthly_scorecard:  runMonthlyScorecardDigest,
  lead_followup:      runLeadFollowup,
  stale_data_nudge:   runStaleDataNudge,
};

router.post("/trigger/:jobName", async (req, res) => {
  const { jobName } = req.params;
  const runner = JOB_RUNNERS[jobName];
  if (!runner) {
    res.status(400).json({ ok: false, error: `Unknown job: ${jobName}. Valid jobs: ${Object.keys(JOB_RUNNERS).join(", ")}` });
    return;
  }

  // Fire and forget — respond immediately, job runs async.
  // If the job itself throws before reaching its own logJobRun call (e.g. DB
  // connection failure before the user loop), we write a fallback error row so
  // the Schedule Log always reflects that the trigger was attempted.
  const startedAt = new Date().toISOString();
  runner().catch(async (err) => {
    logger.error({ err, jobName }, "[admin/automations] Manual trigger error");
    try {
      await db.insert(scheduleLogTable).values({
        jobName,
        usersProcessed: 0,
        errors: (err as Error)?.message ?? String(err),
      });
    } catch (logErr) {
      logger.error({ logErr, jobName }, "[admin/automations] Failed to write fallback schedule_log entry");
    }
  });

  res.json({ ok: true, jobName, startedAt, message: `Job '${jobName}' started` });
});

/* ══════════════════════════════════════════════════════════════
   TEST WEBHOOK — send test.ping to a specific webhook
   ══════════════════════════════════════════════════════════════ */

router.post("/test-webhook/:webhookId", async (req, res) => {
  const whId = parseInt(req.params.webhookId, 10);
  if (isNaN(whId)) { res.status(400).json({ ok: false, error: "Invalid webhook ID" }); return; }

  try {
    const rows = await db
      .select()
      .from(webhookConfigsTable)
      .where(sql`${webhookConfigsTable.id} = ${whId}`)
      .limit(1);

    const wh = rows[0];
    if (!wh) { res.status(404).json({ ok: false, error: "Webhook not found" }); return; }

    const result = await dispatchWebhook(
      wh,
      "test.ping",
      { message: "Test ping from ISC Automation Hub", triggeredBy: "admin" },
      wh.userId,
    );

    res.json({ ok: true, webhookId: whId, url: maskUrl(wh.url), result });
  } catch (err) {
    logger.error({ err }, "[admin/automations] POST /test-webhook/:id");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   WEBHOOK LIST — all configured webhooks (for health checker)
   ══════════════════════════════════════════════════════════════ */

router.get("/webhooks", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(webhookConfigsTable)
      .orderBy(webhookConfigsTable.userId);

    const webhooks = rows.map(r => ({
      id:        r.id,
      userId:    r.userId,
      maskedUrl: maskUrl(r.url),
      events:    r.events,
      createdAt: r.createdAt,
    }));

    res.json({ ok: true, webhooks });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /webhooks");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   HEALTH CHECK — HEAD-ping a webhook URL, return latency
   ══════════════════════════════════════════════════════════════ */

router.get("/health-check/:webhookId", async (req, res) => {
  const whId = parseInt(req.params.webhookId, 10);
  if (isNaN(whId)) { res.status(400).json({ ok: false, error: "Invalid webhook ID" }); return; }

  try {
    const rows = await db
      .select()
      .from(webhookConfigsTable)
      .where(sql`${webhookConfigsTable.id} = ${whId}`)
      .limit(1);

    const wh = rows[0];
    if (!wh) { res.status(404).json({ ok: false, error: "Webhook not found" }); return; }

    const start = Date.now();
    let statusCode: number | null = null;
    let error: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10_000);

      const resp = await fetch(wh.url, {
        method: "HEAD",
        signal: controller.signal,
        headers: { "User-Agent": "ISC-HealthCheck/1.0" },
      });
      clearTimeout(timeoutId);
      statusCode = resp.status;
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        error = "Timed out after 10s";
      } else {
        error = fetchErr instanceof Error ? fetchErr.message : "Network error";
      }
    }

    const latencyMs = Date.now() - start;

    res.json({
      ok:         true,
      webhookId:  whId,
      maskedUrl:  maskUrl(wh.url),
      latencyMs,
      statusCode,
      error,
    });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /health-check/:id");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ══════════════════════════════════════════════════════════════
   TEMPLATES MANIFEST — list of n8n workflow templates
   ══════════════════════════════════════════════════════════════ */

router.get("/templates", async (_req, res) => {
  try {
    const { readFile } = await import("fs/promises");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const __dir = dirname(fileURLToPath(import.meta.url));
    const manifestPath = join(__dir, "../../public/n8n-templates/manifest.json");
    const raw = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw) as {
      _isc_version: string;
      generatedAt: string;
      templates: Array<{ platform?: string; filename: string; [key: string]: unknown }>;
    };

    // Annotate each template with its public download path so the client
    // never has to guess which folder the file lives in.
    const PLATFORM_FOLDER: Record<string, string> = {
      n8n:    "n8n-templates",
      make:   "make-templates",
      zapier: "zapier-templates",
    };

    const templates = manifest.templates.map(t => ({
      ...t,
      platform: t.platform ?? "n8n",
      downloadPath: `${PLATFORM_FOLDER[t.platform ?? "n8n"] ?? "n8n-templates"}/${t.filename}`,
    }));

    res.json({ ok: true, _isc_version: manifest._isc_version, generatedAt: manifest.generatedAt, templates });
  } catch (err) {
    logger.error({ err }, "[admin/automations] GET /templates");
    res.status(500).json({ ok: false, error: "Failed to load template manifest" });
  }
});

/* ── helper ──────────────────────────────────────────────────────────────── */

function maskUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}/***`;
  } catch {
    return raw.length > 30 ? `${raw.slice(0, 30)}***` : raw;
  }
}

export default router;
