import { validateLicense, getLicenseKey } from "@/lib/license";
import { listTickets } from "@/lib/support";
import { fetchPlans } from "@/lib/plans";
import { SupportPageClient } from "./SupportPageClient";
import type { SupportTicket } from "@/lib/support-types";

export default async function SupportPage() {
  const [license, plans] = await Promise.all([validateLicense(), fetchPlans()]);

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

  const enrolledPlan = license.plan ? plans.find((p) => p.slug === license.plan!.slug) : null;
  const slaResponseTime = enrolledPlan?.details?.sla?.responseTime;

  return (
    <SupportPageClient
      license={license}
      tickets={tickets}
      hasKey={!!key}
      slaResponseTime={slaResponseTime}
    />
  );
}
