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

  // Let Prisma's unique constraint (P2002) handle uniqueness
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

  // Let Prisma's unique constraint (P2002) handle uniqueness
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

/**
 * Batch move multiple categories to a label in a single transaction.
 *
 * All categories are moved atomically - if any fails, all are rolled back.
 * Categories are inserted at the specified position relative to targetCategoryId.
 */
export async function batchMoveCategoriesToLabel(input: {
  moves: Array<{ categoryId: string; fromLabelId: string }>;
  toLabelId: string;
  targetCategoryId: string | null;
  dropPosition: "before" | "after";
}) {
  const { moves, toLabelId, targetCategoryId, dropPosition } = input;

  if (moves.length === 0) return { ok: true };

  await prisma.$transaction(async (tx) => {
    // 1. Detach all categories from their source labels
    for (const { categoryId, fromLabelId } of moves) {
      await tx.categoryLabelCategory.delete({
        where: {
          labelId_categoryId: {
            labelId: fromLabelId,
            categoryId,
          },
        },
      });
    }

    // 2. Get current categories in target label
    const existingEntries = await tx.categoryLabelCategory.findMany({
      where: { labelId: toLabelId },
      orderBy: { order: "asc" },
    });

    const existingIds = existingEntries.map((e) => e.categoryId);
    const moveIds = moves.map((m) => m.categoryId);

    // 3. Calculate insertion position
    let insertIndex: number;
    if (targetCategoryId === null) {
      // Append to end
      insertIndex = existingIds.length;
    } else {
      const targetIndex = existingIds.indexOf(targetCategoryId);
      if (targetIndex === -1) {
        // Target not found, append to end
        insertIndex = existingIds.length;
      } else {
        insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
      }
    }

    // 4. Build new order: existing categories with moved ones inserted at position
    const newOrder = [...existingIds];
    newOrder.splice(insertIndex, 0, ...moveIds);

    // 5. Create entries for moved categories and update all orders
    for (const categoryId of moveIds) {
      await tx.categoryLabelCategory.create({
        data: {
          labelId: toLabelId,
          categoryId,
          order: 0, // Will be updated below
        },
      });
    }

    // 6. Update all category orders in target label
    for (let i = 0; i < newOrder.length; i++) {
      await tx.categoryLabelCategory.update({
        where: {
          labelId_categoryId: {
            labelId: toLabelId,
            categoryId: newOrder[i],
          },
        },
        data: { order: i },
      });
    }
  });

  return { ok: true };
}
