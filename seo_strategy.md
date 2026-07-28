# SEO Strategy — I Supply Chain

## In scope
- Public-facing pages of the `artifacts/i-supply-chain` React SPA: Home (`/`), About (`/about`), Insights (`/insights`), CSR (`/csr`), Case Studies (`/case-studies`), Consultant (`/consultant`), and industry/solution detail pages.

## Out of scope
- Command Centre, Diagnostic, Maturity, Intelligence, Login — these are authenticated/tool pages intentionally excluded from indexing via `robots.txt`.

## Target audience
- C-suite and supply chain executives in the GCC region (Saudi Arabia focus) seeking AI-powered supply chain consultancy services.

## Primary keywords
- Supply chain consultancy GCC / Saudi Arabia
- AI supply chain intelligence
- Vision 2030 supply chain
- Ma'in Alhaqash MCIPS CPSM (personal brand)

## Site type
- Pure React SPA (Vite + Wouter). No SSR. All content is client-side rendered.
- Deployed under `/i-supply-chain` base path.
- API backend is a separate Express service at `artifacts/api-server`.

## Crawler assumptions
- Googlebot may render JS eventually, but social bots and most AI crawlers will not.
- AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) are **intentionally blocked** in `robots.txt`. This is a deliberate proprietary IP protection strategy — do not flag as an issue.

## Dismissed categories
- AI crawler blocking in robots.txt — intentional strategy decision.
