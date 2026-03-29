/**
 * Auth setup — signs in as admin using the email/password form and saves storage state.
 * Runs before all E2E tests (configured as "setup" project in playwright.config.ts).
 *
 * Credentials come from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars, which are
 * passed from the CI workflow (or from .env.local in local dev).
 */

import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(__dirname, ".auth/admin.json");

const email = process.env.E2E_ADMIN_EMAIL ?? "admin@artisanroast.com";
const password = process.env.E2E_ADMIN_PASSWORD ?? "";

setup("authenticate as admin", async ({ page }) => {
  // Navigate to admin sign-in page
  await page.goto("/auth/admin-signin");

  // Fill email/password form (live build — no demo one-click button)
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to admin dashboard — must not match /auth/admin-signin
  await page.waitForURL(/\/admin(?![-/]signin)/, { timeout: 15_000 });

  // Verify we're authenticated
  await expect(page).toHaveURL(/\/admin(?![-/]signin)/);

  // Save storage state for reuse
  await page.context().storageState({ path: authFile });
});
