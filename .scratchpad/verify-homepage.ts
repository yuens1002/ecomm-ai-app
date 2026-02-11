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

    // Navigate to homepage
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Screenshot: top of page (navbar)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-navbar.png`),
      fullPage: false,
    });

    // Screenshot: scroll to bottom for footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-homepage-footer.png`),
      fullPage: false,
    });

    await page.close();
  }

  await browser.close();
  console.log("Homepage screenshots captured.");
}

main().catch(console.error);
