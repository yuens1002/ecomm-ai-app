import { validateLicense } from "@/lib/license";
import { fetchLegalDoc } from "@/lib/legal";
import { LegalDocPage } from "../_components/LegalDocPage";

export default async function AcceptableUsePage() {
  const [license, doc] = await Promise.all([
    validateLicense(),
    fetchLegalDoc("acceptable-use"),
  ]);
  return <LegalDocPage slug="acceptable-use" doc={doc} license={license} />;
}
