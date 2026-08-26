/**
 * Tests: SavingsWaterfall (#190, 26 Aug 2026)
 *
 * Covers:
 *   1. Renders nothing when savingsBreakdown is absent, empty, or every
 *      entry is malformed (Decision Record 8.7 -- never fabricate a chart
 *      from data the AI didn't actually provide).
 *   2. Silently drops individually malformed entries (non-finite/
 *      non-positive amount, blank category) while still charting the
 *      valid ones.
 *   3. Computes the correct running-total ("base") for each waterfall step,
 *      and a correct final "Year 1 Total" step summing every valid entry.
 *   4. Renders the scenario name in the header.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SavingsWaterfall, type WaterfallScenario } from './SavingsWaterfall';

afterEach(cleanup);

/* ── Mock recharts: expose the computed `data` passed to BarChart so the
      waterfall's cumulative-sum logic can be asserted directly, instead of
      relying on JSDOM's lack of real SVG layout. ────────────────────────── */
vi.mock('recharts', () => {
  const noop = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: noop,
    BarChart: ({ children, data }: any) => (
      <div data-testid="bar-chart" data-steps={JSON.stringify(data)}>{children}</div>
    ),
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Cell: () => null,
  };
});

function getSteps(): Array<{ label: string; base: number; delta: number; isTotal: boolean }> {
  return JSON.parse(screen.getByTestId('bar-chart').getAttribute('data-steps')!);
}

describe('SavingsWaterfall -- absent/malformed data (never fabricate)', () => {
  it('renders nothing when savingsBreakdown is undefined', () => {
    const scenario: WaterfallScenario = { name: 'Base Case' };
    const { container } = render(<SavingsWaterfall scenario={scenario} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when savingsBreakdown is an empty array', () => {
    const scenario: WaterfallScenario = { name: 'Base Case', savingsBreakdown: [] };
    const { container } = render(<SavingsWaterfall scenario={scenario} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when every entry is malformed', () => {
    const scenario: WaterfallScenario = {
      name: 'Base Case',
      savingsBreakdown: [
        { category: '', amountSAR: 500000 },
        { category: 'Valid label', amountSAR: -100 },
        { category: 'Also valid', amountSAR: NaN },
      ],
    };
    const { container } = render(<SavingsWaterfall scenario={scenario} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('SavingsWaterfall -- filters individually malformed entries', () => {
  it('drops malformed entries but still charts the valid ones', () => {
    const scenario: WaterfallScenario = {
      name: 'Base Case',
      savingsBreakdown: [
        { category: 'Cycle time reduction', amountSAR: 800000 },
        { category: '', amountSAR: 200000 },               // blank category -- dropped
        { category: 'Rebate capture', amountSAR: -50000 },  // negative -- dropped
        { category: 'Compliance automation', amountSAR: 400000 },
      ],
    };
    render(<SavingsWaterfall scenario={scenario} />);
    const steps = getSteps();
    // 2 valid category steps + 1 "Year 1 Total" step.
    expect(steps).toHaveLength(3);
    expect(steps.map(s => s.label)).toEqual(['Cycle time reduction', 'Compliance automation', 'Year 1 Total']);
  });
});

describe('SavingsWaterfall -- waterfall math', () => {
  const scenario: WaterfallScenario = {
    name: 'Base Case',
    year1SavingsLowSAR: 1_000_000,
    year1SavingsHighSAR: 1_500_000,
    roiPercent: 145,
    savingsBreakdown: [
      { category: 'Procurement cycle time', amountSAR: 600000 },
      { category: 'Rebate capture', amountSAR: 500000 },
      { category: 'Compliance automation', amountSAR: 400000 },
    ],
  };

  it('gives each category step a base equal to the running total before it', () => {
    render(<SavingsWaterfall scenario={scenario} />);
    const steps = getSteps();
    expect(steps[0]).toMatchObject({ label: 'Procurement cycle time', base: 0, delta: 600000, isTotal: false });
    expect(steps[1]).toMatchObject({ label: 'Rebate capture', base: 600000, delta: 500000, isTotal: false });
    expect(steps[2]).toMatchObject({ label: 'Compliance automation', base: 1100000, delta: 400000, isTotal: false });
  });

  it('appends a final Year 1 Total step summing every valid category', () => {
    render(<SavingsWaterfall scenario={scenario} />);
    const steps = getSteps();
    const total = steps[steps.length - 1];
    expect(total).toMatchObject({ label: 'Year 1 Total', base: 0, delta: 1500000, isTotal: true });
  });

  it('renders the scenario name in the header', () => {
    render(<SavingsWaterfall scenario={scenario} />);
    expect(screen.getByText(/Base Case.*Year 1 Savings Build-Up/)).toBeInTheDocument();
  });
});
