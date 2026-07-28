/**
 * Guard: every article in the Insights page must be attributed to a real team
 * member or the editorial team. This prevents fictional author names from
 * slipping in when new articles are added.
 *
 * To add a new real team member, update ALLOWED_INSIGHT_AUTHORS in
 * src/pages/insightsData.ts.
 */

import { describe, it, expect } from 'vitest';
import { articles, ALLOWED_INSIGHT_AUTHORS } from '../insightsData';

describe('Insights article authors', () => {
  it('every article has a non-empty author field', () => {
    for (const article of articles) {
      expect(
        article.author,
        `Article id=${article.id} "${article.title}" is missing an author`,
      ).toBeTruthy();
    }
  });

  it('every author matches a known team member or ISC Editorial Team', () => {
    const allowed = new Set<string>(ALLOWED_INSIGHT_AUTHORS);

    const violations = articles
      .filter((a) => !allowed.has(a.author))
      .map((a) => `id=${a.id} "${a.title}" — author: "${a.author}"`);

    expect(violations, violations.join('\n')).toHaveLength(0);
  });
});
