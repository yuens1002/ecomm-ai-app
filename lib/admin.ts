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
 * Get admin user or throw error
 * Use this in admin-only API routes
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return true;
}
