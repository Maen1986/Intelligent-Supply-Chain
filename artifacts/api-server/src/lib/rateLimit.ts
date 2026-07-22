import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { pgPool } from "./pgPool";
import { PgRateLimitStore } from "./pgRateLimitStore";
import { logger } from "./logger";

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
const LEADS_LIMIT = 5;

export const leadsRateLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: LEADS_LIMIT,
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

/* Read-only view of a visitor's rate-limit state for a given limiter — does
 * NOT consume quota. Lets the frontend re-validate its countdown against the
 * server (device clocks drift, laptops sleep). Fails open (not limited) if
 * the store is unreachable, matching the limiters' own fail-open posture. */
async function getRateLimitStatus(
  limiter: ReturnType<typeof rateLimit>,
  limit: number,
  req: Request,
): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  try {
    // Same key derivation as express-rate-limit's default keyGenerator.
    const key = ipKeyGenerator(req.ip ?? "");
    const info = await limiter.getKey(key);
    if (info?.resetTime && info.totalHits >= limit) {
      const retryAfterSeconds = Math.ceil(
        (info.resetTime.getTime() - Date.now()) / 1000,
      );
      if (retryAfterSeconds > 0) return { limited: true, retryAfterSeconds };
    }
  } catch (err) {
    logger.warn({ err }, "[rate-limit] status lookup failed; reporting open");
  }
  return { limited: false, retryAfterSeconds: 0 };
}

export const getLeadsRateLimitStatus = (req: Request) =>
  getRateLimitStatus(leadsRateLimiter, LEADS_LIMIT, req);

// Feedback submissions: 5 per IP per hour (same posture as leads), backed by
// PostgreSQL so the limit survives restarts. Fails open if the DB is down.
const FEEDBACK_LIMIT = 5;

export const feedbackRateLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: FEEDBACK_LIMIT,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 3600;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      ok: false,
      error: "Too many feedback submissions. Please try again later.",
      retryAfterSeconds,
    });
  },
  ...(isTest ? {} : { store: new PgRateLimitStore(pgPool, "feedback") }),
});

export const getFeedbackRateLimitStatus = (req: Request) =>
  getRateLimitStatus(feedbackRateLimiter, FEEDBACK_LIMIT, req);

// Registration throttle: 20 sign-ups per IP per 15 minutes, backed by
// PostgreSQL outside tests so the limit survives restarts. Fails open if
// the DB is unreachable — the global in-memory limiter still applies.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 900;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      ok: false,
      error: "Too many registration attempts. Please try again later.",
      retryAfterSeconds,
    });
  },
  ...(isTest ? {} : { store: new PgRateLimitStore(pgPool, "auth") }),
});

// Forgot-password / reset-password throttle: 5 requests per IP per 15 minutes.
// Must NOT use skipSuccessfulRequests because forgot-password intentionally
// returns 200 even for unknown emails (anti-enumeration), so every request must
// consume quota to prevent email-bombing / cost amplification attacks.
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 900;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      ok: false,
      error: "Too many attempts. Please try again later.",
      retryAfterSeconds,
    });
  },
  ...(isTest ? {} : { store: new PgRateLimitStore(pgPool, "forgot-password") }),
});

/* Login brute-force throttle: 5 FAILED sign-in attempts per minute, keyed by
 * IP + target email. Successful logins don't consume quota, so legitimate
 * users signing in/out normally are never affected; an attacker hammering one
 * account (or one IP hammering many passwords) gets 429s after ~5 misses.
 * Backed by PostgreSQL outside tests so the limit survives restarts. */
const LOGIN_FAIL_LIMIT = 5;

export const loginRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: LOGIN_FAIL_LIMIT,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Only failed attempts (401/4xx/5xx) count toward the limit.
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
  },
  handler: (req, res) => {
    const resetTime: Date | undefined = (req as any).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 60;
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      ok: false,
      error: "Too many sign-in attempts. Please try again shortly.",
      retryAfterSeconds,
    });
  },
  ...(isTest ? {} : { store: new PgRateLimitStore(pgPool, "login") }),
});
