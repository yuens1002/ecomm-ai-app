import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY ENDPOINT - Make yourself admin
 * DELETE THIS FILE after setting admin!
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Update current user to admin
  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { isAdmin: true },
  });

  return NextResponse.json({
    success: true,
    message: `${user.email} is now an admin!`,
  });
}
