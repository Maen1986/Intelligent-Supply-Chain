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
  /** Per-organization role, DISTINCT from `role` below (which is a GLOBAL
   *  ISC-platform-admin flag, unrelated to any one organization). Added for
   *  Item 2 of the Supplier Lifecycle Governance build (RACI, 11 Sep 2026) —
   *  real finding: no org-scoped permission concept existed anywhere in this
   *  schema before this field, so "the client's own org admin assigns RACI
   *  roles" (the design brief's assumption) had nothing to check against.
   *  Client-confirmed (AskUserQuestion, 11 Sep 2026): the first user to
   *  create/join an organization becomes its 'org_admin' by default — see
   *  auth.ts's /register route, the only place this is currently set to
   *  'org_admin' (at the exact point a brand-new organization is created for
   *  a signup). Every other user defaults to 'member'. There is no
   *  invite/join-an-existing-org flow yet (auth.ts's own comment: "one org
   *  per signup, no multi-seat/invite mechanic yet"), so today an org_admin
   *  promoting a second member of the SAME organization to org_admin, or
   *  demoting themselves, has no UI/route yet either — both are honestly
   *  disclosed as known gaps in the Item 2 worked-example doc, not silently
   *  assumed solved by adding this column alone. */
  orgRole:      text("org_role").notNull().default("member"),  // 'member' | 'org_admin'
  role:         text("role").notNull().default("user"),  // 'user' | 'admin' (GLOBAL ISC-platform-admin flag)
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
