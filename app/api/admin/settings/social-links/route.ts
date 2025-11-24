import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/settings/social-links
 * Fetch all social links
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const links = await prisma.socialLink.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("Error fetching social links:", error);
    return NextResponse.json(
      { error: "Failed to fetch social links" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/social-links
 * Update individual social link or bulk update
 */
export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { links } = body;

    if (!Array.isArray(links)) {
      return NextResponse.json(
        { error: "Invalid request: links must be an array" },
        { status: 400 }
      );
    }

    // Check for duplicate platforms in the request
    const platforms = links.map((l) => l.platform.toLowerCase());
    const duplicates = platforms.filter(
      (item, index) => platforms.indexOf(item) !== index
    );
    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: `Duplicate platform name: ${duplicates[0]}` },
        { status: 400 }
      );
    }

    // For single link updates, check uniqueness against existing records
    if (links.length === 1) {
      const link = links[0];
      const existing = await prisma.socialLink.findFirst({
        where: {
          platform: link.platform,
          NOT: { id: link.id.startsWith("temp-") ? undefined : link.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Platform "${link.platform}" already exists` },
          { status: 400 }
        );
      }
    }

    // Separate new links (temp IDs) from existing links
    const newLinks = links.filter((link) => link.id.startsWith("temp-"));
    const updateLinks = links.filter((link) => !link.id.startsWith("temp-"));

    // Perform operations
    const operations = [];

    // Create new links
    for (const link of newLinks) {
      operations.push(
        prisma.socialLink.create({
          data: {
            platform: link.platform,
            url: link.url || "",
            icon: link.icon,
            customIconUrl: link.customIconUrl || null,
            useCustomIcon: link.useCustomIcon || false,
            order: link.order,
            isActive: link.isActive,
          },
        })
      );
    }

    // Update existing links
    for (const link of updateLinks) {
      operations.push(
        prisma.socialLink.update({
          where: { id: link.id },
          data: {
            platform: link.platform,
            url: link.url || "",
            icon: link.icon,
            customIconUrl: link.customIconUrl || null,
            useCustomIcon: link.useCustomIcon || false,
            order: link.order,
            isActive: link.isActive,
          },
        })
      );
    }

    await prisma.$transaction(operations);

    return NextResponse.json({ message: "Social links updated successfully" });
  } catch (error: any) {
    console.error("Error updating social links:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A social link with this platform name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update social links" },
      { status: 500 }
    );
  }
}
