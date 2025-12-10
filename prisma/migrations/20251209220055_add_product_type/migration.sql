-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('COFFEE', 'MERCH');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'COFFEE';
