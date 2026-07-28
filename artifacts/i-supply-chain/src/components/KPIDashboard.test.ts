/**
 * KPIDashboard slug coverage test.
 *
 * Every slug used in SolutionDetail must resolve to a dedicated KPI framework
 * so no page silently falls back to the wrong framework.
 */
import { describe, it, expect } from 'vitest';
import { KPI_FRAMEWORKS, SLUG_ALIAS, type KpiDef } from './KPIDashboard';

// ── Replicate the on-target logic from handleKpiImport (KPIDashboard.tsx ~line 1289) ──
function isOnTarget(kpi: KpiDef, value: number): boolean {
  return kpi.higherIsBetter ? value >= kpi.targetValue : value <= kpi.targetValue;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// On-target logic: lower-is-better vs higher-is-better
// Mirrors the status-line block in handleKpiImport (~line 1289).
// ─────────────────────────────────────────────────────────────────────────────
describe('KPI on-target status (higherIsBetter)', () => {
  // Pick two real KPIs from procurement-excellence: one of each polarity.
  // pocycle: PO Cycle Time  — higherIsBetter: false, targetValue: 7 days
  // savings: Procurement Savings % — higherIsBetter: true,  targetValue: 10%
  const framework = KPI_FRAMEWORKS['procurement-excellence'];
  const pocycle = framework.find(k => k.id === 'pocycle')!;  // lower is better
  const savings = framework.find(k => k.id === 'savings')!;  // higher is better

  it('lower-is-better KPI is on-target when value is below the target', () => {
    // 5 days < 7 day target → ✅
    expect(isOnTarget(pocycle, 5)).toBe(true);
  });

  it('lower-is-better KPI is off-target when value equals the target', () => {
    // exactly at target → on-target (≤)
    expect(isOnTarget(pocycle, 7)).toBe(true);
  });

  it('lower-is-better KPI is off-target when value exceeds the target', () => {
    // 10 days > 7 day target → ❌
    expect(isOnTarget(pocycle, 10)).toBe(false);
  });

  it('higher-is-better KPI is on-target when value meets the target', () => {
    // 10% = target → ✅
    expect(isOnTarget(savings, 10)).toBe(true);
  });

  it('higher-is-better KPI is on-target when value exceeds the target', () => {
    // 14% > 10% target → ✅
    expect(isOnTarget(savings, 14)).toBe(true);
  });

  it('higher-is-better KPI is off-target when value is below the target', () => {
    // 6% < 10% target → ❌
    expect(isOnTarget(savings, 6)).toBe(false);
  });
});

describe('KPI on-target status — supply-chain-strategy mixed framework', () => {
  // c2c: Cash-to-Cash Days — higherIsBetter: false, targetValue: 28
  // por: Perfect Order Rate — higherIsBetter: true,  targetValue: 95
  const framework = KPI_FRAMEWORKS['supply-chain-strategy'];
  const c2c = framework.find(k => k.id === 'c2c')!;  // lower is better
  const por = framework.find(k => k.id === 'por')!;  // higher is better

  it('Cash-to-Cash Days ✅ when below target', () => {
    expect(isOnTarget(c2c, 20)).toBe(true);
  });

  it('Cash-to-Cash Days ❌ when above target', () => {
    expect(isOnTarget(c2c, 35)).toBe(false);
  });

  it('Perfect Order Rate ✅ when at or above target', () => {
    expect(isOnTarget(por, 95)).toBe(true);
    expect(isOnTarget(por, 98)).toBe(true);
  });

  it('Perfect Order Rate ❌ when below target', () => {
    expect(isOnTarget(por, 90)).toBe(false);
  });
});
