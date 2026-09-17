import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * supplier_recovery_entries -- real backend persistence for SI Module 07's
 * Supplier Recovery Portfolio dashboard (/supplier-recovery-portfolio),
 * added 17 Sep 2026.
 *
 * Module 07 (supplierPerformanceRecovery.ts + supplierRecoveryPortfolio.ts +
 * SupplierRecoveryPortfolio.tsx) shipped 11 Sep 2026 and was independently
 * re-verified 14 Sep 2026 (commit 4f63d5b, see
 * docs/SI_Module07_PerformanceRecovery_Worked_Example.md Section 7): sound
 * engine, real UI, but frontend-only -- every number came from an in-memory
 * DEMO_SUPPLIERS array, nothing a user entered persisted anywhere. That
 * doc named the persistence layer as "the natural next step". This table,
 * its API route, and a real add/edit/delete form in the page are that step.
 *
 * Mirrors local_content_icv_entries exactly (see that schema file's header
 * for the full rationale this one shares): whole-state JSONB sync, one row
 * PER SUPPLIER, clientKey mirrors SupplierRecord.supplierId (the frontend's
 * own client-generated identity, see src/lib/supplierRecoveryPortfolio.ts),
 * and the entry's full SupplierRecord (category, quadrant,
 * quadrantPriorQuarter, scoreHistory12mo, cars[]) is stored as a single
 * JSONB `data` column rather than exploded into typed columns, so a future
 * field added to SupplierRecord never requires a migration here.
 *
 * Deliberately NOT persisting: the category-level Kraljic spend items
 * (KraljicItemLite[]) or Module-05-shaped share records
 * (SupplierCategoryShare[]) that feed the portfolio's SAR exposure KPI.
 * Those remain the existing constructed, visibly-badged MOCK dataset
 * (buildMockSupplierSpendDataset) -- a real, disclosed, platform-wide gap
 * (#668: no live per-supplier absolute-currency field in Module 05 or a
 * join key back to Module 02) that is explicitly out of scope for this
 * pass, per the owner's own scoping decision (17 Sep 2026): this table
 * closes Module 07's own persistence gap, not the separate Module 02/05
 * data-model gap. A user-entered supplier whose category has no matching
 * mock category item honestly falls back to computeSupplierExposure's
 * existing INSUFFICIENT_DATA path (already real, tested code -- see that
 * function) rather than a fabricated number.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as every other table in
 * this file's family (supplier_dependency_checks, local_content_icv_entries,
 * rar_analyses, tco_analyses, clm_contracts).
 *
 * Sync model: whole-state PUT (delete-all + bulk-insert in one
 * transaction), identical to local_content_icv_entries /
 * supplier_dependency_checks. Same 50-row cap used across that whole
 * family -- a client's recovery portfolio is, by design, a working list of
 * named suppliers under active management, not a full supplier master
 * list.
 *
 * Provisioning note (Decision Record 8.7 -- disclosed, not silently
 * assumed): this schema file defines the table; it is not yet applied to
 * any live database from this change. Whoever has production DB access
 * must run the existing `drizzle-kit push` workflow (see
 * lib/db/package.json's `push` script) to create this table before the
 * frontend's backend-sync calls will succeed -- until then, the UI's own
 * localStorage-fallback behavior (identical to local_content_icv_entries'
 * pattern) keeps working exactly as it does for an unauthenticated visitor
 * or on fetch failure.
 */
export const supplierRecoveryEntriesTable = pgTable("supplier_recovery_entries", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (SupplierRecord.supplierId, e.g.
   *  `sup-<timestamp>-<n>`), carried across syncs so the frontend can match
   *  a server row back to its local state without relying on the
   *  DB-assigned serial id. */
  clientKey:      text("client_key").notNull(),
  /** Mirrors SupplierRecord.name -- may be empty, same as the frontend's
   *  own field. */
  name:           text("name").notNull(),
  /** The full SupplierRecord object (category, quadrant,
   *  quadrantPriorQuarter, scoreHistory12mo, cars[]) -- see
   *  src/lib/supplierRecoveryPortfolio.ts for the shape. supplierId/name
   *  are also embedded inside for round-trip fidelity; server
   *  reconciliation prefers clientKey/name as canonical on read, same
   *  precedent as local_content_icv_entries / supplier_dependency_checks. */
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierRecoveryEntrySchema = createInsertSchema(supplierRecoveryEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplierRecoveryEntry = z.infer<typeof insertSupplierRecoveryEntrySchema>;
export type SupplierRecoveryEntryRow    = typeof supplierRecoveryEntriesTable.$inferSelect;
