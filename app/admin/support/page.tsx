import { validateLicense, getLicenseKey } from "@/lib/license";
import { listTickets } from "@/lib/support";
import { SupportPageClient } from "./SupportPageClient";
import type { SupportTicket } from "@/lib/support-types";

export default async function SupportPage() {
  const license = await validateLicense();

  const key = await getLicenseKey();
  let tickets: SupportTicket[] = [];

  if (key) {
    try {
      const data = await listTickets();
      tickets = data.tickets;
    } catch {
      // Fail silently — client can retry via refresh
    }
  }

  // TODO: Remove — mock tickets for layout testing
  if (tickets.length === 0) {
    const base = "2026-03-16T12:00:00Z";
    const offset = (ms: number) => new Date(new Date(base).getTime() - ms).toISOString();
    tickets = [
      { id: "t1", title: "Menu items not syncing after bulk import", body: null, type: "priority", status: "OPEN", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/42", createdAt: offset(2 * 3600_000), updatedAt: offset(2 * 3600_000) },
      { id: "t2", title: "Order confirmation email missing store logo", body: null, type: "normal", status: "OPEN", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/41", createdAt: offset(8 * 3600_000), updatedAt: offset(8 * 3600_000) },
      { id: "t3", title: "Stripe webhook fails on subscription renewal", body: null, type: "priority", status: "RESOLVED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/38", createdAt: offset(3 * 86400_000), updatedAt: offset(1 * 86400_000) },
      { id: "t4", title: "Product images 404 after domain change", body: null, type: "normal", status: "RESOLVED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/37", createdAt: offset(7 * 86400_000), updatedAt: offset(5 * 86400_000) },
      { id: "t5", title: "Dashboard analytics not loading on Safari", body: null, type: "normal", status: "CLOSED", githubUrl: "https://github.com/artisanroast/artisan-roast/issues/35", createdAt: offset(14 * 86400_000), updatedAt: offset(10 * 86400_000) },
    ];
  }

  return (
    <SupportPageClient
      license={license}
      tickets={tickets}
      hasKey={!!key}
    />
  );
}
