---
name: Stale TS project-reference output
description: Phantom "has no exported member" errors from @workspace/* packages
---
The API server uses TypeScript project references, so `tsc` type-checks against each lib's `dist/*.d.ts`, not its source.

**Why:** `lib/db` had new schema exports (usersTable, submissionsTable) in `src/` but a stale `dist/`, producing TS2305 errors even though runtime (which imports src directly via package `exports`) worked fine.

**How to apply:** If a `@workspace/*` import "has no exported member" that clearly exists in the lib's source, rebuild the lib with `npx tsc -b --force` in its directory before hunting for code bugs.
