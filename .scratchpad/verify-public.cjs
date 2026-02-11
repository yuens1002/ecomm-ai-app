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

    // ===== HOMEPAGE =====
    console.log(`[${bp.name}] Navigating to homepage...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // AC-UI-1, AC-UI-1a, AC-REG-1: Navbar (top 80px clip)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-navbar.png`),
      clip: { x: 0, y: 0, width: bp.width, height: 80 },
    });
    console.log(`[${bp.name}] Navbar screenshot saved.`);

    // AC-UI-7: Trending Now section - scroll to it
    try {
      // Find the Trending Now / recommendations section
      const trendingSection = await page.$("section.bg-secondary");
      if (trendingSection) {
        await trendingSection.scrollIntoView();
        await new Promise((r) => setTimeout(r, 1500));
        const trendingBox = await trendingSection.boundingBox();
        if (trendingBox) {
          // Clip just the header area of the trending section (first 250px)
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `verify-${bp.name}-trending.png`),
            clip: {
              x: 0,
              y: trendingBox.y,
              width: bp.width,
              height: Math.min(350, trendingBox.height),
            },
          });
          console.log(`[${bp.name}] Trending Now screenshot saved.`);
        }
      } else {
        console.log(`[${bp.name}] WARNING: Trending section not found.`);
      }
    } catch (e) {
      console.log(`[${bp.name}] Trending section error:`, e.message);
    }

    // AC-UI-4: Footer - scroll to bottom
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((r) => setTimeout(r, 2000));
      const footer = await page.$("footer");
      if (footer) {
        const footerBox = await footer.boundingBox();
        if (footerBox) {
          // Clip just the top part of footer with Quick Links and Shop headings
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `verify-${bp.name}-footer.png`),
            clip: {
              x: 0,
              y: footerBox.y,
              width: bp.width,
              height: Math.min(500, footerBox.height),
            },
          });
          console.log(`[${bp.name}] Footer screenshot saved.`);
        }
      }
    } catch (e) {
      console.log(`[${bp.name}] Footer error:`, e.message);
    }

    // ===== FAQ PAGE =====
    console.log(`[${bp.name}] Navigating to FAQ...`);
    await page.goto(`${BASE_URL}/pages/faq`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // AC-UI-10: FAQ padding - capture the content area
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-faq.png`),
      fullPage: false,
    });
    console.log(`[${bp.name}] FAQ screenshot saved.`);

    // ===== PDP PAGE =====
    console.log(`[${bp.name}] Navigating to PDP...`);
    await page.goto(`${BASE_URL}/products/ethiopia-yirgacheffe`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await new Promise((r) => setTimeout(r, 3000));

    // AC-UI-14: Bundles carousel - scroll to "Save on Bundles" or addons section
    try {
      // Look for the add-ons/bundles ScrollCarousel section
      const bundleHeading = await page.evaluateHandle(() => {
        const headings = Array.from(document.querySelectorAll("h2"));
        return headings.find(h => h.textContent && (h.textContent.includes("Bundle") || h.textContent.includes("bundle") || h.textContent.includes("Save") || h.textContent.includes("Complete")));
      });

      if (bundleHeading && await bundleHeading.evaluate(el => el !== null && el !== undefined)) {
        await bundleHeading.evaluate(el => el.scrollIntoView({ block: "start" }));
        await new Promise((r) => setTimeout(r, 1500));
        const box = await bundleHeading.boundingBox();
        if (box) {
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-bundles.png`),
            clip: {
              x: 0,
              y: Math.max(0, box.y - 20),
              width: bp.width,
              height: 400,
            },
          });
          console.log(`[${bp.name}] PDP bundles screenshot saved.`);
        }
      } else {
        console.log(`[${bp.name}] Bundle heading not found, taking full page PDP.`);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-full.png`),
          fullPage: true,
        });
      }
    } catch (e) {
      console.log(`[${bp.name}] Bundles error:`, e.message);
    }

    // AC-UI-15a: Related products carousel - scroll to "You Might Also Like"
    try {
      const relatedHeading = await page.evaluateHandle(() => {
        const headings = Array.from(document.querySelectorAll("h2"));
        return headings.find(h => h.textContent && (h.textContent.includes("Might Also Like") || h.textContent.includes("Also Like") || h.textContent.includes("Related")));
      });

      if (relatedHeading && await relatedHeading.evaluate(el => el !== null && el !== undefined)) {
        await relatedHeading.evaluate(el => el.scrollIntoView({ block: "start" }));
        await new Promise((r) => setTimeout(r, 1500));
        const box = await relatedHeading.boundingBox();
        if (box) {
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `verify-${bp.name}-pdp-related.png`),
            clip: {
              x: 0,
              y: Math.max(0, box.y - 20),
              width: bp.width,
              height: 500,
            },
          });
          console.log(`[${bp.name}] PDP related products screenshot saved.`);
        }
      } else {
        console.log(`[${bp.name}] Related heading not found.`);
      }
    } catch (e) {
      console.log(`[${bp.name}] Related products error:`, e.message);
    }

    await page.close();
  }

  await browser.close();
  console.log("Public page screenshots done.");
}

main().catch(console.error);
