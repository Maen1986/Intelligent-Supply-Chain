/**
 * E4 RM-04 1a-core data access, round 1 (backlog #893).
 * Card: ISC_E4_RM04_Card_Revised_v7. Tests 12, 13, 14, 15, 132.
 *
 * No Express routes, no screens and no feature-flag wiring in this round: this
 * is the service layer the routes will call. It depends on a minimal `Db`
 * interface (query + transaction), so it runs on pg.Pool in production and on
 * PGlite (a real Postgres engine) in tests. It imports nothing from sibling
 * engine modules (standalone-first).
 *
 * Every function takes the organisation id as its first argument and filters on
 * it ("a tenant helper on every query, cross-tenant 404").
 */
import { createHash } from 'node:crypto';

export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}
export interface Db extends Queryable {
  /** Runs fn inside one transaction; commits on resolve, rolls back on throw. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
}
/** Injected clock: tests never read the wall clock (card: Tests run on an injected clock). */
export type Clock = () => Date;
export const systemClock: Clock = () => new Date();

export class RiskNotFound extends Error { readonly status = 404; constructor() { super('NOT_FOUND'); } }
export class StaleVersion extends Error {
  readonly status = 409;
  constructor(public readonly current: { rowVersion: number; current: Record<string, unknown> }) { super('STALE_VERSION'); }
}
export class IdempotencyKeyReused extends Error { readonly status = 422; constructor() { super('IDEMPOTENCY_KEY_REUSED'); } }
export class IllegalState extends Error { readonly status = 409; constructor(m: string) { super(m); } }
export class HardDeleteRefused extends Error { readonly status = 409; constructor(m: string) { super(m); } }

export type SourceKind = 'signal' | 'workshop' | 'manual' | 'import';
export interface RiskContent {
  cause?: string | null; event?: string | null; consequence?: string | null;
  lang?: 'en' | 'ar'; ownerUserId?: number | null; reviewDate?: string | null;
}
export interface CreateRiskInput extends RiskContent {
  sourceKind?: SourceKind;
  /** For source_kind 'signal': the stable signal id, e.g. SG-000123. */
  sourceRef?: string | null;
  signalSeq?: number | null;
  createdBy?: number | null;
}
export interface RiskView {
  id: number; organisationId: number; riskRef: string; rowVersion: number; status: string;
  versionNo: number; event: string | null; ownerUserId: number | null; reviewDate: string | null;
}
export interface CreateResult { risk: RiskView; created: boolean }

/** Stable hash of a request body: key order does not matter. */
export function requestHash(body: unknown): string {
  const canon = (v: any): any =>
    Array.isArray(v) ? v.map(canon)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]))
    : v;
  return createHash('sha256').update(JSON.stringify(canon(body))).digest('hex');
}

const fmtRef = (n: number) => `R-${String(n).padStart(4, '0')}`;
const num = (v: any) => (v === null || v === undefined ? null : Number(v));

function rowToView(r: any): RiskView {
  return {
    id: Number(r.id), organisationId: Number(r.organisation_id), riskRef: r.risk_ref,
    rowVersion: Number(r.row_version), status: r.status, versionNo: Number(r.version_no),
    event: r.event ?? null, ownerUserId: num(r.owner_user_id),
    reviewDate: r.review_date ? (r.review_date instanceof Date ? r.review_date.toISOString().slice(0, 10) : String(r.review_date)) : null,
  };
}

const VIEW_SQL = `SELECT r.id, r.organisation_id, r.risk_ref, r.row_version, r.status,
                         c.version_no, c.event, c.owner_user_id, c.review_date
                    FROM risks r JOIN risks_current c ON c.risk_id = r.id`;

/** Tenant-scoped read. A risk of another organisation looks exactly like a missing one. */
export async function getRisk(db: Queryable, organisationId: number, riskId: number): Promise<RiskView | null> {
  const { rows } = await db.query(`${VIEW_SQL} WHERE r.organisation_id = $1 AND r.id = $2`, [organisationId, riskId]);
  return rows[0] ? rowToView(rows[0]) : null;
}

/**
 * Idempotent create. The caller supplies an Idempotency-Key (for a signal draft:
 * signalId + ':risk_draft'). Same key and same body returns the existing risk;
 * same key and a different body is IdempotencyKeyReused (422). A signal draft is
 * also unique on (organisation, 'signal', source_ref). Numbering comes from the
 * per-organisation counter and is never reused. A signal draft writes exactly one
 * risk.draft_created_from_signal row to risk_outbox, in the same transaction.
 */
export async function createRisk(
  db: Db, organisationId: number, idempotencyKey: string, input: CreateRiskInput, clock: Clock = systemClock,
): Promise<CreateResult> {
  const hash = requestHash(input);
  return db.transaction(async (tx) => {
    // Serialise creates that share a key (or a counter row) so two parallel
    // requests cannot both pass the checks below.
    await tx.query('SELECT pg_advisory_xact_lock($1, hashtext($2))', [organisationId, idempotencyKey]);

    const prior = await tx.query(
      'SELECT request_hash, risk_id FROM risk_idempotency WHERE organisation_id = $1 AND idem_key = $2',
      [organisationId, idempotencyKey]);
    if (prior.rows[0]) {
      if (prior.rows[0].request_hash !== hash) throw new IdempotencyKeyReused();
      const existing = await getRisk(tx, organisationId, Number(prior.rows[0].risk_id));
      return { risk: existing!, created: false };
    }

    const sourceKind: SourceKind = input.sourceKind ?? 'manual';
    if (sourceKind === 'signal') {
      if (!input.sourceRef) throw new IllegalState('SIGNAL_SOURCE_REF_REQUIRED');
      const dup = await tx.query(
        `SELECT id FROM risks WHERE organisation_id = $1 AND source_kind = 'signal' AND source_ref = $2`,
        [organisationId, input.sourceRef]);
      if (dup.rows[0]) {
        // Same signal pressed again under a different key: return the existing draft.
        const existing = await getRisk(tx, organisationId, Number(dup.rows[0].id));
        await tx.query(
          'INSERT INTO risk_idempotency (organisation_id, idem_key, request_hash, risk_id, created_at) VALUES ($1,$2,$3,$4,$5)',
          [organisationId, idempotencyKey, hash, existing!.id, clock()]);
        return { risk: existing!, created: false };
      }
    }

    const ctr = await tx.query(
      `INSERT INTO risk_counters (organisation_id, last_n) VALUES ($1, 1)
         ON CONFLICT (organisation_id) DO UPDATE SET last_n = risk_counters.last_n + 1
         RETURNING last_n`, [organisationId]);
    const riskRef = fmtRef(Number(ctr.rows[0].last_n));
    const now = clock();

    const ins = await tx.query(
      `INSERT INTO risks (organisation_id, risk_ref, status, source_kind, source_ref, created_at)
       VALUES ($1,$2,'draft',$3,$4,$5) RETURNING id`,
      [organisationId, riskRef, sourceKind, input.sourceRef ?? null, now]);
    const riskId = Number(ins.rows[0].id);

    const ver = await tx.query(
      `INSERT INTO risk_versions
         (risk_id, organisation_id, version_no, cause, event, consequence, lang, owner_user_id, review_date,
          change_reason, signal_seq, created_by, created_at)
       VALUES ($1,$2,1,$3,$4,$5,$6,$7,$8,'created',$9,$10,$11) RETURNING id`,
      [riskId, organisationId, input.cause ?? null, input.event ?? null, input.consequence ?? null,
       input.lang ?? 'en', input.ownerUserId ?? null, input.reviewDate ?? null,
       input.signalSeq ?? null, input.createdBy ?? null, now]);
    await tx.query('UPDATE risks SET current_version_id = $1 WHERE id = $2', [Number(ver.rows[0].id), riskId]);
    await tx.query(
      `INSERT INTO risks_current (risk_id, organisation_id, status, version_no, event, owner_user_id, review_date, updated_at)
       VALUES ($1,$2,'draft',1,$3,$4,$5,$6)`,
      [riskId, organisationId, input.event ?? null, input.ownerUserId ?? null, input.reviewDate ?? null, now]);
    await tx.query(
      'INSERT INTO risk_idempotency (organisation_id, idem_key, request_hash, risk_id, created_at) VALUES ($1,$2,$3,$4,$5)',
      [organisationId, idempotencyKey, hash, riskId, now]);

    if (sourceKind === 'signal') {
      await tx.query(
        `INSERT INTO risk_outbox (organisation_id, message_type, idempotency_key, payload, created_at)
         VALUES ($1,'risk.draft_created_from_signal',$2,$3::jsonb,$4)`,
        [organisationId, idempotencyKey, JSON.stringify({ riskId, riskRef, signalId: input.sourceRef }), now]);
    }
    await tx.query(
      `INSERT INTO risk_events (organisation_id, risk_id, kind, detail, actor_user_id, at)
       VALUES ($1,$2,'created',$3::jsonb,$4,$5)`,
      [organisationId, riskId, JSON.stringify({ sourceKind }), input.createdBy ?? null, now]);

    return { risk: (await getRisk(tx, organisationId, riskId))!, created: true };
  });
}

/**
 * Optimistic-lock update. `expectedRowVersion` is the version the caller read.
 * A stale write is StaleVersion (409) carrying the current values; nothing is
 * lost and no history row is written for the refused write. Each accepted write
 * inserts exactly one new risk_versions row (history is append-only).
 */
export async function updateRisk(
  db: Db, organisationId: number, riskId: number, expectedRowVersion: number,
  patch: RiskContent, actorUserId: number | null, clock: Clock = systemClock,
): Promise<RiskView> {
  return db.transaction(async (tx) => {
    const lock = await tx.query(
      'SELECT id, row_version, status FROM risks WHERE organisation_id = $1 AND id = $2 FOR UPDATE',
      [organisationId, riskId]);
    if (!lock.rows[0]) throw new RiskNotFound();
    const cur = await getRisk(tx, organisationId, riskId);
    if (Number(lock.rows[0].row_version) !== expectedRowVersion) {
      throw new StaleVersion({ rowVersion: cur!.rowVersion, current: { ...cur! } });
    }
    const latest = await tx.query(
      'SELECT cause, event, consequence, lang, owner_user_id, review_date FROM risk_versions WHERE risk_id = $1 ORDER BY version_no DESC LIMIT 1',
      [riskId]);
    const l = latest.rows[0];
    const next = {
      cause: patch.cause !== undefined ? patch.cause : l.cause,
      event: patch.event !== undefined ? patch.event : l.event,
      consequence: patch.consequence !== undefined ? patch.consequence : l.consequence,
      lang: patch.lang ?? l.lang,
      ownerUserId: patch.ownerUserId !== undefined ? patch.ownerUserId : num(l.owner_user_id),
      reviewDate: patch.reviewDate !== undefined ? patch.reviewDate : (l.review_date ? String(l.review_date instanceof Date ? l.review_date.toISOString().slice(0, 10) : l.review_date) : null),
    };
    const versionNo = cur!.versionNo + 1;
    const now = clock();
    const ver = await tx.query(
      `INSERT INTO risk_versions
         (risk_id, organisation_id, version_no, cause, event, consequence, lang, owner_user_id, review_date,
          change_reason, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'edited',$10,$11) RETURNING id`,
      [riskId, organisationId, versionNo, next.cause, next.event, next.consequence, next.lang,
       next.ownerUserId, next.reviewDate, actorUserId, now]);
    await tx.query('UPDATE risks SET row_version = row_version + 1, current_version_id = $1 WHERE id = $2',
      [Number(ver.rows[0].id), riskId]);
    await tx.query(
      `UPDATE risks_current SET version_no = $1, event = $2, owner_user_id = $3, review_date = $4, updated_at = $5
        WHERE risk_id = $6`,
      [versionNo, next.event, next.ownerUserId, next.reviewDate, now, riskId]);
    return (await getRisk(tx, organisationId, riskId))!;
  });
}

/**
 * Publish a draft (draft -> open). Two users publishing together: one succeeds,
 * the other gets StaleVersion (test 12).
 */
export async function publishRisk(
  db: Db, organisationId: number, riskId: number, expectedRowVersion: number,
  actorUserId: number | null, clock: Clock = systemClock,
): Promise<RiskView> {
  return db.transaction(async (tx) => {
    const lock = await tx.query(
      'SELECT row_version, status FROM risks WHERE organisation_id = $1 AND id = $2 FOR UPDATE', [organisationId, riskId]);
    if (!lock.rows[0]) throw new RiskNotFound();
    const cur = await getRisk(tx, organisationId, riskId);
    if (Number(lock.rows[0].row_version) !== expectedRowVersion) {
      throw new StaleVersion({ rowVersion: cur!.rowVersion, current: { ...cur! } });
    }
    if (lock.rows[0].status !== 'draft') throw new IllegalState('ONLY_A_DRAFT_CAN_BE_PUBLISHED');
    const now = clock();
    await tx.query("UPDATE risks SET status = 'open', row_version = row_version + 1 WHERE id = $1", [riskId]);
    await tx.query("UPDATE risks_current SET status = 'open', updated_at = $1 WHERE risk_id = $2", [now, riskId]);
    await tx.query(
      `INSERT INTO risk_events (organisation_id, risk_id, kind, detail, actor_user_id, at)
       VALUES ($1,$2,'published','{}'::jsonb,$3,$4)`, [organisationId, riskId, actorUserId, now]);
    return (await getRisk(tx, organisationId, riskId))!;
  });
}

/**
 * Delete a risk. Only a draft younger than 24 hours may go; any other attempt is
 * refused and the refusal is logged (test 14). The database trigger enforces the
 * same rule, so a path that skips this function is also stopped. A deleted
 * draft's risk_ref is never reused (the counter only goes up).
 */
export async function deleteDraft(
  db: Db, organisationId: number, riskId: number, actorUserId: number | null, clock: Clock = systemClock,
): Promise<void> {
  const risk = await getRisk(db, organisationId, riskId);
  if (!risk) throw new RiskNotFound();
  const logRefusal = (reason: string) => db.query(
    `INSERT INTO risk_events (organisation_id, risk_id, kind, detail, actor_user_id, at)
     VALUES ($1,$2,'delete_refused',$3::jsonb,$4,$5)`,
    [organisationId, riskId, JSON.stringify({ reason }), actorUserId, clock()]);
  try {
    await db.transaction(async (tx) => {
      // Versions, the current-state row and the idempotency key go with the draft
      // by cascade; the events log is kept and records the deletion.
      await tx.query('DELETE FROM risks WHERE id = $1 AND organisation_id = $2', [riskId, organisationId]);
      await tx.query(
        `INSERT INTO risk_events (organisation_id, risk_id, kind, detail, actor_user_id, at)
         VALUES ($1,$2,'draft_deleted',$3::jsonb,$4,$5)`,
        [organisationId, riskId, JSON.stringify({ riskRef: risk.riskRef }), actorUserId, clock()]);
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    await logRefusal(msg);
    throw new HardDeleteRefused(msg);
  }
}
