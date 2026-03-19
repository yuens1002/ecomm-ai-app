/**
 * AC-E2E-4: Submit normal ticket (community path)
 *
 * Navigate to Support page → select Normal type → fill title + steps → Submit
 * → verify success toast appears.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Submit normal ticket shows success toast", async ({
  page,
}) => {
  await page.goto("/admin/support");

  // Wait for the page to load
  await expect(page.getByRole("heading", { name: "Submit Ticket" })).toBeVisible({
    timeout: 10_000,
  });

  // If the type selector is visible (hasKey=true), select Normal type
  const normalRadio = page.getByRole("radio", { name: /Normal/i });
  if (await normalRadio.isVisible()) {
    await normalRadio.click();
  }

  // Fill in the issue title
  const titleInput = page.locator("#ticket-title");
  await expect(titleInput).toBeVisible();
  await titleInput.fill("Bug: Cart not updating");

  // Fill in the steps field
  const stepsInput = page.locator("#ticket-steps");
  await stepsInput.fill("The cart count badge does not update after adding items.");

  // Submit the ticket
  const submitButton = page.getByRole("button", { name: /Submit Ticket/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Verify success toast appears (title depends on submission path)
  // Use .first() to avoid strict mode — aria-live span also matches the pattern
  await expect(
    page.getByText(/Issue created|Issue #\d+ created/i).first()
  ).toBeVisible({ timeout: 10_000 });

  // Form should be cleared after successful submission
  await expect(titleInput).toHaveValue("");
});
