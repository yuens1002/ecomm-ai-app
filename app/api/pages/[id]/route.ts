import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const {
      isPublished,
      title,
      metaDescription,
      showInHeader,
      showInFooter,
      headerOrder,
      footerOrder,
      icon,
    } = body;

    // Validate if isPublished is provided
    if (isPublished !== undefined && typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished must be a boolean" },
        { status: 400 }
      );
    }

    // Build the update data object dynamically
    const updateData: Record<string, unknown> = {};
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (title !== undefined) updateData.title = title;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription;
    if (showInHeader !== undefined) updateData.showInHeader = showInHeader;
    if (showInFooter !== undefined) updateData.showInFooter = showInFooter;
    if (headerOrder !== undefined) updateData.headerOrder = headerOrder;
    if (footerOrder !== undefined) updateData.footerOrder = footerOrder;
    if (icon !== undefined) updateData.icon = icon;

    const page = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}
