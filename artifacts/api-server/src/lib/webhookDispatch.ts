import { eq } from "drizzle-orm";
import { db, webhookConfigsTable, webhookDeliveryLogTable } from "@workspace/db";
import { logger } from "./logger";

export interface WebhookConfig {
  id:     number;
  userId: number;
  url:    string;
  events: unknown;
}

export interface SendResult {
  success:         boolean;
  statusCode:      number | null;
  responseSnippet: string;
}

/**
 * Three automatic retries after the initial attempt (4 total delivery attempts).
 * Back-off delays in minutes, indexed by the number of attempts already made:
 *   1 attempt done → wait 5 min before retry 1
 *   2 attempts done → wait 15 min before retry 2
 *   3 attempts done → wait 45 min before retry 3
 *   4 attempts done → no more retries
 */
const MAX_TOTAL_ATTEMPTS  = 4;
const RETRY_DELAYS_MINUTES = [5, 15, 45] as const;

/**
 * Compute the timestamp for the next retry given how many total attempts have
 * already been made.  Returns null when no further retries should be scheduled.
 */
export function computeNextRetryAt(attemptsDone: number): Date | null {
  if (attemptsDone >= MAX_TOTAL_ATTEMPTS) return null;
  const delayIndex = attemptsDone - 1; // 1 done → index 0 (5 min), 2 done → index 1 (15 min), etc.
  const delayMs    = RETRY_DELAYS_MINUTES[delayIndex] * 60 * 1000;
  return new Date(Date.now() + delayMs);
}

/**
 * Fire a raw HTTP POST to `url` with `payload` as JSON.
 * Never throws — all errors are caught and returned in the result.
 * Does NOT write to the database.
 */
export async function sendWebhookPayload(
  url:     string,
  payload: unknown,
): Promise<SendResult> {
  let statusCode: number | null = null;
  let responseSnippet = "";
  let success = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "ISC-Webhook/1.0" },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timer);

    statusCode       = response.status;
    responseSnippet  = (await response.text().catch(() => "")).slice(0, 200);
    success          = response.ok;
  } catch (err) {
    responseSnippet = err instanceof Error ? err.message.slice(0, 200) : "Request failed";
    logger.warn({ err, url }, "Webhook delivery failed");
  }

  return { success, statusCode, responseSnippet };
}

/**
 * Fire a single webhook, log the delivery attempt, and schedule a retry if it
 * fails.  Never throws — failures are caught and logged.
 */
export async function dispatchWebhook(
  webhook: WebhookConfig,
  event:   string,
  data:    unknown,
  userId:  number,
): Promise<SendResult> {
  const payload = {
    event,
    source:    "isc",
    version:   "1",
    timestamp: new Date().toISOString(),
    userId,
    data,
  };

  const result      = await sendWebhookPayload(webhook.url, payload);
  const scheduleRetry = result.success ? null : computeNextRetryAt(1);

  // Log the attempt — fire and forget
  db.insert(webhookDeliveryLogTable)
    .values({
      webhookConfigId: webhook.id,
      event,
      statusCode:      result.statusCode,
      responseSnippet: result.responseSnippet,
      success:         result.success ? "ok" : "error",
      attempts:        1,
      nextRetryAt:     scheduleRetry,
      payload,
    })
    .catch(err => logger.error({ err }, "Failed to log webhook delivery"));

  return result;
}

/**
 * Deliver an event to every webhook the user has configured for it.
 * Subscriptions with an empty events array receive all events.
 * Never awaited by the caller — runs in background.
 */
export function dispatchEvent(userId: number, event: string, data: unknown): void {
  (async () => {
    try {
      const webhooks = await db
        .select()
        .from(webhookConfigsTable)
        .where(eq(webhookConfigsTable.userId, userId));

      for (const wh of webhooks) {
        const subscribed = Array.isArray(wh.events) ? (wh.events as string[]) : [];
        if (subscribed.length === 0 || subscribed.includes(event)) {
          dispatchWebhook(wh, event, data, userId).catch(
            err => logger.error({ err }, "dispatchWebhook threw"),
          );
        }
      }
    } catch (err) {
      logger.error({ err }, "dispatchEvent failed to load webhooks");
    }
  })();
}
