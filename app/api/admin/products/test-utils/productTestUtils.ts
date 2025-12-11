import { ProductType, RoastLevel } from "@prisma/client";

export const baseProductPayload = {
  name: "Test Product",
  slug: "test-product",
  description: "Desc",
  isOrganic: false,
  isFeatured: false,
  categoryIds: ["default-cat"],
  imageUrl: "https://placehold.co/600x400.png",
} as const;

export const coffeeExtras = {
  productType: ProductType.COFFEE,
  roastLevel: RoastLevel.MEDIUM,
  origin: ["Ethiopia"],
  tastingNotes: ["Citrus"],
  variety: "Heirloom",
  altitude: "1900m",
} as const;

export const coffeeRequiredFields = ["roastLevel", "origin"] as const;

export const buildProductPayload = (
  type: ProductType,
  overrides: Record<string, unknown> = {}
) => {
  const typeFields =
    type === ProductType.COFFEE
      ? coffeeExtras
      : { productType: ProductType.MERCH };
  return { ...baseProductPayload, ...typeFields, ...overrides };
};
