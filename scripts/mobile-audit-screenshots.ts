#!/usr/bin/env npx tsx
/**
 * Mobile UI Audit — captures full-page screenshots at 375px (xs) width
 * for all public-facing pages to identify layout/overflow issues.
 *
 * Usage: npx tsx scripts/mobile-audit-screenshots.ts
 */

import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "..", ".screenshots", "mobile-audit");

// xs breakpoint matching iPhone SE / small Android
const VIEWPORT = { width: 375, height: 812 };

// All public-facing pages to audit
const PAGES: { name: string; url: string; scroll?: boolean }[] = [
  // --- Static pages ---
  { name: "01-homepage", url: "/" },
  { name: "02-about", url: "/about" },
  { name: "02b-features", url: "/features" },
  { name: "03-contact", url: "/contact" },
  { name: "04-app-features", url: "/app-features" },
  { name: "05-search", url: "/search" },

  // --- Auth pages ---
  { name: "06-signin", url: "/auth/signin" },
  { name: "07-signup", url: "/auth/signup" },
  { name: "08-forgot-password", url: "/auth/forgot-password" },

  // --- Category pages (sample of each type) ---
  { name: "10-cat-light-roast", url: "/light-roast" },
  { name: "11-cat-espresso-blends", url: "/espresso-blends" },
  { name: "12-cat-africa", url: "/africa" },
  { name: "13-cat-drinkware", url: "/drinkware" },
  { name: "14-cat-new-arrivals", url: "/new-arrivals" },

  // --- Product detail pages (variety of layouts) ---
  { name: "20-pdp-ethiopian", url: "/products/ethiopian-yirgacheffe" },
  { name: "21-pdp-midnight-espresso", url: "/products/midnight-espresso-blend" },
  { name: "22-pdp-hawaiian-kona", url: "/products/hawaiian-kona" },
  { name: "23-pdp-bolivia-caranavi", url: "/products/bolivia-caranavi" },

  // --- CMS pages ---
  { name: "30-cms-brewing", url: "/pages/brewing" },
  { name: "31-cms-faq", url: "/pages/faq" },

  // --- Checkout (no session, shows empty/redirect states) ---
  { name: "40-checkout-cancel", url: "/checkout/cancel" },

  // --- Newsletter ---
  { name: "50-newsletter-unsub", url: "/newsletter/unsubscribe" },
];

// Authenticated pages (require login)
const AUTH_PAGES: { name: string; url: string }[] = [
  { name: "60-account-profile", url: "/account" },
  { name: "61-orders", url: "/orders" },
];

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureFullPage(page: Page, name: string) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  ✓ ${name}.png`);
}

async function login(page: Page) {
  console.log("\n🔐 Logging in...");
  await page.goto(`${BASE_URL}/auth/signin`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await wait(1000);

  await page.type("#email", "admin@artisanroast.com");
  await page.type("#password", "ivcF8ZV3FnGaBJ&#8j");

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click('button[type="submit"]'),
  ]);
  await wait(1500);
  console.log("  ✓ Logged in");
}

async function run() {
  // Ensure output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`📱 Mobile UI Audit — ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // --- Public pages (no auth) ---
    console.log("📸 Public pages:");
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    for (const p of PAGES) {
      try {
        await page.goto(`${BASE_URL}${p.url}`, {
          waitUntil: "networkidle2",
          timeout: 20000,
        });
        await wait(1500); // Let animations/images settle
        await captureFullPage(page, p.name);
      } catch (err) {
        console.log(`  ✗ ${p.name} — ${(err as Error).message}`);
      }
    }

    // --- Mobile menu (open hamburger on homepage) ---
    console.log("\n📸 Mobile menu:");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 20000 });
    await wait(1000);
    const menuClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll("header button");
      for (const btn of buttons) {
        const svg = btn.querySelector("svg");
        if (svg && (svg.classList.contains("lucide-menu") || svg.innerHTML.includes("line"))) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (menuClicked) {
      await wait(500);
      await captureFullPage(page, "09-mobile-menu");
    } else {
      console.log("  ✗ Could not open mobile menu");
    }

    // --- Authenticated pages ---
    console.log("\n📸 Authenticated pages:");
    await login(page);

    for (const p of AUTH_PAGES) {
      try {
        await page.goto(`${BASE_URL}${p.url}`, {
          waitUntil: "networkidle2",
          timeout: 20000,
        });
        await wait(1500);
        await captureFullPage(page, p.name);
      } catch (err) {
        console.log(`  ✗ ${p.name} — ${(err as Error).message}`);
      }
    }

    // Account tabs (Addresses, Orders, Subscriptions)
    console.log("\n📸 Account tabs:");
    await page.goto(`${BASE_URL}/account`, {
      waitUntil: "networkidle2",
      timeout: 20000,
    });
    await wait(1500);

    // Addresses tab
    try {
      const addrTrigger = await page.$('[id$="-trigger-addresses"]');
      if (addrTrigger) {
        await addrTrigger.click();
        await wait(1500);
        await captureFullPage(page, "62-account-addresses");
      }
    } catch {
      console.log("  ✗ Could not click Addresses tab");
    }

    // Orders tab
    try {
      const orderTrigger = await page.$('[id$="-trigger-orders"]');
      if (orderTrigger) {
        await orderTrigger.click();
        await wait(1500);
        await captureFullPage(page, "63-account-orders");
      }
    } catch {
      console.log("  ✗ Could not click Orders tab");
    }

    // Subscriptions tab
    try {
      const subTrigger = await page.$('[id$="-trigger-subscriptions"]');
      if (subTrigger) {
        await subTrigger.click();
        await wait(1500);
        await captureFullPage(page, "64-account-subscriptions");
      }
    } catch {
      console.log("  ✗ Could not click Subscriptions tab");
    }

    await page.close();

    // --- Summary ---
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".png")).sort();
    console.log(`\n✅ ${files.length} screenshots saved to ${OUTPUT_DIR}`);
    files.forEach((f) => console.log(`  - ${f}`));
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
