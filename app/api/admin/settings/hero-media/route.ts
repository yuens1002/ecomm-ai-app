import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const heroSlideSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
});

const heroMediaSchema = z.object({
  homepageHeroEnabled: z.boolean(),
  homepageHeroType: z.enum(["image", "carousel", "video"]),
  homepageHeroSlides: z.array(heroSlideSchema),
  homepageHeroVideoUrl: z.string(),
  homepageHeroVideoPosterUrl: z.string(),
  homepageHeroHeading: z.string().max(120),
  homepageHeroTagline: z.string().max(200),
});

const KEYS = {
  enabled: "homepage_hero_enabled",
  type: "homepage_hero_type",
  slides: "homepage_hero_slides",
  videoUrl: "homepage_hero_video_url",
  videoPosterUrl: "homepage_hero_video_poster_url",
  heading: "homepage_hero_heading",
  tagline: "homepage_hero_tagline",
} as const;

export async function GET() {
  const authResult = await requireAdminApi();
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: Object.values(KEYS) } },
      select: { key: true, value: true },
    });

    const record = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    let slides: z.infer<typeof heroSlideSchema>[] = [];
    try {
      slides = JSON.parse(record[KEYS.slides] || "[]");
    } catch {
      slides = [];
    }

    return NextResponse.json({
      homepageHeroEnabled: record[KEYS.enabled] !== "false",
      homepageHeroType: (record[KEYS.type] as "image" | "carousel" | "video") || "image",
      homepageHeroSlides: slides,
      homepageHeroVideoUrl: record[KEYS.videoUrl] || "",
      homepageHeroVideoPosterUrl: record[KEYS.videoPosterUrl] || "",
      homepageHeroHeading: record[KEYS.heading] || "",
      homepageHeroTagline: record[KEYS.tagline] || "",
    });
  } catch (error) {
    console.error("Failed to fetch hero media settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApi();
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = heroMediaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 400 }
      );
    }

    const {
      homepageHeroEnabled,
      homepageHeroType,
      homepageHeroSlides,
      homepageHeroVideoUrl,
      homepageHeroVideoPosterUrl,
      homepageHeroHeading,
      homepageHeroTagline,
    } = parsed.data;

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: KEYS.enabled },
        update: { value: String(homepageHeroEnabled) },
        create: { key: KEYS.enabled, value: String(homepageHeroEnabled) },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.type },
        update: { value: homepageHeroType },
        create: { key: KEYS.type, value: homepageHeroType },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.slides },
        update: { value: JSON.stringify(homepageHeroSlides) },
        create: { key: KEYS.slides, value: JSON.stringify(homepageHeroSlides) },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.videoUrl },
        update: { value: homepageHeroVideoUrl },
        create: { key: KEYS.videoUrl, value: homepageHeroVideoUrl },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.videoPosterUrl },
        update: { value: homepageHeroVideoPosterUrl },
        create: { key: KEYS.videoPosterUrl, value: homepageHeroVideoPosterUrl },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.heading },
        update: { value: homepageHeroHeading },
        create: { key: KEYS.heading, value: homepageHeroHeading },
      }),
      prisma.siteSettings.upsert({
        where: { key: KEYS.tagline },
        update: { value: homepageHeroTagline },
        create: { key: KEYS.tagline, value: homepageHeroTagline },
      }),
    ]);

    return NextResponse.json({
      homepageHeroEnabled,
      homepageHeroType,
      homepageHeroSlides,
      homepageHeroVideoUrl,
      homepageHeroVideoPosterUrl,
      homepageHeroHeading,
      homepageHeroTagline,
    });
  } catch (error) {
    console.error("Failed to update hero media settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
