import { NextRequest, NextResponse } from "next/server";
import { WeightUnit } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { getWeightUnit, setWeightUnit } from "@/lib/app-settings";

export async function GET() {
  try {
    await requireAdmin();
    const weightUnit = await getWeightUnit();
    return NextResponse.json({ weightUnit });
  } catch (error) {
    console.error("Error fetching weight unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch weight unit" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { weightUnit } = body as { weightUnit?: WeightUnit };

    if (!weightUnit || !Object.values(WeightUnit).includes(weightUnit)) {
      return NextResponse.json(
        { error: "Invalid weight unit" },
        { status: 400 }
      );
    }

    await setWeightUnit(weightUnit);
    return NextResponse.json({ success: true, weightUnit });
  } catch (error) {
    console.error("Error updating weight unit:", error);
    return NextResponse.json(
      { error: "Failed to update weight unit" },
      { status: 500 }
    );
  }
}
