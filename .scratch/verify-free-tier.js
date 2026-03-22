/**
 * FREE-tier screenshot verification.
 * Captures pages for AC-UI-3, AC-UI-16, AC-UI-23, AC-UI-30.
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
    await loginPage.screenshot({ path: path.join(OUT, "FREE-LOGIN-NO-BUTTON.png") });
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
    await loginPage.screenshot({ path: path.join(OUT, "FREE-LOGIN-FAILED.png") });
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

    // Scroll down for longer pages
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    if (scrollHeight > height + 100) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(OUT, `${name}-bottom.png`) });
    }

    await page.close();
  }

  // AC-UI-3: Submit Ticket — FREE user with lapsed plan + purchased credits
  await capture("ac-ui-3-support-free-1280", "/admin/support", 1280, 900);

  // AC-UI-16: Subscriptions — FREE user (lapsed plan, inactive card)
  await capture("ac-ui-16-plans-free-1280", "/admin/support/plans", 1280, 900);

  // AC-UI-23: Plan Detail — non-subscriber (FREE)
  await capture("ac-ui-23-plandetail-free-1280", "/admin/support/plans/priority-support", 1280, 900);

  // AC-UI-30: License & Terms — Terms tab (FREE, pending acceptance)
  await capture("ac-ui-30-terms-free-1280", "/admin/support/terms", 1280, 900, async (page) => {
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

  await browser.close();
  console.log("Done! FREE tier screenshots saved to", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
