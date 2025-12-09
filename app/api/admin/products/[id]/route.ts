import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

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

    // Transform for form
    const formattedProduct = {
      ...product,
      categoryIds: product.categories.map((c) => c.categoryId),
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
    const {
      name,
      slug,
      description,
      isOrganic,
      isFeatured,
      categoryIds,
      imageUrl,
      weightInGrams,
    } = body;

    const weight = Number(weightInGrams);
    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        { error: "Weight is required and must be greater than zero" },
        { status: 400 }
      );
    }

    // Transaction to update product and categories
    const product = await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          isOrganic,
          isFeatured,
          weightInGrams: weight,
        },
      });

      // 2. Update Image (Simple logic: Update first image or create new one)
      if (imageUrl) {
        const existingImages = await tx.productImage.findMany({
          where: { productId: id },
          orderBy: { order: "asc" },
          take: 1,
        });

        if (existingImages.length > 0) {
          await tx.productImage.update({
            where: { id: existingImages[0].id },
            data: { url: imageUrl, altText: name },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId: id,
              url: imageUrl,
              altText: name,
              order: 0,
            },
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
