import puppeteer from "puppeteer";

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Sign in
  await page.goto("http://localhost:3000/auth/signin", { waitUntil: "networkidle2" });
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent || "");
    if (text.includes("Sign in as Admin")) {
      await btn.click();
      break;
    }
  }
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });

  // Navigate to Orders
  await page.goto("http://localhost:3000/admin/orders", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 3000));

  // Desktop 1440px
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: ".screenshots/phase1/orders-desktop-1440.png" });

  // Mobile 375px
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: ".screenshots/phase1/orders-mobile-375.png" });

  // md breakpoint 768px
  await page.setViewport({ width: 768, height: 900 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: ".screenshots/phase1/orders-md-768.png" });

  await browser.close();
  console.log("Orders screenshots saved!");
}

main().catch(console.error);
