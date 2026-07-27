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
 * The six canonical tier colours used across bar chart Cells and MiniGauge.
 * scoreColor() delegates to scoreTier() which maps score ranges to these colours.
 */
const TIER = {
  worldClass:    '#059669', // ≥95
  bestInGCC:     '#10b981', // 80–94
  competitive:   '#3b82f6', // 65–79
  developing:    '#f59e0b', // 50–64
  needsAttention:'#f97316', // 35–49
  criticalGap:   '#ef4444', // <35
} as const;

describe('Bar chart Cell colours match gauge tier colours', () => {
  it('scoreColor(95) → World Class (#059669)', () => {
    expect(scoreColor(95)).toBe(TIER.worldClass);
  });

  it('scoreColor(100) → World Class (#059669)', () => {
    expect(scoreColor(100)).toBe(TIER.worldClass);
  });

  it('scoreColor(80) → Best-in-GCC (#10b981)', () => {
    expect(scoreColor(80)).toBe(TIER.bestInGCC);
  });

  it('scoreColor(94) → Best-in-GCC (#10b981)', () => {
    expect(scoreColor(94)).toBe(TIER.bestInGCC);
  });

  it('scoreColor(65) → Competitive (#3b82f6)', () => {
    expect(scoreColor(65)).toBe(TIER.competitive);
  });

  it('scoreColor(79) → Competitive (#3b82f6)', () => {
    expect(scoreColor(79)).toBe(TIER.competitive);
  });

  it('scoreColor(50) → Developing (#f59e0b)', () => {
    expect(scoreColor(50)).toBe(TIER.developing);
  });

  it('scoreColor(64) → Developing (#f59e0b)', () => {
    expect(scoreColor(64)).toBe(TIER.developing);
  });

  it('scoreColor(35) → Needs Attention (#f97316)', () => {
    expect(scoreColor(35)).toBe(TIER.needsAttention);
  });

  it('scoreColor(49) → Needs Attention (#f97316)', () => {
    expect(scoreColor(49)).toBe(TIER.needsAttention);
  });

  it('scoreColor(34) → Critical Gap (#ef4444)', () => {
    expect(scoreColor(34)).toBe(TIER.criticalGap);
  });

  it('scoreColor(0) → Critical Gap (#ef4444)', () => {
    expect(scoreColor(0)).toBe(TIER.criticalGap);
  });

  it('only produces the six canonical tier colours across 0–100', () => {
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
