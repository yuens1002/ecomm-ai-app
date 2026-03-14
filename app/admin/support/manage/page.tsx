import { validateLicense, getLicenseKey } from "@/lib/license";
import { ManagePageClient } from "./ManagePageClient";

export default async function ManagePage() {
  const license = await validateLicense();
  const rawKey = await getLicenseKey();

  return <ManagePageClient license={license} hasKey={!!rawKey} rawKey={rawKey || ""} />;
}
