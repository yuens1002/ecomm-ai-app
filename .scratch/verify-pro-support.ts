import puppeteer, { type Page, type Browser } from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots", "support-verify");

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/admin-signin`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await wait(2000);

  // Click "Sign in as Admin" demo button
  const buttons = await page.$$("button");
  let adminBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent || "", btn);
    if (text.includes("Sign in as Admin")) {
      adminBtn = btn;
      break;
    }
  }

  if (!adminBtn) {
    console.error("Could not find 'Sign in as Admin' button");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "BLOCKER-login-failed.png"),
    });
    throw new Error("Login failed - button not found");
  }

  // Click and wait for URL to change (server action redirect)
  await adminBtn.click();

  // Wait for URL to change away from /auth/
  for (let i = 0; i < 20; i++) {
    await wait(500);
    const currentUrl = page.url();
    if (!currentUrl.includes("/auth/")) break;
  }

  // Verify login
  const url = page.url();
  if (url.includes("/auth/")) {
    console.error("Login failed, still on auth page:", url);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "BLOCKER-login-failed.png"),
    });
    throw new Error("Login failed");
  }
  console.log("Login successful, URL:", url);
}

async function screenshotPage(
  page: Page,
  url: string,
  name: string,
  width: number,
  height: number,
  actions?: (page: Page) => Promise<void>
) {
  await page.setViewport({ width, height });
  await page.goto(`${BASE_URL}${url}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await wait(4000);

  if (actions) {
    await actions(page);
    await wait(2000);
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
  });
  console.log(`Captured: ${name}.png`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Login first
  await login(page);

  // ===== AC-UI-1: Submit Ticket PRO desktop 1280px =====
  await screenshotPage(page, "/admin/support", "ac-ui-1-support-desktop-1280", 1280, 900);

  // ===== AC-UI-2: Submit Ticket PRO mobile 375px =====
  await screenshotPage(page, "/admin/support", "ac-ui-2-support-mobile-375", 375, 812);

  // ===== AC-UI-5: Recent Tickets section 1280px =====
  // Already captured in AC-UI-1, but let's get a focused element screenshot
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-5-recent-tickets-1280.png") });
  console.log("Captured: ac-ui-5-recent-tickets-1280.png");

  // ===== AC-UI-6: Ticket detail t1 1280px =====
  await screenshotPage(page, "/admin/support/tickets/t1", "ac-ui-6-ticket-t1-desktop-1280", 1280, 900);

  // ===== AC-UI-7: Ticket detail reply form t1 — scroll down to see it =====
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support/tickets/t1`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  // Scroll to bottom to see reply form
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-7-reply-form-t1-1280.png") });
  console.log("Captured: ac-ui-7-reply-form-t1-1280.png");

  // ===== AC-UI-8: Ticket detail t3 resolved 1280px =====
  await screenshotPage(page, "/admin/support/tickets/t3", "ac-ui-8-ticket-t3-resolved-1280", 1280, 900);
  // Scroll down for banner
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-8-ticket-t3-resolved-bottom-1280.png") });
  console.log("Captured: ac-ui-8-ticket-t3-resolved-bottom-1280.png");

  // ===== AC-UI-9: Ticket detail t5 closed 1280px =====
  await screenshotPage(page, "/admin/support/tickets/t5", "ac-ui-9-ticket-t5-closed-1280", 1280, 900);

  // ===== AC-UI-10: Ticket detail t4 no replies 1280px =====
  await screenshotPage(page, "/admin/support/tickets/t4", "ac-ui-10-ticket-t4-noreply-1280", 1280, 900);

  // ===== AC-UI-11: Ticket detail mobile t1 375px =====
  await screenshotPage(page, "/admin/support/tickets/t1", "ac-ui-11-ticket-t1-mobile-375", 375, 812);

  // ===== AC-UI-12: Ticket detail breadcrumbs t1 1280px =====
  // Same page as AC-UI-6 but let's get the top area
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support/tickets/t1`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-12-breadcrumbs-t1-1280.png") });
  console.log("Captured: ac-ui-12-breadcrumbs-t1-1280.png");

  // ===== AC-UI-13: Click ticket in list → navigate to detail =====
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  // Click first ticket link
  const ticketLink = await page.$('a[href*="/admin/support/tickets/"]');
  if (ticketLink) {
    await ticketLink.click();
    await wait(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-13-ticket-navigation-1280.png") });
    console.log("Captured: ac-ui-13-ticket-navigation-1280.png, URL:", page.url());
  } else {
    console.error("FAIL: No ticket link found on support page");
  }

  // ===== AC-UI-14: Subscriptions 3 plan cards 1280px =====
  await screenshotPage(page, "/admin/support/plans", "ac-ui-14-plans-desktop-1280", 1280, 900);

  // ===== AC-UI-15: Sale pricing on Priority Support =====
  // Same page, already captured in AC-UI-14

  // ===== AC-UI-18: Community plan card =====
  // Need to scroll down to see it
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support/plans`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-18-community-plan-1280.png") });
  console.log("Captured: ac-ui-18-community-plan-1280.png");

  // ===== AC-UI-19: A La Carte section =====
  // Same page, scroll more
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-19-alacarte-1280.png") });
  console.log("Captured: ac-ui-19-alacarte-1280.png");

  // ===== AC-UI-20: Subscriptions mobile 375px =====
  await screenshotPage(page, "/admin/support/plans", "ac-ui-20-plans-mobile-375", 375, 812);
  // Also scroll to see all cards on mobile
  await page.evaluate(() => window.scrollTo(0, 800));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-20-plans-mobile-375-scroll.png") });
  console.log("Captured: ac-ui-20-plans-mobile-375-scroll.png");

  // ===== AC-UI-21: Plan Detail PRO priority-support 1280px =====
  await screenshotPage(page, "/admin/support/plans/priority-support", "ac-ui-21-plandetail-priority-1280", 1280, 900);

  // ===== AC-UI-22: Add-On Packages on plan detail =====
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support/plans/priority-support`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-22-addons-priority-1280.png") });
  console.log("Captured: ac-ui-22-addons-priority-1280.png");

  // ===== AC-UI-24: Community plan detail free 1280px =====
  await screenshotPage(page, "/admin/support/plans/free", "ac-ui-24-plandetail-free-1280", 1280, 900);

  // ===== AC-UI-25: Enterprise plan detail 1280px =====
  await screenshotPage(page, "/admin/support/plans/enterprise-support", "ac-ui-25-plandetail-enterprise-1280", 1280, 900);
  // Scroll for quotas
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-25-plandetail-enterprise-bottom-1280.png") });
  console.log("Captured: ac-ui-25-plandetail-enterprise-bottom-1280.png");

  // ===== AC-UI-26: Plan Detail mobile priority-support 375px =====
  await screenshotPage(page, "/admin/support/plans/priority-support", "ac-ui-26-plandetail-mobile-375", 375, 812);

  // ===== AC-UI-27: License & Terms License Key tab 1280px =====
  await screenshotPage(page, "/admin/support/terms", "ac-ui-27-terms-license-1280", 1280, 900);

  // ===== AC-UI-28: Data Privacy tab (Interactive) =====
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support/terms`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  // Click Data Privacy tab
  const privacyTab = await page.evaluateHandle(() => {
    const triggers = document.querySelectorAll('[role="tab"]');
    for (const t of triggers) {
      if (t.textContent?.includes("Data Privacy")) return t;
    }
    return null;
  });
  if (privacyTab) {
    await (privacyTab as any).click();
    await wait(1500);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-28-privacy-tab-1280.png") });
  console.log("Captured: ac-ui-28-privacy-tab-1280.png");

  // ===== AC-UI-29: Terms & Conditions tab (Interactive) =====
  const termsTab = await page.evaluateHandle(() => {
    const triggers = document.querySelectorAll('[role="tab"]');
    for (const t of triggers) {
      if (t.textContent?.includes("Terms & Conditions")) return t;
    }
    return null;
  });
  if (termsTab) {
    await (termsTab as any).click();
    await wait(1500);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-29-terms-tab-1280.png") });
  console.log("Captured: ac-ui-29-terms-tab-1280.png");
  // Scroll to see accepted badge and links
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-29-terms-tab-bottom-1280.png") });
  console.log("Captured: ac-ui-29-terms-tab-bottom-1280.png");

  // ===== AC-UI-31: License & Terms mobile 375px =====
  await screenshotPage(page, "/admin/support/terms", "ac-ui-31-terms-mobile-375", 375, 812);

  // ===== AC-UI-32: Admin nav Support & Services tree 1280px =====
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE_URL}/admin/support`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await wait(2000);
  // Try to get sidebar nav element screenshot
  const sidebar = await page.$("nav");
  if (sidebar) {
    await sidebar.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-32-sidebar-nav-1280.png") });
    console.log("Captured: ac-ui-32-sidebar-nav-1280.png");
  } else {
    await page.screenshot({ path: path.join(OUTPUT_DIR, "ac-ui-32-sidebar-nav-1280.png") });
    console.log("Captured: ac-ui-32-sidebar-nav-1280.png (fallback viewport)");
  }

  // ===== AC-UI-33: Desktop containment 1440px =====
  await screenshotPage(page, "/admin/support", "ac-ui-33-containment-1440", 1440, 900);

  await page.close();
  await browser.close();
  console.log("\nAll screenshots captured.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
