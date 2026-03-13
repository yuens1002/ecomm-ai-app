"use client";

import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SupportTicketsSection } from "./SupportTicketsSection";
import { CommunityIssueSection } from "./CommunityIssueSection";
import type { LicenseInfo } from "@/lib/license-types";
import type { TicketsResponse } from "@/lib/support-types";

interface SupportPageClientProps {
  license: LicenseInfo;
  supportData: TicketsResponse | null;
  adminEmail: string;
}

export function SupportPageClient({
  license,
  supportData,
  adminEmail,
}: SupportPageClientProps) {
  const hasPrioritySupport = license.features.includes("priority-support");

  return (
    <div className="space-y-8">
      <PageTitle
        title="Support"
        subtitle="Priority support, community issues, and data privacy"
      />

      {/* ==================== PRIORITY SUPPORT ==================== */}
      {hasPrioritySupport && supportData && (
        <SupportTicketsSection
          initialTickets={supportData.tickets}
          initialUsage={supportData.usage}
        />
      )}

      {/* ==================== COMMUNITY ISSUES ==================== */}
      <CommunityIssueSection
        adminEmail={adminEmail}
        showUpsell={!hasPrioritySupport}
      />

      {/* ==================== DATA PRIVACY ==================== */}
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
