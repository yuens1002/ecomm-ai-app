#!/usr/bin/env npx tsx
/**
 * Release script for Artisan Roast
 *
 * Creates git tags for releases and syncs package.json version.
 * Version is derived from tags at build time (see next.config.ts).
 *
 * Usage:
 *   Interactive mode:
 *     npm run release:patch
 *     npm run release:minor
 *
 *   Non-interactive (Claude-friendly):
 *     npm run release:patch -- --yes --push
 *     npm run release:minor -- -y --push --github-release
 *
 * Flags:
 *   --yes, -y           Skip confirmation prompts
 *   --push              Push tag to origin
 *   --github-release    Create GitHub Release (triggers upgrade notice in app)
 *   --message, -m       Release message for tag annotation
 *   --sync-package      Also update package.json (creates PR if on main)
 *
 * What it does:
 *   1. Determines next version from latest tag
 *   2. Optionally syncs package.json via PR (if --sync-package)
 *   3. Creates annotated git tag
 *   4. Optionally pushes tag to origin
 *   5. Optionally creates GitHub Release with notes from CHANGELOG.md
 *
 * Note: For Vercel builds, package.json must match the tag version.
 * Use --sync-package to create a PR that updates package.json.
 */

import { execSync } from "child_process";
import { createInterface } from "readline";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse CLI arguments
const args = process.argv.slice(2);
const bumpType =
  args.find((a) => ["patch", "minor", "major"].includes(a)) || "patch";
const flags = {
  yes: args.includes("--yes") || args.includes("-y"),
  push: args.includes("--push"),
  githubRelease: args.includes("--github-release"),
  syncPackage: args.includes("--sync-package"),
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
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
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

function getLastTag(): string | null {
  const tags = exec("git tag -l v* --sort=-v:refname");
  if (!tags) return null;
  return tags.split("\n")[0] || null;
}

function getVersionFromTag(tag: string | null): string {
  if (!tag) return "0.0.0";
  return tag.replace(/^v/, "");
}

function getCommitsSinceTag(tag: string | null): string {
  const range = tag ? `${tag}..HEAD` : "HEAD~10..HEAD";
  return exec(`git log ${range} --oneline --no-decorate`) || "(no commits)";
}

/**
 * Extract release notes from CHANGELOG.md for a specific version
 */
function extractChangelogNotes(version: string): Record<string, string[]> {
  const changelogPath = join(__dirname, "..", "CHANGELOG.md");
  if (!existsSync(changelogPath)) {
    console.log("⚠️  CHANGELOG.md not found");
    return {};
  }

  const changelog = readFileSync(changelogPath, "utf-8");
  const lines = changelog.split("\n");

  // Find the section for this version
  const versionHeader = `## ${version}`;
  const versionHeaderAlt = `## [${version}]`; // Some formats use brackets
  let inSection = false;
  let currentCategory = "";
  const sections: Record<string, string[]> = {};

  for (const line of lines) {
    // Check if we hit this version's section
    if (line.startsWith(versionHeader) || line.startsWith(versionHeaderAlt)) {
      inSection = true;
      continue;
    }

    // Check if we hit the next version (end of our section)
    if (inSection && line.startsWith("## ")) {
      break;
    }

    if (!inSection) continue;

    // Parse category headers (### Added, ### Fixed, etc.)
    if (line.startsWith("### ")) {
      currentCategory = line.replace("### ", "").trim().toUpperCase();
      sections[currentCategory] = [];
      continue;
    }

    // Parse bullet points
    if (line.startsWith("- ") && currentCategory) {
      // Convert developer-facing notes to user-facing
      let note = line.substring(2).trim();
      // Remove technical details in parentheses for cleaner notes
      note = note.replace(/\s*\([^)]*\)\s*$/, "");
      if (note) {
        sections[currentCategory].push(note);
      }
    }
  }

  return sections;
}

/**
 * Format release notes using the template
 */
function formatReleaseNotes(version: string, sections: Record<string, string[]>): string {
  // Build notes from sections
  const parts: string[] = [`## What's New in v${version}`, ""];

  // Map changelog categories to user-friendly sections
  const categoryMap: Record<string, string> = {
    ADDED: "New Features",
    FIXED: "Bug Fixes",
    CHANGED: "Improvements",
    REMOVED: "Removed",
    SECURITY: "Security",
  };

  for (const [category, title] of Object.entries(categoryMap)) {
    const items = sections[category];
    if (items && items.length > 0) {
      parts.push(`### ${title}`);
      for (const item of items) {
        parts.push(`- ${item}`);
      }
      parts.push("");
    }
  }

  // If no sections found, return simple message
  if (parts.length <= 2) {
    return `Release v${version}`;
  }

  return parts.join("\n").trim();
}

/**
 * Get current package.json version
 */
function getPackageVersion(): string {
  const packagePath = join(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
  return pkg.version;
}

/**
 * Update package.json version and create PR if on main
 * Returns true if successful, false otherwise
 */
async function syncPackageJson(newVersion: string): Promise<boolean> {
  const currentPackageVersion = getPackageVersion();

  if (currentPackageVersion === newVersion) {
    console.log(`\n✅ package.json already at ${newVersion}`);
    return true;
  }

  console.log(`\n📦 Syncing package.json: ${currentPackageVersion} → ${newVersion}`);

  // Check current branch
  const currentBranch = exec("git rev-parse --abbrev-ref HEAD");
  const isOnMain = currentBranch === "main" || currentBranch === "master";

  if (isOnMain) {
    // Need to create a PR because we can't push directly to main
    console.log("   (On main branch - creating PR for version bump)");

    const branchName = `chore/bump-version-${newVersion}`;

    try {
      // Create branch
      run(`git checkout -b ${branchName}`);

      // Update package.json
      const packagePath = join(__dirname, "..", "package.json");
      const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
      pkg.version = newVersion;
      const { writeFileSync } = await import("fs");
      writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

      // Commit and push
      run(`git add package.json`);
      run(`git commit -m "chore: bump version to ${newVersion} for Vercel build"`);
      run(`git push -u origin ${branchName}`);

      // Create PR
      run(`gh pr create --title "chore: bump version to ${newVersion}" --body "Sync package.json version with git tag v${newVersion} for Vercel build compatibility."`);

      // Wait for CI and merge
      console.log("\n⏳ Waiting for CI checks...");
      try {
        execSync(`gh pr checks ${branchName} --watch`, { stdio: "inherit", timeout: 300000 });
      } catch {
        console.log("   (CI check watch timed out or failed, attempting merge anyway)");
      }

      // Merge PR
      run(`gh pr merge ${branchName} --squash --delete-branch`);

      // Return to main and pull
      run(`git checkout main`);
      run(`git pull`);

      console.log(`\n✅ package.json updated to ${newVersion}`);
      return true;
    } catch (err) {
      console.error("\n❌ Failed to sync package.json:", err);
      // Try to clean up
      try {
        exec(`git checkout main`);
        exec(`git branch -D ${branchName}`);
      } catch { /* ignore cleanup errors */ }
      return false;
    }
  } else {
    // On a feature branch - just update the file
    console.log("   (On feature branch - updating locally)");

    const packagePath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(packagePath, "utf-8"));
    pkg.version = newVersion;
    const { writeFileSync } = await import("fs");
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

    console.log(`\n✅ package.json updated to ${newVersion} (not committed)`);
    console.log("   Remember to commit this change before merging.");
    return true;
  }
}

function createGitHubRelease(version: string, message?: string) {
  const tag = `v${version}`;
  const repo = "yuens1002/ecomm-ai-app";

  // Extract notes from CHANGELOG if no custom message
  let releaseBody: string;
  if (message) {
    releaseBody = message;
  } else {
    console.log("\n📝 Extracting release notes from CHANGELOG.md...");
    const sections = extractChangelogNotes(version);
    releaseBody = formatReleaseNotes(version, sections);
    if (releaseBody !== `Release v${version}`) {
      console.log("✅ Found changelog entries");
    } else {
      console.log("⚠️  No changelog entries found, using default message");
    }
  }

  // Use gh CLI if available
  const ghAvailable = exec("gh --version");
  if (ghAvailable) {
    console.log("\n📦 Creating GitHub Release...");
    try {
      // Use heredoc for multiline notes
      const escapedBody = releaseBody.replace(/'/g, "'\\''");
      run(
        `gh release create ${tag} --title "Release ${tag}" --notes $'${escapedBody}'`
      );
      console.log(
        `\n✅ GitHub Release created: https://github.com/${repo}/releases/tag/${tag}`
      );
      return true;
    } catch {
      console.error("Failed to create release with gh CLI");
      return false;
    }
  }

  // Fallback: print URL
  const title = encodeURIComponent(`Release ${tag}`);
  const body = encodeURIComponent(releaseBody);
  const url = `https://github.com/${repo}/releases/new?tag=${tag}&title=${title}&body=${body}`;
  console.log("\n📦 Create GitHub Release at:");
  console.log(`   ${url}`);
  return false;
}

async function main() {
  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error(
      "Usage: release.ts [patch|minor|major] [--yes] [--push] [--github-release] [--sync-package] [--message '...']"
    );
    process.exit(1);
  }

  const lastTag = getLastTag();
  const currentVersion = getVersionFromTag(lastTag);
  const newVersion = bumpVersion(currentVersion, bumpType as BumpType);
  const newTag = `v${newVersion}`;

  console.log("\n📦 Release Script (tag-only)");
  console.log("─".repeat(50));
  console.log(`Current tag:     ${lastTag || "(none)"}`);
  console.log(`New tag:         ${newTag} (${bumpType})`);
  console.log(`Mode:            ${flags.yes ? "non-interactive" : "interactive"}`);

  // Show commits since last tag
  console.log("\n📝 Commits to be included:");
  console.log("─".repeat(50));
  const commits = getCommitsSinceTag(lastTag);
  console.log(commits);
  console.log("─".repeat(50));

  // Check if there are any commits to tag
  if (commits === "(no commits)") {
    console.log("\n⚠️  No new commits since last tag. Nothing to release.");
    closeReadline();
    process.exit(0);
  }

  // Confirm
  const confirm = await ask(`\nCreate tag ${newTag}? (y/N) `);
  if (confirm.toLowerCase() !== "y") {
    console.log("Aborted.");
    closeReadline();
    process.exit(0);
  }

  // Sync package.json if requested
  let shouldSyncPackage = flags.syncPackage;
  if (!flags.yes && !shouldSyncPackage) {
    const currentPkgVersion = getPackageVersion();
    if (currentPkgVersion !== newVersion) {
      const syncAnswer = await ask(
        `\npackage.json is at ${currentPkgVersion}. Sync to ${newVersion}? (y/N) `
      );
      shouldSyncPackage = syncAnswer.toLowerCase() === "y";
    }
  }

  if (shouldSyncPackage) {
    const synced = await syncPackageJson(newVersion);
    if (!synced) {
      console.log("\n⚠️  Failed to sync package.json. Continuing with tag creation...");
    }
  }

  // Create tag
  const tagMessage = flags.message || `Release ${newVersion}`;
  run(`git tag -a ${newTag} -m "${tagMessage.replace(/"/g, '\\"')}"`);
  console.log(`\n✅ Tag ${newTag} created locally.`);

  // Push
  let shouldPush = flags.push;
  if (!flags.yes && !shouldPush) {
    const pushAnswer = await ask("\nPush tag to origin? (y/N) ");
    shouldPush = pushAnswer.toLowerCase() === "y";
  }

  if (shouldPush) {
    run(`git push origin ${newTag}`);
    console.log("\n✅ Tag pushed to origin.");
  } else {
    console.log("\nTo push later:");
    console.log(`   git push origin ${newTag}`);
  }

  // GitHub Release info
  console.log("\n" + "─".repeat(50));
  console.log("📢 UPGRADE NOTICE:");
  console.log("   Tags alone do NOT trigger upgrade notices.");
  console.log("   Create a GitHub Release to notify users.");
  console.log("─".repeat(50));

  let shouldCreateRelease = flags.githubRelease;
  if (!flags.yes && !shouldCreateRelease && shouldPush) {
    const releaseAnswer = await ask(
      "\nCreate GitHub Release? (triggers upgrade notice) (y/N) "
    );
    shouldCreateRelease = releaseAnswer.toLowerCase() === "y";
  }

  if (shouldCreateRelease) {
    if (!shouldPush) {
      console.log("\n⚠️  Push tag first before creating GitHub Release.");
    } else {
      createGitHubRelease(newVersion, flags.message);
    }
  }

  console.log("\n🎉 Done!");
  closeReadline();
}

main().catch((err) => {
  console.error("Error:", err);
  closeReadline();
  process.exit(1);
});
