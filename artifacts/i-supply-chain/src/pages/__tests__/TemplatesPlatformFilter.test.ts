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
 *   make   — 3 templates
 *   zapier — 3 templates
 *   All    — 14 templates
 */

import { describe, it, expect } from 'vitest';
import manifest from '../../../../api-server/public/n8n-templates/manifest.json';

/* ── Types ────────────────────────────────────────────────────────────────── */

type Platform = 'n8n' | 'make' | 'zapier';

interface ManifestEntry {
  id: string;
  platform: Platform;
  filename: string;
  name: string;
  [key: string]: unknown;
}

/* ── Mirror the exact filter logic from TemplatesTab ─────────────────────── */

function applyPlatformFilter(
  templates: ManifestEntry[],
  platformFilter: '' | Platform,
): ManifestEntry[] {
  return platformFilter
    ? templates.filter(t => t.platform === platformFilter)
    : templates;
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

const templates = manifest.templates as ManifestEntry[];

describe('TemplatesTab — platform filter', () => {
  it('All filter returns the full manifest (14 templates)', () => {
    const visible = applyPlatformFilter(templates, '');
    expect(visible.length).toBe(14);
    expect(visible.length).toBe(templates.length);
  });

  it('n8n filter shows exactly 8 templates', () => {
    const visible = applyPlatformFilter(templates, 'n8n');
    expect(visible.length).toBe(8);
    expect(visible.every(t => t.platform === 'n8n')).toBe(true);
  });

  it('Make.com filter shows exactly 3 templates', () => {
    const visible = applyPlatformFilter(templates, 'make');
    expect(visible.length).toBe(3);
    expect(visible.every(t => t.platform === 'make')).toBe(true);
  });

  it('Zapier filter shows exactly 3 templates', () => {
    const visible = applyPlatformFilter(templates, 'zapier');
    expect(visible.length).toBe(3);
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
    expect(afterZapier.length).toBe(3);
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
    const cases: Array<['' | Platform, number]> = [
      ['',       14],
      ['n8n',     8],
      ['make',    3],
      ['zapier',  3],
    ];

    for (const [filter, expectedVisible] of cases) {
      const visible = applyPlatformFilter(templates, filter);
      // The component renders: `${visible.length} / ${templates.length} templates`
      const counterText = `${visible.length} / ${templates.length} templates`;
      expect(counterText).toBe(`${expectedVisible} / 14 templates`);
    }
  });

  it('every manifest entry has a recognised platform value', () => {
    const validPlatforms = new Set<string>(['n8n', 'make', 'zapier']);
    for (const t of templates) {
      expect(validPlatforms.has(t.platform)).toBe(true);
    }
  });
});
