-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmountInCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoCode" TEXT;
