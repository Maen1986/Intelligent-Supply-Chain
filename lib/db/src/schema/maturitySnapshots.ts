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
  /**
   * Array of { id, segmentId, title, titleAr, score, level } -- one entry
   * per sub-segment of every segment currently in Deep mode (see
   * Maturity.tsx's deepSegIds). Same trust model as segmentScores: computed
   * client-side by the pure, unit-tested subSegScore()/getLevel() helpers
   * in lib/maturityScoring.ts, sent as-is, stored without server
   * re-derivation -- consistent with this table's existing
   * client-computes/server-stores convention. Nullable: absent entirely
   * for older snapshots taken before this field existed, and legitimately
   * empty when a client completed every segment in Quick mode only (no
   * deep sub-segment answers exist to score). Added 27 Aug 2026 to close
   * Module 06 gap #2 -- the CLM_SUB_SEGMENTS <-> CLMTools.tsx cross-link
   * (a client's `clm-obligations`/`clm-renewal` maturity level, surfaced
   * back inside the CLM Contract Register).
   */
  subSegmentScores: jsonb("sub_segment_scores"),
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
