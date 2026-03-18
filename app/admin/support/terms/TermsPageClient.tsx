"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { marked } from "marked";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { activateLicense, refreshLicense, acceptTerms } from "../actions";
import { getLegalUrl } from "@/lib/legal-utils";
import type { LicenseInfo } from "@/lib/license-types";
import type { Plan } from "@/lib/plan-types";
import type { LegalDocument } from "@/lib/legal-utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TermsPageClientProps {
  license: LicenseInfo;
  hasKey: boolean;
  rawKey: string;
  plans: Plan[];
  supportTerms: LegalDocument | null;
  termsOfService: LegalDocument | null;
  privacyPolicy: LegalDocument | null;
  acceptableUse: LegalDocument | null;
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
  termsOfService,
  privacyPolicy,
  acceptableUse,
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
          <TabsTrigger value="license">License</TabsTrigger>
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
          <TermsTab
            supportTerms={supportTerms}
            license={initialLicense}
            termsOfService={termsOfService}
            privacyPolicy={privacyPolicy}
            acceptableUse={acceptableUse}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: License
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

  const enrolledPlan = license.plan
    ? plans.find((p) => p.slug === license.plan!.slug) ?? null
    : null;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Open Source License */}
        <div className="flex flex-col rounded-lg border p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Your Store, Your Code</h3>
            <p className="text-sm text-muted-foreground">
              Released under the MIT License — you own the source code.
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Modify anything — the code is yours to customize
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              No vendor lock-in — host anywhere, switch anytime
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              No per-transaction fees on your sales
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              Your data stays on your infrastructure
            </li>
          </ul>
          <div className="mt-auto pt-5">
            <a
              href="https://github.com/yuens1002/artisan-roast/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View MIT License on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Platform License */}
        <div className="flex flex-col rounded-lg border p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Platform License {hasKey && <Badge variant="secondary">Active</Badge>}</h3>
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
            <p className="text-sm text-muted-foreground">
              Connects your store to the Artisan Roast platform for
              premium support services and features.
            </p>
          </div>
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
              </div>

              {enrolledPlan && (
                <p className="text-sm">
                  Current plan: <span className="font-bold">{enrolledPlan.name}</span>
                </p>
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

              <div className="mt-auto pt-5 flex items-center gap-3">
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
                Enter your license key to connect to the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Data Privacy
// ---------------------------------------------------------------------------

function DataPrivacyTab() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const telemetryPayloadPreview = `{
  "anonymousInstanceId": "random, not linked to you",
  "app": {
    "version": "app version",
    "edition": "app edition"
  },
  "aggregateCounts": {
    "products": "count",
    "users": "count",
    "orders": "count"
  },
  "serverEnvironment": {
    "nodeVersion": "Node.js version",
    "platform": "platform"
  }
}`;

  useEffect(() => {
    const fetchTelemetrySettings = async () => {
      try {
        const response = await fetch("/api/admin/settings/telemetry");
        if (!response.ok) throw new Error("Failed to load telemetry settings");

        const data = (await response.json()) as { enabled?: boolean };
        setEnabled(data.enabled !== false);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load telemetry settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTelemetrySettings();
  }, [toast]);

  function handleTelemetryToggle(checked: boolean) {
    const previousValue = enabled;
    setEnabled(checked);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/settings/telemetry", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: checked }),
        });

        if (!response.ok) throw new Error("Failed to save telemetry settings");

        toast({
          title: "Success",
          description: "Settings saved successfully",
        });
      } catch {
        setEnabled(previousValue);
        toast({
          title: "Error",
          description: "Failed to save telemetry settings",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="w-full md:w-1/2">
      <div className="flex h-full flex-col space-y-4 rounded-lg border p-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Share Anonymous Usage Data</h3>
          <p className="text-sm text-muted-foreground">
            Help us improve Artisan Roast by sharing anonymous usage statistics
          </p>
        </div>

        <div className="rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">What we collect:</p>
          <pre className="overflow-x-auto rounded-md border bg-background/70 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {telemetryPayloadPreview}
          </pre>
          <p className="mt-3">
            We <strong>never</strong> collect personal information, customer
            data, or anything that could identify you or your customers.
          </p>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center space-x-3">
            <Switch
              checked={enabled}
              onCheckedChange={handleTelemetryToggle}
              disabled={isLoading || isPending}
              aria-label="Toggle telemetry"
            />
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading telemetry setting..."
                : enabled
                  ? "Telemetry is enabled"
                  : "Telemetry is disabled"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Terms & Conditions
// ---------------------------------------------------------------------------

function TermsTab({
  supportTerms,
  license: initialLicense,
  termsOfService,
  privacyPolicy,
  acceptableUse,
}: {
  supportTerms: LegalDocument | null;
  license: LicenseInfo;
  termsOfService: LegalDocument | null;
  privacyPolicy: LegalDocument | null;
  acceptableUse: LegalDocument | null;
}) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [isPending, startTransition] = useTransition();
  const renderedSupportTerms = useMemo(() => {
    if (!supportTerms) return null;

    return marked.parse(supportTerms.content, {
      gfm: true,
      breaks: true,
    }) as string;
  }, [supportTerms]);

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
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: renderedSupportTerms ?? "" }}
              />
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(supportTerms.lastUpdated ?? supportTerms.effectiveDate).toLocaleDateString("en-US", {
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

      {/* Other legal documents — rendered inline */}
      {[
        { doc: termsOfService, label: "Terms of Service" },
        { doc: privacyPolicy, label: "Privacy Policy" },
        { doc: acceptableUse, label: "Acceptable Use Policy" },
      ].map(({ doc, label }) => (
        <LegalDocCollapsible
          key={label}
          doc={doc}
          label={label}
          license={license}
          onAccepted={setLicense}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Collapsible legal doc card (for ToS, Privacy Policy, AUP)
// ---------------------------------------------------------------------------

function LegalDocCollapsible({
  doc,
  label,
  license,
  onAccepted,
}: {
  doc: LegalDocument | null;
  label: string;
  license: LicenseInfo;
  onAccepted: (license: LicenseInfo) => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const rendered = useMemo(() => {
    if (!doc) return null;
    return marked.parse(doc.content, { gfm: true, breaks: true }) as string;
  }, [doc]);

  const needsAcceptance =
    !!doc && (license.legal?.pendingAcceptance?.includes(doc.slug) ?? false);

  function handleAccept() {
    if (!doc) return;
    startTransition(async () => {
      const result = await acceptTerms([{ slug: doc.slug, version: doc.version }]);
      if (result.success && result.license) {
        onAccepted(result.license);
        toast({ title: "Terms accepted" });
      } else {
        toast({ title: "Failed to accept terms", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{label}</CardTitle>
                {needsAcceptance && (
                  <Badge variant="destructive" className="text-xs">
                    Review required
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
            </div>
            {doc && (
              <CardDescription className="text-xs">
                v{doc.version} · Effective{" "}
                {new Date(doc.effectiveDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </CardDescription>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {rendered ? (
              <div
                className="prose max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Document unavailable.</p>
            )}
            {needsAcceptance && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={handleAccept} disabled={isPending} size="sm">
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Accept Terms
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
