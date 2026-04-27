#!/usr/bin/env node
// .claude/hooks/pre-pr-via-release-node.js
//
// Claude Code PreToolUse hook — intercepts `gh pr create` and ensures the
// caller is going through the `/release` flow rather than opening a PR
// directly from `/commit`, `/review`, or an ad-hoc bash command.
//
// The signal: the latest commit on the current branch must match
// `bump version to X.Y.Z`. That commit is the unique fingerprint produced
// by `/release` Step 5 (commit version bump). If the latest commit does NOT
// match that shape, the caller hasn't run `/release` and we block.
//
// Why a structural gate beats a memory/skill rule:
//   - Skills can read their own instructions in isolation and miss
//     standing rules that say "use a different skill instead."
//   - Memory entries describing "always use /release" get bypassed
//     mid-flow once a skill is in motion.
//   - A hook that checks a real git artifact can't be talked around.
//
// Exit 0 = allow, Exit 2 = block (stderr shown to model)

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require("child_process");

// Matches the canonical `/release` version-bump commit. Tolerates a trailing
// suffix (e.g. `(#123)` from squash-merge replays) so we don't over-block
// after a release that re-runs against main.
const VERSION_BUMP_RE = /^bump version to \d+\.\d+\.\d+\b/i;

function deny(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

function exec(cmd, cwd) {
  return execSync(cmd, {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function main(input) {
  let command = "";
  try {
    const parsed = JSON.parse(input);
    command = (parsed.tool_input && parsed.tool_input.command) || "";
  } catch {
    process.exit(0);
  }

  // Only intercept `gh pr create` when it appears at a shell-command position —
  // start-of-string, or after a shell operator (`;`, `&&`, `||`, `|`, newline,
  // open paren). This prevents false matches when the literal text "gh pr create"
  // appears inside a heredoc / quoted string (e.g. inside a commit message body
  // referencing the command by name).
  if (!/(^|[\n;&|(]\s*)gh\s+pr\s+create\b/i.test(command)) {
    process.exit(0);
  }

  const projectDir = path.resolve(__dirname, "..", "..");

  // Read the latest commit subject on the current HEAD
  let lastSubject = "";
  try {
    lastSubject = exec("git log -1 --format=%s", projectDir);
  } catch {
    // If we can't read git state, fail open — better to let the user proceed
    // than to block on an unrelated environment issue.
    process.exit(0);
  }

  if (VERSION_BUMP_RE.test(lastSubject)) {
    // `/release` produced this commit; PR creation is authorized.
    process.exit(0);
  }

  deny(
    "BLOCKED: `gh pr create` is gated to the `/release` flow.\n\n" +
      `The latest commit on this branch is:\n  ${lastSubject}\n\n` +
      "It must be a `bump version to X.Y.Z` commit (the `/release` skill's\n" +
      "version-bump fingerprint). Do not open a PR directly from `/commit`,\n" +
      "`/review`, or an ad-hoc bash invocation.\n\n" +
      "── How to proceed ──\n" +
      "1. Run `/release <patch|minor|major>` — it bumps package.json, updates\n" +
      "   CHANGELOG.md, commits the bump, and creates the PR.\n" +
      "2. If you have an exceptional reason to bypass (e.g. recovering from a\n" +
      "   crashed release flow), check with the user before forcing it.\n"
  );
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => main(input));
