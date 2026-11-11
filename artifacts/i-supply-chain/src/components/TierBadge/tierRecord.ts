// tierRecord.ts -- record validation (spec 6.15A "The two rules", card X-01 "Set or change a tier")
// and the Tier 2 text guard (test 259). Pure functions, no React, no I/O.
import { FORBIDDEN_TIER2_AR, FORBIDDEN_TIER2_EN } from './tierStrings';

export type PossibleAnswer = string | { text: string; source?: string; vLevel?: string };

export interface TierRecord {
  tier?: 1 | 2 | 3 | null;
  basis?: string | null;
  confirmedBy?: string | null;
  confirmedOn?: string | Date | null;
  source?: string | null;
  sourceOpenedOn?: string | Date | null;
  possibleAnswers?: PossibleAnswer[] | null;
}

export type ReasonCode =
  | 'TIER_MISSING_OR_INVALID'
  | 'T1_NO_BASIS'
  | 'T1_NO_CONFIRMER_OR_OPENED_SOURCE'
  | 'T1_NO_DATE'
  | 'T1_DATE_INVALID'
  | 'T1_DATE_IN_FUTURE'
  | 'T2_NO_SOURCE'
  | 'T2_FORBIDDEN_WORD'
  | 'T3_NO_PROMPT';

export type WarningCode =
  | 'T3_NO_POSSIBLE_ANSWERS'
  | 'T2_NO_POSSIBLE_ANSWERS'
  | 'T2_CONFIRMER_IGNORED'
  | 'T2_SOURCE_DATE_INVALID'
  | 'T2_SOURCE_DATE_IN_FUTURE'
  | 'ANSWER_NO_SOURCE_OR_VLEVEL';

export interface ValidationResult {
  /** 'OK' = the record can be shown as the tier it claims. 'INSUFFICIENT_DATA' = never guess: show the safe state. */
  state: 'OK' | 'INSUFFICIENT_DATA';
  tier: 1 | 2 | 3 | null;
  reasons: ReasonCode[];
  warnings: WarningCode[];
  /** Tier 1 only: which route earned it. */
  route?: 'expert' | 'source';
  /** Normalised ISO dates (YYYY-MM-DD, Western digits), when valid. */
  confirmedOn?: string;
  sourceOpenedOn?: string;
  /** Forbidden words found in Tier 2 free text (for the dev guard message). */
  forbiddenFound?: string[];
}

export interface ValidateOptions {
  /** "Today" for the future-date check. Default: new Date(). Injected so tests are deterministic. */
  now?: Date;
  /** Override for the Tier 3 prompt check (default: the fixed spec prompt is always available). */
  tier3PromptAvailable?: boolean;
}

const AR_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXT_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Western digits only (spec: Western digits everywhere). */
export function toWesternDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (c) => {
    const i = AR_INDIC.indexOf(c);
    return String(i >= 0 ? i : EXT_INDIC.indexOf(c));
  });
}

export function clean(s: string | null | undefined): string {
  return typeof s === 'string' ? s.trim() : '';
}

export type DateParse = { ok: true; iso: string } | { ok: false; why: 'missing' | 'invalid' };

/** Accepts a Date, 'YYYY-MM-DD' or an ISO date-time string. Anything else is invalid (never guessed). */
export function parseIsoDate(v: string | Date | null | undefined): DateParse {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return { ok: false, why: 'missing' };
  let y: number, m: number, d: number;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return { ok: false, why: 'invalid' };
    y = v.getUTCFullYear(); m = v.getUTCMonth() + 1; d = v.getUTCDate();
  } else {
    const mm = /^(\d{4})-(\d{2})-(\d{2})(?:[T ][0-9:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(toWesternDigits(v.trim()));
    if (!mm) return { ok: false, why: 'invalid' };
    y = +mm[1]; m = +mm[2]; d = +mm[3];
  }
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (y < 1900 || probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return { ok: false, why: 'invalid' };
  }
  const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { ok: true, iso };
}

function isFuture(iso: string, now: Date): boolean {
  const n = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return iso > n;
}

const AR_DIACRITICS = /[ً-ْٰـ]/g;
const EN_RE = new RegExp(`(?<![\\p{L}\\p{N}_])(${FORBIDDEN_TIER2_EN.join('|')})(?![\\p{L}\\p{N}_])`, 'giu');
const AR_RE = new RegExp(`(?<![\\p{L}\\p{M}])(${FORBIDDEN_TIER2_AR.join('|')})(?![\\p{L}\\p{M}])`, 'gu');

/**
 * Whole-word guard of test 259. "confirm" and "please confirm" are allowed; only the listed whole words
 * are refused ("confirmed" yes, "confirmation" and "uncertain" no). Arabic is matched without diacritics.
 */
export function findForbiddenTier2Words(text: string): string[] {
  const found: string[] = [];
  const en = text.match(EN_RE);
  if (en) found.push(...en.map((w) => w.toLowerCase()));
  const ar = text.replace(AR_DIACRITICS, '').match(AR_RE);
  if (ar) found.push(...ar);
  return found;
}

/** True when a non-empty possible answer lacks a source or a V level (spec 6.15B rule 3: the row is left out, never defaulted; the record is reported incomplete). */
export function answerIncomplete(a: PossibleAnswer): boolean {
  if (typeof a === 'string') return a.trim() !== '';
  if (!a.text || a.text.trim() === '') return false;
  return !clean(a.source) || !clean(a.vLevel);
}

export function answerText(a: PossibleAnswer): string {
  return typeof a === 'string' ? a : [a.text, a.source, a.vLevel].filter(Boolean).join(' ');
}

/** Free-text of a record that a Tier 2 render would show. */
export function tier2FreeText(r: TierRecord): string[] {
  const out = [clean(r.basis), clean(r.source)];
  for (const a of r.possibleAnswers ?? []) out.push(answerText(a));
  return out.filter(Boolean);
}

/**
 * validateTierRecord -- never guesses.
 *  Tier 1: basis + (confirmer, or an opened source) + a valid date (not in the future).
 *  Tier 2: a source, and no forbidden word in its text.
 *  Tier 3: the prompt (always available from the string table).
 *  Anything else: state INSUFFICIENT_DATA with the reasons.
 */
export function validateTierRecord(r: TierRecord | null | undefined, opts: ValidateOptions = {}): ValidationResult {
  const now = opts.now ?? new Date();
  const reasons: ReasonCode[] = [];
  const warnings: WarningCode[] = [];
  const tier = r?.tier;
  if (!r || (tier !== 1 && tier !== 2 && tier !== 3)) {
    return { state: 'INSUFFICIENT_DATA', tier: null, reasons: ['TIER_MISSING_OR_INVALID'], warnings };
  }
  const res: ValidationResult = { state: 'OK', tier, reasons, warnings };

  if (tier === 1) {
    const basis = clean(r.basis);
    const by = clean(r.confirmedBy);
    const src = clean(r.source);
    if (!basis) reasons.push('T1_NO_BASIS');
    const expert = by.length > 0;
    const source = src.length > 0;
    if (!expert && !source) reasons.push('T1_NO_CONFIRMER_OR_OPENED_SOURCE');
    // Expert route: named confirmer + confirmedOn. Source route: opened source + the date it was opened.
    const dExpert = parseIsoDate(r.confirmedOn);
    const dSource = parseIsoDate(r.sourceOpenedOn ?? r.confirmedOn);
    const expertOk = expert && dExpert.ok && !isFuture(dExpert.iso, now);
    const sourceOk = source && dSource.ok && !isFuture(dSource.iso, now);
    if (expertOk && dExpert.ok) res.confirmedOn = dExpert.iso;
    if (source && dSource.ok) res.sourceOpenedOn = dSource.iso;
    if (!expertOk && !sourceOk && (expert || source)) {
      const d = expert ? dExpert : dSource;
      if (!d.ok) reasons.push(d.why === 'missing' ? 'T1_NO_DATE' : 'T1_DATE_INVALID');
      else reasons.push('T1_DATE_IN_FUTURE');
    }
    if (!reasons.length) res.route = expertOk ? 'expert' : 'source';
  }

  if (tier === 2) {
    if (!clean(r.source)) reasons.push('T2_NO_SOURCE');
    const bad = tier2FreeText(r).flatMap(findForbiddenTier2Words);
    if (bad.length) { reasons.push('T2_FORBIDDEN_WORD'); res.forbiddenFound = [...new Set(bad)]; }
    if (clean(r.confirmedBy)) warnings.push('T2_CONFIRMER_IGNORED');
    if (!r.possibleAnswers || r.possibleAnswers.length === 0) warnings.push('T2_NO_POSSIBLE_ANSWERS');
    if ((r.possibleAnswers ?? []).some(answerIncomplete)) warnings.push('ANSWER_NO_SOURCE_OR_VLEVEL');
    const d = parseIsoDate(r.sourceOpenedOn ?? r.confirmedOn);
    if (d.ok) { res.sourceOpenedOn = d.iso; if (isFuture(d.iso, now)) warnings.push('T2_SOURCE_DATE_IN_FUTURE'); }
    else if (d.why === 'invalid') warnings.push('T2_SOURCE_DATE_INVALID');
  }

  if (tier === 3) {
    if (opts.tier3PromptAvailable === false) reasons.push('T3_NO_PROMPT');
    if (!r.possibleAnswers || r.possibleAnswers.length === 0) warnings.push('T3_NO_POSSIBLE_ANSWERS');
    if ((r.possibleAnswers ?? []).some(answerIncomplete)) warnings.push('ANSWER_NO_SOURCE_OR_VLEVEL');
    const d = parseIsoDate(r.sourceOpenedOn ?? r.confirmedOn);
    if (d.ok) res.sourceOpenedOn = d.iso;
  }

  if (reasons.length) res.state = 'INSUFFICIENT_DATA';
  return res;
}
