import type { Store, Options, IncrementResponse } from "express-rate-limit";
import type pg from "pg";
import { logger } from "./logger";

/* PostgreSQL-backed store for express-rate-limit (fixed window).
 *
 * Counts live in the `rate_limit_hits` table, so limits survive server
 * restarts and are shared across instances if the app ever scales out.
 *
 * Fail-open by design: if the database is unreachable, requests are allowed
 * (with a logged warning) rather than erroring — the rate limit here is an
 * abuse guard, not a security boundary, and the global in-memory limiter
 * still applies upstream.
 */
export class PgRateLimitStore implements Store {
  private windowMs = 60_000;
  private tableReady: Promise<void> | undefined;

  constructor(
    private readonly pool: pg.Pool,
    /** Namespaces keys so multiple limiters can share the table.
     *  Public to satisfy express-rate-limit's Store interface. */
    public readonly prefix: string,
  ) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private ensureTable(): Promise<void> {
    this.tableReady ??= this.pool
      .query(
        `CREATE TABLE IF NOT EXISTS rate_limit_hits (
           key        text PRIMARY KEY,
           count      integer NOT NULL,
           expires_at timestamptz NOT NULL
         )`,
      )
      .then(() => undefined);
    return this.tableReady;
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<IncrementResponse> {
    try {
      await this.ensureTable();
      // Atomic fixed-window upsert: start a fresh window if the old one
      // expired, otherwise bump the counter within the current window.
      const { rows } = await this.pool.query(
        `INSERT INTO rate_limit_hits (key, count, expires_at)
         VALUES ($1, 1, now() + $2::bigint * interval '1 millisecond')
         ON CONFLICT (key) DO UPDATE SET
           count = CASE WHEN rate_limit_hits.expires_at <= now()
                        THEN 1 ELSE rate_limit_hits.count + 1 END,
           expires_at = CASE WHEN rate_limit_hits.expires_at <= now()
                             THEN now() + $2::bigint * interval '1 millisecond'
                             ELSE rate_limit_hits.expires_at END
         RETURNING count, expires_at`,
        [this.key(key), this.windowMs],
      );
      // Opportunistically prune stale rows (~1% of increments).
      if (Math.random() < 0.01) {
        this.pool
          .query(`DELETE FROM rate_limit_hits WHERE expires_at <= now()`)
          .catch(() => {});
      }
      return {
        totalHits: rows[0].count,
        resetTime: new Date(rows[0].expires_at),
      };
    } catch (err) {
      logger.warn({ err }, "[rate-limit] PG store unavailable; failing open");
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE rate_limit_hits SET count = GREATEST(count - 1, 0) WHERE key = $1`,
        [this.key(key)],
      );
    } catch (err) {
      logger.warn({ err }, "[rate-limit] PG store decrement failed");
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.pool.query(`DELETE FROM rate_limit_hits WHERE key = $1`, [
        this.key(key),
      ]);
    } catch (err) {
      logger.warn({ err }, "[rate-limit] PG store resetKey failed");
    }
  }
}
