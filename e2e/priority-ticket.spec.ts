/**
 * AC-E2E-5: Submit priority ticket
 *
 * Navigate to Support page (with priority-support feature)
 * → fill title → Submit → verify ticket appears in list, quota decrements.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  // Reset mock platform state
  await request.post("http://localhost:9999/__reset");
});

test("Submit priority ticket appears in list with quota update", async ({
  page,
}) => {
  await page.goto("/admin/support");

  // Wait for the Priority Support section to load
  // (requires license with priority-support feature — mock platform returns PRO by default)
  await expect(page.getByText("Priority Support")).toBeVisible({
    timeout: 10_000,
  });

  // Check initial quota display (0 / 5 tickets)
  await expect(page.getByText(/0 \/ 5 tickets/i)).toBeVisible();

  // Fill in the ticket title
  const titleInput = page.getByRole("textbox", { name: /ticket title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill("Dashboard loading slowly");

  // Fill in optional body
  const bodyInput = page.getByRole("textbox", { name: /ticket description/i });
  await bodyInput.fill("The admin dashboard takes 10s+ to load.");

  // Submit the ticket
  const submitButton = page.getByRole("button", { name: /Submit Ticket/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Verify success toast
  await expect(page.getByText(/Ticket created/i)).toBeVisible({
    timeout: 10_000,
  });

  // Verify the ticket appears in the "Recent Tickets" list
  await expect(page.getByText("Dashboard loading slowly")).toBeVisible();

  // Verify quota updated (1 / 5 tickets)
  await expect(page.getByText(/1 \/ 5 tickets/i)).toBeVisible();
});
