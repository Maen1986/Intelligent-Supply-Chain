import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * periodic_evaluation_events -- real backend persistence for the Supplier
 * Lifecycle Governance Periodic Evaluation Operational tier (Item 5 of 7,
 * 12 Sep 2026), following the same two-tier architecture and append-only
 * event-log-plus-replay pattern already applied to COPQ (Item 1), RACI
 * (Item 2), Pre-Qualification & ASL (Item 3), Onboarding (Item 4), and the
 * governance-tier-override addendum.
 *
 * WHAT THIS TABLE IS NOT: it does not track Module 07's continuous
 * recurrence/escalation data -- see supplierPeriodicEvaluation.ts's own
 * "WHAT THIS IS NOT" header for the full distinction. This table stores
 * only: (a) a client's cadence override for a supplier (mirrors
 * governance_tier_override_events's own set/clear shape, applied to a
 * different decision -- review frequency, not tracking tier) and (b) the
 * durable record of a COMPLETED periodic review -- its category scores,
 * derived overall recommendation, and the actor who signed off on it.
 *
 * APPEND-ONLY BY DESIGN, same family and rationale as every table in this
 * lineage: every cadence-override or completed-evaluation action is a NEW
 * row; current state (effective cadence, due-status, evaluation history)
 * is always DERIVED by replaying a supplier's events in chronological
 * order (mirrored in the route layer) -- never read from a separately
 * -maintained "current" column that could silently drift from the event
 * log itself.
 *
 * categoryScores is a jsonb column holding the structured
 * CategoryScoreResult[] array from supplierPeriodicEvaluation.ts for a
 * 'completed' action (null for cadence-override actions) -- the same
 * precedent as copq_ledger's own `data` jsonb column: a purpose-built
 * table's own internal structured payload, not a blob bolted onto an
 * unrelated table (Rule 4 is about NOT overloading an unrelated table,
 * not about banning jsonb columns inside a table built for exactly this
 * concept).
 *
 * WRITE-GATE (enforced in periodicEvaluation.ts, mirroring onboarding.ts's
 * and governanceTier.ts's own technique exactly): only the org's own
 * org_admin OR the current RACI Accountable holder for 'periodic_evaluation'
 * may set/clear a cadence override or record a completed evaluation --
 * replayed from that org's own raci_assignment_events on every write.
 * NOTE: supplierRACI.ts's RACI_ACTIVITY_KEYS already anticipated this exact
 * key ('periodic_evaluation', added at Item 2's own build, before Item 5
 * began) -- reused as-is, not the 'periodic_evaluation_signoff' key floated
 * at spec time, per this build's own reuse-the-existing-taxonomy discipline.
 *
 * escalation into findings_actions (source = 'periodic_evaluation') happens
 * in the route layer, mirroring copq.ts's own alert-on-write pattern,
 * whenever a 'completed' event's overallRecommendation is
 * 'escalate_consider' -- no new alert table, per instruction.
 */
export const periodicEvaluationEventsTable = pgTable("periodic_evaluation_events", {
  id:                    serial("id").primaryKey(),
  organizationId:        integer("organization_id").notNull().references(() => organizationsTable.id),
  /** Mirrors supplierObjectModel.ts's SupplierRecord.supplierId (a string, not a DB-generated numeric id). */
  supplierId:            text("supplier_id").notNull(),
  /** 'cadence_override_set' | 'cadence_override_clear' | 'completed'. */
  action:                text("action").notNull(),
  /** 'annual' | 'semi_annual' -- set only for action = 'cadence_override_set'; null otherwise. */
  cadence:               text("cadence"),
  /** CategoryScoreResult[] from supplierPeriodicEvaluation.ts -- set only for action = 'completed'; null otherwise. */
  categoryScores:        jsonb("category_scores"),
  /** OverallRecommendation from supplierPeriodicEvaluation.ts -- set only for action = 'completed'; null otherwise. */
  overallRecommendation: text("overall_recommendation"),
  actorUserId:           integer("actor_user_id").notNull().references(() => usersTable.id),
  notes:                 text("notes"),
  createdAt:             timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertPeriodicEvaluationEventSchema = createInsertSchema(periodicEvaluationEventsTable).omit({ id: true, createdAt: true });
export type InsertPeriodicEvaluationEvent = z.infer<typeof insertPeriodicEvaluationEventSchema>;
export type PeriodicEvaluationEventRow    = typeof periodicEvaluationEventsTable.$inferSelect;
