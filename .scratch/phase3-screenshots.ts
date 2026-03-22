import puppeteer from "puppeteer";

const BASE = "http://localhost:3000";
const DIR = ".screenshots/phase3";

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Sign in as admin
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2" });
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent?.trim() ?? "");
    if (text.includes("Sign in as Admin")) {
      await btn.click();
      break;
    }
  }
  // Wait for sign-in to complete
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to subscriptions
  await page.goto(`${BASE}/admin/subscriptions`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Desktop 1440px
  await page.screenshot({ path: `${DIR}/subs-desktop-1440.png` });

  // Tablet 768px
  await page.setViewport({ width: 768, height: 1024 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${DIR}/subs-tablet-768.png` });

  // Mobile 375px
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `${DIR}/subs-mobile-375.png` });

  await browser.close();
  console.log("Phase 3 screenshots saved to", DIR);
}

run().catch(console.error);
