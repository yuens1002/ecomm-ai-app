import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const DEFAULTS = {
  heading: "Stay Connected",
  description:
    "Subscribe to our newsletter for exclusive offers and coffee tips.",
};

const newsletterSettingsSchema = z.object({
  enabled: z.boolean(),
  heading: z.string().min(3).max(120),
  description: z.string().min(10).max(280),
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
            "newsletter_enabled",
            "newsletter_heading",
            "newsletter_description",
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
      enabled: map["newsletter_enabled"] !== "false",
      heading: map["newsletter_heading"] || DEFAULTS.heading,
      description: map["newsletter_description"] || DEFAULTS.description,
    });
  } catch (err) {
    console.error("Error fetching newsletter settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch newsletter settings" },
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
    const parsed = newsletterSettingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const { enabled, heading, description } = parsed.data;

    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: "newsletter_enabled" },
        update: { value: String(enabled) },
        create: { key: "newsletter_enabled", value: String(enabled) },
      }),
      prisma.siteSettings.upsert({
        where: { key: "newsletter_heading" },
        update: { value: heading },
        create: { key: "newsletter_heading", value: heading },
      }),
      prisma.siteSettings.upsert({
        where: { key: "newsletter_description" },
        update: { value: description },
        create: { key: "newsletter_description", value: description },
      }),
    ]);

    return NextResponse.json({
      message: "Newsletter settings updated successfully",
    });
  } catch (err) {
    console.error("Error updating newsletter settings:", err);
    return NextResponse.json(
      { error: "Failed to update newsletter settings" },
      { status: 500 }
    );
  }
}
