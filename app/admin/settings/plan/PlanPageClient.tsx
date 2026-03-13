"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Circle,
  ExternalLink,
  Key,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  activateLicense,
  deactivateLicense,
  refreshLicense,
  startCheckout,
} from "./actions";
import type { LicenseInfo, CatalogFeature } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanPageClientProps {
  license: LicenseInfo;
  plans: Plan[];
  catalog: CatalogFeature[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanPageClient({
  license: initialLicense,
  plans,
  catalog,
}: PlanPageClientProps) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [isPending, startTransition] = useTransition();

  // ==================== PLAN CARDS ====================

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

  // ==================== LICENSE KEY ====================

  const [keyInput, setKeyInput] = useState("");
  const isLicensed = license.tier !== "FREE";
  const maskedKey = isLicensed
    ? maskLicenseKey(license)
    : null;

  function handleActivate() {
    if (!keyInput.trim()) return;
    const formData = new FormData();
    formData.set("key", keyInput.trim());

    startTransition(async () => {
      const result = await activateLicense(formData);
      if (result.success && result.license) {
        setLicense(result.license);
        setKeyInput("");
        toast({ title: "License activated" });
      } else {
        toast({
          title: "Activation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateLicense();
      if (result.success && result.license) {
        setLicense(result.license);
        toast({ title: "License removed" });
      } else {
        toast({
          title: "Failed to remove license",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshLicense();
      if (result.success && result.license) {
        setLicense(result.license);
        toast({ title: "License refreshed" });
      } else {
        toast({
          title: "Refresh failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  // ==================== FEATURE CATALOG ====================

  const groupedFeatures = groupByCategory(catalog);

  return (
    <div className="space-y-8">
      <PageTitle title="Plan" subtitle="Manage your subscription and features" />

      {/* ==================== PLAN CARDS ==================== */}
      {plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isSubscribed = plan.features.some((f) =>
              license.features.includes(f)
            );
            return (
              <PlanCard
                key={plan.slug}
                plan={plan}
                isSubscribed={isSubscribed}
                isPending={isPending}
                onSubscribe={() => handleSubscribe(plan.slug)}
                onManageBilling={handleManageBilling}
              />
            );
          })}
        </div>
      )}

      {/* ==================== FEATURE CATALOG ==================== */}
      <SettingsSection
        title="Features"
        description="Feature availability for your current plan"
      >
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium capitalize text-muted-foreground">
                {formatCategory(category)}
              </h4>
              <div className="space-y-1">
                {features.map((feature) => {
                  const enabled = license.features.includes(feature.slug);
                  return (
                    <div
                      key={feature.slug}
                      className="flex items-start gap-3 rounded-md px-2 py-1.5"
                    >
                      {enabled ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium ${enabled ? "" : "text-muted-foreground"}`}
                        >
                          {feature.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ==================== LICENSE KEY ==================== */}
      <SettingsSection
        title="License Key"
        icon={<Key className="h-4 w-4" />}
        description="Activate or manage your license key"
        action={
          isLicensed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isPending}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
              />
            </Button>
          ) : undefined
        }
      >
        {isLicensed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {maskedKey}
              </code>
              <Badge variant="secondary">active</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeactivate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Remove License
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="ar_lic_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={isPending}
                className="max-w-sm font-mono text-sm"
                aria-label="License key"
              />
              <Button
                onClick={handleActivate}
                disabled={isPending || !keyInput.trim()}
                size="sm"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Activate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your license key to unlock Pro features.
            </p>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan Card sub-component
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: Plan;
  isSubscribed: boolean;
  isPending: boolean;
  onSubscribe: () => void;
  onManageBilling: () => void;
}

function PlanCard({
  plan,
  isSubscribed,
  isPending,
  onSubscribe,
  onManageBilling,
}: PlanCardProps) {
  const priceDisplay = `$${(plan.price / 100).toFixed(0)}`;
  const intervalLabel = plan.interval === "year" ? "/yr" : "/mo";

  return (
    <div
      className={`relative flex flex-col rounded-lg border p-6 ${
        plan.highlight ? "border-primary shadow-sm" : ""
      }`}
    >
      {plan.highlight && (
        <Badge className="absolute -top-2.5 left-4" variant="default">
          <Sparkles className="mr-1 h-3 w-3" />
          Recommended
        </Badge>
      )}

      {isSubscribed && (
        <Badge className="absolute -top-2.5 right-4" variant="secondary">
          Active
        </Badge>
      )}

      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold">{priceDisplay}</span>
        <span className="text-muted-foreground">{intervalLabel}</span>
      </div>

      {/* Benefits */}
      {plan.details.benefits.length > 0 && (
        <ul className="mb-4 space-y-1.5 text-sm">
          {plan.details.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              {benefit}
            </li>
          ))}
        </ul>
      )}

      {/* Quotas */}
      {Object.keys(plan.details.quotas).length > 0 && (
        <div className="mb-4 space-y-1 text-xs text-muted-foreground">
          {Object.entries(plan.details.quotas).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/_/g, " ")}</span>
              <span>{typeof value === "number" ? value.toLocaleString() : value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        {isSubscribed ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onManageBilling}
            >
              Manage Billing
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={onSubscribe}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Subscribe
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskLicenseKey(license: LicenseInfo): string {
  // The platform doesn't expose the actual key, so we show a generic masked version
  if (license.tier === "TRIAL") return "ar_lic_••••_trial";
  if (license.tier === "PRO") return "ar_lic_••••_pro";
  if (license.tier === "HOSTED") return "ar_lic_••••_hosted";
  return "ar_lic_••••_key";
}

function groupByCategory(
  features: CatalogFeature[]
): Record<string, CatalogFeature[]> {
  const groups: Record<string, CatalogFeature[]> = {};
  for (const feature of features) {
    const cat = feature.category || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(feature);
  }
  return groups;
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    analytics: "Analytics",
    ai: "AI Features",
    support: "Support",
  };
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}
