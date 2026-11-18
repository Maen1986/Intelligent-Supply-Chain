/**
 * E4 RM-04 register screen, round 2: the contract between the screen and its data.
 * The screen never talks to the database; it talks to a RiskRegisterClient. The real
 * client (API routes behind RISK_ENGINE_REGISTER) comes in the next round. Nothing here
 * rates, scores or totals a risk: the register records what people say (card RM-04 v7,
 * "never-show list").
 */
export type RegisterStatus = 'draft' | 'open';

export interface RegisterRisk {
  id: number;
  riskRef: string;          // R-0001, never reused
  rowVersion: number;       // optimistic lock: send it back when saving
  status: RegisterStatus;
  event: string;            // what could happen
  cause: string;
  consequence: string;
  ownerName: string | null; // null = unowned
  reviewDate: string | null; // YYYY-MM-DD, null = no review date
}

export interface RegisterDraftInput {
  event: string; cause: string; consequence: string;
  ownerName: string | null; reviewDate: string | null;
}

/** Thrown when someone else saved first (HTTP 409 STALE_VERSION). Carries the current record. */
export class RegisterConflict extends Error {
  constructor(public readonly current: RegisterRisk) { super('STALE_VERSION'); }
}

export interface RiskRegisterClient {
  list(): Promise<RegisterRisk[]>;
  /** Idempotent: the same key and body returns the same risk. */
  create(input: RegisterDraftInput, idempotencyKey: string): Promise<RegisterRisk>;
  update(id: number, expectedRowVersion: number, patch: Partial<RegisterDraftInput>): Promise<RegisterRisk>;
  publish(id: number, expectedRowVersion: number): Promise<RegisterRisk>;
}

/** What a draft still needs before it can be published (a subset of the card's ten-field gate; the full gate is a later round). */
export function missingForPublish(r: Pick<RegisterRisk, 'event' | 'ownerName' | 'reviewDate'>): Array<'event' | 'owner' | 'reviewDate'> {
  const out: Array<'event' | 'owner' | 'reviewDate'> = [];
  if (!r.event.trim()) out.push('event');
  if (!r.ownerName || !r.ownerName.trim()) out.push('owner');
  if (!r.reviewDate) out.push('reviewDate');
  return out;
}

/** Whole days from `today` to `reviewDate` (negative = overdue). Dates are plain YYYY-MM-DD; no time zones. */
export function daysUntil(reviewDate: string, today: string): number {
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+reviewDate.slice(0, 4), +reviewDate.slice(5, 7) - 1, +reviewDate.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}
