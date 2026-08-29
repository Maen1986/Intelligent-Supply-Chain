/**
 * Scheduled Automation Engine
 *
 * Runs six cron jobs inside the API server process (no external scheduler needed).
 * Each job is configurable — set the corresponding env var to "true" to disable it.
 *
 *   SCHEDULE_DISABLE_WEEKLY_KPI=true       skip Monday 08:00 KPI digest
 *   SCHEDULE_DISABLE_MONTHLY_SCORECARD=true skip 1st-of-month scorecard digest
 *   SCHEDULE_DISABLE_LEAD_FOLLOWUP=true    skip 48-hour lead nudge check
 *   SCHEDULE_DISABLE_STALE_DATA=true       skip 14-day stale-data nudge
 *   SCHEDULE_DISABLE_ACTION_FOLLOWUP=true  skip findings_actions plan-started / overdue nudge
 *   SCHEDULE_DISABLE_INDUSTRY_BENCHMARKS=true  skip nightly industry-benchmark recompute (#398)
 *
 * All schedule times are UTC.
 */

import cron              from "node-cron";
import { sql }           from "drizzle-orm";
import { db, scheduleLogTable } from "@workspace/db";
import { dispatchEvent } from "./webhookDispatch";
import { runWebhookRetries } from "./webhookRetry";
import { sendAlertEmail, sendDigestEmail } from "./notifyHelpers";
import { logger }        from "./logger";
import { recomputeIndustryBenchmarks } from "./industryBenchmarks";

/* ──── types ──── */

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

/* ──── schedule_log helper ──── */

async function logJobRun(jobName: string, usersProcessed: number, errors?: string): Promise<void> {
  await db
    .insert(scheduleLogTable)
    .values({ jobName, usersProcessed, errors: errors ?? null })
    .catch(err => logger.error({ err, jobName }, "[scheduler] Failed to write schedule_log"));
}

/* ──── shared query helpers ──── */

async function getAllActiveUsers(): Promise<UserRow[]> {
  const result = await db.execute(
    sql`SELECT id, email, full_name, company, tool_data, scorecard_roster, last_import_at
        FROM users
        WHERE role = 'user' AND password_hash IS NOT NULL`,
  );
  return result.rows as unknown as UserRow[];
}

/* ════
   JOB 1 — Weekly KPI Digest (Monday 08:00 UTC)
════ */

export async function runWeeklyKpiDigest(): Promise<void> {
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

      const result = await sendDigestEmail({
        to:      user.email,
        subject: `📊 Your Weekly KPI Summary — I Supply Chain`,
        rows,
      });

      if (!result.sent) {
        throw new Error(result.reason ?? "sendDigestEmail returned sent:false");
      }

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

/* ════
   JOB 2 — Monthly Scorecard Digest (1st of month, 08:00 UTC)
════ */

export async function runMonthlyScorecardDigest(): Promise<void> {
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

      const result = await sendDigestEmail({
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

      if (!result.sent) {
        throw new Error(result.reason ?? "sendDigestEmail returned sent:false");
      }

      dispatchEvent(user.id, "schedule.monthly_scorecard", {
        supplierCount: roster.suppliers.length,
        userEmail:     user.email,
        userName:      user.full_name ?? null,
        month: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" }),
        suppliers: roster.suppliers.map(s => ({ name: s.name ?? s.id, tier: s.tier ?? "Unclassified" })),
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

/* ════
   JOB 3 — Lead Follow-up (daily 09:00 UTC — flags leads older than 48 h)
════ */

export async function runLeadFollowup(): Promise<void> {
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

/* ════
   JOB 4 — Stale Data Nudge (daily 09:30 UTC — no import in 14+ days)
════ */

export async function runStaleDataNudge(): Promise<void> {
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

      const result = await sendDigestEmail({
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

      if (!result.sent) {
        throw new Error(result.reason ?? "sendDigestEmail returned sent:false");
      }

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

/* ════
   JOB 5 — Action Follow-up (daily 10:00 UTC -- findings_actions, Task #205/#189)

   Two distinct signals, not one blunt timer (see findingsActions.ts header
   for why): (1) a plan that's sat untouched for 7+ days since it was
   generated gets a gentle "get started" nudge, once; (2) a plan the client
   HAS started, where an item's phase has now passed its 30/60/90-day mark
   from planStartedAt (not row creation -- anchoring to creation would flag
   historical plans as instantly "overdue" the moment this job first runs),
   gets a separate "you're behind" nudge, once per item. Deliberately does
   NOT filter to password_hash IS NOT NULL like jobs 1/2/4 -- claimed-but-
   passwordless accounts (Engine 2 Part B, the Diagnostic claim-link) are a
   first-class target for this job, not an edge case to exclude.
════ */

interface PlanNotStartedRow {
  user_id:       number;
  source:        string;
  source_ref_id: number;
  email:         string;
  full_name:     string;
  item_count:    string | number;
}

interface OverdueItemRow {
  id:            number;
  user_id:       number;
  source:        string;
  source_ref_id: number;
  phase:         string;
  action:        string;
  segment_title: string | null;
  email:         string;
  full_name:     string;
}

export async function runActionFollowup(): Promise<void> {
  logger.info("[scheduler] Running action follow-up check");
  let processed = 0;
  const errorMessages: string[] = [];

  // ──── Signal 1: plan generated 7+ days ago, never started ────
  try {
    const result = await db.execute(sql`
      SELECT fa.user_id, fa.source, fa.source_ref_id, u.email, u.full_name, COUNT(*) AS item_count
      FROM findings_actions fa
      JOIN users u ON u.id = fa.user_id
      WHERE fa.plan_started_at IS NULL
        AND fa.start_nudged_at IS NULL
        AND fa.created_at < NOW() - INTERVAL '7 days'
      GROUP BY fa.user_id, fa.source, fa.source_ref_id, u.email, u.full_name
    `);
    const plans = ((result as any).rows ?? result) as PlanNotStartedRow[];

    for (const plan of plans) {
      try {
        const digestResult = await sendDigestEmail({
          to:      plan.email,
          subject: "📋 Your action plan is ready — you haven't started yet",
          rows: {
            "Account":  `${plan.full_name} <${plan.email}>`,
            "Source":   plan.source,
            "Items":    String(plan.item_count),
            "Action":   "Open your Action Tracker to start working through it",
            "Platform": "https://isupplychain.io/action-tracker",
          },
        });
        if (!digestResult.sent) {
          throw new Error(digestResult.reason ?? "sendDigestEmail returned sent:false");
        }

        dispatchEvent(plan.user_id, "schedule.action_plan_not_started", {
          source:      plan.source,
          sourceRefId: plan.source_ref_id,
          itemCount:   plan.item_count,
        });

        await db.execute(sql`
          UPDATE findings_actions
          SET start_nudged_at = NOW()
          WHERE user_id = ${plan.user_id} AND source = ${plan.source} AND source_ref_id = ${plan.source_ref_id}
            AND start_nudged_at IS NULL
        `);

        processed++;
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        errorMessages.push(`user ${plan.user_id} plan ${plan.source}-${plan.source_ref_id}: ${msg}`);
        logger.error({ err, userId: plan.user_id }, "[scheduler] Plan-not-started nudge failed for user");
      }
    }
  } catch (err) {
    errorMessages.push(`plan-not-started query: ${(err as Error)?.message ?? String(err)}`);
    logger.error({ err }, "[scheduler] Plan-not-started query failed");
  }

  // ──── Signal 2: plan started, a phase has passed its 30/60/90-day mark ────
  try {
    const result = await db.execute(sql`
      SELECT fa.id, fa.user_id, fa.source, fa.source_ref_id, fa.phase, fa.action, fa.segment_title, u.email, u.full_name
      FROM findings_actions fa
      JOIN users u ON u.id = fa.user_id
      WHERE fa.status != 'done'
        AND fa.plan_started_at IS NOT NULL
        AND fa.phase IS NOT NULL
        AND fa.nudged_at IS NULL
        AND fa.plan_started_at + (
          CASE fa.phase
            WHEN 'days30' THEN INTERVAL '30 days'
            WHEN 'days60' THEN INTERVAL '60 days'
            WHEN 'days90' THEN INTERVAL '90 days'
            ELSE INTERVAL '9999 days'
          END
        ) < NOW()
    `);
    const items = ((result as any).rows ?? result) as OverdueItemRow[];

    const byUser = new Map<number, OverdueItemRow[]>();
    for (const item of items) {
      const arr = byUser.get(item.user_id) ?? [];
      arr.push(item);
      byUser.set(item.user_id, arr);
    }

    for (const [userId, userItems] of byUser) {
      try {
        const rows: Record<string, string> = {
          "Account":       `${userItems[0].full_name} <${userItems[0].email}>`,
          "Overdue Items": String(userItems.length),
        };
        userItems.slice(0, 8).forEach((item, i) => {
          rows[`${i + 1}. ${item.segment_title ?? item.phase}`] = item.action;
        });

        const digestResult = await sendDigestEmail({
          to:      userItems[0].email,
          subject: "⏰ Your action plan has items falling behind schedule",
          rows,
        });
        if (!digestResult.sent) {
          throw new Error(digestResult.reason ?? "sendDigestEmail returned sent:false");
        }

        dispatchEvent(userId, "schedule.action_overdue", {
          overdueCount: userItems.length,
          items: userItems.map(i => ({ id: i.id, phase: i.phase, action: i.action })),
        });

        for (const item of userItems) {
          await db.execute(sql`UPDATE findings_actions SET nudged_at = NOW() WHERE id = ${item.id}`);
        }

        processed++;
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        errorMessages.push(`user ${userId} overdue: ${msg}`);
        logger.error({ err, userId }, "[scheduler] Overdue nudge failed for user");
      }
    }
  } catch (err) {
    errorMessages.push(`overdue query: ${(err as Error)?.message ?? String(err)}`);
    logger.error({ err }, "[scheduler] Overdue query failed");
  }

  await logJobRun(
    "action_followup",
    processed,
    errorMessages.length ? errorMessages.join("; ") : undefined,
  );
  logger.info({ processed }, "[scheduler] Action follow-up check complete");
}

/* ════
   JOB 6 — Nightly Industry Benchmark Recompute (02:00 UTC)
   Registry #398 (Score-Max Plan v3 lever 3, built 30 Aug 2026). Recomputes
   every (industry, companySize, segmentId) cohort cell from the latest
   maturity_snapshots row per organization. See lib/industryBenchmarks.ts
   for the aggregation and privacy-floor logic this job just invokes.
════ */

export async function runIndustryBenchmarkRecompute(): Promise<void> {
  logger.info("[scheduler] Running industry benchmark recompute");
  try {
    const { cellsWritten, cellsPrunedBelowFloor, contributingOrganizations } = await recomputeIndustryBenchmarks();
    await logJobRun("industry_benchmarks", contributingOrganizations);
    logger.info(
      { cellsWritten, cellsPrunedBelowFloor, contributingOrganizations },
      "[scheduler] Industry benchmark recompute complete",
    );
  } catch (err) {
    await logJobRun("industry_benchmarks", 0, (err as Error)?.message ?? String(err));
    logger.error({ err }, "[scheduler] Industry benchmark recompute failed");
  }
}

/* ════
   Boot — called once from src/index.ts
════ */

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

  if (!disabled("SCHEDULE_DISABLE_ACTION_FOLLOWUP")) {
    // Every day 10:00 UTC
    cron.schedule("0 10 * * *", () => {
      runActionFollowup().catch(err => logger.error({ err }, "[scheduler] Action follow-up uncaught"));
    });
    logger.info("[scheduler] Action follow-up scheduled: daily 10:00 UTC");
  }

  if (!disabled("SCHEDULE_DISABLE_INDUSTRY_BENCHMARKS")) {
    // Every day 02:00 UTC
    cron.schedule("0 2 * * *", () => {
      runIndustryBenchmarkRecompute().catch(err => logger.error({ err }, "[scheduler] Industry benchmark recompute uncaught"));
    });
    logger.info("[scheduler] Industry benchmark recompute scheduled: daily 02:00 UTC");
  }

  // Webhook retry sweep — every minute
  cron.schedule("* * * * *", () => {
    runWebhookRetries().catch(err => logger.error({ err }, "[scheduler] Webhook retry sweep uncaught"));
  });
  logger.info("[scheduler] Webhook retry sweep scheduled: every minute");

  logger.info("[scheduler] Automation engine started");
}
