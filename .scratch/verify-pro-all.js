const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = path.join("D:/DEV/artisan-roast/.screenshots/support-verify");

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login(page) {
  await page.goto(`${BASE}/auth/admin-signin`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);

  // Take a screenshot to see what's on the sign-in page
  await page.screenshot({ path: path.join(OUT, "_debug-signin.png") });

  // Find the "Sign in as Admin" button (demo mode)
  const buttons = await page.$$("button");
  let clicked = false;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    console.log("Button text:", JSON.stringify(text));
    if (text && text.includes("Sign in as Admin")) {
      await btn.click();
      console.log("Clicked 'Sign in as Admin'");
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.error("Could not find 'Sign in as Admin' button");
    return false;
  }

  // Wait for the server action to complete and redirect
  // The demoSignIn action redirects, but in Puppeteer with server actions
  // we need to wait for navigation
  await wait(5000);

  const url = page.url();
  console.log("After login URL:", url);

  if (url.includes("/auth/")) {
    // Try waiting for navigation event
    console.log("Still on auth page, waiting more...");
    await wait(5000);
    console.log("URL after extended wait:", page.url());
  }

  // Now try to navigate to an admin page to confirm session
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);
  const adminUrl = page.url();
  console.log("Admin page URL:", adminUrl);

  // If redirected to access denied or auth, login failed
  if (adminUrl.includes("/auth/") || adminUrl.includes("access-denied")) {
    // Check page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Admin page body (first 300 chars):", bodyText.substring(0, 300));
    return false;
  }

  return true;
}

async function screenshot(page, width, height, url, name, interactions) {
  await page.setViewport({ width, height });
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);

  if (interactions) {
    await interactions(page);
  }

  const filePath = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: filePath });
  console.log(`Saved: ${name}.png`);
  return filePath;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Login
  const loggedIn = await login(page);
  if (!loggedIn) {
    console.error("LOGIN FAILED — taking debug screenshot");
    await page.screenshot({ path: path.join(OUT, "_debug-login-fail.png") });
    await browser.close();
    process.exit(1);
  }
  console.log("Login successful!\n");

  // AC-UI-1: Submit Ticket desktop 1280
  await screenshot(page, 1280, 900, "/admin/support", "ac-ui-1-support-desktop-1280");

  // AC-UI-2: Submit Ticket mobile 375
  await screenshot(page, 375, 812, "/admin/support", "ac-ui-2-support-mobile-375");

  // AC-UI-5: Recent Tickets (scroll down)
  await screenshot(page, 1280, 900, "/admin/support", "ac-ui-5-recent-tickets-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-6: Ticket detail t1 desktop
  await screenshot(page, 1280, 900, "/admin/support/tickets/t1", "ac-ui-6-ticket-t1-desktop-1280");

  // AC-UI-7: Reply form on t1 (scroll to bottom)
  await screenshot(page, 1280, 900, "/admin/support/tickets/t1", "ac-ui-7-reply-form-t1-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-8: Resolved ticket t3
  await screenshot(page, 1280, 900, "/admin/support/tickets/t3", "ac-ui-8-ticket-t3-resolved-1280");
  await screenshot(page, 1280, 900, "/admin/support/tickets/t3", "ac-ui-8-ticket-t3-resolved-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-9: Closed ticket t5
  await screenshot(page, 1280, 900, "/admin/support/tickets/t5", "ac-ui-9-ticket-t5-closed-1280");
  await screenshot(page, 1280, 900, "/admin/support/tickets/t5", "ac-ui-9-ticket-t5-closed-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-10: Ticket t4 no replies
  await screenshot(page, 1280, 900, "/admin/support/tickets/t4", "ac-ui-10-ticket-t4-noreply-1280");
  await screenshot(page, 1280, 900, "/admin/support/tickets/t4", "ac-ui-10-ticket-t4-noreply-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-11: Ticket t1 mobile
  await screenshot(page, 375, 812, "/admin/support/tickets/t1", "ac-ui-11-ticket-t1-mobile-375");
  await screenshot(page, 375, 812, "/admin/support/tickets/t1", "ac-ui-11-ticket-t1-mobile-bottom-375", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-12: Ticket t1 breadcrumbs (top of page)
  await screenshot(page, 1280, 900, "/admin/support/tickets/t1", "ac-ui-12-ticket-t1-breadcrumbs-1280");

  // AC-UI-13: Interactive — click ticket link from support page
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/support`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await wait(1000);
  // Screenshot before clicking
  await page.screenshot({ path: path.join(OUT, "ac-ui-13-before-click.png") });
  // Find ticket links
  const ticketLinks = await page.$$('a[href*="/admin/support/tickets/"]');
  console.log(`Found ${ticketLinks.length} ticket links`);
  if (ticketLinks.length > 0) {
    await ticketLinks[0].click();
    await wait(3000);
    const destUrl = page.url();
    console.log("AC-UI-13 navigated to:", destUrl);
    await page.screenshot({ path: path.join(OUT, "ac-ui-13-ticket-nav-destination.png") });
  } else {
    console.log("AC-UI-13: No ticket links found! Checking page HTML...");
    const html = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
    console.log("Page HTML snippet:", html.substring(0, 500));
  }

  // AC-UI-14: Subscriptions desktop
  await screenshot(page, 1280, 900, "/admin/support/plans", "ac-ui-14-plans-desktop-1280");

  // AC-UI-15: Sale pricing (same as 14 but we verify different aspects)
  // Already captured in ac-ui-14

  // AC-UI-18: Community plan card (scroll to see it if needed)
  await screenshot(page, 1280, 900, "/admin/support/plans", "ac-ui-18-community-card-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-19: A La Carte section (scroll down)
  await screenshot(page, 1280, 900, "/admin/support/plans", "ac-ui-19-alacarte-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 1000));
  });

  // AC-UI-20: Plans mobile
  await screenshot(page, 375, 812, "/admin/support/plans", "ac-ui-20-plans-mobile-375");
  await screenshot(page, 375, 812, "/admin/support/plans", "ac-ui-20-plans-mobile-375-mid", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise(r => setTimeout(r, 500));
  });
  await screenshot(page, 375, 812, "/admin/support/plans", "ac-ui-20-plans-mobile-375-bottom", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-21: Plan Detail priority-support desktop
  await screenshot(page, 1280, 900, "/admin/support/plans/priority-support", "ac-ui-21-plan-detail-priority-1280");
  await screenshot(page, 1280, 900, "/admin/support/plans/priority-support", "ac-ui-21-plan-detail-priority-mid-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise(r => setTimeout(r, 500));
  });
  await screenshot(page, 1280, 900, "/admin/support/plans/priority-support", "ac-ui-21-plan-detail-priority-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-24: Community plan detail
  await screenshot(page, 1280, 900, "/admin/support/plans/free", "ac-ui-24-plan-detail-free-1280");
  await screenshot(page, 1280, 900, "/admin/support/plans/free", "ac-ui-24-plan-detail-free-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-25: Enterprise plan detail
  await screenshot(page, 1280, 900, "/admin/support/plans/enterprise-support", "ac-ui-25-plan-detail-enterprise-1280");
  await screenshot(page, 1280, 900, "/admin/support/plans/enterprise-support", "ac-ui-25-plan-detail-enterprise-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-26: Plan Detail mobile
  await screenshot(page, 375, 812, "/admin/support/plans/priority-support", "ac-ui-26-plan-detail-mobile-375");
  await screenshot(page, 375, 812, "/admin/support/plans/priority-support", "ac-ui-26-plan-detail-mobile-375-bottom", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-27: License & Terms desktop
  await screenshot(page, 1280, 900, "/admin/support/terms", "ac-ui-27-terms-license-1280");
  await screenshot(page, 1280, 900, "/admin/support/terms", "ac-ui-27-terms-license-bottom-1280", async (p) => {
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 500));
  });

  // AC-UI-28: Data Privacy tab (interactive)
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/support/terms`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);
  const tabs = await page.$$('[role="tab"]');
  console.log(`Found ${tabs.length} tabs`);
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    console.log("Tab:", text);
    if (text && text.includes("Data Privacy")) {
      await tab.click();
      console.log("Clicked Data Privacy tab");
      break;
    }
  }
  await wait(1500);
  await page.screenshot({ path: path.join(OUT, "ac-ui-28-terms-privacy-1280.png") });
  console.log("Saved: ac-ui-28-terms-privacy-1280.png");

  // AC-UI-29: Terms & Conditions tab (interactive)
  const tabs2 = await page.$$('[role="tab"]');
  for (const tab of tabs2) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes("Terms")) {
      await tab.click();
      console.log("Clicked Terms & Conditions tab");
      break;
    }
  }
  await wait(1500);
  await page.screenshot({ path: path.join(OUT, "ac-ui-29-terms-conditions-1280.png") });
  console.log("Saved: ac-ui-29-terms-conditions-1280.png");

  // AC-UI-31: License & Terms mobile
  await screenshot(page, 375, 812, "/admin/support/terms", "ac-ui-31-terms-mobile-375");

  // AC-UI-32: Admin sidebar nav
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/support`, { waitUntil: "networkidle2", timeout: 30000 });
  await wait(2000);
  // Try multiple sidebar selectors
  let sidebar = await page.$('aside');
  if (!sidebar) sidebar = await page.$('[data-sidebar]');
  if (!sidebar) sidebar = await page.$('nav.sidebar');
  if (!sidebar) sidebar = await page.$('.sidebar');
  if (sidebar) {
    await sidebar.screenshot({ path: path.join(OUT, "ac-ui-32-sidebar-nav.png") });
    console.log("Captured sidebar element");
  } else {
    await page.screenshot({ path: path.join(OUT, "ac-ui-32-sidebar-nav.png") });
    console.log("No sidebar element found, used full viewport for sidebar");
  }

  // AC-UI-33: Desktop containment at 1440
  await screenshot(page, 1440, 900, "/admin/support", "ac-ui-33-containment-1440");

  await browser.close();
  console.log("\nAll screenshots captured!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
