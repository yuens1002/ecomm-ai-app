import { validateLicense, getFeatureCatalog } from "@/lib/license";
import { SupportPageClient } from "./SupportPageClient";

// Feature flag: show Plan UI when platform integration is configured
const showPlan = !!(
  process.env.PLATFORM_URL ||
  process.env.MOCK_LICENSE_TIER ||
  process.env.LICENSE_KEY
);

export default async function SupportPage() {
  let license;
  let catalog;
  let offline = false;

  try {
    [license, catalog] = await Promise.all([
      validateLicense(),
      getFeatureCatalog(),
    ]);
  } catch {
    const { validateLicense: vl, getFeatureCatalog: gc } = await import(
      "@/lib/license"
    );
    license = await vl();
    catalog = await gc();
    offline = true;
  }

  return (
    <SupportPageClient
      license={license}
      catalog={catalog}
      offline={offline}
      showPlan={showPlan}
    />
  );
}
