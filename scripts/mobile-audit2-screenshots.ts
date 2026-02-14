#!/usr/bin/env npx tsx
/**
 * Mobile UI Audit v2 — captures viewport-clipped screenshots at 375x812
 * Splits long pages into multiple segments so each image stays under 2000px.
 *
 * Usage: npx tsx scripts/mobile-audit2-screenshots.ts
 */

import puppeteer, { type Page } from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "..", ".screenshots", "mobile-audit2");

const VIEWPORT = { width: 375, height: 812 };

const PAGES: { name: string; url: string }[] = [
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

  // --- Category pages ---
  { name: "10-cat-light-roast", url: "/light-roast" },
  { name: "11-cat-espresso-blends", url: "/espresso-blends" },
  { name: "12-cat-africa", url: "/africa" },
  { name: "13-cat-drinkware", url: "/drinkware" },
  { name: "14-cat-new-arrivals", url: "/new-arrivals" },

  // --- Product detail pages ---
  { name: "20-pdp-ethiopian", url: "/products/ethiopian-yirgacheffe" },
  { name: "21-pdp-midnight-espresso", url: "/products/midnight-espresso-blend" },
  { name: "22-pdp-hawaiian-kona", url: "/products/hawaiian-kona" },
  { name: "23-pdp-bolivia-caranavi", url: "/products/bolivia-caranavi" },

  // --- CMS pages ---
  { name: "30-cms-brewing", url: "/pages/brewing" },
  { name: "31-cms-faq", url: "/pages/faq" },

  // --- Checkout ---
  { name: "40-checkout-cancel", url: "/checkout/cancel" },

  // --- Newsletter ---
  { name: "50-newsletter-unsub", url: "/newsletter/unsubscribe" },
];

const AUTH_PAGES: { name: string; url: string }[] = [
  { name: "60-account-profile", url: "/account" },
  { name: "61-orders", url: "/orders" },
];

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureSegments(page: Page, name: string) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const segments = Math.ceil(scrollHeight / VIEWPORT.height);

  if (segments <= 1) {
    // Single viewport — just capture it
    const filePath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ✓ ${name}.png (${scrollHeight}px)`);
    return;
  }

  // Multiple segments — scroll and capture each
  for (let i = 0; i < segments; i++) {
    const scrollY = Math.min(i * VIEWPORT.height, scrollHeight - VIEWPORT.height);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await wait(300); // Let lazy-loaded content settle

    const segName = `${name}-${i + 1}of${segments}`;
    const filePath = path.join(OUTPUT_DIR, `${segName}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ✓ ${segName}.png (scroll: ${scrollY}px)`);
  }
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
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`📱 Mobile UI Audit v2 — ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // --- Public pages ---
    console.log("📸 Public pages:");
    for (const p of PAGES) {
      try {
        await page.goto(`${BASE_URL}${p.url}`, {
          waitUntil: "networkidle2",
          timeout: 20000,
        });
        await wait(1500);
        await captureSegments(page, p.name);
      } catch (err) {
        console.log(`  ✗ ${p.name} — ${(err as Error).message}`);
      }
    }

    // --- Mobile menu ---
    console.log("\n📸 Mobile menu:");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 20000 });
    await wait(1000);
    const menuClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll("header button");
      for (const btn of buttons) {
        const svg = btn.querySelector("svg");
        if (
          svg &&
          (svg.classList.contains("lucide-menu") ||
            svg.innerHTML.includes("line"))
        ) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (menuClicked) {
      await wait(500);
      const filePath = path.join(OUTPUT_DIR, "09-mobile-menu.png");
      await page.screenshot({ path: filePath, fullPage: false });
      console.log("  ✓ 09-mobile-menu.png");
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
        await captureSegments(page, p.name);
      } catch (err) {
        console.log(`  ✗ ${p.name} — ${(err as Error).message}`);
      }
    }

    // --- Account tabs ---
    console.log("\n📸 Account tabs:");
    await page.goto(`${BASE_URL}/account`, {
      waitUntil: "networkidle2",
      timeout: 20000,
    });
    await wait(1500);

    const tabs = [
      { id: "addresses", name: "62-account-addresses" },
      { id: "orders", name: "63-account-orders" },
      { id: "subscriptions", name: "64-account-subscriptions" },
    ];

    for (const tab of tabs) {
      try {
        const trigger = await page.$(`[id$="-trigger-${tab.id}"]`);
        if (trigger) {
          await trigger.click();
          await wait(1500);
          await captureSegments(page, tab.name);
        } else {
          console.log(`  ✗ ${tab.name} — trigger not found`);
        }
      } catch (err) {
        console.log(`  ✗ ${tab.name} — ${(err as Error).message}`);
      }
    }

    await page.close();

    // --- Summary ---
    const files = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith(".png"))
      .sort();
    console.log(`\n✅ ${files.length} screenshots saved to ${OUTPUT_DIR}`);
    files.forEach((f) => console.log(`  - ${f}`));
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
