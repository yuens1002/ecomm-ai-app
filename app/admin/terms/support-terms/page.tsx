import { validateLicense } from "@/lib/license";
import { fetchLegalDoc } from "@/lib/legal";
import { SupportTermsClient } from "./SupportTermsClient";

export default async function SupportTermsPage() {
  const [license, doc] = await Promise.all([
    validateLicense(),
    fetchLegalDoc("support-terms"),
  ]);

  return <SupportTermsClient supportTerms={doc} license={license} />;
}
