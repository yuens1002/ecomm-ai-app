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
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });

    // === Homepage (navbar + Trending Now) ===
    console.log(`[${bp.name}] Navigating to homepage...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Screenshot the top of page (navbar)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-navbar.png`),
      fullPage: false,
    });

    // Scroll to Trending Now section
    const trendingSection = await page.$("section.bg-secondary");
    if (trendingSection) {
      await trendingSection.scrollIntoView();
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-trending.png`),
        fullPage: false,
      });
    } else {
      console.log(`[${bp.name}] Trending section not found, taking full page.`);
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-trending.png`),
        fullPage: true,
      });
    }

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-footer.png`),
      fullPage: false,
    });

    await page.close();

    // === FAQ Page ===
    const faqPage = await browser.newPage();
    await faqPage.setViewport({ width: bp.width, height: bp.height });
    console.log(`[${bp.name}] Navigating to FAQ page...`);
    await faqPage.goto(`${BASE_URL}/pages/faq`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    await faqPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-faq.png`),
      fullPage: false,
    });
    // Also take a full-page screenshot to see padding
    await faqPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-faq-full.png`),
      fullPage: true,
    });
    await faqPage.close();

    // === PDP Page ===
    const pdpPage = await browser.newPage();
    await pdpPage.setViewport({ width: bp.width, height: bp.height });
    console.log(`[${bp.name}] Navigating to PDP...`);
    await pdpPage.goto(`${BASE_URL}/products/ethiopia-yirgacheffe`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Screenshot top of PDP
    await pdpPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-top.png`),
      fullPage: false,
    });

    // Scroll down to find the bundles / add-ons section and related products
    await pdpPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 1500));
    await pdpPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-mid.png`),
      fullPage: false,
    });

    // Scroll to bottom for related products
    await pdpPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 1500));
    await pdpPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-bottom.png`),
      fullPage: false,
    });

    // Also take full page screenshot
    await pdpPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-full.png`),
      fullPage: true,
    });

    await pdpPage.close();
  }

  await browser.close();
  console.log("Public page screenshots captured successfully.");
}

main().catch(console.error);
