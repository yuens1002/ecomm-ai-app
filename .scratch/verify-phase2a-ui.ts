import puppeteer, { type Page, type Browser } from "puppeteer";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(__dirname, "../.screenshots/phase2a");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(page: Page) {
  console.log("Navigating to admin sign-in...");
  await page.goto(`${BASE}/auth/admin-signin`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  // Debug: list all buttons
  const buttonTexts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map((b) => b.textContent?.trim() || "(empty)")
  );
  console.log("  Buttons on page:", buttonTexts);

  // Take a debug screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "debug-login.png"),
    fullPage: false,
  });

  // Find demo sign-in button
  const demoBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    return btns.find((b) => (b.textContent || "").includes("Admin")) || null;
  });

  if (!demoBtn || (await demoBtn.evaluate((el) => el === null))) {
    throw new Error("Could not find admin sign-in button");
  }

  console.log("Clicking demo admin sign-in button...");
  await (demoBtn as unknown as import("puppeteer").ElementHandle<Element>).click();

  // Wait with increased timeout and debug
  try {
    await page.waitForFunction(() => !window.location.href.includes("/auth/"), {
      timeout: 20000,
    });
  } catch {
    console.log("  URL after timeout:", page.url());
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "debug-login-timeout.png"),
      fullPage: false,
    });
    throw new Error(`Login redirect timed out. URL: ${page.url()}`);
  }
  console.log(`Signed in. Current URL: ${page.url()}`);
}

async function main() {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // ── DESKTOP VIEWPORT ────────────────────────────────────────────
  console.log("\n=== Desktop (1440x900) ===");
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });

  await login(desktopPage);

  // Save cookies for reuse on mobile page
  const cookies = await desktopPage.cookies();

  // Navigate to AI settings
  console.log("Navigating to /admin/settings/ai...");
  await desktopPage.goto(`${BASE}/admin/settings/ai`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await delay(2000); // Wait for client-side data fetch

  // AC-UI-A1: Provider section screenshot
  console.log("AC-UI-A1: Capturing provider section...");
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "desktop-provider-section.png"),
    fullPage: false,
  });
  console.log("  Saved desktop-provider-section.png");

  // Scroll down to see feature toggles
  console.log("AC-UI-A4: Capturing feature toggles section...");
  await desktopPage.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await delay(500);
  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "desktop-feature-toggles.png"),
    fullPage: false,
  });
  console.log("  Saved desktop-feature-toggles.png");

  // AC-UI-A7: Settings nav
  console.log("AC-UI-A7: Capturing Settings nav with AI link...");
  await desktopPage.evaluate(() => window.scrollTo(0, 0));
  await delay(300);

  // Find the NavigationMenu trigger containing "Settings"
  const settingsTriggerId = await desktopPage.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll("button"));
    for (const btn of allBtns) {
      const text = btn.textContent?.trim() || "";
      if (text.includes("Settings") && btn.closest("nav")) {
        // Return something we can use to find it
        btn.setAttribute("data-test-settings", "true");
        return true;
      }
    }
    return false;
  });

  if (settingsTriggerId) {
    const settingsTrigger = await desktopPage.$('[data-test-settings="true"]');
    if (settingsTrigger) {
      console.log("  Found Settings trigger, clicking...");
      await settingsTrigger.click();
      await delay(700);
    }
  }

  await desktopPage.screenshot({
    path: path.join(SCREENSHOT_DIR, "desktop-settings-nav-dropdown.png"),
    fullPage: false,
  });
  console.log("  Saved desktop-settings-nav-dropdown.png");

  await desktopPage.close();

  // ── MOBILE VIEWPORT ─────────────────────────────────────────────
  console.log("\n=== Mobile (375x812) ===");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 375, height: 812 });

  // Reuse cookies from desktop session
  await mobilePage.setCookie(...cookies);

  // Navigate to AI settings
  console.log("Navigating to /admin/settings/ai...");
  await mobilePage.goto(`${BASE}/admin/settings/ai`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await delay(2000);

  // Check if we're still authenticated
  const mobileUrl = mobilePage.url();
  if (mobileUrl.includes("/auth/")) {
    console.log("  Cookie login failed, trying fresh login...");
    await login(mobilePage);
    await mobilePage.goto(`${BASE}/admin/settings/ai`, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    await delay(2000);
  }

  // Mobile provider section
  console.log("Capturing mobile provider section...");
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "mobile-provider-section.png"),
    fullPage: false,
  });
  console.log("  Saved mobile-provider-section.png");

  // Mobile feature toggles
  console.log("Capturing mobile feature toggles...");
  await mobilePage.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await delay(500);
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "mobile-feature-toggles.png"),
    fullPage: false,
  });
  console.log("  Saved mobile-feature-toggles.png");

  // Mobile sidebar with AI link
  console.log("Capturing mobile sidebar with AI link...");
  await mobilePage.evaluate(() => window.scrollTo(0, 0));
  await delay(300);

  // Find menu/drawer trigger - mark it with a data attribute and then select it
  const hasMenuBtn = await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    for (const btn of btns) {
      const label = btn.getAttribute("aria-label") || "";
      if (label.toLowerCase().includes("menu") || label.toLowerCase().includes("sidebar") || label.toLowerCase().includes("toggle")) {
        btn.setAttribute("data-test-menu", "true");
        return true;
      }
    }
    const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]');
    if (sidebarTrigger) {
      sidebarTrigger.setAttribute("data-test-menu", "true");
      return true;
    }
    return false;
  });

  const menuBtn = hasMenuBtn ? await mobilePage.$('[data-test-menu="true"]') : null;

  if (menuBtn) {
    console.log("  Found menu button, clicking...");
    await menuBtn.click();
    await delay(700);

    // Look for Settings accordion/collapsible in the drawer
    const settingsExpanded = await mobilePage.evaluate(() => {
      const items = Array.from(document.querySelectorAll("button, a, [role='button'], [role='treeitem']"));
      for (const item of items) {
        const text = item.textContent?.trim() || "";
        if (text === "Settings" || text.startsWith("Settings")) {
          (item as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (settingsExpanded) {
      console.log("  Expanded Settings section");
      await delay(500);
    }

    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile-sidebar-settings.png"),
      fullPage: false,
    });
    console.log("  Saved mobile-sidebar-settings.png");
  } else {
    console.warn("  Warning: Could not find hamburger menu button");
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile-sidebar-settings.png"),
      fullPage: false,
    });
  }

  await mobilePage.close();

  console.log("\nDone! All screenshots saved to .screenshots/phase2a/");
  await browser.close();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
