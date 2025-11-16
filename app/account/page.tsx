import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AccountPageClient from "./AccountPageClient";

export const metadata = {
  title: "Account Settings | Artisan Roast",
  description: "Manage your account settings, profile, and preferences",
};

/**
 * Account Settings Page - Protected Route
 *
 * Server component that:
 * 1. Checks if user is authenticated
 * 2. Fetches user data from database
 * 3. Passes data to client component for interactive UI
 */
export default async function AccountPage() {
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  // Fetch full user data including addresses and connected accounts
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      addresses: {
        orderBy: { isDefault: "desc" }, // Default address first
      },
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return <AccountPageClient user={user} />;
}
