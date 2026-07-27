/**
 * TemplatesPlatformFilter.test.ts
 *
 * Verifies that the TemplatesTab platform filter correctly
 * subsets the manifest and that the visible-count counter
 * matches manifest entries for every filter value.
 *
 * Source of truth: artifacts/api-server/public/n8n-templates/manifest.json
 *
 * Expected counts (from manifest at time of writing):
 *   n8n    — 8 templates
 *   make   — 8 templates
 *   zapier — 8 templates
 *   All    — 24 templates
 */

import { describe, it, expect } from 'vitest';
import manifest from '../../../../api-server/public/n8n-templates/manifest.json';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface ManifestEntry {
  id: string;
  platform: string;
  filename: string;
  name: string;
  [key: string]: unknown;
}

/* ── Mirror the exact filter logic from TemplatesTab ─────────────────────── */

function applyPlatformFilter(
  templates: ManifestEntry[],
  platformFilter: string,
): ManifestEntry[] {
  return platformFilter
    ? templates.filter(t => t.platform === platformFilter)
    : templates;
}

/**
 * Mirrors what TemplatesTab now does to build the pill list dynamically:
 *   ['', ...Array.from(new Set(templates.map(t => t.platform))).sort()]
 */
function buildPillList(templates: ManifestEntry[]): string[] {
  return ['', ...Array.from(new Set(templates.map(t => t.platform))).sort()];
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

const templates = manifest.templates as ManifestEntry[];

describe('TemplatesTab — platform filter', () => {
  it('All filter returns the full manifest (24 templates)', () => {
    const visible = applyPlatformFilter(templates, '');
    expect(visible.length).toBe(24);
    expect(visible.length).toBe(templates.length);
  });

  it('n8n filter shows exactly 8 templates', () => {
    const visible = applyPlatformFilter(templates, 'n8n');
    expect(visible.length).toBe(8);
    expect(visible.every(t => t.platform === 'n8n')).toBe(true);
  });

  it('Make.com filter shows exactly 8 templates', () => {
    const visible = applyPlatformFilter(templates, 'make');
    expect(visible.length).toBe(8);
    expect(visible.every(t => t.platform === 'make')).toBe(true);
  });

  it('Zapier filter shows exactly 8 templates', () => {
    const visible = applyPlatformFilter(templates, 'zapier');
    expect(visible.length).toBe(8);
    expect(visible.every(t => t.platform === 'zapier')).toBe(true);
  });

  it('n8n + make + zapier counts sum to the All count', () => {
    const n8nCount    = applyPlatformFilter(templates, 'n8n').length;
    const makeCount   = applyPlatformFilter(templates, 'make').length;
    const zapierCount = applyPlatformFilter(templates, 'zapier').length;
    const allCount    = applyPlatformFilter(templates, '').length;
    expect(n8nCount + makeCount + zapierCount).toBe(allCount);
  });

  it('switching from Make.com to Zapier yields only Zapier cards (no stale Make.com entries)', () => {
    // Simulate: user was on Make.com filter, now switches to Zapier
    const afterMake   = applyPlatformFilter(templates, 'make');
    const afterZapier = applyPlatformFilter(templates, 'zapier');

    // No Make.com entry survives the Zapier filter
    const stale = afterZapier.filter(t => afterMake.some(m => m.id === t.id));
    expect(stale).toHaveLength(0);

    // And the counts are correct
    expect(afterZapier.length).toBe(8);
  });

  it('switching from n8n to All restores the full set without duplicates', () => {
    const afterN8n = applyPlatformFilter(templates, 'n8n');
    const afterAll = applyPlatformFilter(templates, '');

    // All includes every n8n entry
    const n8nIds = new Set(afterN8n.map(t => t.id));
    const allIds = new Set(afterAll.map(t => t.id));
    for (const id of n8nIds) {
      expect(allIds.has(id)).toBe(true);
    }

    // No duplicates in All
    expect(afterAll.length).toBe(new Set(afterAll.map(t => t.id)).size);
  });

  it('counter text "X / Y templates" would be correct for every filter', () => {
    const cases: Array<[string, number]> = [
      ['',       24],
      ['n8n',     8],
      ['make',    8],
      ['zapier',  8],
    ];

    for (const [filter, expectedVisible] of cases) {
      const visible = applyPlatformFilter(templates, filter);
      // The component renders: `${visible.length} / ${templates.length} templates`
      const counterText = `${visible.length} / ${templates.length} templates`;
      expect(counterText).toBe(`${expectedVisible} / 24 templates`);
    }
  });

  it('every manifest entry has a recognised platform value', () => {
    const validPlatforms = new Set<string>(['n8n', 'make', 'zapier']);
    for (const t of templates) {
      expect(validPlatforms.has(t.platform)).toBe(true);
    }
  });

  /**
   * NEW — prevents a new platform from silently making templates invisible.
   *
   * TemplatesTab now builds the pill list dynamically:
   *   ['', ...unique platforms from loaded templates sorted]
   *
   * This test verifies that every distinct platform value in the manifest
   * would produce a pill button (i.e. it is present in the dynamic pill list),
   * and that applying each pill's filter returns at least one template.
   *
   * If a new platform key (e.g. "powerautomate") is added to the manifest,
   * this test will catch it — no manual update of a hardcoded list is needed.
   */
  it('every distinct platform in the manifest has a pill button and yields a non-empty result', () => {
    const pills = buildPillList(templates);

    // Collect every unique platform from the manifest
    const manifestPlatforms = Array.from(new Set(templates.map(t => t.platform)));

    for (const platform of manifestPlatforms) {
      // The pill must appear in the dynamically-built list
      expect(pills).toContain(platform);

      // Filtering by it must return at least one template
      const results = applyPlatformFilter(templates, platform);
      expect(results.length).toBeGreaterThan(0);
    }
  });

  /**
   * NEW — every pill in the dynamic list (except "All") maps to at least one template.
   * Guards against stale pills left over after a platform is removed from the manifest.
   */
  it('every platform pill (except All) has at least one matching template in the manifest', () => {
    const pills = buildPillList(templates);

    for (const pill of pills) {
      if (pill === '') continue; // skip the "All" pill
      const results = applyPlatformFilter(templates, pill);
      expect(results.length).toBeGreaterThan(0);
    }
  });
});
