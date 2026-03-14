"use client";

import { useTransition } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { startCheckout } from "../actions";
import type { LicenseInfo } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanDetailClientProps {
  plan: Plan;
  license: LicenseInfo;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type PlanStatus = "active" | "expired" | "none";

function getPlanStatus(plan: Plan, license: LicenseInfo): PlanStatus {
  const hasFeature = plan.features.some((f) => license.features.includes(f));
  if (hasFeature) return "active";
  if (license.tier !== "FREE") return "expired";
  return "none";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanDetailClient({ plan, license }: PlanDetailClientProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const status = getPlanStatus(plan, license);
  const { details } = plan;
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  function handleSubscribe() {
    const formData = new FormData();
    formData.set("planSlug", plan.slug);

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

  return (
    <div className="space-y-8">
      <PageTitle title={plan.name} subtitle={plan.description} />

      {/* ==================== PRICE + STATUS ==================== */}
      <SettingsSection
        title="Pricing"
        action={
          status === "active" ? (
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          ) : status === "expired" ? (
            <Badge variant="destructive">Expired</Badge>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <span className="text-3xl font-bold">{priceDisplay}</span>
            <span className="text-muted-foreground">{intervalLabel}</span>
          </div>

          {/* CTA */}
          {status === "active" ? (
            <Button variant="outline" size="sm" onClick={handleManageBilling}>
              Manage Billing
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : status === "expired" ? (
            <Button size="sm" onClick={handleSubscribe} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Renew
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubscribe} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subscribe
            </Button>
          )}
        </div>
      </SettingsSection>

      {/* ==================== BENEFITS ==================== */}
      {details.benefits && details.benefits.length > 0 && (
        <SettingsSection title="Benefits">
          <ul className="space-y-1.5 text-sm">
            {details.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      {/* ==================== SLA ==================== */}
      {details.sla && (
        <SettingsSection title="Service Level">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {details.sla.responseTime && (
              <>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Response time
                </dt>
                <dd>{details.sla.responseTime}</dd>
              </>
            )}
            {details.sla.availability && (
              <>
                <dt className="text-muted-foreground">Availability</dt>
                <dd>{details.sla.availability}</dd>
              </>
            )}
            {details.sla.videoCallDuration && (
              <>
                <dt className="text-muted-foreground">Video call</dt>
                <dd>{details.sla.videoCallDuration}</dd>
              </>
            )}
          </dl>
        </SettingsSection>
      )}

      {/* ==================== QUOTAS ==================== */}
      {details.quotas && Object.keys(details.quotas).length > 0 && (
        <SettingsSection title="Monthly Quotas">
          <div className="space-y-1 text-sm">
            {Object.entries(details.quotas).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize text-muted-foreground">
                  {key.replace(/-/g, " ")}
                </span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* ==================== SCOPE ==================== */}
      {details.scope && details.scope.length > 0 && (
        <SettingsSection title="What's Covered">
          <ul className="space-y-1 text-sm">
            {details.scope.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      {/* ==================== EXCLUDES ==================== */}
      {details.excludes && details.excludes.length > 0 && (
        <SettingsSection title="Not Included">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {details.excludes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                {item}
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      {/* ==================== TERMS ==================== */}
      {details.terms && details.terms.length > 0 && (
        <SettingsSection title="Terms & Conditions">
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {details.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </SettingsSection>
      )}
    </div>
  );
}
