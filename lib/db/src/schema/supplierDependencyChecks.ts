import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * supplier_dependency_checks -- real backend persistence for the Supplier
 * Dependency Check tool (#378), added 28 Aug 2026 with the owner's explicit
 * go-ahead.
 *
 * Design note (per the #381 scoping pass, shared-case-data-layer-381-
 * scoping-draft.md, 28 Aug 2026): #378 shipped 25 Aug 2026 as deliberately
 * local-only ("no-ERP, nothing leaves the browser") -- a considered privacy
 * choice for an informal GCC SME user, not an oversight. The #381 pass
 * verified this against live code and flagged that reversing it is a real
 * product-shape decision, not a small implementation detail, and should not
 * be made unilaterally. The owner was asked directly and said yes: move
 * #378 to backend-synced, so it can become the second real data source
 * (alongside Contract Intelligence's clm_contracts/findings_actions) for a
 * future #381 cross-engine correlation layer.
 *
 * Same architectural family as rar_analyses / tco_analyses / clm_contracts
 * (see rarAnalyses.ts's header for the full rationale this file mirrors):
 * whole-state JSONB sync, one row PER SUPPLIER CHECK, clientKey mirrors
 * each SupplierCheck's own client-generated `id` field exactly as
 * RarScenario.id -> clientKey does, and the check's full answer set is
 * stored as a single JSONB `data` column rather than exploded into typed
 * columns, so future question fields never require a migration.
 *
 * organizationId nullable, captured but not yet used for cross-user access
 * control -- same precedent and same honesty note as rar_analyses,
 * tco_analyses, and clm_contracts.
 *
 * Sync model: whole-state PUT, identical to rar_analyses (delete-all +
 * bulk-insert in one transaction). Cap kept at the same 50-row cap used for
 * RAR/TCO "analyses" -- a client's supplier dependency checks are, by
 * design, a handful of named suppliers/categories they're worried about,
 * not a full supplier master list.
 */
export const supplierDependencyChecksTable = pgTable("supplier_dependency_checks", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  /** Nullable today -- see file header. Not yet used for access control. */
  organizationId: integer("organization_id").references(() => organizationsTable.id),
  /** Client-generated stable key (SupplierCheck.id, e.g. `sdep<timestamp>-<n>`),
   *  carried across syncs so the frontend can match a server row back to
   *  its local state without relying on the DB-assigned serial id. */
  clientKey:      text("client_key").notNull(),
  /** Mirrors SupplierCheck.name (the supplier name or spend category the
   *  client is checking) -- may be empty, same as the frontend's own field. */
  name:           text("name").notNull(),
  /** The full SupplierCheck object (hasNamedAlternative, contractType,
   *  switchingCostNote, volumeConcentrationPct, hasRecentStressSignal,
   *  recentStressNote) -- see lib/supplierDependency.ts for the shape.
   *  id/name are also embedded inside for round-trip fidelity; server
   *  reconciliation prefers clientKey/name as canonical on read, same
   *  precedent as rar_analyses. */
  data:           jsonb("data").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupplierDependencyCheckSchema = createInsertSchema(supplierDependencyChecksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupplierDependencyCheck = z.infer<typeof insertSupplierDependencyCheckSchema>;
export type SupplierDependencyCheckRow    = typeof supplierDependencyChecksTable.$inferSelect;
