import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Records every inbound webhook call received at POST /api/webhooks/inbound.
 *
 * NOTE: the production table was created with `id text` in an older deployment.
 * The table is excluded from drizzle-kit migrations via tablesFilter in
 * drizzle.config.ts so Drizzle never tries to ALTER the column type.
 * The app supplies an explicit text id on every insert (see webhooksInbound.ts).
 */
export const inboundWebhookLogTable = pgTable("inbound_webhook_log", {
  id:          text("id").primaryKey(),
  action:      text("action").notNull(),
  bodySnippet: text("body_snippet"),
  status:      text("status").notNull().default("ok"), // 'ok' | 'error'
  error:       text("error"),
  receivedAt:  timestamp("received_at").defaultNow().notNull(),
});

/** In-app notifications written by inbound webhook or scheduled jobs */
export const notificationsTable = pgTable("notifications", {
  id:        integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId:    integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title:     text("title").notNull(),
  body:      text("body").notNull(),
  read:      boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Audit log for every scheduled job run */
export const scheduleLogTable = pgTable("schedule_log", {
  id:             integer("id").primaryKey().generatedByDefaultAsIdentity(),
  jobName:        text("job_name").notNull(),
  ranAt:          timestamp("ran_at").defaultNow().notNull(),
  usersProcessed: integer("users_processed").notNull().default(0),
  errors:         text("errors"),
});

export type InboundWebhookLog = typeof inboundWebhookLogTable.$inferSelect;
export type Notification      = typeof notificationsTable.$inferSelect;
export type ScheduleLog       = typeof scheduleLogTable.$inferSelect;
