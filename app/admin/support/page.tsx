import { auth } from "@/auth";
import { validateLicense, getLicenseKey } from "@/lib/license";
import { listTickets } from "@/lib/support";
import { SupportPageClient } from "./SupportPageClient";
import type { TicketsResponse } from "@/lib/support-types";

export default async function SupportPage() {
  const [license, session] = await Promise.all([
    validateLicense(),
    auth(),
  ]);

  let supportData: TicketsResponse | null = null;

  // Fetch tickets for any user with a license key (not just priority-support)
  const key = await getLicenseKey();
  if (key) {
    try {
      supportData = await listTickets();
    } catch {
      // Fail silently — client can retry via refresh
    }
  }

  const adminEmail = session?.user?.email || "";

  return (
    <SupportPageClient
      license={license}
      supportData={supportData}
      adminEmail={adminEmail}
    />
  );
}
