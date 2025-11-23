import { requireAdmin } from "@/lib/admin";
import SettingsManagementClient from "./SettingsManagementClient";

export const metadata = {
  title: "Site Settings | Admin",
  description: "Manage site-wide settings",
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Site Settings</h1>
      <SettingsManagementClient />
    </div>
  );
}
