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

async function login(page: any) {
  // Try navigating to orders directly first
  await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Check if we got redirected to signin
  const url = page.url();
  if (url.includes("/auth/signin") || url.includes("/api/auth")) {
    console.log("Need to authenticate. Attempting GitHub OAuth flow...");
    // Get CSRF token
    await page.goto(`${BASE_URL}/api/auth/csrf`, { waitUntil: "networkidle2" });
    const csrfText = await page.evaluate(() => document.body.innerText);
    const csrfData = JSON.parse(csrfText);
    const csrfToken = csrfData.csrfToken;

    // Navigate back to signin
    await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Click GitHub signin button
    const githubBtn = await page.$('button[type="submit"]');
    if (githubBtn) {
      // Just try to navigate directly to orders as auth might be session-based
      await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // First, login with a desktop-sized page
  const loginPage = await browser.newPage();
  await loginPage.setViewport({ width: 1440, height: 900 });
  await login(loginPage);

  // Get cookies from the login page
  const cookies = await loginPage.cookies();
  await loginPage.close();

  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: bp.width, height: bp.height });

    // Apply cookies from login
    if (cookies.length > 0) {
      await page.setCookie(...cookies);
    }

    // Navigate to orders
    await page.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    // Screenshot: orders list (top)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-top.png`),
      fullPage: false,
    });

    // Scroll down for more orders
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise((r) => setTimeout(r, 1000));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-scrolled.png`),
      fullPage: false,
    });

    // Full page screenshot to see everything
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
