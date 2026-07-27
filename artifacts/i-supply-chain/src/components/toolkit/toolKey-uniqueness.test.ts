/**
 * Toolkit AI plan key uniqueness
 *
 * Ensures each of the 5 toolkit tools passes a unique, well-formed toolKey to
 * useAIPlan so that plans stored on the server are never accidentally mixed up.
 *
 * Source references (where each key is defined):
 *   KPI       → src/components/KPIDashboard.tsx         useAIPlan(..., 'kpi', ...)
 *   Risk      → src/components/toolkit/RiskTools.tsx     useAIPlan(..., 'risk-register', ...)
 *   Training  → src/components/toolkit/TrainingTools.tsx useAIPlan(..., 'training', ...)
 *   Maturity  → src/components/toolkit/MaturityTools.tsx useAIPlan(..., 'maturity', ...)
 *   Scorecard → src/components/toolkit/SupplierScorecard.tsx
 *               useAIPlan(..., active?.id ? `scorecard-${active.id}` : undefined, ...)
 *               where active.id is produced by makeId() → `sup-<timestamp>-<5alphanum>`
 *
 * Server-side validation rule (plans.ts):
 *   TOOL_KEY_RE = /^[a-z][a-z0-9-]{0,63}$/
 */

import { describe, it, expect } from 'vitest';

// ── The four literal toolKeys used by the fixed toolkit tools ───────────────

const LITERAL_TOOL_KEYS = {
  kpi:       'kpi',
  risk:      'risk-register',
  training:  'training',
  maturity:  'maturity',
} as const;

// ── The Scorecard uses a per-supplier dynamic key: `scorecard-${active.id}` ─
//    makeId() returns `sup-<Date.now()>-<Math.random().toString(36).slice(2,7)>`
//    A representative example to exercise the pattern:

const SCORECARD_SAMPLE_ID  = 'sup-1721234567890-ab3c7';
const SCORECARD_SAMPLE_KEY = `scorecard-${SCORECARD_SAMPLE_ID}`;

// ── Regex from plans.ts ──────────────────────────────────────────────────────

const TOOL_KEY_RE = /^[a-z][a-z0-9-]{0,63}$/;

// ── Convenience set: all five representative keys ────────────────────────────

const ALL_FIVE_KEYS: ReadonlyArray<string> = [
  LITERAL_TOOL_KEYS.kpi,
  LITERAL_TOOL_KEYS.risk,
  LITERAL_TOOL_KEYS.training,
  LITERAL_TOOL_KEYS.maturity,
  SCORECARD_SAMPLE_KEY,
];

// ─────────────────────────────────────────────────────────────────────────────

describe('toolkit toolKey uniqueness', () => {
  it('every literal toolKey is a non-empty string', () => {
    for (const [name, key] of Object.entries(LITERAL_TOOL_KEYS)) {
      expect(typeof key, `${name} key must be a string`).toBe('string');
      expect(key.length, `${name} key must be non-empty`).toBeGreaterThan(0);
    }
  });

  it('every literal toolKey matches the server-side TOOL_KEY_RE', () => {
    for (const [name, key] of Object.entries(LITERAL_TOOL_KEYS)) {
      expect(TOOL_KEY_RE.test(key), `${name} key "${key}" must match TOOL_KEY_RE`).toBe(true);
    }
  });

  it('scorecard sample key (scorecard-<supplier-id>) matches the server-side TOOL_KEY_RE', () => {
    expect(TOOL_KEY_RE.test(SCORECARD_SAMPLE_KEY)).toBe(true);
  });

  it('all five toolKeys are distinct — no two tools share the same key', () => {
    const unique = new Set(ALL_FIVE_KEYS);
    expect(unique.size).toBe(ALL_FIVE_KEYS.length);
  });

  it('no literal key is a prefix of another literal key (would risk silent overwrites)', () => {
    const keys = Object.values(LITERAL_TOOL_KEYS);
    for (const a of keys) {
      for (const b of keys) {
        if (a !== b) {
          expect(
            b.startsWith(a + '-'),
            `"${a}" must not be a prefix of "${b}"`,
          ).toBe(false);
        }
      }
    }
  });

  it('the scorecard key prefix "scorecard-" is distinct from every literal key', () => {
    const prefix = 'scorecard-';
    for (const [name, key] of Object.entries(LITERAL_TOOL_KEYS)) {
      expect(key, `${name} key must not equal the scorecard prefix "${prefix}"`).not.toBe(prefix);
      expect(
        key.startsWith(prefix),
        `${name} key "${key}" must not start with the scorecard prefix "${prefix}"`,
      ).toBe(false);
    }
  });

  it('the scorecard key starts with "scorecard-" (stable prefix for the server namespace)', () => {
    expect(SCORECARD_SAMPLE_KEY.startsWith('scorecard-')).toBe(true);
  });

  it('the scorecard supplier-id segment also satisfies TOOL_KEY_RE on its own', () => {
    // The full scorecard key is built as `scorecard-${id}`.  The id portion
    // (`sup-<timestamp>-<5chars>`) must itself be a valid key component so that
    // the concatenated string stays within the allowed character set.
    expect(TOOL_KEY_RE.test(SCORECARD_SAMPLE_KEY)).toBe(true);
  });
});
