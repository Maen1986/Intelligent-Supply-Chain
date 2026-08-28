/**
 * /api/admin/db-backup — internal-network logical export of the whole
 * production database, for the daily off-infrastructure backup task
 * (BCP risk register item #5).
 *
 * Why this route exists (#450/#451): the backup used to run via Render's
 * external query tool, which connects over the public internet and is
 * therefore subject to the database's public IP allow list. Restricting
 * that allow list to a single admin IP (a real security improvement) broke
 * the external query path entirely -- and would have silently broken the
 * nightly backup too. This route runs the same export logic *inside* the
 * app, using the app's own internal (private-network) DATABASE_URL
 * connection, which is never subject to the public IP allow list. That
 * lets the database be locked down to a single IP for direct external
 * connections while this route keeps working regardless.
 *
 * GET /api/admin/db-backup
 * Auth: admin API key (Bearer) or admin session — see requireAdminApiKeyOrSession.
 */

import { Router } from "express";
import { pool } from "@workspace/db";
import { requireAdminApiKeyOrSession } from "../middlewares/requireAdminApiKeyOrSession";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAdminApiKeyOrSession);

const POSTGRES_ID = "dpg-d9oogrrm8hqs739i7hk0-a";
const DATABASE_NAME = "isc_production";

// Tables containing session tokens, password hashes, or API-key hashes.
// The route still exports them (a restorable backup needs them), but the
// caller's own report to the user must not print their row contents --
// see the isc-database-backup scheduled task's SKILL.md security note.
const SENSITIVE_TABLES = new Set(["session", "users", "api_keys"]);

router.get("/", async (_req, res) => {
  try {
    const tableListResult = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    const tableNames = tableListResult.rows.map(r => r.table_name);

    const tables: Record<string, unknown[]> = {};
    for (const tableName of tableNames) {
      // Table names come from information_schema (not user input), but we
      // still quote defensively since a couple of legacy tables use mixed
      // case / reserved words.
      const safeName = tableName.replace(/"/g, '""');
      const dataResult = await pool.query<{ data: unknown[] }>(
        `SELECT COALESCE(json_agg(t), '[]'::json) AS data FROM (SELECT * FROM "${safeName}") t`
      );
      tables[tableName] = dataResult.rows[0]?.data ?? [];
    }

    const totalRows = Object.values(tables).reduce((sum, rows) => sum + rows.length, 0);
    logger.info(
      { tableCount: tableNames.length, totalRows },
      "[admin/db-backup] export complete"
    );

    res.json({
      ok: true,
      backup_date: new Date().toISOString(),
      database: DATABASE_NAME,
      postgresId: POSTGRES_ID,
      table_count: tableNames.length,
      sensitive_tables: [...SENSITIVE_TABLES],
      tables,
    });
  } catch (err) {
    logger.error({ err }, "[admin/db-backup] export failed");
    res.status(500).json({ ok: false, error: "Backup export failed" });
  }
});

export default router;
