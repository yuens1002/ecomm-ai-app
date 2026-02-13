-- Migrate ProductImage data to VariantImage (on first variant per product)
-- This moves product-level images to the first variant of each product.
INSERT INTO "VariantImage" ("id", "url", "altText", "order", "variantId")
SELECT
  gen_random_uuid()::text,
  pi."url",
  pi."altText",
  pi."order",
  first_variant."id"
FROM "ProductImage" pi
INNER JOIN LATERAL (
  SELECT pv."id"
  FROM "ProductVariant" pv
  WHERE pv."productId" = pi."productId"
  ORDER BY pv."order" ASC
  LIMIT 1
) first_variant ON true;

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropTable
DROP TABLE "ProductImage";
