-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('GENERIC', 'ABOUT', 'CAFE', 'FAQ');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "type" "PageType" NOT NULL DEFAULT 'GENERIC';

-- CreateIndex
CREATE INDEX "Page_type_idx" ON "Page"("type");
