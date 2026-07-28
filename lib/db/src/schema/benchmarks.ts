import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * gcc_benchmarks — Admin-managed market benchmark dataset.
 *
 * category: 'kpi'   → data: { median: number, topQ: number }  (0-100 normalised score)
 * category: 'lever' → data: { maxPct: number }                 (max savings fraction of spend)
 * category: 'risk'  → data: { gcMedian: number, gcTopQ: number } (raw risk exposure points)
 *
 * industry = NULL means "GCC-wide" and acts as the fallback when no
 * industry-specific row exists.  Industry-specific rows override GCC-wide
 * ones in the frontend benchmark hook.
 */
export const gccBenchmarksTable = pgTable("gcc_benchmarks", {
  id:        serial("id").primaryKey(),
  category:  text("category").notNull(),    // 'kpi' | 'lever' | 'risk'
  itemId:    text("item_id").notNull(),      // e.g. 'otif', 'catMgmt', 'supply'
  industry:  text("industry"),              // NULL = GCC-wide default
  label:     text("label"),
  data:      jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by"),
});

export type GccBenchmark       = typeof gccBenchmarksTable.$inferSelect;
export type InsertGccBenchmark = typeof gccBenchmarksTable.$inferInsert;
