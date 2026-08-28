/**
 * requireAdminApiKeyOrSession — allow only callers who are either:
 *   1. An admin's API key  → `Authorization: Bearer isk_…` where the owning
 *      user has role = 'admin', OR
 *   2. An authenticated admin session (cookie-based).
 *
 * Built for #450/#451 (BCP risk register): the daily database-backup
 * scheduled task is a headless process with no browser session, so it needs
 * a machine credential. Ordinary requireApiKeyOrSession doesn't check role,
 * and requireAdmin doesn't accept API keys — this middleware is the
 * intersection, scoped tightly to admin-only, backup-only use.
 */
import { createHash } from "crypto";
import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db, apiKeysTable, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";

export const requireAdminApiKeyOrSession: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice(7).trim();
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    try {
      const rows = await db
        .select({
          id:        apiKeysTable.id,
          userId:    apiKeysTable.userId,
          revokedAt: apiKeysTable.revokedAt,
          role:      usersTable.role,
        })
        .from(apiKeysTable)
        .innerJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
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
      if (key.role !== "admin") {
        res.status(403).json({ ok: false, error: "Admin API key required" });
        return;
      }

      db.update(apiKeysTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeysTable.id, key.id))
        .catch(err => logger.error({ err }, "Failed to update API key lastUsedAt"));

      res.locals.userId = key.userId;
      next();
      return;
    } catch (err) {
      logger.error({ err }, "Admin API key lookup failed");
      res.status(500).json({ ok: false, error: "Server error" });
      return;
    }
  }

  // Fall back to session auth
  if (!req.session?.userId) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }
  if (req.session.userRole !== "admin") {
    res.status(403).json({ ok: false, error: "Admin access required" });
    return;
  }
  res.locals.userId = req.session.userId;
  next();
};
