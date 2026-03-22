import puppeteer from "puppeteer";
import path from "path";

const BASE = "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(__dirname, "../.screenshots");

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

const PAGES = [
  { slug: "orders", path: "/admin/orders" },
  { slug: "subscriptions", path: "/admin/subscriptions" },
];

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // ── Step 1: Sign in as admin ──────────────────────────────────────
  console.log("Navigating to admin sign-in...");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/auth/admin-signin`, { waitUntil: "networkidle2", timeout: 30000 });

  // Look for demo sign-in button with text "Sign in as Admin"
  console.log("Looking for demo sign-in button...");
  const adminBtn = await page.waitForSelector('button', { timeout: 10000 });
  // Find the button that contains "Sign in as Admin"
  const buttons = await page.$$('button');
  let demoBtn: typeof buttons[0] | null = null;
  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent || "");
    if (text.includes("Sign in as Admin")) {
      demoBtn = btn;
      break;
    }
  }

  if (!demoBtn) {
    console.error("Could not find 'Sign in as Admin' button!");
    await browser.close();
    process.exit(1);
  }

  console.log("Clicking demo admin sign-in button...");
  await demoBtn.click();

  // Wait for redirect away from /auth/
  console.log("Waiting for redirect...");
  await page.waitForFunction(() => !window.location.href.includes("/auth/"), {
    timeout: 15000,
  });
  console.log(`Signed in. Current URL: ${page.url()}`);

  // ── Step 2: Screenshot each page at each breakpoint ───────────────
  for (const pg of PAGES) {
    for (const bp of BREAKPOINTS) {
      const label = `${pg.slug}-${bp.name}`;
      console.log(`Capturing ${label}...`);

      await page.setViewport({ width: bp.width, height: bp.height });
      await page.goto(`${BASE}${pg.path}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for content to load — table row on desktop/tablet, card on mobile
      if (bp.name === "mobile") {
        // Mobile uses cards
        try {
          await page.waitForSelector('[class*="MobileRecordCard"], [class*="card"], table tbody tr, .grid .rounded-lg', {
            timeout: 10000,
          });
        } catch {
          console.warn(`  Warning: No mobile card found for ${label}, taking screenshot anyway`);
        }
      } else {
        // Desktop/tablet uses table
        try {
          await page.waitForSelector("table tbody tr, table tr", {
            timeout: 10000,
          });
        } catch {
          console.warn(`  Warning: No table row found for ${label}, taking screenshot anyway`);
        }
      }

      // Small delay for rendering to settle
      await delay(500);

      const filepath = path.join(SCREENSHOT_DIR, `verify-admin-${label}.png`);
      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`  Saved: ${filepath}`);
    }
  }

  // ── Step 3: Column visibility toggle (orders, desktop) ────────────
  console.log("Capturing column visibility toggle dropdown...");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/admin/orders`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });
  await page.waitForSelector("table tbody tr", { timeout: 10000 });
  await delay(300);

  // The ColumnVisibilityToggle uses a Columns3 icon inside a button with variant="outline" and size="icon-sm"
  // Look for the button with the Columns3 icon (svg inside button)
  const colToggleBtn = await page.$('button:has(svg.lucide-columns-3)');
  if (colToggleBtn) {
    await colToggleBtn.click();
    await delay(500);

    // The dropdown content from Radix uses [data-radix-popper-content-wrapper] or [role="menu"]
    const dropdownContent = await page.$('[role="menu"]');
    if (dropdownContent) {
      const ddPath = path.join(SCREENSHOT_DIR, "verify-admin-orders-col-toggle.png");
      await dropdownContent.screenshot({ path: ddPath });
      console.log(`  Saved: ${ddPath}`);
    } else {
      console.warn("  Warning: Column visibility dropdown content not found");
      // Take viewport screenshot as fallback
      const ddPath = path.join(SCREENSHOT_DIR, "verify-admin-orders-col-toggle.png");
      await page.screenshot({ path: ddPath, fullPage: false });
      console.log(`  Saved (fallback viewport): ${ddPath}`);
    }

    // Close the dropdown by pressing Escape
    await page.keyboard.press("Escape");
    await delay(300);
  } else {
    console.warn("  Warning: Column visibility toggle button not found at desktop");
  }

  // ── Step 4: Action menu on first row (orders, desktop) ────────────
  console.log("Capturing row action menu...");

  // Hover the first row to make the action button visible
  const firstRow = await page.$("table tbody tr");
  if (firstRow) {
    await firstRow.hover();
    await delay(300);

    // Find the MoreHorizontal (three dots) button in the first row
    const actionBtn = await firstRow.$('button:has(svg.lucide-more-horizontal), button:has(svg.lucide-ellipsis)');
    if (actionBtn) {
      await actionBtn.click();
      await delay(500);

      const actionDropdown = await page.$('[role="menu"]');
      if (actionDropdown) {
        const adPath = path.join(SCREENSHOT_DIR, "verify-admin-orders-action-menu.png");
        await actionDropdown.screenshot({ path: adPath });
        console.log(`  Saved: ${adPath}`);
      } else {
        console.warn("  Warning: Action menu dropdown content not found");
        const adPath = path.join(SCREENSHOT_DIR, "verify-admin-orders-action-menu.png");
        await page.screenshot({ path: adPath, fullPage: false });
        console.log(`  Saved (fallback viewport): ${adPath}`);
      }
    } else {
      console.warn("  Warning: Row action button (three dots) not found");
      // Try alternative: look for any button in the last cell
      const cells = await firstRow.$$("td");
      if (cells.length > 0) {
        const lastCell = cells[cells.length - 1];
        const btn = await lastCell.$("button");
        if (btn) {
          await btn.click();
          await delay(500);
          const actionDropdown = await page.$('[role="menu"]');
          if (actionDropdown) {
            const adPath = path.join(SCREENSHOT_DIR, "verify-admin-orders-action-menu.png");
            await actionDropdown.screenshot({ path: adPath });
            console.log(`  Saved: ${adPath}`);
          }
        }
      }
    }
  }

  console.log("Done! Closing browser.");
  await browser.close();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
