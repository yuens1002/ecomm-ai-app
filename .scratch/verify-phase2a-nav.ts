import puppeteer, { type Page, type Browser } from "puppeteer";
import path from "path";
import fs from "fs";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(__dirname, "../.screenshots/phase2a");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Login
  console.log("Logging in...");
  await page.goto(`${BASE}/auth/admin-signin`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const buttons = await page.$$("button");
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent || "");
    if (text.includes("Admin")) {
      await btn.click();
      break;
    }
  }

  await page.waitForFunction(() => !window.location.href.includes("/auth/"), {
    timeout: 15000,
  });
  console.log(`Signed in: ${page.url()}`);

  // Navigate to AI settings page
  await page.goto(`${BASE}/admin/settings/ai`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await delay(1500);

  // Click the "More" dropdown in the top nav
  console.log("Looking for 'More' nav trigger...");
  const found = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("nav button, header button"));
    for (const btn of btns) {
      const text = btn.textContent?.trim() || "";
      if (text.includes("More")) {
        btn.setAttribute("data-test-more", "true");
        return text;
      }
    }
    return null;
  });
  console.log(`  Found: ${found}`);

  if (found) {
    const moreBtn = await page.$('[data-test-more="true"]');
    if (moreBtn) {
      await moreBtn.click();
      await delay(700);

      // Screenshot the viewport to capture the dropdown
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "desktop-more-nav-dropdown.png"),
        fullPage: false,
      });
      console.log("  Saved desktop-more-nav-dropdown.png");

      // Also try to get just the dropdown content
      const dropdownContent = await page.$('[data-radix-navigation-menu-viewport], [data-state="open"]');
      if (dropdownContent) {
        await dropdownContent.screenshot({
          path: path.join(SCREENSHOT_DIR, "desktop-settings-nav-element.png"),
        });
        console.log("  Saved desktop-settings-nav-element.png");
      }
    }
  }

  // Now try mobile sidebar
  console.log("\nMobile sidebar...");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 375, height: 812 });

  // Transfer cookies
  const cookies = await page.cookies();
  await mobilePage.setCookie(...cookies);

  await mobilePage.goto(`${BASE}/admin/settings/ai`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await delay(1500);

  // Debug: list all buttons and their aria-labels
  const mobileButtons = await mobilePage.evaluate(() => {
    return Array.from(document.querySelectorAll("button")).map((b) => ({
      text: b.textContent?.trim().substring(0, 50) || "(empty)",
      ariaLabel: b.getAttribute("aria-label") || "",
      classes: b.className.substring(0, 80),
    }));
  });
  console.log("  Mobile buttons:", JSON.stringify(mobileButtons, null, 2));

  // Try clicking the hamburger (the "=" icon in top-left)
  // It looks like a 3-line menu icon
  const hamburgerClicked = await mobilePage.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    // The hamburger is typically the first button in the header
    for (const btn of btns) {
      // Check if it has a menu icon SVG (3 horizontal lines)
      const svg = btn.querySelector("svg");
      if (svg) {
        const paths = svg.querySelectorAll("line, path, rect");
        const classList = Array.from(svg.classList);
        // Check for common menu icon indicators
        if (
          classList.some((c) => c.includes("menu") || c.includes("panel") || c.includes("sidebar")) ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("menu") ||
          btn.getAttribute("aria-label")?.toLowerCase().includes("navigation")
        ) {
          (btn as HTMLElement).click();
          return `Clicked: aria-label="${btn.getAttribute("aria-label")}", classes="${classList.join(",")}"`;
        }
      }
    }
    // Fallback: click the very first button if it's in the header
    const header = document.querySelector("header");
    if (header) {
      const firstBtn = header.querySelector("button");
      if (firstBtn) {
        (firstBtn as HTMLElement).click();
        return `Clicked first header button: "${firstBtn.textContent?.trim()}"`;
      }
    }
    return null;
  });
  console.log(`  Hamburger: ${hamburgerClicked}`);
  await delay(700);

  // Take screenshot to see if drawer opened
  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "mobile-after-hamburger.png"),
    fullPage: false,
  });
  console.log("  Saved mobile-after-hamburger.png");

  // Try to find and expand Settings in drawer
  const settingsFound = await mobilePage.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll("button, a, [role='button'], span, div"));
    for (const el of allElements) {
      const text = el.textContent?.trim() || "";
      if (text === "Settings") {
        (el as HTMLElement).click();
        return `Clicked: ${el.tagName} "${text}"`;
      }
    }
    return null;
  });
  console.log(`  Settings expand: ${settingsFound}`);
  await delay(500);

  await mobilePage.screenshot({
    path: path.join(SCREENSHOT_DIR, "mobile-sidebar-settings-expanded.png"),
    fullPage: false,
  });
  console.log("  Saved mobile-sidebar-settings-expanded.png");

  await mobilePage.close();
  await page.close();
  await browser.close();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
