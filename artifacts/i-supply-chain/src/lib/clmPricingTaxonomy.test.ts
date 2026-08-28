import { describe, it, expect } from 'vitest';
import { checkPricingMisuseFlag, checkIndustryPricingPatternFlag, pricingTypeLabel, PRICING_TYPES, TYPICAL_PRICING_BY_BUCKET } from './clmPricingTaxonomy';

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

describe('checkIndustryPricingPatternFlag (Part E, rule 2: industry bucket -> typical pricing type)', () => {
  it('not flagged when either field is unset', () => {
    expect(checkIndustryPricingPatternFlag(undefined, 'ffp').flagged).toBe(false);
    expect(checkIndustryPricingPatternFlag('construction', undefined).flagged).toBe(false);
  });
  it('not flagged when pricingPrimary is "other"', () => {
    expect(checkIndustryPricingPatternFlag('construction', 'other').flagged).toBe(false);
  });
  it('not flagged when the bucket has no documented typical set', () => {
    expect(checkIndustryPricingPatternFlag('not-a-real-bucket', 'ffp').flagged).toBe(false);
  });
  it('not flagged when pricingPrimary matches the bucket\'s typical set', () => {
    expect(checkIndustryPricingPatternFlag('supply-goods', 'ffp').flagged).toBe(false);
    expect(checkIndustryPricingPatternFlag('construction', 'gmp').flagged).toBe(false);
    expect(checkIndustryPricingPatternFlag('om', 'cpff').flagged).toBe(false);
    expect(checkIndustryPricingPatternFlag('professional-services', 'tm').flagged).toBe(false);
    expect(checkIndustryPricingPatternFlag('logistics', 'unit-price').flagged).toBe(false);
  });
  it('flagged when pricingPrimary is outside the typical set, names the typical alternatives, and is framed as informational', () => {
    const r = checkIndustryPricingPatternFlag('supply-goods', 'cost-plus');
    expect(r.flagged).toBe(true);
    expect(r.reasonEn).toContain('Firm Fixed-Price');
    expect(r.reasonEn).toContain('Not an error');
  });
  it('TYPICAL_PRICING_BY_BUCKET has an entry for all 5 industry buckets', () => {
    expect(Object.keys(TYPICAL_PRICING_BY_BUCKET).sort()).toEqual(
      ['construction', 'logistics', 'om', 'professional-services', 'supply-goods']);
  });
});
