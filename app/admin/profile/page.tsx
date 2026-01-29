"use client";

import { useMemo } from "react";
import { useBreadcrumb } from "@/components/admin/dashboard/BreadcrumbContext";
import { SettingsField } from "@/components/admin/SettingsField";
import { SettingsSection } from "@/components/admin/SettingsSection";
import { PageTitle } from "@/components/admin/PageTitle";
import { User } from "lucide-react";

export default function AdminProfilePage() {
  const breadcrumbs = useMemo(() => [{ label: "Profile" }], []);
  useBreadcrumb(breadcrumbs);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Profile"
        subtitle="Manage your account information"
      />

      <SettingsSection
        icon={<User className="h-4 w-4" />}
        title="Personal Information"
        description="Update your display name and profile settings"
      >
        <SettingsField
          endpoint="/api/admin/profile"
          field="name"
          label="Display Name"
          description="Your name as shown throughout the admin dashboard"
          maxLength={100}
        />

        <SettingsField
          endpoint="/api/admin/profile"
          field="email"
          label="Email Address"
          description="Your email address (read-only)"
          input={(value) => (
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              {value || "Not set"}
            </div>
          )}
        />
      </SettingsSection>
    </div>
  );
}
