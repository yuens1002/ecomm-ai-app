import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
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
      parentId,
      generatedBy,
      generationPrompt,
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 400 }
      );
    }

    // Create the page
    const page = await prisma.page.create({
      data: {
        title,
        slug,
        heroImage: heroImage || null,
        content: content || "",
        metaDescription: metaDescription || null,
        showInFooter: showInFooter || false,
        footerOrder: footerOrder || 0,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        parentId: parentId || null,
        generatedBy: generatedBy || "manual",
        generationPrompt: generationPrompt || null,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
