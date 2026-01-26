/** @jest-environment node */

import type { Prisma } from "@prisma/client";

type PrismaMock = {
  category: {
    findMany: jest.Mock;
  };
  categoryLabel: {
    findMany: jest.Mock;
  };
};

jest.mock("@/lib/prisma", () => {
  const prismaMock: PrismaMock = {
    category: {
      findMany: jest.fn(),
    },
    categoryLabel: {
      findMany: jest.fn(),
    },
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: { prismaMock },
  };
});

const { prismaMock } = jest.requireMock("@/lib/prisma").__mocks as {
  prismaMock: PrismaMock;
};

describe("product-menu categories DTO", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("lists categories with label DTO mapping (label fields + assignment order)", async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([
      {
        id: "cat_1",
        name: "Espresso",
        slug: "espresso",
        order: 10,
        isVisible: true,
        _count: { products: 3 },
        labels: [
          {
            order: 5,
            label: {
              id: "lbl_1",
              name: "Collections",
              icon: "Beans",
              order: 999,
              isVisible: true,
              autoOrder: false,
            },
          },
        ],
      },
    ]);

    prismaMock.categoryLabel.findMany.mockResolvedValueOnce([
      { id: "lbl_1", name: "Collections", icon: "Beans", order: 0 },
    ]);

    const { listCategoriesAndLabels } = await import("@/app/admin/product-menu/data/categories");

    const result = await listCategoriesAndLabels("name-asc");

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ name: "asc" }],
        include: expect.objectContaining({
          _count: expect.any(Object),
          labels: expect.objectContaining({
            orderBy: { order: "asc" },
            include: { label: true },
          }),
        }),
      }) satisfies Prisma.CategoryFindManyArgs
    );

    expect(result.categories).toEqual([
      expect.objectContaining({
        id: "cat_1",
        name: "Espresso",
        slug: "espresso",
        order: 10,
        _count: { products: 3 },
        labels: [
          {
            id: "lbl_1",
            name: "Collections",
            icon: "Beans",
            order: 5,
          },
        ],
      }),
    ]);

    expect(result.labels).toEqual([{ id: "lbl_1", name: "Collections", icon: "Beans", order: 0 }]);
  });

  it("uses stable newest-first order when requested", async () => {
    prismaMock.category.findMany.mockResolvedValueOnce([]);
    prismaMock.categoryLabel.findMany.mockResolvedValueOnce([]);

    const { listCategoriesAndLabels } = await import("@/app/admin/product-menu/data/categories");

    await listCategoriesAndLabels("menu-builder-newest-first");

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ order: "desc" }, { id: "desc" }],
      }) satisfies Prisma.CategoryFindManyArgs
    );
  });
});
