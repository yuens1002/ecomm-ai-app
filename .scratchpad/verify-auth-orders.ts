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

  // Go to signin page and use credentials
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Fill in email and password
  const emailInput = await page.$('input[type="email"], input[name="email"], #email');
  const passwordInput = await page.$('input[type="password"], input[name="password"], #password');

  if (emailInput && passwordInput) {
    await emailInput.click({ clickCount: 3 });
    await emailInput.type("admin@artisanroast.com");
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type("ivcF8ZV3FnGaBJ&#8j");

    // Click sign in button
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise((r) => setTimeout(r, 3000));
      // Wait for redirect
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
    }
  }

  console.log("After login, URL:", page.url());
  const cookies = await page.cookies();
  await page.close();
  return cookies;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // Login first
  const cookies = await login(browser);
  console.log("Got cookies:", cookies.length);

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.setCookie(...cookies);

    // Navigate to orders
    await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    const currentUrl = page.url();
    console.log(`Orders page URL at ${bp.name}:`, currentUrl);

    // Screenshot top of orders
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-top.png`),
      fullPage: false,
    });

    // Scroll down for more orders
    await page.evaluate(() => window.scrollTo(0, 600));
    await new Promise((r) => setTimeout(r, 1000));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-scrolled.png`),
      fullPage: false,
    });

    // Full page
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-full.png`),
      fullPage: true,
    });

    await page.close();
  }

  await browser.close();
  console.log("Orders screenshots captured.");
}

main().catch(console.error);
