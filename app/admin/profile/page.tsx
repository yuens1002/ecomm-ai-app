import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import SecurityTab from "@/app/(site)/account/tabs/SecurityTab";
import { getCurrentAdminUserId } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KeyRound, User } from "lucide-react";

export default async function AdminProfilePage() {
  const userId = await getCurrentAdminUserId();
  if (!userId) redirect("/auth/admin-signin");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  const hasPassword = !!user?.passwordHash;

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

      <SettingsSection
        icon={<KeyRound className="h-4 w-4" />}
        title="Security"
        description="Manage your password and sign-in settings"
      >
        <SecurityTab hasPassword={hasPassword} bare />
      </SettingsSection>
    </div>
  );
}
