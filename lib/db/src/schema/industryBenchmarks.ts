import { pgTable, serial, text, integer, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * industry_benchmarks — cross-client benchmarking infrastructure (registry
 * #398, Score-Max Plan v3 lever 3, built 30 Aug 2026 per direct owner
 * instruction after this was previously only scoped -- see
 * cross-client-benchmarking-infrastructure-scoping-v1.md for the full
 * design rationale this file implements).
 *
 * One row per (industry, companySize, segmentId) cohort cell, recomputed
 * nightly by recomputeIndustryBenchmarks() (lib/industryBenchmarks.ts) from
 * the LATEST maturity_snapshots row per organization -- never every
 * historical snapshot, so a client who reassesses monthly does not dominate
 * the benchmark they are compared against.
 *
 * Privacy floor (MIN_COHORT_SIZE, currently 5): a cell with fewer than 5
 * contributing organizations is deleted rather than stored with a small,
 * de-anonymizable sample. Absence of a row IS the signal -- the read route
 * returns { insufficientSample: true } for missing cells rather than ever
 * exposing a sub-floor aggregate.
 *
 * Honest gating fact (Decision Record 8.7): this table can be empty today
 * -- ISC has zero confirmed paying clients as of this build. The
 * infrastructure is real, tested, and live; a populated, credible
 * cross-client benchmark is not, and cannot be, until real clients run
 * real assessments. See Investor Pitch-Readiness Positioning doc, the
 * Competitive Moat row, for how this is honestly represented to investors.
 */
export const industryBenchmarksTable = pgTable("industry_benchmarks", {
  id:             serial("id").primaryKey(),
  industry:       text("industry").notNull(),
  companySize:    text("company_size").notNull(),
  segmentId:      text("segment_id").notNull(),
  segmentTitle:   text("segment_title"),
  segmentTitleAr: text("segment_title_ar"),
  /** Count of contributing ORGANIZATIONS (deduplicated), never raw snapshots. */
  sampleSize:     integer("sample_size").notNull(),
  meanScore:      numeric("mean_score",   { precision: 4, scale: 2 }).notNull(),
  medianScore:    numeric("median_score", { precision: 4, scale: 2 }).notNull(),
  p25Score:       numeric("p25_score",    { precision: 4, scale: 2 }).notNull(),
  p75Score:       numeric("p75_score",    { precision: 4, scale: 2 }).notNull(),
  lastComputedAt: timestamp("last_computed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cohortCell: uniqueIndex("industry_benchmarks_cohort_cell").on(table.industry, table.companySize, table.segmentId),
}));

export type IndustryBenchmark       = typeof industryBenchmarksTable.$inferSelect;
export type InsertIndustryBenchmark = typeof industryBenchmarksTable.$inferInsert;
