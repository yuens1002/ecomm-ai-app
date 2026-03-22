import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(".screenshots");

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ── Step 1: Sign in as demo customer ──────────────────────────────
  console.log("Navigating to sign-in page...");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });

  // Click "Sign in as Demo Customer" button
  console.log("Looking for Demo Customer button...");
  const customerBtn = await page.waitForSelector(
    'button:has(div:text("Sign in as Demo Customer"))',
    { timeout: 5000 }
  ).catch(() => null);

  if (!customerBtn) {
    // Fallback: find button by text content
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await btn.evaluate((el) => el.textContent || "");
      if (text.includes("Sign in as Demo Customer")) {
        await btn.click();
        console.log("Clicked Demo Customer button via text search.");
        break;
      }
    }
  } else {
    await customerBtn.click();
    console.log("Clicked Demo Customer button.");
  }

  // Wait for redirect away from /auth/
  console.log("Waiting for redirect...");
  await page.waitForFunction(
    () => !window.location.href.includes("/auth/"),
    { timeout: 15000 }
  );
  console.log(`Redirected to: ${page.url()}`);

  // ── Step 2: Screenshots at each breakpoint ────────────────────────
  const breakpoints = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ] as const;

  for (const bp of breakpoints) {
    console.log(`\n── ${bp.name} (${bp.width}x${bp.height}) ──`);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE}/orders`, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for content to load (table rows on desktop/tablet, cards on mobile)
    if (bp.width >= 768) {
      // Wait for table rows
      await page.waitForSelector("table tbody tr", { timeout: 15000 }).catch(() => {
        console.log("  No table rows found, taking screenshot anyway.");
      });
    } else {
      // Wait for mobile cards
      await page.waitForSelector("[class*='md:hidden'] .card, [class*='md:hidden'] > div", {
        timeout: 15000,
      }).catch(() => {
        console.log("  No mobile cards found, taking screenshot anyway.");
      });
    }

    // Small settle time for rendering
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `verify-user-orders-${bp.name}.png`),
    });
    console.log(`  Saved: verify-user-orders-${bp.name}.png`);

    // ── Desktop extras: action menu ─────────────────────────────────
    if (bp.name === "desktop") {
      // Click the "..." action menu on the first row
      const actionBtn = await page.$("table tbody tr:first-child button[aria-haspopup='menu']");
      if (actionBtn) {
        await actionBtn.click();
        await new Promise((r) => setTimeout(r, 500));

        // Find the dropdown menu content
        const dropdown = await page.$("[role='menu']");
        if (dropdown) {
          await dropdown.screenshot({
            path: path.join(SCREENSHOT_DIR, "verify-user-orders-action-menu.png"),
          });
          console.log("  Saved: verify-user-orders-action-menu.png");
        } else {
          console.log("  WARNING: Dropdown menu not found after clicking action button.");
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, "verify-user-orders-action-menu.png"),
          });
        }
        // Close menu by pressing Escape
        await page.keyboard.press("Escape");
        await new Promise((r) => setTimeout(r, 300));
      } else {
        console.log("  WARNING: No action menu button found in first table row.");
      }
    }

    // ── Mobile extras: card screenshot ──────────────────────────────
    if (bp.name === "mobile") {
      // The mobile card grid is inside .grid.md\\:hidden
      const firstCard = await page.$(".grid.md\\:hidden > div:first-child");
      if (firstCard) {
        await firstCard.screenshot({
          path: path.join(SCREENSHOT_DIR, "verify-user-orders-mobile-card.png"),
        });
        console.log("  Saved: verify-user-orders-mobile-card.png");
      } else {
        // Try alternative selector
        const altCard = await page.$(".md\\:hidden div[class*='card'], .md\\:hidden .rounded-lg");
        if (altCard) {
          await altCard.screenshot({
            path: path.join(SCREENSHOT_DIR, "verify-user-orders-mobile-card.png"),
          });
          console.log("  Saved: verify-user-orders-mobile-card.png (alt selector)");
        } else {
          console.log("  WARNING: No mobile card found for element screenshot.");
        }
      }
    }
  }

  await browser.close();
  console.log("\nDone! All screenshots saved to .screenshots/");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
