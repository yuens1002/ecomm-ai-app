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

  // Login first
  const loginPage = await browser.newPage();
  await loginPage.setViewport({ width: 1440, height: 900 });
  await loginPage.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const cookies = await loginPage.cookies();
  await loginPage.close();

  for (const bp of BREAKPOINTS) {
    // --- Profile Tab (default) ---
    const page1 = await browser.newPage();
    await page1.setViewport({ width: bp.width, height: bp.height });
    if (cookies.length > 0) await page1.setCookie(...cookies);

    await page1.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Screenshot the tab bar area
    await page1.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-tabs.png`),
      fullPage: false,
    });
    await page1.close();

    // --- Addresses Tab ---
    const page2 = await browser.newPage();
    await page2.setViewport({ width: bp.width, height: bp.height });
    if (cookies.length > 0) await page2.setCookie(...cookies);

    await page2.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click Addresses tab - use the trigger with value "addresses"
    try {
      // Radix tabs: use id suffix pattern
      const addressesTrigger = await page2.$('[id$="-trigger-addresses"]');
      if (addressesTrigger) {
        await page2.click('[id$="-trigger-addresses"]');
      } else {
        // Fallback: find by MapPin icon proximity
        await page2.evaluate(() => {
          const triggers = document.querySelectorAll('[role="tab"]');
          for (const t of triggers) {
            if (t.textContent?.includes('Addresses') || t.getAttribute('value') === 'addresses') {
              (t as HTMLElement).click();
              break;
            }
          }
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`Failed to click Addresses tab at ${bp.name}:`, e);
    }

    await page2.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-addresses.png`),
      fullPage: false,
    });

    // Full page for addresses
    await page2.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-addresses-full.png`),
      fullPage: true,
    });
    await page2.close();

    // --- Subscriptions Tab ---
    const page3 = await browser.newPage();
    await page3.setViewport({ width: bp.width, height: bp.height });
    if (cookies.length > 0) await page3.setCookie(...cookies);

    await page3.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click Subscriptions tab
    try {
      const subTrigger = await page3.$('[id$="-trigger-subscriptions"]');
      if (subTrigger) {
        await page3.click('[id$="-trigger-subscriptions"]');
      } else {
        await page3.evaluate(() => {
          const triggers = document.querySelectorAll('[role="tab"]');
          for (const t of triggers) {
            if (t.textContent?.includes('Subscriptions') || t.getAttribute('value') === 'subscriptions') {
              (t as HTMLElement).click();
              break;
            }
          }
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`Failed to click Subscriptions tab at ${bp.name}:`, e);
    }

    await page3.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions.png`),
      fullPage: false,
    });

    // Full page for subscriptions
    await page3.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions-full.png`),
      fullPage: true,
    });

    // Try to open the dropdown menu on first subscription card
    try {
      const dotsButton = await page3.$('.space-y-2 button[class*="ghost"]');
      if (dotsButton) {
        await dotsButton.click();
        await new Promise((r) => setTimeout(r, 1000));

        await page3.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-sub-dropdown.png`),
          fullPage: false,
        });
      }
    } catch (e) {
      console.log(`Failed to open subscription dropdown at ${bp.name}:`, e);
    }

    await page3.close();
  }

  await browser.close();
  console.log("Account screenshots captured.");
}

main().catch(console.error);
