import { NextResponse } from "next/server";
import { ProductType, RoastLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/products - List all products
export async function GET(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type") as ProductType | null;
    const productType =
      typeParam && Object.values(ProductType).includes(typeParam)
        ? typeParam
        : null;

    const products = await prisma.product.findMany({
      where: productType ? { type: productType } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        variants: {
          select: {
            name: true,
            stockQuantity: true,
            purchaseOptions: {
              select: {
                type: true,
                priceInCents: true,
                billingInterval: true,
                billingIntervalCount: true,
              },
              orderBy: {
                priceInCents: "asc",
              },
            },
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform for table display
    const formattedProducts = products.map((p) => {
      const totalStock = p.variants.reduce(
        (acc, v) => acc + v.stockQuantity,
        0
      );
      const basePrice = p.variants[0]?.purchaseOptions[0]?.priceInCents || 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: totalStock,
        price: basePrice,
        variants: p.variants.map((v) => ({
          name: v.name,
          stock: v.stockQuantity,
          options: v.purchaseOptions,
        })),
        categories: p.categories.map((c) => c.category.name).join(", "),
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create a new product
export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      isOrganic,
      isFeatured,
      categoryIds,
      imageUrl,
      weight,
      productType,
      roastLevel,
      origin,
      variety,
      altitude,
      tastingNotes,
    } = body;

    const typeToSave =
      productType && Object.values(ProductType).includes(productType)
        ? productType
        : ProductType.COFFEE;
    const roastLevelToSave =
      roastLevel && Object.values(RoastLevel).includes(roastLevel)
        ? roastLevel
        : undefined;

    const parsedWeight = Number.isFinite(Number(weight))
      ? Number(weight)
      : undefined;
    const hasValidWeight = parsedWeight !== undefined && parsedWeight > 0;

    const isCoffee = typeToSave === ProductType.COFFEE;
    const originList = Array.isArray(origin)
      ? origin
      : typeof origin === "string"
        ? [origin]
        : [];
    const tastingNotesList = Array.isArray(tastingNotes)
      ? tastingNotes
      : typeof tastingNotes === "string"
        ? [tastingNotes]
        : [];

    const shouldValidateCoffee = productType === ProductType.COFFEE;

    if (shouldValidateCoffee) {
      if (!roastLevelToSave) {
        return NextResponse.json(
          { error: "Roast level is required for coffee products" },
          { status: 400 }
        );
      }
      if (originList.length === 0) {
        return NextResponse.json(
          { error: "At least one origin is required for coffee products" },
          { status: 400 }
        );
      }
      if (weight !== undefined && !hasValidWeight) {
        return NextResponse.json(
          { error: "Weight must be greater than zero when provided" },
          { status: 400 }
        );
      }
    }

    if (!isCoffee && !hasValidWeight) {
      return NextResponse.json(
        { error: "Weight is required and must be greater than zero" },
        { status: 400 }
      );
    }

    // Transaction to create product and categories
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          isOrganic,
          isFeatured,
          weight: isCoffee
            ? hasValidWeight
              ? parsedWeight
              : undefined
            : parsedWeight,
          type: typeToSave,
          roastLevel: isCoffee ? (roastLevelToSave ?? RoastLevel.MEDIUM) : null,
          origin: isCoffee ? originList : [],
          variety: isCoffee ? variety || null : null,
          altitude: isCoffee ? altitude || null : null,
          tastingNotes: isCoffee ? tastingNotesList : [],
        },
      });

      if (imageUrl) {
        await tx.productImage.create({
          data: {
            productId: newProduct.id,
            url: imageUrl,
            altText: name,
            order: 0,
          },
        });
      }

      if (categoryIds && categoryIds.length > 0) {
        await tx.categoriesOnProducts.createMany({
          data: categoryIds.map((categoryId: string) => ({
            productId: newProduct.id,
            categoryId,
            isPrimary: false,
          })),
        });
      }

      return newProduct;
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
