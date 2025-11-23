import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/social-links
 * List all social links (ordered by order field)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const socialLinks = await prisma.socialLink.findMany({
      orderBy: { order: "asc" },
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

/**
 * POST /api/admin/social-links
 * Create a new social link
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { platform, url, icon, order, isActive } = body;

    if (!platform || !url || !icon) {
      return NextResponse.json(
        { error: "Missing required fields: platform, url, icon" },
        { status: 400 }
      );
    }

    const socialLink = await prisma.socialLink.create({
      data: {
        platform,
        url,
        icon,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(socialLink, { status: 201 });
  } catch (error) {
    console.error("Error creating social link:", error);
    return NextResponse.json(
      { error: "Failed to create social link" },
      { status: 500 }
    );
  }
}
