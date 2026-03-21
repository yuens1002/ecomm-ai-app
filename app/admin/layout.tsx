import { hasAnyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AdminShell } from "@/app/admin/_components/dashboard";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering — auth and setup checks must never be prerendered/cached.
// Without this, routes like /admin/orders and /admin/settings (which have "use client"
// page components with no server-side auth call) can serve a stale prerendered redirect
// to /setup from build time when the DB was empty.
export const dynamic = "force-dynamic";

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

  // Fetch site settings for branding
  const siteSettingsData = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: ["store_name", "store_logo_url"],
      },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const siteSettings = siteSettingsData.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const storeName = siteSettings["store_name"] || "Admin Dashboard";
  const storeLogoUrl = siteSettings["store_logo_url"] || "";

  // Fetch active social links
  const socialLinks = await prisma.socialLink.findMany({
    where: { isActive: true },
    select: {
      platform: true,
      url: true,
      icon: true,
      customIconUrl: true,
      useCustomIcon: true,
    },
    orderBy: { order: "asc" },
  });

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      storeName={storeName}
      storeLogoUrl={storeLogoUrl}
      socialLinks={socialLinks}
    >
      {children}
    </AdminShell>
  );
}
