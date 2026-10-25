// Module 08 -- Program Brief (decision card) data model.
//
// WHY THIS EXISTS (owner review, 24 Oct 2026): the per-program "sourced
// note" read like economic news -- it said WHAT a rule is but not HOW it
// works or WHAT the client should do. A Program Brief turns each of the 52
// programs into decision-ready guidance: the rule in one figure, what it
// means for the client's bid, how it works step by step, a timed action
// checklist, traps, and an evidence/confidence label.
//
// HONESTY RULE (Decision Record 8.7): every figure in a brief comes from the
// program's own sourced note (supplierLocalContentEligibility.ts). A brief
// never adds a number the note does not contain. Actions are consultancy
// guidance derived from the rule's mechanics, never invented legal claims.

export interface Bi { en: string; ar: string }

/** How strongly the program's figures are sourced. Shown as text + icon, never colour alone. */
export type BriefConfidence =
  | 'official'      // regulator's / buyer's own text or portal
  | 'corroborated'  // two or more independent sources, or primary + secondary
  | 'single'        // one secondary source, or a reconstruction -- verify before relying
  | 'platform'      // an ISC business-rule default, not a published standard
  | 'none';         // nothing published -- reference only, not scored

export type BriefTiming = 'before' | 'with-bid' | 'after';

export interface BriefAction { when: BriefTiming; text: Bi }

/** Price-test calculator. `add-to-rival`: evaluator inflates non-qualifying offers by pct.
 *  `deduct-own`: evaluator deducts pct from the qualifying offer's price. */
export interface PriceTestSpec {
  pct: number;
  mode: 'add-to-rival' | 'deduct-own';
  /** Shown beside the percentage field, e.g. "legal floor; the buyer sets the exact rate". */
  rateNote?: Bi;
}

/** Obligation sizer: obligation = pct x base; activity spend needed = obligation / multiplier. */
export interface ObligationSpec {
  pct: number;
  baseLabel: Bi;          // e.g. "Imported value"
  currency: string;       // display unit, e.g. "SAR"
  threshold?: number;     // trigger, in the same unit as the base
  multipliers: { label: Bi; value: number }[];
}

export interface BriefUpdate {
  asOf: string;           // ISO date the update was checked
  text: Bi;
  sourceName: string;
  sourceUrl: string;
}

/** Optional interactive tool the brief card should render under the checklist. */
export type BriefTool =
  | 'mechanism-finder'      // which Saudi mechanisms apply to a contract (type x value)
  | 'mandatory-list'        // product lookup + exemption helper
  | 'sa-adjusted-bid'       // price-preference adjusted-bid formula
  | 'sme-check'             // SME preference eligibility + price test
  | 'targeted-contract'     // official contract-level targeted local-content form
  | 'targeted-enterprise'   // official enterprise-level targeted local-content form
  | 'contract-minimum'      // pre-award contract-minimum study (workforce + items)
  | 'financial-evaluation'  // 60/40 financial evaluation scoring
  | 'saudization-check';    // HRSD Saudization shortfall (ICT 25%, consulting 35/40%, technical engineering 30%)

export interface ProgramBrief {
  headline: { value: Bi; label: Bi };
  /** One sentence: what this means for the client's bid. */
  verdict: Bi;
  /** 3-4 numbered steps: how the mechanism actually works. */
  steps: Bi[];
  next: BriefAction[];
  watch: Bi[];
  confidence: BriefConfidence;
  priceTest?: PriceTestSpec;
  obligation?: ObligationSpec;
  update?: BriefUpdate;
  tools?: BriefTool[];
}

export const b = (en: string, ar: string): Bi => ({ en, ar });
