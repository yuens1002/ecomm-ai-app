/**
 * Safe Migration Workflow Script
 * Handles backup → migrate → restore in a single command
 *
 * Usage:
 *   npx tsx scripts/safe-migrate.ts
 *
 * This script:
 * 1. Backs up all database data
 * 2. Runs pending Prisma migrations
 * 3. Optionally restores data if migration succeeds
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as readline from "readline";

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function safeMigrate() {
  console.log("🛡️  Safe Migration Workflow\n");
  console.log("This script will:");
  console.log("  1. Backup all database data");
  console.log("  2. Run Prisma migrations");
  console.log("  3. Optionally restore data\n");

  try {
    // Step 1: Backup
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 1: Backing up database");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const backupResult = await execAsync(
      "npx tsx scripts/backup-database.ts"
    );
    console.log(backupResult.stdout);
    if (backupResult.stderr) {
      console.error("Backup warnings:", backupResult.stderr);
    }

    console.log("✅ Backup completed\n");

    // Ask user if they want to proceed with migration
    const proceedMigration = await question(
      "Proceed with migration? (yes/no): "
    );
    if (
      proceedMigration.toLowerCase() !== "yes" &&
      proceedMigration.toLowerCase() !== "y"
    ) {
      console.log("❌ Migration cancelled by user");
      rl.close();
      process.exit(0);
    }

    // Step 2: Migration
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("STEP 2: Running migrations");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const migrateResult = await execAsync("npx prisma migrate deploy");
    console.log(migrateResult.stdout);
    if (migrateResult.stderr) {
      console.error("Migration warnings:", migrateResult.stderr);
    }

    console.log("✅ Migrations completed\n");

    // Step 3: Ask about restoration
    const restoreData = await question(
      "Do you want to restore the backed up data? (yes/no): "
    );

    if (
      restoreData.toLowerCase() === "yes" ||
      restoreData.toLowerCase() === "y"
    ) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("STEP 3: Restoring data");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

      const restoreResult = await execAsync(
        "npx tsx scripts/restore-database.ts"
      );
      console.log(restoreResult.stdout);
      if (restoreResult.stderr) {
        console.error("Restore warnings:", restoreResult.stderr);
      }

      console.log("✅ Data restored\n");
    } else {
      console.log("\n⏭️  Skipping data restoration");
      console.log("📝 You can restore manually later with:");
      console.log("   npx tsx scripts/restore-database.ts\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Safe migration workflow completed!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("\n❌ Error during migration workflow:", error);
    console.log("\n🛟 Recovery options:");
    console.log("   1. Restore from backup:");
    console.log("      npx tsx scripts/restore-database.ts");
    console.log("   2. Check backup files in:");
    console.log("      scripts/backups/\n");
    process.exit(1);
  } finally {
    rl.close();
  }
}

safeMigrate();
