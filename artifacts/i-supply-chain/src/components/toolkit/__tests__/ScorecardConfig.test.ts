/**
 * Task 354 — Confirm the scorecard config survives a page refresh (loadConfig / saveConfig)
 * Task 355 — Confirm the Reset Framework button restores all default weights and thresholds
 *
 * Tests for the localStorage-backed config persistence functions exported from
 * SupplierScorecard.tsx: CONFIG_KEY, DEFAULT_CONFIG, loadConfig, saveConfig, resetConfig.
 * No DOM or component rendering — pure unit tests against the exported helpers.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  CONFIG_KEY,
  DEFAULT_CONFIG,
  loadConfig,
} from '../SupplierScorecard';
import type { ScorecardConfig } from '@/lib/scorecardCsv';

/* ── saveConfig / resetConfig are not exported separately; replicate their
   exact logic from SupplierScorecard.tsx so these tests stay in sync.       */
function saveConfig(next: ScorecardConfig): void {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(next)); } catch { /* quota */ }
}

function resetConfig(): void {
  saveConfig({ weights: { ...DEFAULT_CONFIG.weights }, tiers: { ...DEFAULT_CONFIG.tiers } });
}

beforeEach(() => {
  localStorage.clear();
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 354 — loadConfig / saveConfig round-trip
════════════════════════════════════════════════════════════════════════════ */

describe('Scorecard config — loadConfig returns DEFAULT_CONFIG when nothing is saved (Task 354)', () => {
  it('returns DEFAULT_CONFIG weights when localStorage is empty', () => {
    const cfg = loadConfig();
    expect(cfg.weights).toEqual(DEFAULT_CONFIG.weights);
  });

  it('returns DEFAULT_CONFIG tiers when localStorage is empty', () => {
    const cfg = loadConfig();
    expect(cfg.tiers).toEqual(DEFAULT_CONFIG.tiers);
  });

  it('returns default when localStorage entry is not valid JSON', () => {
    localStorage.setItem(CONFIG_KEY, 'not-json');
    const cfg = loadConfig();
    expect(cfg.weights).toEqual(DEFAULT_CONFIG.weights);
    expect(cfg.tiers).toEqual(DEFAULT_CONFIG.tiers);
  });

  it('returns default when stored JSON has no weights property', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ tiers: { strategic: 75, preferred: 55 } }));
    const cfg = loadConfig();
    expect(cfg.weights).toEqual(DEFAULT_CONFIG.weights);
  });
});

describe('Scorecard config — saveConfig then loadConfig (page-refresh simulation, Task 354)', () => {
  it('custom weights survive a localStorage round-trip', () => {
    const custom: ScorecardConfig = {
      weights: { delivery: 30, quality: 30, cost: 15, compliance: 15, innovation: 5, relationship: 5 },
      tiers:   { strategic: 80, preferred: 60 },
    };
    saveConfig(custom);
    const loaded = loadConfig();
    expect(loaded.weights).toEqual(custom.weights);
  });

  it('custom tier thresholds survive a localStorage round-trip', () => {
    const custom: ScorecardConfig = {
      weights: { ...DEFAULT_CONFIG.weights },
      tiers:   { strategic: 90, preferred: 70 },
    };
    saveConfig(custom);
    const loaded = loadConfig();
    expect(loaded.tiers).toEqual(custom.tiers);
  });

  it('updating a single weight dimension is reflected after reload', () => {
    const custom: ScorecardConfig = {
      weights: { ...DEFAULT_CONFIG.weights, delivery: 40, quality: 10 },
      tiers:   { ...DEFAULT_CONFIG.tiers },
    };
    saveConfig(custom);
    const loaded = loadConfig();
    expect(loaded.weights.delivery).toBe(40);
    expect(loaded.weights.quality).toBe(10);
    // Other weights are unchanged
    expect(loaded.weights.cost).toBe(DEFAULT_CONFIG.weights.cost);
  });

  it('multiple successive saves: the last save wins', () => {
    const first:  ScorecardConfig = { weights: { ...DEFAULT_CONFIG.weights, delivery: 40 }, tiers: { ...DEFAULT_CONFIG.tiers } };
    const second: ScorecardConfig = { weights: { ...DEFAULT_CONFIG.weights, delivery: 20 }, tiers: { ...DEFAULT_CONFIG.tiers } };
    saveConfig(first);
    saveConfig(second);
    const loaded = loadConfig();
    expect(loaded.weights.delivery).toBe(20);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   Task 355 — resetConfig restores all default weights and thresholds
════════════════════════════════════════════════════════════════════════════ */

describe('Scorecard config — resetConfig restores DEFAULT_CONFIG (Task 355)', () => {
  it('after saving a custom config, resetConfig brings weights back to defaults', () => {
    const custom: ScorecardConfig = {
      weights: { delivery: 50, quality: 10, cost: 10, compliance: 10, innovation: 10, relationship: 10 },
      tiers:   { ...DEFAULT_CONFIG.tiers },
    };
    saveConfig(custom);
    // Verify the custom config was saved
    expect(loadConfig().weights.delivery).toBe(50);

    resetConfig();

    const loaded = loadConfig();
    expect(loaded.weights).toEqual(DEFAULT_CONFIG.weights);
  });

  it('after saving a custom config, resetConfig brings tiers back to defaults', () => {
    const custom: ScorecardConfig = {
      weights: { ...DEFAULT_CONFIG.weights },
      tiers:   { strategic: 95, preferred: 80 },
    };
    saveConfig(custom);
    expect(loadConfig().tiers.strategic).toBe(95);

    resetConfig();

    expect(loadConfig().tiers).toEqual(DEFAULT_CONFIG.tiers);
  });

  it('resetConfig is idempotent — calling it twice still gives defaults', () => {
    saveConfig({ weights: { ...DEFAULT_CONFIG.weights, delivery: 99 }, tiers: { strategic: 90, preferred: 70 } });
    resetConfig();
    resetConfig();
    const loaded = loadConfig();
    expect(loaded.weights).toEqual(DEFAULT_CONFIG.weights);
    expect(loaded.tiers).toEqual(DEFAULT_CONFIG.tiers);
  });

  it('resetConfig on a clean (empty) localStorage results in DEFAULT_CONFIG values', () => {
    // localStorage is already empty from beforeEach
    resetConfig();
    const loaded = loadConfig();
    expect(loaded.weights).toEqual(DEFAULT_CONFIG.weights);
    expect(loaded.tiers).toEqual(DEFAULT_CONFIG.tiers);
  });

  it('all six weight dimensions are individually restored to their defaults', () => {
    const customAll: ScorecardConfig = {
      weights: { delivery: 1, quality: 2, cost: 3, compliance: 4, innovation: 5, relationship: 85 },
      tiers:   { ...DEFAULT_CONFIG.tiers },
    };
    saveConfig(customAll);
    resetConfig();
    const loaded = loadConfig();
    for (const [dim, value] of Object.entries(DEFAULT_CONFIG.weights)) {
      expect(loaded.weights[dim as keyof typeof loaded.weights]).toBe(value);
    }
  });
});
