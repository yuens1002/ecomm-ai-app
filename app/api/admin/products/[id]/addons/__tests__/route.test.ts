/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();

type PrismaMock = {
  product: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  addOnLink: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => {
  const productFindUniqueMock = jest.fn();
  const productFindManyMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const createMock = jest.fn();
  const deleteManyMock = jest.fn();

  const prismaMock: PrismaMock = {
    product: {
      findUnique: productFindUniqueMock,
      findMany: productFindManyMock,
    },
    addOnLink: {
      findMany: findManyMock,
      findFirst: findFirstMock,
      create: createMock,
      deleteMany: deleteManyMock,
    },
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: {
      prismaMock,
      productFindUniqueMock,
      productFindManyMock,
      findManyMock,
      findFirstMock,
      createMock,
      deleteManyMock,
    },
  };
});

const {
  productFindUniqueMock,
  productFindManyMock,
  findManyMock,
  findFirstMock,
  createMock,
  deleteManyMock,
} =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/prisma").__mocks;

import { GET, POST, DELETE } from "../route";

describe("GET /api/admin/products/[id]/addons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns grouped add-ons with variants and selections", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const mockLinks = [
      {
        id: "link-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
        discountType: "PERCENTAGE",
        discountValue: 10,
      },
    ];

    const mockProducts = [
      {
        id: "prod-2",
        name: "Heritage Mug",
        type: "MERCH",
        variants: [
          {
            id: "var-1",
            name: "12oz",
            weight: 400,
            stockQuantity: 120,
            purchaseOptions: [
              { id: "po-1", priceInCents: 1800, salePriceInCents: null, type: "ONE_TIME" },
            ],
          },
        ],
      },
    ];

    findManyMock.mockResolvedValue(mockLinks);
    productFindManyMock.mockResolvedValue(mockProducts);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.addOns).toHaveLength(1);
    expect(json.addOns[0]).toEqual({
      addOnProduct: { id: "prod-2", name: "Heritage Mug", type: "MERCH" },
      variants: mockProducts[0].variants,
      selections: [
        {
          id: "link-1",
          addOnVariantId: null,
          discountType: "PERCENTAGE",
          discountValue: 10,
        },
      ],
    });
  });

  it("returns empty array when no add-ons exist", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findManyMock.mockResolvedValue([]);
    productFindManyMock.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.addOns).toEqual([]);
  });

  it("handles database errors gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findManyMock.mockRejectedValue(new Error("Database connection failed"));

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to fetch add-ons");

    consoleErrorSpy.mockRestore();
  });
});

describe("POST /api/admin/products/[id]/addons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when addOnProductId is missing", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it("returns 404 when primary product not found", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    productFindUniqueMock
      .mockResolvedValueOnce(null) // primary not found
      .mockResolvedValueOnce({ id: "prod-2", name: "Add-on", variants: [] });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Primary product not found");
  });

  it("returns 404 when add-on product not found", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    productFindUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary" })
      .mockResolvedValueOnce(null); // add-on not found

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Add-on product not found");
  });

  it("returns 400 when duplicate add-on link exists", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    productFindUniqueMock
      .mockResolvedValueOnce({ id: "prod-1" })
      .mockResolvedValueOnce({ id: "prod-2", name: "Add-on", type: "MERCH", variants: [] });
    findFirstMock.mockResolvedValue({ id: "existing" });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("This product is already added as an add-on");
  });

  it("creates add-on link with null variant and returns grouped response", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    productFindUniqueMock
      .mockResolvedValueOnce({ id: "prod-1" })
      .mockResolvedValueOnce({
        id: "prod-2",
        name: "Mug",
        type: "MERCH",
        variants: [
          {
            id: "var-1",
            name: "12oz",
            weight: 400,
            stockQuantity: 10,
            purchaseOptions: [
              { id: "po-1", priceInCents: 1800, salePriceInCents: null, type: "ONE_TIME" },
            ],
          },
        ],
      });
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: "addon-new",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
      addOnVariantId: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.addOn.addOnProduct).toEqual({
      id: "prod-2",
      name: "Mug",
      type: "MERCH",
    });
    expect(json.addOn.selections).toEqual([
      {
        id: "addon-new",
        addOnVariantId: null,
        discountType: null,
        discountValue: null,
      },
    ]);
    expect(json.addOn.variants).toHaveLength(1);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        primaryProductId: "prod-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
      },
    });
  });

  it("handles database errors gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    requireAdminApiMock.mockResolvedValue({ authorized: true });
    productFindUniqueMock.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({ addOnProductId: "prod-2" }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to create add-on");

    consoleErrorSpy.mockRestore();
  });
});

describe("DELETE /api/admin/products/[id]/addons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons?addOnProductId=prod-2",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when addOnProductId is missing", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("addOnProductId");
  });

  it("deletes all rows for the product combo", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    deleteManyMock.mockResolvedValue({ count: 2 });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons?addOnProductId=prod-2",
      { method: "DELETE" }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { primaryProductId: "prod-1", addOnProductId: "prod-2" },
    });
  });
});
