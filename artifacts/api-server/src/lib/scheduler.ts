/**
 * Scheduled Automation Engine
 *
 * Runs four cron jobs inside the API server process (no external scheduler needed).
 * Each job is configurable — set the corresponding env var to "true" to disable it.
 *
 *   SCHEDULE_DISABLE_WEEKLY_KPI=true       skip Monday 08:00 KPI digest
 *   SCHEDULE_DISABLE_MONTHLY_SCORECARD=true skip 1st-of-month scorecard digest
 *   SCHEDULE_DISABLE_LEAD_FOLLOWUP=true    skip 48-hour lead nudge check
 *   SCHEDULE_DISABLE_STALE_DATA=true       skip 14-day stale-data nudge
 *
 * All schedule times are UTC.
 */

import cron              from "node-cron";
import { sql }           from "drizzle-orm";
import { db, scheduleLogTable } from "@workspace/db";
import { dispatchEvent } from "./webhookDispatch";
import { sendAlertEmail, sendDigestEmail } from "./notifyHelpers";
import { logger }        from "./logger";

/* ── types ──────────────────────────────────────────────────────────────── */

interface UserRow {
  id:               number;
  email:            string;
  full_name:        string;
  company:          string | null;
  tool_data:        Record<string, unknown> | null;
  scorecard_roster: Record<string, unknown> | null;
  last_import_at:   string | null;
}

interface SubmissionRow {
  id:              number;
  contact_email:   string | null;
  contact_name:    string | null;
  contact_company: string | null;
  created_at:      string;
  outputs:         Record<string, unknown> | null;
}

/* ── schedule_log helper ────────────────────────────────────────────────── */

async function logJobRun(jobName: string, usersProcessed: number, errors?: string): Promise<void> {
  await db
    .insert(scheduleLogTable)
    .values({ jobName, usersProcessed, errors: errors ?? null })
    .catch(err => logger.error({ err, jobName }, "[scheduler] Failed to write schedule_log"));
}

/* ── shared query helpers ───────────────────────────────────────────────── */

async function getAllActiveUsers(): Promise<UserRow[]> {
  const result = await db.execute(
    sql`SELECT id, email, full_name, company, tool_data, scorecard_roster, last_import_at
        FROM users
        WHERE role = 'user' AND password_hash IS NOT NULL`,
  );
  return result.rows as unknown as UserRow[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 1 — Weekly KPI Digest (Monday 08:00 UTC)
═══════════════════════════════════════════════════════════════════════════ */

async function runWeeklyKpiDigest(): Promise<void> {
  logger.info("[scheduler] Running weekly KPI digest");
  const users = await getAllActiveUsers();
  let processed = 0;
  const errorMessages: string[] = [];

  for (const user of users) {
    try {
      const kpis = user.tool_data?.kpis as { slug?: string; values?: Record<string, unknown> } | undefined;
      if (!kpis?.values || Object.keys(kpis.values).length === 0) continue;

      const rows: Record<string, string> = {
        "Account":     `${user.full_name} <${user.email}>`,
        "Company":     user.company ?? "—",
        "Framework":   kpis.slug ?? "—",
        "Week Ending": new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Riyadh" }),
      };
      for (const [kpiId, value] of Object.entries(kpis.values)) {
        rows[kpiId] = String(value ?? "—");
      }

      await sendDigestEmail({
        to:      user.email,
        subject: `📊 Your Weekly KPI Summary — I Supply Chain`,
        rows,
      });

      dispatchEvent(user.id, "schedule.weekly_kpi_digest", {
        slug:      kpis.slug,
        kpiCount:  Object.keys(kpis.values).length,
      });

      processed++;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      errorMessages.push(`user ${user.id}: ${msg}`);
      logger.error({ err, userId: user.id }, "[scheduler] Weekly KPI digest failed for user");
    }
  }

  await logJobRun(
    "weekly_kpi_digest",
    processed,
    errorMessages.length ? errorMessages.join("; ") : undefined,
  );
  logger.info({ processed }, "[scheduler] Weekly KPI digest complete");
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 2 — Monthly Scorecard Digest (1st of month, 08:00 UTC)
═══════════════════════════════════════════════════════════════════════════ */

async function runMonthlyScorecardDigest(): Promise<void> {
  logger.info("[scheduler] Running monthly scorecard digest");
  const users = await getAllActiveUsers();
  let processed = 0;
  const errorMessages: string[] = [];

  for (const user of users) {
    try {
      const roster = user.scorecard_roster as { suppliers?: Array<{ id: string; name: string; tier?: string }> } | null;
      if (!roster?.suppliers || roster.suppliers.length === 0) continue;

      const supplierRows: Record<string, string> = {};
      for (const s of roster.suppliers) {
        supplierRows[s.name ?? s.id] = s.tier ?? "Unclassified";
      }

      await sendDigestEmail({
        to:      user.email,
        subject: `📋 Monthly Supplier Scorecard Digest — I Supply Chain`,
        rows: {
          "Account":          `${user.full_name} <${user.email}>`,
          "Company":          user.company ?? "—",
          "Suppliers Tracked": String(roster.suppliers.length),
          "Month":            new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" }),
          ...supplierRows,
        },
      });

      dispatchEvent(user.id, "schedule.monthly_scorecard", {
        supplierCount: roster.suppliers.length,
      });

      processed++;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      errorMessages.push(`user ${user.id}: ${msg}`);
      logger.error({ err, userId: user.id }, "[scheduler] Monthly scorecard digest failed for user");
    }
  }

  await logJobRun(
    "monthly_scorecard",
    processed,
    errorMessages.length ? errorMessages.join("; ") : undefined,
  );
  logger.info({ processed }, "[scheduler] Monthly scorecard digest complete");
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 3 — Lead Follow-up (daily 09:00 UTC — flags leads older than 48 h)
═══════════════════════════════════════════════════════════════════════════ */

async function runLeadFollowup(): Promise<void> {
  logger.info("[scheduler] Running lead follow-up check");

  const result = await db.execute(
    sql`SELECT id, contact_email, contact_name, contact_company, created_at, outputs
        FROM submissions
        WHERE tool IN ('command_centre', 'lead')
          AND created_at < NOW() - INTERVAL '48 hours'
          AND (outputs->>'nudged' IS NULL OR outputs->>'nudged' != 'true')`,
  );
  const staleLeads = result.rows as unknown as SubmissionRow[];

  let processed = 0;
  const errorMessages: string[] = [];

  for (const lead of staleLeads) {
    try {
      // Fire event — picked up by n8n or admin webhook
      dispatchEvent(0, "schedule.lead_followup", {
        submissionId: lead.id,
        contactName:  lead.contact_name,
        contactEmail: lead.contact_email,
        company:      lead.contact_company,
        capturedAt:   lead.created_at,
        hoursElapsed: Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) / 3_600_000,
        ),
      });

      // Mark as nudged so we don't re-fire next run
      const existingOutputs = lead.outputs ?? {};
      await db.execute(
        sql`UPDATE submissions SET outputs = ${JSON.stringify({ ...existingOutputs, nudged: "true", nudgedAt: new Date().toISOString() })}::jsonb WHERE id = ${lead.id}`,
      );

      processed++;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      errorMessages.push(`submission ${lead.id}: ${msg}`);
      logger.error({ err, submissionId: lead.id }, "[scheduler] Lead follow-up failed");
    }
  }

  // Send a summary to admin if any leads were nudged
  if (processed > 0) {
    await sendAlertEmail("📬 Lead Follow-up Nudge Summary", {
      "Leads Flagged":     String(processed),
      "Older Than":        "48 hours",
      "Action Required":   "Review and contact these leads in your CRM / n8n workflow",
      "Nudge Sent At":     new Date().toLocaleString("en-GB", { timeZone: "Asia/Riyadh" }),
    }).catch(err => logger.error({ err }, "[scheduler] Lead follow-up email failed"));
  }

  await logJobRun(
    "lead_followup",
    processed,
    errorMessages.length ? errorMessages.join("; ") : undefined,
  );
  logger.info({ processed }, "[scheduler] Lead follow-up check complete");
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB 4 — Stale Data Nudge (daily 09:30 UTC — no import in 14+ days)
═══════════════════════════════════════════════════════════════════════════ */

async function runStaleDataNudge(): Promise<void> {
  logger.info("[scheduler] Running stale-data nudge check");
  const result = await db.execute(
    sql`SELECT id, email, full_name, company, last_import_at
        FROM users
        WHERE role = 'user'
          AND password_hash IS NOT NULL
          AND (last_import_at IS NULL OR last_import_at < NOW() - INTERVAL '14 days')`,
  );
  const staleUsers = result.rows as Pick<UserRow, "id" | "email" | "full_name" | "company" | "last_import_at">[];

  let processed = 0;
  const errorMessages: string[] = [];

  for (const user of staleUsers) {
    try {
      const lastImport = user.last_import_at
        ? new Date(user.last_import_at).toLocaleDateString("en-GB")
        : "Never";

      await sendDigestEmail({
        to:      user.email,
        subject: "📥 Your KPI data may be out of date — I Supply Chain",
        rows: {
          "Account":        `${user.full_name} <${user.email}>`,
          "Last Import":    lastImport,
          "Days Since":     user.last_import_at
            ? String(Math.floor((Date.now() - new Date(user.last_import_at).getTime()) / 86_400_000))
            : "N/A",
          "Action":         "Log in and import fresh KPI data to keep your dashboard current",
          "Platform":       "https://isupplychain.io/toolkit",
        },
      });

      dispatchEvent(user.id, "schedule.stale_data_nudge", {
        lastImportAt: user.last_import_at,
      });

      processed++;
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      errorMessages.push(`user ${user.id}: ${msg}`);
      logger.error({ err, userId: user.id }, "[scheduler] Stale data nudge failed for user");
    }
  }

  await logJobRun(
    "stale_data_nudge",
    processed,
    errorMessages.length ? errorMessages.join("; ") : undefined,
  );
  logger.info({ processed }, "[scheduler] Stale-data nudge complete");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Boot — called once from src/index.ts
═══════════════════════════════════════════════════════════════════════════ */

export function startScheduler(): void {
  const disabled = (key: string) => process.env[key] === "true";

  if (!disabled("SCHEDULE_DISABLE_WEEKLY_KPI")) {
    // Monday 08:00 UTC
    cron.schedule("0 8 * * 1", () => {
      runWeeklyKpiDigest().catch(err => logger.error({ err }, "[scheduler] Weekly KPI digest uncaught"));
    });
    logger.info("[scheduler] Weekly KPI digest scheduled: Mon 08:00 UTC");
  }

  if (!disabled("SCHEDULE_DISABLE_MONTHLY_SCORECARD")) {
    // 1st of every month, 08:00 UTC
    cron.schedule("0 8 1 * *", () => {
      runMonthlyScorecardDigest().catch(err => logger.error({ err }, "[scheduler] Monthly scorecard uncaught"));
    });
    logger.info("[scheduler] Monthly scorecard digest scheduled: 1st 08:00 UTC");
  }

  if (!disabled("SCHEDULE_DISABLE_LEAD_FOLLOWUP")) {
    // Every day 09:00 UTC
    cron.schedule("0 9 * * *", () => {
      runLeadFollowup().catch(err => logger.error({ err }, "[scheduler] Lead follow-up uncaught"));
    });
    logger.info("[scheduler] Lead follow-up scheduled: daily 09:00 UTC");
  }

  if (!disabled("SCHEDULE_DISABLE_STALE_DATA")) {
    // Every day 09:30 UTC
    cron.schedule("30 9 * * *", () => {
      runStaleDataNudge().catch(err => logger.error({ err }, "[scheduler] Stale-data nudge uncaught"));
    });
    logger.info("[scheduler] Stale-data nudge scheduled: daily 09:30 UTC");
  }

  logger.info("[scheduler] Automation engine started");
}
