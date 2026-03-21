#!/usr/bin/env node
/**
 * QA Agent — Install Assurance
 *
 * Reads VERIFICATION.md (repo root), parses all AC tables, then uses
 * Claude computer use to walk through each AC against a live URL.
 *
 * Usage:
 *   BASE_URL=https://your-qa.vercel.app node scripts/qa-agent.js
 *
 * Required env:
 *   BASE_URL             — target URL (no trailing slash)
 *   ANTHROPIC_API_KEY    — Claude API key
 *   QA_ADMIN_NAME        — known admin full name
 *   QA_ADMIN_EMAIL       — known admin email
 *   QA_ADMIN_PASSWORD    — known admin password
 *   QA_STORE_NAME        — expected store name post-setup
 */

import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Env validation ─────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, "");
const REQUIRED_ENV = ["BASE_URL", "ANTHROPIC_API_KEY", "QA_ADMIN_NAME", "QA_ADMIN_EMAIL", "QA_ADMIN_PASSWORD", "QA_STORE_NAME"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

// Known values — resolved here in Node so Claude never sees raw $VAR references
const KNOWN_VALUES = {
  QA_ADMIN_NAME: process.env.QA_ADMIN_NAME,
  QA_ADMIN_EMAIL: process.env.QA_ADMIN_EMAIL,
  QA_ADMIN_PASSWORD: process.env.QA_ADMIN_PASSWORD,
  QA_STORE_NAME: process.env.QA_STORE_NAME,
};

// ── VERIFICATION.md parsing ────────────────────────────────────────────────

/**
 * Parse all AC rows from VERIFICATION.md.
 * Returns { id, what, how, pass }[] for every non-header, non-separator row.
 */
function parseVerificationMd() {
  const specPath = path.join(__dirname, "../VERIFICATION.md");
  const content = fs.readFileSync(specPath, "utf-8");
  const acs = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip non-table lines, header rows, and separator rows
    if (!trimmed.startsWith("|")) continue;
    if (trimmed.includes("---")) continue;

    const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    const [id, what, how, pass] = cells;
    // Skip header rows (id column is "AC" or "---")
    if (id === "AC" || id.startsWith("---")) continue;
    // Only include rows that look like AC-XX-N
    if (!/^AC-[A-Z]+-\d+$/.test(id)) continue;

    acs.push({ id, what, how, pass });
  }

  return acs;
}

// ── Tools definition ───────────────────────────────────────────────────────

const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 800;

const computerTool = {
  type: "computer_20241022",
  name: "computer",
  display_width_px: DISPLAY_WIDTH,
  display_height_px: DISPLAY_HEIGHT,
};

const doneTool = {
  name: "done",
  description: "Call this when all ACs have been attempted. Returns per-AC results.",
  input_schema: {
    type: "object",
    properties: {
      passed: {
        type: "boolean",
        description: "true if every AC passed, false if any failed",
      },
      results: {
        type: "array",
        description: "One entry per AC in the order they were verified",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "AC identifier, e.g. AC-IF-1" },
            status: { type: "string", enum: ["PASS", "FAIL", "SKIP"], description: "Result" },
            evidence: { type: "string", description: "One-line description of what was observed" },
          },
          required: ["id", "status", "evidence"],
        },
      },
    },
    required: ["passed", "results"],
  },
};

// ── Computer use executor ──────────────────────────────────────────────────

async function executeComputerAction(page, action) {
  switch (action.action) {
    case "screenshot": {
      const buf = await page.screenshot({ fullPage: false });
      return { type: "base64", media_type: "image/png", data: buf.toString("base64") };
    }

    case "left_click": {
      const [x, y] = action.coordinate;
      await page.mouse.click(x, y);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true };
    }

    case "right_click": {
      const [x, y] = action.coordinate;
      await page.mouse.click(x, y, { button: "right" });
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    }

    case "double_click": {
      const [x, y] = action.coordinate;
      await page.mouse.dblclick(x, y);
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    }

    case "mouse_move": {
      const [x, y] = action.coordinate;
      await page.mouse.move(x, y);
      return { ok: true };
    }

    case "left_click_drag": {
      const [sx, sy] = action.start_coordinate;
      const [ex, ey] = action.coordinate;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(ex, ey);
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    }

    case "type": {
      await page.keyboard.type(action.text, { delay: 40 });
      return { ok: true };
    }

    case "key": {
      // Map common key names
      const keyMap = { Return: "Enter", Escape: "Escape", Tab: "Tab" };
      const key = keyMap[action.text] ?? action.text;
      await page.keyboard.press(key);
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    }

    case "scroll": {
      const [x, y] = action.coordinate;
      const deltaY = (action.amount ?? 3) * (action.direction === "up" ? -100 : 100);
      await page.mouse.move(x, y);
      await page.mouse.wheel({ deltaY });
      await new Promise((r) => setTimeout(r, 500));
      return { ok: true };
    }

    default:
      return { error: `Unknown computer action: ${action.action}` };
  }
}

// ── Navigate helper ────────────────────────────────────────────────────────

async function navigate(page, urlPath) {
  const url = urlPath.startsWith("http") ? urlPath : `${BASE_URL}${urlPath}`;
  console.log(`  → navigate: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
}

// ── Agent loop ─────────────────────────────────────────────────────────────

async function runAgent(page, acs) {
  const client = new Anthropic();

  // Resolve known values into the system prompt — no raw $VAR references reach Claude
  const resolvedKnownValues = Object.entries(KNOWN_VALUES)
    .map(([k, v]) => `  ${k} = "${v}"`)
    .join("\n");

  const acList = acs
    .map((ac) => `${ac.id}: [${ac.what}] HOW: ${ac.how} PASS IF: ${ac.pass}`)
    .join("\n");

  const systemPrompt = `You are a QA agent verifying a fresh install of a web application.

TARGET URL: ${BASE_URL}

KNOWN VALUES (already resolved — use these exact strings when filling in forms):
${resolvedKnownValues}

ACCEPTANCE CRITERIA TO VERIFY (in order):
${acList}

INSTRUCTIONS:
1. Work through each AC in the order listed above.
2. Before checking each AC, navigate to the appropriate page and take a screenshot.
3. After each action (click, type, scroll, key), take a screenshot to observe the result.
4. Record PASS, FAIL, or SKIP for each AC with a one-line evidence description.
5. When all ACs have been attempted, call the \`done\` tool with the full results array.

RULES:
- Never skip an AC without attempting it (SKIP only if a prior failure makes it impossible).
- Use the exact known values when filling forms — do not invent credentials.
- The URL for the setup page is: ${BASE_URL}/setup
- After admin creation, the app should redirect to /admin.
- To sign out: look for a user menu, profile, or sign out link in the top navigation.

Start by navigating to /setup and taking a screenshot.`;

  const messages = [
    {
      role: "user",
      content: `Begin verification. Navigate to /setup and start with AC-IF-1.`,
    },
  ];

  let doneResult = null;
  let iterations = 0;
  const MAX_ITERATIONS = 60;

  // Navigate to setup first
  await navigate(page, "/setup");

  while (!doneResult && iterations < MAX_ITERATIONS) {
    iterations++;
    process.stdout.write(`\n[iteration ${iterations}] `);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [computerTool, doneTool],
      messages,
      betas: ["computer-use-2024-10-22"],
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      console.log("\nAgent stopped without calling done()");
      break;
    }

    const toolResults = [];

    for (const block of response.content) {
      if (block.type === "text") {
        process.stdout.write(".");
        continue;
      }

      if (block.type === "tool_use" && block.name === "done") {
        doneResult = block.input;
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ ok: true }),
        });
        break;
      }

      if (block.type === "tool_use" && block.name === "computer") {
        const action = block.input;
        process.stdout.write(`[${action.action}]`);

        const result = await executeComputerAction(page, action);

        if (action.action === "screenshot") {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: [{ type: "image", source: result }],
          });
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
    }

    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }
  }

  if (iterations >= MAX_ITERATIONS && !doneResult) {
    console.error("\n⚠️  Max iterations reached without done() call");
  }

  return doneResult;
}

// ── Output ─────────────────────────────────────────────────────────────────

function printResults(acs, result) {
  const SEP = "─".repeat(70);

  console.log(`\n${SEP}`);
  console.log(result?.passed ? "✅  INSTALL VERIFICATION PASSED" : "❌  INSTALL VERIFICATION FAILED");
  console.log(SEP);

  if (!result) {
    console.log("Agent did not return results.");
    return;
  }

  // Build a map for quick lookup
  const resultMap = new Map((result.results ?? []).map((r) => [r.id, r]));

  // Print per-AC table
  console.log("\nPer-AC Results:\n");
  console.log(`${"AC".padEnd(12)} ${"Status".padEnd(6)} Evidence`);
  console.log(`${"-".repeat(12)} ${"-".repeat(6)} ${"-".repeat(48)}`);

  for (const ac of acs) {
    const r = resultMap.get(ac.id);
    const status = r?.status ?? "SKIP";
    const evidence = r?.evidence ?? "(not attempted)";
    const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️ ";
    console.log(`${icon} ${ac.id.padEnd(10)} ${status.padEnd(6)} ${evidence}`);
  }

  // Summary counts
  const passed = (result.results ?? []).filter((r) => r.status === "PASS").length;
  const failed = (result.results ?? []).filter((r) => r.status === "FAIL").length;
  const skipped = (result.results ?? []).filter((r) => r.status === "SKIP").length;

  console.log(`\n${SEP}`);
  console.log(`Total: ${acs.length} ACs | PASS: ${passed} | FAIL: ${failed} | SKIP: ${skipped}`);
  console.log(SEP);

  // Also emit JSON for workflow parsing
  console.log("\n::group::JSON Results");
  console.log(JSON.stringify(result, null, 2));
  console.log("::endgroup::");
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🤖 QA Agent — Install Assurance`);
  console.log(`📋 Spec: VERIFICATION.md`);
  console.log(`🌐 Target: ${BASE_URL}\n`);

  const acs = parseVerificationMd();
  if (acs.length === 0) {
    console.error("❌  No ACs found in VERIFICATION.md");
    process.exit(1);
  }
  console.log(`📝 Loaded ${acs.length} ACs from VERIFICATION.md\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT });

    const result = await runAgent(page, acs);
    printResults(acs, result);

    process.exit(result?.passed ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
