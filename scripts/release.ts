#!/usr/bin/env npx tsx
/**
 * Release script for Artisan Roast
 *
 * Usage:
 *   npm run release:patch   # 0.76.0 → 0.76.1
 *   npm run release:minor   # 0.76.0 → 0.77.0
 *   npm run release:major   # 0.76.0 → 1.0.0
 *
 * What it does:
 *   1. Bumps version in package.json and lib/version.ts
 *   2. Shows commits since last tag (for changelog reference)
 *   3. Updates CHANGELOG.md with new version header
 *   4. Commits and creates annotated tag
 *   5. Optionally pushes to origin
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, resolve));

const exec = (cmd: string) => execSync(cmd, { encoding: "utf-8" }).trim();

const run = (cmd: string) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

type BumpType = "patch" | "minor" | "major";

function bumpVersion(version: string, type: BumpType): string {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function getCurrentVersion(): string {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  return pkg.version;
}

function getLastTag(): string | null {
  try {
    return exec('git describe --tags --abbrev=0 2>/dev/null || echo ""') || null;
  } catch {
    return null;
  }
}

function getCommitsSinceTag(tag: string | null): string {
  const range = tag ? `${tag}..HEAD` : "HEAD~10..HEAD";
  try {
    return exec(`git log ${range} --oneline --no-decorate`);
  } catch {
    return "(no commits found)";
  }
}

function updatePackageJson(newVersion: string) {
  const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
  pkg.version = newVersion;
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
}

function updateVersionTs(newVersion: string) {
  const path = "lib/version.ts";
  let content = readFileSync(path, "utf-8");
  content = content.replace(
    /export const APP_VERSION = "[^"]+"/,
    `export const APP_VERSION = "${newVersion}"`
  );
  writeFileSync(path, content);
}

function updateChangelog(newVersion: string): string {
  const path = "CHANGELOG.md";
  const date = new Date().toISOString().split("T")[0];
  const header = `## ${newVersion} - ${date}`;
  const template = `${header}

### Features
-

### Bug Fixes
-

`;

  let content = readFileSync(path, "utf-8");
  content = content.replace("# Changelog\n\n", `# Changelog\n\n${template}`);
  writeFileSync(path, content);
  return path;
}

async function main() {
  const bumpType = (process.argv[2] as BumpType) || "patch";

  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error("Usage: release.ts [patch|minor|major]");
    process.exit(1);
  }

  // Check for clean working directory
  const status = exec("git status --porcelain");
  if (status) {
    console.error("❌ Working directory not clean. Commit or stash changes first.");
    console.log(status);
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);
  const lastTag = getLastTag();

  console.log("\n📦 Release Script");
  console.log("─".repeat(50));
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version:     ${newVersion} (${bumpType})`);
  console.log(`Last tag:        ${lastTag || "(none)"}`);

  // Show commits since last tag
  console.log("\n📝 Commits since last release:");
  console.log("─".repeat(50));
  const commits = getCommitsSinceTag(lastTag);
  console.log(commits || "(no commits)");
  console.log("─".repeat(50));

  // Confirm
  const confirm = await ask(`\nProceed with release v${newVersion}? (y/N) `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Aborted.");
    rl.close();
    process.exit(0);
  }

  // Update files
  console.log("\n📝 Updating version files...");
  updatePackageJson(newVersion);
  console.log("   ✓ package.json");
  updateVersionTs(newVersion);
  console.log("   ✓ lib/version.ts");
  updateChangelog(newVersion);
  console.log("   ✓ CHANGELOG.md (template added)");

  console.log("\n⚠️  Please edit CHANGELOG.md now with release notes.");
  console.log("   Use the commits above as reference.\n");

  const editDone = await ask("Press Enter when done editing CHANGELOG.md...");

  // Git operations
  run("git add package.json lib/version.ts CHANGELOG.md");
  run(`git commit -m "chore(release): v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

  console.log("\n✅ Release v" + newVersion + " prepared locally.");

  const push = await ask("\nPush to origin? (y/N) ");
  if (push.toLowerCase() === "y") {
    run("git push origin main");
    run(`git push origin v${newVersion}`);
    console.log("\n🚀 Pushed! Don't forget to create GitHub release:");
    console.log(`   https://github.com/yuens1002/ecomm-ai-app/releases/new?tag=v${newVersion}`);
  } else {
    console.log("\nTo push later:");
    console.log("   git push origin main");
    console.log(`   git push origin v${newVersion}`);
  }

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
