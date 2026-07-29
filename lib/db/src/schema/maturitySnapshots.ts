import { pgTable, serial, integer, text, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

/**
 * maturity_snapshots — Persists each completed user assessment for trend tracking.
 *
 * One row per assessment run.  Segment scores and overall score are stored
 * server-side so the trend view never needs to re-derive them.
 * `remedy_actions` is populated in a second PATCH after the AI roadmap resolves.
 */
export const maturitySnapshotsTable = pgTable("maturity_snapshots", {
  id:            serial("id").primaryKey(),
  /** FK → users(id) — ownership enforced at the query level on every read/write */
  userId:        integer("user_id").notNull(),
  /** Timestamped in UTC when the row is inserted */
  takenAt:       timestamp("taken_at", { withTimezone: true }).defaultNow().notNull(),
  industry:      text("industry"),
  companySize:   text("company_size"),
  /** Full flat answer map, e.g. { "0-0": 3, "1-2": 4, … } */
  answers:       jsonb("answers").notNull(),
  /**
   * Array of { id, title, titleAr, score, level } — one entry per segment.
   * Server recomputes and validates overall_score from these; the client-sent
   * per-segment scores are stored for delta display without re-scoring.
   */
  segmentScores: jsonb("segment_scores").notNull(),
  /** Server-recomputed overall mean across all completed segments */
  overallScore:  numeric("overall_score", { precision: 4, scale: 2 }).notNull(),
  /**
   * 0–100 percentage of sub-segments covered by 3-part answer keys.
   * 0 in the common case (flat-only assessment); >0 once sub-seg questions ship.
   */
  coveragePct:   numeric("coverage_pct",  { precision: 5, scale: 2 }).notNull(),
  /**
   * AI-generated remedy roadmap stored at snapshot time.
   * Populated by a subsequent PATCH once the AI plan resolves.
   * Used by the next assessment's remedy correlation panel.
   */
  remedyActions: jsonb("remedy_actions"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export type MaturitySnapshot       = typeof maturitySnapshotsTable.$inferSelect;
export type InsertMaturitySnapshot = typeof maturitySnapshotsTable.$inferInsert;
