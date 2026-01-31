"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormTextArea } from "@/components/ui/forms/FormTextArea";

export default function MarketingSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Marketing Settings"
        subtitle="Configure newsletter and social media settings"
      />

      <SettingsSection
        title="Newsletter"
        description="Configure your newsletter signup section"
      >
        <SettingsField<boolean>
          endpoint="/api/admin/settings/newsletter"
          field="enabled"
          label="Enable Newsletter"
          description="Show newsletter signup section on the footer"
          autoSave
          defaultValue={false}
          input={(value, onChange, _isDirty) => (
            <div className="flex items-center space-x-2">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <Label className="text-sm text-muted-foreground">
                {value
                  ? "Newsletter signup is enabled"
                  : "Newsletter signup is disabled"}
              </Label>
            </div>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/newsletter"
          field="heading"
          label="Heading"
          description="The main heading for your newsletter signup section"
          maxLength={120}
        />

        <SettingsField
          endpoint="/api/admin/settings/newsletter"
          field="description"
          label="Description"
          description="A brief description to encourage newsletter signups"
          maxLength={280}
          saveButtonInInput
          input={(value, onChange, isDirty, isSaving, onSave) => (
            <FormTextArea
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              rows={2}
              maxLength={280}
              currentLength={(value as string)?.length ?? 0}
              showSaveButton
              isSaving={isSaving}
              isSaveDisabled={!isDirty}
              onSave={onSave}
            />
          )}
        />
      </SettingsSection>
    </div>
  );
}
