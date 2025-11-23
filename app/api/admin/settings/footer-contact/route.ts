import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/settings/footer-contact
 * Fetch footer contact settings
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['footer_show_hours', 'footer_hours_text', 'footer_show_email', 'footer_email']
        }
      },
      select: {
        key: true,
        value: true,
      },
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      showHours: settingsMap['footer_show_hours'] === 'true',
      hoursText: settingsMap['footer_hours_text'] || 'Mon-Fri 7am-7pm',
      showEmail: settingsMap['footer_show_email'] === 'true',
      email: settingsMap['footer_email'] || 'hello@artisan-roast.com',
    });
  } catch (error) {
    console.error("Error fetching footer contact settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/footer-contact
 * Update footer contact settings
 */
export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { showHours, hoursText, showEmail, email } = body;

    // Update all settings in parallel
    await Promise.all([
      prisma.siteSettings.upsert({
        where: { key: 'footer_show_hours' },
        update: { value: String(showHours) },
        create: { key: 'footer_show_hours', value: String(showHours) },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'footer_hours_text' },
        update: { value: hoursText },
        create: { key: 'footer_hours_text', value: hoursText },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'footer_show_email' },
        update: { value: String(showEmail) },
        create: { key: 'footer_show_email', value: String(showEmail) },
      }),
      prisma.siteSettings.upsert({
        where: { key: 'footer_email' },
        update: { value: email },
        create: { key: 'footer_email', value: email },
      }),
    ]);

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating footer contact settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
