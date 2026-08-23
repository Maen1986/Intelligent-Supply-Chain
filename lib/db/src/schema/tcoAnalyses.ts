import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * tco_analyses -- real backend persistence for the TCO Engine (#168 v3,
 * "maximum technical and consultancy wise" enhancement, 2026-08-23).
 *
 * Replaces the browser-only localStorage model (isc-tool-catmgmt-tco-v2)
 * with a real per-row table: one row per saved TCO analysis (one item/
 * category comparison), so data survives across devices and browser
 * sessions for the same account, and can be queried/aggregated server-side
 * (the Portfolio comparison view reads straight from this table).
 *
 * Scoping honesty note: organizationId is captured on every row (nullable,
 * same precedent as findings_actions -- see that file's header) so a future
 * cross-user org-sharing feature can be built without another migration.
 * It is NOT yet used to let teammates within the same org see each other's
 * analyses -- no route anywhere in this codebase does real org-scoped
 * cross-user querying yet (checked before building this: auth.ts sets
 * organization_id on signup, but nothing reads it back for access control).
 * Building that here first, ahead of the rest of the platform, would be a
 * bigger and riskier change than anything else in this table and untested
 * against the rest of the system -- so this table is user-scoped today,
 * same as scorecard_roster, generated plans, and findings_actions, with the
 * organization_id column ready for that future step.
 *
 * Sync model: the frontend does not do per-row CRUD sync (which would need
 * real conflict resolution / ID reconciliation between a locally-created
 * temp ID and a server-assigned one). It syncs the *whole list* on every
 * change via PUT /api/tco-analyses, which transactionally replaces all of
 * the user's rows -- the same "whole-state" pattern already proven safe in
 * this codebase for scorecard_roster, just backed by a real table with real
 * rows instead of a single JSONB blob column on users, so each analysis is
 * independently queryable.
 */
export const tcoAnalysesTable = pgTable("tco_analyses", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (e.g. "tcoa..."), carried across syncs so the
   *  frontend can match a server row back to its local state without relying
   *  on the DB-assigned serial id having stayed the same. */
  clientKey:      text("client_key").notNull(),
  name:           text("name").notNull(),
  industry:       text("industry"),
  subSector:      text("sub_sector"),
  skuClass:       text("sku_class"),
  itemName:       text("item_name"),
  /** Array of TcoSupplier objects -- see ProcurementTools.tsx for the shape. */
  suppliers:      jsonb("suppliers").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertTcoAnalysisSchema = createInsertSchema(tcoAnalysesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTcoAnalysis = z.infer<typeof insertTcoAnalysisSchema>;
export type TcoAnalysisRow    = typeof tcoAnalysesTable.$inferSelect;
