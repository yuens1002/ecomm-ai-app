"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Key,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const [now] = useState(() => Date.now());
  const tier = license.tier;

  // ==================== PLAN ACTIONS ====================

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
  const maskedKey = isLicensed ? maskLicenseKey(license) : null;

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
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Run{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
              npm run upgrade
            </code>{" "}
            to update your store.
          </p>
        </div>
      )}

      {/* ==================== CURRENT PLAN ==================== */}
      <SettingsSection
        title="Current Plan"
        description={
          tier === "FREE"
            ? "Self-hosted, open source"
            : tier === "TRIAL"
              ? "All features enabled during your trial"
              : "Licensed features active"
        }
        action={
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
        }
      >
        <div className="flex items-center gap-3">
          <Badge
            variant={
              tier === "PRO" || tier === "HOSTED"
                ? "default"
                : tier === "TRIAL"
                  ? "secondary"
                  : "outline"
            }
            className="text-sm"
          >
            {tier === "HOSTED"
              ? "Hosted"
              : tier === "PRO"
                ? "Pro"
                : tier === "TRIAL"
                  ? "Trial"
                  : "Free"}
          </Badge>
          {tier === "PRO" && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </div>

        {/* Trial progress */}
        {tier === "TRIAL" && license.trialEndsAt && (
          <div className="space-y-3 pt-2">
            <TrialProgress trialEndsAt={license.trialEndsAt} now={now} />
            {license.usage && (
              <TokenBudget
                used={license.usage.tokensUsed}
                budget={license.usage.tokenBudget}
                billingRequired={license.usage.billingRequired}
              />
            )}
          </div>
        )}

        {/* Platform-driven CTAs */}
        {license.availableActions.length > 0 && (
          <div className="flex items-center gap-3 pt-2">
            {license.availableActions.map((action) => (
              <Button
                key={action.slug}
                variant={
                  action.variant === "primary" ? "default" : action.variant
                }
                asChild
              >
                <a
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {action.label}
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </SettingsSection>

      {/* ==================== AVAILABLE PLANS ==================== */}
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

      {/* ==================== FEATURE CATALOG ==================== */}
      <SettingsSection
        title={tier === "FREE" ? "Pro Features" : "Features"}
        description={
          tier === "FREE"
            ? "Upgrade to unlock these capabilities"
            : tier === "TRIAL"
              ? "All features are enabled during your trial"
              : "Features included in your plan"
        }
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
        description={
          isLicensed
            ? "Your license key"
            : "Already have a key? Paste it below to activate."
        }
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
// Plan Card
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
  const { details } = plan;

  return (
    <SettingsSection
      title={plan.name}
      description={plan.description}
      action={
        isSubscribed ? (
          <Badge variant="secondary">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* Price */}
        <div>
          <span className="text-3xl font-bold">{priceDisplay}</span>
          <span className="text-muted-foreground">{intervalLabel}</span>
        </div>

        {/* Benefits */}
        {details.benefits && details.benefits.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {details.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        {/* SLA */}
        {details.sla && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">
              Service Level
            </h4>
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
          </div>
        )}

        {/* Quotas */}
        {details.quotas && Object.keys(details.quotas).length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">
              Monthly Quotas
            </h4>
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
          </div>
        )}

        {/* Scope */}
        {details.scope && details.scope.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">
              What&apos;s Covered
            </h4>
            <ul className="space-y-1 text-sm">
              {details.scope.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Excludes */}
        {details.excludes && details.excludes.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">
              Not Included
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {details.excludes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Terms */}
        {details.terms && details.terms.length > 0 && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium hover:text-foreground">
              Terms & conditions
            </summary>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {details.terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </details>
        )}

        {/* CTA */}
        <div className="pt-1">
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageBilling}
            >
              Manage Billing
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
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
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskLicenseKey(license: LicenseInfo): string {
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

// ---------------------------------------------------------------------------
// Trial / Budget sub-components
// ---------------------------------------------------------------------------

function TrialProgress({
  trialEndsAt,
  now,
}: {
  trialEndsAt: string;
  now: number;
}) {
  const end = new Date(trialEndsAt).getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  );
  const percentElapsed = Math.min(
    100,
    Math.round(((30 - daysRemaining) / 30) * 100)
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
        </span>
        <span className="text-xs text-muted-foreground">30-day trial</span>
      </div>
      <Progress value={percentElapsed} className="h-2" />
    </div>
  );
}

function TokenBudget({
  used,
  budget,
  billingRequired,
}: {
  used: number;
  budget: number;
  billingRequired: boolean;
}) {
  const percent = budget > 0 ? Math.round((used / budget) * 100) : 0;
  const exhausted = used >= budget;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {used.toLocaleString()} / {budget.toLocaleString()} tokens
        </span>
        {exhausted && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="h-3 w-3" />
            Budget exhausted
          </span>
        )}
      </div>
      <Progress
        value={Math.min(percent, 100)}
        className={`h-2 ${exhausted ? "[&>div]:bg-destructive" : ""}`}
      />
      {billingRequired && (
        <p className="text-xs text-destructive">
          Add billing to continue using AI features.
        </p>
      )}
    </div>
  );
}
