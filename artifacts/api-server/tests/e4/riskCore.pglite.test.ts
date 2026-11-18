/**
 * E4 RM-04 1a-core, round 1: tests 12, 13, 14, 15 and 132 of the card
 * (ISC_E4_RM04_Card_Revised_v7), run against a REAL Postgres engine (PGlite, in
 * process) using the real migration SQL. Skipped, visibly, if PGlite is not
 * installed (it is not yet in package.json: adding it changes the lockfile and
 * waits for the owner's yes).
 *
 * What PGlite does NOT prove: true multi-connection row locking. PGlite has one
 * connection, so "parallel" calls here are serialised by the engine; the
 * optimistic-lock logic (row_version) is exercised, the FOR UPDATE wait is not.
 * Run test 12 on real Postgres before the first client use.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { riskCoreMigrations } from '../../src/lib/riskCoreMigration';
import {
  createRisk, updateRisk, publishRisk, deleteDraft, getRisk,
  StaleVersion, IdempotencyKeyReused, HardDeleteRefused, RiskNotFound, IllegalState, type Db,
} from '../../src/lib/riskCore';
import { ORG_A, ORG_B, USER_A, USER_B, fixedClock, goldenRisks, ARABIC_FIXTURE } from './fixtures';

let PGliteCtor: any = null;
try { PGliteCtor = (await import('@electric-sql/pglite' as string)).PGlite; } catch { /* not installed */ }

const d = describe.skipIf(!PGliteCtor);

d('E4 RM-04 1a-core data layer (real Postgres engine)', () => {
  let pg: any;
  let db: Db;
  let clock: ReturnType<typeof fixedClock>;

  beforeAll(async () => {
    pg = new PGliteCtor();
    for (const stmt of riskCoreMigrations) await pg.query(stmt);
    db = {
      query: (sql, params) => pg.query(sql, params),
      transaction: (fn) => pg.transaction((tx: any) => fn({ query: (s: string, p?: unknown[]) => tx.query(s, p) })),
    };
  });
  beforeEach(async () => {
    clock = fixedClock();
    // Fresh data per test: the triggers forbid deleting history, so truncate bypasses row triggers by design.
    await pg.query('TRUNCATE risk_outbox, risk_idempotency, risks_current, risk_versions, risk_events, risks, risk_counters RESTART IDENTITY CASCADE');
  });

  it('migration is idempotent (running it twice changes nothing and errors nowhere)', async () => {
    for (const stmt of riskCoreMigrations) await pg.query(stmt);
    const t = await pg.query(`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name LIKE 'risk%'`);
    expect(t.rows[0].n).toBe(7);
  });

  // ---- test 13: idempotent create and numbering ---------------------------------
  describe('test 13: idempotent create and numbering', () => {
    it('same key and same body twice: one row, same id', async () => {
      const body = { event: 'Port delay' };
      const a = await createRisk(db, ORG_A, 'req-1', body, clock);
      const b = await createRisk(db, ORG_A, 'req-1', { event: 'Port delay' }, clock);
      expect(a.created).toBe(true); expect(b.created).toBe(false);
      expect(b.risk.id).toBe(a.risk.id);
      const n = await pg.query('SELECT count(*)::int AS n FROM risks WHERE organisation_id = $1', [ORG_A]);
      expect(n.rows[0].n).toBe(1);
    });
    it('same body with a new key creates a second row (no duplicate hint in this release)', async () => {
      const a = await createRisk(db, ORG_A, 'req-1', { event: 'Port delay' }, clock);
      const b = await createRisk(db, ORG_A, 'req-2', { event: 'Port delay' }, clock);
      expect(b.risk.id).not.toBe(a.risk.id);
      expect(b.risk.riskRef).toBe('R-0002');
    });
    it('same key with a different body is 422', async () => {
      await createRisk(db, ORG_A, 'req-1', { event: 'Port delay' }, clock);
      await expect(createRisk(db, ORG_A, 'req-1', { event: 'Something else' }, clock)).rejects.toBeInstanceOf(IdempotencyKeyReused);
    });
    it('20 parallel creates in one organisation give 20 distinct R-nnnn', async () => {
      const results = await Promise.all(Array.from({ length: 20 }, (_, i) =>
        createRisk(db, ORG_A, `par-${i}`, { event: `Event ${i}` }, clock)));
      const refs = new Set(results.map((r) => r.risk.riskRef));
      expect(refs.size).toBe(20);
      expect([...refs].sort()[0]).toBe('R-0001'); expect([...refs].sort()[19]).toBe('R-0020');
    });
    it('numbering is per organisation and a deleted draft number is never reused', async () => {
      const a1 = await createRisk(db, ORG_A, 'a1', { event: 'A one' }, clock);
      const b1 = await createRisk(db, ORG_B, 'b1', { event: 'B one' }, clock);
      expect(a1.risk.riskRef).toBe('R-0001'); expect(b1.risk.riskRef).toBe('R-0001');
      await deleteDraft(db, ORG_A, a1.risk.id, USER_A, clock);
      const a2 = await createRisk(db, ORG_A, 'a2', { event: 'A two' }, clock);
      expect(a2.risk.riskRef).toBe('R-0002');
    });
    it('golden dataset G50 creates 50 risks with 50 distinct refs, identical on every run', async () => {
      for (const g of goldenRisks(50)) await createRisk(db, ORG_A, g.key, g.input, clock);
      const r = await pg.query('SELECT count(DISTINCT risk_ref)::int AS n FROM risks WHERE organisation_id = $1', [ORG_A]);
      expect(r.rows[0].n).toBe(50);
    });
    it('Arabic text with Arabic-Indic digits and a bidi override is stored byte for byte', async () => {
      const text = ARABIC_FIXTURE.event + '‮';
      const { risk } = await createRisk(db, ORG_A, 'ar-1', { ...ARABIC_FIXTURE, event: text }, clock);
      const row = await pg.query('SELECT event FROM risk_versions WHERE risk_id = $1', [risk.id]);
      expect(row.rows[0].event).toBe(text);
      // Stripping the override character on save is a test 10 rule for the service layer; not built in this round.
    });
  });

  // ---- test 12: optimistic locking and concurrent publish ------------------------
  describe('test 12: optimistic locking and concurrent publish', () => {
    it('two sessions read the same version: first save wins, second gets 409 with current values, no field lost', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      let v = risk;
      for (let i = 0; i < 3; i++) v = await updateRisk(db, ORG_A, v.id, v.rowVersion, { cause: `c${i}` }, USER_A, clock);
      expect(v.rowVersion).toBe(4);
      const a = await updateRisk(db, ORG_A, v.id, 4, { ownerUserId: USER_A }, USER_A, clock);
      expect(a.rowVersion).toBe(5);
      const err = await updateRisk(db, ORG_A, v.id, 4, { reviewDate: '2027-01-31' }, USER_B, clock).catch((e) => e);
      expect(err).toBeInstanceOf(StaleVersion);
      expect(err.current.rowVersion).toBe(5);
      expect((err.current.current as any).ownerUserId).toBe(USER_A);
      const final = await getRisk(db, ORG_A, v.id);
      expect(final!.ownerUserId).toBe(USER_A);
      expect(final!.reviewDate).toBeNull();
      const hist = await pg.query('SELECT count(*)::int AS n FROM risk_versions WHERE risk_id = $1', [v.id]);
      expect(hist.rows[0].n).toBe(5); // 1 create + 3 edits + 1 accepted write; the refused write left no row
    });
    it('two users publish the same draft together: one succeeds, one gets 409', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      const results = await Promise.allSettled([
        publishRisk(db, ORG_A, risk.id, risk.rowVersion, USER_A, clock),
        publishRisk(db, ORG_A, risk.id, risk.rowVersion, USER_B, clock),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rej = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rej.reason).toBeInstanceOf(StaleVersion);
      const n = await pg.query(`SELECT count(*)::int AS n FROM risk_events WHERE risk_id = $1 AND kind = 'published'`, [risk.id]);
      expect(n.rows[0].n).toBe(1);
    });
    it('publishing a risk that is not a draft is refused', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      const open = await publishRisk(db, ORG_A, risk.id, risk.rowVersion, USER_A, clock);
      await expect(publishRisk(db, ORG_A, risk.id, open.rowVersion, USER_A, clock)).rejects.toBeInstanceOf(IllegalState);
    });
  });

  // ---- test 14: append-only history, no hard delete ------------------------------
  describe('test 14: append-only history, no hard delete', () => {
    it('UPDATE and DELETE on risk_versions are refused by the database', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      await expect(pg.query(`UPDATE risk_versions SET event = 'tampered' WHERE risk_id = $1`, [risk.id])).rejects.toThrow(/APPEND_ONLY/);
      await expect(pg.query('DELETE FROM risk_versions WHERE risk_id = $1', [risk.id])).rejects.toThrow(/APPEND_ONLY/);
      const row = await pg.query('SELECT event FROM risk_versions WHERE risk_id = $1', [risk.id]);
      expect(row.rows[0].event).toBe('Port delay');
    });
    it('UPDATE and DELETE on risk_events are refused by the database', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      await expect(pg.query(`UPDATE risk_events SET kind = 'x' WHERE risk_id = $1`, [risk.id])).rejects.toThrow(/APPEND_ONLY/);
      await expect(pg.query('DELETE FROM risk_events WHERE risk_id = $1', [risk.id])).rejects.toThrow(/APPEND_ONLY/);
    });
    it('an edit inserts a new version row; the old row is unchanged', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      await updateRisk(db, ORG_A, risk.id, risk.rowVersion, { event: 'Port delay, revised' }, USER_A, clock);
      const rows = await pg.query('SELECT version_no, event FROM risk_versions WHERE risk_id = $1 ORDER BY version_no', [risk.id]);
      expect(rows.rows.map((r: any) => [r.version_no, r.event])).toEqual([[1, 'Port delay'], [2, 'Port delay, revised']]);
    });
    it('a young draft can be deleted (its versions go with it; the events log keeps the deletion)', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      await deleteDraft(db, ORG_A, risk.id, USER_A, clock);
      expect(await getRisk(db, ORG_A, risk.id)).toBeNull();
      const ev = await pg.query(`SELECT kind FROM risk_events WHERE risk_id = $1 ORDER BY id`, [risk.id]);
      expect(ev.rows.map((r: any) => r.kind)).toEqual(['created', 'draft_deleted']);
    });
    it('hard delete of an open risk is refused and the attempt is logged', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      const open = await publishRisk(db, ORG_A, risk.id, risk.rowVersion, USER_A, clock);
      await expect(deleteDraft(db, ORG_A, open.id, USER_A, clock)).rejects.toBeInstanceOf(HardDeleteRefused);
      expect(await getRisk(db, ORG_A, open.id)).not.toBeNull();
      const ev = await pg.query(`SELECT kind FROM risk_events WHERE risk_id = $1 AND kind = 'delete_refused'`, [open.id]);
      expect(ev.rows).toHaveLength(1);
    });
    it('a draft older than 24 hours cannot be deleted', async () => {
      const old = fixedClock(new Date(Date.now() - 30 * 3_600_000).toISOString());
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, old);
      await expect(deleteDraft(db, ORG_A, risk.id, USER_A, clock)).rejects.toBeInstanceOf(HardDeleteRefused);
      expect(await getRisk(db, ORG_A, risk.id)).not.toBeNull();
    });
    it('direct SQL DELETE of an open risk is stopped by the trigger even if the service is skipped', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Port delay' }, clock);
      await publishRisk(db, ORG_A, risk.id, risk.rowVersion, USER_A, clock);
      await expect(pg.query('DELETE FROM risks WHERE id = $1', [risk.id])).rejects.toThrow(/HARD_DELETE_REFUSED/);
    });
  });

  // ---- test 15: tenant isolation (read, update, delete paths of this layer) -------
  describe('test 15: tenant isolation (paths that exist in round 1)', () => {
    it('Org B asking for an Org A risk gets the same answer as a missing id', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Only Org A knows this' }, clock);
      const cross = await getRisk(db, ORG_B, risk.id);
      const missing = await getRisk(db, ORG_B, 999_999);
      expect(cross).toBeNull(); expect(missing).toBeNull();
    });
    it('Org B cannot update, publish or delete an Org A risk (404, nothing changed)', async () => {
      const { risk } = await createRisk(db, ORG_A, 'k', { event: 'Only Org A knows this' }, clock);
      await expect(updateRisk(db, ORG_B, risk.id, risk.rowVersion, { event: 'hijack' }, USER_B, clock)).rejects.toBeInstanceOf(RiskNotFound);
      await expect(publishRisk(db, ORG_B, risk.id, risk.rowVersion, USER_B, clock)).rejects.toBeInstanceOf(RiskNotFound);
      await expect(deleteDraft(db, ORG_B, risk.id, USER_B, clock)).rejects.toBeInstanceOf(RiskNotFound);
      const after = await getRisk(db, ORG_A, risk.id);
      expect(after!.event).toBe('Only Org A knows this'); expect(after!.status).toBe('draft'); expect(after!.rowVersion).toBe(1);
    });
    it('the same idempotency key in two organisations is two independent creates', async () => {
      const a = await createRisk(db, ORG_A, 'shared-key', { event: 'A' }, clock);
      const b = await createRisk(db, ORG_B, 'shared-key', { event: 'B' }, clock);
      expect(a.risk.id).not.toBe(b.risk.id); expect(b.created).toBe(true);
    });
    // Not built in round 1, so not tested here: export, search and CSV-import paths of test 15.
  });

  // ---- test 132 (core): signal draft, unique key, one outbox row -------------------
  describe('test 132 (data-layer core): signal draft is idempotent and writes one outbox row', () => {
    const signalBody = { sourceKind: 'signal' as const, sourceRef: 'SG-000123', signalSeq: 7, event: 'Strike at origin port' };
    it('first call creates a draft and one risk.draft_created_from_signal row; second call returns the same draft and writes none', async () => {
      const key = 'SG-000123:risk_draft';
      const a = await createRisk(db, ORG_A, key, signalBody, clock);
      const b = await createRisk(db, ORG_A, key, signalBody, clock);
      expect(a.created).toBe(true); expect(b.created).toBe(false); expect(b.risk.riskRef).toBe(a.risk.riskRef);
      const ob = await pg.query(`SELECT message_type, idempotency_key FROM risk_outbox WHERE organisation_id = $1`, [ORG_A]);
      expect(ob.rows).toEqual([{ message_type: 'risk.draft_created_from_signal', idempotency_key: key }]);
    });
    it('the same key with a different body is 422 and writes nothing new', async () => {
      const key = 'SG-000123:risk_draft';
      await createRisk(db, ORG_A, key, signalBody, clock);
      await expect(createRisk(db, ORG_A, key, { ...signalBody, event: 'different' }, clock)).rejects.toBeInstanceOf(IdempotencyKeyReused);
      const n = await pg.query('SELECT count(*)::int AS n FROM risk_outbox');
      expect(n.rows[0].n).toBe(1);
    });
    it('the same signal pressed under a different key still returns the existing draft (unique on organisation, signal, source_ref)', async () => {
      const a = await createRisk(db, ORG_A, 'key-1', signalBody, clock);
      const b = await createRisk(db, ORG_A, 'key-2', signalBody, clock);
      expect(b.created).toBe(false); expect(b.risk.id).toBe(a.risk.id);
      const n = await pg.query('SELECT count(*)::int AS n FROM risks WHERE organisation_id = $1', [ORG_A]);
      expect(n.rows[0].n).toBe(1);
      const ob = await pg.query('SELECT count(*)::int AS n FROM risk_outbox');
      expect(ob.rows[0].n).toBe(1);
    });
    it('the database itself refuses a second signal draft for the same signal', async () => {
      const a = await createRisk(db, ORG_A, 'key-1', signalBody, clock);
      await expect(pg.query(
        `INSERT INTO risks (organisation_id, risk_ref, source_kind, source_ref) VALUES ($1,'R-9999','signal','SG-000123')`, [ORG_A],
      )).rejects.toThrow(/risks_signal_source_unique|duplicate key/);
      expect(a.created).toBe(true);
    });
    it('a manual risk never writes to the outbox', async () => {
      await createRisk(db, ORG_A, 'm1', { event: 'Manual' }, clock);
      const n = await pg.query('SELECT count(*)::int AS n FROM risk_outbox');
      expect(n.rows[0].n).toBe(0);
    });
    it('a signal draft without a source_ref is refused', async () => {
      await expect(createRisk(db, ORG_A, 'x', { sourceKind: 'signal', event: 'no ref' }, clock)).rejects.toBeInstanceOf(IllegalState);
    });
  });
});
