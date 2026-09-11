import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * asl_decision_events -- real backend persistence for the Supplier
 * Lifecycle Governance Pre-Qualification & ASL (Approved Supplier List)
 * Operational tier (Item 3 of 7, 11 Sep 2026 -- design doc sections 2.1 and
 * 2.8, following the same two-tier architecture already applied to COPQ
 * (Item 1) and RACI (Item 2)).
 *
 * SOURCED METHODOLOGY: see supplierPreQualification.ts's file header
 * (sourceday.com "Supplier Prequalification", greenlight.guru "Supplier
 * Qualification Process", lassosupplychain.com "Approved Supplier List",
 * cenitconsulting.com supplier-qualification guidance for the documented
 * -approval-reason discipline; Module 04's supplierQualificationGates.ts
 * for the underlying qualification/due-diligence gate result this table's
 * decisions are derived from). This table stores nothing about the
 * qualification methodology itself -- it stores only the client's own ASL
 * DECISION events; supplierPreQualification.ts's computeCurrentASLState()
 * is what turns those events into current ASL register state, exactly the
 * same event-log-plus-replay split raciAssignments.ts already uses.
 *
 * PERSISTENCE-PATTERN CHOICE, DISCLOSED: this table follows
 * raciAssignments.ts's append-only EVENT pattern (typed columns, one row
 * per decision) rather than copqLedger.ts's append-only PERIOD-SNAPSHOT
 * pattern (one JSONB payload column), because an ASL register is, by its
 * own nature, a decision history -- approve, conditionally approve,
 * suspend, revoke, reinstate -- not a periodic measurement. The "ASL status
 * is DERIVED, never a manual flag" design rule (supplierPreQualification.ts
 * header) is exactly the kind of ordered, time-aware replay logic
 * raciAssignments.ts's own header already argues belongs in the standalone
 * -first computation layer, not a table constraint -- so, same as that
 * table, this one is deliberately "dumb": it only ever appends what it is
 * told, and validateASLDecision() in supplierPreQualification.ts is what
 * refuses an invalid decision BEFORE a row is ever inserted (enforced again
 * server-side in the pre-qualification API route, never trusted from the
 * client alone). A single supplementary `data` jsonb column is included,
 * matching copqLedger.ts's "flexible payload, no migration for new fields"
 * rationale, to hold the full point-in-time context (gate detail, risk
 * -tier signals actually used) without forcing every future addition to
 * this snapshot through a migration -- the load-bearing, queryable fields
 * (decisionType, reasonCategory, approverUserId, reviewDueAt, the gate
 * status/tier actually relied upon) are still real typed columns, not
 * buried inside that JSONB blob, because those are exactly the fields the
 * route layer and the register UI need to filter/sort/gate on directly.
 *
 * APPEND-ONLY BY DESIGN, same family and same rationale as copq_ledger and
 * raci_assignment_events: overwriting "why was this supplier approved to
 * the ASL last quarter, and by whom" would destroy the audit trail this
 * governance feature exists to prove. Every decision is a NEW row. Nothing
 * is ever UPDATEd or DELETEd from the application layer. Current ASL state
 * for a supplier is always DERIVED by replaying its events in chronological
 * order (computeCurrentASLState()) -- never read from a separately
 * -maintained "current status" column that could silently drift from the
 * event log itself.
 *
 * organizationId is captured (denormalized from the acting approver's own
 * org at write time, same precedent as the rest of this table family) and
 * IS used for the write-gate here (unlike copq_ledger's still-disclosed gap
 * -- see that file's header): only the org's own RACI Accountable holder
 * for the 'prequalification_approval' activity, or the org_admin, may
 * write a decision, enforced in the pre-qualification API route by
 * replaying that org's own raci_assignment_events, mirroring raci.ts's own
 * org_admin write-gate technique for the accountable-holder check
 * specifically.
 *
 * approverUserId deliberately has no onDelete cascade (mirrors
 * raci_assignment_events's assignedByUserId, not copq_ledger's/this
 * table's own supplier-facing FKs) -- the audit trail of "who approved
 * this" must survive even if that user's account is later removed.
 */
export const aslDecisionEventsTable = pgTable("asl_decision_events", {
  id:             serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Supplier identifier -- mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id -- Module 03 owns identity resolution, this table only references it). */
  supplierId:     text("supplier_id").notNull(),
  /** 'approved' | 'conditionally_approved' | 'declined' | 'suspended' | 'revoked' | 'reinstated' -- see supplierPreQualification.ts's ASLDecisionType. Stored as free text (not a DB enum) so a future decision type never requires a migration here -- validated against the current fixed list in the route layer, mirroring raci_assignment_events's activityKey/role columns. */
  decisionType:   text("decision_type").notNull(),
  /** One of ApprovalReasonCategory (approve/conditionally-approve) or LifecycleReasonCategory (suspend/revoke/reinstate) -- see supplierPreQualification.ts. Free text for the same future-proofing reason as decisionType. */
  reasonCategory: text("reason_category").notNull(),
  /** Free-text elaboration on the documented reason -- optional; the category itself is the required, structured part (Decision Record 8.7: never an unstated judgment call). */
  reasonNote:     text("reason_note"),
  /** The RACI 'prequalification_approval' Accountable holder, or org_admin, who made this decision -- verified server-side against that org's own raci_assignment_events on every write, never trusted from the client. No onDelete cascade -- see file header. */
  approverUserId: integer("approver_user_id").notNull().references(() => usersTable.id),
  /** Snapshot of Module 04's runQualificationGates().overallStatus at the moment of this decision -- point-in-time, not live-linked, since the underlying gate result can change after this decision was recorded. */
  qualificationGateStatusAtDecision: text("qualification_gate_status_at_decision").notNull(),
  /** Snapshot of Module 04's dueDiligenceTier ('STANDARD' | 'ENHANCED') at the moment of this decision. */
  dueDiligenceTierAtDecision: text("due_diligence_tier_at_decision").notNull(),
  /** computeNextReviewDueDate() output for 'approved' / 'conditionally_approved' / 'reinstated' decisions; null for decisions that do not schedule a future review (e.g. 'declined', 'revoked'). */
  reviewDueAt:    timestamp("review_due_at"),
  /** Supplementary point-in-time context (full gate-result detail, the risk-tier signals actually used for the cadence computed above) -- see file header for why this stays a flexible payload rather than more typed columns. */
  data:           jsonb("data"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertAslDecisionEventSchema = createInsertSchema(aslDecisionEventsTable).omit({ id: true, createdAt: true });
export type InsertAslDecisionEvent = z.infer<typeof insertAslDecisionEventSchema>;
export type AslDecisionEventRow    = typeof aslDecisionEventsTable.$inferSelect;
