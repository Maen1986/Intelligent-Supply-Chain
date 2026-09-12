import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * blacklist_events -- real backend persistence for the Supplier Lifecycle
 * Governance Supplier Blacklist Operational tier (Item 6 of 7, 12 Sep 2026),
 * following the same two-tier architecture and append-only event-log-plus-
 * replay pattern already applied to COPQ, RACI, ASL, Onboarding, the
 * governance-tier override, and Periodic Evaluation.
 *
 * WHAT THIS TABLE IS NOT: it is not a duplicate of asl_decision_events'
 * 'suspended'/'revoked' lifecycle states -- see supplierBlacklist.ts's own
 * "WHAT THIS IS, AND WHAT IT IS DELIBERATELY NOT" header for the full
 * distinction (blacklist is an affirmative for-cause finding with due-
 * process implications; ASL suspension/revocation is administrative,
 * often no-fault). A finalized row here also produces a REAL, separate row
 * in the EXISTING asl_decision_events table (decisionType: 'revoked',
 * reasonCategory: 'compliance_violation') -- written by the route layer,
 * not by this table -- so a supplier's Item 3 ASL status stays derived from
 * its own single source of truth, per that table's own design, rather than
 * this table introducing a second, competing status field.
 *
 * APPEND-ONLY BY DESIGN, same family and rationale as every table in this
 * lineage: 'draft_set' / 'draft_clear' / 'finalized' / 'reversed' are each a
 * NEW row; current state (is this supplier actively blacklisted, is a
 * time-bound entry now expired, is there an open unfinalized draft) is
 * always DERIVED by replaying a supplier's events in chronological order
 * (mirrored in the route layer, canonical in supplierBlacklist.ts's
 * computeCurrentBlacklistState()) -- never read from a separately-
 * maintained "current" column.
 *
 * evidence is a jsonb column holding the BlacklistEvidenceItem[] array from
 * supplierBlacklist.ts -- same precedent as copq_ledger's `data` and
 * periodic_evaluation_events' `category_scores` columns: a purpose-built
 * table's own internal structured payload, not a blob bolted onto an
 * unrelated table.
 *
 * AUTHORIZATION BAR -- DELIBERATELY STRICTER THAN ITEMS 1-5 (disclosed
 * design decision, see supplierBlacklist.ts's own header for the full
 * rationale): 'draft_set' / 'draft_clear' follow the familiar org_admin-OR-
 * RACI-Accountable-holder gate (activityKey 'blacklist_decision', already
 * anticipated in supplierRACI.ts's RACI_ACTIVITY_KEYS at Item 2's own
 * build). 'finalized' and 'reversed' -- the two actions with real
 * commercial/legal consequence -- require org_admin SPECIFICALLY, enforced
 * in the route layer (artifacts/api-server/src/routes/blacklist.ts), never
 * the RACI Accountable holder alone.
 *
 * rightToRespondConfirmed and durationType/effectiveUntil are real, typed,
 * queryable columns (not buried in the jsonb payload) because they are
 * exactly the due-process facts a client may need to audit or report on
 * directly -- see supplierBlacklist.ts's sourced due-process header (World
 * Bank Sanctions System / UK Procurement Act 2023) for why these fields
 * exist at all.
 */
export const blacklistEventsTable = pgTable("blacklist_events", {
  id:                       serial("id").primaryKey(),
  organizationId:           integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id). */
  supplierId:               text("supplier_id").notNull(),
  /** 'draft_set' | 'draft_clear' | 'finalized' | 'reversed'. */
  action:                   text("action").notNull(),
  /** BlacklistEvidenceItem[] from supplierBlacklist.ts -- set for 'draft_set' and 'finalized'; null for 'draft_clear'/'reversed'. */
  evidence:                 jsonb("evidence"),
  /** Set only for 'finalized' -- confirms the due-process right-to-respond step was completed before this write (re-validated server-side, never trusted from the client alone). */
  rightToRespondConfirmed:  boolean("right_to_respond_confirmed"),
  /** 'time_bound' | 'indefinite_pending_review' | 'permanent' -- set only for 'finalized'; null otherwise. */
  durationType:             text("duration_type"),
  /** Required when durationType = 'time_bound'; null otherwise. */
  effectiveUntil:           timestamp("effective_until"),
  actorUserId:              integer("actor_user_id").notNull().references(() => usersTable.id),
  notes:                    text("notes"),
  createdAt:                timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertBlacklistEventSchema = createInsertSchema(blacklistEventsTable).omit({ id: true, createdAt: true });
export type InsertBlacklistEvent = z.infer<typeof insertBlacklistEventSchema>;
export type BlacklistEventRow    = typeof blacklistEventsTable.$inferSelect;
