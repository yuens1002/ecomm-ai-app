import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), ".screenshots", "support-verify");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // ── 1. Login ──────────────────────────────────────────────────────
  console.log("Navigating to admin sign-in...");
  await page.goto(`${BASE}/auth/admin-signin`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // Find and click demo Admin button
  const buttons = await page.$$("button");
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent?.trim() ?? "");
    if (/admin/i.test(text) && /demo|sign.?in/i.test(text) || text === "Admin") {
      console.log(`Clicking button: "${text}"`);
      await btn.click();
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // Try data-testid
    const testIdBtn = await page.$('[data-testid="demo-admin-signin"]');
    if (testIdBtn) {
      console.log("Clicking demo-admin-signin by testid");
      await testIdBtn.click();
      clicked = true;
    }
  }
  if (!clicked) {
    // Last resort: any button with "Demo" or "Admin" in text
    for (const btn of buttons) {
      const text = await btn.evaluate((el) => el.textContent?.trim() ?? "");
      if (/demo/i.test(text) || /admin/i.test(text)) {
        console.log(`Clicking fallback button: "${text}"`);
        await btn.click();
        clicked = true;
        break;
      }
    }
  }

  if (!clicked) {
    console.error("Could not find demo admin button! Taking debug screenshot.");
    await page.screenshot({ path: path.join(OUT, "debug-signin.png") });
    await browser.close();
    return;
  }

  // Wait for redirect
  await new Promise((r) => setTimeout(r, 3000));
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
  console.log("Current URL after login:", page.url());

  if (page.url().includes("/auth/")) {
    console.error("Still on auth page. Taking debug screenshot.");
    await page.screenshot({ path: path.join(OUT, "debug-still-auth.png") });
    await browser.close();
    return;
  }

  // ── 2. Submit Ticket page ─────────────────────────────────────────
  console.log("Navigating to /admin/support...");
  await page.goto(`${BASE}/admin/support`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT, "ticket-pro-desktop.png") });
  console.log("✓ ticket-pro-desktop.png");

  // ── 3. Subscriptions page ────────────────────────────────────────
  console.log("Navigating to /admin/support/plans...");
  await page.goto(`${BASE}/admin/support/plans`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT, "plans-pro-desktop.png") });
  console.log("✓ plans-pro-desktop.png");

  // ── 4. Plan Detail page ──────────────────────────────────────────
  console.log("Navigating to /admin/support/plans/priority-support...");
  await page.goto(`${BASE}/admin/support/plans/priority-support`, {
    waitUntil: "networkidle2",
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT, "plan-detail-pro-desktop.png"),
  });
  console.log("✓ plan-detail-pro-desktop.png");

  // Scroll down for add-ons
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUT, "plan-detail-pro-desktop-addons.png"),
  });
  console.log("✓ plan-detail-pro-desktop-addons.png");

  // ── 5. License & Terms — License Key tab ─────────────────────────
  console.log("Navigating to /admin/support/terms...");
  await page.goto(`${BASE}/admin/support/terms`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(OUT, "terms-license-pro-desktop.png"),
  });
  console.log("✓ terms-license-pro-desktop.png");

  // ── 6. Data Privacy tab ──────────────────────────────────────────
  console.log("Clicking Data Privacy tab...");
  const tabs = await page.$$('button[role="tab"]');
  for (const tab of tabs) {
    const text = await tab.evaluate((el) => el.textContent?.trim() ?? "");
    if (/data\s*privacy/i.test(text)) {
      await tab.click();
      console.log(`Clicked tab: "${text}"`);
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(OUT, "terms-privacy-pro-desktop.png"),
  });
  console.log("✓ terms-privacy-pro-desktop.png");

  // ── 7. Terms & Conditions tab ────────────────────────────────────
  console.log("Clicking Terms & Conditions tab...");
  const tabs2 = await page.$$('button[role="tab"]');
  for (const tab of tabs2) {
    const text = await tab.evaluate((el) => el.textContent?.trim() ?? "");
    if (/terms\s*[&]\s*conditions/i.test(text)) {
      await tab.click();
      console.log(`Clicked tab: "${text}"`);
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(OUT, "terms-toc-pro-desktop.png"),
  });
  console.log("✓ terms-toc-pro-desktop.png");

  // Done
  await browser.close();
  console.log("\nAll screenshots saved to:", OUT);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
