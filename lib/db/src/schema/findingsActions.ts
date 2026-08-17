import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * findings_actions -- Engine 2 foundation table (Platform Strategy Review v5,
 * Task #205/#189).
 *
 * Generalises the client-facing follow-up mechanism that today lives ONLY as
 * a JSONB blob (maturity_snapshots.remedy_actions.actionStatus -- see
 * ActionTracker.tsx / maturitySnapshots.ts). This table does not replace
 * that blob -- ActionTracker.tsx keeps reading/writing it exactly as before,
 * zero frontend risk. The two backend PATCH handlers that touch
 * remedy_actions now ALSO mirror the same write here, so this table stays in
 * sync as a byproduct and becomes the single place automation (the 5th
 * scheduler job) and future engines (3, 4, 6) read from instead of scanning
 * JSON blobs across every user's snapshots.
 *
 * planStartedAt is deliberately NOT set at row-creation time. It is set once
 * -- the first time ANY item belonging to the same (userId, source,
 * sourceRefId) plan moves off 'not_started' -- i.e. when the client actually
 * begins working the plan, not when the AI generated it. Due dates for
 * 30/60/90-day phase items are computed from planStartedAt, not createdAt:
 * anchoring to createdAt would flag historical plans as instantly "overdue"
 * the moment this ships, and would start the clock before the client ever
 * saw the plan.
 */
export const findingsActionsTable = pgTable("findings_actions", {
  id:               serial("id").primaryKey(),
  userId:           integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- populated once Engine 3/4 give every user a real org. */
  organizationId:   integer("organization_id").references(() => organizationsTable.id),
  /** 'maturity' | 'diagnostic' -- extend as new sources are wired in. */
  source:           text("source").notNull(),
  /** e.g. maturity_snapshots.id or submissions.id -- the record this item traces back to. */
  sourceRefId:      integer("source_ref_id").notNull(),
  /** Deterministic key, e.g. "days30-2" (maturity) or "rec-3" (diagnostic). Stable identity for upsert. */
  itemKey:          text("item_key").notNull(),
  /** 'days30' | 'days60' | 'days90' -- null for sources without phases (e.g. diagnostic). */
  phase:            text("phase"),
  segmentTitle:     text("segment_title"),
  action:           text("action").notNull(),
  framework:        text("framework"),
  measurableTarget: text("measurable_target"),
  status:           text("status").notNull().default("not_started"), // 'not_started' | 'in_progress' | 'done'
  notes:            text("notes"),
  /** Set once, on first engagement with this plan -- see file header. */
  planStartedAt:    timestamp("plan_started_at"),
  completedAt:      timestamp("completed_at"),
  /** Marks the "you started, phase X is overdue" nudge as sent -- fires once. */
  nudgedAt:         timestamp("nudged_at"),
  /** Marks the separate "you haven't started your plan yet" nudge as sent -- fires once. */
  startNudgedAt:    timestamp("start_nudged_at"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
});

export const insertFindingsActionSchema = createInsertSchema(findingsActionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFindingsAction = z.infer<typeof insertFindingsActionSchema>;
export type FindingsAction       = typeof findingsActionsTable.$inferSelect;
