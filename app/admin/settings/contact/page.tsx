"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InputGroupInput } from "@/components/ui/forms/InputGroup";
import { FormTextArea } from "@/components/ui/forms/FormTextArea";

export default function ContactSettingsPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Contact Settings"
        subtitle="Configure contact information and email settings"
      />

      <SettingsSection
        title="Email Configuration"
        description="Configure your store's primary contact email"
      >
        <SettingsField
          endpoint="/api/admin/settings/email"
          field="contactEmail"
          label="Contact Email"
          description="Primary email address for customer inquiries and notifications"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              type="email"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />
      </SettingsSection>

      <SettingsSection
        title="Footer Contact Information"
        description="Configure what contact information appears in your site footer"
      >
        <SettingsField<boolean>
          endpoint="/api/admin/settings/footer-contact"
          field="showEmail"
          label="Show Email in Footer"
          description="Display your contact email in the site footer"
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
                  ? "Email is shown in footer"
                  : "Email is hidden from footer"}
              </Label>
            </div>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/footer-contact"
          field="hoursText"
          label="Business Hours"
          description="Your café's operating hours (displayed in footer)"
          saveButtonInInput
          input={(value, onChange, isDirty, isSaving, onSave) => (
            <FormTextArea
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder="Mon-Fri: 7am-6pm&#10;Sat-Sun: 8am-5pm"
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
