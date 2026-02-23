-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveredAt" TIMESTAMP(3);
