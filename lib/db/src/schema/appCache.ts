import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

// Generic key/value cache that survives redeploys (the container filesystem
// is ephemeral on Replit deployments). Used e.g. for the AI-generated
// intelligence feed so the first visitor after a deploy gets an instant hit.
export const appCacheTable = pgTable("app_cache", {
  key:         text("key").primaryKey(),
  value:       jsonb("value").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
});

export type AppCacheEntry = typeof appCacheTable.$inferSelect;
