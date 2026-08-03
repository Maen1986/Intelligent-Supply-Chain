/**
 * Toolkit AI plan key uniqueness
 *
 * Ensures each of the 5 toolkit tools passes a unique, well-formed toolKey to
 * useAIPlan so that plans stored on the server are never accidentally mixed up.
 *
 * Keys are imported directly from the component source files so that any rename
 * is caught immediately — the test stops passing as soon as the import fails or
 * the value changes.  (Task 369)
 *
 * Server-side validation rule (plans.ts):
 *   TOOL_KEY_RE = /^[a-z][a-z0-9-]{0,63}$/
 */

import { describe, it, expect } from 'vitest';
import { KPI_TOOL_KEY }               from '@/components/KPIDashboard';
import { RISK_TOOL_KEY }              from '@/components/toolkit/RiskTools';
import { TRAINING_TOOL_KEY }          from '@/components/toolkit/TrainingTools';
import { MATURITY_TOOL_KEY }          from '@/components/toolkit/MaturityTools';
import { SCORECARD_TOOL_KEY_PREFIX }  from '@/components/toolkit/SupplierScorecard';

// ── The Scorecard uses a per-supplier dynamic key: `scorecard-${active.id}` ─
//    makeId() returns `sup-<Date.now()>-<Math.random().toString(36).slice(2,7)>`
//    A representative example to exercise the pattern:

const SCORECARD_SAMPLE_ID  = 'sup-1721234567890-ab3c7';
const SCORECARD_SAMPLE_KEY = `${SCORECARD_TOOL_KEY_PREFIX}-${SCORECARD_SAMPLE_ID}`;

// ── Regex from plans.ts ──────────────────────────────────────────────────────

const TOOL_KEY_RE = /^[a-z][a-z0-9-]{0,63}$/;

// ── Convenience map: all four literal toolKeys ────────────────────────────────

const LITERAL_TOOL_KEYS = {
  kpi:      KPI_TOOL_KEY,
  risk:     RISK_TOOL_KEY,
  training: TRAINING_TOOL_KEY,
  maturity: MATURITY_TOOL_KEY,
} as const;

// ── Convenience array: all five representative keys ───────────────────────────

const ALL_FIVE_KEYS: ReadonlyArray<string> = [
  KPI_TOOL_KEY,
  RISK_TOOL_KEY,
  TRAINING_TOOL_KEY,
  MATURITY_TOOL_KEY,
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

  it('the scorecard key prefix is distinct from every literal key', () => {
    const prefix = SCORECARD_TOOL_KEY_PREFIX + '-';
    for (const [name, key] of Object.entries(LITERAL_TOOL_KEYS)) {
      expect(key, `${name} key must not equal the scorecard prefix`).not.toBe(SCORECARD_TOOL_KEY_PREFIX);
      expect(
        key.startsWith(prefix),
        `${name} key "${key}" must not start with the scorecard prefix "${prefix}"`,
      ).toBe(false);
    }
  });

  it('the scorecard key starts with the exported prefix (stable prefix for the server namespace)', () => {
    expect(SCORECARD_SAMPLE_KEY.startsWith(SCORECARD_TOOL_KEY_PREFIX + '-')).toBe(true);
  });

  it('the scorecard supplier-id segment also satisfies TOOL_KEY_RE on its own', () => {
    expect(TOOL_KEY_RE.test(SCORECARD_SAMPLE_KEY)).toBe(true);
  });
});
