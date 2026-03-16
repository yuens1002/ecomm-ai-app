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

  return (
    <SupportPageClient
      license={license}
      tickets={tickets}
      hasKey={!!key}
    />
  );
}
