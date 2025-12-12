/** @jest-environment node */

import { NextRequest } from "next/server";

const requireAdminApiMock = jest.fn();

type PrismaMock = {
  addOnLink: {
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => {
  const findUniqueMock = jest.fn();
  const deleteMock = jest.fn();

  const prismaMock: PrismaMock = {
    addOnLink: {
      findUnique: findUniqueMock,
      delete: deleteMock,
    },
  };

  return {
    prisma: prismaMock,
    __esModule: true,
    __mocks: {
      prismaMock,
      findUniqueMock,
      deleteMock,
    },
  };
});

// Extract mocks after the factory has run
const { prismaMock: _prismaMock, findUniqueMock, deleteMock } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/prisma").__mocks;

// Import the route handlers after mocks are set up
import { DELETE } from "../route";

describe("DELETE /api/admin/products/[id]/addons/[addOnId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authorized", async () => {
    requireAdminApiMock.mockResolvedValue({
      authorized: false,
      error: "Unauthorized",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when add-on not found", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("Add-on not found");

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "addon-1" },
    });
  });

  it("returns 403 when add-on does not belong to the product", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValue({
      id: "addon-1",
      primaryProductId: "prod-2", // different product
      addOnProductId: "prod-3",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("Add-on does not belong to this product");
  });

  it("successfully deletes an add-on", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValue({
      id: "addon-1",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
    });
    deleteMock.mockResolvedValue({
      id: "addon-1",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "addon-1" },
    });
  });

  it("successfully deletes an add-on with variant", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValue({
      id: "addon-2",
      primaryProductId: "prod-1",
      addOnProductId: "prod-3",
      addOnVariantId: "var-1",
      discountedPriceInCents: 1500,
    });
    deleteMock.mockResolvedValue({
      id: "addon-2",
      primaryProductId: "prod-1",
      addOnProductId: "prod-3",
      addOnVariantId: "var-1",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-2",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-2" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: "addon-2" },
    });
    expect(deleteMock).toHaveBeenCalledWith({
      where: { id: "addon-2" },
    });
  });

  it("handles database errors gracefully", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockRejectedValue(
      new Error("Database connection failed")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to delete add-on");
  });

  it("handles delete operation failure", async () => {
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findUniqueMock.mockResolvedValue({
      id: "addon-1",
      primaryProductId: "prod-1",
      addOnProductId: "prod-2",
    });
    deleteMock.mockRejectedValue(new Error("Delete failed"));

    const request = new NextRequest(
      "http://localhost:3000/api/admin/products/prod-1/addons/addon-1",
      {
        method: "DELETE",
      }
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "prod-1", addOnId: "addon-1" }),
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Failed to delete add-on");
  });
});
