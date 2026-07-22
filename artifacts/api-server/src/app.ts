import express, { type Express } from "express";
import cors from "cors";
import { globalRateLimiter } from "./lib/rateLimit";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import router from "./routes";
import { logger } from "./lib/logger";
import { checkEmailConfig } from "./routes/notify";

const PgSession = connectPgSimple(session);

// Explicit pg.Pool — more reliable than passing conString directly to
// connect-pg-simple, and lets us control SSL / error handling clearly.
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Replit's built-in PostgreSQL is localhost; no TLS needed.
  ssl: false,
});

pgPool.on("error", (err) => {
  logger.error({ err }, "[pg-pool] Unexpected idle client error");
});

const app: Express = express();

// Behind Replit's reverse proxy — trust the first hop so req.ip reflects the
// real client IP (required for accurate per-IP rate limiting).
app.set("trust proxy", 1);

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── CORS — explicit origin allowlist (no wildcard / blind reflection) ────────
// In practice the frontend is served from the same origin via Replit's
// path-based proxy, so cross-origin requests are only expected from the
// app's own domains. Extra origins can be added via ALLOWED_ORIGINS
// (comma-separated full origins, e.g. "https://example.com").
const allowedOrigins = new Set<string>(
  [
    ...(process.env.REPLIT_DOMAINS?.split(",") ?? []),
    process.env.REPLIT_DEV_DOMAIN,
  ]
    .filter((d): d is string => Boolean(d))
    .map((d) => `https://${d.trim()}`)
    .concat(
      (process.env.ALLOWED_ORIGINS?.split(",") ?? [])
        .map((o) => o.trim())
        .filter(Boolean),
    ),
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin and non-browser requests send no Origin header — allow.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false); // CORS headers omitted; browser blocks the read
      }
    },
    credentials: true,
  }),
);

// ── Rate limiting (global baseline; tighter auth limiter lives in routes) ────
app.use(globalRateLimiter);

// 25mb limit: Command Centre submissions include a base64-encoded PDF briefing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Server-side sessions (PostgreSQL-backed via connect-pg-simple) ────────────
// connect-pg-simple auto-creates the `session` table on first run.
// The session ID lives in an httpOnly cookie called `isc.sid` — it is
// NOT accessible from JavaScript and CANNOT be spoofed via localStorage.
app.use(
  session({
    name:  "isc.sid",
    store: new PgSession({
      pool: pgPool,
      // Table is created by Drizzle schema push, not by connect-pg-simple.
      // (v10's createTableIfMissing reads a bundled table.sql that esbuild
      // strips from the dist output, causing an ENOENT crash.)
      createTableIfMissing: false,
      ttl: 30 * 24 * 60 * 60, // 30 days (seconds)
    }),
    secret:            process.env.SESSION_SECRET ?? "isc-dev-fallback-change-in-prod",
    resave:            false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure:   false,   // Replit terminates TLS at the proxy layer
      maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days (ms)
    },
  }),
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Startup checks ───────────────────────────────────────────────────────────
checkEmailConfig();

export default app;
