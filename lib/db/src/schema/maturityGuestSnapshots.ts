import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Stores a guest user's completed maturity assessment answers so they can
 * retrieve their results later via a tokenised email link.
 * Records expire after 30 days; they are not automatically deleted but the
 * API rejects requests for expired tokens.
 */
export const maturityGuestSnapshotsTable = pgTable("maturity_guest_snapshots", {
  id:         serial("id").primaryKey(),
  /** Cryptographically random UUID used as the one-time retrieval token */
  token:      text("token").notNull().unique(),
  /** Guest's email address — used to send the link and to identify returning visitors */
  email:      text("email").notNull(),
  /** Full answers map, e.g. { "0-0": 3, "0-1": 2, … } */
  answers:    jsonb("answers").notNull(),
  /** { industry, companySize } captured in the intake step */
  intakeData: jsonb("intake_data").notNull(),
  /** UI language at the time of completion */
  lang:       text("lang").notNull().default("en"),
  /** Token becomes invalid after this point (30 days from creation) */
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export type MaturityGuestSnapshot = typeof maturityGuestSnapshotsTable.$inferSelect;
