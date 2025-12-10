/*
  Warnings:

  - You are about to drop the column `labelSettingId` on the `Category` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_labelSettingId_fkey";

-- DropIndex
DROP INDEX "Category_labelSettingId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "labelSettingId";

-- CreateTable
CREATE TABLE "CategoryLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryLabelCategory" (
    "labelId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryLabelCategory_pkey" PRIMARY KEY ("labelId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryLabel_name_key" ON "CategoryLabel"("name");

-- CreateIndex
CREATE INDEX "CategoryLabelCategory_categoryId_idx" ON "CategoryLabelCategory"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryLabelCategory_labelId_order_idx" ON "CategoryLabelCategory"("labelId", "order");

-- AddForeignKey
ALTER TABLE "CategoryLabelCategory" ADD CONSTRAINT "CategoryLabelCategory_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "CategoryLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryLabelCategory" ADD CONSTRAINT "CategoryLabelCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
