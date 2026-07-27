import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const apiKeysTable = pgTable("api_keys", {
  id:          serial("id").primaryKey(),
  userId:      integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  nameLabel:   text("name_label").notNull(),       // human-readable label
  keyHash:     text("key_hash").notNull().unique(), // SHA-256 hex of raw key
  keyPrefix:   text("key_prefix").notNull(),        // first chars for display ("isk_aB1cXy…")
  scope:       text("scope").notNull().default("write"), // 'read' | 'write'
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  lastUsedAt:  timestamp("last_used_at"),
  revokedAt:   timestamp("revoked_at"),
});

export type ApiKey = typeof apiKeysTable.$inferSelect;
