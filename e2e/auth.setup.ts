/**
 * Auth setup — signs in as admin via demo mode and saves storage state.
 * Runs before all E2E tests (configured as "setup" project in playwright.config.ts).
 */

import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, ".auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  // Navigate to admin sign-in page
  await page.goto("/auth/admin-signin");

  // Click the demo admin sign-in button
  await page.getByRole("button", { name: /Sign in as Admin/i }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL(/\/admin/, { timeout: 15_000 });

  // Verify we're authenticated
  await expect(page).toHaveURL(/\/admin/);

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});
