import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAnyAdmin } from "@/lib/admin";

/**
 * POST /api/admin/setup/eula
 * Persists EULA acceptance to SiteSettings during first-time setup.
 * Only callable when no admin account exists (same guard as /api/admin/setup).
 *
 * Body: { versions: Record<string, string>; acceptedAt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const adminExists = await hasAnyAdmin();
    if (adminExists) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
    }

    const body = await req.json();
    const { versions, acceptedAt } = body ?? {};

    if (!versions || typeof versions !== "object" || Array.isArray(versions) || !acceptedAt) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await prisma.siteSettings.upsert({
      where: { key: "eula_accepted" },
      update: { value: JSON.stringify({ versions, acceptedAt }) },
      create: { key: "eula_accepted", value: JSON.stringify({ versions, acceptedAt }) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("EULA setup error:", error);
    return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 });
  }
}
