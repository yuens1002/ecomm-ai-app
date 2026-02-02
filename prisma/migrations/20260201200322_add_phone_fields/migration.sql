-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerPhone" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "recipientPhone" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;
