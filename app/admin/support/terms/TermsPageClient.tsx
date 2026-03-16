"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { activateLicense, refreshLicense } from "../actions";
import { getLegalUrl } from "@/lib/legal";
import type { LicenseInfo } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";
import type { LegalDocument } from "@/lib/legal";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TermsPageClientProps {
  license: LicenseInfo;
  hasKey: boolean;
  rawKey: string;
  plans: Plan[];
  supportTerms: LegalDocument | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskKey(key: string): string {
  if (key.length <= 12) return "••••••••";
  return key.slice(0, 7) + "••••" + key.slice(-4);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermsPageClient({
  license: initialLicense,
  hasKey: initialHasKey,
  rawKey: initialRawKey,
  plans,
  supportTerms,
}: TermsPageClientProps) {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "license";

  return (
    <div className="space-y-12">
      <PageTitle
        title="License & Terms"
        subtitle="License, privacy, and service terms"
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="license">License Key</TabsTrigger>
          <TabsTrigger value="privacy">Data Privacy</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="license" className="space-y-12 pt-6">
          <LicenseKeyTab
            initialLicense={initialLicense}
            initialHasKey={initialHasKey}
            initialRawKey={initialRawKey}
            plans={plans}
          />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-12 pt-6">
          <DataPrivacyTab />
        </TabsContent>

        <TabsContent value="terms" className="space-y-12 pt-6">
          <TermsTab supportTerms={supportTerms} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: License Key
// ---------------------------------------------------------------------------

function LicenseKeyTab({
  initialLicense,
  initialHasKey,
  initialRawKey,
  plans,
}: {
  initialLicense: LicenseInfo;
  initialHasKey: boolean;
  initialRawKey: string;
  plans: Plan[];
}) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [rawKey, setRawKey] = useState(initialRawKey);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleActivate() {
    if (!keyInput.trim()) return;
    const formData = new FormData();
    formData.set("key", keyInput.trim());

    startTransition(async () => {
      const result = await activateLicense(formData);
      if (result.success && result.license) {
        setLicense(result.license);
        setHasKey(true);
        setRawKey(keyInput.trim());
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

  // Enrolled plans: plans whose slug matches license.plan
  const enrolledPlans = license.plan
    ? plans.filter((p) => p.slug === license.plan!.slug)
    : [];

  return (
    <>
      {/* Open Source License */}
      <FieldSet>
        <FieldLegend>Open Source License</FieldLegend>
        <FieldDescription>
          This software is distributed under the MIT License.
        </FieldDescription>
        <a
          href="https://github.com/yuens1002/artisan-roast/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          View on GitHub <ExternalLink className="h-3 w-3" />
        </a>
      </FieldSet>

      {/* Platform License */}
      <FieldSet>
        <FieldLegend>Platform License</FieldLegend>
        <FieldDescription>
          A platform license key unlocks premium features and services provided
          through the Artisan Roast platform.
        </FieldDescription>

        {hasKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                {showKey ? rawKey : maskKey(rawKey)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Badge variant="secondary">active</Badge>
            </div>

            {/* Enrolled plans */}
            {enrolledPlans.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Enrolled Plans:</p>
                <div className="flex flex-wrap gap-2">
                  {enrolledPlans.map((plan) => (
                    <Link
                      key={plan.slug}
                      href={`/admin/support/plans/${plan.slug}`}
                    >
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        {plan.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Renewal */}
            {license.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                {license.tier === "TRIAL" ? "Trial ends" : "Renews"}:{" "}
                <span className="font-medium text-foreground">
                  {new Date(license.trialEndsAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {license.availableActions.some((a) => a.slug === "manage-billing") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const action = license.availableActions.find(
                      (a) => a.slug === "manage-billing"
                    );
                    if (action) {
                      window.open(action.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Manage Billing
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
              <Link
                href="/admin/support/plans"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View Plans
              </Link>
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
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="ar_lic_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={isPending}
                className="max-w-md font-mono text-sm"
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
              Enter your license key to unlock premium features and services.
            </p>
          </div>
        )}
      </FieldSet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Data Privacy
// ---------------------------------------------------------------------------

function DataPrivacyTab() {
  return (
    <FieldSet>
      <SettingsField<boolean>
        endpoint="/api/admin/settings/telemetry"
        field="enabled"
        label="Share Anonymous Usage Data"
        description="Help us improve Artisan Roast by sharing anonymous usage statistics"
        autoSave
        defaultValue={true}
        input={(value, onChange) => (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <Label className="text-sm text-muted-foreground">
                {value ? "Telemetry is enabled" : "Telemetry is disabled"}
              </Label>
            </div>
            <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                What we collect:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Anonymous instance ID (random, not linked to you)</li>
                <li>App version and edition</li>
                <li>Aggregate counts (products, users, orders)</li>
                <li>Server environment (Node.js version, platform)</li>
              </ul>
              <p className="mt-3">
                We <strong>never</strong> collect personal information,
                customer data, or anything that could identify you or your
                customers.
              </p>
            </div>
          </div>
        )}
      />
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Terms & Conditions
// ---------------------------------------------------------------------------

function TermsTab({ supportTerms }: { supportTerms: LegalDocument | null }) {
  return (
    <>
      {/* Support Service Terms */}
      <FieldSet>
        <FieldLegend>Support Service Terms</FieldLegend>
        {supportTerms ? (
          <div className="space-y-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: supportTerms.content }}
            />
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(supportTerms.lastUpdated).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Legal documents could not be loaded.
            </p>
            <a
              href={getLegalUrl("support-terms")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline mt-2"
            >
              View on platform <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </FieldSet>

      {/* Other legal documents */}
      <FieldSet>
        <FieldLegend>Other Legal Documents</FieldLegend>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href={getLegalUrl("terms-of-service")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              Terms of Service <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <a
              href={getLegalUrl("privacy-policy")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <a
              href={getLegalUrl("acceptable-use")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              Acceptable Use Policy <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        </ul>
      </FieldSet>
    </>
  );
}
