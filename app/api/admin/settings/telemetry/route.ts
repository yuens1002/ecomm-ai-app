import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const TELEMETRY_KEY = "telemetry_enabled";

const telemetrySettingsSchema = z.object({
  enabled: z.boolean(),
});

export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: TELEMETRY_KEY },
    });

    // Default to enabled (true) if not set
    return NextResponse.json({
      enabled: setting?.value !== "false",
    });
  } catch (err) {
    console.error("Error fetching telemetry settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch telemetry settings" },
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
    const parsed = telemetrySettingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const { enabled } = parsed.data;

    await prisma.siteSettings.upsert({
      where: { key: TELEMETRY_KEY },
      update: { value: String(enabled) },
      create: { key: TELEMETRY_KEY, value: String(enabled) },
    });

    return NextResponse.json({
      message: "Telemetry settings updated successfully",
    });
  } catch (err) {
    console.error("Error updating telemetry settings:", err);
    return NextResponse.json(
      { error: "Failed to update telemetry settings" },
      { status: 500 }
    );
  }
}
