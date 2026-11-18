/**
 * E4 RM-04 1a-core data layer, round 1 (backlog #893).
 *
 * Source: ISC_E4_RM04_Card_Revised_v7, "1a tables, one list" [C186], decisions
 * D10 and D11 [C172, C173], tests 12, 13, 14, 15 and 132.
 *
 * ROUND 1 CREATES ONLY THE IDENTITY AND HISTORY CORE (7 of the 19 tables in the
 * card's list): risk_counters, risks, risks_current, risk_versions, risk_events,
 * risk_idempotency, risk_outbox. The other tables are later rounds.
 *
 * NOT WIRED INTO migrate.ts. These statements are additive and idempotent
 * (CREATE ... IF NOT EXISTS), but nothing runs them in production until the
 * owner says so. Wiring is one line: spread `riskCoreMigrations` into the
 * statements list in migrate.ts.
 *
 * Append-only is enforced by triggers ("tamper-evident, not tamper-proof").
 * The card also asks for revoked grants. The production application role name
 * is UNKNOWN, so no GRANT/REVOKE is written here; see the report.
 */
export const riskCoreMigrations: string[] = [
  // Per-organisation counter; a risk_ref is never reused (card: Integrity).
  `CREATE TABLE IF NOT EXISTS risk_counters (
     organisation_id INTEGER PRIMARY KEY,
     last_n          INTEGER NOT NULL DEFAULT 0 CHECK (last_n >= 0)
   )`,

  // Identity of a risk. Pointer and status change; content lives in versions.
  `CREATE TABLE IF NOT EXISTS risks (
     id                 BIGSERIAL PRIMARY KEY,
     organisation_id    INTEGER     NOT NULL,
     risk_ref           TEXT        NOT NULL,
     current_version_id BIGINT,
     row_version        INTEGER     NOT NULL DEFAULT 1 CHECK (row_version >= 1),
     status             TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','open','treated','closed')),
     legacy_source      TEXT,
     legacy_id          TEXT,
     source_kind        TEXT        NOT NULL DEFAULT 'manual'
                        CHECK (source_kind IN ('signal','workshop','manual','import')),
     source_ref         TEXT,
     created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     CONSTRAINT risks_org_ref_unique UNIQUE (organisation_id, risk_ref)
   )`,
  // The two unique keys of the card. The signal key sits on risks, not on a
  // version, because versions are append-only and the key must survive them [C173].
  `CREATE UNIQUE INDEX IF NOT EXISTS risks_legacy_unique
     ON risks (organisation_id, legacy_source, legacy_id)
     WHERE legacy_source IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS risks_signal_source_unique
     ON risks (organisation_id, source_kind, source_ref)
     WHERE source_kind = 'signal' AND source_ref IS NOT NULL`,

  // Every change of content is a new row. Round 1 holds the first column subset
  // of the card's list; the rest are added by later additive migrations.
  `CREATE TABLE IF NOT EXISTS risk_versions (
     id               BIGSERIAL PRIMARY KEY,
     risk_id          BIGINT      NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
     organisation_id  INTEGER     NOT NULL,
     version_no       INTEGER     NOT NULL CHECK (version_no >= 1),
     cause            TEXT,
     event            TEXT,
     consequence      TEXT,
     lang             TEXT        NOT NULL DEFAULT 'en' CHECK (lang IN ('en','ar')),
     owner_user_id    INTEGER,
     review_date      DATE,
     change_reason    TEXT,
     corrects_id      BIGINT REFERENCES risk_versions(id),
     signal_seq       INTEGER,
     created_by       INTEGER,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     CONSTRAINT risk_versions_risk_no_unique UNIQUE (risk_id, version_no)
   )`,
  `CREATE INDEX IF NOT EXISTS risk_versions_org_risk ON risk_versions (organisation_id, risk_id)`,

  // Current-state copy, written in the same transaction as each version.
  `CREATE TABLE IF NOT EXISTS risks_current (
     risk_id          BIGINT PRIMARY KEY REFERENCES risks(id) ON DELETE CASCADE,
     organisation_id  INTEGER     NOT NULL,
     status           TEXT        NOT NULL,
     version_no       INTEGER     NOT NULL,
     event            TEXT,
     owner_user_id    INTEGER,
     review_date      DATE,
     updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS risks_current_org ON risks_current (organisation_id, status)`,

  // Actions that are not a new version (state changes, logged refused attempts).
  `CREATE TABLE IF NOT EXISTS risk_events (
     id               BIGSERIAL PRIMARY KEY,
     organisation_id  INTEGER     NOT NULL,
     risk_id          BIGINT,
     kind             TEXT        NOT NULL,
     detail           JSONB       NOT NULL DEFAULT '{}'::jsonb,
     actor_user_id    INTEGER,
     at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS risk_events_org_risk ON risk_events (organisation_id, risk_id)`,

  // Keys and request hashes for idempotent create.
  `CREATE TABLE IF NOT EXISTS risk_idempotency (
     organisation_id  INTEGER     NOT NULL,
     idem_key         TEXT        NOT NULL,
     request_hash     TEXT        NOT NULL,
     risk_id          BIGINT      NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (organisation_id, idem_key)
   )`,

  // Messages out only. RM-04 is the only emitter of risk.draft_created_from_signal.
  `CREATE TABLE IF NOT EXISTS risk_outbox (
     id               BIGSERIAL PRIMARY KEY,
     organisation_id  INTEGER     NOT NULL,
     message_type     TEXT        NOT NULL,
     idempotency_key  TEXT        NOT NULL,
     payload          JSONB       NOT NULL DEFAULT '{}'::jsonb,
     created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     sent_at          TIMESTAMPTZ,
     CONSTRAINT risk_outbox_unique UNIQUE (organisation_id, message_type, idempotency_key)
   )`,

  // Append-only: history rows cannot be updated or deleted (test 14). The one
  // exception is the cascade of a permitted draft delete (parent row already
  // gone); a direct DELETE of a version row of a living risk is always refused.
  `CREATE OR REPLACE FUNCTION risk_block_history_mutation() RETURNS trigger AS $$
   BEGIN
     IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'risk_versions'
        AND NOT EXISTS (SELECT 1 FROM risks WHERE id = OLD.risk_id) THEN
       RETURN OLD;
     END IF;
     RAISE EXCEPTION 'APPEND_ONLY: % on % is not allowed', TG_OP, TG_TABLE_NAME
       USING ERRCODE = '42501';
   END;
   $$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS risk_versions_append_only ON risk_versions`,
  `CREATE TRIGGER risk_versions_append_only
     BEFORE UPDATE OR DELETE ON risk_versions
     FOR EACH ROW EXECUTE FUNCTION risk_block_history_mutation()`,
  `DROP TRIGGER IF EXISTS risk_events_append_only ON risk_events`,
  `CREATE TRIGGER risk_events_append_only
     BEFORE UPDATE OR DELETE ON risk_events
     FOR EACH ROW EXECUTE FUNCTION risk_block_history_mutation()`,

  // Hard delete: only a draft younger than 24 hours may go (test 14).
  `CREATE OR REPLACE FUNCTION risk_guard_hard_delete() RETURNS trigger AS $$
   BEGIN
     IF OLD.status <> 'draft' THEN
       RAISE EXCEPTION 'HARD_DELETE_REFUSED: only a draft may be deleted' USING ERRCODE = '42501';
     END IF;
     IF OLD.created_at < NOW() - INTERVAL '24 hours' THEN
       RAISE EXCEPTION 'HARD_DELETE_REFUSED: draft older than 24 hours' USING ERRCODE = '42501';
     END IF;
     RETURN OLD;
   END;
   $$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS risks_guard_hard_delete ON risks`,
  `CREATE TRIGGER risks_guard_hard_delete
     BEFORE DELETE ON risks
     FOR EACH ROW EXECUTE FUNCTION risk_guard_hard_delete()`,
];
