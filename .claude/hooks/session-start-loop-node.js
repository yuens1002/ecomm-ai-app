#!/usr/bin/env node
// .claude/hooks/session-start-loop-node.js
//
// Claude Code SessionStart hook — injects workflow state context when a
// session begins on a branch tracked in verification-status.json.
//
// Exit 0 = no context (main branch or untracked branch).
// Exit 2 = inject context message via stderr.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

function inject(message) {
  process.stderr.write(message);
  process.exit(2);
}

function main() {
  const hookDir = __dirname;
  const projectDir = path.resolve(hookDir, "..", "..");
  const statusFile = path.join(hookDir, "..", "verification-status.json");

  // Get current branch
  let branch = "";
  try {
    branch = execSync("git branch --show-current", {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    process.exit(0);
  }

  // Skip on main or detached HEAD
  if (!branch || branch === "main" || branch === "master") {
    process.exit(0);
  }

  // No status file — no workflow tracking
  if (!fs.existsSync(statusFile)) {
    process.exit(0);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(statusFile, "utf8"));
  } catch {
    process.exit(0);
  }

  const entry = data.branches && data.branches[branch];
  if (!entry) {
    process.exit(0);
  }

  const status = entry.status || "pending";
  const passed = entry.acs_passed || 0;
  const total = entry.acs_total || 0;

  switch (status) {
    case "planned":
      inject(
        `WORKFLOW ACTIVE: Branch '${branch}' has an approved plan with ${total} ACs. ` +
          `Begin implementation per the plan and commit schedule. ` +
          `Status: PLANNED — next step is IMPLEMENT.`
      );
      break;

    case "implementing":
      inject(
        `WORKFLOW ACTIVE: Branch '${branch}' is mid-implementation (${total} ACs defined). ` +
          `Continue implementing per the commit schedule. ` +
          `When done, update status to "pending" and run /verify-workflow to verify all ACs. ` +
          `Status: IMPLEMENTING.`
      );
      break;

    case "pending":
      inject(
        `WORKFLOW ACTIVE: Branch '${branch}' has ${total} ACs awaiting verification. ` +
          `Run /verify-workflow or /ac-verify before declaring done. ` +
          `Status: PENDING VERIFICATION.`
      );
      break;

    case "partial":
      inject(
        `WORKFLOW ACTIVE: Branch '${branch}' has ${passed}/${total} ACs verified. ` +
          `Complete verification for remaining ACs before declaring done. ` +
          `Status: PARTIAL.`
      );
      break;

    case "verified":
      inject(
        `WORKFLOW COMPLETE: Branch '${branch}' is fully verified (${passed}/${total} ACs). ` +
          `Ready for commit, PR, and release.`
      );
      break;

    default:
      process.exit(0);
  }
}

main();
