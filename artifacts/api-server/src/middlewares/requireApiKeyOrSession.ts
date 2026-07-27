import { createHash } from "crypto";
import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, apiKeysTable } from "@workspace/db";
import { logger } from "../lib/logger";

/**
 * Middleware that accepts either:
 *   1. An API key  → `Authorization: Bearer isk_…`
 *   2. A session   → `req.session.userId` set by express-session
 *
 * On success it writes the resolved user ID into `res.locals.userId`
 * so downstream v1 route handlers can read it without touching the session.
 */
export const requireApiKeyOrSession: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice(7).trim();
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    try {
      const rows = await db
        .select({
          id:        apiKeysTable.id,
          userId:    apiKeysTable.userId,
          scope:     apiKeysTable.scope,
          revokedAt: apiKeysTable.revokedAt,
        })
        .from(apiKeysTable)
        .where(eq(apiKeysTable.keyHash, keyHash))
        .limit(1);

      const key = rows[0];
      if (!key) {
        res.status(401).json({ ok: false, error: "Invalid API key" });
        return;
      }
      if (key.revokedAt) {
        res.status(401).json({ ok: false, error: "API key has been revoked" });
        return;
      }

      // Scope enforcement: read-only keys may not modify data
      const method = req.method.toUpperCase();
      const isWriteMethod = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
      if (key.scope === "read" && isWriteMethod) {
        res.status(403).json({ ok: false, error: "This API key is read-only and cannot perform write operations" });
        return;
      }

      // Update lastUsedAt — fire and forget, never block the response
      db.update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, key.id))
        .catch(err => logger.error({ err }, "Failed to update API key lastUsedAt"));

      res.locals.userId = key.userId;
      next();
      return;
    } catch (err) {
      logger.error({ err }, "API key lookup failed");
      res.status(500).json({ ok: false, error: "Server error" });
      return;
    }
  }

  // Fall back to session auth
  if (!req.session?.userId) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }
  res.locals.userId = req.session.userId;
  next();
};
