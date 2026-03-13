import { validateLicense, getFeatureCatalog } from "@/lib/license";
import { PlanPageClient } from "./PlanPageClient";

export default async function PlanPage() {
  const [license, catalog] = await Promise.all([
    validateLicense(),
    getFeatureCatalog(),
  ]);

  return <PlanPageClient license={license} catalog={catalog} />;
}
