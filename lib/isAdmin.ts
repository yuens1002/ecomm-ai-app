import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if the current user is an admin
 * Returns true if user is authenticated and has isAdmin: true
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

  return user?.isAdmin ?? false;
}

/**
 * Require admin access - throws if user is not admin
 * Use this in API routes or server components
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
}
