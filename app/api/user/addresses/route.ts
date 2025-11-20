import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/addresses
 * Fetch all user's shipping addresses
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch addresses
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Addresses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/addresses
 * Create a new shipping address
 *
 * Educational Notes:
 * - First address is automatically set as default
 * - Addresses are linked to user account
 * - Used for checkout and order fulfillment
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { street, city, state, postalCode, country } = await request.json();

    // Validate required fields
    if (!street || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: "All address fields are required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this is user's first address
    const addressCount = await prisma.address.count({
      where: { userId: user.id },
    });

    // Create address (first one is automatically default)
    await prisma.address.create({
      data: {
        street,
        city,
        state,
        postalCode,
        country,
        isDefault: addressCount === 0,
        userId: user.id,
      },
    });

    // Fetch updated addresses
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Address creation error:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}
