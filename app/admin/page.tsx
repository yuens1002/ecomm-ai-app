import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard | Artisan Roast",
  description: "Manage users, orders, and site settings",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Fetch admin user data
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
    redirect("/");
  }

  // Fetch dashboard stats
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    adminCount,
    newsletterTotal,
    newsletterActive,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);

  return (
    <AdminDashboardClient
      user={user}
      stats={{
        totalUsers,
        totalOrders,
        totalProducts,
        adminCount,
        newsletterTotal,
        newsletterActive,
        newsletterInactive: newsletterTotal - newsletterActive,
      }}
    />
  );
}
