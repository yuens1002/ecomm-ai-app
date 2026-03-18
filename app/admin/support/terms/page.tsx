import { validateLicense, getLicenseKey } from "@/lib/license";
import { fetchPlans } from "@/lib/plans";
import { fetchAllLegalDocs } from "@/lib/legal";
import { TermsPageClient } from "./TermsPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function TermsPage() {
  const [license, plans, allDocs] = await Promise.all([
    validateLicense(),
    fetchPlans().catch((): Plan[] => []),
    fetchAllLegalDocs(),
  ]);

  const rawKey = await getLicenseKey();
  const docMap = Object.fromEntries(allDocs.map((d) => [d.slug, d]));

  return (
    <TermsPageClient
      license={license}
      hasKey={!!rawKey}
      rawKey={rawKey}
      plans={plans}
      supportTerms={docMap["support-terms"] ?? null}
      termsOfService={docMap["terms-of-service"] ?? null}
      privacyPolicy={docMap["privacy-policy"] ?? null}
      acceptableUse={docMap["acceptable-use"] ?? null}
    />
  );
}
