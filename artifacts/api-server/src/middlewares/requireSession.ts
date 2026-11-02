/**
 * requireSession — allow only requests with a valid session cookie.
 * Unlike requireApiKeyOrSession, Bearer API-key access is not accepted here
 * because plans are personal UI state, not machine-to-machine data.
 */
import { Request, Response, NextFunction } from "express";

export function requireSession(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId as number | undefined;
  // Round C (#668): the session id is a database integer. A string / 0 / NaN here is a corrupted session, not a user.
  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }
  res.locals.userId = userId;
  next();
}
