import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * governance_tier_override_events -- durable persistence for a client's
 * explicit override of supplierGovernanceTierRecommendation.ts's
 * Advisory-vs-Operational recommendation, added after a QA review of the
 * Item 4 (Onboarding) close-out surfaced a real gap: the override was
 * previously component-state-only in SupplierOnboarding.tsx, meaning it was
 * silently lost on page reload -- directly contradicting the module's own
 * documented design contract ("a client override, once set, always wins
 * over a freshly recomputed recommendation until the client explicitly
 * changes it again"). A reload is not "the client explicitly changing it."
 *
 * APPEND-ONLY BY DESIGN, same family and rationale as copq_ledger,
 * raci_assignment_events, asl_decision_events and onboarding_step_events:
 * every override or clear action is a NEW row; current override state is
 * always DERIVED by replaying a supplier's events to the latest one
 * (mirrored in the route layer as currentGovernanceTierOverride()) --
 * never read from a separately-maintained "current override" column.
 *
 * WRITE-GATE (enforced in governanceTier.ts, mirroring onboarding.ts's own
 * technique exactly): only the org's own org_admin OR the current RACI
 * Accountable holder for 'onboarding_signoff' may set or clear an override
 * for a supplier -- replayed from that org's own raci_assignment_events on
 * every write. This reuses Item 4's existing write-gate rather than
 * inventing a separate authorization rule for what is, in practice, the
 * same governance decision (which tier applies to this supplier's
 * onboarding) as onboarding sign-off itself.
 *
 * action = 'set' | 'clear'. 'clear' rows have tier = null and exist so that
 * clicking "Reset to recommendation" is itself a durable, audited action --
 * not merely deleting the override, which would leave no record that the
 * client had ever overridden it at all.
 *
 * Designed for reuse by Items 5-7 exactly as supplierGovernanceTierRecommendation.ts
 * itself is -- supplierId is the only entity key, with no item-specific
 * column, so the same table and route can back an onboarding-tier override,
 * a periodic-evaluation-tier override, etc. for the same supplier without a
 * schema change, should Items 5-7 need their own independent override point
 * rather than sharing this one (an open design question for those items,
 * not decided here).
 */
export const governanceTierOverrideEventsTable = pgTable("governance_tier_override_events", {
  id:             serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id). */
  supplierId:     text("supplier_id").notNull(),
  /** 'set' | 'clear'. */
  action:         text("action").notNull(),
  /** 'advisory' | 'operational' when action = 'set'; null when action = 'clear'. */
  tier:           text("tier"),
  actorUserId:    integer("actor_user_id").notNull().references(() => usersTable.id),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertGovernanceTierOverrideEventSchema = createInsertSchema(governanceTierOverrideEventsTable).omit({ id: true, createdAt: true });
export type InsertGovernanceTierOverrideEvent = z.infer<typeof insertGovernanceTierOverrideEventSchema>;
export type GovernanceTierOverrideEventRow    = typeof governanceTierOverrideEventsTable.$inferSelect;
