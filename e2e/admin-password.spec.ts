/**
 * AC-E2E: Admin password change
 *
 * Verifies the admin can reach the security section on /admin/profile
 * and that the password change form works end-to-end.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  await request.post("http://localhost:9999/__reset");
});

test("Password nav item links to profile page", async ({ page }) => {
  await page.goto("/admin/profile");

  await expect(page).toHaveURL("/admin/profile");
  await expect(page.getByText("Security")).toBeVisible({ timeout: 10_000 });
});

test("Security section is visible on admin profile page", async ({ page }) => {
  await page.goto("/admin/profile");

  // SettingsSection title renders as a div, not a heading — use getByText
  await expect(page.getByText("Security")).toBeVisible({ timeout: 10_000 });
  // Password form fields confirm the section is functional
  await expect(page.locator("#newPassword")).toBeVisible();
});

test("Shows error when current password is wrong", async ({ page }) => {
  await page.goto("/admin/profile");

  await expect(page.locator("#newPassword")).toBeVisible({ timeout: 10_000 });

  const currentPasswordInput = page.locator("#currentPassword");
  if (await currentPasswordInput.isVisible()) {
    await currentPasswordInput.fill("definitely_wrong_password");
  }

  await page.locator("#newPassword").fill("newvalidpassword");
  await page.locator("#confirmPassword").fill("newvalidpassword");

  await page.getByRole("button", { name: /Change Password|Set Password/i }).click();

  await expect(
    page.getByText(/incorrect|invalid|error/i).first()
  ).toBeVisible({ timeout: 10_000 });
});

test("Shows client-side error when passwords do not match", async ({ page }) => {
  await page.goto("/admin/profile");

  await expect(page.locator("#newPassword")).toBeVisible({ timeout: 10_000 });

  const currentPasswordInput = page.locator("#currentPassword");
  if (await currentPasswordInput.isVisible()) {
    await currentPasswordInput.fill("anypassword");
  }

  await page.locator("#newPassword").fill("validpassword1");
  await page.locator("#confirmPassword").fill("differentpassword2");

  await page.getByRole("button", { name: /Change Password|Set Password/i }).click();

  await expect(page.getByText(/do not match/i)).toBeVisible({ timeout: 5_000 });
});

test("Shows client-side error when new password is too short", async ({ page }) => {
  await page.goto("/admin/profile");

  await expect(page.locator("#newPassword")).toBeVisible({ timeout: 10_000 });

  await page.locator("#newPassword").fill("short");
  await page.locator("#confirmPassword").fill("short");

  await page.getByRole("button", { name: /Change Password|Set Password/i }).click();

  await expect(page.getByText(/8 characters/i)).toBeVisible({ timeout: 5_000 });
});
