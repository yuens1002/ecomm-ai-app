#!/usr/bin/env node
/**
 * QA Reset — reads QA_DATABASE_URL from .env.local and runs qa-teardown against it.
 *
 * This is a local-only convenience wrapper. In CI, the nightly workflow sets
 * DATABASE_URL and QA_DB_ENDPOINT directly as environment variables and calls
 * qa-teardown.js directly.
 *
 * Usage:
 *   node scripts/qa-reset.js
 *   npm run qa:reset
 *
 * Requires in .env.local:
 *   QA_DATABASE_URL  — Neon pooled connection string for the QA branch
 *
 * QA_DB_ENDPOINT is derived automatically from QA_DATABASE_URL (the ep-* fragment).
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Read .env.local
let lines = [];
try {
  lines = readFileSync(path.join(root, ".env.local"), "utf8").split("\n");
} catch {
  console.error("❌  .env.local not found. Cannot read QA_DATABASE_URL.");
  process.exit(1);
}

const get = (key) => {
  const match = lines.find((l) => l.trim().startsWith(key + "="));
  return match ? match.slice(match.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : "";
};

const qaUrl = get("QA_DATABASE_URL");
if (!qaUrl) {
  console.error("❌  QA_DATABASE_URL not found in .env.local.");
  process.exit(1);
}

const endpointMatch = qaUrl.match(/(ep-[a-z0-9-]+)/);
if (!endpointMatch) {
  console.error("❌  Could not extract Neon endpoint ID from QA_DATABASE_URL.");
  console.error("   Expected a hostname like ep-cool-name-a1b2c3.us-east-2.aws.neon.tech");
  process.exit(1);
}

const endpoint = endpointMatch[1];

execSync("node scripts/qa-teardown.js", {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: qaUrl,
    QA_DB_ENDPOINT: endpoint,
  },
});
