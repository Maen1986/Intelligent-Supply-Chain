/**
 * KPI bar chart — print colour consistency tests.
 *
 * Covers:
 *  • Bar chart Cell fills use scoreColor(), the same function as MiniGauge,
 *    so RAG colours are identical between chart and gauge across all boundaries.
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

/** The three canonical RAG colours used across bar chart Cells and MiniGauge. */
const RAG = {
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
} as const;

describe('Bar chart Cell colours match gauge RAG colours', () => {
  it('scoreColor(80) → green (strong)', () => {
    expect(scoreColor(80)).toBe(RAG.green);
  });

  it('scoreColor(100) → green (strong)', () => {
    expect(scoreColor(100)).toBe(RAG.green);
  });

  it('scoreColor(79) → amber (developing)', () => {
    expect(scoreColor(79)).toBe(RAG.amber);
  });

  it('scoreColor(50) → amber (developing)', () => {
    expect(scoreColor(50)).toBe(RAG.amber);
  });

  it('scoreColor(49) → red (weak)', () => {
    expect(scoreColor(49)).toBe(RAG.red);
  });

  it('scoreColor(0) → red (weak)', () => {
    expect(scoreColor(0)).toBe(RAG.red);
  });

  it('only produces the three canonical RAG colours', () => {
    const all = Object.values(RAG);
    for (let s = 0; s <= 100; s++) {
      expect(all).toContain(scoreColor(s));
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
    // Locate the .kpi-chart-wrap rule body
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
