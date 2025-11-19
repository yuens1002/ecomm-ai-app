import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, activityType, productId, searchQuery } = body;

    // Validate required fields
    if (!sessionId || !activityType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create activity record
    await prisma.userActivity.create({
      data: {
        sessionId,
        userId: userId || null,
        activityType,
        productId: productId || null,
        searchQuery: searchQuery || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking activity:", error);
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    );
  }
}
