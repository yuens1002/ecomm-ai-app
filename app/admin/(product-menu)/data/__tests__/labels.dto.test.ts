/** @jest-environment node */

import type { Prisma } from "@prisma/client";

type PrismaMock = {
  categoryLabel: {
    findMany: jest.Mock;
  };
};

jest.mock("@/lib/prisma", () => {
  const prismaMock: PrismaMock = {
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

describe("product-menu labels DTO", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("maps categoryLabel.findMany payload to MenuLabelDto", async () => {
    // Deliberately make `category.order` differ from the label-category assignment order.
    prismaMock.categoryLabel.findMany.mockResolvedValueOnce([
      {
        id: "lbl_1",
        name: "Collections",
        icon: "Beans",
        order: 2,
        isVisible: true,
        autoOrder: false,
        categories: [
          {
            order: 7,
            category: {
              id: "cat_1",
              name: "Espresso",
              slug: "espresso",
              order: 123,
            },
          },
        ],
      },
    ]);

    const { listCategoryLabelsWithCategories } = await import(
      "@/app/admin/(product-menu)/data/labels"
    );

    const labels = await listCategoryLabelsWithCategories();

    expect(prismaMock.categoryLabel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: "asc" },
        include: expect.objectContaining({
          categories: expect.objectContaining({
            orderBy: { order: "asc" },
            include: { category: true },
          }),
        }),
      }) satisfies Prisma.CategoryLabelFindManyArgs
    );

    expect(labels).toEqual([
      {
        id: "lbl_1",
        name: "Collections",
        icon: "Beans",
        order: 2,
        isVisible: true,
        autoOrder: false,
        categories: [
          {
            id: "cat_1",
            name: "Espresso",
            slug: "espresso",
            order: 7,
          },
        ],
      },
    ]);
  });

  it("preserves null icon in DTO", async () => {
    prismaMock.categoryLabel.findMany.mockResolvedValueOnce([
      {
        id: "lbl_1",
        name: "Origins",
        icon: null,
        order: 0,
        isVisible: true,
        autoOrder: true,
        categories: [],
      },
    ]);

    const { listCategoryLabelsWithCategories } = await import(
      "@/app/admin/(product-menu)/data/labels"
    );

    const labels = await listCategoryLabelsWithCategories();
    expect(labels[0]?.icon).toBeNull();
  });
});
