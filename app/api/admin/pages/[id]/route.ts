import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      slug,
      heroImage,
      content,
      metaDescription,
      showInFooter,
      footerOrder,
      isPublished,
    } = body;

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if slug is changing and if new slug already exists
    if (slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Determine if publishedAt should be updated
    let publishedAt = existingPage.publishedAt;
    if (isPublished && !existingPage.isPublished) {
      // Page is being published for the first time
      publishedAt = new Date();
    } else if (!isPublished) {
      // Page is being unpublished
      publishedAt = null;
    }

    // Update the page
    const page = await prisma.page.update({
      where: { id: params.id },
      data: {
        title,
        slug,
        heroImage: heroImage || null,
        content: content || "",
        metaDescription: metaDescription || null,
        showInFooter: showInFooter || false,
        footerOrder: footerOrder || 0,
        isPublished: isPublished || false,
        publishedAt,
      },
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

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        children: {
          select: { id: true },
        },
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check if page has children
    if (existingPage.children.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete a page with child pages" },
        { status: 400 }
      );
    }

    // Delete the page
    await prisma.page.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
