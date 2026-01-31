#!/usr/bin/env npx tsx
/**
 * Upgrade script for Artisan Roast
 *
 * For self-hosted deployments to run database migrations and prepare the app.
 *
 * Usage:
 *   npm run upgrade
 *
 * What it does:
 *   1. Shows current version
 *   2. Checks migration status
 *   3. Runs pending database migrations
 *   4. Regenerates Prisma client
 *   5. Clears Next.js cache
 */

import { execSync } from "child_process";
import { existsSync, rmSync, readFileSync } from "fs";
import path from "path";

interface PackageJson {
  version: string;
}

const pkg: PackageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
);

function run(cmd: string, allowFailure = false): boolean {
  console.log(`$ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    if (!allowFailure) {
      throw new Error(`Command failed: ${cmd}`);
    }
    return false;
  }
}

function runSilent(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (error: unknown) {
    const execError = error as { stdout?: Buffer; stderr?: Buffer };
    if (execError.stdout) return execError.stdout.toString().trim();
    if (execError.stderr) return execError.stderr.toString().trim();
    return null;
  }
}

async function main() {
  console.log("\n========================================");
  console.log("   Artisan Roast Upgrade");
  console.log("========================================\n");

  // 1. Show current version
  console.log(`Current version: ${pkg.version}\n`);

  // 2. Check migration status
  console.log("Checking database migration status...\n");
  const status = runSilent("npx prisma migrate status 2>&1");

  if (status && status.includes("Database schema is up to date")) {
    console.log("Database is already up to date.\n");
  } else if (status && status.includes("Following migrations have not yet been applied")) {
    // Extract pending migration count
    const appliedMatch = status.match(/have not yet been applied:([\s\S]*?)To apply/);

    if (appliedMatch) {
      const pendingMigrations = appliedMatch[1].trim().split("\n").filter(Boolean);
      console.log(`Found ${pendingMigrations.length} pending migration(s).\n`);
    }

    // 3. Run migrations
    console.log("Applying database migrations...\n");
    run("npx prisma migrate deploy");
    console.log("\nMigrations applied successfully.\n");
  } else if (status && status.includes("Error")) {
    console.error("Error checking migration status:");
    console.error(status);
    process.exit(1);
  }

  // 4. Regenerate Prisma client
  console.log("Regenerating Prisma client...\n");
  run("npx prisma generate");

  // 5. Clear Next.js cache
  const nextCachePath = path.join(process.cwd(), ".next");
  if (existsSync(nextCachePath)) {
    console.log("\nClearing Next.js cache...");
    rmSync(nextCachePath, { recursive: true, force: true });
    console.log("Cache cleared.\n");
  }

  // Done
  console.log("========================================");
  console.log("   Upgrade complete!");
  console.log("========================================\n");
  console.log("Next steps:");
  console.log("  1. Run: npm run build");
  console.log("  2. Run: npm start (or restart your process manager)\n");
}

main().catch((err: Error) => {
  console.error("\nUpgrade failed:", err.message);
  process.exit(1);
});
