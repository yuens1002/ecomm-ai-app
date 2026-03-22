import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAnyAdmin } from "@/lib/admin";

/**
 * POST /api/admin/setup/eula
 * Persists EULA acceptance to SiteSettings during first-time setup.
 * Returns 403 if an admin already exists (setup already complete).
 *
 * Dev exception: when SETUP_PREVIEW=true and an admin already exists, returns
 * 200 without persisting — allows walking the setup UI without wiping your dev admin.
 *
 * Body: { versions: Record<string, string>; acceptedAt: string }
 */
export async function POST(req: NextRequest) {
  try {
    const adminExists = await hasAnyAdmin();

    // Dev-only: bypass EULA persistence when SETUP_PREVIEW=true and an admin already
    // exists — lets you walk the full setup flow without wiping your dev admin.
    // On a fresh DB (no admin yet), fall through to normal persistence.
    if (process.env.NODE_ENV === "development" && process.env.SETUP_PREVIEW === "true" && adminExists) {
      return NextResponse.json({ ok: true });
    }

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
