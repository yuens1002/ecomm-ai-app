import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

/**
 * Reseed the about page with default blocks
 * POST /api/admin/pages/about/reseed
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Find the about page
    const aboutPage = await prisma.page.findUnique({
      where: { slug: "about" },
    });

    if (!aboutPage) {
      return NextResponse.json(
        { error: "About page not found" },
        { status: 404 }
      );
    }

    // Get all existing blocks to extract image URLs
    const existingBlocks = await prisma.block.findMany({
      where: { pageId: aboutPage.id },
    });

    // Extract all image URLs from blocks
    const imageUrls: string[] = [];
    for (const block of existingBlocks) {
      const content = block.content as Record<string, unknown>;

      // Hero block image
      if (block.type === "hero" && content.imageUrl) {
        const imageUrl = content.imageUrl as string;
        if (imageUrl.startsWith("/")) {
          imageUrls.push(imageUrl);
        }
      }
    }

    // Delete image files from disk (best effort - files may already be deleted)
    const publicDir = join(process.cwd(), "public");
    for (const imageUrl of imageUrls) {
      try {
        const filePath = join(publicDir, imageUrl);
        await unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
      } catch (error: unknown) {
        // Only warn for unexpected errors, not "file not found"
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code: string }).code !== "ENOENT"
        ) {
          console.warn(`Could not delete image ${imageUrl}:`, error);
        }
      }
    }

    // Delete all existing blocks for the about page
    await prisma.block.deleteMany({
      where: { pageId: aboutPage.id },
    });

    // Create default blocks for the About page (two-column layout)
    // Required: hero, stat (min 3), pullQuote, richText
    await prisma.block.createMany({
      data: [
        {
          pageId: aboutPage.id,
          type: "hero",
          order: 0,
          isDeleted: false,
          content: {
            title: "Our Story",
            imageUrl:
              "https://placehold.co/1200x600/8B4513/FFF?text=Artisan+Coffee+Roastery",
            imageAlt: "Artisan Coffee Roastery interior",
            caption: "Crafting exceptional coffee since day one",
          },
        },
        {
          pageId: aboutPage.id,
          type: "stat",
          order: 1,
          isDeleted: false,
          content: {
            label: "Year Founded",
            value: "2015",
            emoji: "📅",
          },
        },
        {
          pageId: aboutPage.id,
          type: "stat",
          order: 2,
          isDeleted: false,
          content: {
            label: "Origin Countries",
            value: "12+",
            emoji: "🌍",
          },
        },
        {
          pageId: aboutPage.id,
          type: "stat",
          order: 3,
          isDeleted: false,
          content: {
            label: "Beans Roasted Weekly",
            value: "500 lbs",
            emoji: "☕",
          },
        },
        {
          pageId: aboutPage.id,
          type: "pullQuote",
          order: 4,
          isDeleted: false,
          content: {
            text: "Every cup tells a story — from the farmer who grew it to the hands that crafted it.",
            author: "The Artisan Roast Team",
          },
        },
        {
          pageId: aboutPage.id,
          type: "richText",
          order: 5,
          isDeleted: false,
          content: {
            html: `<h2>The Beginning</h2>
<p>What started as a passion project in a small garage has grown into something we're incredibly proud of. Our journey began with a simple belief: that great coffee should be accessible to everyone, and that the story behind each bean matters as much as its flavor.</p>

<h2>Our Philosophy</h2>
<p>We source our beans directly from farmers who share our commitment to quality and sustainability. Every batch is roasted with care, bringing out the unique characteristics of each origin. We believe in transparency — from farm to cup, we want you to know exactly where your coffee comes from.</p>

<h2>Join Our Community</h2>
<p>Whether you're a seasoned coffee connoisseur or just beginning your specialty coffee journey, we're here to guide you. Visit our café, explore our offerings, or reach out — we love connecting with fellow coffee enthusiasts.</p>`,
          },
        },
      ],
    });

    // Update the page metadata
    await prisma.page.update({
      where: { id: aboutPage.id },
      data: {
        title: "About Us",
        metaDescription:
          "Learn about our specialty coffee roastery, our values, and our commitment to quality.",
        isPublished: false,
        showInFooter: true,
        footerOrder: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "About page reseeded successfully",
      blocksCreated: 6,
    });
  } catch (error) {
    console.error("Error reseeding about page:", error);
    return NextResponse.json(
      { error: "Failed to reseed about page" },
      { status: 500 }
    );
  }
}
