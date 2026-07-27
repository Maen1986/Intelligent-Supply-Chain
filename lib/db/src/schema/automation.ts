import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** Records every inbound webhook call received at POST /api/webhooks/inbound */
export const inboundWebhookLogTable = pgTable("inbound_webhook_log", {
  id:          serial("id").primaryKey(),
  action:      text("action").notNull(),
  bodySnippet: text("body_snippet"),
  status:      text("status").notNull().default("ok"), // 'ok' | 'error'
  error:       text("error"),
  receivedAt:  timestamp("received_at").defaultNow().notNull(),
});

/** In-app notifications written by inbound webhook or scheduled jobs */
export const notificationsTable = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  body:      text("body").notNull(),
  read:      boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InboundWebhookLog = typeof inboundWebhookLogTable.$inferSelect;
export type Notification      = typeof notificationsTable.$inferSelect;
