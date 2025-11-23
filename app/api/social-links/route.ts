import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/social-links
 * Get all active social links (public endpoint for footer)
 */
export async function GET() {
  try {
    const socialLinks = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        platform: true,
        url: true,
        icon: true,
      },
    });

    return NextResponse.json(socialLinks);
  } catch (error) {
    console.error("Error fetching social links:", error);
    return NextResponse.json(
      { error: "Failed to fetch social links" },
      { status: 500 }
    );
  }
}
