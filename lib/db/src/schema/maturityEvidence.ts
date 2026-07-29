import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { maturitySnapshotsTable } from "./maturitySnapshots";

/**
 * maturity_evidence — Per-sub-segment document evidence for the confidence-tier system.
 *
 * One row per uploaded file. A given (user_id, snapshot_id, seg_id, subseg_id)
 * combination may only have ONE confirmed row (enforced at the route level).
 *
 * confidence_tier flow:
 *   self_reported → ai_evaluated (after GPT-4o eval succeeds)
 *             or → stays self_reported (if eval fails or file is flagged)
 *   ai_evaluated  → consultant_validated (after admin review)
 *
 * Allowed MIME types: application/pdf, application/msword,
 *   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
 *   image/png, image/jpeg, image/webp.
 */
export const maturityEvidenceTable = pgTable("maturity_evidence", {
  id:               serial("id").primaryKey(),
  /** Owner of the evidence — must match session on every client read/write. */
  userId:           integer("user_id").notNull().references(() => usersTable.id),
  /** The assessment run this evidence supports. */
  snapshotId:       integer("snapshot_id").notNull().references(() => maturitySnapshotsTable.id),
  /** Segment ID, e.g. "strategy" */
  segId:            text("seg_id").notNull(),
  /** Sub-segment ID, e.g. "strategy-align" */
  subSegId:         text("subseg_id").notNull(),
  /**
   * English label of the sub-segment, stored at upload time so the AI
   * evaluation prompt has full context without needing frontend data files.
   */
  subSegLabel:      text("subseg_label").notNull().default(""),
  /** English hint describing what document is expected. */
  subSegHint:       text("subseg_hint").notNull().default(""),
  /**
   * Object path in the private bucket, e.g.
   * "/objects/maturity-evidence/{userId}/{snapshotId}/{segId}/{subSegId}/{uuid}.pdf"
   * Resolved via ObjectStorageService.getObjectEntityFile().
   */
  storagePath:      text("storage_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType:         text("mime_type").notNull(),
  /**
   * GPT-4o structured evaluation result. NULL until the async eval finishes.
   * Shape: { plausible_support: boolean; confidence: "high"|"medium"|"low";
   *          flag_reason: "generic_template"|"blank_or_irrelevant"|
   *                       "contradicts_claimed_level"|null; summary: string }
   */
  aiEvaluation:     jsonb("ai_evaluation"),
  /**
   * Confidence tier. Allowed values enforced at the application layer:
   *   "self_reported"       — default, no AI eval yet
   *   "ai_evaluated"        — GPT-4o confirmed plausible support
   *   "consultant_validated"— admin manually validated
   */
  confidenceTier:   text("confidence_tier").notNull().default("self_reported"),
  /** Admin review notes (bilingual, plain text). */
  consultantNotes:  text("consultant_notes"),
  /** Which admin user performed the review. */
  reviewedBy:       integer("reviewed_by").references(() => usersTable.id),
  reviewedAt:       timestamp("reviewed_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export interface AiEvaluation {
  plausible_support: boolean;
  confidence:   "high" | "medium" | "low";
  flag_reason:  "generic_template" | "blank_or_irrelevant" | "contradicts_claimed_level" | null;
  summary:      string;
}

export type MaturityEvidence       = typeof maturityEvidenceTable.$inferSelect;
export type InsertMaturityEvidence = typeof maturityEvidenceTable.$inferInsert;
