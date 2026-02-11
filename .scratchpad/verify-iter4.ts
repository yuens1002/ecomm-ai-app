import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots", "verify-iter4");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const AUTH_EMAIL = "admin@artisanroast.com";
const AUTH_PASSWORD = "ivcF8ZV3FnGaBJ&#8j";

async function login(page: Awaited<ReturnType<typeof puppeteer.launch>>["prototype"]["newPage"] extends () => Promise<infer T> ? T : never) {
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const emailInput = await page.$('input[name="email"]');
  const passwordInput = await page.$('input[name="password"]');
  if (emailInput && passwordInput) {
    await emailInput.type(AUTH_EMAIL);
    await passwordInput.type(AUTH_PASSWORD);
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // Login once
  const loginPage = await browser.newPage();
  await loginPage.setViewport({ width: 1440, height: 900 });
  await login(loginPage);
  const cookies = await loginPage.cookies();
  await loginPage.close();

  // 1. Navbar at all breakpoints
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `navbar-${bp.name}.png`),
      clip: { x: 0, y: 0, width: bp.width, height: 80 },
    });
    await page.close();
  }

  // 2. Footer at all breakpoints
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `footer-${bp.name}.png`),
      clip: { x: 0, y: Math.max(0, bodyHeight - bp.height), width: bp.width, height: Math.min(bp.height, bodyHeight) },
    });
    await page.close();
  }

  // 3. Account tabs at all breakpoints (for Delete tab color)
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `account-tabs-${bp.name}.png`),
      clip: { x: 0, y: 0, width: bp.width, height: 250 },
    });
    await page.close();
  }

  // 4. Addresses tab at all breakpoints
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const addrTrigger = await page.$('[id$="-trigger-addresses"]');
    if (addrTrigger) {
      await addrTrigger.click();
      await new Promise(r => setTimeout(r, 1500));
    }
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `addresses-${bp.name}.png`),
      fullPage: true,
    });
    await page.close();
  }

  // 5. Subscriptions tab at all breakpoints
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const subTrigger = await page.$('[id$="-trigger-subscriptions"]');
    if (subTrigger) {
      await subTrigger.click();
      await new Promise(r => setTimeout(r, 1500));
    }
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `subscriptions-${bp.name}.png`),
      fullPage: true,
    });
    await page.close();
  }

  // 6. PDP bundle carousel
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width: bp.width, height: bp.height });
    await page.goto(`${BASE_URL}/products/bolivia-caranavi`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `pdp-${bp.name}.png`),
      fullPage: true,
    });
    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured in", OUTPUT_DIR);
}

main().catch(console.error);
