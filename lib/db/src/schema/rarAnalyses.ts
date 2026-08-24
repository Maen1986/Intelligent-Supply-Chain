import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * rar_analyses -- real backend persistence for the Revenue-at-Risk (RAR)
 * calculator's "what-if scenario" mechanism (#182 Disruption Simulator
 * extension of RAR, Wave B-6, 2026-08-24).
 *
 * Decision Record 8.10 finding: ResiliencyTools.tsx already has a fully
 * working RAR calculator (Steps 1-5, ~critical nodes + interdependency
 * correction + duration-range dollar impact) AND a completely separate,
 * already-complete "Disruption Simulator" TAB (tab id `scenario`, a preset
 * port-closure/supplier-failure/freight-spike/cyber-attack picker scaled by
 * the Risk Exposure tab's average score) -- that tab is untouched by this
 * change. What was genuinely missing from RAR itself: no lead-time/route
 * field on its node model, no way to save a second named variant of the
 * node set to compare against the baseline, and (same gap as every other
 * toolkit calculator before TCO/Working-Capital/Spend-Variance/CLM got
 * fixed) zero backend persistence -- RAR persisted ONLY to localStorage
 * (isc-tool-resiliency-rar-nodes-v1 / -rar-meta-v1).
 *
 * This table stores the saved "what-if" SCENARIOS only, not the baseline --
 * the baseline (rarNodes/rarMeta) remains the always-editable "current"
 * calculation in localStorage, exactly as before. A scenario is a full
 * clone of the baseline's node set + meta at the moment it was duplicated,
 * then edited independently. Same architectural family as tco_analyses /
 * spend_variance_analyses / clm_contracts (see those files' headers for the
 * full rationale): one row PER SCENARIO, clientKey/name mirror each
 * RarScenario's own client-generated `id`/`name` fields exactly as
 * TcoAnalysis.id -> clientKey does, and the scenario's node list + meta
 * (interdependenciesMapped/annualRevenue) is stored as a single JSONB
 * `data` column rather than exploded into typed columns -- matching the
 * "frontend owns the exact shape" precedent set by spend_variance_
 * analyses.rows and clm_contracts.data, so future node fields (this change
 * already added leadTimeDays/route) never require a migration.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as tco_analyses,
 * spend_variance_analyses, and clm_contracts.
 *
 * Sync model: whole-state PUT, identical to tco_analyses / spend_variance_
 * analyses (delete-all + bulk-insert in one transaction). Cap kept at the
 * 50-scenario cap used for TCO/spend-variance "analyses" (not the 500-row
 * cap used for clm_contracts' live inventory) -- RAR what-if scenarios are,
 * by design, a handful of named comparisons against one baseline, not a
 * business register.
 */
export const rarAnalysesTable = pgTable("rar_analyses", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (RarScenario.id, e.g. `rs<timestamp>`),
   *  carried across syncs so the frontend can match a server row back to
   *  its local state without relying on the DB-assigned serial id. */
  clientKey:      text("client_key").notNull(),
  name:           text("name").notNull(),
  /** { nodes: RarNode[], meta: RarMeta } -- see ResiliencyTools.tsx for the
   *  shape. id/name are also embedded inside for round-trip fidelity;
   *  server reconciliation prefers clientKey/name as canonical on read. */
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertRarAnalysisSchema = createInsertSchema(rarAnalysesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRarAnalysis = z.infer<typeof insertRarAnalysisSchema>;
export type RarAnalysisRow    = typeof rarAnalysesTable.$inferSelect;
