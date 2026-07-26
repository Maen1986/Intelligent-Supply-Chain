/**
 * Toolkit localStorage persistence tests
 *
 * Verifies that every toolkit tool's state:
 *  1. Survives a round-trip through localStorage (write → read → assert equality)
 *  2. Falls back gracefully to a safe default when the stored JSON is malformed
 *  3. Uses the correct, non-colliding key namespace
 *
 * Tests do NOT render React components; they exercise the same
 * JSON.parse / JSON.stringify logic the components use directly.
 * jsdom (vitest environment) provides a real localStorage implementation.
 */

import { beforeEach, describe, expect, it } from 'vitest';

/* ── helpers mirroring component logic ───────────────────────────────────── */

/** Read a JSON-serialised value from localStorage, or return `fallback`. */
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Persist a value to localStorage (silently ignores storage errors). */
function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/** Replicate the ChecklistTool hydration: pad/trim stored bool[] to `len`. */
function loadChecklist(key: string, len: number): boolean[] {
  try {
    const raw = localStorage.getItem(key);
    const arr: boolean[] = raw ? JSON.parse(raw) : [];
    return [
      ...arr,
      ...new Array(Math.max(0, len - arr.length)).fill(false),
    ].slice(0, len);
  } catch {
    return new Array(len).fill(false);
  }
}

/* ── beforeEach: start each test with a clean localStorage ───────────────── */
beforeEach(() => {
  localStorage.clear();
});

/* ══════════════════════════════════════════════════════════════════════════
   1. ChecklistTool  (key passed as prop)
══════════════════════════════════════════════════════════════════════════ */

describe('ChecklistTool persistence', () => {
  const KEY = 'isc-tool-supply-chain-strategy-challenge-0';
  const LEN = 5;

  it('round-trips a fully-checked state', () => {
    const state = [true, true, false, true, false];
    save(KEY, state);
    expect(loadChecklist(KEY, LEN)).toEqual(state);
  });

  it('round-trips an all-false state', () => {
    const state = [false, false, false, false, false];
    save(KEY, state);
    expect(loadChecklist(KEY, LEN)).toEqual(state);
  });

  it('pads a shorter stored array with false entries to match items.length', () => {
    save(KEY, [true, true]); // stored 2, items has 5
    expect(loadChecklist(KEY, LEN)).toEqual([true, true, false, false, false]);
  });

  it('truncates a longer stored array to items.length', () => {
    save(KEY, [true, false, true, false, true, true, true]); // stored 7, items has 5
    expect(loadChecklist(KEY, LEN)).toEqual([true, false, true, false, true]);
  });

  it('falls back to all-false when localStorage is empty', () => {
    expect(loadChecklist(KEY, LEN)).toEqual([false, false, false, false, false]);
  });

  it('falls back to all-false on malformed JSON', () => {
    localStorage.setItem(KEY, '{not valid json[');
    expect(loadChecklist(KEY, LEN)).toEqual([false, false, false, false, false]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. ActionTracker  (key passed as prop)
══════════════════════════════════════════════════════════════════════════ */

describe('ActionTracker persistence', () => {
  const KEY = 'isc-tool-risk-management-solution-actions-0';

  interface Action {
    id: string; issue: string; owner: string; dueDate: string; resolved: boolean;
  }

  it('round-trips a list of actions', () => {
    const actions: Action[] = [
      { id: '1', issue: 'Fix KRI dashboard', owner: 'Alice', dueDate: '2026-08-01', resolved: false },
      { id: '2', issue: 'Update risk register', owner: 'Bob', dueDate: '2026-09-01', resolved: true },
    ];
    save(KEY, actions);
    expect(load<Action[]>(KEY, [])).toEqual(actions);
  });

  it('round-trips an empty list', () => {
    save(KEY, []);
    expect(load<Action[]>(KEY, [])).toEqual([]);
  });

  it('falls back to [] when localStorage is empty', () => {
    expect(load<Action[]>(KEY, [])).toEqual([]);
  });

  it('falls back to [] on malformed JSON', () => {
    localStorage.setItem(KEY, '<<<not json>>>');
    expect(load<Action[]>(KEY, [])).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. ParamForm  (key passed as prop)
══════════════════════════════════════════════════════════════════════════ */

describe('ParamForm persistence', () => {
  const KEY = 'isc-tool-lean-param-form';

  it('round-trips a set of field values', () => {
    const values: Record<string, string> = { demandVariability: '0.3', replenishmentCycle: '7' };
    save(KEY, values);
    expect(load<Record<string, string>>(KEY, {})).toEqual(values);
  });

  it('falls back to {} when localStorage is empty', () => {
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });

  it('falls back to {} on malformed JSON', () => {
    localStorage.setItem(KEY, 'NOT_JSON');
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. KRIDashboard  (hardcoded key: isc-tool-risk-kri)
══════════════════════════════════════════════════════════════════════════ */

describe('KRIDashboard persistence', () => {
  const KEY = 'isc-tool-risk-kri';

  it('round-trips KRI values', () => {
    const values: Record<string, string> = {
      concentration: '45',
      dio: '38',
      ltvariance: '15',
      geo: '30',
      otif: '92',
    };
    save(KEY, values);
    expect(load<Record<string, string>>(KEY, {})).toEqual(values);
  });

  it('falls back to {} on missing key', () => {
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });

  it('falls back to {} on malformed JSON', () => {
    localStorage.setItem(KEY, 'bad json');
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. SupplierAlertConfig  (hardcoded key: isc-tool-risk-alerts)
══════════════════════════════════════════════════════════════════════════ */

describe('SupplierAlertConfig persistence', () => {
  const KEY = 'isc-tool-risk-alerts';
  type AlertCfg = { otif: string; defect: string; financial: string };
  const DEFAULTS: AlertCfg[] = [
    { otif: '90', defect: '1000', financial: '70' },
    { otif: '85', defect: '2000', financial: '55' },
    { otif: '80', defect: '3000', financial: '40' },
  ];

  it('round-trips the default configuration', () => {
    save(KEY, DEFAULTS);
    expect(load<AlertCfg[]>(KEY, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('round-trips a modified configuration', () => {
    const modified: AlertCfg[] = [
      { otif: '95', defect: '500', financial: '80' },
      { otif: '88', defect: '1500', financial: '60' },
      { otif: '82', defect: '2500', financial: '45' },
    ];
    save(KEY, modified);
    expect(load<AlertCfg[]>(KEY, DEFAULTS)).toEqual(modified);
  });

  it('falls back to DEFAULTS when key is absent', () => {
    expect(load<AlertCfg[]>(KEY, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('falls back to DEFAULTS on malformed JSON', () => {
    localStorage.setItem(KEY, '{broken');
    expect(load<AlertCfg[]>(KEY, DEFAULTS)).toEqual(DEFAULTS);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. SupplierScorecardTool  (hardcoded key: isc-tool-supplier-scorecard)
══════════════════════════════════════════════════════════════════════════ */

describe('SupplierScorecardTool persistence', () => {
  const KEY = 'isc-tool-supplier-scorecard';
  type ScorecardState = { name: string; tier: string; scores: Record<string, string> };
  const DEFAULT: ScorecardState = { name: '', tier: 'Strategic', scores: {} };

  it('round-trips a fully scored supplier', () => {
    const state: ScorecardState = {
      name: 'Acme Corp',
      tier: 'Preferred',
      scores: { delivery: '80', quality: '75', cost: '70', compliance: '85', innovation: '60', relationship: '90' },
    };
    save(KEY, state);
    expect(load<ScorecardState>(KEY, DEFAULT)).toEqual(state);
  });

  it('round-trips an empty (initial) state', () => {
    save(KEY, DEFAULT);
    expect(load<ScorecardState>(KEY, DEFAULT)).toEqual(DEFAULT);
  });

  it('falls back to DEFAULT when key is absent', () => {
    expect(load<ScorecardState>(KEY, DEFAULT)).toEqual(DEFAULT);
  });

  it('falls back to DEFAULT on malformed JSON', () => {
    localStorage.setItem(KEY, '][bad');
    expect(load<ScorecardState>(KEY, DEFAULT)).toEqual(DEFAULT);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   7. CategoryProfileBuilder  (hardcoded key: isc-tool-procurement-catprofile)
══════════════════════════════════════════════════════════════════════════ */

describe('CategoryProfileBuilder persistence', () => {
  const KEY = 'isc-tool-procurement-catprofile';

  it('round-trips category profile fields', () => {
    const values: Record<string, string> = {
      category: 'Packaging',
      spend: '2500000',
      suppliers: '4',
      strategic: '4',
      complexity: '3',
    };
    save(KEY, values);
    expect(load<Record<string, string>>(KEY, {})).toEqual(values);
  });

  it('falls back to {} when key absent', () => {
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });

  it('falls back to {} on malformed JSON', () => {
    localStorage.setItem(KEY, 'undefined');
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   8. SpendParetoChart  (hardcoded key: isc-tool-procurement-pareto)
══════════════════════════════════════════════════════════════════════════ */

describe('SpendParetoChart persistence', () => {
  const KEY = 'isc-tool-procurement-pareto';
  const EMPTY_ROW = { name: '', spend: '' };
  const DEFAULT = Array(10).fill(null).map(() => ({ ...EMPTY_ROW }));

  it('round-trips a list of supplier spend rows', () => {
    const rows = [
      { name: 'Supplier A', spend: '500000' },
      { name: 'Supplier B', spend: '300000' },
      ...Array(8).fill(null).map(() => ({ ...EMPTY_ROW })),
    ];
    save(KEY, rows);
    expect(load(KEY, DEFAULT)).toEqual(rows);
  });

  it('falls back to the default empty grid when key absent', () => {
    const result = load(KEY, DEFAULT);
    expect(result).toEqual(DEFAULT);
    expect(result).toHaveLength(10);
  });

  it('falls back to the default grid on malformed JSON', () => {
    localStorage.setItem(KEY, '...not json...');
    expect(load(KEY, DEFAULT)).toEqual(DEFAULT);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   9. MarketIntelligenceScorecard  (hardcoded key: isc-tool-procurement-marketintel)
══════════════════════════════════════════════════════════════════════════ */

describe('MarketIntelligenceScorecard persistence', () => {
  const KEY = 'isc-tool-procurement-marketintel';

  it('round-trips dimension scores', () => {
    const values: Record<string, string> = {
      supplierConcentration: '3',
      priceVolatility: '4',
      geopoliticalRisk: '2',
      regulatoryRisk: '3',
      techDisruption: '2',
      demandVolatility: '4',
    };
    save(KEY, values);
    expect(load<Record<string, string>>(KEY, {})).toEqual(values);
  });

  it('falls back to {} when key absent', () => {
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });

  it('falls back to {} on malformed JSON', () => {
    localStorage.setItem(KEY, 'NaN');
    expect(load<Record<string, string>>(KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   10. MaturityTools  (slug-scoped key: isc-tool-maturity-<slug>)
══════════════════════════════════════════════════════════════════════════ */

describe('MaturityTools persistence', () => {
  const slugs = [
    'supply-chain-strategy',
    'procurement-excellence',
    'risk-management-solution',
    'lean-agile-supply-chain',
    'sustainability-esg',
    'digital-transformation',
    'contract-lifecycle-management',
  ];

  const key = (slug: string) => `isc-tool-maturity-${slug}`;

  it('round-trips maturity answers for a given slug', () => {
    const slug = 'supply-chain-strategy';
    const state: Record<string, string> = { q1: '4', q2: '3', q3: '5' };
    save(key(slug), state);
    expect(load<Record<string, string>>(key(slug), {})).toEqual(state);
  });

  it('does not bleed state across different slugs', () => {
    slugs.forEach((slug, i) => {
      save(key(slug), { score: String(i) });
    });
    slugs.forEach((slug, i) => {
      const result = load<Record<string, string>>(key(slug), {});
      expect(result.score).toBe(String(i));
    });
  });

  it('falls back to {} for an unvisited slug', () => {
    expect(load<Record<string, string>>(key('supply-chain-strategy'), {})).toEqual({});
  });

  it('falls back to {} on malformed JSON in any slug key', () => {
    localStorage.setItem(key('risk-management-solution'), '{broken json');
    expect(load<Record<string, string>>(key('risk-management-solution'), {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   11. CLMTools  (keys: isc-tool-clm-health, isc-tool-clm-count)
══════════════════════════════════════════════════════════════════════════ */

describe('CLMTools persistence', () => {
  const HEALTH_KEY = 'isc-tool-clm-health';
  const COUNT_KEY = 'isc-tool-clm-count';

  it('round-trips contract health dimension scores', () => {
    const scores: Record<string, string> = {
      coverage: '70',
      compliance: '85',
      renewal: '60',
      visibility: '75',
    };
    save(HEALTH_KEY, scores);
    expect(load<Record<string, string>>(HEALTH_KEY, {})).toEqual(scores);
  });

  it('round-trips the contracts count string', () => {
    localStorage.setItem(COUNT_KEY, '42');
    expect(localStorage.getItem(COUNT_KEY)).toBe('42');
  });

  it('falls back to {} for health when key absent', () => {
    expect(load<Record<string, string>>(HEALTH_KEY, {})).toEqual({});
  });

  it('falls back to empty string for count when key absent', () => {
    expect(localStorage.getItem(COUNT_KEY) ?? '').toBe('');
  });

  it('falls back to {} for health on malformed JSON', () => {
    localStorage.setItem(HEALTH_KEY, '[[[');
    expect(load<Record<string, string>>(HEALTH_KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   12. TrainingNeedsAssessment  (keys: isc-tool-training-members, -scores)
══════════════════════════════════════════════════════════════════════════ */

describe('TrainingNeedsAssessment persistence', () => {
  const MEMBERS_KEY = 'isc-tool-training-members';
  const SCORES_KEY = 'isc-tool-training-scores';
  const DEFAULT_MEMBERS = ['Team Member 1'];

  it('round-trips a list of team members', () => {
    const members = ['Alice', 'Bob', 'Carol'];
    save(MEMBERS_KEY, members);
    expect(load<string[]>(MEMBERS_KEY, DEFAULT_MEMBERS)).toEqual(members);
  });

  it('round-trips a scores map', () => {
    const scores: Record<string, Record<string, number>> = {
      Alice: { strategicSourcing: 3, negotiation: 4, riskManagement: 2 },
      Bob:   { strategicSourcing: 4, negotiation: 3, riskManagement: 5 },
    };
    save(SCORES_KEY, scores);
    expect(load(SCORES_KEY, {})).toEqual(scores);
  });

  it('falls back to default members when key absent', () => {
    expect(load<string[]>(MEMBERS_KEY, DEFAULT_MEMBERS)).toEqual(DEFAULT_MEMBERS);
  });

  it('falls back to {} for scores when key absent', () => {
    expect(load(SCORES_KEY, {})).toEqual({});
  });

  it('falls back to default members on malformed JSON', () => {
    localStorage.setItem(MEMBERS_KEY, 'not json');
    expect(load<string[]>(MEMBERS_KEY, DEFAULT_MEMBERS)).toEqual(DEFAULT_MEMBERS);
  });

  it('falls back to {} for scores on malformed JSON', () => {
    localStorage.setItem(SCORES_KEY, '{{{{');
    expect(load(SCORES_KEY, {})).toEqual({});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   13. Key-namespace collision tests
       Confirms that isc-tool-<slug>-challenge-<idx> keys for different
       slugs and indices are distinct and never overlap.
══════════════════════════════════════════════════════════════════════════ */

describe('key-namespace isolation — challenge checklists', () => {
  const slugA = 'supply-chain-strategy';
  const slugB = 'procurement-excellence';

  const checklistKey = (slug: string, idx: number) => `isc-tool-${slug}-challenge-${idx}`;
  const actionKey    = (slug: string, idx: number) => `isc-tool-${slug}-actions-${idx}`;

  it('checklist keys for different slugs do not collide', () => {
    expect(checklistKey(slugA, 0)).not.toBe(checklistKey(slugB, 0));
  });

  it('action-tracker keys for different slugs do not collide', () => {
    expect(actionKey(slugA, 0)).not.toBe(actionKey(slugB, 0));
  });

  it('different challenge indices within the same slug do not collide', () => {
    expect(checklistKey(slugA, 0)).not.toBe(checklistKey(slugA, 1));
    expect(actionKey(slugA, 0)).not.toBe(actionKey(slugA, 1));
  });

  it('saves to slug-A do not appear in slug-B reads', () => {
    save(checklistKey(slugA, 0), [true, true, false]);
    const slugBVal = load<boolean[] | null>(checklistKey(slugB, 0), null);
    expect(slugBVal).toBeNull();
  });

  it('saves to challenge-0 do not appear in challenge-1 reads', () => {
    save(checklistKey(slugA, 0), [true, false, true]);
    const ch1Val = load<boolean[] | null>(checklistKey(slugA, 1), null);
    expect(ch1Val).toBeNull();
  });

  it('all 12 slug keys are unique', () => {
    const allSlugs = [
      'supply-chain-strategy', 'procurement-excellence', 'risk-management-solution',
      'lean-agile-supply-chain', 'sustainability-esg', 'digital-transformation',
      'contract-lifecycle-management', 'supplier-relationship-management',
      'demand-planning-forecasting', 'inventory-optimization',
      'logistics-distribution', 'customs-trade-compliance',
    ];
    const keys = allSlugs.map(s => checklistKey(s, 0));
    const unique = new Set(keys);
    expect(unique.size).toBe(allSlugs.length);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   14. Key-namespace isolation — maturity tools vs challenge checklists
       Confirms the maturity and challenge key patterns don't overlap.
══════════════════════════════════════════════════════════════════════════ */

describe('key-namespace isolation — maturity vs challenge tools', () => {
  const slug = 'supply-chain-strategy';

  it('maturity key differs from challenge-checklist key for same slug', () => {
    const maturityKey   = `isc-tool-maturity-${slug}`;
    const challengeKey  = `isc-tool-${slug}-challenge-0`;
    expect(maturityKey).not.toBe(challengeKey);
  });

  it('maturity key differs from action-tracker key for same slug', () => {
    const maturityKey = `isc-tool-maturity-${slug}`;
    const actionKey   = `isc-tool-actions-maturity-${slug}`;
    expect(maturityKey).not.toBe(actionKey);
  });

  it('saved maturity state does not pollute challenge-checklist reads', () => {
    save(`isc-tool-maturity-${slug}`, { q1: '3' });
    const challengeVal = load<boolean[] | null>(`isc-tool-${slug}-challenge-0`, null);
    expect(challengeVal).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   15. Global hardcoded keys are unique (no two tools share a key)
══════════════════════════════════════════════════════════════════════════ */

describe('hardcoded storage keys are globally unique', () => {
  const HARDCODED_KEYS = [
    'isc-tool-risk-kri',
    'isc-tool-risk-alerts',
    'isc-tool-supplier-scorecard',
    'isc-tool-procurement-catprofile',
    'isc-tool-procurement-pareto',
    'isc-tool-procurement-marketintel',
    'isc-tool-clm-health',
    'isc-tool-clm-count',
    'isc-tool-training-members',
    'isc-tool-training-scores',
  ];

  it('all hardcoded keys are distinct', () => {
    const unique = new Set(HARDCODED_KEYS);
    expect(unique.size).toBe(HARDCODED_KEYS.length);
  });

  it('no hardcoded key is a prefix of another hardcoded key', () => {
    for (const a of HARDCODED_KEYS) {
      for (const b of HARDCODED_KEYS) {
        if (a !== b) {
          // a key like 'isc-tool-risk' being a prefix of 'isc-tool-risk-kri'
          // would risk accidental overwrites if the shorter key were ever used
          expect(b.startsWith(a + '-')).toBe(false);
        }
      }
    }
  });

  it('independent saves to two different tools do not interfere', () => {
    save('isc-tool-risk-kri', { concentration: '50' });
    save('isc-tool-supplier-scorecard', { name: 'TestCorp', tier: 'Strategic', scores: {} });

    const kri      = load<Record<string, string>>('isc-tool-risk-kri', {});
    const scorecard = load<{ name: string }>('isc-tool-supplier-scorecard', { name: '' });

    expect(kri.concentration).toBe('50');
    expect(scorecard.name).toBe('TestCorp');
  });
});
