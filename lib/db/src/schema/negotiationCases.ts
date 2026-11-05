import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * negotiation_cases -- server persistence for the Negotiation Desk (E3 Negotiation Intelligence,
 * module N0, 5 Nov 2026). Same architectural family as rar_analyses / tco_analyses /
 * supplier_dependency_checks: one row per saved case, clientKey mirrors the client-generated key,
 * and the case itself (supplier, purchase type, lock-in, price points, rounds) is one JSONB `data`
 * column because the frontend owns that shape (see NegotiationDesk.tsx), so adding a field never
 * needs a migration.
 *
 * v1 stores ONE case per user (clientKey 'desk-current'); the whole-state PUT allows up to 20 so
 * several named cases can follow without a schema change.
 *
 * organizationId is nullable and captured but NOT used for cross-user access control yet (same
 * disclosed limit as the other tables). Rows are visible to their owning user only.
 * ADDITIVE: creates a new table; no existing table or column is changed.
 */
export const negotiationCasesTable = pgTable("negotiation_cases", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  clientKey:      text("client_key").notNull(),
  name:           text("name").notNull(),
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertNegotiationCaseSchema = createInsertSchema(negotiationCasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNegotiationCase = z.infer<typeof insertNegotiationCaseSchema>;
export type NegotiationCaseRow    = typeof negotiationCasesTable.$inferSelect;
