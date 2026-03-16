import { validateLicense, getLicenseKey } from "@/lib/license";
import { fetchPlans } from "@/lib/plans";
import { fetchLegalDoc } from "@/lib/legal";
import { TermsPageClient } from "./TermsPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function TermsPage() {
  const [license, plans, supportTerms] = await Promise.all([
    validateLicense(),
    fetchPlans().catch((): Plan[] => []),
    fetchLegalDoc("support-terms"),
  ]);

  const rawKey = await getLicenseKey();

  return (
    <TermsPageClient
      license={license}
      hasKey={!!rawKey}
      rawKey={rawKey}
      plans={plans}
      supportTerms={supportTerms}
    />
  );
}
