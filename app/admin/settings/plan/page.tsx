import { validateLicense, getFeatureCatalog } from "@/lib/license";
import { PlanPageClient } from "./PlanPageClient";

export default async function PlanPage() {
  let license;
  let catalog;
  let offline = false;

  try {
    [license, catalog] = await Promise.all([
      validateLicense(),
      getFeatureCatalog(),
    ]);
  } catch {
    // Graceful degradation — show FREE state with offline notice
    const { validateLicense: vl, getFeatureCatalog: gc } = await import(
      "@/lib/license"
    );
    license = await vl();
    catalog = await gc();
    offline = true;
  }

  return <PlanPageClient license={license} catalog={catalog} offline={offline} />;
}
