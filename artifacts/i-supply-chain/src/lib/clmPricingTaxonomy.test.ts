import { describe, it, expect } from 'vitest';
import { checkPricingMisuseFlag, pricingTypeLabel, PRICING_TYPES } from './clmPricingTaxonomy';

describe('PRICING_TYPES', () => {
  it('has 11 types including the 3 primary and 7 extended plus other', () => {
    const ids = PRICING_TYPES.map(t => t.id);
    expect(ids).toEqual(['ffp', 'cost-plus', 'tm', 'unit-price', 'fp-epa', 'cpff', 'cpif', 'cpaf', 'gmp', 'target-cost-gainshare', 'other']);
  });

  it('pricingTypeLabel returns the right language', () => {
    expect(pricingTypeLabel('ffp', false)).toBe('Firm Fixed-Price (FFP)');
    expect(pricingTypeLabel('ffp', true)).toContain('الثابت');
    expect(pricingTypeLabel(undefined, false)).toBe('');
  });
});

describe('checkPricingMisuseFlag', () => {
  it('does not flag when pricingPrimary is unset or other', () => {
    expect(checkPricingMisuseFlag(undefined, 'uncertain', undefined, undefined, undefined).flagged).toBe(false);
    expect(checkPricingMisuseFlag('other', 'uncertain', undefined, undefined, undefined).flagged).toBe(false);
  });

  it('flags FFP on evolving or uncertain self-declared scope', () => {
    expect(checkPricingMisuseFlag('ffp', 'evolving', undefined, undefined, undefined).flagged).toBe(true);
    const r = checkPricingMisuseFlag('ffp', 'uncertain', undefined, undefined, undefined);
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Firm Fixed-Price');
    expect(r.reasonAr.length).toBeGreaterThan(0);
  });

  it('does not flag FFP on well-defined or unset scope', () => {
    expect(checkPricingMisuseFlag('ffp', 'well-defined', undefined, undefined, undefined).flagged).toBe(false);
    expect(checkPricingMisuseFlag('ffp', undefined, undefined, undefined, undefined).flagged).toBe(false);
  });

  it('flags Cost-Plus on well-defined self-declared scope', () => {
    const r = checkPricingMisuseFlag('cost-plus', 'well-defined', undefined, undefined, undefined);
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Cost-Reimbursable');
  });

  it('does not flag Cost-Plus on evolving/uncertain/unset scope', () => {
    expect(checkPricingMisuseFlag('cost-plus', 'evolving', undefined, undefined, undefined).flagged).toBe(false);
    expect(checkPricingMisuseFlag('cost-plus', undefined, undefined, undefined, undefined).flagged).toBe(false);
  });

  it('flags T&M with no cap/milestones on an engagement longer than a year', () => {
    const r = checkPricingMisuseFlag('tm', undefined, false, '2024-01-01', '2026-06-01');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Time & Materials');
  });

  it('does not flag T&M with a cap, or short duration, or missing dates', () => {
    expect(checkPricingMisuseFlag('tm', undefined, true, '2024-01-01', '2026-06-01').flagged).toBe(false);
    expect(checkPricingMisuseFlag('tm', undefined, false, '2024-01-01', '2024-06-01').flagged).toBe(false);
    expect(checkPricingMisuseFlag('tm', undefined, false, undefined, undefined).flagged).toBe(false);
    expect(checkPricingMisuseFlag('tm', undefined, undefined, '2024-01-01', '2026-06-01').flagged).toBe(false);
  });

  it('does not flag unit-price or other extended types (no rule defined)', () => {
    expect(checkPricingMisuseFlag('unit-price', 'uncertain', false, '2024-01-01', '2026-06-01').flagged).toBe(false);
    expect(checkPricingMisuseFlag('gmp', 'well-defined', false, '2024-01-01', '2026-06-01').flagged).toBe(false);
  });
});
