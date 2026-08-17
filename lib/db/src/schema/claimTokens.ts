import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { submissionsTable } from "./submissions";

/**
 * claim_tokens -- Engine 2 Part B (Platform Strategy Review v5, Task #205).
 *
 * Lets a free, anonymous Diagnostic run become a real, trackable account
 * without forcing a signup wall on the public tool. Every diagnostic
 * submission (submissions.tool = 'diagnostic') gets a token emailed to its
 * contactEmail; visiting the claim link finds-or-creates a passwordless
 * user (the same "legacy profile-only account" concept auth.ts already
 * supports -- see establishSession / the /auth/register comment) and
 * converts that diagnostic's recommendations into findings_actions rows
 * owned by that account. A second diagnostic run from the same email
 * reuses the existing account rather than creating a duplicate.
 */
export const claimTokensTable = pgTable("claim_tokens", {
  id:           serial("id").primaryKey(),
  token:        text("token").notNull().unique(),
  email:        text("email").notNull(),
  submissionId: integer("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),
  /** Set once the token is claimed -- null until then. */
  userId:       integer("user_id").references(() => usersTable.id),
  expiresAt:    timestamp("expires_at").notNull(),
  claimedAt:    timestamp("claimed_at"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const insertClaimTokenSchema = createInsertSchema(claimTokensTable).omit({ id: true, createdAt: true });
export type InsertClaimToken = z.infer<typeof insertClaimTokenSchema>;
export type ClaimToken       = typeof claimTokensTable.$inferSelect;
