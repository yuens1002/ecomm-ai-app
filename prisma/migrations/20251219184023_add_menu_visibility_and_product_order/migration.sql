-- CreateEnum
CREATE TYPE "ProductMenuDraftStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'DISCARDED');

-- AlterTable
ALTER TABLE "CategoriesOnProducts" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInFooterMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInHeaderMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInMobileMenu" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "CategoryLabel" ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInFooterMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInHeaderMenu" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showInMobileMenu" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ProductMenuDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "ProductMenuDraftStatus" NOT NULL DEFAULT 'ACTIVE',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ProductMenuDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMenuDraft_userId_idx" ON "ProductMenuDraft"("userId");

-- CreateIndex
CREATE INDEX "ProductMenuDraft_status_idx" ON "ProductMenuDraft"("status");

-- CreateIndex
CREATE INDEX "ProductMenuDraft_expiresAt_idx" ON "ProductMenuDraft"("expiresAt");

-- CreateIndex
CREATE INDEX "CategoriesOnProducts_categoryId_order_idx" ON "CategoriesOnProducts"("categoryId", "order");

-- AddForeignKey
ALTER TABLE "ProductMenuDraft" ADD CONSTRAINT "ProductMenuDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
