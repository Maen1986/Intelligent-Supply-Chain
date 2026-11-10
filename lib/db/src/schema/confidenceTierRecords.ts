import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * confidence_tier_records -- storage for the ISC Confidence tier badge
 * (spec X-01, section 6.15A; component: artifacts/i-supply-chain/src/components/TierBadge).
 *
 * SCHEMA ONLY. Added additively; no migration has been generated or applied, nothing
 * reads or writes this table yet, and no route uses it. The repo's schema push
 * (`pnpm --filter @workspace/db run push`) would create it -- that is a deliberate,
 * separate owner step.
 *
 * The five fields map 1:1 to the badge props (tier, basis, confirmedBy, confirmedOn, source).
 * Rules enforced by the component's validateTierRecord(), NOT by the database
 * (so the badge can always fall back to its INSUFFICIENT_DATA state instead of failing a write):
 *   tier 1: basis + (confirmed_by | source) + a date, not in the future
 *   tier 2: a source; no "certain/confirmed/verified/..." wording
 *   tier 3: no extra fields needed
 *
 * Not modelled yet (needs an owner decision): which output/row a record belongs to,
 * the user/organization link, the source-opened date, possible answers, and the edit history
 * ("void by edit", test 251). Add those with the first page that wires the badge in.
 */
export const confidenceTierRecordsTable = pgTable("confidence_tier_records", {
  id:          serial("id").primaryKey(),
  /** 1 = Certain, 2 = Reviewed by ISC (please confirm), 3 = Cannot confirm. Range checked by validateTierRecord(). */
  tier:        integer("tier").notNull(),
  /** Why this tier was assigned (shown as "Basis"). Required for tier 1. */
  basis:       text("basis"),
  /** Tier 1 expert route: name and role of the person who confirmed. */
  confirmedBy: text("confirmed_by"),
  /** Date of confirmation (or of opening the source), YYYY-MM-DD. */
  confirmedOn: date("confirmed_on", { mode: "string" }),
  /** The source ISC opened (tier 1 source route, tier 2). */
  source:      text("source"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const insertConfidenceTierRecordSchema = createInsertSchema(confidenceTierRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConfidenceTierRecord = z.infer<typeof insertConfidenceTierRecordSchema>;
export type ConfidenceTierRecord       = typeof confidenceTierRecordsTable.$inferSelect;
