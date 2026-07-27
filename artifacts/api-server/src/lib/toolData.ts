/**
 * Shared helpers for reading and patching the users.tool_data JSONB column.
 * Extracted so both v1.ts and webhooksInbound.ts (and future routes) can
 * import them without circular dependencies.
 */
import { sql } from "drizzle-orm";
import { db }  from "@workspace/db";

export async function getUserToolData(userId: number): Promise<{
  scorecard_roster: unknown;
  tool_data: Record<string, unknown> | null;
} | undefined> {
  const result = await db.execute(
    sql`SELECT scorecard_roster, tool_data FROM users WHERE id = ${userId}`,
  );
  return result.rows?.[0] as {
    scorecard_roster: unknown;
    tool_data: Record<string, unknown> | null;
  } | undefined;
}

export async function patchToolData(userId: number, patch: Record<string, unknown>): Promise<void> {
  const row    = await getUserToolData(userId);
  const merged = { ...(row?.tool_data ?? {}), ...patch };
  await db.execute(
    sql`UPDATE users SET tool_data = ${JSON.stringify(merged)}::jsonb WHERE id = ${userId}`,
  );
}
