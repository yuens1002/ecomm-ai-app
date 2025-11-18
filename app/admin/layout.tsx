import { hasAnyAdmin, requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if any admin exists in the system
  const adminExists = await hasAnyAdmin();

  // Redirect to setup if no admin exists
  if (!adminExists) {
    redirect("/setup");
  }

  // Require admin access
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
