import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots", "support-verify");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Step 1: Authenticate via demo sign-in
  console.log("Navigating to admin sign-in...");
  await page.goto(`${BASE_URL}/auth/admin-signin`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Look for demo sign-in button
  const demoBtn = await page.$('button[data-testid="demo-admin-signin"]');
  if (demoBtn) {
    console.log("Found demo admin sign-in button, clicking...");
    await demoBtn.click();
  } else {
    // Try finding any button with "demo" or "admin" text
    const buttons = await page.$$("button");
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent?.toLowerCase() || "", btn);
      if (text.includes("demo") && text.includes("admin")) {
        console.log(`Clicking button: "${text}"`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try any demo button
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent?.toLowerCase() || "", btn);
        if (text.includes("demo")) {
          console.log(`Clicking button: "${text}"`);
          await btn.click();
          clicked = true;
          break;
        }
      }
    }
    if (!clicked) {
      console.log("No demo button found. Taking screenshot of sign-in page for debug.");
      await page.screenshot({ path: path.join(OUTPUT_DIR, "debug-signin.png") });
    }
  }

  // Wait for redirect
  await new Promise((r) => setTimeout(r, 5000));
  console.log("Current URL after login:", page.url());

  if (page.url().includes("/auth/")) {
    console.log("ERROR: Still on auth page. Login may have failed.");
    await page.screenshot({ path: path.join(OUTPUT_DIR, "debug-auth-failed.png") });
    await browser.close();
    return;
  }

  console.log("Login successful!");

  // =====================================================
  // Screenshot 1: /admin/support (Submit Ticket page)
  // Covers: AC-UI-2, AC-UI-4, AC-UI-5, AC-UI-6
  // =====================================================
  console.log("\n--- /admin/support ---");
  await page.goto(`${BASE_URL}/admin/support`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  // Full viewport screenshot
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-support-ticket.png"),
  });
  console.log("Saved: desktop-support-ticket.png");

  // Try to scroll down to capture more of the page
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-support-ticket-scrolled.png"),
  });
  console.log("Saved: desktop-support-ticket-scrolled.png");

  // =====================================================
  // Screenshot 2: /admin/support/plans (Subscriptions)
  // Covers: AC-UI-9, AC-UI-10, AC-UI-13
  // =====================================================
  console.log("\n--- /admin/support/plans ---");
  await page.goto(`${BASE_URL}/admin/support/plans`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plans.png"),
  });
  console.log("Saved: desktop-plans.png");

  // Scroll down to see a la carte section
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plans-scrolled.png"),
  });
  console.log("Saved: desktop-plans-scrolled.png");

  // Scroll more
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plans-scrolled2.png"),
  });
  console.log("Saved: desktop-plans-scrolled2.png");

  // Collect plan slugs from the page links
  const planLinks = await page.$$eval('a[href*="/admin/support/plans/"]', (els) =>
    els.map((el) => el.getAttribute("href")).filter((h) => h && !h.endsWith("/plans") && !h.endsWith("/plans/"))
  );
  console.log("Found plan links:", planLinks);

  // =====================================================
  // Screenshot 3: /admin/support/plans/{slug} (Plan Detail)
  // Covers: AC-UI-16, AC-UI-18
  // =====================================================
  const planSlug = planLinks.length > 0 ? planLinks[0] : "/admin/support/plans/priority-support";
  console.log(`\n--- Plan Detail: ${planSlug} ---`);
  await page.goto(`${BASE_URL}${planSlug}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plan-detail.png"),
  });
  console.log("Saved: desktop-plan-detail.png");

  // Scroll to see add-ons
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plan-detail-scrolled.png"),
  });
  console.log("Saved: desktop-plan-detail-scrolled.png");

  // Scroll more
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-plan-detail-scrolled2.png"),
  });
  console.log("Saved: desktop-plan-detail-scrolled2.png");

  // =====================================================
  // Screenshot 4: /admin/support/terms (License & Terms)
  // Covers: AC-UI-20 (License Key tab - default)
  // =====================================================
  console.log("\n--- /admin/support/terms ---");
  await page.goto(`${BASE_URL}/admin/support/terms`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await new Promise((r) => setTimeout(r, 3000));
  console.log("URL:", page.url());

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-terms-license.png"),
  });
  console.log("Saved: desktop-terms-license.png");

  // Scroll to see more of License Key tab
  await page.evaluate(() => window.scrollBy(0, 400));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-terms-license-scrolled.png"),
  });
  console.log("Saved: desktop-terms-license-scrolled.png");

  // =====================================================
  // Screenshot 5: Data Privacy tab (Interactive)
  // Covers: AC-UI-21
  // =====================================================
  console.log("\n--- Terms: Data Privacy tab ---");
  // Scroll back to top to find tab
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 500));

  // Click "Data Privacy" tab
  const dataPrivacyTab = await page.$('button[value="data-privacy"]');
  if (dataPrivacyTab) {
    await dataPrivacyTab.click();
    console.log("Clicked Data Privacy tab via value selector");
  } else {
    // Try text-based click
    const tabs = await page.$$('[role="tab"], button');
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.textContent?.trim() || "", tab);
      if (text.includes("Data Privacy")) {
        await tab.click();
        console.log(`Clicked tab: "${text}"`);
        break;
      }
    }
  }
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-terms-data-privacy.png"),
  });
  console.log("Saved: desktop-terms-data-privacy.png");

  // =====================================================
  // Screenshot 6: Terms & Conditions tab (Interactive)
  // Covers: AC-UI-22
  // =====================================================
  console.log("\n--- Terms: Terms & Conditions tab ---");
  // Click "Terms & Conditions" tab
  const tcTab = await page.$('button[value="terms-conditions"]');
  if (tcTab) {
    await tcTab.click();
    console.log("Clicked Terms & Conditions tab via value selector");
  } else {
    const tabs = await page.$$('[role="tab"], button');
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.textContent?.trim() || "", tab);
      if (text.includes("Terms & Conditions") || text.includes("T&C")) {
        await tab.click();
        console.log(`Clicked tab: "${text}"`);
        break;
      }
    }
  }
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-terms-tc.png"),
  });
  console.log("Saved: desktop-terms-tc.png");

  // Scroll to see more of T&C
  await page.evaluate(() => window.scrollBy(0, 400));
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "desktop-terms-tc-scrolled.png"),
  });
  console.log("Saved: desktop-terms-tc-scrolled.png");

  await browser.close();
  console.log("\nAll screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
