"use client";

import { SettingsField } from "@/components/admin/SettingsField";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { PageTitle } from "@/components/admin/PageTitle";
import { OptionCardGroup } from "@/components/admin/OptionCardGroup";
import { AlertTriangle } from "lucide-react";

export default function LocationSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Location Settings"
        subtitle="Changes affect the Café page's content."
      />

      <SettingsSection
        title="Location Type"
        description={
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <span>
              Note: Switching between location types will reset your Café page
              and wipe existing data.
            </span>
          </div>
        }
      >
        <SettingsField
          endpoint="/api/admin/settings/location-type"
          field="locationType"
          label="Single or Multiple Locations"
          description="Choose whether your business operates from a single location or multiple locations"
          autoSave
          input={(value, onChange) => (
            <OptionCardGroup
              value={(value as string) || "SINGLE"}
              onValueChange={(nextValue) => {
                if (nextValue === value) return;
                const confirmed = window.confirm(
                  "Changing the location type may affect how your café information is displayed. Continue?"
                );
                if (confirmed) onChange(nextValue);
              }}
              options={[
                {
                  value: "SINGLE",
                  title: "Single Location",
                  description:
                    "Your café has one physical location. Information will be displayed directly on the Café page.",
                },
                {
                  value: "MULTI",
                  title: "Multiple Locations",
                  description:
                    "Your café has multiple locations. The Café page will display a list of all locations.",
                },
              ]}
            />
          )}
        />
      </SettingsSection>
    </div>
  );
}
