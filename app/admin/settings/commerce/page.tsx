"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { OptionCardGroup } from "@/app/admin/_components/forms/OptionCardGroup";
import { WeightUnitOption } from "@/lib/weight-unit";

export default function CommerceSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Commerce Settings"
        subtitle="Configure product display and commerce-related settings"
      />

      <SettingsSection
        title="Weight Display Unit"
        description="Choose how product weights are displayed throughout your store"
      >
        <SettingsField
          endpoint="/api/admin/settings/weight-unit"
          field="weightUnit"
          label="Weight Display Unit"
          description="Choose how product weights are displayed throughout your store"
          autoSave
          input={(value, onChange) => (
            <OptionCardGroup
              value={(value as string) || WeightUnitOption.METRIC}
              onValueChange={onChange}
              options={[
                {
                  value: WeightUnitOption.IMPERIAL,
                  title: "Imperial (oz / lb)",
                  description:
                    "Display weights in ounces and pounds (e.g., 12 oz, 2 lb)",
                },
                {
                  value: WeightUnitOption.METRIC,
                  title: "Metric (g / kg)",
                  description:
                    "Display weights in grams and kilograms (e.g., 340 g, 1 kg)",
                },
              ]}
              wrapperClassName="w-full max-w-xl md:max-w-2xl"
            />
          )}
        />
      </SettingsSection>
    </div>
  );
}
