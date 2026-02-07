/** @jest-environment node */

import { productCreateSchema } from "../product";

describe("product details validation", () => {
  const baseMerch = {
    name: "Test Mug",
    slug: "test-mug",
    productType: "MERCH" as const,
    roastLevel: null,
    origin: [],
    variety: null,
    altitude: null,
    tastingNotes: [],
  };

  const baseCoffee = {
    name: "Test Blend",
    slug: "test-blend",
    productType: "COFFEE" as const,
    roastLevel: "MEDIUM" as const,
    origin: ["Colombia"],
    tastingNotes: ["Chocolate"],
  };

  it("accepts merch product with valid details", () => {
    const result = productCreateSchema.safeParse({
      ...baseMerch,
      details: [
        { label: "Material", value: "Ceramic" },
        { label: "Capacity", value: "12 oz" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty("details");
      const details = (result.data as { details?: unknown[] }).details;
      expect(details).toHaveLength(2);
    }
  });

  it("accepts merch product with no details", () => {
    const result = productCreateSchema.safeParse(baseMerch);
    expect(result.success).toBe(true);
  });

  it("accepts merch product with null details", () => {
    const result = productCreateSchema.safeParse({
      ...baseMerch,
      details: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts merch product with empty details array", () => {
    const result = productCreateSchema.safeParse({
      ...baseMerch,
      details: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects details with empty label", () => {
    const result = productCreateSchema.safeParse({
      ...baseMerch,
      details: [{ label: "", value: "Ceramic" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects details with empty value", () => {
    const result = productCreateSchema.safeParse({
      ...baseMerch,
      details: [{ label: "Material", value: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts coffee product without details field", () => {
    const result = productCreateSchema.safeParse(baseCoffee);
    expect(result.success).toBe(true);
  });

  it("accepts coffee product with null details", () => {
    const result = productCreateSchema.safeParse({
      ...baseCoffee,
      details: null,
    });
    expect(result.success).toBe(true);
  });
});
