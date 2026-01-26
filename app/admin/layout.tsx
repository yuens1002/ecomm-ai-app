import { hasAnyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/app-components/AdminSidebar";
import AdminHeader from "@/components/app-components/AdminHeader";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  // Get session and user
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/admin-signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
    },
  });

  if (!user?.isAdmin) {
    redirect("/unauthorized");
  }

  // Fetch all published pages for sidebar navigation
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      showInHeader: true,
      showInFooter: true,
      headerOrder: true,
      footerOrder: true,
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background fixed inset-0">
      {/* Sidebar */}
      <AdminSidebar pages={pages} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <AdminHeader user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-gutter-stable">{children}</main>
      </div>
    </div>
  );
}
