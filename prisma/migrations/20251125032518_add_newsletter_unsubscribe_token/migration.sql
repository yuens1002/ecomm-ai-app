/*
  Warnings:

  - A unique constraint covering the columns `[unsubscribeToken]` on the table `NewsletterSubscriber` will be added. If there are existing duplicate values, this will fail.
  - The required column `unsubscribeToken` was added to the `NewsletterSubscriber` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN     "unsubscribeToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_unsubscribeToken_idx" ON "NewsletterSubscriber"("unsubscribeToken");
