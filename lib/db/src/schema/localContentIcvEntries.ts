import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * local_content_icv_entries -- real backend persistence for SI Module 08's
 * Local Content / ICV Eligibility Check tool (/local-content-icv), added
 * 16 Sep 2026 per the independent QA brief's explicit instruction to mirror
 * supplier_dependency_checks' backend-sync-with-localStorage-fallback
 * pattern rather than ship localStorage-only persistence for a tool a
 * client will return to and build a real portfolio in.
 *
 * Same architectural family as supplier_dependency_checks / rar_analyses /
 * tco_analyses / clm_contracts (see supplierDependencyChecks.ts's header for
 * the full rationale this file mirrors): whole-state JSONB sync, one row
 * PER SUPPLIER/ENTITY ENTRY, clientKey mirrors each LocalContentEntry's own
 * client-generated `id` field exactly as SupplierCheck.id -> clientKey does,
 * and the entry's full answer set (country selection, procurement context,
 * spend share, and the SA/AE/JO input slices) is stored as a single JSONB
 * `data` column rather than exploded into typed columns, so future country
 * mechanisms or input fields never require a migration.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as supplier_dependency_
 * checks, rar_analyses, tco_analyses, and clm_contracts.
 *
 * Sync model: whole-state PUT, identical to supplier_dependency_checks
 * (delete-all + bulk-insert in one transaction). Same 50-row cap used for
 * RAR/TCO/supplier-dependency "analyses" -- a client's local-content
 * portfolio for this directional tool is, by design, a working list of
 * named suppliers/entities, not a full supplier master list.
 *
 * Provisioning note (Decision Record 8.7 -- disclosed, not silently
 * assumed): this schema file defines the table; it is not yet applied to
 * any live database from this change. Whoever has production DB access
 * must run the existing `drizzle-kit push` workflow (see lib/db/package.json's
 * `push` script) to create this table before the frontend's backend-sync
 * calls will succeed -- until then, the UI's own localStorage-fallback
 * behavior (identical to supplier_dependency_checks' pattern) keeps working
 * exactly as it does for an unauthenticated visitor or on fetch failure.
 */
export const localContentIcvEntriesTable = pgTable("local_content_icv_entries", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (LocalContentEntry.id, e.g. `lc<timestamp>-<n>`),
   *  carried across syncs so the frontend can match a server row back to
   *  its local state without relying on the DB-assigned serial id. */
  clientKey:      text("client_key").notNull(),
  /** Mirrors LocalContentEntry.label (the supplier/entity name the client
   *  is assessing) -- may be empty, same as the frontend's own field. */
  name:           text("name").notNull(),
  /** The full LocalContentEntry object (countrySelection, context,
   *  spendSharePct, sa/ae/jo input slices) -- see
   *  src/pages/LocalContentICVCheck.tsx for the shape. id/label are also
   *  embedded inside for round-trip fidelity; server reconciliation prefers
   *  clientKey/name as canonical on read, same precedent as
   *  supplier_dependency_checks. */
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertLocalContentIcvEntrySchema = createInsertSchema(localContentIcvEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLocalContentIcvEntry = z.infer<typeof insertLocalContentIcvEntrySchema>;
export type LocalContentIcvEntryRow    = typeof localContentIcvEntriesTable.$inferSelect;
