import { NextResponse } from "next/server";
import { Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { getWeightUnit } from "@/lib/config/app-settings";
import { WeightUnitOption, fromGrams, roundToInt } from "@/lib/weight-unit";
import { productCreateSchema } from "@/lib/validations/product";

// GET /api/admin/products/[id] - Get a single product
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        variants: {
          orderBy: { order: "asc" },
          include: {
            purchaseOptions: true,
          },
        },
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentUnit = await getWeightUnit();

    // Transform for form
    const formattedProduct = {
      ...product,
      categoryIds: product.categories.map((c) => c.categoryId),
      variants: product.variants.map((variant) => ({
        ...variant,
        weight:
          variant.weight === null
            ? null
            : roundToInt(
                fromGrams(variant.weight, currentUnit as WeightUnitOption)
              ),
      })),
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update a product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate with Zod
    const validation = productCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const {
      name,
      slug,
      description,
      isOrganic,
      isFeatured,
      isDisabled,
      categoryIds,
      images,
      productType,
      roastLevel,
      origin,
      variety,
      altitude,
      tastingNotes,
    } = data;

    const isCoffee = productType === ProductType.COFFEE;
    const isMerch = productType === ProductType.MERCH;
    const rawDetails = isMerch && "details" in data ? data.details : undefined;
    const details = rawDetails === undefined
      ? undefined
      : rawDetails
        ? rawDetails
        : Prisma.JsonNull;

    // Transaction to update product and categories
    const product = await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description: description || null,
          isOrganic,
          isFeatured,
          isDisabled,
          type: productType,
          roastLevel: isCoffee ? roastLevel : null,
          origin: isCoffee ? origin : [],
          tastingNotes: isCoffee ? tastingNotes : [],
          variety: isCoffee ? variety || null : null,
          altitude: isCoffee ? altitude || null : null,
          details: isMerch ? (details ?? undefined) : undefined,
        },
      });

      // 2. Update Images (replace all images if provided, including empty array to delete all)
      if (images !== undefined) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        // Create new images if any
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, index) => ({
              productId: id,
              url: img.url,
              altText: img.alt || name,
              order: index,
            })),
          });
        }
      }

      // 3. Update categories
      // First, remove all existing connections
      await tx.categoriesOnProducts.deleteMany({
        where: { productId: id },
      });

      // Then create new connections
      if (categoryIds && categoryIds.length > 0) {
        await tx.categoriesOnProducts.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
            isPrimary: false, // Default for now
          })),
        });
      }

      return updatedProduct;
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete a product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    // Delete product (cascade will handle related records like variants, images, etc.)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
