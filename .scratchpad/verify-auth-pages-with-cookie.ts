import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), ".screenshots");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function getSessionCookie(browser: any): Promise<any[] | null> {
  // Try to get session by visiting the CSRF page and using credentials auth
  // First, check if there's a session API
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Try navigating to the session endpoint
  await page.goto(`${BASE_URL}/api/auth/session`, { waitUntil: "networkidle2", timeout: 15000 });
  const sessionText = await page.evaluate(() => document.body.textContent);
  console.log("Session check:", sessionText?.substring(0, 200));

  // Try to sign in with credentials flow
  // Navigate to signin and try to login
  await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Look for demo/test credentials login
  // Try signing in via GitHub OAuth simulation or credentials
  // Actually, let's just try to fetch the CSRF token and use credentials
  const csrfRes = await page.goto(`${BASE_URL}/api/auth/csrf`, { waitUntil: "networkidle2" });
  const csrfText = await page.evaluate(() => document.body.textContent);
  console.log("CSRF:", csrfText?.substring(0, 200));

  let csrfToken = "";
  try {
    const csrfData = JSON.parse(csrfText || "{}");
    csrfToken = csrfData.csrfToken || "";
  } catch {}

  if (!csrfToken) {
    console.log("No CSRF token found, auth blocked.");
    await page.close();
    return null;
  }

  // Try signing in with credentials - look for a test user
  // Attempt to sign in using credentials provider
  const signInRes = await page.evaluate(async (baseUrl: string, csrf: string) => {
    const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: csrf,
        email: "test@test.com",
        password: "test123",
      }).toString(),
      redirect: "manual",
    });
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()) };
  }, BASE_URL, csrfToken);

  console.log("Sign-in attempt result:", JSON.stringify(signInRes));

  // Check cookies
  const cookies = await page.cookies();
  console.log("Cookies after sign-in:", cookies.map((c: any) => c.name).join(", "));

  const sessionCookie = cookies.find((c: any) =>
    c.name.includes("session-token") || c.name.includes("authjs")
  );

  if (sessionCookie) {
    console.log("Found session cookie!");
    await page.close();
    return cookies;
  }

  console.log("No session cookie found. Auth pages will be BLOCKED.");
  await page.close();
  return null;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  // Try to get a session
  const cookies = await getSessionCookie(browser);

  if (!cookies) {
    console.log("AUTH BLOCKED: Cannot authenticate. Marking auth-dependent ACs as BLOCKED.");
    await browser.close();
    return;
  }

  for (const bp of BREAKPOINTS) {
    // === Account Page ===
    const accountPage = await browser.newPage();
    await accountPage.setViewport({ width: bp.width, height: bp.height });
    await accountPage.setCookie(...cookies);

    console.log(`[${bp.name}] Navigating to /account...`);
    await accountPage.goto(`${BASE_URL}/account`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    const accountUrl = accountPage.url();
    if (accountUrl.includes("signin") || accountUrl.includes("auth")) {
      console.log(`[${bp.name}] Still blocked: ${accountUrl}`);
      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-BLOCKED.png`),
        fullPage: false,
      });
      await accountPage.close();
      continue;
    }

    await accountPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-tabs.png`),
      fullPage: false,
    });

    // Click Subscriptions tab
    try {
      const subsTrigger = await accountPage.$('[id$="-trigger-subscriptions"]');
      if (subsTrigger) {
        await accountPage.click('[id$="-trigger-subscriptions"]');
      } else {
        const triggers = await accountPage.$$('[role="tab"]');
        for (const trigger of triggers) {
          const text = await trigger.evaluate((el: any) => el.textContent);
          if (text && text.includes("Subscription")) {
            await trigger.click();
            break;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions.png`),
        fullPage: false,
      });
      await accountPage.screenshot({
        path: path.join(OUTPUT_DIR, `verify-${bp.name}-account-subscriptions-full.png`),
        fullPage: true,
      });
    } catch (err) {
      console.error(`[${bp.name}] Error:`, err);
    }

    await accountPage.close();

    // === Orders Page ===
    const ordersPage = await browser.newPage();
    await ordersPage.setViewport({ width: bp.width, height: bp.height });
    await ordersPage.setCookie(...cookies);

    console.log(`[${bp.name}] Navigating to /orders...`);
    await ordersPage.goto(`${BASE_URL}/orders`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders.png`),
      fullPage: false,
    });
    await ordersPage.screenshot({
      path: path.join(OUTPUT_DIR, `verify-${bp.name}-orders-full.png`),
      fullPage: true,
    });

    await ordersPage.close();
  }

  await browser.close();
  console.log("Auth page screenshots captured.");
}

main().catch(console.error);
