import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  for (const bp of BREAKPOINTS) {
    // === Account Page ===
    const accountPage = await browser.newPage();
    await accountPage.setViewport({ width: bp.width, height: bp.height });
    console.log(`[${bp.name}] Navigating to /account...`);
    await accountPage.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Check if we got redirected to sign-in
    const accountUrl = accountPage.url();
    if (accountUrl.includes("signin") || accountUrl.includes("auth")) {
      console.log(`[${bp.name}] BLOCKED: Redirected to auth at ${accountUrl}`);
      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-BLOCKED.png`),
        fullPage: false,
      });
      await accountPage.close();
      continue;
    }

    // Screenshot the account page with tabs visible
    await accountPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-tabs.png`),
      fullPage: false,
    });

    // Click on Subscriptions tab using Radix ID pattern
    try {
      // Try Radix pattern: id ends with "-trigger-subscriptions"
      const subsTrigger = await accountPage.$('[id$="-trigger-subscriptions"]');
      if (subsTrigger) {
        await accountPage.click('[id$="-trigger-subscriptions"]');
        console.log(`[${bp.name}] Clicked subscriptions tab via Radix ID`);
      } else {
        // Fallback: click by text content
        const triggers = await accountPage.$$('[role="tab"]');
        for (const trigger of triggers) {
          const text = await trigger.evaluate(el => el.textContent);
          if (text && text.includes("Subscription")) {
            await trigger.click();
            console.log(`[${bp.name}] Clicked subscriptions tab via text match`);
            break;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 2000));

      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions.png`),
        fullPage: false,
      });

      // Take full page screenshot for subscription details
      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions-full.png`),
        fullPage: true,
      });
    } catch (err) {
      console.error(`[${bp.name}] Error clicking subscriptions tab:`, err);
    }

    await accountPage.close();

    // === Orders Page ===
    const ordersPage = await browser.newPage();
    await ordersPage.setViewport({ width: bp.width, height: bp.height });
    console.log(`[${bp.name}] Navigating to /orders...`);
    await ordersPage.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Check if we got redirected to sign-in
    const ordersUrl = ordersPage.url();
    if (ordersUrl.includes("signin") || ordersUrl.includes("auth")) {
      console.log(`[${bp.name}] BLOCKED: Redirected to auth at ${ordersUrl}`);
      await ordersPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-BLOCKED.png`),
        fullPage: false,
      });
      await ordersPage.close();
      continue;
    }

    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders.png`),
      fullPage: false,
    });

    // Full page for order cards
    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-full.png`),
      fullPage: true,
    });

    await ordersPage.close();
  }

  await browser.close();
  console.log("Auth page screenshots captured (or BLOCKED).");
}

main().catch(console.error);
