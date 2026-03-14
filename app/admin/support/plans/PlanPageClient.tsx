"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { startCheckout } from "./actions";
import type { LicenseInfo } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanPageClientProps {
  license: LicenseInfo;
  plans: Plan[];
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type PlanStatus = "active" | "expired" | "none";

function getPlanStatus(plan: Plan, license: LicenseInfo): PlanStatus {
  const hasFeature = plan.features.some((f) => license.features.includes(f));
  if (hasFeature) return "active";
  // Expired = key exists but feature absent
  if (license.tier !== "FREE") return "expired";
  return "none";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanPageClient({ license, plans }: PlanPageClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleSubscribe(planSlug: string) {
    const formData = new FormData();
    formData.set("planSlug", planSlug);

    startTransition(async () => {
      const result = await startCheckout(formData);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: "Checkout failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleManageBilling() {
    const billingAction = license.availableActions.find(
      (a) => a.slug === "manage-billing"
    );
    if (billingAction) {
      window.open(billingAction.url, "_blank", "noopener,noreferrer");
    }
  }

  const hasPlans = plans.length > 0;

  return (
    <div className="space-y-8">
      <PageTitle title="Plans" subtitle="Browse available plans" />

      {/* ==================== COMPATIBILITY WARNINGS ==================== */}
      {license.warnings.length > 0 && (
        <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            Compatibility Notice
          </div>
          <ul className="list-disc pl-6 text-sm text-amber-700 dark:text-amber-300">
            {license.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== PLAN CARDS ==================== */}
      {hasPlans ? (
        plans.map((plan) => {
          const status = getPlanStatus(plan, license);
          return (
            <PlanCard
              key={plan.slug}
              plan={plan}
              status={status}
              isPending={isPending}
              onSubscribe={() => handleSubscribe(plan.slug)}
              onManageBilling={handleManageBilling}
            />
          );
        })
      ) : (
        <SettingsSection
          title="No Plans Available"
          description="Unable to load plans from the platform"
        >
          <p className="text-sm text-muted-foreground">
            Plans could not be loaded. Check your internet connection or try
            again later.
          </p>
        </SettingsSection>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan Card (compact)
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: Plan;
  status: PlanStatus;
  isPending: boolean;
  onSubscribe: () => void;
  onManageBilling: () => void;
}

function PlanCard({
  plan,
  status,
  isPending,
  onSubscribe,
  onManageBilling,
}: PlanCardProps) {
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  return (
    <SettingsSection
      title={plan.name}
      description={plan.description}
      action={<StatusBadge status={status} />}
    >
      <div className="space-y-4">
        {/* Price */}
        <div>
          <span className="text-2xl font-bold">{priceDisplay}</span>
          <span className="text-muted-foreground">{intervalLabel}</span>
        </div>

        {/* Benefits (first 3) */}
        {plan.details.benefits && plan.details.benefits.length > 0 && (
          <ul className="space-y-1 text-sm">
            {plan.details.benefits.slice(0, 3).map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {/* CTA + View Details */}
        <div className="flex items-center gap-3">
          {status === "active" ? (
            <Button variant="outline" size="sm" onClick={onManageBilling}>
              Manage
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : status === "expired" ? (
            <Button size="sm" onClick={onSubscribe} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Renew
            </Button>
          ) : (
            <Button size="sm" onClick={onSubscribe} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subscribe
            </Button>
          )}
          <Link
            href={`/admin/support/plans/${plan.slug}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View Details
          </Link>
        </div>
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: PlanStatus }) {
  if (status === "active") {
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (status === "expired") {
    return <Badge variant="destructive">Expired</Badge>;
  }
  return null;
}
