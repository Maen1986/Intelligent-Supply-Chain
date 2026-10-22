import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import data from '../../seo/routes.json';
import { seoForPath, normalizePath } from './seo';

const root = process.cwd();
const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
const appSrc = readFileSync(join(root, 'src/App.tsx'), 'utf8');

describe('seo route metadata', () => {
  it('has unique titles and descriptions within search-result limits', () => {
    const titles = new Set<string>(); const descs = new Set<string>();
    for (const r of data.routes) {
      expect(r.title.length, r.path).toBeLessThanOrEqual(60);
      expect(r.description.length, r.path).toBeLessThanOrEqual(160);
      expect(r.description.length, r.path).toBeGreaterThanOrEqual(60);
      expect(titles.has(r.title), 'duplicate title ' + r.path).toBe(false);
      expect(descs.has(r.description), 'duplicate description ' + r.path).toBe(false);
      titles.add(r.title); descs.add(r.description);
      expect(r.path.startsWith('/')).toBe(true);
      expect(r.path.length === 1 || !r.path.endsWith('/')).toBe(true);
    }
  });
  it('never lists a public route that is also private', () => {
    for (const p of data.privatePaths) expect(data.routes.some((r) => r.path === p), p).toBe(false);
  });
  it('every sitemap route is registered in App.tsx', () => {
    for (const r of data.routes) {
      const pattern = r.path.replace(/^\/(solutions|industry)\/.+/, '/$1/:slug');
      expect(appSrc.includes(`path="${pattern}"`), r.path).toBe(true);
    }
  });
  it('every private path is registered in App.tsx (or is an /admin sub-route)', () => {
    for (const p of data.privatePaths) {
      expect(appSrc.includes(`path="${p}"`) || appSrc.includes('path="/admin/'), p).toBe(true);
    }
  });
});

describe('seoForPath', () => {
  it('returns canonical + index for public routes, tolerant of trailing slash', () => {
    const a = seoForPath('/about/');
    expect(a.canonical).toBe('https://iscsupplychain.com/about');
    expect(a.robots).toBe(data.site.indexable ? 'index, follow, max-snippet:-1, max-image-preview:large' : 'noindex, nofollow');
    expect(seoForPath('/').canonical).toBe('https://iscsupplychain.com/');
  });
  it('marks unknown and private paths noindex with no canonical', () => {
    for (const p of ['/does-not-exist', '/login', '/diagnostic']) {
      const s = seoForPath(p);
      expect(s.robots).toBe('noindex, follow');
      expect(s.canonical).toBeNull();
    }
  });
  it('normalizePath strips query, hash, trailing slashes', () => {
    expect(normalizePath('/about/?x=1#y')).toBe('/about');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('pre-launch noindex', () => {
  it('when not indexable, source shell and every runtime route are noindex', () => {
    if (data.site.indexable) return;
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('content="noindex, nofollow"');
    for (const r of data.routes) expect(seoForPath(r.path).robots, r.path).toBe('noindex, nofollow');
  });
});

describe('robots.txt', () => {
  it('points to the sitemap, allows public pages, and keeps AI-crawler blocks', () => {
    expect(robots).toContain('Sitemap: https://iscsupplychain.com/sitemap.xml');
    expect(robots).toMatch(/User-agent: \*\s+Allow: \//);
    expect(robots).not.toContain('/i-supply-chain/');
    for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'PerplexityBot']) {
      expect(robots).toMatch(new RegExp(`User-agent: ${bot}\\s+Disallow: /`));
    }
  });
});
