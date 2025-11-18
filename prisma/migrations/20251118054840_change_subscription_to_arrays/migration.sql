/*
  Warnings:

  - You are about to drop the column `productName` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeProductId` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_stripePriceId_idx";

-- DropIndex
DROP INDEX "Subscription_userId_stripeProductId_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "productName",
DROP COLUMN "quantity",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeProductId",
ADD COLUMN     "productNames" TEXT[],
ADD COLUMN     "quantities" INTEGER[],
ADD COLUMN     "stripePriceIds" TEXT[],
ADD COLUMN     "stripeProductIds" TEXT[];
