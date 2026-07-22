import { pgTable, serial, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const submissionsTable = pgTable("submissions", {
  id:                  serial("id").primaryKey(),
  // Which tool generated this record
  tool:                text("tool").notNull(), // 'command_centre' | 'diagnostic' | 'maturity' | 'booking' | 'lead'
  // Optional link to a registered user
  userId:              integer("user_id").references(() => usersTable.id),
  // Contact info (duplicated here for quick admin view even for anon sessions)
  contactName:         text("contact_name"),
  contactEmail:        text("contact_email"),
  contactMobile:       text("contact_mobile"),
  contactDesignation:  text("contact_designation"),
  contactCompany:      text("contact_company"),
  // The raw inputs and computed/AI outputs stored as JSONB
  inputs:              jsonb("inputs"),
  outputs:             jsonb("outputs"),
  // Object-storage path of the stored PDF briefing (e.g. "/objects/briefings/42.pdf")
  pdfObjectPath:       text("pdf_object_path"),
  pdfFilename:         text("pdf_filename"),
  // Optional metadata
  ipAddress:           text("ip_address"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, createdAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission       = typeof submissionsTable.$inferSelect;
