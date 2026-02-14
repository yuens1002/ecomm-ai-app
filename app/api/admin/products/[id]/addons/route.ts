import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";

const postSchema = z.object({
  addOnProductId: z.string().min(1, "Add-on product ID is required"),
});

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

    // Get all add-on links for this product
    const addOnLinks = await prisma.addOnLink.findMany({
      where: { primaryProductId: id },
      select: {
        id: true,
        addOnProductId: true,
        addOnVariantId: true,
        discountType: true,
        discountValue: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get unique add-on product IDs
    const addOnProductIds = [
      ...new Set(addOnLinks.map((l) => l.addOnProductId)),
    ];

    // Fetch all add-on products with their variants and ONE_TIME prices
    const addOnProducts = await prisma.product.findMany({
      where: { id: { in: addOnProductIds } },
      select: {
        id: true,
        name: true,
        type: true,
        variants: {
          select: {
            id: true,
            name: true,
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              where: { type: "ONE_TIME" },
              select: {
                id: true,
                priceInCents: true,
                salePriceInCents: true,
                type: true,
              },
              take: 1,
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Build grouped response: one entry per add-on product
    const productMap = new Map(addOnProducts.map((p) => [p.id, p]));
    const grouped = addOnProductIds.map((productId) => {
      const product = productMap.get(productId)!;
      const links = addOnLinks.filter((l) => l.addOnProductId === productId);
      return {
        addOnProduct: {
          id: product.id,
          name: product.name,
          type: product.type,
        },
        variants: product.variants,
        selections: links.map((l) => ({
          id: l.id,
          addOnVariantId: l.addOnVariantId,
          discountType: l.discountType,
          discountValue: l.discountValue,
        })),
      };
    });

    return NextResponse.json({ addOns: grouped });
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

    const validation = postSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { addOnProductId } = validation.data;

    // Validate both products exist
    const [primaryProduct, addOnProduct] = await Promise.all([
      prisma.product.findUnique({ where: { id: primaryProductId } }),
      prisma.product.findUnique({
        where: { id: addOnProductId },
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              weight: true,
              stockQuantity: true,
              purchaseOptions: {
                where: { type: "ONE_TIME" },
                select: {
                  id: true,
                  priceInCents: true,
                  salePriceInCents: true,
                  type: true,
                },
                take: 1,
              },
            },
            orderBy: { order: "asc" },
          },
        },
      }),
    ]);

    if (!primaryProduct) {
      return NextResponse.json(
        { error: "Primary product not found" },
        { status: 404 }
      );
    }

    if (!addOnProduct) {
      return NextResponse.json(
        { error: "Add-on product not found" },
        { status: 404 }
      );
    }

    // Check if any link already exists for this product combo
    const existing = await prisma.addOnLink.findFirst({
      where: { primaryProductId, addOnProductId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This product is already added as an add-on" },
        { status: 400 }
      );
    }

    // Create a single row with addOnVariantId=null (means "all variants")
    const link = await prisma.addOnLink.create({
      data: {
        primaryProductId,
        addOnProductId,
        addOnVariantId: null,
      },
    });

    return NextResponse.json(
      {
        addOn: {
          addOnProduct: {
            id: addOnProduct.id,
            name: addOnProduct.name,
            type: addOnProduct.type,
          },
          variants: addOnProduct.variants,
          selections: [
            {
              id: link.id,
              addOnVariantId: null,
              discountType: null,
              discountValue: null,
            },
          ],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating add-on:", error);
    return NextResponse.json(
      { error: "Failed to create add-on" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id: primaryProductId } = await params;
    const { searchParams } = new URL(request.url);
    const addOnProductId = searchParams.get("addOnProductId");

    if (!addOnProductId) {
      return NextResponse.json(
        { error: "addOnProductId query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.addOnLink.deleteMany({
      where: { primaryProductId, addOnProductId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return NextResponse.json(
      { error: "Failed to delete add-on" },
      { status: 500 }
    );
  }
}
