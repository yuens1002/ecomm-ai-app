import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots");

interface SearchPayload {
  intent: string | null;
  acknowledgment: string | null;
  filtersExtracted: Record<string, unknown> | null;
  products: unknown[];
  followUps: string[];
  aiFailed: boolean;
}

const CADENCE_RULES: Record<string, (p: SearchPayload) => string[]> = {
  discover: (p) => {
    const fails: string[] = [];
    if (!p.products || p.products.length === 0) fails.push("discover: expected products.length > 0");
    if (!p.acknowledgment?.trim()) fails.push("discover: expected acknowledgment to be present");
    return fails;
  },
  recommend: (p) => {
    const fails: string[] = [];
    if (!p.acknowledgment?.trim()) fails.push("recommend: expected acknowledgment to be present");
    return fails;
  },
  compare: (p) => {
    const fails: string[] = [];
    if (!p.acknowledgment?.trim()) fails.push("compare: expected acknowledgment to be present");
    return fails;
  },
  how_to: (p) => {
    const fails: string[] = [];
    if (p.products.length > 0) fails.push(`how_to: expected products: [], got ${p.products.length}`);
    if (!p.acknowledgment?.trim()) fails.push("how_to: expected acknowledgment to be present");
    return fails;
  },
  reorder: (p) => {
    const fails: string[] = [];
    if (p.products.length > 0) fails.push(`reorder: expected products: [], got ${p.products.length}`);
    if (!p.acknowledgment?.trim()) fails.push("reorder: expected acknowledgment/redirect cue to be present");
    return fails;
  },
};

function assertCadence(p: SearchPayload): string[] {
  if (p.aiFailed) {
    return p.products.length > 0
      ? [`aiFailed: true — expected products: [], got ${p.products.length} (raw keyword results leaked)`]
      : [];
  }
  if (!p.intent) {
    return p.products.length > 0
      ? [`intent: null — expected products: [], got ${p.products.length}`]
      : [];
  }
  const rule = CADENCE_RULES[p.intent];
  if (!rule) return [`unknown intent "${p.intent}"`];
  return rule(p);
}

interface TestCase {
  label: string;
  query: string;
  screenshotName: string;
}

const TEST_CASES: TestCase[] = [
  {
    label: "recommend/pick: which is better with milk, Yirgacheffe or Sidamo?",
    query: "which is better with milk, Ethiopian Yirgacheffe or Sidamo?",
    screenshotName: "cadence-recommend-milk.png",
  },
  {
    label: "how_to: how do I get a good bloom on a pour-over?",
    query: "how do I get a good bloom on a pour-over?",
    screenshotName: "cadence-howto-bloom.png",
  },
  {
    label: "compare: what's the difference between light and dark roast?",
    query: "what's the difference between light and dark roast?",
    screenshotName: "cadence-compare-roast.png",
  },
];

async function runCase(
  tc: TestCase,
  browser: import("playwright").Browser,
  results: { label: string; intent: string | null; aiFailed: boolean; failures: string[] }[]
) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let apiPayload: SearchPayload | null = null;
  page.on("response", async (response) => {
    if (response.url().includes("/api/search") && response.status() === 200) {
      try { apiPayload = await response.json() as SearchPayload; } catch { /* ignore */ }
    }
  });

  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");

  const counterBtn = page.getByRole("button", { name: /counter.*chat/i });
  await counterBtn.waitFor({ state: "visible", timeout: 10000 });
  await counterBtn.click();
  await page.getByRole("button", { name: "Send message" }).waitFor({ state: "visible", timeout: 10000 });

  const input = page.locator("input").last();
  await input.fill(tc.query);
  await input.press("Enter");

  await new Promise((r) => setTimeout(r, 20000));

  if (apiPayload) {
    const p = apiPayload as SearchPayload;
    const failures = assertCadence(p);
    results.push({ label: tc.label, intent: p.intent, aiFailed: p.aiFailed, failures });

    console.log(`\n[${tc.label}]`);
    console.log("  intent        :", p.intent);
    console.log("  aiFailed      :", p.aiFailed);
    console.log("  acknowledgment:", p.acknowledgment ? `"${p.acknowledgment.slice(0, 80)}..."` : null);
    console.log("  products      :", p.products.length);
    console.log("  cadence       :", failures.length === 0 ? "PASS" : `FAIL — ${failures.join("; ")}`);

    const drawer = page.locator('[data-vaul-drawer-direction="right"]').first();
    const drawerVisible = await drawer.isVisible().catch(() => false);
    const screenshotPath = path.join(OUTPUT_DIR, tc.screenshotName);
    if (drawerVisible) {
      await drawer.screenshot({ path: screenshotPath });
    } else {
      await page.screenshot({ path: screenshotPath, clip: { x: 1080, y: 0, width: 360, height: 900 } });
    }
    console.log("  screenshot    :", screenshotPath);
  } else {
    results.push({ label: tc.label, intent: null, aiFailed: false, failures: ["No API response intercepted"] });
    console.log(`\n[${tc.label}] ERROR: No API response intercepted`);
  }

  await context.close();
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results: { label: string; intent: string | null; aiFailed: boolean; failures: string[] }[] = [];

  for (const tc of TEST_CASES) {
    await runCase(tc, browser, results);
  }

  await browser.close();

  const passed = results.filter((r) => r.failures.length === 0).length;
  const failed = results.filter((r) => r.failures.length > 0).length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Cadence contract: ${passed}/${results.length} PASS, ${failed} FAIL`);
  if (failed > 0) {
    console.log("\nFAILURES:");
    results.filter((r) => r.failures.length > 0).forEach((r) => {
      console.log(`  [${r.label}]: ${r.failures.join("; ")}`);
    });
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
