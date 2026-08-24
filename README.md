# I Supply Chain

An AI-powered supply chain, procurement, contract, and risk management platform for the Saudi/GCC market, with bilingual (Arabic/English) support throughout.

## Repository structure

This is a pnpm monorepo (see `pnpm-workspace.yaml`):

```
artifacts/
  i-supply-chain/   Frontend web app (Vite + React)
  api-server/       Backend API (Express)
  e2e-tests/        Playwright end-to-end tests
  mockup-sandbox/   Design/prototyping sandbox
lib/
  db/                          Drizzle ORM schema + migrations (PostgreSQL)
  api-client-react/            Generated API client hooks
  api-spec/                    OpenAPI spec + codegen (orval)
  api-zod/                     Shared Zod schemas
  integrations-openai-ai-*/    OpenAI integration (server + React)
scripts/            One-off/maintenance scripts
```

## Requirements

- **Node.js 20** and **pnpm 9** — this is what CI (`.github/workflows/ci.yml`) actually installs and verifies against; treat other versions as unverified, not necessarily broken.
- **PostgreSQL 16** — a real, reachable database. CI spins up `postgres:16` as a service container for tests.

## Getting started

```bash
pnpm install --frozen-lockfile
```

You'll need a `.env` (or equivalent) with at minimum `DATABASE_URL` and `PORT` set — see [Environment variables](#environment-variables) below and `.env.example`. There is no `dotenv` loader wired in; export these as real environment variables (`export $(cat .env | xargs)`, a `direnv` setup, your shell profile, or your platform's own env-var mechanism).

Push the database schema (first run, or after a schema change):

```bash
pnpm --filter @workspace/db run push
```

Run the frontend and API server in development:

```bash
pnpm --filter @workspace/i-supply-chain run dev    # Vite dev server
pnpm --filter @workspace/api-server run dev        # Express API
```

## Common scripts

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Type-checks every workspace package (`tsc --build` for libs, then each artifact's own `tsc --noEmit`). This is the same command CI runs — safe to run before opening a PR. |
| `pnpm run build` | Typecheck, then build every package that has a `build` script. |
| `pnpm --filter @workspace/i-supply-chain run test` | Frontend test suite (Vitest + Testing Library + jest-axe accessibility checks). |
| `pnpm --filter @workspace/api-server run test` | API server test suite (Vitest), needs a reachable Postgres via `DATABASE_URL`. |
| `pnpm --filter ./artifacts/e2e-tests run test:e2e` | Playwright end-to-end tests. |

## CI

Every push and PR to `main` runs `.github/workflows/ci.yml`: install, typecheck, then both test suites, against a real Postgres 16 service container on GitHub-hosted runners. Check the **Actions** tab for current status before assuming local results generalize — CI is the authoritative signal.

Known issue: `AIPlanPanel.signInPath.test.tsx` and `InboundLogTab.filter.test.tsx` fail intermittently (test flakiness, not consistently reproducible) — if you see one of these two fail in isolation with everything else green, it's a known, pre-existing issue, not something your change broke. Re-run before assuming otherwise.

## Environment variables

See `.env.example` for the full list with descriptions. The short version:

**Required to boot:**
- `DATABASE_URL` — PostgreSQL connection string.
- `PORT` — required by both the API server and the Vite dev/build config; no default.
- `BASE_PATH` — required by the Vite config (app base path); no default.

**Required only if you use the feature:**
- `AI_INTEGRATIONS_OPENAI_API_KEY` — any AI-generated content (Consultancy Engine, briefings, etc.) will throw without it.
- `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS` — file/object storage upload routes.
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — outbound email.
- `N8N_WEBHOOK_SECRET` / `N8N_LEAD_WEBHOOK_URL` / `INBOUND_WEBHOOK_SECRET` — webhook integrations.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — grants the account with this email `admin` role on login. Treat as a real secret.

**Optional, has a working default:**
- `SESSION_SECRET` — falls back to a dev-only value; **must** be set to a real secret outside local development.
- `ALLOWED_ORIGINS`, `LOG_LEVEL`, `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `EMAIL_RETRY_DELAY_MS`, `APP_URL`.

`REPLIT_*` / `REPL_ID` / `METADATA_SERVER_DETECTION` variables are auto-injected by Replit and don't need to be set anywhere else.
