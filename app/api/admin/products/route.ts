import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/products - List all products
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        roastLevel: true,
        stockQuantity: false, // Not on product model directly, it's on variants
        variants: {
          select: {
            stockQuantity: true,
            priceInCents: false, // Price is on PurchaseOption
            purchaseOptions: {
              select: {
                priceInCents: true,
              },
              take: 1,
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
    const formattedProducts = (products as any).map((p: any) => {
      const totalStock = p.variants.reduce(
        (acc: any, v: any) => acc + v.stockQuantity,
        0
      );
      const basePrice = p.variants[0]?.purchaseOptions[0]?.priceInCents || 0;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        roastLevel: p.roastLevel,
        stock: totalStock,
        price: basePrice,
        categories: p.categories.map((c: any) => c.category.name).join(", "),
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
      roastLevel,
      isOrganic,
      isFeatured,
      categoryIds,
    } = body;

    // Transaction to create product and categories
    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          roastLevel,
          isOrganic,
          isFeatured,
        },
      });

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
