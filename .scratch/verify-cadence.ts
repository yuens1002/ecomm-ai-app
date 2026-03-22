import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(".screenshots");

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ── Step 1: Desktop viewport ────────────────────────────────────────
  await page.setViewport({ width: 1440, height: 900 });

  // ── Step 2: Navigate to sign-in ─────────────────────────────────────
  console.log("Navigating to sign-in page...");
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });

  // ── Step 3: Click demo sign-in button ───────────────────────────────
  console.log("Looking for Demo Customer button...");
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent || "");
    if (text.includes("Sign in as Demo Customer")) {
      await btn.click();
      console.log("Clicked Demo Customer button.");
      break;
    }
  }

  // ── Step 4: Wait for redirect away from /auth/ ──────────────────────
  console.log("Waiting for redirect...");
  await page.waitForFunction(
    () => !window.location.href.includes("/auth/"),
    { timeout: 15000 }
  );
  console.log(`Redirected to: ${page.url()}`);

  // ── Step 5: Navigate to /orders ─────────────────────────────────────
  console.log("Navigating to /orders...");
  await page.goto(`${BASE}/orders`, { waitUntil: "networkidle2", timeout: 30000 });

  // ── Step 6: Wait 3 seconds for data to load ─────────────────────────
  await new Promise((r) => setTimeout(r, 3000));

  // ── Step 7: Desktop viewport screenshot ─────────────────────────────
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "verify-cadence-desktop.png"),
  });
  console.log("Saved: verify-cadence-desktop.png");

  // ── Step 8: Switch to mobile viewport ───────────────────────────────
  await page.setViewport({ width: 375, height: 812 });

  // ── Step 9: Navigate to /orders again ───────────────────────────────
  await page.goto(`${BASE}/orders`, { waitUntil: "networkidle2", timeout: 30000 });

  // ── Step 10: Wait 3 seconds ─────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 3000));

  // ── Step 11: Mobile viewport screenshot ─────────────────────────────
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "verify-cadence-mobile.png"),
  });
  console.log("Saved: verify-cadence-mobile.png");

  // ── Step 12: Mobile card element screenshot ─────────────────────────
  const firstCard = await page.$(".grid.md\\:hidden > div:first-child");
  if (firstCard) {
    await firstCard.screenshot({
      path: path.join(SCREENSHOT_DIR, "verify-cadence-mobile-card.png"),
    });
    console.log("Saved: verify-cadence-mobile-card.png");
  } else {
    // Fallback: try alternative selectors
    const altCard = await page.$(".md\\:hidden .card, .md\\:hidden > div");
    if (altCard) {
      await altCard.screenshot({
        path: path.join(SCREENSHOT_DIR, "verify-cadence-mobile-card.png"),
      });
      console.log("Saved: verify-cadence-mobile-card.png (alt selector)");
    } else {
      console.log("WARNING: No mobile card found for element screenshot.");
    }
  }

  await browser.close();
  console.log("\nDone! All screenshots saved to .screenshots/");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
