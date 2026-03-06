#!/usr/bin/env npx tsx
/**
 * AC Verification — Admin Order Detail Page
 *
 * 1. Logs in as admin
 * 2. Navigates to /admin/orders, finds first order ID
 * 3. Screenshots admin order detail at desktop + mobile
 * 4. Screenshots storefront order detail at desktop + mobile
 * 5. Tests print styles by adding print media emulation
 * 6. Tests 404 for non-existent order
 *
 * Usage: npx tsx scripts/verify-order-detail.ts
 */

import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, ".screenshots", "order-detail");

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

const ADMIN_EMAIL = "admin@artisanroast.com";
const ADMIN_PASSWORD = "ivcF8ZV3FnGaBJ&#8j";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function login(page: Page) {
  console.log("\n--- Logging in as admin...");
  await page.goto(`${BASE_URL}/auth/signin`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await wait(1000);

  if (!page.url().includes("/auth/signin")) {
    console.log("  Already logged in (session active)");
    return;
  }

  await page.type("#email", ADMIN_EMAIL);
  await page.type("#password", ADMIN_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await wait(2000);
  console.log("  Logged in");
}

async function screenshot(page: Page, name: string) {
  const filePath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot: ${name}.png`);
}

async function main() {
  ensureDir(OUT_DIR);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await login(page);

    // Step 1: Go to admin orders, extract first order ID
    console.log("\n--- Finding order ID from admin orders table...");
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE_URL}/admin/orders`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(2000);

    // Double-click the first row in the desktop table to navigate
    // The desktop table is inside a div.hidden.xl:block — visible at 1440px viewport
    const firstRow = await page.$('tr[title="Double-click to view order"]');
    if (!firstRow) {
      console.error("ERROR: No double-clickable rows found. Ensure orders exist in DB.");
      process.exit(1);
    }

    await firstRow.click({ count: 2 });
    await wait(3000);

    const navUrl = page.url();
    const urlMatch = navUrl.match(/\/admin\/orders\/(.+)/);
    if (!urlMatch) {
      console.error(`ERROR: Double-click did not navigate. Current URL: ${navUrl}`);
      process.exit(1);
    }

    const testOrderId = urlMatch[1];
    console.log(`  AC-NAV-1 PASS: Double-click navigated to /admin/orders/${testOrderId}`);

    // Step 2: Admin order detail - Desktop
    console.log(`\n--- Admin Order Detail (desktop) - /admin/orders/${testOrderId}`);
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE_URL}/admin/orders/${testOrderId}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(1500);
    await screenshot(page, "admin-detail-desktop");

    // Step 3: Admin order detail - Mobile
    console.log("\n--- Admin Order Detail (mobile 375px)");
    await page.setViewport(MOBILE);
    await wait(500);
    await screenshot(page, "admin-detail-mobile");

    // Step 4: Print preview (emulate print media)
    console.log("\n--- Print preview (emulating print media)");
    await page.setViewport(DESKTOP);
    await page.emulateMediaType("print");
    await wait(500);
    await screenshot(page, "admin-detail-print");
    await page.emulateMediaType("screen");

    // Step 5: Storefront order detail - Desktop
    console.log(`\n--- Storefront Order Detail (desktop) - /orders/${testOrderId}`);
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE_URL}/orders/${testOrderId}`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(1500);
    await screenshot(page, "storefront-detail-desktop");

    // Step 6: Storefront order detail - Mobile
    console.log("\n--- Storefront Order Detail (mobile 375px)");
    await page.setViewport(MOBILE);
    await wait(500);
    await screenshot(page, "storefront-detail-mobile");

    // Step 7: 404 test
    console.log("\n--- 404 test - /admin/orders/nonexistent-id");
    await page.setViewport(DESKTOP);
    const response = await page.goto(`${BASE_URL}/admin/orders/nonexistent-id-12345`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(1000);
    const status = response?.status() || 0;
    console.log(`  HTTP status: ${status}`);
    await screenshot(page, "admin-detail-404");

    // Step 8: Admin orders table - verify double-click cursor
    console.log("\n--- Admin orders table - cursor pointer check");
    await page.setViewport(DESKTOP);
    await page.goto(`${BASE_URL}/admin/orders`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await wait(2000);
    await screenshot(page, "admin-orders-table");

    console.log("\n--- All screenshots captured successfully!");
    console.log(`  Output: ${OUT_DIR}`);

  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
