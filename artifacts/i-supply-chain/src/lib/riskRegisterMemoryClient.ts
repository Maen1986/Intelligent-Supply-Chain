/**
 * In-memory RiskRegisterClient for tests and design review. It mimics the real rules
 * (idempotent create, per-register numbering that is never reused, optimistic locking)
 * but stores nothing anywhere. It is NOT the production client.
 */
import { RegisterConflict, type RegisterDraftInput, type RegisterRisk, type RiskRegisterClient } from './riskRegisterTypes';

export function createMemoryClient(seed: RegisterRisk[] = []): RiskRegisterClient & { _rows: RegisterRisk[]; _bump(id: number, patch: Partial<RegisterRisk>): void } {
  let rows = seed.map((r) => ({ ...r }));
  let counter = rows.reduce((m, r) => Math.max(m, Number(r.riskRef.slice(2))), 0);
  const seen = new Map<string, { hash: string; id: number }>();
  const find = (id: number) => { const r = rows.find((x) => x.id === id); if (!r) throw new Error('NOT_FOUND'); return r; };
  const api = {
    get _rows() { return rows; },
    _bump(id: number, patch: Partial<RegisterRisk>) { const r = find(id); Object.assign(r, patch, { rowVersion: r.rowVersion + 1 }); },
    async list() { return rows.map((r) => ({ ...r })); },
    async create(input: RegisterDraftInput, key: string) {
      const hash = JSON.stringify(input);
      const prior = seen.get(key);
      if (prior) { if (prior.hash !== hash) throw new Error('IDEMPOTENCY_KEY_REUSED'); return { ...find(prior.id) }; }
      counter += 1;
      const r: RegisterRisk = { id: 1000 + counter, riskRef: `R-${String(counter).padStart(4, '0')}`, rowVersion: 1, status: 'draft', ...input };
      rows = [...rows, r]; seen.set(key, { hash, id: r.id });
      return { ...r };
    },
    async update(id: number, expected: number, patch: Partial<RegisterDraftInput>) {
      const r = find(id);
      if (r.rowVersion !== expected) throw new RegisterConflict({ ...r });
      Object.assign(r, patch); r.rowVersion += 1; return { ...r };
    },
    async publish(id: number, expected: number) {
      const r = find(id);
      if (r.rowVersion !== expected) throw new RegisterConflict({ ...r });
      r.status = 'open'; r.rowVersion += 1; return { ...r };
    },
  };
  return api as any;
}
