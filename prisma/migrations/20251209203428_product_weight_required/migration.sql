-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weightInGrams" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "weightInGrams" DROP NOT NULL;
