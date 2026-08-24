import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * clm_contracts -- real backend persistence for the CLM Toolkit's Contract
 * Inventory (#179 Contract Value Tracker, Wave B-6, 2026-08-24).
 *
 * Decision Record 8.10 finding: the CLM toolkit (CLMTools.tsx, ~780 lines,
 * ContractHealthChecker) already existed in full -- 5 tabs, renewal-date
 * tracking with NOTIFY NOW / AUTO-RENEWAL badges, health scoring -- but
 * persisted ONLY to localStorage (isc-tool-clm-contracts-v2) and had no
 * rebate-threshold / purchase-volume fields at all. The genuinely missing
 * piece was real backend persistence plus the rebate-claimability
 * calculator. This table and its route close that gap; the existing
 * renewal-date logic is untouched.
 *
 * Same architectural family as tco_analyses / spend_variance_analyses (see
 * those files' headers for the full rationale) -- deliberately NOT a single
 * JSONB-blob-per-user row, because that pattern is not what this codebase
 * actually uses anywhere for whole-list sync. Instead: one row PER
 * CONTRACT, mirroring tco_analyses' "one row per analysis" shape. Each
 * Contract already carries its own client-generated `id` (via nid() in
 * CLMTools.tsx) and a `name` field, so those map directly onto clientKey/
 * name exactly as TcoAnalysis.id -> clientKey does. The rest of the
 * Contract object (supplier, dates, scores, rebate fields, etc.) is a
 * fixed-but-evolving shape with ~20 scalar fields and is stored as a single
 * JSONB `data` column rather than exploded into ~20 typed columns --
 * matching the "frontend is the source of truth for exact field names"
 * precedent set by spend_variance_analyses.rows, so new Contract fields
 * (like the rebateThreshold/purchaseVolume added in this same change) never
 * require a migration.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as tco_analyses,
 * spend_variance_analyses, and findings_actions.
 *
 * Sync model: whole-state PUT, identical to tco_analyses / spend_variance_
 * analyses (delete-all + bulk-insert in one transaction). Cap raised to 500
 * rows (vs. the 50-scenario cap used for TCO/spend-variance "analyses")
 * because a contract register is a live business inventory, not a handful
 * of named what-if scenarios -- a real mid-size client's CLM footprint can
 * genuinely exceed 50 active contracts.
 */
export const clmContractsTable = pgTable("clm_contracts", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (Contract.id, e.g. an 8-char nid()), carried
   *  across syncs so the frontend can match a server row back to its local
   *  state without relying on the DB-assigned serial id. */
  clientKey:      text("client_key").notNull(),
  name:           text("name").notNull(),
  /** The full Contract object (see CLMTools.tsx) minus id/name bookkeeping
   *  duplication concerns -- id and name are also embedded here for
   *  round-trip fidelity; server reconciliation prefers clientKey/name as
   *  the canonical values on read. */
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertClmContractSchema = createInsertSchema(clmContractsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClmContract = z.infer<typeof insertClmContractSchema>;
export type ClmContractRow    = typeof clmContractsTable.$inferSelect;
