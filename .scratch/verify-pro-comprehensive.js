/**
 * Comprehensive PRO-tier screenshot verification.
 * Captures all pages needed for AC verification.
 * Uses demo sign-in button for authentication.
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = path.join(process.cwd(), ".screenshots", "support-verify");

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // --- Login ---
  console.log("Logging in via demo button...");
  const loginPage = await browser.newPage();
  await loginPage.setViewport({ width: 1280, height: 900 });
  await loginPage.goto(`${BASE}/auth/admin-signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click "Sign in as Admin" button
  const buttons = await loginPage.$$("button");
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text && text.includes("Sign in as Admin")) {
      await btn.click();
      clicked = true;
      console.log("Clicked 'Sign in as Admin' button");
      break;
    }
  }
  if (!clicked) {
    console.error("Could not find 'Sign in as Admin' button");
    await loginPage.screenshot({ path: path.join(OUT, "LOGIN-NO-BUTTON.png") });
    await browser.close();
    process.exit(1);
  }

  // Wait for redirect away from auth page
  await loginPage.waitForFunction(
    () => !window.location.pathname.includes("/auth/"),
    { timeout: 15000 }
  ).catch(() => console.log("Login redirect timeout - checking URL..."));

  const currentUrl = loginPage.url();
  console.log("Post-login URL:", currentUrl);

  if (currentUrl.includes("/auth/")) {
    console.error("LOGIN FAILED - still on auth page");
    await loginPage.screenshot({ path: path.join(OUT, "LOGIN-FAILED.png") });
    await browser.close();
    process.exit(1);
  }

  // Get cookies for other pages
  const cookies = await loginPage.cookies();
  await loginPage.close();

  // --- Helper to take screenshot ---
  async function capture(name, url, width = 1280, height = 900, actions) {
    console.log(`Capturing: ${name} (${width}px)...`);
    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.setViewport({ width, height });
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    if (actions) {
      await actions(page);
      await new Promise(r => setTimeout(r, 1500));
    }

    // Viewport screenshot (NEVER fullPage: true)
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });

    // Also scroll down for pages with more content
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    if (scrollHeight > height + 100) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT, `${name}-bottom.png`) });
    }

    await page.close();
  }

  // --- Submit Ticket Page ---
  await capture("pro-submit-desktop-1280", "/admin/support", 1280, 900);
  await capture("pro-submit-mobile-375", "/admin/support", 375, 812);

  // --- Ticket Detail Pages ---
  await capture("pro-ticket-t1-desktop-1280", "/admin/support/tickets/t1", 1280, 900);
  await capture("pro-ticket-t1-mobile-375", "/admin/support/tickets/t1", 375, 812);
  await capture("pro-ticket-t3-resolved-1280", "/admin/support/tickets/t3", 1280, 900);
  await capture("pro-ticket-t4-noreply-1280", "/admin/support/tickets/t4", 1280, 900);
  await capture("pro-ticket-t5-closed-1280", "/admin/support/tickets/t5", 1280, 900);

  // --- Ticket List → Detail Navigation ---
  await capture("pro-ticket-nav-1280", "/admin/support", 1280, 900, async (page) => {
    // Click first ticket link
    const ticketLink = await page.$('a[href*="/admin/support/tickets/"]');
    if (ticketLink) {
      await ticketLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
    }
  });

  // --- Subscriptions Page ---
  await capture("pro-plans-desktop-1280", "/admin/support/plans", 1280, 900);
  await capture("pro-plans-mobile-375", "/admin/support/plans", 375, 812);

  // --- Plan Detail Pages ---
  await capture("pro-plandetail-priority-1280", "/admin/support/plans/priority-support", 1280, 900);
  await capture("pro-plandetail-priority-375", "/admin/support/plans/priority-support", 375, 812);
  await capture("pro-plandetail-free-1280", "/admin/support/plans/free", 1280, 900);
  await capture("pro-plandetail-enterprise-1280", "/admin/support/plans/enterprise-support", 1280, 900);

  // --- License & Terms Page ---
  await capture("pro-terms-license-1280", "/admin/support/terms", 1280, 900);
  await capture("pro-terms-privacy-1280", "/admin/support/terms", 1280, 900, async (page) => {
    // Click Data Privacy tab
    const tabs = await page.$$('[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes("Data Privacy")) {
        await tab.click();
        break;
      }
    }
  });
  await capture("pro-terms-conditions-1280", "/admin/support/terms", 1280, 900, async (page) => {
    // Click Terms & Conditions tab
    const tabs = await page.$$('[role="tab"]');
    for (const tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes("Terms")) {
        await tab.click();
        break;
      }
    }
  });
  await capture("pro-terms-mobile-375", "/admin/support/terms", 375, 812);

  // --- Desktop containment at 1440px ---
  await capture("pro-containment-1440", "/admin/support", 1440, 900);

  // --- Sidebar nav ---
  await capture("pro-sidebar-nav-1280", "/admin/support", 1280, 900, async (page) => {
    // Open the "More" dropdown to see Support & Services nav
    const navButtons = await page.$$("button");
    for (const btn of navButtons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && text.trim() === "More") {
        await btn.click();
        break;
      }
    }
  });

  await browser.close();
  console.log("Done! Screenshots saved to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
