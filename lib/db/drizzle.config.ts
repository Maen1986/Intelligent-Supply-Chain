import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // inbound_webhook_log was created in production with a legacy `id text` column
  // from an older schema.  Excluding it from drizzle-kit prevents the invalid
  // `ALTER COLUMN id SET DATA TYPE serial` that blocks every publish.
  // The app-level insert supplies an explicit text id so inserts still work.
  tablesFilter: ["!inbound_webhook_log"],
});
