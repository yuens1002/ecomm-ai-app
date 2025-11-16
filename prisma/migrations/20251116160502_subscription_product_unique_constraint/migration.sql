/*
  Warnings:

  - A unique constraint covering the columns `[userId,stripeProductId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Made the column `stripeProductId` on table `Subscription` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "stripeProductId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_stripeProductId_key" ON "Subscription"("userId", "stripeProductId");
