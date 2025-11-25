import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unsubscribeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter using token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = unsubscribeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find subscriber by token
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Invalid unsubscribe token" },
        { status: 404 }
      );
    }

    // Check if already unsubscribed
    if (!subscriber.isActive) {
      return NextResponse.json(
        { message: "You are already unsubscribed from our newsletter" },
        { status: 200 }
      );
    }

    // Unsubscribe (set isActive to false, don't delete)
    await prisma.newsletterSubscriber.update({
      where: { unsubscribeToken: token },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: "Successfully unsubscribed from our newsletter" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe. Please try again later." },
      { status: 500 }
    );
  }
}
