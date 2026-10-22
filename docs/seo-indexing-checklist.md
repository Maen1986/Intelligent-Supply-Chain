# SEO & Indexing Checklist (iscsupplychain.com)

Last updated 22 Oct 2026. Code side is shipped by the build (`seo/routes.json` -> `scripts/seo-postbuild.mjs`). Items below need the site owner's accounts.

## What the build now does
- Every public page gets its own HTML file with a unique title, description, canonical, Open Graph/Twitter tags, JSON-LD and crawlable heading + summary text.
- Tool, account and admin pages get `noindex` shells. `404.html` is `noindex`.
- `sitemap.xml` lists the 33 public URLs. `robots.txt` references it and still blocks the AI-training crawlers (policy in `seo_strategy.md`).
- `SeoManager` keeps title/description/canonical/robots correct during client-side navigation; unknown paths become `noindex`.

## Owner-only steps
1. Google Search Console: add a **Domain** property for `iscsupplychain.com`, verify with the DNS TXT record at the domain registrar, submit `https://iscsupplychain.com/sitemap.xml`, then use URL Inspection > Request indexing on `/`, `/about`, `/solutions/supply-chain-strategy`.
2. Bing Webmaster Tools: sign in and import the site from Search Console.
3. Create the real LinkedIn company page (and X account if wanted), then put the URLs in `src/config.ts` (`SOCIAL_LINKS`). Icons stay hidden until set.
4. Decide one public contact email; `index.html` meta currently uses haqash.maen@gmail.com.
5. Render dashboard (isc-frontend > Redirects/Rewrites): the `/* -> /index.html` rewrite makes unknown URLs return 200. Remove it so `404.html` is served with a real 404. Per-route files take priority over rewrites, so removal is safe once this build is live.

## Verify after deploy
- `curl -s https://iscsupplychain.com/about | grep -E "<title>|canonical"` shows the About title and canonical.
- `https://iscsupplychain.com/sitemap.xml` returns XML with 33 URLs; `/robots.txt` shows the `Sitemap:` line.
- Search `site:iscsupplychain.com` after 1-3 weeks. New domains with a common name ("ISC") rank slowly; also search the exact brand "I Supply Chain".
