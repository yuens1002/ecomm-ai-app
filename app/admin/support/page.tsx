"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Support"
        subtitle="Manage support plan and data privacy"
      />

      <SettingsSection
        title="Support Plans"
        description="Get help and priority support for your store"
      >
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-6">
          <p className="text-sm text-muted-foreground">
            We&apos;re working on support plans to help you get the most out of
            Artisan Roast. Priority support, dedicated assistance, and more will
            be available soon.
          </p>
          <p className="mt-4 text-xs font-medium text-muted-foreground/70">
            Coming soon
          </p>
        </div>
      </SettingsSection>

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
    </div>
  );
}
