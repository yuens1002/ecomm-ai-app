import { validateLicense } from "@/lib/license";
import { fetchAddOns } from "@/lib/add-ons";
import { AddOnsPageClient } from "./AddOnsPageClient";

export default async function AddOnsPage() {
  const [license, addOns] = await Promise.all([
    validateLicense(),
    fetchAddOns(),
  ]);

  // Prefer license.alaCarte (populated when a key is present), fall back to
  // the public catalog for free-tier installs with no license key.
  const alaCarte = license.alaCarte.length > 0 ? license.alaCarte : addOns;

  return <AddOnsPageClient license={{ ...license, alaCarte }} />;
}
