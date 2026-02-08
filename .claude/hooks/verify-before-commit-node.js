#!/usr/bin/env node
// .claude/hooks/verify-before-commit-node.js
//
// Claude Code PreToolUse hook (Node.js, cross-platform) — blocks `git commit`
// unless the current branch has "verified" status in verification-status.json.
//
// Exit code 0 = allow, exit code 2 = block (reason on stderr).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

function deny(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

function main(input) {
  // Parse the tool input to get the command
  let command = "";
  try {
    const parsed = JSON.parse(input);
    command = (parsed.tool_input && parsed.tool_input.command) || "";
  } catch {
    // Not JSON or no command — allow
    process.exit(0);
  }

  // Only gate git commit commands
  if (!/^\s*git commit/i.test(command)) {
    process.exit(0);
  }

  // Allow --amend (escape hatch for fixups)
  if (/--amend/.test(command)) {
    process.exit(0);
  }

  // Locate project root from hook location
  const hookDir = __dirname;
  const projectDir = path.resolve(hookDir, "..", "..");
  const statusFile = path.join(hookDir, "..", "verification-status.json");

  // If no status file, allow (hook not initialised)
  if (!fs.existsSync(statusFile)) {
    process.exit(0);
  }

  // Get current branch
  let branch = "";
  try {
    branch = execSync("git branch --show-current", {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    // Can't determine branch — allow
    process.exit(0);
  }

  if (!branch) {
    process.exit(0);
  }

  // Read verification status
  let data;
  try {
    data = JSON.parse(fs.readFileSync(statusFile, "utf8"));
  } catch {
    process.exit(0);
  }

  const entry = data.branches && data.branches[branch];
  if (!entry) {
    deny(
      `BLOCKED: Branch "${branch}" has no verification recorded. Run /verify-workflow or /ui-verify, then update .claude/verification-status.json before committing.`
    );
  }

  const status = entry.status || "pending";
  const passed = entry.acs_passed || 0;
  const total = entry.acs_total || 0;

  switch (status) {
    case "verified":
      process.exit(0);
      break;
    case "partial":
      deny(
        `BLOCKED: Branch "${branch}" has incomplete verification (${passed}/${total} ACs passed). Run /verify-workflow or /ui-verify to complete AC verification before committing.`
      );
      break;
    default:
      deny(
        `BLOCKED: Branch "${branch}" has status "${status}". Run /verify-workflow or /ui-verify, then update .claude/verification-status.json with status "verified" to proceed.`
      );
      break;
  }
}

// Read stdin
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => main(input));
