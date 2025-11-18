/*
  Warnings:

  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';

-- DropIndex
DROP INDEX "Order_stripeSessionId_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSubscriptionId_key" ON "Order"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Order_stripeSubscriptionId_idx" ON "Order"("stripeSubscriptionId");
