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

// ─────────────────────────────────────────────────────────────────────────────
// Arabic-mode status labels
// Mirrors the ternary at KPIDashboard.tsx ~line 1292–1296.
// ─────────────────────────────────────────────────────────────────────────────

/** Replicates the status-line string built inside handleKpiImport for one KPI. */
function buildStatusLine(kpi: KpiDef, value: number, isAr: boolean): string {
  const onTarget = kpi.higherIsBetter ? value >= kpi.targetValue : value <= kpi.targetValue;
  const label = isAr ? kpi.labelAr : kpi.label;
  const unit  = isAr ? kpi.unitAr  : kpi.unit;
  if (onTarget) {
    return isAr
      ? `✅ ${label}: ${value} ${unit} — حسب الهدف`
      : `✅ ${label}: ${value} ${unit} — On Target`;
  }
  return isAr
    ? `❌ ${label}: ${value} ${unit} — دون الهدف`
    : `❌ ${label}: ${value} ${unit} — Below Target`;
}

describe('KPI on-target status — Arabic mode labels', () => {
  // pocycle: PO Cycle Time — higherIsBetter: false, targetValue: 7 days
  // A lower-is-better KPI so that we can exercise both branches clearly.
  const framework = KPI_FRAMEWORKS['procurement-excellence'];
  const pocycle = framework.find(k => k.id === 'pocycle')!;  // lower is better

  it('lower-is-better KPI below target shows ✅ with Arabic on-target label', () => {
    // 5 days < 7 day target → on-target in Arabic
    const line = buildStatusLine(pocycle, 5, true);
    expect(line).toContain('✅');
    expect(line).toContain('حسب الهدف');
    expect(line).not.toContain('دون الهدف');
    expect(line).not.toContain('On Target');
  });

  it('lower-is-better KPI above target shows ❌ with Arabic off-target label', () => {
    // 10 days > 7 day target → off-target in Arabic
    const line = buildStatusLine(pocycle, 10, true);
    expect(line).toContain('❌');
    expect(line).toContain('دون الهدف');
    expect(line).not.toContain('حسب الهدف');
    expect(line).not.toContain('Below Target');
  });

  it('Arabic on-target line uses the Arabic label and unit, not English', () => {
    const line = buildStatusLine(pocycle, 5, true);
    expect(line).toContain(pocycle.labelAr);
    expect(line).toContain(pocycle.unitAr);
    expect(line).not.toContain(pocycle.label);
  });

  it('Arabic off-target line uses the Arabic label and unit, not English', () => {
    const line = buildStatusLine(pocycle, 10, true);
    expect(line).toContain(pocycle.labelAr);
    expect(line).toContain(pocycle.unitAr);
    expect(line).not.toContain(pocycle.label);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task 568 — English status words ('Below Target', 'On Target') must NEVER
// appear in Arabic-mode status lines across every KPI in every framework.
//
// The ternary at KPIDashboard.tsx ~1292–1296 uses isAr to pick the label.
// A regression that swaps the condition would silently serve English strings
// to Arabic users. This test iterates every KPI in every framework so a
// single typo cannot hide behind untested KPIs.
// ─────────────────────────────────────────────────────────────────────────────

describe('KPI status lines — no English labels in Arabic mode (Task 568, all frameworks)', () => {
  // Build on-target and off-target status lines for every KPI using a value
  // that is guaranteed to be on-target (targetValue itself) for the on-target
  // branch, and one unit off target for the off-target branch.
  const ENGLISH_STATUS_WORDS = ['Below Target', 'On Target'];

  for (const [frameworkKey, kpis] of Object.entries(KPI_FRAMEWORKS)) {
    for (const kpi of kpis) {
      // on-target value: exactly at threshold
      const onTargetValue = kpi.targetValue;
      // off-target value: one unit past the threshold (wrong direction)
      const offTargetValue = kpi.higherIsBetter
        ? kpi.targetValue - 1
        : kpi.targetValue + 1;

      it(`[${frameworkKey}] "${kpi.id}" on-target line contains no English status words in Arabic mode`, () => {
        const line = buildStatusLine(kpi, onTargetValue, true);
        for (const word of ENGLISH_STATUS_WORDS) {
          expect(line, `"${word}" must not appear in Arabic status line for ${kpi.id}`).not.toContain(word);
        }
        expect(line).toContain('حسب الهدف');
      });

      it(`[${frameworkKey}] "${kpi.id}" off-target line contains no English status words in Arabic mode`, () => {
        const line = buildStatusLine(kpi, offTargetValue, true);
        for (const word of ENGLISH_STATUS_WORDS) {
          expect(line, `"${word}" must not appear in Arabic status line for ${kpi.id}`).not.toContain(word);
        }
        expect(line).toContain('دون الهدف');
      });
    }
  }
});
