/*
  Warnings:

  - You are about to drop the `ProductAddOn` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('COFFEE', 'MERCH', 'BOTH');

-- DropForeignKey
ALTER TABLE "ProductAddOn" DROP CONSTRAINT "ProductAddOn_addOnProductId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAddOn" DROP CONSTRAINT "ProductAddOn_addOnVariantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAddOn" DROP CONSTRAINT "ProductAddOn_productId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "kind" "CategoryKind" NOT NULL DEFAULT 'COFFEE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "sku" TEXT;

-- DropTable
DROP TABLE "ProductAddOn";

-- CreateTable
CREATE TABLE "AddOnLink" (
    "id" TEXT NOT NULL,
    "primaryProductId" TEXT NOT NULL,
    "primaryVariantId" TEXT,
    "addOnProductId" TEXT NOT NULL,
    "addOnVariantId" TEXT,
    "discountedPriceInCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOnLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AddOnLink_primaryProductId_idx" ON "AddOnLink"("primaryProductId");

-- CreateIndex
CREATE INDEX "AddOnLink_primaryVariantId_idx" ON "AddOnLink"("primaryVariantId");

-- CreateIndex
CREATE INDEX "AddOnLink_addOnProductId_idx" ON "AddOnLink"("addOnProductId");

-- CreateIndex
CREATE INDEX "AddOnLink_addOnVariantId_idx" ON "AddOnLink"("addOnVariantId");

-- AddForeignKey
ALTER TABLE "AddOnLink" ADD CONSTRAINT "AddOnLink_primaryProductId_fkey" FOREIGN KEY ("primaryProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnLink" ADD CONSTRAINT "AddOnLink_primaryVariantId_fkey" FOREIGN KEY ("primaryVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnLink" ADD CONSTRAINT "AddOnLink_addOnProductId_fkey" FOREIGN KEY ("addOnProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOnLink" ADD CONSTRAINT "AddOnLink_addOnVariantId_fkey" FOREIGN KEY ("addOnVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
