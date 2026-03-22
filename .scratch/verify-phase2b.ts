import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots", "phase2b-plan-support");

const BREAKPOINTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 812 },
];

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/admin-signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Click "Sign in as Admin" demo button
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await page.evaluate((el: Element) => el.textContent || "", btn);
    if (text.includes("Sign in as Admin")) {
      await btn.click();
      // Wait for redirect away from auth page
      await new Promise((r) => setTimeout(r, 5000));
      // Verify we left /auth/
      const url = page.url();
      if (url.includes("/auth/")) {
        // Wait a bit more
        await new Promise((r) => setTimeout(r, 5000));
      }
      console.log("Logged in, current URL:", page.url());
      return;
    }
  }
  throw new Error("Could not find demo admin sign-in button");
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  for (const bp of BREAKPOINTS) {
    console.log(`\n=== ${bp.name} (${bp.width}x${bp.height}) ===`);
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });

    // Login
    await login(page);

    // ==================== PLAN PAGE ====================
    console.log("Navigating to plan page...");
    await page.goto(`${BASE_URL}/admin/settings/plan`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `plan-page-${bp.name}.png`),
    });

    // Scroll down to see more content
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `plan-page-scrolled-${bp.name}.png`),
    });

    // ==================== SUPPORT PAGE ====================
    console.log("Navigating to support page...");
    await page.goto(`${BASE_URL}/admin/support`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `support-page-${bp.name}.png`),
    });

    // Scroll down to see Data Privacy section
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `support-page-scrolled-${bp.name}.png`),
    });

    // ==================== NAV DROPDOWN (desktop only) ====================
    if (bp.name === "desktop") {
      console.log("Checking nav dropdown...");
      // The Settings nav is in the "More" overflow menu
      // First click "More"
      const navButtons = await page.$$("nav button, header button");
      for (const btn of navButtons) {
        const text = await page.evaluate((el: Element) => el.textContent || "", btn);
        if (text.includes("More")) {
          await btn.click();
          await new Promise((r) => setTimeout(r, 1000));
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `nav-more-dropdown-${bp.name}.png`),
          });

          // Look for Settings section within the dropdown and click it if needed
          // The overflow dropdown should already show Settings children
          break;
        }
      }
    }

    await page.close();
  }

  await browser.close();
  console.log("\nScreenshots captured.");
}

main().catch(console.error);
