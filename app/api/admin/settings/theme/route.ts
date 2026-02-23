import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getStorefrontTheme,
  setStorefrontTheme,
} from "@/lib/config/app-settings";

export async function GET() {
  try {
    await requireAdmin();
    const theme = await getStorefrontTheme();
    return NextResponse.json({ theme });
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { theme } = body as { theme?: string | null };

    await setStorefrontTheme(theme ?? null);
    return NextResponse.json({ success: true, theme: theme ?? null });
  } catch (error) {
    console.error("Error updating theme:", error);
    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
