/*
  Warnings:

  - Made the column `refundedAmountInCents` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "refundedAmountInCents" SET NOT NULL,
ALTER COLUMN "refundedAmountInCents" SET DEFAULT 0;
