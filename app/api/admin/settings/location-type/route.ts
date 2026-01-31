import { NextRequest, NextResponse } from "next/server";
import { getLocationType, setLocationType } from "@/lib/config/app-settings";
import { LocationType } from "@/lib/location-type";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin();
    const locationType = await getLocationType();
    return NextResponse.json({ locationType });
  } catch (error) {
    console.error("Error fetching location type:", error);
    return NextResponse.json(
      { error: "Failed to fetch location type" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { locationType } = body;

    if (!locationType || !Object.values(LocationType).includes(locationType)) {
      return NextResponse.json(
        { error: "Invalid location type" },
        { status: 400 }
      );
    }

    await setLocationType(locationType);
    return NextResponse.json({ success: true, locationType });
  } catch (error) {
    console.error("Error updating location type:", error);
    return NextResponse.json(
      { error: "Failed to update location type" },
      { status: 500 }
    );
  }
}
