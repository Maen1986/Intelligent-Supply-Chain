/**
 * Smoke-test: a brand-new print zone inherits all typography without extra CSS
 *
 * Background
 * ──────────
 * The consolidation in Task #140 added a single [class*="print-zone-"] rule
 * inside `@media print` in `src/index.css`.  Any element whose class contains
 * the substring "print-zone-" automatically receives:
 *   • absolute positioning (fills the page)
 *   • -webkit-print-color-adjust / print-color-adjust: exact  (colour safety)
 *   • font-family, color, background                          (base typography)
 *   • table: width:100%; border-collapse:collapse
 *   • th/td: border, padding, font-size
 *
 * To add a new print zone, a developer only needs to add one visibility-gate
 * rule in index.css:
 *
 *   body[data-print="my-zone"] .print-zone-my-zone,
 *   body[data-print="my-zone"] .print-zone-my-zone * { visibility: visible; }
 *
 * No additional layout, colour, or typography CSS is required.
 *
 * How to repeat this verification
 * ────────────────────────────────
 * 1.  Pick a new zone name, e.g. "my-zone".
 * 2.  Add ONLY the two-line visibility gate above to index.css.
 * 3.  Run `pnpm --filter @workspace/i-supply-chain run test` — or just
 *     `pnpm run test` from the workspace root.
 * 4.  The "shared [class*="print-zone-"] rule covers …" assertions below
 *     will confirm that the shared selector still covers all required
 *     properties, so "my-zone" will inherit them for free.
 * 5.  Delete the temporary zone once you are satisfied.
 *
 * Test strategy
 * ─────────────
 * jsdom cannot evaluate `@media print`, so we extract the [class*="print-zone-"]
 * rules from the stylesheet text and inject them directly (without the @media
 * wrapper) into a fresh <style> element.  We then create a throwaway
 * `print-zone-smoke-test` element — a name that has never appeared in the
 * codebase — and assert its computed styles match the expected values.
 *
 * We also perform a static check that confirms the CSS file does NOT contain a
 * dedicated rule for "print-zone-smoke-test", which proves it is covered
 * entirely by the shared selector.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Extract every CSS declaration block that matches [class*="print-zone-"] */
function extractPrintZoneRules(css: string): string {
  // Strip @media print { … } wrapper; capture its contents
  const mediaMatch = css.match(/@media\s+print\s*\{([\s\S]*)\}\s*$/);
  const printBlock = mediaMatch ? mediaMatch[1] : css;

  // Collect all rulesets whose selector contains [class*="print-zone-"]
  const rules: string[] = [];
  // Simple tokeniser: split on top-level `{…}` blocks
  const ruleRegex = /([^{}]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRegex.exec(printBlock)) !== null) {
    const selector = m[1].trim();
    const body = m[2].trim();
    if (selector.includes('[class*="print-zone-"]')) {
      rules.push(`${selector} { ${body} }`);
    }
  }
  return rules.join('\n');
}

// ── read the stylesheet once ─────────────────────────────────────────────────

const CSS_PATH = resolve(__dirname, 'index.css');
const fullCss = readFileSync(CSS_PATH, 'utf8');
const printZoneRules = extractPrintZoneRules(fullCss);

// ── jsdom style injection ────────────────────────────────────────────────────

let styleEl: HTMLStyleElement;

beforeAll(() => {
  styleEl = document.createElement('style');
  styleEl.textContent = printZoneRules;
  document.head.appendChild(styleEl);
});

afterAll(() => {
  styleEl.remove();
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 1 — static analysis: the shared rule covers all required properties
// ════════════════════════════════════════════════════════════════════════════

describe('shared [class*="print-zone-"] rule covers required properties', () => {
  it('sets font-family on the zone container', () => {
    expect(printZoneRules).toMatch(/font-family\s*:/);
  });

  it('sets color on the zone container', () => {
    // Must declare an explicit foreground colour
    expect(printZoneRules).toMatch(/\bcolor\s*:\s*#/);
  });

  it('sets background on the zone container', () => {
    expect(printZoneRules).toMatch(/background\s*:/);
  });

  it('sets -webkit-print-color-adjust: exact', () => {
    expect(printZoneRules).toMatch(/-webkit-print-color-adjust\s*:\s*exact/);
  });

  it('sets print-color-adjust: exact', () => {
    expect(printZoneRules).toMatch(/print-color-adjust\s*:\s*exact/);
  });

  it('sets position: absolute (fills the page)', () => {
    expect(printZoneRules).toMatch(/position\s*:\s*absolute/);
  });

  it('sets table border-collapse: collapse', () => {
    expect(printZoneRules).toMatch(/border-collapse\s*:\s*collapse/);
  });

  it('sets th/td border', () => {
    expect(printZoneRules).toMatch(/border\s*:\s*1px solid/);
  });

  it('sets th/td font-size', () => {
    expect(printZoneRules).toMatch(/font-size\s*:\s*11px/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 2 — static analysis: the smoke-test zone has NO dedicated CSS rule
// ════════════════════════════════════════════════════════════════════════════

describe('print-zone-smoke-test has no dedicated CSS rule', () => {
  it('index.css contains no rule specific to print-zone-smoke-test', () => {
    // This confirms the zone is covered solely by the shared selector
    expect(fullCss).not.toContain('print-zone-smoke-test');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Suite 3 — computed styles: a throwaway zone element inherits typography
// ════════════════════════════════════════════════════════════════════════════

describe('print-zone-smoke-test element inherits shared typography', () => {
  it('receives font-family from the shared selector', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    document.body.appendChild(el);

    const styles = window.getComputedStyle(el);
    // jsdom resolves font-family from the injected stylesheet
    expect(styles.fontFamily).toMatch(/apple-system|BlinkMacSystemFont|Segoe UI|Roboto|sans-serif/i);

    el.remove();
  });

  it('receives color #111 from the shared selector', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    document.body.appendChild(el);

    const styles = window.getComputedStyle(el);
    // jsdom normalises #111 → rgb(17, 17, 17)
    expect(styles.color).toBe('rgb(17, 17, 17)');

    el.remove();
  });

  it('receives background #fff from the shared selector', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    document.body.appendChild(el);

    const styles = window.getComputedStyle(el);
    // jsdom normalises #fff → rgb(255, 255, 255)
    expect(styles.background).toMatch(/rgb\(255,\s*255,\s*255\)|#fff/i);

    el.remove();
  });

  it('a table inside the zone receives border-collapse: collapse', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    const table = document.createElement('table');
    el.appendChild(table);
    document.body.appendChild(el);

    const styles = window.getComputedStyle(table);
    expect(styles.borderCollapse).toBe('collapse');

    el.remove();
  });

  it('a th inside the zone receives a 1px solid border', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    tr.appendChild(th);
    table.appendChild(tr);
    el.appendChild(table);
    document.body.appendChild(el);

    const styles = window.getComputedStyle(th);
    expect(styles.border).toMatch(/1px solid/i);

    el.remove();
  });

  it('a td inside the zone receives font-size 11px', () => {
    const el = document.createElement('div');
    el.className = 'print-zone-smoke-test';
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    tr.appendChild(td);
    table.appendChild(tr);
    el.appendChild(table);
    document.body.appendChild(el);

    const styles = window.getComputedStyle(td);
    expect(styles.fontSize).toBe('11px');

    el.remove();
  });
});
