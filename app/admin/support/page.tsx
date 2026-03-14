import { validateLicense, getLicenseKey } from "@/lib/license";
import { listTickets } from "@/lib/support";
import { SupportPageClient } from "./SupportPageClient";
import type { TicketsResponse } from "@/lib/support-types";

export default async function SupportPage() {
  const license = await validateLicense();

  let supportData: TicketsResponse | null = null;

  const key = await getLicenseKey();
  if (key) {
    try {
      supportData = await listTickets();
    } catch {
      // Fail silently — client can retry via refresh
    }
  }

  return <SupportPageClient license={license} supportData={supportData} />;
}
