import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user/account
 * Delete user account permanently
 *
 * Educational Notes:
 * - GDPR/CCPA compliance: users have right to delete their data
 * - Orders are anonymized (user relation removed) but kept for records
 * - All personal data (addresses, sessions, accounts) is deleted
 * - Consider data retention policies for legal/financial requirements
 * - This is a cascading delete operation
 */
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user account
    // This will cascade delete:
    // - Sessions (via onDelete: Cascade in schema)
    // - Accounts (OAuth providers, via onDelete: Cascade)
    // - Addresses (via onDelete: Cascade)
    // Orders will be preserved but user relation will be set to null
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
