import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Product-menu admin category data access.
 *
 * A thin DB access layer ("repository") shared by server actions and admin API routes.
 */

export type CategoryListOrder = "name-asc" | "menu-builder-newest-first";

const categoryInclude = {
  _count: { select: { products: true } },
  labels: { orderBy: { order: "asc" }, include: { label: true } },
} satisfies Prisma.CategoryInclude;

function mapCategory(category: Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>) {
  return {
    ...category,
    labels: category.labels.map((entry) => ({
      id: entry.label.id,
      name: entry.label.name,
      icon: entry.label.icon,
      order: entry.order,
    })),
  };
}

function getOrderBy(order: CategoryListOrder): Prisma.CategoryOrderByWithRelationInput[] {
  switch (order) {
    case "name-asc":
      return [{ name: "asc" }];
    case "menu-builder-newest-first":
      // Category has no createdAt; use order desc and id desc as a stable tiebreaker.
      return [{ order: "desc" }, { id: "desc" }];
  }
}

export async function listCategoriesAndLabels(order: CategoryListOrder) {
  const [categories, labels] = await Promise.all([
    prisma.category.findMany({
      orderBy: getOrderBy(order),
      include: categoryInclude,
    }),
    prisma.categoryLabel.findMany({ orderBy: { order: "asc" } }),
  ]);

  return {
    categories: categories.map(mapCategory),
    labels,
  };
}

export async function createCategoryWithLabels(input: {
  name: string;
  slug: string;
  labelIds?: string[];
}) {
  const { name, slug, labelIds = [] } = input;

  const maxOrder = await prisma.category.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (maxOrder?.order ?? -1) + 1;

  const category = await prisma.category.create({
    data: { name, slug, order: nextOrder },
  });

  if (Array.isArray(labelIds) && labelIds.length > 0) {
    await prisma.categoryLabelCategory.createMany({
      data: labelIds.map((labelId, idx) => ({
        labelId,
        categoryId: category.id,
        order: idx,
      })),
    });
  }

  const fresh = await prisma.category.findUnique({
    where: { id: category.id },
    include: categoryInclude,
  });

  if (!fresh) {
    throw new Error("Failed to load created category");
  }

  return mapCategory(fresh);
}

export async function updateCategoryWithLabels(input: {
  id: string;
  name?: string;
  slug?: string;
  labelIds?: string[];
  isVisible?: boolean;
}) {
  const { id, name, slug, labelIds, isVisible } = input;

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (slug) updates.slug = slug;
  if (isVisible !== undefined) updates.isVisible = isVisible;

  await prisma.category.update({
    where: { id },
    data: updates,
  });

  if (Array.isArray(labelIds)) {
    await prisma.categoryLabelCategory.deleteMany({ where: { categoryId: id } });

    if (labelIds.length > 0) {
      await prisma.categoryLabelCategory.createMany({
        data: labelIds.map((labelId, idx) => ({
          labelId,
          categoryId: id,
          order: idx,
        })),
      });
    }
  }

  const fresh = await prisma.category.findUnique({
    where: { id },
    include: categoryInclude,
  });

  if (!fresh) {
    throw new Error("Category not found");
  }

  return mapCategory(fresh);
}

export async function deleteCategoryWithRelations(id: string) {
  await prisma.$transaction([
    prisma.categoryLabelCategory.deleteMany({ where: { categoryId: id } }),
    prisma.categoriesOnProducts.deleteMany({ where: { categoryId: id } }),
    prisma.category.delete({ where: { id } }),
  ]);

  return { id };
}
