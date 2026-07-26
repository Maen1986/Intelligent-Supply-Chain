import { eq } from "drizzle-orm";
import { db, webhookConfigsTable, webhookDeliveryLogTable } from "@workspace/db";
import { logger } from "./logger";

export interface WebhookConfig {
  id:     number;
  userId: number;
  url:    string;
  events: unknown;
}

interface DispatchResult {
  success:         boolean;
  statusCode:      number | null;
  responseSnippet: string;
}

/**
 * Fire a single webhook and log the delivery attempt.
 * Never throws — failures are caught and logged.
 */
export async function dispatchWebhook(
  webhook:  WebhookConfig,
  event:    string,
  data:     unknown,
  userId:   number,
): Promise<DispatchResult> {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    userId,
  };

  let statusCode: number | null = null;
  let responseSnippet = "";
  let success = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(webhook.url, {
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
    logger.warn({ err, url: webhook.url }, "Webhook delivery failed");
  }

  // Log the attempt — fire and forget
  db.insert(webhookDeliveryLogTable)
    .values({
      webhookConfigId: webhook.id,
      event,
      statusCode,
      responseSnippet,
      success: success ? "ok" : "error",
    })
    .catch(err => logger.error({ err }, "Failed to log webhook delivery"));

  return { success, statusCode, responseSnippet };
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
