#!/usr/bin/env node
/**
 * QA issue enrichment — Category B and C diagnostics.
 *
 * Reads the classification JSON and posts a diagnostic comment to the open
 * install-assurance GitHub issue, providing targeted context for the maintainer.
 *
 * Category C: health probe result (is Vercel up? is DB reachable?)
 * Category B: recent git commits touching paths relevant to the failing ACs
 *
 * Exit code: always 0 (enrichment failure must not mark the self-heal job failed)
 *
 * Usage:
 *   node scripts/qa-enrich-issue.js
 *
 * Required env:
 *   GITHUB_TOKEN          — gh CLI auth
 *   QA_CLASSIFICATION_JSON — path to classification output (default: classification.json)
 *   GITHUB_ISSUE_NUMBER    — issue number to comment on
 *   BASE_URL               — QA Vercel deployment URL (for health probe)
 */

"use strict";

const { execSync } = require("child_process");
const fs           = require("fs");

// ── Config ────────────────────────────────────────────────────────────────────

const classificationFile = process.env.QA_CLASSIFICATION_JSON || "classification.json";
const issueNumber        = process.env.GITHUB_ISSUE_NUMBER;
const baseUrl            = process.env.BASE_URL?.replace(/\/$/, "");

if (!issueNumber) {
  console.error("❌  GITHUB_ISSUE_NUMBER not set — cannot enrich issue");
  process.exit(0);
}

// ── Load classification ───────────────────────────────────────────────────────

let classification;
try {
  classification = JSON.parse(fs.readFileSync(classificationFile, "utf8"));
} catch (e) {
  console.error(`❌  Cannot read classification file: ${e.message}`);
  process.exit(0);
}

const { category, failedAcs, reason } = classification;

// ── Noise guard: only enrich if issue is fresh (< 24 hours old) ───────────────

try {
  const issueJson = execSync(`gh issue view ${issueNumber} --json createdAt`, { encoding: "utf8" });
  const { createdAt } = JSON.parse(issueJson);
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    console.log(`ℹ️   Issue #${issueNumber} is >24h old — skipping enrichment to avoid noise`);
    process.exit(0);
  }
} catch (e) {
  console.error(`⚠️   Could not check issue age: ${e.message} — proceeding`);
}

// ── Build comment body ────────────────────────────────────────────────────────

async function buildComment() {
  const acList = failedAcs.length > 0
    ? failedAcs.map((a) => `\`${a.id}\` — ${a.evidence}`).join("\n  ")
    : "_(no failed ACs in results)_";

  if (category === "C") {
    const probe = await healthProbe();
    return [
      "## 🔧 Self-Heal Diagnostics — Category C (Infrastructure)",
      "",
      `**Classifier reason:** ${reason}`,
      "",
      "**Failed ACs:**",
      `  ${acList}`,
      "",
      "**Health probe:**",
      probe,
      "",
      "_Auto-repair is not attempted for infrastructure failures. Check Vercel dashboard and Neon status._",
    ].join("\n");
  }

  if (category === "B") {
    const gitLog = buildGitLog(failedAcs);
    return [
      "## 🔍 Self-Heal Diagnostics — Category B (App Regression)",
      "",
      `**Classifier reason:** ${reason}`,
      "",
      "**Failed ACs:**",
      `  ${acList}`,
      "",
      "<details>",
      "<summary>Recent commits on relevant paths (last 7 days)</summary>",
      "",
      gitLog || "_No recent commits found on relevant paths._",
      "",
      "</details>",
      "",
      "_Auto-repair is not attempted for regression failures. Review the commits above for likely culprits._",
    ].join("\n");
  }

  // Unexpected category
  return `## ⚠️ Self-Heal: Unexpected category "${category}"\n\n${reason}`;
}

async function healthProbe() {
  if (!baseUrl) return "_(BASE_URL not set — cannot probe)_";
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(10000) });
    let body = "";
    try { body = JSON.stringify(await res.json()); } catch {}
    if (res.ok) {
      return `✅ \`GET ${baseUrl}/api/health\` → HTTP ${res.status}\n\`\`\`json\n${body}\n\`\`\``;
    }
    return `❌ \`GET ${baseUrl}/api/health\` → HTTP ${res.status}\n\`\`\`json\n${body}\n\`\`\`\n\nThe QA deployment appears unhealthy. Check the [Vercel dashboard](https://vercel.com) for the QA project.`;
  } catch (e) {
    return `❌ \`GET ${baseUrl}/api/health\` → ${e.message}\n\nThe QA deployment is unreachable. Check the [Vercel dashboard](https://vercel.com) and [Neon status](https://neonstatus.com).`;
  }
}

function buildGitLog(acs) {
  // Map AC groups to relevant file paths
  const pathMap = {
    "AC-IF": "app/setup/ app/api/admin/setup/",
    "AC-KV": "app/auth/ app/(site)/",
    "AC-IS": "app/admin/ app/(site)/",
  };

  const pathsToCheck = new Set();
  for (const ac of acs) {
    const prefix = ac.id.replace(/-\d+$/, "");
    if (pathMap[prefix]) {
      for (const p of pathMap[prefix].trim().split(/\s+/)) {
        pathsToCheck.add(p);
      }
    }
  }

  if (pathsToCheck.size === 0) return "";

  const sections = [];
  for (const p of pathsToCheck) {
    try {
      const log = execSync(
        `git log --oneline --since="7 days ago" -- "${p}"`,
        { encoding: "utf8", cwd: process.cwd() }
      ).trim();
      if (log) {
        sections.push(`**\`${p}\`**\n\`\`\`\n${log}\n\`\`\``);
      }
    } catch {
      // ignore git errors per path
    }
  }

  return sections.length > 0
    ? sections.join("\n\n") + "\n\n> These are correlations, not confirmed causes. Review each commit manually."
    : "_No recent commits on relevant paths._";
}

// ── Post comment ──────────────────────────────────────────────────────────────

(async () => {
  try {
    const body = await buildComment();
    execSync(
      `gh issue comment ${issueNumber} --body ${JSON.stringify(body)}`,
      { stdio: "inherit" }
    );
    console.log(`✅  Enrichment comment posted to issue #${issueNumber}`);
  } catch (e) {
    console.error(`❌  Failed to post enrichment comment: ${e.message}`);
    // exit 0 always
  }
})();
