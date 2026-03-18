import { validateLicense } from "@/lib/license";
import { fetchLegalDoc } from "@/lib/legal";
import { LegalDocPage } from "../_components/LegalDocPage";

export default async function TermsOfServicePage() {
  const [license, doc] = await Promise.all([
    validateLicense(),
    fetchLegalDoc("terms-of-service"),
  ]);
  return <LegalDocPage slug="terms-of-service" doc={doc} license={license} />;
}
