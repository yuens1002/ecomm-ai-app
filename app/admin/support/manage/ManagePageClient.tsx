"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { activateLicense, refreshLicense } from "../actions";
import type { LicenseInfo } from "@/lib/license-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ManagePageClientProps {
  license: LicenseInfo;
  hasKey: boolean;
  rawKey: string;
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

export function ManagePageClient({
  license: initialLicense,
  hasKey: initialHasKey,
  rawKey: initialRawKey,
}: ManagePageClientProps) {
  const { toast } = useToast();
  const [license, setLicense] = useState(initialLicense);
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [rawKey, setRawKey] = useState(initialRawKey);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isLicensed = license.tier !== "FREE";

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

  // Active plan features
  const planFeatures = license.features.filter(
    (f) => f !== "priority-support"
  );

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage"
        subtitle="License key and subscription overview"
      />

      {/* ==================== LICENSE KEY ==================== */}
      <SettingsSection
        title="License Key"
        icon={<Key className="h-4 w-4" />}
        description={
          hasKey
            ? "Your license key is active"
            : "Paste your license key to activate Pro features"
        }
        action={
          hasKey ? (
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
        {hasKey ? (
          <div className="space-y-3">
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
              Enter your license key to unlock Pro features. Keys are issued
              after subscribing to a plan.
            </p>
          </div>
        )}
      </SettingsSection>

      {/* ==================== SUBSCRIPTION OVERVIEW ==================== */}
      {isLicensed && (
        <SettingsSection
          title="Subscription"
          description="Your current plan and renewal information"
        >
          <div className="space-y-4">
            {/* Current plans */}
            {planFeatures.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Active Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {planFeatures.map((feature) => (
                    <Badge key={feature} variant="outline">
                      {feature.replace(/-/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Renewal / expiration */}
            {license.trialEndsAt && (
              <div className="text-sm text-muted-foreground">
                {license.tier === "TRIAL" ? "Trial ends" : "Renews"}:{" "}
                <span className="font-medium text-foreground">
                  {new Date(license.trialEndsAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3">
              {license.availableActions.some(
                (a) => a.slug === "manage-billing"
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const action = license.availableActions.find(
                      (a) => a.slug === "manage-billing"
                    );
                    if (action) {
                      window.open(
                        action.url,
                        "_blank",
                        "noopener,noreferrer"
                      );
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
            </div>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
