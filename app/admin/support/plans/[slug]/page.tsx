import { notFound } from "next/navigation";
import { fetchPlans } from "@/lib/plans";
import { PlanDetailClient } from "./PlanDetailClient";

interface PlanDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { slug } = await params;

  const plans = await fetchPlans().catch(() => []);
  const plan = plans.find((p) => p.slug === slug);
  if (!plan) notFound();

  return <PlanDetailClient plan={plan} />;
}
