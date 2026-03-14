import { fetchPlans } from "@/lib/plans";
import { TermsPageClient } from "./TermsPageClient";
import type { Plan } from "@/lib/plan-types";

export default async function TermsPage() {
  let plans: Plan[];
  try {
    plans = await fetchPlans();
  } catch {
    plans = [];
  }

  return <TermsPageClient plans={plans} />;
}
