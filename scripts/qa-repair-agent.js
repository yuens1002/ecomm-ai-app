#!/usr/bin/env node
/**
 * QA Self-Heal Repair Agent — Category A
 *
 * Reads a Category A classification, navigates to the failing AC's page in a
 * headless browser, and asks Claude to propose a corrected AC_HINTS entry.
 * Applies the fix, verifies it by re-running the targeted AC against the live
 * QA deployment, and opens a PR if the AC passes.
 *
 * Exit codes:
 *   0  All repairs succeeded (PRs opened) or skipped (existing PRs found)
 *   1  Repair attempted but verification failed (original hint restored)
 *   3  Infrastructure error (reset failed, unreachable, unexpected crash)
 *
 * Required env:
 *   QA_CLASSIFICATION_JSON  Path to classification output (default: classification.json)
 *   BASE_URL                QA deployment URL
 *   ANTHROPIC_API_KEY       Claude API key
 *   QA_ADMIN_NAME           Known value used during install
 *   QA_ADMIN_EMAIL          Known value used during install
 *   QA_ADMIN_PASSWORD       Known value used during install
 *   QA_STORE_NAME           Known value used during install
 *   DATABASE_URL            QA database connection string (for teardown)
 *   QA_DB_ENDPOINT          Neon endpoint ID (safety guard for teardown)
 *   GH_TOKEN                GitHub token for gh CLI
 *
 * Optional env:
 *   QA_MODEL                  Claude model (default: claude-haiku-4-5-20251001)
 *   QA_REPAIR_TOKEN_BUDGET    Max tokens for repair agent loop (default: 10000)
 *   GITHUB_ISSUE_NUMBER       Issue to comment on after repair attempt
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "@playwright/test";
import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local (local dev only — CI sets env vars directly)
try {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.join(__dirname, "../.env.local"), override: false });
} catch {}
if (!process.env.BASE_URL && process.env.QA_BASE_URL) {
  process.env.BASE_URL = process.env.QA_BASE_URL;
}

// ── Config ────────────────────────────────────────────────────────────────────

const classificationFile = process.env.QA_CLASSIFICATION_JSON || "classification.json";
const BASE_URL   = (process.env.BASE_URL || "").replace(/\/$/, "");
const MODEL      = process.env.QA_MODEL || "claude-haiku-4-5-20251001";
const BUDGET     = parseInt(process.env.QA_REPAIR_TOKEN_BUDGET || "10000", 10);
const issueNumber = process.env.GITHUB_ISSUE_NUMBER || null;

// ── Load classification ───────────────────────────────────────────────────────

let classification;
try {
  classification = JSON.parse(fs.readFileSync(classificationFile, "utf8"));
} catch (e) {
  console.error(`❌  Cannot read classification file: ${e.message}`);
  process.exit(3);
}

if (classification.category !== "A" || !classification.repairable) {
  console.log("ℹ️  Classification is not Category A — nothing to repair");
  process.exit(0);
}

const failedAcs = classification.failedAcs || [];
if (failedAcs.length === 0) {
  console.error("❌  No failed ACs in Category A classification");
  process.exit(3);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readPage(page) {
  const url = page.url();
  let text;
  try {
    text = await page.locator("body").ariaSnapshot({ timeout: 5000 });
  } catch {
    text = await page.evaluate(() => document.body.innerText).catch(() => "");
  }
  const MAX = 8000, TAIL = 1500;
  return {
    url,
    text: text.length > MAX ? text.slice(0, MAX - TAIL - 5) + "\n...\n" + text.slice(-TAIL) : text,
  };
}

function postIssueComment(body) {
  if (!issueNumber) return;
  const tmp = path.join(__dirname, `../.tmp-comment-${Date.now()}.md`);
  try {
    fs.writeFileSync(tmp, body, "utf8");
    execSync(`gh issue comment ${issueNumber} --body-file "${tmp}"`, { stdio: "inherit" });
  } catch (e) {
    console.error(`⚠️  Could not post issue comment: ${e.message}`);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

function occurrenceCount(haystack, needle) {
  return haystack.split(needle).length - 1;
}

// ── Repair agent loop ─────────────────────────────────────────────────────────

async function proposeHintFix(ac, page, client) {
  const { id: acId, currentHintText, finalPageUrl, evidence } = ac;

  // Navigate to the page where this AC operates
  const startUrl = finalPageUrl || `${BASE_URL}/setup`;
  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (e) {
    console.error(`❌  Cannot navigate to ${startUrl}: ${e.message}`);
    return null;
  }
  const initialPage = await readPage(page);

  const tools = [
    {
      name: "navigate",
      description: "Navigate to a URL or path (e.g. /setup, /auth/admin-signin).",
      input_schema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
    },
    {
      name: "read_page",
      description: "Read the current page as an accessibility tree to observe labels and elements.",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "propose_hint_fix",
      description: "Propose a corrected AC_HINTS entry with updated labels and selectors. Call once you have identified what changed.",
      input_schema: {
        type: "object",
        properties: {
          acId:             { type: "string", description: "AC identifier, e.g. AC-KV-2" },
          proposedHintText: { type: "string", description: "Full replacement hint text with corrected labels. One plain string, no markdown." },
        },
        required: ["acId", "proposedHintText"],
      },
    },
  ];

  const systemPrompt = `You are a QA repair agent. The nightly QA check failed on ${acId}.

The AC_HINTS entry in scripts/qa-agent.js contains stale labels or selectors that no longer match the current UI.

Failure evidence: "${evidence}"

Current hint text:
${currentHintText || "(no hint available)"}

Current page (${initialPage.url}):
${initialPage.text.slice(0, 3000)}

Your task:
1. Use navigate and read_page to inspect the page where this AC operates
2. Identify which labels, button text, or field names in the hint no longer match what you observe
3. Call propose_hint_fix with a corrected hint that uses the actual current labels

Rules:
- Only update labels, button text, and field names — preserve the step sequence and verification logic
- proposedHintText must be a non-empty string, different from the current hint
- Write the hint as a single plain string (no markdown, no newlines)
- Do not invent steps or change what the AC is testing — only fix the label mismatches`;

  const messages = [{ role: "user", content: `Inspect the page and propose a corrected hint for ${acId}.` }];
  let totalTokens = 0;

  for (let turn = 0; turn < 8; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      tools,
      messages,
    });

    totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    console.log(`    [repair tokens] +${(response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)} → ${totalTokens}`);

    if (totalTokens > BUDGET) {
      console.error(`❌  Repair token budget exceeded (${totalTokens} > ${BUDGET})`);
      return null;
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      console.warn("  ⚠️  Repair agent ended without proposing a fix");
      return null;
    }

    const toolResults = [];
    let proposal = null;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "propose_hint_fix") {
        proposal = block.input.proposedHintText;
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: '{"ok":true}' });
        break;
      }

      let result;
      try {
        if (block.name === "navigate") {
          const url = block.input.url.startsWith("http") ? block.input.url : `${BASE_URL}${block.input.url}`;
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          result = await readPage(page);
        } else if (block.name === "read_page") {
          result = await readPage(page);
        } else {
          result = { error: `Unknown tool: ${block.name}` };
        }
      } catch (e) {
        result = { error: e.message };
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
    }

    if (proposal !== null) return proposal;
    if (toolResults.length) messages.push({ role: "user", content: toolResults });
  }

  console.warn("  ⚠️  Max repair turns reached without a proposal");
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧 QA Self-Heal Repair Agent`);
  console.log(`   Category A — ${failedAcs.length} AC(s): ${failedAcs.map((a) => a.id).join(", ")}`);
  console.log(`   Model: ${MODEL} | Budget: ${BUDGET.toLocaleString()} tokens\n`);

  const client = new Anthropic();
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  let anyRepairFailed = false;

  try {
    for (const ac of failedAcs) {
      const { id: acId, currentHintText } = ac;
      const branchName = `fix/qa-self-heal-${acId.toLowerCase()}`;

      console.log(`\n── Repairing ${acId} ${"─".repeat(Math.max(0, 50 - acId.length))}`);

      // Check for an existing open repair PR on this branch
      let existingPrUrl = null;
      try {
        const prList = JSON.parse(
          execSync(`gh pr list --head "${branchName}" --state open --json number,url --limit 1`, { encoding: "utf8" })
        );
        if (prList.length > 0) existingPrUrl = prList[0].url;
      } catch {}

      if (existingPrUrl) {
        console.log(`ℹ️  Existing open repair PR: ${existingPrUrl} — skipping`);
        postIssueComment([
          `## ♻️ Self-Heal: Existing Repair PR`,
          "",
          `An open repair PR already exists for \`${acId}\`: ${existingPrUrl}`,
          "",
          `_No new attempt was made. Review the existing PR._`,
        ].join("\n"));
        continue;
      }

      // Reset QA state before the repair attempt
      console.log("📦 Resetting QA state...");
      const resetResult = spawnSync("node", ["scripts/qa-teardown.js"], {
        encoding: "utf8",
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
      if (resetResult.status !== 0) {
        console.error(`❌  qa-teardown failed — cannot verify repair safely`);
        postIssueComment([
          `## ⚠️ Self-Heal: QA Reset Failed`,
          "",
          `\`qa-teardown.js\` failed before the repair attempt for \`${acId}\`. This is a Category C (infrastructure) issue.`,
          "",
          `Check the Neon dashboard and Vercel deployment.`,
        ].join("\n"));
        process.exit(3);
      }

      // Run repair agent to get a proposed hint fix
      console.log(`🤖 Running repair agent for ${acId}...`);
      const proposedHintText = await proposeHintFix(ac, page, client);

      if (!proposedHintText || proposedHintText === currentHintText) {
        console.error(`❌  No valid proposal produced for ${acId}`);
        postIssueComment([
          `## ❌ Self-Heal: No Repair Proposal`,
          "",
          `The repair agent could not produce a corrected hint for \`${acId}\`.`,
          "",
          `**Original evidence:** _${ac.evidence}_`,
          "",
          `_Manual investigation required._`,
        ].join("\n"));
        anyRepairFailed = true;
        continue;
      }

      console.log(`  Proposed: ${proposedHintText.slice(0, 100)}${proposedHintText.length > 100 ? "…" : ""}`);

      // Validate: current hint must appear exactly once in the source
      const agentPath = path.join(__dirname, "qa-agent.js");
      const originalSrc = fs.readFileSync(agentPath, "utf8");

      if (!currentHintText || occurrenceCount(originalSrc, currentHintText) !== 1) {
        console.error(`❌  Current hint text not found uniquely in qa-agent.js — cannot apply patch safely`);
        anyRepairFailed = true;
        continue;
      }

      // Apply patch
      const patchedSrc = originalSrc.replace(currentHintText, proposedHintText);
      fs.writeFileSync(agentPath, patchedSrc, "utf8");
      console.log(`✅  Patch applied to scripts/qa-agent.js`);

      // Verify: re-run the targeted AC with the patched hint
      console.log(`\n🧪 Verifying with STOP_AFTER=${acId}...`);
      spawnSync("node", ["scripts/qa-agent.js"], {
        encoding: "utf8",
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
        env: { ...process.env, STOP_AFTER: acId },
      });

      let targetResult = null;
      try {
        const verifyResults = JSON.parse(fs.readFileSync("qa-results.json", "utf8"));
        targetResult = verifyResults.results?.find((r) => r.id === acId);
      } catch {}

      if (targetResult?.status !== "PASS") {
        // Revert and report
        fs.writeFileSync(agentPath, originalSrc, "utf8");
        console.error(`❌  Verification failed (${targetResult?.status || "ERROR"}) — patch reverted`);
        postIssueComment([
          `## ❌ Self-Heal: Repair Verification Failed`,
          "",
          `The repair agent proposed a hint update for \`${acId}\`, but verification failed.`,
          "",
          `**Proposed hint:**`,
          "```",
          proposedHintText,
          "```",
          "",
          `**Verification result:** ${targetResult?.status || "ERROR"} — ${targetResult?.evidence || "could not read results"}`,
          "",
          `_Original hint restored. Manual investigation required._`,
        ].join("\n"));
        anyRepairFailed = true;
        continue;
      }

      console.log(`✅  Verification passed — ${acId} now PASS`);

      // Create branch, commit, push, open PR
      const tmp = path.join(__dirname, `../.tmp-pr-body-${Date.now()}.md`);
      try {
        execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        execSync(`git add scripts/qa-agent.js`, { stdio: "inherit" });
        execSync(
          `git commit -m "fix(qa): repair AC_HINTS for ${acId} — auto self-heal"`,
          { stdio: "inherit" }
        );
        execSync(`git push origin ${branchName}`, { stdio: "inherit" });

        const prBody = [
          `## Self-Heal Repair — ${acId}`,
          "",
          `Nightly QA failed on \`${acId}\`:`,
          `> _${ac.evidence}_`,
          "",
          `The repair agent inspected the live QA page, identified stale labels, and proposed a corrected \`AC_HINTS\` entry.`,
          `This fix was automatically verified: \`STOP_AFTER=${acId}\` passed after the patch was applied.`,
          "",
          "### Change",
          "",
          "**Before:**",
          "```",
          currentHintText,
          "```",
          "",
          "**After:**",
          "```",
          proposedHintText,
          "```",
          "",
          "_Review the label changes. If they look correct, merge to keep the nightly QA green._",
        ].join("\n");

        fs.writeFileSync(tmp, prBody, "utf8");
        const prUrl = execSync(
          `gh pr create --title "fix(qa): repair AC_HINTS for ${acId} — auto self-heal" --body-file "${tmp}" --label "install-assurance"`,
          { encoding: "utf8" }
        ).trim();

        console.log(`✅  PR opened: ${prUrl}`);

        postIssueComment([
          `## ✅ Self-Heal: Repair PR Opened`,
          "",
          `A verified repair for \`${acId}\` has been opened: ${prUrl}`,
          "",
          `_Once merged, the next nightly run should pass._`,
        ].join("\n"));

      } catch (e) {
        console.error(`❌  Failed to create PR: ${e.message}`);
        // Revert the patch since we can't open a PR for it
        fs.writeFileSync(agentPath, originalSrc, "utf8");
        anyRepairFailed = true;
      } finally {
        try { fs.unlinkSync(tmp); } catch {}
        // Return to the original branch regardless of outcome
        try { execSync(`git checkout -`, { stdio: "inherit" }); } catch {}
      }
    }
  } finally {
    await browser.close();
  }

  if (anyRepairFailed) process.exit(1);
}

main().catch((e) => {
  console.error("❌  Unexpected repair agent error:", e);
  process.exit(3);
});
