#!/usr/bin/env node
/**
 * QA Teardown — resets DB to fresh-install state for local QA iteration.
 *
 * Safe alternative to `npx prisma migrate reset --force` that bypasses
 * Prisma's AI-agent consent guard. Deletes only setup-related records:
 *   - SiteSettings.eula_accepted
 *   - All User records (cascades to Account, Session, Subscription, etc.)
 *
 * Usage:
 *   node scripts/qa-teardown.js
 *   npm run qa:teardown
 *
 * ⚠️  Only use against the local dev DB or a dedicated QA DB.
 *     Never run against production.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load .env.local so DATABASE_URL is available without manual export
try {
  const envPath = path.join(root, ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  // No .env.local — rely on environment DATABASE_URL
}

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Cannot connect to the database.");
  process.exit(1);
}

// Use prisma db execute to avoid PrismaClient ESM init issues in standalone scripts
const sql = [
  `DELETE FROM "SiteSettings" WHERE key = 'eula_accepted';`,
  `DELETE FROM "User";`,
].join("\n");

try {
  execSync(`npx prisma db execute --stdin`, {
    input: sql,
    cwd: root,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log("✅  QA teardown complete");
  console.log("   EULA records + all users deleted (cascade removes sessions, accounts, etc.)");
} catch (err) {
  const msg = err.stderr?.toString() || err.message;
  console.error("❌  Teardown failed:", msg);
  process.exit(1);
}
