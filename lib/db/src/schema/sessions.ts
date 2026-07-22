// Session table schema for connect-pg-simple.
// connect-pg-simple v10's createTableIfMissing reads a bundled table.sql file
// which doesn't survive esbuild bundling. We own the table creation via Drizzle
// instead and pass createTableIfMissing: false to the session store.
import { pgTable, varchar, json, timestamp, index } from "drizzle-orm/pg-core";

export const sessionTable = pgTable(
  "session",
  {
    sid:    varchar("sid").primaryKey(),
    sess:   json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);
