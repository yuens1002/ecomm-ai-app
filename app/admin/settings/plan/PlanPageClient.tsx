"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, AlertTriangle, ExternalLink, KeyRound, RefreshCw, Loader2, XCircle } from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Field, FieldDescription } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { activateLicense, deactivateLicense, refreshLicense } from "./actions";
import type { LicenseInfo, CatalogFeature } from "@/lib/license-types";

const PLATFORM_URL =
  process.env.NEXT_PUBLIC_PLATFORM_URL || "https://artisanroast.app";

interface PlanPageClientProps {
  license: LicenseInfo;
  catalog: CatalogFeature[];
  offline: boolean;
}

export function PlanPageClient({
  license: initialLicense,
  catalog,
  offline,
}: PlanPageClientProps) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [keyInput, setKeyInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [now] = useState(() => Date.now());

  const tier = license.tier;
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

  // Group catalog by category
  const grouped = catalog.reduce<Record<string, CatalogFeature[]>>(
    (acc, feature) => {
      const cat = feature.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(feature);
      return acc;
    },
    {}
  );

  const categoryLabels: Record<string, string> = {
    analytics: "Analytics",
    ai: "AI Features",
    support: "Support",
  };

  function handleActivate() {
    if (!keyInput.trim()) return;
    const formData = new FormData();
    formData.set("key", keyInput.trim());

    startTransition(async () => {
      const result = await activateLicense(formData);
      if (result.success && result.license) {
        setLicense(result.license);
        setKeyInput("");
        toast({ title: "License activated", description: `Plan: ${result.license.tier}` });
      } else {
        toast({
          title: "Activation failed",
          description: result.error || "Could not validate the key",
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
        toast({ title: "License removed", description: "Reverted to Free tier" });
      }
    });
  }

  function handleRefresh() {
    startTransition(async () => {
      const refreshed = await refreshLicense();
      setLicense(refreshed);
      toast({ title: "Status refreshed" });
    });
  }

  // Mask key for display
  function maskKey(key: string): string {
    if (!key || key.length <= 8) return key ? "••••••••" : "";
    return key.slice(0, 7) + "••••" + key.slice(-4);
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="Plan"
        subtitle="Manage your Artisan Roast plan and features"
      />

      {/* Offline warning */}
      {offline && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Unable to reach platform. Showing offline status.
        </div>
      )}

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
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Run <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">npm run upgrade</code> to update your store.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <SettingsSection
        title="Current Plan"
        description={
          tier === "FREE"
            ? "Self-hosted, open source"
            : tier === "TRIAL"
              ? "All features enabled during your trial"
              : "Licensed features active"
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
            {tier === "HOSTED" ? "Hosted" : tier === "PRO" ? "Pro" : tier === "TRIAL" ? "Trial" : "Free"}
          </Badge>
          {tier === "PRO" && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          </Button>
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
      </SettingsSection>

      {/* Feature catalog */}
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
        {Object.entries(grouped).map(([category, features]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {categoryLabels[category] || category}
            </h4>
            <div className="space-y-1.5">
              {features.map((feature) => {
                const enabled = license.features.includes(feature.slug);
                return (
                  <div key={feature.slug} className="flex items-start gap-2.5">
                    {enabled ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                    )}
                    <div>
                      <p className={`text-sm ${enabled ? "font-medium" : "text-muted-foreground"}`}>
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

        {/* CTAs */}
        {tier === "FREE" && (
          <div className="flex items-center gap-3 pt-4">
            <Button asChild>
              <a
                href={`${PLATFORM_URL}/signup?plan=trial&appVersion=${appVersion}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Start Free Trial
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`${PLATFORM_URL}/signup?plan=pro&appVersion=${appVersion}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Pro
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        {tier === "TRIAL" && (
          <div className="pt-4">
            <Button asChild>
              <a
                href={`${PLATFORM_URL}/signup?plan=pro&appVersion=${appVersion}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade to Pro
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}

        {tier === "PRO" && (
          <div className="flex items-center gap-3 pt-4">
            {/* Add-ons link (if there are unenabled catalog features) */}
            {catalog.some((f) => !license.features.includes(f.slug)) && (
              <Button variant="outline" asChild>
                <a
                  href={`${PLATFORM_URL}/billing`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add Features
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a
                href={`${PLATFORM_URL}/billing`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage Billing
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </SettingsSection>

      {/* License key section */}
      <SettingsSection
        title="License Key"
        description={
          tier === "FREE"
            ? "Already have a key? Paste it below to activate."
            : "Your license key"
        }
      >
        {(tier === "PRO" || tier === "TRIAL" || tier === "HOSTED") ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {maskKey("ar_lic_placeholder_key")}
              </code>
              <Badge variant="outline" className="text-xs">active</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDeactivate}
              disabled={isPending}
            >
              Remove Key
            </Button>
          </div>
        ) : (
          <Field>
            <FormHeading htmlFor="license-key" label="Activation Key" />
            <div className="flex items-center gap-2">
              <Input
                id="license-key"
                placeholder="ar_lic_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="max-w-md font-mono text-sm"
                disabled={isPending}
              />
              <Button
                onClick={handleActivate}
                disabled={isPending || !keyInput.trim()}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate
              </Button>
            </div>
            <FieldDescription>
              Get a license key at{" "}
              <a
                href={PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                artisanroast.app
              </a>
            </FieldDescription>
          </Field>
        )}
      </SettingsSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TrialProgress({ trialEndsAt, now }: { trialEndsAt: string; now: number }) {
  const end = new Date(trialEndsAt).getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  );
  const percentElapsed = Math.min(100, Math.round(((30 - daysRemaining) / 30) * 100));

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
