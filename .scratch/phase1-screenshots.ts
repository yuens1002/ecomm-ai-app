import puppeteer from "puppeteer";

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Sign in via demo admin button
  await page.goto("http://localhost:3000/auth/signin", { waitUntil: "networkidle2" });

  // Find the "Sign in as Admin" button by text
  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent || "");
    if (text.includes("Sign in as Admin")) {
      await btn.click();
      break;
    }
  }
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });

  // Navigate to Review Moderation
  await page.goto("http://localhost:3000/admin/reviews", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 3000)); // wait for data to load

  // Desktop 1440px
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: ".screenshots/phase1/reviews-desktop-1440.png" });

  // Mobile 375px
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: ".screenshots/phase1/reviews-mobile-375.png" });

  await browser.close();
  console.log("Screenshots saved to .screenshots/phase1/");
}

main().catch(console.error);
