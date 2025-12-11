/*
  Warnings:

  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.
  - Made the column `weight` on table `ProductVariant` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('METRIC', 'IMPERIAL');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "weight";

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "weight" SET NOT NULL;
