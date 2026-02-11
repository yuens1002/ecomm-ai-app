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

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });

    console.log(`[${bp.name}] Navigating to PDP (ethiopian-yirgacheffe)...`);
    await page.goto(`${BASE_URL}/products/ethiopian-yirgacheffe`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 4000));

    // Take a full page screenshot first for context
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-full.png`),
      fullPage: true,
    });
    console.log(`[${bp.name}] PDP full page screenshot saved.`);

    // AC-UI-14: Find "Save on Bundles" heading (or similar)
    try {
      const allH2s = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h2")).map(h => ({
          text: h.textContent,
          top: h.getBoundingClientRect().top + window.scrollY
        }));
      });
      console.log(`[${bp.name}] H2 headings found:`, JSON.stringify(allH2s));

      // Find the bundles heading
      const bundleH2 = allH2s.find(h => h.text && (h.text.includes("Bundle") || h.text.includes("Save") || h.text.includes("Complete")));
      if (bundleH2) {
        await page.evaluate((y) => window.scrollTo(0, y - 20), bundleH2.top);
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-bundles.png`),
          clip: {
            x: 0,
            y: bundleH2.top - 20,
            width: bp.width,
            height: 400,
          },
        });
        console.log(`[${bp.name}] PDP bundles screenshot saved.`);
      } else {
        console.log(`[${bp.name}] No bundles heading found.`);
      }

      // AC-UI-15a: Find "You Might Also Like" heading
      const relatedH2 = allH2s.find(h => h.text && (h.text.includes("Might Also Like") || h.text.includes("Also Like")));
      if (relatedH2) {
        await page.evaluate((y) => window.scrollTo(0, y - 20), relatedH2.top);
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-related.png`),
          clip: {
            x: 0,
            y: relatedH2.top - 20,
            width: bp.width,
            height: 500,
          },
        });
        console.log(`[${bp.name}] PDP related products screenshot saved.`);
      } else {
        console.log(`[${bp.name}] No related products heading found.`);
      }
    } catch (e) {
      console.log(`[${bp.name}] PDP sections error:`, e.message);
    }

    await page.close();
  }

  await browser.close();
  console.log("PDP screenshots done.");
}

main().catch(console.error);
