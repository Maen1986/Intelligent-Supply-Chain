import { pgTable, serial, text, integer, date, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * confidence_tier_records -- storage for the ISC Confidence tier badge (spec X-01,
 * sections 6.15A / 6.15B; component: artifacts/i-supply-chain/src/components/TierBadge).
 *
 * ADDITIVE and NOT YET WIRED: no route reads or writes this table, and no migration
 * has been generated or applied for it. It is deliberately independent of
 * maturity_evidence.confidence_tier (a different, older concept: self_reported /
 * ai_evaluated / consultant_validated) -- this table is the X-01 Tier 1 / 2 / 3 model.
 *
 * The five record fields of the badge are `tier`, `basis`, `confirmed_by`,
 * `confirmed_on` and `source`. They are nullable on purpose: validateTierRecord()
 * (TierBadge/tierRecord.ts) decides whether a record may be shown as the tier it
 * claims, and an incomplete record renders as the safe INSUFFICIENT_DATA state
 * ("never guess") -- the database must not invent defaults for them.
 *   tier         1 | 2 | 3 (CHECK constraint); NULL = no tier recorded yet
 *   basis        why this tier was assigned
 *   confirmed_by Tier 1 expert route: name and role of the confirmer
 *   confirmed_on Tier 1: date of confirmation (or date the source was opened)
 *   source       Tier 1 source route / Tier 2: the source that was opened
 *
 * (subjectType, subjectRefId) identify the statement the tier applies to, in the
 * same loose style as findings_actions (source + sourceRefId); no FK, because the
 * subjects live in several different tables.
 *
 * Out of scope here (see the integration note): history / "void by edit" (test 251),
 * the set-or-change form, the API.
 */
export const confidenceTierRecordsTable = pgTable(
  "confidence_tier_records",
  {
    id:           serial("id").primaryKey(),
    /** Kind of statement the tier applies to, e.g. 'answer' | 'finding' | 'report_row' -- extend as pages are wired in. */
    subjectType:  text("subject_type").notNull(),
    /** Id of that statement in its own table. */
    subjectRefId: integer("subject_ref_id").notNull(),
    tier:         integer("tier"),
    basis:        text("basis"),
    confirmedBy:  text("confirmed_by"),
    confirmedOn:  date("confirmed_on", { mode: "string" }),
    source:       text("source"),
    createdAt:    timestamp("created_at").defaultNow().notNull(),
    updatedAt:    timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    check("confidence_tier_records_tier_chk", sql`${t.tier} IS NULL OR ${t.tier} IN (1, 2, 3)`),
    index("confidence_tier_records_subject_idx").on(t.subjectType, t.subjectRefId),
  ],
);

export const insertConfidenceTierRecordSchema = createInsertSchema(confidenceTierRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConfidenceTierRecord = z.infer<typeof insertConfidenceTierRecordSchema>;
export type ConfidenceTierRecord       = typeof confidenceTierRecordsTable.$inferSelect;
