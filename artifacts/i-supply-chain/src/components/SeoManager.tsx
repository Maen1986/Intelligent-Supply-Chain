import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { seoForPath } from '@/lib/seo';

function setMeta(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) { el = create(); document.head.appendChild(el); }
  el.setAttribute(attr, value);
}

/** Keeps <title>, description, canonical and robots in step with the SPA route. */
export function SeoManager() {
  const [location] = useLocation();
  useEffect(() => {
    const s = seoForPath(location);
    document.title = s.title;
    const meta = (name: string) => () => { const m = document.createElement('meta'); m.setAttribute('name', name); return m; };
    setMeta('meta[name="description"]', meta('description'), 'content', s.description);
    setMeta('meta[name="robots"]', meta('robots'), 'content', s.robots);
    const prop = (p: string) => () => { const m = document.createElement('meta'); m.setAttribute('property', p); return m; };
    setMeta('meta[property="og:title"]', prop('og:title'), 'content', s.title);
    setMeta('meta[property="og:description"]', prop('og:description'), 'content', s.description);
    const existing = document.head.querySelector('link[rel="canonical"]');
    if (s.canonical) {
      setMeta('link[rel="canonical"]', () => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l; }, 'href', s.canonical);
    } else if (existing) {
      existing.remove();
    }
  }, [location]);
  return null;
}
