import { requireAdmin, getCurrentAdminUserId } from "@/lib/admin";
import { Metadata } from "next";
import UserManagementClient from "./UserManagementClient";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts and admin privileges
        </p>
      </div>

      <UserManagementClient currentUserId={currentUserId || undefined} />
    </>
  );
}
