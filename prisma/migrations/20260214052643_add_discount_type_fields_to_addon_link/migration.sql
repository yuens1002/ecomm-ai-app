-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "AddOnLink" ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" INTEGER;
