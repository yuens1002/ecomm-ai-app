import { validateLicense, getFeatureCatalog } from "@/lib/license";
import { fetchPlans } from "@/lib/plans";
import { PlanPageClient } from "./PlanPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function PlanPage() {
  let offline = false;

  const [license, catalog] = await Promise.all([
    validateLicense(),
    getFeatureCatalog(),
  ]);

  let plans: Plan[];
  try {
    plans = await fetchPlans();
  } catch {
    plans = [];
    offline = true;
  }

  // Also mark offline if license validation fell back to FREE with a key configured
  if (!offline && license.tier === "FREE" && plans.length === 0) {
    // fetchPlans returned empty — platform may be unreachable
    offline = true;
  }

  return (
    <PlanPageClient
      license={license}
      plans={plans}
      catalog={catalog}
      offline={offline}
    />
  );
}
