"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { refreshLicense } from "../actions";
import { startCheckout } from "./actions";
import type { LicenseInfo, AlaCartePackage, CreditPool } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Config-driven plan card
// ---------------------------------------------------------------------------

interface PlanCardConfig {
  status: "active" | "inactive" | "none";
  badge: { label: string; variant: "secondary" | "destructive" } | null;
  showCredits: boolean;
  credits: { tickets: CreditPool; sessions: CreditPool } | null;
  showManageBilling: boolean;
  showScheduleCall: boolean;
  scheduleCallUrl: string | null;
  snapshotAt: string | null;
  inactiveInfo: {
    planSlug: string;
    deactivatedAt: string;
    renewUrl: string;
    previousFeatures: string[];
  } | null;
}

function computePlanCardConfig(plan: Plan, license: LicenseInfo): PlanCardConfig {
  // Active: license.plan matches this plan
  if (license.plan?.slug === plan.slug) {
    return {
      status: "active",
      badge: { label: "Active", variant: "secondary" },
      showCredits: true,
      credits: { tickets: license.support.tickets, sessions: license.support.oneOnOne },
      showManageBilling: !!license.availableActions.find((a) => a.slug === "manage-billing"),
      showScheduleCall: license.support.oneOnOne.remaining > 0,
      scheduleCallUrl: license.availableActions.find((a) => a.slug === "schedule-call")?.url || null,
      snapshotAt: license.plan.snapshotAt,
      inactiveInfo: null,
    };
  }

  // Inactive: lapsed plan matches this plan
  if (license.lapsed?.planSlug === plan.slug) {
    return {
      status: "inactive",
      badge: { label: "Inactive", variant: "destructive" },
      showCredits: false,
      credits: null,
      showManageBilling: false,
      showScheduleCall: false,
      scheduleCallUrl: null,
      snapshotAt: null,
      inactiveInfo: {
        planSlug: license.lapsed.planSlug,
        deactivatedAt: license.lapsed.deactivatedAt,
        renewUrl: license.lapsed.renewUrl,
        previousFeatures: license.lapsed.previousFeatures,
      },
    };
  }

  // None: not subscribed
  return {
    status: "none",
    badge: null,
    showCredits: false,
    credits: null,
    showManageBilling: false,
    showScheduleCall: false,
    scheduleCallUrl: null,
    snapshotAt: null,
    inactiveInfo: null,
  };
}

// ---------------------------------------------------------------------------
// Credit display helper
// ---------------------------------------------------------------------------

function formatCredits(pool: CreditPool, label: string): string {
  const { remaining, limit, purchased } = pool;
  if (limit > 0 && purchased > 0) {
    const planRemaining = Math.max(0, limit - (pool.used > limit ? limit : pool.used));
    const purchasedRemaining = remaining - planRemaining;
    return `${label}: ${remaining} remaining (${planRemaining} plan + ${purchasedRemaining} purchased)`;
  }
  if (purchased > 0) {
    return `${label}: ${remaining} remaining (purchased)`;
  }
  return `${label}: ${remaining} remaining`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanPageClientProps {
  license: LicenseInfo;
  plans: Plan[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanPageClient({ license, plans }: PlanPageClientProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Post-checkout activation
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      startTransition(async () => {
        const result = await refreshLicense();
        if (result.success) {
          toast({ title: "Plan activated — you now have priority support!" });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="space-y-12">
      <PageTitle title="Subscriptions" subtitle="Browse and manage paid services" />

      {/* Compatibility warnings */}
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

      {/* Plans section */}
      {hasPlans ? (
        <div className="space-y-12">
          {plans.map((plan) => {
            const config = computePlanCardConfig(plan, license);
            return (
              <PlanCard
                key={plan.slug}
                plan={plan}
                config={config}
                isPending={isPending}
                onSubscribe={() => handleSubscribe(plan.slug)}
                onManageBilling={handleManageBilling}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Plans could not be loaded. If you&apos;re a subscriber, your existing plan
            remains active. Please check your connection or try again.
          </p>
        </div>
      )}

      {/* A La Carte Packages section */}
      <AlaCarteSection
        packages={license.alaCarte}
        hasKey={license.tier !== "FREE" || license.support.tickets.purchased > 0}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: Plan;
  config: PlanCardConfig;
  isPending: boolean;
  onSubscribe: () => void;
  onManageBilling: () => void;
}

function PlanCard({
  plan,
  config,
  isPending,
  onSubscribe,
  onManageBilling,
}: PlanCardProps) {
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  return (
    <FieldSet>
      <div className="flex items-center gap-3">
        <FieldLegend className="mb-0">{plan.name}</FieldLegend>
        {config.badge && (
          <Badge variant={config.badge.variant}>{config.badge.label}</Badge>
        )}
      </div>
      <FieldDescription>{plan.description}</FieldDescription>

      {/* Price */}
      <div>
        <span className="text-2xl font-bold">{priceDisplay}</span>
        <span className="text-muted-foreground">{intervalLabel}</span>
      </div>

      {/* Benefits */}
      {plan.details.benefits && plan.details.benefits.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {plan.details.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      {/* Active state extras */}
      {config.status === "active" && config.snapshotAt && (
        <p className="text-sm text-muted-foreground">
          Your plan since {new Date(config.snapshotAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      {/* Credit display */}
      {config.showCredits && config.credits && (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{formatCredits(config.credits.tickets, "Tickets")}</p>
          <p>{formatCredits(config.credits.sessions, "Sessions")}</p>
        </div>
      )}

      {/* Inactive state */}
      {config.status === "inactive" && config.inactiveInfo && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your {config.inactiveInfo.planSlug} ended on{" "}
            {new Date(config.inactiveInfo.deactivatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-sm text-muted-foreground">Renew to get back:</p>
          <ul className="space-y-1.5 text-sm">
            {config.inactiveInfo.previousFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center gap-3">
        {config.status === "active" && (
          <>
            {config.showManageBilling && (
              <Button variant="outline" size="sm" onClick={onManageBilling}>
                Manage Billing
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
            {config.showScheduleCall && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={config.scheduleCallUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule 1:1 Call
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </>
        )}
        {config.status === "inactive" && config.inactiveInfo && (
          <Button size="sm" asChild>
            <a href={config.inactiveInfo.renewUrl} target="_blank" rel="noopener noreferrer">
              Renew
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {config.status === "none" && (
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
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// A La Carte Section
// ---------------------------------------------------------------------------

function AlaCarteSection({
  packages,
  hasKey,
}: {
  packages: AlaCartePackage[];
  hasKey: boolean;
}) {
  if (packages.length === 0) return null;

  return (
    <FieldSet>
      <FieldLegend>A La Carte Packages</FieldLegend>
      <FieldDescription>
        Purchase additional credits. Available to all users. Credits never expire.
      </FieldDescription>

      <div className="space-y-3">
        {packages.map((pkg) => (
          <a
            key={pkg.id}
            href={pkg.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{pkg.label}</p>
              <p className="text-xs text-muted-foreground">{pkg.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-sm font-medium">{pkg.price}</span>
              <span className="text-xs text-primary">Purchase &rarr;</span>
            </div>
          </a>
        ))}
      </div>

      {!hasKey && (
        <p className="text-xs text-muted-foreground">
          After purchase, you&apos;ll receive a license key to activate your credits.
        </p>
      )}
    </FieldSet>
  );
}
