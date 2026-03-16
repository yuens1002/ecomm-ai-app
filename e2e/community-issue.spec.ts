/**
 * AC-E2E-4: Submit community issue
 *
 * Navigate to Support page → fill title + body → Submit
 * → verify success toast with GitHub link.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Submit community issue shows success toast with GitHub link", async ({
  page,
}) => {
  await page.goto("/admin/support");

  // Wait for the page to load
  await expect(page.getByText("Community Support")).toBeVisible({
    timeout: 10_000,
  });

  // Fill in the issue title
  const titleInput = page.getByRole("textbox", { name: /issue title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill("Bug: Cart not updating");

  // Fill in the body (optional but testing it)
  const bodyInput = page.getByRole("textbox", { name: /issue details/i });
  await bodyInput.fill("The cart count badge does not update after adding items.");

  // Submit the issue
  const submitButton = page.getByRole("button", { name: /Submit Issue/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Verify success toast appears with issue number
  await expect(page.getByText(/Issue #42 created/i)).toBeVisible({
    timeout: 10_000,
  });

  // Verify the GitHub link is in the toast
  await expect(page.getByRole("link", { name: /View on GitHub/i })).toBeVisible();

  // Form should be cleared after successful submission
  await expect(titleInput).toHaveValue("");
});
