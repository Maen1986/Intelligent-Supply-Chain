/**
 * Startup schema guard.
 *
 * Applies any `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` statements that must
 * be in place before the server starts accepting traffic.  Every statement is
 * idempotent (`IF NOT EXISTS`) so it is safe to run on every boot — it is a
 * no-op on databases that are already up to date.
 *
 * This file is the committed DDL source of truth for additive column changes.
 * New tables are handled by Drizzle schema + the Replit Publish flow; only
 * column additions to existing tables belong here.
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";

const MIGRATIONS: string[] = [
  // Task #306 — webhook delivery retry columns
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS attempts       INTEGER     NOT NULL DEFAULT 1`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS next_retry_at  TIMESTAMPTZ`,
  `ALTER TABLE webhook_delivery_log
     ADD COLUMN IF NOT EXISTS payload        JSONB`,
];

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const sql of MIGRATIONS) {
      await client.query(sql);
    }
    logger.info({ count: MIGRATIONS.length }, "[migrate] Startup migrations applied");
  } catch (err) {
    logger.error({ err }, "[migrate] Startup migration failed");
    throw err; // abort startup — missing columns would cause runtime errors
  } finally {
    client.release();
  }
}
