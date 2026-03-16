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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { activateLicense, refreshLicense, acceptTerms } from "../actions";
import { getLegalUrl } from "@/lib/legal-utils";
import type { LicenseInfo } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";
import type { LegalDocument } from "@/lib/legal-utils";

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
    <div className="max-w-5xl space-y-8">
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

        <TabsContent value="license" className="space-y-6 pt-6">
          <LicenseKeyTab
            initialLicense={initialLicense}
            initialHasKey={initialHasKey}
            initialRawKey={initialRawKey}
            plans={plans}
          />
        </TabsContent>

        <TabsContent value="privacy" className="pt-6">
          <DataPrivacyTab />
        </TabsContent>

        <TabsContent value="terms" className="space-y-6 pt-6">
          <TermsTab supportTerms={supportTerms} license={initialLicense} />
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

  const enrolledPlans = license.plan
    ? plans.filter((p) => p.slug === license.plan!.slug)
    : [];

  return (
    <>
      {/* Open Source License */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Open Source License</CardTitle>
          <CardDescription>
            This software is distributed under the MIT License.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="https://github.com/yuens1002/artisan-roast/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            View on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Platform License */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Platform License</CardTitle>
          <CardDescription>
            A platform license key unlocks premium features and services provided
            through the Artisan Roast platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasKey ? (
            <>
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

              <Separator />

              <div className="flex items-center gap-3">
                {license.availableActions
                  .filter((a) => a.slug === "manage-billing")
                  .map((action) => (
                    <Button
                      key={action.slug}
                      variant="outline"
                      size="sm"
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
            </>
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
        </CardContent>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Data Privacy
// ---------------------------------------------------------------------------

function DataPrivacyTab() {
  return (
    <Card>
      <CardContent className="pt-6">
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
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Terms & Conditions
// ---------------------------------------------------------------------------

function TermsTab({
  supportTerms,
  license: initialLicense,
}: {
  supportTerms: LegalDocument | null;
  license: LicenseInfo;
}) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [isPending, startTransition] = useTransition();

  const acceptedVersion = license.legal?.acceptedVersions?.["support-terms"];
  const needsAcceptance = license.legal?.pendingAcceptance?.includes("support-terms") ?? false;

  function handleAccept() {
    if (!supportTerms) return;
    startTransition(async () => {
      const result = await acceptTerms([
        { slug: "support-terms", version: supportTerms.version },
      ]);
      if (result.success && result.license) {
        setLicense(result.license);
        toast({ title: "Terms accepted" });
      } else {
        toast({
          title: "Failed to accept terms",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      {/* Support Service Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Support Service Terms</CardTitle>
            {acceptedVersion && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Accepted v{acceptedVersion}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {supportTerms ? (
            <div className="space-y-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: supportTerms.content }}
              />
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(supportTerms.lastUpdated).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {needsAcceptance && (
                  <Button
                    onClick={handleAccept}
                    disabled={isPending}
                    size="sm"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Accept Terms
                  </Button>
                )}
              </div>
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
        </CardContent>
      </Card>

      {/* Other legal documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Other Legal Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
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
        </CardContent>
      </Card>
    </>
  );
}
