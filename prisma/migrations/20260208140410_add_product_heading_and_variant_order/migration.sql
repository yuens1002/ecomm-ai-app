-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "heading" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
