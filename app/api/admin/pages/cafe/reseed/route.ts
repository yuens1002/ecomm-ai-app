import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { LocationType } from "@/lib/location-type";
import { unlink } from "fs/promises";
import { join } from "path";

/**
 * Reseed the cafe page with default blocks based on location type
 * POST /api/admin/pages/cafe/reseed
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { locationType } = body;

    if (!locationType || !Object.values(LocationType).includes(locationType)) {
      return NextResponse.json(
        { error: "Invalid location type" },
        { status: 400 }
      );
    }

    // Find the cafe page
    const cafePage = await prisma.page.findUnique({
      where: { slug: "cafe" },
    });

    if (!cafePage) {
      return NextResponse.json(
        { error: "Cafe page not found" },
        { status: 404 }
      );
    }

    // Get all existing blocks to extract image URLs
    const existingBlocks = await prisma.block.findMany({
      where: { pageId: cafePage.id },
    });

    // Extract all image URLs from blocks
    const imageUrls: string[] = [];
    for (const block of existingBlocks) {
      const content = block.content as Record<string, unknown>;

      // Image carousel slides
      if (block.type === "imageCarousel" && Array.isArray(content.slides)) {
        content.slides.forEach((slide: { url?: string }) => {
          if (slide.url && slide.url.startsWith("/")) {
            imageUrls.push(slide.url);
          }
        });
      }

      // Location carousel slides
      if (block.type === "locationCarousel" && Array.isArray(content.slides)) {
        content.slides.forEach((slide: { url?: string }) => {
          if (slide.url && slide.url.startsWith("/")) {
            imageUrls.push(slide.url);
          }
        });
      }

      // Location block images
      if (block.type === "location" && Array.isArray(content.images)) {
        content.images.forEach((img: { url?: string }) => {
          if (img.url && img.url.startsWith("/")) {
            imageUrls.push(img.url);
          }
        });
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
          error.code !== "ENOENT"
        ) {
          console.warn(`Could not delete image ${imageUrl}:`, error);
        }
      }
    }

    // Delete all existing blocks for the cafe page
    await prisma.block.deleteMany({
      where: { pageId: cafePage.id },
    });

    // Create default blocks based on location type
    if (locationType === LocationType.SINGLE) {
      // SINGLE location: imageCarousel + 1 location + richText
      await prisma.block.createMany({
        data: [
          {
            pageId: cafePage.id,
            type: "imageCarousel",
            order: 0,
            isDeleted: false,
            content: {
              slides: [
                {
                  url: "https://placehold.co/800x600/8B4513/FFF?text=Lounge+Area",
                  alt: "Lounge area",
                },
                {
                  url: "https://placehold.co/800x600/654321/FFF?text=Brewing+Station",
                  alt: "Brewing station",
                },
                {
                  url: "https://placehold.co/800x600/A0522D/FFF?text=Cozy+Interior",
                  alt: "Cozy Interior",
                },
              ],
              autoScroll: true,
              intervalSeconds: 5,
            },
          },
          {
            pageId: cafePage.id,
            type: "richText",
            order: 1,
            isDeleted: false,
            content: {
              html: `<h2>What to Expect</h2>
<p>Our café features freshly roasted beans from our local roastery, expert baristas, and a welcoming atmosphere. Whether you're grabbing a quick espresso or settling in for the afternoon, we're here to fuel your day with exceptional coffee.</p>

<h3>Ordering & Amenities</h3>
<ul>
<li>Order at the counter or use our mobile app for pickup</li>
<li>Free WiFi throughout the café</li>
<li>Oat, almond, and whole milk alternatives available</li>
<li>Loyalty rewards program - earn free drinks</li>
<li>Private event space available for meetings and gatherings</li>
</ul>`,
            },
          },
          {
            pageId: cafePage.id,
            type: "location",
            order: 2,
            isDeleted: false,
            content: {
              name: "Our Cafe",
              address: "123 Main Street\nYour City, ST 12345",
              phone: "(555) 123-4567",
              googleMapsUrl: "https://maps.google.com/?q=123+Main+Street",
              description:
                "Welcome to our specialty coffee café in the heart of downtown. Features a full espresso bar, pour-over station, and rotating single-origin offerings. Free WiFi and plenty of seating for remote work or casual meetings.",
              schedule: [
                { day: "Mon-Fri", hours: "7am - 7pm" },
                { day: "Sat-Sun", hours: "8am - 6pm" },
              ],
              images: [
                {
                  url: "https://placehold.co/600x400/8B4513/FFF?text=Cafe+Interior",
                  alt: "Cafe interior with cozy seating",
                },
              ],
            },
          },
        ],
      });
    } else {
      // MULTI location: locationCarousel + 2 locations + richText
      await prisma.block.createMany({
        data: [
          {
            pageId: cafePage.id,
            type: "locationCarousel",
            order: 0,
            isDeleted: false,
            content: {
              slides: [
                {
                  url: "https://placehold.co/800x600/654321/FFF?text=Downtown+Location",
                  alt: "Downtown location storefront",
                  title: "Downtown",
                  description: "Our flagship location in the heart of the city",
                  locationBlockId: "temp-location-1",
                },
                {
                  url: "https://placehold.co/800x600/8B4513/FFF?text=Uptown+Location",
                  alt: "Uptown location interior",
                  title: "Uptown",
                  description: "Neighborhood spot with a cozy atmosphere",
                  locationBlockId: "temp-location-2",
                },
              ],
              autoScroll: true,
              intervalSeconds: 5,
            },
          },
          {
            pageId: cafePage.id,
            type: "richText",
            order: 1,
            isDeleted: false,
            content: {
              html: `<h2>What to Expect</h2>
<p>Our café features freshly roasted beans from our local roastery, expert baristas, and a welcoming atmosphere. Whether you're grabbing a quick espresso or settling in for the afternoon, we're here to fuel your day with exceptional coffee.</p>

<h3>Ordering & Amenities</h3>
<ul>
<li>Order at the counter or use our mobile app for pickup</li>
<li>Free WiFi throughout the café</li>
<li>Oat, almond, and whole milk alternatives available</li>
<li>Loyalty rewards program - earn free drinks</li>
<li>Private event space available for meetings and gatherings</li>
</ul>`,
            },
          },
          {
            pageId: cafePage.id,
            type: "location",
            order: 2,
            isDeleted: false,
            content: {
              name: "Downtown",
              address: "123 Main Street\nYour City, ST 12345",
              phone: "(555) 123-4567",
              googleMapsUrl: "https://maps.google.com/?q=123+Main+Street",
              description:
                "Our flagship location with ample seating and parking.",
              schedule: [
                { day: "Mon-Fri", hours: "6am - 8pm" },
                { day: "Sat-Sun", hours: "7am - 8pm" },
              ],
              images: [
                {
                  url: "https://placehold.co/600x400/654321/FFF?text=Downtown+Interior",
                  alt: "Downtown location interior",
                },
              ],
            },
          },
          {
            pageId: cafePage.id,
            type: "location",
            order: 3,
            isDeleted: false,
            content: {
              name: "Uptown",
              address: "456 Oak Avenue\nYour City, ST 12345",
              phone: "(555) 987-6543",
              googleMapsUrl: "https://maps.google.com/?q=456+Oak+Avenue",
              description: "Cozy neighborhood location with outdoor seating.",
              schedule: [
                { day: "Mon-Fri", hours: "7am - 7pm" },
                { day: "Sat-Sun", hours: "8am - 6pm" },
              ],
              images: [
                {
                  url: "https://placehold.co/600x400/A0522D/FFF?text=Uptown+Interior",
                  alt: "Uptown location interior",
                },
              ],
            },
          },
        ],
      });

      // Update locationBlockIds in carousel after creating location blocks
      const locationBlocks = await prisma.block.findMany({
        where: {
          pageId: cafePage.id,
          type: "location",
        },
        orderBy: { order: "asc" },
      });

      const carousel = await prisma.block.findFirst({
        where: {
          pageId: cafePage.id,
          type: "locationCarousel",
        },
      });

      if (carousel && locationBlocks.length >= 2) {
        const carouselContent = carousel.content as {
          slides: Array<{ locationBlockId?: string; url: string; alt: string }>;
        };
        carouselContent.slides[0].locationBlockId = locationBlocks[0].id;
        carouselContent.slides[1].locationBlockId = locationBlocks[1].id;

        await prisma.block.update({
          where: { id: carousel.id },
          data: { content: carouselContent },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cafe page reseeded successfully",
    });
  } catch (error) {
    console.error("Error reseeding cafe page:", error);
    return NextResponse.json(
      { error: "Failed to reseed cafe page" },
      { status: 500 }
    );
  }
}
