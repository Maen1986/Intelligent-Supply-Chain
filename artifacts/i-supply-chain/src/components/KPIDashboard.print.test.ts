/**
 * KPI bar chart — print colour consistency tests.
 *
 * Covers:
 *  • Bar chart Cell fills use scoreColor(), the same function as MiniGauge,
 *    so tier colours are identical between chart and gauge across all boundaries.
 *  • The bar chart container (.kpi-chart-wrap) declares print-color-adjust: exact
 *    in index.css, preventing Safari and Firefox from stripping Cell colours
 *    during print.
 *  • The JSX source opts in via WebkitPrintColorAdjust as a belt-and-suspenders
 *    guard for older WebKit engines.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';
import { scoreColor } from './KPIDashboard';

// ─── Colour consistency: bar chart Cell == gauge scoreColor ───────────────

/**
 * Seven canonical tier colours (industry-percentile system).
 * scoreColor() delegates to scoreTier() which maps score ranges to these colours.
 *
 *   ≥ 90  #b45309  Top 10 % — Market Leaders (gold)
 *   ≥ 75  #059669  Top 25 %                   (dark emerald)
 *   ≥ 55  #10b981  Top 50 % — Above Average   (green)
 *   ≥ 40  #3b82f6  Industry Benchmark          (blue — accepted)
 *   ≥ 25  #f59e0b  Bottom 50 % — Below Avg     (amber)
 *   ≥ 10  #ef4444  Bottom 25 % — Far Below     (red)
 *    < 10  #b91c1c  Bottom 10 % — Critical      (dark red)
 */
const TIER = {
  marketLeaders:  '#b45309', // ≥ 90
  topQuartile:    '#059669', // 75–89
  aboveAverage:   '#10b981', // 55–74
  atBenchmark:    '#3b82f6', // 40–54
  belowAverage:   '#f59e0b', // 25–39
  farBelow:       '#ef4444', // 10–24
  critical:       '#b91c1c', // < 10
} as const;

describe('Bar chart Cell colours match gauge tier colours', () => {
  it('scoreColor(90)  → Top 10% Market Leaders (#b45309)', () => {
    expect(scoreColor(90)).toBe(TIER.marketLeaders);
  });
  it('scoreColor(100) → Top 10% Market Leaders (#b45309)', () => {
    expect(scoreColor(100)).toBe(TIER.marketLeaders);
  });

  it('scoreColor(75) → Top 25% (#059669)', () => {
    expect(scoreColor(75)).toBe(TIER.topQuartile);
  });
  it('scoreColor(89) → Top 25% (#059669)', () => {
    expect(scoreColor(89)).toBe(TIER.topQuartile);
  });

  it('scoreColor(55) → Top 50% Above Average (#10b981)', () => {
    expect(scoreColor(55)).toBe(TIER.aboveAverage);
  });
  it('scoreColor(74) → Top 50% Above Average (#10b981)', () => {
    expect(scoreColor(74)).toBe(TIER.aboveAverage);
  });

  it('scoreColor(50) → Industry Benchmark (#3b82f6)', () => {
    expect(scoreColor(50)).toBe(TIER.atBenchmark);
  });
  it('scoreColor(40) → Industry Benchmark (#3b82f6)', () => {
    expect(scoreColor(40)).toBe(TIER.atBenchmark);
  });
  it('scoreColor(54) → Industry Benchmark (#3b82f6)', () => {
    expect(scoreColor(54)).toBe(TIER.atBenchmark);
  });

  it('scoreColor(25) → Bottom 50% Below Avg (#f59e0b)', () => {
    expect(scoreColor(25)).toBe(TIER.belowAverage);
  });
  it('scoreColor(39) → Bottom 50% Below Avg (#f59e0b)', () => {
    expect(scoreColor(39)).toBe(TIER.belowAverage);
  });

  it('scoreColor(10) → Bottom 25% Far Below (#ef4444)', () => {
    expect(scoreColor(10)).toBe(TIER.farBelow);
  });
  it('scoreColor(24) → Bottom 25% Far Below (#ef4444)', () => {
    expect(scoreColor(24)).toBe(TIER.farBelow);
  });

  it('scoreColor(9) → Bottom 10% Critical (#b91c1c)', () => {
    expect(scoreColor(9)).toBe(TIER.critical);
  });
  it('scoreColor(0) → Bottom 10% Critical (#b91c1c)', () => {
    expect(scoreColor(0)).toBe(TIER.critical);
  });

  it('only produces the seven canonical tier colours across 0–100', () => {
    const all = Object.values(TIER);
    for (let s = 0; s <= 100; s++) {
      expect(all, `scoreColor(${s}) = ${scoreColor(s)} is not a known tier colour`).toContain(scoreColor(s));
    }
  });
});

// ─── CSS: print-color-adjust: exact on .kpi-chart-wrap ───────────────────

const cssPath = resolve(__dirname, '../index.css');
const cssSource = readFileSync(cssPath, 'utf8');

// Extract only the @media print block so we don't match outside it
const printBlockMatch = cssSource.match(/@media print\s*\{([\s\S]*)\}(?![\s\S]*@media print)/);
const printBlock = printBlockMatch ? printBlockMatch[1] : '';

describe('index.css print block — .kpi-chart-wrap colour preservation', () => {
  it('contains a .kpi-chart-wrap rule', () => {
    expect(printBlock).toContain('.kpi-chart-wrap');
  });

  it('sets -webkit-print-color-adjust: exact on .kpi-chart-wrap', () => {
    const ruleMatch = printBlock.match(/\.kpi-chart-wrap\s*\{([^}]*)\}/);
    expect(ruleMatch, '.kpi-chart-wrap rule not found in @media print block').toBeTruthy();
    expect(ruleMatch![1]).toContain('-webkit-print-color-adjust: exact');
  });

  it('sets print-color-adjust: exact on .kpi-chart-wrap', () => {
    const ruleMatch = printBlock.match(/\.kpi-chart-wrap\s*\{([^}]*)\}/);
    expect(ruleMatch, '.kpi-chart-wrap rule not found in @media print block').toBeTruthy();
    expect(ruleMatch![1]).toContain('print-color-adjust: exact');
  });
});

// ─── JSX source: WebkitPrintColorAdjust inline style ─────────────────────

const tsxPath = resolve(__dirname, './KPIDashboard.tsx');
const tsxSource = readFileSync(tsxPath, 'utf8');

describe('KPIDashboard.tsx — bar chart container inline print style', () => {
  it('bar chart container carries kpi-chart-wrap class', () => {
    expect(tsxSource).toContain('kpi-chart-wrap');
  });

  it('bar chart container sets WebkitPrintColorAdjust via inline style', () => {
    expect(tsxSource).toContain("WebkitPrintColorAdjust: 'exact'");
  });
});
