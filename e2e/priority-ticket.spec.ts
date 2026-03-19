/**
 * AC-E2E-5: Submit priority ticket
 *
 * Navigate to Support page (with priority-support feature)
 * → fill title → Submit → verify ticket appears in list.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Submit priority ticket appears in list", async ({
  page,
}) => {
  await page.goto("/admin/support");

  // Wait for the Support page to load
  await expect(page.getByText("Submit Ticket")).toBeVisible({
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

  // Verify success toast
  await expect(page.getByText(/Ticket created|Issue created/i)).toBeVisible({
    timeout: 10_000,
  });

  // Verify the ticket appears in the tickets list
  await expect(page.getByText("Dashboard loading slowly")).toBeVisible();
});
