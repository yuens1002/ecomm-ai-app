"use client";

import { useMemo } from "react";
import { useBreadcrumb } from "@/components/admin/dashboard/BreadcrumbContext";
import { SettingsField } from "@/components/admin/SettingsField";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { PageTitle } from "@/components/admin/PageTitle";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/app/InputGroup";
import { Save, User } from "lucide-react";

export default function AdminProfilePage() {
  const breadcrumbs = useMemo(() => [{ label: "Profile" }], []);
  useBreadcrumb(breadcrumbs);

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
