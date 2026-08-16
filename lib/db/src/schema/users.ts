import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  email:        text("email").notNull().unique(),
  fullName:     text("full_name").notNull(),
  mobile:       text("mobile"),
  designation:  text("designation"),
  company:      text("company"),
  /** FK -> organizations(id). Nullable: set by self-serve signup (Engine 4)
   *  going forward; existing users are not backfilled by the Engine 1
   *  migration. Platform Strategy Review v5, Task #204. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  role:         text("role").notNull().default("user"),  // 'user' | 'admin'
  passwordHash: text("password_hash"),                    // bcrypt hash; null for legacy profile-only accounts
  resetTokenHash:      text("reset_token_hash"),           // bcrypt hash of the one-time password-reset code
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),// reset code validity window
  scorecardRoster:     jsonb("scorecard_roster"),           // supplier roster synced from the Scorecard Tool
  scorecardConfig:     jsonb("scorecard_config"),            // framework weights + tier thresholds from the Scorecard Tool
  toolData:            jsonb("tool_data"),                   // KPI / spend / training / KRI data from toolkit tools
  lastImportAt:        timestamp("last_import_at"),            // set whenever KPI/KRI/spend data is imported
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User      = typeof usersTable.$inferSelect;
