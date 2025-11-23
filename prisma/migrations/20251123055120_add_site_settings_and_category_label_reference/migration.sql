/*
  Warnings:

  - You are about to drop the column `label` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `discountMessage` on the `PurchaseOption` table. All the data in the column will be lost.
  - Added the required column `labelSettingId` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "label",
ADD COLUMN     "isUsingDefaultLabel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "labelSettingId" TEXT NOT NULL,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseOption" DROP COLUMN "discountMessage";

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_key_key" ON "SiteSettings"("key");

-- CreateIndex
CREATE INDEX "Category_labelSettingId_idx" ON "Category"("labelSettingId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_labelSettingId_fkey" FOREIGN KEY ("labelSettingId") REFERENCES "SiteSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
