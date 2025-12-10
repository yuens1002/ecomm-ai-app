-- Rename product and variant weight columns to align with Prisma model field `weight`
ALTER TABLE "Product" RENAME COLUMN "weightInGrams" TO "weight";
ALTER TABLE "ProductVariant" RENAME COLUMN "weightInGrams" TO "weight";
