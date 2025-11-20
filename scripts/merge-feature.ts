#!/usr/bin/env tsx
/**
 * Merge Feature Branch Workflow
 *
 * Automates the process of merging a feature/bug branch to main:
 * 1. TypeScript type check
 * 2. Update docs (CHANGELOG.md, BACKLOG.md)
 * 3. Commit work with one-line message
 * 4. Rebase with main
 * 5. Merge to main
 * 6. Create version tag and push
 *
 * Usage:
 *   npx tsx scripts/merge-feature.ts <commit-message> <version>
 *
 * Example:
 *   npx tsx scripts/merge-feature.ts "Fix subscription cancellation bug" "0.11.8"
 */

import { execSync } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function updatePackageVersion(version: string) {
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
  packageJson.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
}

function exec(command: string, description: string) {
  console.log(`\n📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    if (output) console.log(output);
    console.log(`✅ ${description} complete`);
  } catch (error: any) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: npx tsx scripts/merge-feature.ts <commit-message> <version>

Example: npx tsx scripts/merge-feature.ts "Fix subscription bug" "0.11.8"
    `);
    process.exit(1);
  }

  const commitMessage = args[0];
  const version = args[1];

  // Get current branch
  const currentBranch = execSync("git branch --show-current", {
    encoding: "utf-8",
  }).trim();

  if (currentBranch === "main") {
    console.error(
      "❌ Error: Already on main branch. Switch to a feature/bug branch first."
    );
    process.exit(1);
  }

  console.log(`
🚀 Feature Branch Merge Workflow
─────────────────────────────────
Branch: ${currentBranch}
Commit: "${commitMessage}"
Version: v${version}
  `);

  const confirm = await prompt("Continue? (y/n): ");
  if (confirm.toLowerCase() !== "y") {
    console.log("Aborted.");
    rl.close();
    process.exit(0);
  }

  try {
    // Step 1: TypeScript check
    exec("npx tsc --noEmit", "TypeScript type check");

    // Step 2: Update package.json version
    console.log(`\n📦 Updating package.json version to ${version}...`);
    updatePackageVersion(version);
    console.log("✅ Package version updated");

    // Step 3: Check for uncommitted docs changes (including package.json)
    const status = execSync(
      "git status --porcelain CHANGELOG.md BACKLOG.md package.json",
      {
        encoding: "utf-8",
      }
    ).trim();

    if (status) {
      console.log("\n📝 Documentation changes detected:");
      console.log(status);

      const commitDocs = await prompt(
        "\nCommit documentation updates? (y/n): "
      );
      if (commitDocs.toLowerCase() === "y") {
        exec(
          "git add CHANGELOG.md BACKLOG.md package.json",
          "Stage documentation"
        );
        exec('git commit -m "Update docs"', "Commit documentation");
      }
    } else {
      console.log("\n✅ No documentation changes to commit");
    }

    // Step 4: Check for other uncommitted changes
    const remainingChanges = execSync("git status --porcelain", {
      encoding: "utf-8",
    }).trim();

    if (remainingChanges) {
      console.log("\n📝 Uncommitted changes detected:");
      console.log(remainingChanges);

      const commitChanges = await prompt(
        `\nCommit with message "${commitMessage}"? (y/n): `
      );
      if (commitChanges.toLowerCase() === "y") {
        exec("git add .", "Stage all changes");
        exec(`git commit -m "${commitMessage}"`, "Commit changes");
      } else {
        console.log("❌ Please commit or stash changes before merging.");
        process.exit(1);
      }
    } else {
      console.log("\n✅ No uncommitted changes");
    }

    // Step 5: Rebase with main
    exec("git checkout main", "Switch to main");
    exec("git pull origin main", "Pull latest main");
    exec(`git checkout ${currentBranch}`, `Switch back to ${currentBranch}`);
    exec("git rebase main", "Rebase with main");

    // Step 6: Merge to main
    exec("git checkout main", "Switch to main");
    exec(`git merge ${currentBranch}`, `Merge ${currentBranch} into main`);

    // Step 7: Extract changelog entry for this version
    console.log(`\n📝 Extracting changelog for v${version}...`);
    let changelogContent = "";
    try {
      const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
      const changelogText = fs.readFileSync(changelogPath, "utf-8");

      // Extract the section for this version
      const versionRegex = new RegExp(
        `## ${version.replace(/\./g, "\\.")}[\\s\\S]*?(?=\\n## |$)`,
        "i"
      );
      const match = changelogText.match(versionRegex);

      if (match) {
        changelogContent = match[0].trim();
        console.log("✅ Changelog entry extracted");
      } else {
        console.log("⚠️  No changelog entry found for this version");
      }
    } catch (error: any) {
      console.log("⚠️  Could not read CHANGELOG.md:", error.message);
    }

    // Step 8: Create annotated tag with changelog
    if (changelogContent) {
      // Write changelog to temp file for tag message
      const tempFile = path.join(process.cwd(), ".git-tag-message.tmp");
      fs.writeFileSync(tempFile, changelogContent);

      exec(
        `git tag -a v${version} -F "${tempFile}"`,
        `Create annotated tag v${version} with changelog`
      );

      // Clean up temp file
      fs.unlinkSync(tempFile);
    } else {
      exec(`git tag v${version}`, `Create tag v${version}`);
    }

    exec("git push origin main", "Push main to remote");
    exec(`git push origin v${version}`, `Push tag v${version}`);

    console.log(`
✨ Success! Feature branch merged to main
─────────────────────────────────────────
Branch: ${currentBranch} → main
Version: v${version}
Commit: "${commitMessage}"

Next steps:
- Delete feature branch: git branch -d ${currentBranch}
- Delete remote branch: git push origin --delete ${currentBranch}
    `);
  } catch (error: any) {
    console.error("\n❌ Workflow failed:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
