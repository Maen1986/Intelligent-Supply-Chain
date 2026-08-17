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
 *
 * Provenance / trust model (#183 — content honesty pass, mirrors the model
 * already used for regulatory_countries). These KPI/lever/risk numbers are
 * internal 0-100 composite reference indices, NOT literal external market
 * statistics — no publicly available GCC-country-specific benchmark study
 * exists at this granularity for most of these measures. `sourceUrl` and
 * `methodologyNote` document what real external frameworks (if any)
 * informed the calibration; `status` stays 'pending_review' until a named
 * human expert signs off — nothing here should be presented to a client as
 * "verified GCC data" without that review, same rule as regulatory_countries.
 */
export const gccBenchmarksTable = pgTable("gcc_benchmarks", {
  id:                serial("id").primaryKey(),
  category:          text("category").notNull(),    // 'kpi' | 'lever' | 'risk'
  itemId:            text("item_id").notNull(),      // e.g. 'otif', 'catMgmt', 'supply'
  industry:          text("industry"),              // NULL = GCC-wide default
  label:             text("label"),
  data:              jsonb("data").notNull(),
  sourceUrl:         text("source_url"),
  status:            text("status").notNull().default("pending_review"), // 'verified' | 'pending_review'
  lastVerifiedAt:    timestamp("last_verified_at", { withTimezone: true }),
  methodologyNote:   text("methodology_note"),
  methodologyNoteAr: text("methodology_note_ar"),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy:         text("updated_by"),
});

export type GccBenchmark       = typeof gccBenchmarksTable.$inferSelect;
export type InsertGccBenchmark = typeof gccBenchmarksTable.$inferInsert;
