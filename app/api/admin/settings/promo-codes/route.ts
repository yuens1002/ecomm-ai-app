import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getAllowPromoCodes,
  setAllowPromoCodes,
} from "@/lib/config/app-settings";

export async function GET() {
  try {
    await requireAdmin();
    const enabled = await getAllowPromoCodes();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error("Error fetching promo codes setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch promo codes setting" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { enabled } = body as { enabled?: boolean };

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid value for enabled" },
        { status: 400 }
      );
    }

    await setAllowPromoCodes(enabled);
    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("Error updating promo codes setting:", error);
    return NextResponse.json(
      { error: "Failed to update promo codes setting" },
      { status: 500 }
    );
  }
}
