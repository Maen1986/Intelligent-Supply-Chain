import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * entitlements -- #188 foundation table (à la carte Maturity Assessment
 * module ownership, Decision Record 8.5 Layer 1).
 *
 * One row per (user, module) grant. moduleId is one of the 6 real modules
 * (m1..m6 -- see maturityData.tsx CORE_SEGMENTS, grouped 2 segments each
 * in the site map's #188 registry entry) or 'bundle' (all six at once).
 *
 * Deliberately does NOT cover Layer 2 (Consultancy Engine / Command Centre
 * subscription) -- that stays a single tier field on the user/org, tracked
 * once #364 (Stripe) ships. À la carte ownership and subscription status
 * are different shapes on purpose: consultancy.ts never needs to reason
 * about which segments a buyer owns (Decision Record 8.5).
 *
 * source is 'manual' for every row until #364 ships a Stripe webhook that
 * writes 'stripe' rows automatically instead -- see site map #367 (Engine 4)
 * and #364 (billing rail). UNIQUE(user_id, module_id) applied in the raw
 * migration DDL (see migrate.ts) so a grant is idempotent / upsertable.
 */
export const entitlementsTable = pgTable("entitlements", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  moduleId:       text("module_id").notNull(), // 'm1'..'m6' | 'bundle'
  source:         text("source").notNull().default("manual"), // 'manual' | 'stripe'
  grantedBy:      text("granted_by"), // admin email for manual grants; null for stripe-sourced rows
  grantedAt:      timestamp("granted_at").defaultNow().notNull(),
});

export const insertEntitlementSchema = createInsertSchema(entitlementsTable).omit({ id: true, grantedAt: true });
export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;
export type Entitlement       = typeof entitlementsTable.$inferSelect;
