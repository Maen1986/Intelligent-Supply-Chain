import { describe, it, expect } from 'vitest';
import {
  ILLUSTRATIVE_BANNER_EN,
  ILLUSTRATIVE_BANNER_AR,
  ILLUSTRATIVE_ORGANIZATION,
  ILLUSTRATIVE_SUPPLIERS,
} from './supplierIntelligenceCaseStudy';

describe('supplierIntelligenceCaseStudy', () => {
  it('has a non-empty, clearly-labeled illustrative banner in both languages', () => {
    expect(ILLUSTRATIVE_BANNER_EN.toLowerCase()).toContain('illustrative');
    expect(ILLUSTRATIVE_BANNER_EN.toLowerCase()).toContain('fictional');
    expect(ILLUSTRATIVE_BANNER_AR).toContain('مثال توضيحي');
    expect(ILLUSTRATIVE_BANNER_AR).toContain('افتراضية');
  });

  it('defines the illustrative organization with both EN and AR fields populated', () => {
    expect(ILLUSTRATIVE_ORGANIZATION.name).toBe('Rawabi Advanced Industries');
    expect(ILLUSTRATIVE_ORGANIZATION.nameAr).toBeTruthy();
    expect(ILLUSTRATIVE_ORGANIZATION.industryAr).toBeTruthy();
    expect(ILLUSTRATIVE_ORGANIZATION.employeeCount).toBeGreaterThan(0);
  });

  it('has exactly 16 suppliers as specified in SI-00-Charter.md', () => {
    expect(ILLUSTRATIVE_SUPPLIERS).toHaveLength(16);
  });

  it('has unique supplier ids', () => {
    const ids = ILLUSTRATIVE_SUPPLIERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every supplier has both English and Arabic name/category fields populated', () => {
    for (const s of ILLUSTRATIVE_SUPPLIERS) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.nameAr.length).toBeGreaterThan(0);
      expect(s.category.length).toBeGreaterThan(0);
      expect(s.categoryAr.length).toBeGreaterThan(0);
      expect(s.country.length).toBeGreaterThan(0);
      expect(s.countryAr.length).toBeGreaterThan(0);
    }
  });

  it('covers all four Kraljic quadrants', () => {
    const quadrants = new Set(ILLUSTRATIVE_SUPPLIERS.map((s) => s.kraljicQuadrant));
    expect(quadrants).toEqual(new Set(['Strategic', 'Leverage', 'Bottleneck', 'Non-critical']));
  });

  it('flags exactly 4 suppliers in the Jebel Ali common-mode dependency cluster', () => {
    const cluster = ILLUSTRATIVE_SUPPLIERS.filter((s) => s.sharedDependencyCluster === 'jebel-ali-freight-route');
    expect(cluster).toHaveLength(4);
    // Module 05's finding depends on these NOT all being the same country --
    // a same-country cluster would be a trivial, uninteresting finding.
    const countries = new Set(cluster.map((s) => s.country));
    expect(countries.size).toBeGreaterThanOrEqual(3);
  });

  it('has exactly one entity-resolution pair (Module 03 example)', () => {
    const resolved = ILLUSTRATIVE_SUPPLIERS.filter((s) => s.resolvedParentOf);
    expect(resolved).toHaveLength(1);
    const targetId = resolved[0]!.resolvedParentOf;
    expect(ILLUSTRATIVE_SUPPLIERS.some((s) => s.id === targetId)).toBe(true);
  });

  it('has exactly one sub-tier relationship (Module 07 full-cycle example)', () => {
    const subTier = ILLUSTRATIVE_SUPPLIERS.filter((s) => s.isSubTierOf);
    expect(subTier).toHaveLength(1);
    const parentId = subTier[0]!.isSubTierOf;
    expect(ILLUSTRATIVE_SUPPLIERS.some((s) => s.id === parentId)).toBe(true);
  });

  it('includes at least one trader (not manufacturer) to exercise the role distinction', () => {
    expect(ILLUSTRATIVE_SUPPLIERS.some((s) => s.role === 'trader')).toBe(true);
  });

  it('includes at least one UNVERIFIED-confidence supplier, since a too-clean demo undersells the engine', () => {
    expect(ILLUSTRATIVE_SUPPLIERS.some((s) => s.evidenceConfidence === 'UNVERIFIED')).toBe(true);
  });

  it('gives Precision Motors Co. a 3-quarter declining performanceHistory matching its narrative (94 -> 89 -> 83)', () => {
    const pm = ILLUSTRATIVE_SUPPLIERS.find((s) => s.id === 'precision-motors-co');
    expect(pm?.performanceHistory).toBeDefined();
    expect(pm!.performanceHistory).toHaveLength(3);
    expect(pm!.performanceHistory!.map((p) => p.level)).toEqual([94, 89, 83]);
    expect(pm!.performanceHistory!.every((p) => p.scorecardDimension === 'delivery')).toBe(true);
    expect(pm!.linkedCarId).toBeTruthy();
  });

  it('is the only supplier with performanceHistory, keeping the full-cycle example singular and traceable', () => {
    const withHistory = ILLUSTRATIVE_SUPPLIERS.filter((s) => s.performanceHistory);
    expect(withHistory).toHaveLength(1);
    expect(withHistory[0]!.id).toBe('precision-motors-co');
  });
});
