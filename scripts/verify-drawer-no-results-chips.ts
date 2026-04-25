import puppeteer from "puppeteer";
import path from "path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve(
  process.cwd(),
  ".screenshots/keyword-search-drawer/verification/drawer-no-results.png"
);

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto(BASE_URL, { waitUntil: "networkidle2" });

  // Click search icon — finds button by sr-only "Search products" text
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) =>
      (b.textContent || "").trim().toLowerCase().includes("search products")
    );
    if (target) {
      (target as HTMLButtonElement).click();
      return true;
    }
    return false;
  });
  if (!clicked) throw new Error("Could not find search trigger");
  console.log("Clicked search trigger");

  // Wait for drawer input
  await page.waitForSelector('input[type="search"], input[placeholder*="earch" i]', {
    timeout: 5000,
  });

  // Type zzzzzzz
  const input = await page.$('input[type="search"], input[placeholder*="earch" i]');
  if (!input) throw new Error("No input found");
  await input.click();
  await input.type("zzzzzzz", { delay: 30 });

  // wait for debounce + results
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: OUT });
  console.log("Saved", OUT);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
