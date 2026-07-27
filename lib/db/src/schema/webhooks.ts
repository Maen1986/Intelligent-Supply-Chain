import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const webhookConfigsTable = pgTable("webhook_configs", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  url:       text("url").notNull(),
  events:    jsonb("events").notNull().default([]), // string[] of subscribed event names
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookDeliveryLogTable = pgTable("webhook_delivery_log", {
  id:               serial("id").primaryKey(),
  webhookConfigId:  integer("webhook_config_id").notNull().references(() => webhookConfigsTable.id, { onDelete: "cascade" }),
  event:            text("event").notNull(),
  statusCode:       integer("status_code"),
  responseSnippet:  text("response_snippet"),
  success:          text("success").notNull().default("pending"), // 'ok' | 'error' | 'pending'
  attemptedAt:      timestamp("attempted_at").defaultNow().notNull(),
  /** How many delivery attempts have been made (starts at 1, max 3). */
  attempts:         integer("attempts").notNull().default(1),
  /** When to make the next retry attempt; NULL means no retry scheduled. */
  nextRetryAt:      timestamp("next_retry_at", { withTimezone: true }),
  /** Original event payload stored so retries can replay the exact data. */
  payload:          jsonb("payload"),
});

export type WebhookConfig      = typeof webhookConfigsTable.$inferSelect;
export type WebhookDeliveryLog = typeof webhookDeliveryLogTable.$inferSelect;
