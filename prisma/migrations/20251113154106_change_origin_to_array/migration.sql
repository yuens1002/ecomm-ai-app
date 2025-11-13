-- CreateEnum
CREATE TYPE "RoastLevel" AS ENUM ('LIGHT', 'MEDIUM', 'DARK');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "origin" TEXT[],
ADD COLUMN     "roastLevel" "RoastLevel" NOT NULL DEFAULT 'MEDIUM';
