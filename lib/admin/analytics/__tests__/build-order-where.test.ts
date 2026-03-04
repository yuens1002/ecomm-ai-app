/** @jest-environment node */

import { buildOrderWhere, buildKpiOrderWhere } from "../filters/build-order-where";
import { FIXTURE_RANGE } from "./fixtures";

describe("buildOrderWhere", () => {
  const baseParams = { range: FIXTURE_RANGE };

  it("builds base where with date range [from, to)", () => {
    const where = buildOrderWhere(baseParams);
    expect(where.createdAt).toEqual({
      gte: FIXTURE_RANGE.from,
      lt: FIXTURE_RANGE.to,
    });
  });

  it("adds status filter when statuses provided", () => {
    const where = buildOrderWhere({
      ...baseParams,
      statuses: ["DELIVERED", "SHIPPED"],
    });
    expect(where.status).toEqual({ in: ["DELIVERED", "SHIPPED"] });
  });

  it("does not add status filter when statuses empty", () => {
    const where = buildOrderWhere({ ...baseParams, statuses: [] });
    expect(where.status).toBeUndefined();
  });

  it("adds promoCode filter", () => {
    const where = buildOrderWhere({ ...baseParams, promoCode: "SPRING10" });
    expect(where.promoCode).toBe("SPRING10");
  });

  it("adds location filter on shippingState", () => {
    const where = buildOrderWhere({ ...baseParams, location: "CA" });
    expect(where.shippingState).toBe("CA");
  });

  it("adds order type filter via items.some", () => {
    const where = buildOrderWhere({
      ...baseParams,
      orderType: "SUBSCRIPTION",
    });
    expect(where.items).toEqual({
      some: {
        purchaseOption: { type: "SUBSCRIPTION" },
      },
    });
  });

  it("skips items filter when orderType is ALL", () => {
    const where = buildOrderWhere({ ...baseParams, orderType: "ALL" });
    expect(where.items).toBeUndefined();
  });

  it("adds productId filter via items.some → variant", () => {
    const where = buildOrderWhere({ ...baseParams, productId: "prod-1" });
    expect(where.items).toEqual({
      some: {
        purchaseOption: {
          variant: { productId: "prod-1" },
        },
      },
    });
  });

  it("adds categoryId filter via items.some → variant → product → categories", () => {
    const where = buildOrderWhere({ ...baseParams, categoryId: "cat-1" });
    expect(where.items).toEqual({
      some: {
        purchaseOption: {
          variant: {
            product: {
              categories: { some: { categoryId: "cat-1" } },
            },
          },
        },
      },
    });
  });

  it("combines orderType + productId in same items filter", () => {
    const where = buildOrderWhere({
      ...baseParams,
      orderType: "ONE_TIME",
      productId: "prod-1",
    });
    expect(where.items).toEqual({
      some: {
        purchaseOption: {
          type: "ONE_TIME",
          variant: { productId: "prod-1" },
        },
      },
    });
  });
});

describe("buildKpiOrderWhere", () => {
  it("excludes CANCELLED and FAILED from status", () => {
    const where = buildKpiOrderWhere({ range: FIXTURE_RANGE });
    expect(where.status).toEqual({ notIn: ["CANCELLED", "FAILED"] });
  });

  it("preserves other filters alongside status exclusion", () => {
    const where = buildKpiOrderWhere({
      range: FIXTURE_RANGE,
      location: "CA",
      promoCode: "TEST",
    });
    expect(where.shippingState).toBe("CA");
    expect(where.promoCode).toBe("TEST");
    expect(where.status).toEqual({ notIn: ["CANCELLED", "FAILED"] });
  });
});
