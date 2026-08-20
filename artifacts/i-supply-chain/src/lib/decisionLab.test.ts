import { describe, it, expect } from 'vitest';
import {
  newCriterion, newOption, scoreOptions, isScenarioScoreable, buildDecisionPrompt,
  type DecisionScenario,
} from './decisionLab';

function scenario(overrides: Partial<DecisionScenario> = {}): DecisionScenario {
  return {
    question: 'Which supplier?',
    criteria: [],
    options: [],
    ...overrides,
  };
}

describe('scoreOptions', () => {
  it('computes a correct weighted average and ranks descending', () => {
    const cost = newCriterion('Cost');
    cost.id = 'cost'; cost.weight = 10;
    const quality = newCriterion('Quality');
    quality.id = 'quality'; quality.weight = 5;

    const a = newOption('Supplier A');
    a.id = 'a'; a.scores = { cost: 5, quality: 3 }; // (5*10 + 3*5) / 15 = 65/15 = 4.33
    const b = newOption('Supplier B');
    b.id = 'b'; b.scores = { cost: 2, quality: 5 }; // (2*10 + 5*5) / 15 = 45/15 = 3.00

    const result = scoreOptions(scenario({ criteria: [cost, quality], options: [a, b] }));

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('a');
    expect(result[0].weightedScore).toBeCloseTo(4.33, 1);
    expect(result[0].rank).toBe(1);
    expect(result[1].id).toBe('b');
    expect(result[1].weightedScore).toBeCloseTo(3.0, 1);
    expect(result[1].rank).toBe(2);
  });

  it('excludes criteria with zero weight from scoring', () => {
    const active = newCriterion('Active');
    active.id = 'active'; active.weight = 5;
    const ignored = newCriterion('Ignored');
    ignored.id = 'ignored'; ignored.weight = 0;

    const opt = newOption('Option X');
    opt.id = 'x'; opt.scores = { active: 4, ignored: 1 };

    const result = scoreOptions(scenario({ criteria: [active, ignored], options: [opt] }));
    expect(result[0].weightedScore).toBe(4); // ignored criterion contributes nothing
    expect(result[0].breakdown).toHaveLength(1);
  });

  it('treats a missing score entry as 0, not as skipped', () => {
    const c = newCriterion('C'); c.id = 'c'; c.weight = 10;
    const opt = newOption('Y'); opt.id = 'y'; opt.scores = {}; // no rating entered

    const result = scoreOptions(scenario({ criteria: [c], options: [opt] }));
    expect(result[0].weightedScore).toBe(0);
  });

  it('filters out unnamed options and criteria', () => {
    const named = newCriterion('Named'); named.weight = 5;
    const blank = newCriterion(''); blank.weight = 8;

    const namedOpt = newOption('Real Option');
    const blankOpt = newOption('');

    const result = scoreOptions(scenario({ criteria: [named, blank], options: [namedOpt, blankOpt] }));
    expect(result).toHaveLength(1);
    expect(result[0].breakdown).toHaveLength(1);
  });

  it('returns an empty array for an empty scenario', () => {
    expect(scoreOptions(scenario())).toEqual([]);
  });
});

describe('isScenarioScoreable', () => {
  it('requires at least 2 named options and 1 active criterion', () => {
    const c = newCriterion('C'); c.weight = 5;
    const a = newOption('A');
    const b = newOption('B');

    expect(isScenarioScoreable(scenario({ criteria: [c], options: [a, b] }))).toBe(true);
    expect(isScenarioScoreable(scenario({ criteria: [c], options: [a] }))).toBe(false);
    expect(isScenarioScoreable(scenario({ criteria: [], options: [a, b] }))).toBe(false);

    const zeroWeight = newCriterion('Z'); zeroWeight.weight = 0;
    expect(isScenarioScoreable(scenario({ criteria: [zeroWeight], options: [a, b] }))).toBe(false);
  });
});

describe('buildDecisionPrompt', () => {
  it('includes the question, criteria, and ranked options in English', () => {
    const c = newCriterion('Cost'); c.id = 'cost'; c.weight = 8;
    const a = newOption('Vendor A'); a.id = 'a'; a.scores = { cost: 4 };
    const scored = scoreOptions(scenario({ question: 'Pick a vendor', criteria: [c], options: [a] }));

    const prompt = buildDecisionPrompt(scenario({ question: 'Pick a vendor', criteria: [c], options: [a] }), scored, false);
    expect(prompt).toContain('Pick a vendor');
    expect(prompt).toContain('Cost');
    expect(prompt).toContain('Vendor A');
  });

  it('renders Arabic headers when isAr is true', () => {
    const c = newCriterion('Cost'); c.id = 'cost'; c.weight = 8;
    const a = newOption('Vendor A'); a.id = 'a'; a.scores = { cost: 4 };
    const scn = scenario({ question: 'Pick a vendor', criteria: [c], options: [a] });
    const scored = scoreOptions(scn);

    const prompt = buildDecisionPrompt(scn, scored, true);
    expect(prompt).toContain('مختبر القرار');
  });
});
