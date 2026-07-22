import express, { type Express } from "express";
import cors from "cors";
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

// ── CORS — reflect origin and allow credentials so session cookies travel ────
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
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
