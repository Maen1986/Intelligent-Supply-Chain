import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { submissionsTable } from "./submissions";

/* Customer Voice: structured feedback visitors leave after using a tool.
   Powers the consultant's feedback list and analytics dashboard. */
export const feedbackTable = pgTable("feedback", {
  id:           serial("id").primaryKey(),
  // Which tool the feedback refers to ('command_centre' | 'diagnostic' | 'maturity' | ...)
  tool:         text("tool").notNull(),
  // Star rating 1–5 (required)
  rating:       integer("rating").notNull(),
  // NPS score 0–10 (optional)
  nps:          integer("nps"),
  // Free-text comment (optional)
  comment:      text("comment"),
  // Simple sentiment tag: 'positive' | 'neutral' | 'negative'
  sentiment:    text("sentiment"),
  // Company name as given by the visitor (optional)
  company:      text("company"),
  // Optional link back to the submission that generated the feedback prompt
  submissionId: integer("submission_id").references(() => submissionsTable.id),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback       = typeof feedbackTable.$inferSelect;
