#!/usr/bin/env node
/**
 * QA Agent — Install Assurance
 *
 * Playwright + Claude Agent SDK. Claude drives the browser via semantic
 * accessibility-tree tools — no hardcoded selectors, no fixed timeouts,
 * no screenshots. Resilient to UI copy and layout changes.
 *
 * All Claude API calls route through the Vercel AI Gateway, billing against
 * the Max subscription (ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY).
 *
 * Usage (local development):
 *   npx prisma migrate reset --force
 *   BASE_URL=http://localhost:3000 QA_MODEL=claude-haiku-4-5-20251001 node scripts/qa-agent.js
 *
 * Usage (nightly CI / maintainer QA run against dedicated QA stack):
 *   ⚠️  Always use explicit values — shell vars from .env.local are NOT auto-exported:
 *   DATABASE_URL="<qa-db-url>" DIRECT_URL="<qa-direct-url>" npx prisma migrate reset --force
 *   BASE_URL=https://artisan-roast-qa.vercel.app node scripts/qa-agent.js
 *
 * Required env:
 *   BASE_URL / QA_BASE_URL     target URL (no trailing slash)
 *   VERCEL_OIDC_TOKEN          set automatically by `vercel env pull` (used as API key)
 *   QA_ADMIN_NAME
 *   QA_ADMIN_EMAIL
 *   QA_ADMIN_PASSWORD
 *   QA_STORE_NAME
 *
 * Optional env:
 *   QA_MODEL                   Claude model (default: claude-sonnet-4-6)
 *   QA_TOKEN_BUDGET            Hard token abort limit (default: 150000)
 *
 * Exit codes:
 *   0  All ACs passed
 *   1  One or more ACs failed
 *   2  Token budget exceeded (abort)
 *   3  Infrastructure error (URL unreachable, missing env, unexpected crash)
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local for local runs (CI sets env vars directly)
// Always load .env.local for local runs — inline env vars override it.
// CI sets env vars directly and has no .env.local, so this is a no-op there.
try {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: path.join(__dirname, "../.env.local"), override: true });
} catch {}
if (!process.env.BASE_URL && process.env.QA_BASE_URL) {
  process.env.BASE_URL = process.env.QA_BASE_URL;
}

// VERCEL_OIDC_TOKEN (from `vercel env pull`) is the gateway auth token.
// Fall back to it automatically so ANTHROPIC_API_KEY doesn't need to be
// set separately in .env.local after every pull.
if (!process.env.ANTHROPIC_API_KEY && process.env.VERCEL_OIDC_TOKEN) {
  process.env.ANTHROPIC_API_KEY = process.env.VERCEL_OIDC_TOKEN;
}
if (!process.env.ANTHROPIC_BASE_URL) {
  process.env.ANTHROPIC_BASE_URL = "https://ai-gateway.vercel.sh";
}

// ── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, "");
const MODEL    = process.env.QA_MODEL || "claude-sonnet-4-6";
const BUDGET   = parseInt(process.env.QA_TOKEN_BUDGET || "300000", 10);

const REQUIRED = [
  "BASE_URL", "ANTHROPIC_API_KEY",
  "QA_ADMIN_NAME", "QA_ADMIN_EMAIL", "QA_ADMIN_PASSWORD", "QA_STORE_NAME",
];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌  Missing required env vars: ${missing.join(", ")}`);
  process.exit(3);
}

const KNOWN = {
  adminName:     process.env.QA_ADMIN_NAME,
  adminEmail:    process.env.QA_ADMIN_EMAIL,
  adminPassword: process.env.QA_ADMIN_PASSWORD,
  storeName:     process.env.QA_STORE_NAME,
};

// ── VERIFICATION.md parsing (unchanged from previous agent) ─────────────────

function parseVerificationMd() {
  const specPath = path.join(__dirname, "../VERIFICATION.md");
  const content  = fs.readFileSync(specPath, "utf-8");
  const acs = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || trimmed.includes("---")) continue;
    const cells = trimmed.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    const [id, what, how, pass] = cells;
    if (id === "AC" || !/^AC-[A-Z]+-\d+$/.test(id)) continue;
    acs.push({ id, what, how, pass });
  }
  return acs;
}

function groupACs(acs) {
  return {
    installFlow:  acs.filter((ac) => ac.id.startsWith("AC-IF-")),
    knownValues:  acs.filter((ac) => ac.id.startsWith("AC-KV-")),
    appState:     acs.filter((ac) => ac.id.startsWith("AC-IS-")),
  };
}

// ── Playwright tool implementations ─────────────────────────────────────────

async function readPage(page) {
  const url = page.url();
  let text;
  try {
    text = await page.locator("body").ariaSnapshot({ timeout: 5000 });
  } catch {
    text = await page.evaluate(() => document.body.innerText).catch(() => "");
  }
  // Cap at 8K chars — keeps tokens low while preserving all visible content
  return { url, text: text.slice(0, 8000) };
}

async function toolNavigate(page, { url }) {
  const full = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  console.log(`  → navigate: ${full}`);
  await page.goto(full, { waitUntil: "domcontentloaded", timeout: 30000 });
  return readPage(page);
}

async function toolClick(page, { target }) {
  console.log(`  → click: "${target}"`);
  // Try semantic Playwright locators in order: button → link → text → tree-walker fallback
  const attempts = [
    () => page.getByRole("button", { name: target, exact: false }).first().click({ timeout: 3000 }),
    () => page.getByRole("link",   { name: target, exact: false }).first().click({ timeout: 3000 }),
    () => page.getByText(target,   { exact: false }).first().click({ timeout: 3000 }),
    () => page.evaluate((t) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue?.trim().toLowerCase().includes(t.toLowerCase())) {
          const el = node.parentElement?.closest('button,a,[role="button"]');
          if (el) { el.click(); return true; }
        }
      }
      return false;
    }, target),
  ];
  for (const attempt of attempts) {
    try { await attempt(); break; } catch { /* try next */ }
  }
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  return readPage(page);
}

async function toolFill(page, { label, value }) {
  console.log(`  → fill: "${label}" = "${String(value).slice(0, 40)}"`);
  try {
    await page.getByLabel(label, { exact: false }).fill(value, { timeout: 5000 });
  } catch {
    await page.getByPlaceholder(label, { exact: false }).fill(value, { timeout: 3000 }).catch(() => {});
  }
  return { ok: true };
}

async function toolScrollToBottom(page) {
  console.log(`  → scroll_to_bottom`);
  await page.evaluate(() => {
    const sentinel = document.querySelector('[data-testid="eula-sentinel"]');
    if (sentinel) sentinel.scrollIntoView({ behavior: "instant", block: "end" });
    else window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(800);
  return readPage(page);
}

async function toolWaitForText(page, { text, timeout_ms = 8000 }) {
  console.log(`  → wait_for_text: "${text}" (up to ${timeout_ms}ms)`);
  const deadline = Date.now() + timeout_ms;
  while (Date.now() < deadline) {
    const { text: pageText } = await readPage(page);
    if (pageText.toLowerCase().includes(text.toLowerCase()))
      return { found: true, text: pageText.slice(0, 4000) };
    await page.waitForTimeout(500);
  }
  const { text: final } = await readPage(page);
  return { found: false, text: final.slice(0, 4000) };
}

async function executeTool(page, name, input) {
  switch (name) {
    case "navigate":          return toolNavigate(page, input);
    case "read_page":         return readPage(page);
    case "click":             return toolClick(page, input);
    case "fill":              return toolFill(page, input);
    case "scroll_to_bottom":  return toolScrollToBottom(page);
    case "wait_for_text":     return toolWaitForText(page, input);
    default:                  return { error: `Unknown tool: ${name}` };
  }
}

// ── Tool schemas ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "navigate",
    description: "Navigate to a URL or path. Use paths like /setup, /admin.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "read_page",
    description: "Read the current page as an accessibility tree. Use to verify visible content.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "click",
    description: "Click an element by its visible label or button/link text.",
    input_schema: {
      type: "object",
      properties: { target: { type: "string", description: "Visible button label, link text, or accessible name" } },
      required: ["target"],
    },
  },
  {
    name: "fill",
    description: "Fill a form field identified by its label.",
    input_schema: {
      type: "object",
      properties: {
        label: { type: "string", description: "Form field label text (e.g. 'Email address', 'Your name')" },
        value: { type: "string", description: "Value to enter" },
      },
      required: ["label", "value"],
    },
  },
  {
    name: "scroll_to_bottom",
    description: "Scroll to the bottom of the page. Required before the EULA accept button becomes enabled.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "wait_for_text",
    description: "Wait until specific text appears on the page (polls up to timeout_ms).",
    input_schema: {
      type: "object",
      properties: {
        text:       { type: "string", description: "Text to wait for" },
        timeout_ms: { type: "number", description: "Max wait in ms (default 8000)" },
      },
      required: ["text"],
    },
  },
  {
    name: "done",
    description: "Report your results for this AC group. Call when all ACs are verified.",
    input_schema: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id:       { type: "string" },
              status:   { type: "string", enum: ["PASS", "FAIL"] },
              evidence: { type: "string", description: "One-line observation" },
            },
            required: ["id", "status", "evidence"],
          },
        },
      },
      required: ["results"],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(acGroup) {
  return `You are a QA agent verifying a fresh install of Artisan Roast (self-hosted e-commerce).

Target: ${BASE_URL}
Known values — use exactly as given, do not modify:
  Admin name:     ${KNOWN.adminName}
  Admin email:    ${KNOWN.adminEmail}
  Admin password: ${KNOWN.adminPassword}
  Store name:     ${KNOWN.storeName}

Rules:
- Work through each AC below in order
- For each AC: take the described action, read the result, record PASS or FAIL with one-line evidence
- Use \`wait_for_text\` after any click that triggers an API call or page transition
- Use \`read_page\` to verify visible content before asserting
- Never use CSS selectors — use visible labels and button text only
- Call \`done\` when all ACs are verified

ACs:
${acGroup.map((ac) =>
  `${ac.id}: ${ac.what}\n  How: ${ac.how}\n  Pass if: ${ac.pass}`
).join("\n\n")}`;
}

// ── Agent loop ────────────────────────────────────────────────────────────────

async function runGroupAgent(page, client, acGroup, tokenState) {
  const messages = [{ role: "user", content: "Begin verification." }];

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(acGroup),
      tools: TOOLS,
      messages,
    });

    tokenState.total += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    console.log(`  [tokens] ${tokenState.total} / ${BUDGET}`);

    if (tokenState.total > BUDGET) {
      console.error(`\n❌  Token budget exceeded (${tokenState.total} > ${BUDGET}). Aborting.`);
      process.exit(2);
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      console.warn("  ⚠️  Agent ended without calling done");
      return [];
    }

    const toolResults = [];
    let doneResults = null;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "done") {
        doneResults = block.input.results;
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: '{"ok":true}' });
        break;
      }

      const result = await executeTool(page, block.name, block.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    if (doneResults) return doneResults;
    if (toolResults.length) messages.push({ role: "user", content: toolResults });
  }
}

// ── Result helpers ────────────────────────────────────────────────────────────

function skipAC(id, reason) {
  console.log(`  ⏭️  ${id} SKIP — ${reason}`);
  return { id, status: "SKIP", evidence: reason };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Artisan Roast Install Verification`);
  console.log(`   URL:    ${BASE_URL}`);
  console.log(`   Model:  ${MODEL}`);
  console.log(`   Budget: ${BUDGET.toLocaleString()} tokens\n`);

  // Preflight health check — fail fast before spinning up browser
  try {
    const res = await fetch(`${BASE_URL}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`✅  Health check passed\n`);
  } catch (e) {
    console.error(`❌  Cannot reach ${BASE_URL}: ${e.message}`);
    process.exit(3);
  }

  const acs    = parseVerificationMd();
  const groups = groupACs(acs);
  const client = new Anthropic(); // reads ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY from env
  const tokenState = { total: 0 };
  const allResults = [];

  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    const blocked = new Set();

    // ── Group A: Install Flow ─────────────────────────────────────────────
    console.log("━━━ Group A: Install Flow ━━━");
    const ifResults = await runGroupAgent(page, client, groups.installFlow, tokenState);
    for (const r of ifResults) {
      allResults.push(r);
      console.log(`  ${r.status === "PASS" ? "✅" : "❌"} ${r.id} ${r.status} — ${r.evidence}`);
    }

    // Block downstream groups if critical install steps failed
    const ifFailed = new Set(ifResults.filter((r) => r.status === "FAIL").map((r) => r.id));
    if (ifFailed.has("AC-IF-1")) {
      blocked.add("knownValues");
      blocked.add("appState");
    } else if (ifFailed.has("AC-IF-5")) {
      blocked.add("knownValues");
      blocked.add("appState");
    }

    // ── Group B: Known Value Round-Trips ──────────────────────────────────
    console.log("\n━━━ Group B: Known Value Round-Trips ━━━");
    if (blocked.has("knownValues")) {
      groups.knownValues.forEach((ac) =>
        allResults.push(skipAC(ac.id, "blocked — install flow did not complete"))
      );
    } else {
      const kvResults = await runGroupAgent(page, client, groups.knownValues, tokenState);
      kvResults.forEach((r) => {
        allResults.push(r);
        console.log(`  ${r.status === "PASS" ? "✅" : "❌"} ${r.id} ${r.status} — ${r.evidence}`);
      });
    }

    // ── Group C: Initial App State ────────────────────────────────────────
    console.log("\n━━━ Group C: Initial App State ━━━");
    if (blocked.has("appState")) {
      groups.appState.forEach((ac) =>
        allResults.push(skipAC(ac.id, "blocked — install flow did not complete"))
      );
    } else {
      const isResults = await runGroupAgent(page, client, groups.appState, tokenState);
      isResults.forEach((r) => {
        allResults.push(r);
        console.log(`  ${r.status === "PASS" ? "✅" : "❌"} ${r.id} ${r.status} — ${r.evidence}`);
      });
    }
  } finally {
    await browser.close();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const failed  = allResults.filter((r) => r.status === "FAIL");
  const skipped = allResults.filter((r) => r.status === "SKIP");
  const checked = allResults.length - skipped.length;

  console.log("\n━━━ Summary ━━━");
  for (const r of allResults) {
    const icon = r.status === "PASS" ? "✅" : r.status === "SKIP" ? "⏭️ " : "❌";
    console.log(`${icon}  ${r.id.padEnd(10)} ${r.status.padEnd(5)}  ${r.evidence}`);
  }
  console.log(`\n${failed.length === 0 ? "✅" : "❌"}  ${checked} checked  •  ${failed.length} failed  •  ${skipped.length} skipped`);
  console.log(`   Tokens: ${tokenState.total.toLocaleString()} / ${BUDGET.toLocaleString()}`);

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("❌  Unexpected error:", e);
  process.exit(3);
});
