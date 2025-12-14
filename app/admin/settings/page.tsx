import { requireAdmin } from "@/lib/admin";
import SettingsManagementClient from "./SettingsManagementClient";

export const metadata = {
  title: "Site Settings | Admin",
  description: "Manage site-wide settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure site-wide settings and preferences
        </p>
      </div>
      <SettingsManagementClient />
    </>
  );
}
