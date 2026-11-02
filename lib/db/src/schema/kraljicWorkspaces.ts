import { pgTable, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * kraljic_workspaces -- server persistence for the Kraljic module's per-user
 * working data (Round B5 gap KR-B5-1, 2 Nov 2026). Before this table the
 * supplier facts, review log, supplier extras (supplier view, GCC facts) and
 * the measurement ledger lived in browser localStorage only
 * (isc-m02-subtype-facts-v1, -review-log-v1, -extras-v1, -ledger-v1).
 *
 * One row per user. `data` is one JSONB document { facts, reviews, extras,
 * ledger } whose shape the frontend owns (see kraljicWorkspaceSync.ts), the
 * same "frontend owns the shape" precedent as rar_analyses and
 * clm_contracts, so new fields never need a migration.
 *
 * Sync model: whole-state PUT (delete + insert in one transaction), like
 * rar_analyses. localStorage stays the working copy and the offline
 * fallback. organizationId is captured but not yet used for access control
 * (same honesty note as the other toolkit tables). Additive: a new table,
 * no change to any existing table.
 */
export const kraljicWorkspacesTable = pgTable("kraljic_workspaces", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertKraljicWorkspaceSchema = createInsertSchema(kraljicWorkspacesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKraljicWorkspace = z.infer<typeof insertKraljicWorkspaceSchema>;
export type KraljicWorkspaceRow    = typeof kraljicWorkspacesTable.$inferSelect;
