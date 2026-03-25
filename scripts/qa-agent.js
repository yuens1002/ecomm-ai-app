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
 *   QA_TOKEN_BUDGET            Hard token abort limit (default: 300000)
 *
 * Exit codes:
 *   0  All ACs passed
 *   1  One or more ACs failed
 *   2  Token budget exceeded (abort)
 *   3  Infrastructure error (URL unreachable, missing env, unexpected crash)
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local — override: false so inline env vars (e.g. QA_MODEL=sonnet) always win.
// CI sets env vars directly and has no .env.local, so this is a no-op there.
let _dotenvParsed = {};
try {
  const { default: dotenv } = await import("dotenv");
  const result = dotenv.config({ path: path.join(__dirname, "../.env.local"), override: false });
  _dotenvParsed = result.parsed || {};
} catch {}
if (!process.env.BASE_URL && process.env.QA_BASE_URL) {
  process.env.BASE_URL = process.env.QA_BASE_URL;
}

// Special case: if ANTHROPIC_API_KEY is the system Claude Code key (sk-ant-api...),
// override it with the gateway key from .env.local so billing routes correctly.
if (process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-api") && _dotenvParsed.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = _dotenvParsed.ANTHROPIC_API_KEY;
}
if (_dotenvParsed.ANTHROPIC_BASE_URL && !process.env.ANTHROPIC_BASE_URL?.startsWith("https://ai-gateway")) {
  process.env.ANTHROPIC_BASE_URL = _dotenvParsed.ANTHROPIC_BASE_URL;
}

// VERCEL_OIDC_TOKEN fallback if no gateway key configured
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
  // Keep first 6K + last 1.5K — preserves page structure AND bottom elements (buttons, hints)
  const MAX = 8000;
  const TAIL = 1500;
  const trimmed = text.length > MAX
    ? text.slice(0, MAX - TAIL - 5) + "\n...\n" + text.slice(-TAIL)
    : text;
  return { url, text: trimmed };
}

async function toolNavigate(page, { url }) {
  const full = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  console.log(`  → navigate: ${full}`);
  await page.goto(full, { waitUntil: "domcontentloaded", timeout: 30000 });
  return readPage(page);
}

async function toolClick(page, { target }) {
  console.log(`  → click: "${target}"`);
  // Normalize typography so curly-quote vs straight-quote differences don't break matching
  const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const normTarget = norm(target);
  // Try semantic Playwright locators in order: exact match first (avoids demo/partial matches), then partial
  const attempts = [
    () => page.getByRole("button", { name: normTarget, exact: true  }).first().click({ timeout: 3000 }),
    () => page.getByRole("button", { name: normTarget, exact: false }).first().click({ timeout: 3000 }),
    () => page.getByRole("link",   { name: normTarget, exact: true  }).first().click({ timeout: 3000 }),
    () => page.getByRole("link",   { name: normTarget, exact: false }).first().click({ timeout: 3000 }),
    () => page.getByText(normTarget, { exact: true  }).first().click({ timeout: 3000 }),
    () => page.getByText(normTarget, { exact: false }).first().click({ timeout: 3000 }),
    () => page.evaluate((t) => {
      const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (norm(node.nodeValue?.trim() ?? "").toLowerCase().includes(t.toLowerCase())) {
          const el = node.parentElement?.closest('button,a,[role="button"]');
          if (el && !el.disabled) { el.click(); return true; }
        }
      }
      return false;
    }, normTarget),
  ];
  for (const attempt of attempts) {
    try { await attempt(); break; } catch { /* try next */ }
  }
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  return readPage(page);
}

async function toolFill(page, { label, value }) {
  console.log(`  → fill: "${label}" = "${String(value).slice(0, 40)}"`);
  const str = String(value);
  // Use pressSequentially so React controlled inputs receive key events and update state.
  // plain fill() uses CDP text insertion which can bypass React's onChange handler.
  async function typeInto(locator) {
    await locator.click({ timeout: 5000 });
    await locator.fill(""); // clear existing value
    await locator.pressSequentially(str, { delay: 0 });
  }
  try {
    await typeInto(page.getByLabel(label, { exact: false }).first());
  } catch {
    await typeInto(page.getByPlaceholder(label, { exact: false }).first()).catch(() => {});
  }
  return { ok: true };
}

async function toolScrollToBottom(page) {
  console.log(`  → scroll_to_bottom`);
  await page.evaluate(() => {
    const sentinel = document.querySelector('[data-testid="eula-sentinel"]');
    if (sentinel) {
      // Scroll every overflow-y ancestor to its max
      let el = sentinel.parentElement;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          el.scrollTop = el.scrollHeight;
        }
        el = el.parentElement;
      }
      // Also scroll window to bottom and bring sentinel into viewport
      window.scrollTo(0, document.body.scrollHeight);
      sentinel.scrollIntoView({ behavior: "instant", block: "end" });
      // Dispatch scroll events to help IntersectionObserver fire
      window.dispatchEvent(new Event("scroll"));
      document.dispatchEvent(new Event("scroll"));
    } else {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
  // Give IntersectionObserver + React state update time to settle
  await page.waitForTimeout(1500);
  // Use Playwright native locator waiting — more reliable than waitForFunction
  const acceptBtn = page.locator('[data-testid="eula-accept-btn"]');
  const btnExists = await acceptBtn.count() > 0;
  if (btnExists) {
    await acceptBtn.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
    // Poll isEnabled — more reliable than DOM attribute check in headless
    for (let i = 0; i < 10; i++) {
      if (await acceptBtn.isEnabled()) break;
      await page.waitForTimeout(300);
    }
    const enabled = await acceptBtn.isEnabled();
    console.log(`  → eula-accept-btn enabled: ${enabled}`);
  }
  return readPage(page);
}

async function toolWaitForText(page, { text, timeout_ms = 8000 }) {
  console.log(`  → wait_for_text: "${text}" (up to ${timeout_ms}ms)`);
  const deadline = Date.now() + timeout_ms;
  while (Date.now() < deadline) {
    const { url: currentUrl, text: pageText } = await readPage(page);
    const needle = text.toLowerCase();
    // URL match: check path exactly (/admin) or as parent (/admin/settings) — avoids false
    // positives like /auth/admin-signin matching needle "admin"
    const urlPath = (() => { try { return new URL(currentUrl).pathname.toLowerCase(); } catch { return ""; } })();
    const urlMatches = urlPath === `/${needle}` || urlPath.startsWith(`/${needle}/`);
    if (pageText.toLowerCase().includes(needle) || urlMatches)
      return { found: true, url: currentUrl, text: pageText.slice(0, 4000) };
    await page.waitForTimeout(500);
  }
  const { url: finalUrl, text: final } = await readPage(page);
  return { found: false, url: finalUrl, text: final.slice(0, 4000) };
}

async function toolClearSession(page) {
  console.log(`  → clear_session`);
  await page.context().clearCookies();
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  return { ok: true };
}

async function executeTool(page, name, input) {
  switch (name) {
    case "navigate":          return toolNavigate(page, input);
    case "read_page":         return readPage(page);
    case "click":             return toolClick(page, input);
    case "fill":              return toolFill(page, input);
    case "scroll_to_bottom":  return toolScrollToBottom(page);
    case "wait_for_text":     return toolWaitForText(page, input);
    case "clear_session":     return toolClearSession(page);
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
    name: "clear_session",
    description: "Clear browser cookies and localStorage to simulate a fresh logged-out session. Use before sign-in tests.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "done",
    description: "Report the result for this single AC. Call once you have verified it.",
    input_schema: {
      type: "object",
      properties: {
        status:   { type: "string", enum: ["PASS", "FAIL"] },
        evidence: { type: "string", description: "One-line observation" },
      },
      required: ["status", "evidence"],
    },
  },
];

// ── Tool filtering — only give an AC the tools it actually needs ──────────────

function getToolsForAC(ac) {
  const how = (ac.how || "").toLowerCase();
  return TOOLS.filter(({ name }) => {
    // navigate: when How says "navigate to", OR when it involves a redirect chain that requires navigating to a specific sign-in page
    if (name === "navigate")         return how.includes("navigate") || (how.includes("redirect") && how.includes("sign in"));
    // scroll_to_bottom: only when How mentions using the scroll tool
    if (name === "scroll_to_bottom") return how.includes("scroll_to_bottom") || how.includes("scroll eula") || how.includes("scroll pane");
    // click: when How says click, submit, or sign in
    if (name === "click")            return how.includes("click") || how.includes("submit") || how.includes("sign in");
    // fill: when How says fill, OR when signing in (sign-in forms require filling email+password)
    if (name === "fill")             return how.includes("fill") || how.includes("sign in");
    // clear_session: only for sign-out round-trip tests
    if (name === "clear_session")    return how.includes("clear session");
    return true; // read_page, wait_for_text, done always available
  });
}

// ── Per-AC hints — machine-readable guidance for tricky ACs ──────────────────
// Injected into the system prompt when present. Keeps VERIFICATION.md human-
// readable while giving the model precise step-by-step instructions.

const AC_HINTS = {
  "AC-IF-2": [
    "ONLY call read_page once, then call done immediately.",
    "Do NOT call scroll_to_bottom, click, fill, or navigate.",
    "PASS if BOTH are true: (1) the button 'Looks good, let\\'s continue' appears disabled, AND (2) text 'Scroll to the bottom' is visible on the page.",
  ].join(" "),

  "AC-IF-3": [
    "Call scroll_to_bottom ONCE. Then call read_page.",
    "PASS if the button 'Looks good, let\\'s continue' is now enabled (not disabled/grayed).",
    "Do NOT click the button — this AC only verifies the state change, not the click.",
  ].join(" "),

  "AC-IF-4": [
    "The accept button is already enabled from the previous step. Call click('Looks good, let\\'s continue').",
    "Then call read_page. PASS if the page shows 'Your Store' text (step indicator) AND the heading 'Almost there.' with input fields is visible.",
  ].join(" "),

  "AC-IF-5": [
    "The browser is already on the account creation step — do NOT call navigate yet.",
    "Fill these 5 fields in order using the known values:",
    "  fill('Store name', Store name), fill('Your name', Admin name),",
    "  fill('Email address', Admin email),",
    "  fill('Password', Admin password), fill('Confirm password', Admin password).",
    "Then click('Take me to my store').",
    "IMPORTANT: After clicking submit, navigate to '/auth/admin-signin' (the admin sign-in page).",
    "On that page: fill 'Email' with Admin email, fill 'Password' with Admin password, then click 'Sign In'.",
    "Call read_page. PASS if URL path is /admin (does NOT contain /auth).",
  ].join(" "),

  "AC-KV-3": [
    "Navigate to / (homepage). Call read_page.",
    "The accessibility tree snapshot includes both the header/nav area at the top and the footer section at the bottom.",
    "PASS only if Store name text appears in BOTH the header/navigation area AND in the footer section.",
    "FAIL if the name appears in only one location, or does not appear at all.",
  ].join(" "),

  "AC-KV-2": [
    "Call clear_session first (clears cookies + localStorage to log out).",
    "Call navigate('/auth/admin-signin').",
    "Fill 'Email address' with the known Admin email, fill 'Password' with the known Admin password.",
    "Click 'Sign In'. Call read_page. PASS if URL path is /admin (not /auth).",
  ].join(" "),
};

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(ac, currentUrl) {
  const hint = AC_HINTS[ac.id];
  return `You are a QA agent verifying one acceptance criterion for a fresh install of Artisan Roast.

Browser is currently at: ${currentUrl}
Base URL: ${BASE_URL}
Known values — use exactly as given:
  Admin name:     ${KNOWN.adminName}
  Admin email:    ${KNOWN.adminEmail}
  Admin password: ${KNOWN.adminPassword}
  Store name:     ${KNOWN.storeName}

Rules:
- Perform ONLY the action described in "How" below — nothing more
- Do NOT navigate away unless "How" explicitly says to navigate
- /setup uses client-side React state — navigating away resets the flow to the EULA step
- When "How" says "assert" or "check", use read_page to observe — do NOT scroll, click, or fill
- After a click that triggers a redirect, call read_page — the result includes the current URL, which is the most reliable way to confirm where the browser ended up
- Call done with PASS or FAIL and one-line evidence once you have verified the AC

AC to verify:
  ${ac.id}: ${ac.what}
  How:     ${ac.how}
  Pass if: ${ac.pass}${hint ? `\n  Hint:    ${hint}` : ""}`;
}

// ── Single-AC agent loop ──────────────────────────────────────────────────────

async function runSingleAC(page, client, ac, tokenState) {
  const currentUrl = page.url();
  console.log(`\n  ▶ ${ac.id}: ${ac.what}`);
  const messages = [{ role: "user", content: "Verify the AC." }];
  // AC-IF-5 has more steps: fill×5 + click + navigate + fill×2 + click + read_page
  const MAX_TURNS = ac.id === "AC-IF-5" ? 18 : 10;
  const tools = getToolsForAC(ac);
  let turns = 0;

  while (turns < MAX_TURNS) {
    turns++;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: buildSystemPrompt(ac, currentUrl),
      tools,
      messages,
    });

    tokenState.total += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    console.log(`    [tokens] +${response.usage?.input_tokens + response.usage?.output_tokens} → ${tokenState.total}`);

    if (tokenState.total > BUDGET) {
      console.error(`\n❌  Token budget exceeded (${tokenState.total} > ${BUDGET}). Aborting.`);
      process.exit(2);
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      console.warn("  ⚠️  Agent ended without calling done");
      return { id: ac.id, status: "FAIL", evidence: "agent ended without verdict" };
    }

    const toolResults = [];
    let doneResult = null;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "done") {
        doneResult = { id: ac.id, status: block.input.status, evidence: block.input.evidence };
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

    if (doneResult) return doneResult;
    if (toolResults.length) messages.push({ role: "user", content: toolResults });
  }
  return { id: ac.id, status: "FAIL", evidence: "exceeded max turns — agent did not reach a verdict" };
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

  // Log setup API responses
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/admin/setup")) {
      console.log(`  [api] ${response.request().method()} ${url.split("/api")[1]} → ${response.status()}`);
    }
  });

  try {
    // Blockers: if these ACs fail, downstream groups are skipped
    const BLOCKERS = {
      "AC-IF-1": ["knownValues", "appState"],
      "AC-IF-5": ["knownValues", "appState"],
    };
    const blocked = new Set();

    const GROUP_LABELS = {
      installFlow:  "Group A: Install Flow",
      knownValues:  "Group B: Known Value Round-Trips",
      appState:     "Group C: Initial App State",
    };
    const GROUP_BLOCK_KEY = {
      knownValues: "knownValues",
      appState:    "appState",
    };

    for (const [groupKey, groupACs] of Object.entries(groups)) {
      console.log(`\n━━━ ${GROUP_LABELS[groupKey]} ━━━`);
      const blockKey = GROUP_BLOCK_KEY[groupKey];
      if (blockKey && blocked.has(blockKey)) {
        groupACs.forEach((ac) =>
          allResults.push(skipAC(ac.id, "blocked — install flow did not complete"))
        );
        continue;
      }

      for (const ac of groupACs) {
        const r = await runSingleAC(page, client, ac, tokenState);
        allResults.push(r);
        console.log(`  ${r.status === "PASS" ? "✅" : "❌"} ${r.id} ${r.status} — ${r.evidence}`);
        // Gate downstream groups on critical failures
        for (const key of (BLOCKERS[r.id] ?? [])) {
          if (r.status === "FAIL") blocked.add(key);
        }
      }
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
