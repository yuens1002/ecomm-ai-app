import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Product-menu admin label data access.
 *
 * Shared by server actions and admin API routes.
 */

const labelInclude = {
  categories: {
    orderBy: { order: "asc" },
    select: {
      order: true,
      createdAt: true, // Junction table's createdAt (when category was attached to label)
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.CategoryLabelInclude;

export type MenuLabelDto = {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  isVisible: boolean;
  autoOrder: boolean;
  categories: Array<{ id: string; name: string; slug: string; order: number; attachedAt: Date }>;
};

function mapLabel(
  label: Prisma.CategoryLabelGetPayload<{ include: typeof labelInclude }>
): MenuLabelDto {
  return {
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
      order: entry.order,
      attachedAt: entry.createdAt,
    })),
  };
}

export async function listCategoryLabelsWithCategories(): Promise<MenuLabelDto[]> {
  const labels = await prisma.categoryLabel.findMany({
    orderBy: { order: "asc" },
    include: labelInclude,
  });

  return labels.map(mapLabel);
}

async function insertLabelOrder(afterLabelId?: string | null): Promise<number> {
  if (!afterLabelId) {
    // Insert at top (order 0)
    await prisma.categoryLabel.updateMany({ data: { order: { increment: 1 } } });
    return 0;
  }

  const after = await prisma.categoryLabel.findUnique({ where: { id: afterLabelId } });
  const afterOrder = after?.order ?? 0;

  await prisma.categoryLabel.updateMany({
    where: { order: { gte: afterOrder + 1 } },
    data: { order: { increment: 1 } },
  });

  return afterOrder + 1;
}

export async function createCategoryLabel(input: {
  name: string;
  icon?: string | null;
  afterLabelId?: string | null;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  // Ensure uniqueness on name
  const existing = await prisma.categoryLabel.findUnique({ where: { name } });
  if (existing) throw new Error("Label name must be unique");

  const order = await insertLabelOrder(input.afterLabelId ?? null);

  return prisma.categoryLabel.create({
    data: {
      name,
      icon: input.icon || null,
      order,
    },
  });
}

export async function updateCategoryLabel(input: {
  id: string;
  name?: string;
  icon?: string | null;
  isVisible?: boolean;
  autoOrder?: boolean;
}) {
  const nextName = input.name === undefined ? undefined : input.name.trim();
  if (nextName !== undefined && !nextName) throw new Error("Name cannot be empty");

  if (nextName) {
    const dup = await prisma.categoryLabel.findFirst({
      where: { name: nextName, id: { not: input.id } },
    });
    if (dup) throw new Error("Label name must be unique");
  }

  return prisma.categoryLabel.update({
    where: { id: input.id },
    data: {
      ...(nextName ? { name: nextName } : {}),
      icon: input.icon === undefined ? undefined : input.icon || null,
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
      ...(input.autoOrder !== undefined ? { autoOrder: input.autoOrder } : {}),
    },
  });
}

export async function deleteCategoryLabel(id: string) {
  await prisma.$transaction(async (tx) => {
    await tx.categoryLabelCategory.deleteMany({ where: { labelId: id } });
    await tx.categoryLabel.delete({ where: { id } });
  });

  return { id };
}

export async function reorderCategoryLabels(labelIds: string[]) {
  await prisma.$transaction(
    labelIds.map((id, idx) =>
      prisma.categoryLabel.update({
        where: { id },
        data: { order: idx },
      })
    )
  );

  return { ok: true };
}

export async function attachCategoryToLabel(input: { labelId: string; categoryId: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.categoryLabelCategory.updateMany({
      where: { labelId: input.labelId },
      data: { order: { increment: 1 } },
    });

    await tx.categoryLabelCategory.upsert({
      where: {
        labelId_categoryId: {
          labelId: input.labelId,
          categoryId: input.categoryId,
        },
      },
      update: { order: 0 },
      create: { labelId: input.labelId, categoryId: input.categoryId, order: 0 },
    });
  });

  return { ok: true };
}

export async function detachCategoryFromLabel(input: { labelId: string; categoryId: string }) {
  await prisma.categoryLabelCategory.delete({
    where: {
      labelId_categoryId: {
        labelId: input.labelId,
        categoryId: input.categoryId,
      },
    },
  });

  return { ok: true };
}

export async function reorderCategoriesInLabel(input: { labelId: string; categoryIds: string[] }) {
  await prisma.$transaction(
    input.categoryIds.map((categoryId, idx) =>
      prisma.categoryLabelCategory.update({
        where: {
          labelId_categoryId: {
            labelId: input.labelId,
            categoryId,
          },
        },
        data: { order: idx },
      })
    )
  );

  return { ok: true };
}

export async function autoSortCategoriesInLabel(labelId: string) {
  const entries = await prisma.categoryLabelCategory.findMany({
    where: { labelId },
    include: { category: true },
  });

  const sorted = entries
    .slice()
    .sort((a, b) => a.category.name.localeCompare(b.category.name))
    .map((entry, idx) => ({ categoryId: entry.categoryId, order: idx }));

  await prisma.$transaction(
    sorted.map((item) =>
      prisma.categoryLabelCategory.update({
        where: {
          labelId_categoryId: {
            labelId,
            categoryId: item.categoryId,
          },
        },
        data: { order: item.order },
      })
    )
  );

  return { ok: true };
}
