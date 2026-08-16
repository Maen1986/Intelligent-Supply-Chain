import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * organizations -- Engine 1 foundation table (Platform Strategy Review v5).
 *
 * The real account entity users.company (free text) could never be: a shared
 * account more than one user can belong to, and that suppliers, spend,
 * contracts, and findings get scoped against once the shared data graph
 * (Engine 3) exists. Deliberately minimal for now -- name only. Self-serve
 * signup (Engine 4) is responsible for creating one per new client; existing
 * users are NOT backfilled into a personal org by the Engine 1 migration.
 */
export const organizationsTable = pgTable("organizations", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization       = typeof organizationsTable.$inferSelect;
