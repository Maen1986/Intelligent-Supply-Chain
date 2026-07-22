# Threat Model

## Project Overview

A supply chain diagnostic and consulting booking web application. The frontend (`i-supply-chain`) is a React/Vite SPA that lets users complete a multi-step questionnaire and receive a template-generated supply chain diagnostic report. It also provides a consultant booking form. Both forms POST directly to an n8n cloud webhook endpoint. The backend (`api-server`) is an Express 5 + Node.js server with only a health-check route currently implemented. Stack: pnpm workspaces, Node 24, TypeScript 5.9, Drizzle ORM (PostgreSQL), Zod validation. Not currently deployed.

## Assets

- **Lead data** — full name, email, company name, booking details submitted via the consultant form; supply chain diagnostic answers. Sent to an external n8n webhook. Leakage or abuse would harm user privacy and business interests.
- **n8n Webhook endpoints** — hardcoded in the frontend bundle. Unauthorized POST requests could flood the webhook with garbage lead data, consuming n8n credits and polluting the CRM pipeline.
- **Future API endpoints** — the Express server is a skeleton today but will grow. Current CORS and middleware posture will apply to all future routes.
- **Application secrets / DATABASE_URL** — the only secret currently is the Postgres connection string supplied via environment variable. No secrets are hardcoded in source.

## Trust Boundaries

- **Browser to n8n webhook** — the frontend posts lead/booking data directly from the browser to an external SaaS webhook URL. There is no server-side proxy, no authentication, and no rate limiting between the end user and the webhook.
- **Browser to Express API** — the API currently only serves `/api/healthz`. The Express app accepts requests from any origin (wildcard CORS). As new routes are added they will inherit this permissive posture.
- **Express API to PostgreSQL** — uses Drizzle ORM; parameterized queries are the default. Not yet in use beyond schema setup.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/app.ts` (Express app), `artifacts/i-supply-chain/src/pages/Diagnostic.tsx`, `artifacts/i-supply-chain/src/pages/Consultant.tsx`
- **Highest-risk code areas**: CORS config in `app.ts`; webhook dispatch in `Diagnostic.tsx` and `Consultant.tsx`; hardcoded webhook URLs in `src/config.ts`
- **Public surface**: entire frontend is public (no auth); API has one public health endpoint
- **Dev-only**: `artifacts/mockup-sandbox/` — Vite mockup preview plugin, not deployed to production

## Threat Categories

### Spoofing / Tampering (Webhook Abuse)

The n8n webhook URLs are compiled into the public client-side bundle (`src/config.ts`). Any party who views the page source or network traffic can extract the URL and POST arbitrary payloads to the webhook endpoint. There is no HMAC signature, no API key, no rate limiting, and no server-side proxy to validate or throttle requests. An attacker could flood the webhook with fabricated leads or booking requests, corrupting downstream CRM data and exhausting n8n execution credits.

**Required guarantee**: Webhook calls MUST be proxied through the application's own backend with server-side rate limiting and optionally HMAC verification, rather than called directly from browser code.

### Security Misconfiguration (CORS)

`app.use(cors())` with no options enables the wildcard `Access-Control-Allow-Origin: *` policy on all API routes. If future routes carry session cookies or rely on `SameSite` protections, a wildcard CORS policy will undermine them. Credentials cannot be sent cross-origin with a wildcard origin, but the permissive policy still allows unauthenticated cross-origin reads from any domain.

**Required guarantee**: CORS MUST be restricted to known frontend origins (e.g., the Replit deployment URL) before any authenticated routes are added.

### Denial of Service

No rate limiting middleware is present on the Express server. As endpoints are added (authentication, report generation, data submission), unauthenticated callers will be able to send unbounded requests.

**Required guarantee**: Rate limiting (e.g., `express-rate-limit`) MUST be applied to all public endpoints before launch.

### Information Disclosure

The free-text `challenge` field in the diagnostic form and `description` field in the consultant booking form are forwarded verbatim to the external webhook with no size cap. Excessively large payloads could be used to probe webhook behavior or send unexpected data downstream.
