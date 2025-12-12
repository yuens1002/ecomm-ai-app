import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    const addOns = await prisma.addOnLink.findMany({
      where: { primaryProductId: id },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              select: {
                id: true,
                priceInCents: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ addOns });
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return NextResponse.json(
      { error: "Failed to fetch add-ons" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: primaryProductId } = await params;
    const body = await request.json();
    const { addOnProductId, addOnVariantId, discountedPriceInCents } = body;

    // Validate the product exists
    const product = await prisma.product.findUnique({
      where: { id: primaryProductId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Primary product not found" },
        { status: 404 }
      );
    }

    // Validate add-on product exists
    const addOnProduct = await prisma.product.findUnique({
      where: { id: addOnProductId },
    });

    if (!addOnProduct) {
      return NextResponse.json(
        { error: "Add-on product not found" },
        { status: 404 }
      );
    }

    // Check for duplicate
    const existing = await prisma.addOnLink.findFirst({
      where: {
        primaryProductId,
        addOnProductId,
        addOnVariantId: addOnVariantId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This add-on link already exists" },
        { status: 400 }
      );
    }

    // Create the add-on link
    const addOnLink = await prisma.addOnLink.create({
      data: {
        primaryProductId,
        addOnProductId,
        addOnVariantId: addOnVariantId || null,
        discountedPriceInCents: discountedPriceInCents || null,
      },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              select: {
                id: true,
                priceInCents: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ addOn: addOnLink }, { status: 201 });
  } catch (error) {
    console.error("Error creating add-on:", error);
    return NextResponse.json(
      { error: "Failed to create add-on" },
      { status: 500 }
    );
  }
}
