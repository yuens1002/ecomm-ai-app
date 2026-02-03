"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/forms/InputGroup";
import { Save, User } from "lucide-react";

export default function AdminProfilePage() {
  // Breadcrumb is handled by the navigation system (route: admin.profile)

  return (
    <div className="space-y-8">
      <PageTitle title="Profile" subtitle="Manage your account information" />

      <SettingsSection
        icon={<User className="h-4 w-4" />}
        title="Personal Information"
        description="Update your display name and profile settings"
      >
        <SettingsField
          endpoint="/api/admin/profile"
          field="name"
          label="Display Name"
          description="Your name as shown throughout the admin dashboard (demo - read-only)"
          saveButtonInInput
          input={(value) => (
            <InputGroup className="md:max-w-[72ch]">
              <InputGroupInput value={value as string} readOnly />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  disabled
                  size="sm"
                  variant="default"
                  className="opacity-50 cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span className="ml-2">Save</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        />

        <SettingsField
          endpoint="/api/admin/profile"
          field="email"
          label="Email Address"
          description="Your email address (demo - read-only)"
          saveButtonInInput
          input={(value) => (
            <InputGroup className="md:max-w-[72ch]">
              <InputGroupInput value={value as string} readOnly />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  disabled
                  size="sm"
                  variant="default"
                  className="opacity-50 cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span className="ml-2">Save</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        />
      </SettingsSection>
    </div>
  );
}
