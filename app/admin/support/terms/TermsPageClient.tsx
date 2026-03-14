"use client";

import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Plan } from "@/lib/plan-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TermsPageClientProps {
  plans: Plan[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermsPageClient({ plans }: TermsPageClientProps) {
  // Collect all terms from all plans
  const planTerms = plans.flatMap((plan) =>
    (plan.details.terms ?? []).map((term) => ({
      planName: plan.name,
      term,
    }))
  );

  return (
    <div className="space-y-8">
      <PageTitle
        title="Terms & Conditions"
        subtitle="Data privacy and plan terms"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ==================== COL 1: DATA PRIVACY ==================== */}
        <SettingsSection
          title="Data Privacy"
          description="Control how your store shares anonymous usage data"
        >
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
                    customers. This data helps us understand how Artisan Roast is
                    used so we can make it better for everyone.
                  </p>
                </div>
              </div>
            )}
          />
        </SettingsSection>

        {/* ==================== COL 2: PLAN TERMS ==================== */}
        <SettingsSection
          title="Plan Terms"
          description="Terms and conditions for available plans"
        >
          {planTerms.length > 0 ? (
            <div className="space-y-4">
              {plans
                .filter((p) => p.details.terms && p.details.terms.length > 0)
                .map((plan) => (
                  <div key={plan.slug} className="space-y-2">
                    <h4 className="text-sm font-medium">{plan.name}</h4>
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                      {plan.details.terms!.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No plan terms available.
            </p>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}
