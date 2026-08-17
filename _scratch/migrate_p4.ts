
  // Engine 2 (Platform Strategy Review v5, Task #205/#189) -- generalised
  // Findings & Actions table. Does NOT replace maturity_snapshots.remedy_actions
  // (ActionTracker.tsx keeps reading/writing that JSONB blob unchanged, zero
  // frontend risk) -- the two PATCH handlers that touch remedy_actions now also
  // mirror the same write here, so this table stays in sync as a byproduct and
  // becomes the single place automation and future engines (3, 4, 6) read from.
  // UNIQUE constraint makes the mirror writes safe to upsert (ON CONFLICT).
  `CREATE TABLE IF NOT EXISTS findings_actions (
     id                  SERIAL PRIMARY KEY,
     user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     organization_id     INTEGER REFERENCES organizations(id),
     source              TEXT NOT NULL,
     source_ref_id       INTEGER NOT NULL,
     item_key            TEXT NOT NULL,
     phase               TEXT,
     segment_title       TEXT,
     action              TEXT NOT NULL,
     framework           TEXT,
     measurable_target   TEXT,
     status              TEXT NOT NULL DEFAULT 'not_started',
     notes               TEXT,
     plan_started_at     TIMESTAMP,
     completed_at        TIMESTAMP,
     nudged_at           TIMESTAMP,
     start_nudged_at     TIMESTAMP,
     created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
     UNIQUE (user_id, source, source_ref_id, item_key)
   )`,

  // Engine 2 Part B -- claim-link mechanic. Lets a free, anonymous Diagnostic
  // run become a real, trackable account: a token is emailed on every
  // diagnostic submission, and claiming it finds-or-creates a passwordless
  // user (same pattern auth.ts already uses for "legacy profile-only
  // accounts") and converts that diagnostic's recommendations into
  // findings_actions rows owned by that account.
  `CREATE TABLE IF NOT EXISTS claim_tokens (
     id             SERIAL PRIMARY KEY,
     token          TEXT NOT NULL UNIQUE,
     email          TEXT NOT NULL,
     submission_id  INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
     user_id        INTEGER REFERENCES users(id),
     expires_at     TIMESTAMP NOT NULL,
     claimed_at     TIMESTAMP,
     created_at     TIMESTAMP NOT NULL DEFAULT NOW()
   )`,

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
