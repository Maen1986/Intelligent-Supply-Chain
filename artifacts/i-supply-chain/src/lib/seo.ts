import data from '../../seo/routes.json';

export interface SeoRoute { path: string; title: string; description: string; }
export interface SeoResult { title: string; description: string; canonical: string | null; robots: string; }

const SITE_URL: string = data.site.url;
const byPath = new Map<string, SeoRoute>((data.routes as SeoRoute[]).map((r) => [r.path, r]));

export function normalizePath(pathname: string): string {
  const clean = pathname.split(/[?#]/)[0] || '/';
  return clean.length > 1 ? clean.replace(/\/+$/, '') : '/';
}

/** Metadata for a client-side path. Unknown or private paths get noindex and no canonical. */
export function seoForPath(pathname: string): SeoResult {
  const path = normalizePath(pathname);
  const route = byPath.get(path);
  if (route) {
    return { title: route.title, description: route.description, canonical: SITE_URL + (path === '/' ? '/' : path), robots: 'index, follow, max-snippet:-1, max-image-preview:large' };
  }
  return { title: 'I Supply Chain', description: 'I Supply Chain interactive tool.', canonical: null, robots: 'noindex, follow' };
}
