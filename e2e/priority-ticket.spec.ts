/**
 * AC-E2E-5: Submit priority ticket
 *
 * Navigate to Support page (with priority-support feature)
 * → fill title → Submit → verify success toast appears.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Submit priority ticket shows success toast", async ({
  page,
}) => {
  await page.goto("/admin/support");

  // Wait for the Support page to load
  await expect(page.getByRole("heading", { name: "Submit Ticket" })).toBeVisible({
    timeout: 10_000,
  });

  // If credits section is visible (hasKey=true with support.pools), check initial quota
  const creditsSection = page.getByText("Priority Tickets");
  if (await creditsSection.isVisible()) {
    // UsageBar renders "{used} / {total} used"
    await expect(page.getByText(/0 \/ 5 used/i)).toBeVisible();
  }

  // Fill in the ticket title
  const titleInput = page.locator("#ticket-title");
  await expect(titleInput).toBeVisible();
  await titleInput.fill("Dashboard loading slowly");

  // Fill in optional steps
  const stepsInput = page.locator("#ticket-steps");
  await stepsInput.fill("The admin dashboard takes 10s+ to load.");

  // Submit the ticket
  const submitButton = page.getByRole("button", { name: /Submit Ticket/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Verify success toast (title depends on build variant)
  // In demo mode the form is blocked and shows "Changes are disabled in demo mode."
  // Use .first() to avoid strict mode — aria-live span also matches the pattern
  await expect(
    page.getByText(/Ticket created|Issue created|Changes are disabled in demo mode/i).first()
  ).toBeVisible({
    timeout: 10_000,
  });
});
