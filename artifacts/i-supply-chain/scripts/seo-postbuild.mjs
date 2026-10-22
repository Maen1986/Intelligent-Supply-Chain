// Post-build SEO step: turns the single SPA shell into one crawlable HTML file per route.
// Runs after `vite build`. Input: dist/public/index.html + seo/routes.json.
// Output: dist/public/<route>/index.html (public pages, indexable, unique head + static content),
//         same for private tool routes (noindex), dist/public/404.html (noindex), dist/public/sitemap.xml.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = process.env.SEO_DIST || join(root, 'dist/public');
const { site, routes, privatePaths } = JSON.parse(readFileSync(join(root, 'seo/routes.json'), 'utf8'));
const template = readFileSync(join(dist, 'index.html'), 'utf8');
if (template.includes('rel="canonical"')) throw new Error('dist/index.html was already processed; run vite build first');
const BUILD_DATE = process.env.SEO_LASTMOD || new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => site.url + (p === '/' ? '/' : p);
const ogImage = site.url + '/brand/hero-consultant.jpg';

function replaceTag(html, re, replacement) {
  if (!re.test(html)) throw new Error('template is missing expected tag: ' + re);
  return html.replace(re, replacement);
}

function jsonLd(route) {
  const org = {
    '@type': 'Organization', '@id': site.url + '/#org', name: site.name, url: site.url,
    logo: site.url + site.logoPath, description: site.description, telephone: site.telephone,
    founder: { '@type': 'Person', name: site.founder }, areaServed: site.areaServed,
  };
  const graph = [org];
  if (route.path === '/') {
    graph.push({ '@type': 'WebSite', '@id': site.url + '/#website', url: site.url, name: site.name,
      inLanguage: ['en', 'ar'], publisher: { '@id': site.url + '/#org' } });
  } else {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.url + '/' },
      { '@type': 'ListItem', position: 2, name: route.h1, item: abs(route.path) } ] });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function page(route) {
  let h = template;
  h = replaceTag(h, /<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`);
  h = replaceTag(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(route.description)}" />`);
  h = replaceTag(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(route.title)}" />`);
  h = replaceTag(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(route.description)}" />`);
  h = replaceTag(h, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(route.title)}" />`);
  h = replaceTag(h, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(route.description)}" />`);
  let extra = '';
  if (route.noindex) {
    h = replaceTag(h, /<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />');
  } else {
    extra += `\n    <link rel="canonical" href="${esc(abs(route.path))}" />`;
    extra += `\n    <meta property="og:url" content="${esc(abs(route.path))}" />`;
    extra += `\n    <meta property="og:image" content="${esc(ogImage)}" />`;
    extra += `\n    <meta name="twitter:image" content="${esc(ogImage)}" />`;
    extra += `\n    <script type="application/ld+json">${jsonLd(route).replace(/</g, '\\u003c')}</script>`;
  }
  h = replaceTag(h, /<\/head>/, `${extra}\n  </head>`);
  if (!route.noindex) {
    // Static, crawlable content. React replaces it on load (createRoot), so users never see it twice.
    const body = `<main style="max-width:48rem;margin:3rem auto;padding:0 1rem;font-family:system-ui,sans-serif">` +
      `<h1>${esc(route.h1)}</h1><p>${esc(route.summary)}</p>` +
      `<nav aria-label="Primary"><a href="/">Home</a> · <a href="/solutions/supply-chain-strategy">Solutions</a> · ` +
      `<a href="/about">About</a> · <a href="/insights">Insights</a> · <a href="/consultant">Book a consultation</a></nav></main>` +
      `<noscript><p>${esc(site.name)} requires JavaScript for its interactive tools. Contact: ${esc(site.telephone)}.</p></noscript>`;
    h = replaceTag(h, /<div id="root"><\/div>/, `<div id="root">${body}</div>`);
  }
  return h;
}

function write(rel, content) {
  const out = join(dist, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
}

let count = 0;
for (const route of routes) {
  write(route.path === '/' ? 'index.html' : join(route.path, 'index.html'), page(route));
  count++;
}
const generic = { title: `${site.name} — Private tool`, description: `${site.name} interactive tool.`, noindex: true };
for (const p of privatePaths) {
  if (routes.some((r) => r.path === p)) continue;
  write(join(p, 'index.html'), page({ ...generic, path: p, h1: site.name, summary: '' }));
  count++;
}
write('404.html', page({ title: `Page not found | ${site.name}`, description: 'This page does not exist.', noindex: true, path: '/404', h1: 'Page not found', summary: '' }));

const urls = routes.map((r) => `  <url><loc>${esc(abs(r.path))}</loc><lastmod>${BUILD_DATE}</lastmod>` +
  `<changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`seo-postbuild: ${count} route shells, 404.html, sitemap.xml (${routes.length} URLs)`);
