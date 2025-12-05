-- AlterEnum
ALTER TYPE "PageType" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "Page" ADD COLUMN "url" TEXT;
