const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "..", ".screenshots");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // Sign in once, then reuse the same browser context
  console.log("Signing in...");
  const signInPage = await browser.newPage();
  await signInPage.setViewport({ width: 1440, height: 900 });
  await signInPage.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Debug: check if we're on the sign-in page
  const pageTitle = await signInPage.title();
  console.log("Page title:", pageTitle);

  try {
    await signInPage.waitForSelector('input[name="email"]', { timeout: 10000 });
    await signInPage.type('input[name="email"]', 'admin@artisanroast.com');
    await signInPage.type('input[name="password"]', 'ivcF8ZV3FnGaBJ&#8j');
    await signInPage.click('button[type="submit"]');
    await signInPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
    console.log("Signed in. Current URL:", signInPage.url());
  } catch (e) {
    console.error("Sign-in failed:", e.message);
    await signInPage.screenshot({
      path: path.join(OUTPUT_DIR, "verify-auth-debug-signin.png"),
      fullPage: true,
    });
    await browser.close();
    process.exit(1);
  }
  await signInPage.close();

  for (const bp of BREAKPOINTS) {
    // ===== ACCOUNT PAGE (Subscriptions Tab) =====
    console.log(`[${bp.name}] Navigating to /account for subscriptions tab...`);
    const accountPage = await browser.newPage();
    await accountPage.setViewport({ width: bp.width, height: bp.height });
    await accountPage.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // AC-UI-17: Tab bar - capture the tabs area (before clicking)
    try {
      const tabsList = await accountPage.$('[role="tablist"]');
      if (tabsList) {
        const tabsBox = await tabsList.boundingBox();
        if (tabsBox) {
          await accountPage.screenshot({
            path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-tabs.png`),
            clip: {
              x: 0,
              y: Math.max(0, tabsBox.y - 10),
              width: bp.width,
              height: tabsBox.height + 20,
            },
          });
          console.log(`[${bp.name}] Account tabs screenshot saved.`);
        }
      } else {
        console.log(`[${bp.name}] Account tablist not found.`);
      }
    } catch (e) {
      console.log(`[${bp.name}] Account tabs error:`, e.message);
    }

    // Click Subscriptions tab (Radix tabs: use id$ selector)
    try {
      // Try Radix ID-based selector first
      let subTabSelector = '[id$="-trigger-subscriptions"]';
      let subTab = await accountPage.$(subTabSelector);
      if (!subTab) {
        // Fallback: look for button with text "Subscriptions" or Repeat icon
        subTabSelector = 'button:has(svg.lucide-repeat)';
        subTab = await accountPage.$(subTabSelector);
      }
      if (!subTab) {
        // Fallback 2: find by text content
        const buttons = await accountPage.$$('[role="tab"]');
        for (const btn of buttons) {
          const text = await btn.evaluate(el => el.textContent);
          if (text && text.includes("Subscription")) {
            subTab = btn;
            break;
          }
        }
      }

      if (subTab) {
        await subTab.click();
        await new Promise((r) => setTimeout(r, 2000));
        console.log(`[${bp.name}] Clicked Subscriptions tab.`);

        // AC-UI-20: Subscription cards - capture the content area
        // AC-REG-8: Manage button and status notices
        await accountPage.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-subscriptions.png`),
          fullPage: false,
        });
        console.log(`[${bp.name}] Subscriptions screenshot saved.`);

        // Also capture a full-page for thorough review
        await accountPage.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-subscriptions-full.png`),
          fullPage: true,
        });
      } else {
        console.log(`[${bp.name}] Subscriptions tab not found.`);
      }
    } catch (e) {
      console.log(`[${bp.name}] Subscriptions tab error:`, e.message);
    }

    await accountPage.close();

    // ===== ORDERS PAGE =====
    console.log(`[${bp.name}] Navigating to /orders...`);
    const ordersPage = await browser.newPage();
    await ordersPage.setViewport({ width: bp.width, height: bp.height });
    await ordersPage.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // AC-UI-21: Order cards (mobile - no divider)
    // AC-REG-7: Desktop order history table
    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders.png`),
      fullPage: false,
    });
    console.log(`[${bp.name}] Orders screenshot saved.`);

    // Full page for additional context
    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-full.png`),
      fullPage: true,
    });

    await ordersPage.close();
  }

  await browser.close();
  console.log("Auth page screenshots done.");
}

main().catch(console.error);
