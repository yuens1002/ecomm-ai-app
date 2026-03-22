#!/usr/bin/env node
/**
 * QA Agent — Install Assurance
 *
 * Deterministic Puppeteer verification of VERIFICATION.md ACs against a live URL.
 * No AI in the hot path — fast, cheap, reliable.
 * Claude Haiku is called once at the end only if failures are found, to draft
 * a human-readable GitHub issue body.
 *
 * Usage:
 *   BASE_URL=https://your-qa.vercel.app node scripts/qa-agent.js
 *
 * Required env:
 *   BASE_URL             — target URL (no trailing slash)
 *   ANTHROPIC_API_KEY    — Claude API key (used only on failure for issue body)
 *   QA_ADMIN_NAME        — known admin full name
 *   QA_ADMIN_EMAIL       — known admin email
 *   QA_ADMIN_PASSWORD    — known admin password
 *   QA_STORE_NAME        — expected store name post-setup
 *
 * ── UPDATE THIS FILE WHEN THE SETUP FLOW CHANGES ──────────────────────────
 * If you change the setup UI (selectors, copy, steps), update:
 *   1. SEL — CSS selectors for interactive elements
 *   2. TEXT — visible text strings used for verification
 *   3. The AC blocks in runVerification() that test the changed behaviour
 * Each AC is a clearly labelled block — search for "AC-IF-1" etc. to find it.
 * ──────────────────────────────────────────────────────────────────────────
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

const KNOWN = {
  adminName: process.env.QA_ADMIN_NAME,
  adminEmail: process.env.QA_ADMIN_EMAIL,
  adminPassword: process.env.QA_ADMIN_PASSWORD,
  storeName: process.env.QA_STORE_NAME,
};

// ── Selectors ──────────────────────────────────────────────────────────────
// UPDATE THESE if the setup UI elements change.

const SEL = {
  // data-testid="eula-accept-btn" set in eula-step.tsx — used instead of generic [data-slot="button"]
  // because the new split layout has multiple buttons visible on the page (stepper, etc.)
  eulaAcceptBtn:  '[data-testid="eula-accept-btn"]',  // the scroll-gated accept button
  nameInput:      'input[name="name"]',
  emailInput:     'input[name="email"]',
  passwordInput:  'input[name="password"]',
  confirmInput:   'input[name="confirmPassword"]',
  submitBtn:      'form button[type="submit"]',
  adminSigninLink:'a[href="/auth/admin-signin"]',
};

// ── Text markers ───────────────────────────────────────────────────────────
// UPDATE THESE if visible copy changes.

const TEXT = {
  eulaHeading:    "The fine print",              // heading of eula step
  scrollHint:     "Scroll to the bottom",        // hint shown before scroll
  setupComplete:  "You're all set",              // shown when admin already exists
  storeSetup:     "Almost there",                // step 2 heading
  gettingStarted: "Getting started",             // dashboard checklist
  noProducts:     "No products",
  noOrders:       "No orders",
};

// ── VERIFICATION.md parsing ────────────────────────────────────────────────

function parseVerificationMd() {
  const specPath = path.join(__dirname, "../VERIFICATION.md");
  const content = fs.readFileSync(specPath, "utf-8");
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

// ── Browser helpers ────────────────────────────────────────────────────────

async function navigate(page, urlPath) {
  const raw = urlPath.startsWith("/") || urlPath.startsWith("http") ? urlPath : `/${urlPath}`;
  const url = raw.startsWith("http") ? raw : `${BASE_URL}${raw}`;
  console.log(`  → navigate: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
}

async function checkUrl(page, expected) {
  const pathname = new URL(page.url()).pathname;
  const matches = pathname.startsWith(expected);
  console.log(`  → check_url: ${expected} → ${matches ? "MATCH" : "NO MATCH"} (${pathname})`);
  return matches;
}

async function checkText(page, text) {
  const content = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    // Include visible input/textarea/select values — e.g. store name on settings page
    // is rendered in an <input> and won't appear in innerText.
    const inputValues = Array.from(
      document.querySelectorAll(
        "textarea, select, input:not([type='password']):not([type='hidden']):not([type='checkbox']):not([type='radio'])"
      )
    )
      .map((el) => {
        if (el.tagName === "SELECT") {
          const selectedOptions = Array.from(el.selectedOptions || []);
          return selectedOptions.map((opt) => opt.textContent || "").join(" ");
        }
        return el.value;
      })
      .join(" ");
    return bodyText + " " + inputValues;
  });
  const matches = content.toLowerCase().includes(text.toLowerCase());
  console.log(`  → check_text: "${text.slice(0, 50)}" → ${matches ? "FOUND" : "NOT FOUND"}`);
  return matches;
}

async function getAttribute(page, selector, attr) {
  try {
    const value = await page.$eval(selector, (el, a) => {
      if (a === "disabled") return el.disabled;
      if (a === "aria-disabled") return el.getAttribute("aria-disabled");
      return el.getAttribute(a);
    }, attr);
    console.log(`  → get_attr: ${selector}[${attr}] = ${JSON.stringify(value)}`);
    return value;
  } catch {
    return null;
  }
}

async function fillField(page, selector, value) {
  console.log(`  → fill: ${selector} = "${value.slice(0, 40)}${value.length > 40 ? "…" : ""}"`);
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.type(value, { delay: 30 });
}

async function submitForm(page, selector = SEL.submitBtn) {
  console.log(`  → submit: ${selector}`);
  await page.waitForSelector(selector, { timeout: 5000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
    page.click(selector),
  ]);
}

async function scrollToBottom(page) {
  console.log(`  → scroll_to_bottom`);
  // Use scrollIntoView on the sentinel — this reliably triggers IntersectionObserver
  // in headless Chrome, whereas programmatic scrollTop assignment does not.
  await page.evaluate(() => {
    const sentinel = document.querySelector('[data-testid="eula-sentinel"]');
    if (sentinel) {
      sentinel.scrollIntoView({ behavior: "auto", block: "end" });
    } else {
      // Fallback: scroll the overflow pane or window.
      const pane = document.querySelector(".overflow-y-auto, .overflow-y-scroll");
      if (pane) pane.scrollTop = pane.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
    }
  });
  await new Promise((r) => setTimeout(r, 600));
}

async function clearSession(page) {
  console.log(`  → clear_session`);
  const cookies = await page.cookies();
  if (cookies.length) await page.deleteCookie(...cookies);
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
}

async function signIn(page, email, password) {
  await navigate(page, "/auth/admin-signin");
  await fillField(page, SEL.emailInput, email);
  await fillField(page, SEL.passwordInput, password);
  await submitForm(page);
}

// ── Result helpers ─────────────────────────────────────────────────────────

function pass(id, evidence) {
  console.log(`  ✅ ${id} PASS — ${evidence}`);
  return { id, status: "PASS", evidence };
}

function fail(id, evidence) {
  console.log(`  ❌ ${id} FAIL — ${evidence}`);
  return { id, status: "FAIL", evidence };
}

// ── Verification ───────────────────────────────────────────────────────────

async function runVerification(page) {
  const results = [];

  // ── Install Flow ──────────────────────────────────────────────────────

  // AC-IF-1: /setup accessible on fresh install
  console.log("\n[AC-IF-1]");
  await navigate(page, "/setup");
  const setupLoaded   = await checkUrl(page, "/setup");
  const eulaVisible   = await checkText(page, TEXT.eulaHeading);
  const notComplete   = !(await checkText(page, TEXT.setupComplete));
  results.push(
    setupLoaded && eulaVisible && notComplete
      ? pass("AC-IF-1", "Setup page loaded; EULA heading visible; no 'Setup Already Complete'")
      : fail("AC-IF-1", `loaded=${setupLoaded} eula=${eulaVisible} notComplete=${notComplete}`)
  );

  // AC-IF-2: Accept button is scroll-gated before scrolling
  console.log("\n[AC-IF-2]");
  const ariaDisabledBefore = await getAttribute(page, SEL.eulaAcceptBtn, "aria-disabled");
  const scrollHintVisible  = await checkText(page, TEXT.scrollHint);
  results.push(
    ariaDisabledBefore === "true" && scrollHintVisible
      ? pass("AC-IF-2", "Accept button aria-disabled=true; scroll hint visible")
      : fail("AC-IF-2", `aria-disabled=${ariaDisabledBefore} scrollHint=${scrollHintVisible}`)
  );

  // AC-IF-3: Accept button enables after scrolling to bottom
  console.log("\n[AC-IF-3]");
  await scrollToBottom(page);
  // Poll up to 3s for the IntersectionObserver + React re-render to enable the button.
  let ariaDisabledAfter = "true";
  try {
    await page.waitForFunction(
      (sel) => {
        const btn = document.querySelector(sel);
        return btn && btn.getAttribute("aria-disabled") !== "true";
      },
      { timeout: 3000 },
      SEL.eulaAcceptBtn
    );
    ariaDisabledAfter = null;
  } catch {
    ariaDisabledAfter = await getAttribute(page, SEL.eulaAcceptBtn, "aria-disabled");
  }
  results.push(
    ariaDisabledAfter !== "true"
      ? pass("AC-IF-3", "Accept button aria-disabled removed after scroll")
      : fail("AC-IF-3", `aria-disabled still "${ariaDisabledAfter}" after scroll`)
  );

  // AC-IF-4: EULA acceptance advances to Store Setup step
  console.log("\n[AC-IF-4]");
  try {
    await page.click(SEL.eulaAcceptBtn);
    await new Promise((r) => setTimeout(r, 600));
    const storeSetupVisible = await checkText(page, TEXT.storeSetup);
    const formVisible       = await page.$(`${SEL.nameInput}`) !== null;
    results.push(
      storeSetupVisible && formVisible
        ? pass("AC-IF-4", "Store Setup step visible; name/email/password fields present")
        : fail("AC-IF-4", `storeSetup=${storeSetupVisible} form=${formVisible}`)
    );
  } catch (e) {
    results.push(fail("AC-IF-4", `Click failed: ${e.message}`));
  }

  // AC-IF-5: Admin account creation succeeds with known values
  console.log("\n[AC-IF-5]");
  await fillField(page, SEL.nameInput,    KNOWN.adminName);
  await fillField(page, SEL.emailInput,   KNOWN.adminEmail);
  await fillField(page, SEL.passwordInput, KNOWN.adminPassword);
  await fillField(page, SEL.confirmInput, KNOWN.adminPassword);
  await submitForm(page);
  // After setup, the app calls router.push("/admin") (client-side pushState).
  // The pushState fires waitForNavigation early, but /admin then redirects server-side
  // to /auth/admin-signin (no session). Wait for the full redirect chain to settle.
  await new Promise((r) => setTimeout(r, 2000));
  const atSignin = await checkUrl(page, "/auth");
  if (atSignin) await signIn(page, KNOWN.adminEmail, KNOWN.adminPassword);
  else {
    // Already at /admin somehow — still need a session for subsequent checks
    const stillAdmin = await checkUrl(page, "/admin");
    if (!stillAdmin) await signIn(page, KNOWN.adminEmail, KNOWN.adminPassword);
  }
  const atAdmin = await checkUrl(page, "/admin");
  results.push(
    atAdmin
      ? pass("AC-IF-5", "Admin created; signed in; reached /admin")
      : fail("AC-IF-5", `Expected /admin, got ${new URL(page.url()).pathname}`)
  );

  // AC-IF-6: /setup is locked out after admin exists
  console.log("\n[AC-IF-6]");
  await navigate(page, "/setup");
  const setupBlocked  = await checkText(page, TEXT.setupComplete);
  const formGone      = await page.$(SEL.nameInput) === null;
  results.push(
    setupBlocked && formGone
      ? pass("AC-IF-6", "'Setup Already Complete' shown; no form visible")
      : fail("AC-IF-6", `blocked=${setupBlocked} formGone=${formGone}`)
  );

  // ── Known Value Round-Trips ───────────────────────────────────────────

  // AC-KV-1: Admin name visible in admin UI
  console.log("\n[AC-KV-1]");
  await navigate(page, "/admin");
  // If the post-setup session redirect landed us at /auth, sign in then re-navigate
  if (await checkUrl(page, "/auth")) {
    await signIn(page, KNOWN.adminEmail, KNOWN.adminPassword);
    await navigate(page, "/admin");
  }
  const nameVisible = await checkText(page, KNOWN.adminName);
  results.push(
    nameVisible
      ? pass("AC-KV-1", `"${KNOWN.adminName}" visible on /admin dashboard`)
      : fail("AC-KV-1", `"${KNOWN.adminName}" not found on /admin`)
  );

  // AC-KV-2: Admin email and password authenticate
  console.log("\n[AC-KV-2]");
  await clearSession(page);
  await signIn(page, KNOWN.adminEmail, KNOWN.adminPassword);
  const signInOk = await checkUrl(page, "/admin");
  results.push(
    signInOk
      ? pass("AC-KV-2", `Signed in with known email/password; redirected to /admin`)
      : fail("AC-KV-2", `Sign-in failed; at ${new URL(page.url()).pathname}`)
  );

  // AC-KV-3: Store name appears on storefront
  console.log("\n[AC-KV-3]");
  await navigate(page, "/");
  const storeNameOnHome = await checkText(page, KNOWN.storeName);
  results.push(
    storeNameOnHome
      ? pass("AC-KV-3", `"${KNOWN.storeName}" visible on storefront homepage`)
      : fail("AC-KV-3", `"${KNOWN.storeName}" not found on /`)
  );

  // AC-KV-4: Store name appears in admin settings
  console.log("\n[AC-KV-4]");
  await navigate(page, "/admin/settings");
  const atSettings      = await checkUrl(page, "/admin/settings");
  const storeNameInSettings = atSettings && await checkText(page, KNOWN.storeName);
  results.push(
    storeNameInSettings
      ? pass("AC-KV-4", `"${KNOWN.storeName}" visible in /admin/settings`)
      : fail("AC-KV-4", `atSettings=${atSettings} found=${storeNameInSettings}`)
  );

  // ── Initial App State ─────────────────────────────────────────────────

  // AC-IS-1: Getting Started checklist shows 0 of 4 complete
  console.log("\n[AC-IS-1]");
  await navigate(page, "/admin");
  const checklistVisible = await checkText(page, TEXT.gettingStarted);
  results.push(
    checklistVisible
      ? pass("AC-IS-1", "'Getting started' checklist visible on /admin dashboard")
      : fail("AC-IS-1", "'Getting started' not found on /admin")
  );

  // AC-IS-2: Products section shows empty state
  console.log("\n[AC-IS-2]");
  await navigate(page, "/admin/products");
  const atProducts   = await checkUrl(page, "/admin/products");
  const emptyProducts = atProducts && await checkText(page, TEXT.noProducts);
  results.push(
    emptyProducts
      ? pass("AC-IS-2", "Products page shows empty state")
      : fail("AC-IS-2", `atProducts=${atProducts} empty=${emptyProducts}`)
  );

  // AC-IS-3: Orders section shows empty state
  console.log("\n[AC-IS-3]");
  await navigate(page, "/admin/orders");
  const atOrders   = await checkUrl(page, "/admin/orders");
  const emptyOrders = atOrders && await checkText(page, TEXT.noOrders);
  results.push(
    emptyOrders
      ? pass("AC-IS-3", "Orders page shows empty state")
      : fail("AC-IS-3", `atOrders=${atOrders} empty=${emptyOrders}`)
  );

  // AC-IS-4: Settings page loads without error
  console.log("\n[AC-IS-4]");
  await navigate(page, "/admin/settings");
  const settingsOk = await checkUrl(page, "/admin/settings");
  results.push(
    settingsOk
      ? pass("AC-IS-4", "/admin/settings renders without error")
      : fail("AC-IS-4", `Unexpected URL: ${new URL(page.url()).pathname}`)
  );

  // AC-IS-5: Storefront homepage loads without error
  console.log("\n[AC-IS-5]");
  await navigate(page, "/");
  const homeOk = await checkUrl(page, "/");
  results.push(
    homeOk
      ? pass("AC-IS-5", "Storefront homepage loads without error")
      : fail("AC-IS-5", `Unexpected URL: ${new URL(page.url()).pathname}`)
  );

  // AC-IS-6: Admin navigation links are all reachable
  console.log("\n[AC-IS-6]");
  const navChecks = ["/admin/products", "/admin/orders", "/admin/settings"];
  const navFails = [];
  for (const navPath of navChecks) {
    await navigate(page, navPath);
    const ok = await checkUrl(page, navPath);
    if (!ok) navFails.push(navPath);
  }
  results.push(
    navFails.length === 0
      ? pass("AC-IS-6", "Products, Orders, Settings nav links all reachable")
      : fail("AC-IS-6", `Failed routes: ${navFails.join(", ")}`)
  );

  return results;
}

// ── Failure summary via Haiku ──────────────────────────────────────────────

async function generateFailureSummary(results, runUrl) {
  const failures = results.filter((r) => r.status === "FAIL");
  if (failures.length === 0) return null;

  const client = new Anthropic({ maxRetries: 3 });
  const prompt = `The following install verification ACs failed. Write a concise GitHub issue body (markdown) summarising what failed and why it matters. Be brief — 3-5 bullet points max.

Failed ACs:
${failures.map((f) => `- ${f.id}: ${f.evidence}`).join("\n")}

Run: ${runUrl}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0]?.text ?? null;
}

// ── Output ─────────────────────────────────────────────────────────────────

function printResults(acs, results) {
  const SEP = "─".repeat(70);
  const allPassed = results.every((r) => r.status === "PASS");
  console.log(`\n${SEP}`);
  console.log(allPassed ? "✅  INSTALL VERIFICATION PASSED" : "❌  INSTALL VERIFICATION FAILED");
  console.log(SEP);

  const resultMap = new Map(results.map((r) => [r.id, r]));

  console.log("\nPer-AC Results:\n");
  console.log(`${"AC".padEnd(12)} ${"Status".padEnd(6)} Evidence`);
  console.log(`${"-".repeat(12)} ${"-".repeat(6)} ${"-".repeat(48)}`);

  for (const ac of acs) {
    const r = resultMap.get(ac.id);
    const status   = r?.status ?? "SKIP";
    const evidence = r?.evidence ?? "(not attempted)";
    const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️ ";
    console.log(`${icon} ${ac.id.padEnd(10)} ${status.padEnd(6)} ${evidence}`);
  }

  const passed  = results.filter((r) => r.status === "PASS").length;
  const failed  = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`\n${SEP}`);
  console.log(`Total: ${acs.length} ACs | PASS: ${passed} | FAIL: ${failed} | SKIP: ${skipped}`);
  console.log(SEP);

  console.log("\n::group::JSON Results");
  console.log(JSON.stringify({ passed: allPassed, results }, null, 2));
  console.log("::endgroup::");

  return allPassed;
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
    await navigate(page, "/setup");

    const results = await runVerification(page);

    // Fail any AC from the spec that has no test block in runVerification().
    // A missing test is a bug in the agent, not a skip — it must not silently pass.
    const testedIds = new Set(results.map((r) => r.id));
    for (const ac of acs) {
      if (!testedIds.has(ac.id)) {
        results.push(fail(ac.id, "No test block implemented in qa-agent.js — add one or remove the AC from VERIFICATION.md"));
      }
    }

    const allPassed = printResults(acs, results);

    if (!allPassed) {
      const runUrl = `${process.env.GITHUB_SERVER_URL ?? ""}/${process.env.GITHUB_REPOSITORY ?? ""}/actions/runs/${process.env.GITHUB_RUN_ID ?? "local"}`;
      const summary = await generateFailureSummary(results, runUrl);
      if (summary) {
        console.log("\n::group::Failure Summary (for GitHub issue)");
        console.log(summary);
        console.log("::endgroup::");
      }
    }

    process.exit(allPassed ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
