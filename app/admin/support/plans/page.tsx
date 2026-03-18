import { validateLicense } from "@/lib/license";
import { fetchPlans } from "@/lib/plans";
import { PlanPageClient } from "./PlanPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function PlanPage() {
  const license = await validateLicense();

  let plans: Plan[];
  try {
    plans = await fetchPlans();
  } catch {
    plans = [];
  }

  return <PlanPageClient license={license} plans={plans} />;
}
