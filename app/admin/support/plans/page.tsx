import { validateLicense, getFeatureCatalog } from "@/lib/license";
import { fetchPlans } from "@/lib/plans";
import { PlanPageClient } from "./PlanPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function PlanPage() {
  const [license, catalog] = await Promise.all([
    validateLicense(),
    getFeatureCatalog(),
  ]);

  let plans: Plan[];
  try {
    plans = await fetchPlans();
  } catch {
    plans = [];
  }

  return <PlanPageClient license={license} plans={plans} catalog={catalog} />;
}
