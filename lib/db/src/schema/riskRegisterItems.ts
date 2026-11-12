import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

/**
 * risk_register_items -- server store for the E4 risk register (#866).
 *
 * Until now the register lived only in the visitor's browser
 * (localStorage key isc-tool-risk-register-v2). One row per risk, one
 * register per signed-in user. Same whole-state sync pattern as
 * working_capital_analyses: the front end PUTs the whole list and the server
 * replaces the user's rows in one transaction.
 *
 * The risk score is NEVER stored. It is likelihood x impact, banded by the
 * shared 15 / 10 / 5 set (lib/riskBands.ts on the front end).
 *
 * clientKey is the risk's own id from the browser, so a re-import never
 * duplicates (UNIQUE on user_id + client_key).
 * dataSource follows standing rule 3: 'manual' | 'imported-file' (browser
 * import) and later 'erp' etc.
 * organizationId is nullable and not yet used for cross-user access, same
 * precedent as findings_actions.
 * Created at back-end start by an idempotent CREATE TABLE IF NOT EXISTS in
 * artifacts/api-server/src/lib/migrate.ts (additive, cannot alter existing data).
 */
export const riskRegisterItemsTable = pgTable("risk_register_items", {
  id:                 serial("id").primaryKey(),
  userId:             integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  organizationId:     integer("organization_id").references(() => organizationsTable.id),
  clientKey:          text("client_key").notNull(),
  category:           text("category").notNull(),
  description:        text("description").notNull(),
  driver:             text("driver").notNull().default(""),
  affectedArea:       text("affected_area").notNull().default(""),
  likelihood:         integer("likelihood").notNull(),
  impact:             integer("impact").notNull(),
  velocity:           text("velocity").notNull(),
  mitigationAction:   text("mitigation_action").notNull().default(""),
  owner:              text("owner").notNull().default(""),
  dueDate:            text("due_date").notNull().default(""),
  status:             text("status").notNull(),
  mitigationStatus:   text("mitigation_status").notNull(),
  residualLikelihood: integer("residual_likelihood").notNull(),
  residualImpact:     integer("residual_impact").notNull(),
  dataSource:         text("data_source").notNull().default("manual"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({ userClientKey: unique("risk_register_items_user_client_key").on(t.userId, t.clientKey) }));
