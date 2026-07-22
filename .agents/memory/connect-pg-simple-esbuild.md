---
name: connect-pg-simple esbuild bundling fix
description: connect-pg-simple v10 createTableIfMissing fails in esbuild bundles; workaround via Drizzle schema
---

## Rule
Never use `createTableIfMissing: true` with connect-pg-simple when the server is bundled with esbuild (or any bundler that strips non-JS assets).

**Why:** connect-pg-simple v10 reads a `table.sql` file from its package directory at runtime. esbuild bundles only JS — `table.sql` is not copied to `dist/`, so the store throws `ENOENT: no such file or directory, open '.../dist/table.sql'` on the first session save. The error is only visible if you add `console.error` to the `req.session.save` callback; pino swallows it silently.

**How to apply:** Add the session table to the Drizzle schema (`lib/db/src/schema/sessions.ts`) and push it via `drizzle-kit push` before server start. Pass `createTableIfMissing: false` to the PgSession store. Use `pool: new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: false })` (not `conString`) — pg must be a direct dependency of the server package, not just a transitive dep of @workspace/db.
