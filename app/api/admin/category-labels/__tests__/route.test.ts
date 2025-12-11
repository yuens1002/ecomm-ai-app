/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();

type PrismaMock = {
  categoryLabel: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  categoryLabelCategory: {
    deleteMany: jest.Mock;
    updateMany: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
    findMany: jest.Mock;
  };
  $transaction: jest.Mock<Promise<unknown>, [unknown]>;
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => {
  const createMock = jest.fn();
  const findUniqueMock = jest.fn();
  const findFirstMock = jest.fn();
  const findManyMock = jest.fn();
  const updateManyMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const deleteManyMock = jest.fn();
  const upsertMock = jest.fn();
  const categoryLabelCategoryUpdateMock = jest.fn();
  const categoryLabelCategoryFindManyMock = jest.fn();

  const prismaMock: PrismaMock = {
    categoryLabel: {
      create: createMock,
      findUnique: findUniqueMock,
      findFirst: findFirstMock,
      findMany: findManyMock,
      updateMany: updateManyMock,
      update: updateMock,
      delete: deleteMock,
    },
    categoryLabelCategory: {
      deleteMany: deleteManyMock,
      updateMany: categoryLabelCategoryUpdateMock,
      update: categoryLabelCategoryUpdateMock,
      upsert: upsertMock,
      delete: deleteMock,
      findMany: categoryLabelCategoryFindManyMock,
    },
    $transaction: jest.fn(async (arg: unknown): Promise<unknown> => {
      if (typeof arg === "function") {
        return arg(prismaMock as never);
      }
      if (Array.isArray(arg)) {
        for (const op of arg) {
          await op;
        }
        return undefined;
      }
      return undefined;
    }),
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: {
      prismaMock,
      createMock,
      findUniqueMock,
      findFirstMock,
      findManyMock,
      updateManyMock,
      updateMock,
      deleteMock,
      deleteManyMock,
      upsertMock,
      categoryLabelCategoryUpdateMock,
      categoryLabelCategoryFindManyMock,
    },
  };
});

// Extract mocks after the factory has run
const {
  prismaMock,
  createMock,
  findUniqueMock,
  findFirstMock,
  findManyMock,
  updateManyMock,
  updateMock,
  deleteMock,
  deleteManyMock,
  upsertMock,
  categoryLabelCategoryUpdateMock,
  categoryLabelCategoryFindManyMock,
} = (jest.requireMock("@/lib/prisma").__mocks as {
  prismaMock: PrismaMock;
  createMock: jest.Mock;
  findUniqueMock: jest.Mock;
  findFirstMock: jest.Mock;
  findManyMock: jest.Mock;
  updateManyMock: jest.Mock;
  updateMock: jest.Mock;
  deleteMock: jest.Mock;
  deleteManyMock: jest.Mock;
  upsertMock: jest.Mock;
  categoryLabelCategoryUpdateMock: jest.Mock;
  categoryLabelCategoryFindManyMock: jest.Mock;
});

let GET: typeof import("../route").GET;
let createLabel: typeof import("../route").POST;
let deleteLabel: typeof import("../[id]/route").DELETE;
let PUT: typeof import("../[id]/route").PUT;
let reorderLabels: typeof import("../reorder/route").POST;
let attachCategory: typeof import("../[id]/attach/route").POST;
let detachCategory: typeof import("../[id]/detach/route").POST;
let reorderCategories: typeof import("../[id]/reorder-categories/route").POST;
let autoSortCategories: typeof import("../[id]/auto-sort/route").POST;

const jsonRequest = (url: string, method: string, body?: unknown) =>
  new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("Category label routes", () => {
  beforeAll(async () => {
    const base = await import("../route");
    const byId = await import("../[id]/route");
    const reorder = await import("../reorder/route");
    const attach = await import("../[id]/attach/route");
    const detach = await import("../[id]/detach/route");
    const reorderCats = await import("../[id]/reorder-categories/route");
    const autoSort = await import("../[id]/auto-sort/route");

    GET = base.GET;
    createLabel = base.POST;
    deleteLabel = byId.DELETE;
    PUT = byId.PUT;
    reorderLabels = reorder.POST;
    attachCategory = attach.POST;
    detachCategory = detach.POST;
    reorderCategories = reorderCats.POST;
    autoSortCategories = autoSort.POST;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    // Restore $transaction behavior after reset
    (prismaMock as { $transaction: jest.Mock }).$transaction.mockImplementation(
      async (arg: unknown) => {
        if (typeof arg === "function") {
          return arg(prismaMock as never);
        }
        if (Array.isArray(arg)) {
          for (const op of arg) {
            await op;
          }
          return;
        }
      }
    );
  });

  it("creates a label with required fields and optional icon", async () => {
    findUniqueMock.mockResolvedValue(null);
    updateManyMock.mockResolvedValue({});
    createMock.mockResolvedValue({
      id: "lbl_1",
      name: "Collections",
      icon: "Beans",
      order: 0,
    });

    const req = jsonRequest(
      "http://localhost/api/admin/category-labels",
      "POST",
      {
        name: "Collections",
        icon: "Beans",
      }
    );

    const res = await createLabel(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Collections", icon: "Beans" }),
      })
    );
    expect(json.label.id).toBe("lbl_1");
  });

  it("rejects duplicate label names", async () => {
    findUniqueMock.mockResolvedValue({ id: "existing" });

    const res = await createLabel(
      jsonRequest("http://localhost/api/admin/category-labels", "POST", {
        name: "Collections",
      })
    );

    expect(res.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns labels with categories via GET", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "lbl_1",
        name: "Collections",
        icon: null,
        order: 0,
        categories: [
          {
            order: 0,
            category: {
              id: "cat_1",
              name: "Blends",
              slug: "blends",
              order: 10,
            },
          },
        ],
      },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.labels[0]).toMatchObject({
      name: "Collections",
      categories: [{ name: "Blends" }],
    });
  });

  it("updates name and icon, enforcing uniqueness", async () => {
    findFirstMock.mockResolvedValue(null);
    updateMock.mockResolvedValue({
      id: "lbl_1",
      name: "Origins",
      icon: "Globe",
    });

    const res = await PUT(
      jsonRequest("http://localhost/api/admin/category-labels/lbl_1", "PUT", {
        name: "Origins",
        icon: "Globe",
      }),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lbl_1" },
        data: expect.objectContaining({ name: "Origins", icon: "Globe" }),
      })
    );
  });

  it("deletes a label and detaches its categories", async () => {
    deleteManyMock.mockResolvedValue({});
    deleteMock.mockResolvedValue({});

    const res = await deleteLabel(
      new NextRequest("http://localhost/api/admin/category-labels/lbl_1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ id: "lbl_1" }),
      }
    );

    expect(res.status).toBe(200);
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { labelId: "lbl_1" },
    });
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "lbl_1" } });
  });

  it("reorders labels based on provided ids", async () => {
    updateMock.mockResolvedValue({});

    const res = await reorderLabels(
      jsonRequest(
        "http://localhost/api/admin/category-labels/reorder",
        "POST",
        { labelIds: ["a", "b", "c"] }
      )
    );

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "a" }, data: { order: 0 } })
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "c" }, data: { order: 2 } })
    );
  });

  it("attaches a category to the label and shifts existing order", async () => {
    categoryLabelCategoryUpdateMock.mockResolvedValue({});
    upsertMock.mockResolvedValue({});

    const res = await attachCategory(
      jsonRequest(
        "http://localhost/api/admin/category-labels/lbl_1/attach",
        "POST",
        { categoryId: "cat_1" }
      ),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    expect(res.status).toBe(200);
    expect(categoryLabelCategoryUpdateMock).toHaveBeenCalledWith({
      where: { labelId: "lbl_1" },
      data: { order: { increment: 1 } },
    });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_1" },
        },
        create: expect.objectContaining({ order: 0 }),
        update: expect.objectContaining({ order: 0 }),
      })
    );
  });

  it("detaches a category from a label", async () => {
    deleteMock.mockResolvedValue({});

    const res = await detachCategory(
      jsonRequest(
        "http://localhost/api/admin/category-labels/lbl_1/detach",
        "POST",
        { categoryId: "cat_1" }
      ),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({
      where: { labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_1" } },
    });
  });

  it("reorders categories inside a label", async () => {
    categoryLabelCategoryUpdateMock.mockResolvedValue({});

    const res = await reorderCategories(
      jsonRequest(
        "http://localhost/api/admin/category-labels/lbl_1/reorder-categories",
        "POST",
        {
          categoryIds: ["cat_a", "cat_b"],
        }
      ),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    expect(res.status).toBe(200);
    expect(categoryLabelCategoryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_a" },
        },
        data: { order: 0 },
      })
    );
    expect(categoryLabelCategoryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_b" },
        },
        data: { order: 1 },
      })
    );
  });

  it("allows the same category to be attached to multiple labels", async () => {
    // First attach on lbl_1
    categoryLabelCategoryUpdateMock.mockResolvedValue({});
    upsertMock.mockResolvedValue({});

    await attachCategory(
      jsonRequest(
        "http://localhost/api/admin/category-labels/lbl_1/attach",
        "POST",
        { categoryId: "cat_shared" }
      ),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    // Attach same category to lbl_2 — no uniqueness constraint across labels
    await attachCategory(
      jsonRequest(
        "http://localhost/api/admin/category-labels/lbl_2/attach",
        "POST",
        { categoryId: "cat_shared" }
      ),
      { params: Promise.resolve({ id: "lbl_2" }) }
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_shared" },
        },
      })
    );
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_2", categoryId: "cat_shared" },
        },
      })
    );
  });

  it("auto-sorts categories alphabetically", async () => {
    categoryLabelCategoryFindManyMock.mockResolvedValue([
      { categoryId: "cat_b", category: { name: "Zebra" } },
      { categoryId: "cat_a", category: { name: "Apple" } },
    ]);
    categoryLabelCategoryUpdateMock.mockResolvedValue({});

    const res = await autoSortCategories(
      new NextRequest(
        "http://localhost/api/admin/category-labels/lbl_1/auto-sort",
        { method: "POST" }
      ),
      { params: Promise.resolve({ id: "lbl_1" }) }
    );

    expect(res.status).toBe(200);
    expect(categoryLabelCategoryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_a" },
        },
        data: { order: 0 },
      })
    );
    expect(categoryLabelCategoryUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          labelId_categoryId: { labelId: "lbl_1", categoryId: "cat_b" },
        },
        data: { order: 1 },
      })
    );
  });
});
