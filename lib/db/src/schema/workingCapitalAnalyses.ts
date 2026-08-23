import { pgTable, serial, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * working_capital_analyses -- real backend persistence for the Working
 * Capital Control Tower (#169, Wave B-3, 2026-08-23).
 *
 * A named calculator, sibling to the TCO Engine (tco_analyses) but aimed at
 * cash instead of unit cost. Per client-approved scope ("proceed and focus
 * to maximize the value add to clients... deeply"), it gets the same real
 * backend treatment TCO Engine received rather than shipping as a
 * localStorage-only calculator that would need a later "max-enhance" pass.
 *
 * Unlike tco_analyses, the input set here is a small fixed shape (five
 * scalar figures), not a variable-length supplier list -- so this table
 * uses real typed columns rather than a JSONB blob, the same choice
 * maturity_snapshots made for its own fixed-shape figures.
 *
 * Three cash levers are computed from these inputs (see
 * lib/workingCapitalKnowledgeBase.ts for the full formula documentation and
 * citations) and are DELIBERATELY NEVER collapsed into one blended "total
 * cash at stake" number -- Decision Record language from #159
 * (Multi-Dimensional State design constraint) applies directly here: never
 * collapse into one fabricated score, show dimensions separately, let the
 * client weight what matters to them. The three levers measure genuinely
 * different, non-additive things (a point-in-time inventory value, a
 * cycle-timing sensitivity, and a risk-exposure estimate), so summing them
 * would misrepresent overlapping and incommensurate quantities as one
 * clean figure.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as tco_analyses and
 * findings_actions.
 */
export const workingCapitalAnalysesTable = pgTable("working_capital_analyses", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key, same reconciliation pattern as tco_analyses.clientKey. */
  clientKey:      text("client_key").notNull(),
  /** Scenario/snapshot name, e.g. a business unit, product line, or reporting period. */
  name:           text("name").notNull(),
  /** Cash trapped in inventory -- the entered inventory value itself (SAR), no formula. */
  inventoryValue: numeric("inventory_value", { precision: 16, scale: 2 }).notNull(),
  /** Days Inventory Outstanding. */
  dioDays:        numeric("dio_days", { precision: 8, scale: 2 }).notNull(),
  /** Days Sales Outstanding. */
  dsoDays:        numeric("dso_days", { precision: 8, scale: 2 }).notNull(),
  /** Days Payable Outstanding. */
  dpoDays:        numeric("dpo_days", { precision: 8, scale: 2 }).notNull(),
  /** Annual Cost of Goods Sold (SAR) -- the daily-cash-rate driver for the Cash Conversion Cycle dollar figure. */
  annualCogs:     numeric("annual_cogs", { precision: 18, scale: 2 }).notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export type WorkingCapitalAnalysisRow = typeof workingCapitalAnalysesTable.$inferSelect;
export type InsertWorkingCapitalAnalysis = typeof workingCapitalAnalysesTable.$inferInsert;
