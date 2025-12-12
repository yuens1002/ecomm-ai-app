/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();

type PrismaMock = {
  product: {
    findUnique: jest.Mock;
  };
  addOnLink: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => {
  const findUniqueMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const createMock = jest.fn();

  const prismaMock: PrismaMock = {
    product: {
      findUnique: findUniqueMock,
    },
    addOnLink: {
      findMany: findManyMock,
      findFirst: findFirstMock,
      create: createMock,
    },
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: {
      prismaMock,
      findUniqueMock,
      findManyMock,
      findFirstMock,
      createMock,
    },
  };
});

// Extract mocks after the factory has run
const { prismaMock, findUniqueMock, findManyMock, findFirstMock, createMock } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/prisma").__mocks;

// Import the route handlers after mocks are set up
import { GET, POST } from "../route";

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

  it("fetches add-ons for a product", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });

    const mockAddOns = [
      {
        id: "addon-1",
        primaryProductId: "prod-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
        discountedPriceInCents: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        addOnProduct: {
          id: "prod-2",
          name: "Grinder",
          type: "MERCHANDISE",
        },
        addOnVariant: null,
      },
      {
        id: "addon-2",
        primaryProductId: "prod-1",
        addOnProductId: "prod-3",
        addOnVariantId: "var-1",
        discountedPriceInCents: 1500,
        createdAt: "2025-01-02T00:00:00.000Z",
        addOnProduct: {
          id: "prod-3",
          name: "Colombia Geisha",
          type: "COFFEE",
        },
        addOnVariant: {
          id: "var-1",
          name: "12oz Bag",
          weight: 340,
          stockQuantity: 10,
          purchaseOptions: [
            {
              id: "opt-1",
              priceInCents: 2000,
              type: "ONE_TIME",
            },
          ],
        },
      },
    ];

    findManyMock.mockResolvedValue(mockAddOns);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons"
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.addOns).toEqual(mockAddOns);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { primaryProductId: "prod-1" },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              select: {
                id: true,
                priceInCents: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns empty array when no add-ons exist", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findManyMock.mockResolvedValue([]);

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
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when primary product not found", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValueOnce(null); // primary product not found

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
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
    findUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary Product" }) // primary product exists
      .mockResolvedValueOnce(null); // add-on product not found

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
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
    findUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary Product" })
      .mockResolvedValueOnce({ id: "prod-2", name: "Add-on Product" });
    findFirstMock.mockResolvedValue({
      id: "existing-addon-1",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
      addOnVariantId: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("This add-on link already exists");

    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        primaryProductId: "prod-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
      },
    });
  });

  it("creates add-on link without variant or discount", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary Product" })
      .mockResolvedValueOnce({ id: "prod-2", name: "Add-on Product" });
    findFirstMock.mockResolvedValue(null); // no duplicate

    const mockCreatedAddOn = {
      id: "addon-new",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
      addOnVariantId: null,
      discountedPriceInCents: null,
      createdAt: "2025-12-12T00:00:00.000Z",
      addOnProduct: {
        id: "prod-2",
        name: "Grinder",
        type: "MERCHANDISE",
      },
      addOnVariant: null,
    };

    createMock.mockResolvedValue(mockCreatedAddOn);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.addOn).toEqual(mockCreatedAddOn);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        primaryProductId: "prod-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
        discountedPriceInCents: null,
      },
      include: {
        addOnProduct: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        addOnVariant: {
          select: {
            id: true,
            name: true,
            weight: true,
            stockQuantity: true,
            purchaseOptions: {
              select: {
                id: true,
                priceInCents: true,
                type: true,
              },
            },
          },
        },
      },
    });
  });

  it("creates add-on link with variant and discounted price", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary Product" })
      .mockResolvedValueOnce({ id: "prod-3", name: "Coffee Product" });
    findFirstMock.mockResolvedValue(null);

    const mockCreatedAddOn = {
      id: "addon-new",
      primaryProductId: "prod-1",
      addOnProductId: "prod-3",
      addOnVariantId: "var-1",
      discountedPriceInCents: 1500,
      createdAt: "2025-12-12T00:00:00.000Z",
      addOnProduct: {
        id: "prod-3",
        name: "Colombia Geisha",
        type: "COFFEE",
      },
      addOnVariant: {
        id: "var-1",
        name: "12oz Bag",
        weight: 340,
        stockQuantity: 10,
        purchaseOptions: [
          {
            id: "opt-1",
            priceInCents: 2000,
            type: "ONE_TIME",
          },
        ],
      },
    };

    createMock.mockResolvedValue(mockCreatedAddOn);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-3",
          addOnVariantId: "var-1",
          discountedPriceInCents: 1500,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.addOn.addOnVariantId).toBe("var-1");
    expect(json.addOn.discountedPriceInCents).toBe(1500);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        primaryProductId: "prod-1",
        addOnProductId: "prod-3",
        addOnVariantId: "var-1",
        discountedPriceInCents: 1500,
      },
      include: expect.any(Object),
    });
  });

  it("creates add-on link with null variant when addOnVariantId is null", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock
      .mockResolvedValueOnce({ id: "prod-1", name: "Primary Product" })
      .mockResolvedValueOnce({ id: "prod-2", name: "Add-on Product" });
    findFirstMock.mockResolvedValue(null);

    const mockCreatedAddOn = {
      id: "addon-new",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
      addOnVariantId: null,
      discountedPriceInCents: null,
      createdAt: "2025-12-12T00:00:00.000Z",
      addOnProduct: {
        id: "prod-2",
        name: "Grinder",
        type: "MERCHANDISE",
      },
      addOnVariant: null,
    };

    createMock.mockResolvedValue(mockCreatedAddOn);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
          addOnVariantId: null,
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.addOn.addOnVariantId).toBeNull();

    expect(createMock).toHaveBeenCalledWith({
      data: {
        primaryProductId: "prod-1",
        addOnProductId: "prod-2",
        addOnVariantId: null,
        discountedPriceInCents: null,
      },
      include: expect.any(Object),
    });
  });

  it("handles database errors gracefully", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons",
      {
        method: "POST",
        body: JSON.stringify({
          addOnProductId: "prod-2",
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "prod-1" }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to create add-on");
  });
});
