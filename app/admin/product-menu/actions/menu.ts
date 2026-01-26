"use server";

import { prisma } from "@/lib/prisma";
import { getProductMenuSettings } from "@/lib/product-menu-settings";
import { productMenuDataSchema } from "../types/menu";
import { listCategoryLabelsWithCategories } from "@/app/admin/product-menu/data/labels";

export async function listMenuData() {
  try {
    const [labels, categoriesRaw, productsRaw, settings] = await Promise.all([
      listCategoryLabelsWithCategories(),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: true } },
          labels: { orderBy: { order: "asc" }, include: { label: true } },
        },
      }),
      prisma.product.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          isDisabled: true,
          createdAt: true,
          categories: {
            select: {
              categoryId: true,
              order: true,
              createdAt: true, // When product was attached to category
            },
          },
        },
      }),
      getProductMenuSettings(), // { icon, text } with defaults
    ]);

    const products = productsRaw.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      isDisabled: product.isDisabled,
      createdAt: product.createdAt,
      categoryIds: product.categories.map((c) => c.categoryId),
      categoryOrders: product.categories.map((c) => ({
        categoryId: c.categoryId,
        order: c.order,
        attachedAt: c.createdAt, // When product was attached to this category
      })),
    }));

    const categories = categoriesRaw.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
      isVisible: category.isVisible,
      productCount: category._count.products,
      createdAt: category.createdAt ?? new Date(), // Fallback for pre-migration data
      labels: category.labels.map((entry) => ({
        id: entry.label.id,
        name: entry.label.name,
        icon: entry.label.icon,
        order: entry.order,
      })),
    }));

    const dto = { labels, categories, products, settings };
    const parsed = productMenuDataSchema.safeParse(dto);
    if (!parsed.success) {
      console.error("Invalid ProductMenuData DTO:", parsed.error);
      return { ok: false as const, error: "Invalid server payload" };
    }

    return { ok: true as const, data: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load menu data";
    return { ok: false as const, error: message };
  }
}
