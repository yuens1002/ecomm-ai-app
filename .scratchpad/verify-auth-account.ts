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

async function login(browser: any) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const emailInput = await page.$('input[type="email"], input[name="email"], #email');
  const passwordInput = await page.$('input[type="password"], input[name="password"], #password');

  if (emailInput && passwordInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type("admin@artisanroast.com");
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type("ivcF8ZV3FnGaBJ&#8j");

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise((r) => setTimeout(r, 3000));
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    }
  }

  const cookies = await page.cookies();
  await page.close();
  return cookies;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  const cookies = await login(browser);

  for (const bp of BREAKPOINTS) {
    // --- Profile Tab (default) -> tab bar screenshot ---
    const page1 = await browser.newPage();
    await page1.setViewport({ width: bp.width, height: bp.height });
    await page1.setCookie(...cookies);

    await page1.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    await page1.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-tabs.png`),
      fullPage: false,
    });
    await page1.close();

    // --- Addresses Tab ---
    const page2 = await browser.newPage();
    await page2.setViewport({ width: bp.width, height: bp.height });
    await page2.setCookie(...cookies);

    await page2.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click Addresses tab
    try {
      // Try Radix id suffix pattern first
      let clicked = false;
      const addressTrigger = await page2.$('[id$="-trigger-addresses"]');
      if (addressTrigger) {
        await page2.click('[id$="-trigger-addresses"]');
        clicked = true;
      }
      if (!clicked) {
        // Fallback: find all tab triggers and click the one with MapPin or "Addresses" text
        await page2.evaluate(() => {
          const tabs = document.querySelectorAll('[role="tab"]');
          tabs.forEach(t => {
            const text = t.textContent || '';
            if (text.includes('Addresses') || text.includes('addresses')) {
              (t as HTMLElement).click();
            }
          });
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`Addresses tab click failed at ${bp.name}`);
    }

    await page2.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-addresses.png`),
      fullPage: false,
    });

    await page2.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-addresses-full.png`),
      fullPage: true,
    });
    await page2.close();

    // --- Subscriptions Tab ---
    const page3 = await browser.newPage();
    await page3.setViewport({ width: bp.width, height: bp.height });
    await page3.setCookie(...cookies);

    await page3.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click Subscriptions tab
    try {
      let clicked = false;
      const subTrigger = await page3.$('[id$="-trigger-subscriptions"]');
      if (subTrigger) {
        await page3.click('[id$="-trigger-subscriptions"]');
        clicked = true;
      }
      if (!clicked) {
        await page3.evaluate(() => {
          const tabs = document.querySelectorAll('[role="tab"]');
          tabs.forEach(t => {
            const text = t.textContent || '';
            if (text.includes('Subscriptions') || text.includes('subscriptions')) {
              (t as HTMLElement).click();
            }
          });
        });
      }
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`Subscriptions tab click failed at ${bp.name}`);
    }

    await page3.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions.png`),
      fullPage: false,
    });

    await page3.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions-full.png`),
      fullPage: true,
    });

    // Try to open the dots menu dropdown on a subscription card
    try {
      // Find a MoreVertical dots button inside the subscription content
      // The MobileRecordCard has a dropdown with MoreVertical icon
      const dotsButtons = await page3.$$('button');
      let foundDots = false;
      for (const btn of dotsButtons) {
        const svg = await btn.$('svg.lucide-more-vertical, svg[class*="lucide-more-vertical"]');
        if (svg) {
          await btn.click();
          foundDots = true;
          await new Promise((r) => setTimeout(r, 1000));
          break;
        }
      }

      if (!foundDots) {
        // Try a broader approach - any ghost button with an svg inside subscription area
        const dropdownTriggers = await page3.$$('[data-state] button, .space-y-2 button');
        for (const trigger of dropdownTriggers) {
          const innerHTML = await page3.evaluate((el: Element) => el.innerHTML, trigger);
          if (innerHTML.includes('more-vertical') || innerHTML.includes('MoreVertical')) {
            await trigger.click();
            foundDots = true;
            await new Promise((r) => setTimeout(r, 1000));
            break;
          }
        }
      }

      if (foundDots) {
        await page3.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-sub-dropdown.png`),
          fullPage: false,
        });
      } else {
        console.log(`No dots button found at ${bp.name}`);
      }
    } catch (e) {
      console.log(`Dropdown open failed at ${bp.name}:`, e);
    }

    await page3.close();
  }

  await browser.close();
  console.log("Account screenshots captured.");
}

main().catch(console.error);
