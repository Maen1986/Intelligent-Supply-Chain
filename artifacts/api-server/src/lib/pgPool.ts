import pg from "pg";
import { logger } from "./logger";

// Shared PostgreSQL pool for the API server (sessions, rate limiting, …).
// Explicit pg.Pool — more reliable than passing conString to consumers
// directly, and lets us control SSL / error handling in one place.
export const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Replit's built-in PostgreSQL is localhost; no TLS needed.
  ssl: false,
});

pgPool.on("error", (err) => {
  logger.error({ err }, "[pg-pool] Unexpected idle client error");
});
