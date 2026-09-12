/**
 * supplierGovernanceTierRecommendation.test.ts
 *
 * Standalone stress-test suite for the governance-tier-recommendation module,
 * run BEFORE this module is wired into Item 4's onboarding page, per the
 * platform owner's explicit "treat it as step zero" instruction.
 *
 * Covers: missing Kraljic data, missing industry, conflicting signals,
 * malformed/differently-cased input, and override-persists-against-a-later-
 * recommendation-change.
 */
import { describe, it, expect } from 'vitest';
import {
  computeRecommendedGovernanceTier,
  resolveEffectiveGovernanceTier,
  normalizeKraljicQuadrant,
  normalizeIndustryKey,
  type GovernanceTierOverrideLike,
} from './supplierGovernanceTierRecommendation';

describe('computeRecommendedGovernanceTier -- missing-data defaults (never guess toward Operational)', () => {
  it('defaults to Advisory when both Kraljic quadrant and industry are missing', () => {
    const result = computeRecommendedGovernanceTier({});
    expect(result.recommendedTier).toBe('advisory');
    expect(result.preSelectTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('neither-present');
    expect(result.kraljicSignal).toBe('missing');
    expect(result.industrySignal).toBe('missing');
    expect(result.rationaleAr).toMatch(/الطبقة الاستشارية/);
  });

  it('defaults to Advisory when only Kraljic quadrant is present (industry missing) -- even for a Strategic supplier', () => {
    const result = computeRecommendedGovernanceTier({ kraljicQuadrant: 'strategic' });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('kraljic-only');
    expect(result.industrySignal).toBe('missing');
  });

  it('defaults to Advisory when only declared industry is present (Kraljic missing) -- even for a regulated industry', () => {
    const result = computeRecommendedGovernanceTier({ declaredIndustry: 'government' });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('industry-only');
    expect(result.kraljicSignal).toBe('missing');
  });

  it('defaults to Advisory when Kraljic quadrant is present but malformed/unrecognized', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'super-strategic-plus',
      declaredIndustry: 'government',
    });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('industry-only');
  });

  it('defaults to Advisory when declared industry is present but malformed/unrecognized', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'strategic',
      declaredIndustry: 'crypto-nfts',
    });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('kraljic-only');
  });

  it('treats empty-string inputs the same as missing (soft/messy-input tolerance)', () => {
    const result = computeRecommendedGovernanceTier({ kraljicQuadrant: '', declaredIndustry: '   ' });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.dataCompleteness).toBe('neither-present');
  });

  it('treats null inputs the same as missing', () => {
    const result = computeRecommendedGovernanceTier({ kraljicQuadrant: null, declaredIndustry: null });
    expect(result.recommendedTier).toBe('advisory');
  });
});

describe('computeRecommendedGovernanceTier -- both signals present, real combinations', () => {
  it('recommends Operational for Strategic quadrant + regulated industry (both signals agree)', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'strategic',
      declaredIndustry: 'healthcare-pharma',
    });
    expect(result.recommendedTier).toBe('operational');
    expect(result.kraljicSignal).toBe('high-touch');
    expect(result.industrySignal).toBe('regulated');
    expect(result.rationaleEn).toMatch(/because/i);
  });

  it('recommends Advisory for Leverage quadrant + non-regulated industry (both signals agree)', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'leverage',
      declaredIndustry: 'retail-fmcg',
    });
    expect(result.recommendedTier).toBe('advisory');
    expect(result.kraljicSignal).toBe('low-touch');
    expect(result.industrySignal).toBe('not-regulated');
  });

  it('CONFLICTING SIGNALS: Strategic quadrant + unregulated industry -- recommends Operational (supply risk alone is enough)', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'strategic',
      declaredIndustry: 'retail-fmcg',
    });
    expect(result.recommendedTier).toBe('operational');
    expect(result.kraljicSignal).toBe('high-touch');
    expect(result.industrySignal).toBe('not-regulated');
    expect(result.rationaleEn).toMatch(/strategic supplier/i);
  });

  it('CONFLICTING SIGNALS: Non-critical/routine quadrant + regulated industry -- recommends Operational (regulatory exposure alone is enough)', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'non-critical',
      declaredIndustry: 'government',
    });
    expect(result.recommendedTier).toBe('operational');
    expect(result.kraljicSignal).toBe('low-touch');
    expect(result.industrySignal).toBe('regulated');
    expect(result.rationaleEn).toMatch(/government is a regulated-industry client/i);
  });

  it('recommends Operational for Bottleneck quadrant regardless of industry', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'bottleneck',
      declaredIndustry: 'logistics',
    });
    expect(result.recommendedTier).toBe('operational');
  });

  it('boundary: covers all 4 quadrants x both regulated/non-regulated combinations without throwing', () => {
    const quadrants = ['strategic', 'leverage', 'bottleneck', 'non-critical'] as const;
    const industries = ['healthcare-pharma', 'retail-fmcg'] as const;
    for (const q of quadrants) {
      for (const ind of industries) {
        const result = computeRecommendedGovernanceTier({ kraljicQuadrant: q, declaredIndustry: ind });
        expect(['advisory', 'operational']).toContain(result.recommendedTier);
        expect(result.dataCompleteness).toBe('both-present');
      }
    }
  });

  it('bilingual: every recommendation carries a non-empty Arabic rationale distinct from the English one', () => {
    const result = computeRecommendedGovernanceTier({
      kraljicQuadrant: 'strategic',
      declaredIndustry: 'oil-gas',
    });
    expect(result.rationaleAr.length).toBeGreaterThan(10);
    expect(result.rationaleAr).not.toBe(result.rationaleEn);
    expect(result.industryClassificationNoteAr.length).toBeGreaterThan(10);
  });
});

describe('normalizeKraljicQuadrant / normalizeIndustryKey -- defensive parsing (hardest tier)', () => {
  it('normalizes differently-cased Kraljic values (mirrors supplierIntelligenceCaseStudy.ts inconsistency)', () => {
    expect(normalizeKraljicQuadrant('Strategic')).toBe('strategic');
    expect(normalizeKraljicQuadrant('BOTTLENECK')).toBe('bottleneck');
    expect(normalizeKraljicQuadrant('Non-critical')).toBe('non-critical');
  });

  it('rejects non-string, object-shaped, and array-shaped adversarial input without throwing', () => {
    // @ts-expect-error -- deliberately adversarial non-string input
    expect(normalizeKraljicQuadrant({ quadrant: 'strategic' })).toBeNull();
    // @ts-expect-error -- deliberately adversarial non-string input
    expect(normalizeKraljicQuadrant(['strategic'])).toBeNull();
    // @ts-expect-error -- deliberately adversarial non-string input
    expect(normalizeIndustryKey(12345)).toBeNull();
  });

  it('trims incidental whitespace', () => {
    expect(normalizeKraljicQuadrant('  strategic  ')).toBe('strategic');
    expect(normalizeIndustryKey('  government  ')).toBe('government');
  });
});

describe('resolveEffectiveGovernanceTier -- override persists against a later recommendation change', () => {
  it('returns the recommendation when no override is present', () => {
    const rec = computeRecommendedGovernanceTier({ kraljicQuadrant: 'leverage', declaredIndustry: 'retail-fmcg' });
    const effective = resolveEffectiveGovernanceTier(rec, null);
    expect(effective.tier).toBe('advisory');
    expect(effective.source).toBe('recommendation');
  });

  it('an override to Operational wins even though the recommendation says Advisory', () => {
    const rec = computeRecommendedGovernanceTier({ kraljicQuadrant: 'leverage', declaredIndustry: 'retail-fmcg' });
    const override: GovernanceTierOverrideLike = { tier: 'operational', overriddenAt: '2026-09-01T00:00:00Z' };
    const effective = resolveEffectiveGovernanceTier(rec, override);
    expect(effective.tier).toBe('operational');
    expect(effective.source).toBe('client-override');
  });

  it('CORE STRESS CASE: override set to Advisory persists even after Kraljic re-scoring flips the recommendation to Operational', () => {
    // Step 1: supplier initially scored Leverage + retail-fmcg -> recommendation is Advisory.
    const recBefore = computeRecommendedGovernanceTier({ kraljicQuadrant: 'leverage', declaredIndustry: 'retail-fmcg' });
    expect(recBefore.recommendedTier).toBe('advisory');

    // Step 2: client explicitly overrides to Operational anyway (their own risk appetite).
    const override: GovernanceTierOverrideLike = { tier: 'operational', overriddenAt: '2026-09-01T00:00:00Z', overriddenBy: 'srm-lead@rawabi.example' };
    const effectiveBefore = resolveEffectiveGovernanceTier(recBefore, override);
    expect(effectiveBefore.tier).toBe('operational');

    // Step 3: supplier is later re-scored as Strategic (Module 02 update) -- recommendation
    // recomputes to Operational too, but the point of this test is that the override must
    // keep winning regardless of which way the recommendation moves.
    const recAfter = computeRecommendedGovernanceTier({ kraljicQuadrant: 'strategic', declaredIndustry: 'retail-fmcg' });
    const effectiveAfter = resolveEffectiveGovernanceTier(recAfter, override);
    expect(effectiveAfter.tier).toBe('operational');
    expect(effectiveAfter.source).toBe('client-override');
    expect(effectiveAfter.recommendation.recommendedTier).toBe('operational');
  });

  it('CORE STRESS CASE (opposite direction): override to Advisory persists even after the recommendation flips to Operational', () => {
    const recBefore = computeRecommendedGovernanceTier({ kraljicQuadrant: 'strategic', declaredIndustry: 'healthcare-pharma' });
    expect(recBefore.recommendedTier).toBe('operational');

    const override: GovernanceTierOverrideLike = { tier: 'advisory', overriddenAt: '2026-09-05T00:00:00Z' };
    const effective = resolveEffectiveGovernanceTier(recBefore, override);
    expect(effective.tier).toBe('advisory');
    expect(effective.source).toBe('client-override');

    // Recommendation inputs unchanged, still Operational -- override still overrides.
    const recAfter = computeRecommendedGovernanceTier({ kraljicQuadrant: 'strategic', declaredIndustry: 'healthcare-pharma' });
    const effectiveAfter = resolveEffectiveGovernanceTier(recAfter, override);
    expect(effectiveAfter.tier).toBe('advisory');
    expect(effectiveAfter.source).toBe('client-override');
  });

  it('boundary: an override object with no overriddenBy (optional field) still resolves correctly', () => {
    const rec = computeRecommendedGovernanceTier({ kraljicQuadrant: 'bottleneck', declaredIndustry: 'logistics' });
    const override: GovernanceTierOverrideLike = { tier: 'advisory', overriddenAt: '2026-09-01T00:00:00Z' };
    const effective = resolveEffectiveGovernanceTier(rec, override);
    expect(effective.tier).toBe('advisory');
    expect(effective.override).toEqual(override);
  });
});
