/**
 * AC-E2E-3: Manual activate (paste key)
 *
 * Navigate to Manage page → paste license key → click Activate
 * → verify masked key appears and plan info updates.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Paste license key and activate shows masked key", async ({ page }) => {
  await page.goto("/admin/support/manage");

  // Wait for the page to load
  await expect(page.getByText("Platform License")).toBeVisible({ timeout: 10_000 });

  // The key input should be visible (FREE state — no key yet)
  const keyInput = page.getByRole("textbox", { name: /license key/i });
  await expect(keyInput).toBeVisible();

  // Type a license key
  await keyInput.fill("ar_lic_test_e2e_key_12345");

  // Click Activate
  const activateButton = page.getByRole("button", { name: /Activate/i });
  await expect(activateButton).toBeEnabled();
  await activateButton.click();

  // Wait for the activation to complete — the masked key should appear
  // The key is masked like: ar_lic••••2345
  await expect(page.getByText(/ar_lic/)).toBeVisible({ timeout: 10_000 });

  // The Activate button should be gone, replaced by the masked key display
  await expect(keyInput).not.toBeVisible();

  // Plan info should appear (DEFAULT_LICENSE includes plan slug "pro")
  await expect(page.getByText(/Current plan:/i)).toBeVisible();
});
