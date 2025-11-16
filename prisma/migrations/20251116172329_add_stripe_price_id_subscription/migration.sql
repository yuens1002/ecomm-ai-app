-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripePriceId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_stripePriceId_idx" ON "Subscription"("stripePriceId");
