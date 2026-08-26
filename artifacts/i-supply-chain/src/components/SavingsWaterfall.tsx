/**
 * SavingsWaterfall.tsx
 *
 * #190 (Real Waterfall/Graph visualization engine), 26 Aug 2026 -- the
 * data-model unblock (see report-generator-190-scoping-draft.md): the AI
 * report's investmentProjection.scenarios[] previously carried only
 * free-text figures (year1SavingsRange: "SAR X-Y million", roi: "X% ROI"),
 * so there was nothing structured to chart FROM. reportGenerator.ts now
 * additionally asks the model for year1SavingsLowSAR/year1SavingsHighSAR/
 * roiPercent/savingsBreakdown (a category -> amountSAR array) alongside the
 * existing text fields -- additive, never replacing them.
 *
 * This component turns one scenario's savingsBreakdown into a real
 * waterfall chart: baseline (0) -> +category A -> +category B -> ... ->
 * Year 1 Total, using the standard recharts technique for faking a
 * waterfall (recharts has no native waterfall primitive -- confirmed during
 * scoping): a stacked BarChart where each step has an invisible "base"
 * segment (the running total before this step) and a visible "delta"
 * segment (this step's own contribution), so bars appear to float at the
 * right height rather than all starting from zero.
 *
 * Per Decision Record 8.7, this never fabricates a breakdown the AI didn't
 * provide -- if savingsBreakdown is missing, empty, or every entry is
 * malformed (non-finite/non-positive amount, blank category), the
 * component renders nothing and the existing free-text scenario card
 * (year1SavingsRange/roi/keyDrivers, unaffected by this change) remains
 * the only representation, exactly as before this feature existed.
 */
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export interface SavingsBreakdownItem {
  category: string;
  amountSAR: number;
}

export interface WaterfallScenario {
  name: string;
  year1SavingsLowSAR?: number;
  year1SavingsHighSAR?: number;
  roiPercent?: number;
  savingsBreakdown?: SavingsBreakdownItem[];
}

const CATEGORY_COLORS = ['#082C6B', '#C9A84C', '#0B3D91', '#94A3B8', '#2E7D32', '#B45309'];
const TOTAL_COLOR = '#082C6B';

function formatSAR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `SAR ${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `SAR ${(n / 1_000).toFixed(0)}K`;
  return `SAR ${n.toLocaleString()}`;
}

/** Only entries an AI could plausibly have produced correctly -- a real
 *  category label and a finite, positive amount. Anything else is dropped
 *  rather than charted as-is or replaced with an invented value. */
function validBreakdown(items: SavingsBreakdownItem[] | undefined): SavingsBreakdownItem[] {
  if (!items || items.length === 0) return [];
  return items.filter(
    (it) => typeof it?.category === 'string' && it.category.trim().length > 0
      && typeof it?.amountSAR === 'number' && Number.isFinite(it.amountSAR) && it.amountSAR > 0,
  );
}

interface WaterfallStep {
  label: string;
  base: number;
  delta: number;
  isTotal: boolean;
  category?: string;
}

function buildSteps(breakdown: SavingsBreakdownItem[]): WaterfallStep[] {
  const steps: WaterfallStep[] = [];
  let running = 0;
  for (const item of breakdown) {
    steps.push({ label: item.category, base: running, delta: item.amountSAR, isTotal: false, category: item.category });
    running += item.amountSAR;
  }
  steps.push({ label: 'Year 1 Total', base: 0, delta: running, isTotal: true });
  return steps;
}

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WaterfallStep }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const step = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, color: '#082C6B', marginBottom: '2px' }}>{step.label}</div>
      <div style={{ color: '#444' }}>{step.isTotal ? 'Cumulative: ' : 'Contribution: '}{formatSAR(step.delta)}</div>
    </div>
  );
}

/**
 * Renders a per-category savings build-up waterfall for one investment
 * scenario. Returns null (renders nothing) when the scenario has no usable
 * structured breakdown -- never invents one.
 */
export function SavingsWaterfall({ scenario }: { scenario: WaterfallScenario }) {
  const breakdown = validBreakdown(scenario.savingsBreakdown);
  if (breakdown.length === 0) return null;

  const steps = buildSteps(breakdown);

  return (
    <div data-testid="savings-waterfall" style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#082C6B', marginBottom: '6px' }}>
        {scenario.name} -- Year 1 Savings Build-Up
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={steps} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tickFormatter={(v: number) => formatSAR(v)} tick={{ fontSize: 9 }} width={70} />
          <Tooltip content={<WaterfallTooltip />} />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="delta" stackId="waterfall" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {steps.map((s, i) => (
              <Cell key={i} fill={s.isTotal ? TOTAL_COLOR : CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
