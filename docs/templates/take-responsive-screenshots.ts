#!/usr/bin/env npx tsx
/**
 * Takes responsive screenshots of key UI components at different breakpoints
 * Captures: ProductCards, product detail page, footer, nav dropdown/mobile menu
 * Usage: npx tsx scripts/take-responsive-screenshots.ts [before|after]
 */

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Breakpoint {
  name: string;
  width: number;
  height: number;
}

const BREAKPOINTS: Breakpoint[] = [
  { name: "mobile", width: 375, height: 812 }, // iPhone X (xs)
  { name: "sm", width: 640, height: 900 }, // Tailwind sm breakpoint
  { name: "tablet", width: 768, height: 1024 }, // iPad (md)
  { name: "desktop", width: 1440, height: 900 }, // Desktop (lg+)
];

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "..", ".screenshots");

async function takeScreenshots(prefix = "before") {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Taking ${prefix} screenshots...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const bp of BREAKPOINTS) {
      console.log(`\n📱 ${bp.name} (${bp.width}x${bp.height})`);

      const page = await browser.newPage();
      await page.setViewport({ width: bp.width, height: bp.height });

      // Navigate to homepage
      await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000)); // Let animations settle

      // Screenshot 1: Homepage ProductCards (featured section)
      console.log("  - ProductCards (homepage)...");
      await page.evaluate(() => window.scrollTo(0, 400)); // Scroll to product section
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-product-cards.png`),
        fullPage: false,
      });

      // Screenshot 2: Product detail page (top)
      console.log("  - Product page...");
      await page.goto(`${BASE_URL}/products/ethiopian-yirgacheffe`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-product-page.png`),
        fullPage: false,
      });

      // Screenshot 2b: Product page add-to-cart section (scroll down on mobile/tablet)
      if (bp.width < 1024) {
        console.log("  - Product page (add-to-cart)...");
        await page.evaluate(() => window.scrollTo(0, 500)); // Scroll to add-to-cart section
        await new Promise((r) => setTimeout(r, 500));
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-product-add-to-cart.png`),
          fullPage: false,
        });

        // Screenshot 2c: Product page carousel section (mobile only)
        if (bp.width < 768) {
          console.log("  - Product page (carousel)...");
          await page.evaluate(() => window.scrollTo(0, 1200)); // Scroll to carousel section
          await new Promise((r) => setTimeout(r, 500));
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-product-carousel.png`),
            fullPage: false,
          });
        }
      }

      // Go back to homepage for remaining screenshots
      await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 500));

      // Screenshot 3: Footer (scroll to bottom)
      console.log("  - Footer...");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-footer.png`),
        fullPage: false,
      });

      // Screenshot 4: Nav dropdown (desktop only - mobile uses sheet)
      if (bp.width >= 1024) {
        console.log("  - Nav dropdown...");
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 300));

        // Find and hover over the Shop trigger to open dropdown
        const triggers = await page.$$("button[data-radix-collection-item]");
        for (const trigger of triggers) {
          const text = await trigger.evaluate((el) => el.textContent);
          if (text && text.toLowerCase().includes("shop")) {
            await trigger.hover();
            break;
          }
        }

        await new Promise((r) => setTimeout(r, 500)); // Wait for dropdown animation

        await page.screenshot({
          path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-nav-dropdown.png`),
          fullPage: false,
        });
      }

      // Screenshot 5: Mobile menu (mobile and tablet)
      if (bp.width < 1024) {
        console.log("  - Mobile menu...");
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 300));

        // Click hamburger menu using JavaScript click to avoid clickability issues
        const clicked = await page.evaluate(() => {
          // Find button with Menu icon (lucide-menu class or Menu text)
          const buttons = document.querySelectorAll("button");
          for (const btn of buttons) {
            const svg = btn.querySelector("svg");
            if (
              svg &&
              (svg.classList.contains("lucide-menu") ||
                svg.innerHTML.includes("line"))
            ) {
              btn.click();
              return true;
            }
          }
          // Fallback: click first button in header area
          const header = document.querySelector("header");
          if (header) {
            const btn = header.querySelector("button");
            if (btn) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (clicked) {
          await new Promise((r) => setTimeout(r, 500));

          // Scroll within the sheet to show categories
          await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"]');
            if (dialog) dialog.scrollTop = 200;
          });

          await page.screenshot({
            path: path.join(OUTPUT_DIR, `${prefix}-${bp.name}-mobile-menu.png`),
            fullPage: false,
          });
        } else {
          console.log("    (Could not find menu button)");
        }
      }

      await page.close();
    }

    console.log(`\n✅ Screenshots saved to: ${OUTPUT_DIR}`);
    console.log("Files:");
    fs.readdirSync(OUTPUT_DIR)
      .filter((f) => f.startsWith(prefix))
      .sort()
      .forEach((f) => console.log(`  - ${f}`));
  } finally {
    await browser.close();
  }
}

// Run
const prefix = process.argv[2] || "before";
takeScreenshots(prefix).catch(console.error);
