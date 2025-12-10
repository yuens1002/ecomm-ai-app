/** @jest-environment node */

import { NextRequest } from "next/server";
import { ProductType, RoastLevel } from "@prisma/client";
import {
  buildProductPayload,
  coffeeRequiredFields,
} from "../../__tests__/productTestUtils";
import { PUT } from "../route";

const requireAdminApiMock = jest.fn();
const updateProductMock = jest.fn();
const findImagesMock = jest.fn();
const updateImageMock = jest.fn();
const createImageMock = jest.fn();
const deleteCategoriesMock = jest.fn();
const createCategoriesMock = jest.fn();

type MockTx = {
  product: { update: typeof updateProductMock };
  productImage: {
    findMany: typeof findImagesMock;
    update: typeof updateImageMock;
    create: typeof createImageMock;
  };
  categoriesOnProducts: {
    deleteMany: typeof deleteCategoriesMock;
    createMany: typeof createCategoriesMock;
  };
};

jest.mock("@/lib/admin", () => ({
  requireAdminApi: () => requireAdminApiMock(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (cb: (tx: MockTx) => Promise<unknown>) =>
      cb({
        product: { update: updateProductMock },
        productImage: {
          findMany: findImagesMock,
          update: updateImageMock,
          create: createImageMock,
        },
        categoriesOnProducts: {
          deleteMany: deleteCategoriesMock,
          createMany: createCategoriesMock,
        },
      }),
  },
}));

describe("PUT /api/admin/products/[id]", () => {
  const params = { params: Promise.resolve({ id: "prod_1" }) } as const;

  beforeEach(() => {
    jest.resetAllMocks();
    requireAdminApiMock.mockResolvedValue({ authorized: true });
    findImagesMock.mockResolvedValue([]);
    updateProductMock.mockResolvedValue({ id: "prod_1" });
  });

  it("updates merch and strips coffee fields", async () => {
    const payload = buildProductPayload(ProductType.MERCH, {
      weight: 500,
      roastLevel: RoastLevel.DARK,
      origin: ["Ethiopia"],
      tastingNotes: ["Citrus"],
      variety: "Heirloom",
      altitude: "1900m",
    });

    const req = new NextRequest("http://localhost/api/admin/products/prod_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    expect(updateProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod_1" },
        data: expect.objectContaining({
          type: ProductType.MERCH,
          roastLevel: null,
          origin: [],
          tastingNotes: [],
          variety: null,
          altitude: null,
        }),
      })
    );
  });

  it("rejects coffee updates missing required fields", async () => {
    const payload = { ...buildProductPayload(ProductType.COFFEE) } as Record<
      string,
      unknown
    >;
    delete payload[coffeeRequiredFields[0]]; // remove roastLevel

    const req = new NextRequest("http://localhost/api/admin/products/prod_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(400);
    expect(updateProductMock).not.toHaveBeenCalled();
  });

  it("persists coffee fields on update", async () => {
    const payload = buildProductPayload(ProductType.COFFEE, {
      roastLevel: RoastLevel.DARK,
      origin: ["Kenya"],
      tastingNotes: ["Berry"],
      weight: 350,
    });

    const req = new NextRequest("http://localhost/api/admin/products/prod_1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    expect(updateProductMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roastLevel: RoastLevel.DARK,
          origin: ["Kenya"],
          tastingNotes: ["Berry"],
          weight: 350,
        }),
      })
    );
  });
});
