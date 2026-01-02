"use server";

import { prisma } from "@/lib/prisma";
import { getProductMenuSettings } from "@/lib/product-menu-settings";
import { productMenuDataSchema } from "../types/menu";

export async function listMenuData() {
  try {
    const [labelsRaw, categoriesRaw, productsRaw, settings] = await Promise.all(
      [
        prisma.categoryLabel.findMany({
          orderBy: { order: "asc" },
          include: {
            categories: {
              orderBy: { order: "asc" },
              include: { category: true },
            },
          },
        }),
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
            categories: {
              select: {
                categoryId: true,
              },
            },
          },
        }),
        getProductMenuSettings(), // { icon, text } with defaults
      ]
    );

    const labels = labelsRaw.map((label) => ({
      id: label.id,
      name: label.name,
      icon: label.icon,
      order: label.order,
      isVisible: label.isVisible,
      autoOrder: label.autoOrder,
      categories: label.categories.map((entry) => ({
        id: entry.category.id,
        name: entry.category.name,
        slug: entry.category.slug,
        order: entry.order, // assignment order within label
      })),
    }));

    const products = productsRaw.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryIds: product.categories.map((c) => c.categoryId),
    }));

    const categories = categoriesRaw.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
      isVisible: category.isVisible,
      productCount: category._count.products,
      labels: category.labels.map((entry) => ({
        id: entry.label.id,
        name: entry.label.name,
        icon: entry.label.icon,
        order: entry.order,
      })),
    }));

    const dto = { labels, categories, products, settings };
    console.log("[listMenuData] Returning products count:", products.length);
    const parsed = productMenuDataSchema.safeParse(dto);
    if (!parsed.success) {
      console.error("Invalid ProductMenuData DTO:", parsed.error);
      return { ok: false as const, error: "Invalid server payload" };
    }

    return { ok: true as const, data: parsed.data };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load menu data";
    return { ok: false as const, error: message };
  }
}
