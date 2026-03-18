import { notFound } from "next/navigation";
import { fetchPlans } from "@/lib/plans";
import { validateLicense } from "@/lib/license";
import { PlanDetailClient } from "./PlanDetailClient";

interface PlanDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { slug } = await params;

  const [plans, license] = await Promise.all([
    fetchPlans().catch(() => []),
    validateLicense(),
  ]);
  const plan = plans.find((p) => p.slug === slug);
  if (!plan) notFound();

  return <PlanDetailClient plan={plan} license={license} />;
}
