import { pgTable, serial, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * tco_trend_snapshots -- real backend persistence for TCO trend history
 * (#168 TCO reporting, 2026-08-23, "all if suitable" scope from the user's
 * "have you considered a reporting tool and DB for the TCO?" question).
 *
 * One row per (user, analysis, calendar month) -- the "best TCO/unit right
 * now" for a given saved analysis, captured monthly so the TCO tab can plot
 * a real trend line instead of only ever showing the current snapshot.
 *
 * Design precedent: mirrors maturity_snapshots (server-side persisted,
 * point-in-time state for trend tracking) rather than Supplier Scorecard's
 * TrendSnapshot type (which is localStorage-only, never synced). TCO
 * already has real per-row backend persistence via tco_analyses, so its
 * trend history gets the same treatment rather than inheriting Scorecard's
 * older, browser-only pattern.
 *
 * Keyed by analysisClientKey (the same client-generated key already used by
 * tco_analyses.clientKey) rather than a DB foreign key to tco_analyses.id --
 * consistent with tco_analyses' own rationale (frontend reconciles by
 * clientKey, not DB-assigned id) and additionally lets a trend survive an
 * analysis being deleted and recreated with the same key, or (a documented
 * v1 limitation) means a snapshot becomes orphaned/unlabelled context if the
 * analysis is deleted outright -- acceptable since the row still carries
 * its own analysisName/itemName captured at snapshot time for display.
 *
 * One snapshot per (user, analysis, month): the UNIQUE constraint plus
 * ON CONFLICT DO UPDATE in the route means re-saving the same analysis
 * later in the same month *replaces* that month's figure with the latest
 * one, rather than accumulating duplicate rows -- same monthly-dedup
 * intent as Scorecard's trend feature, enforced at the DB layer here
 * instead of client-side array filtering.
 */
export const tcoTrendSnapshotsTable = pgTable("tco_trend_snapshots", {
  id:                serial("id").primaryKey(),
  userId:            integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  analysisClientKey: text("analysis_client_key").notNull(),
  /** Server-computed "YYYY-MM" at insert time -- never trusts a client-sent
   *  month, so a snapshot can't be backdated/forward-dated by the caller. */
  month:             text("month").notNull(),
  /** Captured at snapshot time so the row still reads sensibly even if the
   *  source analysis is later renamed or deleted. */
  analysisName:      text("analysis_name").notNull(),
  itemName:          text("item_name"),
  bestSupplierName:  text("best_supplier_name"),
  bestTcoPerUnit:    numeric("best_tco_per_unit", { precision: 14, scale: 2 }).notNull(),
  bestTcoAnnual:     numeric("best_tco_annual",   { precision: 16, scale: 2 }),
  /** % saved vs. the most expensive supplier in the same analysis, 0-100. */
  savingsPct:        numeric("savings_pct", { precision: 5, scale: 2 }),
  supplierCount:     integer("supplier_count"),
  createdAt:         timestamp("created_at").defaultNow().notNull(),
});

export type TcoTrendSnapshotRow    = typeof tcoTrendSnapshotsTable.$inferSelect;
export type InsertTcoTrendSnapshot = typeof tcoTrendSnapshotsTable.$inferInsert;
