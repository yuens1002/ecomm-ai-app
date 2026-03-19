/**
 * Playwright global setup — runs once before all tests.
 *
 * Clears the license key from the DB so activate.spec.ts always starts
 * in FREE state, regardless of previous test runs.
 */

import dotenv from "dotenv";
import path from "node:path";

// Load .env files so DATABASE_URL is available (imports are hoisted, but
// dotenv only needs to run before the neon() call below)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[e2e global-setup] DATABASE_URL not set — skipping license key cleanup");
    return;
  }

  // Use neon serverless driver directly — avoids Prisma adapter init complexity
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  await sql`DELETE FROM "SiteSettings" WHERE key = 'license.key'`;
  console.log("[e2e global-setup] Cleared license.key from DB");
}
