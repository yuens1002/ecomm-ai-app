/**
 * No-key tier screenshot verification.
 * Captures pages for AC-UI-4, AC-UI-17.
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
    await loginPage.screenshot({ path: path.join(OUT, "NOKEY-LOGIN-NO-BUTTON.png") });
    await browser.close();
    process.exit(1);
  }

  await loginPage.waitForFunction(
    () => !window.location.pathname.includes("/auth/"),
    { timeout: 15000 }
  ).catch(() => console.log("Login redirect timeout"));

  const currentUrl = loginPage.url();
  console.log("Post-login URL:", currentUrl);

  if (currentUrl.includes("/auth/")) {
    console.error("LOGIN FAILED");
    await loginPage.screenshot({ path: path.join(OUT, "NOKEY-LOGIN-FAILED.png") });
    await browser.close();
    process.exit(1);
  }

  const cookies = await loginPage.cookies();
  await loginPage.close();

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

    await page.screenshot({ path: path.join(OUT, `${name}.png`) });

    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    if (scrollHeight > height + 100) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT, `${name}-bottom.png`) });
    }

    await page.close();
  }

  // AC-UI-4: Submit Ticket — no license key (community only)
  await capture("ac-ui-4-support-nokey-1280", "/admin/support", 1280, 900);

  // AC-UI-17: Subscriptions — no license key (none state)
  await capture("ac-ui-17-plans-nokey-1280", "/admin/support/plans", 1280, 900);

  await browser.close();
  console.log("Done! No-key tier screenshots saved to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
