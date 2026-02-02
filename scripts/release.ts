#!/usr/bin/env npx tsx
/**
 * Release script for Artisan Roast
 *
 * Usage:
 *   Interactive mode:
 *     npm run release:patch
 *     npm run release:minor
 *
 *   Non-interactive (Claude-friendly):
 *     npm run release:patch -- --yes --push
 *     npm run release:minor -- -y --push --github-release --message "Add new feature"
 *
 * Flags:
 *   --yes, -y           Skip confirmation prompts
 *   --push              Push to origin after release
 *   --github-release    Create GitHub Release (triggers upgrade notice in app)
 *   --message, -m       Release message for changelog and tag
 *
 * What it does:
 *   1. Bumps version in package.json and lib/version.ts
 *   2. Updates CHANGELOG.md with new version header
 *   3. Commits and creates annotated git tag
 *   4. Optionally pushes to origin
 *   5. Optionally creates GitHub Release (this triggers upgrade notices!)
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";

// Parse CLI arguments
const args = process.argv.slice(2);
const bumpType = args.find((a) => ["patch", "minor", "major"].includes(a)) || "patch";
const flags = {
  yes: args.includes("--yes") || args.includes("-y"),
  push: args.includes("--push"),
  githubRelease: args.includes("--github-release"),
  message: getArgValue("--message") || getArgValue("-m"),
};

function getArgValue(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith("-")) {
    return args[index + 1];
  }
  return undefined;
}

// Readline for interactive mode
let rl: ReturnType<typeof createInterface> | null = null;

function getReadline() {
  if (!rl) {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function closeReadline() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

const ask = (question: string): Promise<string> => {
  if (flags.yes) {
    console.log(`${question} (auto: y)`);
    return Promise.resolve("y");
  }
  return new Promise((resolve) => getReadline().question(question, resolve));
};

// Cross-platform exec helpers
function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

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
  // Cross-platform: use git directly without shell redirects
  const tags = exec("git tag -l v* --sort=-v:refname");
  if (!tags) return null;
  const firstTag = tags.split("\n")[0];
  return firstTag || null;
}

function getCommitsSinceTag(tag: string | null): string {
  const range = tag ? `${tag}..HEAD` : "HEAD~10..HEAD";
  return exec(`git log ${range} --oneline --no-decorate`) || "(no commits found)";
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

function updateChangelog(newVersion: string, message?: string): string {
  const path = "CHANGELOG.md";
  const date = new Date().toISOString().split("T")[0];
  const header = `## ${newVersion} - ${date}`;

  // If message provided, use it directly; otherwise use template
  const content_block = message
    ? `${header}\n\n${message}\n\n`
    : `${header}\n\n### Changes\n- \n\n`;

  let content = readFileSync(path, "utf-8");
  content = content.replace("# Changelog\n\n", `# Changelog\n\n${content_block}`);
  writeFileSync(path, content);
  return path;
}

function createGitHubRelease(version: string, message?: string) {
  const tag = `v${version}`;
  const repo = "yuens1002/ecomm-ai-app";
  const title = encodeURIComponent(`Release ${tag}`);
  const body = encodeURIComponent(message || `Release ${tag}`);

  // Use gh CLI if available (works cross-platform)
  const ghAvailable = exec("gh --version");
  if (ghAvailable) {
    console.log("\n📦 Creating GitHub Release with gh CLI...");
    const releaseBody = message || `Release ${tag}`;
    try {
      run(`gh release create ${tag} --title "Release ${tag}" --notes "${releaseBody.replace(/"/g, '\\"')}"`);
      console.log(`\n✅ GitHub Release created: https://github.com/${repo}/releases/tag/${tag}`);
      return true;
    } catch (e) {
      console.error("Failed to create release with gh CLI:", e);
      return false;
    }
  }

  // Fallback: print URL for manual creation
  const url = `https://github.com/${repo}/releases/new?tag=${tag}&title=${title}&body=${body}`;
  console.log("\n📦 To create GitHub Release (triggers upgrade notice), visit:");
  console.log(`   ${url}`);
  return false;
}

async function main() {
  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error("Usage: release.ts [patch|minor|major] [--yes] [--push] [--github-release] [--message '...']");
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
  const newVersion = bumpVersion(currentVersion, bumpType as BumpType);
  const lastTag = getLastTag();

  console.log("\n📦 Release Script");
  console.log("─".repeat(50));
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version:     ${newVersion} (${bumpType})`);
  console.log(`Last tag:        ${lastTag || "(none)"}`);
  console.log(`Mode:            ${flags.yes ? "non-interactive" : "interactive"}`);

  // Show commits since last tag
  console.log("\n📝 Commits since last release:");
  console.log("─".repeat(50));
  const commits = getCommitsSinceTag(lastTag);
  console.log(commits);
  console.log("─".repeat(50));

  // Confirm
  const confirm = await ask(`\nProceed with release v${newVersion}? (y/N) `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Aborted.");
    closeReadline();
    process.exit(0);
  }

  // Update files
  console.log("\n📝 Updating version files...");
  updatePackageJson(newVersion);
  console.log("   ✓ package.json");
  updateVersionTs(newVersion);
  console.log("   ✓ lib/version.ts");
  updateChangelog(newVersion, flags.message);
  console.log("   ✓ CHANGELOG.md");

  // If no message provided and interactive mode, pause for editing
  if (!flags.message && !flags.yes) {
    console.log("\n⚠️  Please edit CHANGELOG.md now with release notes.");
    console.log("   Use the commits above as reference.\n");
    await ask("Press Enter when done editing CHANGELOG.md...");
  }

  // Git operations
  run("git add package.json lib/version.ts CHANGELOG.md");
  run(`git commit -m "chore(release): v${newVersion}"`);
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`);

  console.log("\n✅ Release v" + newVersion + " prepared locally.");

  // Push
  let shouldPush = flags.push;
  if (!flags.yes && !shouldPush) {
    const pushAnswer = await ask("\nPush to origin? (y/N) ");
    shouldPush = pushAnswer.toLowerCase() === "y";
  }

  if (shouldPush) {
    // Get current branch
    const branch = exec("git rev-parse --abbrev-ref HEAD") || "main";
    run(`git push origin ${branch}`);
    run(`git push origin v${newVersion}`);
    console.log("\n✅ Pushed to origin.");
  } else {
    const branch = exec("git rev-parse --abbrev-ref HEAD") || "main";
    console.log("\nTo push later:");
    console.log(`   git push origin ${branch}`);
    console.log(`   git push origin v${newVersion}`);
  }

  // GitHub Release (triggers upgrade notice!)
  console.log("\n" + "─".repeat(50));
  console.log("📢 UPGRADE NOTICE INFO:");
  console.log("   Git tags alone do NOT trigger upgrade notices.");
  console.log("   Only GitHub Releases trigger the in-app upgrade notice.");
  console.log("─".repeat(50));

  let shouldCreateRelease = flags.githubRelease;
  if (!flags.yes && !shouldCreateRelease && shouldPush) {
    const releaseAnswer = await ask("\nCreate GitHub Release? (triggers upgrade notice) (y/N) ");
    shouldCreateRelease = releaseAnswer.toLowerCase() === "y";
  }

  if (shouldCreateRelease && shouldPush) {
    createGitHubRelease(newVersion, flags.message);
  } else if (!shouldPush && flags.githubRelease) {
    console.log("\n⚠️  Skipping GitHub Release - must push first.");
  }

  console.log("\n🎉 Done!");
  closeReadline();
}

main().catch((err) => {
  console.error("Error:", err);
  closeReadline();
  process.exit(1);
});
