"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { FormTextArea } from "@/components/ui/forms/FormTextArea";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="General Settings"
        subtitle="Configure your store's basic identity and branding"
      />

      <SettingsSection
        title="Store Branding"
        description="Configure your store's basic identity and branding"
      >
        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeName"
          label="Store Name"
          description="Your store's name as shown in the header, footer, and browser title"
          maxLength={60}
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeTagline"
          label="Tagline"
          description="A brief tagline or slogan that appears in the site header"
          maxLength={120}
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeDescription"
          label="Store Description"
          description="A longer description of your store, used for SEO and social media"
          maxLength={280}
          saveButtonInInput
          input={(value, onChange, isDirty, isSaving, onSave) => (
            <FormTextArea
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
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
