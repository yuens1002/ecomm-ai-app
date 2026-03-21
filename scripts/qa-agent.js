#!/usr/bin/env node
/**
 * QA Agent — Install Assurance
 *
 * Reads VERIFICATION.md (repo root), parses all AC tables, then uses
 * Claude + Puppeteer to walk through each AC against a live URL.
 * Claude receives screenshots and decides what to do next via custom tools.
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

// Load .env.local for local runs (CI sets env vars directly)
if (!process.env.BASE_URL && !process.env.QA_BASE_URL) {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.join(__dirname, "../.env.local") });
}
// Allow QA_BASE_URL as alias for BASE_URL (matches .env.local convention)
if (!process.env.BASE_URL && process.env.QA_BASE_URL) {
  process.env.BASE_URL = process.env.QA_BASE_URL;
}

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

function parseVerificationMd() {
  const specPath = path.join(__dirname, "../VERIFICATION.md");
  const content = fs.readFileSync(specPath, "utf-8");
  const acs = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (trimmed.includes("---")) continue;

    const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    const [id, what, how, pass] = cells;
    if (id === "AC" || id.startsWith("---")) continue;
    if (!/^AC-[A-Z]+-\d+$/.test(id)) continue;

    acs.push({ id, what, how, pass });
  }

  return acs;
}

// ── Tools ─────────────────────────────────────────────────────────────────

const tools = [
  {
    name: "navigate",
    description: "Navigate the browser to a path (e.g. '/setup') or absolute URL.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path relative to BASE_URL or absolute URL" },
      },
      required: ["path"],
    },
  },
  {
    name: "screenshot",
    description: "Take a screenshot of the current page. Always call this after navigating or taking an action to observe the result.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "click",
    description: "Click at a specific x,y coordinate on the page.",
    input_schema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        description: { type: "string", description: "What you're clicking (for logging)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "type",
    description: "Type text using the keyboard (into the currently focused element).",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to type" },
      },
      required: ["text"],
    },
  },
  {
    name: "scroll",
    description: "Scroll at a specific x,y coordinate. Use direction 'down' or 'up' and amount (number of scroll steps).",
    input_schema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate to scroll at" },
        y: { type: "number", description: "Y coordinate to scroll at" },
        direction: { type: "string", enum: ["down", "up"] },
        amount: { type: "number", description: "Number of scroll steps (default 5)" },
      },
      required: ["x", "y", "direction"],
    },
  },
  {
    name: "key",
    description: "Press a keyboard key (e.g. 'Enter', 'Tab', 'Escape').",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Key name, e.g. Enter, Tab, Escape" },
      },
      required: ["key"],
    },
  },
  {
    name: "check_url",
    description: "Check if the current page pathname starts with an expected path. Use this instead of screenshot to verify navigation succeeded. Be precise: '/admin' will NOT match '/auth/admin-signin'.",
    input_schema: {
      type: "object",
      properties: {
        expected: { type: "string", description: "Expected path prefix (e.g. '/admin', '/setup'). Matched against the URL pathname only — not the full URL." },
      },
      required: ["expected"],
    },
  },
  {
    name: "check_text",
    description: "Check if specific text appears in the page content. Use this instead of screenshot to verify text-based ACs.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to search for in the page" },
        exact: { type: "boolean", description: "If true, match exact string; if false (default), case-insensitive substring match" },
      },
      required: ["text"],
    },
  },
  {
    name: "done",
    description: "Call this when all ACs have been attempted. Returns per-AC results.",
    input_schema: {
      type: "object",
      properties: {
        passed: { type: "boolean", description: "true if every AC passed, false if any failed" },
        results: {
          type: "array",
          description: "One entry per AC in the order they were verified",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "AC identifier, e.g. AC-IF-1" },
              status: { type: "string", enum: ["PASS", "FAIL", "SKIP"] },
              evidence: { type: "string", description: "One-line description of what was observed" },
            },
            required: ["id", "status", "evidence"],
          },
        },
      },
      required: ["passed", "results"],
    },
  },
];

// ── Tool execution ─────────────────────────────────────────────────────────

async function executeTool(page, name, input) {
  switch (name) {
    case "navigate": {
      const rawPath = input.path.startsWith("/") || input.path.startsWith("http") ? input.path : `/${input.path}`;
      const url = rawPath.startsWith("http") ? rawPath : `${BASE_URL}${rawPath}`;
      console.log(`  → navigate: ${url}`);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 500));
      return { ok: true, url };
    }

    case "screenshot": {
      const buf = await page.screenshot({ fullPage: false });
      return { image: buf.toString("base64") };
    }

    case "click": {
      const cx = Number(input.x);
      const cy = Number(input.y);
      if (isNaN(cx) || isNaN(cy)) {
        return { error: `Invalid coordinates x=${input.x}, y=${input.y}. Take a screenshot first to get valid numeric coordinates.` };
      }
      console.log(`  → click (${cx}, ${cy})${input.description ? ` — ${input.description}` : ""}`);
      await page.mouse.click(cx, cy);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true };
    }

    case "type": {
      console.log(`  → type: "${input.text.slice(0, 40)}${input.text.length > 40 ? "…" : ""}"`);
      await page.keyboard.type(input.text, { delay: 40 });
      return { ok: true };
    }

    case "scroll": {
      const deltaY = (input.amount ?? 5) * (input.direction === "up" ? -100 : 100);
      await page.mouse.move(input.x, input.y);
      await page.mouse.wheel({ deltaY });
      await new Promise((r) => setTimeout(r, 500));
      return { ok: true };
    }

    case "key": {
      await page.keyboard.press(input.key);
      await new Promise((r) => setTimeout(r, 400));
      return { ok: true };
    }

    case "check_url": {
      const current = page.url();
      const parsed = new URL(current);
      // Match against pathname+search so "/admin" doesn't match "/auth/admin-signin"
      const matches = parsed.pathname.startsWith(input.expected) || parsed.pathname === input.expected;
      console.log(`  → check_url: ${input.expected} → ${matches ? "MATCH" : "NO MATCH"} (${current})`);
      return { matches, current, pathname: parsed.pathname };
    }

    case "check_text": {
      const content = await page.evaluate(() => document.body.innerText);
      const matches = input.exact
        ? content.includes(input.text)
        : content.toLowerCase().includes(input.text.toLowerCase());
      console.log(`  → check_text: "${input.text.slice(0, 40)}" → ${matches ? "FOUND" : "NOT FOUND"}`);
      return { matches, text: input.text };
    }

    case "done":
      return null; // handled in loop

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Agent loop ─────────────────────────────────────────────────────────────

async function runAgent(page, acs) {
  const client = new Anthropic();

  const resolvedKnownValues = Object.entries(KNOWN_VALUES)
    .map(([k, v]) => `  ${k} = "${v}"`)
    .join("\n");

  const acList = acs
    .map((ac) => `${ac.id}: [${ac.what}] HOW: ${ac.how} PASS IF: ${ac.pass}`)
    .join("\n");

  const systemPrompt = `You are a QA agent verifying a fresh install of a web application.
You have browser tools: navigate, screenshot, click, type, scroll, key, check_url, check_text.

TARGET URL: ${BASE_URL}

KNOWN VALUES (use these exact strings when filling forms):
${resolvedKnownValues}

ACCEPTANCE CRITERIA TO VERIFY (in order):
${acList}

INSTRUCTIONS:
1. Work through each AC in order.
2. Use check_url to verify navigation — it is fast and 100% accurate. Only use screenshot when you need to find where to click on an unfamiliar page.
3. Use check_text to verify text content (store name, headings, status messages). Only use screenshot when you cannot determine pass/fail from text alone.
4. Click using coordinates — take a screenshot first to see where elements are, then click.
5. When filling forms: click the field, then type.
6. To scroll the EULA: scroll at coordinates near the center of the document pane (e.g. x=640, y=400).
7. Record PASS, FAIL, or SKIP for each AC with one-line evidence.
8. When all ACs are attempted, call the done tool with the full results array.

Start by taking a screenshot of /setup.`;

  const messages = [
    {
      role: "user",
      content: `Begin verification. The browser is at ${BASE_URL}/setup. Take a screenshot and start with AC-IF-1.`,
    },
  ];

  let doneResult = null;
  let iterations = 0;
  const MAX_ITERATIONS = 120;

  while (!doneResult && iterations < MAX_ITERATIONS) {
    iterations++;
    process.stdout.write(`\n[iter ${iterations}] `);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
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

      if (block.type !== "tool_use") continue;

      process.stdout.write(`[${block.name}]`);

      if (block.name === "done") {
        doneResult = block.input;
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify({ ok: true }),
        });
        break;
      }

      const result = await executeTool(page, block.name, block.input);

      if (block.name === "screenshot" && result?.image) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: [{ type: "image", source: { type: "base64", media_type: "image/png", data: result.image } }],
        });
      } else {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }
  }

  if (!doneResult && iterations >= MAX_ITERATIONS) {
    console.log(`\n⚠️  MAX_ITERATIONS (${MAX_ITERATIONS}) reached — agent did not call done()`);
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

  const resultMap = new Map((result.results ?? []).map((r) => [r.id, r]));

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

  const passed = (result.results ?? []).filter((r) => r.status === "PASS").length;
  const failed = (result.results ?? []).filter((r) => r.status === "FAIL").length;
  const skipped = (result.results ?? []).filter((r) => r.status === "SKIP").length;

  console.log(`\n${SEP}`);
  console.log(`Total: ${acs.length} ACs | PASS: ${passed} | FAIL: ${failed} | SKIP: ${skipped}`);
  console.log(SEP);

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
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(`${BASE_URL}/setup`, { waitUntil: "networkidle2", timeout: 30000 });

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
