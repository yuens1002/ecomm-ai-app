import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/settings/email
 * Fetch email settings
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: "contactEmail" },
      select: { value: true },
    });

    return NextResponse.json({
      contactEmail: setting?.value || "onboarding@resend.dev",
    });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/email
 * Update email settings
 */
export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contactEmail } = body;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    await prisma.siteSettings.upsert({
      where: { key: "contactEmail" },
      update: { value: contactEmail },
      create: { key: "contactEmail", value: contactEmail },
    });

    return NextResponse.json({
      message: "Email settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
