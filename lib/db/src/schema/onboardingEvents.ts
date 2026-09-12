import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * onboarding_step_events -- real backend persistence for the Supplier
 * Lifecycle Governance Onboarding Operational tier (Item 4 of 7, 12 Sep
 * 2026), following the same two-tier architecture already applied to COPQ
 * (Item 1), RACI (Item 2), and Pre-Qualification & ASL (Item 3).
 *
 * SOURCED METHODOLOGY: see supplierOnboarding.ts's file header
 * (apexanalytix's 12-step supplier onboarding checklist, CIPS's
 * third-party-onboarding risk guidance with Dun & Bradstreet, Ivalua's
 * published 5-step onboarding process, and FBI IC3 BEC-loss data for the
 * banking-detail verification control). This table stores nothing about
 * the checklist methodology itself -- it stores only the client's own step
 * -completion EVENTS; supplierOnboarding.ts's computeCurrentOnboardingState()
 * is what turns those events into current onboarding state, the same
 * event-log-plus-replay split every prior table in this family already uses.
 *
 * ONBOARDING IS GATED ON ITEM 3's OWN ASL STATE, NOT A SEPARATE FLAG: the
 * route layer (onboarding.ts) re-derives the supplier's current ASL state
 * from asl_decision_events (mirroring computeCurrentASLState()) before
 * accepting ANY step-completion event for that supplier -- a supplier that
 * is not currently onASL cannot have onboarding events recorded for it,
 * enforced server-side, never trusted from the client.
 *
 * APPEND-ONLY BY DESIGN, same family and rationale as copq_ledger,
 * raci_assignment_events and asl_decision_events: every completion or
 * reopen action is a NEW row, nothing is ever UPDATEd or DELETEd from the
 * application layer, and current completion state for any supplier is
 * always DERIVED by replaying its events in chronological order
 * (computeCurrentOnboardingState()) -- never read from a separately
 * -maintained "is this step done" column that could silently drift from
 * the event log itself. A 'reopened' action lets a supplier re-enter
 * onboarding after a failed attempt (the checklist's own soft-tier stress
 * scenario) without erasing the earlier completion event.
 *
 * WRITE-GATE (enforced in onboarding.ts, mirroring preQualification.ts's
 * own technique exactly): only the org's own org_admin OR the current RACI
 * Accountable holder for the 'onboarding_signoff' activity (already a
 * first-class activity key in supplierRACI.ts's RACI_ACTIVITY_KEYS list --
 * Item 2 anticipated this before Item 4 began) may record a step-completion
 * or reopen event, replayed from that org's own raci_assignment_events on
 * every write.
 *
 * verificationChannelNote / firstPaymentHoldAcknowledged are typed columns
 * (not buried in a jsonb blob) specifically because banking_details_verified
 * is the one step this whole item exists to make provably hard to skip --
 * see supplierOnboarding.ts's BANKING_VERIFICATION_GUIDANCE and file header.
 * Both are null for every other step.
 *
 * organizationId is captured (denormalized from the acting user's own org
 * at write time, same precedent as this table's whole family) and IS used
 * for the write-gate, mirroring asl_decision_events's own choice (not
 * raci_assignment_events's still-disclosed gap).
 *
 * actorUserId deliberately has no onDelete cascade (mirrors
 * approverUserId on asl_decision_events and assignedByUserId on
 * raci_assignment_events) -- the audit trail of "who completed this step"
 * must survive even if that user's account is later removed.
 */
export const onboardingStepEventsTable = pgTable("onboarding_step_events", {
  id:               serial("id").primaryKey(),
  organizationId:   integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id -- Module 03 owns identity resolution, this table only references it). */
  supplierId:       text("supplier_id").notNull(),
  /** One of OnboardingStepKey from supplierOnboarding.ts. Free text (not a DB enum) so a future step never requires a migration here -- validated against the current fixed checklist in the route layer. */
  stepKey:          text("step_key").notNull(),
  /** 'completed' | 'reopened' -- see supplierOnboarding.ts's OnboardingEventAction. */
  action:           text("action").notNull(),
  actorUserId:      integer("actor_user_id").notNull().references(() => usersTable.id),
  note:             text("note"),
  /** Required only when stepKey = 'banking_details_verified' and action = 'completed' -- the independently-sourced contact channel used (e.g. "called the phone number already on file"). Never validated as a real phone number here (that would fabricate a capability ISC does not have) -- its presence is what's enforced. */
  verificationChannelNote: text("verification_channel_note"),
  /** Required (must be true) only for the same banking-verification completion -- the sourced first-payment-hold control. */
  firstPaymentHoldAcknowledged: boolean("first_payment_hold_acknowledged"),
  /** Snapshot of the ASL state this event was accepted against (onASL boolean + status string) -- point-in-time, not live-linked, mirroring asl_decision_events's own qualificationGateStatusAtDecision snapshot discipline. */
  aslStatusAtEvent: text("asl_status_at_event").notNull(),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertOnboardingStepEventSchema = createInsertSchema(onboardingStepEventsTable).omit({ id: true, createdAt: true });
export type InsertOnboardingStepEvent = z.infer<typeof insertOnboardingStepEventSchema>;
export type OnboardingStepEventRow    = typeof onboardingStepEventsTable.$inferSelect;
