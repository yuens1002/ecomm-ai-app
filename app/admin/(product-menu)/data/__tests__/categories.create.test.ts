/** @jest-environment node */

import type { Prisma } from "@prisma/client";

type PrismaMock = {
  category: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
  };
  categoryLabelCategory: {
    createMany: jest.Mock;
  };
};

jest.mock("@/lib/prisma", () => {
  const prismaMock: PrismaMock = {
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    categoryLabelCategory: {
      createMany: jest.fn(),
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

describe("product-menu createCategoryWithLabels", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("attaches labelIds in deterministic order (idx)", async () => {
    prismaMock.category.findFirst.mockResolvedValueOnce({ order: 41 });
    prismaMock.category.create.mockResolvedValueOnce({ id: "cat_1" });

    prismaMock.category.findUnique.mockResolvedValueOnce({
      id: "cat_1",
      name: "Espresso",
      slug: "espresso",
      order: 42,
      isVisible: true,
      _count: { products: 0 },
      labels: [],
    });

    const { createCategoryWithLabels } = await import("@/app/admin/(product-menu)/data/categories");

    await createCategoryWithLabels({
      name: "Espresso",
      slug: "espresso",
      labelIds: ["lbl_a", "lbl_b", "lbl_c"],
    });

    expect(prismaMock.categoryLabelCategory.createMany).toHaveBeenCalledWith({
      data: [
        { labelId: "lbl_a", categoryId: "cat_1", order: 0 },
        { labelId: "lbl_b", categoryId: "cat_1", order: 1 },
        { labelId: "lbl_c", categoryId: "cat_1", order: 2 },
      ],
    } satisfies Prisma.CategoryLabelCategoryCreateManyArgs);
  });
});
