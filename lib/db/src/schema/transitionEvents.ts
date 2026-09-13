import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * transition_events -- real backend persistence for the Supplier Lifecycle
 * Governance Offboarding & Transition Operational tier (Item 7 of 7, 13 Sep
 * 2026), following the same two-tier architecture and append-only event-
 * log-plus-replay pattern already applied to every prior item in this
 * family (COPQ, RACI, ASL, Onboarding, Periodic Evaluation, Blacklist).
 *
 * WHAT THIS TABLE IS NOT: it is not a duplicate of blacklist_events (Item
 * 6, a for-cause finding) or of asl_decision_events' own lifecycle types
 * (Item 3) -- see supplierOffboarding.ts's own "WHAT THIS IS, AND WHAT IT
 * IS DELIBERATELY NOT" header for the full distinction. A 'closed' row
 * here MAY also produce a real, separate row in the EXISTING
 * asl_decision_events table (decisionType: 'revoked', reasonCategory:
 * 'commercial_relationship_ended' or 'voluntary_exit') -- written by the
 * route layer, guarded so it only fires for the five ordinary-business
 * trigger reasons and never duplicates a decision Item 6 or Item 3 already
 * made (see supplierOffboarding.ts's mapTriggerToAslReasonCategory()).
 *
 * APPEND-ONLY BY DESIGN, same family and rationale as every table in this
 * lineage: 'opened' / 'checklist_item_updated' / 'closed' / 'reopened' are
 * each a NEW row; current state (is a transition open, which checklist
 * items are complete, is it closed) is always DERIVED by replaying a
 * supplier's events in chronological order (mirrored in the route layer,
 * canonical in supplierOffboarding.ts's computeCurrentTransitionState())
 * -- never read from a separately-maintained "current" column.
 *
 * triggerReason / cooperationLevel / replacementSupplierNamed are set ONLY
 * on the 'opened' event and held fixed for the life of the record (the
 * requirement level of every checklist item is computed once from these
 * facts, never silently recomputed later -- see
 * determineChecklistRequirement()'s own header in supplierOffboarding.ts).
 * checklistItemKey / itemStatus are set ONLY on 'checklist_item_updated'
 * events. A single supplementary `data` jsonb column, same "flexible
 * payload, no migration for new fields" precedent as copq_ledger.ts and
 * blacklist_events.ts's own `data`/`evidence` columns.
 *
 * AUTHORIZATION BAR -- the STANDARD org_admin-OR-RACI-Accountable-holder
 * gate (activityKey 'offboarding_decision', already anticipated in
 * supplierRACI.ts's RACI_ACTIVITY_KEYS at Item 2's own build) applies to
 * EVERY write action here, deliberately NOT escalated the way Item 6's
 * finalize/reverse are -- see supplierOffboarding.ts's own "AUTHORIZATION
 * BAR" header for the full, disclosed rationale (neutral logistics, not a
 * punitive finding; supplierRACI.ts's own pre-existing Accountable
 * archetype for this activity is "Procurement Director / Category
 * Manager", not an escalated committee).
 */
export const transitionEventsTable = pgTable("transition_events", {
  id:                        serial("id").primaryKey(),
  organizationId:            integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id). */
  supplierId:                text("supplier_id").notNull(),
  /** 'opened' | 'checklist_item_updated' | 'closed' | 'reopened'. */
  action:                    text("action").notNull(),
  /** Set only on 'opened'; null otherwise. One of OffboardingTriggerReason. */
  triggerReason:             text("trigger_reason"),
  /** Set only on 'opened'; null otherwise. One of CooperationLevel. */
  cooperationLevel:          text("cooperation_level"),
  /** Set only on 'opened'; null otherwise. */
  replacementSupplierNamed:  boolean("replacement_supplier_named"),
  /** Set only on 'checklist_item_updated'; null otherwise. One of TransitionChecklistItemKey. */
  checklistItemKey:          text("checklist_item_key"),
  /** Set only on 'checklist_item_updated'; null otherwise. One of TransitionItemStatus. */
  itemStatus:                text("item_status"),
  actorUserId:                integer("actor_user_id").notNull().references(() => usersTable.id),
  notes:                     text("notes"),
  /** Supplementary point-in-time context (e.g. a full checklist snapshot
   * recorded at 'closed' time for audit convenience) -- see file header. */
  data:                      jsonb("data"),
  createdAt:                 timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertTransitionEventSchema = createInsertSchema(transitionEventsTable).omit({ id: true, createdAt: true });
export type InsertTransitionEvent = z.infer<typeof insertTransitionEventSchema>;
export type TransitionEventRow    = typeof transitionEventsTable.$inferSelect;
