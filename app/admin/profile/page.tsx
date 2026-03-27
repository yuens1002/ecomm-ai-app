"use client";

import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { User } from "lucide-react";

export default function AdminProfilePage() {
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
          description="Your name as shown throughout the admin dashboard"
          demoBlock
        />

        <SettingsField
          endpoint="/api/admin/profile"
          field="email"
          label="Email Address"
          description="Your email address used for sign-in and notifications"
          demoBlock
        />
      </SettingsSection>
    </div>
  );
}
