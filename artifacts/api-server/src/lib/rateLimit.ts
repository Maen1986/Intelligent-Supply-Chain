import rateLimit from "express-rate-limit";
import { pgPool } from "./pgPool";
import { PgRateLimitStore } from "./pgRateLimitStore";

// Tests exercise routers in isolation with mocked infra — keep them on the
// default in-memory store so they don't need a live database.
const isTest = process.env.NODE_ENV === "test";

// Global baseline: 300 requests/min per IP across all API routes.
export const globalRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Lead submissions: 5 per IP per hour, backed by PostgreSQL so the limit
// survives server restarts and is shared across instances if the app scales
// out. The store fails open (allows requests, logs a warning) if the
// database is unreachable — the global in-memory limiter still applies.
export const leadsRateLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Blocked visitors get a Retry-After header and a machine-readable
  // retryAfterSeconds so the frontend can show "try again in ~N minutes".
  handler: (req, res) => {
    const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 3600;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      ok: false,
      error: "Too many submissions. Please try again later.",
      retryAfterSeconds,
    });
  },
  ...(isTest ? {} : { store: new PgRateLimitStore(pgPool, "leads") }),
});

// Tighter limit on authentication endpoints to slow brute-force attempts.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
