/**
 * Webhook Delivery Retry Runner
 *
 * Scans `webhook_delivery_log` for rows that failed and have a scheduled
 * `next_retry_at` in the past, then re-fires each one.
 *
 * Back-off schedule (up to 3 retries = 4 total attempts):
 *   attempt 1 (initial) fails → retry after  5 minutes
 *   attempt 2 fails           → retry after 15 minutes
 *   attempt 3 fails           → retry after 45 minutes
 *   attempt 4 fails           → permanently failed (no more retries)
 *
 * ## Atomic claim with crash-safe lease
 *
 * Rows are claimed atomically with a single UPDATE that sets
 * `next_retry_at = NOW() + '2 minutes'` (a short processing lease) rather
 * than NULL.  This prevents two concurrent sweeps from processing the same
 * row (SKIP LOCKED + lease window) while also ensuring crash recovery: if
 * the worker dies mid-delivery the lease expires in ≤2 minutes and the row
 * is re-picked up by the next sweep with its original attempt count intact.
 *
 * After delivery:
 *  - Success  → success='ok',    next_retry_at=NULL
 *  - Failure  → success='error', next_retry_at=computeNextRetryAt(newAttempts)
 *  - Crash    → row keeps lease value; re-selected once it expires
 *
 * Called by the scheduler every minute via `startScheduler()`.
 */

import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { computeNextRetryAt, sendWebhookPayload } from "./webhookDispatch";
import { logger } from "./logger";

/** Duration of the processing lease in minutes. */
const LEASE_MINUTES = 2;

interface ClaimedRow extends Record<string, unknown> {
  id:                number;
  event:             string;
  attempts:          number;
  payload:           unknown;
  webhook_config_id: number;
  url:               string;
}

export async function runWebhookRetries(): Promise<void> {
  // Atomically claim all due rows using a short lease (next_retry_at pushed
  // forward) instead of NULL.  SKIP LOCKED prevents two concurrent sweeps
  // from selecting the same rows simultaneously.  If this process crashes
  // after claim but before the per-row update, the lease expires and the next
  // sweep will re-process the row with its original attempt count.
  const claimed = await db.execute<ClaimedRow>(sql`
    UPDATE webhook_delivery_log AS wdl
    SET    next_retry_at = NOW() + ${`${LEASE_MINUTES} minutes`}::interval
    FROM   webhook_configs AS wc
    WHERE  wdl.webhook_config_id = wc.id
      AND  wdl.success            = 'error'
      AND  wdl.next_retry_at     IS NOT NULL
      AND  wdl.next_retry_at     <= NOW()
      AND  wdl.id IN (
             SELECT id
             FROM   webhook_delivery_log
             WHERE  success        = 'error'
               AND  next_retry_at IS NOT NULL
               AND  next_retry_at <= NOW()
             LIMIT 50
             FOR UPDATE SKIP LOCKED
           )
    RETURNING wdl.id,
              wdl.event,
              wdl.attempts,
              wdl.payload,
              wdl.webhook_config_id,
              wc.url
  `);

  const rows = claimed.rows;
  if (rows.length === 0) return;

  logger.info({ count: rows.length }, "[webhookRetry] Retrying failed deliveries");

  for (const row of rows) {
    const storedPayload = row.payload as Record<string, unknown> | null;
    if (!storedPayload) {
      await db.execute(sql`
        UPDATE webhook_delivery_log
        SET    success          = 'error',
               next_retry_at   = NULL,
               response_snippet = 'No payload stored — cannot retry'
        WHERE  id = ${row.id}
      `);
      continue;
    }

    const result       = await sendWebhookPayload(row.url, storedPayload);
    const newAttempts  = (row.attempts ?? 1) + 1;
    const scheduleNext = result.success ? null : computeNextRetryAt(newAttempts);

    await db.execute(sql`
      UPDATE webhook_delivery_log
      SET    success          = ${result.success ? "ok" : "error"},
             status_code      = ${result.statusCode ?? null},
             response_snippet = ${result.responseSnippet},
             attempts         = ${newAttempts},
             next_retry_at    = ${scheduleNext ?? null},
             attempted_at     = NOW()
      WHERE  id = ${row.id}
    `);

    logger.info(
      { logId: row.id, attempts: newAttempts, success: result.success, scheduleNext },
      "[webhookRetry] Delivery retry complete",
    );
  }
}
