---
name: Dev DB schema push
description: How to apply new Drizzle schema tables to the development database when drizzle-kit push fails
---

`pnpm run push` in `lib/db` (drizzle-kit push) fails in non-interactive shells whenever the diff needs a prompt (e.g. a brand-new table triggers a create-vs-rename question): "Interactive prompts require a TTY terminal".

**Why:** drizzle-kit's conflict resolver always prompts, and the agent shell has no TTY; `--force` does not skip the rename prompt.

**How to apply:** When a new table exists in `lib/db/src/schema/` but not in the dev DB (API returns 500 "Failed to save ..."), create the table directly with `executeSql` DDL matching the Drizzle schema. Production schema is synced automatically at Publish time — never script prod migrations.
