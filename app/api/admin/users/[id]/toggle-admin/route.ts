import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request: isAdmin must be a boolean" },
        { status: 400 }
      );
    }

    // Prevent admin from revoking their own privileges
    if (!isAdmin && auth.userId === id) {
      return NextResponse.json(
        {
          error: "You cannot revoke your own admin privileges.",
        },
        { status: 403 }
      );
    }

    // If revoking admin, check if this is the last admin
    if (!isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot revoke admin privileges. At least one admin must remain.",
          },
          { status: 400 }
        );
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's admin status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? `${updatedUser.name || updatedUser.email} is now an admin`
        : `Admin privileges revoked for ${updatedUser.name || updatedUser.email}`,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error toggling admin status:", error);

    // Check if it's an authorization error
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }
}
