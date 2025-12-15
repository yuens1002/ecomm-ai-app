import { requireAdmin, getCurrentAdminUserId } from "@/lib/admin";
import { Metadata } from "next";
import UserManagementClient from "./UserManagementClient";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata: Metadata = {
  title: "User Management - Admin",
  description: "Manage user accounts and admin privileges",
};

export default async function UserManagementPage() {
  // Verify admin access (will redirect if not admin)
  await requireAdmin();

  // Get current admin user ID to prevent self-revocation
  const currentUserId = await getCurrentAdminUserId();

  return (
    <>
      <PageTitle
        title="User Management"
        subtitle="Manage user accounts and admin privileges"
      />

      <UserManagementClient currentUserId={currentUserId || undefined} />
    </>
  );
}
