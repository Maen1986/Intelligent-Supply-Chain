/**
 * KPIDashboard slug coverage test.
 *
 * Every slug used in SolutionDetail must resolve to a dedicated KPI framework
 * so no page silently falls back to the wrong framework.
 */
import { describe, it, expect } from 'vitest';
import { KPI_FRAMEWORKS, SLUG_ALIAS } from './KPIDashboard';

/** All slugs that SolutionDetail.tsx currently uses — keep in sync with the SOLUTIONS array */
const SOLUTION_DETAIL_SLUGS = [
  'supply-chain-strategy',
  'procurement-excellence',
  'risk-management-solution',
  'lean-agile-supply-chain',
  'sustainability-esg',
  'digital-transformation',
  'contract-lifecycle-management',
  'supplier-relationship-governance',
  'resiliency',
  'value-engineering',
  'process-improvement-policy',
  'training-capability-building',
] as const;

/** Slugs used by the three standalone pages */
const STANDALONE_PAGE_SLUGS = [
  'lean-six-sigma',
  'risk-management',
  'governance-compliance',
] as const;

const ALL_SLUGS = [...SOLUTION_DETAIL_SLUGS, ...STANDALONE_PAGE_SLUGS];

describe('KPIDashboard slug coverage', () => {
  it.each(ALL_SLUGS)(
    'slug "%s" resolves to a non-empty KPI framework',
    (slug) => {
      const resolved = SLUG_ALIAS[slug] ?? slug;
      const framework = KPI_FRAMEWORKS[resolved];

      expect(
        framework,
        `Slug "${slug}" resolves to "${resolved}" but KPI_FRAMEWORKS["${resolved}"] is undefined. ` +
          `Add it to KPI_FRAMEWORKS or map it in SLUG_ALIAS.`,
      ).toBeDefined();

      expect(framework.length, `KPI_FRAMEWORKS["${resolved}"] must have at least 1 KPI`).toBeGreaterThan(0);
    },
  );

  it('every SLUG_ALIAS target exists in KPI_FRAMEWORKS', () => {
    for (const [alias, target] of Object.entries(SLUG_ALIAS)) {
      expect(
        KPI_FRAMEWORKS[target],
        `SLUG_ALIAS maps "${alias}" → "${target}" but KPI_FRAMEWORKS["${target}"] is undefined`,
      ).toBeDefined();
    }
  });
});
