import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * spend_variance_analyses -- backend persistence for the Opportunity /
 * Spend Variance Finder (#170, Wave B-3, 2026-08-23).
 *
 * Real Purchase Price Variance (PPV) methodology: for one same-spec item
 * bought at two or more sites/suppliers, the tool normalizes each site's
 * price to a landed-cost basis (unit price + freight + quality adjustment)
 * and computes the addressable opportunity as the gap between each site's
 * landed cost and the cheapest ("benchmark") site's landed cost, times the
 * volume currently bought at that site. This is the standard procurement
 * PPV formula (PPV = (Actual Qty x Baseline Price) - (Actual Qty x Actual
 * Price)) applied across sites instead of across time -- see WC-style
 * sources panel in ProcurementTools.tsx for real, verified citations
 * (Decision Record 8.7: no invented sources).
 *
 * Same architectural family as tco_analyses -- see that file's header for
 * the full rationale on organizationId (captured, not yet used for access
 * control) and the whole-state sync model (frontend PUTs the entire array;
 * the server transactionally replaces the user's rows). `rows` is stored as
 * jsonb, mirroring tco_analyses.suppliers, because the row count is
 * variable (2+ sites/suppliers per comparison) -- see ProcurementTools.tsx
 * for the SpendVarianceRow shape.
 */
export const spendVarianceAnalysesTable = pgTable("spend_variance_analyses", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  clientKey:      text("client_key").notNull(),
  name:           text("name").notNull(),
  itemSpec:       text("item_spec"),
  /** Array of SpendVarianceRow objects -- see ProcurementTools.tsx for the shape. */
  rows:           jsonb("rows").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertSpendVarianceAnalysisSchema = createInsertSchema(spendVarianceAnalysesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSpendVarianceAnalysis = z.infer<typeof insertSpendVarianceAnalysisSchema>;
export type SpendVarianceAnalysisRow    = typeof spendVarianceAnalysesTable.$inferSelect;
