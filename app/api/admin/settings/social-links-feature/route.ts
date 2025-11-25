import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const DEFAULTS = {
  heading: "Stay Connected",
  description: "",
};

const socialLinksSettingsSchema = z.object({
  enabled: z.boolean(),
  heading: z.string().min(3).max(120),
  description: z.string().max(280).optional(),
});

export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            "social_links_enabled",
            "social_links_heading",
            "social_links_description",
          ],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    const map = settings.reduce<Record<string, string>>((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json({
      enabled: map["social_links_enabled"] === "true",
      heading: map["social_links_heading"] || DEFAULTS.heading,
      description: map["social_links_description"] || DEFAULTS.description,
    });
  } catch (err) {
    console.error("Error fetching social links settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch social links settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = socialLinksSettingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const { enabled, heading, description } = parsed.data;

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "social_links_enabled" },
        update: { value: String(enabled) },
        create: { key: "social_links_enabled", value: String(enabled) },
      }),
      prisma.siteSettings.upsert({
        where: { key: "social_links_heading" },
        update: { value: heading },
        create: { key: "social_links_heading", value: heading },
      }),
      prisma.siteSettings.upsert({
        where: { key: "social_links_description" },
        update: { value: description || "" },
        create: { key: "social_links_description", value: description || "" },
      }),
    ]);

    return NextResponse.json({
      message: "Social links settings updated successfully",
    });
  } catch (err) {
    console.error("Error updating social links settings:", err);
    return NextResponse.json(
      { error: "Failed to update social links settings" },
      { status: 500 }
    );
  }
}
