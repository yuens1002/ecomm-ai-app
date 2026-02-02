#!/usr/bin/env npx tsx
/**
 * Release script for Artisan Roast
 *
 * Creates git tags for releases. Version is derived from tags at build time
 * (see next.config.ts), so no file changes needed.
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
 *
 * What it does:
 *   1. Determines next version from latest tag
 *   2. Creates annotated git tag
 *   3. Optionally pushes tag to origin
 *   4. Optionally creates GitHub Release (this triggers upgrade notices!)
 *
 * Note: No commits are created. The tag points to the current HEAD.
 * APP_VERSION is derived from git tags at build time.
 */

import { execSync } from "child_process";
import { createInterface } from "readline";

// Parse CLI arguments
const args = process.argv.slice(2);
const bumpType =
  args.find((a) => ["patch", "minor", "major"].includes(a)) || "patch";
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

function createGitHubRelease(version: string, message?: string) {
  const tag = `v${version}`;
  const repo = "yuens1002/ecomm-ai-app";

  // Use gh CLI if available
  const ghAvailable = exec("gh --version");
  if (ghAvailable) {
    console.log("\n📦 Creating GitHub Release...");
    const releaseBody = message || `Release ${tag}`;
    try {
      run(
        `gh release create ${tag} --title "Release ${tag}" --notes "${releaseBody.replace(/"/g, '\\"')}"`
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
  const body = encodeURIComponent(message || `Release ${tag}`);
  const url = `https://github.com/${repo}/releases/new?tag=${tag}&title=${title}&body=${body}`;
  console.log("\n📦 Create GitHub Release at:");
  console.log(`   ${url}`);
  return false;
}

async function main() {
  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error(
      "Usage: release.ts [patch|minor|major] [--yes] [--push] [--github-release] [--message '...']"
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
