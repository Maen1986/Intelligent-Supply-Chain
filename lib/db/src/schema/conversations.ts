import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const conversations = pgTable("conversations", {
  id:        serial("id").primaryKey(),
  title:     text("title").notNull(),
  /** Owner of this conversation — nullable so pre-migration rows remain valid.
      Pre-migration rows (userId = NULL) are hidden from all non-admin clients. */
  userId:    integer("user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export type Conversation       = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
