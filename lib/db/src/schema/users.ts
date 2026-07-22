import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  email:        text("email").notNull().unique(),
  fullName:     text("full_name").notNull(),
  mobile:       text("mobile"),
  designation:  text("designation"),
  company:      text("company"),
  role:         text("role").notNull().default("user"),  // 'user' | 'admin'
  passwordHash: text("password_hash"),                    // bcrypt hash; null for legacy profile-only accounts
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User      = typeof usersTable.$inferSelect;
