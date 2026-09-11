import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * copq_ledger -- real backend persistence for the Supplier Cost of Poor
 * Quality (COPQ) Operational tier (Supplier Lifecycle Governance build,
 * Item 1, 11 Sep 2026 -- design doc sections 2.4 and 2.8, client-confirmed).
 *
 * ARCHITECTURALLY DIFFERENT FROM supplierDependencyChecks.ts / rar_analyses /
 * tco_analyses on purpose. Those are whole-state JSONB sync (delete-all +
 * bulk-insert on every PUT) because they represent a CURRENT SET of records
 * the client is actively editing. A COPQ rollup is the opposite: it is a
 * dated, immutable measurement of a specific period, and overwriting it
 * would silently destroy the trend history the whole feature exists to
 * provide. Per the client-confirmed persistence model (11 Sep 2026,
 * AskUserQuestion): APPEND-ONLY. Every write is a new row. Nothing is ever
 * updated or deleted from the application layer. If a period's rollup needs
 * correcting, a NEW row for the same periodLabel is inserted and the
 * "current" figure for that period is defined as the latest row for it --
 * the superseded row stays in the table as a visible audit trail, not
 * silently discarded.
 *
 * The full COPQRollup object (supplierCOPQ.ts's computeCOPQRollup() output --
 * both PAF failure buckets, the appraisal effort/cost, the prevention
 * figure, the bilingual narrative, and the framework-source citation) is
 * stored as a single JSONB `data` column, same "one concept, one schema
 * file, flexible payload" convention as every other table in this family --
 * new COPQRollup fields never require a migration here.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as every other table in
 * this file's family (rar_analyses, tco_analyses, clm_contracts,
 * supplier_dependency_checks). Real org-scoped access control is Item 2 of
 * this same build (RACI on the entitlements/organizations schema) -- not yet
 * enforced here.
 *
 * `alerted` / `alertReason` mirror the outcome of supplierCOPQ.ts's
 * detectCOPQAlert() at write time, so a client's alert history is visible
 * directly on the ledger row without recomputing it against every prior
 * row on every read. The actual "needs attention" surface for a triggered
 * alert is a row in findings_actions (source: 'copq', sourceRefId: this
 * row's id) -- see the copq API route -- per the client-confirmed decision
 * to fold cross-engine action items into that existing table rather than
 * building a parallel one here.
 */
export const copqLedgerTable = pgTable("copq_ledger", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** e.g. "2026-Q3". Not unique -- multiple rows for the same period are
   *  valid (corrections/amendments); the latest by createdAt is current. */
  periodLabel:    text("period_label").notNull(),
  /** The full COPQRollup object from supplierCOPQ.ts's computeCOPQRollup(). */
  data:           jsonb("data").notNull(),
  /** Snapshot of detectCOPQAlert()'s outcome at write time, against the
   *  immediately-prior ledger row for this user (by createdAt). */
  alerted:        boolean("alerted").notNull().default(false),
  alertReason:    text("alert_reason"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  /* No updatedAt -- append-only, rows are never updated after insert. */
});

export const insertCopqLedgerEntrySchema = createInsertSchema(copqLedgerTable).omit({ id: true, createdAt: true });
export type InsertCopqLedgerEntry = z.infer<typeof insertCopqLedgerEntrySchema>;
export type CopqLedgerRow         = typeof copqLedgerTable.$inferSelect;
