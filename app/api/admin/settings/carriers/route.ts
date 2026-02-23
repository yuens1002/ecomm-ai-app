import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

const CARRIER_KEYS = [
  "carrier_usps_user_id",
  "carrier_ups_client_id",
  "carrier_ups_client_secret",
  "carrier_fedex_api_key",
  "carrier_fedex_secret_key",
  "carrier_dhl_api_key",
] as const;

function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

/**
 * GET /api/admin/settings/carriers
 * Fetch carrier API key settings (masked for display)
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: [...CARRIER_KEYS] } },
      select: { key: true, value: true },
    });

    const result: Record<string, string> = {};
    for (const key of CARRIER_KEYS) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting ? maskSecret(setting.value) : "";
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching carrier settings:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const carrierSettingsSchema = z.object({
  carrier_usps_user_id: z.string().optional(),
  carrier_ups_client_id: z.string().optional(),
  carrier_ups_client_secret: z.string().optional(),
  carrier_fedex_api_key: z.string().optional(),
  carrier_fedex_secret_key: z.string().optional(),
  carrier_dhl_api_key: z.string().optional(),
});

/**
 * PUT /api/admin/settings/carriers
 * Update carrier API key settings
 */
export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = carrierSettingsSchema.parse(body);

    const upserts = Object.entries(validated)
      .filter(
        ([, value]) => value !== undefined && value !== "" && !value.startsWith("****")
      )
      .map(([key, value]) =>
        prisma.siteSettings.upsert({
          where: { key },
          update: { value: value! },
          create: { key, value: value! },
        })
      );

    await Promise.all(upserts);

    return NextResponse.json({ message: "Carrier settings updated successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid settings data", details: err.issues },
        { status: 400 }
      );
    }
    console.error("Error updating carrier settings:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
