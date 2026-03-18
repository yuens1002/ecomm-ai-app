import { validateLicense } from "@/lib/license";
import { fetchLegalDoc } from "@/lib/legal";
import { LegalDocPage } from "../_components/LegalDocPage";

export default async function PrivacyPolicyPage() {
  const [license, doc] = await Promise.all([
    validateLicense(),
    fetchLegalDoc("privacy-policy"),
  ]);
  return <LegalDocPage slug="privacy-policy" doc={doc} license={license} />;
}
