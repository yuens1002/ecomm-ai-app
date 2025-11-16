-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "PurchaseOption" ADD COLUMN     "billingInterval" "BillingInterval",
ADD COLUMN     "billingIntervalCount" INTEGER;
