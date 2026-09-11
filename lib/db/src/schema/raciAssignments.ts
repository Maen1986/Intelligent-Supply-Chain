import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * raci_assignment_events -- real backend persistence for the Supplier Lifecycle
 * Governance RACI Operational tier (Item 2 of the two-tier build, 11 Sep
 * 2026 -- design doc sections 2.4/2.8's two-tier standing rule, applied to
 * RACI per the client-confirmed 11 Sep 2026 architecture decisions).
 *
 * SOURCED METHODOLOGY: see supplierRACI.ts's file header (PMBOK Guide's
 * RACI matrix, CIPS supplier relationship management guidance, ISO 9001
 * Clause 8.4, Wikipedia's "Responsibility assignment matrix" for the
 * consolidated historical/definitional source). This table stores nothing
 * about the methodology itself -- it stores only the client's own
 * assignment EVENTS; supplierRACI.ts's computeCurrentRaci() is what turns
 * those events into current state.
 *
 * APPEND-ONLY BY DESIGN -- same family and same rationale as copq_ledger
 * (see copqLedger.ts's header) and NOT an accident of convenience: RACI
 * assignment history is exactly the kind of record where silently
 * overwriting "who was Accountable for the Blacklist Decision on this
 * supplier last quarter" would destroy a real audit trail a governance
 * feature exists to prove. Every assign/unassign action is a NEW row.
 * Nothing is ever UPDATEd or DELETEd from the application layer. Current
 * state for any activity+role is always DERIVED by replaying every event
 * for it in chronological order (supplierRACI.ts's computeCurrentRaci()) --
 * never read from a separately-maintained "current assignee" column that
 * could silently drift from the event log itself.
 *
 * R/A (single-owner) vs C/I (multi-assignee) discipline is enforced entirely
 * in supplierRACI.ts's replay logic, NOT by a table constraint here -- this
 * table is deliberately "dumb": it only ever appends what it's told. A
 * unique constraint here could not express "an 'assigned' event for a
 * single-owner role supersedes the previous holder" (that's an ordered,
 * time-aware rule, not a set-membership rule), so the discipline lives in
 * the standalone-first computation layer instead, exactly as the two-tier
 * architecture requires it to (Advisory and Operational share identical
 * computation logic; only persistence differs).
 *
 * organizationId is captured (denormalized from the acting user's own org
 * at write time, same precedent as copq_ledger and its whole family) but
 * NOT YET ENFORCED for cross-org access control at the route layer beyond
 * the org_admin write-gate itself -- disclosed the same way as every other
 * table in this family.
 *
 * assignedByUserId is who TOOK the action (the org_admin), which is always
 * different in practice from userId (who now HOLDS the role) except in the
 * unusual case where an org_admin assigns themselves.
 */
export const raciAssignmentEventsTable = pgTable("raci_assignment_events", {
  id:               serial("id").primaryKey(),
  organizationId:   integer("organization_id").notNull().references(() => organizationsTable.id),
  /** One of the 7 fixed RaciActivityKey values from supplierRACI.ts. Stored
   *  as free text (not a DB enum) so a future 8th activity never requires a
   *  migration here -- validation of the value against the current fixed
   *  list happens in the route layer, mirroring supplierRACI.ts. */
  activityKey:      text("activity_key").notNull(),
  /** 'R' | 'A' | 'C' | 'I' -- see supplierRACI.ts's RaciRole. */
  role:             text("role").notNull(),
  userId:           integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** 'assigned' | 'unassigned' -- see supplierRACI.ts's RaciEventAction. */
  action:           text("action").notNull(),
  assignedByUserId: integer("assigned_by_user_id").notNull().references(() => usersTable.id),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertRaciAssignmentEventSchema = createInsertSchema(raciAssignmentEventsTable).omit({ id: true, createdAt: true });
export type InsertRaciAssignmentEvent = z.infer<typeof insertRaciAssignmentEventSchema>;
export type RaciAssignmentEventRow    = typeof raciAssignmentEventsTable.$inferSelect;
