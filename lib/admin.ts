import { auth } from "@/auth";
import { prisma } from "./prisma";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  return user?.isAdmin || false;
}

/**
 * Get current admin user's ID
 * Returns null if not admin or not authenticated
 */
export async function getCurrentAdminUserId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isAdmin: true },
  });

  return user?.isAdmin ? user.id : null;
}

/**
 * Check if any admin exists in the system
 * Used for initial setup detection
 */
export async function hasAnyAdmin(): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: { isAdmin: true },
  });

  return adminCount > 0;
}

/**
 * Get admin user or redirect to unauthorized page
 * Use this in admin-only pages (Server Components)
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    const { redirect } = await import("next/navigation");
    redirect("/unauthorized");
  }

  return true;
}

/**
 * Check admin or return error (for API routes)
 * Use this in API endpoints instead of requireAdmin
 * Returns the current admin's user ID for self-action prevention
 */
export async function requireAdminApi() {
  const userId = await getCurrentAdminUserId();

  if (!userId) {
    return { authorized: false, error: "Unauthorized: Admin access required" };
  }

  return { authorized: true, userId };
}
