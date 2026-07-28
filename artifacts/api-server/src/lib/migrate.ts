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

  // gcc_benchmarks — admin-managed market benchmark dataset
  `CREATE TABLE IF NOT EXISTS gcc_benchmarks (
     id          SERIAL PRIMARY KEY,
     category    TEXT        NOT NULL,
     item_id     TEXT        NOT NULL,
     industry    TEXT,
     label       TEXT,
     data        JSONB       NOT NULL,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_by  TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS gcc_benchmarks_cat_item_ind
     ON gcc_benchmarks (category, item_id, industry)`,

  // Seed GCC-wide defaults only when the table is empty
  `INSERT INTO gcc_benchmarks (category, item_id, industry, label, data)
   SELECT v.category, v.item_id, NULL, v.label, v.data::jsonb
   FROM (VALUES
     ('kpi',   'otif',         'OTIF %',                          '{"median":88,"topQ":95}'),
     ('kpi',   'invTurns',     'Inventory Turns',                 '{"median":57,"topQ":100}'),
     ('kpi',   'procCycle',    'Procurement Cycle Time',          '{"median":61,"topQ":100}'),
     ('kpi',   'forecastAcc',  'Forecast Accuracy',               '{"median":73,"topQ":88}'),
     ('kpi',   'procCost',     'Procurement Cost % Revenue',      '{"median":56,"topQ":100}'),
     ('kpi',   'perfOrder',    'Perfect Order Rate',              '{"median":87,"topQ":96}'),
     ('lever', 'catMgmt',      'Strategic Category Management',   '{"maxPct":0.13}'),
     ('lever', 'suppCons',     'Supplier Consolidation',          '{"maxPct":0.09}'),
     ('lever', 'procAuto',     'Process & eProcurement Automation','{"maxPct":0.05}'),
     ('lever', 'invOpt',       'Inventory Optimisation',          '{"maxPct":0.07}'),
     ('lever', 'demand',       'Demand Forecasting Improvement',  '{"maxPct":0.04}'),
     ('risk',  'supply',       'Supply Risk',                     '{"gcMedian":45,"gcTopQ":22}'),
     ('risk',  'demand',       'Demand Risk',                     '{"gcMedian":40,"gcTopQ":20}'),
     ('risk',  'operational',  'Operational Risk',                '{"gcMedian":48,"gcTopQ":25}'),
     ('risk',  'financial',    'Financial Risk',                  '{"gcMedian":38,"gcTopQ":18}'),
     ('risk',  'geopolitical', 'Geopolitical / Regulatory Risk',  '{"gcMedian":42,"gcTopQ":20}'),
     ('risk',  'esg',          'ESG / Sustainability Risk',       '{"gcMedian":52,"gcTopQ":28}'),
     ('risk',  'cyber',        'Cyber / Technology Risk',         '{"gcMedian":55,"gcTopQ":25}'),
     ('risk',  'contract',     'Contract / Governance Risk',      '{"gcMedian":44,"gcTopQ":20}')
   ) AS v(category, item_id, label, data)
   WHERE NOT EXISTS (SELECT 1 FROM gcc_benchmarks LIMIT 1)`,
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
